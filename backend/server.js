// 1️⃣ Load environment variables FIRST
import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import nodemailer from "nodemailer";

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
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));

// 5️⃣ Security & Body Parsing
// Adjusted Helmet to be less restrictive for cross-domain API calls
app.use(helmet({ 
  crossOriginResourcePolicy: { policy: "cross-origin" },
  contentSecurityPolicy: false // Disable if you face issues with external assets
}));
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

// 8️⃣ UPDATED: Contact Form Route (Inside /api block)
function escapeHtml(str) {
  if (str == null || typeof str !== "string") return "";
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

app.post("/api/contact", async (req, res) => {
  try {
    const emailUser = process.env.EMAIL_USER || "";
    const ownerEmail = process.env.OWNER_EMAIL || "";
    const emailPass = (process.env.EMAIL_PASS || "").replace(/\s/g, "");

    if (!emailUser || !ownerEmail || !emailPass) {
      console.warn("⚠️ Contact: EMAIL_USER, OWNER_EMAIL, or EMAIL_PASS not configured in env.");
      return res.status(503).json({
        success: false,
        message: "Contact form is temporarily unavailable. Please try again later or email us directly.",
      });
    }

    const { name, email, subject, message } = req.body || {};
    const sName = String(name || "").trim();
    const sEmail = String(email || "").trim();
    const sSubject = String(subject || "").trim();
    const sMessage = String(message || "").trim();

    if (!sName || !sEmail || !sMessage) {
      return res.status(400).json({ success: false, message: "Name, email and message are required." });
    }

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: { user: emailUser, pass: emailPass },
    });

    const n = escapeHtml(sName);
    const e = escapeHtml(sEmail);
    const subj = escapeHtml(sSubject || "New Message");
    const msg = escapeHtml(sMessage).replace(/\n/g, "<br>");

    const mailOptions = {
      from: `"${n}" <${emailUser}>`,
      to: ownerEmail,
      replyTo: sEmail,
      subject: `[Dar Al Hikma Inquiry] ${sSubject || "New Message"}`,
      html: `
        <div style="font-family: sans-serif; border: 1px solid #e2e8f0; padding: 25px; border-radius: 15px; max-width: 600px;">
          <h2 style="color: #2563eb; margin-top: 0;">New Contact Form Entry</h2>
          <p><strong>Name:</strong> ${n}</p>
          <p><strong>Email:</strong> ${e}</p>
          <p><strong>Subject:</strong> ${subj}</p>
          <div style="background: #f8fafc; padding: 15px; border-radius: 10px; border-left: 4px solid #2563eb; margin: 20px 0;">
            <p style="white-space: pre-wrap; color: #334155; margin: 0;">${msg}</p>
          </div>
          <p style="font-size: 11px; color: #94a3b8; margin-bottom: 0;">Sent via daralhikma.org.in official portal.</p>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
    return res.status(200).json({ success: true, message: "Enquiry sent successfully!" });
  } catch (err) {
    console.error("❌ Mail Error:", err);
    const msg =
      err.message && (err.message.includes("Invalid login") || err.message.includes("authentication"))
        ? "Email service configuration error. Please contact support."
        : "Failed to send message. Please try again later.";
    return res.status(500).json({ success: false, message: msg });
  }
});

// 9️⃣ Health check
app.get("/api/health", async (_, res) => {
  const dbHealth = await checkDatabaseHealth();
  res.status(dbHealth.healthy ? 200 : 503).json(dbHealth);
});

// 🔟 Global Error handler (Ensures CORS headers are kept even on errors)
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