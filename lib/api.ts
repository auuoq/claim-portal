const API_BASE_URL = process.env.NEXT_PUBLIC_API_TEST_URL || 'http://10.0.50.139:5041/api';

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
    status: 'done'; // API spec: always 'done'
}

export interface SSEResultEvent {
    event: 'result';
    data: string; // Markdown content
}

export interface SSEErrorEvent {
    event: 'error';
    message: string;
    missing_documents?: { ma: string; ten: string }[];
    suggested_documents?: { ma: string; ten: string }[];
}

export interface SSEMissingDocumentsEvent {
    event: 'missing_documents';
    message: string;
    missing_documents: { ma: string; ten: string }[];
}

export interface SSEDoneEvent {
    event: 'done';
}

export type SSEEvent = SSEProgressEvent | SSEDocumentEvent | SSEResultEvent | SSEDoneEvent | SSEErrorEvent | SSEMissingDocumentsEvent;

export interface ClaimStreamCallbacks {
    onProgress: (message: string) => void;
    onDocument: (name: string) => void;
    onResult: (markdown: string) => void;
    onDone: () => void;
    onMissingDocuments: (message: string, docs: { ma: string; ten: string }[]) => void;
    onError: (error: string, missingDocuments?: { ma: string; ten: string }[], suggestedDocuments?: { ma: string; ten: string }[]) => void;
}

// Fetch insurance packages
export async function fetchInsuranceInfo(): Promise<InfoResponse> {
    try {
        const response = await fetch(`${API_BASE_URL}/info`, {
            headers: {
                'ngrok-skip-browser-warning': 'true'
            }
        });
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
        const response = await fetch(`${API_BASE_URL}/document-types?ma=${ma}`, {
            headers: {
                'ngrok-skip-browser-warning': 'true'
            }
        });
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
        contractFiles?: File[];
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

    // Convert contract files to base64 if provided
    const contractFilesBase64 = data.contractFiles && data.contractFiles.length > 0
        ? await Promise.all(data.contractFiles.map(async (f) => ({ name: f.name, data: await fileToBase64(f) })))
        : null;

    const payload: Record<string, unknown> = {
        hop_dong: {
            ten: data.hopDong,
            goi: data.goi
        },
        loai_dieu_tri: data.loai_dieu_tri,
        ho_so: {
            files: filesBase64
        }
    };

    if (contractFilesBase64) {
        payload.hop_dong_ca_nhan = {
            files: contractFilesBase64
        };
    }

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
                'ngrok-skip-browser-warning': 'true'
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

    let doneReceived = false;
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
                        callbacks.onDocument(event.name);
                    } else if (event.event === 'result') {
                        callbacks.onResult(event.data);
                    } else if (event.event === 'done') {
                        doneReceived = true;
                        callbacks.onDone();
                    } else if (event.event === 'missing_documents') {
                        callbacks.onMissingDocuments(event.message, event.missing_documents);
                        return;
                    } else if (event.event === 'error') {
                        callbacks.onError(event.message, event.missing_documents, event.suggested_documents);
                        return;
                    }
                } catch (parseError) {
                    console.warn('Failed to parse SSE event:', jsonStr, parseError);
                }
            }
        }
        // Stream ended without a 'done' event — trigger done anyway
        if (!doneReceived) {
            callbacks.onDone();
        }
    } catch (streamError) {
        console.error('Stream reading error:', streamError);
        callbacks.onError('Lỗi khi đọc dữ liệu từ máy chủ');
    }
}
