const mongoose = require('mongoose');

let isConnected = false;

const connectDB = async () => {
  if (isConnected) {
    console.log('✓ Using existing MongoDB connection');
    return;
  }

  if (!process.env.MONGODB_URI) {
    throw new Error('MONGODB_URI environment variable is not defined');
  }

  await mongoose.connect(process.env.MONGODB_URI);
  isConnected = true;
  console.log('✓ Connected to MongoDB');
};

module.exports = connectDB;