const nodemailer = require('nodemailer');

// 1. Configure the "Transporter" (The Sender Account)
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER, // The email you'll use to SEND the mail
    pass: process.env.EMAIL_PASS  // The 16-digit App Password
  }
});

// 2. The POST Route
app.post('/api/contact', async (req, res) => {
  const { name, email, subject, message } = req.body;

  const mailOptions = {
    from: `"${name}" <${process.env.EMAIL_USER}>`, // Best practice for Gmail
    to: process.env.OWNER_EMAIL, // Your personal email (Receiver)
    replyTo: email, // This allows you to just click 'Reply' to answer the user
    subject: `New Dar Al Hikma Inquiry: ${subject}`,
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
    console.error('Mail Error:', error);
    res.status(500).json({ success: false, message: 'Server error while sending mail.' });
  }
});