import express from "express";
import Feedback from "../models/Feedback.js";
import Order from "../models/Order.js";
import auth from "../middleware/auth.js";

const router = express.Router();

router.post('/', auth, async (req, res) => {
  try {
    const { orderId, menuItemId, rating, comment } = req.body;

    const order = await Order.findOne({
      _id: orderId,
      $or: [
        { user: req.user.userId },
        { 'guestInfo.email': req.user.email }
      ]
    });

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    if (order.status !== 'completed') {
      return res.status(400).json({ message: 'Feedback can only be submitted for completed orders' });
    }

    const orderItem = order.items.find(item => 
      item.item.toString() === menuItemId
    );

    if (!orderItem) {
      return res.status(400).json({ message: 'Menu item not found in order' });
    }

    const feedback = new Feedback({
      order: orderId,
      menuItem: menuItemId,
      user: req.user.userId || null,
      guestInfo: req.user.userId ? undefined : {
        name: order.guestInfo?.name,
        email: order.guestInfo?.email
      },
      rating,
      comment
    });

    await feedback.save();

    const feedbackCount = await Feedback.countDocuments({ order: orderId });
    if (feedbackCount >= order.items.length) {
      order.feedbackSubmitted = true;
      await order.save();
    }

    res.status(201).json({ 
      message: 'Feedback submitted successfully',
      feedback 
    });

  } catch (error) {
    console.error('Error submitting feedback:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.get('/menu-item/:itemId', async (req, res) => {
  try {
    const { itemId } = req.params;
    const { limit = 10, page = 1 } = req.query;

    const feedback = await Feedback.find({ menuItem: itemId })
      .populate('user', 'name')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Feedback.countDocuments({ menuItem: itemId });

    res.json({
      feedback,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });

  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.get('/my-feedback', auth, async (req, res) => {
  try {
    const feedback = await Feedback.find({ 
      $or: [
        { user: req.user.userId },
        { 'guestInfo.email': req.user.email }
      ]
    })
    .populate('menuItem', 'name image')
    .populate('order', 'orderNumber')
    .sort({ createdAt: -1 });

    res.json(feedback);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

export default router;