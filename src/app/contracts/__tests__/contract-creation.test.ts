/**
 * Contract Creation Logic Tests
 * 
 * Tests for verifying contract creation logic with proper fee calculations
 */

import { calculateTotalVehicleValue, tndsCategories } from '@/utils/insurance-calculator';

describe('Contract Creation Fee Calculation', () => {
  
  describe('Custom Rate Fee Calculation', () => {
    test('should calculate correct fees with custom rate - exact UI scenario', () => {
      // Test data matching the UI scenario that's failing
      const testData = {
        giaTriXe: 800000000, // 800tr
        giaTriPin: 200000000, // 200tr
        loaiDongCo: '2cdc787a-207b-4e8c-b56d-ae016f1c2c94',
        customRate: 1.25, // Custom rate
        originalRate: 1.21, // Original package rate
        includeTNDS: true,
        tndsCategory: 'tai_tren_15_tan',
        includeNNTX: true,
        nntxFee: 0,
        taiTucPercentage: 0
      };

      // Calculate phí vật chất gốc (original package fee)
      const totalVehicleValue = calculateTotalVehicleValue(
        testData.giaTriXe, 
        testData.giaTriPin, 
        testData.loaiDongCo
      );
      const phiVatChatGoc = (totalVehicleValue * testData.originalRate) / 100;

      // Calculate final vat chat fee with custom rate
      const finalVatChatFee = (totalVehicleValue * testData.customRate) / 100;

      // Calculate other fees
      const phiTNDS = testData.includeTNDS && testData.tndsCategory 
        ? tndsCategories[testData.tndsCategory as keyof typeof tndsCategories].fee 
        : 0;
      const phiNNTX = testData.includeNNTX ? testData.nntxFee : 0;
      const phiTaiTuc = (totalVehicleValue * testData.taiTucPercentage) / 100;

      // Calculate totals
      const phiTruocKhiGiam = phiVatChatGoc + phiTNDS + phiNNTX + phiTaiTuc;
      const phiSauKhiGiam = finalVatChatFee + phiTNDS + phiNNTX + phiTaiTuc;

      // Assertions
      expect(totalVehicleValue).toBe(1000000000); // 1 billion
      expect(phiVatChatGoc).toBe(12100000); // 1000tr * 1.21% = 12.1tr
      expect(finalVatChatFee).toBe(12500000); // 1000tr * 1.25% = 12.5tr
      expect(phiTNDS).toBe(3520000); // From tndsCategories
      expect(phiNNTX).toBe(0);
      expect(phiTaiTuc).toBe(0);
      
      expect(phiTruocKhiGiam).toBe(15620000); // 12.1tr + 3.52tr + 0 + 0
      expect(phiSauKhiGiam).toBe(16020000); // 12.5tr + 3.52tr + 0 + 0 = 16.02tr
      
      // This should match UI display
      expect(phiSauKhiGiam).toBe(16020000);
    });

    test('should calculate fees without custom rate', () => {
      const testData = {
        giaTriXe: 800000000,
        giaTriPin: 200000000,
        loaiDongCo: '2cdc787a-207b-4e8c-b56d-ae016f1c2c94',
        originalRate: 1.21,
        isCustomRateModified: false,
        includeTNDS: true,
        tndsCategory: 'tai_tren_15_tan',
        includeNNTX: false,
        nntxFee: 0,
        taiTucPercentage: 0
      };

      const totalVehicleValue = calculateTotalVehicleValue(
        testData.giaTriXe, 
        testData.giaTriPin, 
        testData.loaiDongCo
      );
      const phiVatChatGoc = (totalVehicleValue * testData.originalRate) / 100;
      const finalVatChatFee = phiVatChatGoc; // No custom rate

      const phiTNDS = tndsCategories[testData.tndsCategory as keyof typeof tndsCategories].fee;
      const phiNNTX = 0;
      const phiTaiTuc = 0;

      const phiTruocKhiGiam = phiVatChatGoc + phiTNDS + phiNNTX + phiTaiTuc;
      const phiSauKhiGiam = finalVatChatFee + phiTNDS + phiNNTX + phiTaiTuc;

      // Without custom rate, both should be equal
      expect(phiTruocKhiGiam).toBe(phiSauKhiGiam);
      expect(phiSauKhiGiam).toBe(15620000); // 12.1tr + 3.52tr
    });

    test('should calculate fees with renewal percentage', () => {
      const testData = {
        giaTriXe: 800000000,
        giaTriPin: 200000000,
        loaiDongCo: '2cdc787a-207b-4e8c-b56d-ae016f1c2c94',
        originalRate: 1.21,
        taiTucPercentage: 2, // 2% renewal
        includeTNDS: true,
        tndsCategory: 'tai_tren_15_tan',
        includeNNTX: false,
        nntxFee: 0
      };

      const totalVehicleValue = calculateTotalVehicleValue(
        testData.giaTriXe, 
        testData.giaTriPin, 
        testData.loaiDongCo
      );
      const phiVatChatGoc = (totalVehicleValue * testData.originalRate) / 100;
      const phiTNDS = tndsCategories[testData.tndsCategory as keyof typeof tndsCategories].fee;
      const phiNNTX = 0;
      const phiTaiTuc = (totalVehicleValue * testData.taiTucPercentage) / 100;

      const phiTruocKhiGiam = phiVatChatGoc + phiTNDS + phiNNTX + phiTaiTuc;
      const phiSauKhiGiam = phiVatChatGoc + phiTNDS + phiNNTX + phiTaiTuc;

      expect(phiTaiTuc).toBe(20000000); // 1000tr * 2% = 20tr
      expect(phiSauKhiGiam).toBe(35620000); // 12.1tr + 3.52tr + 0 + 20tr
    });
  });

  describe('Contract Data Structure', () => {
    test('should create correct contract data with all new fields', () => {
      const mockFormData = {
        giaTriXe: '800,000,000',
        giaTriPin: '200,000,000',
        loaiDongCo: '2cdc787a-207b-4e8c-b56d-ae016f1c2c94',
        includeTNDS: true,
        tndsCategory: 'tai_tren_15_tan',
        includeNNTX: true,
        taiTucPercentage: 0
      };

      const selectedPackage = {
        name: 'Gói Cơ bản',
        rate: 1.21,
        fee: 12100000
      };

      const customRate = 1.25;
      const isCustomRateModified = true;
      const nntxFee = 0;

      // Simulate the calculation logic from contracts/new/page.tsx
      const parseCurrency = (value: string) => parseInt(value.replace(/,/g, ''));
      
      const totalVehicleValue = calculateTotalVehicleValue(
        parseCurrency(mockFormData.giaTriXe),
        mockFormData.giaTriPin,
        mockFormData.loaiDongCo
      );

      const phiVatChatGoc = selectedPackage.fee;
      const finalVatChatFee = isCustomRateModified && customRate 
        ? (totalVehicleValue * customRate) / 100
        : phiVatChatGoc;

      const phiTNDS = mockFormData.includeTNDS && mockFormData.tndsCategory 
        ? tndsCategories[mockFormData.tndsCategory as keyof typeof tndsCategories].fee 
        : 0;
      const phiNNTX = mockFormData.includeNNTX ? nntxFee : 0;
      const phiTaiTuc = (totalVehicleValue * mockFormData.taiTucPercentage) / 100;

      const phiTruocKhiGiam = phiVatChatGoc + phiTNDS + phiNNTX + phiTaiTuc;
      const phiSauKhiGiam = finalVatChatFee + phiTNDS + phiNNTX + phiTaiTuc;

      const contractData = {
        vatChatPackage: {
          name: selectedPackage.name,
          tyLePhi: selectedPackage.rate,
          customRate: isCustomRateModified ? customRate : undefined,
          isCustomRate: isCustomRateModified,
          phiVatChatGoc: phiVatChatGoc,
          phiVatChat: finalVatChatFee
        },
        phiTNDS,
        phiNNTX,
        phiTaiTuc,
        phiTruocKhiGiam,
        phiSauKhiGiam,
        tongPhi: phiSauKhiGiam
      };

      // Verify contract data structure
      expect(contractData.vatChatPackage.phiVatChatGoc).toBe(12100000);
      expect(contractData.vatChatPackage.phiVatChat).toBe(12500000);
      expect(contractData.vatChatPackage.customRate).toBe(1.25);
      expect(contractData.vatChatPackage.isCustomRate).toBe(true);
      
      expect(contractData.phiTruocKhiGiam).toBe(15620000);
      expect(contractData.phiSauKhiGiam).toBe(16020000);
      expect(contractData.tongPhi).toBe(16020000);
      
      // This should match UI display and fix the DB mismatch
      expect(contractData.tongPhi).toBe(16020000);
    });
  });
});