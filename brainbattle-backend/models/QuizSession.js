const mongoose = require('mongoose');

const quizSessionSchema = new mongoose.Schema({
  room:         { type: mongoose.Schema.Types.ObjectId, ref: 'Room', required: true },
  questions:    [{ type: mongoose.Schema.Types.ObjectId, ref: 'Question' }],
  currentIndex: { type: Number, default: 0 },
  status:       { type: String, enum: ['waiting', 'active', 'finished'], default: 'waiting' },
  scores:       { type: Map, of: Number, default: {} },
  answeredBy:   [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  startedAt:    { type: Date },
  endedAt:      { type: Date },
}, { timestamps: true });

module.exports = mongoose.model('QuizSession', quizSessionSchema);
