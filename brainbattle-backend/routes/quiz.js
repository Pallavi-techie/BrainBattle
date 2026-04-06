const express = require('express');
const router = express.Router();
const QuizSession = require('../models/QuizSession');
const Question = require('../models/Question');
const Room = require('../models/Room');
const { protect } = require('../middleware/auth');
const { adminOnly } = require('../middleware/adminOnly');

// POST /api/quiz/start/:roomId - Admin starts a quiz
router.post('/start/:roomId', protect, adminOnly, async (req, res) => {
  try {
    const { category, language, count = 10 } = req.body;
    const room = await Room.findById(req.params.roomId);
    if (!room) return res.status(404).json({ message: 'Room not found' });
    if (room.isActive) return res.status(400).json({ message: 'A quiz is already running in this room' });

    // Validate minimum questions exist
    const filter = {};
    if (category) filter.category = category;
    if (language) filter.language = language;
    const availableQuestions = await Question.find(filter);

    if (availableQuestions.length < 3) {
      return res.status(400).json({ message: 'Not enough questions available. Add at least 3 questions first.' });
    }

    // Pick random questions
    const shuffled = availableQuestions.sort(() => Math.random() - 0.5);
    const selectedQuestions = shuffled.slice(0, Math.min(count, shuffled.length));

    const session = await QuizSession.create({
      room: room._id,
      questions: selectedQuestions.map(q => q._id),
      status: 'waiting',
    });

    // Mark room as active
    room.isActive = true;
    await room.save();

    // The actual quiz flow is driven by Socket.IO (quizSocket.js)
    // This route just creates the session and returns sessionId
    res.status(201).json({ sessionId: session._id, questionCount: selectedQuestions.length });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET /api/quiz/:sessionId - Get session results
router.get('/:sessionId', protect, async (req, res) => {
  try {
    const session = await QuizSession.findById(req.params.sessionId)
      .populate('questions', 'text options correctAnswer category')
      .populate('room', 'name');
    if (!session) return res.status(404).json({ message: 'Session not found' });
    res.json(session);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET /api/quiz/:sessionId/leaderboard
router.get('/:sessionId/leaderboard', protect, async (req, res) => {
  try {
    const session = await QuizSession.findById(req.params.sessionId);
    if (!session) return res.status(404).json({ message: 'Session not found' });

    const scoresObj = Object.fromEntries(session.scores);
    const sorted = Object.entries(scoresObj)
      .sort(([, a], [, b]) => b - a)
      .map(([userId, score], index) => ({ rank: index + 1, userId, score }));

    res.json(sorted);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
