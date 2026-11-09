const mongoose = require("mongoose");

const advisorySchema = new mongoose.Schema(
  {
    title: { type: String, required: [true, "Please add a title"], trim: true },
    targetCrops: { type: [String], default: [] },
    targetDistricts: { type: [String], default: [] },
    severity: { type: String, default: "medium" },
    category: { type: String, default: "Pest Alert" },
    issueDate: { type: String, default: "" },
    validUntil: { type: String, default: "" },
    advisoryText: { type: String, default: "" },
    recommendedTreatments: { type: [String], default: [] },
    issuingAuthority: { type: String, default: "" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Advisory", advisorySchema);
