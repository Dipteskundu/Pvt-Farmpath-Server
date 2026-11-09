const mongoose = require("mongoose");

const expenseSchema = new mongoose.Schema(
  {
    owner: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    date: { type: String, default: "" },
    category: { type: String, required: [true, "Please add an expense category"] },
    fieldOrFarm: { type: String, default: "" },
    cropName: { type: String, default: "" },
    description: { type: String, default: "" },
    amountBdt: { type: Number, required: [true, "Please add an amount"], min: 0 },
    paymentMethod: { type: String, default: "Cash" },
    receiptReference: { type: String, default: "" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Expense", expenseSchema);
