const express = require("express");
const auth = require("../../middleware/auth.middleware");
const role = require("../../middleware/role.middleware");
const Farm = require("../../database/models/Farm");
const Field = require("../../database/models/Field");
const CropBatch = require("../../database/models/CropBatch");
const CropLog = require("../../database/models/CropLog");
const CalendarTask = require("../../database/models/CalendarTask");
const Notification = require("../../database/models/Notification");
const Harvest = require("../../database/models/Harvest");
const Expense = require("../../database/models/Expense");
const { logAudit } = require("../../utils/audit");
const { buildWeatherData } = require("./weather.service");
const cropAdvisory = require("./crop-advisory.service");

const router = express.Router();

router.use(auth, role(["farmer", "admin"]));

const mapProfile = (user) => ({
  id: String(user._id),
  fullName: user.name || "",
  nationalId: user.nationalId || user.nationalIdNumber || "",
  phoneNumber: user.phone || "",
  email: user.email || "",
  avatarUrl: user.profileImage || "",
  dateOfBirth: user.dateOfBirth || "",
  farmingExperienceYears: user.farmingExperienceYears || 0,
  primaryLocation: {
    division: user.primaryLocation?.division || "",
    district: user.primaryLocation?.district || "",
    upazila: user.primaryLocation?.upazila || "",
    village: user.primaryLocation?.village || "",
    coordinates: {
      lat: user.primaryLocation?.lat || 0,
      lng: user.primaryLocation?.lng || 0,
    },
  },
  bankDetails: {
    accountName: user.bankDetails?.accountHolderName || "",
    accountNumber: user.bankDetails?.accountNumber || "",
    bankName: user.bankDetails?.bankName || "",
    branchName: user.bankDetails?.branchName || "",
    routingNumber: user.bankDetails?.routingNumber || "",
  },
  certifications: (user.certifications || []).map((c) => ({
    name: c.name || "",
    issuingAuthority: c.issuingAuthority || "",
    issuedYear: c.issuedYear || 0,
    verified: !!c.verified,
  })),
  farmerClub: user.farmerClub || "",
  totalAcreage: user.totalAcreage || 0,
  registeredSince: user.registeredSince || "",
});

router.get("/profile", (req, res) => {
  res.json(mapProfile(req.user));
});

router.put("/profile", async (req, res, next) => {
  try {
    const body = req.body || {};
    const user = req.user;
    if (body.fullName) user.name = body.fullName;
    if (body.nationalId !== undefined) {
      user.nationalId = body.nationalId;
      user.nationalIdNumber = body.nationalId;
    }
    if (body.phoneNumber !== undefined) user.phone = body.phoneNumber;
    if (body.avatarUrl !== undefined) user.profileImage = body.avatarUrl;
    if (body.dateOfBirth !== undefined) user.dateOfBirth = body.dateOfBirth;
    if (body.farmingExperienceYears !== undefined)
      user.farmingExperienceYears = Number(body.farmingExperienceYears) || 0;
    if (body.primaryLocation) {
      const loc = body.primaryLocation;
      user.primaryLocation = {
        division: loc.division || "",
        district: loc.district || "",
        upazila: loc.upazila || "",
        village: loc.village || "",
        lat: loc.coordinates ? Number(loc.coordinates.lat) || 0 : Number(loc.lat) || 0,
        lng: loc.coordinates ? Number(loc.coordinates.lng) || 0 : Number(loc.lng) || 0,
      };
    }
    if (body.bankDetails) {
      const bank = body.bankDetails;
      user.bankDetails = {
        accountHolderName: bank.accountName || bank.accountHolderName || "",
        accountNumber: bank.accountNumber || "",
        bankName: bank.bankName || "",
        branchName: bank.branchName || "",
        routingNumber: bank.routingNumber || "",
        mobileWalletNumber: bank.mobileWalletNumber || "",
      };
    }
    if (Array.isArray(body.certifications)) user.certifications = body.certifications;
    if (body.farmerClub !== undefined) user.farmerClub = body.farmerClub;
    if (body.totalAcreage !== undefined) user.totalAcreage = Number(body.totalAcreage) || 0;
    if (body.registeredSince !== undefined) user.registeredSince = body.registeredSince;

    await user.save();
    await logAudit({
      req,
      action: "UPDATE",
      entity: "FarmerProfile",
      entityId: String(user._id),
      details: "Farmer profile details updated",
    });
    res.json(mapProfile(user));
  } catch (err) {
    next(err);
  }
});

router.get("/dashboard", async (req, res, next) => {
  try {
    const owner = req.user._id;
    const [farms, fields, batches, logs, tasks, unread, weather] = await Promise.all([
      Farm.countDocuments({ owner }),
      Field.countDocuments({ owner }),
      CropBatch.countDocuments({ owner }),
      CropLog.find({ owner }).sort({ createdAt: -1, _id: -1 }).limit(4).lean(),
      CalendarTask.find({ owner, isCompleted: false }).sort({ scheduledDate: 1 }).limit(4).lean(),
      Notification.countDocuments({ owner, isRead: false }),
      buildWeatherData({ district: req.user.primaryLocation?.district, lat: req.user.primaryLocation?.lat, lng: req.user.primaryLocation?.lng }),
    ]);

    const farmsList = await Farm.find({ owner }).lean();
    const mapLog = (doc) => ({
      id: String(doc._id),
      cropBatchId: doc.cropBatchId || "",
      cropName: doc.cropName || "",
      fieldName: doc.fieldName || "",
      activityType: doc.activityType || "Growth Observation",
      date: doc.date || "",
      details: doc.details || "",
      inputUsed: doc.inputUsed || "",
      dosageQuantity: doc.dosageQuantity || "",
      costIncurred: doc.costIncurred || 0,
      operatorName: doc.operatorName || "",
      weatherConditionAtApplication: doc.weatherConditionAtApplication || "",
      photoUrl: doc.photoUrl || "",
    });
    const mapTask = (doc) => ({
      id: String(doc._id),
      cropBatchId: doc.cropBatchId || "",
      cropName: doc.cropName || "",
      fieldName: doc.fieldName || "",
      taskTitle: doc.taskTitle,
      taskType: doc.taskType || "Scouting",
      scheduledDate: doc.scheduledDate || "",
      isCompleted: !!doc.isCompleted,
      priority: doc.priority || "medium",
      notes: doc.notes || "",
    });

    res.json({
      profile: mapProfile(req.user),
      activeCropsCount: batches,
      totalFarmsCount: farms,
      totalFieldsCount: fields,
      totalAcreage: farmsList.reduce((acc, f) => acc + (f.totalAreaAcres || 0), 0),
      pendingTasksCount: await CalendarTask.countDocuments({ owner, isCompleted: false }),
      unreadNotificationsCount: unread,
      recentLogs: logs.map(mapLog),
      upcomingTasks: tasks.map(mapTask),
      weatherCurrent: weather.current,
    });
  } catch (err) {
    next(err);
  }
});

router.get("/profitability", async (req, res, next) => {
  try {
    const owner = req.user._id;
    const [harvests, expenses] = await Promise.all([
      Harvest.find({ owner }).lean(),
      Expense.find({ owner }).lean(),
    ]);

    const totalRevenueBdt = harvests.reduce((acc, h) => acc + (h.estimatedValuationBdt || 0), 0);
    const totalExpensesBdt = expenses.reduce((acc, e) => acc + (e.amountBdt || 0), 0);
    const netProfitBdt = totalRevenueBdt - totalExpensesBdt;
    const profitMarginPercent =
      totalRevenueBdt > 0 ? Math.round((netProfitBdt / totalRevenueBdt) * 1000) / 10 : 0;

    const cropMap = {};
    harvests.forEach((h) => {
      const key = h.cropName || "Uncategorized";
      if (!cropMap[key]) cropMap[key] = { cropName: key, revenue: 0, expense: 0, profit: 0 };
      cropMap[key].revenue += h.estimatedValuationBdt || 0;
    });
    expenses.forEach((e) => {
      const key = e.cropName || "Farm Overhead";
      if (!cropMap[key]) cropMap[key] = { cropName: key, revenue: 0, expense: 0, profit: 0 };
      cropMap[key].expense += e.amountBdt || 0;
    });
    const revenueByCrop = Object.values(cropMap)
      .map((row) => ({ ...row, profit: row.revenue - row.expense }))
      .sort((a, b) => b.revenue - a.revenue);

    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const monthlyMap = {};
    const addMonth = (raw, key, amount) => {
      if (!raw) return;
      const d = new Date(raw);
      if (Number.isNaN(d.getTime())) return;
      const monthKey = `${d.getFullYear()}-${d.getMonth()}`;
      if (!monthlyMap[monthKey]) {
        monthlyMap[monthKey] = {
          month: monthNames[d.getMonth()],
          order: monthKey,
          revenue: 0,
          expense: 0,
        };
      }
      monthlyMap[monthKey][key] += amount;
    };
    harvests.forEach((h) => addMonth(h.harvestDate || h.createdAt, "revenue", h.estimatedValuationBdt || 0));
    expenses.forEach((e) => addMonth(e.date || e.createdAt, "expense", e.amountBdt || 0));
    const monthlyFinancials = Object.values(monthlyMap)
      .sort((a, b) => String(a.order).localeCompare(String(b.order)))
      .slice(-6)
      .map(({ month, revenue, expense }) => ({ month, revenue, expense }));

    const categoryMap = {};
    expenses.forEach((e) => {
      const key = e.category || "Other";
      categoryMap[key] = (categoryMap[key] || 0) + (e.amountBdt || 0);
    });
    const costBreakdownByCategory = Object.entries(categoryMap)
      .map(([category, amount]) => ({
        category,
        amount,
        percentage:
          totalExpensesBdt > 0 ? Math.round((amount / totalExpensesBdt) * 1000) / 10 : 0,
      }))
      .sort((a, b) => b.amount - a.amount);

    res.json({
      totalRevenueBdt,
      totalExpensesBdt,
      netProfitBdt,
      profitMarginPercent,
      revenueByCrop,
      monthlyFinancials,
      costBreakdownByCategory,
    });
  } catch (err) {
    next(err);
  }
});

router.get("/weather", async (req, res, next) => {
  try {
    res.json(await buildWeatherData({ district: req.user.primaryLocation?.district, lat: req.user.primaryLocation?.lat, lng: req.user.primaryLocation?.lng }));
  } catch (err) {
    next(err);
  }
});

router.post("/crops/recommend", async (req, res, next) => {
  try {

    res.json(
      await cropAdvisory.buildRecommendations(req.body || {}, req.user)
    );

  } catch (err) {
    next(err);
  }
});

router.get("/crops/compare", async (req, res, next) => {
  try {
    res.json(await cropAdvisory.buildComparisonProfiles(req.user));
  } catch (err) {
    next(err);
  }
});

router.get("/crops/ai-diagnostic", async (req, res, next) => {
  try {
    res.json(await cropAdvisory.buildAiDiagnostic(req.user));
  } catch (err) {
    next(err);
  }
});

module.exports = router;
