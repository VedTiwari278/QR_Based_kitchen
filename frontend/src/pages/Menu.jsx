import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Search, Filter, Plus, Minus, Star } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useCart } from '../contexts/CartContext';
import axios from 'axios';

const Menu = () => {
  const { restaurantId } = useParams();
  const { addToCart } = useCart();
  
  const [menuItems, setMenuItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    category: '',
    isVeg: '',
    search: '',
    minPrice: '',
    maxPrice: ''
  });

  const [selectedItem, setSelectedItem] = useState(null);
  const [customizations, setCustomizations] = useState({});
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    fetchMenuItems();
    fetchCategories();
  }, [filters]);

  const fetchMenuItems = async () => {
    try {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, value);
      });
      
      const response = await axios.get(`http://localhost:5000/api/menu?${params}`);
      setMenuItems(response.data);
    } catch (error) {
      console.error('Error fetching menu:', error);
      toast.error('Failed to load menu items');
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/menu/categories/all');
      setCategories(response.data);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleAddToCart = (item) => {

    if(!localStorage.getItem("token")){
      toast.error("Please login to add items to cart");
      return;
    }
    
    if (item.customizations && item.customizations.length > 0) {
      setSelectedItem(item);
      setCustomizations({});
      setQuantity(1);
    } else {
      addToCart(item, 1, {});
      toast.success(`${item.name} added to cart!`);
    }
  };

  const handleCustomizationSubmit = () => {
    addToCart(selectedItem, quantity, customizations);
    toast.success(`${selectedItem.name} added to cart with customizations!`);
    setSelectedItem(null);
    setCustomizations({});
    setQuantity(1);
  };

  const calculateCustomizedPrice = () => {
    if (!selectedItem) return 0;
    
    let price = selectedItem.price;
    
    if (selectedItem.customizations) {
      selectedItem.customizations.forEach(customization => {
        const selectedOption = customizations[customization.name];
        if (selectedOption) {
          const option = customization.options.find(opt => opt.name === selectedOption);
          if (option) price += option.price;
        }
      });
    }
    
    return price;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Our Menu</h1>
          <p className="text-gray-600">Delicious meals prepared fresh for you</p>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
            {/* Search */}
            <div className="md:col-span-2">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search items..."
                  className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  value={filters.search}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                />
              </div>
            </div>

            {/* Category Filter */}
            <div>
              <select
                className="w-full py-2 px-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent"
                value={filters.category}
                onChange={(e) => handleFilterChange('category', e.target.value)}
              >
                <option value="">All Categories</option>
                {categories.map(category => (
                  <option key={category} value={category}>
                    {category.charAt(0).toUpperCase() + category.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            {/* Veg Filter */}
            <div>
              <select
                className="w-full py-2 px-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent"
                value={filters.isVeg}
                onChange={(e) => handleFilterChange('isVeg', e.target.value)}
              >
                <option value="">All Items</option>
                <option value="true">Vegetarian</option>
                <option value="false">Non-Vegetarian</option>
              </select>
            </div>

            {/* Price Range */}
            <div>
              <input
                type="number"
                placeholder="Min Price"
                className="w-full py-2 px-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent"
                value={filters.minPrice}
                onChange={(e) => handleFilterChange('minPrice', e.target.value)}
              />
            </div>
            
            <div>
              <input
                type="number"
                placeholder="Max Price"
                className="w-full py-2 px-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent"
                value={filters.maxPrice}
                onChange={(e) => handleFilterChange('maxPrice', e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Menu Items */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {menuItems.map((item) => (
            <div key={item._id} className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow overflow-hidden">
              <div className="h-48 bg-gray-200 relative">
                {item.image ? (
                  <img 
                    src={`http://localhost:5000${item.image}`} 
                    alt={item.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-6xl">
                    🍽️
                  </div>
                )}
                <div className="absolute top-2 right-2">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    item.isVeg ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
                  }`}>
                    {item.isVeg ? '🥬 Veg' : '🍖 Non-Veg'}
                  </span>
                </div>
              </div>
              
              <div className="p-6">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-xl font-semibold text-gray-900">{item.name}</h3>
                  <span className="text-green-600 font-bold text-lg">₹{item.price}</span>
                </div>
                
                <p className="text-gray-600 mb-4 line-clamp-2">{item.description}</p>
                
                <div className="flex items-center justify-between mb-4">
                  {/* FIXED: Rating display - removed commented JSX */}
                  <div className="flex items-center space-x-2">
                    <div className="flex items-center">
                      <Star className="h-4 w-4 text-yellow-400 fill-current" />
                      <span className="text-sm text-gray-600 ml-1">
                        {item.rating?.average || 'New'}
                      </span>
                    </div>
                    <span className="text-sm text-gray-500">
                      ({item.rating?.count || 0} reviews)
                    </span>
                  </div>
                  
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <span>⏱️ {item.preparationTime}min</span>
                  </div>
                </div>
                
                {item.customizations && item.customizations.length > 0 && (
                  <div className="mb-4">
                    <span className="text-sm text-green-600 font-medium">
                      ✨ Customizable
                    </span>
                  </div>
                )}
                
                <button
                  onClick={() => handleAddToCart(item)}
                  disabled={!item.isAvailable}
                  className={`w-full py-3 px-4 rounded-md font-medium transition-colors flex items-center justify-center space-x-2 ${
                    item.isAvailable
                      ? 'bg-green-600 text-white hover:bg-green-700'
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  <Plus size={16} />
                  <span>{item.isAvailable ? 'Add to Cart' : 'Out of Stock'}</span>
                </button>
              </div>
            </div>
          ))}
        </div>

        {menuItems.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">No items found matching your criteria</p>
          </div>
        )}
      </div>

      {/* Customization Modal */}
      {selectedItem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full max-h-screen overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-xl font-semibold">{selectedItem.name}</h3>
                <button
                  onClick={() => setSelectedItem(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>
              
              <div className="mb-6">
                <p className="text-gray-600 mb-4">{selectedItem.description}</p>
                
                {/* Quantity */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Quantity
                  </label>
                  <div className="flex items-center space-x-3">
                    <button
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="p-1 rounded-md border hover:bg-gray-50"
                    >
                      <Minus size={16} />
                    </button>
                    <span className="px-4 py-1 border rounded-md">{quantity}</span>
                    <button
                      onClick={() => setQuantity(quantity + 1)}
                      className="p-1 rounded-md border hover:bg-gray-50"
                    >
                      <Plus size={16} />
                    </button>
                  </div>
                </div>
                
                {/* Customizations */}
                {selectedItem.customizations.map((customization) => (
                  <div key={customization.name} className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {customization.name}
                    </label>
                    <div className="space-y-2">
                      {customization.options.map((option) => (
                        <label key={option.name} className="flex items-center">
                          <input
                            type="radio"
                            name={customization.name}
                            value={option.name}
                            onChange={(e) => setCustomizations(prev => ({
                              ...prev,
                              [customization.name]: e.target.value
                            }))}
                            className="mr-2 text-green-600"
                          />
                          <span>
                            {option.name}
                            {option.price > 0 && (
                              <span className="text-green-600 ml-1">+₹{option.price}</span>
                            )}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="flex justify-between items-center pt-4 border-t">
                <div className="text-lg font-semibold">
                  Total: ₹{(calculateCustomizedPrice() * quantity).toFixed(2)}
                </div>
                <button
                  onClick={handleCustomizationSubmit}
                  className="bg-green-600 text-white px-6 py-2 rounded-md hover:bg-green-700 transition-colors"
                >
                  Add to Cart
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Menu;