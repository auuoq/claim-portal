"use client";

import { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface ResultModalProps {
  isOpen: boolean;
  onClose: () => void;
  markdownContent?: string;
  error?: string;
  missingDocuments?: { ma: string; ten: string }[];
  suggestedDocuments?: { ma: string; ten: string }[];
  ocrData?: any;
}

export default function ResultModal({
  isOpen,
  onClose,
  markdownContent,
  error,
  missingDocuments,
  suggestedDocuments,
  ocrData,
}: ResultModalProps) {
  const [mainTab, setMainTab] = useState<"analyse" | "ocr">("analyse");
  const [ocrTab, setOcrTab] = useState<string>("");
  const [ocrTabs, setOcrTabs] = useState<string[]>([]);

  useEffect(() => {
    if (isOpen && ocrData?.ho_so) {
      const documentKeys = Object.keys(ocrData.ho_so);
      setOcrTabs(documentKeys);
      if (documentKeys.length > 0) {
        setOcrTab(documentKeys[0]);
      }
    }
  }, [isOpen, ocrData]);
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

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden animate-scaleIn">
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

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          {error ? (
            // Error state
            <div className="py-6">
              <div className="text-center mb-5">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg
                    className="w-8 h-8 text-red-500"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <h4 className="text-xl font-bold text-gray-800 mb-1">
                  Hồ sơ không hợp lệ
                </h4>
                <p className="text-gray-500 text-sm">{error}</p>
              </div>
              {missingDocuments && missingDocuments.length > 0 && (
                <div className="mt-4">
                  <div className="bg-amber-50 border border-amber-100 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <svg
                        className="w-4 h-4 text-amber-500 flex-shrink-0"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                      <p className="font-semibold text-amber-700 text-sm">
                        Giấy tờ bị thiếu:
                      </p>
                    </div>
                    <ul className="ml-6 space-y-1">
                      {missingDocuments.map((doc, idx) => (
                        <li key={idx} className="text-amber-600 text-xs mt-1">
                          • {doc.ten}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
              {suggestedDocuments && suggestedDocuments.length > 0 && (
                <div className="mt-3">
                  <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <svg
                        className="w-4 h-4 text-blue-500 flex-shrink-0"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                        />
                      </svg>
                      <p className="font-semibold text-blue-700 text-sm">
                        Gợi ý các loại giấy tờ có thể upload:
                      </p>
                    </div>
                    <ul className="ml-6 space-y-1">
                      {suggestedDocuments.map((doc, idx) => (
                        <li key={idx} className="text-blue-600 text-xs mt-1">
                          • {doc.ten}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
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
                      ocrData?.ho_so?.[tab]?.[0]?.ten_giay_to ||
                      tab.replace(/_/g, " ");
                    return (
                      <button
                        key={tab}
                        onClick={() => setOcrTab(tab)}
                        className={`
                                                  whitespace-nowrap px-6 py-3 text-sm font-medium transition-colors border-b-2
                                                  ${ocrTab === tab ? "border-teal-500 text-teal-600 bg-white" : "border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-100"}
                                              `}
                      >
                        {documentName}
                      </button>
                    );
                  })}
                  {ocrTabs.length === 0 && (
                    <div className="px-6 py-3 text-sm text-gray-500">
                      Không tìm thấy tài liệu nào
                    </div>
                  )}
                </div>
                <div className="flex-1 p-6 overflow-y-auto bg-white flex flex-col gap-6">
                  {ocrData?.contract_details && (
                    <div className="bg-teal-50/50 rounded-xl p-5 border border-teal-100">
                      <h4 className="text-teal-800 font-semibold mb-4 flex items-center gap-2">
                        <svg
                          className="w-5 h-5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                          />
                        </svg>
                        Thông tin Hợp đồng
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        {Object.entries(ocrData.contract_details).map(
                          ([key, value]) => {
                            if (typeof value === "object" && value !== null)
                              return null;
                            return (
                              <div key={key} className="flex flex-col">
                                <span className="text-gray-500 font-medium capitalize">
                                  {key.replace(/_/g, " ")}
                                </span>
                                <span className="text-gray-900 font-semibold">
                                  {(value as React.ReactNode) || (
                                    <span className="text-gray-400 italic">
                                      Trống
                                    </span>
                                  )}
                                </span>
                              </div>
                            );
                          },
                        )}
                      </div>
                    </div>
                  )}
                  {(() => {
                    const activeContentArray = ocrData?.ho_so?.[ocrTab] || [];
                    const activeMarkdown = activeContentArray
                      .map((item: any) => item.content)
                      .join("\n\n---\n\n");

                    return activeMarkdown ? (
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
                          {activeMarkdown}
                        </ReactMarkdown>
                      </div>
                    ) : (
                      <div className="text-center text-gray-500 py-10 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                        Không có nội dung bóc tách cho tài liệu này.
                      </div>
                    );
                  })()}
                </div>
              </div>
            )
          ) : null}
        </div>

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
