const jwt = require("jsonwebtoken");
const User = require("../database/models/User");

/**
 * Attaches `req.user` when a valid token is present, but never rejects.
 *
 * Needed on shared read routes such as `GET /marketplace/listings`, which must
 * work for anonymous visitors (public catalogue, no RouteGuard) while still
 * letting a signed-in admin's browser send `?status=Flagged`. A missing or
 * malformed token simply leaves `req.user` undefined — the service then falls
 * back to the public filter instead of erroring.
 */
const optionalAuth = async (req, res, next) => {
  try {
    const token = req.header("Authorization")?.replace("Bearer ", "");
    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id).select("-password");
      if (user) req.user = user;
    }
  } catch {
    // Deliberately swallowed: this route is public.
  }
  next();
};

module.exports = optionalAuth;
