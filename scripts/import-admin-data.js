#!/usr/bin/env node

require('dotenv').config();
const { MongoClient } = require('mongodb');
const fs = require('fs');
const path = require('path');

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://dev:dev123@localhost:27018/bhhv?authSource=admin';
const DB_NAME = process.env.DB_NAME || 'bhhv';
const PROVINCES_COLLECTION = 'provinces';
const DISTRICTS_WARDS_COLLECTION = 'districts_wards';

// Path to administrative data file - flexible path resolution
function getAdminDataPath() {
  // Check environment variable first
  const envPath = process.env.ADMIN_DATA_FILE;
  if (envPath && fs.existsSync(envPath)) {
    return envPath;
  }

  // Common paths to check
  const possiblePaths = [
    path.join(__dirname, '../bd_json/vietnam_administrative_data_final.json'),
    path.join(__dirname, '../db_json/vietnam_administrative_data_final.json'),
    path.join(process.cwd(), 'bd_json/vietnam_administrative_data_final.json'),
    path.join(process.cwd(), 'db_json/vietnam_administrative_data_final.json'),
    path.join(process.cwd(), 'data/vietnam_administrative_data_final.json')
  ];

  for (const filePath of possiblePaths) {
    if (fs.existsSync(filePath)) {
      return filePath;
    }
  }

  throw new Error(`Admin data file not found. Set ADMIN_DATA_FILE environment variable or place the file in one of these locations:\n${possiblePaths.join('\n')}`);
}

const ADMIN_DATA_PATH = getAdminDataPath();

async function importAdministrativeData() {
  let client;
  
  try {
    console.log('🚀 Starting Vietnam administrative data import...');
    
    // Read administrative data file
    console.log('📖 Reading administrative data file...');
    const rawData = fs.readFileSync(ADMIN_DATA_PATH, 'utf8');
    const adminData = JSON.parse(rawData);
    
    console.log(`📊 Found ${adminData.length} provinces to process`);
    
    // Connect to MongoDB
    console.log('🔌 Connecting to MongoDB...');
    client = new MongoClient(MONGODB_URI);
    await client.connect();
    
    const db = client.db(DB_NAME);
    const provincesCollection = db.collection(PROVINCES_COLLECTION);
    const districtsWardsCollection = db.collection(DISTRICTS_WARDS_COLLECTION);
    
    // Clear existing data
    console.log('🗑️  Clearing existing administrative data...');
    await provincesCollection.deleteMany({});
    await districtsWardsCollection.deleteMany({});
    
    // Prepare data for import
    const provinces = [];
    const districtsWards = [];
    
    for (const provinceData of adminData) {
      const { province_code, province_name, districts_and_wards } = provinceData;
      
      // Create search keywords for province
      const provinceSearchKeywords = [
        province_name.toLowerCase(),
        // Remove common prefixes for better search
        province_name.replace(/^(Thành phố|Tỉnh)\s+/i, '').toLowerCase(),
      ];
      
      // Create province record
      const provinceRecord = {
        province_code,
        province_name,
        search_keywords: [...new Set(provinceSearchKeywords)], // Remove duplicates
        created_at: new Date(),
        updated_at: new Date()
      };
      
      provinces.push(provinceRecord);
      
      // Process districts and wards
      for (const districtWard of districts_and_wards) {
        const { id, name } = districtWard;
        
        // Create search keywords for district/ward
        const districtWardSearchKeywords = [
          name.toLowerCase(),
          // Remove common prefixes for better search
          name.replace(/^(Phường|Huyện|Quận|Thành phố|Thị xã|Xã)\s+/i, '').toLowerCase(),
        ];
        
        const districtWardRecord = {
          id,
          name,
          province_code,
          province_name, // Denormalized for easy lookup
          search_keywords: [...new Set(districtWardSearchKeywords)], // Remove duplicates
          created_at: new Date(),
          updated_at: new Date()
        };
        
        districtsWards.push(districtWardRecord);
      }
    }
    
    console.log(`📝 Prepared ${provinces.length} provinces and ${districtsWards.length} districts/wards for import`);
    
    // Import provinces in batches
    const batchSize = 100;
    let importedProvinces = 0;
    
    console.log('📥 Importing provinces...');
    for (let i = 0; i < provinces.length; i += batchSize) {
      const batch = provinces.slice(i, i + batchSize);
      await provincesCollection.insertMany(batch);
      importedProvinces += batch.length;
      console.log(`📥 Imported ${importedProvinces}/${provinces.length} provinces...`);
    }
    
    // Import districts/wards in batches
    let importedDistrictsWards = 0;
    
    console.log('📥 Importing districts/wards...');
    for (let i = 0; i < districtsWards.length; i += batchSize) {
      const batch = districtsWards.slice(i, i + batchSize);
      await districtsWardsCollection.insertMany(batch);
      importedDistrictsWards += batch.length;
      console.log(`📥 Imported ${importedDistrictsWards}/${districtsWards.length} districts/wards...`);
    }
    
    console.log('✅ Administrative data import completed successfully!');
    console.log(`📈 Total provinces imported: ${importedProvinces}`);
    console.log(`📈 Total districts/wards imported: ${importedDistrictsWards}`);
    
    // Show sample data
    const sampleProvince = await provincesCollection.findOne({});
    const sampleDistrictWard = await districtsWardsCollection.findOne({});
    
    console.log('📋 Sample province record:');
    console.log(JSON.stringify(sampleProvince, null, 2));
    
    console.log('📋 Sample district/ward record:');
    console.log(JSON.stringify(sampleDistrictWard, null, 2));
    
    // Create indexes for better performance
    console.log('🔍 Creating search indexes...');
    await provincesCollection.createIndex({ search_keywords: "text", province_name: "text" });
    await districtsWardsCollection.createIndex({ search_keywords: "text", name: "text" });
    await districtsWardsCollection.createIndex({ province_code: 1 }); // For province-based lookups
    
    console.log('✅ Search indexes created successfully!');
    
  } catch (error) {
    console.error('❌ Error importing administrative data:', error);
    process.exit(1);
  } finally {
    if (client) {
      await client.close();
      console.log('🔐 MongoDB connection closed');
    }
  }
}

// Helper function to search provinces
async function searchProvinces(searchTerm, limit = 10) {
  let client;
  try {
    client = new MongoClient(MONGODB_URI);
    await client.connect();
    
    const db = client.db(DB_NAME);
    const collection = db.collection(PROVINCES_COLLECTION);
    
    const results = await collection.find({
      $text: { $search: searchTerm }
    })
    .limit(limit)
    .toArray();
    
    return results;
  } finally {
    if (client) await client.close();
  }
}

// Helper function to get districts/wards by province
async function getDistrictsWardsByProvince(provinceCode, searchTerm = null, limit = 50) {
  let client;
  try {
    client = new MongoClient(MONGODB_URI);
    await client.connect();
    
    const db = client.db(DB_NAME);
    const collection = db.collection(DISTRICTS_WARDS_COLLECTION);
    
    let query = { province_code: provinceCode };
    
    if (searchTerm) {
      query = {
        ...query,
        $text: { $search: searchTerm }
      };
    }
    
    const results = await collection.find(query)
      .limit(limit)
      .toArray();
    
    return results;
  } finally {
    if (client) await client.close();
  }
}

// Run if called directly
if (require.main === module) {
  importAdministrativeData();
}

module.exports = { 
  importAdministrativeData, 
  searchProvinces, 
  getDistrictsWardsByProvince 
};