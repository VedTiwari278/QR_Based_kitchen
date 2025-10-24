// testLogin.js
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Import your User model
import User from '../models/User.js';

async function testLogin() {
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

    console.log('Testing password comparison for admin user:');
    console.log('Email:', adminUser.email);
    console.log('Stored hash:', adminUser.password);
    
    // Test with correct password
    const correctMatch = await adminUser.comparePassword('Admin@123');
    console.log('Comparison with "Admin@123":', correctMatch);
    
    // Test with incorrect password
    const incorrectMatch = await adminUser.comparePassword('WrongPassword');
    console.log('Comparison with "WrongPassword":', incorrectMatch);
    
    // Test direct bcrypt comparison
    const directMatch = await bcrypt.compare('Admin@123', adminUser.password);
    console.log('Direct bcrypt comparison:', directMatch);
    
    process.exit(0);
  } catch (error) {
    console.error('Error testing login:', error);
    process.exit(1);
  }
}

testLogin();