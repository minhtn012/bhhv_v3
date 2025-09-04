import { NextRequest, NextResponse } from 'next/server';
import { adminService } from '@/lib/adminService';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const provinceCode = searchParams.get('province_code');
    const query = searchParams.get('q') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '100');

    if (!provinceCode) {
      return NextResponse.json(
        { 
          success: false,
          error: 'province_code is required' 
        },
        { status: 400 }
      );
    }

    // Get districts/wards by province with optional search
    const result = await adminService.getDistrictsWardsByProvince(
      provinceCode,
      query.trim() || undefined,
      page,
      limit
    );

    return NextResponse.json(result);

  } catch (error) {
    console.error('Districts/Wards search error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to get districts/wards' 
      },
      { status: 500 }
    );
  }
}