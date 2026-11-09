require("dotenv").config();

const mongoose = require("mongoose");
const Product = require("../../database/models/Product");
const User = require("../../database/models/User");
const { inputs } = require("./inputs.data");

/**
 * Additive farm-input seeder — `npm run seed:inputs`.
 *
 * Upserts each product by its natural key (`name`) and touches nothing else.
 * No collection is dropped, so it is safe to re-run: products a supplier
 * created through the UI use different names and never match a key here.
 *
 * The supplier is resolved from `supplier@demo.com` at run time rather than
 * stored in the data file — a hard-coded ObjectId would break the moment
 * `npm run seed` recreated the users. Without that account the rows still
 * seed, but ownerless, which means only an admin could ever edit them.
 */
const connectDB = async () => {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log("MongoDB connected for input seeding");
};

const run = async () => {
  try {
    await connectDB();

    const supplier = await User.findOne({ email: "supplier@demo.com" })
      .select("name")
      .lean();

    if (!supplier) {
      console.warn(
        "! supplier@demo.com not found — inputs will seed unowned (admin-visible only)"
      );
    }
    const owner = supplier ? supplier._id : null;

    let inserted = 0;
    let updated = 0;

    for (const record of inputs) {
      const result = await Product.updateOne(
        { name: record.name },
        { $set: { ...record, supplier: owner } },
        { upsert: true }
      );

      if (result.upsertedCount) inserted += 1;
      else updated += result.modifiedCount;
    }

    const total = await Product.countDocuments({});
    const active = await Product.countDocuments({ isActive: true });
    const low = await Product.countDocuments({ isActive: true, stock: { $lte: 10 } });

    console.log(`✓ Farm inputs synced: ${inserted} inserted, ${updated} updated`);
    console.log(`  ${total} products total, ${active} active, ${low} low on stock`);

    process.exit(0);
  } catch (error) {
    console.error("Input seeding failed:", error);
    process.exit(1);
  }
};

run();
