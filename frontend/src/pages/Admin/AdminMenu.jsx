import React, { useState, useEffect } from "react";
import { Plus, Edit, Trash2, Upload } from "lucide-react";
import { toast } from "react-hot-toast";
import axios from "axios";

const AdminMenu = () => {
  const [menuItems, setMenuItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    category: "meals",
    isVeg: true,
    preparationTime: 15,
    dailyStock: 0,
    currentStock: 0,
    customizations: [],
  });

  const handleEdit = (item) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      description: item.description,
      price: item.price.toString(),
      category: item.category,
      isVeg: item.isVeg,
      preparationTime: item.preparationTime,
      dailyStock: item.dailyStock || 0,
      currentStock: item.currentStock || 0,
      customizations: item.customizations || [],
    });
    setShowModal(true);
  };

  const [imageFile, setImageFile] = useState(null);

  useEffect(() => {
    fetchMenuItems();
  }, []);

  const fetchMenuItems = async () => {
    try {
      const response = await axios.get(
        "https://qr-based-kitchen.vercel.app/api/admin/menu"
      );
      setMenuItems(response.data);
    } catch (error) {
      console.error("Error fetching menu items:", error);
      toast.error("Failed to load menu items");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const submitData = new FormData();
    Object.keys(formData).forEach((key) => {
      if (key === "customizations") {
        submitData.append(key, JSON.stringify(formData[key]));
      } else {
        submitData.append(key, formData[key]);
      }
    });

    if (imageFile) {
      submitData.append("image", imageFile);
    }

    try {
      if (editingItem) {
        await axios.put(
          `https://qr-based-kitchen.vercel.app/api/admin/menu/${editingItem._id}`,
          submitData,
          {
            headers: { "Content-Type": "multipart/form-data" },
          }
        );
        toast.success("Menu item updated successfully");
      } else {
        await axios.post(
          "https://qr-based-kitchen.vercel.app/api/admin/menu",
          submitData,
          {
            headers: { "Content-Type": "multipart/form-data" },
          }
        );
        toast.success("Menu item added successfully");
      }

      fetchMenuItems();
      handleCloseModal();
    } catch (error) {
      console.error("Error saving menu item:", error);
      toast.error("Failed to save menu item");
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this item?")) {
      try {
        await axios.delete(
          `https://qr-based-kitchen.vercel.app/api/admin/menu/${id}`
        );
        toast.success("Menu item deleted successfully");
        fetchMenuItems();
      } catch (error) {
        console.error("Error deleting menu item:", error);
        toast.error("Failed to delete menu item");
      }
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingItem(null);
    setFormData({
      name: "",
      description: "",
      price: "",
      category: "meals",
      isVeg: true,
      preparationTime: 15,
      customizations: [],
    });
    setImageFile(null);
  };

  const addCustomization = () => {
    setFormData((prev) => ({
      ...prev,
      customizations: [
        ...prev.customizations,
        { name: "", options: [{ name: "", price: 0 }] },
      ],
    }));
  };

  const removeCustomization = (index) => {
    setFormData((prev) => ({
      ...prev,
      customizations: prev.customizations.filter((_, i) => i !== index),
    }));
  };

  const updateCustomization = (index, field, value) => {
    setFormData((prev) => ({
      ...prev,
      customizations: prev.customizations.map((custom, i) =>
        i === index ? { ...custom, [field]: value } : custom
      ),
    }));
  };

  const addCustomizationOption = (customIndex) => {
    setFormData((prev) => ({
      ...prev,
      customizations: prev.customizations.map((custom, i) =>
        i === customIndex
          ? { ...custom, options: [...custom.options, { name: "", price: 0 }] }
          : custom
      ),
    }));
  };

  const removeCustomizationOption = (customIndex, optionIndex) => {
    setFormData((prev) => ({
      ...prev,
      customizations: prev.customizations.map((custom, i) =>
        i === customIndex
          ? {
              ...custom,
              options: custom.options.filter((_, j) => j !== optionIndex),
            }
          : custom
      ),
    }));
  };

  const updateCustomizationOption = (
    customIndex,
    optionIndex,
    field,
    value
  ) => {
    setFormData((prev) => ({
      ...prev,
      customizations: prev.customizations.map((custom, i) =>
        i === customIndex
          ? {
              ...custom,
              options: custom.options.map((option, j) =>
                j === optionIndex ? { ...option, [field]: value } : option
              ),
            }
          : custom
      ),
    }));
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
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Menu Management
            </h1>
            <p className="text-gray-600">Manage your restaurant menu items</p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2"
          >
            <Plus size={20} />
            <span>Add Menu Item</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {menuItems.map((item) => (
            <div
              key={item._id}
              className="bg-white rounded-lg shadow-sm overflow-hidden"
            >
              <div className="h-48 bg-gray-200 relative">
                {item.image ? (
                  <img
                    src={`https://qr-based-kitchen.vercel.app${item.image}`}
                    alt={item.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-6xl">
                    🍽️
                  </div>
                )}
                <div className="absolute top-2 left-2">
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${
                      item.isVeg
                        ? "bg-green-500 text-white"
                        : "bg-red-500 text-white"
                    }`}
                  >
                    {item.isVeg ? "Veg" : "Non-Veg"}
                  </span>
                </div>
                <div className="absolute top-2 right-2">
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${
                      item.isAvailable
                        ? "bg-green-100 text-green-800"
                        : "bg-red-100 text-red-800"
                    }`}
                  >
                    {item.isAvailable ? "Available" : "Out of Stock"}
                  </span>
                </div>
              </div>

              <div className="p-6">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-xl font-semibold text-gray-900">
                    {item.name}
                  </h3>
                  <span className="text-green-600 font-bold text-lg">
                    ₹{item.price}
                  </span>
                </div>

                <p className="text-gray-600 mb-4 line-clamp-2">
                  {item.description}
                </p>

                <div className="flex items-center justify-between mb-4">
                  <span className="text-sm text-gray-500 capitalize">
                    Category: {item.category}
                  </span>
                  <span className="text-sm text-gray-500">
                    ⏱️ {item.preparationTime}min
                  </span>
                </div>

                <div className="flex space-x-2">
                  <button
                    onClick={() => handleEdit(item)}
                    className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors flex items-center justify-center space-x-1"
                  >
                    <Edit size={16} />
                    <span>Edit</span>
                  </button>
                  <button
                    onClick={() => handleDelete(item._id)}
                    className="flex-1 bg-red-600 text-white py-2 px-4 rounded-md hover:bg-red-700 transition-colors flex items-center justify-center space-x-1"
                  >
                    <Trash2 size={16} />
                    <span>Delete</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {menuItems.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">No menu items found</p>
            <p className="text-gray-400 mt-2">
              Add your first menu item to get started
            </p>
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-screen overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-semibold">
                  {editingItem ? "Edit Menu Item" : "Add New Menu Item"}
                </h2>
                <button
                  onClick={handleCloseModal}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Item Name
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          name: e.target.value,
                        }))
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Price (₹)
                    </label>
                    <input
                      type="number"
                      required
                      min="0"
                      step="0.01"
                      value={formData.price}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          price: e.target.value,
                        }))
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    required
                    rows={3}
                    value={formData.description}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        description: e.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Daily Stock Limit
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.dailyStock}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        dailyStock: parseInt(e.target.value) || 0,
                      }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="0 for no limit"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Set to 0 for unlimited daily availability
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Current Stock
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.currentStock}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        currentStock: parseInt(e.target.value) || 0,
                      }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    disabled={formData.dailyStock === 0}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Automatically managed when daily limit is set
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Category
                    </label>
                    <select
                      value={formData.category}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          category: e.target.value,
                        }))
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    >
                      <option value="drinks">Drinks</option>
                      <option value="meals">Meals</option>
                      <option value="snacks">Snacks</option>
                      <option value="desserts">Desserts</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Type
                    </label>
                    <select
                      value={formData.isVeg}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          isVeg: e.target.value === "true",
                        }))
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    >
                      <option value="true">Vegetarian</option>
                      <option value="false">Non-Vegetarian</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Prep Time (min)
                    </label>
                    <input
                      type="number"
                      min="5"
                      value={formData.preparationTime}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          preparationTime: parseInt(e.target.value),
                        }))
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Image
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setImageFile(e.target.files[0])}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <div className="flex justify-between items-center mb-4">
                    <label className="block text-sm font-medium text-gray-700">
                      Customizations (Optional)
                    </label>
                    <button
                      type="button"
                      onClick={addCustomization}
                      className="bg-gray-600 text-white px-3 py-1 rounded-md hover:bg-gray-700 text-sm"
                    >
                      Add Customization
                    </button>
                  </div>

                  {formData.customizations.map((customization, customIndex) => (
                    <div
                      key={customIndex}
                      className="border rounded-md p-4 mb-4"
                    >
                      <div className="flex justify-between items-center mb-3">
                        <input
                          type="text"
                          placeholder="Customization name (e.g., Spice Level)"
                          value={customization.name}
                          onChange={(e) =>
                            updateCustomization(
                              customIndex,
                              "name",
                              e.target.value
                            )
                          }
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        />
                        <button
                          type="button"
                          onClick={() => removeCustomization(customIndex)}
                          className="ml-2 text-red-600 hover:text-red-700"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>

                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium text-gray-700">
                            Options:
                          </span>
                          <button
                            type="button"
                            onClick={() => addCustomizationOption(customIndex)}
                            className="bg-green-600 text-white px-2 py-1 rounded text-xs hover:bg-green-700"
                          >
                            Add Option
                          </button>
                        </div>

                        {customization.options.map((option, optionIndex) => (
                          <div key={optionIndex} className="flex space-x-2">
                            <input
                              type="text"
                              placeholder="Option name"
                              value={option.name}
                              onChange={(e) =>
                                updateCustomizationOption(
                                  customIndex,
                                  optionIndex,
                                  "name",
                                  e.target.value
                                )
                              }
                              className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent"
                            />
                            <input
                              type="number"
                              placeholder="Extra price"
                              min="0"
                              value={option.price}
                              onChange={(e) =>
                                updateCustomizationOption(
                                  customIndex,
                                  optionIndex,
                                  "price",
                                  parseFloat(e.target.value) || 0
                                )
                              }
                              className="w-20 px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent"
                            />
                            <button
                              type="button"
                              onClick={() =>
                                removeCustomizationOption(
                                  customIndex,
                                  optionIndex
                                )
                              }
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex space-x-4">
                  <button
                    type="button"
                    onClick={handleCloseModal}
                    className="flex-1 border border-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 transition-colors"
                  >
                    {editingItem ? "Update Item" : "Add Item"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminMenu;

<div className="grid grid-cols-1 md:grid-cols-2 gap-4"></div>;
