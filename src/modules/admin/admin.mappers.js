const { dateOnly } = require("../../utils/dates");

const mapListing = (doc) => ({
  id: String(doc._id),
  farmerName: doc.farmerName || "",
  farmerPhone: doc.farmerPhone || "",
  produceName: doc.produceName || "",
  variety: doc.variety || "",
  category: doc.category || "",
  quantityAvailableKg: doc.quantityAvailableKg || 0,
  askingPricePerKg: doc.askingPricePerKg || 0,
  suggestedFloorPrice: doc.suggestedFloorPrice || 0,
  suggestedCeilingPrice: doc.suggestedCeilingPrice || 0,
  qualityGrade: doc.qualityGrade || "Pending Inspection",
  locationHub: doc.locationHub || "",
  status: doc.status || "Pending Review",
  listedDate: doc.listedDate || dateOnly(doc.createdAt),
  // Phase 2 moderation extras: `qualityReport` is the approval gate (non-empty
  // once an inspector has submitted a report against this lot) and
  // `inspectionRequestedAt` says a request is already in the queue, so the UI
  // can explain a disabled Approve button instead of failing on click.
  qualityReport: doc.qualityReport ? String(doc.qualityReport) : "",
  inspectionRequestedAt: doc.inspectionRequestedAt || "",
});

const mapOrder = (doc) => ({
  id: String(doc._id),
  orderCode: doc.orderCode || "",
  buyerName: doc.buyerName || "",
  farmerName: doc.farmerName || "",
  produceItem: doc.produceItem || "",
  volumeKg: doc.volumeKg || 0,
  totalValueBdt: doc.totalValueBdt || 0,
  escrowStatus: doc.escrowStatus || "Held in Escrow",
  fulfillmentStatus: doc.fulfillmentStatus || "Order Placed",
  orderDate: doc.orderDate || dateOnly(doc.createdAt),
  logisticsPartner: doc.logisticsPartner || "",
});

const mapPayment = (doc) => ({
  id: String(doc._id),
  transactionRef: doc.transactionRef || "",
  recipientName: doc.recipientName || "",
  recipientRole: doc.recipientRole || "Farmer",
  amountBdt: doc.amountBdt || 0,
  purpose: doc.purpose || "Harvest Sale Payout",
  payoutStatus: doc.payoutStatus || "Pending Approval",
  paymentChannel: doc.paymentChannel || "bKash Merchant",
  initiatedAt: doc.initiatedAt || dateOnly(doc.createdAt),
  approvedBy: doc.approvedBy || "",
});

const mapQuality = (doc) => ({
  id: String(doc._id),
  batchCode: doc.batchCode || "",
  produceType: doc.produceType || "",
  farmerName: doc.farmerName || "",
  testingLabLocation: doc.testingLabLocation || "",
  inspectorName: doc.inspectorName || "",
  assignedGrade: doc.assignedGrade || "Grade A",
  moistureContentPercent: doc.moistureContentPercent || 0,
  moistureStandardThreshold: doc.moistureStandardThreshold || 0,
  foreignMatterPercent: doc.foreignMatterPercent || 0,
  aflatoxinPpm: doc.aflatoxinPpm || 0,
  complianceVerdict: doc.complianceVerdict || "Passed",
  inspectionDate: doc.inspectionDate || dateOnly(doc.createdAt),
  certificateNumber: doc.certificateNumber || "",
});

const mapLogistics = (doc) => ({
  id: String(doc._id),
  consignmentCode: doc.consignmentCode || "",
  originHub: doc.originHub || "",
  destinationDepot: doc.destinationDepot || "",
  cargoDescription: doc.cargoDescription || "",
  cargoWeightKg: doc.cargoWeightKg || 0,
  vehicleType: doc.vehicleType || "Open Bed Truck",
  driverName: doc.driverName || "",
  driverPhone: doc.driverPhone || "",
  temperatureCelsius: doc.temperatureCelsius || 0,
  targetTempRange: doc.targetTempRange || "",
  transitStatus: doc.transitStatus || "Dispatched",
  estimatedArrival: doc.estimatedArrival || "",
  coldChainIntegrity: doc.coldChainIntegrity || "Optimal",
});

const mapTrainingAdmin = (doc) => ({
  id: String(doc._id),
  courseTitle: doc.title || "",
  targetRegion: doc.targetRegion || "",
  enrolledCount: doc.enrolledCount || 0,
  completionRatePercent: doc.completionRatePercent || 0,
  instructorAssigned: doc.instructor || "",
  status: doc.status || "Published",
  lastUpdated: doc.lastUpdated || dateOnly(doc.updatedAt || doc.createdAt),
  feedbackScore: doc.feedbackScore ?? 5,
});

const mapReport = (doc) => ({
  id: String(doc._id),
  reportCode: doc.reportCode || "",
  title: doc.title || "",
  category: doc.category || "Yield Forecast",
  reportingPeriod: doc.reportingPeriod || "",
  fileSizeMb: doc.fileSizeMb || 0,
  generatedDate: doc.generatedDate || dateOnly(doc.createdAt),
  summaryFindings: doc.summaryFindings || "",
  confidentialityLevel: doc.confidentialityLevel || "Platform Internal",
});

const mapDispute = (doc) => ({
  id: String(doc._id),
  caseNumber: doc.caseNumber || "",
  plaintiff: {
    name: doc.plaintiff?.name || "",
    role: doc.plaintiff?.role || "Farmer",
  },
  defendant: {
    name: doc.defendant?.name || "",
    role: doc.defendant?.role || "Buyer",
  },
  relatedOrderCode: doc.relatedOrderCode || "",
  disputeReason: doc.disputeReason || "Payment Delay",
  disputedAmountBdt: doc.disputedAmountBdt || 0,
  evidenceAttachmentsCount: doc.evidenceAttachmentsCount || 0,
  openedNote: doc.openedNote || "",
  caseStatus: doc.caseStatus || "Open - Under Review",
  openedAt: doc.openedAt || dateOnly(doc.createdAt),
  resolutionNotes: doc.resolutionNotes || "",
});

const mapVerification = (doc) => ({
  id: String(doc._id),
  farmerId: doc.farmerId || "",
  farmerName: doc.farmerName || "",
  farmName: doc.farmName || "",
  division: doc.division || "",
  district: doc.district || "",
  upazila: doc.upazila || "",
  totalAcreage: doc.totalAcreage || 0,
  cadastralPlotNumbers: doc.cadastralPlotNumbers || "",
  mouzaKhatianNumber: doc.mouzaKhatianNumber || "",
  submissionDate: doc.submissionDate || dateOnly(doc.createdAt),
  status: doc.status || "pending",
  assignedOfficerName: doc.assignedOfficerName || "",
  officerNotes: doc.officerNotes || "",
  evidenceDocuments: (doc.evidenceDocuments || []).map((d) => ({
    name: d.name || "",
    type: d.type || "",
    url: d.url || "",
  })),
});

const mapMasterCrop = (doc) => ({
  id: String(doc._id),
  cropName: doc.cropName || "",
  scientificName: doc.scientificName || "",
  category: doc.category || "Cereal",
  recommendedSeason: doc.recommendedSeason || "",
  optimalSoilPhRange: doc.optimalSoilPhRange || "",
  minRainfallMm: doc.minRainfallMm || 0,
  maxRainfallMm: doc.maxRainfallMm || 0,
  averageMaturityDays: doc.averageMaturityDays || 0,
  standardYieldKgPerAcre: doc.standardYieldKgPerAcre || 0,
  benchmarkPriceBdtPerKg: doc.benchmarkPriceBdtPerKg || 0,
  approvedVarieties: doc.approvedVarieties || [],
  pestVulnerabilities: doc.pestVulnerabilities || [],
});

const mapAdvisory = (doc) => ({
  id: String(doc._id),
  title: doc.title || "",
  targetCrops: doc.targetCrops || [],
  targetDistricts: doc.targetDistricts || [],
  severity: doc.severity || "medium",
  category: doc.category || "Pest Alert",
  issueDate: doc.issueDate || dateOnly(doc.createdAt),
  validUntil: doc.validUntil || "",
  advisoryText: doc.advisoryText || "",
  recommendedTreatments: doc.recommendedTreatments || [],
  issuingAuthority: doc.issuingAuthority || "",
});

const mapMarketPrice = (doc) => ({
  id: String(doc._id),
  commodityName: doc.commodityName || "",
  variety: doc.variety || "",
  marketLocation: doc.marketLocation || "",
  division: doc.division || "",
  wholesaleMinPriceBdt: doc.wholesaleMinPriceBdt || 0,
  wholesaleMaxPriceBdt: doc.wholesaleMaxPriceBdt || 0,
  wholesaleModalPriceBdt: doc.wholesaleModalPriceBdt || 0,
  retailPriceBdt: doc.retailPriceBdt || 0,
  priceTrend: doc.priceTrend || "stable",
  recordedDate: doc.recordedDate || dateOnly(doc.createdAt),
  volumeTradedMetricTons: doc.volumeTradedMetricTons || 0,
});

const mapAuditLog = (doc) => ({
  id: String(doc._id),
  timestamp: doc.timestamp || "",
  actorName: doc.actorName || "",
  actorRole: doc.actorRole || "",
  actionType: doc.actionType || "",
  targetEntity: doc.targetEntity || "",
  entityId: doc.entityId || "",
  ipAddress: doc.ipAddress || "",
  status: doc.status || "success",
  details: doc.details || "",
});

const mapWeatherAlert = (doc) => ({
  id: String(doc._id),
  severity: doc.severity || "warning",
  title: doc.title || "",
  message: doc.message || "",
  validUntil: doc.validUntil || "",
  actionRequired: doc.actionRequired || "",
});

module.exports = {
  mapListing,
  mapOrder,
  mapPayment,
  mapQuality,
  mapLogistics,
  mapTrainingAdmin,
  mapReport,
  mapDispute,
  mapVerification,
  mapMasterCrop,
  mapAdvisory,
  mapMarketPrice,
  mapAuditLog,
  mapWeatherAlert,
};
