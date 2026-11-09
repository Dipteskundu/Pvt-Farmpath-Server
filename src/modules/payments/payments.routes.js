const { buildCrudRouter } = require("../_crud/crudFactory");
const Payment = require("../../database/models/Payment");
const { mapBuyerPayment } = require("../../utils/domainMaps");

const isAdmin = (user) =>
  !!user &&
  (user.role === "admin" || (Array.isArray(user.roles) && user.roles.includes("admin")));

/**
 * Buyer payment history.
 *
 * Read-only on purpose. Purchase records are created by
 * `POST /api/orders/checkout`; letting a client POST or PUT a payment would
 * let anyone mark their own payment completed. Admins still see every record
 * (payouts included) because `scope()` skips owner-scoping for them.
 *
 * Non-admins are additionally pinned to `direction: "purchase"` so a buyer can
 * never browse the outbound payout ledger for farmers and logistics vendors.
 * `supplier` is admitted alongside `buyer` for the same reason `/api/orders`
 * admits it: the supplier portal's Payments page reuses this endpoint, and the
 * `direction` filter above already keeps it to that account's own purchases.
 */
const router = buildCrudRouter({
  model: Payment,
  roles: ["buyer", "supplier", "admin"],
  ownerKey: "owner",
  map: (doc) => mapBuyerPayment(doc),
  filter: (req) => (isAdmin(req.user) ? {} : { direction: "purchase" }),
  sort: { createdAt: -1, _id: -1 },
  auditName: "Payment",
  routes: { list: true, get: true, create: false, update: false, remove: false },
});

module.exports = router;
