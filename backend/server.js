// 1️⃣ Load environment variables FIRST
import "dotenv/config";
import express from "express";
import cors from "cors";
import { initDatabase, checkDatabaseHealth } from "./utils/db.js";

// Route imports
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

const app = express();

// 2️⃣ Updated Middlewares for Razorpay & Security
app.use(cors({
  origin: [
    'https://dar-al-hikma.vercel.app', 
    'https://www.daralhikma.org',
    'https://daralhikma.org',
    'http://localhost:5173' // Keep for local testing
  ],
  credentials: true,
  exposedHeaders: ["x-rtb-fingerprint-id"], // 🔥 Crucial for Razorpay
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With", "x-rtb-fingerprint-id"],
  maxAge: 600 // Caches CORS permission for 10 minutes
}));

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// 3️⃣ Self-Ping Hack (Keeps Render Awake)
setInterval(() => {
  fetch(`https://dar-al-hikma-backend.onrender.com/health`)
    .then(() => console.log("☀️ Keep-alive ping successful"))
    .catch((err) => console.log("🌙 Ping failed, server might be sleeping"));
}, 14 * 60 * 1000); 

// 4️⃣ Health Check
app.get("/health", async (req, res) => {
  const dbHealth = await checkDatabaseHealth();
  res.json({
    success: dbHealth.healthy,
    message: dbHealth.healthy ? "Healthy" : "DB Connection Issue",
    time: new Date().toISOString(),
  });
});

// 5️⃣ API Routes
app.use("/api/webhooks", webhookRoutes); // Public endpoint for Razorpay/Stripe
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

// 6️⃣ Global error handler
app.use((err, req, res, next) => {
  console.error("❌ Global Error:", { message: err.message, code: err.code });
  res.status(err.status || 500).json({
    success: false,
    message: err.message || "Internal Server Error"
  });
});

// 7️⃣ Start server (Non-blocking DB init)
const PORT = process.env.PORT || 5000;

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server ready on port ${PORT}`);
  
  // Background DB connection
  initDatabase()
    .then(() => console.log("✅ Database initialized"))
    .catch(error => console.error("❌ DB init failed:", error.message));
});