const User = require('../models/User');
const QuizSession = require('../models/QuizSession');

const BADGES = {
  QUIZ_CHAMPION:    'Quiz Champion',     // win 5 quiz battles
  STREAK_MASTER:    'Streak Master',     // 7-day streak
  HOMEWORK_HERO:    'Homework Hero',     // complete 20 homework tasks
  FLASHCARD_FAN:    'Flashcard Fan',     // review 10 flashcard decks
  SOCIAL_BUTTERFLY: 'Social Butterfly',  // join 3 different fun arena rooms
};

const checkAndAwardBadges = async (userId) => {
  const user = await User.findById(userId);
  if (!user) return;

  const newBadges = [];

  if (user.streak >= 7 && !user.badges.includes(BADGES.STREAK_MASTER)) {
    newBadges.push(BADGES.STREAK_MASTER);
  }

  // Add more badge checks here as features are built
  // e.g. quiz wins, homework completions, etc.

  if (newBadges.length > 0) {
    await User.findByIdAndUpdate(userId, { $addToSet: { badges: { $each: newBadges } } });
  }

  return newBadges;
};

module.exports = { checkAndAwardBadges, BADGES };
