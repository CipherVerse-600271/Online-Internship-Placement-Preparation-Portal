const mongoose = require("mongoose");
const answerSchema = new mongoose.Schema({ questionId: { type: String, required: true }, selectedOption: { type: Number, default: null }, isCorrect: { type: Boolean, default: false } }, { _id: false });
const aptitudeAttemptSchema = new mongoose.Schema({
  studentId: { type: String, required: true, index: true }, testId: { type: String, required: true }, testTitle: { type: String, required: true }, category: { type: String, required: true, enum: ["quantitative", "logical", "verbal"] },
  startedAt: { type: Date, required: true, default: Date.now }, expiresAt: { type: Date, required: true }, submittedAt: { type: Date, default: null }, status: { type: String, enum: ["in_progress", "submitted", "expired"], default: "in_progress" },
  answers: { type: [answerSchema], default: [] }, correctCount: { type: Number, default: 0 }, incorrectCount: { type: Number, default: 0 }, unansweredCount: { type: Number, default: 0 }, totalQuestions: { type: Number, required: true }, score: { type: Number, default: 0 }, percentage: { type: Number, default: 0 },
}, { timestamps: true });
aptitudeAttemptSchema.index({ studentId: 1, createdAt: -1 });
module.exports = mongoose.model("AptitudeAttempt", aptitudeAttemptSchema);

