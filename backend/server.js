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
    // Allow requests with no origin (like mobile apps or curl)
    if (!origin) return callback(null, true);
    
    const isVercelPreview = /^https:\/\/dar-al-hikma-.*\.vercel\.app$/.test(origin);
    const isAllowed = allowedOrigins.includes(origin) || isVercelPreview;
    
    if (isAllowed) {
      callback(null, true);
    } else {
      console.warn(`🛑 CORS Blocked: ${origin}`);
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));

// 5️⃣ Security & Body Parsing
app.use(helmet({ 
  crossOriginResourcePolicy: { policy: "cross-origin" },
  crossOriginEmbedderPolicy: false,
  contentSecurityPolicy: false 
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

// 8️⃣ UPDATED: Contact Form & Nodemailer Configuration
const emailUser = process.env.EMAIL_USER;
const emailPass = process.env.EMAIL_PASS?.replace(/\s/g, ""); // Sanitize App Password
const ownerEmail = process.env.OWNER_EMAIL;

// Initialize Transporter Once
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: emailUser,
    pass: emailPass,
  },
});

// Verify SMTP connection on startup
if (emailUser && emailPass) {
  transporter.verify((error) => {
    if (error) console.error("❌ SMTP Verification Error:", error.message);
    else console.log("📧 Mail Server Ready to send emails");
  });
}

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
    if (!emailUser || !ownerEmail || !emailPass) {
      throw new Error("Email credentials missing in environment variables");
    }

    const { name, email, subject, message } = req.body || {};
    if (!name || !email || !message) {
      return res.status(400).json({ success: false, message: "Name, email and message are required." });
    }

    const n = escapeHtml(name.trim());
    const e = escapeHtml(email.trim());
    const subj = escapeHtml(subject?.trim() || "New Message");
    const msg = escapeHtml(message.trim()).replace(/\n/g, "<br>");

    const mailOptions = {
      from: `"Dar Al Hikma Portal" <${emailUser}>`,
      to: ownerEmail,
      replyTo: email.trim(),
      subject: `[Inquiry] ${subject || "New Message"}`,
      html: `
        <div style="font-family: sans-serif; border: 1px solid #e2e8f0; padding: 25px; border-radius: 15px; max-width: 600px;">
          <h2 style="color: #2563eb; margin-top: 0;">New Contact Form Submission</h2>
          <p><strong>Name:</strong> ${n}</p>
          <p><strong>Email:</strong> ${e}</p>
          <p><strong>Subject:</strong> ${subj}</p>
          <div style="background: #f8fafc; padding: 15px; border-radius: 10px; border-left: 4px solid #2563eb; margin: 20px 0;">
            <p style="color: #334155; margin: 0;">${msg}</p>
          </div>
          <p style="font-size: 11px; color: #94a3b8; margin-bottom: 0;">Sent via daralhikma.org.in</p>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
    return res.status(200).json({ success: true, message: "Enquiry sent successfully!" });
  } catch (err) {
    console.error("❌ Mail Error:", err.message);
    return res.status(500).json({ 
      success: false, 
      message: "Failed to send message. Please try again later.",
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
});

// 9️⃣ Health check
app.get("/api/health", async (_, res) => {
  const dbHealth = await checkDatabaseHealth();
  res.status(dbHealth.healthy ? 200 : 503).json(dbHealth);
});

// 🔟 Global Error handler
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

// Improved Keep-Alive: Ping internal address to avoid DNS/CORS overhead
setInterval(() => {
  fetch(`http://127.0.0.1:${PORT}/api/health`).catch(() => {});
}, 10 * 60 * 1000); 

process.on("SIGTERM", () => server.close(() => process.exit(0)));