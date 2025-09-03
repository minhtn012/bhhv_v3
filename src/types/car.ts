export interface CarBodyStyle {
  id: string;
  code: string;
  name: string;
}

export interface CarYear {
  id: string;
  code: string;
  name: string;
}

export interface CarRecord {
  _id: string;
  brand_name: string;
  brand_id: string;
  model_name: string;
  model_id: string;
  body_styles: CarBodyStyle[];
  years: CarYear[];
  search_keywords: string[];
  created_at: Date;
  updated_at: Date;
}

export interface CarSearchResult {
  textSearch: CarRecord[];
  regexSearch: CarRecord[];
  exactMatch: CarRecord | null;
  prefixMatch: CarRecord | null;
}

export interface CarSelection {
  suggestedCar: CarRecord | null;
  selectedBrand: string;
  selectedModel: string;
  selectedBodyStyle: string;
  selectedYear: string;
  availableBrands: string[];
  availableModels: CarRecord[];
  availableBodyStyles: CarBodyStyle[];
  availableYears: CarYear[];
  isLoadingModels: boolean;
  isLoadingDetails: boolean;
}

export interface CarSearchService {
  searchCarByBrandModel(brandName: string, modelName?: string): Promise<CarSearchResult>;
  getAllBrands(): Promise<string[]>;
  getModelsByBrand(brandName: string): Promise<CarRecord[]>;
  getCarDetails(brandName: string, modelName: string): Promise<{
    bodyStyles: CarBodyStyle[];
    years: CarYear[];
  } | null>;
}