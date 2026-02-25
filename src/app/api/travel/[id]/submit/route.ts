import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import TravelContract from '@/models/TravelContract';
import { requireAuth } from '@/lib/auth';
import { PacificCrossApiClient } from '@/providers/pacific-cross/api-client';
import { mapTravelToPacificCrossFormat, generateQuotePdfUrl } from '@/providers/pacific-cross/products/travel/mapper';
import { logError, logDebug } from '@/lib/errorLogger';
import type { TravelContractFormData } from '@/providers/pacific-cross/products/travel/types';

// POST /api/travel/[id]/submit - Create quote on Pacific Cross
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const user = requireAuth(request);
    await connectToDatabase();

    const contract = await TravelContract.findById(id);

    if (!contract) {
      return NextResponse.json(
        { error: 'Contract not found' },
        { status: 404 }
      );
    }

    // Only owner or admin
    if (
      user.role !== 'admin' &&
      contract.createdBy.toString() !== user.userId
    ) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }

    // Must be in nhap status
    if (contract.status !== 'nhap') {
      return NextResponse.json(
        { error: 'Contract must be in draft status to create quote' },
        { status: 400 }
      );
    }

    logDebug('Travel submit quote started', {
      operation: 'TRAVEL_SUBMIT_START',
      contractId: id,
      product: contract.product, plan: contract.plan
    });

    // Validate env at call time
    const envCheck = PacificCrossApiClient.validateEnv();
    if (!envCheck.valid) {
      logError(new Error('Pacific Cross env not configured'), {
        operation: 'TRAVEL_SUBMIT_ENV_CHECK',
        contractId: id,
        additionalInfo: { missing: envCheck.missing }
      });
      return NextResponse.json(
        { error: `Pacific Cross credentials not configured: ${envCheck.missing.join(', ')}` },
        { status: 500 }
      );
    }

    // Authenticate with Pacific Cross
    logDebug('TRAVEL_SUBMIT: Authenticating with Pacific Cross', { contractId: id });
    const client = new PacificCrossApiClient();
    const username = process.env.PACIFIC_CROSS_USERNAME!;
    const password = process.env.PACIFIC_CROSS_PASSWORD!;

    const authResponse = await client.authenticate(username, password);
    if (!authResponse.success) {
      logError(new Error('Pacific Cross auth failed'), {
        operation: 'TRAVEL_SUBMIT_AUTH',
        contractId: id,
        additionalInfo: { error: authResponse.error }
      });
      return NextResponse.json(
        { error: `Pacific Cross auth failed: ${authResponse.error}` },
        { status: 500 }
      );
    }

    // Refresh CSRF token
    logDebug('TRAVEL_SUBMIT: Refreshing CSRF token', { contractId: id, product: contract.product });
    const csrfRefreshed = await client.refreshCsrfToken(contract.product);
    if (!csrfRefreshed) {
      logError(new Error('CSRF token refresh failed'), {
        operation: 'TRAVEL_SUBMIT_CSRF',
        contractId: id
      });
    }

    // Validate dates before submit (must be >= tomorrow)
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);

    const periodStart = new Date(contract.period.dateFrom);
    periodStart.setHours(0, 0, 0, 0);

    if (periodStart < tomorrow) {
      return NextResponse.json(
        { error: 'Ngay hieu luc phai tu ngay mai tro di. Vui long cap nhat ngay truoc khi tao bao gia.' },
        { status: 400 }
      );
    }

    // Build payload for Pacific Cross
    const formData: TravelContractFormData = {
      owner: contract.owner,
      period: contract.period,
      product: contract.product,
      plan: contract.plan,
      insuredPersons: contract.insuredPersons,
      refNo: contract.refNo || '',
      pnrNo: contract.pnrNo || '',
      itinerary: contract.itinerary || '',
      note: contract.note || ''
    };

    const csrfToken = client.getCsrfToken() || '';
    const payload = mapTravelToPacificCrossFormat(formData, csrfToken, true);

    logDebug('TRAVEL_SUBMIT: Payload built', {
      contractId: id,
      payloadKeys: Object.keys(payload),
      insuredCount: contract.insuredPersons?.length
    });

    // Create quote (is_quote=1)
    logDebug('TRAVEL_SUBMIT: Creating quote on Pacific Cross', { contractId: id });
    const quoteResponse = await client.createCertificate(payload, true);

    if (!quoteResponse.success) {
      logError(new Error('Quote creation failed'), {
        operation: 'TRAVEL_SUBMIT_QUOTE',
        contractId: id,
        additionalInfo: { error: quoteResponse.error, rawResponse: quoteResponse.rawResponse }
      });
      return NextResponse.json(
        { error: `Quote creation failed: ${quoteResponse.error}` },
        { status: 500 }
      );
    }

    logDebug('Travel quote created successfully', {
      operation: 'TRAVEL_SUBMIT_SUCCESS',
      contractId: id,
      certId: quoteResponse.certId, certNo: quoteResponse.certNo
    });

    // Update contract with Pacific Cross cert ID and PDF URL
    contract.pacificCrossCertId = quoteResponse.certId;
    contract.pacificCrossCertNo = quoteResponse.certNo;
    if (quoteResponse.certId) {
      contract.quotePdfUrl = generateQuotePdfUrl(quoteResponse.certId);
    }

    // Fetch premium from edit page
    let totalPremium = 0;
    if (quoteResponse.certId) {
      logDebug('TRAVEL_SUBMIT: Fetching premium from edit page', { certId: quoteResponse.certId });
      const premiumResult = await client.getCertificatePremium(quoteResponse.certId);

      if (premiumResult.success && premiumResult.premium) {
        totalPremium = premiumResult.premium;
        logDebug('TRAVEL_SUBMIT: Premium fetched', {
          operation: 'TRAVEL_SUBMIT_PREMIUM',
          contractId: id,
          totalPremium
        });
      } else {
        logDebug('TRAVEL_SUBMIT: Premium fetch failed', { error: premiumResult.error });
      }
    }

    contract.totalPremium = totalPremium;
    contract.status = 'cho_duyet';
    contract.set('_statusChangedBy', user.userId);
    contract.set('_statusChangeNote', 'Tao bao gia tren Pacific Cross');

    await contract.save();

    return NextResponse.json({
      message: 'Tao bao gia thanh cong',
      certId: quoteResponse.certId,
      certNo: quoteResponse.certNo,
      quotePdfUrl: contract.quotePdfUrl,
      totalPremium,
      contract: {
        id: contract._id,
        contractNumber: contract.contractNumber,
        status: contract.status,
        totalPremium,
        quotePdfUrl: contract.quotePdfUrl
      }
    });

  } catch (error: unknown) {
    logError(error, {
      operation: 'TRAVEL_SUBMIT_QUOTE',
      contractId: id,
      path: request.url,
      method: 'POST',
    });

    if (error instanceof Error && error.message === 'Authentication required') {
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
