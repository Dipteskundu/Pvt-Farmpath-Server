require("dotenv").config();

const mongoose = require("mongoose");
const QualityRequest = require("../../database/models/QualityRequest");
const User = require("../../database/models/User");
const { inspections } = require("./quality.data");

/**
 * Additive quality seeder — `npm run seed:quality`.
 *
 * Upserts each assignment by its natural key (`batchCode`) and touches nothing
 * else. No collection is dropped, no other document is modified, so it is safe
 * to re-run: inspections raised through the UI use batch codes that do not
 * appear here and are therefore left alone.
 *
 * The owner is resolved from `inspector@demo.com` at run time rather than
 * stored in the data file — a hard-coded ObjectId would break the moment
 * `npm run seed` recreated the users. If that account is absent the records
 * still seed, but unowned, which means only an admin can see them.
 */
const connectDB = async () => {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log("MongoDB connected for quality seeding");
};

const run = async () => {
  try {
    await connectDB();

    const inspector = await User.findOne({ email: "inspector@demo.com" })
      .select("name")
      .lean();

    if (!inspector) {
      console.warn(
        "! inspector@demo.com not found — inspections will seed unassigned (admin-visible only)"
      );
    }

    const owner = inspector ? String(inspector._id) : null;
    const inspectorName = (inspector && inspector.name) || "";

    let inserted = 0;
    let updated = 0;

    for (const record of inspections) {
      const result = await QualityRequest.updateOne(
        { batchCode: record.batchCode },
        {
          $set: {
            ...record,
            owner,
            inspectorName,
          },
        },
        { upsert: true }
      );

      if (result.upsertedCount) inserted += 1;
      else updated += result.modifiedCount;
    }

    const total = await QualityRequest.countDocuments({});
    const open = await QualityRequest.countDocuments({ status: { $ne: "completed" } });

    console.log(`✓ Quality inspections synced: ${inserted} inserted, ${updated} updated`);
    console.log(`  ${total} inspections total, ${open} still open`);

    process.exit(0);
  } catch (error) {
    console.error("Quality seeding failed:", error);
    process.exit(1);
  }
};

run();
