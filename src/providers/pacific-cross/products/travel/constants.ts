/**
 * Pacific Cross Travel Insurance Constants
 */

export const PACIFIC_CROSS_API = {
  BASE_URL: process.env.PACIFIC_CROSS_BASE_URL || 'https://paris.pacificcross.com.vn',
  LOGIN_PATH: '/login',
  CERT_PATH: '/cert',
  HISTORY_PATH_SUFFIX: '/history',
  PDF_PATH_TEMPLATE: '/cert/pdf/{certId}/USD/nosign/preview', // Quote PDF preview URL
} as const;

// Product IDs (from Pacific Cross portal)
export const TRAVEL_PRODUCTS = {
  BON_VOYAGE: 1,
  TRAVEL_FLEX: 2,
  DOMESTIC: 3,
  DOMESTIC_GROUP: 4,
  INTERNATIONAL_GROUP: 5,
} as const;

export const TRAVEL_PRODUCT_LABELS: Record<number, string> = {
  1: 'Bon Voyage',
  2: 'Travel Flex',
  3: 'Domestic',
  4: 'Domestic Group',
  5: 'International Group',
};

// Policy types
export const TRAVEL_POLICY_TYPES = {
  INDIVIDUAL: 'Individual',
  FAMILY: 'Family',
  GROUP: 'Group',
} as const;

export const TRAVEL_POLICY_TYPE_LABELS: Record<string, string> = {
  'Individual': 'Ca nhan',
  'Family': 'Gia dinh',
  'Group': 'Nhom',
};

// Holder types
export const TRAVEL_HOLDER_TYPES = {
  INDIVIDUAL: 'POHO_TYPE_E',
  GROUP: 'POHO_TYPE_G',
} as const;

export const TRAVEL_HOLDER_TYPE_LABELS: Record<string, string> = {
  'POHO_TYPE_E': 'Ca nhan',
  'POHO_TYPE_G': 'Nhom/Cong ty',
};

// Gender mapping
export const TRAVEL_GENDER = {
  MALE: 'M',
  FEMALE: 'F',
} as const;

export const TRAVEL_GENDER_LABELS: Record<string, string> = {
  'M': 'Nam',
  'F': 'Nu',
};

// Relationship codes
export const TRAVEL_RELATIONSHIPS = {
  FATHER: 'RELATION_F',
  MOTHER: 'RELATION_M',
  SPOUSE: 'RELATION_S',
  CHILD: 'RELATION_C',
  OTHER: 'RELATION_O',
} as const;

export const TRAVEL_RELATIONSHIP_LABELS: Record<string, string> = {
  'RELATION_F': 'Cha',
  'RELATION_M': 'Me',
  'RELATION_S': 'Vo/Chong',
  'RELATION_C': 'Con',
  'RELATION_O': 'Nguoi khac',
};

// Common countries (subset - full list in db_json/travel_countries.json)
export const TRAVEL_COUNTRIES = {
  VIETNAM: 'VIETNAM',
  UNITED_STATES: 'U.S.A.',
  JAPAN: 'JAPAN',
  KOREA: 'KOREA',
  SINGAPORE: 'SINGAPORE',
  THAILAND: 'THAILAND',
  MALAYSIA: 'MALAYSIA',
  INDONESIA: 'INDONESIA',
  CHINA: 'CHINA',
  AUSTRALIA: 'AUSTRALIA',
  UK: 'U.K.',
  FRANCE: 'FRANCE',
  GERMANY: 'GERMANY',
} as const;

// Status workflow
export const TRAVEL_STATUS = {
  DRAFT: 'nhap',
  PENDING_APPROVAL: 'cho_duyet',
  CUSTOMER_APPROVED: 'khach_duyet',
  ISSUED: 'ra_hop_dong',
  CANCELLED: 'huy',
} as const;

export const TRAVEL_STATUS_LABELS: Record<string, string> = {
  'nhap': 'Nhap',
  'cho_duyet': 'Cho duyet',
  'khach_duyet': 'Khach duyet',
  'ra_hop_dong': 'Ra hop dong',
  'huy': 'Huy',
};

export const TRAVEL_STATUS_COLORS: Record<string, string> = {
  'nhap': 'gray',
  'cho_duyet': 'yellow',
  'khach_duyet': 'blue',
  'ra_hop_dong': 'green',
  'huy': 'red',
};

// Status transitions
export const TRAVEL_STATUS_TRANSITIONS: Record<string, string[]> = {
  'nhap': ['cho_duyet', 'huy'],
  'cho_duyet': ['khach_duyet', 'huy'],
  'khach_duyet': ['ra_hop_dong', 'huy'],
  'ra_hop_dong': [],
  'huy': [],
};
