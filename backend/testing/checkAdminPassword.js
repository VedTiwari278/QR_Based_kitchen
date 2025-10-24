// checkAdminPassword.js
import mongoose from 'mongoose';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Import your User model
import User from '../models/User.js';

async function checkAdminPassword() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/qr-food-ordering');
    console.log('Connected to MongoDB');

    // Find the admin user
    const adminUser = await User.findOne({ email: 'admin@example.com' });
    
    if (!adminUser) {
      console.log('Admin user not found');
      return;
    }
    
    console.log('Current admin user details:');
    console.log('Email:', adminUser.email);
    console.log('Password hash:', adminUser.password);
    console.log('Created at:', adminUser.createdAt);
    
    process.exit(0);
  } catch (error) {
    console.error('Error checking admin password:', error);
    process.exit(1);
  }
}

checkAdminPassword();