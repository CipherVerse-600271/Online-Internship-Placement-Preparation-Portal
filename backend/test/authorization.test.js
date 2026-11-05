const test = require("node:test");
const assert = require("node:assert/strict");
const { authorize } = require("../src/utils/authorization");
function responseRecorder() {
  return { statusCode: 200, body: null,
    status(code) { this.statusCode = code; return this; },
    json(body) { this.body = body; return this; } };
}
test("authorize returns 401 when no authenticated user is attached", () => {
  const res = responseRecorder(); let nextCalled = false;
  authorize("admin")({}, res, () => { nextCalled = true; });
  assert.equal(res.statusCode, 401);
  assert.equal(res.body.message, "Authentication required.");
  assert.equal(nextCalled, false);
});
test("authorize returns 403 when the user's role is not allowed", () => {
  const res = responseRecorder(); let nextCalled = false;
  authorize("admin")({ user: { role: "student" } }, res, () => { nextCalled = true; });
  assert.equal(res.statusCode, 403);
  assert.equal(res.body.message, "You are not authorized to access this resource.");
  assert.equal(nextCalled, false);
});
test("authorize calls next for an allowed role", () => {
  const res = responseRecorder(); let nextCalled = false;
  authorize("admin", "recruiter")({ user: { role: "admin" } }, res, () => { nextCalled = true; });
  assert.equal(nextCalled, true);
  assert.equal(res.body, null);
});
