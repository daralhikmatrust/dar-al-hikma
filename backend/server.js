// 1️⃣ Load environment variables FIRST
import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";

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
  'https://daralhikma.org.in',
  'https://www.daralhikma.org.in', // Include www if applicable
  'http://localhost:5173',
  "https://dar-al-hikma.vercel.app",
  "http://localhost:5173",
  "http://localhost:5174", // ✅ Added 5174 (your current Vite port)
];

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl)
    if (!origin) return callback(null, true);
    
    const isVercelPreview = /^https:\/\/dar-al-hikma-.*\.vercel\.app$/.test(origin);
    
    if (allowedOrigins.indexOf(origin) !== -1 || isVercelPreview) {
      callback(null, true);
    } else {
      console.log("CORS Blocked for origin:", origin);
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));

// 5️⃣ Security & Body Parsing
app.use(helmet({ crossOriginResourcePolicy: false }));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// 6️⃣ STATIC SITEMAP
app.get("/sitemap.xml", (req, res) => {
  const BASE_URL = "https://daralhikma.org.in"; // ✅ Updated to your .org.in domain

  const staticPages = [
    "", "/about-us", "/projects", "/media", "/contact", 
    "/hall-of-fame", "/donate", "/zakat-calculator", 
    "/zakat/nisab", "/blogs", "/events"
  ];

  let xml = '<?xml version="1.0" encoding="UTF-8"?>';
  xml += '\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">';
  staticPages.forEach(page => {
    xml += `\n  <url>\n    <loc>${BASE_URL}${page}</loc>\n    <priority>${page === "" ? "1.0" : "0.8"}</priority>\n  </url>`;
  });
  xml += "\n</urlset>";

  res.header("Content-Type", "application/xml");
  res.send(xml);
});

// 7️⃣ API Routes
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

// ✅ FIXED Health check: Moved inside /api to match frontend calls
app.get("/api/health", async (_, res) => {
  const dbHealth = await checkDatabaseHealth();
  res.status(dbHealth.healthy ? 200 : 503).json(dbHealth);
});

// 9️⃣ Error handler
app.use((err, req, res, next) => {
  console.error("❌ Backend Error:", err.stack);
  res.status(err.status || 500).json({ 
    success: false, 
    message: err.message || "Internal Server Error" 
  });
});

// 🔟 Server lifecycle
const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, "0.0.0.0", async () => {
  console.log(`🚀 Server running on port ${PORT}`);
  try {
    await initDatabase();
  } catch (error) {
    console.error("❌ Database failed to initialize:", error);
  }
});

// Keep Render awake
setInterval(() => {
  const url = process.env.BACKEND_URL || `http://localhost:${PORT}`;
  fetch(`${url}/api/health`).catch(() => {});
}, 13 * 60 * 1000);

process.on("SIGTERM", () => server.close(() => process.exit(0)));