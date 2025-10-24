import MenuItem from '../models/MenuItem.js';
import Order from '../models/Order.js';

class StockService {
  static async resetDailyStock() {
    try {
      console.log('🔄 Resetting daily stock for all menu items...');
      
      const result = await MenuItem.updateMany(
        { dailyStock: { $gt: 0 } },
        { 
          $set: { 
            currentStock: '$dailyStock',
            isOutOfStock: false,
            isAvailable: true
          } 
        }
      );
      
      console.log(`✅ Daily stock reset completed. Updated ${result.modifiedCount} items.`);
      return result;
    } catch (error) {
      console.error('❌ Error resetting daily stock:', error);
      throw error;
    }
  }

  static async updateStockFromOrder(order) {
    try {
      for (const orderItem of order.items) {
        const menuItem = await MenuItem.findById(orderItem.item);
        
        if (menuItem && menuItem.dailyStock > 0) {
          const newStock = menuItem.currentStock - orderItem.quantity;
          
          await MenuItem.findByIdAndUpdate(orderItem.item, {
            currentStock: Math.max(0, newStock),
            isOutOfStock: newStock <= 0,
            isAvailable: newStock > 0
          });
          
          console.log(`📦 Updated stock for ${menuItem.name}: ${menuItem.currentStock} → ${newStock}`);
        }
      }
    } catch (error) {
      console.error('❌ Error updating stock from order:', error);
      throw error;
    }
  }

  static async getLowStockItems() {
    try {
      const lowStockItems = await MenuItem.find({
        dailyStock: { $gt: 0 },
        currentStock: { 
          $lte: { $multiply: ['$dailyStock', 0.2] },
          $gt: 0
        }
      }).select('name currentStock dailyStock');
      
      return lowStockItems;
    } catch (error) {
      console.error('❌ Error getting low stock items:', error);
      throw error;
    }
  }

  static async getOutOfStockItems() {
    try {
      const outOfStockItems = await MenuItem.find({
        dailyStock: { $gt: 0 },
        currentStock: { $lte: 0 }
      }).select('name dailyStock currentStock');
      
      return outOfStockItems;
    } catch (error) {
      console.error('❌ Error getting out of stock items:', error);
      throw error;
    }
  }

  // Manually update stock for an item
  static async updateItemStock(itemId, newStock) {
    try {
      const menuItem = await MenuItem.findByIdAndUpdate(
        itemId,
        {
          currentStock: Math.max(0, newStock),
          isOutOfStock: newStock <= 0,
          isAvailable: newStock > 0
        },
        { new: true }
      );
      
      return menuItem;
    } catch (error) {
      console.error('❌ Error updating item stock:', error);
      throw error;
    }
  }
}

export default StockService;