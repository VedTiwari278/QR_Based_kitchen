import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useCart } from '../../contexts/CartContext';
import { Menu, X, ShoppingCart, User, LogOut, Package, History } from 'lucide-react';
import logo from "../../assets/logo.png";

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { user, logout, isAuthenticated, isAdmin } = useAuth();
  const { getCartItemsCount } = useCart();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const isAdminRoute = location.pathname.startsWith('/admin');

  if (isAdminRoute) {
    return (
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link to="/admin" className="text-xl font-bold text-green-600">
              Campus Cravings Admin
            </Link>
            
            {isAuthenticated && isAdmin && (
              <div className="flex items-center space-x-4">
                <nav className="hidden md:flex space-x-6">
                  <Link 
                    to="/admin" 
                    className={`${location.pathname === '/admin' ? 'text-green-600' : 'text-gray-700'} hover:text-green-600`}
                  >
                    Dashboard
                  </Link>
                  <Link 
                    to="/admin/menu" 
                    className={`${location.pathname === '/admin/menu' ? 'text-green-600' : 'text-gray-700'} hover:text-green-600`}
                  >
                    Menu
                  </Link>
                  <Link 
  to="/admin/stock" 
  className={`${location.pathname === '/admin/stock' ? 'text-green-600' : 'text-gray-700'} hover:text-green-600`}
>
  Stock Management
</Link>
                  <Link 
                    to="/admin/orders" 
                    className={`${location.pathname === '/admin/orders' ? 'text-green-600' : 'text-gray-700'} hover:text-green-600`}
                  >
                    Orders
                  </Link>
                  <Link 
                    to="/admin/reports" 
                    className={`${location.pathname === '/admin/reports' ? 'text-green-600' : 'text-gray-700'} hover:text-green-600`}
                  >
                    Reports
                  </Link>
                </nav>
                
                <div className="flex items-center space-x-3">
                  <span className="text-sm text-gray-700">Welcome, {user.name}</span>
                  <button
                    onClick={handleLogout}
                    className="flex items-center space-x-1 text-gray-700 hover:text-red-600"
                  >
                    <LogOut size={16} />
                    <span>Logout</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>
    );
  }

  return (
    <header className="bg-white shadow-sm border-b sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link to="/" className="text-xl font-bold text-green-600">
            <img src={logo} alt="Logo" className="h-20 w-30" />
          </Link>

          <nav className="hidden md:flex space-x-8">
            <Link to="/" className="text-gray-700 hover:text-green-600 transition-colors">
              Home
            </Link>
            <Link to="/menu" className="text-gray-700 hover:text-green-600 transition-colors">
              Menu
            </Link>
            {isAuthenticated && (
              <>
                <Link to="/my-orders" className="text-gray-700 hover:text-green-600 transition-colors">
                  My Orders
                </Link>
              </>
            )}
            <Link to="/contact" className="text-gray-700 hover:text-green-600 transition-colors">
              Contact Us
            </Link>
          </nav>

          <div className="flex items-center space-x-4">
            {localStorage.getItem('token')? <Link to="/cart" className="relative p-2 text-gray-700 hover:text-green-600 transition-colors">
              <ShoppingCart size={20}/> 
              {getCartItemsCount() > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  {getCartItemsCount()}
                </span>
              )}
            </Link>: ('')}

            {isAuthenticated ? (
              <div className="flex items-center space-x-3">
                <span className="text-sm text-gray-700">Hi, {user.name}!</span>
                <button
                  onClick={handleLogout}
                  className="text-gray-700 hover:text-red-600 transition-colors"
                >
                  <LogOut size={16} />
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <Link 
                  to="/login" 
                  className="text-gray-700 hover:text-green-600 transition-colors"
                >
                  Login
                </Link>
                <span className="text-gray-400">|</span>
                <Link 
                  to="/register" 
                  className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors"
                >
                  Sign Up
                </Link>
              </div>
            )}

            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="md:hidden p-2"
            >
              {isMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {isMenuOpen && (
          <div className="md:hidden py-4 border-t">
            <div className="flex flex-col space-y-4">
              <Link 
                to="/" 
                className="text-gray-700 hover:text-green-600"
                onClick={() => setIsMenuOpen(false)}
              >
                Home
              </Link>
              <Link 
                to="/menu" 
                className="text-gray-700 hover:text-green-600"
                onClick={() => setIsMenuOpen(false)}
              >
                Menu
              </Link>
              
              {isAuthenticated && (
                <>
                  <Link 
                    to="/my-orders" 
                    className="text-gray-700 hover:text-green-600"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    My Orders
                  </Link>
                  <Link 
                    to="/track-order" 
                    className="text-gray-700 hover:text-green-600"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Track Order
                  </Link>
                </>
              )}
              
              <Link 
                to="/contact" 
                className="text-gray-700 hover:text-green-600"
                onClick={() => setIsMenuOpen(false)}
              >
                Contact Us
              </Link>
              
              {!isAuthenticated && (
                <>
                  <Link 
                    to="/login" 
                    className="text-gray-700 hover:text-green-600"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Login
                  </Link>
                  <Link 
                    to="/register" 
                    className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 text-center"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Sign Up
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;