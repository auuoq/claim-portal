"use client";

import { useState } from "react";
import type { HopDongNhom } from "@/lib/api";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBuilding, faChevronDown } from "@fortawesome/free-solid-svg-icons";

interface GroupContractSelectorProps {
  contracts: HopDongNhom[];
  value: { tenant_code: string; contract_code: string } | null;
  onChange: (val: { tenant_code: string; contract_code: string } | null) => void;
}

export default function GroupContractSelector({
  contracts,
  value,
  onChange,
}: GroupContractSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);

  const selectedContract = value
    ? contracts.find(
        (c) => c.tenant_code === value.tenant_code && c.contract_code === value.contract_code
      )
    : null;

  const handleSelect = (contract: HopDongNhom) => {
    onChange({ tenant_code: contract.tenant_code, contract_code: contract.contract_code });
    setIsOpen(false);
  };

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-gray-800">Chọn hợp đồng bảo hiểm nhóm</h2>

      <div className="relative">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className={`w-full flex items-center justify-between px-4 py-3.5 rounded-xl border-2 text-left transition-all
            ${selectedContract
              ? "border-teal-400 bg-teal-50/50"
              : "border-gray-200 bg-white hover:border-teal-300 hover:bg-teal-50/30"
            }`}
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className={`flex-shrink-0 w-9 h-9 rounded-lg flex items-center justify-center
              ${selectedContract ? "bg-teal-100" : "bg-gray-100"}`}>
              <FontAwesomeIcon
                icon={faBuilding}
                className={`w-4 h-4 ${selectedContract ? "text-teal-600" : "text-gray-400"}`}
              />
            </div>
            <span className={`text-sm font-semibold truncate ${selectedContract ? "text-gray-900" : "text-gray-400"}`}>
              {selectedContract
                ? selectedContract.tenant_name
                : contracts.length === 0
                  ? "Không có hợp đồng nhóm"
                  : "Chọn hợp đồng..."}
            </span>
          </div>
          <FontAwesomeIcon
            icon={faChevronDown}
            className={`w-4 h-4 text-gray-400 flex-shrink-0 transition-transform duration-200
              ${isOpen ? "rotate-180" : ""}`}
          />
        </button>

        {isOpen && contracts.length > 0 && (
          <div className="absolute z-10 top-full mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden">
            {contracts.map((contract) => {
              const isSelected =
                value?.tenant_code === contract.tenant_code &&
                value?.contract_code === contract.contract_code;
              return (
                <button
                  key={`${contract.tenant_code}-${contract.contract_code}`}
                  type="button"
                  onClick={() => handleSelect(contract)}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors
                    ${isSelected
                      ? "bg-teal-50 border-l-4 border-teal-500"
                      : "hover:bg-gray-50 border-l-4 border-transparent"
                    }`}
                >
                  <div className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center
                    ${isSelected ? "bg-teal-100" : "bg-gray-100"}`}>
                    <FontAwesomeIcon
                      icon={faBuilding}
                      className={`w-4 h-4 ${isSelected ? "text-teal-600" : "text-gray-500"}`}
                    />
                  </div>
                  <span className="text-sm font-semibold text-gray-900 truncate">
                    {contract.tenant_name}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
