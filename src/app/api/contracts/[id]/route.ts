import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import Contract from '@/models/Contract';
import User from '@/models/User';
import { requireAuth } from '@/lib/auth';
import { logError, createErrorResponse } from '@/lib/errorLogger';
import { transformContractToPremiumCheckFormat } from '@/lib/bhvDataMapper';
import { bhvApiClient } from '@/lib/bhvApiClient';
import { parseBhvHtmlResponse, validatePremiumData } from '@/utils/bhv-html-parser';
import { decryptBhvCredentials } from '@/lib/encryption';

// GET /api/contracts/[id] - Lấy chi tiết contract
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = requireAuth(request);
    await connectToDatabase();

    const { id } = await params;
    const contract = await Contract.findById(id);
    if (!contract) {
      return NextResponse.json(
        { error: 'Không tìm thấy hợp đồng' },
        { status: 404 }
      );
    }

    // User chỉ xem được contract của mình, admin xem tất cả
    // Handle both ObjectId (userId) and string (username) for backward compatibility
    const createdByStr = contract.createdBy.toString();
    if (user.role !== 'admin' && createdByStr !== user.userId && createdByStr !== user.username) {
      return NextResponse.json(
        { error: 'Không có quyền truy cập' },
        { status: 403 }
      );
    }

    return NextResponse.json({ contract });

  } catch (error: any) {
    const { id } = await params;
    logError(error, {
      operation: 'GET_CONTRACT',
      contractId: id,
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

// PUT /api/contracts/[id] - Cập nhật contract
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = requireAuth(request);
    await connectToDatabase();

    const { id } = await params;
    const contract = await Contract.findById(id);
    if (!contract) {
      return NextResponse.json(
        { error: 'Không tìm thấy hợp đồng' },
        { status: 404 }
      );
    }

    // User chỉ sửa được contract của mình, admin sửa tất cả
    // Handle both ObjectId (userId) and string (username) for backward compatibility
    const createdByStrPut = contract.createdBy.toString();
    if (user.role !== 'admin' && createdByStrPut !== user.userId && createdByStrPut !== user.username) {
      return NextResponse.json(
        { error: 'Không có quyền truy cập' },
        { status: 403 }
      );
    }

    // Admin có thể sửa bất kỳ trạng thái nào, user thường chỉ sửa được khi 'nhap' hoặc 'cho_duyet'
    if (user.role !== 'admin' && !contract.canEdit()) {
      return NextResponse.json(
        { error: 'Chỉ có thể chỉnh sửa hợp đồng ở trạng thái "Nháp" hoặc "Chờ duyệt"' },
        { status: 400 }
      );
    }

    const body = await request.json();
    
    // Không cho phép thay đổi một số trường quan trọng
    delete body.contractNumber;
    delete body.createdBy;
    delete body.status;
    delete body.statusHistory;
    delete body._id;

    // Update contract
    Object.assign(contract, body);
    await contract.save();

    return NextResponse.json({
      message: 'Cập nhật hợp đồng thành công',
      contract
    });

  } catch (error: any) {
    const { id } = await params;
    logError(error, {
      operation: 'UPDATE_CONTRACT',
      contractId: id,
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

    return NextResponse.json(
      createErrorResponse(error, 'Internal server error'),
      { status: 500 }
    );
  }
}

// PATCH /api/contracts/[id] - Cập nhật một số fields cụ thể (như dates)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = requireAuth(request);
    await connectToDatabase();

    const { id } = await params;
    const contract = await Contract.findById(id);
    if (!contract) {
      return NextResponse.json(
        { error: 'Không tìm thấy hợp đồng' },
        { status: 404 }
      );
    }

    // User chỉ sửa được contract của mình, admin sửa tất cả
    // Handle both ObjectId (userId) and string (username) for backward compatibility
    const createdByStrPatch = contract.createdBy.toString();
    if (user.role !== 'admin' && createdByStrPatch !== user.userId && createdByStrPatch !== user.username) {
      return NextResponse.json(
        { error: 'Không có quyền truy cập' },
        { status: 403 }
      );
    }

    const body = await request.json();

    // Chỉ cho phép update một số trường cụ thể (như dates)
    const allowedFields = ['ngayBatDauBaoHiem', 'ngayKetThucBaoHiem'];
    const updateData: any = {};

    allowedFields.forEach(field => {
      if (body[field] !== undefined) {
        updateData[field] = body[field];
      }
    });

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: 'Không có dữ liệu hợp lệ để cập nhật' },
        { status: 400 }
      );
    }

    // Update contract dates
    await Contract.findByIdAndUpdate(id, updateData);
    console.log('✅ Contract dates updated successfully');

    // Fetch updated contract from database for BHV check
    const updatedContract = await Contract.findById(id).lean();
    if (!updatedContract) {
      console.error('❌ Failed to fetch updated contract');
      return NextResponse.json(
        { error: 'Lỗi kết nối BHV API. Vui lòng thử lại sau.' },
        { status: 500 }
      );
    }

    // Get user's BHV credentials
    const contractUser = await User.findById(updatedContract.createdBy).lean();
    if (!contractUser || !contractUser.bhvUsername || !contractUser.bhvPassword) {
      console.warn('⚠️ User has no BHV credentials');
      return NextResponse.json(
        { error: 'Lỗi kết nối BHV API. Vui lòng thử lại sau.' },
        { status: 500 }
      );
    }

    // Authenticate with BHV API
    console.log('🔐 Authenticating with BHV...');
    let bhvCookies = null;
    try {
      const { username, password } = decryptBhvCredentials(contractUser.bhvUsername, contractUser.bhvPassword);
      const authResult = await bhvApiClient.authenticate(username, password);

      if (!authResult.success) {
        console.error('❌ BHV authentication failed:', authResult.error);
        return NextResponse.json(
          { error: 'Lỗi kết nối BHV API. Vui lòng thử lại sau.' },
          { status: 500 }
        );
      }

      bhvCookies = authResult.cookies;
      console.log('✅ BHV authentication successful');
    } catch (authError) {
      console.error('❌ BHV authentication error:', authError);
      return NextResponse.json(
        { error: 'Lỗi kết nối BHV API. Vui lòng thử lại sau.' },
        { status: 500 }
      );
    }

    // Transform contract data for BHV premium check
    const bhvRequestData = transformContractToPremiumCheckFormat(updatedContract);

    // Validate required data
    const dataObj = JSON.parse(bhvRequestData.data);
    if (!dataObj.car_automaker || !dataObj.car_model || !dataObj.car_value) {
      console.warn('⚠️ Contract missing required data for BHV mapping');
      return NextResponse.json(
        { error: 'Lỗi kết nối BHV API. Vui lòng thử lại sau.' },
        { status: 500 }
      );
    }

    // Call BHV checkPremium API
    console.log('🚀 Calling BHV API for premium check...');
    const bhvResult = await bhvApiClient.checkPremium(bhvRequestData, bhvCookies);

    if (!bhvResult.success) {
      console.error('❌ BHV premium check failed:', bhvResult.error);
      return NextResponse.json(
        { error: 'Lỗi kết nối BHV API. Vui lòng thử lại sau.' },
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

    // Update contract with BHV premium data
    await Contract.findByIdAndUpdate(id, {
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

    console.log('✅ BHV premium check completed successfully');

    return NextResponse.json({
      message: 'Cập nhật thông tin thành công',
      updatedFields: Object.keys(updateData),
      bhvPremiums: {
        bhvc: premiumData.bhvc,
        tnds: premiumData.tnds,
        nntx: premiumData.nntx,
        total: premiumData.totalPremium
      }
    });

  } catch (error: any) {
    console.error('Patch contract error:', error);

    if (error.message === 'Authentication required') {
      return NextResponse.json(
        { error: error.message },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/contracts/[id] - Xóa contract
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = requireAuth(request);
    await connectToDatabase();

    const { id } = await params;
    const contract = await Contract.findById(id);
    if (!contract) {
      return NextResponse.json(
        { error: 'Không tìm thấy hợp đồng' },
        { status: 404 }
      );
    }

    // User chỉ xóa được contract của mình, admin xóa tất cả
    // Handle both ObjectId (userId) and string (username) for backward compatibility
    const createdByStr = contract.createdBy.toString();
    if (user.role !== 'admin' && createdByStr !== user.userId && createdByStr !== user.username) {
      return NextResponse.json(
        { error: 'Không có quyền truy cập' },
        { status: 403 }
      );
    }

    // Chỉ có thể xóa khi ở trạng thái 'nhap' hoặc 'cho_duyet'
    if (!contract.canEdit()) {
      return NextResponse.json(
        { error: 'Chỉ có thể xóa hợp đồng ở trạng thái "Nháp" hoặc "Chờ duyệt"' },
        { status: 400 }
      );
    }

    await Contract.findByIdAndDelete(id);

    return NextResponse.json({
      message: 'Xóa hợp đồng thành công'
    });

  } catch (error: any) {
    console.error('Delete contract error:', error);

    if (error.message === 'Authentication required') {
      return NextResponse.json(
        { error: error.message },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}