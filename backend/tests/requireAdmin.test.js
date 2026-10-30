const test = require("node:test");
const assert = require("node:assert/strict");
const requireAdmin = require("../middleware/requireAdmin");

function response() {
  return {
    statusCode: 200,
    body: null,
    status(code) { this.statusCode = code; return this; },
    json(body) { this.body = body; return this; },
  };
}

test("rejects requests without an authenticated user", () => {
  const res = response();
  let nextCalled = false;
  requireAdmin({}, res, () => { nextCalled = true; });
  assert.equal(res.statusCode, 401);
  assert.equal(nextCalled, false);
});

test("rejects authenticated non-admin users", () => {
  const res = response();
  let nextCalled = false;
  requireAdmin({ user: { role: "student" } }, res, () => { nextCalled = true; });
  assert.equal(res.statusCode, 403);
  assert.equal(nextCalled, false);
});

test("allows administrator role regardless of case", () => {
  const res = response();
  let nextCalled = false;
  requireAdmin({ user: { role: "Admin" } }, res, () => { nextCalled = true; });
  assert.equal(nextCalled, true);
});
