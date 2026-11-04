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
    <div className="portal-container">
      <style>{`
        /* Responsive Portal Layout */
        .portal-container {
          width: 100%;
          box-sizing: border-box;
          margin: 0 auto;
        }

        /* Mobile View (< 768px) */
        @media (max-width: 768px) {
          .portal-container {
            max-width: 480px;
            padding: 12px 10px 95px 10px;
          }
          .desktop-only {
            display: none !important;
          }
          .mobile-only {
            display: block !important;
          }
          .mobile-dock {
            display: flex !important;
          }
          .portal-2col-layout {
            display: flex;
            flex-direction: column;
            gap: 16px;
          }
          .kpi-summary-grid {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 8px;
            margin-bottom: 16px;
          }
          .kpi-summary-card {
            padding: 10px 6px;
            border-radius: 14px;
            flex-direction: column;
            text-align: center;
            justify-content: center;
          }
          .kpi-card-icon {
            display: none !important;
          }
          .kpi-card-title {
            font-size: 0.68rem;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            max-width: 100%;
          }
          .kpi-card-value {
            font-size: 1.15rem;
          }
        }

        /* Desktop & Tablet View (>= 769px) */
        @media (min-width: 769px) {
          .portal-container {
            max-width: 1350px;
            padding: 20px 24px 50px 24px;
          }
          .mobile-only {
            display: none !important;
          }
          .desktop-only {
            display: block !important;
          }
          .mobile-dock {
            display: none !important;
          }
          .portal-2col-layout {
            display: grid !important;
            grid-template-columns: 1.35fr 1fr !important;
            gap: 24px !important;
            align-items: start !important;
          }
          .kpi-summary-grid {
            display: grid !important;
            grid-template-columns: repeat(3, 1fr) !important;
            gap: 20px !important;
            margin-bottom: 24px !important;
          }
          .kpi-summary-card {
            padding: 18px 22px;
            border-radius: 20px;
          }
          .kpi-card-title {
            font-size: 0.82rem;
            display: block;
          }
          .kpi-card-value {
            font-size: 1.45rem;
          }
          .kpi-card-icon {
            display: inline-block;
          }
        }

        /* Common Card & Button Styles */
        .kpi-summary-card {
          background: #ffffff;
          border: 1px solid #e2e8f0;
          box-shadow: 0 2px 8px rgba(0,0,0,0.02);
          display: flex;
          align-items: center;
          justify-content: space-between;
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }
        .kpi-summary-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 18px rgba(0,0,0,0.05);
        }

        /* Interactive Buttons */
        .portal-grid-btn {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 6px;
          background: none;
          border: none;
          cursor: pointer;
          padding: 10px 4px;
          transition: transform 0.15s ease;
        }
        .portal-grid-btn:hover {
          transform: translateY(-2px);
        }
        .portal-grid-btn:active {
          transform: scale(0.92);
        }
        .portal-circle-icon {
          width: 56px;
          height: 56px;
          border-radius: 50%;
          background: #ffffff;
          border: 1px solid #e2e8f0;
          box-shadow: 0 4px 12px rgba(0,0,0,0.04);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 26px;
          transition: box-shadow 0.2s ease;
        }
        .portal-grid-btn:hover .portal-circle-icon {
          box-shadow: 0 6px 16px rgba(0,0,0,0.08);
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
        .desktop-tab-btn {
          padding: 10px 20px;
          border-radius: 12px;
          font-weight: 700;
          font-size: 0.88rem;
          cursor: pointer;
          border: none;
          transition: all 0.2s ease;
        }
      `}</style>

      {/* 1. TOP HEADER (Avatar, Name, Actions, Clock-in) */}
      <div
        style={{
          background: '#ffffff',
          borderRadius: '24px',
          padding: '20px 24px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.03)',
          border: '1px solid #e2e8f0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '16px',
          marginBottom: '20px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', minWidth: 0 }}>
          {employee.photoUrl ? (
            <img
              src={employee.photoUrl}
              alt=""
              style={{
                width: '60px',
                height: '60px',
                borderRadius: '50%',
                objectFit: 'cover',
                border: '3px solid #10b981',
                boxShadow: '0 4px 12px rgba(16, 185, 129, 0.2)',
                flexShrink: 0,
              }}
            />
          ) : (
            <div
              style={{
                width: '60px',
                height: '60px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #059669 0%, #10b981 100%)',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '26px',
                fontWeight: 900,
                border: '3px solid #ffffff',
                boxShadow: '0 4px 12px rgba(16, 185, 129, 0.25)',
                flexShrink: 0,
              }}
            >
              {displayName.charAt(0) || 'ប'}
            </div>
          )}

          <div style={{ minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <h1
                className="kh-text"
                style={{
                  margin: 0,
                  fontSize: '1.35rem',
                  fontWeight: 900,
                  color: '#0f172a',
                  lineHeight: 1.2,
                  whiteSpace: 'nowrap',
                }}
              >
                {displayName}
              </h1>
              <span
                style={{
                  background: '#ecfdf5',
                  color: '#059669',
                  fontFamily: 'monospace',
                  fontWeight: 800,
                  padding: '2px 8px',
                  borderRadius: '6px',
                  fontSize: '0.78rem',
                  border: '1px solid #a7f3d0',
                }}
              >
                {employee.employeeId}
              </span>
            </div>
            <p
              className="kh-text"
              style={{
                margin: '4px 0 0 0',
                fontSize: '0.82rem',
                color: '#64748b',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              🏢 {employee.department} • {employee.position} {employee.phone && <span>• 📞 {employee.phone}</span>}
            </p>
          </div>
        </div>

        {/* Right Header Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          {/* Desktop Clock In Button */}
          <button
            onClick={() => setIsClockInModalOpen(true)}
            type="button"
            className="desktop-only kh-text"
            style={{
              padding: '10px 20px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #059669 0%, #10b981 100%)',
              color: '#ffffff',
              border: 'none',
              fontSize: '0.86rem',
              fontWeight: 800,
              cursor: 'pointer',
              boxShadow: '0 4px 14px rgba(16, 185, 129, 0.3)',
            }}
          >
            👆 ស្កេនវត្តមាន (Clock In Now)
          </button>

          <button
            onClick={() => setIsCalendarModalOpen(true)}
            type="button"
            style={{
              width: '42px',
              height: '42px',
              borderRadius: '50%',
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '18px',
              cursor: 'pointer',
            }}
            title="ប្រតិទិនការងារ & វេន"
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
              width: '42px',
              height: '42px',
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
            padding: '10px 16px',
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
          }}
        >
          <span className="kh-text" style={{ fontSize: '0.8rem', fontWeight: 800, color: '#3730a3', whiteSpace: 'nowrap' }}>
            👀 Admin Preview (មើលជាបុគ្គលិកផ្សេងទៀត)៖
          </span>
          <div style={{ position: 'relative', flex: 1, maxWidth: '320px' }}>
            <input
              type="text"
              placeholder="🔍 វាយ ID ឬ ឈ្មោះដើម្បីប្តូរ..."
              value={portalSearchQuery}
              onChange={(e) => {
                setPortalSearchQuery(e.target.value);
                setIsPortalSearchOpen(true);
              }}
              onFocus={() => setIsPortalSearchOpen(true)}
              className="kh-text"
              style={{
                width: '100%',
                padding: '7px 12px',
                borderRadius: '8px',
                border: '1px solid #a5b4fc',
                background: '#ffffff',
                fontSize: '0.82rem',
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
                    maxHeight: '240px',
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
                        padding: '9px 14px',
                        borderBottom: '1px solid #f1f5f9',
                        cursor: 'pointer',
                        fontSize: '0.82rem',
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

      {/* 2. TOP SEGMENTED NAVIGATION TABS (Visible on Desktop/Tablet) */}
      <div className="desktop-only" style={{ marginBottom: '20px' }}>
        <div style={{ display: 'flex', gap: '8px', background: '#ffffff', padding: '6px', borderRadius: '16px', border: '1px solid #e2e8f0', width: 'fit-content' }}>
          <button
            onClick={() => setActiveTab('HOME')}
            className="desktop-tab-btn kh-text"
            style={{
              background: activeTab === 'HOME' ? '#059669' : 'transparent',
              color: activeTab === 'HOME' ? '#ffffff' : '#64748b',
            }}
          >
            🏠 ទំព័រដើម (Overview)
          </button>
          <button
            onClick={() => setActiveTab('REQUESTS')}
            className="desktop-tab-btn kh-text"
            style={{
              background: activeTab === 'REQUESTS' ? '#059669' : 'transparent',
              color: activeTab === 'REQUESTS' ? '#ffffff' : '#64748b',
            }}
          >
            📄 សំណើសុំច្បាប់ & OT
          </button>
          <button
            onClick={() => setActiveTab('PAYROLL')}
            className="desktop-tab-btn kh-text"
            style={{
              background: activeTab === 'PAYROLL' ? '#059669' : 'transparent',
              color: activeTab === 'PAYROLL' ? '#ffffff' : '#64748b',
            }}
          >
            💰 កម្រងប្រាក់ (Payslips)
          </button>
          <button
            onClick={() => setActiveTab('PROFILE')}
            className="desktop-tab-btn kh-text"
            style={{
              background: activeTab === 'PROFILE' ? '#059669' : 'transparent',
              color: activeTab === 'PROFILE' ? '#ffffff' : '#64748b',
            }}
          >
            👤 ប្រវត្តិរូប & កម្ចី
          </button>
        </div>
      </div>

      {/* 3. THREE BIG STAT CARDS (Evenly Spread Across Desktop) */}
      <div className="kpi-summary-grid">
        <div className="kpi-summary-card">
          <div style={{ minWidth: 0 }}>
            <span className="kh-text kpi-card-title" style={{ color: '#64748b', fontWeight: 600 }}>
              ច្បាប់សម្រាកនៅសល់ (Annual Leave)
            </span>
            <div className="kpi-card-value" style={{ fontWeight: 900, color: '#059669', marginTop: '2px' }}>
              {employee.annualLeaveDays ?? 18}{' '}
              <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#64748b' }}>ថ្ងៃ</span>
            </div>
          </div>
          <span className="kpi-card-icon" style={{ fontSize: '28px' }}>🌴</span>
        </div>

        <div className="kpi-summary-card">
          <div style={{ minWidth: 0 }}>
            <span className="kh-text kpi-card-title" style={{ color: '#64748b', fontWeight: 600 }}>
              ប្រាក់ខែមូលដ្ឋាន (Basic Salary)
            </span>
            <div className="kpi-card-value" style={{ fontWeight: 900, color: '#0f172a', marginTop: '2px', fontFamily: 'monospace' }}>
              ${employee.basicSalary?.toFixed(2) || '0.00'}
            </div>
          </div>
          <span className="kpi-card-icon" style={{ fontSize: '28px' }}>💰</span>
        </div>

        <div className="kpi-summary-card">
          <div style={{ minWidth: 0 }}>
            <span className="kh-text kpi-card-title" style={{ color: '#64748b', fontWeight: 600 }}>
              ប្រាក់កម្ចីនៅជំពាក់ (Active Loan)
            </span>
            <div className="kpi-card-value" style={{ fontWeight: 900, color: '#d97706', marginTop: '2px', fontFamily: 'monospace' }}>
              ${activeLoanBalance}
            </div>
          </div>
          <span className="kpi-card-icon" style={{ fontSize: '28px' }}>💳</span>
        </div>
      </div>

      {/* 4. MAIN CONTENT TABS */}
      {activeTab === 'HOME' && (
        <div className="portal-2col-layout">
          {/* COLUMN 1 (Left on desktop): Quick Action Shortcuts & Info */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Card: Quick Services Shortcuts */}
            <div
              style={{
                background: '#ffffff',
                borderRadius: '24px',
                padding: '24px',
                boxShadow: '0 2px 12px rgba(0,0,0,0.03)',
                border: '1px solid #e2e8f0',
              }}
            >
              <h2 className="kh-text" style={{ fontSize: '1.2rem', fontWeight: 900, color: '#0f172a', margin: '0 0 16px 0' }}>
                ការប្រើប្រាស់មុខងារឆាប់រហ័ស
              </h2>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(4, 1fr)',
                  gap: '16px 12px',
                }}
              >
                {/* 1. វត្តមាន */}
                <button onClick={() => setIsClockInModalOpen(true)} type="button" className="portal-grid-btn">
                  <div className="portal-circle-icon" style={{ background: '#ecfdf5', color: '#059669', borderColor: '#a7f3d0' }}>
                    📋
                  </div>
                  <span className="kh-text" style={{ fontSize: '0.78rem', fontWeight: 700, color: '#334155' }}>
                    វត្តមាន
                  </span>
                </button>

                {/* 2. ពិនិត្យកម្រងប្រាក់ */}
                <button onClick={() => setActiveTab('PAYROLL')} type="button" className="portal-grid-btn">
                  <div className="portal-circle-icon" style={{ background: '#f0fdf4', color: '#16a34a', borderColor: '#bbf7d0' }}>
                    💵
                  </div>
                  <span className="kh-text" style={{ fontSize: '0.78rem', fontWeight: 700, color: '#334155' }}>
                    ពិនិត្យកម្រងប្រាក់
                  </span>
                </button>

                {/* 3. សំណើចេញក្រៅ */}
                <button onClick={() => setIsLeaveModalOpen(true)} type="button" className="portal-grid-btn">
                  <div className="portal-circle-icon" style={{ background: '#f0f9ff', color: '#0284c7', borderColor: '#bae6fd' }}>
                    🏢
                  </div>
                  <span className="kh-text" style={{ fontSize: '0.78rem', fontWeight: 700, color: '#334155' }}>
                    សំណើចេញក្រៅ
                  </span>
                </button>

                {/* 4. តាមដាន KPI */}
                <button onClick={() => setIsKpiModalOpen(true)} type="button" className="portal-grid-btn">
                  <div className="portal-circle-icon" style={{ background: '#ecfdf5', color: '#047857', borderColor: '#a7f3d0' }}>
                    🎯
                  </div>
                  <span className="kh-text" style={{ fontSize: '0.78rem', fontWeight: 700, color: '#334155' }}>
                    តាមដាន KPI
                  </span>
                </button>

                {/* 5. កំណត់ប្រាក់ចេញក្រៅ / ប្រាក់កម្ចី */}
                <button onClick={() => setActiveTab('PROFILE')} type="button" className="portal-grid-btn">
                  <div className="portal-circle-icon" style={{ background: '#fffbeb', color: '#d97706', borderColor: '#fde68a' }}>
                    💳
                  </div>
                  <span className="kh-text" style={{ fontSize: '0.78rem', fontWeight: 700, color: '#334155', textAlign: 'center' }}>
                    កំណត់ប្រាក់/កម្ចី
                  </span>
                </button>

                {/* 6. ប្រវត្តិការងារ */}
                <button onClick={() => setActiveTab('PROFILE')} type="button" className="portal-grid-btn">
                  <div className="portal-circle-icon" style={{ background: '#f5f3ff', color: '#7c3aed', borderColor: '#ddd6fe' }}>
                    📑
                  </div>
                  <span className="kh-text" style={{ fontSize: '0.78rem', fontWeight: 700, color: '#334155' }}>
                    ប្រវត្តិការងារ
                  </span>
                </button>

                {/* 7. ស្នើសុំច្បាប់ */}
                <button onClick={() => setActiveTab('REQUESTS')} type="button" className="portal-grid-btn">
                  <div className="portal-circle-icon" style={{ background: '#fff1f2', color: '#e11d48', borderColor: '#fecdd3' }}>
                    📝
                  </div>
                  <span className="kh-text" style={{ fontSize: '0.78rem', fontWeight: 700, color: '#334155' }}>
                    ប្រវត្តិច្បាប់
                  </span>
                </button>

                {/* 8. កាលវិភាគវេន */}
                <button onClick={() => setIsCalendarModalOpen(true)} type="button" className="portal-grid-btn">
                  <div className="portal-circle-icon" style={{ background: '#faf5ff', color: '#9333ea', borderColor: '#e9d5ff' }}>
                    ⏱️
                  </div>
                  <span className="kh-text" style={{ fontSize: '0.78rem', fontWeight: 700, color: '#334155' }}>
                    កាលវិភាគវេន
                  </span>
                </button>
              </div>
            </div>

            {/* Desktop View: Latest Payslip Summary Preview */}
            <div
              className="desktop-only"
              style={{
                background: '#ffffff',
                borderRadius: '24px',
                padding: '24px',
                border: '1px solid #e2e8f0',
                boxShadow: '0 2px 10px rgba(0,0,0,0.02)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                <h3 className="kh-text" style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: '#0f172a' }}>
                  💰 ប័ណ្ណបើកប្រាក់បៀវត្សចុងក្រោយ (Latest Payslip)
                </h3>
                <button
                  onClick={() => setActiveTab('PAYROLL')}
                  className="kh-text"
                  style={{ background: 'none', border: 'none', color: '#059669', fontWeight: 700, fontSize: '0.8rem', cursor: 'pointer' }}
                >
                  មើលទាំងអស់ ➔
                </button>
              </div>

              {employee.payrolls && employee.payrolls.length > 0 ? (
                <div style={{ background: '#f8fafc', borderRadius: '16px', padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <strong className="kh-text" style={{ fontSize: '0.95rem', color: '#0f172a', display: 'block' }}>
                      ខែ {employee.payrolls[0].month} ឆ្នាំ {employee.payrolls[0].year}
                    </strong>
                    <span style={{ fontSize: '0.78rem', color: '#64748b' }}>
                      គោល: ${employee.payrolls[0].basicSalary.toFixed(2)} • ថែមម៉ោង: +${(employee.payrolls[0].otPay || 0).toFixed(2)}
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div style={{ textAlign: 'right' }}>
                      <span className="kh-text" style={{ fontSize: '0.72rem', color: '#64748b', display: 'block' }}>ប្រាក់បើកសុទ្ធ</span>
                      <strong style={{ fontSize: '1.25rem', color: '#059669', fontFamily: 'monospace' }}>
                        ${employee.payrolls[0].netSalary.toFixed(2)}
                      </strong>
                    </div>
                    <button
                      onClick={() => {
                        setSelectedPayroll(employee.payrolls![0]);
                        setIsPayslipModalOpen(true);
                      }}
                      className="kh-text"
                      style={{
                        padding: '8px 16px',
                        background: '#ecfdf5',
                        color: '#059669',
                        border: '1px solid #a7f3d0',
                        borderRadius: '10px',
                        fontWeight: 700,
                        fontSize: '0.82rem',
                        cursor: 'pointer',
                      }}
                    >
                      👁️ មើលប័ណ្ណ
                    </button>
                  </div>
                </div>
              ) : (
                <p className="kh-text" style={{ color: '#94a3b8', fontSize: '0.82rem', margin: 0 }}>
                  មិនទាន់មានទិន្នន័យប្រាក់ខែនៅឡើយទេ
                </p>
              )}
            </div>
          </div>

          {/* COLUMN 2 (Right on desktop): Today's Card & Shifts */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Card: ថ្ងៃនេះ (Today's Punches Timeline) */}
            <div
              style={{
                background: '#ffffff',
                borderRadius: '24px',
                padding: '24px',
                boxShadow: '0 2px 12px rgba(0,0,0,0.03)',
                border: '1px solid #e2e8f0',
              }}
            >
              {/* Header: ថ្ងៃនេះ + Shift Code */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  paddingBottom: '14px',
                  borderBottom: '1px solid #f1f5f9',
                  marginBottom: '14px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span className="kh-text" style={{ fontSize: '1.15rem', fontWeight: 900, color: '#0f172a' }}>
                    ថ្ងៃនេះ
                  </span>
                  <span style={{ fontSize: '0.78rem', color: '#64748b' }}>
                    ({new Date().toLocaleDateString('km-KH', { weekday: 'short', day: 'numeric', month: 'short' })})
                  </span>
                </div>
                <span style={{ fontSize: '0.88rem', fontWeight: 800, color: '#16a34a', fontFamily: 'monospace' }}>
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
                          width: '38px',
                          height: '38px',
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
                        <div className="kh-text" style={{ fontSize: '0.92rem', fontWeight: 800, color: '#0f172a', lineHeight: 1.2 }}>
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

              {/* Quick Clock-in Box on Desktop */}
              <button
                onClick={() => setIsClockInModalOpen(true)}
                className="desktop-only kh-text"
                style={{
                  width: '100%',
                  marginTop: '16px',
                  padding: '12px',
                  background: 'linear-gradient(135deg, #059669 0%, #10b981 100%)',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '14px',
                  fontWeight: 800,
                  fontSize: '0.9rem',
                  cursor: 'pointer',
                  boxShadow: '0 4px 12px rgba(16, 185, 129, 0.25)',
                }}
              >
                📷 / 📍 ស្កេនវត្តមានចូល-ចេញ (Clock In)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB: REQUESTS (Leave & OT History) */}
      {activeTab === 'REQUESTS' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div
            style={{
              background: '#ffffff',
              borderRadius: '24px',
              padding: '24px',
              border: '1px solid #e2e8f0',
              boxShadow: '0 2px 10px rgba(0,0,0,0.03)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h2 className="kh-text" style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: '#0f172a' }}>
                ប្រវត្តិនៃការស្នើសុំច្បាប់ និងថែមម៉ោង (Requests Hub)
              </h2>
              <button
                onClick={() => setIsLeaveModalOpen(true)}
                className="kh-text"
                style={{
                  background: '#059669',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '12px',
                  padding: '10px 20px',
                  fontSize: '0.85rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  boxShadow: '0 4px 12px rgba(16, 185, 129, 0.25)',
                }}
              >
                + ដាក់ពាក្យស្នើសុំច្បាប់
              </button>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '600px' }}>
                <thead>
                  <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                    <th className="kh-text" style={{ padding: '12px 16px', fontSize: '0.8rem', color: '#475569', fontWeight: 800 }}>ប្រភេទច្បាប់</th>
                    <th className="kh-text" style={{ padding: '12px 16px', fontSize: '0.8rem', color: '#475569', fontWeight: 800 }}>កាលបរិច្ឆេទ</th>
                    <th className="kh-text" style={{ padding: '12px 16px', fontSize: '0.8rem', color: '#475569', fontWeight: 800 }}>ចំនួនថ្ងៃ</th>
                    <th className="kh-text" style={{ padding: '12px 16px', fontSize: '0.8rem', color: '#475569', fontWeight: 800 }}>មូលហេតុ</th>
                    <th className="kh-text" style={{ padding: '12px 16px', fontSize: '0.8rem', color: '#475569', fontWeight: 800 }}>ស្ថានភាព</th>
                  </tr>
                </thead>
                <tbody>
                  {!employee.leaveRequests || employee.leaveRequests.length === 0 ? (
                    <tr>
                      <td colSpan={5} style={{ padding: '36px', textAlign: 'center', color: '#94a3b8' }}>
                        មិនទាន់មានប្រវត្តិស្នើសុំច្បាប់នៅឡើយទេ
                      </td>
                    </tr>
                  ) : (
                    employee.leaveRequests.map((l) => (
                      <tr key={l.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '12px 16px', fontWeight: 700, color: '#0f172a' }}>🌴 {l.leaveType}</td>
                        <td style={{ padding: '12px 16px', fontSize: '0.82rem', fontFamily: 'monospace' }}>
                          {new Date(l.startDate).toLocaleDateString()} ➔ {new Date(l.endDate).toLocaleDateString()}
                        </td>
                        <td style={{ padding: '12px 16px', fontWeight: 800 }}>{l.days} ថ្ងៃ</td>
                        <td style={{ padding: '12px 16px', color: '#64748b', fontSize: '0.82rem' }}>{l.reason || '-'}</td>
                        <td style={{ padding: '12px 16px' }}>
                          <span
                            style={{
                              fontSize: '0.74rem',
                              fontWeight: 700,
                              padding: '3px 8px',
                              borderRadius: '6px',
                              background: l.status === 'APPROVED' ? '#dcfce7' : l.status === 'REJECTED' ? '#fee2e2' : '#fef3c7',
                              color: l.status === 'APPROVED' ? '#166534' : l.status === 'REJECTED' ? '#991b1b' : '#92400e',
                            }}
                          >
                            {l.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB: PAYROLL (Payslips List) */}
      {activeTab === 'PAYROLL' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div
            style={{
              background: '#ffffff',
              borderRadius: '24px',
              padding: '24px',
              border: '1px solid #e2e8f0',
              boxShadow: '0 2px 10px rgba(0,0,0,0.03)',
            }}
          >
            <h2 className="kh-text" style={{ margin: '0 0 16px 0', fontSize: '1.2rem', fontWeight: 800, color: '#0f172a' }}>
              ប័ណ្ណបើកប្រាក់បៀវត្ស (Payslips History)
            </h2>

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '700px' }}>
                <thead>
                  <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                    <th className="kh-text" style={{ padding: '12px 16px', fontSize: '0.8rem', color: '#475569', fontWeight: 800 }}>ខែ/ឆ្នាំ</th>
                    <th className="kh-text" style={{ padding: '12px 16px', fontSize: '0.8rem', color: '#475569', fontWeight: 800 }}>ប្រាក់ខែគោល</th>
                    <th className="kh-text" style={{ padding: '12px 16px', fontSize: '0.8rem', color: '#475569', fontWeight: 800 }}>ថែមម៉ោង & ឧបត្ថម្ភ</th>
                    <th className="kh-text" style={{ padding: '12px 16px', fontSize: '0.8rem', color: '#475569', fontWeight: 800 }}>កាត់ប្រាក់</th>
                    <th className="kh-text" style={{ padding: '12px 16px', fontSize: '0.8rem', color: '#475569', fontWeight: 800 }}>ប្រាក់បើកសុទ្ធ</th>
                    <th className="kh-text" style={{ padding: '12px 16px', textAlign: 'center', fontSize: '0.8rem', color: '#475569', fontWeight: 800 }}>សកម្មភាព</th>
                  </tr>
                </thead>
                <tbody>
                  {!employee.payrolls || employee.payrolls.length === 0 ? (
                    <tr>
                      <td colSpan={6} style={{ padding: '36px', textAlign: 'center', color: '#94a3b8' }}>
                        មិនទាន់មានទិន្នន័យប័ណ្ណប្រាក់ខែនៅឡើយទេ
                      </td>
                    </tr>
                  ) : (
                    employee.payrolls.map((p) => (
                      <tr key={p.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '12px 16px', fontWeight: 800, color: '#0f172a' }}>
                          ខែ {p.month} ឆ្នាំ {p.year}
                        </td>
                        <td style={{ padding: '12px 16px', fontFamily: 'monospace', fontWeight: 600 }}>
                          ${p.basicSalary.toFixed(2)}
                        </td>
                        <td style={{ padding: '12px 16px', color: '#16a34a', fontFamily: 'monospace', fontWeight: 700 }}>
                          +${((p.otPay || 0) + (p.allowances || 0)).toFixed(2)}
                        </td>
                        <td style={{ padding: '12px 16px', color: '#dc2626', fontFamily: 'monospace', fontWeight: 700 }}>
                          -${((p.deductions || 0) + (p.tax || 0)).toFixed(2)}
                        </td>
                        <td style={{ padding: '12px 16px', color: '#059669', fontFamily: 'monospace', fontWeight: 900, fontSize: '1.05rem' }}>
                          ${p.netSalary.toFixed(2)}
                        </td>
                        <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                          <button
                            onClick={() => {
                              setSelectedPayroll(p);
                              setIsPayslipModalOpen(true);
                            }}
                            className="kh-text"
                            style={{
                              padding: '6px 14px',
                              background: '#ecfdf5',
                              color: '#059669',
                              border: '1px solid #a7f3d0',
                              borderRadius: '8px',
                              fontWeight: 700,
                              fontSize: '0.8rem',
                              cursor: 'pointer',
                            }}
                          >
                            👁️ មើលប័ណ្ណ
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB: PROFILE */}
      {activeTab === 'PROFILE' && (
        <div className="portal-2col-layout">
          {/* Card: Employment Details */}
          <div
            style={{
              background: '#ffffff',
              borderRadius: '24px',
              padding: '24px',
              border: '1px solid #e2e8f0',
              boxShadow: '0 2px 10px rgba(0,0,0,0.02)',
            }}
          >
            <h3 className="kh-text" style={{ margin: '0 0 16px 0', fontSize: '1.1rem', fontWeight: 800, color: '#0f172a' }}>
              ព័ត៌មានការងារ & កិច្ចសន្យា
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '0.86rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: '8px' }}>
                <span className="kh-text" style={{ color: '#64748b' }}>អត្តលេខសម្គាល់</span>
                <strong style={{ fontFamily: 'monospace' }}>{employee.employeeId}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: '8px' }}>
                <span className="kh-text" style={{ color: '#64748b' }}>ផ្នែក / ដេប៉ាតឺម៉ង់</span>
                <strong>{employee.department}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: '8px' }}>
                <span className="kh-text" style={{ color: '#64748b' }}>តួនាទី</span>
                <strong>{employee.position}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: '8px' }}>
                <span className="kh-text" style={{ color: '#64748b' }}>កាលវិភាគវេនការងារ</span>
                <strong style={{ color: '#059669', fontFamily: 'monospace' }}>{employee.shift || 'LF (08:00 AM - 05:00 PM)'}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span className="kh-text" style={{ color: '#64748b' }}>កាលបរិច្ឆេទចូលធ្វើការ</span>
                <strong style={{ fontFamily: 'monospace' }}>
                  {employee.hireDate ? new Date(employee.hireDate).toLocaleDateString() : '-'}
                </strong>
              </div>
            </div>
          </div>

          {/* Card: Loans */}
          <div
            style={{
              background: '#ffffff',
              borderRadius: '24px',
              padding: '24px',
              border: '1px solid #e2e8f0',
              boxShadow: '0 2px 10px rgba(0,0,0,0.02)',
            }}
          >
            <h3 className="kh-text" style={{ margin: '0 0 16px 0', fontSize: '1.1rem', fontWeight: 800, color: '#0f172a' }}>
              ស្ថានភាពប្រាក់កម្ចីបុគ្គលិក
            </h3>
            {activeLoan ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '0.86rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: '8px' }}>
                  <span className="kh-text" style={{ color: '#64748b' }}>កូដកម្ចី</span>
                  <strong style={{ fontFamily: 'monospace' }}>{activeLoan.loanCode}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: '8px' }}>
                  <span className="kh-text" style={{ color: '#64748b' }}>ប្រាក់កម្ចីដើម</span>
                  <strong style={{ fontFamily: 'monospace' }}>${activeLoan.loanAmount.toFixed(2)}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: '8px' }}>
                  <span className="kh-text" style={{ color: '#64748b' }}>កាត់ប្រចាំខែ</span>
                  <strong style={{ color: '#4f46e5', fontFamily: 'monospace' }}>${activeLoan.monthlyDeduction.toFixed(2)}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span className="kh-text" style={{ color: '#64748b' }}>សមតុល្យនៅសល់</span>
                  <strong style={{ color: '#d97706', fontFamily: 'monospace' }}>${activeLoan.remainingBalance.toFixed(2)}</strong>
                </div>
              </div>
            ) : (
              <div style={{ textAlign: 'center', color: '#94a3b8', padding: '20px 0', fontSize: '0.85rem' }}>
                មិនមានកំណត់ត្រាប្រាក់កម្ចីនៅឡើយទេ
              </div>
            )}
          </div>
        </div>
      )}

      {/* 5. MOBILE BOTTOM NAVIGATION BAR (Visible on Mobile Only) */}
      <div
        className="mobile-dock"
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
            width: '100%',
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

          {/* CENTER FLOATING PUNCH BUTTON (👆) */}
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
          <div style={{ background: '#ffffff', borderRadius: '24px', maxWidth: '420px', width: '100%', padding: '24px', boxShadow: '0 20px 40px rgba(0,0,0,0.2)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #f1f5f9', paddingBottom: '12px', marginBottom: '16px' }}>
              <strong className="kh-text" style={{ fontSize: '1rem', color: '#0f172a' }}>ប័ណ្ណបើកប្រាក់បៀវត្ស</strong>
              <button onClick={() => setIsPayslipModalOpen(false)} style={{ background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer', color: '#94a3b8' }}>✕</button>
            </div>

            <div style={{ textAlign: 'center', marginBottom: '16px' }}>
              <div className="kh-text" style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0f172a' }}>
                ខែ {selectedPayroll.month} ឆ្នាំ {selectedPayroll.year}
              </div>
              <div style={{ fontSize: '2rem', fontWeight: 900, color: '#059669', fontFamily: 'monospace', marginTop: '4px' }}>
                ${selectedPayroll.netSalary.toFixed(2)}
              </div>
            </div>

            <div style={{ background: '#f8fafc', borderRadius: '16px', padding: '14px', fontSize: '0.84rem', display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '18px' }}>
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
              style={{ width: '100%', padding: '12px', background: '#059669', color: '#fff', border: 'none', borderRadius: '12px', fontWeight: 700, fontSize: '0.88rem', cursor: 'pointer' }}
            >
              🖨️ បោះពុម្ពប័ណ្ណប្រាក់ខែ
            </button>
          </div>
        </div>
      )}

      {/* LEAVE MODAL */}
      {isLeaveModalOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(15, 23, 42, 0.65)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
          <div style={{ background: '#ffffff', borderRadius: '24px', maxWidth: '420px', width: '100%', padding: '24px', boxShadow: '0 20px 40px rgba(0,0,0,0.2)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #f1f5f9', paddingBottom: '12px', marginBottom: '16px' }}>
              <strong className="kh-text" style={{ fontSize: '1rem', color: '#0f172a' }}>ពាក្យស្នើសុំច្បាប់ឈប់សម្រាក</strong>
              <button onClick={() => setIsLeaveModalOpen(false)} style={{ background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer', color: '#94a3b8' }}>✕</button>
            </div>

            <form onSubmit={handleSubmitLeave} style={{ display: 'flex', flexDirection: 'column', gap: '14px', fontSize: '0.84rem' }}>
              <div>
                <label className="kh-text" style={{ display: 'block', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                  ប្រភេទច្បាប់
                </label>
                <select
                  value={leaveType}
                  onChange={(e) => setLeaveType(e.target.value)}
                  className="kh-text"
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#fff', boxSizing: 'border-box' }}
                >
                  <option value="ANNUAL">ច្បាប់ប្រចាំឆ្នាំ (Annual Leave)</option>
                  <option value="SICK">ច្បាប់ឈឺ (Sick Leave)</option>
                  <option value="SPECIAL">ច្បាប់ពិសេស (Special Leave)</option>
                  <option value="UNPAID">ច្បាប់ឥតប្រាក់ឈ្នួល (Unpaid Leave)</option>
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label className="kh-text" style={{ display: 'block', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>ចាប់ពីថ្ងៃ</label>
                  <input
                    type="date"
                    value={leaveStart}
                    onChange={(e) => setLeaveStart(e.target.value)}
                    required
                    style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', boxSizing: 'border-box', fontFamily: 'monospace' }}
                  />
                </div>
                <div>
                  <label className="kh-text" style={{ display: 'block', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>ដល់ថ្ងៃ</label>
                  <input
                    type="date"
                    value={leaveEnd}
                    onChange={(e) => setLeaveEnd(e.target.value)}
                    required
                    style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', boxSizing: 'border-box', fontFamily: 'monospace' }}
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
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', boxSizing: 'border-box' }}
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="kh-text"
                style={{ width: '100%', padding: '12px', background: '#059669', color: '#fff', border: 'none', borderRadius: '12px', fontWeight: 700, cursor: 'pointer', marginTop: '8px' }}
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
          <div style={{ background: '#ffffff', borderRadius: '24px', maxWidth: '400px', width: '100%', padding: '24px', boxShadow: '0 20px 40px rgba(0,0,0,0.2)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #f1f5f9', paddingBottom: '12px', marginBottom: '16px' }}>
              <strong className="kh-text" style={{ fontSize: '1rem', color: '#0f172a' }}>កាលវិភាគវេនការងារ</strong>
              <button onClick={() => setIsCalendarModalOpen(false)} style={{ background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer', color: '#94a3b8' }}>✕</button>
            </div>
            <div style={{ background: '#ecfdf5', borderRadius: '16px', padding: '16px', marginBottom: '14px' }}>
              <span className="kh-text" style={{ fontSize: '0.78rem', color: '#047857', display: 'block' }}>វេនបច្ចុប្បន្ន</span>
              <strong style={{ fontSize: '1.1rem', color: '#065f46', fontFamily: 'monospace' }}>
                {employee.shift || 'LF (08:00 AM - 05:00 PM)'}
              </strong>
            </div>
            <div className="kh-text" style={{ fontSize: '0.82rem', color: '#64748b', lineHeight: 1.7 }}>
              <p>• ម៉ោងធ្វើការធម្មតា៖ ០៨:០០ ព្រឹក - ០៥:០០ ល្ងាច</p>
              <p>• សម្រាកបាយថ្ងៃត្រង់៖ ១២:០០ ថ្ងៃ - ០១:០០ រសៀល</p>
              <p>• ថ្ងៃឈប់សម្រាកប្រចាំសប្តាហ៍៖ ថ្ងៃអាទិត្យ</p>
            </div>
          </div>
        </div>
      )}

      {/* KPI MODAL */}
      {isKpiModalOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(15, 23, 42, 0.65)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
          <div style={{ background: '#ffffff', borderRadius: '24px', maxWidth: '400px', width: '100%', padding: '24px', boxShadow: '0 20px 40px rgba(0,0,0,0.2)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #f1f5f9', paddingBottom: '12px', marginBottom: '16px' }}>
              <strong className="kh-text" style={{ fontSize: '1rem', color: '#0f172a' }}>តាមដាន KPI</strong>
              <button onClick={() => setIsKpiModalOpen(false)} style={{ background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer', color: '#94a3b8' }}>✕</button>
            </div>
            <div style={{ background: '#ecfdf5', borderRadius: '16px', padding: '24px', textAlign: 'center' }}>
              <span className="kh-text" style={{ fontSize: '0.82rem', color: '#047857' }}>ពិន្ទុ KPI ប្រចាំខែ</span>
              <div style={{ fontSize: '2.8rem', fontWeight: 900, color: '#059669', fontFamily: 'monospace', margin: '6px 0' }}>
                95%
              </div>
              <span className="kh-text" style={{ fontSize: '0.82rem', color: '#047857', fontWeight: 700 }}>
                ចំណាត់ថ្នាក់៖ ល្អប្រសើរ (Excellent)
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
