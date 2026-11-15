module.exports = function httpsOnly(req, res, next) {
  if (process.env.NODE_ENV !== "production" || req.secure) return next();
  if (["GET", "HEAD"].includes(req.method)) {
    const host = req.get("host");
    if (host) return res.redirect(308, `https://${host}${req.originalUrl}`);
  }
  return res.status(426).json({ message: "HTTPS is required for this API." });
};
