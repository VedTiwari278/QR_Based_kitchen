// testPassword.js (updated)
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';

// Load environment variables
dotenv.config();

// Import your User model
import User from '../models/User.js';

async function test() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/qr-food-ordering');
    
    // Get the current admin user
    const adminUser = await User.findOne({ email: 'admin@example.com' });
    
    if (!adminUser) {
      console.log('Admin user not found');
      return;
    }
    
    const storedHash = adminUser.password;
    const testPassword = "Admin@123";

    console.log("Testing password comparison:");
    console.log("Stored hash from DB:", storedHash);
    console.log("Test password:", testPassword);
    
    const isMatch = await bcrypt.compare(testPassword, storedHash);
    console.log("Direct bcrypt comparison result:", isMatch);
    
    // Test creating a new hash with the same password
    const newHash = await bcrypt.hash(testPassword, 10);
    console.log("New hash for same password:", newHash);
    
    const newMatch = await bcrypt.compare(testPassword, newHash);
    console.log("Comparison with new hash:", newMatch);
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

test();