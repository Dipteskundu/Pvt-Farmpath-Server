const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
  {
    owner: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    type: { type: String, default: "system" },
    title: { type: String, required: [true, "Please add a title"] },
    message: { type: String, required: [true, "Please add a message"] },
    timestamp: { type: String, default: "" },
    isRead: { type: Boolean, default: false },
    actionLink: { type: String, default: "" },
    priority: { type: String, default: "medium" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Notification", notificationSchema);
