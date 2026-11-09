const express = require("express");
const { validationResult } = require("express-validator");
const auth = require("../../middleware/auth.middleware");
const role = require("../../middleware/role.middleware");
const { buildCrudRouter } = require("../_crud/crudFactory");
const Order = require("../../database/models/Order");
const Payment = require("../../database/models/Payment");
const Product = require("../../database/models/Product");
const MarketplaceListing = require("../../database/models/MarketplaceListing");
const Dispute = require("../../database/models/Dispute");
const { mapBuyerOrder } = require("../../utils/domainMaps");
// The dispute payload is shared with the admin board on purpose: one mapper
// means the buyer's read-only page and the tribunal's board can never drift
// onto different field names.
const { mapDispute } = require("../admin/admin.mappers");
const { today, dateOnly } = require("../../utils/dates");
const { logAudit } = require("../../utils/audit");
const { checkoutRules, disputeRules } = require("../buyer/buyer.validation");
const { HELD, DISPUTED, releaseEscrow, startClock, releaseDueEscrow } = require("./escrow.service");

const isAdmin = (user) =>
  !!user &&
  (user.role === "admin" || (Array.isArray(user.roles) && user.roles.includes("admin")));

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

/** AG-ORD-26-482 — mirrors the format already present in seeded records. */
async function nextOrderCode() {
  for (let attempt = 0; attempt < 8; attempt += 1) {
    const yy = String(new Date().getFullYear()).slice(-2);
    const suffix = String(Math.floor(100 + Math.random() * 900));
    const code = `AG-ORD-${yy}-${suffix}`;
    if (!(await Order.exists({ orderCode: code }))) return code;
  }
  return `AG-ORD-${Date.now().toString().slice(-6)}`;
}

/** `DISP-2026-100` — zero-padded so the seeded `DISP-2026-089` sorts correctly. */
async function nextDisputeCaseNumber() {
  const prefix = `DISP-${new Date().getFullYear()}-`;
  const pattern = new RegExp(`^${prefix}\\d{3}$`);

  for (let attempt = 0; attempt < 8; attempt += 1) {
    const highest = await Dispute.findOne({ caseNumber: pattern })
      .sort({ caseNumber: -1 })
      .select("caseNumber")
      .lean();
    const last = highest ? parseInt(highest.caseNumber.slice(prefix.length), 10) || 0 : 0;
    const candidate = `${prefix}${String(last + 1).padStart(3, "0")}`;
    if (!(await Dispute.exists({ caseNumber: candidate }))) return candidate;
  }
  return `${prefix}${Date.now().toString().slice(-3)}`;
}

/** Buyer or admin — the two parties allowed to act on a single order. */
function assertCanAct(req, doc, action) {
  const owns = doc.owner && String(doc.owner) === String(req.user.id);
  if (!owns && !isAdmin(req.user)) {
    throw httpError(`You do not have permission to ${action} this order`, 403);
  }
}

/**
 * Resolve one cart line into a price, a stock ceiling and the `Order` fields
 * that differ per kind.
 *
 * A cart holds produce ("Products") and farm inputs ("Inputs") together, and
 * `POST /api/orders/checkout` serves both. Everything that *is* shared —
 * order code, escrow, the simulated payment, the audit entry — stays in the
 * caller; only the item-specific facts are resolved here.
 */
async function resolveLine(req) {
  const { listingId, productId, quantityKg } = req.body;
  const qty = Number(quantityKg);

  if (listingId && productId) {
    throw httpError("Order one cart line at a time", 400);
  }
  if (!listingId && !productId) {
    throw httpError("Choose an item to order", 400);
  }

  if (productId) {
    const product = await Product.findById(productId).populate(
      "supplier",
      "name phone"
    );
    if (!product) throw httpError("That input is no longer available", 404);
    if (!product.isActive) {
      throw httpError("This input is no longer available for sale", 409);
    }

    const stock = Number(product.stock) || 0;
    if (qty > stock) {
      throw httpError(`Only ${stock} ${product.unit || "unit"} in stock`, 409);
    }
    const minimum = Math.max(1, Number(product.minimumOrderQuantity) || 1);
    if (qty < minimum) {
      throw httpError(
        `Minimum order for this item is ${minimum} ${product.unit || "unit"}`,
        400
      );
    }

    const supplier = product.supplier;
    return {
      kind: "input",
      unitPrice: Number(product.price) || 0,
      // `farmerName` / `produceItem` are the seller and item-name columns the
      // admin orders table and `mapBuyerOrder` already read; an input order
      // simply puts the supplier and the product's name in them. No field is
      // renamed, so pre-existing produce orders render exactly as before.
      fields: {
        lineKind: "input",
        inputProduct: product._id,
        produceItem: product.name,
        farmerName: (supplier && supplier.name) || "",
        farmerPhone: (supplier && supplier.phone) || "",
        volumeKg: qty,
        quantityUnits: qty,
        unitLabel: product.unit || "piece",
      },
      payment: {
        produceName: product.name,
        recipientName: (supplier && supplier.name) || "",
        recipientRole: "Supplier",
      },
      purpose: `Purchase of ${product.name}`,
      // Reserve the stock the same way the produce path does.
      reserve: async () => {
        product.stock = Math.max(0, stock - qty);
        await product.save();
      },
    };
  }

  const listing = await MarketplaceListing.findById(listingId);
  if (!listing) throw httpError("That listing is no longer available", 404);
  if (String(listing.status) !== "Approved") {
    throw httpError("This listing has not been approved for sale", 409);
  }

  const minimum = Math.max(1, Number(listing.minimumOrderKg) || 1);
  if (qty < minimum) {
    throw httpError(`Minimum order for this listing is ${minimum} kg`, 400);
  }
  if (qty > Number(listing.quantityAvailableKg)) {
    throw httpError(`Only ${listing.quantityAvailableKg} kg is available`, 409);
  }

  return {
    kind: "produce",
    unitPrice: Number(listing.askingPricePerKg) || 0,
    fields: {
      lineKind: "produce",
      listing: listing._id,
      produceItem: listing.produceName,
      farmerName: listing.farmerName || "",
      farmerPhone: listing.farmerPhone || "",
      volumeKg: qty,
      quantityUnits: qty,
      unitLabel: "kg",
    },
    payment: {
      produceName: listing.produceName,
      recipientName: listing.farmerName || "",
      recipientRole: "Farmer",
    },
    purpose: `Purchase of ${listing.produceName}`,
    // Passed straight to `mapBuyerOrder` so the checkout response carries the
    // listing's image and grade like it did before lines were unified.
    responseListing: listing,
    reserve: async () => {
      listing.quantityAvailableKg = Math.max(
        0,
        (Number(listing.quantityAvailableKg) || 0) - qty
      );
      listing.totalSoldKg = (Number(listing.totalSoldKg) || 0) + qty;
      await listing.save();
    },
  };
}

/**
 * POST /api/orders/checkout
 *
 * Buyer confirms a cart. Simulated payment for V1 (per the plan's Architecture
 * Decisions), but the inventory movement and escrow record are real so the
 * catalogue and the payment history stay consistent with each other.
 *
 * Serves both cart line kinds — see `resolveLine` above.
 */
async function checkout(req, res) {
  const invalid = fail(req);
  if (invalid) throw invalid;

  const { deliveryAddress, paymentMethod, estimatedDelivery } = req.body;
  const qty = Number(req.body.quantityKg);
  const line = await resolveLine(req);

  const total = Math.round(line.unitPrice * qty * 100) / 100;
  const orderCode = await nextOrderCode();
  const method = paymentMethod || "bKash";

  const order = await Order.create({
    orderCode,
    owner: req.user.id,
    buyerName: req.user.name || "",
    ...line.fields,
    unitPriceBdt: line.unitPrice,
    totalValueBdt: total,
    deliveryAddress,
    estimatedDelivery: estimatedDelivery ? dateOnly(estimatedDelivery) : "",
    orderDate: today(),
    paymentStatus: "pending",
    escrowStatus: "Held in Escrow",
    fulfillmentStatus: "Order Placed",
    trackingSteps: [{ label: "Order placed", date: today(), done: true }],
  });

  // V1: payment is simulated, but recorded so the buyer's payment history,
  // the order's escrow state and the amount all agree.
  await Payment.create({
    transactionRef: `TXN-${Date.now().toString(36).toUpperCase()}`,
    owner: req.user.id,
    direction: "purchase",
    orderCode,
    amountBdt: total,
    method,
    purpose: line.purpose,
    paymentChannel: `${method} Merchant`,
    payoutStatus: "Completed",
    initiatedAt: today(),
    paidAt: today(),
    ...line.payment,
  });

  // Move stock so the catalogue reflects the sale immediately.
  await line.reserve();

  await logAudit({
    req,
    action: "CREATE",
    entity: "Order",
    entityId: String(order._id),
    details: `Checkout ${orderCode}: ${qty} ${line.fields.unitLabel} of ${line.fields.produceItem}`,
  });

  res.status(201).json(mapBuyerOrder(order.toObject(), line.responseListing || null));
}

/**
 * POST /api/orders/:id/cancel
 *
 * A buyer "cancelling" is a status change, not a delete — removing the record
 * would strand the payment created at checkout. Cancelling marks the order
 * cancelled, releases the buyer's hold and refunds their payment.
 */
async function cancelOrder(req, res, next) {
  try {
    const doc = await Order.findById(req.params.id);
    if (!doc) throw httpError("Order not found", 404);

    const owns =
      doc.owner && String(doc.owner) === String(req.user.id);
    if (!owns && !isAdmin(req.user)) {
      throw httpError("You do not have permission to cancel this order", 403);
    }

    const current = String(doc.fulfillmentStatus);
    if (current === "Delivered" || current === "Cancelled") {
      throw httpError(`A ${current.toLowerCase()} order can no longer be cancelled`, 409);
    }

    doc.fulfillmentStatus = "Cancelled";
    doc.escrowStatus = "Released to Buyer";
    doc.paymentStatus = "refunded";
    doc.trackingSteps = [
      ...(Array.isArray(doc.trackingSteps) ? doc.trackingSteps : []),
      { label: "Cancelled", date: today(), done: true },
    ];
    await doc.save();

    // Refund the simulated payment tied to this order.
    await Payment.updateMany(
      { orderCode: doc.orderCode, direction: "purchase" },
      { $set: { payoutStatus: "Refunded" } }
    );

    // Return the reserved stock to wherever it came from: a produce line
    // reserved from a listing, an input line from a `Product`. Both were
    // clamped at zero on the way down, so this side only ever adds back.
    const back = Number(doc.quantityUnits) || Number(doc.volumeKg) || 0;

    if (doc.lineKind === "input" && doc.inputProduct) {
      const product = await Product.findById(doc.inputProduct);
      if (product) {
        product.stock = (Number(product.stock) || 0) + back;
        await product.save();
      }
    } else if (doc.listing) {
      const listing = await MarketplaceListing.findById(doc.listing);
      if (listing) {
        listing.quantityAvailableKg =
          (Number(listing.quantityAvailableKg) || 0) + back;
        listing.totalSoldKg = Math.max(
          0,
          (Number(listing.totalSoldKg) || 0) - back
        );
        await listing.save();
      }
    }

    await logAudit({
      req,
      action: "UPDATE",
      entity: "Order",
      entityId: String(doc._id),
      details: `Cancelled ${doc.orderCode}`,
    });

    // Populate only for the response — the stock math above deliberately ran
    // against the raw document so `listing` stays a plain ObjectId there.
    await doc.populate("listing");
    res.json(mapBuyerOrder(doc.toObject(), doc.listing));
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/orders/sales
 *
 * The seller's side of the marketplace: orders where *this* account is the
 * seller, not the buyer. Produced lines resolve through `listing.owner`,
 * input lines through `inputProduct -> Product.supplier`, so the one query
 * covers both halves of the shared cart.
 *
 * Must be declared before the crudFactory mount — the factory registers
 * `GET /:id` ahead of its `extra` routes, so `/sales` would otherwise be
 * parsed as an id and throw a CastError. Mounted locally rather than by
 * reordering the shared factory, which three admin routers also use.
 *
 * Admins see every order, matching how `scope()` treats them everywhere else.
 */
async function salesOrders(req, res, next) {
  try {
    let query = {};

    if (!isAdmin(req.user)) {
      const [listings, products] = await Promise.all([
        MarketplaceListing.find({ owner: req.user.id }).select("_id").lean(),
        Product.find({ supplier: req.user.id }).select("_id").lean(),
      ]);

      const listingIds = listings.map((d) => d._id);
      const productIds = products.map((d) => d._id);

      // Both lists empty -> `$in: []` matches nothing, so a seller with no
      // catalogue gets an empty shelf instead of everyone's orders.
      query = {
        $or: [{ listing: { $in: listingIds } }, { inputProduct: { $in: productIds } }],
      };
    }

    const docs = await Order.find(query)
      .sort({ createdAt: -1, _id: -1 })
      .populate("listing");

    res.json(docs.map((doc) => mapBuyerOrder(doc.toObject(), doc.listing)));
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/orders/:id/receipt
 *
 * The buyer confirms the goods arrived, which releases escrow to the seller.
 *
 * Confirmation is allowed as soon as the money is held (rather than only once
 * logistics has advanced the order): the buyer is the authority on whether
 * they received the product, and it marks the order `Delivered` in the same
 * step. The 7-day clock in `escrow.service.js` is the fallback for a buyer who
 * never clicks, not a gate in front of the one who does.
 *
 * A second click returns 409 — `releaseEscrow` is idempotent underneath, so
 * the guard is about the message, not the money.
 */
async function receiptOrder(req, res, next) {
  try {
    const doc = await Order.findById(req.params.id).populate("listing");
    if (!doc) throw httpError("Order not found", 404);
    assertCanAct(req, doc, "confirm receipt for");

    if (String(doc.fulfillmentStatus) === "Cancelled") {
      throw httpError("A cancelled order cannot be received", 409);
    }
    if (String(doc.escrowStatus) !== HELD) {
      throw httpError(
        `Payment is already ${String(doc.escrowStatus).toLowerCase()}`,
        409
      );
    }

    doc.fulfillmentStatus = "Delivered";
    doc.deliveredAt = today();

    await releaseEscrow(doc, { req, reason: "buyer confirmed receipt" });

    res.json(mapBuyerOrder(doc.toObject(), doc.listing));
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/orders/:id/dispute
 *
 * Freezes held escrow and opens a case on the admin Disputes board. The order
 * itself keeps its `fulfillmentStatus` — only `escrowStatus` moves — so the
 * status chip and tracking timeline still describe what physically happened,
 * while the escrow column says the money is contested.
 *
 * Clearing `escrowReleaseAt` is what takes the order off the sweep's list: a
 * disputed order must never be auto-released out from under review. Resolution
 * (refund vs. release) stays with the admin arbitration flow.
 */
async function disputeOrder(req, res, next) {
  try {
    const invalid = fail(req);
    if (invalid) throw invalid;

    const doc = await Order.findById(req.params.id).populate("listing");
    if (!doc) throw httpError("Order not found", 404);
    assertCanAct(req, doc, "dispute");

    if (String(doc.fulfillmentStatus) === "Cancelled") {
      throw httpError("A cancelled order cannot be disputed", 409);
    }
    if (String(doc.escrowStatus) !== HELD) {
      throw httpError(
        `Payment is already ${String(doc.escrowStatus).toLowerCase()} and cannot be disputed`,
        409
      );
    }

    const body = req.body || {};
    const note = String(body.note || "").trim();

    await Dispute.create({
      caseNumber: await nextDisputeCaseNumber(),
      // Whose file this is: the order's owner (the account that was allowed
      // to act on it), falling back to whoever opened the case when the order
      // predates ownership. This is what `GET /orders/mine/disputes` filters
      // on — see the `owner` field on the schema for why not the plaintiff.
      owner: doc.owner || req.user.id,
      plaintiff: { name: doc.buyerName || req.user.name || "", role: "Buyer" },
      defendant: {
        name: doc.farmerName || "",
        role: doc.lineKind === "input" ? "Supplier" : "Farmer",
      },
      relatedOrderCode: doc.orderCode,
      disputeReason: body.reason || "Order Not Received",
      disputedAmountBdt: Number(doc.totalValueBdt) || 0,
      evidenceAttachmentsCount: 0,
      caseStatus: "Open - Under Review",
      openedAt: today(),
      openedNote: note,
    });

    doc.escrowStatus = DISPUTED;
    doc.escrowReleaseAt = "";
    doc.trackingSteps = [
      ...(Array.isArray(doc.trackingSteps) ? doc.trackingSteps : []),
      { label: "Dispute opened", date: today(), done: true },
    ];
    await doc.save();

    await logAudit({
      req,
      action: "UPDATE",
      entity: "Order",
      entityId: String(doc._id),
      details: `Dispute opened on ${doc.orderCode} for ৳${doc.totalValueBdt}`,
    });

    res.status(201).json(mapBuyerOrder(doc.toObject(), doc.listing));
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/orders/mine/disputes
 *
 * The buyer's own case list, read-only: case number, the order it concerns,
 * what was claimed and how far the tribunal has got. There is no write here —
 * opening one stays `POST /:id/dispute`, and settling one stays on the admin
 * board, so a buyer can follow a case but never steer it.
 *
 * Scoped by `owner` rather than by the plaintiff's display name, which is a
 * plain string anyone could rename themselves into. Buyer-only: admin reads
 * through `GET /api/admin/disputes`, which returns every file.
 */
async function myDisputes(req, res, next) {
  try {
    const cases = await Dispute.find({ owner: req.user.id }).sort({
      createdAt: -1,
      _id: -1,
    });
    res.json(cases.map((doc) => mapDispute(doc)));
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/orders/escrow/release-due
 *
 * Runs the exact function the hourly sweeper runs, on demand. Exists so the
 * 7-day release can be demonstrated and tested without waiting for a real
 * week (or an hour), and so an admin can nudge a stuck order. Idempotent:
 * re-running against an already-released order reports nothing.
 */
async function releaseDue(req, res, next) {
  try {
    res.json(await releaseDueEscrow({ req }));
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/orders/escrow/cron
 *
 * Vercel Cron entry point (hourly — the same cadence as `startEscrowSweeper`
 * in `src/server.js`, which never runs on a serverless deployment). Cron
 * invocations are GETs carrying `Authorization: Bearer ${CRON_SECRET}`; the
 * handler runs the exact function the local sweeper and the admin
 * `POST /escrow/release-due` endpoint run — no separate logic. When no
 * CRON_SECRET is configured it answers 404, so the route is inert outside the
 * environment that set the secret.
 */
async function escrowCron(req, res, next) {
  try {
    const secret = process.env.CRON_SECRET;
    if (!secret || req.get("authorization") !== `Bearer ${secret}`) {
      return res.status(404).json({ message: "Not found" });
    }
    res.json(await releaseDueEscrow({ req }));
  } catch (err) {
    next(err);
  }
}

const crud = buildCrudRouter({
  model: Order,
  // `supplier` sits here because the supplier portal's Orders page reuses this
  // endpoint: a supplier is also a marketplace participant and can place their
  // own orders. Scoping is unchanged — `ownerKey` still pins every non-admin
  // to rows they created, so widening the list never exposes anyone else's.
  roles: ["buyer", "farmer", "supplier", "admin"],
  ownerKey: "owner",
  populate: ["listing"],
  map: (doc) => mapBuyerOrder(doc, doc.listing),
  sort: { createdAt: -1, _id: -1 },
  auditName: "Order",
  // Buyers are read-only on orders: lifecycle is driven by the farmer/admin
  // side. `create`/`update`/`remove` are all disabled on the factory —
  // ordering happens via /checkout, cancelling via /:id/cancel, and admin
  // lifecycle changes via the router.put below.
  routes: { list: true, get: true, create: false, update: false, remove: false },
  extra: [
    { method: "post", path: "/checkout", handler: checkout, guards: checkoutRules() },
    { method: "post", path: "/:id/cancel", handler: cancelOrder },
    { method: "post", path: "/:id/receipt", handler: receiptOrder },
    { method: "post", path: "/:id/dispute", handler: disputeOrder, guards: disputeRules() },
    { method: "get", path: "/mine/disputes", handler: myDisputes, guards: [role(["buyer"])] },
    {
      method: "post",
      path: "/escrow/release-due",
      handler: releaseDue,
      guards: [role(["admin"])],
    },
  ],
});

/**
 * `/sales` is registered ahead of the factory mount: `buildCrudRouter` puts
 * `GET /:id` before its own `extra` routes, so anything declared afterwards
 * would lose the match and `sales` would be read as an order id.
 */
const router = express.Router();
router.get("/sales", auth, role(["farmer", "supplier", "admin"]), salesOrders);
// Registered before `crud` so the cron path can never be read as a `GET /:id`
// order lookup, and ahead of any JWT guard — it authenticates on CRON_SECRET.
router.get("/escrow/cron", escrowCron);
router.use(crud);

/**
 * Update lifecycle for admins only. Registered AFTER the crudFactory routes,
 * so `PUT /:id` below is the one that matches — the factory's `routes.update`
 * is disabled above to keep buyers out of it.
 */
router.put(
  "/:id",
  auth,
  role(["admin"]),
  async (req, res, next) => {
    try {
      const doc = await Order.findById(req.params.id).populate("listing");
      if (!doc) throw httpError("Order not found", 404);

      const body = req.body || {};
      const clean = {};
      [
        "fulfillmentStatus",
        "escrowStatus",
        "logisticsPartner",
        "estimatedDelivery",
        "deliveredAt",
        "paymentStatus",
        "buyerName",
        "farmerName",
        "produceItem",
        "deliveryAddress",
        "trackingSteps",
      ].forEach((key) => {
        if (body[key] !== undefined && body[key] !== null) clean[key] = body[key];
      });

      Object.assign(doc, clean);

      // Reaching `Delivered` starts the 7-day auto-release clock. Doing it
      // here rather than in the service keeps the trigger next to the only
      // code path that can set the status; `startClock` is a no-op if escrow
      // is already settled or a deadline is already running.
      startClock(doc);

      await doc.save();

      await logAudit({
        req,
        action: "UPDATE",
        entity: "Order",
        entityId: String(doc._id),
        details: `Updated ${doc.orderCode}`,
      });

      res.json(mapBuyerOrder(doc.toObject(), doc.listing));
    } catch (err) {
      next(err);
    }
  }
);

module.exports = router;
