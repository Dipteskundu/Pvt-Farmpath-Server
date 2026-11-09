const mongoose = require("mongoose");
const Order = require("../../database/models/Order");
const Product = require("../../database/models/Product");
const MarketplaceListing = require("../../database/models/MarketplaceListing");
const WalletEntry = require("../../database/models/WalletEntry");
const { today, addDays } = require("../../utils/dates");
const { logAudit } = require("../../utils/audit");

/**
 * Escrow.
 *
 * Freelancer-style money flow: the buyer's payment is held on the `Order`
 * until they confirm receipt (or the 7-day auto-release clock runs out), at
 * which point it is credited to the seller's wallet and they withdraw it in
 * their own time.
 *
 * The vocabulary is not invented here — `'Held in Escrow' | 'Released to
 * Farmer' | 'Refunded' | 'Disputed'` is the union the frontend already
 * declares in `types/index.ts`, the admin orders table already filters on, and
 * `uiDict.ts` already translates. This module is what *produces* those states.
 *
 * State machine (only these three ever leave `HELD`):
 *
 *   Held in Escrow ── buyer confirms receipt ────▶ Released to Farmer
 *   Held in Escrow ── 7-day clock expires ───────▶ Released to Farmer
 *   Held in Escrow ── buyer opens a dispute ─────▶ Disputed   (frozen; only
 *                                                      an admin resolution
 *                                                      moves it further)
 *   Held in Escrow ── buyer cancels ─────────────▶ Released to Buyer
 *                                                  (handled in orders.routes,
 *                                                  refunds rather than credits)
 */

const HELD = "Held in Escrow";
const RELEASED_TO_FARMER = "Released to Farmer";
const DISPUTED = "Disputed";
const DELIVERED = "Delivered";

/** Days between delivery and the automatic release of held funds. */
const ESCROW_DAYS = 7;

/**
 * The seller of an order: the listing's owner for a produce line, the
 * product's supplier for an input line.
 *
 * Orders seeded before either reference existed resolve to nothing — release
 * still happens, there is simply no wallet to credit — so this returns `null`
 * rather than throwing. A populated `listing` is read straight off the
 * document to save the round trip.
 */
async function resolveSellerId(doc) {
  if (doc.lineKind === "input" && doc.inputProduct) {
    const product = await Product.findById(doc.inputProduct).select("supplier").lean();
    return (product && product.supplier) || null;
  }

  if (doc.listing && typeof doc.listing === "object" && doc.listing._id) {
    return doc.listing.owner || null;
  }
  if (doc.listing) {
    const listing = await MarketplaceListing.findById(doc.listing).select("owner").lean();
    return (listing && listing.owner) || null;
  }
  return null;
}

/**
 * Credit the seller's wallet for a released order. Idempotent.
 *
 * Called before the order is flipped, never after: the unique index on
 * `{ owner, orderCode }` (credits only) makes a second attempt a no-op, but an
 * order already marked released with no credit could never be retried, because
 * every retry short-circuits on the status. Credit first, then flip — a crash
 * in between resolves itself on the next attempt instead of losing the money.
 */
async function creditSeller(doc, reason) {
  const sellerId = await resolveSellerId(doc);
  if (!sellerId) {
    console.warn(
      `Escrow: ${doc.orderCode} released with no resolvable seller — no wallet credit written`
    );
    return null;
  }

  const filter = { owner: sellerId, orderCode: doc.orderCode, kind: "credit" };
  const existing = await WalletEntry.findOne(filter);
  if (existing) return existing;

  try {
    return await WalletEntry.create({
      ...filter,
      amountBdt: Number(doc.totalValueBdt) || 0,
      status: "Available",
      // The trigger is kept on the row so the wallet page can distinguish a
      // buyer's own confirmation from money that arrived on the clock.
      label: `Escrow release (${reason || "released"}) — ${doc.produceItem || "order"} (${doc.orderCode})`,
    });
  } catch (error) {
    // Two releases raced past the pre-check (buyer confirm vs. the sweep).
    // The partial unique index rejected the second — read back the winner
    // instead of surfacing a duplicate-key error to the buyer.
    if (error && error.code === 11000) return WalletEntry.findOne(filter);
    throw error;
  }
}

/**
 * Move held escrow to the seller and credit their wallet.
 *
 * Returns `{ released, credit }`; `released: false` means the order had
 * already settled (or was disputed/refunded), in which case nothing was
 * written — which is what makes a double-click on "Confirm receipt" and a
 * sweep racing the same order safe.
 *
 * Accepts a doc that is either loaded raw or with `listing` populated.
 */
async function releaseEscrow(doc, { req = null, reason = "receipt" } = {}) {
  if (String(doc.escrowStatus) !== HELD) return { released: false, credit: null };

  const credit = await creditSeller(doc, reason);

  doc.escrowStatus = RELEASED_TO_FARMER;
  doc.escrowReleaseAt = "";
  doc.paymentStatus = "paid";
  doc.trackingSteps = [
    ...(Array.isArray(doc.trackingSteps) ? doc.trackingSteps : []),
    { label: "Payment released", date: today(), done: true },
  ];
  await doc.save();

  await logAudit({
    req,
    action: "UPDATE",
    entity: "Order",
    entityId: String(doc._id),
    details: `Escrow released for ${doc.orderCode} (${reason})`,
  });

  return { released: true, credit };
}

/**
 * Start the 7-day auto-release clock. Mutates but does NOT save — the admin
 * `PUT /orders/:id` path already has a pending `save()` and the sweep does its
 * own, so saving here would double-write.
 *
 * Returns true when something changed, so callers know to persist.
 */
function startClock(doc) {
  if (String(doc.escrowStatus) !== HELD) return false;
  if (doc.escrowReleaseAt) return false;
  if (String(doc.fulfillmentStatus) !== DELIVERED) return false;

  doc.escrowReleaseAt = addDays(ESCROW_DAYS, today());
  if (!doc.deliveredAt) doc.deliveredAt = today();
  return true;
}

/**
 * The hourly sweep.
 *
 * Two passes, deliberately in this order:
 *
 *   1. Backfill — a `Delivered` order with no deadline means whoever set the
 *      status bypassed the hook in `orders.routes.js`. Start the clock rather
 *      than releasing instantly: "delivered a moment ago" has not earned the
 *      money yet.
 *   2. Release — deadline reached, still held. `HELD` in the filter is what
 *      keeps disputed, refunded and already-released orders out of it, so a
 *      frozen dispute is never swept out from under review.
 *
 * Never throws to its caller: this runs on a timer with nobody watching.
 */
async function releaseDueEscrow({ req = null } = {}) {
  const report = { released: [], started: [] };
  const now = today();

  const missing = await Order.find({
    fulfillmentStatus: DELIVERED,
    escrowStatus: HELD,
    escrowReleaseAt: { $in: [null, ""] },
  });

  for (const doc of missing) {
    if (!startClock(doc)) continue;
    await doc.save();
    report.started.push(doc.orderCode);
  }

  const due = await Order.find({
    escrowStatus: HELD,
    escrowReleaseAt: { $ne: "", $lte: now },
  }).populate("listing");

  for (const doc of due) {
    const { released } = await releaseEscrow(doc, { req, reason: "auto-release" });
    if (released) report.released.push(doc.orderCode);
  }

  if (report.released.length || report.started.length) {
    console.log(
      `Escrow sweep: released ${report.released.length}, started ${report.started.length}` +
        (report.released.length ? ` (${report.released.join(", ")})` : "")
    );
  }

  return report;
}

/**
 * Register the hourly sweeper. `unref()` so the interval never holds the
 * process open during shutdown, and a readyState guard so a dropped Atlas
 * connection logs a warning instead of throwing an unhandled rejection.
 *
 * Set `DISABLE_ESCROW_SWEEP=1` to opt out (tests that drive
 * `POST /api/orders/escrow/release-due` instead).
 */
function startEscrowSweeper(intervalMs = 60 * 60 * 1000) {
  const tick = async () => {
    if (mongoose.connection.readyState !== 1) return;
    try {
      await releaseDueEscrow();
    } catch (error) {
      console.warn(`Escrow sweep failed: ${error.message}`);
    }
  };

  const timer = setInterval(tick, intervalMs);
  timer.unref();
  console.log(`Escrow sweep scheduled every ${Math.round(intervalMs / 60000)} min`);
  return timer;
}

module.exports = {
  HELD,
  RELEASED_TO_FARMER,
  DISPUTED,
  DELIVERED,
  ESCROW_DAYS,
  resolveSellerId,
  creditSeller,
  releaseEscrow,
  startClock,
  releaseDueEscrow,
  startEscrowSweeper,
};
