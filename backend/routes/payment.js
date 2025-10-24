// import express from 'express';
// import Razorpay from 'razorpay';
// import Order from '../models/Order.js';
// import crypto from 'crypto';

// const router = express.Router();

// const razorpay = new Razorpay({
//   key_id: process.env.RAZORPAY_KEY_ID,
//   key_secret: process.env.RAZORPAY_KEY_SECRET,
// });

// // Create Razorpay order
// router.post('/create-order', async (req, res) => {
//   try {
//     const { amount, orderId } = req.body;
    
//     const options = {
//       amount: amount * 100, // amount in smallest currency unit
//       currency: 'INR',
//       receipt: orderId,
//     };
    
//     const razorpayOrder = await razorpay.orders.create(options);
    
//     res.json({
//       id: razorpayOrder.id,
//       amount: razorpayOrder.amount,
//       currency: razorpayOrder.currency,
//     });
//   } catch (error) {
//     res.status(500).json({ message: 'Error creating payment order', error: error.message });
//   }
// });

// // Verify payment
// router.post('/verify', async (req, res) => {
//   try {
//     const { razorpay_order_id, razorpay_payment_id, razorpay_signature, orderId } = req.body;
    
//     const hmac = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET);
//     hmac.update(razorpay_order_id + '|' + razorpay_payment_id);
//     const generated_signature = hmac.digest('hex');
    
//     if (generated_signature === razorpay_signature) {
//       // Payment verified successfully
//       const order = await Order.findByIdAndUpdate(
//         orderId,
//         {
//           paymentStatus: 'completed',
//           paymentId: razorpay_payment_id,
//           status: 'confirmed'
//         },
//         { new: true }
//       );
      
//       res.json({ success: true, order });
//     } else {
//       res.status(400).json({ success: false, message: 'Invalid signature' });
//     }
//   } catch (error) {
//     res.status(500).json({ message: 'Payment verification failed', error: error.message });
//   }
// });

// export default router;


import express from 'express';
import Order from '../models/Order.js';

const router = express.Router();

// Create fake payment order
router.post('/create-order', async (req, res) => {
  try {
    const { amount, orderId } = req.body;
    
    // Generate a fake order ID
    const fakeOrderId = `fake_ord_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    res.json({
      id: fakeOrderId,
      amount: amount * 100, // Convert to paise to match Razorpay format
      currency: 'INR',
    });
  } catch (error) {
    res.status(500).json({ message: 'Error creating payment order', error: error.message });
  }
});

// Verify fake payment - always returns success
router.post('/verify', async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, orderId } = req.body;
    
    // Always treat payment as successful in fake mode
    const fakePaymentId = `fake_pay_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Update order with successful payment
    const order = await Order.findByIdAndUpdate(
      orderId,
      {
        paymentStatus: 'completed',
        paymentId: fakePaymentId,
        status: 'confirmed'
      },
      { new: true }
    );
    
    res.json({ 
      success: true, 
      order,
      message: 'Payment verified successfully (fake payment mode)'
    });
    
  } catch (error) {
    res.status(500).json({ message: 'Payment verification failed', error: error.message });
  }
});

// Additional endpoint to simulate payment failure if needed
router.post('/simulate-failure', async (req, res) => {
  try {
    const { orderId } = req.body;
    
    // Update order with failed payment
    const order = await Order.findByIdAndUpdate(
      orderId,
      {
        paymentStatus: 'failed',
        status: 'payment_failed'
      },
      { new: true }
    );
    
    res.json({ 
      success: false, 
      order,
      message: 'Payment failed (simulated)'
    });
    
  } catch (error) {
    res.status(500).json({ message: 'Simulation failed', error: error.message });
  }
});

export default router;