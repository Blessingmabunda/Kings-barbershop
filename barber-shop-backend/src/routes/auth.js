const express = require('express');
const { body, validationResult } = require('express-validator');
const { User, Franchise } = require('../config/database');
const { generateToken, refreshToken, authenticateToken } = require('../middleware/auth');
const { asyncHandler, AppError } = require('../middleware/errorHandler');

const router = express.Router();

// Login route
router.post('/login', 
  body('username').notEmpty().withMessage('Username is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: errors.array()
    });
  }

  const { username, password } = req.body;

  // Find user by username or email
  const user = await User.findOne({
    $or: [
      { username: username },
      { email: username }
    ]
  }).populate('franchise_id', 'id name is_active');

  if (!user) {
    return res.status(401).json({
      success: false,
      error: 'Authentication failed',
      message: 'Invalid credentials'
    });
  }

  // Check if user is active
  if (!user.is_active) {
    return res.status(401).json({
      success: false,
      error: 'Authentication failed',
      message: 'Account is deactivated'
    });
  }

  // Check if franchise is active
  if (!user.franchise_id || !user.franchise_id.is_active) {
    return res.status(401).json({
      success: false,
      error: 'Authentication failed',
      message: 'Franchise is not active'
    });
  }

  // Validate password
  const isValidPassword = await user.comparePassword(password);
  if (!isValidPassword) {
    return res.status(401).json({
      success: false,
      error: 'Authentication failed',
      message: 'Invalid credentials'
    });
  }

  // Update last login
  user.last_login = new Date();
  await user.save();

  // Generate token
  const token = generateToken(user);

  res.json({
    success: true,
    message: 'Login successful',
    token,
    user: {
      id: user._id,
      username: user.username,
      email: user.email,
      first_name: user.first_name,
      last_name: user.last_name,
      role: user.role,
      franchise: {
        id: user.franchise_id._id,
        name: user.franchise_id.name
      }
    }
  });
}));

// Register route (for admin to create new users)
router.post('/register', 
  authenticateToken, 
  body('username').isLength({ min: 3 }).withMessage('Username must be at least 3 characters'),
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('first_name').notEmpty().withMessage('First name is required'),
  body('last_name').notEmpty().withMessage('Last name is required'),
  body('role').isIn(['admin', 'manager', 'barber', 'receptionist']).withMessage('Invalid role'),
  body('franchise_id').isMongoId().withMessage('Valid franchise ID is required'),
  asyncHandler(async (req, res) => {
  // Only admin and managers can create new users
  if (!['admin', 'manager'].includes(req.user.role)) {
    throw new AppError('Insufficient permissions to create users', 403);
  }

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: errors.array()
    });
  }

  const {
    username,
    email,
    password,
    first_name,
    last_name,
    role,
    franchise_id,
    phone,
    work_schedule,
    skills,
    hourly_rate
  } = req.body;

  // Check if franchise exists and user has access
  const franchise = await Franchise.findById(franchise_id);
  if (!franchise) {
    throw new AppError('Franchise not found', 404);
  }

  // Non-admin users can only create users for their own franchise
  if (req.user.role !== 'admin' && req.user.franchise_id.toString() !== franchise_id) {
    throw new AppError('Cannot create users for other franchises', 403);
  }

  // Check if username or email already exists
  const existingUser = await User.findOne({
    $or: [
      { username: username },
      { email: email }
    ]
  });

  if (existingUser) {
    return res.status(400).json({
      success: false,
      error: 'User already exists',
      message: 'Username or email already taken'
    });
  }

  // Create new user
  const newUser = await User.create({
    username,
    email,
    password, // Will be hashed by the pre-save hook
    first_name,
    last_name,
    role,
    franchise_id,
    phone,
    work_schedule,
    skills,
    hourly_rate
  });

  res.status(201).json({
    success: true,
    message: 'User created successfully',
    user: {
      id: newUser._id,
      username: newUser.username,
      email: newUser.email,
      first_name: newUser.first_name,
      last_name: newUser.last_name,
      role: newUser.role,
      franchise_id: newUser.franchise_id
    }
  });
}));

// Refresh token route
router.post('/refresh', refreshToken);

// Get user profile
router.get('/profile', authenticateToken, asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id)
    .populate('franchise_id', 'id name address phone email')
    .select('-password');

  if (!user) {
    throw new AppError('User not found', 404);
  }

  res.json({
    success: true,
    user
  });
}));

// Update user profile
router.put('/profile', 
  authenticateToken, 
  body('email').optional().isEmail().withMessage('Valid email is required'),
  body('first_name').optional().notEmpty().withMessage('First name cannot be empty'),
  body('last_name').optional().notEmpty().withMessage('Last name cannot be empty'),
  body('phone').optional().isLength({ min: 10 }).withMessage('Valid phone number is required'),
  asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: errors.array()
    });
  }

  const { email, first_name, last_name, phone, work_schedule, skills } = req.body;

  // Check if email is already taken by another user
  if (email) {
    const existingUser = await User.findOne({
      email: email,
      _id: { $ne: req.user.id }
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        error: 'Email already taken'
      });
    }
  }

  const updatedUser = await User.findByIdAndUpdate(
    req.user.id,
    { email, first_name, last_name, phone, work_schedule, skills },
    { new: true, runValidators: true }
  ).select('-password');

  res.json({
    success: true,
    message: 'Profile updated successfully',
    user: updatedUser
  });
}));

// Change password
router.put('/change-password', 
  authenticateToken, 
  body('current_password').notEmpty().withMessage('Current password is required'),
  body('new_password').isLength({ min: 6 }).withMessage('New password must be at least 6 characters'),
  asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: errors.array()
    });
  }

  const { current_password, new_password } = req.body;

  const user = await User.findById(req.user.id);
  if (!user) {
    throw new AppError('User not found', 404);
  }

  // Verify current password
  const isValidPassword = await user.comparePassword(current_password);
  if (!isValidPassword) {
    return res.status(400).json({
      success: false,
      error: 'Current password is incorrect'
    });
  }

  // Update password
  user.password = new_password;
  await user.save();

  res.json({
    success: true,
    message: 'Password changed successfully'
  });
}));

// Logout route
router.post('/logout', authenticateToken, asyncHandler(async (req, res) => {
  // In a real application, you might want to blacklist the token
  // For now, we'll just return a success message
  res.json({
    success: true,
    message: 'Logged out successfully'
  });
}));

module.exports = router;