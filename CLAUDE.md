# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Core Development
- `npm run dev` - Start Next.js development server with Turbopack
- `npm run build` - Build production application with Turbopack  
- `npm start` - Start production server
- `npm run lint` - Run ESLint for code quality checks

### Testing
- `npm test` - Run Jest test suite
- `npm run test:watch` - Run tests in watch mode for development
- `npm run test:coverage` - Generate test coverage report
- `npm run test:ci` - Run tests for CI/CD (no watch mode)

Coverage thresholds are enforced:
- Global: 80% for branches, functions, lines, statements
- `src/utils/insurance-calculator.ts`: 90% coverage required
- `src/hooks/useFormValidation.ts`: 85% coverage required

## Architecture Overview

### Technology Stack
- **Framework**: Next.js 15 with App Router and Turbopack
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT-based authentication system
- **UI**: React 19, Tailwind CSS v4
- **Testing**: Jest with React Testing Library, MSW for API mocking
- **Type System**: TypeScript with strict mode enabled

### Project Structure
```
src/
├── app/                    # Next.js App Router pages and API routes
│   ├── api/               # API endpoints
│   │   ├── auth/          # Authentication endpoints
│   │   ├── users/         # User management
│   │   ├── contracts/     # Insurance contract operations
│   │   └── admin/         # Admin-only endpoints
│   ├── contracts/         # Contract management pages
│   └── dashboard/         # Dashboard pages
├── components/            # Reusable React components
│   ├── ui/               # Basic UI components
│   └── contracts/        # Contract-specific components
├── hooks/                # Custom React hooks
├── lib/                  # Utility libraries and services
├── models/               # Mongoose database models
├── types/                # TypeScript type definitions
└── utils/                # Pure utility functions
```

### Key Models and Business Logic

#### Contract Management System
The application manages vehicle insurance contracts with a specific workflow:
- **Contract Model** (`src/models/Contract.ts`): Core business entity with Vietnamese field names
- **Workflow States**: `nhap` → `cho_duyet` → `khach_duyet` → `ra_hop_dong` (or `huy`)
- **Status History**: Automatic tracking of all status changes with user attribution

#### Insurance Calculation Engine
- **Calculator** (`src/utils/insurance-calculator.ts`): Core premium calculation logic
- **Car Engine Mapping** (`src/utils/car-engine-mapping.ts`): Maps car models to engine types
- **TNDS Categories**: Different premium rates based on vehicle usage type

#### Location Services
- **Province/District/Ward**: Hierarchical location data for customer addresses
- **Admin Service** (`src/lib/adminService.ts`): Manages location data

### Database Configuration
- MongoDB connection via `src/lib/mongodb.ts`
- Connection caching for serverless environments
- Default connection: `mongodb://dev:dev123@localhost:27018/bhhv?authSource=admin`

### Path Aliases
- `@/*` maps to `src/*`
- `@db/*` maps to `db_json/*`

### Authentication System
- JWT-based authentication with refresh tokens
- User roles: regular users and admin
- Protected API routes with role-based access control
- Session management via HTTP-only cookies

### Testing Strategy
- Unit tests for utility functions and hooks
- Integration tests for API endpoints
- Component testing with React Testing Library
- Database mocking with mongodb-memory-server
- API mocking with MSW (Mock Service Worker)
- Test helpers in `src/__tests__/test-helpers/`

### Key Business Rules
1. **Contract Editing**: Only contracts in `nhap` status can be edited
2. **Status Transitions**: Strict workflow enforcement via `canChangeStatus()` method
3. **Electric Vehicle Support**: Special handling for hybrid/EV vehicles with battery insurance
4. **Premium Calculation**: Complex multi-factor calculation based on vehicle type, usage, and coverage
5. **File Uploads**: Base64 encoding for vehicle registration and inspection documents

### Development Notes
- Uses Vietnamese field names in database models to match business requirements
- Comprehensive form validation with Yup schemas
- Real-time insurance premium calculation as users input data
- File upload handling with preview capabilities
- Responsive design with Tailwind CSS
- Type-safe API routes with proper error handling

## Side Effect Prevention Rules

### Data Safety & State Management
- **Never modify production database directly** - Always use test database for development/testing
- **Always validate input data** before processing (especially currency parsing, date parsing, form data)
- **Use pure functions** where possible - avoid modifying global state or external dependencies
- **Immutable data patterns** - avoid mutating objects/arrays, use spread/map/filter instead

### Authentication & Security
- **Never log or expose sensitive data** (JWT tokens, passwords, user credentials)
- **Always validate authentication** before accessing protected resources
- **Use role-based access control** consistently (admin vs user permissions)
- **Environment variable safety** - never commit secrets, use proper env file patterns

### Database Operations  
- **Use transactions** for multi-step database operations
- **Always handle connection cleanup** - ensure MongoDB connections are properly closed
- **Validate data integrity** before saving (schema validation, business rules)
- **Use proper error handling** for database operations to prevent partial updates

### Form & Input Handling
- **Always sanitize user inputs** before processing
- **Use proper validation schemas** (Yup) consistently across all forms
- **Handle async validation properly** - await validation results before proceeding
- **Format currency/numbers consistently** using provided utility functions (`parseCurrency`, `formatCurrency`)

### React Components & Hooks
- **Use dependency arrays correctly** in useEffect/useMemo to prevent infinite re-renders
- **Clean up side effects** in useEffect return functions (timers, subscriptions)
- **Avoid mutating state directly** - use proper setState patterns
- **Handle loading/error states** properly in async operations

### File Operations & Uploads
- **Validate file types/sizes** before processing uploads
- **Handle base64 encoding/decoding safely** for image uploads
- **Clean up temporary files** after processing

### Testing Considerations
- **Mock external dependencies** properly (database, APIs, file system)
- **Use isolated test environments** - never run tests against production data
- **Clean up test data** after test completion
- **Use proper async/await patterns** in test code