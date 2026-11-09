require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const User = require("../models/User");
const Crop = require("../models/Crop");
const Advisory = require("../models/Advisory");
const MarketPrice = require("../models/MarketPrice");
const FarmVerification = require("../models/FarmVerification");
const AuditLog = require("../models/AuditLog");
const MarketplaceListing = require("../models/MarketplaceListing");
const Order = require("../models/Order");
const Payment = require("../models/Payment");
const QualityRequest = require("../models/QualityRequest");
const Delivery = require("../models/Delivery");
const TrainingCourse = require("../models/TrainingCourse");
const TrainingProgress = require("../models/TrainingProgress");
const Report = require("../models/Report");
const Dispute = require("../models/Dispute");
const Notification = require("../models/Notification");

const adminSeed = require("./admin.seed");
const farmerSeed = require("./farmer.seed");
const reference = require("./reference.data");
const { resolveListingOwners } = require("./marketplace.owners");
const { resolveDisputeOwners } = require("./dispute.owners");

const DISPLAY_ROLE_TO_BACKEND = {
  Farmer: "farmer",
  Agronomist: "support",
  "Extension Officer": "inspector",
  "Platform Admin": "admin",
};

/** Removes frontend-only `id` fields before inserting into mongoose. */
const strip = (record) => {
  const copy = { ...record };
  delete copy.id;
  Object.keys(copy).forEach((key) => {
    if (copy[key] === undefined) delete copy[key];
  });
  return copy;
};

const connectDB = async () => {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log("MongoDB Connected for seeding");
};

const hash = async (password) => bcrypt.hash(password, await bcrypt.genSalt(10));

const seedDemoUsers = async () => {
  const profile = farmerSeed.initialFarmerProfile;

  const demoUsers = [
    {
      name: profile.fullName,
      email: "farmer@demo.com",
      password: "demo123",
      role: "farmer",
      roles: ["farmer"],
      phone: profile.phoneNumber,
      address: `${profile.primaryLocation.village}, ${profile.primaryLocation.upazila}`,
      displayRole: "Farmer",
      region: `${profile.primaryLocation.division} (${profile.primaryLocation.district})`,
      nationalIdNumber: profile.nationalId,
      nationalId: profile.nationalId,
      verificationBadge: true,
      accountStatus: "Active",
      profileImage: profile.avatarUrl,
      dateOfBirth: profile.dateOfBirth,
      farmingExperienceYears: profile.farmingExperienceYears,
      primaryLocation: {
        division: profile.primaryLocation.division,
        district: profile.primaryLocation.district,
        upazila: profile.primaryLocation.upazila,
        village: profile.primaryLocation.village,
        lat: profile.primaryLocation.coordinates.lat,
        lng: profile.primaryLocation.coordinates.lng,
      },
      bankDetails: {
        accountHolderName: profile.bankDetails.accountName,
        accountNumber: profile.bankDetails.accountNumber,
        bankName: profile.bankDetails.bankName,
        branchName: profile.bankDetails.branchName,
        routingNumber: profile.bankDetails.routingNumber,
      },
      certifications: profile.certifications,
      farmerClub: profile.farmerClub,
      totalAcreage: profile.totalAcreage,
      registeredSince: profile.registeredSince,
    },
    {
      name: "Demo Multi-Role User",
      email: "multi@demo.com",
      password: "demo123",
      role: "farmer",
      roles: ["farmer", "buyer", "supplier", "inspector"],
      phone: "+1234567891",
      address: "456 Business Ave, Commerce City",
      verificationBadge: true,
    },
    {
      name: "Demo Admin",
      email: "admin@demo.com",
      password: "demo123",
      role: "admin",
      roles: ["admin"],
      displayRole: "Platform Admin",
      phone: "+1234567892",
      address: "789 Admin Plaza, Government District",
      region: "National (Head Office)",
      verificationBadge: true,
    },
    {
      name: "Demo Buyer",
      email: "buyer@demo.com",
      password: "demo123",
      role: "buyer",
      roles: ["buyer"],
      phone: "+1234567893",
      address: "321 Market Street, Shopping District",
    },
    {
      // Referenced by `inputs.data.js` (every farm input's `supplier`) and
      // `marketplace.data.js` (three listings' `ownerEmail`). Without this
      // account both seeds fall back to *unowned* records — `supplier: null`
      // documents that later `save()` calls reject because the path is
      // required, breaking product edits and ratings on seeded inputs.
      name: "Demo Supplier",
      email: "supplier@demo.com",
      password: "demo123",
      role: "supplier",
      roles: ["supplier"],
      displayRole: "Supplier",
      phone: "+1234567894",
      address: "123 Warehouse Road, Industrial Area",
      region: "National (Distribution Hub)",
      verificationBadge: true,
    },
  ];

  const platformUsers = adminSeed.initialAdminUsers.map((u) => {
    const role = DISPLAY_ROLE_TO_BACKEND[u.role] || "farmer";
    return {
      name: u.name,
      email: u.email,
      role,
      roles: [role],
      displayRole: u.role,
      phone: u.phone,
      address: u.region,
      region: u.region,
      nationalIdNumber: u.nationalIdNumber,
      verificationBadge: !!u.verificationBadge,
      accountStatus: u.status,
      isActive: u.status !== "Suspended",
      registrationDate: u.registrationDate,
    };
  });

  const all = [...demoUsers, ...platformUsers];

  // Upsert (never delete) so existing farmer-owned records keep their owner id
  let upserted = 0;
  for (const userData of all) {
    const { registrationDate, ...fields } = userData;
    const update = {
      ...fields,
      password: await hash(userData.password || "demo123"),
      isActive: fields.isActive !== undefined ? fields.isActive : true,
      accountStatus: fields.accountStatus || "Active",
      updatedAt: new Date(),
    };
    if (registrationDate) update.createdAt = new Date(registrationDate);
    await User.updateOne({ email: userData.email }, { $set: update }, { upsert: true });
    upserted += 1;
  }

  const demoFarmer = await User.findOne({ email: "farmer@demo.com" });

  console.log(`✓ Upserted ${upserted} user accounts (${platformUsers.length} platform + 4 demo)`);
  return { demoFarmer, platformUsers };
};

const replaceCollection = async (Model, records, label) => {
  await Model.deleteMany({});
  if (records.length) await Model.insertMany(records.map(strip));
  console.log(`✓ Seeded ${records.length} ${label}`);
};

const seedTraining = async () => {
  await TrainingCourse.deleteMany({});
  await TrainingProgress.deleteMany({});

  const completionRates = [92, 64, 88, 41];
  const updatedDates = ["2026-02-20", "2026-03-02", "2026-01-28", "2026-03-11"];

  const courses = farmerSeed.initialTrainingCourses.map((course, index) => ({
    title: course.title,
    category: course.category,
    instructor: course.instructor,
    durationMinutes: course.durationMinutes,
    difficulty: course.difficulty,
    lessonsCount: course.lessonsCount,
    rating: course.rating,
    thumbnail: course.thumbnail,
    description: course.description,
    syllabus: course.syllabus.map((lesson) => ({
      title: lesson.title,
      duration: lesson.duration,
    })),
    targetRegion: "All Divisions (National)",
    status: "Published",
    enrolledCount: 1240 + index * 375,
    completionRatePercent: completionRates[index] || 50,
    lastUpdated: updatedDates[index] || "2026-03-01",
    feedbackScore: course.rating,
  }));

  const inserted = await TrainingCourse.insertMany(courses);
  console.log(`✓ Seeded ${inserted.length} training courses`);

  const demoFarmer = await User.findOne({ email: "farmer@demo.com" });
  if (demoFarmer) {
    const progress = farmerSeed.initialTrainingCourses
      .map((course, index) => {
        const completed = course.syllabus
          .map((lesson, lessonIndex) => (lesson.completed ? lessonIndex : -1))
          .filter((i) => i >= 0);
        if (!completed.length) return null;
        return {
          user: demoFarmer._id,
          course: inserted[index]._id,
          completedLessonIndexes: completed,
        };
      })
      .filter(Boolean);
    if (progress.length) await TrainingProgress.insertMany(progress);
    console.log(`✓ Seeded ${progress.length} training progress records`);
  }
};

const seedNotifications = async () => {
  await Notification.deleteMany({});
  const owners = await User.find({
    email: { $in: ["farmer@demo.com", "multi@demo.com"] },
  }).lean();
  if (!owners.length) {
    console.log("- Skipped notifications (no demo farmer found)");
    return;
  }
  const owner = owners[0]._id;
  const docs = farmerSeed.initialFarmerNotifications.map((n) => ({
    owner,
    type: n.type,
    title: n.title,
    message: n.message,
    timestamp: n.timestamp,
    isRead: n.isRead,
    actionLink: n.actionLink || "",
    priority: n.priority,
  }));
  await Notification.insertMany(docs);
  console.log(`✓ Seeded ${docs.length} farmer notifications`);
};

const run = async () => {
  try {
    await connectDB();

    const { demoFarmer } = await seedDemoUsers();

    await replaceCollection(Crop, reference.masterCrops, "master crops");
    await replaceCollection(Advisory, reference.advisories, "agronomic advisories");
    await replaceCollection(MarketPrice, reference.marketPrices, "market price records");
    await replaceCollection(FarmVerification, reference.farmVerifications, "farm verification requests");
    await replaceCollection(AuditLog, reference.auditLogs, "audit log entries");

    await replaceCollection(
      MarketplaceListing,
      // `ownerEmail` markers -> real `owner` ids, so the seller portals start
      // with a populated My Listings shelf and `GET /orders/sales` has rows
      // to resolve. See `marketplace.owners.js`.
      await resolveListingOwners(adminSeed.initialMarketplaceAdminListings),
      "marketplace listings"
    );
    await replaceCollection(Order, adminSeed.initialOrderAudits, "order audits");
    await replaceCollection(Payment, adminSeed.initialPaymentRecords, "payment records");
    await replaceCollection(QualityRequest, adminSeed.initialQualityReports, "quality reports");
    await replaceCollection(Delivery, adminSeed.initialLogisticsFleet, "logistics fleet records");
    await replaceCollection(Report, adminSeed.initialAgritechReports, "agritech reports");
    // `ownerEmail` markers -> real `owner` ids, so the buyer's My Disputes
    // shelf starts with the two cases the demo account opened. See
    // `dispute.owners.js`.
    await replaceCollection(Dispute, await resolveDisputeOwners(adminSeed.initialDisputes), "dispute cases");

    await seedTraining();
    await seedNotifications();

    console.log("\n✓ All reference and oversight data seeded successfully!");
    console.log("Demo Credentials:");
    console.log("  Farmer:      farmer@demo.com / demo123");
    console.log("  Multi-Role:  multi@demo.com / demo123");
    console.log("  Admin:       admin@demo.com / demo123");
    console.log("  Buyer:       buyer@demo.com / demo123");
    if (demoFarmer) console.log(`  Profile:     ${demoFarmer.name} <${demoFarmer.email}>`);

    await mongoose.connection.close();
  } catch (error) {
    console.error(`Error seeding database: ${error.message}`);
    await mongoose.connection.close();
    process.exit(1);
  }
};

run();
