# Kho Công Cụ Toán học & GVCN (Static Site)

Website tĩnh gồm các trang công cụ (HTML) cho Lớp 10–11–12, GVCN và Tiện ích.

## Cấu trúc
```
.
├─ index.html
├─ css/styles.css
├─ js/app.js
└─ tools/
   ├─ lop10/
   ├─ lop11/
   ├─ lop12/
   ├─ gvcn/
   └─ tien-ich/
```
Mỗi công cụ là **một file HTML độc lập** – mở trực tiếp cũng chạy được.

## Cách dùng nhanh (máy tính cá nhân)
- Mở `index.html` bằng trình duyệt, bấm chọn công cụ ở thanh bên để xem trong khung (iframe).

## Triển khai GitHub Pages
1. Tạo repo mới, kéo thả (upload) toàn bộ thư mục này.
2. Vào `Settings` → **Pages** → Build and deployment: *Deploy from a branch*, chọn branch **main/master**, folder `/root`, Save.
3. Nếu dùng GitHub Actions, đặt file `.github/workflows/pages.yml` như dưới – GitHub tự build & publish.

## GitHub Actions (tùy chọn)
See `.github/workflows/pages.yml`.
