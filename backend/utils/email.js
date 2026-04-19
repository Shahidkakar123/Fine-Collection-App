let nodemailer;
try {
  nodemailer = require('nodemailer');
  console.log('✓ Nodemailer loaded successfully');
} catch (err) {
  console.error('✗ Failed to load nodemailer:', err.message);
  nodemailer = null;
}

// Create transporter with Gmail or other SMTP service
let transporter = null;

console.log('Email config - USER:', process.env.EMAIL_USER ? 'SET' : 'NOT SET');
console.log('Email config - PASSWORD:', process.env.EMAIL_PASSWORD ? 'SET' : 'NOT SET');

if (nodemailer && process.env.EMAIL_USER && process.env.EMAIL_PASSWORD) {
  try {
    // Remove spaces from password if any
    const sanitizedPassword = (process.env.EMAIL_PASSWORD || '').trim();
    
    transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER.trim(),
        pass: sanitizedPassword,
      },
    });
    console.log('✓ Email service configured successfully');
  } catch (err) {
    console.warn('⚠️  Email service configuration error:', err.message);
  }
} else {
  const missing = [];
  if (!nodemailer) missing.push('nodemailer');
  if (!process.env.EMAIL_USER) missing.push('EMAIL_USER');
  if (!process.env.EMAIL_PASSWORD) missing.push('EMAIL_PASSWORD');
  console.warn('⚠️  Email service not configured. Missing:', missing.join(', '));
}

// Send email function
const sendEmail = async (to, subject, htmlContent) => {
  // If transporter not configured, skip email
  if (!transporter || !process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
    console.warn(`⚠️  Email not sent to ${to} - Email service not configured`);
    return null;
  }

  try {
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to,
      subject,
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="UTF-8">
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: #0066cc; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
              .content { padding: 20px; background: #f9f9f9; border-radius: 0 0 8px 8px; border: 1px solid #ddd; }
              .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
              .button { display: inline-block; padding: 10px 20px; background: #0066cc; color: white; text-decoration: none; border-radius: 4px; margin: 20px 0; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>⚠️ Fine Collection System</h1>
              </div>
              <div class="content">
                ${htmlContent}
              </div>
              <div class="footer">
                <p>This is an automated message. Please do not reply to this email.</p>
                <p>&copy; 2026 Fine Collection System. All rights reserved.</p>
              </div>
            </div>
          </body>
        </html>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('✓ Email sent to:', to);
    return info;
  } catch (error) {
    console.error('✗ Error sending email to', to, ':', error.message);
    // Don't throw - let API continue even if email fails
    return null;
  }
};

module.exports = { sendEmail, transporter };

