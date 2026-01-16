import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import Contract from '@/models/Contract';
import User from '@/models/User';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import * as XLSX from 'xlsx';
import { getStatusText } from '@/utils/contract-status';

function getDateRange(timeRange: 'week' | 'month'): { start: Date; end: Date } {
  const now = new Date();
  const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

  let start: Date;
  if (timeRange === 'week') {
    const dayOfWeek = now.getDay();
    const diff = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - diff, 0, 0, 0, 0);
  } else {
    start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
  }

  return { start, end };
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('vi-VN').format(value) + ' VNĐ';
}

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  }).format(date);
}

export async function GET(request: NextRequest) {
  try {
    // Auth check
    const token = request.cookies.get('token')?.value || request.headers.get('authorization')?.split(' ')[1];
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let decoded: { role: string };
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key') as { role: string };
    } catch {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    if (decoded.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 });
    }

    await connectToDatabase();

    const { searchParams } = new URL(request.url);
    const timeRange = (searchParams.get('timeRange') as 'week' | 'month') || 'month';
    const userId = searchParams.get('userId');

    const { start, end } = getDateRange(timeRange);

    // Get sales users
    const salesUsers = await User.find({ role: 'user', isActive: true })
      .select('_id username email')
      .lean();

    const userMap = new Map(salesUsers.map(u => [u._id.toString(), u]));

    // Build match condition
    const matchCondition: Record<string, unknown> = {
      createdAt: { $gte: start, $lte: end }
    };

    if (userId) {
      matchCondition.createdBy = new mongoose.Types.ObjectId(userId);
    } else {
      matchCondition.createdBy = { $in: salesUsers.map(u => u._id) };
    }

    // Get all contracts for the period
    const contracts = await Contract.find(matchCondition)
      .select('contractNumber chuXe bienSo tongPhi status createdBy createdAt vatChatPackage')
      .sort({ createdAt: -1 })
      .lean();

    // Aggregate stats per user
    const userStats = await Contract.aggregate([
      { $match: matchCondition },
      {
        $group: {
          _id: '$createdBy',
          totalContracts: { $sum: 1 },
          completedContracts: {
            $sum: { $cond: [{ $eq: ['$status', 'ra_hop_dong'] }, 1, 0] }
          },
          totalRevenue: {
            $sum: { $cond: [{ $eq: ['$status', 'ra_hop_dong'] }, '$tongPhi', 0] }
          }
        }
      }
    ]);

    // Create workbook with multiple sheets
    const workbook = XLSX.utils.book_new();

    // Sheet 1: Sales Summary
    const summaryData = userStats.map((stat, index) => {
      const user = userMap.get(stat._id.toString());
      const conversionRate = stat.totalContracts > 0
        ? (stat.completedContracts / stat.totalContracts) * 100
        : 0;

      return {
        'STT': index + 1,
        'Nhân viên': user?.username || 'Unknown',
        'Email': user?.email || '',
        'Tổng HĐ': stat.totalContracts,
        'HĐ hoàn thành': stat.completedContracts,
        'Tỷ lệ chốt (%)': Math.round(conversionRate * 100) / 100,
        'Doanh số': formatCurrency(stat.totalRevenue)
      };
    });

    // Add totals row
    const totals = userStats.reduce((acc, stat) => ({
      totalContracts: acc.totalContracts + stat.totalContracts,
      completedContracts: acc.completedContracts + stat.completedContracts,
      totalRevenue: acc.totalRevenue + stat.totalRevenue
    }), { totalContracts: 0, completedContracts: 0, totalRevenue: 0 });

    summaryData.push({
      'STT': '',
      'Nhân viên': 'TỔNG CỘNG',
      'Email': '',
      'Tổng HĐ': totals.totalContracts,
      'HĐ hoàn thành': totals.completedContracts,
      'Tỷ lệ chốt (%)': totals.totalContracts > 0
        ? Math.round((totals.completedContracts / totals.totalContracts) * 100 * 100) / 100
        : 0,
      'Doanh số': formatCurrency(totals.totalRevenue)
    } as typeof summaryData[0]);

    const summarySheet = XLSX.utils.json_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(workbook, summarySheet, 'Tổng hợp Sales');

    // Sheet 2: Contract Details
    const contractData = contracts.map((contract, index) => {
      const user = userMap.get(contract.createdBy?.toString() || '');
      return {
        'STT': index + 1,
        'Số HĐ': contract.contractNumber,
        'Khách hàng': contract.chuXe,
        'Biển số': contract.bienSo,
        'Gói BH': contract.vatChatPackage?.name || '',
        'Tổng phí': formatCurrency(contract.tongPhi || 0),
        'Trạng thái': getStatusText(contract.status),
        'Nhân viên': user?.username || 'Unknown',
        'Ngày tạo': formatDate(new Date(contract.createdAt))
      };
    });

    const contractSheet = XLSX.utils.json_to_sheet(contractData);
    XLSX.utils.book_append_sheet(workbook, contractSheet, 'Chi tiết hợp đồng');

    // Generate Excel buffer
    const excelBuffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    // Generate filename
    const periodLabel = timeRange === 'week' ? 'tuan' : 'thang';
    const dateStr = formatDate(new Date()).replace(/\//g, '-');
    const filename = `bao-cao-sales-${periodLabel}-${dateStr}.xlsx`;

    // Return file response
    return new NextResponse(excelBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-cache'
      }
    });

  } catch (error) {
    console.error('Export sales error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
