// 1️⃣ Load environment variables FIRST
import "dotenv/config";
import express from "express";
import cors from "cors";
import { initDatabase, checkDatabaseHealth } from "./utils/db.js";

// Route imports (keep these as they are)
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

// 2️⃣ Optimized CORS for Production Performance
const allowedOrigins = [
  'https://dar-al-hikma.vercel.app',
  'https://www.daralhikma.org',
  'https://daralhikma.org',
  'http://localhost:5173'
];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin) || process.env.NODE_ENV === 'development') {
      callback(null, true);
    } else {
      callback(new Error('CORS blocked'));
    }
  },
  credentials: true,
  exposedHeaders: ["x-rtb-fingerprint-id"],
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  // Preflight cache: Browsers won't ask permission again for 10 mins
  maxAge: 600 
}));

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// 3️⃣ SELF-PING HACK: Keeps Render Awake (Instant Response)
// This pings your health check every 14 minutes so it never "sleeps"
setInterval(() => {
  fetch(`https://dar-al-hikma-backend.onrender.com/health`)
    .then(() => console.log("☀️ Keep-alive ping successful"))
    .catch((err) => console.log("🌙 Ping failed, server might be sleeping"));
}, 14 * 60 * 1000); 

// 4️⃣ Health Check
app.get("/health", async (req, res) => {
  const dbHealth = await checkDatabaseHealth();
  res.json({ success: dbHealth.healthy, time: new Date().toISOString() });
});

// 5️⃣ API Routes
app.use("/api/webhooks", webhookRoutes); 
app.use("/api/auth", authRoutes);
app.use("/api/projects", projectRoutes);
app.use("/api/donations", donationRoutes); // Payment processing happens here
app.use("/api/admin", adminRoutes);
app.use("/api/donors", donorRoutes);
app.use("/api/media", mediaRoutes);
app.use("/api/nisab", nisabRoutes);
app.use("/api/content", contentRoutes);
app.use("/api/blogs", blogRoutes);
app.use("/api/events", eventRoutes);
app.use("/api/testimonials", testimonialRoutes);
app.use("/api/about-us", aboutusRoutes);

// 6️⃣ Global Error Handler
app.use((err, req, res, next) => {
  res.status(err.status || 500).json({ success: false, message: err.message });
});

// 7️⃣ FAST STARTUP: Don't block the server for the DB
const PORT = process.env.PORT || 5000;

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server instant-ready on port ${PORT}`);
  
  // Connect to DB in background so Render health-check passes instantly
  initDatabase()
    .then(() => console.log("✅ Database linked and ready"))
    .catch(err => {
      console.error("❌ DB background connection failed:", err.message);
    });
});