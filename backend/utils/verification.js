const crypto = require('crypto');
const User = require('../models/User');

async function verifyEmailToken(token) {
  if (!token) {
    return { success: false, message: 'Verification token is required.' };
  }

  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
  let user = await User.findOne({
    emailVerificationToken: tokenHash,
    emailVerificationExpiry: { $gt: Date.now() },
  });

  // Fallback for legacy tokens stored without hashing
  if (!user) {
    user = await User.findOne({
      emailVerificationToken: token,
      emailVerificationExpiry: { $gt: Date.now() },
    });

    if (user) {
      user.emailVerificationToken = tokenHash;
      await user.save();
    }
  }

  if (!user) {
    return { success: false, message: 'Invalid or expired verification link.' };
  }

  if (user.emailVerified) {
    return { success: true, message: 'Email already verified. You can now log in.', alreadyVerified: true };
  }

  user.emailVerified = true;
  user.emailVerificationToken = null;
  user.emailVerificationExpiry = null;
  await user.save();

  return { success: true, message: 'Email verified successfully. You can now log in.' };
}

module.exports = { verifyEmailToken };
