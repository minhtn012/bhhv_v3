import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import TravelContract from '@/models/TravelContract';
import { requireAuth } from '@/lib/auth';

// GET /api/travel/[id] - Get single contract
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = requireAuth(request);
    await connectToDatabase();

    const { id } = await params;
    const contract = await TravelContract.findById(id)
      .populate('createdBy', 'username')
      .lean() as { createdBy: { _id: { toString: () => string } } } | null;

    if (!contract) {
      return NextResponse.json(
        { error: 'Contract not found' },
        { status: 404 }
      );
    }

    // Non-admin can only see their own contracts
    if (
      user.role !== 'admin' &&
      contract.createdBy._id.toString() !== user.userId
    ) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }

    return NextResponse.json({ contract });

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

// PUT /api/travel/[id] - Update contract
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = requireAuth(request);
    await connectToDatabase();

    const { id } = await params;
    const contract = await TravelContract.findById(id);

    if (!contract) {
      return NextResponse.json(
        { error: 'Contract not found' },
        { status: 404 }
      );
    }

    // Check permission
    if (
      user.role !== 'admin' &&
      contract.createdBy.toString() !== user.userId
    ) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }

    // Check if editable
    if (!contract.canEdit()) {
      return NextResponse.json(
        { error: 'Contract cannot be edited in current status' },
        { status: 400 }
      );
    }

    const data = await request.json();

    // Update allowed fields
    const allowedFields = [
      'owner',
      'period',
      'product',
      'productName',
      'plan',
      'planName',
      'insuredPersons',
      'refNo',
      'pnrNo',
      'itinerary',
      'note',
      'totalPremium'
    ];

    for (const field of allowedFields) {
      if (data[field] !== undefined) {
        (contract as Record<string, unknown>)[field] = data[field];
      }
    }

    await contract.save();

    return NextResponse.json({
      message: 'Cap nhat hop dong thanh cong',
      contract: {
        id: contract._id,
        contractNumber: contract.contractNumber,
        status: contract.status
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

// DELETE /api/travel/[id] - Delete contract (only draft)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = requireAuth(request);
    await connectToDatabase();

    const { id } = await params;
    const contract = await TravelContract.findById(id);

    if (!contract) {
      return NextResponse.json(
        { error: 'Contract not found' },
        { status: 404 }
      );
    }

    // Only creator or admin can delete
    if (
      user.role !== 'admin' &&
      contract.createdBy.toString() !== user.userId
    ) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }

    // Only draft contracts can be deleted
    if (contract.status !== 'nhap') {
      return NextResponse.json(
        { error: 'Only draft contracts can be deleted' },
        { status: 400 }
      );
    }

    await contract.deleteOne();

    return NextResponse.json({
      message: 'Xoa hop dong thanh cong'
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
