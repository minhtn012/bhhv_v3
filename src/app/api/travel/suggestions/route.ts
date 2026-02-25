import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import TravelContract from '@/models/TravelContract';
import { getAuthUser } from '@/lib/auth';

// Allowed fields for suggestions (prevent arbitrary field access)
const ALLOWED_FIELDS = [
  'owner.policyholder',
  'owner.email',
  'owner.telNo',
  'owner.address',
  'owner.invTax',
  'owner.invCompany',
  'owner.invAddress',
  'insuredPersons.name',
  'insuredPersons.email',
  'insuredPersons.personalId',
  'insuredPersons.telNo',
];

// GET /api/travel/suggestions?field=owner.email
export async function GET(request: NextRequest) {
  try {
    const user = getAuthUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const field = request.nextUrl.searchParams.get('field');
    if (!field || !ALLOWED_FIELDS.includes(field)) {
      return NextResponse.json({ error: 'Invalid field' }, { status: 400 });
    }

    await connectToDatabase();

    const values = await TravelContract.distinct(field, {
      createdBy: user.userId,
    });

    // Filter out empty/null values and return unique non-empty strings
    const suggestions = values
      .filter((v: unknown) => typeof v === 'string' && v.trim() !== '')
      .sort() as string[];

    return NextResponse.json({ suggestions });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
