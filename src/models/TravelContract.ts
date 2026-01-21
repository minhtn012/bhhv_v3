import mongoose, { Document, Schema } from 'mongoose';
import { getTravelStatusText } from '@/utils/travel-contract-status';
import type {
  TravelInsuredPerson,
  TravelContractOwner,
  TravelInsurancePeriod,
  TravelContractStatus,
  TravelStatusHistoryEntry
} from '@/types/travel';

/**
 * Insured Person Schema
 */
const InsuredPersonSchema = new Schema({
  name: { type: String, required: true, trim: true },
  dob: { type: String, required: true },
  age: { type: Number, required: true, min: 0, max: 120 },
  gender: { type: String, enum: ['M', 'F'], required: true },
  country: { type: String, required: true },
  personalId: { type: String, required: true, trim: true },
  telNo: { type: String, trim: true },
  email: { type: String, trim: true },
  beneficiary: { type: String, trim: true },
  relationship: { type: String, required: true },
  pct: { type: Number, default: 100, min: 0, max: 100 },
  carRental: { type: Boolean, default: false },
  carRentalDate: { type: String },
  carRentalDays: { type: Number },
}, { _id: false });

/**
 * Contract Owner Schema
 */
const ContractOwnerSchema = new Schema({
  policyholder: { type: String, required: true, trim: true },
  pocyType: { type: String, enum: ['Individual', 'Family', 'Group'], required: true },
  pohoType: { type: String, enum: ['POHO_TYPE_E', 'POHO_TYPE_G'], required: true },
  email: { type: String, trim: true },
  telNo: { type: String, required: true, trim: true },
  address: { type: String, required: true, trim: true },
  countryAddress: { type: String, required: true },
  startCountry: { type: String, required: true },
  invTax: { type: String, trim: true },
  invCompany: { type: String, trim: true },
  invAddress: { type: String, trim: true },
}, { _id: false });

/**
 * Insurance Period Schema
 */
const InsurancePeriodSchema = new Schema({
  dateFrom: { type: String, required: true },
  dateTo: { type: String, required: true },
  days: { type: Number, required: true, min: 1 },
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
 * Travel Contract Interface
 */
export interface ITravelContract extends Document {
  _id: string;
  contractNumber: string;
  productType: 'travel';

  // Owner
  owner: TravelContractOwner;

  // Period
  period: TravelInsurancePeriod;

  // Product
  product: number;
  productName: string;
  plan: number;
  planName: string;

  // Insured persons
  insuredPersons: TravelInsuredPerson[];

  // Additional
  refNo?: string;
  pnrNo?: string;
  itinerary?: string;
  note?: string;

  // Premium
  totalPremium: number;

  // Pacific Cross data
  pacificCrossCertId?: string;
  pacificCrossCertNo?: number;
  quotePdfUrl?: string;

  // Workflow
  status: TravelContractStatus;
  statusHistory: TravelStatusHistoryEntry[];

  // Metadata
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;

  // Instance methods
  canEdit(): boolean;
  canChangeStatus(newStatus: string, userRole: string): boolean;
}

/**
 * Travel Contract Schema
 */
const travelContractSchema = new Schema({
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
      return `DL${year}${month}${day}${random}`; // DL = Du Lich (Travel)
    }
  },

  productType: {
    type: String,
    default: 'travel',
    immutable: true
  },

  // Owner
  owner: {
    type: ContractOwnerSchema,
    required: [true, 'Thong tin chu hop dong la bat buoc']
  },

  // Period
  period: {
    type: InsurancePeriodSchema,
    required: [true, 'Thoi han bao hiem la bat buoc']
  },

  // Product
  product: {
    type: Number,
    required: [true, 'San pham la bat buoc'],
    min: 1,
    max: 5
  },
  productName: {
    type: String,
    required: [true, 'Ten san pham la bat buoc']
  },
  plan: {
    type: Number,
    required: [true, 'Goi bao hiem la bat buoc']
  },
  planName: {
    type: String,
    required: [true, 'Ten goi la bat buoc']
  },

  // Insured persons
  insuredPersons: {
    type: [InsuredPersonSchema],
    required: true,
    validate: {
      validator: function(v: unknown[]) {
        return v.length >= 1;
      },
      message: 'Phai co it nhat 1 nguoi duoc bao hiem'
    }
  },

  // Additional fields
  refNo: { type: String, trim: true },
  pnrNo: { type: String, trim: true },
  itinerary: { type: String, trim: true },
  note: { type: String, trim: true },

  // Premium
  totalPremium: {
    type: Number,
    required: [true, 'Phi bao hiem la bat buoc'],
    min: [0, 'Phi bao hiem khong duoc am']
  },

  // Pacific Cross data
  pacificCrossCertId: { type: String, trim: true, index: true },
  pacificCrossCertNo: { type: Number },
  quotePdfUrl: { type: String, trim: true },

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
    required: [true, 'ID nguoi tao la bat buoc'],
    index: true
  }
}, {
  timestamps: true
});

// Compound indexes for common queries
travelContractSchema.index({ status: 1, createdBy: 1 });
travelContractSchema.index({ createdAt: -1 });
travelContractSchema.index({ status: 1, createdAt: -1 });
travelContractSchema.index({ 'owner.policyholder': 'text' });
travelContractSchema.index({ 'insuredPersons.personalId': 1 });

// Middleware to auto-add to statusHistory on status change
travelContractSchema.pre('save', function(next) {
  const doc = this as unknown as ITravelContract;
  if (this.isModified('status') && !this.isNew) {
    const statusText = getTravelStatusText(doc.status);
    doc.statusHistory.push({
      status: doc.status,
      changedBy: this.get('_statusChangedBy') || doc.createdBy,
      changedAt: new Date(),
      note: this.get('_statusChangeNote') || `Trang thai chuyen sang: ${statusText}`
    });
  } else if (this.isNew) {
    doc.statusHistory.push({
      status: doc.status,
      changedBy: doc.createdBy,
      changedAt: new Date(),
      note: 'Tao hop dong du lich moi'
    });
  }
  next();
});

// Static method for Vietnamese status text
travelContractSchema.statics.getStatusText = function(status: string): string {
  return getTravelStatusText(status);
};

// Instance method: can edit (travel allows edit even after customer approval)
travelContractSchema.methods.canEdit = function(): boolean {
  return this.status === 'nhap' || this.status === 'cho_duyet' || this.status === 'khach_duyet';
};

// Instance method: can change status
travelContractSchema.methods.canChangeStatus = function(
  newStatus: string,
  userRole: string
): boolean {
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
if (process.env.NODE_ENV === 'development' && mongoose.models.TravelContract) {
  delete mongoose.models.TravelContract;
}

export default mongoose.models.TravelContract ||
  mongoose.model<ITravelContract>('TravelContract', travelContractSchema);
