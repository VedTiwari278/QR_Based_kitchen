import React, { useState, useEffect } from 'react';
import { Package, AlertTriangle, RefreshCw, Edit, Save } from 'lucide-react';
import axios from 'axios';
import { toast } from 'react-hot-toast';

const StockManagement = () => {
  const [stockData, setStockData] = useState({
    lowStock: [],
    outOfStock: [],
    allStockItems: [],
    summary: {
      totalTracked: 0,
      lowStock: 0,
      outOfStock: 0,
      inStock: 0
    }
  });
  const [loading, setLoading] = useState(true);
  const [editingItem, setEditingItem] = useState(null);
  const [editForm, setEditForm] = useState({ dailyStock: 0, currentStock: 0 });

  useEffect(() => {
    fetchStockStatus();
  }, []);

  const fetchStockStatus = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/admin/stock/status');
      setStockData(response.data);
    } catch (error) {
      console.error('Error fetching stock status:', error);
      if (error.response?.status === 500) {
        toast.error('Server error: Check if stock routes are implemented');
      } else {
        toast.error('Failed to load stock data');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResetStock = async () => {
    try {
      const response = await axios.post('http://localhost:5000/api/admin/stock/reset');
      toast.success(`Stock reset successfully. Updated ${response.data.modifiedCount} items.`);
      fetchStockStatus();
    } catch (error) {
      console.error('Error resetting stock:', error);
      toast.error('Failed to reset stock');
    }
  };

  const handleEdit = (item) => {
    setEditingItem(item._id);
    setEditForm({
      dailyStock: item.dailyStock || 0,
      currentStock: item.currentStock || 0
    });
  };

  const handleSave = async (itemId) => {
    try {
      await axios.put(`http://localhost:5000/api/admin/stock/${itemId}`, {
        dailyStock: parseInt(editForm.dailyStock) || 0,
        currentStock: parseInt(editForm.currentStock) || 0
      });
      toast.success('Stock updated successfully');
      setEditingItem(null);
      fetchStockStatus();
    } catch (error) {
      console.error('Error updating stock:', error);
      toast.error('Failed to update stock');
    }
  };

  const handleCancelEdit = () => {
    setEditingItem(null);
    setEditForm({ dailyStock: 0, currentStock: 0 });
  };

  const getStockPercentage = (item) => {
    if (!item.dailyStock || item.dailyStock === 0) return 100;
    return (item.currentStock / item.dailyStock) * 100;
  };

  const getStockColor = (percentage) => {
    if (percentage <= 20) return 'bg-red-500';
    if (percentage <= 50) return 'bg-yellow-500';
    return 'bg-green-500';
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
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Stock Management</h1>
            <p className="text-gray-600">Manage daily stock limits and monitor inventory</p>
          </div>
          <button
            onClick={handleResetStock}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2"
          >
            <RefreshCw size={20} />
            <span>Reset Daily Stock</span>
          </button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <Package className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Tracked Items</p>
                <p className="text-2xl font-bold text-gray-900">{stockData.summary.totalTracked}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <div className="p-2 rounded-lg bg-green-50">
                <Package className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">In Stock</p>
                <p className="text-2xl font-bold text-gray-900">{stockData.summary.inStock}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <div className="p-2 rounded-lg bg-yellow-50">
                <AlertTriangle className="h-6 w-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Low Stock</p>
                <p className="text-2xl font-bold text-gray-900">{stockData.summary.lowStock}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <div className="p-2 rounded-lg bg-red-50">
                <AlertTriangle className="h-6 w-6 text-red-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Out of Stock</p>
                <p className="text-2xl font-bold text-gray-900">{stockData.summary.outOfStock}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Stock Items Table */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold">All Tracked Items</h2>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Item
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Current Stock
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Daily Limit
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {stockData.allStockItems.map((item) => (
                  <tr key={item._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{item.name}</div>
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap">
                      {editingItem === item._id ? (
                        <input
                          type="number"
                          min="0"
                          value={editForm.currentStock}
                          onChange={(e) => setEditForm(prev => ({ 
                            ...prev, 
                            currentStock: parseInt(e.target.value) || 0
                          }))}
                          className="w-20 px-2 py-1 border border-gray-300 rounded"
                        />
                      ) : (
                        <div className="text-sm text-gray-900">{item.currentStock}</div>
                      )}
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap">
                      {editingItem === item._id ? (
                        <input
                          type="number"
                          min="0"
                          value={editForm.dailyStock}
                          onChange={(e) => setEditForm(prev => ({ 
                            ...prev, 
                            dailyStock: parseInt(e.target.value) || 0
                          }))}
                          className="w-20 px-2 py-1 border border-gray-300 rounded"
                        />
                      ) : (
                        <div className="text-sm text-gray-900">{item.dailyStock}</div>
                      )}
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        <div className="w-24 bg-gray-200 rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full ${getStockColor(getStockPercentage(item))}`}
                            style={{ width: `${Math.min(100, getStockPercentage(item))}%` }}
                          ></div>
                        </div>
                        <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                          item.isOutOfStock 
                            ? 'bg-red-100 text-red-800'
                            : getStockPercentage(item) <= 20
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-green-100 text-green-800'
                        }`}>
                          {item.isOutOfStock ? 'Out of Stock' : 
                           getStockPercentage(item) <= 20 ? 'Low Stock' : 'In Stock'}
                        </span>
                      </div>
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        {editingItem === item._id ? (
                          <>
                            <button
                              onClick={() => handleSave(item._id)}
                              className="text-green-600 hover:text-green-900"
                              title="Save"
                            >
                              <Save size={16} />
                            </button>
                            <button
                              onClick={handleCancelEdit}
                              className="text-gray-600 hover:text-gray-900"
                              title="Cancel"
                            >
                              ×
                            </button>
                          </>
                        ) : (
                          <button
                            onClick={() => handleEdit(item)}
                            className="text-blue-600 hover:text-blue-900"
                            title="Edit"
                          >
                            <Edit size={16} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {stockData.allStockItems.length === 0 && (
            <div className="text-center py-12">
              <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No items with daily stock limits</p>
              <p className="text-gray-400 text-sm mt-1">
                Set daily stock limits in the menu management page
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StockManagement;