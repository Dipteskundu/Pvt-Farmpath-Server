const mongoose = require("mongoose");

/**
 * Order.
 *
 * The flat fields below are read verbatim by `admin.mappers.js`
 * (`orderCode`, `buyerName`, `farmerName`, `produceItem`, `volumeKg`,
 * `totalValueBdt`, `escrowStatus`, `fulfillmentStatus`, `orderDate`,
 * `logisticsPartner`) — never rename or remove them.
 *
 * Buyer-portal fields are additive. Note that `quantityKg` / `totalAmountBdt`
 * are deliberately NOT duplicated: the frontend maps them from `volumeKg` /
 * `totalValueBdt` so there is one source of truth for an order's figures.
 */
const orderSchema = new mongoose.Schema(
  {
    orderCode: { type: String, required: [true, "Please add an order code"], trim: true },
    buyerName: { type: String, default: "" },
    farmerName: { type: String, default: "" },
    produceItem: { type: String, default: "" },
    volumeKg: { type: Number, default: 0 },
    totalValueBdt: { type: Number, default: 0 },
    escrowStatus: { type: String, default: "Held in Escrow" },
    /**
     * `YYYY-MM-DD` on which held escrow auto-releases to the seller — set when
     * the order reaches `Delivered`, cleared the moment it is released or
     * disputed. Empty means "no clock running" (not yet delivered, or already
     * settled), which is also the state every record written before this field
     * existed lands in.
     */
    escrowReleaseAt: { type: String, default: "" },
    fulfillmentStatus: { type: String, default: "Order Placed" },
    orderDate: { type: String, default: "" },
    logisticsPartner: { type: String, default: "" },

    // ── buyer portal (additive) ────────────────────────────────
    owner: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    listing: { type: mongoose.Schema.Types.ObjectId, ref: "MarketplaceListing" },
    farmerPhone: { type: String, default: "" },
    unitPriceBdt: { type: Number, default: 0 },
    deliveryAddress: { type: String, default: "" },
    estimatedDelivery: { type: String, default: "" },
    deliveredAt: { type: String, default: "" },
    paymentStatus: { type: String, default: "pending" },
    trackingSteps: {
      type: [{ label: String, date: String, done: Boolean }],
      default: [],
    },

    // ── shared cart: produce lines and input lines (additive) ──
    /**
     * One cart holds both produce ("Products") and farm inputs ("Inputs"), so
     * an order has to say which it is before anything can act on it — cancel
     * returns stock to a listing or to a `Product` depending on this flag.
     * Absent means produce, so every record written before this field existed
     * keeps its old behaviour without a migration.
     */
    lineKind: { type: String, enum: ["produce", "input"], default: "produce" },
    /** Set only on `lineKind: "input"` — the `Product` that was bought. */
    inputProduct: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
    /**
     * Unit count and its label. `volumeKg` still carries the same number (the
     * admin table and `mapBuyerOrder` both read it), but for an input order
     * "15" means 15 bags, not 15 kg — so the label lives here.
     */
    quantityUnits: { type: Number, default: 0 },
    unitLabel: { type: String, default: "kg" },
  },
  { timestamps: true }
);

orderSchema.index({ owner: 1, orderDate: -1 });
orderSchema.index({ inputProduct: 1 });

module.exports = mongoose.model("Order", orderSchema);
