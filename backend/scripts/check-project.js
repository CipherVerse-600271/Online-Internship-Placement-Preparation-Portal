const fs = require("node:fs");
const path = require("node:path");
const root = path.resolve(__dirname, "..");
// Paths below are checked against the supplied Team 12 project snapshot.
const requiredFiles = [
  "src/server.js", "src/config/db.js", "src/middleware/authMiddleware.js",
  "src/utils/authorization.js", "src/models/User.js", "src/routes/authRoutes.js",
  "src/routes/adminRoutes.js", "src/routes/dashboardRoutes.js", "src/routes/healthRoutes.js",
  "routes/internshipRoutes.js", "routes/applicationRoutes.js", "routes/notificationRoutes.js",
  "routes/aptitudeRoutes.js", "models/Internship.js", "models/Application.js",
  "models/AptitudeSession.js", "models/Notification.js"
];
const missing = requiredFiles.filter((file) => !fs.existsSync(path.join(root, file)));
if (missing.length) {
  console.error("Project structure check failed. Missing files:");
  missing.forEach((file) => console.error(` - ${file}`));
  process.exit(1);
}
const pkg = JSON.parse(fs.readFileSync(path.join(root, "package.json"), "utf8"));
for (const script of ["start", "dev", "test", "check"]) {
  if (!pkg.scripts?.[script]) {
    console.error(`Missing required npm script: ${script}`);
    process.exit(1);
  }
}
console.log(`Project structure check passed (${requiredFiles.length} required files).`);
