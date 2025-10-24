import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import {
  Clock,
  CheckCircle,
  Utensils,
  Package,
  Star,
  MessageSquare,
} from "lucide-react";
import { toast } from "react-hot-toast";
import axios from "axios";
import io from "socket.io-client";
import FeedbackModal from "./FeedbackModal";

const RealTimeOrderTracking = () => {
  const { orderNumber } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [socket, setSocket] = useState(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);

  useEffect(() => {
    fetchOrder();

    const newSocket = io("https://qr-based-kitchen.vercel.app");
    setSocket(newSocket);

    return () => newSocket.close();
  }, [orderNumber]);

  useEffect(() => {
    if (socket && order) {
      socket.emit("join-order", order._id);

      socket.on("order-status-update", (data) => {
        if (data.orderId === order._id) {
          setOrder((prev) => ({
            ...prev,
            status: data.status,
            estimatedTime: data.estimatedTime,
          }));
          toast.success(`Order status updated: ${getStatusText(data.status)}`);
        }
      });
    }
  }, [socket, order]);

  const fetchOrder = async () => {
    try {
      const response = await axios.get(
        `https://qr-based-kitchen.vercel.app/api/orders/track/${orderNumber}`
      );
      setOrder(response.data);
    } catch (error) {
      console.error("Error fetching order:", error);
      toast.error("Order not found");
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status, currentStatus) => {
    const isCompleted = getStatusOrder(status) <= getStatusOrder(currentStatus);
    const iconClass = isCompleted ? "text-green-600" : "text-gray-400";

    switch (status) {
      case "pending":
        return <Package className={`h-6 w-6 ${iconClass}`} />;
      case "confirmed":
        return <CheckCircle className={`h-6 w-6 ${iconClass}`} />;
      case "preparing":
        return <Utensils className={`h-6 w-6 ${iconClass}`} />;
      case "ready":
        return <CheckCircle className={`h-6 w-6 ${iconClass}`} />;
      case "completed":
        return <CheckCircle className={`h-6 w-6 ${iconClass}`} />;
      default:
        return <Clock className={`h-6 w-6 ${iconClass}`} />;
    }
  };

  const getStatusOrder = (status) => {
    const statusOrder = {
      pending: 1,
      confirmed: 2,
      preparing: 3,
      ready: 4,
      completed: 5,
    };
    return statusOrder[status] || 0;
  };

  const getStatusText = (status) => {
    const statusTexts = {
      pending: "Order Placed",
      confirmed: "Order Confirmed",
      preparing: "Being Prepared",
      ready: "Ready for Pickup",
      completed: "Order Completed",
    };
    return statusTexts[status] || status;
  };

  const getProgressPercentage = () => {
    if (!order) return 0;
    const statusOrder = getStatusOrder(order.status);
    return (statusOrder / 5) * 100;
  };

  const handleFeedbackClick = (item) => {
    setSelectedItem(item);
    setShowFeedback(true);
  };

  const handleFeedbackSubmit = async (feedbackData) => {
    try {
      await axios.post("https://qr-based-kitchen.vercel.app/api/feedback", {
        orderId: order._id,
        menuItemId: selectedItem.item._id,
        ...feedbackData,
      });

      toast.success("Thank you for your feedback!");
      setShowFeedback(false);
      setSelectedItem(null);

      fetchOrder();
    } catch (error) {
      toast.error("Failed to submit feedback");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">
            Order Not Found
          </h2>
          <p className="text-gray-600">
            Please check your order number and try again.
          </p>
        </div>
      </div>
    );
  }

  const statuses = ["pending", "confirmed", "preparing", "ready", "completed"];
  const currentStatusIndex = statuses.indexOf(order.status);

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Order #{order.orderNumber}
          </h1>
          <p className="text-gray-600">Track your order in real-time</p>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <div className="mb-4">
            <div className="flex justify-between text-sm text-gray-600 mb-2">
              <span>Order Progress</span>
              <span>{Math.round(getProgressPercentage())}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-green-600 h-2 rounded-full transition-all duration-500"
                style={{ width: `${getProgressPercentage()}%` }}
              ></div>
            </div>
          </div>

          {order.timeRemaining > 0 && (
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <Clock className="h-6 w-6 text-green-600 mx-auto mb-2" />
              <p className="text-green-800 font-medium">
                Estimated time remaining: {order.timeRemaining} minutes
              </p>
            </div>
          )}
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-semibold mb-6">Order Status</h2>

            <div className="space-y-6">
              {statuses.map((status, index) => {
                const isActive = status === order.status;
                const isCompleted = index <= currentStatusIndex;

                return (
                  <div key={status} className="flex items-center space-x-4">
                    <div
                      className={`flex-shrink-0 w-12 h-12 rounded-full border-2 flex items-center justify-center ${
                        isCompleted
                          ? "bg-green-50 border-green-600"
                          : "bg-gray-50 border-gray-300"
                      }`}
                    >
                      {getStatusIcon(status, order.status)}
                    </div>

                    <div className="flex-1">
                      <p
                        className={`font-medium ${
                          isCompleted ? "text-gray-900" : "text-gray-500"
                        }`}
                      >
                        {getStatusText(status)}
                      </p>
                      {isActive && (
                        <p className="text-sm text-green-600 font-medium">
                          Current Status
                        </p>
                      )}
                    </div>

                    {isCompleted && (
                      <div className="flex-shrink-0">
                        <CheckCircle className="h-5 w-5 text-green-600" />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-semibold mb-6">Order Details</h2>

            <div className="space-y-4 mb-6">
              {order.items.map((orderItem, index) => (
                <div
                  key={index}
                  className="flex justify-between items-start p-3 bg-gray-50 rounded"
                >
                  <div className="flex-1">
                    <h3 className="font-medium">{orderItem.name}</h3>
                    <p className="text-sm text-gray-600">
                      Quantity: {orderItem.quantity}
                    </p>
                    {orderItem.customizations &&
                      Object.keys(orderItem.customizations).length > 0 && (
                        <div className="text-xs text-gray-500 mt-1">
                          {Object.entries(orderItem.customizations).map(
                            ([key, value]) => (
                              <span key={key} className="block">
                                {key}: {value}
                              </span>
                            )
                          )}
                        </div>
                      )}

                    {order.status === "completed" &&
                      !order.feedbackSubmitted && (
                        <button
                          onClick={() => handleFeedbackClick(orderItem)}
                          className="mt-2 flex items-center space-x-1 text-sm text-green-600 hover:text-green-700"
                        >
                          <Star size={14} />
                          <span>Rate this item</span>
                        </button>
                      )}
                  </div>
                  <div className="text-right">
                    <p className="font-medium">₹{orderItem.itemTotal}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="border-t border-gray-200 pt-4 space-y-2">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>₹{order.subtotal}</span>
              </div>
              <div className="flex justify-between">
                <span>Tax</span>
                <span>₹{order.tax}</span>
              </div>
              <div className="flex justify-between items-center text-lg font-semibold border-t pt-2">
                <span>Total</span>
                <span className="text-green-600">₹{order.total}</span>
              </div>
            </div>

            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <div className="flex justify-between items-center mb-2">
                <span className="font-medium">Payment Method</span>
                <span className="capitalize">{order.paymentMethod}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-medium">Payment Status</span>
                <span
                  className={`px-2 py-1 rounded-full text-xs font-medium ${
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

        {order.status === "completed" && !order.feedbackSubmitted && (
          <div className="mt-8 bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center space-x-3 mb-4">
              <MessageSquare className="h-6 w-6 text-green-600" />
              <h2 className="text-xl font-semibold">Share Your Experience</h2>
            </div>
            <p className="text-gray-600 mb-4">
              How was your order? Your feedback helps us improve our service and
              menu.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {order.items.map((item, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div>
                    <p className="font-medium">{item.name}</p>
                    <p className="text-sm text-gray-600">
                      Quantity: {item.quantity}
                    </p>
                  </div>
                  <button
                    onClick={() => handleFeedbackClick(item)}
                    className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2"
                  >
                    <Star size={16} />
                    <span>Rate</span>
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {order.status === "completed" && order.feedbackSubmitted && (
          <div className="mt-8 bg-green-50 border border-green-200 rounded-lg p-6 text-center">
            <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-green-800 mb-2">
              Thank You for Your Feedback!
            </h3>
            <p className="text-green-600">
              Your feedback has been recorded and will help us improve our
              service.
            </p>
          </div>
        )}
      </div>

      {showFeedback && selectedItem && (
        <FeedbackModal
          item={selectedItem}
          onSubmit={handleFeedbackSubmit}
          onClose={() => {
            setShowFeedback(false);
            setSelectedItem(null);
          }}
        />
      )}
    </div>
  );
};

export default RealTimeOrderTracking;
