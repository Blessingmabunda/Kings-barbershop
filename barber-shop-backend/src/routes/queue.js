const express = require('express');
const { body, query, param, validationResult } = require('express-validator');
const { Queue, QueueEntry, Customer, Service, User } = require('../config/database');
const { authenticateToken, requireRole, requireFranchiseAccess } = require('../middleware/auth');
const { asyncHandler, AppError } = require('../middleware/errorHandler');

const router = express.Router();

// Get queue for a specific franchise and date
router.get('/:franchiseId', 
  authenticateToken, 
  requireFranchiseAccess, 
  param('franchiseId').isMongoId().withMessage('Valid franchise ID is required'),
  query('date').optional().isISO8601().withMessage('Valid date is required'),
  asyncHandler(async (req, res) => {
  const { franchiseId } = req.params;
  const date = req.query.date || new Date().toISOString().split('T')[0];

  // Get or create today's queue
  let queue = await Queue.findOne({
    franchise_id: franchiseId,
    date: date
  });

  if (!queue) {
    queue = await Queue.create({
      franchise_id: franchiseId,
      date: date,
      status: 'active'
    });
  }

  // Get all queue entries for this queue
  const queueEntries = await QueueEntry.find({ queue_id: queue._id })
    .populate('customer_id', 'first_name last_name phone email')
    .populate('service_id', 'name category base_price duration')
    .populate('staff_id', 'first_name last_name')
    .sort({ queue_number: 1 });

  // Calculate queue statistics
  const stats = {
    total_customers: queueEntries.length,
    waiting_customers: queueEntries.filter(entry => entry.status === 'waiting').length,
    in_service_customers: queueEntries.filter(entry => entry.status === 'in_service').length,
    completed_customers: queueEntries.filter(entry => entry.status === 'completed').length,
    average_wait_time: queue.getAverageWaitTime(),
    estimated_wait_time: queue.getEstimatedWaitTime()
  };

  res.json({
    success: true,
    data: {
      queue: {
        id: queue._id,
        date: queue.date,
        status: queue.status,
        current_size: queue.current_size,
        max_capacity: queue.max_capacity,
        settings: queue.settings
      },
      entries: queueEntries,
      stats: stats
    }
  });
}));

// Add customer to queue
router.post('/:franchiseId/add', 
  authenticateToken, 
  requireFranchiseAccess, 
  param('franchiseId').isMongoId().withMessage('Valid franchise ID is required'),
  body('customer_id').optional().isMongoId().withMessage('Valid customer ID is required'),
  body('service_id').isMongoId().withMessage('Valid service ID is required'),
  body('customer_info').optional().isObject().withMessage('Customer info must be an object'),
  body('priority').optional().isIn(['low', 'normal', 'high', 'urgent']).withMessage('Invalid priority'),
  body('entry_type').optional().isIn(['walk_in', 'appointment', 'vip']).withMessage('Invalid entry type'),
  body('notes').optional().isString().withMessage('Notes must be a string'),
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
    customer_id,
    service_id,
    customer_info,
    priority = 'normal',
    entry_type = 'walk_in',
    notes
  } = req.body;

  const today = new Date().toISOString().split('T')[0];

  // Get or create today's queue
  let queue = await Queue.findOne({
    franchise_id: franchiseId,
    date: today
  });

  if (!queue) {
    queue = await Queue.create({
      franchise_id: franchiseId,
      date: today,
      status: 'active'
    });
  }

  // Check if queue is at capacity
  if (queue.current_size >= queue.max_capacity) {
    throw new AppError('Queue is at maximum capacity', 400);
  }

  // Verify service exists and belongs to franchise
  const service = await Service.findOne({
    _id: service_id,
    franchise_id: franchiseId
  });

  if (!service) {
    throw new AppError('Service not found', 404);
  }

  let customerId = customer_id;

  // If no customer_id provided, create new customer
  if (!customerId && customer_info) {
    const newCustomer = await Customer.create({
      first_name: customer_info.first_name,
      last_name: customer_info.last_name,
      phone: customer_info.phone,
      email: customer_info.email,
      preferences: customer_info.preferences || {},
      franchise_id: franchiseId
    });
    customerId = newCustomer._id;
  }

  if (!customerId) {
    throw new AppError('Customer ID or customer info is required', 400);
  }

  // Get next queue number
  const lastEntry = await QueueEntry.findOne({ queue_id: queue._id })
    .sort({ queue_number: -1 });

  const queueNumber = lastEntry ? lastEntry.queue_number + 1 : 1;

  // Calculate estimated wait time
  const estimatedWaitTime = queue.getEstimatedWaitTime();

  // Create queue entry
  const queueEntry = await QueueEntry.create({
    queue_id: queue._id,
    customer_id: customerId,
    service_id: service_id,
    queue_number: queueNumber,
    status: 'waiting',
    priority: priority,
    entry_type: entry_type,
    estimated_wait_time: estimatedWaitTime,
    notes: notes,
    joined_at: new Date()
  });

  // Update queue size
  await queue.updateCurrentSize();

  // Get complete entry data
  const completeEntry = await QueueEntry.findById(queueEntry._id)
    .populate('customer_id', 'first_name last_name phone')
    .populate('service_id', 'name category base_price duration');

  // Broadcast update via WebSocket (if socketService is available)
  if (req.app.locals.socketService) {
    req.app.locals.socketService.broadcastQueueUpdate(franchiseId, {
      type: 'customer_added',
      entry: completeEntry,
      queue_size: queue.current_size + 1
    });
  }

  res.status(201).json({
    success: true,
    message: 'Customer added to queue successfully',
    entry: completeEntry,
    queue_number: queueNumber,
    estimated_wait_time: estimatedWaitTime
  });
}));

// Call next customer
router.post('/:franchiseId/call-next', 
  authenticateToken, 
  requireFranchiseAccess, 
  param('franchiseId').isMongoId().withMessage('Valid franchise ID is required'),
  body('staff_id').optional().isMongoId().withMessage('Valid staff ID is required'),
  asyncHandler(async (req, res) => {
  const { franchiseId } = req.params;
  const { staff_id } = req.body;
  const today = new Date().toISOString().split('T')[0];

  const queue = await Queue.findOne({
    franchise_id: franchiseId,
    date: today
  });

  if (!queue) {
    throw new AppError('No active queue found', 404);
  }

  // Find next customer in queue
  const nextEntry = await QueueEntry.findOne({
    queue_id: queue._id,
    status: 'waiting'
  })
    .populate('customer_id', 'first_name last_name phone')
    .populate('service_id', 'name duration')
    .sort({ priority: -1, joined_at: 1 }); // Higher priority first, then by arrival time

  if (!nextEntry) {
    return res.json({
      success: true,
      message: 'No customers waiting in queue',
      entry: null
    });
  }

  // Update entry status
  await nextEntry.callCustomer(staff_id || req.user.id);

  // Broadcast update
  if (req.app.locals.socketService) {
    req.app.locals.socketService.broadcastQueueUpdate(franchiseId, {
      type: 'customer_called',
      entry: nextEntry,
      staff_id: staff_id || req.user.id
    });
  }

  res.json({
    success: true,
    message: 'Customer called successfully',
    entry: nextEntry
  });
}));

// Update queue entry status
router.put('/:franchiseId/entry/:entryId', 
  authenticateToken, 
  requireFranchiseAccess, 
  param('franchiseId').isMongoId().withMessage('Valid franchise ID is required'),
  param('entryId').isMongoId().withMessage('Valid entry ID is required'),
  body('status').isIn(['waiting', 'called', 'in_service', 'completed', 'no_show', 'cancelled']).withMessage('Invalid status'),
  body('staff_id').optional().isMongoId().withMessage('Valid staff ID is required'),
  body('notes').optional().isString().withMessage('Notes must be a string'),
  asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: errors.array()
    });
  }

  const { franchiseId, entryId } = req.params;
  const { status, staff_id, notes } = req.body;

  const entry = await QueueEntry.findById(entryId)
    .populate({
      path: 'queue_id',
      match: { franchise_id: franchiseId }
    });

  if (!entry || !entry.queue_id) {
    throw new AppError('Queue entry not found', 404);
  }

  // Update entry based on status
  switch (status) {
    case 'called':
      await entry.callCustomer(staff_id || req.user.id);
      break;
    case 'in_service':
      await entry.startService(staff_id || req.user.id);
      break;
    case 'completed':
      await entry.completeService();
      break;
    case 'no_show':
    case 'cancelled':
      entry.status = status;
      entry.completed_at = new Date();
      if (notes) entry.notes = notes;
      await entry.save();
      break;
    default:
      entry.status = status;
      if (notes) entry.notes = notes;
      await entry.save();
  }

  // Update queue metrics
  const queue = await Queue.findById(entry.queue_id);
  await queue.updateCurrentSize();

  // Broadcast update
  if (req.app.locals.socketService) {
    req.app.locals.socketService.broadcastQueueUpdate(franchiseId, {
      type: 'entry_updated',
      entry: entry,
      status: status
    });
  }

  res.json({
    success: true,
    message: 'Queue entry updated successfully',
    entry: entry
  });
}));

// Remove customer from queue
router.delete('/:franchiseId/entry/:entryId', 
  authenticateToken, 
  requireFranchiseAccess, 
  param('franchiseId').isMongoId().withMessage('Valid franchise ID is required'),
  param('entryId').isMongoId().withMessage('Valid entry ID is required'),
  body('reason').optional().isString().withMessage('Reason must be a string'),
  asyncHandler(async (req, res) => {
  const { franchiseId, entryId } = req.params;
  const { reason } = req.body;

  const entry = await QueueEntry.findById(entryId)
    .populate({
      path: 'queue_id',
      match: { franchise_id: franchiseId }
    });

  if (!entry || !entry.queue_id) {
    throw new AppError('Queue entry not found', 404);
  }

  // Mark as cancelled instead of deleting
  entry.status = 'cancelled';
  entry.completed_at = new Date();
  if (reason) entry.notes = reason;
  await entry.save();

  // Update queue size
  const queue = await Queue.findById(entry.queue_id);
  await queue.updateCurrentSize();

  // Broadcast update
  if (req.app.locals.socketService) {
    req.app.locals.socketService.broadcastQueueUpdate(franchiseId, {
      type: 'customer_removed',
      entry_id: entryId,
      reason: reason
    });
  }

  res.json({
    success: true,
    message: 'Customer removed from queue successfully'
  });
}));

// Get queue statistics
router.get('/:franchiseId/stats', 
  authenticateToken, 
  requireFranchiseAccess, 
  param('franchiseId').isMongoId().withMessage('Valid franchise ID is required'),
  query('date').optional().isISO8601().withMessage('Valid date is required'),
  asyncHandler(async (req, res) => {
  const { franchiseId } = req.params;
  const date = req.query.date || new Date().toISOString().split('T')[0];

  const queue = await Queue.findOne({
    franchise_id: franchiseId,
    date: date
  });

  if (!queue) {
    return res.json({
      success: true,
      stats: {
        total_customers: 0,
        completed_services: 0,
        average_wait_time: 0,
        current_queue_size: 0,
        no_shows: 0,
        cancellations: 0
      }
    });
  }

  const stats = await queue.getQueueStats();

  res.json({
    success: true,
    stats: stats
  });
}));

// Update queue settings
router.put('/:franchiseId/settings', 
  authenticateToken, 
  requireRole(['admin', 'manager']), 
  requireFranchiseAccess, 
  param('franchiseId').isMongoId().withMessage('Valid franchise ID is required'),
  body('max_capacity').optional().isInt({ min: 1 }).withMessage('Max capacity must be a positive integer'),
  body('settings').optional().isObject().withMessage('Settings must be an object'),
  asyncHandler(async (req, res) => {
  const { franchiseId } = req.params;
  const { max_capacity, settings } = req.body;
  const today = new Date().toISOString().split('T')[0];

  let queue = await Queue.findOne({
    franchise_id: franchiseId,
    date: today
  });

  if (!queue) {
    queue = await Queue.create({
      franchise_id: franchiseId,
      date: today,
      status: 'active'
    });
  }

  if (max_capacity) queue.max_capacity = max_capacity;
  if (settings) queue.settings = { ...queue.settings, ...settings };

  await queue.save();

  res.json({
    success: true,
    message: 'Queue settings updated successfully',
    queue: {
      id: queue._id,
      max_capacity: queue.max_capacity,
      settings: queue.settings
    }
  });
}));

module.exports = router;