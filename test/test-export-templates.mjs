/**
 * Test Script - Export All Templates with Sample Data
 * Using ESM import to work with TypeScript files
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import PizZip from 'pizzip';
import Docxtemplater from 'docxtemplater';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load NNTX packages
async function loadNNTXPackages() {
  const packageData = JSON.parse(
    fs.readFileSync(path.join(__dirname, '../db_json/car_package.json'), 'utf-8')
  );
  return packageData;
}

// Get NNTX package name from fee
async function getNNTXPackageName(phiNNTX, soChoNgoi, loaiHinhKinhDoanh) {
  if (!phiNNTX || phiNNTX === 0) return '-';

  try {
    const carPackage = await loadNNTXPackages();
    const isBusinessVehicle = loaiHinhKinhDoanh?.startsWith('kd_') || false;

    for (const pkg of carPackage) {
      const packagePrice = isBusinessVehicle ? (pkg.price_kd || pkg.price) : pkg.price;
      const baseFee = packagePrice;
      const seatMultiplier = soChoNgoi <= 6 ? 1 : soChoNgoi <= 12 ? 1.5 : 2;
      const calculatedFee = baseFee * seatMultiplier;

      if (Math.abs(calculatedFee - phiNNTX) < 1) {
        return pkg.name;
      }
    }

    return `${phiNNTX.toLocaleString('vi-VN')} VNĐ`;
  } catch (error) {
    console.error('Error getting NNTX package name:', error);
    return '-';
  }
}

// Format date to Vietnamese
function formatVietnameseDateTime(dateInput) {
  const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;

  if (!date || isNaN(date.getTime())) {
    return { hour: '-', minute: '-', day: '-', month: '-', year: '-', full: '-' };
  }

  const hour = '08';
  const minute = '00';
  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const year = date.getFullYear().toString();

  const full = `${hour} giờ ${minute} ngày ${day} tháng ${month} năm ${year}`;

  return { hour, minute, day, month, year, full };
}

// Calculate payment deadline
function calculatePaymentDeadline(statusHistory, loaiKhachHang) {
  if (!statusHistory || statusHistory.length === 0) return '-';

  const bhvConfirmedEntry = statusHistory.find(entry => entry.status === 'bhv_confirmed');
  if (!bhvConfirmedEntry || !bhvConfirmedEntry.changedAt) return '-';

  const confirmedDate = new Date(bhvConfirmedEntry.changedAt);
  const daysToAdd = loaiKhachHang === 'cong_ty' ? 15 : 10;

  const deadlineDate = new Date(confirmedDate);
  deadlineDate.setDate(deadlineDate.getDate() + daysToAdd);

  const day = deadlineDate.getDate().toString().padStart(2, '0');
  const month = (deadlineDate.getMonth() + 1).toString().padStart(2, '0');
  const year = deadlineDate.getFullYear();

  return `${day}/${month}/${year}`;
}

// Format DKBS
function formatDkbs(dkbs) {
  if (!dkbs || dkbs.length === 0) return '-';
  return dkbs.map((item, index) => `${index + 1}. ${item}`).join('\n');
}

// Generate Word contract
async function generateWordContract(contractData, contractType = '2-party', bankInfo = null) {
  // Determine template path
  let templateFileName;
  if (contractType === '3-party') {
    templateFileName = 'templates/3ben.docx';
  } else {
    templateFileName = contractData.includeTNDS
      ? 'templates/2ben_vcx_tnns.docx'
      : 'templates/2ben_vcx.docx';
  }

  const templatePath = path.join(__dirname, '..', templateFileName);
  const content = fs.readFileSync(templatePath, 'binary');

  const currentDate = new Date();

  // Get NNTX package name
  const trachNhiemBH = contractData.includeNNTX && contractData.phiNNTX
    ? await getNNTXPackageName(contractData.phiNNTX, contractData.soChoNgoi || 0, contractData.loaiHinhKinhDoanh)
    : '-';

  // Format dates
  const batDauDate = contractData.ngayBatDauBaoHiem ? formatVietnameseDateTime(contractData.ngayBatDauBaoHiem) : null;
  const ketThucDate = contractData.ngayKetThucBaoHiem ? formatVietnameseDateTime(contractData.ngayKetThucBaoHiem) : null;

  // Map contract data to template variables
  const templateData = {
    // Current date
    currentDay: currentDate.getDate().toString().padStart(2, '0'),
    currentMonth: (currentDate.getMonth() + 1).toString().padStart(2, '0'),
    currentYear: currentDate.getFullYear().toString(),

    // Basic info
    c_chuXe: contractData.chuXe || '-',
    c_bienSo: contractData.bienSo || '-',
    c_loaiXe: contractData.nhanHieu || '-',
    c_soLoai: contractData.soLoai || '-',
    c_carBodyStyle: contractData.carBodyStyle || '-',
    c_contractNumber: contractData.bhvContractNumber || contractData.contractNumber || '-',
    c_carBrand: contractData.carBrand || contractData.nhanHieu || '-',
    c_carModel: contractData.carModel || contractData.soLoai || '-',

    diaChi: contractData.diaChi || '-',
    soHD: contractData.bhvContractNumber || '-',
    loaiXe: contractData.nhanHieu || '-',
    namSanXuat: contractData.namSanXuat || '-',
    soKhung: contractData.soKhung || '-',
    soMay: contractData.soMay || '-',
    soChoNgoi: contractData.soChoNgoi || '-',
    soCho: contractData.soChoNgoi || '-',
    giaTriXe: contractData.giaTriXe ? contractData.giaTriXe.toLocaleString('vi-VN') : '-',

    // Insurance fees
    phiBatBuoc: contractData.tndsPackage?.phiBatBuoc ? contractData.tndsPackage.phiBatBuoc.toLocaleString('vi-VN') : '-',
    phiTNDS: contractData.tndsPackage?.phiBatBuoc ? contractData.tndsPackage.phiBatBuoc.toLocaleString('vi-VN') : '-',
    phiNNTX: contractData.phiNNTX ? contractData.phiNNTX.toLocaleString('vi-VN') : '-',
    phiVatChat: contractData.vatChatPackage?.phiVatChat ? contractData.vatChatPackage.phiVatChat.toLocaleString('vi-VN') : '-',
    phiSauKhiGiam: contractData.tongPhiBaoHiem ? contractData.tongPhiBaoHiem.toLocaleString('vi-VN') : '-',
    tongPhi: contractData.tongPhiBaoHiem ? contractData.tongPhiBaoHiem.toLocaleString('vi-VN') : '-',
    mucKhauTru: contractData.vatChatPackage?.mucKhauTru ? contractData.vatChatPackage.mucKhauTru.toLocaleString('vi-VN') : '500,000',

    // Dates
    ngayBatDau: contractData.ngayBatDau || '-',
    ngayKetThuc: contractData.ngayKetThuc || '-',
    ngayDKLD: contractData.ngayDKLD || '-',

    // Insurance period dates
    ngayBatDauBaoHiem: batDauDate?.full || '-',
    ngayKetThucBaoHiem: ketThucDate?.full || '-',

    batDau_Gio: batDauDate?.hour || '-',
    batDau_Phut: batDauDate?.minute || '-',
    batDau_Ngay: batDauDate?.day || '-',
    batDau_Thang: batDauDate?.month || '-',
    batDau_Nam: batDauDate?.year || '-',

    ketThuc_Gio: ketThucDate?.hour || '-',
    ketThuc_Phut: ketThucDate?.minute || '-',
    ketThuc_Ngay: ketThucDate?.day || '-',
    ketThuc_Thang: ketThucDate?.month || '-',
    ketThuc_Nam: ketThucDate?.year || '-',

    // Payment deadline
    paymentDeadline: contractData.statusHistory
      ? calculatePaymentDeadline(contractData.statusHistory, contractData.loaiKhachHang)
      : '-',

    // DKBS
    dkbs: formatDkbs(contractData.vatChatPackage?.dkbs),

    // NNTX package
    trachNhiemBH: trachNhiemBH,

    // Buyer info
    buyerEmail: contractData.buyerEmail || '-',
    buyerPhone: contractData.buyerPhone || '-',
    buyerCitizenId: contractData.buyerCitizenId || '-',

    // Bank info
    c_bankName: bankInfo?.bankName || '-',
    bankOldAddress: bankInfo?.bankOldAddress || '-',
    bankNewAddress: bankInfo?.bankNewAddress || '-',

    // Others
    trongTai: contractData.trongTai || '-',
    loaiDongCo: contractData.loaiDongCo || '-',
  };

  const zip = new PizZip(content);
  const doc = new Docxtemplater(zip, {
    paragraphLoop: true,
    linebreaks: true,
    nullGetter: () => '',
  });

  doc.render(templateData);

  const buf = doc.getZip().generate({
    type: 'nodebuffer',
    compression: 'DEFLATE',
  });

  return buf;
}

// Sample data
const sampleContractData = {
  contractNumber: 'BH20251002TEST',
  bhvContractNumber: 'BHV2025TEST123',
  chuXe: 'Nguyễn Văn A',
  diaChi: '123 Đường ABC, Quận 1, TP.HCM',
  loaiKhachHang: 'ca_nhan',

  bienSo: '51A-12345',
  nhanHieu: 'Toyota',
  soLoai: 'Vios',
  carBodyStyle: 'Sedan',
  carBrand: 'Toyota',
  carModel: 'Vios',
  carYear: '2023',
  soKhung: 'ABC123456789',
  soMay: 'XYZ987654321',
  namSanXuat: 2023,
  soChoNgoi: 5,
  trongTai: 1500,
  giaTriXe: 500000000,
  loaiHinhKinhDoanh: 'khong_kd_cho_nguoi',
  loaiDongCo: 'xang',
  giaTriPin: 0,
  ngayDKLD: '2023-01-15',

  buyerEmail: 'nguyenvana@example.com',
  buyerPhone: '0901234567',
  buyerGender: 'nam',
  buyerCitizenId: '001234567890',

  vatChatPackage: {
    name: 'Gói Cao Cấp',
    tyLePhi: 2.5,
    phiVatChat: 11500000,
    mucKhauTru: 500000,
    dkbs: [
      'Bảo hiểm vật chất xe',
      'Bảo hiểm trách nhiệm dân sự',
      'Bảo hiểm tai nạn người ngồi trên xe',
      'Hỗ trợ cứu hộ 24/7',
      'Bồi thường trong vòng 48 giờ'
    ]
  },

  includeTNDS: true,
  tndsPackage: { phiBatBuoc: 550000 },

  includeNNTX: true,
  phiNNTX: 10000,

  tongPhiBaoHiem: 12060000,

  ngayBatDauBaoHiem: '2025-09-27',
  ngayKetThucBaoHiem: '2026-09-27',

  statusHistory: [
    {
      status: 'bhv_confirmed',
      changedBy: 'system',
      changedAt: new Date('2025-10-01'),
    }
  ],
};

const sampleBankInfo = {
  bankName: 'Ngân hàng TMCP Á Châu (ACB)',
  bankOldAddress: 'Chi nhánh Sài Gòn, 442 Nguyễn Thị Minh Khai, Quận 3',
  bankNewAddress: 'Chi nhánh Quận 1, 123 Lê Lợi, Quận 1, TP.HCM'
};

// Run test
async function testExport() {
  console.log('\n🧪 Testing Word Template Export\n');
  console.log('='.repeat(70));

  const testCases = [
    {
      name: '2-party VCX (without TNDS)',
      contractType: '2-party',
      filename: 'test-2ben-vcx.docx',
      data: { ...sampleContractData, includeTNDS: false },
      bankInfo: null
    },
    {
      name: '2-party VCX + TNDS',
      contractType: '2-party',
      filename: 'test-2ben-vcx-tnds.docx',
      data: { ...sampleContractData, includeTNDS: true },
      bankInfo: null
    },
    {
      name: '3-party with Bank',
      contractType: '3-party',
      filename: 'test-3ben.docx',
      data: sampleContractData,
      bankInfo: sampleBankInfo
    }
  ];

  for (const testCase of testCases) {
    console.log(`\n📝 Testing: ${testCase.name}`);
    console.log('-'.repeat(70));

    try {
      const buffer = await generateWordContract(
        testCase.data,
        testCase.contractType,
        testCase.bankInfo
      );

      const outputPath = path.join(__dirname, 'export', testCase.filename);
      fs.writeFileSync(outputPath, buffer);

      console.log(`✅ Success! Saved to: test/export/${testCase.filename}`);
      console.log(`   Contract Type: ${testCase.contractType}`);
      console.log(`   TNDS: ${testCase.data.includeTNDS ? 'Yes' : 'No'}`);
      console.log(`   NNTX: ${testCase.data.includeNNTX ? 'Yes' : 'No'}`);
      console.log(`   Payment Deadline: 11/10/2025 (ca_nhan +10 days)`);

    } catch (error) {
      console.error(`❌ Error: ${error.message}`);
      console.error(error.stack);
    }
  }

  console.log('\n' + '='.repeat(70));
  console.log('✅ Test Complete!\n');
  console.log('📂 Exported files in: test/export/\n');
  console.log('Expected variables:');
  console.log('  ✓ {dkbs} - Insurance conditions list');
  console.log('  ✓ {batDau_Gio}, {batDau_Ngay}, etc. - Date parts');
  console.log('  ✓ {paymentDeadline} - 11/10/2025');
  console.log('  ✓ {trachNhiemBH} - 10.000.000 đồng/người/vụ\n');
}

testExport().catch(error => {
  console.error('Test failed:', error);
  process.exit(1);
});
