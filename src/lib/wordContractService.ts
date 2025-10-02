import fs from 'fs';
import path from 'path';
import PizZip from 'pizzip';
import Docxtemplater from 'docxtemplater';

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
    diaChi: contractData.diaChi || "-",
    soHD: contractData.bhvContractNumber || "-",
    loaiXe: contractData.nhanHieu || "-",
    namSanXuat: contractData.namSanXuat || "-",
    soKhung: contractData.soKhung || "-",
    soMay: contractData.soMay || "-",
    soChoNgoi: contractData.soChoNgoi || "-",
    soCho: contractData.soChoNgoi || "-",
    giaTriXe: contractData.giaTriXe ? contractData.giaTriXe.toLocaleString('vi-VN') : "-",

    // Insurance package details
    phiBatBuoc: contractData.tndsPackage?.phiBatBuoc ? contractData.tndsPackage.phiBatBuoc.toLocaleString('vi-VN') : "-",
    phiTNDS: contractData.tndsPackage?.phiBatBuoc ? contractData.tndsPackage.phiBatBuoc.toLocaleString('vi-VN') : "-",
    phiTaiNan: contractData.taiNanPackage?.phiTaiNan ? contractData.taiNanPackage.phiTaiNan.toLocaleString('vi-VN') : "-",
    phiVatChat: contractData.vatChatPackage?.phiVatChat ? contractData.vatChatPackage.phiVatChat.toLocaleString('vi-VN') : "-",
    phiSauKhiGiam: contractData.tongPhiBaoHiem ? contractData.tongPhiBaoHiem.toLocaleString('vi-VN') : "-",
    phiSauKhiGiamBangChu: contractData.tongPhiBaoHiem ? numberToVietnameseWords(contractData.tongPhiBaoHiem) : "-",
    tongPhi: contractData.tongPhiBaoHiem ? contractData.tongPhiBaoHiem.toLocaleString('vi-VN') : "-",

    // Dates
    ngayBatDau: contractData.ngayBatDau || "-",
    ngayKetThuc: contractData.ngayKetThuc || "-",
    ngayDKLD: contractData.ngayDKLD || "-",

    // Additional fields as needed based on template structure
    mucKhauTru: contractData.vatChatPackage?.mucKhauTru ? contractData.vatChatPackage.mucKhauTru.toLocaleString('vi-VN') : "500,000",
    soNamSuDung: contractData.soNamSuDung || "-",
    namSuDung: contractData.soNamSuDung || "-",
    trongTai: contractData.trongTai || "-",
    loaiHinhKinhDoanh: contractData.loaiHinhKinhDoanh ? mapLoaiHinhKinhDoanh(contractData.loaiHinhKinhDoanh) : "Không Kinh doanh",

    // Car details
    carBrand: contractData.carBrand || "-",
    carModel: contractData.carModel || "-",
    carYear: contractData.carYear || "-",

    // Engine and electric vehicle
    loaiDongCo: contractData.loaiDongCo || "-",
    giaTriPin: contractData.giaTriPin ? contractData.giaTriPin.toLocaleString('vi-VN') : "-",

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
    phiVatChatGoc: contractData.vatChatPackage?.phiVatChatGoc ? contractData.vatChatPackage.phiVatChatGoc.toLocaleString('vi-VN') : "-",

    // Status and workflow
    status: contractData.status || "-",
    createdAt: contractData.createdAt ? new Date(contractData.createdAt).toLocaleDateString('vi-VN') : "-",
    updatedAt: contractData.updatedAt ? new Date(contractData.updatedAt).toLocaleDateString('vi-VN') : "-",
    createdBy: contractData.createdBy || "-",

    // Bank information for 3-party contracts
    c_bankName: bankInfo?.bankName || "-",
    bankOldAddress: bankInfo?.bankOldAddress || "-",
    bankNewAddress: bankInfo?.bankNewAddress || "-"
  };

  const zip = new PizZip(content);
  const doc = new Docxtemplater(zip, {
    paragraphLoop: true,
    linebreaks: true,
  });

  doc.render(templateData);

  const buf = doc.getZip().generate({
    type: 'nodebuffer',
    compression: 'DEFLATE',
  });

  return buf;
}