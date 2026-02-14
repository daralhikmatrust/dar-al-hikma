const nodemailer = require('nodemailer');

const handleContactInquiry = async (req, res) => {
  const { name, email, subject, message } = req.body;

  // 1. Check if Env Variables exist (Prevents crashing if Render is misconfigured)
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.error("Missing Email Environment Variables");
    return res.status(500).json({ success: false, message: "Server configuration error." });
  }

  // 2. Transporter
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS, // Ensure no spaces in the 16-digit code
    },
  });

  // 3. Mail Options - Gmail friendly version
  const mailOptions = {
    from: `"Dar Al Hikma Portal" <${process.env.EMAIL_USER}>`, // MUST be your email
    to: process.env.OWNER_EMAIL || 'info@daralhikma.org', 
    replyTo: email, // 👈 Clicking 'Reply' in your inbox will now go to the USER
    subject: `Contact Form: ${subject}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; border: 1px solid #eee; padding: 20px;">
        <h2 style="color: #2563eb;">New Message from ${name}</h2>
        <p><strong>User Email:</strong> ${email}</p>
        <p><strong>Subject:</strong> ${subject}</p>
        <hr />
        <p style="white-space: pre-wrap;">${message}</p>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    res.status(200).json({ success: true, message: 'Message sent!' });
  } catch (error) {
    // This will now show you EXACTLY why it failed in Render logs
    console.error('Nodemailer Error:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
};