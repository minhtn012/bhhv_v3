/**
 * Test Script - Export All Templates with Sample Data
 *
 * This script tests the Word export functionality by generating
 * all 3 template types with sample contract data.
 */

const fs = require('fs');
const path = require('path');

// Import the word contract service
const { generateWordContract } = require('../src/lib/wordContractService');

// Sample contract data with all fields
const sampleContractData = {
  // Basic info
  contractNumber: 'BH20251002TEST',
  bhvContractNumber: 'BHV2025TEST123',
  chuXe: 'Nguyễn Văn A',
  diaChi: '123 Đường ABC, Quận 1, TP.HCM',
  loaiKhachHang: 'ca_nhan', // or 'cong_ty'

  // Vehicle info
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

  // Buyer info
  buyerEmail: 'nguyenvana@example.com',
  buyerPhone: '0901234567',
  buyerGender: 'nam',
  buyerCitizenId: '001234567890',
  selectedProvinceText: 'TP. Hồ Chí Minh',
  selectedDistrictWardText: 'Quận 1, Phường Bến Nghé',
  specificAddress: '123 Đường ABC',

  // Insurance packages
  vatChatPackage: {
    name: 'Gói Cao Cấp',
    tyLePhi: 2.5,
    customRate: 2.3,
    isCustomRate: true,
    phiVatChatGoc: 12500000,
    phiVatChat: 11500000,
    dkbs: [
      'Bảo hiểm vật chất xe',
      'Bảo hiểm trách nhiệm dân sự',
      'Bảo hiểm tai nạn người ngồi trên xe',
      'Hỗ trợ cứu hộ 24/7',
      'Bồi thường trong vòng 48 giờ'
    ]
  },

  // TNDS
  includeTNDS: true,
  tndsCategory: 'xe-du-5-cho',
  tndsPackage: {
    phiBatBuoc: 550000
  },

  // NNTX (Tai nan nguoi tren xe)
  includeNNTX: true,
  phiNNTX: 10000, // Will be matched to "10.000.000 đồng/người/vụ"

  // Fees
  tongPhiBaoHiem: 12060000,
  mucKhauTru: 500000,
  phiTruocKhiGiam: 13500000,
  phiSauKhiGiam: 12060000,

  // Insurance dates
  ngayBatDauBaoHiem: '2025-09-27',
  ngayKetThucBaoHiem: '2026-09-27',

  // Status history for payment deadline calculation
  statusHistory: [
    {
      status: 'nhap',
      changedBy: 'user123',
      changedAt: new Date('2025-09-20'),
      note: 'Tạo hợp đồng'
    },
    {
      status: 'bhv_confirmed',
      changedBy: 'system',
      changedAt: new Date('2025-10-01'), // Payment deadline = 11/10/2025 (ca_nhan +10 days)
      note: 'BHV confirmed'
    }
  ],

  // Metadata
  createdBy: 'user123',
  createdAt: '2025-09-20',
  updatedAt: '2025-10-01',
  status: 'bhv_confirmed'
};

// Sample bank info for 3-party contract
const sampleBankInfo = {
  bankName: 'Ngân hàng TMCP Á Châu (ACB)',
  bankOldAddress: 'Chi nhánh Sài Gòn, 442 Nguyễn Thị Minh Khai, Quận 3',
  bankNewAddress: 'Chi nhánh Quận 1, 123 Lê Lợi, Quận 1, TP.HCM'
};

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
      // Generate the Word document
      const buffer = await generateWordContract(
        testCase.data,
        testCase.contractType,
        testCase.bankInfo
      );

      // Save to test/export folder
      const outputPath = path.join(__dirname, 'export', testCase.filename);
      fs.writeFileSync(outputPath, buffer);

      console.log(`✅ Success! Saved to: test/export/${testCase.filename}`);
      console.log(`   Contract Type: ${testCase.contractType}`);
      console.log(`   TNDS: ${testCase.data.includeTNDS ? 'Yes' : 'No'}`);
      console.log(`   NNTX: ${testCase.data.includeNNTX ? 'Yes' : 'No'}`);
      console.log(`   Payment Deadline: Should be 11/10/2025 (ca_nhan +10 days)`);

    } catch (error) {
      console.error(`❌ Error: ${error.message}`);
      console.error(error.stack);
    }
  }

  console.log('\n' + '='.repeat(70));
  console.log('✅ Test Complete!\n');
  console.log('📂 Check exported files in: test/export/');
  console.log('\nGenerated files:');
  console.log('  - test-2ben-vcx.docx (2-party without TNDS)');
  console.log('  - test-2ben-vcx-tnds.docx (2-party with TNDS)');
  console.log('  - test-3ben.docx (3-party with bank info)\n');
  console.log('Expected variables to check:');
  console.log('  ✓ {dkbs} - Insurance conditions list');
  console.log('  ✓ {batDau_Gio}, {batDau_Ngay}, etc. - Date parts (should be BOLD)');
  console.log('  ✓ {ketThuc_Gio}, {ketThuc_Ngay}, etc. - Date parts (should be BOLD)');
  console.log('  ✓ {paymentDeadline} - Should show: 11/10/2025');
  console.log('  ✓ {trachNhiemBH} - Should show: 10.000.000 đồng/người/vụ\n');
}

// Run the test
testExport().catch(error => {
  console.error('Test failed:', error);
  process.exit(1);
});
