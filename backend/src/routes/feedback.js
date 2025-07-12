import express from 'express';
import { body, param, query, validationResult } from 'express-validator';
import SwapRequest from '../models/SwapRequest.js';
import User from '../models/User.js';
import Notification from '../models/Notification.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// @route   POST /api/feedback/:swapId
// @desc    Add feedback for a completed swap
// @access  Private
router.post('/:swapId', protect, [
  param('swapId').isMongoId().withMessage('Invalid swap ID'),
  body('rating').isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5'),
  body('comment').optional().trim().isLength({ max: 200 }).withMessage('Comment cannot exceed 200 characters')
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

    const { rating, comment } = req.body;
    const swapId = req.params.swapId;

    const swapRequest = await SwapRequest.findById(swapId);

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
        message: 'Not authorized to provide feedback for this swap'
      });
    }

    // Check if swap is completed
    if (swapRequest.status !== 'completed') {
      return res.status(400).json({
        success: false,
        message: 'Can only provide feedback for completed swaps'
      });
    }

    // Check if user has already provided feedback
    const isFromUser = swapRequest.fromUserId.toString() === req.user._id.toString();
    const hasProvidedFeedback = isFromUser 
      ? swapRequest.feedback.fromUserRating !== null
      : swapRequest.feedback.toUserRating !== null;

    if (hasProvidedFeedback) {
      return res.status(400).json({
        success: false,
        message: 'You have already provided feedback for this swap'
      });
    }

    // Add feedback
    await swapRequest.addFeedback(req.user._id, rating, comment);

    // Update user rating
    const targetUserId = isFromUser ? swapRequest.toUserId : swapRequest.fromUserId;
    const targetUser = await User.findById(targetUserId);
    await targetUser.updateRating(rating);

    // Check if both users have provided feedback
    if (swapRequest.isFeedbackComplete) {
      // Create notification for feedback received
      await Notification.createFeedbackReceivedNotification(targetUserId, swapId);
    }

    // Populate user details for response
    await swapRequest.populate('fromUserId', 'name email photo');
    await swapRequest.populate('toUserId', 'name email photo');

    res.json({
      success: true,
      message: 'Feedback added successfully',
      data: { swapRequest }
    });
  } catch (error) {
    console.error('Add feedback error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/feedback/:swapId
// @desc    Get feedback for a specific swap
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

    const swapRequest = await SwapRequest.findById(req.params.swapId)
      .populate('fromUserId', 'name email photo')
      .populate('toUserId', 'name email photo');

    if (!swapRequest) {
      return res.status(404).json({
        success: false,
        message: 'Swap request not found'
      });
    }

    // Check if user is involved in this swap
    if (swapRequest.fromUserId._id.toString() !== req.user._id.toString() && 
        swapRequest.toUserId._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view feedback for this swap'
      });
    }

    res.json({
      success: true,
      data: { 
        swapRequest,
        feedback: swapRequest.feedback,
        isFeedbackComplete: swapRequest.isFeedbackComplete
      }
    });
  } catch (error) {
    console.error('Get feedback error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/feedback/user/:userId
// @desc    Get feedback for a specific user
// @access  Public
router.get('/user/:userId', [
  param('userId').isMongoId().withMessage('Invalid user ID'),
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

    const { page = 1, limit = 20 } = req.query;
    const skip = (page - 1) * limit;

    // Get completed swaps for the user
    const swapRequests = await SwapRequest.find({
      $or: [
        { fromUserId: req.params.userId },
        { toUserId: req.params.userId }
      ],
      status: 'completed'
    })
    .populate('fromUserId', 'name email photo')
    .populate('toUserId', 'name email photo')
    .sort({ completedAt: -1 })
    .skip(skip)
    .limit(parseInt(limit));

    // Get total count
    const total = await SwapRequest.countDocuments({
      $or: [
        { fromUserId: req.params.userId },
        { toUserId: req.params.userId }
      ],
      status: 'completed'
    });

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
          totalSwaps: total,
          hasNextPage,
          hasPrevPage,
          limit: parseInt(limit)
        }
      }
    });
  } catch (error) {
    console.error('Get user feedback error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/feedback/stats/overview
// @desc    Get feedback statistics for current user
// @access  Private
router.get('/stats/overview', protect, async (req, res) => {
  try {
    const userId = req.user._id;

    // Get user's rating and review count
    const user = await User.findById(userId);
    
    // Get completed swaps count
    const completedSwaps = await SwapRequest.countDocuments({
      $or: [
        { fromUserId: userId },
        { toUserId: userId }
      ],
      status: 'completed'
    });

    // Get swaps with feedback
    const swapsWithFeedback = await SwapRequest.countDocuments({
      $or: [
        { fromUserId: userId },
        { toUserId: userId }
      ],
      status: 'completed',
      $or: [
        { 'feedback.fromUserRating': { $ne: null } },
        { 'feedback.toUserRating': { $ne: null } }
      ]
    });

    // Get average rating received
    const ratingStats = await SwapRequest.aggregate([
      {
        $match: {
          $or: [
            { fromUserId: userId },
            { toUserId: userId }
          ],
          status: 'completed'
        }
      },
      {
        $project: {
          fromUserRating: '$feedback.fromUserRating',
          toUserRating: '$feedback.toUserRating',
          isFromUser: { $eq: ['$fromUserId', userId] }
        }
      },
      {
        $project: {
          receivedRating: {
            $cond: {
              if: '$isFromUser',
              then: '$toUserRating',
              else: '$fromUserRating'
            }
          }
        }
      },
      {
        $match: { receivedRating: { $ne: null } }
      },
      {
        $group: {
          _id: null,
          averageRating: { $avg: '$receivedRating' },
          totalRatings: { $sum: 1 }
        }
      }
    ]);

    res.json({
      success: true,
      data: {
        userRating: user.rating,
        reviewCount: user.reviewCount,
        completedSwaps,
        swapsWithFeedback,
        averageRatingReceived: ratingStats.length > 0 ? ratingStats[0].averageRating : 0,
        totalRatingsReceived: ratingStats.length > 0 ? ratingStats[0].totalRatings : 0
      }
    });
  } catch (error) {
    console.error('Get feedback stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

export default router; 