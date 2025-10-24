import express from "express";
import Cors from "cors";
import dotenv from "dotenv";
import mongoose from "mongoose";
import path from "path";
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
import feedbackRoutes from "./routes/feedback.js";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();

// ------------------ CORS ------------------
const cors = Cors({
  origin: [
    "http://localhost:5173",
    "https://qr-based-kitchen-2ad9.vercel.app",

    "https://campuscraving.vercel.app",
  ],
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  credentials: true,
});

// Helper to use middleware in serverless functions
function runMiddleware(req, res, fn) {
  return new Promise((resolve, reject) => {
    fn(req, res, (result) => {
      if (result instanceof Error) return reject(result);
      return resolve(result);
    });
  });
}

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// ------------------ Routes ------------------
// Wrap routes in CORS middleware
app.use(async (req, res, next) => {
  await runMiddleware(req, res, cors);
  if (req.method === "OPTIONS") return res.status(200).end();
  next();
});

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

app.get("/", (req, res) => {
  res.json({ message: "Server Started", Status: 200 });
});

// ------------------ MongoDB ------------------
mongoose
  .connect(
    process.env.MONGODB_URI || "mongodb://localhost:27017/qr-food-ordering",
    {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    }
  )
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => console.error("MongoDB connection error:", err));

// ------------------ Cron Service ------------------
CronService.init();

// ------------------ Export for Vercel ------------------
export default async function handler(req, res) {
  await runMiddleware(req, res, cors);
  app(req, res);
}
