
const express = require("express");
const mongoose = require("mongoose");
const router = express.Router();

const Internship = require("../models/Internship");
const { protect, authorize } = require("../src/middleware/authMiddleware");

// Escape special characters before using user input in a regular expression.
const escapeRegex = (value) =>
  String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const cleanSkills = (skills) => {
  const values = Array.isArray(skills)
    ? skills
    : String(skills || "").split(",");

  return [...new Set(
    values.map((skill) => String(skill).trim()).filter(Boolean)
  )];
};

// #22: Search and filter internships.
router.get("/", async (req, res) => {
  try {
    const {
      search,
      skill,
      location,
      minStipend,
      maxStipend,
      duration,
    } = req.query;

    const filter = {};

    if (search && search.trim()) {
      const keyword = new RegExp(escapeRegex(search.trim()), "i");

      filter.$or = [
        { title: keyword },
        { company: keyword },
        { description: keyword },
        { skills: keyword },
      ];
    }

    if (skill && skill.trim()) {
      filter.skills = {
        $in: cleanSkills(skill).map(
          (item) => new RegExp(`^${escapeRegex(item)}$`, "i")
        ),
      };
    }

    if (location && location.trim()) {
      filter.location = {
        $regex: escapeRegex(location.trim()),
        $options: "i",
      };
    }

    if (duration && duration.trim()) {
      filter.duration = {
        $regex: escapeRegex(duration.trim()),
        $options: "i",
      };
    }

    if (minStipend !== undefined || maxStipend !== undefined) {
      filter.stipend = {};

      if (minStipend !== undefined && minStipend !== "") {
        const min = Number(minStipend);

        if (!Number.isFinite(min) || min < 0) {
          return res.status(400).json({
            message: "Minimum stipend must be a valid non-negative number.",
          });
        }

        filter.stipend.$gte = min;
      }

      if (maxStipend !== undefined && maxStipend !== "") {
        const max = Number(maxStipend);

        if (!Number.isFinite(max) || max < 0) {
          return res.status(400).json({
            message: "Maximum stipend must be a valid non-negative number.",
          });
        }

        filter.stipend.$lte = max;
      }

      if (
        filter.stipend.$gte !== undefined &&
        filter.stipend.$lte !== undefined &&
        filter.stipend.$gte > filter.stipend.$lte
      ) {
        return res.status(400).json({
          message: "Minimum stipend cannot exceed maximum stipend.",
        });
      }
    }

    const internships = await Internship.find(filter).sort({
      createdAt: -1,
    });

    res.json(internships);
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch internships.",
    });
  }
});

// #23: View details of a specific internship.
router.get("/:id", async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return res.status(400).json({
      message: "Invalid internship ID.",
    });
  }

  try {
    const internship = await Internship.findById(req.params.id);

    if (!internship) {
      return res.status(404).json({
        message: "Internship not found.",
      });
    }

    res.json(internship);
  } catch (error) {
    res.status(500).json({
      message: "Unable to retrieve internship details.",
    });
  }
});

// #21: Recruiter or admin can post an internship.
router.post(
  "/",
  protect,
  authorize("recruiter", "admin"),
  async (req, res) => {
    try {
      const {
        title,
        company,
        location,
        stipend,
        duration,
        description,
        skills,
        applyLink,
        deadline,
      } = req.body;

      const requiredFields = {
        title,
        company,
        location,
        stipend,
        duration,
        description,
      };

      const missingFields = Object.entries(requiredFields)
        .filter(
          ([, value]) =>
            value === undefined ||
            value === null ||
            String(value).trim() === ""
        )
        .map(([field]) => field);

      if (missingFields.length > 0) {
        return res.status(400).json({
          message: "Please complete all required fields.",
          missingFields,
        });
      }

      const stipendValue = Number(stipend);

      if (!Number.isFinite(stipendValue) || stipendValue < 0) {
        return res.status(400).json({
          message: "Stipend must be a valid non-negative number.",
        });
      }

      let deadlineValue = null;

      if (deadline) {
        deadlineValue = new Date(deadline);

        if (
          Number.isNaN(deadlineValue.getTime()) ||
          deadlineValue <= new Date()
        ) {
          return res.status(400).json({
            message: "Deadline must be a valid future date.",
          });
        }
      }

      let validatedApplyLink = "";

      if (applyLink) {
        try {
          const parsedUrl = new URL(applyLink);

          if (!["http:", "https:"].includes(parsedUrl.protocol)) {
            throw new Error("Invalid protocol");
          }

          validatedApplyLink = parsedUrl.toString();
        } catch {
          return res.status(400).json({
            message: "Application link must be a valid HTTP or HTTPS URL.",
          });
        }
      }

      const internship = await Internship.create({
        title: title.trim(),
        company: company.trim(),
        location: location.trim(),
        stipend: stipendValue,
        duration: duration.trim(),
        description: description.trim(),
        skills: cleanSkills(skills),
        applyLink: validatedApplyLink,
        deadline: deadlineValue,
        recruiter: req.user._id,
      });

      res.status(201).json({
        message: "Internship created successfully.",
        internship,
      });
    } catch (error) {
      res.status(400).json({
        message: "Failed to create internship.",
        error: error.message,
      });
    }
  }
);

module.exports = router;
