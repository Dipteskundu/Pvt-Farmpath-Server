require("dotenv").config();

const mongoose = require("mongoose");
const MarketplaceListing = require("../../database/models/MarketplaceListing");
const Product = require("../../database/models/Product");

/**
 * Ratings migration — `npm run migrate:ratings`.
 *
 * The rating feature is additive: `averageRating`, `totalRatings` and
 * `ratings` were added to both catalogue schemas with defaults, so documents
 * written before the feature existed read as `0 / 0 / []` through mongoose
 * hydrated reads. This script makes that explicit in the stored documents and
 * repairs the denormalised summary wherever the array and the counters have
 * drifted (a rating submitted while a summary field was missing, for
 * example).
 *
 * Safe to re-run: it only ever touches documents whose stored values differ
 * from the recomputed truth.
 */

const connectDB = async () => {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log("MongoDB connected for ratings migration");
};

/** Recompute `{ averageRating, totalRatings }` from a document's array. */
function summarise(doc) {
  const ratings = Array.isArray(doc.ratings) ? doc.ratings : [];
  const total = ratings.length;
  const sum = ratings.reduce((acc, r) => acc + (Number(r.rating) || 0), 0);
  return {
    ratings,
    totalRatings: total,
    averageRating: total ? Math.round((sum / total) * 10) / 10 : 0,
  };
}

/** Returns true when the stored summary disagrees with the array. */
function needsRepair(doc) {
  const { totalRatings, averageRating } = summarise(doc);
  return (
    (Number(doc.totalRatings) || 0) !== totalRatings ||
    Math.abs((Number(doc.averageRating) || 0) - averageRating) > 0.05 ||
    !Array.isArray(doc.ratings)
  );
}

async function migrateModel(Model, label) {
  const docs = await Model.find({}).lean();
  let repaired = 0;

  for (const doc of docs) {
    if (!needsRepair(doc)) continue;
    const { ratings, totalRatings, averageRating } = summarise(doc);
    await Model.updateOne(
      { _id: doc._id },
      { $set: { ratings, totalRatings, averageRating } }
    );
    repaired += 1;
  }

  console.log(`✓ ${label}: ${repaired} of ${docs.length} document(s) migrated`);
}

const run = async () => {
  try {
    await connectDB();
    await migrateModel(MarketplaceListing, "Marketplace listings");
    await migrateModel(Product, "Input products");
    process.exit(0);
  } catch (error) {
    console.error("Ratings migration failed:", error);
    process.exit(1);
  }
};

run();
