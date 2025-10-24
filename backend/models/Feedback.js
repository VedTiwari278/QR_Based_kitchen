import mongoose from "mongoose";

const feedbackSchema = new mongoose.Schema({
  order: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    required: true
  },
  menuItem: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'MenuItem',
    required: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  guestInfo: {
    name: String,
    email: String
  },
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  comment: {
    type: String,
    trim: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

feedbackSchema.post('save', async function() {
  try {
    const MenuItem = mongoose.model('MenuItem');
    const feedbackStats = await mongoose.model('Feedback').aggregate([
      { $match: { menuItem: this.menuItem } },
      { 
        $group: {
          _id: '$menuItem',
          averageRating: { $avg: '$rating' },
          ratingCount: { $sum: 1 }
        }
      }
    ]);

    if (feedbackStats.length > 0) {
      await MenuItem.findByIdAndUpdate(this.menuItem, {
        'rating.average': Math.round(feedbackStats[0].averageRating * 10) / 10,
        'rating.count': feedbackStats[0].ratingCount
      });
    }
  } catch (error) {
    console.error('Error updating menu item rating:', error);
  }
});

const Feedback = mongoose.model("Feedback", feedbackSchema);

export default Feedback;