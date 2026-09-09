'use client';

import React, { useState, useEffect } from 'react';
import { Responsive, WidthProvider, Layout } from 'react-grid-layout';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const ResponsiveGridLayout = WidthProvider(Responsive);

type Props = {
  locale: string;
  l: any;
  leaveStats: any;
  absentStats: any;
  leaveByDept: Record<string, any>;
  absentByDept: Record<string, any>;
  qHires: any;
  currentY: number;
  prevY: number;
  allEmployees: any[];
  groupHires: Record<string, any>;
  hrContactUrl?: string;
};

const DEFAULT_LAYOUTS = {
  lg: [
    { i: 'summary', x: 0, y: 0, w: 12, h: 1, minW: 6, minH: 1 },
    { i: 'attendance', x: 0, y: 1, w: 7, h: 3, minW: 4, minH: 2 },
    { i: 'trends', x: 0, y: 4, w: 7, h: 2, minW: 4, minH: 2 },
    { i: 'newHires', x: 7, y: 1, w: 5, h: 5, minW: 3, minH: 3 },
    { i: 'demographics', x: 0, y: 6, w: 12, h: 4, minW: 6, minH: 3 },
    // Group Hires will be mapped dynamically below
  ]
};

export default function CustomizableDashboard({
  locale, l, leaveStats, absentStats, leaveByDept, absentByDept,
  qHires, currentY, prevY, allEmployees, groupHires, hrContactUrl
}: Props) {
  
  const [layouts, setLayouts] = useState<any>(null);

  const [isClient, setIsClient] = useState(false);

  // Compute Demographics
  const provinceMap: Record<string, { current: number, prev: number }> = {};
  const natMap: Record<string, { current: number, prev: number }> = {};
  
  allEmployees.forEach(emp => {
    const empYear = emp.hireDate ? new Date(emp.hireDate).getFullYear() : currentY;
    const isPrev = empYear < currentY;

    if (emp.placeOfBirth) {
      const p = emp.placeOfBirth.trim();
      if (p.length > 1) {
         if (!provinceMap[p]) provinceMap[p] = { current: 0, prev: 0 };
         provinceMap[p].current += 1;
         if (isPrev) provinceMap[p].prev += 1;
      }
    }
    if (emp.nationality) {
      const n = emp.nationality.trim().toLowerCase();
      if (!n.includes('khmer') && !n.includes('cambodia') && !n.includes('ខ្មែរ')) {
         const rawN = emp.nationality.trim();
         if (!natMap[rawN]) natMap[rawN] = { current: 0, prev: 0 };
         natMap[rawN].current += 1;
         if (isPrev) natMap[rawN].prev += 1;
      }
    }
  });

  const topProvinces = Object.entries(provinceMap)
    .map(([name, data]) => ({ name, count: data.current, prevCount: data.prev }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 7);

  const topNationalities = Object.entries(natMap)
    .map(([name, data]) => ({ name, count: data.current, prevCount: data.prev }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 7);



  const [hrImg, setHrImg] = useState(hrContactUrl || 'https://i.pravatar.cc/100?img=5');
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (event) => {
      const base64 = event.target?.result as string;
      setHrImg(base64);
      // Send to API
      try {
        await fetch('/api/company-settings/hr-contact', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ hrContactUrl: base64 }) });
      } catch (err) {}
    };
    reader.readAsDataURL(file);
  };

  useEffect(() => {
    setIsClient(true);
    // Load from local storage if exists
    const saved = localStorage.getItem('dashboard_layout_v5');
    
    // Generate dynamic layout for groups
    const dynamicLayout = { ...DEFAULT_LAYOUTS };
    let currentX = 0;
    let currentY_pos = 10;
    
    const validGroups = Object.entries(groupHires).filter(([groupName, data]) => groupName !== 'Other' || data.count > 0);
    
    validGroups.forEach(([groupName, _], idx) => {
      dynamicLayout.lg.push({
        i: `group_${groupName}`,
        x: currentX,
        y: currentY_pos,
        w: 2,
        h: 2,
        minW: 2,
        minH: 2
      });
      currentX += 2;
      if (currentX >= 12) {
        currentX = 0;
        currentY_pos += 2;
      }
    });

    if (saved) {
      try {
        setLayouts(JSON.parse(saved));
      } catch (e) {
        setLayouts(dynamicLayout);
      }
    } else {
      setLayouts(dynamicLayout);
    }
  }, [groupHires]);

  const onLayoutChange = (layout: Layout[], allLayouts: any) => {
    setLayouts(allLayouts);
    localStorage.setItem('dashboard_layout_v5', JSON.stringify(allLayouts));
  };

  const renderTrend = (current: number, prev: number) => {
    if (current > prev) return <span style={{ color: '#388e3c' }}>▲</span>;
    if (current < prev) return <span style={{ color: '#d32f2f' }}>▼</span>;
    return <span style={{ color: '#f57c00' }}>—</span>;
  };

  if (!isClient || !layouts) return <div style={{ padding: '20px' }}>Loading Dashboard...</div>;

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f1f5f9' }}>
      <div style={{ padding: '12px 30px', backgroundColor: '#ffffff', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: '0.95rem', color: '#64748b' }}>💡 លោកអ្នកអាចចាប់ទាញ (Drag) របារខាងលើនៃផ្ទាំងនីមួយៗ ដើម្បីផ្លាស់ប្តូរទីតាំង ឬទាញកែងខាងស្តាំក្រោម ដើម្បីបង្រួម/ពង្រីក (Resize)។</span>
        <div style={{ display: 'flex', gap: '15px' }}>
          <button 
            onClick={() => window.print()} 
            className="no-print"
            style={{ padding: '6px 12px', fontSize: '0.95rem', backgroundColor: '#ffffff', border: '1px solid #cbd5e1', color: '#475569', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px', fontWeight: 'bold' }}
          >
            🖨️ {locale === 'kh' ? 'ព្រីន (Print)' : 'Print'}
          </button>
          <button 
            onClick={() => { localStorage.removeItem('dashboard_layout_v5'); window.location.reload(); }}
            style={{ padding: '6px 12px', fontSize: 'clamp(0.9rem, 3cqmin, 1.1rem)', backgroundColor: '#fff', border: '1px solid #1976d2', color: '#1976d2', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
          >
            Reset Layout
          </button>
        </div>
      </div>
      
      <div style={{ padding: '15px' }}>
        <ResponsiveGridLayout
          className="layout"
          layouts={layouts}
          breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
          cols={{ lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 }}
          rowHeight={100}
          onLayoutChange={onLayoutChange}
          draggableHandle=".drag-handle"
        >
          
          
          {/* 0. Summary Widget (Top Row) */}
          <div key="summary" style={{ backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            <div className="drag-handle" style={{ padding: '8px 15px', backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0', cursor: 'grab', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
              <span style={{ fontWeight: 'bold', fontSize: '1rem', color: '#475569' }} className={locale === 'kh' ? 'kh-text' : ''}>{locale === 'kh' ? 'សេចក្តីសង្ខេប (Overview)' : 'Overview'}</span>
            </div>
            
            <div style={{ padding: 'clamp(15px, 3cqh, 25px)', flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '20px', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  style={{ width: '60px', height: '60px', borderRadius: '50%', border: '2px solid #e2e8f0', overflow: 'hidden', cursor: 'pointer', position: 'relative', flexShrink: 0, backgroundColor: '#f1f5f9' }}
                  title="Click to change HR Contact Avatar"
                  className="interactive-icon"
                >
                  <img src={hrImg} alt="HR" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  <div style={{ position: 'absolute', bottom: 0, width: '100%', backgroundColor: 'rgba(15, 23, 42, 0.7)', color: '#fff', fontSize: '0.6rem', textAlign: 'center', padding: '2px 0', fontWeight: 'bold' }}>EDIT</div>
                  <input type="file" accept="image/*" ref={fileInputRef} onChange={handleUpload} style={{ display: 'none' }} />
                </div>
                <div>
                  <h1 style={{ color: '#0f172a', fontSize: 'clamp(1.2rem, 3cqmin, 1.8rem)', margin: 0, fontWeight: '800', letterSpacing: '-0.5px' }} className={locale === 'kh' ? 'moul-text' : ''}>
                    {locale === 'en' ? 'HR Dashboard' : (l.title || 'គ្រប់គ្រងធនធានមនុស្ស')}
                  </h1>
                  <p style={{ margin: '5px 0 0 0', color: '#64748b', fontSize: '0.9rem' }}>Welcome back! Here is what is happening today.</p>
                </div>
              </div>
              
              <div style={{ display: 'flex', gap: '15px', flexWrap: 'nowrap', alignItems: 'center' }}>
                {/* Total Employees */}
                <div style={{ display: 'flex', flexDirection: 'column', backgroundColor: '#f8fafc', borderRadius: '8px', padding: '15px 20px', minWidth: '140px', border: '1px solid #e2e8f0' }}>
                  <span style={{ fontSize: '0.85rem', fontWeight: 'bold', color: '#64748b', textTransform: 'uppercase' }} className={locale === 'kh' ? 'kh-text' : ''}>{l.totalEmployees || 'បុគ្គលិកសរុប'}</span>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginTop: '5px' }}>
                    <span style={{ fontSize: '2rem', fontWeight: '800', color: '#0f172a', lineHeight: '1' }}>{allEmployees.length.toLocaleString()}</span>
                  </div>
                </div>

                {/* Male */}
                <div style={{ display: 'flex', flexDirection: 'column', backgroundColor: '#eff6ff', borderRadius: '8px', padding: '15px 20px', minWidth: '120px', border: '1px solid #bfdbfe' }}>
                  <span style={{ fontSize: '0.85rem', fontWeight: 'bold', color: '#1d4ed8', textTransform: 'uppercase' }} className={locale === 'kh' ? 'kh-text' : ''}>{locale === 'kh' ? 'ប្រុស (Male)' : 'Male'}</span>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px', marginTop: '5px' }}>
                    <span style={{ fontSize: '2rem', fontWeight: '800', color: '#1e3a8a', lineHeight: '1' }}>{allEmployees.filter(e => e.gender === 'Male' || e.gender === 'M' || e.gender === 'ប្រុស' || (e.gender && e.gender.includes('ប្រុស'))).length.toLocaleString()}</span>
                  </div>
                </div>

                {/* Female */}
                <div style={{ display: 'flex', flexDirection: 'column', backgroundColor: '#fdf2f8', borderRadius: '8px', padding: '15px 20px', minWidth: '120px', border: '1px solid #fbcfe8' }}>
                  <span style={{ fontSize: '0.85rem', fontWeight: 'bold', color: '#be185d', textTransform: 'uppercase' }} className={locale === 'kh' ? 'kh-text' : ''}>{locale === 'kh' ? 'ស្រី (Female)' : 'Female'}</span>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px', marginTop: '5px' }}>
                    <span style={{ fontSize: '2rem', fontWeight: '800', color: '#831843', lineHeight: '1' }}>{allEmployees.filter(e => e.gender === 'Female' || e.gender === 'F' || e.gender === 'ស្រី' || (e.gender && e.gender.includes('ស្រី'))).length.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 1. Attendance Widget */}
          <div key="attendance" style={{ backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            <div className="drag-handle" style={{ padding: '10px 15px', backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0', cursor: 'grab', fontWeight: 'bold', fontSize: '1rem', color: '#475569', display: 'flex', alignItems: 'center', gap: '8px' }}>
              📊 ស្ថិតិអវត្តមាន និងច្បាប់ (Attendance)
            </div>
            <div style={{ padding: '20px', flex: 1, overflowY: 'auto' }}>
              <div style={{ display: 'flex', gap: '20px', flexDirection: 'column' }}>
                {/* On Leave Block */}
                <div style={{ backgroundColor: '#f8fafc', border: '1px solid #f1f5f9', borderRadius: '8px', padding: '15px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', borderBottom: '1px dashed #ebccff', paddingBottom: '8px' }}>
                    <div style={{ fontWeight: 'bold', fontSize: '1.2rem', color: '#9c27b0' }} className={locale === 'kh' ? 'kh-text' : ''}>
                      <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#9c27b0', marginRight: '6px' }}></span>
                      {l.hasLeave}
                    </div>
                    <div style={{ fontSize: '1.05rem', color: '#555' }} className={locale === 'kh' ? 'kh-text' : ''}>
                      {locale === 'kh' ? 'សរុបរួម' : 'Total'}: <span style={{ fontWeight: 'bold', color: '#9c27b0', fontSize: '1.25rem' }}>{leaveStats.total}</span> ( {l.fmLabel} {leaveStats.female}/{leaveStats.male} )
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                    {Object.entries(leaveByDept).map(([dept, stats]: any) => (
                      <div key={dept} style={{ backgroundColor: '#fff', border: '1px solid #f0e6ff', borderRadius: '6px', padding: '6px 10px', fontSize: '1.05rem', display: 'flex', gap: '10px', alignItems: 'center' }}>
                        <span style={{ fontWeight: 'bold', color: '#333' }}>{dept}</span>
                        <span style={{ backgroundColor: '#fcf4ff', color: '#9c27b0', padding: '3px 8px', borderRadius: '12px', fontWeight: 'bold', fontSize: '1.1rem' }}>{stats.total}</span>
                        <span style={{ color: '#666', fontSize: '0.95rem' }}>{stats.f}ស្រី/{stats.m}ប្រុស</span>
                      </div>
                    ))}
                    {Object.keys(leaveByDept).length === 0 && <span style={{ fontSize: '1.05rem', color: '#aaa', fontStyle: 'italic' }}>គ្មានអវត្តមានទេ</span>}
                  </div>
                </div>

                {/* Absent Block */}
                <div style={{ backgroundColor: '#f7fbff', border: '1px solid #99c2ff', borderRadius: '6px', padding: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', borderBottom: '1px dashed #99c2ff', paddingBottom: '8px' }}>
                    <div style={{ fontWeight: 'bold', fontSize: '1.2rem', color: '#1976d2' }} className={locale === 'kh' ? 'kh-text' : ''}>
                      <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#1976d2', marginRight: '6px' }}></span>
                      {l.noLeave}
                    </div>
                    <div style={{ fontSize: '1.05rem', color: '#555' }} className={locale === 'kh' ? 'kh-text' : ''}>
                      {locale === 'kh' ? 'សរុបរួម' : 'Total'}: <span style={{ fontWeight: 'bold', color: '#d32f2f', fontSize: '1.25rem' }}>{absentStats.total}</span> ( {l.fmLabel} {absentStats.female}/{absentStats.male} )
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                    {Object.entries(absentByDept).map(([dept, stats]: any) => (
                      <div key={dept} style={{ backgroundColor: '#fff', border: '1px solid #e6f0ff', borderRadius: '6px', padding: '6px 10px', fontSize: '1.05rem', display: 'flex', gap: '10px', alignItems: 'center' }}>
                        <span style={{ fontWeight: 'bold', color: '#333' }}>{dept}</span>
                        <span style={{ backgroundColor: '#fff0f0', color: '#d32f2f', padding: '3px 8px', borderRadius: '12px', fontWeight: 'bold', fontSize: '1.1rem' }}>{stats.total}</span>
                        <span style={{ color: '#666', fontSize: '0.95rem' }}>{stats.f}ស្រី/{stats.m}ប្រុស</span>
                      </div>
                    ))}
                    {Object.keys(absentByDept).length === 0 && <span style={{ fontSize: '1.05rem', color: '#aaa', fontStyle: 'italic' }}>គ្មានអវត្តមានទេ</span>}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 2. Trends Widget */}
          <div key="trends" style={{ backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            <div className="drag-handle" style={{ padding: '10px 15px', backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0', cursor: 'grab', fontWeight: 'bold', fontSize: '1rem', color: '#475569', display: 'flex', alignItems: 'center', gap: '8px' }}>
              📈 ស្ថិតិជ្រើសរើសបុគ្គលិកប្រចាំត្រីមាស (Hiring Trends)
            </div>
            <div style={{ padding: '15px', flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
              <ResponsiveContainer width="100%" height="100%" minHeight={150}>
                <BarChart data={[
                  { name: 'Q1', [prevY.toString()]: qHires.prev['Q1'], [currentY.toString()]: qHires.current['Q1'] },
                  { name: 'Q2', [prevY.toString()]: qHires.prev['Q2'], [currentY.toString()]: qHires.current['Q2'] },
                  { name: 'Q3', [prevY.toString()]: qHires.prev['Q3'], [currentY.toString()]: qHires.current['Q3'] },
                  { name: 'Q4', [prevY.toString()]: qHires.prev['Q4'], [currentY.toString()]: qHires.current['Q4'] }
                ]}>
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} allowDecimals={false} />
                  <Tooltip cursor={{fill: '#f1f5f9'}} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }} />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                  <Bar dataKey={prevY.toString()} fill="#cbd5e1" radius={[4, 4, 0, 0]} barSize={30} />
                  <Bar dataKey={currentY.toString()} fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={30} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* 3. New Hires Widget */}
          <div key="newHires" style={{ backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            <div className="drag-handle" style={{ padding: '10px 15px', backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0', cursor: 'grab', fontWeight: 'bold', fontSize: '1rem', color: '#475569', display: 'flex', alignItems: 'center', gap: '8px' }}>
              👤 {l.incomingNewHire}
            </div>
            <div style={{ flex: 1, overflowY: 'auto', padding: '0 15px 15px 15px' }}>
              <table style={{ width: '100%', fontSize: '0.95rem', textAlign: 'left', borderCollapse: 'collapse' }}>
                <thead style={{ position: 'sticky', top: 0, backgroundColor: '#ffffff', zIndex: 1 }}>
                  <tr>
                    <th style={{ padding: '15px 10px', borderBottom: '2px solid #e2e8f0', fontWeight: 'bold', width: '80px', color: '#64748b' }} className={locale === 'kh' ? 'kh-text' : ''}>{l.onboardingComplete}</th>
                    <th style={{ padding: '15px 10px', borderBottom: '2px solid #e2e8f0', fontWeight: 'bold', color: '#64748b' }} className={locale === 'kh' ? 'kh-text' : ''}>{l.primary}</th>
                    <th style={{ padding: '15px 10px', borderBottom: '2px solid #e2e8f0', fontWeight: 'bold', color: '#64748b' }} className={locale === 'kh' ? 'kh-text' : ''}>{l.dept}</th>
                    <th style={{ padding: '15px 10px', borderBottom: '2px solid #e2e8f0', fontWeight: 'bold', color: '#64748b' }} className={locale === 'kh' ? 'kh-text' : ''}>{l.startDate}</th>
                  </tr>
                </thead>
                <tbody>
                  {allEmployees.slice(0, 10).map((emp, idx) => (
                    <tr key={emp.id} style={{ borderBottom: '1px solid #f1f5f9', transition: 'background-color 0.2s' }} onMouseEnter={e => e.currentTarget.style.backgroundColor = '#f8fafc'} onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}>
                      <td style={{ padding: '12px 10px' }}><div style={{ width: `${Math.max(10, 100 - idx * 10)}%`, height: '8px', backgroundColor: '#3b82f6', borderRadius: '4px' }}></div></td>
                      <td style={{ padding: '12px 10px', fontWeight: 'bold', color: '#0f172a' }}>{locale === 'kh' ? (`${emp.lastNameKh || ''} ${emp.firstNameKh || ''}`.trim() || `${emp.lastNameEn} ${emp.firstNameEn}`) : `${emp.firstNameEn} ${emp.lastNameEn}`}</td>
                      <td style={{ padding: '12px 10px', color: '#475569' }}>{emp.department}</td>
                      <td style={{ padding: '12px 10px', color: '#475569' }}>{new Date(emp.hireDate).toLocaleDateString('en-GB')}</td>
                    </tr>
                  ))}
                  {allEmployees.length === 0 && (
                    <tr><td colSpan={4} style={{ padding: '20px', textAlign: 'center', fontSize: '1rem', color: '#94a3b8' }}>No employees found</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* 5. Demographics Widget */}
          <div key="demographics" style={{ backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            <div className="drag-handle" style={{ padding: '10px 15px', backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0', cursor: 'grab', fontWeight: 'bold', fontSize: '1rem', color: '#475569', display: 'flex', alignItems: 'center', gap: '8px' }}>
              🌍 ស្ថិតិទីកន្លែងកំណើត និងជនបរទេស (Demographics)
            </div>
            <div style={{ display: 'flex', flex: 1, padding: '20px', gap: '30px' }}>
              
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                <h4 style={{ textAlign: 'center', fontSize: '1rem', marginBottom: '10px', color: '#64748b', fontWeight: 'bold' }}>ខេត្តកំណើត (Top Provinces)</h4>
                <div style={{ flex: 1, minHeight: '180px' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={topProvinces} dataKey="count" nameKey="name" cx="50%" cy="50%" innerRadius={50} outerRadius={80} fill="#8884d8" paddingAngle={3} label={false}>
                        {topProvinces.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#14b8a6', '#f97316'][index % 7]} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }} />
                      <Legend verticalAlign="middle" align="right" layout="vertical" iconType="circle" wrapperStyle={{ fontSize: '12px', color: '#475569' }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div style={{ width: '1px', backgroundColor: '#e2e8f0' }}></div>

              <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                <h4 style={{ textAlign: 'center', fontSize: '1rem', marginBottom: '10px', color: '#64748b', fontWeight: 'bold' }}>ជនបរទេស (Top Foreigners)</h4>
                <div style={{ flex: 1, minHeight: '180px' }}>
                  {topNationalities.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={topNationalities} dataKey="count" nameKey="name" cx="50%" cy="50%" innerRadius={50} outerRadius={80} fill="#10b981" paddingAngle={3} label={false}>
                          {topNationalities.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={['#8b5cf6', '#6366f1', '#0ea5e9', '#10b981', '#84cc16', '#eab308', '#f59e0b'][index % 7]} />
                          ))}
                        </Pie>
                        <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }} />
                        <Legend verticalAlign="middle" align="right" layout="vertical" iconType="circle" wrapperStyle={{ fontSize: '12px', color: '#475569' }} />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', fontSize: '1rem', color: '#94a3b8', fontStyle: 'italic' }}>មិនមានជនបរទេសទេ (No Foreigners)</div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* 4. Dynamic Group Widgets */}
          {Object.entries(groupHires).filter(([groupName, data]) => groupName !== 'Other' || data.count > 0).map(([groupName, data]) => (
            <div key={`group_${groupName}`} style={{ backgroundColor: '#fff', border: `1px solid ${data.color}`, borderRadius: '8px', overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', display: 'flex', flexDirection: 'column', containerType: 'size' }}>
              <div className="drag-handle" style={{ backgroundColor: data.color, color: data.textColor, padding: '6px 10px', textAlign: 'center', fontWeight: 'bold', fontSize: '1.1rem', textTransform: 'uppercase', cursor: 'grab' }}>
                {groupName}
              </div>
              <div style={{ padding: '10px', textAlign: 'center', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', overflowY: 'auto' }}>
                <div style={{ fontSize: 'clamp(0.95rem, 3cqmin, 1.1rem)', marginBottom: '5px', color: '#555' }} className={locale === 'kh' ? 'kh-text' : ''}>{l.totalEmployees}: <span style={{ fontWeight: 'bold', fontSize: '1.2rem', color: '#000', marginLeft: '5px' }}>{data.count}</span></div>
                
                <div style={{ fontSize: '1rem', marginBottom: '5px', borderTop: '1px solid rgba(0,0,0,0.05)', paddingTop: '5px', color: '#666' }} className={locale === 'kh' ? 'kh-text' : ''}>{l.hiringRate} {renderTrend(data.current, data.prev)}</div>
                
                <div style={{ display: 'flex', justifyContent: 'center', gap: '15px' }}>
                  <div style={{ fontSize: '1rem', color: '#777', textAlign: 'center' }}>
                    <div>{currentY}</div>
                    <div style={{ fontWeight: 'bold', fontSize: '1.15rem', color: '#000', marginTop: '2px' }}>{data.current}</div>
                  </div>
                  <div style={{ width: '1px', backgroundColor: 'rgba(0,0,0,0.1)' }}></div>
                  <div style={{ fontSize: '1rem', color: '#777', textAlign: 'center' }}>
                    <div>{prevY}</div>
                    <div style={{ fontWeight: 'bold', fontSize: '1.15rem', color: '#000', marginTop: '2px' }}>{data.prev}</div>
                  </div>
                </div>
              </div>
            </div>
          ))}

        </ResponsiveGridLayout>
      </div>
    </div>
  );
}
