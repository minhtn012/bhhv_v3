# Phase 0: Provider Framework Architecture

**Status**: Implemented
**Version**: 1.0
**Date**: 2025-12-23
**Scope**: Core framework for pluggable insurance provider support

---

## Executive Summary

Phase 0 introduces a pluggable provider architecture enabling multi-provider insurance support. The system extracts shared insurance operations (authentication, contract management, form handling) into a reusable framework while maintaining backward compatibility with existing monolithic BHV code.

**Key Achievement**: BHV system transformed from provider-specific to provider-agnostic platform.

---

## Problem Statement

**Before Phase 0**:
- BHV-specific code tightly coupled throughout system
- Adding new insurance provider required duplicate infrastructure
- Form handling hardcoded for BHV fields
- Credential management mixed with BHV logic
- No clear extension points

**After Phase 0**:
- Multiple providers can coexist with unified interface
- New providers pluggable without core system changes
- Form system dynamic and provider-agnostic
- Credentials managed separately from provider logic
- Clear extension points documented

---

## Architecture Overview

### Component Hierarchy

```
src/
├── core/                              # Reusable framework (provider-agnostic)
│   ├── providers/
│   │   ├── types.ts                  # Provider interface definitions
│   │   ├── registry.ts               # Provider discovery & registration
│   │   └── base-api-client.ts        # HTTP client base
│   ├── credentials/
│   │   └── credential-manager.ts     # AES-256-GCM encryption
│   ├── forms/
│   │   ├── types.ts                  # Form schema definitions
│   │   ├── field-registry.ts         # Custom field components
│   │   └── DynamicForm.tsx           # Form renderer
│   ├── shared/
│   │   └── components/               # Shared UI components
│   │       ├── LocationPicker.tsx
│   │       └── DateRangePicker.tsx
│   └── index.ts                      # Barrel export
├── providers/                         # Specific provider implementations
│   ├── bhv-online/
│   │   ├── index.ts                  # BhvProvider class
│   │   ├── api-client.ts             # BHV HTTP operations
│   │   └── products/
│   │       └── vehicle/
│   │           ├── schema.json       # Form schema
│   │           ├── mapper.ts         # Data transformations
│   │           └── calculator.ts     # Premium calculations
│   └── index.ts                      # Auto-register all providers
└── lib/                               # Legacy code (backward compatible)
    ├── bhvApiClient.ts               # Old BHV implementation
    └── ...
```

### Core Interfaces

#### InsuranceProvider
All providers must implement this interface:

```typescript
interface InsuranceProvider {
  // Identity
  id: string;                         // Unique identifier (e.g., 'bhv-online')
  name: string;                       // Display name
  products: ProductDefinition[];      // Available products

  // Core Operations
  testCredentials(creds: ProviderCredentials): Promise<TestCredentialsResult>;
  createContract(productId: string, data: unknown): Promise<ContractResponse>;
  checkStatus(contractId: string): Promise<StatusResponse>;
  checkPremium(productId: string, data: unknown): Promise<PremiumCheckResponse>;
  getFormSchema(productId: string): Promise<FormSchema>;
}
```

#### FormSchema
Provider-defined form structure for data collection:

```typescript
interface FormSchema {
  version: string;
  sections: FormSection[];
  validationRules?: ValidationRule[];
}

interface FormSection {
  id: string;
  title: string;
  description?: string;
  fields: FieldDefinition[];
  showWhen?: Condition;
}

interface FieldDefinition {
  name: string;
  label: string;
  type: FieldType;                    // 14 types: text, number, date, select, etc.
  required?: boolean;
  options?: SelectOption[];
  componentRef?: string;               // Custom component identifier
  showWhen?: Condition;                // Conditional rendering
  validation?: FieldValidation;        // Field-level rules
  props?: Record<string, unknown>;     // Component-specific props
}
```

---

## Core Components

### 1. Provider Registry (`src/core/providers/registry.ts`)

**Purpose**: Central provider discovery and registration

**API**:
```typescript
class ProviderRegistry {
  register(provider: InsuranceProvider): void;
  getProvider(id: string): InsuranceProvider | undefined;
  listProviders(): InsuranceProvider[];
  getProductsByType(type: InsuranceType): ProductDefinition[];
}
```

**Usage**:
```typescript
import { providerRegistry } from '@/core';

// Get specific provider
const bhv = providerRegistry.getProvider('bhv-online');

// List all providers
const providers = providerRegistry.listProviders();

// Find vehicle products
const vehicleProducts = providerRegistry.getProductsByType(InsuranceType.VEHICLE);
```

**Auto-Registration**:
Providers auto-register via import side-effect:
```typescript
// src/providers/bhv-online/index.ts
providerRegistry.register(bhvProvider);

// Auto-triggered when src/providers is imported
import { providerRegistry } from '@/providers';
```

### 2. Base API Client (`src/core/providers/base-api-client.ts`)

**Purpose**: Standard HTTP operations for providers

**Methods**:
```typescript
class BaseApiClient {
  async get<T>(url: string, config?: RequestConfig): Promise<ApiResponse<T>>;
  async post<T>(url: string, data: unknown, config?: RequestConfig): Promise<ApiResponse<T>>;
  async put<T>(url: string, data: unknown, config?: RequestConfig): Promise<ApiResponse<T>>;
  async delete<T>(url: string, config?: RequestConfig): Promise<ApiResponse<T>>;

  setSessionCookies(cookies: string): void;
  clearSession(): void;
}
```

**Features**:
- Standard HTTP methods (GET, POST, PUT, DELETE)
- Cookie/session management
- Request/response interceptors
- Error standardization
- Type-safe responses

**Provider Usage**:
```typescript
export class BhvApiClient extends BaseApiClient {
  async authenticate(username: string, password: string) {
    return this.post('/login', { username, password });
  }

  async submitContract(data: unknown) {
    return this.post('/contracts/submit', data, {
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
```

### 3. Credential Manager (`src/core/credentials/credential-manager.ts`)

**Purpose**: Secure encryption/decryption for provider credentials

**Security Properties**:
- **Algorithm**: AES-256-GCM (AEAD - authenticated encryption)
- **Key**: 32 bytes from `CREDENTIAL_ENCRYPTION_KEY` env or derived via scrypt
- **IV**: Random 16 bytes per encryption
- **Auth Tag**: Prevents tampering detection
- **Format**: Base64-encoded ciphertext + IV + auth tag

**Encryption Structure**:
```typescript
interface EncryptedCredential {
  algorithm: 'aes-256-gcm';
  iv: string;                         // Random IV, base64
  authTag: string;                    // Authentication tag, base64
  ciphertext: string;                 // Encrypted data, base64
}
```

**API**:
```typescript
// Global functions
export function encryptValue(plaintext: string): EncryptedCredential;
export function decryptValue(encrypted: EncryptedCredential): string;

// Manager class
credentialManager.encrypt(credentials: ProviderCredentials): {
  username: EncryptedCredential;
  password: EncryptedCredential;
};

credentialManager.decrypt(encrypted): ProviderCredentials;
credentialManager.validateKeyAvailable(): boolean;
```

**Storage Model**:
```typescript
interface StoredProviderCredentials {
  providerId: string;
  username: EncryptedCredential;      // Encrypted username
  password: EncryptedCredential;      // Encrypted password
  createdAt: Date;
  updatedAt: Date;
}
```

**Usage in Database**:
```typescript
// Save
const encrypted = credentialManager.encrypt({ username, password });
user.credentials = { providerId: 'bhv-online', ...encrypted };
await user.save();

// Retrieve
const stored = user.credentials;
const decrypted = credentialManager.decrypt(stored);
const result = await provider.testCredentials(decrypted);
```

**Security Notes**:
- Credentials never logged
- Decryption only on use
- Immediate re-encryption after use
- Per-credential field encryption (username & password separate)
- Environment-controlled key (production must use proper key)

### 4. Dynamic Form System (`src/core/forms`)

**Components**:

#### Field Registry (`field-registry.ts`)
Manages custom field component registration:
```typescript
class FieldRegistry {
  register(
    type: FieldType,
    component: React.ComponentType<FieldComponentProps>
  ): void;

  getComponent(type: FieldType): React.ComponentType<FieldComponentProps>;
  listRegisteredFields(): FieldType[];
}

// Usage
fieldRegistry.register('custom-type', CustomFieldComponent);
```

#### DynamicForm Component (`DynamicForm.tsx`)
Renders FormSchema into interactive React form:

**Props**:
```typescript
interface DynamicFormProps {
  schema: FormSchema;                 // Form structure from provider
  initialValues?: Record<string, unknown>;
  onSubmit: (values: Record<string, unknown>) => void | Promise<void>;
  onChange?: (values: Record<string, unknown>) => void;
  className?: string;
  disabled?: boolean;
  hideSubmitButton?: boolean;
  submitButtonText?: string;
}
```

**Features**:
- Section-based layout
- Conditional field rendering
- Field-level validation
- Form-level validation
- Error display
- Loading state handling
- Custom component support via `componentRef`

**Validation Flow**:
```
Field onChange/onBlur
    ↓
Validate field rules (min, max, pattern, custom)
    ↓
Validate conditional constraints
    ↓
Update form errors
    ↓
Update form isValid
    ↓
Call onChange callback (if provided)
```

**Form State**:
```typescript
interface FormState {
  values: Record<string, unknown>;    // Current field values
  errors: Record<string, string>;     // Error messages
  touched: Record<string, boolean>;   // Fields user has interacted with
  isSubmitting: boolean;              // Form submission in progress
  isValid: boolean;                   // All fields valid
}
```

### 5. Shared Components

#### LocationPicker (`LocationPicker.tsx`)
Vietnamese location selector (Province → District → Ward)

```typescript
interface LocationValue {
  province: string;                   // Code
  provinceText: string;               // Display name
  district: string;
  districtText: string;
  ward?: string;
  wardText?: string;
  specificAddress?: string;
}

// Props
{
  value: LocationValue;
  onChange: (value: LocationValue) => void;
  includeWard?: boolean;
  includeSpecificAddress?: boolean;
}
```

#### DateRangePicker (`DateRangePicker.tsx`)
Date range selection with presets

```typescript
interface DateRangeValue {
  startDate: Date;
  endDate: Date;
}

// Props
{
  value: DateRangeValue;
  onChange: (value: DateRangeValue) => void;
  presets?: Array<{ label: string; getValue: () => DateRangeValue }>;
  maxDays?: number;
}
```

---

## BHV Provider Implementation

### Structure
```
src/providers/bhv-online/
├── index.ts                          # BhvProvider + auto-register
├── api-client.ts                     # HTTP operations
└── products/
    └── vehicle/
        ├── schema.json               # Form schema (JSON)
        ├── mapper.ts                 # Data transformations
        └── calculator.ts             # Business logic
```

### BhvProvider Class

Implements `InsuranceProvider` interface:

```typescript
class BhvProvider implements InsuranceProvider {
  id = 'bhv-online';
  name = 'BHV Online';
  products = [
    {
      id: 'vehicle',
      type: InsuranceType.VEHICLE,
      name: 'Bảo hiểm xe cơ giới',
      description: 'Vehicle damage & third-party liability',
      formSchemaPath: './products/vehicle/schema.json'
    }
  ];

  async testCredentials(creds: ProviderCredentials): Promise<TestCredentialsResult>;
  async createContract(productId: string, data: unknown): Promise<ContractResponse>;
  async checkStatus(contractId: string): Promise<StatusResponse>;
  async checkPremium(productId: string, data: unknown): Promise<PremiumCheckResponse>;
  async getFormSchema(productId: string): Promise<FormSchema>;

  setSessionCookies(cookies: string): void;
  clearSession(): void;
}
```

### BhvApiClient Class

Low-level HTTP operations:
```typescript
class BhvApiClient extends BaseApiClient {
  async authenticate(username: string, password: string);
  async submitContract(data: unknown, cookies?: string);
  async checkPremium(data: unknown, cookies?: string);
}
```

### Vehicle Product

#### Form Schema (schema.json)
Defines contract data structure with Vietnamese field names.

**Sections**:
1. **Thông tin xe** (Vehicle info)
   - loaiHinhKinhDoanh (Business type)
   - carBrand, carModel (Vehicle selection)
   - bienSo, soMay, soKhung (Registration details)
   - namSanXuat, giaTriXe (Year, value)

2. **Bảo hiểm** (Insurance coverage)
   - vatChatPackage (Property damage level)
   - includeTNDS (Third-party liability)
   - includeNNTX (Passenger insurance)
   - phiPin (Battery insurance for EV)

3. **Chủ xe & Địa chỉ** (Owner & address)
   - chuXe (Owner name)
   - buyerEmail, buyerPhone (Contact)
   - selectedProvince, selectedDistrictWard (Location)

#### Mappers (mapper.ts)
Transform internal contract format → BHV API format:

```typescript
export function transformContractToBhvFormat(data: unknown): BhvContractData;
export function transformContractToPremiumCheckFormat(data: unknown): BhvPremiumCheckData;
```

#### Calculator (calculator.ts)
Business logic for premium calculation:
- Base rates by vehicle type
- Coverage level multipliers
- Business use surcharges (TNDS)
- EV battery surcharges
- Renewal discounts
- Age adjustments

---

## Integration Points

### With API Routes

**Old Pattern** (still works):
```typescript
import { bhvApiClient } from '@/lib/bhvApiClient';
const result = await bhvApiClient.authenticate(user, pass);
```

**New Pattern** (recommended):
```typescript
import { providerRegistry } from '@/core';
const provider = providerRegistry.getProvider('bhv-online');
const result = await provider.testCredentials({ username, password });
```

### With Forms

**Create form for BHV vehicle insurance**:
```typescript
const provider = providerRegistry.getProvider('bhv-online');
const schema = await provider.getFormSchema('vehicle');

return (
  <DynamicForm
    schema={schema}
    initialValues={contract}
    onSubmit={handleSubmit}
    onChange={handleChange}
  />
);
```

### With Credentials

**Store user credentials**:
```typescript
import { credentialManager } from '@/core';

const encrypted = credentialManager.encrypt({
  username: user.bhvUsername,
  password: user.bhvPassword
});

user.providerCredentials = {
  providerId: 'bhv-online',
  ...encrypted
};
await user.save();
```

**Use credentials**:
```typescript
const stored = user.providerCredentials;
const decrypted = credentialManager.decrypt(stored);
const testResult = await provider.testCredentials(decrypted);
```

---

## Extending the System

### Adding New Provider

**Step 1: Create directory structure**
```bash
mkdir -p src/providers/new-provider/products/main-product
```

**Step 2: Implement provider**
```typescript
// src/providers/new-provider/index.ts
import { InsuranceProvider, ProviderCredentials, ... } from '@/core';

export class NewProvider implements InsuranceProvider {
  id = 'new-provider';
  name = 'New Insurance Company';

  readonly products = [
    {
      id: 'vehicle',
      type: InsuranceType.VEHICLE,
      name: 'Vehicle Insurance',
      description: 'Vehicle damage & liability coverage',
      formSchemaPath: './products/vehicle/schema.json'
    }
  ];

  async testCredentials(creds: ProviderCredentials) { }
  async createContract(productId: string, data: unknown) { }
  async checkStatus(contractId: string) { }
  async checkPremium(productId: string, data: unknown) { }
  async getFormSchema(productId: string) { }
}

// Auto-register
export const newProvider = new NewProvider();
providerRegistry.register(newProvider);
```

**Step 3: Create form schema**
```json
// src/providers/new-provider/products/vehicle/schema.json
{
  "version": "1.0.0",
  "sections": [
    {
      "id": "vehicle-info",
      "title": "Vehicle Information",
      "fields": [...]
    }
  ]
}
```

**Step 4: Export from providers**
```typescript
// src/providers/index.ts
export { newProvider, NewProvider } from './new-provider';
```

**Step 5: Use in application**
```typescript
const provider = providerRegistry.getProvider('new-provider');
const schema = await provider.getFormSchema('vehicle');
// Works immediately with existing DynamicForm!
```

### Adding Custom Field Components

**Step 1: Create component**
```typescript
// src/components/custom-fields/VehicleSelector.tsx
import { FieldComponentProps } from '@/core';

export const VehicleSelector: React.FC<FieldComponentProps> = ({
  value,
  onChange,
  error,
  ...props
}) => {
  return (
    <div>
      {/* Custom UI */}
    </div>
  );
};
```

**Step 2: Register field**
```typescript
// src/app/layout.tsx or initialization code
import { fieldRegistry } from '@/core';
import { VehicleSelector } from '@/components/custom-fields/VehicleSelector';

fieldRegistry.register('car-picker', VehicleSelector);
```

**Step 3: Use in provider schema**
```json
{
  "name": "vehicleSelection",
  "label": "Select Vehicle",
  "type": "car-picker",
  "componentRef": "VehicleSelector"
}
```

---

## Data Flow Examples

### Contract Creation Flow

```
1. User navigates to contract form
   ↓
2. App queries provider for form schema
   const schema = await provider.getFormSchema('vehicle')
   ↓
3. DynamicForm renders schema
   ↓
4. User fills form with insurance details
   ↓
5. User clicks "Check Premium"
   const premiumResult = await provider.checkPremium('vehicle', formValues)
   ↓
6. App displays premium breakdown from HTML response
   ↓
7. User confirms and clicks "Submit"
   ↓
8. App submits complete contract
   const contractResult = await provider.createContract('vehicle', formValues)
   ↓
9. Contract saved to MongoDB with BHV contract number
   ↓
10. User receives confirmation and downloadable PDF
```

### Multi-Provider Scenario

```
User selects insurance provider from dropdown
   ↓
providers = providerRegistry.listProviders()
   ↓
App loads schema for selected provider's product
   schema = await selectedProvider.getFormSchema('vehicle')
   ↓
DynamicForm renders provider-specific form
   (BHV form different from future Manulife form)
   ↓
User credentials stored encrypted with providerId
   ↓
Same contract submit flow, but provider-specific
   selectedProvider.createContract('vehicle', data)
   ↓
Contract tracks which provider/product created it
   { provider: 'bhv-online', product: 'vehicle', ... }
```

### Credential Encryption Flow

```
User enters BHV username/password
   ↓
credentialManager.encrypt({ username, password })
   → Generate random IV
   → Encrypt with AES-256-GCM using ENV key
   → Generate auth tag (prevents tampering)
   → Return {algorithm, iv, authTag, ciphertext}
   ↓
Store in User model encrypted
   user.credentials = {
     providerId: 'bhv-online',
     username: EncryptedCredential,
     password: EncryptedCredential,
     createdAt, updatedAt
   }
   ↓
On API call, decrypt only as needed
   const decrypted = credentialManager.decrypt(user.credentials)
   ↓
Use decrypted credentials
   const result = await provider.testCredentials(decrypted)
   ↓
Decrypted credentials never logged or cached
```

---

## Backward Compatibility

### Coexistence Strategy

**Old code continues working**:
```typescript
// Still supported - existing BHV integration
import { bhvApiClient } from '@/lib/bhvApiClient';
await bhvApiClient.submitContract(contractData);
```

**New code uses framework**:
```typescript
// New providers or refactored BHV
import { providerRegistry } from '@/core';
const provider = providerRegistry.getProvider('bhv-online');
await provider.createContract('vehicle', contractData);
```

**Migration Path**:
1. New endpoints built with provider system
2. Old endpoints continue to work
3. Gradual refactoring of legacy code
4. Eventually retire old `src/lib/bhvApiClient.ts`

### Version Compatibility

- **Phase 0**: Foundation - provider interfaces, registry, form system
- **Phase 1**: New providers (Manulife, Bao Viet, etc.)
- **Phase 2**: Advanced features (claim handling, policy renewal)
- **Future**: Mobile apps, API marketplace

---

## Security Considerations

### Credential Encryption
- **Algorithm**: AES-256-GCM (industry standard)
- **Key Management**: Environment variable controlled
- **Per-field Encryption**: Username and password encrypted separately
- **IV Randomization**: New IV per encryption prevents pattern detection
- **Auth Tag**: Prevents tampering and bit-flip attacks

### API Security
- All provider APIs use HTTPS only
- Request credentials encrypted at rest in DB
- Decryption only on use (not pre-emptive)
- Never logged in clear text
- Session cookies isolated per provider
- CSRF tokens if needed per provider

### Form Validation
- Server-side validation (never trust client)
- Type validation via TypeScript
- Custom validation rules in schema
- Provider-specific validation handlers

---

## Testing Strategy

### Unit Tests
- **Provider Registry**: Registration, discovery, filtering
- **Credential Manager**: Encryption/decryption, key validation
- **Field Registry**: Component registration, lookup
- **Mappers**: Data transformation accuracy

### Integration Tests
- **BhvProvider**: testCredentials, checkPremium, createContract
- **DynamicForm**: Rendering, validation, submission
- **End-to-end**: Full contract creation flow

### Test Coverage
- Core framework: 90%+ required
- Provider implementations: 80%+ required
- Form system: 85%+ required

---

## Future Enhancements

### Planned
- Multi-product support (health, travel, etc.)
- Provider discovery (list all available)
- Credential validation hooks
- Form conditional logic enhancements
- Dynamic form styling customization

### Possible
- Provider versioning (multiple versions coexist)
- Form schema composition (reuse sections)
- Batch contract submission
- Provider fallback chains
- Rate limiting per provider

---

## Glossary

- **Provider**: Insurance company API implementation
- **Product**: Type of insurance (vehicle, health, travel)
- **Form Schema**: Structure defining data collection
- **Field Type**: Category of input (text, select, date, etc.)
- **Component Ref**: Reference to custom React component
- **Credential Manager**: Encryption/decryption service
- **Provider Registry**: Central provider discovery
- **Dynamic Form**: React component rendering FormSchema
- **Mapper**: Function transforming data between formats
- **AES-256-GCM**: Authenticated encryption algorithm

---

**Document Version**: 1.0
**Last Updated**: 2025-12-23
**Maintainer**: Development Team
**Review Schedule**: Quarterly
