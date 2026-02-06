'use client';

interface CalculateButtonProps {
    disabled: boolean;
    loading: boolean;
    onClick: () => void;
}

export default function CalculateButton({ disabled, loading, onClick }: CalculateButtonProps) {
    return (
        <button
            onClick={onClick}
            disabled={disabled || loading}
            className={`
        px-5 py-2.5 rounded-lg font-semibold text-sm
        transition-all duration-200 shadow-sm
        ${disabled || loading
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-gradient-to-r from-teal-500 to-cyan-500 text-white hover:from-teal-600 hover:to-cyan-600 hover:shadow-md'
                }
      `}
        >
            {loading ? (
                <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Đang tính toán...
                </span>
            ) : (
                <span className="flex items-center justify-center gap-2">
                    Tính số tiền claim
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                </span>
            )}
        </button>
    );
}
