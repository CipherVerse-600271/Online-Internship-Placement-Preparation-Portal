const express = require("express");
const mongoose = require("mongoose");
const Internship = require("../models/Internship");
const requireAdmin = require("../middleware/requireAdmin");

const router = express.Router();
router.use(requireAdmin);

const asyncHandler = (handler) => (req, res, next) =>
  Promise.resolve(handler(req, res, next)).catch(next);

const User = () => mongoose.models.User;
const Application = () => mongoose.models.Application;

function unavailableModel(res, modelName) {
  return res.status(503).json({
    message: `${modelName} model is not registered yet. Integrate the agreed team schema before using this endpoint.`,
  });
}

function validObjectId(id) {
  return mongoose.isValidObjectId(id);
}

function cleanInternshipPayload(body) {
  const allowed = [
    "title", "company", "location", "stipend", "duration",
    "description", "skills", "applyLink", "deadline",
  ];
  return Object.fromEntries(
    allowed.filter((key) => body[key] !== undefined).map((key) => [key, body[key]])
  );
}

// IPP-F-018: overview metrics. Application model contract is documented in docs.
router.get("/analytics", asyncHandler(async (_req, res) => {
  const ApplicationModel = Application();
  const UserModel = User();

  const [internshipCount, activeInternshipCount, applicationCount, offerCount, topCompanies, pendingRecruiters] =
    await Promise.all([
      Internship.countDocuments(),
      Internship.countDocuments({ isActive: { $ne: false } }),
      ApplicationModel ? ApplicationModel.countDocuments() : Promise.resolve(null),
      ApplicationModel
        ? ApplicationModel.countDocuments({ status: { $in: ["Selected", "Offered", "Offer Accepted"] } })
        : Promise.resolve(null),
      ApplicationModel
        ? ApplicationModel.aggregate([
            { $group: { _id: "$internshipId", applicationCount: { $sum: 1 } } },
            { $lookup: { from: "internships", localField: "_id", foreignField: "_id", as: "internship" } },
            { $unwind: { path: "$internship", preserveNullAndEmptyArrays: false } },
            { $group: { _id: "$internship.company", applicationCount: { $sum: "$applicationCount" } } },
            { $sort: { applicationCount: -1 } },
            { $limit: 5 },
            { $project: { _id: 0, company: "$_id", applicationCount: 1 } },
          ])
        : Promise.resolve([]),
      UserModel
        ? UserModel.countDocuments({ role: "recruiter", recruiterStatus: "pending" })
        : Promise.resolve(null),
    ]);

  res.json({
    internships: { total: internshipCount, active: activeInternshipCount },
    applications: applicationCount,
    offers: offerCount,
    topHiringCompanies: topCompanies,
    pendingRecruiters,
    integrationStatus: {
      applications: Boolean(ApplicationModel),
      users: Boolean(UserModel),
    },
  });
}));

// IPP-F-021: admin listing management.
router.get("/internships", asyncHandler(async (_req, res) => {
  const items = await Internship.find().sort({ createdAt: -1 });
  res.json(items);
}));

router.post("/internships", asyncHandler(async (req, res) => {
  const payload = cleanInternshipPayload(req.body);
  const internship = await Internship.create(payload);
  res.status(201).json({ message: "Internship created", internship });
}));

router.put("/internships/:id", asyncHandler(async (req, res) => {
  if (!validObjectId(req.params.id)) {
    return res.status(400).json({ message: "Invalid internship ID" });
  }
  const internship = await Internship.findByIdAndUpdate(
    req.params.id,
    { $set: cleanInternshipPayload(req.body) },
    { new: true, runValidators: true }
  );
  if (!internship) return res.status(404).json({ message: "Internship not found" });
  res.json({ message: "Internship updated", internship });
}));

router.patch("/internships/:id/active", asyncHandler(async (req, res) => {
  if (!validObjectId(req.params.id)) {
    return res.status(400).json({ message: "Invalid internship ID" });
  }
  if (typeof req.body.isActive !== "boolean") {
    return res.status(400).json({ message: "isActive must be a boolean" });
  }
  const internship = await Internship.findByIdAndUpdate(
    req.params.id,
    { $set: { isActive: req.body.isActive } },
    { new: true, runValidators: true }
  );
  if (!internship) return res.status(404).json({ message: "Internship not found" });
  res.json({ message: `Internship ${req.body.isActive ? "activated" : "deactivated"}`, internship });
}));

// IPP-F-020: requires the shared User schema contract in docs/INTEGRATION_CHECKLIST.md.
router.get("/recruiters/pending", asyncHandler(async (_req, res) => {
  const UserModel = User();
  if (!UserModel) return unavailableModel(res, "User");
  const recruiters = await UserModel.find({
    role: "recruiter",
    recruiterStatus: "pending",
  }).select("-password -passwordHash -resetOtp");
  res.json(recruiters);
}));

router.patch("/recruiters/:id/decision", asyncHandler(async (req, res) => {
  const UserModel = User();
  if (!UserModel) return unavailableModel(res, "User");
  if (!validObjectId(req.params.id)) return res.status(400).json({ message: "Invalid recruiter ID" });
  const { decision } = req.body;
  if (!["approved", "rejected"].includes(decision)) {
    return res.status(400).json({ message: "decision must be approved or rejected" });
  }
  const recruiter = await UserModel.findOneAndUpdate(
    { _id: req.params.id, role: "recruiter", recruiterStatus: "pending" },
    { $set: { recruiterStatus: decision, isActive: decision === "approved" } },
    { new: true, runValidators: true }
  ).select("-password -passwordHash -resetOtp");
  if (!recruiter) return res.status(404).json({ message: "Pending recruiter not found" });
  res.json({ message: `Recruiter ${decision}`, recruiter });
}));

// IPP-F-021: user activation/deactivation. Do not expose password fields.
router.get("/users", asyncHandler(async (req, res) => {
  const UserModel = User();
  if (!UserModel) return unavailableModel(res, "User");
  const users = await UserModel.find()
    .select("-password -passwordHash -resetOtp")
    .sort({ createdAt: -1 })
    .limit(Math.min(Number(req.query.limit) || 100, 500));
  res.json(users);
}));

router.patch("/users/:id/active", asyncHandler(async (req, res) => {
  const UserModel = User();
  if (!UserModel) return unavailableModel(res, "User");
  if (!validObjectId(req.params.id)) return res.status(400).json({ message: "Invalid user ID" });
  if (typeof req.body.isActive !== "boolean") {
    return res.status(400).json({ message: "isActive must be a boolean" });
  }
  const user = await UserModel.findByIdAndUpdate(
    req.params.id,
    { $set: { isActive: req.body.isActive } },
    { new: true, runValidators: true }
  ).select("-password -passwordHash -resetOtp");
  if (!user) return res.status(404).json({ message: "User not found" });
  res.json({ message: `User ${req.body.isActive ? "activated" : "deactivated"}`, user });
}));

router.use((error, _req, res, _next) => {
  console.error("Admin API error:", error);
  res.status(500).json({ message: "Admin operation failed" });
});

module.exports = router;
