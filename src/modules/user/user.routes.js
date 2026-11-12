const express = require("express");
const auth = require("../../middleware/auth.middleware");
const upload = require("../../middleware/upload.middleware");
const Farm = require("../../database/models/Farm");
const CropBatch = require("../../database/models/CropBatch");
const Harvest = require("../../database/models/Harvest");
const { logAudit } = require("../../utils/audit");

const router = express.Router();

router.use(auth);

/*
 * The dashboard profile page expects a `ProfileResponse`:
 *   { user, extendedProfile?, activityStats? }
 * `user` mirrors the basic identity (`/auth/me`), `extendedProfile` the
 * farmer-style detail fields stored on the User document, and
 * `activityStats` a small counter block for farmer/buyer dashboards.
 */
const mapResponse = (user, activityStats) => ({
  user: {
    id: String(user._id),
    name: user.name || "",
    email: user.email || "",
    phone: user.phone || "",
    roles: Array.isArray(user.roles) && user.roles.length > 0
      ? user.roles
      : [user.role || "farmer"],
    profileImage: user.profileImage || "",
    accountStatus: user.accountStatus || "Active",
    registeredAt: user.createdAt || "",
    lastLoginAt: "",
  },
  extendedProfile: {
    nationalId: user.nationalId || user.nationalIdNumber || "",
    dateOfBirth: user.dateOfBirth || "",
    farmingExperienceYears: user.farmingExperienceYears || 0,
    primaryLocation: {
      division: user.primaryLocation?.division || "",
      district: user.primaryLocation?.district || "",
      upazila: user.primaryLocation?.upazila || "",
      village: user.primaryLocation?.village || "",
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
    totalAcreage: user.totalAcreage || 0,
    registeredSince: user.registeredSince || "",
  },
  ...(activityStats ? { activityStats } : {}),
});

router.get("/profile", async (req, res, next) => {
  try {
    const user = req.user;

    let activityStats;
    if (user.roles?.includes("farmer") || user.roles?.includes("buyer")) {
      const owner = user._id;
      const [totalFarms, activeCrops, harvestRecords] = await Promise.all([
        Farm.countDocuments({ owner }),
        CropBatch.countDocuments({ owner }),
        Harvest.countDocuments({ owner }),
      ]);
      activityStats = {
        totalFarms,
        activeCrops,
        totalAcreage: user.totalAcreage || 0,
        harvestRecords,
      };
    }

    res.json(mapResponse(user, activityStats));
  } catch (err) {
    next(err);
  }
});

router.put("/profile", async (req, res, next) => {
  try {
    const body = req.body || {};
    const user = req.user;

    if (body.name !== undefined) user.name = body.name;
    if (body.phone !== undefined) user.phone = body.phone;
    if (body.avatarUrl !== undefined) user.profileImage = body.avatarUrl;
    if (body.nationalId !== undefined) {
      user.nationalId = body.nationalId;
      user.nationalIdNumber = body.nationalId;
    }
    if (body.dateOfBirth !== undefined) user.dateOfBirth = body.dateOfBirth;
    if (body.farmingExperienceYears !== undefined)
      user.farmingExperienceYears = Number(body.farmingExperienceYears) || 0;
    if (body.primaryLocation) {
      const loc = body.primaryLocation;
      user.primaryLocation = {
        division: loc.division || user.primaryLocation?.division || "",
        district: loc.district || user.primaryLocation?.district || "",
        upazila: loc.upazila || user.primaryLocation?.upazila || "",
        village: loc.village || user.primaryLocation?.village || "",
        lat: user.primaryLocation?.lat || 0,
        lng: user.primaryLocation?.lng || 0,
      };
    }
    if (body.bankDetails) {
      const bank = body.bankDetails;
      user.bankDetails = {
        accountHolderName:
          bank.accountName || bank.accountHolderName || user.bankDetails?.accountHolderName || "",
        accountNumber: bank.accountNumber || user.bankDetails?.accountNumber || "",
        bankName: bank.bankName || user.bankDetails?.bankName || "",
        branchName: bank.branchName || user.bankDetails?.branchName || "",
        routingNumber: bank.routingNumber || user.bankDetails?.routingNumber || "",
        mobileWalletNumber: user.bankDetails?.mobileWalletNumber || "",
      };
    }

    await user.save();
    await logAudit({
      req,
      action: "UPDATE",
      entity: "UserProfile",
      entityId: String(user._id),
      details: "User profile details updated",
    });

    res.json(mapResponse(user));
  } catch (err) {
    next(err);
  }
});

router.delete("/profile/photo", async (req, res, next) => {
  try {
    const user = req.user;
    user.profileImage = "";
    await user.save();
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

/*
 * Profile photo upload. Mirrors `POST /marketplace/upload` on the storage
 * side (ImgBB via `config/imgbb.js`) but scopes the upload and URL to the
 * caller's account and returns `{ avatarUrl }`, the shape
 * `uploadProfilePhoto()` expects.
 */
const uploadPhoto = (req, res, next) => {
  upload.single("photo")(req, res, (err) => {
    if (!err) return next();
    // Multer reports its own failures as plain `Error`s with no
    // `statusCode`; map them so the form shows a readable message.
    if (!err.statusCode) {
      err.statusCode = err.code === "LIMIT_FILE_SIZE" ? 413 : 400;
    }
    next(err);
  });
};

router.post("/profile/photo", uploadPhoto, async (req, res, next) => {
  try {
    if (!req.file) {
      const err = new Error(
        'No photo received. Send a JPEG, PNG or WebP file under 5 MB in the "photo" field.'
      );
      err.statusCode = 400;
      return next(err);
    }

    let avatarUrl;
    try {
      const { uploadToImgbb } = require("../../config/imgbb");
      avatarUrl = await uploadToImgbb(req.file.buffer, req.file.originalname, req.file.mimetype);
    } catch (storageErr) {
      return next(storageErr);
    }

    req.user.profileImage = avatarUrl;
    await req.user.save();

    res.json({ avatarUrl });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
