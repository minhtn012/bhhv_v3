# UI Improvement Plan - Contract New Page

## Tổng quan
Cải thiện UI của trang tạo báo giá mới (`/data/per/bhhv_v3/src/app/contracts/new/page.tsx`) để khớp với thiết kế tham khảo trong `index_2.html`.

## 🎯 Mục tiêu chính
- Hiển thị progressive steps (không ẩn các step đã hoàn thành)
- Cho phép chỉnh sửa tỷ lệ phí Bảo hiểm Vật chất
- Cải thiện tính năng bổ sung TNDS/NNTX
- Tự động cập nhật khi thay đổi số chỗ ngồi
- Enhanced UI/UX theo reference design

## 📋 Tính năng còn thiếu

### 1. ✏️ Chỉnh sửa tỷ lệ phí Bảo hiểm Vật chất
**Hiện tại:** Chỉ hiển thị tỷ lệ cố định
**Cần:** 
- [ ] Input field cho chỉnh sửa tỷ lệ phí (%)
- [ ] Real-time calculation khi thay đổi
- [ ] Hiển thị chênh lệch so với tỷ lệ gốc
- [ ] Custom radio button styling
- [ ] Validation cho tỷ lệ phí hợp lệ

### 2. 🔄 Tính năng bổ sung TNDS/NNTX động
**Hiện tại:** Static dropdown selection
**Cần:**
- [ ] Auto-suggest TNDS category dựa trên thông tin xe
- [ ] Dropdown với tất cả categories từ `tndsCategories`
- [ ] Auto-update khi thay đổi loại hình kinh doanh
- [ ] Toggle on/off cho từng loại bảo hiểm
- [ ] Real-time fee calculation

### 3. 🪜 Progressive Step Display
**Hiện tại:** Chỉ hiển thị step hiện tại
**Cần:**
- [ ] Hiển thị tất cả steps đã hoàn thành
- [ ] Edit mode cho completed steps
- [ ] Collapse/expand functionality
- [ ] Visual states: completed ✅ / current 🔄 / upcoming ⏳
- [ ] Step summary view khi collapsed

### 4. 🎛️ Dynamic Updates
**Hiện tại:** Manual recalculation
**Cần:**
- [ ] Auto-update TNDS khi thay đổi số chỗ ngồi
- [ ] Auto-calculate NNTX fee based on số chỗ ngồi
- [ ] Real-time total calculation
- [ ] Form validation improvements

## 🗂️ Files cần tạo/sửa đổi

### 📝 Tạo mới

#### Components
```
/src/components/contracts/
├── EditablePackageCard.tsx        # Package card với editable rate
├── StepWrapper.tsx                # Wrapper cho progressive steps  
├── CompletedStepSummary.tsx       # Summary view cho completed steps
├── DynamicTNDSSelector.tsx        # Enhanced TNDS selection
└── CustomRateInput.tsx            # Input component cho custom rates
```

#### Utils
```
/src/utils/
└── step-manager.ts                # Logic cho progressive steps
```

### ✏️ Cập nhật

#### Main Page
- `/src/app/contracts/new/page.tsx` - Progressive step logic, edit modes

#### Components  
- `/src/components/contracts/PackageCard.tsx` - Add editable rates
- `/src/components/contracts/VehicleInfoForm.tsx` - Dynamic updates
- `/src/components/contracts/PackageSelectionStep.tsx` - Enhanced TNDS/NNTX
- `/src/components/contracts/StepIndicator.tsx` - Visual step states

#### Utils & Hooks
- `/src/utils/insurance-calculator.ts` - Custom rate calculations
- `/src/hooks/useInsuranceCalculation.ts` - Enhanced calculation logic

## 🛣️ Implementation Roadmap

### Phase 1: Core Features
1. **Editable Package Rates** 
   - Create `EditablePackageCard.tsx`
   - Update `PackageCard.tsx` with rate input
   - Implement real-time calculation logic

2. **Dynamic TNDS/NNTX**
   - Create `DynamicTNDSSelector.tsx`
   - Auto-suggestion logic
   - Integration với số chỗ ngồi updates

### Phase 2: Progressive Steps
3. **Step Management**
   - Create `StepWrapper.tsx` và `CompletedStepSummary.tsx`  
   - Update main page logic
   - Implement edit modes

4. **Visual Enhancements**
   - Update `StepIndicator.tsx`
   - Improve styling theo reference design
   - Add animations/transitions

### Phase 3: Polish & Testing
5. **Integration & Testing**
   - End-to-end testing
   - Performance optimization
   - Bug fixes và polish

## 🎨 UI/UX Improvements

### Visual Design
- [ ] Match color scheme từ `index_2.html`
- [ ] Improve spacing và layout
- [ ] Better responsive design
- [ ] Enhanced visual feedback
- [ ] Loading states và animations

### User Experience  
- [ ] Clear visual hierarchy
- [ ] Intuitive edit workflows
- [ ] Error handling và validation
- [ ] Accessibility improvements
- [ ] Mobile-friendly interactions

## 📊 Success Metrics
- [ ] All steps remain visible during progression
- [ ] Real-time calculation works correctly
- [ ] Edit functionality on completed steps
- [ ] Auto-updates based on form changes
- [ ] UI matches reference design
- [ ] No performance regressions
- [ ] All existing functionality preserved

## 🔄 Testing Checklist
- [ ] Upload images → auto-populate form
- [ ] Edit rates → recalculate fees
- [ ] Change số chỗ ngồi → update TNDS/NNTX
- [ ] Toggle insurance options → update totals
- [ ] Edit completed steps → maintain data integrity
- [ ] Mobile responsive testing
- [ ] Cross-browser compatibility

---

*Last updated: [Current Date]*
*Status: Planning Phase*