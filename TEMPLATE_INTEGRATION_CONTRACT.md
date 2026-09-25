# Template Integration Contract

This document outlines the standard protocol for external AI Studio projects (Templates) to integrate with the Portfolio Shop.

Since the Shop **does not store or manage the source code** of the templates, we rely on a standardized metadata schema and a communication protocol (Contract) to inject dynamic data from the Shop into the Template.

## 1. The Integration Flow

1. **Discovery & Registration**: A template developer publishes their project in AI Studio and registers the URL (Origin URL) and their `template.json` schema with the Shop.
2. **Schema Parsing**: The Shop parses `template.json` to understand what fields (text, images, colors, arrays) the template supports.
3. **User Customization**: A user in the Shop buys/uses the template. The Shop dynamically generates a form based on the template's schema.
4. **Hydration (Data Injection)**: When the user previews or publishes their customized portfolio, the Shop hosts an `iframe` pointing to the template's Origin URL and injects the user's data using the `window.postMessage` API.

## 2. The `template.json` Schema

Every template MUST expose a `template.json` file (or embed it in their root metadata) that strictly follows this interface:

```typescript
interface TemplateIntegrationContract {
  schemaVersion: string; // e.g. "1.0.0"
  templateVersion: string; // e.g. "2.1.0"
  
  metadata: {
    name: string;
    description: string;
  };
  
  // The fields the template expects the user to fill out
  fields: Array<{
    key: string;         // Unique key for the field (e.g. "hero_title")
    type: 'string' | 'text' | 'image' | 'boolean' | 'number' | 'array' | 'object' | 'color';
    label: string;       // Human readable label (e.g. "Hero Section Title")
    description?: string;
    isRequired: boolean;
    defaultValue?: any;
    options?: any[];     // For enums or select fields
  }>;
  
  // A complete mock dataset conforming to the 'fields' schema.
  // The template must be able to render using only this data if no user data is provided.
  defaultData: Record<string, any>;
  
  seo: {
    titleTemplate: string; // e.g. "%s | Developer Portfolio"
    defaultDescription: string;
  };
}
```

## 3. Hydration Protocol (Receiving Data)

The template must listen for a specific `postMessage` event to receive the user's data payload from the Shop.

### Implementation inside the Template (React Example):

```typescript
import { useEffect, useState } from 'react';

export function usePortfolioData(defaultData) {
  const [data, setData] = useState(defaultData);

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      // Validate origin if necessary (e.g., event.origin === 'https://shop.com')
      if (event.data?.type === 'HYDRATE_PORTFOLIO_DATA') {
        setData(event.data.payload);
      }
    };

    window.addEventListener('message', handleMessage);
    
    // Notify the parent (Shop) that the template is ready to receive data
    if (window.parent !== window) {
      window.parent.postMessage({ type: 'TEMPLATE_READY' }, '*');
    }

    return () => window.removeEventListener('message', handleMessage);
  }, []);

  return data;
}
```

### Implementation inside the Shop (Injection Example):

```typescript
const iframeRef = useRef<HTMLIFrameElement>(null);

// When the iframe says it's ready, send the user's custom data
useEffect(() => {
  const handleReady = (event: MessageEvent) => {
    if (event.data?.type === 'TEMPLATE_READY' && iframeRef.current) {
      iframeRef.current.contentWindow?.postMessage({
        type: 'HYDRATE_PORTFOLIO_DATA',
        payload: userCustomData
      }, '*'); // In production, replace '*' with the template's exact Origin URL
    }
  };
  window.addEventListener('message', handleReady);
  return () => window.removeEventListener('message', handleReady);
}, [userCustomData]);
```

## 4. Constraints

1. **No Backend Dependency**: Templates should ideally be static Single Page Applications (SPAs). Any backend logic must be self-contained within the template's own external deployment.
2. **Responsive Design**: Templates must be responsive, as they will be previewed in various iframe sizes within the Shop's dashboard.
3. **No Auth Coupling**: The template should not handle authentication. All user authentication and billing are handled by the Shop. The template simply renders the injected `payload`.
