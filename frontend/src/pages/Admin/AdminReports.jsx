import React, { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, Download } from 'lucide-react';
import axios from 'axios';
import { toast } from 'react-hot-toast'; // ADD MISSING IMPORT

const AdminReports = () => {
  const [salesData, setSalesData] = useState([]);
  const [topItems, setTopItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState('weekly');

  useEffect(() => {
    fetchReportsData();
  }, [selectedPeriod]);

  const fetchReportsData = async () => {
    try {
      const [salesResponse, topItemsResponse] = await Promise.all([
        axios.get(`http://localhost:5000/api/admin/reports/sales?period=${selectedPeriod}`),
        axios.get('http://localhost:5000/api/admin/reports/top-items')
      ]);
      
      setSalesData(salesResponse.data);
      setTopItems(topItemsResponse.data);
    } catch (error) {
      console.error('Error fetching reports data:', error);
      toast.error('Failed to load reports data');
    } finally {
      setLoading(false);
    }
  };

  // FIXED: Complete handleExportReport function
  const handleExportReport = async () => {
    try {
      // Create CSV content
      let csvContent = "Date,Revenue,Orders\n";
      
      if (salesData && salesData.length > 0) {
        salesData.forEach(item => {
          const date = item._id || 'Total';
          const revenue = item.revenue || 0;
          const orders = item.orders || 0;
          csvContent += `${date},${revenue},${orders}\n`;
        });
      } else {
        csvContent += "No data available,0,0\n";
      }

      // Add top items to CSV
      csvContent += "\nTop Selling Items\n";
      csvContent += "Rank,Item Name,Quantity Sold,Revenue\n";
      
      if (topItems && topItems.length > 0) {
        topItems.forEach((item, index) => {
          csvContent += `${index + 1},${item.name},${item.totalQuantity},${item.totalRevenue}\n`;
        });
      } else {
        csvContent += "No data available,0,0,0\n";
      }

      // Create and download file
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `campus-cravings-report-${selectedPeriod}-${new Date().toISOString().split('T')[0]}.csv`;
      
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast.success('Report exported successfully!');
    } catch (error) {
      console.error('Error exporting report:', error);
      toast.error('Failed to export report');
    }
  };

  const totalRevenue = salesData.reduce((sum, item) => sum + (item.revenue || 0), 0);
  const totalOrders = salesData.reduce((sum, item) => sum + (item.orders || 0), 0);

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
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Reports & Analytics</h1>
            <p className="text-gray-600">Track your restaurant's performance</p>
          </div>
          {/* FIXED: Add onClick handler to export button */}
          <button 
            onClick={handleExportReport}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2"
          >
            <Download size={20} />
            <span>Export Report (CSV)</span>
          </button>
        </div>

        {/* Period Selector */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <div className="flex space-x-4">
            <button
              onClick={() => setSelectedPeriod('daily')}
              className={`px-4 py-2 rounded-md font-medium ${
                selectedPeriod === 'daily'
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Daily
            </button>
            <button
              onClick={() => setSelectedPeriod('weekly')}
              className={`px-4 py-2 rounded-md font-medium ${
                selectedPeriod === 'weekly'
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Weekly
            </button>
            <button
              onClick={() => setSelectedPeriod('monthly')}
              className={`px-4 py-2 rounded-md font-medium ${
                selectedPeriod === 'monthly'
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Monthly
            </button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-lg bg-green-50">
                <TrendingUp className="h-8 w-8 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                <p className="text-2xl font-bold text-gray-900">₹{totalRevenue.toFixed(2)}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-lg bg-blue-50">
                <BarChart3 className="h-8 w-8 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Orders</p>
                <p className="text-2xl font-bold text-gray-900">{totalOrders}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-lg bg-purple-50">
                <TrendingUp className="h-8 w-8 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Average Order</p>
                <p className="text-2xl font-bold text-gray-900">
                  ₹{totalOrders > 0 ? (totalRevenue / totalOrders).toFixed(2) : '0.00'}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Sales Chart */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-semibold mb-6">Sales Overview</h2>
            {salesData && salesData.length > 0 ? (
              <div className="space-y-4">
                {salesData.map((item, index) => (
                  <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                    <div>
                      <p className="font-medium">{item._id || 'Total'}</p>
                      <p className="text-sm text-gray-600">{item.orders || 0} orders</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-green-600">₹{(item.revenue || 0).toFixed(2)}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500">No sales data available for this period</p>
              </div>
            )}
          </div>

          {/* Top Items */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-semibold mb-6">Top Selling Items</h2>
            {topItems.length > 0 ? (
              <div className="space-y-4">
                {topItems.map((item, index) => (
                  <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                    <div className="flex items-center space-x-3">
                      <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                        index === 0 ? 'bg-yellow-100 text-yellow-800' :
                        index === 1 ? 'bg-gray-100 text-gray-800' :
                        index === 2 ? 'bg-orange-100 text-orange-800' :
                        'bg-blue-100 text-blue-800'
                      }`}>
                        {index + 1}
                      </span>
                      <div>
                        <p className="font-medium">{item.name}</p>
                        <p className="text-sm text-gray-600">{item.totalQuantity} sold</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-green-600">₹{(item.totalRevenue || 0).toFixed(2)}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500">No sales data available</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminReports;