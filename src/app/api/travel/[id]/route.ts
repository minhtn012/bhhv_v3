import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import TravelContract from '@/models/TravelContract';
import { requireAuth } from '@/lib/auth';
import { generateQuotePdfUrl, mapTravelToPacificCrossFormat } from '@/providers/pacific-cross/products/travel/mapper';
import { PacificCrossApiClient } from '@/providers/pacific-cross/api-client';
import { logError, logDebug } from '@/lib/errorLogger';
import { validateFamilyPlan } from '@/utils/travel-family-validation';
import type { TravelContractFormData, PacificCrossEditState } from '@/providers/pacific-cross/products/travel/types';

// GET /api/travel/[id] - Get single contract
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = requireAuth(request);
    await connectToDatabase();

    const { id } = await params;
    const contract = await TravelContract.findById(id)
      .populate('createdBy', 'username')
      .lean() as { createdBy: { _id: { toString: () => string } } } | null;

    if (!contract) {
      return NextResponse.json(
        { error: 'Contract not found' },
        { status: 404 }
      );
    }

    // Non-admin can only see their own contracts
    if (
      user.role !== 'admin' &&
      contract.createdBy._id.toString() !== user.userId
    ) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }

    // Always regenerate quotePdfUrl from certId to ensure correct format
    const extendedContract = contract as typeof contract & { pacificCrossCertId?: string; quotePdfUrl?: string; status?: string };
    if (extendedContract.pacificCrossCertId) {
      const correctUrl = generateQuotePdfUrl(extendedContract.pacificCrossCertId);
      if (extendedContract.quotePdfUrl !== correctUrl) {
        extendedContract.quotePdfUrl = correctUrl;
        await TravelContract.updateOne(
          { _id: id },
          { $set: { quotePdfUrl: correctUrl } }
        );
      }
    }

    // Fetch edit state from Pacific Cross for confirmed contracts
    let editState: PacificCrossEditState | null = null;
    if (extendedContract.status === 'ra_hop_dong' && extendedContract.pacificCrossCertId) {
      try {
        const envCheck = PacificCrossApiClient.validateEnv();
        if (envCheck.valid) {
          const client = new PacificCrossApiClient();
          const username = process.env.PACIFIC_CROSS_USERNAME!;
          const password = process.env.PACIFIC_CROSS_PASSWORD!;
          const authResponse = await client.authenticate(username, password);
          if (authResponse.success) {
            editState = await client.getEditState(extendedContract.pacificCrossCertId);
          }
        }
      } catch (err) {
        logError(err, { operation: 'TRAVEL_GET_EDIT_STATE_ERROR', contractId: id });
      }
    }

    return NextResponse.json({ contract: extendedContract, editState });

  } catch (error: unknown) {
    // Logged via logError if needed

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

// PUT /api/travel/[id] - Update contract
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = requireAuth(request);
    await connectToDatabase();

    const { id } = await params;
    const contract = await TravelContract.findById(id);

    if (!contract) {
      return NextResponse.json(
        { error: 'Contract not found' },
        { status: 404 }
      );
    }

    // Check permission
    if (
      user.role !== 'admin' &&
      contract.createdBy.toString() !== user.userId
    ) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }

    // Check if editable
    if (!contract.canEdit()) {
      return NextResponse.json(
        { error: 'Contract cannot be edited in current status' },
        { status: 400 }
      );
    }

    const data = await request.json();

    // For confirmed certs: fetch edit state and apply stricter validation
    let editState: PacificCrossEditState | null = null;
    if (contract.status === 'ra_hop_dong' && contract.pacificCrossCertId) {
      try {
        const envCheck = PacificCrossApiClient.validateEnv();
        if (envCheck.valid) {
          const client = new PacificCrossApiClient();
          const authResponse = await client.authenticate(
            process.env.PACIFIC_CROSS_USERNAME!,
            process.env.PACIFIC_CROSS_PASSWORD!
          );
          if (authResponse.success) {
            editState = await client.getEditState(contract.pacificCrossCertId);
          }
        }
      } catch (err) {
        logError(err, { operation: 'TRAVEL_PUT_EDIT_STATE_ERROR', contractId: id });
      }

      if (!editState || !editState.canEdit) {
        return NextResponse.json(
          { error: 'Hợp đồng không thể sửa đổi (readOnly hoặc đã hết hạn)' },
          { status: 400 }
        );
      }

      // Rule 1: Validate effective date changes
      if (data.period?.dateFrom) {
        if (editState.onEffDate && data.period.dateFrom !== contract.period.dateFrom) {
          return NextResponse.json(
            { error: 'Không thể sửa ngày hiệu lực khi đã đến ngày bắt đầu' },
            { status: 400 }
          );
        }
        if (!editState.onEffDate) {
          const oldDate = new Date(contract.period.dateFrom);
          const newDate = new Date(data.period.dateFrom);
          if (newDate < oldDate) {
            return NextResponse.json(
              { error: 'Ngày hiệu lực chỉ được tăng hoặc giữ nguyên' },
              { status: 400 }
            );
          }
        }
      }

      // Rule 2: Plan upgrade only (validated by Pacific Cross on sync)

      // Rule 3: Insured person - max 1 identity field change per person
      if (data.insuredPersons && contract.insuredPersons) {
        const trackFields = ['name', 'dob', 'gender', 'personalId'] as const;
        for (let i = 0; i < data.insuredPersons.length; i++) {
          const oldPerson = contract.insuredPersons[i];
          if (!oldPerson) continue; // New person added → ok
          const newPerson = data.insuredPersons[i];
          let changedFields = 0;
          for (const field of trackFields) {
            if (String(oldPerson[field] || '') !== String(newPerson[field] || '')) {
              changedFields++;
            }
          }
          if (changedFields >= 2) {
            return NextResponse.json(
              { error: `Người được BH #${i + 1}: chỉ được sửa tối đa 1 thông tin cá nhân` },
              { status: 400 }
            );
          }
        }
      }
    }

    // Validate dates if period is being updated: dateFrom must be >= tomorrow
    // Skip this validation for confirmed certs (date already validated above)
    if (data.period?.dateFrom && contract.status !== 'ra_hop_dong') {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(0, 0, 0, 0);

      const dateFrom = new Date(data.period.dateFrom);
      dateFrom.setHours(0, 0, 0, 0);

      if (dateFrom < tomorrow) {
        return NextResponse.json(
          { error: 'Ngay hieu luc phai tu ngay mai tro di' },
          { status: 400 }
        );
      }
    }

    // Family plan validation
    if (data.owner?.pocyType === 'Family') {
      // Ensure all persons have memberType
      const missingMemberType = data.insuredPersons?.some(
        (p: { memberType?: string }) => !p.memberType
      );
      if (missingMemberType) {
        return NextResponse.json(
          {
            success: false,
            error: 'Tất cả người được bảo hiểm phải có loại thành viên'
          },
          { status: 400 }
        );
      }

      // Validate family composition
      const referenceDate = new Date(data.period?.dateFrom);
      const validation = validateFamilyPlan(data.insuredPersons, referenceDate);

      if (!validation.valid) {
        return NextResponse.json(
          {
            success: false,
            error: 'Lỗi cấu hình gói Gia đình',
            details: validation.errors
          },
          { status: 400 }
        );
      }
    }

    // Update allowed fields
    const allowedFields = [
      'owner',
      'period',
      'product',
      'productName',
      'plan',
      'planName',
      'insuredPersons',
      'refNo',
      'pnrNo',
      'itinerary',
      'note',
      'totalPremium'
    ];

    for (const field of allowedFields) {
      if (data[field] !== undefined) {
        (contract as Record<string, unknown>)[field] = data[field];
      }
    }

    await contract.save();

    // Sync to Pacific Cross if certId exists
    let syncResult = null;
    const certId = contract.pacificCrossCertId;

    if (certId) {
      logDebug('TRAVEL_SYNC: Starting sync', {
        operation: 'TRAVEL_UPDATE_SYNC_START',
        contractId: id,
        certId
      });

      try {
        const envCheck = PacificCrossApiClient.validateEnv();
        logDebug('TRAVEL_SYNC: Env check', envCheck);

        if (envCheck.valid) {
          const client = new PacificCrossApiClient();
          const username = process.env.PACIFIC_CROSS_USERNAME!;
          const password = process.env.PACIFIC_CROSS_PASSWORD!;

          const authResponse = await client.authenticate(username, password);
          logDebug('TRAVEL_SYNC: Auth result', { success: authResponse.success, error: authResponse.error });

          if (authResponse.success) {
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

            // Note: updateCertificate will get fresh CSRF token from edit page internally
            const payload = mapTravelToPacificCrossFormat(formData, '', true);

            logDebug('TRAVEL_SYNC: Calling updateCertificate', {
              operation: 'TRAVEL_UPDATE_PAYLOAD',
              contractId: id,
              certId,
              policyholder: payload.policyholder,
              email: payload.email,
              address: payload.address,
            });
            const updateResponse = await client.updateCertificate(certId, payload);
            logDebug('TRAVEL_SYNC: Update response', {
              operation: 'TRAVEL_UPDATE_RESULT',
              contractId: id,
              success: updateResponse.success,
              error: updateResponse.error,
              hasRawResponse: !!updateResponse.rawResponse,
            });

            if (updateResponse.success) {
              logDebug('Pacific Cross sync successful', {
                operation: 'TRAVEL_UPDATE_SYNC_SUCCESS',
                contractId: id
              });

              // Fetch updated premium
              const premiumResult = await client.getCertificatePremium(contract.pacificCrossCertId);
              if (premiumResult.success && premiumResult.premium) {
                contract.totalPremium = premiumResult.premium;
                await contract.save();
              }

              syncResult = { success: true, premium: premiumResult.premium };
            } else {
              logError(new Error('Pacific Cross sync failed'), {
                operation: 'TRAVEL_UPDATE_SYNC_FAILED',
                contractId: id,
                additionalInfo: { error: updateResponse.error }
              });
              syncResult = { success: false, error: updateResponse.error };
            }
          }
        }
      } catch (syncError) {
        logError(syncError, {
          operation: 'TRAVEL_UPDATE_SYNC_ERROR',
          contractId: id
        });
        syncResult = { success: false, error: 'Sync error' };
      }
    }

    return NextResponse.json({
      message: 'Cap nhat hop dong thanh cong',
      contract: {
        id: contract._id,
        contractNumber: contract.contractNumber,
        status: contract.status,
        totalPremium: contract.totalPremium
      },
      pacificCrossSync: syncResult
    });

  } catch (error: unknown) {
    // Logged via logError if needed

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

// DELETE /api/travel/[id] - Delete contract (only draft)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = requireAuth(request);
    await connectToDatabase();

    const { id } = await params;
    const contract = await TravelContract.findById(id);

    if (!contract) {
      return NextResponse.json(
        { error: 'Contract not found' },
        { status: 404 }
      );
    }

    // Only creator or admin can delete
    if (
      user.role !== 'admin' &&
      contract.createdBy.toString() !== user.userId
    ) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }

    // Only draft contracts can be deleted
    if (contract.status !== 'nhap') {
      return NextResponse.json(
        { error: 'Only draft contracts can be deleted' },
        { status: 400 }
      );
    }

    await contract.deleteOne();

    return NextResponse.json({
      message: 'Xoa hop dong thanh cong'
    });

  } catch (error: unknown) {
    // Logged via logError if needed

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
