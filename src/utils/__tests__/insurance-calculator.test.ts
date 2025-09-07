import {
  calculateInsuranceRates,
  formatCurrency,
  parseCurrency,
  formatNumberInput,
  calculateCustomFee,
  suggestTNDSCategory,
  calculateNNTXFee,
  calculateNNTXFeeSimple,
  getAvailableTNDSCategories,
  calculateWithCustomRates,
  physicalDamageRates,
  tndsCategories,
  additionalRateAU009,
  CalculationResult,
} from '../insurance-calculator';

describe('Insurance Calculator', () => {
  const currentYear = new Date().getFullYear();

  describe('calculateInsuranceRates', () => {
    describe('Age Group Calculation', () => {
      test('should calculate correct age group for car under 3 years', () => {
        const result = calculateInsuranceRates(
          500_000_000,
          currentYear - 1,
          5,
          'khong_kd_cho_nguoi'
        );
        expect(result.baseRates).toEqual([1.1, 1.1, 1.15, 1.15]); // 500M is in 500-700M range
      });

      test('should calculate correct age group for car 3-6 years', () => {
        const result = calculateInsuranceRates(
          500_000_000,
          currentYear - 4,
          5,
          'khong_kd_cho_nguoi'
        );
        expect(result.baseRates).toEqual([1.2, 1.25, 1.3, 1.35]); // 500M, 3-6 years, 500-700M range
      });

      test('should calculate correct age group for car 6-10 years', () => {
        const result = calculateInsuranceRates(
          500_000_000,
          currentYear - 8,
          5,
          'khong_kd_cho_nguoi'
        );
        expect(result.baseRates).toEqual([1.3, 1.4, 1.45, 1.55]); // 500M, 6-10 years, 500-700M range
      });

      test('should calculate correct age group for car over 10 years', () => {
        const result = calculateInsuranceRates(
          500_000_000,
          currentYear - 12,
          5,
          'khong_kd_cho_nguoi'
        );
        expect(result.baseRates).toEqual([1.4, 1.55, 1.6, null]); // 500M, >10 years, 500-700M range
      });
    });

    describe('Price Categories for Family Cars', () => {
      test('should use correct rates for cars under 500M', () => {
        const result = calculateInsuranceRates(
          400_000_000,
          currentYear - 1,
          5,
          'khong_kd_cho_nguoi'
        );
        expect(result.baseRates).toEqual([1.25, 1.25, 1.3, 1.3]);
      });

      test('should use correct rates for cars 500-700M', () => {
        const result = calculateInsuranceRates(
          600_000_000,
          currentYear - 1,
          5,
          'khong_kd_cho_nguoi'
        );
        expect(result.baseRates).toEqual([1.1, 1.1, 1.15, 1.15]);
      });

      test('should use correct rates for cars 700M-1B', () => {
        const result = calculateInsuranceRates(
          800_000_000,
          currentYear - 1,
          5,
          'khong_kd_cho_nguoi'
        );
        expect(result.baseRates).toEqual([1.0, 1.0, 1.05, 1.05]);
      });

      test('should use correct rates for cars over 1B', () => {
        const result = calculateInsuranceRates(
          1_200_000_000,
          currentYear - 1,
          5,
          'khong_kd_cho_nguoi'
        );
        expect(result.baseRates).toEqual([1.0, 1.0, 1.0, 1.0]);
      });
    });

    describe('Business Type Calculations', () => {
      test('should calculate rates for Grab/Be commercial cars', () => {
        const result = calculateInsuranceRates(
          700_000_000,
          currentYear - 2,
          5,
          'kd_grab_be'
        );
        expect(result.baseRates).toEqual([1.8, 1.8, 1.85, 1.85]);
      });

      test('should calculate rates for taxi', () => {
        const result = calculateInsuranceRates(
          600_000_000,
          currentYear - 3,
          5,
          'kd_taxi_tu_lai'
        );
        expect(result.baseRates).toEqual([2.5, 2.55, 2.6, 2.65]); // 3 years old falls in 3-6 age group
      });

      test('should calculate rates for commercial trucks', () => {
        const result = calculateInsuranceRates(
          800_000_000,
          currentYear - 4,
          3,
          'kd_cho_hang',
          5000
        );
        expect(result.baseRates).toEqual([1.32, 1.37, 1.42, 1.47]);
      });
    });

    describe('Edge Cases', () => {
      test('should handle old cars (>10 years) without AU009 package', () => {
        const result = calculateInsuranceRates(
          600_000_000,
          currentYear - 12,
          5,
          'khong_kd_cho_nguoi'
        );
        
        expect(result.baseRates[3]).toBeNull();
        expect(result.finalRates[4]).toBeNull(); // AU009 package should be null
      });

      test('should add AU009 rate for cars with valid AU009', () => {
        const result = calculateInsuranceRates(
          600_000_000,
          currentYear - 5,
          5,
          'khong_kd_cho_nguoi'
        );
        
        const expectedAU009 = result.baseRates[3] + additionalRateAU009;
        expect(result.finalRates[4]).toBe(expectedAU009);
      });

      test('should handle unknown business type gracefully', () => {
        const result = calculateInsuranceRates(
          500_000_000,
          currentYear - 2,
          5,
          'unknown_business_type'
        );
        
        expect(result.baseRates).toEqual([null, null, null, null]);
      });
    });

    describe('Deductible Amount (Mức Khấu Trừ)', () => {
      test('should set 500K deductible for non-commercial cars', () => {
        const result = calculateInsuranceRates(
          500_000_000,
          currentYear - 2,
          5,
          'khong_kd_cho_nguoi'
        );
        expect(result.mucKhauTru).toBe(500000);
      });

      test('should set 1M deductible for commercial cars', () => {
        const result = calculateInsuranceRates(
          700_000_000,
          currentYear - 2,
          5,
          'kd_grab_be'
        );
        expect(result.mucKhauTru).toBe(1000000);
      });
    });

    describe('TNDS Category Calculation', () => {
      test('should calculate correct TNDS for non-commercial passenger cars', () => {
        const result = calculateInsuranceRates(
          500_000_000,
          currentYear - 2,
          5,
          'khong_kd_cho_nguoi'
        );
        expect(result.tndsKey).toBe('duoi_6_cho_khong_kd');
      });

      test('should calculate correct TNDS for commercial passenger cars', () => {
        const result = calculateInsuranceRates(
          700_000_000,
          currentYear - 2,
          7,
          'kd_grab_be'
        );
        expect(result.tndsKey).toBe('7_cho_kd');
      });

      test('should calculate correct TNDS for trucks by weight', () => {
        const testCases = [
          { weight: 2000, expected: 'tai_duoi_3_tan' },
          { weight: 5000, expected: 'tai_3_den_8_tan' },
          { weight: 10000, expected: 'tai_8_den_15_tan' },
          { weight: 20000, expected: 'tai_tren_15_tan' },
        ];

        testCases.forEach(({ weight, expected }) => {
          const result = calculateInsuranceRates(
            800_000_000,
            currentYear - 3,
            3,
            'kd_cho_hang',
            weight
          );
          expect(result.tndsKey).toBe(expected);
        });
      });

      test('should calculate correct TNDS for pickup/van', () => {
        const nonCommercial = calculateInsuranceRates(
          600_000_000,
          currentYear - 2,
          5,
          'khong_kd_pickup_van'
        );
        expect(nonCommercial.tndsKey).toBe('pickup_khong_kd');

        const commercial = calculateInsuranceRates(
          600_000_000,
          currentYear - 2,
          5,
          'kd_pickup_van'
        );
        expect(commercial.tndsKey).toBe('pickup_kd');
      });
    });
  });

  describe('Currency Functions', () => {
    describe('formatCurrency', () => {
      test('should format VND currency correctly', () => {
        expect(formatCurrency(1000000)).toMatch(/1\.000\.000.+₫/);
        expect(formatCurrency(500000)).toMatch(/500\.000.+₫/);
        expect(formatCurrency(0)).toMatch(/0.+₫/);
      });
    });

    describe('parseCurrency', () => {
      test('should parse currency strings correctly', () => {
        expect(parseCurrency('1,000,000')).toBe(1000000);
        expect(parseCurrency('500.000 ₫')).toBe(500000);
        expect(parseCurrency('1.234.567 ₫')).toBe(1234567);
        expect(parseCurrency('invalid')).toBe(0);
        expect(parseCurrency('')).toBe(0);
      });
    });

    describe('formatNumberInput', () => {
      test('should format number input with commas', () => {
        expect(formatNumberInput('1000000')).toBe('1.000.000');
        expect(formatNumberInput('500000')).toBe('500.000');
        expect(formatNumberInput('abc')).toBe('');
        expect(formatNumberInput('')).toBe('');
      });
    });
  });

  describe('calculateCustomFee', () => {
    test('should calculate fee correctly without minimum fee', () => {
      const result = calculateCustomFee(600_000_000, 1.5, 'khong_kd_cho_nguoi');
      expect(result.fee).toBe(9_000_000); // 600M * 1.5%
      expect(result.hasMinFee).toBe(false);
    });

    test('should apply minimum fee for family cars under 500M', () => {
      const result = calculateCustomFee(300_000_000, 1.0, 'khong_kd_cho_nguoi');
      expect(result.fee).toBe(5_500_000); // Minimum fee
      expect(result.hasMinFee).toBe(true);
    });

    test('should not apply minimum fee for commercial cars', () => {
      const result = calculateCustomFee(300_000_000, 1.0, 'kd_grab_be');
      expect(result.fee).toBe(3_000_000); // 300M * 1.0%
      expect(result.hasMinFee).toBe(false);
    });

    test('should not apply minimum fee for family cars over 500M', () => {
      const result = calculateCustomFee(600_000_000, 0.5, 'khong_kd_cho_nguoi');
      expect(result.fee).toBe(3_000_000); // 600M * 0.5%
      expect(result.hasMinFee).toBe(false);
    });
  });

  describe('suggestTNDSCategory', () => {
    test('should suggest correct category for passenger cars', () => {
      expect(suggestTNDSCategory('khong_kd_cho_nguoi', 5)).toBe('duoi_6_cho_khong_kd');
      expect(suggestTNDSCategory('khong_kd_cho_nguoi', 7)).toBe('6_den_11_cho_khong_kd');
      expect(suggestTNDSCategory('khong_kd_cho_nguoi', 15)).toBe('12_den_24_cho_khong_kd');
      expect(suggestTNDSCategory('khong_kd_cho_nguoi', 30)).toBe('tren_24_cho_khong_kd');
    });

    test('should suggest correct category for commercial passenger cars', () => {
      expect(suggestTNDSCategory('kd_grab_be', 5)).toBe('duoi_6_cho_kd');
      expect(suggestTNDSCategory('kd_grab_be', 8)).toBe('8_cho_kd');
      expect(suggestTNDSCategory('kd_grab_be', 20)).toBe('tren_16_den_24_kd');
      expect(suggestTNDSCategory('kd_grab_be', 30)).toBe('tren_24_kd');
    });

    test('should suggest correct category for trucks', () => {
      expect(suggestTNDSCategory('kd_cho_hang', 3, 2000)).toBe('tai_duoi_3_tan');
      expect(suggestTNDSCategory('kd_cho_hang', 3, 5000)).toBe('tai_3_den_8_tan');
      expect(suggestTNDSCategory('kd_cho_hang', 3, 10000)).toBe('tai_8_den_15_tan');
      expect(suggestTNDSCategory('kd_cho_hang', 3, 20000)).toBe('tai_tren_15_tan');
    });

    test('should suggest correct category for pickup/van', () => {
      expect(suggestTNDSCategory('khong_kd_pickup_van', 5)).toBe('pickup_khong_kd');
      expect(suggestTNDSCategory('kd_pickup_van', 5)).toBe('pickup_kd');
    });
  });

  describe('NNTX Functions', () => {
    describe('calculateNNTXFee', () => {
      test('should calculate NNTX fee correctly', () => {
        expect(calculateNNTXFee(100000, 5)).toBe(500000);
        expect(calculateNNTXFee(150000, 7)).toBe(1050000);
        expect(calculateNNTXFee(0, 5)).toBe(0);
      });
    });

    describe('calculateNNTXFeeSimple', () => {
      test('should calculate simple NNTX fee', () => {
        expect(calculateNNTXFeeSimple(5)).toBe(50000);
        expect(calculateNNTXFeeSimple(7)).toBe(70000);
        expect(calculateNNTXFeeSimple(0)).toBe(0);
      });
    });
  });

  describe('getAvailableTNDSCategories', () => {
    test('should return all TNDS categories with correct structure', () => {
      const categories = getAvailableTNDSCategories();
      
      expect(categories).toHaveLength(Object.keys(tndsCategories).length);
      
      categories.forEach(category => {
        expect(category).toHaveProperty('key');
        expect(category).toHaveProperty('label');
        expect(category).toHaveProperty('fee');
        expect(typeof category.key).toBe('string');
        expect(typeof category.label).toBe('string');
        expect(typeof category.fee).toBe('number');
      });
      
      // Check specific categories
      const familyCarCategory = categories.find(c => c.key === 'duoi_6_cho_khong_kd');
      expect(familyCarCategory).toEqual({
        key: 'duoi_6_cho_khong_kd',
        label: 'Xe < 6 chỗ (Không KD)',
        fee: 480700
      });
    });
  });

  describe('calculateWithCustomRates', () => {
    test('should calculate comprehensive result with all fees', () => {
      const result = calculateWithCustomRates(
        600_000_000,
        currentYear - 3,
        5,
        'khong_kd_cho_nguoi',
        1, // Select package index 1
        [1.2, 1.3, 1.4, 1.5, 1.6], // Custom rates
        true, // Include TNDS
        'duoi_6_cho_khong_kd',
        false, // Don't include NNTX
        undefined
      );

      expect(result.customRates).toEqual([1.2, 1.3, 1.4, 1.5, 1.6]);
      expect(result.customFees).toHaveLength(5);
      expect(result.totalVatChatFee).toBe(result.customFees![1]); // Package index 1
      expect(result.totalTNDSFee).toBe(480700); // TNDS fee for duoi_6_cho_khong_kd
      expect(result.totalNNTXFee).toBe(0); // NNTX not included
      expect(result.grandTotal).toBe(result.totalVatChatFee + result.totalTNDSFee);
    });

    test('should handle NNTX inclusion', () => {
      const result = calculateWithCustomRates(
        600_000_000,
        currentYear - 3,
        5,
        'khong_kd_cho_nguoi',
        0,
        [1.2, 1.3, 1.4, 1.5, 1.6],
        false, // Don't include TNDS
        '',
        true, // Include NNTX
        undefined
      );

      expect(result.totalTNDSFee).toBe(0);
      expect(result.totalNNTXFee).toBe(0); // Since nntxFee is 0 in base calculation
    });

    test('should handle invalid TNDS category', () => {
      const result = calculateWithCustomRates(
        600_000_000,
        currentYear - 3,
        5,
        'khong_kd_cho_nguoi',
        0,
        [1.2, 1.3, 1.4, 1.5, 1.6],
        true,
        'invalid_category',
        false,
        undefined
      );

      expect(result.totalTNDSFee).toBe(0);
    });
  });

  describe('Data Integrity', () => {
    test('should have correct physicalDamageRates structure', () => {
      // Test family car rates structure
      const familyRates = physicalDamageRates['khong_kd_cho_nguoi'];
      expect(familyRates).toHaveProperty('duoi_500tr');
      expect(familyRates).toHaveProperty('tu_500_den_700tr');
      expect(familyRates).toHaveProperty('tu_700_den_1ty');
      expect(familyRates).toHaveProperty('tren_1ty');

      // Each price category should have 4 age groups
      Object.values(familyRates).forEach(priceCategory => {
        expect(priceCategory).toHaveProperty('age_under_3');
        expect(priceCategory).toHaveProperty('age_3_to_6');
        expect(priceCategory).toHaveProperty('age_6_to_10');
        expect(priceCategory).toHaveProperty('age_over_10');

        // Each age group should have 4 package rates
        Object.values(priceCategory).forEach(ageGroup => {
          expect(ageGroup).toHaveLength(4);
        });
      });
    });

    test('should have correct TNDS categories structure', () => {
      Object.values(tndsCategories).forEach(category => {
        expect(category).toHaveProperty('label');
        expect(category).toHaveProperty('fee');
        expect(typeof category.label).toBe('string');
        expect(typeof category.fee).toBe('number');
        expect(category.fee).toBeGreaterThan(0);
      });
    });

    test('should have correct AU009 additional rate', () => {
      expect(additionalRateAU009).toBe(0.10);
    });
  });

  describe('Comprehensive Integration Tests', () => {
    test('should handle complete family car scenario', () => {
      const result = calculateInsuranceRates(
        450_000_000, // Under 500M
        currentYear - 2, // 2 years old
        5, // 5 seats
        'khong_kd_cho_nguoi'
      );

      expect(result.baseRates).toEqual([1.25, 1.25, 1.3, 1.3]);
      expect(result.finalRates[4]).toBe(1.3 + 0.10); // AU009 added
      expect(result.mucKhauTru).toBe(500000);
      expect(result.tndsKey).toBe('duoi_6_cho_khong_kd');

      // Test custom fee calculation with minimum fee
      const customFee = calculateCustomFee(450_000_000, result.baseRates[0]!, 'khong_kd_cho_nguoi');
      expect(customFee.fee).toBe(5_625_000); // 450M * 1.25%
      expect(customFee.hasMinFee).toBe(false); // Above minimum
    });

    test('should handle complete commercial truck scenario', () => {
      const result = calculateInsuranceRates(
        800_000_000,
        currentYear - 5, // 5 years old
        3, // 3 seats (truck)
        'kd_cho_hang',
        7000 // 7 tons
      );

      expect(result.baseRates).toEqual([1.32, 1.37, 1.42, 1.47]);
      expect(result.finalRates[4]).toBe(1.47 + 0.10); // AU009 added
      expect(result.mucKhauTru).toBe(1000000); // Commercial deductible
      expect(result.tndsKey).toBe('tai_3_den_8_tan'); // 7 tons

      // Test TNDS suggestion
      const tndsKey = suggestTNDSCategory('kd_cho_hang', 3, 7000);
      expect(tndsKey).toBe('tai_3_den_8_tan');
    });
  });
});