'use client';

interface StepIndicatorProps {
    currentStep: number;
    totalSteps: number;
    stepLabels: string[];
}

export default function StepIndicator({ currentStep, totalSteps, stepLabels }: StepIndicatorProps) {
    return (
        <div className="w-full mb-8">
            {/* Progress Bar */}
            <div className="relative">
                <div className="flex justify-between mb-2">
                    {stepLabels.map((label, index) => {
                        const stepNumber = index + 1;
                        const isCompleted = stepNumber < currentStep;
                        const isCurrent = stepNumber === currentStep;

                        return (
                            <div key={index} className="flex flex-col items-center flex-1">
                                <div className={`
                  w-10 h-10 rounded-full flex items-center justify-center font-semibold text-sm
                  transition-all duration-300 relative z-10
                  ${isCompleted ? 'bg-teal-500 text-white' : ''}
                  ${isCurrent ? 'bg-teal-500 text-white ring-4 ring-teal-100' : ''}
                  ${!isCompleted && !isCurrent ? 'bg-gray-200 text-gray-500' : ''}
                `}>
                                    {isCompleted ? (
                                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                        </svg>
                                    ) : (
                                        stepNumber
                                    )}
                                </div>
                                <span className={`
                  text-xs mt-2 font-medium text-center
                  ${isCurrent ? 'text-teal-600' : 'text-gray-500'}
                `}>
                                    {label}
                                </span>
                            </div>
                        );
                    })}
                </div>

                {/* Progress Line */}
                <div className="absolute top-5 left-0 right-0 h-0.5 bg-gray-200 -z-0" style={{ width: 'calc(100% - 40px)', marginLeft: '20px' }}>
                    <div
                        className="h-full bg-teal-500 transition-all duration-500"
                        style={{ width: `${((currentStep - 1) / (totalSteps - 1)) * 100}%` }}
                    />
                </div>
            </div>
        </div>
    );
}
