import express from "express";
import multer from "multer";
import path from "path";
import MenuItem from "../models/MenuItem.js";
import Order from "../models/Order.js";
import User from "../models/User.js";
import adminAuth from "../middleware/adminAuth.js";

const router = express.Router();

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + Math.round(Math.random() * 1E9) + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

router.get('/stats', adminAuth, async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const [
      totalOrders,
      todayOrders,
      totalRevenue,
      todayRevenue,
      activeOrders,
      totalUsers,
      totalMenuItems
    ] = await Promise.all([
      Order.countDocuments(),
      Order.countDocuments({ createdAt: { $gte: today } }),
      // FIXED: Use totalAmount instead of total
      Order.aggregate([
        { $match: { paymentStatus: 'completed' } },
        { $group: { _id: null, total: { $sum: '$totalAmount' } } }
      ]),
      Order.aggregate([
        { 
          $match: { 
            paymentStatus: 'completed',
            createdAt: { $gte: today }
          }
        },
        { $group: { _id: null, total: { $sum: '$totalAmount' } } }
      ]),
      Order.countDocuments({ status: { $in: ['pending', 'confirmed', 'preparing'] } }),
      User.countDocuments({ role: 'user' }),
      MenuItem.countDocuments({ isAvailable: true })
    ]);
    
    res.json({
      totalOrders,
      todayOrders,
      totalRevenue: totalRevenue[0]?.total || 0,
      todayRevenue: todayRevenue[0]?.total || 0,
      activeOrders,
      totalUsers,
      totalMenuItems
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.get('/menu', adminAuth, async (req, res) => {
  try {
    const items = await MenuItem.find().sort({ createdAt: -1 });
    res.json(items);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.post('/menu', adminAuth, upload.single('image'), async (req, res) => {
  try {
    const itemData = req.body;
    
    if (req.file) {
      itemData.image = `/uploads/${req.file.filename}`;
    }
    
    // Parse customizations if provided
    if (itemData.customizations) {
      itemData.customizations = JSON.parse(itemData.customizations);
    }
    
    const item = new MenuItem(itemData);
    await item.save();
    
    res.status(201).json(item);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.put('/menu/:id', adminAuth, upload.single('image'), async (req, res) => {
  try {
    const itemData = req.body;
    
    if (req.file) {
      itemData.image = `/uploads/${req.file.filename}`;
    }
    
    if (itemData.customizations) {
      itemData.customizations = JSON.parse(itemData.customizations);
    }
    
    const item = await MenuItem.findByIdAndUpdate(
      req.params.id,
      itemData,
      { new: true }
    );
    
    if (!item) {
      return res.status(404).json({ message: 'Item not found' });
    }
    
    res.json(item);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.delete('/menu/:id', adminAuth, async (req, res) => {
  try {
    const item = await MenuItem.findByIdAndDelete(req.params.id);
    if (!item) {
      return res.status(404).json({ message: 'Item not found' });
    }
    res.json({ message: 'Item deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.get('/orders', adminAuth, async (req, res) => {
  try {
    const { status, date, search, limit } = req.query;
    let filter = {};
    
    if (status && status !== 'all') filter.status = status;
    if (date) {
      const startDate = new Date(date);
      const endDate = new Date(date);
      endDate.setDate(endDate.getDate() + 1);
      filter.createdAt = { $gte: startDate, $lt: endDate };
    }
    
    // Add search functionality
    if (search) {
      const searchRegex = new RegExp(search, 'i');
      filter.$or = [
        { orderNumber: searchRegex },
        { 'user.name': searchRegex },
        { 'user.phone': searchRegex },
        { 'user.email': searchRegex },
        { 'guestInfo.name': searchRegex },
        { 'guestInfo.phone': searchRegex },
        { 'guestInfo.email': searchRegex }
      ];
    }
    
    let query = Order.find(filter)
      .populate('items.item')
      .populate('user', 'name email phone')
      .sort({ createdAt: -1 });
    
    if (limit) {
      query = query.limit(parseInt(limit));
    }
    
    const orders = await query;
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.put('/orders/:id/status', adminAuth, async (req, res) => {
  try {
    const { status } = req.body;
    
    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { status, updatedAt: new Date() },
      { new: true }
    ).populate('items.item').populate('user', '-password');
    
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }
    
    // Notify user via socket
    req.io.to(`order-${order._id}`).emit('order-status-update', {
      orderId: order._id,
      status: order.status,
      orderNumber: order.orderNumber
    });
    
    res.json(order);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.get('/reports/sales', adminAuth, async (req, res) => {
  try {
    const { period } = req.query;
    let matchStage = { paymentStatus: 'completed' };
    let groupStage;
    
    const now = new Date();
    
    switch (period) {
      case 'daily':
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        matchStage.createdAt = { $gte: today, $lt: tomorrow };
        groupStage = {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          revenue: { $sum: '$totalAmount' },
          orders: { $sum: 1 }
        };
        break;
      case 'weekly':
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        matchStage.createdAt = { $gte: weekAgo };
        groupStage = {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          revenue: { $sum: '$totalAmount' },
          orders: { $sum: 1 }
        };
        break;
      case 'monthly':
        const monthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
        matchStage.createdAt = { $gte: monthAgo };
        groupStage = {
          _id: { $dateToString: { format: '%Y-%m', date: '$createdAt' } },
          revenue: { $sum: '$totalAmount' },
          orders: { $sum: 1 }
        };
        break;
      case 'all':
      default:
        // For "all time" - total summary
        groupStage = {
          _id: null,
          revenue: { $sum: '$totalAmount' },
          orders: { $sum: 1 }
        };
    }
    
    const salesData = await Order.aggregate([
      { $match: matchStage },
      { $group: groupStage },
      { $sort: { _id: 1 } }
    ]);
    
    res.json(salesData);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.get('/reports/top-items', adminAuth, async (req, res) => {
  try {
    const topItems = await Order.aggregate([
      { $match: { paymentStatus: 'completed' } },
      { $unwind: '$items' },
      {
        $lookup: {
          from: 'menuitems',
          localField: 'items.item',
          foreignField: '_id',
          as: 'itemDetails'
        }
      },
      { $unwind: '$itemDetails' },
      {
        $group: {
          _id: '$items.item',
          name: { $first: '$itemDetails.name' },
          totalQuantity: { $sum: '$items.quantity' },
          totalRevenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } }
        }
      },
      { $sort: { totalQuantity: -1 } },
      { $limit: 10 }
    ]);
    
    res.json(topItems);
  } catch (error) {
    console.error('Error fetching top items:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.get('/stock/status', adminAuth, async (req, res) => {
  try {
    console.log('📊 Fetching stock status...');
    
    // Get all items with daily stock tracking
    const allStockItems = await MenuItem.find({ 
      dailyStock: { $gt: 0 } 
    }).select('name dailyStock currentStock isAvailable isOutOfStock');

    // Calculate low stock items manually (less than 20% remaining)
    const lowStockItems = allStockItems.filter(item => {
      const stockPercentage = (item.currentStock / item.dailyStock) * 100;
      return item.currentStock > 0 && stockPercentage <= 20;
    });

    // Get out of stock items
    const outOfStockItems = allStockItems.filter(item => item.currentStock <= 0);

    console.log(`📦 Stock data: ${allStockItems.length} tracked items`);

    res.json({
      lowStock: lowStockItems,
      outOfStock: outOfStockItems,
      allStockItems: allStockItems,
      summary: {
        totalTracked: allStockItems.length,
        lowStock: lowStockItems.length,
        outOfStock: outOfStockItems.length,
        inStock: allStockItems.filter(item => item.currentStock > 0).length
      }
    });
  } catch (error) {
    console.error('❌ Error fetching stock status:', error);
    res.status(500).json({ 
      message: 'Server error fetching stock status', 
      error: error.message 
    });
  }
});

router.put('/stock/:id', adminAuth, async (req, res) => {
  try {
    const { currentStock, dailyStock } = req.body;
    
    console.log(`🔄 Updating stock for item ${req.params.id}:`, { currentStock, dailyStock });
    
    const updatedItem = await MenuItem.findByIdAndUpdate(
      req.params.id,
      {
        currentStock: parseInt(currentStock) || 0,
        dailyStock: parseInt(dailyStock) || 0,
        isOutOfStock: parseInt(currentStock) <= 0,
        isAvailable: parseInt(currentStock) > 0
      },
      { new: true }
    );
    
    if (!updatedItem) {
      return res.status(404).json({ message: 'Item not found' });
    }
    
    console.log(`✅ Stock updated for ${updatedItem.name}`);
    res.json(updatedItem);
  } catch (error) {
    console.error('❌ Error updating stock:', error);
    res.status(500).json({ 
      message: 'Server error updating stock', 
      error: error.message 
    });
  }
});

router.post('/stock/reset', adminAuth, async (req, res) => {
  try {
    console.log('🔄 Manual stock reset requested');
    
    // First get all items that need resetting
    const itemsToReset = await MenuItem.find({ dailyStock: { $gt: 0 } });
    
    // Reset each item individually
    const updatePromises = itemsToReset.map(item => 
      MenuItem.findByIdAndUpdate(
        item._id,
        { 
          currentStock: item.dailyStock,
          isOutOfStock: false,
          isAvailable: true
        }
      )
    );
    
    await Promise.all(updatePromises);
    
    console.log(`✅ Stock reset completed. Updated ${itemsToReset.length} items.`);
    
    res.json({ 
      message: 'Stock reset successfully',
      modifiedCount: itemsToReset.length
    });
  } catch (error) {
    console.error('❌ Error resetting stock:', error);
    res.status(500).json({ 
      message: 'Server error resetting stock', 
      error: error.message 
    });
  }
});

router.put('/stock/bulk-update', adminAuth, async (req, res) => {
  try {
    const { updates } = req.body; // Array of { itemId, dailyStock }
    
    const bulkOperations = updates.map(update => ({
      updateOne: {
        filter: { _id: update.itemId },
        update: { 
          dailyStock: update.dailyStock,
          currentStock: update.dailyStock, // Reset current stock to new daily stock
          isOutOfStock: false,
          isAvailable: true
        }
      }
    }));
    
    const result = await MenuItem.bulkWrite(bulkOperations);
    
    res.json({
      message: 'Bulk stock update completed',
      modifiedCount: result.modifiedCount
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});


export default router;