const express = require("express");
const { validationResult } = require("express-validator");
const auth = require("../../middleware/auth.middleware");
const role = require("../../middleware/role.middleware");
const QualityRequest = require("../../database/models/QualityRequest");
const MarketplaceListing = require("../../database/models/MarketplaceListing");
const User = require("../../database/models/User");
const {
  mapInspectionRequest,
  mapInspectionReport,
  mapScheduleEntry,
} = require("../../utils/domainMaps");
const { logAudit } = require("../../utils/audit");
const { today } = require("../../utils/dates");
const { assignRules, updateRules, submitRules } = require("./quality.validation");

const STATUSES = ["assigned", "in_progress", "completed", "cancelled"];

const isAdmin = (user) =>
  !!user &&
  (user.role === "admin" || (Array.isArray(user.roles) && user.roles.includes("admin")));

const httpError = (message, statusCode) => {
  const err = new Error(message);
  err.statusCode = statusCode;
  return err;
};

const throwIfInvalid = (req) => {
  const result = validationResult(req);
  if (result.isEmpty()) return;
  const err = new Error(result.array().map((e) => e.msg).join("; "));
  err.statusCode = 400;
  throw err;
};

/**
 * Who may see what.
 *
 * An admin sees every record. An inspector sees their own work list *plus*
 * the unassigned pool: a seller raising an inspection for a listing has
 * nobody to address it to, so until someone claims it the record is open to
 * whoever picks it up first. Two inspectors racing for the same record is
 * settled by `POST /:id/start`, which stamps `owner` on load — the loser's
 * next call finds the record owned and gets a 403.
 *
 * Everyone else (a farmer checking their own request, say) is scoped out
 * entirely; the listing carries the state they need.
 */
function buildScope(req) {
  const scope = {};

  if (req.query.status) {
    const status = String(req.query.status);
    if (!STATUSES.includes(status)) throw httpError("Unknown status filter", 400);
    scope.status = status;
  }

  if (!isAdmin(req.user)) scope.$or = [{ owner: req.user.id }, { owner: null }];
  return scope;
}

/**
 * @param {object} [opts]
 * @param {boolean} [opts.allowUnassigned] let an inspector read a record
 *   nobody owns yet. Only the routes that *claim* it (start/submit) and the
 *   detail view pass this — an edit or a delete still requires ownership, so
 *   an unclaimed record cannot be pulled out of the pool by a stray PUT.
 */
async function loadRecord(req, { allowUnassigned = false } = {}) {
  const doc = await QualityRequest.findById(req.params.id);
  if (!doc) throw httpError("Inspection not found", 404);
  if (!isAdmin(req.user)) {
    const owned = doc.owner && String(doc.owner) === String(req.user.id);
    const claimable = allowUnassigned && !doc.owner;
    if (!owned && !claimable) {
      throw httpError("You do not have permission to access this inspection", 403);
    }
  }
  return doc;
}

/** QC-26-4821 — mirrors the shape already used by the seeded certificates. */
async function nextCertificateNumber() {
  const yy = String(new Date().getFullYear()).slice(-2);
  for (let attempt = 0; attempt < 8; attempt += 1) {
    const code = `QC-${yy}-${String(Math.floor(1000 + Math.random() * 9000))}`;
    if (!(await QualityRequest.exists({ certificateNumber: code }))) return code;
  }
  return `QC-${yy}-${Date.now().toString().slice(-4)}`;
}

/**
 * Batch code for an inspection raised from a listing.
 *
 * The seller's lot code is the most useful label an inspector can be handed,
 * so it is preferred — but `batchCode` is also the seeder's natural key, so a
 * lot code that already names another record falls through to a generated
 * `INSP-YY-####` rather than colliding with it.
 */
async function nextBatchCode(listing) {
  const lot = String(listing.lotCode || "").trim();
  if (lot && !(await QualityRequest.exists({ batchCode: lot }))) return lot;

  const yy = String(new Date().getFullYear()).slice(-2);
  for (let attempt = 0; attempt < 8; attempt += 1) {
    const code = `INSP-${yy}-${String(Math.floor(1000 + Math.random() * 9000))}`;
    if (!(await QualityRequest.exists({ batchCode: code }))) return code;
  }
  return `INSP-${yy}-${Date.now().toString().slice(-4)}`;
}

/** Whitelist for create/update so a client cannot smuggle schema fields in. */
const ASSIGNABLE_FIELDS = [
  "batchCode",
  "produceType",
  "farmerName",
  "farmerPhone",
  "farmLocation",
  "variety",
  "quantityKg",
  "requestedAt",
  "scheduledDate",
  "priority",
  "status",
  "notes",
  "testingLabLocation",
];

function pick(body, keys) {
  const out = {};
  keys.forEach((key) => {
    if (body[key] !== undefined && body[key] !== null) out[key] = body[key];
  });
  return out;
}

const router = express.Router();

/**
 * Quality inspection portal — MARKETPLACE_PORTAL_PLAN Step 5.
 *
 *   GET    /api/quality              the caller's inspections (admin: all)
 *   GET    /api/quality/reports      submitted reports
 *   GET    /api/quality/schedule     dated, still-open inspections
 *   GET    /api/quality/:id          one inspection
 *   POST   /api/quality              raise one (admin assigns, inspector owns)
 *   POST   /api/quality/listing/:listingId  seller raises one for a listing
 *   PUT    /api/quality/:id          edit an assignment
 *   POST   /api/quality/:id/start    begin work
 *   POST   /api/quality/:id/submit   record measurements and close it
 *
 * Hand-written rather than `crudFactory`-generated because one record serves
 * as both the assignment and the report: the factory's owner-scoping is a
 * single fixed key, but `submit` must additionally claim an inspection, and
 * `owner` has to stay admin-settable while still being immutable to anyone
 * trying to hand themselves someone else's work.
 *
 * `/reports` and `/schedule` are declared before `/:id` so they are not
 * swallowed as an `:id` capture.
 */

router.get("/", auth, role(["inspector", "admin"]), async (req, res, next) => {
  try {
    const scope = buildScope(req);
    const docs = await QualityRequest.find(scope).sort({
      scheduledDate: 1,
      createdAt: -1,
      _id: -1,
    });
    res.json(docs.map(mapInspectionRequest));
  } catch (err) {
    next(err);
  }
});

router.get("/reports", auth, role(["inspector", "admin"]), async (req, res, next) => {
  try {
    const scope = { ...buildScope(req), status: "completed" };
    const docs = await QualityRequest.find(scope).sort({
      inspectionDate: -1,
      createdAt: -1,
      _id: -1,
    });
    res.json(docs.map(mapInspectionReport));
  } catch (err) {
    next(err);
  }
});

router.get("/schedule", auth, role(["inspector", "admin"]), async (req, res, next) => {
  try {
    const scope = {
      ...buildScope(req),
      status: { $in: ["assigned", "in_progress"] },
      scheduledDate: { $nin: [null, ""] },
    };
    const docs = await QualityRequest.find(scope).sort({ scheduledDate: 1, _id: 1 });
    res.json(docs.map(mapScheduleEntry));
  } catch (err) {
    next(err);
  }
});

router.get("/:id", auth, role(["inspector", "admin"]), async (req, res, next) => {
  try {
    res.json(mapInspectionRequest(await loadRecord(req, { allowUnassigned: true })));
  } catch (err) {
    next(err);
  }
});

router.post("/", auth, role(["inspector", "admin"]), assignRules(), async (req, res, next) => {
  try {
    throwIfInvalid(req);

    const payload = pick(req.body, ASSIGNABLE_FIELDS);
    // An admin picks who the work goes to; an inspector raising their own
    // inspection is pinned to themselves so the two can never diverge.
    const assignee = isAdmin(req.user)
      ? req.body.owner || null
      : req.user.id;
    payload.owner = assignee;
    payload.status = payload.status || "assigned";
    payload.requestedAt = payload.requestedAt || today();

    // `inspectorName` is denormalised for the admin quality list, which reads
    // it straight off the document — keep it in step with the assignment
    // instead of stamping the caller's name onto someone else's work.
    if (assignee && String(assignee) !== String(req.user.id)) {
      const inspector = await User.findById(assignee).select("name").lean();
      payload.inspectorName = (inspector && inspector.name) || "";
    } else {
      payload.inspectorName = req.user.name || "";
    }

    const doc = await QualityRequest.create(payload);
    await logAudit({
      req,
      action: "CREATE",
      entity: "QualityRequest",
      entityId: String(doc._id),
      details: `Inspection ${doc.batchCode}`,
    });
    res.status(201).json(mapInspectionRequest(doc));
  } catch (err) {
    next(err);
  }
});

/**
 * Seller-raised inspection request — Phase 2 of the marketplace plan.
 *
 * A listing enters the catalogue at "Pending Inspection" because a seller may
 * not declare their own grade. This is how the lot reaches an inspector:
 * it opens a request with no owner (so it sits in the claimable pool rather
 * than being assigned to somebody who never asked for the work) and stamps
 * `listing.inspectionRequestedAt` so the manage view can stop offering the
 * button.
 *
 * Raising a second one while the first is still open is a 409 — the work is
 * already queued. A *completed* report is superseded instead: this route
 * simply opens the new request, and `submit` repoints `qualityReport` at
 * whichever report lands last.
 */
router.post(
  "/listing/:listingId",
  auth,
  role(["farmer", "supplier", "admin"]),
  async (req, res, next) => {
    try {
      const listing = await MarketplaceListing.findById(req.params.listingId);
      if (!listing) throw httpError("Listing not found", 404);

      const owns = listing.owner && String(listing.owner) === String(req.user.id);
      if (!owns && !isAdmin(req.user)) {
        throw httpError("You do not have permission to request this inspection", 403);
      }

      const open = await QualityRequest.findOne({
        listing: listing._id,
        status: { $in: ["assigned", "in_progress"] },
      });
      if (open) {
        throw httpError("An inspection for this listing is already in the queue", 409);
      }

      const place = [listing.location, listing.district].filter(Boolean).join(", ");
      const requestedAt = today();

      const doc = await QualityRequest.create({
        batchCode: await nextBatchCode(listing),
        produceType: listing.produceName || "",
        farmerName: listing.farmerName || "",
        farmerPhone: listing.farmerPhone || "",
        farmLocation: place,
        variety: listing.variety || "",
        quantityKg: listing.quantityAvailableKg || 0,
        requestedAt,
        status: "assigned",
        owner: null,
        inspectorName: "",
        listing: listing._id,
        notes: `Inspection requested for marketplace listing ${String(listing._id)}`,
      });

      listing.inspectionRequestedAt = requestedAt;
      await listing.save();

      await logAudit({
        req,
        action: "CREATE",
        entity: "QualityRequest",
        entityId: String(doc._id),
        details: `Requested inspection of listing ${String(listing._id)} (${listing.produceName})`,
      });
      res.status(201).json(mapInspectionRequest(doc));
    } catch (err) {
      next(err);
    }
  }
);

router.put("/:id", auth, role(["inspector", "admin"]), updateRules(), async (req, res, next) => {
  try {
    throwIfInvalid(req);
    const doc = await loadRecord(req);

    Object.assign(doc, pick(req.body, ASSIGNABLE_FIELDS));
    // Reassignment is an admin action: `owner` is stripped from everyone else
    // rather than validated against, so an inspector cannot pull a record out
    // of a colleague's queue by editing it.
    if (isAdmin(req.user) && req.body.owner !== undefined) {
      doc.owner = req.body.owner || null;
      if (doc.owner) {
        const inspector = await User.findById(doc.owner).select("name").lean();
        doc.inspectorName = (inspector && inspector.name) || "";
      }
    }
    await doc.save();

    await logAudit({
      req,
      action: "UPDATE",
      entity: "QualityRequest",
      entityId: String(doc._id),
      details: `Inspection ${doc.batchCode}`,
    });
    res.json(mapInspectionRequest(doc));
  } catch (err) {
    next(err);
  }
});

router.post("/:id/start", auth, role(["inspector", "admin"]), async (req, res, next) => {
  try {
    const doc = await loadRecord(req, { allowUnassigned: true });
    if (doc.status === "completed") {
      throw httpError("A submitted inspection cannot be reopened", 409);
    }
    if (doc.status === "in_progress") {
      throw httpError("This inspection is already in progress", 409);
    }

    doc.status = "in_progress";
    // The claim. An unowned record in the pool becomes this inspector's the
    // moment they start it, which is also what closes the queue to everyone
    // else (their `loadRecord` now fails the ownership check).
    if (!doc.owner) doc.owner = req.user.id;
    if (!doc.inspectorName) doc.inspectorName = req.user.name || "";
    await doc.save();

    await logAudit({
      req,
      action: "UPDATE",
      entity: "QualityRequest",
      entityId: String(doc._id),
      details: `Started ${doc.batchCode}`,
    });
    res.json(mapInspectionRequest(doc));
  } catch (err) {
    next(err);
  }
});

router.post("/:id/submit", auth, role(["inspector", "admin"]), submitRules(), async (req, res, next) => {
  try {
    throwIfInvalid(req);
    const doc = await loadRecord(req, { allowUnassigned: true });

    if (doc.status === "completed") {
      throw httpError("This inspection has already been submitted", 409);
    }

    Object.assign(
      doc,
      pick(req.body, [
        "assignedGrade",
        "moistureContentPercent",
        "foreignMatterPercent",
        "aflatoxinPpm",
        "complianceVerdict",
        "visualCondition",
        "recommendedAction",
        "findings",
        "certificateNumber",
        "inspectionDate",
      ])
    );

    if (!doc.moistureStandardThreshold) doc.moistureStandardThreshold = 14;
    doc.inspectionDate = doc.inspectionDate || today();
    if (!doc.certificateNumber) doc.certificateNumber = await nextCertificateNumber();
    if (!doc.inspectorName) doc.inspectorName = req.user.name || "";
    if (!doc.owner) doc.owner = req.user.id;
    doc.status = "completed";
    doc.submittedAt = today();
    await doc.save();

    // Phase 2 — the grade belongs to the lot as much as to the report.
    //
    // A request raised from a listing points back at it, so submitting here
    // is what finally moves `qualityGrade` off "Pending Inspection" and
    // attaches `qualityReport`. The approval gate tests `qualityReport`, so a
    // re-inspection supersedes the previous one by repointing it rather than
    // detaching it — the lot is never left without a report while a new one
    // is in flight. `inspectionRequestedAt` clears because no request is open
    // any more, which is what puts the "Request inspection" button back.
    if (doc.listing) {
      const listing = await MarketplaceListing.findById(doc.listing);
      if (listing) {
        listing.qualityGrade = doc.assignedGrade;
        listing.qualityReport = doc._id;
        listing.inspectionRequestedAt = "";
        await listing.save();

        await logAudit({
          req,
          action: "UPDATE",
          entity: "MarketplaceListing",
          entityId: String(listing._id),
          details: `Grade ${doc.assignedGrade} applied from inspection ${doc.batchCode}`,
        });
      }
    }

    await logAudit({
      req,
      action: "UPDATE",
      entity: "QualityRequest",
      entityId: String(doc._id),
      details: `Submitted ${doc.batchCode} — ${doc.complianceVerdict}`,
    });
    res.json(mapInspectionReport(doc));
  } catch (err) {
    next(err);
  }
});

router.delete("/:id", auth, role(["admin"]), async (req, res, next) => {
  try {
    const doc = await QualityRequest.findById(req.params.id);
    if (!doc) throw httpError("Inspection not found", 404);

    const batchCode = doc.batchCode;
    await doc.deleteOne();

    await logAudit({
      req,
      action: "DELETE",
      entity: "QualityRequest",
      entityId: String(doc._id),
      details: `Inspection ${batchCode}`,
    });
    res.json({ success: true, id: String(doc._id) });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
