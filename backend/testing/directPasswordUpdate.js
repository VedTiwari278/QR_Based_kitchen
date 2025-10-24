// directPasswordUpdate.js
import { MongoClient } from 'mongodb';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function directPasswordUpdate() {
  let client;
  
  try {
    // Connect to MongoDB
    client = new MongoClient(process.env.MONGODB_URI || 'mongodb://localhost:27017/qr-food-ordering');
    await client.connect();
    console.log('Connected to MongoDB');

    const db = client.db();
    const usersCollection = db.collection('users');

    // Generate a proper hash for "Admin@123"
    const saltRounds = 10;
    const correctHash = await bcrypt.hash('Admin@123', saltRounds);
    
    // Directly update the user document
    const result = await usersCollection.updateOne(
      { email: 'admin@example.com' },
      { $set: { password: correctHash } }
    );
    
    if (result.modifiedCount === 1) {
      console.log('✅ Password updated successfully!');
      console.log('New hash:', correctHash);
      console.log('You can now login with:');
      console.log('Email: admin@example.com');
      console.log('Password: Admin@123');
    } else {
      console.log('❌ No user was updated');
    }
    
  } catch (error) {
    console.error('Error updating password:', error);
  } finally {
    if (client) {
      await client.close();
    }
    process.exit(0);
  }
}

directPasswordUpdate();