import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';

const CartContext = createContext();

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const { user, isAuthenticated, updateCart } = useAuth();


  const normalizeCartItem = (item) => {
    return {
      item: {
        _id: item.item?._id || item.item,
        name: item.item?.name || item.name,
        price: item.item?.price || item.price,
        image: item.item?.image || item.image,
        description: item.item?.description,
        isVeg: item.item?.isVeg,
        customizations: item.item?.customizations,
        preparationTime: item.item?.preparationTime
      },
      quantity: item.quantity || 1,
      customizations: item.customizations || {},
      price: item.price || (item.item?.price || 0)
    };
  };

  const areItemsEqual = (item1, item2) => {
    return (
      item1.item._id === item2.item._id &&
      JSON.stringify(item1.customizations) === JSON.stringify(item2.customizations)
    );
  };

  const mergeCarts = (guestCart, userCart) => {
    const merged = [...userCart];
    
    guestCart.forEach(guestItem => {
      const normalizedGuestItem = normalizeCartItem(guestItem);
      const existingIndex = merged.findIndex(userItem => 
        areItemsEqual(normalizeCartItem(userItem), normalizedGuestItem)
      );

      if (existingIndex >= 0) {
        merged[existingIndex].quantity += normalizedGuestItem.quantity;
      } else {
        merged.push(normalizedGuestItem);
      }
    });

    return merged;
  };

  useEffect(() => {
    const loadGuestCart = () => {
      try {
        const savedCart = localStorage.getItem('guestCart');
        if (savedCart) {
          const parsedCart = JSON.parse(savedCart);
          console.log('🛒 Loaded guest cart from localStorage:', parsedCart);
          
          const validCart = parsedCart
            .filter(item => item && item.item && (item.item._id || item.item))
            .map(normalizeCartItem);
          
          setCartItems(validCart);
        }
      } catch (error) {
        console.error('Error loading guest cart:', error);
        setCartItems([]);
      }
    };

    if (!isAuthenticated) {
      loadGuestCart();
    }
  }, []);

  useEffect(() => {
    const handleUserLogin = async () => {
      if (isAuthenticated && user) {
        setIsLoading(true);
        console.log('🔐 User logged in - Merging carts');
        
        try {
          const guestCart = JSON.parse(localStorage.getItem('guestCart') || '[]');
          const normalizedGuestCart = guestCart.map(normalizeCartItem);
          
          const userCart = user.cart || [];
          const normalizedUserCart = userCart.map(normalizeCartItem);
          
          console.log('📦 Guest cart:', normalizedGuestCart);
          console.log('📦 User cart from database:', normalizedUserCart);
          
          if (normalizedGuestCart.length > 0) {
            const mergedCart = mergeCarts(normalizedGuestCart, normalizedUserCart);
            console.log('🔄 Merged cart:', mergedCart);
            
            await updateCart(mergedCart);
            setCartItems(mergedCart);
            
            localStorage.removeItem('guestCart');
            console.log('✅ Carts merged successfully');
          } else {
            setCartItems(normalizedUserCart);
            console.log('✅ Loaded user cart from database');
          }
          
        } catch (error) {
          console.error('❌ Error merging carts:', error);
          setCartItems(user.cart || []);
        } finally {
          setIsLoading(false);
        }
      }
    };

    if (isAuthenticated) {
      handleUserLogin();
    }
  }, [isAuthenticated, user?._id]);

  useEffect(() => {
    if (!isAuthenticated) {
      console.log('🚪 User logged out - Switching to guest cart');
      
      const loadGuestCart = () => {
        try {
          const savedCart = localStorage.getItem('guestCart');
          if (savedCart) {
            const parsedCart = JSON.parse(savedCart);
            console.log('🛒 Loaded existing guest cart after logout:', parsedCart);
            const normalizedCart = parsedCart.map(normalizeCartItem);
            setCartItems(normalizedCart);
          } else {
            console.log('No guest cart found, starting with empty cart');
            setCartItems([]);
          }
        } catch (error) {
          console.error('Error loading guest cart after logout:', error);
          setCartItems([]);
        }
      };

      loadGuestCart();
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (cartItems.length === 0) {
      if (isAuthenticated) {
        updateCart([]);
      } else {
        localStorage.removeItem('guestCart');
      }
      return;
    }

    const saveCart = async () => {
      if (isAuthenticated) {
        console.log('💾 Saving to user database cart:', cartItems);
        try {
          await updateCart(cartItems);
        } catch (error) {
          console.error('❌ Failed to save cart to database:', error);
        }
      } else {
        console.log('💾 Saving to guest cart (localStorage):', cartItems);
        localStorage.setItem('guestCart', JSON.stringify(cartItems));
      }
    };

    saveCart();
  }, [cartItems, isAuthenticated]);


  const addToCart = async (item, quantity = 1, customizations = {}) => {
    setIsLoading(true);
    
    try {
      setCartItems(prev => {
        const normalizedNewItem = {
          item: {
            _id: item._id,
            name: item.name,
            price: item.price,
            image: item.image,
            description: item.description,
            isVeg: item.isVeg,
            customizations: item.customizations,
            preparationTime: item.preparationTime
          },
          quantity,
          customizations: customizations || {},
          price: calculateItemPrice(item, customizations)
        };

        const existingIndex = prev.findIndex(
          cartItem => areItemsEqual(cartItem, normalizedNewItem)
        );

        let newCart;
        if (existingIndex >= 0) {
          newCart = [...prev];
          newCart[existingIndex] = {
            ...newCart[existingIndex],
            quantity: newCart[existingIndex].quantity + quantity
          };
        } else {
          newCart = [...prev, normalizedNewItem];
        }

        console.log('➕ Cart after add:', newCart);
        return newCart;
      });

    } catch (error) {
      console.error('Error adding to cart:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const removeFromCart = async (itemId, customizations = {}) => {
    setIsLoading(true);
    
    try {
      setCartItems(prev => 
        prev.filter(item => 
          !(item.item._id === itemId && 
            JSON.stringify(item.customizations || {}) === JSON.stringify(customizations || {}))
        )
      );
    } catch (error) {
      console.error('Error removing from cart:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const updateQuantity = async (itemId, customizations, newQuantity) => {
    if (newQuantity <= 0) {
      removeFromCart(itemId, customizations);
      return;
    }

    setIsLoading(true);
    
    try {
      setCartItems(prev =>
        prev.map(item =>
          item.item._id === itemId && 
          JSON.stringify(item.customizations || {}) === JSON.stringify(customizations || {})
            ? { ...item, quantity: newQuantity }
            : item
        )
      );
    } catch (error) {
      console.error('Error updating quantity:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const clearCart = async () => {
    setIsLoading(true);
    
    try {
      setCartItems([]);
      
      if (isAuthenticated) {
        await updateCart([]);
      } else {
        localStorage.removeItem('guestCart');
      }
      
      console.log('🗑️ Cart cleared');
    } catch (error) {
      console.error('Error clearing cart:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const calculateItemPrice = (item, customizations = {}) => {
    let price = item.price;
    
    if (customizations && item.customizations) {
      for (const [customType, customValue] of Object.entries(customizations)) {
        const customization = item.customizations.find(c => c.name === customType);
        if (customization) {
          const option = customization.options.find(o => o.name === customValue);
          if (option) {
            price += option.price;
          }
        }
      }
    }
    
    return price;
  };

  const getCartTotal = () => {
    return cartItems.reduce((total, item) => {
      return total + (item.price * item.quantity);
    }, 0);
  };

  const getCartItemsCount = () => {
    return cartItems.reduce((total, item) => total + item.quantity, 0);
  };

  const getCartSummary = () => {
    return {
      items: cartItems,
      total: getCartTotal(),
      count: getCartItemsCount(),
      tax: getCartTotal() * 0.05,
      grandTotal: getCartTotal() * 1.05
    };
  };

  const value = {
    cartItems,
    isLoading,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    getCartTotal,
    getCartItemsCount,
    getCartSummary,
    calculateItemPrice
  };

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
};