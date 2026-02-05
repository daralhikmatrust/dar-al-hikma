// 1️⃣ Load environment variables FIRST (ESM-safe)
import "dotenv/config";

// 2️⃣ Core imports
import express from "express";
import cors from "cors";

// 3️⃣ Database (ONLY ONE SOURCE)
import { initDatabase, checkDatabaseHealth } from "./utils/db.js";

// 4️⃣ Routes
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

// 6️⃣ Middlewares
app.use(cors({
  origin: true, // allow frontend origin (safe for dev)
  credentials: true,
}));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// 7️⃣ Health check (VERY IMPORTANT)

app.get("/health", async (req, res) => {
  const dbHealth = await checkDatabaseHealth();
  res.json({
    success: dbHealth.healthy,
    message: dbHealth.healthy ? "Server and database are healthy" : "Server is running but database connection failed",
    database: dbHealth,
    time: new Date().toISOString(),
  });
});

// 8️⃣ API Routes
app.use("/api/auth", authRoutes);
app.use("/api/projects", projectRoutes);
app.use("/api/donations", donationRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/donors", donorRoutes);
app.use("/api/media", mediaRoutes);
app.use("/api/nisab", nisabRoutes);
app.use("/api/content", contentRoutes);
app.use("/api/webhooks", webhookRoutes);
app.use("/api/blogs", blogRoutes);
app.use("/api/events", eventRoutes);
app.use("/api/testimonials", testimonialRoutes);
app.use("/api/about-us", aboutusRoutes);

// 9️⃣ Global error handler (prevents crashes)
app.use((err, req, res, next) => {
  console.error("❌ Global Error:", {
    message: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    code: err.code,
    name: err.name
  });

  // Database connection errors
  if (err.code === 'ECONNREFUSED' || err.code === 'ETIMEDOUT') {
    return res.status(503).json({
      success: false,
      message: "Database connection failed. Please check your database configuration.",
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }

  // Table doesn't exist
  if (err.code === '42P01') {
    return res.status(503).json({
      success: false,
      message: "Database table does not exist. Please run migrations to initialize the database.",
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }

  // Syntax errors in SQL
  if (err.code === '42601' || err.code === '42883') {
    return res.status(500).json({
      success: false,
      message: "Database query error. Please check the server logs.",
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }

  // Default error response
  res.status(err.status || 500).json({
    success: false,
    message: err.message || "Internal Server Error",
    ...(process.env.NODE_ENV === 'development' && {
      error: err.message,
      stack: err.stack,
      code: err.code
    })
  });
});

// 🔟 Start server ONLY after DB is ready
const PORT = process.env.PORT || 5000;

(async () => {
  try {
    await initDatabase(); // 🔥 connects to Supabase PostgreSQL
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error("❌ Server failed to start:", error.message);
    process.exit(1);
  }
})();
