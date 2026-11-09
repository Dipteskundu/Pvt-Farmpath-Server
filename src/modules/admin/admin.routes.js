const express = require("express");
const bcrypt = require("bcryptjs");
const { buildCrudRouter } = require("../_crud/crudFactory");
const auth = require("../../middleware/auth.middleware");
const role = require("../../middleware/role.middleware");
const { logAudit } = require("../../utils/audit");
const { today } = require("../../utils/dates");

const User = require("../../database/models/User");
const MarketplaceListing = require("../../database/models/MarketplaceListing");
const Order = require("../../database/models/Order");
const Payment = require("../../database/models/Payment");
const QualityRequest = require("../../database/models/QualityRequest");
const Delivery = require("../../database/models/Delivery");
const TrainingCourse = require("../../database/models/TrainingCourse");
const Report = require("../../database/models/Report");
const Dispute = require("../../database/models/Dispute");
const FarmVerification = require("../../database/models/FarmVerification");
const Crop = require("../../database/models/Crop");
const Advisory = require("../../database/models/Advisory");
const MarketPrice = require("../../database/models/MarketPrice");
const AuditLog = require("../../database/models/AuditLog");
const WeatherAlert = require("../../database/models/WeatherAlert");

const adminService = require("./admin.service");
const mappers = require("./admin.mappers");
// The moderation gate lives with the listing it guards so both write paths
// (this CRUD router and `PUT /api/marketplace/listings/:id`) read one rule.
const { approvalBlockReason } = require("../marketplace/marketplace.service");

const router = express.Router();

router.use(auth, role(["admin"]));

// ---- Dashboard ----
router.get("/dashboard/summary", async (req, res, next) => {
  try {
    res.json(await adminService.buildDashboardSummary());
  } catch (err) {
    next(err);
  }
});

router.get("/dashboard", async (req, res, next) => {
  try {
    res.json(await adminService.buildDashboardMetrics());
  } catch (err) {
    next(err);
  }
});

// ---- Users ----
router.get("/users", async (req, res, next) => {
  try {
    const query = {};
    if (req.query.role && req.query.role !== "All") {
      query.role = adminService.toBackendRole(req.query.role);
    }
    const users = await User.find(query).sort({ createdAt: -1, _id: -1 }).lean();
    res.json(users.map(adminService.mapAdminUser));
  } catch (err) {
    next(err);
  }
});

router.post("/users", async (req, res, next) => {
  try {
    const { name, email, phone, role: displayRole, region, nationalIdNumber, password } = req.body || {};
    if (!name || !email) {
      const err = new Error("Name and email are required");
      err.statusCode = 400;
      throw err;
    }
    const existing = await User.findOne({ email: String(email).toLowerCase() });
    if (existing) {
      const err = new Error("A user with this email already exists");
      err.statusCode = 409;
      throw err;
    }
    const backendRole = adminService.toBackendRole(displayRole);
    const salt = await bcrypt.genSalt(10);
    const user = await User.create({
      name,
      email,
      phone: phone || "",
      role: backendRole,
      roles: [backendRole],
      displayRole: displayRole || "",
      region: region || "",
      nationalIdNumber: nationalIdNumber || "",
      verificationBadge: true,
      accountStatus: "Active",
      password: await bcrypt.hash(password || `Farm@${Math.random().toString(36).slice(2, 8)}`, salt),
    });
    await logAudit({
      req,
      action: "CREATE",
      entity: "User",
      entityId: user.id,
      details: `Provisioned account for ${name} (${displayRole || backendRole})`,
    });
    res.status(201).json(adminService.mapAdminUser(user));
  } catch (err) {
    next(err);
  }
});

router.patch("/users/:id/status", async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      const err = new Error("User not found");
      err.statusCode = 404;
      throw err;
    }
    const { status, verificationBadge } = req.body || {};
    if (status) {
      user.accountStatus = status;
      user.isActive = status !== "Suspended";
    }
    if (verificationBadge !== undefined) {
      user.verificationBadge = !!verificationBadge;
    }
    await user.save();
    await logAudit({
      req,
      action: "UPDATE",
      entity: "User",
      entityId: user.id,
      details: `Account status set to ${user.accountStatus}, badge=${user.verificationBadge}`,
    });
    res.json(adminService.mapAdminUser(user));
  } catch (err) {
    next(err);
  }
});

// ---- Marketplace listings ----
router.use(
  "/marketplace/listings",
  buildCrudRouter({
    model: MarketplaceListing,
    roles: ["admin"],
    map: mappers.mapListing,
    routes: { list: true, get: false, create: false, update: true, remove: false },
    /**
     * Approval gate (Phase 2). `PUT …/:id` is how the admin moves a listing
     * into `Approved`, so the report check belongs here rather than in a UI
     * that could be bypassed with a raw request. Throwing before the write
     * gives the caller the same sentence the disabled button displays.
     */
    prepareUpdate: (req, payload, doc) => {
      if (payload && payload.status === "Approved") {
        const reason = approvalBlockReason(doc);
        if (reason) {
          const err = new Error(reason);
          err.statusCode = 409;
          throw err;
        }
      }
      return payload;
    },
  })
);

// ---- Orders ----
router.use(
  "/orders",
  buildCrudRouter({
    model: Order,
    roles: ["admin"],
    map: mappers.mapOrder,
    routes: { list: true, get: false, create: false, update: false, remove: false },
  })
);

// ---- Payments ----
router.use(
  "/payments",
  buildCrudRouter({
    model: Payment,
    roles: ["admin"],
    map: mappers.mapPayment,
    routes: { list: true, get: false, create: false, update: false, remove: false },
    extra: [
      {
        method: "post",
        path: "/:id/approve",
        handler: async (req, res) => {
          const payment = await Payment.findById(req.params.id);
          if (!payment) {
            const err = new Error("Payment not found");
            err.statusCode = 404;
            throw err;
          }
          payment.payoutStatus = "Completed";
          payment.approvedBy = (req.body && req.body.approverName) || req.user.name;
          await payment.save();
          await logAudit({
            req,
            action: "UPDATE",
            entity: "Payment",
            entityId: payment.id,
            details: `Approved payout ${payment.transactionRef} of BDT ${payment.amountBdt}`,
          });
          res.json(mappers.mapPayment(payment));
        },
      },
    ],
  })
);

// ---- Quality reports ----
router.use(
  "/quality/reports",
  buildCrudRouter({
    model: QualityRequest,
    roles: ["admin"],
    map: mappers.mapQuality,
    routes: { list: true, get: false, create: false, update: false, remove: false },
    // Certificates only. A request raised from a listing (Phase 2) sits in the
    // queue before anyone has measured anything, and `mapQuality`'s fallbacks
    // would render it as a passed Grade-A certificate — so an incomplete
    // record is not a report yet and does not belong in this list.
    filter: () => ({ status: "completed" }),
  })
);

// ---- Logistics ----
router.use(
  "/logistics/fleet",
  buildCrudRouter({
    model: Delivery,
    roles: ["admin"],
    map: mappers.mapLogistics,
    routes: { list: true, get: false, create: false, update: false, remove: false },
  })
);

// ---- Training management ----
router.use(
  "/training",
  buildCrudRouter({
    model: TrainingCourse,
    roles: ["admin"],
    map: mappers.mapTrainingAdmin,
    prepareCreate: (req, payload) => ({
      title: payload.courseTitle || payload.title || "Untitled Course",
      instructor: payload.instructorAssigned || payload.instructor || "",
      lastUpdated: today(),
      enrolledCount: 0,
      completionRatePercent: 0,
      feedbackScore: 5,
    }),
    routes: { list: true, get: false, create: true, update: true, remove: true },
  })
);

// ---- Reports ----
router.use(
  "/reports",
  buildCrudRouter({
    model: Report,
    roles: ["admin"],
    map: mappers.mapReport,
    routes: { list: true, get: false, create: false, update: false, remove: false },
  })
);

// ---- Disputes ----
router.use(
  "/disputes",
  buildCrudRouter({
    model: Dispute,
    roles: ["admin"],
    map: mappers.mapDispute,
    routes: { list: true, get: false, create: false, update: false, remove: false },
    extra: [
      {
        method: "post",
        path: "/:id/resolve",
        handler: async (req, res) => {
          const dispute = await Dispute.findById(req.params.id);
          if (!dispute) {
            const err = new Error("Dispute not found");
            err.statusCode = 404;
            throw err;
          }
          const body = req.body || {};
          dispute.caseStatus = body.caseStatus || "Resolved - Farmer Compensated";
          dispute.resolutionNotes = body.resolutionNotes || "";
          await dispute.save();
          await logAudit({
            req,
            action: "UPDATE",
            entity: "Dispute",
            entityId: dispute.id,
            details: `Case ${dispute.caseNumber} moved to "${dispute.caseStatus}"`,
          });
          res.json(mappers.mapDispute(dispute));
        },
      },
    ],
  })
);

// ---- Farm verifications ----
router.use(
  "/verifications",
  buildCrudRouter({
    model: FarmVerification,
    roles: ["admin"],
    map: mappers.mapVerification,
    filter: (req) => (req.query.status ? { status: req.query.status } : {}),
    routes: { list: true, get: false, create: false, update: false, remove: false },
    extra: [
      {
        method: "post",
        path: "/:id/review",
        handler: async (req, res) => {
          const record = await FarmVerification.findById(req.params.id);
          if (!record) {
            const err = new Error("Verification request not found");
            err.statusCode = 404;
            throw err;
          }
          const body = req.body || {};
          record.status = body.status === "rejected" ? "rejected" : "verified";
          record.officerNotes = body.notes || "";
          record.assignedOfficerName = body.officerName || req.user.name;
          await record.save();
          await logAudit({
            req,
            action: "UPDATE",
            entity: "FarmVerification",
            entityId: record.id,
            details: `Verification for ${record.farmerName} marked ${record.status}`,
          });
          res.json(mappers.mapVerification(record));
        },
      },
    ],
  })
);

// ---- Master crops ----
router.use(
  "/master-crops",
  buildCrudRouter({
    model: Crop,
    roles: ["admin"],
    map: mappers.mapMasterCrop,
    routes: { list: true, get: false, create: true, update: true, remove: true },
  })
);

// ---- Advisories ----
router.use(
  "/advisories",
  buildCrudRouter({
    model: Advisory,
    roles: ["admin"],
    map: mappers.mapAdvisory,
    prepareCreate: () => ({ issueDate: today() }),
    routes: { list: true, get: false, create: true, update: true, remove: true },
  })
);

// ---- Market prices ----
router.use(
  "/market-prices",
  buildCrudRouter({
    model: MarketPrice,
    roles: ["admin"],
    map: mappers.mapMarketPrice,
    routes: { list: true, get: false, create: true, update: true, remove: true },
  })
);

// ---- Audit logs ----
router.use(
  "/audit-logs",
  buildCrudRouter({
    model: AuditLog,
    roles: ["admin"],
    map: mappers.mapAuditLog,
    sort: { createdAt: -1, _id: -1 },
    routes: { list: true, get: false, create: false, update: false, remove: false },
  })
);

// ---- Weather alert broadcasts ----
router.use(
  "/weather-alerts",
  buildCrudRouter({
    model: WeatherAlert,
    roles: ["admin"],
    map: mappers.mapWeatherAlert,
    prepareCreate: (req) => ({ broadcastBy: req.user.name }),
    sort: { createdAt: -1, _id: -1 },
    routes: { list: true, get: false, create: true, update: false, remove: true },
  })
);

module.exports = router;
