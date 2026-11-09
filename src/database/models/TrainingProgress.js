const mongoose = require("mongoose");

const trainingProgressSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    course: { type: mongoose.Schema.Types.ObjectId, ref: "TrainingCourse", required: true },
    completedLessonIndexes: { type: [Number], default: [] },
  },
  { timestamps: true }
);

trainingProgressSchema.index({ user: 1, course: 1 }, { unique: true });

module.exports = mongoose.model("TrainingProgress", trainingProgressSchema);
