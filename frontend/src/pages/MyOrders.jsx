import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Clock, CheckCircle, Package, Star, Eye, Utensils } from "lucide-react";
import { toast } from "react-hot-toast";
import axios from "axios";
import { useAuth } from "../contexts/AuthContext";

const MyOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const response = await axios.get(
        "https://qr-based-kitchen.vercel.app/api/orders/my-orders"
      );
      setOrders(response.data);
    } catch (error) {
      console.error("Error fetching orders:", error);
      toast.error("Failed to load orders");
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: "bg-yellow-100 text-yellow-800",
      confirmed: "bg-blue-100 text-blue-800",
      preparing: "bg-orange-100 text-orange-800",
      ready: "bg-green-100 text-green-800",
      completed: "bg-gray-100 text-gray-800",
      cancelled: "bg-red-100 text-red-800",
    };
    return colors[status] || "bg-gray-100 text-gray-800";
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "pending":
        return <Clock className="h-4 w-4" />;
      case "confirmed":
        return <CheckCircle className="h-4 w-4" />;
      case "preparing":
        return <Utensils className="h-4 w-4" />;
      case "ready":
        return <Package className="h-4 w-4" />;
      case "completed":
        return <CheckCircle className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const getTotalItems = (order) => {
    return order.items.reduce((total, item) => total + item.quantity, 0);
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
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">My Orders</h1>
          <p className="text-gray-600">
            View your order history and track current orders
          </p>
        </div>

        {orders.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <Package className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              No orders yet
            </h2>
            <p className="text-gray-600 mb-6">
              You haven't placed any orders yet.
            </p>
            <Link
              to="/menu"
              className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors"
            >
              Browse Menu
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {orders.map((order) => (
              <div
                key={order._id}
                className="bg-white rounded-lg shadow-sm overflow-hidden"
              >
                {/* Order Header */}
                <div className="border-b border-gray-200 p-6">
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
                    <div>
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">
                          Order #{order.orderNumber}
                        </h3>
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                            order.status
                          )}`}
                        >
                          {getStatusIcon(order.status)}
                          <span className="ml-1 capitalize">
                            {order.status}
                          </span>
                        </span>
                      </div>
                      <p className="text-sm text-gray-600">
                        Placed on{" "}
                        {new Date(order.createdAt).toLocaleDateString()} at{" "}
                        {new Date(order.createdAt).toLocaleTimeString()}
                      </p>
                      <p className="text-sm text-gray-600">
                        {getTotalItems(order)} items • ₹
                        {order.totalAmount || order.total}
                      </p>
                    </div>

                    <div className="flex space-x-3">
                      <Link
                        to={`/track/${order.orderNumber}`}
                        className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        Track Order
                      </Link>

                      {order.status === "completed" &&
                        !order.feedbackSubmitted && (
                          <button className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700">
                            <Star className="h-4 w-4 mr-2" />
                            Give Feedback
                          </button>
                        )}
                    </div>
                  </div>
                </div>

                {/* Order Items */}
                <div className="p-6">
                  <div className="grid gap-4">
                    {order.items.map((item, index) => (
                      <div
                        key={index}
                        className="flex justify-between items-start"
                      >
                        <div className="flex-1">
                          <div className="flex items-start space-x-3">
                            <div className="flex-shrink-0 w-12 h-12 bg-gray-200 rounded-md overflow-hidden">
                              {item.item?.image ? (
                                <img
                                  src={`https://qr-based-kitchen.vercel.app${item.item.image}`}
                                  alt={item.name}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-lg">
                                  🍽️
                                </div>
                              )}
                            </div>
                            <div>
                              <h4 className="font-medium text-gray-900">
                                {item.name}
                              </h4>
                              <p className="text-sm text-gray-600">
                                Quantity: {item.quantity}
                              </p>
                              {item.customizations &&
                                Object.keys(item.customizations).length > 0 && (
                                  <div className="text-xs text-gray-500 mt-1">
                                    {Object.entries(item.customizations).map(
                                      ([key, value]) => (
                                        <span key={key} className="block">
                                          {key}: {value}
                                        </span>
                                      )
                                    )}
                                  </div>
                                )}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-medium text-gray-900">
                            ₹{item.itemTotal}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Order Summary */}
                  <div className="border-t border-gray-200 mt-4 pt-4">
                    <div className="flex justify-between text-sm text-gray-600 mb-2">
                      <span>Subtotal</span>
                      <span>₹{order.subtotal}</span>
                    </div>
                    <div className="flex justify-between text-sm text-gray-600 mb-2">
                      <span>Tax</span>
                      <span>₹{order.tax}</span>
                    </div>
                    <div className="flex justify-between items-center text-lg font-semibold border-t pt-2">
                      <span>Total</span>
                      <span className="text-green-600">
                        ₹{order.totalAmount || order.total}
                      </span>
                    </div>
                  </div>

                  {/* Order Type & Payment Info */}
                  <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium">Order Type:</span>
                      <span className="ml-2 capitalize">{order.orderType}</span>
                      {order.tableNumber && (
                        <span className="ml-2">
                          (Table {order.tableNumber})
                        </span>
                      )}
                    </div>
                    <div>
                      <span className="font-medium">Payment:</span>
                      <span className="ml-2 capitalize">
                        {order.paymentMethod}
                      </span>
                      <span
                        className={`ml-2 px-2 py-1 rounded-full text-xs font-medium ${
                          order.paymentStatus === "completed"
                            ? "bg-green-100 text-green-800"
                            : order.paymentStatus === "pending"
                            ? "bg-yellow-100 text-yellow-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {order.paymentStatus}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MyOrders;
