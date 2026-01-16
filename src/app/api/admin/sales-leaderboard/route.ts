import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import Contract from '@/models/Contract';
import User from '@/models/User';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';

export interface SalesLeaderboardEntry {
  userId: string;
  username: string;
  totalContracts: number;
  completedContracts: number;
  cancelledContracts: number;
  totalRevenue: number;
  conversionRate: number;
  rank: number;
}

export interface SalesLeaderboardResponse {
  leaderboard: SalesLeaderboardEntry[];
  timeRange: 'week' | 'month';
  dateRange: { start: string; end: string };
  totals: {
    totalContracts: number;
    totalRevenue: number;
    avgConversionRate: number;
  };
}

// Calculate date range based on time range type
function getDateRange(timeRange: 'week' | 'month'): { start: Date; end: Date } {
  const now = new Date();
  const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

  let start: Date;
  if (timeRange === 'week') {
    // Get start of current week (Monday)
    const dayOfWeek = now.getDay();
    const diff = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // Adjust for Monday start
    start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - diff, 0, 0, 0, 0);
  } else {
    // Get start of current month
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

    // Parse query params
    const { searchParams } = new URL(request.url);
    const timeRange = (searchParams.get('timeRange') as 'week' | 'month') || 'month';
    const userId = searchParams.get('userId'); // Optional filter for specific user

    const { start, end } = getDateRange(timeRange);

    // Build match condition
    const matchCondition: Record<string, unknown> = {
      createdAt: { $gte: start, $lte: end }
    };

    // If filtering by specific user
    if (userId) {
      matchCondition.createdBy = new mongoose.Types.ObjectId(userId);
    }

    // Get all sales users (role='user')
    const salesUsers = await User.find({ role: 'user', isActive: true })
      .select('_id username')
      .lean();

    // If no specific user filter, only include sales users
    if (!userId) {
      const salesUserIds = salesUsers.map(u => u._id);
      matchCondition.createdBy = { $in: salesUserIds };
    }

    // Aggregate sales performance
    const salesStats = await Contract.aggregate([
      { $match: matchCondition },
      {
        $group: {
          _id: '$createdBy',
          totalContracts: { $sum: 1 },
          completedContracts: {
            $sum: { $cond: [{ $eq: ['$status', 'ra_hop_dong'] }, 1, 0] }
          },
          cancelledContracts: {
            $sum: { $cond: [{ $eq: ['$status', 'huy'] }, 1, 0] }
          },
          totalRevenue: {
            $sum: { $cond: [{ $eq: ['$status', 'ra_hop_dong'] }, '$tongPhi', 0] }
          }
        }
      },
      {
        // Calculate conversion rate for sorting
        $addFields: {
          conversionRate: {
            $cond: [
              { $gt: ['$totalContracts', 0] },
              { $multiply: [{ $divide: ['$completedContracts', '$totalContracts'] }, 100] },
              0
            ]
          }
        }
      },
      // Sort: completedContracts → conversionRate → totalContracts (all descending)
      { $sort: { completedContracts: -1, conversionRate: -1, totalContracts: -1 } }
    ]);

    // Create user lookup map
    const userMap = new Map(salesUsers.map(u => [u._id.toString(), u.username]));

    // Build leaderboard with ranks
    const leaderboard: SalesLeaderboardEntry[] = salesStats.map((stat, index) => ({
      userId: stat._id.toString(),
      username: userMap.get(stat._id.toString()) || 'Unknown',
      totalContracts: stat.totalContracts,
      completedContracts: stat.completedContracts,
      cancelledContracts: stat.cancelledContracts,
      totalRevenue: stat.totalRevenue,
      conversionRate: stat.totalContracts > 0
        ? Math.round((stat.completedContracts / stat.totalContracts) * 100 * 100) / 100
        : 0,
      rank: index + 1
    }));

    // Add users with no contracts in the period
    if (!userId) {
      const usersWithStats = new Set(salesStats.map(s => s._id.toString()));
      salesUsers.forEach(user => {
        if (!usersWithStats.has(user._id.toString())) {
          leaderboard.push({
            userId: user._id.toString(),
            username: user.username,
            totalContracts: 0,
            completedContracts: 0,
            cancelledContracts: 0,
            totalRevenue: 0,
            conversionRate: 0,
            rank: leaderboard.length + 1
          });
        }
      });
    }

    // Calculate totals
    const totals = {
      totalContracts: leaderboard.reduce((sum, e) => sum + e.totalContracts, 0),
      totalRevenue: leaderboard.reduce((sum, e) => sum + e.totalRevenue, 0),
      avgConversionRate: leaderboard.length > 0
        ? Math.round(leaderboard.reduce((sum, e) => sum + e.conversionRate, 0) / leaderboard.filter(e => e.totalContracts > 0).length * 100) / 100 || 0
        : 0
    };

    const response: SalesLeaderboardResponse = {
      leaderboard,
      timeRange,
      dateRange: {
        start: start.toISOString(),
        end: end.toISOString()
      },
      totals
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Sales leaderboard error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
