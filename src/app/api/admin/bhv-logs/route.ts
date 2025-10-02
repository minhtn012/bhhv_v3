import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import BhvRequestLog from '@/models/BhvRequestLog';
import { withMiddleware, withAdmin, withApiLogger } from '@/middleware';

export async function GET(request: NextRequest) {
  return withMiddleware(
    request,
    async () => getBhvLogsHandler(request),
    [withAdmin, withApiLogger]
  );
}

async function getBhvLogsHandler(request: NextRequest) {
  try {
    await connectToDatabase();

    const { searchParams } = new URL(request.url);

    // Query filters
    const contractId = searchParams.get('contractId');
    const success = searchParams.get('success');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const search = searchParams.get('search');

    // Pagination
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const skip = (page - 1) * limit;

    // Build filter
    const filter: Record<string, any> = {};

    if (contractId) {
      filter.contractId = contractId;
    }

    if (success !== null && success !== undefined) {
      filter.success = success === 'true';
    }

    if (startDate || endDate) {
      filter.timestamp = {};
      if (startDate) {
        filter.timestamp.$gte = new Date(startDate);
      }
      if (endDate) {
        filter.timestamp.$lte = new Date(endDate);
      }
    }

    if (search) {
      filter.$or = [
        { contractNumber: { $regex: search, $options: 'i' } },
        { errorMessage: { $regex: search, $options: 'i' } },
      ];
    }

    // Execute query
    const [logs, total] = await Promise.all([
      BhvRequestLog.find(filter)
        .sort({ timestamp: -1 })
        .limit(limit)
        .skip(skip)
        .populate('contractId', 'contractNumber')
        .populate('userId', 'username email')
        .lean(),
      BhvRequestLog.countDocuments(filter),
    ]);

    // Get stats for last 24 hours
    const last24h = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const stats = await BhvRequestLog.aggregate([
      { $match: { timestamp: { $gte: last24h } } },
      {
        $facet: {
          total: [{ $count: 'count' }],
          successful: [{ $match: { success: true } }, { $count: 'count' }],
          failed: [{ $match: { success: false } }, { $count: 'count' }],
          avgDuration: [{ $group: { _id: null, avg: { $avg: '$duration' } } }],
        },
      },
    ]);

    const statsData = {
      total: stats[0]?.total[0]?.count || 0,
      successful: stats[0]?.successful[0]?.count || 0,
      failed: stats[0]?.failed[0]?.count || 0,
      avgDuration: Math.round(stats[0]?.avgDuration[0]?.avg || 0),
      successRate:
        stats[0]?.total[0]?.count > 0
          ? ((stats[0]?.successful[0]?.count / stats[0]?.total[0]?.count) * 100).toFixed(1)
          : '0',
    };

    return NextResponse.json({
      logs,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      stats: statsData,
    });
  } catch (error) {
    console.error('Failed to fetch BHV logs:', error);
    return NextResponse.json({ error: 'Failed to fetch BHV logs' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  return withMiddleware(
    request,
    async () => deleteBhvLogsHandler(request),
    [withAdmin, withApiLogger]
  );
}

async function deleteBhvLogsHandler(request: NextRequest) {
  try {
    await connectToDatabase();

    const { searchParams } = new URL(request.url);
    const olderThan = searchParams.get('olderThan'); // days

    if (olderThan) {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - parseInt(olderThan));

      const result = await BhvRequestLog.deleteMany({
        timestamp: { $lt: cutoffDate },
      });

      return NextResponse.json({
        message: `Deleted ${result.deletedCount} BHV logs older than ${olderThan} days`,
        deletedCount: result.deletedCount,
      });
    }

    return NextResponse.json(
      { error: 'Please specify olderThan parameter (in days)' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Failed to delete BHV logs:', error);
    return NextResponse.json({ error: 'Failed to delete BHV logs' }, { status: 500 });
  }
}
