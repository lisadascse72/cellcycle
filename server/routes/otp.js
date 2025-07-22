// backend/routes/otp.js
const express = require('express');
const nodemailer = require('nodemailer');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/User');

const router = express.Router();

// In-memory store: { email: { otp: '123456' } }
const otpStore = {};

// =========================
// Send OTP for Signup or Login
// =========================
router.post('/send', async (req, res) => {
  const { email } = req.body;

  if (!email || !email.includes('@')) {
    return res.status(400).json({ message: 'Valid email is required' });
  }

  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  otpStore[email] = { otp }; // Save OTP

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: '🔐 Your CellCycle OTP Code',
    text: `Your OTP code is: ${otp}\n\nValid for 5 minutes.`,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`✅ OTP sent to ${email}: ${otp}`);
    res.status(200).json({ message: '✅ OTP sent to email.' });
  } catch (error) {
    console.error('❌ OTP send error:', error.message);
    res.status(500).json({ message: '❌ Failed to send OTP.' });
  }
});

// =========================
// Verify OTP for login (already exists)
// =========================
router.post('/verify', async (req, res) => {
  const { email, otp } = req.body;
  if (!email || !otp) return res.status(400).json({ message: 'Email and OTP required' });

  const entry = otpStore[email];
  if (!entry || entry.otp !== otp) {
    return res.status(401).json({ message: '❌ Invalid OTP' });
  }

  delete otpStore[email];

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: 'User not found' });

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: '1h',
    });

    res.status(200).json({
      message: '✅ OTP verified. Login successful.',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        company: user.company,
        profilePic: user.profilePic,
      },
    });
  } catch (error) {
    console.error('❌ OTP login error:', error.message);
    res.status(500).json({ message: 'Server error during OTP login' });
  }
});


// =========================
// Forgot Password OTP: SEND
// =========================
router.post('/send-reset', async (req, res) => {
  const { email } = req.body;

  const user = await User.findOne({ email });
  if (!user) return res.status(404).json({ message: 'User not found' });

  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  otpStore[email] = { otp };

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: '🔐 Reset Your Password - CellCycle',
    text: `Your OTP for password reset is: ${otp}\n\nIt is valid for 5 minutes.`,
  };

  try {
    await transporter.sendMail(mailOptions);
    res.status(200).json({ message: 'OTP sent for password reset' });
  } catch (error) {
    console.error('Reset OTP send error:', error.message);
    res.status(500).json({ message: 'Failed to send OTP' });
  }
});

// =========================
// Forgot Password OTP: VERIFY + RESET
// =========================
router.post('/verify-reset', async (req, res) => {
  const { email, otp, newPassword } = req.body;

  const entry = otpStore[email];
  if (!entry || entry.otp !== otp) {
    return res.status(401).json({ message: 'Invalid or expired OTP' });
  }

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: 'User not found' });

    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();

    delete otpStore[email];

    res.status(200).json({ message: 'Password reset successful. Please login.' });
  } catch (err) {
    res.status(500).json({ message: 'Password reset failed', error: err.message });
  }
});

module.exports = router;
