/**
 * Core Provider Types - Insurance provider interface definitions
 * All insurance providers must implement these interfaces
 */

export enum InsuranceType {
  VEHICLE = 'vehicle',
  HEALTH = 'health',
  TRAVEL = 'travel',
}

export interface ProviderCredentials {
  username: string;
  password: string;
}

export interface TestCredentialsResult {
  success: boolean;
  message?: string;
  sessionData?: unknown;
}

export interface ContractResponse {
  success: boolean;
  contractNumber?: string;
  pdfBase64?: string;
  error?: string;
  rawResponse?: unknown;
}

export interface StatusResponse {
  success: boolean;
  status?: string;
  details?: unknown;
  error?: string;
}

export interface PremiumCheckResponse {
  success: boolean;
  premiumData?: {
    total: number;
    breakdown?: Record<string, number>;
  };
  htmlData?: string;
  error?: string;
}

export interface ProductDefinition {
  id: string;
  type: InsuranceType;
  name: string;
  description: string;
  formSchemaPath: string;
}

export interface InsuranceProvider {
  id: string;
  name: string;
  products: ProductDefinition[];

  // Authentication
  testCredentials(creds: ProviderCredentials): Promise<TestCredentialsResult>;

  // Core operations
  createContract(productId: string, data: unknown): Promise<ContractResponse>;
  checkStatus(contractId: string): Promise<StatusResponse>;
  checkPremium(productId: string, data: unknown): Promise<PremiumCheckResponse>;

  // Form schema
  getFormSchema(productId: string): Promise<FormSchema>;
}

// Form Schema Types
export interface FormSchema {
  version: string;
  sections: FormSection[];
  validationRules?: ValidationRule[];
}

export interface FormSection {
  id: string;
  title: string;
  description?: string;
  fields: FieldDefinition[];
  showWhen?: Condition;
}

export interface FieldDefinition {
  name: string;
  label: string;
  type: FieldType;
  required?: boolean;
  placeholder?: string;
  defaultValue?: unknown;
  options?: SelectOption[];
  componentRef?: string;
  showWhen?: Condition;
  validation?: FieldValidation;
  props?: Record<string, unknown>;
}

export type FieldType =
  | 'text'
  | 'number'
  | 'currency'
  | 'date'
  | 'datetime'
  | 'select'
  | 'radio'
  | 'checkbox'
  | 'textarea'
  | 'file-upload'
  | 'location-picker'
  | 'car-picker'
  | 'date-range'
  | 'custom';

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface Condition {
  field: string;
  operator: 'equals' | 'not_equals' | 'contains' | 'in' | 'not_in' | 'exists';
  value: unknown;
}

export interface FieldValidation {
  min?: number;
  max?: number;
  minLength?: number;
  maxLength?: number;
  pattern?: string;
  patternMessage?: string;
  custom?: string;
}

export interface ValidationRule {
  fields: string[];
  rule: string;
  message: string;
}
