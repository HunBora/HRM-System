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
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px', marginBottom: '20px' }}>
            <div onClick={() => setFilter('all')} style={{ cursor: 'pointer', padding: '15px', borderRadius: '12px', background: filter === 'all' ? '#e2e8f0' : '#f8fafc', border: '1px solid #cbd5e1' }}>
              <div className="kh-text" style={{ color: '#64748b', fontSize: '0.9rem', marginBottom: '5px' }}>បុគ្គលិកសរុប (Total)</div>
              <div style={{ fontSize: '1.8rem', fontWeight: 'bold', color: '#0f172a' }}>{totalEmployees}</div>
            </div>
            <div onClick={() => setFilter('present')} style={{ cursor: 'pointer', padding: '15px', borderRadius: '12px', background: filter === 'present' ? '#dcfce7' : '#f0fdf4', border: '1px solid #bbf7d0' }}>
              <div className="kh-text" style={{ color: '#166534', fontSize: '0.9rem', marginBottom: '5px' }}>មកទាន់ម៉ោង (On Time)</div>
              <div style={{ fontSize: '1.8rem', fontWeight: 'bold', color: '#15803d' }}>{presentCount}</div>
            </div>
            <div onClick={() => setFilter('late')} style={{ cursor: 'pointer', padding: '15px', borderRadius: '12px', background: filter === 'late' ? '#fef08a' : '#fef9c3', border: '1px solid #fde047' }}>
              <div className="kh-text" style={{ color: '#854d0e', fontSize: '0.9rem', marginBottom: '5px' }}>មកយឺត (Late)</div>
              <div style={{ fontSize: '1.8rem', fontWeight: 'bold', color: '#ca8a04' }}>{lateCount}</div>
            </div>
            <div onClick={() => setFilter('absent')} style={{ cursor: 'pointer', padding: '15px', borderRadius: '12px', background: filter === 'absent' ? '#fee2e2' : '#fef2f2', border: '1px solid #fecaca' }}>
              <div className="kh-text" style={{ color: '#991b1b', fontSize: '0.9rem', marginBottom: '5px' }}>អវត្តមាន (Absent)</div>
              <div style={{ fontSize: '1.8rem', fontWeight: 'bold', color: '#b91c1c' }}>{absentCount}</div>
            </div>
          </div>

          {/* Daily Table */}
          <div className="card" style={{ overflowX: 'auto', overflowY: 'auto', maxHeight: 'calc(100vh - 350px)', padding: 0 }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '800px' }}>
              <thead>
                <tr>
                  <th style={thStyle} className="kh-text">អត្តលេខ<br/>ID</th>
                  <th style={thStyle} className="kh-text">ឈ្មោះខ្មែរ<br/>Name Khmer</th>
                  <th style={thStyle} className="kh-text">ឈ្មោះឡាតាំង<br/>Name English</th>
                  <th style={thStyle} className="kh-text">ម៉ោងចូល<br/>Check In</th>
                  <th style={thStyle} className="kh-text">ម៉ោងចេញ<br/>Check Out</th>
                  <th style={thStyle} className="kh-text">ស្ថានភាព<br/>Status</th>
                  <th style={thStyle} className="kh-text">មកយឺត (នាទី)<br/>Late (Mins)</th>
                </tr>
              </thead>
              <tbody>
                {filteredData.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ padding: '20px', textAlign: 'center' }} className="kh-text">គ្មានទិន្នន័យ (No Data)</td>
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
        </>
      )}

      {activeTab === 'monthly' && (
        <div className="card" style={{ overflowX: 'auto', overflowY: 'auto', maxHeight: 'calc(100vh - 250px)', padding: 0 }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '800px' }}>
            <thead>
              <tr style={{ backgroundColor: 'var(--surface-color)' }}>
                <th style={thStyle}>ID</th>
                <th style={thStyle}>Khmer Name</th>
                <th style={thStyle}>English Name</th>
                <th style={thStyle}>Department</th>
                <th style={thStyle}>Position</th>
                <th style={thStyle}>Actions</th>
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
