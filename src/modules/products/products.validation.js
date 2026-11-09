const { toDbProductCategory, PRODUCT_CATEGORY_VALUES } = require("../../utils/domainMaps");

const UNITS = ["kg", "liter", "piece", "bag", "set"];
const MAX_NAME = 120;
const MAX_DESCRIPTION = 1000;

const httpError = (message, statusCode = 400) => {
  const err = new Error(message);
  err.statusCode = statusCode;
  return err;
};

/**
 * Product validation.
 *
 * Written by hand instead of with `express-validator` chains because
 * `crudFactory` exposes no per-route validation slot: its `guards` run on
 * list/get too, while `prepareCreate`/`prepareUpdate` are synchronous hooks.
 * An `express-validator` chain `.run(req)` returns a Promise, so it cannot be
 * awaited from inside those hooks — hence plain synchronous checks that throw
 * a 400, which the factory's `try/catch` forwards to the error middleware.
 *
 * The incoming keys are the supplier portal's (`productName`,
 * `pricePerUnitBdt`, …); the returned object is the database's (`name`,
 * `price`, …). Returning a fresh object — rather than mutating the request —
 * keeps UI-only keys out of the mongoose payload entirely.
 *
 * `partial: true` restricts the check to whatever the client actually sent,
 * so a one-field stock update does not demand a product name.
 */
function validateProduct(body, { partial = false } = {}) {
  const out = {};
  const errors = [];
  const provided = (key) => !partial || Object.prototype.hasOwnProperty.call(body, key);

  if (provided("productName")) {
    const name = String(body.productName ?? "").trim();
    if (!name) errors.push("Product name is required");
    else if (name.length > MAX_NAME) {
      errors.push(`Product name must be ${MAX_NAME} characters or fewer`);
    }
    out.name = name;
  }

  if (provided("category")) {
    const category = toDbProductCategory(body.category);
    if (!category) {
      errors.push(`Category must be one of: ${PRODUCT_CATEGORY_VALUES.join(", ")}`);
    } else {
      out.category = category;
    }
  }

  if (provided("description")) {
    const description = String(body.description ?? "").trim();
    if (description.length > MAX_DESCRIPTION) {
      errors.push(`Description must be ${MAX_DESCRIPTION} characters or fewer`);
    }
    out.description = description;
  }

  if (provided("pricePerUnitBdt")) {
    const price = Number(body.pricePerUnitBdt);
    if (!Number.isFinite(price) || price < 0) errors.push("Price must be zero or greater");
    else out.price = price;
  }

  if (provided("unit")) {
    const unit = String(body.unit ?? "kg");
    if (!UNITS.includes(unit)) errors.push(`Unit must be one of: ${UNITS.join(", ")}`);
    else out.unit = unit;
  }

  if (provided("stockQuantity")) {
    const stock = Number(body.stockQuantity);
    if (!Number.isFinite(stock) || stock < 0) errors.push("Stock must be zero or greater");
    else out.stock = Math.floor(stock);
  }

  if (provided("minimumOrderQuantity")) {
    const moq = Number(body.minimumOrderQuantity);
    if (!Number.isFinite(moq) || moq < 1) {
      errors.push("Minimum order quantity must be at least 1");
    } else {
      out.minimumOrderQuantity = Math.floor(moq);
    }
  }

  if (provided("imageUrl")) out.image = String(body.imageUrl ?? "").trim();
  if (provided("isAvailable")) out.isActive = body.isAvailable !== false;

  if (errors.length) throw httpError(errors.join("; "));

  // Never let a client move a product to another supplier — `crudFactory`
  // assigns the owner on create, and updates must leave it untouched.
  delete out.supplier;
  return out;
}

/**
 * Rating submission — whole numbers 1–5 (no half stars) plus a comment.
 *
 * Same hand-written style as `validateProduct` for the same reason: the
 * rating routes are plain handlers with no `crudFactory` slot to hang an
 * `express-validator` chain off. Returns a fresh object so extra body keys
 * never reach the mongoose payload.
 */
function validateRating(body) {
  const errors = [];
  const out = {};

  const rating = Number(body?.rating);
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    errors.push("Rating must be an integer between 1 and 5");
  } else {
    out.rating = rating;
  }

  const comment = String(body?.comment ?? "").trim();
  if (comment.length < 10) {
    errors.push("Comment must be at least 10 characters");
  } else if (comment.length > 2000) {
    errors.push("Comment must be 2000 characters or fewer");
  } else {
    out.comment = comment;
  }

  if (errors.length) throw httpError(errors.join("; "));
  return out;
}

module.exports = { validateProduct, validateRating, UNITS };
