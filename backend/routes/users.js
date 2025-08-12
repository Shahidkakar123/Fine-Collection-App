const express = require('express');
const router = express.Router();
const User = require('../models/User');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { auth, checkRole } = require('../middleware/auth');
require('dotenv').config();

router.post('/register', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ message: 'Username and password are required' });
  }
  const existingUser = await User.findOne({ username });
  if (existingUser) {
    return res.status(400).json({ message: 'Username already exists' });
  }
  const hashedPassword = await bcrypt.hash(password, 10);
  const user = new User({ username, password: hashedPassword, role: 'employee' });
  await user.save();
  res.status(201).json({ message: 'User registered as employee' });
});

router.post('/login', async (req, res) => { // Updated to /api/users/login
  const { username, password } = req.body;
  const user = await User.findOne({ username });
  if (!user || !await bcrypt.compare(password, user.password)) {
    return res.status(401).json({ message: 'Invalid credentials' });
  }
  const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '1h' });
  res.json({ token });
});

router.put('/promote/:username', [auth, checkRole('pd')], async (req, res) => {
  const { username } = req.params;
  const user = await User.findOne({ username });
  if (!user) return res.status(404).json({ message: 'User not found' });
  if (user.role === 'pd') return res.status(400).json({ message: 'User is already a PD' });
  user.role = 'pd';
  await user.save();
  res.json({ message: `User ${username} promoted to PD` });
});

module.exports = router;