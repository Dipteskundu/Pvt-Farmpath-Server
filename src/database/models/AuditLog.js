const mongoose = require("mongoose");

const auditLogSchema = new mongoose.Schema(
  {
    timestamp: { type: String, default: "" },
    actorName: { type: String, default: "System" },
    actorRole: { type: String, default: "system" },
    actionType: { type: String, default: "SYSTEM_EVENT" },
    targetEntity: { type: String, default: "" },
    entityId: { type: String, default: "" },
    ipAddress: { type: String, default: "" },
    status: { type: String, default: "success" },
    details: { type: String, default: "" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("AuditLog", auditLogSchema);
