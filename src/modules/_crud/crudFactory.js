const express = require("express");
const auth = require("../../middleware/auth.middleware");
const role = require("../../middleware/role.middleware");
const { logAudit } = require("../../utils/audit");

const isAdmin = (user) =>
  !!user && (user.role === "admin" || (Array.isArray(user.roles) && user.roles.includes("admin")));

/** Removes bookkeeping fields a client must never set directly. */
function sanitizeBody(body) {
  const rest = { ...(body || {}) };
  ["_id", "id", "__v", "createdAt", "updatedAt", "owner"].forEach((key) => delete rest[key]);
  return rest;
}

function defaultMap(doc) {
  const obj = typeof doc.toObject === "function" ? doc.toObject() : { ...doc };
  obj.id = String(obj._id);
  delete obj._id;
  delete obj.__v;
  delete obj.createdAt;
  delete obj.updatedAt;
  delete obj.owner;
  return obj;
}

/**
 * Builds a fully guarded REST router (list/get/create/update/delete) for a
 * mongoose model, with optional owner-scoping, hooks and custom sub-routes.
 *
 * Responses carry the raw resource payload; the frontend wraps them in its
 * `ApiResponse<T>` envelope. Errors flow to the global error middleware as
 * `{ message }` with a proper status code.
 */
function buildCrudRouter(options) {
  const {
    model,
    roles,
    ownerKey = null,
    map = defaultMap,
    populate = [],
    sort = { createdAt: -1, _id: -1 },
    filter,
    prepareCreate,
    prepareUpdate,
    afterList,
    afterGet,
    extra = [],
    auditName,
    routes = { list: true, get: true, create: true, update: true, remove: true },
  } = options;

  const router = express.Router();
  const guards = [auth, ...(roles && roles.length ? [role(roles)] : [])];
  const entity = auditName || model.modelName;

  const scope = (req) => {
    const base = typeof filter === "function" ? filter(req) || {} : filter || {};
    if (ownerKey && !isAdmin(req.user)) {
      return { ...base, [ownerKey]: req.user.id };
    }
    return base;
  };

  /**
   * `ownerKey` may be populated (a `supplier` loaded as a User document, say),
   * in which case `String(doc[ownerKey])` renders the document rather than its
   * id and every owner check fails with a 403. Resolve through `_id` first so
   * populated and raw references compare the same way.
   */
  const ownerId = (value) => {
    if (value === null || value === undefined) return "";
    if (typeof value === "object") return String(value._id !== undefined ? value._id : value);
    return String(value);
  };

  const canAccess = (req, doc) => {
    if (isAdmin(req.user) || !ownerKey) return true;
    return ownerId(doc[ownerKey]) === String(req.user.id);
  };

  const load = async (req) => {
    const doc = await model.findById(req.params.id).populate(populate);
    if (!doc) {
      const err = new Error("Resource not found");
      err.statusCode = 404;
      throw err;
    }
    if (!canAccess(req, doc)) {
      const err = new Error("You do not have permission to access this record");
      err.statusCode = 403;
      throw err;
    }
    return doc;
  };

  if (routes.list) {
    router.get("/", ...guards, async (req, res, next) => {
      try {
        const docs = await model.find(scope(req)).sort(sort).populate(populate);
        let data = docs.map(map);
        if (afterList) data = await afterList(req, data, docs);
        res.json(data);
      } catch (err) {
        next(err);
      }
    });
  }

  if (routes.get) {
    router.get("/:id", ...guards, async (req, res, next) => {
      try {
        const doc = await load(req);
        let data = map(doc);
        if (afterGet) data = await afterGet(req, data, doc);
        res.json(data);
      } catch (err) {
        next(err);
      }
    });
  }

  if (routes.create) {
    router.post("/", ...guards, async (req, res, next) => {
      try {
        const payload = sanitizeBody(req.body);
        if (ownerKey) {
          payload[ownerKey] = req.user.id;
        }
        if (prepareCreate) {
          Object.assign(payload, prepareCreate(req, payload));
        }
        const doc = await model.create(payload);
        const data = map(doc);
        await logAudit({
          req,
          action: "CREATE",
          entity,
          entityId: data.id,
          details: `Created ${entity} ${data.id}`,
        });
        res.status(201).json(data);
      } catch (err) {
        next(err);
      }
    });
  }

  if (routes.update) {
    router.put("/:id", ...guards, async (req, res, next) => {
      try {
        const doc = await load(req);
        const payload = sanitizeBody(req.body);
        const allowed = prepareUpdate ? prepareUpdate(req, payload, doc) : payload;
        Object.assign(doc, allowed);
        await doc.save();
        const data = map(doc);
        await logAudit({
          req,
          action: "UPDATE",
          entity,
          entityId: data.id,
          details: `Updated ${entity} ${data.id}`,
        });
        res.json(data);
      } catch (err) {
        next(err);
      }
    });
  }

  if (routes.remove) {
    router.delete("/:id", ...guards, async (req, res, next) => {
      try {
        const doc = await load(req);
        const data = map(doc);
        await doc.deleteOne();
        await logAudit({
          req,
          action: "DELETE",
          entity,
          entityId: data.id,
          details: `Deleted ${entity} ${data.id}`,
        });
        res.json({ success: true, id: data.id });
      } catch (err) {
        next(err);
      }
    });
  }

  extra.forEach(({ method, path, handler, guards: extraGuards }) => {
    router[method](
      path,
      ...guards,
      ...(extraGuards || []),
      async (req, res, next) => {
        try {
          await handler(req, res, next);
        } catch (err) {
          next(err);
        }
      }
    );
  });

  return router;
}

module.exports = { buildCrudRouter, defaultMap, isAdmin, sanitizeBody };
