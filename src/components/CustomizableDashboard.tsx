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
  AreaChart,
  Area,
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
  weeklyAttendanceData?: {
    name: string;
    nameKh?: string;
    dateStr?: string;
    present: number;
    absent: number;
    rate?: number;
  }[];
  recruitmentByDept?: { name: string; count: number; openJobs?: number; candidates?: number }[];
  recruitmentStats?: {
    totalOpenJobs: number;
    totalCandidates: number;
    hiredCount: number;
    pipeline: Array<{ key: string; nameKh: string; nameEn: string; count: number; color: string; bg: string; border: string; icon: string }>;
    byDept: Array<{ name: string; count: number; openJobs: number; candidates: number }>;
  };
  totalPayrollValue?: number;
  totalAdvanceValue?: number;
  filterGrandTotalSalary?: number;
  filterMonth?: number;
  filterYear?: number;
  todayAttendancesCount?: number;
};

// Enterprise Standard Default Layout (Compact, Fit-Content, High-Readability Grid)
const DEFAULT_LAYOUTS = {
  lg: [
    { i: 'daily_attendance', x: 0, y: 0, w: 7, h: 3, minW: 4, minH: 2 },
    { i: 'loan_pay', x: 7, y: 0, w: 5, h: 3, minW: 3, minH: 2 },
    { i: 'recruitment', x: 0, y: 3, w: 6, h: 3, minW: 4, minH: 2 },
    { i: 'leave_application', x: 6, y: 3, w: 6, h: 3, minW: 4, minH: 2 },
    { i: 'employees_role', x: 0, y: 6, w: 6, h: 3, minW: 4, minH: 2 },
    { i: 'employees_location', x: 6, y: 6, w: 6, h: 3, minW: 4, minH: 2 },
  ],
};

const CHART_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6', '#06b6d4', '#f97316'];

const PROVINCE_THEMES = [
  { from: '#ec4899', to: '#f43f5e', bg: '#fdf2f8', text: '#be185d', border: '#fbcfe8' }, // Rose / Pink
  { from: '#6366f1', to: '#8b5cf6', bg: '#eef2ff', text: '#4338ca', border: '#c7d2fe' }, // Indigo / Violet
  { from: '#0284c7', to: '#06b6d4', bg: '#f0f9ff', text: '#0369a1', border: '#bae6fd' }, // Sky / Cyan
  { from: '#10b981', to: '#14b8a6', bg: '#f0fdf4', text: '#047857', border: '#bbf7d0' }, // Emerald / Teal
  { from: '#f59e0b', to: '#eab308', bg: '#fffbeb', text: '#b45309', border: '#fde68a' }, // Amber / Yellow
  { from: '#8b5cf6', to: '#a855f7', bg: '#faf5ff', text: '#6b21a8', border: '#e9d5ff' }, // Purple
  { from: '#14b8a6', to: '#2dd4bf', bg: '#f0fdfa', text: '#0f766e', border: '#99f6e4' }, // Teal
];

const DEPT_THEMES = [
  { from: '#6366f1', to: '#818cf8', bg: '#eef2ff', text: '#4338ca', border: '#c7d2fe' }, // Indigo
  { from: '#0284c7', to: '#38bdf8', bg: '#f0f9ff', text: '#0369a1', border: '#bae6fd' }, // Sky
  { from: '#10b981', to: '#34d399', bg: '#f0fdf4', text: '#047857', border: '#bbf7d0' }, // Emerald
  { from: '#f59e0b', to: '#fbbf24', bg: '#fffbeb', text: '#b45309', border: '#fde68a' }, // Amber
  { from: '#8b5cf6', to: '#a78bfa', bg: '#faf5ff', text: '#6b21a8', border: '#e9d5ff' }, // Purple
  { from: '#ec4899', to: '#f472b6', bg: '#fdf2f8', text: '#be185d', border: '#fbcfe8' }, // Pink
  { from: '#14b8a6', to: '#2dd4bf', bg: '#f0fdfa', text: '#0f766e', border: '#99f6e4' }, // Teal
  { from: '#f97316', to: '#fb923c', bg: '#fff7ed', text: '#c2410c', border: '#fed7aa' }, // Orange
];

const getDeptIcon = (name: string) => {
  const n = (name || '').toLowerCase();
  if (n.includes('it') || n.includes('tech') || n.includes('ព័ត៌មាន') || n.includes('software')) return '💻';
  if (n.includes('hr') || n.includes('human') || n.includes('ធនធានមនុស្ស') || n.includes('personnel')) return '👥';
  if (n.includes('account') || n.includes('finance') || n.includes('ហិរញ្ញវត្ថុ') || n.includes('គណនេយ្យ') || n.includes('audit')) return '💰';
  if (n.includes('sale') || n.includes('market') || n.includes('លក់') || n.includes('ទីផ្សារ')) return '📈';
  if (n.includes('op') || n.includes('operation') || n.includes('ប្រតិបត្តិ') || n.includes('ផលិត')) return '⚙️';
  if (n.includes('log') || n.includes('warehouse') || n.includes('ដឹកជញ្ជូន') || n.includes('ឃ្លាំង')) return '🚚';
  if (n.includes('admin') || n.includes('រដ្ឋបាល') || n.includes('legal') || n.includes('ច្បាប់')) return '📋';
  if (n.includes('clean') || n.includes('security') || n.includes('សន្តិសុខ') || n.includes('អនាម័យ')) return '🛡️';
  return '🏢';
};

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
  recruitmentStats,
  totalPayrollValue = 0,
  totalAdvanceValue = 0,
  filterGrandTotalSalary = 0,
  filterMonth = new Date().getMonth() + 1,
  filterYear = new Date().getFullYear(),
  todayAttendancesCount = 0,
}: Props) {
  const [layouts, setLayouts] = useState<any>(null);
  const [isClient, setIsClient] = useState(false);
  const [recruitmentView, setRecruitmentView] = useState<'pipeline' | 'departments'>('pipeline');
  const [hometownView, setHometownView] = useState<'leaderboard' | 'donut'>('leaderboard');
  const [attendanceView, setAttendanceView] = useState<'trend' | 'bar'>('trend');
  const [departmentView, setDepartmentView] = useState<'leaderboard' | 'donut'>('leaderboard');

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
    const dCount: Record<string, { total: number; female: number; male: number }> = {};
    allEmployees.forEach((emp) => {
      const dept = emp.department || 'ទូទៅ (General)';
      if (!dCount[dept]) dCount[dept] = { total: 0, female: 0, male: 0 };
      dCount[dept].total += 1;
      const isF = emp.gender === 'Female' || emp.gender === 'F' || emp.gender === 'ស្រី';
      if (isF) dCount[dept].female += 1;
      else dCount[dept].male += 1;
    });
    return Object.entries(dCount)
      .map(([name, data]) => ({
        name,
        count: data.total,
        female: data.female,
        male: data.male,
        percentage: allEmployees.length > 0 ? Math.round((data.total / allEmployees.length) * 100) : 0,
      }))
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

  const attendanceRate = allEmployees.length > 0
    ? Math.round((presentCount / allEmployees.length) * 100)
    : 0;

  useEffect(() => {
    setIsClient(true);
    const saved = localStorage.getItem('dashboard_layout_v9');
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
    localStorage.setItem('dashboard_layout_v9', JSON.stringify(allLayouts));
  };

  const handleResetLayout = () => {
    localStorage.removeItem('dashboard_layout_v9');
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
          transform: translateY(-2px);
          box-shadow: 0 8px 20px rgba(15, 23, 42, 0.08) !important;
          border-color: #cbd5e1 !important;
        }
      `}</style>

      {/* Top Banner & Controls */}
      <div
        style={{
          padding: '10px 20px',
          backgroundColor: '#ffffff',
          borderBottom: '1px solid #e2e8f0',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '10px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.88rem', color: '#475569' }}>
          <span style={{ fontSize: '1.1rem' }}>🌐</span>
          <span className="kh-text" style={{ fontWeight: 700, color: '#0f172a' }}>ផ្ទាំងព័ត៌មានប្រតិបត្តិការរួម (Enterprise Global Dashboard)</span>
          <span style={{ fontSize: '0.78rem', color: '#94a3b8' }}>| ចុចលើកាតនីមួយៗដើម្បីចូលទៅកាន់ទិន្នន័យដើម</span>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={() => window.print()}
            className="no-print"
            style={{
              padding: '5px 12px',
              fontSize: '0.82rem',
              backgroundColor: '#ffffff',
              border: '1px solid #cbd5e1',
              color: '#334155',
              borderRadius: '6px',
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
              padding: '5px 12px',
              fontSize: '0.82rem',
              backgroundColor: '#f1f5f9',
              border: '1px solid #cbd5e1',
              color: '#0284c7',
              borderRadius: '6px',
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

      <div style={{ padding: '16px 20px' }}>
        {/* ========================================================
            1. TOP INTERACTIVE SUMMARY CARDS (Fit-Content & Auto-Scaling)
           ======================================================== */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: '12px',
            marginBottom: '16px',
          }}
        >
          {/* Card 1: Total Employees */}
          <Link
            href="/dashboard/employees"
            style={{
              textDecoration: 'none',
              backgroundColor: '#ffffff',
              borderRadius: '12px',
              padding: '12px 14px',
              border: '1px solid #e2e8f0',
              borderLeft: '4px solid #0284c7',
              boxShadow: '0 1px 4px rgba(0,0,0,0.03)',
              display: 'flex',
              flexDirection: 'column',
              gap: '6px',
              cursor: 'pointer',
            }}
            className="hover-elevate"
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span className="kh-text" style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600 }}>
                បុគ្គលិកសរុប (Employees)
              </span>
              <div style={{ width: '28px', height: '28px', borderRadius: '8px', backgroundColor: '#e0f2fe', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.9rem' }}>
                👥
              </div>
            </div>
            <div style={{ fontSize: '1.65rem', fontWeight: 800, color: '#0f172a', lineHeight: 1.1 }}>
              {allEmployees.length}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.72rem', color: '#64748b', borderTop: '1px dashed #f1f5f9', paddingTop: '5px' }}>
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
              borderRadius: '12px',
              padding: '12px 14px',
              border: '1px solid #e2e8f0',
              borderLeft: '4px solid #10b981',
              boxShadow: '0 1px 4px rgba(0,0,0,0.03)',
              display: 'flex',
              flexDirection: 'column',
              gap: '6px',
              cursor: 'pointer',
            }}
            className="hover-elevate"
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span className="kh-text" style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600 }}>
                វត្តមានថ្ងៃនេះ (Present)
              </span>
              <div style={{ width: '28px', height: '28px', borderRadius: '8px', backgroundColor: '#d1fae5', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.9rem' }}>
                ✅
              </div>
            </div>
            <div style={{ fontSize: '1.65rem', fontWeight: 800, color: '#059669', lineHeight: 1.1 }}>
              {presentCount}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.72rem', color: '#64748b', borderTop: '1px dashed #f1f5f9', paddingTop: '5px' }}>
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
              borderRadius: '12px',
              padding: '12px 14px',
              border: '1px solid #e2e8f0',
              borderLeft: '4px solid #f59e0b',
              boxShadow: '0 1px 4px rgba(0,0,0,0.03)',
              display: 'flex',
              flexDirection: 'column',
              gap: '6px',
              cursor: 'pointer',
            }}
            className="hover-elevate"
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span className="kh-text" style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600 }}>
                ច្បាប់ & សុំច្បាប់ (Leave)
              </span>
              <div style={{ width: '28px', height: '28px', borderRadius: '8px', backgroundColor: '#fef3c7', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.9rem' }}>
                🏖️
              </div>
            </div>
            <div style={{ fontSize: '1.65rem', fontWeight: 800, color: '#d97706', lineHeight: 1.1 }}>
              {leaveStats.total}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.72rem', color: '#64748b', borderTop: '1px dashed #f1f5f9', paddingTop: '5px' }}>
              <span>មានច្បាប់: <strong style={{ color: '#0f172a' }}>{leaveStats.total}</strong> នាក់</span>
              <span style={{ color: '#f59e0b', fontWeight: 700 }}>ចូលមើល ➔</span>
            </div>
          </Link>

          {/* Card 4: Absents Today */}
          <Link
            href="/dashboard/attendance"
            style={{
              textDecoration: 'none',
              backgroundColor: '#ffffff',
              borderRadius: '12px',
              padding: '12px 14px',
              border: '1px solid #e2e8f0',
              borderLeft: '4px solid #ef4444',
              boxShadow: '0 1px 4px rgba(0,0,0,0.03)',
              display: 'flex',
              flexDirection: 'column',
              gap: '6px',
              cursor: 'pointer',
            }}
            className="hover-elevate"
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span className="kh-text" style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600 }}>
                អវត្តមានថ្ងៃនេះ (Absents)
              </span>
              <div style={{ width: '28px', height: '28px', borderRadius: '8px', backgroundColor: '#fee2e2', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.9rem' }}>
                ❌
              </div>
            </div>
            <div style={{ fontSize: '1.65rem', fontWeight: 800, color: '#dc2626', lineHeight: 1.1 }}>
              {absentStats.total}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.72rem', color: '#64748b', borderTop: '1px dashed #f1f5f9', paddingTop: '5px' }}>
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
              borderRadius: '12px',
              padding: '12px 14px',
              border: '1px solid #e2e8f0',
              borderLeft: '4px solid #6366f1',
              boxShadow: '0 1px 4px rgba(0,0,0,0.03)',
              display: 'flex',
              flexDirection: 'column',
              gap: '6px',
              cursor: 'pointer',
            }}
            className="hover-elevate"
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span className="kh-text" style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600 }}>
                បើកប្រាក់ខែ (Payroll)
              </span>
              <div style={{ width: '28px', height: '28px', borderRadius: '8px', backgroundColor: '#e0e7ff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.9rem' }}>
                💰
              </div>
            </div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#4338ca', lineHeight: 1.1 }}>
              ${filterGrandTotalSalary > 0
                ? Math.round(filterGrandTotalSalary).toLocaleString()
                : Math.round(totalPayrollValue).toLocaleString()}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.72rem', color: '#64748b', borderTop: '1px dashed #f1f5f9', paddingTop: '5px' }}>
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
              borderRadius: '12px',
              padding: '12px 14px',
              border: '1px solid #e2e8f0',
              borderLeft: '4px solid #8b5cf6',
              boxShadow: '0 1px 4px rgba(0,0,0,0.03)',
              display: 'flex',
              flexDirection: 'column',
              gap: '6px',
              cursor: 'pointer',
            }}
            className="hover-elevate"
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span className="kh-text" style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600 }}>
                បុរេប្រទាន & កម្ចី (Advances)
              </span>
              <div style={{ width: '28px', height: '28px', borderRadius: '8px', backgroundColor: '#ede9fe', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.9rem' }}>
                💵
              </div>
            </div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#6d28d9', lineHeight: 1.1 }}>
              ${(advanceStats.paid + advanceStats.remaining > 0
                ? advanceStats.paid + advanceStats.remaining
                : totalAdvanceValue
              ).toLocaleString()}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.72rem', color: '#64748b', borderTop: '1px dashed #f1f5f9', paddingTop: '5px' }}>
              <span>{advanceStats.count} នាក់ស្នើសុំ</span>
              <span style={{ color: '#8b5cf6', fontWeight: 700 }}>ចូលមើល ➔</span>
            </div>
          </Link>
        </div>

        {/* ========================================================
            DRAGGABLE CHARTS & ANALYTICS WIDGETS
           ======================================================== */}
        <ResponsiveGridLayout
          className="layout"
          layouts={layouts}
          breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
          cols={{ lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 }}
          rowHeight={85}
          onLayoutChange={onLayoutChange}
          isDraggable={true}
          isResizable={true}
          draggableHandle=".card-drag-handle"
        >
          {/* 2. DAILY ATTENDANCE STATISTIC CHART (MODERN 2-IN-1: TREND WAVE & DAILY BARS) */}
          {(() => {
            const totalStaff = allEmployees.length || 1;
            const todayPresent = todayAttendancesCount > 0 ? todayAttendancesCount : calculatedPresent;
            const todayAbsent = absentStats?.total || 0;
            const todayLeave = leaveStats?.total || 0;

            const validWeeklyData = weeklyAttendanceData.length > 0
              ? weeklyAttendanceData.map(d => ({
                  ...d,
                  rate: d.rate ?? (totalStaff > 0 ? Math.round((d.present / totalStaff) * 100) : 0),
                  absent: d.absent ?? Math.max(0, totalStaff - d.present)
                }))
              : [
                  { name: 'Sun', nameKh: 'អាទិត្យ', present: 0, absent: 0, rate: 0 },
                  { name: 'Mon', nameKh: 'ច័ន្ទ', present: 0, absent: 0, rate: 0 },
                  { name: 'Tue', nameKh: 'អង្គារ', present: 0, absent: 0, rate: 0 },
                  { name: 'Wed', nameKh: 'ពុធ', present: 0, absent: 0, rate: 0 },
                  { name: 'Thu', nameKh: 'ព្រហស្បតិ៍', present: 0, absent: 0, rate: 0 },
                  { name: 'Fri', nameKh: 'សុក្រ', present: 0, absent: 0, rate: 0 },
                  { name: 'Sat', nameKh: 'សៅរ៍', present: 0, absent: 0, rate: 0 },
                ];

            const avgWeeklyRate = Math.round(
              validWeeklyData.reduce((acc, d) => acc + (d.rate || 0), 0) / validWeeklyData.length
            );

            return (
              <div
                key="daily_attendance"
                data-grid={{ x: 0, y: 0, w: 7, h: 3, minW: 4, minH: 2 }}
                style={{
                  backgroundColor: '#ffffff',
                  borderRadius: '14px',
                  padding: '14px 18px',
                  border: '1px solid #e2e8f0',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
                  display: 'flex',
                  flexDirection: 'column',
                  overflow: 'hidden',
                }}
              >
                {/* Header with Title, Controls & Navigation */}
                <div className="card-drag-handle" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', cursor: 'grab' }}>
                  <div>
                    <h3 className="kh-text" style={{ margin: 0, fontSize: '0.94rem', color: '#0f172a', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span>📅</span>
                      <span>ស្ថិតិវត្តមានប្រចាំសប្តាហ៍ (Daily Attendance)</span>
                    </h3>
                    <span style={{ fontSize: '0.7rem', color: '#64748b' }}>៧ ថ្ងៃចុងក្រោយ • Last 7 Days Attendance Trend</span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {/* View Switcher Segmented Button */}
                    <div
                      style={{
                        display: 'inline-flex',
                        backgroundColor: '#f1f5f9',
                        padding: '2px',
                        borderRadius: '8px',
                        border: '1px solid #e2e8f0',
                        gap: '2px',
                      }}
                    >
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setAttendanceView('trend');
                        }}
                        style={{
                          padding: '3px 8px',
                          fontSize: '0.7rem',
                          fontWeight: 700,
                          borderRadius: '6px',
                          border: 'none',
                          cursor: 'pointer',
                          backgroundColor: attendanceView === 'trend' ? '#ffffff' : 'transparent',
                          color: attendanceView === 'trend' ? '#0284c7' : '#64748b',
                          boxShadow: attendanceView === 'trend' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                          transition: 'all 0.15s ease',
                        }}
                      >
                        📈 និន្នាការ
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setAttendanceView('bar');
                        }}
                        style={{
                          padding: '3px 8px',
                          fontSize: '0.7rem',
                          fontWeight: 700,
                          borderRadius: '6px',
                          border: 'none',
                          cursor: 'pointer',
                          backgroundColor: attendanceView === 'bar' ? '#ffffff' : 'transparent',
                          color: attendanceView === 'bar' ? '#0284c7' : '#64748b',
                          boxShadow: attendanceView === 'bar' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                          transition: 'all 0.15s ease',
                        }}
                      >
                        📊 របារ
                      </button>
                    </div>

                    <Link
                      href="/dashboard/attendance"
                      style={{
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        color: '#0284c7',
                        textDecoration: 'none',
                        backgroundColor: '#f0f9ff',
                        padding: '3px 8px',
                        borderRadius: '6px',
                        border: '1px solid #bae6fd',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      តារាងវត្តមាន ➔
                    </Link>
                  </div>
                </div>

                {/* KPI Ribbon Header */}
                <div style={{ display: 'flex', gap: '6px', marginBottom: '10px', flexWrap: 'wrap' }}>
                  <span
                    style={{
                      fontSize: '0.68rem',
                      fontWeight: 700,
                      padding: '2px 8px',
                      borderRadius: '6px',
                      backgroundColor: '#f0fdf4',
                      color: '#15803d',
                      border: '1px solid #bbf7d0',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                    }}
                  >
                    <span>🟢</span>
                    <span>អត្រាមធ្យម៖ {avgWeeklyRate}%</span>
                  </span>
                  <span
                    style={{
                      fontSize: '0.68rem',
                      fontWeight: 700,
                      padding: '2px 8px',
                      borderRadius: '6px',
                      backgroundColor: '#f0f9ff',
                      color: '#0369a1',
                      border: '1px solid #bae6fd',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                    }}
                  >
                    <span>👥</span>
                    <span>វត្តមានថ្ងៃនេះ៖ {todayPresent}/{totalStaff} នាក់</span>
                  </span>
                  <span
                    style={{
                      fontSize: '0.68rem',
                      fontWeight: 700,
                      padding: '2px 8px',
                      borderRadius: '6px',
                      backgroundColor: '#fffbeb',
                      color: '#b45309',
                      border: '1px solid #fde68a',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                    }}
                  >
                    <span>🌴</span>
                    <span>សុំច្បាប់៖ {todayLeave} នាក់</span>
                  </span>
                  <span
                    style={{
                      fontSize: '0.68rem',
                      fontWeight: 700,
                      padding: '2px 8px',
                      borderRadius: '6px',
                      backgroundColor: '#fef2f2',
                      color: '#b91c1c',
                      border: '1px solid #fecaca',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                    }}
                  >
                    <span>🔴</span>
                    <span>អវត្តមាន៖ {todayAbsent} នាក់</span>
                  </span>
                </div>

                {/* Main Content: Trend Wave vs Daily Bars */}
                {attendanceView === 'trend' ? (
                  <div style={{ flex: 1, minHeight: '135px' }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={validWeeklyData} margin={{ top: 6, right: 10, left: -22, bottom: 0 }}>
                        <defs>
                          <linearGradient id="attPresentWave" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                            <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                          </linearGradient>
                          <linearGradient id="attAbsentWave" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="#f43f5e" stopOpacity={0.0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 11 }} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 11 }} />
                        <Tooltip
                          content={({ active, payload }) => {
                            if (active && payload && payload.length) {
                              const data = payload[0].payload;
                              return (
                                <div
                                  style={{
                                    backgroundColor: 'rgba(15, 23, 42, 0.92)',
                                    color: '#ffffff',
                                    padding: '8px 12px',
                                    borderRadius: '8px',
                                    fontSize: '0.75rem',
                                    boxShadow: '0 8px 20px rgba(0,0,0,0.25)',
                                    backdropFilter: 'blur(8px)',
                                  }}
                                >
                                  <div style={{ fontWeight: 800, color: '#38bdf8', marginBottom: '4px', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '3px' }}>
                                    {data.nameKh ? `${data.nameKh} (${data.name})` : data.name} {data.dateStr ? `• ${data.dateStr}` : ''}
                                  </div>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#86efac' }}>
                                    <span>🟢 មានវត្តមាន៖</span>
                                    <strong>{data.present} នាក់ ({data.rate}%)</strong>
                                  </div>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#fda4af' }}>
                                    <span>🔴 អវត្តមាន៖</span>
                                    <strong>{data.absent} នាក់</strong>
                                  </div>
                                </div>
                              );
                            }
                            return null;
                          }}
                        />
                        <Legend iconType="circle" wrapperStyle={{ fontSize: '11px', paddingTop: '0px' }} align="right" verticalAlign="top" />
                        <Area
                          type="monotone"
                          dataKey="present"
                          name="មានវត្តមាន (Present)"
                          stroke="#10b981"
                          strokeWidth={2.5}
                          fill="url(#attPresentWave)"
                          dot={{ r: 3, fill: '#10b981', strokeWidth: 1, stroke: '#ffffff' }}
                          activeDot={{ r: 6 }}
                        />
                        <Area
                          type="monotone"
                          dataKey="absent"
                          name="អវត្តមាន (Absent)"
                          stroke="#f43f5e"
                          strokeWidth={2}
                          strokeDasharray="4 4"
                          fill="url(#attAbsentWave)"
                          dot={{ r: 3, fill: '#f43f5e', strokeWidth: 1, stroke: '#ffffff' }}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div style={{ flex: 1, minHeight: '135px' }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={validWeeklyData} margin={{ top: 6, right: 10, left: -22, bottom: 0 }}>
                        <defs>
                          <linearGradient id="barPresentGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#10b981" />
                            <stop offset="100%" stopColor="#059669" />
                          </linearGradient>
                          <linearGradient id="barAbsentGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#f43f5e" />
                            <stop offset="100%" stopColor="#e11d48" />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 11 }} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 11 }} />
                        <Tooltip
                          content={({ active, payload }) => {
                            if (active && payload && payload.length) {
                              const data = payload[0].payload;
                              return (
                                <div
                                  style={{
                                    backgroundColor: 'rgba(15, 23, 42, 0.92)',
                                    color: '#ffffff',
                                    padding: '8px 12px',
                                    borderRadius: '8px',
                                    fontSize: '0.75rem',
                                    boxShadow: '0 8px 20px rgba(0,0,0,0.25)',
                                    backdropFilter: 'blur(8px)',
                                  }}
                                >
                                  <div style={{ fontWeight: 800, color: '#38bdf8', marginBottom: '4px', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '3px' }}>
                                    {data.nameKh ? `${data.nameKh} (${data.name})` : data.name} {data.dateStr ? `• ${data.dateStr}` : ''}
                                  </div>
                                  <div style={{ color: '#86efac' }}>🟢 មានវត្តមាន៖ <strong>{data.present} នាក់ ({data.rate}%)</strong></div>
                                  <div style={{ color: '#fda4af' }}>🔴 អវត្តមាន៖ <strong>{data.absent} នាក់</strong></div>
                                </div>
                              );
                            }
                            return null;
                          }}
                        />
                        <Legend iconType="circle" wrapperStyle={{ fontSize: '11px', paddingTop: '0px' }} align="right" verticalAlign="top" />
                        <Bar dataKey="present" name="មានវត្តមាន (Present)" fill="url(#barPresentGrad)" radius={[5, 5, 0, 0]} barSize={22} />
                        <Bar dataKey="absent" name="អវត្តមាន (Absent)" fill="url(#barAbsentGrad)" radius={[5, 5, 0, 0]} barSize={22} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>
            );
          })()}

          {/* 3. ADVANCE SALARY & LOAN HEALTH (DONUT) */}
          <div
            key="loan_pay"
            data-grid={{ x: 7, y: 0, w: 5, h: 3, minW: 3, minH: 2 }}
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '14px',
              padding: '16px 18px',
              border: '1px solid #e2e8f0',
              boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <div className="card-drag-handle" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', cursor: 'grab' }}>
              <div>
                <h3 className="kh-text" style={{ margin: 0, fontSize: '0.95rem', color: '#0f172a', fontWeight: 700 }}>
                  💳 ស្ថានភាពប្រាក់កម្ចី & បុរេប្រទាន (Loans & Advances)
                </h3>
                <span style={{ fontSize: '0.72rem', color: '#64748b' }}>Advance & Loan Status</span>
              </div>
              <Link
                href="/dashboard/advance"
                style={{
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  color: '#6366f1',
                  textDecoration: 'none',
                  backgroundColor: '#eef2ff',
                  padding: '3px 8px',
                  borderRadius: '6px',
                  border: '1px solid #c7d2fe',
                }}
              >
                គ្រប់គ្រង ➔
              </Link>
            </div>

            <div style={{ flex: 1, position: 'relative', minHeight: '130px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={[
                      { name: 'បានសង (Paid)', value: advanceStats.paid > 0 ? advanceStats.paid : 1 },
                      { name: 'នៅសល់ (Remaining)', value: advanceStats.remaining > 0 ? advanceStats.remaining : 0 },
                    ]}
                    cx="50%"
                    cy="75%"
                    startAngle={180}
                    endAngle={0}
                    innerRadius={55}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    <Cell fill="#10b981" />
                    <Cell fill="#6366f1" />
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '0.8rem' }} />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: '11px', bottom: 0 }} />
                </PieChart>
              </ResponsiveContainer>
              <div
                style={{
                  position: 'absolute',
                  top: '58%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  textAlign: 'center',
                }}
              >
                <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a' }}>
                  ${(advanceStats.paid + advanceStats.remaining).toLocaleString()}
                </div>
                <div style={{ fontSize: '0.68rem', color: '#64748b' }}>សរុបទាំងអស់</div>
              </div>
            </div>
          </div>

          {/* 4. RECRUITMENT PIPELINE & DEMAND (MODERN ATS CARD) */}
          {(() => {
            const pipelineData = recruitmentStats?.pipeline || [
              { key: 'NEW', nameKh: 'ដាក់ពាក្យថ្មី', nameEn: 'Applied', count: 0, color: '#3b82f6', bg: '#eff6ff', border: '#bfdbfe', icon: '📩' },
              { key: 'REVIEWING', nameKh: 'ត្រួតពិនិត្យ', nameEn: 'Screening', count: 0, color: '#f59e0b', bg: '#fffbeb', border: '#fde68a', icon: '🔍' },
              { key: 'INTERVIEWING', nameKh: 'សម្ភាសន៍', nameEn: 'Interview', count: 0, color: '#8b5cf6', bg: '#f5f3ff', border: '#ddd6fe', icon: '🎙️' },
              { key: 'OFFERED', nameKh: 'ផ្តល់សំណើ', nameEn: 'Offer', count: 0, color: '#0ea5e9', bg: '#f0f9ff', border: '#bae6fd', icon: '📝' },
              { key: 'HIRED', nameKh: 'ជាប់ស្ថាពរ', nameEn: 'Hired', count: 1, color: '#10b981', bg: '#f0fdf4', border: '#bbf7d0', icon: '✅' },
            ];
            const totalCandidatesCount = recruitmentStats?.totalCandidates ?? pipelineData.reduce((s, p) => s + p.count, 0);
            const totalOpenJobs = recruitmentStats?.totalOpenJobs ?? 1;
            const hiredCount = recruitmentStats?.hiredCount ?? (pipelineData.find(p => p.key === 'HIRED')?.count || 0);
            const maxStageCount = Math.max(1, ...pipelineData.map(p => p.count));

            const deptChartData = (recruitmentStats?.byDept && recruitmentStats.byDept.length > 0)
              ? recruitmentStats.byDept
              : (recruitmentByDept.length > 0 ? recruitmentByDept : [{ name: 'ទូទៅ (General)', count: 1, openJobs: 1, candidates: 1 }]);

            return (
              <div
                key="recruitment"
                data-grid={{ x: 0, y: 3, w: 6, h: 3, minW: 4, minH: 2 }}
                style={{
                  backgroundColor: '#ffffff',
                  borderRadius: '14px',
                  padding: '14px 18px',
                  border: '1px solid #e2e8f0',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
                  display: 'flex',
                  flexDirection: 'column',
                  overflow: 'hidden',
                }}
              >
                {/* Header with Title, Controls & Navigation */}
                <div className="card-drag-handle" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', cursor: 'grab' }}>
                  <div>
                    <h3 className="kh-text" style={{ margin: 0, fontSize: '0.94rem', color: '#0f172a', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span>📢</span>
                      <span>ជ្រើសរើសបុគ្គលិក (Recruitment ATS)</span>
                    </h3>
                    <span style={{ fontSize: '0.7rem', color: '#64748b' }}>Hiring Demand & Candidate Pipeline</span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {/* View Switcher Segmented Button */}
                    <div
                      style={{
                        display: 'inline-flex',
                        backgroundColor: '#f1f5f9',
                        padding: '2px',
                        borderRadius: '8px',
                        border: '1px solid #e2e8f0',
                        gap: '2px',
                      }}
                    >
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setRecruitmentView('pipeline');
                        }}
                        style={{
                          padding: '3px 8px',
                          fontSize: '0.7rem',
                          fontWeight: 700,
                          borderRadius: '6px',
                          border: 'none',
                          cursor: 'pointer',
                          backgroundColor: recruitmentView === 'pipeline' ? '#ffffff' : 'transparent',
                          color: recruitmentView === 'pipeline' ? '#0284c7' : '#64748b',
                          boxShadow: recruitmentView === 'pipeline' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                          transition: 'all 0.15s ease',
                        }}
                      >
                        📊 ដំណាក់កាល
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setRecruitmentView('departments');
                        }}
                        style={{
                          padding: '3px 8px',
                          fontSize: '0.7rem',
                          fontWeight: 700,
                          borderRadius: '6px',
                          border: 'none',
                          cursor: 'pointer',
                          backgroundColor: recruitmentView === 'departments' ? '#ffffff' : 'transparent',
                          color: recruitmentView === 'departments' ? '#0284c7' : '#64748b',
                          boxShadow: recruitmentView === 'departments' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                          transition: 'all 0.15s ease',
                        }}
                      >
                        🏢 តាមផ្នែក
                      </button>
                    </div>

                    <Link
                      href="/dashboard/recruitment"
                      style={{
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        color: '#0284c7',
                        textDecoration: 'none',
                        backgroundColor: '#f0f9ff',
                        padding: '3px 8px',
                        borderRadius: '6px',
                        border: '1px solid #bae6fd',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      បេក្ខជន ➔
                    </Link>
                  </div>
                </div>

                {/* Metric Summary Ribbon */}
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '8px' }}>
                  <span style={{ fontSize: '0.67rem', fontWeight: 700, padding: '2px 7px', borderRadius: '5px', backgroundColor: '#eff6ff', color: '#1d4ed8', border: '1px solid #bfdbfe' }}>
                    📋 ដំណែងទំនេរ៖ {totalOpenJobs}
                  </span>
                  <span style={{ fontSize: '0.67rem', fontWeight: 700, padding: '2px 7px', borderRadius: '5px', backgroundColor: '#f5f3ff', color: '#6d28d9', border: '1px solid #ddd6fe' }}>
                    👥 បេក្ខជនសរុប៖ {totalCandidatesCount}
                  </span>
                  <span style={{ fontSize: '0.67rem', fontWeight: 700, padding: '2px 7px', borderRadius: '5px', backgroundColor: '#f0fdf4', color: '#15803d', border: '1px solid #bbf7d0' }}>
                    ✅ ជាប់ស្ថាពរ៖ {hiredCount}
                  </span>
                </div>

                {/* View 1: Sleek ATS Pipeline Funnel */}
                {recruitmentView === 'pipeline' ? (
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '6px', overflowY: 'auto', paddingRight: '2px' }}>
                    {pipelineData.map((stage) => {
                      const pct = totalCandidatesCount > 0 ? Math.round((stage.count / totalCandidatesCount) * 100) : (stage.count > 0 ? 100 : 0);
                      const barWidth = totalCandidatesCount > 0 
                        ? Math.max(10, Math.round((stage.count / Math.max(1, maxStageCount)) * 100))
                        : (stage.count > 0 ? 100 : 8);

                      return (
                        <div key={stage.key} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <div
                            style={{
                              width: '26px',
                              height: '26px',
                              borderRadius: '7px',
                              backgroundColor: stage.bg,
                              border: `1px solid ${stage.border}`,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '0.88rem',
                              flexShrink: 0,
                            }}
                          >
                            {stage.icon}
                          </div>
                          <div style={{ width: '80px', flexShrink: 0 }}>
                            <div className="kh-text" style={{ fontSize: '0.76rem', fontWeight: 700, color: '#0f172a', lineHeight: 1.15 }}>
                              {stage.nameKh}
                            </div>
                            <div style={{ fontSize: '0.62rem', color: '#64748b', fontWeight: 500 }}>
                              {stage.nameEn}
                            </div>
                          </div>
                          <div style={{ flex: 1, position: 'relative' }}>
                            <div
                              style={{
                                height: '13px',
                                backgroundColor: '#f1f5f9',
                                borderRadius: '999px',
                                overflow: 'hidden',
                                position: 'relative',
                              }}
                            >
                              <div
                                style={{
                                  width: `${barWidth}%`,
                                  height: '100%',
                                  background: `linear-gradient(90deg, ${stage.color}, ${stage.color}cc)`,
                                  borderRadius: '999px',
                                  transition: 'width 0.4s ease',
                                  boxShadow: `0 2px 6px ${stage.color}40`,
                                }}
                              />
                            </div>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '5px', minWidth: '65px', justifyContent: 'flex-end' }}>
                            <span
                              style={{
                                fontSize: '0.72rem',
                                fontWeight: 800,
                                color: stage.color,
                                backgroundColor: stage.bg,
                                border: `1px solid ${stage.border}`,
                                padding: '1px 6px',
                                borderRadius: '5px',
                                whiteSpace: 'nowrap',
                              }}
                            >
                              {stage.count} នាក់
                            </span>
                            <span style={{ fontSize: '0.65rem', color: '#94a3b8', fontWeight: 700, minWidth: '26px', textAlign: 'right' }}>
                              {pct}%
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  /* View 2: Modern Department Demand Bar Chart */
                  <div style={{ flex: 1, minHeight: '120px' }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        layout="vertical"
                        data={deptChartData}
                        margin={{ top: 4, right: 25, left: 10, bottom: 4 }}
                      >
                        <defs>
                          <linearGradient id="recruitmentBarGradient" x1="0" y1="0" x2="1" y2="0">
                            <stop offset="0%" stopColor="#0284c7" />
                            <stop offset="100%" stopColor="#38bdf8" />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                        <XAxis type="number" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 11 }} />
                        <YAxis type="category" dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#0f172a', fontSize: 11, fontWeight: 600 }} width={100} />
                        <Tooltip
                          content={({ active, payload }) => {
                            if (active && payload && payload.length) {
                              const data = payload[0].payload;
                              return (
                                <div style={{ backgroundColor: 'rgba(15, 23, 42, 0.92)', color: '#ffffff', padding: '8px 12px', borderRadius: '8px', fontSize: '0.75rem', boxShadow: '0 8px 20px rgba(0,0,0,0.25)', backdropFilter: 'blur(8px)' }}>
                                  <div style={{ fontWeight: 800, color: '#38bdf8', marginBottom: '2px' }}>{data.name}</div>
                                  <div>ដំណែងទំនេរ៖ <strong>{data.openJobs ?? data.count}</strong></div>
                                  <div>បេក្ខជនដាក់ពាក្យ៖ <strong>{data.candidates ?? 0} នាក់</strong></div>
                                </div>
                              );
                            }
                            return null;
                          }}
                        />
                        <Bar
                          dataKey="count"
                          fill="url(#recruitmentBarGradient)"
                          radius={[0, 6, 6, 0]}
                          barSize={20}
                          label={{ position: 'right', fill: '#0284c7', fontSize: 11, fontWeight: 700 }}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>
            );
          })()}

          {/* 5. RECENT LEAVE REQUESTS TABLE / LIST */}
          <div
            key="leave_application"
            data-grid={{ x: 6, y: 3, w: 6, h: 3, minW: 4, minH: 2 }}
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '14px',
              padding: '16px 18px',
              border: '1px solid #e2e8f0',
              boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <div className="card-drag-handle" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', cursor: 'grab' }}>
              <div>
                <h3 className="kh-text" style={{ margin: 0, fontSize: '0.95rem', color: '#0f172a', fontWeight: 700 }}>
                  🌴 សំណើសុំច្បាប់ថ្មីៗ (Recent Leave Requests)
                </h3>
                <span style={{ fontSize: '0.72rem', color: '#64748b' }}>Latest Requests & Clearances</span>
              </div>
              <Link
                href="/dashboard/leave"
                style={{
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  color: '#d97706',
                  textDecoration: 'none',
                  backgroundColor: '#fef3c7',
                  padding: '3px 8px',
                  borderRadius: '6px',
                  border: '1px solid #fde68a',
                }}
              >
                មើលទាំងអស់ ➔
              </Link>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
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
                        padding: '6px 10px',
                        backgroundColor: '#f8fafc',
                        borderRadius: '8px',
                        textDecoration: 'none',
                        transition: 'background 0.15s ease',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '1.1rem' }}>👤</span>
                        <div>
                          <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#0f172a' }}>{empName}</div>
                          <div style={{ fontSize: '0.72rem', color: '#64748b' }}>
                            មូលហេតុ: {req.reason || 'ច្បាប់ផ្ទាល់ខ្លួន'} • {req.leaveType || 'Annual'}
                          </div>
                        </div>
                      </div>

                      <span
                        style={{
                          fontSize: '0.7rem',
                          fontWeight: 700,
                          padding: '2px 7px',
                          borderRadius: '6px',
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
                <div style={{ textAlign: 'center', padding: '20px', color: '#94a3b8', fontSize: '0.82rem' }}>
                  ពុំទាន់មានពាក្យសុំច្បាប់ដែលរង់ចាំនោះទេ (No recent leave requests)
                </div>
              )}
            </div>
          </div>

          {/* 6. EMPLOYEES BY DEPARTMENT (MODERN 2-IN-1: RANKINGS PROGRESS & DONUT) */}
          {(() => {
            const deptList = employeesByRole.length > 0
              ? employeesByRole
              : [{ name: 'ទូទៅ (General)', count: allEmployees.length || 1, female: 0, male: allEmployees.length || 1, percentage: 100 }];
            const maxDeptCount = Math.max(1, ...deptList.map(d => d.count));
            const totalStaffCount = allEmployees.length || 1;
            const topDept = deptList[0];
            const avgPerDept = Math.round(totalStaffCount / Math.max(1, deptList.length));

            return (
              <div
                key="employees_role"
                data-grid={{ x: 0, y: 6, w: 6, h: 3, minW: 4, minH: 2 }}
                style={{
                  backgroundColor: '#ffffff',
                  borderRadius: '14px',
                  padding: '14px 18px',
                  border: '1px solid #e2e8f0',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
                  display: 'flex',
                  flexDirection: 'column',
                  overflow: 'hidden',
                }}
              >
                {/* Header with Title, Controls & Navigation */}
                <div className="card-drag-handle" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', cursor: 'grab' }}>
                  <div>
                    <h3 className="kh-text" style={{ margin: 0, fontSize: '0.94rem', color: '#0f172a', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span>🏢</span>
                      <span>រចនាសម្ព័ន្ធបុគ្គលិកតាមផ្នែក (Employees by Department)</span>
                    </h3>
                    <span style={{ fontSize: '0.7rem', color: '#64748b' }}>Department Headcount & Workforce Distribution</span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {/* View Switcher Segmented Button */}
                    <div
                      style={{
                        display: 'inline-flex',
                        backgroundColor: '#f1f5f9',
                        padding: '2px',
                        borderRadius: '8px',
                        border: '1px solid #e2e8f0',
                        gap: '2px',
                      }}
                    >
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setDepartmentView('leaderboard');
                        }}
                        style={{
                          padding: '3px 8px',
                          fontSize: '0.7rem',
                          fontWeight: 700,
                          borderRadius: '6px',
                          border: 'none',
                          cursor: 'pointer',
                          backgroundColor: departmentView === 'leaderboard' ? '#ffffff' : 'transparent',
                          color: departmentView === 'leaderboard' ? '#6366f1' : '#64748b',
                          boxShadow: departmentView === 'leaderboard' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                          transition: 'all 0.15s ease',
                        }}
                      >
                        🏆 ចំណាត់ថ្នាក់
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setDepartmentView('donut');
                        }}
                        style={{
                          padding: '3px 8px',
                          fontSize: '0.7rem',
                          fontWeight: 700,
                          borderRadius: '6px',
                          border: 'none',
                          cursor: 'pointer',
                          backgroundColor: departmentView === 'donut' ? '#ffffff' : 'transparent',
                          color: departmentView === 'donut' ? '#6366f1' : '#64748b',
                          boxShadow: departmentView === 'donut' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                          transition: 'all 0.15s ease',
                        }}
                      >
                        🍩 ដ្យាក្រាម
                      </button>
                    </div>

                    <Link
                      href="/dashboard/employees"
                      style={{
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        color: '#6366f1',
                        textDecoration: 'none',
                        backgroundColor: '#eef2ff',
                        padding: '3px 8px',
                        borderRadius: '6px',
                        border: '1px solid #c7d2fe',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      បញ្ជីបុគ្គលិក ➔
                    </Link>
                  </div>
                </div>

                {/* KPI Ribbon Header */}
                <div style={{ display: 'flex', gap: '6px', marginBottom: '8px', flexWrap: 'wrap' }}>
                  <span
                    style={{
                      fontSize: '0.68rem',
                      fontWeight: 700,
                      padding: '2px 8px',
                      borderRadius: '6px',
                      backgroundColor: '#eef2ff',
                      color: '#4338ca',
                      border: '1px solid #c7d2fe',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                    }}
                  >
                    <span>🏢</span>
                    <span>ផ្នែកសរុប៖ {deptList.length} ផ្នែក</span>
                  </span>
                  <span
                    style={{
                      fontSize: '0.68rem',
                      fontWeight: 700,
                      padding: '2px 8px',
                      borderRadius: '6px',
                      backgroundColor: '#f0fdf4',
                      color: '#15803d',
                      border: '1px solid #bbf7d0',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                    }}
                  >
                    <span>🥇</span>
                    <span>ផ្នែកធំបំផុត៖ {topDept?.name || 'ទូទៅ'} ({topDept?.count || 0} នាក់)</span>
                  </span>
                  <span
                    style={{
                      fontSize: '0.68rem',
                      fontWeight: 700,
                      padding: '2px 8px',
                      borderRadius: '6px',
                      backgroundColor: '#f0f9ff',
                      color: '#0369a1',
                      border: '1px solid #bae6fd',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                    }}
                  >
                    <span>👥</span>
                    <span>មធ្យមភាគ៖ {avgPerDept} នាក់/ផ្នែក</span>
                  </span>
                </div>

                {/* Main Content: Department Rankings vs Donut */}
                {departmentView === 'leaderboard' ? (
                  <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '7px', paddingRight: '4px' }}>
                    {deptList.map((dept, index) => {
                      const theme = DEPT_THEMES[index % DEPT_THEMES.length];
                      const icon = getDeptIcon(dept.name);
                      const fillWidth = Math.max(10, Math.round((dept.count / maxDeptCount) * 100));
                      const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `#${index + 1}`;

                      return (
                        <div
                          key={dept.name}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            padding: '5px 8px',
                            borderRadius: '8px',
                            backgroundColor: '#f8fafc',
                            border: '1px solid #f1f5f9',
                            transition: 'background 0.15s ease',
                          }}
                        >
                          {/* Medal / Rank Indicator */}
                          <span style={{ fontSize: '0.8rem', minWidth: '22px', textAlign: 'center', fontWeight: 700, color: '#64748b' }}>
                            {medal}
                          </span>

                          {/* Dept Icon */}
                          <span style={{ fontSize: '1rem' }}>{icon}</span>

                          {/* Dept Name & Progress Bar */}
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2px' }}>
                              <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                {dept.name}
                              </span>
                              <span style={{ fontSize: '0.68rem', color: '#64748b', fontWeight: 600 }}>
                                {dept.female !== undefined ? `(ស្រី ${dept.female} / ប្រុស ${dept.male})` : ''}
                              </span>
                            </div>

                            {/* Progress Bar */}
                            <div style={{ height: '6px', width: '100%', backgroundColor: '#e2e8f0', borderRadius: '4px', overflow: 'hidden' }}>
                              <div
                                style={{
                                  height: '100%',
                                  width: `${fillWidth}%`,
                                  background: `linear-gradient(90deg, ${theme.from}, ${theme.to})`,
                                  borderRadius: '4px',
                                  transition: 'width 0.4s ease',
                                }}
                              />
                            </div>
                          </div>

                          {/* Badges: Count & Percentage */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}>
                            <span
                              style={{
                                fontSize: '0.7rem',
                                fontWeight: 800,
                                padding: '2px 7px',
                                borderRadius: '6px',
                                backgroundColor: theme.bg,
                                color: theme.text,
                                border: `1px solid ${theme.border}`,
                                whiteSpace: 'nowrap',
                              }}
                            >
                              {dept.count} នាក់
                            </span>
                            <span style={{ fontSize: '0.68rem', color: '#94a3b8', fontWeight: 700, minWidth: '30px', textAlign: 'right' }}>
                              {dept.percentage}%
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div style={{ flex: 1, position: 'relative', minHeight: '135px' }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={deptList}
                          cx="50%"
                          cy="50%"
                          innerRadius={46}
                          outerRadius={70}
                          paddingAngle={3}
                          dataKey="count"
                        >
                          {deptList.map((_, i) => (
                            <Cell key={`dept-cell-${i}`} fill={DEPT_THEMES[i % DEPT_THEMES.length].from} />
                          ))}
                        </Pie>
                        <Tooltip
                          content={({ active, payload }) => {
                            if (active && payload && payload.length) {
                              const data = payload[0].payload;
                              return (
                                <div
                                  style={{
                                    backgroundColor: 'rgba(15, 23, 42, 0.92)',
                                    color: '#ffffff',
                                    padding: '8px 12px',
                                    borderRadius: '8px',
                                    fontSize: '0.75rem',
                                    boxShadow: '0 8px 20px rgba(0,0,0,0.25)',
                                    backdropFilter: 'blur(8px)',
                                  }}
                                >
                                  <div style={{ fontWeight: 800, color: '#a5b4fc', marginBottom: '3px' }}>
                                    {getDeptIcon(data.name)} {data.name}
                                  </div>
                                  <div>ចំនួនបុគ្គលិក៖ <strong>{data.count} នាក់ ({data.percentage}%)</strong></div>
                                  {data.female !== undefined && (
                                    <div style={{ fontSize: '0.7rem', color: '#cbd5e1' }}>
                                      ស្រី៖ {data.female} នាក់ • ប្រុស៖ {data.male} នាក់
                                    </div>
                                  )}
                                </div>
                              );
                            }
                            return null;
                          }}
                        />
                        <Legend iconType="circle" wrapperStyle={{ fontSize: '10px', bottom: -4 }} />
                      </PieChart>
                    </ResponsiveContainer>
                    <div
                      style={{
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                        textAlign: 'center',
                        pointerEvents: 'none',
                      }}
                    >
                      <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', lineHeight: 1 }}>
                        {totalStaffCount}
                      </div>
                      <div style={{ fontSize: '0.62rem', color: '#64748b' }}>បុគ្គលិកសរុប</div>
                    </div>
                  </div>
                )}
              </div>
            );
          })()}

          {/* 7. EMPLOYEES BY HOMETOWN / LOCATION (MODERN RANKINGS & DONUT) */}
          {(() => {
            const topProvincesData = topProvinces.length > 0
              ? topProvinces
              : [{ name: 'ភ្នំពេញ (Phnom Penh)', count: allEmployees.length || 1 }];
            const maxProvinceCount = Math.max(1, ...topProvincesData.map(p => p.count));
            const provincesCount = Object.keys(provinceMap).length || topProvincesData.length;

            return (
              <div
                key="employees_location"
                data-grid={{ x: 6, y: 6, w: 6, h: 3, minW: 4, minH: 2 }}
                style={{
                  backgroundColor: '#ffffff',
                  borderRadius: '14px',
                  padding: '14px 18px',
                  border: '1px solid #e2e8f0',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
                  display: 'flex',
                  flexDirection: 'column',
                  overflow: 'hidden',
                }}
              >
                {/* Header with Title, Controls & Navigation */}
                <div className="card-drag-handle" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', cursor: 'grab' }}>
                  <div>
                    <h3 className="kh-text" style={{ margin: 0, fontSize: '0.94rem', color: '#0f172a', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span>📍</span>
                      <span>បុគ្គលិកតាមរាជធានី-ខេត្ត (Hometown Spread)</span>
                    </h3>
                    <span style={{ fontSize: '0.7rem', color: '#64748b' }}>Hometown & Geographical Spread</span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {/* View Switcher Segmented Button */}
                    <div
                      style={{
                        display: 'inline-flex',
                        backgroundColor: '#f1f5f9',
                        padding: '2px',
                        borderRadius: '8px',
                        border: '1px solid #e2e8f0',
                        gap: '2px',
                      }}
                    >
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setHometownView('leaderboard');
                        }}
                        style={{
                          padding: '3px 8px',
                          fontSize: '0.7rem',
                          fontWeight: 700,
                          borderRadius: '6px',
                          border: 'none',
                          cursor: 'pointer',
                          backgroundColor: hometownView === 'leaderboard' ? '#ffffff' : 'transparent',
                          color: hometownView === 'leaderboard' ? '#db2777' : '#64748b',
                          boxShadow: hometownView === 'leaderboard' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                          transition: 'all 0.15s ease',
                        }}
                      >
                        🏆 ចំណាត់ថ្នាក់
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setHometownView('donut');
                        }}
                        style={{
                          padding: '3px 8px',
                          fontSize: '0.7rem',
                          fontWeight: 700,
                          borderRadius: '6px',
                          border: 'none',
                          cursor: 'pointer',
                          backgroundColor: hometownView === 'donut' ? '#ffffff' : 'transparent',
                          color: hometownView === 'donut' ? '#db2777' : '#64748b',
                          boxShadow: hometownView === 'donut' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                          transition: 'all 0.15s ease',
                        }}
                      >
                        🍩 ក្រាបដូណាត់
                      </button>
                    </div>

                    <Link
                      href="/dashboard/employees"
                      style={{
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        color: '#ec4899',
                        textDecoration: 'none',
                        backgroundColor: '#fdf2f8',
                        padding: '3px 8px',
                        borderRadius: '6px',
                        border: '1px solid #fbcfe8',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      ទីតាំង ➔
                    </Link>
                  </div>
                </div>

                {/* Metric Summary Ribbon */}
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '8px' }}>
                  <span style={{ fontSize: '0.67rem', fontWeight: 700, padding: '2px 7px', borderRadius: '5px', backgroundColor: '#fdf2f8', color: '#be185d', border: '1px solid #fbcfe8' }}>
                    🏆 នាំមុខគេ៖ {topProvincesData[0]?.name || 'N/A'}
                  </span>
                  <span style={{ fontSize: '0.67rem', fontWeight: 700, padding: '2px 7px', borderRadius: '5px', backgroundColor: '#f0fdf4', color: '#15803d', border: '1px solid #bbf7d0' }}>
                    🗺️ {provincesCount} រាជធានី-ខេត្ត
                  </span>
                  <span style={{ fontSize: '0.67rem', fontWeight: 700, padding: '2px 7px', borderRadius: '5px', backgroundColor: '#f1f5f9', color: '#334155', border: '1px solid #cbd5e1' }}>
                    👥 {allEmployees.length} នាក់សរុប
                  </span>
                </div>

                {/* View 1: Colorful Province Leaderboard Progress Bars */}
                {hometownView === 'leaderboard' ? (
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '6px', overflowY: 'auto', paddingRight: '2px' }}>
                    {topProvincesData.map((item, idx) => {
                      const pct = allEmployees.length > 0 ? Math.round((item.count / allEmployees.length) * 100) : 0;
                      const barWidth = maxProvinceCount > 0 ? Math.max(12, Math.round((item.count / maxProvinceCount) * 100)) : 10;
                      const colorTheme = PROVINCE_THEMES[idx % PROVINCE_THEMES.length];
                      const medal = idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `${idx + 1}`;

                      return (
                        <div key={item.name} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <div
                            style={{
                              width: '26px',
                              height: '26px',
                              borderRadius: '7px',
                              backgroundColor: colorTheme.bg,
                              border: `1px solid ${colorTheme.border}`,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: idx < 3 ? '0.9rem' : '0.72rem',
                              fontWeight: 800,
                              color: colorTheme.text,
                              flexShrink: 0,
                            }}
                          >
                            {medal}
                          </div>
                          <div style={{ width: '95px', flexShrink: 0 }}>
                            <div className="kh-text" style={{ fontSize: '0.78rem', fontWeight: 700, color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {item.name}
                            </div>
                          </div>
                          <div style={{ flex: 1, position: 'relative' }}>
                            <div
                              style={{
                                height: '13px',
                                backgroundColor: '#f1f5f9',
                                borderRadius: '999px',
                                overflow: 'hidden',
                                position: 'relative',
                              }}
                            >
                              <div
                                style={{
                                  width: `${barWidth}%`,
                                  height: '100%',
                                  background: `linear-gradient(90deg, ${colorTheme.from}, ${colorTheme.to})`,
                                  borderRadius: '999px',
                                  transition: 'width 0.4s ease',
                                  boxShadow: `0 2px 6px ${colorTheme.from}40`,
                                }}
                              />
                            </div>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '5px', minWidth: '65px', justifyContent: 'flex-end' }}>
                            <span
                              style={{
                                fontSize: '0.72rem',
                                fontWeight: 800,
                                color: colorTheme.text,
                                backgroundColor: colorTheme.bg,
                                border: `1px solid ${colorTheme.border}`,
                                padding: '1px 6px',
                                borderRadius: '5px',
                                whiteSpace: 'nowrap',
                              }}
                            >
                              {item.count} នាក់
                            </span>
                            <span style={{ fontSize: '0.65rem', color: '#94a3b8', fontWeight: 700, minWidth: '26px', textAlign: 'right' }}>
                              {pct}%
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  /* View 2: High-End Donut Chart with Center KPI & Legend */
                  <div style={{ flex: 1, display: 'flex', alignItems: 'center', position: 'relative', minHeight: '120px' }}>
                    <div style={{ flex: '1 1 52%', height: '100%', position: 'relative' }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={topProvincesData}
                            cx="50%"
                            cy="50%"
                            innerRadius={44}
                            outerRadius={68}
                            paddingAngle={4}
                            cornerRadius={6}
                            dataKey="count"
                          >
                            {topProvincesData.map((entry, index) => (
                              <Cell key={`prov-cell-${index}`} fill={PROVINCE_THEMES[index % PROVINCE_THEMES.length].from} />
                            ))}
                          </Pie>
                          <Tooltip
                            content={({ active, payload }) => {
                              if (active && payload && payload.length) {
                                const data = payload[0].payload;
                                const pct = allEmployees.length > 0 ? Math.round((data.count / allEmployees.length) * 100) : 0;
                                return (
                                  <div style={{ backgroundColor: 'rgba(15, 23, 42, 0.92)', color: '#ffffff', padding: '7px 11px', borderRadius: '8px', fontSize: '0.74rem', boxShadow: '0 8px 20px rgba(0,0,0,0.25)', backdropFilter: 'blur(8px)' }}>
                                    <div style={{ fontWeight: 800, color: '#f472b6', marginBottom: '2px' }}>{data.name}</div>
                                    <div>ចំនួនបុគ្គលិក៖ <strong>{data.count} នាក់</strong> ({pct}%)</div>
                                  </div>
                                );
                              }
                              return null;
                            }}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                      <div
                        style={{
                          position: 'absolute',
                          top: '50%',
                          left: '50%',
                          transform: 'translate(-50%, -50%)',
                          textAlign: 'center',
                          pointerEvents: 'none',
                        }}
                      >
                        <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0f172a', lineHeight: 1 }}>
                          {allEmployees.length}
                        </div>
                        <div className="kh-text" style={{ fontSize: '0.6rem', color: '#64748b', marginTop: '2px' }}>
                          បុគ្គលិកសរុប
                        </div>
                      </div>
                    </div>

                    <div style={{ flex: '1 1 48%', display: 'flex', flexDirection: 'column', gap: '4px', paddingLeft: '4px', overflowY: 'auto', maxHeight: '140px' }}>
                      {topProvincesData.map((item, index) => {
                        const color = PROVINCE_THEMES[index % PROVINCE_THEMES.length];
                        const pct = allEmployees.length > 0 ? Math.round((item.count / allEmployees.length) * 100) : 0;
                        return (
                          <div key={item.name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.72rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '5px', minWidth: 0 }}>
                              <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: color.from, flexShrink: 0 }} />
                              <span className="kh-text" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '80px', color: '#334155', fontWeight: 600 }}>
                                {item.name}
                              </span>
                            </div>
                            <span style={{ fontWeight: 700, color: color.text, fontSize: '0.7rem' }}>
                              {item.count}នាក់ ({pct}%)
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          })()}
        </ResponsiveGridLayout>
      </div>
    </div>
  );
}
