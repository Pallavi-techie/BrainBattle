const express = require('express');
const router = express.Router();
const Question = require('../models/Question');
const { protect } = require('../middleware/auth');
const { adminOnly } = require('../middleware/adminOnly');
const { awardCoins } = require('../utils/coinsHelper');

// GET /api/questions/daily - Today's daily challenge
router.get('/daily', protect, async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const question = await Question.findOne({ isDaily: true, dailyDate: { $gte: today, $lt: tomorrow } });
    if (!question) return res.status(404).json({ message: 'No daily challenge set for today' });

    // Don't send correct answer to client
    const { correctAnswer, ...safeQuestion } = question.toObject();
    res.json(safeQuestion);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// POST /api/questions/daily/answer
router.post('/daily/answer', protect, async (req, res) => {
  try {
    const { questionId, answer } = req.body;
    const question = await Question.findById(questionId);
    if (!question || !question.isDaily) return res.status(404).json({ message: 'Daily question not found' });

    const isCorrect = question.correctAnswer === answer;
    if (isCorrect) {
      await awardCoins(req.user._id, 'PARTICIPATE_QUIZ');
    }
    res.json({ correct: isCorrect, correctAnswer: question.correctAnswer });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Admin only routes below
// POST /api/questions
router.post('/', protect, adminOnly, async (req, res) => {
  try {
    const question = await Question.create({ ...req.body, createdBy: req.user._id });
    res.status(201).json(question);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET /api/questions - with optional filters
router.get('/', protect, adminOnly, async (req, res) => {
  try {
    const { category, difficulty, language, classLevel } = req.query;
    const filter = {};
    if (category) filter.category = category;
    if (difficulty) filter.difficulty = difficulty;
    if (language) filter.language = language;
    if (classLevel) filter.classLevel = classLevel;

    const questions = await Question.find(filter).sort({ createdAt: -1 });
    res.json(questions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// PUT /api/questions/:id
router.put('/:id', protect, adminOnly, async (req, res) => {
  try {
    const question = await Question.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(question);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// DELETE /api/questions/:id
router.delete('/:id', protect, adminOnly, async (req, res) => {
  try {
    await Question.findByIdAndDelete(req.params.id);
    res.json({ message: 'Question deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
