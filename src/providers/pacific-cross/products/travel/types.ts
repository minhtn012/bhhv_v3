/**
 * Pacific Cross Travel Insurance Types
 */

import type {
  TravelInsuredPerson,
  TravelContractOwner,
  TravelInsurancePeriod,
  TravelContractStatus,
  TravelStatusHistoryEntry
} from '@/types/travel';

/**
 * Form data from UI
 */
export interface TravelContractFormData {
  // Owner info
  owner: TravelContractOwner;

  // Insurance period
  period: TravelInsurancePeriod;

  // Product selection
  product: number;
  plan: number;

  // Insured persons (1 or more)
  insuredPersons: TravelInsuredPerson[];

  // Additional fields
  refNo?: string;
  pnrNo?: string;
  itinerary?: string;
  note?: string;

  // Invoice
  invAmount?: number;
}

/**
 * Pacific Cross API payload format
 * Multipart form-data with indexed insured person fields
 */
export interface PacificCrossPayload {
  _token: string;
  is_quote: '0' | '1';
  last_update?: string;
  pnr_no?: string;
  poho_title?: string;
  ref_no?: string;
  policyholder: string;
  pocy_type: string;
  poho_type: string;
  email?: string;
  tel_no: string;
  inv_tax?: string;
  address: string;
  inv_company?: string;
  inv_address?: string;
  country_address: string;
  start_country: string;
  date_from_date_range: string;
  date_to_date_range: string;
  days_date_range: string;
  date_range: string;
  product: string;
  plan: string;
  agent?: string;
  itinerary?: string;
  note?: string;
  inv_amount?: string;
  member_count: string;
  member_row_deleted?: string;
  // Dynamic insured person fields: name_{n}, dob_{n}, etc.
  [key: string]: string | undefined;
}

/**
 * Pacific Cross API response
 */
export interface PacificCrossResponse {
  success: boolean;
  certId?: string;        // Format: {number}::{hash}
  certNo?: number;        // Extracted number
  error?: string;
  rawResponse?: unknown;
}

/**
 * Pacific Cross history entry from GET /cert/{id}/history
 */
export interface PacificCrossHistoryEntry {
  user: string;
  key: string;
  field: string;
  old: string | null;
  new: string;
  time: string;
  sort: number;
}

/**
 * Contract data stored in MongoDB
 */
export interface ITravelContract {
  _id: string;
  contractNumber: string;
  productType: 'travel';

  // Owner
  owner: TravelContractOwner;

  // Period
  period: TravelInsurancePeriod;

  // Product
  product: number;
  productName: string;
  plan: number;
  planName: string;

  // Insured persons
  insuredPersons: TravelInsuredPerson[];

  // Additional
  refNo?: string;
  pnrNo?: string;
  itinerary?: string;
  note?: string;

  // Premium
  totalPremium: number;

  // Pacific Cross data
  pacificCrossCertId?: string;
  pacificCrossCertNo?: number;

  // Workflow
  status: TravelContractStatus;
  statusHistory: TravelStatusHistoryEntry[];

  // Metadata
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

// Re-export types from shared travel types
export type {
  TravelInsuredPerson,
  TravelContractOwner,
  TravelInsurancePeriod,
  TravelContractStatus,
  TravelStatusHistoryEntry,
} from '@/types/travel';
