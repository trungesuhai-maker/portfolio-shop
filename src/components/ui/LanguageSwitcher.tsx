import { useLanguage } from '@/src/contexts/LanguageContext';

export function LanguageSwitcher() {
  const { language, setLanguage } = useLanguage();

  const toggleLanguage = () => {
    setLanguage(language === 'vi' ? 'en' : 'vi');
  };

  return (
    <button
      onClick={toggleLanguage}
      type="button"
      className="w-9 h-9 rounded-full overflow-hidden border border-slate-200/90 hover:scale-105 active:scale-95 transition-all shadow-xs flex items-center justify-center cursor-pointer bg-white p-0.5"
      title={language === 'vi' ? 'Đang chọn Tiếng Việt — Bấm để đổi sang English' : 'Currently English — Click to switch to Vietnamese'}
      aria-label="Switch Language"
    >
      {language === 'vi' ? (
        // VIETNAM FLAG SVG (Circular)
        <svg viewBox="0 0 512 512" className="w-full h-full rounded-full">
          <circle cx="256" cy="256" r="256" fill="#DA251D" />
          <polygon
            fill="#FFFF00"
            points="256,120 286,212 383,212 304,269 335,361 256,304 177,361 208,269 129,212 226,212"
          />
        </svg>
      ) : (
        // ENGLISH (UK / US) FLAG SVG (Circular)
        <svg viewBox="0 0 512 512" className="w-full h-full rounded-full">
          <clipPath id="uk-circle">
            <circle cx="256" cy="256" r="256" />
          </clipPath>
          <g clipPath="url(#uk-circle)">
            <rect width="512" height="512" fill="#012169" />
            <path d="M0 0L512 512M512 0L0 512" stroke="#FFFFFF" strokeWidth="60" />
            <path d="M0 0L512 512M512 0L0 512" stroke="#C8102E" strokeWidth="40" />
            <path d="M256 0V512M0 256H512" stroke="#FFFFFF" strokeWidth="100" />
            <path d="M256 0V512M0 256H512" stroke="#C8102E" strokeWidth="60" />
          </g>
        </svg>
      )}
    </button>
  );
}
