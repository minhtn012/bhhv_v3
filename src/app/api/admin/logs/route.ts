import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import SystemLog from '@/models/SystemLog';
import { withMiddleware, withAdmin, withApiLogger } from '@/middleware';

export async function GET(request: NextRequest) {
  return withMiddleware(
    request,
    async () => getLogsHandler(request),
    [withAdmin, withApiLogger]
  );
}

async function getLogsHandler(request: NextRequest) {
  try {
    await connectToDatabase();

    const { searchParams } = new URL(request.url);

    // Query filters
    const level = searchParams.get('level');
    const path = searchParams.get('path');
    const userId = searchParams.get('userId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const search = searchParams.get('search');

    // Pagination
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const skip = (page - 1) * limit;

    // Build filter
    const filter: Record<string, any> = {};

    if (level) {
      filter.level = level;
    }

    if (path) {
      filter.path = { $regex: path, $options: 'i' };
    }

    if (userId) {
      filter.userId = userId;
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
        { message: { $regex: search, $options: 'i' } },
        { error: { $regex: search, $options: 'i' } },
        { path: { $regex: search, $options: 'i' } },
      ];
    }

    // Execute query
    const [logs, total] = await Promise.all([
      SystemLog.find(filter)
        .sort({ timestamp: -1 })
        .limit(limit)
        .skip(skip)
        .populate('userId', 'username email')
        .lean(),
      SystemLog.countDocuments(filter),
    ]);

    // Get stats
    const stats = await SystemLog.aggregate([
      { $match: filter },
      {
        $group: {
          _id: '$level',
          count: { $sum: 1 },
        },
      },
    ]);

    return NextResponse.json({
      logs,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      stats: stats.reduce((acc, { _id, count }) => {
        acc[_id] = count;
        return acc;
      }, {} as Record<string, number>),
    });

  } catch (error) {
    console.error('Failed to fetch logs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch logs' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  return withMiddleware(
    request,
    async () => deleteLogsHandler(request),
    [withAdmin, withApiLogger]
  );
}

async function deleteLogsHandler(request: NextRequest) {
  try {
    await connectToDatabase();

    const { searchParams } = new URL(request.url);
    const olderThan = searchParams.get('olderThan'); // days

    if (olderThan) {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - parseInt(olderThan));

      const result = await SystemLog.deleteMany({
        timestamp: { $lt: cutoffDate },
      });

      return NextResponse.json({
        message: `Deleted ${result.deletedCount} logs older than ${olderThan} days`,
        deletedCount: result.deletedCount,
      });
    }

    return NextResponse.json(
      { error: 'Please specify olderThan parameter (in days)' },
      { status: 400 }
    );

  } catch (error) {
    console.error('Failed to delete logs:', error);
    return NextResponse.json(
      { error: 'Failed to delete logs' },
      { status: 500 }
    );
  }
}
