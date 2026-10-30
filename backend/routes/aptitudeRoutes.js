const express = require("express");
const AptitudeAttempt = require("../models/AptitudeAttempt");
const { listTests, getTest, publicQuestions, gradeAttempt } = require("../services/aptitudeService");
const router = express.Router();

function requireStudent(req, res, next) {
  const studentId = req.user?.id || (process.env.NODE_ENV !== "production" ? req.get("x-student-id") : null);
  if (!studentId) return res.status(401).json({ message: "Authentication is required." });
  req.studentId = String(studentId);
  next();
}

router.get("/tests", (req, res) => res.json(listTests()));
router.post("/attempts", requireStudent, async (req, res, next) => {
  try {
    const test = getTest(req.body.testId);
    if (!test) return res.status(404).json({ message: "Aptitude test not found." });
    const startedAt = new Date();
    const expiresAt = new Date(startedAt.getTime() + test.durationMinutes * 60 * 1000);
    const attempt = await AptitudeAttempt.create({ studentId: req.studentId, testId: test.id, testTitle: test.title, category: test.category, startedAt, expiresAt, totalQuestions: test.questions.length });
    res.status(201).json({ attemptId: attempt.id, test: { ...test, questions: publicQuestions(test) }, expiresAt });
  } catch (error) { next(error); }
});
router.post("/attempts/:attemptId/submit", requireStudent, async (req, res, next) => {
  try {
    const attempt = await AptitudeAttempt.findOne({ _id: req.params.attemptId, studentId: req.studentId });
    if (!attempt) return res.status(404).json({ message: "Attempt not found." });
    if (attempt.status !== "in_progress") return res.status(409).json({ message: "This attempt has already been submitted.", attempt });
    const test = getTest(attempt.testId);
    if (!test) return res.status(500).json({ message: "The test definition is unavailable." });
    const now = new Date();
    attempt.set({ ...gradeAttempt(test, req.body.answers), submittedAt: now, status: now > attempt.expiresAt ? "expired" : "submitted" });
    await attempt.save();
    res.json({ attempt, answerReview: test.questions.map((question) => ({ questionId: question.id, explanation: question.explanation })) });
  } catch (error) { next(error); }
});
router.get("/attempts", requireStudent, async (req, res, next) => {
  try { res.json(await AptitudeAttempt.find({ studentId: req.studentId }).sort({ createdAt: -1 })); } catch (error) { next(error); }
});
module.exports = router;

