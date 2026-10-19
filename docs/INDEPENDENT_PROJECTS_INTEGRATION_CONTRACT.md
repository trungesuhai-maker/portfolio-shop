# QUY TẮC CỐT LÕI: KẾT NỐI CÁC PORTFOLIO PROJECT ĐỘC LẬP TỪ AI STUDIO

> **Tài liệu đặc tả kiến trúc tích hợp hệ thống (Integration Contract Specification v1.0.0)**

---

## 1. Nguyên Tắc Cốt Lõi (Core Principles)

1. **Mỗi Portfolio Template là một AI Studio Project Riêng Biệt**:
   - **Project A**: Designer Portfolio (`designer-portfolio.ai.studio.run.app`)
   - **Project B**: Photographer Portfolio (`photographer-portfolio.ai.studio.run.app`)
   - **Project C**: Business Portfolio (`business-portfolio.ai.studio.run.app`)
   - **Project D**: Resume Portfolio (`resume-portfolio.ai.studio.run.app`)
   - Các project này **HOÀN TOÀN KHÔNG** nằm trong source code của Shop project.

2. **Dữ Liệu Shop Lưu Trữ (Shop Storage Boundary)**:
   Shop chỉ đóng vai trò là Marketplace & Orchestrator, chỉ lưu các thông số định danh sau:
   - `template_id`: Mã định danh duy nhất của Template (vd: `project-a-designer`).
   - `demo_url`: Đường dẫn xem thử tương tác trực tiếp (interactive sandbox).
   - `origin_url`: Đường dẫn host ứng dụng AI Studio Project độc lập (production deployment).
   - `schema`: Định nghĩa danh sách các trường có thể tùy biến (editable fields, types, rules).
   - `version`: Phiên bản phát hành của template (vd: `1.0.0`, `1.1.0`).
   - `metadata`: Tên, mô tả, tác giả, danh mục, tags, hình ảnh thumbnail, tính năng.

---

## 2. Quy Trình Mua & Phân Lập Dữ Liệu Khách Hàng (Customer Isolation)

```
[Master Template A (Read-only, Immutable)]
      │
      ├──> Khi Customer John mua Template A:
      │      - Tạo Portfolio Instance A1 (ID: inst-john)
      │      - Cấp Subdomain: john.portfolio-shop.com
      │      - Dữ liệu độc lập: Customer Data A1 (hero_title: "John Doe", ...)
      │      - Lưu Template Snapshot A (v1.0.0)
      │
      └──> Khi Customer Anna mua Template A:
             - Tạo Portfolio Instance A2 (ID: inst-anna)
             - Cấp Subdomain: anna.portfolio-shop.com
             - Dữ liệu độc lập: Customer Data A2 (hero_title: "Anna Taylor", ...)
             - Lưu Template Snapshot A (v1.0.0)
```

### Bảo Đảm Tính Bất Biến Của Master Template:
- Khi John thay đổi `hero_title` thành `"John Doe - Cloud Architect"`, hệ thống **CHỈ** cập nhật `instances['inst-john'].custom_data`.
- **Template Master A hoàn toàn KHÔNG bị thay đổi**.
- **Portfolio Instance A2 của Anna hoàn toàn KHÔNG bị ảnh hưởng**.
- Hai khách hàng dùng chung một template gốc nhưng dữ liệu và subdomain phân lập 100%.

---

## 3. Bản Hợp Đồng Tích Hợp (Integration Contract JSON Schema)

Bất kỳ AI Studio Project mới nào muốn bán trên Shop chỉ cần triển khai file `portfolio-contract.json` (hoặc endpoint `GET /api/portfolio-contract`):

```json
{
  "template_id": "project-a-designer",
  "version": "1.0.0",
  "schemaVersion": "1.0.0",
  "origin_url": "https://designer-portfolio.ai.studio.run.app",
  "demo_url": "https://designer-demo.portfolio-shop.com",
  "metadata": {
    "name": "Project A: Designer Portfolio",
    "description": "Chuyên biệt cho UI/UX Designer, Art Director & Visual Creator.",
    "author": {
      "name": "Studio Minimal Lab",
      "email": "creators@studiominimal.io"
    },
    "category": "designer",
    "tags": ["Designer", "UI/UX", "Bento", "Interactive"],
    "thumbnail": "https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?w=800",
    "features": ["Bento Grid", "Figma Importer", "Dark/Light Mode"]
  },
  "schema": {
    "fields": [
      {
        "key": "hero_title",
        "type": "string",
        "label": "Họ & Tên / Studio Brand",
        "isRequired": true,
        "defaultValue": "Elena Rostova"
      },
      {
        "key": "hero_subtitle",
        "type": "text",
        "label": "Chức danh & Lĩnh vực",
        "isRequired": true,
        "defaultValue": "Senior Product Designer & Systems Lead"
      },
      {
        "key": "primary_color",
        "type": "color",
        "label": "Màu Nhấn (Accent Color)",
        "isRequired": false,
        "defaultValue": "#6366f1"
      }
    ]
  },
  "defaultData": {
    "hero_title": "Elena Rostova",
    "hero_subtitle": "Senior Product Designer & Systems Lead",
    "primary_color": "#6366f1"
  },
  "hydrationProtocol": {
    "postMessageSupported": true,
    "serverHydrationSupported": true,
    "standaloneFallback": true
  }
}
```

---

## 4. Giao Thức Hydration Tại AI Studio Project Độc Lập

Bên trong AI Studio Project độc lập, lập trình viên nhúng Hook `usePortfolioData`:

```typescript
// usePortfolioData.ts
import { useState, useEffect } from 'react';

export function usePortfolioData(defaultData: any) {
  const [data, setData] = useState(() => {
    // 1. Kiểm tra nếu có dữ liệu server injection từ Cloudflare Edge Worker
    if (typeof window !== 'undefined' && (window as any).__PORTFOLIO_DATA__) {
      return (window as any).__PORTFOLIO_DATA__;
    }
    return defaultData;
  });

  useEffect(() => {
    // 2. Lắng nghe postMessage khi render trong iframe (Preview / Editor tại Shop)
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'HYDRATE_PORTFOLIO_DATA' && event.data?.payload) {
        setData((prev: any) => ({ ...prev, ...event.data.payload }));
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  return data;
}
```

---

## 5. Quy Trình 3 Bước Đăng Ký Dự Án Mới Vào Shop

1. **Bước 1 — Phát triển Portfolio trong AI Studio**:
   - Tạo AI Studio Project mới (VD: *Project E: 3D Game Dev Portfolio*).
   - Tạo file `portfolio-contract.json` theo chuẩn Schema trên.
   - Deploy project và lấy `origin_url`.

2. **Bước 2 — Đăng ký vào Shop Admin**:
   - Truy cập trang **Admin > Kho Template > Đăng ký AI Studio Project Mới**.
   - Nhập `origin_url` hoặc dán mã JSON contract.
   - Nhấn **"Kiểm tra & Xác thực Contract"**: Hệ thống tự động kiểm tra cú pháp, danh sách trường và kết nối.

3. **Bước 3 — Phát hành lên Marketplace**:
   - Nhấn **"Đăng ký Template"**.
   - Template mới xuất hiện ngay lập tức trên Marketplace với đầy đủ tính năng mua, tạo instance, cấp subdomain và phân lập dữ liệu!
