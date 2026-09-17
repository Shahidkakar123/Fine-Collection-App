/**
 * Setup script to create a new PD user in the database
 * Run with: node setupPD.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
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
      let updated = false;

      // Ensure old seeded PD accounts can use email-only login.
      if (existingPD.email !== PD_EMAIL) {
        existingPD.email = PD_EMAIL;
        updated = true;
        console.log(`✓ PD email set to ${PD_EMAIL}`);
      }

      if (existingPD.role !== 'pd') {
        existingPD.role = 'pd';
        updated = true;
        console.log('✓ PD role set to pd');
      }

      if (!existingPD.isActive) {
        existingPD.isActive = true;
        updated = true;
        console.log('✓ PD account set to active');
      }

      if (!existingPD.emailVerified) {
        existingPD.emailVerified = true;
        updated = true;
        console.log('✓ PD emailVerified set to true for demo login');
      }

      existingPD.password = await bcrypt.hash(PD_PASSWORD, 10);
      updated = true;
      console.log('✓ PD password reset for demo login');

      if (updated) {
        await existingPD.save();
      }

      console.log('\n--- Login Credentials ---');
      console.log(`Email: ${PD_EMAIL}`);
      console.log(`Password: ${PD_PASSWORD}`);
      console.log(`Role: pd`);
      console.log('------------------------\n');
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
      isActive: true,
      emailVerified: true,
    });

    await pdUser.save();
    console.log('✓ PD user created successfully!');
    console.log('\n--- Login Credentials ---');
    console.log(`Email: ${PD_EMAIL}`);
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
