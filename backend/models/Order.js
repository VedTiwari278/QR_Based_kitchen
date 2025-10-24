import mongoose from 'mongoose';

const orderSchema = new mongoose.Schema({
  orderNumber: {
    type: String,
    required: true,
    unique: true
  },
  items: [{
    item: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'MenuItem',
      required: true
    },
    name: {
      type: String,
      required: true
    },
    quantity: {
      type: Number,
      required: true,
      min: 1
    },
    customizations: {
      type: Map,
      of: String,
      default: {}
    },
    price: Number,
    itemTotal: Number
  }],
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  guestInfo: {
    name: String,
    phone: String,
    email: String
  },
  orderType: {
    type: String,
    enum: ['pickup', 'dine-in'],
    required: true
  },
  tableNumber: String,
  paymentMethod: {
    type: String,
    enum: ['upi', 'cash'],
    required: true
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'completed', 'failed'],
    default: 'pending'
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'preparing', 'ready', 'completed', 'cancelled'],
    default: 'pending'
  },
  subtotal: Number,
  tax: Number,
  totalAmount: Number,
  estimatedTime: {
    type: Number,
    default: 20
  },
  feedbackSubmitted: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

orderSchema.post('save', async function(order) {
  try {
    if (order.status === 'confirmed' || order.status === 'pending') {
      try {
        const { default: StockService } = await import('../services/stockService.js');
        await StockService.updateStockFromOrder(order);
      } catch (importError) {
        console.error('Failed to import StockService:', importError);
      }
    }
  } catch (error) {
    console.error('Error updating stock after order save:', error);
  }
});

orderSchema.pre('save', function(next) {
  if (this.isModified('items') && this.items.length > 0) {
    let maxPrepTime = 0;
    this.items.forEach(item => {
      if (item.item && item.item.preparationTime) {
        maxPrepTime = Math.max(maxPrepTime, item.item.preparationTime);
      }
    });
    this.estimatedTime = Math.max(15, maxPrepTime + 5); // Minimum 15 minutes
    console.log(`🔄 Order ${this.orderNumber} cancelled - stock restoration needed`);
  }
  next();
});

orderSchema.virtual('total').get(function() {
  return this.totalAmount;
});

orderSchema.set('toJSON', { virtuals: true });
orderSchema.set('toObject', { virtuals: true });

export default mongoose.model('Order', orderSchema);