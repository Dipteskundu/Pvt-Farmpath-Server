const { body, query, param } = require("express-validator");

const GRADES = ["Grade A", "Grade B", "Grade C"];

/** Seller-declared quality credentials shown on the public catalogue. */
const CERTIFICATIONS = ["None", "GAP Certified", "Organic"];

/** How the lot is kept until it ships — same vocabulary as `Harvest.storageCondition`. */
const STORAGE_CONDITIONS = ["Silo", "Ambient Warehouse", "Cold Storage", "Farm Shed"];

/**
 * Returns a FRESH set of chains every call.
 *
 * This must be a factory, not a shared array: `chain.optional()` mutates the
 * chain in place and returns the same instance, so deriving update rules with
 * `listingBodyRules.map(r => r.optional())` also made the *create* rules
 * optional. The result was a create endpoint that silently accepted a body
 * with no produceName and fell through to Mongoose's required-check, which
 * reports `{"message":["..."]}` instead of a clean string.
 */
function listingBodyRules() {
  return [
    body("produceName")
      .exists()
      .withMessage("Produce name is required")
      .bail()
      .trim()
      .notEmpty()
      .withMessage("Produce name is required")
      .isLength({ max: 120 })
      .withMessage("Produce name must be 120 characters or fewer"),

    body("quantityAvailableKg")
      .optional({ values: "falsy" })
      .isFloat({ min: 0 })
      .withMessage("Quantity must be zero or greater"),

    body("askingPricePerKg")
      .optional({ values: "falsy" })
      .isFloat({ min: 0 })
      .withMessage("Price must be zero or greater"),

    body("minimumOrderKg")
      .optional()
      .isFloat({ min: 1 })
      .withMessage("Minimum order must be at least 1 kg"),

    // Accepted so an admin/legacy client can still set it, but the seller's
    // own form never sends this field — see `ListingPayload`. The value a new
    // listing starts with comes from the model's "Pending Inspection" default.
    body("qualityGrade")
      .optional()
      .isIn(GRADES)
      .withMessage(`Grade must be one of: ${GRADES.join(", ")}`),

    // Raw strings are accepted here; `marketplace.mappers.normalizeCategory`
    // folds admin-style prose ("Cereal Grains") onto the frontend's union.
    body("category")
      .optional({ values: "falsy" })
      .isString()
      .withMessage("Category must be a string"),

    // Required on create: a listing without a photo is rejected by the form
    // before it gets here, and this stops a bare API call from publishing one.
    body("imageUrl")
      .exists()
      .withMessage("A listing photo is required")
      .bail()
      .trim()
      .notEmpty()
      .withMessage("A listing photo is required")
      .isURL({ require_protocol: true, require_tld: false })
      .withMessage("Image URL must be a valid URL"),

    body("location")
      .optional()
      .isLength({ max: 160 })
      .withMessage("Location must be 160 characters or fewer"),

    body("district")
      .optional()
      .isLength({ max: 80 })
      .withMessage("District must be 80 characters or fewer"),

    // ── seller-supplied detail ────────────────────────────────
    // `.custom` rather than `isIn(...)` so an empty string (the form's
    // "not declared" placeholder) and a missing key both pass on create *and*
    // on update — `updateListingValidation` re-applies `.optional()` to every
    // rule, which only skips `undefined`.
    body("storageCondition")
      .optional()
      .custom((v) => !v || STORAGE_CONDITIONS.includes(v))
      .withMessage(`Storage condition must be one of: ${STORAGE_CONDITIONS.join(", ")}`),

    body("lotCode")
      .optional()
      .trim()
      .isLength({ max: 40 })
      .withMessage("Lot code must be 40 characters or fewer"),

    body("certification")
      .optional()
      .custom((v) => !v || CERTIFICATIONS.includes(v))
      .withMessage(`Certification must be one of: ${CERTIFICATIONS.join(", ")}`),

    body("sampleAvailable")
      .optional()
      .isBoolean()
      .withMessage("sampleAvailable must be true or false"),

    body("availableFrom")
      .optional()
      .isLength({ max: 40 })
      .withMessage("Available-from must be 40 characters or fewer"),
  ];
}

exports.createListingValidation = listingBodyRules();

// `.optional()` on every rule: a partial PATCH must not require the full body.
exports.updateListingValidation = listingBodyRules().map((rule) => rule.optional());

exports.listListingsValidation = [
  query("category").optional().isString().withMessage("Category must be a string"),
  query("grade").optional().isIn(GRADES).withMessage("Unknown quality grade"),
  query("minPrice")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("minPrice must be zero or greater"),
  query("maxPrice")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("maxPrice must be zero or greater"),
];

/**
 * `:id` on the saved routes is a *listing* id in the path.
 *
 * Worth its own rule: without it a request for `/saved/not-an-id` reaches
 * Mongoose, throws a CastError, and surfaces as a 500 instead of the clean 400
 * the frontend knows how to render.
 */
exports.savedListingRules = [
  param("id").isMongoId().withMessage("Listing id must be a valid id"),
];

/**
 * Rating submission — whole numbers 1–5 (no half stars) and a comment with
 * real content. The 10-character floor mirrors the products module so both
 * halves of the marketplace reject the same junk.
 *
 * Kept as a factory-free shared pair here: unlike `listingBodyRules`, nothing
 * derives an optional variant of these, so `chain.optional()` mutation — the
 * bug the listing rules document warns about — cannot bite.
 */
exports.ratingValidation = [
  param("id").isMongoId().withMessage("Listing id must be a valid id"),
  body("rating")
    .isInt({ min: 1, max: 5 })
    .withMessage("Rating must be an integer between 1 and 5"),
  body("comment")
    .trim()
    .isLength({ min: 10, max: 2000 })
    .withMessage("Comment must be between 10 and 2000 characters"),
];

/** The read side only needs a sane path id. */
exports.ratingIdRules = [
  param("id").isMongoId().withMessage("Listing id must be a valid id"),
];
