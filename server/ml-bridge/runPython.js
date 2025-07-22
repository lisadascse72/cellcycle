// server/ml-bridge/runPython.js
const { spawn } = require("child_process");

const runPythonScript = (scriptName, inputData) => {
  return new Promise((resolve, reject) => {
    const python = spawn("python3", [`ml-engine/${scriptName}`, JSON.stringify(inputData)]);

    let output = "";
    let error = "";

    python.stdout.on("data", (data) => {
      output += data.toString();
    });

    python.stderr.on("data", (data) => {
      error += data.toString();
    });

    python.on("close", (code) => {
      if (code !== 0 || error) {
        return reject(`Python error: ${error || `Exit code ${code}`}`);
      }
      try {
        const result = JSON.parse(output);
        resolve(result);
      } catch (e) {
        reject(`JSON parse error: ${output}`);
      }
    });
  });
};

module.exports = runPythonScript;
