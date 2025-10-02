import mongoose, { Schema, Document } from 'mongoose';

export interface IBhvRequestLog extends Document {
  // Request info
  timestamp: Date;
  contractId: mongoose.Types.ObjectId;
  contractNumber: string;

  // Request details
  requestPayload: {
    action_name: string;
    data: string;
    d_info: Record<string, any>;
  };
  requestSize: number; // bytes

  // Cookie info (for debugging and replay)
  cookieKeys: string[];
  cookieValues: Record<string, string>; // Full cookie values for replay
  hasCookies: boolean;

  // Response details
  responseStatus?: number;
  responseData?: any;
  responseSize?: number; // bytes

  // Success/failure
  success: boolean;
  errorMessage?: string;
  errorDetails?: string;

  // Performance
  duration: number; // milliseconds

  // BHV specific
  bhvEndpoint: string;
  bhvStatusCode?: number; // from BHV response
  pdfReceived: boolean;
  pdfSize?: number;

  // User context
  userId?: mongoose.Types.ObjectId;
  userIp?: string;

  // Retry info
  isRetry: boolean;
  retryCount: number;
  originalRequestId?: mongoose.Types.ObjectId;

  // Additional metadata
  metadata?: Record<string, any>;
}

const BhvRequestLogSchema = new Schema<IBhvRequestLog>({
  // Request info
  timestamp: { type: Date, default: Date.now, index: true },
  contractId: { type: Schema.Types.ObjectId, ref: 'Contract', required: true, index: true },
  contractNumber: { type: String, required: true, index: true },

  // Request details
  requestPayload: {
    action_name: String,
    data: String,
    d_info: Schema.Types.Mixed,
  },
  requestSize: Number,

  // Cookie info
  cookieKeys: [String],
  cookieValues: { type: Schema.Types.Mixed, default: {} },
  hasCookies: Boolean,

  // Response details
  responseStatus: Number,
  responseData: Schema.Types.Mixed,
  responseSize: Number,

  // Success/failure
  success: { type: Boolean, required: true, index: true },
  errorMessage: String,
  errorDetails: String,

  // Performance
  duration: { type: Number, required: true, index: true },

  // BHV specific
  bhvEndpoint: String,
  bhvStatusCode: Number,
  pdfReceived: Boolean,
  pdfSize: Number,

  // User context
  userId: { type: Schema.Types.ObjectId, ref: 'User', index: true },
  userIp: String,

  // Retry info
  isRetry: { type: Boolean, default: false, index: true },
  retryCount: { type: Number, default: 0 },
  originalRequestId: { type: Schema.Types.ObjectId, ref: 'BhvRequestLog' },

  // Additional metadata
  metadata: Schema.Types.Mixed,
}, {
  timestamps: true,
});

// TTL index - keep BHV logs for 7 days
BhvRequestLogSchema.index({ timestamp: 1 }, { expireAfterSeconds: 7 * 24 * 60 * 60 });

// Compound indexes for analytics
BhvRequestLogSchema.index({ success: 1, timestamp: -1 });
BhvRequestLogSchema.index({ contractId: 1, timestamp: -1 });
BhvRequestLogSchema.index({ duration: 1 }); // for performance analysis

export default mongoose.models.BhvRequestLog || mongoose.model<IBhvRequestLog>('BhvRequestLog', BhvRequestLogSchema);
