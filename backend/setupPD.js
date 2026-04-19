/**
 * Setup script to create a new PD user in the database
 * Run with: node setupPD.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const User = require('./models/User');

const PD_USERNAME = 'PD';
const PD_PASSWORD = 'admin';
const PD_EMAIL = 'pd@finecollection.local';

async function setupPDUser() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI, { useNewUrlParser: true });
    console.log('✓ Connected to MongoDB');

    // Check if PD user already exists
    const existingPD = await User.findOne({ username: PD_USERNAME });
    if (existingPD) {
      console.log(`✓ PD user "${PD_USERNAME}" already exists`);
      console.log(`  ID: ${existingPD._id}`);
      console.log(`  Role: ${existingPD.role}`);
      console.log('\nIf you want to reset the password, update the PD_PASSWORD variable in this script, then run again.');
      process.exit(0);
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(PD_PASSWORD, 10);
    console.log('✓ Password hashed');

    // Create new PD user
    const pdUser = new User({
      username: PD_USERNAME,
      email: PD_EMAIL,
      password: hashedPassword,
      role: 'pd',
      isActive: true
    });

    await pdUser.save();
    console.log('✓ PD user created successfully!');
    console.log('\n--- Login Credentials ---');
    console.log(`Username: ${PD_USERNAME}`);
    console.log(`Password: ${PD_PASSWORD}`);
    console.log(`Role: pd`);
    console.log('------------------------\n');
    
  } catch (error) {
    console.error('✗ Error setting up PD user:', error.message);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('✓ Disconnected from MongoDB');
  }
}

setupPDUser();
