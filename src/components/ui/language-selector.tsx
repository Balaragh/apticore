import { useState, useRef, useEffect } from 'react';
import { Languages, Check, ChevronDown } from 'lucide-react';
import { useLanguage, type SupportedLanguage, SUPPORTED_LANGUAGES } from '@/contexts/language-context';

export interface LanguageSelectorProps {
  variant?: 'header' | 'compact' | 'cards' | 'segmented';
  className?: string;
  onLanguageChange?: (lang: SupportedLanguage) => void;
}

export function LanguageSelector({
  variant = 'header',
  className = '',
  onLanguageChange,
}: LanguageSelectorProps) {
  const { language, setLanguage } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleSelect = (code: SupportedLanguage) => {
    setLanguage(code);
    onLanguageChange?.(code);
    setIsOpen(false);
  };

  const currentOption = SUPPORTED_LANGUAGES.find((l) => l.code === language) || SUPPORTED_LANGUAGES[0];

  // Variant: Segmented Toggle Buttons
  if (variant === 'segmented') {
    return (
      <div className={`inline-flex items-center rounded-xl bg-[#F8FAFC] p-1 border border-[#E2E8F0] ${className}`}>
        {SUPPORTED_LANGUAGES.map((item) => {
          const isActive = item.code === language;
          return (
            <button
              key={item.code}
              type="button"
              onClick={() => handleSelect(item.code)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                isActive
                  ? 'bg-white text-accent-700 shadow-xs border border-[#E2E8F0]'
                  : 'text-[#64748B] hover:text-[#172033]'
              }`}
            >
              <span>{item.nativeName}</span>
              {isActive && <span className="w-1.5 h-1.5 rounded-full bg-accent-600" />}
            </button>
          );
        })}
      </div>
    );
  }

  // Variant: Selectable Cards (Ideal for Settings Page)
  if (variant === 'cards') {
    return (
      <div className={`grid grid-cols-1 sm:grid-cols-3 gap-3 ${className}`}>
        {SUPPORTED_LANGUAGES.map((item) => {
          const isSelected = item.code === language;
          return (
            <button
              key={item.code}
              type="button"
              onClick={() => handleSelect(item.code)}
              className={`p-4 rounded-xl border text-left transition-all relative ${
                isSelected
                  ? 'bg-accent-600/5 border-accent-600 ring-2 ring-accent-600/20'
                  : 'bg-white border-[#E2E8F0] hover:bg-[#F8FAFC] hover:border-surface-300'
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-sm font-bold text-[#172033]">{item.nativeName}</span>
                {isSelected && (
                  <span className="w-5 h-5 rounded-full bg-accent-600 text-white flex items-center justify-center shrink-0">
                    <Check size={12} strokeWidth={3} />
                  </span>
                )}
              </div>
              <p className="text-xs text-[#64748B]">{item.name}</p>
              <span className="mt-2 inline-block font-mono text-[10px] text-accent-600 font-semibold bg-accent-600/10 px-2 py-0.5 rounded">
                {item.localeCode}
              </span>
            </button>
          );
        })}
      </div>
    );
  }

  // Variant: Header Dropdown / Compact Dropdown
  return (
    <div className={`relative inline-block text-left ${className}`} ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-[#E2E8F0] bg-white hover:bg-[#F8FAFC] text-xs font-semibold text-[#172033] shadow-xs transition-all focus:outline-none focus:ring-2 focus:ring-accent-600/20"
        aria-expanded={isOpen}
        aria-haspopup="true"
        title="Switch language (English, தமிழ், हिन्दी)"
      >
        <Languages size={15} className="text-accent-600 shrink-0" />
        <span className={variant === 'compact' ? 'hidden sm:inline' : 'inline'}>
          {currentOption.nativeName}
        </span>
        <ChevronDown
          size={13}
          className={`text-[#64748B] transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-1.5 w-44 rounded-xl bg-white border border-[#E2E8F0] shadow-lg py-1 z-50 animate-in fade-in zoom-in-95 duration-100">
          <div className="px-3 py-1.5 border-b border-[#E2E8F0] text-[10px] font-bold uppercase tracking-wider text-[#64748B]">
            Select Language / மொழி / भाषा
          </div>
          {SUPPORTED_LANGUAGES.map((item) => {
            const isSelected = item.code === language;
            return (
              <button
                key={item.code}
                type="button"
                onClick={() => handleSelect(item.code)}
                className={`w-full flex items-center justify-between px-3.5 py-2 text-xs text-left transition-colors ${
                  isSelected
                    ? 'bg-accent-600/10 text-accent-700 font-bold'
                    : 'text-[#172033] hover:bg-[#F8FAFC]'
                }`}
              >
                <div>
                  <span className="block">{item.nativeName}</span>
                  <span className="text-[10px] text-[#64748B] font-normal">{item.name}</span>
                </div>
                {isSelected && <Check size={14} className="text-accent-600" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
