
const express = require("express");
const router = express.Router();
const Internship = require("../models/Internship");
const { protect, authorize } = require("../src/middleware/authMiddleware");

// GET: Retrieve all internships
router.get("/", async (req, res) => {
  try {
    const internships = await Internship.find().sort({
      createdAt: -1,
    });

    res.json(internships);
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch internships",
      error: error.message,
    });
  }
});

// GET: Retrieve one internship by ID
router.get("/:id", async (req, res) => {
  try {
    const internship = await Internship.findById(req.params.id);

    if (!internship) {
      return res.status(404).json({
        message: "Internship not found",
      });
    }

    res.json(internship);
  } catch (error) {
    res.status(400).json({
      message: "Invalid internship ID",
    });
  }
});

// POST: Add a new internship
router.post("/", protect, authorize("recruiter", "admin"), async (req, res) => {
  try {
    const internship = await Internship.create(req.body);

    res.status(201).json({
      message: "Internship created successfully",
      internship,
    });
  } catch (error) {
    res.status(400).json({
      message: "Failed to create internship",
      error: error.message,
    });
  }
});

module.exports = router;
