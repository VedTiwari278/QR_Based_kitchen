import express from 'express';
import Order from '../models/Order.js';
import auth from '../middleware/auth.js';
import MenuItem from '../models/MenuItem.js';
import Razorpay from 'razorpay';
import dotenv from 'dotenv';
import crypto from 'node:crypto';
dotenv.config();



const router = express.Router();

function generateOrderNumber() {
  const prefix = 'CC';
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const randomNum = Math.floor(100000 + Math.random() * 900000);
  return `${prefix}-${date}-${randomNum}`;
}


const razorpayInstance = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

const createPaymentOrder = async ({ amount, currency, receipt }) => {

  console.log('Razorpay Key ID:', process.env.RAZORPAY_KEY_ID);
  console.log('Razorpay Secret:', process.env.RAZORPAY_KEY_SECRET);

  return await razorpayInstance.orders.create({
    amount: Math.round(amount * 100), // convert to paise
    currency,
    receipt,
    payment_capture: 1
  });
};

router.post('/', async (req, res) => {
  try {
    const { orderDetails } = req.body;

    console.log("Helloooooooo",orderDetails);

    if (!orderDetails) {
      return res.status(400).json({ message: 'Missing orderDetails in request body' });
    }

    const { items, paymentMethod, orderType, tableNumber, guestInfo, totalAmount, user } = orderDetails;

    console.log('📥 Received order data:', { 
      itemsCount: items?.length, 
      paymentMethod, 
      orderType, 
      tableNumber, 
      totalAmount,
      user: user ? 'logged-in' : 'guest'
    });

    if (!items || items.length === 0) {
      return res.status(400).json({ message: 'Order must have at least one item' });
    }

    
    if (!paymentMethod || !orderType) {
      return res.status(400).json({ message: 'Missing required fields: paymentMethod or orderType' });
    }


    // const myorder = await RazorpayService.createPaymentOrder(orderDetails);

    const stockErrors = [];
    for (const item of items) {
      const menuItem = await MenuItem.findById(item.item);
      if (menuItem && menuItem.dailyStock > 0) {
        if (menuItem.currentStock < item.quantity) {
          stockErrors.push({
            item: item.name,
            requested: item.quantity,
            available: menuItem.currentStock,
            message: `Only ${menuItem.currentStock} ${menuItem.name} available`
          });
        }
      }
    }

    if (stockErrors.length > 0) {
      return res.status(400).json({ 
        message: 'Insufficient stock for some items',
        errors: stockErrors
      });
    }

  // if (!paymentMethod || !orderType) {
  //   return res.status(400).json({ message: 'Missing required fields: paymentMethod, orderType' });
  // }

  // const orderNumber = generateOrderNumber();

    const orderItems = items.map(item => {
      console.log('📦 Processing order item:', item);
      
      const itemTotal = item.price * item.quantity;
      
      return {
        item: item.item, 
        name: item.name || 'Menu Item',
        quantity: item.quantity,
        customizations: item.customizations || {},
        price: item.price,
        itemTotal: itemTotal 
      };
    });

    const subtotal = orderItems.reduce((total, item) => total + item.itemTotal, 0);
    const tax = subtotal * 0.05;
    const calculatedTotal = subtotal + tax;

    const orderNumber = generateOrderNumber();

    console.log('🧮 Calculated totals:', { subtotal, tax, calculatedTotal });

    const baseOrderData  = {
      orderNumber,
      items: orderItems,
      paymentMethod,
      orderType,
      tableNumber: orderType === 'dine-in' ? (tableNumber || '1') : '',
      guestInfo: guestInfo || {},
      subtotal: subtotal,
      tax: tax,
      totalAmount: calculatedTotal,
      status: 'pending',
      paymentStatus: paymentMethod === 'cash' ? 'pending' : 'pending'
    };

    if (user) {
      baseOrderData .user = user;
    }

     if (paymentMethod === 'upi') {
      console.log('💸 Initiating Razorpay order...');
      const razorpayOrder = await createPaymentOrder({
        amount: calculatedTotal,
        currency: 'INR',
        receipt: `receipt_${orderNumber}`
      });

      razorpayOrder.orderDetails = baseOrderData;

      console.log('✅ Razorpay order created:', razorpayOrder.id);
      return res.status(200).json(razorpayOrder);}

    // console.log('📤 Creating order with data:', orderData);

      console.log('💵 Creating cash order...');

    const order = new Order(baseOrderData);
    const savedOrder = await order.save();
    console.log('✅ Order saved successfully:', savedOrder.orderNumber);

    req.io.emit('new-order', {
      orderId: savedOrder._id,
      orderNumber: savedOrder.orderNumber,
      status: savedOrder.status
    });

    const populatedOrder = await Order.findById(savedOrder._id)
      .populate('items.item')
      .populate('user', 'name email');

    res.status(201).json(populatedOrder);
    
  } catch (error) {
    console.error('❌ Error creating order:', error);
    res.status(500).json({ 
      message: 'Server error creating order', 
      error: error.message
    });
  }
});



router.post('/verify', async (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      orderDetails
    } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !orderDetails) {
      return res.status(400).json({ success: false, message: 'Missing payment or order data' });
    }

    // 1️⃣ Verify the Razorpay signature
    const generated_signature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(razorpay_order_id + '|' + razorpay_payment_id)
      .digest('hex');

    if (generated_signature !== razorpay_signature) {
      return res.status(400).json({ success: false, message: 'Signature mismatch. Payment verification failed.' });
    }

    // 2️⃣ Signature matched, save the order
    const orderNumber = generateOrderNumber();
    const { items, paymentMethod, orderType, tableNumber, guestInfo, subtotal, tax, totalAmount, user } = orderDetails;

    const orderData = {
      orderNumber,
      items,
      paymentMethod,
      orderType,
      tableNumber: orderType === 'dine-in' ? (tableNumber || '1') : '',
      guestInfo: guestInfo || {},
      subtotal,
      tax,
      totalAmount,
      status: 'confirmed',         
      paymentStatus: 'completed',
      razorpayPaymentId: razorpay_payment_id,
      razorpayOrderId: razorpay_order_id
    };

    if (user) {
      orderData.user = user;
    }

    const order = new Order(orderData);
    const savedOrder = await order.save();

    // Optional: populate items or user
    const populatedOrder = await Order.findById(savedOrder._id)
      .populate('items.item')
      .populate('user', 'name email');

    console.log('✅ Payment verified and order saved:', order.orderNumber);

    res.status(200).json({
      success: true,
      message: 'Payment verified and order placed',
      order: populatedOrder
    });

  } catch (error) {
    console.error('❌ Error verifying payment:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error during payment verification',
      error: error.message
    });
  }
});


router.get('/track/:orderNumber', async (req, res) => {
  try {
    const { orderNumber } = req.params;
    
    const order = await Order.findOne({ orderNumber })
      .populate('items.item')
      .populate('user', 'name email phone');

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    const orderTime = new Date(order.createdAt);
    const estimatedCompletion = new Date(orderTime.getTime() + order.estimatedTime * 60000);
    const timeRemaining = Math.max(0, Math.ceil((estimatedCompletion - new Date()) / 60000));

    res.json({
      ...order.toObject(),
      estimatedCompletion: estimatedCompletion.toISOString(),
      timeRemaining: timeRemaining
    });

  } catch (error) {
    console.error('Error fetching order:', error);
    res.status(500).json({ message: 'Error fetching order', error: error.message });
  }
});

router.get('/my-orders', auth, async (req, res) => {
  try {
    if (!req.user || !req.user.userId) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const orders = await Order.find({ 
      $or: [
        { user: req.user.userId },
        { 'guestInfo.email': req.user.email }
      ]
    })
    .populate('items.item')
    .sort({ createdAt: -1 });

    res.json(orders);
  } catch (error) {
    console.error('Error fetching user orders:', error);
    res.status(500).json({ 
      message: 'Error fetching orders', 
      error: error.message 
    });
  }
});

router.get('/', async (req, res) => {
  try {
    const orders = await Order.find()
      .populate('items.item')
      .populate('user', 'name email')
      .sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching orders', error: error.message });
  }
});

router.put('/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    const { id } = req.params;

    const order = await Order.findByIdAndUpdate(
      id,
      { status, updatedAt: new Date() },
      { new: true }
    ).populate('items.item').populate('user', '-password');

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    req.io.to(`order-${order._id}`).emit('order-status-update', {
      orderId: order._id,
      orderNumber: order.orderNumber,
      status: order.status,
      estimatedTime: order.estimatedTime
    });

    res.json(order);
  } catch (error) {
    res.status(500).json({ message: 'Error updating order status', error: error.message });
  }
});

export default router;