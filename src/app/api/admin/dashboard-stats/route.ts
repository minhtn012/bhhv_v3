import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import Contract from '@/models/Contract';
import jwt from 'jsonwebtoken';

interface DashboardStats {
  overview: {
    totalContracts: number;
    monthlyRevenue: number;
    pendingApproval: number;
    conversionRate: number;
    monthlyGrowth: number;
  };
  statusDistribution: Array<{
    status: string;
    statusText: string;
    count: number;
    percentage: number;
    color: string;
  }>;
  recentActivity: Array<{
    _id: string;
    contractNumber: string;
    action: string;
    timestamp: Date;
    user: string;
    status: string;
  }>;
  revenueChart: Array<{
    month: string;
    revenue: number;
    contracts: number;
  }>;
  performance: {
    avgProcessingTime: number;
    successRate: number;
    topPackages: Array<{
      package: string;
      count: number;
      revenue: number;
    }>;
  };
}

export async function GET(request: NextRequest) {
  try {
    // Kiểm tra authentication - ưu tiên cookie trước, rồi mới Authorization header
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

    // Chỉ admin mới có thể xem dashboard stats
    if (decoded.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 });
    }

    await connectToDatabase();

    // Lấy ngày hiện tại và tháng trước
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

    // 1. Overview Statistics
    const [
      totalContracts,
      monthlyContracts,
      lastMonthContracts,
      pendingApproval,
      completedContracts
    ] = await Promise.all([
      Contract.countDocuments(),
      Contract.countDocuments({ createdAt: { $gte: startOfMonth } }),
      Contract.countDocuments({
        createdAt: { $gte: startOfLastMonth, $lte: endOfLastMonth }
      }),
      Contract.countDocuments({ status: 'cho_duyet' }),
      Contract.countDocuments({ status: 'ra_hop_dong' })
    ]);

    // Tính doanh thu tháng này
    const monthlyRevenueResult = await Contract.aggregate([
      { $match: { createdAt: { $gte: startOfMonth }, status: 'ra_hop_dong' } },
      { $group: { _id: null, total: { $sum: '$tongPhi' } } }
    ]);
    const monthlyRevenue = monthlyRevenueResult[0]?.total || 0;

    // Tính tăng trưởng
    const monthlyGrowth = lastMonthContracts > 0
      ? ((monthlyContracts - lastMonthContracts) / lastMonthContracts) * 100
      : 0;

    // Tỷ lệ chuyển đổi (hợp đồng hoàn thành / tổng hợp đồng)
    const conversionRate = totalContracts > 0 ? (completedContracts / totalContracts) * 100 : 0;

    // 2. Status Distribution
    const statusStats = await Contract.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);

    const statusColors = {
      'nhap': '#64748b',      // gray
      'cho_duyet': '#f59e0b', // amber
      'khach_duyet': '#3b82f6', // blue
      'ra_hop_dong': '#10b981', // emerald
      'huy': '#ef4444'        // red
    };

    const statusTexts = {
      'nhap': 'Nháp',
      'cho_duyet': 'Chờ duyệt',
      'khach_duyet': 'Khách duyệt',
      'ra_hop_dong': 'Ra hợp đồng',
      'huy': 'Đã hủy'
    };

    const statusDistribution = statusStats.map(stat => ({
      status: stat._id,
      statusText: statusTexts[stat._id as keyof typeof statusTexts] || stat._id,
      count: stat.count,
      percentage: (stat.count / totalContracts) * 100,
      color: statusColors[stat._id as keyof typeof statusColors] || '#64748b'
    }));

    // 3. Recent Activity (từ statusHistory)
    const recentActivity = await Contract.aggregate([
      { $unwind: '$statusHistory' },
      { $sort: { 'statusHistory.changedAt': -1 } },
      { $limit: 10 },
      {
        $project: {
          contractNumber: 1,
          action: '$statusHistory.note',
          timestamp: '$statusHistory.changedAt',
          user: '$statusHistory.changedBy',
          status: '$statusHistory.status'
        }
      }
    ]);

    // 4. Revenue Chart (6 tháng gần nhất)
    const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);

    const revenueChart = await Contract.aggregate([
      {
        $match: {
          createdAt: { $gte: sixMonthsAgo },
          status: 'ra_hop_dong'
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          revenue: { $sum: '$tongPhi' },
          contracts: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);

    // Format revenue chart data
    const formattedRevenueChart = revenueChart.map(item => ({
      month: `${item._id.month}/${item._id.year}`,
      revenue: item.revenue,
      contracts: item.contracts
    }));

    // 5. Performance Metrics
    // Thời gian xử lý trung bình (từ tạo đến hoàn thành)
    const processingTimeResult = await Contract.aggregate([
      { $match: { status: 'ra_hop_dong' } },
      {
        $addFields: {
          processingTime: {
            $divide: [
              { $subtract: ['$updatedAt', '$createdAt'] },
              1000 * 60 * 60 * 24 // Convert to days
            ]
          }
        }
      },
      {
        $group: {
          _id: null,
          avgTime: { $avg: '$processingTime' }
        }
      }
    ]);

    const avgProcessingTime = processingTimeResult[0]?.avgTime || 0;

    // Top packages
    const topPackages = await Contract.aggregate([
      { $match: { status: 'ra_hop_dong' } },
      {
        $group: {
          _id: '$vatChatPackage.name',
          count: { $sum: 1 },
          revenue: { $sum: '$tongPhi' }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 5 },
      {
        $project: {
          package: '$_id',
          count: 1,
          revenue: 1,
          _id: 0
        }
      }
    ]);

    const successRate = totalContracts > 0 ? (completedContracts / totalContracts) * 100 : 0;

    const dashboardStats: DashboardStats = {
      overview: {
        totalContracts,
        monthlyRevenue,
        pendingApproval,
        conversionRate: Math.round(conversionRate * 100) / 100,
        monthlyGrowth: Math.round(monthlyGrowth * 100) / 100
      },
      statusDistribution,
      recentActivity,
      revenueChart: formattedRevenueChart,
      performance: {
        avgProcessingTime: Math.round(avgProcessingTime * 100) / 100,
        successRate: Math.round(successRate * 100) / 100,
        topPackages
      }
    };

    return NextResponse.json(dashboardStats);

  } catch (error) {
    console.error('Dashboard stats error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}