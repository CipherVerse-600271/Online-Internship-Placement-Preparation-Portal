const express = require("express");
const mongoose = require("mongoose");
const User = require("../src/models/User");
const { protect, authorize } = require("../src/middleware/authMiddleware");
const crypto = require("crypto");
const { isIP } = require("net");
const { getCapturedEmails } = require("../src/utils/emailService");

const router = express.Router();
const RECRUITER_STATUSES = ["pending", "approved", "rejected"];

router.get("/recruiters", protect, authorize("admin"), async (req, res) => {
  const status = String(req.query.status || "pending").toLowerCase();
  if (!RECRUITER_STATUSES.includes(status)) {
    return res.status(400).json({
      message: "Status must be pending, approved, or rejected."
    });
  }

  try {
    const recruiters = await User.find({ role: "recruiter", recruiterStatus: status })
      .select("fullName email recruiterStatus isEmailVerified createdAt")
      .sort({ createdAt: 1 });
    return res.status(200).json(recruiters);
  } catch (error) {
    console.error("List recruiters error:", error.message);
    return res.status(500).json({ message: "Unable to retrieve recruiters." });
  }
});

router.patch("/recruiters/:id/status", protect, authorize("admin"), async (req, res) => {
  const { status } = req.body;
  if (!["approved", "rejected"].includes(status)) {
    return res.status(400).json({
      message: "Status must be approved or rejected."
    });
  }

  if (!mongoose.isValidObjectId(req.params.id)) {
    return res.status(400).json({ message: "Invalid recruiter ID." });
  }

  try {
    const recruiter = await User.findOne({
      _id: req.params.id,
      role: "recruiter"
    });

    if (!recruiter) {
      return res.status(404).json({ message: "Recruiter not found." });
    }

    if (status === "approved" && !recruiter.isEmailVerified) {
      return res.status(409).json({ message: "Recruiter must verify their email before approval." });
    }

    if (String(recruiter._id) === String(req.user._id)) {
      return res.status(403).json({ message: "You cannot approve or reject your own account." });
    }

    recruiter.recruiterStatus = status;
    await recruiter.save();

    return res.status(200).json({
      message: `Recruiter ${status}.`,
      recruiter: {
        id: recruiter._id,
        fullName: recruiter.fullName,
        email: recruiter.email,
        recruiterStatus: recruiter.recruiterStatus,
        isEmailVerified: recruiter.isEmailVerified
      }
    });
  } catch (error) {
    console.error("Update recruiter approval error:", error.message);
    return res.status(500).json({ message: "Unable to update recruiter approval." });
  }
});

if (process.env.NODE_ENV === "development") {
  router.get("/recruiters/:id/verification-link", protect, authorize("admin"), async (req, res) => {
    const remoteAddress = req.socket?.remoteAddress || "";
    const normalizedAddress = remoteAddress.toLowerCase().startsWith("::ffff:")
      ? remoteAddress.slice(7)
      : remoteAddress;
    const isLoopbackAddress = normalizedAddress === "::1" ||
      (isIP(normalizedAddress) === 4 && Number(normalizedAddress.split(".")[0]) === 127);

    if (
      process.env.NODE_ENV !== "development" ||
      String(process.env.EMAIL_MODE || "").trim().toLowerCase() !== "mock" ||
      mongoose.connection.name !== "internship_portal_sprint2_test" ||
      !isLoopbackAddress
    ) {
      return res.status(404).json({ message: "Local verification link is unavailable." });
    }

    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: "Invalid recruiter ID." });
    }

    try {
      const recruiter = await User.findOne({
        _id: req.params.id,
        role: "recruiter",
        recruiterStatus: "pending",
        isEmailVerified: false
      }).select("email emailVerificationToken emailVerificationExpiry");

      if (!recruiter) {
        return res.status(404).json({ message: "Pending unverified recruiter not found." });
      }

      const expiresAt = new Date(recruiter.emailVerificationExpiry);
      if (!Number.isFinite(expiresAt.getTime()) || expiresAt.getTime() <= Date.now()) {
        return res.status(410).json({ message: "The current verification link has expired. Request a new verification email." });
      }

      const messages = getCapturedEmails().slice().reverse();
      for (const message of messages) {
        const recipients = Array.isArray(message.to) ? message.to : [message.to];
        const matchesRecipient = recipients.some(recipient => {
          const address = typeof recipient === "string" ? recipient : recipient?.address;
          return String(address || "").trim().toLowerCase() === recruiter.email.toLowerCase();
        });
        if (!matchesRecipient || message.subject !== "Verify Your Internship Portal Account") continue;

        const href = String(message.html || "").match(/href="([^"]+)"/i)?.[1];
        if (!href) continue;

        let verificationUrl;
        try {
          verificationUrl = new URL(href);
        } catch {
          continue;
        }

        const routePrefix = "/api/auth/verify-email/";
        const token = verificationUrl.pathname.startsWith(routePrefix)
          ? verificationUrl.pathname.slice(routePrefix.length)
          : "";
        if (
          verificationUrl.origin !== "http://localhost:5000" ||
          !/^[a-f0-9]{64}$/i.test(token)
        ) {
          continue;
        }

        const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
        if (tokenHash === recruiter.emailVerificationToken) {
          res.set("Cache-Control", "no-store, private");
          res.set("Pragma", "no-cache");
          return res.status(200).json({
            verificationLink: verificationUrl.toString(),
            expiresAt: expiresAt.toISOString()
          });
        }
      }

      return res.status(404).json({ message: "No current mock verification link is available. Resend the verification email and try again." });
    } catch {
      return res.status(500).json({ message: "Unable to retrieve the local verification link." });
    }
  });
}
module.exports = router;
