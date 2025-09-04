import { NextRequest, NextResponse } from 'next/server';
import { adminService } from '@/lib/adminService';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');

    // If no query, return all provinces
    if (!query.trim()) {
      const allProvinces = await adminService.getAllProvinces();
      return NextResponse.json({
        success: true,
        data: allProvinces,
        total: allProvinces.length
      });
    }

    // Search provinces with pagination
    const result = await adminService.searchProvinces(query, page, limit);
    return NextResponse.json(result);

  } catch (error) {
    console.error('Province search error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to search provinces' 
      },
      { status: 500 }
    );
  }
}