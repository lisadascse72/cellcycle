require('dotenv').config(); // Load .env variables
const express = require('express');
const cors = require('cors');
const connectDB = require('./db');
const Battery = require('./models/Battery');

// Connect to MongoDB
connectDB();

const app = express();
const PORT = process.env.PORT || 5000;

// =======================
// Middleware
// =======================
app.use(cors());
app.use(express.json());

// =======================
// Base Route
// =======================
app.get('/', (req, res) => {
  res.send('🔋 CellCycle API is running');
});

// =======================
// POST: Add New Battery
// =======================
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

// =======================
// GET: All Batteries
// =======================
app.get('/api/batteries', async (req, res) => {
  try {
    console.log('🔍 Fetching all batteries...');
    const batteries = await Battery.find();
    console.log(`✅ Found ${batteries.length} batteries`);
    res.json(batteries);
  } catch (error) {
    console.error('❌ Error in GET /api/batteries:', error.message);
    res.status(500).json({
      message: 'Failed to fetch batteries',
      error: error.message,
    });
  }
});

// =======================
// DELETE: Battery by ID
// =======================
app.delete('/api/batteries/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const deletedBattery = await Battery.findByIdAndDelete(id);

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

// =======================
// PUT: Update Battery by ID
// =======================
app.put('/api/batteries/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updatedBattery = await Battery.findByIdAndUpdate(id, req.body, { new: true });

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
