const express = require("express");
const router = express.Router();
const Battery = require("../models/Battery");
const { spawn } = require("child_process");
const path = require("path");
const say = require("say"); // 🔊 Text-to-speech

// 🔋 Explainability route with TTS + recommendation
router.get("/:id/soh/explain", async (req, res) => {
  try {
    const battery = await Battery.findOne({ id: req.params.id });

    if (!battery || !battery.sensorData || battery.sensorData.length === 0) {
      return res.status(404).json({ error: "Battery data not found" });
    }

    const latest = battery.sensorData[battery.sensorData.length - 1];

    const features = {
      voltage: latest.voltage,
      temperature: latest.temperature,
      cycles: latest.cycles
    };

    const pythonScript = path.join(__dirname, "../../ml-engine/explain_soh.py");

    const process = spawn("python", [
      pythonScript,
      JSON.stringify(features)
    ]);

    let result = "";
    let errorOutput = "";

    process.stdout.on("data", (data) => {
      result += data.toString();
    });

    process.stderr.on("data", (data) => {
      errorOutput += data.toString();
    });

    process.on("close", (code) => {
      if (code !== 0) {
        console.error("Python Error:", errorOutput);
        return res.status(500).json({ error: errorOutput });
      }

      try {
        const parsed = JSON.parse(result);
        const soh = parsed.prediction;

        // ✅ Add recommendation logic
        let recommendation = "";
        if (soh < 60) {
          recommendation = "Battery end-of-life. Immediate recycling recommended.";
        } else if (soh < 75) {
          recommendation = "Battery suitable for second-life use such as solar backup.";
        } else {
          recommendation = "Battery is healthy. No immediate action required.";
        }

        // ✅ Speak critical alerts only
        if (soh < 60) {
          say.speak(`Alert. Battery ${req.params.id} is degraded to ${Math.round(soh)} percent. Recycling is advised.`);
        }

        res.json({
          prediction: soh,
          shap: parsed.shap,
          recommendation
        });
      } catch (e) {
        console.error("Parse error:", e.message);
        res.status(500).json({ error: "Failed to parse Python output" });
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
