export interface Province {
  _id: string;
  province_code: string;
  province_name: string;
  search_keywords: string[];
  created_at: Date;
  updated_at: Date;
}

export interface DistrictWard {
  _id: string;
  id: string;
  name: string;
  province_code: string;
  province_name: string;
  search_keywords: string[];
  created_at: Date;
  updated_at: Date;
}

export interface ProvinceSearchResult {
  success: boolean;
  data: Province[];
  total?: number;
  page?: number;
  limit?: number;
}

export interface DistrictWardSearchResult {
  success: boolean;
  data: DistrictWard[];
  total?: number;
  page?: number;
  limit?: number;
}

export interface AdminSearchQuery {
  q?: string;
  page?: number;
  limit?: number;
  province_code?: string;
}