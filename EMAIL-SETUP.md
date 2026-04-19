# Email Notification Setup Guide

## 🚀 Installation

Install Nodemailer in the backend:

```bash
cd backend
npm install nodemailer
```

## 📧 Environment Variables

Update your `.env` file in the backend folder with email credentials:

```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/?retryWrites=true&w=majority
JWT_SECRET=your_secret_key
PORT=5000

# Email Configuration for Gmail
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
```

## 🔑 How to Get Gmail App Password

1. Go to [Google Account Security](https://myaccount.google.com/security)
2. Enable **2-Step Verification** (if not already enabled)
3. Go to **App passwords**
4. Select `Mail` and `Windows Computer` (or your device)
5. Google will generate a 16-character password
6. Copy this password and paste it in `EMAIL_PASSWORD` in `.env`

## 📝 Alternative Email Services

If you don't use Gmail, you can use other services:

### Outlook/Hotmail
```env
EMAIL_USER=your-email@outlook.com
EMAIL_PASSWORD=your-password
# In email.js, change service to 'outlook'
```

### Custom SMTP Server
```env
EMAIL_HOST=smtp.your-service.com
EMAIL_PORT=587
EMAIL_USER=your-email@example.com
EMAIL_PASSWORD=your-password
```

Then update `email.js`:
```javascript
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});
```

## ✅ Testing Email

When a PD creates a fine for an employee:
1. The system sends an email to the employee's registered email
2. Email includes: Fine amount, category, description, and status
3. Email has professional HTML formatting
4. If email fails, the fine is still created (email is non-blocking)

## 🔒 Security Notes

- Never commit `.env` file to version control
- Use environment variables, not hardcoded credentials
- Gmail app passwords are safer than main passwords
- Monitor email sending logs for failures

## 📊 Email Features

✅ **Professional HTML Email** - Formatted with branding
✅ **Automatic Sending** - Triggered when PD creates fine
✅ **Employee Details** - Shows fine amount, category, reason
✅ **Non-blocking** - API won't fail if email fails
✅ **Error Logging** - All email attempts are logged
✅ **Multi-recipient** - Can be extended for team emails

## 🐛 Troubleshooting

**Issue**: "Invalid login credentials"
- Solution: Verify EMAIL_USER and EMAIL_PASSWORD in .env
- For Gmail: Use app password, not main password

**Issue**: "SMTP connection error"
- Solution: Check firewall/antivirus blocking port 587
- Alternative: Use port 465 for SSL

**Issue**: Emails not received
- Solution: Check spam folder
- Verify employee email address is correct in database
- Check MongoDB to confirm email field is populated

## 📧 Email Template Example

When shahid is fined $50 for "Late", they receive:

```
Subject: ⚠️ Fine Ho Giya Apko - $50

Hello shahid,

A new fine has been assigned to you by Project Director.

┌─────────────────────────────┐
│ Category: Late              │
│ Amount: $50                 │
│ Description: Late to office │
│ Status: pending             │
└─────────────────────────────┘

Please log in to your dashboard to view more details.

Best regards,
Fine Collection System
```

## 🔄 Next Steps

1. Install nodemailer: `npm install nodemailer`
2. Add EMAIL_USER and EMAIL_PASSWORD to `.env`
3. Restart backend: `npm start`
4. Create a fine and check employee's email
5. Verify email is received with all details
