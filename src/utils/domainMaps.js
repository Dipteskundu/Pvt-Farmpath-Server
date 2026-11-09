const { dateOnly } = require("./dates");

/**
 * Domain maps for the business portals (Steps 3-5).
 *
 * The admin-facing records store human-readable status strings ("In Transit",
 * "Pending Approval"). The buyer portal's TypeScript unions expect machine
 * tokens ("shipped", "pending"). These helpers translate in one direction
 * only: the DB remains the single source of truth, and nothing is duplicated
 * so the two views cannot drift apart.
 */

// ── Order ─────────────────────────────────────────────────────

/** `fulfillmentStatus` → `OrderStatus` union from `src/types/index.ts`. */
const ORDER_STATUS_MAP = {
  "order placed": "placed",
  confirmed: "confirmed",
  "quality check": "quality_check",
  "quality passed": "quality_check",
  "in transit": "shipped",
  dispatched: "shipped",
  shipped: "shipped",
  delivered: "delivered",
  cancelled: "cancelled",
};

function toOrderStatus(raw) {
  const key = String(raw || "").trim().toLowerCase();
  return ORDER_STATUS_MAP[key] || "placed";
}

/** `escrowStatus` → `PaymentStatus` union (pending | paid | refunded). */
function toPaymentStatus(doc) {
  if (doc.paymentStatus) return doc.paymentStatus;
  const escrow = String(doc.escrowStatus || "").toLowerCase();
  if (escrow.includes("disputed")) return "pending";
  if (escrow.includes("released")) return "paid";
  return "pending";
}

/** Frontend status → the admin vocabulary stored in `fulfillmentStatus`. */
function toFulfillmentStatus(status) {
  const map = {
    placed: "Order Placed",
    confirmed: "Confirmed",
    quality_check: "Quality Passed",
    shipped: "In Transit",
    delivered: "Delivered",
    cancelled: "Cancelled",
  };
  return map[status] || "Order Placed";
}

const TRACKING_TEMPLATES = [
  { label: "Order placed", status: "placed" },
  { label: "Quality check", status: "quality_check" },
  { label: "Shipped", status: "shipped" },
  { label: "Delivered", status: "delivered" },
];

/** Real steps if stored, otherwise derived from the current status so the
 *  order timeline is never an empty list. */
function buildTrackingSteps(doc, status) {
  if (Array.isArray(doc.trackingSteps) && doc.trackingSteps.length) {
    return doc.trackingSteps.map((s) => ({
      label: String(s.label || ""),
      date: String(s.date || ""),
      done: !!s.done,
    }));
  }

  const reached = TRACKING_TEMPLATES.map((t) => t.status).indexOf(status);
  const base = dateOnly(doc.createdAt);

  return TRACKING_TEMPLATES.map((t, i) => ({
    label: t.label,
    date: i <= reached ? (i === 0 ? (doc.orderDate || base) : base) : "",
    done: i <= reached,
  }));
}

/** DB `Order` → the frontend's `BuyerOrder`. */
function mapBuyerOrder(doc, populatedListing) {
  const listing = populatedListing && populatedListing._id ? populatedListing : null;
  const status = toOrderStatus(doc.fulfillmentStatus);

  const volumeKg = Number(doc.volumeKg) || 0;
  const totalValueBdt = Number(doc.totalValueBdt) || 0;
  const unitPriceBdt =
    Number(doc.unitPriceBdt) || (volumeKg > 0 ? totalValueBdt / volumeKg : 0);

  return {
    id: String(doc._id),
    orderCode: doc.orderCode || "",
    listing: {
      id: listing ? String(listing._id) : doc.listing ? String(doc.listing) : "",
      cropName: listing ? listing.produceName : doc.produceItem || "",
      variety: listing ? listing.variety || "" : "",
      imageUrl: (listing && listing.imageUrl) || "/listing-placeholder.svg",
      qualityGrade:
        (listing && listing.qualityGrade) || doc.qualityGrade || "Grade A",
    },
    farmerName: doc.farmerName || "",
    farmerPhone: doc.farmerPhone || "",
    buyerName: doc.buyerName || "",
    /**
     * Which half of the shared cart this is, plus the unit its quantity is
     * counted in. Input lines store their unit in `unitLabel` because "15" of
     * a fertilizer order means 15 bags, not 15 kg — `volumeKg` still carries
     * the number so every pre-existing reader keeps working.
     */
    lineKind: doc.lineKind === "input" ? "input" : "produce",
    unit: doc.unitLabel || "kg",
    quantityKg: volumeKg,
    unitPriceBdt: Math.round(unitPriceBdt * 100) / 100,
    totalAmountBdt: totalValueBdt,
    status,
    paymentStatus: toPaymentStatus(doc),
    /**
     * Escrow state and — while funds are still held — the date they release
     * on. `toPaymentStatus` above already reads `escrowStatus`, so a released
     * order reports `paymentStatus: "paid"` without this field being
     * duplicated into the payment row.
     */
    escrowStatus: doc.escrowStatus || "Held in Escrow",
    escrowReleaseAt: doc.escrowReleaseAt || "",
    placedAt: doc.orderDate || dateOnly(doc.createdAt),
    deliveryAddress: doc.deliveryAddress || "",
    estimatedDelivery: doc.estimatedDelivery || "",
    ...(doc.deliveredAt ? { deliveredAt: doc.deliveredAt } : {}),
    trackingSteps: buildTrackingSteps(doc, status),
  };
}

// ── Payment ───────────────────────────────────────────────────

const PAYMENT_STATUS_MAP = {
  completed: "completed",
  "pending approval": "pending",
  pending: "pending",
  processing: "pending",
  failed: "failed",
  rejected: "failed",
  refunded: "refunded",
};

function toPaymentRecordStatus(doc) {
  const key = String(doc.payoutStatus || "").trim().toLowerCase();
  return PAYMENT_STATUS_MAP[key] || "pending";
}

/** DB `Payment` (direction: "purchase") → the frontend's `BuyerPayment`. */
function mapBuyerPayment(doc) {
  return {
    id: String(doc._id),
    transactionRef: doc.transactionRef || "",
    orderCode: doc.orderCode || "",
    produceName: doc.produceName || doc.purpose || "",
    amountBdt: Number(doc.amountBdt) || 0,
    method: doc.method || "bKash",
    status: toPaymentRecordStatus(doc),
    paidAt: doc.paidAt || doc.initiatedAt || dateOnly(doc.createdAt),
  };
}

// ── Demand ────────────────────────────────────────────────────

/** DB `Demand` → the frontend's `BuyerDemand`. */
function mapBuyerDemand(doc, buyerName) {
  return {
    id: String(doc._id),
    buyerName: doc.buyerName || buyerName || "",
    productName: doc.product || "",
    variety: doc.variety || "",
    quantityKg: Number(doc.quantity) || 0,
    qualityGrade: doc.qualityGrade || "Any",
    maxPricePerKgBdt: Number(doc.maxPricePerKgBdt) || 0,
    preferredLocation: doc.preferredLocation || "",
    deliveryMethod: doc.deliveryMethod === "pickup" ? "pickup" : "delivery",
    deadline: doc.deadline ? dateOnly(doc.deadline) : "",
    status: doc.status || "open",
    postedAt: dateOnly(doc.createdAt),
    matchedFarmers: Number(doc.matchedFarmers) || 0,
    description: doc.description || doc.qualityRequirements || "",
  };
}

/** DB `Delivery` → buyer-facing shipment summary. */
function mapBuyerDelivery(doc) {
  return {
    id: String(doc._id),
    consignmentCode: doc.consignmentCode || "",
    orderCode: doc.orderCode || "",
    originHub: doc.originHub || "",
    destinationDepot: doc.destinationDepot || "",
    cargoDescription: doc.cargoDescription || "",
    cargoWeightKg: Number(doc.cargoWeightKg) || 0,
    vehicleType: doc.vehicleType || "",
    driverName: doc.driverName || "",
    driverPhone: doc.driverPhone || "",
    transitStatus: doc.transitStatus || "",
    estimatedArrival: doc.estimatedArrival || "",
    coldChainIntegrity: doc.coldChainIntegrity || "",
  };
}

// ── Supplier portal (Step 4) ──────────────────────────────────

/**
 * `Product.category` is a fixed mongoose enum (`seeds`, `fertilizer`, …) while
 * the supplier portal's union is title-cased with plural forms
 * (`Seeds`, `Fertilizers`, …). Both directions live here so neither side
 * invents a third spelling.
 */
const PRODUCT_CATEGORY_TO_DB = {
  seeds: "seeds",
  seed: "seeds",
  fertilizers: "fertilizer",
  fertilizer: "fertilizer",
  manure: "fertilizer",
  pesticides: "pesticide",
  pesticide: "pesticide",
  tools: "tools",
  equipment: "equipment",
  irrigation: "irrigation",
  packaging: "packaging",
};

const PRODUCT_CATEGORY_TO_UI = {
  seeds: "Seeds",
  fertilizer: "Fertilizers",
  pesticide: "Pesticides",
  tools: "Tools",
  equipment: "Equipment",
  irrigation: "Irrigation",
  packaging: "Packaging",
};

/** Valid `Product.category` values — used by validation to reject junk. */
const PRODUCT_CATEGORY_VALUES = Object.values(PRODUCT_CATEGORY_TO_DB);

/** UI union → DB enum. Returns `null` for anything unrecognised. */
function toDbProductCategory(raw) {
  const key = String(raw || "").trim().toLowerCase();
  return PRODUCT_CATEGORY_TO_DB[key] || null;
}

/** DB enum → UI union. */
function toUiProductCategory(raw) {
  const key = String(raw || "").trim().toLowerCase();
  return PRODUCT_CATEGORY_TO_UI[key] || "Seeds";
}

/** DB `Product` → the supplier portal's `SupplierProduct`. */
function mapSupplierProduct(doc) {
  const supplier = doc.supplier;
  return {
    id: String(doc._id),
    supplierId: supplier ? String(supplier._id || supplier) : "",
    supplierName: (supplier && supplier.name) || "",
    productName: doc.name || "",
    category: toUiProductCategory(doc.category),
    description: doc.description || "",
    pricePerUnitBdt: Number(doc.price) || 0,
    unit: doc.unit || "kg",
    stockQuantity: Number(doc.stock) || 0,
    minimumOrderQuantity: Number(doc.minimumOrderQuantity) || 1,
    imageUrl: doc.image || "/listing-placeholder.svg",
    isAvailable: !!doc.isActive,
    listedAt: doc.createdAt ? dateOnly(doc.createdAt) : "",
    // Ratings summary — server-owned, recomputed on every rating submission.
    // `Number(...) || 0` so documents written before these fields existed
    // read as 0 rather than `undefined`.
    averageRating: Number(doc.averageRating) || 0,
    totalRatings: Number(doc.totalRatings) || 0,
  };
}

// ── Quality inspector portal (Step 5) ─────────────────────────

/** DB `QualityRequest` → the inspector portal's `InspectionRequest`. */
function mapInspectionRequest(doc) {
  return {
    id: String(doc._id),
    harvestBatchCode: doc.batchCode || "",
    farmerName: doc.farmerName || "",
    farmerPhone: doc.farmerPhone || "",
    farmLocation: doc.farmLocation || "",
    cropName: doc.produceType || "",
    variety: doc.variety || "",
    quantityKg: Number(doc.quantityKg) || 0,
    requestedAt: doc.requestedAt || dateOnly(doc.createdAt),
    scheduledDate: doc.scheduledDate || "",
    status: doc.status || "assigned",
    priority: doc.priority === "urgent" ? "urgent" : "normal",
    notes: doc.notes || "",
  };
}

/**
 * The same record viewed as its submitted report. Fields the inspector has not
 * filled in yet fall back to sensible defaults so the reports list never shows
 * `undefined`.
 */
function mapInspectionReport(doc) {
  return {
    id: String(doc._id),
    inspectionRequestId: String(doc._id),
    harvestBatchCode: doc.batchCode || "",
    farmerName: doc.farmerName || "",
    cropName: doc.produceType || "",
    inspectorName: doc.inspectorName || "",
    inspectionDate: doc.inspectionDate || dateOnly(doc.createdAt),
    grade: doc.assignedGrade || "Grade A",
    moistureContentPercent: Number(doc.moistureContentPercent) || 0,
    foreignMatterPercent: Number(doc.foreignMatterPercent) || 0,
    aflatoxinPpm: Number(doc.aflatoxinPpm) || 0,
    visualCondition: doc.visualCondition || "Good",
    recommendedAction: doc.recommendedAction || "",
    verdict: doc.complianceVerdict || "Passed",
    certificateNumber: doc.certificateNumber || "",
    findings: doc.findings || "",
    photoUrls: Array.isArray(doc.photoUrls) ? doc.photoUrls : [],
    submittedAt: doc.submittedAt || dateOnly(doc.updatedAt || doc.createdAt),
  };
}

/**
 * A record projected onto the inspector's calendar. Only inspections that
 * have a scheduled date appear; those still awaiting scheduling are the
 * inspector's inbox instead.
 */
function mapScheduleEntry(doc) {
  const statusMap = {
    assigned: "upcoming",
    in_progress: "in_progress",
    completed: "done",
    cancelled: "cancelled",
  };
  return {
    id: String(doc._id),
    date: doc.scheduledDate || "",
    time: "09:00",
    farmerName: doc.farmerName || "",
    location: doc.farmLocation || doc.testingLabLocation || "",
    cropName: doc.produceType || "",
    status: statusMap[doc.status] || "upcoming",
  };
}

module.exports = {
  toOrderStatus,
  toPaymentStatus,
  toFulfillmentStatus,
  toPaymentRecordStatus,
  buildTrackingSteps,
  mapBuyerOrder,
  mapBuyerPayment,
  mapBuyerDemand,
  mapBuyerDelivery,
  ORDER_STATUS_MAP,
  PAYMENT_STATUS_MAP,
  toDbProductCategory,
  toUiProductCategory,
  PRODUCT_CATEGORY_VALUES,
  mapSupplierProduct,
  mapInspectionRequest,
  mapInspectionReport,
  mapScheduleEntry,
};
