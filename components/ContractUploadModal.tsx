'use client';

import { useEffect, useRef, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFileContract, faCloudArrowUp, faImage, faFilePdf, faXmark } from '@fortawesome/free-solid-svg-icons';

interface FileWithId {
    id: string;
    file: File;
}

interface ContractUploadModalProps {
    isOpen: boolean;
    packageName: string;
    subOptionName: string;
    initialFiles?: File[];
    onConfirm: (files: File[]) => void;
    onSkip: () => void;
    onPreviewFile?: (file: File) => void;
}

function formatFileSize(bytes: number) {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function isImageFile(file: File) {
    return file.type.startsWith('image/');
}

let _idCounter = 0;
function uniqueId() { return `cf_${Date.now()}_${++_idCounter}`; }

const ALLOWED_TYPES = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png', 'image/heic', 'image/heif'];
const MAX_SIZE = 100 * 1024 * 1024; // 100MB

export default function ContractUploadModal({
    isOpen,
    packageName,
    subOptionName,
    initialFiles,
    onConfirm,
    onSkip,
    onPreviewFile,
}: ContractUploadModalProps) {
    const [files, setFiles] = useState<FileWithId[]>([]);
    const [isDragging, setIsDragging] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
            setFiles(
                initialFiles && initialFiles.length > 0
                    ? initialFiles.map(f => ({ id: uniqueId(), file: f }))
                    : []
            );
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => { document.body.style.overflow = 'unset'; };
    }, [isOpen]);

    if (!isOpen) return null;

    const addFiles = (incoming: File[]) => {
        const valid: FileWithId[] = [];
        const errors: string[] = [];
        incoming.forEach(f => {
            if (f.size > MAX_SIZE) {
                errors.push(`${f.name}: vượt quá 100MB`);
            } else if (!ALLOWED_TYPES.includes(f.type)) {
                errors.push(`${f.name}: chỉ chấp nhận PDF, JPG, PNG`);
            } else {
                valid.push({ id: uniqueId(), file: f });
            }
        });
        if (errors.length) alert('Một số file không hợp lệ:\n' + errors.join('\n'));
        if (valid.length) setFiles(prev => [...prev, ...valid]);
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        addFiles(Array.from(e.target.files || []));
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        addFiles(Array.from(e.dataTransfer.files));
    };

    const removeFile = (id: string) => setFiles(prev => prev.filter(f => f.id !== id));

    return (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 animate-fadeIn">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

            <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden animate-scaleIn flex flex-col max-h-[90vh]">
                {/* Header */}
                <div className="bg-gradient-to-r from-teal-500 to-cyan-500 text-white px-6 py-4 flex-shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
                            <FontAwesomeIcon icon={faFileContract} className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h3 className="text-base font-semibold leading-tight">Upload hợp đồng bảo hiểm cá nhân</h3>
                            <p className="text-teal-100 text-xs mt-0.5">
                                {packageName} — <span className="font-medium">{subOptionName}</span>
                            </p>
                        </div>
                    </div>
                </div>

                {/* Body */}
                <div className="p-6 space-y-4 overflow-y-auto flex-1">
                    <p className="text-sm text-gray-600">
                        Vui lòng upload file hợp đồng cá nhân (GCN) của bạn. File này là <strong>bắt buộc</strong> để tiếp tục.
                    </p>

                    {/* Dropzone */}
                    <div
                        onDrop={handleDrop}
                        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                        onDragLeave={() => setIsDragging(false)}
                        onClick={() => fileInputRef.current?.click()}
                        className={`
                            border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition-all duration-200 group
                            ${isDragging
                                ? 'border-teal-400 bg-teal-50/80'
                                : 'border-gray-200 bg-gray-50 hover:border-teal-300 hover:bg-teal-50/30'
                            }
                        `}
                    >
                        <input
                            ref={fileInputRef}
                            type="file"
                            multiple
                            accept=".pdf,.jpg,.jpeg,.png,.heic,.heif"
                            className="hidden"
                            onChange={handleInputChange}
                        />
                        <div className="w-10 h-10 bg-gray-100 group-hover:bg-teal-100 rounded-full flex items-center justify-center mx-auto mb-2 transition-colors">
                            <FontAwesomeIcon icon={faCloudArrowUp} className="w-5 h-5 text-gray-400 group-hover:text-teal-500 transition-colors" />
                        </div>
                        <p className="text-sm font-medium text-gray-600 group-hover:text-teal-600 transition-colors">
                            Kéo thả hoặc <span className="text-teal-500 underline">chọn file</span>
                        </p>
                        <p className="text-xs text-gray-400 mt-1">PDF, JPG, PNG — tối đa 100MB/file</p>
                    </div>

                    {/* File list */}
                    {files.length > 0 && (
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Đã chọn</p>
                                <span className="text-xs text-teal-600 font-medium bg-teal-50 px-2 py-0.5 rounded-full border border-teal-100">
                                    {files.length} file
                                </span>
                            </div>
                            {files.map(({ id, file }) => (
                                <div
                                    key={id}
                                    onClick={() => onPreviewFile && onPreviewFile(file)}
                                    className={`flex items-center gap-3 p-2.5 bg-white rounded-lg border border-gray-100 hover:border-teal-200 hover:shadow-sm transition-all group/item ${onPreviewFile ? 'cursor-pointer' : ''}`}
                                >
                                    {/* Icon */}
                                    <div className="w-9 h-9 rounded-md overflow-hidden bg-gray-50 flex-shrink-0 border border-gray-100 flex items-center justify-center">
                                        {isImageFile(file) ? (
                                            <FontAwesomeIcon icon={faImage} className="w-4 h-4 text-blue-400" />
                                        ) : (
                                            <FontAwesomeIcon icon={faFilePdf} className="w-4 h-4 text-red-400" />
                                        )}
                                    </div>
                                    {/* Info */}
                                    <div className="flex-1 min-w-0">
                                        <p className="text-xs font-medium text-gray-800 truncate">{file.name}</p>
                                        <p className="text-xs text-gray-400">{formatFileSize(file.size)}</p>
                                    </div>
                                    {/* Remove */}
                                    <button
                                        onClick={(e) => { e.stopPropagation(); removeFile(id); }}
                                        className="w-6 h-6 rounded-full hover:bg-red-50 text-gray-300 hover:text-red-500 flex items-center justify-center transition-colors opacity-0 group-hover/item:opacity-100"
                                        title="Xóa file"
                                    >
                                        <FontAwesomeIcon icon={faXmark} className="w-4 h-4" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="px-6 pb-6 pt-2 flex gap-3 flex-shrink-0 border-t border-gray-100 bg-gray-50/50">
                    <button
                        onClick={onSkip}
                        className="flex-1 px-4 py-2.5 border border-gray-200 text-gray-600 rounded-xl hover:bg-gray-50 transition-all text-sm font-medium"
                    >
                        ← Quay lại
                    </button>
                    <button
                        onClick={() => onConfirm(files.map(f => f.file))}
                        disabled={files.length === 0}
                        className={`flex-1 px-4 py-2.5 rounded-xl transition-all text-sm font-semibold ${files.length > 0
                            ? 'bg-gradient-to-r from-teal-500 to-cyan-500 text-white hover:from-teal-600 hover:to-cyan-600 shadow-sm hover:shadow-md'
                            : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                            }`}
                    >
                        Xác nhận
                    </button>
                </div>
            </div>
        </div>
    );
}
