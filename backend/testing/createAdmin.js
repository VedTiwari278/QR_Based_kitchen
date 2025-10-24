import mongoose from "mongoose";
import dotenv from "dotenv";
import bcrypt from "bcryptjs";
import User from "./models/User.js"; // Make sure this path is correct

dotenv.config();

const createAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || "mongodb://localhost:27017/qr-food-ordering", {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    const hashedPassword = await bcrypt.hash("Admin@123", 10); // set your password here

    const admin = new User({
      name: "admin",
      email: "admin@example.com",
      password: hashedPassword,
      phone: "0000000000",
      role: "admin",
    });

    await admin.save();
    console.log("Admin user created successfully!");
    mongoose.disconnect();
  } catch (error) {
    console.error("Error creating admin:", error);
  }
};

createAdmin();
