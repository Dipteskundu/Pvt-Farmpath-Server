const { buildCrudRouter } = require("../_crud/crudFactory");
const Farm = require("../../database/models/Farm");
const Field = require("../../database/models/Field");
const { today } = require("../../utils/dates");

const mapFarm = (doc) => ({
  id: String(doc._id),
  farmerId: String(doc.owner || ""),
  name: doc.name,
  location: doc.location || "",
  totalAreaAcres: doc.totalAreaAcres || 0,
  soilClassification: doc.soilClassification || "",
  irrigationType: doc.irrigationType || "Rainfed",
  waterSource: doc.waterSource || "",
  activeFieldsCount: 0,
  registeredDate: doc.registeredDate || today(),
  latitude: doc.latitude || 0,
  longitude: doc.longitude || 0,
  status: doc.status || "active",
});

const farmsRouter = buildCrudRouter({
  model: Farm,
  roles: ["farmer", "admin"],
  ownerKey: "owner",
  map: mapFarm,
  prepareCreate: () => ({ registeredDate: today() }),
  afterList: async (_req, data) => {
    const counts = await Field.aggregate([
      { $match: { farmId: { $exists: true, $ne: "" } } },
      { $group: { _id: "$farmId", count: { $sum: 1 } } },
    ]);
    const byId = {};
    counts.forEach((c) => {
      byId[String(c._id)] = c.count;
    });
    return data.map((f) => ({ ...f, activeFieldsCount: byId[f.id] || 0 }));
  },
  afterGet: async (req, data) => {
    const count = await Field.countDocuments({ farmId: String(data.id) });
    return { ...data, activeFieldsCount: count };
  },
});

module.exports = farmsRouter;
