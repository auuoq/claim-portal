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

export interface TreatmentTypeData {
  ma: string;
  ten: string;
}

export interface InsuranceInfoData {
  loai_dieu_tri: TreatmentTypeData[];
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

// Treatment types - will be loaded from API
export interface TreatmentType {
  id: string;
  name: string;
  ma: string;
}

export let TREATMENT_TYPES: TreatmentType[] = [];

// Function to update constants from API
export function updateFromAPI(data: InsuranceInfoData) {
  // Update treatment types
  TREATMENT_TYPES = data.loai_dieu_tri.map((type) => ({
    id: type.ma,
    name: type.ten,
    ma: type.ma
  }));

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
export function updateDocumentTypesFromAPI(data: Array<{
  ma: string;
  ten: string;
  mo_ta: string;
  bat_buoc: boolean;
}>, treatmentTypeId: string) {
  const docTypesArray = data.map((docType) => ({
    id: docType.ma,
    label: docType.ten,
    required: docType.bat_buoc,
    description: docType.mo_ta
  }));

  DOCUMENT_TYPES = {
    ...DOCUMENT_TYPES,
    [treatmentTypeId]: docTypesArray
  };
}

// API Endpoints
export const API_ENDPOINTS = {
  INFO: '/info',
  CLAIM: '/claim'
};
