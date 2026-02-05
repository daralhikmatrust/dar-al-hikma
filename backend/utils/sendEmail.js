import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

export const sendEmail = async (options) => {
  try {
    const mailOptions = {
      from: process.env.EMAIL_FROM,
      to: options.email,
      subject: options.subject,
      html: options.html,
      ...(options.attachments && { attachments: options.attachments })
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent:', info.messageId);
    return info;
  } catch (error) {
    console.error('Email error:', error);
    throw error;
  }
};

export const sendDonationReceiptEmail = async (donation, receiptBuffer) => {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #1a472a 0%, #2d5a3d 100%); color: #d4af37; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
        .amount { font-size: 32px; color: #1a472a; font-weight: bold; margin: 20px 0; }
        .details { background: white; padding: 20px; border-radius: 5px; margin: 20px 0; }
        .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Dar Al Hikma Trust</h1>
          <p>Thank you for your generous contribution</p>
        </div>
        <div class="content">
          <p>Dear ${donation.donorName},</p>
          <p>We are deeply grateful for your generous donation of <span class="amount">${donation.currency} ${donation.amount.toLocaleString()}</span> towards ${donation.donationType}.</p>
          <div class="details">
            <p><strong>Receipt Number:</strong> ${donation.receiptNumber}</p>
            <p><strong>Date:</strong> ${new Date(donation.createdAt).toLocaleDateString()}</p>
            <p><strong>Payment Method:</strong> ${donation.paymentMethod}</p>
            ${donation.project ? `<p><strong>Project:</strong> ${donation.project.title}</p>` : ''}
            ${donation.faculty ? `<p><strong>Faculty:</strong> ${donation.faculty}</p>` : ''}
          </div>
          <p>Your contribution helps us continue our mission of serving the community through education, healthcare, and welfare programs.</p>
          <p>May Allah accept your donation and reward you abundantly.</p>
          <p>With gratitude,<br><strong>Dar Al Hikma Trust</strong></p>
        </div>
        <div class="footer">
          <p>This is an automated email. Please do not reply.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmail({
    email: donation.donorEmail,
    subject: `Donation Receipt - ${donation.receiptNumber}`,
    html,
    attachments: [
      {
        filename: `receipt-${donation.receiptNumber}.pdf`,
        content: receiptBuffer
      }
    ]
  });
};

