import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import Contract from '@/models/Contract';
import { transformContractToBhvFormat } from '@/lib/bhvDataMapper';
import { bhvApiClient } from '@/lib/bhvApiClient';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectToDatabase();

    const { id: contractId } = await params;
    if (!contractId) {
      return NextResponse.json(
        { success: false, error: 'Contract ID is required' },
        { status: 400 }
      );
    }

    // Get cookies from request body
    const body = await request.json().catch(() => ({}));
    const { cookies } = body;

    console.log('🔄 Processing BHV submission for contract:', contractId);
    console.log('🍪 Using cookies:', cookies ? 'provided' : 'not provided');

    // Fetch contract from database
    const contract = await Contract.findById(contractId).lean();
    if (!contract) {
      return NextResponse.json(
        { success: false, error: 'Contract not found' },
        { status: 404 }
      );
    }

    console.log('✓ Contract found:', contract.contractNumber);

    // Check if contract is in valid status for BHV submission
    const validStatuses = ['khach_duyet', 'ra_hop_dong'];
    if (!validStatuses.includes(contract.status)) {
      return NextResponse.json(
        {
          success: false,
          error: `Hợp đồng phải ở trạng thái 'Khách duyệt' hoặc 'Ra hợp đồng' để tạo hợp đồng BHV. Trạng thái hiện tại: ${contract.status}`
        },
        { status: 400 }
      );
    }

    // Check if BHV contract already exists
    if (contract.bhvContractNumber) {
      return NextResponse.json(
        {
          success: false,
          error: `Hợp đồng BHV đã được tạo trước đó với số hợp đồng: ${contract.bhvContractNumber}`
        },
        { status: 400 }
      );
    }

    // Transform contract data to BHV format (contract already has dates from DB)
    console.log('🔄 Transforming contract data to BHV format...');
    console.log('📅 Using dates from contract:', {
      ngayBatDauBaoHiem: contract.ngayBatDauBaoHiem,
      ngayKetThucBaoHiem: contract.ngayKetThucBaoHiem
    });
    const bhvRequestData = transformContractToBhvFormat(contract);

    // Submit to BHV API with fresh cookies
    console.log('🚀 Submitting to BHV API...');
    const bhvResult = await bhvApiClient.submitContract(bhvRequestData, cookies);

    if (bhvResult.success) {
      console.log('✅ BHV submission successful');

      // Optionally add submission history
      // await Contract.findByIdAndUpdate(contractId, {
      //   $push: {
      //     statusHistory: {
      //       status: 'bhv_submitted',
      //       changedBy: 'system',
      //       changedAt: new Date(),
      //       note: 'Successfully submitted to BHV system'
      //     }
      //   }
      // });

      return NextResponse.json({
        success: true,
        message: 'Hợp đồng đã được tạo thành công trên hệ thống BHV',
        pdfBase64: bhvResult.pdfBase64,
        contractNumber: contract.contractNumber
      });

    } else {
      console.error('❌ BHV submission failed:', bhvResult.error);

      return NextResponse.json(
        {
          success: false,
          error: `Lỗi khi tạo hợp đồng BHV: ${bhvResult.error}`
        },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('💥 BHV submission API error:', error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error'
      },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Optional: Get BHV submission status/history for a contract
  return NextResponse.json(
    { message: 'BHV submission status endpoint - to be implemented if needed' },
    { status: 200 }
  );
}