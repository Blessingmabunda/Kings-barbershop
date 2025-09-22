const mongoose = require('mongoose');

const queueEntrySchema = new mongoose.Schema({
  queue_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Queue',
    required: true
  },
  customer_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer',
    required: true
  },
  appointment_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Appointment',
    required: false
  },
  service_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Service',
    required: true
  },
  staff_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false
  },
  position: {
    type: Number,
    required: true,
    min: 1
  },
  status: {
    type: String,
    enum: ['waiting', 'called', 'in_service', 'completed', 'cancelled', 'no_show', 'skipped'],
    default: 'waiting'
  },
  priority: {
    type: String,
    enum: ['low', 'normal', 'high', 'urgent'],
    default: 'normal'
  },
  entry_type: {
    type: String,
    enum: ['walk_in', 'appointment', 'online_booking', 'phone_booking'],
    required: true
  },
  estimated_wait_time: {
    type: Number, // in minutes
    required: true,
    default: 0,
    min: 0
  },
  actual_wait_time: {
    type: Number, // in minutes
    min: 0
  },
  estimated_service_time: {
    type: Number, // in minutes
    required: true,
    default: 30,
    min: 15,
    max: 300
  },
  actual_service_time: {
    type: Number, // in minutes
    min: 0,
    max: 500
  },
  check_in_time: {
    type: Date,
    required: true,
    default: Date.now
  },
  called_time: {
    type: Date
  },
  service_start_time: {
    type: Date
  },
  service_end_time: {
    type: Date
  },
  completion_time: {
    type: Date
  },
  customer_info: {
    name: {
      type: String,
      required: true
    },
    phone: {
      type: String,
      required: true
    },
    email: String,
    special_requests: String,
    allergies: [String],
    preferred_staff: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  },
  service_details: {
    service_name: String,
    estimated_duration: Number,
    price: {
      type: Number,
      min: 0
    },
    special_instructions: String
  },
  notifications: {
    sms_sent: { type: Boolean, default: false },
    email_sent: { type: Boolean, default: false },
    reminder_sent: { type: Boolean, default: false },
    position_updates: [{
      position: Number,
      timestamp: Date,
      notification_sent: Boolean
    }]
  },
  feedback: {
    wait_time_rating: {
      type: Number,
      min: 1,
      max: 5
    },
    service_rating: {
      type: Number,
      min: 1,
      max: 5
    },
    overall_rating: {
      type: Number,
      min: 1,
      max: 5
    },
    comment: String,
    would_recommend: Boolean,
    submitted_at: Date
  },
  payment_info: {
    amount_paid: {
      type: Number,
      default: 0,
      min: 0
    },
    payment_method: {
      type: String,
      enum: ['cash', 'card', 'mobile', 'online', 'loyalty_points']
    },
    payment_status: {
      type: String,
      enum: ['pending', 'paid', 'partially_paid', 'refunded', 'failed'],
      default: 'pending'
    },
    discount_applied: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    },
    final_amount: {
      type: Number,
      default: 0,
      min: 0
    }
  },
  queue_metrics: {
    position_changes: [{
      from_position: Number,
      to_position: Number,
      timestamp: Date,
      reason: String
    }],
    estimated_times: [{
      estimated_wait: Number,
      timestamp: Date
    }],
    staff_changes: [{
      from_staff: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      to_staff: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      timestamp: Date,
      reason: String
    }]
  },
  notes: {
    customer_notes: String,
    staff_notes: String,
    internal_notes: String
  },
  cancellation_info: {
    reason: String,
    cancelled_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    cancelled_at: Date,
    refund_issued: Boolean
  },
  created_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  updated_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for current wait time
queueEntrySchema.virtual('current_wait_time').get(function() {
  if (this.status === 'completed' || this.status === 'cancelled' || this.status === 'no_show') {
    return this.actual_wait_time || 0;
  }
  const now = new Date();
  const checkInTime = new Date(this.check_in_time);
  return Math.floor((now.getTime() - checkInTime.getTime()) / (1000 * 60)); // minutes
});

// Virtual for is_overdue
queueEntrySchema.virtual('is_overdue').get(function() {
  if (this.status !== 'waiting') return false;
  const currentWait = this.current_wait_time;
  return currentWait > (this.estimated_wait_time + 15); // 15 minutes buffer
});

// Virtual for estimated_completion_time
queueEntrySchema.virtual('estimated_completion_time').get(function() {
  if (this.service_start_time && this.estimated_service_time) {
    return new Date(this.service_start_time.getTime() + (this.estimated_service_time * 60000));
  }
  if (this.check_in_time && this.estimated_wait_time && this.estimated_service_time) {
    const totalTime = this.estimated_wait_time + this.estimated_service_time;
    return new Date(this.check_in_time.getTime() + (totalTime * 60000));
  }
  return null;
});

// Virtual for total_time_in_system
queueEntrySchema.virtual('total_time_in_system').get(function() {
  const endTime = this.completion_time || new Date();
  const startTime = new Date(this.check_in_time);
  return Math.floor((endTime.getTime() - startTime.getTime()) / (1000 * 60)); // minutes
});

// Virtual for is_active
queueEntrySchema.virtual('is_active').get(function() {
  return ['waiting', 'called', 'in_service'].includes(this.status);
});

// Method to call customer
queueEntrySchema.methods.callCustomer = function(staffId) {
  if (this.status !== 'waiting') {
    throw new Error('Customer can only be called when waiting');
  }
  this.status = 'called';
  this.called_time = new Date();
  this.actual_wait_time = this.current_wait_time;
  if (staffId) this.staff_id = staffId;
  return this.save();
};

// Method to start service
queueEntrySchema.methods.startService = function(staffId) {
  if (this.status !== 'called') {
    throw new Error('Service can only be started after customer is called');
  }
  this.status = 'in_service';
  this.service_start_time = new Date();
  if (staffId) this.staff_id = staffId;
  return this.save();
};

// Method to complete service
queueEntrySchema.methods.completeService = function(actualServiceTime, paymentInfo) {
  if (this.status !== 'in_service') {
    throw new Error('Service can only be completed when in service');
  }
  this.status = 'completed';
  this.service_end_time = new Date();
  this.completion_time = new Date();
  this.actual_service_time = actualServiceTime || this.calculateActualServiceTime();
  
  if (paymentInfo) {
    this.payment_info = { ...this.payment_info, ...paymentInfo };
  }
  
  return this.save();
};

// Method to mark as no-show
queueEntrySchema.methods.markNoShow = function() {
  if (!['waiting', 'called'].includes(this.status)) {
    throw new Error('Can only mark as no-show when waiting or called');
  }
  this.status = 'no_show';
  this.completion_time = new Date();
  this.actual_wait_time = this.current_wait_time;
  return this.save();
};

// Method to cancel entry
queueEntrySchema.methods.cancelEntry = function(reason, cancelledBy, refundIssued = false) {
  if (this.status === 'completed') {
    throw new Error('Cannot cancel completed entry');
  }
  this.status = 'cancelled';
  this.completion_time = new Date();
  this.cancellation_info = {
    reason,
    cancelled_by: cancelledBy,
    cancelled_at: new Date(),
    refund_issued: refundIssued
  };
  return this.save();
};

// Method to skip customer
queueEntrySchema.methods.skipCustomer = function(reason) {
  if (this.status !== 'called') {
    throw new Error('Can only skip when customer is called');
  }
  this.status = 'skipped';
  this.notes.staff_notes = (this.notes.staff_notes || '') + `\nSkipped: ${reason}`;
  return this.save();
};

// Method to update position
queueEntrySchema.methods.updatePosition = function(newPosition, reason) {
  const oldPosition = this.position;
  this.position = newPosition;
  
  this.queue_metrics.position_changes.push({
    from_position: oldPosition,
    to_position: newPosition,
    timestamp: new Date(),
    reason: reason || 'Position update'
  });
  
  return this.save();
};

// Method to update estimated wait time
queueEntrySchema.methods.updateEstimatedWaitTime = function(newEstimate) {
  this.estimated_wait_time = newEstimate;
  
  this.queue_metrics.estimated_times.push({
    estimated_wait: newEstimate,
    timestamp: new Date()
  });
  
  return this.save();
};

// Method to calculate actual service time
queueEntrySchema.methods.calculateActualServiceTime = function() {
  if (this.service_start_time && this.service_end_time) {
    const startTime = new Date(this.service_start_time);
    const endTime = new Date(this.service_end_time);
    return Math.floor((endTime.getTime() - startTime.getTime()) / (1000 * 60)); // minutes
  }
  return 0;
};

// Method to submit feedback
queueEntrySchema.methods.submitFeedback = function(feedbackData) {
  if (this.status !== 'completed') {
    throw new Error('Feedback can only be submitted for completed entries');
  }
  this.feedback = {
    ...feedbackData,
    submitted_at: new Date()
  };
  return this.save();
};

// Method to send notification
queueEntrySchema.methods.sendNotification = function(type, sent = true) {
  if (type === 'sms') {
    this.notifications.sms_sent = sent;
  } else if (type === 'email') {
    this.notifications.email_sent = sent;
  } else if (type === 'reminder') {
    this.notifications.reminder_sent = sent;
  }
  return this.save();
};

// Pre-save middleware to calculate final payment amount
queueEntrySchema.pre('save', function(next) {
  if (this.isModified('payment_info.amount_paid') || this.isModified('payment_info.discount_applied')) {
    if (this.payment_info.amount_paid && this.payment_info.discount_applied) {
      const discountAmount = (this.payment_info.amount_paid * this.payment_info.discount_applied) / 100;
      this.payment_info.final_amount = this.payment_info.amount_paid - discountAmount;
    }
  }
  next();
});

// Indexes for efficient queries
queueEntrySchema.index({ queue_id: 1, position: 1 });
queueEntrySchema.index({ customer_id: 1 });
queueEntrySchema.index({ appointment_id: 1 });
queueEntrySchema.index({ staff_id: 1 });
queueEntrySchema.index({ status: 1 });
queueEntrySchema.index({ check_in_time: 1 });
queueEntrySchema.index({ 'customer_info.phone': 1 });
queueEntrySchema.index({ created_by: 1 });

module.exports = mongoose.model('QueueEntry', queueEntrySchema);