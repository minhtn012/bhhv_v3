import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import TravelContract from '@/models/TravelContract';
import { requireAuth } from '@/lib/auth';
import { TRAVEL_PRODUCT_LABELS } from '@/providers/pacific-cross/products/travel/constants';
import mongoose from 'mongoose';

// GET /api/travel - List travel contracts
export async function GET(request: NextRequest) {
  try {
    const user = requireAuth(request);
    await connectToDatabase();

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const statusParam = searchParams.get('status') || '';
    const search = searchParams.get('search') || '';

    const skip = (page - 1) * limit;

    // Build filter
    const filter: Record<string, unknown> = {};

    // Non-admin users see only their contracts
    if (user.role !== 'admin') {
      if (mongoose.Types.ObjectId.isValid(user.userId)) {
        filter.createdBy = new mongoose.Types.ObjectId(user.userId);
      }
    }

    // Handle status filter (comma-separated)
    if (statusParam) {
      const validStatuses = ['nhap', 'cho_duyet', 'khach_duyet', 'ra_hop_dong', 'huy'];
      const statuses = statusParam.split(',').filter(s => validStatuses.includes(s));
      if (statuses.length > 0) {
        filter.status = { $in: statuses };
      }
    }

    // Search by contract number, policyholder, or insured person
    if (search) {
      filter.$or = [
        { contractNumber: { $regex: search, $options: 'i' } },
        { 'owner.policyholder': { $regex: search, $options: 'i' } },
        { 'insuredPersons.name': { $regex: search, $options: 'i' } },
        { 'insuredPersons.personalId': { $regex: search, $options: 'i' } },
      ];
    }

    const [contracts, total] = await Promise.all([
      TravelContract.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('createdBy', 'username')
        .lean(),
      TravelContract.countDocuments(filter)
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
    // Logged via logError if needed

    if (error instanceof Error && error.message === 'Authentication required') {
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

// POST /api/travel - Create new travel contract
export async function POST(request: NextRequest) {
  try {
    const user = requireAuth(request);

    // Only regular users can create contracts
    if (user.role === 'admin') {
      return NextResponse.json(
        { error: 'Admin khong co quyen tao hop dong moi. Chi user thuong moi co the tao hop dong.' },
        { status: 403 }
      );
    }

    await connectToDatabase();

    const data = await request.json();

    // Validate required fields
    if (!data.owner?.policyholder) {
      return NextResponse.json(
        { error: 'Chu hop dong la bat buoc' },
        { status: 400 }
      );
    }

    if (!data.insuredPersons?.length) {
      return NextResponse.json(
        { error: 'Phai co it nhat 1 nguoi duoc bao hiem' },
        { status: 400 }
      );
    }

    // Premium can be 0 for draft contracts - will be calculated when confirming
    if (data.totalPremium === undefined) {
      data.totalPremium = 0;
    }

    // Get product name from constants
    const productName = TRAVEL_PRODUCT_LABELS[data.product] || `Product ${data.product}`;

    // Create contract
    const contract = new TravelContract({
      ...data,
      productName,
      planName: data.planName || `Plan ${data.plan}`,
      createdBy: user.userId,
      status: 'nhap'
    });

    await contract.save();

    return NextResponse.json({
      message: 'Tao hop dong du lich thanh cong',
      contract: {
        id: contract._id,
        contractNumber: contract.contractNumber,
        policyholder: contract.owner.policyholder,
        productName: contract.productName,
        status: contract.status,
        totalPremium: contract.totalPremium,
        createdAt: contract.createdAt
      }
    }, { status: 201 });

  } catch (error: unknown) {
    // Logged via logError if needed

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
        { error: 'So hop dong da ton tai' },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
