import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import Contract from '@/models/Contract';
import User from '@/models/User';
import { requireAuth } from '@/lib/auth';
import { transformContractToPremiumCheckFormat } from '@/lib/bhvDataMapper';
import { bhvApiClient } from '@/lib/bhvApiClient';
import { parseBhvHtmlResponse, validatePremiumData } from '@/utils/bhv-html-parser';
import { decryptBhvCredentials } from '@/lib/encryption';
import { validateContract } from '@/lib/contractValidationSchema';
import mongoose from 'mongoose';
import { logError, logWarning, createErrorResponse } from '@/lib/errorLogger';

// GET /api/contracts - Lấy danh sách contracts
export async function GET(request: NextRequest) {
  try {
    const user = requireAuth(request);
    await connectToDatabase();

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const status = searchParams.get('status') || '';
    const search = searchParams.get('search') || '';

    const skip = (page - 1) * limit;

    // Build filter
    const filter: any = {};

    // User chỉ xem được contracts của mình, admin xem tất cả
    if (user.role !== 'admin') {
      // Handle both ObjectId (userId) and string (username) for backward compatibility
      // Use $expr to compare string representation to avoid casting errors
      if (mongoose.Types.ObjectId.isValid(user.userId)) {
        filter.$or = [
          { createdBy: new mongoose.Types.ObjectId(user.userId) },
          { $expr: { $eq: [{ $toString: '$createdBy' }, user.username] } }
        ];
      } else {
        // If userId is not valid ObjectId, only match by username
        filter.$expr = { $eq: [{ $toString: '$createdBy' }, user.username] };
      }
    }

    if (status && ['nhap', 'cho_duyet', 'khach_duyet', 'ra_hop_dong', 'huy'].includes(status)) {
      filter.status = status;
    }

    if (search) {
      const searchConditions = [
        { contractNumber: { $regex: search, $options: 'i' } },
        { bienSo: { $regex: search, $options: 'i' } },
        { chuXe: { $regex: search, $options: 'i' } }
      ];

      // If user already has createdBy filter, combine with $and
      if (filter.$or) {
        filter.$and = [
          { $or: filter.$or },
          { $or: searchConditions }
        ];
        delete filter.$or;
      } else {
        filter.$or = searchConditions;
      }
    }

    // Get contracts with pagination
    const [contracts, total] = await Promise.all([
      Contract.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('createdBy', 'username')
        .lean(),
      Contract.countDocuments(filter)
    ]);

    return NextResponse.json({
      contracts,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error: any) {
    logError(error, {
      operation: 'GET_CONTRACTS',
      path: request.url,
      method: request.method,
    });

    if (error.message === 'Authentication required') {
      return NextResponse.json(
        { error: error.message },
        { status: 401 }
      );
    }

    return NextResponse.json(
      createErrorResponse(error, 'Internal server error'),
      { status: 500 }
    );
  }
}

// POST /api/contracts - Tạo contract mới
export async function POST(request: NextRequest) {
  try {
    const user = requireAuth(request);

    // Only regular users can create contracts, admins cannot
    if (user.role === 'admin') {
      return NextResponse.json(
        { error: 'Admin không có quyền tạo hợp đồng mới. Chỉ user thường mới có thể tạo hợp đồng.' },
        { status: 403 }
      );
    }

    await connectToDatabase();

    const body = await request.json();

    // Validate contract data with Zod schema
    const validation = validateContract(body);

    if (!validation.success) {
      logWarning('Contract validation failed', {
        operation: 'CREATE_CONTRACT',
        userId: user.userId,
        additionalInfo: { validationErrors: validation.errors },
      });

      return NextResponse.json(
        {
          error: 'Dữ liệu hợp đồng không hợp lệ',
          details: validation.errors
        },
        { status: 400 }
      );
    }

    // Use validated data
    const validatedData = validation.data;

    // Create new contract with validated data
    const contract = new Contract({
      ...validatedData,
      createdBy: user.userId,
      status: 'nhap'
    });

    await contract.save();

    // Auto-check BHV premiums in background (don't block response)
    checkBhvPremiumsInBackground(contract._id.toString(), contract.contractNumber, user.userId);

    return NextResponse.json({
      message: 'Tạo hợp đồng thành công',
      contract: {
        id: contract._id,
        contractNumber: contract.contractNumber,
        chuXe: contract.chuXe,
        bienSo: contract.bienSo,
        status: contract.status,
        tongPhi: contract.tongPhi,
        createdAt: contract.createdAt
      }
    }, { status: 201 });

  } catch (error: any) {
    logError(error, {
      operation: 'CREATE_CONTRACT',
      path: request.url,
      method: request.method,
    });

    if (error.message === 'Authentication required') {
      return NextResponse.json(
        { error: error.message },
        { status: 401 }
      );
    }

    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((err: any) => err.message);
      return NextResponse.json(
        { error: messages.join(', ') },
        { status: 400 }
      );
    }

    if (error.code === 11000) {
      return NextResponse.json(
        { error: 'Số hợp đồng đã tồn tại' },
        { status: 409 }
      );
    }

    return NextResponse.json(
      createErrorResponse(error, 'Internal server error'),
      { status: 500 }
    );
  }
}

// Background function to check BHV premiums after contract creation or edit
export async function checkBhvPremiumsInBackground(contractId: string, contractNumber: string, userId: string) {
  try {
    // Fetch the contract from database
    await connectToDatabase();
    const contract = await Contract.findById(contractId).lean();

    if (!contract) {
      logWarning('Contract not found for background BHV check', {
        operation: 'BHV_PREMIUM_CHECK_BACKGROUND',
        contractId,
        contractNumber,
      });
      return;
    }

    // Get user's BHV credentials
    const user = await User.findById(userId).lean();
    if (!user || !user.bhvUsername || !user.bhvPassword) {
      logWarning('User has no BHV credentials, skipping background check', {
        operation: 'BHV_PREMIUM_CHECK_BACKGROUND',
        contractNumber,
        userId,
      });
      await updateContractWithBhvError(contractId, 'User has no BHV credentials configured');
      return;
    }

    // Transform contract data to BHV premium check format
    const bhvRequestData = transformContractToPremiumCheckFormat(contract);

    // Validate that we have enough data for mapping
    const dataObj = JSON.parse(bhvRequestData.data);
    if (!dataObj.car_automaker || !dataObj.car_model || !dataObj.car_value) {
      logWarning('Contract missing required data for BHV mapping', {
        operation: 'BHV_PREMIUM_CHECK_BACKGROUND',
        contractNumber,
      });
      await updateContractWithBhvError(contractId, 'Missing required data for BHV mapping (car brand, model, or value)');
      return;
    }

    // Get BHV cookies by authenticating with user's credentials
    let bhvCookies = null;
    try {
      const { username, password } = decryptBhvCredentials(user.bhvUsername, user.bhvPassword);
      const authResult = await bhvApiClient.authenticate(username, password);

      if (authResult.success) {
        bhvCookies = authResult.cookies;
      } else {
        logError(new Error(authResult.error || 'Authentication failed'), {
          operation: 'BHV_PREMIUM_CHECK_BACKGROUND_AUTH',
          contractNumber,
          userId,
        });
        await updateContractWithBhvError(contractId, `BHV authentication failed: ${authResult.error}`);
        return;
      }
    } catch (authError) {
      logError(authError, {
        operation: 'BHV_PREMIUM_CHECK_BACKGROUND_AUTH',
        contractNumber,
        userId,
      });
      await updateContractWithBhvError(contractId, `BHV authentication error: ${authError instanceof Error ? authError.message : 'Unknown auth error'}`);
      return;
    }

    // Call BHV API for premium check with authenticated cookies
    const bhvResult = await bhvApiClient.checkPremium(bhvRequestData, bhvCookies);

    if (!bhvResult.success) {
      logError(new Error(bhvResult.error || 'BHV API error'), {
        operation: 'BHV_PREMIUM_CHECK_BACKGROUND_API',
        contractNumber,
        requestData: bhvRequestData,
      });
      await updateContractWithBhvError(contractId, `BHV API error: ${bhvResult.error}`);
      return;
    }

    // Parse HTML response to extract premium data
    const premiumData = parseBhvHtmlResponse(bhvResult.htmlData!);

    // Validate premium data consistency
    if (!validatePremiumData(premiumData)) {
      logWarning('Premium data validation failed - inconsistent totals', {
        operation: 'BHV_PREMIUM_CHECK_BACKGROUND_VALIDATION',
        contractNumber,
        additionalInfo: { premiumData },
      });
    }

    // Update contract with BHV premium data
    await Contract.findByIdAndUpdate(contractId, {
      bhvPremiums: {
        bhvc: {
          beforeTax: premiumData.bhvc.beforeTax,
          afterTax: premiumData.bhvc.afterTax
        },
        tnds: {
          beforeTax: premiumData.tnds.beforeTax,
          afterTax: premiumData.tnds.afterTax
        },
        nntx: {
          beforeTax: premiumData.nntx.beforeTax,
          afterTax: premiumData.nntx.afterTax
        },
        total: {
          beforeTax: premiumData.totalPremium.beforeTax,
          afterTax: premiumData.totalPremium.afterTax
        },
        checkedAt: new Date(),
        success: true
      }
    });

    console.log('✅ BHV premium check completed successfully for contract:', contractNumber);

  } catch (error) {
    console.error('💥 Background BHV premium check error for contract:', contractNumber, error);
    await updateContractWithBhvError(contractId, error instanceof Error ? error.message : 'Unknown error');
  }
}

// Helper function to update contract with BHV error
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
        totalPremium: {
          beforeTax: 0,
          afterTax: 0
        },
        checkedAt: new Date(),
        success: false,
        error: errorMessage
      }
    });
  } catch (updateError) {
    console.error('💥 Failed to update contract with BHV error:', updateError);
  }
}