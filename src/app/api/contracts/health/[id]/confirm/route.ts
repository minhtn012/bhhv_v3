import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import HealthContract from '@/models/HealthContract';
import User from '@/models/User';
import { requireAuth } from '@/lib/auth';
import { logError, createErrorResponse } from '@/lib/errorLogger';
import mongoose from 'mongoose';
import { bhvProvider } from '@/providers/bhv-online';
import { decryptBhvCredentials } from '@/lib/encryption';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// POST /api/contracts/health/[id]/confirm - Submit health contract to BHV
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const user = requireAuth(request);
    await connectToDatabase();

    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: 'ID hợp đồng không hợp lệ' },
        { status: 400 }
      );
    }

    const contract = await HealthContract.findById(id);

    if (!contract) {
      return NextResponse.json(
        { error: 'Không tìm thấy hợp đồng' },
        { status: 404 }
      );
    }

    // Check ownership for non-admin users
    if (user.role !== 'admin' && contract.createdBy.toString() !== user.userId) {
      return NextResponse.json(
        { error: 'Không có quyền xác nhận hợp đồng này' },
        { status: 403 }
      );
    }

    // Only allow confirming contracts in 'khach_duyet' status
    if (contract.status !== 'khach_duyet') {
      return NextResponse.json(
        { error: 'Chỉ có thể xác nhận hợp đồng ở trạng thái "Khách duyệt"' },
        { status: 400 }
      );
    }

    // Get user's BHV credentials
    const dbUser = await User.findById(user.userId).lean();
    if (!dbUser || !dbUser.bhvUsername || !dbUser.bhvPassword) {
      return NextResponse.json(
        { error: 'Chưa cấu hình tài khoản BHV. Vui lòng cập nhật trong phần cài đặt.' },
        { status: 400 }
      );
    }

    // Authenticate with BHV
    let bhvCookies: string | null = null;
    try {
      const { username, password } = decryptBhvCredentials(dbUser.bhvUsername, dbUser.bhvPassword);
      const authResult = await bhvProvider.testCredentials({ username, password });

      if (!authResult.success) {
        return NextResponse.json(
          { error: `Đăng nhập BHV thất bại: ${authResult.message}` },
          { status: 400 }
        );
      }

      bhvCookies = (authResult.sessionData as { cookies?: string })?.cookies || null;
    } catch (authError) {
      logError(authError as Error, {
        operation: 'HEALTH_CONTRACT_CONFIRM_AUTH',
        contractId: id,
      });
      return NextResponse.json(
        { error: 'Lỗi xác thực BHV' },
        { status: 500 }
      );
    }

    // Set session cookies
    if (bhvCookies) {
      bhvProvider.setSessionCookies(bhvCookies);
    }

    // Step 1: Create contract to get saleCode
    const createResult = await bhvProvider.createHealthContract(contract.toObject());

    if (!createResult.success) {
      return NextResponse.json(
        { error: `Lỗi tạo hợp đồng BHV: ${createResult.error}` },
        { status: 500 }
      );
    }

    if (!createResult.saleCode) {
      return NextResponse.json(
        { error: 'Không nhận được sale_code từ BHV' },
        { status: 500 }
      );
    }

    // Save saleCode to contract
    contract.bhvSaleCode = createResult.saleCode;
    await contract.save();

    // Step 2: Confirm contract with saleCode
    const confirmResult = await bhvProvider.confirmHealthContract(
      contract.toObject(),
      createResult.saleCode
    );

    if (!confirmResult.success) {
      return NextResponse.json(
        { error: `Lỗi xác nhận hợp đồng BHV: ${confirmResult.error}` },
        { status: 500 }
      );
    }

    // Update contract with BHV contract number and status
    contract.bhvContractNumber = confirmResult.contractNumber;
    contract.status = 'ra_hop_dong';
    contract.set('_statusChangedBy', user.userId);
    contract.set('_statusChangeNote', `Xác nhận thành công với BHV. Số hợp đồng: ${confirmResult.contractNumber}`);
    await contract.save();

    return NextResponse.json({
      message: 'Xác nhận hợp đồng thành công',
      contract: {
        id: contract._id,
        contractNumber: contract.contractNumber,
        bhvContractNumber: contract.bhvContractNumber,
        status: contract.status
      }
    });

  } catch (error: unknown) {
    logError(error as Error, {
      operation: 'CONFIRM_HEALTH_CONTRACT',
      path: request.url,
      method: request.method,
    });

    if (error instanceof Error && error.message === 'Authentication required') {
      return NextResponse.json(
        { error: error.message },
        { status: 401 }
      );
    }

    return NextResponse.json(
      createErrorResponse(error as Error, 'Internal server error'),
      { status: 500 }
    );
  }
}
