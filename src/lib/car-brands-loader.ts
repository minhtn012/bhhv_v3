/**
 * Car Brands Loader - Dynamically loads all car brand data from individual JSON files
 * This replaces the static all_car_details.json import for better maintainability
 */

import fs from 'fs';
import path from 'path';

interface CarBodyStyle {
  id: string;
  code: string;
  name: string;
}

interface CarYear {
  id: string;
  code: string;
  name: string;
}

interface CarModel {
  model_name: string;
  model_id: string;
  car_type?: string;
  body_styles?: CarBodyStyle[];
  years?: CarYear[];
}

interface CarBrand {
  brand_name: string;
  brand_id: string;
  models: CarModel[];
}

// Cache loaded data to avoid repeated file reads
let cachedCarBrands: CarBrand[] | null = null;

/**
 * Load all car brands from individual JSON files in db_json/car_brands/
 * Results are cached after first load
 */
export function loadAllCarBrands(): CarBrand[] {
  if (cachedCarBrands) {
    return cachedCarBrands;
  }

  const carBrandsDir = path.join(process.cwd(), 'db_json', 'car_brands');
  const brands: CarBrand[] = [];

  try {
    const files = fs.readdirSync(carBrandsDir);

    for (const file of files) {
      if (file.endsWith('.json')) {
        const filePath = path.join(carBrandsDir, file);
        const content = fs.readFileSync(filePath, 'utf-8');
        const brand: CarBrand = JSON.parse(content);
        brands.push(brand);
      }
    }

    cachedCarBrands = brands;
    return brands;
  } catch (error) {
    console.error('Error loading car brands:', error);
    return [];
  }
}

// Export loaded brands for use as default
export const allCarBrands = loadAllCarBrands();
