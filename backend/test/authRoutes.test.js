const { test, before, after } = require("node:test");
const assert = require("node:assert/strict");
const crypto = require("node:crypto");
const bcrypt = require("bcryptjs");
const express = require("express");

process.env.JWT_SECRET = "test-secret-that-is-long-enough-for-unit-tests-123456";
process.env.NODE_ENV = "test";

const users = [];
const sent = { verification: [], otp: [] };
const matches = (user, query) => Object.entries(query).every(([key, expected]) => {
  if (key === "$or") return expected.some((clause) => matches(user, clause));
  const actual = user[key];
  if (expected && typeof expected === "object" && !(expected instanceof Date)) {
    if ("$gt" in expected) return actual && new Date(actual) > expected.$gt;
    if ("$lt" in expected) return actual < expected.$lt;
    if ("$ne" in expected) return actual !== expected.$ne;
  }
  return String(actual ?? "") === String(expected ?? "");
});
class FakeUser {
  constructor(data) { Object.assign(this, data); this._id ||= crypto.randomBytes(12).toString("hex"); this.failedLoginAttempts ??= 0; this.lockUntil ??= null; }
  select() { return this; }
  async save() { if (this.password && !this.password.startsWith("$2")) this.password = await bcrypt.hash(this.password, 4); if (!users.includes(this)) users.push(this); return this; }
  async comparePassword(value) { return bcrypt.compare(value, this.password); }
  static async create(data) { const user = new FakeUser(data); await user.save(); return user; }
  static async findOne(query) { return users.find((user) => matches(user, query)) || null; }
  static findById(id) { const user = users.find((entry) => entry._id === String(id)) || null; return { select: async () => user }; }
  static async updateOne(query, update) { const user = await this.findOne(query); if (user && update.$inc) for (const [key, amount] of Object.entries(update.$inc)) user[key] = (user[key] || 0) + amount; }
  static find(query) { const result = users.filter((user) => matches(user, query)); return { select: async () => result }; }
}
const userPath = require.resolve("../src/models/User");
require.cache[userPath] = { id: userPath, filename: userPath, loaded: true, exports: FakeUser };
const emailPath = require.resolve("../src/utils/emailService");
require.cache[emailPath] = { id: emailPath, filename: emailPath, loaded: true, exports: {
  sendVerificationEmail: async (email, token) => sent.verification.push({ email, token }),
  sendPasswordResetEmail: async (email, otp) => sent.otp.push({ email, otp })
} };
const auditPath = require.resolve("../src/utils/auditLog");
require.cache[auditPath] = { id: auditPath, filename: auditPath, loaded: true, exports: async () => {} };
const authRoutes = require("../src/routes/authRoutes");
const adminRoutes = require("../src/routes/adminRoutes");
const app = express(); app.use(express.json()); app.use("/api/auth", authRoutes); app.use("/api/admin", adminRoutes);
let server; let base;
before(async () => { server = app.listen(0, "127.0.0.1"); await new Promise((resolve) => server.once("listening", resolve)); base = `http://127.0.0.1:${server.address().port}`; });
after(async () => { await new Promise((resolve) => server.close(resolve)); });
const request = (path, method = "GET", body, token) => fetch(`${base}${path}`, { method, headers: { ...(body ? { "content-type": "application/json" } : {}), ...(token ? { authorization: `Bearer ${token}` } : {}) }, body: body ? JSON.stringify(body) : undefined });
const hash = (value) => crypto.createHash("sha256").update(value).digest("hex");

test("student registration accepts personal email, sends verification, gates login, then issues role-bound JWT", async () => {
  const invalid = await request("/api/auth/register/student", "POST", { fullName: "Test Student", email: "not-an-email", srn: "PES1UG00", password: "StrongPass1" });
  assert.equal(invalid.status, 400);
  const registered = await request("/api/auth/register/student", "POST", { fullName: "Test Student", email: "student@gmail.com", srn: "PES1UG00", password: "StrongPass1" });
  assert.equal(registered.status, 201); assert.equal(sent.verification.length, 1);
  const user = users.find((entry) => entry.email === "student@gmail.com");
  assert.notEqual(user.password, "StrongPass1"); assert.equal(await user.comparePassword("StrongPass1"), true);
  assert.equal((await request("/api/auth/login", "POST", { email: user.email, password: "StrongPass1" })).status, 403);
  assert.equal((await request(`/api/auth/verify-email/${sent.verification[0].token}`)).status, 200);
  const login = await request("/api/auth/login", "POST", { email: user.email, password: "StrongPass1" });
  assert.equal(login.status, 200); const data = await login.json(); assert.equal(data.user.role, "student");
  assert.equal((await request("/api/auth/student-dashboard", "GET", null, data.token)).status, 200);
  assert.equal((await request("/api/auth/recruiter-dashboard", "GET", null, data.token)).status, 403);
  assert.equal((await request("/api/auth/student-dashboard", "GET", null, "not-a-token")).status, 401);
});

test("recruiter registration requires company data; only an admin can approve/reject", async () => {
  const response = await request("/api/auth/register/recruiter", "POST", { fullName: "Test Recruiter", email: "recruiter@example.com", password: "StrongPass1", companyName: "Acme Ltd" });
  assert.equal(response.status, 201);
  const recruiter = users.find((entry) => entry.email === "recruiter@example.com"); assert.equal(recruiter.recruiterStatus, "pending");
  const beforeVerify = await request("/api/auth/login", "POST", { email: recruiter.email, password: "StrongPass1" }); assert.equal(beforeVerify.status, 403);
  await request(`/api/auth/verify-email/${sent.verification.find((entry) => entry.email === recruiter.email).token}`);
  const admin = await FakeUser.create({ fullName: "Admin", email: "admin@example.com", password: "StrongPass1", role: "admin", isEmailVerified: true });
  const jwt = require("jsonwebtoken").sign({ id: admin._id }, process.env.JWT_SECRET, { expiresIn: "1h" });
  const approve = await request(`/api/admin/recruiters/${recruiter._id}/approve`, "PATCH", {}, jwt);
  assert.equal(approve.status, 200, await approve.text());
  assert.equal(recruiter.recruiterStatus, "approved"); assert.equal(String(recruiter.recruiterReviewedBy), String(admin._id));
  const rejected = await FakeUser.create({ fullName: "Second Recruiter", email: "second@example.com", password: "StrongPass1", role: "recruiter", recruiterStatus: "pending" });
  assert.equal((await request(`/api/admin/recruiters/${rejected._id}/reject`, "PATCH", { reason: "Could not verify company" }, jwt)).status, 200);
  assert.equal(rejected.recruiterStatus, "rejected");
  rejected.isEmailVerified = true;
  const rejectedLogin = await request("/api/auth/login", "POST", { email: rejected.email, password: "StrongPass1" });
  assert.equal(rejectedLogin.status, 403); assert.match((await rejectedLogin.json()).message, /rejected/i);
  assert.equal((await request(`/api/admin/recruiters/${rejected._id}/approve`, "PATCH", {}, jwt)).status, 400);
});

test("password reset OTP is hashed, expires, is single use, and changes password", async () => {
  const user = users.find((entry) => entry.email === "student@gmail.com");
  assert.equal((await request("/api/auth/forgot-password", "POST", { email: user.email })).status, 200);
  const otp = sent.otp.at(-1).otp; assert.equal(user.resetOTP, hash(otp));
  const expiry = user.resetOTPExpiry; user.resetOTPExpiry = new Date(Date.now() - 1);
  assert.equal((await request("/api/auth/reset-password", "POST", { email: user.email, otp, newPassword: "NewStrong2" })).status, 400);
  user.resetOTPExpiry = expiry;
  assert.equal((await request("/api/auth/reset-password", "POST", { email: user.email, otp: "000000", newPassword: "NewStrong2" })).status, 400);
  assert.equal((await request("/api/auth/reset-password", "POST", { email: user.email, otp, newPassword: "NewStrong2" })).status, 200);
  assert.equal(await user.comparePassword("NewStrong2"), true); assert.equal(user.resetOTP, null);
  assert.equal((await request("/api/auth/reset-password", "POST", { email: user.email, otp, newPassword: "Another3Strong" })).status, 400);
});

test("fifth failed login locks for 15 minutes and reset/success clears lockout", async () => {
  const user = await FakeUser.create({ fullName: "Locked", email: "locked@stu.pes.edu", password: "StrongPass1", role: "student", isEmailVerified: true });
  for (let i = 0; i < 5; i++) assert.equal((await request("/api/auth/login", "POST", { email: user.email, password: "WrongPass1" })).status, 401);
  assert.ok(user.lockUntil > new Date()); assert.equal(user.lockUntil - Date.now() <= 15 * 60 * 1000, true);
  assert.equal((await request("/api/auth/login", "POST", { email: user.email, password: "StrongPass1" })).status, 423);
  user.lockUntil = new Date(Date.now() - 1); user.failedLoginAttempts = 4;
  assert.equal((await request("/api/auth/login", "POST", { email: user.email, password: "StrongPass1" })).status, 200);
  assert.equal(user.failedLoginAttempts, 0); assert.equal(user.lockUntil, null);
});
