import express from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from "bcryptjs";
import User from '../models/User.js';
import auth from '../middleware/auth.js';

const router = express.Router();

router.post('/register', async (req, res) => {
  try {
    const { name, email, password, phone } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const user = new User({ name, email, password, phone });
    await user.save();

    const token = jwt.sign(
      { 
        userId: user._id, 
        role: user.role,
        email: user.email
      },
      process.env.JWT_SECRET,
      { 
        expiresIn: '7d' 
      }
    );

    res.status(201).json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log('Login attempt for email:', email);

    // Convert to lowercase to match schema
    const user = await User.findOne({ email: email.toLowerCase() });
    
    if (!user) {
      console.log('User not found');
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    console.log('User found:', user.email);
    console.log('Stored hash:', user.password);
    console.log('Input password:', password);
    
    // Test the password comparison directly
    const directCompare = await bcrypt.compare(password, user.password);
    console.log('Direct bcrypt.compare result:', directCompare);
    
    // Test the model method
    const methodCompare = await user.comparePassword(password);
    console.log('User method compare result:', methodCompare);
    
    if (!methodCompare) {
      console.log('Password does not match');
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { 
        userId: user._id, 
        role: user.role, 
        email: user.email
      }, 
      process.env.JWT_SECRET, 
      { 
        expiresIn: '7d' 
      });

    res.json({ token, user: { id: user._id, name: user.name, email: user.email, role: user.role, cart: user.cart } });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.get('/profile', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId)
      .select('-password')
      .populate('cart.item')
      .populate('orders');
    
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.post('/cart', auth, async (req, res) => {
  try {
    const { items } = req.body;
    
    console.log('Updating user cart:', { userId: req.user.userId, itemsCount: items?.length });
    
    const user = await User.findById(req.user.userId);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Validate and process cart items
    const processedItems = items.map(item => {
      // Ensure item has the correct structure for the User model
      return {
        item: item.item?._id || item.item, // Handle both populated and ID-only items
        quantity: item.quantity,
        customizations: item.customizations || {},
        price: item.price
      };
    });

    user.cart = processedItems;
    await user.save();
    
    // Populate the cart for response
    const updatedUser = await User.findById(req.user.userId)
      .populate('cart.item')
      .select('-password');
    
    console.log('Cart updated successfully');
    res.json(updatedUser.cart);
  } catch (error) {
    console.error('Error updating cart:', error);
    res.status(500).json({ 
      message: 'Server error updating cart', 
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

export default router;
