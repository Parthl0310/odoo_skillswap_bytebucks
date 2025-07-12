import express from 'express';
import { body, param, query, validationResult } from 'express-validator';
import SwapRequest from '../models/SwapRequest.js';
import Notification from '../models/Notification.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// @route   POST /api/swaps
// @desc    Create a new swap request
// @access  Private
router.post('/', protect, [
  body('toUserId').isMongoId().withMessage('Invalid user ID'),
  body('skillOffered').trim().isLength({ min: 1, max: 50 }).withMessage('Skill offered must be between 1 and 50 characters'),
  body('skillWanted').trim().isLength({ min: 1, max: 50 }).withMessage('Skill wanted must be between 1 and 50 characters'),
  body('message').trim().isLength({ min: 1, max: 500 }).withMessage('Message must be between 1 and 500 characters')
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

    const { toUserId, skillOffered, skillWanted, message } = req.body;

    // Check if user is trying to swap with themselves
    if (req.user._id.toString() === toUserId) {
      return res.status(400).json({
        success: false,
        message: 'Cannot create swap request with yourself'
      });
    }

    // Check if there's already a pending request between these users
    const existingRequest = await SwapRequest.findOne({
      $or: [
        { fromUserId: req.user._id, toUserId, status: 'pending' },
        { fromUserId: toUserId, toUserId: req.user._id, status: 'pending' }
      ]
    });

    if (existingRequest) {
      return res.status(400).json({
        success: false,
        message: 'A pending swap request already exists between these users'
      });
    }

    // Create swap request
    const swapRequest = await SwapRequest.create({
      fromUserId: req.user._id,
      toUserId,
      skillOffered,
      skillWanted,
      message
    });

    // Populate user details
    await swapRequest.populate('fromUserId', 'name email photo');
    await swapRequest.populate('toUserId', 'name email photo');

    // Create notification for recipient
    await Notification.createSwapRequestNotification(toUserId, req.user._id, swapRequest._id);

    // Emit real-time event to recipient
    const io = req.app.get('io');
    if (io) {
      io.to(`user-${toUserId}`).emit('new-swap-request', {
        swapRequest,
        fromUser: {
          id: req.user._id,
          name: req.user.name,
          photo: req.user.photo
        }
      });
    }

    res.status(201).json({
      success: true,
      message: 'Swap request created successfully',
      data: { swapRequest }
    });
  } catch (error) {
    console.error('Create swap request error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/swaps
// @desc    Get swap requests for current user
// @access  Private
router.get('/', protect, [
  query('status').optional().isIn(['pending', 'accepted', 'rejected', 'completed', 'cancelled']).withMessage('Invalid status'),
  query('type').optional().isIn(['sent', 'received']).withMessage('Type must be sent or received'),
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('Limit must be between 1 and 50')
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

    const { status, type, page = 1, limit = 20 } = req.query;
    const skip = (page - 1) * limit;

    // Build query
    let query = {};
    
    if (type === 'sent') {
      query.fromUserId = req.user._id;
    } else if (type === 'received') {
      query.toUserId = req.user._id;
    } else {
      query.$or = [
        { fromUserId: req.user._id },
        { toUserId: req.user._id }
      ];
    }

    if (status) {
      query.status = status;
    }

    // Execute query
    const swapRequests = await SwapRequest.find(query)
      .populate('fromUserId', 'name email photo')
      .populate('toUserId', 'name email photo')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    // Get total count
    const total = await SwapRequest.countDocuments(query);

    // Calculate pagination info
    const totalPages = Math.ceil(total / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    res.json({
      success: true,
      data: {
        swapRequests,
        pagination: {
          currentPage: parseInt(page),
          totalPages,
          totalRequests: total,
          hasNextPage,
          hasPrevPage,
          limit: parseInt(limit)
        }
      }
    });
  } catch (error) {
    console.error('Get swap requests error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/swaps/:id
// @desc    Get specific swap request
// @access  Private
router.get('/:id', protect, [
  param('id').isMongoId().withMessage('Invalid swap request ID')
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

    const swapRequest = await SwapRequest.findById(req.params.id)
      .populate('fromUserId', 'name email photo')
      .populate('toUserId', 'name email photo');

    if (!swapRequest) {
      return res.status(404).json({
        success: false,
        message: 'Swap request not found'
      });
    }

    // Check if user is involved in this swap request
    if (swapRequest.fromUserId._id.toString() !== req.user._id.toString() && 
        swapRequest.toUserId._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this swap request'
      });
    }

    res.json({
      success: true,
      data: { swapRequest }
    });
  } catch (error) {
    console.error('Get swap request error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   PUT /api/swaps/:id/accept
// @desc    Accept a swap request
// @access  Private
router.put('/:id/accept', protect, [
  param('id').isMongoId().withMessage('Invalid swap request ID')
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

    const swapRequest = await SwapRequest.findById(req.params.id);

    if (!swapRequest) {
      return res.status(404).json({
        success: false,
        message: 'Swap request not found'
      });
    }

    // Check if user is the recipient
    if (swapRequest.toUserId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Only the recipient can accept swap requests'
      });
    }

    // Check if request is pending
    if (swapRequest.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Can only accept pending swap requests'
      });
    }

    // Accept the request
    await swapRequest.accept();
    await swapRequest.populate('fromUserId', 'name email photo');
    await swapRequest.populate('toUserId', 'name email photo');

    // Create notification for sender
    await Notification.createSwapAcceptedNotification(swapRequest.fromUserId._id, swapRequest._id);

    // Emit real-time event to sender
    const io = req.app.get('io');
    if (io) {
      io.to(`user-${swapRequest.fromUserId._id}`).emit('swap-request-updated', {
        swapRequest,
        action: 'accepted',
        updatedBy: {
          id: req.user._id,
          name: req.user.name,
          photo: req.user.photo
        }
      });
    }

    res.json({
      success: true,
      message: 'Swap request accepted successfully',
      data: { swapRequest }
    });
  } catch (error) {
    console.error('Accept swap request error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   PUT /api/swaps/:id/reject
// @desc    Reject a swap request
// @access  Private
router.put('/:id/reject', protect, [
  param('id').isMongoId().withMessage('Invalid swap request ID')
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

    const swapRequest = await SwapRequest.findById(req.params.id);

    if (!swapRequest) {
      return res.status(404).json({
        success: false,
        message: 'Swap request not found'
      });
    }

    // Check if user is the recipient
    if (swapRequest.toUserId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Only the recipient can reject swap requests'
      });
    }

    // Check if request is pending
    if (swapRequest.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Can only reject pending swap requests'
      });
    }

    // Reject the request
    await swapRequest.reject();
    await swapRequest.populate('fromUserId', 'name email photo');
    await swapRequest.populate('toUserId', 'name email photo');

    // Create notification for sender
    await Notification.createSwapRejectedNotification(swapRequest.fromUserId._id, swapRequest._id);

    // Emit real-time event to sender
    const io = req.app.get('io');
    if (io) {
      io.to(`user-${swapRequest.fromUserId._id}`).emit('swap-request-updated', {
        swapRequest,
        action: 'rejected',
        updatedBy: {
          id: req.user._id,
          name: req.user.name,
          photo: req.user.photo
        }
      });
    }

    res.json({
      success: true,
      message: 'Swap request rejected successfully',
      data: { swapRequest }
    });
  } catch (error) {
    console.error('Reject swap request error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   PUT /api/swaps/:id/complete
// @desc    Complete a swap request
// @access  Private
router.put('/:id/complete', protect, [
  param('id').isMongoId().withMessage('Invalid swap request ID')
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

    const swapRequest = await SwapRequest.findById(req.params.id);

    if (!swapRequest) {
      return res.status(404).json({
        success: false,
        message: 'Swap request not found'
      });
    }

    // Check if user is involved in this swap
    if (swapRequest.fromUserId.toString() !== req.user._id.toString() && 
        swapRequest.toUserId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to complete this swap'
      });
    }

    // Check if request is accepted
    if (swapRequest.status !== 'accepted') {
      return res.status(400).json({
        success: false,
        message: 'Can only complete accepted swap requests'
      });
    }

    // Complete the swap
    await swapRequest.complete();
    await swapRequest.populate('fromUserId', 'name email photo');
    await swapRequest.populate('toUserId', 'name email photo');

    // Create notifications for both users
    await Notification.createSwapCompletedNotification(swapRequest.fromUserId._id, swapRequest._id);
    await Notification.createSwapCompletedNotification(swapRequest.toUserId._id, swapRequest._id);

    // Emit real-time events to both users
    const io = req.app.get('io');
    if (io) {
      const otherUserId = req.user._id.toString() === swapRequest.fromUserId._id.toString() 
        ? swapRequest.toUserId._id 
        : swapRequest.fromUserId._id;
      
      io.to(`user-${otherUserId}`).emit('swap-request-updated', {
        swapRequest,
        action: 'completed',
        updatedBy: {
          id: req.user._id,
          name: req.user.name,
          photo: req.user.photo
        }
      });
    }

    res.json({
      success: true,
      message: 'Swap completed successfully',
      data: { swapRequest }
    });
  } catch (error) {
    console.error('Complete swap error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   DELETE /api/swaps/:id
// @desc    Cancel/delete a swap request
// @access  Private
router.delete('/:id', protect, [
  param('id').isMongoId().withMessage('Invalid swap request ID')
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

    const swapRequest = await SwapRequest.findById(req.params.id);

    if (!swapRequest) {
      return res.status(404).json({
        success: false,
        message: 'Swap request not found'
      });
    }

    // Check if user is the sender
    if (swapRequest.fromUserId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Only the sender can cancel swap requests'
      });
    }

    // Check if request is pending
    if (swapRequest.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Can only cancel pending swap requests'
      });
    }

    // Cancel the request
    await swapRequest.cancel();

    res.json({
      success: true,
      message: 'Swap request cancelled successfully'
    });
  } catch (error) {
    console.error('Cancel swap request error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/swaps/stats/overview
// @desc    Get swap statistics for current user
// @access  Private
router.get('/stats/overview', protect, async (req, res) => {
  try {
    const userId = req.user._id;

    // Get counts for different statuses
    const stats = await SwapRequest.aggregate([
      {
        $match: {
          $or: [
            { fromUserId: userId },
            { toUserId: userId }
          ]
        }
      },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    // Get total swaps
    const totalSwaps = await SwapRequest.countDocuments({
      $or: [
        { fromUserId: userId },
        { toUserId: userId }
      ]
    });

    // Get completed swaps count
    const completedSwaps = await SwapRequest.countDocuments({
      $or: [
        { fromUserId: userId },
        { toUserId: userId }
      ],
      status: 'completed'
    });

    // Get pending requests count
    const pendingRequests = await SwapRequest.countDocuments({
      toUserId: userId,
      status: 'pending'
    });

    res.json({
      success: true,
      data: {
        stats,
        totalSwaps,
        completedSwaps,
        pendingRequests
      }
    });
  } catch (error) {
    console.error('Get swap stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

export default router; 