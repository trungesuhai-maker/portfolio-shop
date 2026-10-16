/**
 * INDEPENDENT AI STUDIO PROJECT INTEGRATION CONTRACT
 * 
 * Rules:
 * 1. Each Portfolio Template is an INDEPENDENT AI Studio Project (hosted outside the Shop).
 * 2. The Shop stores ONLY:
 *    - template_id
 *    - demo_url
 *    - origin_url
 *    - schema (editable fields, types, rules)
 *    - version
 *    - metadata (name, author, category, tags, thumbnail)
 * 3. When Customer purchases:
 *    Template A -> Portfolio Instance A1 (john.shop.com) -> Customer Data A1
 *    Template A -> Portfolio Instance A2 (anna.shop.com) -> Customer Data A2
 * 4. Template Master is 100% IMMUTABLE: Editing Instance A1 NEVER touches Template Master or Instance A2.
 */

export type ContractFieldType = 
  | 'string' 
  | 'text' 
  | 'image' 
  | 'color' 
  | 'boolean' 
  | 'number' 
  | 'array' 
  | 'object';

export interface ContractFieldValidation {
  min?: number;
  max?: number;
  pattern?: string;
  allowedExtensions?: string[];
  options?: Array<{ label: string; value: any }>;
}

export interface ContractField {
  key: string;
  type: ContractFieldType;
  label: string;
  description?: string;
  isRequired: boolean;
  defaultValue: any;
  placeholder?: string;
  validation?: ContractFieldValidation;
  group?: 'hero' | 'about' | 'projects' | 'contact' | 'theme' | 'social';
}

export interface ContractMetadata {
  name: string;
  description: string;
  author: {
    name: string;
    email?: string;
    aiStudioProfile?: string;
  };
  category: string; // e.g. "designer", "photographer", "business", "resume"
  tags: string[];
  thumbnail: string;
  gallery?: string[];
  features?: string[];
  supportedDevices?: ('desktop' | 'tablet' | 'mobile')[];
  license?: string;
}

export interface IndependentProjectContract {
  /** Unique identifier of the independent AI Studio project */
  template_id: string;

  /** Semantic version of this template release (e.g. "1.0.0") */
  version: string;

  /** Version of the Integration Contract specification (e.g. "1.0.0") */
  schemaVersion: string;

  /** Public production URL where this independent AI Studio project is deployed */
  origin_url: string;

  /** Public interactive demo URL for live preview in the Shop */
  demo_url: string;

  /** Rich metadata for the Shop listing */
  metadata: ContractMetadata;

  /** The schema defining what fields the template accepts for customer personalization */
  schema: {
    fields: ContractField[];
  };

  /** Default sample data conforming to schema.fields */
  defaultData: Record<string, any>;

  /** Communication and hydration capabilities */
  hydrationProtocol: {
    postMessageSupported: boolean;
    serverHydrationSupported: boolean;
    standaloneFallback: boolean;
  };
}

export interface ContractValidationResult {
  valid: boolean;
  errors: string[];
  warnings?: string[];
  contract?: IndependentProjectContract;
}

/** Payload sent via postMessage to hydrate independent AI Studio template project in iframe */
export interface HydrateMessagePayload {
  type: 'HYDRATE_PORTFOLIO_DATA';
  instanceId: string;
  subdomain: string;
  payload: Record<string, any>;
  origin?: string;
}
