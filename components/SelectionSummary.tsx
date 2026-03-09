import { INSURANCE_PACKAGES, TREATMENT_TYPES, InsurancePackageType, InsuranceSubOption } from '@/lib/constants';

interface SelectionSummaryProps {
    insurancePackage: string | null;
    insuranceSubOption: string | null;
    treatmentType: string | null;
    fileCount: number;
}

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faClipboardList, faCheck } from '@fortawesome/free-solid-svg-icons';

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
                <FontAwesomeIcon icon={faClipboardList} className="w-4 h-4 text-teal-600" />
                Thông tin đã chọn
            </h3>

            <div className="space-y-3">
                {/* Insurance Package */}
                <div className="flex items-start gap-2">
                    <div className="w-5 h-5 rounded-full bg-teal-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <FontAwesomeIcon icon={faCheck} className="w-3 h-3 text-white" />
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
                            <FontAwesomeIcon icon={faCheck} className="w-3 h-3 text-white" />
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
                            <FontAwesomeIcon icon={faCheck} className="w-3 h-3 text-white" />
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
