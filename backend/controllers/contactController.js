const nodemailer = require('nodemailer');

const handleContactInquiry = async (req, res) => {
  const { name, email, subject, message } = req.body;

  // 1. Create a transporter (The "Mail Office")
  const transporter = nodemailer.createTransport({
    service: 'gmail', // You can use 'gmail', 'outlook', or SMTP details
    auth: {
      user: process.env.EMAIL_USER, // Your organization email
      pass: process.env.EMAIL_PASS, // Your App Password (not your login password)
    },
  });

  // 2. Configure the email content
  const mailOptions = {
    from: `"${name}" <${email}>`, // Shows the user's name/email as the sender
    to: 'info@daralhikma.org',    // Where you want to receive the inquiries
    subject: `New Inquiry: ${subject}`,
    html: `
      <div style="font-family: sans-serif; padding: 20px; border: 1px solid #e2e8f0; border-radius: 10px;">
        <h2 style="color: #0f172a;">New Message from Dar Al Hikma</h2>
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Subject:</strong> ${subject}</p>
        <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
        <p style="color: #475569; line-height: 1.6;">${message}</p>
      </div>
    `,
  };

  try {
    // 3. Send the email
    await transporter.sendMail(mailOptions);
    res.status(200).json({ success: true, message: 'Email sent successfully!' });
  } catch (error) {
    console.error('Nodemailer Error:', error);
    res.status(500).json({ success: false, message: 'Failed to send email.' });
  }
};