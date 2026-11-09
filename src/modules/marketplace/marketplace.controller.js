const { validationResult } = require("express-validator");
const service = require("./marketplace.service");
const { logAudit } = require("../../utils/audit");

/**
 * Pulls express-validator failures out of the request and turns them into a
 * `{ statusCode: 400, message }` error the global error middleware renders as
 * `{ message }` — the exact shape `lib/api.ts` reads.
 */
function throwIfInvalid(req) {
  const result = validationResult(req);
  if (result.isEmpty()) return;

  const err = new Error(
    result
      .array()
      .map((e) => e.msg)
      .join("; ")
  );
  err.statusCode = 400;
  throw err;
}

/** `handle` catches everything and defers to the global error middleware. */
const handle = (fn) => async (req, res, next) => {
  try {
    res.json(await fn(req, res));
  } catch (err) {
    next(err);
  }
};

exports.list = handle((req) => service.listListings(req.query, req.user));

exports.get = handle((req) => service.getListing(req.params.id, req.user));

exports.create = handle(async (req, res) => {
  throwIfInvalid(req);
  const doc = await service.createListing(req.user, req.body || {});
  res.status(201);
  await logAudit({
    req,
    action: "CREATE",
    entity: "MarketplaceListing",
    entityId: doc.id,
    details: `Listed produce "${doc.cropName}"`,
  });
  return doc;
});

exports.update = handle(async (req) => {
  throwIfInvalid(req);
  const doc = await service.updateListing(req.params.id, req.user, req.body || {});
  await logAudit({
    req,
    action: "UPDATE",
    entity: "MarketplaceListing",
    entityId: req.params.id,
    details: `Updated listing "${doc.cropName}"`,
  });
  return doc;
});

exports.remove = handle(async (req) => {
  const result = await service.deleteListing(req.params.id, req.user);
  await logAudit({
    req,
    action: "DELETE",
    entity: "MarketplaceListing",
    entityId: result.id,
    details: "Removed produce listing",
  });
  return result;
});

exports.stats = handle(() => service.marketplaceStats());

/**
 * Favourites — the buyer's saved shelf.
 *
 * Deliberately audit-free. `logAudit` elsewhere records business events
 * (a listing changing hands, money moving); a heart is an easily reversed
 * preference, and logging every click would bury those events under an
 * afternoon of browsing.
 */
exports.savedList = handle((req) => service.listSaved(req.user));

exports.save = handle(async (req) => {
  throwIfInvalid(req);
  return service.saveListing(req.user, req.params.id);
});

exports.unsave = handle(async (req) => {
  throwIfInvalid(req);
  return service.unsaveListing(req.user, req.params.id);
});

/**
 * Ratings — any signed-in user, one per listing.
 *
 * `rate` is audited because it changes what every future visitor sees about
 * the lot; `ratings` is not, mirroring the saved-shelf rule: reads and easily
 * reversed opinions stay out of the audit trail so business events remain
 * legible.
 */
exports.rate = handle(async (req) => {
  throwIfInvalid(req);
  const result = await service.submitListingRating(req.user, req.params.id, req.body || {});
  await logAudit({
    req,
    action: "RATE",
    entity: "MarketplaceListing",
    entityId: req.params.id,
    details: `Rated listing (${result.averageRating}★ avg, ${result.totalRatings} rating(s))`,
  });
  return result;
});

exports.ratings = handle(async (req) => {
  throwIfInvalid(req);
  return service.getListingRatings(req.params.id, req.user);
});

/**
 * Persist a produce photo and hand back the URL to store in `imageUrl`.
 *
 * Cloudinary mode (credentials configured): the multer buffer is streamed to
 * the `farmpath/listings` folder and `result.secure_url` is returned — an
 * absolute https URL, which is what the frontend needs since it serves pages
 * from a different origin than this API.
 *
 * Disk mode (no credentials): the URL is built from `PUBLIC_API_URL` or the
 * request host. Falls back to the request host, which is correct behind a
 * direct connection (the normal dev setup here), and the file is served by
 * the static `/uploads` route.
 */
exports.uploadImage = handle(async (req) => {
  if (!req.file) {
    const err = new Error(
      'No image received. Send a JPEG, PNG, GIF or WebP file under 5 MB in the "image" field.'
    );
    err.statusCode = 400;
    throw err;
  }

  // Memory storage is selected by the middleware only when Cloudinary is
  // configured; disk storage populates `path` instead of `buffer`.
  if (req.file.buffer) {
    const cloudinary = require("../../config/cloudinary");
    const result = await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        { folder: "farmpath/listings" },
        (error, uploaded) => (error ? reject(error) : resolve(uploaded))
      );
      stream.end(req.file.buffer);
    });
    return { url: result.secure_url };
  }

  const base = process.env.PUBLIC_API_URL || `${req.protocol}://${req.get("host")}`;
  return { url: `${base.replace(/\/$/, "")}/uploads/${req.file.filename}` };
});
