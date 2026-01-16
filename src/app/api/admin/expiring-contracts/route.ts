import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import Contract from '@/models/Contract';
import { requireAdmin } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// Parse date string DD/MM/YYYY to Date object
function parseVietnameseDate(dateStr: string): Date | null {
  if (!dateStr) return null;
  const parts = dateStr.split('/');
  if (parts.length !== 3) return null;
  const [day, month, year] = parts.map(Number);
  if (isNaN(day) || isNaN(month) || isNaN(year)) return null;
  return new Date(year, month - 1, day);
}

// Calculate days until expiration
function daysUntilExpiration(endDateStr: string): number {
  const endDate = parseVietnameseDate(endDateStr);
  if (!endDate) return Infinity;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  endDate.setHours(0, 0, 0, 0);
  const diffTime = endDate.getTime() - today.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

export async function GET(request: NextRequest) {
  try {
    // Verify admin authentication
    requireAdmin(request);

    await connectToDatabase();

    const { searchParams } = new URL(request.url);
    const daysThreshold = parseInt(searchParams.get('days') || '30'); // Default 30 days
    const limit = parseInt(searchParams.get('limit') || '10');

    // Get active contracts (ra_hop_dong status) with end date
    const contracts = await Contract.find({
      status: 'ra_hop_dong',
      ngayKetThucBaoHiem: { $exists: true, $ne: '' }
    })
      .select('contractNumber chuXe bienSo ngayKetThucBaoHiem tongPhi nhanHieu soLoai createdBy')
      .populate('createdBy', 'username')
      .lean();

    // Calculate days until expiration and filter
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const expiringContracts = contracts
      .map(contract => {
        const daysLeft = daysUntilExpiration(contract.ngayKetThucBaoHiem);
        return {
          _id: contract._id,
          contractNumber: contract.contractNumber,
          customerName: contract.chuXe,
          licensePlate: contract.bienSo,
          carInfo: `${contract.nhanHieu} ${contract.soLoai}`.trim(),
          expirationDate: contract.ngayKetThucBaoHiem,
          daysLeft,
          premium: contract.tongPhi,
          salesUser: contract.createdBy?.username || 'N/A'
        };
      })
      .filter(c => c.daysLeft >= 0 && c.daysLeft <= daysThreshold)
      .sort((a, b) => a.daysLeft - b.daysLeft)
      .slice(0, limit);

    // Summary stats
    const expiringSoon = expiringContracts.filter(c => c.daysLeft <= 7).length;
    const expiringThisMonth = expiringContracts.filter(c => c.daysLeft <= 30).length;
    const totalPremiumAtRisk = expiringContracts.reduce((sum, c) => sum + (c.premium || 0), 0);

    return NextResponse.json({
      contracts: expiringContracts,
      summary: {
        total: expiringContracts.length,
        expiringSoon, // within 7 days
        expiringThisMonth, // within 30 days
        totalPremiumAtRisk
      },
      filters: {
        daysThreshold,
        limit
      }
    });
  } catch (error) {
    console.error('Error fetching expiring contracts:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
