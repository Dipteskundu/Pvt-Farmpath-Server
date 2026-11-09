const { buildCrudRouter } = require("../_crud/crudFactory");
const Harvest = require("../../database/models/Harvest");
const { today } = require("../../utils/dates");

const mapHarvest = (doc) => ({
  id: String(doc._id),
  cropBatchId: doc.cropBatchId || "",
  cropName: doc.cropName || "",
  variety: doc.variety || "",
  fieldName: doc.fieldName || "",
  harvestDate: doc.harvestDate || today(),
  quantityKg: doc.quantityKg || 0,
  qualityGrade: doc.qualityGrade || "Grade A",
  moisturePercentage: doc.moisturePercentage || 0,
  storageLocation: doc.storageLocation || "",
  batchCode: doc.batchCode || "",
  storageCondition: doc.storageCondition || "Ambient Warehouse",
  marketReadiness: doc.marketReadiness || "Ready for Sale",
  estimatedValuationBdt: doc.estimatedValuationBdt || 0,
});

module.exports = buildCrudRouter({
  model: Harvest,
  roles: ["farmer", "admin"],
  ownerKey: "owner",
  map: mapHarvest,
  prepareCreate: (req, payload) => ({
    harvestDate: today(),
    batchCode: `LOT-${String(payload.cropName || "CROP")
      .toUpperCase()
      .slice(0, 4)}-26-${payload.quantityKg || 0}`,
  }),
  sort: { harvestDate: -1, createdAt: -1 },
});
