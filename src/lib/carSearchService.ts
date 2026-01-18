import * as fs from 'fs'
import * as path from 'path'
import { CarRecord, CarSearchResult, CarBodyStyle, CarYear } from '@/types/car'

// Use env var for prod (Docker volume), fallback to db_json for dev
const CAR_BRANDS_DIR = process.env.CAR_BRANDS_PATH ||
  path.join(process.cwd(), 'db_json/car_brands')

// Cache for loaded brand data
let brandsCache: Map<string, BrandData> | null = null
let cacheTimestamp = 0
const CACHE_TTL = 5 * 60 * 1000 // 5 minutes

interface ModelData {
  model_name: string
  model_id: string
  car_type?: string
  body_styles: CarBodyStyle[]
  years: CarYear[]
}

interface BrandData {
  brand_name: string
  brand_id: string
  models: ModelData[]
  updated_at?: string
}

/**
 * Load all brands from JSON files with caching
 */
function loadBrands(): Map<string, BrandData> {
  const now = Date.now()
  if (brandsCache && now - cacheTimestamp < CACHE_TTL) {
    return brandsCache
  }

  const brands = new Map<string, BrandData>()

  if (!fs.existsSync(CAR_BRANDS_DIR)) {
    console.warn(`Car brands directory not found: ${CAR_BRANDS_DIR}`)
    return brands
  }

  const files = fs.readdirSync(CAR_BRANDS_DIR)

  for (const file of files) {
    if (!file.endsWith('.json')) continue
    try {
      const filepath = path.join(CAR_BRANDS_DIR, file)
      const data: BrandData = JSON.parse(fs.readFileSync(filepath, 'utf-8'))
      brands.set(data.brand_name.toLowerCase(), data)
    } catch (error) {
      console.error(`Error loading ${file}:`, error)
    }
  }

  brandsCache = brands
  cacheTimestamp = now
  return brands
}

/**
 * Convert ModelData to CarRecord format for API compatibility
 */
function toCarRecord(brand: BrandData, model: ModelData): CarRecord {
  return {
    _id: `${brand.brand_id}-${model.model_id}`,
    brand_name: brand.brand_name,
    brand_id: brand.brand_id,
    model_name: model.model_name,
    model_id: model.model_id,
    body_styles: model.body_styles || [],
    years: model.years || [],
    car_type: model.car_type,
    search_keywords: [],
    created_at: new Date(),
    updated_at: new Date()
  }
}

class CarSearchService {
  /**
   * Search cars by brand and optional model name
   */
  async searchCarByBrandModel(brandName: string, modelName?: string): Promise<CarSearchResult> {
    const brands = loadBrands()
    const results: CarSearchResult = {
      textSearch: [],
      regexSearch: [],
      exactMatch: null,
      prefixMatch: null
    }

    const brandLower = brandName.toLowerCase()
    const modelLower = modelName?.toLowerCase()

    // Find matching brands
    const matchingBrands: BrandData[] = []
    for (const [key, brand] of brands) {
      if (key.includes(brandLower) || brand.brand_name.toLowerCase().includes(brandLower)) {
        matchingBrands.push(brand)
      }
    }

    // Collect matching models
    for (const brand of matchingBrands) {
      for (const model of brand.models) {
        const record = toCarRecord(brand, model)

        // Check for exact match
        if (modelLower && model.model_name.toLowerCase() === modelLower) {
          results.exactMatch = record
        }

        // Check for regex/partial match
        if (!modelLower || model.model_name.toLowerCase().includes(modelLower)) {
          results.regexSearch.push(record)
        }

        // Check for prefix match
        if (modelLower && model.model_name.toLowerCase().startsWith(modelLower)) {
          if (!results.prefixMatch) {
            results.prefixMatch = record
          }
        }
      }
    }

    // Text search = regex search for JSON-based implementation
    results.textSearch = results.regexSearch.slice(0, 10)
    results.regexSearch = results.regexSearch.slice(0, 10)

    return results
  }

  /**
   * Get all available brand names
   */
  async getAllBrands(): Promise<string[]> {
    const brands = loadBrands()
    return Array.from(brands.values())
      .map(b => b.brand_name)
      .sort()
  }

  /**
   * Get all models for a specific brand
   */
  async getModelsByBrand(brandName: string): Promise<CarRecord[]> {
    const brands = loadBrands()
    const brand = brands.get(brandName.toLowerCase())

    if (!brand) {
      return []
    }

    return brand.models
      .map(model => toCarRecord(brand, model))
      .sort((a, b) => a.model_name.localeCompare(b.model_name))
  }

  /**
   * Get car details (body styles and years) for a specific brand and model
   */
  async getCarDetails(brandName: string, modelName: string): Promise<{
    bodyStyles: CarBodyStyle[]
    years: CarYear[]
    carType?: string
  } | null> {
    const brands = loadBrands()
    const brand = brands.get(brandName.toLowerCase())

    if (!brand) {
      return null
    }

    const model = brand.models.find(
      m => m.model_name.toLowerCase() === modelName.toLowerCase()
    )

    if (!model) {
      return null
    }

    return {
      bodyStyles: model.body_styles || [],
      years: model.years || [],
      carType: model.car_type
    }
  }
}

/**
 * Clear the brands cache (call after crawl updates)
 */
export function clearCarCache(): void {
  brandsCache = null
  cacheTimestamp = 0
}

export const carSearchService = new CarSearchService()
