# Provider Integration Guide

**Quick Reference**: How to use and extend provider framework
**Target Audience**: Frontend/backend developers
**Prerequisite Knowledge**: Basic TypeScript, React, HTTP

---

## Quick Start

### Import Core Exports

```typescript
import {
  // Provider registry
  providerRegistry,

  // Credential encryption
  credentialManager,
  encryptValue,
  decryptValue,

  // Form system
  DynamicForm,
  fieldRegistry,
  type FormSchema,
  type DynamicFormProps,

  // Components
  LocationPicker,
  DateRangePicker,

  // Types
  type InsuranceProvider,
  type InsuranceType,
  type ProviderCredentials,
  type ContractResponse,
  type PremiumCheckResponse,
} from '@/core';
```

### Using a Provider

```typescript
// Get provider
const bhv = providerRegistry.getProvider('bhv-online');
if (!bhv) throw new Error('Provider not found');

// Test credentials
const testResult = await bhv.testCredentials({
  username: 'agent123',
  password: 'pass456'
});

if (!testResult.success) {
  console.error(testResult.message);
  return;
}

// Get form schema
const schema = await bhv.getFormSchema('vehicle');

// Get premium estimate
const premiumResult = await bhv.checkPremium('vehicle', formData);

// Create contract
const contractResult = await bhv.createContract('vehicle', formData);
```

---

## Common Tasks

### 1. Display Provider-Specific Form

```typescript
'use client';

import { useState, useEffect } from 'react';
import { DynamicForm, providerRegistry, type FormSchema } from '@/core';

interface ContractFormProps {
  providerId: string;
  productId: string;
  onSubmit: (values: Record<string, unknown>) => void;
}

export function ContractForm({ providerId, productId, onSubmit }: ContractFormProps) {
  const [schema, setSchema] = useState<FormSchema | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadSchema = async () => {
      try {
        const provider = providerRegistry.getProvider(providerId);
        if (!provider) throw new Error('Provider not found');

        const formSchema = await provider.getFormSchema(productId);
        setSchema(formSchema);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    loadSchema();
  }, [providerId, productId]);

  if (loading) return <div>Loading form...</div>;
  if (error) return <div className="error">{error}</div>;
  if (!schema) return <div>Schema not found</div>;

  return (
    <DynamicForm
      schema={schema}
      onSubmit={onSubmit}
      submitButtonText="Continue"
    />
  );
}
```

### 2. Encrypt and Store Credentials

```typescript
import { credentialManager } from '@/core';
import User from '@/models/User';

async function updateUserCredentials(
  userId: string,
  providerId: string,
  username: string,
  password: string
) {
  // Encrypt
  const encrypted = credentialManager.encrypt({ username, password });

  // Store
  const user = await User.findById(userId);
  user.providerCredentials = {
    providerId,
    username: encrypted.username,
    password: encrypted.password,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  await user.save();

  return { success: true };
}
```

### 3. Retrieve and Decrypt Credentials

```typescript
import { credentialManager, providerRegistry } from '@/core';
import User from '@/models/User';

async function testProviderConnection(userId: string, providerId: string) {
  // Get user
  const user = await User.findById(userId);
  if (!user.providerCredentials) {
    throw new Error('No credentials stored');
  }

  // Decrypt
  const decrypted = credentialManager.decrypt({
    username: user.providerCredentials.username,
    password: user.providerCredentials.password,
  });

  // Test
  const provider = providerRegistry.getProvider(providerId);
  const result = await provider.testCredentials(decrypted);

  return result;
}
```

### 4. Check Premium with Provider

```typescript
import { providerRegistry } from '@/core';

async function checkPremium(
  providerId: string,
  productId: string,
  contractData: Record<string, unknown>
) {
  const provider = providerRegistry.getProvider(providerId);
  if (!provider) throw new Error(`Provider ${providerId} not found`);

  const result = await provider.checkPremium(productId, contractData);

  if (!result.success) {
    throw new Error(result.error || 'Premium check failed');
  }

  // Result may contain:
  // - result.premiumData: { total: number, breakdown?: {...} }
  // - result.htmlData: Raw HTML from provider (for advanced parsing)

  return result;
}
```

### 5. Submit Contract to Provider

```typescript
import { providerRegistry } from '@/core';
import Contract from '@/models/Contract';

async function submitContractToProvider(
  contractId: string,
  providerId: string,
  productId: string,
  contractData: Record<string, unknown>
) {
  const provider = providerRegistry.getProvider(providerId);
  if (!provider) throw new Error(`Provider ${providerId} not found`);

  // Submit
  const result = await provider.createContract(productId, contractData);

  if (!result.success) {
    throw new Error(result.error || 'Contract submission failed');
  }

  // Update contract with provider's response
  const contract = await Contract.findById(contractId);
  contract.bhvContractNumber = result.contractNumber; // Or provider-specific ID
  contract.pdfBase64 = result.pdfBase64;
  contract.status = 'ra_hop_dong';
  contract.statusHistory.push({
    status: 'ra_hop_dong',
    changedAt: new Date(),
    changedBy: userId,
  });

  await contract.save();

  return {
    success: true,
    contractNumber: result.contractNumber,
    pdfBase64: result.pdfBase64,
  };
}
```

### 6. Use Location Picker Component

```typescript
'use client';

import { useState } from 'react';
import { LocationPicker, type LocationValue } from '@/core';

export function AddressForm() {
  const [location, setLocation] = useState<LocationValue>({
    province: '',
    provinceText: '',
    district: '',
    districtText: '',
  });

  const handleSubmit = async () => {
    console.log('Selected location:', location);
    // Save to form data or API
  };

  return (
    <form>
      <LocationPicker
        value={location}
        onChange={setLocation}
        includeWard={true}
        includeSpecificAddress={true}
      />

      <button onClick={handleSubmit} type="button">
        Continue
      </button>
    </form>
  );
}
```

### 7. Use Date Range Picker

```typescript
'use client';

import { useState } from 'react';
import { DateRangePicker, type DateRangeValue } from '@/core';

const PRESETS = [
  {
    label: 'Last 7 days',
    getValue: () => ({
      startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      endDate: new Date(),
    }),
  },
  {
    label: 'Last 30 days',
    getValue: () => ({
      startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      endDate: new Date(),
    }),
  },
];

export function ReportDateRange() {
  const [range, setRange] = useState<DateRangeValue>({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    endDate: new Date(),
  });

  return (
    <DateRangePicker
      value={range}
      onChange={setRange}
      presets={PRESETS}
      maxDays={365}
    />
  );
}
```

---

## Form Integration Patterns

### Pattern 1: Simple Form Rendering

```typescript
// Minimal setup - just render provider form
<DynamicForm
  schema={schema}
  onSubmit={handleSubmit}
/>
```

### Pattern 2: Form with Initial Data

```typescript
// Pre-fill form from existing contract
<DynamicForm
  schema={schema}
  initialValues={existingContract}
  onSubmit={handleSubmit}
/>
```

### Pattern 3: Form with Change Tracking

```typescript
// Track form changes for auto-save
const [formData, setFormData] = useState({});

<DynamicForm
  schema={schema}
  initialValues={formData}
  onChange={setFormData}
  onSubmit={handleSubmit}
/>
```

### Pattern 4: Multi-Step Form

```typescript
// Combine multiple forms with step tracking
const [step, setStep] = useState(1);
const [data, setData] = useState({});

function handleStepSubmit(stepData: Record<string, unknown>) {
  setData({ ...data, ...stepData });

  if (step < totalSteps) {
    setStep(step + 1);
  } else {
    submitFinalContract(data);
  }
}

return (
  <DynamicForm
    schema={schemas[step]}
    initialValues={data}
    onSubmit={handleStepSubmit}
    submitButtonText={step === totalSteps ? 'Submit' : 'Next'}
  />
);
```

### Pattern 5: Form with Server Validation

```typescript
async function handleFormSubmit(values: Record<string, unknown>) {
  try {
    // Client-side validation already done by DynamicForm
    // Now validate business logic on server
    const validationResult = await validateContractData(values);

    if (!validationResult.valid) {
      // Handle validation errors
      showErrors(validationResult.errors);
      return;
    }

    // Valid - proceed with submission
    await submitContract(values);
  } catch (error) {
    handleError(error);
  }
}

<DynamicForm
  schema={schema}
  onSubmit={handleFormSubmit}
/>
```

---

## Provider Development

### Implementing a New Provider

See [phase-0-provider-framework.md](./phase-0-provider-framework.md) for detailed implementation guide. Quick checklist:

```typescript
✓ Create src/providers/your-provider/
✓ Implement InsuranceProvider interface
✓ Create API client extending BaseApiClient
✓ Define product(s) with form schema
✓ Create mappers and calculators as needed
✓ Auto-register in index.ts
✓ Export from src/providers/index.ts
✓ Write unit tests (80%+ coverage)
✓ Test with DynamicForm
✓ Document provider-specific behavior
```

### Provider Response Formats

**Contract Response**:
```typescript
{
  success: true | false;
  contractNumber?: string;         // Provider's contract ID
  pdfBase64?: string;              // Base64-encoded PDF
  error?: string;                  // Error message if !success
  rawResponse?: unknown;           // Raw provider response for debugging
}
```

**Premium Check Response**:
```typescript
{
  success: true | false;
  premiumData?: {
    total: number;
    breakdown?: {
      [key: string]: number;       // Insurance components
    };
  };
  htmlData?: string;               // Raw HTML from provider
  error?: string;
}
```

---

## Error Handling

### Provider Errors

```typescript
try {
  const result = await provider.testCredentials(creds);

  if (!result.success) {
    // Provider returned expected error
    console.error('Auth failed:', result.message);
    showUserMessage(result.message);
  }
} catch (error) {
  // Unexpected error
  console.error('Unexpected error:', error);
  showUserMessage('System error. Please try again.');
}
```

### Form Validation Errors

```typescript
async function handleFormSubmit(values: Record<string, unknown>) {
  try {
    // DynamicForm ensures values are valid per schema
    // Additional server validation if needed
    const response = await api.saveContract(values);

    if (!response.ok) {
      // Handle API error
      const error = await response.json();
      showErrors(error.details);
    }
  } catch (error) {
    // Handle network/other errors
    console.error('Error:', error);
    showUserMessage('Failed to save. Please try again.');
  }
}
```

---

## Type Safety

### Typed Provider Usage

```typescript
import type { InsuranceProvider, ContractResponse } from '@/core';

async function useProvider<T extends ContractResponse>(
  provider: InsuranceProvider,
  productId: string,
  data: unknown
): Promise<T> {
  const result = await provider.createContract(productId, data);
  return result as T;
}
```

### Typed Form Data

```typescript
interface VehicleInsuranceForm {
  bienSo: string;
  nhanHieu: string;
  soLoai: string;
  giaTriXe: number;
  loaiHinhKinhDoanh: string;
  includeTNDS: boolean;
  phiTNDS: number;
}

function handleSubmit(values: Record<string, unknown>) {
  const data = values as VehicleInsuranceForm;
  // Now typed with autocomplete
  console.log(data.bienSo);
}
```

---

## Testing

### Testing Provider Integration

```typescript
import { providerRegistry } from '@/core';

describe('BHV Provider', () => {
  let provider: InsuranceProvider;

  beforeEach(() => {
    provider = providerRegistry.getProvider('bhv-online');
  });

  it('should test credentials', async () => {
    const result = await provider.testCredentials({
      username: 'test',
      password: 'test',
    });
    expect(result.success).toBe(false); // Invalid creds
  });

  it('should load form schema', async () => {
    const schema = await provider.getFormSchema('vehicle');
    expect(schema.sections).toBeDefined();
    expect(schema.sections.length).toBeGreaterThan(0);
  });
});
```

### Testing Forms

```typescript
import { render, screen, userEvent } from '@testing-library/react';
import { DynamicForm, type FormSchema } from '@/core';

const mockSchema: FormSchema = {
  version: '1.0',
  sections: [
    {
      id: 'test',
      title: 'Test',
      fields: [
        {
          name: 'email',
          label: 'Email',
          type: 'text',
          required: true,
        },
      ],
    },
  ],
};

it('should submit valid form', async () => {
  const handleSubmit = jest.fn();

  render(
    <DynamicForm schema={mockSchema} onSubmit={handleSubmit} />
  );

  await userEvent.type(screen.getByLabelText('Email'), 'test@example.com');
  await userEvent.click(screen.getByRole('button', { name: /submit/i }));

  expect(handleSubmit).toHaveBeenCalledWith({ email: 'test@example.com' });
});
```

---

## Performance Tips

### Form Rendering
- Use `useMemo` for expensive computations
- Memoize callbacks with `useCallback`
- Lazy load custom components if needed

### Provider Operations
- Cache form schemas (they rarely change)
- Reuse provider instances (singletons)
- Batch API calls when possible

### Credential Encryption
- Decrypt only when needed (not at page load)
- Don't store decrypted in React state
- Clear after use

---

## Troubleshooting

### "Provider not found" Error

```typescript
// Check if provider is registered
const available = providerRegistry.listProviders();
console.log('Available:', available.map(p => p.id));

// Ensure provider module is imported
import '@/providers'; // Side-effect: auto-registers all providers
```

### Form Validation Not Working

```typescript
// Check FormSchema syntax
const schema = await provider.getFormSchema('vehicle');

// Verify field definitions
schema.sections.forEach(section => {
  console.log('Section:', section.id);
  section.fields.forEach(field => {
    console.log('Field:', field.name, field.type, field.required);
  });
});

// Check validation rules
console.log('Validation rules:', schema.validationRules);
```

### Credential Decryption Fails

```typescript
// Verify encryption key exists
const isKeyValid = credentialManager.validateKeyAvailable();
if (!isKeyValid) {
  console.error('CREDENTIAL_ENCRYPTION_KEY not set');
}

// Check stored encrypted format
const stored = user.providerCredentials;
console.log('Encrypted:', {
  algorithm: stored.username.algorithm,
  hasIv: !!stored.username.iv,
  hasCiphertext: !!stored.username.ciphertext,
  hasAuthTag: !!stored.username.authTag,
});
```

---

## API Reference

### providerRegistry

```typescript
providerRegistry.register(provider: InsuranceProvider): void
providerRegistry.getProvider(id: string): InsuranceProvider | undefined
providerRegistry.listProviders(): InsuranceProvider[]
providerRegistry.getProductsByType(type: InsuranceType): ProductDefinition[]
```

### credentialManager

```typescript
credentialManager.encrypt(creds: ProviderCredentials): {
  username: EncryptedCredential;
  password: EncryptedCredential;
}
credentialManager.decrypt(encrypted): ProviderCredentials
credentialManager.validateKeyAvailable(): boolean

// Module functions
encryptValue(plaintext: string): EncryptedCredential
decryptValue(encrypted: EncryptedCredential): string
```

### fieldRegistry

```typescript
fieldRegistry.register(type: FieldType, component: React.ComponentType): void
fieldRegistry.getComponent(type: FieldType): React.ComponentType
fieldRegistry.listRegisteredFields(): FieldType[]
```

### DynamicForm

```typescript
<DynamicForm
  schema={FormSchema}                           // Required
  initialValues?: Record<string, unknown>
  onSubmit: (values: Record<string, unknown>) => void | Promise<void>
  onChange?: (values: Record<string, unknown>) => void
  className?: string
  disabled?: boolean
  hideSubmitButton?: boolean
  submitButtonText?: string
/>
```

### LocationPicker

```typescript
<LocationPicker
  value={LocationValue}                         // Required
  onChange={(value: LocationValue) => void}    // Required
  includeWard?: boolean
  includeSpecificAddress?: boolean
/>
```

### DateRangePicker

```typescript
<DateRangePicker
  value={DateRangeValue}                       // Required
  onChange={(value: DateRangeValue) => void}  // Required
  presets?: Array<{label: string; getValue: () => DateRangeValue}>
  maxDays?: number
/>
```

---

## Best Practices

1. **Always validate credentials before use**
   - Test connection before storing
   - Handle auth errors gracefully

2. **Never log sensitive data**
   - Never log plaintext credentials
   - Never log encrypted values
   - Redact in error messages

3. **Handle network errors**
   - Implement retry logic for transient failures
   - Provide user-friendly error messages
   - Log technical errors for debugging

4. **Cache form schemas**
   - Don't reload per request
   - Use React.memo or useMemo
   - Invalidate on provider updates

5. **Validate on both sides**
   - Client: Real-time feedback
   - Server: Security and data integrity

6. **Test thoroughly**
   - Mock provider responses
   - Test error cases
   - Test conditional fields

---

**Last Updated**: 2025-12-23
**Version**: 1.0
