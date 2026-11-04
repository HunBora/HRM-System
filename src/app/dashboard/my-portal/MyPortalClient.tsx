'use client';

import React, { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Swal from 'sweetalert2';
import MobileClockInModal from '@/components/Attendance/MobileClockInModal';

interface EmployeeSimple {
  id: string;
  employeeId: string;
  firstNameEn: string;
  lastNameEn: string;
  firstNameKh?: string | null;
  lastNameKh?: string | null;
  position: string;
  department: string;
  line?: string | null;
  shift?: string | null;
  phone?: string | null;
  photoUrl?: string | null;
  basicSalary?: number | null;
  annualLeaveDays?: number | null;
  hireDate?: string | null;
}

interface PayrollRecord {
  id: string;
  month: number;
  year: number;
  basicSalary: number;
  otPay: number;
  otHours?: number;
  otWage?: number;
  sunOtHours?: number;
  sunOtWage?: number;
  nightOtHours?: number;
  nightOtWage?: number;
  totalOtHours?: number;
  bonus: number;
  allowances: number;
  deductions: number;
  tax: number;
  netSalary: number;
  status: string;
  paymentDate?: string | null;
  createdAt: string;
}

interface LeaveRecord {
  id: string;
  leaveType: string;
  startDate: string;
  endDate: string;
  days: number;
  reason: string;
  status: string;
  createdAt: string;
}

interface OvertimeRecord {
  id: string;
  otDate: string;
  startTime: string;
  endTime: string;
  totalHours: number;
  rateMultiplier: number;
  reason: string;
  status: string;
}

interface LoanRecord {
  id: string;
  loanCode: string;
  loanAmount: number;
  termMonths: number;
  monthlyDeduction: number;
  totalRepaid: number;
  remainingBalance: number;
  status: string;
  startDeductionMonth: string;
  purpose: string;
  repaymentSchedule?: any;
}

interface PunchRecord {
  id: string;
  punchTime: string;
  punchType: string;
  verifyMode: string;
  deviceName?: string | null;
}

interface AttendanceRecord {
  id: string;
  month: number;
  year: number;
  daysWorked: number;
  leaveDays: number;
  absentDays: number;
  otHours: number;
}

interface FullEmployee extends EmployeeSimple {
  payrolls?: PayrollRecord[];
  leaveRequests?: LeaveRecord[];
  overtimeRequests?: OvertimeRecord[];
  loans?: LoanRecord[];
  attendances?: AttendanceRecord[];
  biometricLogs?: PunchRecord[];
}

interface Props {
  employee: FullEmployee | null;
  allEmployees: EmployeeSimple[];
  currentUserRole: string;
}

export default function MyPortalClient({
  employee,
  allEmployees,
  currentUserRole,
}: Props) {
  const router = useRouter();
  const isHR = ['ADMIN', 'HR_MANAGER', 'PAYROLL_ADMIN'].includes(currentUserRole);

  const [activeTab, setActiveTab] = useState<'HOME' | 'REQUESTS' | 'PAYROLL' | 'PROFILE'>('HOME');
  const [selectedPayroll, setSelectedPayroll] = useState<PayrollRecord | null>(null);
  const [isPayslipModalOpen, setIsPayslipModalOpen] = useState(false);
  const [isClockInModalOpen, setIsClockInModalOpen] = useState(false);
  const [isCalendarModalOpen, setIsCalendarModalOpen] = useState(false);
  const [isKpiModalOpen, setIsKpiModalOpen] = useState(false);

  // Quick Application Modals
  const [isLeaveModalOpen, setIsLeaveModalOpen] = useState(false);
  const [leaveType, setLeaveType] = useState('ANNUAL');
  const [leaveStart, setLeaveStart] = useState(() => new Date().toISOString().slice(0, 10));
  const [leaveEnd, setLeaveEnd] = useState(() => new Date().toISOString().slice(0, 10));
  const [leaveReason, setLeaveReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Admin Search / Selector
  const [portalSearchQuery, setPortalSearchQuery] = useState('');
  const [isPortalSearchOpen, setIsPortalSearchOpen] = useState(false);

  if (!employee) {
    return (
      <div className="bg-white rounded-3xl p-8 text-center border border-slate-200 shadow-sm max-w-md mx-auto my-12">
        <div className="text-5xl mb-3">👤</div>
        <h2 className="text-lg font-bold text-slate-900 kh-text">
          មិនទាន់បានភ្ជាប់គណនីជាមួយទិន្នន័យបុគ្គលិកនៅឡើយទេ
        </h2>
        <p className="text-xs text-slate-500 mt-2 kh-text">
          សូមទាក់ទងមកកាន់ផ្នែកធនធានមនុស្ស (HR) ដើម្បីភ្ជាប់គណនីរបស់អ្នកជាមួយអត្តលេខបុគ្គលិក។
        </p>
      </div>
    );
  }

  const empNameKh = `${employee.lastNameKh || ''} ${employee.firstNameKh || ''}`.trim();
  const empNameEn = `${employee.firstNameEn || ''} ${employee.lastNameEn || ''}`.trim();
  const displayName = empNameKh || empNameEn;

  // Active Loan balance
  const activeLoan = employee.loans?.find((l) => l.status === 'ACTIVE');
  const activeLoanBalance = activeLoan ? activeLoan.remainingBalance.toFixed(2) : '0.00';

  // Filter employees for Admin Preview
  const filteredPortalEmployees = useMemo(() => {
    if (!allEmployees || allEmployees.length === 0) return [];
    if (!portalSearchQuery.trim()) return allEmployees.slice(0, 30);
    const q = portalSearchQuery.toLowerCase().trim();
    return allEmployees.filter((e) => {
      const empId = (e.employeeId || '').toLowerCase();
      const name = `${e.lastNameKh || ''} ${e.firstNameKh || ''} ${e.firstNameEn || ''} ${e.lastNameEn || ''}`.toLowerCase();
      return empId.includes(q) || name.includes(q);
    });
  }, [allEmployees, portalSearchQuery]);

  // Extract Today's Real Punches if available
  const todayLogs = useMemo(() => {
    const todayStr = new Date().toISOString().slice(0, 10);
    const logs = (employee.biometricLogs || []).filter((l) => l.punchTime.startsWith(todayStr));
    logs.sort((a, b) => new Date(a.punchTime).getTime() - new Date(b.punchTime).getTime());
    return logs;
  }, [employee.biometricLogs]);

  // Calculate or fallback today's 4 punch slots
  const punchSlots = useMemo(() => {
    const formatTime = (isoString?: string) => {
      if (!isoString) return null;
      const d = new Date(isoString);
      return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
    };

    const firstIn = todayLogs[0]?.punchTime ? formatTime(todayLogs[0].punchTime) : '08:25 AM';
    const firstOut = todayLogs[1]?.punchTime ? formatTime(todayLogs[1].punchTime) : '12:07 PM';
    const secondIn = todayLogs[2]?.punchTime ? formatTime(todayLogs[2].punchTime) : '12:32 PM';
    const secondOut = todayLogs[3]?.punchTime ? formatTime(todayLogs[3].punchTime) : '05:19 PM';

    return [
      {
        id: 1,
        type: 'IN',
        title: 'ម៉ោងចូល',
        sub: 'ចូលយឺត',
        time: firstIn,
        tag: '25 min',
        tagColor: 'text-rose-500',
        iconBg: 'bg-emerald-100 text-emerald-600',
      },
      {
        id: 2,
        type: 'OUT',
        title: 'ម៉ោងចេញ',
        sub: 'ចេញមុន',
        time: firstOut,
        tag: '--:--',
        tagColor: 'text-slate-400',
        iconBg: 'bg-rose-100 text-rose-500',
      },
      {
        id: 3,
        type: 'IN',
        title: 'ម៉ោងចូល',
        sub: 'ចូលយឺត',
        time: secondIn,
        tag: '--:--',
        tagColor: 'text-slate-400',
        iconBg: 'bg-emerald-100 text-emerald-600',
      },
      {
        id: 4,
        type: 'OUT',
        title: 'ម៉ោងចេញ',
        sub: 'ចេញមុន',
        time: secondOut,
        tag: '--:--',
        tagColor: 'text-slate-400',
        iconBg: 'bg-rose-100 text-rose-500',
      },
    ];
  }, [todayLogs]);

  // Submit Leave Request
  const handleSubmitLeave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/leave', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employeeId: employee.id,
          leaveType,
          startDate: leaveStart,
          endDate: leaveEnd,
          reason: leaveReason,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to submit leave');
      }

      setIsLeaveModalOpen(false);
      setLeaveReason('');
      Swal.fire({
        icon: 'success',
        title: 'បានដាក់ពាក្យស្នើសុំច្បាប់ជោគជ័យ!',
        text: 'ពាក្យស្នើសុំត្រូវបានបញ្ជូនទៅកាន់ប្រធានផ្នែក និង HR រួចរាល់។',
        confirmButtonColor: '#10b981',
      }).then(() => router.refresh());
    } catch (err: any) {
      Swal.fire('Error', err.message, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full space-y-4 pb-24 font-sans select-none">
      {/* 1. TOP HEADER (Avatar, Name, Calendar & Notification Icons) */}
      <div className="bg-white rounded-3xl p-4 sm:p-5 shadow-xs border border-slate-100 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          {employee.photoUrl ? (
            <img
              src={employee.photoUrl}
              alt=""
              className="w-13 h-13 sm:w-14 sm:h-14 rounded-full object-cover border-2 border-white shadow-xs shrink-0"
            />
          ) : (
            <div className="w-13 h-13 sm:w-14 sm:h-14 rounded-full bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center text-xl font-bold border-2 border-white shadow-xs shrink-0">
              {displayName.charAt(0) || 'E'}
            </div>
          )}

          <div className="min-w-0 flex-1">
            <h1 className="text-lg sm:text-xl font-extrabold text-slate-900 leading-tight truncate kh-text">
              {displayName}
            </h1>
            <p className="text-xs text-slate-500 font-medium truncate mt-0.5 kh-text">
              {employee.position} • {employee.department}
            </p>
          </div>
        </div>

        {/* Top Right Action Buttons: Calendar & Notifications */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => setIsCalendarModalOpen(true)}
            type="button"
            className="w-10 h-10 rounded-full bg-slate-50 hover:bg-slate-100 border border-slate-200/80 flex items-center justify-center text-emerald-600 transition-colors shadow-2xs"
            title="ប្រតិទិនការងារ & វត្តមាន"
          >
            <span className="text-base">📅</span>
          </button>

          <button
            onClick={() => {
              Swal.fire({
                title: 'សេចក្តីជូនដំណឹង (Notifications)',
                text: 'គ្មានសេចក្តីជូនដំណឹងថ្មីនៅឡើយទេ!',
                icon: 'info',
                confirmButtonColor: '#10b981',
              });
            }}
            type="button"
            className="relative w-10 h-10 rounded-full bg-slate-50 hover:bg-slate-100 border border-slate-200/80 flex items-center justify-center text-slate-600 transition-colors shadow-2xs"
            title="សេចក្តីជូនដំណឹង"
          >
            <span className="text-base">🔔</span>
            <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-white animate-pulse" />
          </button>
        </div>
      </div>

      {/* Admin Switcher Bar (Visible for HR/Admin only, collapsible) */}
      {isHR && (
        <div className="bg-indigo-50/70 border border-indigo-100 rounded-2xl p-2.5 flex items-center justify-between gap-2 text-xs kh-text">
          <span className="text-indigo-900 font-bold flex items-center gap-1.5 shrink-0">
            <span>👀</span>
            <span className="hidden sm:inline">Admin Preview:</span>
          </span>
          <div className="relative flex-1 max-w-xs">
            <input
              type="text"
              placeholder="🔍 វាយ ID ឬ ឈ្មោះដើម្បីប្តូរ..."
              value={portalSearchQuery}
              onChange={(e) => {
                setPortalSearchQuery(e.target.value);
                setIsPortalSearchOpen(true);
              }}
              onFocus={() => setIsPortalSearchOpen(true)}
              className="w-full px-3 py-1.5 bg-white border border-indigo-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-400"
            />
            {isPortalSearchOpen && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setIsPortalSearchOpen(false)}
                />
                <div className="absolute top-full left-0 right-0 mt-1 max-h-56 bg-white border border-slate-200 rounded-xl shadow-lg overflow-y-auto z-50 divide-y divide-slate-100">
                  {filteredPortalEmployees.map((e) => (
                    <button
                      key={e.id}
                      onClick={() => {
                        setIsPortalSearchOpen(false);
                        setPortalSearchQuery('');
                        router.push(`/dashboard/my-portal?employeeId=${e.id}`);
                      }}
                      className="w-full text-left p-2 hover:bg-indigo-50 text-xs flex items-center justify-between"
                    >
                      <span className="font-bold text-slate-800">
                        {e.employeeId} - {e.lastNameKh || e.lastNameEn} {e.firstNameKh || e.firstNameEn}
                      </span>
                      <span className="text-[10px] text-slate-400">{e.department}</span>
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* 2. SECTION: "ការប្រើប្រាស់មុខងារឆាប់រហ័ស" (Quick Action Shortcuts Grid) */}
      {activeTab === 'HOME' && (
        <>
          <div className="space-y-3">
            <h2 className="text-base sm:text-lg font-bold text-slate-900 kh-text">
              ការប្រើប្រាស់មុខងារឆាប់រហ័ស
            </h2>

            <div className="grid grid-cols-4 sm:grid-cols-4 gap-3 sm:gap-4">
              {/* 1. វត្តមាន (Attendance) */}
              <button
                onClick={() => setIsClockInModalOpen(true)}
                type="button"
                className="flex flex-col items-center gap-1.5 p-2 rounded-2xl hover:bg-white active:scale-95 transition-all text-center group"
              >
                <div className="w-13 h-13 sm:w-14 sm:h-14 rounded-full bg-emerald-50 border border-emerald-100 text-emerald-600 flex items-center justify-center text-2xl shadow-xs group-hover:scale-105 transition-transform">
                  📋
                </div>
                <span className="text-[11px] sm:text-xs font-semibold text-slate-700 kh-text leading-tight">
                  វត្តមាន
                </span>
              </button>

              {/* 2. ពិនិត្យកម្រងប្រាក់ (Payslips) */}
              <button
                onClick={() => setActiveTab('PAYROLL')}
                type="button"
                className="flex flex-col items-center gap-1.5 p-2 rounded-2xl hover:bg-white active:scale-95 transition-all text-center group"
              >
                <div className="w-13 h-13 sm:w-14 sm:h-14 rounded-full bg-teal-50 border border-teal-100 text-teal-600 flex items-center justify-center text-2xl shadow-xs group-hover:scale-105 transition-transform">
                  💵
                </div>
                <span className="text-[11px] sm:text-xs font-semibold text-slate-700 kh-text leading-tight">
                  ពិនិត្យកម្រងប្រាក់
                </span>
              </button>

              {/* 3. សំណើចេញក្រៅ (Leave Request) */}
              <button
                onClick={() => setIsLeaveModalOpen(true)}
                type="button"
                className="flex flex-col items-center gap-1.5 p-2 rounded-2xl hover:bg-white active:scale-95 transition-all text-center group"
              >
                <div className="w-13 h-13 sm:w-14 sm:h-14 rounded-full bg-sky-50 border border-sky-100 text-sky-600 flex items-center justify-center text-2xl shadow-xs group-hover:scale-105 transition-transform">
                  🏢
                </div>
                <span className="text-[11px] sm:text-xs font-semibold text-slate-700 kh-text leading-tight">
                  សំណើចេញក្រៅ
                </span>
              </button>

              {/* 4. តាមដាន KPI (KPI Tracking) */}
              <button
                onClick={() => setIsKpiModalOpen(true)}
                type="button"
                className="flex flex-col items-center gap-1.5 p-2 rounded-2xl hover:bg-white active:scale-95 transition-all text-center group"
              >
                <div className="w-13 h-13 sm:w-14 sm:h-14 rounded-full bg-emerald-50 border border-emerald-100 text-emerald-700 flex items-center justify-center text-2xl shadow-xs group-hover:scale-105 transition-transform">
                  🎯
                </div>
                <span className="text-[11px] sm:text-xs font-semibold text-slate-700 kh-text leading-tight">
                  តាមដាន KPI
                </span>
              </button>

              {/* 5. កំណត់ប្រាក់ចេញក្រៅ / ប្រាក់កម្ចី */}
              <button
                onClick={() => setActiveTab('PROFILE')}
                type="button"
                className="flex flex-col items-center gap-1.5 p-2 rounded-2xl hover:bg-white active:scale-95 transition-all text-center group"
              >
                <div className="w-13 h-13 sm:w-14 sm:h-14 rounded-full bg-amber-50 border border-amber-100 text-amber-600 flex items-center justify-center text-2xl shadow-xs group-hover:scale-105 transition-transform">
                  💳
                </div>
                <span className="text-[11px] sm:text-xs font-semibold text-slate-700 kh-text leading-tight">
                  កំណត់ប្រាក់/កម្ចី
                </span>
              </button>

              {/* 6. ប្រវត្តិការងារ (Work History) */}
              <button
                onClick={() => setActiveTab('PROFILE')}
                type="button"
                className="flex flex-col items-center gap-1.5 p-2 rounded-2xl hover:bg-white active:scale-95 transition-all text-center group"
              >
                <div className="w-13 h-13 sm:w-14 sm:h-14 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center text-2xl shadow-xs group-hover:scale-105 transition-transform">
                  📑
                </div>
                <span className="text-[11px] sm:text-xs font-semibold text-slate-700 kh-text leading-tight">
                  ប្រវត្តិការងារ
                </span>
              </button>

              {/* 7. ស្នើសុំច្បាប់ (Leave History) */}
              <button
                onClick={() => setActiveTab('REQUESTS')}
                type="button"
                className="flex flex-col items-center gap-1.5 p-2 rounded-2xl hover:bg-white active:scale-95 transition-all text-center group"
              >
                <div className="w-13 h-13 sm:w-14 sm:h-14 rounded-full bg-rose-50 border border-rose-100 text-rose-600 flex items-center justify-center text-2xl shadow-xs group-hover:scale-105 transition-transform">
                  📝
                </div>
                <span className="text-[11px] sm:text-xs font-semibold text-slate-700 kh-text leading-tight">
                  ប្រវត្តិច្បាប់
                </span>
              </button>

              {/* 8. កាលវិភាគវេន (Roster Shifts) */}
              <button
                onClick={() => setIsCalendarModalOpen(true)}
                type="button"
                className="flex flex-col items-center gap-1.5 p-2 rounded-2xl hover:bg-white active:scale-95 transition-all text-center group"
              >
                <div className="w-13 h-13 sm:w-14 sm:h-14 rounded-full bg-purple-50 border border-purple-100 text-purple-600 flex items-center justify-center text-2xl shadow-xs group-hover:scale-105 transition-transform">
                  ⏱️
                </div>
                <span className="text-[11px] sm:text-xs font-semibold text-slate-700 kh-text leading-tight">
                  កាលវិភាគវេន
                </span>
              </button>
            </div>
          </div>

          {/* 3. SECTION: "ថ្ងៃនេះ" (Today's Card & Punches Timeline) */}
          <div className="bg-white rounded-3xl p-4 sm:p-5 shadow-xs border border-slate-100 space-y-3">
            {/* Header: ថ្ងៃនេះ + LF Shift hours */}
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="text-base font-extrabold text-slate-900 kh-text">ថ្ងៃនេះ</span>
                <span className="text-xs text-slate-400 font-medium">
                  {new Date().toLocaleDateString('km-KH', { weekday: 'short', day: 'numeric', month: 'short' })}
                </span>
              </div>
              <span className="text-xs sm:text-sm font-bold text-emerald-600 font-mono">
                {employee.shift || 'LF (08:00 AM - 05:00 PM)'}
              </span>
            </div>

            {/* 4 Punch Timeline Items (Matching the image) */}
            <div className="space-y-2.5">
              {punchSlots.map((slot) => (
                <div
                  key={slot.id}
                  className="bg-slate-50/90 rounded-2xl p-3 flex items-center justify-between border border-slate-100/80 hover:bg-slate-100/80 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center text-lg ${slot.iconBg}`}>
                      🚶‍♂️
                    </div>
                    <div>
                      <div className="text-sm font-extrabold text-slate-900 kh-text leading-tight">
                        {slot.title}
                      </div>
                      <div className="text-[11px] text-slate-400 kh-text">
                        {slot.sub}
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-sm sm:text-base font-bold font-mono text-slate-900">
                      {slot.time}
                    </div>
                    <div className={`text-[11px] font-semibold font-mono ${slot.tagColor}`}>
                      {slot.tag}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 4. Mini KPI Cards (Annual Leave, Salary, Loan) */}
          <div className="grid grid-cols-3 gap-2.5">
            <div className="bg-white rounded-2xl p-3 border border-slate-100 shadow-2xs text-center">
              <span className="text-[10px] sm:text-xs text-slate-400 block font-semibold kh-text">
                ច្បាប់នៅសល់
              </span>
              <span className="text-sm sm:text-base font-extrabold text-emerald-600 font-mono block mt-0.5">
                {employee.annualLeaveDays ?? 18} <span className="text-[10px] font-sans">ថ្ងៃ</span>
              </span>
            </div>

            <div className="bg-white rounded-2xl p-3 border border-slate-100 shadow-2xs text-center">
              <span className="text-[10px] sm:text-xs text-slate-400 block font-semibold kh-text">
                ប្រាក់ខែគោល
              </span>
              <span className="text-sm sm:text-base font-extrabold text-slate-900 font-mono block mt-0.5">
                ${employee.basicSalary?.toFixed(0) || '0'}
              </span>
            </div>

            <div className="bg-white rounded-2xl p-3 border border-slate-100 shadow-2xs text-center">
              <span className="text-[10px] sm:text-xs text-slate-400 block font-semibold kh-text">
                ប្រាក់កម្ចីនៅសល់
              </span>
              <span className="text-sm sm:text-base font-extrabold text-amber-600 font-mono block mt-0.5">
                ${activeLoanBalance}
              </span>
            </div>
          </div>
        </>
      )}

      {/* TAB 2: REQUESTS (Leave & Overtime History) */}
      {activeTab === 'REQUESTS' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900 kh-text">ប្រវត្តិនៃការស្នើសុំ</h2>
            <button
              onClick={() => setIsLeaveModalOpen(true)}
              className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs kh-text"
            >
              + ស្នើសុំច្បាប់
            </button>
          </div>

          {/* Leave Requests Card List */}
          <div className="space-y-2.5">
            {!employee.leaveRequests || employee.leaveRequests.length === 0 ? (
              <div className="bg-white rounded-2xl p-8 text-center text-slate-400 text-xs kh-text border border-slate-100">
                មិនទាន់មានប្រវត្តិស្នើសុំច្បាប់នៅឡើយទេ
              </div>
            ) : (
              employee.leaveRequests.map((l) => (
                <div key={l.id} className="bg-white rounded-2xl p-3.5 border border-slate-100 shadow-2xs space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-slate-900 text-xs kh-text">
                      🌴 {l.leaveType}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        l.status === 'APPROVED'
                          ? 'bg-emerald-100 text-emerald-800'
                          : l.status === 'REJECTED'
                          ? 'bg-rose-100 text-rose-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {l.status}
                    </span>
                  </div>
                  <div className="text-xs text-slate-500 font-mono flex justify-between">
                    <span>{new Date(l.startDate).toLocaleDateString()} ➔ {new Date(l.endDate).toLocaleDateString()}</span>
                    <span className="font-bold text-slate-800">{l.days} ថ្ងៃ</span>
                  </div>
                  {l.reason && <p className="text-[11px] text-slate-400 kh-text italic">{l.reason}</p>}
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* TAB 3: PAYROLL (Payslips) */}
      {activeTab === 'PAYROLL' && (
        <div className="space-y-3">
          <h2 className="text-base font-bold text-slate-900 kh-text">ប័ណ្ណបើកប្រាក់បៀវត្ស (Payslips)</h2>
          {!employee.payrolls || employee.payrolls.length === 0 ? (
            <div className="bg-white rounded-2xl p-8 text-center text-slate-400 text-xs kh-text border border-slate-100">
              មិនទាន់មានទិន្នន័យប័ណ្ណប្រាក់ខែនៅឡើយទេ
            </div>
          ) : (
            employee.payrolls.map((p) => (
              <div key={p.id} className="bg-white rounded-2xl p-4 border border-slate-100 shadow-2xs space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <div>
                    <span className="font-extrabold text-slate-900 text-sm kh-text block">
                      ខែ {p.month} ឆ្នាំ {p.year}
                    </span>
                    <span className="text-[11px] text-slate-400 font-mono">
                      ប្រាក់ខែមូលដ្ឋាន: ${p.basicSalary.toFixed(2)}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 block kh-text">ប្រាក់ត្រូវបើកសុទ្ធ</span>
                    <span className="text-base font-extrabold text-emerald-600 font-mono">
                      ${p.netSalary.toFixed(2)}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="text-emerald-700 bg-emerald-50/70 p-2 rounded-xl">
                    <span className="block text-[10px] text-emerald-600">ថែមម៉ោង & ឧបត្ថម្ភ</span>
                    <span className="font-bold font-mono">+${((p.otPay || 0) + (p.allowances || 0)).toFixed(2)}</span>
                  </div>
                  <div className="text-rose-700 bg-rose-50/70 p-2 rounded-xl text-right">
                    <span className="block text-[10px] text-rose-600">កាត់ប្រាក់ផ្សេងៗ</span>
                    <span className="font-bold font-mono">-${((p.deductions || 0) + (p.tax || 0)).toFixed(2)}</span>
                  </div>
                </div>

                <button
                  onClick={() => {
                    setSelectedPayroll(p);
                    setIsPayslipModalOpen(true);
                  }}
                  className="w-full py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold text-xs rounded-xl transition-colors kh-text"
                >
                  👁️ មើលប័ណ្ណប្រាក់ខែ & បោះពុម្ព
                </button>
              </div>
            ))
          )}
        </div>
      )}

      {/* TAB 4: PROFILE (Employment Information & Loans) */}
      {activeTab === 'PROFILE' && (
        <div className="space-y-4">
          <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-2xs space-y-3">
            <h3 className="text-sm font-bold text-slate-900 kh-text">ព័ត៌មានបុគ្គលិក</h3>
            <div className="divide-y divide-slate-100 text-xs">
              <div className="py-2 flex justify-between">
                <span className="text-slate-400 kh-text">អត្តលេខ</span>
                <span className="font-mono font-bold text-slate-900">{employee.employeeId}</span>
              </div>
              <div className="py-2 flex justify-between">
                <span className="text-slate-400 kh-text">ផ្នែក / ដេប៉ាតឺម៉ង់</span>
                <span className="font-bold text-slate-900 kh-text">{employee.department}</span>
              </div>
              <div className="py-2 flex justify-between">
                <span className="text-slate-400 kh-text">តួនាទី</span>
                <span className="font-bold text-slate-900 kh-text">{employee.position}</span>
              </div>
              <div className="py-2 flex justify-between">
                <span className="text-slate-400 kh-text">កាលវិភាគវេន (Shift)</span>
                <span className="font-mono font-bold text-emerald-600">{employee.shift || 'LF (08:00 AM - 05:00 PM)'}</span>
              </div>
              <div className="py-2 flex justify-between">
                <span className="text-slate-400 kh-text">ថ្ងៃចូលធ្វើការ</span>
                <span className="font-mono font-bold text-slate-900">
                  {employee.hireDate ? new Date(employee.hireDate).toLocaleDateString() : '-'}
                </span>
              </div>
              {employee.phone && (
                <div className="py-2 flex justify-between">
                  <span className="text-slate-400 kh-text">លេខទូរស័ព្ទ</span>
                  <span className="font-mono font-bold text-slate-900">{employee.phone}</span>
                </div>
              )}
            </div>
          </div>

          {/* Loan Card if exists */}
          {activeLoan && (
            <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-2xs space-y-2">
              <h3 className="text-sm font-bold text-amber-900 kh-text">ប្រាក់កម្ចីបុគ្គលិក ({activeLoan.loanCode})</h3>
              <div className="text-xs space-y-1.5 text-slate-600">
                <div className="flex justify-between">
                  <span>ប្រាក់កម្ចីដើម:</span>
                  <span className="font-mono font-bold">${activeLoan.loanAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>កាត់ប្រចាំខែ:</span>
                  <span className="font-mono font-bold text-indigo-600">${activeLoan.monthlyDeduction.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>សមតុល្យនៅសល់:</span>
                  <span className="font-mono font-bold text-amber-600">${activeLoan.remainingBalance.toFixed(2)}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 5. FLOATING BOTTOM APP NAVIGATION BAR (Native App Dock) */}
      <div className="fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200/90 shadow-lg">
        <div className="max-w-xl md:max-w-3xl lg:max-w-4xl mx-auto px-4 py-1.5 flex items-center justify-between relative">
          {/* Tab 1: ទំព័រដើម */}
          <button
            onClick={() => setActiveTab('HOME')}
            className={`flex flex-col items-center gap-1 w-16 transition-colors ${
              activeTab === 'HOME' ? 'text-emerald-600 font-bold' : 'text-slate-400'
            }`}
          >
            <span className="text-xl leading-none">🏠</span>
            <span className="text-[10px] kh-text">ទំព័រដើម</span>
          </button>

          {/* Tab 2: សំណើសុំច្បាប់ */}
          <button
            onClick={() => setActiveTab('REQUESTS')}
            className={`flex flex-col items-center gap-1 w-16 transition-colors ${
              activeTab === 'REQUESTS' ? 'text-emerald-600 font-bold' : 'text-slate-400'
            }`}
          >
            <span className="text-xl leading-none">📄</span>
            <span className="text-[10px] kh-text">សំណើសុំច្បាប់</span>
          </button>

          {/* CENTER FLOATING PUNCH BUTTON (Fingerprint / Scan) */}
          <div className="relative -top-5 flex flex-col items-center">
            <button
              onClick={() => setIsClockInModalOpen(true)}
              type="button"
              className="w-14 h-14 rounded-full bg-white border-2 border-emerald-500 shadow-lg shadow-emerald-500/25 flex items-center justify-center text-emerald-600 active:scale-90 transition-transform cursor-pointer"
              title="ស្កេនវត្តមាន (Clock In Now)"
            >
              <span className="text-2xl">👆</span>
            </button>
          </div>

          {/* Tab 3: កម្រងប្រាក់ */}
          <button
            onClick={() => setActiveTab('PAYROLL')}
            className={`flex flex-col items-center gap-1 w-16 transition-colors ${
              activeTab === 'PAYROLL' ? 'text-emerald-600 font-bold' : 'text-slate-400'
            }`}
          >
            <span className="text-xl leading-none">💰</span>
            <span className="text-[10px] kh-text">កម្រងប្រាក់</span>
          </button>

          {/* Tab 4: ប្រវត្តិរូប */}
          <button
            onClick={() => setActiveTab('PROFILE')}
            className={`flex flex-col items-center gap-1 w-16 transition-colors ${
              activeTab === 'PROFILE' ? 'text-emerald-600 font-bold' : 'text-slate-400'
            }`}
          >
            <span className="text-xl leading-none">👤</span>
            <span className="text-[10px] kh-text">ប្រវត្តិរូប</span>
          </button>
        </div>
      </div>

      {/* MODAL 1: CLOCK-IN SCANNER & GPS */}
      <MobileClockInModal
        isOpen={isClockInModalOpen}
        onClose={() => setIsClockInModalOpen(false)}
        employeeId={employee.id}
        employeeName={displayName}
        onSuccess={() => router.refresh()}
      />

      {/* MODAL 2: DIGITAL PAYSLIP */}
      {isPayslipModalOpen && selectedPayroll && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl w-full max-w-sm max-h-[90vh] overflow-y-auto p-5 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-extrabold text-sm text-slate-900 kh-text">ប័ណ្ណបើកប្រាក់ខែ</h3>
              <button onClick={() => setIsPayslipModalOpen(false)} className="text-slate-400 hover:text-slate-600 p-1">
                ✕
              </button>
            </div>

            <div className="text-center space-y-0.5">
              <span className="text-xs text-slate-400 font-mono">MONTHLY PAYSLIP</span>
              <h4 className="text-lg font-black text-slate-900 kh-text">
                ខែ {selectedPayroll.month} ឆ្នាំ {selectedPayroll.year}
              </h4>
              <span className="text-2xl font-black text-emerald-600 font-mono block pt-1">
                ${selectedPayroll.netSalary.toFixed(2)}
              </span>
            </div>

            <div className="bg-slate-50 rounded-2xl p-3 text-xs space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-500 kh-text">ប្រាក់ខែគោល:</span>
                <span className="font-mono font-bold">${selectedPayroll.basicSalary.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-emerald-600">
                <span className="kh-text">ថែមម៉ោង & ឧបត្ថម្ភ:</span>
                <span className="font-mono font-bold">+${((selectedPayroll.otPay || 0) + (selectedPayroll.allowances || 0)).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-rose-500">
                <span className="kh-text">កាត់ប្រាក់ផ្សេងៗ:</span>
                <span className="font-mono font-bold">-${((selectedPayroll.deductions || 0) + (selectedPayroll.tax || 0)).toFixed(2)}</span>
              </div>
            </div>

            <button
              onClick={() => window.print()}
              className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs kh-text"
            >
              🖨️ បោះពុម្ពប័ណ្ណប្រាក់ខែ
            </button>
          </div>
        </div>
      )}

      {/* MODAL 3: APPLY LEAVE */}
      {isLeaveModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl w-full max-w-sm max-h-[90vh] overflow-y-auto p-5 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-extrabold text-sm text-slate-900 kh-text">ពាក្យស្នើសុំច្បាប់ឈប់សម្រាក</h3>
              <button onClick={() => setIsLeaveModalOpen(false)} className="text-slate-400 hover:text-slate-600 p-1">
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmitLeave} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-600 font-semibold mb-1 kh-text">ប្រភេទច្បាប់</label>
                <select
                  value={leaveType}
                  onChange={(e) => setLeaveType(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold kh-text"
                >
                  <option value="ANNUAL">ច្បាប់ប្រចាំឆ្នាំ (Annual Leave)</option>
                  <option value="SICK">ច្បាប់ឈឺ (Sick Leave)</option>
                  <option value="SPECIAL">ច្បាប់ពិសេស (Special Leave)</option>
                  <option value="UNPAID">ច្បាប់ឥតប្រាក់ឈ្នួល (Unpaid Leave)</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-600 font-semibold mb-1 kh-text">ចាប់ពីថ្ងៃ</label>
                  <input
                    type="date"
                    value={leaveStart}
                    onChange={(e) => setLeaveStart(e.target.value)}
                    required
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl font-mono text-xs"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-semibold mb-1 kh-text">ដល់ថ្ងៃ</label>
                  <input
                    type="date"
                    value={leaveEnd}
                    onChange={(e) => setLeaveEnd(e.target.value)}
                    required
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl font-mono text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-600 font-semibold mb-1 kh-text">មូលហេតុ</label>
                <textarea
                  rows={3}
                  value={leaveReason}
                  onChange={(e) => setLeaveReason(e.target.value)}
                  placeholder="មូលហេតុនៃការសុំច្បាប់..."
                  required
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl kh-text"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold shadow-xs transition-colors kh-text"
              >
                {isSubmitting ? 'កំពុងបញ្ជូន...' : 'បញ្ជូនពាក្យស្នើសុំ'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 4: CALENDAR / ROSTER SCHEDULE */}
      {isCalendarModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl w-full max-w-sm max-h-[90vh] overflow-y-auto p-5 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-extrabold text-sm text-slate-900 kh-text">កាលវិភាគវេនការងារ (Shift Roster)</h3>
              <button onClick={() => setIsCalendarModalOpen(false)} className="text-slate-400 hover:text-slate-600 p-1">
                ✕
              </button>
            </div>
            <div className="p-3 bg-emerald-50 rounded-2xl text-xs space-y-1">
              <span className="font-bold text-emerald-900 block kh-text">វេនការងារបច្ចុប្បន្ន</span>
              <span className="font-mono font-extrabold text-emerald-700 text-sm">
                {employee.shift || 'LF (08:00 AM - 05:00 PM)'}
              </span>
            </div>
            <div className="text-xs text-slate-500 kh-text space-y-1">
              <p>• ម៉ោងធ្វើការធម្មតា៖ ០៨:០០ ព្រឹក - ០៥:០០ ល្ងាច</p>
              <p>• សម្រាកបាយថ្ងៃត្រង់៖ ១២:០០ ថ្ងៃ - ០១:០០ រសៀល</p>
              <p>• ថ្ងៃឈប់សម្រាកប្រចាំសប្តាហ៍៖ ថ្ងៃអាទិត្យ</p>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 5: KPI TRACKING */}
      {isKpiModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl w-full max-w-sm max-h-[90vh] overflow-y-auto p-5 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-extrabold text-sm text-slate-900 kh-text">តាមដានពិន្ទុ KPI ប្រចាំខែ</h3>
              <button onClick={() => setIsKpiModalOpen(false)} className="text-slate-400 hover:text-slate-600 p-1">
                ✕
              </button>
            </div>
            <div className="p-4 bg-emerald-50 rounded-2xl text-center space-y-1">
              <span className="text-xs text-emerald-600 font-semibold kh-text">ពិន្ទុសរុបបច្ចុប្បន្ន</span>
              <span className="text-3xl font-black text-emerald-700 font-mono block">95%</span>
              <span className="text-[11px] text-emerald-600 font-medium kh-text">ចំណាត់ថ្នាក់៖ ល្អប្រសើរ (Excellent)</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
