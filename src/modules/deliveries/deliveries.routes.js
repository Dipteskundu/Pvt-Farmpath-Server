const { buildCrudRouter } = require("../_crud/crudFactory");
const Delivery = require("../../database/models/Delivery");
const { mapBuyerDelivery } = require("../../utils/domainMaps");

/**
 * Consignments for the buyer portal — read-only tracking.
 *
 * Shipments are created by the logistics/admin side, so this router exposes
 * no writes. Owner-scoping means a buyer only ever sees consignments linked
 * to them, while an admin sees the full book.
 */
const router = buildCrudRouter({
  model: Delivery,
  roles: ["buyer", "admin", "logistics"],
  ownerKey: "owner",
  map: (doc) => mapBuyerDelivery(doc),
  sort: { createdAt: -1, _id: -1 },
  auditName: "Delivery",
  routes: { list: true, get: true, create: false, update: false, remove: false },
});

module.exports = router;
