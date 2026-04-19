const jwt = require('jsonwebtoken');
require('dotenv').config();

const auth = (req, res, next) => {
  const token = req.headers['authorization']?.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'No token provided' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Invalid token' });
  }
};

const checkRole = (role) => (req, res, next) => {
  if (req.user.role !== role) {
    console.error(`[AUTH] Role check failed: user has role '${req.user.role}', but '${role}' is required`);
    return res.status(403).json({ 
      message: `You must have '${role}' role to perform this action. Your current role is '${req.user.role}'. Please log out and log back in if you were recently promoted.` 
    });
  }
  next();
};

module.exports = { auth, checkRole };