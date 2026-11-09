const MarketplaceListing = require("../../database/models/MarketplaceListing");
const SavedListing = require("../../database/models/SavedListing");
const { mapListing, categoryQuery } = require("./marketplace.mappers");
const { today } = require("../../utils/dates");

const httpError = (message, statusCode) => {
  const err = new Error(message);
  err.statusCode = statusCode;
  return err;
};

const isAdmin = (user) =>
  !!user && (user.role === "admin" || (Array.isArray(user.roles) && user.roles.includes("admin")));

const PUBLIC_STATUS = "Approved";

/**
 * Why a listing may not enter `Approved`, or `""` when it may.
 *
 * A lot cannot trade on the seller's word: approval needs a completed quality
 * report attached (`qualityReport`, written by `POST /api/quality/:id/submit`
 * and never by the seller), and a lot the inspector graded `Rejected` stays
 * blocked however many reports it collects — the remedy there is to Flag it,
 * not to publish it.
 *
 * Kept as a reason rather than a thrown error so both moderation paths (this
 * service and the admin CRUD router) can enforce it *and* render the same
 * words on a disabled button before anyone clicks.
 */
function approvalBlockReason(doc) {
  if (!doc || !doc.qualityReport) return "Awaiting inspection report";
  if (String(doc.qualityGrade) === "Rejected") return "Inspection rejected this lot";
  return "";
}

function assertApprovable(doc) {
  const reason = approvalBlockReason(doc);
  if (reason) throw httpError(reason, 409);
}

/**
 * Build the Mongo filter for GET /marketplace/listings.
 *
 * Three modes:
 *   - default        → public browse, only `Approved` listings
 *   - ?mine=1        → the caller's own listings, any status (manage view)
 *   - ?status=X      → explicit status override (admin moderation)
 */
function buildFilter(query = {}, user) {
  const filter = {};

  if (query.mine === "1" || query.mine === "true") {
    if (!user) throw httpError("Authentication required to list your own produce", 401);
    if (!isAdmin(user)) filter.owner = user.id;
  } else if (query.status) {
    // Explicit status override is moderation-only. Without this, an anonymous
    // caller could pass ?status=Flagged and read listings that are not public.
    if (!isAdmin(user)) throw httpError("Access denied", 403);
    filter.status = String(query.status);
  } else if (isAdmin(user) && query.all === "1") {
    // admin asked for the whole book
  } else {
    filter.status = PUBLIC_STATUS;
  }

  // Union value from the UI vs. prose stored by admin/legacy records — matched
  // through the alias table rather than exact equality (see mappers).
  if (query.category) filter.category = categoryQuery(query.category);
  if (query.grade) filter.qualityGrade = String(query.grade);
  if (query.district) {
    filter.district = { $regex: String(query.district).trim(), $options: "i" };
  }
  if (query.verifiedOnly === "1" || query.verifiedOnly === "true") {
    filter.isVerified = true;
  }

  const minPrice = Number(query.minPrice);
  const maxPrice = Number(query.maxPrice);
  if (Number.isFinite(minPrice) || Number.isFinite(maxPrice)) {
    filter.askingPricePerKg = {};
    if (Number.isFinite(minPrice)) filter.askingPricePerKg.$gte = minPrice;
    if (Number.isFinite(maxPrice)) filter.askingPricePerKg.$lte = maxPrice;
  }

  if (query.search) {
    const rx = { $regex: String(query.search).trim(), $options: "i" };
    filter.$or = [
      { produceName: rx },
      { variety: rx },
      { farmerName: rx },
      { location: rx },
      { district: rx },
      { locationHub: rx },
    ];
  }

  return filter;
}

/**
 * Listing ids the caller has hearted, as a Set.
 *
 * `GET /listings` runs under `optionalAuth`, so `user` is routinely undefined
 * for an anonymous visitor — an empty set is the right answer there, not a 401.
 */
async function savedIdsFor(user) {
  if (!user) return new Set();
  const rows = await SavedListing.find({ owner: user.id }).select("listing").lean();
  return new Set(rows.map((r) => String(r.listing)));
}

/** Stamp `saved` onto already-mapped listings for the current viewer. */
function markSaved(listings, ids) {
  listings.forEach((listing) => {
    listing.saved = ids.has(String(listing.id));
  });
  return listings;
}

async function listListings(query, user) {
  const filter = buildFilter(query, user);
  const docs = await MarketplaceListing.find(filter)
    .sort({ createdAt: -1, _id: -1 })
    .lean();
  const listings = docs.map(mapListing);
  if (!listings.length) return listings;
  // One extra query for the whole page, never one per card: the heart has to
  // render correctly across the catalogue, and a per-row round trip would turn
  // a single browse into fifty requests.
  return markSaved(listings, await savedIdsFor(user));
}

async function getListing(id, user) {
  const doc = await MarketplaceListing.findById(id).lean();
  if (!doc) throw httpError("Listing not found", 404);

  const isOwner =
    !!user && doc.owner && String(doc.owner) === String(user.id);

  // Private statuses (pending/flagged/rejected) are only visible to their
  // owner and to admins — the public must never see unapproved produce.
  if (!isOwner && !isAdmin(user) && String(doc.status) !== PUBLIC_STATUS) {
    throw httpError("Listing not found", 404);
  }
  return { ...mapListing(doc), saved: (await savedIdsFor(user)).has(String(doc._id)) };
}

async function createListing(user, payload = {}) {
  const loc = user.primaryLocation || {};
  const place = [loc.village, loc.upazila, loc.district].filter(Boolean).join(", ");

  // Ratings are server-owned — a create must not seed a fake 5-star average.
  delete payload.ratings;
  delete payload.averageRating;
  delete payload.totalRatings;

  const doc = await MarketplaceListing.create({
    ...payload,
    owner: user.id,
    farmerName: payload.farmerName || user.name || "",
    farmerPhone: payload.farmerPhone || user.phone || "",
    farmerLocation: payload.farmerLocation || place || user.address || user.region || "",
    district: payload.district || loc.district || "",
    listedDate: payload.listedDate || today(),
    status: payload.status || "Pending Review",
    totalSoldKg: payload.totalSoldKg || 0,
  });
  return mapListing(doc.toObject());
}

async function loadOwned(id, user) {
  const doc = await MarketplaceListing.findById(id);
  if (!doc) throw httpError("Listing not found", 404);
  const owns = doc.owner && String(doc.owner) === String(user.id);
  if (!owns && !isAdmin(user)) {
    throw httpError("You do not have permission to modify this listing", 403);
  }
  return doc;
}

async function updateListing(id, user, payload = {}) {
  const doc = await loadOwned(id, user);

  // Moderation fields are admin-exclusive. Rejecting loudly beats silently
  // dropping them — a farmer who PATCHes `status: "Approved"` must not be
  // told 200 OK when nothing changed.
  if (!isAdmin(user)) {
    const attempted = ["status", "isVerified"].filter((f) => f in payload);
    if (attempted.length) {
      throw httpError(
        `Only an admin may set ${attempted.join(" or ")}`,
        403
      );
    }
  }

  // Never let an update reassign ownership, touch internal ids, or forge the
  // rating fields — those are recomputed only by `submitListingRating`.
  delete payload.owner;
  delete payload._id;
  delete payload.ratings;
  delete payload.averageRating;
  delete payload.totalRatings;

  // Approving is the one transition a report unlocks. `status` reaching
  // "Approved" from anyone but a god-mode caller already required the admin
  // check above; now it additionally requires the lot to have been inspected.
  if (payload.status === "Approved") assertApprovable(doc);

  Object.keys(payload).forEach((key) => {
    if (payload[key] === undefined || payload[key] === null) delete payload[key];
  });

  Object.assign(doc, payload);
  await doc.save();
  return mapListing(doc.toObject());
}

async function deleteListing(id, user) {
  const doc = await loadOwned(id, user);
  await doc.deleteOne();
  // Hearts are references, not copies: without this a buyer's shelf would keep
  // counting a lot that no longer exists, and `listSaved` would have to defend
  // against a dangling id on every read.
  await SavedListing.deleteMany({ listing: doc._id });
  return { success: true, id: String(doc._id) };
}

/**
 * The buyer's saved shelf, as full listings.
 *
 * Two steps on purpose. The `SavedListing` rows are the source of truth for
 * *what* was hearted, but the listings are re-read restricted to `Approved`:
 * a lot that has since been un-published disappears from the shelf without
 * being forgotten, so re-approving it puts the buyer's heart back exactly as
 * they left it. The dashboard card counts through here too, which is what
 * keeps the badge and the page in agreement.
 */
async function listSaved(user) {
  const rows = await SavedListing.find({ owner: user.id }).select("listing").lean();
  if (!rows.length) return [];

  const docs = await MarketplaceListing.find({
    _id: { $in: rows.map((r) => r.listing) },
    status: PUBLIC_STATUS,
  })
    .sort({ createdAt: -1, _id: -1 })
    .lean();

  return markSaved(docs.map(mapListing), new Set(docs.map((d) => String(d._id))));
}

/**
 * Heart a listing.
 *
 * Saving is a *buyer* action against the public catalogue, so a missing or
 * un-published lot 404s rather than quietly landing a row on a shelf that
 * `listSaved` would then have to hide. The upsert is written to be safe under
 * a double-click: the second call matches the row the first one created, and
 * even if both insert the unique compound index refuses the duplicate.
 */
async function saveListing(user, listingId) {
  const doc = await MarketplaceListing.findById(listingId)
    .select("_id status")
    .lean();
  if (!doc || String(doc.status) !== PUBLIC_STATUS) {
    throw httpError("Listing not found", 404);
  }

  await SavedListing.updateOne(
    { owner: user.id, listing: doc._id },
    { $setOnInsert: { owner: user.id, listing: doc._id } },
    { upsert: true }
  );
  return { saved: true, listingId: String(doc._id) };
}

/**
 * Remove a heart — deliberately idempotent.
 *
 * The UI only ever calls this for a row it has seen, so after a dropped
 * response the retry must not answer 404 and put a scary error on screen for a
 * bookkeeping success. A malformed id still 400s at the validation layer
 * before it can reach Mongoose' CastError.
 */
async function unsaveListing(user, listingId) {
  await SavedListing.deleteOne({ owner: user.id, listing: listingId });
  return { saved: false, listingId: String(listingId) };
}

/** KPI helper for the marketplace/farmer dashboards. */
async function marketplaceStats() {
  const [total, approved, pending] = await Promise.all([
    MarketplaceListing.countDocuments({}),
    MarketplaceListing.countDocuments({ status: PUBLIC_STATUS }),
    MarketplaceListing.countDocuments({ status: "Pending Review" }),
  ]);
  return { totalListings: total, approvedListings: approved, pendingReview: pending };
}

/**
 * Submit a rating + comment for a listing.
 *
 * Ratings describe the *public* catalogue, so only an `Approved` lot accepts
 * one — a pending or flagged listing 404s exactly as it does on the detail
 * endpoint, and the caller cannot probe for it. Any signed-in user may rate
 * (Option A: no purchase gate); one rating per user per listing.
 *
 * The write is a conditional atomic update rather than `doc.save()`:
 *
 * - `save()` revalidates *every* path on the document, so a listing carrying
 *   legacy fields that predate a schema constraint cannot be rated at all
 *   (the exact failure this replaced on seeded data).
 * - Repeating `"ratings.userId": { $ne }` inside the query closes the window
 *   where two concurrent submissions both pass the pre-read duplicate check.
 * - The aggregation pipeline recomputes the denormalised summary from the
 *   array itself, so the browse grid never has to recompute per row and the
 *   counters can never drift from the array that produced them.
 */
async function submitListingRating(user, listingId, { rating, comment }) {
  const doc = await MarketplaceListing.findById(listingId)
    .select("status ratings")
    .lean();
  if (!doc || String(doc.status) !== PUBLIC_STATUS) {
    throw httpError("Listing not found", 404);
  }

  const userId = String(user.id);
  if ((doc.ratings || []).some((r) => String(r.userId) === userId)) {
    throw httpError("You have already rated this listing", 400);
  }

  const entry = {
    rating,
    comment,
    userId,
    userName: user.name || user.email || "User",
    createdAt: new Date(),
  };

  const result = await MarketplaceListing.updateOne(
    { _id: listingId, status: PUBLIC_STATUS, "ratings.userId": { $ne: userId } },
    [
      // Stage 1 appends via $concatArrays (a pipeline stage — $push is an
      // update *operator* and is not allowed here). $ifNull keeps legacy
      // documents that predate the ratings path readable.
      {
        $set: {
          ratings: {
            $concatArrays: [{ $ifNull: ["$ratings", []] }, [entry]],
          },
        },
      },
      // Stage 2 recomputes the denormalised summary from the just-appended
      // array; it must be a separate stage because expressions inside one
      // stage all read the pre-stage document.
      {
        $set: {
          totalRatings: { $size: "$ratings" },
          averageRating: { $round: [{ $avg: "$ratings.rating" }, 1] },
        },
      },
    ]
  );

  if (result.matchedCount === 0) {
    // Re-read to report precisely: a lost race (already rated) or the lot
    // left `Approved` between the pre-check and the write.
    const again = await MarketplaceListing.findById(listingId)
      .select("status ratings")
      .lean();
    if (!again || String(again.status) !== PUBLIC_STATUS) {
      throw httpError("Listing not found", 404);
    }
    if ((again.ratings || []).some((r) => String(r.userId) === userId)) {
      throw httpError("You have already rated this listing", 400);
    }
    throw httpError("Listing not found", 404);
  }

  const fresh = await MarketplaceListing.findById(listingId)
    .select("averageRating totalRatings")
    .lean();

  return {
    success: true,
    averageRating: Number(fresh && fresh.averageRating) || 0,
    totalRatings: Number(fresh && fresh.totalRatings) || 0,
  };
}

/**
 * All ratings for a listing, newest first — public alongside the listing
 * itself (same visibility rule as `getListing`, so an owner can still read
 * reviews of their own un-published lot without the public seeing it).
 */
async function getListingRatings(listingId, user) {
  const doc = await MarketplaceListing.findById(listingId).lean();
  if (!doc) throw httpError("Listing not found", 404);

  const isOwner = !!user && doc.owner && String(doc.owner) === String(user.id);
  if (!isOwner && !isAdmin(user) && String(doc.status) !== PUBLIC_STATUS) {
    throw httpError("Listing not found", 404);
  }

  return (Array.isArray(doc.ratings) ? doc.ratings : [])
    .map((r) => ({
      rating: r.rating,
      comment: r.comment,
      userName: r.userName || "",
      userId: String(r.userId || ""),
      createdAt: r.createdAt,
    }))
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

module.exports = {
  listListings,
  getListing,
  createListing,
  updateListing,
  deleteListing,
  marketplaceStats,
  approvalBlockReason,
  assertApprovable,
  listSaved,
  saveListing,
  unsaveListing,
  submitListingRating,
  getListingRatings,
};
