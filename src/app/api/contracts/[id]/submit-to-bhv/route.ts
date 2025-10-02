import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import Contract from '@/models/Contract';
import { transformContractToBhvFormat } from '@/lib/bhvDataMapper';
import { bhvApiClient } from '@/lib/bhvApiClient';
import { logger } from '@/lib/logger';
import { withApiLogger } from '@/middleware/apiLogger';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withApiLogger(request, async () => postHandler(request, params));
}

async function postHandler(
  request: NextRequest,
  params: Promise<{ id: string }>
) {
  const startTime = Date.now();
  let contractId: string | undefined;

  try {
    await connectToDatabase();

    const { id } = await params;
    contractId = id;

    if (!contractId) {
      logger.warn('BHV submission attempt without contract ID');
      return NextResponse.json(
        { success: false, error: 'Contract ID is required' },
        { status: 400 }
      );
    }

    logger.bhvSubmission(contractId, 'Started', { timestamp: new Date().toISOString() });

    // Get cookies from request body
    const body = await request.json().catch(() => ({}));
    const { cookies } = body;

    logger.debug('BHV submission request details', {
      contractId,
      hasCookies: !!cookies,
      cookieKeys: cookies ? Object.keys(cookies) : [],
    });

    // Fetch contract from database
    const contract = await Contract.findById(contractId).lean();
    if (!contract) {
      logger.warn('Contract not found for BHV submission', { contractId });
      return NextResponse.json(
        { success: false, error: 'Contract not found' },
        { status: 404 }
      );
    }

    logger.bhvSubmission(contractId, 'Contract Retrieved', {
      contractNumber: (contract as any).contractNumber,
      status: (contract as any).status,
      customerName: (contract as any).khachHang?.hoVaTen,
    });

    // Check if contract is in valid status for BHV submission
    const validStatuses = ['khach_duyet', 'ra_hop_dong'];
    if (!validStatuses.includes((contract as any).status)) {
      logger.warn('Invalid contract status for BHV submission', {
        contractId,
        currentStatus: (contract as any).status,
        validStatuses,
      });
      return NextResponse.json(
        {
          success: false,
          error: `Hợp đồng phải ở trạng thái 'Khách duyệt' hoặc 'Ra hợp đồng' để tạo hợp đồng BHV. Trạng thái hiện tại: ${(contract as any).status}`
        },
        { status: 400 }
      );
    }

    // Check if BHV contract already exists
    if (contract.bhvContractNumber) {
      logger.warn('BHV contract already exists', {
        contractId,
        bhvContractNumber: contract.bhvContractNumber,
      });
      return NextResponse.json(
        {
          success: false,
          error: `Hợp đồng BHV đã được tạo trước đó với số hợp đồng: ${contract.bhvContractNumber}`
        },
        { status: 400 }
      );
    }

    // Transform contract data to BHV format (contract already has dates from DB)
    logger.bhvSubmission(contractId, 'Transforming Data', {
      ngayBatDauBaoHiem: contract.ngayBatDauBaoHiem,
      ngayKetThucBaoHiem: contract.ngayKetThucBaoHiem,
      giaTriXe: (contract as any).giaTriXe,
      loaiHinhKinhDoanh: (contract as any).loaiHinhKinhDoanh,
    });

    const bhvRequestData = transformContractToBhvFormat(contract);

    logger.debug('BHV request data prepared', {
      contractId,
      bhvRequestDataKeys: Object.keys(bhvRequestData),
      // Log sample data (be careful not to log sensitive info in production)
      carKindValue: bhvRequestData.carKindValue,
      insuranceGoalValue: bhvRequestData.insuranceGoalValue,
    });

    // Submit to BHV API with fresh cookies
    logger.bhvSubmission(contractId, 'Submitting to BHV API', {
      endpoint: 'submitContract',
      hasCookies: !!cookies,
    });

    const bhvResult = await bhvApiClient.submitContract(bhvRequestData, cookies);

    if (bhvResult.success) {
      const duration = Date.now() - startTime;

      logger.bhvSubmission(contractId!, 'Success', {
        duration: `${duration}ms`,
        hasPdf: !!bhvResult.pdfBase64,
        pdfSize: bhvResult.pdfBase64 ? `${(bhvResult.pdfBase64.length / 1024).toFixed(2)}KB` : 'N/A',
      });

      // Optionally add submission history
      // await Contract.findByIdAndUpdate(contractId, {
      //   $push: {
      //     statusHistory: {
      //       status: 'bhv_submitted',
      //       changedBy: 'system',
      //       changedAt: new Date(),
      //       note: 'Successfully submitted to BHV system'
      //     }
      //   }
      // });

      return NextResponse.json({
        success: true,
        message: 'Hợp đồng đã được tạo thành công trên hệ thống BHV',
        pdfBase64: bhvResult.pdfBase64,
        contractNumber: contract.contractNumber
      });

    } else {
      const duration = Date.now() - startTime;

      logger.bhvError(contractId!, 'BHV API Returned Error', bhvResult.error, {
        duration: `${duration}ms`,
        errorMessage: bhvResult.error,
      });

      return NextResponse.json(
        {
          success: false,
          error: `Lỗi khi tạo hợp đồng BHV: ${bhvResult.error}`
        },
        { status: 500 }
      );
    }

  } catch (error) {
    const duration = Date.now() - startTime;

    logger.bhvError(
      contractId || 'unknown',
      'Unexpected Exception',
      error,
      {
        duration: `${duration}ms`,
        errorType: error instanceof Error ? error.constructor.name : typeof error,
      }
    );

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error'
      },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Optional: Get BHV submission status/history for a contract
  return NextResponse.json(
    { message: 'BHV submission status endpoint - to be implemented if needed' },
    { status: 200 }
  );
}