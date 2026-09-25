export interface Template {
  id: string;
  name: string;
  slug: string;
  description: string;
  categoryId: string;
  price: number;
  salePrice?: number;
  thumbnail: string; // URL to the main preview image
  gallery: string[]; // URLs to additional preview images
  demoUrl: string; // URL to a live demo of the template
  originUrl: string; // The URL of the published AI Studio project (the actual template app)
  version: string;
  schemaVersion: string;
  seo: {
    titleTemplate: string;
    description: string;
  };
  status: 'draft' | 'published' | 'archived';
  
  // Stored as JSON in DB, matching the Contract's fields
  editableFields: TemplateField[];
  defaultData: Record<string, any>;
  
  // Derived or joined fields
  categoryName?: string;
  tags?: string[];
  isFeatured?: boolean;
  isPopular?: boolean;
  isNew?: boolean;
  badge?: string;
  currency?: 'USD' | 'VND';
  bgColorClass?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface TemplateVersion {
  id: string;
  templateId: string;
  version: string;
  schemaVersion: string;
  originUrl: string;
  releaseNotes?: string;
  createdAt: string;
}

export interface TemplateField {
  id: string;
  key: string;
  type: 'string' | 'text' | 'image' | 'boolean' | 'number' | 'array' | 'object' | 'color';
  label: string;
  description?: string;
  isRequired: boolean;
  defaultValue?: any;
  options?: any[]; // For enums/selects
  orderIndex?: number;
}

export interface TemplateImage {
  id: string;
  templateId: string;
  url: string;
  type: 'thumbnail' | 'gallery' | 'feature';
  orderIndex: number;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string;
  icon?: string;
}

/**
 * TEMPLATE INTEGRATION CONTRACT
 * 
 * This contract defines how external AI Studio template projects communicate 
 * with the Portfolio Shop. Templates must conform to this schema to be 
 * dynamically hydrated with user data from the shop.
 */
export interface TemplateIntegrationContract {
  /** The version of the schema contract being used (e.g. "1.0.0") */
  schemaVersion: string;
  
  /** The specific version of this template */
  templateVersion: string;
  
  /** Template metadata */
  metadata: {
    name: string;
    description: string;
  };
  
  /** 
   * The schema defining what editable fields this template exposes.
   * The Shop will use this to generate forms for the user.
   */
  fields: Omit<TemplateField, 'id'>[];
  
  /** 
   * Sample/Fallback data conforming to the defined fields.
   * Used for initial render before user provides data.
   */
  defaultData: Record<string, any>;
  
  /** Default SEO settings for the template */
  seo: {
    titleTemplate: string; 
    defaultDescription: string;
  };
}

export interface CustomerPortfolioSeo {
  title?: string;
  seoTitle?: string;
  description?: string;
  seoDescription?: string;
  ogImage?: string;
  favicon?: string;
  canonical?: string;
  keywords?: string;
}

export type StorageCategory = 
  | 'template_thumbnails' 
  | 'template_gallery' 
  | 'customer_portfolio' 
  | 'avatar' 
  | 'cover' 
  | 'project_images';

export interface StorageFile {
  id: string;
  name: string;
  category: StorageCategory;
  url: string;
  size: number;
  originalSize?: number;
  savedBytes?: number;
  reductionPercentage?: number;
  mimeType: string;
  width?: number;
  height?: number;
  uploadedBy: string;
  storageProvider?: 'cloudflare_r2' | 'local' | 'external' | string;
  r2Key?: string;
  isVideo?: boolean;
  posterUrl?: string;
  duration?: number;
  createdAt: string;
}

export interface ShopSettings {
  shopName: string;
  tagline?: string;
  logo: string;
  favicon: string;
  
  contact: {
    email: string;
    phone: string;
    address: string;
    workingHours: string;
  };
  
  socialLinks: {
    twitter?: string;
    github?: string;
    linkedin?: string;
    discord?: string;
    facebook?: string;
    youtube?: string;
  };
  
  footer: {
    copyright: string;
    copyrightText?: string;
    aboutText: string;
    links: Array<{ label: string; url: string }>;
  };
  
  brandColors: {
    primary: string;
    accent: string;
    background: string;
    text: string;
  };
  
  homepage: {
    heroBadge: string;
    heroTitle: string;
    heroSubtitle: string;
    heroImage: string;
    ctaHeading: string;
    ctaSubtitle: string;
    ctaButtonText: string;
    ctaButtonLink: string;
  };
  
  seo: {
    metaTitle: string;
    metaDescription: string;
    keywords: string;
    ogImage: string;
    canonicalUrl: string;
    canonical?: string;
    robotsIndexing: boolean;
    robotsCustom?: string;
    sitemapEnabled: boolean;
  };
  
  analytics: {
    googleAnalyticsId?: string;
    facebookPixelId?: string;
    googleTagManagerId?: string;
    customHeadScript?: string;
  };
  
  maintenance: {
    enabled: boolean;
    title: string;
    message: string;
    allowAdminBypass: boolean;
  };

  maintenanceMode?: boolean;

  currency: string;
  sandboxMode: boolean;
  enablePayOS: boolean;
  enableVNPay: boolean;
  enableStripe: boolean;
}

export interface PortfolioInstance {
  id: string;
  user_id: string;
  template_id: string;
  name: string;
  subdomain: string;
  status: 'draft' | 'published';
  created_at: string;
  updated_at: string;
  
  // The actual user data mapped to the Template's fields
  custom_data?: Record<string, any>; 
  
  // Customer-specific SEO configuration
  seo?: CustomerPortfolioSeo;

  // A snapshot of the template's schema at the time of creation
  template_snapshot?: TemplateIntegrationContract; 
}

export interface Order {
  id: string;
  user_id: string;
  template_id: string;
  amount: number;
  status: 'pending' | 'completed' | 'failed';
  created_at: string;
}

