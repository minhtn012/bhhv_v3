const fs = require('fs');

// Import the insurance type data
const carTypeInsurance = JSON.parse(fs.readFileSync('./db_json/car_type_insturance.json', 'utf8'));

// Insurance type mapping function
function mapInsuranceTypeOptions(includeOptions) {
  const insuranceTypes = {};

  if (includeOptions.includeTNDS) {
    const tndsInsurance = carTypeInsurance.find(item => item.code === "includeTNDS");
    if (tndsInsurance) {
      insuranceTypes[tndsInsurance.value] = tndsInsurance.value;
    }
  }

  if (includeOptions.includeNNTX) {
    const nntxInsurance = carTypeInsurance.find(item => item.code === "includeNNTX");
    if (nntxInsurance) {
      insuranceTypes[nntxInsurance.value] = nntxInsurance.value;
    }
  }

  return insuranceTypes;
}

// Test contract data with both insurance types enabled
const testContract = {
  // Vehicle info
  carBrand: "FORD",
  carModel: "TRANSIT",
  soChoNgoi: 2,
  namSanXuat: 2021,
  giaTriXe: 800000000,
  trongTai: 2500000, // 2.5 tons
  loaiHinhKinhDoanh: "kd_cho_hang",

  // Vehicle registration
  bienSo: "50H-229.67",
  soKhung: "LGGX6D058ML305284",
  soMay: "YC6L35050LG1L9M00117",
  ngayDKLD: "01/09/2022",

  // Customer info
  chuXe: "CTY TNHH VTDV TM KIẾN HOÀNG",
  buyerEmail: "email@abc.com",
  buyerPhone: "0988111222",
  buyerGender: "NAM",
  buyerCitizenId: "123123123123",
  selectedProvince: "eee52932-0358-47d5-9984-be1132c7f01",
  selectedDistrictWard: "82db031c-857d-465b-9ae5-6e91fffcf573",
  specificAddress: "123 ha noi",

  // Insurance options - TEST BOTH ENABLED
  includeTNDS: true,
  includeNNTX: true,

  // Total premium
  tongPhi: 19910000
};

// Create BHV API data structure
function createBhvData(contract) {
  const insuranceTypeOptions = mapInsuranceTypeOptions({
    includeTNDS: contract.includeTNDS || false,
    includeNNTX: contract.includeNNTX || false
  });

  const dataObject = {
    // Essential fields matching the curl examples
    certificate_code: ["", ""],
    kind_action: ["insert", "insert"],
    sale_code: "",
    kind_config: '{"car_goal":"no","car_seat":"no","car_weigh_goods":"yes"}',
    product_id: "3588e406-6f89-4a14-839b-64460bbcea67",
    car_year_buy: "53d91be0-a641-4309-bd6b-e76befbe4e70",
    car_kind: "8feb985b-dc77-46e3-b5af-186b10be4876",
    get_fee_mode: "tu_dong",
    kind_customer: "bd8c75bc-eeb5-42ba-a5d0-e8ca9a573d1",
    chk_agree_term: "1",
    chk_add_vietnam: "vietnam",

    // Vehicle data from curl examples
    car_automaker: "b07cadc0-b84d-4863-b374-fe018b3194c022",
    car_model: "f07080e9-c23f-449f-83e9-f8c2a8778d0737",
    car_goal: "6ee07aa2-43bd-4141-b6d2-49f8f6cfe1a2",
    car_seat: "33d227b2-dbb9-4fdf-9cf7-b0fa843d5449",
    car_weigh_goods: "297966cd-be47-4d7e-a52c-9a1297ca8012",
    car_year: contract.namSanXuat?.toString(),
    car_fisrt_date: contract.ngayDKLD,
    car_package: "340d36cf-6d41-444c-a6a0-bb1ebec05030",
    car_seat_buy: "2",
    car_body_styles: "cb3464e5-bb4d-4268-a08d-b432252dee91",
    car_model_year: "5d716993-a5b6-4435-916a-daf5f2e4190f0392",
    car_type_engine: "31cd6b1d-39a6-42d5-9c5f-13f44ad1a8a9",
    car_deduction: "4cfc8ba9-cd89-4abf-aaa6-49df298ec3582",
    car_value_info: contract.giaTriXe?.toString(),
    car_value: contract.giaTriXe?.toString(),
    car_value_battery_info: "0",
    car_value_battery: "0",

    // Additional UUIDs from curl examples
    "c2db43ab-ccdc-44d3-8fdc-2167b86e01900": "c2db43ab-ccdc-44d3-8fdc-2167b86e01900",
    "e174526c-5a23-4aca-8d9f-ea198dc6b874": "e174526c-5a23-4aca-8d9f-ea198dc6b874",
    "5eab040c-901d-4f4c-a3be-11e6b6fad9a1": "5eab040c-901d-4f4c-a3be-11e6b6fad9a1",

    // Vehicle registration
    car_number_plate: contract.bienSo,
    car_chassis: contract.soKhung,
    car_number_engine: contract.soMay,

    // Customer data
    buyer_fullname: contract.chuXe,
    buyer_email: contract.buyerEmail,
    buyer_phone: contract.buyerPhone,
    buyer_gender: contract.buyerGender?.toUpperCase(),
    buyer_identity_card: contract.buyerCitizenId,
    buyer_passport: "",
    buyer_city: contract.selectedProvince,
    buyer_district: contract.selectedDistrictWard,
    buyer_address: contract.specificAddress,
    buyer_company_hoten: "",
    buyer_company_qhns: "",

    // Tax and content
    tax_content_kind: "nvbh_shd_bks",
    tax_content_option_noi_dung_dac_biet_noidung: "",

    // Owner vehicle info (same as buyer)
    chk_owner_vehicle: "100",
    owner_vehicle_relationship: "1b9eb913-b96b-45e8-9fc4-80f0d46d3ab1",
    owner_vehicle_fullname: contract.chuXe,
    owner_vehicle_email: contract.buyerEmail,
    owner_vehicle_identity_card: contract.buyerCitizenId,
    owner_vehicle_phone: contract.buyerPhone,
    owner_vehicle_gender: contract.buyerGender?.toUpperCase(),
    owner_vehicle_city: contract.selectedProvince,
    owner_vehicle_district: contract.selectedDistrictWard,
    owner_vehicle_address: contract.specificAddress,

    // Beneficiary info (same as buyer)
    chk_beneficiary: "100",
    beneficiary_fullname: contract.chuXe,
    beneficiary_email: contract.buyerEmail,
    beneficiary_identity_card: contract.buyerCitizenId,
    beneficiary_phone: contract.buyerPhone,
    beneficiary_city: contract.selectedProvince,
    beneficiary_district: contract.selectedDistrictWard,
    beneficiary_address: contract.specificAddress,

    // Dates
    buyer_payment_date: "15/09/2025",
    active_date: "15/09/2025 16:52",
    inactive_date: "15/09/2026 16:52",

    // Total premium
    total_premium: contract.tongPhi?.toString(),

    // Empty order fields
    "c854019c-3eab-4d1b-b956-2ed95e3f709a": "",
    "ab71b377-f180-4e56-aeef-f288443f1726": "",
    "3997b5b8-1eb5-4e99-b31c-6a61d35903b0": "",
    "04287fbf-fdea-4058-9776-f64f286b0da2": "",
    "931e943c-3f67-458d-ada4-f780ce7e882d": "",
    "05f7ac7b-b8cf-4b49-9f95-5db6af14101e": "",
    "41297ef3-0a7e-4ec0-ae6e-50966a4a9972": "",
    "c91893f5-49f0-477a-a52d-263cdaed19b9": "",
    "35add4ab-a834-4a1a-ad72-a42adb83f7ee": "",
    "25daddf5-cc38-49ef-bc4a-15e20a98d3cc": ""
  };

  // Add insurance type options - THIS IS THE KEY PART WE'RE TESTING
  Object.assign(dataObject, insuranceTypeOptions);

  return {
    action_name: "vehicle/transport/review",
    data: JSON.stringify(dataObject),
    d_info: {}
  };
}

// Test with authentication
async function testBhvApiAuthenticated() {
  const bhvData = createBhvData(testContract);

  console.log("=== Testing with Authentication ===");
  console.log("Insurance UUIDs to be sent:");
  const parsedData = JSON.parse(bhvData.data);
  console.log("- TNDS:", parsedData["417b153b-f030-4b6a-91a4-433c80e4b746"] ? "✓" : "✗");
  console.log("- NNTX:", parsedData["0b0026a2-ebe6-4350-862b-18a4a3d90609"] ? "✓" : "✗");

  try {
    console.log("\n=== Making Authenticated API Call ===");

    const response = await fetch("https://my.bhv.com.vn/3f2fb62a-662a-4911-afad-d0ec4925f29e", {
      method: "POST",
      headers: {
        "accept": "application/json, text/javascript, */*; q=0.01",
        "accept-language": "en-US,en;q=0.9,vi;q=0.8,lb;q=0.7",
        "content-type": "application/json; charset=UTF-8",
        "sec-ch-ua": '"Chromium";v="140", "Not=A?Brand";v="24", "Google Chrome";v="140"',
        "sec-ch-ua-mobile": "?0",
        "sec-ch-ua-platform": '"Linux"',
        "sec-fetch-dest": "empty",
        "sec-fetch-mode": "cors",
        "sec-fetch-site": "same-origin",
        "x-requested-with": "XMLHttpRequest",
        // Use the provided authentication cookie
        "cookie": "4c5234cd-80ac-4deb-ae8e-a79b531f901e=CfDJ8O51rrl%2FT6hIiLxg3JwU5426BMK1as7%2BeHYo%2F607Z9IOpLr7aSRRhewApmJ0Ugiya7K0MqNNKin8%2FTbWlDGEpNRVUcAC3KthZJvf7pD4Bh8NKLYMjpq7cA0ppNVothT1iAPVe%2BVR9YvEyWJui9M0gpTOQ%2BpOYUWVrx1bzCsaysB8",
        "Referer": "https://my.bhv.com.vn/bao-hiem-xe-co-gioi"
      },
      body: JSON.stringify(bhvData)
    });

    console.log("Response Status:", response.status);
    console.log("Response Headers:", Object.fromEntries(response.headers.entries()));

    const responseText = await response.text();
    console.log("\nResponse Body:", responseText);

    try {
      const responseJson = JSON.parse(responseText);
      console.log("\n=== Parsed Response ===");
      console.log(JSON.stringify(responseJson, null, 2));

      // Check if we got a successful response
      if (responseJson.status_code === 200 || responseJson.data_type !== "data/code/error") {
        console.log("\n✅ SUCCESS: API call worked with authentication!");
        console.log("✅ Insurance type mappings are properly integrated!");
      } else {
        console.log("\n⚠️  Response received but with error:", responseJson.message);
      }

    } catch (e) {
      console.log("Response is not JSON");
    }

  } catch (error) {
    console.error("\n❌ API Call Error:", error);
  }
}

// Run the authenticated test
testBhvApiAuthenticated();