'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';

interface DayRecord {
  no: number;
  dateStr: string;
  day: string;
  isOffDay: boolean;
  fIn: string;
  fOut: string;
  sIn: string;
  sOut: string;
  otIn: string;
  otOut: string;
  regDay: number;
  workHrs: number;
  normalOtHrs: number;
  nightOtHrs: number;
  holidayOtHrs: number;
  lateMins: number;
  earlyMins: number;
  remarks: string;
  rawDate?: string; // YYYY-MM-DD
}

interface AttendanceReportTableProps {
  employee: any;
  initialDays: DayRecord[];
  month: number;
  year: number;
}

export default function AttendanceReportTable({ employee, initialDays, month, year }: AttendanceReportTableProps) {
  const router = useRouter();
  const [days, setDays] = useState<DayRecord[]>(initialDays);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [selectedDayNo, setSelectedDayNo] = useState<number>(1);

  // Form states
  const [formDate, setFormDate] = useState(() => {
    const d = new Date(year, month, 1);
    return d.toISOString().slice(0, 10);
  });
  const [fIn, setFIn] = useState('07:00');
  const [fOut, setFOut] = useState('11:00');
  const [sIn, setSIn] = useState('13:00');
  const [sOut, setSOut] = useState('17:00');
  const [otIn, setOtIn] = useState('');
  const [otOut, setOtOut] = useState('');
  const [hasOt, setHasOt] = useState(false);
  const [regDay, setRegDay] = useState(1.0);
  const [workHrs, setWorkHrs] = useState(8.0);
  const [reason, setReason] = useState('ភ្លេចស្កេន (Forgot to scan)');
  const [notes, setNotes] = useState('');

  // Toast state
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  // Open modal for a specific day
  const handleOpenDayModal = (d: DayRecord) => {
    setSelectedDayNo(d.no);
    const dateObj = new Date(year, month, d.no);
    // Format YYYY-MM-DD
    const yStr = year.toString();
    const mStr = (month + 1).toString().padStart(2, '0');
    const dStr = d.no.toString().padStart(2, '0');
    setFormDate(`${yStr}-${mStr}-${dStr}`);

    setFIn(d.fIn || '07:00');
    setFOut(d.fOut || '11:00');
    setSIn(d.sIn || '13:00');
    setSOut(d.sOut || '17:00');
    setOtIn(d.otIn || '');
    setOtOut(d.otOut || '');
    setHasOt(!!(d.otIn || d.otOut));
    setRegDay(d.regDay > 0 ? d.regDay : 1.0);
    setWorkHrs(d.workHrs > 0 ? d.workHrs : 8.0);
    setReason('ភ្លេចស្កេន (Forgot to scan)');
    setNotes(d.remarks && !d.remarks.includes('សម្រាក') ? d.remarks : '');
    setIsModalOpen(true);
  };

  // Shift preset applier
  const applyPreset = (preset: 'FULL' | 'HALF_MORN' | 'HALF_AFT' | 'NIGHT') => {
    if (preset === 'FULL') {
      setFIn('07:00');
      setFOut('11:00');
      setSIn('13:00');
      setSOut('17:00');
      setRegDay(1.0);
      setWorkHrs(8.0);
    } else if (preset === 'HALF_MORN') {
      setFIn('07:00');
      setFOut('11:00');
      setSIn('');
      setSOut('');
      setRegDay(0.5);
      setWorkHrs(4.0);
    } else if (preset === 'HALF_AFT') {
      setFIn('');
      setFOut('');
      setSIn('13:00');
      setSOut('17:00');
      setRegDay(0.5);
      setWorkHrs(4.0);
    } else if (preset === 'NIGHT') {
      setFIn('17:00');
      setFOut('22:00');
      setSIn('23:00');
      setSOut('04:00');
      setRegDay(1.0);
      setWorkHrs(8.0);
    }
  };

  // Save single day attendance
  const handleSaveDay = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const fullRemark = `${reason}${notes ? ` - ${notes}` : ''}`;
      const res = await fetch('/api/biometric/logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          isFullDay: true,
          employeeId: employee.id,
          date: formDate,
          fIn: fIn || null,
          fOut: fOut || null,
          sIn: sIn || null,
          sOut: sOut || null,
          otIn: hasOt && otIn ? otIn : null,
          otOut: hasOt && otOut ? otOut : null,
          regDay: parseFloat(String(regDay)) || 1.0,
          workHrs: parseFloat(String(workHrs)) || 8.0,
          remarks: fullRemark,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to save attendance');
      }

      // Update local state immediately
      setDays((prev) =>
        prev.map((d) => {
          if (d.no === selectedDayNo) {
            return {
              ...d,
              fIn: fIn || '',
              fOut: fOut || '',
              sIn: sIn || '',
              sOut: sOut || '',
              otIn: hasOt ? otIn : '',
              otOut: hasOt ? otOut : '',
              regDay: parseFloat(String(regDay)) || 1.0,
              workHrs: parseFloat(String(workHrs)) || 8.0,
              remarks: fullRemark,
            };
          }
          return d;
        })
      );

      setIsModalOpen(false);
      showToast(`បានកត់ត្រាវត្តមានថ្ងៃទី ${selectedDayNo} ដោយជោគជ័យ!`, 'success');
      router.refresh();
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setIsSaving(false);
    }
  };

  // Auto-Fill all missing work days in the month
  const handleAutoFillMonth = async () => {
    const confirmMsg = `តើអ្នកពិតជាចង់បំពេញម៉ោងស្វ័យប្រវត្តិ (07:00-11:00, 13:00-17:00 = 8 ម៉ោង) សម្រាប់គ្រប់ថ្ងៃធ្វើការដែលខ្វះក្នុងខែ ${month + 1}/${year} របស់បុគ្គលិក ${employee.firstNameEn} មែនទេ?`;
    if (!window.confirm(confirmMsg)) return;

    setIsSaving(true);
    try {
      const res = await fetch('/api/biometric/logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          isAutoFillMonth: true,
          employeeId: employee.id,
          year,
          month,
          shiftMornIn: '07:00',
          shiftMornOut: '11:00',
          shiftAftIn: '13:00',
          shiftAftOut: '17:00',
          remarks: 'ភ្លេចស្កេន (បំពេញស្វ័យប្រវត្តិតាមវេន)',
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Auto-fill failed');
      }

      const data = await res.json();

      // Update local days
      setDays((prev) =>
        prev.map((d) => {
          if (d.isOffDay) return d;
          return {
            ...d,
            fIn: d.fIn || '07:00',
            fOut: d.fOut || '11:00',
            sIn: d.sIn || '13:00',
            sOut: d.sOut || '17:00',
            regDay: 1.0,
            workHrs: 8.0,
            remarks: d.remarks || 'ភ្លេចស្កេន (បំពេញស្វ័យប្រវត្តិតាមវេន)',
          };
        })
      );

      showToast(data.message || 'បានបំពេញវត្តមានពេញមួយខែជោគជ័យ!', 'success');
      router.refresh();
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const thStyle: React.CSSProperties = { padding: '5px', whiteSpace: 'nowrap' };
  const tdStyle: React.CSSProperties = { padding: '5px' };

  return (
    <div>
      {/* Toast */}
      {toast && (
        <div
          style={{
            position: 'fixed',
            top: '20px',
            right: '20px',
            zIndex: 9999999,
            padding: '12px 20px',
            borderRadius: '10px',
            boxShadow: '0 6px 20px rgba(0,0,0,0.2)',
            backgroundColor: toast.type === 'success' ? '#10b981' : '#ef4444',
            color: '#ffffff',
            fontWeight: 700,
            fontSize: '0.92rem',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
          }}
        >
          <span>{toast.type === 'success' ? '✅' : '❌'}</span>
          <span>{toast.message}</span>
        </div>
      )}

      {/* Action Buttons Toolbar (No-Print) */}
      <div
        className="no-print"
        style={{
          display: 'flex',
          gap: '10px',
          alignItems: 'center',
          justifyContent: 'flex-end',
          marginBottom: '14px',
          flexWrap: 'wrap',
        }}
      >
        <button
          type="button"
          onClick={() => handleOpenDayModal(days[0] || ({} as any))}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            backgroundColor: '#2563eb',
            color: '#ffffff',
            border: 'none',
            padding: '8px 14px',
            borderRadius: '8px',
            fontWeight: 700,
            fontSize: '0.85rem',
            cursor: 'pointer',
            boxShadow: '0 2px 6px rgba(37,99,235,0.25)',
          }}
        >
          <span>✏️</span>
          <span>បំពេញម៉ោងដែលភ្លេចស្កេន (Fill Forgot Scan)</span>
        </button>

        <button
          type="button"
          onClick={handleAutoFillMonth}
          disabled={isSaving}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            backgroundColor: '#059669',
            color: '#ffffff',
            border: 'none',
            padding: '8px 14px',
            borderRadius: '8px',
            fontWeight: 700,
            fontSize: '0.85rem',
            cursor: 'pointer',
            boxShadow: '0 2px 6px rgba(5,150,105,0.25)',
          }}
        >
          <span>⚡</span>
          <span>{isSaving ? 'កំពុងដំណើរការ...' : 'បំពេញថ្ងៃខ្វះពេញមួយខែស្វ័យប្រវត្តិ (Auto-Fill Month)'}</span>
        </button>
      </div>

      {/* Attendance Log Table (Print Area) */}
      <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'center', fontSize: '0.85rem' }}>
        <thead>
          <tr style={{ borderBottom: '1px solid #000' }}>
            <th style={thStyle}>លេខ<br />No</th>
            <th style={thStyle}>កាលបរិច្ឆេទ<br />Date</th>
            <th style={thStyle}>ថ្ងៃ<br />Day</th>
            <th style={thStyle}>ម៉ោងចូលព្រឹក<br />F-In</th>
            <th style={thStyle}>ម៉ោងចេញព្រឹក<br />F-Out</th>
            <th style={thStyle}>ម៉ោងចូលថ្ងៃ<br />S-In</th>
            <th style={thStyle}>ម៉ោងចេញថ្ងៃ<br />S-Out</th>
            <th style={thStyle}>ម៉ោងចូលOT<br />OT-In</th>
            <th style={thStyle}>ម៉ោងចេញOT<br />OT-Out</th>
            <th style={thStyle}>ថ្ងៃធម្មតា<br />Reg Day</th>
            <th style={thStyle}>ម៉ោងធ្វើការ<br />Work Hrs</th>
            <th style={thStyle}>ម៉ោងថែមធម្មតា<br />Normal OT</th>
            <th style={thStyle}>ម៉ោងថែមយប់<br />Night OT</th>
            <th style={thStyle}>ម៉ោងថែមថ្ងៃបុណ្យ<br />Holiday OT</th>
            <th style={thStyle}>ចូលយឺត(នាទី)<br />Late</th>
            <th style={thStyle}>ចេញមុន<br />Early</th>
            <th style={thStyle}>ផ្សេងៗ<br />Remarks</th>
            <th style={thStyle} className="no-print">កែសម្រួល<br />Edit</th>
          </tr>
        </thead>
        <tbody>
          {days.map((d) => {
            const isMissingScan = !d.isOffDay && (!d.fIn || !d.sOut);
            return (
              <tr
                key={d.no}
                style={{
                  backgroundColor: d.isOffDay ? '#fee2e2' : (isMissingScan ? 'rgba(254, 240, 138, 0.45)' : 'transparent'),
                  color: d.isOffDay ? '#b91c1c' : '#000000',
                  borderBottom: '1px solid rgba(0,0,0,0.12)',
                }}
              >
                <td style={tdStyle}>{d.no}</td>
                <td style={tdStyle}>{d.dateStr}</td>
                <td style={tdStyle}>{d.day}</td>
                <td style={{ ...tdStyle, fontWeight: d.fIn ? 700 : 400 }}>{d.fIn || '-'}</td>
                <td style={{ ...tdStyle, fontWeight: d.fOut ? 700 : 400 }}>{d.fOut || '-'}</td>
                <td style={{ ...tdStyle, fontWeight: d.sIn ? 700 : 400 }}>{d.sIn || '-'}</td>
                <td style={{ ...tdStyle, fontWeight: d.sOut ? 700 : 400 }}>{d.sOut || '-'}</td>
                <td style={tdStyle}>{d.otIn || '-'}</td>
                <td style={tdStyle}>{d.otOut || '-'}</td>
                <td style={{ ...tdStyle, fontWeight: 700 }}>{d.regDay}</td>
                <td style={{ ...tdStyle, fontWeight: 700 }}>{d.workHrs}</td>
                <td style={tdStyle}>{d.normalOtHrs}</td>
                <td style={tdStyle}>{d.nightOtHrs}</td>
                <td style={tdStyle}>{d.holidayOtHrs}</td>
                <td style={tdStyle}>{d.lateMins}</td>
                <td style={tdStyle}>{d.earlyMins}</td>
                <td style={{ ...tdStyle, textAlign: 'left', maxWidth: '160px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {d.remarks}
                </td>
                <td style={tdStyle} className="no-print">
                  <button
                    type="button"
                    onClick={() => handleOpenDayModal(d)}
                    style={{
                      background: isMissingScan ? '#2563eb' : '#f1f5f9',
                      color: isMissingScan ? '#ffffff' : '#334155',
                      border: '1px solid #cbd5e1',
                      borderRadius: '6px',
                      padding: '2px 8px',
                      fontSize: '0.74rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    {isMissingScan ? '⚡ បំពេញ' : '✏️ កែ'}
                  </button>
                </td>
              </tr>
            );
          })}
          <tr style={{ fontWeight: 'bold', borderTop: '1px solid #000' }}>
            <td colSpan={9} style={{ textAlign: 'right', padding: '10px' }}>សរុប-Total</td>
            <td style={tdStyle}>{days.reduce((sum, d) => sum + d.regDay, 0).toFixed(1)}</td>
            <td style={tdStyle}>{days.reduce((sum, d) => sum + d.workHrs, 0).toFixed(1)}</td>
            <td style={tdStyle}>{days.reduce((sum, d) => sum + d.normalOtHrs, 0).toFixed(1)}</td>
            <td style={tdStyle}>{days.reduce((sum, d) => sum + d.nightOtHrs, 0).toFixed(1)}</td>
            <td style={tdStyle}>{days.reduce((sum, d) => sum + d.holidayOtHrs, 0).toFixed(1)}</td>
            <td style={tdStyle}>{days.reduce((sum, d) => sum + d.lateMins, 0)}</td>
            <td style={tdStyle}>{days.reduce((sum, d) => sum + d.earlyMins, 0)}</td>
            <td></td>
            <td className="no-print"></td>
          </tr>
        </tbody>
      </table>

      {/* QUICK FILL MODAL (No-Print) */}
      {isModalOpen && (
        <div
          className="no-print"
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 999999,
            background: 'rgba(15, 23, 42, 0.65)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
          }}
        >
          <div
            style={{
              background: '#ffffff',
              borderRadius: '20px',
              maxWidth: '520px',
              width: '100%',
              padding: '24px',
              boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
              border: '1px solid #e2e8f0',
              maxHeight: '92vh',
              overflowY: 'auto',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                borderBottom: '1px solid #e2e8f0',
                paddingBottom: '12px',
                marginBottom: '16px',
              }}
            >
              <div>
                <h3 style={{ margin: 0, fontSize: '1.18rem', fontWeight: 800, color: '#0f172a' }}>
                  ⚡ បំពេញវត្តមានថ្ងៃទី {selectedDayNo} ({formDate})
                </h3>
                <span style={{ fontSize: '0.78rem', color: '#64748b' }}>
                  {employee.employeeId} - {employee.firstNameEn} {employee.lastNameEn}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                style={{ background: 'none', border: 'none', fontSize: '24px', color: '#94a3b8', cursor: 'pointer' }}
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleSaveDay} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {/* Presets */}
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                  ⚡ ជម្រើសកំណត់ម៉ោងស្វ័យប្រវត្តិតាមវេន (Quick Shift Presets) :
                </label>
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    onClick={() => applyPreset('FULL')}
                    style={{ padding: '6px 10px', borderRadius: '8px', border: '1px solid #bfdbfe', backgroundColor: '#eff6ff', color: '#1d4ed8', fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer' }}
                  >
                    ⚡ ពេញមួយថ្ងៃ (8h)
                  </button>
                  <button
                    type="button"
                    onClick={() => applyPreset('HALF_MORN')}
                    style={{ padding: '6px 10px', borderRadius: '8px', border: '1px solid #bfdbfe', backgroundColor: '#eff6ff', color: '#1d4ed8', fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer' }}
                  >
                    ☀️ កន្លះថ្ងៃព្រឹក (4h)
                  </button>
                  <button
                    type="button"
                    onClick={() => applyPreset('HALF_AFT')}
                    style={{ padding: '6px 10px', borderRadius: '8px', border: '1px solid #bfdbfe', backgroundColor: '#eff6ff', color: '#1d4ed8', fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer' }}
                  >
                    🌤️ កន្លះថ្ងៃរសៀល (4h)
                  </button>
                  <button
                    type="button"
                    onClick={() => applyPreset('NIGHT')}
                    style={{ padding: '6px 10px', borderRadius: '8px', border: '1px solid #bfdbfe', backgroundColor: '#eff6ff', color: '#1d4ed8', fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer' }}
                  >
                    🌙 វេនយប់ (8h)
                  </button>
                </div>
              </div>

              {/* 4 Time Slots */}
              <div style={{ backgroundColor: '#f8fafc', padding: '12px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#475569', marginBottom: '2px' }}>
                      ចូលព្រឹក (F-In)
                    </label>
                    <input
                      type="time"
                      value={fIn}
                      onChange={(e) => setFIn(e.target.value)}
                      style={{ width: '100%', padding: '7px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.86rem' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#475569', marginBottom: '2px' }}>
                      ចេញព្រឹក (F-Out)
                    </label>
                    <input
                      type="time"
                      value={fOut}
                      onChange={(e) => setFOut(e.target.value)}
                      style={{ width: '100%', padding: '7px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.86rem' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#475569', marginBottom: '2px' }}>
                      ចូលរសៀល (S-In)
                    </label>
                    <input
                      type="time"
                      value={sIn}
                      onChange={(e) => setSIn(e.target.value)}
                      style={{ width: '100%', padding: '7px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.86rem' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#475569', marginBottom: '2px' }}>
                      ចេញរសៀល (S-Out)
                    </label>
                    <input
                      type="time"
                      value={sOut}
                      onChange={(e) => setSOut(e.target.value)}
                      style={{ width: '100%', padding: '7px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.86rem' }}
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '14px', marginTop: '10px', alignItems: 'center' }}>
                  <div>
                    <label style={{ fontSize: '0.74rem', color: '#64748b' }}>Reg Day: </label>
                    <input
                      type="number"
                      step="0.1"
                      value={regDay}
                      onChange={(e) => setRegDay(parseFloat(e.target.value) || 0)}
                      style={{ width: '60px', padding: '3px 6px', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '0.82rem' }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.74rem', color: '#64748b' }}>Work Hrs: </label>
                    <input
                      type="number"
                      step="0.5"
                      value={workHrs}
                      onChange={(e) => setWorkHrs(parseFloat(e.target.value) || 0)}
                      style={{ width: '60px', padding: '3px 6px', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '0.82rem' }}
                    />
                  </div>
                </div>
              </div>

              {/* OT Toggle */}
              <div style={{ border: '1px dashed #cbd5e1', padding: '10px', borderRadius: '8px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.82rem', fontWeight: 700, color: '#1e40af', cursor: 'pointer' }}>
                  <input type="checkbox" checked={hasOt} onChange={(e) => setHasOt(e.target.checked)} />
                  <span>+ បន្ថែមម៉ោង OT (Overtime)</span>
                </label>
                {hasOt && (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '8px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.74rem', color: '#475569' }}>ចូល OT (OT-In)</label>
                      <input
                        type="time"
                        value={otIn}
                        onChange={(e) => setOtIn(e.target.value)}
                        style={{ width: '100%', padding: '6px 8px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.84rem' }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.74rem', color: '#475569' }}>ចេញ OT (OT-Out)</label>
                      <input
                        type="time"
                        value={otOut}
                        onChange={(e) => setOtOut(e.target.value)}
                        style={{ width: '100%', padding: '6px 8px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.84rem' }}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Reason */}
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                  មូលហេតុ / ស្ថានភាព *
                </label>
                <select
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.86rem', outline: 'none' }}
                >
                  <option value="ភ្លេចស្កេន (Forgot to scan)">🔔 ភ្លេចស្កេន (Forgot to scan)</option>
                  <option value="ម៉ាស៊ីនស្កេនគាំង/មានបញ្ហា (Terminal Offline)">⚠️ ម៉ាស៊ីនស្កេនគាំង/មានបញ្ហា (Terminal Offline)</option>
                  <option value="បេសកកម្មការងារក្រៅ (Official Mission)">🚗 បេសកកម្មការងារក្រៅ (Official Mission)</option>
                  <option value="មេដៃរលុប ស្កេនមិនជាប់ (Fingerprint Issue)">👆 មេដៃរលុប ស្កេនមិនជាប់ (Fingerprint Issue)</option>
                  <option value="ការអនុញ្ញាតពិសេសពីប្រធាន (Manager Approved)">✍️ ការអនុញ្ញាតពិសេសពីប្រធាន (Manager Approved)</option>
                  <option value="ផ្សេងៗ (Other)">📝 ផ្សេងៗ (Other)</option>
                </select>
              </div>

              {/* Notes */}
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                  កំណត់សម្គាល់បន្ថែម (Remarks)
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="មូលហេតុបន្ថែម..."
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.86rem', outline: 'none', boxSizing: 'border-box' }}
                />
              </div>

              {/* Buttons */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '8px' }}>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#ffffff', color: '#64748b', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer' }}
                >
                  បោះបង់
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  style={{ padding: '8px 20px', borderRadius: '8px', border: 'none', background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)', color: '#ffffff', fontSize: '0.86rem', fontWeight: 700, cursor: 'pointer', boxShadow: '0 2px 6px rgba(37,99,235,0.3)' }}
                >
                  {isSaving ? 'កំពុងរក្សាទុក...' : '💾 រក្សាទុក'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
