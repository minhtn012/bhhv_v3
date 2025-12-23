# BHHV V3 Codebase Summary

## Overview

BHHV V3 is a Vietnamese vehicle insurance contract management system built with Next.js 15, React 19, and TypeScript. The application manages the complete lifecycle of insurance contracts from creation through policy generation, with integration to the BHV (Bảo Hiểm Việt) insurance platform.

**Tech Stack:**
- Next.js 15 (App Router with Turbopack)
- React 19, TypeScript 5
- MongoDB (Mongoose ODM)
- Tailwind CSS v4
- JWT Authentication with refresh tokens
- Jest, React Testing Library, MSW

---

## Project Structure

```
src/
├── app/                          # Next.js App Router
│   ├── api/                      # API routes (REST endpoints)
│   │   ├── auth/                 # Authentication: login, logout, refresh, me
│   │   ├── users/                # User management: CRUD, password change, BHV credentials
│   │   ├── contracts/            # Contract operations: CRUD, status changes, export
│   │   ├── car-search/           # Vehicle database search: brands, models, details
│   │   ├── admin/                # Admin-only endpoints: stats, logs, location data
│   │   └── ...
│   ├── dashboard/                # User dashboard pages
│   │   ├── page.tsx              # Main dashboard
│   │   ├── users/                # User management page (admin)
│   │   ├── profile/              # User profile page
│   │   └── ...
│   ├── admin/                    # Admin pages
│   │   ├── logs/                 # System logs viewer
│   │   ├── bhv-logs/             # BHV API request logs
│   │   └── ...
│   └── layout.tsx                # Root layout with authentication
│
├── components/                   # React components
│   ├── ui/                       # Basic UI components (buttons, inputs, modals, etc.)
│   ├── contracts/                # Contract-specific components
│   │   ├── ContractForm/         # Multi-step contract creation wizard
│   │   ├── VehicleInfoForm/      # Vehicle information input
│   │   ├── InsuranceCalculator/  # Premium calculation display
│   │   └── ...
│   └── ...
│
├── hooks/                        # Custom React hooks
│   ├── useFormValidation.ts      # Form validation hook with Yup
│   ├── useAuth.ts                # Authentication context hook
│   ├── useContract.ts            # Contract management
│   └── ...
│
├── lib/                          # Core business logic & services
│   ├── mongodb.ts                # MongoDB connection (cached for serverless)
│   ├── auth.ts                   # Base auth utilities
│   ├── jwt.ts                    # JWT token generation/validation
│   ├── jwt-server.ts             # Server-side JWT utilities
│   ├── jwt-edge.ts               # Edge runtime JWT utilities
│   ├── encryption.ts             # Data encryption (BHV credentials)
│   ├── bhvApiClient.ts           # BHV insurance platform API client
│   ├── bhvDataMapper.ts          # Converts internal models to BHV format
│   ├── bhvLogger.ts              # Logs all BHV API interactions
│   ├── contractDataMapper.ts     # Converts contract DTO to model
│   ├── contractValidationSchema.ts # Yup validation schema for contracts
│   ├── adminService.ts           # Admin operations (location data, stats)
│   ├── carSearchService.ts       # Vehicle database queries
│   ├── wordContractService.ts    # Generates Word documents from contracts
│   ├── logger.ts                 # Application logging system
│   ├── errorLogger.ts            # Error tracking and logging
│   ├── logQueue.ts               # Async log queue for database writes
│   ├── logCleanup.ts             # Periodic log cleanup
│   ├── logFilters.ts             # Log filtering utilities
│   ├── rateLimit.ts              # Rate limiting middleware
│   └── ...
│
├── models/                       # Mongoose database models
│   ├── Contract.ts               # Insurance contract with status workflow
│   ├── User.ts                   # User accounts (admin/user roles)
│   ├── Car.ts                    # Vehicle database entries
│   ├── Province.ts               # Vietnamese provinces (location hierarchy)
│   ├── DistrictWard.ts           # Districts and wards
│   ├── SystemLog.ts              # Application system logs
│   ├── BhvRequestLog.ts          # BHV API request/response logs
│   └── ...
│
├── types/                        # TypeScript type definitions
│   ├── index.ts                  # Main types export
│   ├── contract.ts               # Contract-related types
│   ├── user.ts                   # User-related types
│   ├── api.ts                    # API request/response types
│   └── ...
│
├── utils/                        # Utility functions (pure functions)
│   ├── insurance-calculator.ts   # Premium calculation engine (90% coverage required)
│   ├── car-engine-mapping.ts     # Maps car models to engine types
│   ├── vehicle-type-mapping.ts   # Vehicle classification utilities
│   ├── contract-status.ts        # Contract workflow state utilities
│   ├── dateFormatter.ts          # Date formatting utilities
│   ├── bhv-html-parser.ts        # Parses BHV response HTML
│   └── __tests__/                # Unit tests for utilities
│
├── services/                     # Business logic services
│   └── ...
│
├── config/                       # Configuration files
│   └── ...
│
├── contexts/                     # React Context for state management
│   └── ...
│
├── middleware/                   # Next.js middleware
│   └── ...
│
└── __tests__/                    # Shared test utilities
    └── test-helpers/             # Fixtures, MSW handlers, database setup
```

---

## Key Models & Database Schema

### Contract Model (`src/models/Contract.ts`)
The core business entity for insurance contracts:

**Key Fields:**
- `contractNumber`: Unique identifier
- `status`: Workflow state (`nhap` → `cho_duyet` → `khach_duyet` → `ra_hop_dong` or `huy`)
- **Customer Info**: `chuXe` (vehicle owner), address, phone, email, citizen ID
- **Vehicle Info**: Registration number, brand, model, frame/engine numbers, registration date, seats, weight, value
- **Insurance Packages**:
  - `vatChatPackage`: Property damage coverage (with custom rate override)
  - `includeTNDS`: Third-party liability flag + category
  - `phiTNDS`: Third-party premium
  - `includeNNTX`: Passenger insurance flag
  - `phiNNTX`: Passenger premium
  - `phiPin`: Battery insurance (electric/hybrid vehicles only)
- **Premium Calculation**:
  - `phiVatChat`: Property damage fee (customizable)
  - `phiTNDS`: Third-party liability fee
  - `phiNNTX`: Passenger insurance fee
  - `phiTaiTuc`: Renewal discount (if applicable)
  - `tongPhi`: Total premium
  - `mucKhauTru`: Deductible
- **Document Attachments**: `cavetImage`, `dangkiemImage` (base64 encoded)
- **BHV Integration**: `bhvContractNumber` (when policy created)
- **Dates**: Insurance validity dates, created/updated timestamps

**Status Workflow:**
1. `nhap` - Initial data entry (editable)
2. `cho_duyet` - Waiting for approval (read-only)
3. `khach_duyet` - Customer approval pending (read-only)
4. `ra_hop_dong` - Policy generated (final)
5. `huy` - Cancelled (terminal state)

### User Model (`src/models/User.ts`)
User accounts with role-based access:

**Fields:**
- `username`, `email`: Unique identifiers
- `password`: Hashed with bcrypt (salt: 12 rounds)
- `role`: `'admin'` or `'user'`
- `isActive`: Account status
- **BHV Integration** (for agents):
  - `bhvUsername`, `bhvPassword`: Encrypted BHV credentials
  - `bhvStatus`: Connection status (`'connected'` or `'disconnected'`)
  - `bhvConnectedAt`: When connection was established
- **Session Management**:
  - `refreshToken`: For refresh token rotation
  - `refreshTokenExpiry`: Token expiration date

**Constraints:**
- Username: 3-30 chars, alphanumeric + underscore
- Email: Valid email format
- Password: Min 6 chars, requires uppercase, lowercase, number, special character

### Car Model (`src/models/Car.ts`)
Vehicle database entries for search functionality

### Location Models (`src/models/Province.ts`, `src/models/DistrictWard.ts`)
Vietnamese hierarchical location data for customer addresses

### SystemLog Model (`src/models/SystemLog.ts`)
Application-level system logs (debug, info, warn, error events)

### BhvRequestLog Model (`src/models/BhvRequestLog.ts`)
Detailed logs of all BHV API interactions (for debugging integrations)

---

## API Architecture

### Authentication Flow

**Login** (`POST /api/auth/login`)
- Input: `username`, `password`
- Output: `accessToken`, `refreshToken` (HTTP-only cookie)
- Returns user data: `id`, `username`, `role`

**Refresh Token** (`POST /api/auth/refresh`)
- Validates existing `refreshToken`
- Issues new `accessToken` and rotates `refreshToken`

**Logout** (`POST /api/auth/logout`)
- Clears refresh token from database

**Current User** (`GET /api/auth/me`)
- Returns authenticated user profile

### Contract Operations

**Create Contract** (`POST /api/contracts`)
- Validates complete contract data via `contractValidationSchema`
- Maps DTO to Contract model via `contractDataMapper`
- Returns created contract with `contractNumber`

**Get Contract** (`GET /api/contracts/[id]`)
- Returns full contract details with nested objects

**Update Contract** (`PUT /api/contracts/[id]`)
- Only allowed if `status === 'nhap'`
- Validates and updates fields

**Change Status** (`PUT /api/contracts/[id]/change-status`)
- Enforces workflow transitions
- Updates `statusHistory` with timestamp and actor

**Confirm & Submit to BHV** (`POST /api/contracts/[id]/confirm`)
- Validates contract completeness
- Submits to BHV platform
- Updates `bhvContractNumber` on success

**Export to Word** (`GET /api/contracts/[id]/word-export`)
- Generates DOC file using `wordContractService`
- Uses docxtemplater with predefined templates

**Check BHV Contract** (`GET /api/contracts/check-bhv-contract`)
- Queries contract details from BHV system

### User Management

**Get Users** (`GET /api/users`) - Admin only
**Create User** (`POST /api/users`) - Admin only
**Get User** (`GET /api/users/[id]`)
**Update User** (`PUT /api/users/[id]`)
**Delete User** (`DELETE /api/users/[id]`) - Admin only

**BHV Credentials** (`POST /api/users/bhv-credentials`)
- Sets encrypted BHV username/password for agent accounts
- Validates connection via `bhvApiClient`

**Change Password** (`POST /api/users/change-password`)
- Validates current password
- Updates with new hashed password

**Dashboard Stats** (`GET /api/users/dashboard-stats`)
- Returns user contract statistics

### Vehicle Search

**Search Brands** (`GET /api/car-search/brands`)
- Returns available car brands

**Search Models** (`GET /api/car-search/models/[brand]`)
- Returns models for a specific brand

**Get Model Details** (`GET /api/car-search/details/[brand]/[model]`)
- Returns specifications (year, engine, body style, etc.)

### Admin Endpoints

**Dashboard Stats** (`GET /api/admin/dashboard-stats`)
- System overview: contract counts, recent activity, stats

**System Logs** (`GET /api/admin/logs`)
- Paginated system logs with filtering
- Supports: level, action, page, limit, date range

**BHV Request Logs** (`GET /api/admin/bhv-logs`)
- Detailed BHV API interaction logs

**Location Data**
- `GET /api/admin/provinces`: All Vietnamese provinces
- `GET /api/admin/districts-wards?province=[code]`: Districts/wards for province

---

## State Management & Data Flow

### Client-Side State
- **React Context**: Authentication state, current user
- **Component State**: Form inputs, UI state
- **No external state library**: Uses React 19 context + hooks

### Server-Side State
- **MongoDB**: Primary data store
- **JWT Tokens**: Stateless authentication (no sessions stored except refresh tokens)
- **Request Validation**: Yup schemas for input validation

### Data Transformation Pipeline
```
User Input (Component)
    ↓
Yup Validation (contractValidationSchema)
    ↓
DTO Mapping (contractDataMapper)
    ↓
Mongoose Model Validation
    ↓
MongoDB Save
    ↓
BHV Mapper (bhvDataMapper) - for external submission
    ↓
BHV API Client
```

---

## External Integrations

### BHV (Bảo Hiểm Việt) Integration
- **Client**: `bhvApiClient.ts` - Handles HTTPS requests to BHV endpoints
- **Data Mapping**: `bhvDataMapper.ts` - Transforms internal contract format to BHV requirements
- **Logging**: `bhvLogger.ts` - Detailed request/response logging
- **Authentication**: Agent credentials (username/password) stored encrypted in User model
- **Key Operations**:
  - Premium quotation (sends vehicle/coverage info, receives HTML quote)
  - Contract confirmation (submits complete contract, receives BHV contract number)
  - Contract details retrieval

### Gemini API (Planned)
- Configuration: `GEMINI_API_KEY` in environment
- Use case: OCR extraction from vehicle registration and inspection documents

---

## Validation & Error Handling

### Input Validation
- **Yup Schemas**: Defined in `contractValidationSchema.ts`
- **Real-time Validation**: Form validation during data entry
- **Server-side Validation**: Re-validation on API routes before database write

### Error Handling
- **ErrorLogger**: `errorLogger.ts` - Captures and logs errors with context
- **API Responses**: Standard format with status codes
- **Client Errors**: 400, 404, 422 (validation)
- **Server Errors**: 500 with generic message (details in logs)

### Logging
- **System Logger**: `logger.ts` - Info, debug, warn, error levels
- **Configurable**: `LOG_LEVEL` environment variable controls verbosity
- **Log Storage**: Written to MongoDB via async queue (`logQueue.ts`)
- **Log Cleanup**: Automated cleanup via `logCleanup.ts` (TTL indexes)

---

## Testing Strategy

### Test Coverage Requirements
- **Overall**: 80% (branches, functions, lines, statements)
- **`src/utils/insurance-calculator.ts`**: 90% coverage (critical business logic)
- **`src/hooks/useFormValidation.ts`**: 85% coverage

### Testing Frameworks
- **Jest**: Test runner and assertions
- **React Testing Library**: Component testing
- **MSW (Mock Service Worker)**: API mocking
- **mongodb-memory-server**: In-memory MongoDB for integration tests

### Test Structure
```
src/
├── __tests__/
│   └── test-helpers/
│       ├── database.ts          # MongoDB connection helper
│       ├── msw-handlers.ts      # API mock handlers
│       ├── msw-server.ts        # MSW server setup
│       └── fixtures.ts          # Test data fixtures
├── lib/__tests__/               # Library unit/integration tests
├── utils/__tests__/             # Utility function tests
├── types/__tests__/             # Type validation tests
└── components/*/__tests__/      # Component tests
```

### Test Patterns
- Unit tests for pure functions (utilities, validators)
- Integration tests for API routes with database
- Component tests with MSW API mocking
- Fixtures for consistent test data
- Database cleanup after each test (mongodb-memory-server)

---

## Authentication & Security

### JWT Implementation
- **Tokens**:
  - `accessToken`: Short-lived (typically 15 min), sent in Authorization header
  - `refreshToken`: Long-lived (typically 7 days), stored in HTTP-only cookie
- **Signing Secrets**:
  - `JWT_SECRET`: For access tokens
  - `REFRESH_SECRET`: For refresh tokens
  - **Must be 32+ chars** in production

### Password Security
- **Hashing**: bcryptjs with salt rounds = 12
- **Validation**: Min 6 chars, requires uppercase, lowercase, number, special character
- **Never logged**: Passwords excluded from API responses

### Data Encryption
- **Encrypted Fields**: BHV credentials (username/password)
- **Algorithm**: AES-256-GCM (via `encryption.ts`)
- **Key**: `ENCRYPTION_KEY` (32 bytes hex-encoded)
- **Never exposed**: Decrypted only when needed for BHV authentication

### Rate Limiting
- `rateLimit.ts`: IP-based rate limiting for public endpoints
- Configurable: requests per window

### Role-Based Access Control
- **Admin Role**:
  - User management (CRUD)
  - System logs access
  - Admin dashboard
- **User Role**:
  - Create/manage own contracts
  - Limited dashboard stats
  - BHV credential management

---

## Performance Considerations

### Database Optimization
- **Connection Caching**: MongoDB connection cached in serverless environment (`mongodb.ts`)
- **Indexes**: Automatic from Mongoose schema definitions
- **Query Optimization**: Selective field projection where possible

### Frontend Performance
- **Next.js Turbopack**: Fast builds and hot reload
- **Lazy Loading**: Code splitting with dynamic imports
- **Component Memoization**: Prevent unnecessary re-renders

### API Performance
- **Response Caching**: Some static data cached (vehicle models, locations)
- **Async Operations**: Non-blocking with async/await
- **Log Queue**: Async log writing to prevent blocking

---

## Configuration

### Environment Variables
```
# Database
MONGODB_URI=mongodb://user:pass@host:port/db?authSource=admin
DB_NAME=bhhv

# Authentication
JWT_SECRET=<32+ char random string>
REFRESH_SECRET=<32+ char random string>
ENCRYPTION_KEY=<32-byte hex-encoded key>

# External APIs
GEMINI_API_KEY=<api-key>

# Application
NODE_ENV=development|production
LOG_LEVEL=debug|info|warn|error
LOG_HTTP_TO_CONSOLE=true|false
```

### Path Aliases
- `@/*` → `src/*`
- `@db/*` → `db_json/*`

---

## File Size Guidelines

- **Maximum file size**: 200 lines
- **Rationale**: Improves readability, maintainability, testability
- **Exceptions**: Auto-generated code, large data files

---

## Key Utilities

### Insurance Calculator (`src/utils/insurance-calculator.ts`)
Calculates vehicle insurance premiums based on:
- Vehicle type (sedan, SUV, truck, etc.)
- Engine type and capacity
- Coverage level selected
- Business usage type (TNDS category)
- Age/mileage discount factors
- Renewal discount percentage
- Battery insurance (for electric/hybrid)

**Output**:
- Base premium (phiVatChat)
- Third-party liability (phiTNDS)
- Passenger insurance (phiNNTX)
- Battery fee (phiPin)
- Renewal discount (phiTaiTuc)
- **Total premium (tongPhi)**

### Contract Status Utilities (`src/utils/contract-status.ts`)
- `canChangeStatus()`: Validates allowed workflow transitions
- `getStatusText()`: Localized status labels

### Date Formatting (`src/utils/dateFormatter.ts`)
- Vietnamese date format: DD/MM/YYYY
- Consistent date handling across application

### BHV HTML Parser (`src/utils/bhv-html-parser.ts`)
- Parses HTML responses from BHV API
- Extracts premium quotes and contract details

---

## Development Workflow

### Prerequisites
- Node.js 18+
- MongoDB (local or Docker)
- Environment variables configured

### Common Commands
```bash
npm run dev              # Start dev server with Turbopack
npm run build            # Production build
npm start                # Production server
npm run lint             # ESLint checks
npm test                 # Run all tests
npm run test:watch      # Watch mode
npm run test:coverage   # Coverage report
npm run test:ci         # CI environment
```

### Development Patterns
1. **Types First**: Define types before implementation
2. **Validation Early**: Use Yup schemas for input validation
3. **Error Handling**: Catch and log all errors with context
4. **Testing**: Write tests for critical business logic
5. **Documentation**: Keep comments focused on "why", not "what"

---

## Common Workflows

### Adding a New Contract Field
1. Update `Contract.ts` model schema
2. Update `IContract` interface
3. Update validation schema in `contractValidationSchema.ts`
4. Update data mapper in `contractDataMapper.ts`
5. Update form component to handle field
6. Update tests
7. Consider BHV mapping impact in `bhvDataMapper.ts`

### Creating a New API Endpoint
1. Create route file in `src/app/api/[resource]/route.ts`
2. Define request/response types in `src/types/`
3. Add database/business logic to `src/lib/`
4. Add input validation via Yup schema
5. Implement error handling and logging
6. Add authentication/authorization checks
7. Write integration tests with MSW mocking
8. Document in API documentation

### Submitting Contract to BHV
1. Validate contract completeness
2. Map contract fields to BHV format (`bhvDataMapper`)
3. Call BHV API client (`bhvApiClient`)
4. Log request/response (`bhvLogger`)
5. Parse response (HTML parser)
6. Update contract with `bhvContractNumber`
7. Generate contract document (Word export)

---

## Monitoring & Troubleshooting

### Key Log Types
- **System Logs**: Application events, errors
- **BHV Logs**: Integration debugging
- **HTTP Logs**: Request/response details (console only in dev)
- **Error Logs**: Exception stack traces with context

### Viewing Logs
- **Admin Dashboard**: `/admin/logs` (system logs)
- **BHV Logs**: `/admin/bhv-logs` (API integration)
- **Console**: Dev mode only (LOG_HTTP_TO_CONSOLE)

### Common Issues
1. **MongoDB Connection**: Check `MONGODB_URI` in environment
2. **JWT Validation Failures**: Check token expiry, secret key mismatch
3. **BHV Integration Failures**: Check logs in `/admin/bhv-logs`, verify agent credentials
4. **Validation Errors**: Check `contractValidationSchema`, ensure all required fields present
5. **File Upload Failures**: Ensure base64 encoding correct, file size limits respected

---

## Documentation

- **README.md**: Getting started guide
- **CLAUDE.md**: AI assistant instructions (IMPORTANT: AI-specific guidelines)
- **docs/**: Detailed documentation suite
  - `project-overview-pdr.md`: Product requirements
  - `code-standards.md`: Coding standards and patterns
  - `system-architecture.md`: System design and architecture

---

**Last Updated**: 2025-12-22
**Version**: 1.0
