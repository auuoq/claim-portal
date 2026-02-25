const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://10.0.50.139:5041/api';

// Types for API responses
export interface TreatmentType {
    ma: string;
    ten: string;
}

export interface InsurancePackage {
    ten: string;
    cac_goi: {
        ten: string;
        preview: string;
    }[];
}

export interface DocumentType {
    ma: string;
    ten: string;
    mo_ta: string;
    bat_buoc: boolean;
}

export interface DocumentTypesResponse {
    status: string;
    data: DocumentType[];
}

export interface InfoResponse {
    status: string;
    data: {
        loai_dieu_tri: TreatmentType[];
        hop_dong: InsurancePackage[];
    };
}

// SSE Event types
export interface SSEProgressEvent {
    event: 'progress';
    message: string;
}

export interface SSEDocumentEvent {
    event: 'document';
    name: string;
    status: 'done' | 'fail';
    errors?: string[];
}

export interface SSEResultEvent {
    event: 'result';
    data: string; // Markdown content
}

export interface SSEDoneEvent {
    event: 'done';
}

export type SSEEvent = SSEProgressEvent | SSEDocumentEvent | SSEResultEvent | SSEDoneEvent;

export interface ClaimStreamCallbacks {
    onProgress: (message: string) => void;
    onDocument: (name: string, status: 'done' | 'fail', errors?: string[]) => void;
    onResult: (markdown: string) => void;
    onDone: () => void;
    onError: (error: string) => void;
}

// Fetch insurance packages
export async function fetchInsuranceInfo(): Promise<InfoResponse> {
    try {
        const response = await fetch(`${API_BASE_URL}/info`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error fetching insurance info:', error);
        throw error;
    }
}

// Fetch document types based on treatment type code (ma)
export async function fetchDocumentTypes(ma: string): Promise<DocumentTypesResponse> {
    try {
        const response = await fetch(`${API_BASE_URL}/document-types?ma=${ma}`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error fetching document types:', error);
        throw error;
    }
}

// Convert file to base64
function fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = error => reject(error);
    });
}

// Submit claim with SSE streaming
export async function submitClaim(
    data: {
        hopDong: string;
        goi: string;
        loai_dieu_tri: string;
        files: File[];
    },
    callbacks: ClaimStreamCallbacks
): Promise<void> {
    // Convert all files to base64 with their original names
    const filesBase64 = await Promise.all(
        data.files.map(async (file) => ({
            name: file.name,
            data: await fileToBase64(file)
        }))
    );

    const payload = {
        hop_dong: {
            ten: data.hopDong,
            goi: data.goi
        },
        loai_dieu_tri: data.loai_dieu_tri,
        ho_so: {
            files: filesBase64
        }
    };

    console.group('📤 SENDING TO API (SSE)');
    console.log('URL:', `${API_BASE_URL}/claim`);
    console.log('Payload (truncated):', {
        ...payload,
        ho_so: {
            files: filesBase64.map(f => ({
                name: f.name,
                data: `${f.data.substring(0, 50)}... (${f.data.length} chars)`
            }))
        }
    });
    console.groupEnd();

    let response: Response;
    try {
        response = await fetch(`${API_BASE_URL}/claim`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload)
        });
    } catch (err) {
        console.error('Fetch error:', err);
        callbacks.onError('Không thể kết nối đến máy chủ');
        return;
    }

    if (!response.ok) {
        callbacks.onError(`Lỗi máy chủ: ${response.status}`);
        return;
    }

    const reader = response.body?.getReader();
    if (!reader) {
        callbacks.onError('Không đọc được phản hồi từ máy chủ');
        return;
    }

    const decoder = new TextDecoder();
    let buffer = '';

    try {
        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });

            // SSE lines are separated by "\n\n"
            const parts = buffer.split('\n\n');
            buffer = parts.pop() ?? ''; // keep incomplete last part

            for (const part of parts) {
                const line = part.trim();
                if (!line.startsWith('data:')) continue;

                const jsonStr = line.replace(/^data:\s*/, '');
                try {
                    const event: SSEEvent = JSON.parse(jsonStr);
                    console.log('📥 SSE Event:', event);

                    if (event.event === 'progress') {
                        callbacks.onProgress(event.message);
                    } else if (event.event === 'document') {
                        callbacks.onDocument(event.name, event.status, event.errors);
                    } else if (event.event === 'result') {
                        callbacks.onResult(event.data);
                    } else if (event.event === 'done') {
                        callbacks.onDone();
                    }
                } catch (parseError) {
                    console.warn('Failed to parse SSE event:', jsonStr, parseError);
                }
            }
        }
    } catch (streamError) {
        console.error('Stream reading error:', streamError);
        callbacks.onError('Lỗi khi đọc dữ liệu từ máy chủ');
    }
}
