const express = require('express');
const nodemailer = require('nodemailer');
const jwt = require('jsonwebtoken');
const router = express.Router();
const User = require('../models/User');

// In-memory OTP store (temporary)
const otpStore = {};

// =========================
// POST: Send OTP to email
// =========================
router.post('/send', async (req, res) => {
  const { email } = req.body;

  if (!email || !email.includes('@')) {
    return res.status(400).json({ message: 'Valid email is required' });
  }

  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  otpStore[email] = otp;

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
    text: `Your OTP for login is: ${otp}\n\nThis OTP is valid for 5 minutes.`,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`✅ OTP sent to ${email}: ${otp}`);
    res.status(200).json({ message: '✅ OTP sent successfully to your email.' });
  } catch (error) {
    console.error('❌ Failed to send OTP email:', error.message);
    res.status(500).json({ message: '❌ Failed to send OTP. Please try again later.' });
  }
});

// =========================
// POST: Verify OTP
// =========================
router.post('/verify', async (req, res) => {
  const { email, otp } = req.body;

  if (!email || !otp) {
    return res.status(400).json({ message: 'Email and OTP are required' });
  }

  const validOtp = otpStore[email];

  if (validOtp !== otp) {
    return res.status(401).json({ message: '❌ Invalid OTP. Please try again.' });
  }

  // Clear OTP once verified
  delete otpStore[email];

  try {
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: '⚠️ No user found. Please sign up first.' });
    }

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: '1h',
    });

    res.status(200).json({
      message: '✅ OTP verified. Logged in successfully.',
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
    console.error('❌ OTP verification error:', error.message);
    res.status(500).json({ message: 'Server error during OTP verification' });
  }
});

module.exports = router;
