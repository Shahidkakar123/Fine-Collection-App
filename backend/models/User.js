const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  phone: { type: String, required: false }, // Phone number for future SMS service
  role: { type: String, enum: ['pd', 'employee'], required: true, default: 'employee' },
  resetPasswordToken: { type: String, default: null }, // Token for password reset
  resetPasswordExpiry: { type: Date, default: null }, // Token expiry time (15 minutes)
  isActive: { type: Boolean, default: true }, // For soft delete when PD removes employee
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);