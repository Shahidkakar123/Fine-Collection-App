const mongoose = require('mongoose');

const itemSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'User' }, // Reference to User model
  name: { type: String, required: true }, // Employee name
  description: String,
  category: { type: String, required: true },
  value: { type: Number, required: true },
  status: { type: String, enum: ['paid', 'pending'], default: 'pending' },
});

module.exports = mongoose.model('Item', itemSchema);