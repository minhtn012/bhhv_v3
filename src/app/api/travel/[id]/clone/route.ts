import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import TravelContract from '@/models/TravelContract';
import { requireAuth } from '@/lib/auth';

// POST /api/travel/[id]/clone - Clone contract as draft with empty insuredPersons
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = requireAuth(request);
    await connectToDatabase();

    const { id } = await params;
    const source = await TravelContract.findById(id).lean() as Record<string, unknown> | null;

    if (!source) {
      return NextResponse.json(
        { error: 'Contract not found' },
        { status: 404 }
      );
    }

    // Non-admin can only clone their own contracts
    const createdBy = source.createdBy as { toString: () => string };
    if (user.role !== 'admin' && createdBy.toString() !== user.userId) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }

    // Clone: keep owner, period, product, plan info but reset insuredPersons and status
    const cloned = new TravelContract({
      owner: source.owner,
      period: source.period,
      product: source.product,
      productName: source.productName,
      plan: source.plan,
      planName: source.planName,
      refNo: source.refNo || '',
      pnrNo: source.pnrNo || '',
      itinerary: source.itinerary || '',
      note: '',
      insuredPersons: [{ name: '', dob: '', age: 0, gender: 'M', country: 'VIETNAM', personalId: '', relationship: 'RELATION_O', pct: 100 }],
      totalPremium: 0,
      status: 'nhap',
      createdBy: user.userId,
    });

    await cloned.save({ validateBeforeSave: false });

    return NextResponse.json({
      message: 'Nhân bản hợp đồng thành công',
      contract: {
        id: cloned._id,
        contractNumber: cloned.contractNumber,
      },
    });
  } catch (error: unknown) {
    if (error instanceof Error && error.message === 'Authentication required') {
      return NextResponse.json(
        { error: error.message },
        { status: 401 }
      );
    }

    console.error('Clone contract error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
