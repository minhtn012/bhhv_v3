/**
 * Car data crawler for BHV API
 * Fetches car models, body styles, and years from BHV and saves to JSON files
 */

import * as fs from 'fs'
import * as path from 'path'

const BHV_API_URL = 'https://online.bhv.com.vn/3f2fb62a-662a-4911-afad-d0ec4925f29e'
const PRODUCT_ID = '3588e406-6f89-4a14-839b-64460bbcea67'

// Use env var for prod (Docker volume), fallback to db_json for dev
const CAR_BRANDS_DIR = process.env.CAR_BRANDS_PATH ||
  path.join(process.cwd(), 'db_json/car_brands')

const HEADERS = {
  'Accept': 'application/json',
  'Content-Type': 'application/json',
  'Origin': 'https://online.bhv.com.vn',
  'Referer': 'https://online.bhv.com.vn/bao-hiem-xe-co-gioi',
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
}

interface BHVResponse {
  data: string | unknown[]
}

interface ModelItem {
  id: string
  name: string
  code?: string
}

interface CrawlResult {
  success: boolean
  filename: string
  modelsCount: number
  previousModelsCount: number
  newModels: number
  newModelNames: string[]
  error?: string
}

/**
 * Fetch details from BHV API
 */
async function fetchDetails(rootId: string, childCode: string): Promise<ModelItem[]> {
  const payload = {
    action_name: 'base/load/option/map',
    data: JSON.stringify({
      root_id: rootId,
      child_code: childCode,
      product_id: PRODUCT_ID
    }),
    d_info: {}
  }

  const res = await fetch(BHV_API_URL, {
    method: 'POST',
    headers: HEADERS,
    body: JSON.stringify(payload)
  })

  if (!res.ok) {
    throw new Error(`BHV API error: ${res.status}`)
  }

  const json: BHVResponse = await res.json()
  const dataString = json.data

  if (typeof dataString === 'string') {
    return JSON.parse(dataString)
  }
  return (dataString as ModelItem[]) || []
}

/**
 * Small delay to avoid rate limiting
 */
function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

/**
 * Crawl a single brand and save to JSON file
 */
export async function crawlBrand(brandName: string, brandId: string): Promise<CrawlResult> {
  try {
    // Read existing data to compare
    const filename = brandName.toLowerCase().replace(/\s+/g, '-') + '.json'
    const filepath = path.join(CAR_BRANDS_DIR, filename)
    let previousModelsCount = 0
    let existingModelIds = new Set<string>()

    if (fs.existsSync(filepath)) {
      try {
        const existingData = JSON.parse(fs.readFileSync(filepath, 'utf-8'))
        previousModelsCount = existingData.models?.length || 0
        existingModelIds = new Set(existingData.models?.map((m: { model_id: string }) => m.model_id) || [])
      } catch {
        // Ignore read errors
      }
    }

    // Fetch all models for this brand
    const models = await fetchDetails(brandId, 'CAR_MODEL')

    const modelDetails = []

    for (const model of models) {
      const modelId = model.id
      const modelName = model.name

      // Fetch body styles and years in parallel
      const [bodyStyles, years] = await Promise.all([
        fetchDetails(modelId, 'CAR_BODY_STYLES'),
        fetchDetails(modelId, 'CAR_MODEL_YEAR')
      ])

      modelDetails.push({
        model_name: modelName,
        model_id: modelId,
        car_type: 'ICE', // Default, can be updated if BHV provides this
        body_styles: bodyStyles,
        years: years
      })

      // Small delay between models
      await delay(100)
    }

    // Prepare data
    const data = {
      brand_name: brandName,
      brand_id: brandId,
      models: modelDetails,
      updated_at: new Date().toISOString()
    }

    // Save to JSON file
    fs.mkdirSync(CAR_BRANDS_DIR, { recursive: true })
    fs.writeFileSync(filepath, JSON.stringify(data, null, 2), 'utf-8')

    // Find new models
    const newModelsList = modelDetails.filter(m => !existingModelIds.has(m.model_id))

    return {
      success: true,
      filename,
      modelsCount: modelDetails.length,
      previousModelsCount,
      newModels: newModelsList.length,
      newModelNames: newModelsList.map(m => m.model_name)
    }
  } catch (error) {
    return {
      success: false,
      filename: brandName.toLowerCase().replace(/\s+/g, '-') + '.json',
      modelsCount: 0,
      previousModelsCount: 0,
      newModels: 0,
      newModelNames: [],
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

/**
 * Crawl multiple brands
 */
export async function crawlBrands(
  brands: Array<{ name: string; value: string }>
): Promise<CrawlResult[]> {
  const results: CrawlResult[] = []

  for (const brand of brands) {
    const result = await crawlBrand(brand.name, brand.value)
    results.push(result)

    // Delay between brands
    await delay(500)
  }

  return results
}
