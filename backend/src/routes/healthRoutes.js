const express = require("express");
const mongoose = require("mongoose");

const createHealthRouter = (getReadyState = () => mongoose.connection.readyState) => {
  const router = express.Router();
  router.get("/", (_req, res) => {
    const ready = getReadyState() === 1;
    res.status(ready ? 200 : 503).json({ status: ready ? "OK" : "NOT_READY", database: ready ? "connected" : "disconnected" });
  });
  return router;
};

module.exports = createHealthRouter;
