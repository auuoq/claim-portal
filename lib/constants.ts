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

export interface InsuranceInfoData {
  hop_dong: InsuranceContract[];
  giay_to: Record<string, string>;
}

// Default empty - will be loaded from API
export let INSURANCE_PACKAGES: InsurancePackageType[] = [];
export let DOCUMENT_TYPES: Record<string, { id: string; label: string }[]> = {};

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

  const docTypesArray = Object.entries(data.giay_to).map(([id, label]) => ({
    id,
    label
  }));

  DOCUMENT_TYPES = {
    inpatient: docTypesArray,
    outpatient: docTypesArray
  };
}

// API Endpoints
export const API_ENDPOINTS = {
  INFO: '/info',
  CLAIM: '/claim'
};
