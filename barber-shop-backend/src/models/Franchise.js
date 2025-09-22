const mongoose = require('mongoose');

const franchiseSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    minlength: 2,
    maxlength: 100
  },
  address: {
    type: String,
    required: true
  },
  phone: {
    type: String,
    required: true,
    minlength: 10,
    maxlength: 20
  },
  email: {
    type: String,
    match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  },
  operating_hours: {
    monday: { 
      open: { type: String, default: '09:00' }, 
      close: { type: String, default: '18:00' }, 
      closed: { type: Boolean, default: false } 
    },
    tuesday: { 
      open: { type: String, default: '09:00' }, 
      close: { type: String, default: '18:00' }, 
      closed: { type: Boolean, default: false } 
    },
    wednesday: { 
      open: { type: String, default: '09:00' }, 
      close: { type: String, default: '18:00' }, 
      closed: { type: Boolean, default: false } 
    },
    thursday: { 
      open: { type: String, default: '09:00' }, 
      close: { type: String, default: '18:00' }, 
      closed: { type: Boolean, default: false } 
    },
    friday: { 
      open: { type: String, default: '09:00' }, 
      close: { type: String, default: '18:00' }, 
      closed: { type: Boolean, default: false } 
    },
    saturday: { 
      open: { type: String, default: '09:00' }, 
      close: { type: String, default: '17:00' }, 
      closed: { type: Boolean, default: false } 
    },
    sunday: { 
      open: { type: String, default: '10:00' }, 
      close: { type: String, default: '16:00' }, 
      closed: { type: Boolean, default: false } 
    }
  },
  timezone: {
    type: String,
    default: 'America/New_York'
  },
  settings: {
    max_queue_size: { type: Number, default: 50, min: 1, max: 200 },
    allow_walk_ins: { type: Boolean, default: true },
    require_appointments: { type: Boolean, default: false },
    notification_settings: {
      sms_enabled: { type: Boolean, default: true },
      email_enabled: { type: Boolean, default: true },
      push_enabled: { type: Boolean, default: true },
      reminder_hours: { type: Number, default: 24 }
    },
    payment_settings: {
      accept_cash: { type: Boolean, default: true },
      accept_card: { type: Boolean, default: true },
      accept_digital: { type: Boolean, default: false },
      tip_suggestions: [Number],
      tax_rate: { type: Number, default: 0.08 }
    },
    queue_settings: {
      auto_advance: { type: Boolean, default: true },
      estimated_service_time: { type: Number, default: 30 },
      buffer_time: { type: Number, default: 5 },
      max_wait_time: { type: Number, default: 120 }
    }
  },
  contact_info: {
    website: String,
    social_media: {
      facebook: String,
      instagram: String,
      twitter: String
    }
  },
  business_info: {
    license_number: String,
    tax_id: String,
    established_date: Date,
    owner_name: String,
    manager_name: String
  },
  location: {
    latitude: Number,
    longitude: Number,
    city: String,
    state: String,
    zip_code: String,
    country: { type: String, default: 'USA' }
  },
  amenities: [String],
  services_offered: [String],
  staff_count: {
    type: Number,
    default: 0,
    min: 0
  },
  is_active: {
    type: Boolean,
    default: true
  },
  subscription_plan: {
    type: String,
    enum: ['basic', 'premium', 'enterprise'],
    default: 'basic'
  },
  subscription_expires: {
    type: Date
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for formatted address
franchiseSchema.virtual('formatted_address').get(function() {
  return this.address;
});

// Method to check if franchise is open
franchiseSchema.methods.isOpenNow = function() {
  const now = new Date();
  const dayOfWeek = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][now.getDay()];
  const currentTime = now.toTimeString().slice(0, 5); // HH:MM format
  
  const todayHours = this.operating_hours[dayOfWeek];
  if (todayHours.closed) return false;
  
  return currentTime >= todayHours.open && currentTime <= todayHours.close;
};

// Method to get today's operating hours
franchiseSchema.methods.getTodayHours = function() {
  const now = new Date();
  const dayOfWeek = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][now.getDay()];
  return this.operating_hours[dayOfWeek];
};

// Index for location-based queries
franchiseSchema.index({ 'location.city': 1 });
franchiseSchema.index({ 'location.state': 1 });
franchiseSchema.index({ is_active: 1 });
franchiseSchema.index({ name: 'text', address: 'text' });

module.exports = mongoose.model('Franchise', franchiseSchema);