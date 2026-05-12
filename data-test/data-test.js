export const dataTest = [
    {
      "doc_type": "giay_ra_vien",
      "schema_code": "boi_thuong_03",
      "pages": [
        { "file_name": "ho_so_p3.png", "page_number": 3 }
      ],
      "fields": {
        "ten_co_so_y_te": "Bệnh viện Đa khoa Tâm Anh",
        "khoa": "Ngoại tổng hợp",
        "ho_ten_benh_nhan": "Nguyễn Văn A",
        "ngay_sinh": "1990-04-22",
        "tuoi": 36,
        "gioi_tinh": "Nam",
        "so_the_bhyt": "HS4012345678901",
        "hieu_luc_the_bhyt": "Từ 01/01/2026 đến 31/12/2026",
        "chan_doan": [
          { "loai": "chinh",    "noi_dung": "K35.9 - Viêm ruột thừa cấp" },
          { "loai": "kem_theo", "noi_dung": "K29.7 - Viêm dạ dày" }
        ],
        "ngay_gio_vao_vien": "10/03/2026 08:30",
        "ngay_gio_ra_vien":  "15/03/2026 14:00",
        "phuong_phap_dieu_tri": "Phẫu thuật nội soi cắt ruột thừa",
        "xac_nhan": {
          "has_signature": true,
          "signer_name": "BS. Trần Văn B",
          "has_stamp": true,
          "has_digital_signature": false,
          "signing_date": "2026-03-15"
        }
      }
    },
    {
      "doc_type": "hoa_don_chi_phi",
      "schema_code": "boi_thuong_06",
      "pages": [
        { "file_name": "ho_so_p5.png", "page_number": 5 }
      ],
      "fields": {
        "ten_co_so_y_te": "Bệnh viện Đa khoa Tâm Anh",
        "ho_ten_benh_nhan": "Nguyễn Văn A",
        "so_hoa_don": "HD-2026-00123",
        "ngay_hoa_don": "2026-03-15",
        "tong_tien_thanh_toan": 18450000,
        "hinh_thuc_thanh_toan": "Chuyển khoản"
        // ... các trường khác theo schema boi_thuong_06
      }
    },
    {
      "doc_type": "bang_ke_chi_phi",
      "schema_code": "boi_thuong_07",
      "pages": [
        { "file_name": "ho_so_p6.png", "page_number": 6 },
        { "file_name": "ho_so_p7.png", "page_number": 7 }
      ],
      "fields": {
        // ── Pass 1: khung bảng kê ─────────────────────────────
        "ten_co_so_y_te": "Bệnh viện Đa khoa Tâm Anh",
        "hanh_chinh": {
          "ho_ten_benh_nhan": "Nguyễn Văn A",
          "ngay_sinh": "1990-04-22",
          "gioi_tinh": "Nam"
        },
        "chan_doan": [
          { "loai": "chinh",    "noi_dung": "K35.9 - Viêm ruột thừa cấp", "ma_icd": "K35.9" }
        ],
        "tong_chi_phi": {
          "tong_cong": 18450000,
          "bhyt_chi_tra": 0,
          "benh_nhan_chi_tra": 18450000
        },
        // ── Pass 2: chi tiết items (10 nhóm chi phí) ─────────
        "noi_dung_bang_ke": {
          "kham_benh": [
            { "ten_dich_vu": "Khám ngoại tổng hợp", "so_luong": 1, "don_gia": 150000, "thanh_tien": 150000 }
          ],
          "ngay_giuong": [
            { "ten_dich_vu": "Giường bệnh thường - khoa Ngoại", "so_luong": 5, "don_gia": 350000, "thanh_tien": 1750000 }
          ],
          "xet_nghiem": [
            { "ten_dich_vu": "Công thức máu", "so_luong": 1, "don_gia": 90000, "thanh_tien": 90000 },
            { "ten_dich_vu": "Sinh hóa máu cơ bản", "so_luong": 1, "don_gia": 220000, "thanh_tien": 220000 }
          ],
          "phau_thuat_thu_thuat": [
            { "ten_dich_vu": "Phẫu thuật nội soi cắt ruột thừa", "so_luong": 1, "don_gia": 8500000, "thanh_tien": 8500000 }
          ],
          "thuoc_dich_truyen_mau": [
            { "ten_dich_vu": "Ceftriaxone 1g", "so_luong": 6, "don_gia": 45000, "thanh_tien": 270000 }
          ],
          "thiet_bi_vat_tu_y_te": null,
          "goi_vat_tu_thiet_bi": null,
          "van_chuyen": null,
          "dich_vu_khac": [
            { "ten_dich_vu": "Hành chính/Hồ sơ", "so_luong": 1, "don_gia": 50000, "thanh_tien": 50000 }
          ],
          "thuoc_ra_vien": null
        }
      }
    }
    // ... mỗi loại giấy tờ đã upload sẽ có 1 entry, schema "fields" tương ứng schema_code.
  ]