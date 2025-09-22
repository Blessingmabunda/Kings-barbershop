const mongoose = require('mongoose');

const appointmentSchema = new mongoose.Schema({
  customer_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer',
    required: true
  },
  franchise_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Franchise',
    required: true
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
  appointment_date: {
    type: Date,
    required: true
  },
  appointment_time: {
    type: String, // Format: "HH:MM"
    required: true,
    validate: {
      validator: function(v) {
        return /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(v);
      },
      message: 'Time must be in HH:MM format'
    }
  },
  estimated_duration: {
    type: Number, // in minutes
    required: true,
    min: 15,
    max: 300
  },
  actual_duration: {
    type: Number, // in minutes
    min: 0,
    max: 500
  },
  status: {
    type: String,
    enum: ['scheduled', 'confirmed', 'in_progress', 'completed', 'cancelled', 'no_show', 'rescheduled'],
    default: 'scheduled'
  },
  priority: {
    type: String,
    enum: ['low', 'normal', 'high', 'urgent'],
    default: 'normal'
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  discount_applied: {
    type: Number,
    default: 0,
    min: 0,
    max: 100 // percentage
  },
  final_price: {
    type: Number,
    required: true,
    min: 0
  },
  payment_status: {
    type: String,
    enum: ['pending', 'paid', 'partially_paid', 'refunded', 'failed'],
    default: 'pending'
  },
  payment_method: {
    type: String,
    enum: ['cash', 'card', 'mobile', 'online', 'loyalty_points'],
    required: false
  },
  notes: {
    type: String,
    maxlength: 1000
  },
  special_requests: {
    type: String,
    maxlength: 500
  },
  customer_preferences: {
    preferred_staff: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    allergies: [String],
    previous_issues: [String],
    communication_preference: {
      type: String,
      enum: ['sms', 'email', 'phone', 'none'],
      default: 'sms'
    }
  },
  reminder_settings: {
    sms_reminder: { type: Boolean, default: true },
    email_reminder: { type: Boolean, default: true },
    reminder_times: [{
      type: Number, // minutes before appointment
      default: [60, 1440] // 1 hour and 24 hours before
    }]
  },
  queue_entry: {
    position: Number,
    estimated_wait_time: Number,
    check_in_time: Date,
    called_time: Date,
    service_start_time: Date,
    service_end_time: Date
  },
  feedback: {
    rating: {
      type: Number,
      min: 1,
      max: 5
    },
    comment: String,
    service_quality: {
      type: Number,
      min: 1,
      max: 5
    },
    staff_rating: {
      type: Number,
      min: 1,
      max: 5
    },
    facility_rating: {
      type: Number,
      min: 1,
      max: 5
    },
    would_recommend: Boolean,
    submitted_at: Date
  },
  cancellation_reason: String,
  rescheduled_from: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Appointment'
  },
  rescheduled_to: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Appointment'
  },
  created_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  updated_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  source: {
    type: String,
    enum: ['online', 'phone', 'walk_in', 'app', 'admin'],
    default: 'online'
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for full appointment datetime
appointmentSchema.virtual('appointment_datetime').get(function() {
  if (this.appointment_date && this.appointment_time) {
    const [hours, minutes] = this.appointment_time.split(':');
    const datetime = new Date(this.appointment_date);
    datetime.setHours(parseInt(hours), parseInt(minutes), 0, 0);
    return datetime;
  }
  return null;
});

// Virtual for estimated end time
appointmentSchema.virtual('estimated_end_time').get(function() {
  const startTime = this.appointment_datetime;
  if (startTime && this.estimated_duration) {
    return new Date(startTime.getTime() + (this.estimated_duration * 60000));
  }
  return null;
});

// Virtual for is_today
appointmentSchema.virtual('is_today').get(function() {
  if (!this.appointment_date) return false;
  const today = new Date();
  const appointmentDate = new Date(this.appointment_date);
  return appointmentDate.toDateString() === today.toDateString();
});

// Virtual for is_upcoming
appointmentSchema.virtual('is_upcoming').get(function() {
  const appointmentDateTime = this.appointment_datetime;
  if (!appointmentDateTime) return false;
  return appointmentDateTime > new Date();
});

// Virtual for is_overdue
appointmentSchema.virtual('is_overdue').get(function() {
  const appointmentDateTime = this.appointment_datetime;
  if (!appointmentDateTime) return false;
  return appointmentDateTime < new Date() && ['scheduled', 'confirmed'].includes(this.status);
});

// Virtual for time_until_appointment
appointmentSchema.virtual('time_until_appointment').get(function() {
  const appointmentDateTime = this.appointment_datetime;
  if (!appointmentDateTime) return null;
  const now = new Date();
  const diffMs = appointmentDateTime.getTime() - now.getTime();
  return Math.max(0, Math.floor(diffMs / (1000 * 60))); // minutes
});

// Method to check if appointment can be cancelled
appointmentSchema.methods.canBeCancelled = function() {
  const allowedStatuses = ['scheduled', 'confirmed'];
  const appointmentDateTime = this.appointment_datetime;
  if (!appointmentDateTime) return false;
  
  // Can't cancel if appointment is within 2 hours
  const twoHoursFromNow = new Date(Date.now() + (2 * 60 * 60 * 1000));
  return allowedStatuses.includes(this.status) && appointmentDateTime > twoHoursFromNow;
};

// Method to check if appointment can be rescheduled
appointmentSchema.methods.canBeRescheduled = function() {
  const allowedStatuses = ['scheduled', 'confirmed'];
  const appointmentDateTime = this.appointment_datetime;
  if (!appointmentDateTime) return false;
  
  // Can't reschedule if appointment is within 4 hours
  const fourHoursFromNow = new Date(Date.now() + (4 * 60 * 60 * 1000));
  return allowedStatuses.includes(this.status) && appointmentDateTime > fourHoursFromNow;
};

// Method to calculate final price with discount
appointmentSchema.methods.calculateFinalPrice = function() {
  const discountAmount = (this.price * this.discount_applied) / 100;
  this.final_price = this.price - discountAmount;
  return this.final_price;
};

// Method to mark as completed
appointmentSchema.methods.markCompleted = function(actualDuration, staffId) {
  this.status = 'completed';
  this.actual_duration = actualDuration;
  if (staffId) this.staff_id = staffId;
  if (this.queue_entry) {
    this.queue_entry.service_end_time = new Date();
  }
  return this.save();
};

// Method to mark as no-show
appointmentSchema.methods.markNoShow = function() {
  this.status = 'no_show';
  return this.save();
};

// Method to cancel appointment
appointmentSchema.methods.cancelAppointment = function(reason, cancelledBy) {
  if (!this.canBeCancelled()) {
    throw new Error('Appointment cannot be cancelled at this time');
  }
  this.status = 'cancelled';
  this.cancellation_reason = reason;
  this.updated_by = cancelledBy;
  return this.save();
};

// Method to reschedule appointment
appointmentSchema.methods.rescheduleAppointment = function(newDate, newTime, rescheduledBy) {
  if (!this.canBeRescheduled()) {
    throw new Error('Appointment cannot be rescheduled at this time');
  }
  this.status = 'rescheduled';
  this.updated_by = rescheduledBy;
  return this.save();
};

// Method to check in customer
appointmentSchema.methods.checkIn = function() {
  if (this.status !== 'confirmed') {
    throw new Error('Only confirmed appointments can be checked in');
  }
  this.status = 'in_progress';
  if (!this.queue_entry) this.queue_entry = {};
  this.queue_entry.check_in_time = new Date();
  return this.save();
};

// Method to submit feedback
appointmentSchema.methods.submitFeedback = function(feedbackData) {
  if (this.status !== 'completed') {
    throw new Error('Feedback can only be submitted for completed appointments');
  }
  this.feedback = {
    ...feedbackData,
    submitted_at: new Date()
  };
  return this.save();
};

// Pre-save middleware to calculate final price
appointmentSchema.pre('save', function(next) {
  if (this.isModified('price') || this.isModified('discount_applied')) {
    this.calculateFinalPrice();
  }
  next();
});

// Indexes for efficient queries
appointmentSchema.index({ customer_id: 1, appointment_date: 1 });
appointmentSchema.index({ franchise_id: 1, appointment_date: 1 });
appointmentSchema.index({ staff_id: 1, appointment_date: 1 });
appointmentSchema.index({ status: 1 });
appointmentSchema.index({ appointment_date: 1, appointment_time: 1 });
appointmentSchema.index({ created_by: 1 });
appointmentSchema.index({ service_id: 1 });

module.exports = mongoose.model('Appointment', appointmentSchema);