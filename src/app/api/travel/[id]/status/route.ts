import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import TravelContract from '@/models/TravelContract';
import { requireAuth } from '@/lib/auth';

// PATCH /api/travel/[id]/status - Change contract status
export async function PATCH(
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

    const { status: newStatus, note } = await request.json();

    if (!newStatus) {
      return NextResponse.json(
        { error: 'New status is required' },
        { status: 400 }
      );
    }

    // Check if transition is allowed
    if (!contract.canChangeStatus(newStatus, user.role)) {
      return NextResponse.json(
        { error: 'Status transition not allowed' },
        { status: 400 }
      );
    }

    contract.status = newStatus;
    contract.set('_statusChangedBy', user.userId);
    if (note) {
      contract.set('_statusChangeNote', note);
    }

    await contract.save();

    return NextResponse.json({
      message: 'Cap nhat trang thai thanh cong',
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
