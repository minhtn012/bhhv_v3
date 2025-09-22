import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import Contract from '@/models/Contract';
import { transformContractToBhvConfirmFormat } from '@/lib/bhvDataMapper';
import { bhvApiClient } from '@/lib/bhvApiClient';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectToDatabase();

    const resolvedParams = await params;
    const contractId = resolvedParams.id;

    console.log('📋 Received contractId:', contractId);

    if (!contractId || contractId === 'undefined') {
      return NextResponse.json(
        { success: false, error: 'Contract ID is required' },
        { status: 400 }
      );
    }

    // Validate ObjectId format
    if (!/^[0-9a-fA-F]{24}$/.test(contractId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid Contract ID format' },
        { status: 400 }
      );
    }

    // Get cookies from request body
    const body = await request.json().catch(() => ({}));
    const { cookies } = body;

    console.log('🔄 Processing BHV confirmation for contract:', contractId);
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

    // Note: Status validation removed - allow confirmation from any status

    // Transform contract data to BHV confirmation format
    console.log('🔄 Transforming contract data to BHV confirmation format...');
    const bhvRequestData = transformContractToBhvConfirmFormat(contract);

    // Confirm contract with BHV API
    console.log('🚀 Confirming contract with BHV API...');
    const bhvResult = await bhvApiClient.confirmContract(bhvRequestData, cookies);

    if (bhvResult.success && bhvResult.bhvContractNumber) {
      console.log('✅ BHV confirmation successful:', bhvResult.bhvContractNumber);

      // Update contract status and BHV contract number in database
      await Contract.findByIdAndUpdate(contractId, {
        status: 'bhv_confirmed',
        bhvContractNumber: bhvResult.bhvContractNumber,
        $push: {
          statusHistory: {
            status: 'bhv_confirmed',
            changedBy: 'system',
            changedAt: new Date(),
            note: `BHV contract confirmed with number: ${bhvResult.bhvContractNumber}`
          }
        }
      });

      return NextResponse.json({
        success: true,
        message: 'Hợp đồng đã được xác nhận thành công trên hệ thống BHV',
        contractId: contractId,
        contractNumber: contract.contractNumber,
        bhvContractNumber: bhvResult.bhvContractNumber,
        confirmedAt: new Date().toISOString()
      });

    } else {
      console.error('❌ BHV confirmation failed:', bhvResult.error);

      return NextResponse.json(
        {
          success: false,
          error: `Lỗi khi xác nhận hợp đồng BHV: ${bhvResult.error}`
        },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('💥 Contract confirmation API error:', error);

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
  try {
    const resolvedParams = await params;
    const contractId = resolvedParams.id;

    if (!contractId || contractId === 'undefined') {
      return NextResponse.json(
        { success: false, error: 'Contract ID is required' },
        { status: 400 }
      );
    }

    // Optional: Get contract confirmation status
    return NextResponse.json(
      { message: 'Contract confirmation status endpoint - to be implemented if needed' },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Invalid request' },
      { status: 400 }
    );
  }
}