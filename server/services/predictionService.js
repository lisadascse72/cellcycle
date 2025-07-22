const path = require("path");
const { spawn } = require("child_process");

const predictBatterySoH = (batteryId) => {
  return new Promise((resolve, reject) => {
    const scriptPath = path.join(__dirname, "../../ml-engine/explain_soh.py");

    const process = spawn("python", [scriptPath, batteryId]);

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
        reject(new Error(errorOutput || "Python script failed"));
      } else {
        try {
          const json = JSON.parse(result);
          resolve(json);
        } catch (err) {
          reject(new Error("Invalid JSON from Python"));
        }
      }
    });
  });
};

module.exports = { predictBatterySoH };
