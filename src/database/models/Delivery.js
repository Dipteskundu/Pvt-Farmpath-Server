const mongoose = require("mongoose");

/**
 * Delivery / consignment.
 *
 * Flat fields read by `admin.mappers.js`: `consignmentCode`, `originHub`,
 * `destinationDepot`, `cargoDescription`, `cargoWeightKg`, `vehicleType`,
 * `driverName`, `driverPhone`, `temperatureCelsius`, `targetTempRange`,
 * `transitStatus`, `estimatedArrival`, `coldChainIntegrity`. Do not rename.
 *
 * `owner` is additive and links a consignment to the buyer who ordered it,
 * so the buyer portal can show only their own shipments.
 */
const logisticsSchema = new mongoose.Schema(
  {
    consignmentCode: { type: String, required: [true, "Please add a consignment code"], trim: true },
    originHub: { type: String, default: "" },
    destinationDepot: { type: String, default: "" },
    cargoDescription: { type: String, default: "" },
    cargoWeightKg: { type: Number, default: 0 },
    vehicleType: { type: String, default: "Open Bed Truck" },
    driverName: { type: String, default: "" },
    driverPhone: { type: String, default: "" },
    temperatureCelsius: { type: Number, default: 0 },
    targetTempRange: { type: String, default: "" },
    transitStatus: { type: String, default: "Dispatched" },
    estimatedArrival: { type: String, default: "" },
    coldChainIntegrity: { type: String, default: "Optimal" },

    // ── buyer portal (additive) ────────────────────────────────
    owner: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    orderCode: { type: String, default: "" },
  },
  { timestamps: true }
);

logisticsSchema.index({ owner: 1, transitStatus: 1 });

module.exports = mongoose.model("Delivery", logisticsSchema);
