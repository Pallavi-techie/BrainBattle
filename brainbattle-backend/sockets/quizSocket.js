const QuizSession = require('../models/QuizSession');
const Question = require('../models/Question');
const Room = require('../models/Room');
const { awardCoins } = require('../utils/coinsHelper');

const QUESTION_TIME = 15; // seconds per question

const quizSocket = (io) => {
  // This is called from server.js after a quiz session is created via REST API
  // Admin triggers: io.quizStart(sessionId, roomId)
  io.quizStart = async (sessionId, roomId) => {
    try {
      const session = await QuizSession.findById(sessionId).populate('questions');
      if (!session) return;

      session.status = 'active';
      session.startedAt = new Date();
      await session.save();

      io.to(roomId).emit('quiz:start', { sessionId, questionCount: session.questions.length });

      // Run each question sequentially
      for (let i = 0; i < session.questions.length; i++) {
        const question = session.questions[i];

        // Send question WITHOUT correct answer
        io.to(roomId).emit('quiz:question', {
          questionIndex: i,
          total: session.questions.length,
          questionId: question._id,
          text: question.text,
          options: question.options,
          timeLimit: QUESTION_TIME,
        });

        // Wait for timer to expire
        await new Promise(resolve => setTimeout(resolve, QUESTION_TIME * 1000));

        // After timer: reveal correct answer
        io.to(roomId).emit('quiz:result', {
          questionId: question._id,
          correctAnswer: question.correctAnswer,
          scores: Object.fromEntries(session.scores),
        });

        // Refresh session scores for leaderboard
        const updatedSession = await QuizSession.findById(sessionId);
        const scoresObj = Object.fromEntries(updatedSession.scores);
        const leaderboard = Object.entries(scoresObj)
          .sort(([, a], [, b]) => b - a)
          .map(([userId, score], idx) => ({ rank: idx + 1, userId, score }));

        io.to(roomId).emit('quiz:leaderboard', leaderboard);

        // Small pause between questions
        if (i < session.questions.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      }

      // Quiz end - award coins, finalize
      const finalSession = await QuizSession.findById(sessionId);
      finalSession.status = 'finished';
      finalSession.endedAt = new Date();
      await finalSession.save();

      const finalScores = Object.fromEntries(finalSession.scores);
      const finalLeaderboard = Object.entries(finalScores)
        .sort(([, a], [, b]) => b - a)
        .map(([userId, score], idx) => ({ rank: idx + 1, userId, score }));

      // Award coins: winner gets WIN_QUIZ, others get PARTICIPATE_QUIZ
      for (const [userId, score] of Object.entries(finalScores)) {
        if (score > 0) {
          await awardCoins(userId, 'PARTICIPATE_QUIZ');
        }
      }
      if (finalLeaderboard.length > 0) {
        await awardCoins(finalLeaderboard[0].userId, 'WIN_QUIZ');
      }

      // Mark room as inactive
      await Room.findByIdAndUpdate(roomId, { isActive: false });

      io.to(roomId).emit('quiz:end', { leaderboard: finalLeaderboard, sessionId });

    } catch (error) {
      console.error('Quiz socket error:', error);
    }
  };

  // Listen for player answers
  io.on('connection', (socket) => {

    socket.on('quiz:answer', async ({ sessionId, questionIndex, answer, userId, timestamp }) => {
      try {
        const session = await QuizSession.findById(sessionId).populate('questions');
        if (!session || session.status !== 'active') return;

        const question = session.questions[questionIndex];
        if (!question) return;

        // Prevent duplicate answers for same question
        const answerKey = `${userId}:q${questionIndex}`;
        if (session.answeredBy && session.answeredBy.includes(answerKey)) return;

        const isCorrect = question.correctAnswer === answer;
        if (isCorrect) {
          // Points: base 100, decreasing by time taken (faster = more points)
          const points = 100; // simplified for now
          const currentScore = session.scores.get(userId) || 0;
          session.scores.set(userId, currentScore + points);
          if (!session.answeredBy) session.answeredBy = [];
          session.answeredBy.push(answerKey);
          await session.save();
        }

        // Confirm to this player
        socket.emit('quiz:answer:confirmed', { correct: isCorrect, questionIndex });

      } catch (error) {
        console.error('Answer handler error:', error);
      }
    });

    socket.on('disconnect', async () => {
      if (socket.data.roomId && socket.data.userId) {
        io.to(socket.data.roomId).emit('quiz:disconnect', {
          userId: socket.data.userId,
          userName: socket.data.userName,
        });
      }
    });
  });
};

module.exports = quizSocket;
