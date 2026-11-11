const express = require("express");
const { protect, authorize } = require("../middleware/authMiddleware");
const User = require("../models/User");
const Application = require("../../models/Application");
const Internship = require("../../models/Internship");
const AptitudeSession = require("../../models/AptitudeSession");

const router = express.Router();

router.get("/student", protect, authorize("student"), async (req, res) => {
  try {
    const [student, applications, tests] = await Promise.all([
      User.findById(req.user._id).select("skills").lean(),
      Application.find({ student: req.user._id }).populate("internship", "title company location skills deadline")
        .sort({ createdAt: -1 }).limit(50).lean(),
      AptitudeSession.find({ student: req.user._id, status: { $in: ["submitted", "expired"] } })
        .select("topic result status startedAt submittedAt").sort({ submittedAt: -1 }).limit(20).lean()
    ]);
    const skills = (student?.skills || []).map(value => String(value).trim()).filter(Boolean);
    const appliedIds = applications.map(item => item.internship?._id).filter(Boolean);
    const filter = { isActive: true, deadline: { $gte: new Date() } };
    if (appliedIds.length) filter._id = { $nin: appliedIds };
    if (skills.length) filter.skills = { $in: skills.map(skill => new RegExp(`^${skill.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i")) };
    const recommendations = await Internship.find(filter).sort({ createdAt: -1 }).limit(20)
      .select("title company location skills stipend duration deadline").lean();
    const answeredSkills = new Set(recommendations.flatMap(item => item.skills || []).map(s => String(s).toLowerCase()));
    const skillGaps = skills.filter(skill => !answeredSkills.has(skill.toLowerCase()));
    const testHistory = tests.map(test => ({ ...test, timeTakenSeconds: test.submittedAt && test.startedAt
      ? Math.max(0, Math.round((new Date(test.submittedAt) - new Date(test.startedAt)) / 1000)) : null }));
    const topicStats = ["quantitative", "logical", "verbal"].map(topic => {
      const attempts = testHistory.filter(test => test.topic === topic && Number.isFinite(Number(test.result?.percentage)));
      const averagePercentage = attempts.length
        ? Number((attempts.reduce((sum, test) => sum + Number(test.result.percentage), 0) / attempts.length).toFixed(2))
        : null;
      return {
        topic,
        attempts: attempts.length,
        averagePercentage,
        latestPercentage: attempts.length ? Number(attempts[0].result.percentage) : null
      };
    });
    const completedAttempts = testHistory.length;
    const overallAverage = completedAttempts
      ? Number((testHistory.reduce((sum, test) => sum + Number(test.result?.percentage || 0), 0) / completedAttempts).toFixed(2))
      : null;
    const testPerformance = { completedAttempts, overallAverage, byTopic: topicStats };
    res.json({ applications, tests: testHistory, testPerformance, recommendations, skillGaps, skills });
  } catch (error) {
    console.error("Student dashboard error:", error);
    res.status(500).json({ message: "Unable to retrieve student dashboard." });
  }
});

module.exports = router;
