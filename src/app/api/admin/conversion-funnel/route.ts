import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import Contract from '@/models/Contract';
import User from '@/models/User';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import { getStatusText, getStatusChartColor } from '@/utils/contract-status';

export interface FunnelStage {
  status: string;
  statusText: string;
  count: number;
  percentage: number;
  dropoffRate: number;
  color: string;
}

export interface ConversionFunnelResponse {
  funnel: FunnelStage[];
  timeRange: 'week' | 'month';
  dateRange: { start: string; end: string };
  summary: {
    totalCreated: number;
    totalCompleted: number;
    totalCancelled: number;
    overallConversionRate: number;
  };
}

// Status order for funnel visualization
const FUNNEL_STATUS_ORDER = ['nhap', 'cho_duyet', 'khach_duyet', 'ra_hop_dong'];

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

    // Build match condition
    const matchCondition: Record<string, unknown> = {
      createdAt: { $gte: start, $lte: end }
    };

    if (userId) {
      matchCondition.createdBy = new mongoose.Types.ObjectId(userId);
    } else {
      // Only include sales users (role='user')
      const salesUsers = await User.find({ role: 'user' }).select('_id').lean();
      matchCondition.createdBy = { $in: salesUsers.map(u => u._id) };
    }

    // Count contracts by current status
    const statusCounts = await Contract.aggregate([
      { $match: matchCondition },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    // Create status count map
    const countMap = new Map(statusCounts.map(s => [s._id, s.count]));

    // Calculate total contracts created in period
    const totalCreated = statusCounts.reduce((sum, s) => sum + s.count, 0);

    // Build funnel stages
    // For funnel: count at each stage = contracts that reached OR passed that stage
    // nhap: all contracts start here
    // cho_duyet: contracts that moved past nhap (cho_duyet + khach_duyet + ra_hop_dong)
    // khach_duyet: contracts that moved past cho_duyet (khach_duyet + ra_hop_dong)
    // ra_hop_dong: contracts that completed

    const choDuyetCount = countMap.get('cho_duyet') || 0;
    const khachDuyetCount = countMap.get('khach_duyet') || 0;
    const raHopDongCount = countMap.get('ra_hop_dong') || 0;
    const huyCount = countMap.get('huy') || 0;

    // Cumulative counts for funnel visualization
    const funnelCounts = {
      nhap: totalCreated, // All contracts started
      cho_duyet: choDuyetCount + khachDuyetCount + raHopDongCount, // Moved past nhap
      khach_duyet: khachDuyetCount + raHopDongCount, // Moved past cho_duyet
      ra_hop_dong: raHopDongCount // Completed
    };

    const funnel: FunnelStage[] = FUNNEL_STATUS_ORDER.map((status, index) => {
      const count = funnelCounts[status as keyof typeof funnelCounts];
      const prevCount = index > 0
        ? funnelCounts[FUNNEL_STATUS_ORDER[index - 1] as keyof typeof funnelCounts]
        : count;

      return {
        status,
        statusText: getStatusText(status),
        count,
        percentage: totalCreated > 0 ? Math.round((count / totalCreated) * 100 * 100) / 100 : 0,
        dropoffRate: prevCount > 0 ? Math.round(((prevCount - count) / prevCount) * 100 * 100) / 100 : 0,
        color: getStatusChartColor(status)
      };
    });

    // Add cancelled as separate metric
    funnel.push({
      status: 'huy',
      statusText: getStatusText('huy'),
      count: huyCount,
      percentage: totalCreated > 0 ? Math.round((huyCount / totalCreated) * 100 * 100) / 100 : 0,
      dropoffRate: 0,
      color: getStatusChartColor('huy')
    });

    const response: ConversionFunnelResponse = {
      funnel,
      timeRange,
      dateRange: {
        start: start.toISOString(),
        end: end.toISOString()
      },
      summary: {
        totalCreated,
        totalCompleted: raHopDongCount,
        totalCancelled: huyCount,
        overallConversionRate: totalCreated > 0
          ? Math.round((raHopDongCount / totalCreated) * 100 * 100) / 100
          : 0
      }
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Conversion funnel error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
