/**
 * Admin API for crawling car data from BHV
 * POST /api/admin/crawl-car-brands
 */

import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth'
import { crawlBrand } from '@/lib/car-crawler'
import { clearCarCache } from '@/lib/carSearchService'
import carAutomakers from '@db/car_automakers.json'

interface CrawlRequest {
  brands: string[]
}

export async function POST(req: NextRequest) {
  try {
    requireAdmin(req)
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: CrawlRequest
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const { brands } = body

  if (!brands || !Array.isArray(brands) || brands.length === 0) {
    return NextResponse.json(
      { error: 'brands array required' },
      { status: 400 }
    )
  }

  const results = {
    updated: [] as string[],
    details: [] as Array<{ brand: string; models: number; newModels: number; newModelNames: string[] }>,
    errors: [] as Array<{ brand: string; error: string }>
  }

  for (const brandName of brands) {
    // Find brand info from car_automakers.json
    const brand = carAutomakers.find(
      b => b.name.toLowerCase() === brandName.toLowerCase()
    )

    if (!brand) {
      results.errors.push({ brand: brandName, error: 'Brand not found' })
      continue
    }

    // Crawl this brand
    const result = await crawlBrand(brand.name, brand.value)

    if (result.success) {
      const info = result.newModels > 0
        ? `${brand.name} (${result.modelsCount} models, +${result.newModels} new)`
        : `${brand.name} (${result.modelsCount} models)`
      results.updated.push(info)
      results.details.push({
        brand: brand.name,
        models: result.modelsCount,
        newModels: result.newModels,
        newModelNames: result.newModelNames
      })
    } else {
      results.errors.push({
        brand: brand.name,
        error: result.error || 'Unknown error'
      })
    }
  }

  // Clear cache after updates
  clearCarCache()

  return NextResponse.json({
    success: results.errors.length === 0,
    ...results
  })
}
