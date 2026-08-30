'use client';

import React, { useState, useEffect } from 'react';
import { Responsive, WidthProvider, Layout } from 'react-grid-layout';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';

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

  if (!isClient || !layouts) return <div>Loading Dashboard Layout...</div>;

  return (
    <div style={{ minHeight: '800px', backgroundColor: '#fefefe' }}>
      <div style={{ padding: '12px 30px', backgroundColor: '#e3f2fd', borderBottom: '1px solid #bbdefb', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: 'clamp(0.9rem, 3cqmin, 1.1rem)', color: '#1565c0' }}>💡 លោកអ្នកអាចចាប់ទាញ (Drag) របារខាងលើនៃផ្ទាំងនីមួយៗ ដើម្បីផ្លាស់ប្តូរទីតាំង ឬទាញកែងខាងស្តាំក្រោម ដើម្បីបង្រួម/ពង្រីក (Resize)។</span>
        <div style={{ display: 'flex', gap: '15px' }}>
          <button 
            onClick={() => window.print()} 
            className="no-print"
            style={{ padding: '6px 12px', fontSize: 'clamp(0.9rem, 3cqmin, 1.1rem)', backgroundColor: '#fff', border: '1px solid #475569', color: '#475569', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px', fontWeight: 'bold' }}
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
          <div key="summary" style={{ background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)', borderRadius: '16px', boxShadow: '0 10px 25px rgba(139, 92, 246, 0.2)', overflow: 'hidden', display: 'flex', flexDirection: 'column', position: 'relative' }}>
            <div style={{ position: 'absolute', top: '-50%', left: '-10%', width: '300px', height: '300px', background: 'radial-gradient(circle, rgba(255,255,255,0.15) 0%, transparent 70%)', borderRadius: '50%', pointerEvents: 'none' }}></div>
            <div style={{ position: 'absolute', bottom: '-30%', right: '-5%', width: '250px', height: '250px', background: 'radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%)', borderRadius: '50%', pointerEvents: 'none' }}></div>
            
            <div className="drag-handle" style={{ padding: '4px 15px', backgroundColor: 'rgba(255, 255, 255, 0.1)', borderBottom: '1px solid rgba(255, 255, 255, 0.2)', cursor: 'grab', display: 'flex', alignItems: 'center', gap: '8px', zIndex: 1 }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.9)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
              <span style={{ fontWeight: 'bold', fontSize: '1.1rem', color: 'rgba(255,255,255,0.95)', letterSpacing: '0.5px', whiteSpace: 'nowrap' }} className={locale === 'kh' ? 'kh-text' : ''}>{locale === 'kh' ? 'សេចក្តីសង្ខេប (Summary)' : 'Summary'}</span>
            </div>
            
            <div style={{ padding: 'clamp(8px, 2cqh, 15px) clamp(15px, 4cqw, 25px)', flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '15px', containerType: 'size', zIndex: 1, overflow: 'visible' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  style={{ width: 'clamp(50px, 12cqmin, 80px)', height: 'clamp(50px, 12cqmin, 80px)', borderRadius: '50%', border: '2px solid rgba(255,255,255,0.8)', overflow: 'hidden', cursor: 'pointer', boxShadow: '0 4px 8px rgba(0,0,0,0.2)', position: 'relative', flexShrink: 0, backgroundColor: '#fff' }}
                  title="Click to change HR Contact Avatar"
                  className="interactive-icon"
                >
                  <img src={hrImg} alt="HR" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  <div style={{ position: 'absolute', bottom: 0, width: '100%', backgroundColor: 'rgba(0,0,0,0.6)', color: '#fff', fontSize: '0.65rem', textAlign: 'center', padding: '4px 0', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 'bold' }}>Upload</div>
                  <input type="file" accept="image/*" ref={fileInputRef} onChange={handleUpload} style={{ display: 'none' }} />
                </div>
                <div style={{ paddingBottom: '8px', overflow: 'visible' }}>
                  <h1 style={{ color: '#ffffff', fontSize: 'clamp(1.4rem, 4.5cqmin, 2.2rem)', margin: 0, fontWeight: 'bold', lineHeight: 'normal', textShadow: '0 2px 4px rgba(0,0,0,0.2)', whiteSpace: 'nowrap', overflow: 'visible' }} className={locale === 'kh' ? 'moul-text' : ''}>
                    {locale === 'en' ? <><span style={{ fontWeight: 'bold' }}>HR</span> Hiring Dashboard</> : (l.title || 'ទំព័រដើមគ្រប់គ្រងធនធានមនុស្ស')}
                  </h1>
                </div>
              </div>
              
              <div style={{ display: 'flex', gap: '15px', flexWrap: 'nowrap', alignItems: 'center' }}>
                <div style={{ display: 'flex', flexDirection: 'column', backgroundColor: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(10px)', borderRadius: '10px', padding: '12px 20px', minWidth: '120px', border: '1px solid rgba(255,255,255,0.2)', boxShadow: '0 4px 12px rgba(0,0,0,0.15)', justifyContent: 'center' }}>
                  <span style={{ fontSize: 'clamp(0.85rem, 2cqmin, 1.05rem)', fontWeight: 'bold', color: 'rgba(255,255,255,0.95)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px', whiteSpace: 'nowrap' }} className={locale === 'kh' ? 'kh-text' : ''}>{l.totalEmployees || 'បុគ្គលិកសរុប'}</span>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                    <span style={{ fontSize: 'clamp(1.8rem, 5cqmin, 2.5rem)', fontWeight: 'bold', color: '#ffffff', lineHeight: '1' }}>{allEmployees.length.toLocaleString()}</span>
                    <span style={{ fontSize: 'clamp(0.9rem, 2cqmin, 1.1rem)', fontWeight: 'normal', color: 'rgba(255,255,255,0.9)', whiteSpace: 'nowrap' }} className={locale === 'kh' ? 'kh-text' : ''}>{locale === 'kh' ? 'នាក់' : 'people'}</span>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', backgroundColor: 'rgba(59, 130, 246, 0.25)', backdropFilter: 'blur(10px)', borderRadius: '10px', padding: '12px 20px', minWidth: '110px', border: '1px solid rgba(96, 165, 250, 0.3)', boxShadow: '0 4px 12px rgba(0,0,0,0.15)', justifyContent: 'center' }}>
                  <span style={{ fontSize: 'clamp(0.85rem, 2cqmin, 1.05rem)', fontWeight: 'bold', color: '#bae6fd', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px', whiteSpace: 'nowrap' }} className={locale === 'kh' ? 'kh-text' : ''}>{locale === 'kh' ? 'ប្រុស (M)' : 'Male'}</span>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
                    <span style={{ fontSize: 'clamp(1.8rem, 5cqmin, 2.5rem)', fontWeight: 'bold', color: '#ffffff', lineHeight: '1' }}>{allEmployees.filter(e => e.gender === 'Male' || e.gender === 'M' || e.gender === 'ប្រុស' || (e.gender && e.gender.includes('ប្រុស'))).length.toLocaleString()}</span>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', backgroundColor: 'rgba(236, 72, 153, 0.25)', backdropFilter: 'blur(10px)', borderRadius: '10px', padding: '12px 20px', minWidth: '110px', border: '1px solid rgba(244, 114, 182, 0.3)', boxShadow: '0 4px 12px rgba(0,0,0,0.15)', justifyContent: 'center' }}>
                  <span style={{ fontSize: 'clamp(0.85rem, 2cqmin, 1.05rem)', fontWeight: 'bold', color: '#fbcfe8', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px', whiteSpace: 'nowrap' }} className={locale === 'kh' ? 'kh-text' : ''}>{locale === 'kh' ? 'ស្រី (F)' : 'Female'}</span>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
                    <span style={{ fontSize: 'clamp(1.8rem, 5cqmin, 2.5rem)', fontWeight: 'bold', color: '#ffffff', lineHeight: '1' }}>{allEmployees.filter(e => e.gender === 'Female' || e.gender === 'F' || e.gender === 'ស្រី' || (e.gender && e.gender.includes('ស្រី'))).length.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 1. Attendance Widget */}
          <div key="attendance" style={{ backgroundColor: '#fff', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', overflow: 'hidden', display: 'flex', flexDirection: 'column', containerType: 'size' }}>
            <div className="drag-handle" style={{ padding: '10px 15px', backgroundColor: '#f8f9fa', borderBottom: '1px solid #eee', cursor: 'grab', fontWeight: 'bold', fontSize: '1.25rem', color: '#333' }}>
              📊 ស្ថិតិអវត្តមាន និងច្បាប់ (Attendance)
            </div>
            <div style={{ padding: '15px', flex: 1, overflowY: 'auto' }}>
              <div style={{ display: 'flex', gap: '15px', flexDirection: 'column' }}>
                {/* On Leave Block */}
                <div style={{ backgroundColor: '#fdf9ff', border: '1px solid #ebccff', borderRadius: '6px', padding: '12px' }}>
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
          <div key="trends" style={{ backgroundColor: '#fff', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', overflow: 'hidden', display: 'flex', flexDirection: 'column', containerType: 'size' }}>
            <div className="drag-handle" style={{ padding: '10px 15px', backgroundColor: '#f8f9fa', borderBottom: '1px solid #eee', cursor: 'grab', fontWeight: 'bold', fontSize: '1.25rem', color: '#333' }}>
              📈 ស្ថិតិជ្រើសរើសបុគ្គលិកប្រចាំត្រីមាស (Hiring Trends)
            </div>
            <div style={{ padding: '15px', flex: 1, display: 'flex', justifyContent: 'space-around', alignItems: 'center', overflowX: 'auto' }}>
              {['Q1', 'Q2', 'Q3', 'Q4'].map(q => (
                <div key={q} style={{ textAlign: 'center' }}>
                  <div style={{ fontWeight: 'bold', fontSize: '1.1rem', marginBottom: '12px', backgroundColor: '#f8f9fa', padding: '6px 12px', borderRadius: '4px' }} className={locale === 'kh' ? 'kh-text' : ''}>{l[`${q.toLowerCase()}NewHires`]}</div>
                  <div style={{ fontSize: '1.1rem', fontWeight: 'bold', marginBottom: '10px' }} className={locale === 'kh' ? 'kh-text' : ''}>{l.yoy} {renderTrend(qHires.current[q], qHires.prev[q])}</div>
                  <div style={{ fontSize: '1.05rem', color: '#555', display: 'flex', justifyContent: 'center', gap: '10px' }}>
                    <span>{currentY}: <span style={{ fontWeight: 'bold', fontSize: '1.2rem', color: '#000' }}>{qHires.current[q]}</span></span>
                  </div>
                  <div style={{ fontSize: '1.05rem', color: '#555', display: 'flex', justifyContent: 'center', gap: '10px', marginTop: '6px' }}>
                    <span>{prevY}: <span style={{ fontWeight: 'bold', fontSize: '1.2rem', color: '#000' }}>{qHires.prev[q]}</span></span>
                  </div>
                </div>
              ))}

            </div>
          </div>

          {/* 3. New Hires Widget */}
          <div key="newHires" style={{ backgroundColor: '#fff', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', overflow: 'hidden', display: 'flex', flexDirection: 'column', containerType: 'size' }}>
            <div className="drag-handle" style={{ padding: '10px 15px', backgroundColor: '#f8f9fa', borderBottom: '1px solid #eee', cursor: 'grab', fontWeight: 'bold', fontSize: '1.25rem', color: '#333' }}>
              👤 {l.incomingNewHire}
            </div>
            <div style={{ flex: 1, overflowY: 'auto' }}>
              <table style={{ width: '100%', fontSize: '1.05rem', textAlign: 'left', borderCollapse: 'collapse' }}>
                <thead style={{ position: 'sticky', top: 0, backgroundColor: '#fff', zIndex: 1 }}>
                  <tr>
                    <th style={{ padding: '10px 15px', borderBottom: '2px solid #ddd', fontWeight: 'bold', width: '70px', lineHeight: '1.3' }} className={locale === 'kh' ? 'kh-text' : ''}>{l.onboardingComplete}</th>
                    <th style={{ padding: '10px 15px', borderBottom: '2px solid #ddd', fontWeight: 'bold' }} className={locale === 'kh' ? 'kh-text' : ''}>{l.primary}</th>
                    <th style={{ padding: '10px 15px', borderBottom: '2px solid #ddd', fontWeight: 'bold' }} className={locale === 'kh' ? 'kh-text' : ''}>{l.dept}</th>
                    <th style={{ padding: '10px 15px', borderBottom: '2px solid #ddd', fontWeight: 'bold' }} className={locale === 'kh' ? 'kh-text' : ''}>{l.startDate}</th>
                  </tr>
                </thead>
                <tbody>
                  {allEmployees.slice(0, 10).map((emp, idx) => (
                    <tr key={emp.id} style={{ borderBottom: '1px solid #eee' }}>
                      <td style={{ padding: '10px 15px' }}><div style={{ width: `${Math.max(10, 100 - idx * 10)}%`, height: '8px', backgroundColor: '#2196f3', borderRadius: '4px' }}></div></td>
                      <td style={{ padding: '10px 15px', fontWeight: 'bold', color: '#333' }}>{locale === 'kh' ? (`${emp.lastNameKh || ''} ${emp.firstNameKh || ''}`.trim() || `${emp.lastNameEn} ${emp.firstNameEn}`) : `${emp.firstNameEn} ${emp.lastNameEn}`}</td>
                      <td style={{ padding: '10px 15px' }}>{emp.department}</td>
                      <td style={{ padding: '10px 15px' }}>{new Date(emp.hireDate).toLocaleDateString('en-GB')}</td>
                    </tr>
                  ))}
                  {allEmployees.length === 0 && (
                    <tr><td colSpan={4} style={{ padding: '15px', textAlign: 'center', fontSize: '1.1rem' }}>No employees found</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          
          {/* 5. Demographics Widget */}
          <div key="demographics" style={{ backgroundColor: '#fff', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', overflow: 'hidden', display: 'flex', flexDirection: 'column', containerType: 'size' }}>
            <div className="drag-handle" style={{ padding: '10px 15px', backgroundColor: '#f5f0f6', borderBottom: '1px solid #e1d5e7', cursor: 'grab', fontWeight: 'bold', fontSize: '1.25rem', color: '#6a1b9a' }}>
              🌍 ស្ថិតិទីកន្លែងកំណើត និងជនបរទេស (Demographics)
            </div>
            <div style={{ display: 'flex', flex: 1, padding: '15px', gap: '20px' }}>
              
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                <h4 style={{ textAlign: 'center', fontSize: 'clamp(1rem, 3cqmin, 1.2rem)', marginBottom: '15px', color: '#444', fontWeight: 'bold' }}>ខេត្តកំណើតច្រើនជាងគេ (Top Provinces)</h4>
                <div style={{ flex: 1, minHeight: '150px' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={topProvinces} layout="horizontal" margin={{ top: 15, right: 10, left: 0, bottom: 5 }}>
                      <XAxis dataKey="name" type="category" axisLine={false} tickLine={false} style={{ fontSize: '12px', fontWeight: 'bold' }} />
                      <YAxis type="number" hide />
                      <Tooltip contentStyle={{ fontSize: '14px', borderRadius: '8px' }} />
                      <Legend wrapperStyle={{ fontSize: '13px', fontWeight: 'bold' }} />
                      <Bar dataKey="prevCount" name={locale === 'kh' ? `ឆ្នាំ ${prevY}` : `${prevY}`} fill="#cbd5e1" barSize={16} radius={[4, 4, 0, 0]} />
                      <Bar dataKey="count" name={locale === 'kh' ? `ឆ្នាំ ${currentY}` : `${currentY}`} fill="#8884d8" barSize={16} radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div style={{ width: '1px', backgroundColor: '#eee' }}></div>

              <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                <h4 style={{ textAlign: 'center', fontSize: 'clamp(1rem, 3cqmin, 1.2rem)', marginBottom: '15px', color: '#444', fontWeight: 'bold' }}>ជនបរទេសច្រើនជាងគេ (Top Foreigners)</h4>
                <div style={{ flex: 1, minHeight: '150px' }}>
                  {topNationalities.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={topNationalities} layout="horizontal" margin={{ top: 15, right: 10, left: 0, bottom: 5 }}>
                        <XAxis dataKey="name" type="category" axisLine={false} tickLine={false} style={{ fontSize: '12px', fontWeight: 'bold' }} />
                        <YAxis type="number" hide />
                        <Tooltip contentStyle={{ fontSize: '14px', borderRadius: '8px' }} />
                        <Legend wrapperStyle={{ fontSize: '13px', fontWeight: 'bold' }} />
                        <Bar dataKey="prevCount" name={locale === 'kh' ? `ឆ្នាំ ${prevY}` : `${prevY}`} fill="#cbd5e1" barSize={16} radius={[4, 4, 0, 0]} />
                        <Bar dataKey="count" name={locale === 'kh' ? `ឆ្នាំ ${currentY}` : `${currentY}`} fill="#82ca9d" barSize={16} radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', fontSize: 'clamp(1rem, 3cqmin, 1.2rem)', color: '#999', fontStyle: 'italic' }}>មិនមានជនបរទេសទេ (No Foreigners)</div>
                  )}
                </div>
              </div>

            </div>
          </div>

          {/* 4. Dynamic Group Widgets */}
          {Object.entries(groupHires).filter(([groupName, data]) => groupName !== 'Other' || data.count > 0).map(([groupName, data]) => (
            <div key={`group_${groupName}`} style={{ backgroundColor: '#fff', border: `1px solid ${data.color}`, borderRadius: '8px', overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', display: 'flex', flexDirection: 'column', containerType: 'size' }}>
              <div className="drag-handle" style={{ backgroundColor: data.color, color: data.textColor, padding: '8px 10px', textAlign: 'center', fontWeight: 'bold', fontSize: '1.2rem', textTransform: 'uppercase', cursor: 'grab' }}>
                {groupName}
              </div>
              <div style={{ padding: '15px 10px', textAlign: 'center', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                <div style={{ fontSize: 'clamp(1rem, 3cqmin, 1.15rem)', marginBottom: '8px', color: '#555' }} className={locale === 'kh' ? 'kh-text' : ''}>{l.totalEmployees}: <span style={{ fontWeight: 'bold', fontSize: '1.3rem', color: '#000', marginLeft: '5px' }}>{data.count}</span></div>
                
                <div style={{ fontSize: '1.05rem', marginBottom: '10px', borderTop: '1px solid rgba(0,0,0,0.05)', paddingTop: '10px', color: '#666' }} className={locale === 'kh' ? 'kh-text' : ''}>{l.hiringRate} {renderTrend(data.current, data.prev)}</div>
                
                <div style={{ display: 'flex', justifyContent: 'center', gap: '15px' }}>
                  <div style={{ fontSize: '1.05rem', color: '#777', textAlign: 'center' }}>
                    <div>{currentY}</div>
                    <div style={{ fontWeight: 'bold', fontSize: '1.2rem', color: '#000', marginTop: '2px' }}>{data.current}</div>
                  </div>
                  <div style={{ width: '1px', backgroundColor: 'rgba(0,0,0,0.1)' }}></div>
                  <div style={{ fontSize: '1.05rem', color: '#777', textAlign: 'center' }}>
                    <div>{prevY}</div>
                    <div style={{ fontWeight: 'bold', fontSize: '1.2rem', color: '#000', marginTop: '2px' }}>{data.prev}</div>
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
