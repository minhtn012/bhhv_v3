/**
 * BHV Health Insurance Data Mapper
 * Transforms form data to BHV API format
 */

import {
  HEALTH_API,
  HEALTH_PACKAGES,
  HEALTH_PURCHASE_YEARS,
  HEALTH_BENEFIT_ADDONS,
  HEALTH_QUESTIONS,
  HEALTH_CUSTOMER_KIND,
  HEALTH_RELATIONSHIPS,
  HEALTH_GENDER,
} from './constants';
import type {
  HealthContractFormData,
  IHealthContract,
  HealthBhvPayload,
  HealthPersonSection,
  HealthQuestionAnswer,
} from './types';

/**
 * Format date for BHV API (DD/MM/YYYY)
 */
export function formatDateForBhv(dateStr: string): string {
  // If already in DD/MM/YYYY format, return as-is
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(dateStr)) {
    return dateStr;
  }

  // Parse ISO date or other formats
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) {
    return dateStr; // Return original if parsing fails
  }

  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
}

/**
 * Map gender from form value to BHV API format
 */
export function mapGender(gender: string): string {
  if (gender === 'male') return HEALTH_GENDER.MALE;
  if (gender === 'female') return HEALTH_GENDER.FEMALE;
  return gender.toUpperCase();
}

/**
 * Map customer kind from form value to BHV UUID
 */
export function mapCustomerKind(kind: string): string {
  if (kind === 'personal') return HEALTH_CUSTOMER_KIND.PERSONAL;
  if (kind === 'company') return HEALTH_CUSTOMER_KIND.COMPANY;
  return HEALTH_CUSTOMER_KIND.PERSONAL;
}

/**
 * Map person section to BHV API field values
 */
export function mapPersonSection(
  prefix: string,
  person: HealthPersonSection
): Record<string, string> {
  return {
    [`${prefix}_fullname`]: person.fullname || '',
    [`${prefix}_email`]: person.email || '',
    [`${prefix}_identity_card`]: person.identityCard || '',
    [`${prefix}_phone`]: person.phone || '',
    [`${prefix}_birthday`]: formatDateForBhv(person.birthday),
    [`${prefix}_gender`]: mapGender(person.gender),
    [`${prefix}_job`]: person.job || '',
    [`${prefix}_city`]: person.city || '',
    [`${prefix}_district`]: person.district || '',
    [`${prefix}_address`]: person.address || '',
  };
}

/**
 * Map health questions to BHV API format
 * Each question maps to a UUID key with yes/no option value
 */
export function mapHealthQuestions(
  questions: HealthQuestionAnswer[]
): Record<string, string> {
  const result: Record<string, string> = {};

  const questionConfigs = [
    HEALTH_QUESTIONS.Q1_HOSPITALIZATION,
    HEALTH_QUESTIONS.Q2_ONGOING_TREATMENT,
    HEALTH_QUESTIONS.Q3_CHRONIC_CONDITIONS,
    HEALTH_QUESTIONS.Q4_PREVIOUS_CLAIMS,
    HEALTH_QUESTIONS.Q5_PREVIOUS_REJECTION,
  ];

  questions.forEach((qa, index) => {
    const config = questionConfigs[index];
    if (!config) return;

    // Set the answer option UUID
    const answerOption = qa.answer ? config.yesOption : config.noOption;
    result[config.id] = answerOption;

    // Set the text field if answer is Yes and details provided
    if (qa.answer && qa.details) {
      result[config.textField] = qa.details;
    }
  });

  return result;
}

/**
 * Map benefit addons to BHV API format
 */
export function mapBenefitAddons(addons: {
  maternity: boolean;
  outpatient: boolean;
  diseaseDeath: boolean;
}): Record<string, string> {
  const result: Record<string, string> = {};

  if (addons.maternity) {
    result[HEALTH_BENEFIT_ADDONS.MATERNITY] = HEALTH_BENEFIT_ADDONS.MATERNITY;
  }
  if (addons.outpatient) {
    result[HEALTH_BENEFIT_ADDONS.OUTPATIENT] = HEALTH_BENEFIT_ADDONS.OUTPATIENT;
  }
  if (addons.diseaseDeath) {
    result[HEALTH_BENEFIT_ADDONS.DISEASE_DEATH] = HEALTH_BENEFIT_ADDONS.DISEASE_DEATH;
  }

  return result;
}

/**
 * Transform health contract data to BHV API format
 * Used for both create (saleCode="") and confirm (saleCode="{UUID}")
 */
export function mapHealthToBhvFormat(
  data: HealthContractFormData | IHealthContract,
  saleCode: string = ''
): HealthBhvPayload {
  // Normalize data to common structure
  const formData = 'productType' in data ? normalizeContractToFormData(data) : data;

  // Build inner payload
  const innerPayload: Record<string, unknown> = {
    // Order info
    sale_code: saleCode,
    kind_action: formData.kindAction || 'insert',
    certificate_code: formData.certificateCode || '',

    // Package selection
    health_protector_package: formData.packageType || HEALTH_PACKAGES.DIAMOND,
    health_protector_year_buy: HEALTH_PURCHASE_YEARS.ONE_YEAR,

    // Customer type
    kind_customer: mapCustomerKind(formData.customerKind || 'personal'),

    // Dates & Premium
    active_date: formatDateForBhv(formData.activeDate),
    inactive_date: formatDateForBhv(formData.inactiveDate),
    chk_agree_term: '1',
    total_premium: formData.totalPremium?.toString() || '0',

    // Buyer info
    ...mapPersonSection('buyer', formData.buyer),

    // Insured person info
    chk_insured_person: 'on',
    insured_person_relationship: formData.insuredPerson?.relationship || HEALTH_RELATIONSHIPS.SELF,
    ...mapPersonSection('insured_person', formData.insuredSameAsBuyer ? formData.buyer : formData.insuredPerson),

    // Beneficiary info
    chk_beneficiary: 'on',
    beneficiary_relationship: formData.beneficiary?.relationship || HEALTH_RELATIONSHIPS.SELF,
    ...mapPersonSection('beneficiary',
      formData.beneficiarySameAsInsured
        ? (formData.insuredSameAsBuyer ? formData.buyer : formData.insuredPerson)
        : formData.beneficiary
    ),

    // Health questions
    ...mapHealthQuestions(formData.healthQuestions || []),

    // Benefit addons
    ...mapBenefitAddons(formData.benefitAddons || { maternity: false, outpatient: false, diseaseDeath: false }),
  };

  return {
    action_name: HEALTH_API.ACTION,
    data: JSON.stringify(innerPayload),
    d_info: {},
  };
}

/**
 * Normalize IHealthContract to HealthContractFormData
 */
function normalizeContractToFormData(contract: IHealthContract): HealthContractFormData {
  return {
    kindAction: contract.kindAction,
    certificateCode: contract.certificateCode,
    packageType: contract.packageType,
    purchaseYears: contract.purchaseYears,
    benefitAddons: contract.benefitAddons,
    healthQuestions: contract.healthQuestions,
    buyer: contract.buyer,
    insuredPerson: contract.insuredPerson,
    beneficiary: contract.beneficiary,
    activeDate: contract.activeDate,
    inactiveDate: contract.inactiveDate,
    totalPremium: contract.totalPremium,
    customerKind: contract.customerKind,
  };
}

/**
 * Transform form data from schema to HealthContractFormData
 * Maps flat form fields to nested structure
 */
export function transformSchemaFormToContractData(formData: Record<string, unknown>): HealthContractFormData {
  // Build health questions array from q1-q5 fields
  const healthQuestions: HealthQuestionAnswer[] = [
    {
      questionId: HEALTH_QUESTIONS.Q1_HOSPITALIZATION.id,
      answer: formData.q1Answer === 'true' || formData.q1Answer === true,
      details: (formData.q1Details as string) || undefined,
    },
    {
      questionId: HEALTH_QUESTIONS.Q2_ONGOING_TREATMENT.id,
      answer: formData.q2Answer === 'true' || formData.q2Answer === true,
      details: (formData.q2Details as string) || undefined,
    },
    {
      questionId: HEALTH_QUESTIONS.Q3_CHRONIC_CONDITIONS.id,
      answer: formData.q3Answer === 'true' || formData.q3Answer === true,
      details: (formData.q3Details as string) || undefined,
    },
    {
      questionId: HEALTH_QUESTIONS.Q4_PREVIOUS_CLAIMS.id,
      answer: formData.q4Answer === 'true' || formData.q4Answer === true,
      details: (formData.q4Details as string) || undefined,
    },
    {
      questionId: HEALTH_QUESTIONS.Q5_PREVIOUS_REJECTION.id,
      answer: formData.q5Answer === 'true' || formData.q5Answer === true,
      details: (formData.q5Details as string) || undefined,
    },
  ];

  // Extract location data from location picker
  const buyerLocation = formData.buyerLocation as { province?: string; district?: string } | undefined;
  const insuredLocation = formData.insuredLocation as { province?: string; district?: string } | undefined;
  const beneficiaryLocation = formData.beneficiaryLocation as { province?: string; district?: string } | undefined;

  // Build buyer person section
  const buyer: HealthPersonSection = {
    fullname: (formData.buyerFullname as string) || '',
    email: (formData.buyerEmail as string) || '',
    identityCard: (formData.buyerIdentityCard as string) || '',
    phone: (formData.buyerPhone as string) || '',
    birthday: (formData.buyerBirthday as string) || '',
    gender: (formData.buyerGender as 'male' | 'female') || 'male',
    job: (formData.buyerJob as string) || '',
    city: buyerLocation?.province || '',
    district: buyerLocation?.district || '',
    address: (formData.buyerAddress as string) || '',
  };

  // Build insured person section
  const insuredSameAsBuyer = formData.insuredSameAsBuyer === true;
  const insuredPerson: HealthPersonSection & { relationship: string } = insuredSameAsBuyer
    ? { ...buyer, relationship: HEALTH_RELATIONSHIPS.SELF }
    : {
        fullname: (formData.insuredFullname as string) || '',
        email: (formData.insuredEmail as string) || '',
        identityCard: (formData.insuredIdentityCard as string) || '',
        phone: (formData.insuredPhone as string) || '',
        birthday: (formData.insuredBirthday as string) || '',
        gender: (formData.insuredGender as 'male' | 'female') || 'male',
        job: (formData.insuredJob as string) || '',
        city: insuredLocation?.province || '',
        district: insuredLocation?.district || '',
        address: (formData.insuredAddress as string) || '',
        relationship: (formData.insuredRelationship as string) || HEALTH_RELATIONSHIPS.SELF,
      };

  // Build beneficiary section
  const beneficiarySameAsInsured = formData.beneficiarySameAsInsured === true;
  const beneficiary: HealthPersonSection & { relationship: string } = beneficiarySameAsInsured
    ? { ...insuredPerson, relationship: HEALTH_RELATIONSHIPS.SELF }
    : {
        fullname: (formData.beneficiaryFullname as string) || '',
        email: (formData.beneficiaryEmail as string) || '',
        identityCard: (formData.beneficiaryIdentityCard as string) || '',
        phone: (formData.beneficiaryPhone as string) || '',
        // Fallback to insured person's birthday if empty (required by model)
        birthday: (formData.beneficiaryBirthday as string) || insuredPerson.birthday || '',
        gender: (formData.beneficiaryGender as 'male' | 'female') || 'male',
        job: (formData.beneficiaryJob as string) || '',
        city: beneficiaryLocation?.province || '',
        district: beneficiaryLocation?.district || '',
        address: (formData.beneficiaryAddress as string) || '',
        relationship: (formData.beneficiaryRelationship as string) || HEALTH_RELATIONSHIPS.SELF,
      };

  return {
    kindAction: (formData.kindAction as 'insert' | 'renew') || 'insert',
    certificateCode: (formData.certificateCode as string) || undefined,
    packageType: (formData.packageType as HealthPackageType) || HEALTH_PACKAGES.DIAMOND,
    purchaseYears: parseInt((formData.purchaseYears as string) || '1', 10),
    benefitAddons: {
      maternity: formData.benefitMaternity === true,
      outpatient: formData.benefitOutpatient === true,
      diseaseDeath: formData.benefitDiseaseDeath === true,
    },
    healthQuestions,
    buyer,
    insuredPerson,
    beneficiary,
    insuredSameAsBuyer,
    beneficiarySameAsInsured,
    activeDate: (formData.activeDate as string) || '',
    inactiveDate: (formData.inactiveDate as string) || '',
    totalPremium: parseFloat((formData.totalPremium as string) || '0'),
    customerKind: (formData.customerKind as 'personal' | 'company') || 'personal',
  };
}

/**
 * Parse sale_code from BHV create response HTML
 */
export function parseSaleCodeFromResponse(htmlData: string): string | null {
  // BHV returns sale_code in response data
  // Try to extract UUID pattern
  const uuidPattern = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi;
  const matches = htmlData.match(uuidPattern);

  if (matches && matches.length > 0) {
    return matches[0];
  }

  return null;
}

/**
 * Parse contract number from BHV confirm response
 */
export function parseContractNumberFromResponse(htmlData: string): string | null {
  // Health contract numbers typically start with HVXCG or similar pattern
  const contractPattern = /HV[A-Z]{3}\d+/gi;
  const matches = htmlData.match(contractPattern);

  if (matches && matches.length > 0) {
    return matches[0];
  }

  return null;
}
