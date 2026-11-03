const express = require("express");
const mongoose = require("mongoose");
const { body, validationResult } = require("express-validator");
const recordAudit = require("../utils/auditLog");
const User = require("../models/User");
const { protect, authorize } = require("../middleware/authMiddleware");

const router = express.Router();

// All admin routes require authentication and the admin role
router.use(protect, authorize("admin"));

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
