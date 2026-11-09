const role = (roles) => (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const granted = Array.isArray(req.user.roles) && req.user.roles.length > 0
    ? req.user.roles
    : [req.user.role].filter(Boolean);

  const allowed = Array.isArray(roles) ? roles : [roles];
  const hasRole = allowed.some((r) => granted.includes(r));

  if (!hasRole) {
    return res.status(403).json({ message: "Access denied" });
  }

  next();
};

module.exports = role;
