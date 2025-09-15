/**
 * Test BHV Data Mapper with real contract data
 */

import {
  mapInsuranceOptions,
  mapVehicleGoal,
  mapCarAutomaker,
  mapCarSeat,
  transformContractToBhvFormat
} from '../bhvDataMapper';

// Real contract data from data_curl/db.json
const testContractData = {
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
  "tongPhi": 11180700
};

describe('BHV Data Mapper Tests', () => {

  test('mapInsuranceOptions should extract AU codes and return UUIDs', () => {
    const dkbs = [
      "- AU001: Mới thay cũ",
      "- AU002: Lựa chọn cơ sở sửa chữa",
      "- AU006: Thủy kích",
      "- AU009: Mất cắp bộ phận"
    ];

    const result = mapInsuranceOptions(dkbs);

    console.log('Insurance Options Mapping:');
    console.log(JSON.stringify(result, null, 2));

    // Should have 4 insurance options
    expect(Object.keys(result).length).toBe(4);

    // Check specific UUIDs
    expect(result["e174526c-5a23-4aca-8d9f-ea198dc6b874"]).toBe("e174526c-5a23-4aca-8d9f-ea198dc6b874"); // AU001
    expect(result["5eab040c-901d-4f4c-a3be-11e6b6fad9a1"]).toBe("5eab040c-901d-4f4c-a3be-11e6b6fad9a1"); // AU002
    expect(result["6ea497a9-df0a-49f8-9d92-3dcf0ef53645"]).toBe("6ea497a9-df0a-49f8-9d92-3dcf0ef53645"); // AU006
    expect(result["c42582c5-c95b-4d92-8a3b-c5770775d3bf"]).toBe("c42582c5-c95b-4d92-8a3b-c5770775d3bf"); // AU009
  });

  test('mapVehicleGoal should map business type correctly', () => {
    // Test non-business type
    const nonBusinessResult = mapVehicleGoal("khong_kd_cho_nguoi");
    expect(nonBusinessResult).toBe("6ee07aa2-43bd-4141-b6d2-49f8f6cfe1a1");

    // Test business type
    const businessResult = mapVehicleGoal("kd_grab_be");
    expect(businessResult).toBe("6ee07aa2-43bd-4141-b6d2-49f8f6cfe1a2");

    console.log('Vehicle Goal Mapping:');
    console.log('khong_kd_cho_nguoi ->', nonBusinessResult);
    console.log('kd_grab_be ->', businessResult);
  });

  test('mapCarAutomaker should map MAZDA correctly', () => {
    const result = mapCarAutomaker("MAZDA");
    expect(result).toBe("b07cadc0-b84d-4863-b374-fe018b3194c111");

    console.log('Car Automaker Mapping:');
    console.log('MAZDA ->', result);
  });

  test('mapCarSeat should map 2 seats correctly', () => {
    const result = mapCarSeat(2);
    expect(result).toBe("33d227b2-dbb9-4fdf-9cf7-b0fa843d5449");

    console.log('Car Seat Mapping:');
    console.log('2 seats ->', result);
  });

  test('transformContractToBhvFormat should generate complete BHV request', () => {
    const result = transformContractToBhvFormat(testContractData);

    console.log('\n=== COMPLETE BHV API REQUEST ===');
    console.log(JSON.stringify(result, null, 2));

    // Verify basic structure
    expect(result.action_name).toBe("vehicle/transport/review");
    expect(result.data).toBeDefined();
    expect(result.d_info).toBeDefined();

    // Parse the data string
    const parsedData = JSON.parse(result.data);

    // Verify fixed constants
    expect(parsedData.product_id).toBe("3588e406-6f89-4a14-839b-64460bbcea67");
    expect(parsedData.car_year_buy).toBe("53d91be0-a641-4309-bd6b-e76befbe4e70");
    expect(parsedData.get_fee_mode).toBe("tu_dong");

    // Verify mapped data
    expect(parsedData.car_automaker).toBe("b07cadc0-b84d-4863-b374-fe018b3194c111"); // MAZDA
    expect(parsedData.car_goal).toBe("6ee07aa2-43bd-4141-b6d2-49f8f6cfe1a1"); // khong_kd_cho_nguoi
    expect(parsedData.car_seat).toBe("33d227b2-dbb9-4fdf-9cf7-b0fa843d5449"); // 2 seats

    // Verify customer data
    expect(parsedData.buyer_gender).toBe("NAM");
    expect(parsedData.buyer_email).toBe("email@abc.com");

    // Verify insurance options are included
    expect(parsedData["e174526c-5a23-4aca-8d9f-ea198dc6b874"]).toBe("e174526c-5a23-4aca-8d9f-ea198dc6b874");
    expect(parsedData["5eab040c-901d-4f4c-a3be-11e6b6fad9a1"]).toBe("5eab040c-901d-4f4c-a3be-11e6b6fad9a1");
    expect(parsedData["6ea497a9-df0a-49f8-9d92-3dcf0ef53645"]).toBe("6ea497a9-df0a-49f8-9d92-3dcf0ef53645");
    expect(parsedData["c42582c5-c95b-4d92-8a3b-c5770775d3bf"]).toBe("c42582c5-c95b-4d92-8a3b-c5770775d3bf");

    console.log('\n=== KEY MAPPINGS VERIFICATION ===');
    console.log('MAZDA ->', parsedData.car_automaker);
    console.log('khong_kd_cho_nguoi ->', parsedData.car_goal);
    console.log('2 seats ->', parsedData.car_seat);
    console.log('Insurance options count:', Object.keys(parsedData).filter(key => key.includes('-')).length);
  });
});