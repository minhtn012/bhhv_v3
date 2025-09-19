import fs from 'fs';
import path from 'path';
import PizZip from 'pizzip';
import Docxtemplater from 'docxtemplater';

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

  // Map contract data to template variables
  const templateData = {
    // Variables with _v_c_ prefix (uppercase)
    _v_c_chuXe: contractData.chuXe || "-",
    _v_c_bienSo: contractData.bienSo || "-",
    _v_c_loaiXe: contractData.nhanHieu || "-",
    _v_c_soLoai: contractData.soLoai || "-",
    _v_c_carBodyStyle: contractData.carBodyStyle || "-",

    // Variables with _v_ prefix (lowercase/normal case)
    _v_diaChi: contractData.diaChi || "-",
    _v_soHD: contractData.contractNumber || "-",
    _v_namSanXuat: contractData.namSanXuat || "-",
    _v_soKhung: contractData.soKhung || "-",
    _v_soMay: contractData.soMay || "-",
    _v_soCho: contractData.soChoNgoi || "-",
    _v_giaTriXe: contractData.giaTriXe ? contractData.giaTriXe.toLocaleString('vi-VN') : "-",

    // Insurance package details
    _v_phiBatBuoc: contractData.tndsPackage?.phiBatBuoc ? contractData.tndsPackage.phiBatBuoc.toLocaleString('vi-VN') : "-",
    _v_phiTaiNan: contractData.taiNanPackage?.phiTaiNan ? contractData.taiNanPackage.phiTaiNan.toLocaleString('vi-VN') : "-",
    _v_phiVatChat: contractData.vatChatPackage?.phiVatChat ? contractData.vatChatPackage.phiVatChat.toLocaleString('vi-VN') : "-",
    _v_tongPhi: contractData.tongPhiBaoHiem ? contractData.tongPhiBaoHiem.toLocaleString('vi-VN') : "-",

    // Dates
    _v_ngayBatDau: contractData.ngayBatDau || "-",
    _v_ngayKetThuc: contractData.ngayKetThuc || "-",
    _v_ngayDKLD: contractData.ngayDKLD || "-",

    // Additional fields as needed based on template structure
    _v_mucKhauTru: contractData.vatChatPackage?.mucKhauTru ? contractData.vatChatPackage.mucKhauTru.toLocaleString('vi-VN') : "500,000",
    _v_soNamSuDung: contractData.soNamSuDung || "-",
    _v_trongTai: contractData.trongTai || "-",
    _v_loaiHinhKinhDoanh: contractData.loaiHinhKinhDoanh || "Không Kinh doanh",

    // Car details
    _v_carBrand: contractData.carBrand || "-",
    _v_carModel: contractData.carModel || "-",
    _v_carYear: contractData.carYear || "-",

    // Engine and electric vehicle
    _v_loaiDongCo: contractData.loaiDongCo || "-",
    _v_giaTriPin: contractData.giaTriPin ? contractData.giaTriPin.toLocaleString('vi-VN') : "-",

    // Buyer information
    _v_buyerEmail: contractData.buyerEmail || "-",
    _v_buyerPhone: contractData.buyerPhone || "-",
    _v_buyerGender: contractData.buyerGender || "-",
    _v_buyerCitizenId: contractData.buyerCitizenId || "-",
    _v_selectedProvince: contractData.selectedProvinceText || "-",
    _v_selectedDistrictWard: contractData.selectedDistrictWardText || "-",
    _v_specificAddress: contractData.specificAddress || "-",

    // Package rates and fees
    _v_tyLePhi: contractData.vatChatPackage?.tyLePhi || "-",
    _v_customRate: contractData.vatChatPackage?.customRate || "-",
    _v_isCustomRate: contractData.vatChatPackage?.isCustomRate ? "Có" : "Không",
    _v_phiVatChatGoc: contractData.vatChatPackage?.phiVatChatGoc ? contractData.vatChatPackage.phiVatChatGoc.toLocaleString('vi-VN') : "-",

    // Status and workflow
    _v_status: contractData.status || "-",
    _v_createdAt: contractData.createdAt ? new Date(contractData.createdAt).toLocaleDateString('vi-VN') : "-",
    _v_updatedAt: contractData.updatedAt ? new Date(contractData.updatedAt).toLocaleDateString('vi-VN') : "-",
    _v_createdBy: contractData.createdBy || "-",

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