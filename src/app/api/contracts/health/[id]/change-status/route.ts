import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import HealthContract from '@/models/HealthContract';
import { requireAuth } from '@/lib/auth';
import { logError, createErrorResponse } from '@/lib/errorLogger';
import mongoose from 'mongoose';
import { getHealthStatusText } from '@/utils/health-contract-status';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// POST /api/contracts/health/[id]/change-status - Change health contract status
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

    const body = await request.json();
    const { newStatus, note } = body;

    if (!newStatus) {
      return NextResponse.json(
        { error: 'Trạng thái mới là bắt buộc' },
        { status: 400 }
      );
    }

    const validStatuses = ['nhap', 'cho_duyet', 'khach_duyet', 'ra_hop_dong', 'huy'];
    if (!validStatuses.includes(newStatus)) {
      return NextResponse.json(
        { error: 'Trạng thái không hợp lệ' },
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
        { error: 'Không có quyền thay đổi trạng thái hợp đồng này' },
        { status: 403 }
      );
    }

    // Check if status change is allowed
    if (!contract.canChangeStatus(newStatus, user.role)) {
      return NextResponse.json(
        { error: `Không thể chuyển từ "${getHealthStatusText(contract.status)}" sang "${getHealthStatusText(newStatus)}"` },
        { status: 400 }
      );
    }

    // Update status
    const oldStatus = contract.status;
    contract.status = newStatus;
    contract.set('_statusChangedBy', user.userId);
    contract.set('_statusChangeNote', note || `Chuyển từ "${getHealthStatusText(oldStatus)}" sang "${getHealthStatusText(newStatus)}"`);

    await contract.save();

    return NextResponse.json({
      message: 'Cập nhật trạng thái thành công',
      contract: {
        id: contract._id,
        contractNumber: contract.contractNumber,
        oldStatus,
        newStatus: contract.status,
        statusText: getHealthStatusText(contract.status)
      }
    });

  } catch (error: unknown) {
    logError(error as Error, {
      operation: 'CHANGE_HEALTH_CONTRACT_STATUS',
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
