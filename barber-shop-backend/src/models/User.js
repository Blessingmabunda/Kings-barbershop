const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    minlength: 3,
    maxlength: 50,
    match: /^[a-zA-Z0-9_]+$/
  },
  email: {
    type: String,
    required: true,
    unique: true,
    match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  },
  password_hash: {
    type: String,
    required: true
  },
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
    minlength: 10,
    maxlength: 20
  },
  role: {
    type: String,
    enum: ['admin', 'manager', 'barber', 'receptionist'],
    default: 'barber'
  },
  franchise_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Franchise',
    required: true
  },
  is_active: {
    type: Boolean,
    default: true
  },
  last_login: {
    type: Date
  },
  profile: {
    bio: String,
    specialties: [String],
    experience_years: {
      type: Number,
      min: 0
    },
    certifications: [String],
    languages: [String],
    availability: {
      monday: { start: String, end: String, available: { type: Boolean, default: true } },
      tuesday: { start: String, end: String, available: { type: Boolean, default: true } },
      wednesday: { start: String, end: String, available: { type: Boolean, default: true } },
      thursday: { start: String, end: String, available: { type: Boolean, default: true } },
      friday: { start: String, end: String, available: { type: Boolean, default: true } },
      saturday: { start: String, end: String, available: { type: Boolean, default: true } },
      sunday: { start: String, end: String, available: { type: Boolean, default: false } }
    }
  },
  performance_metrics: {
    total_customers_served: { type: Number, default: 0 },
    average_service_time: { type: Number, default: 0 },
    customer_satisfaction_rating: { type: Number, default: 0, min: 0, max: 5 },
    total_revenue_generated: { type: Number, default: 0 }
  },
  settings: {
    notifications: {
      email_enabled: { type: Boolean, default: true },
      sms_enabled: { type: Boolean, default: false },
      push_enabled: { type: Boolean, default: true }
    },
    preferences: {
      theme: { type: String, enum: ['light', 'dark'], default: 'light' },
      language: { type: String, default: 'en' },
      timezone: { type: String, default: 'America/New_York' }
    }
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for full name
userSchema.virtual('full_name').get(function() {
  return `${this.first_name} ${this.last_name}`;
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password_hash')) return next();
  
  try {
    const salt = await bcrypt.genSalt(12);
    this.password_hash = await bcrypt.hash(this.password_hash, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Method to compare password
userSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password_hash);
};

// Method to update last login
userSchema.methods.updateLastLogin = function() {
  this.last_login = new Date();
  return this.save();
};

module.exports = mongoose.model('User', userSchema);