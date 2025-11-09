/**
 * useContractForm Hook
 *
 * Centralized state management for contract creation/editing with reducer pattern.
 * Integrates calculation service for automatic fee updates.
 */

import { useReducer, useCallback, useMemo } from 'react';
import { calculateContractFees, type CalculationParams } from '@/services/contractCalculationService';
import { parseCurrency } from '@/utils/insurance-calculator';
import type { BaseContractFormData } from '@/types/contract';

/**
 * Extended form state with UI-specific fields and calculations
 */
export interface ContractFormState extends BaseContractFormData {
  // UI-specific fields
  customRates: number[];
  selectedNNTXPackage: string;
  tinhTrang: 'cap_moi' | 'tai_tuc';

  // Calculated fees (auto-updated)
  phiVatChatGoc: number;
  phiTruocKhiGiam: number;
  phiSauKhiGiam: number;
  totalAmount: number;

  // Custom rate tracking
  customRate: number | null;
  isCustomRateModified: boolean;

  // NNTX fee (calculated by component)
  nntxFee: number;

  // Package selection (from calculation hook)
  availablePackages: any[];
}

/**
 * Action types for reducer
 */
export type ContractFormAction =
  | { type: 'SET_FIELD'; field: keyof ContractFormState; value: any }
  | { type: 'SET_MULTIPLE_FIELDS'; fields: Partial<ContractFormState> }
  | { type: 'POPULATE_FROM_EXTRACT'; data: any }
  | { type: 'SET_VEHICLE_DATA'; data: { tenXe: string; nhanHieu: string; soLoai: string; kieuDang: string; namPhienBan: string } }
  | { type: 'SET_CUSTOM_RATE'; rate: number | null; isModified: boolean }
  | { type: 'SET_NNTX_FEE'; fee: number }
  | { type: 'SET_PACKAGE'; packageIndex: number; packageRate: number }
  | { type: 'CALCULATE_FEES'; params: Partial<CalculationParams> }
  | { type: 'RESET_FORM' };

/**
 * Initial form state
 */
const initialState: ContractFormState = {
  // Customer/Owner Information
  chuXe: '',
  email: '',
  soDienThoai: '',
  cccd: '',
  gioiTinh: 'nam',
  userType: 'ca_nhan',

  // Address Structure
  diaChi: '',
  selectedProvince: '',
  selectedProvinceText: '',
  selectedDistrictWard: '',
  selectedDistrictWardText: '',
  specificAddress: '',

  // New address
  newSelectedProvince: '',
  newSelectedProvinceText: '',
  newSelectedDistrictWard: '',
  newSelectedDistrictWardText: '',
  newSpecificAddress: '',

  // Vehicle Information
  bienSo: '',
  soKhung: '',
  soMay: '',
  tenXe: '',
  namSanXuat: '',
  soChoNgoi: '',
  trongTai: '',
  giaTriXe: '',
  loaiHinhKinhDoanh: 'khong_kd_cho_nguoi',
  loaiDongCo: '',
  giaTriPin: '',
  ngayDKLD: '',
  loaiXe: '',

  // Vehicle Details from Car Selection
  nhanHieu: '',
  soLoai: '',
  kieuDang: '',
  namPhienBan: '',

  // Package Selection & Insurance
  selectedPackageIndex: 0,
  includeTNDS: true,
  tndsCategory: '',
  includeNNTX: true,
  taiTucPercentage: 0,
  mucKhauTru: 500000,

  // UI-specific fields
  customRates: [],
  selectedNNTXPackage: '',
  tinhTrang: 'cap_moi',

  // Calculated fees
  phiVatChatGoc: 0,
  phiTruocKhiGiam: 0,
  phiSauKhiGiam: 0,
  totalAmount: 0,

  // Custom rate
  customRate: null,
  isCustomRateModified: false,

  // NNTX fee
  nntxFee: 0,

  // Available packages
  availablePackages: [],
};

/**
 * Calculate fees and update state
 */
function calculateAndUpdateFees(state: ContractFormState, packageRate?: number): ContractFormState {
  // Skip calculation if required fields are missing
  const giaTriXe = typeof state.giaTriXe === 'string' ? parseCurrency(state.giaTriXe) : state.giaTriXe;
  if (!giaTriXe || giaTriXe <= 0) {
    return state;
  }

  try {
    const fees = calculateContractFees({
      giaTriXe: state.giaTriXe,
      giaTriPin: state.giaTriPin,
      loaiDongCo: state.loaiDongCo,
      loaiHinhKinhDoanh: state.loaiHinhKinhDoanh,
      packageRate: packageRate || 0,
      customRate: state.isCustomRateModified ? state.customRate ?? undefined : undefined,
      isCustomRate: state.isCustomRateModified,
      includeTNDS: state.includeTNDS,
      tndsCategory: state.tndsCategory,
      includeNNTX: state.includeNNTX,
      nntxFee: state.nntxFee,
      taiTucPercentage: state.taiTucPercentage,
    });

    return {
      ...state,
      phiVatChatGoc: fees.phiVatChatGoc,
      phiTruocKhiGiam: fees.phiTruocKhiGiam,
      phiSauKhiGiam: fees.phiSauKhiGiam,
      totalAmount: fees.totalAmount,
    };
  } catch (error) {
    console.error('Fee calculation error:', error);
    return state;
  }
}

/**
 * Reducer function for contract form state
 */
function contractFormReducer(state: ContractFormState, action: ContractFormAction): ContractFormState {
  switch (action.type) {
    case 'SET_FIELD': {
      const newState = {
        ...state,
        [action.field]: action.value,
      };

      // Auto-recalculate if relevant field changed
      const recalcFields = ['giaTriXe', 'giaTriPin', 'loaiDongCo', 'loaiHinhKinhDoanh',
                           'includeTNDS', 'tndsCategory', 'includeNNTX', 'taiTucPercentage'];
      if (recalcFields.includes(action.field as string)) {
        return calculateAndUpdateFees(newState);
      }

      return newState;
    }

    case 'SET_MULTIPLE_FIELDS': {
      const newState = {
        ...state,
        ...action.fields,
      };

      // Recalculate if any relevant field was updated
      const hasRelevantChange = Object.keys(action.fields).some(key =>
        ['giaTriXe', 'giaTriPin', 'loaiDongCo', 'loaiHinhKinhDoanh',
         'includeTNDS', 'tndsCategory', 'includeNNTX', 'taiTucPercentage'].includes(key)
      );

      if (hasRelevantChange) {
        return calculateAndUpdateFees(newState);
      }

      return newState;
    }

    case 'POPULATE_FROM_EXTRACT': {
      const { data } = action;
      const updates: Partial<ContractFormState> = {};

      if (data.chuXe) updates.chuXe = data.chuXe;
      if (data.diaChi) {
        updates.diaChi = data.diaChi;
        // Parse diaChi: split by comma, take first element for specificAddress
        const parts = data.diaChi.split(',').map((s: string) => s.trim()).filter(Boolean);
        if (parts.length > 0) {
          updates.specificAddress = parts[0]; // First part = street address and number
        }
      }
      if (data.bienSo) updates.bienSo = data.bienSo;
      if (data.nhanHieu) updates.nhanHieu = data.nhanHieu;
      if (data.soLoai) updates.soLoai = data.soLoai;
      if (data.tenXe) updates.tenXe = data.tenXe;
      if (data.soKhung) updates.soKhung = data.soKhung;
      if (data.soMay) updates.soMay = data.soMay;
      if (data.ngayDangKyLanDau) updates.ngayDKLD = data.ngayDangKyLanDau;
      if (data.namSanXuat) updates.namSanXuat = data.namSanXuat;
      if (data.soChoNgoi) updates.soChoNgoi = data.soChoNgoi;
      if (data.trongTaiHangHoa) updates.trongTai = data.trongTaiHangHoa;
      if (data.loaiXe) updates.loaiXe = data.loaiXe;

      // Auto-select loại hình kinh doanh
      if (data.kinhDoanhVanTai && data.loaiXe) {
        const loaiXeText = data.loaiXe.toLowerCase();
        const isKinhDoanh = data.kinhDoanhVanTai.toLowerCase() === 'có';

        if (isKinhDoanh) {
          if (loaiXeText.includes('tải')) {
            updates.loaiHinhKinhDoanh = 'kd_cho_hang';
          } else if (loaiXeText.includes('bán tải') || loaiXeText.includes('pickup')) {
            updates.loaiHinhKinhDoanh = 'kd_pickup_van';
          } else {
            updates.loaiHinhKinhDoanh = 'kd_cho_khach_lien_tinh';
          }
        } else {
          if (loaiXeText.includes('tải')) {
            updates.loaiHinhKinhDoanh = 'khong_kd_cho_hang';
          } else if (loaiXeText.includes('bán tải') || loaiXeText.includes('pickup')) {
            updates.loaiHinhKinhDoanh = 'khong_kd_pickup_van';
          } else {
            updates.loaiHinhKinhDoanh = 'khong_kd_cho_nguoi';
          }
        }
      }

      return {
        ...state,
        ...updates,
      };
    }

    case 'SET_VEHICLE_DATA': {
      return {
        ...state,
        tenXe: action.data.tenXe,
        nhanHieu: action.data.nhanHieu,
        soLoai: action.data.soLoai,
        kieuDang: action.data.kieuDang,
        namPhienBan: action.data.namPhienBan,
      };
    }

    case 'SET_CUSTOM_RATE': {
      const newState = {
        ...state,
        customRate: action.rate,
        isCustomRateModified: action.isModified,
      };

      return calculateAndUpdateFees(newState);
    }

    case 'SET_NNTX_FEE': {
      const newState = {
        ...state,
        nntxFee: action.fee,
      };

      return calculateAndUpdateFees(newState);
    }

    case 'SET_PACKAGE': {
      const newState = {
        ...state,
        selectedPackageIndex: action.packageIndex,
      };

      return calculateAndUpdateFees(newState, action.packageRate);
    }

    case 'CALCULATE_FEES': {
      return calculateAndUpdateFees(state);
    }

    case 'RESET_FORM': {
      return initialState;
    }

    default:
      return state;
  }
}

/**
 * Custom hook for contract form management
 */
export default function useContractForm() {
  const [state, dispatch] = useReducer(contractFormReducer, initialState);

  // Action creators
  const setField = useCallback((field: keyof ContractFormState, value: any) => {
    dispatch({ type: 'SET_FIELD', field, value });
  }, []);

  const setMultipleFields = useCallback((fields: Partial<ContractFormState>) => {
    dispatch({ type: 'SET_MULTIPLE_FIELDS', fields });
  }, []);

  const populateFromExtract = useCallback((data: any) => {
    dispatch({ type: 'POPULATE_FROM_EXTRACT', data });
  }, []);

  const setVehicleData = useCallback((data: { tenXe: string; nhanHieu: string; soLoai: string; kieuDang: string; namPhienBan: string }) => {
    dispatch({ type: 'SET_VEHICLE_DATA', data });
  }, []);

  const setCustomRate = useCallback((rate: number | null, isModified: boolean) => {
    dispatch({ type: 'SET_CUSTOM_RATE', rate, isModified });
  }, []);

  const setNntxFee = useCallback((fee: number) => {
    dispatch({ type: 'SET_NNTX_FEE', fee });
  }, []);

  const setPackage = useCallback((packageIndex: number, packageRate: number) => {
    dispatch({ type: 'SET_PACKAGE', packageIndex, packageRate });
  }, []);

  const recalculateFees = useCallback(() => {
    dispatch({ type: 'CALCULATE_FEES', params: {} });
  }, []);

  const resetForm = useCallback(() => {
    dispatch({ type: 'RESET_FORM' });
  }, []);

  // Memoized values
  const hasRequiredFieldsForCalculation = useMemo(() => {
    const giaTriXe = typeof state.giaTriXe === 'string' ? parseCurrency(state.giaTriXe) : state.giaTriXe;
    return giaTriXe > 0 &&
           state.namSanXuat &&
           state.soChoNgoi &&
           state.loaiHinhKinhDoanh &&
           state.loaiDongCo;
  }, [state.giaTriXe, state.namSanXuat, state.soChoNgoi, state.loaiHinhKinhDoanh, state.loaiDongCo]);

  return {
    state,
    actions: {
      setField,
      setMultipleFields,
      populateFromExtract,
      setVehicleData,
      setCustomRate,
      setNntxFee,
      setPackage,
      recalculateFees,
      resetForm,
    },
    computed: {
      hasRequiredFieldsForCalculation,
    },
  };
}