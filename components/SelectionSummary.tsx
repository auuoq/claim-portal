import { INSURANCE_PACKAGES, TREATMENT_TYPES, InsurancePackageType, InsuranceSubOption } from '@/lib/constants';

interface SelectionSummaryProps {
    insurancePackage: string | null;
    insuranceSubOption: string | null;
    treatmentType: string | null;
    fileCount: number;
}

export default function SelectionSummary({
    insurancePackage,
    insuranceSubOption,
    treatmentType,
    fileCount
}: SelectionSummaryProps) {
    const packageData = INSURANCE_PACKAGES.find((p: InsurancePackageType) => p.id === insurancePackage);
    const subOptionData = packageData?.subOptions?.find((s: InsuranceSubOption) => s.id === insuranceSubOption);
    const treatmentTypeData = TREATMENT_TYPES.find(t => t.id === treatmentType);

    return (
        <div className="bg-gradient-to-br from-teal-50 to-cyan-50 rounded-xl p-5 border border-teal-100">
            <h3 className="text-sm font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <svg className="w-4 h-4 text-teal-600" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
                    <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd" />
                </svg>
                Thông tin đã chọn
            </h3>

            <div className="space-y-3">
                {/* Insurance Package */}
                <div className="flex items-start gap-2">
                    <div className="w-5 h-5 rounded-full bg-teal-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                    </div>
                    <div className="flex-1">
                        <p className="text-xs text-gray-500">Gói bảo hiểm</p>
                        <p className="text-sm font-medium text-gray-800">
                            {packageData?.name || '-'}
                        </p>
                        {subOptionData && (
                            <p className="text-xs text-teal-600 mt-0.5">→ {subOptionData.name}</p>
                        )}
                    </div>
                </div>

                {/* Treatment Type */}
                {treatmentType && (
                    <div className="flex items-start gap-2">
                        <div className="w-5 h-5 rounded-full bg-teal-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                            <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                        </div>
                        <div className="flex-1">
                            <p className="text-xs text-gray-500">Loại điều trị</p>
                            <p className="text-sm font-medium text-gray-800">
                                {treatmentTypeData?.name || treatmentType}
                            </p>
                        </div>
                    </div>
                )}

                {/* File Count */}
                {fileCount > 0 && (
                    <div className="flex items-start gap-2">
                        <div className="w-5 h-5 rounded-full bg-teal-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                            <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                        </div>
                        <div className="flex-1">
                            <p className="text-xs text-gray-500">Hồ sơ đã tải</p>
                            <p className="text-sm font-medium text-gray-800">
                                {fileCount} file
                            </p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
