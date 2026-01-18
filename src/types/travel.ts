/**
 * Travel Insurance shared types
 * Used across model, API, and UI layers
 */

export type TravelProductType =
  | 'bon_voyage'        // Product 1
  | 'travel_flex'       // Product 2
  | 'domestic'          // Product 3
  | 'domestic_group'    // Product 4
  | 'international_group'; // Product 5

export type TravelPolicyType = 'Individual' | 'Family' | 'Group';
export type TravelHolderType = 'POHO_TYPE_E' | 'POHO_TYPE_G'; // E=Individual, G=Group
export type TravelGender = 'M' | 'F';

export type TravelRelationship =
  | 'RELATION_F'  // Father
  | 'RELATION_M'  // Mother
  | 'RELATION_S'  // Spouse
  | 'RELATION_C'  // Child
  | 'RELATION_O'; // Other

export interface TravelInsuredPerson {
  name: string;
  dob: string;          // DD/MM/YYYY format or YYYY-MM-DD
  age: number;
  gender: TravelGender;
  country: string;
  personalId: string;
  telNo?: string;
  email?: string;
  beneficiary?: string;
  relationship: string;  // RELATION_M, RELATION_F, etc.
  pct: number;          // Benefit percentage (default 100)
  carRental?: boolean;
  carRentalDate?: string;
  carRentalDays?: number;
}

export interface TravelContractOwner {
  policyholder: string;
  pocyType: TravelPolicyType;
  pohoType: TravelHolderType;
  email?: string;
  telNo: string;
  address: string;
  countryAddress: string;
  startCountry: string;
  invTax?: string;
  invCompany?: string;
  invAddress?: string;
}

export interface TravelInsurancePeriod {
  dateFrom: string;     // YYYY-MM-DD
  dateTo: string;       // YYYY-MM-DD
  days: number;
}

export type TravelContractStatus =
  | 'nhap'
  | 'cho_duyet'
  | 'khach_duyet'
  | 'ra_hop_dong'
  | 'huy';

export interface TravelStatusHistoryEntry {
  status: TravelContractStatus;
  changedBy: string;
  changedAt: Date;
  note?: string;
}
