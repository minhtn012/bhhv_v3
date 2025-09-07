# BHHV_V3 Automation Testing Plan

## 🎯 Overview
Comprehensive testing strategy cho CMS quản lý hợp đồng bảo hiểm với 4 phases. Mỗi phase phải pass 100% tests trước khi chuyển sang phase tiếp theo.

## 📋 Test Requirements Summary
- **Critical Features**: Insurance calculation logic, workflow transitions, form validation
- **Scale**: 10 concurrent users, <10MB file uploads
- **Tech Stack**: Next.js 15, MongoDB, TypeScript, 80+ contract fields
- **Business Logic**: 336 lines insurance calculator với complex pricing rules

---

## 🚀 Phase 1: Foundation Setup & Unit Tests
**Duration**: 2-3 days  
**Goal**: Setup testing infrastructure + test core business logic

### 📝 Todo Phase 1:
- [ ] **1.1** Install testing dependencies
  ```bash
  npm install --save-dev jest @jest/globals @types/jest
  npm install --save-dev @testing-library/react @testing-library/jest-dom
  npm install --save-dev jest-environment-jsdom ts-jest
  ```

- [ ] **1.2** Configure Jest với TypeScript
  - Tạo `jest.config.js`
  - Setup `jest.setup.js` với testing-library matchers
  - Add test scripts vào `package.json`

- [ ] **1.3** Setup MongoDB Memory Server cho unit tests
  ```bash
  npm install --save-dev mongodb-memory-server
  ```

- [ ] **1.4** Configure MSW (Mock Service Worker)
  ```bash
  npm install --save-dev msw
  ```

- [ ] **1.5** Write unit tests cho `src/utils/insurance-calculator.ts`
  - Test `physicalDamageRates` calculations
  - Test `tndsCategories` lookups
  - Test age group calculations (xe <3, 3-6, 6-10, >10 năm)
  - Test price tier calculations (dưới 500M, 500-700M, 700M-1tỷ, >1tỷ)
  - Test business type impacts (13 loại hình kinh doanh)
  - **Edge Cases**:
    - Xe >10 năm không có AU009 package (null values)
    - Minimum fee 5.5M cho xe gia đình <500M
    - TNDS categories cho xe tải dựa trên trọng tải
    - Mức khấu trừ: 500K vs 1M

- [ ] **1.6** Write unit tests cho form validation schemas
  - Email format validation
  - Phone number validation (10 digits, start 03-09)
  - CitizenId validation (12 digits)
  - Date format validation (dd/mm/yyyy)
  - Price validation (>0, currency parsing)
  - Conditional validations (trọng tải required for xe tải)

- [ ] **1.7** Write unit tests cho utility functions
  - Currency formatting/parsing
  - Date utilities
  - String validations
  - Contract number generation

### ✅ Test Checkpoint Phase 1:
- [ ] **Tất cả unit tests pass** (target: 90%+ coverage)
- [ ] **Coverage report** cho insurance calculator
- [ ] **Test documentation** với examples

---

## 🔗 Phase 2: API Integration Tests
**Duration**: 2-3 days  
**Goal**: Test tất cả API endpoints và database operations

### 📝 Todo Phase 2:
- [ ] **2.1** Setup Test Database
  ```bash
  npm install --save-dev @testcontainers/mongodb
  ```
  - Configure separate test MongoDB instance
  - Setup database seeding với sample data
  - Create test data fixtures

- [ ] **2.2** Test Authentication APIs
  - `POST /api/auth/login` - Valid/invalid credentials
  - `POST /api/auth/logout` - Session cleanup
  - `GET /api/auth/me` - JWT token validation
  - Role-based authorization (admin vs user)

- [ ] **2.3** Test Contract Management APIs
  - `GET /api/contracts` - List với pagination, filtering
  - `POST /api/contracts` - Create với full validation
  - `GET /api/contracts/[id]` - Get specific contract
  - `PUT /api/contracts/[id]` - Update contract data
  - `PUT /api/contracts/[id]/change-status` - Workflow transitions
    - Test valid transitions: nhap → cho_duyet → khach_duyet → ra_hop_dong
    - Test invalid transitions (skip steps, unauthorized)
    - Test status rollback prevention

- [ ] **2.4** Test Car Search APIs
  - `GET /api/car-search` - Search functionality
  - `GET /api/car-search/brands` - List brands
  - `GET /api/car-search/models/[brand]` - Models by brand
  - `GET /api/car-search/details/[brand]/[model]` - Car details
  - Test cascading selection logic

- [ ] **2.5** Test User Management APIs
  - `GET /api/users` - List users (admin only)
  - `POST /api/users` - Create user (admin only)
  - `GET /api/users/[id]` - Get user details
  - `PUT /api/users/[id]` - Update user
  - `PUT /api/users/change-password` - Password change

- [ ] **2.6** Test Location APIs
  - `GET /api/admin/provinces` - All provinces
  - `GET /api/admin/districts-wards` - Districts/wards hierarchy

- [ ] **2.7** Test File Upload & OCR
  - `POST /api/contracts/extract-info` - OCR processing
  - Test file size limits (<10MB)
  - Test invalid file formats
  - Test OCR response parsing
  - Mock Google OCR service responses

### ✅ Test Checkpoint Phase 2:
- [ ] **Tất cả integration tests pass** (target: 85%+ coverage)
- [ ] **Database operations** work correctly
- [ ] **API authentication** và authorization hoạt động
- [ ] **Error handling** cho invalid requests

---

## 🎨 Phase 3: React Component & Form Tests
**Duration**: 3-4 days  
**Goal**: Test UI components và form interactions

### 📝 Todo Phase 3:
- [ ] **3.1** Test Multi-step Wizard Navigation
  - Step progression logic
  - Step completion validation
  - Navigation between completed steps
  - Progress indicator updates

- [ ] **3.2** Test Step 1: File Upload Component
  - Image upload functionality
  - File size validation
  - Preview display
  - OCR integration
  - Auto-population after OCR

- [ ] **3.3** Test Step 2: Buyer Information Form
  - All 8 required field validations
  - Location hierarchy (Province → District/Ward)
  - Real-time validation feedback
  - Form state management

- [ ] **3.4** Test Step 3: Vehicle Information Form
  - 11+ vehicle field validations
  - Car selection cascading dropdowns
  - TNDS category auto-suggestion
  - Conditional field display (trọng tải for xe tải)

- [ ] **3.5** Test Step 4: Package Selection
  - Display 5 insurance packages
  - Real-time price calculations
  - Editable rates (admin users)
  - TNDS/NNTX toggles
  - Final price summation

- [ ] **3.6** Test Form Validation Integration
  - Yup schema validations
  - Cross-field dependencies
  - Error message display
  - Form submission prevention on errors

- [ ] **3.7** Test Hooks
  - `useInsuranceCalculation` - Price calculation logic
  - `useCarSelection` - Car search và selection
  - `useBuyerLocation` - Location hierarchy
  - `useFormValidation` - Validation logic
  - `useFileUpload` - File handling

### ✅ Test Checkpoint Phase 3:
- [ ] **Tất cả component tests pass**
- [ ] **Form validation** hoạt động correctly
- [ ] **Real-time updates** work properly
- [ ] **User interactions** tested thoroughly

---

## 🎭 Phase 4: E2E Tests với Playwright
**Duration**: 2-3 days  
**Goal**: Test complete user journeys

### 📝 Todo Phase 4:
- [ ] **4.1** Install & Configure Playwright
  ```bash
  npm install --save-dev @playwright/test
  npx playwright install
  ```
  - Setup Playwright config
  - Configure test browsers
  - Setup test data seeding

- [ ] **4.2** E2E Test: Complete Contract Creation Flow
  - User login → Dashboard
  - Create new contract → Step 1-4
  - Upload images → OCR extraction
  - Fill all required fields
  - Select insurance package
  - Submit contract
  - Verify contract created

- [ ] **4.3** E2E Test: Admin Workflow Management
  - Admin login → Contract list
  - Change contract status: nhap → cho_duyet
  - Verify status history logging
  - Customer receives notification
  - Final approval → ra_hop_dong

- [ ] **4.4** E2E Test: Authentication & Authorization
  - Login với valid/invalid credentials
  - Session timeout handling
  - Role-based access (admin vs user)
  - Unauthorized access prevention

- [ ] **4.5** E2E Test: Error Scenarios
  - Network failures
  - File upload errors
  - Form validation errors
  - API timeout handling
  - Database connection issues

- [ ] **4.6** E2E Test: Complex Scenarios
  - Multiple tabs/windows
  - Concurrent user actions
  - Browser refresh handling
  - Mobile responsive testing

- [ ] **4.7** Setup CI/CD Integration
  - GitHub Actions workflow
  - Automated test runs
  - Test reporting
  - Failure notifications

### ✅ Final Test Checkpoint Phase 4:
- [ ] **Tất cả E2E tests pass**
- [ ] **Critical user journeys** work end-to-end
- [ ] **Error handling** robust
- [ ] **CI/CD pipeline** operational

---

## 📊 Success Metrics

### Coverage Targets:
- **Unit Tests**: 90%+ coverage cho business logic
- **Integration Tests**: 85%+ coverage cho API endpoints
- **Component Tests**: 80%+ coverage cho React components
- **E2E Tests**: 100% coverage cho critical user flows

### Quality Gates:
- **Zero failing tests** trước khi proceed to next phase
- **All edge cases** covered và documented
- **Performance benchmarks** met (<2s response times)
- **Security tests** pass (authentication, authorization)

### Deliverables:
- [ ] **Test suite** với comprehensive coverage
- [ ] **Test documentation** với examples
- [ ] **CI/CD pipeline** với automated testing
- [ ] **Test data fixtures** cho reproducible tests
- [ ] **Performance benchmarks** established
- [ ] **Maintenance guide** cho future testing

---

## 🔧 Tools & Dependencies

### Core Testing:
- **Jest**: Unit testing framework
- **React Testing Library**: Component testing
- **Playwright**: E2E testing
- **MSW**: API mocking
- **MongoDB Memory Server**: Database testing

### Utilities:
- **@testcontainers/mongodb**: Integration testing
- **jest-environment-jsdom**: Browser simulation
- **@types/jest**: TypeScript support
- **supertest**: API testing (optional)

### CI/CD:
- **GitHub Actions**: Automated testing
- **Codecov**: Coverage reporting (optional)
- **Test reporting**: HTML reports

---

## 🚦 Phase Execution Rules

1. **Sequential Execution**: Phases phải được complete theo thứ tự
2. **Quality Gate**: Mỗi phase phải achieve target coverage
3. **Documentation**: Mỗi test phải có clear documentation
4. **Review Process**: Code review required trước khi proceed
5. **Rollback Plan**: Nếu phase fails, rollback và fix issues

**⚠️ CRITICAL**: Không được skip phases hoặc lower standards. Quality là top priority.