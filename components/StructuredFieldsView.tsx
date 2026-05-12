"use client";

import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCheck, faXmark } from "@fortawesome/free-solid-svg-icons";

// Map of well-known snake_case keys → Vietnamese labels.
// Unknown keys fall back to a snake_case → Title Case conversion.
const FIELD_LABELS: Record<string, string> = {
  // Common
  ten_co_so_y_te: "Tên cơ sở y tế",
  khoa: "Khoa",
  ho_ten_benh_nhan: "Họ tên bệnh nhân",
  ngay_sinh: "Ngày sinh",
  tuoi: "Tuổi",
  gioi_tinh: "Giới tính",
  so_the_bhyt: "Số thẻ BHYT",
  hieu_luc_the_bhyt: "Hiệu lực thẻ BHYT",
  ma_icd: "Mã ICD",
  loai: "Loại",
  noi_dung: "Nội dung",

  // Giấy ra viện
  chan_doan: "Chẩn đoán",
  ngay_gio_vao_vien: "Ngày giờ vào viện",
  ngay_gio_ra_vien: "Ngày giờ ra viện",
  phuong_phap_dieu_tri: "Phương pháp điều trị",
  xac_nhan: "Xác nhận",
  has_signature: "Có chữ ký",
  signer_name: "Người ký",
  has_stamp: "Có con dấu",
  has_digital_signature: "Có chữ ký số",
  signing_date: "Ngày ký",

  // Hoá đơn
  so_hoa_don: "Số hoá đơn",
  ngay_hoa_don: "Ngày hoá đơn",
  tong_tien_thanh_toan: "Tổng tiền thanh toán",
  hinh_thuc_thanh_toan: "Hình thức thanh toán",

  // Bảng kê chi phí
  hanh_chinh: "Thông tin hành chính",
  tong_chi_phi: "Tổng chi phí",
  tong_cong: "Tổng cộng",
  bhyt_chi_tra: "BHYT chi trả",
  benh_nhan_chi_tra: "Bệnh nhân chi trả",
  noi_dung_bang_ke: "Chi tiết bảng kê",
  kham_benh: "Khám bệnh",
  ngay_giuong: "Ngày giường",
  xet_nghiem: "Xét nghiệm",
  phau_thuat_thu_thuat: "Phẫu thuật - Thủ thuật",
  thuoc_dich_truyen_mau: "Thuốc - Dịch truyền - Máu",
  thiet_bi_vat_tu_y_te: "Thiết bị / Vật tư y tế",
  goi_vat_tu_thiet_bi: "Gói vật tư - thiết bị",
  van_chuyen: "Vận chuyển",
  dich_vu_khac: "Dịch vụ khác",
  thuoc_ra_vien: "Thuốc ra viện",
  ten_dich_vu: "Tên dịch vụ",
  so_luong: "Số lượng",
  don_gia: "Đơn giá",
  thanh_tien: "Thành tiền",

  // Doc-level metadata (in case caller passes the whole entry)
  doc_type: "Loại giấy tờ",
  schema_code: "Mã schema",
  pages: "Các trang",
  file_name: "Tên file",
  page_number: "Trang số",
  fields: "Trường dữ liệu",
};

function humanize(key: string): string {
  if (FIELD_LABELS[key]) return FIELD_LABELS[key];
  return key
    .replace(/_/g, " ")
    .replace(/\b\w/g, (l) => l.toUpperCase());
}

function isCurrencyKey(key: string): boolean {
  const k = key.toLowerCase();
  return (
    k.includes("thanh_tien") ||
    k.includes("thanh_toan") ||
    k.includes("chi_tra") ||
    k.includes("chi_phi") ||
    k === "don_gia" ||
    k === "tong_cong"
  );
}

function isBooleanFlagKey(key: string): boolean {
  return key.startsWith("has_") || key.startsWith("is_");
}

function formatCurrency(n: number): string {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(n);
}

function formatNumber(n: number): string {
  return new Intl.NumberFormat("vi-VN").format(n);
}

function BooleanBadge({ value }: { value: boolean }) {
  return value ? (
    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700 border border-emerald-200">
      <FontAwesomeIcon icon={faCheck} className="w-3 h-3" /> Có
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-0.5 text-xs font-semibold text-gray-500 border border-gray-200">
      <FontAwesomeIcon icon={faXmark} className="w-3 h-3" /> Không
    </span>
  );
}

function EmptyDash() {
  return <span className="text-gray-400 italic">—</span>;
}

function renderPrimitive(key: string, value: unknown): React.ReactNode {
  if (value === null || value === undefined || value === "") {
    return <EmptyDash />;
  }
  if (typeof value === "boolean" || isBooleanFlagKey(key)) {
    return <BooleanBadge value={Boolean(value)} />;
  }
  if (typeof value === "number") {
    if (isCurrencyKey(key)) {
      return <span className="font-semibold text-teal-700">{formatCurrency(value)}</span>;
    }
    return <span>{formatNumber(value)}</span>;
  }
  return <span>{String(value)}</span>;
}

function isPlainObject(v: unknown): v is Record<string, unknown> {
  return v !== null && typeof v === "object" && !Array.isArray(v);
}

function isArrayOfObjects(v: unknown): v is Record<string, unknown>[] {
  return Array.isArray(v) && v.length > 0 && v.every((x) => isPlainObject(x));
}

interface StructuredFieldsViewProps {
  data: Record<string, unknown> | null | undefined;
  className?: string;
}

export default function StructuredFieldsView({ data, className }: StructuredFieldsViewProps) {
  if (!data || !isPlainObject(data) || Object.keys(data).length === 0) {
    return null;
  }
  return (
    <div className={className ?? "space-y-4"}>
      {Object.entries(data).map(([key, value]) => (
        <FieldNode key={key} fieldKey={key} value={value} depth={0} />
      ))}
    </div>
  );
}

function FieldNode({
  fieldKey,
  value,
  depth,
}: {
  fieldKey: string;
  value: unknown;
  depth: number;
}) {
  const label = humanize(fieldKey);

  if (value === null || value === undefined) {
    return <KVRow label={label} value={<EmptyDash />} />;
  }

  if (isArrayOfObjects(value)) {
    return <ArrayOfObjectsView label={label} rows={value} depth={depth} />;
  }

  if (Array.isArray(value)) {
    if (value.length === 0) {
      return <KVRow label={label} value={<EmptyDash />} />;
    }
    return (
      <div>
        <SectionLabel>{label}</SectionLabel>
        <ul className="list-disc list-inside text-sm text-gray-700 space-y-0.5">
          {value.map((v, i) => (
            <li key={i}>{renderPrimitive(fieldKey, v)}</li>
          ))}
        </ul>
      </div>
    );
  }

  if (isPlainObject(value)) {
    return <NestedSection label={label} data={value} depth={depth} />;
  }

  return <KVRow label={label} value={renderPrimitive(fieldKey, value)} />;
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-xs font-semibold uppercase tracking-wide text-teal-700 mb-2">
      {children}
    </div>
  );
}

function KVRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-[180px_1fr] gap-1 sm:gap-3 items-start">
      <div className="text-xs font-semibold uppercase tracking-wide text-gray-500 pt-0.5">
        {label}
      </div>
      <div className="text-sm text-gray-900 font-medium wrap-break-word">{value}</div>
    </div>
  );
}

function NestedSection({
  label,
  data,
  depth,
}: {
  label: string;
  data: Record<string, unknown>;
  depth: number;
}) {
  const containerClass =
    depth === 0
      ? "rounded-xl border border-teal-100 bg-teal-50/40 p-4"
      : "rounded-lg border border-gray-200 bg-white p-3";

  return (
    <div className={containerClass}>
      <div
        className={`text-sm font-semibold mb-3 ${
          depth === 0 ? "text-teal-800" : "text-gray-700"
        }`}
      >
        {label}
      </div>
      <div className="space-y-3">
        {Object.entries(data).map(([k, v]) => (
          <FieldNode key={k} fieldKey={k} value={v} depth={depth + 1} />
        ))}
      </div>
    </div>
  );
}

function ArrayOfObjectsView({
  label,
  rows,
  depth,
}: {
  label: string;
  rows: Record<string, unknown>[];
  depth: number;
}) {
  const allKeys = Array.from(new Set(rows.flatMap((r) => Object.keys(r))));
  const hasNested = rows.some((r) =>
    allKeys.some((k) => {
      const v = r[k];
      return v !== null && (isPlainObject(v) || Array.isArray(v));
    }),
  );

  const wrapperClass =
    depth === 0
      ? "rounded-xl border border-teal-100 bg-teal-50/40 p-4"
      : "rounded-lg border border-gray-200 bg-white p-3";

  if (hasNested) {
    return (
      <div className={wrapperClass}>
        <div
          className={`text-sm font-semibold mb-3 ${
            depth === 0 ? "text-teal-800" : "text-gray-700"
          }`}
        >
          {label}
        </div>
        <div className="space-y-3">
          {rows.map((row, i) => (
            <div key={i} className="rounded-lg border border-gray-200 bg-white p-3">
              <div className="text-xs font-medium text-gray-400 mb-2">#{i + 1}</div>
              <div className="space-y-2">
                {Object.entries(row).map(([k, v]) => (
                  <FieldNode key={k} fieldKey={k} value={v} depth={depth + 1} />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={wrapperClass}>
      <div
        className={`text-sm font-semibold mb-3 ${
          depth === 0 ? "text-teal-800" : "text-gray-700"
        }`}
      >
        {label}
      </div>
      <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              {allKeys.map((k) => (
                <th
                  key={k}
                  className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-600 border-b border-gray-200"
                >
                  {humanize(k)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {rows.map((row, i) => (
              <tr key={i} className="hover:bg-gray-50/60">
                {allKeys.map((k) => (
                  <td key={k} className="px-3 py-2 text-gray-800 align-top">
                    {renderPrimitive(k, row[k])}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
