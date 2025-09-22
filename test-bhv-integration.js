const { connectToDatabase } = require('./src/lib/mongodb');
const Contract = require('./src/models/Contract').default;

async function testBhvIntegration() {
  try {
    console.log('🔄 Testing BHV integration...');

    // Connect to database
    await connectToDatabase();

    // Create a test contract
    const testContract = new Contract({
      contractNumber: `TEST${Date.now()}`,
      chuXe: 'Test User',
      diaChi: 'Test Address',
      bienSo: '30A12345',
      nhanHieu: 'Toyota',
      soLoai: 'Camry',
      soKhung: 'TEST123',
      soMay: 'ENGINE123',
      ngayDKLD: '2023-01-01',
      namSanXuat: 2023,
      soChoNgoi: 5,
      giaTriXe: 500000000,
      loaiHinhKinhDoanh: 'khong_kd_cho_nguoi',
      loaiDongCo: 'gasoline',
      carBrand: 'Toyota',
      carModel: 'Camry',
      vatChatPackage: {
        name: 'Gói cơ bản',
        tyLePhi: 1.2,
        phiVatChat: 6000000,
        dkbs: []
      },
      includeTNDS: true,
      tndsCategory: 'car_under_10_seats',
      phiTNDS: 356800,
      includeNNTX: true,
      phiNNTX: 100000,
      tongPhi: 6456800,
      mucKhauTru: 500000,
      createdBy: 'test-user'
    });

    // Save contract to trigger the background BHV check
    await testContract.save();
    console.log('✅ Test contract created:', testContract.contractNumber);

    // Wait a bit to see if background process runs
    setTimeout(async () => {
      try {
        const updatedContract = await Contract.findById(testContract._id);
        console.log('📊 BHV Premiums status:');
        console.log(updatedContract.bhvPremiums || 'Not yet processed');

        // Clean up
        await Contract.findByIdAndDelete(testContract._id);
        console.log('🧹 Test contract cleaned up');
        process.exit(0);
      } catch (error) {
        console.error('Error checking results:', error);
        process.exit(1);
      }
    }, 5000);

  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

testBhvIntegration();