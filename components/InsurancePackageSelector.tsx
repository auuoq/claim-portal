'use client';

import { useState } from 'react';
import { INSURANCE_PACKAGES } from '@/lib/constants';

interface InsurancePackageSelectorProps {
    selectedPackage: string | null;
    selectedSubOption: string | null;
    onPackageSelect: (packageId: string) => void;
    onSubOptionSelect: (subOptionId: string) => void;
    onPreview: (packageName: string, content: string) => void;
    contractFileCount?: number;
    onEditContract?: () => void;
}

export default function InsurancePackageSelector({
    selectedPackage,
    selectedSubOption,
    onPackageSelect,
    onSubOptionSelect,
    onPreview,
    contractFileCount,
    onEditContract
}: InsurancePackageSelectorProps) {
    const [expandedPackage, setExpandedPackage] = useState<string | null>(null);

    const handlePackageClick = (packageId: string, hasSubOptions: boolean) => {
        if (hasSubOptions) {
            // Toggle expansion for packages with sub-options
            setExpandedPackage(expandedPackage === packageId ? null : packageId);
            if (expandedPackage !== packageId) {
                onPackageSelect(packageId);
            }
        } else {
            // Direct selection for packages without sub-options
            onPackageSelect(packageId);
            setExpandedPackage(null);
        }
    };

    const selectedPackageData = INSURANCE_PACKAGES.find(p => p.id === selectedPackage);

    return (
        <div className="space-y-4">
            <h2 className="text-base font-semibold text-gray-800 mb-4">Chọn gói bảo hiểm của bạn</h2>

            <div className="space-y-2">
                {INSURANCE_PACKAGES.map((pkg) => (
                    <div key={pkg.id}>
                        {/* Main package button */}
                        <button
                            onClick={() => handlePackageClick(pkg.id, pkg.hasSubOptions)}
                            className={`
                w-full text-left px-4 py-3 rounded-lg border transition-all duration-200
                ${selectedPackage === pkg.id
                                    ? 'border-teal-500 bg-teal-50'
                                    : 'border-gray-200 bg-white hover:border-gray-300'
                                }
              `}
                        >
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-800">{pkg.name}</span>
                                {pkg.hasSubOptions && (
                                    <svg
                                        className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${expandedPackage === pkg.id ? 'rotate-180' : ''
                                            }`}
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                    </svg>
                                )}
                            </div>
                        </button>

                        {/* Sub-options (if any) */}
                        {pkg.hasSubOptions && expandedPackage === pkg.id && pkg.subOptions && (
                            <div className="mt-2 ml-4 space-y-1 animate-fadeIn">
                                {pkg.subOptions.map((subOpt) => (
                                    <div key={subOpt.id} className="flex gap-2 flex-col">
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => onSubOptionSelect(subOpt.id)}
                                                className={`
                                                    flex-1 text-left px-4 py-2.5 rounded-lg border transition-all duration-200 text-sm
                                                    ${selectedSubOption === subOpt.id
                                                        ? 'border-teal-500 bg-teal-50 text-teal-700'
                                                        : 'border-gray-100 bg-gray-50 hover:bg-gray-100 text-gray-700'
                                                    }
                                                `}
                                            >
                                                {subOpt.name}
                                            </button>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    onPreview(subOpt.name, subOpt.preview || '');
                                                }}
                                                className="px-3 rounded-lg border border-gray-200 bg-white text-gray-500 hover:text-teal-600 hover:border-teal-300 hover:bg-teal-50 transition-all text-xs flex items-center gap-1 shrink-0"
                                                title="Xem chi tiết"
                                            >
                                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                </svg>
                                                <span>Xem</span>
                                            </button>
                                        </div>

                                        {/* Contract files status — shown below selected sub-option */}
                                        {selectedSubOption === subOpt.id && contractFileCount !== undefined && contractFileCount > 0 && (
                                            <div className="flex items-center justify-between bg-teal-50 border border-teal-200 rounded-lg px-3 py-2">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-6 h-6 bg-teal-100 rounded-md flex items-center justify-center flex-shrink-0">
                                                        <svg className="w-3.5 h-3.5 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                                                        </svg>
                                                    </div>
                                                    <div>
                                                        <p className="text-xs font-semibold text-teal-700">Hợp đồng cá nhân</p>
                                                        <p className="text-xs text-teal-500">{contractFileCount} file đã upload</p>
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={onEditContract}
                                                    className="text-xs font-medium text-teal-600 hover:text-teal-800 bg-white border border-teal-200 hover:border-teal-400 px-2.5 py-1 rounded-lg transition-all"
                                                >
                                                    Sửa lại
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}
