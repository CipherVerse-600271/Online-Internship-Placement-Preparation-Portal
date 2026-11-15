const mongoose = require("mongoose");

const auditLogSchema = new mongoose.Schema({
  event: { type: String, required: true, maxlength: 80, index: true },
  actor: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null, index: true },
  subject: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
  outcome: { type: String, enum: ["success", "failure"], required: true },
  occurredAt: { type: Date, default: Date.now, expires: 31536000, index: true }
}, { versionKey: false });

module.exports = mongoose.model("AuditLog", auditLogSchema);
