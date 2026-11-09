const mongoose = require("mongoose");

const farmSchema = new mongoose.Schema(
  {
    owner: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    name: { type: String, required: [true, "Please add a farm name"], trim: true },
    location: { type: String, default: "" },
    totalAreaAcres: { type: Number, required: [true, "Please add total area"], min: 0 },
    soilClassification: { type: String, default: "" },
    irrigationType: { type: String, default: "Rainfed" },
    waterSource: { type: String, default: "" },
    latitude: { type: Number, default: 0 },
    longitude: { type: Number, default: 0 },
    status: { type: String, default: "active" },
    registeredDate: { type: String, default: "" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Farm", farmSchema);
