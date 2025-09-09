#!/usr/bin/env node

require('dotenv').config();
const { MongoClient } = require('mongodb');
const fs = require('fs');
const path = require('path');

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://dev:dev123@localhost:27018/bhhv?authSource=admin';
const DB_NAME = process.env.DB_NAME || 'bhhv';
const COLLECTION_NAME = 'cars';

// Path to car data file
const CAR_DATA_PATH = path.join(__dirname, '../db_json/all_car_details.json');

async function importCarData() {
  let client;
  
  try {
    console.log('🚀 Starting car data import...');
    
    // Read car data file
    console.log('📖 Reading car data file...');
    const rawData = fs.readFileSync(CAR_DATA_PATH, 'utf8');
    const carData = JSON.parse(rawData);
    
    console.log(`📊 Found ${carData.length} brands to process`);
    
    // Connect to MongoDB
    console.log('🔌 Connecting to MongoDB...');
    client = new MongoClient(MONGODB_URI);
    await client.connect();
    
    const db = client.db(DB_NAME);
    const collection = db.collection(COLLECTION_NAME);
    
    // Clear existing data
    console.log('🗑️  Clearing existing car data...');
    await collection.deleteMany({});
    
    // Flatten and prepare data for import
    const flattenedCars = [];
    
    for (const brand of carData) {
      const { brand_name, brand_id, models } = brand;
      
      for (const model of models) {
        const { model_name, model_id, body_styles, years, electronic } = model;
        
        // Create search keywords for text search
        const searchKeywords = [
          brand_name.toLowerCase(),
          model_name.toLowerCase(),
          // Add common variations/synonyms here if needed
        ];
        
        // Add body style names to keywords
        if (body_styles && body_styles.length > 0) {
          body_styles.forEach(style => {
            if (style.name) {
              searchKeywords.push(style.name.toLowerCase());
            }
          });
        }
        
        // Add year names to keywords  
        if (years && years.length > 0) {
          years.forEach(year => {
            if (year.name) {
              searchKeywords.push(year.name.toLowerCase());
            }
          });
        }
        
        // Add electronic keyword for electric vehicles
        if (electronic) {
          searchKeywords.push('electric', 'điện', 'ev', 'electronic');
        }
        
        const carRecord = {
          brand_name,
          brand_id,
          model_name,
          model_id,
          body_styles: body_styles || [],
          years: years || [],
          electronic: electronic || false, // Add electronic field
          search_keywords: [...new Set(searchKeywords)], // Remove duplicates
          created_at: new Date(),
          updated_at: new Date()
        };
        
        flattenedCars.push(carRecord);
      }
    }
    
    console.log(`📝 Prepared ${flattenedCars.length} car records for import`);
    
    // Import data in batches
    const batchSize = 1000;
    let imported = 0;
    
    for (let i = 0; i < flattenedCars.length; i += batchSize) {
      const batch = flattenedCars.slice(i, i + batchSize);
      await collection.insertMany(batch);
      imported += batch.length;
      console.log(`📥 Imported ${imported}/${flattenedCars.length} records...`);
    }
    
    console.log('✅ Car data import completed successfully!');
    console.log(`📈 Total records imported: ${imported}`);
    
    // Show sample data
    const sample = await collection.findOne({});
    console.log('📋 Sample record:');
    console.log(JSON.stringify(sample, null, 2));
    
  } catch (error) {
    console.error('❌ Error importing car data:', error);
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
  importCarData();
}

module.exports = { importCarData };