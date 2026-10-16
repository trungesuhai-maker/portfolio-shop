import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { translations } from '../i18n/translations';
import { translateText } from '../i18n/autoTranslate';

export type Language = 'vi' | 'en';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (keyOrText: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  // Load saved language preference or default to 'vi'
  const [language, setLanguageState] = useState<Language>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('app-language');
      if (saved === 'vi' || saved === 'en') return saved;
    }
    return 'vi';
  });

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    if (typeof window !== 'undefined') {
      localStorage.setItem('app-language', lang);
    }
  };

  /**
   * Smart universal translation function:
   * 1. Checks exact key dictionary in translations.ts
   * 2. If not found or raw sentence passed in, runs autoTranslate engine automatically!
   */
  const t = (keyOrText: string): string => {
    if (!keyOrText || typeof keyOrText !== 'string') return keyOrText;
    
    // 1. Check direct key lookup
    const langDict = (translations as any)[language];
    if (langDict && langDict[keyOrText]) {
      return langDict[keyOrText];
    }

    // 2. If raw sentence/text is passed into t(), run dynamic smart translator
    return translateText(keyOrText, language);
  };

  /**
   * Global Automatic DOM Text Translator for User Dashboard & Application
   * Automatically scans rendered text nodes in the dashboard and translates any Vietnamese text to English when language is 'en',
   * and restores original text when language is 'vi'.
   */
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const originalTextMap = new WeakMap<Node, string>();

    const translateDomNodes = (root: Node) => {
      const walker = document.createTreeWalker(
        root,
        NodeFilter.SHOW_TEXT,
        {
          acceptNode(node) {
            const parent = node.parentElement;
            if (!parent) return NodeFilter.FILTER_REJECT;
            const tag = parent.tagName.toLowerCase();
            // Don't translate code, scripts, styles or input elements directly
            if (['script', 'style', 'code', 'pre', 'textarea'].includes(tag)) {
              return NodeFilter.FILTER_REJECT;
            }
            if (!node.nodeValue || !node.nodeValue.trim()) {
              return NodeFilter.FILTER_REJECT;
            }
            return NodeFilter.FILTER_ACCEPT;
          }
        }
      );

      let currentNode: Node | null;
      while ((currentNode = walker.nextNode())) {
        const text = currentNode.nodeValue || '';
        if (language === 'en') {
          // If original hasn't been saved yet, save it
          if (!originalTextMap.has(currentNode)) {
            originalTextMap.set(currentNode, text);
          }
          const original = originalTextMap.get(currentNode) || text;
          const translated = translateText(original, 'en');
          if (translated !== text) {
            currentNode.nodeValue = translated;
          }
        } else {
          // Restore original Vietnamese text
          if (originalTextMap.has(currentNode)) {
            const original = originalTextMap.get(currentNode);
            if (original && currentNode.nodeValue !== original) {
              currentNode.nodeValue = original;
            }
          }
        }
      }
    };

    // Initial translation run
    const dashboardContainer = document.querySelector('main') || document.body;
    if (dashboardContainer) {
      translateDomNodes(dashboardContainer);
    }

    // Observe dynamic changes (e.g. modals, new components, async data)
    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (mutation.type === 'childList') {
          mutation.addedNodes.forEach((node) => {
            if (node.nodeType === Node.ELEMENT_NODE || node.nodeType === Node.TEXT_NODE) {
              translateDomNodes(node);
            }
          });
        } else if (mutation.type === 'characterData' && language === 'en') {
          const node = mutation.target;
          if (node.nodeValue && !originalTextMap.has(node)) {
            originalTextMap.set(node, node.nodeValue);
            const translated = translateText(node.nodeValue, 'en');
            if (translated !== node.nodeValue) {
              node.nodeValue = translated;
            }
          }
        }
      }
    });

    if (dashboardContainer) {
      observer.observe(dashboardContainer, {
        childList: true,
        subtree: true,
        characterData: true
      });
    }

    return () => {
      observer.disconnect();
    };
  }, [language]);

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
