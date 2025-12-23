# BHHV V3 - System Architecture & Design

**Document Purpose**: Comprehensive technical architecture and system design documentation
**Version**: 1.0
**Last Updated**: 2025-12-22
**Architecture Type**: Serverless-ready web application with integrated external platform

---

## Table of Contents

1. [High-Level Architecture](#high-level-architecture)
2. [System Components](#system-components)
3. [Data Architecture](#data-architecture)
4. [API Architecture](#api-architecture)
5. [Authentication & Authorization](#authentication--authorization)
6. [External Integrations](#external-integrations)
7. [Deployment Architecture](#deployment-architecture)
8. [Scalability & Performance](#scalability--performance)
9. [Security Architecture](#security-architecture)
10. [Monitoring & Logging](#monitoring--logging)

---

## High-Level Architecture

### Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         CLIENT TIER                                     │
├─────────────────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │  Next.js Frontend (React 19, Tailwind CSS)                     │   │
│  │  - Contract Management Pages                                   │   │
│  │  - User Dashboard & Admin Dashboard                            │   │
│  │  - Real-time Premium Calculator                                │   │
│  │  - Document Upload & Preview                                   │   │
│  └─────────────────────────────────────────────────────────────────┘   │
└──────────────────────────────┬──────────────────────────────────────────┘
                               │ HTTPS (REST API)
┌──────────────────────────────▼──────────────────────────────────────────┐
│                      APPLICATION TIER                                   │
├──────────────────────────────────────────────────────────────────────────┤
│  Next.js Server (App Router)                                            │
│                                                                          │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │ API Routes Layer                                                 │  │
│  │ ├─ /api/auth/*              (Login, Refresh, Logout, Me)        │  │
│  │ ├─ /api/contracts/*         (CRUD, Status, BHV Submit)          │  │
│  │ ├─ /api/users/*             (User CRUD, Stats)                  │  │
│  │ ├─ /api/car-search/*        (Vehicle Database)                  │  │
│  │ └─ /api/admin/*             (Admin Operations, Logs)            │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│                                                                          │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │ Business Logic Layer (src/lib)                                  │  │
│  │ ├─ contractDataMapper        (DTO → Model)                      │  │
│  │ ├─ bhvDataMapper             (Contract → BHV Format)            │  │
│  │ ├─ bhvApiClient              (BHV Integration)                  │  │
│  │ ├─ contractValidationSchema  (Yup Validation)                   │  │
│  │ ├─ insurance-calculator      (Premium Calculation)              │  │
│  │ └─ auth/jwt                  (Token Generation/Validation)      │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│                                                                          │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │ Infrastructure & Utilities Layer                                │  │
│  │ ├─ logger/errorLogger        (Logging & Monitoring)             │  │
│  │ ├─ mongodb                   (DB Connection - Cached)           │  │
│  │ ├─ encryption                (Data Encryption)                  │  │
│  │ └─ rateLimit                 (Rate Limiting)                    │  │
│  └──────────────────────────────────────────────────────────────────┘  │
└────┬──────────────────────────┬──────────────────────────────┬──────────┘
     │                          │                              │
     │ Mongoose ODM            │ HTTPS REST API               │
     │                          │                              │
┌────▼──────────────────┐ ┌────▼──────────────────┐  ┌────────▼──────────┐
│   DATA TIER           │ │  EXTERNAL INTEGRATIONS│  │  BHV Insurance    │
├───────────────────────┤ ├───────────────────────┤  │  Platform         │
│                       │ │                       │  │                   │
│ ┌─────────────────┐   │ │ ┌─────────────────┐   │  │ ┌─────────────┐   │
│ │ MongoDB         │   │ │ │ Gemini API      │   │  │ │ BHV API     │   │
│ │ (Insurance DB)  │   │ │ │ (OCR - Future)  │   │  │ │ - Premium   │   │
│ ├─────────────────┤   │ │ └─────────────────┘   │  │ │ - Policy    │   │
│ │ Collections:    │   │ │                       │  │ │ - Document  │   │
│ │ - Contracts     │   │ │                       │  │ │ - Tracking  │   │
│ │ - Users         │   │ │                       │  │ └─────────────┘   │
│ │ - Cars          │   │ │                       │  │                   │
│ │ - Locations     │   │ │                       │  │ Secured with:     │
│ │ - SystemLogs    │   │ │                       │  │ - Agent Creds     │
│ │ - BhvLogs       │   │ │                       │  │ - Encrypted Data  │
│ │                 │   │ │                       │  │ - Request Logging │
│ └─────────────────┘   │ │                       │  │                   │
│                       │ │                       │  │                   │
└───────────────────────┘ └───────────────────────┘  └───────────────────┘
```

### Architecture Pattern: Layered Architecture

The system uses a **3-layer architecture** with clear separation of concerns:

1. **Presentation Layer** (Frontend)
   - React components
   - User interface
   - Client-side validation and state

2. **Application Layer** (API & Business Logic)
   - API routes (REST)
   - Business logic (data mappers, calculators, validators)
   - Service layer (BHV integration, authentication)
   - Infrastructure (logging, encryption, database)

3. **Data Layer** (MongoDB)
   - Persistent storage
   - Mongoose models and schemas
   - Indexes and optimizations

### Key Architectural Principles

1. **Stateless Design**: API routes don't maintain server-side state (except refresh tokens)
2. **Serverless-Ready**: Connection caching for MongoDB enables serverless deployment
3. **API-First**: Frontend consumes REST API (enables future mobile/other clients)
4. **Separation of Concerns**: Each module has single responsibility
5. **Type Safety**: TypeScript strict mode throughout
6. **Audit Trail**: All state changes logged for compliance

---

## Phase 0: Core Framework Extraction

**Status**: Implemented
**Date**: 2025-12-23

### Overview
Phase 0 introduces a pluggable provider architecture enabling support for multiple insurance providers beyond BHV. The framework extracts shared functionality into a reusable core while maintaining backward compatibility with existing BHV-specific code.

### Core Framework Components (src/core)

#### Provider System (`src/core/providers`)
**Purpose**: Unified interface for insurance providers
**Components**:
- **types.ts**: Core interfaces all providers must implement
  - `InsuranceProvider`: Main provider interface
  - `ProviderCredentials`: Credential structure
  - `ContractResponse`, `StatusResponse`, `PremiumCheckResponse`: Standard response types
  - `FormSchema`, `FieldDefinition`: Dynamic form definitions
  - Operations: `testCredentials()`, `createContract()`, `checkStatus()`, `checkPremium()`, `getFormSchema()`

- **registry.ts**: Provider registration and discovery
  - `ProviderRegistry`: Central registry for all providers
  - Auto-discovery via import side-effects
  - Get provider by ID: `providerRegistry.getProvider(id)`
  - List all registered: `providerRegistry.listProviders()`

- **base-api-client.ts**: Base HTTP client for providers
  - Standard REST API operations (GET, POST, PUT, DELETE)
  - Request/response interceptors
  - Error handling framework
  - Cookie & session management

#### Credential Management (`src/core/credentials`)
**Purpose**: Secure credential encryption/decryption
**Security**:
- Algorithm: AES-256-GCM (authenticated encryption)
- Key: 32 bytes from environment or scrypt derivation
- Stored format: {algorithm, iv, authTag, ciphertext}
- Never logged: Credentials redacted in logs
- Per-field encryption: Each credential field encrypted separately

**Functions**:
```typescript
encryptValue(plaintext: string): EncryptedCredential
decryptValue(encrypted: EncryptedCredential): string
credentialManager.encrypt(ProviderCredentials)
credentialManager.decrypt(encrypted)
```

#### Form System (`src/core/forms`)
**Purpose**: Provider-agnostic dynamic form rendering
**Components**:
- **types.ts**: Form type definitions
  - `FormSchema`: Complete form structure
  - `FormSection`: Grouped form fields
  - `FieldDefinition`: Individual field configuration
  - `FieldType`: 14 field types (text, number, currency, date, select, etc.)
  - Conditional field rendering via `showWhen` conditions
  - Field validation rules (min/max, length, pattern)
  - Form state: values, errors, touched, isSubmitting, isValid

- **field-registry.ts**: Custom field component registration
  - Register custom field renderers
  - Field lookup by type
  - Default field components for standard types
  - Plugin architecture for custom fields

- **DynamicForm.tsx**: Form renderer component
  - Renders schema into React form
  - State management (values, errors, touched)
  - Section-based layout
  - Conditional field display
  - Form validation (field + schema level)
  - Support for custom components via `componentRef`

#### Shared Components (`src/core/shared/components`)
- **LocationPicker**: Vietnamese province/district/ward selector
- **DateRangePicker**: Date range selection with presets

### BHV Provider Implementation (src/providers/bhv-online)

**Purpose**: Specific implementation for BHV insurance platform
**Structure**:
```
src/providers/bhv-online/
├── index.ts                          # Provider class & auto-registration
├── api-client.ts                     # BHV API communication
├── products/
│   └── vehicle/
│       ├── schema.json               # Form schema for vehicle insurance
│       ├── mapper.ts                 # Data transformation functions
│       └── calculator.ts             # Premium calculation logic
```

**Classes**:
- `BhvProvider`: Implements `InsuranceProvider` interface
  - Product: Vehicle insurance
  - Operations: testCredentials, createContract, checkStatus, checkPremium
  - Session management via cookies
  - Form schema loaded from JSON

- `BhvApiClient`: Low-level API operations
  - HTTP communication with BHV endpoints
  - Request signing/credential handling
  - HTML response parsing
  - PDF extraction

**Auto-Registration**:
```typescript
// In index.ts
providerRegistry.register(bhvProvider);
```
Providers register themselves on import, ensuring availability when `src/providers` is imported.

### Data Flow Architecture

#### Contract Creation via Provider
```
Form Data
    ↓
[Provider] checkPremium() → HTML parsing → Premium display
    ↓
User confirms
    ↓
[Provider] createContract() → BHV contract number + PDF
    ↓
Store in MongoDB + Return to user
```

#### Dynamic Form Rendering
```
FormSchema (JSON from provider)
    ↓
FieldRegistry resolves component types
    ↓
DynamicForm renders sections & fields
    ↓
FieldComponentProps wired to form state
    ↓
Validation on blur/change
    ↓
onSubmit called with validated values
```

#### Credential Lifecycle
```
User enters: {username, password}
    ↓
credentialManager.encrypt(credentials)
    ↓
Store {providerId, encryptedUsername, encryptedPassword} in DB
    ↓
On API call: decrypt → use → never log
    ↓
On logout: clear session from provider
```

### Extensibility Points

#### Adding New Provider
```typescript
// 1. Create provider directory
src/providers/new-provider/

// 2. Implement InsuranceProvider interface
export class NewProvider implements InsuranceProvider {
  id = 'new-provider';
  name = 'New Provider Name';
  products = [...];

  async testCredentials(creds: ProviderCredentials) { }
  async createContract(productId: string, data: unknown) { }
  async checkStatus(contractId: string) { }
  async checkPremium(productId: string, data: unknown) { }
  async getFormSchema(productId: string) { }
}

// 3. Auto-register
export const newProvider = new NewProvider();
providerRegistry.register(newProvider);

// 4. Export from src/providers/index.ts
export { newProvider } from './new-provider';
```

#### Custom Field Components
```typescript
// Register in fieldRegistry
fieldRegistry.register('custom-type', CustomComponent);

// Use in FormSchema
{
  "name": "customField",
  "type": "custom",
  "componentRef": "CustomComponent"
}
```

### Migration Path from Monolithic BHV

**Backward Compatibility**:
- Existing `src/lib/bhvApiClient.ts` continues to work
- Legacy code can coexist with provider system
- Gradual migration possible (route by route)

**Migration Strategy**:
1. Import from `src/providers` for new endpoints
2. Keep old code for existing endpoints
3. Unified credential storage (provider-agnostic)
4. Unified form system (works with any provider)

**Example Usage**:
```typescript
// Old way (still works)
import { bhvApiClient } from '@/lib/bhvApiClient';

// New way (recommended)
import { providerRegistry } from '@/core';
const provider = providerRegistry.getProvider('bhv-online');
```

---

## System Components

### Frontend Components

#### Pages (Next.js App Router)
- **Dashboard** (`/dashboard`)
  - User contracts overview
  - Personal statistics
  - Quick access to recent contracts

- **Contract Management** (`/contracts`)
  - Contract creation wizard
  - Contract details view
  - Contract edit (when status = 'nhap')
  - Status history view

- **Admin Pages** (`/admin`)
  - User management (CRUD)
  - System logs viewer
  - BHV integration logs
  - Dashboard analytics

#### Components
- **ContractForm**: Multi-step wizard for contract creation
- **VehicleInfoForm**: Vehicle information input with auto-complete
- **InsuranceCalculator**: Real-time premium calculation display
- **DocumentUpload**: Base64 file handling for caveat/registration
- **StatusTimeline**: Visual contract status workflow

### Backend Services

#### Authentication Service (`src/lib/auth.ts`, `jwt.ts`)
- **Responsibilities**:
  - Token generation (access + refresh)
  - Token validation and verification
  - User credential verification
  - Session management

- **Key Functions**:
  - `generateTokens(user)`: Creates JWT pair
  - `verifyAccessToken(token)`: Validates access token
  - `refreshAccessToken(refreshToken)`: Token rotation

#### Contract Management Service
- **Data Mapper** (`contractDataMapper.ts`)
  - Converts client DTO to Mongoose model
  - Validates data structure
  - Transforms nested objects

- **Validation** (`contractValidationSchema.ts`)
  - Yup schema for contract validation
  - Complex field dependencies
  - Business rule validation

- **Status Workflow** (`utils/contract-status.ts`)
  - Enforces state transitions
  - Validates status changes
  - Generates status change events

#### Premium Calculation Service (`src/utils/insurance-calculator.ts`)
- **Responsibilities**:
  - Calculate vehicle insurance premiums
  - Apply discounts and surcharges
  - Generate itemized breakdown

- **Algorithm**:
  ```
  Base Rate (by vehicle model/engine) +
  Coverage Rate (by package selected) +
  Business Use Surcharge (TNDS category) +
  Battery Surcharge (if EV/Hybrid) +
  Passenger Insurance (if selected) -
  Renewal Discount (if applicable) +
  Age Adjustment (if applicable)
  = Total Premium
  ```

#### BHV Integration Service (`src/lib/bhvApiClient.ts`)
- **Responsibilities**:
  - API communication with BHV platform
  - Agent authentication (credential-based)
  - Premium quotation submission
  - Contract confirmation

- **Key Methods**:
  - `authenticate(username, password)`: Get session
  - `submitQuote(contractData)`: Get premium from BHV
  - `submitContract(contractData)`: Create policy, get BHV contract number
  - `checkContract(bhvContractNumber)`: Query policy status

#### BHV Data Mapper (`src/lib/bhvDataMapper.ts`)
- **Responsibilities**:
  - Transform internal contract format to BHV API format
  - Handle field name mapping (Vietnamese → BHV system)
  - Validate data before submission
  - Parse BHV responses

#### Logger Service (`src/lib/logger.ts`)
- **Responsibilities**:
  - Structured logging
  - Level-based filtering (debug, info, warn, error)
  - Async log queue for database writes
  - Performance metrics

- **Log Types**:
  - System logs (application events)
  - BHV request logs (API interactions)
  - Error logs (exceptions with context)
  - Performance logs (timing information)

#### Admin Service (`src/lib/adminService.ts`)
- **Responsibilities**:
  - User management operations
  - Location data management
  - System statistics and analytics
  - Admin dashboard data

---

## Data Architecture

### Database Schema Design

#### Contract Collection

```typescript
{
  _id: ObjectId,

  // Identifiers
  contractNumber: string (unique),
  bhvContractNumber?: string (when submitted to BHV),

  // Customer Information
  chuXe: string (vehicle owner name),
  buyerEmail?: string,
  buyerPhone?: string,
  buyerCitizenId?: string,
  diaChi: string (address),

  // Address Components (Hierarchical)
  selectedProvince: string,        // Province code
  selectedProvinceText: string,    // Display name
  selectedDistrictWard: string,    // District/Ward ID
  selectedDistrictWardText: string,
  specificAddress: string,

  // New Address (if different from registration)
  newSelectedProvince?: string,
  newSelectedDistrictWard?: string,
  newSpecificAddress?: string,

  // Vehicle Information
  bienSo: string (registration number),
  nhanHieu: string (brand),
  soLoai: string (model),
  soKhung: string (frame number),
  soMay: string (engine number),
  ngayDKLD: string (registration date),
  namSanXuat: number (year),
  soChoNgoi: number (seats),
  trongTai?: number (weight),
  giaTriXe: number (vehicle value),
  loaiHinhKinhDoanh: string (business type),
  loaiDongCo?: string (engine type),
  giaTriPin?: number (battery value for EV),

  // Car Selection Info
  carBrand?: string,
  carModel?: string,
  carBodyStyle?: string,
  carYear?: string,

  // Insurance Coverage
  vatChatPackage: {
    name: string,
    tyLePhi: number (original rate),
    customRate?: number (if overridden),
    isCustomRate?: boolean,
    phiVatChatGoc?: number,
    phiVatChat: number (final amount),
    dkbs: string[] (coverage details)
  },

  // Additional Coverages
  includeTNDS: boolean,
  tndsCategory: string (business use category),
  phiTNDS: number (third-party liability fee),

  includeNNTX: boolean,
  phiNNTX: number (passenger insurance fee),

  phiPin?: number (battery insurance, EV only),

  // Renewal & Discounts
  taiTucPercentage?: number,
  phiTaiTuc?: number,
  phiTaiTucInfo?: {
    soVu: number (claims count),
    phanTramChiPhi: number (percentage)
  },

  // Premium Totals
  phiTruocKhiGiam?: number (before discounts),
  phiSauKhiGiam?: number (after discounts),
  tongPhi: number (total premium),
  mucKhauTru: number (deductible),

  // Workflow
  status: enum ('nhap', 'cho_duyet', 'khach_duyet', 'ra_hop_dong', 'huy'),
  statusHistory: [
    {
      status: string,
      changedAt: Date,
      changedBy: ObjectId (User),
      reason?: string
    }
  ],

  // Documents
  cavetImage?: string (base64),
  dangkiemImage?: string (base64),

  // Insurance Validity
  ngayBatDauBaoHiem?: string,
  ngayKetThucBaoHiem?: string,

  // Metadata
  createdBy: ObjectId (User reference),
  createdAt: Date,
  updatedAt: Date
}
```

**Indexes**:
```
- contractNumber (unique)
- createdBy, status (for user dashboard queries)
- createdAt (for recent contracts)
- bhvContractNumber (for BHV tracking)
```

#### User Collection

```typescript
{
  _id: ObjectId,

  // Authentication
  username: string (unique, 3-30 chars),
  email: string (unique, valid email),
  password: string (bcryptjs hashed, min 6 chars),

  // Authorization
  role: enum ('admin', 'user'),
  isActive: boolean (soft delete),

  // BHV Integration (for agents)
  bhvUsername?: string (encrypted),
  bhvPassword?: string (encrypted),
  bhvConnectedAt?: Date,
  bhvStatus?: enum ('connected', 'disconnected'),

  // Session Management
  refreshToken?: string (current refresh token),
  refreshTokenExpiry?: Date,

  // Metadata
  createdAt: Date,
  updatedAt: Date
}
```

**Indexes**:
```
- username (unique)
- email (unique)
- role (for admin queries)
```

#### Car Collection
Vehicle database entries with specifications for search feature

#### Location Collections
**Province**: Provinces with codes and names
**DistrictWard**: Districts and wards with hierarchy

#### SystemLog Collection

```typescript
{
  _id: ObjectId,

  level: enum ('debug', 'info', 'warn', 'error'),
  message: string,
  action?: string (e.g., 'contracts.create'),
  userId?: ObjectId,

  // Context
  metadata?: object (additional data),
  error?: {
    message: string,
    stack?: string,
    code?: string
  },

  createdAt: Date (with TTL index: 30 days)
}
```

#### BhvRequestLog Collection

```typescript
{
  _id: ObjectId,

  userId: ObjectId,
  contractId?: ObjectId,

  // Request
  endpoint: string (BHV API endpoint),
  method: string ('GET', 'POST', etc),
  requestBody: object (sanitized),

  // Response
  statusCode: number,
  responseBody?: object,

  // Metadata
  duration: number (milliseconds),
  error?: string,

  createdAt: Date (with TTL index: 90 days)
}
```

### Data Relationships

```
User (1) ─── (N) Contract
         ├─── (N) SystemLog
         └─── (N) BhvRequestLog

Contract (N) ─── (1) User (createdBy)

Location Hierarchy:
Province (1) ─── (N) DistrictWard
```

### Data Integrity Rules

1. **Referential Integrity**
   - Contracts require valid User reference
   - Foreign key constraints enforced at application level

2. **Immutable Fields**
   - `createdAt`: Cannot be changed
   - `statusHistory`: Only appended, never modified
   - `contractNumber`: Unique, immutable

3. **Computed Fields**
   - `tongPhi`: Calculated from component fees
   - `status`: Validated against allowed transitions

---

## API Architecture

### REST API Design

#### Base URL
- Development: `http://localhost:3000`
- Production: `https://bhhv-app.com`

#### Response Format (Standard)
```json
{
  "success": true,
  "data": { /* resource data */ },
  "error": null
}
```

#### Response Format (Error)
```json
{
  "success": false,
  "error": "Human-readable error message",
  "code": "ERROR_CODE",
  "details": { /* validation errors or context */ }
}
```

#### HTTP Status Codes
- `200 OK`: Successful GET/PUT request
- `201 Created`: Successful POST request (new resource)
- `204 No Content`: Successful DELETE request
- `400 Bad Request`: Invalid request format
- `401 Unauthorized`: Missing or invalid authentication
- `403 Forbidden`: Insufficient permissions
- `404 Not Found`: Resource doesn't exist
- `422 Unprocessable Entity`: Validation error
- `500 Internal Server Error`: Server error

### API Endpoints

#### Authentication Routes

| Method | Endpoint | Auth | Purpose |
|--------|----------|------|---------|
| POST | `/api/auth/login` | None | Login with username/password |
| POST | `/api/auth/refresh` | Refresh Token | Get new access token |
| POST | `/api/auth/logout` | Access Token | Invalidate session |
| GET | `/api/auth/me` | Access Token | Get current user profile |

#### Contract Routes

| Method | Endpoint | Auth | Purpose |
|--------|----------|------|---------|
| GET | `/api/contracts` | Access Token | List user's contracts |
| POST | `/api/contracts` | Access Token | Create new contract |
| GET | `/api/contracts/[id]` | Access Token | Get contract details |
| PUT | `/api/contracts/[id]` | Access Token | Update contract (only nhap) |
| DELETE | `/api/contracts/[id]` | Access Token | Delete contract |
| PUT | `/api/contracts/[id]/change-status` | Access Token | Change workflow status |
| POST | `/api/contracts/[id]/confirm` | Access Token | Submit to BHV |
| GET | `/api/contracts/[id]/word-export` | Access Token | Export DOC file |
| GET | `/api/contracts/check-bhv-contract` | Access Token | Query BHV policy |

#### User Routes

| Method | Endpoint | Auth | Purpose |
|--------|----------|------|---------|
| GET | `/api/users` | Access Token (Admin) | List all users |
| POST | `/api/users` | Access Token (Admin) | Create user |
| GET | `/api/users/[id]` | Access Token | Get user details |
| PUT | `/api/users/[id]` | Access Token | Update user |
| DELETE | `/api/users/[id]` | Access Token (Admin) | Delete user |
| POST | `/api/users/bhv-credentials` | Access Token | Set BHV login |
| POST | `/api/users/change-password` | Access Token | Change password |
| GET | `/api/users/dashboard-stats` | Access Token | User statistics |

#### Car Search Routes

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/car-search/brands` | List car brands |
| GET | `/api/car-search/models/[brand]` | Get models for brand |
| GET | `/api/car-search/details/[brand]/[model]` | Get model specs |

#### Admin Routes

| Method | Endpoint | Auth | Purpose |
|--------|----------|------|---------|
| GET | `/api/admin/dashboard-stats` | Access Token (Admin) | System overview |
| GET | `/api/admin/logs` | Access Token (Admin) | System logs |
| GET | `/api/admin/bhv-logs` | Access Token (Admin) | BHV request logs |
| GET | `/api/admin/provinces` | Access Token | All provinces |
| GET | `/api/admin/districts-wards` | Access Token | Districts for province |

### Request/Response Examples

#### Create Contract Request
```typescript
POST /api/contracts

Request Body:
{
  "contractNumber": "CT20250101001",
  "chuXe": "Nguyen Van A",
  "buyerEmail": "nguyen@example.com",
  "buyerPhone": "0901234567",
  "diaChi": "123 Nguyen Hue, HCMC",
  "selectedProvince": "HCM",
  "selectedProvinceText": "Ho Chi Minh City",
  "bienSo": "51A-12345",
  "nhanHieu": "Toyota",
  "soLoai": "Vios",
  "giaTriXe": 800000000,
  "loaiHinhKinhDoanh": "ca_nhan",
  "loaiDongCo": "xang",
  "vatChatPackage": {
    "name": "Bảo hiểm toàn diện",
    "tyLePhi": 0.25,
    "phiVatChat": 2000000
  },
  "includeTNDS": true,
  "tndsCategory": "ca_nhan",
  "phiTNDS": 1500000,
  "includeNNTX": true,
  "phiNNTX": 500000
}

Response (201):
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "contractNumber": "CT20250101001",
    "status": "nhap",
    "tongPhi": 4000000,
    "createdAt": "2025-01-01T10:00:00Z"
  }
}
```

---

## Authentication & Authorization

### JWT Token Structure

#### Access Token
```typescript
// Header
{
  "alg": "HS256",
  "typ": "JWT"
}

// Payload (expires in 15 minutes)
{
  "sub": "user-id",
  "username": "username",
  "role": "user",
  "iat": 1704110400,
  "exp": 1704111300
}

// Signature
HMACSHA256(base64UrlEncode(header) + "." + base64UrlEncode(payload), JWT_SECRET)
```

#### Refresh Token
```typescript
// Stored in HTTP-only cookie, expires in 7 days
{
  "sub": "user-id",
  "type": "refresh",
  "iat": 1704110400,
  "exp": 1704715200
}
```

### Authentication Flow

```
┌─────────────┐
│   Client    │
└──────┬──────┘
       │ 1. POST /api/auth/login
       │    { username, password }
       │
       ▼
┌─────────────────────────────────┐
│   Login API Route               │
├─────────────────────────────────┤
│ 1. Verify credentials           │
│ 2. Hash password check (bcrypt) │
│ 3. Generate tokens              │
│    - Access Token (short-lived) │
│    - Refresh Token (long-lived) │
│ 4. Store refresh token in DB    │
└──────┬──────────────────────────┘
       │ 2. Response 200 OK
       │    {
       │      accessToken,
       │      refreshToken (cookie)
       │    }
       │
       ▼
┌─────────────┐
│   Client    │
│ - Store     │
│   token     │
│ - Set       │
│   cookie    │
└────────┬────┘
         │ 3. API Request
         │    Authorization: Bearer <accessToken>
         │
         ▼
┌──────────────────────────────────┐
│   Protected API Route            │
├──────────────────────────────────┤
│ 1. Extract token from header     │
│ 2. Verify signature & expiry      │
│ 3. Check user in DB              │
│ 4. Extract user claims           │
│ 5. Process request               │
└──────┬───────────────────────────┘
       │ 4. Response 200 OK
       │
       ▼
┌─────────────┐
│   Client    │
└─────────────┘
```

### Authorization (Role-Based Access Control)

```typescript
// Middleware to verify authentication
export async function verifyAuth(request: NextRequest) {
  const token = request.headers.get('authorization')?.replace('Bearer ', '');
  if (!token) throw new UnauthorizedError('Missing token');

  const user = verifyAccessToken(token);
  if (!user) throw new UnauthorizedError('Invalid token');

  return user;
}

// Admin-only endpoint
export async function POST(request: NextRequest) {
  const user = await verifyAuth(request);

  if (user.role !== 'admin') {
    return NextResponse.json(
      { error: 'Forbidden' },
      { status: 403 }
    );
  }

  // Process admin operation
}
```

### Session Management

- **Access Token**: 15 minutes validity
- **Refresh Token**: 7 days validity
- **Token Rotation**: Every refresh operation generates new refresh token
- **Revocation**: Token becomes invalid immediately upon logout or password change

---

## External Integrations

### BHV Platform Integration

#### Architecture

```
BHHV System
    │
    ├─ Contract Data (Vietnamese)
    │
    ▼
BHV Data Mapper (bhvDataMapper.ts)
    │ Transforms to BHV format
    │
    ▼
BHV API Client (bhvApiClient.ts)
    │ HTTP Requests
    │
    ▼
BHV Insurance System
    │
    ├─ Premium Calculation
    ├─ Policy Generation
    ├─ Document Creation
    │
    ▼
Response Processing
    │ - HTML Parsing
    │ - Contract Number Extraction
    │ - Error Handling
    │
    ▼
Contract Update (store bhvContractNumber)
```

#### BHV API Operations

**1. Authentication**
```
POST /api/users/bhv-credentials
- Input: bhvUsername, bhvPassword
- Action: Validate credentials with BHV
- Store: Encrypted credentials in User model
- Output: Connection status
```

**2. Premium Quotation**
```
POST /api/contracts/[id]/confirm (preliminary)
- Input: Contract data (vehicle, coverage, owner info)
- Action: Submit to BHV, receive premium quote
- Output: Premium breakdown, validates calculation
- Decision: Agent approves or adjusts
```

**3. Contract Confirmation**
```
POST /api/contracts/[id]/confirm (final)
- Input: Contract with approved premium
- Action: Submit complete contract to BHV
- Output: bhvContractNumber (official policy ID)
- Result: Contract status → 'ra_hop_dong'
```

**4. Contract Status Check**
```
GET /api/contracts/check-bhv-contract?bhvContractNumber=...
- Input: BHV contract number
- Action: Query policy status from BHV
- Output: Current status, premium, coverage details
```

#### BHV Data Mapping

Internal contract format → BHV API format:

```typescript
// Internal
{
  chuXe: "Nguyen Van A",
  bienSo: "51A-12345",
  phiVatChat: 2000000,
  tongPhi: 4000000
}

// Mapped to BHV
{
  ten_chu_xe: "Nguyen Van A",
  bien_so_xe: "51A-12345",
  phi_vat_chat: 2000000,
  tong_phi: 4000000
}
```

#### Error Handling & Retry

```
BHV Request
    │
    ▼
Success? ─── No ─┐
    │            │
    │ Yes        ▼
    │        Retry Logic
    │        (exponential backoff)
    │            │
    │            ▼
    │        Retry Count Exceeded?
    │            │
    │            No ─┐
    │            │   │ Yes
    │            │   ▼
    ▼            │ Log Error
Store Result     │ Return Error to User
Update Contract  │
               ┌─┘
               │
               ▼
         User Action Required
         (Manual retry/contact support)
```

#### BHV Logging

Every BHV API call logged with:
- Timestamp
- Endpoint and method
- Request body (sanitized: credentials redacted)
- Response status
- Response body (limited size)
- Duration
- Success/failure indicator
- User attribution

---

## Deployment Architecture

### Environments

#### Development
- **Server**: Local or VM
- **Database**: Local MongoDB or Docker
- **Frontend**: Hot reload with Turbopack
- **API**: Live mode with debugging

#### Staging
- **Server**: Cloud instance (AWS, Vercel, etc.)
- **Database**: Staging MongoDB (separate from production)
- **SSL**: Self-signed or valid certificate
- **Purpose**: Pre-production testing

#### Production
- **Server**: Vercel (Next.js optimized) or AWS Lambda/ECS
- **Database**: MongoDB Atlas (managed, replicated)
- **SSL**: Valid certificate (auto-renewed)
- **CDN**: Vercel edge or CloudFront

### Deployment Strategy

```
Code Commit
    │
    ▼
GitHub Repository
    │
    ▼
GitHub Actions Workflow
    ├─ Run Tests (npm run test:ci)
    ├─ Build (npm run build)
    ├─ Security Checks
    │
    ▼
Test/Build Pass?
    │
    No ─→ Fail Workflow
    │     (Notify developer)
    │
    Yes
    │
    ▼
Deploy to Staging
    ├─ Build Docker image
    ├─ Push to registry
    ├─ Deploy to staging environment
    ├─ Run smoke tests
    │
    ▼
Staging Tests Pass?
    │
    No ─→ Fail (fix & retry)
    │
    Yes
    │
    ▼
Manual Approval (Production Release)
    │
    ▼
Deploy to Production
    ├─ Blue-Green Deployment
    ├─ Health checks
    ├─ Monitoring alerts enabled
    │
    ▼
Post-Deployment
    ├─ Verify logs (no errors)
    ├─ Check key metrics
    ├─ Test critical flows
    └─ Monitor for 1 hour
```

### Database Deployment

**Development/Staging**:
- Single MongoDB instance
- Weekly backups
- No replication

**Production**:
- MongoDB Atlas (managed service)
- Replica set (3 nodes minimum)
- Automatic daily backups
- Point-in-time recovery enabled
- Encryption at rest and in transit
- VPC network isolation

---

## Scalability & Performance

### Horizontal Scaling Strategy

```
Load Balancer (Vercel/CloudFlare)
        │
        ├─ Server Instance 1 (Serverless)
        ├─ Server Instance 2 (Serverless)
        ├─ Server Instance 3 (Serverless)
        └─ Server Instance N (Serverless)
        │
        ▼
MongoDB Connection Pool (Shared)
```

**Key Features**:
- Stateless API routes (no session affinity needed)
- MongoDB connection caching (reuses connections)
- JWT authentication (no server-side session lookup)
- Distributed logging (centralized log storage)

### Performance Optimizations

#### Frontend
- **Code Splitting**: Dynamic imports for large components
- **Image Optimization**: Next.js Image component
- **Caching**: Browser cache for static assets
- **Lazy Loading**: Load components on demand

#### Backend
- **Database Indexes**: Fast queries for common patterns
- **Connection Pooling**: Reuse MongoDB connections
- **Query Optimization**: Selective field projection
- **Async Operations**: Non-blocking I/O for logs and external APIs
- **Rate Limiting**: Prevent abuse and DDoS

#### Database
- **Indexes**: Composite indexes for common queries
- **TTL Indexes**: Auto-cleanup of old logs
- **Data Archiving**: Move old contracts to archive collection
- **Query Optimization**: Explain plans for slow queries

### Performance Targets

| Metric | Target | 90th Percentile |
|--------|--------|-----------------|
| Page Load Time | < 2 sec | < 3 sec |
| API Response Time | < 500 ms | < 1 sec |
| Premium Calculation | < 100 ms | < 200 ms |
| Contract List Query | < 1 sec | < 2 sec |
| Database Connection | < 100 ms | < 500 ms |

---

## Security Architecture

### Layers of Security

#### 1. Transport Security
- **HTTPS Only**: TLS 1.2 or higher
- **HSTS Header**: Force HTTPS for all requests
- **Certificate Pinning**: (Optional) For critical connections

#### 2. Authentication Security
- **Password Hashing**: bcryptjs with salt rounds = 12
- **Token Signing**: HS256 with strong secret (32+ chars)
- **Token Expiry**: Short-lived access tokens (15 min)
- **Refresh Token Rotation**: New token on each refresh

#### 3. Authorization Security
- **Role-Based Access**: Admin vs User roles
- **Endpoint Protection**: Auth middleware on protected routes
- **Resource-Level Auth**: User can only access own resources

#### 4. Data Security
- **Encryption at Rest**: Sensitive fields encrypted (AES-256-GCM)
  - BHV credentials
  - Passwords
- **Field Masking**: Sensitive data excluded from logs
- **Secure Headers**:
  - `Content-Security-Policy`: Prevent XSS
  - `X-Frame-Options`: Prevent clickjacking
  - `X-Content-Type-Options`: Prevent MIME sniffing

#### 5. Input Security
- **Validation**: Yup schemas for all inputs
- **Sanitization**: Remove dangerous characters
- **Type Checking**: TypeScript strict mode
- **SQL Injection Prevention**: Mongoose parameterized queries

#### 6. Application Security
- **Rate Limiting**: Prevent brute force and DoS
- **CORS**: Restricted to trusted domains
- **Error Handling**: Generic error messages (details in logs only)
- **Logging**: Audit trail of all sensitive operations

### Data Protection Measures

```
Sensitive Data Flow
│
├─ User Input
│  │ 1. Client validation
│  │ 2. HTTPS transmission
│  └─ 3. Server validation
│
├─ Server Processing
│  │ 1. Decrypt if encrypted
│  │ 2. Process
│  │ 3. Re-encrypt if needed
│  └─ 4. Never log sensitive values
│
├─ Storage
│  │ 1. Encrypted in database
│  │ 2. Access controlled (MongoDB auth)
│  │ 3. Network isolation (VPC)
│  └─ 4. Backups encrypted
│
└─ Deletion
   │ 1. Overwrite with random data
   │ 2. Remove from backups (after retention)
   └─ 3. Verify deletion
```

### Threat Model

| Threat | Risk | Mitigation |
|--------|------|-----------|
| Brute Force Login | High | Rate limiting, strong passwords |
| Credential Theft | High | HTTPS, encryption, secure storage |
| Unauthorized Access | High | JWT auth, RBAC, logging |
| Data Breach | Critical | Encryption, access control, backups |
| XSS/CSRF | Medium | CSP headers, token validation |
| SQL Injection | Low | Mongoose (not raw SQL) |

---

## Monitoring & Logging

### Logging Architecture

#### Log Levels
- **Debug**: Detailed information for debugging
- **Info**: General application events
- **Warn**: Warning conditions, may need attention
- **Error**: Error events, usually recoverable

#### Log Storage

```
Application Logs
    │
    ├─ Real-time (Console)
    │  └─ Dev only: LOG_HTTP_TO_CONSOLE=true
    │
    ├─ Async Queue
    │  └─ logQueue.ts (prevents blocking)
    │
    ▼
MongoDB (SystemLog Collection)
    │
    ├─ Retention: 30 days (TTL index)
    │
    ├─ Queryable: /api/admin/logs
    │  └─ Filtering by level, action, date range
    │
    └─ Archived: Export to cloud storage (planned)
```

#### Log Filtering Capabilities

```typescript
// Query examples
{
  level: 'error',              // Show errors only
  action: 'contracts.create',  // Specific action
  userId: ObjectId('...'),     // User activity
  createdAt: {                 // Date range
    $gte: new Date('2025-01-01'),
    $lte: new Date('2025-01-31')
  }
}
```

### Monitoring & Alerting

#### Key Metrics

**System Health**:
- API availability (uptime %)
- Error rate (errors per minute)
- Response time (p50, p90, p99)
- Database query time
- Cache hit rate

**Business Metrics**:
- Contracts created per day
- BHV integration success rate
- Premium calculation errors
- User login failures

**Infrastructure**:
- CPU utilization
- Memory usage
- Database connection pool status
- MongoDB disk usage
- Log storage utilization

#### Alert Conditions

```
Critical Alerts (Immediate Notification)
├─ API error rate > 5%
├─ Database connection timeout
├─ Authentication failures > 10 per min
├─ BHV integration failures > 3 consecutive
└─ Disk usage > 90%

Warning Alerts (Check within 1 hour)
├─ Response time p99 > 2 seconds
├─ Database query > 1 second (slow query)
├─ Memory usage > 80%
├─ Log storage > 70%
└─ Retry attempts increasing
```

### Health Check Endpoints (Planned)

```
GET /health
Response:
{
  "status": "healthy" | "degraded" | "down",
  "database": "connected" | "disconnected",
  "bhvIntegration": "available" | "unavailable",
  "timestamp": "2025-01-01T10:00:00Z"
}
```

---

## Disaster Recovery & Business Continuity

### Backup Strategy

- **Frequency**: Daily automated backups
- **Retention**: 30 days (development), 90 days (production)
- **Storage**: Geographic redundancy (AWS S3 multi-region)
- **Testing**: Monthly restore test to verify integrity

### Recovery Procedures

**Database Failure**:
1. Identify last good backup
2. Restore to MongoDB Atlas from backup
3. Verify data integrity
4. Switch traffic to restored database
5. Monitor for anomalies

**Application Failure**:
1. Rollback to previous version
2. Verify all endpoints responding
3. Run smoke tests
4. Restore from backup if needed

**BHV Integration Failure**:
1. Queue contracts for later submission
2. Notify administrators
3. Log detailed errors
4. Implement manual fallback process

### RTO & RPO Targets
- **RTO** (Recovery Time Objective): < 1 hour
- **RPO** (Recovery Point Objective): < 1 hour (last backup)

---

## Future Architecture Enhancements

1. **Caching Layer** (Redis)
   - Cache vehicle database
   - Cache location data
   - Cache user permissions

2. **Message Queue** (Bull/RabbitMQ)
   - Async contract processing
   - Async log writing
   - Retry mechanism for BHV submissions

3. **Search Engine** (Elasticsearch)
   - Full-text contract search
   - Advanced filtering
   - Analytics

4. **API Gateway** (Kong/AWS API Gateway)
   - Rate limiting
   - Request validation
   - API versioning

5. **Service Mesh** (Istio)
   - Traffic management
   - Security policies
   - Service discovery

---

**Document Version**: 1.0
**Last Updated**: 2025-12-22
**Architecture Review Date**: Quarterly
