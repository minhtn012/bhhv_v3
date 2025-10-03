/**
 * BHV Data Mapper - Transform contract data to BHV API format
 */

import carAutomakers from '@db/car_automakers.json';
import carInsurance from '@db/car_insurance.json';
import carSeat from '@db/car_seat.json';
import carPackage from '@db/car_package.json';
import carKind from '@db/car_kind.json';
import carDeduction from '@db/car_deduction.json';
import carTypeEngine from '@db/car_type_engine.json';
import carGoal from '@db/input-drl_goal.json';
import allCarDetails from '@db/all_car_details.json';
import carTypeInsurance from '@db/car_type_insturance.json';
import carWeightGood from '@db/car_weight_good.json';

// Fixed BHV API constants
const BHV_CONSTANTS = {
  PRODUCT_ID: "3588e406-6f89-4a14-839b-64460bbcea67",
  CAR_YEAR_BUY: "53d91be0-a641-4309-bd6b-e76befbe4e70",
  GET_FEE_MODE: "tu_dong",
  KIND_CUSTOMER: "bd8c75bc-eeb5-42ba-a5d0-e8ca9a573d1",
  CHK_AGREE_TERM: "1",
  CHK_ADD_VIETNAM: "vietnam"
};

/**
 * Format date for BHV API (DD/MM/YYYY)
 */
function formatDateForBhv(date: Date): string {
  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
}

/**
 * Parse date string from DD/MM/YYYY or DD/MM/YYYY HH:mm:ss format to Date object
 * If no time is provided, defaults to 08:00:00
 */
function parseDateFromDDMMYYYY(dateStr: string): Date {
  const parts = dateStr.split(' ');
  const datePart = parts[0];
  const timePart = parts[1] || '08:00:00';

  const [day, month, year] = datePart.split('/').map(Number);
  const [hours, minutes, seconds] = timePart.split(':').map(Number);

  return new Date(year, month - 1, day, hours || 8, minutes || 0, seconds || 0);
}

/**
 * Format date and time for BHV API (DD/MM/YYYY HH:mm)
 */
function formatDateTimeForBhv(date: Date): string {
  const dateStr = formatDateForBhv(date);
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  return `${dateStr} ${hours}:${minutes}`;
}

/**
 * Map insurance packages from dkbs array to BHV UUIDs
 */
export function mapInsuranceOptions(dkbs: string[]): Record<string, string> {
  const insuranceOptions: Record<string, string> = {};

  // Always include "Cơ bản" package (default)
  const basicPackage = carInsurance.find(item => item.label === "Cơ bản");
  if (basicPackage) {
    insuranceOptions[basicPackage.value] = basicPackage.value;
  }

  // Add AU codes if present
  dkbs.forEach(line => {
    const auMatch = line.match(/BS(\d{3})/);
    if (auMatch) {
      const auCode = `BS${auMatch[1]}`;
      const insurance = carInsurance.find(item => item.code === auCode);
      if (insurance) {
        insuranceOptions[insurance.value] = insurance.value;
      }
    }
  });

  return insuranceOptions;
}

/**
 * Map vehicle business type to car_goal UUID
 */
export function mapVehicleGoal(loaiHinhKinhDoanh: string): string {
  // khong_kd_* = Không Kinh doanh, kd_* = Kinh doanh
  if (loaiHinhKinhDoanh.startsWith('khong_kd')) {
    return "6ee07aa2-43bd-4141-b6d2-49f8f6cfe1a1"; // Không Kinh doanh
  }

  if (loaiHinhKinhDoanh.startsWith('kd')) {
    return "6ee07aa2-43bd-4141-b6d2-49f8f6cfe1a2"; // Kinh doanh
  }

  // Default to non-business
  return "6ee07aa2-43bd-4141-b6d2-49f8f6cfe1a1";
}

/**
 * Get kind_config based on business type
 */
export function getKindConfig(loaiHinhKinhDoanh: string): {
  car_goal: "yes" | "no";
  car_seat: "yes" | "no";
  car_weigh_goods: "yes" | "no";
} {
  // For pickup/van vehicles (hybrid: both passenger and goods capable)
  // These vehicles can carry both people and goods, so ALL config = "yes"
  // But only car_goal + car_seat fields are filled, car_weigh_goods stays empty
  if (loaiHinhKinhDoanh === 'kd_pickup_van' || loaiHinhKinhDoanh === 'khong_kd_pickup_van') {
    return {
      car_goal: "yes",
      car_seat: "yes",
      car_weigh_goods: "yes"  // Yes in config but field stays empty
    };
  }

  // For pure goods transport business (trucks, trailers)
  if (loaiHinhKinhDoanh === 'kd_cho_hang' || loaiHinhKinhDoanh === 'kd_dau_keo') {
    return {
      car_goal: "no",
      car_seat: "no",
      car_weigh_goods: "yes"
    };
  }

  // For passenger transport business
  if (loaiHinhKinhDoanh === 'kd_cho_nguoi') {
    return {
      car_goal: "yes",
      car_seat: "yes",
      car_weigh_goods: "no"
    };
  }

  if (loaiHinhKinhDoanh.includes('pickup')) {
    return {
      car_goal: "yes",
      car_seat: "yes",
      car_weigh_goods: "yes"
    };
  }

  // Default for non-business (passenger vehicles)
  return {
    car_goal: "yes",
    car_seat: "yes",
    car_weigh_goods: "no"
  };
}

/**
 * Map vehicle weight to weight category UUID
 */
export function mapCarWeightGoods(trongTai: number): string {
  // Weight in kg, convert to tons for comparison
  const weightInTons = trongTai / 1000;

  // Special case: 1.4 tons
  if (weightInTons === 1.4) {
    const item = carWeightGood.find(w => w.name === "1.4 tấn");
    return item?.value || "";
  }

  // Over 15 tons
  if (weightInTons > 15) {
    const item = carWeightGood.find(w => w.name === "Trên 15 tấn");
    return item?.value || "";
  }

  // Round to nearest ton and find matching weight
  const roundedWeight = Math.round(weightInTons);

  // Format: "01 tấn", "02 tấn", etc.
  const formattedWeight = roundedWeight.toString().padStart(2, '0') + " tấn";
  const item = carWeightGood.find(w => w.name === formattedWeight);

  return item?.value || "";
}

/**
 * Map car brand to automaker UUID
 */
export function mapCarAutomaker(carBrand: string): string {
  const automaker = carAutomakers.find(item => item.name === carBrand);
  return automaker?.value || "";
}

/**
 * Map car model to model UUID
 */
export function mapCarModel(carBrand: string, carModel: string): string {
  const brand = allCarDetails.find(item => item.brand_name === carBrand);
  if (brand) {
    const model = brand.models.find(m => m.model_name === carModel);
    return model?.model_id || "";
  }
  return "";
}

/**
 * Map body style to UUID
 */
export function mapCarBodyStyle(carBrand: string, carModel: string, carBodyStyle: string): string {
  const brand = allCarDetails.find(item => item.brand_name === carBrand);
  if (brand) {
    const model = brand.models.find(m => m.model_name === carModel);
    if (model) {
      const bodyStyle = model.body_styles.find(bs => bs.name === carBodyStyle);
      return bodyStyle?.id || "";
    }
  }
  return "";
}

/**
 * Map car model year variant to UUID
 */
export function mapCarModelYear(carBrand: string, carModel: string, carModelYear: string): string {
  const brand = allCarDetails.find(item => item.brand_name === carBrand);
  if (brand) {
    const model = brand.models.find(m => m.model_name === carModel);
    if (model) {
      const year = model.years.find(y => y.name === carModelYear);
      return year?.id || "";
    }
  }
  return "";
}

/**
 * Map number of seats to seat UUID
 */
export function mapCarSeat(soChoNgoi: number): string {
  const seat = carSeat.find(item => parseInt(item.seat_value) === soChoNgoi);
  return seat?.value || "";
}

/**
 * Map car package based on contract's NNTX fee per seat
 */
export function mapCarPackage(contract: any): string {
  const loaiHinhKinhDoanh = contract.loaiHinhKinhDoanh || '';
  const phiNNTX = contract.phiNNTX || 0;
  const soChoNgoi = contract.soChoNgoi || 1;

  // Calculate fee per seat
  const feePerSeat = phiNNTX / soChoNgoi;

  // Determine if this is business use (kd_*) or non-business (khong_kd_*)
  const isBusinessUse = loaiHinhKinhDoanh.startsWith('kd');

  // Find exact match in car_package.json
  const matchedPackage = carPackage.find(pkg => {
    const targetPrice = isBusinessUse ? pkg.price_kd : pkg.price;
    return feePerSeat === targetPrice;
  });

  return matchedPackage?.value || "340d36cf-6d41-444c-a6a0-bb1ebec05033"; // default 10M package
}

/**
 * Map car engine type to UUID
 */
export function mapCarTypeEngine(engineType: string): string {
  const engine = carTypeEngine.find(item => item.code === engineType);
  return engine?.value || "31cd6b1d-39a6-42d5-9c5f-13f44ad1a8a9"; // Default to ICE
}

/**
 * Map car deduction option to UUID
 */
export function mapCarDeduction(deductionAmount: number): string {
  if (deductionAmount >= 1000000) {
    return "4cfc8ba9-cd89-4abf-aaa6-49df298ec3582"; // 1M deduction
  } else {
    return "4cfc8ba9-cd89-4abf-aaa6-49df298ec3581"; // 500K deduction (default)
  }
}

/**
 * Map car kind based on business type to UUID
 */
export function mapCarKind(loaiHinhKinhDoanh: string): string {
  const kind = carKind.find(item => item.code === loaiHinhKinhDoanh);
  return kind?.value || "8feb985b-dc77-46e3-b5af-186b10be4874"; // Default to passenger car
}

/**
 * Map insurance type options to UUIDs
 */
export function mapInsuranceTypeOptions(includeOptions: { includeTNDS?: boolean; includeNNTX?: boolean }): Record<string, string> {
  const insuranceTypes: Record<string, string> = {};

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


/**
 * Checks the fractional part of a number.
 * @param {number} number - The number to check.
 * @returns {number} - Returns 1 if the fractional part is less than 0.5, otherwise returns 0.
 */
export function processFractionalPart(number: number) {
  // Get the fractional part of the number
  const fractionalPart = number % 1;
  // If the fractional part is less than 0.5, return 1; otherwise, return 0.
  return fractionalPart < 0.5 ? 1 : 0;
}

/**
 * Calculate discount percentage and generate request_change_fees JSON
 */
export function calculateRequestChangeFees(contract: any): string {
  // Check if required data exists
  if (!contract.bhvPremiums?.bhvc?.afterTax || !contract.vatChatPackage?.phiVatChat) {
    console.warn('Hệ thống chưa được giảm giá - thiếu dữ liệu bhvPremiums hoặc vatChatPackage');
    return "";
  }

  const bhvAfterTax = Math.round(contract.bhvPremiums.total.afterTax);
  const vatChatFee = Math.round(contract.tongPhi);

  // Prevent division by zero
  if (bhvAfterTax <= 0) {
    console.warn('Hệ thống chưa được giảm giá - bhvPremiums.bhvc.afterTax <= 0');
    return "";
  }

  // Calculate discount percentage
  // const discountRate = ((bhvAfterTax - vatChatFee) / bhvAfterTax) * 100;
  let discount = bhvAfterTax - vatChatFee
  // discount = discount - processFractionalPart(discount)
  // If negative, set to 0 (no discount)
  // const finalDiscountRate = Math.max(0, Math.round(discountRate));
  console.log("#################")
  console.log(bhvAfterTax, vatChatFee, discount)
  console.log("#################")
  // Generate request_change_fees JSON
  const requestChangeFees = [
    {
      option_id: "c2db43ab-ccdc-44d3-8fdc-2167b86e01900",
      option_type: "RQ_FEES_DISCOUNT",
      option_value: 0,
      option_value1: discount
    }
  ];

  return JSON.stringify(requestChangeFees);
}

/**
 * Transform contract data to BHV API confirmation format
 */
export function transformContractToBhvConfirmFormat(contract: any, saleCode: string = ""): any {
  const insuranceOptions = mapInsuranceOptions(contract.vatChatPackage?.dkbs || []);
  const insuranceTypeOptions = mapInsuranceTypeOptions({
    includeTNDS: contract.includeTNDS || false,
    includeNNTX: contract.includeNNTX || false
  });
  const kindConfig = getKindConfig(contract.loaiHinhKinhDoanh);
  const carWeightGoods = mapCarWeightGoods(contract.trongTai || 0);

  const dataObject: any = {
    // Fixed constants and configuration
    certificate_code: ["", ""],
    kind_action: ["insert", "insert"],
    sale_code: saleCode, // Key difference: use provided sale_code instead of empty
    kind_config: JSON.stringify(kindConfig),
    product_id: BHV_CONSTANTS.PRODUCT_ID,
    car_year_buy: BHV_CONSTANTS.CAR_YEAR_BUY,
    car_kind: mapCarKind(contract.loaiHinhKinhDoanh),
    get_fee_mode: BHV_CONSTANTS.GET_FEE_MODE,
    kind_customer: BHV_CONSTANTS.KIND_CUSTOMER,
    chk_agree_term: BHV_CONSTANTS.CHK_AGREE_TERM,
    chk_add_vietnam: BHV_CONSTANTS.CHK_ADD_VIETNAM,

    // Vehicle data
    car_automaker: mapCarAutomaker(contract.carBrand || contract.nhanHieu),
    car_model: mapCarModel(contract.carBrand || contract.nhanHieu, contract.carModel || contract.soLoai),
    // Only add passenger fields if kind_config says yes
    ...(kindConfig.car_goal === "yes" && { car_goal: mapVehicleGoal(contract.loaiHinhKinhDoanh) }),
    ...(kindConfig.car_seat === "yes" && {
      car_seat: mapCarSeat(contract.soChoNgoi),
      car_seat_buy: contract.soChoNgoi?.toString()
    }),
    car_body_styles: mapCarBodyStyle(contract.carBrand || contract.nhanHieu, contract.carModel || contract.soLoai, contract.carBodyStyle),
    car_year: contract.namSanXuat?.toString(),
    car_model_year: mapCarModelYear(contract.carBrand || contract.nhanHieu, contract.carModel || contract.soLoai, contract.carModelYear),
    car_value: contract.giaTriXe?.toString(),
    car_value_info: contract.giaTriXe?.toString(),
    car_value_battery: contract.giaTriPin?.toString() || "0",
    car_value_battery_info: contract.giaTriPin?.toString() || "0",
    car_package: mapCarPackage(contract),
    car_type_engine: mapCarTypeEngine(contract.engineType || "ICE"),
    car_deduction: mapCarDeduction(contract.deductionAmount || 500000),

    // Vehicle registration
    car_number_plate: contract.bienSo,
    car_chassis: contract.soKhung,
    car_number_engine: contract.soMay,
    car_fisrt_date: contract.ngayDKLD,

    // Request change fees (discount/fee modifications)
    request_change_fees: calculateRequestChangeFees(contract),

    // Customer data
    buyer_customer_code: "",
    buyer_partner_code: "",
    buyer_agency_code: "",
    buyer_fullname: contract.chuXe, // Owner name from contract
    buyer_email: contract.buyerEmail,
    buyer_phone: contract.buyerPhone,
    buyer_gender: contract.buyerGender?.toUpperCase(),
    buyer_identity_card: contract.buyerCitizenId,
    buyer_city: contract.selectedProvince,
    buyer_district: contract.selectedDistrictWard,
    buyer_address: contract.specificAddress,

    // Owner vehicle information (same as buyer for now)
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

    // Beneficiary information (same as buyer for now)
    chk_beneficiary: "100",
    beneficiary_fullname: contract.chuXe,
    beneficiary_email: contract.buyerEmail,
    beneficiary_identity_card: contract.buyerCitizenId,
    beneficiary_phone: contract.buyerPhone,
    beneficiary_city: contract.selectedProvince,
    beneficiary_district: contract.selectedDistrictWard,
    beneficiary_address: contract.specificAddress,

    // Additional missing fields
    tax_content_kind: "nvbh_shd_bks",
    tax_content_option_noi_dung_dac_biet_noidung: "",
    buyer_company_hoten: "",
    buyer_company_qhns: "",
    buyer_passport: "",

    // Dates (formatted for BHV API - DD/MM/YYYY HH:mm)
    buyer_payment_date: formatDateForBhv(new Date()),
    active_date: formatDateTimeForBhv(
      contract.ngayBatDauBaoHiem ? parseDateFromDDMMYYYY(contract.ngayBatDauBaoHiem) : new Date()
    ),
    inactive_date: formatDateTimeForBhv(
      contract.ngayKetThucBaoHiem ? parseDateFromDDMMYYYY(contract.ngayKetThucBaoHiem) : new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
    ),

    // Total premium
    total_premium: contract.tongPhi?.toString(),
    // order
    "c854019c-3eab-4d1b-b956-2ed95e3f709a": "",
    "ab71b377-f180-4e56-aeef-f288443f1726": "",
    "3997b5b8-1eb5-4e99-b31c-6a61d35903b0": "",
    "04287fbf-fdea-4058-9776-f64f286b0da2": "",
    "931e943c-3f67-458d-ada4-f780ce7e882d": "",
    "05f7ac7b-b8cf-4b49-9f95-5db6af14101e": "",
    "41297ef3-0a7e-4ec0-ae6e-50966a4a9972": "",
    "c91893f5-49f0-477a-a52d-263cdaed19b9": "",
    "35add4ab-a834-4a1a-ad72-a42adb83f7ee": "",
    "25daddf5-cc38-49ef-bc4a-15e20a98d3cc": "",
    // Add car_weigh_goods UUID when config allows and weight data exists
    ...(kindConfig.car_weigh_goods === "yes" && carWeightGoods && { car_weigh_goods: carWeightGoods }),
  };

  // Add insurance options
  Object.assign(dataObject, insuranceOptions);

  // Add insurance type options (TNDS/NNTX)
  Object.assign(dataObject, insuranceTypeOptions);

  const bhvData = {
    action_name: "vehicle/transport/install", // Key difference: install instead of review
    data: JSON.stringify(dataObject),
    d_info: {}
  };

  return bhvData;
}

/**
 * Transform contract data to BHV API format
 */
export function transformContractToBhvFormat(contract: any): any {
  const insuranceOptions = mapInsuranceOptions(contract.vatChatPackage?.dkbs || []);
  const insuranceTypeOptions = mapInsuranceTypeOptions({
    includeTNDS: contract.includeTNDS || false,
    includeNNTX: contract.includeNNTX || false
  });
  const kindConfig = getKindConfig(contract.loaiHinhKinhDoanh);
  const carWeightGoods = mapCarWeightGoods(contract.trongTai || 0);

  const dataObject: any = {
    // Fixed constants and configuration
    certificate_code: ["", ""],
    kind_action: ["insert", "insert"],
    sale_code: "",
    kind_config: JSON.stringify(kindConfig),
    product_id: BHV_CONSTANTS.PRODUCT_ID,
    car_year_buy: BHV_CONSTANTS.CAR_YEAR_BUY,
    car_kind: mapCarKind(contract.loaiHinhKinhDoanh),
    get_fee_mode: BHV_CONSTANTS.GET_FEE_MODE,
    kind_customer: BHV_CONSTANTS.KIND_CUSTOMER,
    chk_agree_term: BHV_CONSTANTS.CHK_AGREE_TERM,
    chk_add_vietnam: BHV_CONSTANTS.CHK_ADD_VIETNAM,

    // Vehicle data
    car_automaker: mapCarAutomaker(contract.carBrand || contract.nhanHieu),
    car_model: mapCarModel(contract.carBrand || contract.nhanHieu, contract.carModel || contract.soLoai),
    // Only add passenger fields if kind_config says yes
    ...(kindConfig.car_goal === "yes" && { car_goal: mapVehicleGoal(contract.loaiHinhKinhDoanh) }),
    ...(kindConfig.car_seat === "yes" && {
      car_seat: mapCarSeat(contract.soChoNgoi),
      car_seat_buy: contract.soChoNgoi?.toString()
    }),
    car_body_styles: mapCarBodyStyle(contract.carBrand || contract.nhanHieu, contract.carModel || contract.soLoai, contract.carBodyStyle),
    car_year: contract.namSanXuat?.toString(),
    car_model_year: mapCarModelYear(contract.carBrand || contract.nhanHieu, contract.carModel || contract.soLoai, contract.carModelYear),
    car_value: contract.giaTriXe?.toString(),
    car_value_info: contract.giaTriXe?.toString(),
    car_value_battery: contract.giaTriPin?.toString() || "0",
    car_value_battery_info: contract.giaTriPin?.toString() || "0",
    car_package: mapCarPackage(contract),
    car_type_engine: mapCarTypeEngine(contract.engineType || "ICE"),
    car_deduction: mapCarDeduction(contract.deductionAmount || 500000),

    // Vehicle registration
    car_number_plate: contract.bienSo,
    car_chassis: contract.soKhung,
    car_number_engine: contract.soMay,
    car_fisrt_date: contract.ngayDKLD,

    // Request change fees (discount/fee modifications)
    request_change_fees: calculateRequestChangeFees(contract),

    // Customer data
    buyer_customer_code: "",
    buyer_partner_code: "",
    buyer_agency_code: "",
    buyer_fullname: contract.chuXe, // Owner name from contract
    buyer_email: contract.buyerEmail,
    buyer_phone: contract.buyerPhone,
    buyer_gender: contract.buyerGender?.toUpperCase(),
    buyer_identity_card: contract.buyerCitizenId,
    buyer_city: contract.selectedProvince,
    buyer_district: contract.selectedDistrictWard,
    buyer_address: contract.specificAddress,

    // Owner vehicle information (same as buyer for now)
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

    // Beneficiary information (same as buyer for now)
    chk_beneficiary: "100",
    beneficiary_fullname: contract.chuXe,
    beneficiary_email: contract.buyerEmail,
    beneficiary_identity_card: contract.buyerCitizenId,
    beneficiary_phone: contract.buyerPhone,
    beneficiary_city: contract.selectedProvince,
    beneficiary_district: contract.selectedDistrictWard,
    beneficiary_address: contract.specificAddress,

    // Additional missing fields
    tax_content_kind: "nvbh_shd_bks",
    tax_content_option_noi_dung_dac_biet_noidung: "",
    buyer_company_hoten: "",
    buyer_company_qhns: "",
    buyer_passport: "",

    // Dates (formatted for BHV API - DD/MM/YYYY HH:mm)
    buyer_payment_date: formatDateForBhv(new Date()),
    active_date: formatDateTimeForBhv(
      contract.ngayBatDauBaoHiem ? parseDateFromDDMMYYYY(contract.ngayBatDauBaoHiem) : new Date()
    ),
    inactive_date: formatDateTimeForBhv(
      contract.ngayKetThucBaoHiem ? parseDateFromDDMMYYYY(contract.ngayKetThucBaoHiem) : new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
    ),
  
    // Total premium
    total_premium: contract.tongPhi?.toString(),
    // order
    "c854019c-3eab-4d1b-b956-2ed95e3f709a": "",
    "ab71b377-f180-4e56-aeef-f288443f1726": "",
    "3997b5b8-1eb5-4e99-b31c-6a61d35903b0": "",
    "04287fbf-fdea-4058-9776-f64f286b0da2": "",
    "931e943c-3f67-458d-ada4-f780ce7e882d": "",
    "05f7ac7b-b8cf-4b49-9f95-5db6af14101e": "",
    "41297ef3-0a7e-4ec0-ae6e-50966a4a9972": "",
    "c91893f5-49f0-477a-a52d-263cdaed19b9": "",
    "35add4ab-a834-4a1a-ad72-a42adb83f7ee": "",
    "25daddf5-cc38-49ef-bc4a-15e20a98d3cc": "",
    // Add car_weigh_goods UUID when config allows and weight data exists
    ...(kindConfig.car_weigh_goods === "yes" && carWeightGoods && { car_weigh_goods: carWeightGoods }),
  };

  // Add insurance options
  Object.assign(dataObject, insuranceOptions);

  // Add insurance type options (TNDS/NNTX)
  Object.assign(dataObject, insuranceTypeOptions);

  const bhvData = {
    action_name: "vehicle/transport/review",
    data: JSON.stringify(dataObject),
    d_info: {}
  };

  return bhvData;
}

/**
 * Transform contract data to BHV premium check format
 */
export function transformContractToPremiumCheckFormat(contract: any): any {
  // Use the same transformation as contract submission but change action_name
  const bhvData = transformContractToBhvFormat(contract);

  // Change action name for premium checking
  bhvData.action_name = "vehicle/transport/premium";

  return bhvData;
}