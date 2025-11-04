import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import Contract from '@/models/Contract';
import { transformContractToBhvFormat, transformContractToPremiumCheckFormat } from '@/lib/bhvDataMapper';
import { bhvApiClient } from '@/lib/bhvApiClient';
import { logger } from '@/lib/logger';
import { withApiLogger } from '@/middleware/apiLogger';
import { bhvLogger } from '@/lib/bhvLogger';
import { parseBhvHtmlResponse } from '@/utils/bhv-html-parser';

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
  let bhvLogId: string | null = null;

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

    // STEP 1: Always check premium first to get latest BHV prices (WITHOUT discount)
    logger.bhvSubmission(contractId, 'Checking Premium', {
      message: 'Getting original BHV prices before submission',
      ngayBatDauBaoHiem: contract.ngayBatDauBaoHiem,
      ngayKetThucBaoHiem: contract.ngayKetThucBaoHiem,
    });

    const premiumCheckData = transformContractToPremiumCheckFormat(contract);
    const premiumResult = await bhvApiClient.checkPremium(premiumCheckData, cookies);

    if (!premiumResult.success || !premiumResult.htmlData) {
      logger.bhvError(contractId, 'Premium Check Failed', premiumResult.error || 'No HTML data received', {
        premiumResult,
      });
      return NextResponse.json(
        {
          success: false,
          error: `Không thể kiểm tra giá từ BHV: ${premiumResult.error || 'Unknown error'}`
        },
        { status: 500 }
      );
    }

    // STEP 2: Parse and save original BHV prices to contract
    logger.bhvSubmission(contractId, 'Parsing Premium Data', {
      message: 'Extracting BHV premium information from response',
    });

    const premiumData = parseBhvHtmlResponse(premiumResult.htmlData);

    await Contract.findByIdAndUpdate(contractId, {
      bhvPremiums: {
        bhvc: premiumData.bhvc,
        tnds: premiumData.tnds,
        nntx: premiumData.nntx,
        total: premiumData.totalPremium,
        checkedAt: new Date(),
        success: true
      }
    });

    logger.bhvSubmission(contractId, 'Premium Saved', {
      bhvc: premiumData.bhvc,
      tnds: premiumData.tnds,
      nntx: premiumData.nntx,
      total: premiumData.totalPremium,
    });

    // STEP 3: Reload contract with updated bhvPremiums
    const updatedContract = await Contract.findById(contractId).lean();
    if (!updatedContract) {
      return NextResponse.json(
        { success: false, error: 'Failed to reload contract after premium check' },
        { status: 500 }
      );
    }

    // STEP 4: Transform contract data to BHV format (now WITH discount calculated from bhvPremiums)
    logger.bhvSubmission(contractId, 'Transforming Data', {
      message: 'Preparing submission with discount applied',
      ngayBatDauBaoHiem: updatedContract.ngayBatDauBaoHiem,
      ngayKetThucBaoHiem: updatedContract.ngayKetThucBaoHiem,
      giaTriXe: (updatedContract as any).giaTriXe,
      loaiHinhKinhDoanh: (updatedContract as any).loaiHinhKinhDoanh,
      originalPrice: premiumData.totalPremium.afterTax,
      contractPrice: (updatedContract as any).tongPhi,
      discount: premiumData.totalPremium.afterTax - (updatedContract as any).tongPhi,
    });

    const bhvRequestData = transformContractToBhvFormat(updatedContract);

    // Get IP for tracking
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0].trim()
      || request.headers.get('x-real-ip')
      || 'unknown';

    // BHV Logger - Log request before sending
    bhvLogId = await bhvLogger.logRequest({
      contractId,
      contractNumber: (contract as any).contractNumber,
      requestPayload: bhvRequestData,
      cookies,
      userIp: ip,
    });

    // Legacy general logger
    logger.info('BHV API Request - Full Data', {
      contractId,
      contractNumber: (contract as any).contractNumber,
      bhvLogId,
      hasCookies: !!cookies,
      cookiePreview: cookies ? `${Object.keys(cookies).join(', ')}` : 'none',
    });

    // Submit to BHV API with fresh cookies
    const bhvResult = await bhvApiClient.submitContract(bhvRequestData, cookies);

    if (bhvResult.success) {
      const duration = Date.now() - startTime;

      // BHV Logger - Log success response
      if (bhvLogId) {
        await bhvLogger.logResponse(bhvLogId, {
          success: true,
          responseData: bhvResult.rawResponse,
          responseStatus: 200,
          bhvStatusCode: (bhvResult.rawResponse as any)?.status_code,
          pdfReceived: !!bhvResult.pdfBase64,
          pdfSize: bhvResult.pdfBase64?.length,
          duration,
        });
      }

      logger.bhvSubmission(contractId!, 'Success', {
        duration: `${duration}ms`,
        bhvLogId,
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
        contractNumber: contract.contractNumber,
        bhvPremiums: premiumData
      });

    } else {
      const duration = Date.now() - startTime;

      // BHV Logger - Log error
      if (bhvLogId) {
        await bhvLogger.logError(bhvLogId, {
          errorMessage: bhvResult.error || 'Unknown error',
          errorDetails: JSON.stringify(bhvResult.rawResponse),
          responseData: bhvResult.rawResponse,
          duration,
        });
      }

      logger.bhvError(contractId!, 'BHV API Returned Error', bhvResult.error, {
        duration: `${duration}ms`,
        bhvLogId,
        errorMessage: bhvResult.error,
        rawResponse: bhvResult.rawResponse,
        requestData: bhvRequestData,
        cookies: cookies ? Object.keys(cookies) : [],
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

    // BHV Logger - Log exception (if logId exists)
    if (bhvLogId) {
      await bhvLogger.logError(bhvLogId, {
        errorMessage: error instanceof Error ? error.message : String(error),
        errorDetails: error instanceof Error ? error.stack : undefined,
        duration,
      });
    }

    logger.bhvError(
      contractId || 'unknown',
      'Unexpected Exception',
      error,
      {
        duration: `${duration}ms`,
        bhvLogId,
        errorType: error instanceof Error ? error.constructor.name : typeof error,
        errorMessage: error instanceof Error ? error.message : String(error),
        errorStack: error instanceof Error ? error.stack : undefined,
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