'use client';
import React, { useState, useRef } from 'react';
import { toKhmerLunarDate } from 'khmer-chhankitek-calendar';

const HOLIDAYS: Record<string, string> = {
  '1-1': 'ទិវាចូលឆ្នាំសកល',
  '1-7': 'ទិវាជ័យជម្នះលើរបបប្រល័យពូជសាសន៍',
  '3-8': 'ទិវានារីអន្តរជាតិ',
  '4-14': 'បុណ្យចូលឆ្នាំខ្មែរ',
  '4-15': 'បុណ្យចូលឆ្នាំខ្មែរ',
  '4-16': 'បុណ្យចូលឆ្នាំខ្មែរ',
  '5-1': 'ទិវាពលកម្មអន្តរជាតិ',
  '5-14': 'ព្រះរាជពិធីចម្រើនព្រះជន្ម ព្រះមហាក្សត្រ',
  '5-31': 'ពិធីបុណ្យវិសាខបូជា', 
  '6-4': 'ព្រះរាជពិធីច្រត់ព្រះនង្គ័ល',
  '9-24': 'ទិវាប្រកាសរដ្ឋធម្មនុញ្ញ',
  '10-9': 'ពិធីបុណ្យភ្ជុំបិណ្ឌ',
  '10-10': 'ពិធីបុណ្យភ្ជុំបិណ្ឌ',
  '10-11': 'ពិធីបុណ្យភ្ជុំបិណ្ឌ',
  '10-15': 'ទិវាប្រារព្ធព្រះបរមរតនកោដ្ឋ',
  '10-29': 'ព្រះរាជពិធីគ្រងព្រះបរមរាជសម្បត្តិ',
  '11-9': 'ទិវាបុណ្យឯករាជ្យជាតិ',
  '11-23': 'ព្រះរាជពិធីបុណ្យអុំទូក',
  '11-24': 'ព្រះរាជពិធីបុណ្យអុំទូក',
  '11-25': 'ព្រះរាជពិធីបុណ្យអុំទូក',
};

const MONTHS_EN = [
  'January', 'February', 'March', 'April', 
  'May', 'June', 'July', 'August', 
  'September', 'October', 'November', 'December'
];

const MONTH_COLORS = [
  '#fecaca', '#fed7aa', '#fef08a', '#d9f99d',
  '#bbf7d0', '#a7f3d0', '#99f6e4', '#bae6fd',
  '#bfdbfe', '#c7d2fe', '#e9d5ff', '#fbcfe8'
];

const DAYS_KH = ['អាទិត្យ', 'ចន្ទ', 'អង្គារ', 'ពុធ', 'ព្រហស្បតិ៍', 'សុក្រ', 'សៅរ៍'];

export default function KhmerCalendar({ initialMonth, initialYear }: { initialMonth?: number, initialYear?: number }) {
  const [isOpen, setIsOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'month' | 'year'>('month');
  
  const today = new Date();
  const [currentDate, setCurrentDate] = useState(new Date(initialYear || today.getFullYear(), (initialMonth || today.getMonth() + 1) - 1, 1));
  const [selectedDate, setSelectedDate] = useState<Date>(today);
  const [yearViewDate, setYearViewDate] = useState(new Date(initialYear || today.getFullYear(), 0, 1));

  const modalRef = useRef<HTMLDivElement>(null);

  const prevMonth = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };
  
  const nextMonth = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const prevYear = (e: React.MouseEvent) => {
    e.stopPropagation();
    setYearViewDate(new Date(yearViewDate.getFullYear() - 1, 0, 1));
  };

  const nextYear = (e: React.MouseEvent) => {
    e.stopPropagation();
    setYearViewDate(new Date(yearViewDate.getFullYear() + 1, 0, 1));
  };

  const getDaysInMonth = (y: number, m: number) => new Date(y, m + 1, 0).getDate();
  const firstDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();
  const daysInMonth = getDaysInMonth(currentDate.getFullYear(), currentDate.getMonth());

  const grid = [];
  let dayCount = 1;
  for (let i = 0; i < 6; i++) {
    const row = [];
    for (let j = 0; j < 7; j++) {
      if (i === 0 && j < firstDay) {
        row.push(<div key={`empty-${j}`} className="date-cell empty"></div>);
      } else if (dayCount > daysInMonth) {
        row.push(<div key={`empty-${j}`} className="date-cell empty"></div>);
      } else {
        const isToday = today.getDate() === dayCount && today.getMonth() === currentDate.getMonth() && today.getFullYear() === currentDate.getFullYear();
        const isSelected = selectedDate.getDate() === dayCount && selectedDate.getMonth() === currentDate.getMonth() && selectedDate.getFullYear() === currentDate.getFullYear();
        
        const dateObj = new Date(currentDate.getFullYear(), currentDate.getMonth(), dayCount);
        let lunarInfo = null;
        try {
          lunarInfo = toKhmerLunarDate(dateObj);
        } catch(e) {}

        const lunarText = lunarInfo ? `${lunarInfo.moonDayKhmer} ${lunarInfo.moonStatus}` : '';
        const isSil = lunarInfo ? lunarInfo.isSilDay : false;
        const isWeekend = j === 0 || j === 6;
        const isHoliday = !!HOLIDAYS[`${currentDate.getMonth() + 1}-${dayCount}`];
        
        const currentDayCount = dayCount;
        row.push(
          <div 
            key={`day-${currentDayCount}`} 
            className={`date-cell ${isToday ? 'today' : ''} ${isSelected && !isToday ? 'selected' : ''} ${isWeekend && !isToday && !isSelected ? 'weekend-text' : ''} ${isHoliday ? 'holiday-bg' : ''}`}
            onClick={(e) => { e.stopPropagation(); setSelectedDate(dateObj); }}
          >
             <div className="gregorian">{currentDayCount}</div>
             <div className="lunar">{lunarText}</div>
             {isSil && <div className="sil-dot"></div>}
          </div>
        );
        dayCount++;
      }
    }
    grid.push(<div key={`row-${i}`} className="date-row">{row}</div>);
    if (dayCount > daysInMonth) break;
  }

  let selectedLunarInfo: any = null;
  try {
    selectedLunarInfo = toKhmerLunarDate(selectedDate);
  } catch(e) {}
  
  const selectedHoliday = HOLIDAYS[`${selectedDate.getMonth() + 1}-${selectedDate.getDate()}`];

  const renderYearGrid = () => {
    const months = [];
    for (let m = 0; m < 12; m++) {
      const startDay = new Date(yearViewDate.getFullYear(), m, 1).getDay();
      const totalDays = getDaysInMonth(yearViewDate.getFullYear(), m);
      
      const monthGrid = [];
      let c = 1;
      for (let i = 0; i < 6; i++) {
        const r = [];
        for (let j = 0; j < 7; j++) {
          if (i === 0 && j < startDay) {
            r.push(<div key={`e-${j}`} className="mini-cell empty"></div>);
          } else if (c > totalDays) {
            r.push(<div key={`e-${j}`} className="mini-cell empty"></div>);
          } else {
            const isT = today.getDate() === c && today.getMonth() === m && today.getFullYear() === yearViewDate.getFullYear();
            const isW = j === 0 || j === 6;
            const isH = !!HOLIDAYS[`${m + 1}-${c}`];
            const dc = c; 
            r.push(
              <div 
                key={`d-${c}`} 
                className={`mini-cell ${isT ? 'mini-today' : ''} ${isW && !isT ? 'mini-weekend' : ''} ${isH ? 'mini-holiday' : ''}`}
                onClick={(e) => {
                  e.stopPropagation();
                  setCurrentDate(new Date(yearViewDate.getFullYear(), m, 1));
                  setSelectedDate(new Date(yearViewDate.getFullYear(), m, dc));
                  setViewMode('month');
                }}
              >
                {c}
              </div>
            );
            c++;
          }
        }
        monthGrid.push(<div key={`r-${i}`} className="mini-row">{r}</div>);
        if (c > totalDays) break;
      }
      
      months.push(
        <div key={`m-${m}`} className="mini-month-card">
          <div className="mini-month-header" style={{ background: MONTH_COLORS[m], color: '#1e293b' }}>
            {MONTHS_EN[m]}
          </div>
          <div className="mini-weekdays">
            {['S','M','T','W','T','F','S'].map((wd, i) => (
              <div key={i} className={`mini-wd ${i===0||i===6?'mini-we':''}`}>{wd}</div>
            ))}
          </div>
          <div className="mini-body">{monthGrid}</div>
        </div>
      );
    }
    return months;
  };

  return (
    <>
      <button 
        type="button"
        className="btn-secondary kh-text animate-fade-in" 
        style={{ 
          padding: '6px 12px', 
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          background: '#4f46e5',
          color: 'white',
          border: 'none',
          boxShadow: '0 4px 6px -1px rgba(99, 102, 241, 0.3)',
          cursor: 'pointer',
          borderRadius: '8px',
          height: '48px'
        }}
        onClick={() => {
          setIsOpen(true);
          setViewMode('month');
        }}
      >
        <div style={{
          display: 'flex', 
          flexDirection: 'column', 
          width: '32px', 
          height: '36px', 
          background: 'white', 
          borderRadius: '4px', 
          overflow: 'hidden', 
          boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
          position: 'relative'
        }}>
          <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', display: 'flex', justifyContent: 'space-evenly', paddingTop: '2px' }}>
            {[1, 2, 3, 4].map(i => (
              <div key={i} style={{ width: '2px', height: '5px', background: '#1f2937', borderRadius: '2px', zIndex: 10 }}></div>
            ))}
          </div>
          <div style={{ 
            background: '#16a34a', 
            color: 'white', 
            fontSize: '0.45rem',
            fontFamily: 'sans-serif', 
            fontWeight: 800, 
            textAlign: 'center', 
            paddingTop: '6px',
            paddingBottom: '2px',
            letterSpacing: '0.5px'
          }}>
            ប្រតិទិន
          </div>
          <div style={{ 
            color: '#111827', 
            fontSize: '0.65rem', 
            fontWeight: 900, 
            textAlign: 'center', 
            flex: 1, 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            letterSpacing: '-0.5px'
          }}>
            {today.getFullYear()}
          </div>
        </div>
        <span style={{ fontWeight: 600 }}>ប្រតិទិនឈប់សម្រាក</span>
      </button>

      {isOpen && (
        <div className="modal-overlay animate-fade-in" onClick={() => setIsOpen(false)}>
          <div className={`modal-content ${viewMode === 'year' ? 'year-view-modal' : ''}`} onClick={e => e.stopPropagation()} ref={modalRef}>
            
            {viewMode === 'month' ? (
              <>
                <div className="cal-header">
                  <button className="hamburger-btn" onClick={() => setIsOpen(false)}>
                     <div className="bar"></div>
                     <div className="bar"></div>
                     <div className="bar"></div>
                  </button>
                  <div className="cal-title">{MONTHS_EN[currentDate.getMonth()]} {currentDate.getFullYear()}</div>
                  <div className="cal-nav">
                    <button className="nav-btn year-switch-btn" onClick={(e) => { e.stopPropagation(); setViewMode('year'); setYearViewDate(new Date(currentDate.getFullYear(), 0, 1)); }} title="មើលពេញមួយឆ្នាំ">
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>
                    </button>
                    <button className="nav-btn" onClick={prevMonth}>‹</button>
                    <button className="nav-btn" onClick={nextMonth}>›</button>
                  </div>
                </div>
                
                <div className="cal-grid">
                  <div className="cal-weekdays">
                    {DAYS_KH.map((d, i) => (
                      <div key={d} className={`weekday kh-text ${i === 0 || i === 6 ? 'weekend-day' : ''}`}>
                        {d}
                      </div>
                    ))}
                  </div>
                  
                  <div className="cal-body">
                    {grid}
                  </div>
                </div>

                <div className="bottom-panel">
                   <div className="selected-gregorian">
                     <div className="big-day">{selectedDate.getDate()}</div>
                     <div className="month-year">{MONTHS_EN[selectedDate.getMonth()]} {selectedDate.getFullYear()}</div>
                   </div>
                   <div className="selected-lunar-details kh-text">
                     {selectedLunarInfo ? (
                       <>
                         <div className="full-text date-khmer-text">
                           ថ្ងៃ{selectedLunarInfo.dayOfWeek} {selectedLunarInfo.moonDayKhmer}{selectedLunarInfo.moonStatus}
                         </div>
                         <div className="full-text">
                           ខែ{selectedLunarInfo.khmerMonth} ឆ្នាំ{selectedLunarInfo.animalYear} {selectedLunarInfo.sak} ព.ស. {selectedLunarInfo.buddhistEraYearKhmer}
                         </div>
                         {selectedHoliday && (
                           <div className="holiday-text">
                             🎉 {selectedHoliday}
                           </div>
                         )}
                         {selectedLunarInfo.isSilDay && (
                           <div className="sil-text">
                             🙏 ថ្ងៃសីល
                           </div>
                         )}
                       </>
                     ) : (
                       <div className="full-text">គ្មានទិន្នន័យចន្ទគតិ</div>
                     )}
                   </div>
                </div>
              </>
            ) : (
              <>
                <div className="cal-header year-header">
                  <button className="back-btn kh-text" onClick={(e) => { e.stopPropagation(); setViewMode('month'); }}>
                     ‹ ត្រឡប់ក្រោយ
                  </button>
                  <div className="cal-title">CALENDAR {yearViewDate.getFullYear()}</div>
                  <div className="cal-nav">
                    <button className="nav-btn" onClick={prevYear}>‹</button>
                    <button className="nav-btn" onClick={nextYear}>›</button>
                  </div>
                </div>
                <div className="year-grid-container">
                  {renderYearGrid()}
                </div>
              </>
            )}

          </div>
        </div>
      )}

      <style>{`
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.6);
          backdrop-filter: blur(3px);
          z-index: 1000;
          display: flex;
          justify-content: center;
          align-items: center;
          padding: 20px;
        }

        .modal-content {
          width: 400px;
          height: auto;
          background: #ffffff;
          border-radius: 12px;
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
          overflow: hidden;
          display: flex;
          flex-direction: column;
          font-family: sans-serif;
          transition: all 0.3s ease;
        }

        .year-view-modal {
          width: 900px !important;
          max-width: 90vw;
          max-height: 90vh;
        }

        .cal-header {
          background: #c82a2a;
          color: white;
          display: flex;
          align-items: center;
          padding: 16px 20px;
          position: relative;
        }
        
        .year-header {
          background: #1e293b;
        }

        .hamburger-btn {
          background: transparent;
          border: none;
          cursor: pointer;
          display: flex;
          flex-direction: column;
          gap: 4px;
          margin-right: auto;
        }
        .hamburger-btn .bar {
          width: 20px;
          height: 2px;
          background: white;
          border-radius: 1px;
        }

        .back-btn {
          background: transparent;
          border: none;
          color: white;
          font-size: 1rem;
          font-weight: 600;
          cursor: pointer;
          margin-right: auto;
        }
        .back-btn:hover {
          opacity: 0.8;
        }

        .cal-title {
          font-size: 1.25rem;
          font-weight: 700;
          position: absolute;
          left: 50%;
          transform: translateX(-50%);
          letter-spacing: 0.5px;
        }

        .cal-nav {
          display: flex;
          gap: 15px;
          margin-left: auto;
          align-items: center;
        }

        .nav-btn {
          background: transparent;
          border: none;
          color: white;
          font-size: 1.8rem;
          cursor: pointer;
          line-height: 1;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .nav-btn:hover {
          opacity: 0.8;
        }
        .year-switch-btn {
          margin-right: 10px;
        }

        .cal-grid {
          background: #f8fafc;
        }

        .cal-weekdays {
          display: grid;
          grid-template-columns: repeat(7, 1fr);
          border-bottom: 1px solid #e2e8f0;
          background: #f1f5f9;
        }

        .weekday {
          text-align: center;
          font-size: 0.85rem;
          font-weight: 600;
          color: #475569;
          padding: 12px 2px;
          border-right: 1px solid #e2e8f0;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .date-cell {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 70px;
          border-right: 1px solid #e2e8f0;
          position: relative;
          background: #ffffff;
          cursor: pointer;
          transition: background-color 0.2s ease;
        }
        .date-cell:hover:not(.empty) {
          background: #f1f5f9;
        }
        .date-cell:last-child {
          border-right: none;
        }
        .date-row {
          display: grid;
          grid-template-columns: repeat(7, 1fr);
          border-bottom: 1px solid #e2e8f0;
        }

        .gregorian {
          font-size: 1.15rem;
          font-weight: 700;
          color: #0f172a;
          margin-bottom: 2px;
          z-index: 2;
        }

        .lunar {
          font-size: 0.7rem;
          color: #94a3b8;
          z-index: 2;
        }

        .sil-dot {
          width: 5px;
          height: 5px;
          background-color: #3b82f6;
          border-radius: 50%;
          margin-top: 3px;
          z-index: 2;
        }

        .weekend-text .gregorian {
          color: #c82a2a;
        }

        .empty {
          background: #f8fafc;
          cursor: default;
        }

        .holiday-bg {
          background: #fff1f2;
        }
        .holiday-bg .lunar {
          color: #be123c;
        }

        .today {
          background: transparent;
        }
        .today .gregorian {
          background: #c82a2a;
          color: white;
          width: 30px;
          height: 30px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
        }

        .selected {
          background: #e0f2fe !important;
        }
        .selected::after {
          content: '';
          position: absolute;
          top: -1px; left: -1px; right: -1px; bottom: -1px;
          border: 2px solid #0284c7;
          z-index: 10;
        }

        .bottom-panel {
          display: flex;
          align-items: center;
          padding: 20px;
          background: #ffffff;
          border-top: 1px solid #e2e8f0;
          min-height: 120px;
        }

        .selected-gregorian {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          width: 80px;
          height: 80px;
          margin-right: 20px;
        }

        .selected-gregorian .big-day {
          font-size: 2.2rem;
          font-weight: 800;
          color: #c82a2a;
          line-height: 1;
        }
        .selected-gregorian .month-year {
          font-size: 0.75rem;
          font-weight: 600;
          color: #64748b;
          text-align: center;
          margin-top: 4px;
        }

        .selected-lunar-details {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .full-text {
          font-size: 0.95rem;
          color: #334155;
          font-weight: 500;
        }
        .date-khmer-text {
          font-size: 1.1rem;
          font-weight: 700;
          color: #0f172a;
        }
        .holiday-text {
          font-size: 0.9rem;
          color: #e11d48;
          font-weight: 600;
          margin-top: 4px;
        }
        .sil-text {
          font-size: 0.9rem;
          color: #0284c7;
          font-weight: 600;
        }

        /* Year View Styles */
        .year-grid-container {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 20px;
          padding: 20px;
          background: #f8fafc;
          overflow-y: auto;
          flex: 1;
        }

        .mini-month-card {
          background: white;
          border-radius: 8px;
          border: 1px solid #e2e8f0;
          overflow: hidden;
          box-shadow: 0 1px 3px rgba(0,0,0,0.05);
        }

        .mini-month-header {
          text-align: center;
          font-weight: 700;
          font-size: 0.95rem;
          padding: 8px 0;
          letter-spacing: 0.5px;
          border-bottom: 1px solid rgba(0,0,0,0.05);
        }

        .mini-weekdays {
          display: grid;
          grid-template-columns: repeat(7, 1fr);
          background: #f8fafc;
          border-bottom: 1px solid #e2e8f0;
        }

        .mini-wd {
          text-align: center;
          font-size: 0.7rem;
          font-weight: 600;
          color: #64748b;
          padding: 6px 0;
        }
        .mini-we {
          color: #ef4444;
        }

        .mini-body {
          padding: 4px;
        }

        .mini-row {
          display: grid;
          grid-template-columns: repeat(7, 1fr);
          margin-bottom: 2px;
        }

        .mini-cell {
          text-align: center;
          font-size: 0.75rem;
          color: #334155;
          padding: 4px 0;
          border-radius: 4px;
          cursor: pointer;
        }
        .mini-cell:hover:not(.empty) {
          background: #f1f5f9;
        }
        .mini-weekend {
          color: #ef4444;
        }
        .mini-holiday {
          background: #fff1f2;
          color: #be123c;
          font-weight: 600;
        }
        .mini-today {
          background: #c82a2a;
          color: white;
          font-weight: 700;
        }

        @media (max-width: 900px) {
          .year-grid-container {
            grid-template-columns: repeat(3, 1fr);
          }
        }
        @media (max-width: 650px) {
          .year-grid-container {
            grid-template-columns: repeat(2, 1fr);
          }
        }
        @media (max-width: 450px) {
          .year-grid-container {
            grid-template-columns: 1fr;
          }
          .year-view-modal {
            width: 95vw !important;
          }
        }
      `}</style>
    </>
  );
}
