const express = require('express');
const { body, validationResult } = require('express-validator');
const { Customer, Appointment, QueueEntry } = require('../config/database');
const { authenticateToken } = require('../middleware/auth');
const { asyncHandler, AppError } = require('../middleware/errorHandler');

const router = express.Router();

// Get all customers with pagination and filtering
router.get('/', authenticateToken, asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 10,
    search,
    status,
    franchise_id,
    sort_by = 'created_at',
    sort_order = 'desc'
  } = req.query;

  const pageNum = parseInt(page);
  const limitNum = parseInt(limit);
  const skip = (pageNum - 1) * limitNum;

  // Build filter object
  let filter = {};

  // Franchise filter (non-admin users can only see their franchise customers)
  if (req.user.role !== 'admin') {
    filter.franchise_id = req.user.franchise_id;
  } else if (franchise_id) {
    filter.franchise_id = franchise_id;
  }

  // Status filter
  if (status) {
    filter.status = status;
  }

  // Search filter
  if (search) {
    filter.$or = [
      { first_name: { $regex: search, $options: 'i' } },
      { last_name: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
      { phone: { $regex: search, $options: 'i' } }
    ];
  }

  // Sort object
  const sortObj = {};
  sortObj[sort_by] = sort_order === 'asc' ? 1 : -1;

  // Execute queries
  const [customers, total] = await Promise.all([
    Customer.find(filter)
      .populate('franchise_id', 'name')
      .sort(sortObj)
      .skip(skip)
      .limit(limitNum),
    Customer.countDocuments(filter)
  ]);

  res.json({
    success: true,
    data: {
      customers,
      pagination: {
        current_page: pageNum,
        total_pages: Math.ceil(total / limitNum),
        total_records: total,
        per_page: limitNum
      }
    }
  });
}));

// Get customer by ID
router.get('/:id', authenticateToken, asyncHandler(async (req, res) => {
  const customer = await Customer.findById(req.params.id)
    .populate('franchise_id', 'name address phone');

  if (!customer) {
    throw new AppError('Customer not found', 404);
  }

  // Check if user has access to this customer
  if (req.user.role !== 'admin' && customer.franchise_id._id.toString() !== req.user.franchise_id.toString()) {
    throw new AppError('Access denied', 403);
  }

  res.json({
    success: true,
    data: customer
  });
}));

// Create new customer
router.post('/', 
  authenticateToken,
  body('first_name').notEmpty().withMessage('First name is required'),
  body('last_name').notEmpty().withMessage('Last name is required'),
  body('email').isEmail().withMessage('Valid email is required'),
  body('phone').isMobilePhone().withMessage('Valid phone number is required'),
  body('date_of_birth').optional().isISO8601().withMessage('Valid date of birth is required'),
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
    first_name,
    last_name,
    email,
    phone,
    date_of_birth,
    address,
    preferences,
    notes
  } = req.body;

  // Check if customer already exists
  const existingCustomer = await Customer.findOne({
    $or: [
      { email: email },
      { phone: phone }
    ]
  });

  if (existingCustomer) {
    return res.status(400).json({
      success: false,
      error: 'Customer already exists',
      message: 'A customer with this email or phone number already exists'
    });
  }

  // Create new customer
  const customer = await Customer.create({
    first_name,
    last_name,
    email,
    phone,
    date_of_birth,
    address,
    preferences,
    notes,
    franchise_id: req.user.franchise_id,
    customer_since: new Date()
  });

  res.status(201).json({
    success: true,
    message: 'Customer created successfully',
    data: customer
  });
}));

// Update customer
router.put('/:id', 
  authenticateToken,
  body('first_name').optional().notEmpty().withMessage('First name cannot be empty'),
  body('last_name').optional().notEmpty().withMessage('Last name cannot be empty'),
  body('email').optional().isEmail().withMessage('Valid email is required'),
  body('phone').optional().isMobilePhone().withMessage('Valid phone number is required'),
  body('date_of_birth').optional().isISO8601().withMessage('Valid date of birth is required'),
  asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: errors.array()
    });
  }

  const customer = await Customer.findById(req.params.id);
  if (!customer) {
    throw new AppError('Customer not found', 404);
  }

  // Check if user has access to this customer
  if (req.user.role !== 'admin' && customer.franchise_id.toString() !== req.user.franchise_id.toString()) {
    throw new AppError('Access denied', 403);
  }

  const { email, phone } = req.body;

  // Check if email or phone is already taken by another customer
  if (email || phone) {
    const filter = { _id: { $ne: req.params.id } };
    const orConditions = [];
    
    if (email) orConditions.push({ email: email });
    if (phone) orConditions.push({ phone: phone });
    
    if (orConditions.length > 0) {
      filter.$or = orConditions;
      
      const existingCustomer = await Customer.findOne(filter);
      if (existingCustomer) {
        return res.status(400).json({
          success: false,
          error: 'Email or phone already taken'
        });
      }
    }
  }

  const updatedCustomer = await Customer.findByIdAndUpdate(
    req.params.id,
    req.body,
    { new: true, runValidators: true }
  );

  res.json({
    success: true,
    message: 'Customer updated successfully',
    data: updatedCustomer
  });
}));

// Delete customer
router.delete('/:id', authenticateToken, asyncHandler(async (req, res) => {
  const customer = await Customer.findById(req.params.id);
  if (!customer) {
    throw new AppError('Customer not found', 404);
  }

  // Check if user has access to this customer
  if (req.user.role !== 'admin' && customer.franchise_id.toString() !== req.user.franchise_id.toString()) {
    throw new AppError('Access denied', 403);
  }

  // Check if customer has any active appointments or queue entries
  const [activeAppointments, activeQueueEntries] = await Promise.all([
    Appointment.countDocuments({
      customer_id: req.params.id,
      status: { $in: ['scheduled', 'in_progress'] }
    }),
    QueueEntry.countDocuments({
      customer_id: req.params.id,
      status: { $in: ['waiting', 'in_service'] }
    })
  ]);

  if (activeAppointments > 0 || activeQueueEntries > 0) {
    return res.status(400).json({
      success: false,
      error: 'Cannot delete customer',
      message: 'Customer has active appointments or queue entries'
    });
  }

  await Customer.findByIdAndDelete(req.params.id);

  res.json({
    success: true,
    message: 'Customer deleted successfully'
  });
}));

// Get customer's appointment history
router.get('/:id/appointments', authenticateToken, asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 10,
    status,
    start_date,
    end_date
  } = req.query;

  const pageNum = parseInt(page);
  const limitNum = parseInt(limit);
  const skip = (pageNum - 1) * limitNum;

  const customer = await Customer.findById(req.params.id);
  if (!customer) {
    throw new AppError('Customer not found', 404);
  }

  // Check if user has access to this customer
  if (req.user.role !== 'admin' && customer.franchise_id.toString() !== req.user.franchise_id.toString()) {
    throw new AppError('Access denied', 403);
  }

  // Build filter
  let filter = { customer_id: req.params.id };

  if (status) {
    filter.status = status;
  }

  if (start_date || end_date) {
    filter.appointment_date = {};
    if (start_date) filter.appointment_date.$gte = new Date(start_date);
    if (end_date) filter.appointment_date.$lte = new Date(end_date);
  }

  const [appointments, total] = await Promise.all([
    Appointment.find(filter)
      .populate('service_id', 'name duration base_price')
      .populate('staff_id', 'first_name last_name')
      .sort({ appointment_date: -1 })
      .skip(skip)
      .limit(limitNum),
    Appointment.countDocuments(filter)
  ]);

  res.json({
    success: true,
    data: {
      appointments,
      pagination: {
        current_page: pageNum,
        total_pages: Math.ceil(total / limitNum),
        total_records: total,
        per_page: limitNum
      }
    }
  });
}));

// Get customer statistics
router.get('/:id/stats', authenticateToken, asyncHandler(async (req, res) => {
  const customer = await Customer.findById(req.params.id);
  if (!customer) {
    throw new AppError('Customer not found', 404);
  }

  // Check if user has access to this customer
  if (req.user.role !== 'admin' && customer.franchise_id.toString() !== req.user.franchise_id.toString()) {
    throw new AppError('Access denied', 403);
  }

  const stats = await Appointment.aggregate([
    { $match: { customer_id: customer._id } },
    {
      $group: {
        _id: null,
        total_appointments: { $sum: 1 },
        completed_appointments: {
          $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
        },
        cancelled_appointments: {
          $sum: { $cond: [{ $eq: ['$status', 'cancelled'] }, 1, 0] }
        },
        total_spent: { $sum: '$final_price' },
        average_spent: { $avg: '$final_price' }
      }
    }
  ]);

  const customerStats = stats[0] || {
    total_appointments: 0,
    completed_appointments: 0,
    cancelled_appointments: 0,
    total_spent: 0,
    average_spent: 0
  };

  // Get favorite services
  const favoriteServices = await Appointment.aggregate([
    { $match: { customer_id: customer._id, status: 'completed' } },
    { $group: { _id: '$service_id', count: { $sum: 1 } } },
    { $sort: { count: -1 } },
    { $limit: 5 },
    {
      $lookup: {
        from: 'services',
        localField: '_id',
        foreignField: '_id',
        as: 'service'
      }
    },
    { $unwind: '$service' },
    {
      $project: {
        service_name: '$service.name',
        visit_count: '$count'
      }
    }
  ]);

  res.json({
    success: true,
    data: {
      ...customerStats,
      favorite_services: favoriteServices,
      loyalty_points: customer.loyalty_points,
      customer_since: customer.customer_since
    }
  });
}));

module.exports = router;