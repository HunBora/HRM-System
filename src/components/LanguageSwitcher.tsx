'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState, useRef } from 'react';

export default function LanguageSwitcher() {
  const router = useRouter();
  const [locale, setLocale] = useState('kh');
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Read the current locale from cookies on mount
    const cookies = document.cookie.split(';');
    const localeCookie = cookies.find(c => c.trim().startsWith('NEXT_LOCALE='));
    if (localeCookie) {
      const cookieVal = localeCookie.split('=')[1];
      if (cookieVal !== locale) {
        setLocale(cookieVal);
      }
    }
     

    // Click outside to close menu
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const changeLanguage = (newLocale: string) => {
    if (newLocale === locale) {
      setIsOpen(false);
      return;
    }
    setLocale(newLocale);
    // eslint-disable-next-line
    document.cookie = `NEXT_LOCALE=${newLocale}; path=/; max-age=31536000`; // 1 year
    setIsOpen(false);
    router.refresh(); // Refresh the page to load the new language
  };

  const getLanguageLabel = (code: string) => {
    if (code === 'kh') return '🇰🇭 ខ្មែរ (Khmer)';
    if (code === 'en') return '🇬🇧 English';
    if (code === 'zh') return '🇨🇳 中文 (Chinese)';
    return code;
  };

  return (
    <div style={{ position: 'relative' }} ref={menuRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        style={{ 
          background: 'none', 
          border: 'none', 
          cursor: 'pointer', 
          padding: 0, 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          transition: 'transform 0.2s',
          transform: isOpen ? 'scale(1.05)' : 'scale(1)'
        }}
        title="Change Language"
      >
        {/* Custom SVG Icon matching user's request */}
        <svg width="42" height="42" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* Globe Background */}
          <circle cx="50" cy="50" r="30" fill="#9ca3af" stroke="#1f2937" strokeWidth="4"/>
          <ellipse cx="50" cy="50" rx="15" ry="30" fill="none" stroke="#1f2937" strokeWidth="4"/>
          <path d="M20 50h60" stroke="#1f2937" strokeWidth="4"/>
          <path d="M25 35h50" stroke="#1f2937" strokeWidth="4"/>
          <path d="M25 65h50" stroke="#1f2937" strokeWidth="4"/>
          
          {/* Left Bubble (Chinese Character) */}
          <path d="M10 20 h30 a5,5 0 0,1 5,5 v20 a5,5 0 0,1 -5,5 h-10 l-10 10 v-10 h-10 a5,5 0 0,1 -5,-5 v-20 a5,5 0 0,1 5,-5 Z" fill="#22d3ee" stroke="#1f2937" strokeWidth="4" strokeLinejoin="round"/>
          <text x="25" y="42" fontSize="22" fontFamily="sans-serif" fontWeight="bold" textAnchor="middle" fill="#1f2937">文</text>
          
          {/* Right Bubble (English Letter A) */}
          <path d="M55 45 h30 a5,5 0 0,1 5,5 v20 a5,5 0 0,1 -5,5 h-10 l-10 10 v-10 h-10 a5,5 0 0,1 -5,-5 v-20 a5,5 0 0,1 5,-5 Z" fill="#22d3ee" stroke="#1f2937" strokeWidth="4" strokeLinejoin="round"/>
          <text x="70" y="67" fontSize="22" fontFamily="sans-serif" fontWeight="bold" textAnchor="middle" fill="#1f2937">A</text>
        </svg>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div style={{
          position: 'absolute',
          top: '120%',
          right: 0,
          backgroundColor: 'var(--bg-color)',
          border: '1px solid var(--border-color)',
          borderRadius: '10px',
          boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
          zIndex: 1000,
          minWidth: '180px',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column'
        }}>
          {['kh', 'en', 'zh'].map((code) => (
            <button
              key={code}
              onClick={() => changeLanguage(code)}
              style={{
                padding: '12px 16px',
                textAlign: 'left',
                background: locale === code ? '#3b82f6' : 'transparent',
                color: locale === code ? 'white' : 'var(--text-color)',
                border: 'none',
                cursor: 'pointer',
                fontSize: '0.95rem',
                borderBottom: code !== 'zh' ? '1px solid var(--border-color)' : 'none',
                transition: 'background-color 0.2s',
                display: 'flex',
                alignItems: 'center',
                gap: '10px'
              }}
              className="kh-text"
              onMouseEnter={(e) => {
                if (locale !== code) e.currentTarget.style.backgroundColor = 'var(--surface-color)';
              }}
              onMouseLeave={(e) => {
                if (locale !== code) e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              {getLanguageLabel(code)}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
