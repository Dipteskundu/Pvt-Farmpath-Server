const mongoose = require("mongoose");

const cropLogSchema = new mongoose.Schema(
  {
    owner: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    cropBatchId: { type: String, default: "" },
    cropName: { type: String, default: "" },
    fieldName: { type: String, default: "" },
    activityType: { type: String, default: "Growth Observation" },
    date: { type: String, default: "" },
    details: { type: String, default: "" },
    inputUsed: { type: String, default: "" },
    dosageQuantity: { type: String, default: "" },
    costIncurred: { type: Number, default: 0 },
    operatorName: { type: String, default: "" },
    weatherConditionAtApplication: { type: String, default: "" },
    photoUrl: { type: String, default: "" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("CropLog", cropLogSchema);
