'use client';

import { useRef, useCallback, useState } from 'react';
import { DOCUMENT_TYPES } from '@/lib/constants';
import { validateFile, formatFileSize, isImageFile } from '@/lib/utils';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faInfoCircle, faChevronDown, faCloudArrowUp, faFileLines, faXmark } from '@fortawesome/free-solid-svg-icons';

interface FileWithPreview {
    id: string;
    file: File;
    previewUrl?: string;
}

interface DocumentUploadSectionProps {
    treatmentType: string;
    uploadedFiles: FileWithPreview[];
    onFilesAdd: (files: File[]) => void;
    onFileRemove: (fileId: string) => void;
    onFilePreview?: (file: FileWithPreview) => void;
    isLoading?: boolean;
}

export default function DocumentUploadSection({
    treatmentType,
    uploadedFiles,
    onFilesAdd,
    onFileRemove,
    onFilePreview,
    isLoading,
}: DocumentUploadSectionProps) {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isGuideOpen, setIsGuideOpen] = useState(false);
    const documentTypes = DOCUMENT_TYPES[treatmentType as keyof typeof DOCUMENT_TYPES] || [];

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFiles = Array.from(e.target.files || []);
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

        if (errors.length > 0) {
            alert('Một số file không hợp lệ:\n' + errors.join('\n'));
        }
        if (validFiles.length > 0) {
            onFilesAdd(validFiles);
        }
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        const droppedFiles = Array.from(e.dataTransfer.files);
        const validFiles: File[] = [];
        const errors: string[] = [];

        droppedFiles.forEach(file => {
            const validation = validateFile(file);
            if (validation.valid) validFiles.push(file);
            else errors.push(`${file.name}: ${validation.error}`);
        });

        if (errors.length > 0) alert('Một số file không hợp lệ:\n' + errors.join('\n'));
        if (validFiles.length > 0) onFilesAdd(validFiles);
    }, [onFilesAdd]);

    if (isLoading) {
        return (
            <div className="space-y-4 animate-fadeIn">
                <div className="h-6 w-32 bg-gray-100 rounded animate-pulse mb-4"></div>
                <div className="h-28 bg-gray-50 rounded-xl border border-gray-100 animate-pulse"></div>
                <div className="space-y-2">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="h-8 bg-gray-50 rounded-lg border border-gray-100 animate-pulse"></div>
                    ))}
                </div>
            </div>
        );
    }

    if (documentTypes.length === 0) {
        return (
            <div className="bg-amber-50 border border-amber-100 p-4 rounded-xl text-center">
                <p className="text-sm text-amber-700">Không tìm thấy danh sách hồ sơ cho hình thức điều trị này.</p>
            </div>
        );
    }

    return (
        <div className="space-y-5 animate-fadeIn">
            {/* ── Hướng dẫn giấy tờ ── */}
            <div className="bg-blue-50 border border-blue-100 rounded-xl overflow-hidden">
                <button
                    onClick={() => setIsGuideOpen(v => !v)}
                    className="w-full flex items-center justify-between px-4 py-3 hover:bg-blue-100/50 transition-colors"
                >
                    <div className="flex items-center gap-2">
                        <FontAwesomeIcon icon={faInfoCircle} className="w-4 h-4 text-blue-500 flex-shrink-0" />
                        <p className="text-xs font-semibold text-blue-700 uppercase tracking-wide">Giấy tờ cần chuẩn bị</p>
                    </div>
                    <FontAwesomeIcon icon={faChevronDown} className={`w-4 h-4 text-blue-400 transition-transform duration-200 ${isGuideOpen ? 'rotate-180' : ''}`} />
                </button>

                {isGuideOpen && (
                    <div className="px-4 pb-4">
                        <ul className="space-y-1.5">
                            {documentTypes.map(doc => (
                                <li key={doc.id} className="flex items-start gap-2">
                                    <span className="mt-1 w-1.5 h-1.5 rounded-full bg-blue-300 flex-shrink-0"></span>
                                    <div>
                                        <span className="text-xs font-medium text-gray-700">
                                            {doc.label}
                                            {doc.required && <span className="text-red-500 ml-0.5 font-bold">*</span>}
                                        </span>
                                        {doc.description && (
                                            <span className="text-xs text-gray-400 ml-1">— {doc.description}</span>
                                        )}
                                    </div>
                                </li>
                            ))}
                        </ul>
                        <p className="text-[10px] text-gray-400 mt-2.5">(<span className="text-red-400 font-bold">*</span>) Bắt buộc</p>
                    </div>
                )}
            </div>

            {/* ── Ô upload duy nhất ── */}
            <div>
                <div className="flex items-center justify-between mb-2">
                    <h2 className="text-sm font-semibold text-gray-800">Tải lên hồ sơ</h2>
                    {uploadedFiles.length > 0 && (
                        <span className="text-xs text-teal-600 font-medium bg-teal-50 px-2 py-0.5 rounded-full border border-teal-100">
                            {uploadedFiles.length} file đã chọn
                        </span>
                    )}
                </div>

                {/* Drop zone */}
                <div
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-gray-200 rounded-xl p-6 text-center cursor-pointer hover:border-teal-400 hover:bg-teal-50/30 transition-all group"
                >
                    <div className="w-10 h-10 bg-gray-100 group-hover:bg-teal-100 rounded-full flex items-center justify-center mx-auto mb-2 transition-colors">
                        <FontAwesomeIcon icon={faCloudArrowUp} className="w-5 h-5 text-gray-400 group-hover:text-teal-500 transition-colors" />
                    </div>
                    <p className="text-sm font-medium text-gray-600 group-hover:text-teal-600 transition-colors">
                        Kéo thả hoặc <span className="text-teal-500 underline">chọn file</span>
                    </p>
                    <p className="text-xs text-gray-400 mt-1">JPG, PNG, HEIC, PDF — tối đa 100MB/file</p>

                    <input
                        ref={fileInputRef}
                        type="file"
                        multiple
                        accept="image/jpeg,image/jpg,image/png,image/heic,image/heif,application/pdf"
                        onChange={handleFileSelect}
                        className="hidden"
                    />
                </div>

                {/* Danh sách file đã upload */}
                {uploadedFiles.length > 0 && (
                    <div className="mt-3 space-y-2">
                        {uploadedFiles.map((fileWithPreview) => (
                            <div
                                key={fileWithPreview.id}
                                onClick={() => onFilePreview?.(fileWithPreview)}
                                className="flex items-center gap-3 p-2.5 bg-white rounded-lg border border-gray-100 hover:border-teal-300 hover:shadow-sm transition-all cursor-pointer group/file"
                            >
                                {/* Thumbnail */}
                                <div className="w-9 h-9 rounded-md overflow-hidden bg-gray-50 flex-shrink-0 border border-gray-100">
                                    {isImageFile(fileWithPreview.file) && fileWithPreview.previewUrl ? (
                                        <img src={fileWithPreview.previewUrl} alt={fileWithPreview.file.name} className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center">
                                            <FontAwesomeIcon icon={faFileLines} className="w-4 h-4 text-red-400" />
                                        </div>
                                    )}
                                </div>

                                {/* Info */}
                                <div className="flex-1 min-w-0">
                                    <p className="text-xs font-medium text-gray-800 truncate">{fileWithPreview.file.name}</p>
                                    <p className="text-xs text-gray-400">{formatFileSize(fileWithPreview.file.size)}</p>
                                </div>

                                {/* Remove */}
                                <button
                                    onClick={(e) => { e.stopPropagation(); onFileRemove(fileWithPreview.id); }}
                                    className="w-6 h-6 rounded-full hover:bg-red-50 text-gray-300 hover:text-red-500 flex items-center justify-center transition-colors opacity-0 group-hover/file:opacity-100"
                                    title="Xóa file"
                                >
                                    <FontAwesomeIcon icon={faXmark} className="w-4 h-4" />
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
