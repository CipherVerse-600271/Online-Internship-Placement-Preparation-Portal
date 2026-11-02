const express = require("express");
const mongoose = require("mongoose");
const Application = require("../models/Application");
const Internship = require("../models/Internship");
const Notification = require("../models/Notification");
const { protect, authorize } = require("../src/middleware/authMiddleware");

const router = express.Router();
const STATUSES = ["Pending", "Shortlisted", "Rejected", "Accepted"];

// Student: submit an application.
router.post("/", protect, authorize("student"), async (req, res) => {
  try {
    const { internshipId, resumeUrl, resumeName, coverLetter = "" } = req.body;
    if (!mongoose.isValidObjectId(internshipId)) return res.status(400).json({ message: "A valid internshipId is required." });
    if (!resumeUrl || !resumeName) return res.status(400).json({ message: "Resume URL and file name are required." });\n    let parsedResumeUrl;\n    try { parsedResumeUrl = new URL(resumeUrl); } catch { return res.status(400).json({ message: "Resume URL must be a valid HTTP or HTTPS link." }); }\n    if (!["http:", "https:"].includes(parsedResumeUrl.protocol)) return res.status(400).json({ message: "Resume URL must use HTTP or HTTPS." });
    const internship = await Internship.findById(internshipId);
    if (!internship) return res.status(404).json({ message: "Internship not found." });
    if (internship.deadline && internship.deadline < new Date()) return res.status(400).json({ message: "The application deadline has passed." });

    const application = await Application.create({
      student: req.user._id, internship: internship._id,
      resumeUrl, resumeName, coverLetter
    });
    const populated = await Application.findById(application._id).populate("internship", "title company");
    res.status(201).json({ message: "Application submitted successfully.", application: populated });
  } catch (error) {
    if (error.code === 11000) return res.status(409).json({ message: "You have already applied for this internship." });
    res.status(400).json({ message: "Unable to submit application.", error: error.message });
  }
});

// Student: only their own applications are returned.
router.get("/mine", protect, authorize("student"), async (req, res) => {
  try {
    const applications = await Application.find({ student: req.user._id })
      .populate("internship", "title company location")
      .sort({ createdAt: -1 });
    res.json(applications);
  } catch (error) {
    res.status(500).json({ message: "Unable to retrieve your applications." });
  }
});

// Recruiter: applications only for internships they own.
router.get("/recruiter", protect, authorize("recruiter", "admin"), async (req, res) => {
  try {
    const filter = req.user.role === "admin" ? {} : { recruiter: req.user._id };
    const internships = await Internship.find(filter).select("_id");
    const applications = await Application.find({ internship: { $in: internships.map(item => item._id) } })
      .populate("student", "fullName email srn")
      .populate("internship", "title company recruiter")
      .sort({ createdAt: -1 });
    res.json(applications);
  } catch (error) {
    res.status(500).json({ message: "Unable to retrieve applications." });
  }
});

// Recruiter: update status only for applications attached to their internships.
router.patch("/:id/status", protect, authorize("recruiter", "admin"), async (req, res) => {
  try {
    const { status } = req.body;
    if (!STATUSES.includes(status)) return res.status(400).json({ message: "Status must be Pending, Shortlisted, Rejected, or Accepted." });
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ message: "Invalid application ID." });
    const application = await Application.findById(req.params.id).populate("internship", "title company recruiter");
    if (!application) return res.status(404).json({ message: "Application not found." });
    if (req.user.role !== "admin" && String(application.internship.recruiter) !== String(req.user._id)) {
      return res.status(403).json({ message: "You can only manage applications for your own internships." });
    }
    if (application.status !== status) {
      application.status = status;
      await application.save();
      await Notification.create({
        student: application.student, application: application._id, status,
        message: `Your application for "${application.internship.title}" has been ${status.toLowerCase()}.`
      });
    }
    const updated = await Application.findById(application._id)
      .populate("student", "fullName email srn")
      .populate("internship", "title company");
    res.json({ message: "Application status updated.", application: updated });
  } catch (error) {
    res.status(500).json({ message: "Unable to update application status." });
  }
});

module.exports = router;
