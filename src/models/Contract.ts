import mongoose, { Document, Schema } from 'mongoose';
import { getStatusText } from '@/utils/contract-status';

export interface IContract extends Document {
  _id: string;
  contractNumber: string;
  
  // Thông tin khách hàng
  chuXe: string;
  diaChi: string;
  
  // Thông tin người mua (buyer information)
  buyerEmail?: string;
  buyerPhone?: string;
  buyerGender?: 'nam' | 'nu' | 'khac';
  buyerCitizenId?: string;
  selectedProvince?: string; // province_code
  selectedProvinceText?: string; // province_name for display
  selectedDistrictWard?: string; // district/ward id
  selectedDistrictWardText?: string; // district/ward name for display
  specificAddress?: string;
  
  // Thông tin xe
  bienSo: string;
  nhanHieu: string;
  soLoai: string;
  soKhung: string;
  soMay: string;
  ngayDKLD: string;
  namSanXuat: number;
  soChoNgoi: number;
  trongTai?: number;
  giaTriXe: number;
  loaiHinhKinhDoanh: string;
  loaiDongCo?: string;
  giaTriPin?: number;
  loaiXe?: string;
  
  // Thông tin xe từ car selection
  carBrand?: string;
  carModel?: string;
  carBodyStyle?: string;
  carYear?: string;
  
  // Gói bảo hiểm
  vatChatPackage: {
    name: string;
    tyLePhi: number;        // Tỷ lệ gói gốc
    customRate?: number;    // Tỷ lệ user đã chỉnh sửa 
    isCustomRate?: boolean; // Đánh dấu có phải custom rate
    phiVatChatGoc?: number; // Phí vật chất theo rate gốc
    phiVatChat: number;     // Phí vật chất cuối cùng (đã custom)
    dkbs: string[];
  };
  
  // Các loại phí
  includeTNDS: boolean;
  tndsCategory: string;
  phiTNDS: number;
  
  includeNNTX: boolean;
  phiNNTX: number;
  
  // Phí pin xe điện (chỉ cho HYBRID/EV)
  phiPin?: number;
  
  // Tái tục/Cấp mới
  taiTucPercentage?: number;
  phiTaiTuc?: number;
  
  // Tổng phí
  phiTruocKhiGiam?: number; // Tổng phí theo rate gốc
  phiSauKhiGiam?: number;   // Tổng phí cuối cùng (đã giảm)
  tongPhi: number;          // = phiSauKhiGiam (backward compatibility)
  mucKhauTru: number;
  
  // Trạng thái workflow
  status: 'nhap' | 'cho_duyet' | 'khach_duyet' | 'ra_hop_dong' | 'huy';
  
  // File đính kèm (base64 hoặc file paths)
  cavetImage?: string;
  dangkiemImage?: string;
  
  // Thời hạn bảo hiểm
  ngayBatDauBaoHiem?: string;
  ngayKetThucBaoHiem?: string;

  // BHV contract number
  bhvContractNumber?: string;

  // Metadata
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  
  // Lịch sử thay đổi trạng thái
  statusHistory: Array<{
    status: string;
    changedBy: string;
    changedAt: Date;
    note?: string;
  }>;

  // BHV premium data from online check
  bhvPremiums?: {
    bhvc: {
      beforeTax: number;
      afterTax: number;
    };
    tnds: {
      beforeTax: number;
      afterTax: number;
    };
    nntx: {
      beforeTax: number;
      afterTax: number;
    };
    total: {
      beforeTax: number;
      afterTax: number;
    };
    checkedAt: Date;
    success: boolean;
    error?: string;
  };
}

const contractSchema = new Schema<IContract>({
  contractNumber: {
    type: String,
    required: true,
    unique: true,
    default: function() {
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const day = String(now.getDate()).padStart(2, '0');
      const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
      return `BH${year}${month}${day}${random}`;
    }
  },
  
  // Thông tin khách hàng
  chuXe: {
    type: String,
    required: [true, 'Tên chủ xe là bắt buộc'],
    trim: true
  },
  diaChi: {
    type: String,
    required: [true, 'Địa chỉ là bắt buộc'],
    trim: true
  },
  
  // Thông tin người mua (buyer information)
  buyerEmail: {
    type: String,
    trim: true
  },
  buyerPhone: {
    type: String,
    trim: true
  },
  buyerGender: {
    type: String,
    enum: ['nam', 'nu', 'khac']
  },
  buyerCitizenId: {
    type: String,
    trim: true
  },
  selectedProvince: {
    type: String,
    trim: true
  },
  selectedProvinceText: {
    type: String,
    trim: true
  },
  selectedDistrictWard: {
    type: String,
    trim: true
  },
  selectedDistrictWardText: {
    type: String,
    trim: true
  },
  specificAddress: {
    type: String,
    trim: true
  },
  
  // Thông tin xe
  bienSo: {
    type: String,
    required: [true, 'Biển số xe là bắt buộc'],
    trim: true,
    uppercase: true
  },
  nhanHieu: {
    type: String,
    required: [true, 'Nhãn hiệu xe là bắt buộc'],
    trim: true
  },
  soLoai: {
    type: String,
    required: [true, 'Số loại xe là bắt buộc'],
    trim: true
  },
  soKhung: {
    type: String,
    required: [true, 'Số khung là bắt buộc'],
    trim: true
  },
  soMay: {
    type: String,
    required: [true, 'Số máy là bắt buộc'],
    trim: true
  },
  ngayDKLD: {
    type: String,
    required: [true, 'Ngày đăng ký lần đầu là bắt buộc']
  },
  namSanXuat: {
    type: Number,
    required: [true, 'Năm sản xuất là bắt buộc'],
    min: [1980, 'Năm sản xuất phải từ 1980 trở lên'],
    max: [new Date().getFullYear() + 1, 'Năm sản xuất không hợp lệ']
  },
  soChoNgoi: {
    type: Number,
    required: [true, 'Số chỗ ngồi là bắt buộc'],
    min: [1, 'Số chỗ ngồi phải lớn hơn 0']
  },
  trongTai: {
    type: Number,
    min: [0, 'Trọng tải không được âm']
  },
  giaTriXe: {
    type: Number,
    required: [true, 'Giá trị xe là bắt buộc'],
    min: [1000000, 'Giá trị xe phải lớn hơn 1,000,000 VNĐ']
  },
  loaiHinhKinhDoanh: {
    type: String,
    required: [true, 'Loại hình kinh doanh là bắt buộc'],
    enum: [
      'khong_kd_cho_nguoi',
      'khong_kd_cho_hang', 
      'khong_kd_pickup_van',
      'kd_cho_hang',
      'kd_dau_keo',
      'kd_cho_khach_lien_tinh',
      'kd_grab_be',
      'kd_taxi_tu_lai',
      'kd_hop_dong_tren_9c',
      'kd_bus',
      'kd_pickup_van',
      'kd_chuyen_dung',
      'kd_romooc_ben'
    ]
  },
  loaiDongCo: {
    type: String,
    required: [true, 'Loại động cơ là bắt buộc'],
    trim: true
  },
  giaTriPin: {
    type: Number,
    min: [0, 'Giá trị pin không được âm']
  },
  loaiXe: {
    type: String,
    trim: true
  },
  
  // Thông tin xe từ car selection
  carBrand: {
    type: String,
    trim: true
  },
  carModel: {
    type: String,
    trim: true
  },
  carBodyStyle: {
    type: String,
    trim: true
  },
  carYear: {
    type: String
  },
  
  // Gói bảo hiểm
  vatChatPackage: {
    name: {
      type: String,
      required: [true, 'Tên gói bảo hiểm là bắt buộc']
    },
    tyLePhi: {
      type: Number,
      required: [true, 'Tỷ lệ phí là bắt buộc'],
      min: [0, 'Tỷ lệ phí không được âm']
    },
    customRate: {
      type: Number,
      min: [0.1, 'Tỷ lệ custom không được nhỏ hơn 0.1%'],
      max: [10, 'Tỷ lệ custom không được lớn hơn 10%']
    },
    isCustomRate: {
      type: Boolean,
      default: false
    },
    phiVatChatGoc: {
      type: Number,
      min: [0, 'Phí vật chất gốc không được âm']
    },
    phiVatChat: {
      type: Number,
      required: [true, 'Phí vật chất là bắt buộc'],
      min: [0, 'Phí vật chất không được âm']
    },
    dkbs: [{
      type: String
    }]
  },
  
  // Các loại phí
  includeTNDS: {
    type: Boolean,
    default: true
  },
  tndsCategory: {
    type: String,
    required: function() {
      return this.includeTNDS;
    }
  },
  phiTNDS: {
    type: Number,
    default: 0,
    min: [0, 'Phí TNDS không được âm']
  },
  
  includeNNTX: {
    type: Boolean,
    default: true
  },
  phiNNTX: {
    type: Number,
    default: 0,
    min: [0, 'Phí NNTX không được âm']
  },
  
  // Phí pin xe điện
  phiPin: {
    type: Number,
    min: [0, 'Phí pin không được âm'],
    default: 0
  },
  
  // Tái tục/Cấp mới
  taiTucPercentage: {
    type: Number,
    min: [-100, 'Tỷ lệ tái tục không được nhỏ hơn -100%'],
    max: [100, 'Tỷ lệ tái tục không được lớn hơn 100%'],
    default: 0
  },
  phiTaiTuc: {
    type: Number,
    default: 0
  },
  
  // Tổng phí
  phiTruocKhiGiam: {
    type: Number,
    min: [0, 'Tổng phí trước khi giảm không được âm']
  },
  phiSauKhiGiam: {
    type: Number,
    min: [0, 'Tổng phí sau khi giảm không được âm']
  },
  tongPhi: {
    type: Number,
    required: [true, 'Tổng phí là bắt buộc'],
    min: [0, 'Tổng phí không được âm']
  },
  mucKhauTru: {
    type: Number,
    required: [true, 'Mức khấu trừ là bắt buộc'],
    min: [0, 'Mức khấu trừ không được âm']
  },
  
  // Trạng thái workflow
  status: {
    type: String,
    enum: ['nhap', 'cho_duyet', 'khach_duyet', 'ra_hop_dong', 'huy'],
    default: 'nhap'
  },
  
  // File đính kèm
  cavetImage: {
    type: String
  },
  dangkiemImage: {
    type: String
  },

  // Thời hạn bảo hiểm
  ngayBatDauBaoHiem: {
    type: String,
    trim: true
  },
  ngayKetThucBaoHiem: {
    type: String,
    trim: true
  },

  // BHV contract number
  bhvContractNumber: {
    type: String,
    trim: true
  },

  // Metadata
  createdBy: {
    type: String,
    required: [true, 'ID người tạo là bắt buộc']
  },
  
  // Lịch sử thay đổi trạng thái
  statusHistory: [{
    status: {
      type: String,
      required: true
    },
    changedBy: {
      type: String,
      required: true
    },
    changedAt: {
      type: Date,
      default: Date.now
    },
    note: {
      type: String
    }
  }],

  // BHV premium data from online check
  bhvPremiums: {
    type: {
      bhvc: {
        beforeTax: {
          type: Number,
          min: [0, 'BHVC premium before tax cannot be negative']
        },
        afterTax: {
          type: Number,
          min: [0, 'BHVC premium after tax cannot be negative']
        }
      },
      tnds: {
        beforeTax: {
          type: Number,
          min: [0, 'TNDS premium before tax cannot be negative']
        },
        afterTax: {
          type: Number,
          min: [0, 'TNDS premium after tax cannot be negative']
        }
      },
      nntx: {
        beforeTax: {
          type: Number,
          min: [0, 'NNTX premium before tax cannot be negative']
        },
        afterTax: {
          type: Number,
          min: [0, 'NNTX premium after tax cannot be negative']
        }
      },
      total: {
        beforeTax: {
          type: Number,
          min: [0, 'Total premium before tax cannot be negative']
        },
        afterTax: {
          type: Number,
          min: [0, 'Total premium after tax cannot be negative']
        }
      },
      checkedAt: {
        type: Date,
        default: Date.now
      },
      success: {
        type: Boolean,
        required: false
      },
      error: {
        type: String
      }
    },
    required: false
  }
}, {
  timestamps: true
});


// Middleware để tự động thêm vào statusHistory khi thay đổi trạng thái
contractSchema.pre('save', function(next) {
  if (this.isModified('status') && !this.isNew) {
    const statusText = getStatusText(this.status);
    
    this.statusHistory.push({
      status: this.status,
      changedBy: this.get('_statusChangedBy') || this.createdBy,
      changedAt: new Date(),
      note: this.get('_statusChangeNote') || `Trạng thái chuyển sang: ${statusText}`
    });
  } else if (this.isNew) {
    // Thêm trạng thái ban đầu
    this.statusHistory.push({
      status: this.status,
      changedBy: this.createdBy,
      changedAt: new Date(),
      note: 'Tạo hợp đồng mới'
    });
  }
  next();
});

// Static method để lấy trạng thái tiếng Việt
contractSchema.statics.getStatusText = function(status: string): string {
  return getStatusText(status);
};

// Instance method để kiểm tra có thể chỉnh sửa không
contractSchema.methods.canEdit = function(): boolean {
  return this.status === 'nhap';
};

// Instance method để kiểm tra có thể thay đổi trạng thái không
contractSchema.methods.canChangeStatus = function(newStatus: string, userRole: string): boolean {
  const currentStatus = this.status;
  
  // Logic workflow
  switch (currentStatus) {
    case 'nhap':
      return newStatus === 'cho_duyet' || newStatus === 'huy';
    case 'cho_duyet':
      return newStatus === 'khach_duyet' || newStatus === 'huy';
    case 'khach_duyet':
      return userRole === 'admin' && newStatus === 'ra_hop_dong';
    case 'ra_hop_dong':
      return false; // Không thể thay đổi từ trạng thái này
    case 'huy':
      return false; // Không thể thay đổi từ trạng thái này
    default:
      return false;
  }
};

export default mongoose.models.Contract || mongoose.model<IContract>('Contract', contractSchema);