import fs from 'fs';
import path from 'path';
import PizZip from 'pizzip';
import Docxtemplater from 'docxtemplater';

/**
 * Format number with dot as thousands separator
 * Example: 1000000 -> "1.000.000"
 */
function formatNumber(num: number): string {
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

/**
 * Map loaiHinhKinhDoanh code to Vietnamese text
 */
function mapLoaiHinhKinhDoanh(code: string): string {
  const mapping: Record<string, string> = {
    'khong_kd_cho_nguoi': 'Xe ô tô chở người (không kinh doanh)',
    'khong_kd_cho_hang': 'Xe vừa chở người vừa chở hàng còn lại; Xe tải VAN (không kinh doanh)',
    'khong_kd_pickup_van': 'Xe bán tải - Pickup (không kinh doanh)',
    'kd_cho_hang': 'Xe vận tải hàng hóa',
    'kd_dau_keo': 'Xe đầu kéo',
    'kd_cho_khach_lien_tinh': 'Xe vận tải hành khách liên tỉnh',
    'kd_grab_be': 'Xe Grab và xe tương tự',
    'kd_taxi_tu_lai': 'Xe cho thuê tự lái',
    'kd_hop_dong_tren_9c': 'Xe vận tải hành khách nội tỉnh',
    'kd_bus': 'Xe buýt',
    'kd_pickup_van': 'Xe vừa chở người vừa chở hàng còn lại; Xe tải VAN',
    'kd_chuyen_dung': 'Xe chuyên dùng',
    'kd_romooc_ben': 'Rơ mooc chuyên dụng (ben)'
  };

  return mapping[code] || code;
}

/**
 * Parse combined loaiHinhKinhDoanh string to separate loaiXe and loaiHinhKinhDoanh
 * Examples:
 *   "Xe ô tô chở người (không kinh doanh)" → {loaiXe: "Xe ô tô chở người", loaiHinhKinhDoanh: "không kinh doanh"}
 *   "Xe vận tải hàng hóa" → {loaiXe: "Xe vận tải hàng hóa", loaiHinhKinhDoanh: "kinh doanh"}
 */
function parseLoaiHinhKinhDoanh(combinedString: string): {
  loaiXe: string;
  loaiHinhKinhDoanh: string;
} {
  const match = combinedString.match(/^(.+?)\s*\((.+?)\)$/);

  if (match) {
    return {
      loaiXe: match[1].trim(),
      loaiHinhKinhDoanh: match[2].trim()
    };
  }

  return {
    loaiXe: combinedString.trim(),
    loaiHinhKinhDoanh: 'kinh doanh'
  };
}

/**
 * Convert number to Vietnamese words
 */
function numberToVietnameseWords(num: number): string {
  if (num === 0) return 'không đồng';

  const units = ['', 'một', 'hai', 'ba', 'bốn', 'năm', 'sáu', 'bảy', 'tám', 'chín'];
  const scales = ['', 'nghìn', 'triệu', 'tỷ'];

  function readGroup(n: number): string {
    if (n === 0) return '';

    const hundred = Math.floor(n / 100);
    const ten = Math.floor((n % 100) / 10);
    const unit = n % 10;

    let result = '';

    if (hundred > 0) {
      result += units[hundred] + ' trăm';
    }

    if (ten > 1) {
      result += (result ? ' ' : '') + units[ten] + ' mươi';
      if (unit === 1) {
        result += ' mốt';
      } else if (unit > 0) {
        result += ' ' + units[unit];
      }
    } else if (ten === 1) {
      result += (result ? ' ' : '') + 'mười';
      if (unit > 0) {
        result += ' ' + units[unit];
      }
    } else if (unit > 0) {
      if (hundred > 0) {
        result += ' lẻ';
      }
      result += ' ' + units[unit];
    }

    return result.trim();
  }

  const groups = [];
  let tempNum = num;

  while (tempNum > 0) {
    groups.push(tempNum % 1000);
    tempNum = Math.floor(tempNum / 1000);
  }

  let result = '';
  for (let i = groups.length - 1; i >= 0; i--) {
    if (groups[i] > 0) {
      const groupText = readGroup(groups[i]);
      if (result) {
        result += ' ';
      }
      result += groupText;
      if (i > 0) {
        result += ' ' + scales[i];
      }
    }
  }

  return result.trim() + ' đồng';
}

/**
 * Format date string to Vietnamese format with numbers in bold
 * Input: "04/11/2025 08:00:00" (dd/MM/yyyy format) or "2025-09-27" (ISO) or Date object
 * Output: Object with separated parts for bold formatting
 */
function formatVietnameseDateTime(dateInput: string | Date) {
  let date: Date;

  if (typeof dateInput === 'string') {
    // Check if it's in dd/MM/yyyy HH:mm:ss format (e.g., "04/11/2025 10:00:00")
    const ddmmyyyyMatch = dateInput.match(/^(\d{2})\/(\d{2})\/(\d{4})\s+(\d{2}):(\d{2}):(\d{2})/);
    if (ddmmyyyyMatch) {
      // Parse manually to avoid MM/DD/YYYY interpretation
      const day = parseInt(ddmmyyyyMatch[1], 10);
      const month = parseInt(ddmmyyyyMatch[2], 10) - 1; // Month is 0-indexed
      const year = parseInt(ddmmyyyyMatch[3], 10);
      const hour = parseInt(ddmmyyyyMatch[4], 10);
      const minute = parseInt(ddmmyyyyMatch[5], 10);
      date = new Date(year, month, day, hour, minute);
    } else {
      // Fallback for ISO format or other formats
      date = new Date(dateInput);
    }
  } else {
    date = dateInput;
  }

  if (!date || isNaN(date.getTime())) {
    return {
      hour: '-',
      minute: '-',
      day: '-',
      month: '-',
      year: '-',
      full: '-'
    };
  }

  const hour = date.getHours().toString().padStart(2, '0');
  const minute = date.getMinutes().toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const year = date.getFullYear().toString();

  const full = `${hour} giờ ${minute} ngày ${day} tháng ${month} năm ${year}`;

  return { hour, minute, day, month, year, full };
}

/**
 * Format date to dd/MM/yyyy format
 * Input: "04/11/2025 08:00:00" (dd/MM/yyyy format) or "2025-09-27" (ISO) or Date object
 * Output: "04/11/2025"
 */
function formatDateDDMMYYYY(dateInput: string | Date): string {
  // If already in dd/MM/yyyy format, extract just the date part
  if (typeof dateInput === 'string') {
    const ddmmyyyyMatch = dateInput.match(/^(\d{2}\/\d{2}\/\d{4})/);
    if (ddmmyyyyMatch) {
      return ddmmyyyyMatch[1]; // Return as-is
    }
  }

  let date: Date;

  if (typeof dateInput === 'string') {
    date = new Date(dateInput);
  } else {
    date = dateInput;
  }

  if (!date || isNaN(date.getTime())) {
    return '-';
  }

  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const year = date.getFullYear();

  return `${day}/${month}/${year}`;
}

/**
 * Calculate payment deadline based on bhv_confirmed date and customer type
 */
function calculatePaymentDeadline(statusHistory: any[], loaiKhachHang?: string): string {
  if (!statusHistory || statusHistory.length === 0) {
    return '-';
  }

  // Find bhv_confirmed status in history
  const bhvConfirmedEntry = statusHistory.find(entry => entry.status === 'bhv_confirmed');

  if (!bhvConfirmedEntry || !bhvConfirmedEntry.changedAt) {
    return '-';
  }

  const confirmedDate = new Date(bhvConfirmedEntry.changedAt);

  // Add days based on customer type
  const daysToAdd = loaiKhachHang === 'cong_ty' ? 15 : 10;

  const deadlineDate = new Date(confirmedDate);
  deadlineDate.setDate(deadlineDate.getDate() + daysToAdd);

  const day = deadlineDate.getDate().toString().padStart(2, '0');
  const month = (deadlineDate.getMonth() + 1).toString().padStart(2, '0');
  const year = deadlineDate.getFullYear();

  return `${day}/${month}/${year}`;
}

/**
 * Format DKBS array to string
 */
function formatDkbs(dkbs?: string[]): string {
  if (!dkbs || dkbs.length === 0) {
    return '-';
  }

  return dkbs.map((item, index) => `${index + 1}. ${item}`).join('\n');
}

/**
 * Get NNTX package name from fee amount
 * Reverse lookup from fee to find the package name
 */
async function getNNTXPackageName(phiNNTX: number, soChoNgoi: number, loaiHinhKinhDoanh?: string): Promise<string> {
  if (!phiNNTX || phiNNTX === 0) {
    return '-';
  }

  try {
    // Import packages data
    const carPackage = (await import('@db/car_package.json')).default;
    const isBusinessVehicle = loaiHinhKinhDoanh?.startsWith('kd_') || false;

    // Calculate fee for each package and find matching one
    for (const pkg of carPackage) {
      const packagePrice = isBusinessVehicle ? (pkg.price_kd || pkg.price) : pkg.price;

      // Calculate NNTX fee using same logic as insurance-calculator
      const baseFee = packagePrice;
      const seatMultiplier = soChoNgoi <= 6 ? 1 : soChoNgoi <= 12 ? 1.5 : 2;
      const calculatedFee = baseFee * seatMultiplier;

      // Allow small rounding difference
      if (Math.abs(calculatedFee - phiNNTX) < 1) {
        return pkg.name;
      }
    }

    // If no match found, return the fee amount
    return `${formatNumber(phiNNTX)} VNĐ`;
  } catch (error) {
    console.error('Error getting NNTX package name:', error);
    return '-';
  }
}

interface ContractData {
  chuXe?: string;
  bienSo?: string;
  nhanHieu?: string;
  soLoai?: string;
  carBodyStyle?: string;
  diaChi?: string;
  contractNumber?: string;
  namSanXuat?: number;
  soKhung?: string;
  bhvContractNumber?: string;
  soMay?: string;
  soChoNgoi?: number;
  giaTriXe?: number;
  tndsPackage?: { phiBatBuoc?: number };
  taiNanPackage?: { phiTaiNan?: number };
  vatChatPackage?: {
    phiVatChat?: number;
    mucKhauTru?: number;
    tyLePhi?: number;
    customRate?: number;
    isCustomRate?: boolean;
    phiVatChatGoc?: number;
    dkbs?: string[];
  };
  tongPhiBaoHiem?: number;
  ngayBatDau?: string;
  ngayKetThuc?: string;
  ngayDKLD?: string;
  soNamSuDung?: number;
  trongTai?: number;
  loaiHinhKinhDoanh?: string;
  carBrand?: string;
  carModel?: string;
  carYear?: string;
  loaiDongCo?: string;
  giaTriPin?: number;
  buyerEmail?: string;
  buyerPhone?: string;
  buyerGender?: string;
  buyerCitizenId?: string;
  selectedProvinceText?: string;
  selectedDistrictWardText?: string;
  specificAddress?: string;
  status?: string;
  createdAt?: string;
  updatedAt?: string;
  createdBy?: string;
  includeTNDS?: boolean;
  includeNNTX?: boolean;
  phiNNTX?: number;
  loaiKhachHang?: 'ca_nhan' | 'cong_ty';
  ngayBatDauBaoHiem?: string;
  ngayKetThucBaoHiem?: string;
  phiTaiTucInfo?: {
    soVu: number;
    phanTramChiPhi: number;
  };
  phiTNDS?: number;
  tongPhi?: number;
  statusHistory?: Array<{
    status: string;
    changedBy: string;
    changedAt: Date;
    note?: string;
  }>;
}

function getTemplatePath(contractType: string, includeTNDS: boolean): string {
  if (contractType === '3-party') {
    return 'templates/3ben.docx';
  }

  // Hợp đồng 2 bên
  return includeTNDS
    ? 'templates/2ben_vcx_tnns.docx'
    : 'templates/2ben_vcx.docx';
}

interface BankInfo {
  bankName: string;
  bankOldAddress: string;
  bankNewAddress: string;
}

export async function generateWordContract(contractData: ContractData, contractType: string = '2-party', bankInfo?: BankInfo | null) {
  const templateFileName = getTemplatePath(contractType, contractData.includeTNDS || false);
  const templatePath = path.join(process.cwd(), templateFileName);
  const content = fs.readFileSync(templatePath, 'binary');

  // Get current date for contract generation
  const currentDate = new Date();

  // Get NNTX package name if applicable
  const trachNhiemBH = contractData.includeNNTX && contractData.phiNNTX
    ? await getNNTXPackageName(contractData.phiNNTX, contractData.soChoNgoi || 0, contractData.loaiHinhKinhDoanh)
    : '-';

  // Map contract data to template variables
  const templateData = {
    // Current date variables
    currentDay: currentDate.getDate().toString().padStart(2, '0'),
    currentMonth: (currentDate.getMonth() + 1).toString().padStart(2, '0'),
    currentYear: currentDate.getFullYear().toString(),

    // Variables with c_ prefix (uppercase)
    c_chuXe: contractData.chuXe || "-",
    c_bienSo: contractData.bienSo || "-",
    c_loaiXe: contractData.nhanHieu || "-",
    c_soLoai: contractData.soLoai || "-",
    c_carBodyStyle: contractData.carBodyStyle || "-",
    c_contractNumber: contractData.bhvContractNumber || contractData.contractNumber || "-",
    c_carBrand: contractData.carBrand || contractData.nhanHieu || "-",
    c_carModel: contractData.carModel || contractData.soLoai || "-",

    // Variables with  prefix (lowercase/normal case)
    diaChi: [
      contractData.specificAddress,
      contractData.selectedDistrictWardText,
      contractData.selectedProvinceText
    ]
      .filter(Boolean)
      .join(', ') || contractData.diaChi || "-",
    soHD: contractData.bhvContractNumber || "-",
    nhanHieu: contractData.nhanHieu || "-",
    namSanXuat: contractData.namSanXuat || "-",
    soKhung: contractData.soKhung || "-",
    soMay: contractData.soMay || "-",
    soChoNgoi: contractData.soChoNgoi || "-",
    soCho: contractData.soChoNgoi || "-",
    giaTriXe: contractData.giaTriXe ? formatNumber(contractData.giaTriXe) : "-",

    // Insurance package details
    phiBatBuoc: contractData.phiTNDS ? formatNumber(contractData.phiTNDS) : "-",
    phiTNDS: contractData.phiTNDS ? formatNumber(contractData.phiTNDS) : "-",
    phiNNTX: contractData.phiNNTX ? formatNumber(contractData.phiNNTX) : "-",
    phiTaiNan: contractData.taiNanPackage?.phiTaiNan ? formatNumber(contractData.taiNanPackage.phiTaiNan) : "-",
    phiVatChat: contractData.vatChatPackage?.phiVatChat ? formatNumber(contractData.vatChatPackage.phiVatChat) : "-",
    phiSauKhiGiam: contractData.tongPhi ? formatNumber(contractData.tongPhi) : "-",
    phiSauKhiGiamBangChu: contractData.tongPhi ? numberToVietnameseWords(contractData.tongPhi) : "-",
    tongPhi: contractData.tongPhi ? formatNumber(contractData.tongPhi) : "-",

    // Dates (formatted as dd/MM/yyyy)
    ngayBatDau: contractData.ngayBatDau ? formatDateDDMMYYYY(contractData.ngayBatDau) : "-",
    ngayKetThuc: contractData.ngayKetThuc ? formatDateDDMMYYYY(contractData.ngayKetThuc) : "-",
    ngayDKLD: contractData.ngayDKLD ? formatDateDDMMYYYY(contractData.ngayDKLD) : "-",

    // Insurance period dates (formatted in Vietnamese)
    // Full format
    ngayBatDauBaoHiem: contractData.ngayBatDauBaoHiem
      ? formatVietnameseDateTime(contractData.ngayBatDauBaoHiem).full
      : "-",
    ngayKetThucBaoHiem: contractData.ngayKetThucBaoHiem
      ? formatVietnameseDateTime(contractData.ngayKetThucBaoHiem).full
      : "-",

    // Start date parts (for bold formatting - numbers only)
    batDau_Gio: contractData.ngayBatDauBaoHiem
      ? formatVietnameseDateTime(contractData.ngayBatDauBaoHiem).hour
      : "-",
    batDau_Phut: contractData.ngayBatDauBaoHiem
      ? formatVietnameseDateTime(contractData.ngayBatDauBaoHiem).minute
      : "-",
    batDau_Ngay: contractData.ngayBatDauBaoHiem
      ? formatVietnameseDateTime(contractData.ngayBatDauBaoHiem).day
      : "-",
    batDau_Thang: contractData.ngayBatDauBaoHiem
      ? formatVietnameseDateTime(contractData.ngayBatDauBaoHiem).month
      : "-",
    batDau_Nam: contractData.ngayBatDauBaoHiem
      ? formatVietnameseDateTime(contractData.ngayBatDauBaoHiem).year
      : "-",

    // End date parts (for bold formatting - numbers only)
    ketThuc_Gio: contractData.ngayKetThucBaoHiem
      ? formatVietnameseDateTime(contractData.ngayKetThucBaoHiem).hour
      : "-",
    ketThuc_Phut: contractData.ngayKetThucBaoHiem
      ? formatVietnameseDateTime(contractData.ngayKetThucBaoHiem).minute
      : "-",
    ketThuc_Ngay: contractData.ngayKetThucBaoHiem
      ? formatVietnameseDateTime(contractData.ngayKetThucBaoHiem).day
      : "-",
    ketThuc_Thang: contractData.ngayKetThucBaoHiem
      ? formatVietnameseDateTime(contractData.ngayKetThucBaoHiem).month
      : "-",
    ketThuc_Nam: contractData.ngayKetThucBaoHiem
      ? formatVietnameseDateTime(contractData.ngayKetThucBaoHiem).year
      : "-",

    // Payment deadline calculation
    paymentDeadline: contractData.statusHistory
      ? calculatePaymentDeadline(contractData.statusHistory, contractData.loaiKhachHang)
      : "-",

    // Insurance conditions (DKBS)
    dkbs: formatDkbs(contractData.vatChatPackage?.dkbs),

    // Additional fields as needed based on template structure
    mucKhauTru: contractData.vatChatPackage?.mucKhauTru ? formatNumber(contractData.vatChatPackage.mucKhauTru) : "500.000",
    soNamSuDung: contractData.soNamSuDung || "-",
    namSuDung: contractData.soNamSuDung || "-",
    trongTai: contractData.trongTai || "-",

    // Parse combined loaiHinhKinhDoanh into separate variables for Word template
    ...(() => {
      const combinedString = contractData.loaiHinhKinhDoanh
        ? mapLoaiHinhKinhDoanh(contractData.loaiHinhKinhDoanh)
        : "Không Kinh doanh";
      const parsed = parseLoaiHinhKinhDoanh(combinedString);
      return {
        loaiXe: parsed.loaiXe,
        loaiHinhKinhDoanh: parsed.loaiHinhKinhDoanh
      };
    })(),

    // Car details
    carBrand: contractData.carBrand || "-",
    carModel: contractData.carModel || "-",
    carYear: contractData.carYear || "-",

    // Engine and electric vehicle
    loaiDongCo: contractData.loaiDongCo || "-",
    giaTriPin: contractData.giaTriPin ? formatNumber(contractData.giaTriPin) : "-",

    // Buyer information
    buyerEmail: contractData.buyerEmail || "-",
    buyerPhone: contractData.buyerPhone || "-",
    buyerGender: contractData.buyerGender || "-",
    buyerCitizenId: contractData.buyerCitizenId || "-",
    selectedProvince: contractData.selectedProvinceText || "-",
    selectedDistrictWard: contractData.selectedDistrictWardText || "-",
    specificAddress: contractData.specificAddress || "-",

    // Package rates and fees
    tyLePhi: contractData.vatChatPackage?.tyLePhi || "-",
    customRate: contractData.vatChatPackage?.customRate || "-",
    isCustomRate: contractData.vatChatPackage?.isCustomRate ? "Có" : "Không",
    phiVatChatGoc: contractData.vatChatPackage?.phiVatChatGoc ? formatNumber(contractData.vatChatPackage.phiVatChatGoc) : "-",

    // Status and workflow
    status: contractData.status || "-",
    createdAt: contractData.createdAt ? formatDateDDMMYYYY(contractData.createdAt) : "-",
    updatedAt: contractData.updatedAt ? formatDateDDMMYYYY(contractData.updatedAt) : "-",
    createdBy: contractData.createdBy || "-",

    // Bank information for 3-party contracts
    c_bankName: bankInfo?.bankName || "-",
    bankOldAddress: bankInfo?.bankOldAddress || "-",
    bankNewAddress: bankInfo?.bankNewAddress || "-",

    // NNTX package name (Mức trách nhiệm bảo hiểm)
    trachNhiemBH: trachNhiemBH
  };

  const zip = new PizZip(content);
  const doc = new Docxtemplater(zip, {
    paragraphLoop: true,
    linebreaks: true,
    // Don't throw error on missing tags in template
    nullGetter: () => '',
  });

  doc.render(templateData);

  const buf = doc.getZip().generate({
    type: 'nodebuffer',
    compression: 'DEFLATE',
  });

  return buf;
}