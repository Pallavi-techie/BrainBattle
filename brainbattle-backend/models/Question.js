const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({
  text:          { type: String, required: true },
  options:       [{ type: String, required: true }],
  correctAnswer: { type: Number, required: true, min: 0, max: 3 },
  category:      { type: String, enum: ['math', 'science', 'gk', 'word', 'riddle', 'creativity'], required: true },
  difficulty:    { type: String, enum: ['easy', 'medium', 'hard'], default: 'easy' },
  classLevel:    { type: String, default: 'all' },
  language:      { type: String, enum: ['en', 'hi', 'gu'], default: 'en' },
  createdBy:     { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  isDaily:       { type: Boolean, default: false },
  dailyDate:     { type: Date },
}, { timestamps: true });

module.exports = mongoose.model('Question', questionSchema);
