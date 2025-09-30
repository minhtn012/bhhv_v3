/**
 * New Contract Page - Refactored Version
 *
 * Simplified using:
 * - useContractForm hook for state management
 * - transformFormToContract for API payload
 * - Automatic fee calculations via reducer
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/DashboardLayout';
import StepIndicator from '@/components/contracts/StepIndicator';
import StepWrapper from '@/components/contracts/StepWrapper';
import FileUploadStep from '@/components/contracts/FileUploadStep';
import BuyerInfoForm from '@/components/contracts/BuyerInfoForm';
import VehicleInfoForm from '@/components/contracts/VehicleInfoForm';
import PackageSelectionStep from '@/components/contracts/PackageSelectionStep';
import { FileUploadSummary, VehicleInfoSummary } from '@/components/contracts/CompletedStepSummary';
import useContractForm from '@/hooks/useContractForm';
import useCarSelection from '@/hooks/useCarSelection';
import useInsuranceCalculation from '@/hooks/useInsuranceCalculation';
import useFormValidation from '@/hooks/useFormValidation';
import { transformFormToContract, validateContractPayload } from '@/lib/contractDataMapper';
import { calculateSubmissionFees } from '@/services/contractCalculationService';

export default function NewContractPage() {
  // UI state
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [uploadedFiles] = useState({
    cavetFileName: '',
    dangkiemFileName: ''
  });

  const router = useRouter();

  // Form state management (unified hook)
  const { state: formData, actions } = useContractForm();

  // Car selection hook
  const {
    carData,
    handleBrandChange,
    handleModelChange,
    handleInputChange: handleCarInputChange,
    acceptSuggestedCar,
    searchCarFromExtractedData
  } = useCarSelection({
    onVehicleDataChange: actions.setVehicleData
  });

  // Insurance calculation hook
  const {
    calculationResult,
    enhancedResult,
    availablePackages,
    calculateRates,
    calculateEnhanced,
    calculateTotal,
    syncPackageFee,
  } = useInsuranceCalculation();

  // Form validation hook
  const { fieldErrors, validateForm } = useFormValidation();

  // Check authentication
  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (!userData || !JSON.parse(userData).isLoggedIn) {
      router.push('/');
    }
  }, [router]);

  // Utility: Scroll to step
  const scrollToStep = useCallback((stepNumber: number, delay: number = 500) => {
    setTimeout(() => {
      const stepElement = document.querySelector(`[data-step="${stepNumber}"]`);
      if (stepElement) {
        stepElement.scrollIntoView({
          behavior: 'smooth',
          block: 'start',
          inline: 'nearest'
        });
      }
    }, delay);
  }, []);

  // Step 1: Handle extract success
  const handleExtractSuccess = useCallback(async (data: any) => {
    actions.populateFromExtract(data);
    await searchCarFromExtractedData(data);
    setCurrentStep(2);
    scrollToStep(2);
  }, [actions, searchCarFromExtractedData, scrollToStep]);

  // Step 2: Buyer info completion
  const handleBuyerInfoNext = useCallback(() => {
    setCurrentStep(3);
    scrollToStep(3);
  }, [scrollToStep]);

  // Step 3: Calculate insurance rates
  const handleCalculateRates = useCallback(async () => {
    const isValid = await validateForm(formData, carData);
    if (!isValid) {
      return;
    }

    const { packages, defaultTndsCategory } = calculateRates(formData);

    // Update form with calculation results
    if (packages && packages.length > 0) {
      const selectedPackage = packages[0];
      actions.setMultipleFields({
        tndsCategory: defaultTndsCategory || formData.tndsCategory,
        customRates: packages.map(pkg => pkg.rate),
        availablePackages: packages,
      });

      // Set package and trigger fee calculation
      actions.setPackage(0, selectedPackage.rate);
    }

    calculateEnhanced(formData);
    setCurrentStep(4);
    setError('');
    scrollToStep(4);
  }, [formData, carData, validateForm, calculateRates, calculateEnhanced, actions, scrollToStep]);

  // Step 4: Package selection
  const handlePackageSelection = useCallback((packageIndex: number) => {
    const selectedPackage = availablePackages[packageIndex];
    if (selectedPackage) {
      actions.setPackage(packageIndex, selectedPackage.rate);
      syncPackageFee(
        packageIndex,
        typeof formData.giaTriXe === 'string' ? parseFloat(formData.giaTriXe.replace(/\D/g, '')) : formData.giaTriXe,
        formData.loaiHinhKinhDoanh,
        formData.loaiDongCo,
        formData.giaTriPin
      );
      calculateEnhanced(formData);
    }
  }, [availablePackages, formData, actions, syncPackageFee, calculateEnhanced]);

  // Recalculate
  const handleRecalculate = useCallback(() => {
    calculateEnhanced(formData);
  }, [formData, calculateEnhanced]);

  // NNTX fee change
  const handleNNTXFeeChange = useCallback((fee: number) => {
    actions.setNntxFee(fee);
  }, [actions]);

  // Custom rate change
  const handleCustomRateChange = useCallback((customRateValue: number | null, isModified: boolean) => {
    actions.setCustomRate(customRateValue, isModified);
  }, [actions]);

  // Submit contract
  const submitContract = useCallback(async () => {
    if (!calculationResult || availablePackages.length === 0) {
      setError('Chưa tính toán phí bảo hiểm');
      return;
    }

    const selectedPackage = availablePackages[formData.selectedPackageIndex];
    if (!selectedPackage || !selectedPackage.available) {
      setError('Vui lòng chọn gói bảo hiểm hợp lệ');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Calculate final fees
      const fees = calculateSubmissionFees({
        giaTriXe: formData.giaTriXe,
        giaTriPin: formData.giaTriPin,
        loaiDongCo: formData.loaiDongCo,
        loaiHinhKinhDoanh: formData.loaiHinhKinhDoanh,
        packageRate: selectedPackage.rate,
        customRate: formData.isCustomRateModified ? formData.customRate ?? undefined : undefined,
        isCustomRate: formData.isCustomRateModified,
        includeTNDS: formData.includeTNDS,
        tndsCategory: formData.tndsCategory,
        includeNNTX: formData.includeNNTX,
        nntxFee: formData.nntxFee,
        taiTucPercentage: formData.taiTucPercentage,
      });

      // Transform form data to API payload
      const payload = transformFormToContract(
        formData as any, // Type assertion for now
        carData,
        {
          name: selectedPackage.name,
          rate: selectedPackage.rate,
          customRate: formData.isCustomRateModified ? formData.customRate ?? undefined : undefined,
          isCustomRate: formData.isCustomRateModified,
        },
        {
          phiVatChatGoc: fees.phiVatChat,
          phiVatChat: fees.phiVatChat,
          phiTNDS: fees.phiTNDS,
          phiNNTX: fees.phiNNTX,
          phiPin: fees.phiPin,
          phiTaiTuc: fees.phiTaiTuc,
          phiTruocKhiGiam: fees.phiTruocKhiGiam,
          phiSauKhiGiam: fees.phiSauKhiGiam,
          tongPhi: fees.tongPhi,
        }
      );

      // Validate payload
      const validation = validateContractPayload(payload);
      if (!validation.valid) {
        setError(validation.errors.join(', '));
        return;
      }

      // Submit to API
      const response = await fetch('/api/contracts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        const result = await response.json();

        // Redirect to contract detail page
        router.push(`/contracts/${result.contract.id}`);

        // Background BHV premium check (fire-and-forget)
        fetch('/api/contracts/check-bhv-contract', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ contractNumber: result.contract.contractNumber }),
        }).catch(error => {
          console.log('Background BHV premium check failed:', error);
        });
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Lỗi khi tạo hợp đồng');
      }
    } catch (error: unknown) {
      console.error('Submit error:', error);
      setError('Đã có lỗi xảy ra khi tạo hợp đồng');
    } finally {
      setLoading(false);
    }
  }, [
    calculationResult,
    availablePackages,
    formData,
    carData,
    router,
  ]);

  // Calculate total amount
  const totalAmount = enhancedResult ? enhancedResult.grandTotal : calculateTotal(formData);

  return (
    <DashboardLayout>
      <div className="p-4 lg:p-6">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-white mb-4">Tạo báo giá mới</h1>
            <StepIndicator currentStep={currentStep} />
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 text-red-400 text-sm mb-6">
              {error}
            </div>
          )}

          {/* Progressive Steps */}
          <div className="space-y-6">
            {/* Step 1: Upload Images */}
            <div data-step="1">
              <StepWrapper
                stepNumber={1}
                title="Bước 1: Tải ảnh"
                currentStep={currentStep}
                isCompleted={currentStep > 1}
                summary={currentStep > 1 ? (
                  <FileUploadSummary
                    cavetFileName={uploadedFiles.cavetFileName}
                    dangkiemFileName={uploadedFiles.dangkiemFileName}
                  />
                ) : undefined}
              >
                <FileUploadStep
                  onExtractSuccess={handleExtractSuccess}
                  error={error}
                />
              </StepWrapper>
            </div>

            {/* Step 2: Buyer Information */}
            {currentStep >= 2 && (
              <div data-step="2">
                <StepWrapper
                  stepNumber={2}
                  title="Bước 2: Xác nhận thông tin"
                  currentStep={currentStep}
                  isCompleted={currentStep > 2}
                  summary={currentStep > 2 ? (
                    <div className="text-sm text-white/70 space-y-1">
                      <p><strong>Họ tên:</strong> {formData.chuXe}</p>
                      <p><strong>Email:</strong> {formData.email}</p>
                      <p><strong>Điện thoại:</strong> {formData.soDienThoai}</p>
                      <p><strong>Địa chỉ:</strong> {formData.selectedProvinceText}, {formData.selectedDistrictWardText}</p>
                    </div>
                  ) : undefined}
                >
                  <BuyerInfoForm
                    formData={formData as any}
                    fieldErrors={fieldErrors}
                    onFormInputChange={actions.setField}
                    onNext={handleBuyerInfoNext}
                  />
                </StepWrapper>
              </div>
            )}

            {/* Step 3: Verify Vehicle Information */}
            {currentStep >= 3 && (
              <div data-step="3">
                <StepWrapper
                  stepNumber={3}
                  title="Bước 3: Thông tin xe"
                  currentStep={currentStep}
                  isCompleted={currentStep > 3}
                  summary={currentStep > 3 ? (
                    <VehicleInfoSummary formData={formData as any} />
                  ) : undefined}
                >
                  <VehicleInfoForm
                    formData={formData as any}
                    carData={carData}
                    fieldErrors={fieldErrors}
                    onFormInputChange={actions.setField}
                    onBrandChange={handleBrandChange}
                    onModelChange={handleModelChange}
                    onCarInputChange={handleCarInputChange}
                    onAcceptSuggestion={acceptSuggestedCar}
                    onCalculateRates={handleCalculateRates}
                    onVehicleDataChange={actions.setVehicleData}
                  />
                </StepWrapper>
              </div>
            )}

            {/* Step 4: Package Selection */}
            {currentStep >= 4 && calculationResult && availablePackages.length > 0 && (
              <div data-step="4">
                <StepWrapper
                  stepNumber={4}
                  title="Bước 4: Chọn gói & Tạo báo giá"
                  currentStep={currentStep}
                  isCompleted={false}
                  summary={undefined}
                >
                  <PackageSelectionStep
                    availablePackages={availablePackages}
                    calculationResult={calculationResult}
                    enhancedResult={enhancedResult || undefined}
                    formData={formData as any}
                    totalAmount={totalAmount}
                    nntxFee={formData.nntxFee}
                    loading={loading}
                    onFormInputChange={actions.setField}
                    onPackageSelect={handlePackageSelection}
                    onSubmit={submitContract}
                    onRecalculate={handleRecalculate}
                    onNNTXFeeChange={handleNNTXFeeChange}
                    onCustomRateChange={handleCustomRateChange}
                  />
                </StepWrapper>
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}