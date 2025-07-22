const mongoose = require('mongoose');

// 🔋 Sensor Data Subdocument Schema
const sensorDataSchema = new mongoose.Schema({
  voltage: { type: Number },
  current: { type: Number },
  temperature: { type: Number },
  cycles: { type: Number, required: true },
  timestamp: { type: Date }
});

// 📦 Main Battery Schema
const BatterySchema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
    unique: true
  },
  type: {
    type: String,
    required: true
  },
  capacity_kWh: {
    type: Number,
    required: true
  },
  health: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    enum: ['in-use', 'second-life', 'end-of-life'],
    default: 'in-use'
  },
  sensorData: [sensorDataSchema] // ✅ Store all sensor logs
}, {
  timestamps: true
});

module.exports = mongoose.model('Battery', BatterySchema);
