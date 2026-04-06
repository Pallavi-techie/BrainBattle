const mongoose = require('mongoose');

const roomSchema = new mongoose.Schema({
  name:      { type: String, required: true, trim: true },
  type:      { type: String, enum: ['fun', 'study'], default: 'fun' },
  isPublic:  { type: Boolean, default: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  members:   [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  isActive:  { type: Boolean, default: false },
}, { timestamps: true });

module.exports = mongoose.model('Room', roomSchema);
