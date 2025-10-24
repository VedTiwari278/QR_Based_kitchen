import React from 'react';
import { Users, Heart, Award, Clock, ChefHat, Star, Utensils, Gem } from 'lucide-react';

const About = () => {
  const teamMembers = [
    {
      name: "Chef Marco Rossi",
      role: "Head Chef & Owner",
      description: "15+ years of culinary excellence, trained in Michelin-star restaurants across Italy and France.",
      image: "👨‍🍳",
      specialty: "Italian Cuisine"
    },
    {
      name: "Sophia Chen",
      role: "Pastry Chef",
      description: "Award-winning pastry artist with a passion for creating unforgettable dessert experiences.",
      image: "👩‍🍳",
      specialty: "Desserts & Pastries"
    },
    {
      name: "James Wilson",
      role: "Restaurant Manager",
      description: "Dedicated to providing exceptional service and creating memorable dining experiences.",
      image: "👨‍💼",
      specialty: "Guest Relations"
    }
  ];

  const milestones = [
    { year: "2010", event: "Restaurant Founded", description: "Started with a vision of authentic flavors" },
    { year: "2014", event: "First Award", description: "Best New Restaurant in the city" },
    { year: "2018", event: "Expansion", description: "Opened our second location downtown" },
    { year: "2023", event: "Culinary Excellence", description: "Featured in Food & Wine Magazine" }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-amber-50">
      {/* Hero Section */}
      <div className="relative bg-gradient-to-r from-amber-900 to-amber-700 py-24">
        <div className="absolute inset-0 bg-black opacity-30"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-6xl font-bold text-white mb-6">Our Story</h1>
          <p className="text-xl text-amber-100 max-w-3xl mx-auto leading-relaxed">
            From a family kitchen to your table - serving authentic flavors with passion since 2010
          </p>
        </div>
      </div>

      {/* Story Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center mb-20">
          <div>
            <div className="bg-gradient-to-br from-amber-100 to-orange-100 p-8 rounded-3xl shadow-xl">
              <h2 className="text-4xl font-bold text-gray-900 mb-6">How It All Began</h2>
              <div className="space-y-4 text-gray-700 leading-relaxed">
                <p className="text-lg">
                  Our journey started in a small kitchen in Tuscany, where Grandma Rossi taught us 
                  that the secret ingredient to great food is always <span className="text-amber-600 font-semibold">love</span>.
                </p>
                <p>
                  What began as family recipes passed down through generations has evolved into a 
                  culinary experience that celebrates tradition while embracing innovation.
                </p>
                <p>
                  In 2010, we opened our doors with a simple mission: to create memorable dining 
                  experiences using the freshest local ingredients. Today, we continue to honor 
                  Grandma Rossi's legacy while adding our own creative touch to every dish.
                </p>
                <p className="font-semibold text-amber-700">
                  We believe that food brings people together, and every meal should be a 
                  celebration of flavor, community, and life's simple pleasures.
                </p>
              </div>
            </div>
          </div>
          
          <div className="relative">
            <div className="bg-gradient-to-br from-amber-200 to-orange-200 h-96 rounded-3xl shadow-2xl flex items-center justify-center">
              <div className="text-center p-8">
                <ChefHat className="h-16 w-16 text-amber-700 mx-auto mb-4" />
                <p className="text-2xl font-bold text-amber-900">Authentic Italian Cuisine</p>
                <p className="text-amber-700 mt-2">Made with passion, served with love</p>
              </div>
            </div>
          </div>
        </div>

        {/* Values Section */}
        <div className="mb-20">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Our Values</h2>
            <p className="text-xl text-gray-600">The principles that guide everything we do</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="bg-white rounded-2xl shadow-xl p-8 text-center transform hover:scale-105 transition-transform duration-300">
              <div className="bg-amber-100 w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Heart className="h-10 w-10 text-amber-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Fresh Ingredients</h3>
              <p className="text-gray-600">We source locally and prioritize seasonal, organic produce daily</p>
            </div>

            <div className="bg-white rounded-2xl shadow-xl p-8 text-center transform hover:scale-105 transition-transform duration-300">
              <div className="bg-amber-100 w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Users className="h-10 w-10 text-amber-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Community Focus</h3>
              <p className="text-gray-600">Building strong relationships with local farmers and suppliers</p>
            </div>

            <div className="bg-white rounded-2xl shadow-xl p-8 text-center transform hover:scale-105 transition-transform duration-300">
              <div className="bg-amber-100 w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Award className="h-10 w-10 text-amber-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Excellence</h3>
              <p className="text-gray-600">Every dish crafted with meticulous attention to detail</p>
            </div>

            <div className="bg-white rounded-2xl shadow-xl p-8 text-center transform hover:scale-105 transition-transform duration-300">
              <div className="bg-amber-100 w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Gem className="h-10 w-10 text-amber-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Tradition</h3>
              <p className="text-gray-600">Honoring authentic recipes while embracing innovation</p>
            </div>
          </div>
        </div>

        {/* Team Section */}
        <div className="mb-20">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Meet Our Culinary Artists</h2>
            <p className="text-xl text-gray-600">The passionate team behind your dining experience</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {teamMembers.map((member, index) => (
              <div key={index} className="bg-white rounded-2xl shadow-xl overflow-hidden transform hover:scale-105 transition-transform duration-300">
                <div className="bg-gradient-to-r from-amber-500 to-amber-600 p-8 text-center">
                  <div className="text-6xl mb-4">{member.image}</div>
                  <h3 className="text-2xl font-bold text-white mb-1">{member.name}</h3>
                  <p className="text-amber-100 font-semibold">{member.role}</p>
                </div>
                <div className="p-6">
                  <p className="text-gray-600 mb-4">{member.description}</p>
                  <div className="bg-amber-50 rounded-lg p-3">
                    <p className="text-amber-700 font-semibold">Specialty: {member.specialty}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Timeline */}
        <div className="bg-gradient-to-r from-amber-600 to-amber-700 rounded-3xl shadow-2xl p-12 text-white mb-20">
          <h2 className="text-4xl font-bold text-center mb-12">Our Journey</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {milestones.map((milestone, index) => (
              <div key={index} className="text-center">
                <div className="bg-amber-500 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl font-bold">{milestone.year}</span>
                </div>
                <h3 className="text-xl font-bold mb-2">{milestone.event}</h3>
                <p className="text-amber-100">{milestone.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Achievements */}
        <div className="text-center">
          <h2 className="text-4xl font-bold text-gray-900 mb-12">Why Choose Us</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white rounded-2xl shadow-xl p-8">
              <div className="text-4xl font-bold text-amber-600 mb-2">10,000+</div>
              <div className="text-xl font-semibold text-gray-900">Happy Customers</div>
              <p className="text-gray-600 mt-2">Served with love and satisfaction</p>
            </div>
            <div className="bg-white rounded-2xl shadow-xl p-8">
              <div className="text-4xl font-bold text-amber-600 mb-2">50+</div>
              <div className="text-xl font-semibold text-gray-900">Awards Won</div>
              <p className="text-gray-600 mt-2">Recognized culinary excellence</p>
            </div>
            <div className="bg-white rounded-2xl shadow-xl p-8">
              <div className="text-4xl font-bold text-amber-600 mb-2">13</div>
              <div className="text-xl font-semibold text-gray-900">Years of Excellence</div>
              <p className="text-gray-600 mt-2">Consistent quality since 2010</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default About;