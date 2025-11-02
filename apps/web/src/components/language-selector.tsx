'use client';

import { useEffect, useState } from 'react';
import { Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';

type Language = 'en' | 'nl';

export function LanguageSelector() {
  const [language, setLanguage] = useState<Language>('en');

  useEffect(() => {
    const saved = localStorage.getItem('famly-language') as Language | null;
    if (saved === 'en' || saved === 'nl') {
      setLanguage(saved);
    }
  }, []);

  const handleLanguageChange = (lang: Language) => {
    setLanguage(lang);
    localStorage.setItem('famly-language', lang);
    // Future: integrate with i18n library when available
  };

  const languages: Array<{ value: Language; label: string; fullName: string }> = [
    { value: 'en', label: 'EN', fullName: 'English' },
    { value: 'nl', label: 'NL', fullName: 'Nederlands' },
  ];

  return (
    <div className="flex items-center gap-1 rounded-lg bg-muted p-1">
      {languages.map(({ value, label, fullName }) => (
        <Button
          key={value}
          variant="ghost"
          size="sm"
          onClick={() => handleLanguageChange(value)}
          className={`gap-2 ${language === value ? 'bg-background shadow-sm' : 'hover:bg-background/50'}`}
          aria-label={`Switch to ${fullName}`}
          title={fullName}
        >
          <Globe className="h-4 w-4" />
          <span className="text-xs font-medium">{label}</span>
        </Button>
      ))}
    </div>
  );
}
