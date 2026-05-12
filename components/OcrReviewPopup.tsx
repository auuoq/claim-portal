"use client";

import { useState, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faFileContract, faCircleNotch, faXmark, faChevronLeft, faChevronRight, faImage, faExpand, faTriangleExclamation, faEye } from "@fortawesome/free-solid-svg-icons";
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

const markdownComponents = {
  h1: ({ node, ...props }: any) => <h1 className="text-2xl font-bold text-gray-800 mb-4" {...props} />,
  h2: ({ node, ...props }: any) => <h2 className="text-xl font-semibold text-gray-800 mt-6 mb-3" {...props} />,
  h3: ({ node, ...props }: any) => <h3 className="text-lg font-semibold text-gray-700 mt-4 mb-2" {...props} />,
  p: ({ node, ...props }: any) => <p className="text-gray-600 mb-3" {...props} />,
  ul: ({ node, ...props }: any) => <ul className="list-disc list-inside text-gray-600 mb-3 space-y-1" {...props} />,
  ol: ({ node, ...props }: any) => <ol className="list-decimal list-inside text-gray-600 mb-3 space-y-1" {...props} />,
  li: ({ node, ...props }: any) => <li className="text-gray-600" {...props} />,
  table: ({ node, ...props }: any) => <div className="overflow-x-auto my-6"><table className="min-w-full border-collapse border border-gray-200" {...props} /></div>,
  thead: ({ node, ...props }: any) => <thead className="bg-gray-50 border-b border-gray-200" {...props} />,
  tbody: ({ node, ...props }: any) => <tbody className="bg-white divide-y divide-gray-200" {...props} />,
  tr: ({ node, ...props }: any) => <tr className="hover:bg-gray-50/50 transition-colors" {...props} />,
  th: ({ node, ...props }: any) => <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider border border-gray-200" {...props} />,
  td: ({ node, ...props }: any) => <td className="px-4 py-3 text-sm text-gray-600 border border-gray-200" {...props} />,
  blockquote: ({ node, ...props }: any) => <blockquote className="border-l-4 border-teal-500 bg-teal-50/50 pl-4 py-2 m-4 italic text-gray-700 rounded-r" {...props} />,
  strong: ({ node, ...props }: any) => <strong className="font-semibold text-gray-800" {...props} />,
  code: ({ node, inline, ...props }: any) => inline ? <code className="bg-gray-100 text-teal-600 px-1.5 py-0.5 rounded text-sm font-mono" {...props} /> : <code className="block bg-gray-100 p-3 rounded-lg text-sm font-mono overflow-x-auto" {...props} />,
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

export default function OcrReviewPopup({
  isOpen,
  onClose,
  ocrData,
  onConfirm,
  isSubmitting = false,
}: OcrReviewPopupProps) {
  const [activeTab, setActiveTab] = useState<string>("");
  const [ocrViewerVisible, setOcrViewerVisible] = useState(false);
  const [tabs, setTabs] = useState<string[]>([]);
  const [pageIndex, setPageIndex] = useState(0);
  const [imageError, setImageError] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);
  const [showMarkdownFullScreen, setShowMarkdownFullScreen] = useState(false);
  const reviewPayload = ocrData?.ocr_review;
  const uploadedDocSummaries: OcrReviewDocumentUploaded[] =
    reviewPayload?.uploaded_documents ||
    (ocrData?.uploaded_documents || []).map((doc) => ({
      doc_type_ma: doc.ma,
      ten: doc.ten,
      pages: (ocrData?.ho_so_full?.[doc.ma] || []).map((page) => ({
        source: page.source,
        page_number: page.page_number,
        file_name: page.file_name,
        content: page.content,
      })),
    }));
  const failedDocuments: OcrReviewFailedDocument[] = reviewPayload?.failed_documents || [];
  const missingDocSummaries = reviewPayload?.missing_documents || ocrData?.missing_documents || [];
  const failedDocumentMap = new Map(failedDocuments.map((item) => [item.doc_type_ma, item]));
  const activeFailedDocument = activeTab ? failedDocumentMap.get(activeTab) : undefined;

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
          setOcrViewerVisible(false);
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
  }, [pageIndex]);

  if (!isOpen) return null;

  const activeContentArray = pages.length
    ? pages
    : (ocrData?.ho_so_full?.[activeTab || ""] || ocrData?.ho_so?.[activeTab || ""] || []);
  const activeMarkdownLegacy = activeContentArray
    .map((item: any) => (typeof item === "object" && item?.content != null ? item.content : item))
    .join("\n\n---\n\n");
  const activeMarkdown = currentPage ? currentPage.content : activeMarkdownLegacy;
  const extractedDoc = ocrData?.extracted_documents?.find(
    (d) => d.doc_type === activeTab,
  );
  const activeFields: Record<string, unknown> | undefined =
    (extractedDoc?.fields as Record<string, unknown> | undefined) ??
    DEMO_FIELDS_BY_DOC_TYPE[activeTab || ""];
  const hasStructuredFields = Boolean(
    activeFields && typeof activeFields === "object" && Object.keys(activeFields).length > 0,
  );
  const hasOcrContent = hasStructuredFields || Boolean(activeMarkdown);
  const canShowImage = Boolean(currentPage && ocrData?.session_id);
  const selectedDocTitle =
    selectedDocSummary?.ten ??
    ocrData?.ho_so_full?.[activeTab || ""]?.[0]?.ten_giay_to ??
    ocrData?.ho_so?.[activeTab || ""]?.[0]?.ten_giay_to ??
    activeTab?.replace(/_/g, " ");

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
                              setOcrViewerVisible(false);
                            }}
                            onKeyDown={(event) => {
                              if (event.key === "Enter" || event.key === " ") {
                                event.preventDefault();
                                setActiveTab(doc.doc_type_ma);
                                setOcrViewerVisible(false);
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
                            {pageCount > 0 ? (
                              <button
                                type="button"
                                onClick={() => {
                                  setActiveTab(doc.doc_type_ma);
                                  setPageIndex(0);
                                  setShowMarkdownFullScreen(true);
                                }}
                                className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-teal-200 bg-white text-teal-700 shadow-sm hover:bg-teal-50"
                                title="Xem OCR"
                                aria-label={`Xem OCR ${doc.ten}`}
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

              {selectedDocSummary && ocrViewerVisible && (
                <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
                  <div
                    className="absolute inset-0 bg-black/45"
                    onClick={() => setOcrViewerVisible(false)}
                  />

                  <div className="relative z-[71] w-full max-w-6xl max-h-[90vh] overflow-y-auto rounded-2xl border border-gray-200 bg-white p-5 shadow-2xl">
                    <button
                      type="button"
                      onClick={() => setOcrViewerVisible(false)}
                      className="absolute right-4 top-4 inline-flex h-8 w-8 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700"
                      aria-label="Đóng nội dung OCR"
                      title="Đóng"
                    >
                      <FontAwesomeIcon icon={faXmark} className="h-4 w-4" />
                    </button>

                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h4 className="truncate text-base font-semibold text-gray-900">
                        Nội dung OCR: {selectedDocTitle}
                      </h4>
                      <div className="mt-2 flex flex-wrap gap-2">
                        <span
                          className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold ${
                            getStatusMeta(activeFailedDocument ? "issue" : "clean").badgeClass
                          }`}
                        >
                          {getStatusMeta(activeFailedDocument ? "issue" : "clean").label}
                        </span>
                        <span className="inline-flex items-center rounded-full border border-gray-200 bg-gray-50 px-2.5 py-1 text-xs font-medium text-gray-600">
                          {selectedDocSummary.pages.length} trang OCR
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {canShowImage && (
                        <button
                          type="button"
                          onClick={() => { setImageError(false); setShowImageModal(true); }}
                          className="flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                        >
                          <FontAwesomeIcon icon={faImage} className="w-4 h-4" />
                          Xem ảnh trang
                        </button>
                      )}
                      {hasOcrContent && (
                        <button
                          type="button"
                          onClick={() => setShowMarkdownFullScreen(true)}
                          className="flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                          title="Xem toàn màn hình"
                        >
                          <FontAwesomeIcon icon={faExpand} className="w-4 h-4" />
                          Toàn màn hình
                        </button>
                      )}
                    </div>
                  </div>

                  {activeFailedDocument && (
                    <div className="mt-4 rounded-2xl border border-rose-100 bg-rose-50/60 p-4">
                      <h5 className="text-sm font-semibold text-rose-800 mb-2 flex items-center gap-2">
                        <FontAwesomeIcon icon={faTriangleExclamation} className="w-4 h-4 text-rose-500" />
                        Lý do giấy tờ đang có vấn đề
                      </h5>
                      <ul className="space-y-2 text-sm text-rose-800">
                        {activeFailedDocument.reasons.map((reason, index) => (
                          <li key={`${reason.rule_id}-${index}`}>
                            <span className="font-semibold">Rule {reason.rule_id}:</span> {reason.message}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {pages.length > 0 && (
                    <div className="mt-4 rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-medium text-gray-600 mr-1">Trang:</span>
                          <div className="flex items-center gap-1 overflow-x-auto max-w-[50vw]">
                            <button
                              type="button"
                              disabled={pageIndex === 0}
                              onClick={() => setPageIndex((i) => i - 1)}
                              className="p-1.5 rounded text-gray-600 hover:bg-gray-200 disabled:opacity-40 disabled:cursor-not-allowed"
                              aria-label="Trang trước"
                            >
                              <FontAwesomeIcon icon={faChevronLeft} className="w-4 h-4" />
                            </button>
                            {pages.map((_, i) => (
                              <button
                                key={i}
                                type="button"
                                onClick={() => setPageIndex(i)}
                                className={`
                                  min-w-[2rem] h-8 px-2 rounded text-sm font-medium transition-colors
                                  ${i === pageIndex
                                    ? "bg-teal-500 text-white shadow-sm"
                                    : "text-gray-600 hover:bg-gray-200 bg-white border border-gray-200"}
                                `}
                              >
                                {i + 1}
                              </button>
                            ))}
                            <button
                              type="button"
                              disabled={pageIndex >= pages.length - 1}
                              onClick={() => setPageIndex((i) => i + 1)}
                              className="p-1.5 rounded text-gray-600 hover:bg-gray-200 disabled:opacity-40 disabled:cursor-not-allowed"
                              aria-label="Trang sau"
                            >
                              <FontAwesomeIcon icon={faChevronRight} className="w-4 h-4" />
                            </button>
                          </div>
                          {currentPage && (
                            <span className="text-xs text-gray-500 ml-1 truncate max-w-[180px]" title={currentPage.file_name}>
                              {currentPage.file_name}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="mt-4 grid gap-4 xl:grid-cols-[minmax(0,1.15fr)_minmax(320px,0.85fr)]">
                    <div className="rounded-2xl border border-gray-200 bg-white shadow-sm">
                      <div className="border-b border-gray-200 px-5 py-3">
                        <h5 className="text-sm font-semibold text-gray-900">Kết quả nhận diện OCR</h5>
                        <p className="text-xs text-gray-500">
                          {hasStructuredFields
                            ? "Trường dữ liệu đã bóc tách của giấy tờ đang chọn."
                            : "Nội dung văn bản đã OCR của giấy tờ đang chọn."}
                        </p>
                      </div>
                      <div className="max-h-[50vh] overflow-y-auto px-5 py-5">
                        {hasStructuredFields ? (
                          <StructuredFieldsView data={activeFields} />
                        ) : activeMarkdown ? (
                          <div className="prose prose-teal max-w-none">
                            <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
                              {activeMarkdown}
                            </ReactMarkdown>
                          </div>
                        ) : (
                          <div className="text-center text-gray-500 py-10 px-4 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                            <p className="font-medium">Chưa có nội dung OCR cho loại giấy tờ này.</p>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="rounded-2xl border border-gray-200 bg-gray-50 shadow-sm overflow-hidden">
                      <div className="border-b border-gray-200 bg-white px-5 py-3">
                        <h5 className="text-sm font-semibold text-gray-900">Ảnh gốc theo trang</h5>
                        <p className="text-xs text-gray-500">Bấm nút xem ảnh để đối chiếu trực tiếp với chứng từ gốc.</p>
                      </div>
                      <div className="flex min-h-[360px] items-center justify-center p-4">
                        {canShowImage ? (
                          imageError ? (
                            <div className="text-center text-gray-500 bg-white p-8 rounded-xl shadow-sm">
                              <FontAwesomeIcon icon={faImage} className="w-12 h-12 text-gray-300 mb-3" />
                              <p className="font-medium">Không tải được ảnh trang</p>
                            </div>
                          ) : (
                            <img
                              src={imageUrl}
                              alt={`Trang ${currentPage?.page_number}`}
                              className="max-h-[42vh] w-auto rounded-xl border border-gray-200 bg-white object-contain shadow-sm"
                              onError={() => setImageError(true)}
                            />
                          )
                        ) : (
                          <div className="text-center text-gray-500 bg-white p-8 rounded-xl shadow-sm">
                            <FontAwesomeIcon icon={faImage} className="w-12 h-12 text-gray-300 mb-3" />
                            <p className="font-medium">Chọn giấy tờ có OCR để xem nội dung và ảnh gốc.</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                </div>
              )}

              {selectedDocSummary && !ocrViewerVisible && (
                <div className="rounded-2xl border border-dashed border-gray-300 bg-white px-6 py-10 text-center shadow-sm">
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-teal-50 text-teal-600">
                    <FontAwesomeIcon icon={faEye} className="h-5 w-5" />
                  </div>
                  <h4 className="mt-4 text-base font-semibold text-gray-900">
                    Chưa mở nội dung OCR của giấy tờ
                  </h4>
                  <p className="mt-2 text-sm text-gray-500">
                    Bấm vào biểu tượng con mắt ở từng giấy tờ để xem nội dung OCR và ảnh chứng từ tương ứng.
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
              {/* Left Panel: Image */}
              <div className="w-full md:w-1/2 border-b md:border-b-0 md:border-r border-gray-300 bg-gray-200/50 flex flex-col relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full bg-white/80 backdrop-blur px-4 py-2 border-b border-gray-200/50 z-10 flex items-center justify-between">
                  <span className="text-sm font-semibold text-gray-700">Ảnh chứng từ</span>
                  {imageUrl && (
                    <a 
                      href={imageUrl} 
                      target="_blank" 
                      rel="noreferrer" 
                      className="text-teal-600 hover:text-teal-700 text-sm font-medium"
                      title="Mở ảnh sang tab mới"
                    >
                      Mở tab mới
                    </a>
                  )}
                </div>
                <div className="flex-1 overflow-auto p-4 pt-12 flex items-center justify-center">
                  {canShowImage ? (
                    imageError ? (
                      <div className="text-center text-gray-500 bg-white p-8 rounded-xl shadow-sm">
                        <FontAwesomeIcon icon={faImage} className="w-12 h-12 text-gray-300 mb-3" />
                        <p className="font-medium">Không tải được ảnh trang</p>
                      </div>
                    ) : (
                      <img
                        src={imageUrl}
                        alt={`Trang ${currentPage?.page_number}`}
                        className="max-w-full m-auto shadow-md rounded"
                        onError={() => setImageError(true)}
                      />
                    )
                  ) : (
                     <div className="text-center text-gray-500 bg-white p-8 rounded-xl shadow-sm">
                       <p>Chưa có ảnh cho trang này.</p>
                     </div>
                  )}
                </div>
              </div>
              
              {/* Right Panel: Structured fields (fallback: markdown) */}
              <div className="w-full md:w-1/2 bg-white flex flex-col overflow-hidden">
                <div className="bg-gray-50 px-4 py-2 border-b border-gray-200/50 flex-shrink-0">
                  <span className="text-sm font-semibold text-gray-700">Kết quả nhận diện OCR</span>
                </div>
                <div className="flex-1 overflow-y-auto p-6 md:p-8">
                  {hasStructuredFields ? (
                    <StructuredFieldsView data={activeFields} />
                  ) : activeMarkdown ? (
                    <div className="prose prose-teal max-w-none">
                      <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
                        {activeMarkdown}
                      </ReactMarkdown>
                    </div>
                  ) : (
                    <div className="text-center text-gray-500 mt-10 p-8 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                      <p className="font-medium">Chưa có nội dung OCR cho trang này.</p>
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
