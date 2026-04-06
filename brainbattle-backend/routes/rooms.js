const express = require('express');
const router = express.Router();
const Room = require('../models/Room');
const { protect } = require('../middleware/auth');

// GET /api/rooms - List all public rooms
router.get('/', protect, async (req, res) => {
  try {
    const rooms = await Room.find({ isPublic: true })
      .populate('createdBy', 'name')
      .populate('members', 'name')
      .sort({ createdAt: -1 });
    res.json(rooms);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// POST /api/rooms - Create a room
router.post('/', protect, async (req, res) => {
  try {
    const { name, isPublic } = req.body;
    const room = await Room.create({ name, isPublic: isPublic ?? true, createdBy: req.user._id, members: [req.user._id] });
    res.status(201).json(room);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET /api/rooms/:id - Get room details
router.get('/:id', protect, async (req, res) => {
  try {
    const room = await Room.findById(req.params.id)
      .populate('createdBy', 'name')
      .populate('members', 'name coins');
    if (!room) return res.status(404).json({ message: 'Room not found' });
    res.json(room);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// POST /api/rooms/:id/join
router.post('/:id/join', protect, async (req, res) => {
  try {
    const room = await Room.findById(req.params.id);
    if (!room) return res.status(404).json({ message: 'Room not found' });
    if (room.isActive) return res.status(400).json({ message: 'Quiz already in progress. Wait for next round.' });
    if (!room.members.includes(req.user._id)) {
      room.members.push(req.user._id);
      await room.save();
    }
    res.json({ message: 'Joined room', room });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// POST /api/rooms/:id/leave
router.post('/:id/leave', protect, async (req, res) => {
  try {
    const room = await Room.findById(req.params.id);
    if (!room) return res.status(404).json({ message: 'Room not found' });
    room.members = room.members.filter(m => !m.equals(req.user._id));
    await room.save();
    res.json({ message: 'Left room' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
