# HƯỚNG DẪN KẾT NỐI TEMPLATE CON VỚI HỆ THỐNG WEBCUABAN.SITE

Khi bạn tạo một **Project AI Studio mới** để làm Template con cho hệ thống **webcuaban.site**, bạn chỉ cần sao chép đoạn prompt dưới đây và dán vào Project con đó.

---

## 📋 ĐOẠN PROMPT DÁN VÀO AI STUDIO TEMPLATE CON:

```markdown
Hãy tích hợp Template này với cầu nối ShopBridge của hệ thống webcuaban.site theo đúng chuẩn sau:

1. Trong thẻ <head> của cả file `index.html` và `admin.html`, nhúng thư viện cầu nối:
   <script src="https://www.webcuaban.site/js/shop-bridge.js"></script>

2. Khi nạp dữ liệu hiển thị (tại trang chủ `index.html` và trang quản trị `admin.html`):
   Gọi `window.ShopBridge.loadData(defaultData)` để lấy dữ liệu.
   Ví dụ:
   const data = await window.ShopBridge.loadData({
     hero_title: "My Portfolio",
     about_text: "Giới thiệu...",
     projects: []
   });

3. Khi người dùng lưu chỉnh sửa (trong form của `admin.html`):
   Gọi `window.ShopBridge.saveData(formData)` để lưu.
   Ví dụ:
   const result = await window.ShopBridge.saveData(updatedData);

4. Khi tải ảnh hoặc video lên (upload media):
   const fileUrl = await window.ShopBridge.uploadMedia({ file: selectedFile, category: 'images' });

5. Nút "Xem trang chủ" hoặc "Về trang chủ" trong trang admin.html:
   Cứ để link href="index.html" hoặc gọi window.location.href = window.ShopBridge.getHomeUrl();

6. KHÔNG tự code thêm thanh Header thông báo dùng thử (Trial banner):
   Thư viện `shop-bridge.js` đã tự động chèn thanh Header dùng thử màu cam tím kèm nút "MUA TEMPLATE NGAY" của sàn webcuaban.site và tự động ẩn khi kích hoạt bản quyền. Hãy XÓA BỎ hoàn toàn thanh banner thử nghiệm nội bộ tự vẽ trong file index.html / admin.html nếu có.
```

---

## 🎯 CƠ CHẾ HOẠT ĐỘNG TỰ ĐỘNG CỦA SHOP VÀ TEMPLATE:

Hệ thống Shop (`webcuaban.site`) cùng file `shop-bridge.js` đã tự động xử lý toàn bộ 3 trường hợp:

1. **Trường hợp 1 (Khách vãng lai / Guest):**
   - Lưu tự động vào LocalStorage riêng biệt trên máy khách (`guest_tpl_{id}`).
   - Hiển thị thanh Header thông báo dùng thử màu cam tím kèm nút "Mua Template Này".
   - Tuyệt đối không lưu vào Supabase.

2. **Trường hợp 2 (User đã đăng nhập nhưng chưa mua / Trial):**
   - Lần đầu tiên vào mở template: Hiển thị 100% dữ liệu gốc mặc định của template (TUYỆT ĐỐI không lấy dữ liệu của khách vãng lai).
   - Khi chỉnh sửa và lưu: Lưu vào LocalStorage riêng biệt theo tài khoản (`user_{userId}_tpl_{id}`).
   - Hiển thị thanh Header thông báo tài khoản thử nghiệm.
   - Tuyệt đối không lưu vào Supabase.

3. **Trường hợp 3 (User đã thanh toán mua bản quyền / Owner):**
   - Tự động nhận diện bản quyền khi mở từ Dashboard (`licensed=true&role=owner`).
   - Đọc 100% dữ liệu từ Supabase PostgreSQL Database qua API `/api/portfolios/:id`.
   - Lưu 100% dữ liệu vào Supabase PostgreSQL Database qua API `/api/portfolios/:id/sync`.
   - Tự động ẩn thanh thông báo dùng thử.
   - Tự động intercept mọi cuộc gọi `localStorage.setItem` của template con để đẩy lên Supabase kể cả khi template con quên gọi `ShopBridge.saveData()`.
