// server/routes/otp.js
const express = require('express');
const nodemailer = require('nodemailer');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const router = express.Router();

// Temporary in-memory OTP store
const otpStore = {}; // { email: { otp: '123456', verified: true } }

// -----------------------------
// 1. Send OTP for Reset
// -----------------------------
router.post('/send-reset', async (req, res) => {
  const { email } = req.body;

  const user = await User.findOne({ email });
  if (!user) return res.status(404).json({ message: 'User not found' });

  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  otpStore[email] = { otp, verified: false };

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
    text: `Your OTP is: ${otp}\n\nValid for 5 minutes.`,
  };

  try {
    await transporter.sendMail(mailOptions);
    res.status(200).json({ message: '✅ OTP sent to email' });
  } catch (error) {
    res.status(500).json({ message: '❌ Failed to send OTP' });
  }
});

// -----------------------------
// 2. Verify OTP
// -----------------------------
router.post('/verify-reset-otp', (req, res) => {
  const { email, otp } = req.body;
  const entry = otpStore[email];

  if (!entry) return res.status(400).json({ message: 'OTP not found for this email' });
  if (entry.otp !== otp.toString()) {
    return res.status(401).json({ message: 'Invalid OTP' });
  }

  otpStore[email].verified = true;
  res.status(200).json({ message: '✅ OTP verified. You can reset your password now.' });
});

// -----------------------------
// 3. Reset Password (After Verification)
// -----------------------------
router.post('/reset-password', async (req, res) => {
  const { email, newPassword } = req.body;
  const entry = otpStore[email];

  if (!entry || !entry.verified) {
    return res.status(403).json({ message: '❌ OTP not verified or expired' });
  }

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: 'User not found' });

    // ✅ Let Mongoose pre('save') hook hash the password
    user.password = newPassword;
    await user.save();

    delete otpStore[email];

    res.status(200).json({ message: '✅ Password reset successful. Please login.' });
  } catch (error) {
    console.error('Reset error:', error.message);
    res.status(500).json({ message: '❌ Failed to reset password', error: error.message });
  }
});

module.exports = router;
