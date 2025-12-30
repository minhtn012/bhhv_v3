import mongoose, { Document, Schema } from 'mongoose';
import { getHealthStatusText } from '@/utils/health-contract-status';

/**
 * Person Section Schema (reused for buyer, insured, beneficiary)
 */
const PersonSectionSchema = new Schema({
  fullname: { type: String, required: true, trim: true },
  email: { type: String, trim: true },
  identityCard: { type: String, required: true, trim: true },
  phone: { type: String, trim: true },
  birthday: { type: String, required: true },
  gender: { type: String, enum: ['male', 'female'], required: true },
  job: { type: String, trim: true },
  city: { type: String, trim: true },
  cityText: { type: String, trim: true },
  district: { type: String, trim: true },
  districtText: { type: String, trim: true },
  address: { type: String, trim: true },
}, { _id: false });

/**
 * Health Question Answer Schema
 */
const HealthQuestionSchema = new Schema({
  questionId: { type: String, required: true },
  answer: { type: Boolean, required: true },
  details: { type: String, trim: true },
}, { _id: false });

/**
 * Benefit Addons Schema
 */
const BenefitAddonsSchema = new Schema({
  maternity: { type: Boolean, default: false },
  outpatient: { type: Boolean, default: false },
  diseaseDeath: { type: Boolean, default: false },
}, { _id: false });

/**
 * Status History Schema
 */
const StatusHistorySchema = new Schema({
  status: { type: String, required: true },
  changedBy: { type: String, required: true },
  changedAt: { type: Date, default: Date.now },
  note: { type: String },
}, { _id: false });

/**
 * Health Contract Interface
 */
export interface IHealthContract extends Document {
  _id: string;
  contractNumber: string;
  productType: 'health';

  // Order info
  kindAction: 'insert' | 'renew';
  certificateCode?: string;

  // Package
  packageType: string;
  packageName: string;
  purchaseYears: number;
  benefitAddons: {
    maternity: boolean;
    outpatient: boolean;
    diseaseDeath: boolean;
  };

  // Health questions (5)
  healthQuestions: Array<{
    questionId: string;
    answer: boolean;
    details?: string;
  }>;

  // Persons (3 sections)
  buyer: {
    fullname: string;
    email?: string;
    identityCard: string;
    phone?: string;
    birthday: string;
    gender: 'male' | 'female';
    job?: string;
    city?: string;
    cityText?: string;
    district?: string;
    districtText?: string;
    address?: string;
  };
  insuredPerson: {
    fullname: string;
    email?: string;
    identityCard: string;
    phone?: string;
    birthday: string;
    gender: 'male' | 'female';
    job?: string;
    city?: string;
    cityText?: string;
    district?: string;
    districtText?: string;
    address?: string;
    relationship: string;
  };
  beneficiary: {
    fullname: string;
    email?: string;
    identityCard: string;
    phone?: string;
    birthday: string;
    gender: 'male' | 'female';
    job?: string;
    city?: string;
    cityText?: string;
    district?: string;
    districtText?: string;
    address?: string;
    relationship: string;
  };

  // Customer type
  customerKind: 'personal' | 'company';

  // Dates
  activeDate: string;
  inactiveDate: string;
  totalPremium: number;

  // BHV data
  bhvSaleCode?: string;
  bhvContractNumber?: string;

  // Workflow
  status: 'nhap' | 'cho_duyet' | 'khach_duyet' | 'ra_hop_dong' | 'huy';
  statusHistory: Array<{
    status: string;
    changedBy: string;
    changedAt: Date;
    note?: string;
  }>;

  // Metadata
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;

  // Instance methods
  canEdit(): boolean;
  canChangeStatus(newStatus: string, userRole: string): boolean;
}

/**
 * Health Contract Schema
 */
const healthContractSchema = new Schema<IHealthContract>({
  contractNumber: {
    type: String,
    required: true,
    unique: true,
    index: true,
    default: function() {
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const day = String(now.getDate()).padStart(2, '0');
      const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
      return `SK${year}${month}${day}${random}`; // SK = Sức Khỏe
    }
  },

  productType: {
    type: String,
    default: 'health',
    immutable: true
  },

  // Order info
  kindAction: {
    type: String,
    enum: ['insert', 'renew'],
    default: 'insert'
  },
  certificateCode: {
    type: String,
    trim: true
  },

  // Package
  packageType: {
    type: String,
    required: [true, 'Gói bảo hiểm là bắt buộc']
  },
  packageName: {
    type: String,
    required: [true, 'Tên gói bảo hiểm là bắt buộc']
  },
  purchaseYears: {
    type: Number,
    default: 1,
    min: [1, 'Thời hạn mua tối thiểu 1 năm']
  },
  benefitAddons: {
    type: BenefitAddonsSchema,
    default: () => ({ maternity: false, outpatient: false, diseaseDeath: false })
  },

  // Health questions
  healthQuestions: {
    type: [HealthQuestionSchema],
    validate: {
      validator: function(v: unknown[]) {
        return v.length === 5;
      },
      message: 'Phải có đủ 5 câu hỏi sức khỏe'
    }
  },

  // Person sections
  buyer: {
    type: PersonSectionSchema,
    required: [true, 'Thông tin người mua là bắt buộc']
  },
  insuredPerson: {
    type: new Schema({
      ...PersonSectionSchema.obj,
      relationship: { type: String, required: true }
    }, { _id: false }),
    required: [true, 'Thông tin người được bảo hiểm là bắt buộc']
  },
  beneficiary: {
    type: new Schema({
      ...PersonSectionSchema.obj,
      relationship: { type: String, required: true }
    }, { _id: false }),
    required: [true, 'Thông tin người thụ hưởng là bắt buộc']
  },

  // Customer type
  customerKind: {
    type: String,
    enum: ['personal', 'company'],
    default: 'personal'
  },

  // Dates
  activeDate: {
    type: String,
    required: [true, 'Ngày bắt đầu là bắt buộc']
  },
  inactiveDate: {
    type: String,
    required: [true, 'Ngày kết thúc là bắt buộc']
  },
  totalPremium: {
    type: Number,
    required: [true, 'Phí bảo hiểm là bắt buộc'],
    min: [0, 'Phí bảo hiểm không được âm']
  },

  // BHV data
  bhvSaleCode: {
    type: String,
    trim: true
  },
  bhvContractNumber: {
    type: String,
    trim: true
  },

  // Workflow status
  status: {
    type: String,
    enum: ['nhap', 'cho_duyet', 'khach_duyet', 'ra_hop_dong', 'huy'],
    default: 'nhap',
    index: true
  },

  // Status history
  statusHistory: [StatusHistorySchema],

  // Metadata
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'ID người tạo là bắt buộc'],
    index: true
  }
}, {
  timestamps: true
});

// Compound indexes for common queries
healthContractSchema.index({ status: 1, createdBy: 1 });
healthContractSchema.index({ createdAt: -1 });
healthContractSchema.index({ status: 1, createdAt: -1 });
healthContractSchema.index({ 'buyer.identityCard': 1 });
healthContractSchema.index({ 'insuredPerson.identityCard': 1 });

// Middleware to auto-add to statusHistory on status change
healthContractSchema.pre('save', function(next) {
  const doc = this as unknown as IHealthContract;
  if (this.isModified('status') && !this.isNew) {
    const statusText = getHealthStatusText(doc.status);

    doc.statusHistory.push({
      status: doc.status,
      changedBy: this.get('_statusChangedBy') || doc.createdBy,
      changedAt: new Date(),
      note: this.get('_statusChangeNote') || `Trạng thái chuyển sang: ${statusText}`
    });
  } else if (this.isNew) {
    // Add initial status
    doc.statusHistory.push({
      status: doc.status,
      changedBy: doc.createdBy,
      changedAt: new Date(),
      note: 'Tạo hợp đồng sức khỏe mới'
    });
  }
  next();
});

// Static method to get Vietnamese status text
healthContractSchema.statics.getStatusText = function(status: string): string {
  return getHealthStatusText(status);
};

// Instance method to check if can edit
healthContractSchema.methods.canEdit = function(): boolean {
  return this.status === 'nhap' || this.status === 'cho_duyet';
};

// Instance method to check if can change status
healthContractSchema.methods.canChangeStatus = function(newStatus: string, userRole: string): boolean {
  const currentStatus = this.status;

  switch (currentStatus) {
    case 'nhap':
      return newStatus === 'cho_duyet' || newStatus === 'huy';
    case 'cho_duyet':
      return newStatus === 'khach_duyet' || newStatus === 'huy';
    case 'khach_duyet':
      return userRole === 'admin' && newStatus === 'ra_hop_dong';
    case 'ra_hop_dong':
      return false;
    case 'huy':
      return false;
    default:
      return false;
  }
};

// Delete cached model in development
if (process.env.NODE_ENV === 'development' && mongoose.models.HealthContract) {
  delete mongoose.models.HealthContract;
}

export default mongoose.models.HealthContract || mongoose.model<IHealthContract>('HealthContract', healthContractSchema);
