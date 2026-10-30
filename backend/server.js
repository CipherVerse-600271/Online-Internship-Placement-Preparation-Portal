
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Internship routes
const internshipRoutes = require("./routes/internshipRoutes");
const aptitudeRoutes = require("./routes/aptitudeRoutes");
app.use("/api/internships", internshipRoutes);
app.use("/api/aptitude", aptitudeRoutes);

// Home route
app.get("/", (req, res) => {
  res.json({
    message: "Internship Portal Backend is running!",
  });
});

// Health check
app.get("/api/health", (req, res) => {
  res.json({
    server: "running",
    database:
      mongoose.connection.readyState === 1
        ? "connected"
        : "disconnected",
  });
});

// Start server
const PORT = process.env.PORT || 5000;

async function startServer() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("MongoDB connected successfully!");

    app.listen(PORT, () => {
      console.log(`Backend running at http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("Failed to connect to MongoDB:", error.message);
    process.exit(1);
  }
}

startServer();
