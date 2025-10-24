import React, { useState, useEffect } from "react";
import {
  Users,
  ShoppingBag,
  DollarSign,
  TrendingUp,
  Clock,
  CheckCircle,
  Package,
} from "lucide-react";
import axios from "axios";
import { Link, useLocation } from "react-router-dom";

const AdminDashboard = () => {
  const location = useLocation();
  const [stats, setStats] = useState({});
  const [reportsData, setReportsData] = useState({});
  const [recentOrders, setRecentOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [statsResponse, ordersResponse, reportsResponse] =
        await Promise.all([
          axios.get("https://qr-based-kitchen.vercel.app/api/admin/stats"),
          axios.get(
            "https://qr-based-kitchen.vercel.app/api/admin/orders?limit=5"
          ),
          axios.get(
            "https://qr-based-kitchen.vercel.app/api/admin/reports/sales?period=all"
          ),
        ]);

      setStats(statsResponse.data);
      setRecentOrders(ordersResponse.data);
      setReportsData(reportsResponse.data[0] || {});
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  const totalRevenue = reportsData.revenue || 0;
  const totalOrdersFromReports = reportsData.orders || 0;

  const statCards = [
    {
      title: "Total Orders",
      value: totalOrdersFromReports || stats.totalOrders || 0,
      change: `+${stats.todayOrders || 0} today`,
      icon: <ShoppingBag className="h-8 w-8 text-blue-600" />,
      bgColor: "bg-blue-50",
      textColor: "text-blue-600",
    },
    {
      title: "Total Revenue",
      value: `₹${totalRevenue.toFixed(2)}`,
      change: `+₹${(stats.todayRevenue || 0).toFixed(2)} today`,
      icon: <DollarSign className="h-8 w-8 text-green-600" />,
      bgColor: "bg-green-50",
      textColor: "text-green-600",
    },
    {
      title: "Active Orders",
      value: stats.activeOrders || 0,
      change: "Orders in progress",
      icon: <Clock className="h-8 w-8 text-orange-600" />,
      bgColor: "bg-orange-50",
      textColor: "text-orange-600",
    },
    {
      title: "Total Users",
      value: stats.totalUsers || 0,
      change: "Registered customers",
      icon: <Users className="h-8 w-8 text-purple-600" />,
      bgColor: "bg-purple-50",
      textColor: "text-purple-600",
    },
  ];

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
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Dashboard</h1>
          <p className="text-gray-600">
            Overview of your restaurant performance
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {statCards.map((stat, index) => (
            <div key={index} className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center">
                <div className={`p-3 rounded-lg ${stat.bgColor}`}>
                  {stat.icon}
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">
                    {stat.title}
                  </p>
                  <p className="text-2xl font-bold text-gray-900">
                    {stat.value}
                  </p>
                </div>
              </div>
              <div className="mt-4">
                <p className={`text-sm ${stat.textColor}`}>{stat.change}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          <div className="bg-white rounded-lg shadow-sm">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold">Recent Orders</h2>
            </div>
            <div className="divide-y divide-gray-200">
              {recentOrders.slice(0, 5).map((order) => (
                <div key={order._id} className="p-6">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium">Order #{order.orderNumber}</p>
                      <p className="text-sm text-gray-600">
                        {order.user?.name || order.guestInfo?.name}
                      </p>
                      <p className="text-sm text-gray-500">
                        {new Date(order.createdAt).toLocaleString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-green-600">
                        ₹{(order.totalAmount || order.total || 0).toFixed(2)}
                      </p>
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                          order.status === "completed"
                            ? "bg-green-100 text-green-800"
                            : order.status === "preparing"
                            ? "bg-yellow-100 text-yellow-800"
                            : order.status === "ready"
                            ? "bg-blue-100 text-blue-800"
                            : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {order.status}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-semibold mb-6">Quick Actions</h2>
            <div className="space-y-4">
              <Link
                to="/admin/menu"
                className="flex items-center w-full p-4 text-left bg-green-50 hover:bg-green-100 rounded-lg transition-colors"
              >
                <Package className="h-6 w-6 text-green-600 mr-3" />
                <div>
                  <p className="font-medium">Add New Menu Item</p>
                  <p className="text-sm text-gray-600">
                    Add items to your menu
                  </p>
                </div>
              </Link>

              <Link
                to="/admin/orders"
                className={`flex items-center w-full p-4 text-left bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors space-x-3 ${
                  location.pathname === "/admin/orders"
                    ? "text-green-600"
                    : "text-gray-700"
                }`}
              >
                <ShoppingBag className="h-6 w-6 text-blue-600" />
                <div>
                  <p className="font-medium">View All Orders</p>
                  <p className="text-sm text-gray-600">Manage current orders</p>
                </div>
              </Link>

              <Link
                to="/admin/reports"
                className={`flex items-center w-full p-4 text-left bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors ${
                  location.pathname === "/admin/reports"
                    ? "text-green-600"
                    : "text-gray-700"
                }`}
              >
                <TrendingUp className="h-6 w-6 text-purple-600 mr-3" />
                <div>
                  <p className="font-medium">View Reports</p>
                  <p className="text-sm text-gray-600">Check sales analytics</p>
                </div>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
