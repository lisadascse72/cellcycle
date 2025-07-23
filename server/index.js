// server/index.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./db');
const Battery = require('./models/Battery');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 5000;

connectDB();

app.use(cors());
app.use(express.json());

// Root
app.get('/', (req, res) => {
  res.send('🔋 CellCycle API is running');
});

// Auth & OTP
const authRoutes = require('./routes/auth');
app.use('/api/auth', authRoutes);

const otpRoutes = require('./routes/otp');
app.use('/api/otp', otpRoutes);

// Battery Routes
const batteryRoutes = require('./routes/battery');
app.use('/api/battery', batteryRoutes);

// Battery CRUD
app.post('/api/batteries', async (req, res) => {
  try {
    const battery = new Battery(req.body);
    await battery.save();
    res.status(201).json({ message: '✅ Battery added successfully', battery });
  } catch (error) {
    console.error('❌ POST /api/batteries:', error.message);
    res.status(500).json({ message: 'Failed to add battery', error: error.message });
  }
});

app.get('/api/batteries', async (req, res) => {
  try {
    const batteries = await Battery.find();
    res.json(batteries);
  } catch (error) {
    console.error('❌ GET /api/batteries:', error.message);
    res.status(500).json({ message: 'Failed to fetch batteries', error: error.message });
  }
});

app.delete('/api/batteries/:id', async (req, res) => {
  try {
    const deletedBattery = await Battery.findByIdAndDelete(req.params.id);
    if (!deletedBattery) return res.status(404).json({ message: 'Battery not found' });
    res.json({ message: '🗑️ Battery deleted successfully' });
  } catch (error) {
    console.error('❌ DELETE /api/batteries/:id:', error.message);
    res.status(500).json({ message: 'Failed to delete battery', error: error.message });
  }
});

app.put('/api/batteries/:id', async (req, res) => {
  try {
    const updatedBattery = await Battery.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updatedBattery) return res.status(404).json({ message: 'Battery not found' });
    res.json({ message: '♻️ Battery updated successfully', battery: updatedBattery });
  } catch (error) {
    console.error('❌ PUT /api/batteries/:id:', error.message);
    res.status(500).json({ message: 'Failed to update battery', error: error.message });
  }
});

// ✅ Digital Twin: Changed route to match frontend
const twinDataPath = path.join(__dirname, '..', 'datasets', 'sample_battery.json');
let twinData = [];
let twinIndex = 0;

if (fs.existsSync(twinDataPath)) {
  const rawData = fs.readFileSync(twinDataPath, 'utf-8');
  twinData = JSON.parse(rawData);
} else {
  console.warn('⚠️ sample_battery.json not found in /datasets');
}

app.get('/api/battery/next-reading', (req, res) => {
  if (!twinData.length) {
    return res.status(500).json({ error: 'No battery data available' });
  }

  const reading = twinData[twinIndex];
  twinIndex = (twinIndex + 1) % twinData.length;
  res.json(reading);
});

// Start
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
