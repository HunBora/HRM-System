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

  // Leave Modal
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
      <div
        style={{
          background: '#ffffff',
          borderRadius: '24px',
          padding: '40px 20px',
          textAlign: 'center',
          border: '1px solid #e2e8f0',
          maxWidth: '480px',
          margin: '40px auto',
        }}
      >
        <div style={{ fontSize: '48px', marginBottom: '12px' }}>👤</div>
        <h2 className="kh-text" style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
          មិនទាន់បានភ្ជាប់គណនីជាមួយទិន្នន័យបុគ្គលិកនៅឡើយទេ
        </h2>
        <p className="kh-text" style={{ color: '#64748b', fontSize: '0.86rem', marginTop: '8px' }}>
          សូមទាក់ទងមកកាន់ផ្នែកធនធានមនុស្ស (HR) ដើម្បីភ្ជាប់គណនីរបស់អ្នកជាមួយអត្តលេខបុគ្គលិក។
        </p>
      </div>
    );
  }

  const empNameKh = `${employee.lastNameKh || ''} ${employee.firstNameKh || ''}`.trim();
  const empNameEn = `${employee.firstNameEn || ''} ${employee.lastNameEn || ''}`.trim();
  const displayName = empNameKh || empNameEn;

  // Active Loan
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

  // Extract Today's Real Punches
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
        title: 'ម៉ោងចូល',
        sub: 'ចូលយឺត',
        time: firstIn,
        tag: '25 min',
        tagColor: '#ef4444',
        iconBg: '#dcfce7',
        iconColor: '#16a34a',
      },
      {
        id: 2,
        title: 'ម៉ោងចេញ',
        sub: 'ចេញមុន',
        time: firstOut,
        tag: '--:--',
        tagColor: '#94a3b8',
        iconBg: '#fee2e2',
        iconColor: '#ef4444',
      },
      {
        id: 3,
        title: 'ម៉ោងចូល',
        sub: 'ចូលយឺត',
        time: secondIn,
        tag: '--:--',
        tagColor: '#94a3b8',
        iconBg: '#dcfce7',
        iconColor: '#16a34a',
      },
      {
        id: 4,
        title: 'ម៉ោងចេញ',
        sub: 'ចេញមុន',
        time: secondOut,
        tag: '--:--',
        tagColor: '#94a3b8',
        iconBg: '#fee2e2',
        iconColor: '#ef4444',
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
    <div style={{ maxWidth: '480px', margin: '0 auto', paddingBottom: '90px', width: '100%', boxSizing: 'border-box' }}>
      <style jsx>{`
        .portal-grid-btn {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 6px;
          background: none;
          border: none;
          cursor: pointer;
          padding: 8px 4px;
          transition: transform 0.15s ease;
        }
        .portal-grid-btn:active {
          transform: scale(0.92);
        }
        .portal-circle-icon {
          width: 52px;
          height: 52px;
          border-radius: 50%;
          background: #ffffff;
          border: 1px solid #e2e8f0;
          box-shadow: 0 4px 10px rgba(0,0,0,0.04);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 24px;
        }
        .bottom-nav-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 2px;
          background: none;
          border: none;
          cursor: pointer;
          padding: 4px 8px;
          flex: 1;
        }
        .bottom-nav-item:active {
          transform: scale(0.95);
        }
      `}</style>

      {/* 1. TOP HEADER (Avatar, Name, Calendar & Notifications) */}
      <div
        style={{
          background: '#ffffff',
          borderRadius: '24px',
          padding: '16px 20px',
          boxShadow: '0 2px 10px rgba(0,0,0,0.03)',
          border: '1px solid #f1f5f9',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px',
          marginBottom: '16px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
          {employee.photoUrl ? (
            <img
              src={employee.photoUrl}
              alt=""
              style={{
                width: '54px',
                height: '54px',
                borderRadius: '50%',
                objectFit: 'cover',
                border: '2px solid #ffffff',
                boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                flexShrink: 0,
              }}
            />
          ) : (
            <div
              style={{
                width: '54px',
                height: '54px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #059669 0%, #10b981 100%)',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '22px',
                fontWeight: 800,
                border: '2px solid #ffffff',
                boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                flexShrink: 0,
              }}
            >
              {displayName.charAt(0) || 'ប'}
            </div>
          )}

          <div style={{ minWidth: 0 }}>
            <h1
              className="kh-text"
              style={{
                margin: 0,
                fontSize: '1.25rem',
                fontWeight: 900,
                color: '#0f172a',
                lineHeight: 1.25,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {displayName}
            </h1>
            <p
              className="kh-text"
              style={{
                margin: '3px 0 0 0',
                fontSize: '0.78rem',
                color: '#64748b',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {employee.position} • {employee.department}
            </p>
          </div>
        </div>

        {/* Top Right Action Icons: Calendar & Notification */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
          <button
            onClick={() => setIsCalendarModalOpen(true)}
            type="button"
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '18px',
              cursor: 'pointer',
            }}
            title="ប្រតិទិនការងារ"
          >
            📅
          </button>

          <button
            onClick={() => {
              Swal.fire({
                title: 'សេចក្តីជូនដំណឹង',
                text: 'គ្មានដំណឹងថ្មីនៅឡើយទេ!',
                icon: 'info',
                confirmButtonColor: '#10b981',
              });
            }}
            type="button"
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '18px',
              cursor: 'pointer',
              position: 'relative',
            }}
            title="សេចក្តីជូនដំណឹង"
          >
            🔔
            <span
              style={{
                position: 'absolute',
                top: '9px',
                right: '9px',
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background: '#10b981',
                border: '2px solid #ffffff',
              }}
            />
          </button>
        </div>
      </div>

      {/* Admin Preview Switcher (If HR/Admin) */}
      {isHR && (
        <div
          style={{
            background: '#eef2ff',
            border: '1px solid #c7d2fe',
            borderRadius: '16px',
            padding: '10px 14px',
            marginBottom: '16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '8px',
          }}
        >
          <span className="kh-text" style={{ fontSize: '0.75rem', fontWeight: 800, color: '#3730a3', whiteSpace: 'nowrap' }}>
            👀 Admin Preview:
          </span>
          <div style={{ position: 'relative', flex: 1 }}>
            <input
              type="text"
              placeholder="🔍 វាយ ID ឬ ឈ្មោះ..."
              value={portalSearchQuery}
              onChange={(e) => {
                setPortalSearchQuery(e.target.value);
                setIsPortalSearchOpen(true);
              }}
              onFocus={() => setIsPortalSearchOpen(true)}
              className="kh-text"
              style={{
                width: '100%',
                padding: '6px 10px',
                borderRadius: '8px',
                border: '1px solid #a5b4fc',
                background: '#ffffff',
                fontSize: '0.78rem',
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
            {isPortalSearchOpen && (
              <>
                <div style={{ position: 'fixed', inset: 0, zIndex: 99 }} onClick={() => setIsPortalSearchOpen(false)} />
                <div
                  style={{
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    right: 0,
                    marginTop: '4px',
                    maxHeight: '220px',
                    overflowY: 'auto',
                    background: '#ffffff',
                    borderRadius: '10px',
                    border: '1px solid #cbd5e1',
                    boxShadow: '0 10px 25px rgba(0,0,0,0.15)',
                    zIndex: 100,
                  }}
                >
                  {filteredPortalEmployees.map((e) => (
                    <div
                      key={e.id}
                      onClick={() => {
                        setIsPortalSearchOpen(false);
                        setPortalSearchQuery('');
                        router.push(`/dashboard/my-portal?employeeId=${e.id}`);
                      }}
                      style={{
                        padding: '8px 12px',
                        borderBottom: '1px solid #f1f5f9',
                        cursor: 'pointer',
                        fontSize: '0.78rem',
                      }}
                    >
                      <strong style={{ color: '#1e293b' }}>{e.employeeId}</strong> - {e.lastNameKh || e.lastNameEn} {e.firstNameKh || e.firstNameEn}
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* 2. SECTION: "ការប្រើប្រាស់មុខងារឆាប់រហ័ស" (Quick Shortcuts Grid) */}
      {activeTab === 'HOME' && (
        <>
          <div style={{ marginBottom: '18px' }}>
            <h2 className="kh-text" style={{ fontSize: '1.15rem', fontWeight: 900, color: '#0f172a', margin: '0 0 12px 0' }}>
              ការប្រើប្រាស់មុខងារឆាប់រហ័ស
            </h2>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(4, 1fr)',
                gap: '12px 8px',
              }}
            >
              {/* 1. វត្តមាន */}
              <button onClick={() => setIsClockInModalOpen(true)} type="button" className="portal-grid-btn">
                <div className="portal-circle-icon" style={{ background: '#ecfdf5', color: '#059669', borderColor: '#a7f3d0' }}>
                  📋
                </div>
                <span className="kh-text" style={{ fontSize: '0.72rem', fontWeight: 700, color: '#334155' }}>
                  វត្តមាន
                </span>
              </button>

              {/* 2. ពិនិត្យកម្រងប្រាក់ */}
              <button onClick={() => setActiveTab('PAYROLL')} type="button" className="portal-grid-btn">
                <div className="portal-circle-icon" style={{ background: '#f0fdf4', color: '#16a34a', borderColor: '#bbf7d0' }}>
                  💵
                </div>
                <span className="kh-text" style={{ fontSize: '0.72rem', fontWeight: 700, color: '#334155' }}>
                  ពិនិត្យកម្រងប្រាក់
                </span>
              </button>

              {/* 3. សំណើចេញក្រៅ */}
              <button onClick={() => setIsLeaveModalOpen(true)} type="button" className="portal-grid-btn">
                <div className="portal-circle-icon" style={{ background: '#f0f9ff', color: '#0284c7', borderColor: '#bae6fd' }}>
                  🏢
                </div>
                <span className="kh-text" style={{ fontSize: '0.72rem', fontWeight: 700, color: '#334155' }}>
                  សំណើចេញក្រៅ
                </span>
              </button>

              {/* 4. តាមដាន KPI */}
              <button onClick={() => setIsKpiModalOpen(true)} type="button" className="portal-grid-btn">
                <div className="portal-circle-icon" style={{ background: '#ecfdf5', color: '#047857', borderColor: '#a7f3d0' }}>
                  🎯
                </div>
                <span className="kh-text" style={{ fontSize: '0.72rem', fontWeight: 700, color: '#334155' }}>
                  តាមដាន KPI
                </span>
              </button>

              {/* 5. កំណត់ប្រាក់ចេញក្រៅ / ប្រាក់កម្ចី */}
              <button onClick={() => setActiveTab('PROFILE')} type="button" className="portal-grid-btn">
                <div className="portal-circle-icon" style={{ background: '#fffbeb', color: '#d97706', borderColor: '#fde68a' }}>
                  💳
                </div>
                <span className="kh-text" style={{ fontSize: '0.72rem', fontWeight: 700, color: '#334155', textAlign: 'center' }}>
                  កំណត់ប្រាក់/កម្ចី
                </span>
              </button>

              {/* 6. ប្រវត្តិការងារ */}
              <button onClick={() => setActiveTab('PROFILE')} type="button" className="portal-grid-btn">
                <div className="portal-circle-icon" style={{ background: '#f5f3ff', color: '#7c3aed', borderColor: '#ddd6fe' }}>
                  📑
                </div>
                <span className="kh-text" style={{ fontSize: '0.72rem', fontWeight: 700, color: '#334155' }}>
                  ប្រវត្តិការងារ
                </span>
              </button>

              {/* 7. ស្នើសុំច្បាប់ */}
              <button onClick={() => setActiveTab('REQUESTS')} type="button" className="portal-grid-btn">
                <div className="portal-circle-icon" style={{ background: '#fff1f2', color: '#e11d48', borderColor: '#fecdd3' }}>
                  📝
                </div>
                <span className="kh-text" style={{ fontSize: '0.72rem', fontWeight: 700, color: '#334155' }}>
                  ប្រវត្តិច្បាប់
                </span>
              </button>

              {/* 8. កាលវិភាគវេន */}
              <button onClick={() => setIsCalendarModalOpen(true)} type="button" className="portal-grid-btn">
                <div className="portal-circle-icon" style={{ background: '#faf5ff', color: '#9333ea', borderColor: '#e9d5ff' }}>
                  ⏱️
                </div>
                <span className="kh-text" style={{ fontSize: '0.72rem', fontWeight: 700, color: '#334155' }}>
                  កាលវិភាគវេន
                </span>
              </button>
            </div>
          </div>

          {/* 3. SECTION: "ថ្ងៃនេះ" (Today's Punches Timeline) */}
          <div
            style={{
              background: '#ffffff',
              borderRadius: '24px',
              padding: '18px 20px',
              boxShadow: '0 2px 10px rgba(0,0,0,0.03)',
              border: '1px solid #f1f5f9',
              marginBottom: '16px',
            }}
          >
            {/* Header: ថ្ងៃនេះ + Shift Code */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                paddingBottom: '12px',
                borderBottom: '1px solid #f1f5f9',
                marginBottom: '12px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span className="kh-text" style={{ fontSize: '1.05rem', fontWeight: 900, color: '#0f172a' }}>
                  ថ្ងៃនេះ
                </span>
              </div>
              <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#16a34a', fontFamily: 'monospace' }}>
                {employee.shift || 'LF (08:00 AM - 05:00 PM)'}
              </span>
            </div>

            {/* 4 Punch Cards */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {punchSlots.map((slot) => (
                <div
                  key={slot.id}
                  style={{
                    background: '#f8fafc',
                    borderRadius: '16px',
                    padding: '12px 16px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    border: '1px solid #f1f5f9',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div
                      style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: '50%',
                        background: slot.iconBg,
                        color: slot.iconColor,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '18px',
                      }}
                    >
                      🚶‍♂️
                    </div>
                    <div>
                      <div className="kh-text" style={{ fontSize: '0.9rem', fontWeight: 800, color: '#0f172a', lineHeight: 1.2 }}>
                        {slot.title}
                      </div>
                      <div className="kh-text" style={{ fontSize: '0.74rem', color: '#94a3b8', marginTop: '2px' }}>
                        {slot.sub}
                      </div>
                    </div>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#0f172a', fontFamily: 'monospace' }}>
                      {slot.time}
                    </div>
                    <div style={{ fontSize: '0.74rem', fontWeight: 700, color: slot.tagColor, fontFamily: 'monospace', marginTop: '2px' }}>
                      {slot.tag}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 4. Mini KPI Cards (Annual Leave, Salary, Loan) */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', marginBottom: '16px' }}>
            <div style={{ background: '#ffffff', borderRadius: '16px', padding: '12px', border: '1px solid #e2e8f0', textAlign: 'center' }}>
              <span className="kh-text" style={{ fontSize: '0.7rem', color: '#64748b', display: 'block' }}>
                ច្បាប់នៅសល់
              </span>
              <strong style={{ fontSize: '1.05rem', color: '#059669', display: 'block', marginTop: '4px' }}>
                {employee.annualLeaveDays ?? 18} <span style={{ fontSize: '0.75rem', fontWeight: 500 }}>ថ្ងៃ</span>
              </strong>
            </div>

            <div style={{ background: '#ffffff', borderRadius: '16px', padding: '12px', border: '1px solid #e2e8f0', textAlign: 'center' }}>
              <span className="kh-text" style={{ fontSize: '0.7rem', color: '#64748b', display: 'block' }}>
                ប្រាក់ខែគោល
              </span>
              <strong style={{ fontSize: '1.05rem', color: '#0f172a', display: 'block', marginTop: '4px', fontFamily: 'monospace' }}>
                ${employee.basicSalary?.toFixed(0) || '0'}
              </strong>
            </div>

            <div style={{ background: '#ffffff', borderRadius: '16px', padding: '12px', border: '1px solid #e2e8f0', textAlign: 'center' }}>
              <span className="kh-text" style={{ fontSize: '0.7rem', color: '#64748b', display: 'block' }}>
                ប្រាក់កម្ចីនៅសល់
              </span>
              <strong style={{ fontSize: '1.05rem', color: '#d97706', display: 'block', marginTop: '4px', fontFamily: 'monospace' }}>
                ${activeLoanBalance}
              </strong>
            </div>
          </div>
        </>
      )}

      {/* TAB: REQUESTS (Leave & OT) */}
      {activeTab === 'REQUESTS' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 className="kh-text" style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: '#0f172a' }}>
              ប្រវត្តិនៃការស្នើសុំ
            </h2>
            <button
              onClick={() => setIsLeaveModalOpen(true)}
              className="kh-text"
              style={{
                background: '#059669',
                color: '#ffffff',
                border: 'none',
                borderRadius: '10px',
                padding: '8px 16px',
                fontSize: '0.8rem',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              + ស្នើសុំច្បាប់
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {!employee.leaveRequests || employee.leaveRequests.length === 0 ? (
              <div style={{ background: '#ffffff', borderRadius: '16px', padding: '30px', textAlign: 'center', color: '#94a3b8', fontSize: '0.85rem' }}>
                មិនទាន់មានប្រវត្តិស្នើសុំច្បាប់នៅឡើយទេ
              </div>
            ) : (
              employee.leaveRequests.map((l) => (
                <div key={l.id} style={{ background: '#ffffff', borderRadius: '16px', padding: '14px', border: '1px solid #e2e8f0' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <strong className="kh-text" style={{ fontSize: '0.86rem', color: '#0f172a' }}>🌴 {l.leaveType}</strong>
                    <span
                      style={{
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        padding: '2px 8px',
                        borderRadius: '6px',
                        background: l.status === 'APPROVED' ? '#dcfce7' : l.status === 'REJECTED' ? '#fee2e2' : '#fef3c7',
                        color: l.status === 'APPROVED' ? '#166534' : l.status === 'REJECTED' ? '#991b1b' : '#92400e',
                      }}
                    >
                      {l.status}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.78rem', color: '#64748b', display: 'flex', justifyContent: 'space-between' }}>
                    <span>{new Date(l.startDate).toLocaleDateString()} ➔ {new Date(l.endDate).toLocaleDateString()}</span>
                    <strong>{l.days} ថ្ងៃ</strong>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* TAB: PAYROLL (Payslips) */}
      {activeTab === 'PAYROLL' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <h2 className="kh-text" style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: '#0f172a' }}>
            ប័ណ្ណបើកប្រាក់បៀវត្ស (Payslips)
          </h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {!employee.payrolls || employee.payrolls.length === 0 ? (
              <div style={{ background: '#ffffff', borderRadius: '16px', padding: '30px', textAlign: 'center', color: '#94a3b8', fontSize: '0.85rem' }}>
                មិនទាន់មានទិន្នន័យប័ណ្ណប្រាក់ខែនៅឡើយទេ
              </div>
            ) : (
              employee.payrolls.map((p) => (
                <div key={p.id} style={{ background: '#ffffff', borderRadius: '16px', padding: '16px', border: '1px solid #e2e8f0', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #f1f5f9', paddingBottom: '8px', marginBottom: '10px' }}>
                    <div>
                      <strong className="kh-text" style={{ fontSize: '0.92rem', color: '#0f172a', display: 'block' }}>
                        ខែ {p.month} ឆ្នាំ {p.year}
                      </strong>
                      <span style={{ fontSize: '0.75rem', color: '#64748b', fontFamily: 'monospace' }}>
                        គោល: ${p.basicSalary.toFixed(2)}
                      </span>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <span className="kh-text" style={{ fontSize: '0.7rem', color: '#64748b', display: 'block' }}>ប្រាក់បើកសុទ្ធ</span>
                      <strong style={{ fontSize: '1.1rem', color: '#059669', fontFamily: 'monospace' }}>
                        ${p.netSalary.toFixed(2)}
                      </strong>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '0.78rem', marginBottom: '10px' }}>
                    <div style={{ background: '#f0fdf4', color: '#16a34a', padding: '6px 10px', borderRadius: '8px' }}>
                      ថែមម៉ោង/ឧបត្ថម្ភ: +${((p.otPay || 0) + (p.allowances || 0)).toFixed(2)}
                    </div>
                    <div style={{ background: '#fef2f2', color: '#dc2626', padding: '6px 10px', borderRadius: '8px', textAlign: 'right' }}>
                      កាត់ប្រាក់: -${((p.deductions || 0) + (p.tax || 0)).toFixed(2)}
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      setSelectedPayroll(p);
                      setIsPayslipModalOpen(true);
                    }}
                    className="kh-text"
                    style={{
                      width: '100%',
                      padding: '8px',
                      background: '#ecfdf5',
                      color: '#059669',
                      border: '1px solid #a7f3d0',
                      borderRadius: '10px',
                      fontWeight: 700,
                      fontSize: '0.8rem',
                      cursor: 'pointer',
                    }}
                  >
                    👁️ មើលប័ណ្ណប្រាក់ខែ
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* TAB: PROFILE */}
      {activeTab === 'PROFILE' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div style={{ background: '#ffffff', borderRadius: '20px', padding: '20px', border: '1px solid #e2e8f0' }}>
            <h3 className="kh-text" style={{ margin: '0 0 12px 0', fontSize: '1rem', fontWeight: 800, color: '#0f172a' }}>
              ព័ត៌មានការងារ
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.84rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: '6px' }}>
                <span className="kh-text" style={{ color: '#64748b' }}>អត្តលេខ</span>
                <strong style={{ fontFamily: 'monospace' }}>{employee.employeeId}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: '6px' }}>
                <span className="kh-text" style={{ color: '#64748b' }}>ផ្នែក</span>
                <strong>{employee.department}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: '6px' }}>
                <span className="kh-text" style={{ color: '#64748b' }}>តួនាទី</span>
                <strong>{employee.position}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: '6px' }}>
                <span className="kh-text" style={{ color: '#64748b' }}>កាលវិភាគវេន</span>
                <strong style={{ color: '#059669', fontFamily: 'monospace' }}>{employee.shift || 'LF (08:00 AM - 05:00 PM)'}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span className="kh-text" style={{ color: '#64748b' }}>ថ្ងៃចូលធ្វើការ</span>
                <strong style={{ fontFamily: 'monospace' }}>
                  {employee.hireDate ? new Date(employee.hireDate).toLocaleDateString() : '-'}
                </strong>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 5. BOTTOM NAVIGATION BAR (Fixed App Dock) */}
      <div
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          background: 'rgba(255, 255, 255, 0.96)',
          backdropFilter: 'blur(10px)',
          borderTop: '1px solid #e2e8f0',
          zIndex: 50,
          boxShadow: '0 -4px 15px rgba(0,0,0,0.04)',
        }}
      >
        <div
          style={{
            maxWidth: '480px',
            margin: '0 auto',
            padding: '6px 16px 8px 16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            position: 'relative',
          }}
        >
          {/* Tab 1: ទំព័រដើម */}
          <button onClick={() => setActiveTab('HOME')} type="button" className="bottom-nav-item">
            <span style={{ fontSize: '20px' }}>🏠</span>
            <span
              className="kh-text"
              style={{
                fontSize: '0.68rem',
                fontWeight: activeTab === 'HOME' ? 800 : 500,
                color: activeTab === 'HOME' ? '#059669' : '#64748b',
              }}
            >
              ទំព័រដើម
            </span>
          </button>

          {/* Tab 2: សំណើសុំច្បាប់ */}
          <button onClick={() => setActiveTab('REQUESTS')} type="button" className="bottom-nav-item">
            <span style={{ fontSize: '20px' }}>📄</span>
            <span
              className="kh-text"
              style={{
                fontSize: '0.68rem',
                fontWeight: activeTab === 'REQUESTS' ? 800 : 500,
                color: activeTab === 'REQUESTS' ? '#059669' : '#64748b',
              }}
            >
              សំណើសុំច្បាប់
            </span>
          </button>

          {/* CENTER FLOATING PUNCH BUTTON (👆 / 🟢) */}
          <div style={{ position: 'relative', top: '-18px', display: 'flex', justifyContent: 'center' }}>
            <button
              onClick={() => setIsClockInModalOpen(true)}
              type="button"
              style={{
                width: '56px',
                height: '56px',
                borderRadius: '50%',
                background: '#ffffff',
                border: '2.5px solid #10b981',
                boxShadow: '0 6px 18px rgba(16, 185, 129, 0.35)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '26px',
                cursor: 'pointer',
              }}
              title="ស្កេនវត្តមាន (Clock-In Now)"
            >
              👆
            </button>
          </div>

          {/* Tab 3: កម្រងប្រាក់ */}
          <button onClick={() => setActiveTab('PAYROLL')} type="button" className="bottom-nav-item">
            <span style={{ fontSize: '20px' }}>💰</span>
            <span
              className="kh-text"
              style={{
                fontSize: '0.68rem',
                fontWeight: activeTab === 'PAYROLL' ? 800 : 500,
                color: activeTab === 'PAYROLL' ? '#059669' : '#64748b',
              }}
            >
              កម្រងប្រាក់
            </span>
          </button>

          {/* Tab 4: ប្រវត្តិរូប */}
          <button onClick={() => setActiveTab('PROFILE')} type="button" className="bottom-nav-item">
            <span style={{ fontSize: '20px' }}>👤</span>
            <span
              className="kh-text"
              style={{
                fontSize: '0.68rem',
                fontWeight: activeTab === 'PROFILE' ? 800 : 500,
                color: activeTab === 'PROFILE' ? '#059669' : '#64748b',
              }}
            >
              ប្រវត្តិរូប
            </span>
          </button>
        </div>
      </div>

      {/* CLOCK-IN MODAL (QR & GPS) */}
      <MobileClockInModal
        isOpen={isClockInModalOpen}
        onClose={() => setIsClockInModalOpen(false)}
        employeeId={employee.id}
        employeeName={displayName}
        onSuccess={() => router.refresh()}
      />

      {/* PAYSLIP MODAL */}
      {isPayslipModalOpen && selectedPayroll && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(15, 23, 42, 0.65)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
          <div style={{ background: '#ffffff', borderRadius: '24px', maxWidth: '400px', width: '100%', padding: '20px', boxShadow: '0 20px 40px rgba(0,0,0,0.2)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #f1f5f9', paddingBottom: '10px', marginBottom: '14px' }}>
              <strong className="kh-text" style={{ fontSize: '0.95rem', color: '#0f172a' }}>ប័ណ្ណបើកប្រាក់បៀវត្ស</strong>
              <button onClick={() => setIsPayslipModalOpen(false)} style={{ background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer', color: '#94a3b8' }}>✕</button>
            </div>

            <div style={{ textAlign: 'center', marginBottom: '14px' }}>
              <div className="kh-text" style={{ fontSize: '1rem', fontWeight: 800, color: '#0f172a' }}>
                ខែ {selectedPayroll.month} ឆ្នាំ {selectedPayroll.year}
              </div>
              <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#059669', fontFamily: 'monospace', marginTop: '4px' }}>
                ${selectedPayroll.netSalary.toFixed(2)}
              </div>
            </div>

            <div style={{ background: '#f8fafc', borderRadius: '14px', padding: '12px', fontSize: '0.8rem', display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span className="kh-text" style={{ color: '#64748b' }}>ប្រាក់ខែគោល:</span>
                <strong style={{ fontFamily: 'monospace' }}>${selectedPayroll.basicSalary.toFixed(2)}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#16a34a' }}>
                <span className="kh-text">ថែមម៉ោង & ឧបត្ថម្ភ:</span>
                <strong style={{ fontFamily: 'monospace' }}>+${((selectedPayroll.otPay || 0) + (selectedPayroll.allowances || 0)).toFixed(2)}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#dc2626' }}>
                <span className="kh-text">កាត់ប្រាក់ផ្សេងៗ:</span>
                <strong style={{ fontFamily: 'monospace' }}>-${((selectedPayroll.deductions || 0) + (selectedPayroll.tax || 0)).toFixed(2)}</strong>
              </div>
            </div>

            <button
              onClick={() => window.print()}
              className="kh-text"
              style={{ width: '100%', padding: '10px', background: '#059669', color: '#fff', border: 'none', borderRadius: '12px', fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer' }}
            >
              🖨️ បោះពុម្ពប័ណ្ណប្រាក់ខែ
            </button>
          </div>
        </div>
      )}

      {/* LEAVE MODAL */}
      {isLeaveModalOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(15, 23, 42, 0.65)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
          <div style={{ background: '#ffffff', borderRadius: '24px', maxWidth: '400px', width: '100%', padding: '20px', boxShadow: '0 20px 40px rgba(0,0,0,0.2)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #f1f5f9', paddingBottom: '10px', marginBottom: '14px' }}>
              <strong className="kh-text" style={{ fontSize: '0.95rem', color: '#0f172a' }}>ពាក្យស្នើសុំច្បាប់ឈប់សម្រាក</strong>
              <button onClick={() => setIsLeaveModalOpen(false)} style={{ background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer', color: '#94a3b8' }}>✕</button>
            </div>

            <form onSubmit={handleSubmitLeave} style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '0.8rem' }}>
              <div>
                <label className="kh-text" style={{ display: 'block', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                  ប្រភេទច្បាប់
                </label>
                <select
                  value={leaveType}
                  onChange={(e) => setLeaveType(e.target.value)}
                  className="kh-text"
                  style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#fff', boxSizing: 'border-box' }}
                >
                  <option value="ANNUAL">ច្បាប់ប្រចាំឆ្នាំ (Annual Leave)</option>
                  <option value="SICK">ច្បាប់ឈឺ (Sick Leave)</option>
                  <option value="SPECIAL">ច្បាប់ពិសេស (Special Leave)</option>
                  <option value="UNPAID">ច្បាប់ឥតប្រាក់ឈ្នួល (Unpaid Leave)</option>
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                <div>
                  <label className="kh-text" style={{ display: 'block', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>ចាប់ពីថ្ងៃ</label>
                  <input
                    type="date"
                    value={leaveStart}
                    onChange={(e) => setLeaveStart(e.target.value)}
                    required
                    style={{ width: '100%', padding: '8px', borderRadius: '8px', border: '1px solid #cbd5e1', boxSizing: 'border-box', fontFamily: 'monospace' }}
                  />
                </div>
                <div>
                  <label className="kh-text" style={{ display: 'block', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>ដល់ថ្ងៃ</label>
                  <input
                    type="date"
                    value={leaveEnd}
                    onChange={(e) => setLeaveEnd(e.target.value)}
                    required
                    style={{ width: '100%', padding: '8px', borderRadius: '8px', border: '1px solid #cbd5e1', boxSizing: 'border-box', fontFamily: 'monospace' }}
                  />
                </div>
              </div>

              <div>
                <label className="kh-text" style={{ display: 'block', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>មូលហេតុ</label>
                <textarea
                  rows={3}
                  value={leaveReason}
                  onChange={(e) => setLeaveReason(e.target.value)}
                  placeholder="មូលហេតុនៃការសុំច្បាប់..."
                  required
                  className="kh-text"
                  style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: '1px solid #cbd5e1', boxSizing: 'border-box' }}
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="kh-text"
                style={{ width: '100%', padding: '10px', background: '#059669', color: '#fff', border: 'none', borderRadius: '10px', fontWeight: 700, cursor: 'pointer', marginTop: '6px' }}
              >
                {isSubmitting ? 'កំពុងបញ្ជូន...' : 'បញ្ជូនពាក្យស្នើសុំ'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* CALENDAR MODAL */}
      {isCalendarModalOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(15, 23, 42, 0.65)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
          <div style={{ background: '#ffffff', borderRadius: '24px', maxWidth: '380px', width: '100%', padding: '20px', boxShadow: '0 20px 40px rgba(0,0,0,0.2)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #f1f5f9', paddingBottom: '10px', marginBottom: '14px' }}>
              <strong className="kh-text" style={{ fontSize: '0.95rem', color: '#0f172a' }}>កាលវិភាគវេនការងារ</strong>
              <button onClick={() => setIsCalendarModalOpen(false)} style={{ background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer', color: '#94a3b8' }}>✕</button>
            </div>
            <div style={{ background: '#ecfdf5', borderRadius: '14px', padding: '14px', marginBottom: '12px' }}>
              <span className="kh-text" style={{ fontSize: '0.74rem', color: '#047857', display: 'block' }}>វេនបច្ចុប្បន្ន</span>
              <strong style={{ fontSize: '1rem', color: '#065f46', fontFamily: 'monospace' }}>
                {employee.shift || 'LF (08:00 AM - 05:00 PM)'}
              </strong>
            </div>
            <div className="kh-text" style={{ fontSize: '0.78rem', color: '#64748b', lineHeight: 1.6 }}>
              <p>• ម៉ោងធ្វើការ៖ ០៨:០០ ព្រឹក - ០៥:០០ ល្ងាច</p>
              <p>• សម្រាកបាយថ្ងៃត្រង់៖ ១២:០០ ថ្ងៃ - ០១:០០ រសៀល</p>
              <p>• ថ្ងៃឈប់សម្រាកប្រចាំសប្តាហ៍៖ ថ្ងៃអាទិត្យ</p>
            </div>
          </div>
        </div>
      )}

      {/* KPI MODAL */}
      {isKpiModalOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(15, 23, 42, 0.65)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
          <div style={{ background: '#ffffff', borderRadius: '24px', maxWidth: '380px', width: '100%', padding: '20px', boxShadow: '0 20px 40px rgba(0,0,0,0.2)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #f1f5f9', paddingBottom: '10px', marginBottom: '14px' }}>
              <strong className="kh-text" style={{ fontSize: '0.95rem', color: '#0f172a' }}>តាមដាន KPI</strong>
              <button onClick={() => setIsKpiModalOpen(false)} style={{ background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer', color: '#94a3b8' }}>✕</button>
            </div>
            <div style={{ background: '#ecfdf5', borderRadius: '14px', padding: '20px', textAlign: 'center' }}>
              <span className="kh-text" style={{ fontSize: '0.78rem', color: '#047857' }}>ពិន្ទុ KPI ប្រចាំខែ</span>
              <div style={{ fontSize: '2.4rem', fontWeight: 900, color: '#059669', fontFamily: 'monospace', margin: '4px 0' }}>
                95%
              </div>
              <span className="kh-text" style={{ fontSize: '0.76rem', color: '#047857', fontWeight: 700 }}>
                ចំណាត់ថ្នាក់៖ ល្អប្រសើរ (Excellent)
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
