function getApiBaseUrl(): string {
  const envUrl = process.env.NEXT_PUBLIC_API_TEST_URL?.trim();
  if (envUrl) return envUrl;

  if (typeof window !== "undefined") {
    const protocol = window.location.protocol || "http:";
    const hostname = window.location.hostname || "127.0.0.1";
    if (hostname === "localhost" || hostname === "127.0.0.1") {
      return "http://127.0.0.1:5041/api";
    }
    return `${protocol}//${hostname}:5041/api`;
  }

  return "http://127.0.0.1:5041/api";
}

const API_BASE_URL = getApiBaseUrl();
const REQUEST_TIMEOUT_MS = 15000;

async function fetchWithTimeout(
  input: RequestInfo | URL,
  init: RequestInit = {},
  timeoutMs = REQUEST_TIMEOUT_MS,
): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(input, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timeout);
  }
}

// --- Document type (giấy tờ) ---
export interface DocType {
  ma: string;
  ten: string;
}

// --- OCR result types (per-page display) ---
export interface HoSoPageEntry {
  content: string;
  source: string;
  page_number: number;
  file_name: string;
  ten_giay_to: string;
}

export interface OcrResult {
  session_id?: string;
  ho_so: Record<string, any[]>;
  ho_so_full?: Record<string, HoSoPageEntry[]>;
  stats?: { total_pages: number; processed: number; removed: number };
  removed_pages?: Array<{ source: string; reason: string }>;
  classified_doc_types?: string[];
  uploaded_documents?: DocType[];
  missing_documents?: DocType[];
  contract_details?: any;
  hop_dong?: { ten: string; goi: string };
  loai_dieu_tri?: string;
  dich_vu?: any[];
  anchors?: Record<string, any>;
  ho_so_chi_co_hoa_don?: boolean;
  tenant_code?: string;
  contract_code?: string;
  loai_dieu_tri_ma?: string;
}

/** Build URL for lazy-loading original PDF page image via internal proxy. */
export function buildPageImageUrl(sessionId: string, source: string): string {
  const url = `/api/proxy-image?sessionId=${sessionId}&source=${encodeURIComponent(source)}`;
  console.log("🖼️ Building Proxy Image URL:", url);
  return url;
}


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

export interface HopDongNhom {
  tenant_code: string;
  tenant_name: string;
  contract_code: string;
  contract_name: string;
  provider: string;
  packages: string[];
  effective_from: string | null;
  effective_to: string | null;
}

export interface InfoResponse {
  status: string;
  data: {
    loai_dieu_tri: TreatmentType[];
    hop_dong: InsurancePackage[];
    hop_dong_nhom?: HopDongNhom[];
  };
}

// SSE Event types
export interface SSEProgressEvent {
  event: "progress";
  message: string;
}

export interface SSEDocumentEvent {
  event: "document";
  name: string;
  status: "done"; // API spec: always 'done'
}

export interface SSEResultEvent {
  event: "result";
  data?: any; // Changed. Can be OCR payload or markdown string/object
  [key: string]: any;
}

export interface SSEErrorEvent {
  event: "error";
  message: string;
  missing_documents?: { ma: string; ten: string }[];
  suggested_documents?: { ma: string; ten: string }[];
  uploaded_documents?: { ma: string; ten: string }[];
}

export interface SSEMissingDocumentsEvent {
  event: "missing_documents";
  message: string;
  missing_documents: { ma: string; ten: string }[];
  uploaded_documents?: { ma: string; ten: string }[];
}

export interface SSEDoneEvent {
  event: "done";
}

export type SSEEvent =
  | SSEProgressEvent
  | SSEDocumentEvent
  | SSEResultEvent
  | SSEDoneEvent
  | SSEErrorEvent
  | SSEMissingDocumentsEvent;

export interface ClaimStreamCallbacks {
  onProgress: (message: string) => void;
  onDocument: (name: string) => void;
  onResult: (data: any) => void;
  onDone: () => void;
  onMissingDocuments: (
    message: string,
    missingDocs: { ma: string; ten: string }[],
    uploadedDocs?: { ma: string; ten: string }[],
  ) => void;
  onError: (
    error: string,
    missingDocuments?: { ma: string; ten: string }[],
    suggestedDocuments?: { ma: string; ten: string }[],
    uploadedDocuments?: { ma: string; ten: string }[],
  ) => void;
}

// Fetch insurance packages
export async function fetchInsuranceInfo(): Promise<InfoResponse> {
  try {
    const response = await fetchWithTimeout(`${API_BASE_URL}/info`, {
      headers: {
        "ngrok-skip-browser-warning": "true",
      },
    });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error fetching insurance info:", error);
    throw error;
  }
}

// Fetch document types based on treatment type code (ma)
export async function fetchDocumentTypes(
  ma: string,
): Promise<DocumentTypesResponse> {
  try {
    const response = await fetchWithTimeout(`${API_BASE_URL}/document-types?ma=${ma}`, {
      headers: {
        "ngrok-skip-browser-warning": "true",
      },
    });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error fetching document types:", error);
    throw error;
  }
}

// Convert file to base64
function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
  });
}

// Generic SSE POST function
async function handleSSEStream(
  endpoint: string,
  payload: Record<string, unknown>,
  callbacks: ClaimStreamCallbacks,
) {
  console.group(`📤 SENDING TO API (SSE): ${endpoint}`);
  console.log("URL:", `${API_BASE_URL}${endpoint}`);
  const summaryPayload = { ...payload };
  if (summaryPayload.ho_so && (summaryPayload.ho_so as any).files) {
    summaryPayload.ho_so = {
      files: (summaryPayload.ho_so as any).files.map((f: any) => ({
        name: f.name,
        data: `${f.data?.substring(0, 50)}... (${f.data?.length} chars)`,
      })),
    };
  }
  console.log("Payload (maybe truncated):", summaryPayload);
  console.groupEnd();

  let response: Response;
  try {
    response = await fetchWithTimeout(`${API_BASE_URL}${endpoint}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "ngrok-skip-browser-warning": "true",
      },
      body: JSON.stringify(payload),
    });
  } catch (err) {
    console.error("Fetch error:", err);
    callbacks.onError("Không thể kết nối đến máy chủ");
    return;
  }

  if (!response.ok) {
    callbacks.onError(`Lỗi máy chủ: ${response.status}`);
    return;
  }

  const reader = response.body?.getReader();
  if (!reader) {
    callbacks.onError("Không đọc được phản hồi từ máy chủ");
    return;
  }

  const decoder = new TextDecoder();
  let buffer = "";
  let doneReceived = false;

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });

      const parts = buffer.split("\n\n");
      buffer = parts.pop() ?? "";

      for (const part of parts) {
        const line = part.trim();
        if (!line.startsWith("data:")) continue;

        const jsonStr = line.replace(/^data:\s*/, "");
        try {
          const event: SSEEvent = JSON.parse(jsonStr);
          console.log("📥 SSE Event:", event);

          if (event.event === "progress") {
            callbacks.onProgress(event.message);
          } else if (event.event === "document") {
            callbacks.onDocument(event.name);
          } else if (event.event === "result") {
            callbacks.onResult(event);
          } else if (event.event === "done") {
            doneReceived = true;
            callbacks.onDone();
          } else if (event.event === "missing_documents") {
            callbacks.onMissingDocuments(
              event.message,
              event.missing_documents,
              event.uploaded_documents,
            );
            return;
          } else if (event.event === "error") {
            callbacks.onError(
              event.message,
              event.missing_documents,
              event.suggested_documents,
              event.uploaded_documents,
            );
            return;
          }
        } catch (parseError) {
          console.warn("Failed to parse SSE event:", jsonStr, parseError);
        }
      }
    }
    if (!doneReceived) {
      callbacks.onDone();
    }
  } catch (streamError) {
    console.error("Stream reading error:", streamError);
    callbacks.onError("Lỗi khi đọc dữ liệu từ máy chủ");
  }
}

// Submit claim for OCR
export async function submitClaimOcr(
  data: {
    hopDong: string;
    goi: string;
    loai_dieu_tri: string;
    files: File[];
    contractFiles?: File[];
  },
  callbacks: ClaimStreamCallbacks,
): Promise<void> {
  const filesBase64 = await Promise.all(
    data.files.map(async (file) => ({
      name: file.name,
      data: await fileToBase64(file),
    })),
  );

  const contractFilesBase64 =
    data.contractFiles && data.contractFiles.length > 0
      ? await Promise.all(
          data.contractFiles.map(async (f) => ({
            name: f.name,
            data: await fileToBase64(f),
          })),
        )
      : null;

  const payload: Record<string, unknown> = {
    hop_dong: {
      ten: data.hopDong,
      goi: data.goi,
    },
    loai_dieu_tri: data.loai_dieu_tri,
    ho_so: {
      files: filesBase64,
    },
  };

  if (contractFilesBase64) {
    payload.hop_dong_ca_nhan = {
      files: contractFilesBase64,
    };
  }

  await handleSSEStream("/claim/ocr", payload, callbacks);
}

// Submit group claim OCR (POST /claim/group/ocr) — Bước 1: OCR + phân loại
export async function submitGroupOcr(
  data: {
    tenant_code: string;
    contract_code: string;
    loai_dieu_tri_ma: string;
    loai_dieu_tri?: string;
    files: File[];
  },
  callbacks: ClaimStreamCallbacks,
): Promise<void> {
  const filesBase64 = await Promise.all(
    data.files.map(async (file) => ({
      name: file.name,
      data: await fileToBase64(file),
    })),
  );

  const payload: Record<string, unknown> = {
    tenant_code: data.tenant_code,
    contract_code: data.contract_code,
    loai_dieu_tri_ma: data.loai_dieu_tri_ma,
    loai_dieu_tri: data.loai_dieu_tri,
    ho_so: { files: filesBase64 },
  };

  await handleSSEStream("/claim/group/ocr", payload, callbacks);
}

// Submit group claim analyse (POST /claim/group/analyse) — Bước 2: Phân tích quyền lợi
export async function submitGroupAnalyse(
  payload: Record<string, unknown>,
  callbacks: ClaimStreamCallbacks,
): Promise<void> {
  await handleSSEStream("/claim/group/analyse", payload, callbacks);
}

// Submit claim for Analyse
export async function submitClaimAnalyse(
  payload: Record<string, unknown>,
  callbacks: ClaimStreamCallbacks,
): Promise<void> {
  await handleSSEStream("/claim/analyse", payload, callbacks);
}
