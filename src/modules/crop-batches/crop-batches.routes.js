const { buildCrudRouter } = require("../_crud/crudFactory");
const CropBatch = require("../../database/models/CropBatch");
const { today } = require("../../utils/dates");

const mapCropBatch = (doc) => ({
  id: String(doc._id),
  fieldId: doc.fieldId || "",
  fieldName: doc.fieldName || "",
  cropName: doc.cropName,
  variety: doc.variety || "",
  category: doc.category || "Cereal",
  sowingDate: doc.sowingDate || "",
  expectedHarvestDate: doc.expectedHarvestDate || "",
  growthStage: doc.growthStage || "Germination",
  growthProgressPercent: doc.growthProgressPercent ?? 10,
  targetYieldKg: doc.targetYieldKg || 0,
  healthRating: doc.healthRating || "Good",
  seedSource: doc.seedSource || "",
  lastAction: doc.lastAction || "Direct Field Sowing & Seedling Bed Preparation",
  lastActionDate: doc.lastActionDate || today(),
});

module.exports = buildCrudRouter({
  model: CropBatch,
  roles: ["farmer", "admin"],
  ownerKey: "owner",
  map: mapCropBatch,
  prepareCreate: () => ({
    lastActionDate: today(),
    growthProgressPercent: 10,
    lastAction: "Direct Field Sowing & Seedling Bed Preparation",
  }),
});
