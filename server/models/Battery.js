const mongoose = require('mongoose');

const BatterySchema = new mongoose.Schema({
  type: {
    type: String,
    required: true,
  },
  capacity_kWh: {
    type: Number,
    required: true,
  },
  health: {
    type: Number,
    required: true,
  },
  cycles: {
    type: Number,
    required: true,
  },
  status: {
    type: String,
    enum: ['in-use', 'second-life', 'end-of-life'],
    default: 'in-use',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Battery', BatterySchema);
