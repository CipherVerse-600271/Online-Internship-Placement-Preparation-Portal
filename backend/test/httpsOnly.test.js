const { test } = require("node:test");
const assert = require("node:assert/strict");
const express = require("express");
const httpsOnly = require("../src/middleware/httpsOnly");

test("production API redirects safe HTTP requests and rejects unsafe HTTP requests", async () => {
  const previous = process.env.NODE_ENV;
  process.env.NODE_ENV = "production";
  const app = express();
  app.use(httpsOnly);
  app.get("/api/health", (_req, res) => res.json({ status: "OK" }));
  app.post("/api/login", (_req, res) => res.json({ ok: true }));
  const server = app.listen(0, "127.0.0.1");
  await new Promise(resolve => server.once("listening", resolve));
  const base = `http://127.0.0.1:${server.address().port}`;
  try {
    const get = await fetch(`${base}/api/health`, { redirect: "manual" });
    assert.equal(get.status, 308);
    assert.equal(get.headers.get("location"), `https://127.0.0.1:${server.address().port}/api/health`);
    const post = await fetch(`${base}/api/login`, { method: "POST" });
    assert.equal(post.status, 426);
  } finally {
    await new Promise(resolve => server.close(resolve));
    if (previous === undefined) delete process.env.NODE_ENV;
    else process.env.NODE_ENV = previous;
  }
});
