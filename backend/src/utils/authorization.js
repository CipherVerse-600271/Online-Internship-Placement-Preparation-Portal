// Dependency-free role authorization middleware.
// Kept separate so role decisions can be unit-tested without a database or JWT.
function authorize(...allowedRoles) {
  return function authorizationMiddleware(req, res, next) {
    if (!req.user) {
      return res.status(401).json({ message: "Authentication required." });
    }
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ message: "You are not authorized to access this resource." });
    }
    return next();
  };
}
module.exports = { authorize };
