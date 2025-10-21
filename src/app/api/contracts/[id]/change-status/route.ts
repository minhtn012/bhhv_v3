import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import Contract from '@/models/Contract';
import { requireAuth } from '@/lib/auth';
import { getStatusText } from '@/utils/contract-status';

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
    if (user.role !== 'admin' && contract.createdBy.toString() !== user.userId) {
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

    // Validate required fields when changing to khach_duyet
    if (status === 'khach_duyet') {
      const missingFields: string[] = [];

      if (!contract.buyerEmail || contract.buyerEmail.trim() === '') {
        missingFields.push('Email');
      }
      if (!contract.buyerPhone || contract.buyerPhone.trim() === '') {
        missingFields.push('Số điện thoại');
      }
      if (!contract.selectedProvince || contract.selectedProvince.trim() === '') {
        missingFields.push('Tỉnh/Thành phố');
      }
      if (!contract.selectedDistrictWard || contract.selectedDistrictWard.trim() === '') {
        missingFields.push('Quận/Huyện/Xã');
      }
      if (!contract.specificAddress || contract.specificAddress.trim() === '') {
        missingFields.push('Địa chỉ cụ thể');
      }

      if (missingFields.length > 0) {
        return NextResponse.json(
          {
            error: 'Thiếu thông tin bắt buộc',
            missingFields: missingFields,
            message: `Vui lòng cập nhật đầy đủ thông tin trước khi chuyển sang trạng thái "Khách đã duyệt". Các trường còn thiếu: ${missingFields.join(', ')}`
          },
          { status: 400 }
        );
      }
    }

    // Thay đổi trạng thái
    const oldStatus = contract.status;
    contract.status = status;

    // Set custom note và changedBy cho middleware
    contract.set('_statusChangeNote', note || `Chuyển từ ${getStatusText(oldStatus)} sang ${getStatusText(status)}`);
    contract.set('_statusChangedBy', user.userId);

    await contract.save();

    return NextResponse.json({
      message: `Đã chuyển trạng thái từ "${getStatusText(oldStatus)}" sang "${getStatusText(status)}"`,
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