const express = require('express');
const router = express.Router();
const StudyCircle = require('../models/StudyCircle');
const HomeworkTask = require('../models/HomeworkTask');
const FlashcardDeck = require('../models/FlashcardDeck');
const { protect } = require('../middleware/auth');
const { awardCoins } = require('../utils/coinsHelper');

// Generate unique 6-digit alphanumeric invite code
const generateInviteCode = () => Math.random().toString(36).substring(2, 8).toUpperCase();

// POST /api/circles - Create a circle
router.post('/', protect, async (req, res) => {
  try {
    const { name } = req.body;
    const { class: classNum, school, board, _id } = req.user;

    if (!classNum || !school || !board) {
      return res.status(400).json({ message: 'Complete your profile (class, school, board) before creating a circle' });
    }

    let inviteCode;
    let isUnique = false;
    while (!isUnique) {
      inviteCode = generateInviteCode();
      const existing = await StudyCircle.findOne({ inviteCode });
      if (!existing) isUnique = true;
    }

    const circle = await StudyCircle.create({
      name: name || `${school} - Class ${classNum}`,
      school,
      class: classNum,
      board,
      inviteCode,
      createdBy: _id,
      members: [_id],
    });

    res.status(201).json(circle);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET /api/circles/join/:code - Join a circle
router.get('/join/:code', protect, async (req, res) => {
  try {
    const circle = await StudyCircle.findOne({ inviteCode: req.params.code.toUpperCase() });
    if (!circle) return res.status(404).json({ message: 'Invalid invite code' });

    if (circle.members.includes(req.user._id)) {
      return res.status(400).json({ message: 'You are already in this circle' });
    }

    circle.members.push(req.user._id);
    await circle.save();

    res.json({ message: 'Joined successfully', circle });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET /api/circles/:id - Get circle details
router.get('/:id', protect, async (req, res) => {
  try {
    const circle = await StudyCircle.findById(req.params.id).populate('members', 'name email class');
    if (!circle) return res.status(404).json({ message: 'Circle not found' });
    if (!circle.members.some(m => m._id.equals(req.user._id))) {
      return res.status(403).json({ message: 'You are not a member of this circle' });
    }
    res.json(circle);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ── Homework ────────────────────────────────────────────────────────────────
router.post('/:id/homework', protect, async (req, res) => {
  try {
    const circle = await StudyCircle.findById(req.params.id);
    if (!circle || !circle.members.includes(req.user._id)) {
      return res.status(403).json({ message: 'Not a member' });
    }
    const task = await HomeworkTask.create({ ...req.body, circle: req.params.id, createdBy: req.user._id });
    res.status(201).json(task);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.put('/:id/homework/:hwId', protect, async (req, res) => {
  try {
    const task = await HomeworkTask.findByIdAndUpdate(
      req.params.hwId,
      { ...req.body, updatedBy: req.user._id },
      { new: true }
    );
    if (!task) return res.status(404).json({ message: 'Task not found' });

    // Award coins when task is marked done
    if (req.body.status === 'done') {
      await awardCoins(req.user._id, 'COMPLETE_HOMEWORK');
    }

    res.json(task);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.delete('/:id/homework/:hwId', protect, async (req, res) => {
  try {
    await HomeworkTask.findByIdAndDelete(req.params.hwId);
    res.json({ message: 'Task deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/:id/homework', protect, async (req, res) => {
  try {
    const tasks = await HomeworkTask.find({ circle: req.params.id }).sort({ dueDate: 1 });
    res.json(tasks);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ── Exams ───────────────────────────────────────────────────────────────────
// Stored inside StudyCircle doc for simplicity in V1
router.post('/:id/exams', protect, async (req, res) => {
  try {
    const circle = await StudyCircle.findById(req.params.id);
    if (!circle || !circle.members.includes(req.user._id)) {
      return res.status(403).json({ message: 'Not a member' });
    }
    // TODO: Add ExamTimetable model in V2 — for now return placeholder
    res.status(201).json({ message: 'Exam added (model coming in next step)' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ── Flashcards ──────────────────────────────────────────────────────────────
router.post('/:id/flashcards', protect, async (req, res) => {
  try {
    const circle = await StudyCircle.findById(req.params.id);
    if (!circle || !circle.members.includes(req.user._id)) {
      return res.status(403).json({ message: 'Not a member' });
    }
    const deck = await FlashcardDeck.create({ ...req.body, circle: req.params.id, createdBy: req.user._id });
    res.status(201).json(deck);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/:id/flashcards', protect, async (req, res) => {
  try {
    const decks = await FlashcardDeck.find({ circle: req.params.id }).populate('createdBy', 'name');
    res.json(decks);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
