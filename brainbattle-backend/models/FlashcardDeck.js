const mongoose = require('mongoose');

const flashcardDeckSchema = new mongoose.Schema({
  circle:    { type: mongoose.Schema.Types.ObjectId, ref: 'StudyCircle', required: true },
  title:     { type: String, required: true },
  subject:   { type: String, required: true },
  cards:     [{ question: String, answer: String }],
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true });

module.exports = mongoose.model('FlashcardDeck', flashcardDeckSchema);
