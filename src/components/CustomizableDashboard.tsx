'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Responsive, WidthProvider, Layout } from 'react-grid-layout';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
  CartesianGrid,
} from 'recharts';

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
  advanceStats?: { paid: number; remaining: number; count: number };
  weeklyAttendanceData?: { name: string; present: number; absent: number }[];
  recruitmentByDept?: { name: string; count: number }[];
  totalPayrollValue?: number;
  totalAdvanceValue?: number;
  filterGrandTotalSalary?: number;
  filterMonth?: number;
  filterYear?: number;
  todayAttendancesCount?: number;
};

// Enterprise Standard Default Layout (Balanced, High-Readability Grid)
const DEFAULT_LAYOUTS = {
  lg: [
    { i: 'summary_cards', x: 0, y: 0, w: 12, h: 2, minW: 8, minH: 2 },
    { i: 'daily_attendance', x: 0, y: 2, w: 7, h: 3, minW: 4, minH: 2 },
    { i: 'loan_pay', x: 7, y: 2, w: 5, h: 3, minW: 3, minH: 2 },
    { i: 'recruitment', x: 0, y: 5, w: 6, h: 3, minW: 4, minH: 2 },
    { i: 'leave_application', x: 6, y: 5, w: 6, h: 3, minW: 4, minH: 2 },
    { i: 'employees_role', x: 0, y: 8, w: 6, h: 3, minW: 4, minH: 2 },
    { i: 'employees_location', x: 6, y: 8, w: 6, h: 3, minW: 4, minH: 2 },
  ],
};

const CHART_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6', '#06b6d4', '#f97316'];

export default function CustomizableDashboard({
  locale,
  l,
  leaveStats,
  absentStats,
  leaveByDept,
  absentByDept,
  qHires,
  currentY,
  prevY,
  allEmployees,
  groupHires,
  hrContactUrl,
  recentLeaveRequests = [],
  advanceStats = { paid: 0, remaining: 0, count: 0 },
  weeklyAttendanceData = [],
  recruitmentByDept = [],
  totalPayrollValue = 0,
  totalAdvanceValue = 0,
  filterGrandTotalSalary = 0,
  filterMonth = new Date().getMonth() + 1,
  filterYear = new Date().getFullYear(),
  todayAttendancesCount = 0,
}: Props) {
  const [layouts, setLayouts] = useState<any>(null);
  const [isClient, setIsClient] = useState(false);

  // Compute Demographics
  const provinceMap: Record<string, { current: number; prev: number }> = {};
  allEmployees.forEach((emp) => {
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
  });

  const topProvinces = Object.entries(provinceMap)
    .map(([name, data]) => ({ name, count: data.current }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 7);

  const employeesByRole = React.useMemo(() => {
    const dCount: Record<string, number> = {};
    allEmployees.forEach((emp) => {
      const dept = emp.department || 'General';
      dCount[dept] = (dCount[dept] || 0) + 1;
    });
    return Object.entries(dCount)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);
  }, [allEmployees]);

  const totalFemale = allEmployees.filter(
    (e) => e.gender === 'Female' || e.gender === 'F' || e.gender === 'ស្រី'
  ).length;
  const totalMale = allEmployees.filter(
    (e) => e.gender === 'Male' || e.gender === 'M' || e.gender === 'ប្រុស'
  ).length;

  // Real Attendance Calculations
  const calculatedPresent = Math.max(
    0,
    allEmployees.length - (absentStats?.total || 0) - (leaveStats?.total || 0)
  );
  const presentCount = todayAttendancesCount > 0 ? todayAttendancesCount : calculatedPresent;
  const presentFemale = Math.max(
    0,
    totalFemale - (absentStats?.female || 0) - (leaveStats?.female || 0)
  );
  const presentMale = Math.max(
    0,
    totalMale - (absentStats?.male || 0) - (leaveStats?.male || 0)
  );

  const attendanceRate = allEmployees.length > 0
    ? Math.round((presentCount / allEmployees.length) * 100)
    : 0;

  useEffect(() => {
    setIsClient(true);
    const saved = localStorage.getItem('dashboard_layout_v7');
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
    localStorage.setItem('dashboard_layout_v7', JSON.stringify(allLayouts));
  };

  const handleResetLayout = () => {
    localStorage.removeItem('dashboard_layout_v7');
    setLayouts(DEFAULT_LAYOUTS);
    window.location.reload();
  };

  if (!isClient || !layouts) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>
        <div style={{ fontSize: '1.8rem', marginBottom: '10px' }}>⏳</div>
        <div className="kh-text" style={{ fontWeight: 600 }}>កំពុងផ្ទុកផ្ទាំងគ្រប់គ្រងប្រព័ន្ធ... (Loading Dashboard)</div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f8fafc' }}>
      <style jsx>{`
        .hover-elevate {
          transition: transform 0.2s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.2s ease, border-color 0.2s ease !important;
        }
        .hover-elevate:hover {
          transform: translateY(-3px);
          box-shadow: 0 10px 24px rgba(15, 23, 42, 0.08) !important;
        }
      `}</style>
      {/* Top Banner & Controls */}
      <div
        style={{
          padding: '12px 24px',
          backgroundColor: '#ffffff',
          borderBottom: '1px solid #e2e8f0',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem', color: '#475569' }}>
          <span style={{ fontSize: '1.1rem' }}>🌐</span>
          <span className="kh-text" style={{ fontWeight: 700, color: '#0f172a' }}>ផ្ទាំងព័ត៌មានប្រតិបត្តិការរួម (Enterprise Global Dashboard)</span>
          <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>| ចុចលើកាតនីមួយៗដើម្បីចូលទៅកាន់ទិន្នន័យដើម</span>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={() => window.print()}
            className="no-print"
            style={{
              padding: '6px 14px',
              fontSize: '0.85rem',
              backgroundColor: '#ffffff',
              border: '1px solid #cbd5e1',
              color: '#334155',
              borderRadius: '8px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontWeight: 600,
              boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
            }}
          >
            <span>🖨️</span>
            <span>{locale === 'kh' ? 'ព្រីនរបាយការណ៍' : 'Print'}</span>
          </button>

          <button
            onClick={handleResetLayout}
            title="កំណត់ទម្រង់ក្រឡាទៅដើមវិញ"
            style={{
              padding: '6px 14px',
              fontSize: '0.85rem',
              backgroundColor: '#f1f5f9',
              border: '1px solid #cbd5e1',
              color: '#0284c7',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <span>🔄</span>
            <span>Reset Grid Layout</span>
          </button>
        </div>
      </div>

      <div style={{ padding: '20px' }}>
        <ResponsiveGridLayout
          className="layout"
          layouts={layouts}
          breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
          cols={{ lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 }}
          rowHeight={100}
          onLayoutChange={onLayoutChange}
          isDraggable={true}
          isResizable={true}
          draggableHandle=".card-drag-handle"
        >
          {/* ========================================================
              1. GLOBAL INTERACTIVE SUMMARY CARDS (6 Standard Cards)
             ======================================================== */}
          <div
            key="summary_cards"
            data-grid={{ x: 0, y: 0, w: 12, h: 2, minW: 8, minH: 2 }}
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
              gap: '14px',
            }}
          >
            {/* Card 1: Total Employees */}
            <Link
              href="/dashboard/employees"
              style={{
                textDecoration: 'none',
                backgroundColor: '#ffffff',
                borderRadius: '14px',
                padding: '16px 18px',
                border: '1px solid #e2e8f0',
                borderLeft: '4px solid #0284c7',
                boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                transition: 'all 0.2s ease',
                cursor: 'pointer',
              }}
              className="hover-elevate"
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div className="kh-text" style={{ fontSize: '0.82rem', color: '#64748b', fontWeight: 600 }}>
                    បុគ្គលិកសរុប (Employees)
                  </div>
                  <div style={{ fontSize: '1.9rem', fontWeight: 800, color: '#0f172a', lineHeight: 1.15, marginTop: '4px' }}>
                    {allEmployees.length}
                  </div>
                </div>
                <div style={{ width: '38px', height: '38px', borderRadius: '10px', backgroundColor: '#e0f2fe', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem' }}>
                  👥
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px', fontSize: '0.75rem', color: '#64748b' }}>
                <span>ស្រី: <strong style={{ color: '#0f172a' }}>{totalFemale}</strong> | ប្រុស: <strong style={{ color: '#0f172a' }}>{totalMale}</strong></span>
                <span style={{ color: '#0284c7', fontWeight: 700 }}>ចូលមើល ➔</span>
              </div>
            </Link>

            {/* Card 2: Present Today */}
            <Link
              href="/dashboard/attendance"
              style={{
                textDecoration: 'none',
                backgroundColor: '#ffffff',
                borderRadius: '14px',
                padding: '16px 18px',
                border: '1px solid #e2e8f0',
                borderLeft: '4px solid #10b981',
                boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                transition: 'all 0.2s ease',
                cursor: 'pointer',
              }}
              className="hover-elevate"
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div className="kh-text" style={{ fontSize: '0.82rem', color: '#64748b', fontWeight: 600 }}>
                    វត្តមានថ្ងៃនេះ (Present)
                  </div>
                  <div style={{ fontSize: '1.9rem', fontWeight: 800, color: '#059669', lineHeight: 1.15, marginTop: '4px' }}>
                    {presentCount}
                  </div>
                </div>
                <div style={{ width: '38px', height: '38px', borderRadius: '10px', backgroundColor: '#d1fae5', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem' }}>
                  ✅
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px', fontSize: '0.75rem', color: '#64748b' }}>
                <span>អត្រាវត្តមាន: <strong style={{ color: '#059669' }}>{attendanceRate}%</strong></span>
                <span style={{ color: '#10b981', fontWeight: 700 }}>ចូលមើល ➔</span>
              </div>
            </Link>

            {/* Card 3: On Leave */}
            <Link
              href="/dashboard/leave"
              style={{
                textDecoration: 'none',
                backgroundColor: '#ffffff',
                borderRadius: '14px',
                padding: '16px 18px',
                border: '1px solid #e2e8f0',
                borderLeft: '4px solid #f59e0b',
                boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                transition: 'all 0.2s ease',
                cursor: 'pointer',
              }}
              className="hover-elevate"
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div className="kh-text" style={{ fontSize: '0.82rem', color: '#64748b', fontWeight: 600 }}>
                    ច្បាប់ឈប់សម្រាក (On Leave)
                  </div>
                  <div style={{ fontSize: '1.9rem', fontWeight: 800, color: '#d97706', lineHeight: 1.15, marginTop: '4px' }}>
                    {leaveStats.total}
                  </div>
                </div>
                <div style={{ width: '38px', height: '38px', borderRadius: '10px', backgroundColor: '#fef3c7', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem' }}>
                  🌴
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px', fontSize: '0.75rem', color: '#64748b' }}>
                <span>ស្រី: <strong>{leaveStats?.female || 0}</strong> | ប្រុស: <strong>{leaveStats?.male || 0}</strong></span>
                <span style={{ color: '#d97706', fontWeight: 700 }}>ចូលមើល ➔</span>
              </div>
            </Link>

            {/* Card 4: Absent */}
            <Link
              href="/dashboard/attendance"
              style={{
                textDecoration: 'none',
                backgroundColor: '#ffffff',
                borderRadius: '14px',
                padding: '16px 18px',
                border: '1px solid #e2e8f0',
                borderLeft: '4px solid #ef4444',
                boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                transition: 'all 0.2s ease',
                cursor: 'pointer',
              }}
              className="hover-elevate"
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div className="kh-text" style={{ fontSize: '0.82rem', color: '#64748b', fontWeight: 600 }}>
                    អវត្តមានថ្ងៃនេះ (Absents)
                  </div>
                  <div style={{ fontSize: '1.9rem', fontWeight: 800, color: '#dc2626', lineHeight: 1.15, marginTop: '4px' }}>
                    {absentStats.total}
                  </div>
                </div>
                <div style={{ width: '38px', height: '38px', borderRadius: '10px', backgroundColor: '#fee2e2', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem' }}>
                  ❌
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px', fontSize: '0.75rem', color: '#64748b' }}>
                <span>ស្រី: <strong>{absentStats?.female || 0}</strong> | ប្រុស: <strong>{absentStats?.male || 0}</strong></span>
                <span style={{ color: '#ef4444', fontWeight: 700 }}>ចូលមើល ➔</span>
              </div>
            </Link>

            {/* Card 5: Payroll Run */}
            <Link
              href="/dashboard/payroll"
              style={{
                textDecoration: 'none',
                backgroundColor: '#ffffff',
                borderRadius: '14px',
                padding: '16px 18px',
                border: '1px solid #e2e8f0',
                borderLeft: '4px solid #6366f1',
                boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                transition: 'all 0.2s ease',
                cursor: 'pointer',
              }}
              className="hover-elevate"
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div className="kh-text" style={{ fontSize: '0.82rem', color: '#64748b', fontWeight: 600 }}>
                    បើកប្រាក់ខែ (Payroll)
                  </div>
                  <div style={{ fontSize: '1.7rem', fontWeight: 800, color: '#4338ca', lineHeight: 1.15, marginTop: '4px' }}>
                    ${filterGrandTotalSalary > 0
                      ? Math.round(filterGrandTotalSalary).toLocaleString()
                      : Math.round(totalPayrollValue).toLocaleString()}
                  </div>
                </div>
                <div style={{ width: '38px', height: '38px', borderRadius: '10px', backgroundColor: '#e0e7ff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem' }}>
                  💰
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px', fontSize: '0.75rem', color: '#64748b' }}>
                <span>ខែ {filterMonth}/{filterYear}</span>
                <span style={{ color: '#6366f1', fontWeight: 700 }}>ចូលមើល ➔</span>
              </div>
            </Link>

            {/* Card 6: Advance & Loans */}
            <Link
              href="/dashboard/advance"
              style={{
                textDecoration: 'none',
                backgroundColor: '#ffffff',
                borderRadius: '14px',
                padding: '16px 18px',
                border: '1px solid #e2e8f0',
                borderLeft: '4px solid #8b5cf6',
                boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                transition: 'all 0.2s ease',
                cursor: 'pointer',
              }}
              className="hover-elevate"
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div className="kh-text" style={{ fontSize: '0.82rem', color: '#64748b', fontWeight: 600 }}>
                    បុរេប្រទាន & កម្ចី (Advances)
                  </div>
                  <div style={{ fontSize: '1.7rem', fontWeight: 800, color: '#6d28d9', lineHeight: 1.15, marginTop: '4px' }}>
                    ${(advanceStats.paid + advanceStats.remaining > 0
                      ? advanceStats.paid + advanceStats.remaining
                      : totalAdvanceValue
                    ).toLocaleString()}
                  </div>
                </div>
                <div style={{ width: '38px', height: '38px', borderRadius: '10px', backgroundColor: '#ede9fe', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem' }}>
                  💵
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px', fontSize: '0.75rem', color: '#64748b' }}>
                <span>{advanceStats.count} នាក់ស្នើសុំ</span>
                <span style={{ color: '#8b5cf6', fontWeight: 700 }}>ចូលមើល ➔</span>
              </div>
            </Link>
          </div>

          {/* ========================================================
              2. DAILY ATTENDANCE STATISTIC CHART
             ======================================================== */}
          <div
            key="daily_attendance"
            data-grid={{ x: 0, y: 2, w: 7, h: 3, minW: 4, minH: 2 }}
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '16px',
              padding: '18px 20px',
              border: '1px solid #e2e8f0',
              boxShadow: '0 3px 10px rgba(0,0,0,0.03)',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <div className="card-drag-handle" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', cursor: 'grab' }}>
              <div>
                <h3 className="kh-text" style={{ margin: 0, fontSize: '1.05rem', color: '#0f172a', fontWeight: 700 }}>
                  📅 ស្ថិតិវត្តមានប្រចាំសប្តាហ៍ (Daily Attendance)
                </h3>
                <span style={{ fontSize: '0.75rem', color: '#64748b' }}>៧ ថ្ងៃចុងក្រោយ • Last 7 Days</span>
              </div>
              <Link
                href="/dashboard/attendance"
                style={{
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  color: '#0284c7',
                  textDecoration: 'none',
                  backgroundColor: '#f0f9ff',
                  padding: '4px 10px',
                  borderRadius: '6px',
                  border: '1px solid #bae6fd',
                }}
              >
                មើលតារាងវត្តមាន ➔
              </Link>
            </div>

            <div style={{ flex: 1, minHeight: '160px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={weeklyAttendanceData.length > 0 ? weeklyAttendanceData : [{ name: 'Sun', present: 0, absent: 0 }]}
                  margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                  <Tooltip
                    contentStyle={{ borderRadius: '10px', border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgba(0,0,0,0.08)', fontSize: '0.85rem' }}
                  />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', paddingTop: '4px' }} align="right" verticalAlign="top" />
                  <Bar dataKey="present" name="មានវត្តមាន (Present)" fill="#10b981" radius={[4, 4, 0, 0]} barSize={22} />
                  <Bar dataKey="absent" name="អវត្តមាន (Absent)" fill="#f43f5e" radius={[4, 4, 0, 0]} barSize={22} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* ========================================================
              3. ADVANCE SALARY & LOAN HEALTH (DONUT)
             ======================================================== */}
          <div
            key="loan_pay"
            data-grid={{ x: 7, y: 2, w: 5, h: 3, minW: 3, minH: 2 }}
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '16px',
              padding: '18px 20px',
              border: '1px solid #e2e8f0',
              boxShadow: '0 3px 10px rgba(0,0,0,0.03)',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <div className="card-drag-handle" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', cursor: 'grab' }}>
              <div>
                <h3 className="kh-text" style={{ margin: 0, fontSize: '1.05rem', color: '#0f172a', fontWeight: 700 }}>
                  💳 ស្ថានភាពប្រាក់កម្ចី & បុរេប្រទាន (Loans & Advances)
                </h3>
                <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Advance & Loan Status</span>
              </div>
              <Link
                href="/dashboard/advance"
                style={{
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  color: '#6366f1',
                  textDecoration: 'none',
                  backgroundColor: '#eef2ff',
                  padding: '4px 10px',
                  borderRadius: '6px',
                  border: '1px solid #c7d2fe',
                }}
              >
                គ្រប់គ្រង ➔
              </Link>
            </div>

            <div style={{ flex: 1, position: 'relative', minHeight: '140px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={[
                      { name: 'បានទូទាត់កាត់កង (Deducted)', value: advanceStats.paid || 1 },
                      { name: 'នៅសល់ត្រូវសង (Pending)', value: advanceStats.remaining || 1 },
                    ]}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="85%"
                    startAngle={180}
                    endAngle={0}
                    innerRadius={70}
                    outerRadius={95}
                    paddingAngle={4}
                    stroke="none"
                  >
                    <Cell fill="#10b981" />
                    <Cell fill="#6366f1" />
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0' }} />
                </PieChart>
              </ResponsiveContainer>
              <div style={{ position: 'absolute', bottom: '15%', left: '50%', transform: 'translateX(-50%)', textAlign: 'center' }}>
                <div style={{ color: '#0f172a', fontSize: '1.4rem', fontWeight: 800 }}>
                  ${(advanceStats.paid + advanceStats.remaining).toLocaleString()}
                </div>
                <div style={{ color: '#64748b', fontSize: '0.75rem' }}>ទឹកប្រាក់សរុប (Total Volume)</div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-around', backgroundColor: '#f8fafc', padding: '8px', borderRadius: '8px', fontSize: '0.78rem', marginTop: '6px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#10b981' }} />
                <span>បានកាត់: <strong>${advanceStats.paid.toLocaleString()}</strong></span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#6366f1' }} />
                <span>នៅសល់: <strong>${advanceStats.remaining.toLocaleString()}</strong></span>
              </div>
            </div>
          </div>

          {/* ========================================================
              4. RECRUITMENT PIPELINE BY DEPARTMENT
             ======================================================== */}
          <div
            key="recruitment"
            data-grid={{ x: 0, y: 5, w: 6, h: 3, minW: 4, minH: 2 }}
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '16px',
              padding: '18px 20px',
              border: '1px solid #e2e8f0',
              boxShadow: '0 3px 10px rgba(0,0,0,0.03)',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <div className="card-drag-handle" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', cursor: 'grab' }}>
              <div>
                <h3 className="kh-text" style={{ margin: 0, fontSize: '1.05rem', color: '#0f172a', fontWeight: 700 }}>
                  📢 ជ្រើសរើសបុគ្គលិកតាមផ្នែក (Recruitment ATS)
                </h3>
                <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Hiring Demand by Department</span>
              </div>
              <Link
                href="/dashboard/recruitment"
                style={{
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  color: '#0284c7',
                  textDecoration: 'none',
                  backgroundColor: '#f0f9ff',
                  padding: '4px 10px',
                  borderRadius: '6px',
                  border: '1px solid #bae6fd',
                }}
              >
                មើលបេក្ខជន ➔
              </Link>
            </div>

            <div style={{ flex: 1, minHeight: '160px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  layout="vertical"
                  data={recruitmentByDept.length > 0 ? recruitmentByDept : [{ name: 'ទូទៅ (General)', count: 0 }]}
                  margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                  <XAxis type="number" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 11 }} />
                  <YAxis type="category" dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#0f172a', fontSize: 12, fontWeight: 500 }} width={110} />
                  <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0' }} />
                  <Bar dataKey="count" fill="#0284c7" radius={[0, 6, 6, 0]} barSize={18} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* ========================================================
              5. RECENT LEAVE REQUESTS TABLE / LIST
             ======================================================== */}
          <div
            key="leave_application"
            data-grid={{ x: 6, y: 5, w: 6, h: 3, minW: 4, minH: 2 }}
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '16px',
              padding: '18px 20px',
              border: '1px solid #e2e8f0',
              boxShadow: '0 3px 10px rgba(0,0,0,0.03)',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <div className="card-drag-handle" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', cursor: 'grab' }}>
              <div>
                <h3 className="kh-text" style={{ margin: 0, fontSize: '1.05rem', color: '#0f172a', fontWeight: 700 }}>
                  🌴 សំណើសុំច្បាប់ថ្មីៗ (Recent Leave Requests)
                </h3>
                <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Latest Requests & Clearances</span>
              </div>
              <Link
                href="/dashboard/leave"
                style={{
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  color: '#d97706',
                  textDecoration: 'none',
                  backgroundColor: '#fef3c7',
                  padding: '4px 10px',
                  borderRadius: '6px',
                  border: '1px solid #fde68a',
                }}
              >
                មើលទាំងអស់ ➔
              </Link>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {(recentLeaveRequests || []).length > 0 ? (
                recentLeaveRequests.map((req: any, i: number) => {
                  const empName = req.employee
                    ? `${req.employee.lastNameKh || ''} ${req.employee.firstNameKh || ''} (${req.employee.firstNameEn || ''} ${req.employee.lastNameEn || ''})`.trim()
                    : 'បុគ្គលិក';
                  const isApproved = req.status === 'APPROVED';
                  const isRejected = req.status === 'REJECTED';

                  return (
                    <Link
                      key={req.id || i}
                      href="/dashboard/leave"
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '8px 12px',
                        backgroundColor: '#f8fafc',
                        borderRadius: '10px',
                        textDecoration: 'none',
                        transition: 'background 0.15s ease',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{ fontSize: '1.2rem' }}>👤</span>
                        <div>
                          <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0f172a' }}>{empName}</div>
                          <div style={{ fontSize: '0.74rem', color: '#64748b' }}>
                            មូលហេតុ: {req.reason || 'ច្បាប់ផ្ទាល់ខ្លួន'} • {req.leaveType || 'Annual'}
                          </div>
                        </div>
                      </div>

                      <span
                        style={{
                          fontSize: '0.72rem',
                          fontWeight: 700,
                          padding: '3px 8px',
                          borderRadius: '8px',
                          backgroundColor: isApproved ? '#dcfce7' : isRejected ? '#fee2e2' : '#fef3c7',
                          color: isApproved ? '#15803d' : isRejected ? '#b91c1c' : '#b45309',
                        }}
                      >
                        {isApproved ? 'អនុម័តរួច' : isRejected ? 'បដិសេធ' : 'រង់ចាំអនុម័ត'}
                      </span>
                    </Link>
                  );
                })
              ) : (
                <div style={{ textAlign: 'center', padding: '25px', color: '#94a3b8', fontSize: '0.85rem' }}>
                  ពុំទាន់មានពាក្យសុំច្បាប់ដែលរង់ចាំនោះទេ (No recent leave requests)
                </div>
              )}
            </div>
          </div>

          {/* ========================================================
              6. EMPLOYEES BY DEPARTMENT (BAR CHART)
             ======================================================== */}
          <div
            key="employees_role"
            data-grid={{ x: 0, y: 8, w: 6, h: 3, minW: 4, minH: 2 }}
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '16px',
              padding: '18px 20px',
              border: '1px solid #e2e8f0',
              boxShadow: '0 3px 10px rgba(0,0,0,0.03)',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <div className="card-drag-handle" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', cursor: 'grab' }}>
              <div>
                <h3 className="kh-text" style={{ margin: 0, fontSize: '1.05rem', color: '#0f172a', fontWeight: 700 }}>
                  🏢 រចនាសម្ព័ន្ធបុគ្គលិកតាមផ្នែក (Employees by Department)
                </h3>
                <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Department Headcount Distribution</span>
              </div>
              <Link
                href="/dashboard/employees"
                style={{
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  color: '#6366f1',
                  textDecoration: 'none',
                  backgroundColor: '#eef2ff',
                  padding: '4px 10px',
                  borderRadius: '6px',
                  border: '1px solid #c7d2fe',
                }}
              >
                បញ្ជីបុគ្គលិក ➔
              </Link>
            </div>

            <div style={{ flex: 1, minHeight: '160px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={employeesByRole} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" axisLine={{ stroke: '#cbd5e1' }} tickLine={false} tick={{ fill: '#475569', fontSize: 11, angle: -25, textAnchor: 'end' }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 11 }} />
                  <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0' }} />
                  <Bar dataKey="count" fill="#6366f1" barSize={24} radius={[6, 6, 0, 0]} label={{ position: 'top', fill: '#475569', fontSize: 11 }} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* ========================================================
              7. EMPLOYEES BY HOMETOWN / LOCATION (HORIZONTAL BAR)
             ======================================================== */}
          <div
            key="employees_location"
            data-grid={{ x: 6, y: 8, w: 6, h: 3, minW: 4, minH: 2 }}
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '16px',
              padding: '18px 20px',
              border: '1px solid #e2e8f0',
              boxShadow: '0 3px 10px rgba(0,0,0,0.03)',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <div className="card-drag-handle" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', cursor: 'grab' }}>
              <div>
                <h3 className="kh-text" style={{ margin: 0, fontSize: '1.05rem', color: '#0f172a', fontWeight: 700 }}>
                  📍 បុគ្គលិកតាមរាជធានី-ខេត្តកំណើត (Employees by Hometown)
                </h3>
                <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Hometown & Geographical Spread</span>
              </div>
              <Link
                href="/dashboard/employees"
                style={{
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  color: '#ec4899',
                  textDecoration: 'none',
                  backgroundColor: '#fdf2f8',
                  padding: '4px 10px',
                  borderRadius: '6px',
                  border: '1px solid #fbcfe8',
                }}
              >
                មើលទីតាំង ➔
              </Link>
            </div>

            <div style={{ flex: 1, minHeight: '160px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  layout="vertical"
                  data={topProvinces.length > 0 ? topProvinces : [{ name: 'ភ្នំពេញ (Phnom Penh)', count: allEmployees.length }]}
                  margin={{ top: 5, right: 30, left: 10, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                  <XAxis type="number" hide />
                  <YAxis type="category" dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#334155', fontSize: 12, fontWeight: 500 }} width={110} />
                  <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0' }} />
                  <Bar dataKey="count" fill="#ec4899" barSize={18} radius={[0, 6, 6, 0]} label={{ position: 'right', fill: '#475569', fontSize: 11 }} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </ResponsiveGridLayout>
      </div>
    </div>
  );
}
