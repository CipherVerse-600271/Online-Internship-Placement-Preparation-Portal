
const express = require("express");
const { body, validationResult } = require("express-validator");
const User = require("../models/User");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const { sendVerificationEmail } = require("../utils/emailService");
const { protect, authorize } = require("../middleware/authMiddleware");

const router = express.Router();

// STUDENT REGISTRATION
router.post(
  "/register/student",
  [
    body("fullName").trim().notEmpty(),
    body("email").isEmail().normalizeEmail(),
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

      console.log("Student created. Sending verification email...");

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
      console.error("Student registration/email error:", error);

      return res.status(500).json({
        message: "Registration completed or attempted, but email sending failed. Check backend logs."
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

      const user = await User.create({
        fullName,
        email,
        password,
        role: "recruiter",
        recruiterStatus: "pending",
        isEmailVerified: false
      });

      return res.status(201).json({
        message: "Recruiter registered. Awaiting admin verification.",
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

// LOGIN
router.post(
  "/login",
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

      if (!user.isEmailVerified) {
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
module.exports = router;
