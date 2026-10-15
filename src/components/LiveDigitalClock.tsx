'use client';

import React, { useState, useEffect } from 'react';

const KHMER_DAYS = [
  'ថ្ងៃអាទិត្យ',
  'ថ្ងៃច័ន្ទ',
  'ថ្ងៃអង្គារ',
  'ថ្ងៃពុធ',
  'ថ្ងៃព្រហស្បតិ៍',
  'ថ្ងៃសុក្រ',
  'ថ្ងៃសៅរ៍',
];

const KHMER_MONTHS = [
  'មករា',
  'កុម្ភៈ',
  'មីនា',
  'មេសា',
  'ឧសភា',
  'មិថុនា',
  'កក្កដា',
  'សីហា',
  'កញ្ញា',
  'តុលា',
  'វិច្ឆិកា',
  'ធ្នូ',
];

const toKhmerNum = (num: number | string): string => {
  const khmerDigits = ['០', '១', '២', '៣', '៤', '៥', '៦', '៧', '៨', '៩'];
  return String(num).replace(/[0-9]/g, (d) => khmerDigits[parseInt(d, 10)]);
};

export default function LiveDigitalClock({ locale = 'kh' }: { locale?: string }) {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    setNow(new Date());
    const timer = setInterval(() => {
      setNow(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  if (!now) {
    return (
      <div
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '10px',
          padding: '6px 14px',
          backgroundColor: '#ffffff',
          borderRadius: '12px',
          border: '1px solid #e2e8f0',
          boxShadow: '0 2px 6px rgba(15, 23, 42, 0.03)',
          minHeight: '44px',
        }}
      >
        <span style={{ fontSize: '0.82rem', color: '#94a3b8' }}>⏳ កំពុងដំណើរការម៉ោង...</span>
      </div>
    );
  }

  const hours = now.getHours();
  const minutes = now.getMinutes();
  const seconds = now.getSeconds();
  const isAm = hours < 12;
  const hours12 = hours % 12 === 0 ? 12 : hours % 12;
  const pad = (n: number) => String(n).padStart(2, '0');

  const timeStr = `${pad(hours12)}:${pad(minutes)}:${pad(seconds)}`;
  const period = isAm ? 'AM' : 'PM';

  // Greeting logic
  let greetingKh = 'អរុណសួស្តី';
  let greetingEn = 'Good Morning';
  let greetingIcon = '☀️';

  if (hours >= 12 && hours < 17) {
    greetingKh = 'ទិវាសួស្តី';
    greetingEn = 'Good Afternoon';
    greetingIcon = '🌤️';
  } else if (hours >= 17 && hours < 21) {
    greetingKh = 'សាយណ្ហសួស្តី';
    greetingEn = 'Good Evening';
    greetingIcon = '🌆';
  } else if (hours >= 21 || hours < 5) {
    greetingKh = 'រាត្រីសួស្តី';
    greetingEn = 'Good Night';
    greetingIcon = '🌙';
  }

  // Khmer date
  const dayNameKh = KHMER_DAYS[now.getDay()];
  const dayNum = now.getDate();
  const monthNameKh = KHMER_MONTHS[now.getMonth()];
  const yearNum = now.getFullYear();
  const fullDateKh = `${dayNameKh} ទី${toKhmerNum(dayNum)} ${monthNameKh} ${toKhmerNum(yearNum)}`;

  // English date
  const fullDateEn = now.toLocaleDateString('en-US', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '14px',
        backgroundColor: '#ffffff',
        padding: '6px 16px',
        borderRadius: '12px',
        border: '1px solid #e2e8f0',
        boxShadow: '0 2px 8px rgba(15, 23, 42, 0.04), 0 1px 2px rgba(15, 23, 42, 0.02)',
        position: 'relative',
        transition: 'all 0.2s ease',
      }}
    >
      <style jsx>{`
        @keyframes pulseDot {
          0%, 100% {
            opacity: 1;
            transform: scale(1);
          }
          50% {
            opacity: 0.4;
            transform: scale(1.2);
          }
        }
        .live-pulse-dot {
          animation: pulseDot 1.5s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
      `}</style>

      {/* Left Icon & Greeting */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <div
          style={{
            width: '36px',
            height: '36px',
            borderRadius: '9px',
            background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1.15rem',
            boxShadow: '0 2px 6px rgba(2, 132, 199, 0.3)',
            flexShrink: 0,
          }}
        >
          {greetingIcon}
        </div>
        <div style={{ minWidth: 0 }}>
          <div
            className="kh-text"
            style={{
              fontSize: '0.74rem',
              fontWeight: 700,
              color: '#0369a1',
              whiteSpace: 'nowrap',
              lineHeight: 1.3,
            }}
          >
            {greetingKh} ({greetingEn})
          </div>
          <div
            style={{
              fontSize: '0.64rem',
              color: '#64748b',
              whiteSpace: 'nowrap',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            <span>🇰🇭 ភ្នំពេញ (Phnom Penh)</span>
            <span>•</span>
            <span style={{ fontWeight: 600, color: '#0284c7' }}>GMT+7</span>
          </div>
        </div>
      </div>

      {/* Divider */}
      <div
        style={{
          width: '1px',
          height: '28px',
          backgroundColor: '#e2e8f0',
        }}
      />

      {/* Middle: Walking Clock Time */}
      <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
          }}
        >
          <span
            className="live-pulse-dot"
            style={{
              width: '7px',
              height: '7px',
              borderRadius: '50%',
              backgroundColor: '#10b981',
              boxShadow: '0 0 6px #10b981',
              display: 'inline-block',
            }}
          />
          <span
            style={{
              fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
              fontSize: '1.25rem',
              fontWeight: 800,
              color: '#0f172a',
              letterSpacing: '0.5px',
              lineHeight: 1,
            }}
          >
            {timeStr}
          </span>
        </div>
        <span
          style={{
            fontSize: '0.72rem',
            fontWeight: 800,
            color: '#0284c7',
            backgroundColor: '#e0f2fe',
            padding: '1px 5px',
            borderRadius: '4px',
            lineHeight: 1.2,
          }}
        >
          {period}
        </span>
      </div>

      {/* Divider */}
      <div
        style={{
          width: '1px',
          height: '28px',
          backgroundColor: '#e2e8f0',
        }}
      />

      {/* Right: Real-time Date in Khmer & English */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1px' }}>
        <div
          className="kh-text"
          style={{
            fontSize: '0.76rem',
            fontWeight: 700,
            color: '#1e293b',
            whiteSpace: 'nowrap',
            lineHeight: 1.3,
          }}
        >
          {fullDateKh}
        </div>
        <div
          style={{
            fontSize: '0.64rem',
            color: '#94a3b8',
            fontWeight: 600,
            whiteSpace: 'nowrap',
          }}
        >
          {fullDateEn}
        </div>
      </div>
    </div>
  );
}
