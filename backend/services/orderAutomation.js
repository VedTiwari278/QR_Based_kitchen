import Order from '../models/Order.js';
import mongoose from 'mongoose';

class OrderAutomationService {
  static async processOrderStatusUpdates() {
    try {
      const activeOrders = await Order.find({
        status: { $in: ['confirmed', 'preparing'] },
        paymentStatus: 'completed'
      }).populate('items.item');

      const now = new Date();

      for (const order of activeOrders) {
        const orderTime = new Date(order.createdAt);
        const timeElapsed = (now - orderTime) / (1000 * 60); // minutes
        
        let maxPreparationTime = 0;
        order.items.forEach(item => {
          const prepTime = item.item?.preparationTime || 15;
          maxPreparationTime = Math.max(maxPreparationTime, prepTime);
        });

        if (order.status === 'confirmed' && timeElapsed >= 2) {
          order.status = 'preparing';
          await order.save();
          console.log(`Order ${order.orderNumber} moved to preparing`);
        } else if (order.status === 'preparing' && timeElapsed >= maxPreparationTime * 0.8) {
          order.status = 'ready';
          await order.save();
          console.log(`Order ${order.orderNumber} moved to ready`);
        }
      }
    } catch (error) {
      console.error('Error in order automation:', error);
    }
  }
}

export default OrderAutomationService;