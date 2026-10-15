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
  Line,
  ComposedChart,
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
  loanStats?: {
    activeCount: number;
    totalPrincipal: number;
    totalRepaid: number;
    totalRemaining: number;
    monthlyDeduction: number;
    loans?: Array<{
      id: string;
      loanCode: string;
      empName: string;
      loanAmount: number;
      remainingBalance: number;
      monthlyDeduction: number;
      purpose: string;
      status: string;
    }>;
  };
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
  annualPayrollData?: Array<{
    month: number;
    monthKh: string;
    monthEn: string;
    label: string;
    empCount: number;
    grossSalary: number;
    netSalary: number;
    allowances: number;
    otWage: number;
    deductions: number;
    isProjected: boolean;
    hasData: boolean;
    status?: string;
    momDiffAmount?: number;
    momDiffPercent?: number;
  }>;
  annualEmployeeData?: Array<{
    month: number;
    monthKh: string;
    monthEn: string;
    label: string;
    totalHeadcount: number;
    femaleCount: number;
    maleCount: number;
    newHiresCount: number;
    exitsCount: number;
    netChange: number;
    turnoverRate: number;
    hiresList?: Array<{
      id: string;
      empId: string;
      name: string;
      dept: string;
      position: string;
      hireDate: string;
    }>;
  }>;
};

// Enterprise Standard Default Layout (Compact, Fit-Content, High-Readability Grid)
const DEFAULT_LAYOUTS = {
  lg: [
    { i: 'daily_attendance', x: 0, y: 0, w: 7, h: 3, minW: 4, minH: 3 },
    { i: 'loan_pay', x: 7, y: 0, w: 5, h: 3, minW: 3, minH: 3 },
    { i: 'recruitment', x: 0, y: 3, w: 6, h: 3, minW: 4, minH: 3 },
    { i: 'leave_application', x: 6, y: 3, w: 6, h: 3, minW: 4, minH: 3 },
    { i: 'employees_role', x: 0, y: 6, w: 6, h: 3, minW: 4, minH: 3 },
    { i: 'employees_location', x: 6, y: 6, w: 6, h: 3, minW: 4, minH: 3 },
    { i: 'contract_alerts', x: 0, y: 9, w: 12, h: 3, minW: 6, minH: 3 },
    { i: 'annual_employee_trends', x: 0, y: 12, w: 6, h: 4, minW: 4, minH: 3 },
    { i: 'annual_payroll_trends', x: 6, y: 12, w: 6, h: 4, minW: 4, minH: 3 },
  ],
  md: [
    { i: 'daily_attendance', x: 0, y: 0, w: 6, h: 3, minW: 4, minH: 3 },
    { i: 'loan_pay', x: 6, y: 0, w: 4, h: 3, minW: 3, minH: 3 },
    { i: 'recruitment', x: 0, y: 3, w: 5, h: 3, minW: 4, minH: 3 },
    { i: 'leave_application', x: 5, y: 3, w: 5, h: 3, minW: 4, minH: 3 },
    { i: 'employees_role', x: 0, y: 6, w: 5, h: 3, minW: 4, minH: 3 },
    { i: 'employees_location', x: 5, y: 6, w: 5, h: 3, minW: 4, minH: 3 },
    { i: 'contract_alerts', x: 0, y: 9, w: 10, h: 3, minW: 5, minH: 3 },
    { i: 'annual_employee_trends', x: 0, y: 12, w: 10, h: 4, minW: 5, minH: 3 },
    { i: 'annual_payroll_trends', x: 0, y: 16, w: 10, h: 4, minW: 5, minH: 3 },
  ],
  sm: [
    { i: 'daily_attendance', x: 0, y: 0, w: 6, h: 3, minW: 3, minH: 3 },
    { i: 'loan_pay', x: 0, y: 3, w: 6, h: 3, minW: 3, minH: 3 },
    { i: 'recruitment', x: 0, y: 6, w: 6, h: 3, minW: 3, minH: 3 },
    { i: 'leave_application', x: 0, y: 9, w: 6, h: 3, minW: 3, minH: 3 },
    { i: 'employees_role', x: 0, y: 12, w: 6, h: 3, minW: 3, minH: 3 },
    { i: 'employees_location', x: 0, y: 15, w: 6, h: 3, minW: 3, minH: 3 },
    { i: 'contract_alerts', x: 0, y: 18, w: 6, h: 3, minW: 3, minH: 3 },
    { i: 'annual_employee_trends', x: 0, y: 21, w: 6, h: 4, minW: 3, minH: 3 },
    { i: 'annual_payroll_trends', x: 0, y: 25, w: 6, h: 4, minW: 3, minH: 3 },
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
  loanStats = { activeCount: 0, totalPrincipal: 0, totalRepaid: 0, totalRemaining: 0, monthlyDeduction: 0, loans: [] },
  weeklyAttendanceData = [],
  recruitmentByDept = [],
  recruitmentStats,
  totalPayrollValue = 0,
  totalAdvanceValue = 0,
  filterGrandTotalSalary = 0,
  filterMonth = new Date().getMonth() + 1,
  filterYear = new Date().getFullYear(),
  todayAttendancesCount = 0,
  annualPayrollData = [],
  annualEmployeeData = [],
}: Props) {
  const [layouts, setLayouts] = useState<any>(null);
  const [isClient, setIsClient] = useState(false);
  const [recruitmentView, setRecruitmentView] = useState<'pipeline' | 'departments'>('pipeline');
  const [hometownView, setHometownView] = useState<'leaderboard' | 'donut'>('leaderboard');
  const [attendanceView, setAttendanceView] = useState<'trend' | 'bar'>('trend');
  const [departmentView, setDepartmentView] = useState<'leaderboard' | 'donut'>('leaderboard');
  const [loanView, setLoanView] = useState<'health' | 'portfolio'>('health');
  const [contractView, setContractView] = useState<'contracts' | 'birthdays'>('contracts');
  const [annualEmpView, setAnnualEmpView] = useState<'chart' | 'table' | 'hires'>('chart');
  const [annualPayrollView, setAnnualPayrollView] = useState<'chart' | 'table'>('chart');

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

  // Compute upcoming contract & probation expirations (within next 45 days or overdue up to 7 days)
  const upcomingContracts = React.useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const alerts: Array<{
      id: string;
      empId: string;
      name: string;
      department: string;
      position: string;
      type: string;
      typeKh: string;
      expiryDate: Date;
      daysRemaining: number;
    }> = [];

    allEmployees.forEach((emp) => {
      const empName = `${emp.lastNameKh || ''} ${emp.firstNameKh || ''} (${emp.firstNameEn || ''})`.trim() || 'បុគ្គលិក';

      // 1. Probation Expiration
      if (emp.probationEnd) {
        const pDate = new Date(emp.probationEnd);
        pDate.setHours(0, 0, 0, 0);
        const diffDays = Math.ceil((pDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        if (diffDays >= -7 && diffDays <= 45) {
          alerts.push({
            id: `${emp.id}-prob`,
            empId: emp.employeeId || '---',
            name: empName,
            department: emp.department || 'ទូទៅ',
            position: emp.position || 'បុគ្គលិក',
            type: 'PROBATION',
            typeKh: 'ផុតសាកល្បង',
            expiryDate: pDate,
            daysRemaining: diffDays,
          });
        }
      }

      // 2. Regular Contracts 1, 2, 3 Expirations
      const contracts = [
        { key: 'regularContract1', label: 'កិច្ចសន្យាទី ១' },
        { key: 'regularContract2', label: 'កិច្ចសន្យាទី ២' },
        { key: 'regularContract3', label: 'កិច្ចសន្យាទី ៣' },
      ];
      contracts.forEach((c) => {
        const rawDate = (emp as any)[c.key];
        if (rawDate) {
          const cDate = new Date(rawDate);
          cDate.setHours(0, 0, 0, 0);
          const diffDays = Math.ceil((cDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
          if (diffDays >= -7 && diffDays <= 45) {
            alerts.push({
              id: `${emp.id}-${c.key}`,
              empId: emp.employeeId || '---',
              name: empName,
              department: emp.department || 'ទូទៅ',
              position: emp.position || 'បុគ្គលិក',
              type: c.key,
              typeKh: c.label,
              expiryDate: cDate,
              daysRemaining: diffDays,
            });
          }
        }
      });
    });

    return alerts.sort((a, b) => a.daysRemaining - b.daysRemaining);
  }, [allEmployees]);

  // Compute upcoming birthdays this month
  const upcomingBirthdays = React.useMemo(() => {
    const today = new Date();
    const curMonth = today.getMonth(); // 0-indexed
    const curDay = today.getDate();

    const list: Array<{
      id: string;
      empId: string;
      name: string;
      department: string;
      position: string;
      birthDate: string;
      dayOfMonth: number;
      isToday: boolean;
      daysUntil: number;
    }> = [];

    allEmployees.forEach((emp) => {
      if (emp.dob) {
        const dob = new Date(emp.dob);
        if (dob.getMonth() === curMonth) {
          const bDay = dob.getDate();
          const diff = bDay - curDay;
          const empName = `${emp.lastNameKh || ''} ${emp.firstNameKh || ''} (${emp.firstNameEn || ''})`.trim() || 'បុគ្គលិក';
          list.push({
            id: emp.id,
            empId: emp.employeeId || '---',
            name: empName,
            department: emp.department || 'ទូទៅ',
            position: emp.position || 'បុគ្គលិក',
            birthDate: `${String(bDay).padStart(2, '0')}/${String(curMonth + 1).padStart(2, '0')}`,
            dayOfMonth: bDay,
            isToday: bDay === curDay,
            daysUntil: diff,
          });
        }
      }
    });

    return list.sort((a, b) => a.dayOfMonth - b.dayOfMonth);
  }, [allEmployees]);

  useEffect(() => {
    setIsClient(true);
    // Automatically purge old layout keys
    ['dashboard_layout_v9', 'dashboard_layout_v10', 'dashboard_layout_v11', 'dashboard_layout_v12', 'dashboard_layout_v13', 'dashboard_layout_v14'].forEach((k) => {
      try {
        localStorage.removeItem(k);
      } catch (e) {}
    });
    const saved = localStorage.getItem('dashboard_layout_v15');
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
    localStorage.setItem('dashboard_layout_v15', JSON.stringify(allLayouts));
  };

  const handleResetLayout = () => {
    localStorage.removeItem('dashboard_layout_v15');
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
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.72rem', color: '#64748b', borderTop: '1px dashed #f1f5f9', paddingTop: '5px', whiteSpace: 'nowrap' }}>
              <span style={{ lineHeight: 1.4 }}>ស្រី: <strong style={{ color: '#0f172a' }}>{totalFemale}</strong> | ប្រុស: <strong style={{ color: '#0f172a' }}>{totalMale}</strong></span>
              <span style={{ color: '#0284c7', fontWeight: 700, whiteSpace: 'nowrap', lineHeight: 1.4 }}>ចូលមើល ➔</span>
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
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.72rem', color: '#64748b', borderTop: '1px dashed #f1f5f9', paddingTop: '5px', whiteSpace: 'nowrap' }}>
              <span style={{ lineHeight: 1.4 }}>អត្រាវត្តមាន: <strong style={{ color: '#059669' }}>{attendanceRate}%</strong></span>
              <span style={{ color: '#10b981', fontWeight: 700, whiteSpace: 'nowrap', lineHeight: 1.4 }}>ចូលមើល ➔</span>
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
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.72rem', color: '#64748b', borderTop: '1px dashed #f1f5f9', paddingTop: '5px', whiteSpace: 'nowrap' }}>
              <span style={{ lineHeight: 1.4 }}>មានច្បាប់: <strong style={{ color: '#0f172a' }}>{leaveStats.total}</strong> នាក់</span>
              <span style={{ color: '#f59e0b', fontWeight: 700, whiteSpace: 'nowrap', lineHeight: 1.4 }}>ចូលមើល ➔</span>
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
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.72rem', color: '#64748b', borderTop: '1px dashed #f1f5f9', paddingTop: '5px', whiteSpace: 'nowrap' }}>
              <span style={{ lineHeight: 1.4 }}>ស្រី: <strong>{absentStats?.female || 0}</strong> | ប្រុស: <strong>{absentStats?.male || 0}</strong></span>
              <span style={{ color: '#ef4444', fontWeight: 700, whiteSpace: 'nowrap', lineHeight: 1.4 }}>ចូលមើល ➔</span>
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
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.72rem', color: '#64748b', borderTop: '1px dashed #f1f5f9', paddingTop: '5px', whiteSpace: 'nowrap' }}>
              <span style={{ lineHeight: 1.4 }}>ខែ {filterMonth}/{filterYear}</span>
              <span style={{ color: '#6366f1', fontWeight: 700, whiteSpace: 'nowrap', lineHeight: 1.4 }}>ចូលមើល ➔</span>
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
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.72rem', color: '#64748b', borderTop: '1px dashed #f1f5f9', paddingTop: '5px', whiteSpace: 'nowrap' }}>
              <span style={{ lineHeight: 1.4 }}>{advanceStats.count} នាក់ស្នើសុំ</span>
              <span style={{ color: '#8b5cf6', fontWeight: 700, whiteSpace: 'nowrap', lineHeight: 1.4 }}>ចូលមើល ➔</span>
            </div>
          </Link>
        </div>

        {/* ========================================================
            QUICK ACTION HUB (ផ្ទាំងផ្លូវកាត់ប្រតិបត្តិការរហ័ស)
           ======================================================== */}
        <div
          style={{
            backgroundColor: '#ffffff',
            borderRadius: '14px',
            padding: '12px 16px',
            border: '1px solid #e2e8f0',
            boxShadow: '0 1px 4px rgba(0,0,0,0.03)',
            marginBottom: '16px',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', flexWrap: 'wrap', gap: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '1.05rem' }}>⚡</span>
              <span className="kh-text" style={{ fontSize: '0.86rem', fontWeight: 800, color: '#0f172a' }}>
                ផ្លូវកាត់ប្រតិបត្តិការរហ័ស (Quick Action Hub)
              </span>
              <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>| ចុចដើម្បីដំណើរការកិច្ចការប្រចាំថ្ងៃភ្លាមៗ</span>
            </div>
            <span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#0284c7', backgroundColor: '#f0f9ff', padding: '2px 8px', borderRadius: '6px', border: '1px solid #bae6fd', whiteSpace: 'nowrap' }}>
              ⚡ ៦ មុខងារចម្បង
            </span>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
              gap: '10px',
            }}
          >
            {/* Action 1: Add Employee */}
            <Link
              href="/dashboard/employees/new"
              style={{
                textDecoration: 'none',
                backgroundColor: '#f8fafc',
                borderRadius: '10px',
                padding: '8px 12px',
                border: '1px solid #e2e8f0',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                transition: 'all 0.15s ease',
              }}
              className="hover-elevate"
            >
              <div style={{ width: '34px', height: '34px', borderRadius: '8px', backgroundColor: '#e0f2fe', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem', flexShrink: 0 }}>
                👥
              </div>
              <div style={{ minWidth: 0 }}>
                <div className="kh-text" style={{ fontSize: '0.8rem', fontWeight: 700, color: '#0f172a', whiteSpace: 'nowrap', lineHeight: 1.35 }}>
                  + បន្ថែមបុគ្គលិក
                </div>
                <div style={{ fontSize: '0.66rem', color: '#64748b', whiteSpace: 'nowrap' }}>
                  New Employee
                </div>
              </div>
            </Link>

            {/* Action 2: Daily Attendance */}
            <Link
              href="/dashboard/attendance"
              style={{
                textDecoration: 'none',
                backgroundColor: '#f8fafc',
                borderRadius: '10px',
                padding: '8px 12px',
                border: '1px solid #e2e8f0',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                transition: 'all 0.15s ease',
              }}
              className="hover-elevate"
            >
              <div style={{ width: '34px', height: '34px', borderRadius: '8px', backgroundColor: '#dcfce7', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem', flexShrink: 0 }}>
                📅
              </div>
              <div style={{ minWidth: 0 }}>
                <div className="kh-text" style={{ fontSize: '0.8rem', fontWeight: 700, color: '#0f172a', whiteSpace: 'nowrap', lineHeight: 1.35 }}>
                  + កត់ត្រាវត្តមាន
                </div>
                <div style={{ fontSize: '0.66rem', color: '#64748b', whiteSpace: 'nowrap' }}>
                  Log Attendance
                </div>
              </div>
            </Link>

            {/* Action 3: Apply Leave */}
            <Link
              href="/dashboard/leave/new"
              style={{
                textDecoration: 'none',
                backgroundColor: '#f8fafc',
                borderRadius: '10px',
                padding: '8px 12px',
                border: '1px solid #e2e8f0',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                transition: 'all 0.15s ease',
              }}
              className="hover-elevate"
            >
              <div style={{ width: '34px', height: '34px', borderRadius: '8px', backgroundColor: '#fef3c7', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem', flexShrink: 0 }}>
                🌴
              </div>
              <div style={{ minWidth: 0 }}>
                <div className="kh-text" style={{ fontSize: '0.8rem', fontWeight: 700, color: '#0f172a', whiteSpace: 'nowrap', lineHeight: 1.35 }}>
                  + ស្នើសុំច្បាប់
                </div>
                <div style={{ fontSize: '0.66rem', color: '#64748b', whiteSpace: 'nowrap' }}>
                  Request Leave
                </div>
              </div>
            </Link>

            {/* Action 4: Request Advance */}
            <Link
              href="/dashboard/advance/new"
              style={{
                textDecoration: 'none',
                backgroundColor: '#f8fafc',
                borderRadius: '10px',
                padding: '8px 12px',
                border: '1px solid #e2e8f0',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                transition: 'all 0.15s ease',
              }}
              className="hover-elevate"
            >
              <div style={{ width: '34px', height: '34px', borderRadius: '8px', backgroundColor: '#ede9fe', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem', flexShrink: 0 }}>
                💵
              </div>
              <div style={{ minWidth: 0 }}>
                <div className="kh-text" style={{ fontSize: '0.8rem', fontWeight: 700, color: '#0f172a', whiteSpace: 'nowrap', lineHeight: 1.35 }}>
                  + ស្នើបុរេប្រទាន
                </div>
                <div style={{ fontSize: '0.66rem', color: '#64748b', whiteSpace: 'nowrap' }}>
                  Salary Advance
                </div>
              </div>
            </Link>

            {/* Action 5: Run Payroll */}
            <Link
              href="/dashboard/payroll"
              style={{
                textDecoration: 'none',
                backgroundColor: '#f8fafc',
                borderRadius: '10px',
                padding: '8px 12px',
                border: '1px solid #e2e8f0',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                transition: 'all 0.15s ease',
              }}
              className="hover-elevate"
            >
              <div style={{ width: '34px', height: '34px', borderRadius: '8px', backgroundColor: '#e0e7ff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem', flexShrink: 0 }}>
                💰
              </div>
              <div style={{ minWidth: 0 }}>
                <div className="kh-text" style={{ fontSize: '0.8rem', fontWeight: 700, color: '#0f172a', whiteSpace: 'nowrap', lineHeight: 1.35 }}>
                  + បើកប្រាក់ខែ
                </div>
                <div style={{ fontSize: '0.66rem', color: '#64748b', whiteSpace: 'nowrap' }}>
                  Run Payroll
                </div>
              </div>
            </Link>

            {/* Action 6: Recruitment ATS */}
            <Link
              href="/dashboard/recruitment"
              style={{
                textDecoration: 'none',
                backgroundColor: '#f8fafc',
                borderRadius: '10px',
                padding: '8px 12px',
                border: '1px solid #e2e8f0',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                transition: 'all 0.15s ease',
              }}
              className="hover-elevate"
            >
              <div style={{ width: '34px', height: '34px', borderRadius: '8px', backgroundColor: '#e0f2fe', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem', flexShrink: 0 }}>
                📢
              </div>
              <div style={{ minWidth: 0 }}>
                <div className="kh-text" style={{ fontSize: '0.8rem', fontWeight: 700, color: '#0f172a', whiteSpace: 'nowrap', lineHeight: 1.35 }}>
                  + ជ្រើសរើសបុគ្គលិក
                </div>
                <div style={{ fontSize: '0.66rem', color: '#64748b', whiteSpace: 'nowrap' }}>
                  Recruitment ATS
                </div>
              </div>
            </Link>
          </div>
        </div>

        {/* ========================================================
            DRAGGABLE CHARTS & ANALYTICS WIDGETS
           ======================================================== */}
        <ResponsiveGridLayout
          className="layout"
          layouts={layouts}
          breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
          cols={{ lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 }}
          rowHeight={98}
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
                data-grid={{ x: 0, y: 0, w: 7, h: 3, minW: 4, minH: 3 }}
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
                  <div style={{ minWidth: 0, flex: 1, paddingRight: '8px' }}>
                    <h3 className="kh-text" style={{ margin: 0, fontSize: '0.94rem', color: '#0f172a', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '6px', lineHeight: 1.4 }}>
                      <span>📅</span>
                      <span>ស្ថិតិវត្តមានប្រចាំសប្តាហ៍ (Daily Attendance)</span>
                    </h3>
                    <span style={{ fontSize: '0.72rem', color: '#64748b', lineHeight: 1.5, display: 'block', paddingTop: '1px' }}>៧ ថ្ងៃចុងក្រោយ • Last 7 Days Attendance Trend</span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                    {/* View Switcher Segmented Button */}
                    <div
                      style={{
                        display: 'inline-flex',
                        backgroundColor: '#f1f5f9',
                        padding: '2px',
                        borderRadius: '8px',
                        border: '1px solid #e2e8f0',
                        gap: '2px',
                        flexShrink: 0,
                      }}
                    >
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setAttendanceView('trend');
                        }}
                        style={{
                          padding: '3px 9px',
                          fontSize: '0.72rem',
                          fontWeight: 700,
                          borderRadius: '6px',
                          border: 'none',
                          cursor: 'pointer',
                          backgroundColor: attendanceView === 'trend' ? '#ffffff' : 'transparent',
                          color: attendanceView === 'trend' ? '#0284c7' : '#64748b',
                          boxShadow: attendanceView === 'trend' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                          transition: 'all 0.15s ease',
                          whiteSpace: 'nowrap',
                          flexShrink: 0,
                          lineHeight: 1.4,
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
                          padding: '3px 9px',
                          fontSize: '0.72rem',
                          fontWeight: 700,
                          borderRadius: '6px',
                          border: 'none',
                          cursor: 'pointer',
                          backgroundColor: attendanceView === 'bar' ? '#ffffff' : 'transparent',
                          color: attendanceView === 'bar' ? '#0284c7' : '#64748b',
                          boxShadow: attendanceView === 'bar' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                          transition: 'all 0.15s ease',
                          whiteSpace: 'nowrap',
                          flexShrink: 0,
                          lineHeight: 1.4,
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
                        flexShrink: 0,
                        lineHeight: 1.4,
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
                      whiteSpace: 'nowrap',
                      lineHeight: 1.4,
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
                      whiteSpace: 'nowrap',
                      lineHeight: 1.4,
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
                      whiteSpace: 'nowrap',
                      lineHeight: 1.4,
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
                      whiteSpace: 'nowrap',
                      lineHeight: 1.4,
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

          {/* 3. ADVANCE SALARY & LOAN HEALTH (MODERN 2-IN-1: HEALTH DONUT & PORTFOLIO COMPARISON) */}
          {(() => {
            const advPaid = advanceStats?.paid || 0;
            const advRemaining = advanceStats?.remaining || 0;
            const advTotal = advPaid + advRemaining > 0 ? advPaid + advRemaining : totalAdvanceValue;
            const advCount = advanceStats?.count || 0;

            const loanPrincipal = loanStats?.totalPrincipal || 0;
            const loanRepaid = loanStats?.totalRepaid || 0;
            const loanRemaining = loanStats?.totalRemaining || 0;
            const loanCount = loanStats?.activeCount || 0;
            const loanMonthly = loanStats?.monthlyDeduction || 0;

            const grandTotal = advTotal + loanPrincipal;
            const grandRepaid = advPaid + loanRepaid;
            const grandRemaining = advRemaining + loanRemaining;
            const recoveryRate = grandTotal > 0 ? Math.round((grandRepaid / grandTotal) * 100) : (grandTotal === 0 ? 100 : 0);

            const donutData = [
              { name: 'បានទូទាត់សង (Repaid)', value: grandRepaid > 0 ? grandRepaid : (grandTotal === 0 ? 1 : 0), color: '#10b981' },
              { name: 'នៅសល់ត្រូវទូទាត់ (Remaining)', value: grandRemaining > 0 ? grandRemaining : 0, color: '#6366f1' },
            ];

            const advPct = advTotal > 0 ? Math.round((advPaid / advTotal) * 100) : 100;
            const loanPct = loanPrincipal > 0 ? Math.round((loanRepaid / loanPrincipal) * 100) : 100;

            return (
              <div
                key="loan_pay"
                data-grid={{ x: 7, y: 0, w: 5, h: 3, minW: 3, minH: 3 }}
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
                  <div style={{ minWidth: 0, flex: 1, paddingRight: '6px' }}>
                    <h3 className="kh-text" style={{ margin: 0, fontSize: '0.92rem', color: '#0f172a', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '6px', whiteSpace: 'nowrap', lineHeight: 1.4 }}>
                      <span>💳</span>
                      <span>កម្ចី & បុរេប្រទាន (Loans & Advances)</span>
                    </h3>
                    <span style={{ fontSize: '0.7rem', color: '#64748b', whiteSpace: 'nowrap', display: 'block', lineHeight: 1.4, paddingTop: '1px' }}>Advances & Employee Loans</span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                    {/* View Switcher Segmented Button */}
                    <div
                      style={{
                        display: 'inline-flex',
                        backgroundColor: '#f1f5f9',
                        padding: '2px',
                        borderRadius: '8px',
                        border: '1px solid #e2e8f0',
                        gap: '2px',
                        flexShrink: 0,
                      }}
                    >
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setLoanView('health');
                        }}
                        style={{
                          padding: '3px 8px',
                          fontSize: '0.72rem',
                          fontWeight: 700,
                          borderRadius: '6px',
                          border: 'none',
                          cursor: 'pointer',
                          backgroundColor: loanView === 'health' ? '#ffffff' : 'transparent',
                          color: loanView === 'health' ? '#6366f1' : '#64748b',
                          boxShadow: loanView === 'health' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                          transition: 'all 0.15s ease',
                          whiteSpace: 'nowrap',
                          flexShrink: 0,
                          lineHeight: 1.4,
                        }}
                      >
                        🍩 សុខភាព
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setLoanView('portfolio');
                        }}
                        style={{
                          padding: '3px 8px',
                          fontSize: '0.72rem',
                          fontWeight: 700,
                          borderRadius: '6px',
                          border: 'none',
                          cursor: 'pointer',
                          backgroundColor: loanView === 'portfolio' ? '#ffffff' : 'transparent',
                          color: loanView === 'portfolio' ? '#6366f1' : '#64748b',
                          boxShadow: loanView === 'portfolio' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                          transition: 'all 0.15s ease',
                          whiteSpace: 'nowrap',
                          flexShrink: 0,
                          lineHeight: 1.4,
                        }}
                      >
                        ⚖️ ប្រៀបធៀប
                      </button>
                    </div>

                    <Link
                      href="/dashboard/advance"
                      title="គ្រប់គ្រងបុរេប្រទាន & កម្ចី"
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
                        flexShrink: 0,
                        lineHeight: 1.4,
                      }}
                    >
                      គ្រប់គ្រង ➔
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
                      backgroundColor: '#f5f3ff',
                      color: '#6d28d9',
                      border: '1px solid #ddd6fe',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      whiteSpace: 'nowrap',
                      lineHeight: 1.4,
                    }}
                  >
                    <span>💵</span>
                    <span>បុរេប្រទាន៖ ${advTotal.toLocaleString()} ({advCount} នាក់)</span>
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
                      whiteSpace: 'nowrap',
                      lineHeight: 1.4,
                    }}
                  >
                    <span>🏦</span>
                    <span>កម្ចីសកម្ម៖ ${loanPrincipal.toLocaleString()} ({loanCount} នាក់)</span>
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
                      whiteSpace: 'nowrap',
                      lineHeight: 1.4,
                    }}
                  >
                    <span>🔄</span>
                    <span>អត្រាសង៖ {recoveryRate}%</span>
                  </span>
                </div>

                {/* Main Content: Health Donut vs Portfolio Comparison */}
                {loanView === 'health' ? (
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: '135px' }}>
                    <div style={{ flex: 1, position: 'relative', minHeight: '110px' }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={donutData}
                            cx="50%"
                            cy="50%"
                            innerRadius={50}
                            outerRadius={72}
                            paddingAngle={3}
                            dataKey="value"
                          >
                            <Cell fill="#10b981" />
                            <Cell fill="#6366f1" />
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
                                    <div style={{ fontWeight: 800, color: data.color, marginBottom: '2px' }}>{data.name}</div>
                                    <div>ទឹកប្រាក់៖ <strong>${data.value.toLocaleString()}</strong></div>
                                    <div>សមាមាត្រ៖ <strong>{grandTotal > 0 ? Math.round((data.value / grandTotal) * 100) : 0}%</strong></div>
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
                          width: '90px',
                        }}
                      >
                        <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', lineHeight: 1.1 }}>
                          ${grandTotal.toLocaleString()}
                        </div>
                        <div style={{ fontSize: '0.66rem', color: '#64748b', marginTop: '2px', fontWeight: 600, whiteSpace: 'nowrap' }}>
                          សរុប ({recoveryRate}%)
                        </div>
                      </div>
                    </div>

                    {/* Bottom Status Breakdown Ribbon */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px', paddingTop: '6px', borderTop: '1px dashed #f1f5f9', flexWrap: 'wrap' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.72rem', whiteSpace: 'nowrap' }}>
                        <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#10b981', flexShrink: 0 }} />
                        <span style={{ color: '#64748b' }}>បានសង៖</span>
                        <strong style={{ color: '#047857' }}>${grandRepaid.toLocaleString()}</strong>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.72rem', whiteSpace: 'nowrap' }}>
                        <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#6366f1', flexShrink: 0 }} />
                        <span style={{ color: '#64748b' }}>នៅសល់៖</span>
                        <strong style={{ color: '#4338ca' }}>${grandRemaining.toLocaleString()}</strong>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px', minHeight: '135px', overflowY: 'auto', paddingRight: '2px' }}>
                    {/* Advance Salary Box */}
                    <div
                      style={{
                        padding: '8px 10px',
                        backgroundColor: '#faf5ff',
                        borderRadius: '10px',
                        border: '1px solid #e9d5ff',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '4px',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{ fontSize: '0.9rem' }}>💵</span>
                          <span style={{ fontSize: '0.78rem', fontWeight: 800, color: '#6b21a8' }}>បុរេប្រទានប្រចាំខែ (Advance)</span>
                        </div>
                        <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#6b21a8' }}>
                          ${advTotal.toLocaleString()}
                        </span>
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.68rem', color: '#64748b' }}>
                        <span>បានកាត់ចេញ៖ <strong style={{ color: '#10b981' }}>${advPaid.toLocaleString()}</strong></span>
                        <span>នៅសល់៖ <strong style={{ color: '#8b5cf6' }}>${advRemaining.toLocaleString()}</strong> ({advCount} នាក់)</span>
                      </div>

                      {/* Mini Progress */}
                      <div style={{ height: '4px', width: '100%', backgroundColor: '#e9d5ff', borderRadius: '3px', overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${advPct}%`, background: 'linear-gradient(90deg, #8b5cf6, #10b981)', borderRadius: '3px' }} />
                      </div>
                    </div>

                    {/* Employee Loans Box */}
                    <div
                      style={{
                        padding: '8px 10px',
                        backgroundColor: '#f0f9ff',
                        borderRadius: '10px',
                        border: '1px solid #bae6fd',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '4px',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{ fontSize: '0.9rem' }}>🏦</span>
                          <span style={{ fontSize: '0.78rem', fontWeight: 800, color: '#0369a1' }}>ប្រាក់កម្ចីបុគ្គលិក (Company Loans)</span>
                        </div>
                        <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#0369a1' }}>
                          ${loanPrincipal.toLocaleString()}
                        </span>
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.68rem', color: '#64748b' }}>
                        <span>បានសង៖ <strong style={{ color: '#10b981' }}>${loanRepaid.toLocaleString()}</strong></span>
                        <span>នៅសល់៖ <strong style={{ color: '#0284c7' }}>${loanRemaining.toLocaleString()}</strong> ({loanCount} កម្ចី)</span>
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.65rem', color: '#0284c7', fontWeight: 600 }}>
                        <span style={{ whiteSpace: 'nowrap', lineHeight: 1.4 }}>រំលស់ប្រចាំខែ៖ <strong>${loanMonthly.toLocaleString()}/ខែ</strong></span>
                        <Link href="/dashboard/loans" style={{ color: '#0284c7', textDecoration: 'none', fontWeight: 700, whiteSpace: 'nowrap', flexShrink: 0, lineHeight: 1.4 }}>
                          មើលលម្អិត ➔
                        </Link>
                      </div>

                      {/* Mini Progress */}
                      <div style={{ height: '4px', width: '100%', backgroundColor: '#bae6fd', borderRadius: '3px', overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${loanPct}%`, background: 'linear-gradient(90deg, #0284c7, #10b981)', borderRadius: '3px' }} />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })()}

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
                data-grid={{ x: 0, y: 3, w: 6, h: 3, minW: 4, minH: 3 }}
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
                  <div style={{ minWidth: 0, flex: 1, paddingRight: '6px' }}>
                    <h3 className="kh-text" style={{ margin: 0, fontSize: '0.94rem', color: '#0f172a', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '6px', whiteSpace: 'nowrap', lineHeight: 1.4 }}>
                      <span>📢</span>
                      <span>ជ្រើសរើសបុគ្គលិក (Recruitment ATS)</span>
                    </h3>
                    <span style={{ fontSize: '0.7rem', color: '#64748b', display: 'block', lineHeight: 1.4, paddingTop: '1px', whiteSpace: 'nowrap' }}>Hiring Demand & Candidate Pipeline</span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                    {/* View Switcher Segmented Button */}
                    <div
                      style={{
                        display: 'inline-flex',
                        backgroundColor: '#f1f5f9',
                        padding: '2px',
                        borderRadius: '8px',
                        border: '1px solid #e2e8f0',
                        gap: '2px',
                        flexShrink: 0,
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
                          whiteSpace: 'nowrap',
                          flexShrink: 0,
                          lineHeight: 1.4,
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
                          whiteSpace: 'nowrap',
                          flexShrink: 0,
                          lineHeight: 1.4,
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
                        flexShrink: 0,
                        lineHeight: 1.4,
                      }}
                    >
                      បេក្ខជន ➔
                    </Link>
                  </div>
                </div>

                {/* Metric Summary Ribbon */}
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '8px' }}>
                  <span style={{ fontSize: '0.67rem', fontWeight: 700, padding: '2px 7px', borderRadius: '5px', backgroundColor: '#eff6ff', color: '#1d4ed8', border: '1px solid #bfdbfe', whiteSpace: 'nowrap', lineHeight: 1.4 }}>
                    📋 ដំណែងទំនេរ៖ {totalOpenJobs}
                  </span>
                  <span style={{ fontSize: '0.67rem', fontWeight: 700, padding: '2px 7px', borderRadius: '5px', backgroundColor: '#f5f3ff', color: '#6d28d9', border: '1px solid #ddd6fe', whiteSpace: 'nowrap', lineHeight: 1.4 }}>
                    👥 បេក្ខជនសរុប៖ {totalCandidatesCount}
                  </span>
                  <span style={{ fontSize: '0.67rem', fontWeight: 700, padding: '2px 7px', borderRadius: '5px', backgroundColor: '#f0fdf4', color: '#15803d', border: '1px solid #bbf7d0', whiteSpace: 'nowrap', lineHeight: 1.4 }}>
                    ✅ ជាប់ស្ថាពរ៖ {hiredCount}
                  </span>
                </div>

                {/* View 1: Sleek ATS Pipeline Funnel */}
                {recruitmentView === 'pipeline' ? (
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '5px', overflowY: 'auto', paddingRight: '2px' }}>
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
                          <div style={{ width: '85px', flexShrink: 0 }}>
                            <div className="kh-text" style={{ fontSize: '0.76rem', fontWeight: 700, color: '#0f172a', lineHeight: 1.35, whiteSpace: 'nowrap' }}>
                              {stage.nameKh}
                            </div>
                            <div style={{ fontSize: '0.62rem', color: '#64748b', fontWeight: 500, whiteSpace: 'nowrap', lineHeight: 1.2 }}>
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
                          <div style={{ display: 'flex', alignItems: 'center', gap: '5px', minWidth: '65px', justifyContent: 'flex-end', flexShrink: 0 }}>
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
                                lineHeight: 1.4,
                              }}
                            >
                              {stage.count} នាក់
                            </span>
                            <span style={{ fontSize: '0.65rem', color: '#94a3b8', fontWeight: 700, minWidth: '26px', textAlign: 'right', whiteSpace: 'nowrap', lineHeight: 1.4 }}>
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
            data-grid={{ x: 6, y: 3, w: 6, h: 3, minW: 4, minH: 3 }}
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
            <div className="card-drag-handle" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', cursor: 'grab' }}>
              <div style={{ minWidth: 0, flex: 1, paddingRight: '6px' }}>
                <h3 className="kh-text" style={{ margin: 0, fontSize: '0.94rem', color: '#0f172a', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '6px', whiteSpace: 'nowrap', lineHeight: 1.4 }}>
                  <span>🌴</span>
                  <span>សំណើសុំច្បាប់ថ្មីៗ (Recent Leave Requests)</span>
                </h3>
                <span style={{ fontSize: '0.7rem', color: '#64748b', display: 'block', lineHeight: 1.4, paddingTop: '1px', whiteSpace: 'nowrap' }}>Latest Requests & Clearances</span>
              </div>
              <Link
                href="/dashboard/leave"
                style={{
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  color: '#d97706',
                  textDecoration: 'none',
                  backgroundColor: '#fef3c7',
                  padding: '3px 8px',
                  borderRadius: '6px',
                  border: '1px solid #fde68a',
                  whiteSpace: 'nowrap',
                  flexShrink: 0,
                  lineHeight: 1.4,
                }}
              >
                មើលទាំងអស់ ➔
              </Link>
            </div>

            {/* Mini Summary Ribbon */}
            <div style={{ display: 'flex', gap: '6px', marginBottom: '8px', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '0.67rem', fontWeight: 700, padding: '2px 7px', borderRadius: '5px', backgroundColor: '#fef3c7', color: '#b45309', border: '1px solid #fde68a', whiteSpace: 'nowrap', lineHeight: 1.4 }}>
                ⏳ រង់ចាំពិនិត្យ៖ {(recentLeaveRequests || []).filter(r => r.status === 'PENDING').length}
              </span>
              <span style={{ fontSize: '0.67rem', fontWeight: 700, padding: '2px 7px', borderRadius: '5px', backgroundColor: '#f0fdf4', color: '#15803d', border: '1px solid #bbf7d0', whiteSpace: 'nowrap', lineHeight: 1.4 }}>
                ✅ អនុម័តរួច៖ {(recentLeaveRequests || []).filter(r => r.status === 'APPROVED').length}
              </span>
              <span style={{ fontSize: '0.67rem', fontWeight: 700, padding: '2px 7px', borderRadius: '5px', backgroundColor: '#eef2ff', color: '#4338ca', border: '1px solid #c7d2fe', whiteSpace: 'nowrap', lineHeight: 1.4 }}>
                📋 សរុបច្បាប់៖ {leaveStats?.total || (recentLeaveRequests || []).length} នាក់
              </span>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '6px', paddingRight: '2px' }}>
              {(recentLeaveRequests || []).length > 0 ? (
                recentLeaveRequests.map((req: any, i: number) => {
                  const emp = req.employee;
                  const empId = emp?.employeeId || '---';
                  const empName = emp
                    ? `${emp.lastNameKh || ''} ${emp.firstNameKh || ''} (${emp.firstNameEn || ''} ${emp.lastNameEn || ''})`.trim()
                    : 'បុគ្គលិក';
                  const dept = emp?.department || 'ទូទៅ';
                  const position = emp?.position || 'បុគ្គលិក';
                  const durationDays = req.duration && req.duration > 0
                    ? req.duration
                    : (req.startDate && req.endDate
                        ? Math.max(1, Math.round((new Date(req.endDate).getTime() - new Date(req.startDate).getTime()) / (1000 * 60 * 60 * 24)) + 1)
                        : 1);

                  const leaveTypeKhMap: Record<string, string> = {
                    ANNUAL: 'ច្បាប់ប្រចាំឆ្នាំ',
                    SICK: 'ច្បាប់ឈឺ',
                    UNPAID: 'ឥតប្រាក់ឈ្នួល',
                    MATERNITY: 'លំហែមាតុភាព',
                    SPECIAL: 'ច្បាប់ពិសេស',
                    CASUAL: 'ច្បាប់ផ្ទាល់ខ្លួន',
                  };
                  const leaveTypeLabel = leaveTypeKhMap[req.leaveType?.toUpperCase()] || req.leaveType || 'ច្បាប់';

                  const isApproved = req.status === 'APPROVED';
                  const isRejected = req.status === 'REJECTED';

                  const dateStr = req.startDate
                    ? new Date(req.startDate).toLocaleDateString('en-GB')
                    : '';

                  return (
                    <Link
                      key={req.id || i}
                      href="/dashboard/leave"
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '7px 10px',
                        backgroundColor: '#f8fafc',
                        borderRadius: '9px',
                        textDecoration: 'none',
                        transition: 'all 0.15s ease',
                        gap: '10px',
                        border: '1px solid #f1f5f9',
                      }}
                      className="hover-elevate"
                    >
                      {/* Left: Avatar Icon */}
                      <div
                        style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: '8px',
                          backgroundColor: '#e0f2fe',
                          color: '#0369a1',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '1rem',
                          flexShrink: 0,
                          border: '1px solid #bae6fd',
                        }}
                      >
                        👤
                      </div>

                      {/* Center: Detailed Info (Name, ID, Duration, Dept, Role) */}
                      <div style={{ minWidth: 0, flex: 1, display: 'flex', flexDirection: 'column', gap: '2px' }}>
                        {/* Line 1: Name + ID Badge + Duration Badge */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                          <span style={{ fontSize: '0.82rem', fontWeight: 800, color: '#0f172a', whiteSpace: 'nowrap', lineHeight: 1.35 }}>
                            {empName}
                          </span>
                          <span
                            style={{
                              fontSize: '0.65rem',
                              fontWeight: 700,
                              color: '#334155',
                              backgroundColor: '#e2e8f0',
                              padding: '1px 6px',
                              borderRadius: '4px',
                              fontFamily: 'monospace',
                              whiteSpace: 'nowrap',
                              lineHeight: 1.3,
                            }}
                          >
                            ID: {empId}
                          </span>
                          <span
                            style={{
                              fontSize: '0.65rem',
                              fontWeight: 800,
                              color: '#b45309',
                              backgroundColor: '#fef3c7',
                              border: '1px solid #fde68a',
                              padding: '1px 6px',
                              borderRadius: '4px',
                              whiteSpace: 'nowrap',
                              lineHeight: 1.3,
                            }}
                          >
                            ⏱️ {durationDays} ថ្ងៃ
                          </span>
                        </div>

                        {/* Line 2: Department (ផ្នែក) + Role (តួនាទី) + Reason */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.7rem', color: '#64748b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', lineHeight: 1.3 }}>
                          <span style={{ color: '#0284c7', fontWeight: 700, flexShrink: 0 }}>
                            🏢 {dept}
                          </span>
                          <span style={{ color: '#cbd5e1', flexShrink: 0 }}>•</span>
                          <span style={{ color: '#475569', fontWeight: 600, flexShrink: 0 }}>
                            💼 {position}
                          </span>
                          <span style={{ color: '#cbd5e1', flexShrink: 0 }}>•</span>
                          <span style={{ color: '#64748b', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {leaveTypeLabel}{req.reason ? ` (${req.reason})` : ''}
                          </span>
                        </div>
                      </div>

                      {/* Right: Status Badge & Date */}
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '3px', flexShrink: 0 }}>
                        <span
                          style={{
                            fontSize: '0.68rem',
                            fontWeight: 800,
                            padding: '2px 7px',
                            borderRadius: '6px',
                            backgroundColor: isApproved ? '#dcfce7' : isRejected ? '#fee2e2' : '#fef3c7',
                            color: isApproved ? '#15803d' : isRejected ? '#b91c1c' : '#b45309',
                            border: `1px solid ${isApproved ? '#bbf7d0' : isRejected ? '#fecaca' : '#fde68a'}`,
                            whiteSpace: 'nowrap',
                            lineHeight: 1.4,
                          }}
                        >
                          {isApproved ? '✅ អនុម័តរួច' : isRejected ? '❌ បដិសេធ' : '⏳ រង់ចាំ'}
                        </span>
                        {dateStr && (
                          <span style={{ fontSize: '0.62rem', color: '#94a3b8', whiteSpace: 'nowrap', lineHeight: 1.2 }}>
                            {dateStr}
                          </span>
                        )}
                      </div>
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
                data-grid={{ x: 0, y: 6, w: 6, h: 3, minW: 4, minH: 3 }}
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
                  <div style={{ minWidth: 0, flex: 1, paddingRight: '6px' }}>
                    <h3 className="kh-text" style={{ margin: 0, fontSize: '0.94rem', color: '#0f172a', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '6px', whiteSpace: 'nowrap', lineHeight: 1.4 }}>
                      <span>🏢</span>
                      <span>រចនាសម្ព័ន្ធបុគ្គលិកតាមផ្នែក (Employees by Department)</span>
                    </h3>
                    <span style={{ fontSize: '0.7rem', color: '#64748b', display: 'block', lineHeight: 1.4, paddingTop: '1px', whiteSpace: 'nowrap' }}>Department Headcount & Workforce Distribution</span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                    {/* View Switcher Segmented Button */}
                    <div
                      style={{
                        display: 'inline-flex',
                        backgroundColor: '#f1f5f9',
                        padding: '2px',
                        borderRadius: '8px',
                        border: '1px solid #e2e8f0',
                        gap: '2px',
                        flexShrink: 0,
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
                          whiteSpace: 'nowrap',
                          flexShrink: 0,
                          lineHeight: 1.4,
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
                          whiteSpace: 'nowrap',
                          flexShrink: 0,
                          lineHeight: 1.4,
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
                        flexShrink: 0,
                        lineHeight: 1.4,
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
                      whiteSpace: 'nowrap',
                      lineHeight: 1.4,
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
                      whiteSpace: 'nowrap',
                      lineHeight: 1.4,
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
                      whiteSpace: 'nowrap',
                      lineHeight: 1.4,
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
                          <span style={{ fontSize: '0.8rem', minWidth: '22px', textAlign: 'center', fontWeight: 700, color: '#64748b', lineHeight: 1.4 }}>
                            {medal}
                          </span>

                          {/* Dept Icon */}
                          <span style={{ fontSize: '1rem', flexShrink: 0 }}>{icon}</span>

                          {/* Dept Name & Progress Bar */}
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2px' }}>
                              <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', lineHeight: 1.35 }}>
                                {dept.name}
                              </span>
                              <span style={{ fontSize: '0.68rem', color: '#64748b', fontWeight: 600, whiteSpace: 'nowrap', lineHeight: 1.3 }}>
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
                                lineHeight: 1.4,
                              }}
                            >
                              {dept.count} នាក់
                            </span>
                            <span style={{ fontSize: '0.68rem', color: '#94a3b8', fontWeight: 700, minWidth: '30px', textAlign: 'right', whiteSpace: 'nowrap', lineHeight: 1.4 }}>
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
                        width: '90px',
                      }}
                    >
                      <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', lineHeight: 1.1 }}>
                        {totalStaffCount}
                      </div>
                      <div className="kh-text" style={{ fontSize: '0.62rem', color: '#64748b', whiteSpace: 'nowrap', lineHeight: 1.3 }}>បុគ្គលិកសរុប</div>
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
                data-grid={{ x: 6, y: 6, w: 6, h: 3, minW: 4, minH: 3 }}
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
                  <div style={{ minWidth: 0, flex: 1, paddingRight: '6px' }}>
                    <h3 className="kh-text" style={{ margin: 0, fontSize: '0.94rem', color: '#0f172a', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '6px', whiteSpace: 'nowrap', lineHeight: 1.4 }}>
                      <span>📍</span>
                      <span>បុគ្គលិកតាមរាជធានី-ខេត្ត (Hometown Spread)</span>
                    </h3>
                    <span style={{ fontSize: '0.7rem', color: '#64748b', display: 'block', lineHeight: 1.4, paddingTop: '1px', whiteSpace: 'nowrap' }}>Hometown & Geographical Spread</span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                    {/* View Switcher Segmented Button */}
                    <div
                      style={{
                        display: 'inline-flex',
                        backgroundColor: '#f1f5f9',
                        padding: '2px',
                        borderRadius: '8px',
                        border: '1px solid #e2e8f0',
                        gap: '2px',
                        flexShrink: 0,
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
                          whiteSpace: 'nowrap',
                          flexShrink: 0,
                          lineHeight: 1.4,
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
                          whiteSpace: 'nowrap',
                          flexShrink: 0,
                          lineHeight: 1.4,
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
                        flexShrink: 0,
                        lineHeight: 1.4,
                      }}
                    >
                      ទីតាំង ➔
                    </Link>
                  </div>
                </div>

                {/* Metric Summary Ribbon */}
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '8px' }}>
                  <span style={{ fontSize: '0.67rem', fontWeight: 700, padding: '2px 7px', borderRadius: '5px', backgroundColor: '#fdf2f8', color: '#be185d', border: '1px solid #fbcfe8', whiteSpace: 'nowrap', lineHeight: 1.4 }}>
                    🏆 នាំមុខគេ៖ {topProvincesData[0]?.name || 'N/A'}
                  </span>
                  <span style={{ fontSize: '0.67rem', fontWeight: 700, padding: '2px 7px', borderRadius: '5px', backgroundColor: '#f0fdf4', color: '#15803d', border: '1px solid #bbf7d0', whiteSpace: 'nowrap', lineHeight: 1.4 }}>
                    🗺️ {provincesCount} រាជធានី-ខេត្ត
                  </span>
                  <span style={{ fontSize: '0.67rem', fontWeight: 700, padding: '2px 7px', borderRadius: '5px', backgroundColor: '#f1f5f9', color: '#334155', border: '1px solid #cbd5e1', whiteSpace: 'nowrap', lineHeight: 1.4 }}>
                    👥 {allEmployees.length} នាក់សរុប
                  </span>
                </div>

                {/* View 1: Colorful Province Leaderboard Progress Bars */}
                {hometownView === 'leaderboard' ? (
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '5px', overflowY: 'auto', paddingRight: '2px' }}>
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
                            <div className="kh-text" style={{ fontSize: '0.78rem', fontWeight: 700, color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', lineHeight: 1.35 }}>
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
                          <div style={{ display: 'flex', alignItems: 'center', gap: '5px', minWidth: '65px', justifyContent: 'flex-end', flexShrink: 0 }}>
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
                                lineHeight: 1.4,
                              }}
                            >
                              {item.count} នាក់
                            </span>
                            <span style={{ fontSize: '0.65rem', color: '#94a3b8', fontWeight: 700, minWidth: '26px', textAlign: 'right', whiteSpace: 'nowrap', lineHeight: 1.4 }}>
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
                          width: '90px',
                        }}
                      >
                        <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0f172a', lineHeight: 1.1 }}>
                          {allEmployees.length}
                        </div>
                        <div className="kh-text" style={{ fontSize: '0.6rem', color: '#64748b', marginTop: '2px', whiteSpace: 'nowrap', lineHeight: 1.3 }}>
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
                              <span className="kh-text" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '80px', color: '#334155', fontWeight: 600, lineHeight: 1.35 }}>
                                {item.name}
                              </span>
                            </div>
                            <span style={{ fontWeight: 700, color: color.text, fontSize: '0.7rem', whiteSpace: 'nowrap', lineHeight: 1.35 }}>
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

          {/* 8. UPCOMING CONTRACTS & BIRTHDAYS (2-in-1 Alerts Hub) */}
          {(() => {
            const contractAlertsCount = upcomingContracts.length;
            const birthdayAlertsCount = upcomingBirthdays.length;
            const urgentContracts = upcomingContracts.filter(c => c.daysRemaining <= 14);

            return (
              <div
                key="contract_alerts"
                data-grid={{ x: 0, y: 9, w: 12, h: 3, minW: 6, minH: 3 }}
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
                {/* Header with Switcher Tabs and Actions */}
                <div
                  className="card-drag-handle"
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '10px',
                    cursor: 'grab',
                    flexWrap: 'wrap',
                    gap: '8px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
                    <span style={{ fontSize: '1.15rem' }}>{contractView === 'contracts' ? '⏳' : '🎂'}</span>
                    <div>
                      <h3
                        className="kh-text"
                        style={{
                          margin: 0,
                          fontSize: '0.94rem',
                          color: '#0f172a',
                          fontWeight: 800,
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          whiteSpace: 'nowrap',
                          lineHeight: 1.4,
                        }}
                      >
                        {contractView === 'contracts'
                          ? 'កិច្ចសន្យា & សាកល្បងជិតផុតកំណត់ (Expiring Contracts)'
                          : 'ខួបកំណើតបុគ្គលិកក្នុងខែនេះ (Employee Birthdays)'}
                      </h3>
                      <span style={{ fontSize: '0.7rem', color: '#64748b', display: 'block', lineHeight: 1.4, whiteSpace: 'nowrap' }}>
                        {contractView === 'contracts'
                          ? 'តាមដានបុគ្គលិកសាកល្បង និងកិច្ចសន្យាការងារក្នុងរយៈពេល ៤៥ ថ្ងៃ'
                          : `អបអរសាទរខួបកំណើតបុគ្គលិកក្នុងខែនេះ (${upcomingBirthdays.length} នាក់)`}
                      </span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                    {/* View Switcher Segmented Button */}
                    <div
                      style={{
                        display: 'inline-flex',
                        backgroundColor: '#f1f5f9',
                        padding: '2px',
                        borderRadius: '8px',
                        border: '1px solid #e2e8f0',
                        gap: '2px',
                        flexShrink: 0,
                      }}
                    >
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setContractView('contracts');
                        }}
                        style={{
                          padding: '3px 10px',
                          fontSize: '0.72rem',
                          fontWeight: 700,
                          borderRadius: '6px',
                          border: 'none',
                          cursor: 'pointer',
                          backgroundColor: contractView === 'contracts' ? '#ffffff' : 'transparent',
                          color: contractView === 'contracts' ? '#ea580c' : '#64748b',
                          boxShadow: contractView === 'contracts' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                          transition: 'all 0.15s ease',
                          whiteSpace: 'nowrap',
                          flexShrink: 0,
                          lineHeight: 1.4,
                          display: 'flex',
                          alignItems: 'center',
                          gap: '5px',
                        }}
                      >
                        <span>⏳ ផុតកិច្ចសន្យា/សាកល្បង</span>
                        {contractAlertsCount > 0 && (
                          <span
                            style={{
                              backgroundColor: urgentContracts.length > 0 ? '#ef4444' : '#f97316',
                              color: '#ffffff',
                              fontSize: '0.62rem',
                              padding: '0 5px',
                              borderRadius: '999px',
                              fontWeight: 800,
                              lineHeight: 1.3,
                            }}
                          >
                            {contractAlertsCount}
                          </span>
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setContractView('birthdays');
                        }}
                        style={{
                          padding: '3px 10px',
                          fontSize: '0.72rem',
                          fontWeight: 700,
                          borderRadius: '6px',
                          border: 'none',
                          cursor: 'pointer',
                          backgroundColor: contractView === 'birthdays' ? '#ffffff' : 'transparent',
                          color: contractView === 'birthdays' ? '#db2777' : '#64748b',
                          boxShadow: contractView === 'birthdays' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                          transition: 'all 0.15s ease',
                          whiteSpace: 'nowrap',
                          flexShrink: 0,
                          lineHeight: 1.4,
                          display: 'flex',
                          alignItems: 'center',
                          gap: '5px',
                        }}
                      >
                        <span>🎂 ថ្ងៃកំណើតខែនេះ</span>
                        {birthdayAlertsCount > 0 && (
                          <span
                            style={{
                              backgroundColor: '#ec4899',
                              color: '#ffffff',
                              fontSize: '0.62rem',
                              padding: '0 5px',
                              borderRadius: '999px',
                              fontWeight: 800,
                              lineHeight: 1.3,
                            }}
                          >
                            {birthdayAlertsCount}
                          </span>
                        )}
                      </button>
                    </div>

                    <Link
                      href="/dashboard/employees"
                      style={{
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        color: contractView === 'contracts' ? '#ea580c' : '#ec4899',
                        textDecoration: 'none',
                        backgroundColor: contractView === 'contracts' ? '#fff7ed' : '#fdf2f8',
                        padding: '3px 9px',
                        borderRadius: '6px',
                        border: `1px solid ${contractView === 'contracts' ? '#ffedd5' : '#fbcfe8'}`,
                        whiteSpace: 'nowrap',
                        flexShrink: 0,
                        lineHeight: 1.4,
                      }}
                    >
                      គ្រប់គ្រងបុគ្គលិក ➔
                    </Link>
                  </div>
                </div>

                {/* Content Area */}
                {contractView === 'contracts' ? (
                  /* VIEW 1: CONTRACTS & PROBATION ALERTS */
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
                    {/* Mini Alert Banner / KPI */}
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        backgroundColor: urgentContracts.length > 0 ? '#fff7ed' : '#f8fafc',
                        border: `1px solid ${urgentContracts.length > 0 ? '#fed7aa' : '#e2e8f0'}`,
                        borderRadius: '8px',
                        padding: '6px 12px',
                        marginBottom: '8px',
                        fontSize: '0.75rem',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span>{urgentContracts.length > 0 ? '⚠️' : '✅'}</span>
                        <span style={{ color: urgentContracts.length > 0 ? '#c2410c' : '#475569', fontWeight: 600 }}>
                          {urgentContracts.length > 0
                            ? `មាន ${urgentContracts.length} នាក់ត្រូវពិនិត្យជាបន្ទាន់ (សល់ ≤ ១៤ ថ្ងៃ ឬហួសកំណត់)`
                            : 'កិច្ចសន្យាការងារដំណើរការប្រក្រតី គ្មានបញ្ហាប្រញាប់បន្ទាន់'}
                        </span>
                      </div>
                      <span style={{ color: '#64748b', fontSize: '0.7rem' }}>
                        សរុបជិតផុតកំណត់: <strong>{upcomingContracts.length}</strong> នាក់
                      </span>
                    </div>

                    {/* Cards Grid / List */}
                    {upcomingContracts.length === 0 ? (
                      <div
                        style={{
                          flex: 1,
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          justifyContent: 'center',
                          padding: '20px',
                          color: '#94a3b8',
                          textAlign: 'center',
                        }}
                      >
                        <div style={{ fontSize: '1.8rem', marginBottom: '6px' }}>🎉</div>
                        <div className="kh-text" style={{ fontSize: '0.85rem', fontWeight: 700, color: '#475569' }}>
                          ពុំមានកិច្ចសន្យា ឬសាកល្បងជិតផុតកំណត់ក្នុងរយៈពេល ៤៥ ថ្ងៃខាងមុខទេ
                        </div>
                        <div style={{ fontSize: '0.72rem', color: '#94a3b8', marginTop: '2px' }}>
                          កិច្ចសន្យាបុគ្គលិកទាំងអស់ស្ថិតក្នុងស្ថានភាពសុពលភាព
                        </div>
                      </div>
                    ) : (
                      <div
                        style={{
                          flex: 1,
                          overflowY: 'auto',
                          display: 'grid',
                          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                          gap: '8px',
                          paddingRight: '4px',
                          alignContent: 'start',
                        }}
                      >
                        {upcomingContracts.map((item) => {
                          const isOverdue = item.daysRemaining < 0;
                          const isCritical = item.daysRemaining <= 7;
                          const isWarning = item.daysRemaining <= 14;

                          const statusBg = isOverdue ? '#fee2e2' : isCritical ? '#ffedd5' : isWarning ? '#fef3c7' : '#f0f9ff';
                          const statusBorder = isOverdue ? '#fca5a5' : isCritical ? '#fdba74' : isWarning ? '#fde68a' : '#bae6fd';
                          const statusText = isOverdue ? '#b91c1c' : isCritical ? '#c2410c' : isWarning ? '#b45309' : '#0369a1';
                          const dayBadge = isOverdue
                            ? `ហួស ${Math.abs(item.daysRemaining)} ថ្ងៃ`
                            : item.daysRemaining === 0
                            ? 'ផុតកំណត់ថ្ងៃនេះ'
                            : `សល់ ${item.daysRemaining} ថ្ងៃ`;

                          return (
                            <div
                              key={item.id}
                              style={{
                                backgroundColor: '#ffffff',
                                border: `1px solid ${statusBorder}`,
                                borderLeft: `4px solid ${statusText}`,
                                borderRadius: '10px',
                                padding: '8px 10px',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '4px',
                                transition: 'all 0.15s ease',
                                boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
                              }}
                            >
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '6px' }}>
                                <div style={{ minWidth: 0, flex: 1 }}>
                                  <div
                                    className="kh-text"
                                    style={{
                                      fontSize: '0.8rem',
                                      fontWeight: 700,
                                      color: '#0f172a',
                                      overflow: 'hidden',
                                      textOverflow: 'ellipsis',
                                      whiteSpace: 'nowrap',
                                      lineHeight: 1.35,
                                    }}
                                  >
                                    {item.name}
                                  </div>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.68rem', color: '#64748b', marginTop: '1px' }}>
                                    <span style={{ fontFamily: 'monospace', fontWeight: 600, color: '#0284c7' }}>
                                      ID: {item.empId}
                                    </span>
                                    <span>•</span>
                                    <span className="kh-text" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                      {item.department}
                                    </span>
                                  </div>
                                </div>

                                <span
                                  style={{
                                    fontSize: '0.68rem',
                                    fontWeight: 800,
                                    color: statusText,
                                    backgroundColor: statusBg,
                                    border: `1px solid ${statusBorder}`,
                                    padding: '2px 7px',
                                    borderRadius: '6px',
                                    whiteSpace: 'nowrap',
                                    flexShrink: 0,
                                    lineHeight: 1.35,
                                  }}
                                >
                                  {dayBadge}
                                </span>
                              </div>

                              <div
                                style={{
                                  display: 'flex',
                                  justifyContent: 'space-between',
                                  alignItems: 'center',
                                  fontSize: '0.68rem',
                                  borderTop: '1px dashed #f1f5f9',
                                  paddingTop: '4px',
                                  marginTop: '2px',
                                }}
                              >
                                <span
                                  className="kh-text"
                                  style={{
                                    color: '#475569',
                                    fontWeight: 600,
                                    backgroundColor: '#f1f5f9',
                                    padding: '1px 6px',
                                    borderRadius: '4px',
                                    whiteSpace: 'nowrap',
                                  }}
                                >
                                  📋 {item.typeKh}
                                </span>
                                <span style={{ color: '#64748b', fontSize: '0.66rem', fontFamily: 'monospace' }}>
                                  ផុតកំណត់: {item.expiryDate.toISOString().slice(0, 10)}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                ) : (
                  /* VIEW 2: EMPLOYEE BIRTHDAYS THIS MONTH */
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
                    {/* Birthday Ribbon */}
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        backgroundColor: '#fdf2f8',
                        border: '1px solid #fbcfe8',
                        borderRadius: '8px',
                        padding: '6px 12px',
                        marginBottom: '8px',
                        fontSize: '0.75rem',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span>🎂</span>
                        <span style={{ color: '#be185d', fontWeight: 600 }}>
                          ខែនេះមានបុគ្គលិកសរុប {upcomingBirthdays.length} នាក់ប្រារព្ធពិធីខួបកំណើត!
                        </span>
                      </div>
                      <span style={{ color: '#db2777', fontWeight: 700, fontSize: '0.7rem' }}>
                        🎉 Happy Birthday!
                      </span>
                    </div>

                    {upcomingBirthdays.length === 0 ? (
                      <div
                        style={{
                          flex: 1,
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          justifyContent: 'center',
                          padding: '20px',
                          color: '#94a3b8',
                          textAlign: 'center',
                        }}
                      >
                        <div style={{ fontSize: '1.8rem', marginBottom: '6px' }}>🎈</div>
                        <div className="kh-text" style={{ fontSize: '0.85rem', fontWeight: 700, color: '#475569' }}>
                          គ្មានបុគ្គលិកមានថ្ងៃកំណើតក្នុងខែនេះទេ
                        </div>
                      </div>
                    ) : (
                      <div
                        style={{
                          flex: 1,
                          overflowY: 'auto',
                          display: 'grid',
                          gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
                          gap: '8px',
                          paddingRight: '4px',
                          alignContent: 'start',
                        }}
                      >
                        {upcomingBirthdays.map((item) => {
                          return (
                            <div
                              key={item.id}
                              style={{
                                backgroundColor: item.isToday ? '#fdf2f8' : '#ffffff',
                                border: `1px solid ${item.isToday ? '#f472b6' : '#e2e8f0'}`,
                                borderLeft: `4px solid ${item.isToday ? '#ec4899' : '#8b5cf6'}`,
                                borderRadius: '10px',
                                padding: '8px 10px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                gap: '8px',
                                boxShadow: item.isToday ? '0 2px 8px rgba(236,72,153,0.15)' : '0 1px 3px rgba(0,0,0,0.03)',
                              }}
                            >
                              <div style={{ minWidth: 0, flex: 1 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                                  <span
                                    className="kh-text"
                                    style={{
                                      fontSize: '0.8rem',
                                      fontWeight: 700,
                                      color: '#0f172a',
                                      overflow: 'hidden',
                                      textOverflow: 'ellipsis',
                                      whiteSpace: 'nowrap',
                                      lineHeight: 1.35,
                                    }}
                                  >
                                    {item.name}
                                  </span>
                                  {item.isToday && (
                                    <span style={{ fontSize: '0.62rem', backgroundColor: '#ec4899', color: '#fff', padding: '1px 5px', borderRadius: '4px', fontWeight: 800 }}>
                                      ថ្ងៃនេះ!
                                    </span>
                                  )}
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.68rem', color: '#64748b', marginTop: '2px' }}>
                                  <span style={{ fontFamily: 'monospace', fontWeight: 600, color: '#0284c7' }}>
                                    ID: {item.empId}
                                  </span>
                                  <span>•</span>
                                  <span className="kh-text" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                    {item.department}
                                  </span>
                                </div>
                              </div>

                              <div
                                style={{
                                  textAlign: 'right',
                                  flexShrink: 0,
                                  display: 'flex',
                                  flexDirection: 'column',
                                  alignItems: 'flex-end',
                                }}
                              >
                                <span
                                  style={{
                                    fontSize: '0.78rem',
                                    fontWeight: 800,
                                    color: item.isToday ? '#db2777' : '#6d28d9',
                                    fontFamily: 'monospace',
                                  }}
                                >
                                  🎂 {item.birthDate}
                                </span>
                                <span style={{ fontSize: '0.64rem', color: item.daysUntil === 0 ? '#db2777' : item.daysUntil > 0 ? '#10b981' : '#94a3b8' }}>
                                  {item.daysUntil === 0
                                    ? 'រីករាយថ្ងៃកំណើត!'
                                    : item.daysUntil > 0
                                    ? `សល់ ${item.daysUntil} ថ្ងៃទៀត`
                                    : 'កន្លងផុតហើយ'}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })()}

          {/* 9. 12-MONTH EMPLOYEE HEADCOUNT & GROWTH TRENDS (ប្រៀបធៀបបុគ្គលិកប្រចាំឆ្នាំ ១២ខែ) */}
          {(() => {
            const data = (annualEmployeeData && annualEmployeeData.length === 12)
              ? annualEmployeeData
              : [];
            
            const totalHiresYear = data.reduce((sum, d) => sum + (d.newHiresCount || 0), 0);
            const totalExitsYear = data.reduce((sum, d) => sum + (d.exitsCount || 0), 0);
            const netGrowthYear = totalHiresYear - totalExitsYear;
            const currentHeadcount = allEmployees.length;

            const allHiresList = data.flatMap(d => d.hiresList || []);

            return (
              <div
                key="annual_employee_trends"
                data-grid={{ x: 0, y: 12, w: 6, h: 4, minW: 4, minH: 3 }}
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
                {/* Header */}
                <div
                  className="card-drag-handle"
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '8px',
                    cursor: 'grab',
                    flexWrap: 'wrap',
                    gap: '6px',
                  }}
                >
                  <div style={{ minWidth: 0, flex: 1, paddingRight: '6px' }}>
                    <h3
                      className="kh-text"
                      style={{
                        margin: 0,
                        fontSize: '0.92rem',
                        color: '#0f172a',
                        fontWeight: 800,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        whiteSpace: 'nowrap',
                        lineHeight: 1.4,
                      }}
                    >
                      <span>👥</span>
                      <span>ប្រៀបធៀបបុគ្គលិក ១២ ខែ (Employee Trends)</span>
                    </h3>
                    <span style={{ fontSize: '0.68rem', color: '#64748b', display: 'block', lineHeight: 1.4, whiteSpace: 'nowrap' }}>
                      តាមដានចំនួនបុគ្គលិកសរុប ចូលថ្មី និងចាកចេញ ឆ្នាំ {filterYear}
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '5px', flexShrink: 0 }}>
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
                          setAnnualEmpView('chart');
                        }}
                        style={{
                          padding: '3px 8px',
                          fontSize: '0.7rem',
                          fontWeight: 700,
                          borderRadius: '6px',
                          border: 'none',
                          cursor: 'pointer',
                          backgroundColor: annualEmpView === 'chart' ? '#ffffff' : 'transparent',
                          color: annualEmpView === 'chart' ? '#2563eb' : '#64748b',
                          boxShadow: annualEmpView === 'chart' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                          transition: 'all 0.15s ease',
                          whiteSpace: 'nowrap',
                          lineHeight: 1.4,
                        }}
                      >
                        📈 ក្រាប
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setAnnualEmpView('table');
                        }}
                        style={{
                          padding: '3px 8px',
                          fontSize: '0.7rem',
                          fontWeight: 700,
                          borderRadius: '6px',
                          border: 'none',
                          cursor: 'pointer',
                          backgroundColor: annualEmpView === 'table' ? '#ffffff' : 'transparent',
                          color: annualEmpView === 'table' ? '#2563eb' : '#64748b',
                          boxShadow: annualEmpView === 'table' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                          transition: 'all 0.15s ease',
                          whiteSpace: 'nowrap',
                          lineHeight: 1.4,
                        }}
                      >
                        📋 តារាង
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setAnnualEmpView('hires');
                        }}
                        style={{
                          padding: '3px 8px',
                          fontSize: '0.7rem',
                          fontWeight: 700,
                          borderRadius: '6px',
                          border: 'none',
                          cursor: 'pointer',
                          backgroundColor: annualEmpView === 'hires' ? '#ffffff' : 'transparent',
                          color: annualEmpView === 'hires' ? '#16a34a' : '#64748b',
                          boxShadow: annualEmpView === 'hires' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                          transition: 'all 0.15s ease',
                          whiteSpace: 'nowrap',
                          lineHeight: 1.4,
                        }}
                      >
                        🌟 ចូលថ្មី ({totalHiresYear})
                      </button>
                    </div>

                    <Link
                      href="/dashboard/employees"
                      style={{
                        fontSize: '0.7rem',
                        fontWeight: 700,
                        color: '#2563eb',
                        textDecoration: 'none',
                        backgroundColor: '#eff6ff',
                        padding: '3px 8px',
                        borderRadius: '6px',
                        border: '1px solid #bfdbfe',
                        whiteSpace: 'nowrap',
                        lineHeight: 1.4,
                      }}
                    >
                      ចូលមើល ➔
                    </Link>
                  </div>
                </div>

                {/* KPI Ribbon */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    backgroundColor: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    padding: '5px 10px',
                    marginBottom: '8px',
                    fontSize: '0.7rem',
                    flexWrap: 'wrap',
                    gap: '4px',
                  }}
                >
                  <span style={{ color: '#475569', lineHeight: 1.35 }}>
                    សរុបបច្ចុប្បន្ន: <strong style={{ color: '#0f172a' }}>{currentHeadcount}</strong> នាក់
                  </span>
                  <span style={{ color: '#16a34a', fontWeight: 700, lineHeight: 1.35 }}>
                    🟢 ចូលថ្មី: +{totalHiresYear} នាក់
                  </span>
                  <span style={{ color: '#dc2626', fontWeight: 700, lineHeight: 1.35 }}>
                    🔴 ចាកចេញ: -{totalExitsYear} នាក់
                  </span>
                  <span
                    style={{
                      padding: '1px 6px',
                      borderRadius: '4px',
                      backgroundColor: netGrowthYear >= 0 ? '#dcfce7' : '#fee2e2',
                      color: netGrowthYear >= 0 ? '#15803d' : '#b91c1c',
                      fontWeight: 800,
                      lineHeight: 1.35,
                    }}
                  >
                    កំណើនសុទ្ធ: {netGrowthYear >= 0 ? `+${netGrowthYear}` : netGrowthYear} នាក់
                  </span>
                </div>

                {/* Content View */}
                {annualEmpView === 'chart' ? (
                  <div style={{ flex: 1, minHeight: 0, position: 'relative' }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <ComposedChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis
                          dataKey="monthKh"
                          tick={{ fill: '#64748b', fontSize: 10 }}
                          axisLine={{ stroke: '#cbd5e1' }}
                          tickLine={false}
                        />
                        <YAxis
                          tick={{ fill: '#64748b', fontSize: 10 }}
                          axisLine={false}
                          tickLine={false}
                          allowDecimals={false}
                        />
                        <Tooltip
                          content={({ active, payload, label }) => {
                            if (!active || !payload || !payload.length) return null;
                            const item = payload[0].payload;
                            return (
                              <div
                                style={{
                                  backgroundColor: '#ffffff',
                                  padding: '8px 12px',
                                  borderRadius: '8px',
                                  border: '1px solid #e2e8f0',
                                  boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                                  fontSize: '0.74rem',
                                  lineHeight: 1.45,
                                }}
                              >
                                <div style={{ fontWeight: 800, color: '#0f172a', marginBottom: '4px' }}>
                                  📅 ខែ {item.label} ឆ្នាំ {filterYear}
                                </div>
                                <div style={{ color: '#2563eb', fontWeight: 700 }}>
                                  👥 បុគ្គលិកសកម្ម: {item.totalHeadcount} នាក់ (ស្រី {item.femaleCount} / ប្រុស {item.maleCount})
                                </div>
                                <div style={{ color: '#16a34a' }}>
                                  🟢 ចូលថ្មី: +{item.newHiresCount} នាក់
                                </div>
                                <div style={{ color: '#dc2626' }}>
                                  🔴 ចាកចេញ: -{item.exitsCount} នាក់
                                </div>
                                <div style={{ color: item.netChange >= 0 ? '#15803d' : '#b91c1c', fontWeight: 700, borderTop: '1px dashed #e2e8f0', paddingTop: '3px', marginTop: '3px' }}>
                                  🚀 កំណើនសុទ្ធ: {item.netChange >= 0 ? `+${item.netChange}` : item.netChange} នាក់
                                </div>
                              </div>
                            );
                          }}
                        />
                        <Bar dataKey="newHiresCount" name="ចូលថ្មី" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={14} />
                        <Bar dataKey="exitsCount" name="ចាកចេញ" fill="#f43f5e" radius={[4, 4, 0, 0]} maxBarSize={14} />
                        <Line type="monotone" dataKey="totalHeadcount" name="សរុប" stroke="#4f46e5" strokeWidth={2.5} dot={{ r: 3, fill: '#4f46e5' }} />
                      </ComposedChart>
                    </ResponsiveContainer>
                  </div>
                ) : annualEmpView === 'table' ? (
                  <div style={{ flex: 1, minHeight: 0, overflowY: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.72rem', textAlign: 'left' }}>
                      <thead>
                        <tr style={{ backgroundColor: '#f8fafc', color: '#475569', borderBottom: '1px solid #e2e8f0' }}>
                          <th style={{ padding: '5px 8px', fontWeight: 700 }}>ខែ</th>
                          <th style={{ padding: '5px 8px', fontWeight: 700, textAlign: 'center' }}>សរុប</th>
                          <th style={{ padding: '5px 8px', fontWeight: 700, textAlign: 'center' }}>ស្រី/ប្រុស</th>
                          <th style={{ padding: '5px 8px', fontWeight: 700, textAlign: 'center' }}>ចូលថ្មី</th>
                          <th style={{ padding: '5px 8px', fontWeight: 700, textAlign: 'center' }}>ចាកចេញ</th>
                          <th style={{ padding: '5px 8px', fontWeight: 700, textAlign: 'center' }}>កំណើនសុទ្ធ</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.map((item) => (
                          <tr key={item.month} style={{ borderBottom: '1px solid #f1f5f9' }}>
                            <td style={{ padding: '5px 8px', fontWeight: 700, color: '#1e293b' }}>
                              {item.monthKh} ({item.monthEn})
                            </td>
                            <td style={{ padding: '5px 8px', textAlign: 'center', fontWeight: 800, color: '#2563eb' }}>
                              {item.totalHeadcount}
                            </td>
                            <td style={{ padding: '5px 8px', textAlign: 'center', color: '#64748b' }}>
                              {item.femaleCount}/{item.maleCount}
                            </td>
                            <td style={{ padding: '5px 8px', textAlign: 'center' }}>
                              <span style={{ backgroundColor: item.newHiresCount > 0 ? '#dcfce7' : '#f1f5f9', color: item.newHiresCount > 0 ? '#15803d' : '#94a3b8', padding: '1px 6px', borderRadius: '4px', fontWeight: 700 }}>
                                +{item.newHiresCount}
                              </span>
                            </td>
                            <td style={{ padding: '5px 8px', textAlign: 'center' }}>
                              <span style={{ backgroundColor: item.exitsCount > 0 ? '#fee2e2' : '#f1f5f9', color: item.exitsCount > 0 ? '#b91c1c' : '#94a3b8', padding: '1px 6px', borderRadius: '4px', fontWeight: 700 }}>
                                -{item.exitsCount}
                              </span>
                            </td>
                            <td style={{ padding: '5px 8px', textAlign: 'center' }}>
                              <span style={{ color: item.netChange > 0 ? '#16a34a' : item.netChange < 0 ? '#dc2626' : '#64748b', fontWeight: 800 }}>
                                {item.netChange > 0 ? `+${item.netChange}` : item.netChange}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  /* Hires directory view */
                  <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {allHiresList.length === 0 ? (
                      <div style={{ textAlign: 'center', padding: '24px', color: '#94a3b8' }}>
                        ពុំមានបុគ្គលិកចូលថ្មីក្នុងឆ្នាំ {filterYear} នេះទេ
                      </div>
                    ) : (
                      allHiresList.map((emp) => (
                        <div
                          key={emp.id}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            backgroundColor: '#f8fafc',
                            border: '1px solid #e2e8f0',
                            borderRadius: '8px',
                            padding: '6px 10px',
                            fontSize: '0.72rem',
                          }}
                        >
                          <div style={{ minWidth: 0 }}>
                            <div style={{ fontWeight: 700, color: '#0f172a' }}>{emp.name}</div>
                            <div style={{ color: '#64748b', fontSize: '0.66rem' }}>
                              ID: {emp.empId} • {emp.dept} ({emp.position})
                            </div>
                          </div>
                          <span style={{ backgroundColor: '#dcfce7', color: '#15803d', padding: '2px 7px', borderRadius: '4px', fontWeight: 700, fontSize: '0.66rem', whiteSpace: 'nowrap' }}>
                            📅 {emp.hireDate}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            );
          })()}

          {/* 10. 12-MONTH PAYROLL TRENDS & MOM GROWTH (តាមដាន Payroll ប្រចាំឆ្នាំ ១២ខែ) */}
          {(() => {
            const data = (annualPayrollData && annualPayrollData.length === 12)
              ? annualPayrollData
              : [];

            const totalAnnualNet = data.reduce((sum, d) => sum + (d.netSalary || 0), 0);
            const totalAnnualGross = data.reduce((sum, d) => sum + (d.grossSalary || 0), 0);
            const activeMonths = data.filter(d => d.hasData && d.netSalary > 0);
            const activeCount = activeMonths.length || 1;
            const avgMonthlyNet = Math.round(totalAnnualNet / activeCount);

            // Find peak growth month
            const peakMonth = data.reduce((max, d) => (d.netSalary > max.netSalary ? d : max), data[0] || { monthKh: '---', netSalary: 0, momDiffPercent: 0 });

            return (
              <div
                key="annual_payroll_trends"
                data-grid={{ x: 6, y: 12, w: 6, h: 4, minW: 4, minH: 3 }}
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
                {/* Header */}
                <div
                  className="card-drag-handle"
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '8px',
                    cursor: 'grab',
                    flexWrap: 'wrap',
                    gap: '6px',
                  }}
                >
                  <div style={{ minWidth: 0, flex: 1, paddingRight: '6px' }}>
                    <h3
                      className="kh-text"
                      style={{
                        margin: 0,
                        fontSize: '0.92rem',
                        color: '#0f172a',
                        fontWeight: 800,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        whiteSpace: 'nowrap',
                        lineHeight: 1.4,
                      }}
                    >
                      <span>💳</span>
                      <span>តាមដានប្រាក់បៀវត្ស ១២ ខែ (Payroll Growth)</span>
                    </h3>
                    <span style={{ fontSize: '0.68rem', color: '#64748b', display: 'block', lineHeight: 1.4, whiteSpace: 'nowrap' }}>
                      តាមដានចំណាយប្រាក់ខែ និងអត្រាកំណើនធៀបខែមុន (MoM) ឆ្នាំ {filterYear}
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '5px', flexShrink: 0 }}>
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
                          setAnnualPayrollView('chart');
                        }}
                        style={{
                          padding: '3px 8px',
                          fontSize: '0.7rem',
                          fontWeight: 700,
                          borderRadius: '6px',
                          border: 'none',
                          cursor: 'pointer',
                          backgroundColor: annualPayrollView === 'chart' ? '#ffffff' : 'transparent',
                          color: annualPayrollView === 'chart' ? '#4f46e5' : '#64748b',
                          boxShadow: annualPayrollView === 'chart' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                          transition: 'all 0.15s ease',
                          whiteSpace: 'nowrap',
                          lineHeight: 1.4,
                        }}
                      >
                        📈 ក្រាបកំណើន
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setAnnualPayrollView('table');
                        }}
                        style={{
                          padding: '3px 8px',
                          fontSize: '0.7rem',
                          fontWeight: 700,
                          borderRadius: '6px',
                          border: 'none',
                          cursor: 'pointer',
                          backgroundColor: annualPayrollView === 'table' ? '#ffffff' : 'transparent',
                          color: annualPayrollView === 'table' ? '#4f46e5' : '#64748b',
                          boxShadow: annualPayrollView === 'table' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                          transition: 'all 0.15s ease',
                          whiteSpace: 'nowrap',
                          lineHeight: 1.4,
                        }}
                      >
                        📋 តារាងលម្អិត
                      </button>
                    </div>

                    <Link
                      href="/dashboard/payroll"
                      style={{
                        fontSize: '0.7rem',
                        fontWeight: 700,
                        color: '#4f46e5',
                        textDecoration: 'none',
                        backgroundColor: '#eef2ff',
                        padding: '3px 8px',
                        borderRadius: '6px',
                        border: '1px solid #c7d2fe',
                        whiteSpace: 'nowrap',
                        lineHeight: 1.4,
                      }}
                    >
                      បើកប្រាក់ខែ ➔
                    </Link>
                  </div>
                </div>

                {/* KPI Ribbon */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    backgroundColor: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    padding: '5px 10px',
                    marginBottom: '8px',
                    fontSize: '0.7rem',
                    flexWrap: 'wrap',
                    gap: '4px',
                  }}
                >
                  <span style={{ color: '#475569', lineHeight: 1.35 }}>
                    សរុប ១២ ខែ: <strong style={{ color: '#4f46e5' }}>${totalAnnualNet.toLocaleString()}</strong>
                  </span>
                  <span style={{ color: '#0f172a', fontWeight: 600, lineHeight: 1.35 }}>
                    មធ្យម/ខែ: <strong>${avgMonthlyNet.toLocaleString()}</strong>
                  </span>
                  <span style={{ color: '#0284c7', fontWeight: 600, lineHeight: 1.35 }}>
                    ខែខ្ពស់បំផុត: <strong>{peakMonth?.monthKh} (${peakMonth?.netSalary.toLocaleString()})</strong>
                  </span>
                  <span
                    style={{
                      padding: '1px 6px',
                      borderRadius: '4px',
                      backgroundColor: '#eff6ff',
                      color: '#2563eb',
                      fontWeight: 800,
                      lineHeight: 1.35,
                    }}
                  >
                    Gross សរុប: ${totalAnnualGross.toLocaleString()}
                  </span>
                </div>

                {/* Content View */}
                {annualPayrollView === 'chart' ? (
                  <div style={{ flex: 1, minHeight: 0, position: 'relative' }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                        <defs>
                          <linearGradient id="grossSalaryGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#818cf8" stopOpacity={0.4} />
                            <stop offset="95%" stopColor="#818cf8" stopOpacity={0.0} />
                          </linearGradient>
                          <linearGradient id="netSalaryGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.5} />
                            <stop offset="95%" stopColor="#4f46e5" stopOpacity={0.05} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis
                          dataKey="monthKh"
                          tick={{ fill: '#64748b', fontSize: 10 }}
                          axisLine={{ stroke: '#cbd5e1' }}
                          tickLine={false}
                        />
                        <YAxis
                          tick={{ fill: '#64748b', fontSize: 10 }}
                          axisLine={false}
                          tickLine={false}
                          tickFormatter={(v) => `$${v >= 1000 ? `${(v/1000).toFixed(1)}k` : v}`}
                        />
                        <Tooltip
                          content={({ active, payload, label }) => {
                            if (!active || !payload || !payload.length) return null;
                            const item = payload[0].payload;
                            const mom = item.momDiffPercent || 0;
                            return (
                              <div
                                style={{
                                  backgroundColor: '#ffffff',
                                  padding: '8px 12px',
                                  borderRadius: '8px',
                                  border: '1px solid #e2e8f0',
                                  boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                                  fontSize: '0.74rem',
                                  lineHeight: 1.45,
                                }}
                              >
                                <div style={{ fontWeight: 800, color: '#0f172a', marginBottom: '4px' }}>
                                  📅 ខែ {item.label} ឆ្នាំ {filterYear}
                                </div>
                                <div style={{ color: '#4f46e5', fontWeight: 800 }}>
                                  💵 បើកជាក់ស្តែង (Net): ${item.netSalary.toLocaleString()}
                                </div>
                                <div style={{ color: '#6366f1' }}>
                                  📋 ប្រាក់បៀវត្សសរុប (Gross): ${item.grossSalary.toLocaleString()}
                                </div>
                                <div style={{ color: '#16a34a', fontSize: '0.7rem' }}>
                                  🎁 ឧបត្ថម្ភ & OT: ${item.allowances.toLocaleString()}
                                </div>
                                <div style={{ color: '#ef4444', fontSize: '0.7rem' }}>
                                  ✂️ ការកាត់កង: ${item.deductions.toLocaleString()}
                                </div>
                                <div
                                  style={{
                                    borderTop: '1px dashed #e2e8f0',
                                    paddingTop: '3px',
                                    marginTop: '3px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                  }}
                                >
                                  <span style={{ color: '#64748b' }}>កំណើនធៀបខែមុន:</span>
                                  <span
                                    style={{
                                      fontWeight: 800,
                                      color: mom > 0 ? '#16a34a' : mom < 0 ? '#dc2626' : '#64748b',
                                    }}
                                  >
                                    {mom > 0 ? `+${mom}% ↗` : mom < 0 ? `${mom}% ↘` : '0% —'}
                                  </span>
                                </div>
                              </div>
                            );
                          }}
                        />
                        <Area
                          type="monotone"
                          dataKey="grossSalary"
                          name="Gross Salary"
                          stroke="#818cf8"
                          strokeWidth={2}
                          fillOpacity={1}
                          fill="url(#grossSalaryGrad)"
                        />
                        <Area
                          type="monotone"
                          dataKey="netSalary"
                          name="Net Salary"
                          stroke="#4f46e5"
                          strokeWidth={2.5}
                          fillOpacity={1}
                          fill="url(#netSalaryGrad)"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div style={{ flex: 1, minHeight: 0, overflowY: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.72rem', textAlign: 'left' }}>
                      <thead>
                        <tr style={{ backgroundColor: '#f8fafc', color: '#475569', borderBottom: '1px solid #e2e8f0' }}>
                          <th style={{ padding: '5px 8px', fontWeight: 700 }}>ខែ</th>
                          <th style={{ padding: '5px 8px', fontWeight: 700, textAlign: 'right' }}>Gross ($)</th>
                          <th style={{ padding: '5px 8px', fontWeight: 700, textAlign: 'right' }}>Net ($)</th>
                          <th style={{ padding: '5px 8px', fontWeight: 700, textAlign: 'right' }}>ឧបត្ថម្ភ/OT</th>
                          <th style={{ padding: '5px 8px', fontWeight: 700, textAlign: 'right' }}>កាត់កង</th>
                          <th style={{ padding: '5px 8px', fontWeight: 700, textAlign: 'center' }}>កំណើន (MoM)</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.map((item) => {
                          const mom = item.momDiffPercent || 0;
                          return (
                            <tr key={item.month} style={{ borderBottom: '1px solid #f1f5f9' }}>
                              <td style={{ padding: '5px 8px', fontWeight: 700, color: '#1e293b' }}>
                                {item.monthKh} ({item.monthEn})
                              </td>
                              <td style={{ padding: '5px 8px', textAlign: 'right', color: '#6366f1' }}>
                                ${item.grossSalary.toLocaleString()}
                              </td>
                              <td style={{ padding: '5px 8px', textAlign: 'right', fontWeight: 800, color: '#4f46e5' }}>
                                ${item.netSalary.toLocaleString()}
                              </td>
                              <td style={{ padding: '5px 8px', textAlign: 'right', color: '#16a34a' }}>
                                ${item.allowances.toLocaleString()}
                              </td>
                              <td style={{ padding: '5px 8px', textAlign: 'right', color: '#dc2626' }}>
                                ${item.deductions.toLocaleString()}
                              </td>
                              <td style={{ padding: '5px 8px', textAlign: 'center' }}>
                                <span
                                  style={{
                                    padding: '1px 6px',
                                    borderRadius: '4px',
                                    fontSize: '0.66rem',
                                    fontWeight: 800,
                                    backgroundColor: mom > 0 ? '#dcfce7' : mom < 0 ? '#fee2e2' : '#f1f5f9',
                                    color: mom > 0 ? '#15803d' : mom < 0 ? '#b91c1c' : '#64748b',
                                  }}
                                >
                                  {mom > 0 ? `+${mom}% ↗` : mom < 0 ? `${mom}% ↘` : '0% —'}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
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
