import { NextRequest, NextResponse } from 'next/server';
import { carSearchService } from '@/lib/carSearchService';

export async function GET(
  request: NextRequest,
  { params }: { params: { brand: string; model: string } }
) {
  try {
    const brandName = decodeURIComponent(params.brand);
    const modelName = decodeURIComponent(params.model);

    if (!brandName || !modelName) {
      return NextResponse.json(
        { error: 'Brand name and model name are required' },
        { status: 400 }
      );
    }

    const carDetails = await carSearchService.getCarDetails(brandName, modelName);

    if (!carDetails) {
      return NextResponse.json(
        { error: 'Car not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: carDetails
    });

  } catch (error) {
    console.error('Get car details error:', error);
    return NextResponse.json(
      { error: 'Failed to get car details' },
      { status: 500 }
    );
  }
}