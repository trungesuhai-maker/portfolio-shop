# HƯỚNG DẪN TÍCH HỢP TOÀN DIỆN V3 SHOP-BRIDGE (ĐẢM BẢO 100% HIỂN THỊ HEADER & KẾT NỐI ADMIN TRÊN VERCEL)

Tài liệu này cung cấp **Đoạn Prompt Đầy Đủ & Hoàn Chỉnh Nhất** dùng để dán trực tiếp vào **Project Template con (AI Studio / Vite / React)**. 
Prompt này giải quyết triệt để 3 vấn đề:
1. **Thanh Header Dùng Thử Mua Template**: Tự động hiển thị đồng bộ 100% bằng Shop-Bridge.js (Gradient Cam - Hồng - Tím, logo Webcuaban, nút MUA NGAY) trên trang chủ và trang admin, không bao giờ bị đè và tự động ẩn khi mở modal/popup.
2. **Nút "EDIT" (Chỉnh Sửa)**: Kết nối chuẩn xác 100% tới trang quản trị admin mà không bị lỗi 404 trên Vercel.
3. **Cơ Chế Đồng Bộ**: Tự động căn cứ vào trường thông tin "Đường Dẫn Live Demo" để tạo ra "Custom Admin URL" chính xác (`/admin` và `/admin.html`).

---

## 📋 ĐOẠN PROMPT DÁN VÀO AI STUDIO / DỰ ÁN TEMPLATE CON:

```markdown
[NHIỆM VỤ TÍCH HỢP TOÀN DIỆN SHOP-BRIDGE V3 CHO TEMPLATE CON VỚI WEBCUABAN.SITE]

Bạn là kỹ sư phần mềm phụ trách dự án template con này. Dự án này được thiết kế để kết nối, hiển thị dùng thử và bán trên sàn Shop Mẹ (webcuaban.site).

Hãy thực hiện NGAY VÀ ĐẦY ĐỦ các bước chuẩn hóa sau trong mã nguồn dự án:

===================================================================
1. CẤU HÌNH ROUTING TRÁNH LỖI 404 TRÊN VERCEL / NETLIFY
===================================================================
Khi deploy lên Vercel, các trang Single Page App (SPA) sẽ gặp lỗi 404 NOT_FOUND nếu truy cập trực tiếp vào `/admin` hoặc `/admin.html`. 
Hãy cấu hình chính xác:

A. Tạo file `vercel.json` ngay tại THƯ MỤC GỐC của dự án:
```json
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

B. Trong file \`App.tsx\` (hoặc file router chính), BẮT BUỘC khai báo cả 2 route dẫn tới trang Admin:
\`\`\`tsx
import { Routes, Route } from 'react-router-dom';
import HomePage from './pages/HomePage'; // hoặc trang chủ của bạn
import AdminPage from './pages/AdminPage'; // hoặc trang admin của bạn

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/admin" element={<AdminPage />} />
      <Route path="/admin.html" element={<AdminPage />} />
      {/* Các route khác nếu có */}
    </Routes>
  );
}
\`\`\`

===================================================================
2. NHÚNG CẦU NỐI SHOP-BRIDGE.JS (TỰ ĐỘNG HIỂN THỊ THANH HEADER CHUẨN CỦA SHOP):
===================================================================
Bạn KHÔNG CẦN và TUYỆT ĐỐI KHÔNG tự tạo bất kỳ file hay component header dùng thử nào (như ShopTrialHeader.tsx hay banner riêng).

Chỉ cần nhúng DUY NHẤT 1 thẻ script sau vào trong cặp thẻ <head>...</head> của file \`index.html\` (và cả \`admin.html\` nếu là trang tĩnh độc lập):
\`\`\`html
<script src="https://www.webcuaban.site/Shop-Bridge.js"></script>
\`\`\`

* CƠ CHẾ HOẠT ĐỘNG HOÀN TOÀN TỰ ĐỘNG VÀ ĐỒNG BỘ CỦA SHOP-BRIDGE.JS:
1. Tự động hiển thị thanh Header Dùng Thử Mua Template chuẩn mực của Shop Mẹ:
   - Thanh Header nền Gradient Cam - Hồng - Tím sang trọng với Logo Webcuaban chính thức.
   - Dòng chữ: "Đang dùng thử template. | Mua ngay để sở hữu tên miền riêng & kích hoạt bản quyền".
   - Nút tròn nền trắng chữ cam nổi bật "MUA NGAY" (kèm icon giỏ hàng), tự động liên kết tới trang mua template của Shop mẹ.
   - Nút tắt nhanh banner "✕".
2. Tự động tương thích bố cục giao diện:
   - Tự động cộng khoảng trống \`padding-top: 46px\` cho \`<body>\`.
   - Tự động quét và đẩy các thanh Navbar/Header cố định (fixed / sticky) của template con xuống dưới banner, tuyệt đối không bị đè che khuất.
3. Tự động ẨN THÔNG MINH khi mở Modal / Popup / Drawer:
   - Khi người dùng bấm chỉnh sửa, upload ảnh, mở hộp thoại cấu hình, thanh header dùng thử sẽ tự động ẩn ngay lập tức để không bao giờ che khuất nút Lưu hay form nhập liệu của template con.
   - Khi đóng Modal / Popup thì thanh header tự động hiện trở lại.
4. Tự động ẨN HOÀN TOÀN 100% khi người dùng đã mua bản quyền:
   - Khi truy cập với tư cách chủ sở hữu (\`licensed=true\` hoặc \`role=owner\`), thanh header dùng thử sẽ ẩn vĩnh viễn, trả lại không gian 100% sạch sẽ cho khách hàng.
5. Tự động kết nối nút "EDIT" / "Admin" và "Về Trang Chủ":
   - Tự động bắt sự kiện tất cả các nút có nhãn "Chỉnh sửa", "EDIT", "Admin", "Vào quản trị" trên trang chủ để chuyển đến trang admin mà không làm mất query params của phiên dùng thử.

===================================================================
3. KẾT NỐI NÚT "CHỈNH SỬA" (EDIT) TRÊN TRANG CHỦ:
===================================================================
Trên trang chủ (`HomePage` hoặc `index.html`), tìm tất cả các nút "Chỉnh Sửa" / "EDIT" / "Vào quản trị" và gắn sự kiện click chuẩn sau:

```tsx
<a 
  href="/admin" 
  onClick={(e) => {
    e.preventDefault();
    if ((window as any).ShopBridge && typeof (window as any).ShopBridge.getAdminUrl === 'function') {
      window.location.href = (window as any).ShopBridge.getAdminUrl();
    } else {
      const currentSearch = window.location.search || '';
      window.location.href = '/admin.html' + currentSearch;
    }
  }}
  className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-all"
>
  Chỉnh Sửa (EDIT)
</a>
```

===================================================================
4. NHÚNG SHOP-BRIDGE SDK VÀO index.html:
===================================================================
Trong file `index.html`, thêm thẻ script sau vào trong thẻ `<head>`:
```html
<script src="https://www.webcuaban.site/Shop-Bridge.js"></script>
```
(Script này sẽ tự động kích hoạt tính năng nạp dữ liệu hai chiều, IndexedDB cách ly phiên thử nghiệm, và Cloudflare R2 Upload khi người dùng bấm Lưu trong trang quản trị).

===================================================================
5. TẠO FILE MANIFEST ĐỒNG BỘ: public/.well-known/shop-template-manifest.json
===================================================================
Tạo file `public/.well-known/shop-template-manifest.json` trong dự án con:
```json
{
  "$schema": "https://webcuaban.site/schemas/template-manifest-v2.json",
  "id": "tpl-lucy",
  "name": "LUCY",
  "slug": "lucy",
  "description": "Mẫu portfolio sáng tạo được xây dựng trên nền tảng AI Studio.",
  "categoryId": "c3",
  "categoryName": "Photographer & Video Creator",
  "price": 490000,
  "salePrice": 390000,
  "currency": "VND",
  "originUrl": "https://lucy.webcuaban.site/",
  "demoUrl": "https://lucy.webcuaban.site/",
  "adminUrl": "https://lucy.webcuaban.site/admin.html",
  "thumbnail": "https://images.unsplash.com/photo-1542038784456-1ea8e935640e?w=800",
  "version": "1.0.0",
  "status": "published",
  "editableFields": [
    { "id": "f1", "key": "brand_name", "label": "Tên Thương Hiệu", "type": "string", "isRequired": true },
    { "id": "f2", "key": "hero_title", "label": "Tiêu Đề Chính", "type": "string", "isRequired": true },
    { "id": "f3", "key": "hero_description", "label": "Mô Tả Tóm Tắt", "type": "text", "isRequired": false }
  ],
  "defaultData": {
    "brand_name": "LUCY STUDIO",
    "hero_title": "Creative Filmmaker & Photographer",
    "hero_description": "Mẫu portfolio sáng tạo trên AI Studio."
  }
}
```
* QUY TẮC ĐỒNG BỘ URL ADMIN:
- "adminUrl" được Shop Mẹ tự động căn cứ vào "demoUrl": ví dụ Demo là `https://my-template.vercel.app` thì Admin URL tương ứng là `https://my-template.vercel.app/admin.html`.
- Cả hai đường dẫn `/admin` và `/admin.html` đều trỏ vào trang Admin nhờ file `vercel.json` và cấu hình router.
```
