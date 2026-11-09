const mongoose = require("mongoose");

const trainingCourseSchema = new mongoose.Schema(
  {
    title: { type: String, required: [true, "Please add a course title"], trim: true },
    category: { type: String, default: "Crop Management" },
    instructor: { type: String, default: "" },
    durationMinutes: { type: Number, default: 0 },
    difficulty: { type: String, default: "Beginner" },
    lessonsCount: { type: Number, default: 0 },
    rating: { type: Number, default: 0 },
    thumbnail: { type: String, default: "" },
    description: { type: String, default: "" },
    syllabus: {
      type: [
        {
          _id: false,
          title: { type: String, default: "" },
          duration: { type: String, default: "" },
        },
      ],
      default: [],
    },
    targetRegion: { type: String, default: "" },
    status: { type: String, default: "Published" },
    enrolledCount: { type: Number, default: 0 },
    completionRatePercent: { type: Number, default: 0 },
    lastUpdated: { type: String, default: "" },
    feedbackScore: { type: Number, default: 0 },
  },
  { timestamps: true }
);

module.exports = mongoose.model("TrainingCourse", trainingCourseSchema);
