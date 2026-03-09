"use client";

import { useState, useEffect } from "react";
import StepIndicator from "@/components/StepIndicator";
import SelectionSummary from "@/components/SelectionSummary";
import InsurancePackageSelector from "@/components/InsurancePackageSelector";
import TreatmentTypeSelector from "@/components/TreatmentTypeSelector";
import DocumentUploadSection from "@/components/DocumentUploadSection";
import CalculateButton from "@/components/CalculateButton";
import ResultModal from "@/components/ResultModal";
import PackagePreviewModal from "@/components/PackagePreviewModal";
import ContractUploadModal from "@/components/ContractUploadModal";
import FilePreviewModal from "@/components/FilePreviewModal";
import OcrReviewPopup from "@/components/OcrReviewPopup";
import {
  fetchInsuranceInfo,
  fetchDocumentTypes,
  submitClaimOcr,
  submitClaimAnalyse,
} from "@/lib/api";
import {
  updateFromAPI,
  updateDocumentTypesFromAPI,
  INSURANCE_PACKAGES,
  DOCUMENT_TYPES,
  TREATMENT_TYPES,
  InsuranceInfoData,
  InsurancePackageType,
  InsuranceContract,
  InsuranceCategory,
} from "@/lib/constants";
import {
  generateUniqueId,
  createFilePreviewUrl,
  isImageFile,
} from "@/lib/utils";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faShieldHalved, faFileContract, faCheck, faXmark, faPlus } from "@fortawesome/free-solid-svg-icons";

interface FileWithPreview {
  id: string;
  file: File;
  previewUrl?: string;
}

// Processing step shown in loading overlay
interface ProcessingStep {
  type: "progress" | "document";
  message: string;
  status?: "done" | "fail" | "loading";
  errors?: string[];
}

export default function Home() {
  const [currentStep, setCurrentStep] = useState(1);
  const [insurancePackage, setInsurancePackage] = useState<string | null>(null);
  const [insuranceSubOption, setInsuranceSubOption] = useState<string | null>(
    null,
  );
  const [treatmentType, setTreatmentType] = useState<string | null>(null);
  const [uploadedFiles, setUploadedFiles] = useState<FileWithPreview[]>([]);
  const [isCalculating, setIsCalculating] = useState(false);
  const [showResultModal, setShowResultModal] = useState(false);
  const [claimResult, setClaimResult] = useState<{
    markdown?: string;
    error?: string;
    missingDocuments?: { ma: string; ten: string }[];
    suggestedDocuments?: { ma: string; ten: string }[];
  }>({});
  const [ocrResult, setOcrResult] = useState<any>(null);
  const [showOcrReview, setShowOcrReview] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [isLoadingDocumentTypes, setIsLoadingDocumentTypes] = useState(false);
  const [apiData, setApiData] = useState<InsuranceInfoData | null>(null);
  const [processingSteps, setProcessingSteps] = useState<ProcessingStep[]>([]);
  const [previewModal, setPreviewModal] = useState<{
    isOpen: boolean;
    name: string;
    content: string;
  }>({
    isOpen: false,
    name: "",
    content: "",
  });
  const [previewFile, setPreviewFile] = useState<{
    isOpen: boolean;
    name: string;
    url?: string;
    isImage: boolean;
  }>({
    isOpen: false,
    name: "",
    isImage: false,
  });
  const [contractFiles, setContractFiles] = useState<File[]>([]);
  const [showContractModal, setShowContractModal] = useState(false);

  // Load insurance packages from API on mount
  useEffect(() => {
    async function loadData() {
      try {
        const data = await fetchInsuranceInfo();
        if (data.status === "success") {
          updateFromAPI(data.data);
          setApiData(data.data);
        }
      } catch (error) {
        console.error("Failed to load insurance data:", error);
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
    setUploadedFiles([]);
  };

  const handleInsuranceSubOptionSelect = (subOptionId: string) => {
    if (insuranceSubOption !== subOptionId) {
      setContractFiles([]);
    }
    setInsuranceSubOption(subOptionId);
    setTreatmentType(null);
    setUploadedFiles([]);
    setShowContractModal(true);
  };

  const handleContractConfirm = (files: File[]) => {
    setContractFiles(files);
    setShowContractModal(false);
  };

  const handleContractSkip = () => {
    setContractFiles([]);
    setInsuranceSubOption(null);
    setShowContractModal(false);
  };

  const handleEditContract = () => {
    setShowContractModal(true);
  };

  const handleTreatmentTypeSelect = async (type: string) => {
    setTreatmentType(type);
    setUploadedFiles([]);

    setIsLoadingDocumentTypes(true);
    try {
      const data = await fetchDocumentTypes(type);
      if (data.status === "success") {
        updateDocumentTypesFromAPI(data.data, type);
      }
    } catch (error) {
      console.error("Failed to load document types:", error);
    } finally {
      setIsLoadingDocumentTypes(false);
    }
  };

  const handleFilesAdd = (files: File[]) => {
    const filesWithPreview: FileWithPreview[] = files.map((file) => ({
      id: generateUniqueId(),
      file,
      previewUrl: isImageFile(file) ? createFilePreviewUrl(file) : undefined,
    }));
    setUploadedFiles((prev) => [...prev, ...filesWithPreview]);
  };

  const handleFileRemove = (fileId: string) => {
    setUploadedFiles((prev) => prev.filter((f) => f.id !== fileId));
  };

  const handleCalculate = async () => {
    if (!treatmentType || !insurancePackage || !apiData) return;

    if (uploadedFiles.length === 0) {
      alert("Vui lòng tải lên ít nhất một hồ sơ");
      return;
    }

    setIsCalculating(true);
    setProcessingSteps([]);

    if (typeof window !== "undefined" && "Notification" in window) {
      if (Notification.permission === "default") {
        Notification.requestPermission();
      }
    }

    try {
      const selectedPkg = INSURANCE_PACKAGES.find(
        (p: InsurancePackageType) => p.id === insurancePackage,
      );
      const contractData = apiData.hop_dong.find(
        (c: InsuranceContract) => c.ten === selectedPkg?.name,
      );
      const packageData = insuranceSubOption
        ? contractData?.cac_goi.find(
          (g: InsuranceCategory) =>
            g.ten ===
            selectedPkg?.subOptions?.find((s) => s.id === insuranceSubOption)
              ?.name,
        )
        : null;

      const selectedTreatmentType = TREATMENT_TYPES.find(
        (t) => t.id === treatmentType,
      );
      const loaiDieuTri = selectedTreatmentType?.ma || treatmentType;

      let ocrData: any = null;

      await submitClaimOcr(
        {
          hopDong: selectedPkg?.name || "",
          goi: packageData?.ten || "",
          loai_dieu_tri: loaiDieuTri,
          files: uploadedFiles.map((f) => f.file),
          contractFiles: contractFiles.length > 0 ? contractFiles : undefined,
        },
        {
          onProgress: (message) => {
            setProcessingSteps((prev) => [
              ...prev,
              { type: "progress", message, status: "loading" },
            ]);
          },
          onDocument: (name) => {
            setProcessingSteps((prev) => [
              ...prev,
              { type: "document", message: name, status: "done" },
            ]);
          },
          onResult: (data) => {
            ocrData = data;
          },
          onDone: () => {
            setIsCalculating(false);
            if (ocrData) {
              setOcrResult(ocrData);
              setShowOcrReview(true);
            } else {
              setClaimResult({
                error: "Không nhận được kết quả dữ liệu từ hệ thống OCR",
              });
              setShowResultModal(true);
            }
          },
          onMissingDocuments: (message, docs) => {
            setIsCalculating(false);
            setClaimResult({ error: message, missingDocuments: docs });
            setShowResultModal(true);
          },
          onError: (error, missingDocuments, suggestedDocuments) => {
            setIsCalculating(false);
            setClaimResult({ error, missingDocuments, suggestedDocuments });
            setShowResultModal(true);
          },
        },
      );
    } catch (error) {
      console.error("Error:", error);
      setIsCalculating(false);
      setClaimResult({ error: "Có lỗi xảy ra khi đọc hồ sơ OCR" });
      setShowResultModal(true);
    }
  };

  const handleAnalyse = async (dataToAnalyse: any) => {
    setIsCalculating(true);
    setProcessingSteps([
      {
        type: "progress",
        message: "Đang gửi dữ liệu phân tích AI...",
        status: "loading",
      },
    ]);

    let resultMarkdown = "";

    try {
      await submitClaimAnalyse(dataToAnalyse, {
        onProgress: (message) => {
          setProcessingSteps((prev) => [
            ...prev,
            { type: "progress", message, status: "loading" },
          ]);
        },
        onDocument: (name) => {
          setProcessingSteps((prev) => [
            ...prev,
            { type: "document", message: name, status: "done" },
          ]);
        },
        onResult: (markdown) => {
          resultMarkdown = markdown;
        },
        onDone: () => {
          setIsCalculating(false);
          setShowOcrReview(false);
          if (resultMarkdown) {
            setClaimResult({ markdown: resultMarkdown });
            if (
              typeof window !== "undefined" &&
              "Notification" in window &&
              Notification.permission === "granted"
            ) {
              const notification = new Notification("Thẩm định hoàn tất!", {
                body: "Kết quả thẩm định hồ sơ của bạn đã có. Nhấn để xem ngay.",
                icon: "/favicon.ico",
              });
              notification.onclick = () => {
                window.focus();
                notification.close();
              };
            }
          } else {
            setClaimResult({ error: "Không nhận được kết quả từ hệ thống AI" });
          }
          setShowResultModal(true);
        },
        onMissingDocuments: (message, docs) => {
          setIsCalculating(false);
          setShowOcrReview(false);
          setClaimResult({ error: message, missingDocuments: docs });
          setShowResultModal(true);
        },
        onError: (error, missingDocuments, suggestedDocuments) => {
          setIsCalculating(false);
          setShowOcrReview(false);
          setClaimResult({ error, missingDocuments, suggestedDocuments });
          setShowResultModal(true);
        },
      });
    } catch (error) {
      console.error("Analyse Error:", error);
      setIsCalculating(false);
      setShowOcrReview(false);
      setClaimResult({ error: "Có lỗi xảy ra khi tính toán claim" });
      setShowResultModal(true);
    }
  };

  const hasUploadedFiles = uploadedFiles.length > 0;
  const totalFileCount = uploadedFiles.length;

  const currentPkg = INSURANCE_PACKAGES.find(
    (p: InsurancePackageType) => p.id === insurancePackage,
  );
  const isPackageSelectionComplete =
    insurancePackage && (!currentPkg?.hasSubOptions || insuranceSubOption);

  const stepLabels = ["Gói BH", "Điều trị", "Hồ sơ"];
  const totalSteps = 3;

  const canProceedToStep2 = isPackageSelectionComplete;
  const canProceedToStep3 = canProceedToStep2 && treatmentType;

  const canCalculateClaim =
    canProceedToStep3 && !isLoadingDocumentTypes && hasUploadedFiles;

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

  const handleCreateNewRequest = () => {
    window.open(window.location.href, "_blank");
  };

  const handleFilePreview = (file: FileWithPreview) => {
    setPreviewFile({
      isOpen: true,
      name: file.file.name,
      url: file.previewUrl || URL.createObjectURL(file.file),
      isImage: isImageFile(file.file),
    });
  };

  return (
    <div className="h-screen flex flex-col bg-gradient-to-br from-gray-50 via-white to-teal-50 overflow-hidden text-gray-900">
      {/* Header */}
      <header className="flex-shrink-0 bg-gradient-to-r from-teal-500 to-cyan-500 text-white shadow-lg z-50">
        <div className="max-w-6xl mx-auto px-4 py-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-white p-2 rounded-lg shadow-sm">
              <FontAwesomeIcon icon={faShieldHalved} className="w-6 h-6 text-teal-600" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight">
                Yêu cầu bồi thường bảo hiểm
              </h1>
              <p className="text-teal-100 text-xs font-medium opacity-90">
                Hoàn thành 3 bước đơn giản
              </p>
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
            {/* Form Area */}
            <div className="lg:col-span-2 flex flex-col h-full bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden">
              <div className="p-6 pb-2 border-b border-gray-50 flex-shrink-0 bg-white">
                <StepIndicator
                  currentStep={currentStep}
                  totalSteps={totalSteps}
                  stepLabels={stepLabels}
                />
              </div>

              <div className="flex-1 overflow-y-auto p-6 scroll-smooth">
                {currentStep === 1 && (
                  <div className="animate-fadeIn">
                    <InsurancePackageSelector
                      selectedPackage={insurancePackage}
                      selectedSubOption={insuranceSubOption}
                      onPackageSelect={handleInsurancePackageSelect}
                      onSubOptionSelect={handleInsuranceSubOptionSelect}
                      onPreview={handlePackagePreview}
                      contractFileCount={
                        contractFiles.length > 0
                          ? contractFiles.length
                          : undefined
                      }
                      onEditContract={handleEditContract}
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
                      uploadedFiles={uploadedFiles}
                      onFilesAdd={handleFilesAdd}
                      onFileRemove={handleFileRemove}
                      onFilePreview={handleFilePreview}
                      isLoading={isLoadingDocumentTypes}
                    />
                  </div>
                )}
              </div>

              {/* Navigation Bar */}
              <div className="p-6 pt-4 border-t border-gray-100 flex-shrink-0 flex justify-between bg-gray-50/50">
                <button
                  onClick={handleBack}
                  disabled={currentStep === 1}
                  className={`
                    px-5 py-2.5 rounded-lg font-medium text-sm transition-all
                    ${currentStep === 1
                      ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                      : "bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 shadow-sm"
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
                      ${(currentStep === 1 && !canProceedToStep2) ||
                        (currentStep === 2 && !canProceedToStep3)
                        ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                        : "bg-gradient-to-r from-teal-500 to-cyan-500 text-white hover:from-teal-600 hover:to-cyan-600 shadow-sm hover:shadow-md"
                      }
                    `}
                  >
                    Tiếp theo →
                  </button>
                ) : (
                  <CalculateButton
                    disabled={!canCalculateClaim}
                    loading={isCalculating}
                    onClick={handleCalculate}
                  />
                )}
              </div>
            </div>

            {/* Sidebar */}
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
        missingDocuments={claimResult.missingDocuments}
        suggestedDocuments={claimResult.suggestedDocuments}
        ocrData={ocrResult}
      />

      {/* OCR Review Popup */}
      <OcrReviewPopup
        isOpen={showOcrReview}
        onClose={() => setShowOcrReview(false)}
        ocrData={ocrResult}
        onConfirm={handleAnalyse}
      />

      {/* Package Preview Modal */}
      <PackagePreviewModal
        isOpen={previewModal.isOpen}
        onClose={() => setPreviewModal({ ...previewModal, isOpen: false })}
        packageName={previewModal.name}
        previewContent={previewModal.content}
      />

      <ContractUploadModal
        isOpen={showContractModal}
        packageName={
          INSURANCE_PACKAGES.find((p) => p.id === insurancePackage)?.name || ""
        }
        subOptionName={
          INSURANCE_PACKAGES.find(
            (p) => p.id === insurancePackage,
          )?.subOptions?.find((s) => s.id === insuranceSubOption)?.name || ""
        }
        initialFiles={contractFiles}
        onConfirm={handleContractConfirm}
        onSkip={handleContractSkip}
        onPreviewFile={(file) => {
          setPreviewFile({
            isOpen: true,
            name: file.name,
            url: URL.createObjectURL(file),
            isImage: isImageFile(file),
          });
        }}
      />

      <FilePreviewModal
        isOpen={previewFile.isOpen}
        onClose={() => setPreviewFile({ ...previewFile, isOpen: false })}
        fileName={previewFile.name}
        fileUrl={previewFile.url}
        isImage={previewFile.isImage}
      />

      {/* Loading Overlay with SSE progress */}
      {isCalculating && (
        <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-black/40 backdrop-blur-sm animate-fadeIn px-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
            {/* Header: current progress step */}
            <div className="bg-gradient-to-r from-teal-500 to-cyan-500 px-6 pt-6 pb-5 text-white">
              <div className="flex items-center gap-4">
                <div className="relative flex-shrink-0">
                  <div className="w-12 h-12 border-4 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <FontAwesomeIcon icon={faFileContract} className="w-5 h-5 text-white" />
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-teal-100 uppercase tracking-wider mb-0.5">
                    Đang xử lý
                  </p>
                  <p className="text-sm font-semibold text-white leading-snug">
                    {processingSteps
                      .filter((s) => s.type === "progress")
                      .slice(-1)[0]?.message || "Đang kết nối máy chủ..."}
                  </p>
                </div>
              </div>
            </div>

            {/* Body: document checklist */}
            <div className="px-5 py-4">
              {processingSteps.some((s) => s.type === "document") && (
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
                  Kiểm tra tài liệu
                </p>
              )}

              <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                {processingSteps.filter((s) => s.type === "document").length ===
                  0 && (
                    <div className="flex items-center gap-3 py-3">
                      <div className="w-4 h-4 rounded-full border-2 border-gray-200 border-t-teal-400 animate-spin flex-shrink-0"></div>
                      <span className="text-sm text-gray-400">
                        Đang đọc hồ sơ...
                      </span>
                    </div>
                  )}
                {processingSteps
                  .filter((s) => s.type === "document")
                  .map((step, idx) => (
                    <div
                      key={idx}
                      className={`flex items-start gap-3 rounded-xl px-3 py-2.5 ${step.status === "fail"
                        ? "bg-red-50 border border-red-100"
                        : "bg-emerald-50 border border-emerald-100"
                        }`}
                    >
                      <div
                        className={`flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center mt-0.5 ${step.status === "fail"
                          ? "bg-red-500"
                          : "bg-emerald-500"
                          }`}
                      >
                        {step.status === "done" ? (
                          <FontAwesomeIcon icon={faCheck} className="w-3 h-3 text-white" />
                        ) : (
                          <FontAwesomeIcon icon={faXmark} className="w-3 h-3 text-white" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p
                          className={`text-sm font-semibold leading-snug ${step.status === "fail"
                            ? "text-red-700"
                            : "text-emerald-700"
                            }`}
                        >
                          {step.message}
                        </p>
                        {step.errors && step.errors.length > 0 && (
                          <ul className="mt-1.5 space-y-1">
                            {step.errors.map((err, i) => (
                              <li
                                key={i}
                                className="text-xs text-red-500 flex items-start gap-1.5"
                              >
                                <span className="flex-shrink-0">—</span>
                                <span>{err}</span>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    </div>
                  ))}
              </div>
            </div>

            {/* Footer */}
            <div className="px-5 pb-5">
              <button
                onClick={handleCreateNewRequest}
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 text-gray-500 font-medium rounded-xl hover:bg-gray-100 transition-all text-sm flex items-center justify-center gap-2"
              >
                <FontAwesomeIcon icon={faPlus} className="w-4 h-4" />
                Tạo yêu cầu mới (Tab mới)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
