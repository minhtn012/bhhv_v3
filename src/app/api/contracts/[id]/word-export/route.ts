import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import Contract from '@/models/Contract';
import { generateWordContract } from '@/lib/wordContractService';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectToDatabase();

    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const contractType = searchParams.get('contractType') || '2-party';

    // Validate contract type
    if (!['2-party', '3-party'].includes(contractType)) {
      return NextResponse.json({ error: 'Invalid contract type' }, { status: 400 });
    }

    const contract = await Contract.findById(id);

    if (!contract) {
      return NextResponse.json({ error: 'Contract not found' }, { status: 404 });
    }

    // Get bank information for 3-party contracts
    let bankInfo = null;
    if (contractType === '3-party') {
      bankInfo = {
        bankName: searchParams.get('bankName') || '',
        bankOldAddress: searchParams.get('bankOldAddress') || '',
        bankNewAddress: searchParams.get('bankNewAddress') || ''
      };
    }

    const wordBuffer = await generateWordContract(contract, contractType, bankInfo);

    // Create filename with contract type
    const typePrefix = contractType === '3-party' ? '3ben' : '2ben';
    const filename = `hop-dong-${typePrefix}-${contract.contractNumber}.docx`;

    return new NextResponse(wordBuffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    });
  } catch (error) {
    console.error('Word export error:', error);
    return NextResponse.json(
      { error: 'Failed to generate document' },
      { status: 500 }
    );
  }
}