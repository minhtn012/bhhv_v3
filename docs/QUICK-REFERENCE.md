# Phase 0 Quick Reference

**One-page cheat sheet for common Phase 0 tasks**

---

## Imports

```typescript
import {
  providerRegistry,          // Get providers
  credentialManager,         // Encrypt/decrypt
  DynamicForm,              // Render forms
  fieldRegistry,            // Register fields
  LocationPicker,           // Location selector
  DateRangePicker,          // Date range
} from '@/core';
```

---

## Get Provider

```typescript
// Get specific provider
const bhv = providerRegistry.getProvider('bhv-online');

// List all providers
const providers = providerRegistry.listProviders();
```

---

## Encrypt Credentials

```typescript
const encrypted = credentialManager.encrypt({
  username: 'user123',
  password: 'pass456',
});

// Store in database
user.credentials = {
  providerId: 'bhv-online',
  username: encrypted.username,
  password: encrypted.password,
};
```

---

## Decrypt Credentials

```typescript
const decrypted = credentialManager.decrypt({
  username: stored.username,
  password: stored.password,
});

// Use for API calls
const result = await provider.testCredentials(decrypted);
```

---

## Load and Render Form

```typescript
const schema = await provider.getFormSchema('vehicle');

<DynamicForm
  schema={schema}
  onSubmit={handleSubmit}
  onChange={handleChange}
/>
```

---

## Check Premium

```typescript
const result = await provider.checkPremium('vehicle', {
  bienSo: '51A-12345',
  giaTriXe: 1000000,
  // ... other fields
});

if (result.success) {
  console.log('Premium:', result.premiumData?.total);
} else {
  console.error('Error:', result.error);
}
```

---

## Create Contract

```typescript
const result = await provider.createContract('vehicle', {
  bienSo: '51A-12345',
  chuXe: 'Nguyen Van A',
  giaTriXe: 1000000,
  // ... other fields
});

if (result.success) {
  console.log('Contract number:', result.contractNumber);
  console.log('PDF:', result.pdfBase64);
}
```

---

## Register Custom Field

```typescript
import { fieldRegistry } from '@/core';
import { CustomComponent } from '@/components/CustomComponent';

fieldRegistry.register('custom-type', CustomComponent);

// Now use in form schema:
// { "type": "custom", "componentRef": "CustomComponent" }
```

---

## Test Credentials

```typescript
const result = await provider.testCredentials({
  username: 'user123',
  password: 'pass456',
});

if (result.success) {
  console.log('Connected!', result.sessionData);
} else {
  console.error('Auth failed:', result.message);
}
```

---

## Use Location Picker

```typescript
import { LocationPicker, type LocationValue } from '@/core';

const [location, setLocation] = useState<LocationValue>({
  province: '',
  provinceText: '',
  district: '',
  districtText: '',
});

<LocationPicker
  value={location}
  onChange={setLocation}
  includeWard={true}
  includeSpecificAddress={true}
/>
```

---

## Use Date Range Picker

```typescript
import { DateRangePicker, type DateRangeValue } from '@/core';

const [range, setRange] = useState<DateRangeValue>({
  startDate: new Date(),
  endDate: new Date(),
});

<DateRangePicker
  value={range}
  onChange={setRange}
  maxDays={365}
/>
```

---

## Error Handling

```typescript
try {
  const result = await provider.createContract('vehicle', data);
  if (!result.success) {
    console.error('API error:', result.error);
  }
} catch (error) {
  console.error('Network error:', error);
}
```

---

## Complete Contract Form

```typescript
const [schema, setSchema] = useState(null);
const [formData, setFormData] = useState({});

useEffect(() => {
  providerRegistry
    .getProvider('bhv-online')
    .getFormSchema('vehicle')
    .then(setSchema);
}, []);

async function handleSubmit(values: Record<string, unknown>) {
  const result = await providerRegistry
    .getProvider('bhv-online')
    .createContract('vehicle', values);

  if (result.success) {
    console.log('Success:', result.contractNumber);
  }
}

if (!schema) return <div>Loading...</div>;

return (
  <DynamicForm
    schema={schema}
    initialValues={formData}
    onChange={setFormData}
    onSubmit={handleSubmit}
  />
);
```

---

## List Available Providers

```typescript
const providers = providerRegistry.listProviders();

providers.forEach(provider => {
  console.log(`${provider.id}: ${provider.name}`);
  provider.products.forEach(product => {
    console.log(`  - ${product.name}`);
  });
});
```

---

## Storage Model for Credentials

```typescript
interface StoredProviderCredentials {
  providerId: string;
  username: {
    algorithm: 'aes-256-gcm';
    iv: string;                    // Base64
    authTag: string;               // Base64
    ciphertext: string;            // Base64
  };
  password: {
    algorithm: 'aes-256-gcm';
    iv: string;
    authTag: string;
    ciphertext: string;
  };
  createdAt: Date;
  updatedAt: Date;
}
```

---

## Field Types Available

- `text` - Text input
- `number` - Number input
- `currency` - Currency formatting
- `date` - Date picker
- `datetime` - Date + time
- `select` - Dropdown
- `radio` - Radio buttons
- `checkbox` - Checkbox
- `textarea` - Multi-line text
- `file-upload` - File upload
- `location-picker` - Vietnamese location
- `car-picker` - Vehicle selector
- `date-range` - Date range
- `custom` - Custom component

---

## Form Validation

```typescript
{
  "fields": [
    {
      "name": "giaTriXe",
      "type": "number",
      "validation": {
        "min": 10000000,
        "max": 5000000000,
        "patternMessage": "Invalid amount"
      }
    }
  ]
}
```

---

## Conditional Fields

```typescript
{
  "name": "phiPin",
  "label": "Battery Insurance",
  "type": "number",
  "showWhen": {
    "field": "loaiDongCo",
    "operator": "equals",
    "value": "ev"
  }
}
```

---

## Check Key Available

```typescript
import { credentialManager } from '@/core';

const isKeyValid = credentialManager.validateKeyAvailable();
if (!isKeyValid) {
  console.error('CREDENTIAL_ENCRYPTION_KEY not configured');
}
```

---

## Documentation

| Topic | Document |
|-------|----------|
| Architecture | system-architecture.md |
| Framework Details | phase-0-provider-framework.md |
| Integration Examples | provider-integration-guide.md |
| Code Standards | code-standards.md |

---

## Common Patterns

### Store & Test Credentials
```typescript
// 1. Encrypt
const encrypted = credentialManager.encrypt(creds);

// 2. Store
user.credentials = { providerId: 'bhv-online', ...encrypted };
await user.save();

// 3. Decrypt & test
const decrypted = credentialManager.decrypt(user.credentials);
const test = await provider.testCredentials(decrypted);
```

### Complete Form Flow
```typescript
// 1. Load schema
const schema = await provider.getFormSchema('vehicle');

// 2. Render form
<DynamicForm schema={schema} onSubmit={handleSubmit} />

// 3. Check premium
const premium = await provider.checkPremium(productId, formData);

// 4. Submit
const contract = await provider.createContract(productId, formData);
```

### Multi-Provider Support
```typescript
// User selects provider
const selected = 'bhv-online'; // or 'manulife', etc.

// Load provider
const provider = providerRegistry.getProvider(selected);

// Rest is same
const schema = await provider.getFormSchema('vehicle');
```

---

**For more details, see:**
- provider-integration-guide.md (practical examples)
- phase-0-provider-framework.md (architecture)
- system-architecture.md (system overview)

---

**Last Updated**: 2025-12-23
