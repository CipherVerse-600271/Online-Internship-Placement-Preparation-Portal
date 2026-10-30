/**
 * Authorization contract:
 * Member 1's JWT authentication middleware must run before /api/admin and set
 * req.user = { id, role }. This middleware never trusts a role from request body.
 */
module.exports = function requireAdmin(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ message: "Authentication required" });
  }
  if (String(req.user.role || "").toLowerCase() !== "admin") {
    return res.status(403).json({ message: "Administrator access required" });
  }
  return next();
};
