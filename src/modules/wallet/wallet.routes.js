const express = require("express");
const { validationResult } = require("express-validator");
const auth = require("../../middleware/auth.middleware");
const role = require("../../middleware/role.middleware");
const WalletEntry = require("../../database/models/WalletEntry");
const { withdrawRules } = require("./wallet.validation");
const { today, dateOnly } = require("../../utils/dates");
const { logAudit } = require("../../utils/audit");

/**
 * The escrow wallet — Phase 4 of the freelancer-style payout flow.
 *
 * `GET /` answers "how much have I earned, and how much of it can I move
 * right now". `POST /withdraw` writes a `debit` row waiting on an admin; the
 * two admin routes flip it to `Completed` or `Rejected`.
 *
 * Deliberately its own router rather than extra routes on `/api/payments`:
 * that router is read-only by design (`payments.routes.js` explains why a
 * client must never be able to POST or PUT a payment), and a withdrawal is a
 * ledger movement, not a payment record. The two never overlap — payments are
 * what the buyer spent, wallet entries are what the seller has been paid.
 *
 * Roles mirror `GET /api/orders/sales`: whoever can sell can be credited, and
 * therefore whoever can sell can withdraw.
 */
const SELLER_ROLES = ["farmer", "supplier", "admin"];

const fail = (req) => {
  const result = validationResult(req);
  if (result.isEmpty()) return null;
  const err = new Error(result.array().map((e) => e.msg).join("; "));
  err.statusCode = 400;
  return err;
};

const httpError = (message, statusCode) => {
  const err = new Error(message);
  err.statusCode = statusCode;
  return err;
};

function mapEntry(doc, extra = {}) {
  return {
    id: String(doc._id),
    kind: doc.kind,
    amountBdt: Number(doc.amountBdt) || 0,
    status: doc.status,
    label: doc.label || "",
    orderCode: doc.orderCode || "",
    approvedBy: doc.approvedBy || "",
    processedAt: doc.processedAt || "",
    date: dateOnly(doc.createdAt),
    ...extra,
  };
}

function mapOwner(doc) {
  const owner = doc.owner && doc.owner._id ? doc.owner : null;
  return {
    ownerName: (owner && owner.name) || "",
    ownerEmail: (owner && owner.email) || "",
  };
}

/**
 * Balance arithmetic, in one place because three numbers have to agree:
 *
 *   balance   = credits − *completed* debits. A `Rejected` debit subtracts
 *               nothing — the money returns to the balance the moment an
 *               admin refuses, which is what makes rejecting safe.
 *   pending   = debits still awaiting a decision. Not yet subtracted from
 *               `balance`, because the money has not moved.
 *   available = balance − pending. What a new request may be sized against,
 *               so a farmer cannot request the same ৳ twice while the first
 *               request is still in the queue.
 */
function totals(rows) {
  let balance = 0;
  let pending = 0;
  let credits = 0;

  for (const row of rows) {
    const amount = Number(row.amountBdt) || 0;
    if (row.kind === "credit") {
      balance += amount;
      credits += amount;
      continue;
    }
    if (row.status === "Completed") balance -= amount;
    if (row.status === "Pending Approval") pending += amount;
  }

  return { balance, pending, available: balance - pending, credits };
}

const loadRows = (ownerId) =>
  WalletEntry.find({ owner: ownerId }).sort({ createdAt: -1, _id: -1 });

function buildSummary(rows) {
  const { balance, pending, available, credits } = totals(rows);
  return {
    balance,
    pending,
    available,
    totalCredits: credits,
    entries: rows.map((row) => mapEntry(row)),
  };
}

const router = express.Router();

/** The caller's own balance and ledger. */
router.get("/", auth, role(SELLER_ROLES), async (req, res, next) => {
  try {
    res.json(buildSummary(await loadRows(req.user.id)));
  } catch (err) {
    next(err);
  }
});

/**
 * Request a withdrawal against the available balance.
 *
 * Availability is checked twice on purpose: once before writing (the common
 * case, a friendly message) and once after (the race, two tabs clicking
 * submit). The second check deletes the row it just made rather than leaving
 * an over-balance debit in the queue for an admin to discover.
 */
router.post(
  "/withdraw",
  auth,
  role(SELLER_ROLES),
  withdrawRules(),
  async (req, res, next) => {
    try {
      const invalid = fail(req);
      if (invalid) throw invalid;

      const amount = Number(req.body.amountBdt);
      const before = await loadRows(req.user.id);
      if (amount > totals(before).available) {
        throw httpError(
          `Amount exceeds your available balance of BDT ${totals(before).available}`,
          400
        );
      }

      const method = String(req.body.method || "bKash").trim() || "bKash";
      const created = await WalletEntry.create({
        owner: req.user.id,
        kind: "debit",
        amountBdt: amount,
        status: "Pending Approval",
        label: `Withdrawal request — ${method}`,
      });

      const after = await loadRows(req.user.id);
      if (totals(after).available < 0) {
        await WalletEntry.deleteOne({ _id: created._id });
        throw httpError("Amount exceeds your available balance", 409);
      }

      await logAudit({
        req,
        action: "CREATE",
        entity: "WalletEntry",
        entityId: String(created._id),
        details: `Withdrawal of BDT ${amount} requested via ${method}`,
      });

      res.status(201).json(buildSummary(after));
    } catch (err) {
      next(err);
    }
  }
);

/**
 * Every withdrawal ever requested, newest first — the admin's approval queue.
 *
 * Debts only: credits are server-written at escrow release and are never up
 * for a decision, so including them would bury the queue in settled rows.
 */
router.get("/requests", auth, role(["admin"]), async (req, res, next) => {
  try {
    const docs = await WalletEntry.find({ kind: "debit" })
      .sort({ createdAt: -1, _id: -1 })
      .populate("owner", "name email role");

    res.json(docs.map((doc) => mapEntry(doc, mapOwner(doc))));
  } catch (err) {
    next(err);
  }
});

/**
 * Settle a queued withdrawal.
 *
 * `Completed` is what makes the debit finally subtract — until an admin
 * approves, the request is only a claim on `pending` and the balance still
 * shows the money as the farmer's. `Rejected` returns it outright.
 */
async function settle(req, res, next, status) {
  try {
    const doc = await WalletEntry.findById(req.params.id).populate(
      "owner",
      "name email role"
    );
    if (!doc) throw httpError("Withdrawal request not found", 404);
    if (doc.kind !== "debit") {
      throw httpError("Only a withdrawal request can be settled", 400);
    }
    if (doc.status !== "Pending Approval") {
      throw httpError(`This request is already ${doc.status.toLowerCase()}`, 409);
    }

    doc.status = status;
    doc.approvedBy = req.user.name || "Admin";
    doc.processedAt = today();
    await doc.save();

    await logAudit({
      req,
      action: "UPDATE",
      entity: "WalletEntry",
      entityId: String(doc._id),
      details:
        `${status === "Completed" ? "Approved" : "Rejected"} withdrawal of ` +
        `BDT ${doc.amountBdt} for ${mapOwner(doc).ownerName || "unknown seller"}`,
    });

    res.json(mapEntry(doc, mapOwner(doc)));
  } catch (err) {
    next(err);
  }
}

router.post("/:id/approve", auth, role(["admin"]), (req, res, next) =>
  settle(req, res, next, "Completed")
);
router.post("/:id/reject", auth, role(["admin"]), (req, res, next) =>
  settle(req, res, next, "Rejected")
);

module.exports = router;
