const mongoose = require("mongoose");

const disputeSchema = new mongoose.Schema(
  {
    caseNumber: { type: String, required: [true, "Please add a case number"], trim: true },
    plaintiff: {
      name: { type: String, default: "" },
      role: { type: String, default: "Farmer" },
    },
    defendant: {
      name: { type: String, default: "" },
      role: { type: String, default: "Buyer" },
    },
    relatedOrderCode: { type: String, default: "" },
    disputeReason: { type: String, default: "Payment Delay" },
    disputedAmountBdt: { type: Number, default: 0 },
    evidenceAttachmentsCount: { type: Number, default: 0 },
    /**
     * What the buyer wrote when they opened the case (additive). Kept out of
     * `resolutionNotes`, which is the tribunal's verdict and is written by the
     * admin arbitration flow.
     */
    openedNote: { type: String, default: "" },
    caseStatus: { type: String, default: "Open - Under Review" },
    openedAt: { type: String, default: "" },
    resolutionNotes: { type: String, default: "" },
    /**
     * Who may read this file (additive). The plaintiff is only a display name
     * — a plain string, so matching on it would let anyone rename themselves
     * into somebody else's case. This is the order's owner: the account that
     * was allowed to open the dispute in the first place, and the key
     * `GET /api/orders/mine/disputes` scopes by. Admin reads through its own
     * board and is unaffected.
     */
    owner: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Dispute", disputeSchema);
