const AuditLog = require("../models/AuditLog");

const recordAudit = async (event, { actor = null, subject = null, outcome } = {}) => {
  try { await AuditLog.create({ event, actor, subject, outcome }); }
  catch (error) { console.error("Audit log write failed:", error.message); }
};

module.exports = recordAudit;
