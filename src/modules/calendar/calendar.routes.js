const express = require("express");
const auth = require("../../middleware/auth.middleware");
const { buildCrudRouter } = require("../_crud/crudFactory");
const CalendarTask = require("../../database/models/CalendarTask");
const { logAudit } = require("../../utils/audit");

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

const base = buildCrudRouter({
  model: CalendarTask,
  roles: ["farmer", "admin"],
  ownerKey: "owner",
  map: mapTask,
  routes: { list: true, get: true, create: true, update: true, remove: true },
});

const router = express.Router();

const toggleHandler = async (req, res, next) => {
  try {
    const task = await CalendarTask.findById(req.params.id);
    if (!task) {
      const err = new Error("Task not found");
      err.statusCode = 404;
      throw err;
    }
    const isOwner =
      req.user.role === "admin" ||
      (Array.isArray(req.user.roles) && req.user.roles.includes("admin")) ||
      String(task.owner) === String(req.user.id);
    if (!isOwner) {
      const err = new Error("You do not have permission to access this record");
      err.statusCode = 403;
      throw err;
    }
    task.isCompleted = !task.isCompleted;
    await task.save();
    await logAudit({
      req,
      action: "UPDATE",
      entity: "CalendarTask",
      entityId: task.id,
      details: `Task "${task.taskTitle}" marked ${task.isCompleted ? "completed" : "pending"}`,
    });
    res.json(mapTask(task));
  } catch (err) {
    next(err);
  }
};

router.patch("/:id/toggle", auth, toggleHandler);
router.post("/:id/toggle", auth, toggleHandler);

router.use(base);

module.exports = router;
