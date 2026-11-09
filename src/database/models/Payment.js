const mongoose = require("mongoose");

/**
 * Payment.
 *
 * Flat fields read by `admin.mappers.js`: `transactionRef`, `recipientName`,
 * `recipientRole`, `amountBdt`, `purpose`, `payoutStatus`, `paymentChannel`,
 * `initiatedAt`, `approvedBy`. Do not rename them.
 *
 * This model serves two distinct flows, separated by `direction`:
 *   - "payout"   money going OUT to a farmer or logistics vendor (admin view)
 *   - "purchase" money coming IN from a buyer (buyer-portal view)
 * `direction` defaults to "payout", so every pre-existing record keeps its
 * admin meaning without a migration.
 */
const paymentSchema = new mongoose.Schema(
  {
    transactionRef: { type: String, required: [true, "Please add a transaction reference"], trim: true },
    recipientName: { type: String, default: "" },
    recipientRole: { type: String, default: "Farmer" },
    amountBdt: { type: Number, required: [true, "Please add an amount"], min: 0 },
    purpose: { type: String, default: "Harvest Sale Payout" },
    payoutStatus: { type: String, default: "Pending Approval" },
    paymentChannel: { type: String, default: "bKash Merchant" },
    initiatedAt: { type: String, default: "" },
    approvedBy: { type: String, default: "" },

    // ── buyer portal (additive) ────────────────────────────────
    owner: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    direction: { type: String, enum: ["payout", "purchase"], default: "payout" },
    orderCode: { type: String, default: "" },
    produceName: { type: String, default: "" },
    method: { type: String, default: "bKash" },
    paidAt: { type: String, default: "" },
  },
  { timestamps: true }
);

paymentSchema.index({ owner: 1, direction: 1, paidAt: -1 });

module.exports = mongoose.model("Payment", paymentSchema);
