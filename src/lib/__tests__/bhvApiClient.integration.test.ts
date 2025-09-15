/**
 * Integration test for BHV API Client with real contract data from data_curl/db.json
 */

import { BhvApiClient, bhvApiClient } from '../bhvApiClient';
import { transformContractToBhvFormat } from '../bhvDataMapper';

// Real contract data from data_curl/db.json
const realContractData = {
  "_id": { "$oid": "68c7931a318a809983d3e23d" },
  "chuXe": "CTY TNHH VTDV TM KIẾN HOÀNG -123",
  "diaChi": "79 Tô Ký P.TMT Q.12",
  "buyerEmail": "email@abc.com",
  "buyerPhone": "0982111222",
  "buyerGender": "nam",
  "buyerCitizenId": "123123123123",
  "selectedProvince": "eee52932-0358-47d5-9984-be1132c7f01",
  "selectedProvinceText": "Thành phố Hà Nội",
  "selectedDistrictWard": "6c24e5c0-1791-4c09-9810-00b80102277",
  "selectedDistrictWardText": "Huyện Chương Mỹ",
  "specificAddress": "123 nguyen van a",
  "bienSo": "50H-229.67",
  "nhanHieu": "MAZDA",
  "soLoai": "BT-50",
  "soKhung": "LGGX6D058ML305284",
  "soMay": "YC6L35050LG1L9M00117",
  "ngayDKLD": "10/03/2023",
  "namSanXuat": 2021,
  "soChoNgoi": 2,
  "trongTai": 17990,
  "giaTriXe": 800000000,
  "loaiHinhKinhDoanh": "khong_kd_cho_nguoi",
  "loaiDongCo": "2cdc787a-207b-4e8c-b56d-ae016f1c2c94",
  "giaTriPin": 20000000,
  "carBrand": "MAZDA",
  "carModel": "BT-50",
  "carBodyStyle": "PICK-UP",
  "carYear": "4X4 2.2L",
  "vatChatPackage": {
    "name": "Gói AU001 + AU002 + AU006 + AU009",
    "tyLePhi": 1.1500000000000001,
    "customRate": 1.2,
    "isCustomRate": true,
    "phiVatChatGoc": 10250000.000000002,
    "phiVatChat": 9840000,
    "dkbs": [
      "- AU001: Mới thay cũ",
      "- AU002: Lựa chọn cơ sở sửa chữa",
      "- AU006: Thủy kích",
      "- AU009: Mất cắp bộ phận"
    ]
  },
  "includeTNDS": true,
  "tndsCategory": "duoi_6_cho_khong_kd",
  "phiTNDS": 480700,
  "includeNNTX": true,
  "phiNNTX": 40000,
  "phiPin": 0,
  "taiTucPercentage": 0.1,
  "phiTaiTuc": 820000,
  "phiTruocKhiGiam": 11590700.000000002,
  "phiSauKhiGiam": 11180700,
  "tongPhi": 11180700,
  "mucKhauTru": 500000,
  "status": "nhap",
  "createdBy": "68b7b4bd59e71097aac048ab",
  "contractNumber": "BH202509159553"
};

// Mock successful BHV response based on real response structure
const mockSuccessResponse = {
  "data": "JVBERi0xLjcNJcjIyMjIyMgNJSAgIAoxIDAgb2JqCjw8L0F1dGhvcihcMzc2XDM3N1wwMDBCXDAzNlwyNDJcMDAwT1wwMDAgXDAwMEhcMDAwSVwwMzZcMzAyXDAwME1cMDAwIFwwMDBIXDAwMFwzMzFcMDAwTlwwMDBHXDAwMCBcMDAwVlwwMDFcMjU3XDAwMVwyNDBcMDAwTlwwMDBHKS9DcmVhdG9yKFwzNzZcMzc3XDAwMENcMDAwXDMyNFwwMDBOXDAwMEdcMDAwIFwwMDBUXDAwMFlcMDAwIFwwMDBDXDAzNlwzMjRcMDAwIFwwMDBQXDAwMEhcMDM2XDI0NlwwMDBOXDAwMCBcMDAwQlwwMzZcMjQyXDAwME9cMDAwIFwwMDBIXDAwMElcMDM2XDMwMlwwMDBNXDAwMCBcMDAwSFwwMDBcMzMxXDAwME5cMDAwR1wwMDAgXDAwMFZcMDAxXDI1N1wwMDFcMjQwXDAwME5cMDAwRykvUHJvZHVjZXIoXDM3NlwzNzdcMDAwQlwwMzZcMjQyXDAwME9cMDAwIFwwMDBIXDAwMElcMDM2XDMwMlwwMDBNXDAwMCBcMDAwSFwwMDBcMzMxXDAwME5cMDAwR1wwMDAgXDAwMFZcMDAxXDI1N1wwMDFcMjQwXDAwME5cMDAwRykvQ3JlYXRpb25EYXRlKEQ6MjAyNTA5MTUxNjEyNTgrMDcnMDAnKS9Nb2REYXRlKEQ6MjAyNTA5MTUxNjEyNTgrMDcnMDAnKS9UaXRsZShcMzc2XDM3N1wwMDBCXDAzNlwyNDJcMDAwT1wwMDAgXDAwMEhcMDAwSVwwMzZcMzAyXDAwME1cMDAwIFwwMDBIXDAwMFwzMzFcMDAwTlwwMDBHXDAwMCBcMDAwVlwwMDFcMjU3XDAwMVwyNDBcMDAwTlwwMDBHKT4+DQplbmRvYmoKMiAwIG9iago8PC9UeXBlL0NhdGFsb2cvUGFnZXMgMyAwIFIvTGFuZyhlbi1VUykvTWV0YWRhdGEgNCAwIFI+Pg0KZW5kb2JqCjMgMCBvYmoKPDwvVHlwZS9QYWdlcy9Db3VudCAyL0tpZHNbNSAwIFIgNDUgMCBSXS9EZWZhdWx0VmFsdWUoR3lrcU5Tay9kQW9lSEhvOE5TaDZkQlFmRG5wb2FYUmlkR289KT4+DQplbmRvYmoK", // Truncated for brevity, starts with %PDF
  "status_code": 200
};

// Mock error response
const mockErrorResponse = {
  "status_code": 400,
  "error": "Invalid request data"
};

describe('BHV API Client - Integration Test with Real Data', () => {

  beforeEach(() => {
    // Clear any existing mocks
    jest.clearAllMocks();
  });

  test('Transform real contract data for BHV submission', () => {
    console.log('\n🔄 TRANSFORMING REAL CONTRACT DATA');
    console.log('Contract Number:', realContractData.contractNumber);
    console.log('Vehicle:', realContractData.carBrand, realContractData.carModel);
    console.log('Insurance Packages:', realContractData.vatChatPackage.dkbs.length, 'items');

    // Transform the real contract data
    const bhvRequestData = transformContractToBhvFormat(realContractData);

    // Verify basic structure
    expect(bhvRequestData.action_name).toBe('vehicle/transport/review');
    expect(bhvRequestData.data).toBeDefined();
    expect(typeof bhvRequestData.data).toBe('string');

    // Parse and verify the data
    const parsedData = JSON.parse(bhvRequestData.data);

    console.log('\n📊 TRANSFORMED DATA VALIDATION:');
    console.log('✓ Product ID:', parsedData.product_id);
    console.log('✓ Car Automaker:', parsedData.car_automaker);
    console.log('✓ Car Goal:', parsedData.car_goal);
    console.log('✓ Car Seat:', parsedData.car_seat);
    console.log('✓ Total Premium:', parsedData.total_premium);

    // Verify key mappings from real data
    expect(parsedData.car_automaker).toBe("b07cadc0-b84d-4863-b374-fe018b3194c111"); // MAZDA
    expect(parsedData.car_goal).toBe("6ee07aa2-43bd-4141-b6d2-49f8f6cfe1a1"); // khong_kd_cho_nguoi
    expect(parsedData.car_seat).toBe("33d227b2-dbb9-4fdf-9cf7-b0fa843d5449"); // 2 seats
    expect(parsedData.buyer_gender).toBe("NAM"); // Uppercase conversion
    expect(parsedData.total_premium).toBe("11180700");

    // Verify insurance options are mapped correctly
    const insuranceUUIDs = Object.keys(parsedData).filter(key => key.includes('-'));
    expect(insuranceUUIDs.length).toBe(4); // AU001, AU002, AU006, AU009

    console.log('✓ Insurance Options:', insuranceUUIDs.length);
    console.log('✓ All required fields present');
  });

  test('Handle successful BHV API response (mocked)', async () => {
    console.log('\n✅ TESTING SUCCESSFUL RESPONSE HANDLING');

    // Mock fetch to return successful response
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: jest.fn().mockResolvedValue(mockSuccessResponse),
      headers: new Headers()
    });

    const client = new BhvApiClient();
    const bhvRequestData = transformContractToBhvFormat(realContractData);

    const result = await client.submitContract(bhvRequestData);

    console.log('Response Success:', result.success);
    console.log('Has PDF Data:', !!result.pdfBase64);
    console.log('PDF Length:', result.pdfBase64?.length || 0, 'characters');

    // Verify successful response handling
    expect(result.success).toBe(true);
    expect(result.pdfBase64).toBeDefined();
    expect(result.rawResponse.status_code).toBe(200);

    // Verify PDF validation
    expect(client.isValidPdfBase64(result.pdfBase64!)).toBe(true);

    console.log('✓ PDF validation passed');
  });

  test('Handle error BHV API response (mocked)', async () => {
    console.log('\n❌ TESTING ERROR RESPONSE HANDLING');

    // Mock fetch to return error response
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: jest.fn().mockResolvedValue(mockErrorResponse),
      headers: new Headers()
    });

    const client = new BhvApiClient();
    const bhvRequestData = transformContractToBhvFormat(realContractData);

    const result = await client.submitContract(bhvRequestData);

    console.log('Response Success:', result.success);
    console.log('Error Message:', result.error);

    // Verify error response handling
    expect(result.success).toBe(false);
    expect(result.error).toContain('Status 400');
    expect(result.pdfBase64).toBeUndefined();

    console.log('✓ Error handling verified');
  });

  test('Handle network error', async () => {
    console.log('\n🌐 TESTING NETWORK ERROR HANDLING');

    // Mock fetch to throw network error
    global.fetch = jest.fn().mockRejectedValue(new Error('Network error'));

    const client = new BhvApiClient();
    const bhvRequestData = transformContractToBhvFormat(realContractData);

    const result = await client.submitContract(bhvRequestData);

    console.log('Response Success:', result.success);
    console.log('Error Message:', result.error);

    // Verify network error handling
    expect(result.success).toBe(false);
    expect(result.error).toBe('Network error');

    console.log('✓ Network error handling verified');
  });

  test('Validate request data structure', () => {
    console.log('\n🔍 REQUEST DATA STRUCTURE VALIDATION');

    const bhvRequestData = transformContractToBhvFormat(realContractData);
    const parsedData = JSON.parse(bhvRequestData.data);

    // Verify all required fields are present
    const requiredFields = [
      'product_id',
      'car_year_buy',
      'get_fee_mode',
      'kind_customer',
      'chk_agree_term',
      'car_automaker',
      'car_goal',
      'car_seat',
      'buyer_email',
      'buyer_phone',
      'buyer_gender',
      'buyer_identity_card',
      'car_number_plate',
      'car_chassis',
      'car_number_engine',
      'total_premium'
    ];

    const missingFields = requiredFields.filter(field => !parsedData[field]);

    console.log('Required fields check:');
    console.log('- Total required:', requiredFields.length);
    console.log('- Missing fields:', missingFields.length);

    if (missingFields.length > 0) {
      console.log('- Missing:', missingFields);
    }

    expect(missingFields.length).toBe(0);

    // Verify insurance options are properly formatted
    const insuranceOptions = Object.keys(parsedData).filter(key =>
      key.match(/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/)
    );

    console.log('- Insurance options:', insuranceOptions.length);
    expect(insuranceOptions.length).toBe(4);

    console.log('✓ All validations passed');
  });

  test('PDF validation with real PDF header', () => {
    console.log('\n📄 PDF VALIDATION TEST');

    const client = new BhvApiClient();

    // Test with mock PDF data (starts with %PDF)
    const validPdfBase64 = mockSuccessResponse.data;
    const isValid = client.isValidPdfBase64(validPdfBase64);

    console.log('PDF Base64 length:', validPdfBase64.length);
    console.log('Starts with PDF header:', isValid);

    expect(isValid).toBe(true);

    // Test with invalid data
    const invalidBase64 = 'invaliddata123';
    const isInvalid = client.isValidPdfBase64(invalidBase64);

    console.log('Invalid data correctly rejected:', !isInvalid);
    expect(isInvalid).toBe(false);

    console.log('✓ PDF validation working correctly');
  });

  afterEach(() => {
    // Restore original fetch
    if (global.fetch && jest.isMockFunction(global.fetch)) {
      (global.fetch as jest.Mock).mockRestore();
    }
  });

});

// Test summary
console.log('\n📋 INTEGRATION TEST SUMMARY');
console.log('Testing BHV API Client with real contract data from data_curl/db.json');
console.log('- Contract Number: BH202509159553');
console.log('- Vehicle: MAZDA BT-50 PICK-UP');
console.log('- Premium: 11,180,700 VND');
console.log('- Insurance Packages: 4 items (AU001, AU002, AU006, AU009)');