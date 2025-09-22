const mongoose = require('mongoose');

const queueSchema = new mongoose.Schema({
  franchise_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Franchise',
    required: true
  },
  date: {
    type: Date,
    required: true,
    default: Date.now
  },
  status: {
    type: String,
    enum: ['active', 'paused', 'closed'],
    default: 'active'
  },
  max_capacity: {
    type: Number,
    required: true,
    default: 50,
    min: 1,
    max: 200
  },
  current_size: {
    type: Number,
    required: true,
    default: 0,
    min: 0
  },
  average_wait_time: {
    type: Number, // in minutes
    required: true,
    default: 0,
    min: 0
  },
  estimated_wait_time: {
    type: Number, // in minutes
    required: true,
    default: 0,
    min: 0
  },
  total_served: {
    type: Number,
    required: true,
    default: 0,
    min: 0
  },
  total_no_shows: {
    type: Number,
    required: true,
    default: 0,
    min: 0
  },
  total_cancelled: {
    type: Number,
    required: true,
    default: 0,
    min: 0
  },
  peak_hours: [{
    hour: { type: Number, min: 0, max: 23 },
    count: { type: Number, default: 0 }
  }],
  staff_assignments: [{
    staff_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    is_available: { type: Boolean, default: true },
    current_customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'QueueEntry'
    },
    customers_served_today: { type: Number, default: 0 },
    break_start: Date,
    break_end: Date
  }],
  queue_settings: {
    auto_advance: { type: Boolean, default: true },
    notification_enabled: { type: Boolean, default: true },
    estimated_service_time: { type: Number, default: 30 },
    buffer_time_minutes: { type: Number, default: 5 },
    max_wait_time_minutes: { type: Number, default: 120 }
  },
  analytics: {
    busiest_hour: Number,
    average_service_time: { type: Number, default: 0 },
    customer_satisfaction: { type: Number, default: 0, min: 0, max: 5 },
    revenue_today: { type: Number, default: 0 },
    efficiency_score: { type: Number, default: 0, min: 0, max: 100 }
  },
  last_updated: {
    type: Date,
    default: Date.now
  },
  notes: String,
  special_events: [{
    name: String,
    start_time: Date,
    end_time: Date,
    impact_factor: { type: Number, default: 1.0 }
  }]
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for queue utilization percentage
queueSchema.virtual('utilization_percentage').get(function() {
  return this.max_capacity > 0 ? Math.round((this.current_size / this.max_capacity) * 100) : 0;
});

// Virtual for available spots
queueSchema.virtual('available_spots').get(function() {
  return Math.max(0, this.max_capacity - this.current_size);
});

// Virtual for is_full
queueSchema.virtual('is_full').get(function() {
  return this.current_size >= this.max_capacity;
});

// Virtual for efficiency metrics
queueSchema.virtual('efficiency_metrics').get(function() {
  const totalProcessed = this.total_served + this.total_no_shows + this.total_cancelled;
  const successRate = totalProcessed > 0 ? (this.total_served / totalProcessed) * 100 : 0;
  const noShowRate = totalProcessed > 0 ? (this.total_no_shows / totalProcessed) * 100 : 0;
  
  return {
    success_rate: Math.round(successRate * 100) / 100,
    no_show_rate: Math.round(noShowRate * 100) / 100,
    total_processed: totalProcessed
  };
});

// Method to add customer to queue
queueSchema.methods.addCustomer = function() {
  if (this.current_size < this.max_capacity) {
    this.current_size += 1;
    this.last_updated = new Date();
    return this.save();
  }
  throw new Error('Queue is at maximum capacity');
};

// Method to remove customer from queue
queueSchema.methods.removeCustomer = function() {
  if (this.current_size > 0) {
    this.current_size -= 1;
    this.last_updated = new Date();
    return this.save();
  }
  return this.save();
};

// Method to serve customer
queueSchema.methods.serveCustomer = function() {
  this.total_served += 1;
  this.removeCustomer();
  return this.save();
};

// Method to mark no-show
queueSchema.methods.markNoShow = function() {
  this.total_no_shows += 1;
  this.removeCustomer();
  return this.save();
};

// Method to cancel customer
queueSchema.methods.cancelCustomer = function() {
  this.total_cancelled += 1;
  this.removeCustomer();
  return this.save();
};

// Method to update wait time estimates
queueSchema.methods.updateWaitTimes = function(newAverageTime) {
  this.average_wait_time = newAverageTime;
  this.estimated_wait_time = this.current_size * newAverageTime;
  this.last_updated = new Date();
  return this.save();
};

// Method to get available staff
queueSchema.methods.getAvailableStaff = function() {
  return this.staff_assignments.filter(staff => staff.is_available && !staff.current_customer);
};

// Method to assign staff to customer
queueSchema.methods.assignStaffToCustomer = function(staffId, queueEntryId) {
  const staff = this.staff_assignments.find(s => s.staff_id.toString() === staffId.toString());
  if (staff) {
    staff.current_customer = queueEntryId;
    staff.is_available = false;
    return this.save();
  }
  throw new Error('Staff member not found');
};

// Method to release staff from customer
queueSchema.methods.releaseStaff = function(staffId) {
  const staff = this.staff_assignments.find(s => s.staff_id.toString() === staffId.toString());
  if (staff) {
    staff.current_customer = null;
    staff.is_available = true;
    staff.customers_served_today += 1;
    return this.save();
  }
  throw new Error('Staff member not found');
};

// Indexes for efficient queries
queueSchema.index({ franchise_id: 1, date: 1 });
queueSchema.index({ status: 1 });
queueSchema.index({ date: 1 });
queueSchema.index({ 'staff_assignments.staff_id': 1 });

module.exports = mongoose.model('Queue', queueSchema);