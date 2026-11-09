const mongoose = require("mongoose");

const masterCropSchema = new mongoose.Schema(
  {
    cropName: { type: String, required: [true, "Please add a crop name"], trim: true },
    scientificName: { type: String, default: "" },
    category: { type: String, default: "Cereal" },
    recommendedSeason: { type: String, default: "" },
    optimalSoilPhRange: { type: String, default: "" },
    minRainfallMm: { type: Number, default: 0 },
    maxRainfallMm: { type: Number, default: 0 },
    averageMaturityDays: { type: Number, default: 0 },
    standardYieldKgPerAcre: { type: Number, default: 0 },
    benchmarkPriceBdtPerKg: { type: Number, default: 0 },
    approvedVarieties: { type: [String], default: [] },
    pestVulnerabilities: { type: [String], default: [] },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Crop", masterCropSchema);
