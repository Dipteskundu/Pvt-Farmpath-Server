const mongoose = require("mongoose");

const reportSchema = new mongoose.Schema(
  {
    reportCode: { type: String, required: [true, "Please add a report code"], trim: true },
    title: { type: String, default: "" },
    category: { type: String, default: "Yield Forecast" },
    reportingPeriod: { type: String, default: "" },
    fileSizeMb: { type: Number, default: 0 },
    generatedDate: { type: String, default: "" },
    summaryFindings: { type: String, default: "" },
    confidentialityLevel: { type: String, default: "Platform Internal" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Report", reportSchema);
