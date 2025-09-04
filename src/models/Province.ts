import mongoose, { Schema, Document, Model } from 'mongoose';
import { Province } from '@/types/admin';

export interface ProvinceDocument extends Omit<Province, '_id'>, Document {}

const ProvinceSchema = new Schema<ProvinceDocument>({
  province_code: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  province_name: {
    type: String,
    required: true,
    index: true
  },
  search_keywords: [{
    type: String,
    index: true
  }],
  created_at: {
    type: Date,
    default: Date.now
  },
  updated_at: {
    type: Date,
    default: Date.now
  }
});

// Create text search index for Vietnamese province names
ProvinceSchema.index({ 
  province_name: 'text', 
  search_keywords: 'text' 
}, {
  weights: {
    province_name: 10,
    search_keywords: 5
  }
});

// Compound index for efficient lookups
ProvinceSchema.index({ province_name: 1, province_code: 1 });

export function getProvince(): Model<ProvinceDocument> {
  if (mongoose.models && mongoose.models.Province) {
    return mongoose.models.Province as Model<ProvinceDocument>;
  }
  
  if (!mongoose.connection.readyState) {
    throw new Error('Mongoose connection not established');
  }
  
  return mongoose.model<ProvinceDocument>('Province', ProvinceSchema, 'provinces');
}