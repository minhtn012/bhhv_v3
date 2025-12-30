/**
 * BHV Health Insurance (Medical Care) Constants
 * All UUIDs extracted from BHV API payload analysis
 */

// API Configuration
export const HEALTH_API = {
  ACTION: 'human/medical/care/install',
};

// Package Tiers (health_protector_package)
export const HEALTH_PACKAGES = {
  GOLD: 'd7b12560-5042-4abf-961c-d772377516c1',       // Hạng Vàng
  PLATINUM: 'd7b12560-5042-4abf-961c-d772377516c2',   // Hạng Bạch Kim
  DIAMOND: 'd7b12560-5042-4abf-961c-d772377516c3',    // Hạng Kim Cương (default)
} as const;

export const HEALTH_PACKAGE_LABELS: Record<string, string> = {
  [HEALTH_PACKAGES.GOLD]: 'Hạng Vàng',
  [HEALTH_PACKAGES.PLATINUM]: 'Hạng Bạch Kim',
  [HEALTH_PACKAGES.DIAMOND]: 'Hạng Kim Cương',
};

// Purchase Year (health_protector_year_buy)
export const HEALTH_PURCHASE_YEARS = {
  ONE_YEAR: 'da31b391-98f4-493a-b272-af7c0d68c8e3',
} as const;

// Benefit Addons (checkboxes)
export const HEALTH_BENEFIT_ADDONS = {
  MATERNITY: '5c5261c1-5794-4c37-8938-530650aa43b1',      // Thai sản
  OUTPATIENT: '5c5261c1-5794-4c37-8938-530650aa43b2',     // Ngoại trú
  DISEASE_DEATH: '5c5261c1-5794-4c37-8938-530650aa43b3',  // Tử vong do bệnh
} as const;

export const HEALTH_BENEFIT_LABELS: Record<string, string> = {
  [HEALTH_BENEFIT_ADDONS.MATERNITY]: 'Quyền lợi thai sản',
  [HEALTH_BENEFIT_ADDONS.OUTPATIENT]: 'Quyền lợi ngoại trú',
  [HEALTH_BENEFIT_ADDONS.DISEASE_DEATH]: 'Tử vong do bệnh',
};

// Health Questions
export const HEALTH_QUESTIONS = {
  Q1_HOSPITALIZATION: {
    id: 'c0adb36e-a915-45bb-a798-6046e8b7b46a',
    yesOption: 'c0adb36e-a915-45bb-a798-6046e8b7b46a1',
    noOption: 'c0adb36e-a915-45bb-a798-6046e8b7b46a2',
    textField: 'input_c0adb36e-a915-45bb-a798-6046e8b7b46a1',
  },
  Q2_ONGOING_TREATMENT: {
    id: '47d622cc-782a-4f49-ae40-53588539ef76',
    yesOption: '47d622cc-782a-4f49-ae40-53588539ef761',
    noOption: '47d622cc-782a-4f49-ae40-53588539ef762',
    textField: 'input_47d622cc-782a-4f49-ae40-53588539ef761',
  },
  Q3_CHRONIC_CONDITIONS: {
    id: '0cca29cb-34c8-4b36-8ae7-8ee706799e64',
    yesOption: '0cca29cb-34c8-4b36-8ae7-8ee706799e641',
    noOption: '0cca29cb-34c8-4b36-8ae7-8ee706799e642',
    textField: 'input_0cca29cb-34c8-4b36-8ae7-8ee706799e641',
  },
  Q4_PREVIOUS_CLAIMS: {
    id: 'eeb1111a-543a-427d-bc26-15d46ee9566e',
    yesOption: 'eeb1111a-543a-427d-bc26-15d46ee9566e1',
    noOption: 'eeb1111a-543a-427d-bc26-15d46ee9566e2',
    textField: 'input_eeb1111a-543a-427d-bc26-15d46ee9566e1',
  },
  Q5_PREVIOUS_REJECTION: {
    id: 'ac7d74f4-7ad8-4ac8-a806-4c16f92556a0',
    yesOption: 'ac7d74f4-7ad8-4ac8-a806-4c16f92556a01',
    noOption: 'ac7d74f4-7ad8-4ac8-a806-4c16f92556a02',
    textField: 'input_ac7d74f4-7ad8-4ac8-a806-4c16f92556a01',
  },
} as const;

// Customer Kind
export const HEALTH_CUSTOMER_KIND = {
  PERSONAL: 'bd8c75bc-eeb5-42ba-a5d0-e8ca9a573d1',
  COMPANY: 'bd8c75bc-eeb5-42ba-a5d0-e8ca9a573d2',
} as const;

// Relationship Types (buyer to insured, insured to beneficiary)
export const HEALTH_RELATIONSHIPS = {
  SELF: '1b9eb913-b96b-45e8-9fc4-80f0d46d3ab1',      // Bản thân
  SPOUSE: '1b9eb913-b96b-45e8-9fc4-80f0d46d3ab2',    // Vợ/chồng
  PARENT: '1b9eb913-b96b-45e8-9fc4-80f0d46d3ab3',    // Cha/mẹ
  CHILD: '1b9eb913-b96b-45e8-9fc4-80f0d46d3ab4',     // Con
  SIBLING: '1b9eb913-b96b-45e8-9fc4-80f0d46d3ab5',   // Anh/chị/em
  OTHER: '1b9eb913-b96b-45e8-9fc4-80f0d46d3ab6',     // Khác
} as const;

export const HEALTH_RELATIONSHIP_LABELS: Record<string, string> = {
  [HEALTH_RELATIONSHIPS.SELF]: 'Bản thân',
  [HEALTH_RELATIONSHIPS.SPOUSE]: 'Vợ/chồng',
  [HEALTH_RELATIONSHIPS.PARENT]: 'Cha/mẹ',
  [HEALTH_RELATIONSHIPS.CHILD]: 'Con',
  [HEALTH_RELATIONSHIPS.SIBLING]: 'Anh/chị/em',
  [HEALTH_RELATIONSHIPS.OTHER]: 'Khác',
};

// Gender codes (same as vehicle)
export const HEALTH_GENDER = {
  MALE: 'NAM',
  FEMALE: 'NU',
} as const;

// Kind Action
export const HEALTH_KIND_ACTION = {
  INSERT: 'insert',
  RENEW: 'renew',
} as const;

// Contract workflow statuses (same as vehicle)
export const HEALTH_CONTRACT_STATUS = {
  NHAP: 'nhap',
  CHO_DUYET: 'cho_duyet',
  KHACH_DUYET: 'khach_duyet',
  RA_HOP_DONG: 'ra_hop_dong',
  HUY: 'huy',
} as const;

export const HEALTH_STATUS_LABELS: Record<string, string> = {
  [HEALTH_CONTRACT_STATUS.NHAP]: 'Nháp',
  [HEALTH_CONTRACT_STATUS.CHO_DUYET]: 'Chờ duyệt',
  [HEALTH_CONTRACT_STATUS.KHACH_DUYET]: 'Khách duyệt',
  [HEALTH_CONTRACT_STATUS.RA_HOP_DONG]: 'Ra hợp đồng',
  [HEALTH_CONTRACT_STATUS.HUY]: 'Hủy',
};
