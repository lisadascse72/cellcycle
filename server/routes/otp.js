// backend/routes/otp.js

const express = require('express');
const nodemailer = require('nodemailer');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const router = express.Router();

// In-memory OTP storage for all OTP flows: signup, login, reset password
// Structure: { email: { otp: string, expiresAt: timestamp } }
const otpStore = {};

// Configure nodemailer transporter using Gmail SMTP and environment variables
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER, // Your Gmail address
    pass: process.env.EMAIL_PASS, // Your Gmail App Password or account password
  },
});

/**
 * 1. Send OTP for signup
 * - Check if email is provided and not already registered
 * - Generate 6-digit OTP, store with expiry (5 min)
 * - Send OTP email
 */
router.post('/send-signup', async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ message: 'Email required' });

  if (await User.findOne({ email })) {
    return res.status(409).json({ message: 'Email already registered' });
  }

  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  otpStore[email] = { otp, expiresAt: Date.now() + 5 * 60 * 1000 };

  try {
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: '🔐 CellCycle Signup OTP',
      text: `Your signup OTP is: ${otp} (valid for 5 minutes)`,
    });
    res.json({ message: '✅ OTP sent to email' });
  } catch (err) {
    console.error('Send signup OTP error:', err);
    res.status(500).json({ message: '❌ Failed to send OTP' });
  }
});

/**
 * 2. Verify OTP and create user for signup
 * - Check OTP validity & expiry
 * - Double-check user does not exist to prevent race conditions
 * - Save user (password hashed by Mongoose pre-save hook)
 * - Respond with JWT token and user info
 */
router.post('/verify-signup', async (req, res) => {
  const { name, email, phone, company, password, otp } = req.body;
  const record = otpStore[email];

  if (!record || record.otp !== otp) {
    return res.status(400).json({ message: 'Invalid OTP' });
  }
  if (record.expiresAt < Date.now()) {
    delete otpStore[email];
    return res.status(400).json({ message: 'OTP expired' });
  }

  if (await User.findOne({ email })) {
    return res.status(409).json({ message: 'Email already registered' });
  }

  try {
    const user = await new User({ name, email, phone, company, password }).save();

    delete otpStore[email];

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });

    res.status(201).json({
      message: '🎉 Signup successful',
      token,
      user: { id: user._id, name, email, phone, company },
    });
  } catch (err) {
    console.error('Signup error:', err);
    res.status(500).json({ message: 'Failed to create user' });
  }
});

/**
 * 3. Send OTP for password reset
 * - Check if email exists
 * - Generate OTP, store & send email
 */
router.post('/send-reset', async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ message: 'Email required' });

  const user = await User.findOne({ email });
  if (!user) return res.status(404).json({ message: 'User not found' });

  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  otpStore[email] = { otp, expiresAt: Date.now() + 5 * 60 * 1000 };

  try {
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: '🔐 CellCycle Reset Password OTP',
      text: `Your password reset OTP is: ${otp} (valid for 5 minutes)`,
    });
    res.json({ message: '✅ OTP sent to email' });
  } catch (err) {
    console.error('Send reset OTP error:', err);
    res.status(500).json({ message: 'Failed to send OTP' });
  }
});

/**
 * 4. Verify password reset OTP
 * - Check OTP and expiry
 */
router.post('/verify-reset-otp', (req, res) => {
  const { email, otp } = req.body;
  const record = otpStore[email];

  if (!record || record.otp !== otp) {
    return res.status(400).json({ message: 'Invalid OTP' });
  }
  if (record.expiresAt < Date.now()) {
    delete otpStore[email];
    return res.status(400).json({ message: 'OTP expired' });
  }

  res.json({ message: 'OTP verified' });
});

/**
 * 5. Reset password
 * - Find user, set new password (hashed automatically)
 * - Clear OTP
 */
router.post('/reset-password', async (req, res) => {
  const { email, newPassword } = req.body;
  const user = await User.findOne({ email });

  if (!user) return res.status(404).json({ message: 'User not found' });

  try {
    user.password = newPassword;
    await user.save();

    delete otpStore[email];

    res.json({ message: 'Password reset successful' });
  } catch (err) {
    console.error('Reset password error:', err);
    res.status(500).json({ message: 'Failed to reset password' });
  }
});

/**
 * 6. Send OTP for login
 * - Check if user exists
 * - Generate OTP, store, send email
 */
router.post('/send', async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ message: 'Email required' });

  const user = await User.findOne({ email });
  if (!user) return res.status(404).json({ message: 'User not found' });

  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  otpStore[email] = { otp, expiresAt: Date.now() + 5 * 60 * 1000 };

  try {
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: '🔐 CellCycle Login OTP',
      text: `Your login OTP is: ${otp} (valid for 5 minutes)`,
    });
    res.json({ message: '✅ OTP sent to email' });
  } catch (err) {
    console.error('Send login OTP error:', err);
    res.status(500).json({ message: '❌ Failed to send OTP' });
  }
});

/**
 * 7. Verify OTP and login
 * - Check OTP and expiry
 * - If valid, return JWT token + user info
 */
router.post('/verify', async (req, res) => {
  const { email, otp } = req.body;
  const record = otpStore[email];

  if (!record || record.otp !== otp) {
    return res.status(400).json({ message: 'Invalid OTP' });
  }
  if (record.expiresAt < Date.now()) {
    delete otpStore[email];
    return res.status(400).json({ message: 'OTP expired' });
  }

  const user = await User.findOne({ email });
  if (!user) return res.status(404).json({ message: 'User not found' });

  delete otpStore[email];

  const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });

  res.json({
    message: '🎉 Login successful via OTP',
    token,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      company: user.company,
      profilePic: user.profilePic || null,
    },
  });
});

module.exports = router;
