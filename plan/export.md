# Plan: Word Contract Export Feature

## Todo List

### ✅ Completed
1. ✅ Examine current component structure and imports
2. ✅ Check the template file structure
3. ✅ Research Word document libraries for Node.js

### 🔄 In Progress
4. 🔄 Create Word document generation service

### ⏳ Pending
5. ⏳ Add Word export button to component
6. ⏳ Test the implementation

## Implementation Details

### 1. Dependencies Required
```bash
npm install docx-templates file-saver
npm install --save-dev @types/file-saver
```

### 2. Create Word Document Service
**File**: `src/lib/wordContractService.ts`

```typescript
import fs from 'fs';
import path from 'path';
import { createReport } from 'docx-templates';

export async function generateWordContract(contractData: any) {
  const templatePath = path.join(process.cwd(), 'templates/temp_2025.docx');
  const template = fs.readFileSync(templatePath);

  const report = await createReport({
    template,
    data: {
      contractNumber: contractData.contractNumber,
      chuXe: contractData.chuXe,
      diaChi: contractData.diaChi,
      bienSo: contractData.bienSo,
      nhanHieu: contractData.nhanHieu,
      soLoai: contractData.soLoai,
      // ... map all contract fields
    },
  });

  return report;
}
```

### 3. API Endpoint
**File**: `src/app/api/contracts/[id]/word-export/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { connectToMongoDB } from '@/lib/mongodb';
import Contract from '@/models/Contract';
import { generateWordContract } from '@/lib/wordContractService';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectToMongoDB();
    const contract = await Contract.findById(params.id);

    if (!contract) {
      return NextResponse.json({ error: 'Contract not found' }, { status: 404 });
    }

    const wordBuffer = await generateWordContract(contract);

    return new NextResponse(wordBuffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'Content-Disposition': `attachment; filename="hop-dong-${contract.contractNumber}.docx"`,
      },
    });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to generate document' }, { status: 500 });
  }
}
```

### 4. Component Update
**File**: `src/components/contracts/detail/ContractDetailHeader.tsx`

Add new props:
```typescript
interface ContractDetailHeaderProps {
  // ... existing props
  onExportWord?: () => void;
  wordExportLoading?: boolean;
}
```

Add button after BHV button:
```tsx
{/* Word Export Button */}
{(['khach_duyet', 'ra_hop_dong'].includes(contract.status)) && onExportWord && (
  <button
    onClick={onExportWord}
    disabled={wordExportLoading}
    className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 disabled:cursor-not-allowed text-white font-medium py-3 px-4 rounded-xl transition-colors text-center flex items-center gap-2"
  >
    {wordExportLoading ? (
      <>
        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
        Đang xuất...
      </>
    ) : (
      <>
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        Xuất hợp đồng Word
      </>
    )}
  </button>
)}
```

### 5. Parent Component Integration
Update parent component to handle Word export:

```typescript
const [wordExportLoading, setWordExportLoading] = useState(false);

const handleExportWord = async () => {
  setWordExportLoading(true);
  try {
    const response = await fetch(`/api/contracts/${contract._id}/word-export`);
    const blob = await response.blob();

    // Create download link
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `hop-dong-${contract.contractNumber}.docx`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  } catch (error) {
    console.error('Failed to export Word document:', error);
    // Handle error (show toast, etc.)
  } finally {
    setWordExportLoading(false);
  }
};
```

## Notes
- Template file `templates/temp_2025.docx` exists and will be used
- Button appears only for contracts with status `khach_duyet` or `ra_hop_dong`
- Uses same styling pattern as existing BHV button
- Includes loading state and error handling
- Downloads file directly to user's computer
- File naming follows pattern: `hop-dong-{contractNumber}.docx`