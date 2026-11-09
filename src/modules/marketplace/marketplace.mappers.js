const { dateOnly } = require("../../utils/dates");

/**
 * Marketplace mappers.
 *
 * The DB keeps the flat field names that `admin.mappers.js` already renders
 * (`produceName`, `quantityAvailableKg`, `askingPricePerKg`, ...). This file
 * projects them onto the frontend's `ProduceListing` interface from
 * `src/types/index.ts`, which uses different names (`cropName`, `quantityKg`,
 * `pricePerKgBdt`, ...).
 *
 * Nothing here renames a DB field — the two shapes coexist.
 */

const CATEGORY_UNION = [
  "Cereal",
  "Pulse",
  "Oilseed",
  "Vegetable",
  "Fruit",
  "Cash Crop",
];

/** Admin seed uses prose categories ("Cereal Grains") that don't match the
 *  frontend's union. Collapse both vocabularies onto the 6 allowed values. */
const CATEGORY_ALIASES = {
  cereal: "Cereal",
  cereals: "Cereal",
  "cereal grain": "Cereal",
  "cereal grains": "Cereal",
  grain: "Cereal",
  grains: "Cereal",
  "animal feed grain": "Cereal",
  "feed grain": "Cereal",
  pulse: "Pulse",
  pulses: "Pulse",
  legume: "Pulse",
  legumes: "Pulse",
  oilseed: "Oilseed",
  oilseeds: "Oilseed",
  oil: "Oilseed",
  vegetable: "Vegetable",
  vegetables: "Vegetable",
  "tubers & vegetables": "Vegetable",
  "tubers and vegetables": "Vegetable",
  tuber: "Vegetable",
  fruit: "Fruit",
  fruits: "Fruit",
  "cash crop": "Cash Crop",
  "cash crops": "Cash Crop",
};

function normalizeCategory(raw) {
  const value = String(raw || "").trim();
  if (!value) return "Cereal";
  if (CATEGORY_UNION.includes(value)) return value;
  const mapped = CATEGORY_ALIASES[value.toLowerCase()];
  return mapped || "Cereal";
}

/**
 * Mongo filter value for a category query.
 *
 * The UI sends a union member ("Vegetable") but legacy/admin records store
 * prose ("Tubers & Vegetables"), so an exact match returns nothing. Instead,
 * collect every alias that normalises to the requested union value and match
 * any of them, case-insensitively. `normalizeCategory` stays the single
 * source of truth for what maps to what.
 */
function categoryQuery(raw) {
  const target = normalizeCategory(raw);
  const escape = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

  const aliases = Object.entries(CATEGORY_ALIASES)
    .filter(([, mapped]) => mapped === target)
    .map(([alias]) => alias);

  aliases.push(target.toLowerCase());

  return new RegExp(`^(${[...new Set(aliases)].map(escape).join("|")})$`, "i");
}

const num = (v, fallback = 0) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
};

const str = (v, fallback = "") => (v === undefined || v === null ? fallback : String(v));

/**
 * Seed records carry no image. An empty `src` renders a broken-image icon in
 * every card, so fall back to a placeholder served from the *frontend's*
 * public/ folder (the URL is relative, and `<img src>` resolves against the
 * page origin, not this API's).
 */
const LISTING_PLACEHOLDER_IMAGE = "/listing-placeholder.svg";

/** "Mohiuddin Khan" → "MK". Used when no avatar has been uploaded yet. */
function initials(name) {
  const parts = String(name || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (!parts.length) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/** DB document → frontend `ProduceListing` (plus owner/status for manage views). */
function mapListing(doc) {
  return {
    id: String(doc._id),
    owner: doc.owner ? String(doc.owner) : "",

    farmerName: str(doc.farmerName),
    farmerPhone: str(doc.farmerPhone),
    farmerLocation: str(doc.farmerLocation) || str(doc.locationHub),
    farmerAvatar: str(doc.farmerAvatar) || initials(doc.farmerName),

    cropName: str(doc.produceName),
    variety: str(doc.variety),
    category: normalizeCategory(doc.category),

    quantityKg: num(doc.quantityAvailableKg),
    pricePerKgBdt: num(doc.askingPricePerKg),

    qualityGrade: str(doc.qualityGrade, "Pending Inspection"),
    // Verification is an explicit flag set when a quality report is attached
    // (Phase 4) or approved by an admin — it is NOT inferred from the grade,
    // otherwise every listing would read as verified just for claiming Grade A.
    isVerified: !!doc.isVerified,

    // Seller-supplied detail. Empty string means "not declared", which the
    // manage form renders as a placeholder rather than hiding the row.
    storageCondition: str(doc.storageCondition),
    lotCode: str(doc.lotCode),
    certification: str(doc.certification),
    sampleAvailable: !!doc.sampleAvailable,
    availableFrom: str(doc.availableFrom),

    harvestDate: str(doc.harvestDate),
    availableUntil: str(doc.availableUntil),
    imageUrl: str(doc.imageUrl) || LISTING_PLACEHOLDER_IMAGE,
    description: str(doc.description),
    minimumOrderKg: Math.max(1, num(doc.minimumOrderKg, 1)),
    location: str(doc.location) || str(doc.locationHub),
    district: str(doc.district),
    tags: Array.isArray(doc.tags) ? doc.tags.map(String) : [],
    totalSoldKg: num(doc.totalSoldKg),
    listedAt: str(doc.listedDate) || dateOnly(doc.createdAt),

    // Ratings summary — server-owned, recomputed on every rating submission.
    // `num()` so documents written before these fields existed read as 0
    // rather than `undefined` (list/detail both run under `.lean()`, where
    // mongoose never applies schema defaults).
    averageRating: num(doc.averageRating),
    totalRatings: num(doc.totalRatings),

    // Manage-view extras (not part of ProduceListing, ignored by browse UI)
    status: str(doc.status, "Pending Review"),
    harvestLot: doc.harvestLot ? String(doc.harvestLot) : "",
    qualityReport: doc.qualityReport ? String(doc.qualityReport) : "",
    // Set while an inspection request for this lot is still open (see the
    // model) — the seller's manage view uses it to render the wait state
    // instead of firing a second request at a 409.
    inspectionRequestedAt: str(doc.inspectionRequestedAt),
  };
}

module.exports = { mapListing, normalizeCategory, categoryQuery, CATEGORY_UNION };
