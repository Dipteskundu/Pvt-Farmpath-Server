const { buildCrudRouter } = require("../_crud/crudFactory");
const CropLog = require("../../database/models/CropLog");
const { today } = require("../../utils/dates");

const mapCropLog = (doc) => ({
  id: String(doc._id),
  cropBatchId: doc.cropBatchId || "",
  cropName: doc.cropName || "",
  fieldName: doc.fieldName || "",
  activityType: doc.activityType || "Growth Observation",
  date: doc.date || today(),
  details: doc.details || "",
  inputUsed: doc.inputUsed || "",
  dosageQuantity: doc.dosageQuantity || "",
  costIncurred: doc.costIncurred || 0,
  operatorName: doc.operatorName || "",
  weatherConditionAtApplication: doc.weatherConditionAtApplication || "",
  photoUrl: doc.photoUrl || "",
});

module.exports = buildCrudRouter({
  model: CropLog,
  roles: ["farmer", "admin"],
  ownerKey: "owner",
  map: mapCropLog,
  prepareCreate: () => ({ date: today() }),
  filter: (req) => (req.query.cropBatchId ? { cropBatchId: req.query.cropBatchId } : {}),
});
