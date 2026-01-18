/**
 * Unit Tests for Pacific Cross Travel Insurance Mapper
 */

import {
  formatDateForPC,
  formatDateRange,
  calculateAge,
  mapInsuredPerson,
  mapTravelToPacificCrossFormat,
  parseCertIdFromRedirect,
  getProductName,
} from '../mapper';
import { TRAVEL_PRODUCT_LABELS } from '../constants';
import type { TravelContractFormData } from '../types';

describe('Pacific Cross Travel Mapper', () => {
  describe('formatDateForPC', () => {
    it('should format ISO date (YYYY-MM-DD) to DD/MM/YYYY', () => {
      expect(formatDateForPC('2026-01-17')).toBe('17/01/2026');
    });

    it('should format edge case: first day of year', () => {
      expect(formatDateForPC('2026-01-01')).toBe('01/01/2026');
    });

    it('should format edge case: last day of year', () => {
      expect(formatDateForPC('2026-12-31')).toBe('31/12/2026');
    });

    it('should format with leading zeros correctly', () => {
      expect(formatDateForPC('2026-02-03')).toBe('03/02/2026');
    });

    it('should return already formatted date (DD/MM/YYYY) unchanged', () => {
      expect(formatDateForPC('17/01/2026')).toBe('17/01/2026');
    });

    it('should return invalid date string unchanged', () => {
      expect(formatDateForPC('invalid')).toBe('invalid');
    });

    it('should handle empty string', () => {
      expect(formatDateForPC('')).toBe('');
    });

    it('should format partial date string as ISO date', () => {
      // JavaScript Date parses '2026-01' as Jan 1, 2026
      expect(formatDateForPC('2026-01')).toBe('01/01/2026');
    });
  });

  describe('formatDateRange', () => {
    it('should format date range string correctly', () => {
      expect(formatDateRange('2026-01-17', '2026-01-23')).toBe(
        '17/01/2026 - 23/01/2026'
      );
    });

    it('should handle single day range', () => {
      expect(formatDateRange('2026-01-17', '2026-01-17')).toBe(
        '17/01/2026 - 17/01/2026'
      );
    });

    it('should handle multi-month range', () => {
      expect(formatDateRange('2026-01-17', '2026-12-31')).toBe(
        '17/01/2026 - 31/12/2026'
      );
    });

    it('should handle already formatted dates in range', () => {
      expect(formatDateRange('17/01/2026', '23/01/2026')).toBe(
        '17/01/2026 - 23/01/2026'
      );
    });
  });

  describe('calculateAge', () => {
    it('should calculate age correctly when birthday has passed this year', () => {
      const today = new Date();
      // Birthday 10 years ago, already passed this year
      const tenYearsAgo = new Date(
        today.getFullYear() - 10,
        today.getMonth(),
        today.getDate()
      );
      expect(calculateAge(tenYearsAgo.toISOString())).toBe(10);
    });

    it('should handle birthday not yet occurred this year', () => {
      const today = new Date();
      // Birthday in the future month (hasn't occurred yet)
      const futureMonth = new Date(
        today.getFullYear() - 10,
        today.getMonth() + 1,
        today.getDate()
      );
      expect(calculateAge(futureMonth.toISOString())).toBe(9);
    });

    it('should handle birthday in past month', () => {
      const today = new Date();
      // Birthday in past month
      const pastMonth = new Date(
        today.getFullYear() - 10,
        today.getMonth() - 1,
        today.getDate()
      );
      expect(calculateAge(pastMonth.toISOString())).toBe(10);
    });

    it('should handle newborn (age 0)', () => {
      const today = new Date();
      const newborn = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      expect(calculateAge(newborn.toISOString())).toBe(0);
    });

    it('should handle exactly 1 year old', () => {
      const today = new Date();
      const oneYearAgo = new Date(
        today.getFullYear() - 1,
        today.getMonth(),
        today.getDate()
      );
      expect(calculateAge(oneYearAgo.toISOString())).toBe(1);
    });

    it('should handle birthday on leap year transition', () => {
      // Person born on Feb 29, 2000
      const age = calculateAge('2000-02-29T00:00:00Z');
      expect(typeof age).toBe('number');
      expect(age).toBeGreaterThanOrEqual(0);
    });

    it('should parse ISO date string correctly', () => {
      const age = calculateAge('2010-05-15T00:00:00Z');
      const today = new Date();
      const expectedAge = today.getFullYear() - 2010;
      expect(age).toBeGreaterThanOrEqual(expectedAge - 1);
      expect(age).toBeLessThanOrEqual(expectedAge);
    });
  });

  describe('mapInsuredPerson', () => {
    const createPerson = (overrides = {}) => ({
      name: 'Nguyen Van A',
      dob: '2016-01-02',
      age: 10,
      gender: 'M' as const,
      country: 'VIETNAM',
      personalId: '123456789',
      telNo: '0901234567',
      email: 'test@example.com',
      beneficiary: 'Test Beneficiary',
      relationship: 'RELATION_O' as const,
      pct: 100,
      carRental: false,
      ...overrides,
    });

    it('should map first person with index 0', () => {
      const person = createPerson();
      const result = mapInsuredPerson(person, 0);

      expect(result['name_1']).toBe('Nguyen Van A');
      expect(result['dob_1']).toBe('02/01/2016');
      expect(result['age_1']).toBe('10');
      expect(result['gender_1']).toBe('M');
      expect(result['country_1']).toBe('VIETNAM');
      expect(result['personal_id_1']).toBe('123456789');
      expect(result['tel_no_1']).toBe('0901234567');
      expect(result['email_1']).toBe('test@example.com');
      expect(result['beneficiary_1']).toBe('Test Beneficiary');
      expect(result['relationship_1']).toBe('RELATION_O');
      expect(result['pct_1']).toBe('100');
    });

    it('should map second person with index 1', () => {
      const person = createPerson({ name: 'Nguyen Van B' });
      const result = mapInsuredPerson(person, 1);

      expect(result['name_2']).toBe('Nguyen Van B');
      expect(result['age_2']).toBe('10');
      expect(result['pct_2']).toBe('100');
    });

    it('should handle multiple persons with different indices', () => {
      for (let i = 0; i < 5; i++) {
        const person = createPerson({ name: `Person ${i}` });
        const result = mapInsuredPerson(person, i);
        const suffix = `_${i + 1}`;

        expect(result[`name${suffix}`]).toBe(`Person ${i}`);
        expect(Object.keys(result).every(k => k.includes(suffix))).toBe(true);
      }
    });

    it('should handle optional fields with empty strings', () => {
      const person = createPerson({
        telNo: undefined,
        email: undefined,
        beneficiary: undefined,
      });

      const result = mapInsuredPerson(person, 1);

      expect(result['tel_no_2']).toBe('');
      expect(result['email_2']).toBe('');
      expect(result['beneficiary_2']).toBe('');
    });

    it('should handle car rental fields', () => {
      const personWithRental = createPerson({
        carRental: true,
        carRentalDate: '2026-01-20',
        carRentalDays: 5,
      });

      const result = mapInsuredPerson(personWithRental, 0);

      expect(result['car_rental_1']).toBe('1');
      expect(result['car_rental_date_1']).toBe('2026-01-20');
      expect(result['car_rental_days_1']).toBe('5');
    });

    it('should handle car rental false', () => {
      const personNoRental = createPerson({
        carRental: false,
      });

      const result = mapInsuredPerson(personNoRental, 0);

      expect(result['car_rental_1']).toBe('');
      expect(result['car_rental_date_1']).toBe('');
      expect(result['car_rental_days_1']).toBe('');
    });

    it('should format female gender correctly', () => {
      const person = createPerson({ gender: 'F' as const });
      const result = mapInsuredPerson(person, 0);

      expect(result['gender_1']).toBe('F');
    });

    it('should convert age to string', () => {
      const person = createPerson({ age: 25 });
      const result = mapInsuredPerson(person, 0);

      expect(result['age_1']).toBe('25');
      expect(typeof result['age_1']).toBe('string');
    });

    it('should convert pct to string', () => {
      const person = createPerson({ pct: 50 });
      const result = mapInsuredPerson(person, 0);

      expect(result['pct_1']).toBe('50');
      expect(typeof result['pct_1']).toBe('string');
    });
  });

  describe('mapTravelToPacificCrossFormat', () => {
    const createFormData = (overrides = {}): TravelContractFormData => ({
      owner: {
        policyholder: 'Test Company',
        pocyType: 'Individual' as const,
        pohoType: 'POHO_TYPE_E' as const,
        email: 'test@example.com',
        telNo: '0901234567',
        address: '123 Test St',
        countryAddress: 'VIETNAM',
        startCountry: 'VIETNAM',
      },
      period: {
        dateFrom: '2026-01-17',
        dateTo: '2026-01-23',
        days: 7,
      },
      product: 2,
      plan: 534,
      insuredPersons: [
        {
          name: 'Nguyen Van A',
          dob: '2016-01-02',
          age: 10,
          gender: 'F' as const,
          country: 'VIETNAM',
          personalId: '111222333444',
          relationship: 'RELATION_M' as const,
          pct: 100,
        },
      ],
      ...overrides,
    });

    it('should build correct payload for quote request', () => {
      const formData = createFormData();
      const result = mapTravelToPacificCrossFormat(formData, 'csrf123', true);

      expect(result._token).toBe('csrf123');
      expect(result.is_quote).toBe('1');
      expect(result.policyholder).toBe('Test Company');
      expect(result.pocy_type).toBe('Individual');
      expect(result.poho_type).toBe('POHO_TYPE_E');
      expect(result.product).toBe('2');
      expect(result.plan).toBe('534');
    });

    it('should build correct payload for confirmation (not quote)', () => {
      const formData = createFormData();
      const result = mapTravelToPacificCrossFormat(formData, 'csrf456', false);

      expect(result._token).toBe('csrf456');
      expect(result.is_quote).toBe('0');
    });

    it('should include member count', () => {
      const formDataSingle = createFormData({
        insuredPersons: [
          {
            name: 'Person 1',
            dob: '2016-01-02',
            age: 10,
            gender: 'M' as const,
            country: 'VIETNAM',
            personalId: '111111111',
            relationship: 'RELATION_O' as const,
            pct: 100,
          },
        ],
      });

      const resultSingle = mapTravelToPacificCrossFormat(formDataSingle, 'csrf', true);
      expect(resultSingle.member_count).toBe('1');

      const formDataMultiple = createFormData({
        insuredPersons: [
          {
            name: 'Person 1',
            dob: '2016-01-02',
            age: 10,
            gender: 'M' as const,
            country: 'VIETNAM',
            personalId: '111111111',
            relationship: 'RELATION_O' as const,
            pct: 100,
          },
          {
            name: 'Person 2',
            dob: '2010-01-02',
            age: 16,
            gender: 'F' as const,
            country: 'VIETNAM',
            personalId: '222222222',
            relationship: 'RELATION_C' as const,
            pct: 100,
          },
          {
            name: 'Person 3',
            dob: '1990-01-02',
            age: 36,
            gender: 'M' as const,
            country: 'VIETNAM',
            personalId: '333333333',
            relationship: 'RELATION_F' as const,
            pct: 100,
          },
        ],
      });

      const resultMultiple = mapTravelToPacificCrossFormat(formDataMultiple, 'csrf', true);
      expect(resultMultiple.member_count).toBe('3');
    });

    it('should include all insured person fields for each person', () => {
      const formData = createFormData({
        insuredPersons: [
          {
            name: 'Nguyen Van A',
            dob: '2016-01-02',
            age: 10,
            gender: 'F' as const,
            country: 'VIETNAM',
            personalId: '111222333444',
            relationship: 'RELATION_M' as const,
            pct: 100,
          },
        ],
      });

      const result = mapTravelToPacificCrossFormat(formData, 'csrf', true);

      expect(result['name_1']).toBe('Nguyen Van A');
      expect(result['dob_1']).toBe('02/01/2016');
      expect(result['age_1']).toBe('10');
      expect(result['gender_1']).toBe('F');
      expect(result['country_1']).toBe('VIETNAM');
      expect(result['personal_id_1']).toBe('111222333444');
      expect(result['relationship_1']).toBe('RELATION_M');
      expect(result['pct_1']).toBe('100');
    });

    it('should include template fields for new rows', () => {
      const formData = createFormData();
      const result = mapTravelToPacificCrossFormat(formData, 'csrf', true);

      expect(result['name_xxx']).toBe('');
      expect(result['dob_xxx']).toBe('');
      expect(result['age_xxx']).toBe('');
      expect(result['gender_xxx']).toBe('');
      expect(result['country_xxx']).toBe('');
      expect(result['personal_id_xxx']).toBe('');
      expect(result['pct_xxx']).toBe('100');
      expect(result['car_rental_xxx']).toBe('');
    });

    it('should include period information', () => {
      const formData = createFormData({
        period: {
          dateFrom: '2026-02-01',
          dateTo: '2026-02-15',
          days: 15,
        },
      });

      const result = mapTravelToPacificCrossFormat(formData, 'csrf', true);

      expect(result.date_from_date_range).toBe('2026-02-01');
      expect(result.date_to_date_range).toBe('2026-02-15');
      expect(result.days_date_range).toBe('15');
      expect(result.date_range).toBe('01/02/2026 - 15/02/2026');
    });

    it('should include owner information', () => {
      const formData = createFormData({
        owner: {
          policyholder: 'Individual Name',
          pocyType: 'Individual' as const,
          pohoType: 'POHO_TYPE_E' as const,
          email: 'owner@example.com',
          telNo: '0912345678',
          address: '456 Owner Street',
          countryAddress: 'VIETNAM',
          startCountry: 'THAILAND',
          invTax: 'TAX123',
          invCompany: 'Company Ltd',
          invAddress: '789 Invoice Street',
        },
      });

      const result = mapTravelToPacificCrossFormat(formData, 'csrf', true);

      expect(result.policyholder).toBe('Individual Name');
      expect(result.email).toBe('owner@example.com');
      expect(result.tel_no).toBe('0912345678');
      expect(result.address).toBe('456 Owner Street');
      expect(result.country_address).toBe('VIETNAM');
      expect(result.start_country).toBe('THAILAND');
      expect(result.inv_tax).toBe('TAX123');
      expect(result.inv_company).toBe('Company Ltd');
      expect(result.inv_address).toBe('789 Invoice Street');
    });

    it('should include optional fields when provided', () => {
      const formData = createFormData({
        refNo: 'REF001',
        pnrNo: 'PNR123456',
        itinerary: 'Flight details',
        note: 'Special note',
        invAmount: 1000000,
      });

      const result = mapTravelToPacificCrossFormat(formData, 'csrf', true);

      expect(result.ref_no).toBe('REF001');
      expect(result.pnr_no).toBe('PNR123456');
      expect(result.itinerary).toBe('Flight details');
      expect(result.note).toBe('Special note');
      expect(result.inv_amount).toBe('1000000');
    });

    it('should handle empty optional fields', () => {
      const formData = createFormData();

      const result = mapTravelToPacificCrossFormat(formData, 'csrf', true);

      expect(result.ref_no).toBe('');
      expect(result.pnr_no).toBe('');
      expect(result.itinerary).toBe('');
      expect(result.note).toBe('');
      expect(result.inv_amount).toBe('');
    });

    it('should handle multiple insured persons correctly', () => {
      const formData = createFormData({
        insuredPersons: [
          {
            name: 'First Person',
            dob: '2010-05-15',
            age: 16,
            gender: 'M' as const,
            country: 'VIETNAM',
            personalId: '111111111111',
            relationship: 'RELATION_O' as const,
            pct: 50,
          },
          {
            name: 'Second Person',
            dob: '2008-03-20',
            age: 18,
            gender: 'F' as const,
            country: 'VIETNAM',
            personalId: '222222222222',
            relationship: 'RELATION_C' as const,
            pct: 50,
          },
        ],
      });

      const result = mapTravelToPacificCrossFormat(formData, 'csrf', true);

      expect(result.member_count).toBe('2');
      expect(result['name_1']).toBe('First Person');
      expect(result['pct_1']).toBe('50');
      expect(result['name_2']).toBe('Second Person');
      expect(result['pct_2']).toBe('50');
    });

    it('should always include default fields', () => {
      const formData = createFormData();
      const result = mapTravelToPacificCrossFormat(formData, 'csrf', true);

      expect(result.last_update).toBe('');
      expect(result.agent).toBe('');
      expect(result.old_message_file).toBe('[]');
      expect(result.input_message_file).toBe('');
      expect(result.old_import_members).toBe('[]');
      expect(result.input_import_members).toBe('');
      expect(result.member_row_deleted).toBe('');
      expect(result.button).toBe('');
    });
  });

  describe('parseCertIdFromRedirect', () => {
    it('should extract cert ID from redirect URL', () => {
      const url = '/cert/306726::d3C2kw3WJS/edit';
      const result = parseCertIdFromRedirect(url);

      expect(result).toEqual({
        certId: '306726::d3C2kw3WJS',
        certNo: 306726,
      });
    });

    it('should extract cert ID with different hash format', () => {
      const url = '/cert/123456::abc123DEF456/view';
      const result = parseCertIdFromRedirect(url);

      expect(result).toEqual({
        certId: '123456::abc123DEF456',
        certNo: 123456,
      });
    });

    it('should handle URL with trailing slash', () => {
      const url = '/cert/999888::xyz123/';
      const result = parseCertIdFromRedirect(url);

      expect(result).toEqual({
        certId: '999888::xyz123',
        certNo: 999888,
      });
    });

    it('should handle URL with query parameters', () => {
      const url = '/cert/111222::hash123?redirect=true';
      const result = parseCertIdFromRedirect(url);

      // Regex captures everything after :: until next slash or end
      expect(result).toEqual({
        certId: '111222::hash123?redirect=true',
        certNo: 111222,
      });
    });

    it('should return null for invalid URL format', () => {
      expect(parseCertIdFromRedirect('/invalid/url')).toBeNull();
      expect(parseCertIdFromRedirect('/cert/nohash')).toBeNull();
      expect(parseCertIdFromRedirect('cert/123456::hash')).toBeNull();
      expect(parseCertIdFromRedirect('')).toBeNull();
    });

    it('should return null for missing cert ID', () => {
      expect(parseCertIdFromRedirect('/cert/')).toBeNull();
    });

    it('should handle large cert numbers', () => {
      const url = '/cert/999999999::verylonghashstring/edit';
      const result = parseCertIdFromRedirect(url);

      expect(result).toEqual({
        certId: '999999999::verylonghashstring',
        certNo: 999999999,
      });
    });

    it('should parse cert number as integer', () => {
      const url = '/cert/00123::hash/edit';
      const result = parseCertIdFromRedirect(url);

      expect(result?.certNo).toBe(123);
      expect(typeof result?.certNo).toBe('number');
    });
  });

  describe('getProductName', () => {
    it('should return product name for Bon Voyage (ID: 1)', () => {
      expect(getProductName(1)).toBe('Bon Voyage');
    });

    it('should return product name for Travel Flex (ID: 2)', () => {
      expect(getProductName(2)).toBe('Travel Flex');
    });

    it('should return product name for Domestic (ID: 3)', () => {
      expect(getProductName(3)).toBe('Domestic');
    });

    it('should return product name for Domestic Group (ID: 4)', () => {
      expect(getProductName(4)).toBe('Domestic Group');
    });

    it('should return product name for International Group (ID: 5)', () => {
      expect(getProductName(5)).toBe('International Group');
    });

    it('should return fallback for unknown product ID', () => {
      expect(getProductName(99)).toBe('Product 99');
      expect(getProductName(0)).toBe('Product 0');
      expect(getProductName(999)).toBe('Product 999');
    });

    it('should verify all labels are consistent', () => {
      for (const [id, label] of Object.entries(TRAVEL_PRODUCT_LABELS)) {
        const numId = parseInt(id, 10);
        expect(getProductName(numId)).toBe(label);
      }
    });

    it('should handle negative product IDs with fallback', () => {
      expect(getProductName(-1)).toBe('Product -1');
    });
  });
});
