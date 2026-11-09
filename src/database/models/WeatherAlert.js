const mongoose = require("mongoose");

const weatherAlertSchema = new mongoose.Schema(
  {
    severity: { type: String, default: "moderate" },
    title: { type: String, required: [true, "Please add an alert title"], trim: true },
    message: { type: String, default: "" },
    validUntil: { type: String, default: "" },
    actionRequired: { type: String, default: "" },
    targetDistricts: { type: [String], default: [] },
    broadcastBy: { type: String, default: "" },
    readBy: { type: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }], default: [] },
  },
  { timestamps: true }
);

module.exports = mongoose.model("WeatherAlert", weatherAlertSchema);
