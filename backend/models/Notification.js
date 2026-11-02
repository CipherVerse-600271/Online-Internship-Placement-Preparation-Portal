const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema({
  student: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  application: { type: mongoose.Schema.Types.ObjectId, ref: "Application", required: true },
  message: { type: String, required: true },
  status: { type: String, enum: ["Pending", "Shortlisted", "Rejected", "Accepted"], required: true },
  read: { type: Boolean, default: false }
}, { timestamps: true });

module.exports = mongoose.model("Notification", notificationSchema);
