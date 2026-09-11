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
  recentLeaveRequests?: any[];
  advanceStats?: { paid: number, remaining: number, count: number };
  weeklyAttendanceData?: { name: string, present: number, absent: number }[];
  recruitmentByDept?: { name: string, count: number }[];
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
  qHires, currentY, prevY, allEmployees, groupHires, hrContactUrl,
  recentLeaveRequests = [], advanceStats = { paid: 0, remaining: 0, count: 0 }, weeklyAttendanceData = [], recruitmentByDept = []
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

  const employeesByRole = React.useMemo(() => {
    const dCount: Record<string, number> = {};
    allEmployees.forEach(emp => {
      const dept = emp.department || 'General';
      dCount[dept] = (dCount[dept] || 0) + 1;
    });
    return Object.entries(dCount)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);
  }, [allEmployees]);

  const totalFemale = allEmployees.filter(e => e.gender === 'Female' || e.gender === 'F' || e.gender === 'ស្រី').length;
  const totalMale = allEmployees.filter(e => e.gender === 'Male' || e.gender === 'M' || e.gender === 'ប្រុស').length;
  const presentFemale = Math.max(0, totalFemale - (absentStats?.female || 0) - (leaveStats?.female || 0));
  const presentMale = Math.max(0, totalMale - (absentStats?.male || 0) - (leaveStats?.male || 0));

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
    const saved = localStorage.getItem('dashboard_layout_v6');
    if (saved) {
      try {
        setLayouts(JSON.parse(saved));
      } catch (e) {
        setLayouts(DEFAULT_LAYOUTS);
      }
    } else {
      setLayouts(DEFAULT_LAYOUTS);
    }
  }, []);

  const onLayoutChange = (layout: Layout[], allLayouts: any) => {
    setLayouts(allLayouts);
    localStorage.setItem('dashboard_layout_v6', JSON.stringify(allLayouts));
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
          
        >
          
          
                    {/* 1. Summary Cards (2x2 Grid) */}
          <div key="summary_cards" data-grid={{ x: 0, y: 0, w: 5, h: 3, minW: 4, minH: 3 }} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gridTemplateRows: '1fr 1fr', gap: '15px' }}>
            <div style={{ backgroundColor: '#0ea5e9', borderRadius: '16px', padding: '20px', color: '#fff', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', boxShadow: '0 4px 10px rgba(14, 165, 233, 0.2)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ fontSize: '0.95rem', opacity: 0.9, marginBottom: '5px' }}>Total Employee</div>
                  <div style={{ display: 'flex', alignItems: 'flex-end', gap: '10px' }}>
                    <div style={{ fontSize: '2.2rem', fontWeight: 'bold', lineHeight: '1' }}>{allEmployees.length}</div>
                    <div style={{ fontSize: '0.85rem', opacity: 0.9, paddingBottom: '4px' }}>
                      ( {locale === 'kh' ? 'ស្រី' : 'F'}: {totalFemale} / {locale === 'kh' ? 'ប្រុស' : 'M'}: {totalMale} )
                    </div>
                  </div>
                </div>
                <div style={{ backgroundColor: 'rgba(255,255,255,0.2)', width: '40px', height: '40px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>👥</div>
              </div>
              <div style={{ fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ backgroundColor: '#fff', color: '#0ea5e9', padding: '2px 8px', borderRadius: '12px', fontWeight: 'bold' }}>+15%</span> 
                <span>Employee Hiring</span>
              </div>
            </div>

            <div style={{ backgroundColor: '#fff', borderRadius: '16px', padding: '20px', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', boxShadow: '0 4px 6px rgba(0,0,0,0.02)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ fontSize: '0.95rem', color: '#64748b', marginBottom: '5px' }}>Total Presents</div>
                  <div style={{ display: 'flex', alignItems: 'flex-end', gap: '10px' }}>
                    <div style={{ fontSize: '2.2rem', fontWeight: 'bold', lineHeight: '1', color: '#0f172a' }}>{allEmployees.length - absentStats.total - leaveStats.total}</div>
                    <div style={{ fontSize: '0.85rem', color: '#64748b', paddingBottom: '4px' }}>
                      ( {locale === 'kh' ? 'ស្រី' : 'F'}: {presentFemale} / {locale === 'kh' ? 'ប្រុស' : 'M'}: {presentMale} )
                    </div>
                  </div>
                </div>
                <div style={{ backgroundColor: '#f1f5f9', width: '40px', height: '40px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#3b82f6' }}>✅</div>
              </div>
              <div style={{ fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '8px', color: '#64748b' }}>
                <span style={{ backgroundColor: '#fef2f2', color: '#ef4444', padding: '2px 8px', borderRadius: '12px', fontWeight: 'bold' }}>-2%</span> 
                <span>Daily Attendance</span>
              </div>
            </div>

            <div style={{ backgroundColor: '#fff', borderRadius: '16px', padding: '20px', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', boxShadow: '0 4px 6px rgba(0,0,0,0.02)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ fontSize: '0.95rem', color: '#64748b', marginBottom: '5px' }}>Total Absents</div>
                  <div style={{ display: 'flex', alignItems: 'flex-end', gap: '10px' }}>
                    <div style={{ fontSize: '2.2rem', fontWeight: 'bold', lineHeight: '1', color: '#0f172a' }}>{absentStats.total}</div>
                    <div style={{ fontSize: '0.85rem', color: '#64748b', paddingBottom: '4px' }}>
                      ( {locale === 'kh' ? 'ស្រី' : 'F'}: {absentStats?.female || 0} / {locale === 'kh' ? 'ប្រុស' : 'M'}: {absentStats?.male || 0} )
                    </div>
                  </div>
                </div>
                <div style={{ backgroundColor: '#f1f5f9', width: '40px', height: '40px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ef4444' }}>❌</div>
              </div>
              <div style={{ fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '8px', color: '#64748b' }}>
                <span style={{ backgroundColor: '#fef2f2', color: '#ef4444', padding: '2px 8px', borderRadius: '12px', fontWeight: 'bold' }}>-5%</span> 
                <span>New Recruitment</span>
              </div>
            </div>

            <div style={{ backgroundColor: '#fff', borderRadius: '16px', padding: '20px', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', boxShadow: '0 4px 6px rgba(0,0,0,0.02)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ fontSize: '0.95rem', color: '#64748b', marginBottom: '5px' }}>Total Leave</div>
                  <div style={{ display: 'flex', alignItems: 'flex-end', gap: '10px' }}>
                    <div style={{ fontSize: '2.2rem', fontWeight: 'bold', lineHeight: '1', color: '#0f172a' }}>{leaveStats.total}</div>
                    <div style={{ fontSize: '0.85rem', color: '#64748b', paddingBottom: '4px' }}>
                      ( {locale === 'kh' ? 'ស្រី' : 'F'}: {leaveStats?.female || 0} / {locale === 'kh' ? 'ប្រុស' : 'M'}: {leaveStats?.male || 0} )
                    </div>
                  </div>
                </div>
                <div style={{ backgroundColor: '#f1f5f9', width: '40px', height: '40px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#f59e0b' }}>🌴</div>
              </div>
              <div style={{ fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '8px', color: '#64748b' }}>
                <span style={{ backgroundColor: '#fef2f2', color: '#ef4444', padding: '2px 8px', borderRadius: '12px', fontWeight: 'bold' }}>-1%</span> 
                <span>Need New Employee</span>
              </div>
            </div>
          </div>

          {/* 2. Daily Attendance Statistic */}
          <div key="daily_attendance" data-grid={{ x: 5, y: 0, w: 7, h: 3, minW: 5, minH: 3 }} style={{ backgroundColor: '#fff', borderRadius: '16px', padding: '20px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px rgba(0,0,0,0.02)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ margin: 0, fontSize: '1.2rem', color: '#0f172a' }}>Daily attendance statistic</h3>
              <span style={{ color: '#64748b', fontSize: '0.9rem' }}>This Week</span>
            </div>
            <div style={{ width: '100%', height: 'calc(100% - 40px)' }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={weeklyAttendanceData.length > 0 ? weeklyAttendanceData : [{ name: 'Sun', present: 0, absent: 0 }]}>
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} tickFormatter={(value) => `${value}%`} />
                  <Tooltip cursor={{fill: 'transparent'}} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }} />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} verticalAlign="top" align="right" />
                  <Bar dataKey="present" name="Present" fill="#d946ef" radius={[0, 0, 8, 8]} stackId="a" barSize={16} />
                  <Bar dataKey="absent" name="Absent" fill="#3b82f6" radius={[8, 8, 0, 0]} stackId="a" barSize={16} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* 3. Recruitment (Horizontal Bar) */}
          <div key="recruitment" data-grid={{ x: 0, y: 3, w: 4, h: 3, minW: 3, minH: 2 }} style={{ backgroundColor: '#fff', borderRadius: '16px', padding: '20px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px rgba(0,0,0,0.02)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ margin: 0, fontSize: '1.2rem', color: '#0f172a' }}>Recruitment</h3>
              <span style={{ color: '#64748b', fontSize: '0.9rem' }}>Yearly ⌄</span>
            </div>
            <div style={{ width: '100%', height: 'calc(100% - 40px)' }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart layout="vertical" data={recruitmentByDept.length > 0 ? recruitmentByDept : [{ name: 'General', count: 0 }]}>
                  <XAxis type="number" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                  <YAxis type="category" dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#d946ef', fontSize: 12}} width={90} />
                  <Tooltip cursor={{fill: '#f1f5f9'}} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }} />
                  <Bar dataKey="count" fill="#0ea5e9" radius={[0, 4, 4, 0]} barSize={16} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* 4. Loan Pay Received */}
          <div key="loan_pay" data-grid={{ x: 4, y: 3, w: 4, h: 3, minW: 3, minH: 2 }} style={{ backgroundColor: '#fff', borderRadius: '16px', padding: '20px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px rgba(0,0,0,0.02)', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <h3 style={{ margin: 0, fontSize: '1.2rem', color: '#0f172a' }}>Advance Salary</h3>
              <span style={{ color: '#ef4444', fontSize: '0.9rem', fontWeight: 'bold' }}>-12% ↑</span>
            </div>
            <div style={{ flex: 1, position: 'relative' }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={[{ name: 'Paid', value: advanceStats.paid }, { name: 'Remaining', value: advanceStats.remaining }]} dataKey="value" nameKey="name" cx="50%" cy="100%" startAngle={180} endAngle={0} innerRadius={80} outerRadius={100} fill="#8884d8" paddingAngle={5} stroke="none">
                    <Cell fill="#0ea5e9" />
                    <Cell fill="#d946ef" />
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div style={{ position: 'absolute', bottom: '10%', left: '50%', transform: 'translateX(-50%)', textAlign: 'center' }}>
                <div style={{ color: '#d946ef', fontSize: '1.5rem', fontWeight: 'bold' }}>$\{advanceStats.paid + advanceStats.remaining}</div>
                <div style={{ color: '#64748b', fontSize: '0.85rem' }}>Loan Amount</div>
              </div>
            </div>
            <div style={{ textAlign: 'center', backgroundColor: '#f8fafc', padding: '8px', borderRadius: '8px', fontSize: '0.85rem', color: '#64748b', marginTop: '10px' }}>
              <span style={{ color: '#0ea5e9', fontWeight: 'bold' }}>💡 Total Loan Amount:</span> {advanceStats.count} People
            </div>
          </div>

          {/* 5. Leave Application */}
          <div key="leave_application" data-grid={{ x: 8, y: 3, w: 4, h: 3, minW: 3, minH: 2 }} style={{ backgroundColor: '#fff', borderRadius: '16px', padding: '20px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px rgba(0,0,0,0.02)', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
              <h3 style={{ margin: 0, fontSize: '1.2rem', color: '#0f172a' }}>Leave Application</h3>
              <span style={{ color: '#64748b', fontSize: '0.9rem', cursor: 'pointer' }}>See All ⌄</span>
            </div>
            <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '15px' }}>
              {(recentLeaveRequests || []).length > 0 ? (
                (recentLeaveRequests || []).map((req: any, i: number) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <img src={`https://i.pravatar.cc/100?img=${(i % 10) + 1}`} alt="avatar" style={{ width: '40px', height: '40px', borderRadius: '50%' }} />
                      <div>
                        <div style={{ fontWeight: 'bold', color: '#0f172a', fontSize: '0.95rem' }}>{req.employee?.firstNameEn} {req.employee?.lastNameEn}</div>
                        <div style={{ color: '#64748b', fontSize: '0.8rem' }}>Reason: {req.reason || 'Sick'}</div>
                      </div>
                    </div>
                    <span style={{ color: req.status === 'APPROVED' ? '#10b981' : req.status === 'REJECTED' ? '#ef4444' : '#f59e0b', fontSize: '0.85rem', fontWeight: 'bold' }}>
                      {req.status === 'APPROVED' ? 'Approved' : req.status === 'REJECTED' ? 'Rejected' : 'Requested'}
                    </span>
                  </div>
                ))
              ) : (
                [1, 2, 3, 4].map(i => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: '#f1f5f9' }}></div>
                      <div>
                        <div style={{ fontWeight: 'bold', color: '#0f172a', fontSize: '0.95rem' }}>Employee Name</div>
                        <div style={{ color: '#64748b', fontSize: '0.8rem' }}>Reason: Sick</div>
                      </div>
                    </div>
                    <span style={{ color: i % 2 === 0 ? '#10b981' : '#f59e0b', fontSize: '0.85rem', fontWeight: 'bold' }}>
                      {i % 2 === 0 ? 'Approved' : 'Requested'}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* 6. Employees by Role & Location (Charts) */}
          <div key="employee_list" data-grid={{ x: 0, y: 6, w: 12, h: 4, minW: 6, minH: 3 }} style={{ display: 'flex', gap: '20px' }}>
            {/* Employees by Role */}
            <div style={{ flex: 1, backgroundColor: '#fff', borderRadius: '16px', padding: '15px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px rgba(0,0,0,0.02)', display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h3 style={{ margin: 0, fontSize: '1.2rem', color: '#0f172a' }}>Employees by Role</h3>
              </div>
              <div style={{ flex: 1 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={employeesByRole} margin={{ top: 20, right: 20, left: -20, bottom: 40 }}>
                    <XAxis dataKey="name" axisLine={{ stroke: '#cbd5e1' }} tickLine={false} tick={{fill: '#475569', fontSize: 11, angle: -45, textAnchor: 'end'}} interval={0} />
                    <YAxis axisLine={{ stroke: '#cbd5e1' }} tickLine={false} tick={{fill: '#475569', fontSize: 11}} label={{ value: '# of Employee', angle: -90, position: 'insideLeft', fill: '#475569', fontSize: 12, offset: 10 }} />
                    <Tooltip cursor={{fill: '#f1f5f9'}} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }} />
                    <Bar dataKey="count" fill="#0ea5e9" barSize={25} radius={[4, 4, 0, 0]} label={{ position: 'top', fill: '#475569', fontSize: 11 }} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Employees by Location */}
            <div style={{ flex: 1, backgroundColor: '#fff', borderRadius: '16px', padding: '15px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px rgba(0,0,0,0.02)', display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h3 style={{ margin: 0, fontSize: '1.2rem', color: '#0f172a' }}>Number of Employees by Location</h3>
              </div>
              <div style={{ flex: 1 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart layout="vertical" data={topProvinces} margin={{ top: 20, right: 40, left: 10, bottom: 20 }}>
                    <XAxis type="number" hide />
                    <YAxis type="category" dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#475569', fontSize: 12}} width={100} />
                    <Tooltip cursor={{fill: '#f1f5f9'}} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }} />
                    <Bar dataKey="count" fill="#d946ef" barSize={16} radius={[0, 4, 4, 0]} label={{ position: 'right', fill: '#475569', fontSize: 11 }} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </ResponsiveGridLayout>
      </div>
    </div>
  );
}
