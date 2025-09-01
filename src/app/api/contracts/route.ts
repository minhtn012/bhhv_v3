import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import Contract from '@/models/Contract';
import { requireAuth } from '@/lib/auth';

// GET /api/contracts - Lấy danh sách contracts
export async function GET(request: NextRequest) {
  try {
    const user = requireAuth(request);
    await connectToDatabase();

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const status = searchParams.get('status') || '';
    const search = searchParams.get('search') || '';

    const skip = (page - 1) * limit;

    // Build filter
    const filter: any = {};
    
    // User chỉ xem được contracts của mình, admin xem tất cả
    if (user.role !== 'admin') {
      filter.createdBy = user.userId;
    }

    if (status && ['nhap', 'cho_duyet', 'khach_duyet', 'ra_hop_dong', 'huy'].includes(status)) {
      filter.status = status;
    }

    if (search) {
      filter.$or = [
        { contractNumber: { $regex: search, $options: 'i' } },
        { bienSo: { $regex: search, $options: 'i' } },
        { chuXe: { $regex: search, $options: 'i' } }
      ];
    }

    // Get contracts with pagination
    const [contracts, total] = await Promise.all([
      Contract.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Contract.countDocuments(filter)
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

  } catch (error: any) {
    console.error('Get contracts error:', error);
    
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

// POST /api/contracts - Tạo contract mới
export async function POST(request: NextRequest) {
  try {
    const user = requireAuth(request);
    await connectToDatabase();

    const body = await request.json();
    
    // Validate required fields
    const requiredFields = [
      'chuXe', 'diaChi', 'bienSo', 'nhanHieu', 'soLoai', 'soKhung', 
      'soMay', 'ngayDKLD', 'namSanXuat', 'soChoNgoi', 'giaTriXe', 
      'loaiHinhKinhDoanh', 'vatChatPackage', 'tongPhi', 'mucKhauTru'
    ];

    for (const field of requiredFields) {
      if (!body[field]) {
        return NextResponse.json(
          { error: `Trường ${field} là bắt buộc` },
          { status: 400 }
        );
      }
    }

    // Create new contract
    const contract = new Contract({
      ...body,
      createdBy: user.userId,
      status: 'nhap'
    });

    await contract.save();

    return NextResponse.json({
      message: 'Tạo hợp đồng thành công',
      contract: {
        id: contract._id,
        contractNumber: contract.contractNumber,
        chuXe: contract.chuXe,
        bienSo: contract.bienSo,
        status: contract.status,
        tongPhi: contract.tongPhi,
        createdAt: contract.createdAt
      }
    }, { status: 201 });

  } catch (error: any) {
    console.error('Create contract error:', error);

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

    if (error.code === 11000) {
      return NextResponse.json(
        { error: 'Số hợp đồng đã tồn tại' },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}