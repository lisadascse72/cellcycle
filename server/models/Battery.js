const mongoose = require('mongoose');

// 🔋 Sensor Data Subdocument Schema
const sensorDataSchema = new mongoose.Schema({
  voltage: { type: Number },
  current: { type: Number },
  temperature: { type: Number },
  cycles: { type: Number, required: true },
  ambient_temperature: { type: Number }, // ✅ Added for NASA dataset
  Re: { type: Number },                  // ✅ Added for NASA dataset
  Rct: { type: Number },                 // ✅ Added for NASA dataset
  timestamp: { type: Date, default: Date.now }
});

// 📦 Main Battery Schema
const BatterySchema = new mongoose.Schema({
  id: {
    type: String,
    unique: true
  },
  type: { type: String, required: true },
  capacity_kWh: { type: Number, required: true },
  health: { type: Number, required: true },
  status: {
    type: String,
    enum: ['in-use', 'second-life', 'end-of-life'],
    default: 'in-use'
  },
  chemistry: String,
  nominal_voltage: Number,
  max_voltage: Number,
  c_rate: String,
  internal_resistance: Number,
  rated_lifecycle: Number,
  cell_config: String,
  degradation_curve: String,
  optimal_temp_range: String,
  thermal_runaway_point: String,
  charge_history: String,
  dod_log: String,
  voltage_log: String,
  calendar_age: Number,
  thermal_events: String,
  past_soh_soc: String,
  fault_flags: String,
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
