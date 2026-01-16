import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import Contract from '@/models/Contract';
import User from '@/models/User';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';

export interface StatusTransitionTime {
  from: string;
  to: string;
  fromText: string;
  toText: string;
  avgHours: number;
  avgDays: number;
  minHours: number;
  maxHours: number;
  sampleCount: number;
}

export interface TimeAnalyticsResponse {
  transitions: StatusTransitionTime[];
  timeRange: 'week' | 'month';
  dateRange: { start: string; end: string };
  summary: {
    avgTotalPipelineHours: number;
    avgTotalPipelineDays: number;
    fastestCompletionHours: number;
    slowestCompletionHours: number;
    completedContractsAnalyzed: number;
  };
}

// Status display text mapping
const STATUS_TEXT: Record<string, string> = {
  nhap: 'Nháp',
  cho_duyet: 'Chờ duyệt',
  khach_duyet: 'Khách duyệt',
  ra_hop_dong: 'Ra hợp đồng'
};

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

    // Build match condition - only completed contracts with status history
    const matchCondition: Record<string, unknown> = {
      createdAt: { $gte: start, $lte: end },
      status: 'ra_hop_dong',
      'statusHistory.1': { $exists: true } // At least 2 status history entries
    };

    if (userId) {
      matchCondition.createdBy = new mongoose.Types.ObjectId(userId);
    } else {
      const salesUsers = await User.find({ role: 'user' }).select('_id').lean();
      matchCondition.createdBy = { $in: salesUsers.map(u => u._id) };
    }

    // Get contracts with status history for analysis
    const contracts = await Contract.find(matchCondition)
      .select('statusHistory createdAt')
      .lean();

    // Define transitions to analyze
    const transitionPairs = [
      { from: 'nhap', to: 'cho_duyet' },
      { from: 'cho_duyet', to: 'khach_duyet' },
      { from: 'khach_duyet', to: 'ra_hop_dong' }
    ];

    // Calculate time for each transition
    const transitionTimes: Record<string, number[]> = {};
    const totalPipelineTimes: number[] = [];

    contracts.forEach(contract => {
      const history = contract.statusHistory || [];
      if (history.length < 2) return;

      // Sort history by changedAt
      const sortedHistory = [...history].sort(
        (a, b) => new Date(a.changedAt).getTime() - new Date(b.changedAt).getTime()
      );

      // Build status -> timestamp map (first occurrence)
      const statusTimestamps: Record<string, Date> = {};
      sortedHistory.forEach(entry => {
        if (!statusTimestamps[entry.status]) {
          statusTimestamps[entry.status] = new Date(entry.changedAt);
        }
      });

      // Calculate transition times
      transitionPairs.forEach(pair => {
        const fromTime = statusTimestamps[pair.from];
        const toTime = statusTimestamps[pair.to];

        if (fromTime && toTime && toTime > fromTime) {
          const key = `${pair.from}_${pair.to}`;
          if (!transitionTimes[key]) transitionTimes[key] = [];
          const hours = (toTime.getTime() - fromTime.getTime()) / (1000 * 60 * 60);
          transitionTimes[key].push(hours);
        }
      });

      // Calculate total pipeline time (nhap to ra_hop_dong)
      const nhapTime = statusTimestamps['nhap'];
      const completedTime = statusTimestamps['ra_hop_dong'];
      if (nhapTime && completedTime && completedTime > nhapTime) {
        const hours = (completedTime.getTime() - nhapTime.getTime()) / (1000 * 60 * 60);
        totalPipelineTimes.push(hours);
      }
    });

    // Build transition stats
    const transitions: StatusTransitionTime[] = transitionPairs.map(pair => {
      const key = `${pair.from}_${pair.to}`;
      const times = transitionTimes[key] || [];

      if (times.length === 0) {
        return {
          from: pair.from,
          to: pair.to,
          fromText: STATUS_TEXT[pair.from],
          toText: STATUS_TEXT[pair.to],
          avgHours: 0,
          avgDays: 0,
          minHours: 0,
          maxHours: 0,
          sampleCount: 0
        };
      }

      const avg = times.reduce((a, b) => a + b, 0) / times.length;
      return {
        from: pair.from,
        to: pair.to,
        fromText: STATUS_TEXT[pair.from],
        toText: STATUS_TEXT[pair.to],
        avgHours: Math.round(avg * 100) / 100,
        avgDays: Math.round((avg / 24) * 100) / 100,
        minHours: Math.round(Math.min(...times) * 100) / 100,
        maxHours: Math.round(Math.max(...times) * 100) / 100,
        sampleCount: times.length
      };
    });

    // Calculate summary
    const avgTotalPipelineHours = totalPipelineTimes.length > 0
      ? totalPipelineTimes.reduce((a, b) => a + b, 0) / totalPipelineTimes.length
      : 0;

    const response: TimeAnalyticsResponse = {
      transitions,
      timeRange,
      dateRange: {
        start: start.toISOString(),
        end: end.toISOString()
      },
      summary: {
        avgTotalPipelineHours: Math.round(avgTotalPipelineHours * 100) / 100,
        avgTotalPipelineDays: Math.round((avgTotalPipelineHours / 24) * 100) / 100,
        fastestCompletionHours: totalPipelineTimes.length > 0
          ? Math.round(Math.min(...totalPipelineTimes) * 100) / 100
          : 0,
        slowestCompletionHours: totalPipelineTimes.length > 0
          ? Math.round(Math.max(...totalPipelineTimes) * 100) / 100
          : 0,
        completedContractsAnalyzed: totalPipelineTimes.length
      }
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Time analytics error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
