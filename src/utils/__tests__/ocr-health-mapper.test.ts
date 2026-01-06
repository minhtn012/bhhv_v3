/**
 * Unit tests for OCR Health Mapper
 */

import {
  convertDateFormat,
  convertGender,
  convertYesNoToString,
  convertYesNoToBool,
  mapPackageToUUID,
  mapRelationshipToUUID,
  cleanPhoneNumber,
  cleanPremiumAmount,
  mapOCRToHealthForm,
  mergeOCRResults,
  HealthOCROutput,
} from '../ocr-health-mapper';
import {
  HEALTH_PACKAGES,
  HEALTH_RELATIONSHIPS,
} from '@/providers/bhv-online/products/health/constants';

describe('ocr-health-mapper', () => {
  describe('convertDateFormat', () => {
    it('converts dd/mm/yyyy to YYYY-MM-DD', () => {
      expect(convertDateFormat('15/01/1990')).toBe('1990-01-15');
      expect(convertDateFormat('07/08/2021')).toBe('2021-08-07');
    });

    it('pads single-digit day/month', () => {
      expect(convertDateFormat('1/2/2020')).toBe('2020-02-01');
    });

    it('returns empty string for null/invalid', () => {
      expect(convertDateFormat(null)).toBe('');
      expect(convertDateFormat('')).toBe('');
      expect(convertDateFormat('invalid')).toBe('');
    });
  });

  describe('convertGender', () => {
    it('converts Nam to male', () => {
      expect(convertGender('Nam')).toBe('male');
      expect(convertGender('NAM')).toBe('male');
    });

    it('converts Nữ to female', () => {
      expect(convertGender('Nữ')).toBe('female');
      expect(convertGender('Nu')).toBe('female');
      expect(convertGender('NỮ')).toBe('female');
    });

    it('defaults to male for null/unknown', () => {
      expect(convertGender(null)).toBe('male');
      expect(convertGender('')).toBe('male');
    });
  });

  describe('convertYesNoToString', () => {
    it('converts Có to "true"', () => {
      expect(convertYesNoToString('Có')).toBe('true');
      expect(convertYesNoToString('Co')).toBe('true');
      expect(convertYesNoToString('CÓ')).toBe('true');
    });

    it('converts Không to "false"', () => {
      expect(convertYesNoToString('Không')).toBe('false');
      expect(convertYesNoToString('Khong')).toBe('false');
    });

    it('defaults to "false" for null', () => {
      expect(convertYesNoToString(null)).toBe('false');
    });
  });

  describe('convertYesNoToBool', () => {
    it('converts Có to true', () => {
      expect(convertYesNoToBool('Có')).toBe(true);
      expect(convertYesNoToBool('Co')).toBe(true);
    });

    it('converts Không to false', () => {
      expect(convertYesNoToBool('Không')).toBe(false);
      expect(convertYesNoToBool(null)).toBe(false);
    });
  });

  describe('mapPackageToUUID', () => {
    it('maps Vàng to GOLD', () => {
      expect(mapPackageToUUID('Vàng')).toBe(HEALTH_PACKAGES.GOLD);
      expect(mapPackageToUUID('Vang')).toBe(HEALTH_PACKAGES.GOLD);
    });

    it('maps Bạch Kim to PLATINUM', () => {
      expect(mapPackageToUUID('Bạch Kim')).toBe(HEALTH_PACKAGES.PLATINUM);
      expect(mapPackageToUUID('Bach Kim')).toBe(HEALTH_PACKAGES.PLATINUM);
    });

    it('maps Kim Cương to DIAMOND', () => {
      expect(mapPackageToUUID('Kim Cương')).toBe(HEALTH_PACKAGES.DIAMOND);
      expect(mapPackageToUUID('Kim Cuong')).toBe(HEALTH_PACKAGES.DIAMOND);
    });

    it('defaults to DIAMOND for null/unknown', () => {
      expect(mapPackageToUUID(null)).toBe(HEALTH_PACKAGES.DIAMOND);
      expect(mapPackageToUUID('unknown')).toBe(HEALTH_PACKAGES.DIAMOND);
    });
  });

  describe('mapRelationshipToUUID', () => {
    it('maps Bản thân to SELF', () => {
      expect(mapRelationshipToUUID('Bản thân')).toBe(HEALTH_RELATIONSHIPS.SELF);
      expect(mapRelationshipToUUID('Ban than')).toBe(HEALTH_RELATIONSHIPS.SELF);
    });

    it('maps Vợ/Chồng to SPOUSE', () => {
      expect(mapRelationshipToUUID('Vợ chồng')).toBe(HEALTH_RELATIONSHIPS.SPOUSE);
      expect(mapRelationshipToUUID('Vo')).toBe(HEALTH_RELATIONSHIPS.SPOUSE);
    });

    it('maps Cha/Mẹ to PARENT', () => {
      expect(mapRelationshipToUUID('Cha mẹ')).toBe(HEALTH_RELATIONSHIPS.PARENT);
      expect(mapRelationshipToUUID('Mẹ ruột')).toBe(HEALTH_RELATIONSHIPS.PARENT);
    });

    it('maps Con to CHILD', () => {
      expect(mapRelationshipToUUID('Con')).toBe(HEALTH_RELATIONSHIPS.CHILD);
      expect(mapRelationshipToUUID('Con gái')).toBe(HEALTH_RELATIONSHIPS.CHILD);
      expect(mapRelationshipToUUID('Con trai')).toBe(HEALTH_RELATIONSHIPS.CHILD);
    });

    it('maps Anh/Chị/Em to SIBLING', () => {
      expect(mapRelationshipToUUID('Anh')).toBe(HEALTH_RELATIONSHIPS.SIBLING);
      expect(mapRelationshipToUUID('Chị')).toBe(HEALTH_RELATIONSHIPS.SIBLING);
    });

    it('defaults to SELF for null', () => {
      expect(mapRelationshipToUUID(null)).toBe(HEALTH_RELATIONSHIPS.SELF);
    });
  });

  describe('cleanPhoneNumber', () => {
    it('removes spaces and special chars', () => {
      expect(cleanPhoneNumber('0901 234 567')).toBe('0901234567');
      expect(cleanPhoneNumber('090-123-4567')).toBe('0901234567');
    });

    it('returns empty for null', () => {
      expect(cleanPhoneNumber(null)).toBe('');
    });
  });

  describe('cleanPremiumAmount', () => {
    it('extracts digits only', () => {
      expect(cleanPremiumAmount('2,665,000 VND')).toBe('2665000');
      expect(cleanPremiumAmount('2.665.000')).toBe('2665000');
      expect(cleanPremiumAmount('2665000')).toBe('2665000');
    });

    it('returns empty for null', () => {
      expect(cleanPremiumAmount(null)).toBe('');
    });
  });

  describe('mapOCRToHealthForm', () => {
    it('maps complete OCR output to form data', () => {
      const ocr: Partial<HealthOCROutput> = {
        hoTen: 'Nguyễn Văn A',
        ngaySinh: '15/01/1990',
        gioiTinh: 'Nam',
        soCCCD: '012345678901',
        soDienThoai: '0901234567',
        email: 'test@example.com',
        diaChiThuongTru: '123 Test Street',
        ngDuocBH_hoTen: 'Nguyễn Thị B',
        ngDuocBH_ngaySinh: '20/05/2015',
        ngDuocBH_gioiTinh: 'Nữ',
        ngDuocBH_quanHe: 'Con gái',
        goiBaoHiem: 'Bạch Kim',
        qlThaiSan: 'Có',
        qlNgoaiTru: 'Có',
        qlTuVongBenhTat: 'Không',
        thoiHanTuNgay: '01/01/2025',
        thoiHanDenNgay: '31/12/2025',
        soPhiBH: '5000000',
        q1TraLoi: 'Không',
        q3TraLoi: 'Có',
        q3ChiTiet: 'Tiểu đường type 2',
      };

      const result = mapOCRToHealthForm(ocr);

      expect(result.buyerFullname).toBe('Nguyễn Văn A');
      expect(result.buyerBirthday).toBe('1990-01-15');
      expect(result.buyerGender).toBe('male');
      expect(result.insuredSameAsBuyer).toBe(false);
      expect(result.insuredRelationship).toBe(HEALTH_RELATIONSHIPS.CHILD);
      expect(result.insuredGender).toBe('female');
      expect(result.packageType).toBe(HEALTH_PACKAGES.PLATINUM);
      expect(result.benefitMaternity).toBe(true);
      expect(result.benefitOutpatient).toBe(true);
      expect(result.benefitDiseaseDeath).toBe(false);
      expect(result.activeDate).toBe('2025-01-01');
      expect(result.totalPremium).toBe('5000000');
      expect(result.q1Answer).toBe('false');
      expect(result.q3Answer).toBe('true');
      expect(result.q3Details).toBe('Tiểu đường type 2');
    });

    it('detects insuredSameAsBuyer when no insured name', () => {
      const ocr: Partial<HealthOCROutput> = {
        hoTen: 'Nguyễn Văn A',
        ngDuocBH_hoTen: null,
      };

      const result = mapOCRToHealthForm(ocr);
      expect(result.insuredSameAsBuyer).toBe(true);
    });

    it('detects insuredSameAsBuyer when same name', () => {
      const ocr: Partial<HealthOCROutput> = {
        hoTen: 'Nguyễn Văn A',
        ngDuocBH_hoTen: 'Nguyễn Văn A',
      };

      const result = mapOCRToHealthForm(ocr);
      expect(result.insuredSameAsBuyer).toBe(true);
    });
  });

  describe('mergeOCRResults', () => {
    it('merges multiple OCR results', () => {
      const page1: Partial<HealthOCROutput> = {
        hoTen: 'Nguyễn Văn A',
        ngaySinh: '15/01/1990',
        q1TraLoi: 'Không',
        ngThuHuong_hoTen: null,
      };

      const page2: Partial<HealthOCROutput> = {
        q5TraLoi: 'Không',
        ngThuHuong_hoTen: 'Nguyễn Văn A',
        ngThuHuong_quanHe: 'Bản thân',
      };

      const merged = mergeOCRResults([page1, page2]);

      expect(merged.hoTen).toBe('Nguyễn Văn A');
      expect(merged.ngaySinh).toBe('15/01/1990');
      expect(merged.q1TraLoi).toBe('Không');
      expect(merged.q5TraLoi).toBe('Không');
      expect(merged.ngThuHuong_hoTen).toBe('Nguyễn Văn A');
      expect(merged.ngThuHuong_quanHe).toBe('Bản thân');
    });

    it('later results override earlier non-null values', () => {
      const page1: Partial<HealthOCROutput> = { hoTen: 'Name 1' };
      const page2: Partial<HealthOCROutput> = { hoTen: 'Name 2' };

      const merged = mergeOCRResults([page1, page2]);
      expect(merged.hoTen).toBe('Name 2');
    });
  });
});
