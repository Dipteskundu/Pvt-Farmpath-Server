const User = require("../../database/models/User");
const Farm = require("../../database/models/Farm");
const CropBatch = require("../../database/models/CropBatch");
const TrainingProgress = require("../../database/models/TrainingProgress");
const Dispute = require("../../database/models/Dispute");
const Payment = require("../../database/models/Payment");
const FarmVerification = require("../../database/models/FarmVerification");
const Advisory = require("../../database/models/Advisory");
const MarketPrice = require("../../database/models/MarketPrice");
const AuditLog = require("../../database/models/AuditLog");
const Crop = require("../../database/models/Crop");
const { dateOnly } = require("../../utils/dates");

const DISPLAY_ROLE_BY_BACKEND = {
  farmer: "Farmer",
  support: "Agronomist",
  inspector: "Extension Officer",
  admin: "Platform Admin",
};

const BACKEND_ROLE_BY_DISPLAY = {
  Farmer: "farmer",
  Agronomist: "support",
  "Extension Officer": "inspector",
  "Platform Admin": "admin",
};

const toDisplayRole = (user) => {
  const backendRole = (user && (user.role || (user.roles && user.roles[0]))) || "farmer";
  return (
    (user && user.displayRole) ||
    DISPLAY_ROLE_BY_BACKEND[backendRole] ||
    backendRole.charAt(0).toUpperCase() + backendRole.slice(1)
  );
};

const toBackendRole = (display) => BACKEND_ROLE_BY_DISPLAY[display] || String(display || "farmer").toLowerCase();

const mapAdminUser = (user) => ({
  id: String(user._id),
  name: user.name || "",
  email: user.email || "",
  phone: user.phone || "",
  role: toDisplayRole(user),
  region: user.region || user.address || "",
  status: user.accountStatus || (user.isActive === false ? "Suspended" : "Active"),
  registrationDate: dateOnly(user.createdAt),
  verificationBadge: !!user.verificationBadge,
  nationalIdNumber: user.nationalIdNumber || user.nationalId || "",
});

const buildKpis = async () => {
  const [totalRegisteredFarmers, activeFarms, acreageAgg, yieldAgg, enrolled, activeDisputes, payoutAgg, health] =
    await Promise.all([
      User.countDocuments({ roles: "farmer" }),
      Farm.countDocuments({ status: "active" }),
      Farm.aggregate([{ $group: { _id: null, total: { $sum: "$totalAreaAcres" } } }]),
      CropBatch.aggregate([
        { $match: { targetYieldKg: { $gt: 0 } } },
        { $group: { _id: null, total: { $sum: "$targetYieldKg" } } },
      ]),
      TrainingProgress.distinct("user").then((ids) => ids.length).catch(() => 0),
      Dispute.countDocuments({
        caseStatus: { $in: ["Open - Under Review", "Mediation In Progress"] },
      }),
      Payment.aggregate([{ $group: { _id: null, total: { $sum: "$amountBdt" } } }]),
      Promise.resolve(true),
    ]);

  return {
    totalRegisteredFarmers,
    totalActiveFarms: activeFarms,
    monitoredAcreage: acreageAgg[0] ? Math.round(acreageAgg[0].total * 10) / 10 : 0,
    projectedAnnualYieldTons: yieldAgg[0] ? Math.round(yieldAgg[0].total / 1000) : 0,
    enrolledTrainingFarmers: enrolled,
    activeDisputesCount: activeDisputes,
    totalPlatformTransactionsBdt: payoutAgg[0] ? payoutAgg[0].total : 0,
    systemHealthStatus: health ? "Healthy" : "Degraded",
  };
};

const buildRegionalDistribution = async () => {
  const users = await User.find({ roles: "farmer" }).lean();
  const groups = {};
  users.forEach((u) => {
    const region = u.region || u.primaryLocation?.district || "Unassigned Region";
    if (!groups[region]) groups[region] = { region, farmerCount: 0, acreage: 0 };
    groups[region].farmerCount += 1;
    groups[region].acreage += u.totalAcreage || 0;
  });
  return Object.values(groups).sort((a, b) => b.farmerCount - a.farmerCount);
};

const buildAverageYieldIndex = async () => {
  const [batches, crops] = await Promise.all([
    CropBatch.find({ targetYieldKg: { $gt: 0 } }).lean(),
    Crop.find().lean(),
  ]);
  if (!batches.length) return 0;
  const standardByCrop = {};
  crops.forEach((c) => {
    standardByCrop[c.cropName] = c.standardYieldKgPerAcre || 2000;
  });
  const total = batches.reduce((acc, b) => {
    const standard = standardByCrop[b.cropName] || 2000;
    return acc + Math.min(100, (b.targetYieldKg / standard) * 100);
  }, 0);
  return Math.round((total / batches.length) * 10) / 10;
};

const buildDashboardSummary = async () => {
  const [
    kpis,
    pendingVerifications,
    activeAdvisories,
    averageCropYieldIndex,
    marketPrices,
    regionalFarmerDistribution,
    recentAuditLogsRaw,
  ] = await Promise.all([
    buildKpis(),
    FarmVerification.countDocuments({ status: "pending" }),
    Advisory.countDocuments({}),
    buildAverageYieldIndex(),
    MarketPrice.find().lean(),
    buildRegionalDistribution(),
    AuditLog.find().sort({ createdAt: -1, _id: -1 }).limit(5).lean(),
  ]);

  return {
    kpis,
    totalPendingVerifications: pendingVerifications,
    totalActiveAdvisories: activeAdvisories,
    averageCropYieldIndex,
    totalWeeklyMarketVolumeTons: marketPrices.reduce((acc, m) => acc + (m.volumeTradedMetricTons || 0), 0),
    regionalFarmerDistribution,
    recentAuditLogs: recentAuditLogsRaw.map((log) => ({
      id: String(log._id),
      timestamp: log.timestamp || "",
      actorName: log.actorName || "",
      actorRole: log.actorRole || "",
      actionType: log.actionType || "",
      targetEntity: log.targetEntity || "",
      entityId: log.entityId || "",
      ipAddress: log.ipAddress || "",
      status: log.status || "success",
      details: log.details || "",
    })),
  };
};

const buildDashboardMetrics = async () => {
  const [kpis, recentUsersRaw, recentDisputesRaw, recentOrdersRaw, coldChainRaw] = await Promise.all([
    buildKpis(),
    User.find().sort({ createdAt: -1, _id: -1 }).limit(4).lean(),
    Dispute.find({
      caseStatus: { $in: ["Open - Under Review", "Mediation In Progress"] },
    })
      .sort({ createdAt: -1 })
      .lean(),
    require("../../database/models/Order")
      .find()
      .sort({ createdAt: -1, _id: -1 })
      .limit(4)
      .lean(),
    require("../../database/models/Delivery")
      .find({ coldChainIntegrity: { $ne: "Optimal" } })
      .sort({ createdAt: -1 })
      .lean(),
  ]);

  const mapDispute = require("./admin.mappers").mapDispute;
  const mapOrder = require("./admin.mappers").mapOrder;
  const mapLogistics = require("./admin.mappers").mapLogistics;

  return {
    kpis,
    recentUsers: recentUsersRaw.map(mapAdminUser),
    recentDisputes: recentDisputesRaw.map(mapDispute),
    recentEscrowOrders: recentOrdersRaw.map(mapOrder),
    activeColdChainAlerts: coldChainRaw.map(mapLogistics),
  };
};

module.exports = {
  buildDashboardSummary,
  buildDashboardMetrics,
  mapAdminUser,
  toDisplayRole,
  toBackendRole,
  dateOnly,
};
