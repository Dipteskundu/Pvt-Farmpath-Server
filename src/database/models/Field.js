const mongoose = require("mongoose");

const fieldSchema = new mongoose.Schema(
  {
    owner: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    farmId: { type: String, default: "" },
    farmName: { type: String, default: "" },
    name: { type: String, required: [true, "Please add a field name"], trim: true },
    sizeAcres: { type: Number, required: [true, "Please add field size"], min: 0 },
    currentCrop: { type: String, default: "" },
    soilPh: { type: Number, default: 7 },
    nitrogenLevelKgPerHa: { type: Number, default: 0 },
    phosphorusLevelKgPerHa: { type: Number, default: 0 },
    potassiumLevelKgPerHa: { type: Number, default: 0 },
    moisturePercentage: { type: Number, default: 0 },
    ndviScore: { type: Number, default: 0 },
    irrigationStatus: { type: String, default: "Optimal" },
    lastSoilTested: { type: String, default: "" },
    status: { type: String, default: "cultivated" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Field", fieldSchema);
