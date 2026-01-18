import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import TravelContract from '@/models/TravelContract';
import { requireAuth } from '@/lib/auth';
import { PacificCrossApiClient } from '@/providers/pacific-cross/api-client';
import { mapTravelToPacificCrossFormat } from '@/providers/pacific-cross/products/travel/mapper';
import { logError, logInfo, logDebug } from '@/lib/errorLogger';
import type { TravelContractFormData } from '@/providers/pacific-cross/products/travel/types';

// POST /api/travel/[id]/confirm - Confirm contract on Pacific Cross (admin only)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = requireAuth(request);

    // Admin only
    if (user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Admin only' },
        { status: 403 }
      );
    }

    await connectToDatabase();

    const { id } = await params;
    const contract = await TravelContract.findById(id);

    if (!contract) {
      return NextResponse.json(
        { error: 'Contract not found' },
        { status: 404 }
      );
    }

    // Must be in cho_duyet status (after quote submitted)
    if (contract.status !== 'cho_duyet') {
      return NextResponse.json(
        { error: 'Contract must have a quote to confirm' },
        { status: 400 }
      );
    }

    // Must have Pacific Cross cert ID
    if (!contract.pacificCrossCertId) {
      return NextResponse.json(
        { error: 'Contract has no Pacific Cross quote' },
        { status: 400 }
      );
    }

    logInfo('Travel confirm contract started', {
      operation: 'TRAVEL_CONFIRM_START',
      contractId: id,
      additionalInfo: { product: contract.product, certId: contract.pacificCrossCertId }
    });

    // Authenticate with Pacific Cross
    const client = new PacificCrossApiClient();
    const username = process.env.PACIFIC_CROSS_USERNAME;
    const password = process.env.PACIFIC_CROSS_PASSWORD;

    if (!username || !password) {
      logError(new Error('Pacific Cross credentials not configured'), {
        operation: 'TRAVEL_CONFIRM_ENV',
        contractId: id
      });
      return NextResponse.json(
        { error: 'Pacific Cross credentials not configured' },
        { status: 500 }
      );
    }

    logDebug('TRAVEL_CONFIRM: Authenticating', { contractId: id });
    const authResponse = await client.authenticate(username, password);
    if (!authResponse.success) {
      logError(new Error('Pacific Cross auth failed'), {
        operation: 'TRAVEL_CONFIRM_AUTH',
        contractId: id,
        additionalInfo: { error: authResponse.error }
      });
      return NextResponse.json(
        { error: `Pacific Cross auth failed: ${authResponse.error}` },
        { status: 500 }
      );
    }

    // Refresh CSRF token
    logDebug('TRAVEL_CONFIRM: Refreshing CSRF', { contractId: id, product: contract.product });
    const csrfRefreshed = await client.refreshCsrfToken(contract.product);
    if (!csrfRefreshed) {
      logError(new Error('CSRF refresh failed'), {
        operation: 'TRAVEL_CONFIRM_CSRF',
        contractId: id
      });
    }

    // Build payload (is_quote=0 for confirm)
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
    const payload = mapTravelToPacificCrossFormat(formData, csrfToken, false);

    logDebug('TRAVEL_CONFIRM: Payload built', {
      contractId: id,
      payloadKeys: Object.keys(payload)
    });

    // Confirm contract (is_quote=0)
    logDebug('TRAVEL_CONFIRM: Creating contract on Pacific Cross', { contractId: id });
    const confirmResponse = await client.createCertificate(payload, false);

    if (!confirmResponse.success) {
      logError(new Error('Confirmation failed'), {
        operation: 'TRAVEL_CONFIRM_CREATE',
        contractId: id,
        additionalInfo: { error: confirmResponse.error, rawResponse: confirmResponse.rawResponse }
      });
      return NextResponse.json(
        { error: `Confirmation failed: ${confirmResponse.error}` },
        { status: 500 }
      );
    }

    logInfo('Travel contract confirmed successfully', {
      operation: 'TRAVEL_CONFIRM_SUCCESS',
      contractId: id,
      additionalInfo: { certId: contract.pacificCrossCertId }
    });

    // Update contract status
    contract.status = 'ra_hop_dong';
    contract.set('_statusChangedBy', user.userId);
    contract.set('_statusChangeNote', 'Ra hop dong tren Pacific Cross');

    await contract.save();

    return NextResponse.json({
      message: 'Ra hop dong thanh cong',
      certId: contract.pacificCrossCertId,
      contract: {
        id: contract._id,
        contractNumber: contract.contractNumber,
        status: contract.status
      }
    });

  } catch (error: unknown) {
    const { id } = await params;
    logError(error, {
      operation: 'TRAVEL_CONFIRM_CONTRACT',
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
