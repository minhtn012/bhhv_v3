/**
 * BHV Health Insurance Type Definitions
 */

import {
  HEALTH_PACKAGES,
  HEALTH_CONTRACT_STATUS,
  HEALTH_KIND_ACTION,
  HEALTH_GENDER,
} from './constants';

// Package type enum
export type HealthPackageType = typeof HEALTH_PACKAGES[keyof typeof HEALTH_PACKAGES];

// Contract status type
export type HealthContractStatus = typeof HEALTH_CONTRACT_STATUS[keyof typeof HEALTH_CONTRACT_STATUS];

// Kind action type
export type HealthKindAction = typeof HEALTH_KIND_ACTION[keyof typeof HEALTH_KIND_ACTION];

// Gender type
export type HealthGender = typeof HEALTH_GENDER[keyof typeof HEALTH_GENDER];

/**
 * Health Question Answer Structure
 */
export interface HealthQuestionAnswer {
  questionId: string;
  answer: boolean;          // true = Yes, false = No
  details?: string;         // Conditional text when answer is Yes
}

/**
 * Person Section Interface (reused for buyer, insured, beneficiary)
 */
export interface HealthPersonSection {
  fullname: string;
  email: string;
  identityCard: string;     // CCCD/CMND
  phone: string;
  birthday: string;         // DD/MM/YYYY format
  gender: 'male' | 'female';
  job?: string;
  city: string;             // Province UUID
  cityText?: string;        // Province name for display
  district: string;         // District UUID
  districtText?: string;    // District name for display
  address: string;          // Specific address
}

/**
 * Benefit Addons Structure
 */
export interface HealthBenefitAddons {
  maternity: boolean;
  outpatient: boolean;
  diseaseDeath: boolean;
}

/**
 * Health Contract Form Data (UI input)
 */
export interface HealthContractFormData {
  // Order info
  kindAction: HealthKindAction;
  certificateCode?: string;

  // Package selection
  packageType: HealthPackageType;
  purchaseYears: number;
  benefitAddons: HealthBenefitAddons;

  // Health questions (5 questions)
  healthQuestions: HealthQuestionAnswer[];

  // Person sections
  buyer: HealthPersonSection;
  insuredPerson: HealthPersonSection & {
    relationship: string;  // Relationship UUID to buyer
  };
  beneficiary: HealthPersonSection & {
    relationship: string;  // Relationship UUID to insured
  };

  // Flags for same-as-buyer
  insuredSameAsBuyer?: boolean;
  beneficiarySameAsInsured?: boolean;

  // Validity dates
  activeDate: string;       // DD/MM/YYYY format
  inactiveDate: string;     // DD/MM/YYYY format
  totalPremium: number;     // VND amount

  // Customer type
  customerKind: 'personal' | 'company';
}

/**
 * Health Contract Database Document
 */
export interface IHealthContract {
  _id: string;
  contractNumber: string;
  productType: 'health';

  // Order info
  kindAction: HealthKindAction;
  certificateCode?: string;

  // Package
  packageType: HealthPackageType;
  packageName: string;
  purchaseYears: number;
  benefitAddons: HealthBenefitAddons;

  // Health questions (5)
  healthQuestions: HealthQuestionAnswer[];

  // Persons (3 sections)
  buyer: HealthPersonSection;
  insuredPerson: HealthPersonSection & {
    relationship: string;
  };
  beneficiary: HealthPersonSection & {
    relationship: string;
  };

  // Customer type
  customerKind: 'personal' | 'company';

  // Dates
  activeDate: string;
  inactiveDate: string;
  totalPremium: number;

  // BHV data
  bhvSaleCode?: string;
  bhvContractNumber?: string;

  // Workflow (same as vehicle)
  status: HealthContractStatus;
  statusHistory: Array<{
    status: string;
    changedBy: string;
    changedAt: Date;
    note?: string;
  }>;

  // Metadata
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * BHV API Payload Structure (inner data field)
 */
export interface HealthBhvInnerPayload {
  // Order info
  sale_code: string;
  kind_action: string;
  certificate_code: string;

  // Package selection
  health_protector_package: string;
  health_protector_year_buy: string;

  // Benefit addons (UUID keys with boolean-like values)
  [benefitAddonUUID: string]: string | boolean | undefined;

  // Health questions (UUID keys)
  // Each question maps to either yes/no option UUID

  // Customer type
  kind_customer: string;

  // Buyer info
  buyer_fullname: string;
  buyer_email: string;
  buyer_identity_card: string;
  buyer_phone: string;
  buyer_birthday: string;
  buyer_gender: string;
  buyer_job?: string;
  buyer_city: string;
  buyer_district: string;
  buyer_address: string;

  // Insured person info
  chk_insured_person: string;
  insured_person_relationship: string;
  insured_person_fullname: string;
  insured_person_email: string;
  insured_person_identity_card: string;
  insured_person_phone: string;
  insured_person_birthday: string;
  insured_person_gender: string;
  insured_person_job?: string;
  insured_person_city: string;
  insured_person_district: string;
  insured_person_address: string;

  // Beneficiary info
  chk_beneficiary: string;
  beneficiary_relationship: string;
  beneficiary_fullname: string;
  beneficiary_email: string;
  beneficiary_identity_card: string;
  beneficiary_phone: string;
  beneficiary_birthday: string;
  beneficiary_gender: string;
  beneficiary_job?: string;
  beneficiary_city: string;
  beneficiary_district: string;
  beneficiary_address: string;

  // Dates & Premium
  active_date: string;
  inactive_date: string;
  chk_agree_term: string;
  total_premium: string;
}

/**
 * BHV API Request Structure (outer wrapper)
 */
export interface HealthBhvPayload {
  action_name: string;
  data: string;   // JSON stringified HealthBhvInnerPayload
  d_info: object;
}

/**
 * BHV API Response for Create (Step 1)
 */
export interface HealthBhvCreateResponse {
  success: boolean;
  saleCode?: string;
  htmlPreview?: string;
  error?: string;
  rawResponse?: unknown;
}

/**
 * BHV API Response for Confirm (Step 2)
 */
export interface HealthBhvConfirmResponse {
  success: boolean;
  contractNumber?: string;
  error?: string;
  rawResponse?: unknown;
}
