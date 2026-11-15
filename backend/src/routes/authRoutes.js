
const express = require("express");
const { rateLimit } = require("express-rate-limit");
const { body, validationResult } = require("express-validator");
const User = require("../models/User");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const { sendVerificationEmail } = require("../utils/emailService");
const { protect, authorize } = require("../middleware/authMiddleware");

const router = express.Router();
const resendVerificationLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    message: "Too many verification requests. Please try again later."
  }
});
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  skipSuccessfulRequests: true,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    message: "Too many login attempts. Please try again later."
  }
});

// STUDENT REGISTRATION
router.post(
  "/register/student",
  [
    body("fullName").trim().notEmpty(),
    body("email")
      .isEmail()
      .withMessage("Please use any valid email address")
      .normalizeEmail(),
    body("srn").trim().notEmpty(),
    body("password").isLength({ min: 8 })
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);

      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

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

      const user = await User.create({
        fullName,
        email,
        srn,
        password,
        role: "student",
        isEmailVerified: true,
      });

      return res.status(201).json({
        message: "Student registered successfully. You can now log in.",
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
      console.error("Student registration error:", error);

      return res.status(500).json({
        message: "Unable to complete student registration"
      });
    }
  }
);

// RECRUITER REGISTRATION
router.post(
  "/register/recruiter",
  [
    body("fullName").trim().notEmpty(),
    body("email").isEmail().normalizeEmail(),
    body("password").isLength({ min: 8 })
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);

      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { fullName, email, password } = req.body;

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
        role: "recruiter",
        recruiterStatus: "pending",
        isEmailVerified: false,
        emailVerificationToken: crypto
          .createHash("sha256")
          .update(verificationToken)
          .digest("hex"),
        emailVerificationExpiry: new Date(Date.now() + 10 * 60 * 1000)
      });

      try {
        await sendVerificationEmail(user.email, verificationToken);
      } catch (emailError) {
        console.error("Recruiter verification email failed:", emailError.message);
        return res.status(503).json({
          message: "Account created, but verification email could not be sent. Use the resend option to try again."
        });
      }

      return res.status(201).json({
        message: "Recruiter registered. Verify your email and await admin approval before logging in.",
        user: {
          id: user._id,
          fullName: user.fullName,
          email: user.email,
          role: user.role,
          recruiterStatus: user.recruiterStatus
        }
      });
    } catch (error) {
      console.error("Recruiter registration error:", error);

      return res.status(500).json({
        message: "Unable to register recruiter"
      });
    }
  }
);

// Resend without revealing whether the email belongs to an eligible account.
router.post("/resend-verification", resendVerificationLimiter, async (req, res) => {
  const genericResponse = {
    message: "If an eligible recruiter account exists, a verification email will be sent shortly."
  };

  try {
    const email = String(req.body?.email || "").trim().toLowerCase();
    if (!email) return res.status(200).json(genericResponse);

    const user = await User.findOne({ email, role: "recruiter" });
    if (user && !user.isEmailVerified && user.recruiterStatus !== "rejected") {
      const verificationToken = crypto.randomBytes(32).toString("hex");
      user.emailVerificationToken = crypto
        .createHash("sha256")
        .update(verificationToken)
        .digest("hex");
      user.emailVerificationExpiry = new Date(Date.now() + 10 * 60 * 1000);
      await user.save();

      try {
        await sendVerificationEmail(user.email, verificationToken);
      } catch (emailError) {
        console.error("Resend verification email failed:", emailError.message);
      }
    }

    return res.status(200).json(genericResponse);
  } catch (error) {
    console.error("Resend verification request failed:", error.message);
    return res.status(200).json(genericResponse);
  }
});

// LOGIN
router.post(
  "/login",
  loginLimiter,
  [
    body("email").isEmail().normalizeEmail(),
    body("password").notEmpty()
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);

      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { email, password } = req.body;

      const user = await User.findOne({ email: email.toLowerCase() });

      if (!user) {
        return res.status(401).json({
          message: "Invalid email or password"
        });
      }

      if (user.lockUntil && user.lockUntil > new Date()) {
        return res.status(423).json({
          message: "Account is temporarily locked. Try again later."
        });
      }

      if (user.lockUntil && user.lockUntil <= new Date()) {
        user.failedLoginAttempts = 0;
        user.lockUntil = null;
      }

      const isPasswordValid = await user.comparePassword(password);

      if (!isPasswordValid) {
        user.failedLoginAttempts += 1;

        if (user.failedLoginAttempts >= 5) {
          user.lockUntil = new Date(Date.now() + 15 * 60 * 1000);
        }

        await user.save();

        return res.status(401).json({
          message: "Invalid email or password",
          remainingAttempts: Math.max(0, 5 - user.failedLoginAttempts)
        });
      }

      if (user.role !== "student" && !user.isEmailVerified) {
        return res.status(403).json({
          message: "Please verify your email before logging in"
        });
      }

      if (
        user.role === "recruiter" &&
        user.recruiterStatus !== "approved"
      ) {
        return res.status(403).json({
          message: "Recruiter account is awaiting admin approval"
        });
      }

      user.failedLoginAttempts = 0;
      user.lockUntil = null;
      await user.save();

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

// RBAC TEST ROUTE - STUDENT ONLY
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

// RECRUITER-ONLY PROTECTED ROUTE
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


router.get("/skills", protect, authorize("student"), async (req, res) => {
  return res.status(200).json({ skills: req.user.skills || [] });
});

router.patch("/skills", protect, authorize("student"), async (req, res) => {
  try {
    const skills = Array.isArray(req.body.skills) ? req.body.skills : String(req.body.skills || "").split(",");
    const cleaned = [...new Set(skills.map(skill => String(skill).trim()).filter(Boolean))];
    if (cleaned.length > 30) {
      return res.status(400).json({ message: "You can save a maximum of 30 skills." });
    }
    const user = await User.findByIdAndUpdate(req.user._id, { skills: cleaned }, { new: true, runValidators: true }).select("fullName email skills");
    if (!user) return res.status(404).json({ message: "Student not found." });
    res.json({ message: "Your skills have been saved.", user });
  } catch (error) {
    res.status(400).json({ message: "Unable to save skills." });
  }
});

module.exports = router;
