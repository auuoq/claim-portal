'use client';

import { useEffect } from 'react';

interface FilePreviewModalProps {
    isOpen: boolean;
    onClose: () => void;
    fileName: string;
    fileUrl?: string;
    isImage: boolean;
}

export default function FilePreviewModal({
    isOpen,
    onClose,
    fileName,
    fileUrl,
    isImage
}: FilePreviewModalProps) {
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
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-fadeIn">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                onClick={onClose}
            ></div>

            {/* Modal Content */}
            <div className="relative max-w-5xl w-full max-h-[90vh] flex flex-col items-center animate-scaleIn">
                {/* Header */}
                <div className="absolute -top-12 left-0 right-0 flex justify-between items-center text-white">
                    <h3 className="text-sm font-medium truncate max-w-[80%]">{fileName}</h3>
                    <button
                        onClick={onClose}
                        className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors shadow-lg"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* File Container */}
                <div className="bg-white rounded-xl shadow-2xl overflow-hidden flex items-center justify-center min-h-[200px] w-full">
                    {isImage && fileUrl ? (
                        <img
                            src={fileUrl}
                            alt={fileName}
                            className="max-w-full max-h-[85vh] object-contain"
                        />
                    ) : fileUrl ? (
                        // PDF Preview
                        <iframe
                            src={fileUrl}
                            className="w-full h-[85vh]"
                            title={fileName}
                        />
                    ) : (
                        <div className="p-12 text-center">
                            <div className="w-20 h-20 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4 text-gray-400">
                                <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                </svg>
                            </div>
                            <h4 className="text-lg font-semibold text-gray-800">Không thể xem trước</h4>
                            <p className="text-gray-500 mt-2 max-w-xs mx-auto">
                                Không thể tải file để xem trước.
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
