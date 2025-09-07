# BHHV_V3 System Overview

## Architecture & Data Flow

### 1. Database Architecture (MongoDB + Mongoose)

#### **Collections chính (4 collections)**:
1. **Contract** - Hợp đồng bảo hiểm (collection chính)
2. **User** - Quản lý người dùng (admin/user roles)  
3. **Car** - Dữ liệu xe (brand, model, body_styles, years)
4. **Province/DistrictWard** - Dữ liệu địa lý

#### **Contract Schema** có **80+ fields** phức tạp:
- **Customer info**: chuXe, diaChi, buyerEmail, buyerPhone, buyerGender, buyerCitizenId
- **Location data**: selectedProvince, selectedDistrictWard, specificAddress
- **Vehicle info**: bienSo, nhanHieu, soLoai, soKhung, soMay, namSanXuat, soChoNgoi, trongTai, giaTriXe
- **Car selection**: carBrand, carModel, carBodyStyle, carYear
- **Insurance packages**: vatChatPackage (name, tyLePhi, phiVatChat, dkbs[])
- **Fee types**: includeTNDS, tndsCategory, phiTNDS, includeNNTX, phiNNTX
- **Totals**: tongPhi, mucKhauTru
- **Workflow**: status ('nhap' → 'cho_duyet' → 'khach_duyet' → 'ra_hop_dong' → 'huy')
- **Files**: cavetImage, dangkiemImage (base64)
- **Audit**: createdBy, statusHistory[]

### 2. API Structure (16 endpoints)

#### **Authentication** (3 endpoints):
- `POST /api/auth/login` - JWT + HTTP-only cookies
- `POST /api/auth/logout` - Clear session
- `GET /api/auth/me` - Get current user

#### **Contract Management** (4 endpoints):
- `GET/POST /api/contracts` - List/create contracts
- `GET/PUT /api/contracts/[id]` - Get/update specific contract
- `PUT /api/contracts/[id]/change-status` - Workflow transitions
- `POST /api/contracts/extract-info` - OCR from uploaded images

#### **Car Search** (4 endpoints):
- `GET /api/car-search` - Search cars by text
- `GET /api/car-search/brands` - List all brands
- `GET /api/car-search/models/[brand]` - Models by brand
- `GET /api/car-search/details/[brand]/[model]` - Full car details

#### **User Management** (3 endpoints):
- `GET/POST /api/users` - List/create users
- `GET/PUT /api/users/[id]` - Get/update user
- `PUT /api/users/change-password` - Change password

#### **Location Data** (2 endpoints):
- `GET /api/admin/provinces` - All provinces
- `GET /api/admin/districts-wards` - Districts/wards

### 3. Authentication Flow
- **Login**: Username/password → JWT token → HTTP-only cookie
- **Session**: 7 days expiry, secure in production
- **Authorization**: Role-based (admin/user) với different permissions
- **Middleware**: JWT verification for protected routes

## Business Logic & Pricing

### **Công thức tính giá PHỨC TẠP** - File `insurance-calculator.ts` (336 lines):

#### **Factors ảnh hưởng đến giá**:
- **13 loại hình kinh doanh** khác nhau
- **4 nhóm tuổi xe**: <3, 3-6, 6-10, >10 năm
- **4 mức giá trị xe** (cho xe gia đình): <500tr, 500-700tr, 700tr-1tỷ, >1tỷ
- **5 gói bảo hiểm**: Cơ bản → +AU001 → +AU006 → +AU002 → +AU009
- **TNDS rates**: 24 categories dựa trên số chỗ ngồi, trọng tải, kinh doanh
- **NNTX packages**: 6 gói từ 10tr-200tr đồng/người/vụ

#### **Dependencies phức tạp**:
```javascript
giaTriXe + namSanXuat + loaiHinhKinhDoanh → baseRates[]
soChoNgoi + trongTai + loaiHinhKinhDoanh → tndsCategory
selectedPackageIndex → customRates → finalFees
tongPhi = phiVatChat + phiTNDS + phiNNTX
```

#### **Edge Cases quan trọng**:
- Xe >10 năm không có AU009 package (null values)
- Xe gia đình <500M có minimum fee 5.5M
- TNDS categories cho xe tải dựa trên trọng tải
- Mức khấu trừ: 500K (không KD) vs 1M (KD)

## UI/UX Flow

### **Contract Creation Journey** (4-step wizard):

#### **Step 1: Upload Images**
- Upload cavet + đăng kiểm images
- OCR extraction với `/api/contracts/extract-info`
- Auto-populate form data

#### **Step 2: Buyer Information**
- 8 required fields: chuXe, email, phone, gender, citizenId, location, address
- Location hierarchy: Province → District/Ward → Specific address
- Real-time validation

#### **Step 3: Vehicle Information**
- 11+ vehicle fields + car selection
- Car search integration với car database
- Auto-suggest TNDS category
- Validation: năm sản xuất, số chỗ ngồi, giá trị xe

#### **Step 4: Package Selection**
- Display 5 insurance packages với real-time pricing
- Editable rates cho advanced users
- TNDS/NNTX toggles
- Final price calculation
- Submit contract

### **Progressive Disclosure**:
- Chỉ hiện step tiếp theo khi hoàn thành current step
- Completed steps show summary
- Smooth scrolling giữa các steps

### **Field Dependencies**:
- `loaiHinhKinhDoanh` ảnh hưởng đến TNDS categories
- `soChoNgoi + trongTai` determine TNDS pricing
- `namSanXuat + giaTriXe` affect insurance rates
- Car selection fields cascade: Brand → Model → BodyStyle → Year

## Validation Rules

### **Frontend Validation** (Yup schema):
```javascript
- Email: valid format
- Phone: 10 digits, start with 03-09
- CitizenId: exactly 12 digits  
- Date: dd/mm/yyyy format, not future, after manufacture year
- Price: > 0, currency parsing
- Year: 1980 - current year
- Seats: 1-64
- Conditional: trongTai required for xe tải
```

### **Backend Validation** (Mongoose schema):
```javascript
- Required fields với custom error messages
- Enum validation cho status, gender, loaiHinhKinhDoanh
- Min/max values cho numeric fields
- Unique constraints: contractNumber, username, email
- Auto-generated: contractNumber (BH + YYYYMMDD + random)
```

### **Workflow Status Validation**:
```javascript
nhap → cho_duyet → khach_duyet → ra_hop_dong
        ↓           ↓
       huy         huy
```
- Role-based permissions cho status changes
- StatusHistory tracking với timestamps

## Test Requirements

### **Hiện tại: KHÔNG có test framework**
- Không có jest, cypress, mocha trong package.json
- Không có test scripts hoặc test directories

### **Critical Features cần test kỹ**:

#### **1. Insurance Calculation Logic** (HIGH PRIORITY):
- Unit tests cho `calculateInsuranceRates()`
- Edge cases: xe cũ, minimum fees, null values
- Integration tests cho real-time calculation

#### **2. Workflow Transitions** (HIGH PRIORITY):
- Status change permissions by role
- StatusHistory logging
- Invalid transition prevention

#### **3. Form Validation** (MEDIUM PRIORITY):
- Frontend Yup validation
- Backend Mongoose validation
- Cross-field dependencies

#### **4. File Upload + OCR** (MEDIUM PRIORITY):
- Image upload success/failure
- OCR extraction accuracy
- Form auto-population

#### **5. API Authentication** (MEDIUM PRIORITY):
- JWT token validation
- Role-based access control
- Session management

### **Recommended Test Types**:

#### **Unit Tests**:
- Insurance calculation functions
- Form validation schemas
- Utility functions (currency parsing, date validation)

#### **Integration Tests**:
- API endpoint functionality
- Database operations
- Authentication flow

#### **E2E Tests**:
- Complete contract creation flow
- User login → create contract → submit
- Admin workflow management

### **Test Data Requirements**:
- Sample contracts cho different scenarios
- Car database với various brands/models
- User accounts (admin vs regular user)
- Mock OCR responses
- Edge case data (old cars, high values, special vehicle types)

## Deployment & Environment

### **Tech Stack**:
- **Framework**: Next.js 15 with TypeScript
- **Database**: MongoDB với Mongoose ODM
- **Authentication**: JWT với bcryptjs
- **Styling**: TailwindCSS
- **Validation**: Yup for forms
- **File Handling**: Base64 encoding for images

### **Environment Variables** (từ .env):
- Database connection strings
- JWT secrets
- API keys cho OCR service
- Environment-specific configs

### **Performance Considerations**:
- Database indexing cho search operations
- Image optimization và storage
- Real-time calculation optimization
- Mobile responsiveness

---

## Next Steps for Testing Implementation

1. **Setup test framework**: Jest + React Testing Library
2. **Write unit tests** cho insurance calculations
3. **Add integration tests** cho APIs
4. **Implement E2E testing** với Cypress
5. **Create test data fixtures**
6. **Add CI/CD pipeline** với automated testing