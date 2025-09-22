const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  customer_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer',
    required: true
  },
  service_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Service',
    required: true
  },
  queue_entry_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'QueueEntry',
    required: false
  },
  staff_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  transaction_id: {
    type: String,
    maxlength: 100,
    unique: true,
    sparse: true
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  base_amount: {
    type: Number,
    required: true,
    min: 0
  },
  tax_amount: {
    type: Number,
    required: true,
    default: 0.00,
    min: 0
  },
  tip_amount: {
    type: Number,
    required: true,
    default: 0.00,
    min: 0
  },
  discount_amount: {
    type: Number,
    required: true,
    default: 0.00,
    min: 0
  },
  loyalty_points_used: {
    type: Number,
    required: true,
    default: 0,
    min: 0
  },
  loyalty_points_value: {
    type: Number,
    required: true,
    default: 0.00,
    min: 0
  },
  payment_method: {
    type: String,
    enum: ['cash', 'card', 'digital_wallet', 'bank_transfer', 'loyalty_points', 'gift_card'],
    required: true
  },
  payment_status: {
    type: String,
    enum: ['pending', 'processing', 'completed', 'failed', 'cancelled', 'refunded', 'partially_refunded'],
    default: 'pending'
  },
  currency: {
    type: String,
    required: true,
    default: 'USD',
    maxlength: 3
  },
  exchange_rate: {
    type: Number,
    default: 1.00,
    min: 0
  },
  payment_gateway: {
    type: String,
    maxlength: 50
  },
  gateway_transaction_id: {
    type: String,
    maxlength: 100
  },
  gateway_response: {
    type: mongoose.Schema.Types.Mixed
  },
  refund_amount: {
    type: Number,
    default: 0.00,
    min: 0
  },
  refund_reason: {
    type: String,
    maxlength: 500
  },
  refund_date: {
    type: Date
  },
  notes: {
    type: String,
    maxlength: 1000
  },
  receipt_number: {
    type: String,
    maxlength: 50,
    unique: true,
    sparse: true
  },
  receipt_url: {
    type: String,
    maxlength: 500
  },
  processed_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  processed_at: {
    type: Date,
    default: Date.now
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed
  }
}, {
  timestamps: true
});

// Indexes for efficient queries
paymentSchema.index({ customer_id: 1 });
paymentSchema.index({ service_id: 1 });
paymentSchema.index({ staff_id: 1 });
paymentSchema.index({ payment_status: 1 });
paymentSchema.index({ payment_method: 1 });
paymentSchema.index({ processed_at: 1 });
paymentSchema.index({ transaction_id: 1 });
paymentSchema.index({ receipt_number: 1 });

// Virtual for total amount calculation
paymentSchema.virtual('total_amount').get(function() {
  return this.base_amount + this.tax_amount + this.tip_amount - this.discount_amount - this.loyalty_points_value;
});

// Method to process refund
paymentSchema.methods.processRefund = function(amount, reason) {
  if (amount > this.amount) {
    throw new Error('Refund amount cannot exceed payment amount');
  }
  
  this.refund_amount = amount;
  this.refund_reason = reason;
  this.refund_date = new Date();
  
  if (amount === this.amount) {
    this.payment_status = 'refunded';
  } else {
    this.payment_status = 'partially_refunded';
  }
  
  return this.save();
};

// Method to mark as completed
paymentSchema.methods.markCompleted = function() {
  this.payment_status = 'completed';
  this.processed_at = new Date();
  return this.save();
};

// Method to mark as failed
paymentSchema.methods.markFailed = function(reason) {
  this.payment_status = 'failed';
  this.notes = reason;
  return this.save();
};

// Static method to get payment statistics
paymentSchema.statics.getPaymentStats = function(franchiseId, startDate, endDate) {
  const matchStage = {
    processed_at: {
      $gte: startDate,
      $lte: endDate
    },
    payment_status: 'completed'
  };

  return this.aggregate([
    { $match: matchStage },
    {
      $lookup: {
        from: 'services',
        localField: 'service_id',
        foreignField: '_id',
        as: 'service'
      }
    },
    { $unwind: '$service' },
    { $match: { 'service.franchise_id': franchiseId } },
    {
      $group: {
        _id: null,
        total_revenue: { $sum: '$amount' },
        total_transactions: { $sum: 1 },
        average_transaction: { $avg: '$amount' },
        total_tips: { $sum: '$tip_amount' },
        total_tax: { $sum: '$tax_amount' },
        payment_methods: {
          $push: {
            method: '$payment_method',
            amount: '$amount'
          }
        }
      }
    }
  ]);
};

module.exports = mongoose.model('Payment', paymentSchema);