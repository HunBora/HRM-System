'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import ImportFingerprintModal from '@/app/dashboard/attendance/ImportFingerprintModal';

type Employee = any;
type DailyAttendance = any;

interface LiveAttendanceProps {
  employees: Employee[];
  todayAttendances: DailyAttendance[];
  searchParams: { q?: string };
  dictionary: any;
}

export default function LiveAttendanceTable({ employees, todayAttendances, searchParams, dictionary: t }: LiveAttendanceProps) {
  const [activeTab, setActiveTab] = useState<'daily' | 'monthly'>('daily');
  const [filter, setFilter] = useState<'all' | 'present' | 'late' | 'absent'>('all');

  // Process data for daily view
  const todayData = employees.map(emp => {
    const att = todayAttendances.find((a: any) => a.employeeId === emp.id);
    let status = 'ABSENT';
    let checkIn = '-';
    let checkOut = '-';
    let lateMins = 0;

    if (att) {
      if (att.fIn || att.sIn) {
        status = (att.lateMins && att.lateMins > 0) ? 'LATE' : 'PRESENT';
        checkIn = att.fIn || att.sIn || '-';
        checkOut = att.sOut || att.fOut || '-';
        lateMins = att.lateMins || 0;
      }
    }

    return { ...emp, attStatus: status, checkIn, checkOut, lateMins };
  });

  const filteredData = todayData.filter(emp => {
    if (filter === 'all') return true;
    if (filter === 'present') return emp.attStatus === 'PRESENT';
    if (filter === 'late') return emp.attStatus === 'LATE';
    if (filter === 'absent') return emp.attStatus === 'ABSENT';
    return true;
  });

  const totalEmployees = employees.length;
  const presentCount = todayData.filter(e => e.attStatus === 'PRESENT').length;
  const lateCount = todayData.filter(e => e.attStatus === 'LATE').length;
  const absentCount = todayData.filter(e => e.attStatus === 'ABSENT').length;

  const thStyle: React.CSSProperties = {
    padding: '8px 12px',
    borderBottom: '2px solid #e2e8f0',
    backgroundColor: '#f8fafc',
    color: '#334155',
    textAlign: 'left',
    fontWeight: '600',
    position: 'sticky',
    top: 0,
    zIndex: 10,
    boxShadow: '0 1px 2px rgba(0,0,0,0.03)',
    fontSize: '0.85rem'
  };

  const tdStyle: React.CSSProperties = {
    padding: '7px 12px',
    borderBottom: '1px solid #f1f5f9',
    verticalAlign: 'middle',
    fontSize: '0.85rem'
  };

  return (
    <div>
      {/* Unified Fit Box Header */}
      <div style={{
        backgroundColor: '#ffffff',
        borderRadius: '10px',
        border: '1px solid #e2e8f0',
        boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
        padding: '10px 14px',
        marginBottom: '12px',
        display: 'flex',
        flexDirection: 'column',
        gap: '10px'
      }}>
        {/* Row 1: Title, Tabs, and Action Controls */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
          {/* Left: Title + Tabs */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '1.2rem' }}>⏱️</span>
              <h1 className="kh-text" style={{ margin: 0, fontSize: '1.15rem', fontWeight: 700, color: '#0f172a' }}>
                {t?.sidebar?.attendance || 'គ្រប់គ្រងវត្តមាន'}
              </h1>
            </div>

            {/* Pill Tabs */}
            <div style={{
              display: 'inline-flex',
              backgroundColor: '#f1f5f9',
              padding: '3px',
              borderRadius: '8px',
              border: '1px solid #e2e8f0',
              gap: '4px'
            }}>
              <button
                type="button"
                onClick={() => setActiveTab('daily')}
                className="kh-text"
                style={{
                  padding: '4px 12px',
                  borderRadius: '6px',
                  border: 'none',
                  background: activeTab === 'daily' ? '#2563eb' : 'transparent',
                  color: activeTab === 'daily' ? '#ffffff' : '#64748b',
                  fontWeight: activeTab === 'daily' ? 600 : 500,
                  fontSize: '0.82rem',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  boxShadow: activeTab === 'daily' ? '0 1px 2px rgba(37,99,235,0.2)' : 'none',
                  transition: 'all 0.15s ease'
                }}
              >
                <span>☀️</span>
                <span>វត្តមានថ្ងៃនេះ (Live Daily)</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('monthly')}
                className="kh-text"
                style={{
                  padding: '4px 12px',
                  borderRadius: '6px',
                  border: 'none',
                  background: activeTab === 'monthly' ? '#2563eb' : 'transparent',
                  color: activeTab === 'monthly' ? '#ffffff' : '#64748b',
                  fontWeight: activeTab === 'monthly' ? 600 : 500,
                  fontSize: '0.82rem',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  boxShadow: activeTab === 'monthly' ? '0 1px 2px rgba(37,99,235,0.2)' : 'none',
                  transition: 'all 0.15s ease'
                }}
              >
                <span>📅</span>
                <span>របាយការណ៍ប្រចាំខែ (Monthly Report)</span>
              </button>
            </div>
          </div>

          {/* Right: Search + Biometrics + Import Modal */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <form method="GET" style={{ display: 'flex', gap: '6px', alignItems: 'center', margin: 0 }}>
              <input 
                type="text" 
                name="q" 
                defaultValue={searchParams.q || ''} 
                placeholder={t?.employee?.searchPlaceholder || "ស្វែងរកឈ្មោះ ឬ អត្តលេខ..."} 
                className="kh-text" 
                style={{ 
                  margin: 0, 
                  height: '32px',
                  padding: '4px 10px', 
                  fontSize: '0.82rem',
                  borderRadius: '6px',
                  border: '1px solid #cbd5e1',
                  backgroundColor: '#ffffff',
                  minWidth: '180px'
                }} 
              />
              <button 
                type="submit" 
                className="kh-text"
                style={{
                  height: '32px',
                  padding: '0 12px',
                  fontSize: '0.82rem',
                  borderRadius: '6px',
                  border: '1px solid #cbd5e1',
                  backgroundColor: '#f8fafc',
                  color: '#334155',
                  cursor: 'pointer',
                  fontWeight: 600
                }}
              >
                {t?.employee?.searchButton || "ស្វែងរក"}
              </button>
            </form>

            <Link
              href="/dashboard/biometric"
              className="kh-text"
              style={{ 
                textDecoration: 'none', 
                display: 'inline-flex', 
                alignItems: 'center', 
                gap: '6px',
                height: '32px',
                padding: '0 12px',
                fontSize: '0.82rem',
                borderRadius: '6px',
                border: '1px solid #bfdbfe',
                backgroundColor: '#eff6ff',
                color: '#2563eb',
                fontWeight: 600,
                whiteSpace: 'nowrap'
              }}
            >
              <span>📲</span>
              <span>ម៉ាស៊ីនស្កេនមេដៃ (Biometrics)</span>
            </Link>

            <ImportFingerprintModal />
          </div>
        </div>

        {/* Row 2: Compact KPI Filter Chips Strip (when daily view is active) */}
        {activeTab === 'daily' && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '10px',
            paddingTop: '8px',
            borderTop: '1px solid #f1f5f9',
            flexWrap: 'wrap'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <span className="kh-text" style={{ fontSize: '0.8rem', fontWeight: 700, color: '#475569', display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                <span>📊</span>
                <span>ស្ថានភាពវត្តមាន:</span>
              </span>

              {/* Total Chip */}
              <button
                type="button"
                onClick={() => setFilter('all')}
                className="kh-text"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '3px 10px',
                  borderRadius: '20px',
                  fontSize: '0.8rem',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  border: filter === 'all' ? '1.5px solid #3b82f6' : '1px solid #e2e8f0',
                  backgroundColor: filter === 'all' ? '#eff6ff' : '#f8fafc',
                  color: filter === 'all' ? '#1d4ed8' : '#475569',
                  fontWeight: filter === 'all' ? 700 : 500,
                  boxShadow: filter === 'all' ? '0 1px 3px rgba(59,130,246,0.15)' : 'none'
                }}
              >
                <span>👥</span>
                <span>បុគ្គលិកសរុប (Total)</span>
                <span style={{
                  marginLeft: '2px',
                  padding: '1px 7px',
                  borderRadius: '10px',
                  backgroundColor: filter === 'all' ? '#3b82f6' : '#cbd5e1',
                  color: '#ffffff',
                  fontSize: '0.75rem',
                  fontWeight: 700
                }}>
                  {totalEmployees}
                </span>
              </button>

              {/* On Time Chip */}
              <button
                type="button"
                onClick={() => setFilter('present')}
                className="kh-text"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '3px 10px',
                  borderRadius: '20px',
                  fontSize: '0.8rem',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  border: filter === 'present' ? '1.5px solid #10b981' : '1px solid #e2e8f0',
                  backgroundColor: filter === 'present' ? '#ecfdf5' : '#f8fafc',
                  color: filter === 'present' ? '#047857' : '#15803d',
                  fontWeight: filter === 'present' ? 700 : 500,
                  boxShadow: filter === 'present' ? '0 1px 3px rgba(16,185,129,0.15)' : 'none'
                }}
              >
                <span>⏱️</span>
                <span>មកទាន់ម៉ោង (On Time)</span>
                <span style={{
                  marginLeft: '2px',
                  padding: '1px 7px',
                  borderRadius: '10px',
                  backgroundColor: filter === 'present' ? '#10b981' : '#bbf7d0',
                  color: filter === 'present' ? '#ffffff' : '#166534',
                  fontSize: '0.75rem',
                  fontWeight: 700
                }}>
                  {presentCount}
                </span>
              </button>

              {/* Late Chip */}
              <button
                type="button"
                onClick={() => setFilter('late')}
                className="kh-text"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '3px 10px',
                  borderRadius: '20px',
                  fontSize: '0.8rem',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  border: filter === 'late' ? '1.5px solid #f59e0b' : '1px solid #e2e8f0',
                  backgroundColor: filter === 'late' ? '#fffbeb' : '#f8fafc',
                  color: filter === 'late' ? '#b45309' : '#854d0e',
                  fontWeight: filter === 'late' ? 700 : 500,
                  boxShadow: filter === 'late' ? '0 1px 3px rgba(245,158,11,0.15)' : 'none'
                }}
              >
                <span>⚠️</span>
                <span>មកយឺត (Late)</span>
                <span style={{
                  marginLeft: '2px',
                  padding: '1px 7px',
                  borderRadius: '10px',
                  backgroundColor: filter === 'late' ? '#f59e0b' : '#fde68a',
                  color: filter === 'late' ? '#ffffff' : '#854d0e',
                  fontSize: '0.75rem',
                  fontWeight: 700
                }}>
                  {lateCount}
                </span>
              </button>

              {/* Absent Chip */}
              <button
                type="button"
                onClick={() => setFilter('absent')}
                className="kh-text"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '3px 10px',
                  borderRadius: '20px',
                  fontSize: '0.8rem',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  border: filter === 'absent' ? '1.5px solid #ef4444' : '1px solid #e2e8f0',
                  backgroundColor: filter === 'absent' ? '#fef2f2' : '#f8fafc',
                  color: filter === 'absent' ? '#b91c1c' : '#991b1b',
                  fontWeight: filter === 'absent' ? 700 : 500,
                  boxShadow: filter === 'absent' ? '0 1px 3px rgba(239,68,68,0.15)' : 'none'
                }}
              >
                <span>🚫</span>
                <span>អវត្តមាន (Absent)</span>
                <span style={{
                  marginLeft: '2px',
                  padding: '1px 7px',
                  borderRadius: '10px',
                  backgroundColor: filter === 'absent' ? '#ef4444' : '#fecaca',
                  color: filter === 'absent' ? '#ffffff' : '#991b1b',
                  fontSize: '0.75rem',
                  fontWeight: 700
                }}>
                  {absentCount}
                </span>
              </button>
            </div>

            {filter !== 'all' && (
              <button
                type="button"
                onClick={() => setFilter('all')}
                className="kh-text"
                style={{
                  padding: '3px 9px',
                  fontSize: '0.75rem',
                  borderRadius: '12px',
                  border: '1px solid #cbd5e1',
                  backgroundColor: '#f1f5f9',
                  color: '#64748b',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                <span>✕</span>
                <span>សម្អាតតម្រង (Reset)</span>
              </button>
            )}
          </div>
        )}
      </div>

      {activeTab === 'daily' && (
        <>
          {/* Daily Table */}
          <div style={{ 
            backgroundColor: '#ffffff',
            borderRadius: '10px',
            border: '1px solid #e2e8f0',
            overflow: 'hidden',
            boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
          }}>
            <div style={{ overflowX: 'auto', maxHeight: 'calc(100vh - 210px)', minHeight: filteredData.length === 0 ? '250px' : 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '850px' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f8fafc', position: 'sticky', top: 0, zIndex: 10 }}>
                    <th style={thStyle} className="kh-text">អត្តលេខ (ID)</th>
                    <th style={thStyle} className="kh-text">ឈ្មោះខ្មែរ (Name Kh)</th>
                    <th style={thStyle} className="kh-text">ឈ្មោះឡាតាំង (Name En)</th>
                    <th style={thStyle} className="kh-text">ម៉ោងចូល (Check In)</th>
                    <th style={thStyle} className="kh-text">ម៉ោងចេញ (Check Out)</th>
                    <th style={thStyle} className="kh-text">ស្ថានភាព (Status)</th>
                    <th style={thStyle} className="kh-text">មកយឺត (Late Mins)</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredData.length === 0 ? (
                    <tr>
                      <td colSpan={7} style={{ padding: '60px 20px', textAlign: 'center' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontSize: '1.8rem' }}>🕒</span>
                          <div className="kh-text" style={{ fontSize: '1rem', fontWeight: 600, color: '#334155' }}>
                            មិនមានទិន្នន័យវត្តមានសម្រាប់លក្ខខណ្ឌនេះទេ
                          </div>
                          <div className="kh-text" style={{ fontSize: '0.85rem', color: '#94a3b8' }}>
                            សូមជ្រើសរើសផ្ទាំង ឬតម្រងផ្សេងទៀតដើម្បីមើលទិន្នន័យ
                          </div>
                        </div>
                      </td>
                    </tr>
                  ) : (
                  filteredData.map((emp: any) => (
                    <tr key={emp.id} style={{ backgroundColor: '#fff', transition: 'background-color 0.2s', fontSize: '0.9rem' }}>
                      <td style={tdStyle}>{emp.employeeId}</td>
                      <td style={tdStyle} className="kh-text">
                        {emp.firstNameKh} {emp.lastNameKh}
                      </td>
                      <td style={tdStyle}>
                        {emp.firstNameEn} {emp.lastNameEn}
                      </td>
                      <td style={tdStyle}>
                        <span style={{ fontWeight: emp.checkIn !== '-' ? 'bold' : 'normal', color: emp.checkIn !== '-' ? '#0f172a' : '#94a3b8' }}>
                          {emp.checkIn}
                        </span>
                      </td>
                      <td style={tdStyle}>
                        <span style={{ fontWeight: emp.checkOut !== '-' ? 'bold' : 'normal', color: emp.checkOut !== '-' ? '#0f172a' : '#94a3b8' }}>
                          {emp.checkOut}
                        </span>
                      </td>
                      <td style={tdStyle}>
                        {emp.attStatus === 'PRESENT' && (
                          <span style={{ padding: '3px 8px', borderRadius: '12px', backgroundColor: '#dcfce7', color: '#15803d', fontSize: '0.75rem', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                            <span>✓</span> ON TIME
                          </span>
                        )}
                        {emp.attStatus === 'LATE' && (
                          <span style={{ padding: '3px 8px', borderRadius: '12px', backgroundColor: '#fef3c7', color: '#b45309', fontSize: '0.75rem', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                            <span>⚠️</span> LATE
                          </span>
                        )}
                        {emp.attStatus === 'ABSENT' && (
                          <span style={{ padding: '3px 8px', borderRadius: '12px', backgroundColor: '#fee2e2', color: '#b91c1c', fontSize: '0.75rem', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                            <span>✕</span> ABSENT
                          </span>
                        )}
                      </td>
                      <td style={tdStyle}>
                        {emp.lateMins > 0 ? (
                          <span style={{ color: '#d97706', fontWeight: 700 }}>+{emp.lateMins} mn</span>
                        ) : (
                          <span style={{ color: '#94a3b8' }}>-</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </>
    )}

      {activeTab === 'monthly' && (
        <div className="card" style={{ overflowX: 'auto', overflowY: 'auto', maxHeight: 'calc(100vh - 210px)', padding: 0 }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '800px' }}>
            <thead>
              <tr style={{ backgroundColor: '#f8fafc', position: 'sticky', top: 0, zIndex: 10 }}>
                <th style={thStyle} className="kh-text">អត្តលេខ<br/>ID<br/><span style={{fontSize: '0.75rem', color: '#64748b'}}>编号</span></th>
                <th style={thStyle} className="kh-text">ឈ្មោះខ្មែរ<br/>Name Khmer<br/><span style={{fontSize: '0.75rem', color: '#64748b'}}>柬文名字</span></th>
                <th style={thStyle} className="kh-text">ឈ្មោះឡាតាំង<br/>Name English<br/><span style={{fontSize: '0.75rem', color: '#64748b'}}>英文名字</span></th>
                <th style={thStyle} className="kh-text">ផ្នែក<br/>Department<br/><span style={{fontSize: '0.75rem', color: '#64748b'}}>部门</span></th>
                <th style={thStyle} className="kh-text">មុខងារ<br/>Position<br/><span style={{fontSize: '0.75rem', color: '#64748b'}}>职务</span></th>
                <th style={thStyle} className="kh-text">សកម្មភាព<br/>Actions<br/><span style={{fontSize: '0.75rem', color: '#64748b'}}>操作</span></th>
              </tr>
            </thead>
            <tbody>
              {employees.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ padding: '30px', textAlign: 'center' }} className="kh-text text-muted">
                    {t?.employee?.noData || 'No Data'}
                  </td>
                </tr>
              ) : (
                employees.map((emp) => (
                  <tr key={emp.id} style={{ transition: 'background-color 0.15s' }}>
                    <td style={tdStyle}><span style={{ fontWeight: 600 }}>{emp.employeeId}</span></td>
                    <td style={tdStyle} className="kh-text"><span style={{ fontWeight: 600 }}>{emp.firstNameKh} {emp.lastNameKh}</span></td>
                    <td style={tdStyle}>{emp.firstNameEn} {emp.lastNameEn}</td>
                    <td style={tdStyle}>{emp.department}</td>
                    <td style={tdStyle} className="kh-text">{emp.position}</td>
                    <td style={tdStyle}>
                       <Link href={`/dashboard/attendance/${emp.id}`} className="btn-secondary kh-text" style={{ textDecoration: 'none', padding: '4px 10px', fontSize: '0.8rem', borderRadius: '6px' }}>
                         របាយការណ៍លម្អិត (View)
                       </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
