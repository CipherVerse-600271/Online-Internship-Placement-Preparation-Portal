const mongoose = require("mongoose");

const aptitudeSessionSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },
    topic: {
      type: String,
      required: true,
      enum: ["quantitative", "logical", "verbal"]
    },
    questionIds: {
      type: [String],
      required: true
    },
    answers: [
      {
        questionId: { type: String, required: true },
        selectedOption: { type: Number, min: 0, max: 3 }
      }
    ],
    startedAt: { type: Date, required: true },
    expiresAt: { type: Date, required: true },
    submittedAt: { type: Date, default: null },
    status: {
      type: String,
      enum: ["in_progress", "submitted", "expired"],
      default: "in_progress"
    },
    result: {
      totalQuestions: { type: Number, default: 0 },
      answered: { type: Number, default: 0 },
      correct: { type: Number, default: 0 },
      incorrect: { type: Number, default: 0 },
      unanswered: { type: Number, default: 0 },
      score: { type: Number, default: 0 },
      percentage: { type: Number, default: 0 },
      topic: { type: String, default: "" }
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("AptitudeSession", aptitudeSessionSchema);
