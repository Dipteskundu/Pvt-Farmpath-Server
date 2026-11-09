const { buildCrudRouter } = require("../_crud/crudFactory");
const Field = require("../../database/models/Field");
const { today } = require("../../utils/dates");

const mapField = (doc) => ({
  id: String(doc._id),
  farmId: doc.farmId || "",
  farmName: doc.farmName || "",
  name: doc.name,
  sizeAcres: doc.sizeAcres || 0,
  currentCrop: doc.currentCrop || "",
  soilPh: doc.soilPh ?? 7,
  nitrogenLevelKgPerHa: doc.nitrogenLevelKgPerHa || 0,
  phosphorusLevelKgPerHa: doc.phosphorusLevelKgPerHa || 0,
  potassiumLevelKgPerHa: doc.potassiumLevelKgPerHa || 0,
  moisturePercentage: doc.moisturePercentage || 0,
  ndviScore: doc.ndviScore || 0,
  irrigationStatus: doc.irrigationStatus || "Optimal",
  lastSoilTested: doc.lastSoilTested || today(),
  status: doc.status || "cultivated",
});

module.exports = buildCrudRouter({
  model: Field,
  roles: ["farmer", "admin"],
  ownerKey: "owner",
  map: mapField,
  prepareCreate: () => ({ lastSoilTested: today() }),
});
