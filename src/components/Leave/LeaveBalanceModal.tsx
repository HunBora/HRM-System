'use client';

import React, { useState, useMemo, useEffect } from 'react';
import Swal from 'sweetalert2';

export interface LeaveRecordItem {
  id: string;
  leaveType: string;
  startDate: string;
  endDate: string;
  days: number;
  reason?: string;
  status: string;
  createdAt?: string;
}

interface LeaveBalanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  employeeId: string;
  employeeName: string;
  hireDate?: string | null;
  baseAnnualLeaveDays?: number;
  initialRequests?: LeaveRecordItem[];
  onSuccess?: () => void;
}

export default function LeaveBalanceModal({
  isOpen,
  onClose,
  employeeId,
  employeeName,
  hireDate,
  baseAnnualLeaveDays = 18,
  initialRequests = [],
  onSuccess,
}: LeaveBalanceModalProps) {
  const currentSystemYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState<number>(() => {
    // Default to 2026 if today is in 2026, or current year
    return currentSystemYear === 2026 ? 2026 : currentSystemYear;
  });

  const [showApplyForm, setShowApplyForm] = useState(false);
  const [leaveRequests, setLeaveRequests] = useState<LeaveRecordItem[]>(initialRequests);
  const [loading, setLoading] = useState(false);

  // Form State
  const [formType, setFormType] = useState<'ANNUAL' | 'SPECIAL' | 'SICK' | 'CERTIFIED_SICK' | 'UNPAID'>('ANNUAL');
  const [formStart, setFormStart] = useState(() => new Date().toISOString().slice(0, 10));
  const [formEnd, setFormEnd] = useState(() => new Date().toISOString().slice(0, 10));
  const [formReason, setFormReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch updated leave data when year or employeeId changes
  useEffect(() => {
    if (!isOpen || !employeeId) return;

    let isMounted = true;
    setLoading(true);

    fetch(`/api/leave?employeeId=${employeeId}&year=${selectedYear}`)
      .then((res) => res.json())
      .then((data) => {
        if (isMounted && data.success && data.requests) {
          const mapped: LeaveRecordItem[] = data.requests.map((r: any) => ({
            id: r.id,
            leaveType: r.leaveType,
            startDate: r.startDate,
            endDate: r.endDate,
            days: r.duration || 1,
            reason: r.reason,
            status: r.status,
            createdAt: r.createdAt,
          }));
          setLeaveRequests(mapped);
        }
      })
      .catch((err) => console.error('Failed to fetch leave balance:', err))
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [isOpen, employeeId, selectedYear]);

  // Calculate Seniority and Labor Law Entitlements
  const laborLawMetrics = useMemo(() => {
    let yearsOfService = 0;
    if (hireDate) {
      const hire = new Date(hireDate);
      const targetYearEnd = new Date(selectedYear, 11, 31);
      const diffMs = targetYearEnd.getTime() - hire.getTime();
      yearsOfService = Math.max(0, Math.floor(diffMs / (365.25 * 24 * 60 * 60 * 1000)));
    }

    // Article 166: 1 day extra for every 3 years of service
    const seniorityBonus = Math.floor(yearsOfService / 3);
    const annualEntitled = (baseAnnualLeaveDays || 18) + seniorityBonus;

    // Filter requests for selected year (excluding rejected)
    const yearReqs = leaveRequests.filter((r) => {
      const rYear = new Date(r.startDate).getFullYear();
      return rYear === selectedYear && r.status !== 'REJECTED';
    });

    const annualUsed = yearReqs
      .filter((r) => r.leaveType === 'ANNUAL')
      .reduce((sum, r) => sum + (r.days || 1), 0);

    const specialUsed = yearReqs
      .filter((r) => r.leaveType === 'SPECIAL' || r.leaveType === 'SICK')
      .reduce((sum, r) => sum + (r.days || 1), 0);

    const certifiedSickUsed = yearReqs
      .filter((r) => r.leaveType === 'CERTIFIED_SICK')
      .reduce((sum, r) => sum + (r.days || 1), 0);

    const unpaidUsed = yearReqs
      .filter((r) => r.leaveType === 'UNPAID')
      .reduce((sum, r) => sum + (r.days || 1), 0);

    // Entitlements
    const specialEntitled = 7.0; // Article 171: 7 days special leave
    const certifiedSickEntitled = 0.0;
    const unpaidEntitled = 0.0;

    // Remaining calculations
    const annualRemaining = Math.max(0, parseFloat((annualEntitled - annualUsed).toFixed(1)));
    const specialRemaining = Math.max(0, parseFloat((specialEntitled - specialUsed).toFixed(1)));
    const certifiedSickRemaining = 0.0;
    const unpaidRemaining = 0.0;

    return {
      yearsOfService,
      seniorityBonus,
      annual: {
        title: 'ច្បាប់សម្រាកប្រចាំឆ្នាំ',
        entitled: annualEntitled,
        used: annualUsed,
        remaining: annualRemaining,
        forward1: 0.0,
        forward2: 0.0,
        forward3: 0.0,
        lawNote: 'មាត្រា ១៦៦: ១៨ ថ្ងៃ/ឆ្នាំ (+១ ថ្ងៃរាល់ ៣ ឆ្នាំអតីតភាព)',
      },
      certifiedSick: {
        title: 'ច្បាប់សម្រាកមានវេជ្ជបញ្ជា',
        entitled: certifiedSickEntitled,
        used: certifiedSickUsed,
        remaining: certifiedSickRemaining,
        forward1: 0.0,
        forward2: 0.0,
        forward3: 0.0,
        lawNote: 'មានលិខិតបញ្ជាក់ពីគ្រូពេទ្យស្របច្បាប់ (Internal Regulations)',
      },
      special: {
        title: 'ច្បាប់សម្រាកឈឺ/ច្បាប់សម្រាកពិសេស',
        entitled: specialEntitled,
        used: specialUsed,
        remaining: specialRemaining,
        forward1: 0.0,
        forward2: 0.0,
        forward3: 0.0,
        lawNote: 'មាត្រា ១៧១: អនុញ្ញាត ៧ ថ្ងៃ/ឆ្នាំ (រៀបការ មរណភាព សម្រាលបុត្រ...)',
      },
      unpaid: {
        title: 'ច្បាប់សម្រាកឥតប្រាក់ឈ្នួល',
        entitled: unpaidEntitled,
        used: unpaidUsed,
        remaining: unpaidRemaining,
        forward1: 0.0,
        forward2: 0.0,
        forward3: 0.0,
        lawNote: 'ផ្អែកលើការព្រមព្រៀងរវាងនិយោជក និងនិយោជិត',
      },
    };
  }, [hireDate, selectedYear, baseAnnualLeaveDays, leaveRequests]);

  // Calculate requested duration in working days (excluding Sundays)
  const formDuration = useMemo(() => {
    if (!formStart || !formEnd) return 0;
    const s = new Date(formStart);
    const e = new Date(formEnd);
    if (e < s) return 0;

    let count = 0;
    const cur = new Date(s);
    while (cur <= e) {
      if (cur.getDay() !== 0) {
        count += 1;
      }
      cur.setDate(cur.getDate() + 1);
    }
    return count === 0 ? 1 : count;
  }, [formStart, formEnd]);

  // Current balance for the selected form leave type
  const activeBalanceCheck = useMemo(() => {
    if (formType === 'ANNUAL') {
      const remaining = laborLawMetrics.annual.remaining;
      const isExceeded = formDuration > remaining;
      return {
        remaining,
        isExceeded,
        afterRemaining: Math.max(0, remaining - formDuration),
        warning: isExceeded
          ? `⚠️ ចំនួនស្នើសុំ (${formDuration} ថ្ងៃ) លើសពីសមតុល្យច្បាប់ប្រចាំឆ្នាំដែលនៅសល់ (${remaining} ថ្ងៃ) តាមច្បាប់ការងារ!`
          : null,
      };
    }
    if (formType === 'SPECIAL' || formType === 'SICK') {
      const remaining = laborLawMetrics.special.remaining;
      const isExceeded = formDuration > remaining;
      return {
        remaining,
        isExceeded,
        afterRemaining: Math.max(0, remaining - formDuration),
        warning: isExceeded
          ? `⚠️ ចំនួនស្នើសុំ (${formDuration} ថ្ងៃ) លើសពីសមតុល្យច្បាប់ពិសេសមាត្រា ១៧១ (${remaining} ថ្ងៃ) ដែលនៅសល់!`
          : null,
      };
    }
    return {
      remaining: 0,
      isExceeded: false,
      afterRemaining: 0,
      warning: null,
    };
  }, [formType, formDuration, laborLawMetrics]);

  // Handle Form Submit
  const handleApplyLeave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (activeBalanceCheck.isExceeded) {
      Swal.fire({
        icon: 'warning',
        title: 'លើសសមតុល្យច្បាប់ការងារ',
        text: activeBalanceCheck.warning || 'ចំនួនថ្ងៃស្នើសុំលើសពីសមតុល្យនៅសល់!',
        confirmButtonColor: '#059669',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/leave', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employeeId,
          leaveType: formType,
          startDate: formStart,
          endDate: formEnd,
          reason: formReason,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'បរាជ័យក្នុងការដាក់ពាក្យស្នើសុំច្បាប់');
      }

      Swal.fire({
        icon: 'success',
        title: 'បានដាក់ពាក្យស្នើសុំច្បាប់ជោគជ័យ!',
        text: 'ពាក្យស្នើសុំត្រូវបានកត់ត្រា និងផ្ញើសេចក្តីជូនដំណឹងតាម Telegram រួចរាល់។',
        confirmButtonColor: '#059669',
      });

      // Update local state
      setLeaveRequests((prev) => [
        {
          id: data.leaveRequest.id,
          leaveType: data.leaveRequest.leaveType,
          startDate: data.leaveRequest.startDate,
          endDate: data.leaveRequest.endDate,
          days: data.leaveRequest.duration,
          reason: data.leaveRequest.reason,
          status: data.leaveRequest.status,
          createdAt: data.leaveRequest.createdAt,
        },
        ...prev,
      ]);

      setShowApplyForm(false);
      setFormReason('');
      if (onSuccess) onSuccess();
    } catch (err: any) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: err.message || 'មានបញ្ហាក្នុងការដាក់ស្នើ',
        confirmButtonColor: '#ef4444',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const years = [2024, 2025, 2026, 2027, 2028];

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        background: 'rgba(15, 23, 42, 0.65)',
        backdropFilter: 'blur(5px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 0,
      }}
    >
      <div
        className="leave-balance-modal-content"
        style={{
          width: '100%',
          maxWidth: '520px',
          height: '100vh',
          maxHeight: '94vh',
          background: '#f8fafc',
          borderRadius: '24px',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          overflow: 'hidden',
          border: '1px solid #e2e8f0',
        }}
      >
        <style>{`
          @media (max-width: 640px) {
            .leave-balance-modal-content {
              max-height: 100vh !important;
              height: 100vh !important;
              border-radius: 0 !important;
              border: none !important;
            }
          }

          .leave-balance-card {
            background: #ffffff;
            border-radius: 20px;
            padding: 16px 20px;
            box-shadow: 0 2px 10px rgba(0, 0, 0, 0.03);
            border: 1px solid #f1f5f9;
            margin-bottom: 14px;
            transition: transform 0.15s ease, box-shadow 0.15s ease;
          }
          .leave-balance-card:hover {
            box-shadow: 0 4px 16px rgba(0, 0, 0, 0.06);
          }
        `}</style>

        {/* 1. Header (< តុល្យភាពខ្ញុំ matching Screenshot) */}
        <div
          style={{
            padding: '16px 20px',
            background: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: '1px solid #f1f5f9',
            position: 'sticky',
            top: 0,
            zIndex: 10,
          }}
        >
          <button
            onClick={onClose}
            type="button"
            style={{
              width: '38px',
              height: '38px',
              borderRadius: '50%',
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: '#1e293b',
              fontSize: '20px',
              fontWeight: 800,
              padding: 0,
            }}
            title="ត្រឡប់ក្រោយ (Back)"
          >
            ‹
          </button>

          <h2
            className="kh-text"
            style={{
              margin: 0,
              fontSize: '1.25rem',
              fontWeight: 800,
              color: '#059669', // Lush Green matching Screenshot
            }}
          >
            តុល្យភាពខ្ញុំ
          </h2>

          <div style={{ width: '38px' }} />
        </div>

        {/* Scrollable Container */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '16px',
            WebkitOverflowScrolling: 'touch',
          }}
        >
          {/* 2. Year Selector Pills matching Screenshot */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              marginBottom: '16px',
            }}
          >
            {years.map((yr) => {
              const isSelected = yr === selectedYear;
              return (
                <button
                  key={yr}
                  onClick={() => setSelectedYear(yr)}
                  type="button"
                  style={{
                    padding: '8px 18px',
                    borderRadius: '16px',
                    border: isSelected ? 'none' : '1px solid #e2e8f0',
                    background: isSelected ? '#059669' : '#ffffff',
                    color: isSelected ? '#ffffff' : '#64748b',
                    fontWeight: isSelected ? 800 : 600,
                    fontSize: '0.88rem',
                    cursor: 'pointer',
                    boxShadow: isSelected ? '0 4px 12px rgba(5, 150, 105, 0.3)' : '0 1px 3px rgba(0,0,0,0.02)',
                    transition: 'all 0.15s ease',
                  }}
                >
                  {yr}
                </button>
              );
            })}
          </div>

          {/* 3. Action Button: 📝 ស្នើសុំឈប់ច្បាប់ matching Screenshot */}
          <button
            onClick={() => setShowApplyForm(!showApplyForm)}
            type="button"
            className="kh-text"
            style={{
              width: '100%',
              padding: '14px',
              background: showApplyForm ? '#334155' : 'linear-gradient(135deg, #059669 0%, #10b981 100%)',
              color: '#ffffff',
              border: 'none',
              borderRadius: '16px',
              fontSize: '0.98rem',
              fontWeight: 800,
              cursor: 'pointer',
              marginBottom: '18px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              boxShadow: showApplyForm ? 'none' : '0 6px 18px rgba(16, 185, 129, 0.3)',
              transition: 'background 0.2s ease',
            }}
          >
            <span>{showApplyForm ? '✕ បិទផ្ទាំងស្នើសុំ' : '📝 ស្នើសុំឈប់ច្បាប់'}</span>
          </button>

          {/* 4. INLINE LEAVE APPLICATION FORM WITH LIVE LABOR LAW CHECKING */}
          {showApplyForm && (
            <div
              style={{
                background: '#ffffff',
                borderRadius: '20px',
                padding: '20px',
                border: '1.5px solid #a7f3d0',
                boxShadow: '0 8px 24px rgba(16, 185, 129, 0.12)',
                marginBottom: '18px',
              }}
            >
              <h3 className="kh-text" style={{ margin: '0 0 14px 0', fontSize: '1rem', fontWeight: 800, color: '#0f172a' }}>
                ✍️ បំពេញពាក្យស្នើសុំច្បាប់
              </h3>

              <form onSubmit={handleApplyLeave} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {/* Leave Type */}
                <div>
                  <label className="kh-text" style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                    ប្រភេទច្បាប់ (Leave Type)
                  </label>
                  <select
                    value={formType}
                    onChange={(e) => setFormType(e.target.value as any)}
                    className="kh-text"
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: '12px',
                      border: '1px solid #cbd5e1',
                      background: '#fff',
                      fontSize: '0.85rem',
                      fontWeight: 700,
                      color: '#0f172a',
                    }}
                  >
                    <option value="ANNUAL">ច្បាប់ប្រចាំឆ្នាំ (Annual Leave)</option>
                    <option value="SPECIAL">ច្បាប់ពិសេស (Special Leave - មាត្រា ១៧១)</option>
                    <option value="SICK">ច្បាប់ឈឺ (Sick Leave)</option>
                    <option value="CERTIFIED_SICK">ច្បាប់មានវេជ្ជបញ្ជា (Certified Medical Leave)</option>
                    <option value="UNPAID">ច្បាប់ឥតប្រាក់ឈ្នួល (Unpaid Leave)</option>
                  </select>
                </div>

                {/* Date Pickers */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div>
                    <label className="kh-text" style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                      ពីថ្ងៃ (Start)
                    </label>
                    <input
                      type="date"
                      value={formStart}
                      onChange={(e) => setFormStart(e.target.value)}
                      required
                      style={{
                        width: '100%',
                        padding: '10px',
                        borderRadius: '12px',
                        border: '1px solid #cbd5e1',
                        fontSize: '0.85rem',
                        fontFamily: 'monospace',
                        boxSizing: 'border-box',
                      }}
                    />
                  </div>
                  <div>
                    <label className="kh-text" style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                      ដល់ថ្ងៃ (End)
                    </label>
                    <input
                      type="date"
                      value={formEnd}
                      onChange={(e) => setFormEnd(e.target.value)}
                      required
                      style={{
                        width: '100%',
                        padding: '10px',
                        borderRadius: '12px',
                        border: '1px solid #cbd5e1',
                        fontSize: '0.85rem',
                        fontFamily: 'monospace',
                        boxSizing: 'border-box',
                      }}
                    />
                  </div>
                </div>

                {/* Live Labor Law Balance Checker Strip */}
                <div
                  style={{
                    background: activeBalanceCheck.isExceeded ? '#fef2f2' : '#f0fdf4',
                    border: `1px solid ${activeBalanceCheck.isExceeded ? '#fecaca' : '#bbf7d0'}`,
                    borderRadius: '12px',
                    padding: '10px 14px',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span className="kh-text" style={{ fontSize: '0.78rem', color: '#475569' }}>
                      ចំនួនថ្ងៃស្នើសុំ: <strong style={{ color: '#0f172a' }}>{formDuration} ថ្ងៃ</strong> (មិនគិតថ្ងៃអាទិត្យ)
                    </span>
                    <span
                      className="kh-text"
                      style={{
                        fontSize: '0.78rem',
                        fontWeight: 800,
                        color: activeBalanceCheck.isExceeded ? '#dc2626' : '#16a34a',
                      }}
                    >
                      សមតុល្យនៅសល់: {activeBalanceCheck.remaining} ថ្ងៃ
                    </span>
                  </div>

                  {activeBalanceCheck.warning && (
                    <div
                      className="kh-text"
                      style={{
                        fontSize: '0.76rem',
                        color: '#dc2626',
                        fontWeight: 700,
                        marginTop: '6px',
                        lineHeight: 1.3,
                      }}
                    >
                      {activeBalanceCheck.warning}
                    </div>
                  )}
                </div>

                {/* Reason */}
                <div>
                  <label className="kh-text" style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                    មូលហេតុ (Reason)
                  </label>
                  <textarea
                    rows={2}
                    value={formReason}
                    onChange={(e) => setFormReason(e.target.value)}
                    required
                    placeholder="បញ្ជាក់មូលហេតុនៃការសុំច្បាប់..."
                    className="kh-text"
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: '12px',
                      border: '1px solid #cbd5e1',
                      fontSize: '0.85rem',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isSubmitting || activeBalanceCheck.isExceeded}
                  className="kh-text"
                  style={{
                    padding: '12px',
                    borderRadius: '12px',
                    border: 'none',
                    background: activeBalanceCheck.isExceeded
                      ? '#94a3b8'
                      : 'linear-gradient(135deg, #059669 0%, #10b981 100%)',
                    color: '#ffffff',
                    fontWeight: 800,
                    fontSize: '0.9rem',
                    cursor: activeBalanceCheck.isExceeded ? 'not-allowed' : 'pointer',
                    boxShadow: activeBalanceCheck.isExceeded ? 'none' : '0 4px 12px rgba(16, 185, 129, 0.25)',
                    marginTop: '4px',
                  }}
                >
                  {isSubmitting ? 'កំពុងបញ្ជូន...' : '✓ បញ្ជូនពាក្យស្នើសុំ'}
                </button>
              </form>
            </div>
          )}

          {/* 5. Labor Law Seniority Badge */}
          {laborLawMetrics.seniorityBonus > 0 && (
            <div
              style={{
                background: '#eff6ff',
                border: '1px solid #bfdbfe',
                borderRadius: '14px',
                padding: '10px 14px',
                marginBottom: '14px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <span style={{ fontSize: '18px' }}>🎖️</span>
              <div className="kh-text" style={{ fontSize: '0.78rem', color: '#1e40af', lineHeight: 1.3 }}>
                <strong>អតីតភាពការងារ៖ {laborLawMetrics.yearsOfService} ឆ្នាំ</strong> — ទទួលបានច្បាប់ប្រចាំឆ្នាំបន្ថែម{' '}
                <strong>+{laborLawMetrics.seniorityBonus} ថ្ងៃ</strong> ស្របតាមច្បាប់ការងារមាត្រា ១៦៦!
              </div>
            </div>
          )}

          {/* 6. Leave Balance Cards matching Screenshot */}

          {/* CARD 1: ច្បាប់សម្រាកប្រចាំឆ្នាំ (Annual Leave) */}
          <div className="leave-balance-card">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div
                  style={{
                    width: '42px',
                    height: '42px',
                    borderRadius: '12px',
                    background: '#f1f5f9',
                    border: '1px solid #e2e8f0',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '18px',
                    color: '#0f172a',
                  }}
                >
                  📅
                </div>
                <div>
                  <div className="kh-text" style={{ fontSize: '0.96rem', fontWeight: 800, color: '#0f172a' }}>
                    {laborLawMetrics.annual.title}
                  </div>
                  <div className="kh-text" style={{ fontSize: '0.7rem', color: '#64748b', marginTop: '2px' }}>
                    {laborLawMetrics.annual.lawNote}
                  </div>
                </div>
              </div>

              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '1.45rem', fontWeight: 900, color: '#0f172a', lineHeight: 1 }}>
                  {laborLawMetrics.annual.remaining.toFixed(1)}
                </div>
                <div className="kh-text" style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '2px' }}>
                  ថ្ងៃនៅសល់
                </div>
              </div>
            </div>

            {/* Progress Bar */}
            <div
              style={{
                width: '100%',
                height: '7px',
                background: '#e2e8f0',
                borderRadius: '999px',
                overflow: 'hidden',
                margin: '12px 0',
              }}
            >
              <div
                style={{
                  width: `${Math.min(100, (laborLawMetrics.annual.used / (laborLawMetrics.annual.entitled || 1)) * 100)}%`,
                  height: '100%',
                  background: '#059669',
                  borderRadius: '999px',
                }}
              />
            </div>

            {/* 3 Forward Columns matching Screenshot */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                textAlign: 'center',
                padding: '8px 0',
                borderBottom: '1px solid #f1f5f9',
              }}
            >
              <div>
                <div style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 600 }}>Forward</div>
                <div style={{ fontSize: '0.88rem', fontWeight: 700, color: '#475569', marginTop: '2px' }}>
                  {laborLawMetrics.annual.forward1.toFixed(1)}
                </div>
              </div>
              <div>
                <div style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 600 }}>Forward 2</div>
                <div style={{ fontSize: '0.88rem', fontWeight: 700, color: '#475569', marginTop: '2px' }}>
                  {laborLawMetrics.annual.forward2.toFixed(1)}
                </div>
              </div>
              <div>
                <div style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 600 }}>Forward 3</div>
                <div style={{ fontSize: '0.88rem', fontWeight: 700, color: '#475569', marginTop: '2px' }}>
                  {laborLawMetrics.annual.forward3.toFixed(1)}
                </div>
              </div>
            </div>

            {/* Bottom Row: តុល្យភាព vs បានឈប់ matching Screenshot */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                paddingTop: '10px',
                fontSize: '0.85rem',
                fontWeight: 700,
              }}
            >
              <span className="kh-text" style={{ color: '#475569' }}>
                {laborLawMetrics.annual.entitled.toFixed(1)} តុល្យភាព
              </span>
              <span className="kh-text" style={{ color: '#475569' }}>
                {laborLawMetrics.annual.used.toFixed(1)} បានឈប់
              </span>
            </div>
          </div>

          {/* CARD 2: ច្បាប់សម្រាកមានវេជ្ជបញ្ជា (Certified Sick Leave) */}
          <div className="leave-balance-card">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div
                  style={{
                    width: '42px',
                    height: '42px',
                    borderRadius: '12px',
                    background: '#f1f5f9',
                    border: '1px solid #e2e8f0',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '18px',
                    color: '#0f172a',
                  }}
                >
                  📅
                </div>
                <div>
                  <div className="kh-text" style={{ fontSize: '0.96rem', fontWeight: 800, color: '#0f172a' }}>
                    {laborLawMetrics.certifiedSick.title}
                  </div>
                  <div className="kh-text" style={{ fontSize: '0.7rem', color: '#64748b', marginTop: '2px' }}>
                    {laborLawMetrics.certifiedSick.lawNote}
                  </div>
                </div>
              </div>

              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '1.45rem', fontWeight: 900, color: '#0f172a', lineHeight: 1 }}>
                  {laborLawMetrics.certifiedSick.remaining.toFixed(1)}
                </div>
                <div className="kh-text" style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '2px' }}>
                  ថ្ងៃនៅសល់
                </div>
              </div>
            </div>

            {/* 3 Forward Columns matching Screenshot */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                textAlign: 'center',
                padding: '8px 0',
                borderBottom: '1px solid #f1f5f9',
              }}
            >
              <div>
                <div style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 600 }}>Forward</div>
                <div style={{ fontSize: '0.88rem', fontWeight: 700, color: '#475569', marginTop: '2px' }}>
                  {laborLawMetrics.certifiedSick.forward1.toFixed(1)}
                </div>
              </div>
              <div>
                <div style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 600 }}>Forward 2</div>
                <div style={{ fontSize: '0.88rem', fontWeight: 700, color: '#475569', marginTop: '2px' }}>
                  {laborLawMetrics.certifiedSick.forward2.toFixed(1)}
                </div>
              </div>
              <div>
                <div style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 600 }}>Forward 3</div>
                <div style={{ fontSize: '0.88rem', fontWeight: 700, color: '#475569', marginTop: '2px' }}>
                  {laborLawMetrics.certifiedSick.forward3.toFixed(1)}
                </div>
              </div>
            </div>

            {/* Bottom Row: តុល្យភាព vs បានឈប់ */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                paddingTop: '10px',
                fontSize: '0.85rem',
                fontWeight: 700,
              }}
            >
              <span className="kh-text" style={{ color: '#475569' }}>
                {laborLawMetrics.certifiedSick.entitled.toFixed(1)} តុល្យភាព
              </span>
              <span className="kh-text" style={{ color: '#475569' }}>
                {laborLawMetrics.certifiedSick.used.toFixed(1)} បានឈប់
              </span>
            </div>
          </div>

          {/* CARD 3: ច្បាប់សម្រាកឈឺ/ច្បាប់សម្រាកពិសេស (Special Leave - Article 171) */}
          <div className="leave-balance-card">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div
                  style={{
                    width: '42px',
                    height: '42px',
                    borderRadius: '12px',
                    background: '#f1f5f9',
                    border: '1px solid #e2e8f0',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '18px',
                    color: '#0f172a',
                  }}
                >
                  📅
                </div>
                <div>
                  <div className="kh-text" style={{ fontSize: '0.96rem', fontWeight: 800, color: '#0f172a' }}>
                    {laborLawMetrics.special.title}
                  </div>
                  <div className="kh-text" style={{ fontSize: '0.7rem', color: '#64748b', marginTop: '2px' }}>
                    {laborLawMetrics.special.lawNote}
                  </div>
                </div>
              </div>

              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '1.45rem', fontWeight: 900, color: '#0f172a', lineHeight: 1 }}>
                  {laborLawMetrics.special.remaining.toFixed(1)}
                </div>
                <div className="kh-text" style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '2px' }}>
                  ថ្ងៃនៅសល់
                </div>
              </div>
            </div>

            {/* Progress Bar (Dark filled progress bar matching Screenshot) */}
            <div
              style={{
                width: '100%',
                height: '7px',
                background: '#e2e8f0',
                borderRadius: '999px',
                overflow: 'hidden',
                margin: '12px 0',
              }}
            >
              <div
                style={{
                  width: `${Math.min(100, (laborLawMetrics.special.used / (laborLawMetrics.special.entitled || 1)) * 100)}%`,
                  height: '100%',
                  background: '#0f172a', // Dark black bar matching Screenshot 3
                  borderRadius: '999px',
                }}
              />
            </div>

            {/* 3 Forward Columns */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                textAlign: 'center',
                padding: '8px 0',
                borderBottom: '1px solid #f1f5f9',
              }}
            >
              <div>
                <div style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 600 }}>Forward</div>
                <div style={{ fontSize: '0.88rem', fontWeight: 700, color: '#475569', marginTop: '2px' }}>
                  {laborLawMetrics.special.forward1.toFixed(1)}
                </div>
              </div>
              <div>
                <div style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 600 }}>Forward 2</div>
                <div style={{ fontSize: '0.88rem', fontWeight: 700, color: '#475569', marginTop: '2px' }}>
                  {laborLawMetrics.special.forward2.toFixed(1)}
                </div>
              </div>
              <div>
                <div style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 600 }}>Forward 3</div>
                <div style={{ fontSize: '0.88rem', fontWeight: 700, color: '#475569', marginTop: '2px' }}>
                  {laborLawMetrics.special.forward3.toFixed(1)}
                </div>
              </div>
            </div>

            {/* Bottom Row: 7.0 តុល្យភាព vs 2.0 បានឈប់ matching Screenshot */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                paddingTop: '10px',
                fontSize: '0.85rem',
                fontWeight: 700,
              }}
            >
              <span className="kh-text" style={{ color: '#475569' }}>
                {laborLawMetrics.special.entitled.toFixed(1)} តុល្យភាព
              </span>
              <span className="kh-text" style={{ color: '#475569' }}>
                {laborLawMetrics.special.used.toFixed(1)} បានឈប់
              </span>
            </div>
          </div>

          {/* CARD 4: ច្បាប់សម្រាកឥតប្រាក់ឈ្នួល (Unpaid Leave) */}
          <div className="leave-balance-card">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div
                  style={{
                    width: '42px',
                    height: '42px',
                    borderRadius: '12px',
                    background: '#f1f5f9',
                    border: '1px solid #e2e8f0',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '18px',
                    color: '#0f172a',
                  }}
                >
                  📅
                </div>
                <div>
                  <div className="kh-text" style={{ fontSize: '0.96rem', fontWeight: 800, color: '#0f172a' }}>
                    {laborLawMetrics.unpaid.title}
                  </div>
                  <div className="kh-text" style={{ fontSize: '0.7rem', color: '#64748b', marginTop: '2px' }}>
                    {laborLawMetrics.unpaid.lawNote}
                  </div>
                </div>
              </div>

              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '1.45rem', fontWeight: 900, color: '#0f172a', lineHeight: 1 }}>
                  {laborLawMetrics.unpaid.remaining.toFixed(1)}
                </div>
                <div className="kh-text" style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '2px' }}>
                  ថ្ងៃនៅសល់
                </div>
              </div>
            </div>

            {/* 3 Forward Columns */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                textAlign: 'center',
                padding: '8px 0',
                borderBottom: '1px solid #f1f5f9',
              }}
            >
              <div>
                <div style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 600 }}>Forward</div>
                <div style={{ fontSize: '0.88rem', fontWeight: 700, color: '#475569', marginTop: '2px' }}>
                  {laborLawMetrics.unpaid.forward1.toFixed(1)}
                </div>
              </div>
              <div>
                <div style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 600 }}>Forward 2</div>
                <div style={{ fontSize: '0.88rem', fontWeight: 700, color: '#475569', marginTop: '2px' }}>
                  {laborLawMetrics.unpaid.forward2.toFixed(1)}
                </div>
              </div>
              <div>
                <div style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 600 }}>Forward 3</div>
                <div style={{ fontSize: '0.88rem', fontWeight: 700, color: '#475569', marginTop: '2px' }}>
                  {laborLawMetrics.unpaid.forward3.toFixed(1)}
                </div>
              </div>
            </div>

            {/* Bottom Row */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                paddingTop: '10px',
                fontSize: '0.85rem',
                fontWeight: 700,
              }}
            >
              <span className="kh-text" style={{ color: '#475569' }}>
                {laborLawMetrics.unpaid.entitled.toFixed(1)} តុល្យភាព
              </span>
              <span className="kh-text" style={{ color: '#475569' }}>
                {laborLawMetrics.unpaid.used.toFixed(1)} បានឈប់
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
