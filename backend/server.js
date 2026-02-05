// 1️⃣ Load environment variables FIRST (ESM-safe)
import "dotenv/config";

// 2️⃣ Core imports
import express from "express";
import cors from "cors";

// 3️⃣ Database utilities
import { initDatabase, checkDatabaseHealth } from "./utils/db.js";

// 4️⃣ Route imports
import authRoutes from "./routes/auth.routes.js";
import projectRoutes from "./routes/project.routes.js";
import donationRoutes from "./routes/donation.routes.js";
import adminRoutes from "./routes/admin.routes.js";
import donorRoutes from "./routes/donor.routes.js";
import mediaRoutes from "./routes/media.routes.js";
import nisabRoutes from "./routes/nisab.routes.js";
import contentRoutes from "./routes/content.routes.js";
import webhookRoutes from "./routes/webhook.routes.js";
import blogRoutes from "./routes/blog.routes.js";
import eventRoutes from "./routes/event.routes.js";
import testimonialRoutes from "./routes/testimonial.routes.js";
import aboutusRoutes from "./routes/aboutus.routes.js";

// 5️⃣ App init
const app = express();

// 6️⃣ Dynamic CORS & Security Configuration
const allowedOrigins = [
  'https://dar-al-hikma.vercel.app', // Your Production Vercel URL
  'https://www.daralhikma.org',      // Your GoDaddy/Hostinger domain
  'https://daralhikma.org',          // Non-www version
  'http://localhost:5173'            // Local development (Vite)
];

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl)
    if (!origin) return callback(null, true);

    // Allow listed origins OR any Vercel preview/deployment URL for your project
    const isVercelUrl = origin.endsWith('.vercel.app') && origin.includes('dar-al-hikma');
    
    if (allowedOrigins.indexOf(origin) !== -1 || isVercelUrl || process.env.NODE_ENV === 'development') {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  exposedHeaders: ["x-rtb-fingerprint-id"], // 🔥 Required for Razorpay risk analysis
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With", "x-rtb-fingerprint-id"],
  maxAge: 600 // Caches CORS permission for 10 minutes to speed up the UI
}));

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// 7️⃣ "Stay-Awake" Ping (Prevents Render Free Tier Spin-down)
setInterval(() => {
  const healthUrl = `https://dar-al-hikma-backend.onrender.com/health`;
  fetch(healthUrl)
    .then(() => console.log("☀️ Keep-alive ping successful"))
    .catch((err) => console.log("🌙 Keep-alive ping failed (Server might be sleeping)"));
}, 14 * 60 * 1000);

// 8️⃣ Health check endpoint
app.get("/health", async (req, res) => {
  const dbHealth = await checkDatabaseHealth();
  res.json({
    success: dbHealth.healthy,
    message: dbHealth.healthy ? "Healthy" : "DB Connection Issue",
    time: new Date().toISOString(),
  });
});

// 9️⃣ API Routes
app.use("/api/webhooks", webhookRoutes); // Public for Razorpay/Stripe
app.use("/api/auth", authRoutes);
app.use("/api/projects", projectRoutes);
app.use("/api/donations", donationRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/donors", donorRoutes);
app.use("/api/media", mediaRoutes);
app.use("/api/nisab", nisabRoutes);
app.use("/api/content", contentRoutes);
app.use("/api/blogs", blogRoutes);
app.use("/api/events", eventRoutes);
app.use("/api/testimonials", testimonialRoutes);
app.use("/api/about-us", aboutusRoutes);

// 🔟 Global error handler
app.use((err, req, res, next) => {
  console.error("❌ Global Error:", { message: err.message, code: err.code });
  res.status(err.status || 500).json({
    success: false,
    message: err.message || "Internal Server Error",
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// 1️⃣1️⃣ Start server (Non-blocking DB init for instant Render health-checks)
const PORT = process.env.PORT || 5000;

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server ready on port ${PORT}`);
  
  // Connect to Supabase/PostgreSQL in the background
  initDatabase()
    .then(() => console.log("✅ Database successfully initialized"))
    .catch(error => {
      console.error("❌ Database connection failed during startup:", error.message);
    });
});