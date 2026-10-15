'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { toKhmerLunarDate } from 'khmer-chhankitek-calendar';

const KHMER_MONTHS = [
  'មករា', 'កុម្ភៈ', 'មីនា', 'មេសា', 'ឧសភា', 'មិថុនា',
  'កក្កដា', 'សីហា', 'កញ្ញា', 'តុលា', 'វិច្ឆិកា', 'ធ្នូ'
];

const MONTHS_EN = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const WEEKDAYS_HEADER = [
  { label: 'អាទិត្យ', isWeekend: true },
  { label: 'ច័ន្ទ', isWeekend: false },
  { label: 'អង្គារ', isWeekend: false },
  { label: 'ពុធ', isWeekend: false },
  { label: 'ព្រហ', isWeekend: false },
  { label: 'សុក្រ', isWeekend: false },
  { label: 'សៅរ៍', isWeekend: true },
];

const toKhmerNum = (num: number | string): string => {
  const khmerDigits = ['០', '១', '២', '៣', '៤', '៥', '៦', '៧', '៨', '៩'];
  return String(num).replace(/[0-9]/g, (d) => khmerDigits[parseInt(d, 10)]);
};

export default function LiveDigitalClock({
  locale = 'kh',
  actualDateStr = '',
}: {
  locale?: string;
  actualDateStr?: string;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Live walking clock state
  const [now, setNow] = useState<Date | null>(null);

  // Popover calendar open/close state
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Parse active date from props or URL or fallback to today
  const parseDate = (str: string) => {
    if (!str) return new Date();
    const parts = str.split('-');
    if (parts.length === 3) {
      return new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
    }
    return new Date();
  };

  const activeDate = parseDate(actualDateStr);

  // Calendar view month state (defaults to activeDate's month)
  const [viewDate, setViewDate] = useState<Date>(
    new Date(activeDate.getFullYear(), activeDate.getMonth(), 1)
  );

  // Currently inspected day in the popover details card (defaults to activeDate)
  const [inspectedDate, setInspectedDate] = useState<Date>(activeDate);

  // Timer for walking real-time clock
  useEffect(() => {
    setNow(new Date());
    const timer = setInterval(() => {
      setNow(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Sync viewDate and inspectedDate when actualDateStr changes
  useEffect(() => {
    const d = parseDate(actualDateStr);
    setInspectedDate(d);
    setViewDate(new Date(d.getFullYear(), d.getMonth(), 1));
  }, [actualDateStr]);

  // Close calendar popover on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
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

  if (!now) {
    return (
      <div
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '10px',
          padding: '8px 16px',
          backgroundColor: '#ffffff',
          borderRadius: '14px',
          border: '1px solid #e2e8f0',
          boxShadow: '0 2px 8px rgba(15, 23, 42, 0.04)',
          minHeight: '48px',
        }}
      >
        <span className="kh-text" style={{ fontSize: '0.82rem', color: '#64748b' }}>
          ⏳ កំពុងដំណើរការនាឡិកា និងប្រតិទិន...
        </span>
      </div>
    );
  }

  // Live Clock formatting
  const hours = now.getHours();
  const minutes = now.getMinutes();
  const seconds = now.getSeconds();
  const isAm = hours < 12;
  const hours12 = hours % 12 === 0 ? 12 : hours % 12;
  const pad = (n: number) => String(n).padStart(2, '0');

  const timeStr = `${pad(hours12)}:${pad(minutes)}:${pad(seconds)}`;
  const period = isAm ? 'AM' : 'PM';

  // Greeting based on time of day
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

  // Active Date data (the date currently filtered/displayed on dashboard)
  let activeHolidayName = '';
  let activeHolidayEn = '';
  let activeLunarShort = '';
  let activeGregorianText = '';
  let activeLunarFullText = '';
  let activeAnimalYear = '';
  let activeSak = '';
  let activeBuddhistEra = '';
  let activeIsSilDay = false;

  try {
    const lunar = toKhmerLunarDate(activeDate);
    if (lunar?.holidays && lunar.holidays.length > 0) {
      activeHolidayName = lunar.holidays[0].nameKm;
      activeHolidayEn = lunar.holidays[0].nameEn || '';
    }
    if (lunar?.moonDayKhmer && lunar?.moonStatus) {
      activeLunarShort = `${lunar.moonDayKhmer}${lunar.moonStatus} ខែ${lunar.khmerMonth || ''}`;
    }
    activeGregorianText = lunar?.gregorianDateText || '';
    activeLunarFullText = lunar?.lunarDateText || '';
    activeAnimalYear = lunar?.animalYear || '';
    activeSak = lunar?.sak || '';
    activeBuddhistEra = lunar?.buddhistEraYearKhmer || '';
    activeIsSilDay = !!lunar?.isSilDay;
  } catch (e) {}

  const activeDayFormatted = `${String(activeDate.getDate()).padStart(2, '0')}/${String(activeDate.getMonth() + 1).padStart(2, '0')}/${activeDate.getFullYear()}`;
  const activeDayKh = ['អាទិត្យ', 'ច័ន្ទ', 'អង្គារ', 'ពុធ', 'ព្រហស្បតិ៍', 'សុក្រ', 'សៅរ៍'][activeDate.getDay()];
  const activeDateTitleKh = `ថ្ងៃ${activeDayKh} ទី${toKhmerNum(activeDate.getDate())} ${KHMER_MONTHS[activeDate.getMonth()]} ${toKhmerNum(activeDate.getFullYear())}`;
  const activeDateEn = activeDate.toLocaleDateString('en-US', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  // Inspected Date data (for the Details card in the Popover)
  let inspectedHolidayName = '';
  let inspectedHolidayEn = '';
  let inspectedGregorianText = '';
  let inspectedLunarFullText = '';
  let inspectedAnimalYear = '';
  let inspectedSak = '';
  let inspectedBuddhistEra = '';
  let inspectedIsSilDay = false;

  try {
    const inspectedLunar = toKhmerLunarDate(inspectedDate);
    if (inspectedLunar?.holidays && inspectedLunar.holidays.length > 0) {
      inspectedHolidayName = inspectedLunar.holidays[0].nameKm;
      inspectedHolidayEn = inspectedLunar.holidays[0].nameEn || '';
    }
    inspectedGregorianText = inspectedLunar?.gregorianDateText || '';
    inspectedLunarFullText = inspectedLunar?.lunarDateText || '';
    inspectedAnimalYear = inspectedLunar?.animalYear || '';
    inspectedSak = inspectedLunar?.sak || '';
    inspectedBuddhistEra = inspectedLunar?.buddhistEraYearKhmer || '';
    inspectedIsSilDay = !!inspectedLunar?.isSilDay;
  } catch (e) {}

  const inspectedDayEn = inspectedDate.toLocaleDateString('en-US', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  // Calendar month navigation
  const prevMonth = (e: React.MouseEvent) => {
    e.stopPropagation();
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1));
  };

  const nextMonth = (e: React.MouseEvent) => {
    e.stopPropagation();
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1));
  };

  // Select date: updates inspection card AND filters dashboard
  const handleSelectDate = (date: Date) => {
    setInspectedDate(date);
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    const formatted = `${y}-${m}-${d}`;

    const currentParams = new URLSearchParams(searchParams.toString());
    currentParams.set('date', formatted);
    router.push(`/dashboard?${currentParams.toString()}`);
  };

  // Jump to Today
  const handleJumpToToday = (e: React.MouseEvent) => {
    e.stopPropagation();
    const today = new Date();
    handleSelectDate(today);
    setViewDate(new Date(today.getFullYear(), today.getMonth(), 1));
  };

  // Reset Filter (Clear date param)
  const handleResetFilter = (e: React.MouseEvent) => {
    e.stopPropagation();
    const currentParams = new URLSearchParams(searchParams.toString());
    currentParams.delete('date');
    setIsOpen(false);
    const queryString = currentParams.toString();
    router.push(queryString ? `/dashboard?${queryString}` : '/dashboard');
  };

  // Grid calculation for viewDate
  const viewYear = viewDate.getFullYear();
  const viewMonth = viewDate.getMonth();
  const firstDayIndex = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();

  // List all holidays in view month
  const monthHolidays: Array<{ day: number; nameKm: string; nameEn?: string }> = [];
  for (let d = 1; d <= daysInMonth; d++) {
    try {
      const cellDate = new Date(viewYear, viewMonth, d);
      const lunar = toKhmerLunarDate(cellDate);
      if (lunar?.holidays && lunar.holidays.length > 0) {
        monthHolidays.push({
          day: d,
          nameKm: lunar.holidays[0].nameKm,
          nameEn: lunar.holidays[0].nameEn,
        });
      }
    } catch (e) {}
  }

  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '12px',
        backgroundColor: '#ffffff',
        padding: '5px 12px 5px 16px',
        borderRadius: '14px',
        border: '1px solid #e2e8f0',
        boxShadow: '0 4px 16px -2px rgba(15, 23, 42, 0.05), 0 1px 3px rgba(15, 23, 42, 0.02)',
        position: 'relative',
        transition: 'all 0.2s ease',
        flexWrap: 'wrap',
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
        @keyframes fadeInDropdown {
          from {
            opacity: 0;
            transform: translateY(-6px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>

      {/* 1. Left: Greeting & Location */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <div
          style={{
            width: '36px',
            height: '36px',
            borderRadius: '9px',
            background: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)',
            border: '1px solid #bfdbfe',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1.15rem',
            boxShadow: '0 1px 3px rgba(37, 99, 235, 0.08)',
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

      {/* 2. Middle: Live Walking Digital Clock */}
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

      {/* 3. Right: Unified Modern Cambodian Interactive Calendar Trigger */}
      <div style={{ position: 'relative' }} ref={dropdownRef}>
        <button
          type="button"
          onClick={() => {
            setViewDate(new Date(activeDate.getFullYear(), activeDate.getMonth(), 1));
            setInspectedDate(activeDate);
            setIsOpen(!isOpen);
          }}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '10px',
            backgroundColor: activeHolidayName ? '#fff1f2' : '#f8fafc',
            border: `1.5px solid ${activeHolidayName ? '#fecdd3' : '#cbd5e1'}`,
            borderRadius: '10px',
            padding: '5px 12px',
            cursor: 'pointer',
            transition: 'all 0.15s ease',
            outline: 'none',
            textAlign: 'left',
          }}
          className="hover-elevate"
          title="ចុចដើម្បីមើលប្រតិទិន ថ្ងៃឈប់សម្រាកបុណ្យជាតិ និងព័ត៌មានលម្អិត"
        >
          {/* Modern Calendar Icon */}
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '9px',
              background: activeHolidayName
                ? 'linear-gradient(135deg, #ffe4e6 0%, #fecdd3 100%)'
                : 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)',
              border: `1px solid ${activeHolidayName ? '#fda4af' : '#bfdbfe'}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.2rem',
              flexShrink: 0,
              boxShadow: '0 2px 5px rgba(0,0,0,0.04)',
            }}
          >
            🗓️
          </div>

          {/* Text Summary */}
          <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
            {/* Top row: Date in Khmer & Holiday Pill */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span
                className="kh-text"
                style={{
                  fontSize: '0.78rem',
                  fontWeight: 800,
                  color: '#0f172a',
                  whiteSpace: 'nowrap',
                  lineHeight: 1.25,
                }}
              >
                {activeDateTitleKh}
              </span>

              {activeHolidayName && (
                <span
                  className="kh-text"
                  style={{
                    fontSize: '0.66rem',
                    fontWeight: 800,
                    color: '#be123c',
                    backgroundColor: '#ffe4e6',
                    border: '1px solid #fecdd3',
                    padding: '1px 8px',
                    borderRadius: '999px',
                    whiteSpace: 'nowrap',
                    lineHeight: 1.3,
                  }}
                >
                  🎉 {activeHolidayName}
                </span>
              )}
            </div>

            {/* Bottom row: English Date + Khmer Lunar Status */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '0.66rem',
                color: '#64748b',
                whiteSpace: 'nowrap',
                marginTop: '1px',
              }}
            >
              <span style={{ fontWeight: 600 }}>{activeDateEn} ({activeDayFormatted})</span>
              {activeLunarShort && (
                <>
                  <span>•</span>
                  <span className="kh-text" style={{ color: '#0284c7', fontWeight: 700 }}>
                    {activeLunarShort}
                  </span>
                </>
              )}
            </div>
          </div>

          {/* Dropdown Chevron */}
          <span
            style={{
              fontSize: '0.7rem',
              color: activeHolidayName ? '#be123c' : '#64748b',
              marginLeft: '4px',
              transform: isOpen ? 'rotate(180deg)' : 'none',
              transition: 'transform 0.2s ease',
              flexShrink: 0,
            }}
          >
            ▼
          </span>
        </button>

        {/* 4. The Luxury Popover Calendar with Comprehensive Details */}
        {isOpen && (
          <div
            style={{
              position: 'absolute',
              top: '52px',
              right: 0,
              width: '380px',
              maxWidth: 'calc(100vw - 32px)',
              backgroundColor: '#ffffff',
              borderRadius: '16px',
              border: '1px solid #cbd5e1',
              boxShadow: '0 20px 45px -10px rgba(15, 23, 42, 0.22), 0 8px 20px -4px rgba(15, 23, 42, 0.1)',
              zIndex: 9999,
              padding: '16px',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
              maxHeight: 'calc(90vh - 70px)',
              overflowY: 'auto',
              animation: 'fadeInDropdown 0.15s ease-out',
            }}
          >
            {/* Popover Header: Month & Year Navigator */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                borderBottom: '1px solid #f1f5f9',
                paddingBottom: '8px',
              }}
            >
              <button
                type="button"
                onClick={prevMonth}
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '8px',
                  border: '1px solid #e2e8f0',
                  backgroundColor: '#f8fafc',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.85rem',
                  color: '#334155',
                  transition: 'all 0.15s',
                }}
                title="ខែមុន"
              >
                ◀
              </button>

              <div style={{ textAlign: 'center' }}>
                <div
                  className="kh-text"
                  style={{
                    fontSize: '0.94rem',
                    fontWeight: 800,
                    color: '#0f172a',
                    lineHeight: 1.2,
                  }}
                >
                  ខែ{KHMER_MONTHS[viewMonth]} ({MONTHS_EN[viewMonth]})
                </div>
                <div
                  className="kh-text"
                  style={{
                    fontSize: '0.74rem',
                    color: '#0284c7',
                    fontWeight: 700,
                    marginTop: '1px',
                  }}
                >
                  ឆ្នាំ {toKhmerNum(viewYear)} • {viewYear}
                </div>
              </div>

              <button
                type="button"
                onClick={nextMonth}
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '8px',
                  border: '1px solid #e2e8f0',
                  backgroundColor: '#f8fafc',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.85rem',
                  color: '#334155',
                  transition: 'all 0.15s',
                }}
                title="ខែបន្ទាប់"
              >
                ▶
              </button>
            </div>

            {/* Weekdays Header: Full Words with Zero Slicing */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(7, 1fr)',
                textAlign: 'center',
                fontSize: '0.72rem',
                fontWeight: 800,
                padding: '6px 0',
                backgroundColor: '#f8fafc',
                borderRadius: '8px',
                border: '1px solid #f1f5f9',
              }}
            >
              {WEEKDAYS_HEADER.map((w, idx) => (
                <span
                  key={idx}
                  className="kh-text"
                  style={{
                    color: w.isWeekend ? '#e11d48' : '#334155',
                    lineHeight: 1.4,
                  }}
                >
                  {w.label}
                </span>
              ))}
            </div>

            {/* Calendar Days Grid */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(7, 1fr)',
                gap: '4px',
              }}
            >
              {/* Empty offset days */}
              {Array.from({ length: firstDayIndex }).map((_, idx) => (
                <div key={`empty-${idx}`} style={{ minHeight: '44px' }} />
              ))}

              {/* Days of Month */}
              {Array.from({ length: daysInMonth }).map((_, idx) => {
                const dNum = idx + 1;
                const cellDate = new Date(viewYear, viewMonth, dNum);
                const dayOfWeek = cellDate.getDay();
                const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

                // Match with active filtered date
                const isSelected =
                  cellDate.getDate() === activeDate.getDate() &&
                  cellDate.getMonth() === activeDate.getMonth() &&
                  cellDate.getFullYear() === activeDate.getFullYear();

                // Match with currently inspected date in details card
                const isInspected =
                  cellDate.getDate() === inspectedDate.getDate() &&
                  cellDate.getMonth() === inspectedDate.getMonth() &&
                  cellDate.getFullYear() === inspectedDate.getFullYear();

                const isToday =
                  cellDate.getDate() === now.getDate() &&
                  cellDate.getMonth() === now.getMonth() &&
                  cellDate.getFullYear() === now.getFullYear();

                let holidayName = '';
                let lunarText = '';
                let isSilDay = false;
                try {
                  const lunar = toKhmerLunarDate(cellDate);
                  if (lunar?.holidays && lunar.holidays.length > 0) {
                    holidayName = lunar.holidays[0].nameKm;
                  }
                  if (lunar?.moonDayKhmer && lunar?.moonStatus) {
                    lunarText = `${lunar.moonDayKhmer}${lunar.moonStatus}`;
                  }
                  isSilDay = !!lunar?.isSilDay;
                } catch (e) {}

                const isHoliday = !!holidayName;

                return (
                  <button
                    key={`day-${dNum}`}
                    type="button"
                    onClick={() => handleSelectDate(cellDate)}
                    style={{
                      minHeight: '46px',
                      borderRadius: '8px',
                      border: isSelected
                        ? '2px solid #2563eb'
                        : isInspected
                        ? '2px dashed #0284c7'
                        : isToday
                        ? '1.5px solid #3b82f6'
                        : isHoliday
                        ? '1.5px solid #fda4af'
                        : '1px solid #f1f5f9',
                      backgroundColor: isSelected
                        ? '#2563eb'
                        : isHoliday
                        ? '#fff1f2'
                        : isToday
                        ? '#eff6ff'
                        : '#ffffff',
                      color: isSelected
                        ? '#ffffff'
                        : isHoliday
                        ? '#be123c'
                        : isWeekend
                        ? '#e11d48'
                        : '#0f172a',
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: '3px 2px',
                      position: 'relative',
                      transition: 'all 0.15s ease',
                      boxShadow: isSelected
                        ? '0 2px 6px rgba(37, 99, 235, 0.25)'
                        : isHoliday
                        ? '0 1px 3px rgba(244, 63, 94, 0.1)'
                        : 'none',
                    }}
                    title={holidayName ? `🎉 ${holidayName} (${lunarText})` : `ថ្ងៃទី ${toKhmerNum(dNum)} (${lunarText})`}
                  >
                    <span
                      style={{
                        fontSize: '0.84rem',
                        fontWeight: isSelected || isHoliday || isToday ? 800 : 700,
                        lineHeight: 1.1,
                      }}
                    >
                      {dNum}
                    </span>

                    {/* Lunar Status or Holiday Badge */}
                    <span
                      className="kh-text"
                      style={{
                        fontSize: isHoliday ? '0.62rem' : '0.58rem',
                        color: isSelected
                          ? '#dbeafe'
                          : isHoliday
                          ? '#e11d48'
                          : isSilDay
                          ? '#d97706'
                          : '#64748b',
                        lineHeight: 1.35,
                        fontWeight: isHoliday || isSilDay ? 800 : 600,
                        whiteSpace: 'nowrap',
                        marginTop: '1px',
                      }}
                    >
                      {isHoliday ? '★ បុណ្យ' : isSilDay ? '☸ សីល' : lunarText}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* 5. Details ខាងក្រោមយ៉ាងលំអិត (Selected Date Deep-Dive Details) */}
            <div
              style={{
                backgroundColor: inspectedHolidayName ? '#fff1f2' : '#f8fafc',
                border: `1.5px solid ${inspectedHolidayName ? '#fecdd3' : '#e2e8f0'}`,
                borderRadius: '12px',
                padding: '12px 14px',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
              }}
            >
              {/* Header with Type Badge */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                <div
                  className="kh-text"
                  style={{
                    fontSize: '0.78rem',
                    fontWeight: 800,
                    color: '#0f172a',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  <span>📌</span>
                  <span>ព័ត៌មានលម្អិតកាលបរិច្ឆេទ (Date Details)</span>
                </div>

                {inspectedHolidayName ? (
                  <span
                    className="kh-text"
                    style={{
                      fontSize: '0.66rem',
                      fontWeight: 800,
                      color: '#be123c',
                      backgroundColor: '#ffe4e6',
                      border: '1px solid #fecdd3',
                      padding: '2px 8px',
                      borderRadius: '999px',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    🎉 ថ្ងៃឈប់សម្រាកបុណ្យជាតិ
                  </span>
                ) : inspectedIsSilDay ? (
                  <span
                    className="kh-text"
                    style={{
                      fontSize: '0.66rem',
                      fontWeight: 800,
                      color: '#d97706',
                      backgroundColor: '#fef3c7',
                      border: '1px solid #fde68a',
                      padding: '2px 8px',
                      borderRadius: '999px',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    ☸️ ថ្ងៃសីល
                  </span>
                ) : (
                  <span
                    className="kh-text"
                    style={{
                      fontSize: '0.66rem',
                      fontWeight: 700,
                      color: '#0284c7',
                      backgroundColor: '#e0f2fe',
                      border: '1px solid #bae6fd',
                      padding: '2px 8px',
                      borderRadius: '999px',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    💼 ថ្ងៃធ្វើការធម្មតា
                  </span>
                )}
              </div>

              {/* Holiday Full Title Box */}
              {inspectedHolidayName && (
                <div
                  style={{
                    backgroundColor: '#ffffff',
                    border: '1px solid #fda4af',
                    borderRadius: '8px',
                    padding: '8px 10px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                  }}
                >
                  <span style={{ fontSize: '1.4rem' }}>🇰🇭</span>
                  <div>
                    <div
                      className="kh-text"
                      style={{
                        fontSize: '0.82rem',
                        fontWeight: 800,
                        color: '#9f1239',
                        lineHeight: 1.35,
                      }}
                    >
                      {inspectedHolidayName}
                    </div>
                    {inspectedHolidayEn && (
                      <div style={{ fontSize: '0.68rem', color: '#be123c', fontWeight: 600 }}>
                        {inspectedHolidayEn} • Official Public Holiday
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Detailed Breakdown Fields */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '5px', fontSize: '0.72rem' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '6px' }}>
                  <span style={{ color: '#64748b', fontWeight: 600, minWidth: '95px' }} className="kh-text">
                    📅 សូរិយគតិ៖
                  </span>
                  <span style={{ color: '#0f172a', fontWeight: 700 }} className="kh-text">
                    {inspectedGregorianText} ({inspectedDayEn})
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '6px' }}>
                  <span style={{ color: '#64748b', fontWeight: 600, minWidth: '95px' }} className="kh-text">
                    🌙 ចន្ទគតិខ្មែរ៖
                  </span>
                  <span style={{ color: '#0369a1', fontWeight: 700 }} className="kh-text">
                    {inspectedLunarFullText}
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '6px' }}>
                  <span style={{ color: '#64748b', fontWeight: 600, minWidth: '95px' }} className="kh-text">
                    📜 ពុទ្ធសករាជ៖
                  </span>
                  <span style={{ color: '#475569', fontWeight: 600 }} className="kh-text">
                    ឆ្នាំ{inspectedAnimalYear} {inspectedSak} ពុទ្ធសករាជ {inspectedBuddhistEra}
                  </span>
                </div>
              </div>
            </div>

            {/* 6. Month Cambodian Public Holidays List */}
            <div
              style={{
                backgroundColor: '#fff1f2',
                border: '1px solid #fecdd3',
                borderRadius: '12px',
                padding: '10px 12px',
                color: '#9f1239',
              }}
            >
              <div
                className="kh-text"
                style={{
                  fontSize: '0.74rem',
                  fontWeight: 800,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  marginBottom: '6px',
                  color: '#be123c',
                  lineHeight: 1.3,
                }}
              >
                <span>🎉</span>
                <span>ថ្ងៃឈប់សម្រាកបុណ្យជាតិក្នុងខែ {KHMER_MONTHS[viewMonth]}៖</span>
              </div>

              {monthHolidays.length === 0 ? (
                <div className="kh-text" style={{ color: '#64748b', fontSize: '0.7rem', lineHeight: 1.35 }}>
                  គ្មានថ្ងៃឈប់សម្រាកបុណ្យជាតិផ្លូវការក្នុងខែនេះទេ
                </div>
              ) : (
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '6px',
                    maxHeight: '120px',
                    overflowY: 'auto',
                    paddingRight: '4px',
                  }}
                >
                  {monthHolidays.map((h) => (
                    <div
                      key={`h-${h.day}`}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '8px',
                        padding: '4px 8px',
                        backgroundColor: '#ffffff',
                        borderRadius: '6px',
                        border: '1px solid #fecdd3',
                      }}
                    >
                      <span
                        className="kh-text"
                        style={{
                          fontWeight: 700,
                          color: '#9f1239',
                          fontSize: '0.72rem',
                          lineHeight: 1.35,
                        }}
                      >
                        • ថ្ងៃទី {toKhmerNum(h.day)}: {h.nameKm}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleSelectDate(new Date(viewYear, viewMonth, h.day))}
                        className="kh-text"
                        style={{
                          backgroundColor: '#be123c',
                          border: 'none',
                          color: '#ffffff',
                          borderRadius: '4px',
                          padding: '3px 8px',
                          fontSize: '0.64rem',
                          fontWeight: 700,
                          cursor: 'pointer',
                          whiteSpace: 'nowrap',
                          flexShrink: 0,
                          lineHeight: 1.2,
                        }}
                      >
                        ជ្រើសរើស ➔
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 7. Quick Action Footer */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                borderTop: '1px solid #f1f5f9',
                paddingTop: '8px',
                gap: '8px',
                flexWrap: 'wrap',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <button
                  type="button"
                  onClick={handleJumpToToday}
                  className="kh-text"
                  style={{
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    color: '#2563eb',
                    backgroundColor: '#eff6ff',
                    border: '1px solid #bfdbfe',
                    borderRadius: '8px',
                    padding: '5px 10px',
                    cursor: 'pointer',
                    lineHeight: 1.3,
                    whiteSpace: 'nowrap',
                  }}
                >
                  📍 ថ្ងៃនេះ (Today)
                </button>

                {actualDateStr && (
                  <button
                    type="button"
                    onClick={handleResetFilter}
                    className="kh-text"
                    style={{
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      color: '#d97706',
                      backgroundColor: '#fef3c7',
                      border: '1px solid #fde68a',
                      borderRadius: '8px',
                      padding: '5px 10px',
                      cursor: 'pointer',
                      lineHeight: 1.3,
                      whiteSpace: 'nowrap',
                    }}
                    title="លុបការច្រោះ និងត្រឡប់ទៅទិន្នន័យថ្ងៃនេះ"
                  >
                    🔄 កំណត់ឡើងវិញ
                  </button>
                )}
              </div>

              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="kh-text"
                style={{
                  fontSize: '0.72rem',
                  fontWeight: 600,
                  color: '#64748b',
                  backgroundColor: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  padding: '5px 10px',
                  cursor: 'pointer',
                  lineHeight: 1.3,
                  whiteSpace: 'nowrap',
                }}
              >
                បិទ (Close)
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
