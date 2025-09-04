import mongoose, { Schema, Document, Model } from 'mongoose';
import { DistrictWard } from '@/types/admin';

export interface DistrictWardDocument extends Omit<DistrictWard, '_id'>, Document {}

const DistrictWardSchema = new Schema<DistrictWardDocument>({
  id: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  name: {
    type: String,
    required: true,
    index: true
  },
  province_code: {
    type: String,
    required: true,
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

// Create text search index for Vietnamese district/ward names
DistrictWardSchema.index({ 
  name: 'text', 
  province_name: 'text',
  search_keywords: 'text' 
}, {
  weights: {
    name: 10,
    province_name: 5,
    search_keywords: 3
  }
});

// Compound indexes for efficient lookups
DistrictWardSchema.index({ province_code: 1, name: 1 });
DistrictWardSchema.index({ province_code: 1 }); // For loading by province

export function getDistrictWard(): Model<DistrictWardDocument> {
  if (mongoose.models && mongoose.models.DistrictWard) {
    return mongoose.models.DistrictWard as Model<DistrictWardDocument>;
  }
  
  if (!mongoose.connection.readyState) {
    throw new Error('Mongoose connection not established');
  }
  
  return mongoose.model<DistrictWardDocument>('DistrictWard', DistrictWardSchema, 'districts_wards');
}