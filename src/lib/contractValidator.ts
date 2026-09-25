import { IndependentProjectContract, ContractValidationResult } from '../types/contract';

/**
 * Validates an Independent AI Studio Project Integration Contract.
 * Ensures the project satisfies all constraints to safely connect to the Shop.
 */
export function validateProjectContract(input: any): ContractValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!input || typeof input !== 'object') {
    return { valid: false, errors: ['Contract phải là một JSON object hợp lệ.'] };
  }

  // 1. Validate template_id
  if (!input.template_id || typeof input.template_id !== 'string') {
    errors.push('Thiếu trường "template_id" hoặc template_id không phải là chuỗi.');
  } else if (!/^[a-z0-9-_]+$/i.test(input.template_id)) {
    errors.push('Trường "template_id" chỉ được chứa chữ cái, số, dấu gạch nối (-) và gạch dưới (_).');
  }

  // 2. Validate version
  if (!input.version || typeof input.version !== 'string') {
    errors.push('Thiếu trường "version" (ví dụ: "1.0.0").');
  }

  // 3. Validate origin_url
  if (!input.origin_url || typeof input.origin_url !== 'string') {
    errors.push('Thiếu trường "origin_url" (URL deploy của AI Studio Project độc lập).');
  } else if (!input.origin_url.startsWith('http://') && !input.origin_url.startsWith('https://')) {
    errors.push('"origin_url" phải là một URL web hợp lệ bắt đầu bằng http:// hoặc https://.');
  }

  // 4. Validate demo_url
  if (!input.demo_url || typeof input.demo_url !== 'string') {
    warnings.push('Chưa có "demo_url", hệ thống sẽ tạm dùng "origin_url" làm link demo.');
  }

  // 5. Validate metadata
  if (!input.metadata || typeof input.metadata !== 'object') {
    errors.push('Thiếu trường "metadata" chứa thông tin mô tả dự án.');
  } else {
    if (!input.metadata.name) errors.push('Trường "metadata.name" (Tên Portfolio) là bắt buộc.');
    if (!input.metadata.description) warnings.push('Nên bổ sung "metadata.description" để khách hàng hiểu rõ portfolio.');
    if (!input.metadata.thumbnail) warnings.push('Nên có "metadata.thumbnail" để hiển thị card trong Shop.');
  }

  // 6. Validate schema.fields
  if (!input.schema || !Array.isArray(input.schema.fields)) {
    errors.push('Thiếu trường "schema.fields" (danh sách các trường có thể chỉnh sửa).');
  } else {
    input.schema.fields.forEach((field: any, idx: number) => {
      if (!field.key) errors.push(`Field #${idx + 1} thiếu thuộc tính "key".`);
      if (!field.type) errors.push(`Field #${idx + 1} (${field.key || 'unknown'}) thiếu "type".`);
      if (!field.label) warnings.push(`Field #${idx + 1} (${field.key || 'unknown'}) thiếu nhãn "label".`);
    });
  }

  // 7. Validate defaultData
  if (!input.defaultData || typeof input.defaultData !== 'object') {
    warnings.push('Nên cung cấp "defaultData" để portfolio hiển thị mẫu khi chưa có dữ liệu khách hàng.');
  }

  const valid = errors.length === 0;

  return {
    valid,
    errors,
    warnings,
    contract: valid ? (input as IndependentProjectContract) : undefined,
  };
}

/**
 * 4 Pre-configured Independent AI Studio Projects specified in Prompt 10:
 * - Project A: Designer Portfolio
 * - Project B: Photographer Portfolio
 * - Project C: Business Portfolio
 * - Project D: Resume Portfolio
 */
export const INDEPENDENT_PROJECT_PRESETS: Record<string, IndependentProjectContract> = {
  'project-a-designer': {
    template_id: 'project-a-designer',
    version: '1.0.0',
    schemaVersion: '1.0.0',
    origin_url: 'https://designer-portfolio.ai.studio.run.app',
    demo_url: 'https://designer-demo.portfolio-shop.com',
    metadata: {
      name: 'Project A: Designer Portfolio',
      description: 'Chuyên biệt cho UI/UX Designer, Art Director & Visual Creator với canvas tương tác và bento showcase.',
      author: {
        name: 'Studio Minimal Lab',
        email: 'creators@studiominimal.io',
        aiStudioProfile: 'https://ai.studio/creators/studiominimal'
      },
      category: 'designer',
      tags: ['Designer', 'UI/UX', 'Figma', 'Interactive', 'Bento'],
      thumbnail: 'https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?w=800&auto=format&fit=crop&q=80',
      gallery: [
        'https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?w=800&auto=format&fit=crop&q=80',
        'https://images.unsplash.com/photo-1542744094-24638eff58bb?w=800&auto=format&fit=crop&q=80'
      ],
      features: ['Interactive Bento Grid', 'Figma Project Importer', 'Dark/Light Studio Mode', 'Case Study Viewer'],
      supportedDevices: ['desktop', 'tablet', 'mobile'],
      license: 'Commercial License (Per Customer Instance)'
    },
    schema: {
      fields: [
        {
          key: 'hero_title',
          type: 'string',
          label: 'Họ & Tên / Studio Brand',
          isRequired: true,
          defaultValue: 'Elena Rostova',
          placeholder: 'VD: Elena Rostova',
          group: 'hero'
        },
        {
          key: 'hero_subtitle',
          type: 'text',
          label: 'Chức danh & Lĩnh vực',
          isRequired: true,
          defaultValue: 'Senior Product Designer & Design Systems Lead at San Francisco',
          group: 'hero'
        },
        {
          key: 'design_philosophy',
          type: 'text',
          label: 'Triết lý Thiết kế',
          isRequired: false,
          defaultValue: 'Thiết kế không chỉ là thẩm mỹ thị giác mà là cách một giải pháp số vận hành liền mạch trong cuộc sống người dùng.',
          group: 'about'
        },
        {
          key: 'primary_color',
          type: 'color',
          label: 'Màu Nhấn (Accent Color)',
          isRequired: false,
          defaultValue: '#6366f1',
          group: 'theme'
        },
        {
          key: 'featured_works',
          type: 'array',
          label: 'Dự Án Nổi Bật',
          isRequired: false,
          defaultValue: [
            { title: 'FinTech SuperApp Redesign', tag: 'Mobile & UI/UX', year: '2025' },
            { title: 'HealthOS Design System', tag: 'Multi-platform Systems', year: '2024' }
          ],
          group: 'projects'
        }
      ]
    },
    defaultData: {
      hero_title: 'Elena Rostova',
      hero_subtitle: 'Senior Product Designer & Design Systems Lead at San Francisco',
      design_philosophy: 'Thiết kế không chỉ là thẩm mỹ thị giác mà là cách một giải pháp số vận hành liền mạch trong cuộc sống người dùng.',
      primary_color: '#6366f1',
      featured_works: [
        { title: 'FinTech SuperApp Redesign', tag: 'Mobile & UI/UX', year: '2025' },
        { title: 'HealthOS Design System', tag: 'Multi-platform Systems', year: '2024' }
      ]
    },
    hydrationProtocol: {
      postMessageSupported: true,
      serverHydrationSupported: true,
      standaloneFallback: true
    }
  },

  'project-b-photographer': {
    template_id: 'project-b-photographer',
    version: '1.0.0',
    schemaVersion: '1.0.0',
    origin_url: 'https://photographer-portfolio.ai.studio.run.app',
    demo_url: 'https://photographer-demo.portfolio-shop.com',
    metadata: {
      name: 'Project B: Photographer Portfolio',
      description: 'Gallery toàn màn hình tối ưu hoá tốc độ tải ảnh RAW/WebP, EXIF data viewer và book lịch chụp hình.',
      author: {
        name: 'Aperture AI Works',
        email: 'contact@aperture.ai',
        aiStudioProfile: 'https://ai.studio/creators/aperture'
      },
      category: 'photographer',
      tags: ['Photography', 'Gallery', 'EXIF', 'Visual Art', 'Booking'],
      thumbnail: 'https://images.unsplash.com/photo-1452587925148-ce544e77e70d?w=800&auto=format&fit=crop&q=80',
      gallery: [
        'https://images.unsplash.com/photo-1452587925148-ce544e77e70d?w=800&auto=format&fit=crop&q=80',
        'https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?w=800&auto=format&fit=crop&q=80'
      ],
      features: ['Full-bleed Masonry Grid', 'EXIF Metadata Inspector', 'Client Proofing Vault', 'Booking Calendar'],
      supportedDevices: ['desktop', 'tablet', 'mobile'],
      license: 'Commercial License (Per Customer Instance)'
    },
    schema: {
      fields: [
        {
          key: 'photographer_name',
          type: 'string',
          label: 'Nghệ danh Nhiếp ảnh gia',
          isRequired: true,
          defaultValue: 'Marcus Vance',
          group: 'hero'
        },
        {
          key: 'tagline',
          type: 'string',
          label: 'Khẩu hiệu Nghệ thuật',
          isRequired: true,
          defaultValue: 'Ghi lại những khoảnh khắc tĩnh lặng giữa nhịp sống chuyển động',
          group: 'hero'
        },
        {
          key: 'specialty',
          type: 'string',
          label: 'Thể loại Chuyên môn',
          isRequired: false,
          defaultValue: 'Architectural & Portrait Documentary',
          group: 'about'
        },
        {
          key: 'booking_email',
          type: 'string',
          label: 'Email Nhận Booking',
          isRequired: true,
          defaultValue: 'booking@marcusvance.com',
          group: 'contact'
        },
        {
          key: 'gallery_album_cover',
          type: 'image',
          label: 'Ảnh Bìa Bộ Sưu Tập Chính',
          isRequired: false,
          defaultValue: 'https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?w=1200&auto=format&fit=crop&q=80',
          group: 'projects'
        }
      ]
    },
    defaultData: {
      photographer_name: 'Marcus Vance',
      tagline: 'Ghi lại những khoảnh khắc tĩnh lặng giữa nhịp sống chuyển động',
      specialty: 'Architectural & Portrait Documentary',
      booking_email: 'booking@marcusvance.com',
      gallery_album_cover: 'https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?w=1200&auto=format&fit=crop&q=80'
    },
    hydrationProtocol: {
      postMessageSupported: true,
      serverHydrationSupported: true,
      standaloneFallback: true
    }
  }
};
