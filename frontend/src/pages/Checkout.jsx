import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';
import { CreditCard, Smartphone, Banknote } from 'lucide-react';
import axios from 'axios';

const Checkout = () => {
  const navigate = useNavigate();
  const { cartItems, getCartTotal, clearCart } = useCart();
  const { user, isAuthenticated } = useAuth();
  
  const [loading, setLoading] = useState(false);
  const [orderData, setOrderData] = useState({
    paymentMethod: 'upi',
    orderType: 'pickup',
    tableNumber: '',
    guestInfo: {
      name: user?.name || '',
      phone: user?.phone || '',
      email: user?.email || ''
    }
  });

  const subtotal = getCartTotal();
  const tax = subtotal * 0.05;
  const total = subtotal + tax;

  // Use useEffect for navigation when cart is empty
  useEffect(() => {
    if (cartItems.length === 0) {
      navigate('/cart');
    }
  }, [cartItems.length, navigate]);

  const handleInputChange = (field, value) => {
    if (field.startsWith('guestInfo.')) {
      const guestField = field.split('.')[1];
      setOrderData(prev => ({
        ...prev,
        guestInfo: {
          ...prev.guestInfo,
          [guestField]: value
        }
      }));
    } else {
      setOrderData(prev => ({
        ...prev,
        [field]: value
      }));
    }
  };

  const validateForm = () => {
    if (!isAuthenticated) {
      if (!orderData.guestInfo.name.trim()) {
        toast.error('Please enter your name');
        return false;
      }
      if (!orderData.guestInfo.phone.trim()) {
        toast.error('Please enter your phone number');
        return false;
      }
    }
    
    if (orderData.orderType === 'dine-in' && !orderData.tableNumber.trim()) {
      toast.error('Please enter table number');
      return false;
    }
    
    return true;
  };

  const handlePlaceOrder = async () => {
    if (!validateForm()) return;
    
    setLoading(true);

    try {
      const items = cartItems.map(cartItem => {
        const itemTotal = cartItem.price * cartItem.quantity;
        
        const itemData = {
          item: cartItem.item._id,
          name: cartItem.item.name,
          quantity: cartItem.quantity,
          customizations: cartItem.customizations || {},
          price: cartItem.price,
          itemTotal: itemTotal 
        };

        if (!itemData.item || !itemData.quantity || !itemData.price) {
          throw new Error(`Invalid cart item: ${JSON.stringify(itemData)}`);
        }

        console.log('📦 Prepared order item:', itemData);
        return itemData;
      });

      console.log('✅ Prepared order items:', items);

      const subtotal = items.reduce((total, item) => total + item.itemTotal, 0);
      const tax = subtotal * 0.05;
      const total = subtotal + tax;

      const orderPayload = {
        items,
        paymentMethod: orderData.paymentMethod,
        orderType: orderData.orderType,
        tableNumber: orderData.tableNumber,
        totalAmount: total,
        subtotal: subtotal,
        tax: tax
      };

      // Add user/guest info
      if (!isAuthenticated) {
        orderPayload.guestInfo = orderData.guestInfo;
      } else {
        // Send complete user information, not just ID
        orderPayload.user = {
          _id: user._id,
          name: user.name,
          email: user.email,
          phone: user.phone
        };
      }

      console.log('📤 Sending order payload:', orderPayload);

      if (orderData.paymentMethod === 'upi')
      {
        await handleRazorpayPayment(orderPayload);
      }
      if (orderData.paymentMethod === 'cash') {
        // FIXED: Moved the success navigation inside the function
        toast.success('Order placed successfully! Pay at the counter.');
        clearCart();
        navigate(`/track/${order.orderNumber}`);
      }



      // Create order
      // const response = await axios.post('http://localhost:5000/api/orders', orderPayload);
      // const order = response.data;

      // console.log('🎉 Order created successfully:', order);

      // // Handle payment
      // if (orderData.paymentMethod === 'upi') {
      //   await handleUPIPayment(order);
      // } else if (orderData.paymentMethod === 'cash') {
      //   // FIXED: Moved the success navigation inside the function
      //   toast.success('Order placed successfully! Pay at the counter.');
      //   clearCart();
      //   navigate(`/track/${order.orderNumber}`);
      // }

    } catch (error) {
      console.error('❌ Error placing order:', error);
      
      // if (error.response) {
      //   console.error('📡 Server response:', error.response.data);
        
      //   const serverError = error.response.data;
      //   let errorMessage = 'Failed to place order. ';
        
      //   if (serverError.message) {
      //     errorMessage += serverError.message;
      //   }
      //   if (serverError.error) {
      //     errorMessage += ` Error: ${serverError.error}`;
      //   }
      //   if (serverError.details) {
      //     errorMessage += ` Details: ${JSON.stringify(serverError.details)}`;
      //   }
        
        toast.error(errorMessage);
      // } else if (error.request) {
      //   console.error('🌐 No response received:', error.request);
      //   toast.error('No response from server. Please check your connection.');
      // } else {
      //   console.error('⚡ Request setup error:', error.message);
      //   toast.error(`Request error: ${error.message}`);
      // }
    } finally {
      setLoading(false);
    }
  };

  // ######################## Razorpay Script Loader ###################

  const loadRazorpayScript = () =>
    new Promise((resolve) => {
      if (
        document.querySelector(
          'script[src="https://checkout.razorpay.com/v1/checkout.js"]'
        )
      ) {
        resolve(true);
        return;
      }
      const s = document.createElement("script");
      s.src = "https://checkout.razorpay.com/v1/checkout.js";
      s.onload = () => resolve(true);
      document.body.appendChild(s);
    });

  // ######################## Razorpay Payment Integration ########################
  const handleRazorpayPayment = async (orderPayload) => {
    try {
      setLoading(true);
      await loadRazorpayScript();
      await new Promise((resolve) => setTimeout(resolve, 500));

      if (!window.Razorpay) {
        alert("Razorpay SDK failed to load.");
        setLoading(false);
        return;
      }

      const { data: razorpayOrder} = await axios.post(`http://localhost:5000/api/orders`, {
        orderDetails:orderPayload,
      });

      if (!razorpayOrder?.id) {
        alert("Payment initialization failed.");
        setLoading(false);
        return;
      }

      const options = {
        key: "rzp_test_RA3UwDYeO95xUZ",
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency || "INR",
        name: "Campus Craving",
        description: "Food Order Payment",
        order_id: razorpayOrder.id,
        handler: async function (response) {
          if (!response.razorpay_payment_id) {
            alert("Payment failed");
            setLoading(false);
            return;
          }
          try {
            const verifyResp = await axios.post(`http://localhost:5000/api/orders/verify`, {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              orderDetails: orderPayload,
            });

            if (verifyResp.data.success) {
             toast.success('Payment successful!');
             clearCart();
             navigate(`/track/${verifyResp.data.order?.orderNumber}`);
            } else {
              toast("Payment verification failed.");
            }
          } catch (err) {
            toast("Payment verification failed.");
          } finally {
            setLoading(false);
          }
        },
        prefill: {
          name: orderData.guestInfo.name || user?.name || '',
          email: orderData.guestInfo.email || user?.email || '',
          contact: orderData.guestInfo.phone || user?.phone || '',
        },
        theme: { color: "#ff9800" },
        modal: {
          ondismiss: () => {
            setLoading(false);
            alert("Payment popup closed.");
          },
        },
      };

      new window.Razorpay(options).open();
    } catch (err) {
      alert("Payment initiation failed.");
      setLoading(false);
    }
  };
  // ########################

  const handleUPIPayment = async (order) => {
    try {
      // Create fake payment order
      const paymentResponse = await axios.post('http://localhost:5000/api/payment/create-order', {
        amount: total,
        orderId: order._id
      });

      console.log('Payment order created:', paymentResponse.data);

      // Simulate UPI payment process
      toast.loading('Processing UPI payment...');
      
      // Simulate payment processing delay
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Verify payment - this will always succeed in fake mode
      const verifyResponse = await axios.post('http://localhost:5000/api/payment/verify', {
        razorpay_order_id: paymentResponse.data.id,
        razorpay_payment_id: `fake_pay_${Date.now()}`,
        razorpay_signature: 'fake_signature',
        orderId: order._id
      });

      console.log('Payment verification:', verifyResponse.data);

      if (verifyResponse.data.success) {
        toast.dismiss();
        // FIXED: Moved the success navigation inside the function
        toast.success('Payment successful! Order confirmed.');
        clearCart();
        navigate(`/track/${order.orderNumber}`);
      } else {
        toast.dismiss();
        toast.error('Payment failed. Please try again.');
      }

    } catch (error) {
      console.error('Payment error:', error);
      console.error('Payment error response:', error.response?.data);
      toast.dismiss();
      toast.error('Payment processing failed');
    }
  };

  // Don't render if cart is empty (will redirect via useEffect)
  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-lg text-gray-600">Redirecting to cart...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Checkout</h1>
          <p className="text-gray-600">Complete your order</p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Order Form */}
          <div className="space-y-6">
            {/* Guest Information */}
            {!isAuthenticated && (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-lg font-semibold mb-4">Your Information</h2>
                <div className="grid grid-cols-1 gap-4">
                  <input
                    type="text"
                    placeholder="Full Name"
                    value={orderData.guestInfo.name}
                    onChange={(e) => handleInputChange('guestInfo.name', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    required
                  />
                  <input
                    type="tel"
                    placeholder="Phone Number"
                    value={orderData.guestInfo.phone}
                    onChange={(e) => handleInputChange('guestInfo.phone', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    required
                  />
                  <input
                    type="email"
                    placeholder="Email (optional)"
                    value={orderData.guestInfo.email}
                    onChange={(e) => handleInputChange('guestInfo.email', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>
              </div>
            )}

            {/* Order Type */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-semibold mb-4">Order Type</h2>
              <div className="space-y-3">
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="orderType"
                    value="pickup"
                    checked={orderData.orderType === 'pickup'}
                    onChange={(e) => handleInputChange('orderType', e.target.value)}
                    className="text-green-600"
                  />
                  <span className="ml-2">Pickup from Counter</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="orderType"
                    value="dine-in"
                    checked={orderData.orderType === 'dine-in'}
                    onChange={(e) => handleInputChange('orderType', e.target.value)}
                    className="text-green-600"
                  />
                  <span className="ml-2">Dine In</span>
                </label>
              </div>
              
              {orderData.orderType === 'dine-in' && (
                <div className="mt-4">
                  <input
                    type="text"
                    placeholder="Table Number"
                    value={orderData.tableNumber}
                    onChange={(e) => handleInputChange('tableNumber', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>
              )}
            </div>

            {/* Payment Method */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-semibold mb-4">Payment Method</h2>
              <div className="space-y-3">
                <label className="flex items-center p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="upi"
                    checked={orderData.paymentMethod === 'upi'}
                    onChange={(e) => handleInputChange('paymentMethod', e.target.value)}
                    className="text-green-600"
                  />
                  <Smartphone className="ml-2 mr-3 h-5 w-5 text-green-600" />
                  <span>UPI / Digital Payment</span>
                </label>
                
                <label className="flex items-center p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="cash"
                    checked={orderData.paymentMethod === 'cash'}
                    onChange={(e) => handleInputChange('paymentMethod', e.target.value)}
                    className="text-green-600"
                  />
                  <Banknote className="ml-2 mr-3 h-5 w-5 text-green-600" />
                  <span>Cash at Counter</span>
                </label>
              </div>
            </div>
          </div>

          {/* Order Summary */}
          <div className="bg-white rounded-lg shadow-sm p-6 h-fit sticky top-24">
            <h2 className="text-lg font-semibold mb-4">Order Summary</h2>
            
            <div className="space-y-3 mb-4">
              {cartItems.map((item, index) => (
                <div key={index} className="flex justify-between items-start">
                  <div className="flex-1">
                    <span className="text-sm font-medium">{item.item.name}</span>
                    <span className="text-xs text-gray-500 ml-2">x{item.quantity}</span>
                    {Object.keys(item.customizations || {}).length > 0 && (
                      <div className="text-xs text-gray-500 mt-1">
                        {Object.entries(item.customizations).map(([key, value]) => (
                          <span key={key} className="block">{key}: {value}</span>
                        ))}
                      </div>
                    )}
                  </div>
                  <span className="text-sm">₹{(item.price * item.quantity).toFixed(2)}</span>
                </div>
              ))}
            </div>
            
            <div className="border-t border-gray-200 pt-4 space-y-2">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>₹{subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Tax (5%)</span>
                <span>₹{tax.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center text-lg font-semibold border-t pt-2">
                <span>Total</span>
                <span className="text-green-600">₹{total.toFixed(2)}</span>
              </div>
            </div>
            
            <button
              onClick={handlePlaceOrder}
              disabled={loading}
              className="w-full bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 transition-colors font-medium mt-6 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Placing Order...' : `Place Order (₹${total.toFixed(2)})`}
            </button>
            
            {isAuthenticated && (
              <div className="mt-4 text-center">
                <button
                  onClick={() => navigate('/my-orders')}
                  className="text-green-600 hover:text-green-700 text-sm font-medium"
                >
                  View My Orders →
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;