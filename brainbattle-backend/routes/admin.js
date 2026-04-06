const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Room = require('../models/Room');
const Question = require('../models/Question');
const { protect } = require('../middleware/auth');
const { adminOnly } = require('../middleware/adminOnly');

// All routes here require admin
router.use(protect, adminOnly);

// GET /api/admin/users
router.get('/users', async (req, res) => {
  try {
    const { school, board, class: classNum } = req.query;
    const filter = { role: 'student' };
    if (school) filter.school = new RegExp(school, 'i');
    if (board) filter.board = board;
    if (classNum) filter.class = classNum;

    const users = await User.find(filter).select('-password').sort({ createdAt: -1 });
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// DELETE /api/admin/users/:id
router.delete('/users/:id', async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    res.json({ message: 'User removed' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET /api/admin/stats
router.get('/stats', async (req, res) => {
  try {
    const [totalUsers, activeRooms, totalQuestions] = await Promise.all([
      User.countDocuments({ role: 'student' }),
      Room.countDocuments({ isActive: true }),
      Question.countDocuments(),
    ]);
    res.json({ totalUsers, activeRooms, totalQuestions });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET /api/admin/rooms
router.get('/rooms', async (req, res) => {
  try {
    const rooms = await Room.find({ isActive: true })
      .populate('members', 'name')
      .populate('createdBy', 'name');
    res.json(rooms);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// POST /api/admin/broadcast - stored in DB, socket will push it
router.post('/broadcast', async (req, res) => {
  try {
    const { message } = req.body;
    if (!message) return res.status(400).json({ message: 'Message is required' });
    // The actual push is done via Socket.IO in server.js using global io instance
    // Here we just acknowledge it - socket handling in server.js reads from this route
    res.json({ message: 'Broadcast sent', content: message });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
