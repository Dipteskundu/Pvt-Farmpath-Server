const express = require("express");
const { buildCrudRouter } = require("../_crud/crudFactory");
const auth = require("../../middleware/auth.middleware");
const TrainingCourse = require("../../database/models/TrainingCourse");
const TrainingProgress = require("../../database/models/TrainingProgress");
const { logAudit } = require("../../utils/audit");
const { today } = require("../../utils/dates");
const { mapTrainingAdmin } = require("../admin/admin.mappers");

const isAdmin = (user) =>
  user.role === "admin" || (Array.isArray(user.roles) && user.roles.includes("admin"));

const mapCourseForFarmer = (doc, progressIndexes = []) =>
  ({
    id: String(doc._id),
    title: doc.title || "",
    category: doc.category || "Agronomy",
    instructor: doc.instructor || "",
    durationMinutes: doc.durationMinutes || 0,
    difficulty: doc.difficulty || "Beginner",
    lessonsCount: (doc.syllabus || []).length || doc.lessonsCount || 0,
    completedLessonsCount: progressIndexes.length,
    rating: doc.rating ?? 0,
    thumbnail: doc.thumbnail || "",
    description: doc.description || "",
    syllabus: (doc.syllabus || []).map((lesson, index) => ({
      title: lesson.title || "",
      duration: lesson.duration || "",
      completed: progressIndexes.includes(index),
    })),
  });

const listRouter = buildCrudRouter({
  model: TrainingCourse,
  roles: ["farmer", "admin"],
  sort: { createdAt: -1, _id: -1 },
  routes: { list: true, get: false, create: false, update: false, remove: false },
  map: mapTrainingAdmin,
  afterList: async (req, data, docs) => {
    if (isAdmin(req.user)) return data;
    const progress = await TrainingProgress.find({ user: req.user._id }).lean();
    const byCourse = {};
    progress.forEach((p) => {
      byCourse[String(p.course)] = p.completedLessonIndexes || [];
    });
    return docs.map((doc) => mapCourseForFarmer(doc, byCourse[String(doc._id)] || []));
  },
});

const adminRouter = buildCrudRouter({
  model: TrainingCourse,
  roles: ["admin"],
  map: mapTrainingAdmin,
  prepareCreate: () => ({
    title: "Untitled Course",
    lastUpdated: today(),
    enrolledCount: 0,
    completionRatePercent: 0,
    feedbackScore: 5,
  }),
  routes: { list: false, get: false, create: true, update: true, remove: true },
});

const router = express.Router();

router.patch("/:id/progress", auth, async (req, res, next) => {
  try {
    const course = await TrainingCourse.findById(req.params.id);
    if (!course) {
      const err = new Error("Course not found");
      err.statusCode = 404;
      throw err;
    }
    const lessonIndex = Number(req.body && req.body.lessonIndex);
    if (Number.isNaN(lessonIndex)) {
      const err = new Error("lessonIndex is required");
      err.statusCode = 400;
      throw err;
    }
    let progress = await TrainingProgress.findOne({ user: req.user._id, course: course._id });
    if (!progress) {
      progress = await TrainingProgress.create({
        user: req.user._id,
        course: course._id,
        completedLessonIndexes: [],
      });
    }
    const indexes = new Set(progress.completedLessonIndexes || []);
    if (indexes.has(lessonIndex)) indexes.delete(lessonIndex);
    else indexes.add(lessonIndex);
    progress.completedLessonIndexes = [...indexes].sort((a, b) => a - b);
    await progress.save();

    await logAudit({
      req,
      action: "UPDATE",
      entity: "TrainingProgress",
      entityId: String(course._id),
      details: `Course "${course.title}" lesson ${lessonIndex + 1} toggled (${
        indexes.has(lessonIndex) ? "completed" : "reopened"
      })`,
    });

    res.json(mapCourseForFarmer(course, progress.completedLessonIndexes));
  } catch (err) {
    next(err);
  }
});

router.use(listRouter);
router.use(adminRouter);

module.exports = router;
