import { NextResponse } from 'next/server';
import { carSearchService } from '@/lib/carSearchService';

export async function GET() {
  try {
    const brands = await carSearchService.getAllBrands();

    return NextResponse.json({
      success: true,
      data: brands.sort()
    });

  } catch (error) {
    console.error('Get brands error:', error);
    return NextResponse.json(
      { error: 'Failed to get brands' },
      { status: 500 }
    );
  }
}