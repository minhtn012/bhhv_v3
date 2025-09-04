import { useState, useEffect, useCallback } from 'react';

interface Province {
  _id: string;
  province_code: string;
  province_name: string;
  search_keywords: string[];
}

interface DistrictWard {
  _id: string;
  id: string;
  name: string;
  province_code: string;
  province_name: string;
  search_keywords: string[];
}

interface ProvinceSearchResult {
  success: boolean;
  data: Province[];
  total: number;
}

interface DistrictWardSearchResult {
  success: boolean;
  data: DistrictWard[];
  total: number;
  page: number;
  limit: number;
}

interface UseBuyerLocationReturn {
  // Provinces
  provinces: Province[];
  loadingProvinces: boolean;
  errorProvinces: string;
  
  // Districts/Wards
  districtsWards: DistrictWard[];
  loadingDistrictsWards: boolean;
  errorDistrictsWards: string;
  
  // Actions
  loadProvinces: () => Promise<void>;
  loadDistrictsWards: (provinceCode: string) => Promise<void>;
  clearDistrictsWards: () => void;
  
  // Utility
  getProvinceByCode: (code: string) => Province | undefined;
  getDistrictWardById: (id: string) => DistrictWard | undefined;
}

export default function useBuyerLocation(): UseBuyerLocationReturn {
  // Provinces state
  const [provinces, setProvinces] = useState<Province[]>([]);
  const [loadingProvinces, setLoadingProvinces] = useState(false);
  const [errorProvinces, setErrorProvinces] = useState('');
  
  // Districts/Wards state
  const [districtsWards, setDistrictsWards] = useState<DistrictWard[]>([]);
  const [loadingDistrictsWards, setLoadingDistrictsWards] = useState(false);
  const [errorDistrictsWards, setErrorDistrictsWards] = useState('');

  // Load all provinces
  const loadProvinces = useCallback(async () => {
    if (provinces.length > 0) return; // Already loaded
    
    setLoadingProvinces(true);
    setErrorProvinces('');
    
    try {
      const response = await fetch('/api/admin/provinces');
      const data: ProvinceSearchResult = await response.json();
      
      if (data.success) {
        setProvinces(data.data);
      } else {
        setErrorProvinces('Không thể tải danh sách tỉnh/thành');
      }
    } catch (error) {
      console.error('Error loading provinces:', error);
      setErrorProvinces('Lỗi kết nối khi tải tỉnh/thành');
    } finally {
      setLoadingProvinces(false);
    }
  }, [provinces.length]);

  // Load districts/wards by province code
  const loadDistrictsWards = useCallback(async (provinceCode: string) => {
    if (!provinceCode) {
      setDistrictsWards([]);
      return;
    }
    
    setLoadingDistrictsWards(true);
    setErrorDistrictsWards('');
    
    try {
      const response = await fetch(`/api/admin/districts-wards?province_code=${provinceCode}&limit=500`);
      const data: DistrictWardSearchResult = await response.json();
      
      if (data.success) {
        setDistrictsWards(data.data);
      } else {
        setErrorDistrictsWards('Không thể tải danh sách quận/huyện/xã');
      }
    } catch (error) {
      console.error('Error loading districts/wards:', error);
      setErrorDistrictsWards('Lỗi kết nối khi tải quận/huyện/xã');
    } finally {
      setLoadingDistrictsWards(false);
    }
  }, []);

  // Clear districts/wards (when province changes)
  const clearDistrictsWards = useCallback(() => {
    setDistrictsWards([]);
    setErrorDistrictsWards('');
  }, []);

  // Utility functions
  const getProvinceByCode = useCallback((code: string): Province | undefined => {
    return provinces.find(p => p.province_code === code);
  }, [provinces]);

  const getDistrictWardById = useCallback((id: string): DistrictWard | undefined => {
    return districtsWards.find(d => d.id === id);
  }, [districtsWards]);

  // Auto-load provinces on mount
  useEffect(() => {
    loadProvinces();
  }, [loadProvinces]);

  return {
    // Provinces
    provinces,
    loadingProvinces,
    errorProvinces,
    
    // Districts/Wards
    districtsWards,
    loadingDistrictsWards,
    errorDistrictsWards,
    
    // Actions
    loadProvinces,
    loadDistrictsWards,
    clearDistrictsWards,
    
    // Utility
    getProvinceByCode,
    getDistrictWardById
  };
}