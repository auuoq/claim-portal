const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://gamic-quiescent-juliane.ngrok-free.dev/api';

// Types for API responses
export interface InsurancePackage {
    ten: string;
    cac_goi: {
        ten: string;
        preview: string;
    }[];
}

export interface InfoResponse {
    status: string;
    data: {
        giay_to: Record<string, string>;
        hop_dong: InsurancePackage[];
    };
}

export interface ClaimResponse {
    status: string;
    data: string; // Markdown content
}

// Fetch insurance packages and document types
export async function fetchInsuranceInfo(): Promise<InfoResponse> {
    try {
        const response = await fetch(`${API_BASE_URL}/info`, {
            headers: {
                'ngrok-skip-browser-warning': '69420',
            },
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

// Convert file to base64
function fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = error => reject(error);
    });
}

// Submit claim
export async function submitClaim(data: {
    hopDong: string;
    goi: string;
    loai: string;
    hoSo: Record<string, File[]>;
}): Promise<ClaimResponse> {
    try {
        // Convert files to base64
        const hoSoBase64: Record<string, string[]> = {};

        for (const [docType, files] of Object.entries(data.hoSo)) {
            hoSoBase64[docType] = await Promise.all(
                files.map(file => fileToBase64(file))
            );
        }

        const payload = {
            hop_dong: {
                ten: data.hopDong,
                goi: data.goi
            },
            loai: data.loai,
            ho_so: hoSoBase64
        };

        console.group('📤 SENDING TO API');
        console.log('URL:', `${API_BASE_URL}/claim`);
        console.log('Payload:', {
            ...payload,
            ho_so: Object.fromEntries(
                Object.entries(hoSoBase64).map(([key, files]) => [
                    key,
                    files.map(f => `${f.substring(0, 50)}... (${f.length} chars)`)
                ])
            )
        });
        console.groupEnd();

        const response = await fetch(`${API_BASE_URL}/claim`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'ngrok-skip-browser-warning': '69420',
            },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();

        console.group('📥 RESPONSE FROM API');
        console.log('Status:', result.status);
        console.log('Data length:', result.data?.length || 0);
        console.groupEnd();

        return result;
    } catch (error) {
        console.error('Error submitting claim:', error);
        throw error;
    }
}
