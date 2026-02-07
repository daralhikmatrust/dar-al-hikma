// 1️⃣ Load environment variables FIRST
import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";

// 2️⃣ Database utilities & ALL Content Models
import { initDatabase, checkDatabaseHealth } from "./utils/db.js";
import Project from "./models/Project.js"; 
import Blog from "./models/Blog.js";       
import Event from "./models/Event.js"; // 🔥 Added
// Note: If you have a separate Faculty model, import it here too.

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
  'https://www.daralhikma.org',      
  'https://daralhikma.org',          
  'https://dar-al-hikma.vercel.app', 
  'http://localhost:5173'            
];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
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
app.use(helmet({ crossOriginResourcePolicy: false })); 
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// 6️⃣ FULL DYNAMIC SITEMAP GENERATION
app.get("/sitemap.xml", async (req, res) => {
  try {
    const BASE_URL = "https://daralhikma.org";
    
    // Fetch all dynamic content
    const projects = await Project.find({ isPublished: true }, "_id updatedAt");
    const blogs = await Blog.find({ status: "published" }, "slug updatedAt");
    const events = await Event.find({}, "slug updatedAt"); // 🔥 Added

    const staticPages = [
      "", "/about-us", "/projects", "/faculties", "/gallery", 
      "/contact", "/hall-of-fame", "/donate", "/zakat-calculator", "/blogs", "/events"
    ];

    let xml = '<?xml version="1.0" encoding="UTF-8"?>';
    xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">';

    // Static Pages
    staticPages.forEach(page => {
      xml += `<url>
                <loc>${BASE_URL}${page}</loc>
                <changefreq>monthly</changefreq>
                <priority>${page === "" ? "1.0" : "0.8"}</priority>
              </url>`;
    });

    // Dynamic Projects
    projects.forEach(p => {
      xml += `<url>
                <loc>${BASE_URL}/projects/${p._id}</loc>
                <lastmod>${p.updatedAt.toISOString().split('T')[0]}</lastmod>
                <changefreq>weekly</changefreq>
                <priority>0.7</priority>
              </url>`;
    });

    // Dynamic Blogs
    blogs.forEach(b => {
      xml += `<url>
                <loc>${BASE_URL}/blogs/${b.slug}</loc>
                <lastmod>${b.updatedAt.toISOString().split('T')[0]}</lastmod>
                <changefreq>weekly</changefreq>
                <priority>0.6</priority>
              </url>`;
    });

    // Dynamic Events
    events.forEach(e => {
      xml += `<url>
                <loc>${BASE_URL}/events/${e.slug}</loc>
                <lastmod>${e.updatedAt.toISOString().split('T')[0]}</lastmod>
                <changefreq>daily</changefreq>
                <priority>0.7</priority>
              </url>`;
    });

    xml += "</urlset>";

    res.header("Content-Type", "application/xml");
    res.send(xml);
  } catch (error) {
    console.error("❌ Sitemap Error:", error.message);
    res.status(500).end();
  }
});

// 7️⃣ Keep-Alive & API Routes (Same as before...)
setInterval(async () => {
  try {
    const healthUrl = `https://dar-al-hikma-backend.onrender.com/health`;
    const res = await fetch(healthUrl);
    if (res.ok) console.log("☀️ Keep-alive: Server is awake");
  } catch (err) { console.error("🌙 Keep-alive failed:", err.message); }
}, 14 * 60 * 1000);

app.get("/health", async (req, res) => {
  const dbHealth = await checkDatabaseHealth();
  res.status(dbHealth.healthy ? 200 : 503).json({
    success: dbHealth.healthy, status: dbHealth.healthy ? "UP" : "DOWN", database: dbHealth, timestamp: new Date().toISOString(),
  });
});

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

app.use((err, req, res, next) => {
  const statusCode = err.status || 500;
  res.status(statusCode).json({ success: false, message: err.message || "Internal Server Error" });
});

const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server active on port ${PORT}`);
  initDatabase().then(() => console.log("✅ Database link established")).catch(error => console.error("❌ Database link failed:", error.message));
});

process.on('SIGTERM', () => { server.close(() => { process.exit(0); }); });