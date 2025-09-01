import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import Contract from '@/models/Contract';
import { requireAuth } from '@/lib/auth';

// POST /api/contracts/[id]/change-status - Thay đổi trạng thái contract
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = requireAuth(request);
    await connectToDatabase();

    const body = await request.json();
    const { status, note } = body;

    if (!status) {
      return NextResponse.json(
        { error: 'Trạng thái mới là bắt buộc' },
        { status: 400 }
      );
    }

    const { id } = await params;
    const contract = await Contract.findById(id);
    if (!contract) {
      return NextResponse.json(
        { error: 'Không tìm thấy hợp đồng' },
        { status: 404 }
      );
    }

    // User chỉ thay đổi được contract của mình, admin thay đổi tất cả
    if (user.role !== 'admin' && contract.createdBy !== user.userId) {
      return NextResponse.json(
        { error: 'Không có quyền truy cập' },
        { status: 403 }
      );
    }

    // Kiểm tra có thể thay đổi trạng thái không
    if (!contract.canChangeStatus(status, user.role)) {
      return NextResponse.json(
        { error: 'Không thể thay đổi sang trạng thái này' },
        { status: 400 }
      );
    }

    // Thay đổi trạng thái
    const oldStatus = contract.status;
    contract.status = status;

    // Thêm vào lịch sử (sẽ được thực hiện tự động bởi pre-save middleware)
    // Nhưng ta cần update changedBy trong statusHistory
    contract.statusHistory.push({
      status: status,
      changedBy: user.userId,
      changedAt: new Date(),
      note: note || `Chuyển từ ${Contract.getStatusText(oldStatus)} sang ${Contract.getStatusText(status)}`
    });

    await contract.save();

    return NextResponse.json({
      message: `Đã chuyển trạng thái từ "${Contract.getStatusText(oldStatus)}" sang "${Contract.getStatusText(status)}"`,
      contract: {
        id: contract._id,
        contractNumber: contract.contractNumber,
        status: contract.status,
        statusHistory: contract.statusHistory
      }
    });

  } catch (error: any) {
    console.error('Change status error:', error);

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
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}