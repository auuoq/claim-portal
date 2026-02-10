'use client';

import { DOCUMENT_TYPES } from '@/lib/constants';
import DocumentUploadItem from './DocumentUploadItem';

interface FileWithPreview {
    id: string;
    file: File;
    previewUrl?: string;
}

interface DocumentUploadSectionProps {
    treatmentType: string;
    uploadedDocuments: Record<string, FileWithPreview[]>;
    onFilesAdd: (documentTypeId: string, files: File[]) => void;
    onFileRemove: (documentTypeId: string, fileId: string) => void;
    isLoading?: boolean;
    invalidTypeLabels?: string[];
}

export default function DocumentUploadSection({
    treatmentType,
    uploadedDocuments,
    onFilesAdd,
    onFileRemove,
    isLoading,
    invalidTypeLabels = []
}: DocumentUploadSectionProps) {
    const documentTypes = DOCUMENT_TYPES[treatmentType as keyof typeof DOCUMENT_TYPES] || [];

    if (isLoading) {
        return (
            <div className="space-y-4 animate-fadeIn">
                <div className="flex items-center justify-between mb-4">
                    <div className="h-6 w-32 bg-gray-100 rounded animate-pulse"></div>
                    <div className="h-4 w-24 bg-gray-50 rounded animate-pulse"></div>
                </div>
                <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="h-24 bg-gray-50 rounded-xl border border-gray-100 animate-pulse"></div>
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
        <div className="space-y-4 animate-fadeIn">
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-base font-semibold text-gray-800">Tải lên hồ sơ y tế</h2>
                <span className="text-[10px] text-gray-400 font-medium bg-gray-50 px-2 py-0.5 rounded-full border border-gray-100 italic">
                    (*) Trường bắt buộc
                </span>
            </div>

            <div className="space-y-2">
                {documentTypes.map((docType) => (
                    <DocumentUploadItem
                        key={docType.id}
                        documentType={docType}
                        files={uploadedDocuments[docType.id] || []}
                        onFilesAdd={onFilesAdd}
                        onFileRemove={onFileRemove}
                        isInvalid={invalidTypeLabels.includes(docType.label)}
                    />
                ))}
            </div>
        </div>
    );
}
