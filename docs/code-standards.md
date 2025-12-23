# BHHV V3 - Code Standards & Development Guidelines

**Document Purpose**: Establish consistent coding standards, conventions, and patterns for the BHHV V3 project
**Version**: 1.0
**Last Updated**: 2025-12-22
**Scope**: All TypeScript/JavaScript files in the `src/` directory

---

## Table of Contents

1. [TypeScript Standards](#typescript-standards)
2. [File Organization](#file-organization)
3. [Naming Conventions](#naming-conventions)
4. [React Component Patterns](#react-component-patterns)
5. [API Route Patterns](#api-route-patterns)
6. [Database Model Conventions](#database-model-conventions)
7. [Error Handling](#error-handling)
8. [Validation & Security](#validation--security)
9. [Testing Standards](#testing-standards)
10. [Documentation Standards](#documentation-standards)
11. [Code Review Checklist](#code-review-checklist)

---

## TypeScript Standards

### General Configuration
- **Strict Mode**: Always enabled (`strict: true`)
- **Target**: ES2020 or higher
- **Module**: ESNext
- **Lib**: DOM, ES2020
- **No Implicit Any**: Enforced (`noImplicitAny: true`)
- **Strict Property Initialization**: Enforced

### Type Definitions

#### Avoid `any` Type
```typescript
// ❌ Avoid
function processData(data: any): any {
  return data;
}

// ✅ Correct
function processData(data: unknown): Record<string, unknown> {
  if (typeof data === 'object' && data !== null) {
    return data as Record<string, unknown>;
  }
  return {};
}
```

#### Use Union Types Over Overloads
```typescript
// ❌ Avoid multiple overloads
function formatValue(value: string): string;
function formatValue(value: number): string;
function formatValue(value: string | number): string {
  return String(value);
}

// ✅ Correct - single signature with union
function formatValue(value: string | number): string {
  return String(value);
}
```

#### Export Types Explicitly
```typescript
// ❌ Avoid
export const contractStatuses = {
  nhap: 'nhap',
  cho_duyet: 'cho_duyet',
  khach_duyet: 'khach_duyet',
  ra_hop_dong: 'ra_hop_dong',
  huy: 'huy'
} as const;

type ContractStatus = typeof contractStatuses[keyof typeof contractStatuses];

// ✅ Correct
export type ContractStatus = 'nhap' | 'cho_duyet' | 'khach_duyet' | 'ra_hop_dong' | 'huy';

export const CONTRACT_STATUSES = {
  nhap: 'nhap' as const,
  cho_duyet: 'cho_duyet' as const,
  khach_duyet: 'khach_duyet' as const,
  ra_hop_dong: 'ra_hop_dong' as const,
  huy: 'huy' as const,
} satisfies Record<string, ContractStatus>;
```

#### Generics with Constraints
```typescript
// ✅ Correct
interface ApiResponse<T extends object> {
  success: boolean;
  data?: T;
  error?: string;
}

async function fetchData<T extends { id: string }>(
  endpoint: string
): Promise<ApiResponse<T>> {
  // implementation
}
```

---

## File Organization

### Maximum File Size: 200 Lines
- **Rationale**: Improves readability, maintainability, testability
- **Enforced via**: ESLint `max-lines` rule
- **Exceptions**:
  - Auto-generated files
  - Test fixtures
  - Large constant data files
  - Third-party code

### File Structure

#### Component Files
```typescript
// 1. Imports (external, then internal)
import React, { useState, useCallback } from 'react';
import { Button } from '@/components/ui/Button';

// 2. Types
interface ContractFormProps {
  contractId: string;
  onSubmit: (data: ContractData) => Promise<void>;
}

// 3. Component
export const ContractForm: React.FC<ContractFormProps> = ({
  contractId,
  onSubmit
}) => {
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = useCallback(async (data: ContractData) => {
    setIsLoading(true);
    try {
      await onSubmit(data);
    } finally {
      setIsLoading(false);
    }
  }, [onSubmit]);

  return <form onSubmit={handleSubmit}>{/* JSX */}</form>;
};

// 4. Display name (for debugging)
ContractForm.displayName = 'ContractForm';

// 5. Export
export default ContractForm;
```

#### Utility/Library Files
```typescript
// 1. Imports
import { Schema } from 'mongoose';

// 2. Types/Interfaces
export interface LogEntry {
  level: 'info' | 'warn' | 'error';
  message: string;
  timestamp: Date;
}

// 3. Constants
const DEFAULT_LOG_LEVEL = 'info' as const;

// 4. Main functions/classes
export function createLogger(name: string): Logger {
  // implementation
}

// 5. Helpers (if small)
function formatTimestamp(date: Date): string {
  // implementation
}

// 6. Exports
export { createLogger };
```

#### API Route Files
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { verifyAuth } from '@/lib/auth';

// Type definitions
interface CreateContractRequest {
  // fields
}

// Handler
export async function POST(request: NextRequest) {
  try {
    await connectToDatabase();
    const user = await verifyAuth(request);

    const body = await request.json() as CreateContractRequest;
    // validation and processing

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

---

## Naming Conventions

### Variables & Functions
```typescript
// ✅ Correct patterns

// camelCase for variables and functions
const maxRetries = 3;
const userEmail = 'user@example.com';
function calculatePremium(): number { }
const handleFormSubmit = (): void => { };

// Constants: UPPER_SNAKE_CASE
const API_TIMEOUT_MS = 5000;
const BHV_ENDPOINT = 'https://my.bhv.com.vn/...';
const CONTRACT_STATUSES = ['nhap', 'cho_duyet', ...];

// Boolean prefixes: is, has, can, should
const isLoading = false;
const hasError = true;
const canEdit = user.role === 'admin';
const shouldSubmit = formValid && !isSubmitting;

// Event handlers: handle + action
const handleSubmit = (): void => { };
const handleInputChange = (value: string): void => { };
const handleErrorClose = (): void => { };

// Callbacks: on + action
const onSuccess = (): void => { };
const onError = (error: Error): void => { };
const onLoad = (): void => { };
```

### Classes & Types
```typescript
// ✅ Correct patterns

// PascalCase for classes
class ContractService {
  constructor() { }
  async createContract(data: CreateContractInput): Promise<Contract> { }
}

// PascalCase for interfaces and types
interface ContractData {
  id: string;
  status: ContractStatus;
}

type ApiResponse<T> = {
  success: boolean;
  data?: T;
  error?: string;
};

// Enums: PascalCase keys
enum UserRole {
  Admin = 'admin',
  User = 'user',
}
```

### Component Names
```typescript
// ✅ Correct patterns

// File: src/components/contracts/ContractForm.tsx
export const ContractForm: React.FC<Props> = ({ ... }) => { };

// File: src/components/ui/Button.tsx
export const Button: React.FC<ButtonProps> = ({ ... }) => { };

// Hooks: use + CamelCase
// File: src/hooks/useContract.ts
export function useContract(contractId: string): UseContractReturn { }

// Context: use + CamelCase
// File: src/contexts/AuthContext.tsx
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => { };
export const useAuth = (): AuthContextType => { };
```

### Vietnamese Field Names (Database)
```typescript
// ✅ Database models use Vietnamese field names
interface IContract {
  chuXe: string;              // Vehicle owner name
  bienSo: string;             // Registration number
  nhanHieu: string;           // Brand
  soLoai: string;             // Model/Type number
  soKhung: string;            // Frame number
  soMay: string;              // Engine number
  ngayDKLD: string;           // Registration date
  namSanXuat: number;         // Manufacturing year
  soChoNgoi: number;          // Number of seats
  giaTriXe: number;           // Vehicle value
  loaiHinhKinhDoanh: string;  // Business type
  loaiDongCo: string;         // Engine type
  phiVatChat: number;         // Property damage fee
  phiTNDS: number;            // Third-party liability fee
  phiNNTX: number;            // Passenger insurance fee
  phiPin: number;             // Battery insurance fee
  muc: number;                // Deductible (khấu trừ)
  tongPhi: number;            // Total premium
  status: ContractStatus;     // Contract status
}

// ❌ Don't mix: Use English in API DTOs if needed
interface CreateContractRequest {
  vehicleOwner: string;       // ✅ English in DTOs
  registrationNumber: string;
}
```

---

## React Component Patterns

### Functional Components Only
```typescript
// ✅ Correct - Functional component
interface Props {
  title: string;
  onClose: () => void;
}

export const Modal: React.FC<Props> = ({ title, onClose }) => {
  return (
    <div>
      <h2>{title}</h2>
      <button onClick={onClose}>Close</button>
    </div>
  );
};

// ❌ Avoid - Class components
class Modal extends React.Component {
  // Old pattern
}
```

### Hooks Usage

#### Custom Hook Pattern
```typescript
// File: src/hooks/useContract.ts
import { useState, useCallback } from 'react';

export interface UseContractReturn {
  contract: Contract | null;
  isLoading: boolean;
  error: Error | null;
  fetchContract: (id: string) => Promise<void>;
}

export function useContract(): UseContractReturn {
  const [contract, setContract] = useState<Contract | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchContract = useCallback(async (id: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/contracts/${id}`);
      const data = await response.json();
      setContract(data);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch'));
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { contract, isLoading, error, fetchContract };
}
```

#### useEffect Dependencies
```typescript
// ✅ Correct - proper dependency array
useEffect(() => {
  const subscription = subscribeToData(userId);
  return () => subscription.unsubscribe();
}, [userId]); // userId is dependency

// ❌ Avoid - empty array when dependencies exist
useEffect(() => {
  fetchUserData(userId); // ❌ Runs only once, misses userId changes
}, []);

// ❌ Avoid - missing dependencies
useEffect(() => {
  const timer = setInterval(() => {
    console.log(count); // ❌ count changes not captured
  }, 1000);
  return () => clearInterval(timer);
}, []); // ❌ Should include [count]
```

### Memoization Strategy
```typescript
// ✅ Use React.memo for expensive components
interface ListItemProps {
  item: ContractItem;
  onSelect: (id: string) => void;
}

export const ContractListItem = React.memo<ListItemProps>(
  ({ item, onSelect }) => {
    return (
      <li onClick={() => onSelect(item.id)}>
        <h3>{item.contractNumber}</h3>
      </li>
    );
  },
  (prev, next) => {
    // Custom comparison if needed
    return prev.item.id === next.item.id &&
           prev.onSelect === next.onSelect;
  }
);

// ✅ Use useCallback for stable function references
const handleSelectContract = useCallback((id: string) => {
  fetchContract(id);
}, []);

// ✅ Use useMemo for expensive computations
const totalPremium = useMemo(() => {
  return contracts.reduce((sum, c) => sum + c.tongPhi, 0);
}, [contracts]);
```

### Component Organization in Files
```typescript
// 1. Imports
import React, { useState, useCallback } from 'react';
import { Button } from '@/components/ui/Button';
import { useContract } from '@/hooks/useContract';

// 2. Type definitions
interface ContractListProps {
  userId: string;
  onSelectContract: (id: string) => void;
}

interface ContractItemState {
  selected: Set<string>;
}

// 3. Constants
const PAGE_SIZE = 20;

// 4. Main component
export const ContractList: React.FC<ContractListProps> = ({
  userId,
  onSelectContract,
}) => {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const { contracts, isLoading } = useContract(userId);

  const handleSelect = useCallback((id: string) => {
    setSelected(prev => {
      const newSet = new Set(prev);
      newSet.has(id) ? newSet.delete(id) : newSet.add(id);
      return newSet;
    });
    onSelectContract(id);
  }, [onSelectContract]);

  if (isLoading) return <div>Loading...</div>;

  return (
    <ul>
      {contracts.map(contract => (
        <ContractListItem
          key={contract.id}
          contract={contract}
          isSelected={selected.has(contract.id)}
          onSelect={handleSelect}
        />
      ))}
    </ul>
  );
};

// 5. Sub-component
interface ContractListItemProps {
  contract: Contract;
  isSelected: boolean;
  onSelect: (id: string) => void;
}

const ContractListItem: React.FC<ContractListItemProps> = React.memo(
  ({ contract, isSelected, onSelect }) => (
    <li
      onClick={() => onSelect(contract.id)}
      style={{ background: isSelected ? '#eee' : 'white' }}
    >
      <h3>{contract.contractNumber}</h3>
      <p>{contract.chuXe}</p>
    </li>
  )
);

ContractListItem.displayName = 'ContractListItem';

export default ContractList;
```

---

## API Route Patterns

### Basic Route Structure
```typescript
// File: src/app/api/contracts/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { verifyAuth } from '@/lib/auth';
import { logger } from '@/lib/logger';
import Contract from '@/models/Contract';

// Type definitions
interface CreateContractRequest {
  contractNumber: string;
  chuXe: string;
  // ... other fields
}

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

// GET handler - list or retrieve
export async function GET(request: NextRequest) {
  try {
    await connectToDatabase();
    const user = await verifyAuth(request);

    const contracts = await Contract.find({ createdBy: user._id });
    logger.info('Contracts retrieved', {
      action: 'contracts.list',
      userId: user._id,
      count: contracts.length,
    });

    return NextResponse.json<ApiResponse<typeof contracts>>({
      success: true,
      data: contracts,
    });
  } catch (error) {
    logger.error('Failed to fetch contracts', {
      action: 'contracts.list',
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    return NextResponse.json<ApiResponse<null>>(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST handler - create
export async function POST(request: NextRequest) {
  try {
    await connectToDatabase();
    const user = await verifyAuth(request);

    const body = await request.json() as CreateContractRequest;

    // Validation
    if (!body.contractNumber || !body.chuXe) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Create document
    const contract = new Contract({
      ...body,
      createdBy: user._id,
    });

    await contract.save();

    logger.info('Contract created', {
      action: 'contracts.create',
      userId: user._id,
      contractId: contract._id,
    });

    return NextResponse.json<ApiResponse<typeof contract>>(
      { success: true, data: contract },
      { status: 201 }
    );
  } catch (error) {
    logger.error('Failed to create contract', {
      action: 'contracts.create',
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    return NextResponse.json<ApiResponse<null>>(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

### Route with Dynamic Segments
```typescript
// File: src/app/api/contracts/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(
  request: NextRequest,
  context: RouteContext
) {
  const { id } = await context.params;
  // implementation
}

export async function PUT(
  request: NextRequest,
  context: RouteContext
) {
  const { id } = await context.params;
  // implementation
}

export async function DELETE(
  request: NextRequest,
  context: RouteContext
) {
  const { id } = await context.params;
  // implementation
}
```

### Error Response Standardization
```typescript
// Use consistent error response format
interface ErrorResponse {
  success: false;
  error: string;
  code?: string;
  details?: Record<string, unknown>;
}

// Return standardized errors
return NextResponse.json<ErrorResponse>(
  {
    success: false,
    error: 'Validation failed',
    code: 'VALIDATION_ERROR',
    details: { field: 'email', reason: 'Invalid email format' },
  },
  { status: 422 }
);
```

---

## Database Model Conventions

### Mongoose Schema Pattern
```typescript
import mongoose, { Document, Schema } from 'mongoose';

// Interface for TypeScript typing
export interface IContract extends Document {
  _id: string;
  contractNumber: string;
  chuXe: string;
  diaChi: string;
  status: 'nhap' | 'cho_duyet' | 'khach_duyet' | 'ra_hop_dong' | 'huy';
  tongPhi: number;
  createdAt: Date;
  updatedAt: Date;
  // Methods
  canChangeStatus(newStatus: string): boolean;
  toJSON(): Record<string, unknown>;
}

// Schema definition
const contractSchema = new Schema<IContract>(
  {
    contractNumber: {
      type: String,
      required: [true, 'Contract number is required'],
      unique: true,
      trim: true,
      match: [/^[A-Z0-9\-]+$/, 'Invalid contract number format'],
    },
    chuXe: {
      type: String,
      required: [true, 'Vehicle owner name is required'],
      minlength: [3, 'Owner name must be at least 3 characters'],
      maxlength: [100, 'Owner name cannot exceed 100 characters'],
    },
    diaChi: {
      type: String,
      required: [true, 'Address is required'],
    },
    status: {
      type: String,
      enum: {
        values: ['nhap', 'cho_duyet', 'khach_duyet', 'ra_hop_dong', 'huy'],
        message: '{VALUE} is not a valid status',
      },
      default: 'nhap',
      required: true,
    },
    tongPhi: {
      type: Number,
      required: true,
      min: [0, 'Premium cannot be negative'],
      get: (value: number) => Math.round(value * 100) / 100, // Format to 2 decimals
    },
  },
  {
    timestamps: true,
    // Don't include these in JSON responses
    toJSON: {
      virtuals: true,
      transform(_doc, ret) {
        delete ret.__v;
        return ret;
      },
    },
  }
);

// Indexes
contractSchema.index({ createdBy: 1, status: 1 });
contractSchema.index({ contractNumber: 1 });
contractSchema.index({ createdAt: -1 });

// Methods
contractSchema.methods.canChangeStatus = function(
  this: IContract,
  newStatus: string
): boolean {
  const allowedTransitions: Record<string, string[]> = {
    nhap: ['cho_duyet', 'huy'],
    cho_duyet: ['khach_duyet', 'huy'],
    khach_duyet: ['ra_hop_dong', 'huy'],
    ra_hop_dong: [], // Terminal state
    huy: [], // Terminal state
  };
  return allowedTransitions[this.status]?.includes(newStatus) ?? false;
};

contractSchema.methods.toJSON = function(this: IContract) {
  const obj = this.toObject();
  delete obj.password;
  return obj;
};

// Pre-save hook
contractSchema.pre('save', async function(next) {
  if (!this.isModified('contractNumber')) return next();

  // Custom validation before save
  const exists = await mongoose.model<IContract>('Contract').findOne({
    contractNumber: this.contractNumber,
  });

  if (exists && exists._id !== this._id) {
    throw new Error('Contract number already exists');
  }

  next();
});

// Model export
export default mongoose.models.Contract ||
  mongoose.model<IContract>('Contract', contractSchema);
```

### Schema Field Patterns
```typescript
// Text fields with validation
field: {
  type: String,
  required: [true, 'Field is required'],
  minlength: [3, 'Min 3 characters'],
  maxlength: [100, 'Max 100 characters'],
  trim: true,
  match: [/^[a-zA-Z0-9\s]+$/, 'Invalid characters'],
}

// Number fields with range
field: {
  type: Number,
  required: true,
  min: [0, 'Cannot be negative'],
  max: [1000000, 'Max value is 1,000,000'],
  get: (value: number) => Math.round(value * 100) / 100, // Format
}

// Dates with defaults
createdAt: {
  type: Date,
  default: Date.now,
  immutable: true, // Can't be changed after creation
}

// Enums with validation
status: {
  type: String,
  enum: {
    values: ['nhap', 'cho_duyet'],
    message: 'Invalid status value',
  },
  required: true,
}

// Nested objects
vatChatPackage: {
  name: { type: String, required: true },
  tyLePhi: { type: Number, required: true },
  phiVatChat: { type: Number, required: true },
  dkbs: [String], // Array
}

// References to other collections
createdBy: {
  type: Schema.Types.ObjectId,
  ref: 'User',
  required: true,
}
```

---

## Error Handling

### Try-Catch Pattern
```typescript
// ✅ Correct
async function fetchAndProcessContract(id: string): Promise<Contract> {
  try {
    const contract = await Contract.findById(id);
    if (!contract) {
      throw new Error('Contract not found');
    }
    return contract;
  } catch (error) {
    logger.error('Failed to fetch contract', {
      action: 'contract.fetch',
      contractId: id,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    });
    throw error; // Re-throw for caller to handle
  }
}
```

### Custom Error Classes
```typescript
// Define custom errors for specific scenarios
export class ValidationError extends Error {
  constructor(
    public field: string,
    public reason: string
  ) {
    super(`Validation error on ${field}: ${reason}`);
    this.name = 'ValidationError';
  }
}

export class ContractNotFoundError extends Error {
  constructor(public contractId: string) {
    super(`Contract ${contractId} not found`);
    this.name = 'ContractNotFoundError';
  }
}

// Usage
if (!contract) {
  throw new ContractNotFoundError(id);
}
```

### Error Response Mapping
```typescript
// In API route handler
try {
  // implementation
} catch (error) {
  if (error instanceof ValidationError) {
    return NextResponse.json(
      { success: false, error: error.message, field: error.field },
      { status: 422 }
    );
  }

  if (error instanceof ContractNotFoundError) {
    return NextResponse.json(
      { success: false, error: 'Contract not found' },
      { status: 404 }
    );
  }

  // Unknown error
  return NextResponse.json(
    { success: false, error: 'Internal server error' },
    { status: 500 }
  );
}
```

---

## Validation & Security

### Input Validation with Yup
```typescript
import * as Yup from 'yup';

// Define schema
export const createContractSchema = Yup.object().shape({
  contractNumber: Yup.string()
    .required('Contract number is required')
    .min(5, 'Must be at least 5 characters')
    .max(50, 'Cannot exceed 50 characters')
    .matches(/^[A-Z0-9\-]+$/, 'Invalid format'),

  chuXe: Yup.string()
    .required('Vehicle owner name is required')
    .min(3, 'Min 3 characters')
    .max(100, 'Max 100 characters'),

  giaTriXe: Yup.number()
    .required('Vehicle value is required')
    .positive('Must be positive')
    .max(500000000, 'Max value 500M VND'),

  status: Yup.string()
    .oneOf(['nhap', 'cho_duyet'], 'Invalid status')
    .required(),

  loaiHinhKinhDoanh: Yup.string()
    .oneOf(['ca_nhan', 'kinh_doanh'], 'Invalid business type')
    .required(),
});

// Validate data
async function validateContract(data: unknown) {
  try {
    const validated = await createContractSchema.validate(data, {
      abortEarly: false, // Collect all errors
      stripUnknown: true, // Remove unknown fields
    });
    return { success: true, data: validated };
  } catch (error) {
    if (error instanceof Yup.ValidationError) {
      return {
        success: false,
        errors: error.inner.map(e => ({
          field: e.path,
          message: e.message,
        })),
      };
    }
    throw error;
  }
}
```

### Security Best Practices

#### Never Log Sensitive Data
```typescript
// ❌ Avoid
logger.info('User login', {
  username: user.username,
  password: user.password, // NEVER!
  token: accessToken, // NEVER!
});

// ✅ Correct
logger.info('User login', {
  userId: user._id,
  username: user.username,
  // No password, token, or credentials
});
```

#### Encrypt Sensitive Fields
```typescript
// For BHV credentials
interface User {
  bhvUsername: string; // Store encrypted
  bhvPassword: string; // Store encrypted
}

// Encryption/decryption utilities
import { encrypt, decrypt } from '@/lib/encryption';

// When saving
user.bhvPassword = encrypt(password);

// When using
const decryptedPassword = decrypt(user.bhvPassword);

// Never expose encrypted values in API responses
user.toJSON = function() {
  const obj = this.toObject();
  delete obj.bhvPassword; // Don't send to client
  return obj;
};
```

#### Validate & Sanitize Input
```typescript
// Always validate on server
async function createContract(request: NextRequest) {
  const body = await request.json();

  // 1. Validate structure
  try {
    const validated = await contractSchema.validate(body);
  } catch (error) {
    return NextResponse.json(
      { error: 'Validation failed' },
      { status: 422 }
    );
  }

  // 2. Sanitize (remove dangerous content)
  // Use library like DOMPurify for HTML content

  // 3. Check authorization
  const user = await verifyAuth(request);
  if (!user) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  // 4. Save safely
  const contract = new Contract(validated);
  contract.createdBy = user._id;
  await contract.save();
}
```

---

## Testing Standards

### Test Coverage Requirements
- **Overall Project**: Minimum 80%
- **`src/utils/insurance-calculator.ts`**: Minimum 90%
- **`src/hooks/useFormValidation.ts`**: Minimum 85%
- **Critical Paths**: 90%+ coverage required

### Test File Organization
```
src/
├── utils/
│   ├── insurance-calculator.ts
│   └── __tests__/
│       └── insurance-calculator.test.ts
├── lib/
│   ├── contractValidationSchema.ts
│   └── __tests__/
│       └── contractValidationSchema.test.ts
└── components/
    ├── contracts/
    │   ├── ContractForm.tsx
    │   └── __tests__/
    │       └── ContractForm.test.tsx
```

### Test Pattern Example
```typescript
import { calculateInsurancePremium } from '@/utils/insurance-calculator';

describe('calculateInsurancePremium', () => {
  describe('basic calculation', () => {
    it('should calculate total premium correctly', () => {
      const input = {
        vehicleValue: 1000000,
        engineType: 'sedan',
        coverage: 'full',
      };

      const result = calculateInsurancePremium(input);

      expect(result).toEqual({
        phiVatChat: expect.any(Number),
        phiTNDS: expect.any(Number),
        tongPhi: expect.any(Number),
      });
      expect(result.tongPhi).toBeGreaterThan(0);
    });

    it('should handle electric vehicles with battery fee', () => {
      const input = {
        vehicleValue: 1500000,
        engineType: 'ev',
        coverage: 'full',
      };

      const result = calculateInsurancePremium(input);

      expect(result.phiPin).toBeGreaterThan(0);
    });
  });

  describe('edge cases', () => {
    it('should throw error for invalid vehicle value', () => {
      expect(() => {
        calculateInsurancePremium({
          vehicleValue: -1000,
          engineType: 'sedan',
        });
      }).toThrow('Vehicle value must be positive');
    });
  });
});
```

### MSW Mock Setup
```typescript
// src/__tests__/test-helpers/msw-handlers.ts
import { http, HttpResponse } from 'msw';

export const handlers = [
  http.get('/api/contracts/:id', ({ params }) => {
    return HttpResponse.json({
      success: true,
      data: {
        _id: params.id,
        contractNumber: 'CT001',
        chuXe: 'Test User',
      },
    });
  }),

  http.post('/api/contracts', async ({ request }) => {
    const body = await request.json();
    return HttpResponse.json(
      {
        success: true,
        data: { ...body, _id: 'new-id' },
      },
      { status: 201 }
    );
  }),
];

// Usage in test
import { render, screen } from '@testing-library/react';
import { setupServer } from 'msw/node';

const server = setupServer(...handlers);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

test('fetches and displays contract', async () => {
  render(<ContractDetail contractId="123" />);
  expect(await screen.findByText('Test User')).toBeInTheDocument();
});
```

---

## Documentation Standards

### Code Comments
```typescript
// ✅ Comments explain WHY, not WHAT

// Rate limits to prevent abuse of BHV API
const MAX_BHV_REQUESTS_PER_MINUTE = 10;

// Electric vehicles need battery insurance surcharge
// based on battery capacity (kwh)
const BATTERY_SURCHARGE_PER_KWH = 50000; // VND

// Database indexes for common queries
// Lookup by user and status for dashboard stats
schema.index({ userId: 1, status: 1 });

// ❌ Avoid - stating the obvious
const x = 5; // Set x to 5
const name = user.name; // Get user name
```

### Function Documentation
```typescript
/**
 * Calculates the total insurance premium for a vehicle
 *
 * @param input - Calculation input parameters
 * @param input.vehicleValue - Vehicle value in VND
 * @param input.engineType - Type of engine (sedan, suv, ev, etc)
 * @param input.coverage - Coverage level selected
 * @returns Premium calculation result with itemized fees
 * @throws ValidationError if input is invalid
 *
 * @example
 * ```typescript
 * const result = calculatePremium({
 *   vehicleValue: 1000000,
 *   engineType: 'sedan',
 *   coverage: 'full',
 * });
 * console.log(result.tongPhi); // Total premium
 * ```
 */
export function calculatePremium(input: PremiumInput): PremiumResult {
  // implementation
}
```

### Type Documentation
```typescript
/**
 * Represents an insurance contract in the system
 *
 * A contract progresses through states: nhap → cho_duyet → khach_duyet → ra_hop_dong
 * Only contracts in 'nhap' status can be edited.
 */
export interface IContract extends Document {
  contractNumber: string; // Unique contract identifier
  chuXe: string;          // Vehicle owner name
  status: ContractStatus; // Current workflow status
  tongPhi: number;        // Total premium in VND
}
```

### API Documentation
```typescript
/**
 * POST /api/contracts
 *
 * Create a new insurance contract
 *
 * Authorization: Required (JWT token)
 * Role Required: 'user'
 *
 * Request Body:
 * ```json
 * {
 *   "contractNumber": "CT20250101001",
 *   "chuXe": "Nguyen Van A",
 *   "giaTriXe": 1000000,
 *   ...
 * }
 * ```
 *
 * Response (201):
 * ```json
 * {
 *   "success": true,
 *   "data": { contract object }
 * }
 * ```
 *
 * Errors:
 * - 400: Missing required fields
 * - 401: Unauthorized
 * - 422: Validation error
 */
export async function POST(request: NextRequest) {
  // implementation
}
```

---

## Code Review Checklist

Use this checklist when reviewing code changes:

### Type Safety
- [ ] No `any` types used (unless absolutely necessary)
- [ ] All function parameters typed
- [ ] All function returns typed
- [ ] Union types used instead of overloads
- [ ] Generics properly constrained

### React/Components
- [ ] Functional components only (no classes)
- [ ] Proper hook dependencies in useEffect/useMemo/useCallback
- [ ] No state mutations (immutable patterns)
- [ ] Component names start with uppercase
- [ ] Props interface defined
- [ ] Display names set for debugging

### API Routes
- [ ] Authentication verified on protected routes
- [ ] Authorization checked (role-based)
- [ ] Input validated before processing
- [ ] Database operations wrapped in try-catch
- [ ] Proper HTTP status codes returned
- [ ] Sensitive data not logged

### Database
- [ ] Indexes defined for common queries
- [ ] Schema validation rules present
- [ ] Required fields marked
- [ ] Constraints enforced (unique, min/max)
- [ ] Pre/post hooks used appropriately
- [ ] No N+1 query problems

### Testing
- [ ] Test coverage >= 80% overall
- [ ] Critical code >= 90% coverage
- [ ] Happy path tested
- [ ] Error cases tested
- [ ] Edge cases considered
- [ ] Mocks properly configured

### Error Handling
- [ ] All try-catch blocks have proper error logging
- [ ] User-friendly error messages
- [ ] No sensitive data in error messages
- [ ] Error codes/types consistent
- [ ] Stack traces logged (not sent to client)

### Security
- [ ] No hardcoded secrets
- [ ] Passwords hashed (bcrypt)
- [ ] Sensitive data encrypted
- [ ] HTTPS enforced
- [ ] Authentication on protected endpoints
- [ ] Input validation/sanitization
- [ ] No sensitive data in logs

### Code Quality
- [ ] File size <= 200 lines (with exceptions noted)
- [ ] Functions are focused (single responsibility)
- [ ] No code duplication
- [ ] Naming is clear and consistent
- [ ] ESLint passes without warnings
- [ ] TypeScript strict mode compiles

### Documentation
- [ ] Complex logic has comments explaining why
- [ ] Functions have JSDoc blocks
- [ ] Types have descriptions
- [ ] API endpoints documented
- [ ] Breaking changes noted

---

## Tool Configuration

### ESLint
Enforced rules include:
- No `any` types
- Max file size (200 lines)
- Consistent naming conventions
- No unused variables
- Proper import/export usage

### TypeScript
Configuration with:
- `strict: true`
- `noImplicitAny: true`
- `noImplicitThis: true`
- `strictNullChecks: true`
- `strictPropertyInitialization: true`

### Jest
Coverage thresholds:
- Branches: 80%
- Functions: 80%
- Lines: 80%
- Statements: 80%

---

**Document Version**: 1.0
**Last Updated**: 2025-12-22
**Maintainer**: Development Team
