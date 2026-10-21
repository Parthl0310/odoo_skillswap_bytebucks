import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer } from 'http';
import { Server } from 'socket.io';
import connectDB from './config/database.js';
import authRoutes from './routes/auth.js';
import userRoutes from './routes/users.js';
import swapRoutes from './routes/swaps.js';
import feedbackRoutes from './routes/feedback.js';
import adminRoutes from './routes/admin.js';
import messageRoutes from './routes/messages.js';
import notificationRoutes from './routes/notifications.js';
import Message from './models/Message.js';
import { errorHandler } from './middleware/errorHandler.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config();

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: (origin, callback) => {
      callback(null, true);
    },
    credentials: true
  }
});

const PORT = process.env.PORT || 5000;

// Connect to MongoDB
connectDB();

// Track active users inside each swap chat room (swapId -> Set of userIds) across all sockets
const activeChatUsers = new Map();

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  // Join user to their personal room
  socket.on('join-user', (userId) => {
    socket.join(`user-${userId}`);
    if (userId) socket.userId = String(userId);
    console.log(`User ${userId} joined their room`);
  });

  // Join a swap-specific chat room
  socket.on('join-chat', ({ swapId, userId }) => {
    socket.join(`swap-${swapId}`);
    socket.currentSwapId = swapId;
    if (userId) socket.userId = String(userId);

    if (!activeChatUsers.has(swapId)) {
      activeChatUsers.set(swapId, new Set());
    }
    if (userId) {
      activeChatUsers.get(swapId).add(String(userId));
    }

    const onlineUsers = Array.from(activeChatUsers.get(swapId) || []);
    io.to(`swap-${swapId}`).emit('chat-presence', { swapId, onlineUsers });
    console.log(`User ${userId || socket.id} joined chat room swap-${swapId}, active:`, onlineUsers);
  });

  // Leave a swap chat room
  socket.on('leave-chat', ({ swapId, userId }) => {
    socket.leave(`swap-${swapId}`);
    const uId = userId || socket.userId;
    if (swapId && uId && activeChatUsers.has(swapId)) {
      activeChatUsers.get(swapId).delete(String(uId));
      const onlineUsers = Array.from(activeChatUsers.get(swapId) || []);
      io.to(`swap-${swapId}`).emit('chat-presence', { swapId, onlineUsers });
    }
    console.log(`Socket ${socket.id} left chat room swap-${swapId}`);
  });

  // Handle sending a real-time message
  socket.on('send-message', async (data, callback) => {
    try {
      const { swapId, senderId, receiverId, text } = data;
      if (!swapId || !senderId || !receiverId || !text?.trim()) {
        if (typeof callback === 'function') callback({ success: false, message: 'Invalid payload' });
        return;
      }

      const message = await Message.create({
        swapId,
        senderId,
        receiverId,
        text: text.trim()
      });

      await message.populate('senderId', 'name email photo');

      // Broadcast to everyone in this swap chat room
      io.to(`swap-${swapId}`).emit('receive-message', { message });

      // Notify the receiver's personal room in case they don't have the chat modal open
      io.to(`user-${receiverId}`).emit('new-message-notification', {
        swapId,
        message
      });

      if (typeof callback === 'function') {
        callback({ success: true, message });
      }
    } catch (err) {
      console.error('Socket send-message error:', err);
      if (typeof callback === 'function') {
        callback({ success: false, error: err.message });
      }
    }
  });

  // User typing indicator
  socket.on('typing', ({ swapId, userId, isTyping, userName }) => {
    socket.to(`swap-${swapId}`).emit('user-typing', { swapId, userId, isTyping, userName });
  });

  // Mark messages as read
  socket.on('mark-read', async ({ swapId, userId }) => {
    try {
      await Message.updateMany(
        { swapId, receiverId: userId, read: false },
        { $set: { read: true } }
      );
      socket.to(`swap-${swapId}`).emit('messages-read', { swapId });
    } catch (err) {
      console.error('Socket mark-read error:', err);
    }
  });

  // Handle disconnect
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
    if (socket.userId) {
      activeChatUsers.forEach((usersSet, swapId) => {
        if (usersSet.has(socket.userId)) {
          usersSet.delete(socket.userId);
          const onlineUsers = Array.from(usersSet);
          io.to(`swap-${swapId}`).emit('chat-presence', {
            swapId,
            onlineUsers
          });
        }
      });
    }
  });
});

// Make io available to routes
app.set('io', io);

// Security middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));
app.use(cors({
  origin: true,
  credentials: true
}));

// Serve static uploads
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 5000,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later.'
  }
});
app.use('/api/', limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Compression middleware
app.use(compression());

// Logging middleware
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    success: true,
    status: 'OK', 
    message: 'Skill Swap API is running',
    timestamp: new Date().toISOString()
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/swaps', swapRoutes);
app.use('/api/feedback', feedbackRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/notifications', notificationRoutes);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ 
    success: false, 
    message: 'Route not found' 
  });
});

// Error handling middleware
app.use(errorHandler);

// Start server
server.listen(PORT, () => {
  console.log(`🚀 Skill Swap API server running on port ${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/api/health`);
  console.log(`🔌 WebSocket server ready`);
});

export default app; 