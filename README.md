# Portal Nộp Hồ Sơ Bảo Hiểm

Ứng dụng web cho phép người dùng upload hồ sơ bảo hiểm (ảnh/PDF) và tính toán số tiền claim thông qua API.

## 🚀 Tính năng

- ✅ Chọn loại điều trị (Nội trú / Ngoại trú)
- 📤 Upload nhiều file (ảnh JPG, PNG, HEIC hoặc PDF)
- 🖼️ Preview ảnh trước khi gửi
- 💰 Tính toán số tiền claim tự động
- 📱 Responsive design - hoạt động tốt trên mobile và desktop
- ⚡ Hiệu ứng mượt mà, giao diện hiện đại

## 📋 Yêu cầu hệ thống

- Node.js 18+ hoặc 20+
- npm hoặc yarn

## 🛠️ Cài đặt

1. Clone repository hoặc tải code về

2. Cài đặt dependencies:
```bash
npm install
```

3. Tạo file `.env.local` (optional):
```bash
cp .env.local.example .env.local
```

4. Chạy development server:
```bash
npm run dev
```

5. Mở trình duyệt và truy cập: [http://localhost:3000](http://localhost:3000)

## 🌐 Deploy lên Vercel

### Cách 1: Deploy từ GitHub

1. Push code lên GitHub repository
2. Truy cập [vercel.com](https://vercel.com)
3. Click "New Project"
4. Import repository từ GitHub
5. Vercel sẽ tự động detect Next.js và deploy

### Cách 2: Deploy từ CLI

```bash
# Cài đặt Vercel CLI
npm i -g vercel

# Deploy
vercel
```

### Cấu hình Environment Variables trên Vercel

Nếu bạn có API endpoint thực, thêm biến môi trường trong Vercel Dashboard:

- `NEXT_PUBLIC_API_URL`: URL của API backend

## 📁 Cấu trúc thư mục

```
claim-portal/
├── app/
│   ├── page.tsx          # Main page
│   ├── layout.tsx        # Root layout
│   └── globals.css       # Global styles
├── components/
│   ├── TreatmentTypeSelector.tsx
│   ├── DocumentUploadSection.tsx
│   ├── DocumentUploadItem.tsx
│   ├── CalculateButton.tsx
│   └── ResultModal.tsx
├── lib/
│   ├── constants.ts      # Danh sách loại hồ sơ, validation rules
│   ├── utils.ts          # Helper functions
│   └── api.ts            # API integration
└── public/               # Static files
```

## 🔧 Tích hợp API thực

Hiện tại app đang dùng mock API. Để tích hợp API thật:

1. Mở file `lib/api.ts`
2. Thay thế `mockCalculateClaim` bằng `calculateClaim` trong `app/page.tsx`
3. Cấu hình `NEXT_PUBLIC_API_URL` trong `.env.local`

### Format API Request

API endpoint sẽ nhận FormData với cấu trúc:

```javascript
FormData {
  treatmentType: "inpatient" | "outpatient",
  documentStructure: JSON string,
  [documentType]_[index]: File
}
```

### Format API Response

```javascript
{
  success: boolean,
  claimAmount?: number,
  message?: string,
  error?: string
}
```

## 🎨 Customization

### Thay đổi màu sắc

Mở `app/globals.css` và `tailwind.config.js` để thay đổi theme colors.

### Thêm/sửa loại hồ sơ

Mở `lib/constants.ts` và chỉnh sửa `DOCUMENT_TYPES`.

## 📝 Scripts

- `npm run dev` - Chạy development server
- `npm run build` - Build production
- `npm start` - Chạy production server
- `npm run lint` - Chạy ESLint

## 🐛 Troubleshooting

### Port 3000 đã được sử dụng

```bash
npm run dev -- -p 3001
```

### Lỗi khi upload file lớn

Kiểm tra `FILE_VALIDATION.maxSize` trong `lib/constants.ts`

## 📄 License

MIT

## 👨‍💻 Support

Nếu có vấn đề, vui lòng tạo issue hoặc liên hệ team.
