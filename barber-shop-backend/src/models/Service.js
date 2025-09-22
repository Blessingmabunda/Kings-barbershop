const mongoose = require('mongoose');

const serviceSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    minlength: 2,
    maxlength: 100
  },
  description: {
    type: String
  },
  category: {
    type: String,
    enum: ['haircut', 'beard', 'styling', 'treatment', 'package', 'addon'],
    default: 'haircut'
  },
  base_price: {
    type: Number,
    required: true,
    min: 0
  },
  duration_minutes: {
    type: Number,
    required: true,
    min: 5,
    max: 300
  },
  skill_level_required: {
    type: String,
    enum: ['junior', 'senior', 'master', 'any'],
    default: 'any'
  },
  tools_required: {
    type: [String],
    default: ['scissors', 'clippers']
  },
  products_used: {
    type: [String],
    default: []
  },
  age_restrictions: {
    min_age: Number,
    max_age: Number,
    requires_guardian: { type: Boolean, default: false }
  },
  gender_specific: {
    type: String,
    enum: ['male', 'female', 'unisex'],
    default: 'unisex'
  },
  is_active: {
    type: Boolean,
    default: true
  },
  is_popular: {
    type: Boolean,
    default: false
  },
  booking_advance_days: {
    type: Number,
    default: 30,
    min: 0
  },
  cancellation_policy: {
    hours_before: { type: Number, default: 24 },
    fee_percentage: { type: Number, default: 0, min: 0, max: 100 }
  },
  pricing_tiers: [{
    staff_level: {
      type: String,
      enum: ['junior', 'senior', 'master']
    },
    price: {
      type: Number,
      min: 0
    }
  }],
  add_ons: [{
    name: String,
    price: Number,
    duration_minutes: Number
  }],
  seasonal_pricing: [{
    season: String,
    price_multiplier: { type: Number, default: 1.0 },
    start_date: Date,
    end_date: Date
  }],
  requirements: {
    consultation_required: { type: Boolean, default: false },
    patch_test_required: { type: Boolean, default: false },
    preparation_instructions: String
  },
  aftercare: {
    instructions: String,
    recommended_products: [String],
    follow_up_days: Number
  },
  tags: [String],
  image_url: String,
  popularity_score: {
    type: Number,
    default: 0,
    min: 0
  },
  total_bookings: {
    type: Number,
    default: 0,
    min: 0
  },
  average_rating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5
  },
  franchise_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Franchise'
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for formatted duration
serviceSchema.virtual('formatted_duration').get(function() {
  const hours = Math.floor(this.duration_minutes / 60);
  const minutes = this.duration_minutes % 60;
  
  if (hours > 0) {
    return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
  }
  return `${minutes}m`;
});

// Virtual for price range
serviceSchema.virtual('price_range').get(function() {
  if (this.pricing_tiers && this.pricing_tiers.length > 0) {
    const prices = this.pricing_tiers.map(tier => tier.price);
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    return minPrice === maxPrice ? `$${minPrice}` : `$${minPrice} - $${maxPrice}`;
  }
  return `$${this.base_price}`;
});

// Method to get price for specific staff level
serviceSchema.methods.getPriceForStaffLevel = function(staffLevel) {
  const tier = this.pricing_tiers.find(t => t.staff_level === staffLevel);
  return tier ? tier.price : this.base_price;
};

// Method to check if service is available for age
serviceSchema.methods.isAvailableForAge = function(age) {
  if (!this.age_restrictions) return true;
  
  const { min_age, max_age } = this.age_restrictions;
  if (min_age && age < min_age) return false;
  if (max_age && age > max_age) return false;
  
  return true;
};

// Method to update popularity
serviceSchema.methods.updatePopularity = function() {
  this.total_bookings += 1;
  // Simple popularity algorithm based on bookings and rating
  this.popularity_score = this.total_bookings * (this.average_rating || 1);
  return this.save();
};

// Indexes for efficient queries
serviceSchema.index({ category: 1 });
serviceSchema.index({ is_active: 1 });
serviceSchema.index({ is_popular: 1 });
serviceSchema.index({ base_price: 1 });
serviceSchema.index({ duration_minutes: 1 });
serviceSchema.index({ popularity_score: -1 });
serviceSchema.index({ franchise_id: 1 });
serviceSchema.index({ name: 'text', description: 'text', tags: 'text' });

module.exports = mongoose.model('Service', serviceSchema);