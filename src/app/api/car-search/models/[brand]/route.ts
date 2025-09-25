import { NextRequest, NextResponse } from 'next/server';
import { carSearchService } from '@/lib/carSearchService';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ brand: string }> }
) {
  try {
    const { brand } = await params;
    const brandName = decodeURIComponent(brand);

    if (!brandName) {
      return NextResponse.json(
        { error: 'Brand name is required' },
        { status: 400 }
      );
    }

    const models = await carSearchService.getModelsByBrand(brandName);

    return NextResponse.json({
      success: true,
      data: models
    });

  } catch (error) {
    console.error('Get models error:', error);
    return NextResponse.json(
      { error: 'Failed to get models' },
      { status: 500 }
    );
  }
}