"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faFileContract, faCircleNotch, faXmark, faChevronLeft, faChevronRight, faImage, faEye } from "@fortawesome/free-solid-svg-icons";
import {
  buildPageImageUrl,
  type OcrResult,
  type OcrReviewDocumentUploaded,
  type OcrReviewFailedDocument,
  type OcrReviewPageEntry,
} from "@/lib/api";
import StructuredFieldsView from "./StructuredFieldsView";
import { DEMO_FIELDS_BY_DOC_TYPE } from "@/lib/demoFields";

interface OcrReviewPopupProps {
  isOpen: boolean;
  onClose: () => void;
  ocrData: OcrResult | null;
  onConfirm: (data: OcrResult) => void;
  isSubmitting?: boolean;
}

const contractKeyLabels: Record<string, string> = {
  so_hop_dong: "Số Hợp Đồng",
  ngay_hieu_luc: "Ngày Hiệu Lực",
  ngay_het_han: "Ngày Hết Hạn",
  ten_goi_bao_hiem: "Tên Gói Bảo Hiểm",
  ten_chuong_trinh: "Tên Chương Trình",
};

type ReviewCardStatus = "clean" | "issue" | "missing";

function getStatusMeta(status: ReviewCardStatus) {
  if (status === "issue") {
    return {
      label: "Có vấn đề",
      cardClass: "border-rose-200 bg-rose-50/80",
      dotClass: "bg-rose-500",
      badgeClass: "bg-rose-100 text-rose-700 border-rose-200",
      titleClass: "text-rose-900",
    };
  }

  if (status === "missing") {
    return {
      label: "Còn thiếu",
      cardClass: "border-amber-200 bg-amber-50/80",
      dotClass: "bg-amber-500",
      badgeClass: "bg-amber-100 text-amber-700 border-amber-200",
      titleClass: "text-amber-900",
    };
  }

  return {
    label: "Đạt",
    cardClass: "border-emerald-200 bg-emerald-50/80",
    dotClass: "bg-emerald-500",
    badgeClass: "bg-emerald-100 text-emerald-700 border-emerald-200",
    titleClass: "text-emerald-900",
  };
}

function humanizeField(field: string): string {
  const labels: Record<string, string> = {
    ho_ten: "Họ tên",
    ngay_sinh: "Ngày sinh",
    cccd_cmnd: "CCCD/CMND",
    ten_benh_vien: "Tên bệnh viện",
    chan_doan: "Chẩn đoán",
    ngay_vao_vien: "Ngày vào viện",
    ngay_ra_vien: "Ngày ra viện",
  };
  return labels[field] || field;
}

export default function OcrReviewPopup({
  isOpen,
  onClose,
  ocrData,
  onConfirm,
  isSubmitting = false,
}: OcrReviewPopupProps) {
  const [activeTab, setActiveTab] = useState<string>("");
  const [tabs, setTabs] = useState<string[]>([]);
  const [pageIndex, setPageIndex] = useState(0);
  const [imageError, setImageError] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);
  const [showMarkdownFullScreen, setShowMarkdownFullScreen] = useState(false);
  const pageRefs = useRef<Array<HTMLDivElement | null>>([]);

  const extractedByType = useMemo(() => {
    const map = new Map<string, NonNullable<OcrResult["extracted_documents"]>[number]>();
    (ocrData?.extracted_documents || []).forEach((d) => map.set(d.doc_type, d));
    return map;
  }, [ocrData?.extracted_documents]);

  const uploadedDocSummariesFromResult: OcrReviewDocumentUploaded[] =
    (ocrData?.uploaded_documents || []).map((doc) => {
      const extracted = extractedByType.get(doc.ma);
      const pagesFromExtracted = (extracted?.pages || []).map((page) => ({
        source: page.file_name,
        page_number: page.page_number,
        file_name: page.file_name,
        content: "",
      }));
      const pagesFromLegacy = (ocrData?.ho_so_full?.[doc.ma] || []).map((page) => ({
        source: page.source,
        page_number: page.page_number,
        file_name: page.file_name,
        content: page.content,
      }));
      return {
        doc_type_ma: doc.ma,
        ten: doc.ten,
        pages: pagesFromExtracted.length > 0 ? pagesFromExtracted : pagesFromLegacy,
      };
    });
  const fallbackReviewPayload = useMemo(() => {
    const validationResult = ocrData?.validation_result as any;
    const conflicts = validationResult?.conflicts as any;
    if (!conflicts) return null;

    const byDoc = new Map<string, OcrReviewFailedDocument>();
    const ensureDoc = (docType: string) => {
      if (!docType) return null;
      if (!byDoc.has(docType)) {
        const uploaded = uploadedDocSummariesFromResult.find((d) => d.doc_type_ma === docType);
        byDoc.set(docType, {
          doc_type_ma: docType,
          ten: uploaded?.ten || docType.replace(/_/g, " "),
          pages: uploaded?.pages || [],
          reasons: [],
        });
      }
      return byDoc.get(docType) || null;
    };

    const gcnConflicts = conflicts?.gcn_vs_doc_group_conflicts || [];
    gcnConflicts.forEach((conflict: any) => {
      const docGroups: string[] = conflict?.doc_groups || [];
      const fieldConflicts: any[] = conflict?.field_conflicts || [];
      docGroups.forEach((docType) => {
        const item = ensureDoc(docType);
        if (!item) return;
        fieldConflicts.forEach((f) => {
          const field = String(f?.field || "");
          if (!field) return;
          item.reasons.push({
            rule_id: "GCN",
            message: `${humanizeField(field)} không khớp với thông tin hợp đồng`,
          });
        });
      });
    });

    const interConflicts = conflicts?.inter_doc_group_conflicts || [];
    interConflicts.forEach((conflict: any) => {
      const docGroups: string[] = conflict?.doc_groups || [];
      const fieldConflicts: any[] = conflict?.field_conflicts || [];
      docGroups.forEach((docType) => {
        if (docType === "giay_ra_vien") return;
        const item = ensureDoc(docType);
        if (!item) return;
        fieldConflicts.forEach((f) => {
          const field = String(f?.field || "");
          if (!field) return;
          item.reasons.push({
            rule_id: "INT",
            message: `${humanizeField(field)} không khớp giữa các giấy tờ`,
          });
        });
      });
    });

    const failedDocuments = Array.from(byDoc.values()).filter((d) => d.reasons.length > 0);
    return {
      counts: {
        uploaded: uploadedDocSummariesFromResult.length,
        missing: (ocrData?.missing_documents || []).length,
        failed: failedDocuments.length,
      },
      uploaded_documents: uploadedDocSummariesFromResult,
      missing_documents: ocrData?.missing_documents || [],
      failed_documents: failedDocuments,
    };
  }, [ocrData, uploadedDocSummariesFromResult]);

  const reviewPayload = ocrData?.ocr_review || fallbackReviewPayload;
  const uploadedDocSummaries: OcrReviewDocumentUploaded[] =
    reviewPayload?.uploaded_documents || uploadedDocSummariesFromResult;
  const failedDocuments: OcrReviewFailedDocument[] = reviewPayload?.failed_documents || [];
  const missingDocSummaries = reviewPayload?.missing_documents || ocrData?.missing_documents || [];
  const failedDocumentMap = new Map(failedDocuments.map((item) => [item.doc_type_ma, item]));
  const showValidationUnavailableNotice =
    !ocrData?.ocr_review &&
    !ocrData?.validation_result &&
    (ocrData?.status === "validation_failed" || ocrData?.status === "missing_documents");

  const docKeys =
    uploadedDocSummaries.length > 0
      ? uploadedDocSummaries.map((d) => d.doc_type_ma)
      : ocrData?.ho_so_full
        ? Object.keys(ocrData.ho_so_full)
        : ocrData?.ho_so
          ? Object.keys(ocrData.ho_so)
          : [];
  const selectedDocSummary = uploadedDocSummaries.find((doc) => doc.doc_type_ma === activeTab);
  const pages: OcrReviewPageEntry[] = selectedDocSummary?.pages || [];
  const currentPage: OcrReviewPageEntry | null = pages[pageIndex] ?? null;
  const imageUrl =
    currentPage && ocrData?.session_id
      ? buildPageImageUrl(ocrData.session_id, currentPage.source)
      : "";

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      if (docKeys.length > 0) {
        setTabs(docKeys);
        if (!activeTab || !docKeys.includes(activeTab)) {
          setActiveTab(docKeys[0]);
          setPageIndex(0);
        }
      }
    } else {
      document.body.style.overflow = "unset";
    }

    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen, ocrData, docKeys.length]);

  useEffect(() => {
    setPageIndex(0);
    setImageError(false);
  }, [activeTab]);
  useEffect(() => {
    setImageError(false);
    if (!showMarkdownFullScreen) return;
    const el = pageRefs.current[pageIndex];
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [pageIndex, showMarkdownFullScreen]);

  if (!isOpen) return null;

  const extractedDoc = activeTab ? extractedByType.get(activeTab) : undefined;
  const activeFields: Record<string, unknown> | undefined =
    (extractedDoc?.fields as Record<string, unknown> | undefined) ??
    DEMO_FIELDS_BY_DOC_TYPE[activeTab || ""];
  const hasStructuredFields = Boolean(
    activeFields && typeof activeFields === "object" && Object.keys(activeFields).length > 0,
  );
  const canShowImage = Boolean(currentPage && ocrData?.session_id);

  return (
    <div className="fixed inset-0 z-[60] overflow-y-auto p-4 animate-fadeIn">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={!isSubmitting ? onClose : undefined}
      ></div>

      {/* Modal */}
      <div className="relative mx-auto my-4 bg-white rounded-2xl shadow-2xl max-w-7xl w-full min-h-[72vh] flex flex-col overflow-hidden animate-scaleIn">
        {/* Header */}
        <div className="flex-shrink-0 bg-gradient-to-r from-teal-500 to-cyan-500 text-white px-6 py-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold">Kết quả đọc hồ sơ (OCR)</h3>
          {!isSubmitting && (
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full hover:bg-white/20 flex items-center justify-center transition-colors"
            >
              ✕
            </button>
          )}
        </div>

        {/* Contract Information - Top Area */}
        {ocrData?.contract_details && (
          <div className="flex-shrink-0 bg-teal-50/30 px-6 py-5 border-b border-teal-100">
            <h4 className="text-teal-800 font-semibold mb-3 flex items-center gap-2">
              <FontAwesomeIcon icon={faFileContract} className="w-5 h-5" />
              Thông tin Hợp đồng (Bóc tách tự động)
            </h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              {Object.entries(ocrData.contract_details).map(
                ([key, value]) => {
                  if (typeof value === "object" && value !== null)
                    return null; // Skip complex objects
                  if (!(key in contractKeyLabels))
                    return null; // Only show known fields
                  return (
                    <div key={key} className="flex flex-col">
                      <span className="text-gray-500 font-medium">
                        {contractKeyLabels[key] || key.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase())}
                      </span>
                      <span className="text-gray-900 font-semibold">
                        {(value as React.ReactNode) || (
                          <span className="text-gray-400 italic">Trống</span>
                        )}
                      </span>
                    </div>
                  );
                },
              )}
            </div>
          </div>
        )}

        <div className="bg-slate-50 px-6 py-5">
          {showValidationUnavailableNotice && (
            <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              Backend chưa gửi chi tiết validate/conflicts trong payload OCR (`ocr_review`/`validation_result`),
              nên FE chưa thể hiển thị danh sách lỗi theo từng giấy tờ.
            </div>
          )}
          <div className={`grid gap-5 ${missingDocSummaries.length > 0 ? "xl:grid-cols-[minmax(0,1.35fr)_minmax(300px,0.65fr)]" : "grid-cols-1"}`}>
            <div className="space-y-4">
              <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h4 className="text-base font-semibold text-gray-900">Giấy tờ đã nhận</h4>
                    <p className="mt-1 text-sm text-gray-500">
                      Chỉ có 2 trạng thái trong cột này: xanh là hợp lệ, đỏ là đã tải lên nhưng validate bị lỗi.
                    </p>
                  </div>
                  <span className="inline-flex items-center rounded-full border border-gray-200 bg-gray-50 px-3 py-1 text-sm font-semibold text-gray-700">
                    {uploadedDocSummaries.length} giấy tờ
                  </span>
                </div>

                <div className="mt-4 max-h-[52vh] overflow-y-auto pr-2 space-y-3">
                  {uploadedDocSummaries.map((doc) => {
                    const hasIssue = failedDocumentMap.has(doc.doc_type_ma);
                    const meta = getStatusMeta(hasIssue ? "issue" : "clean");
                    const isActive = activeTab === doc.doc_type_ma;
                    const failedDoc = failedDocumentMap.get(doc.doc_type_ma);
                    const pageCount = doc.pages.length;
                    const hasExtractedFields = extractedByType.has(doc.doc_type_ma);
                    const canView = pageCount > 0 || hasExtractedFields;

                    return (
                      <div
                        key={doc.doc_type_ma}
                        className={`rounded-xl border px-4 py-3 transition-all ${meta.cardClass} ${
                          isActive ? "ring-2 ring-teal-400 shadow-sm" : ""
                        }`}
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div
                            role="button"
                            tabIndex={0}
                            onClick={() => {
                              setActiveTab(doc.doc_type_ma);
                            }}
                            onKeyDown={(event) => {
                              if (event.key === "Enter" || event.key === " ") {
                                event.preventDefault();
                                setActiveTab(doc.doc_type_ma);
                              }
                            }}
                            className="min-w-0 flex-1 cursor-pointer"
                          >
                            <div className="flex items-center gap-2">
                              <span className={`h-2.5 w-2.5 rounded-full ${meta.dotClass}`} />
                              <h5 className={`text-sm font-semibold ${meta.titleClass}`}>{doc.ten}</h5>
                            </div>

                            <div className="mt-2 flex flex-wrap gap-2">
                              <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold ${meta.badgeClass}`}>
                                {meta.label}
                              </span>
                              <span className="inline-flex items-center rounded-full border border-gray-200 bg-white px-2.5 py-1 text-xs font-medium text-gray-600">
                                {pageCount} trang
                              </span>
                              {failedDoc && failedDoc.reasons.length > 0 && (
                                <span className="inline-flex items-center rounded-full border border-rose-200 bg-white px-2.5 py-1 text-xs font-medium text-rose-700">
                                  {failedDoc.reasons.length} lỗi
                                </span>
                              )}
                            </div>

                            {failedDoc && failedDoc.reasons.length > 0 && (
                              <div className="mt-2 rounded-lg border border-white/80 bg-white/85 px-3 py-2 text-sm text-gray-700">
                                <ul className="space-y-1 text-sm text-rose-800">
                                  {failedDoc.reasons.map((reason, index) => (
                                    <li key={`${reason.rule_id}-${index}`}>
                                      Rule {reason.rule_id}: {reason.message}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </div>

                          <div className="flex-shrink-0 self-center">
                            {canView ? (
                              <button
                                type="button"
                                onClick={() => {
                                  setActiveTab(doc.doc_type_ma);
                                  setPageIndex(0);
                                  setShowMarkdownFullScreen(true);
                                }}
                                className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-teal-200 bg-white text-teal-700 shadow-sm hover:bg-teal-50"
                                title="Xem dữ liệu bóc tách"
                                aria-label={`Xem dữ liệu bóc tách ${doc.ten}`}
                              >
                                <FontAwesomeIcon icon={faEye} className="h-4 w-4" />
                              </button>
                            ) : (
                              <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-gray-200 bg-gray-100 text-gray-400">
                                <FontAwesomeIcon icon={faEye} className="h-4 w-4" />
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}

                  {uploadedDocSummaries.length === 0 && (
                    <div className="rounded-2xl border border-dashed border-gray-300 bg-gray-50 px-5 py-8 text-center text-sm text-gray-500">
                      Chưa có giấy tờ nào được tải lên.
                    </div>
                  )}
                </div>
              </div>

              {selectedDocSummary && (
                <div className="rounded-2xl border border-dashed border-gray-300 bg-white px-6 py-10 text-center shadow-sm">
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-teal-50 text-teal-600">
                    <FontAwesomeIcon icon={faEye} className="h-5 w-5" />
                  </div>
                  <h4 className="mt-4 text-base font-semibold text-gray-900">
                    Chưa mở dữ liệu bóc tách của giấy tờ
                  </h4>
                  <p className="mt-2 text-sm text-gray-500">
                    Bấm vào biểu tượng con mắt ở từng giấy tờ để xem các trường đã bóc tách và ảnh chứng từ tương ứng.
                  </p>
                </div>
              )}
            </div>

            {missingDocSummaries.length > 0 && (
              <div className="space-y-4">
                <div className="rounded-2xl border border-amber-200 bg-white p-5 shadow-sm">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <h4 className="text-base font-semibold text-amber-900">Giấy tờ còn thiếu</h4>
                      <p className="mt-1 text-sm text-amber-700">
                        Đây là các giấy tờ bắt buộc chưa được tải lên nên chưa có dữ liệu OCR.
                      </p>
                    </div>
                    <span className="inline-flex items-center rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-sm font-semibold text-amber-800">
                      {missingDocSummaries.length} giấy tờ
                    </span>
                  </div>

                  <div className="mt-4 max-h-[52vh] overflow-y-auto pr-2 space-y-3">
                    {missingDocSummaries.map((doc, idx) => {
                      const meta = getStatusMeta("missing");
                      return (
                        <div
                          key={`${doc.ma}-${idx}`}
                          className={`rounded-2xl border p-4 ${meta.cardClass}`}
                        >
                          <div className="flex items-center gap-2">
                            <span className={`h-2.5 w-2.5 rounded-full ${meta.dotClass}`} />
                            <h5 className={`text-sm font-semibold ${meta.titleClass}`}>{doc.ten}</h5>
                          </div>
                          <div className="mt-2">
                            <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold ${meta.badgeClass}`}>
                              {meta.label}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Modal xem ảnh trang (mở khi bấm "Xem ảnh trang") */}
        {showImageModal && canShowImage && (
          <div
            className="fixed inset-0 z-[70] flex items-center justify-center bg-black/80 p-4"
            onClick={() => setShowImageModal(false)}
          >
            <div className="relative max-w-[95vw] max-h-[95vh] flex items-center justify-center" onClick={(e) => e.stopPropagation()}>
              <button
                type="button"
                onClick={() => setShowImageModal(false)}
                className="absolute -top-10 right-0 text-white hover:text-gray-200 text-2xl font-bold"
              >
                ✕
              </button>
              {imageError ? (
                <div className="bg-white rounded-xl p-8 text-center text-gray-600">
                  <FontAwesomeIcon icon={faImage} className="w-12 h-12 text-gray-300 mb-3" />
                  <p className="font-medium">Không tải được ảnh trang</p>
                  <p className="text-sm">Trang không tồn tại hoặc phiên đã hết hạn (30 phút).</p>
                </div>
              ) : (
                <img
                  src={imageUrl}
                  alt={`Trang ${currentPage!.page_number}`}
                  className="max-w-full max-h-[90vh] object-contain shadow-2xl rounded"
                  onError={() => setImageError(true)}
                  onClick={(e) => e.stopPropagation()}
                />
              )}
            </div>
          </div>
        )}

        {/* Full screen markdown (mở khi bấm "Xem toàn màn hình") */}
        {showMarkdownFullScreen && (
          <div
            className="fixed inset-0 z-[70] flex flex-col bg-gray-50"
            role="dialog"
            aria-label="Xem toàn màn hình"
          >
            {/* Header controls */}
            <div className="flex-shrink-0 flex flex-col sm:flex-row sm:items-center justify-between px-6 py-3 bg-white border-b border-gray-200 shadow-sm">
              <div className="flex items-center gap-4 flex-1 overflow-x-auto hide-scrollbar">
                {/* Select Ticket */}
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-700 whitespace-nowrap">Loại giấy tờ:</span>
                  <select 
                    value={activeTab}
                    onChange={(e) => setActiveTab(e.target.value)}
                    className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm bg-white text-gray-800 min-w-[200px] outline-none focus:border-teal-500"
                  >
                    {tabs.map((tab) => {
                      const docName = uploadedDocSummaries.find((d) => d.doc_type_ma === tab)?.ten ??
                        ocrData?.ho_so_full?.[tab]?.[0]?.ten_giay_to ??
                        ocrData?.ho_so?.[tab]?.[0]?.ten_giay_to ??
                        tab.replace(/_/g, " ");
                      return <option key={tab} value={tab}>{docName}</option>;
                    })}
                  </select>
                </div>

                {/* Select Page */}
                {pages.length > 0 && (
                  <div className="flex items-center gap-2 border-l border-gray-200 pl-4">
                    <span className="text-sm font-medium text-gray-700 whitespace-nowrap">Trang:</span>
                    <button
                      type="button"
                      disabled={pageIndex === 0}
                      onClick={() => setPageIndex((i) => i - 1)}
                      className="p-1.5 rounded text-gray-600 hover:bg-gray-200 disabled:opacity-40 disabled:cursor-not-allowed border border-gray-200 bg-white"
                    >
                      <FontAwesomeIcon icon={faChevronLeft} className="w-4 h-4" />
                    </button>
                    <select
                      value={pageIndex}
                      onChange={(e) => setPageIndex(Number(e.target.value))}
                      className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm bg-white text-gray-800 outline-none focus:border-teal-500"
                    >
                      {pages.map((_, i) => (
                        <option key={i} value={i}>Trang {i + 1}</option>
                      ))}
                    </select>
                    <button
                      type="button"
                      disabled={pageIndex >= pages.length - 1}
                      onClick={() => setPageIndex((i) => i + 1)}
                      className="p-1.5 rounded text-gray-600 hover:bg-gray-200 disabled:opacity-40 disabled:cursor-not-allowed border border-gray-200 bg-white"
                    >
                      <FontAwesomeIcon icon={faChevronRight} className="w-4 h-4" />
                    </button>
                    {currentPage && (
                      <span className="text-xs text-gray-500 ml-2 truncate max-w-[200px]" title={currentPage.file_name}>
                        {currentPage.file_name}
                      </span>
                    )}
                  </div>
                )}
              </div>
              <button
                type="button"
                onClick={() => setShowMarkdownFullScreen(false)}
                className="mt-3 sm:mt-0 px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium transition-colors border border-gray-200 flex items-center gap-2 whitespace-nowrap"
              >
                <FontAwesomeIcon icon={faXmark} className="w-4 h-4" />
                Đóng
              </button>
            </div>
            
            {/* Split View */}
            <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
              {/* Left Panel: All page images (gallery) */}
              <div className="w-full md:w-1/2 border-b md:border-b-0 md:border-r border-gray-300 bg-gray-200/50 flex flex-col relative overflow-hidden">
                <div className="bg-white/90 backdrop-blur px-4 py-2 border-b border-gray-200/50 flex items-center justify-between flex-shrink-0">
                  <span className="text-sm font-semibold text-gray-700">
                    Ảnh chứng từ gốc {pages.length > 0 && <span className="text-gray-400 font-normal">({pages.length} trang)</span>}
                  </span>
                </div>
                <div className="flex-1 overflow-y-auto p-4 space-y-6">
                  {pages.length > 0 && ocrData?.session_id ? (
                    pages.map((page, i) => {
                      const pageUrl = buildPageImageUrl(ocrData.session_id!, page.source);
                      return (
                        <div
                          key={`${page.file_name}-${i}`}
                          ref={(el) => { pageRefs.current[i] = el; }}
                          className={`rounded-lg border bg-white shadow-sm overflow-hidden ${
                            i === pageIndex ? "ring-2 ring-teal-400" : "border-gray-200"
                          }`}
                        >
                          <div className="flex items-center justify-between px-3 py-1.5 border-b border-gray-100 bg-gray-50 text-xs">
                            <span className="font-medium text-gray-700">Trang {page.page_number}</span>
                            <a
                              href={pageUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="text-teal-600 hover:text-teal-700 font-medium"
                              title="Mở ảnh sang tab mới"
                            >
                              Mở tab mới
                            </a>
                          </div>
                          <div className="p-2 flex items-center justify-center">
                            <img
                              src={pageUrl}
                              alt={`Trang ${page.page_number} — ${page.file_name}`}
                              className="max-w-full h-auto rounded cursor-zoom-in"
                              onClick={() => { setPageIndex(i); setImageError(false); setShowImageModal(true); }}
                              onError={(e) => { (e.currentTarget as HTMLImageElement).style.opacity = "0.3"; }}
                            />
                          </div>
                          <div className="px-3 py-1 text-xs text-gray-500 truncate" title={page.file_name}>
                            {page.file_name}
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="text-center text-gray-500 bg-white p-8 rounded-xl shadow-sm">
                      <FontAwesomeIcon icon={faImage} className="w-12 h-12 text-gray-300 mb-3" />
                      <p className="font-medium">Không có ảnh chứng từ cho giấy tờ này.</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Right Panel: Structured fields */}
              <div className="w-full md:w-1/2 bg-white flex flex-col overflow-hidden">
                <div className="bg-gray-50 px-4 py-2 border-b border-gray-200/50 flex-shrink-0">
                  <span className="text-sm font-semibold text-gray-700">Dữ liệu đã bóc tách</span>
                </div>
                <div className="flex-1 overflow-y-auto p-6 md:p-8">
                  {hasStructuredFields ? (
                    <StructuredFieldsView data={activeFields} />
                  ) : (
                    <div className="text-center text-gray-500 mt-10 p-8 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                      <p className="font-medium">Chưa có dữ liệu bóc tách cho giấy tờ này.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="flex-shrink-0 bg-gray-50 px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="px-6 py-2.5 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium disabled:opacity-50 whitespace-nowrap"
          >
            Sửa file / OCR lại
          </button>
          <button
            onClick={() => ocrData && onConfirm(ocrData)}
            disabled={isSubmitting || !ocrData}
            className="px-6 py-2.5 bg-gradient-to-r from-teal-500 to-cyan-600 text-white rounded-lg hover:from-teal-600 hover:to-cyan-700 transition-all font-medium flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed whitespace-nowrap"
          >
            {isSubmitting ? (
              <>
                <FontAwesomeIcon icon={faCircleNotch} className="w-4 h-4" spin />
                Đang xử lý...
              </>
            ) : (
              "Xác nhận và tính toán claim"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
