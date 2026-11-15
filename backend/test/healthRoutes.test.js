const { test } = require("node:test");
const assert = require("node:assert/strict");
const express = require("express");
const createHealthRouter = require("../src/routes/healthRoutes");

test("readiness endpoint reports database state for availability probes", async () => {
  let readyState = 1;
  const app = express();
  app.use("/api/health", createHealthRouter(() => readyState));
  const server = app.listen(0, "127.0.0.1");
  await new Promise(resolve => server.once("listening", resolve));
  const url = `http://127.0.0.1:${server.address().port}/api/health`;
  try {
    const ready = await fetch(url);
    assert.equal(ready.status, 200);
    assert.deepEqual(await ready.json(), { status: "OK", database: "connected" });
    readyState = 0;
    const unavailable = await fetch(url);
    assert.equal(unavailable.status, 503);
    assert.deepEqual(await unavailable.json(), { status: "NOT_READY", database: "disconnected" });
  } finally {
    await new Promise(resolve => server.close(resolve));
  }
});
