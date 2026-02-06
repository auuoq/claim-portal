'use client';

import { TREATMENT_TYPES } from '@/lib/constants';

interface TreatmentTypeSelectorProps {
    selectedType: string | null;
    onSelect: (type: string) => void;
}

export default function TreatmentTypeSelector({ selectedType, onSelect }: TreatmentTypeSelectorProps) {
    return (
        <div className="space-y-4">
            <h2 className="text-base font-semibold text-gray-800 mb-4">Chọn loại điều trị</h2>

            <div className="grid grid-cols-2 gap-3">
                {TREATMENT_TYPES.map((type) => (
                    <button
                        key={type.id}
                        onClick={() => onSelect(type.id)}
                        className={`
                            px-4 py-3 rounded-lg border transition-all duration-200 text-sm font-medium
                            ${selectedType === type.id
                                ? 'border-teal-500 bg-teal-50 text-teal-700 shadow-sm'
                                : 'border-gray-200 bg-white hover:border-teal-100 text-gray-700'
                            }
                        `}
                    >
                        {type.name} ({type.id === 'inpatient' ? 'Inpatient' : 'Outpatient'})
                    </button>
                ))}
            </div>
        </div>
    );
}
