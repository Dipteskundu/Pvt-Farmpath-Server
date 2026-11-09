const mongoose = require("mongoose");

/**
 * WalletEntry — the farmer's escrow wallet ledger.
 *
 * Freelancer-style money flow: a buyer's money sits in escrow on the `Order`,
 * and when it releases (buyer confirms receipt, or the 7-day auto-release
 * fires) a `credit` row lands here. The balance the farmer can request a
 * withdrawal against is `credits - debits`; Phase 4's withdraw flow writes the
 * `debit` rows and admin approval marks them `Completed`.
 *
 * Two rules the rest of the codebase depends on:
 *
 *   - Credits are server-written only. They are created inside
 *     `escrow.service.js` at release time, never by a request body, so the
 *     ledger can only ever be moved by money actually changing hands. The
 *     partial unique index below enforces "one credit per released order"
 *     even if a buyer's confirm races the hourly sweep.
 *   - Debits carry no `orderCode`: a withdrawal is taken against the whole
 *     balance, not against one order, which is why the unique index is
 *     partial on `kind: "credit"` rather than compound over both fields.
 */
const walletEntrySchema = new mongoose.Schema(
  {
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Please add a wallet owner"],
    },
    /** Set on credits: the order whose escrow produced this money. */
    orderCode: { type: String, default: "" },
    kind: { type: String, enum: ["credit", "debit"], required: true },
    amountBdt: { type: Number, required: [true, "Please add an amount"], min: 0 },
    /**
     * "Available"  — credited escrow, withdrawable
     * "Pending Approval" — withdrawal requested, waiting on an admin
     * "Completed"  — withdrawal paid out (or a Phase 4 adjustment settled)
     * "Rejected"   — admin refused the withdrawal; the money returns to the
     *                balance, because only `Completed` debits subtract
     */
    status: {
      type: String,
      enum: ["Available", "Pending Approval", "Completed", "Rejected"],
      default: "Available",
    },
    label: { type: String, default: "" },
    approvedBy: { type: String, default: "" },
    processedAt: { type: String, default: "" },
  },
  { timestamps: true }
);

walletEntrySchema.index({ owner: 1, createdAt: -1 });
/** The admin approval queue reads `{ kind: "debit" }` newest-first. */
walletEntrySchema.index({ kind: 1, createdAt: -1 });
walletEntrySchema.index(
  { owner: 1, orderCode: 1 },
  {
    unique: true,
    partialFilterExpression: { kind: "credit", orderCode: { $type: "string" } },
  }
);

module.exports = mongoose.model("WalletEntry", walletEntrySchema);
