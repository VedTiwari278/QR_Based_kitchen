import React from "react";
import { Link } from "react-router-dom";
import { Plus, Minus, Trash2, ArrowRight } from "lucide-react";
import { useCart } from "../contexts/CartContext";

const Cart = () => {
  const { cartItems, updateQuantity, removeFromCart, getCartTotal, clearCart } =
    useCart();

  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center py-20">
            <div className="text-6xl mb-4">🛒</div>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              Your cart is empty
            </h2>
            <p className="text-gray-600 mb-8">
              Add some delicious items from our menu
            </p>
            <Link
              to="/menu"
              className="bg-green-600 text-white px-8 py-3 rounded-lg hover:bg-green-700 transition-colors inline-flex items-center space-x-2"
            >
              <span>Browse Menu</span>
              <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const subtotal = getCartTotal();
  const tax = subtotal * 0.05; // 5% tax
  const total = subtotal + tax;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Your Cart</h1>
          <p className="text-gray-600">Review your items before checkout</p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm">
              <div className="p-6 border-b border-gray-200">
                <div className="flex justify-between items-center">
                  <h2 className="text-lg font-semibold">
                    Items ({cartItems.length})
                  </h2>
                  <button
                    onClick={clearCart}
                    className="text-red-600 hover:text-red-700 text-sm font-medium"
                  >
                    Clear All
                  </button>
                </div>
              </div>

              <div className="divide-y divide-gray-200">
                {cartItems.map((cartItem, index) => (
                  <div key={`${cartItem.item._id}-${index}`} className="p-6">
                    <div className="flex space-x-4">
                      <div className="flex-shrink-0 w-16 h-16 bg-gray-200 rounded-md overflow-hidden">
                        {cartItem.item.image ? (
                          <img
                            src={`https://qr-based-kitchen.vercel.app${cartItem.item.image}`}
                            alt={cartItem.item.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-2xl">
                            🍽️
                          </div>
                        )}
                      </div>

                      <div className="flex-1">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="text-lg font-medium text-gray-900">
                              {cartItem.item.name}
                            </h3>
                            <p className="text-sm text-gray-600 mt-1">
                              {cartItem.item.description}
                            </p>

                            {/* Customizations */}
                            {cartItem.customizations &&
                              Object.keys(cartItem.customizations).length >
                                0 && (
                                <div className="mt-2">
                                  <p className="text-sm text-gray-500">
                                    Customizations:
                                  </p>
                                  <div className="text-sm text-gray-600">
                                    {Object.entries(
                                      cartItem.customizations
                                    ).map(([key, value]) => (
                                      <span key={key} className="mr-3">
                                        {key}: {value}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              )}
                          </div>

                          <div className="text-right">
                            <p className="text-lg font-semibold text-gray-900">
                              ₹{cartItem.price}
                            </p>
                            <button
                              onClick={() =>
                                removeFromCart(
                                  cartItem.item._id,
                                  cartItem.customizations
                                )
                              }
                              className="text-red-600 hover:text-red-700 mt-2"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>

                        {/* Quantity Controls */}
                        <div className="flex items-center justify-between mt-4">
                          <div className="flex items-center space-x-3">
                            <button
                              onClick={() =>
                                updateQuantity(
                                  cartItem.item._id,
                                  cartItem.customizations,
                                  cartItem.quantity - 1
                                )
                              }
                              className="p-1 rounded-md border hover:bg-gray-50"
                            >
                              <Minus size={16} />
                            </button>
                            <span className="px-3 py-1 border rounded-md">
                              {cartItem.quantity}
                            </span>
                            <button
                              onClick={() =>
                                updateQuantity(
                                  cartItem.item._id,
                                  cartItem.customizations,
                                  cartItem.quantity + 1
                                )
                              }
                              className="p-1 rounded-md border hover:bg-gray-50"
                            >
                              <Plus size={16} />
                            </button>
                          </div>

                          <div className="text-lg font-semibold">
                            ₹{(cartItem.price * cartItem.quantity).toFixed(2)}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm p-6 sticky top-24">
              <h2 className="text-lg font-semibold mb-4">Order Summary</h2>

              <div className="space-y-3 mb-4">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>₹{subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Tax (5%)</span>
                  <span>₹{tax.toFixed(2)}</span>
                </div>
                <div className="border-t border-gray-200 pt-3">
                  <div className="flex justify-between items-center text-lg font-semibold">
                    <span>Total</span>
                    <span className="text-green-600">₹{total.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              <Link
                to="/checkout"
                className="w-full bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 transition-colors font-medium flex items-center justify-center space-x-2"
              >
                <span>Proceed to Checkout</span>
                <ArrowRight size={16} />
              </Link>

              <Link
                to="/menu"
                className="w-full mt-3 border border-green-600 text-green-600 py-3 px-4 rounded-lg hover:bg-green-50 transition-colors font-medium text-center block"
              >
                Add More Items
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Cart;
