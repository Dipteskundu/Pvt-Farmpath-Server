const mongoose = require("mongoose");

/**
 * Produce listing.
 *
 * NOTE ON FIELD NAMES — the admin portal's `admin.mappers.js` reads
 * `produceName`, `quantityAvailableKg`, `askingPricePerKg`, `locationHub`,
 * `suggestedFloorPrice`, `suggestedCeilingPrice`, `status` and `listedDate`.
 * Never rename or remove those: they are live. The marketplace module adds the
 * richer buyer-facing fields below and maps both sets to the frontend's
 * `ProduceListing` shape in `marketplace.mappers.js`.
 */
const marketplaceListingSchema = new mongoose.Schema(
  {
    // ── ownership / provenance ────────────────────────────────
    owner: { type: mongoose.Schema.Types.ObjectId, ref: "User" },

    // ── legacy admin fields (READ BY admin.mappers.js — do not rename) ──
    farmerName: { type: String, default: "" },
    farmerPhone: { type: String, default: "" },
    produceName: { type: String, required: [true, "Please add produce name"], trim: true },
    variety: { type: String, default: "" },
    category: { type: String, default: "" },
    quantityAvailableKg: { type: Number, default: 0 },
    askingPricePerKg: { type: Number, default: 0 },
    suggestedFloorPrice: { type: Number, default: 0 },
    suggestedCeilingPrice: { type: Number, default: 0 },
    qualityGrade: { type: String, default: "Pending Inspection" },
    locationHub: { type: String, default: "" },
    status: { type: String, default: "Pending Review" },
    listedDate: { type: String, default: "" },

    // ── buyer-facing fields (marketplace portal) ──────────────
    farmerLocation: { type: String, default: "" },
    farmerAvatar: { type: String, default: "" },
    imageUrl: { type: String, default: "" },
    description: { type: String, default: "" },
    minimumOrderKg: { type: Number, default: 1 },
    harvestDate: { type: String, default: "" },
    availableUntil: { type: String, default: "" },
    location: { type: String, default: "" },
    district: { type: String, default: "" },
    tags: { type: [String], default: [] },
    totalSoldKg: { type: Number, default: 0 },
    isVerified: { type: Boolean, default: false },

    // ── seller-supplied detail: storage, lot and certification ──
    // `qualityGrade` is deliberately NOT here — a seller cannot declare it.
    // It starts at "Pending Inspection" and is written by the quality module
    // once an inspector submits a report.
    storageCondition: { type: String, default: "" },
    lotCode: { type: String, default: "", trim: true },
    certification: { type: String, default: "" },
    sampleAvailable: { type: Boolean, default: false },
    availableFrom: { type: String, default: "" },

    // ── links to the quality + harvest chain (proposal §6.10) ──
    harvestLot: { type: mongoose.Schema.Types.ObjectId, ref: "Harvest" },
    /**
     * The inspection that has *completed* against this lot.
     *
     * Written by `POST /api/quality/:id/submit` (and repointed when a
     * re-inspection lands), never by the seller — `updateListing` reads it as
     * the moderation gate: a listing cannot go to `Approved` without one.
     */
    qualityReport: { type: mongoose.Schema.Types.ObjectId, ref: "QualityRequest" },
    /**
     * Set while an inspection request for this lot is still open, cleared
     * when the report lands. Derived state, written by the quality module —
     * the seller's manage view reads it to choose between a
     * "Request inspection" button and an "awaiting an inspector" note, so a
     * second request can never be raised for a lot already in the queue.
     */
    inspectionRequestedAt: { type: String, default: "" },

    // ── ratings & feedback (additive) ─────────────────────────
    // Server-owned: written only by `POST /api/marketplace/listings/:id/rating`,
    // never by create/update — the service strips them from client payloads.
    // Defaults keep pre-existing documents readable without a migration pass.
    averageRating: { type: Number, default: 0 },
    totalRatings: { type: Number, default: 0 },
    ratings: [
      {
        rating: { type: Number, min: 1, max: 5, required: true },
        comment: { type: String, trim: true, required: true },
        userId: { type: String, required: true },
        userName: { type: String, default: "" },
        createdAt: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

marketplaceListingSchema.index({ owner: 1, status: 1 });
marketplaceListingSchema.index({ category: 1, qualityGrade: 1, status: 1 });

module.exports = mongoose.model("MarketplaceListing", marketplaceListingSchema);
