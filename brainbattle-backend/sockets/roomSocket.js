const Room = require('../models/Room');

const roomSocket = (io) => {
  io.on('connection', (socket) => {
    console.log(`🔌 Socket connected: ${socket.id}`);

    // room:join - player joins a room
    socket.on('room:join', async ({ roomId, userId, userName }) => {
      socket.join(roomId);
      socket.data.roomId = roomId;
      socket.data.userId = userId;
      socket.data.userName = userName;

      // Notify everyone in the room of updated member list
      const sockets = await io.in(roomId).fetchSockets();
      const members = sockets.map(s => ({ userId: s.data.userId, userName: s.data.userName }));
      io.to(roomId).emit('room:members', members);

      console.log(`👤 ${userName} joined room ${roomId}`);
    });

    // room:leave - player leaves a room
    socket.on('room:leave', async ({ roomId }) => {
      socket.leave(roomId);
      const sockets = await io.in(roomId).fetchSockets();
      const members = sockets.map(s => ({ userId: s.data.userId, userName: s.data.userName }));
      io.to(roomId).emit('room:members', members);
    });

    // circle:online - student starts studying in a circle
    socket.on('circle:online', ({ circleId, userId, userName }) => {
      socket.join(`circle:${circleId}`);
      socket.data.circleId = circleId;
      io.to(`circle:${circleId}`).emit('circle:members-online', { userId, userName, status: 'online' });
    });

    // circle:offline - student stops studying
    socket.on('circle:offline', ({ circleId, userId }) => {
      socket.leave(`circle:${circleId}`);
      io.to(`circle:${circleId}`).emit('circle:members-online', { userId, status: 'offline' });
    });

    // circle:homework-update - broadcast homework change to all circle members
    socket.on('circle:homework-update', ({ circleId, task }) => {
      io.to(`circle:${circleId}`).emit('circle:homework-update', task);
    });

    socket.on('disconnect', () => {
      console.log(`🔌 Socket disconnected: ${socket.id}`);
    });
  });
};

module.exports = roomSocket;
