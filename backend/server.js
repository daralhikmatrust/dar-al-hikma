// 1️⃣ Load environment variables FIRST
import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import nodemailer from "nodemailer"; // Import added

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
  'https://www.daralhikma.org.in',
  'http://localhost:5173',
  'http://localhost:5174',
  "https://dar-al-hikma.vercel.app",
];

app.use(cors({
  origin: function (origin, callback) {
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
  const BASE_URL = "https://daralhikma.org.in";
  const staticPages = ["", "/about-us", "/projects", "/media", "/contact", "/hall-of-fame", "/donate", "/zakat-calculator", "/zakat/nisab", "/blogs", "/events"];
  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">';
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

// 8️⃣ Contact Form Route (The missing part that caused 404)
app.post("/api/contact", async (req, res) => {
  const { name, email, subject, message } = req.body;

  if (!name || !email || !message) {
    return res.status(400).json({ success: false, message: "Required fields missing" });
  }

  // Setup Transporter
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS, // 16-digit App Password without spaces
    },
  });

  const mailOptions = {
    from: `"${name}" <${process.env.EMAIL_USER}>`,
    to: process.env.OWNER_EMAIL,
    replyTo: email,
    subject: `[Contact Form] ${subject}`,
    html: `
      <div style="font-family: sans-serif; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px; max-width: 600px;">
        <h2 style="color: #2563eb; border-bottom: 1px solid #e2e8f0; padding-bottom: 10px;">New Website Inquiry</h2>
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Subject:</strong> ${subject}</p>
        <div style="background: #f8fafc; padding: 15px; border-radius: 8px; margin-top: 15px; border-left: 4px solid #2563eb;">
          <p style="white-space: pre-wrap; margin: 0; color: #334155;">${message}</p>
        </div>
        <p style="font-size: 12px; color: #94a3b8; margin-top: 20px;">This email was sent from the Dar Al Hikma Trust contact form.</p>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    res.status(200).json({ success: true, message: "Message sent successfully" });
  } catch (error) {
    console.error("❌ Nodemailer Error:", error);
    res.status(500).json({ success: false, message: "Failed to send email" });
  }
});

// 9️⃣ Health check
app.get("/api/health", async (_, res) => {
  const dbHealth = await checkDatabaseHealth();
  res.status(dbHealth.healthy ? 200 : 503).json(dbHealth);
});

// 🔟 Error handler
app.use((err, req, res, next) => {
  console.error("❌ Backend Error:", err.stack);
  res.status(err.status || 500).json({ 
    success: false, 
    message: err.message || "Internal Server Error" 
  });
});

// 1️⃣1️⃣ Server lifecycle
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