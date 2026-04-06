const mongoose = require('mongoose');

const studyCircleSchema = new mongoose.Schema({
  name:       { type: String, required: true, trim: true },
  school:     { type: String, required: true },
  class:      { type: Number, required: true, min: 1, max: 12 },
  board:      { type: String, required: true, enum: ['CBSE', 'GSEB', 'SSC', 'ICSE'] },
  inviteCode: { type: String, required: true, unique: true },
  createdBy:  { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  members:    [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
}, { timestamps: true });

module.exports = mongoose.model('StudyCircle', studyCircleSchema);
