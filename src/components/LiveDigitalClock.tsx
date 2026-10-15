'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useRouter, useSearchParams } from 'next/navigation';
import { toKhmerLunarDate } from 'khmer-chhankitek-calendar';

const toKhmerNum = (num: number | string): string => {
  const khmerDigits = ['០', '១', '២', '៣', '៤', '៥', '៦', '៧', '៨', '៩'];
  return String(num).replace(/[0-9]/g, (d) => khmerDigits[parseInt(d, 10)]);
};

const I18N = {
  kh: {
    greetings: {
      morning: 'អរុណសួស្តី',
      afternoon: 'ទិវាសួស្តី',
      evening: 'សាយណ្ហសួស្តី',
      night: 'រាត្រីសួស្តី',
    },
    city: 'រាជធានីភ្នំពេញ',
    live: 'ផ្សាយផ្ទាល់',
    filtered: 'កំពុងច្រោះ',
    returnToLive: 'ត្រឡប់ទៅថ្ងៃជាក់ស្តែង',
    modalTitle: 'ប្រតិទិនចន្ទគតិ និងថ្ងៃឈប់សម្រាកបុណ្យជាតិកម្ពុជា',
    modalSubtitle: 'ព័ត៌មានលម្អិតផ្លូវការ នៃព្រះរាជាណាចក្រកម្ពុជា',
    yearLabel: 'ឆ្នាំ',
    weekdays: [
      { label: 'អាទិត្យ', isWeekend: true },
      { label: 'ច័ន្ទ', isWeekend: false },
      { label: 'អង្គារ', isWeekend: false },
      { label: 'ពុធ', isWeekend: false },
      { label: 'ព្រហ', isWeekend: false },
      { label: 'សុក្រ', isWeekend: false },
      { label: 'សៅរ៍', isWeekend: true },
    ],
    months: [
      'មករា', 'កុម្ភៈ', 'មីនា', 'មេសា', 'ឧសភា', 'មិថុនា',
      'កក្កដា', 'សីហា', 'កញ្ញា', 'តុលា', 'វិច្ឆិកា', 'ធ្នូ'
    ],
    detailsTitle: 'ព័ត៌មានលម្អិតកាលបរិច្ឆេទ',
    publicHolidayBadge: 'ថ្ងៃឈប់សម្រាកបុណ្យជាតិ',
    silDayBadge: 'ថ្ងៃសីល',
    workDayBadge: 'ថ្ងៃធ្វើការធម្មតា',
    solarLabel: 'សូរិយគតិ៖',
    lunarLabel: 'ចន្ទគតិខ្មែរ៖',
    eraLabel: 'ពុទ្ធសករាជ៖',
    filterDashboardBtn: 'ច្រោះទិន្នន័យថ្ងៃនេះលើ Dashboard ➔',
    holidaysInMonthTitle: 'បញ្ជីថ្ងៃឈប់សម្រាកបុណ្យជាតិក្នុងខែ',
    holidaysCountSuffix: 'ថ្ងៃបុណ្យ',
    noHolidaysInMonth: 'គ្មានថ្ងៃឈប់សម្រាកបុណ្យជាតិផ្លូវការក្នុងខែនេះទេ',
    selectBtn: 'ជ្រើសរើស ➔',
    todayLegend: 'ថ្ងៃនេះ',
    holidayLegend: 'ថ្ងៃឈប់សម្រាកបុណ្យជាតិ',
    silDayLegend: 'ថ្ងៃសីល',
    todayLiveBtn: 'ត្រឡប់ទៅថ្ងៃជាក់ស្តែង',
    closeBtn: 'បិទ',
    dayPrefix: 'ថ្ងៃទី',
  },
  en: {
    greetings: {
      morning: 'Good Morning',
      afternoon: 'Good Afternoon',
      evening: 'Good Evening',
      night: 'Good Night',
    },
    city: 'Phnom Penh',
    live: 'LIVE',
    filtered: 'Filtered',
    returnToLive: 'Back to Today',
    modalTitle: 'Cambodia Calendar & Public Holidays',
    modalSubtitle: 'Kingdom of Cambodia Official Holidays',
    yearLabel: 'Year',
    weekdays: [
      { label: 'Sun', isWeekend: true },
      { label: 'Mon', isWeekend: false },
      { label: 'Tue', isWeekend: false },
      { label: 'Wed', isWeekend: false },
      { label: 'Thu', isWeekend: false },
      { label: 'Fri', isWeekend: false },
      { label: 'Sat', isWeekend: true },
    ],
    months: [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ],
    detailsTitle: 'Date Details',
    publicHolidayBadge: 'Public Holiday',
    silDayBadge: 'Sabbath Day',
    workDayBadge: 'Working Day',
    solarLabel: 'Solar Date:',
    lunarLabel: 'Khmer Lunar:',
    eraLabel: 'Buddhist Era:',
    filterDashboardBtn: 'Filter Dashboard for this Date ➔',
    holidaysInMonthTitle: 'Public Holidays in',
    holidaysCountSuffix: 'Holidays',
    noHolidaysInMonth: 'No official public holidays in this month',
    selectBtn: 'Select ➔',
    todayLegend: 'Today',
    holidayLegend: 'Public Holiday',
    silDayLegend: 'Sabbath Day',
    todayLiveBtn: 'Back to Today',
    closeBtn: 'Close',
    dayPrefix: 'Day',
  },
  zh: {
    greetings: {
      morning: '早上好',
      afternoon: '下午好',
      evening: '晚上好',
      night: '晚安',
    },
    city: '金边',
    live: '实时',
    filtered: '已筛选',
    returnToLive: '返回今天',
    modalTitle: '柬埔寨日历与法定公休日',
    modalSubtitle: '柬埔寨王国官方公共假日资讯',
    yearLabel: '年',
    weekdays: [
      { label: '日', isWeekend: true },
      { label: '一', isWeekend: false },
      { label: '二', isWeekend: false },
      { label: '三', isWeekend: false },
      { label: '四', isWeekend: false },
      { label: '五', isWeekend: false },
      { label: '六', isWeekend: true },
    ],
    months: [
      '一月', '二月', '三月', '四月', '五月', '六月',
      '七月', '八月', '九月', '十月', '十一月', '十二月'
    ],
    detailsTitle: '日期详情',
    publicHolidayBadge: '法定公休日',
    silDayBadge: '佛戒日',
    workDayBadge: '正常工作日',
    solarLabel: '公历日期：',
    lunarLabel: '高棉农历：',
    eraLabel: '佛历纪年：',
    filterDashboardBtn: '以此日期筛选仪表板 ➔',
    holidaysInMonthTitle: '本月法定节假日：',
    holidaysCountSuffix: '天假期',
    noHolidaysInMonth: '本月无官方公共节假日',
    selectBtn: '选择 ➔',
    todayLegend: '今天',
    holidayLegend: '法定假日',
    silDayLegend: '佛戒日',
    todayLiveBtn: '返回今天',
    closeBtn: '关闭',
    dayPrefix: '',
  },
};

export default function LiveDigitalClock({
  locale = 'kh',
  actualDateStr = '',
  isCustomFiltered = false,
}: {
  locale?: string;
  actualDateStr?: string;
  isCustomFiltered?: boolean;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Active translation set
  const currentLocale = (locale === 'en' || locale === 'zh') ? locale : 'kh';
  const t = I18N[currentLocale];

  // Live walking clock state (Real-time Date & Time)
  const [now, setNow] = useState<Date | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Parse custom date string (YYYY-MM-DD)
  const parseDate = (str: string) => {
    if (!str) return new Date();
    const parts = str.split('-');
    if (parts.length === 3) {
      return new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
    }
    return new Date();
  };

  // Timer for walking real-time clock
  useEffect(() => {
    setMounted(true);
    setNow(new Date());
    const timer = setInterval(() => {
      setNow(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Effective active date:
  // IF NOT custom filtered -> ALWAYS use `now` (100% LIVE real-time current date!)
  // IF custom filtered -> use the filtered date
  const liveDate = now || new Date();
  const activeDate = isCustomFiltered && actualDateStr ? parseDate(actualDateStr) : liveDate;

  // Modal view month state (defaults to activeDate's month)
  const [viewDate, setViewDate] = useState<Date>(
    new Date(activeDate.getFullYear(), activeDate.getMonth(), 1)
  );

  // Currently inspected day in the modal
  const [inspectedDate, setInspectedDate] = useState<Date>(activeDate);

  // Sync viewDate and inspectedDate when activeDate changes
  useEffect(() => {
    setInspectedDate(activeDate);
    setViewDate(new Date(activeDate.getFullYear(), activeDate.getMonth(), 1));
  }, [actualDateStr, isCustomFiltered]);

  // Lock body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
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
          ⏳ ...
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

  // Greeting based on time of day (SINGLE LANGUAGE ONLY)
  let greeting = t.greetings.morning;
  let greetingIcon = '☀️';

  if (hours >= 12 && hours < 17) {
    greeting = t.greetings.afternoon;
    greetingIcon = '🌤️';
  } else if (hours >= 17 && hours < 21) {
    greeting = t.greetings.evening;
    greetingIcon = '🌆';
  } else if (hours >= 21 || hours < 5) {
    greeting = t.greetings.night;
    greetingIcon = '🌙';
  }

  // Active Date info for main header bar
  let activeHolidayName = '';
  let activeLunarShort = '';

  try {
    const lunar = toKhmerLunarDate(activeDate);
    if (lunar?.holidays && lunar.holidays.length > 0) {
      // Pick language-specific holiday name
      if (currentLocale === 'en') {
        activeHolidayName = lunar.holidays[0].nameEn || lunar.holidays[0].nameKm;
      } else {
        activeHolidayName = lunar.holidays[0].nameKm;
      }
    }
    if (lunar?.moonDayKhmer && lunar?.moonStatus) {
      if (currentLocale === 'kh') {
        activeLunarShort = `${lunar.moonDayKhmer}${lunar.moonStatus} ខែ${lunar.khmerMonth || ''}`;
      } else if (currentLocale === 'en') {
        activeLunarShort = `${lunar.moonDay} ${lunar.moonStatus === 'កើត' ? 'Waxing' : 'Waning'} ${lunar.khmerMonth || ''}`;
      } else {
        activeLunarShort = `农历${lunar.moonDay}${lunar.moonStatus === 'កើត' ? '初' : '望'}`;
      }
    }
  } catch (e) {}

  // Single-language Active Date formatting
  let activeDateTitle = '';
  let activeDateSub = '';

  if (currentLocale === 'kh') {
    const khDays = ['អាទិត្យ', 'ច័ន្ទ', 'អង្គារ', 'ពុធ', 'ព្រហស្បតិ៍', 'សុក្រ', 'សៅរ៍'];
    activeDateTitle = `ថ្ងៃ${khDays[activeDate.getDay()]} ទី${toKhmerNum(activeDate.getDate())} ខែ${t.months[activeDate.getMonth()]} ឆ្នាំ${toKhmerNum(activeDate.getFullYear())}`;
    activeDateSub = activeLunarShort;
  } else if (currentLocale === 'en') {
    activeDateTitle = activeDate.toLocaleDateString('en-US', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
    activeDateSub = `${String(activeDate.getDate()).padStart(2, '0')}/${String(activeDate.getMonth() + 1).padStart(2, '0')}/${activeDate.getFullYear()}`;
  } else {
    activeDateTitle = `${activeDate.getFullYear()}年${activeDate.getMonth() + 1}月${activeDate.getDate()}日`;
    activeDateSub = activeLunarShort;
  }

  // Modal month navigation
  const prevMonth = () => {
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1));
  };

  // Select date: updates inspection card & applies dashboard filter
  const handleSelectDateAndFilter = (date: Date) => {
    setInspectedDate(date);
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    const formatted = `${y}-${m}-${d}`;

    const currentParams = new URLSearchParams(searchParams.toString());
    currentParams.set('date', formatted);
    setIsOpen(false);
    router.push(`/dashboard?${currentParams.toString()}`);
  };

  // Jump to Today (LIVE) - Clears any date filter and restores 100% LIVE mode
  const handleJumpToToday = () => {
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

  // List ALL holidays in view month with full details (SINGLE LANGUAGE)
  const monthHolidays: Array<{
    day: number;
    dateObj: Date;
    name: string;
    solarDateText: string;
    lunarText: string;
  }> = [];

  for (let d = 1; d <= daysInMonth; d++) {
    try {
      const cellDate = new Date(viewYear, viewMonth, d);
      const lunar = toKhmerLunarDate(cellDate);
      if (lunar?.holidays && lunar.holidays.length > 0) {
        const holidayName = currentLocale === 'en'
          ? (lunar.holidays[0].nameEn || lunar.holidays[0].nameKm)
          : lunar.holidays[0].nameKm;

        let solarText = '';
        let lunarDesc = '';
        if (currentLocale === 'kh') {
          solarText = `ថ្ងៃទី ${toKhmerNum(d)} ខែ${t.months[viewMonth]} ឆ្នាំ${toKhmerNum(viewYear)}`;
          lunarDesc = lunar.lunarDateText || `${lunar.moonDayKhmer}${lunar.moonStatus}`;
        } else if (currentLocale === 'en') {
          solarText = `${d} ${t.months[viewMonth]} ${viewYear}`;
          lunarDesc = `${lunar.moonDay} ${lunar.moonStatus === 'កើត' ? 'Waxing Moon' : 'Waning Moon'}`;
        } else {
          solarText = `${viewYear}年${viewMonth + 1}月${d}日`;
          lunarDesc = `农历${lunar.moonDay}`;
        }

        monthHolidays.push({
          day: d,
          dateObj: cellDate,
          name: holidayName,
          solarDateText: solarText,
          lunarText: lunarDesc,
        });
      }
    } catch (e) {}
  }

  // Inspected Date details (SINGLE LANGUAGE)
  let inspectedHolidayName = '';
  let inspectedGregorianText = '';
  let inspectedLunarFullText = '';
  let inspectedAnimalYear = '';
  let inspectedSak = '';
  let inspectedBuddhistEra = '';
  let inspectedIsSilDay = false;

  try {
    const inspectedLunar = toKhmerLunarDate(inspectedDate);
    if (inspectedLunar?.holidays && inspectedLunar.holidays.length > 0) {
      inspectedHolidayName = currentLocale === 'en'
        ? (inspectedLunar.holidays[0].nameEn || inspectedLunar.holidays[0].nameKm)
        : inspectedLunar.holidays[0].nameKm;
    }
    if (currentLocale === 'kh') {
      inspectedGregorianText = inspectedLunar?.gregorianDateText || '';
      inspectedLunarFullText = inspectedLunar?.lunarDateText || '';
      inspectedAnimalYear = inspectedLunar?.animalYear || '';
      inspectedSak = inspectedLunar?.sak || '';
      inspectedBuddhistEra = inspectedLunar?.buddhistEraYearKhmer || '';
    } else if (currentLocale === 'en') {
      inspectedGregorianText = inspectedDate.toLocaleDateString('en-US', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      });
      inspectedLunarFullText = `${inspectedLunar?.moonDay} ${inspectedLunar?.moonStatus === 'កើត' ? 'Waxing Moon' : 'Waning Moon'}, Month of ${inspectedLunar?.khmerMonth || ''}`;
      inspectedAnimalYear = inspectedLunar?.animalYear || '';
      inspectedSak = inspectedLunar?.sak || '';
      inspectedBuddhistEra = String(inspectedLunar?.buddhistEraYear || '');
    } else {
      inspectedGregorianText = `${inspectedDate.getFullYear()}年${inspectedDate.getMonth() + 1}月${inspectedDate.getDate()}日`;
      inspectedLunarFullText = `农历${inspectedLunar?.moonDay}`;
      inspectedAnimalYear = inspectedLunar?.animalYear || '';
      inspectedSak = inspectedLunar?.sak || '';
      inspectedBuddhistEra = String(inspectedLunar?.buddhistEraYear || '');
    }
    inspectedIsSilDay = !!inspectedLunar?.isSilDay;
  } catch (e) {}

  return (
    <>
      {/* =========================================================================
          MAIN EXECUTIVE HEADER BAR (Merged Clock & Interactive Calendar Button)
          ========================================================================= */}
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
          @keyframes modalPopUp {
            from {
              opacity: 0;
              transform: scale(0.94) translateY(14px);
            }
            to {
              opacity: 1;
              transform: scale(1) translateY(0);
            }
          }
        `}</style>

        {/* 1. Left: Greeting & Location (SINGLE LANGUAGE) */}
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
                fontSize: '0.78rem',
                fontWeight: 800,
                color: '#0369a1',
                whiteSpace: 'nowrap',
                lineHeight: 1.3,
              }}
            >
              {greeting}
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
              <span>{t.city}</span>
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
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <button
            type="button"
            onClick={() => {
              setViewDate(new Date(activeDate.getFullYear(), activeDate.getMonth(), 1));
              setInspectedDate(activeDate);
              setIsOpen(true);
            }}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '10px',
              backgroundColor: isCustomFiltered
                ? '#fffbeb'
                : activeHolidayName
                ? '#fff1f2'
                : '#f8fafc',
              border: `1.5px solid ${
                isCustomFiltered
                  ? '#f59e0b'
                  : activeHolidayName
                  ? '#fecdd3'
                  : '#cbd5e1'
              }`,
              borderRadius: '10px',
              padding: '5px 12px',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
              outline: 'none',
              textAlign: 'left',
            }}
            className="hover-elevate"
            title={t.detailsTitle}
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

            {/* Text Summary (SINGLE LANGUAGE) */}
            <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
              {/* Top row: Date in Active Language & Mode/Holiday Pill */}
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
                  {activeDateTitle}
                </span>

                {/* LIVE Badge or Filtered Badge */}
                {!isCustomFiltered ? (
                  <span
                    style={{
                      fontSize: '0.62rem',
                      fontWeight: 800,
                      color: '#15803d',
                      backgroundColor: '#dcfce7',
                      border: '1px solid #bbf7d0',
                      padding: '1px 6px',
                      borderRadius: '999px',
                      whiteSpace: 'nowrap',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '3px',
                    }}
                  >
                    <span
                      style={{
                        width: '5px',
                        height: '5px',
                        borderRadius: '50%',
                        backgroundColor: '#16a34a',
                      }}
                    />
                    {t.live}
                  </span>
                ) : (
                  <span
                    className="kh-text"
                    style={{
                      fontSize: '0.62rem',
                      fontWeight: 800,
                      color: '#b45309',
                      backgroundColor: '#fef3c7',
                      border: '1px solid #fde68a',
                      padding: '1px 6px',
                      borderRadius: '999px',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    🔍 {t.filtered}
                  </span>
                )}

                {/* Holiday Pill */}
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

              {/* Bottom row: Sub information */}
              {activeDateSub && (
                <div
                  style={{
                    fontSize: '0.66rem',
                    color: '#64748b',
                    whiteSpace: 'nowrap',
                    marginTop: '1px',
                    fontWeight: 600,
                  }}
                >
                  <span className="kh-text" style={{ color: '#0284c7', fontWeight: 700 }}>
                    {activeDateSub}
                  </span>
                </div>
              )}
            </div>

            {/* Dropdown Chevron */}
            <span
              style={{
                fontSize: '0.7rem',
                color: activeHolidayName ? '#be123c' : '#64748b',
                marginLeft: '4px',
                flexShrink: 0,
              }}
            >
              ▼
            </span>
          </button>

          {/* If custom filtered, offer instant 1-click button to reset back to LIVE */}
          {isCustomFiltered && (
            <button
              type="button"
              onClick={handleJumpToToday}
              className="kh-text hover-elevate"
              style={{
                backgroundColor: '#16a34a',
                color: '#ffffff',
                border: 'none',
                borderRadius: '8px',
                padding: '6px 12px',
                fontSize: '0.72rem',
                fontWeight: 800,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                whiteSpace: 'nowrap',
                boxShadow: '0 2px 6px rgba(22, 163, 74, 0.3)',
                height: '42px',
              }}
              title={t.returnToLive}
            >
              <span>🔴</span>
              <span>{t.returnToLive}</span>
            </button>
          )}
        </div>
      </div>

      {/* =========================================================================
          POP-UP MODAL (Rendered at root document.body via Portal - SINGLE LANGUAGE)
          ========================================================================= */}
      {isOpen && mounted && createPortal(
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.75)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
            zIndex: 99999999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
          }}
          onClick={() => setIsOpen(false)}
        >
          <div
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '24px',
              width: '920px',
              maxWidth: '96vw',
              maxHeight: '90vh',
              boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.45), 0 10px 25px rgba(0,0,0,0.1)',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
              border: '1px solid #cbd5e1',
              animation: 'modalPopUp 0.22s cubic-bezier(0.16, 1, 0.3, 1)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Top Header (SINGLE LANGUAGE) */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '16px 24px',
                borderBottom: '1px solid #e2e8f0',
                background: 'linear-gradient(180deg, #f8fafc 0%, #ffffff 100%)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div
                  style={{
                    width: '42px',
                    height: '42px',
                    borderRadius: '12px',
                    background: 'linear-gradient(135deg, #1e40af 0%, #2563eb 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.3rem',
                    boxShadow: '0 4px 10px rgba(37, 99, 235, 0.25)',
                    color: '#ffffff',
                  }}
                >
                  🗓️
                </div>
                <div>
                  <h2
                    className="kh-text"
                    style={{
                      margin: 0,
                      fontSize: '1.15rem',
                      fontWeight: 800,
                      color: '#0f172a',
                      lineHeight: 1.25,
                    }}
                  >
                    {t.modalTitle}
                  </h2>
                  <p
                    className="kh-text"
                    style={{
                      margin: '2px 0 0 0',
                      fontSize: '0.74rem',
                      color: '#64748b',
                    }}
                  >
                    {t.modalSubtitle} • {t.yearLabel} {currentLocale === 'kh' ? toKhmerNum(viewYear) : viewYear}
                  </p>
                </div>
              </div>

              {/* Close Button */}
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '10px',
                  border: '1px solid #e2e8f0',
                  backgroundColor: '#f8fafc',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.1rem',
                  color: '#64748b',
                  transition: 'all 0.15s ease',
                }}
                className="hover-elevate"
                title={t.closeBtn}
              >
                ✕
              </button>
            </div>

            {/* Modal Body: 2 Columns */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1.05fr 1.15fr',
                gap: '20px',
                padding: '20px 24px',
                overflowY: 'auto',
                flex: 1,
              }}
            >
              {/* =========================================================
                  LEFT COLUMN: Interactive Monthly Calendar
                  ========================================================= */}
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                  backgroundColor: '#ffffff',
                  borderRadius: '16px',
                  border: '1px solid #e2e8f0',
                  padding: '16px',
                  boxShadow: '0 2px 8px rgba(15, 23, 42, 0.03)',
                }}
              >
                {/* Month Navigator Header (SINGLE LANGUAGE) */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    borderBottom: '1px solid #f1f5f9',
                    paddingBottom: '10px',
                  }}
                >
                  <button
                    type="button"
                    onClick={prevMonth}
                    style={{
                      width: '34px',
                      height: '34px',
                      borderRadius: '8px',
                      border: '1px solid #e2e8f0',
                      backgroundColor: '#f8fafc',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '0.9rem',
                      color: '#334155',
                      transition: 'all 0.15s',
                    }}
                    className="hover-elevate"
                  >
                    ◀
                  </button>

                  <div style={{ textAlign: 'center' }}>
                    <div
                      className="kh-text"
                      style={{
                        fontSize: '1rem',
                        fontWeight: 800,
                        color: '#0f172a',
                        lineHeight: 1.2,
                      }}
                    >
                      {currentLocale === 'kh'
                        ? `ខែ${t.months[viewMonth]} ឆ្នាំ ${toKhmerNum(viewYear)}`
                        : `${t.months[viewMonth]} ${viewYear}`}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={nextMonth}
                    style={{
                      width: '34px',
                      height: '34px',
                      borderRadius: '8px',
                      border: '1px solid #e2e8f0',
                      backgroundColor: '#f8fafc',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '0.9rem',
                      color: '#334155',
                      transition: 'all 0.15s',
                    }}
                    className="hover-elevate"
                  >
                    ▶
                  </button>
                </div>

                {/* Weekdays Row (SINGLE LANGUAGE) */}
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(7, 1fr)',
                    textAlign: 'center',
                    fontSize: '0.74rem',
                    fontWeight: 800,
                    padding: '8px 0',
                    backgroundColor: '#f8fafc',
                    borderRadius: '8px',
                    border: '1px solid #f1f5f9',
                  }}
                >
                  {t.weekdays.map((w, idx) => (
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
                  {/* Empty slots */}
                  {Array.from({ length: firstDayIndex }).map((_, idx) => (
                    <div key={`empty-${idx}`} style={{ minHeight: '48px' }} />
                  ))}

                  {/* Days */}
                  {Array.from({ length: daysInMonth }).map((_, idx) => {
                    const dNum = idx + 1;
                    const cellDate = new Date(viewYear, viewMonth, dNum);
                    const dayOfWeek = cellDate.getDay();
                    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

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
                        holidayName = currentLocale === 'en'
                          ? (lunar.holidays[0].nameEn || lunar.holidays[0].nameKm)
                          : lunar.holidays[0].nameKm;
                      }
                      if (lunar?.moonDayKhmer && lunar?.moonStatus) {
                        if (currentLocale === 'kh') {
                          lunarText = `${lunar.moonDayKhmer}${lunar.moonStatus}`;
                        } else if (currentLocale === 'en') {
                          lunarText = `${lunar.moonDay}${lunar.moonStatus === 'កើត' ? 'W' : 'R'}`;
                        } else {
                          lunarText = `${lunar.moonDay}`;
                        }
                      }
                      isSilDay = !!lunar?.isSilDay;
                    } catch (e) {}

                    const isHoliday = !!holidayName;

                    return (
                      <button
                        key={`cell-${dNum}`}
                        type="button"
                        onClick={() => setInspectedDate(cellDate)}
                        style={{
                          minHeight: '48px',
                          borderRadius: '8px',
                          border: isInspected
                            ? '2px solid #2563eb'
                            : isToday
                            ? '2px solid #16a34a'
                            : isHoliday
                            ? '1.5px solid #fda4af'
                            : '1px solid #f1f5f9',
                          backgroundColor: isInspected
                            ? '#2563eb'
                            : isHoliday
                            ? '#fff1f2'
                            : isToday
                            ? '#f0fdf4'
                            : '#ffffff',
                          color: isInspected
                            ? '#ffffff'
                            : isHoliday
                            ? '#be123c'
                            : isToday
                            ? '#15803d'
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
                          boxShadow: isInspected
                            ? '0 3px 8px rgba(37, 99, 235, 0.3)'
                            : isHoliday
                            ? '0 1px 3px rgba(244, 63, 94, 0.1)'
                            : 'none',
                        }}
                        title={holidayName || `${t.dayPrefix} ${dNum}`}
                      >
                        <span
                          style={{
                            fontSize: '0.86rem',
                            fontWeight: isInspected || isHoliday || isToday ? 800 : 700,
                            lineHeight: 1.1,
                          }}
                        >
                          {dNum}
                        </span>

                        <span
                          className="kh-text"
                          style={{
                            fontSize: isHoliday ? '0.62rem' : '0.58rem',
                            color: isInspected
                              ? '#dbeafe'
                              : isHoliday
                              ? '#e11d48'
                              : isToday
                              ? '#16a34a'
                              : isSilDay
                              ? '#d97706'
                              : '#64748b',
                            lineHeight: 1.35,
                            fontWeight: isHoliday || isSilDay || isToday ? 800 : 600,
                            whiteSpace: 'nowrap',
                            marginTop: '1px',
                          }}
                        >
                          {isToday
                            ? `● ${t.todayLegend}`
                            : isHoliday
                            ? '★'
                            : isSilDay
                            ? '☸'
                            : lunarText}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {/* Calendar Legend / Guide */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-around',
                    fontSize: '0.66rem',
                    color: '#64748b',
                    paddingTop: '8px',
                    borderTop: '1px solid #f1f5f9',
                  }}
                >
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#16a34a' }} />
                    {t.todayLegend}
                  </span>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#e11d48' }} />
                    ★ {t.holidayLegend}
                  </span>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#d97706' }} />
                    ☸ {t.silDayLegend}
                  </span>
                </div>
              </div>

              {/* =========================================================
                  RIGHT COLUMN: Full Holiday List & Day Details
                  ========================================================= */}
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '14px',
                  overflowY: 'auto',
                  maxHeight: '100%',
                  paddingRight: '4px',
                }}
              >
                {/* 1. Inspected Day Details Card (SINGLE LANGUAGE) */}
                <div
                  style={{
                    backgroundColor: inspectedHolidayName ? '#fff1f2' : '#f8fafc',
                    border: `1.5px solid ${inspectedHolidayName ? '#fecdd3' : '#e2e8f0'}`,
                    borderRadius: '16px',
                    padding: '14px 16px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '10px',
                    boxShadow: '0 2px 6px rgba(15, 23, 42, 0.03)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                    <div
                      className="kh-text"
                      style={{
                        fontSize: '0.84rem',
                        fontWeight: 800,
                        color: '#0f172a',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                      }}
                    >
                      <span>📌</span>
                      <span>{t.detailsTitle}</span>
                    </div>

                    {inspectedHolidayName ? (
                      <span
                        className="kh-text"
                        style={{
                          fontSize: '0.68rem',
                          fontWeight: 800,
                          color: '#be123c',
                          backgroundColor: '#ffe4e6',
                          border: '1px solid #fecdd3',
                          padding: '2px 10px',
                          borderRadius: '999px',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        🎉 {t.publicHolidayBadge}
                      </span>
                    ) : inspectedIsSilDay ? (
                      <span
                        className="kh-text"
                        style={{
                          fontSize: '0.68rem',
                          fontWeight: 800,
                          color: '#d97706',
                          backgroundColor: '#fef3c7',
                          border: '1px solid #fde68a',
                          padding: '2px 10px',
                          borderRadius: '999px',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        ☸️ {t.silDayBadge}
                      </span>
                    ) : (
                      <span
                        className="kh-text"
                        style={{
                          fontSize: '0.68rem',
                          fontWeight: 700,
                          color: '#0284c7',
                          backgroundColor: '#e0f2fe',
                          border: '1px solid #bae6fd',
                          padding: '2px 10px',
                          borderRadius: '999px',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        💼 {t.workDayBadge}
                      </span>
                    )}
                  </div>

                  {/* Holiday Title Banner if Holiday */}
                  {inspectedHolidayName && (
                    <div
                      style={{
                        backgroundColor: '#ffffff',
                        border: '1px solid #fda4af',
                        borderRadius: '10px',
                        padding: '10px 12px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                      }}
                    >
                      <span style={{ fontSize: '1.5rem' }}>🇰🇭</span>
                      <div>
                        <div
                          className="kh-text"
                          style={{
                            fontSize: '0.88rem',
                            fontWeight: 800,
                            color: '#9f1239',
                            lineHeight: 1.35,
                          }}
                        >
                          {inspectedHolidayName}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Details Field List (SINGLE LANGUAGE) */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '6px', fontSize: '0.74rem' }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                      <span style={{ color: '#64748b', fontWeight: 600, minWidth: '95px' }} className="kh-text">
                        {t.solarLabel}
                      </span>
                      <span style={{ color: '#0f172a', fontWeight: 700 }} className="kh-text">
                        {inspectedGregorianText}
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                      <span style={{ color: '#64748b', fontWeight: 600, minWidth: '95px' }} className="kh-text">
                        {t.lunarLabel}
                      </span>
                      <span style={{ color: '#0369a1', fontWeight: 700 }} className="kh-text">
                        {inspectedLunarFullText}
                      </span>
                    </div>

                    {inspectedBuddhistEra && (
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                        <span style={{ color: '#64748b', fontWeight: 600, minWidth: '95px' }} className="kh-text">
                          {t.eraLabel}
                        </span>
                        <span style={{ color: '#475569', fontWeight: 600 }} className="kh-text">
                          {currentLocale === 'kh'
                            ? `ឆ្នាំ${inspectedAnimalYear} ${inspectedSak} ពុទ្ធសករាជ ${inspectedBuddhistEra}`
                            : `${inspectedAnimalYear} Year, Buddhist Era ${inspectedBuddhistEra}`}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Filter Action for this inspected day */}
                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '4px' }}>
                    <button
                      type="button"
                      onClick={() => handleSelectDateAndFilter(inspectedDate)}
                      className="kh-text hover-elevate"
                      style={{
                        backgroundColor: '#2563eb',
                        color: '#ffffff',
                        border: 'none',
                        borderRadius: '8px',
                        padding: '6px 14px',
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        boxShadow: '0 2px 6px rgba(37, 99, 235, 0.25)',
                      }}
                    >
                      <span>🔍</span>
                      <span>{t.filterDashboardBtn}</span>
                    </button>
                  </div>
                </div>

                {/* 2. Full Month Holidays List (SINGLE LANGUAGE) */}
                <div
                  style={{
                    backgroundColor: '#ffffff',
                    border: '1px solid #fecdd3',
                    borderRadius: '16px',
                    padding: '14px 16px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '10px',
                    boxShadow: '0 2px 6px rgba(244, 63, 94, 0.05)',
                  }}
                >
                  <div
                    className="kh-text"
                    style={{
                      fontSize: '0.84rem',
                      fontWeight: 800,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      color: '#be123c',
                    }}
                  >
                    <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span>🎉</span>
                      <span>{t.holidaysInMonthTitle} {t.months[viewMonth]}៖</span>
                    </span>
                    <span
                      style={{
                        fontSize: '0.68rem',
                        backgroundColor: '#ffe4e6',
                        color: '#be123c',
                        padding: '2px 8px',
                        borderRadius: '999px',
                        fontWeight: 800,
                      }}
                    >
                      {currentLocale === 'kh' ? toKhmerNum(monthHolidays.length) : monthHolidays.length} {t.holidaysCountSuffix}
                    </span>
                  </div>

                  {monthHolidays.length === 0 ? (
                    <div
                      className="kh-text"
                      style={{
                        color: '#64748b',
                        fontSize: '0.74rem',
                        padding: '16px',
                        textAlign: 'center',
                        backgroundColor: '#f8fafc',
                        borderRadius: '8px',
                      }}
                    >
                      {t.noHolidaysInMonth}
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {monthHolidays.map((h) => (
                        <div
                          key={`holiday-${h.day}`}
                          style={{
                            backgroundColor: '#fff1f2',
                            border: '1px solid #fecdd3',
                            borderRadius: '10px',
                            padding: '10px 12px',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '6px',
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '10px' }}>
                            <div>
                              <div
                                className="kh-text"
                                style={{
                                  fontSize: '0.84rem',
                                  fontWeight: 800,
                                  color: '#9f1239',
                                  lineHeight: 1.35,
                                }}
                              >
                                • {h.name}
                              </div>
                            </div>

                            <button
                              type="button"
                              onClick={() => handleSelectDateAndFilter(h.dateObj)}
                              className="kh-text hover-elevate"
                              style={{
                                backgroundColor: '#be123c',
                                color: '#ffffff',
                                border: 'none',
                                borderRadius: '6px',
                                padding: '4px 10px',
                                fontSize: '0.66rem',
                                fontWeight: 700,
                                cursor: 'pointer',
                                whiteSpace: 'nowrap',
                                flexShrink: 0,
                                boxShadow: '0 2px 4px rgba(190, 18, 60, 0.25)',
                              }}
                            >
                              {t.selectBtn}
                            </button>
                          </div>

                          <div
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '10px',
                              fontSize: '0.68rem',
                              color: '#64748b',
                              borderTop: '1px dashed #fecdd3',
                              paddingTop: '4px',
                            }}
                          >
                            <span className="kh-text" style={{ fontWeight: 700, color: '#0f172a' }}>
                              📅 {h.solarDateText}
                            </span>
                            <span>•</span>
                            <span className="kh-text" style={{ color: '#0369a1', fontWeight: 700 }}>
                              🌙 {h.lunarText}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Modal Bottom Footer (SINGLE LANGUAGE) */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px 24px',
                borderTop: '1px solid #e2e8f0',
                backgroundColor: '#f8fafc',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <button
                  type="button"
                  onClick={handleJumpToToday}
                  className="kh-text hover-elevate"
                  style={{
                    fontSize: '0.74rem',
                    fontWeight: 800,
                    color: '#15803d',
                    backgroundColor: '#dcfce7',
                    border: '1px solid #bbf7d0',
                    borderRadius: '8px',
                    padding: '7px 14px',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '5px',
                  }}
                >
                  <span>📍</span>
                  <span>{t.todayLiveBtn}</span>
                </button>
              </div>

              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="kh-text hover-elevate"
                style={{
                  fontSize: '0.74rem',
                  fontWeight: 700,
                  color: '#475569',
                  backgroundColor: '#ffffff',
                  border: '1px solid #cbd5e1',
                  borderRadius: '8px',
                  padding: '7px 16px',
                  cursor: 'pointer',
                }}
              >
                {t.closeBtn}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
