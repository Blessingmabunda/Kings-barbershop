const express = require('express');
const { body, query, param, validationResult } = require('express-validator');
const mongoose = require('mongoose');
const Service = require('../models/Service');
const QueueEntry = require('../models/QueueEntry');
const Customer = require('../models/Customer');
const Payment = require('../models/Payment');
const Appointment = require('../models/Appointment');
const { authenticateToken, requireRole, requireFranchiseAccess } = require('../middleware/auth');
const { asyncHandler, AppError } = require('../middleware/errorHandler');

const router = express.Router();

// Get all services for a franchise
router.get('/:franchiseId', 
  authenticateToken, 
  requireFranchiseAccess, 
  param('franchiseId').isMongoId().withMessage('Valid franchise ID is required'),
  query('category').optional().isString().withMessage('Category must be a string'),
  query('is_active').optional().isBoolean().withMessage('is_active must be a boolean'),
  query('sort_by').optional().isIn(['name', 'category', 'base_price', 'duration', 'popularity']).withMessage('Invalid sort field'),
  query('sort_order').optional().isIn(['asc', 'desc']).withMessage('Sort order must be asc or desc'),
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
  const { category, is_active, sort_by = 'name', sort_order = 'asc' } = req.query;

  // Build filter
  let filter = { franchise_id: franchiseId };
  
  if (category) {
    filter.category = category;
  }
  
  if (is_active !== undefined) {
    filter.is_active = is_active === 'true';
  }

  // Build sort object
  const sortObj = {};
  sortObj[sort_by] = sort_order === 'desc' ? -1 : 1;

  // Get services with booking counts using aggregation
  const servicesWithStats = await Service.aggregate([
    { $match: filter },
    {
      $lookup: {
        from: 'queueentries',
        localField: '_id',
        foreignField: 'service_id',
        as: 'queue_entries'
      }
    },
    {
      $addFields: {
        total_bookings: { $size: '$queue_entries' }
      }
    },
    { $sort: sortObj },
    {
      $project: {
        queue_entries: 0
      }
    }
  ]);

  // Get unique categories
  const categories = await Service.distinct('category', { 
    franchise_id: franchiseId, 
    is_active: true 
  });

  res.json({
    success: true,
    services: servicesWithStats,
    categories: categories.filter(Boolean)
  });
}));

// Get service by ID
router.get('/:franchiseId/service/:serviceId', 
  authenticateToken, 
  requireFranchiseAccess, 
  param('franchiseId').isMongoId().withMessage('Valid franchise ID is required'),
  param('serviceId').isMongoId().withMessage('Valid service ID is required'),
  asyncHandler(async (req, res) => {
  const { franchiseId, serviceId } = req.params;

  const service = await Service.findOne({
    _id: serviceId,
    franchise_id: franchiseId
  });

  if (!service) {
    throw new AppError('Service not found', 404);
  }

  // Get recent queue entries for this service
  const recentEntries = await QueueEntry.find({ service_id: serviceId })
    .populate('customer_id', 'first_name last_name')
    .sort({ created_at: -1 })
    .limit(10)
    .select('_id status created_at completed_at');

  // Calculate service statistics
  const totalBookings = await QueueEntry.countDocuments({ service_id: serviceId });

  const completedBookings = await QueueEntry.countDocuments({
    service_id: serviceId,
    status: 'completed'
  });

  // Calculate average rating
  const ratingStats = await QueueEntry.aggregate([
    {
      $match: {
        service_id: new mongoose.Types.ObjectId(serviceId),
        status: 'completed',
        rating: { $ne: null }
      }
    },
    {
      $group: {
        _id: null,
        averageRating: { $avg: '$rating' }
      }
    }
  ]);

  // Calculate total revenue
  const revenueStats = await Payment.aggregate([
    {
      $lookup: {
        from: 'queueentries',
        localField: 'queue_entry_id',
        foreignField: '_id',
        as: 'queue_entry'
      }
    },
    {
      $unwind: '$queue_entry'
    },
    {
      $match: {
        'queue_entry.service_id': new mongoose.Types.ObjectId(serviceId),
        payment_status: 'completed'
      }
    },
    {
      $group: {
        _id: null,
        totalRevenue: { $sum: '$amount' }
      }
    }
  ]);

  const averageRating = ratingStats.length > 0 ? parseFloat(ratingStats[0].averageRating.toFixed(2)) : null;
  const totalRevenue = revenueStats.length > 0 ? parseFloat(revenueStats[0].totalRevenue.toFixed(2)) : 0;

  res.json({
    success: true,
    service: {
      ...service.toObject(),
      recent_entries: recentEntries,
      statistics: {
        total_bookings: totalBookings,
        completed_bookings: completedBookings,
        average_rating: averageRating,
        total_revenue: totalRevenue
      }
    }
  });
}));

// Create new service
router.post('/:franchiseId', 
  authenticateToken, 
  requireRole(['admin', 'manager']), 
  requireFranchiseAccess, 
  param('franchiseId').isMongoId().withMessage('Valid franchise ID is required'),
  body('name').notEmpty().withMessage('Service name is required'),
  body('category').notEmpty().withMessage('Category is required'),
  body('base_price').isFloat({ min: 0 }).withMessage('Base price must be a positive number'),
  body('duration').isInt({ min: 1 }).withMessage('Duration must be a positive integer (minutes)'),
  body('description').optional().isString().withMessage('Description must be a string'),
  body('requirements').optional().isArray().withMessage('Requirements must be an array'),
  body('pricing_tiers').optional().isObject().withMessage('Pricing tiers must be an object'),
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
  const {
    name,
    category,
    base_price,
    duration,
    description,
    requirements,
    pricing_tiers,
    is_active = true
  } = req.body;

  // Check if service with same name exists in this franchise
  const existingService = await Service.findOne({
    franchise_id: franchiseId,
    name: name
  });

  if (existingService) {
    return res.status(400).json({
      success: false,
      error: 'Service with this name already exists in this franchise'
    });
  }

  const service = await Service.create({
    franchise_id: franchiseId,
    name,
    category,
    base_price,
    duration,
    description,
    requirements: requirements || [],
    pricing_tiers: pricing_tiers || {},
    is_active
  });

  res.status(201).json({
    success: true,
    message: 'Service created successfully',
    service
  });
}));

// Update service
router.put('/:franchiseId/service/:serviceId', 
  authenticateToken, 
  requireRole(['admin', 'manager']), 
  requireFranchiseAccess, 
  param('franchiseId').isMongoId().withMessage('Valid franchise ID is required'),
  param('serviceId').isMongoId().withMessage('Valid service ID is required'),
  body('name').optional().notEmpty().withMessage('Service name cannot be empty'),
  body('category').optional().notEmpty().withMessage('Category cannot be empty'),
  body('base_price').optional().isFloat({ min: 0 }).withMessage('Base price must be a positive number'),
  body('duration').optional().isInt({ min: 1 }).withMessage('Duration must be a positive integer (minutes)'),
  body('description').optional().isString().withMessage('Description must be a string'),
  body('requirements').optional().isArray().withMessage('Requirements must be an array'),
  body('pricing_tiers').optional().isObject().withMessage('Pricing tiers must be an object'),
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

  const { franchiseId, serviceId } = req.params;
  const updateData = req.body;

  const service = await Service.findOne({
    _id: serviceId,
    franchise_id: franchiseId
  });

  if (!service) {
    throw new AppError('Service not found', 404);
  }

  // Check for duplicate name if name is being updated
  if (updateData.name && updateData.name !== service.name) {
    const existingService = await Service.findOne({
      franchise_id: franchiseId,
      name: updateData.name,
      _id: { $ne: serviceId }
    });

    if (existingService) {
      return res.status(400).json({
        success: false,
        error: 'Service with this name already exists in this franchise'
      });
    }
  }

  const updatedService = await Service.findByIdAndUpdate(
    serviceId,
    updateData,
    { new: true, runValidators: true }
  );

  res.json({
    success: true,
    message: 'Service updated successfully',
    service: updatedService
  });
}));

// Delete service (soft delete)
router.delete('/:franchiseId/service/:serviceId', 
  authenticateToken, 
  requireRole(['admin', 'manager']), 
  requireFranchiseAccess, 
  param('franchiseId').isMongoId().withMessage('Valid franchise ID is required'),
  param('serviceId').isMongoId().withMessage('Valid service ID is required'),
  asyncHandler(async (req, res) => {
  const { franchiseId, serviceId } = req.params;

  const service = await Service.findOne({
    _id: serviceId,
    franchise_id: franchiseId
  });

  if (!service) {
    throw new AppError('Service not found', 404);
  }

  // Check if service has active queue entries or future appointments
  const activeEntries = await QueueEntry.countDocuments({
    service_id: serviceId,
    status: { $in: ['waiting', 'called', 'in_service'] }
  });

  const futureAppointments = await Appointment.countDocuments({
    service_id: serviceId,
    scheduled_date: { $gt: new Date() },
    status: { $in: ['scheduled', 'confirmed'] }
  });

  if (activeEntries > 0 || futureAppointments > 0) {
    return res.status(400).json({
      success: false,
      error: 'Cannot delete service with active queue entries or future appointments'
    });
  }

  // Soft delete by marking as inactive
  await Service.findByIdAndUpdate(serviceId, {
    is_active: false,
    deleted_at: new Date()
  });

  res.json({
    success: true,
    message: 'Service deleted successfully'
  });
}));

// Get service analytics
router.get('/:franchiseId/service/:serviceId/analytics', 
  authenticateToken, 
  requireFranchiseAccess, 
  param('franchiseId').isMongoId().withMessage('Valid franchise ID is required'),
  param('serviceId').isMongoId().withMessage('Valid service ID is required'),
  query('start_date').optional().isISO8601().withMessage('Valid start date is required'),
  query('end_date').optional().isISO8601().withMessage('Valid end date is required'),
  asyncHandler(async (req, res) => {
  const { franchiseId, serviceId } = req.params;
  const { start_date, end_date } = req.query;

  const service = await Service.findOne({
    _id: serviceId,
    franchise_id: franchiseId
  });

  if (!service) {
    throw new AppError('Service not found', 404);
  }

  // Build date filter
  let dateFilter = { service_id: new mongoose.Types.ObjectId(serviceId) };
  if (start_date || end_date) {
    dateFilter.created_at = {};
    if (start_date) dateFilter.created_at.$gte = new Date(start_date);
    if (end_date) dateFilter.created_at.$lte = new Date(end_date);
  }

  // Get booking statistics
  const bookingStats = await QueueEntry.aggregate([
    { $match: dateFilter },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 }
      }
    },
    {
      $project: {
        status: '$_id',
        count: 1,
        _id: 0
      }
    }
  ]);

  // Get revenue statistics
  const revenueStats = await Payment.aggregate([
    {
      $lookup: {
        from: 'queueentries',
        localField: 'queue_entry_id',
        foreignField: '_id',
        as: 'queue_entry'
      }
    },
    {
      $unwind: '$queue_entry'
    },
    {
      $match: {
        'queue_entry.service_id': new mongoose.Types.ObjectId(serviceId),
        payment_status: 'completed',
        ...(start_date || end_date ? {
          created_at: {
            ...(start_date && { $gte: new Date(start_date) }),
            ...(end_date && { $lte: new Date(end_date) })
          }
        } : {})
      }
    },
    {
      $group: {
        _id: null,
        total_revenue: { $sum: '$amount' },
        average_revenue: { $avg: '$amount' },
        total_transactions: { $sum: 1 }
      }
    }
  ]);

  // Get daily booking trends
  const dailyTrends = await QueueEntry.aggregate([
    {
      $match: {
        service_id: new mongoose.Types.ObjectId(serviceId),
        status: 'completed',
        ...(start_date || end_date ? {
          completed_at: {
            ...(start_date && { $gte: new Date(start_date) }),
            ...(end_date && { $lte: new Date(end_date) })
          }
        } : {})
      }
    },
    {
      $group: {
        _id: {
          $dateToString: { format: '%Y-%m-%d', date: '$completed_at' }
        },
        bookings: { $sum: 1 }
      }
    },
    {
      $project: {
        date: '$_id',
        bookings: 1,
        _id: 0
      }
    },
    { $sort: { date: 1 } }
  ]);

  // Get peak hours
  const peakHours = await QueueEntry.aggregate([
    {
      $match: {
        service_id: new mongoose.Types.ObjectId(serviceId),
        status: 'completed',
        ...(start_date || end_date ? {
          completed_at: {
            ...(start_date && { $gte: new Date(start_date) }),
            ...(end_date && { $lte: new Date(end_date) })
          }
        } : {})
      }
    },
    {
      $group: {
        _id: { $hour: '$completed_at' },
        bookings: { $sum: 1 }
      }
    },
    {
      $project: {
        hour: '$_id',
        bookings: 1,
        _id: 0
      }
    },
    { $sort: { bookings: -1 } }
  ]);

  // Get customer satisfaction
  const satisfactionStats = await QueueEntry.aggregate([
    {
      $match: {
        service_id: new mongoose.Types.ObjectId(serviceId),
        status: 'completed',
        rating: { $ne: null },
        ...(start_date || end_date ? {
          created_at: {
            ...(start_date && { $gte: new Date(start_date) }),
            ...(end_date && { $lte: new Date(end_date) })
          }
        } : {})
      }
    },
    {
      $group: {
        _id: null,
        average_rating: { $avg: '$rating' },
        total_ratings: { $sum: 1 }
      }
    }
  ]);

  res.json({
    success: true,
    analytics: {
      service: {
        id: service._id,
        name: service.name,
        category: service.category
      },
      booking_stats: bookingStats,
      revenue_stats: revenueStats[0] || { total_revenue: 0, average_revenue: 0, total_transactions: 0 },
      daily_trends: dailyTrends,
      peak_hours: peakHours,
      satisfaction: satisfactionStats[0] || { average_rating: null, total_ratings: 0 }
    }
  });
}));

// Update service pricing
router.put('/:franchiseId/service/:serviceId/pricing', 
  authenticateToken, 
  requireRole(['admin', 'manager']), 
  requireFranchiseAccess, 
  param('franchiseId').isMongoId().withMessage('Valid franchise ID is required'),
  param('serviceId').isMongoId().withMessage('Valid service ID is required'),
  body('base_price').optional().isFloat({ min: 0 }).withMessage('Base price must be a positive number'),
  body('pricing_tiers').optional().isObject().withMessage('Pricing tiers must be an object'),
  asyncHandler(async (req, res) => {
  const { franchiseId, serviceId } = req.params;
  const { base_price, pricing_tiers } = req.body;

  const service = await Service.findOne({
    _id: serviceId,
    franchise_id: franchiseId
  });

  if (!service) {
    throw new AppError('Service not found', 404);
  }

  const updateData = {};
  if (base_price !== undefined) updateData.base_price = base_price;
  if (pricing_tiers !== undefined) updateData.pricing_tiers = pricing_tiers;

  const updatedService = await Service.findByIdAndUpdate(
    serviceId,
    updateData,
    { new: true, runValidators: true }
  );

  res.json({
    success: true,
    message: 'Service pricing updated successfully',
    service: {
      id: updatedService._id,
      name: updatedService.name,
      base_price: updatedService.base_price,
      pricing_tiers: updatedService.pricing_tiers
    }
  });
}));

// Increment service popularity
router.post('/:franchiseId/service/:serviceId/popularity', 
  authenticateToken, 
  requireFranchiseAccess, 
  param('franchiseId').isMongoId().withMessage('Valid franchise ID is required'),
  param('serviceId').isMongoId().withMessage('Valid service ID is required'),
  asyncHandler(async (req, res) => {
  const { franchiseId, serviceId } = req.params;

  const service = await Service.findOne({
    _id: serviceId,
    franchise_id: franchiseId
  });

  if (!service) {
    throw new AppError('Service not found', 404);
  }

  await service.incrementPopularity();

  res.json({
    success: true,
    message: 'Service popularity updated',
    popularity: service.popularity
  });
}));

module.exports = router;