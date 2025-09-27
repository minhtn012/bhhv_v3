#!/usr/bin/env node

/**
 * Data Migration Script for BHHV Project
 * This script handles database migrations and initial data seeding
 */

const mongoose = require('mongoose');

// MongoDB connection configuration
const MONGODB_URI = process.env.MONGODB_URI;
if (MONGODB_URI == null ) 
{
  console.log("Not found config....")
}
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
  validateDatabase
};