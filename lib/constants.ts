// This file will be populated dynamically from API
// Keeping structure for reference

export interface InsuranceSubOption {
  id: string;
  name: string;
  preview?: string;
}

export interface InsurancePackageType {
  id: string;
  name: string;
  hasSubOptions: boolean;
  subOptions?: InsuranceSubOption[];
}

export interface InsuranceCategory {
  ten: string;
  preview?: string;
}

export interface InsuranceContract {
  ten: string;
  cac_goi: InsuranceCategory[];
}

export interface DocumentTypeInfo {
  bat_buoc: boolean;
  mo_ta: string;
}

export interface InsuranceInfoData {
  hop_dong: InsuranceContract[];
}

// Default empty - will be loaded from API
export let INSURANCE_PACKAGES: InsurancePackageType[] = [];
export interface DocumentType {
  id: string;
  label: string;
  required: boolean;
  description: string;
}
export let DOCUMENT_TYPES: Record<string, DocumentType[]> = {};

// File validation constants
export const FILE_VALIDATION = {
  maxSize: 10 * 1024 * 1024, // 10MB
  allowedTypes: {
    images: ['image/jpeg', 'image/jpg', 'image/png', 'image/heic'],
    documents: ['application/pdf']
  },
  get allAllowedTypes() {
    return [...this.allowedTypes.images, ...this.allowedTypes.documents];
  }
};

// Treatment types
export const TREATMENT_TYPES = [
  { id: 'inpatient', name: 'Nội trú', description: 'Điều trị nội trú tại bệnh viện' },
  { id: 'outpatient', name: 'Ngoại trú', description: 'Khám và điều trị ngoại trú' }
];

// Function to update constants from API
export function updateFromAPI(data: InsuranceInfoData) {
  // Convert API format to our format
  INSURANCE_PACKAGES = data.hop_dong.map((contract, index) => {
    const hasSubOptions = contract.cac_goi && contract.cac_goi.length > 0;

    return {
      id: `contract_${index}`,
      name: contract.ten,
      hasSubOptions,
      subOptions: hasSubOptions
        ? contract.cac_goi.map((goi: InsuranceCategory, goiIndex: number) => ({
          id: `goi_${index}_${goiIndex}`,
          name: goi.ten,
          preview: goi.preview
        }))
        : undefined
    };
  });
}

// Function to update document types from its own API
export function updateDocumentTypesFromAPI(data: Record<string, DocumentTypeInfo>, loai: 'inpatient' | 'outpatient') {
  const docTypesArray = Object.entries(data).map(([id, info]) => {
    // Extract label from description (everything before the first " - " or " / ")
    // Looking at the example: "Chi phí trước nhập viện / Chi phí ngoại trú - ..."
    // It seems " / " or " - " can be delimiters.
    const parts = info.mo_ta.split(' - ');
    let label = parts.length > 1 ? parts[0] : id;

    // Further split by / if needed
    if (label.includes(' / ')) {
      const subParts = label.split(' / ');
      // Choose based on loai? Or just keep both.
      // Usually the first part is more general or specific to the type.
      // For now let's just keep the hyphen split as it's cleaner in the provided example.
    }

    if (!parts.length || parts.length === 1) {
      label = id.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
    }

    const description = parts.length > 1
      ? parts.slice(1).join(' - ')
      : info.mo_ta;

    return {
      id,
      label,
      required: info.bat_buoc,
      description
    };
  });

  DOCUMENT_TYPES = {
    ...DOCUMENT_TYPES,
    [loai]: docTypesArray
  };
}

// API Endpoints
export const API_ENDPOINTS = {
  INFO: '/info',
  CLAIM: '/claim'
};
