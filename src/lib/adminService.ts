import { connectToDatabase } from './mongodb';
import { Province, DistrictWard, ProvinceSearchResult, DistrictWardSearchResult } from '@/types/admin';
import { getProvince } from '@/models/Province';
import { getDistrictWard } from '@/models/DistrictWard';

class AdminService {
  private async ensureConnection() {
    await connectToDatabase();
  }
  
  private getProvince() {
    return getProvince();
  }
  
  private getDistrictWard() {
    return getDistrictWard();
  }

  async searchProvinces(query?: string, page: number = 1, limit: number = 50): Promise<ProvinceSearchResult> {
    await this.ensureConnection();
    
    const Province = this.getProvince();
    const skip = (page - 1) * limit;
    
    let searchQuery = {};
    
    if (query && query.trim()) {
      // Try text search first
      try {
        searchQuery = { $text: { $search: query.trim() } };
      } catch (error) {
        // Fallback to regex search if text search fails
        searchQuery = {
          $or: [
            { province_name: { $regex: query.trim(), $options: 'i' } },
            { search_keywords: { $regex: query.trim(), $options: 'i' } }
          ]
        };
      }
    }
    
    const [provinces, total] = await Promise.all([
      Province.find(searchQuery)
        .sort({ province_name: 1 })
        .skip(skip)
        .limit(limit)
        .lean()
        .exec(),
      Province.countDocuments(searchQuery)
    ]);

    return {
      success: true,
      data: provinces.map(doc => ({
        ...doc,
        _id: doc._id.toString()
      })) as Province[],
      total,
      page,
      limit
    };
  }

  async getAllProvinces(): Promise<Province[]> {
    await this.ensureConnection();
    
    const Province = this.getProvince();
    const provinces = await Province.find({})
      .sort({ province_name: 1 })
      .lean()
      .exec();

    return provinces.map(doc => ({
      ...doc,
      _id: doc._id.toString()
    })) as Province[];
  }

  async getProvinceByCode(provinceCode: string): Promise<Province | null> {
    await this.ensureConnection();
    
    const Province = this.getProvince();
    const province = await Province.findOne({ province_code: provinceCode })
      .lean()
      .exec();

    if (!province) return null;

    return {
      ...province,
      _id: province._id.toString()
    } as Province;
  }

  async getDistrictsWardsByProvince(
    provinceCode: string, 
    searchTerm?: string, 
    page: number = 1, 
    limit: number = 100
  ): Promise<DistrictWardSearchResult> {
    await this.ensureConnection();
    
    const DistrictWard = this.getDistrictWard();
    const skip = (page - 1) * limit;
    
    let searchQuery: any = { province_code: provinceCode };
    
    if (searchTerm && searchTerm.trim()) {
      // Try text search within the province
      try {
        searchQuery = {
          ...searchQuery,
          $text: { $search: searchTerm.trim() }
        };
      } catch (error) {
        // Fallback to regex search if text search fails
        searchQuery = {
          ...searchQuery,
          $or: [
            { name: { $regex: searchTerm.trim(), $options: 'i' } },
            { search_keywords: { $regex: searchTerm.trim(), $options: 'i' } }
          ]
        };
      }
    }
    
    const [districtsWards, total] = await Promise.all([
      DistrictWard.find(searchQuery)
        .sort({ name: 1 })
        .skip(skip)
        .limit(limit)
        .lean()
        .exec(),
      DistrictWard.countDocuments(searchQuery)
    ]);

    return {
      success: true,
      data: districtsWards.map(doc => ({
        ...doc,
        _id: doc._id.toString()
      })) as DistrictWard[],
      total,
      page,
      limit
    };
  }

  async searchDistrictsWards(
    query: string, 
    provinceCode?: string,
    page: number = 1, 
    limit: number = 50
  ): Promise<DistrictWardSearchResult> {
    await this.ensureConnection();
    
    const DistrictWard = this.getDistrictWard();
    const skip = (page - 1) * limit;
    
    let searchQuery: any = {};
    
    // Add province filter if provided
    if (provinceCode) {
      searchQuery.province_code = provinceCode;
    }
    
    // Add text search
    if (query && query.trim()) {
      try {
        searchQuery.$text = { $search: query.trim() };
      } catch (error) {
        // Fallback to regex search
        const regexQuery = {
          $or: [
            { name: { $regex: query.trim(), $options: 'i' } },
            { search_keywords: { $regex: query.trim(), $options: 'i' } }
          ]
        };
        
        if (provinceCode) {
          searchQuery = {
            province_code: provinceCode,
            ...regexQuery
          };
        } else {
          searchQuery = regexQuery;
        }
      }
    }
    
    const [districtsWards, total] = await Promise.all([
      DistrictWard.find(searchQuery)
        .sort({ province_name: 1, name: 1 })
        .skip(skip)
        .limit(limit)
        .lean()
        .exec(),
      DistrictWard.countDocuments(searchQuery)
    ]);

    return {
      success: true,
      data: districtsWards.map(doc => ({
        ...doc,
        _id: doc._id.toString()
      })) as DistrictWard[],
      total,
      page,
      limit
    };
  }
}

export const adminService = new AdminService();