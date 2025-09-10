import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import Contract from '@/models/Contract';
import { requireAuth } from '@/lib/auth';

// POST /api/contracts/bulk-delete - Xóa nhiều contracts cùng lúc
export async function POST(request: NextRequest) {
  try {
    const user = requireAuth(request);
    await connectToDatabase();

    const body = await request.json();
    const { contractIds } = body;

    // Validate input
    if (!contractIds || !Array.isArray(contractIds) || contractIds.length === 0) {
      return NextResponse.json(
        { error: 'Danh sách hợp đồng không hợp lệ' },
        { status: 400 }
      );
    }

    // Find all contracts to delete
    const contracts = await Contract.find({ _id: { $in: contractIds } });

    const results = {
      success: [] as string[],
      errors: [] as { id: string; error: string }[]
    };

    // Process each contract
    for (const contract of contracts) {
      try {
        // Check permissions - User chỉ xóa được contract của mình, admin xóa tất cả
        if (user.role !== 'admin' && contract.createdBy !== user.userId) {
          results.errors.push({
            id: contract._id.toString(),
            error: 'Không có quyền xóa hợp đồng này'
          });
          continue;
        }

        // Check if contract can be deleted (only 'nhap' status)
        if (!contract.canEdit()) {
          results.errors.push({
            id: contract._id.toString(),
            error: 'Chỉ có thể xóa hợp đồng ở trạng thái nháp'
          });
          continue;
        }

        // Delete the contract
        await Contract.findByIdAndDelete(contract._id);
        results.success.push(contract._id.toString());

      } catch (error) {
        console.error(`Error deleting contract ${contract._id}:`, error);
        results.errors.push({
          id: contract._id.toString(),
          error: 'Lỗi khi xóa hợp đồng'
        });
      }
    }

    // Check for contracts that weren't found
    const foundIds = contracts.map(c => c._id.toString());
    const notFoundIds = contractIds.filter((id: string) => !foundIds.includes(id));
    
    for (const id of notFoundIds) {
      results.errors.push({
        id,
        error: 'Không tìm thấy hợp đồng'
      });
    }

    // Return results
    const totalRequested = contractIds.length;
    const successCount = results.success.length;
    const errorCount = results.errors.length;

    return NextResponse.json({
      message: `Đã xóa ${successCount}/${totalRequested} hợp đồng`,
      results,
      summary: {
        total: totalRequested,
        success: successCount,
        errors: errorCount
      }
    });

  } catch (error: any) {
    console.error('Bulk delete contracts error:', error);
    
    if (error.message === 'Authentication required') {
      return NextResponse.json(
        { error: error.message },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}