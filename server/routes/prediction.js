// server/routes/prediction.js
const express = require("express");
const router = express.Router();
const Prediction = require("../models/Prediction");

// 🧠 Check if prediction exists for a battery
router.get("/:id", async (req, res) => {
  try {
    const exists = await Prediction.exists({ batteryId: req.params.id });
    res.json({ exists: !!exists });
  } catch (err) {
    console.error("Prediction check error:", err.message);
    res.status(500).json({ error: "Failed to check prediction" });
  }
});

module.exports = router;
