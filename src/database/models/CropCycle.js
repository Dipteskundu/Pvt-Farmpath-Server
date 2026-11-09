const mongoose = require("mongoose");

const cropCycleSchema = new mongoose.Schema(
  {
    farmer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    field: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Field",
      required: true,
    },
    crop: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Crop",
      required: true,
    },
    seed: {
      type: String,
    },
    startDate: {
      type: Date,
      required: true,
    },
    expectedHarvestDate: {
      type: Date,
    },
    actualHarvestDate: {
      type: Date,
    },
    status: {
      type: String,
      enum: ["planned", "growing", "ready", "harvested", "completed"],
      default: "planned",
    },
    activities: [
      {
        name: String,
        date: Date,
        completed: Boolean,
        notes: String,
      },
    ],
    expenses: [
      {
        category: String,
        amount: Number,
        date: Date,
        description: String,
      },
    ],
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("CropCycle", cropCycleSchema);
