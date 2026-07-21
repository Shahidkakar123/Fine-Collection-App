const mongoose = require('mongoose');

const presenceSchema = new mongoose.Schema({
  userId:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  username:  { type: String, required: true },
  isOnline:  { type: Boolean, default: false },
  lastSeen:  { type: Date, default: Date.now },
}, { timestamps: true });

module.exports = mongoose.model('Presence', presenceSchema);