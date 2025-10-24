import React, { useState, useEffect } from 'react';
import { Eye, Clock, CheckCircle, Package, Search } from 'lucide-react';
import { toast } from 'react-hot-toast';
import axios from 'axios';
import io from 'socket.io-client';

const AdminOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    status: '',
    date: '',
    search: ''
  });
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    fetchOrders();
    
    // Setup socket connection for real-time updates
    const newSocket = io('http://localhost:5000');
    setSocket(newSocket);
    newSocket.emit('join-admin');
    
    // Listen for new orders
    newSocket.on('new-order', (order) => {
      toast.success(`New order received: #${order.orderNumber}`);
      fetchOrders(); // Refresh orders list
    });
    
    return () => newSocket.close();
  }, []);

  useEffect(() => {
    fetchOrders();
  }, [filters]);

  const fetchOrders = async () => {
    try {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, value);
      });
      
      const response = await axios.get(`http://localhost:5000/api/admin/orders?${params}`);
      setOrders(response.data);
    } catch (error) {
      console.error('Error fetching orders:', error);
      toast.error('Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      await axios.put(`http://localhost:5000/api/admin/orders/${orderId}/status`, {
        status: newStatus
      });
      
      toast.success('Order status updated successfully');
      fetchOrders();
    } catch (error) {
      console.error('Error updating order status:', error);
      toast.error('Failed to update order status');
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      'new': 'bg-blue-100 text-blue-800',
      'confirmed': 'bg-yellow-100 text-yellow-800',
      'preparing': 'bg-orange-100 text-orange-800',
      'ready': 'bg-green-100 text-green-800',
      'completed': 'bg-gray-100 text-gray-800',
      'cancelled': 'bg-red-100 text-red-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  useEffect(() => {
  const checkAndUpdateOrderStatus = () => {
    orders.forEach(async (order) => {
      if (order.status === 'confirmed' || order.status === 'preparing') {
        const now = new Date();
        const orderTime = new Date(order.createdAt);
        const timeElapsed = (now - orderTime) / (1000 * 60); // minutes
        
        // Calculate average preparation time for all items
        const avgPreparationTime = order.items.reduce((total, item) => {
          return total + (item.item?.preparationTime || 15);
        }, 0) / order.items.length;
        
        // Automatic status updates based on time
        if (order.status === 'confirmed' && timeElapsed >= 2) {
          // After 2 minutes, move to preparing
          await updateOrderStatus(order._id, 'preparing');
        } else if (order.status === 'preparing' && timeElapsed >= avgPreparationTime * 0.7) {
          // After 70% of preparation time, move to ready
          await updateOrderStatus(order._id, 'ready');
        }
      }
    });
  };

  // Check every 30 seconds
  const interval = setInterval(checkAndUpdateOrderStatus, 30000);
  
  return () => clearInterval(interval);
}, [orders]);


  const getStatusActions = (currentStatus) => {
    const statusFlow = {
      'new': ['confirmed', 'cancelled'],
      'confirmed': ['preparing', 'cancelled'],
      'preparing': ['ready', 'cancelled'],
      'ready': ['completed'],
      'completed': [],
      'cancelled': []
    };
    return statusFlow[currentStatus] || [];
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Order Management</h1>
          <p className="text-gray-600">Manage and track all orders</p>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search orders..."
                value={filters.search}
                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>
            
            <select
  value={filters.status}
  onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent"
>
  <option value="">All Statuses</option>
  <option value="pending">Pending</option>
  <option value="confirmed">Confirmed</option>
  <option value="preparing">Preparing</option>
  <option value="ready">Ready</option>
  <option value="completed">Completed</option>
  <option value="cancelled">Cancelled</option>
</select>
            
            <input
              type="date"
              value={filters.date}
              onChange={(e) => setFilters(prev => ({ ...prev, date: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
            
            <button
              onClick={() => setFilters({ status: '', date: '', search: '' })}
              className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 transition-colors"
            >
              Clear Filters
            </button>
          </div>
        </div>

        {/* Orders List */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Order
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Items
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Time
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {orders.map((order) => (
                  <tr key={order._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          #{order.orderNumber}
                        </div>
                        <div className="text-sm text-gray-500">
                          {order.orderType === 'dine-in' ? `Table ${order.tableNumber}` : 'Pickup'}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {order.user?.name || order.guestInfo?.name}
                        </div>
                        <div className="text-sm text-gray-500">
                          {order.user?.phone || order.guestInfo?.phone}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {order.items.length} item{order.items.length !== 1 ? 's' : ''}
                      </div>
                      <div className="text-sm text-gray-500">
                        {order.items.slice(0, 2).map(item => item.name).join(', ')}
                        {order.items.length > 2 && ` +${order.items.length - 2} more`}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
  <div className="text-sm font-medium text-gray-900">₹{order.totalAmount || order.total || 0}</div>
  <div className={`text-xs px-2 py-1 rounded-full ${
    order.paymentStatus === 'completed' 
      ? 'bg-green-100 text-green-800'
      : 'bg-yellow-100 text-yellow-800'
  }`}>
    {order.paymentStatus}
  </div>
</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(order.status)}`}>
                        {order.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div>{new Date(order.createdAt).toLocaleDateString()}</div>
                      <div>{new Date(order.createdAt).toLocaleTimeString()}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => setSelectedOrder(order)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          <Eye size={16} />
                        </button>
                        
                        {getStatusActions(order.status).map(action => (
                          <button
                            key={action}
                            onClick={() => updateOrderStatus(order._id, action)}
                            className={`px-2 py-1 text-xs font-medium rounded ${
                              action === 'cancelled' 
                                ? 'bg-red-100 text-red-800 hover:bg-red-200'
                                : 'bg-green-100 text-green-800 hover:bg-green-200'
                            }`}
                          >
                            {action}
                          </button>
                        ))}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {orders.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg">No orders found</p>
              <p className="text-gray-400 mt-2">Orders will appear here when customers place them</p>
            </div>
          )}
        </div>
      </div>

      {/* Order Detail Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-screen overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-semibold">
                  Order #{selectedOrder.orderNumber}
                </h2>
                <button
                  onClick={() => setSelectedOrder(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>
              
              {/* Order Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <h3 className="font-semibold mb-2">Customer Information</h3>
                  <p><strong>Name:</strong> {selectedOrder.user?.name || selectedOrder.guestInfo?.name}</p>
                  <p><strong>Phone:</strong> {selectedOrder.user?.phone || selectedOrder.guestInfo?.phone}</p>
                  <p><strong>Email:</strong> {selectedOrder.user?.email || selectedOrder.guestInfo?.email}</p>
                </div>
                
                <div>
                  <h3 className="font-semibold mb-2">Order Details</h3>
                  <p><strong>Type:</strong> {selectedOrder.orderType}</p>
                  {selectedOrder.tableNumber && (
                    <p><strong>Table:</strong> {selectedOrder.tableNumber}</p>
                  )}
                  <p><strong>Payment:</strong> {selectedOrder.paymentMethod} ({selectedOrder.paymentStatus})</p>
                  <p><strong>Status:</strong> {selectedOrder.status}</p>
                </div>
              </div>
              
              {/* Order Items */}
              <div className="mb-6">
                <h3 className="font-semibold mb-4">Order Items</h3>
                <div className="space-y-3">
                  {selectedOrder.items.map((item, index) => (
                    <div key={index} className="flex justify-between items-start p-3 bg-gray-50 rounded">
                      <div>
                        <p className="font-medium">{item.name}</p>
                        <p className="text-sm text-gray-600">Quantity: {item.quantity}</p>
                        {item.customizations && Object.keys(item.customizations).length > 0 && (
                          <div className="text-xs text-gray-500 mt-1">
                            {Object.entries(item.customizations).map(([key, value]) => (
                              <span key={key} className="block">{key}: {value}</span>
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="font-medium">₹{item.itemTotal}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Order Total */}
              <div className="border-t pt-4">
                <div className="flex justify-between mb-2">
                  <span>Subtotal:</span>
                  <span>₹{selectedOrder.subtotal}</span>
                </div>
                <div className="flex justify-between mb-2">
                  <span>Tax:</span>
                  <span>₹{selectedOrder.tax}</span>
                </div>
                <div className="flex justify-between font-semibold text-lg">
                  <span>Total:</span>
                  <span>₹{selectedOrder.total}</span>
                </div>
              </div>
              
              {/* Status Update Actions */}
              <div className="mt-6 pt-4 border-t">
                <h3 className="font-semibold mb-3">Update Status</h3>
                <div className="flex space-x-2">
                  {getStatusActions(selectedOrder.status).map(action => (
                    <button
                      key={action}
                      onClick={() => {
                        updateOrderStatus(selectedOrder._id, action);
                        setSelectedOrder(null);
                      }}
                      className={`px-4 py-2 rounded font-medium ${
                        action === 'cancelled' 
                          ? 'bg-red-600 text-white hover:bg-red-700'
                          : 'bg-green-600 text-white hover:bg-green-700'
                      }`}
                    >
                      Mark as {action}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminOrders;
