#!/usr/bin/env node

require('dotenv').config();
const { MongoClient } = require('mongodb');

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://dev:dev123@localhost:27018/bhhv?authSource=admin';
const DB_NAME = process.env.DB_NAME || 'bhhv';
const COLLECTION_NAME = 'cars';

async function setupCarIndexes() {
  let client;
  
  try {
    console.log('🚀 Setting up car collection indexes...');
    
    // Connect to MongoDB
    console.log('🔌 Connecting to MongoDB...');
    client = new MongoClient(MONGODB_URI);
    await client.connect();
    
    const db = client.db(DB_NAME);
    const collection = db.collection(COLLECTION_NAME);
    
    // Drop existing indexes (except _id)
    console.log('🗑️  Dropping existing indexes...');
    try {
      await collection.dropIndexes();
    } catch (error) {
      console.log('ℹ️  No existing indexes to drop');
    }
    
    // Create text search index
    console.log('📝 Creating text search index...');
    await collection.createIndex(
      {
        brand_name: 'text',
        model_name: 'text',
        search_keywords: 'text'
      },
      {
        name: 'car_text_search',
        weights: {
          brand_name: 10,  // Brand name has highest priority
          model_name: 8,   // Model name has high priority
          search_keywords: 5 // Keywords have medium priority
        },
        default_language: 'none' // Disable stemming for better exact matches
      }
    );
    
    // Create compound index for brand + model exact search
    console.log('🔍 Creating brand+model compound index...');
    await collection.createIndex(
      { brand_name: 1, model_name: 1 },
      { name: 'brand_model_search' }
    );
    
    // Create individual field indexes for filtering
    console.log('📊 Creating individual field indexes...');
    await collection.createIndex(
      { brand_name: 1 },
      { name: 'brand_name_search' }
    );
    
    await collection.createIndex(
      { model_name: 1 },
      { name: 'model_name_search' }
    );
    
    await collection.createIndex(
      { brand_id: 1 },
      { name: 'brand_id_search' }
    );
    
    await collection.createIndex(
      { model_id: 1 },
      { name: 'model_id_search' }
    );
    
    // Create index for date fields
    console.log('📅 Creating date indexes...');
    await collection.createIndex(
      { created_at: 1 },
      { name: 'created_at_index' }
    );
    
    await collection.createIndex(
      { updated_at: 1 },
      { name: 'updated_at_index' }
    );
    
    // List all indexes
    console.log('📋 Listing all indexes:');
    const indexes = await collection.listIndexes().toArray();
    indexes.forEach(index => {
      console.log(`  - ${index.name}: ${JSON.stringify(index.key)}`);
    });
    
    console.log('✅ Car indexes setup completed successfully!');
    
    // Test the text search
    console.log('🧪 Testing text search functionality...');
    const testResults = await collection.find(
      { $text: { $search: 'bmw' } },
      { score: { $meta: 'textScore' } }
    ).sort({ score: { $meta: 'textScore' } }).limit(3).toArray();
    
    console.log(`🔍 Test search for 'bmw' found ${testResults.length} results:`);
    testResults.forEach((result, index) => {
      const score = result.score ? result.score.toFixed(2) : 'N/A';
      console.log(`  ${index + 1}. ${result.brand_name} ${result.model_name} (score: ${score})`);
    });
    
  } catch (error) {
    console.error('❌ Error setting up car indexes:', error);
    process.exit(1);
  } finally {
    if (client) {
      await client.close();
      console.log('🔐 MongoDB connection closed');
    }
  }
}

// Run if called directly
if (require.main === module) {
  setupCarIndexes();
}

module.exports = { setupCarIndexes };