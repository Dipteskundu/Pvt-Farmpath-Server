const express = require("express");
const auth = require("../../middleware/auth.middleware");
const optionalAuth = require("../../middleware/optionalAuth.middleware");
const role = require("../../middleware/role.middleware");
const Product = require("../../database/models/Product");
const { mapSupplierProduct } = require("../../utils/domainMaps");
const { validateProduct, validateRating } = require("./products.validation");
const { logAudit } = require("../../utils/audit");

const isAdmin = (user) =>
  !!user &&
  (user.role === "admin" || (Array.isArray(user.roles) && user.roles.includes("admin")));

const httpError = (message, statusCode) => {
  const err = new Error(message);
  err.statusCode = statusCode;
  return err;
};

const supplierIdOf = (doc) =>
  doc.supplier
    ? String(doc.supplier._id !== undefined ? doc.supplier._id : doc.supplier)
    : "";

/**
 * Supplier input catalogue — `/inputs`, the second half of the marketplace
 * feature (MARKETPLACE_AS_FEATURE_PLAN P4).
 *
 *   GET    /api/products        public list  — anonymous sees active stock only
 *   GET    /api/products/:id    public read
 *   POST   /api/products        supplier / admin
 *   PUT    /api/products/:id    owner or admin
 *   DELETE /api/products/:id    owner or admin
 *
 * Reads are unauthenticated on purpose: `/inputs` has no RouteGuard, so an
 * anonymous visitor has to be able to load the catalogue. What changes per
 * caller is only *which rows* they see:
 *
 *   anonymous  → `{ isActive: true }` — saleable stock, nothing half-listed
 *   session    → their own rows (any status) ∪ every other active row, so a
 *                supplier's own drafts appear alongside the public catalogue
 *   admin      → everything
 *
 * Writes never become public: they carry `auth` + `role`, and update/delete
 * re-check ownership below (the id of a populated `supplier` has to be read
 * through `_id`, otherwise the comparison stringifies a whole document).
 */
const router = express.Router();

function readScope(req) {
  if (isAdmin(req.user)) return {};
  if (req.user) {
    return { $or: [{ supplier: req.user.id }, { isActive: true }] };
  }
  return { isActive: true };
}

router.get("/", optionalAuth, async (req, res, next) => {
  try {
    const { query, user } = req;

    if (query.mine === "1") {
      if (!user) throw httpError("Sign in to see your own products", 401);
      const docs = await Product.find({ supplier: user.id })
        .sort({ createdAt: -1, _id: -1 })
        .populate("supplier", "name");
      return res.json(docs.map(mapSupplierProduct));
    }

    const scope = readScope(req);

    if (query.category) {
      scope.category = String(query.category).toLowerCase();
    }
    if (query.available === "1") scope.isActive = true;
    if (query.search) {
      const re = new RegExp(
        String(query.search).replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
        "i"
      );
      scope.$and = [{ $or: [{ name: re }, { description: re }] }];
    }

    const docs = await Product.find(scope)
      .sort({ createdAt: -1, _id: -1 })
      .populate("supplier", "name");
    res.json(docs.map(mapSupplierProduct));
  } catch (err) {
    next(err);
  }
});

router.get("/:id", optionalAuth, async (req, res, next) => {
  try {
    const doc = await Product.findById(req.params.id).populate("supplier", "name");
    if (!doc) throw httpError("Product not found", 404);

    const visible =
      isAdmin(req.user) ||
      !!doc.isActive ||
      (req.user && supplierIdOf(doc) === String(req.user.id));
    if (!visible) throw httpError("Product not found", 404);

    res.json(mapSupplierProduct(doc));
  } catch (err) {
    next(err);
  }
});

router.post("/", auth, role(["supplier", "admin"]), async (req, res, next) => {
  try {
    const payload = validateProduct(req.body, { partial: false });
    payload.supplier = req.user.id;

    const doc = await Product.create(payload);
    // `populate` only runs on the read paths, so run it here too rather than
    // hand-stitching `{_id, name}` onto an ObjectId path — mongoose would try
    // to cast that object and drop the reference.
    await doc.populate("supplier", "name");

    await logAudit({
      req,
      action: "CREATE",
      entity: "Product",
      entityId: String(doc._id),
      details: `Created product ${doc.name}`,
    });
    res.status(201).json(mapSupplierProduct(doc));
  } catch (err) {
    next(err);
  }
});

router.put("/:id", auth, role(["supplier", "admin"]), async (req, res, next) => {
  try {
    const doc = await Product.findById(req.params.id).populate("supplier", "name");
    if (!doc) throw httpError("Product not found", 404);

    const owns = supplierIdOf(doc) === String(req.user.id);
    if (!owns && !isAdmin(req.user)) {
      throw httpError("You do not have permission to edit this product", 403);
    }

    // `validateProduct` drops `supplier`, so a client cannot move a product
    // to another supplier by editing it.
    Object.assign(doc, validateProduct(req.body, { partial: true }));
    await doc.save();

    await logAudit({
      req,
      action: "UPDATE",
      entity: "Product",
      entityId: String(doc._id),
      details: `Updated product ${doc.name}`,
    });
    res.json(mapSupplierProduct(doc));
  } catch (err) {
    next(err);
  }
});

router.delete("/:id", auth, role(["supplier", "admin"]), async (req, res, next) => {
  try {
    const doc = await Product.findById(req.params.id).populate("supplier", "name");
    if (!doc) throw httpError("Product not found", 404);

    const owns = supplierIdOf(doc) === String(req.user.id);
    if (!owns && !isAdmin(req.user)) {
      throw httpError("You do not have permission to delete this product", 403);
    }

    const id = String(doc._id);
    const name = doc.name;
    await doc.deleteOne();

    await logAudit({
      req,
      action: "DELETE",
      entity: "Product",
      entityId: id,
      details: `Deleted product ${name}`,
    });
    res.json({ success: true, id });
  } catch (err) {
    next(err);
  }
});

/**
 * Ratings & feedback — the Inputs half of the marketplace feature.
 *
 *   POST /api/products/:id/rating    any signed-in user, one per product
 *   GET  /api/products/:id/ratings   public — reviews, newest first
 *
 * Declared after the CRUD block: `/:id/rating` and `/:id/ratings` are two
 * path segments, so they can never be swallowed by the one-segment `GET
 * /:id` above. Reads reuse that route's visibility rule (active product, or
 * the owner's own row, or admin) so reviews never leak a delisted item, and
 * the write requires only a session — no purchase gate (Option A) — because
 * the order history check would add a query per rating to protect nothing
 * that matters more than the one-per-user limit already enforced here.
 */
router.get("/:id/ratings", optionalAuth, async (req, res, next) => {
  try {
    const doc = await Product.findById(req.params.id);
    if (!doc) throw httpError("Product not found", 404);

    const visible =
      isAdmin(req.user) ||
      !!doc.isActive ||
      (req.user && supplierIdOf(doc) === String(req.user.id));
    if (!visible) throw httpError("Product not found", 404);

    const ratings = (Array.isArray(doc.ratings) ? doc.ratings : [])
      .map((r) => ({
        rating: r.rating,
        comment: r.comment,
        userName: r.userName || "",
        userId: String(r.userId || ""),
        createdAt: r.createdAt,
      }))
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    res.json(ratings);
  } catch (err) {
    next(err);
  }
});

router.post("/:id/rating", auth, async (req, res, next) => {
  try {
    const doc = await Product.findById(req.params.id)
      .select("name isActive supplier ratings")
      .lean();
    if (!doc) throw httpError("Product not found", 404);

    const visible =
      isAdmin(req.user) ||
      !!doc.isActive ||
      supplierIdOf(doc) === String(req.user.id);
    if (!visible) throw httpError("Product not found", 404);

    const userId = String(req.user.id);
    if ((doc.ratings || []).some((r) => String(r.userId) === userId)) {
      throw httpError("You have already rated this product", 400);
    }

    const { rating, comment } = validateRating(req.body);
    const entry = {
      rating,
      comment,
      userId,
      userName: req.user.name || req.user.email || "User",
      createdAt: new Date(),
    };

    // Conditional atomic write rather than `doc.save()`: save() revalidates
    // *every* path, so a product carrying fields that predate a schema
    // constraint (e.g. seeded rows with a null supplier) could not be rated
    // at all — the failure this replaced. Repeating the duplicate check and
    // the visibility rule inside the query also closes the race where two
    // concurrent submissions both pass the pre-read, and the aggregation
    // pipeline recomputes the denormalised summary from the array itself.
    const condition = { _id: req.params.id, "ratings.userId": { $ne: userId } };
    if (!isAdmin(req.user)) {
      condition.$or = [{ isActive: true }, { supplier: req.user.id }];
    }

    const result = await Product.updateOne(condition, [
      // Stage 1 appends via $concatArrays (a pipeline stage — $push is an
      // update *operator* and is not allowed here). $ifNull keeps legacy
      // documents that predate the ratings path readable.
      {
        $set: {
          ratings: {
            $concatArrays: [{ $ifNull: ["$ratings", []] }, [entry]],
          },
        },
      },
      // Stage 2 recomputes the summary from the just-appended array; it must
      // be a separate stage because expressions inside one stage all read the
      // pre-stage document.
      {
        $set: {
          totalRatings: { $size: "$ratings" },
          averageRating: { $round: [{ $avg: "$ratings.rating" }, 1] },
        },
      },
    ]);

    if (result.matchedCount === 0) {
      // Re-read to report precisely: a lost race (already rated), the product
      // was delisted, or it changed hands between the pre-check and the write.
      const again = await Product.findById(req.params.id)
        .select("name isActive supplier ratings")
        .lean();
      if (!again) throw httpError("Product not found", 404);
      const stillVisible =
        isAdmin(req.user) ||
        !!again.isActive ||
        supplierIdOf(again) === userId;
      if (!stillVisible) throw httpError("Product not found", 404);
      if ((again.ratings || []).some((r) => String(r.userId) === userId)) {
        throw httpError("You have already rated this product", 400);
      }
      throw httpError("Product not found", 404);
    }

    const fresh = await Product.findById(req.params.id)
      .select("name averageRating totalRatings")
      .lean();
    const averageRating = Number(fresh && fresh.averageRating) || 0;
    const totalRatings = Number(fresh && fresh.totalRatings) || 0;

    await logAudit({
      req,
      action: "RATE",
      entity: "Product",
      entityId: String(req.params.id),
      details: `Rated product ${fresh ? fresh.name : ""} (${averageRating}★ avg, ${totalRatings} rating(s))`,
    });

    res.json({ success: true, averageRating, totalRatings });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
