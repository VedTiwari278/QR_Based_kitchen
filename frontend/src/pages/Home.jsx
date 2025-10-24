import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { QrCode, Clock, CreditCard, Star, ArrowRight } from 'lucide-react';
import axios from 'axios';

const Home = () => {
  const [popularItems, setPopularItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPopularItems();
  }, []);

  const fetchPopularItems = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/menu/popular/items');
      setPopularItems(response.data);
    } catch (error) {
      console.error('Error fetching popular items:', error);
    } finally {
      setLoading(false);
    }
  };

  const features = [
    {
      icon: <QrCode className="h-8 w-8 text-green-600" />,
      title: "Scan & Order",
      description: "Simply scan the QR code at your table to access the menu instantly"
    },
    {
      icon: <Clock className="h-8 w-8 text-green-600" />,
      title: "Fast Service",
      description: "Get real-time updates on your order status and estimated delivery time"
    },
    {
      icon: <CreditCard className="h-8 w-8 text-green-600" />,
      title: "Easy Payment",
      description: "Multiple payment options including UPI, cards, and cash on delivery"
    }
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-green-50 to-green-100 bg-cover bg-center bg-no-repeat py-20" style={{ backgroundImage: "linear-gradient(rgba(0,0,0,0.8), rgba(0,0,0,0.5)), url('/Canteen2.jpg')" }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="flex justify-center items-center my-6">
              <QrCode className="h-24 w-24 text-white" />
            </div>
            <h1 className="text-4xl md:text-6xl font-bold text-white mb-6">
              Campus <span className="text-green-600">Cravings</span>
            </h1>
            <p className="text-xl text-white mb-8 max-w-2xl mx-auto">
              Your favorite campus food, now just a scan away. Order, track, and enjoy delicious meals without the wait.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link 
                to="/menu" 
                className="bg-green-600 text-white px-8 py-4 rounded-lg hover:bg-green-700 transition-colors font-semibold flex items-center justify-center space-x-2"
              >
                <span>View Menu</span>
                <ArrowRight size={20} />
              </Link>
              <button className="border-2 border-green-600 text-green-600 px-8 py-4 rounded-lg hover:bg-green-50 transition-colors font-semibold">
                Scan QR Code
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              How It Works
            </h2>
            <p className="text-xl text-gray-600">
              Three simple steps to satisfy your cravings
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="text-center p-8 rounded-lg border hover:shadow-lg transition-shadow">
                <div className="flex justify-center mb-4">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold mb-3">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Popular Items Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Popular Items
            </h2>
            <p className="text-xl text-gray-600">
              Student favorites from our menu
            </p>
          </div>
          
          {loading ? (
            <div className="flex justify-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {popularItems.map((item) => (
                <div key={item._id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
                  <div className="h-48 bg-gray-200 flex items-center justify-center">
                    {item.image ? (
                      <img 
                        src={`http://localhost:5000${item.image}`} 
                        alt={item.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-gray-400 text-4xl">🍽️</span>
                    )}
                  </div>
                  <div className="p-6">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="text-xl font-semibold">{item.name}</h3>
                      <span className="text-green-600 font-bold text-lg">₹{item.price}</span>
                    </div>
                    <p className="text-gray-600 mb-4">{item.description}</p>
                    <div className="flex justify-between items-center">
                      <div className="flex items-center space-x-1">
                        <Star className="h-4 w-4 text-yellow-400 fill-current" />
                        <span className="text-sm text-gray-600">
                          {item.rating?.average || 0} ({item.rating?.count || 0})
                        </span>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        item.isVeg ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {item.isVeg ? 'Veg' : 'Non-Veg'}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
          
          <div className="text-center mt-12">
            <Link 
              to="/menu" 
              className="bg-green-600 text-white px-8 py-4 rounded-lg hover:bg-green-700 transition-colors font-semibold"
            >
              View Full Menu
            </Link>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-green-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Ready to Order?
          </h2>
          <p className="text-xl text-green-100 mb-8">
            Join thousands of students who love our convenient ordering system
          </p>
          <Link 
            to="/menu" 
            className="bg-white text-green-600 px-8 py-4 rounded-lg hover:bg-gray-100 transition-colors font-semibold"
          >
            Start Ordering Now
          </Link>
        </div>
      </section>
    </div>
  );
};

export default Home;