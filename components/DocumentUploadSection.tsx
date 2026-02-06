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
}

export default function DocumentUploadSection({
    treatmentType,
    uploadedDocuments,
    onFilesAdd,
    onFileRemove
}: DocumentUploadSectionProps) {
    const documentTypes = DOCUMENT_TYPES[treatmentType as keyof typeof DOCUMENT_TYPES] || [];

    if (documentTypes.length === 0) {
        return null;
    }

    return (
        <div className="space-y-4 animate-fadeIn">
            <h2 className="text-base font-semibold text-gray-800 mb-4">Tải lên hồ sơ y tế</h2>

            <div className="space-y-2">
                {documentTypes.map((docType) => (
                    <DocumentUploadItem
                        key={docType.id}
                        documentType={docType}
                        files={uploadedDocuments[docType.id] || []}
                        onFilesAdd={onFilesAdd}
                        onFileRemove={onFileRemove}
                    />
                ))}
            </div>
        </div>
    );
}
