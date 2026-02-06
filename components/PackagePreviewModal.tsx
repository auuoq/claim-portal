'use client';

import { useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface PackagePreviewModalProps {
    isOpen: boolean;
    onClose: () => void;
    packageName: string;
    previewContent?: string;
}

export default function PackagePreviewModal({
    isOpen,
    onClose,
    packageName,
    previewContent
}: PackagePreviewModalProps) {
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }

        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isOpen]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 animate-fadeIn">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                onClick={onClose}
            ></div>

            {/* Modal */}
            <div className="relative bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[85vh] overflow-hidden animate-scaleIn flex flex-col">
                {/* Header */}
                <div className="flex-shrink-0 bg-gradient-to-r from-teal-500 to-cyan-500 text-white px-6 py-4 flex items-center justify-between">
                    <div>
                        <h3 className="text-lg font-semibold">Chi tiết gói bảo hiểm</h3>
                        <p className="text-teal-100 text-xs">{packageName}</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-8 h-8 rounded-full hover:bg-white/20 flex items-center justify-center transition-colors"
                    >
                        ✕
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 p-6 overflow-y-auto custom-scrollbar bg-gray-50/30">
                    <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm">
                        {previewContent ? (
                            <div className="prose prose-teal max-w-none">
                                <ReactMarkdown
                                    remarkPlugins={[remarkGfm]}
                                    components={{
                                        h1: ({ node, ...props }) => <h1 className="text-2xl font-bold text-gray-800 mb-4 pb-2 border-b border-gray-100" {...props} />,
                                        h2: ({ node, ...props }) => <h2 className="text-xl font-semibold text-gray-800 mt-6 mb-3 flex items-center gap-2" {...props} />,
                                        h3: ({ node, ...props }) => <h3 className="text-lg font-semibold text-gray-700 mt-4 mb-2" {...props} />,
                                        p: ({ node, ...props }) => <p className="text-gray-600 mb-3 leading-relaxed" {...props} />,
                                        ul: ({ node, ...props }) => <ul className="list-disc list-inside text-gray-600 mb-3 space-y-2 pl-2" {...props} />,
                                        ol: ({ node, ...props }) => <ol className="list-decimal list-inside text-gray-600 mb-3 space-y-2 pl-2" {...props} />,
                                        li: ({ node, ...props }) => <li className="text-gray-600" {...props} />,
                                        strong: ({ node, ...props }) => <strong className="font-bold text-teal-700 bg-teal-50 px-1 rounded" {...props} />,
                                        blockquote: ({ node, ...props }) => (
                                            <blockquote className="border-l-4 border-teal-500 bg-teal-50/50 pl-4 py-2 my-4 italic text-gray-700 rounded-r" {...props} />
                                        ),
                                    }}
                                >
                                    {previewContent}
                                </ReactMarkdown>
                            </div>
                        ) : (
                            <div className="text-center py-12 text-gray-500 italic">
                                Chưa có nội dung xem trước cho gói này.
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div className="flex-shrink-0 bg-white px-6 py-4 border-t border-gray-100 flex justify-end">
                    <button
                        onClick={onClose}
                        className="px-6 py-2 bg-gradient-to-r from-teal-500 to-cyan-600 text-white rounded-lg hover:shadow-md transition-all font-medium"
                    >
                        Đã hiểu
                    </button>
                </div>
            </div>
        </div>
    );
}
