const express = require("express");
const mongoose = require("mongoose");
const { randomUUID } = require("crypto");
const { isEmail } = require("validator");
const Application = require("../models/Application");
const Internship = require("../models/Internship");
const Notification = require("../models/Notification");
const { sendApplicationStatusEmail } = require("../src/utils/emailService");
const { isDeadlineOpen } = require("../src/utils/dateUtils");
const { protect, authorize } = require("../src/middleware/authMiddleware");

const router = express.Router();
const STATUSES = ["Pending", "Shortlisted", "Rejected", "Accepted"];
const STATUS_EMAIL_RETRY_LEASE_MS = 5 * 60 * 1000;

const ensureStatusNotification = async (application, adoptLegacyNotification) => {
  const eventKey = `application-status:${application._id}:${application.statusNotificationKey}`;
  let notification = await Notification.findOne({ eventKey });
  if (notification) return notification;

  const legacyNotification = adoptLegacyNotification
    ? await Notification.findOne({
        application: application._id,
        category: "application_status",
        status: application.status,
        $or: [{ eventKey: { $exists: false } }, { eventKey: null }]
      }).sort({ createdAt: -1 })
    : null;

  if (legacyNotification) {
    try {
      notification = await Notification.findOneAndUpdate(
        { _id: legacyNotification._id, $or: [{ eventKey: { $exists: false } }, { eventKey: null }] },
        { $set: { eventKey } },
        { new: true }
      );
      if (notification) return notification;
    } catch (error) {
      if (error.code !== 11000) throw error;
    }

    notification = await Notification.findOne({ eventKey });
    if (notification) return notification;
  }

  const studentId = application.student?._id || application.student;
  try {
    return await Notification.findOneAndUpdate(
      { eventKey },
      {
        $setOnInsert: {
          eventKey,
          student: studentId,
          application: application._id,
          category: "application_status",
          status: application.status,
          message: `Your application for "${application.internship.title}" has been ${application.status.toLowerCase()}.`,
          read: false
        }
      },
      { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
    );
  } catch (error) {
    if (error.code === 11000) {
      notification = await Notification.findOne({ eventKey });
      if (notification) return notification;
    }
    throw error;
  }
};

// Student: submit an application.
router.post("/", protect, authorize("student"), async (req, res) => {
  try {
    const { internshipId, resumeUrl, resumeName, coverLetter = "" } = req.body;
    if (!req.user.fullName?.trim()) return res.status(400).json({ message: "Your account must include your name before applying." });
    if (!isEmail(req.user.email || "")) return res.status(400).json({ message: "Your account must include a valid email address before applying." });
    if (!mongoose.isValidObjectId(internshipId)) return res.status(400).json({ message: "A valid internshipId is required." });
    if (!resumeUrl || !resumeName) return res.status(400).json({ message: "Resume URL and file name are required." });
    let parsedResumeUrl;
    try { parsedResumeUrl = new URL(resumeUrl); } catch { return res.status(400).json({ message: "Resume URL must be a valid HTTP or HTTPS link." }); }
    if (!["http:", "https:"].includes(parsedResumeUrl.protocol)) return res.status(400).json({ message: "Resume URL must use HTTP or HTTPS." });
    const internship = await Internship.findById(internshipId);
    if (!internship) return res.status(404).json({ message: "Internship not found." });
    if (!internship.isActive) return res.status(404).json({ message: "Internship not found or inactive." });
    if (!isDeadlineOpen(internship.deadline)) return res.status(400).json({ message: "The application deadline has passed." });

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
    let application = await Application.findById(req.params.id)
      .populate("student", "fullName email srn")
      .populate("internship", "title company recruiter");
    if (!application) return res.status(404).json({ message: "Application not found." });
    if (req.user.role !== "admin" && String(application.internship.recruiter) !== String(req.user._id)) {
      return res.status(403).json({ message: "You can only manage applications for your own internships." });
    }
    let changed = application.status !== status;
    const adoptLegacyNotification = !changed && !application.statusNotificationKey;
    if (!changed && !application.statusNotificationPending && !application.statusNotificationKey && !application.statusEmailPending) {
      return res.json({
        message: "Application status is current.",
        notificationCreated: false,
        application
      });
    }
    if (changed) {
      const statusNotificationKey = randomUUID();
      const transitioned = await Application.findOneAndUpdate(
        { _id: application._id, status: application.status },
        { $set: { status, statusNotificationKey, statusNotificationPending: true, statusEmailPending: true, statusEmailSendingAt: null } },
        { new: true, runValidators: true }
      );

      if (transitioned) {
        application.status = status;
        application.statusNotificationKey = statusNotificationKey;
        application.statusNotificationPending = true;
        application.statusEmailPending = true;
        application.statusEmailSendingAt = null;
      } else {
        application = await Application.findById(application._id)
          .populate("student", "fullName email srn")
          .populate("internship", "title company recruiter");
        if (!application) return res.status(404).json({ message: "Application not found." });
        if (application.status !== status) {
          return res.status(409).json({ message: "Application status changed concurrently. Refresh and try again." });
        }
        changed = false;
      }
    }

    if (!application.statusNotificationKey) {
      const statusNotificationKey = randomUUID();
      const initialized = await Application.findOneAndUpdate(
        { _id: application._id, status, statusNotificationKey: null },
        { $set: { statusNotificationKey, statusNotificationPending: true } },
        { new: true }
      );

      if (initialized) {
        application.statusNotificationKey = statusNotificationKey;
        application.statusNotificationPending = true;
      } else {
        application = await Application.findById(application._id)
          .populate("student", "fullName email srn")
          .populate("internship", "title company recruiter");
        if (!application) return res.status(404).json({ message: "Application not found." });
        if (application.status !== status) {
          return res.status(409).json({ message: "Application status changed concurrently. Refresh and try again." });
        }
      }
    }

    let notificationCreated = false;
    try {
      await ensureStatusNotification(application, adoptLegacyNotification);
      notificationCreated = true;
      await Application.updateOne(
        { _id: application._id, statusNotificationKey: application.statusNotificationKey },
        { $set: { statusNotificationPending: false } }
      );
      application.statusNotificationPending = false;
    } catch (notificationError) {
      console.error("Application status notification could not be saved:", notificationError.message);
      application.statusNotificationPending = true;
      try {
        await Application.updateOne(
          { _id: application._id, statusNotificationKey: application.statusNotificationKey },
          { $set: { statusNotificationPending: true } }
        );
      } catch (pendingError) {
        console.error("Could not mark status notification for retry:", pendingError.message);
      }
    }

    if (application.statusEmailPending) {
      const emailClaim = await Application.findOneAndUpdate(
        {
          _id: application._id,
          status,
          statusNotificationKey: application.statusNotificationKey,
          statusEmailPending: true,
          $or: [
            { statusEmailSendingAt: null },
            { statusEmailSendingAt: { $exists: false } },
            { statusEmailSendingAt: { $lt: new Date(Date.now() - STATUS_EMAIL_RETRY_LEASE_MS) } }
          ]
        },
        { $set: { statusEmailSendingAt: new Date() } },
        { new: true }
      );

      if (emailClaim) {
        // A bounded lease prevents concurrent retry clicks from sending duplicates.
        try {
          await sendApplicationStatusEmail(
            application.student.email,
            application.student.fullName,
            application.internship.title,
            status
          );
          const sent = await Application.updateOne(
            { _id: application._id, status, statusNotificationKey: application.statusNotificationKey },
            { $set: { statusEmailPending: false, statusEmailSendingAt: null } }
          );
          if (sent.matchedCount) {
            application.statusEmailPending = false;
            application.statusEmailSendingAt = null;
          }
        } catch (emailError) {
          console.error("Application status email could not be sent:", emailError.message);
          application.statusEmailPending = true;
          application.statusEmailSendingAt = null;
          try {
            await Application.updateOne(
              { _id: application._id, statusNotificationKey: application.statusNotificationKey },
              { $set: { statusEmailPending: true, statusEmailSendingAt: null } }
            );
          } catch (stateError) {
            console.error("Could not record pending application status email:", stateError.message);
          }
        }
      }
    }

    res.json({
      message: notificationCreated
        ? changed
          ? application.statusEmailPending
            ? "Application status updated and in-app notification is available. Status email is pending; use Retry status email to try again."
            : "Application status updated. In-app notification and email delivery completed."
          : application.statusEmailPending
            ? "Application status is current. Status email is pending; use Retry status email to try again."
            : "Application status is current. The in-app notification is available."
        : "Application status is saved, but its in-app notification is pending. Use Retry notification to try again.",
      notificationCreated,
      application
    });
  } catch (error) {
    res.status(500).json({ message: "Unable to update application status." });
  }
});

module.exports = router;
