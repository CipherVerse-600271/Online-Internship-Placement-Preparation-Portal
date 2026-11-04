const express = require("express");
const mongoose = require("mongoose");
const { body, validationResult } = require("express-validator");
const recordAudit = require("../utils/auditLog");
const User = require("../models/User");
const Internship = require("../../models/Internship");
const Application = require("../../models/Application");
const AuditLog = require("../models/AuditLog");
const { protect, authorize } = require("../middleware/authMiddleware");

const router = express.Router();

// All admin routes require authentication and the admin role
router.use(protect, authorize("admin"));

router.get("/overview", async (_req, res) => {
  try {
    const [students, recruiters, pendingRecruiters, internships, activeInternships, applications] = await Promise.all([
      User.countDocuments({ role: "student" }), User.countDocuments({ role: "recruiter" }),
      User.countDocuments({ role: "recruiter", recruiterStatus: "pending" }),
      Internship.countDocuments(), Internship.countDocuments({ isActive: true }), Application.countDocuments()
    ]);
    const hiringCompanies = await Application.aggregate([
      { $match: { status: "Accepted" } },
      { $lookup: { from: "internships", localField: "internship", foreignField: "_id", as: "job" } },
      { $unwind: "$job" }, { $group: { _id: "$job.company", placements: { $sum: 1 } } },
      { $sort: { placements: -1, _id: 1 } }, { $limit: 10 }
    ]);
    res.json({ students, recruiters, pendingRecruiters, internships, activeInternships, applications, placements: hiringCompanies });
  } catch (error) {
    console.error("Admin overview error:", error);
    res.status(500).json({ message: "Unable to retrieve admin overview." });
  }
});

router.get("/users", async (req, res) => {
  try {
    const role = ["student", "recruiter", "admin"].includes(req.query.role) ? req.query.role : undefined;
    const filter = role ? { role } : {};
    const users = await User.find(filter).select("fullName email role srn companyName recruiterStatus isActive createdAt")
      .sort({ createdAt: -1 }).limit(200).lean();
    res.json({ users, limit: 200 });
  } catch (error) {
    console.error("Admin users error:", error);
    res.status(500).json({ message: "Unable to retrieve users." });
  }
});

router.get("/audit-logs", async (req, res) => {
  try {
    const requested = Number.parseInt(req.query.limit, 10);
    const limit = Number.isInteger(requested) ? Math.min(Math.max(requested, 1), 100) : 50;
    const logs = await AuditLog.find().populate("actor", "fullName email role").populate("subject", "fullName email role")
      .sort({ occurredAt: -1 }).limit(limit).lean();
    res.json({ logs, limit });
  } catch (error) {
    console.error("Admin audit logs error:", error);
    res.status(500).json({ message: "Unable to retrieve audit logs." });
  }
});

router.patch("/users/:id/active", async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ message: "Invalid user ID." });
    if (typeof req.body.isActive !== "boolean") return res.status(400).json({ message: "isActive must be a boolean." });
    if (String(req.user._id) === req.params.id && !req.body.isActive) return res.status(400).json({ message: "You cannot disable your own admin account." });
    const user = await User.findByIdAndUpdate(req.params.id, { isActive: req.body.isActive }, { new: true })
      .select("fullName email role isActive");
    if (!user) return res.status(404).json({ message: "User not found." });
    await recordAudit(req.body.isActive ? "admin.user_enabled" : "admin.user_disabled", { actor: req.user._id, subject: user._id, outcome: "success" });
    res.json({ user });
  } catch (error) {
    console.error("Admin user update error:", error);
    res.status(500).json({ message: "Unable to update user." });
  }
});

router.get("/internships", async (_req, res) => {
  try {
    const internships = await Internship.find().populate("recruiter", "fullName email").sort({ createdAt: -1 }).limit(200).lean();
    res.json({ internships, limit: 200 });
  } catch (error) {
    console.error("Admin internships error:", error);
    res.status(500).json({ message: "Unable to retrieve internships." });
  }
});

router.post("/internships", async (req, res) => {
  try {
    const { recruiter: recruiterId, title, company, location, stipend, duration, description, eligibility, skills, deadline } = req.body;
    if (!mongoose.isValidObjectId(recruiterId)) return res.status(400).json({ message: "A valid recruiter ID is required." });
    const recruiter = await User.findOne({ _id: recruiterId, role: "recruiter", recruiterStatus: "approved", isEmailVerified: true });
    if (!recruiter) return res.status(400).json({ message: "Choose an email-verified, approved recruiter." });
    if ([title, company, location, duration, description, eligibility, deadline].some(value => typeof value !== "string" || !value.trim())) {
      return res.status(400).json({ message: "Complete all required internship fields." });
    }
    const stipendValue = Number(stipend);
    const due = new Date(deadline);
    if (!Number.isFinite(stipendValue) || stipendValue < 0 || Number.isNaN(due.getTime()) || due <= new Date()) {
      return res.status(400).json({ message: "Provide a non-negative stipend and a future deadline." });
    }
    const internship = await Internship.create({ recruiter: recruiter._id, title: title.trim(), company: company.trim(), location: location.trim(),
      stipend: stipendValue, duration: duration.trim(), description: description.trim(), eligibility: eligibility.trim(),
      skills: Array.isArray(skills) ? skills.map(item => String(item).trim()).filter(Boolean).slice(0, 30) : [], deadline: due });
    await recordAudit("admin.internship_created", { actor: req.user._id, subject: internship._id, outcome: "success" });
    res.status(201).json({ internship });
  } catch (error) {
    console.error("Admin internship create error:", error);
    res.status(500).json({ message: "Unable to create internship." });
  }
});

router.patch("/internships/:id", async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ message: "Invalid internship ID." });
    const allowed = ["title", "company", "location", "stipend", "duration", "description", "eligibility", "skills", "deadline"];
    const update = Object.fromEntries(Object.entries(req.body).filter(([key]) => allowed.includes(key)));
    if (!Object.keys(update).length) return res.status(400).json({ message: "Provide at least one editable internship field." });
    if (update.stipend !== undefined && (!Number.isFinite(Number(update.stipend)) || Number(update.stipend) < 0)) return res.status(400).json({ message: "Stipend must be non-negative." });
    if (update.deadline !== undefined && (Number.isNaN(new Date(update.deadline).getTime()) || new Date(update.deadline) <= new Date())) return res.status(400).json({ message: "Deadline must be a future date." });
    if (update.skills !== undefined && !Array.isArray(update.skills)) return res.status(400).json({ message: "Skills must be an array." });
    const internship = await Internship.findByIdAndUpdate(req.params.id, update, { new: true, runValidators: true });
    if (!internship) return res.status(404).json({ message: "Internship not found." });
    await recordAudit("admin.internship_updated", { actor: req.user._id, subject: internship._id, outcome: "success" });
    res.json({ internship });
  } catch (error) {
    console.error("Admin internship edit error:", error);
    res.status(400).json({ message: "Unable to update internship." });
  }
});

router.patch("/internships/:id/active", async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ message: "Invalid internship ID." });
    if (typeof req.body.isActive !== "boolean") return res.status(400).json({ message: "isActive must be a boolean." });
    const internship = await Internship.findByIdAndUpdate(req.params.id, { isActive: req.body.isActive }, { new: true });
    if (!internship) return res.status(404).json({ message: "Internship not found." });
    await recordAudit(req.body.isActive ? "admin.internship_enabled" : "admin.internship_disabled", { actor: req.user._id, subject: internship._id, outcome: "success" });
    res.json({ internship });
  } catch (error) {
    console.error("Admin internship update error:", error);
    res.status(500).json({ message: "Unable to update internship." });
  }
});

// Get all recruiters awaiting admin verification
router.get("/recruiters/pending", async (req, res) => {
  try {
    const recruiters = await User.find({
      role: "recruiter",
      recruiterStatus: "pending"
    }).select("-password -resetOTP -resetOTPAttempts -emailVerificationToken -emailVerificationExpiry -failedLoginAttempts -lockUntil");

    return res.status(200).json({
      message: "Pending recruiters retrieved successfully.",
      count: recruiters.length,
      recruiters
    });
  } catch (error) {
    console.error("Fetch pending recruiters error:", error);
    return res.status(500).json({
      message: "Unable to retrieve pending recruiters."
    });
  }
});

// Approve a recruiter
router.patch("/recruiters/:id/approve", [body("reason").optional().trim().isLength({ max: 500 })], async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ message: "Invalid recruiter ID." });
    if (!validationResult(req).isEmpty()) return res.status(400).json({ errors: validationResult(req).array() });
    const recruiter = await User.findOne({
      _id: req.params.id,
      role: "recruiter"
    });

    if (!recruiter) {
      return res.status(404).json({
        message: "Recruiter not found."
      });
    }

    if (recruiter.recruiterStatus !== "pending") {
      return res.status(400).json({
        message: "Only pending recruiters can be approved."
      });
    }

    recruiter.recruiterStatus = "approved";
    recruiter.recruiterDecisionReason = req.body?.reason || null;
    recruiter.recruiterReviewedBy = req.user._id;
    recruiter.recruiterReviewedAt = new Date();
    await recruiter.save();
    await recordAudit("admin.recruiter_approved", { actor: req.user._id, subject: recruiter._id, outcome: "success" });

    return res.status(200).json({
      message: "Recruiter approved successfully.",
      recruiter: {
        id: recruiter._id,
        fullName: recruiter.fullName,
        email: recruiter.email,
        recruiterStatus: recruiter.recruiterStatus
      }
    });
  } catch (error) {
    console.error("Approve recruiter error:", error);
    return res.status(500).json({
      message: "Unable to approve recruiter."
    });
  }
});

// Reject a recruiter
router.patch("/recruiters/:id/reject", [body("reason").optional().trim().isLength({ max: 500 })], async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ message: "Invalid recruiter ID." });
    if (!validationResult(req).isEmpty()) return res.status(400).json({ errors: validationResult(req).array() });
    const recruiter = await User.findOne({
      _id: req.params.id,
      role: "recruiter"
    });

    if (!recruiter) {
      return res.status(404).json({
        message: "Recruiter not found."
      });
    }

    if (recruiter.recruiterStatus !== "pending") {
      return res.status(400).json({
        message: "Only pending recruiters can be rejected."
      });
    }

    recruiter.recruiterStatus = "rejected";
    recruiter.recruiterDecisionReason = req.body?.reason || null;
    recruiter.recruiterReviewedBy = req.user._id;
    recruiter.recruiterReviewedAt = new Date();
    await recruiter.save();
    await recordAudit("admin.recruiter_rejected", { actor: req.user._id, subject: recruiter._id, outcome: "success" });

    return res.status(200).json({
      message: "Recruiter rejected successfully.",
      recruiter: {
        id: recruiter._id,
        fullName: recruiter.fullName,
        email: recruiter.email,
        recruiterStatus: recruiter.recruiterStatus
      }
    });
  } catch (error) {
    console.error("Reject recruiter error:", error);
    return res.status(500).json({
      message: "Unable to reject recruiter."
    });
  }
});

module.exports = router;
