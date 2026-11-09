const mongoose = require("mongoose");

/**
 * Buyer demand (the "I need 5 t of potato by Nov" board).
 *
 * `buyer`, `product`, `quantity`, `unit`, `qualityRequirements`,
 * `preferredLocation`, `deliveryRequirements`, `deadline` and `status` are the
 * original fields — the status enum already matches the frontend's
 * `DemandStatus` union exactly, so it is left alone.
 *
 * Fields below marked additive carry the extra detail the buyer portal's
 * `BuyerDemand` interface renders.
 */
const demandSchema = new mongoose.Schema(
  {
    buyer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    product: {
      type: String,
      required: [true, "Please add product name"],
    },
    quantity: {
      type: Number,
      required: true,
    },
    unit: {
      type: String,
      default: "kg",
    },
    qualityRequirements: {
      type: String,
    },
    preferredLocation: {
      type: String,
    },
    deliveryRequirements: {
      type: String,
    },
    deadline: {
      type: Date,
    },
    status: {
      type: String,
      enum: ["open", "matched", "fulfilled", "expired"],
      default: "open",
    },

    // ── buyer portal (additive) ────────────────────────────────
    buyerName: { type: String, default: "" },
    variety: { type: String, default: "" },
    qualityGrade: { type: String, default: "Any" },
    maxPricePerKgBdt: { type: Number, default: 0 },
    deliveryMethod: { type: String, enum: ["pickup", "delivery"], default: "delivery" },
    description: { type: String, default: "" },
    matchedFarmers: { type: Number, default: 0 },
  },
  {
    timestamps: true,
  }
);

demandSchema.index({ buyer: 1, status: 1 });
demandSchema.index({ status: 1, deadline: 1 });

module.exports = mongoose.model("Demand", demandSchema);
