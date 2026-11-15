const { test, before, after } = require("node:test");
const assert = require("node:assert/strict");
const crypto = require("node:crypto");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const express = require("express");

process.env.JWT_SECRET = "aptitude-test-secret-at-least-thirty-two-characters";
process.env.NODE_ENV = "test";
const userPath = require.resolve("../src/models/User");
require.cache[userPath] = { id: userPath, filename: userPath, loaded: true, exports: {
  findById: id => ({ select: async () => ({ _id: id, role: "student", isActive: true }) })
} };
const sessions = [];
const sessionModelPath = require.resolve("../models/AptitudeSession");
require.cache[sessionModelPath] = { id: sessionModelPath, filename: sessionModelPath, loaded: true, exports: {
  create: async data => {
    const session = { ...data, _id: new mongoose.Types.ObjectId(), answers: [], status: "in_progress", result: null,
      save: async function () { return this; } };
    sessions.push(session); return session;
  },
  findOne: query => Promise.resolve(sessions.find(item => String(item._id) === String(query._id) && String(item.student) === String(query.student)) || null)
} };
const aptitudeRoutes = require("../routes/aptitudeRoutes");
const app = express(); app.use(express.json()); app.use("/api/aptitude", aptitudeRoutes);
let server; let base;
before(async () => { server = app.listen(0, "127.0.0.1"); await new Promise(resolve => server.once("listening", resolve)); base = `http://127.0.0.1:${server.address().port}`; });
after(async () => { await new Promise(resolve => server.close(resolve)); });
const studentId = new mongoose.Types.ObjectId().toString();
const token = jwt.sign({ id: studentId, role: "student" }, process.env.JWT_SECRET, { expiresIn: "5m" });
const request = (path, method = "GET", body, auth = token) => fetch(`${base}/api/aptitude${path}`, { method,
  headers: { ...(body ? { "content-type": "application/json" } : {}), ...(auth ? { authorization: `Bearer ${auth}` } : {}) }, body: body ? JSON.stringify(body) : undefined });

test("timed aptitude sessions hide answers and produce an automatic score", async () => {
  const unauthenticated = await request("/topics", "GET", undefined, "");
  assert.equal(unauthenticated.status, 401);
  const topicsResponse = await request("/topics");
  assert.equal(topicsResponse.status, 200);
  const started = await request("/start", "POST", { topic: "quantitative" });
  assert.equal(started.status, 201);
  const session = await started.json();
  assert.ok(session.questions.length > 0);
  assert.equal("correctOption" in session.questions[0], false);
  assert.ok(new Date(session.expiresAt) > new Date(session.startedAt));
  const question = session.questions[0];
  const saved = await request(`/sessions/${session.sessionId}/answers`, "PUT", { questionId: question.id, selectedOption: 0 });
  assert.equal(saved.status, 200);
  const submitted = await request(`/sessions/${session.sessionId}/submit`, "POST", {});
  assert.equal(submitted.status, 200);
  const result = await submitted.json();
  assert.equal(result.result.totalQuestions, session.questions.length);
  assert.equal(result.result.answered, 1);
  assert.equal(result.result.correct + result.result.incorrect, 1);
  const otherUserToken = jwt.sign({ id: crypto.randomBytes(12).toString("hex"), role: "student" }, process.env.JWT_SECRET);
  const otherUser = await request(`/sessions/${session.sessionId}`, "GET", undefined, otherUserToken);
  assert.equal(otherUser.status, 404);
});
