'use client';

import { useRef } from 'react';
import { validateFile, formatFileSize, isImageFile, createFilePreviewUrl } from '@/lib/utils';

interface FileWithPreview {
    id: string;
    file: File;
    previewUrl?: string;
}

interface DocumentUploadItemProps {
    documentType: {
        id: string;
        label: string;
        icon?: string;
        required?: boolean;
    };
    files: FileWithPreview[];
    onFilesAdd: (documentTypeId: string, files: File[]) => void;
    onFileRemove: (documentTypeId: string, fileId: string) => void;
}

export default function DocumentUploadItem({
    documentType,
    files,
    onFilesAdd,
    onFileRemove
}: DocumentUploadItemProps) {
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFiles = Array.from(e.target.files || []);

        // Validate each file
        const validFiles: File[] = [];
        const errors: string[] = [];

        selectedFiles.forEach(file => {
            const validation = validateFile(file);
            if (validation.valid) {
                validFiles.push(file);
            } else {
                errors.push(`${file.name}: ${validation.error}`);
            }
        });

        // Show errors if any
        if (errors.length > 0) {
            alert('Một số file không hợp lệ:\n' + errors.join('\n'));
        }

        // Add valid files
        if (validFiles.length > 0) {
            onFilesAdd(documentType.id, validFiles);
        }

        // Reset input
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const handleUploadClick = () => {
        fileInputRef.current?.click();
    };

    const hasFiles = files.length > 0;

    return (
        <div className={`
      p-4 rounded-lg border transition-all duration-200
      ${hasFiles ? 'border-teal-200 bg-gradient-to-r from-teal-50/50 to-cyan-50/30' : 'border-gray-200 bg-white hover:border-gray-300'}
    `}>
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 flex-1">
                    <div className={`
            w-8 h-8 rounded-lg flex items-center justify-center text-sm transition-colors
            ${hasFiles ? 'bg-teal-100 text-teal-600' : 'bg-gray-100 text-gray-400'}
          `}>
                        {hasFiles ? (
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                        ) : (
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                            </svg>
                        )}
                    </div>
                    <div className="flex-1">
                        <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-800 font-medium">{documentType.label}</span>
                            {documentType.required && (
                                <span className="text-red-500 text-xs">*</span>
                            )}
                        </div>
                        {hasFiles && (
                            <span className="text-xs text-teal-600">
                                {files.length} file
                            </span>
                        )}
                    </div>
                </div>

                <button
                    onClick={handleUploadClick}
                    className="px-3 py-1.5 text-xs font-medium border border-teal-500 text-teal-600 rounded-md hover:bg-teal-50 transition-colors duration-200 flex items-center gap-1.5"
                >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    Tải lên
                </button>

                <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept="image/jpeg,image/jpg,image/png,image/heic,image/heif,application/pdf"
                    onChange={handleFileSelect}
                    className="hidden"
                />
            </div>

            {/* File previews */}
            {hasFiles && (
                <div className="mt-3 space-y-2">
                    {files.map((fileWithPreview) => (
                        <div
                            key={fileWithPreview.id}
                            className="flex items-center gap-3 p-2.5 bg-white rounded-md border border-gray-100"
                        >
                            {/* Preview */}
                            <div className="w-10 h-10 rounded-md overflow-hidden bg-gray-50 flex-shrink-0">
                                {isImageFile(fileWithPreview.file) && fileWithPreview.previewUrl ? (
                                    <img
                                        src={fileWithPreview.previewUrl}
                                        alt={fileWithPreview.file.name}
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">
                                        PDF
                                    </div>
                                )}
                            </div>

                            {/* File info */}
                            <div className="flex-1 min-w-0">
                                <p className="text-xs font-medium text-gray-800 truncate">
                                    {fileWithPreview.file.name}
                                </p>
                                <p className="text-xs text-gray-500">
                                    {formatFileSize(fileWithPreview.file.size)}
                                </p>
                            </div>

                            {/* Remove button */}
                            <button
                                onClick={() => onFileRemove(documentType.id, fileWithPreview.id)}
                                className="w-6 h-6 rounded-full hover:bg-red-50 text-red-500 flex items-center justify-center transition-colors duration-200 text-sm"
                                title="Xóa file"
                            >
                                ×
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
