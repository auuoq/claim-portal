"use client";

import { useState, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faFileContract, faCircleNotch, faXmark } from "@fortawesome/free-solid-svg-icons";

interface OcrReviewPopupProps {
  isOpen: boolean;
  onClose: () => void;
  ocrData: any;
  onConfirm: (data: any) => void;
  isSubmitting?: boolean;
}

const contractKeyLabels: Record<string, string> = {
  so_hop_dong: "Số Hợp Đồng",
  ngay_hieu_luc: "Ngày Hiệu Lực",
  ngay_het_han: "Ngày Hết Hạn",
  ten_goi_bao_hiem: "Tên Gói Bảo Hiểm",
  ten_chuong_trinh: "Tên Chương Trình",
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

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      if (ocrData?.ho_so) {
        const documentKeys = Object.keys(ocrData.ho_so);
        setTabs(documentKeys);
        if (documentKeys.length > 0) {
          setActiveTab(documentKeys[0]);
        }
      }
    } else {
      document.body.style.overflow = "unset";
    }

    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen, ocrData]);

  if (!isOpen) return null;

  const activeContentArray = ocrData?.ho_so?.[activeTab] || [];
  const activeMarkdown = activeContentArray
    .map((item: any) => item.content)
    .join("\n\n---\n\n");

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

        <div className="flex flex-1 overflow-hidden">
          {/* Sidebar Tabs */}
          <div className="w-1/4 min-w-[260px] max-w-[320px] bg-gray-50 border-r border-gray-200 flex flex-col overflow-y-auto hide-scrollbar flex-shrink-0">
            {tabs.map((tab) => {
              const documentName =
                ocrData?.ho_so?.[tab]?.[0]?.ten_giay_to || tab.replace(/_/g, " ");
              return (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`
                    w-full text-left px-5 py-4 text-sm font-medium transition-colors border-l-4
                    ${activeTab === tab
                      ? "border-teal-500 text-teal-700 bg-white shadow-sm"
                      : "border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                    }
                  `}
                >
                  {documentName}
                </button>
              );
            })}
            {tabs.length === 0 && (
              <div className="px-5 py-4 text-sm text-gray-500 text-center">
                Không tìm thấy tài liệu nào
              </div>
            )}
          </div>

          {/* Right Content */}
          <div className="flex-1 p-6 overflow-y-auto bg-white flex flex-col gap-6">
            {activeMarkdown ? (
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
            )}
          </div>
        </div>

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
            onClick={() => onConfirm(ocrData)}
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
