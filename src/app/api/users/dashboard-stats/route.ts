import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import Contract from '@/models/Contract';
import jwt from 'jsonwebtoken';
import { getStatusChartColor, getStatusText } from '@/utils/contract-status';

interface UserDashboardStats {
  overview: {
    totalContracts: number;
    monthlyContracts: number;
    activeContracts: number;
    completedContracts: number;
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
  recentContracts: Array<{
    _id: string;
    contractNumber: string;
    status: string;
    tongPhi: number;
    createdAt: Date;
    customerName: string;
  }>;
}

export async function GET(request: NextRequest) {
  try {
    // Kiểm tra authentication
    const token = request.cookies.get('token')?.value || request.headers.get('authorization')?.split(' ')[1];

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let decoded: { userId: string; username: string; role: string };
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key') as { userId: string; username: string; role: string };
    } catch {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    await connectToDatabase();

    // Lấy ngày hiện tại và tháng hiện tại
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // Filter contracts by user - contracts thuộc về user này
    const contractFilter = { createdBy: decoded.username };

    // 1. Overview Statistics
    const [
      totalContracts,
      monthlyContracts,
      activeContracts,
      completedContracts
    ] = await Promise.all([
      Contract.countDocuments(contractFilter),
      Contract.countDocuments({ ...contractFilter, createdAt: { $gte: startOfMonth } }),
      Contract.countDocuments({ ...contractFilter, status: { $in: ['cho_duyet', 'khach_duyet'] } }),
      Contract.countDocuments({ ...contractFilter, status: 'ra_hop_dong' })
    ]);

    // 2. Status Distribution
    const statusStats = await Contract.aggregate([
      { $match: contractFilter },
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);


    const statusDistribution = statusStats.map(stat => ({
      status: stat._id,
      statusText: getStatusText(stat._id),
      count: stat.count,
      percentage: totalContracts > 0 ? (stat.count / totalContracts) * 100 : 0,
      color: getStatusChartColor(stat._id)
    }));

    // 3. Recent Activity (từ statusHistory của contracts của user)
    const recentActivity = await Contract.aggregate([
      { $match: contractFilter },
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

    // 4. Recent Contracts
    const recentContracts = await Contract.find(contractFilter)
      .sort({ createdAt: -1 })
      .limit(5)
      .select('contractNumber status tongPhi createdAt thongTinXe.chuXe.ten')
      .lean();

    const formattedRecentContracts = recentContracts.map(contract => ({
      _id: contract._id,
      contractNumber: contract.contractNumber,
      status: contract.status,
      tongPhi: contract.tongPhi || 0,
      createdAt: contract.createdAt,
      customerName: contract.thongTinXe?.chuXe?.ten || 'N/A'
    }));

    const userDashboardStats: UserDashboardStats = {
      overview: {
        totalContracts,
        monthlyContracts,
        activeContracts,
        completedContracts
      },
      statusDistribution,
      recentActivity,
      recentContracts: formattedRecentContracts
    };

    return NextResponse.json(userDashboardStats);

  } catch (error) {
    console.error('User dashboard stats error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}