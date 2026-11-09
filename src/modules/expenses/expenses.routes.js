const { buildCrudRouter } = require("../_crud/crudFactory");
const Expense = require("../../database/models/Expense");
const { today } = require("../../utils/dates");

const mapExpense = (doc) => ({
  id: String(doc._id),
  date: doc.date || today(),
  category: doc.category || "Other",
  fieldOrFarm: doc.fieldOrFarm || "",
  cropName: doc.cropName || "",
  description: doc.description || "",
  amountBdt: doc.amountBdt || 0,
  paymentMethod: doc.paymentMethod || "Cash",
  receiptReference: doc.receiptReference || "",
});

module.exports = buildCrudRouter({
  model: Expense,
  roles: ["farmer", "admin"],
  ownerKey: "owner",
  map: mapExpense,
  sort: { date: -1, createdAt: -1 },
});
