import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import Contract from '@/models/Contract';
import { requireAuth } from '@/lib/auth';
import { checkBhvPremiumsInBackground } from '../route';
import { logError, createErrorResponse } from '@/lib/errorLogger';

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

    // Chỉ có thể sửa khi ở trạng thái 'nhap' hoặc 'cho_duyet'
    if (!contract.canEdit()) {
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

    // Auto-check BHV premiums in background after edit (don't block response)
    checkBhvPremiumsInBackground(contract._id.toString(), contract.contractNumber, user.userId);

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

    // Update contract
    await Contract.findByIdAndUpdate(id, updateData);

    return NextResponse.json({
      message: 'Cập nhật thông tin thành công',
      updatedFields: Object.keys(updateData)
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