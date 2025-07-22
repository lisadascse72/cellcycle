const express = require("express");
const router = express.Router();
const Battery = require("../models/Battery");
const Prediction = require("../models/Prediction");
const { spawn } = require("child_process");
const path = require("path");
const say = require("say");
const PDFDocument = require("pdfkit");
const fs = require("fs");

// 🔢 Generate Battery ID
function generateBatteryId() {
  return `BATT-${Math.floor(1000 + Math.random() * 9000)}`;
}

// =======================================
// 🔋 GET /api/battery/:id/soh/explain
// =======================================
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
      cycles: latest.cycles,
    };

    const pythonScript = path.join(__dirname, "../../ml-engine/explain_soh.py");
    const process = spawn("python", [pythonScript, JSON.stringify(features)]);

    let result = "";
    let errorOutput = "";

    process.stdout.on("data", (data) => {
      result += data.toString();
    });

    process.stderr.on("data", (data) => {
      errorOutput += data.toString();
    });

    process.on("close", async (code) => {
      if (code !== 0) {
        console.error("Python Error:", errorOutput);
        return res.status(500).json({ error: errorOutput });
      }

      try {
        const parsed = JSON.parse(result);
        const soh = parsed.prediction;

        let recommendation = "";
        if (soh < 60) {
          recommendation = "Battery end-of-life. Immediate recycling recommended.";
          say.speak(`⚠️ Alert. Battery ${req.params.id} health is critically low at ${Math.round(soh)} percent. Please recycle it.`);
        } else if (soh < 75) {
          recommendation = "Battery suitable for second-life use such as solar backup.";
        } else {
          recommendation = "Battery is healthy. No immediate action required.";
        }

        const predictionEntry = new Prediction({
          batteryId: req.params.id,
          soh,
          shap: parsed.shap,
          recommendation,
          voltage: latest.voltage,
          temperature: latest.temperature,
          cycles: latest.cycles,
        });

        await predictionEntry.save();

        res.status(200).json({
          prediction: soh,
          shap: parsed.shap,
          recommendation,
        });
      } catch (err) {
        console.error("JSON Parse Error:", err.message);
        return res.status(500).json({ error: "Failed to parse Python output" });
      }
    });
  } catch (err) {
    console.error("Server Error:", err.message);
    return res.status(500).json({ error: err.message });
  }
});

// ===================================
// 🔊 GET /api/battery/:id/speak-latest
// ===================================
router.get("/:id/speak-latest", async (req, res) => {
  try {
    const prediction = await Prediction.findOne({ batteryId: req.params.id }).sort({ createdAt: -1 });

    if (!prediction) {
      return res.status(404).json({ message: "No prediction found for this battery" });
    }

    const { soh, recommendation } = prediction;
    const spokenText = `Battery ${req.params.id} has a health of ${Math.round(soh)} percent. ${recommendation}`;
    say.speak(spokenText);

    return res.status(200).json({
      message: "🔊 Speaking latest prediction...",
      spokenText,
    });
  } catch (error) {
    console.error("TTS Error:", error.message);
    return res.status(500).json({
      message: "Failed to speak latest prediction",
      error: error.message,
    });
  }
});

// ===================================
// ✅ POST /api/batteries
// ===================================
router.post("/", async (req, res) => {
  try {
    const data = req.body;

    if (!data.id) {
      data.id = generateBatteryId();
    }

    const battery = new Battery(data);
    const saved = await battery.save();

    res.status(201).json({ message: "Battery created", battery: saved });
  } catch (err) {
    console.error("Battery creation failed:", err.message);
    res.status(500).json({ error: "Battery creation failed" });
  }
});

// ===================================
// 📄 GET /api/battery/:id/soh/report
// ===================================
router.get("/:id/soh/report", async (req, res) => {
  try {
    const prediction = await Prediction.findOne({ batteryId: req.params.id }).sort({ createdAt: -1 });

    if (!prediction) {
      return res.status(404).json({ message: "No prediction available to generate report" });
    }

    const doc = new PDFDocument();
    const filename = `SoH_Report_${req.params.id}.pdf`;

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    doc.pipe(res);

    doc.fontSize(20).text(`Battery Report - ${req.params.id}`, { underline: true });
    doc.moveDown();
    doc.fontSize(14).text(`State of Health: ${prediction.soh.toFixed(2)}%`);
    doc.text(`Recommendation: ${prediction.recommendation}`);
    doc.text(`Voltage: ${prediction.voltage} V`);
    doc.text(`Temperature: ${prediction.temperature} °C`);
    doc.text(`Charge Cycles: ${prediction.cycles}`);
    doc.moveDown();
    doc.fontSize(12).text(`Generated At: ${new Date().toLocaleString()}`);
    doc.end();
  } catch (err) {
    console.error("PDF Error:", err.message);
    res.status(500).json({ message: "Failed to generate PDF", error: err.message });
  }
});

// ===================================
// 🔍 GET /api/battery/predictions/:id
// Check if prediction exists
// ===================================
router.get("/predictions/:id", async (req, res) => {
  try {
    const prediction = await Prediction.findOne({ batteryId: req.params.id }).sort({ createdAt: -1 });
    res.status(200).json({ exists: !!prediction });
  } catch (error) {
    res.status(500).json({ exists: false });
  }
});

module.exports = router;
