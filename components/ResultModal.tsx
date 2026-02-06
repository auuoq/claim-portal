'use client';

import { useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface ResultModalProps {
    isOpen: boolean;
    onClose: () => void;
    markdownContent?: string;
    error?: string;
}

export default function ResultModal({ isOpen, onClose, markdownContent, error }: ResultModalProps) {
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fadeIn">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                onClick={onClose}
            ></div>

            {/* Modal */}
            <div className="relative bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden animate-scaleIn">
                {/* Header */}
                <div className="sticky top-0 bg-gradient-to-r from-teal-500 to-cyan-500 text-white px-6 py-4 flex items-center justify-between">
                    <h3 className="text-lg font-semibold">Kết quả thẩm định</h3>
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
                        <div className="text-center py-8">
                            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <svg className="w-8 h-8 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                </svg>
                            </div>
                            <h4 className="text-xl font-bold text-gray-800 mb-2">Có lỗi xảy ra</h4>
                            <p className="text-gray-600">{error}</p>
                        </div>
                    ) : markdownContent ? (
                        // Success state with markdown
                        <div className="prose prose-teal max-w-none">
                            <ReactMarkdown
                                remarkPlugins={[remarkGfm]}
                                components={{
                                    h1: ({ node, ...props }) => <h1 className="text-2xl font-bold text-gray-800 mb-4" {...props} />,
                                    h2: ({ node, ...props }) => <h2 className="text-xl font-semibold text-gray-800 mt-6 mb-3" {...props} />,
                                    h3: ({ node, ...props }) => <h3 className="text-lg font-semibold text-gray-700 mt-4 mb-2" {...props} />,
                                    p: ({ node, ...props }) => <p className="text-gray-600 mb-3" {...props} />,
                                    ul: ({ node, ...props }) => <ul className="list-disc list-inside text-gray-600 mb-3 space-y-1" {...props} />,
                                    ol: ({ node, ...props }) => <ol className="list-decimal list-inside text-gray-600 mb-3 space-y-1" {...props} />,
                                    li: ({ node, ...props }) => <li className="text-gray-600" {...props} />,
                                    table: ({ node, ...props }) => (
                                        <div className="overflow-x-auto my-6">
                                            <table className="min-w-full border-collapse border border-gray-200" {...props} />
                                        </div>
                                    ),
                                    thead: ({ node, ...props }) => <thead className="bg-gray-50 border-b border-gray-200" {...props} />,
                                    tbody: ({ node, ...props }) => <tbody className="bg-white divide-y divide-gray-200" {...props} />,
                                    tr: ({ node, ...props }) => <tr className="hover:bg-gray-50/50 transition-colors" {...props} />,
                                    th: ({ node, ...props }) => <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider border border-gray-200" {...props} />,
                                    td: ({ node, ...props }) => <td className="px-4 py-3 text-sm text-gray-600 border border-gray-200" {...props} />,
                                    blockquote: ({ node, ...props }) => (
                                        <blockquote className="border-l-4 border-teal-500 bg-teal-50/50 pl-4 py-2 m-4 italic text-gray-700 rounded-r" {...props} />
                                    ),
                                    strong: ({ node, ...props }) => <strong className="font-semibold text-gray-800" {...props} />,
                                    code: ({ node, inline, ...props }: any) =>
                                        inline ? (
                                            <code className="bg-gray-100 text-teal-600 px-1.5 py-0.5 rounded text-sm font-mono" {...props} />
                                        ) : (
                                            <code className="block bg-gray-100 p-3 rounded-lg text-sm font-mono overflow-x-auto" {...props} />
                                        ),
                                }}
                            >
                                {markdownContent}
                            </ReactMarkdown>
                        </div>
                    ) : null}
                </div>

                {/* Footer */}
                <div className="sticky bottom-0 bg-gray-50 px-6 py-4 border-t border-gray-200 flex gap-3">
                    <button
                        onClick={onClose}
                        className="flex-1 px-6 py-3 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                    >
                        Đóng
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
