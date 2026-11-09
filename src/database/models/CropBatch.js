const mongoose = require("mongoose");

const cropBatchSchema = new mongoose.Schema(
  {
    owner: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    fieldId: { type: String, default: "" },
    fieldName: { type: String, default: "" },
    cropName: { type: String, required: [true, "Please add a crop name"], trim: true },
    variety: { type: String, default: "" },
    category: { type: String, default: "Cereal" },
    sowingDate: { type: String, default: "" },
    expectedHarvestDate: { type: String, default: "" },
    growthStage: { type: String, default: "Germination" },
    growthProgressPercent: { type: Number, default: 10, min: 0, max: 100 },
    targetYieldKg: { type: Number, default: 0 },
    healthRating: { type: String, default: "Good" },
    seedSource: { type: String, default: "" },
    lastAction: { type: String, default: "Sowing recorded" },
    lastActionDate: { type: String, default: "" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("CropBatch", cropBatchSchema);
