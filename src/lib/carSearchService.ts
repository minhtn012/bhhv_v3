import { connectToDatabase } from './mongodb';
import { CarRecord, CarSearchResult, CarBodyStyle, CarYear } from '@/types/car';
import { getCar } from '@/models/Car';

class CarSearchService {
  private async ensureConnection() {
    await connectToDatabase();
  }
  
  private getCar() {
    return getCar();
  }

  async searchCarByBrandModel(brandName: string, modelName?: string): Promise<CarSearchResult> {
    await this.ensureConnection();
    
    const results: CarSearchResult = {
      textSearch: [],
      regexSearch: [],
      exactMatch: null,
      prefixMatch: null
    };

    const query = modelName ? `${brandName} ${modelName}` : brandName;

    // Try text search first
    try {
      const Car = this.getCar();
      const textSearchResults = await Car.find(
        { $text: { $search: query } },
        { score: { $meta: 'textScore' } }
      )
      .sort({ score: { $meta: 'textScore' } })
      .limit(10)
      .lean()
      .exec();
      
      results.textSearch = textSearchResults.map(doc => ({
        ...doc,
        _id: doc._id.toString()
      })) as CarRecord[];
    } catch (error) {
      console.log('Text search not available:', error);
    }

    // Try regex search
    const searchTerms = query.toLowerCase().split(' ').filter(term => term.length > 0);
    const regexQueries = searchTerms.map(term => ({
      $or: [
        { brand_name: { $regex: term, $options: 'i' } },
        { model_name: { $regex: term, $options: 'i' } },
        { search_keywords: { $regex: term, $options: 'i' } }
      ]
    }));

    const Car = this.getCar();
    const regexSearchResults = await Car.find({
      $and: regexQueries
    }).limit(10).lean().exec();

    results.regexSearch = regexSearchResults.map(doc => ({
      ...doc,
      _id: doc._id.toString()
    })) as CarRecord[];

    // Try exact match if both brand and model are provided
    if (modelName) {
      const Car = this.getCar();
      const exactMatch = await Car.findOne({
        brand_name: { $regex: `^${brandName}$`, $options: 'i' },
        model_name: { $regex: `^${modelName}$`, $options: 'i' }
      }).lean().exec();

      if (exactMatch) {
        results.exactMatch = {
          ...exactMatch,
          _id: exactMatch._id.toString()
        } as CarRecord;
      }

      // If no exact match, try prefix match
      if (!results.exactMatch && modelName.length >= 2) {
        for (let i = 0; i < modelName.length; i++) {
          const prefix = modelName.substring(0, modelName.length - i);
          if (prefix.length >= 2) {
            const Car = this.getCar();
            const prefixMatch = await Car.findOne({
              brand_name: { $regex: `^${brandName}$`, $options: 'i' },
              model_name: { $regex: `^${prefix}`, $options: 'i' }
            }).sort({ model_name: 1 }).lean().exec();

            if (prefixMatch) {
              results.prefixMatch = {
                ...prefixMatch,
                _id: prefixMatch._id.toString()
              } as CarRecord;
              break;
            }
          }
        }
      }
    }

    return results;
  }

  async getAllBrands(): Promise<string[]> {
    await this.ensureConnection();
    const Car = this.getCar();
    return await Car.distinct('brand_name').exec();
  }

  async getModelsByBrand(brandName: string): Promise<CarRecord[]> {
    await this.ensureConnection();
    const Car = this.getCar();
    
    // Get distinct model names using aggregation
    const models = await Car.aggregate([
      {
        $match: {
          brand_name: { $regex: `^${brandName}$`, $options: 'i' }
        }
      },
      {
        $group: {
          _id: '$model_name',
          doc: { $first: '$$ROOT' }
        }
      },
      {
        $replaceRoot: { newRoot: '$doc' }
      },
      {
        $sort: { model_name: 1 }
      }
    ]).exec();

    return models.map(doc => ({
      ...doc,
      _id: doc._id.toString()
    })) as unknown as CarRecord[];
  }

  async getCarDetails(brandName: string, modelName: string): Promise<{
    bodyStyles: CarBodyStyle[];
    years: CarYear[];
  } | null> {
    await this.ensureConnection();
    const Car = this.getCar();
    const car = await Car.findOne({
      brand_name: { $regex: `^${brandName}$`, $options: 'i' },
      model_name: { $regex: `^${modelName}$`, $options: 'i' }
    }).lean().exec();

    if (!car) {
      return null;
    }

    const carData = car as any;
    
    return {
      bodyStyles: carData.body_styles || [],
      years: carData.years || []
    };
  }
}

export const carSearchService = new CarSearchService();