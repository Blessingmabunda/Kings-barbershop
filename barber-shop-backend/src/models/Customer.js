const mongoose = require('mongoose');

const customerSchema = new mongoose.Schema({
  first_name: {
    type: String,
    required: true,
    minlength: 1,
    maxlength: 50
  },
  last_name: {
    type: String,
    required: true,
    minlength: 1,
    maxlength: 50
  },
  phone: {
    type: String,
    required: true,
    unique: true,
    minlength: 10,
    maxlength: 20
  },
  email: {
    type: String,
    match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  },
  date_of_birth: {
    type: Date
  },
  gender: {
    type: String,
    enum: ['male', 'female', 'other', 'prefer_not_to_say']
  },
  address: {
    type: String
  },
  emergency_contact: {
    name: String,
    phone: String,
    relationship: String
  },
  preferences: {
    preferred_barber: String,
    preferred_services: [String],
    communication: {
      sms_notifications: { type: Boolean, default: true },
      email_notifications: { type: Boolean, default: false },
      call_notifications: { type: Boolean, default: false }
    },
    appointment_reminders: {
      enabled: { type: Boolean, default: true },
      advance_notice_hours: { type: Number, default: 24 }
    },
    special_requests: String,
    allergies: [String],
    hair_type: String,
    skin_sensitivity: String
  },
  loyalty_points: {
    type: Number,
    default: 0,
    min: 0
  },
  total_visits: {
    type: Number,
    default: 0,
    min: 0
  },
  total_spent: {
    type: Number,
    default: 0,
    min: 0
  },
  last_visit_date: {
    type: Date
  },
  customer_since: {
    type: Date,
    default: Date.now
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'blocked'],
    default: 'active'
  },
  notes: {
    type: String
  },
  referral_source: {
    type: String,
    enum: ['walk_in', 'referral', 'online', 'social_media', 'advertisement', 'other']
  },
  marketing_consent: {
    sms: { type: Boolean, default: false },
    email: { type: Boolean, default: false },
    phone: { type: Boolean, default: false }
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for full name
customerSchema.virtual('full_name').get(function() {
  return `${this.first_name} ${this.last_name}`;
});

// Virtual for age
customerSchema.virtual('age').get(function() {
  if (!this.date_of_birth) return null;
  const today = new Date();
  const birthDate = new Date(this.date_of_birth);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
});

// Method to add loyalty points
customerSchema.methods.addLoyaltyPoints = function(points) {
  this.loyalty_points += points;
  return this.save();
};

// Method to redeem loyalty points
customerSchema.methods.redeemLoyaltyPoints = function(points) {
  if (this.loyalty_points >= points) {
    this.loyalty_points -= points;
    return this.save();
  }
  throw new Error('Insufficient loyalty points');
};

// Method to update visit stats
customerSchema.methods.updateVisitStats = function(amountSpent) {
  this.total_visits += 1;
  this.total_spent += amountSpent;
  this.last_visit_date = new Date();
  return this.save();
};

// Index for phone number lookup
customerSchema.index({ phone: 1 });
customerSchema.index({ email: 1 });
customerSchema.index({ status: 1 });
customerSchema.index({ customer_since: 1 });

module.exports = mongoose.model('Customer', customerSchema);