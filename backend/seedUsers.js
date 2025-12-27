require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');

// Test users for all roles
const testUsers = [
  {
    name: 'Admin User',
    email: 'admin@gearguard.com',
    password: 'Admin@123',
    role: 'Admin'
  },
  {
    name: 'Manager User',
    email: 'manager@gearguard.com',
    password: 'Manager@123',
    role: 'Manager'
  },
  {
    name: 'Technician User',
    email: 'technician@gearguard.com',
    password: 'Tech@123',
    role: 'Technician'
  },
  {
    name: 'Regular User',
    email: 'user@gearguard.com',
    password: 'User@123',
    role: 'User'
  }
];

async function seedUsers() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');

    // Clear existing users (optional - comment out if you want to keep existing)
    // await User.deleteMany({});
    // console.log('🗑️  Cleared existing users');

    // Create test users
    for (const userData of testUsers) {
      const existingUser = await User.findOne({ email: userData.email });
      
      if (existingUser) {
        console.log(`⚠️  User already exists: ${userData.email}`);
      } else {
        await User.create(userData);
        console.log(`✅ Created user: ${userData.email} (${userData.role})`);
      }
    }

    console.log('\n📋 Test Users Credentials:\n');
    console.log('Admin:      admin@gearguard.com / Admin@123');
    console.log('Manager:    manager@gearguard.com / Manager@123');
    console.log('Technician: technician@gearguard.com / Tech@123');
    console.log('User:       user@gearguard.com / User@123');
    console.log('\n✅ Seeding complete!');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding users:', error);
    process.exit(1);
  }
}

seedUsers();
