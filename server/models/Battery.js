const mongoose = require('mongoose');

// 🔋 Sensor Data Subdocument Schema
const sensorDataSchema = new mongoose.Schema({
  voltage: { type: Number },
  current: { type: Number },
  temperature: { type: Number },
  cycles: { type: Number, required: true },
  timestamp: { type: Date, default: Date.now }
});

// 📦 Main Battery Schema
const BatterySchema = new mongoose.Schema({
  id: {
    type: String,
    required: false, // ✅ Now optional
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
  sensorData: [sensorDataSchema]
}, {
  timestamps: true
});

// ✅ Auto-generate battery ID if not provided
BatterySchema.pre('save', async function (next) {
  if (!this.id) {
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    this.id = `BATT-${randomNum}`;
  }
  next();
});

module.exports = mongoose.model('Battery', BatterySchema);
