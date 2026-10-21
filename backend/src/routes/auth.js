import express from 'express';
import jwt from 'jsonwebtoken';
import { body, validationResult } from 'express-validator';
import User from '../models/User.js';
import { protect } from '../middleware/auth.js';
import { uploadSingle } from '../middleware/upload.js';

const router = express.Router();

// Generate JWT Token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d'
  });
};

// @route   POST /api/auth/register
// @desc    Register user
// @access  Public
router.post('/register', [
  body('name').trim().isLength({ min: 2, max: 50 }).withMessage('Name must be between 2 and 50 characters'),
  body('email').isEmail().normalizeEmail().withMessage('Please provide a valid email'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters long'),
  body('location').optional().trim().isLength({ max: 100 }).withMessage('Location cannot exceed 100 characters'),
  body('availability').optional().isIn(['weekdays', 'weekends', 'evenings', 'flexible']).withMessage('Invalid availability option'),
  body('skillsOffered').optional(),
  body('skillsWanted').optional(),
  body('isPublic').optional().isBoolean().withMessage('isPublic must be a boolean')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: errors.array().map(e => e.msg).join(', '),
        errors: errors.array()
      });
    }

    const { name, email, password, location, availability, skillsOffered, skillsWanted, isPublic } = req.body;
    const normalizedEmail = (email || '').toLowerCase().trim();

    // Check if user already exists
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'An account with this email already exists'
      });
    }

    // Process skills arrays/strings cleanly
    let skillsOfferedArray = [];
    if (Array.isArray(skillsOffered)) {
      skillsOfferedArray = skillsOffered.filter(s => typeof s === 'string' && s.trim());
    } else if (typeof skillsOffered === 'string' && skillsOffered.trim()) {
      skillsOfferedArray = skillsOffered.split(',').map(s => s.trim()).filter(Boolean);
    }

    let skillsWantedArray = [];
    if (Array.isArray(skillsWanted)) {
      skillsWantedArray = skillsWanted.filter(s => typeof s === 'string' && s.trim());
    } else if (typeof skillsWanted === 'string' && skillsWanted.trim()) {
      skillsWantedArray = skillsWanted.split(',').map(s => s.trim()).filter(Boolean);
    }

    // Create user
    const user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      password,
      location: location ? location.trim() : undefined,
      availability: availability || 'flexible',
      skillsOffered: skillsOfferedArray,
      skillsWanted: skillsWantedArray,
      isPublic: isPublic !== undefined ? isPublic : true
    });

    // Generate token
    const token = generateToken(user._id);

    res.status(201).json({
      success: true,
      message: 'Account created successfully',
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          location: user.location,
          photo: user.photo,
          skillsOffered: user.skillsOffered,
          skillsWanted: user.skillsWanted,
          availability: user.availability,
          isPublic: user.isPublic,
          isAdmin: user.isAdmin,
          rating: user.rating,
          reviewCount: user.reviewCount,
          joinedAt: user.createdAt
        },
        token
      }
    });
  } catch (error) {
    console.error('Register error:', error);
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(val => val.message).join(', ');
      return res.status(400).json({
        success: false,
        message: messages || 'Validation failed'
      });
    }
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'An account with this email already exists'
      });
    }
    res.status(500).json({
      success: false,
      message: error.message || 'Server error occurred during registration'
    });
  }
});

// @route   POST /api/auth/login
// @desc    Login user
// @access  Public
router.post('/login', [
  body('email').isEmail().normalizeEmail().withMessage('Please provide a valid email'),
  body('password').notEmpty().withMessage('Password is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: errors.array().map(e => e.msg).join(', '),
        errors: errors.array()
      });
    }

    const { email, password } = req.body;
    const normalizedEmail = (email || '').toLowerCase().trim();

    // Check if user exists
    const user = await User.findOne({ email: normalizedEmail }).select('+password');
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Check if user is banned
    if (user.isBanned) {
      return res.status(403).json({
        success: false,
        message: 'Your account has been suspended or banned'
      });
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Update last active
    await user.updateLastActive();

    // Generate token
    const token = generateToken(user._id);

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          location: user.location,
          photo: user.photo,
          skillsOffered: user.skillsOffered,
          skillsWanted: user.skillsWanted,
          availability: user.availability,
          isPublic: user.isPublic,
          isAdmin: user.isAdmin,
          rating: user.rating,
          reviewCount: user.reviewCount,
          joinedAt: user.createdAt
        },
        token
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error occurred during login'
    });
  }
});

// @route   GET /api/auth/me
// @desc    Get current user
// @access  Private
router.get('/me', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    
    res.json({
      success: true,
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          location: user.location,
          photo: user.photo,
          skillsOffered: user.skillsOffered,
          skillsWanted: user.skillsWanted,
          availability: user.availability,
          isPublic: user.isPublic,
          isAdmin: user.isAdmin,
          rating: user.rating,
          reviewCount: user.reviewCount,
          joinedAt: user.createdAt
        }
      }
    });
  } catch (error) {
    console.error('Get me error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   PUT /api/auth/profile
// @desc    Update user profile
// @access  Private
router.put('/profile', protect, uploadSingle, (req, res, next) => {
  if (req.body.skillsOffered && typeof req.body.skillsOffered === 'string') {
    try {
      req.body.skillsOffered = JSON.parse(req.body.skillsOffered);
    } catch {
      req.body.skillsOffered = [req.body.skillsOffered];
    }
  }
  if (req.body.skillsWanted && typeof req.body.skillsWanted === 'string') {
    try {
      req.body.skillsWanted = JSON.parse(req.body.skillsWanted);
    } catch {
      req.body.skillsWanted = [req.body.skillsWanted];
    }
  }
  if (req.body.isPublic !== undefined && typeof req.body.isPublic === 'string') {
    req.body.isPublic = req.body.isPublic === 'true';
  }
  next();
}, [
  body('name').optional().trim().isLength({ min: 2, max: 50 }).withMessage('Name must be between 2 and 50 characters'),
  body('location').optional().trim().isLength({ max: 100 }).withMessage('Location cannot exceed 100 characters'),
  body('availability').optional().isIn(['weekdays', 'weekends', 'evenings', 'flexible']).withMessage('Invalid availability option'),
  body('skillsOffered').optional().isArray().withMessage('Skills offered must be an array'),
  body('skillsWanted').optional().isArray().withMessage('Skills wanted must be an array'),
  body('isPublic').optional().isBoolean().withMessage('isPublic must be a boolean')
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
    
    // Handle file upload
    if (req.file) {
      // In a real app, you'd upload to cloud storage here
      updateData.photo = `/uploads/${req.file.filename}`;
    }

    const user = await User.findByIdAndUpdate(
      req.user._id,
      updateData,
      { new: true, runValidators: true }
    );

    const updatedUserData = {
      id: user._id,
      name: user.name,
      email: user.email,
      location: user.location,
      photo: user.photo,
      skillsOffered: user.skillsOffered,
      skillsWanted: user.skillsWanted,
      availability: user.availability,
      isPublic: user.isPublic,
      isAdmin: user.isAdmin,
      isBanned: user.isBanned,
      rating: user.rating,
      reviewCount: user.reviewCount,
      joinedAt: user.createdAt
    };

    // Broadcast live update to all connected users
    const io = req.app.get('io');
    if (io) {
      io.emit('user-updated', { user: updatedUserData });
    }

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        user: updatedUserData
      }
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   POST /api/auth/change-password
// @desc    Change user password
// @access  Private
router.post('/change-password', protect, [
  body('currentPassword').notEmpty().withMessage('Current password is required'),
  body('newPassword').isLength({ min: 6 }).withMessage('New password must be at least 6 characters long')
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

    const { currentPassword, newPassword } = req.body;

    const user = await User.findById(req.user._id).select('+password');
    
    // Check current password
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    // Update password
    user.password = newPassword;
    await user.save();

    res.json({
      success: true,
      message: 'Password changed successfully'
    });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

export default router; 