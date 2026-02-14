const express = require('express');
const router = express.Router(); // 👈 Use Router, not app
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// Use router.post and a relative path '/' 
// (assuming you'll mount this at /api/contact in server.js)
router.post('/', async (req, res) => {
  const { name, email, subject, message } = req.body;

  const mailOptions = {
    from: `"Dar Al Hikma Inquiry" <${process.env.EMAIL_USER}>`, // 👈 Fixed
    to: process.env.OWNER_EMAIL,
    replyTo: email, 
    subject: `New Inquiry: ${subject}`,
    html: `
      <div style="font-family: sans-serif; padding: 20px; border: 1px solid #eee;">
        <h2 style="color: #2563eb;">New Contact Form Submission</h2>
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Subject:</strong> ${subject}</p>
        <hr />
        <p><strong>Message:</strong></p>
        <p style="white-space: pre-wrap;">${message}</p>
      </div>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    res.status(200).json({ success: true, message: 'Email sent successfully!' });
  } catch (error) {
    console.error('Detailed Mail Error:', error.message); // 👈 Critical for debugging
    res.status(500).json({ success: false, message: 'Failed to send email.' });
  }
});

module.exports = router; // 👈 Must export for server.js to use it