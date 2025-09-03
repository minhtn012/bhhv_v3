import mongoose, { Schema, Document, Model } from 'mongoose';
import { CarRecord } from '@/types/car';

// Extend the CarRecord interface for Mongoose Document
export interface CarDocument extends Omit<CarRecord, '_id'>, Document {}

// Define the Mongoose schema
const CarSchema = new Schema<CarDocument>({
  brand_name: {
    type: String,
    required: true,
    index: true
  },
  brand_id: {
    type: String,
    required: true,
    index: true
  },
  model_name: {
    type: String,
    required: true,
    index: true
  },
  model_id: {
    type: String,
    required: true,
    index: true
  },
  body_styles: [{
    id: { type: String, required: true },
    code: { type: String, required: true },
    name: { type: String, required: true }
  }],
  years: [{
    id: { type: String, required: true },
    code: { type: String, required: true },
    name: { type: String, required: true }
  }],
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

// Create compound indexes for better search performance
CarSchema.index({ brand_name: 1, model_name: 1 });
CarSchema.index({ brand_name: 'text', model_name: 'text', search_keywords: 'text' }, {
  weights: {
    brand_name: 10,
    model_name: 8,
    search_keywords: 5
  }
});

// Lazy loading function to get/create the Car model
export function getCar(): Model<CarDocument> {
  if (mongoose.models && mongoose.models.Car) {
    return mongoose.models.Car as Model<CarDocument>;
  }
  
  if (!mongoose.connection.readyState) {
    throw new Error('Mongoose connection not established');
  }
  
  return mongoose.model<CarDocument>('Car', CarSchema, 'cars');
}