const AuditLog = require("../database/models/AuditLog");
const { nowStamp } = require("./dates");

/**
 * Records an immutable system audit entry. Never throws: auditing must not
 * break the request that triggered it.
 */
async function logAudit({ req, action, entity, entityId = "", details = "", status = "success" }) {
  try {
    await AuditLog.create({
      timestamp: nowStamp(),
      actorName: (req && req.user && req.user.name) || "System",
      actorRole: (req && req.user && req.user.role) || "system",
      actionType: action,
      targetEntity: entity,
      entityId: String(entityId),
      ipAddress: ((req && req.ip) || "").replace("::ffff:", ""),
      status,
      details,
    });
  } catch (error) {
    console.error(`Audit log failed: ${error.message}`);
  }
}

module.exports = { logAudit };
