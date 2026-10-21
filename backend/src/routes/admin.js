import express from 'express';
import { body, param, query, validationResult } from 'express-validator';
import User from '../models/User.js';
import SwapRequest from '../models/SwapRequest.js';
import AdminMessage from '../models/AdminMessage.js';
import Notification from '../models/Notification.js';
import { protect, admin } from '../middleware/auth.js';

const router = express.Router();

// Apply admin middleware to all routes
router.use(protect, admin);

// @route   GET /api/admin/dashboard
// @desc    Get admin dashboard statistics
// @access  Admin
router.get('/dashboard', async (req, res) => {
  try {
    // Get user statistics
    const totalUsers = await User.countDocuments();
    const activeUsers = await User.countDocuments({ isBanned: false });
    const bannedUsers = await User.countDocuments({ isBanned: true });
    const adminUsers = await User.countDocuments({ isAdmin: true });

    // Get swap statistics
    const swapStats = await SwapRequest.getStats();
    const totalSwaps = await SwapRequest.countDocuments();
    const completedSwaps = await SwapRequest.countDocuments({ status: 'completed' });
    const pendingSwaps = await SwapRequest.countDocuments({ status: 'pending' });

    // Get recent activity
    const recentUsers = await User.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .select('name email createdAt');

    const recentSwaps = await SwapRequest.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('fromUserId', 'name email')
      .populate('toUserId', 'name email');

    // Get popular skills
    const popularOfferedSkills = await User.aggregate([
      { $unwind: '$skillsOffered' },
      { $group: { _id: '$skillsOffered', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 }
    ]);

    const popularWantedSkills = await User.aggregate([
      { $unwind: '$skillsWanted' },
      { $group: { _id: '$skillsWanted', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 }
    ]);

    res.json({
      success: true,
      data: {
        users: {
          total: totalUsers,
          active: activeUsers,
          banned: bannedUsers,
          admins: adminUsers
        },
        swaps: {
          total: totalSwaps,
          completed: completedSwaps,
          pending: pendingSwaps,
          stats: swapStats
        },
        recentActivity: {
          users: recentUsers,
          swaps: recentSwaps
        },
        popularSkills: {
          offered: popularOfferedSkills,
          wanted: popularWantedSkills
        }
      }
    });
  } catch (error) {
    console.error('Get admin dashboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/admin/users
// @desc    Get all users with filtering and pagination
// @access  Admin
router.get('/users', [
  query('search').optional().trim().isLength({ min: 1 }).withMessage('Search term must not be empty'),
  query('status').optional().isIn(['active', 'banned']).withMessage('Status must be active or banned'),
  query('role').optional().isIn(['user', 'admin']).withMessage('Role must be user or admin'),
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100')
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

    const { search, status, role, page = 1, limit = 20 } = req.query;
    const skip = (page - 1) * limit;

    // Build query
    let query = {};

    if (search) {
      query.$text = { $search: search };
    }

    if (status === 'banned') {
      query.isBanned = true;
    } else if (status === 'active') {
      query.isBanned = false;
    }

    if (role === 'admin') {
      query.isAdmin = true;
    } else if (role === 'user') {
      query.isAdmin = false;
    }

    // Execute query
    const users = await User.find(query)
      .select('-password')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    // Get total count
    const total = await User.countDocuments(query);

    // Calculate pagination info
    const totalPages = Math.ceil(total / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    res.json({
      success: true,
      data: {
        users,
        pagination: {
          currentPage: parseInt(page),
          totalPages,
          totalUsers: total,
          hasNextPage,
          hasPrevPage,
          limit: parseInt(limit)
        }
      }
    });
  } catch (error) {
    console.error('Get admin users error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   PUT /api/admin/users/:id/ban
// @desc    Ban a user
// @access  Admin
router.put('/users/:id/ban', [
  param('id').isMongoId().withMessage('Invalid user ID'),
  body('reason').optional().trim().isLength({ max: 200 }).withMessage('Reason cannot exceed 200 characters')
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

    const { reason } = req.body;
    const userId = req.params.id;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check if user is already banned
    if (user.isBanned) {
      return res.status(400).json({
        success: false,
        message: 'User is already banned'
      });
    }

    // Check if trying to ban an admin
    if (user.isAdmin) {
      return res.status(400).json({
        success: false,
        message: 'Cannot ban admin users'
      });
    }

    // Ban the user
    user.isBanned = true;
    await user.save();

    res.json({
      success: true,
      message: 'User banned successfully',
      data: { user }
    });
  } catch (error) {
    console.error('Ban user error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   PUT /api/admin/users/:id/unban
// @desc    Unban a user
// @access  Admin
router.put('/users/:id/unban', [
  param('id').isMongoId().withMessage('Invalid user ID')
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

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check if user is not banned
    if (!user.isBanned) {
      return res.status(400).json({
        success: false,
        message: 'User is not banned'
      });
    }

    // Unban the user
    user.isBanned = false;
    await user.save();

    res.json({
      success: true,
      message: 'User unbanned successfully',
      data: { user }
    });
  } catch (error) {
    console.error('Unban user error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   PUT /api/admin/users/:id/role
// @desc    Change user role
// @access  Admin
router.put('/users/:id/role', [
  param('id').isMongoId().withMessage('Invalid user ID'),
  body('isAdmin').isBoolean().withMessage('isAdmin must be a boolean')
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

    const { isAdmin } = req.body;
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Update user role
    user.isAdmin = isAdmin;
    await user.save();

    res.json({
      success: true,
      message: `User role updated to ${isAdmin ? 'admin' : 'user'} successfully`,
      data: { user }
    });
  } catch (error) {
    console.error('Change user role error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/admin/swaps
// @desc    Get all swap requests with filtering
// @access  Admin
router.get('/swaps', [
  query('status').optional().isIn(['pending', 'accepted', 'rejected', 'completed', 'cancelled']).withMessage('Invalid status'),
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100')
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

    const { status, page = 1, limit = 20 } = req.query;
    const skip = (page - 1) * limit;

    // Build query
    let query = {};
    if (status) {
      query.status = status;
    }

    // Execute query
    const swapRequests = await SwapRequest.find(query)
      .populate('fromUserId', 'name email')
      .populate('toUserId', 'name email')
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
    console.error('Get admin swaps error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   POST /api/admin/messages
// @desc    Create an admin message/announcement
// @access  Admin
router.post('/messages', [
  body('title').trim().isLength({ min: 1, max: 100 }).withMessage('Title must be between 1 and 100 characters'),
  body('message').trim().isLength({ min: 1, max: 1000 }).withMessage('Message must be between 1 and 1000 characters'),
  body('type').isIn(['info', 'warning', 'announcement', 'maintenance']).withMessage('Invalid message type'),
  body('isGlobal').optional().isBoolean().withMessage('isGlobal must be a boolean'),
  body('targetUsers').optional().isArray().withMessage('targetUsers must be an array'),
  body('expiresAt').optional().isISO8601().withMessage('Invalid date format')
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

    const { title, message, type, isGlobal = false, targetUsers = [], expiresAt } = req.body;

    // Create admin message
    const adminMessage = await AdminMessage.create({
      title,
      message,
      type,
      isGlobal,
      targetUsers,
      expiresAt: expiresAt ? new Date(expiresAt) : null,
      createdBy: req.user._id
    });

    // If global message, create notifications for all users
    if (isGlobal) {
      const users = await User.find({ isBanned: false });
      const notifications = users.map(user => ({
        userId: user._id,
        type: 'admin_message',
        title: title,
        message: message,
        relatedId: adminMessage._id,
        relatedModel: 'AdminMessage'
      }));
      
      await Notification.insertMany(notifications);
    } else if (targetUsers.length > 0) {
      // Create notifications for targeted users
      const notifications = targetUsers.map(userId => ({
        userId,
        type: 'admin_message',
        title: title,
        message: message,
        relatedId: adminMessage._id,
        relatedModel: 'AdminMessage'
      }));
      
      await Notification.insertMany(notifications);
    }

    res.status(201).json({
      success: true,
      message: 'Admin message created successfully',
      data: { adminMessage }
    });
  } catch (error) {
    console.error('Create admin message error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/admin/messages
// @desc    Get all admin messages
// @access  Admin
router.get('/messages', [
  query('type').optional().isIn(['info', 'warning', 'announcement', 'maintenance']).withMessage('Invalid message type'),
  query('isActive').optional().isBoolean().withMessage('isActive must be a boolean'),
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100')
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

    const { type, isActive, page = 1, limit = 20 } = req.query;
    const skip = (page - 1) * limit;

    // Build query
    let query = {};
    if (type) {
      query.type = type;
    }
    if (isActive !== undefined) {
      query.isActive = isActive;
    }

    // Execute query
    const messages = await AdminMessage.find(query)
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    // Get total count
    const total = await AdminMessage.countDocuments(query);

    // Calculate pagination info
    const totalPages = Math.ceil(total / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    res.json({
      success: true,
      data: {
        messages,
        pagination: {
          currentPage: parseInt(page),
          totalPages,
          totalMessages: total,
          hasNextPage,
          hasPrevPage,
          limit: parseInt(limit)
        }
      }
    });
  } catch (error) {
    console.error('Get admin messages error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   PUT /api/admin/messages/:id
// @desc    Update admin message
// @access  Admin
router.put('/messages/:id', [
  param('id').isMongoId().withMessage('Invalid message ID'),
  body('title').optional().trim().isLength({ min: 1, max: 100 }).withMessage('Title must be between 1 and 100 characters'),
  body('message').optional().trim().isLength({ min: 1, max: 1000 }).withMessage('Message must be between 1 and 1000 characters'),
  body('type').optional().isIn(['info', 'warning', 'announcement', 'maintenance']).withMessage('Invalid message type'),
  body('isActive').optional().isBoolean().withMessage('isActive must be a boolean'),
  body('expiresAt').optional().isISO8601().withMessage('Invalid date format')
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

    const updateData = { ...req.body };
    if (updateData.expiresAt) {
      updateData.expiresAt = new Date(updateData.expiresAt);
    }

    const message = await AdminMessage.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Admin message not found'
      });
    }

    res.json({
      success: true,
      message: 'Admin message updated successfully',
      data: { message }
    });
  } catch (error) {
    console.error('Update admin message error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   DELETE /api/admin/messages/:id
// @desc    Delete admin message
// @access  Admin
router.delete('/messages/:id', [
  param('id').isMongoId().withMessage('Invalid message ID')
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

    const message = await AdminMessage.findByIdAndDelete(req.params.id);

    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Admin message not found'
      });
    }

    res.json({
      success: true,
      message: 'Admin message deleted successfully'
    });
  } catch (error) {
    console.error('Delete message error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   PUT /api/admin/users/:id/moderate-skills
// @desc    Reject / remove inappropriate or spammy skill descriptions
// @access  Admin
router.put('/users/:id/moderate-skills', [
  param('id').isMongoId().withMessage('Invalid user ID'),
  body('skillsOffered').optional().isArray().withMessage('skillsOffered must be an array'),
  body('skillsWanted').optional().isArray().withMessage('skillsWanted must be an array'),
  body('reason').optional().trim().isLength({ max: 200 }).withMessage('Reason cannot exceed 200 characters')
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

    const { skillsOffered, skillsWanted, reason } = req.body;
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    if (skillsOffered !== undefined) {
      user.skillsOffered = skillsOffered;
    }
    if (skillsWanted !== undefined) {
      user.skillsWanted = skillsWanted;
    }

    await user.save();

    // Create notification for user
    await Notification.create({
      userId: user._id,
      type: 'admin_message',
      title: 'Skills Updated by Administrator',
      message: reason || 'One or more of your listed skills were moderated by an administrator due to platform policies.',
      relatedId: req.user._id,
      relatedModel: 'User'
    });

    res.json({
      success: true,
      message: 'User skills updated successfully',
      data: { user }
    });
  } catch (error) {
    console.error('Moderate skills error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/admin/reports/export
// @desc    Download reports of user activity, feedback logs, and swap stats
// @access  Admin
router.get('/reports/export', async (req, res) => {
  try {
    const users = await User.find().select('-password').lean();
    const swaps = await SwapRequest.find()
      .populate('fromUserId', 'name email')
      .populate('toUserId', 'name email')
      .lean();
    const swapStats = await SwapRequest.getStats();

    const reportData = {
      generatedAt: new Date().toISOString(),
      summary: {
        totalUsers: users.length,
        activeUsers: users.filter(u => !u.isBanned).length,
        bannedUsers: users.filter(u => u.isBanned).length,
        totalSwaps: swaps.length,
        completedSwaps: swaps.filter(s => s.status === 'completed').length,
        pendingSwaps: swaps.filter(s => s.status === 'pending').length,
        swapStatusBreakdown: swapStats
      },
      users: users.map(u => ({
        id: u._id,
        name: u.name,
        email: u.email,
        location: u.location || '',
        skillsOffered: u.skillsOffered,
        skillsWanted: u.skillsWanted,
        availability: u.availability,
        isPublic: u.isPublic,
        isAdmin: u.isAdmin,
        isBanned: u.isBanned,
        rating: u.rating,
        reviewCount: u.reviewCount,
        joinedAt: u.createdAt
      })),
      swaps: swaps.map(s => ({
        id: s._id,
        fromUser: s.fromUserId ? s.fromUserId.name : 'Unknown',
        fromUserEmail: s.fromUserId ? s.fromUserId.email : '',
        toUser: s.toUserId ? s.toUserId.name : 'Unknown',
        toUserEmail: s.toUserId ? s.toUserId.email : '',
        skillOffered: s.skillOffered,
        skillWanted: s.skillWanted,
        status: s.status,
        createdAt: s.createdAt,
        completedAt: s.completedAt,
        feedback: s.feedback
      }))
    };

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename=skillswap-report-${new Date().toISOString().split('T')[0]}.json`);
    res.json(reportData);
  } catch (error) {
    console.error('Export report error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Helper for CSV escaping
const escapeCSV = (val) => {
  if (val === null || val === undefined) return '""';
  if (val instanceof Date) return `"${val.toISOString()}"`;
  let str = Array.isArray(val) ? val.join('; ') : String(val);
  return `"${str.replace(/"/g, '""')}"`;
};

// @route   GET /api/admin/reports/export-csv
// @desc    Download CSV spreadsheet of users, swaps, or feedback logs
// @access  Admin
router.get('/reports/export-csv', async (req, res) => {
  try {
    const { type = 'users' } = req.query;
    const dateStr = new Date().toISOString().split('T')[0];

    if (type === 'swaps') {
      const swaps = await SwapRequest.find()
        .populate('fromUserId', 'name email')
        .populate('toUserId', 'name email')
        .sort({ createdAt: -1 })
        .lean();

      const headers = ['Swap ID', 'Requester Name', 'Requester Email', 'Recipient Name', 'Recipient Email', 'Skill Offered', 'Skill Wanted', 'Status', 'Created At', 'Completed At'];
      const rows = swaps.map(s => [
        s._id,
        s.fromUserId?.name || 'Unknown',
        s.fromUserId?.email || '',
        s.toUserId?.name || 'Unknown',
        s.toUserId?.email || '',
        s.skillOffered || '',
        s.skillWanted || '',
        s.status || '',
        s.createdAt ? new Date(s.createdAt).toISOString() : '',
        s.completedAt ? new Date(s.completedAt).toISOString() : ''
      ].map(escapeCSV).join(','));

      const csvContent = [headers.map(escapeCSV).join(','), ...rows].join('\n');
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename=skillswap-swaps-${dateStr}.csv`);
      return res.send(csvContent);
    }

    if (type === 'feedback') {
      const swapsWithFeedback = await SwapRequest.find({
        $or: [
          { 'feedback.fromUserRating': { $exists: true } },
          { 'feedback.toUserRating': { $exists: true } },
          { status: 'completed' }
        ]
      })
        .populate('fromUserId', 'name email')
        .populate('toUserId', 'name email')
        .sort({ completedAt: -1, createdAt: -1 })
        .lean();

      const headers = ['Swap ID', 'Requester Name', 'Requester Email', 'Recipient Name', 'Recipient Email', 'Skill Offered', 'Skill Wanted', 'Requester Rating', 'Requester Feedback', 'Recipient Rating', 'Recipient Feedback', 'Completed At'];
      const rows = swapsWithFeedback.map(s => [
        s._id,
        s.fromUserId?.name || 'Unknown',
        s.fromUserId?.email || '',
        s.toUserId?.name || 'Unknown',
        s.toUserId?.email || '',
        s.skillOffered || '',
        s.skillWanted || '',
        s.feedback?.fromUserRating || '',
        s.feedback?.fromUserComment || '',
        s.feedback?.toUserRating || '',
        s.feedback?.toUserComment || '',
        s.completedAt ? new Date(s.completedAt).toISOString() : ''
      ].map(escapeCSV).join(','));

      const csvContent = [headers.map(escapeCSV).join(','), ...rows].join('\n');
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename=skillswap-feedback-${dateStr}.csv`);
      return res.send(csvContent);
    }

    // Default: 'users' sign-ups and profiles
    const users = await User.find().select('-password').sort({ createdAt: -1 }).lean();
    const headers = ['User ID', 'Name', 'Email', 'Location', 'Availability', 'Skills Offered', 'Skills Wanted', 'Is Public', 'Is Admin', 'Is Banned', 'Rating', 'Review Count', 'Created At'];
    const rows = users.map(u => [
      u._id,
      u.name,
      u.email,
      u.location || '',
      u.availability || '',
      u.skillsOffered || [],
      u.skillsWanted || [],
      u.isPublic ? 'Yes' : 'No',
      u.isAdmin ? 'Yes' : 'No',
      u.isBanned ? 'Yes' : 'No',
      u.rating || 0,
      u.reviewCount || 0,
      u.createdAt ? new Date(u.createdAt).toISOString() : ''
    ].map(escapeCSV).join(','));

    const csvContent = [headers.map(escapeCSV).join(','), ...rows].join('\n');
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename=skillswap-users-${dateStr}.csv`);
    return res.send(csvContent);
  } catch (error) {
    console.error('Export CSV error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error generating CSV report'
    });
  }
});

export default router; 