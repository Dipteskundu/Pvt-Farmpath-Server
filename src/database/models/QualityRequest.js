const mongoose = require("mongoose");

/**
 * Quality inspection request → report.
 *
 * One record carries both halves: it is raised as an assignment and then
 * filled in when the inspector submits results. The flat fields below are read
 * verbatim by `admin.mappers.js` (`batchCode`, `produceType`, `farmerName`,
 * `testingLabLocation`, `inspectorName`, `assignedGrade`, `moisture*`,
 * `foreignMatterPercent`, `aflatoxinPpm`, `complianceVerdict`,
 * `inspectionDate`, `certificateNumber`) — never rename or remove them.
 *
 * Everything marked "additive" exists for the inspector portal.
 */
const qualityReportSchema = new mongoose.Schema(
  {
    batchCode: { type: String, required: [true, "Please add a batch code"], trim: true },
    produceType: { type: String, default: "" },
    farmerName: { type: String, default: "" },
    testingLabLocation: { type: String, default: "" },
    inspectorName: { type: String, default: "" },
    assignedGrade: { type: String, default: "Grade A" },
    moistureContentPercent: { type: Number, default: 0 },
    moistureStandardThreshold: { type: Number, default: 0 },
    foreignMatterPercent: { type: Number, default: 0 },
    aflatoxinPpm: { type: Number, default: 0 },
    complianceVerdict: { type: String, default: "Passed" },
    inspectionDate: { type: String, default: "" },
    certificateNumber: { type: String, default: "" },

    // ── inspector portal (additive) ────────────────────────────
    /** The assigned inspector. Null while still unassigned. */
    owner: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    /**
     * The produce listing this was raised for, when a seller asked for one
     * (`POST /api/quality/listing/:listingId`).
     *
     * This is the forward half of the Phase 2 link; the reverse half is
     * `MarketplaceListing.qualityReport`, which is written only once a report
     * is *submitted* so the admin approval gate can test "has a completed
     * inspection" by the listing alone. Seeded inspections carry neither.
     */
    listing: { type: mongoose.Schema.Types.ObjectId, ref: "MarketplaceListing" },
    status: {
      type: String,
      enum: ["assigned", "in_progress", "completed", "cancelled"],
      default: "assigned",
    },
    priority: { type: String, enum: ["normal", "urgent"], default: "normal" },
    requestedAt: { type: String, default: "" },
    scheduledDate: { type: String, default: "" },
    farmLocation: { type: String, default: "" },
    farmerPhone: { type: String, default: "" },
    variety: { type: String, default: "" },
    quantityKg: { type: Number, default: 0 },
    notes: { type: String, default: "" },
    visualCondition: { type: String, default: "" },
    recommendedAction: { type: String, default: "" },
    findings: { type: String, default: "" },
    photoUrls: { type: [String], default: [] },
    submittedAt: { type: String, default: "" },
  },
  { timestamps: true }
);

qualityReportSchema.index({ owner: 1, status: 1 });
qualityReportSchema.index({ status: 1, scheduledDate: 1 });
qualityReportSchema.index({ listing: 1, status: 1 });

module.exports = mongoose.model("QualityRequest", qualityReportSchema);
