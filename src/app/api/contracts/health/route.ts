import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import HealthContract from '@/models/HealthContract';
import { requireAuth } from '@/lib/auth';
import { logError, logWarning, createErrorResponse } from '@/lib/errorLogger';
import mongoose from 'mongoose';
import { HEALTH_PACKAGE_LABELS } from '@/providers/bhv-online/products/health/constants';
import { transformSchemaFormToContractData } from '@/providers/bhv-online/products/health/mapper';

// GET /api/contracts/health - List health contracts
export async function GET(request: NextRequest) {
  try {
    const user = requireAuth(request);
    await connectToDatabase();

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const statusParam = searchParams.get('status') || '';
    const search = searchParams.get('search') || '';
    const startDate = searchParams.get('startDate') || '';
    const endDate = searchParams.get('endDate') || '';

    const skip = (page - 1) * limit;

    // Build filter
    const filter: Record<string, unknown> = {};

    // User can only see their own contracts, admin sees all
    if (user.role !== 'admin') {
      if (mongoose.Types.ObjectId.isValid(user.userId)) {
        filter.createdBy = new mongoose.Types.ObjectId(user.userId);
      }
    }

    // Handle status filter
    if (statusParam) {
      const validStatuses = ['nhap', 'cho_duyet', 'khach_duyet', 'ra_hop_dong', 'huy'];
      const statuses = statusParam.split(',').filter(s => validStatuses.includes(s));
      if (statuses.length > 0) {
        filter.status = { $in: statuses };
      }
    }

    // Handle date range filter on createdAt
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) {
        (filter.createdAt as Record<string, Date>).$gte = new Date(startDate);
      }
      if (endDate) {
        // Include the entire end date by setting time to 23:59:59
        (filter.createdAt as Record<string, Date>).$lte = new Date(endDate + 'T23:59:59.999Z');
      }
    }

    // Search by contract number, buyer name, or identity card
    if (search) {
      filter.$or = [
        { contractNumber: { $regex: search, $options: 'i' } },
        { 'buyer.fullname': { $regex: search, $options: 'i' } },
        { 'buyer.identityCard': { $regex: search, $options: 'i' } },
        { 'insuredPerson.fullname': { $regex: search, $options: 'i' } },
      ];
    }

    const [contracts, total] = await Promise.all([
      HealthContract.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('createdBy', 'username')
        .lean(),
      HealthContract.countDocuments(filter)
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

  } catch (error: unknown) {
    logError(error as Error, {
      operation: 'GET_HEALTH_CONTRACTS',
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

// POST /api/contracts/health - Create new health contract
export async function POST(request: NextRequest) {
  try {
    const user = requireAuth(request);

    // Only regular users can create contracts
    if (user.role === 'admin') {
      return NextResponse.json(
        { error: 'Admin không có quyền tạo hợp đồng mới. Chỉ user thường mới có thể tạo hợp đồng.' },
        { status: 403 }
      );
    }

    await connectToDatabase();

    const body = await request.json();

    // Transform flat form data to contract structure
    const contractData = transformSchemaFormToContractData(body);

    // Validate required fields
    if (!contractData.buyer?.fullname) {
      return NextResponse.json(
        { error: 'Họ tên người mua là bắt buộc' },
        { status: 400 }
      );
    }

    if (!contractData.totalPremium || contractData.totalPremium <= 0) {
      return NextResponse.json(
        { error: 'Phí bảo hiểm phải lớn hơn 0' },
        { status: 400 }
      );
    }

    // Get package name from UUID
    const packageName = HEALTH_PACKAGE_LABELS[contractData.packageType] || 'Hạng Kim Cương';

    // Create new health contract
    const contract = new HealthContract({
      ...contractData,
      packageName,
      createdBy: user.userId,
      status: 'nhap'
    });

    await contract.save();

    return NextResponse.json({
      message: 'Tạo hợp đồng sức khỏe thành công',
      contract: {
        id: contract._id,
        contractNumber: contract.contractNumber,
        buyerName: contract.buyer.fullname,
        packageName: contract.packageName,
        status: contract.status,
        totalPremium: contract.totalPremium,
        createdAt: contract.createdAt
      }
    }, { status: 201 });

  } catch (error: unknown) {
    logError(error as Error, {
      operation: 'CREATE_HEALTH_CONTRACT',
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

    if (error && typeof error === 'object' && 'code' in error && (error as { code: number }).code === 11000) {
      return NextResponse.json(
        { error: 'Số hợp đồng đã tồn tại' },
        { status: 409 }
      );
    }

    return NextResponse.json(
      createErrorResponse(error as Error, 'Internal server error'),
      { status: 500 }
    );
  }
}
