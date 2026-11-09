const mongoose = require("mongoose");

/**
 * SavedListing — a reader's shortlist of marketplace produce.
 *
 * Favourites are a *viewer* fact, not a property of the listing: the same lot
 * can be hearted by any number of buyers, and storing the watchers on the
 * `MarketplaceListing` document would publish who is interested in a lot to
 * everyone who reads it. One row per (buyer, listing) keeps that private and
 * lets `GET /marketplace/listings` answer "have *I* saved this?" with a single
 * `$in` query instead of one per card.
 *
 * Two things the rest of the code depends on:
 *
 *   - The unique compound index is the whole concurrency story for the heart.
 *     A double-click issues two upserts; the second one either matches the row
 *     the first created or the index rejects it. There is no read-then-write
 *     window to close because the write itself is idempotent.
 *   - Rows are only ever created for a *published* lot (the service 404s
 *     otherwise) and are deleted alongside it in `deleteListing`, so this
 *     table cannot accumulate references to listings that no longer exist.
 */
const savedListingSchema = new mongoose.Schema(
  {
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Please add a saver"],
    },
    listing: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "MarketplaceListing",
      required: [true, "Please add a listing"],
    },
  },
  { timestamps: true }
);

savedListingSchema.index({ owner: 1, listing: 1 }, { unique: true });
/** The saved shelf reads one buyer's rows newest-first. */
savedListingSchema.index({ owner: 1, createdAt: -1 });

module.exports = mongoose.model("SavedListing", savedListingSchema);
