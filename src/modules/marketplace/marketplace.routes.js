const express = require("express");
const auth = require("../../middleware/auth.middleware");
const optionalAuth = require("../../middleware/optionalAuth.middleware");
const role = require("../../middleware/role.middleware");
const upload = require("../../middleware/upload.middleware");
const controller = require("./marketplace.controller");
const validation = require("./marketplace.validation");

const router = express.Router();

/**
 * Produce Marketplace — MARKETPLACE_PORTAL_PLAN Step 2.
 *
 *   POST   /api/marketplace/upload       produce photo upload (seller)
 *   GET    /api/marketplace/listings        public browse (Approved only)
 *   GET    /api/marketplace/listings/stats  moderation counters (admin)
 *   GET    /api/marketplace/listings/mine   caller's own listings (any status)
 *   GET    /api/marketplace/listings/:id    single listing
 *   POST   /api/marketplace/listings        farmer / supplier / admin
 *   PUT    /api/marketplace/listings/:id    owner or admin
 *   DELETE /api/marketplace/listings/:id    owner or admin
 *   POST   /api/marketplace/listings/:id/rating   any signed-in user (1 per listing)
 *   GET    /api/marketplace/listings/:id/ratings  public — reviews, newest first
 *   GET    /api/marketplace/saved           my saved listings (any signed-in user)
 *   POST   /api/marketplace/saved/:id       heart a listing
 *   DELETE /api/marketplace/saved/:id       un-heart it (idempotent)
 *
 * Reads are unauthenticated on purpose: `(marketplace)/browse` has no
 * RouteGuard, so an anonymous visitor must be able to load the catalogue.
 * Writes require a token, and only moderation fields are admin-exclusive —
 * the service enforces owner-or-admin on update/delete.
 *
 * Static sub-routes are declared before "/listings/:id" so "stats"/"mine"
 * are not swallowed as an `:id` capture.
 */

/**
 * Standalone photo upload.
 *
 * Deliberately not tied to a listing id: the "New listing" form needs an
 * image URL *before* the listing exists, so `imageUrl` can be set on the
 * create call in the same submit.
 *
 * Multer reports its own failures as plain `Error`s with no `statusCode`,
 * which the global handler would render as 500. Map them to 400 (or 413 for
 * an over-size file) so the form shows a readable message.
 */
const uploadImage = (req, res, next) => {
  upload.single("image")(req, res, (err) => {
    if (!err) return next();
    if (!err.statusCode) {
      err.statusCode = err.code === "LIMIT_FILE_SIZE" ? 413 : 400;
    }
    next(err);
  });
};

router.post(
  "/upload",
  auth,
  role(["farmer", "supplier", "admin"]),
  uploadImage,
  controller.uploadImage
);

router.get(
  "/listings",
  optionalAuth,
  validation.listListingsValidation,
  controller.list
);
router.get("/listings/stats", auth, role(["admin"]), controller.stats);
router.get(
  "/listings/mine",
  auth,
  (req, res, next) => {
    req.query = { ...req.query, mine: "1" };
    next();
  },
  validation.listListingsValidation,
  controller.list
);
// `optionalAuth`, not `auth`: this is the public detail endpoint, but it also
// has to answer "have *I* hearted this?" and has to let an owner see their
// own un-published lot. Without it `req.user` is undefined, so `isOwner`
// could never be true and the seller of a pending listing got a 404 on their
// own detail page.
router.get("/listings/:id", optionalAuth, controller.get);

/**
 * Ratings & feedback — `auth` but deliberately no `role()`: any signed-in
 * user may rate (one per listing), so restricting it to `buyer` would turn a
 * visible control for farmers and suppliers into a 403. Sub-segment routes
 * (`/:id/rating`, `/:id/ratings`) cannot collide with `GET /listings/:id`,
 * which matches exactly one path segment.
 */
router.post(
  "/listings/:id/rating",
  auth,
  validation.ratingValidation,
  controller.rate
);
router.get(
  "/listings/:id/ratings",
  validation.ratingIdRules,
  controller.ratings
);

router.post(
  "/listings",
  auth,
  role(["farmer", "supplier", "admin"]),
  validation.createListingValidation,
  controller.create
);

router.put(
  "/listings/:id",
  auth,
  role(["farmer", "supplier", "admin"]),
  validation.updateListingValidation,
  controller.update
);

router.delete(
  "/listings/:id",
  auth,
  role(["farmer", "supplier", "admin"]),
  controller.remove
);

/**
 * Favourites (a reader's saved shelf).
 *
 * A sub-resource of the marketplace rather than its own mount: a heart is a
 * viewer's opinion *about* a listing, so the listing routes are where a reader
 * would look for it.
 *
 * Deliberately `auth` with no `role()`. Every row is keyed to `req.user.id`,
 * so there is no access control left to enforce — the restriction would only
 * be a policy, and the marketplace sidebar is shared by every `main`-portal
 * role (the Demand Board and Payments sit in that same group and narrow
 * themselves server-side per caller). Gating this to `buyer` would turn a
 * visible nav item for farmers and suppliers into a 403.
 *
 *   GET    /api/marketplace/saved          my saved listings (Approved only)
 *   POST   /api/marketplace/saved/:id      heart a listing
 *   DELETE /api/marketplace/saved/:id      un-heart it (idempotent)
 */
router.get("/saved", auth, controller.savedList);

router.post("/saved/:id", auth, validation.savedListingRules, controller.save);

router.delete(
  "/saved/:id",
  auth,
  validation.savedListingRules,
  controller.unsave
);

module.exports = router;
