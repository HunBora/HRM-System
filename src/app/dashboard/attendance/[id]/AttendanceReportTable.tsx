'use client';

import React, { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { calculateDayAttendanceMetrics } from '@/lib/attendanceCalculator';
import notify from '@/lib/notify';

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


  // Selected Day record
  const selectedDay = useMemo(() => {
    return days.find((d) => d.no === selectedDayNo);
  }, [days, selectedDayNo]);

  // Live auto-calculated metrics (Work hours, OT, Night OT, Holiday OT, Late, Early)
  const liveMetrics = useMemo(() => {
    return calculateDayAttendanceMetrics(
      fIn || null,
      fOut || null,
      sIn || null,
      sOut || null,
      hasOt && otIn ? otIn : null,
      hasOt && otOut ? otOut : null,
      selectedDay?.isOffDay || false
    );
  }, [fIn, fOut, sIn, sOut, otIn, otOut, hasOt, selectedDay]);

  // Open modal for a specific day
  const handleOpenDayModal = (d: DayRecord) => {
    setSelectedDayNo(d.no);
    const yStr = year.toString();
    const mStr = (month + 1).toString().padStart(2, '0');
    const dStr = d.no.toString().padStart(2, '0');
    setFormDate(`${yStr}-${mStr}-${dStr}`);

    setFIn(d.fIn || '07:00');
    setFOut(d.fOut || '11:00');
    setSIn(d.sIn || '13:00');
    setSOut(d.sOut || '17:00');
    setOtIn(d.otIn || (d.normalOtHrs > 0 || d.nightOtHrs > 0 ? '17:00' : ''));
    setOtOut(d.otOut || '');
    setHasOt(!!(d.otIn || d.otOut || d.normalOtHrs > 0 || d.nightOtHrs > 0 || d.holidayOtHrs > 0));
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

  // OT preset applier
  const applyOtHours = (hours: number) => {
    setHasOt(true);
    setOtIn('17:00');
    const startMins = 17 * 60;
    const endMins = startMins + Math.round(hours * 60);
    const endH = Math.floor(endMins / 60) % 24;
    const endM = endMins % 60;
    const endStr = `${endH.toString().padStart(2, '0')}:${endM.toString().padStart(2, '0')}`;
    setOtOut(endStr);
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
          regDay: liveMetrics.regDay,
          workHrs: liveMetrics.workHrs,
          normalOtHrs: liveMetrics.normalOtHrs,
          nightOtHrs: liveMetrics.nightOtHrs,
          holidayOtHrs: liveMetrics.holidayOtHrs,
          lateMins: liveMetrics.lateMins,
          earlyMins: liveMetrics.earlyMins,
          remarks: fullRemark,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to save attendance');
      }

      // Update local state immediately with calculated metrics
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
              regDay: liveMetrics.regDay,
              workHrs: liveMetrics.workHrs,
              normalOtHrs: liveMetrics.normalOtHrs,
              nightOtHrs: liveMetrics.nightOtHrs,
              holidayOtHrs: liveMetrics.holidayOtHrs,
              lateMins: liveMetrics.lateMins,
              earlyMins: liveMetrics.earlyMins,
              remarks: fullRemark,
            };
          }
          return d;
        })
      );

      setIsModalOpen(false);
      notify.toast(`បានកត់ត្រាវត្តមានថ្ងៃទី ${selectedDayNo} ដោយជោគជ័យ!`, 'success');
      router.refresh();
    } catch (err: any) {
      notify.error('បរាជ័យក្នុងការកត់ត្រា', err.message);
    } finally {
      setIsSaving(false);
    }
  };

  // Auto-Fill all missing work days in the month
  const handleAutoFillMonth = async () => {
    const confirmed = await notify.confirm({
      title: '⚡ បញ្ជាក់ការបំពេញស្វ័យប្រវត្តិក្នងខែ',
      html: `<div style="text-align: center; font-size: 0.95rem; line-height: 1.6; color: #334155;">
        តើអ្នកពិតជាចង់បំពេញម៉ោងស្វ័យប្រវត្តិតាមវេន<br/><span style="color: #2563eb; font-weight: 700;">(07:00-11:00, 13:00-17:00 = 8 ម៉ោង)</span><br/>សម្រាប់គ្រប់ថ្ងៃធ្វើការដែលខ្វះក្នុងខែ <b>${month + 1}/${year}</b> របស់បុគ្គលិក <b>${employee.firstNameEn} ${employee.lastNameEn || ''}</b> មែនទេ?
      </div>`,
      confirmButtonText: '⚡ បំពេញស្វ័យប្រវត្តិ',
      cancelButtonText: 'បោះបង់',
      icon: 'question',
    });
    if (!confirmed) return;

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

      notify.success('បានបំពេញវត្តមានពេញមួយខែជោគជ័យ!', data.message);
      router.refresh();
    } catch (err: any) {
      notify.error('បរាជ័យក្នុងការបំពេញ', err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const thStyle: React.CSSProperties = { padding: '5px', whiteSpace: 'nowrap' };
  const tdStyle: React.CSSProperties = { padding: '5px' };

  return (
    <div>

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
                <td style={{ ...tdStyle, fontWeight: d.normalOtHrs > 0 ? 800 : 400 }}>
                  {d.normalOtHrs > 0 ? (
                    <span style={{ backgroundColor: '#dbeafe', color: '#1e40af', padding: '2px 6px', borderRadius: '4px', fontWeight: 800 }}>
                      {d.normalOtHrs}
                    </span>
                  ) : (
                    d.normalOtHrs
                  )}
                </td>
                <td style={{ ...tdStyle, fontWeight: d.nightOtHrs > 0 ? 800 : 400 }}>
                  {d.nightOtHrs > 0 ? (
                    <span style={{ backgroundColor: '#f3e8ff', color: '#6b21a8', padding: '2px 6px', borderRadius: '4px', fontWeight: 800 }}>
                      {d.nightOtHrs}
                    </span>
                  ) : (
                    d.nightOtHrs
                  )}
                </td>
                <td style={{ ...tdStyle, fontWeight: d.holidayOtHrs > 0 ? 800 : 400 }}>
                  {d.holidayOtHrs > 0 ? (
                    <span style={{ backgroundColor: '#fee2e2', color: '#991b1b', padding: '2px 6px', borderRadius: '4px', fontWeight: 800 }}>
                      {d.holidayOtHrs}
                    </span>
                  ) : (
                    d.holidayOtHrs
                  )}
                </td>
                <td style={{ ...tdStyle, fontWeight: d.lateMins > 0 ? 700 : 400, color: d.lateMins > 0 ? '#dc2626' : 'inherit' }}>
                  {d.lateMins > 0 ? (
                    <span style={{ color: '#dc2626', fontWeight: 700 }}>{d.lateMins}</span>
                  ) : (
                    d.lateMins
                  )}
                </td>
                <td style={{ ...tdStyle, fontWeight: d.earlyMins > 0 ? 700 : 400, color: d.earlyMins > 0 ? '#d97706' : 'inherit' }}>
                  {d.earlyMins > 0 ? (
                    <span style={{ color: '#d97706', fontWeight: 700 }}>{d.earlyMins}</span>
                  ) : (
                    d.earlyMins
                  )}
                </td>
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
            <td style={tdStyle}>{days.reduce((sum, d) => sum + Number(d.regDay || 0), 0).toFixed(1)}</td>
            <td style={tdStyle}>{days.reduce((sum, d) => sum + Number(d.workHrs || 0), 0).toFixed(1)}</td>
            <td style={{ ...tdStyle, color: '#1d4ed8' }}>{days.reduce((sum, d) => sum + Number(d.normalOtHrs || 0), 0).toFixed(1)}</td>
            <td style={{ ...tdStyle, color: '#6b21a8' }}>{days.reduce((sum, d) => sum + Number(d.nightOtHrs || 0), 0).toFixed(1)}</td>
            <td style={{ ...tdStyle, color: '#991b1b' }}>{days.reduce((sum, d) => sum + Number(d.holidayOtHrs || 0), 0).toFixed(1)}</td>
            <td style={{ ...tdStyle, color: '#dc2626' }}>{days.reduce((sum, d) => sum + Number(d.lateMins || 0), 0)}</td>
            <td style={{ ...tdStyle, color: '#d97706' }}>{days.reduce((sum, d) => sum + Number(d.earlyMins || 0), 0)}</td>
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

              {/* OT Toggle & Presets */}
              <div style={{ border: '1px dashed #cbd5e1', padding: '12px', borderRadius: '10px', backgroundColor: '#fdfefe' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.84rem', fontWeight: 700, color: '#1e40af', cursor: 'pointer' }}>
                    <input type="checkbox" checked={hasOt} onChange={(e) => setHasOt(e.target.checked)} />
                    <span>+ បន្ថែមម៉ោងថែម OT (Overtime)</span>
                  </label>
                  {hasOt && (
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#059669', backgroundColor: '#ecfdf5', padding: '2px 8px', borderRadius: '6px' }}>
                      ⏰ គណនាឃើញ៖ {(liveMetrics.normalOtHrs + liveMetrics.nightOtHrs + liveMetrics.holidayOtHrs).toFixed(1)} ម៉ោង
                    </span>
                  )}
                </div>

                {hasOt && (
                  <div style={{ marginTop: '10px' }}>
                    {/* Quick OT Presets */}
                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '8px' }}>
                      <span style={{ fontSize: '0.74rem', color: '#64748b', alignSelf: 'center' }}>ជ្រើសរើសលឿន៖</span>
                      <button
                        type="button"
                        onClick={() => applyOtHours(1.5)}
                        style={{ padding: '3px 8px', borderRadius: '6px', border: '1px solid #cbd5e1', background: '#f8fafc', fontSize: '0.74rem', fontWeight: 600, cursor: 'pointer' }}
                      >
                        +1.5h
                      </button>
                      <button
                        type="button"
                        onClick={() => applyOtHours(2.0)}
                        style={{ padding: '3px 8px', borderRadius: '6px', border: '1px solid #cbd5e1', background: '#f8fafc', fontSize: '0.74rem', fontWeight: 600, cursor: 'pointer' }}
                      >
                        +2.0h
                      </button>
                      <button
                        type="button"
                        onClick={() => applyOtHours(2.5)}
                        style={{ padding: '3px 8px', borderRadius: '6px', border: '1px solid #cbd5e1', background: '#f8fafc', fontSize: '0.74rem', fontWeight: 600, cursor: 'pointer' }}
                      >
                        +2.5h
                      </button>
                      <button
                        type="button"
                        onClick={() => applyOtHours(3.0)}
                        style={{ padding: '3px 8px', borderRadius: '6px', border: '1px solid #bfdbfe', background: '#eff6ff', color: '#1d4ed8', fontSize: '0.74rem', fontWeight: 700, cursor: 'pointer' }}
                      >
                        +3.0h (17:00-20:00)
                      </button>
                      <button
                        type="button"
                        onClick={() => applyOtHours(4.0)}
                        style={{ padding: '3px 8px', borderRadius: '6px', border: '1px solid #cbd5e1', background: '#f8fafc', fontSize: '0.74rem', fontWeight: 600, cursor: 'pointer' }}
                      >
                        +4.0h
                      </button>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.74rem', color: '#475569', marginBottom: '2px' }}>ចូល OT (OT-In)</label>
                        <input
                          type="time"
                          value={otIn}
                          onChange={(e) => setOtIn(e.target.value)}
                          style={{ width: '100%', padding: '6px 8px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.84rem' }}
                        />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.74rem', color: '#475569', marginBottom: '2px' }}>ចេញ OT (OT-Out)</label>
                        <input
                          type="time"
                          value={otOut}
                          onChange={(e) => setOtOut(e.target.value)}
                          style={{ width: '100%', padding: '6px 8px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.84rem' }}
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Live Calculation Preview Banner */}
              <div style={{ backgroundColor: '#f0fdf4', border: '1px solid #86efac', borderRadius: '10px', padding: '10px 14px', fontSize: '0.82rem', color: '#166534', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <div style={{ fontWeight: 700, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>📊 គណនាស្វ័យប្រវត្តិតាមម៉ោងស្កេន (Live Auto-Calculation):</span>
                  <span style={{ backgroundColor: '#dcfce7', padding: '2px 8px', borderRadius: '6px' }}>{liveMetrics.workHrs}h ធ្វើការ</span>
                </div>
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', fontSize: '0.78rem', marginTop: '2px' }}>
                  <span>ថែមម៉ោងធម្មតា: <strong style={{ color: '#1d4ed8' }}>{liveMetrics.normalOtHrs}h</strong></span>
                  {liveMetrics.nightOtHrs > 0 && <span>ថែមយប់: <strong style={{ color: '#6b21a8' }}>{liveMetrics.nightOtHrs}h</strong></span>}
                  {liveMetrics.holidayOtHrs > 0 && <span>ថែមថ្ងៃបុណ្យ: <strong style={{ color: '#b91c1c' }}>{liveMetrics.holidayOtHrs}h</strong></span>}
                  {liveMetrics.lateMins > 0 && <span>យឺត: <strong style={{ color: '#dc2626' }}>{liveMetrics.lateMins} នាទី</strong></span>}
                  {liveMetrics.earlyMins > 0 && <span>ចេញមុន: <strong style={{ color: '#d97706' }}>{liveMetrics.earlyMins} នាទី</strong></span>}
                </div>
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
