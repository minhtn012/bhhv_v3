/**
 * Unit Tests for Health Product Mapper Functions
 */

import {
  mapHealthToBhvFormat,
  mapPersonSection,
  mapHealthQuestions,
  mapBenefitAddons,
  transformSchemaFormToContractData,
  mapGender,
} from '../mapper';
import {
  HEALTH_PACKAGES,
  HEALTH_PURCHASE_YEARS,
  HEALTH_RELATIONSHIPS,
  HEALTH_BENEFIT_ADDONS,
  HEALTH_GENDER,
  HEALTH_QUESTIONS,
} from '../constants';
import { HEALTH_QUESTION_DEFINITIONS } from '../health-questions';
import { HealthContractFormData, HealthPersonSection, HealthQuestionAnswer } from '../types';

describe('Health Product Mapper', () => {
  describe('mapGender', () => {
    it('should map male gender to UUID', () => {
      expect(mapGender('male')).toBe(HEALTH_GENDER.MALE);
    });

    it('should map female gender to UUID', () => {
      expect(mapGender('female')).toBe(HEALTH_GENDER.FEMALE);
    });
  });

  describe('mapPersonSection', () => {
    it('should map buyer section correctly', () => {
      const person: HealthPersonSection = {
        fullname: 'Nguyen Van A',
        email: 'test@example.com',
        identityCard: '012345678901',
        phone: '0912345678',
        birthday: '15/05/1990',
        gender: 'male',
        job: 'Engineer',
        city: 'uuid-city-1',
        district: 'uuid-district-1',
        address: '123 ABC Street',
      };

      // mapPersonSection(prefix, person) - returns {`${prefix}_field`: value}
      const result = mapPersonSection('buyer', person);

      expect(result.buyer_fullname).toBe('Nguyen Van A');
      expect(result.buyer_email).toBe('test@example.com');
      expect(result.buyer_identity_card).toBe('012345678901');
      expect(result.buyer_phone).toBe('0912345678');
      expect(result.buyer_birthday).toBe('15/05/1990');
      expect(result.buyer_gender).toBe(HEALTH_GENDER.MALE);
      expect(result.buyer_job).toBe('Engineer');
      expect(result.buyer_city).toBe('uuid-city-1');
      expect(result.buyer_district).toBe('uuid-district-1');
      expect(result.buyer_address).toBe('123 ABC Street');
    });

    it('should include prefixed fields for insured person', () => {
      const person: HealthPersonSection = {
        fullname: 'Nguyen Van B',
        email: 'b@example.com',
        identityCard: '012345678902',
        phone: '0912345679',
        birthday: '20/10/1992',
        gender: 'female',
        city: 'uuid-city-2',
        district: 'uuid-district-2',
        address: '456 XYZ Street',
      };

      const result = mapPersonSection('insured_person', person);

      expect(result.insured_person_fullname).toBe('Nguyen Van B');
      expect(result.insured_person_gender).toBe(HEALTH_GENDER.FEMALE);
    });

    it('should include prefixed fields for beneficiary', () => {
      const person: HealthPersonSection = {
        fullname: 'Nguyen Van C',
        email: 'c@example.com',
        identityCard: '012345678903',
        phone: '0912345670',
        birthday: '01/01/2000',
        gender: 'male',
        city: 'uuid-city-3',
        district: 'uuid-district-3',
        address: '789 DEF Street',
      };

      const result = mapPersonSection('beneficiary', person);

      expect(result.beneficiary_fullname).toBe('Nguyen Van C');
      expect(result.beneficiary_gender).toBe(HEALTH_GENDER.MALE);
    });
  });

  describe('mapHealthQuestions', () => {
    it('should map all 5 health questions correctly with No answers', () => {
      const questions: HealthQuestionAnswer[] = HEALTH_QUESTION_DEFINITIONS.map(q => ({
        questionId: q.id,
        answer: false,
        details: undefined,
      }));

      const result = mapHealthQuestions(questions);

      // Should have 5 question entries
      expect(Object.keys(result)).toHaveLength(5);

      // Each question should have "No" answer option
      expect(result[HEALTH_QUESTIONS.Q1_HOSPITALIZATION.id]).toBe(HEALTH_QUESTIONS.Q1_HOSPITALIZATION.noOption);
      expect(result[HEALTH_QUESTIONS.Q2_ONGOING_TREATMENT.id]).toBe(HEALTH_QUESTIONS.Q2_ONGOING_TREATMENT.noOption);
      expect(result[HEALTH_QUESTIONS.Q3_CHRONIC_CONDITIONS.id]).toBe(HEALTH_QUESTIONS.Q3_CHRONIC_CONDITIONS.noOption);
      expect(result[HEALTH_QUESTIONS.Q4_PREVIOUS_CLAIMS.id]).toBe(HEALTH_QUESTIONS.Q4_PREVIOUS_CLAIMS.noOption);
      expect(result[HEALTH_QUESTIONS.Q5_PREVIOUS_REJECTION.id]).toBe(HEALTH_QUESTIONS.Q5_PREVIOUS_REJECTION.noOption);
    });

    it('should map "Yes" answers with details', () => {
      const questions: HealthQuestionAnswer[] = [
        {
          questionId: HEALTH_QUESTIONS.Q1_HOSPITALIZATION.id,
          answer: true,
          details: 'Details for question 1',
        },
        {
          questionId: HEALTH_QUESTIONS.Q2_ONGOING_TREATMENT.id,
          answer: false,
        },
        {
          questionId: HEALTH_QUESTIONS.Q3_CHRONIC_CONDITIONS.id,
          answer: true,
          details: 'Details for question 3',
        },
        {
          questionId: HEALTH_QUESTIONS.Q4_PREVIOUS_CLAIMS.id,
          answer: false,
        },
        {
          questionId: HEALTH_QUESTIONS.Q5_PREVIOUS_REJECTION.id,
          answer: false,
        },
      ];

      const result = mapHealthQuestions(questions);

      // Check "Yes" answers
      expect(result[HEALTH_QUESTIONS.Q1_HOSPITALIZATION.id]).toBe(HEALTH_QUESTIONS.Q1_HOSPITALIZATION.yesOption);
      expect(result[HEALTH_QUESTIONS.Q1_HOSPITALIZATION.textField]).toBe('Details for question 1');

      // Check "No" answers
      expect(result[HEALTH_QUESTIONS.Q2_ONGOING_TREATMENT.id]).toBe(HEALTH_QUESTIONS.Q2_ONGOING_TREATMENT.noOption);

      // Check another "Yes" answer
      expect(result[HEALTH_QUESTIONS.Q3_CHRONIC_CONDITIONS.id]).toBe(HEALTH_QUESTIONS.Q3_CHRONIC_CONDITIONS.yesOption);
      expect(result[HEALTH_QUESTIONS.Q3_CHRONIC_CONDITIONS.textField]).toBe('Details for question 3');
    });
  });

  describe('mapBenefitAddons', () => {
    it('should return empty object when no addons selected', () => {
      const addons = {
        maternity: false,
        outpatient: false,
        diseaseDeath: false,
      };

      const result = mapBenefitAddons(addons);

      expect(Object.keys(result)).toHaveLength(0);
    });

    it('should map selected addons to UUID object', () => {
      const addons = {
        maternity: true,
        outpatient: true,
        diseaseDeath: false,
      };

      const result = mapBenefitAddons(addons);

      expect(result[HEALTH_BENEFIT_ADDONS.MATERNITY]).toBe(HEALTH_BENEFIT_ADDONS.MATERNITY);
      expect(result[HEALTH_BENEFIT_ADDONS.OUTPATIENT]).toBe(HEALTH_BENEFIT_ADDONS.OUTPATIENT);
      expect(result[HEALTH_BENEFIT_ADDONS.DISEASE_DEATH]).toBeUndefined();
    });

    it('should map all addons when all selected', () => {
      const addons = {
        maternity: true,
        outpatient: true,
        diseaseDeath: true,
      };

      const result = mapBenefitAddons(addons);

      expect(Object.keys(result)).toHaveLength(3);
      expect(result[HEALTH_BENEFIT_ADDONS.MATERNITY]).toBe(HEALTH_BENEFIT_ADDONS.MATERNITY);
      expect(result[HEALTH_BENEFIT_ADDONS.OUTPATIENT]).toBe(HEALTH_BENEFIT_ADDONS.OUTPATIENT);
      expect(result[HEALTH_BENEFIT_ADDONS.DISEASE_DEATH]).toBe(HEALTH_BENEFIT_ADDONS.DISEASE_DEATH);
    });
  });

  describe('mapHealthToBhvFormat', () => {
    const mockFormData: HealthContractFormData = {
      kindAction: 'insert',
      packageType: HEALTH_PACKAGES.GOLD,
      purchaseYears: 1,
      benefitAddons: {
        maternity: false,
        outpatient: false,
        diseaseDeath: false,
      },
      healthQuestions: HEALTH_QUESTION_DEFINITIONS.map(q => ({
        questionId: q.id,
        answer: false,
      })),
      buyer: {
        fullname: 'Nguyen Van A',
        email: 'buyer@example.com',
        identityCard: '012345678901',
        phone: '0912345678',
        birthday: '15/05/1990',
        gender: 'male',
        job: 'Engineer',
        city: 'city-uuid',
        district: 'district-uuid',
        address: '123 Street',
      },
      insuredPerson: {
        fullname: 'Nguyen Van B',
        email: 'insured@example.com',
        identityCard: '012345678902',
        phone: '0912345679',
        birthday: '20/10/1992',
        gender: 'female',
        job: 'Teacher',
        city: 'city-uuid',
        district: 'district-uuid',
        address: '456 Street',
        relationship: HEALTH_RELATIONSHIPS.SPOUSE,
      },
      beneficiary: {
        fullname: 'Nguyen Van C',
        email: 'beneficiary@example.com',
        identityCard: '012345678903',
        phone: '0912345670',
        birthday: '01/01/2000',
        gender: 'male',
        city: 'city-uuid',
        district: 'district-uuid',
        address: '789 Street',
        relationship: HEALTH_RELATIONSHIPS.CHILD,
      },
      activeDate: '01/01/2024',
      inactiveDate: '01/01/2025',
      totalPremium: 5000000,
      customerKind: 'personal',
    };

    it('should create payload for new contract (empty sale_code)', () => {
      const result = mapHealthToBhvFormat(mockFormData);
      const innerData = JSON.parse(result.data);

      expect(result.action_name).toBe('human/medical/care/install');
      expect(innerData.sale_code).toBe('');
      expect(innerData.kind_action).toBe('insert');
      expect(innerData.health_protector_package).toBe(HEALTH_PACKAGES.GOLD);
      expect(innerData.health_protector_year_buy).toBe(HEALTH_PURCHASE_YEARS.ONE_YEAR);
    });

    it('should create payload for confirmation (with sale_code)', () => {
      const saleCode = 'test-sale-code-uuid';
      const result = mapHealthToBhvFormat(mockFormData, saleCode);
      const innerData = JSON.parse(result.data);

      expect(innerData.sale_code).toBe(saleCode);
    });

    it('should include dates and premium', () => {
      const result = mapHealthToBhvFormat(mockFormData);
      const innerData = JSON.parse(result.data);

      expect(innerData.active_date).toBe('01/01/2024');
      expect(innerData.inactive_date).toBe('01/01/2025');
      expect(innerData.total_premium).toBe('5000000');
    });

    it('should handle renewal with certificate code', () => {
      const renewalData: HealthContractFormData = {
        ...mockFormData,
        kindAction: 'renew',
        certificateCode: 'GCN-123456',
      };

      const result = mapHealthToBhvFormat(renewalData);
      const innerData = JSON.parse(result.data);

      expect(innerData.kind_action).toBe('renew');
      expect(innerData.certificate_code).toBe('GCN-123456');
    });

    it('should always use 1-year purchase (current implementation)', () => {
      const twoYearData: HealthContractFormData = {
        ...mockFormData,
        purchaseYears: 2,
      };

      const result = mapHealthToBhvFormat(twoYearData);
      const innerData = JSON.parse(result.data);

      // Currently only 1-year purchase is supported
      expect(innerData.health_protector_year_buy).toBe(HEALTH_PURCHASE_YEARS.ONE_YEAR);
    });
  });

  describe('transformSchemaFormToContractData', () => {
    it('should transform schema form data to contract format', () => {
      const formData: Record<string, unknown> = {
        kindAction: 'insert',
        packageType: HEALTH_PACKAGES.PLATINUM,
        purchaseYears: '1',
        benefitMaternity: false,
        benefitOutpatient: true,
        benefitDiseaseDeath: false,
        // Health questions
        ...HEALTH_QUESTION_DEFINITIONS.reduce((acc, q) => ({
          ...acc,
          [`question_${q.code}`]: false,
        }), {}),
        // Buyer
        buyerFullname: 'Test Buyer',
        buyerEmail: 'buyer@test.com',
        buyerIdentityCard: '123456789012',
        buyerPhone: '0901234567',
        buyerBirthday: '01/01/1990',
        buyerGender: 'male',
        buyerJob: 'Developer',
        buyerProvince: 'province-uuid',
        buyerDistrict: 'district-uuid',
        buyerAddress: '123 Test Street',
        // Same as flags
        insuredSameAsBuyer: false,
        beneficiarySameAsInsured: false,
        // Insured person
        insuredFullname: 'Test Insured',
        insuredEmail: 'insured@test.com',
        insuredIdentityCard: '123456789013',
        insuredPhone: '0901234568',
        insuredBirthday: '01/01/1995',
        insuredGender: 'female',
        insuredJob: 'Designer',
        insuredProvince: 'province-uuid',
        insuredDistrict: 'district-uuid',
        insuredAddress: '456 Test Street',
        insuredRelationship: HEALTH_RELATIONSHIPS.SPOUSE,
        // Beneficiary
        beneficiaryFullname: 'Test Beneficiary',
        beneficiaryEmail: 'beneficiary@test.com',
        beneficiaryIdentityCard: '123456789014',
        beneficiaryPhone: '0901234569',
        beneficiaryBirthday: '01/01/2000',
        beneficiaryGender: 'male',
        beneficiaryJob: 'Student',
        beneficiaryProvince: 'province-uuid',
        beneficiaryDistrict: 'district-uuid',
        beneficiaryAddress: '789 Test Street',
        beneficiaryRelationship: HEALTH_RELATIONSHIPS.CHILD,
        // Dates
        activeDate: '01/01/2024',
        inactiveDate: '01/01/2025',
        totalPremium: '6000000',
        customerKind: 'personal',
      };

      const result = transformSchemaFormToContractData(formData);

      expect(result.kindAction).toBe('insert');
      expect(result.packageType).toBe(HEALTH_PACKAGES.PLATINUM);
      expect(result.purchaseYears).toBe(1);
      expect(result.benefitAddons.outpatient).toBe(true);
      expect(result.benefitAddons.maternity).toBe(false);

      expect(result.buyer.fullname).toBe('Test Buyer');
      expect(result.buyer.email).toBe('buyer@test.com');

      expect(result.insuredPerson.fullname).toBe('Test Insured');
      expect(result.insuredPerson.relationship).toBe(HEALTH_RELATIONSHIPS.SPOUSE);

      expect(result.beneficiary.fullname).toBe('Test Beneficiary');
      expect(result.beneficiary.relationship).toBe(HEALTH_RELATIONSHIPS.CHILD);

      expect(result.totalPremium).toBe(6000000);
    });

    it('should copy buyer data when insuredSameAsBuyer is true', () => {
      const formData: Record<string, unknown> = {
        kindAction: 'insert',
        packageType: HEALTH_PACKAGES.GOLD,
        purchaseYears: '1',
        benefitMaternity: false,
        benefitOutpatient: false,
        benefitDiseaseDeath: false,
        ...HEALTH_QUESTION_DEFINITIONS.reduce((acc, q) => ({
          ...acc,
          [`question_${q.code}`]: false,
        }), {}),
        buyerFullname: 'Same Person',
        buyerEmail: 'same@test.com',
        buyerIdentityCard: '123456789012',
        buyerPhone: '0901234567',
        buyerBirthday: '01/01/1990',
        buyerGender: 'male',
        buyerJob: 'Worker',
        buyerProvince: 'province-uuid',
        buyerDistrict: 'district-uuid',
        buyerAddress: '123 Same Street',
        insuredSameAsBuyer: true,
        beneficiarySameAsInsured: false,
        beneficiaryFullname: 'Different Person',
        beneficiaryEmail: 'different@test.com',
        beneficiaryIdentityCard: '123456789015',
        beneficiaryPhone: '0901234560',
        beneficiaryBirthday: '01/01/2005',
        beneficiaryGender: 'female',
        beneficiaryJob: 'None',
        beneficiaryProvince: 'province-uuid',
        beneficiaryDistrict: 'district-uuid',
        beneficiaryAddress: '999 Different Street',
        beneficiaryRelationship: HEALTH_RELATIONSHIPS.CHILD,
        activeDate: '01/01/2024',
        inactiveDate: '01/01/2025',
        totalPremium: '5000000',
        customerKind: 'personal',
      };

      const result = transformSchemaFormToContractData(formData);

      // Insured person should be same as buyer
      expect(result.insuredPerson.fullname).toBe('Same Person');
      expect(result.insuredPerson.email).toBe('same@test.com');
      expect(result.insuredPerson.identityCard).toBe('123456789012');
      expect(result.insuredPerson.relationship).toBe(HEALTH_RELATIONSHIPS.SELF);

      // Beneficiary should be different
      expect(result.beneficiary.fullname).toBe('Different Person');
    });
  });
});
