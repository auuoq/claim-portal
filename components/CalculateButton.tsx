"use client";

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCircleNotch, faArrowRight } from '@fortawesome/free-solid-svg-icons';

interface CalculateButtonProps {
  disabled: boolean;
  loading: boolean;
  onClick: () => void;
}

export default function CalculateButton({
  disabled,
  loading,
  onClick,
}: CalculateButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      className={`
        px-5 py-2.5 rounded-lg font-semibold text-sm
        transition-all duration-200 shadow-sm
        ${disabled || loading
          ? "bg-gray-100 text-gray-400 cursor-not-allowed"
          : "bg-gradient-to-r from-teal-500 to-teal-600 text-white hover:from-teal-600 hover:to-teal-700 hover:shadow-md"
        }
      `}
    >
      {loading ? (
        <span className="flex items-center justify-center gap-2">
          <FontAwesomeIcon icon={faCircleNotch} className="w-4 h-4" spin />
          Đang tính toán...
        </span>
      ) : (
        <span className="flex items-center justify-center gap-2">
          Đọc hồ sơ
          <FontAwesomeIcon icon={faArrowRight} className="w-4 h-4" />
        </span>
      )}
    </button>
  );
}
