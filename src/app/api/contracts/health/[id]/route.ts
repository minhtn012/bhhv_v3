import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import HealthContract from '@/models/HealthContract';
import { requireAuth } from '@/lib/auth';
import { logError, createErrorResponse } from '@/lib/errorLogger';
import mongoose from 'mongoose';
import { HEALTH_PACKAGE_LABELS } from '@/providers/bhv-online/products/health/constants';
import { transformSchemaFormToContractData } from '@/providers/bhv-online/products/health/mapper';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/contracts/health/[id] - Get health contract details
export async function GET(request: NextRequest, { params }: RouteParams) {
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
        { error: 'Không có quyền xem hợp đồng này' },
        { status: 403 }
      );
    }

    return NextResponse.json({ contract });

  } catch (error: unknown) {
    logError(error as Error, {
      operation: 'GET_HEALTH_CONTRACT_DETAIL',
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

// PUT /api/contracts/health/[id] - Update health contract
export async function PUT(request: NextRequest, { params }: RouteParams) {
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
        { error: 'Không có quyền sửa hợp đồng này' },
        { status: 403 }
      );
    }

    // Check if contract can be edited (admin can edit any status)
    if (user.role !== 'admin' && !contract.canEdit()) {
      return NextResponse.json(
        { error: 'Không thể sửa hợp đồng ở trạng thái này' },
        { status: 400 }
      );
    }

    const body = await request.json();

    // Transform flat form data to contract structure
    const contractData = transformSchemaFormToContractData(body);

    // Get package name from UUID
    const packageName = HEALTH_PACKAGE_LABELS[contractData.packageType] || contract.packageName;

    // Update allowed fields
    Object.assign(contract, {
      kindAction: contractData.kindAction,
      certificateCode: contractData.certificateCode,
      packageType: contractData.packageType,
      packageName,
      purchaseYears: contractData.purchaseYears,
      benefitAddons: contractData.benefitAddons,
      healthQuestions: contractData.healthQuestions,
      buyer: contractData.buyer,
      insuredPerson: contractData.insuredPerson,
      beneficiary: contractData.beneficiary,
      customerKind: contractData.customerKind,
      activeDate: contractData.activeDate,
      inactiveDate: contractData.inactiveDate,
      totalPremium: contractData.totalPremium,
    });

    await contract.save();

    return NextResponse.json({
      message: 'Cập nhật hợp đồng thành công',
      contract: {
        id: contract._id,
        contractNumber: contract.contractNumber,
        status: contract.status,
        updatedAt: contract.updatedAt
      }
    });

  } catch (error: unknown) {
    logError(error as Error, {
      operation: 'UPDATE_HEALTH_CONTRACT',
      path: request.url,
      method: request.method,
    });

    if (error instanceof Error && error.message === 'Authentication required') {
      return NextResponse.json(
        { error: error.message },
        { status: 401 }
      );
    }

    if (error instanceof Error && error.name === 'ValidationError') {
      const mongooseError = error as mongoose.Error.ValidationError;
      const messages = Object.values(mongooseError.errors).map((err) => err.message);
      return NextResponse.json(
        { error: messages.join(', ') },
        { status: 400 }
      );
    }

    return NextResponse.json(
      createErrorResponse(error as Error, 'Internal server error'),
      { status: 500 }
    );
  }
}

// DELETE /api/contracts/health/[id] - Delete health contract
export async function DELETE(request: NextRequest, { params }: RouteParams) {
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
        { error: 'Không có quyền xóa hợp đồng này' },
        { status: 403 }
      );
    }

    // Only allow deletion of draft contracts
    if (contract.status !== 'nhap') {
      return NextResponse.json(
        { error: 'Chỉ có thể xóa hợp đồng ở trạng thái nháp' },
        { status: 400 }
      );
    }

    await HealthContract.findByIdAndDelete(id);

    return NextResponse.json({
      message: 'Xóa hợp đồng thành công'
    });

  } catch (error: unknown) {
    logError(error as Error, {
      operation: 'DELETE_HEALTH_CONTRACT',
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
