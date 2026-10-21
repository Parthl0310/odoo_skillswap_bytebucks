import express from 'express';
import { param, body, validationResult } from 'express-validator';
import Message from '../models/Message.js';
import SwapRequest from '../models/SwapRequest.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// @route   GET /api/messages/:swapId
// @desc    Get message history for a swap
// @access  Private
router.get('/:swapId', protect, [
  param('swapId').isMongoId().withMessage('Invalid swap ID')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: errors.array()
      });
    }

    const { swapId } = req.params;

    // Verify swap exists and user is participant
    const swap = await SwapRequest.findById(swapId);
    if (!swap) {
      return res.status(404).json({
        success: false,
        message: 'Swap not found'
      });
    }

    const userIdStr = req.user._id.toString();
    const fromIdStr = swap.fromUserId.toString();
    const toIdStr = swap.toUserId.toString();

    if (userIdStr !== fromIdStr && userIdStr !== toIdStr) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view messages for this swap'
      });
    }

    const messages = await Message.find({ swapId })
      .populate('senderId', 'name email photo')
      .sort({ createdAt: 1 });

    res.json({
      success: true,
      data: { messages }
    });
  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   POST /api/messages/:swapId
// @desc    Send a message via HTTP (fallback/REST)
// @access  Private
router.post('/:swapId', protect, [
  param('swapId').isMongoId().withMessage('Invalid swap ID'),
  body('text').trim().isLength({ min: 1, max: 1000 }).withMessage('Message must be between 1 and 1000 characters')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: errors.array()
      });
    }

    const { swapId } = req.params;
    const { text } = req.body;

    const swap = await SwapRequest.findById(swapId);
    if (!swap) {
      return res.status(404).json({
        success: false,
        message: 'Swap not found'
      });
    }

    const userIdStr = req.user._id.toString();
    const fromIdStr = swap.fromUserId.toString();
    const toIdStr = swap.toUserId.toString();

    if (userIdStr !== fromIdStr && userIdStr !== toIdStr) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to message in this swap'
      });
    }

    const receiverId = userIdStr === fromIdStr ? swap.toUserId : swap.fromUserId;

    const message = await Message.create({
      swapId,
      senderId: req.user._id,
      receiverId,
      text
    });

    await message.populate('senderId', 'name email photo');

    // Emit real-time socket events
    const io = req.app.get('io');
    if (io) {
      io.to(`swap-${swapId}`).emit('receive-message', { message });
      io.to(`user-${receiverId}`).emit('new-message-notification', {
        swapId,
        message,
        fromUser: {
          id: req.user._id,
          name: req.user.name,
          photo: req.user.photo
        }
      });
    }

    res.status(201).json({
      success: true,
      message: 'Message sent',
      data: { message }
    });
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   PUT /api/messages/:swapId/read
// @desc    Mark incoming messages in a swap as read
// @access  Private
router.put('/:swapId/read', protect, [
  param('swapId').isMongoId().withMessage('Invalid swap ID')
], async (req, res) => {
  try {
    const { swapId } = req.params;

    await Message.updateMany(
      { swapId, receiverId: req.user._id, read: false },
      { $set: { read: true } }
    );

    res.json({
      success: true,
      message: 'Messages marked as read'
    });
  } catch (error) {
    console.error('Mark read error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

export default router;
