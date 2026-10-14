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
    borderBottom: '2px solid var(--border-color)',
    backgroundColor: '#f8fafc',
    color: '#334155',
    textAlign: 'left',
    fontWeight: '600',
    position: 'sticky',
    top: 0,
    zIndex: 10,
    boxShadow: '0 2px 0 var(--border-color)',
    fontSize: '0.9rem'
  };

  const tdStyle: React.CSSProperties = {
    padding: '8px 12px',
    borderBottom: '1px solid var(--border-color)',
    verticalAlign: 'middle'
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '15px' }}>
        <h1 className="title kh-text" style={{ marginBottom: 0, fontSize: '1.8rem' }}>
          {t?.sidebar?.attendance || 'គ្រប់គ្រងវត្តមានឆ្លាតវៃ'}
        </h1>
        
        <div style={{ display: 'flex', gap: '10px' }}>
          <form method="GET" style={{ display: 'flex', gap: '10px' }}>
            <input 
              type="text" 
              name="q" 
              defaultValue={searchParams.q || ''} 
              placeholder={t?.employee?.searchPlaceholder || "ស្វែងរក..."} 
              className="input-field kh-text" 
              style={{ margin: 0, minWidth: '200px' }} 
            />
            <button type="submit" className="btn-secondary kh-text">{t?.employee?.searchButton || "ស្វែងរក"}</button>
          </form>
          <Link
            href="/dashboard/biometric"
            className="btn-secondary kh-text"
            style={{ 
              textDecoration: 'none', 
              display: 'inline-flex', 
              alignItems: 'center', 
              gap: '6px',
              backgroundColor: '#eff6ff',
              color: '#2563eb',
              borderColor: '#bfdbfe'
            }}
          >
            <span>📲</span>
            <span>ម៉ាស៊ីនស្កេនមេដៃ (Biometrics)</span>
          </Link>
          <ImportFingerprintModal />
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '20px', borderBottom: '1px solid var(--border-color)', marginBottom: '20px' }}>
        <button 
          onClick={() => setActiveTab('daily')}
          style={{ 
            padding: '10px 20px', 
            background: 'none', 
            border: 'none', 
            borderBottom: activeTab === 'daily' ? '3px solid var(--primary)' : '3px solid transparent',
            color: activeTab === 'daily' ? 'var(--primary)' : '#64748b',
            fontWeight: activeTab === 'daily' ? 'bold' : 'normal',
            cursor: 'pointer',
            fontSize: '1rem'
          }}
          className="kh-text"
        >
          វត្តមានថ្ងៃនេះ (Live Daily)
        </button>
        <button 
          onClick={() => setActiveTab('monthly')}
          style={{ 
            padding: '10px 20px', 
            background: 'none', 
            border: 'none', 
            borderBottom: activeTab === 'monthly' ? '3px solid var(--primary)' : '3px solid transparent',
            color: activeTab === 'monthly' ? 'var(--primary)' : '#64748b',
            fontWeight: activeTab === 'monthly' ? 'bold' : 'normal',
            cursor: 'pointer',
            fontSize: '1rem'
          }}
          className="kh-text"
        >
          របាយការណ៍ប្រចាំខែ (Monthly Report)
        </button>
      </div>

      {activeTab === 'daily' && (
        <>
          {/* Summary Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '14px', marginBottom: '20px' }}>
            <div 
              onClick={() => setFilter('all')} 
              style={{ 
                cursor: 'pointer', 
                padding: '16px 20px', 
                borderRadius: '12px', 
                background: filter === 'all' ? '#eff6ff' : '#ffffff', 
                border: `1.5px solid ${filter === 'all' ? '#3b82f6' : '#e2e8f0'}`,
                boxShadow: filter === 'all' ? '0 4px 12px rgba(59, 130, 246, 0.12)' : '0 1px 2px rgba(0,0,0,0.04)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                transition: 'all 0.2s ease'
              }}
            >
              <div>
                <div className="kh-text" style={{ color: '#64748b', fontSize: '0.85rem', marginBottom: '4px' }}>បុគ្គលិកសរុប (Total)</div>
                <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0f172a' }}>{totalEmployees}</div>
              </div>
              <div style={{ width: '42px', height: '42px', borderRadius: '10px', backgroundColor: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.25rem' }}>👥</div>
            </div>

            <div 
              onClick={() => setFilter('present')} 
              style={{ 
                cursor: 'pointer', 
                padding: '16px 20px', 
                borderRadius: '12px', 
                background: filter === 'present' ? '#f0fdf4' : '#ffffff', 
                border: `1.5px solid ${filter === 'present' ? '#10b981' : '#e2e8f0'}`,
                boxShadow: filter === 'present' ? '0 4px 12px rgba(16, 185, 129, 0.15)' : '0 1px 2px rgba(0,0,0,0.04)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                transition: 'all 0.2s ease'
              }}
            >
              <div>
                <div className="kh-text" style={{ color: '#166534', fontSize: '0.85rem', marginBottom: '4px' }}>មកទាន់ម៉ោង (On Time)</div>
                <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#16a34a' }}>{presentCount}</div>
              </div>
              <div style={{ width: '42px', height: '42px', borderRadius: '10px', backgroundColor: '#dcfce7', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.25rem' }}>⏱️</div>
            </div>

            <div 
              onClick={() => setFilter('late')} 
              style={{ 
                cursor: 'pointer', 
                padding: '16px 20px', 
                borderRadius: '12px', 
                background: filter === 'late' ? '#fffbeb' : '#ffffff', 
                border: `1.5px solid ${filter === 'late' ? '#f59e0b' : '#e2e8f0'}`,
                boxShadow: filter === 'late' ? '0 4px 12px rgba(245, 158, 11, 0.15)' : '0 1px 2px rgba(0,0,0,0.04)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                transition: 'all 0.2s ease'
              }}
            >
              <div>
                <div className="kh-text" style={{ color: '#854d0e', fontSize: '0.85rem', marginBottom: '4px' }}>មកយឺត (Late)</div>
                <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#d97706' }}>{lateCount}</div>
              </div>
              <div style={{ width: '42px', height: '42px', borderRadius: '10px', backgroundColor: '#fef3c7', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.25rem' }}>⚠️</div>
            </div>

            <div 
              onClick={() => setFilter('absent')} 
              style={{ 
                cursor: 'pointer', 
                padding: '16px 20px', 
                borderRadius: '12px', 
                background: filter === 'absent' ? '#fef2f2' : '#ffffff', 
                border: `1.5px solid ${filter === 'absent' ? '#ef4444' : '#e2e8f0'}`,
                boxShadow: filter === 'absent' ? '0 4px 12px rgba(239, 68, 68, 0.15)' : '0 1px 2px rgba(0,0,0,0.04)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                transition: 'all 0.2s ease'
              }}
            >
              <div>
                <div className="kh-text" style={{ color: '#991b1b', fontSize: '0.85rem', marginBottom: '4px' }}>អវត្តមាន (Absent)</div>
                <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#dc2626' }}>{absentCount}</div>
              </div>
              <div style={{ width: '42px', height: '42px', borderRadius: '10px', backgroundColor: '#fee2e2', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.25rem' }}>🚫</div>
            </div>
          </div>

          {/* Daily Table */}
          <div style={{ 
            backgroundColor: '#ffffff',
            borderRadius: '12px',
            border: '1px solid #e2e8f0',
            overflow: 'hidden',
            boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
          }}>
            <div style={{ overflowX: 'auto', maxHeight: 'calc(100vh - 380px)', minHeight: filteredData.length === 0 ? '250px' : 'auto' }}>
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
                        {emp.attStatus === 'PRESENT' && <span style={{ padding: '4px 10px', borderRadius: '20px', backgroundColor: '#dcfce7', color: '#166534', fontSize: '0.8rem', fontWeight: 'bold' }}>ON TIME</span>}
                        {emp.attStatus === 'LATE' && <span style={{ padding: '4px 10px', borderRadius: '20px', backgroundColor: '#fef08a', color: '#854d0e', fontSize: '0.8rem', fontWeight: 'bold' }}>LATE</span>}
                        {emp.attStatus === 'ABSENT' && <span style={{ padding: '4px 10px', borderRadius: '20px', backgroundColor: '#f1f5f9', color: '#64748b', fontSize: '0.8rem', fontWeight: 'bold' }}>ABSENT</span>}
                      </td>
                      <td style={tdStyle}>
                        {emp.lateMins > 0 ? (
                          <span style={{ color: '#ca8a04', fontWeight: 'bold' }}>{emp.lateMins}</span>
                        ) : '-'}
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
        <div className="card" style={{ overflowX: 'auto', overflowY: 'auto', maxHeight: 'calc(100vh - 250px)', padding: 0 }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '800px' }}>
            <thead>
              <tr style={{ backgroundColor: 'var(--surface-color)' }}>
                <th style={thStyle} className="kh-text">អត្តលេខ<br/>ID<br/><span style={{fontSize: '0.8rem', color: '#64748b'}}>编号</span></th>
                <th style={thStyle} className="kh-text">ឈ្មោះខ្មែរ<br/>Name Khmer<br/><span style={{fontSize: '0.8rem', color: '#64748b'}}>柬文名字</span></th>
                <th style={thStyle} className="kh-text">ឈ្មោះឡាតាំង<br/>Name English<br/><span style={{fontSize: '0.8rem', color: '#64748b'}}>英文名字</span></th>
                <th style={thStyle} className="kh-text">ផ្នែក<br/>Department<br/><span style={{fontSize: '0.8rem', color: '#64748b'}}>部门</span></th>
                <th style={thStyle} className="kh-text">មុខងារ<br/>Position<br/><span style={{fontSize: '0.8rem', color: '#64748b'}}>职务</span></th>
                <th style={thStyle} className="kh-text">សកម្មភាព<br/>Actions<br/><span style={{fontSize: '0.8rem', color: '#64748b'}}>操作</span></th>
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
                  <tr key={emp.id} style={{ transition: 'background-color 0.2s' }}>
                    <td style={tdStyle}>{emp.employeeId}</td>
                    <td style={tdStyle} className="kh-text">{emp.firstNameKh} {emp.lastNameKh}</td>
                    <td style={tdStyle}>{emp.firstNameEn} {emp.lastNameEn}</td>
                    <td style={tdStyle}>{emp.department}</td>
                    <td style={tdStyle} className="kh-text">{emp.position}</td>
                    <td style={tdStyle}>
                       <Link href={`/dashboard/attendance/${emp.id}`} className="btn-secondary kh-text" style={{ textDecoration: 'none', padding: '6px 12px', fontSize: '0.9rem' }}>
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
