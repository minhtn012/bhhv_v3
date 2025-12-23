# BHHV V3 - Project Overview & Product Development Requirements

**Project Name:** BHHV V3 (Bảo Hiểm Hợp Thực Vụ)
**Type:** Vehicle Insurance Contract Management System
**Version:** 1.0
**Status:** Active Development
**Last Updated:** 2025-12-22

---

## Executive Summary

BHHV V3 is a web-based vehicle insurance contract management platform designed for insurance agents and administrators to streamline the creation, validation, and submission of vehicle insurance policies. The system integrates with the BHV (Bảo Hiểm Việt) insurance platform to automate policy generation and provides comprehensive analytics and management tools.

---

## Project Vision & Goals

### Vision
Provide a seamless, efficient system for managing vehicle insurance contracts with real-time premium calculation, automated document generation, and direct integration with the BHV insurance platform.

### Primary Goals
1. **Reduce contract processing time**: From days to hours through automation
2. **Minimize data entry errors**: Via comprehensive validation and structure guidance
3. **Enable real-time premium calculation**: Instant feedback as agents configure coverage
4. **Automate policy document generation**: Word documents ready for signature
5. **Integrate BHV system**: Direct submission to insurance platform without manual handoff
6. **Provide analytics**: Dashboard insights for agents and administrators

---

## Target Users

### Primary Users
1. **Insurance Agents** (user role)
   - Create and manage insurance contracts
   - Configure vehicle coverage and premiums
   - Submit completed contracts to BHV system
   - View personal contract dashboard and stats
   - Manage BHV login credentials securely

2. **System Administrators** (admin role)
   - User account management (create, edit, disable accounts)
   - View comprehensive system logs
   - Monitor BHV integration health
   - Manage location data (provinces, districts, wards)
   - Access system analytics and reporting
   - View API request logs for debugging

### Secondary Users
- Management: Dashboard analytics, reports
- Support Team: System logs for troubleshooting

---

## Core Features

### 1. Contract Management

#### Contract Creation Wizard
- **Multi-step form** guiding agents through contract data entry:
  1. Customer information (name, address, contact)
  2. Vehicle information (registration, specifications)
  3. Insurance package selection (coverage type and level)
  4. Premium review and customization
  5. Document attachment (caveat, registration)
  6. Final confirmation and submission

#### Real-Time Premium Calculation
- Instant calculation as agents select vehicle and coverage options
- Display of:
  - Base premium (phí vật chất)
  - Third-party liability (phí TNDS - bắt buộc)
  - Passenger insurance (phí NNTX - optional)
  - Battery/electric vehicle surcharges
  - Renewal discounts (if applicable)
  - **Total premium amount**
- Allow custom rate adjustments for special cases

#### Contract Status Workflow
**States:**
- `nhap` (Entering): Initial data entry, editable
- `cho_duyet` (Pending Review): Awaiting approval, read-only
- `khach_duyet` (Customer Review): Customer validation pending, read-only
- `ra_hop_dong` (Policy Generated): Final policy created, immutable
- `huy` (Cancelled): Terminal state

**Status Transitions:**
```
nhap → cho_duyet → khach_duyet → ra_hop_dong
 ↓                                    ↑
 └──────────────→ huy ←────────────────┘
```

#### Contract Operations
- **Create**: Guided wizard with validation
- **View**: Full details with calculation breakdown
- **Edit**: Only when in `nhap` state
- **Change Status**: Workflow progression with audit trail
- **Submit to BHV**: Validates completeness, submits, receives BHV contract number
- **Export to Word**: Generates DOC file for signing
- **Check BHV Status**: Query policy status from BHV system

### 2. Vehicle Search & Information

#### Vehicle Database Integration
- Search available vehicle brands
- Filter models by brand and year
- Auto-populate vehicle specifications:
  - Engine type and capacity (cc)
  - Body style
  - Seats, weight, year
  - Engine mapping for insurance category

#### Vehicle Types Supported
- Sedans
- SUVs/Crossovers
- Trucks/Commercial vehicles
- Buses/Vans
- Electric/Hybrid vehicles (with battery insurance)

### 3. Insurance Premium Calculation Engine

#### Calculation Factors
1. **Vehicle Base Rate**: By brand, model, engine capacity
2. **Coverage Level**: Package selection (phí vật chất)
3. **Business Usage Type (TNDS Category)**:
   - Personal use
   - Commercial/Taxi
   - Rental vehicles
   - Other business uses
4. **Age/Mileage Adjustments**: Vehicle age factor
5. **Renewal Discounts**: Based on prior claims history
6. **Special Surcharges**:
   - Battery insurance (electric/hybrid)
   - Passenger insurance premium

#### Output
- Itemized premium breakdown
- Base amounts before discounts
- Final amounts after adjustments
- Clear display of deductible (mức khấu trừ)

### 4. BHV Integration

#### Authentication
- Secure storage of agent BHV credentials (encrypted)
- Connection validation before operations
- Status tracking (connected/disconnected)

#### Premium Quotation
- Submit vehicle and coverage info to BHV
- Receive HTML response with calculated premium
- Parse and display premium details to agent
- Allow approval or adjustment

#### Contract Confirmation
- Submit complete contract data to BHV
- Receive official BHV contract number
- Store reference for tracking
- Log all requests/responses for audit

#### Contract Retrieval
- Query contract details from BHV by contract number
- Verify policy status in system

#### Logging
- Every BHV API call logged with:
  - Request data (sanitized, credentials redacted)
  - Response status and body
  - Timestamp and duration
  - Error details if failed

### 5. User & Access Management

#### User Roles

**Admin**
- Permission: All system operations
- Access: All users, logs, system configuration
- Dashboard: System-wide analytics

**User (Agent)**
- Permission: Own contract management
- Access: Own contracts, BHV credential management
- Dashboard: Personal statistics

#### Account Management
- Create user accounts (admin only)
- Disable/enable accounts
- Password reset and change
- BHV credential management (encrypted storage)
- Session management with refresh tokens

#### Authentication & Authorization
- JWT-based authentication
- Stateless design with refresh token rotation
- Session persistence via HTTP-only cookies
- Role-based endpoint protection

### 6. Analytics & Reporting

#### User Dashboard
- Personal contract statistics:
  - Total contracts created
  - Contracts by status
  - Total premium value
  - Recent contracts (quick access)

#### Admin Dashboard
- System-wide overview:
  - Total contracts by status
  - User activity metrics
  - Recent contracts and actions
  - System health indicators
  - Integration status (BHV)

### 7. Logging & Audit Trail

#### System Logs
- Application events (info, debug, warn, error)
- User actions (contract creation, status changes, etc.)
- Authentication events (login, logout, token refresh)
- Filtering by level, action, date range
- Auto-cleanup of old logs (configurable TTL)

#### BHV Request Logs
- All API interactions with BHV system
- Request/response bodies (detailed debugging)
- Success/failure indicators
- Timing information
- Error details

#### Audit Trail
- Contract status change history with:
  - Who made change (user ID)
  - When change occurred (timestamp)
  - New status value
  - For BHV submissions: confirmation number received

### 8. Document Generation

#### Word Contract Export
- Generate DOC files from contract data
- Pre-formatted templates matching BHV standards
- Includes all contract details and calculations
- Ready for agent/customer signature
- Downloadable directly from application

### 9. Location Management

#### Vietnamese Geographic Hierarchy
- Provinces (Tỉnh/Thành phố)
- Districts (Huyện/Quận)
- Wards (Xã/Phường)
- Auto-complete for customer addresses
- Admin interface for location data management

---

## Business Rules

### Contract Management
1. **Only contracts in `nhap` status can be edited** - Once submitted for review, locked
2. **Workflow states are strictly enforced** - No skipping steps or backwards transitions
3. **BHV submission requires complete contract** - All required fields must be present
4. **Vehicle registration is mandatory** - Cannot create contract without vehicle info
5. **At least one coverage must be selected** - Property damage or third-party liability

### Premium Calculation
1. **Third-party liability (TNDS) is mandatory** - Always included in calculation
2. **Premium customization allowed** - Agent can override calculated rates
3. **Rate adjustments must be documented** - Tracked in system for audit
4. **Renewal discounts require valid history** - Only for existing policies

### Insurance Coverage Types
1. **Phí Vật Chất (Property Damage)**: Vehicle damage coverage
   - Mandatory
   - Rate adjustable by agent
   - Includes deductible (mức khấu trừ)

2. **Phí TNDS (Third-Party Liability)**: Required by law
   - Mandatory
   - Multiple categories by business use
   - Non-adjustable rates (standard)

3. **Phí NNTX (Passenger Insurance)**: Optional
   - Coverage per passenger
   - Includes all seats

4. **Phí Pin (Battery Insurance)**: Electric/Hybrid only
   - Special surcharge for battery damage
   - Only for EV/Hybrid vehicles

### User Management
1. **Passwords must meet complexity requirements** - Uppercase, lowercase, number, special char
2. **BHV credentials are encrypted** - Never logged or exposed
3. **Admins cannot be deleted** - Ensure system accessibility
4. **User accounts must have unique email/username** - Prevent duplicates

### Data Integrity
1. **Referential integrity**: Users, contracts, location data
2. **Immutable audit trail**: Status changes cannot be modified
3. **Atomic operations**: All-or-nothing for critical operations (contract submission)

---

## Non-Functional Requirements

### Security
- **Data Encryption**: Sensitive fields (passwords, BHV credentials) encrypted at rest
- **Transport Security**: HTTPS only (TLS 1.2+)
- **Authentication**: JWT with short-lived access tokens
- **Authorization**: Role-based access control (RBAC) enforced
- **Input Validation**: All user inputs validated and sanitized
- **Rate Limiting**: API endpoints protected from abuse
- **Audit Logging**: All sensitive operations logged with user attribution
- **Compliance**: Vietnamese business requirements (BHHV regulations)

### Performance
- **Page Load Time**: < 2 seconds (90th percentile)
- **API Response Time**: < 500ms (90th percentile) for standard operations
- **Premium Calculation**: Real-time (< 100ms)
- **Contract Search**: < 1 second for typical queries
- **Database Queries**: Indexed for performance
- **Concurrent Users**: Support 100+ simultaneous users
- **Uptime SLA**: 99.5% (business hours critical, maintenance windows allowed)

### Scalability
- **Serverless-ready**: MongoDB connection caching for AWS Lambda
- **Horizontal Scaling**: Stateless design enables load balancing
- **Database Scaling**: MongoDB sharding support planned
- **Log Management**: Automated cleanup prevents unbounded growth
- **File Storage**: Base64 encoding for documents (cloud storage integration planned)

### Reliability
- **Error Handling**: Comprehensive error handling with user-friendly messages
- **Validation**: Multi-layer validation (client, server, database)
- **Logging**: Detailed logs for troubleshooting
- **Testing**: 80% code coverage minimum, critical paths 90%+
- **Backup**: Database backups per MongoDB security guidelines

### Usability
- **Responsive Design**: Works on desktop and tablet
- **Accessibility**: WCAG 2.1 AA compliance (roadmap)
- **Localization**: Vietnamese language throughout
- **Help & Documentation**: In-app help and user guides
- **Error Messages**: Clear, actionable error feedback

### Maintainability
- **Code Quality**: ESLint enforced, TypeScript strict mode
- **Documentation**: Comprehensive API and architecture docs
- **Testing**: Automated test suite with CI/CD integration
- **Code Organization**: Clear structure with separation of concerns
- **Technical Debt**: Tracked and prioritized for regular resolution

---

## Integration Points

### External Systems

#### BHV (Bảo Hiểm Việt) Platform
- **Purpose**: Insurance policy management and generation
- **Integration Type**: REST API over HTTPS
- **Operations**:
  - Premium quotation (vehicle → premium)
  - Policy confirmation (contract → BHV contract number)
  - Policy status retrieval
- **Authentication**: Agent credentials (username/password)
- **Error Handling**: Comprehensive logging of failures
- **Data Format**: Contract data mapped to BHV-specific format

#### Gemini API (Planned)
- **Purpose**: OCR extraction from documents
- **Operations**:
  - Vehicle registration OCR (extract: registration number, model, owner)
  - Inspection certificate OCR (extract: inspection date, status)
- **Configuration**: Via `GEMINI_API_KEY` environment variable
- **Status**: Configuration infrastructure ready, implementation pending

### Internal Integrations

#### MongoDB Database
- **Primary storage**: Contracts, users, logs, location data
- **Connection**: Mongoose ODM
- **Optimization**: Connection caching for serverless

#### JWT Authentication
- **Token Generation**: Access token + refresh token pair
- **Validation**: Server-side verification on every request
- **Storage**: Refresh token in database, access token in memory

---

## Technical Constraints & Decisions

### Technology Stack Rationale
- **Next.js + React 19**: Modern, performant, built-in API routes
- **MongoDB**: Flexible schema for variable insurance data
- **TypeScript**: Type safety for complex business logic
- **Tailwind CSS**: Rapid UI development, responsive design
- **JWT**: Stateless authentication suitable for distributed systems

### Architectural Decisions
1. **API-First Design**: Frontend consumes REST API (enables future mobile app)
2. **Separation of Concerns**: Data layer (models), business logic (lib), presentation (components)
3. **Serverless-Ready**: Stateless operations, connection caching
4. **Event Logging**: Comprehensive audit trail for compliance

### File Size Constraint
- **Max 200 lines per file**: Enforces modularity and readability
- **Exception**: Auto-generated files, large static data

---

## Success Metrics & KPIs

### Adoption Metrics
- Number of active agents
- Contracts created per day/month
- Platform uptime percentage

### Efficiency Metrics
- Average time to create contract (target: < 15 min)
- Percentage of contracts submitted to BHV successfully
- Manual data re-entry incidents (target: < 2%)

### Quality Metrics
- Bug severity distribution (0 critical at release)
- Test coverage (minimum 80%, critical code 90%+)
- Validation error rate (false positives < 5%)

### Business Metrics
- Premium accuracy (< 1% variance from manual calculation)
- BHV integration success rate (> 98%)
- Customer satisfaction (target: > 4.5/5)

---

## Release & Deployment

### Version Strategy
- **Semantic Versioning**: MAJOR.MINOR.PATCH
- **Current Version**: 1.0.0 (initial release)

### Deployment Strategy
- **Environments**: Development, Staging, Production
- **Deployment Tool**: Vercel (Next.js native support)
- **CI/CD**: GitHub Actions (tests, build, deploy)
- **Rollback**: Previous version maintained for quick rollback

### Deployment Checklist
- [ ] All tests passing (npm run test:ci)
- [ ] Build successful (npm run build)
- [ ] Environment variables configured
- [ ] Database migrations completed
- [ ] Backup created before deployment
- [ ] Monitoring alerts configured
- [ ] Documentation updated

---

## Roadmap & Future Features

### Phase 0 (Completed - 2025-12-23)
**Provider Framework Extraction**
- Multi-provider architecture (pluggable)
- Provider registry and discovery system
- Base API client framework
- Credential manager with AES-256-GCM encryption
- Dynamic form system with field registry
- Location and date range pickers
- BHV online provider implementation
- Comprehensive documentation and guides

### Phase 1 (Planned)
- Additional insurance providers (Manulife, Bao Viet, etc.)
- Product diversification (health, travel)
- Advanced provider management UI
- Form schema versioning
- Multi-language form support

### Phase 2 (Planned)
- Mobile app (React Native) using same provider framework
- Document OCR via Gemini API
- Customer portal (self-service policy review)
- Multi-language support (English)
- Advanced analytics and reporting

### Phase 3 (Planned)
- Automated document workflow (digital signature)
- Claims management module
- Policy renewal automation
- AI-powered premium recommendations
- Provider fallback chains

---

## Risk & Mitigation

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|-----------|
| BHV API outage | Can't submit contracts | Medium | Implement retry logic, queue failed submissions |
| Data loss | Critical system failure | Low | Regular MongoDB backups, replication |
| Security breach | Customer data exposure | Low | Encryption, audit logging, security monitoring |
| Performance degradation | Poor user experience | Medium | Database indexing, caching, load testing |
| Integration failure | Manual process required | Medium | Comprehensive logging, fallback procedures |

---

## Dependencies & Prerequisites

### Infrastructure
- MongoDB server (local, managed, or cloud)
- Node.js 18+ runtime
- HTTPS certificate for production
- Environment for Node.js execution (Vercel, AWS, etc.)

### External Services
- BHV API endpoint (for insurance operations)
- Gemini API key (for OCR, optional)
- Email service (for notifications, optional)

### Data
- Vietnamese location database (provinces, districts, wards)
- Vehicle database (brands, models, specifications)
- Insurance rate tables (for premium calculation)

---

## Assumptions

1. **BHV API stability**: Assumes reasonable uptime (> 95%)
2. **Data validity**: Assumes agents enter valid vehicle registration numbers
3. **User expertise**: Assumes agents have basic insurance knowledge
4. **Database availability**: Assumes reliable MongoDB connection
5. **Network connectivity**: Assumes agents have stable internet connection

---

## Glossary

- **BHHV**: Bảo Hiểm Hợp Thực Vụ (Vehicle Insurance Contract Management)
- **BHV**: Bảo Hiểm Việt (insurance company)
- **TNDS**: Third-party liability insurance (required)
- **NNTX**: Passenger insurance (optional)
- **Phí Vật Chất**: Property/vehicle damage coverage fee
- **Phí TNDS**: Third-party liability fee
- **Phí NNTX**: Passenger insurance fee
- **Phí Pin**: Battery insurance surcharge (EV/Hybrid)
- **Mức Khấu Trừ**: Deductible amount
- **Tái Tục**: Renewal discount based on claims history
- **Hợp Động**: Contract/Policy document

---

**Document Version**: 1.0
**Last Updated**: 2025-12-22
**Author**: Documentation Team
**Approval Status**: Active Development
