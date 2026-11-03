const express = require("express");
const Notification = require("../models/Notification");
const { protect, authorize } = require("../src/middleware/authMiddleware");

const router = express.Router();

// Students can only see notifications addressed to their own account.
router.get("/", protect, authorize("student"), async (req, res) => {
  try {
    const notifications = await Notification.find({ student: req.user._id })
      .populate({ path: "application", select: "status createdAt" })
      .sort({ createdAt: -1 });
    res.json(notifications);
  } catch (error) {
    res.status(500).json({ message: "Unable to retrieve notifications." });
  }
});

router.patch("/:id/read", protect, authorize("student"), async (req, res) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, student: req.user._id },
      { read: true },
      { new: true }
    );
    if (!notification) return res.status(404).json({ message: "Notification not found." });
    res.json(notification);
  } catch (error) {
    res.status(400).json({ message: "Unable to update notification." });
  }
});

module.exports = router;
