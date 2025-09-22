const express = require('express');
const { body, query, param, validationResult } = require('express-validator');
const { Franchise, User, Service, Queue, QueueEntry, Appointment, Customer, Payment } = require('../config/database');
const { authenticateToken, requireRole, requireFranchiseAccess } = require('../middleware/auth');
const { asyncHandler, AppError } = require('../middleware/errorHandler');

const router = express.Router();

// Get all franchises (admin only)
router.get('/', 
  authenticateToken, 
  requireRole(['admin']), 
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('search').optional().isString().withMessage('Search must be a string'),
  query('is_active').optional().isBoolean().withMessage('is_active must be a boolean'),
  asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: errors.array()
    });
  }

  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const skip = (page - 1) * limit;
  const search = req.query.search;
  const is_active = req.query.is_active;

  // Build query filter
  let filter = {};
  
  if (search) {
    filter.$or = [
      { name: { $regex: search, $options: 'i' } },
      { address: { $regex: search, $options: 'i' } },
      { phone: { $regex: search, $options: 'i' } }
    ];
  }
  
  if (is_active !== undefined) {
    filter.is_active = is_active === 'true';
  }

  const [franchises, count] = await Promise.all([
    Franchise.find(filter)
      .sort({ created_at: -1 })
      .limit(limit)
      .skip(skip)
      .populate('users', 'id username first_name last_name role', { is_active: true })
      .populate('services', 'id name is_active'),
    Franchise.countDocuments(filter)
  ]);

  const totalPages = Math.ceil(count / limit);

  res.json({
    success: true,
    franchises,
    pagination: {
      current_page: page,
      total_pages: totalPages,
      total_count: count,
      limit,
      has_next: page < totalPages,
      has_prev: page > 1
    }
  });
}));

// Get franchise by ID
router.get('/:franchiseId', 
  authenticateToken, 
  requireFranchiseAccess, 
  param('franchiseId').isMongoId().withMessage('Valid franchise ID is required'),
  asyncHandler(async (req, res) => {
  const { franchiseId } = req.params;

  const franchise = await Franchise.findById(franchiseId)
    .populate('users', 'id username first_name last_name role is_active created_at')
    .populate('services', 'id name category base_price is_active');

  if (!franchise) {
    throw new AppError('Franchise not found', 404);
  }

  // Get recent queues (last 30 days)
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const recentQueues = await Queue.find({
    franchise_id: franchiseId,
    date: { $gte: thirtyDaysAgo }
  }).select('id date current_size max_capacity status');

  const franchiseData = franchise.toObject();
  franchiseData.recent_queues = recentQueues;

  res.json({
    success: true,
    franchise: franchiseData
  });
}));

// Create new franchise (admin only)
router.post('/', 
  authenticateToken, 
  requireRole(['admin']), 
  body('name').notEmpty().withMessage('Franchise name is required'),
  body('address').notEmpty().withMessage('Address is required'),
  body('phone').isMobilePhone().withMessage('Valid phone number is required'),
  body('email').isEmail().withMessage('Valid email is required'),
  body('operating_hours').isObject().withMessage('Operating hours must be an object'),
  body('timezone').optional().isString().withMessage('Timezone must be a string'),
  body('settings').optional().isObject().withMessage('Settings must be an object'),
  asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: errors.array()
    });
  }

  const {
    name,
    address,
    phone,
    email,
    operating_hours,
    timezone,
    settings
  } = req.body;

  // Check if franchise with same name or phone exists
  const existingFranchise = await Franchise.findOne({
    $or: [
      { name: name },
      { phone: phone }
    ]
  });

  if (existingFranchise) {
    return res.status(400).json({
      success: false,
      error: 'Franchise with this name or phone number already exists'
    });
  }

  const franchise = await Franchise.create({
    name,
    address,
    phone,
    email,
    operating_hours,
    timezone: timezone || 'UTC',
    settings: settings || {}
  });

  res.status(201).json({
    success: true,
    message: 'Franchise created successfully',
    franchise
  });
}));

// Update franchise
router.put('/:franchiseId', 
  authenticateToken, 
  requireRole(['admin', 'manager']), 
  requireFranchiseAccess, 
  param('franchiseId').isMongoId().withMessage('Valid franchise ID is required'),
  body('name').optional().notEmpty().withMessage('Franchise name cannot be empty'),
  body('address').optional().notEmpty().withMessage('Address cannot be empty'),
  body('phone').optional().isMobilePhone().withMessage('Valid phone number is required'),
  body('email').optional().isEmail().withMessage('Valid email is required'),
  body('operating_hours').optional().isObject().withMessage('Operating hours must be an object'),
  body('timezone').optional().isString().withMessage('Timezone must be a string'),
  body('settings').optional().isObject().withMessage('Settings must be an object'),
  body('is_active').optional().isBoolean().withMessage('is_active must be a boolean'),
  asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: errors.array()
    });
  }

  const { franchiseId } = req.params;
  const updateData = req.body;

  // Non-admin users can only update certain fields
  if (req.user.role !== 'admin') {
    const allowedFields = ['operating_hours', 'settings'];
    const restrictedFields = Object.keys(updateData).filter(field => !allowedFields.includes(field));
    
    if (restrictedFields.length > 0) {
      return res.status(403).json({
        success: false,
        error: 'Insufficient permissions to update these fields',
        restricted_fields: restrictedFields
      });
    }
  }

  const franchise = await Franchise.findById(franchiseId);
  if (!franchise) {
    throw new AppError('Franchise not found', 404);
  }

  // Check for duplicate name or phone if being updated
  if (updateData.name || updateData.phone) {
    const duplicateFilter = { _id: { $ne: franchiseId } };
    const orConditions = [];
    
    if (updateData.name && updateData.name !== franchise.name) {
      orConditions.push({ name: updateData.name });
    }
    if (updateData.phone && updateData.phone !== franchise.phone) {
      orConditions.push({ phone: updateData.phone });
    }

    if (orConditions.length > 0) {
      duplicateFilter.$or = orConditions;
      const existingFranchise = await Franchise.findOne(duplicateFilter);

      if (existingFranchise) {
        return res.status(400).json({
          success: false,
          error: 'Franchise with this name or phone number already exists'
        });
      }
    }
  }

  const updatedFranchise = await Franchise.findByIdAndUpdate(
    franchiseId,
    updateData,
    { new: true, runValidators: true }
  );

  res.json({
    success: true,
    message: 'Franchise updated successfully',
    franchise: updatedFranchise
  });
}));

// Delete franchise (admin only)
router.delete('/:franchiseId', 
  authenticateToken, 
  requireRole(['admin']), 
  param('franchiseId').isMongoId().withMessage('Valid franchise ID is required'),
  asyncHandler(async (req, res) => {
  const { franchiseId } = req.params;

  const franchise = await Franchise.findById(franchiseId);
  if (!franchise) {
    throw new AppError('Franchise not found', 404);
  }

  // Check if franchise has active users or recent activity
  const [activeUsers, recentQueues] = await Promise.all([
    User.countDocuments({
      franchise_id: franchiseId,
      is_active: true
    }),
    Queue.countDocuments({
      franchise_id: franchiseId,
      date: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
    })
  ]);

  if (activeUsers > 0 || recentQueues > 0) {
    return res.status(400).json({
      success: false,
      error: 'Cannot delete franchise with active users or recent activity. Deactivate instead.'
    });
  }

  // Soft delete by marking as inactive
  await Franchise.findByIdAndUpdate(franchiseId, {
    is_active: false,
    deleted_at: new Date()
  });

  res.json({
    success: true,
    message: 'Franchise deleted successfully'
  });
}));

// Get franchise statistics
router.get('/:franchiseId/stats', 
  authenticateToken, 
  requireFranchiseAccess, 
  param('franchiseId').isMongoId().withMessage('Valid franchise ID is required'),
  query('start_date').optional().isISO8601().withMessage('Valid start date is required'),
  query('end_date').optional().isISO8601().withMessage('Valid end date is required'),
  asyncHandler(async (req, res) => {
  const { franchiseId } = req.params;
  const { start_date, end_date } = req.query;

  // Build date filter
  let dateFilter = {};
  if (start_date || end_date) {
    dateFilter.created_at = {};
    if (start_date) dateFilter.created_at.$gte = new Date(start_date);
    if (end_date) dateFilter.created_at.$lte = new Date(end_date);
  }

  // Get queue statistics
  const queueStatsAgg = await Queue.aggregate([
    { $match: { franchise_id: franchiseId, ...dateFilter } },
    {
      $group: {
        _id: null,
        total_queues: { $sum: 1 },
        total_customers_served: { $sum: '$current_size' },
        avg_wait_time: { $avg: '$average_wait_time' }
      }
    }
  ]);

  // Get service statistics
  const serviceStatsAgg = await QueueEntry.aggregate([
    {
      $lookup: {
        from: 'queues',
        localField: 'queue_id',
        foreignField: '_id',
        as: 'queue'
      }
    },
    { $unwind: '$queue' },
    { $match: { 'queue.franchise_id': franchiseId, status: 'completed', ...dateFilter } },
    {
      $group: {
        _id: null,
        completed_services: { $sum: 1 },
        avg_rating: { $avg: '$rating' }
      }
    }
  ]);

  // Get revenue statistics
  const revenueStatsAgg = await Payment.aggregate([
    {
      $lookup: {
        from: 'queueentries',
        localField: 'queue_entry_id',
        foreignField: '_id',
        as: 'queueEntry'
      }
    },
    { $unwind: '$queueEntry' },
    {
      $lookup: {
        from: 'queues',
        localField: 'queueEntry.queue_id',
        foreignField: '_id',
        as: 'queue'
      }
    },
    { $unwind: '$queue' },
    { $match: { 'queue.franchise_id': franchiseId, payment_status: 'completed', ...dateFilter } },
    {
      $group: {
        _id: null,
        total_revenue: { $sum: '$amount' },
        total_transactions: { $sum: 1 }
      }
    }
  ]);

  // Get staff statistics
  const staffStatsAgg = await User.aggregate([
    { $match: { franchise_id: franchiseId, is_active: true } },
    {
      $group: {
        _id: '$role',
        count: { $sum: 1 }
      }
    }
  ]);

  // Get customer statistics
  const customerStatsAgg = await Customer.aggregate([
    {
      $lookup: {
        from: 'queueentries',
        localField: '_id',
        foreignField: 'customer_id',
        as: 'queueEntries'
      }
    },
    {
      $lookup: {
        from: 'queues',
        localField: 'queueEntries.queue_id',
        foreignField: '_id',
        as: 'queues'
      }
    },
    { $match: { 'queues.franchise_id': franchiseId, ...dateFilter } },
    {
      $group: {
        _id: null,
        unique_customers: { $addToSet: '$_id' },
        total_visits: { $sum: { $size: '$queueEntries' } }
      }
    },
    {
      $project: {
        unique_customers: { $size: '$unique_customers' },
        total_visits: 1
      }
    }
  ]);

  // Get popular services
  const popularServicesAgg = await Service.aggregate([
    { $match: { franchise_id: franchiseId } },
    {
      $lookup: {
        from: 'queueentries',
        localField: '_id',
        foreignField: 'service_id',
        as: 'queueEntries'
      }
    },
    {
      $lookup: {
        from: 'queues',
        localField: 'queueEntries.queue_id',
        foreignField: '_id',
        as: 'queues'
      }
    },
    { $match: { 'queueEntries.status': 'completed', ...dateFilter } },
    {
      $project: {
        id: '$_id',
        name: 1,
        category: 1,
        booking_count: { $size: '$queueEntries' }
      }
    },
    { $sort: { booking_count: -1 } },
    { $limit: 5 }
  ]);

  res.json({
    success: true,
    stats: {
      queue_stats: queueStatsAgg[0] || { total_queues: 0, total_customers_served: 0, avg_wait_time: 0 },
      service_stats: serviceStatsAgg[0] || { completed_services: 0, avg_rating: null },
      revenue_stats: revenueStatsAgg[0] || { total_revenue: 0, total_transactions: 0 },
      staff_stats: staffStatsAgg,
      customer_stats: customerStatsAgg[0] || { unique_customers: 0, total_visits: 0 },
      popular_services: popularServicesAgg
    }
  });
}));

// Get franchise dashboard data
router.get('/:franchiseId/dashboard', 
  authenticateToken, 
  requireFranchiseAccess, 
  param('franchiseId').isMongoId().withMessage('Valid franchise ID is required'),
  asyncHandler(async (req, res) => {
  const { franchiseId } = req.params;
  const today = new Date().toISOString().split('T')[0];

  // Get today's queue
  const todayQueue = await Queue.findOne({
    franchise_id: franchiseId,
    date: today
  }).populate({
    path: 'queue_entries',
    populate: [
      { path: 'customer_id', select: 'first_name last_name' },
      { path: 'service_id', select: 'name duration' }
    ]
  });

  // Get active staff
  const activeStaff = await User.find({
    franchise_id: franchiseId,
    is_active: true,
    role: { $in: ['barber', 'manager'] }
  }).select('id first_name last_name role');

  // Get today's statistics
  const todayStatsAgg = await QueueEntry.aggregate([
    {
      $lookup: {
        from: 'queues',
        localField: 'queue_id',
        foreignField: '_id',
        as: 'queue'
      }
    },
    { $unwind: '$queue' },
    { $match: { 'queue.franchise_id': franchiseId, 'queue.date': today } },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 }
      }
    }
  ]);

  // Get recent customers
  const recentCustomers = await QueueEntry.find()
    .populate({
      path: 'queue_id',
      match: { franchise_id: franchiseId },
      select: 'franchise_id'
    })
    .populate('customer_id', 'first_name last_name phone')
    .populate('service_id', 'name')
    .sort({ created_at: -1 })
    .limit(10);

  // Filter out entries where queue_id is null (no matching franchise)
  const filteredRecentCustomers = recentCustomers.filter(entry => entry.queue_id);

  // Get upcoming appointments
  const upcomingAppointments = await Appointment.find({
    franchise_id: franchiseId,
    scheduled_date: {
      $gte: new Date(),
      $lte: new Date(Date.now() + 24 * 60 * 60 * 1000)
    },
    status: { $in: ['scheduled', 'confirmed'] }
  })
    .populate('customer_id', 'first_name last_name phone')
    .populate('service_id', 'name duration')
    .sort({ scheduled_date: 1 });

  res.json({
    success: true,
    dashboard: {
      today_queue: todayQueue,
      active_staff: activeStaff,
      today_stats: todayStatsAgg,
      recent_customers: filteredRecentCustomers,
      upcoming_appointments: upcomingAppointments
    }
  });
}));

// Update franchise settings
router.put('/:franchiseId/settings', 
  authenticateToken, 
  requireRole(['admin', 'manager']), 
  requireFranchiseAccess, 
  param('franchiseId').isMongoId().withMessage('Valid franchise ID is required'),
  body('settings').isObject().withMessage('Settings must be an object'),
  asyncHandler(async (req, res) => {
  const { franchiseId } = req.params;
  const { settings } = req.body;

  const franchise = await Franchise.findById(franchiseId);
  if (!franchise) {
    throw new AppError('Franchise not found', 404);
  }

  // Merge with existing settings
  const updatedSettings = {
    ...franchise.settings,
    ...settings
  };

  const updatedFranchise = await Franchise.findByIdAndUpdate(
    franchiseId,
    { settings: updatedSettings },
    { new: true }
  );

  res.json({
    success: true,
    message: 'Franchise settings updated successfully',
    settings: updatedFranchise.settings
  });
}));

module.exports = router;