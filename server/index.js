require('dotenv').config(); // Load variables from .env
const express = require('express');
const cors = require('cors');
const connectDB = require('./db');
const Battery = require('./models/Battery');

// Connect to DB
connectDB();

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 5000;

// Test route
app.get('/', (req, res) => {
  res.send('CellCycle API is running');
});

// POST a new battery
app.post('/api/batteries', async (req, res) => {
  try {
    const battery = new Battery(req.body);
    await battery.save();
    res.status(201).json({
      message: 'Battery added successfully',
      battery,
    });
  } catch (error) {
    console.error('❌ Error in POST /api/batteries:', error);
    res.status(500).json({
      message: 'Failed to add battery',
      error: error.message,
    });
  }
});

// GET all batteries
app.get('/api/batteries', async (req, res) => {
  try {
    console.log('🔍 Fetching batteries from DB...');
    const batteries = await Battery.find();
    console.log('✅ Batteries fetched:', batteries.length);
    res.json(batteries);
  } catch (error) {
    console.error('❌ Error in GET /api/batteries:', error);
    res.status(500).json({
      message: 'Failed to fetch batteries',
      error: error.message,
    });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Server listening on port ${PORT}`);
});
