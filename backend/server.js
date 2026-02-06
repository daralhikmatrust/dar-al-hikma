// 1️⃣ Load environment variables FIRST
import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet"; // Added for extra security

// 2️⃣ Database utilities
import { initDatabase, checkDatabaseHealth } from "./utils/db.js";

// 3️⃣ Route imports
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

// 4️⃣ Secure CORS Configuration
const allowedOrigins = [
  'https://www.daralhikma.org',      // Your new GoDaddy domain
  'https://daralhikma.org',          // Non-www version
  'https://dar-al-hikma.vercel.app', // Keep your Vercel backup URL
  'http://localhost:5173'            // Local development
];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    
    // Exact match OR secure regex for Vercel preview branches
    const isVercelPreview = /^https:\/\/dar-al-hikma-.*\.vercel\.app$/.test(origin);
    
    if (allowedOrigins.includes(origin) || isVercelPreview || process.env.NODE_ENV === 'development') {
      callback(null, true);
    } else {
      callback(new Error('CORS Not allowed'));
    }
  },
  credentials: true,
  exposedHeaders: ["x-rtb-fingerprint-id"],
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With", "x-rtb-fingerprint-id"],
  maxAge: 600 
}));

// 5️⃣ Security & Body Parsing
app.use(helmet({ crossOriginResourcePolicy: false })); // Basic security headers
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// 6️⃣ Keep-Alive Ping (Render Free Tier)
setInterval(async () => {
  try {
    const healthUrl = `https://dar-al-hikma-backend.onrender.com/health`;
    const res = await fetch(healthUrl);
    if (res.ok) console.log("☀️ Keep-alive: Server is awake");
  } catch (err) {
    console.error("🌙 Keep-alive failed:", err.message);
  }
}, 14 * 60 * 1000);

// 7️⃣ Health check
app.get("/health", async (req, res) => {
  const dbHealth = await checkDatabaseHealth();
  res.status(dbHealth.healthy ? 200 : 503).json({
    success: dbHealth.healthy,
    status: dbHealth.healthy ? "UP" : "DOWN",
    database: dbHealth,
    timestamp: new Date().toISOString(),
  });
});

// 8️⃣ API Routes
app.use("/api/webhooks", webhookRoutes); 
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

// 9️⃣ Error Handling
app.use((err, req, res, next) => {
  const statusCode = err.status || 500;
  console.error(`❌ [${new Date().toISOString()}] Error:`, err.message);
  
  res.status(statusCode).json({
    success: false,
    message: err.message || "Internal Server Error",
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// 🔟 Server Lifecycle
const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server active on port ${PORT}`);
  
  initDatabase()
    .then(() => console.log("✅ Database link established"))
    .catch(error => console.error("❌ Database link failed:", error.message));
});

// Graceful Shutdown (Important for Render/Supabase)
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
    process.exit(0);
  });
});