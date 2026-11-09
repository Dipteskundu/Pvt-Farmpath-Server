const mongoose = require("mongoose");

const harvestSchema = new mongoose.Schema(
  {
    owner: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    cropBatchId: { type: String, default: "" },
    cropName: { type: String, default: "" },
    variety: { type: String, default: "" },
    fieldName: { type: String, default: "" },
    harvestDate: { type: String, default: "" },
    quantityKg: { type: Number, required: [true, "Please add quantity"], min: 0 },
    qualityGrade: { type: String, default: "Grade A" },
    moisturePercentage: { type: Number, default: 0 },
    storageLocation: { type: String, default: "" },
    batchCode: { type: String, default: "" },
    storageCondition: { type: String, default: "Ambient Warehouse" },
    marketReadiness: { type: String, default: "Ready for Sale" },
    estimatedValuationBdt: { type: Number, default: 0 },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Harvest", harvestSchema);
