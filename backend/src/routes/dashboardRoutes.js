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
    const appliedIds = await Application.distinct("internship", { student: req.user._id });
    const normalize = value => String(value).trim().toLowerCase();
    const profile = new Set(skills.map(normalize));
    const topicSkills = { quantitative: ["quantitative", "mathematics", "math", "statistics"], logical: ["logical", "logic", "reasoning", "problem solving"], verbal: ["verbal", "communication", "english", "writing"] };
    const scores = new Map();
    for (const test of tests) if (!scores.has(test.topic)) scores.set(test.topic, Number(test.result?.percentage) || 0);
    const candidates = skills.length ? await Internship.find({ isActive: true, deadline: { $gte: new Date() }, _id: { $nin: appliedIds } }).sort({ createdAt: -1 }).select("title company location skills stipend duration deadline").lean() : [];
    const ranked = candidates.map(job => {
      const required = (job.skills || []).map(normalize);
      const matches = required.filter(skill => profile.has(skill));
      const related = Object.entries(topicSkills).filter(([, names]) => names.some(name => matches.includes(name)));
      const aptitudeScore = related.reduce((sum, [topic]) => sum + (scores.get(topic) || 0), 0) / Math.max(1, related.length);
      return { ...job, matchedSkills: matches, missingSkills: required.filter(skill => !profile.has(skill)), aptitudeScore };
    }).filter(job => job.matchedSkills.length).sort((a, b) => b.matchedSkills.length - a.matchedSkills.length || b.aptitudeScore - a.aptitudeScore);
    const recommendations = ranked.slice(0, 20);
    const skillGaps = [...new Set(recommendations.flatMap(job => job.missingSkills))];
    const testHistory = tests.map(test => ({ ...test, timeTakenSeconds: test.submittedAt && test.startedAt
      ? Math.max(0, Math.round((new Date(test.submittedAt) - new Date(test.startedAt)) / 1000)) : null }));
    res.json({ applications, tests: testHistory, recommendations, skillGaps, skills });
  } catch (error) {
    console.error("Student dashboard error:", error);
    res.status(500).json({ message: "Unable to retrieve student dashboard." });
  }
});

module.exports = router;
