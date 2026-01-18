/**
 * Split all_car_details.json into individual brand files
 * Run: npx ts-node scripts/split-car-data.ts
 */

import * as fs from 'fs'
import * as path from 'path'

const INPUT_FILE = path.join(process.cwd(), 'db_json/all_car_details.json')
const OUTPUT_DIR = path.join(process.cwd(), 'db_json/car_brands')

interface CarModel {
  model_name: string
  model_id: string
  car_type?: string
  body_styles: Array<{ id: string; code: string; name: string }>
  years: Array<{ id: string; code: string; name: string }>
}

interface CarBrand {
  brand_name: string
  brand_id: string
  models: CarModel[]
}

function main() {
  // Read input file
  const rawData = fs.readFileSync(INPUT_FILE, 'utf-8')
  const brands: CarBrand[] = JSON.parse(rawData)

  // Create output directory
  fs.mkdirSync(OUTPUT_DIR, { recursive: true })

  let count = 0
  for (const brand of brands) {
    // Generate filename: kebab-case
    const filename = brand.brand_name.toLowerCase().replace(/\s+/g, '-') + '.json'
    const filepath = path.join(OUTPUT_DIR, filename)

    // Add updated_at timestamp
    const data = {
      ...brand,
      updated_at: new Date().toISOString()
    }

    // Write file
    fs.writeFileSync(filepath, JSON.stringify(data, null, 2), 'utf-8')
    count++
    console.log(`Created: ${filename} (${brand.models.length} models)`)
  }

  console.log(`\nDone! Created ${count} brand files in ${OUTPUT_DIR}`)
}

main()
