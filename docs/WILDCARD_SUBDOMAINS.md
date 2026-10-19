# Kiến Trúc Wildcard Subdomain & Cloudflare Worker (*.portfolio-shop.com)

Hệ thống cho phép hàng ngàn khách hàng sở hữu website portfolio cá nhân hóa với đường dẫn thương hiệu riêng biệt (ví dụ: `https://john.portfolio-shop.com`, `https://anna.portfolio-shop.com`).

---

## 1. Bản Đồ Tên Miền & Wildcard DNS

- **Main Domain (Shop)**: `portfolio-shop.com` & `www.portfolio-shop.com` -> Nơi bán template, quản lý tài khoản, dashboard.
- **Wildcard Subdomains (Customer Portfolios)**: `*.portfolio-shop.com` -> Được định tuyến qua Cloudflare Edge Worker.

### Cấu hình DNS trên Cloudflare Dashboard:
| Loại (Type) | Tên (Name) | Đích (Target) | Proxy status |
|---|---|---|---|
| A / CNAME | `@` (portfolio-shop.com) | IP Máy chủ Shop hoặc CNAME | Proxied (Cam) |
| CNAME | `*.portfolio-shop.com` | `portfolio-shop.com` | Proxied (Cam) |

---

## 2. Quy Trình 8 Bước của Cloudflare Worker

```
[Khách truy cập] 
       │ 
       ▼ GET https://john.portfolio-shop.com/
┌─────────────────────────────────────────────────────────────┐
│ Cloudflare Worker (*.portfolio-shop.com/*)                  │
│                                                             │
│ 1. Nhận request                                             │
│ 2. Đọc hostname -> "john.portfolio-shop.com"               │
│ 3. Lấy slug -> "john"                                       │
│ 4. Tìm Portfolio Instance -> "inst-john"                    │
│ 5. Tìm Template -> "t1 (Minimal Developer)"                 │
│ 6. Xác định deployment/origin -> "https://portio-origin..." │
│ 7. Lấy Portfolio Data -> custom_data { hero_title, ... }    │
│ 8. Render/Route với Cache Key phân lập                      │
└─────────────────────────────────────────────────────────────┘
       │
       ▼ (200 OK HTML đã hydrate đầy đủ)
[Khách truy cập nhận trang Portfolio của John]
```

---

## 3. Quy Tắc Slug UNIQUE & Đề Xuất Tự Động

- **Định dạng**: 3-63 ký tự, chỉ gồm chữ thường `a-z`, số `0-9` và gạch ngang `-`. Không bắt đầu hoặc kết thúc bằng `-`.
- **Từ khóa bảo lưu (Reserved)**: `www`, `api`, `admin`, `shop`, `app`, `auth`, `login`, `signup`, `static`, `cdn`, `media`, `mail`, `cname`... Không cho phép đăng ký để bảo vệ hệ thống.
- **Quy tắc không cấp trùng**:
  - Nếu khách hàng A đã sở hữu slug `john`, khách hàng B không thể lấy `john`.
  - Hệ thống tự động tính toán và gợi ý các phương án khả dụng ngay lập tức:
    - `john-2`
    - `john-3`
    - `john-pro`
    - `john-dev`
  - Khách hàng có thể tự do chọn bất kỳ slug nào nếu slug đó còn trống.

---

## 4. Bảo Vệ Phân Lập Bộ Nhớ Đệm (Cache Isolation)

> ⚠️ **ĐẶC BIỆT**: Không bao giờ để dữ liệu Portfolio của Customer A bị phục vụ cho Customer B!

### Cơ chế đảm bảo:
1. **Cache Key phân lập**:
   ```javascript
   const cacheKey = new Request(`https://${hostname}/__edge_subdomain_${slug}${pathname}`, {
     headers: {
       'X-Portfolio-Subdomain': slug,
       'Host': hostname
     }
   });
   ```
2. **HTTP Header `Vary: Host`**:
   Bắt buộc mọi tầng trung gian (Cloudflare Edge, Browser Cache, Corporate Proxies) phải phân biệt dựa trên Hostname.
3. **Audit Headers**:
   - `X-Portfolio-Instance-Id`: `inst-john`
   - `X-Portfolio-Subdomain`: `john`
   - `X-Portfolio-Customer-Id`: `usr-1`
   - `CF-Edge-Cache`: `HIT` / `MISS`
4. **Purge Cache tự động**:
   Khi khách hàng cập nhật nội dung hoặc đổi slug trong Portfolio Editor, hệ thống tự động gắn timestamp mới vào cache tag, vô hiệu hóa ngay cache cũ tại Edge.
