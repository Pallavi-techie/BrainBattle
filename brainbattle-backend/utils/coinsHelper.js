const User = require('../models/User');

const COIN_REWARDS = {
  DAILY_LOGIN:        5,
  COMPLETE_HOMEWORK:  10,
  COMPLETE_FLASHCARD: 15,
  WIN_QUIZ:           50,
  PARTICIPATE_QUIZ:   10,
  WEEK_STREAK_BONUS:  100,
};

const awardCoins = async (userId, action) => {
  const amount = COIN_REWARDS[action];
  if (!amount) return;
  await User.findByIdAndUpdate(userId, { $inc: { coins: amount } });
};

module.exports = { awardCoins, COIN_REWARDS };
