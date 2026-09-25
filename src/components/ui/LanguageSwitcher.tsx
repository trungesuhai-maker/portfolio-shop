import { useLanguage } from '@/src/contexts/LanguageContext';

export function LanguageSwitcher() {
  const { language, setLanguage } = useLanguage();

  const toggleLanguage = () => {
    setLanguage(language === 'vi' ? 'en' : 'vi');
  };

  return (
    <button
      onClick={toggleLanguage}
      className="w-9 h-9 rounded-full flex items-center justify-center bg-white hover:bg-slate-50 transition-colors border border-slate-200 text-lg shadow-sm"
      title={language === 'vi' ? 'Switch to English' : 'Chuyển sang Tiếng Việt'}
    >
      {language === 'vi' ? '🇻🇳' : '🇬🇧'}
    </button>
  );
}
