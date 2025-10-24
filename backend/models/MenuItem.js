import mongoose from "mongoose";

const menuItemSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  category: {
    type: String,
    required: true,
    enum: ['drinks', 'meals', 'snacks', 'desserts']
  },
  image: {
    type: String,
    default: ''
  },
  isVeg: {
    type: Boolean,
    default: true
  },
  isAvailable: {
    type: Boolean,
    default: true
  },
  dailyStock: {
    type: Number,
    default: 0,
    min: 0
  },
  currentStock: {
    type: Number,
    default: 0,
    min: 0
  },
  isOutOfStock: {
    type: Boolean,
    default: false
  },
  customizations: [{
    name: {
      type: String,
      required: true
    },
    options: [{
      name: String,
      price: {
        type: Number,
        default: 0
      }
    }]
  }],
  preparationTime: {
    type: Number,
    default: 15,
    min: 5
  },
  rating: {
    average: {
      type: Number,
      default: 0
    },
    count: {
      type: Number,
      default: 0
    }
  },
  tags: [String],
  isPopular: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

menuItemSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  
  if (this.dailyStock > 0) {
    this.isOutOfStock = this.currentStock <= 0;
    this.isAvailable = this.currentStock > 0;
  }
  
  next();
});

const MenuItem = mongoose.model("MenuItem", menuItemSchema);

export default MenuItem;