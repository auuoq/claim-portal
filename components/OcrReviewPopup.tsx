"use client";

import { useState, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faFileContract, faCircleNotch, faXmark, faChevronLeft, faChevronRight, faImage, faExpand, faCheckCircle, faTriangleExclamation } from "@fortawesome/free-solid-svg-icons";
import { buildPageImageUrl, type OcrResult, type HoSoPageEntry } from "@/lib/api";

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

  const useFull = Boolean(
    ocrData?.ho_so_full && Object.keys(ocrData.ho_so_full).length > 0,
  );
  const docKeys =
    ocrData?.uploaded_documents && ocrData.uploaded_documents.length > 0
      ? ocrData.uploaded_documents.map((d) => d.ma)
      : useFull
        ? Object.keys(ocrData!.ho_so_full!)
        : ocrData?.ho_so
          ? Object.keys(ocrData.ho_so)
          : [];
  function getResolvedKey(tab: string): string {
    if (!useFull || !ocrData?.ho_so_full) return tab;
    const direct = ocrData.ho_so_full[tab];
    if (direct && direct.length > 0) return tab;
    const tabLower = tab.toLowerCase();
    const byKey = Object.keys(ocrData.ho_so_full).find((k) => k.toLowerCase() === tabLower);
    if (byKey && (ocrData.ho_so_full[byKey]?.length ?? 0) > 0) return byKey;
    const expectedTen = ocrData.uploaded_documents?.find((d) => d.ma === tab)?.ten;
    if (!expectedTen) return tab;
    const norm = (s: string) => (s ?? "").trim().toLowerCase();
    const expectedNorm = norm(expectedTen);
    const found = Object.entries(ocrData.ho_so_full).find(
      ([_, arr]) => expectedNorm && norm(arr?.[0]?.ten_giay_to ?? "") === expectedNorm,
    );
    return found ? found[0] : tab;
  }
  const hoSoFullResolvedKey = activeTab ? getResolvedKey(activeTab) : activeTab;
  const pages: HoSoPageEntry[] = useFull && hoSoFullResolvedKey
    ? (ocrData!.ho_so_full![hoSoFullResolvedKey] || [])
    : [];
  const currentPage: HoSoPageEntry | null = pages[pageIndex] ?? null;
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
  }, [pageIndex]);

  if (!isOpen) return null;

  const activeContentArray = useFull
    ? (ocrData?.ho_so_full?.[hoSoFullResolvedKey ?? activeTab] || [])
    : (ocrData?.ho_so?.[activeTab] || []);
  const activeMarkdownLegacy = activeContentArray
    .map((item: any) => (typeof item === "object" && item?.content != null ? item.content : item))
    .join("\n\n---\n\n");
  const activeMarkdown = currentPage ? currentPage.content : activeMarkdownLegacy;
  const canShowImage = useFull && currentPage && ocrData?.session_id;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 animate-fadeIn">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={!isSubmitting ? onClose : undefined}
      ></div>

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-6xl w-full max-h-[90vh] min-h-[70vh] flex flex-col overflow-hidden animate-scaleIn">
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

        {/* Document Lists */}
        {((ocrData?.uploaded_documents && ocrData.uploaded_documents.length > 0) || (ocrData?.missing_documents && ocrData.missing_documents.length > 0)) && (
          <div className="flex-shrink-0 px-6 py-4 border-b border-gray-200 bg-gray-50/50">
            <div className="flex flex-wrap gap-6">
              {ocrData?.uploaded_documents && ocrData.uploaded_documents.length > 0 && (
                <div className="flex-1 min-w-[200px]">
                  <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-1.5">
                    <FontAwesomeIcon icon={faCheckCircle} className="w-4 h-4 text-green-500" />
                    Giấy tờ đã nhận
                  </h4>
                  <ul className="flex flex-wrap gap-2">
                    {ocrData.uploaded_documents.map((doc, idx) => (
                      <li key={idx} className="inline-flex items-center gap-1.5 text-xs font-medium text-green-700 bg-green-50 border border-green-200 rounded-full px-3 py-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-green-400 flex-shrink-0" />
                        {doc.ten}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {ocrData?.missing_documents && ocrData.missing_documents.length > 0 && (
                <div className="flex-1 min-w-[200px]">
                  <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-1.5">
                    <FontAwesomeIcon icon={faTriangleExclamation} className="w-4 h-4 text-amber-500" />
                    Giấy tờ còn thiếu
                  </h4>
                  <ul className="flex flex-wrap gap-2">
                    {ocrData.missing_documents.map((doc, idx) => (
                      <li key={idx} className="inline-flex items-center gap-1.5 text-xs font-medium text-amber-700 bg-amber-50 border border-amber-200 rounded-full px-3 py-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-400 flex-shrink-0" />
                        {doc.ten}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="flex flex-1 overflow-hidden">
          {/* Sidebar Tabs */}
          <div className="w-1/4 min-w-[260px] max-w-[320px] bg-gray-50 border-r border-gray-200 flex flex-col overflow-y-auto hide-scrollbar flex-shrink-0">
            {tabs.map((tab) => {
              const docName =
                ocrData?.uploaded_documents?.find((d) => d.ma === tab)?.ten ??
                (useFull ? ocrData?.ho_so_full?.[getResolvedKey(tab)]?.[0]?.ten_giay_to : ocrData?.ho_so?.[tab]?.[0]?.ten_giay_to) ??
                tab.replace(/_/g, " ");
              const count = useFull ? (ocrData?.ho_so_full?.[getResolvedKey(tab)]?.length ?? 0) : null;
              return (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`
                    w-full text-left px-5 py-4 text-sm font-medium transition-colors border-l-4 flex items-center justify-between gap-2
                    ${activeTab === tab
                      ? "border-teal-500 text-teal-700 bg-white shadow-sm"
                      : "border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                    }
                  `}
                >
                  <span className="truncate">{docName}</span>
                  {count != null && (
                    <span className={`flex-shrink-0 text-xs font-medium px-2 py-0.5 rounded-full ${count > 0 ? "bg-teal-100 text-teal-700" : "bg-gray-100 text-gray-500"}`}>
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
            {tabs.length === 0 && (
              <div className="px-5 py-4 text-sm text-gray-500 text-center">
                Không tìm thấy tài liệu nào
              </div>
            )}
          </div>

          {/* Main: pagination (when per-page) + content */}
          <div className="flex-1 flex flex-col overflow-hidden min-w-0">
            {/* Pagination: Trang 1, 2, 3... rõ ràng + nút xem ảnh / full màn hình */}
            {useFull && pages.length > 0 && (
              <div className="flex-shrink-0 flex flex-wrap items-center justify-between gap-3 px-4 py-3 bg-gray-50 border-b border-gray-200">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-medium text-gray-600 mr-1">Trang:</span>
                  <div className="flex items-center gap-1 overflow-x-auto max-w-[50vw] hide-scrollbar">
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
                <div className="flex items-center gap-2">
                  {canShowImage && (
                    <button
                      type="button"
                      onClick={() => { setImageError(false); setShowImageModal(true); }}
                      className="flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 text-sm font-medium"
                    >
                      <FontAwesomeIcon icon={faImage} className="w-4 h-4" />
                      Xem ảnh trang
                    </button>
                  )}
                  {activeMarkdown && (
                    <button
                      type="button"
                      onClick={() => setShowMarkdownFullScreen(true)}
                      className="flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 text-sm font-medium"
                      title="Xem toàn màn hình"
                    >
                      <FontAwesomeIcon icon={faExpand} className="w-4 h-4" />
                      Xem toàn màn hình
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Nội dung OCR (markdown) — không còn split, chỉ 1 cột */}
            <div className="flex-1 p-6 overflow-y-auto bg-white flex flex-col gap-6 min-h-0">
              {activeMarkdown ? (
                <div className="prose prose-teal max-w-none">
                  <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
                    {activeMarkdown}
                  </ReactMarkdown>
                </div>
              ) : (
                <div className="text-center text-gray-500 py-10 px-4 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                  <p className="font-medium">Chưa có nội dung OCR cho loại giấy tờ này.</p>
                  <p className="text-sm mt-1">Dữ liệu có thể đang được xử lý hoặc loại giấy tờ này không có trang nào được phân loại.</p>
                </div>
              )}
            </div>
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
                      const docName = ocrData?.uploaded_documents?.find((d) => d.ma === tab)?.ten ??
                        (useFull ? ocrData?.ho_so_full?.[getResolvedKey(tab)]?.[0]?.ten_giay_to : ocrData?.ho_so?.[tab]?.[0]?.ten_giay_to) ??
                        tab.replace(/_/g, " ");
                      return <option key={tab} value={tab}>{docName}</option>;
                    })}
                  </select>
                </div>

                {/* Select Page */}
                {useFull && pages.length > 0 && (
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
              
              {/* Right Panel: Markdown */}
              <div className="w-full md:w-1/2 bg-white flex flex-col overflow-hidden">
                <div className="bg-gray-50 px-4 py-2 border-b border-gray-200/50 flex-shrink-0">
                  <span className="text-sm font-semibold text-gray-700">Kết quả nhận diện OCR</span>
                </div>
                <div className="flex-1 overflow-y-auto p-6 md:p-8">
                  {activeMarkdown ? (
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
