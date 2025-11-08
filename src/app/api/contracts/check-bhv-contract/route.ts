import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import Contract from '@/models/Contract';
import User from '@/models/User';
import { transformContractToPremiumCheckFormat } from '@/lib/bhvDataMapper';
import { bhvApiClient } from '@/lib/bhvApiClient';
import { parseBhvHtmlResponse, validatePremiumData } from '@/utils/bhv-html-parser';
import { requireAuth } from '@/lib/auth';
import { decryptBhvCredentials } from '@/lib/encryption';
import { logError, logInfo, logWarning, OperationTimer, createErrorResponse } from '@/lib/errorLogger';

export async function POST(request: NextRequest) {
  const timer = new OperationTimer();
  let contractNumber: string | undefined;

  try {
    const user = requireAuth(request);
    await connectToDatabase();

    const body = await request.json();
    contractNumber = body.contractNumber;

    logInfo('BHV premium check started', {
      operation: 'BHV_PREMIUM_CHECK',
      contractNumber,
      userId: user.userId,
      username: user.username,
    });

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

    // Get user credentials for BHV authentication
    const userWithCredentials = await User.findById(user.userId).select('bhvUsername bhvPassword');
    if (!userWithCredentials?.bhvUsername || !userWithCredentials?.bhvPassword) {
      return NextResponse.json(
        {
          success: false,
          error: 'No BHV credentials found. Please setup BHV credentials in your profile.'
        },
        { status: 400 }
      );
    }

    // Decrypt credentials and authenticate with BHV
    const { username, password } = decryptBhvCredentials(userWithCredentials.bhvUsername, userWithCredentials.bhvPassword);
    const authResult = await bhvApiClient.authenticate(username, password);

    if (!authResult.success) {
      logError(new Error(authResult.error || 'Authentication failed'), {
        operation: 'BHV_PREMIUM_CHECK_AUTH',
        contractNumber,
        userId: user.userId,
        username: user.username,
        additionalInfo: { bhvUsername: username },
      });

      return NextResponse.json(
        {
          success: false,
          error: `BHV authentication failed: ${authResult.error}`
        },
        { status: 500 }
      );
    }

    // Call BHV API for premium check with fresh cookies
    const bhvResult = await bhvApiClient.checkPremium(bhvRequestData, authResult.cookies);

    if (!bhvResult.success) {
      logError(new Error(bhvResult.error || 'BHV API error'), {
        operation: 'BHV_PREMIUM_CHECK_API',
        contractNumber,
        userId: user.userId,
        requestData: bhvRequestData,
        responseData: bhvResult,
      });

      return NextResponse.json(
        {
          success: false,
          error: `BHV API error: ${bhvResult.error}`
        },
        { status: 500 }
      );
    }

    // Parse HTML response to extract premium data
    const premiumData = parseBhvHtmlResponse(bhvResult.htmlData!);

    // Validate premium data consistency
    if (!validatePremiumData(premiumData)) {
      logWarning('Premium data validation failed - inconsistent totals', {
        operation: 'BHV_PREMIUM_CHECK_VALIDATION',
        contractNumber,
        additionalInfo: { premiumData },
      });
    }

    // Update contract with BHV premiums data
    try {
      await Contract.findByIdAndUpdate(contract._id, {
        bhvPremiums: {
          bhvc: premiumData.bhvc,
          tnds: premiumData.tnds,
          nntx: premiumData.nntx,
          total: premiumData.totalPremium,
          checkedAt: new Date(),
          success: true
        }
      });
    } catch (updateError) {
      logError(updateError, {
        operation: 'BHV_PREMIUM_CHECK_UPDATE',
        contractNumber,
        contractId: contract._id.toString(),
        additionalInfo: { premiumData },
      });
      // Continue with response even if update fails
    }

    timer.logCompletion('BHV premium check', {
      operation: 'BHV_PREMIUM_CHECK',
      contractNumber,
      userId: user.userId,
      additionalInfo: { totalPremium: premiumData.totalPremium },
    });

    return NextResponse.json({
      success: true,
      contractNumber: contract.contractNumber,
      premiums: {
        bhvc: premiumData.bhvc,
        tnds: premiumData.tnds,
        nntx: premiumData.nntx,
        total: premiumData.totalPremium
      }
    });

  } catch (error) {
    timer.logError(error, 'BHV_PREMIUM_CHECK', {
      contractNumber,
      path: request.url,
      method: request.method,
    });

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
        ...createErrorResponse(error, 'BHV premium check failed')
      },
      { status: 500 }
    );
  }
}