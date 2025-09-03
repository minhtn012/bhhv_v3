#!/usr/bin/env node

require('dotenv').config();
const { MongoClient } = require('mongodb');
const fs = require('fs');
const path = require('path');

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://dev:dev123@localhost:27018/bhhv?authSource=admin';
const DB_NAME = process.env.DB_NAME || 'bhhv';
const COLLECTION_NAME = 'cars';

class CarSearchService {
  constructor() {
    this.client = null;
    this.db = null;
    this.collection = null;
  }
  
  async connect() {
    this.client = new MongoClient(MONGODB_URI);
    await this.client.connect();
    this.db = this.client.db(DB_NAME);
    this.collection = this.db.collection(COLLECTION_NAME);
  }
  
  async disconnect() {
    if (this.client) {
      await this.client.close();
    }
  }
  
  // Text search using MongoDB text index
  async textSearch(query, limit = 10) {
    return await this.collection.find(
      { $text: { $search: query } },
      { score: { $meta: 'textScore' } }
    )
    .sort({ score: { $meta: 'textScore' } })
    .limit(limit)
    .toArray();
  }
  
  // Regex search for partial matching
  async regexSearch(query, limit = 10) {
    const searchTerms = query.toLowerCase().split(' ').filter(term => term.length > 0);
    
    const regexQueries = searchTerms.map(term => ({
      $or: [
        { brand_name: { $regex: term, $options: 'i' } },
        { model_name: { $regex: term, $options: 'i' } },
        { search_keywords: { $regex: term, $options: 'i' } }
      ]
    }));
    
    return await this.collection.find({
      $and: regexQueries
    }).limit(limit).toArray();
  }
  
  // Exact brand + model search
  async exactSearch(brandName, modelName) {
    return await this.collection.find({
      brand_name: { $regex: `^${brandName}$`, $options: 'i' },
      model_name: { $regex: `^${modelName}$`, $options: 'i' }
    }).toArray();
  }
  
  // Smart search that combines different methods
  async smartSearch(query, limit = 10) {
    const results = {
      textSearch: [],
      regexSearch: [],
      exactMatch: null,
      prefixMatch: null
    };
    
    // Try text search first
    try {
      results.textSearch = await this.textSearch(query, limit);
    } catch (error) {
      console.log('Text search not available:', error.message);
    }
    
    // Try regex search
    results.regexSearch = await this.regexSearch(query, limit);
    
    // Try exact match if query has 2 parts (brand + model)
    const queryParts = query.trim().split(/[\s\/]+/);
    if (queryParts.length >= 2) {
      const [brand, ...modelParts] = queryParts;
      const model = modelParts.join(' ');
      
      // First try exact match
      const exactMatches = await this.exactSearch(brand, model);
      if (exactMatches.length > 0) {
        results.exactMatch = exactMatches[0];
      }
      
      // If no exact match, try prefix match for model
      if (!results.exactMatch && modelParts.length > 0) {
        // Try progressively shorter prefixes for better matching
        for (let i = 0; i < modelParts[0].length; i++) {
          const prefix = modelParts[0].substring(0, modelParts[0].length - i);
          if (prefix.length >= 3) { // Minimum prefix length
            const prefixMatches = await this.prefixSearch(brand, prefix);
            if (prefixMatches.length > 0) {
              results.prefixMatch = prefixMatches[0];
              break;
            }
          }
        }
      }
    }
    
    return results;
  }
  
  // Prefix search for brand + model prefix
  async prefixSearch(brandName, modelPrefix) {
    return await this.collection.find({
      brand_name: { $regex: `^${brandName}$`, $options: 'i' },
      model_name: { $regex: `^${modelPrefix}`, $options: 'i' }
    }).sort({
      model_name: 1 // Sort to get shorter matches first
    }).toArray();
  }
  
  // Get all brands
  async getAllBrands() {
    return await this.collection.distinct('brand_name');
  }
  
  // Get models by brand
  async getModelsByBrand(brandName) {
    return await this.collection.find(
      { brand_name: { $regex: `^${brandName}$`, $options: 'i' } },
      { projection: { model_name: 1, model_id: 1, body_styles: 1, years: 1 } }
    ).toArray();
  }
  
  // Get statistics
  async getStats() {
    const totalCars = await this.collection.countDocuments();
    const totalBrands = (await this.getAllBrands()).length;
    
    return {
      totalCars,
      totalBrands,
      avgModelsPerBrand: Math.round(totalCars / totalBrands * 100) / 100
    };
  }
}

async function runTests() {
  const searchService = new CarSearchService();
  
  try {
    console.log('🚀 Starting car search tests...');
    
    await searchService.connect();
    console.log('✅ Connected to MongoDB');
    
    // Get basic stats
    console.log('\n📊 Database Statistics:');
    const stats = await searchService.getStats();
    console.log(`  Total cars: ${stats.totalCars}`);
    console.log(`  Total brands: ${stats.totalBrands}`);
    console.log(`  Average models per brand: ${stats.avgModelsPerBrand}`);
    
    // Test queries
    const testQueries = [
      'bmw',
      'kia k3',
      'audi a4',
      'honda civic',
      'toyota camry',
      'suv',
      'sedan'
    ];
    
    console.log('\n🧪 Running search tests:');
    
    for (const query of testQueries) {
      console.log(`\n🔍 Testing query: "${query}"`);
      
      const results = await searchService.smartSearch(query, 5);
      
      // Show exact match first if available
      if (results.exactMatch) {
        console.log('  ✨ Exact Match:');
        console.log(`    ${results.exactMatch.brand_name} ${results.exactMatch.model_name}`);
        console.log(`    Body styles: ${results.exactMatch.body_styles.map(s => s.name).join(', ')}`);
        console.log(`    Years: ${results.exactMatch.years.map(y => y.name).join(', ')}`);
      }
      
      // Show prefix match if available and no exact match
      if (results.prefixMatch && !results.exactMatch) {
        console.log('  🎯 Best Prefix Match:');
        console.log(`    ${results.prefixMatch.brand_name} ${results.prefixMatch.model_name}`);
        console.log(`    Body styles: ${results.prefixMatch.body_styles.map(s => s.name).join(', ')}`);
        console.log(`    Years: ${results.prefixMatch.years.map(y => y.name).join(', ')}`);
      }
      
      // Show text search results
      if (results.textSearch.length > 0) {
        console.log('  📝 Text Search Results:');
        results.textSearch.slice(0, 3).forEach((result, index) => {
          const score = result.score ? ` (score: ${result.score.toFixed(2)})` : '';
          console.log(`    ${index + 1}. ${result.brand_name} ${result.model_name}${score}`);
        });
      }
      
      // Show regex search results if different from text search
      if (results.regexSearch.length > 0 && !results.textSearch.length) {
        console.log('  🔎 Regex Search Results:');
        results.regexSearch.slice(0, 3).forEach((result, index) => {
          console.log(`    ${index + 1}. ${result.brand_name} ${result.model_name}`);
        });
      }
      
      if (!results.exactMatch && !results.prefixMatch && !results.textSearch.length && !results.regexSearch.length) {
        console.log('  ❌ No results found');
      }
    }
    
    // Test brand listing
    console.log('\n🏷️  Testing brand listing:');
    const brands = await searchService.getAllBrands();
    console.log(`  Found ${brands.length} brands:`);
    brands.slice(0, 10).forEach(brand => console.log(`    - ${brand}`));
    if (brands.length > 10) {
      console.log(`    ... and ${brands.length - 10} more`);
    }
    
    // Test models by brand
    console.log('\n🚗 Testing models by brand (BMW):');
    const bmwModels = await searchService.getModelsByBrand('BMW');
    console.log(`  Found ${bmwModels.length} BMW models:`);
    bmwModels.slice(0, 5).forEach(model => {
      console.log(`    - ${model.model_name}`);
    });
    if (bmwModels.length > 5) {
      console.log(`    ... and ${bmwModels.length - 5} more`);
    }
    
    console.log('\n✅ All tests completed successfully!');
    
  } catch (error) {
    console.error('❌ Error running tests:', error);
    process.exit(1);
  } finally {
    await searchService.disconnect();
    console.log('🔐 MongoDB connection closed');
  }
}

// Command line interface
async function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    // Run all tests
    await runTests();
    return;
  }
  
  // Run specific search query
  const query = args.join(' ');
  const searchService = new CarSearchService();
  
  try {
    await searchService.connect();
    console.log(`🔍 Searching for: "${query}"`);
    
    const results = await searchService.smartSearch(query, 10);
    
    if (results.exactMatch) {
      console.log('\n✨ Exact Match:');
      const car = results.exactMatch;
      console.log(`Brand: ${car.brand_name} (${car.brand_id})`);
      console.log(`Model: ${car.model_name} (${car.model_id})`);
      console.log(`Body Styles: ${car.body_styles.map(s => s.name).join(', ')}`);
      console.log(`Years: ${car.years.map(y => y.name).join(', ')}`);
    }
    
    if (results.prefixMatch && !results.exactMatch) {
      console.log('\n🎯 Best Prefix Match:');
      const car = results.prefixMatch;
      console.log(`Brand: ${car.brand_name} (${car.brand_id})`);
      console.log(`Model: ${car.model_name} (${car.model_id})`);
      console.log(`Body Styles: ${car.body_styles.map(s => s.name).join(', ')}`);
      console.log(`Years: ${car.years.map(y => y.name).join(', ')}`);
    }
    
    if (results.textSearch.length > 0) {
      console.log('\n📝 Text Search Results:');
      results.textSearch.forEach((result, index) => {
        const score = result.score ? ` (score: ${result.score.toFixed(2)})` : '';
        console.log(`${index + 1}. ${result.brand_name} ${result.model_name}${score}`);
      });
    }
    
    if (results.regexSearch.length > 0 && !results.textSearch.length) {
      console.log('\n🔎 Alternative Results:');
      results.regexSearch.forEach((result, index) => {
        console.log(`${index + 1}. ${result.brand_name} ${result.model_name}`);
      });
    }
    
    if (!results.exactMatch && !results.prefixMatch && !results.textSearch.length && !results.regexSearch.length) {
      console.log('\n❌ No results found for your query');
    }
    
  } catch (error) {
    console.error('❌ Search error:', error);
    process.exit(1);
  } finally {
    await searchService.disconnect();
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { CarSearchService };