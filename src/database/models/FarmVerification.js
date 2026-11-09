const mongoose = require("mongoose");

const evidenceDocumentSchema = new mongoose.Schema(
  {
    name: { type: String, default: "" },
    type: { type: String, default: "" },
    url: { type: String, default: "" },
  },
  { _id: false }
);

const farmVerificationSchema = new mongoose.Schema(
  {
    owner: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    farmerId: { type: String, default: "" },
    farmerName: { type: String, default: "" },
    farmName: { type: String, default: "" },
    division: { type: String, default: "" },
    district: { type: String, default: "" },
    upazila: { type: String, default: "" },
    totalAcreage: { type: Number, default: 0 },
    cadastralPlotNumbers: { type: String, default: "" },
    mouzaKhatianNumber: { type: String, default: "" },
    submissionDate: { type: String, default: "" },
    status: { type: String, default: "pending" },
    assignedOfficerName: { type: String, default: "" },
    officerNotes: { type: String, default: "" },
    evidenceDocuments: {
      type: [evidenceDocumentSchema],
      default: [],
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("FarmVerification", farmVerificationSchema);
