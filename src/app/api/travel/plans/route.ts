import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import fs from 'fs';
import path from 'path';

interface TravelPlan {
  value: string;
  text: string;
}

interface TravelPrice {
  plan_id: number;
  code: string;
  days_from: number;
  days_to: number;
  price: number;
}

// GET /api/travel/plans - Get travel insurance plans and prices
export async function GET(request: NextRequest) {
  try {
    const user = requireAuth(request);

    // Read plans from JSON file
    const plansPath = path.join(process.cwd(), 'db_json', 'travel_plans.json');
    const plansData = fs.readFileSync(plansPath, 'utf-8');
    const plans: TravelPlan[] = JSON.parse(plansData);

    // Read prices from JSON file
    const pricesPath = path.join(process.cwd(), 'db_json', 'travel_prices.json');
    const pricesData = fs.readFileSync(pricesPath, 'utf-8');
    const prices: TravelPrice[] = JSON.parse(pricesData);

    // Optional: Filter by product query param (if needed in future)
    const { searchParams } = new URL(request.url);
    const productParam = searchParams.get('product');

    // Map to expected format (PLAN_ID, PLAN_NAME)
    const mappedPlans = plans.map(p => ({
      PLAN_ID: parseInt(p.value, 10),
      PLAN_NAME: p.text
    }));

    return NextResponse.json({
      plans: mappedPlans,
      prices,
      count: mappedPlans.length,
      ...(productParam && { filteredByProduct: productParam })
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
