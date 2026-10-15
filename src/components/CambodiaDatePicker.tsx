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

const DAYS_KH = ['អាទិត្យ', 'ចន្ទ', 'អង្គារ', 'ពុធ', 'ព្រហស្បតិ៍', 'សុក្រ', 'សៅរ៍'];

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
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => {
          setViewDate(new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1));
          setIsOpen(!isOpen);
        }}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          backgroundColor: selectedHolidayName ? '#fff1f2' : '#ffffff',
          border: `1.5px solid ${selectedHolidayName ? '#f43f5e' : '#cbd5e1'}`,
          borderRadius: '10px',
          padding: '5px 12px',
          height: '46px',
          cursor: 'pointer',
          boxShadow: '0 1px 3px rgba(15, 23, 42, 0.05)',
          transition: 'all 0.15s ease',
          outline: 'none',
        }}
        title="ចុចដើម្បីជ្រើសរើសកាលបរិច្ឆេទ និងមើលថ្ងៃឈប់សម្រាកបុណ្យជាតិ"
      >
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <span style={{ fontSize: '0.85rem' }}>📅</span>
            <span
              className="kh-text"
              style={{
                fontSize: '0.66rem',
                color: selectedHolidayName ? '#be123c' : '#64748b',
                fontWeight: 700,
                lineHeight: 1.1,
              }}
            >
              {selectedHolidayName ? '🇰🇭 ថ្ងៃឈប់សម្រាកបុណ្យជាតិ' : 'កាលបរិច្ឆេទជាក់ស្តែង'}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '1px' }}>
            <span
              style={{
                fontSize: '0.82rem',
                fontWeight: 800,
                color: '#0f172a',
                fontFamily: 'monospace',
                lineHeight: 1.2,
              }}
            >
              {selectedDayFormatted}
            </span>

            {selectedHolidayName && (
              <span
                className="kh-text"
                style={{
                  fontSize: '0.66rem',
                  fontWeight: 800,
                  color: '#9f1239',
                  backgroundColor: '#ffe4e6',
                  padding: '1px 6px',
                  borderRadius: '4px',
                  border: '1px solid #fecdd3',
                  whiteSpace: 'nowrap',
                  maxWidth: '140px',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  lineHeight: 1.3,
                }}
              >
                {selectedHolidayName}
              </span>
            )}
          </div>
        </div>

        <span
          style={{
            fontSize: '0.65rem',
            color: '#64748b',
            marginLeft: '4px',
            transform: isOpen ? 'rotate(180deg)' : 'none',
            transition: 'transform 0.2s ease',
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
            top: '52px',
            right: 0,
            width: '340px',
            backgroundColor: '#ffffff',
            borderRadius: '16px',
            border: '1px solid #e2e8f0',
            boxShadow: '0 12px 32px -4px rgba(15, 23, 42, 0.16), 0 4px 12px rgba(15, 23, 42, 0.08)',
            zIndex: 9999,
            padding: '14px',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
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
                width: '30px',
                height: '30px',
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
                  fontSize: '0.88rem',
                  fontWeight: 800,
                  color: '#0f172a',
                  lineHeight: 1.2,
                }}
              >
                ខែ{KHMER_MONTHS[month]} ({MONTHS_EN[month]})
              </div>
              <div
                style={{
                  fontSize: '0.72rem',
                  color: '#0284c7',
                  fontWeight: 700,
                }}
              >
                ឆ្នាំ {toKhmerNum(year)} • {year}
              </div>
            </div>

            <button
              type="button"
              onClick={nextMonth}
              style={{
                width: '30px',
                height: '30px',
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

          {/* Weekday Labels */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(7, 1fr)',
              textAlign: 'center',
              fontSize: '0.68rem',
              fontWeight: 700,
              color: '#64748b',
              paddingBottom: '4px',
              borderBottom: '1px dashed #e2e8f0',
            }}
          >
            {DAYS_KH.map((d, idx) => (
              <span key={d} style={{ color: idx === 0 || idx === 6 ? '#ef4444' : '#475569' }}>
                {d.slice(0, 3)}
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
              <div key={`empty-${idx}`} style={{ height: '38px' }} />
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
              try {
                const lunar = toKhmerLunarDate(cellDate);
                if (lunar?.holidays && lunar.holidays.length > 0) {
                  holidayName = lunar.holidays[0].nameKm;
                }
                if (lunar?.moonDayKhmer && lunar?.moonStatus) {
                  lunarText = `${lunar.moonDayKhmer}${lunar.moonStatus.slice(0, 1)}`;
                }
              } catch (e) {}

              const isHoliday = !!holidayName;

              return (
                <button
                  key={`day-${dNum}`}
                  type="button"
                  onClick={() => handleSelectDate(cellDate)}
                  title={holidayName ? `🇰🇭 ${holidayName} (${lunarText})` : `ថ្ងៃទី ${dNum} (${lunarText})`}
                  style={{
                    height: '38px',
                    borderRadius: '8px',
                    border: isSelected
                      ? '2px solid #2563eb'
                      : isToday
                      ? '1.5px solid #3b82f6'
                      : isHoliday
                      ? '1px solid #fecdd3'
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
                      ? '#ef4444'
                      : '#0f172a',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '2px',
                    position: 'relative',
                    transition: 'all 0.1s ease',
                  }}
                >
                  <span
                    style={{
                      fontSize: '0.8rem',
                      fontWeight: isSelected || isHoliday || isToday ? 800 : 600,
                      lineHeight: 1.1,
                    }}
                  >
                    {dNum}
                  </span>

                  {/* Lunar Day or Holiday dot */}
                  <span
                    style={{
                      fontSize: '0.55rem',
                      color: isSelected
                        ? '#dbeafe'
                        : isHoliday
                        ? '#e11d48'
                        : '#94a3b8',
                      lineHeight: 1,
                      fontWeight: isHoliday ? 800 : 500,
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
              borderRadius: '10px',
              padding: '8px 10px',
              fontSize: '0.7rem',
              color: '#9f1239',
              marginTop: '4px',
            }}
          >
            <div
              className="kh-text"
              style={{
                fontWeight: 800,
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                marginBottom: '4px',
                color: '#be123c',
              }}
            >
              <span>🇰🇭</span>
              <span>ថ្ងៃឈប់សម្រាកបុណ្យជាតិក្នុងខែនេះ៖</span>
            </div>

            {monthHolidays.length === 0 ? (
              <div style={{ color: '#64748b', fontSize: '0.66rem' }}>
                គ្មានថ្ងៃឈប់សម្រាកបុណ្យជាតិផ្លូវការក្នុងខែនេះទេ
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                {monthHolidays.map((h) => (
                  <div
                    key={`h-${h.day}`}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      fontSize: '0.66rem',
                    }}
                  >
                    <span style={{ fontWeight: 700, color: '#9f1239' }}>
                      • ថ្ងៃទី {toKhmerNum(h.day)}: {h.nameKm}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleSelectDate(new Date(year, month, h.day))}
                      style={{
                        backgroundColor: '#ffffff',
                        border: '1px solid #fecdd3',
                        color: '#be123c',
                        borderRadius: '4px',
                        padding: '1px 5px',
                        fontSize: '0.62rem',
                        fontWeight: 700,
                        cursor: 'pointer',
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
            }}
          >
            <button
              type="button"
              onClick={jumpToToday}
              className="kh-text"
              style={{
                fontSize: '0.72rem',
                fontWeight: 700,
                color: '#2563eb',
                backgroundColor: '#eff6ff',
                border: '1px solid #bfdbfe',
                borderRadius: '6px',
                padding: '4px 10px',
                cursor: 'pointer',
              }}
            >
              📍 ទៅកាន់ថ្ងៃនេះ (Today)
            </button>

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
                borderRadius: '6px',
                padding: '4px 10px',
                cursor: 'pointer',
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
