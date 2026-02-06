import { FILE_VALIDATION } from './constants';

/**
 * Validate file type and size
 */
export function validateFile(file: File): { valid: boolean; error?: string } {
    // Check file size
    if (file.size > FILE_VALIDATION.maxSize) {
        return {
            valid: false,
            error: `File quá lớn. Kích thước tối đa: ${formatFileSize(FILE_VALIDATION.maxSize)}`
        };
    }

    // Check file type
    if (!FILE_VALIDATION.allAllowedTypes.includes(file.type)) {
        return {
            valid: false,
            error: 'Định dạng file không được hỗ trợ. Chỉ chấp nhận: JPG, PNG, HEIC, PDF'
        };
    }

    return { valid: true };
}

/**
 * Format file size to human readable format
 */
export function formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

/**
 * Generate unique ID for files
 */
export function generateUniqueId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Check if file is an image
 */
export function isImageFile(file: File): boolean {
    return FILE_VALIDATION.allowedTypes.images.includes(file.type);
}

/**
 * Check if file is a PDF
 */
export function isPdfFile(file: File): boolean {
    return FILE_VALIDATION.allowedTypes.documents.includes(file.type);
}

/**
 * Create object URL for file preview
 */
export function createFilePreviewUrl(file: File): string {
    return URL.createObjectURL(file);
}

/**
 * Revoke object URL to free memory
 */
export function revokeFilePreviewUrl(url: string): void {
    URL.revokeObjectURL(url);
}
