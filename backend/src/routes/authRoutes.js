
const express = require("express");
const { body, validationResult } = require("express-validator");
const User = require("../models/User");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const { sendVerificationEmail } = require("../utils/emailService");
const { protect, authorize } = require("../middleware/authMiddleware");
const rateLimit = require("express-rate-limit");
const recordAudit = require("../utils/auditLog");

const router = express.Router();
const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 20, standardHeaders: true, legacyHeaders: false });
const passwordRules = (field = "password") => body(field).isString().isLength({ min: 8 }).isByteLength({ min: 8, max: 72 }).matches(/[a-z]/).matches(/[A-Z]/).matches(/[0-9]/).withMessage("Password must be 8-72 UTF-8 bytes and include upper, lower, and numeric characters");
const errorsFor = (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) { res.status(400).json({ errors: errors.array() }); return true; }
  return false;
};

// STUDENT REGISTRATION
router.post(
  "/register/student",
  authLimiter,
  [body("fullName").trim().isLength({ min: 2, max: 100 }), body("email").isEmail().normalizeEmail().matches(/^[a-zA-Z0-9._%+-]+@stu\.pes\.edu$/).withMessage("Please use your official PESU student email address"), body("srn").trim().isLength({ min: 4, max: 30 }), passwordRules()],
  async (req, res) => {
    try {
      if (errorsFor(req, res)) return;

      const { fullName, email, srn, password } = req.body;

      const existingUser = await User.findOne({
        $or: [
          { email: email.toLowerCase() },
          { srn: srn.toUpperCase() }
        ]
      });

      if (existingUser) {
        return res.status(409).json({
          message: "Email or SRN is already registered"
        });
      }

      const verificationToken = crypto.randomBytes(32).toString("hex");

      const user = await User.create({
        fullName,
        email,
        srn,
        password,
        role: "student",
        emailVerificationToken: crypto
          .createHash("sha256")
          .update(verificationToken)
          .digest("hex"),
        emailVerificationExpiry: new Date(Date.now() + 10 * 60 * 1000)
      });

      await sendVerificationEmail(user.email, verificationToken);

      return res.status(201).json({
        message: "Student registered successfully. Verification email sent.",
        user: {
          id: user._id,
          fullName: user.fullName,
          email: user.email,
          srn: user.srn,
          role: user.role,
          isEmailVerified: user.isEmailVerified
        }
      });
    } catch (error) {
      if (error.code === 11000) return res.status(409).json({ message: "Email or SRN is already registered" });
      console.error("Student registration failed:", error.message);
      if (error.message && /email|smtp|auth/i.test(error.message)) return res.status(503).json({ message: "Unable to send the verification email. Please try again later." });
      return res.status(500).json({ message: "Unable to register student" });
    }
  }
);

// RECRUITER REGISTRATION
router.post(
  "/register/recruiter",
  authLimiter,
  [body("fullName").trim().isLength({ min: 2, max: 100 }), body("email").isEmail().normalizeEmail(), body("companyName").trim().isLength({ min: 2, max: 160 }), body("companyWebsite").optional({ checkFalsy: true }).isURL({ protocols: ["http", "https"], require_protocol: true }), body("companyEmail").optional({ checkFalsy: true }).isEmail().normalizeEmail(), passwordRules()],
  async (req, res) => {
    try {
      if (errorsFor(req, res)) return;

      const { fullName, email, password, companyName, companyWebsite, companyEmail } = req.body;

      const existingUser = await User.findOne({ email });

      if (existingUser) {
        return res.status(409).json({
          message: "Email is already registered"
        });
      }

      const verificationToken = crypto.randomBytes(32).toString("hex");
      const user = await User.create({
        fullName,
        email,
        password,
        companyName,
        companyWebsite,
        companyEmail,
        role: "recruiter",
        recruiterStatus: "pending",
        isEmailVerified: false,
        emailVerificationToken: crypto.createHash("sha256").update(verificationToken).digest("hex"),
        emailVerificationExpiry: new Date(Date.now() + 10 * 60 * 1000)
      });

      try { await sendVerificationEmail(user.email, verificationToken); }
      catch (emailError) { console.error("Recruiter verification email failed:", emailError.message); return res.status(503).json({ message: "Recruiter registered, but verification email could not be sent. Contact support to resend it." }); }

      return res.status(201).json({
        message: "Recruiter registered. Verify your email and await admin verification.",
        user: {
          id: user._id,
          fullName: user.fullName,
          email: user.email,
          role: user.role,
          recruiterStatus: user.recruiterStatus
        }
      });
    } catch (error) {
      if (error.code === 11000) return res.status(409).json({ message: "Email is already registered" });
      console.error("Recruiter registration error:", error.message);

      return res.status(500).json({
        message: "Unable to register recruiter"
      });
    }
  }
);

// LOGIN
router.post(
  "/login",
  authLimiter,
  [body("email").isEmail().normalizeEmail(), body("password").isString().notEmpty().isLength({ max: 128 })],
  async (req, res) => {
    try {
      if (errorsFor(req, res)) return;

      if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) return res.status(500).json({ message: "Authentication is not configured" });

      const { email, password } = req.body;

      const user = await User.findOne({ email: email.toLowerCase() });

      if (!user) {
        await recordAudit("auth.login", { outcome: "failure" });
        return res.status(401).json({
          message: "Invalid email or password"
        });
      }

      if (user.lockUntil && user.lockUntil > new Date()) {
        await recordAudit("auth.login_locked", { subject: user._id, outcome: "failure" });
        return res.status(423).json({
          message: "Account is temporarily locked. Try again later."
        });
      }

      if (user.lockUntil && user.lockUntil <= new Date()) {
        user.failedLoginAttempts = 0;
        user.lockUntil = null;
        await user.save();
      }

      const isPasswordValid = await user.comparePassword(password);

      if (!isPasswordValid) {
        user.failedLoginAttempts += 1;

        if (user.failedLoginAttempts >= 5) {
          user.failedLoginAttempts = 5;
          user.lockUntil = new Date(Date.now() + 15 * 60 * 1000);
        }

        await user.save();
        await recordAudit("auth.login", { subject: user._id, outcome: "failure" });

        return res.status(401).json({
          message: "Invalid email or password",
          remainingAttempts: Math.max(0, 5 - user.failedLoginAttempts)
        });
      }

      if (!user.isEmailVerified) {
        await recordAudit("auth.login_unverified", { subject: user._id, outcome: "failure" });
        return res.status(403).json({
          message: "Please verify your email before logging in"
        });
      }

      if (user.role === "recruiter" && user.recruiterStatus === "rejected") {
        await recordAudit("auth.login_recruiter_rejected", { subject: user._id, outcome: "failure" });
        return res.status(403).json({ message: "Recruiter application was rejected. Contact an administrator for details.", reason: user.recruiterDecisionReason || undefined });
      }

      if (user.role === "recruiter" && user.recruiterStatus !== "approved") {
        await recordAudit("auth.login_recruiter_pending", { subject: user._id, outcome: "failure" });
        return res.status(403).json({
          message: "Recruiter account is awaiting admin approval"
        });
      }

      user.failedLoginAttempts = 0;
      user.lockUntil = null;
      await user.save();
      await recordAudit("auth.login", { subject: user._id, outcome: "success" });

      const token = jwt.sign(
        { id: user._id, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || "1h" }
      );

      return res.status(200).json({
        message: "Login successful",
        token,
        user: {
          id: user._id,
          fullName: user.fullName,
          email: user.email,
          role: user.role
        }
      });
    } catch (error) {
      console.error("Login error:", error);

      return res.status(500).json({
        message: "Unable to login"
      });
    }
  }
);

// EMAIL VERIFICATION
router.get("/verify-email/:token", async (req, res) => {
  try {
    const hashedToken = crypto
      .createHash("sha256")
      .update(req.params.token)
      .digest("hex");

    const user = await User.findOne({
      emailVerificationToken: hashedToken,
      emailVerificationExpiry: { $gt: new Date() }
    });

    if (!user) {
      return res.status(400).json({
        message: "Invalid or expired verification link"
      });
    }

    user.isEmailVerified = true;
    user.emailVerificationToken = null;
    user.emailVerificationExpiry = null;

    await user.save();
    await recordAudit("auth.email_verified", { subject: user._id, outcome: "success" });

    return res.status(200).json({
      message: "Email verified successfully. You can now log in."
    });
  } catch (error) {
    console.error("Email verification error:", error);

    return res.status(500).json({
      message: "Unable to verify email"
    });
  }
});

router.post("/resend-verification", authLimiter, [body("email").isEmail().normalizeEmail()], async (req, res) => {
  try {
    if (errorsFor(req, res)) return;
    const user = await User.findOne({ email: req.body.email.toLowerCase(), isEmailVerified: false });
    if (!user) return res.status(200).json({ message: "If the account needs verification, a new link has been sent." });
    const token = crypto.randomBytes(32).toString("hex");
    user.emailVerificationToken = crypto.createHash("sha256").update(token).digest("hex");
    user.emailVerificationExpiry = new Date(Date.now() + 10 * 60 * 1000);
    await user.save();
    await sendVerificationEmail(user.email, token);
    return res.status(200).json({ message: "If the account needs verification, a new link has been sent." });
  } catch (error) {
    console.error("Verification resend failed:", error.message);
    return res.status(503).json({ message: "Unable to send verification email. Try again later." });
  }
});

// Request a time-limited, single-use password reset OTP.
router.post("/forgot-password", authLimiter, [body("email").isEmail().normalizeEmail()], async (req, res) => {
  try {
    if (errorsFor(req, res)) return;
    const email = req.body.email.toLowerCase();
    const user = await User.findOne({ email });
    // Keep responses indistinguishable to avoid account enumeration.
    if (!user) return res.status(200).json({ message: "If the account exists, a reset code has been sent." });
    const otp = String(crypto.randomInt(0, 1000000)).padStart(6, "0");
    user.resetOTP = crypto.createHash("sha256").update(otp).digest("hex");
    user.resetOTPExpiry = new Date(Date.now() + 10 * 60 * 1000);
    user.resetOTPAttempts = 0;
    await user.save();
    await recordAudit("auth.password_reset_requested", { subject: user._id, outcome: "success" });
    const { sendPasswordResetEmail } = require("../utils/emailService");
    try { await sendPasswordResetEmail(email, otp); }
    catch (emailError) {
      user.resetOTP = null; user.resetOTPExpiry = null; user.resetOTPAttempts = 0; await user.save();
      console.error("Password reset email failed:", emailError.message);
      return res.status(200).json({ message: "If the account exists, a reset code has been sent." });
    }
    return res.status(200).json({ message: "If the account exists, a reset code has been sent." });
  } catch (error) { console.error("Password reset request failed:", error.message); return res.status(500).json({ message: "Unable to process password reset" }); }
});

router.post("/reset-password", authLimiter, [body("email").isEmail().normalizeEmail(), body("otp").matches(/^\d{6}$/), passwordRules("newPassword")], async (req, res) => {
  try {
    if (errorsFor(req, res)) return;
    const { email, otp, newPassword } = req.body;
    const otpHash = crypto.createHash("sha256").update(otp).digest("hex");
    const user = await User.findOne({ email: email.toLowerCase(), resetOTP: otpHash, resetOTPExpiry: { $gt: new Date() }, resetOTPAttempts: { $lt: 5 } });
    if (!user) {
      await User.updateOne({ email: email.toLowerCase(), resetOTP: { $ne: null }, resetOTPExpiry: { $gt: new Date() } }, { $inc: { resetOTPAttempts: 1 } });
      return res.status(400).json({ message: "Invalid or expired reset code" });
    }
    user.password = newPassword; user.resetOTP = null; user.resetOTPExpiry = null; user.resetOTPAttempts = 0;
    user.failedLoginAttempts = 0; user.lockUntil = null;
    await user.save();
    await recordAudit("auth.password_reset", { subject: user._id, outcome: "success" });
    return res.status(200).json({ message: "Password reset successfully" });
  } catch (error) { console.error("Password reset failed:", error.message); return res.status(500).json({ message: "Unable to reset password" }); }
});
// RBAC test route - Student only
router.get(
  "/student-dashboard",
  protect,
  authorize("student"),
  (req, res) => {
    res.status(200).json({
      message: "Welcome to the Student Dashboard!",
      user: {
        id: req.user._id,
        fullName: req.user.fullName,
        role: req.user.role
      }
    });
  }
);
// Recruiter-only protected route
router.get(
  "/recruiter-dashboard",
  protect,
  authorize("recruiter"),
  (req, res) => {
    res.status(200).json({
      message: "Welcome to the Recruiter Dashboard!",
      user: {
        id: req.user._id,
        fullName: req.user.fullName,
        role: req.user.role
      }
    });
  }
);

router.patch("/skills", protect, authorize("student"), async (req, res) => {
  try {
    if (!Array.isArray(req.body.skills) && typeof req.body.skills !== "string") return res.status(400).json({ message: "Skills must be a list or comma-separated string." });
    const values = Array.isArray(req.body.skills) ? req.body.skills : req.body.skills.split(",");
    const skills = [...new Set(values.map((skill) => String(skill).trim()).filter(Boolean))].slice(0, 50);
    if (skills.some((skill) => skill.length > 80)) return res.status(400).json({ message: "Each skill must be 80 characters or fewer." });
    const user = await User.findByIdAndUpdate(req.user._id, { skills }, { new: true }).select("fullName email skills");
    return res.status(200).json({ message: "Your skills have been saved.", user });
  } catch (error) { console.error("Update student skills failed:", error.message); return res.status(400).json({ message: "Unable to save skills." }); }
});

module.exports = router;
