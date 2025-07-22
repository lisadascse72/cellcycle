// backend/models/User.js
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },

  // 👇 Made `phone` optional (was causing reset password to fail)
  phone: { type: String, required: false },  

  password: { type: String, required: true },
  company: { type: String, default: 'CellCycle Inc.' },
  profilePic: { type: String, default: '' }
});

// 🔒 Hash password only when modified (signup or password reset)
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

module.exports = mongoose.model('User', userSchema);
