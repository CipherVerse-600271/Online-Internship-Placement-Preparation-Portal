const mongoose = require("mongoose");

const applicationSchema = new mongoose.Schema({
  student: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  internship: { type: mongoose.Schema.Types.ObjectId, ref: "Internship", required: true, index: true },
  resumeUrl: { type: String, required: true, trim: true },
  resumeName: { type: String, required: true, trim: true },
  coverLetter: { type: String, trim: true, default: "" },
  status: { type: String, enum: ["Pending", "Shortlisted", "Rejected", "Accepted"], default: "Pending" }
}, { timestamps: true });

applicationSchema.index({ student: 1, internship: 1 }, { unique: true });
module.exports = mongoose.model("Application", applicationSchema);
