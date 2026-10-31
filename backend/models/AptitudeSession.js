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
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("AptitudeSession", aptitudeSessionSchema);
