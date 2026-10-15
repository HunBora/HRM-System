'use client';

import React, { useState, useRef, useEffect } from 'react';
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

export default function CambodiaDatePicker({
  actualDateStr,
}: {
  actualDateStr: string;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Parse initial date
  const parseDate = (str: string) => {
    const parts = str.split('-');
    if (parts.length === 3) {
      return new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
    }
    return new Date();
  };

  const selectedDate = parseDate(actualDateStr);
  const [viewDate, setViewDate] = useState<Date>(
    new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1)
  );

  // Close dropdown on outside click
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

  // Check holiday for selected date
  let selectedHolidayName = '';
  try {
    const lunar = toKhmerLunarDate(selectedDate);
    if (lunar?.holidays && lunar.holidays.length > 0) {
      selectedHolidayName = lunar.holidays[0].nameKm;
    }
  } catch (e) {}

  // Navigate month
  const prevMonth = (e: React.MouseEvent) => {
    e.stopPropagation();
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1));
  };

  const nextMonth = (e: React.MouseEvent) => {
    e.stopPropagation();
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1));
  };

  const jumpToToday = (e: React.MouseEvent) => {
    e.stopPropagation();
    const today = new Date();
    handleSelectDate(today);
  };

  // Select date and update URL
  const handleSelectDate = (date: Date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    const formatted = `${y}-${m}-${d}`;

    const currentParams = new URLSearchParams(searchParams.toString());
    currentParams.set('date', formatted);
    setIsOpen(false);
    router.push(`/dashboard?${currentParams.toString()}`);
  };

  // Build days grid for viewDate
  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const firstDayIndex = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  // Find all holidays in this view month
  const monthHolidays: Array<{ day: number; nameKm: string; nameEn?: string }> = [];
  for (let d = 1; d <= daysInMonth; d++) {
    try {
      const dateObj = new Date(year, month, d);
      const lunar = toKhmerLunarDate(dateObj);
      if (lunar?.holidays && lunar.holidays.length > 0) {
        monthHolidays.push({
          day: d,
          nameKm: lunar.holidays[0].nameKm,
          nameEn: lunar.holidays[0].nameEn,
        });
      }
    } catch (e) {}
  }

  // Format button label
  const selectedDayFormatted = `${String(selectedDate.getDate()).padStart(2, '0')}/${String(selectedDate.getMonth() + 1).padStart(2, '0')}/${selectedDate.getFullYear()}`;

  return (
    <div style={{ position: 'relative' }} ref={dropdownRef}>
      {/* Trigger Button - Full Content Fit, Zero Truncation */}
      <button
        type="button"
        onClick={() => {
          setViewDate(new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1));
          setIsOpen(!isOpen);
        }}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '10px',
          backgroundColor: selectedHolidayName ? '#fff1f2' : '#ffffff',
          border: `1.5px solid ${selectedHolidayName ? '#f43f5e' : '#cbd5e1'}`,
          borderRadius: '10px',
          padding: '6px 14px',
          height: '48px',
          cursor: 'pointer',
          boxShadow: '0 1px 3px rgba(15, 23, 42, 0.05)',
          transition: 'all 0.15s ease',
          outline: 'none',
          whiteSpace: 'nowrap',
          maxWidth: '100%',
        }}
        title="ចុចដើម្បីជ្រើសរើសកាលបរិច្ឆេទ និងមើលថ្ងៃឈប់សម្រាកបុណ្យជាតិ"
      >
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <span style={{ fontSize: '0.9rem' }}>{selectedHolidayName ? '🎉' : '📅'}</span>
            <span
              className="kh-text"
              style={{
                fontSize: '0.68rem',
                color: selectedHolidayName ? '#be123c' : '#0284c7',
                fontWeight: 800,
                lineHeight: 1.2,
                whiteSpace: 'nowrap',
              }}
            >
              {selectedHolidayName ? 'ថ្ងៃឈប់សម្រាកបុណ្យជាតិ' : 'កាលបរិច្ឆេទជាក់ស្តែង'}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '2px', flexWrap: 'nowrap' }}>
            <span
              style={{
                fontSize: '0.88rem',
                fontWeight: 800,
                color: '#0f172a',
                fontFamily: 'monospace',
                lineHeight: 1.2,
                whiteSpace: 'nowrap',
              }}
            >
              {selectedDayFormatted}
            </span>

            {selectedHolidayName && (
              <span
                className="kh-text"
                style={{
                  fontSize: '0.72rem',
                  fontWeight: 800,
                  color: '#9f1239',
                  backgroundColor: '#ffe4e6',
                  padding: '2px 8px',
                  borderRadius: '6px',
                  border: '1px solid #fecdd3',
                  whiteSpace: 'nowrap',
                  lineHeight: 1.35,
                }}
              >
                {selectedHolidayName}
              </span>
            )}
          </div>
        </div>

        <span
          style={{
            fontSize: '0.7rem',
            color: selectedHolidayName ? '#be123c' : '#64748b',
            marginLeft: '4px',
            transform: isOpen ? 'rotate(180deg)' : 'none',
            transition: 'transform 0.2s ease',
            flexShrink: 0,
          }}
        >
          ▼
        </span>
      </button>

      {/* Popover Calendar with Cambodian Holidays */}
      {isOpen && (
        <div
          style={{
            position: 'absolute',
            top: '54px',
            right: 0,
            width: '360px',
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
            animation: 'fadeInPop 0.15s ease-out',
          }}
        >
          <style jsx>{`
            @keyframes fadeInPop {
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

          {/* Month & Year Navigation Header */}
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
            >
              ◀
            </button>

            <div style={{ textAlign: 'center' }}>
              <div
                className="kh-text"
                style={{
                  fontSize: '0.92rem',
                  fontWeight: 800,
                  color: '#0f172a',
                  lineHeight: 1.25,
                }}
              >
                ខែ{KHMER_MONTHS[month]} ({MONTHS_EN[month]})
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
                ឆ្នាំ {toKhmerNum(year)} • {year}
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
            >
              ▶
            </button>
          </div>

          {/* Weekday Labels - Full Words with Zero Unicode Slicing */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(7, 1fr)',
              textAlign: 'center',
              fontSize: '0.72rem',
              fontWeight: 800,
              padding: '6px 0',
              borderBottom: '1px solid #e2e8f0',
              backgroundColor: '#f8fafc',
              borderRadius: '8px',
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

          {/* Days Grid */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(7, 1fr)',
              gap: '4px',
            }}
          >
            {/* Empty slots before first day */}
            {Array.from({ length: firstDayIndex }).map((_, idx) => (
              <div key={`empty-${idx}`} style={{ minHeight: '46px' }} />
            ))}

            {/* Days in Month */}
            {Array.from({ length: daysInMonth }).map((_, idx) => {
              const dNum = idx + 1;
              const cellDate = new Date(year, month, dNum);
              const dayOfWeek = cellDate.getDay();
              const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

              const isSelected =
                cellDate.getDate() === selectedDate.getDate() &&
                cellDate.getMonth() === selectedDate.getMonth() &&
                cellDate.getFullYear() === selectedDate.getFullYear();

              const today = new Date();
              const isToday =
                cellDate.getDate() === today.getDate() &&
                cellDate.getMonth() === today.getMonth() &&
                cellDate.getFullYear() === today.getFullYear();

              // Check if day has Cambodian holiday
              let holidayName = '';
              let lunarText = '';
              let lunarFullText = '';
              try {
                const lunar = toKhmerLunarDate(cellDate);
                if (lunar?.holidays && lunar.holidays.length > 0) {
                  holidayName = lunar.holidays[0].nameKm;
                }
                if (lunar?.moonDayKhmer && lunar?.moonStatus) {
                  lunarText = `${lunar.moonDayKhmer}${lunar.moonStatus}`;
                  lunarFullText = `${lunar.moonDayKhmer}${lunar.moonStatus} ខែ${lunar.khmerMonth || ''}`;
                }
              } catch (e) {}

              const isHoliday = !!holidayName;

              return (
                <button
                  key={`day-${dNum}`}
                  type="button"
                  onClick={() => handleSelectDate(cellDate)}
                  title={holidayName ? `🎉 ${holidayName} (${lunarFullText})` : `ថ្ងៃទី ${toKhmerNum(dNum)} (${lunarFullText})`}
                  style={{
                    minHeight: '46px',
                    borderRadius: '8px',
                    border: isSelected
                      ? '2px solid #2563eb'
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
                >
                  <span
                    style={{
                      fontSize: '0.84rem',
                      fontWeight: isSelected || isHoliday || isToday ? 800 : 700,
                      lineHeight: 1.1,
                      color: isSelected ? '#ffffff' : isHoliday ? '#be123c' : isWeekend ? '#e11d48' : '#0f172a',
                    }}
                  >
                    {dNum}
                  </span>

                  {/* Lunar Day or Holiday Badge */}
                  <span
                    className="kh-text"
                    style={{
                      fontSize: isHoliday ? '0.62rem' : '0.58rem',
                      color: isSelected
                        ? '#dbeafe'
                        : isHoliday
                        ? '#e11d48'
                        : '#64748b',
                      lineHeight: 1.35,
                      fontWeight: isHoliday ? 800 : 600,
                      whiteSpace: 'nowrap',
                      marginTop: '1px',
                    }}
                  >
                    {isHoliday ? '★ បុណ្យ' : lunarText}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Month Cambodian Public Holidays List */}
          <div
            style={{
              backgroundColor: '#fff1f2',
              border: '1px solid #fecdd3',
              borderRadius: '12px',
              padding: '10px 12px',
              color: '#9f1239',
              marginTop: '4px',
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
              <span>ថ្ងៃឈប់សម្រាកបុណ្យជាតិក្នុងខែនេះ៖</span>
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
                  maxHeight: '130px',
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
                        lineHeight: 1.4,
                      }}
                    >
                      • ថ្ងៃទី {toKhmerNum(h.day)}: {h.nameKm}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleSelectDate(new Date(year, month, h.day))}
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

          {/* Quick Action Footer */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              borderTop: '1px solid #f1f5f9',
              paddingTop: '8px',
              gap: '8px',
            }}
          >
            <button
              type="button"
              onClick={jumpToToday}
              className="kh-text"
              style={{
                fontSize: '0.74rem',
                fontWeight: 700,
                color: '#2563eb',
                backgroundColor: '#eff6ff',
                border: '1px solid #bfdbfe',
                borderRadius: '8px',
                padding: '6px 12px',
                cursor: 'pointer',
                lineHeight: 1.3,
                whiteSpace: 'nowrap',
              }}
            >
              📍 ទៅកាន់ថ្ងៃនេះ (Today)
            </button>

            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="kh-text"
              style={{
                fontSize: '0.74rem',
                fontWeight: 600,
                color: '#64748b',
                backgroundColor: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                padding: '6px 12px',
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
  );
}
