/**
 * Admin API for listing car brands with metadata
 * GET /api/admin/car-brands
 */

import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth'
import * as fs from 'fs'
import * as path from 'path'
import carAutomakers from '@db/car_automakers.json'

// Use env var for prod (Docker volume), fallback to db_json for dev
const CAR_BRANDS_DIR = process.env.CAR_BRANDS_PATH ||
  path.join(process.cwd(), 'db_json/car_brands')

interface BrandInfo {
  name: string
  value: string
  updatedAt: string | null
  modelsCount: number
}

export async function GET(req: NextRequest) {
  try {
    requireAdmin(req)
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const brands: BrandInfo[] = carAutomakers.map(brand => {
    const filename = brand.name.toLowerCase().replace(/\s+/g, '-') + '.json'
    const filepath = path.join(CAR_BRANDS_DIR, filename)

    let updatedAt: string | null = null
    let modelsCount = 0

    if (fs.existsSync(filepath)) {
      try {
        const data = JSON.parse(fs.readFileSync(filepath, 'utf-8'))
        updatedAt = data.updated_at || null
        modelsCount = data.models?.length || 0
      } catch {
        // Ignore parse errors
      }
    }

    return {
      name: brand.name,
      value: brand.value,
      updatedAt,
      modelsCount
    }
  })

  return NextResponse.json({ success: true, data: brands })
}
