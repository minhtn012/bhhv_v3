/**
 * Core Framework - Barrel export
 * All core functionality exported from this single entry point
 */

// Provider types and interfaces
export * from './providers/types';
export { providerRegistry, ProviderRegistry } from './providers/registry';
export { BaseApiClient, type RequestConfig, type ApiResponse } from './providers/base-api-client';

// Credential management
export {
  credentialManager,
  CredentialManager,
  encryptValue,
  decryptValue,
  type EncryptedCredential,
  type StoredProviderCredentials,
} from './credentials/credential-manager';

// Form types and utilities
export * from './forms/types';
export { fieldRegistry, FieldRegistry } from './forms/field-registry';

// Components
export { default as DynamicForm } from './forms/DynamicForm';
export { default as LocationPicker, type LocationValue } from './shared/components/LocationPicker';
export { default as DateRangePicker, type DateRangeValue } from './shared/components/DateRangePicker';
