
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: true,
      trim: true
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true
    },

    srn: {
      type: String,
      unique: true,
      sparse: true,
      uppercase: true,
      trim: true
    },

    skills: { type: [String], default: [] },

    companyName: { type: String, trim: true, maxlength: 160 },
    companyWebsite: { type: String, trim: true, maxlength: 300 },
    companyEmail: { type: String, trim: true, lowercase: true, maxlength: 254 },
    recruiterDecisionReason: { type: String, trim: true, maxlength: 500, default: null },
    recruiterReviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    recruiterReviewedAt: { type: Date, default: null },

    password: {
      type: String,
      required: true,
      minlength: 8
    },

    role: {
      type: String,
      enum: ["student", "recruiter", "admin"],
      required: true,
      default: "student"
    },
    isActive: { type: Boolean, default: true, index: true },

    isEmailVerified: {
      type: Boolean,
      default: false
    },

    recruiterStatus: {
      type: String,
      enum: ["not_applicable", "pending", "approved", "rejected"],
      default: "not_applicable"
    },

    failedLoginAttempts: {
      type: Number,
      default: 0
    },

    lockUntil: {
      type: Date,
      default: null
    },

    resetOTP: {
      type: String,
      default: null
    },

    resetOTPExpiry: {
      type: Date,
      default: null
    },
    resetOTPAttempts: { type: Number, default: 0 },

    emailVerificationToken: {
      type: String,
      default: null
    },

    emailVerificationExpiry: {
      type: Date,
      default: null
    }
  },
  {
    timestamps: true
  }
);

// Hash password before saving
userSchema.pre("save", async function () {
  if (!this.isModified("password")) return;

  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
});

// Compare entered password with stored hash
userSchema.methods.comparePassword = async function (enteredPassword) {
  return bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model("User", userSchema);
