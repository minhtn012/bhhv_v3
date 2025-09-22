import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import Contract from '@/models/Contract';
import { transformContractToPremiumCheckFormat } from '@/lib/bhvDataMapper';
import { bhvApiClient } from '@/lib/bhvApiClient';
import { parseBhvHtmlResponse, validatePremiumData } from '@/utils/bhv-html-parser';
import { requireAuth } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const user = requireAuth(request);
    await connectToDatabase();

    const body = await request.json();
    const { contractNumber, cookies } = body;

    console.log('🔄 Processing BHV premium check for contract:', contractNumber);
    console.log('🍪 Using cookies:', cookies ? 'provided' : 'not provided');

    // Validate input
    if (!contractNumber) {
      return NextResponse.json(
        {
          success: false,
          error: 'Contract number is required'
        },
        { status: 400 }
      );
    }

    // Fetch contract from database
    const contract = await Contract.findOne({ contractNumber }).lean();
    if (!contract) {
      return NextResponse.json(
        {
          success: false,
          error: 'Contract not found'
        },
        { status: 404 }
      );
    }

    console.log('✓ Contract found:', contract.contractNumber);

    // Check if user has access to this contract (admin or owner)
    if (user.role !== 'admin' && contract.createdBy !== user.userId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Access denied: You can only check your own contracts'
        },
        { status: 403 }
      );
    }

    // Transform contract data to BHV premium check format
    console.log('🔄 Transforming contract data to BHV premium check format...');
    const bhvRequestData = transformContractToPremiumCheckFormat(contract);

    // Validate that we have enough data for mapping
    const dataObj = JSON.parse(bhvRequestData.data);
    if (!dataObj.car_automaker || !dataObj.car_model || !dataObj.car_value) {
      return NextResponse.json(
        {
          success: false,
          error: 'Contract missing required data for BHV mapping (car brand, model, or value)'
        },
        { status: 400 }
      );
    }

    // Call BHV API for premium check
    console.log('🚀 Calling BHV API for premium check...');
    const bhvResult = await bhvApiClient.checkPremium(bhvRequestData, cookies);

    if (!bhvResult.success) {
      console.error('❌ BHV premium check failed:', bhvResult.error);
      return NextResponse.json(
        {
          success: false,
          error: `BHV API error: ${bhvResult.error}`
        },
        { status: 500 }
      );
    }

    // Parse HTML response to extract premium data
    console.log('🔄 Parsing BHV HTML response...');
    const premiumData = parseBhvHtmlResponse(bhvResult.htmlData!);

    // Validate premium data consistency
    if (!validatePremiumData(premiumData)) {
      console.warn('⚠️ Premium data validation failed - inconsistent totals');
    }

    console.log('✅ BHV premium check successful');

    return NextResponse.json({
      success: true,
      contractNumber: contract.contractNumber,
      premiums: {
        bhvc: premiumData.bhvc,
        tnds: premiumData.tnds,
        nntx: premiumData.nntx
      },
      totalPremium: premiumData.totalPremium
    });

  } catch (error) {
    console.error('💥 BHV premium check API error:', error);

    if (error instanceof Error && error.message === 'Authentication required') {
      return NextResponse.json(
        {
          success: false,
          error: error.message
        },
        { status: 401 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error'
      },
      { status: 500 }
    );
  }
}