// 1️⃣ Load environment variables FIRST
import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";

// 2️⃣ Database utilities & Verified Models
import { initDatabase, checkDatabaseHealth } from "./utils/db.js";
import Project from "./models/Project.model.js"; 

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
  "https://daralhikma.org",
  "https://www.daralhikma.org",
  "https://dar-al-hikma.vercel.app",
  "http://localhost:5173"
];

app.use(cors({
  origin(origin, callback) {
    if (!origin) return callback(null, true);
    const isVercelPreview = /^https:\/\/dar-al-hikma-.*\.vercel\.app$/.test(origin);
    if (allowedOrigins.includes(origin) || isVercelPreview) {
      callback(null, true);
    } else {
      callback(new Error("CORS not allowed"));
    }
  },
  credentials: true,
}));

// 5️⃣ Security & Body Parsing
app.use(helmet({ crossOriginResourcePolicy: false }));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// 6️⃣ DYNAMIC SITEMAP (FIXED: NO BLOG/EVENT REFERENCES)
app.get("/sitemap.xml", async (req, res) => {
  try {
    const BASE_URL = "https://daralhikma.org";

    // Only fetch Project because it's the only one currently in your models folder
    const projects = await Project.find({ isPublished: true }, "_id updatedAt").lean();

    const staticPages = [
      "", "/about", "/projects", "/blogs", "/events", 
      "/gallery", "/faculties", "/hall-of-fame", "/contact", 
      "/zakat-calculator", "/zakat-nisab"
    ];

    let xml = `<?xml version="1.0" encoding="UTF-8"?>`;
    xml += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`;

    // Static Pages
    staticPages.forEach(page => {
      xml += `
      <url>
        <loc>${BASE_URL}${page}</loc>
        <changefreq>${page === "" ? "daily" : "monthly"}</changefreq>
        <priority>${page === "" ? "1.0" : "0.8"}</priority>
      </url>`;
    });

    // Dynamic Projects
    if (projects && projects.length > 0) {
      projects.forEach(p => {
        const lastMod = p.updatedAt ? new Date(p.updatedAt).toISOString().split('T')[0] : new Date().toISOString().split('T')[0];
        xml += `
        <url>
          <loc>${BASE_URL}/projects/${p._id}</loc>
          <lastmod>${lastMod}</lastmod>
          <changefreq>weekly</changefreq>
          <priority>0.7</priority>
        </url>`;
      });
    }

    xml += `</urlset>`;

    res.set("Content-Type", "application/xml");
    res.status(200).send(xml);

  } catch (err) {
    console.error("❌ Sitemap error:", err.message);
    res.status(500).send("Error generating sitemap");
  }
});

// 7️⃣ Health check
app.get("/health", async (_, res) => {
  const dbHealth = await checkDatabaseHealth();
  res.status(dbHealth.healthy ? 200 : 503).json(dbHealth);
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

// 9️⃣ Error handler
app.use((err, req, res, next) => {
  res.status(err.status || 500).json({ success: false, message: err.message || "Internal Server Error" });
});

// 🔟 Server lifecycle
const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, "0.0.0.0", async () => {
  console.log(`🚀 Server running on port ${PORT}`);
  await initDatabase();
});

// Keep Render awake
setInterval(() => {
  fetch("https://dar-al-hikma-backend.onrender.com/health").catch(() => {});
}, 13 * 60 * 1000);

process.on("SIGTERM", () => server.close(() => process.exit(0)));