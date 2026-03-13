"use client";

import { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCircleXmark, faExclamationTriangle, faLightbulb, faFileContract, faChevronLeft, faChevronRight, faImage, faExpand, faCheckCircle, faTriangleExclamation } from "@fortawesome/free-solid-svg-icons";
import { buildPageImageUrl, type OcrResult, type HoSoPageEntry } from "@/lib/api";

const ocrMarkdownComponents = {
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

interface ResultModalProps {
  isOpen: boolean;
  onClose: () => void;
  markdownContent?: string;
  error?: string;
  missingDocuments?: { ma: string; ten: string }[];
  suggestedDocuments?: { ma: string; ten: string }[];
  ocrData?: OcrResult | null;
  uploadedDocuments?: { ma: string; ten: string }[];
  allMissingDocuments?: { ma: string; ten: string }[];
}

export default function ResultModal({
  isOpen,
  onClose,
  markdownContent,
  error,
  missingDocuments,
  suggestedDocuments,
  ocrData,
  uploadedDocuments,
  allMissingDocuments,
}: ResultModalProps) {
  const [mainTab, setMainTab] = useState<"analyse" | "ocr">("analyse");
  const [ocrTab, setOcrTab] = useState<string>("");
  const [ocrTabs, setOcrTabs] = useState<string[]>([]);
  const [ocrPageIndex, setOcrPageIndex] = useState(0);
  const [imageError, setImageError] = useState(false);
  const [showOcrImageModal, setShowOcrImageModal] = useState(false);
  const [showOcrMarkdownFullScreen, setShowOcrMarkdownFullScreen] = useState(false);

  const useOcrFull = Boolean(
    ocrData?.ho_so_full && Object.keys(ocrData.ho_so_full).length > 0,
  );
  const ocrDocKeys =
    uploadedDocuments && uploadedDocuments.length > 0
      ? uploadedDocuments.map((d) => d.ma)
      : useOcrFull
        ? Object.keys(ocrData!.ho_so_full!)
        : ocrData?.ho_so
          ? Object.keys(ocrData.ho_so)
          : [];
  function getOcrResolvedKey(tab: string): string {
    if (!useOcrFull || !ocrData?.ho_so_full) return tab;
    const direct = ocrData.ho_so_full[tab];
    if (direct && direct.length > 0) return tab;
    const tabLower = tab.toLowerCase();
    const byKey = Object.keys(ocrData.ho_so_full).find((k) => k.toLowerCase() === tabLower);
    if (byKey && (ocrData.ho_so_full[byKey]?.length ?? 0) > 0) return byKey;
    const expectedTen = uploadedDocuments?.find((d) => d.ma === tab)?.ten;
    if (!expectedTen) return tab;
    const norm = (s: string) => (s ?? "").trim().toLowerCase();
    const expectedNorm = norm(expectedTen);
    const found = Object.entries(ocrData.ho_so_full).find(
      ([_, arr]) => expectedNorm && norm(arr?.[0]?.ten_giay_to ?? "") === expectedNorm,
    );
    return found ? found[0] : tab;
  }
  const ocrResolvedKey = ocrTab ? getOcrResolvedKey(ocrTab) : ocrTab;
  const ocrPages: HoSoPageEntry[] = useOcrFull && ocrResolvedKey
    ? (ocrData!.ho_so_full![ocrResolvedKey] || [])
    : [];
  const currentOcrPage: HoSoPageEntry | null = ocrPages[ocrPageIndex] ?? null;
  const ocrImageUrl =
    currentOcrPage && ocrData?.session_id
      ? buildPageImageUrl(ocrData.session_id, currentOcrPage.source)
      : "";
  const ocrContentArray = useOcrFull
    ? (ocrData?.ho_so_full?.[ocrResolvedKey ?? ocrTab] || [])
    : (ocrData?.ho_so?.[ocrTab] || []);
  const ocrActiveMarkdown = currentOcrPage
    ? currentOcrPage.content
    : ocrContentArray.map((x: any) => (typeof x === "object" && x?.content != null ? x.content : x)).join("\n\n---\n\n");

  useEffect(() => {
    if (isOpen && ocrDocKeys.length > 0) {
      setOcrTabs(ocrDocKeys);
      if (!ocrTab || !ocrDocKeys.includes(ocrTab)) {
        setOcrTab(ocrDocKeys[0]);
        setOcrPageIndex(0);
      }
    }
  }, [isOpen, ocrData, ocrDocKeys.length]);
  useEffect(() => {
    setOcrPageIndex(0);
    setImageError(false);
  }, [ocrTab]);
  useEffect(() => {
    setImageError(false);
  }, [ocrPageIndex]);
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }

    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fadeIn">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      ></div>

      {/* Modal — wider when OCR split view is shown */}
      <div className={`relative bg-white rounded-2xl shadow-2xl w-full max-h-[90vh] overflow-hidden animate-scaleIn ${mainTab === "ocr" && useOcrFull && currentOcrPage ? "max-w-6xl" : "max-w-4xl"}`}>
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-teal-500 to-cyan-500 text-white px-6 py-4 flex items-center justify-between z-10">
          <h3 className="text-lg font-semibold flex items-center gap-3">
            Kết quả thẩm định
            {!error && markdownContent && ocrData && (
              <div className="flex bg-white/20 rounded-lg p-1 text-sm ml-4">
                <button
                  onClick={() => setMainTab("analyse")}
                  className={`px-3 py-1 rounded-md transition-colors ${mainTab === "analyse" ? "bg-white text-teal-700 font-semibold shadow-sm" : "text-white hover:bg-white/10"}`}
                >
                  Phân tích AI
                </button>
                <button
                  onClick={() => setMainTab("ocr")}
                  className={`px-3 py-1 rounded-md transition-colors ${mainTab === "ocr" ? "bg-white text-teal-700 font-semibold shadow-sm" : "text-white hover:bg-white/10"}`}
                >
                  Dữ liệu OCR
                </button>
              </div>
            )}
          </h3>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-white/20 flex items-center justify-center transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Document Lists Panel */}
        {((uploadedDocuments && uploadedDocuments.length > 0) || (allMissingDocuments && allMissingDocuments.length > 0)) && (
          <div className="flex-shrink-0 px-6 py-4 border-b border-gray-200 bg-gray-50/50">
            <div className="flex flex-wrap gap-6">
              {uploadedDocuments && uploadedDocuments.length > 0 && (
                <div className="flex-1 min-w-[200px]">
                  <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-1.5">
                    <FontAwesomeIcon icon={faCheckCircle} className="w-4 h-4 text-green-500" />
                    Giấy tờ đã nhận
                  </h4>
                  <ul className="space-y-1">
                    {uploadedDocuments.map((doc, idx) => (
                      <li key={idx} className="flex items-center gap-2 text-sm text-green-700">
                        <span className="w-1.5 h-1.5 rounded-full bg-green-400 flex-shrink-0" />
                        {doc.ten}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {allMissingDocuments && allMissingDocuments.length > 0 && (
                <div className="flex-1 min-w-[200px]">
                  <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-1.5">
                    <FontAwesomeIcon icon={faTriangleExclamation} className="w-4 h-4 text-amber-500" />
                    Giấy tờ còn thiếu
                  </h4>
                  <ul className="space-y-1">
                    {allMissingDocuments.map((doc, idx) => (
                      <li key={idx} className="flex items-center gap-2 text-sm text-amber-700">
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

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          {error ? (
            // Error state
            <div className="py-6">
              <div className="text-center mb-5">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FontAwesomeIcon icon={faCircleXmark} className="w-8 h-8 text-red-500" />
                </div>
                <h4 className="text-xl font-bold text-gray-800 mb-1">
                  Hồ sơ không hợp lệ
                </h4>
                <p className="text-gray-500 text-sm">
                  {suggestedDocuments?.length
                    ? "Thiếu các loại giấy tờ bắt buộc."
                    : error}
                </p>
              </div>
              {(suggestedDocuments?.length || missingDocuments?.length) ? (
                <>
                  <div className="mt-4">
                    <div className="bg-amber-50 border border-amber-100 rounded-xl p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <FontAwesomeIcon icon={faExclamationTriangle} className="w-4 h-4 text-amber-500 flex-shrink-0" />
                        <p className="font-semibold text-amber-700 text-sm">
                          Các loại giấy tờ bắt buộc còn thiếu:
                        </p>
                      </div>
                      {(missingDocuments && missingDocuments.length > 0 ? missingDocuments : suggestedDocuments ?? []).length > 0 ? (
                        <ul className="ml-6 space-y-1">
                          {(missingDocuments && missingDocuments.length > 0 ? missingDocuments : suggestedDocuments!).map((doc, idx) => (
                            <li key={idx} className="text-amber-600 text-xs mt-1">
                              • {doc.ten}
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-amber-600 text-xs ml-2">—</p>
                      )}
                    </div>
                  </div>
                  <div className="mt-3">
                    <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <FontAwesomeIcon icon={faCheckCircle} className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                        <p className="font-semibold text-emerald-700 text-sm">
                          Đã upload:
                        </p>
                      </div>
                      {uploadedDocuments && uploadedDocuments.length > 0 ? (
                        <ul className="ml-6 space-y-1">
                          {uploadedDocuments.map((doc, idx) => (
                            <li key={idx} className="text-emerald-600 text-xs mt-1">
                              • {doc.ten}
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-emerald-600 text-xs ml-2">Chưa có loại tài liệu nào trong danh sách được upload.</p>
                      )}
                    </div>
                  </div>
                </>
              ) : null}
            </div>
          ) : markdownContent ? (
            // Success state
            mainTab === "analyse" ? (
              <div className="prose prose-teal max-w-none">
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={{
                    h1: ({ node, ...props }) => (
                      <h1
                        className="text-2xl font-bold text-gray-800 mb-4"
                        {...props}
                      />
                    ),
                    h2: ({ node, ...props }) => (
                      <h2
                        className="text-xl font-semibold text-gray-800 mt-6 mb-3"
                        {...props}
                      />
                    ),
                    h3: ({ node, ...props }) => (
                      <h3
                        className="text-lg font-semibold text-gray-700 mt-4 mb-2"
                        {...props}
                      />
                    ),
                    p: ({ node, ...props }) => (
                      <p className="text-gray-600 mb-3" {...props} />
                    ),
                    ul: ({ node, ...props }) => (
                      <ul
                        className="list-disc list-inside text-gray-600 mb-3 space-y-1"
                        {...props}
                      />
                    ),
                    ol: ({ node, ...props }) => (
                      <ol
                        className="list-decimal list-inside text-gray-600 mb-3 space-y-1"
                        {...props}
                      />
                    ),
                    li: ({ node, ...props }) => (
                      <li className="text-gray-600" {...props} />
                    ),
                    table: ({ node, ...props }) => (
                      <div className="overflow-x-auto my-6">
                        <table
                          className="min-w-full border-collapse border border-gray-200"
                          {...props}
                        />
                      </div>
                    ),
                    thead: ({ node, ...props }) => (
                      <thead
                        className="bg-gray-50 border-b border-gray-200"
                        {...props}
                      />
                    ),
                    tbody: ({ node, ...props }) => (
                      <tbody
                        className="bg-white divide-y divide-gray-200"
                        {...props}
                      />
                    ),
                    tr: ({ node, ...props }) => (
                      <tr
                        className="hover:bg-gray-50/50 transition-colors"
                        {...props}
                      />
                    ),
                    th: ({ node, ...props }) => (
                      <th
                        className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider border border-gray-200"
                        {...props}
                      />
                    ),
                    td: ({ node, ...props }) => (
                      <td
                        className="px-4 py-3 text-sm text-gray-600 border border-gray-200"
                        {...props}
                      />
                    ),
                    blockquote: ({ node, ...props }) => (
                      <blockquote
                        className="border-l-4 border-teal-500 bg-teal-50/50 pl-4 py-2 m-4 italic text-gray-700 rounded-r"
                        {...props}
                      />
                    ),
                    strong: ({ node, ...props }) => (
                      <strong
                        className="font-semibold text-gray-800"
                        {...props}
                      />
                    ),
                    code: ({ node, inline, ...props }: any) =>
                      inline ? (
                        <code
                          className="bg-gray-100 text-teal-600 px-1.5 py-0.5 rounded text-sm font-mono"
                          {...props}
                        />
                      ) : (
                        <code
                          className="block bg-gray-100 p-3 rounded-lg text-sm font-mono overflow-x-auto"
                          {...props}
                        />
                      ),
                  }}
                >
                  {markdownContent}
                </ReactMarkdown>
              </div>
            ) : (
              // OCR State
              <div className="flex flex-col h-full -mx-6 -my-6 bg-gray-50">
                {/* OCR Tabs */}
                <div className="flex-shrink-0 flex overflow-x-auto border-b border-gray-200 bg-gray-50 hide-scrollbar pt-2 px-6">
                  {ocrTabs.map((tab) => {
                    const documentName =
                      uploadedDocuments?.find((d) => d.ma === tab)?.ten ??
                      (useOcrFull ? ocrData?.ho_so_full?.[getOcrResolvedKey(tab)]?.[0]?.ten_giay_to : ocrData?.ho_so?.[tab]?.[0]?.ten_giay_to) ??
                      tab.replace(/_/g, " ");
                    const count = useOcrFull ? (ocrData?.ho_so_full?.[getOcrResolvedKey(tab)]?.length ?? 0) : null;
                    return (
                      <button
                        key={tab}
                        onClick={() => setOcrTab(tab)}
                        className={`
                          whitespace-nowrap px-6 py-3 text-sm font-medium transition-colors border-b-2 flex items-center gap-2
                          ${ocrTab === tab ? "border-teal-500 text-teal-600 bg-white" : "border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-100"}
                        `}
                      >
                        {documentName}
                        {count != null && (
                          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${count > 0 ? "bg-teal-100 text-teal-700" : "bg-gray-100 text-gray-500"}`}>
                            {count}
                          </span>
                        )}
                      </button>
                    );
                  })}
                  {ocrTabs.length === 0 && (
                    <div className="px-6 py-3 text-sm text-gray-500">
                      Không tìm thấy tài liệu nào
                    </div>
                  )}
                </div>

                {/* Pagination: Trang 1, 2, 3... + nút Xem ảnh trang / Xem toàn màn hình */}
                {useOcrFull && ocrPages.length > 0 && (
                  <div className="flex-shrink-0 flex flex-wrap items-center justify-between gap-3 px-4 py-3 bg-gray-100 border-b border-gray-200">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-medium text-gray-600 mr-1">Trang:</span>
                      <div className="flex items-center gap-1 overflow-x-auto max-w-[50vw] hide-scrollbar">
                        <button
                          type="button"
                          disabled={ocrPageIndex === 0}
                          onClick={() => setOcrPageIndex((i) => i - 1)}
                          className="p-1.5 rounded text-gray-600 hover:bg-gray-200 disabled:opacity-40 disabled:cursor-not-allowed"
                          aria-label="Trang trước"
                        >
                          <FontAwesomeIcon icon={faChevronLeft} className="w-4 h-4" />
                        </button>
                        {ocrPages.map((_, i) => (
                          <button
                            key={i}
                            type="button"
                            onClick={() => setOcrPageIndex(i)}
                            className={`min-w-[2rem] h-8 px-2 rounded text-sm font-medium transition-colors ${i === ocrPageIndex ? "bg-teal-500 text-white shadow-sm" : "text-gray-600 hover:bg-gray-200 bg-white border border-gray-200"}`}
                          >
                            {i + 1}
                          </button>
                        ))}
                        <button
                          type="button"
                          disabled={ocrPageIndex >= ocrPages.length - 1}
                          onClick={() => setOcrPageIndex((i) => i + 1)}
                          className="p-1.5 rounded text-gray-600 hover:bg-gray-200 disabled:opacity-40 disabled:cursor-not-allowed"
                          aria-label="Trang sau"
                        >
                          <FontAwesomeIcon icon={faChevronRight} className="w-4 h-4" />
                        </button>
                      </div>
                      {currentOcrPage && (
                        <span className="text-xs text-gray-500 ml-1 truncate max-w-[180px]" title={currentOcrPage.file_name}>
                          {currentOcrPage.file_name}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {useOcrFull && currentOcrPage && ocrData?.session_id && (
                        <button
                          type="button"
                          onClick={() => { setImageError(false); setShowOcrImageModal(true); }}
                          className="flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 text-sm font-medium"
                        >
                          <FontAwesomeIcon icon={faImage} className="w-4 h-4" />
                          Xem ảnh trang
                        </button>
                      )}
                      {ocrActiveMarkdown && (
                        <button
                          type="button"
                          onClick={() => setShowOcrMarkdownFullScreen(true)}
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

                {/* Nội dung OCR (1 cột, không split) */}
                <div className="flex-1 p-6 overflow-y-auto bg-white flex flex-col gap-6 min-h-0">
                  {ocrData?.contract_details && (
                    <div className="bg-teal-50/50 rounded-xl p-5 border border-teal-100">
                      <h4 className="text-teal-800 font-semibold mb-4 flex items-center gap-2">
                        <FontAwesomeIcon icon={faFileContract} className="w-4 h-4" />
                        Thông tin Hợp đồng
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        {Object.entries(ocrData.contract_details).map(
                          ([key, value]) => {
                            if (typeof value === "object" && value !== null) return null;
                            return (
                              <div key={key} className="flex flex-col">
                                <span className="text-gray-500 font-medium capitalize">{key.replace(/_/g, " ")}</span>
                                <span className="text-gray-900 font-semibold">
                                  {(value as React.ReactNode) || <span className="text-gray-400 italic">Trống</span>}
                                </span>
                              </div>
                            );
                          },
                        )}
                      </div>
                    </div>
                  )}
                  {ocrActiveMarkdown ? (
                    <div className="prose prose-teal max-w-none">
                      <ReactMarkdown remarkPlugins={[remarkGfm]} components={ocrMarkdownComponents}>
                        {ocrActiveMarkdown}
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
            )
          ) : null}
        </div>

        {/* Modal xem ảnh trang (tab OCR) */}
        {showOcrImageModal && useOcrFull && currentOcrPage && ocrData?.session_id && (
          <div
            className="fixed inset-0 z-[70] flex items-center justify-center bg-black/80 p-4"
            onClick={() => setShowOcrImageModal(false)}
          >
            <div className="relative max-w-[95vw] max-h-[95vh] flex items-center justify-center" onClick={(e) => e.stopPropagation()}>
              <button
                type="button"
                onClick={() => setShowOcrImageModal(false)}
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
                  src={ocrImageUrl}
                  alt={`Trang ${currentOcrPage.page_number}`}
                  className="max-w-full max-h-[90vh] object-contain shadow-2xl rounded"
                  onError={() => setImageError(true)}
                  onClick={(e) => e.stopPropagation()}
                />
              )}
            </div>
          </div>
        )}

        {/* Full screen markdown (tab OCR) */}
        {showOcrMarkdownFullScreen && (
          <div className="fixed inset-0 z-[70] flex flex-col bg-white" role="dialog" aria-label="Nội dung OCR toàn màn hình">
            <div className="flex-shrink-0 flex items-center justify-between px-6 py-4 bg-teal-600 text-white">
              <span className="font-semibold">
                Nội dung bóc tách — {currentOcrPage ? `${currentOcrPage.file_name} (Trang ${currentOcrPage.page_number})` : "OCR"}
              </span>
              <button
                type="button"
                onClick={() => setShowOcrMarkdownFullScreen(false)}
                className="px-4 py-2 rounded-lg bg-white/20 hover:bg-white/30 font-medium"
              >
                ✕
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-8 md:p-12 max-w-4xl mx-auto">
              {ocrActiveMarkdown ? (
                <div className="prose prose-lg prose-teal max-w-none">
                  <ReactMarkdown remarkPlugins={[remarkGfm]} components={ocrMarkdownComponents}>
                    {ocrActiveMarkdown}
                  </ReactMarkdown>
                </div>
              ) : (
                <p className="text-gray-500">Không có nội dung.</p>
              )}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="sticky bottom-0 bg-gray-50 px-6 py-4 border-t border-gray-200 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-6 py-3 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
          >
            {error ? "Sửa lại" : "Đóng"}
          </button>
          <button
            onClick={() => {
              onClose();
              window.location.reload();
            }}
            className="flex-1 px-6 py-3 bg-gradient-to-r from-teal-500 to-cyan-600 text-white rounded-lg hover:from-teal-600 hover:to-cyan-700 transition-all font-medium"
          >
            Tạo claim mới
          </button>
        </div>
      </div>
    </div>
  );
}
