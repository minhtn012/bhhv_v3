# Contract Creation Process Improvement Plan

## Business Context

### Current Workflow
1. **User Role (Internal Staff):**
   - Uploads 2 documents (vehicle registration + inspection certificate)
   - System extracts information automatically
   - User inputs/corrects data and selects insurance packages
   - Contract saved with status `'nhap'` (draft)
   - **Background BHV price check runs automatically**

2. **Why BHV Check During Creation:**
   - Internal pricing is designed to be **lower than BHV online price**
   - Background check fetches BHV's official price for comparison
   - Validates that the discount being offered is real
   - Saves both prices in contract:
     - `tongPhi` = internal discounted price
     - `bhvPremiums` = BHV's official online price

3. **Admin Role:**
   - Reviews user-created contracts
   - Approves and submits to BHV online system
   - Updates status: `'nhap'` → `'cho_duyet'` → `'khach_duyet'` → `'ra_hop_dong'`

## Problems Identified

### 1. **Duplicate BHV Check Calls**
**Location:**
- `src/app/api/contracts/route.ts:124` - Backend triggers check
- `src/app/contracts/new/page.tsx:528-535` - Frontend also triggers check

**Issue:** Both backend and frontend call BHV API independently for the same contract

**Impact:**
- Unnecessary API calls to external BHV system
- Potential race conditions
- Confusion in codebase

### 2. **Unnecessary Database Re-fetch**
**Location:** `src/app/api/contracts/route.ts:178`

**Current Flow:**
```javascript
await contract.save();  // Line 121 - Save to DB
checkBhvPremiumsInBackground(contract._id.toString(), ...);  // Line 124 - Pass only ID

// Inside background function:
const contract = await Contract.findById(contractId).lean();  // Line 178 - Re-fetch from DB
```

**Issue:** Contract is saved, then immediately re-fetched from database in background function

**Impact:**
- Extra database read operation
- Unnecessary latency
- Memory inefficiency

### 3. **Field Name Mismatch Bug**
**Location:** `src/app/api/contracts/route.ts:293`

**Code:**
```javascript
totalPremium: {  // Line 293 - Wrong field name
  beforeTax: 0,
  afterTax: 0
}
```

**Schema Structure:**
```javascript
total: {  // Correct field name
  beforeTax: number,
  afterTax: number
}
```

**Issue:** Field name doesn't match the schema structure defined in Contract model

**Impact:** Error data not saved correctly when BHV check fails

### 4. **Multiple Database Updates**
**Current Flow:**
1. Line 121: Initial contract save (without `bhvPremiums`)
2. Line 245-266: Update with `bhvPremiums` after successful BHV check
3. Line 277-304: Update with error if BHV check fails

**Issue:** 2-3 database write operations for a single contract creation

**Note:** This is acceptable for now since BHV check must run in background (non-blocking). Consider job queue system for future improvement.

## Proposed Solutions

### Solution 1: Remove Duplicate Frontend BHV Check ✅

**File:** `src/app/contracts/new/page.tsx`

**Lines to Remove:** 528-535
```javascript
// Background BHV premium check (fire-and-forget)
fetch('/api/contracts/check-bhv-contract', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ contractNumber: result.contract.contractNumber })
}).catch(error => {
  console.log('Background BHV premium check failed:', error);
  // Silent fail - không ảnh hưởng user experience
});
```

**Rationale:**
- Backend already handles BHV check automatically at line 124 in `route.ts`
- Frontend check is redundant and causes duplicate API calls
- User doesn't need to see BHV check status (per requirements)

**Impact:**
- ✅ Eliminates duplicate BHV API call
- ✅ Cleaner frontend code
- ✅ Maintains background processing (non-blocking)

---

### Solution 2: Pass Contract Object to Background Function ✅

**File:** `src/app/api/contracts/route.ts`

**Current Implementation:**
```javascript
// Line 121
await contract.save();

// Line 124
checkBhvPremiumsInBackground(contract._id.toString(), contract.contractNumber, user.userId);

// Line 172-178
async function checkBhvPremiumsInBackground(contractId: string, contractNumber: string, userId: string) {
  try {
    console.log('🔄 Starting background BHV premium check for contract:', contractNumber);

    // Fetch the contract from database
    await connectToDatabase();
    const contract = await Contract.findById(contractId).lean();
    // ...
```

**Proposed Change:**
```javascript
// Line 121
await contract.save();

// Line 124 - Pass entire contract object
checkBhvPremiumsInBackground(
  contract.toObject(),
  user.userId
);

// Line 172 - Accept contract object
async function checkBhvPremiumsInBackground(
  contract: any,
  userId: string
) {
  try {
    const contractId = contract._id.toString();
    const contractNumber = contract.contractNumber;
    console.log('🔄 Starting background BHV premium check for contract:', contractNumber);

    // No need to re-fetch - we already have the contract!
    // Remove lines 177-183
    // ...
```

**Rationale:**
- Contract object is already in memory after save
- Background function needs all contract data for BHV transformation
- No point saving to DB then immediately reading back

**Impact:**
- ✅ Eliminates 1 database read operation
- ✅ Faster background processing
- ✅ More efficient memory usage
- ✅ Cleaner code flow

---

### Solution 3: Fix Field Name in Error Handler ✅

**File:** `src/app/api/contracts/route.ts`

**Current Code (Line 277-304):**
```javascript
async function updateContractWithBhvError(contractId: string, errorMessage: string) {
  try {
    await Contract.findByIdAndUpdate(contractId, {
      bhvPremiums: {
        bhvc: {
          beforeTax: 0,
          afterTax: 0
        },
        tnds: {
          beforeTax: 0,
          afterTax: 0
        },
        nntx: {
          beforeTax: 0,
          afterTax: 0
        },
        totalPremium: {  // ❌ Wrong field name
          beforeTax: 0,
          afterTax: 0
        },
        checkedAt: new Date(),
        success: false,
        error: errorMessage
      }
    });
```

**Proposed Fix:**
```javascript
async function updateContractWithBhvError(contractId: string, errorMessage: string) {
  try {
    await Contract.findByIdAndUpdate(contractId, {
      bhvPremiums: {
        bhvc: {
          beforeTax: 0,
          afterTax: 0
        },
        tnds: {
          beforeTax: 0,
          afterTax: 0
        },
        nntx: {
          beforeTax: 0,
          afterTax: 0
        },
        total: {  // ✅ Correct field name
          beforeTax: 0,
          afterTax: 0
        },
        checkedAt: new Date(),
        success: false,
        error: errorMessage
      }
    });
```

**Rationale:**
- Match the schema definition in `src/models/Contract.ts:478-487`
- Consistent with successful update at line 259-262

**Impact:**
- ✅ Bug fix: Error state now saves correctly
- ✅ Data consistency with schema

---

### Solution 4: Add Documentation Comments ✅

**Files:**
- `src/app/api/contracts/route.ts`
- `src/app/contracts/new/page.tsx`

**Proposed Comments:**

**In route.ts (around line 123):**
```javascript
await contract.save();

// Background BHV premium check - runs asynchronously (non-blocking)
// Purpose: Fetch BHV's official online price for comparison
// Business rule: Internal price must be lower than BHV online price
// User doesn't need to wait for this - they cannot submit to BHV until admin approval
checkBhvPremiumsInBackground(contract.toObject(), user.userId);

return NextResponse.json({
```

**In route.ts (line 172):**
```javascript
/**
 * Background function to check BHV premiums after contract creation
 *
 * This runs asynchronously without blocking the user's contract creation.
 * It fetches the official BHV online price and stores it in bhvPremiums field.
 *
 * Business Purpose:
 * - Validate that internal pricing is actually lower than BHV's official price
 * - Store both prices for admin review:
 *   - tongPhi: Internal discounted price
 *   - bhvPremiums: BHV's official online price
 *
 * Error Handling:
 * - Failures are logged but don't block contract creation
 * - Contract saved with bhvPremiums.success = false
 * - Admin can manually retry or proceed without BHV price comparison
 *
 * @param contract - Full contract object (already saved to DB)
 * @param userId - User ID for fetching BHV credentials
 */
async function checkBhvPremiumsInBackground(contract: any, userId: string) {
```

**Rationale:**
- Makes business logic clear to future developers
- Explains why background processing is necessary
- Documents error handling strategy

---

## Implementation Order

1. ✅ **Create this plan document** (`plan/improve_process.md`)
2. ✅ **Remove duplicate frontend BHV check** (easiest, no dependencies)
3. ✅ **Fix field name bug** (simple fix, improves data integrity)
4. ✅ **Optimize background function** (requires signature change)
5. ✅ **Add documentation** (final polish)

## Testing Checklist

After implementation, verify:

- [ ] Contract creation still works (status: 'nhap')
- [ ] Background BHV check runs exactly once
- [ ] Contract redirects to detail page immediately
- [ ] BHV premiums update correctly in background
- [ ] Error cases save with correct field names
- [ ] No duplicate API calls to BHV
- [ ] Database query count reduced by 1

## Future Improvements (Out of Scope)

These are noted for future consideration but not included in this refactoring:

1. **Job Queue System:**
   - Use Bull/BullMQ for background jobs
   - Add retry logic with exponential backoff
   - Track job status in UI for admin

2. **Reduce Database Updates:**
   - Consider initializing `bhvPremiums` field during contract creation
   - Use `{ success: false, error: "Pending..." }` as default
   - Update in one operation instead of two

3. **Service Layer:**
   - Extract business logic to `ContractService`
   - Separate API routes from business logic
   - Improve testability

4. **Manual Retry for Failed Checks:**
   - Add UI button for admin to retry failed BHV checks
   - Show BHV check status in contract detail view

## Success Metrics

After implementing this plan:
- ✅ Code is easier to understand (clear business logic)
- ✅ Fewer API calls (1 BHV check instead of 2)
- ✅ Fewer DB queries (1 less read operation)
- ✅ Bug fixed (correct field names)
- ✅ Better documentation for future developers

---

**Document Version:** 1.0
**Created:** 2025-09-30
**Status:** Ready for Implementation