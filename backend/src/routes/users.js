import express from 'express';
import { query, param, validationResult } from 'express-validator';
import User from '../models/User.js';
import { protect, optionalAuth } from '../middleware/auth.js';

const router = express.Router();

// @route   GET /api/users
// @desc    Get all public users with filtering and pagination
// @access  Public
router.get('/', optionalAuth, [
  query('search').optional().trim().isLength({ min: 1 }).withMessage('Search term must not be empty'),
  query('skill').optional().trim().isLength({ min: 1 }).withMessage('Skill must not be empty'),
  query('availability').optional().isIn(['weekdays', 'weekends', 'evenings', 'flexible']).withMessage('Invalid availability option'),
  query('location').optional().trim().isLength({ min: 1 }).withMessage('Location must not be empty'),
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

    const { search, skill, availability, location, page = 1, limit = 20 } = req.query;
    const skip = (page - 1) * limit;

    // Build query
    let query = { isPublic: true, isBanned: false };

    // Search functionality
    if (search) {
      query.$text = { $search: search };
    }

    // Skill filter
    if (skill) {
      query.$or = [
        { skillsOffered: { $regex: skill, $options: 'i' } },
        { skillsWanted: { $regex: skill, $options: 'i' } }
      ];
    }

    // Availability filter
    if (availability) {
      query.availability = availability;
    }

    // Location filter
    if (location) {
      query.location = { $regex: location, $options: 'i' };
    }

    // Execute query
    const users = await User.find(query)
      .select('name email location photo skillsOffered skillsWanted availability rating reviewCount joinedAt')
      .sort({ rating: -1, reviewCount: -1 })
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
    console.error('Get users error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/users/:id
// @desc    Get user profile by ID
// @access  Public
router.get('/:id', optionalAuth, [
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

    const user = await User.findById(req.params.id)
      .select('name email location photo skillsOffered skillsWanted availability rating reviewCount joinedAt isPublic');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check if profile is public or if current user is viewing their own profile
    if (!user.isPublic && (!req.user || req.user._id.toString() !== user._id.toString())) {
      return res.status(403).json({
        success: false,
        message: 'Profile is private'
      });
    }

    res.json({
      success: true,
      data: { user }
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/users/:id/skill-matches
// @desc    Get users that match skills with the given user
// @access  Public
router.get('/:id/skill-matches', [
  param('id').isMongoId().withMessage('Invalid user ID'),
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

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Find skill matches
    const matches = await User.findSkillMatches(req.params.id)
      .select('name email location photo skillsOffered skillsWanted availability rating reviewCount joinedAt')
      .sort({ rating: -1, reviewCount: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    // Get total count
    const total = await User.countDocuments({
      _id: { $ne: req.params.id },
      isPublic: true,
      isBanned: false,
      $or: [
        { skillsOffered: { $in: user.skillsWanted } },
        { skillsWanted: { $in: user.skillsOffered } }
      ]
    });

    // Calculate pagination info
    const totalPages = Math.ceil(total / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    res.json({
      success: true,
      data: {
        matches,
        pagination: {
          currentPage: parseInt(page),
          totalPages,
          totalMatches: total,
          hasNextPage,
          hasPrevPage,
          limit: parseInt(limit)
        }
      }
    });
  } catch (error) {
    console.error('Get skill matches error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/users/search/skills
// @desc    Search users by skill
// @access  Public
router.get('/search/skills', [
  query('skill').trim().isLength({ min: 1 }).withMessage('Skill is required'),
  query('type').optional().isIn(['offered', 'wanted']).withMessage('Type must be offered or wanted'),
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

    const { skill, type = 'offered', page = 1, limit = 20 } = req.query;
    const skip = (page - 1) * limit;

    // Find users by skill
    const users = await User.findBySkill(skill, type)
      .select('name email location photo skillsOffered skillsWanted availability rating reviewCount joinedAt')
      .sort({ rating: -1, reviewCount: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    // Get total count
    const field = type === 'wanted' ? 'skillsWanted' : 'skillsOffered';
    const total = await User.countDocuments({
      [field]: { $regex: skill, $options: 'i' },
      isPublic: true,
      isBanned: false
    });

    // Calculate pagination info
    const totalPages = Math.ceil(total / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    res.json({
      success: true,
      data: {
        users,
        skill,
        type,
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
    console.error('Search users by skill error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/users/stats/popular-skills
// @desc    Get popular skills statistics
// @access  Public
router.get('/stats/popular-skills', async (req, res) => {
  try {
    // Get popular offered skills
    const offeredSkills = await User.aggregate([
      { $unwind: '$skillsOffered' },
      { $group: { _id: '$skillsOffered', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);

    // Get popular wanted skills
    const wantedSkills = await User.aggregate([
      { $unwind: '$skillsWanted' },
      { $group: { _id: '$skillsWanted', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);

    res.json({
      success: true,
      data: {
        offeredSkills,
        wantedSkills
      }
    });
  } catch (error) {
    console.error('Get popular skills error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

export default router; 