const express = require("express");
const auth = require("../../middleware/auth.middleware");
const { buildCrudRouter } = require("../_crud/crudFactory");
const Notification = require("../../database/models/Notification");
const { nowStamp } = require("../../utils/dates");

const mapNotification = (doc) => ({
  id: String(doc._id),
  type: doc.type || "system",
  title: doc.title,
  message: doc.message || "",
  timestamp: doc.timestamp || nowStamp(),
  isRead: !!doc.isRead,
  actionLink: doc.actionLink || "",
  priority: doc.priority || "medium",
});

const isAdmin = (user) =>
  user.role === "admin" || (Array.isArray(user.roles) && user.roles.includes("admin"));

const markRead = async (req, res, next) => {
  try {
    const doc = await Notification.findById(req.params.id);
    if (!doc || (String(doc.owner) !== String(req.user.id) && !isAdmin(req.user))) {
      const err = new Error("Notification not found");
      err.statusCode = 404;
      throw err;
    }
    doc.isRead = true;
    await doc.save();
    res.json(mapNotification(doc));
  } catch (err) {
    next(err);
  }
};

/**
 * Every authenticated portal may read its own notifications. The CRUD router
 * scopes reads/writes by `ownerKey: "owner"`, so widening the role list here
 * cannot leak one user's notifications to another — it only stops
 * buyer/supplier/inspector/logistics/support from getting a blanket 403.
 */
const ALL_PORTAL_ROLES = [
  "farmer",
  "buyer",
  "supplier",
  "inspector",
  "logistics",
  "support",
  "admin",
];

const base = buildCrudRouter({
  model: Notification,
  roles: ALL_PORTAL_ROLES,
  ownerKey: "owner",
  map: mapNotification,
  prepareCreate: () => ({ timestamp: nowStamp() }),
  routes: { list: true, get: false, create: true, update: true, remove: true },
});

const router = express.Router();

router.post(
  "/mark-all-read",
  auth,
  async (req, res, next) => {
    try {
      await Notification.updateMany({ owner: req.user.id, isRead: false }, { isRead: true });
      res.json(true);
    } catch (err) {
      next(err);
    }
  }
);

router.patch("/:id/read", auth, markRead);
router.post("/:id/read", auth, markRead);

router.use(base);

module.exports = router;
