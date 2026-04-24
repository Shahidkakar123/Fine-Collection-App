const express = require("express");
const router = express.Router();
const User = require("../models/User");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const { auth, checkRole } = require("../middleware/auth");
const { sendEmail } = require("../utils/email");

require("dotenv").config({ path: require('path').join(__dirname, '../.env') });
// REGISTER - Create new employee account
router.post("/register", 
  async (req, res) => {
  const { username, email, password, phone } = req.body;
  
  if (!username || !email || !password) {
    return res.status(400).json({ message: "Username, email, and password are required" });
  }

  if (username.length < 3) {
    return res.status(400).json({ message: "Username must be at least 3 characters" });
  }

  if (!email.includes('@')) {
    return res.status(400).json({ message: "Please provide a valid email address" });
  }

  if (password.length < 6) {
    return res.status(400).json({ message: "Password must be at least 6 characters" });
  }

  try {
    const existingUser = await User.findOne({ $or: [{ username }, { email }] });
    if (existingUser) {
      if (existingUser.username === username) {
        return res.status(400).json({ message: "Username already exists" });
      }
      return res.status(400).json({ message: "Email already registered" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ 
      username, 
      email,
      phone, // Optional phone for future SMS service
      password: hashedPassword, 
      role: "employee",
      isActive: true  // Explicitly set new users as active
    });
    
    await user.save();
    res.status(201).json({ 
      message: "✓ User registered successfully as employee",
      userId: user._id
    });
  } catch (err) {
    res.status(500).json({ message: "Error registering user: " + err.message });
  }
});

// LOGIN - Authenticate user and return JWT
router.post("/login", async (req, res) => {
  const { username, password } = req.body;
  
  if (!username || !password) {
    return res.status(400).json({ message: "Username and password are required" });
  }

  try {
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Check if user account is active
    if (!user.isActive) {
      return res.status(403).json({ message: "Your account has been deactivated. Please contact your administrator." });
    }

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const token = jwt.sign(
      { id: user._id, role: user.role }, 
      process.env.JWT_SECRET, 
      { expiresIn: "8h" }
    );

    res.json({ 
      token,
      user: {
        id: user._id,
        username: user.username,
        role: user.role
      }
    });
  } catch (err) {
    res.status(500).json({ message: "Error logging in: " + err.message });
  }
});

// REFRESH TOKEN - Get a fresh token with current role from database (call after role changes)
router.post("/refresh-token", auth, async (req, res) => {
  try {
    // Get the current user from the database to get their latest role
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (!user.isActive) {
      return res.status(403).json({ message: "Your account has been deactivated" });
    }

    // Create a new token with the current role from the database
    const newToken = jwt.sign(
      { id: user._id, role: user.role }, 
      process.env.JWT_SECRET, 
      { expiresIn: "8h" }
    );

    res.json({ 
      token: newToken,
      user: {
        id: user._id,
        username: user.username,
        role: user.role
      }
    });
  } catch (err) {
    res.status(500).json({ message: "Error refreshing token: " + err.message });
  }
});

// GET all users - PD only, for employee selection when creating fines
router.get("/", [auth, checkRole("pd")], async (req, res) => {
  try {
    const users = await User.find({}, { username: 1, email: 1, role: 1, _id: 1, isActive: 1 });
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: "Error fetching users: " + err.message });
  }
});

// GET user by username - PD only
router.get("/search/:username", [auth, checkRole("pd")], async (req, res) => {
  const { username } = req.params;
  
  try {
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    
    res.json({ 
      id: user._id,
      username: user.username,
      role: user.role
    });
  } catch (err) {
    res.status(500).json({ message: "Error searching user: " + err.message });
  }
});

// PROMOTE USER - PD only, promote employee to PD
router.put("/promote/:username", [auth, checkRole("pd")], async (req, res) => {
  const { username } = req.params;
  
  // Validate input
  if (!username || typeof username !== 'string') {
    return res.status(400).json({ message: "Username is required and must be a valid string" });
  }

  if (username.trim().length === 0) {
    return res.status(400).json({ message: "Username cannot be empty" });
  }
  
  try {
    const user = await User.findOne({ username: username.trim() });
    if (!user) {
      return res.status(404).json({ 
        message: `User "${username}" does not exist in the system. Please check the username and try again.` 
      });
    }

    if (user.role === "pd") {
      return res.status(400).json({ message: `User "${username}" is already a Project Director` });
    }

    user.role = "pd";
    await user.save();
    
    res.json({ 
      message: `✓ User "${username}" has been successfully promoted to Project Director`,
      user: {
        id: user._id,
        username: user.username,
        role: user.role
      }
    });
  } catch (err) {
    console.error('Error in promote user endpoint:', err);
    res.status(500).json({ message: "Failed to promote user. Please try again later." });
  }
});

// DEMOTE USER - PD only, demote PD back to employee
router.put("/demote/:username", [auth, checkRole("pd")], async (req, res) => {
  const { username } = req.params;
  
  console.log('[DEMOTE] Attempting to demote user:', username);
  console.log('[DEMOTE] Requester role:', req.user.role);
  
  // Validate input
  if (!username || typeof username !== 'string') {
    console.log('[DEMOTE] Invalid username format');
    return res.status(400).json({ message: "Username is required and must be a valid string" });
  }

  if (username.trim().length === 0) {
    console.log('[DEMOTE] Username is empty');
    return res.status(400).json({ message: "Username cannot be empty" });
  }
  
  try {
    console.log('[DEMOTE] Searching for user:', username.trim());
    const user = await User.findOne({ username: username.trim() });
    
    if (!user) {
      console.log('[DEMOTE] User not found:', username);
      return res.status(404).json({ 
        message: `User "${username}" does not exist in the system. Please check the username and try again.` 
      });
    }

    console.log('[DEMOTE] User found. Current role:', user.role);
    
    if (user.role === "employee") {
      console.log('[DEMOTE] User is already employee');
      return res.status(400).json({ message: `User "${username}" is already an employee` });
    }

    user.role = "employee";
    await user.save();
    
    console.log('[DEMOTE] Successfully demoted user to employee');
    res.json({ 
      message: `✓ User "${username}" has been successfully demoted to Employee`,
      user: {
        id: user._id,
        username: user.username,
        role: user.role
      }
    });
  } catch (err) {
    console.error('[DEMOTE] Error in demote user endpoint:', err);
    res.status(500).json({ message: "Failed to demote user. Please try again later." });
  }
});

// FORGOT PASSWORD - Generate reset token and send email
router.post("/forgot-password", async (req, res) => {
  const { email } = req.body;
  
  if (!email) {
    return res.status(400).json({ message: "Email is required" });
  }

  try {
    const user = await User.findOne({ email });
    if (!user) {
      // Don't reveal if email exists or not (security best practice)
      return res.json({ message: "✓ If email exists, a reset link has been sent" });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenHash = crypto.createHash('sha256').update(resetToken).digest('hex');
    
    // Set token expiry to 15 minutes from now
    const expiryTime = Date.now() + (15 * 60 * 1000);
    
    user.resetPasswordToken = resetTokenHash;
    user.resetPasswordExpiry = expiryTime;
    await user.save();

    // Send reset email
    const resetLink = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password/${resetToken}`;
    
    const emailSubject = 'Password Reset Request - FineMate';
    const emailBody = `
      <h2>Password Reset Request</h2>
      <p>Hello ${user.username},</p>
      <p>You requested to reset your password. Click the link below to proceed:</p>
      <p><a href="${resetLink}" style="background-color: #0066cc; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px; display: inline-block;">Reset Password</a></p>
      <p>This link will expire in 15 minutes.</p>
      <p>If you didn't request this, please ignore this email.</p>
      <p>Best regards,<br>FineMate</p>
    `;
    
    await sendEmail(user.email, emailSubject, emailBody);
    
    res.json({ message: "✓ If email exists, a reset link has been sent" });
  } catch (err) {
    res.status(500).json({ message: "Error processing forgot password: " + err.message });
  }
});

// RESET PASSWORD - Verify token and reset password
router.post("/reset-password", async (req, res) => {
  const { token, newPassword } = req.body;
  
  if (!token || !newPassword) {
    return res.status(400).json({ message: "Token and new password are required" });
  }

  if (newPassword.length < 6) {
    return res.status(400).json({ message: "Password must be at least 6 characters" });
  }

  try {
    // Hash the token to compare with stored hash
    const resetTokenHash = crypto.createHash('sha256').update(token).digest('hex');
    
    const user = await User.findOne({
      resetPasswordToken: resetTokenHash,
      resetPasswordExpiry: { $gt: Date.now() } // Check if token not expired
    });

    if (!user) {
      return res.status(400).json({ message: "Invalid or expired reset token" });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    // Update password and clear reset token
    user.password = hashedPassword;
    user.resetPasswordToken = null;
    user.resetPasswordExpiry = null;
    await user.save();

    // Send confirmation email
    const emailSubject = 'Password Reset Successful - FineMate';
    const emailBody = `
      <h2>Password Reset Successful</h2>
      <p>Hello ${user.username},</p>
      <p>Your password has been successfully reset.</p>
      <p>You can now login with your new password.</p>
      <p>If you didn't make this change, please contact support immediately.</p>
      <p>Best regards,<br>FineMate</p>
    `;
    
    await sendEmail(user.email, emailSubject, emailBody);
    
    res.json({ message: "✓ Password reset successfully. You can now login." });
  } catch (err) {
    res.status(500).json({ message: "Error resetting password: " + err.message });
  }
});

// DELETE EMPLOYEE - PD only, deactivate employee account
router.delete("/:id", [auth, checkRole("pd")], async (req, res) => {
  const { id } = req.params;
  
  try {
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.role === "pd") {
      return res.status(400).json({ message: "Cannot remove another PD. Only deactivate manually." });
    }

    if (!user.isActive) {
      return res.status(400).json({ message: "This employee is already deactivated" });
    }

    // Get user info before deactivation
    const username = user.username;
    const userEmail = user.email;

    // Soft delete - mark as inactive instead of hard delete
    user.isActive = false;
    await user.save();

    // Send notification email to employee
    const emailSubject = 'Account Deactivation Notice - FineMate';
    const emailBody = `
      <h2>Account Deactivation</h2>
      <p>Hello ${username},</p>
      <p>Your account in the FineMate has been deactivated as you are no longer registered as an employee.</p>
      <p>If you believe this is an error, please contact your administrator.</p>
      <p>Best regards,<br>FineMate</p>
    `;
    
    try {
      await sendEmail(userEmail, emailSubject, emailBody);
    } catch (emailErr) {
      console.warn('⚠️ Deactivation notification email not sent:', emailErr.message);
    }

    res.json({ message: `✓ Employee "${username}" has been deactivated successfully` });
  } catch (err) {
    res.status(500).json({ message: "Error deactivating user: " + err.message });
  }
});

// REACTIVATE EMPLOYEE - PD only, reactivate deactivated employee
router.put("/reactivate/:id", [auth, checkRole("pd")], async (req, res) => {
  const { id } = req.params;
  
  try {
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.isActive) {
      return res.status(400).json({ message: "This employee is already active" });
    }

    // Get user info before reactivation
    const username = user.username;
    const userEmail = user.email;

    // Mark as active
    user.isActive = true;
    await user.save();

    // Send notification email to employee
    const emailSubject = 'Account Reactivation Notice - FineMate';
    const emailBody = `
      <h2>Account Reactivation</h2>
      <p>Hello ${username},</p>
      <p>Your account in the FineMate has been reactivated.</p>
      <p>You can now login with your credentials.</p>
      <p>If you have any questions, please contact your administrator.</p>
      <p>Best regards,<br>FineMate</p>
    `;
    
    try {
      await sendEmail(userEmail, emailSubject, emailBody);
    } catch (emailErr) {
      console.warn('⚠️ Reactivation notification email not sent:', emailErr.message);
    }

    res.json({ message: `✓ Employee "${username}" has been reactivated successfully` });
  } catch (err) {
    res.status(500).json({ message: "Error reactivating user: " + err.message });
  }
});

// PERMANENTLY DELETE EMPLOYEE - PD only, delete from database and all their fines
router.delete("/permanent/:id", [auth, checkRole("pd")], async (req, res) => {
  const { id } = req.params;
  
  try {
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.role === "pd") {
      return res.status(400).json({ message: "Cannot delete a PD account" });
    }

    const username = user.username;
    
    // Delete all fines associated with this user
    const Item = require('../models/Item');
    const deleteResult = await Item.deleteMany({ userId: id });
    console.log(`[DELETE] Removed ${deleteResult.deletedCount} fines for user ${username}`);
    
    // Permanently delete the user
    await User.findByIdAndDelete(id);

    res.json({ message: `✓ Employee "${username}" and all associated fines have been permanently deleted from the system` });
  } catch (err) {
    res.status(500).json({ message: "Error permanently deleting user: " + err.message });
  }
});

// GET ACTIVE EMPLOYEES - PD only, returns list of active non-PD users
router.get("/active/list", [auth, checkRole("pd")], async (req, res) => {
  try {
    const activeEmployees = await User.find(
      { isActive: true, role: { $ne: 'pd' } },  // Active users who are not PD
      { username: 1, email: 1, _id: 1, role: 1 }
    );
    res.json(activeEmployees);
  } catch (err) {
    res.status(500).json({ message: "Error fetching active employees: " + err.message });
  }
});

module.exports = router;
