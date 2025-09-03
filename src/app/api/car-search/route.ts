import { NextRequest, NextResponse } from 'next/server';
import { carSearchService } from '@/lib/carSearchService';

export async function POST(request: NextRequest) {
  try {
    const { brandName, modelName } = await request.json();

    if (!brandName) {
      return NextResponse.json(
        { error: 'Brand name is required' },
        { status: 400 }
      );
    }

    const searchResults = await carSearchService.searchCarByBrandModel(brandName, modelName);

    return NextResponse.json({
      success: true,
      data: searchResults
    });

  } catch (error) {
    console.error('Car search error:', error);
    return NextResponse.json(
      { error: 'Failed to search cars' },
      { status: 500 }
    );
  }
}