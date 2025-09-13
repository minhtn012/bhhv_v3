const { MongoClient } = require('mongodb');

const sampleContracts = [
  {
    contractNumber: 'BH202409012345',
    chuXe: 'Nguyễn Văn An',
    diaChi: 'Hà Nội',
    bienSo: '30A-12345',
    nhanHieu: 'Toyota',
    soLoai: 'Vios',
    soKhung: 'VNKC123456789',
    soMay: 'VNKM987654321',
    ngayDKLD: '2023-01-15',
    namSanXuat: 2023,
    soChoNgoi: 5,
    giaTriXe: 600000000,
    loaiHinhKinhDoanh: 'khong_kd_cho_nguoi',
    loaiDongCo: 'GASOLINE',
    vatChatPackage: {
      name: 'Gói cơ bản',
      tyLePhi: 1.5,
      phiVatChat: 9000000,
      dkbs: ['TCAD']
    },
    includeTNDS: true,
    tndsCategory: 'xe_duoi_6_cho',
    phiTNDS: 683000,
    includeNNTX: true,
    phiNNTX: 200000,
    tongPhi: 9883000,
    mucKhauTru: 2000000,
    status: 'cho_duyet',
    createdBy: 'user@example.com',
    createdAt: new Date('2024-09-01'),
    updatedAt: new Date('2024-09-01'),
    statusHistory: [
      {
        status: 'nhap',
        changedBy: 'user@example.com',
        changedAt: new Date('2024-09-01'),
        note: 'Tạo hợp đồng mới'
      },
      {
        status: 'cho_duyet',
        changedBy: 'user@example.com',
        changedAt: new Date('2024-09-01T10:30:00'),
        note: 'Gửi hợp đồng để duyệt'
      }
    ]
  },
  {
    contractNumber: 'BH202409023456',
    chuXe: 'Trần Thị Bình',
    diaChi: 'TP.HCM',
    bienSo: '51G-67890',
    nhanHieu: 'Honda',
    soLoai: 'City',
    soKhung: 'VHBC234567890',
    soMay: 'VHBM876543210',
    ngayDKLD: '2022-05-20',
    namSanXuat: 2022,
    soChoNgoi: 5,
    giaTriXe: 550000000,
    loaiHinhKinhDoanh: 'khong_kd_cho_nguoi',
    loaiDongCo: 'GASOLINE',
    vatChatPackage: {
      name: 'Gói tiêu chuẩn',
      tyLePhi: 2.0,
      phiVatChat: 11000000,
      dkbs: ['TCAD', 'FLEX']
    },
    includeTNDS: true,
    tndsCategory: 'xe_duoi_6_cho',
    phiTNDS: 683000,
    includeNNTX: true,
    phiNNTX: 200000,
    tongPhi: 11883000,
    mucKhauTru: 2000000,
    status: 'khach_duyet',
    createdBy: 'user@example.com',
    createdAt: new Date('2024-09-02'),
    updatedAt: new Date('2024-09-02'),
    statusHistory: [
      {
        status: 'nhap',
        changedBy: 'user@example.com',
        changedAt: new Date('2024-09-02'),
        note: 'Tạo hợp đồng mới'
      },
      {
        status: 'cho_duyet',
        changedBy: 'user@example.com',
        changedAt: new Date('2024-09-02T14:15:00'),
        note: 'Gửi hợp đồng để duyệt'
      },
      {
        status: 'khach_duyet',
        changedBy: 'admin@example.com',
        changedAt: new Date('2024-09-02T16:30:00'),
        note: 'Admin đã duyệt hợp đồng'
      }
    ]
  },
  {
    contractNumber: 'BH202409034567',
    chuXe: 'Lê Văn Cường',
    diaChi: 'Đà Nẵng',
    bienSo: '43B-11111',
    nhanHieu: 'Mazda',
    soLoai: 'CX-5',
    soKhung: 'MAZD345678901',
    soMay: 'MAZM765432109',
    ngayDKLD: '2021-12-10',
    namSanXuat: 2021,
    soChoNgoi: 7,
    giaTriXe: 850000000,
    loaiHinhKinhDoanh: 'khong_kd_cho_nguoi',
    loaiDongCo: 'GASOLINE',
    vatChatPackage: {
      name: 'Gói cao cấp',
      tyLePhi: 2.5,
      phiVatChat: 21250000,
      dkbs: ['TCAD', 'FLEX', 'FLOOD']
    },
    includeTNDS: true,
    tndsCategory: 'xe_7_9_cho',
    phiTNDS: 974000,
    includeNNTX: true,
    phiNNTX: 200000,
    tongPhi: 22424000,
    mucKhauTru: 2000000,
    status: 'ra_hop_dong',
    createdBy: 'user@example.com',
    createdAt: new Date('2024-09-03'),
    updatedAt: new Date('2024-09-04'),
    statusHistory: [
      {
        status: 'nhap',
        changedBy: 'user@example.com',
        changedAt: new Date('2024-09-03'),
        note: 'Tạo hợp đồng mới'
      },
      {
        status: 'cho_duyet',
        changedBy: 'user@example.com',
        changedAt: new Date('2024-09-03T09:00:00'),
        note: 'Gửi hợp đồng để duyệt'
      },
      {
        status: 'khach_duyet',
        changedBy: 'admin@example.com',
        changedAt: new Date('2024-09-03T11:20:00'),
        note: 'Admin đã duyệt hợp đồng'
      },
      {
        status: 'ra_hop_dong',
        changedBy: 'admin@example.com',
        changedAt: new Date('2024-09-04T08:45:00'),
        note: 'Hoàn thành ra hợp đồng'
      }
    ]
  },
  {
    contractNumber: 'BH202409045678',
    chuXe: 'Phạm Thị Dung',
    diaChi: 'Hải Phòng',
    bienSo: '31A-22222',
    nhanHieu: 'Hyundai',
    soLoai: 'Accent',
    soKhung: 'HYUN456789012',
    soMay: 'HYUM654321098',
    ngayDKLD: '2023-08-15',
    namSanXuat: 2023,
    soChoNgoi: 5,
    giaTriXe: 480000000,
    loaiHinhKinhDoanh: 'khong_kd_cho_nguoi',
    loaiDongCo: 'GASOLINE',
    vatChatPackage: {
      name: 'Gói cơ bản',
      tyLePhi: 1.5,
      phiVatChat: 7200000,
      dkbs: ['TCAD']
    },
    includeTNDS: true,
    tndsCategory: 'xe_duoi_6_cho',
    phiTNDS: 683000,
    includeNNTX: true,
    phiNNTX: 200000,
    tongPhi: 8083000,
    mucKhauTru: 2000000,
    status: 'huy',
    createdBy: 'user@example.com',
    createdAt: new Date('2024-09-04'),
    updatedAt: new Date('2024-09-05'),
    statusHistory: [
      {
        status: 'nhap',
        changedBy: 'user@example.com',
        changedAt: new Date('2024-09-04'),
        note: 'Tạo hợp đồng mới'
      },
      {
        status: 'cho_duyet',
        changedBy: 'user@example.com',
        changedAt: new Date('2024-09-04T15:30:00'),
        note: 'Gửi hợp đồng để duyệt'
      },
      {
        status: 'huy',
        changedBy: 'user@example.com',
        changedAt: new Date('2024-09-05T10:00:00'),
        note: 'Khách hàng hủy hợp đồng'
      }
    ]
  },
  // Thêm một số hợp đồng cho tháng trước để có dữ liệu so sánh
  {
    contractNumber: 'BH202408011111',
    chuXe: 'Nguyễn Văn Một',
    diaChi: 'Hà Nội',
    bienSo: '29A-11111',
    nhanHieu: 'Toyota',
    soLoai: 'Camry',
    soKhung: 'TOYO567890123',
    soMay: 'TOYM543210987',
    ngayDKLD: '2023-03-01',
    namSanXuat: 2023,
    soChoNgoi: 5,
    giaTriXe: 1200000000,
    loaiHinhKinhDoanh: 'khong_kd_cho_nguoi',
    loaiDongCo: 'GASOLINE',
    vatChatPackage: {
      name: 'Gói cao cấp',
      tyLePhi: 2.5,
      phiVatChat: 30000000,
      dkbs: ['TCAD', 'FLEX', 'FLOOD']
    },
    includeTNDS: true,
    tndsCategory: 'xe_duoi_6_cho',
    phiTNDS: 683000,
    includeNNTX: true,
    phiNNTX: 200000,
    tongPhi: 30883000,
    mucKhauTru: 2000000,
    status: 'ra_hop_dong',
    createdBy: 'user@example.com',
    createdAt: new Date('2024-08-15'),
    updatedAt: new Date('2024-08-16'),
    statusHistory: [
      {
        status: 'nhap',
        changedBy: 'user@example.com',
        changedAt: new Date('2024-08-15'),
        note: 'Tạo hợp đồng mới'
      },
      {
        status: 'ra_hop_dong',
        changedBy: 'admin@example.com',
        changedAt: new Date('2024-08-16'),
        note: 'Hoàn thành ra hợp đồng'
      }
    ]
  },
  {
    contractNumber: 'BH202408022222',
    chuXe: 'Trần Thị Hai',
    diaChi: 'TP.HCM',
    bienSo: '50F-22222',
    nhanHieu: 'Honda',
    soLoai: 'CR-V',
    soKhung: 'HOND678901234',
    soMay: 'HONM432109876',
    ngayDKLD: '2022-11-20',
    namSanXuat: 2022,
    soChoNgoi: 7,
    giaTriXe: 980000000,
    loaiHinhKinhDoanh: 'khong_kd_cho_nguoi',
    loaiDongCo: 'GASOLINE',
    vatChatPackage: {
      name: 'Gói tiêu chuẩn',
      tyLePhi: 2.0,
      phiVatChat: 19600000,
      dkbs: ['TCAD', 'FLEX']
    },
    includeTNDS: true,
    tndsCategory: 'xe_7_9_cho',
    phiTNDS: 974000,
    includeNNTX: true,
    phiNNTX: 200000,
    tongPhi: 20774000,
    mucKhauTru: 2000000,
    status: 'ra_hop_dong',
    createdBy: 'user@example.com',
    createdAt: new Date('2024-08-20'),
    updatedAt: new Date('2024-08-21'),
    statusHistory: [
      {
        status: 'nhap',
        changedBy: 'user@example.com',
        changedAt: new Date('2024-08-20'),
        note: 'Tạo hợp đồng mới'
      },
      {
        status: 'ra_hop_dong',
        changedBy: 'admin@example.com',
        changedAt: new Date('2024-08-21'),
        note: 'Hoàn thành ra hợp đồng'
      }
    ]
  }
];

async function createSampleData() {
  const uri = 'mongodb://dev:dev123@localhost:27018/bhhv?authSource=admin';
  const client = new MongoClient(uri);

  try {
    await client.connect();
    console.log('✅ Kết nối MongoDB thành công!');

    const db = client.db('bhhv');
    const collection = db.collection('contracts');

    // Kiểm tra xem đã có dữ liệu mẫu chưa
    const existingContract = await collection.findOne({ contractNumber: 'BH202409012345' });
    if (existingContract) {
      console.log('⚠️  Dữ liệu mẫu đã tồn tại, bỏ qua việc tạo mới');
      return;
    }

    // Thêm dữ liệu mẫu
    const result = await collection.insertMany(sampleContracts);
    console.log(`✅ Đã tạo ${result.insertedCount} hợp đồng mẫu`);

    // Hiển thị thống kê sau khi thêm
    const totalCount = await collection.countDocuments();
    console.log(`📊 Tổng số hợp đồng hiện tại: ${totalCount}`);

    const statusStats = await collection.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]).toArray();

    console.log('\n📈 Phân bố trạng thái sau khi thêm:');
    statusStats.forEach(stat => console.log(`  - ${stat._id}: ${stat.count}`));

    const monthlyRevenue = await collection.aggregate([
      {
        $match: {
          status: 'ra_hop_dong',
          createdAt: { $gte: new Date('2024-09-01') }
        }
      },
      { $group: { _id: null, total: { $sum: '$tongPhi' } } }
    ]).toArray();

    console.log(`\n💰 Doanh thu tháng 9: ${monthlyRevenue[0]?.total?.toLocaleString() || 0} VNĐ`);

  } catch (error) {
    console.error('❌ Lỗi tạo dữ liệu mẫu:', error);
  } finally {
    await client.close();
  }
}

createSampleData();