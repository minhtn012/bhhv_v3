import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import HealthContract from '@/models/HealthContract';
import { requireAuth } from '@/lib/auth';
import { logError, createErrorResponse } from '@/lib/errorLogger';
import mongoose from 'mongoose';
import { bhvProvider } from '@/providers/bhv-online';

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

    // Get cookies from request body (same pattern as vehicle insurance)
    const body = await request.json().catch(() => ({}));
    const { cookies } = body;

    if (!cookies) {
      return NextResponse.json(
        { error: 'Vui lòng đăng nhập BHV trước khi xác nhận hợp đồng' },
        { status: 400 }
      );
    }

    // Set session cookies from request
    bhvProvider.setSessionCookies(cookies);

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
