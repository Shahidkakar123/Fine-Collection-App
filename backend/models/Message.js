const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  senderId:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  receiverId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null }, // null = broadcast
  senderName: { type: String, required: true },
  content:    { type: String, required: true, maxlength: 2000 },
  isBroadcast:{ type: Boolean, default: false },
  readBy:     [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }], // tracks who has read
}, { timestamps: true });

messageSchema.index({ senderId: 1, receiverId: 1 });
messageSchema.index({ isBroadcast: 1 });

module.exports = mongoose.model('Message', messageSchema);