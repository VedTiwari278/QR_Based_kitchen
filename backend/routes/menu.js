import express from 'express';
import MenuItem from '../models/MenuItem.js';
import auth from '../middleware/auth.js';
import adminAuth from '../middleware/adminAuth.js';

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const { category, isVeg, minPrice, maxPrice, search } = req.query;
    
    let filter = { 
      isAvailable: true,
      $or: [
        { dailyStock: 0 }, 
        { 
          dailyStock: { $gt: 0 },
          currentStock: { $gt: 0 },
          isOutOfStock: false
        }
      ]
    };
    
    if (category) filter.category = category;
    if (isVeg !== undefined) filter.isVeg = isVeg === 'true';
    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = Number(minPrice);
      if (maxPrice) filter.price.$lte = Number(maxPrice);
    }
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }
    
    const items = await MenuItem.find(filter).sort({ isPopular: -1, createdAt: -1 });
    
    const itemsWithStock = items.map(item => ({
      ...item.toObject(),
      stockInfo: item.dailyStock > 0 ? {
        currentStock: item.currentStock,
        dailyStock: item.dailyStock,
        isLowStock: item.currentStock <= item.dailyStock * 0.2
      } : null
    }));
    
    res.json(itemsWithStock);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const item = await MenuItem.findById(req.params.id);
    if (!item) {
      return res.status(404).json({ message: 'Item not found' });
    }
    res.json(item);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.get('/categories/all', async (req, res) => {
  try {
    const categories = await MenuItem.distinct('category', { isAvailable: true });
    res.json(categories);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.get('/popular/items', async (req, res) => {
  try {
    const items = await MenuItem.find({ isPopular: true, isAvailable: true })
      .limit(6)
      .sort({ rating: -1 });
    res.json(items);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

export default router;
