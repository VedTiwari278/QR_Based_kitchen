// forceResetPassword.js
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

async function forceResetPassword() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/qr-food-ordering');
    console.log('Connected to MongoDB');

    // Get the database connection
    const db = mongoose.connection.db;
    
    // Directly update the user document
    const result = await db.collection('users').updateOne(
      { email: 'admin@example.com' },
      { 
        $set: { 
          password: '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy',
          updatedAt: new Date()
        } 
      }
    );
    
    console.log('Update result:', result);
    
    if (result.modifiedCount > 0) {
      console.log('Password forcefully reset to: Admin@123');
    } else {
      console.log('No documents matched the query');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Error resetting password:', error);
    process.exit(1);
  }
}

forceResetPassword();