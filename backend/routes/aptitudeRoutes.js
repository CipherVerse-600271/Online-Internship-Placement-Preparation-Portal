const express = require("express");
const mongoose = require("mongoose");
const { protect, authorize } = require("../src/middleware/authMiddleware");
const AptitudeSession = require("../models/AptitudeSession");
const questionBank = require("../services/aptitudeQuestionBank");

const router = express.Router();

router.use(protect, authorize("student"));

const toPublicQuestion = (question) => ({
  id: question.id,
  text: question.text,
  options: question.options
});

const getSessionForStudent = async (sessionId, studentId) => {
  if (!mongoose.Types.ObjectId.isValid(sessionId)) return null;
  return AptitudeSession.findOne({ _id: sessionId, student: studentId });
};

const evaluateSession = (session) => {
  const topic = questionBank[session.topic];
  const answersByQuestion = new Map(
    session.answers.map((answer) => [answer.questionId, answer.selectedOption])
  );

  let correct = 0;
  let incorrect = 0;
  let answered = 0;

  for (const questionId of session.questionIds) {
    if (!answersByQuestion.has(questionId)) continue;
    answered += 1;
    if (answersByQuestion.get(questionId) === topic.questions.find((q) => q.id === questionId)?.correctOption) {
      correct += 1;
    } else {
      incorrect += 1;
    }
  }

  const totalQuestions = session.questionIds.length;
  const unanswered = totalQuestions - answered;

  session.result = {
    totalQuestions,
    answered,
    correct,
    incorrect,
    unanswered,
    score: correct,
    percentage: totalQuestions ? Number(((correct / totalQuestions) * 100).toFixed(2)) : 0,
    topic: topic.name
  };
};

const finalizeSession = async (session) => {
  if (session.status === "in_progress") {
    const expired = new Date() >= session.expiresAt;
    session.status = expired ? "expired" : "submitted";
    session.submittedAt = expired ? session.expiresAt : new Date();
  }

  if (!session.result || session.result.totalQuestions === 0) {
    evaluateSession(session);
  }

  await session.save();
  return session;
};

router.get("/topics", (req, res) => {
  res.json(
    Object.entries(questionBank).map(([id, topic]) => ({
      id,
      name: topic.name,
      questionCount: topic.questions.length,
      durationSeconds: topic.durationSeconds
    }))
  );
});

router.post("/start", async (req, res) => {
  try {
    const { topic } = req.body;
    const selectedTopic = questionBank[topic];

    if (!selectedTopic) {
      return res.status(400).json({ message: "Please select a valid aptitude topic." });
    }

    const startedAt = new Date();
    const expiresAt = new Date(startedAt.getTime() + selectedTopic.durationSeconds * 1000);

    const session = await AptitudeSession.create({
      student: req.user._id,
      topic,
      questionIds: selectedTopic.questions.map((question) => question.id),
      startedAt,
      expiresAt
    });

    return res.status(201).json({
      sessionId: session._id,
      topic,
      topicName: selectedTopic.name,
      durationSeconds: selectedTopic.durationSeconds,
      startedAt,
      expiresAt,
      questions: selectedTopic.questions.map(toPublicQuestion)
    });
  } catch (error) {
    console.error("Unable to start aptitude test:", error);
    return res.status(500).json({ message: "Unable to start aptitude test." });
  }
});

router.get("/sessions/:sessionId", async (req, res) => {
  try {
    const session = await getSessionForStudent(req.params.sessionId, req.user._id);
    if (!session) return res.status(404).json({ message: "Test session not found." });

    if (session.status === "in_progress" && new Date() >= session.expiresAt) {
      await finalizeSession(session);
    }

    const topic = questionBank[session.topic];

    return res.json({
      sessionId: session._id,
      topic: session.topic,
      topicName: topic.name,
      status: session.status,
      startedAt: session.startedAt,
      expiresAt: session.expiresAt,
      submittedAt: session.submittedAt,
      answers: session.answers,
      result: session.result,
      questions: session.questionIds
        .map((id) => topic.questions.find((question) => question.id === id))
        .filter(Boolean)
        .map(toPublicQuestion)
    });
  } catch (error) {
    console.error("Unable to retrieve aptitude session:", error);
    return res.status(500).json({ message: "Unable to retrieve test session." });
  }
});

router.put("/sessions/:sessionId/answers", async (req, res) => {
  try {
    const { questionId, selectedOption } = req.body;
    const session = await getSessionForStudent(req.params.sessionId, req.user._id);

    if (!session) return res.status(404).json({ message: "Test session not found." });

    if (session.status === "in_progress" && new Date() >= session.expiresAt) {
      await finalizeSession(session);
    }

    if (session.status !== "in_progress") {
      return res.status(409).json({ message: "This test is no longer accepting answers.", status: session.status });
    }

    const topic = questionBank[session.topic];
    const question = topic.questions.find((item) => item.id === questionId);

    if (!question || !session.questionIds.includes(questionId)) {
      return res.status(400).json({ message: "Invalid question for this test." });
    }

    if (!Number.isInteger(selectedOption) || selectedOption < 0 || selectedOption >= question.options.length) {
      return res.status(400).json({ message: "Please select a valid answer option." });
    }

    const existingAnswer = session.answers.find((answer) => answer.questionId === questionId);
    if (existingAnswer) {
      existingAnswer.selectedOption = selectedOption;
    } else {
      session.answers.push({ questionId, selectedOption });
    }

    await session.save();
    return res.json({ message: "Answer saved.", answers: session.answers });
  } catch (error) {
    console.error("Unable to save aptitude answer:", error);
    return res.status(500).json({ message: "Unable to save answer." });
  }
});

router.post("/sessions/:sessionId/submit", async (req, res) => {
  try {
    const session = await getSessionForStudent(req.params.sessionId, req.user._id);
    if (!session) return res.status(404).json({ message: "Test session not found." });

    await finalizeSession(session);

    return res.json({
      message: session.status === "expired" ? "Time expired. Test ended automatically." : "Test submitted successfully.",
      status: session.status,
      submittedAt: session.submittedAt,
      result: session.result
    });
  } catch (error) {
    console.error("Unable to submit aptitude test:", error);
    return res.status(500).json({ message: "Unable to submit aptitude test." });
  }
});

module.exports = router;
