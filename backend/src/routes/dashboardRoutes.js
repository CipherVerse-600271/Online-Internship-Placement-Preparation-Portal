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
      Application.find({ student: req.user._id })
        .populate("internship", "title company location skills deadline")
        .sort({ createdAt: -1 }).limit(50).lean(),
      AptitudeSession.find({ student: req.user._id, status: { $in: ["submitted", "expired"] } })
        .select("topic result status startedAt submittedAt timeTakenSeconds")
        .sort({ submittedAt: -1 }).limit(20).lean()
    ]);

    const skills = (student?.skills || []).map(value => String(value).trim()).filter(Boolean);
    const testHistory = tests.map(test => ({
      ...test,
      timeTakenSeconds: test.timeTakenSeconds ?? (test.submittedAt && test.startedAt
        ? Math.max(0, Math.round((new Date(test.submittedAt) - new Date(test.startedAt)) / 1000))
        : null)
    }));
    const topicStats = ["quantitative", "logical", "verbal"].map(topic => {
      const attempts = testHistory.filter(test =>
        test.topic === topic && Number.isFinite(Number(test.result?.percentage))
      );
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
    const aptitudeSkillGaps = topicStats
      .filter(item => item.attempts > 0 && item.averagePercentage < 60)
      .map(item => ({
        topic: item.topic,
        averagePercentage: item.averagePercentage,
        attempts: item.attempts,
        targetPercentage: 60
      }));
    const testPerformance = { completedAttempts, overallAverage, byTopic: topicStats };

    const appliedIds = applications.map(item => item.internship?._id).filter(Boolean);
    const filter = { isActive: true, deadline: { $gte: new Date() } };
    if (appliedIds.length) filter._id = { $nin: appliedIds };
    if (skills.length) {
      filter.skills = {
        $in: skills.map(skill => new RegExp(`^${skill.replace(/[.*+?^${}()|[\\]\\\\]/g, "\\\\$&")}$`, "i"))
      };
    }
    const recommendationCandidates = await Internship.find(filter)
      .select("title company location skills aptitudeTopics stipend duration deadline").lean();
    const normalizedSkills = skills.map(skill => skill.toLowerCase());
    const topicPerformance = Object.fromEntries(topicStats.map(item => [item.topic, item.averagePercentage]));
    const recommendations = recommendationCandidates.map(internship => {
      const matchedSkills = (internship.skills || []).filter(skill =>
        normalizedSkills.includes(String(skill).trim().toLowerCase())
      );
      const requiredSkills = (internship.skills || []).length;
      const matchScore = requiredSkills ? Math.round((matchedSkills.length / requiredSkills) * 100) : 0;
      const taggedTopics = (internship.aptitudeTopics || []).filter(topic => topicPerformance[topic] != null);
      const aptitudePerformanceScore = taggedTopics.length
        ? Number((taggedTopics.reduce((sum, topic) => sum + topicPerformance[topic], 0) / taggedTopics.length).toFixed(2))
        : overallAverage;
      // Skill fit carries 80%; aptitude performance contributes 20% when test data exists.
      const recommendationScore = aptitudePerformanceScore == null
        ? matchScore
        : Math.round((matchScore * 0.8) + (aptitudePerformanceScore * 0.2));
      return {
        ...internship,
        matchedSkills,
        matchScore,
        aptitudePerformanceScore,
        recommendationScore,
        aptitudeTopics: internship.aptitudeTopics || []
      };
    }).sort((a, b) =>
      b.recommendationScore - a.recommendationScore ||
      b.matchScore - a.matchScore ||
      a.title.localeCompare(b.title)
    ).slice(0, 20);

    const recommendedSkills = new Set(
      recommendations.flatMap(item => item.skills || []).map(skill => String(skill).toLowerCase())
    );
    const skillGaps = skills.filter(skill => !recommendedSkills.has(skill.toLowerCase()));

    res.json({
      applications,
      tests: testHistory,
      testPerformance,
      aptitudeSkillGaps,
      recommendations,
      skillGaps,
      skills
    });
  } catch (error) {
    console.error("Student dashboard error:", error);
    res.status(500).json({ message: "Unable to retrieve student dashboard." });
  }
});

module.exports = router;
