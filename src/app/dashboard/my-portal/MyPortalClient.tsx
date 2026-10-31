'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Swal from 'sweetalert2';

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
  rateMultiplier?: number;
  reason: string;
  status: string;
}

interface CertificateRecord {
  id: string;
  certificateType: string;
  referenceNo: string;
  purpose: string;
  status: string;
  requestDate: string;
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
  certificateRequests?: CertificateRecord[];
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

  const [activeTab, setActiveTab] = useState<'PAYROLL' | 'ATTENDANCE' | 'REQUESTS' | 'LOANS'>('PAYROLL');
  const [selectedPayroll, setSelectedPayroll] = useState<PayrollRecord | null>(null);
  const [isPayslipModalOpen, setIsPayslipModalOpen] = useState(false);

  // Quick Application Modals
  const [isLeaveModalOpen, setIsLeaveModalOpen] = useState(false);
  const [leaveType, setLeaveType] = useState('ANNUAL');
  const [leaveStart, setLeaveStart] = useState(() => new Date().toISOString().slice(0, 10));
  const [leaveEnd, setLeaveEnd] = useState(() => new Date().toISOString().slice(0, 10));
  const [leaveReason, setLeaveReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!employee) {
    return (
      <div
        style={{
          background: '#ffffff',
          borderRadius: '16px',
          padding: '48px',
          textAlign: 'center',
          border: '1px solid #e2e8f0',
        }}
      >
        <div style={{ fontSize: '48px', marginBottom: '12px' }}>👤</div>
        <h2 style={{ fontSize: '1.3rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
          មិនទាន់បានភ្ជាប់គណនីជាមួយទិន្នន័យបុគ្គលិកនៅឡើយទេ
        </h2>
        <p style={{ color: '#64748b', fontSize: '0.88rem', marginTop: '6px' }}>
          សូមទាក់ទងមកកាន់ផ្នែកធនធានមនុស្ស (HR) ដើម្បីភ្ជាប់គណនី User របស់អ្នកជាមួយអត្តលេខបុគ្គលិក។
        </p>
      </div>
    );
  }

  const empNameKh = `${employee.lastNameKh || ''} ${employee.firstNameKh || ''}`.trim();
  const empNameEn = `${employee.firstNameEn || ''} ${employee.lastNameEn || ''}`.trim();

  // Switch employee preview (for admin/HR)
  const handleSwitchEmployee = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    if (val) {
      router.push(`/dashboard/my-portal?employeeId=${val}`);
    }
  };

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
        text: 'ពាក្យស្នើសុំរបស់អ្នកត្រូវបានបញ្ជូនទៅកាន់ប្រធានផ្នែក និង HR រួចរាល់។',
        confirmButtonColor: '#2563eb',
      }).then(() => router.refresh());
    } catch (err: any) {
      Swal.fire('Error', err.message, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'APPROVED':
      case 'PAID':
        return { label: '✓ បានអនុម័ត / Paid', bg: '#dcfce7', text: '#15803d' };
      case 'PENDING':
        return { label: '⏳ កំពុងរង់ចាំ / Pending', bg: '#fef3c7', text: '#b45309' };
      case 'REJECTED':
        return { label: '✕ បដិសេធ / Rejected', bg: '#fee2e2', text: '#b91c1c' };
      default:
        return { label: status, bg: '#f1f5f9', text: '#475569' };
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* 1. Employee Profile Header Card */}
      <div
        style={{
          background: '#ffffff',
          borderRadius: '20px',
          padding: '28px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.04)',
          border: '1px solid #f1f5f9',
          display: 'flex',
          flexDirection: 'column',
          gap: '20px',
        }}
      >
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '18px' }}>
            {employee.photoUrl ? (
              <img
                src={employee.photoUrl}
                alt=""
                style={{
                  width: '76px',
                  height: '76px',
                  borderRadius: '18px',
                  objectFit: 'cover',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                  border: '2px solid #eff6ff',
                }}
              />
            ) : (
              <div
                style={{
                  width: '76px',
                  height: '76px',
                  borderRadius: '18px',
                  background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '28px',
                  fontWeight: 900,
                  boxShadow: '0 4px 14px rgba(37,99,235,0.3)',
                }}
              >
                {employee.firstNameEn?.[0] || 'E'}
              </div>
            )}

            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h1 style={{ margin: 0, fontSize: '1.45rem', fontWeight: 900, color: '#0f172a' }}>
                  {empNameKh || empNameEn}
                </h1>
                <span
                  style={{
                    background: '#eff6ff',
                    color: '#2563eb',
                    fontFamily: 'monospace',
                    fontWeight: 800,
                    padding: '3px 8px',
                    borderRadius: '6px',
                    fontSize: '0.8rem',
                    border: '1px solid #bfdbfe',
                  }}
                >
                  {employee.employeeId}
                </span>
              </div>
              <div style={{ fontSize: '0.92rem', color: '#64748b', fontWeight: 600 }}>{empNameEn}</div>
              <div style={{ fontSize: '0.82rem', color: '#334155', marginTop: '4px' }}>
                🏢 <strong>{employee.department}</strong> • {employee.position}{' '}
                {employee.phone && <span>• 📞 {employee.phone}</span>}
              </div>
            </div>
          </div>

          {/* Admin / HR Employee Switcher */}
          {isHR && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
              <span style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 700 }}>
                មើលជាបុគ្គលិកផ្សេងទៀត (Admin Preview):
              </span>
              <select
                value={employee.id}
                onChange={handleSwitchEmployee}
                style={{
                  padding: '8px 14px',
                  borderRadius: '10px',
                  border: '1px solid #cbd5e1',
                  background: '#f8fafc',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  outline: 'none',
                }}
              >
                {allEmployees.map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.employeeId} - {e.lastNameKh || ''} {e.firstNameKh || ''} ({e.firstNameEn} {e.lastNameEn}) - {e.department}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* 4 Summary Pills */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: '12px',
            background: '#f8fafc',
            padding: '16px',
            borderRadius: '14px',
            border: '1px solid #e2e8f0',
          }}
        >
          <div>
            <span style={{ fontSize: '0.72rem', color: '#64748b', display: 'block', fontWeight: 600 }}>
              ច្បាប់សម្រាកនៅសល់ (Annual Leave)
            </span>
            <div style={{ fontSize: '1.25rem', fontWeight: 900, color: '#2563eb', marginTop: '2px' }}>
              {employee.annualLeaveDays ?? 18}{' '}
              <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#64748b' }}>ថ្ងៃ</span>
            </div>
          </div>

          <div>
            <span style={{ fontSize: '0.72rem', color: '#64748b', display: 'block', fontWeight: 600 }}>
              ប្រាក់ខែមូលដ្ឋាន (Basic Salary)
            </span>
            <div style={{ fontSize: '1.25rem', fontWeight: 900, color: '#16a34a', marginTop: '2px' }}>
              ${employee.basicSalary?.toFixed(2) || '0.00'}
            </div>
          </div>

          <div>
            <span style={{ fontSize: '0.72rem', color: '#64748b', display: 'block', fontWeight: 600 }}>
              ប្រាក់កម្ចីនៅជំពាក់ (Active Loan)
            </span>
            <div style={{ fontSize: '1.25rem', fontWeight: 900, color: '#d97706', marginTop: '2px' }}>
              ${employee.loans?.find((l) => l.status === 'ACTIVE')?.remainingBalance.toFixed(2) || '0.00'}
            </div>
          </div>

          <div>
            <span style={{ fontSize: '0.72rem', color: '#64748b', display: 'block', fontWeight: 600 }}>
              កាលបរិច្ឆេទចូលធ្វើការ (Hire Date)
            </span>
            <div style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0f172a', marginTop: '4px' }}>
              {employee.hireDate ? new Date(employee.hireDate).toLocaleDateString() : '-'}
            </div>
          </div>
        </div>
      </div>

      {/* 2. Navigation Tabs */}
      <div
        style={{
          display: 'flex',
          gap: '8px',
          borderBottom: '2px solid #e2e8f0',
          paddingBottom: '8px',
          overflowX: 'auto',
        }}
      >
        <button
          onClick={() => setActiveTab('PAYROLL')}
          style={{
            padding: '10px 20px',
            borderRadius: '10px',
            border: 'none',
            background: activeTab === 'PAYROLL' ? '#2563eb' : '#ffffff',
            color: activeTab === 'PAYROLL' ? '#ffffff' : '#64748b',
            fontWeight: 700,
            cursor: 'pointer',
            fontSize: '0.88rem',
            boxShadow: activeTab === 'PAYROLL' ? '0 4px 12px rgba(37,99,235,0.2)' : 'none',
            whiteSpace: 'nowrap',
          }}
        >
          💰 ប័ណ្ណបើកប្រាក់ខែ (My Payslips)
        </button>

        <button
          onClick={() => setActiveTab('ATTENDANCE')}
          style={{
            padding: '10px 20px',
            borderRadius: '10px',
            border: 'none',
            background: activeTab === 'ATTENDANCE' ? '#2563eb' : '#ffffff',
            color: activeTab === 'ATTENDANCE' ? '#ffffff' : '#64748b',
            fontWeight: 700,
            cursor: 'pointer',
            fontSize: '0.88rem',
            boxShadow: activeTab === 'ATTENDANCE' ? '0 4px 12px rgba(37,99,235,0.2)' : 'none',
            whiteSpace: 'nowrap',
          }}
        >
          📅 វត្តមាន & ស្កេនមេដៃ (Attendance & Punches)
        </button>

        <button
          onClick={() => setActiveTab('REQUESTS')}
          style={{
            padding: '10px 20px',
            borderRadius: '10px',
            border: 'none',
            background: activeTab === 'REQUESTS' ? '#2563eb' : '#ffffff',
            color: activeTab === 'REQUESTS' ? '#ffffff' : '#64748b',
            fontWeight: 700,
            cursor: 'pointer',
            fontSize: '0.88rem',
            boxShadow: activeTab === 'REQUESTS' ? '0 4px 12px rgba(37,99,235,0.2)' : 'none',
            whiteSpace: 'nowrap',
          }}
        >
          📝 ស្នើសុំច្បាប់ & ថែមម៉ោង (My Requests Hub)
        </button>

        <button
          onClick={() => setActiveTab('LOANS')}
          style={{
            padding: '10px 20px',
            borderRadius: '10px',
            border: 'none',
            background: activeTab === 'LOANS' ? '#2563eb' : '#ffffff',
            color: activeTab === 'LOANS' ? '#ffffff' : '#64748b',
            fontWeight: 700,
            cursor: 'pointer',
            fontSize: '0.88rem',
            boxShadow: activeTab === 'LOANS' ? '0 4px 12px rgba(37,99,235,0.2)' : 'none',
            whiteSpace: 'nowrap',
          }}
        >
          💳 ប្រាក់កម្ចី & កាត់រំលស់ (My Loans & Deductions)
        </button>
      </div>

      {/* TAB 1: My Payslips */}
      {activeTab === 'PAYROLL' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div
            style={{
              background: '#ffffff',
              borderRadius: '16px',
              border: '1px solid #e2e8f0',
              boxShadow: '0 4px 20px rgba(0,0,0,0.03)',
              overflow: 'hidden',
            }}
          >
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                    <th style={{ padding: '14px 16px' }}>
                      <div style={{ fontWeight: 800, color: '#0f172a', fontSize: '0.88rem' }}>ខែ/ឆ្នាំ</div>
                      <div style={{ fontSize: '0.72rem', color: '#64748b' }}>Month / Year</div>
                      <div style={{ fontSize: '0.68rem', color: '#94a3b8' }}>月份/年份</div>
                    </th>
                    <th style={{ padding: '14px 16px' }}>
                      <div style={{ fontWeight: 800, color: '#0f172a', fontSize: '0.88rem' }}>ប្រាក់ខែមូលដ្ឋាន</div>
                      <div style={{ fontSize: '0.72rem', color: '#64748b' }}>Basic Salary</div>
                      <div style={{ fontSize: '0.68rem', color: '#94a3b8' }}>基本工资</div>
                    </th>
                    <th style={{ padding: '14px 16px' }}>
                      <div style={{ fontWeight: 800, color: '#0f172a', fontSize: '0.88rem' }}>ថែមម៉ោង & ប្រាក់ឧបត្ថម្ភ</div>
                      <div style={{ fontSize: '0.72rem', color: '#64748b' }}>OT & Allowances</div>
                      <div style={{ fontSize: '0.68rem', color: '#94a3b8' }}>加班与津贴</div>
                    </th>
                    <th style={{ padding: '14px 16px' }}>
                      <div style={{ fontWeight: 800, color: '#0f172a', fontSize: '0.88rem' }}>កាត់ប្រាក់</div>
                      <div style={{ fontSize: '0.72rem', color: '#64748b' }}>Deductions</div>
                      <div style={{ fontSize: '0.68rem', color: '#94a3b8' }}>扣款项</div>
                    </th>
                    <th style={{ padding: '14px 16px' }}>
                      <div style={{ fontWeight: 800, color: '#0f172a', fontSize: '0.88rem' }}>ប្រាក់ត្រូវបើកសុទ្ធ</div>
                      <div style={{ fontSize: '0.72rem', color: '#64748b' }}>Net Pay</div>
                      <div style={{ fontSize: '0.68rem', color: '#94a3b8' }}>实发工资</div>
                    </th>
                    <th style={{ padding: '14px 16px', textAlign: 'center' }}>
                      <div style={{ fontWeight: 800, color: '#0f172a', fontSize: '0.88rem' }}>ប័ណ្ណប្រាក់ខែ</div>
                      <div style={{ fontSize: '0.72rem', color: '#64748b' }}>Payslip</div>
                      <div style={{ fontSize: '0.68rem', color: '#94a3b8' }}>工资条</div>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {!employee.payrolls || employee.payrolls.length === 0 ? (
                    <tr>
                      <td colSpan={6} style={{ padding: '40px 16px', textAlign: 'center', color: '#94a3b8' }}>
                        <div style={{ fontSize: '36px', marginBottom: '8px' }}>💰</div>
                        <div style={{ fontWeight: 700, color: '#475569' }}>
                          មិនទាន់មានកំណត់ត្រាបើកប្រាក់បៀវត្សនៅឡើយទេ
                        </div>
                      </td>
                    </tr>
                  ) : (
                    employee.payrolls.map((p, idx) => (
                      <tr
                        key={p.id}
                        style={{
                          borderBottom: '1px solid #f1f5f9',
                          background: idx % 2 === 0 ? '#ffffff' : '#fafafa',
                        }}
                      >
                        <td style={{ padding: '14px 16px', fontWeight: 800, color: '#0f172a' }}>
                          ខែ {p.month} ឆ្នាំ {p.year}
                        </td>
                        <td style={{ padding: '14px 16px', fontWeight: 700, color: '#334155' }}>
                          ${p.basicSalary.toFixed(2)}
                        </td>
                        <td style={{ padding: '14px 16px', color: '#16a34a', fontWeight: 700 }}>
                          +${((p.otPay || 0) + (p.allowances || 0) + (p.bonus || 0)).toFixed(2)}
                        </td>
                        <td style={{ padding: '14px 16px', color: '#dc2626', fontWeight: 700 }}>
                          -${((p.deductions || 0) + (p.tax || 0)).toFixed(2)}
                        </td>
                        <td style={{ padding: '14px 16px', fontWeight: 900, color: '#2563eb', fontSize: '1.05rem' }}>
                          ${p.netSalary.toFixed(2)}
                        </td>
                        <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                          <button
                            onClick={() => {
                              setSelectedPayroll(p);
                              setIsPayslipModalOpen(true);
                            }}
                            style={{
                              background: '#eff6ff',
                              border: '1px solid #bfdbfe',
                              color: '#1d4ed8',
                              padding: '6px 14px',
                              borderRadius: '8px',
                              fontWeight: 700,
                              fontSize: '0.82rem',
                              cursor: 'pointer',
                            }}
                          >
                            👁️ មើលប័ណ្ណប្រាក់ខែ
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

      {/* TAB 2: Attendance & Punches */}
      {activeTab === 'ATTENDANCE' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
          {/* Monthly Attendances Table */}
          <div
            style={{
              background: '#ffffff',
              borderRadius: '16px',
              padding: '20px',
              border: '1px solid #e2e8f0',
              boxShadow: '0 4px 14px rgba(0,0,0,0.03)',
            }}
          >
            <h3 style={{ margin: '0 0 14px 0', fontSize: '1.05rem', fontWeight: 800, color: '#0f172a' }}>
              📊 សង្ខេបវត្តមានប្រចាំខែ (Monthly Timesheets)
            </h3>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                <thead>
                  <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                    <th style={{ padding: '10px', textAlign: 'left' }}>ខែ/ឆ្នាំ</th>
                    <th style={{ padding: '10px', textAlign: 'center' }}>ថ្ងៃធ្វើការ</th>
                    <th style={{ padding: '10px', textAlign: 'center' }}>ច្បាប់</th>
                    <th style={{ padding: '10px', textAlign: 'center' }}>អវត្តមាន</th>
                    <th style={{ padding: '10px', textAlign: 'center' }}>ថែមម៉ោង</th>
                  </tr>
                </thead>
                <tbody>
                  {!employee.attendances || employee.attendances.length === 0 ? (
                    <tr>
                      <td colSpan={5} style={{ padding: '24px', textAlign: 'center', color: '#94a3b8' }}>
                        គ្មានទិន្នន័យ
                      </td>
                    </tr>
                  ) : (
                    employee.attendances.map((att) => (
                      <tr key={att.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '10px', fontWeight: 700 }}>
                          ខែ {att.month}/{att.year}
                        </td>
                        <td style={{ padding: '10px', textAlign: 'center', fontWeight: 700, color: '#16a34a' }}>
                          {att.daysWorked} ថ្ងៃ
                        </td>
                        <td style={{ padding: '10px', textAlign: 'center', color: '#d97706' }}>
                          {att.leaveDays} ថ្ងៃ
                        </td>
                        <td style={{ padding: '10px', textAlign: 'center', color: '#dc2626' }}>
                          {att.absentDays} ថ្ងៃ
                        </td>
                        <td style={{ padding: '10px', textAlign: 'center', fontWeight: 700, color: '#2563eb' }}>
                          {att.otHours}h
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Recent Biometric Punches */}
          <div
            style={{
              background: '#ffffff',
              borderRadius: '16px',
              padding: '20px',
              border: '1px solid #e2e8f0',
              boxShadow: '0 4px 14px rgba(0,0,0,0.03)',
            }}
          >
            <h3 style={{ margin: '0 0 14px 0', fontSize: '1.05rem', fontWeight: 800, color: '#0f172a' }}>
              📲 កំណត់ត្រាស្កេនមេដៃថ្មីៗ (Recent Punches)
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '340px', overflowY: 'auto' }}>
              {!employee.biometricLogs || employee.biometricLogs.length === 0 ? (
                <div style={{ padding: '24px', textAlign: 'center', color: '#94a3b8' }}>
                  មិនទាន់មានកំណត់ត្រាស្កេនទេ
                </div>
              ) : (
                employee.biometricLogs.map((p) => {
                  const d = new Date(p.punchTime);
                  return (
                    <div
                      key={p.id}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '10px 14px',
                        background: '#f8fafc',
                        borderRadius: '10px',
                        border: '1px solid #f1f5f9',
                        fontSize: '0.82rem',
                      }}
                    >
                      <div>
                        <span style={{ fontWeight: 800, color: '#0f172a', display: 'block' }}>
                          {p.punchType === 'CHECK_IN'
                            ? '☀️ ស្កេនចូលព្រឹក'
                            : p.punchType === 'CHECK_OUT'
                            ? '🌙 ស្កេនចេញល្ងាច'
                            : p.punchType}
                        </span>
                        <span style={{ fontSize: '0.72rem', color: '#64748b' }}>
                          {d.toLocaleDateString()} • {p.verifyMode}
                        </span>
                      </div>
                      <div style={{ fontFamily: 'monospace', fontWeight: 800, color: '#2563eb', fontSize: '0.95rem' }}>
                        {d.toTimeString().slice(0, 8)}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: Requests Hub */}
      {activeTab === 'REQUESTS' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Header toolbar */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: '#0f172a' }}>
              ប្រវត្តិពាក្យស្នើសុំច្បាប់ និងថែមម៉ោង (My Request History)
            </h3>
            <button
              onClick={() => setIsLeaveModalOpen(true)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
                color: '#ffffff',
                border: 'none',
                borderRadius: '10px',
                padding: '10px 18px',
                fontWeight: 700,
                fontSize: '0.88rem',
                cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(37,99,235,0.25)',
              }}
            >
              <span>➕</span> ដាក់ពាក្យស្នើសុំច្បាប់ (Apply Leave)
            </button>
          </div>

          {/* Leave Requests Table */}
          <div
            style={{
              background: '#ffffff',
              borderRadius: '16px',
              border: '1px solid #e2e8f0',
              overflow: 'hidden',
            }}
          >
            <div style={{ padding: '14px 18px', background: '#f8fafc', borderBottom: '1px solid #e2e8f0', fontWeight: 800, fontSize: '0.9rem' }}>
              🌴 ពាក្យស្នើសុំច្បាប់ឈប់សម្រាក (Leave Requests)
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
              <thead>
                <tr style={{ background: '#ffffff', borderBottom: '1px solid #e2e8f0', color: '#64748b' }}>
                  <th style={{ padding: '12px 16px' }}>ប្រភេទច្បាប់</th>
                  <th style={{ padding: '12px 16px' }}>កាលបរិច្ឆេទ</th>
                  <th style={{ padding: '12px 16px' }}>ចំនួនថ្ងៃ</th>
                  <th style={{ padding: '12px 16px' }}>មូលហេតុ</th>
                  <th style={{ padding: '12px 16px' }}>ស្ថានភាព</th>
                </tr>
              </thead>
              <tbody>
                {!employee.leaveRequests || employee.leaveRequests.length === 0 ? (
                  <tr>
                    <td colSpan={5} style={{ padding: '24px', textAlign: 'center', color: '#94a3b8' }}>
                      មិនទាន់មានពាក្យស្នើសុំច្បាប់ទេ
                    </td>
                  </tr>
                ) : (
                  employee.leaveRequests.map((l) => {
                    const badge = getStatusBadge(l.status);
                    return (
                      <tr key={l.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '12px 16px', fontWeight: 700, color: '#0f172a' }}>{l.leaveType}</td>
                        <td style={{ padding: '12px 16px' }}>
                          {new Date(l.startDate).toLocaleDateString()} ដល់ {new Date(l.endDate).toLocaleDateString()}
                        </td>
                        <td style={{ padding: '12px 16px', fontWeight: 800 }}>{l.days} ថ្ងៃ</td>
                        <td style={{ padding: '12px 16px', color: '#64748b' }}>{l.reason}</td>
                        <td style={{ padding: '12px 16px' }}>
                          <span
                            style={{
                              background: badge.bg,
                              color: badge.text,
                              padding: '3px 8px',
                              borderRadius: '6px',
                              fontWeight: 700,
                              fontSize: '0.72rem',
                            }}
                          >
                            {badge.label}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Overtime Requests Table */}
          <div
            style={{
              background: '#ffffff',
              borderRadius: '16px',
              border: '1px solid #e2e8f0',
              overflow: 'hidden',
            }}
          >
            <div style={{ padding: '14px 18px', background: '#f8fafc', borderBottom: '1px solid #e2e8f0', fontWeight: 800, fontSize: '0.9rem' }}>
              ⏰ ពាក្យស្នើសុំថែមម៉ោង (Overtime Requests)
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
              <thead>
                <tr style={{ background: '#ffffff', borderBottom: '1px solid #e2e8f0', color: '#64748b' }}>
                  <th style={{ padding: '12px 16px' }}>កាលបរិច្ឆេទ</th>
                  <th style={{ padding: '12px 16px' }}>ម៉ោងថែម</th>
                  <th style={{ padding: '12px 16px' }}>មេគុណ (Rate)</th>
                  <th style={{ padding: '12px 16px' }}>មូលហេតុ</th>
                  <th style={{ padding: '12px 16px' }}>ស្ថានភាព</th>
                </tr>
              </thead>
              <tbody>
                {!employee.overtimeRequests || employee.overtimeRequests.length === 0 ? (
                  <tr>
                    <td colSpan={5} style={{ padding: '24px', textAlign: 'center', color: '#94a3b8' }}>
                      មិនទាន់មានពាក្យថែមម៉ោងទេ
                    </td>
                  </tr>
                ) : (
                  employee.overtimeRequests.map((ot) => {
                    const badge = getStatusBadge(ot.status);
                    return (
                      <tr key={ot.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '12px 16px', fontWeight: 700 }}>
                          {ot.otDate ? new Date(ot.otDate).toLocaleDateString() : '-'}
                        </td>
                        <td style={{ padding: '12px 16px', fontWeight: 800, color: '#2563eb' }}>
                          {ot.totalHours} ម៉ោង ({ot.startTime} - {ot.endTime})
                        </td>
                        <td style={{ padding: '12px 16px', fontWeight: 700 }}>{ot.rateMultiplier || 1.5}x</td>
                        <td style={{ padding: '12px 16px', color: '#64748b' }}>{ot.reason}</td>
                        <td style={{ padding: '12px 16px' }}>
                          <span
                            style={{
                              background: badge.bg,
                              color: badge.text,
                              padding: '3px 8px',
                              borderRadius: '6px',
                              fontWeight: 700,
                              fontSize: '0.72rem',
                            }}
                          >
                            {badge.label}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: Loans */}
      {activeTab === 'LOANS' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {!employee.loans || employee.loans.length === 0 ? (
            <div
              style={{
                background: '#ffffff',
                borderRadius: '16px',
                padding: '40px',
                textAlign: 'center',
                border: '1px solid #e2e8f0',
                color: '#64748b',
              }}
            >
              <div style={{ fontSize: '40px', marginBottom: '8px' }}>💳</div>
              <div style={{ fontWeight: 700, fontSize: '1rem', color: '#0f172a' }}>
                មិនមានកំណត់ត្រាប្រាក់កម្ចីបុគ្គលិកទេ (No Active Loans)
              </div>
            </div>
          ) : (
            employee.loans.map((loan) => {
              const progressPct =
                loan.loanAmount > 0
                  ? Math.min(100, Math.round((loan.totalRepaid / loan.loanAmount) * 100))
                  : 0;

              return (
                <div
                  key={loan.id}
                  style={{
                    background: '#ffffff',
                    borderRadius: '16px',
                    padding: '24px',
                    border: '1px solid #e2e8f0',
                    boxShadow: '0 4px 14px rgba(0,0,0,0.03)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '16px',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <span
                        style={{
                          background: '#eff6ff',
                          color: '#2563eb',
                          fontFamily: 'monospace',
                          fontWeight: 800,
                          padding: '3px 8px',
                          borderRadius: '6px',
                          fontSize: '0.8rem',
                          border: '1px solid #bfdbfe',
                        }}
                      >
                        {loan.loanCode}
                      </span>
                      <h4 style={{ margin: '6px 0 0 0', fontWeight: 800, fontSize: '1.05rem', color: '#0f172a' }}>
                        {loan.purpose}
                      </h4>
                    </div>

                    <span
                      style={{
                        background: loan.status === 'ACTIVE' ? '#e0f2fe' : '#dcfce7',
                        color: loan.status === 'ACTIVE' ? '#0284c7' : '#15803d',
                        padding: '4px 10px',
                        borderRadius: '8px',
                        fontWeight: 700,
                        fontSize: '0.8rem',
                      }}
                    >
                      {loan.status === 'ACTIVE' ? 'កំពុងកាត់រំលស់ (ACTIVE)' : 'បានសងរួចរាល់ (PAID OFF)'}
                    </span>
                  </div>

                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
                      gap: '12px',
                      background: '#f8fafc',
                      padding: '14px',
                      borderRadius: '12px',
                      fontSize: '0.82rem',
                    }}
                  >
                    <div>
                      <span style={{ color: '#64748b' }}>ប្រាក់កម្ចីដើម:</span>
                      <strong style={{ display: 'block', fontSize: '1.05rem', color: '#0f172a' }}>
                        ${loan.loanAmount.toFixed(2)}
                      </strong>
                    </div>
                    <div>
                      <span style={{ color: '#64748b' }}>កាត់ប្រចាំខែ:</span>
                      <strong style={{ display: 'block', fontSize: '1.05rem', color: '#4338ca' }}>
                        ${loan.monthlyDeduction.toFixed(2)}
                      </strong>
                    </div>
                    <div>
                      <span style={{ color: '#64748b' }}>បានសងសរុប:</span>
                      <strong style={{ display: 'block', fontSize: '1.05rem', color: '#16a34a' }}>
                        ${loan.totalRepaid.toFixed(2)}
                      </strong>
                    </div>
                    <div>
                      <span style={{ color: '#64748b' }}>សមតុល្យនៅសល់:</span>
                      <strong style={{ display: 'block', fontSize: '1.05rem', color: '#d97706' }}>
                        ${loan.remainingBalance.toFixed(2)}
                      </strong>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', marginBottom: '6px' }}>
                      <span style={{ fontWeight: 600, color: '#64748b' }}>ដំណើរការសងរំលស់</span>
                      <strong style={{ color: '#2563eb' }}>{progressPct}% រួចរាល់</strong>
                    </div>
                    <div style={{ width: '100%', height: '8px', background: '#e2e8f0', borderRadius: '999px', overflow: 'hidden' }}>
                      <div
                        style={{
                          width: `${progressPct}%`,
                          height: '100%',
                          background: progressPct === 100 ? '#10b981' : '#2563eb',
                        }}
                      />
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* MODAL 1: Digital Printable Payslip Slip Modal */}
      {isPayslipModalOpen && selectedPayroll && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 999,
            background: 'rgba(15, 23, 42, 0.75)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
            overflowY: 'auto',
          }}
        >
          <div
            style={{
              background: '#ffffff',
              borderRadius: '20px',
              maxWidth: '560px',
              width: '100%',
              padding: '32px',
              boxShadow: '0 20px 40px rgba(0,0,0,0.25)',
              border: '1px solid #e2e8f0',
              maxHeight: '90vh',
              overflowY: 'auto',
            }}
          >
            {/* Toolbar */}
            <div
              className="no-print"
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                borderBottom: '1px solid #e2e8f0',
                paddingBottom: '12px',
                marginBottom: '20px',
              }}
            >
              <span style={{ fontWeight: 800, fontSize: '0.9rem', color: '#0f172a' }}>
                ប័ណ្ណបើកប្រាក់បៀវត្សឌីជីថល (Digital Payslip)
              </span>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={() => window.print()}
                  style={{
                    padding: '6px 14px',
                    background: '#2563eb',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '8px',
                    fontWeight: 700,
                    fontSize: '0.82rem',
                    cursor: 'pointer',
                  }}
                >
                  🖨️ បោះពុម្ព
                </button>
                <button
                  onClick={() => setIsPayslipModalOpen(false)}
                  style={{
                    padding: '6px 12px',
                    border: '1px solid #cbd5e1',
                    background: '#ffffff',
                    color: '#64748b',
                    borderRadius: '8px',
                    fontSize: '0.82rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  បិទ
                </button>
              </div>
            </div>

            {/* Slip Content */}
            <div style={{ color: '#0f172a', lineHeight: 1.6 }}>
              <div style={{ textAlign: 'center', marginBottom: '16px' }}>
                <h2 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 900 }}>ប័ណ្ណបើកប្រាក់បៀវត្ស</h2>
                <div style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 600 }}>
                  MONTHLY SALARY PAYSLIP • 工资发放单
                </div>
                <div style={{ fontSize: '0.85rem', fontWeight: 800, color: '#2563eb', marginTop: '4px' }}>
                  ប្រចាំខែ {selectedPayroll.month} ឆ្នាំ {selectedPayroll.year}
                </div>
              </div>

              {/* Employee Summary */}
              <div
                style={{
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '10px',
                  padding: '12px 14px',
                  fontSize: '0.82rem',
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '8px',
                  marginBottom: '16px',
                }}
              >
                <div>ឈ្មោះ: <strong>{empNameKh || empNameEn}</strong></div>
                <div>អត្តលេខ: <strong>{employee.employeeId}</strong></div>
                <div>ផ្នែក: <strong>{employee.department}</strong></div>
                <div>តួនាទី: <strong>{employee.position}</strong></div>
              </div>

              {/* Salary Breakdown */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.85rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: '6px' }}>
                  <span style={{ color: '#334155' }}>ប្រាក់ខែមូលដ្ឋាន (Basic Salary):</span>
                  <strong>${selectedPayroll.basicSalary.toFixed(2)}</strong>
                </div>
                {/* Overtime with breakdown */}
                {((selectedPayroll.otPay || 0) > 0 || (selectedPayroll.totalOtHours || 0) > 0) ? (
                  <div style={{ borderBottom: '1px solid #f1f5f9', paddingBottom: '6px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: '#16a34a', fontWeight: 600 }}>
                        ប្រាក់ថែមម៉ោងសរុប (Total OT: {selectedPayroll.totalOtHours || 0} ម៉ោង):
                      </span>
                      <strong style={{ color: '#16a34a' }}>+${(selectedPayroll.otPay || 0).toFixed(2)}</strong>
                    </div>
                    <div style={{ paddingLeft: '8px', margin: '3px 0 1px 4px', borderLeft: '2px solid #cbd5e1', fontSize: '0.78rem', color: '#64748b', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>• ធម្មតា (Normal 1.5x: {selectedPayroll.otHours || 0} ម៉ោង)</span>
                        <span>${(selectedPayroll.otWage || 0).toFixed(2)}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>• បុណ្យជាតិ/អាទិត្យ (Sun/Hol 2.0x: {selectedPayroll.sunOtHours || 0} ម៉ោង)</span>
                        <span>${(selectedPayroll.sunOtWage || 0).toFixed(2)}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>• វេនយប់ (Night 2.0x: {selectedPayroll.nightOtHours || 0} ម៉ោង)</span>
                        <span>${(selectedPayroll.nightOtWage || 0).toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: '6px' }}>
                    <span style={{ color: '#64748b' }}>ប្រាក់ថែមម៉ោង (OT: 0 ម៉ោង):</span>
                    <span>$0.00</span>
                  </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: '6px' }}>
                  <span style={{ color: '#16a34a' }}>ប្រាក់ឧបត្ថម្ភ & ប្រាក់រង្វាន់ (Allowances):</span>
                  <strong style={{ color: '#16a34a' }}>+${((selectedPayroll.allowances || 0) + (selectedPayroll.bonus || 0)).toFixed(2)}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: '6px' }}>
                  <span style={{ color: '#dc2626' }}>កាត់ប្រាក់ផ្សេងៗ (Deductions):</span>
                  <strong style={{ color: '#dc2626' }}>-${(selectedPayroll.deductions || 0).toFixed(2)}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: '6px' }}>
                  <span style={{ color: '#dc2626' }}>ពន្ធលើប្រាក់បៀវត្ស (Salary Tax):</span>
                  <strong style={{ color: '#dc2626' }}>-${(selectedPayroll.tax || 0).toFixed(2)}</strong>
                </div>

                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    background: '#eff6ff',
                    padding: '12px 14px',
                    borderRadius: '10px',
                    marginTop: '8px',
                  }}
                >
                  <span style={{ fontWeight: 800, color: '#1e3a8a', fontSize: '0.95rem' }}>
                    ប្រាក់ត្រូវបើកសុទ្ធ (NET PAY):
                  </span>
                  <span style={{ fontWeight: 900, color: '#1d4ed8', fontSize: '1.3rem' }}>
                    ${selectedPayroll.netSalary.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: Apply Leave Modal */}
      {isLeaveModalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 999,
            background: 'rgba(15, 23, 42, 0.65)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
          }}
        >
          <div
            style={{
              background: '#ffffff',
              borderRadius: '20px',
              maxWidth: '480px',
              width: '100%',
              padding: '26px',
              boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
              border: '1px solid #e2e8f0',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                borderBottom: '1px solid #e2e8f0',
                paddingBottom: '12px',
                marginBottom: '16px',
              }}
            >
              <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: '#0f172a' }}>
                ពាក្យស្នើសុំច្បាប់ឈប់សម្រាក (Apply Leave)
              </h3>
              <button
                onClick={() => setIsLeaveModalOpen(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '24px',
                  color: '#94a3b8',
                  cursor: 'pointer',
                }}
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleSubmitLeave} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                  ប្រភេទច្បាប់ *
                </label>
                <select
                  value={leaveType}
                  onChange={(e) => setLeaveType(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '10px',
                    border: '1px solid #cbd5e1',
                    fontSize: '0.88rem',
                    background: '#ffffff',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                >
                  <option value="ANNUAL">ច្បាប់ប្រចាំឆ្នាំ (Annual Leave)</option>
                  <option value="SICK">ច្បាប់ឈឺ (Sick Leave)</option>
                  <option value="SPECIAL">ច្បាប់ពិសេស (Special Leave)</option>
                  <option value="UNPAID">ច្បាប់ឥតប្រាក់ឈ្នួល (Unpaid Leave)</option>
                  <option value="MATERNITY">ច្បាប់លំហែមាតុភាព (Maternity Leave)</option>
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                    ចាប់ពីថ្ងៃ *
                  </label>
                  <input
                    type="date"
                    required
                    value={leaveStart}
                    onChange={(e) => setLeaveStart(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: '10px',
                      border: '1px solid #cbd5e1',
                      fontSize: '0.88rem',
                      outline: 'none',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                    ដល់ថ្ងៃ *
                  </label>
                  <input
                    type="date"
                    required
                    value={leaveEnd}
                    onChange={(e) => setLeaveEnd(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: '10px',
                      border: '1px solid #cbd5e1',
                      fontSize: '0.88rem',
                      outline: 'none',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                  មូលហេតុនៃការសុំច្បាប់ *
                </label>
                <textarea
                  required
                  rows={3}
                  value={leaveReason}
                  onChange={(e) => setLeaveReason(e.target.value)}
                  placeholder="សូមបញ្ជាក់មូលហេតុ..."
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '10px',
                    border: '1px solid #cbd5e1',
                    fontSize: '0.88rem',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button
                  type="button"
                  onClick={() => setIsLeaveModalOpen(false)}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    background: '#ffffff',
                    color: '#64748b',
                    fontSize: '0.85rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  បោះបង់
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  style={{
                    padding: '8px 18px',
                    borderRadius: '8px',
                    border: 'none',
                    background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
                    color: '#ffffff',
                    fontSize: '0.85rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  {isSubmitting ? 'កំពុងបញ្ជូន...' : 'បញ្ជូនពាក្យស្នើសុំ'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
