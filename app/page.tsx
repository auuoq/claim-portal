'use client';

import { useState, useEffect } from 'react';
import StepIndicator from '@/components/StepIndicator';
import SelectionSummary from '@/components/SelectionSummary';
import InsurancePackageSelector from '@/components/InsurancePackageSelector';
import TreatmentTypeSelector from '@/components/TreatmentTypeSelector';
import DocumentUploadSection from '@/components/DocumentUploadSection';
import CalculateButton from '@/components/CalculateButton';
import ResultModal from '@/components/ResultModal';
import PackagePreviewModal from '@/components/PackagePreviewModal';
import { fetchInsuranceInfo, submitClaim } from '@/lib/api';
import { updateFromAPI, INSURANCE_PACKAGES, InsuranceInfoData, InsurancePackageType, InsuranceContract, InsuranceCategory } from '@/lib/constants';
import { generateUniqueId, createFilePreviewUrl, isImageFile } from '@/lib/utils';

interface FileWithPreview {
  id: string;
  file: File;
  previewUrl?: string;
}

export default function Home() {
  const [currentStep, setCurrentStep] = useState(1);
  const [insurancePackage, setInsurancePackage] = useState<string | null>(null);
  const [insuranceSubOption, setInsuranceSubOption] = useState<string | null>(null);
  const [treatmentType, setTreatmentType] = useState<string | null>(null);
  const [uploadedDocuments, setUploadedDocuments] = useState<Record<string, FileWithPreview[]>>({});
  const [isCalculating, setIsCalculating] = useState(false);
  const [showResultModal, setShowResultModal] = useState(false);
  const [claimResult, setClaimResult] = useState<{ markdown?: string; error?: string }>({});
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [apiData, setApiData] = useState<InsuranceInfoData | null>(null);
  const [previewModal, setPreviewModal] = useState<{ isOpen: boolean; name: string; content: string }>({
    isOpen: false,
    name: '',
    content: ''
  });

  // Load insurance packages from API on mount
  useEffect(() => {
    async function loadData() {
      try {
        const data = await fetchInsuranceInfo();
        if (data.status === 'success') {
          updateFromAPI(data.data);
          setApiData(data.data);
        }
      } catch (error) {
        console.error('Failed to load insurance data:', error);
      } finally {
        setIsLoadingData(false);
      }
    }
    loadData();
  }, []);


  const handleInsurancePackageSelect = (packageId: string) => {
    setInsurancePackage(packageId);
    setInsuranceSubOption(null);
    setTreatmentType(null);
    setUploadedDocuments({});
  };

  const handleInsuranceSubOptionSelect = (subOptionId: string) => {
    setInsuranceSubOption(subOptionId);
    setTreatmentType(null);
    setUploadedDocuments({});
  };

  const handleTreatmentTypeSelect = (type: string) => {
    setTreatmentType(type);
    setUploadedDocuments({});
  };

  const handleFilesAdd = (documentTypeId: string, files: File[]) => {
    const filesWithPreview: FileWithPreview[] = files.map(file => ({
      id: generateUniqueId(),
      file,
      previewUrl: isImageFile(file) ? createFilePreviewUrl(file) : undefined
    }));

    setUploadedDocuments(prev => ({
      ...prev,
      [documentTypeId]: [...(prev[documentTypeId] || []), ...filesWithPreview]
    }));
  };

  const handleFileRemove = (documentTypeId: string, fileId: string) => {
    setUploadedDocuments(prev => ({
      ...prev,
      [documentTypeId]: prev[documentTypeId].filter(f => f.id !== fileId)
    }));
  };

  const handleCalculate = async () => {
    if (!treatmentType || !insurancePackage || !apiData) return;

    const documents = Object.entries(uploadedDocuments)
      .filter(([, files]) => files.length > 0)
      .map(([documentType, files]) => ({
        documentType,
        files: files.map(f => f.file)
      }));

    if (documents.length === 0) {
      alert('Vui lòng tải lên ít nhất một hồ sơ');
      return;
    }

    setIsCalculating(true);

    try {
      const selectedPkg = INSURANCE_PACKAGES.find((p: InsurancePackageType) => p.id === insurancePackage);
      const contractData = apiData.hop_dong.find((c: InsuranceContract) => c.ten === selectedPkg?.name);
      const packageData = insuranceSubOption
        ? contractData?.cac_goi.find((g: InsuranceCategory) => g.ten === selectedPkg?.subOptions?.find((s) => s.id === insuranceSubOption)?.name)
        : null;

      const hoSo: Record<string, File[]> = {};
      documents.forEach(doc => {
        hoSo[doc.documentType] = doc.files;
      });

      const result = await submitClaim({
        hopDong: selectedPkg?.name || '',
        goi: packageData?.ten || '',
        loai: treatmentType === 'inpatient' ? 'nội trú' : 'ngoại trú',
        hoSo
      });

      if (result.status === 'success') {
        setClaimResult({ markdown: result.data });
      } else {
        setClaimResult({ error: 'Có lỗi xảy ra khi xử lý yêu cầu' });
      }
      setShowResultModal(true);
    } catch (error) {
      console.error('Error:', error);
      setClaimResult({ error: 'Có lỗi xảy ra khi tính toán claim' });
      setShowResultModal(true);
    } finally {
      setIsCalculating(false);
    }
  };

  const hasUploadedFiles = Object.values(uploadedDocuments).some(files => files.length > 0);
  const totalFileCount = Object.values(uploadedDocuments).reduce((sum, files) => sum + files.length, 0);

  const currentPkg = INSURANCE_PACKAGES.find((p: InsurancePackageType) => p.id === insurancePackage);
  const isPackageSelectionComplete = insurancePackage && (!currentPkg?.hasSubOptions || insuranceSubOption);

  const stepLabels = ['Gói BH', 'Điều trị', 'Hồ sơ'];
  const totalSteps = 3;

  const canProceedToStep2 = isPackageSelectionComplete;
  const canProceedToStep3 = canProceedToStep2 && treatmentType;

  const handleNext = () => {
    if (currentStep === 1 && canProceedToStep2) {
      setCurrentStep(2);
    } else if (currentStep === 2 && canProceedToStep3) {
      setCurrentStep(3);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handlePackagePreview = (name: string, content: string) => {
    setPreviewModal({ isOpen: true, name, content });
  };

  return (
    <div className="h-screen flex flex-col bg-gradient-to-br from-gray-50 via-white to-teal-50 overflow-hidden text-gray-900">
      {/* Header - Fixed top */}
      <header className="flex-shrink-0 bg-gradient-to-r from-teal-500 to-cyan-500 text-white shadow-lg z-50">
        <div className="max-w-6xl mx-auto px-4 py-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center backdrop-blur-sm">
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 1.944A11.954 11.954 0 012.166 5C2.056 5.649 2 6.319 2 7c0 5.225 3.34 9.67 8 11.317C14.66 16.67 18 12.225 18 7c0-.682-.057-1.35-.166-2.001A11.954 11.954 0 0110 1.944zM11 14a1 1 0 11-2 0 1 1 0 012 0zm0-7a1 1 0 10-2 0v3a1 1 0 102 0V7z" clipRule="evenodd" />
              </svg>
            </div>
            <div>
              <h1 className="text-lg font-semibold leading-tight">Yêu cầu bồi thường bảo hiểm</h1>
              <p className="text-teal-100 text-xs opacity-90">Hoàn thành 3 bước đơn giản</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Area */}
      {isLoadingData ? (
        <main className="flex-1 flex items-center justify-center">
          <div className="bg-white rounded-xl shadow-md border border-gray-100 p-12 text-center">
            <div className="animate-spin w-12 h-12 border-4 border-teal-500 border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-gray-600">Đang tải thông tin gói bảo hiểm...</p>
          </div>
        </main>
      ) : (
        <main className="flex-1 overflow-hidden max-w-6xl w-full mx-auto px-4 py-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full overflow-hidden">
            {/* Form Area - Fixed with internal scroll */}
            <div className="lg:col-span-2 flex flex-col h-full bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden">
              {/* Step Indicator - Fixed top */}
              <div className="p-6 pb-2 border-b border-gray-50 flex-shrink-0 bg-white">
                <StepIndicator
                  currentStep={currentStep}
                  totalSteps={totalSteps}
                  stepLabels={stepLabels}
                />
              </div>

              {/* Step Content - SCROLLABLE */}
              <div className="flex-1 overflow-y-auto p-6 scroll-smooth">
                {currentStep === 1 && (
                  <div className="animate-fadeIn">
                    <InsurancePackageSelector
                      selectedPackage={insurancePackage}
                      selectedSubOption={insuranceSubOption}
                      onPackageSelect={handleInsurancePackageSelect}
                      onSubOptionSelect={handleInsuranceSubOptionSelect}
                      onPreview={handlePackagePreview}
                    />
                  </div>
                )}

                {currentStep === 2 && (
                  <div className="animate-fadeIn">
                    <TreatmentTypeSelector
                      selectedType={treatmentType}
                      onSelect={handleTreatmentTypeSelect}
                    />
                  </div>
                )}

                {currentStep === 3 && (
                  <div className="animate-fadeIn">
                    <DocumentUploadSection
                      treatmentType={treatmentType!}
                      uploadedDocuments={uploadedDocuments}
                      onFilesAdd={handleFilesAdd}
                      onFileRemove={handleFileRemove}
                    />
                  </div>
                )}
              </div>

              {/* Navigation Bar - Fixed bottom */}
              <div className="p-6 pt-4 border-t border-gray-100 flex-shrink-0 flex justify-between bg-gray-50/50">
                <button
                  onClick={handleBack}
                  disabled={currentStep === 1}
                  className={`
                    px-5 py-2.5 rounded-lg font-medium text-sm transition-all
                    ${currentStep === 1
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 shadow-sm'
                    }
                  `}
                >
                  ← Quay lại
                </button>

                {currentStep < 3 ? (
                  <button
                    onClick={handleNext}
                    disabled={
                      (currentStep === 1 && !canProceedToStep2) ||
                      (currentStep === 2 && !canProceedToStep3)
                    }
                    className={`
                      px-5 py-2.5 rounded-lg font-semibold text-sm transition-all
                      ${(currentStep === 1 && !canProceedToStep2) || (currentStep === 2 && !canProceedToStep3)
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : 'bg-gradient-to-r from-teal-500 to-cyan-500 text-white hover:from-teal-600 hover:to-cyan-600 shadow-sm hover:shadow-md'
                      }
                    `}
                  >
                    Tiếp theo →
                  </button>
                ) : (
                  <CalculateButton
                    disabled={!hasUploadedFiles}
                    loading={isCalculating}
                    onClick={handleCalculate}
                  />
                )}
              </div>
            </div>

            {/* Sidebar - Fixed */}
            <div className="lg:col-span-1 hidden lg:block overflow-y-auto">
              <SelectionSummary
                insurancePackage={insurancePackage}
                insuranceSubOption={insuranceSubOption}
                treatmentType={treatmentType}
                fileCount={totalFileCount}
              />
            </div>
          </div>
        </main>
      )}

      {/* Result Modal */}
      <ResultModal
        isOpen={showResultModal}
        onClose={() => setShowResultModal(false)}
        markdownContent={claimResult.markdown}
        error={claimResult.error}
      />

      {/* Package Preview Modal */}
      <PackagePreviewModal
        isOpen={previewModal.isOpen}
        onClose={() => setPreviewModal({ ...previewModal, isOpen: false })}
        packageName={previewModal.name}
        previewContent={previewModal.content}
      />

      {/* Loading Overlay for Calculation */}
      {isCalculating && (
        <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-white/60 backdrop-blur-md animate-fadeIn">
          <div className="relative">
            <div className="w-20 h-20 border-4 border-teal-100 border-t-teal-500 rounded-full animate-spin"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <svg className="w-8 h-8 text-teal-500 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
            </div>
          </div>
          <h2 className="mt-6 text-xl font-bold bg-gradient-to-r from-teal-600 to-cyan-600 bg-clip-text text-transparent">
            Đang thẩm định hồ sơ...
          </h2>
          <p className="mt-2 text-gray-500 animate-pulse">
            Vui lòng đợi trong giây lát, quá trình này có thể mất vài giây.
          </p>
        </div>
      )}
    </div>
  );
}
