const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { protect } = require('../middleware/auth');
const { awardCoins } = require('../utils/coinsHelper');
const { checkAndAwardBadges } = require('../utils/badgeChecker');

const generateToken = (id) => jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, class: classNum, school, board, language } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email and password are required' });
    }

    const userExists = await User.findOne({ email });
    if (userExists) return res.status(400).json({ message: 'Email already registered' });

    const user = await User.create({ name, email, password, class: classNum, school, board, language });

    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      coins: user.coins,
      token: generateToken(user._id),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });

    if (!user || !(await user.matchPassword(password))) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Streak logic
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const lastLogin = user.lastLogin ? new Date(user.lastLogin) : null;

    if (lastLogin) {
      lastLogin.setHours(0, 0, 0, 0);
      const diffDays = Math.floor((today - lastLogin) / (1000 * 60 * 60 * 24));
      if (diffDays === 1) {
        user.streak += 1;
      } else if (diffDays > 1) {
        user.streak = 1; // streak broken
      }
      // diffDays === 0 means same day login, no change to streak
    } else {
      user.streak = 1; // first login ever
    }

    user.lastLogin = new Date();
    await user.save();

    // Daily login coins (only once per day)
    const isFirstLoginToday = !lastLogin || Math.floor((today - lastLogin) / (1000 * 60 * 60 * 24)) >= 1;
    if (isFirstLoginToday) {
      await awardCoins(user._id, 'DAILY_LOGIN');
    }

    await checkAndAwardBadges(user._id);
    const updatedUser = await User.findById(user._id).select('-password');

    res.json({
      _id: updatedUser._id,
      name: updatedUser.name,
      email: updatedUser.email,
      role: updatedUser.role,
      coins: updatedUser.coins,
      streak: updatedUser.streak,
      badges: updatedUser.badges,
      token: generateToken(updatedUser._id),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET /api/auth/me
router.get('/me', protect, async (req, res) => {
  res.json(req.user);
});

// PUT /api/auth/me
router.put('/me', protect, async (req, res) => {
  try {
    const { name, school, language } = req.body;
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { name, school, language },
      { new: true }
    ).select('-password');
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
