#!/usr/bin/env node

/**
 * Data Migration Script for BHHV Project
 * This script handles database migrations and initial data seeding
 */

const mongoose = require('mongoose');

// MongoDB connection configuration
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://dev:dev123@mongodb:27017/bhhv?authSource=admin';

// Import your models here (adjust paths as needed)
// const User = require('../src/models/User');
// const Contract = require('../src/models/Contract');

async function connectToDatabase() {
  try {
    await mongoose.connect(MONGODB_URI, {
      bufferCommands: false,
    });
    console.log('✅ Connected to MongoDB successfully');
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error);
    process.exit(1);
  }
}

async function createIndexes() {
  try {
    console.log('📝 Creating database indexes...');

    // Example: Create indexes for better performance
    // await User.createIndexes();
    // await Contract.createIndexes();

    console.log('✅ Database indexes created successfully');
  } catch (error) {
    console.error('❌ Failed to create indexes:', error);
    throw error;
  }
}

async function seedInitialData() {
  try {
    console.log('🌱 Seeding initial data...');

    // Example: Create default admin user
    // const adminExists = await User.findOne({ role: 'admin' });
    // if (!adminExists) {
    //   const defaultAdmin = new User({
    //     email: 'admin@bhhv.com',
    //     password: 'hashed_password_here', // Remember to hash passwords
    //     role: 'admin',
    //     name: 'System Admin'
    //   });
    //   await defaultAdmin.save();
    //   console.log('✅ Default admin user created');
    // }

    // Example: Create default TNDS categories
    // const categories = [
    //   { name: 'Xe máy', rate: 0.03 },
    //   { name: 'Ô tô dưới 6 chỗ', rate: 0.05 },
    //   { name: 'Ô tô từ 6-24 chỗ', rate: 0.07 }
    // ];
    //
    // for (const category of categories) {
    //   const exists = await TNDSCategory.findOne({ name: category.name });
    //   if (!exists) {
    //     await TNDSCategory.create(category);
    //     console.log(`✅ Created TNDS category: ${category.name}`);
    //   }
    // }

    console.log('✅ Initial data seeding completed');
  } catch (error) {
    console.error('❌ Failed to seed initial data:', error);
    throw error;
  }
}

async function runMigrations() {
  try {
    console.log('🔄 Running database migrations...');

    // Example migration: Update existing contracts status format
    // await Contract.updateMany(
    //   { status: 'draft' },
    //   { $set: { status: 'nhap' } }
    // );

    // Example migration: Add missing fields to existing documents
    // await User.updateMany(
    //   { createdAt: { $exists: false } },
    //   { $set: { createdAt: new Date(), updatedAt: new Date() } }
    // );

    console.log('✅ Database migrations completed');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  }
}

async function validateDatabase() {
  try {
    console.log('🔍 Validating database state...');

    // Check if collections exist
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log(`📊 Found ${collections.length} collections:`, collections.map(c => c.name).join(', '));

    // Example: Validate critical data exists
    // const userCount = await User.countDocuments();
    // const contractCount = await Contract.countDocuments();
    // console.log(`👥 Users: ${userCount}, 📄 Contracts: ${contractCount}`);

    console.log('✅ Database validation completed');
  } catch (error) {
    console.error('❌ Database validation failed:', error);
    throw error;
  }
}

async function main() {
  try {
    console.log('🚀 Starting database migration...');

    await connectToDatabase();

    // Run migration steps
    await createIndexes();
    await runMigrations();
    await seedInitialData();
    await validateDatabase();

    console.log('🎉 Database migration completed successfully!');

  } catch (error) {
    console.error('💥 Migration failed:', error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('📝 Database connection closed');
  }
}

// Handle script termination
process.on('SIGINT', async () => {
  console.log('\n🛑 Migration interrupted by user');
  await mongoose.connection.close();
  process.exit(0);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('💥 Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Run migration if this script is called directly
if (require.main === module) {
  main();
}

module.exports = {
  connectToDatabase,
  createIndexes,
  seedInitialData,
  runMigrations,
  validateDatabase
};