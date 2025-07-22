const mongoose = require('mongoose');

const PredictionSchema = new mongoose.Schema({
  batteryId: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
  soh: { type: Number, required: true },
  shap: { type: Object },
  recommendation: { type: String },
  voltage: { type: Number },
  temperature: { type: Number },
  cycles: { type: Number }
});

module.exports = mongoose.model('Prediction', PredictionSchema);
