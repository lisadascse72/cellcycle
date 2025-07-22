// server/index.js
require('dotenv').config(); // Load environment variables
const express = require('express');
const cors = require('cors');
const connectDB = require('./db');
const Battery = require('./models/Battery');

// Initialize Express App
const app = express();
const PORT = process.env.PORT || 5000;

// =======================
// Connect to MongoDB
// =======================
connectDB();

// =======================
// Middleware
// =======================
app.use(cors());
app.use(express.json());

// =======================
// Routes
// =======================

// Root Health Check
app.get('/', (req, res) => {
  res.send('🔋 CellCycle API is running');
});

// Auth Routes
const authRoutes = require('./routes/auth');
app.use('/api/auth', authRoutes);

// OTP Routes
const otpRoutes = require('./routes/otp');
app.use('/api/otp', otpRoutes);

// Battery AI/Test Routes
const batteryRoutes = require('./routes/battery');
app.use('/api/battery', batteryRoutes); // ✅ Must come AFTER require()

// Battery CRUD Routes (Manually defined below)
app.post('/api/batteries', async (req, res) => {
  try {
    const battery = new Battery(req.body);
    await battery.save();

    res.status(201).json({
      message: '✅ Battery added successfully',
      battery,
    });
  } catch (error) {
    console.error('❌ Error in POST /api/batteries:', error.message);
    res.status(500).json({
      message: 'Failed to add battery',
      error: error.message,
    });
  }
});

app.get('/api/batteries', async (req, res) => {
  try {
    const batteries = await Battery.find();
    res.json(batteries);
  } catch (error) {
    console.error('❌ Error in GET /api/batteries:', error.message);
    res.status(500).json({
      message: 'Failed to fetch batteries',
      error: error.message,
    });
  }
});

app.delete('/api/batteries/:id', async (req, res) => {
  try {
    const deletedBattery = await Battery.findByIdAndDelete(req.params.id);

    if (!deletedBattery) {
      return res.status(404).json({ message: 'Battery not found' });
    }

    res.json({ message: '🗑️ Battery deleted successfully' });
  } catch (error) {
    console.error('❌ Error in DELETE /api/batteries/:id:', error.message);
    res.status(500).json({
      message: 'Failed to delete battery',
      error: error.message,
    });
  }
});

app.put('/api/batteries/:id', async (req, res) => {
  try {
    const updatedBattery = await Battery.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );

    if (!updatedBattery) {
      return res.status(404).json({ message: 'Battery not found' });
    }

    res.json({
      message: '♻️ Battery updated successfully',
      battery: updatedBattery,
    });
  } catch (error) {
    console.error('❌ Error in PUT /api/batteries/:id:', error.message);
    res.status(500).json({
      message: 'Failed to update battery',
      error: error.message,
    });
  }
});

// =======================
// Start the Server
// =======================
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
