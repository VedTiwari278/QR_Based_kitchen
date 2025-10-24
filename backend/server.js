import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import mongoose from "mongoose";
import path from "path";
import http from "http";
import { Server } from "socket.io";
import { fileURLToPath } from "url";
import { dirname } from "path";

import CronService from "./services/cronService.js";
import OrderAutomationService from "./services/orderAutomation.js";

// Import routes
import authRoutes from "./routes/auth.js";
import menuRoutes from "./routes/menu.js";
import orderRoutes from "./routes/order.js";
import adminRoutes from "./routes/admin.js";
import paymentRoutes from "./routes/payment.js";
import feedbackRoutes from "./routes/feedback.js"; // ADD .js EXTENSION

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: [
      "http://localhost:5173",
      "https://qr-based-kitchen-2ad9.vercel.app",
    ],
    methods: ["GET", "POST"],
    credentials: true,
  },
});

// Middleware
app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.json({ message: "Server Started", Status: 200 });
});

app.use(express.urlencoded({ extended: true }));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Socket.IO connection
io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  socket.on("join-admin", () => {
    socket.join("admin-room");
  });

  socket.on("join-order", (orderId) => {
    socket.join(`order-${orderId}`);
    console.log(`User joined order room: order-${orderId}`);
  });

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
  });
});

// Make io accessible to routes
app.use((req, res, next) => {
  req.io = io;
  next();
});

// Database connection
mongoose
  .connect(
    process.env.MONGODB_URI || "mongodb://localhost:27017/qr-food-ordering",
    {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    }
  )
  .then(() => {
    console.log("Connected to MongoDB");
  })
  .catch((err) => {
    console.error("MongoDB connection error:", err);
  });

CronService.init();

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/menu", menuRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/payment", paymentRoutes);
app.use("/api/feedback", feedbackRoutes);

// Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "OK", timestamp: new Date().toISOString() });
});

// Simple order automation (remove if OrderAutomationService doesn't exist)
setInterval(() => {
  // Basic order status updates
  console.log("Order automation running...");
}, 60000);

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

export { app, io };
