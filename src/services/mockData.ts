import { Template, Category, TemplateField, PortfolioInstance } from '../types';

export const MOCK_PORTFOLIOS: PortfolioInstance[] = [
  {
    id: 'inst-john',
    user_id: 'usr-1',
    template_id: 'project-a-designer',
    name: 'John Doe Engineering',
    subdomain: 'john',
    status: 'published',
    created_at: '2026-09-01T10:00:00Z',
    updated_at: '2026-09-16T15:00:00Z',
    custom_data: {
      hero_title: 'John Doe',
      hero_subtitle: 'Principal Full Stack & Distributed Systems Engineer',
      design_philosophy: 'Simplicity is subtracting the obvious and adding the meaningful.',
      primary_color: '#4f46e5'
    },
    seo: {
      title: 'John Doe — Principal Full Stack & Distributed Systems Engineer',
      description: 'Senior Software Engineer specializing in scalable edge systems, TypeScript, and microservice architectures.',
      ogImage: 'https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?w=1200&h=630&fit=crop',
      favicon: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=64&h=64&fit=crop',
      canonical: 'https://john.portfolio-shop.com',
      keywords: 'fullstack engineer, edge computing, portfolio, react'
    }
  },
  {
    id: 'inst-anna',
    user_id: 'usr-2',
    template_id: 'project-b-photographer',
    name: 'Anna Taylor Visual Design',
    subdomain: 'anna',
    status: 'published',
    created_at: '2026-09-05T14:20:00Z',
    updated_at: '2026-09-16T12:00:00Z',
    custom_data: {
      hero_title: 'Anna Taylor',
      hero_subtitle: 'Lead Visual Designer & Creative Art Director',
      design_philosophy: 'Typography speaks louder than words when shaped with clear intention.',
      primary_color: '#06b6d4'
    },
    seo: {
      title: 'Anna Taylor — Lead Visual Designer & Creative Art Director',
      description: 'Award-winning Visual Designer and Art Director creating memorable digital identities, brand experiences, and design systems.',
      ogImage: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=1200&h=630&fit=crop',
      favicon: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=64&h=64&fit=crop',
      canonical: 'https://anna.portfolio-shop.com',
      keywords: 'visual designer, creative director, branding, ui/ux'
    }
  }
];

export const CATEGORIES: Category[] = [
  { id: 'c1', name: 'Software Developer', slug: 'software-developer', description: 'Portfolios for programmers, software engineers, and backend/frontend developers.' },
  { id: 'c2', name: 'Creative Designer', slug: 'creative-designer', description: 'Visual-heavy portfolios for UI/UX, product, and graphic designers.' },
  { id: 'c3', name: 'Photographer & Video Creator', slug: 'photographer-videographer', description: 'High-resolution showcases for photographers, filmmakers, and motion artists.' },
  { id: 'c4', name: 'Architect & 3D Artist', slug: 'architect-3d-artist', description: 'Spatial, interior, architectural design and 3D CGI portfolio templates.' },
  { id: 'c5', name: 'Marketing & Business Consultant', slug: 'marketing-consultant', description: 'Executive portfolios for marketing directors, growth hackers, and business consultants.' },
  { id: 'c6', name: 'Content Creator & Copywriter', slug: 'content-creator', description: 'Modern personal branding and portfolio for writers, journalists, and creators.' }
];

const generateMockFields = (): TemplateField[] => [
  {
    id: 'f1',
    key: 'hero_title',
    type: 'string',
    label: 'Hero Title',
    isRequired: true,
    defaultValue: 'Hello, I am a Professional'
  },
  {
    id: 'f2',
    key: 'hero_subtitle',
    type: 'text',
    label: 'Hero Subtitle',
    isRequired: false,
    defaultValue: 'Welcome to my portfolio.'
  }
];

export const MOCK_TEMPLATES: Template[] = [
  {
    id: 't1',
    name: 'DevFolio Pro',
    slug: 'devfolio-pro',
    description: 'A clean, dark-mode optimized template for software engineers to showcase projects, skills, and GitHub contributions.',
    categoryId: 'c1',
    categoryName: 'Software Developer',
    price: 49,
    salePrice: 39,
    thumbnail: 'bg-pastel-blue',
    gallery: ['bg-pastel-blue', 'bg-slate-100'],
    demoUrl: 'https://demo.shop.com/devfolio',
    originUrl: 'https://ai.studio.com/project/devfolio-123',
    version: '1.0.0',
    schemaVersion: '1.0.0',
    seo: {
      titleTemplate: '%s | DevFolio',
      description: 'Default devfolio description'
    },
    status: 'published',
    editableFields: generateMockFields(),
    defaultData: {
      hero_title: 'John Doe',
      hero_subtitle: 'Full Stack Engineer'
    },
    tags: ['React', 'Dark Mode', 'GitHub'],
    isFeatured: true,
    isPopular: true,
    isNew: false,
    bgColorClass: 'bg-pastel-blue',
  },
  {
    id: 't2',
    name: 'Studio Minimal',
    slug: 'studio-minimal',
    description: 'Ultra-minimalist aesthetic focusing purely on typography and large imagery. Perfect for art directors and UI/UX designers.',
    categoryId: 'c2',
    categoryName: 'Creative Designer',
    price: 59,
    thumbnail: 'bg-pastel-pink',
    gallery: ['bg-pastel-pink', 'bg-slate-100'],
    demoUrl: 'https://demo.shop.com/studio',
    originUrl: 'https://ai.studio.com/project/studio-456',
    version: '1.1.0',
    schemaVersion: '1.0.0',
    seo: {
      titleTemplate: '%s | Studio Minimal',
      description: 'Minimal portfolio'
    },
    status: 'published',
    editableFields: generateMockFields(),
    defaultData: {
      hero_title: 'Jane Smith',
      hero_subtitle: 'Art Director & Designer'
    },
    tags: ['Minimal', 'Typography', 'Gallery'],
    isFeatured: true,
    isPopular: false,
    isNew: true,
    bgColorClass: 'bg-pastel-pink',
  },
  {
    id: 'tpl-manisha-creative',
    name: 'Manisha Roy — Creative Art Portfolio',
    slug: 'manisha-creative',
    description: 'Portfolio hiện đại dành cho Designer, 3D Artist và Creative Director với phong cách tối giản thanh lịch, hỗ trợ Try-Before-You-Buy và tích hợp tên miền riêng.',
    categoryId: 'c2',
    categoryName: 'Creative Designer',
    price: 39,
    salePrice: 29,
    thumbnail: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=800&auto=format&fit=crop&q=80',
    gallery: ['https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=800&auto=format&fit=crop&q=80', 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=1200&auto=format&fit=crop&q=80'],
    demoUrl: 'https://ais-pre-4o7j6kwzqzhzqv3roacr3c-395109314000.asia-southeast1.run.app',
    originUrl: 'https://ais-pre-4o7j6kwzqzhzqv3roacr3c-395109314000.asia-southeast1.run.app',
    version: '1.0.0',
    schemaVersion: '1.0.0',
    seo: {
      titleTemplate: '%s | Manisha Roy Creative Portfolio',
      description: 'Creative portfolio for designers and visual artists'
    },
    status: 'published',
    editableFields: generateMockFields(),
    defaultData: {
      hero_title: 'Manisha Roy',
      hero_subtitle: 'Branding & Identity • 3D Graphics • Typography'
    },
    tags: ['Creative', '3D Graphics', 'Branding', 'Typography'],
    isFeatured: true,
    isPopular: true,
    isNew: true,
    bgColorClass: 'bg-amber-50',
  },
  {
    id: 'project-a-designer',
    name: 'Project A: Designer Portfolio',
    slug: 'project-a-designer',
    description: 'Bản mẫu portfolio chuyên sâu cho Product Designer & Systems Lead, tích hợp tương tác chuyển động mượt mà và hỗ trợ tên miền riêng.',
    categoryId: 'c2',
    categoryName: 'Creative Designer',
    price: 69,
    salePrice: 49,
    thumbnail: 'https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?w=800&auto=format&fit=crop&q=80',
    gallery: ['https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?w=800&auto=format&fit=crop&q=80'],
    demoUrl: 'https://ais-dev-kija3nmgno6laisnyal2cs-395109314000.asia-southeast1.run.app',
    originUrl: 'https://ais-dev-kija3nmgno6laisnyal2cs-395109314000.asia-southeast1.run.app',
    version: '1.0.0',
    schemaVersion: '1.0.0',
    status: 'published',
    tags: ['Design System', 'Figma', 'UI/UX'],
    bgColorClass: 'bg-indigo-50',
    isFeatured: true,
    isPopular: true,
    isNew: true,
    seo: {
      titleTemplate: '%s | Project A: Designer Portfolio',
      description: 'Designer Portfolio Template'
    },
    editableFields: generateMockFields(),
    defaultData: {
      hero_title: 'John Doe',
      hero_subtitle: 'Principal Product Designer & Systems Lead'
    }
  },
  {
    id: 'project-b-photographer',
    name: 'Project B: Photographer & Visual Portfolio',
    slug: 'project-b-photographer',
    description: 'Portfolio hình ảnh độ nét cao tối ưu cho Visual Designer, Nhiếp ảnh gia nghệ thuật và Creative Director.',
    categoryId: 'c3',
    categoryName: 'Photographer & Video Creator',
    price: 49,
    thumbnail: 'https://images.unsplash.com/photo-1452587925148-ce544e77e70d?w=800&auto=format&fit=crop&q=80',
    gallery: ['https://images.unsplash.com/photo-1452587925148-ce544e77e70d?w=800&auto=format&fit=crop&q=80'],
    demoUrl: 'https://portio-demo-photographer.run.app',
    originUrl: 'https://portio-origin-photographer.run.app',
    version: '1.0.0',
    schemaVersion: '1.0.0',
    status: 'published',
    tags: ['Photography', 'Visual Arts', 'Minimal'],
    bgColorClass: 'bg-stone-50',
    isFeatured: true,
    isPopular: false,
    isNew: true,
    seo: {
      titleTemplate: '%s | Photographer Portfolio',
      description: 'Photographer Portfolio Template'
    },
    editableFields: generateMockFields(),
    defaultData: {
      hero_title: 'Anna Taylor',
      hero_subtitle: 'Senior Art Director & Brand Identity Architect'
    }
  },
  {
    id: 'tpl-1790215398622',
    name: 'Cookie check',
    slug: 'cookie-check',
    description: 'Mẫu Portfolio cá nhân hiện đại tối ưu hiệu năng cao, thiết kế độc quyền xây dựng trên AI Studio.',
    categoryId: 'c2',
    categoryName: 'Creative Designer',
    price: 490000,
    salePrice: 390000,
    thumbnail: 'https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?w=800&auto=format&fit=crop&q=80',
    gallery: ['https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?w=800&auto=format&fit=crop&q=80'],
    demoUrl: 'https://ais-dev-kija3nmgno6laisnyal2cs-395109314000.asia-southeast1.run.app',
    originUrl: 'https://ais-dev-kija3nmgno6laisnyal2cs-395109314000.asia-southeast1.run.app',
    version: '1.0.0',
    schemaVersion: '1.0.0',
    status: 'published',
    tags: ['UI/UX', 'Figma', 'Interactive', 'Bento Grid', 'Design System'],
    bgColorClass: 'bg-slate-100',
    isNew: true,
    isPopular: true,
    isFeatured: true,
    seo: {
      titleTemplate: '%s | Cookie check',
      description: 'Mẫu Portfolio cá nhân hiện đại tối ưu hiệu năng cao, thiết kế độc quyền xây dựng trên AI Studio.'
    },
    editableFields: [
      {
        id: 'f-1790215366288-1',
        key: 'ho_ten_studio_brand',
        label: 'Họ & Tên / Studio Brand',
        type: 'string',
        isRequired: false,
        defaultValue: 'Action required to load your app',
        orderIndex: 1
      },
      {
        id: 'f-1790215366288-2',
        key: 'chuc_danh_linh_vuc',
        label: 'Chức danh & Lĩnh vực',
        type: 'string',
        isRequired: false,
        defaultValue: 'Senior Product Designer & Art Director',
        orderIndex: 2
      },
      {
        id: 'f-1790215366288-3',
        key: 'triet_ly_thiet_ke_gioi_thieu',
        label: 'Triết lý Thiết kế / Giới thiệu',
        type: 'text',
        isRequired: false,
        defaultValue: 'Mẫu Portfolio cá nhân hiện đại tối ưu hiệu năng cao, thiết kế độc quyền xây dựng trên AI Studio.',
        orderIndex: 3
      },
      {
        id: 'f-1790215366288-4',
        key: 'mau_nhan_accent_color',
        label: 'Màu Nhấn (Accent Color)',
        type: 'color',
        isRequired: false,
        defaultValue: '#4f46e5',
        orderIndex: 4
      },
      {
        id: 'f-1790215366288-5',
        key: 'du_an_noi_bat',
        label: 'Dự Án Nổi Bật',
        type: 'string',
        isRequired: false,
        defaultValue: 'UI/UX, Figma, Interactive',
        orderIndex: 5
      }
    ],
    defaultData: {
      ho_ten_studio_brand: 'Action required to load your app',
      chuc_danh_linh_vuc: 'Senior Product Designer & Art Director',
      triet_ly_thiet_ke_gioi_thieu: 'Mẫu Portfolio cá nhân hiện đại tối ưu hiệu năng cao, thiết kế độc quyền xây dựng trên AI Studio.',
      mau_nhan_accent_color: '#4f46e5',
      du_an_noi_bat: 'UI/UX, Figma, Interactive'
    }
  }
];
