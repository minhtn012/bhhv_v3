import mongoose, { Schema, Document } from 'mongoose';

export interface ISystemLog extends Document {
  timestamp: Date;
  level: 'error' | 'warn' | 'info' | 'debug' | 'http';
  message: string;
  context?: Record<string, any>;

  // Request info
  method?: string;
  path?: string;
  ip?: string;
  userAgent?: string;

  // Response info
  status?: number;
  duration?: string;

  // Error info
  error?: string;
  stack?: string;

  // User info (if authenticated)
  userId?: mongoose.Types.ObjectId;
  username?: string;

  // Additional metadata
  metadata?: Record<string, any>;
}

const SystemLogSchema = new Schema<ISystemLog>({
  timestamp: { type: Date, default: Date.now, index: true },
  level: {
    type: String,
    enum: ['error', 'warn', 'info', 'debug', 'http'],
    required: true,
    index: true
  },
  message: { type: String, required: true },
  context: { type: Schema.Types.Mixed },

  // Request info
  method: { type: String, index: true },
  path: { type: String, index: true },
  ip: String,
  userAgent: String,

  // Response info
  status: { type: Number, index: true },
  duration: String,

  // Error info
  error: String,
  stack: String,

  // User info
  userId: { type: Schema.Types.ObjectId, ref: 'User', index: true },
  username: String,

  // Additional metadata
  metadata: Schema.Types.Mixed,
}, {
  timestamps: true,
});

// TTL index - auto delete logs after 7 days
SystemLogSchema.index({ timestamp: 1 }, { expireAfterSeconds: 7 * 24 * 60 * 60 });

// Compound indexes for common queries
SystemLogSchema.index({ level: 1, timestamp: -1 });
SystemLogSchema.index({ path: 1, timestamp: -1 });
SystemLogSchema.index({ userId: 1, timestamp: -1 });

export default mongoose.models.SystemLog || mongoose.model<ISystemLog>('SystemLog', SystemLogSchema);
