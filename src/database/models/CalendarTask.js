const mongoose = require("mongoose");

const calendarTaskSchema = new mongoose.Schema(
  {
    owner: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    cropBatchId: { type: String, default: "" },
    cropName: { type: String, default: "" },
    fieldName: { type: String, default: "" },
    taskTitle: { type: String, required: [true, "Please add a task title"], trim: true },
    taskType: { type: String, default: "Scouting" },
    scheduledDate: { type: String, default: "" },
    isCompleted: { type: Boolean, default: false },
    priority: { type: String, default: "medium" },
    notes: { type: String, default: "" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("CalendarTask", calendarTaskSchema);
