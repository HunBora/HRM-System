'use client';

import React, { useState, useMemo } from 'react';
import Swal from 'sweetalert2';
import * as XLSX from 'xlsx';

interface Employee {
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
  basicSalary?: number | null;
  photoUrl?: string | null;
}

interface Installment {
  installmentNo: number;
  dueMonth: string;
  dueDate: string;
  amount: number;
  status: string;
  paidDate: string | null;
}

interface EmployeeLoan {
  id: string;
  employeeId: string;
  employee: Employee;
  loanCode: string;
  loanAmount: number;
  interestRate: number;
  termMonths: number;
  monthlyDeduction: number;
  totalRepaid: number;
  remainingBalance: number;
  disbursementDate: string;
  startDeductionMonth: string;
  status: string; // ACTIVE, PAID_OFF, DEFAULTED, REJECTED
  purpose: string;
  guarantorName: string | null;
  guarantorPhone: string | null;
  disbursedBy: string | null;
  notes: string | null;
  repaymentSchedule: Installment[] | null;
  createdAt: string;
}

interface LoansClientProps {
  initialLoans: EmployeeLoan[];
  employees: Employee[];
  currentUserRole: string;
}

const STATUS_CONFIG: Record<string, { labelKh: string; labelEn: string; labelZh: string; bg: string; text: string }> = {
  ACTIVE: {
    labelKh: 'កំពុងកាត់រំលស់',
    labelEn: 'Active Deduction',
    labelZh: '还款中',
    bg: '#e0f2fe',
    text: '#0284c7'
  },
  PAID_OFF: {
    labelKh: 'បានសងរួចរាល់',
    labelEn: 'Paid Off',
    labelZh: '已结清',
    bg: '#dcfce7',
    text: '#16a34a'
  },
  DEFAULTED: {
    labelKh: 'ខកខានសង',
    labelEn: 'Defaulted',
    labelZh: '违约逾期',
    bg: '#fee2e2',
    text: '#dc2626'
  },
  REJECTED: {
    labelKh: 'បដិសេធ',
    labelEn: 'Rejected',
    labelZh: '已拒绝',
    bg: '#f1f5f9',
    text: '#64748b'
  }
};

export default function LoansClient({
  initialLoans,
  employees,
  currentUserRole,
}: LoansClientProps) {
  const isHR = ['ADMIN', 'HR_MANAGER', 'PAYROLL_ADMIN'].includes(currentUserRole);

  const [loans, setLoans] = useState<EmployeeLoan[]>(initialLoans);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [departmentFilter, setDepartmentFilter] = useState('ALL');

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [selectedLoan, setSelectedLoan] = useState<EmployeeLoan | null>(null);

  // Form states
  const [formEmployeeId, setFormEmployeeId] = useState('');
  const [formAmount, setFormAmount] = useState('500');
  const [formInterestRate, setFormInterestRate] = useState('0');
  const [formTermMonths, setFormTermMonths] = useState('6');
  const [formStartMonth, setFormStartMonth] = useState(() => {
    const nextMonth = new Date();
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    return `${nextMonth.getFullYear()}-${String(nextMonth.getMonth() + 1).padStart(2, '0')}`;
  });
  const [formPurpose, setFormPurpose] = useState('បន្ទាន់ផ្ទាល់ខ្លួន (Personal Emergency)');
  const [formGuarantorName, setFormGuarantorName] = useState('');
  const [formGuarantorPhone, setFormGuarantorPhone] = useState('');
  const [formDisbursedBy, setFormDisbursedBy] = useState('Finance & HR Director');
  const [formNotes, setFormNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Quick Payment form
  const [paymentAmount, setPaymentAmount] = useState('');

  // Selected employee for loan application
  const selectedEmp = useMemo(() => {
    return employees.find((e) => e.id === formEmployeeId);
  }, [formEmployeeId, employees]);

  // Calculated preview installment
  const calculatedInstallment = useMemo(() => {
    const principal = parseFloat(formAmount || '0');
    const rate = parseFloat(formInterestRate || '0');
    const months = parseInt(formTermMonths || '1', 10);
    if (principal <= 0 || months <= 0) return 0;
    const totalInterest = principal * (rate / 100) * (months / 12);
    const total = principal + totalInterest;
    return Math.round((total / months) * 100) / 100;
  }, [formAmount, formInterestRate, formTermMonths]);

  // Departments list
  const departments = useMemo(() => {
    const set = new Set<string>();
    employees.forEach((e) => {
      if (e.department) set.add(e.department);
    });
    return Array.from(set).sort();
  }, [employees]);

  // Filtered Loans
  const filteredLoans = useMemo(() => {
    return loans.filter((l) => {
      if (statusFilter !== 'ALL' && l.status !== statusFilter) return false;
      if (departmentFilter !== 'ALL' && l.employee.department !== departmentFilter) return false;

      if (!searchTerm) return true;
      const term = searchTerm.toLowerCase();
      const empNameKh = `${l.employee.lastNameKh || ''} ${l.employee.firstNameKh || ''}`.toLowerCase();
      const empNameEn = `${l.employee.firstNameEn || ''} ${l.employee.lastNameEn || ''}`.toLowerCase();
      const empId = l.employee.employeeId?.toLowerCase() || '';
      const code = l.loanCode.toLowerCase();
      const purpose = (l.purpose || '').toLowerCase();

      return (
        empNameKh.includes(term) ||
        empNameEn.includes(term) ||
        empId.includes(term) ||
        code.includes(term) ||
        purpose.includes(term)
      );
    });
  }, [loans, searchTerm, statusFilter, departmentFilter]);

  // Metrics
  const metrics = useMemo(() => {
    const totalPrincipal = loans.reduce((acc, l) => acc + (l.loanAmount || 0), 0);
    const totalActiveBalance = loans
      .filter((l) => l.status === 'ACTIVE')
      .reduce((acc, l) => acc + (l.remainingBalance || 0), 0);
    const totalMonthlyDeductions = loans
      .filter((l) => l.status === 'ACTIVE')
      .reduce((acc, l) => acc + (l.monthlyDeduction || 0), 0);
    const paidOffCount = loans.filter((l) => l.status === 'PAID_OFF').length;

    return {
      totalPrincipal,
      totalActiveBalance,
      totalMonthlyDeductions,
      paidOffCount,
    };
  }, [loans]);

  // Handle Create Loan
  const handleCreateLoan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formEmployeeId || !formAmount || !formTermMonths || !formStartMonth) {
      Swal.fire({
        icon: 'warning',
        title: 'សូមបំពេញព័ត៌មានចាំបាច់',
        text: 'Please fill all required fields.',
        confirmButtonColor: '#2563eb'
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/loans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employeeId: formEmployeeId,
          loanAmount: formAmount,
          interestRate: formInterestRate,
          termMonths: formTermMonths,
          monthlyDeduction: calculatedInstallment,
          startDeductionMonth: formStartMonth,
          purpose: formPurpose,
          guarantorName: formGuarantorName,
          guarantorPhone: formGuarantorPhone,
          disbursedBy: formDisbursedBy,
          notes: formNotes,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to create loan');
      }

      const created = await res.json();
      setLoans((prev) => [created, ...prev]);
      setIsAddModalOpen(false);
      // Reset form
      setFormEmployeeId('');
      setFormAmount('500');
      setFormInterestRate('0');
      setFormTermMonths('6');
      setFormPurpose('បន្ទាន់ផ្ទាល់ខ្លួន (Personal Emergency)');
      setFormGuarantorName('');
      setFormGuarantorPhone('');
      setFormNotes('');

      Swal.fire({
        icon: 'success',
        title: 'ជោគជ័យ (Created)',
        text: 'បានបង្កើតកម្ចីបុគ្គលិកដោយជោគជ័យ!',
        timer: 1500,
        showConfirmButton: false,
      });
    } catch (err: any) {
      Swal.fire({
        icon: 'error',
        title: 'បរាជ័យ (Failed)',
        text: err.message || 'Error occurred',
        confirmButtonColor: '#ef4444'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Record Payment
  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLoan || !paymentAmount) return;

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/loans', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: selectedLoan.id,
          action: 'RECORD_PAYMENT',
          paymentAmount,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Payment failed');
      }

      const updated = await res.json();
      setLoans((prev) => prev.map((l) => (l.id === updated.id ? updated : l)));
      setSelectedLoan(updated);
      setIsPaymentModalOpen(false);
      setPaymentAmount('');

      Swal.fire({
        icon: 'success',
        title: 'ជោគជ័យ (Paid)',
        text: 'បានកត់ត្រាការសងប្រាក់រំលស់រួចរាល់!',
        timer: 1500,
        showConfirmButton: false,
      });
    } catch (err: any) {
      Swal.fire('Error', err.message || 'Payment error', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Delete Loan
  const handleDeleteLoan = async (id: string) => {
    const confirm = await Swal.fire({
      title: 'តើអ្នកប្រាកដទេ?',
      text: 'តើអ្នកពិតជាចង់លុបកំណត់ត្រាកម្ចីនេះមែនទេ?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'បាទ/ចាស លុបចេញ',
      cancelButtonText: 'បោះបង់'
    });

    if (!confirm.isConfirmed) return;

    try {
      const res = await fetch(`/api/loans?id=${id}`, { method: 'DELETE' });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Delete failed');
      }
      setLoans((prev) => prev.filter((l) => l.id !== id));
      Swal.fire({
        icon: 'success',
        title: 'បានលុបជោគជ័យ',
        timer: 1200,
        showConfirmButton: false
      });
    } catch (err: any) {
      Swal.fire('Error', err.message || 'Delete error', 'error');
    }
  };

  // Excel Export with 3 languages stacked and autoFitColumns
  const handleExportExcel = () => {
    if (filteredLoans.length === 0) {
      Swal.fire('Info', 'គ្មានទិន្នន័យសម្រាប់ទាញយកទេ (No data to export)', 'info');
      return;
    }

    const exportData = filteredLoans.map((l, index) => {
      const empNameKh = `${l.employee.lastNameKh || ''} ${l.employee.firstNameKh || ''}`.trim();
      const empNameEn = `${l.employee.firstNameEn || ''} ${l.employee.lastNameEn || ''}`.trim();
      const statusConf = STATUS_CONFIG[l.status] || { labelKh: l.status, labelEn: l.status, labelZh: l.status };

      return {
        'ល.រ\nNo.\n序号': index + 1,
        'កូដកម្ចី\nLoan Code\n借款单号': l.loanCode,
        'អត្តលេខ\nEmp ID\n工号': l.employee.employeeId,
        'ឈ្មោះខ្មែរ\nKhmer Name\n柬文姓名': empNameKh || '-',
        'ឈ្មោះអង់គ្លេស\nEnglish Name\n英文姓名': empNameEn,
        'នាយកដ្ឋាន\nDepartment\n部门': l.employee.department,
        'មុខតំណែង\nPosition\n职位': l.employee.position,
        'ប្រាក់កម្ចីសរុប ($)\nLoan Principal\n借款本金': l.loanAmount,
        'អត្រាការប្រាក់ (%)\nInterest Rate\n年利率': `${l.interestRate}%`,
        'រយៈពេល (ខែ)\nTerm (Months)\n还款期数': l.termMonths,
        'កាត់ប្រចាំខែ ($)\nMonthly Deduction\n每月扣款': l.monthlyDeduction,
        'បានសង ($)\nTotal Repaid\n已还本息': l.totalRepaid,
        'នៅជំពាក់ ($)\nRemaining Balance\n剩余欠款': l.remainingBalance,
        'ខែចាប់ផ្តើមកាត់\nStart Month\n首扣月份': l.startDeductionMonth,
        'គោលបំណង\nPurpose\n借款用途': l.purpose,
        'អ្នកធានា\nGuarantor\n担保人': l.guarantorName || '-',
        'លេខទូរស័ព្ទ\nPhone\n电话': l.guarantorPhone || '-',
        'ស្ថានភាព\nStatus\n还款状态': `${statusConf.labelKh} (${statusConf.labelEn} / ${statusConf.labelZh})`,
        'កាលបរិច្ឆេទបើក\nDisbursement Date\n放款日期': new Date(l.disbursementDate).toISOString().split('T')[0],
      };
    });

    const autoFitColumns = (data: any[]) => {
      if (!data || data.length === 0) return [];
      const keys = Object.keys(data[0]);
      return keys.map((key) => {
        let maxLen = key.length;
        data.forEach((row) => {
          const val = row[key] !== undefined && row[key] !== null ? String(row[key]) : '';
          if (val.length > maxLen) maxLen = val.length;
        });
        return { wch: Math.max(maxLen + 4, 16) };
      });
    };

    const ws = XLSX.utils.json_to_sheet(exportData);
    ws['!cols'] = autoFitColumns(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Employee_Loans');
    XLSX.writeFile(wb, `Employee_Loans_${new Date().toISOString().split('T')[0]}.xlsx`);

    Swal.fire({
      icon: 'success',
      title: 'ទាញយកជោគជ័យ (Exported)',
      text: 'ឯកសារ Excel ត្រូវបានទាញយករួចរាល់!',
      timer: 1500,
      showConfirmButton: false,
    });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* 1. Page Header Banner */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '16px',
          background: '#ffffff',
          padding: '24px',
          borderRadius: '16px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.04)',
          border: '1px solid #f1f5f9',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div
            style={{
              width: '56px',
              height: '56px',
              borderRadius: '14px',
              background: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)',
              color: '#2563eb',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '28px',
              boxShadow: '0 4px 12px rgba(37, 99, 235, 0.15)',
            }}
          >
            💳
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 800, color: '#0f172a' }}>
              ប្រព័ន្ធគ្រប់គ្រងប្រាក់កម្ចីបុគ្គលិក និងការកាត់រំលស់ប្រចាំខែ
            </h1>
            <p style={{ margin: '4px 0 0 0', color: '#64748b', fontSize: '0.86rem', fontWeight: 500 }}>
              Employee Loan & Monthly Installment Deduction Management • 员工借款与分期还款扣发管理系统
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <a
            href="/dashboard/advance"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              background: '#f8fafc',
              color: '#334155',
              border: '1px solid #cbd5e1',
              borderRadius: '10px',
              padding: '10px 14px',
              fontWeight: 700,
              fontSize: '0.86rem',
              textDecoration: 'none',
              transition: 'all 0.2s ease',
            }}
          >
            <span>💵</span>
            <span>ប្រាក់បុរេប្រទាន (Advance Salary)</span>
          </a>

          {isHR && (
            <button
              onClick={() => setIsAddModalOpen(true)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
                color: '#ffffff',
                border: 'none',
                borderRadius: '10px',
                padding: '10px 18px',
                fontWeight: 700,
                fontSize: '0.9rem',
                cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(37, 99, 235, 0.25)',
                transition: 'all 0.2s ease',
              }}
            >
              <span>➕</span>
              <div style={{ textAlign: 'left', lineHeight: 1.2 }}>
                <div>បង្កើតកម្ចីថ្មី</div>
                <div style={{ fontSize: '0.7rem', opacity: 0.85 }}>New Loan • 新增借款</div>
              </div>
            </button>
          )}

          <button
            onClick={handleExportExcel}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              background: 'linear-gradient(135deg, #10b981 0%, #047857 100%)',
              color: '#ffffff',
              border: 'none',
              borderRadius: '10px',
              padding: '10px 18px',
              fontWeight: 700,
              fontSize: '0.9rem',
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(16, 185, 129, 0.25)',
              transition: 'all 0.2s ease',
            }}
          >
            <span>📥</span>
            <div style={{ textAlign: 'left', lineHeight: 1.2 }}>
              <div>ទាញយកជា Excel</div>
              <div style={{ fontSize: '0.7rem', opacity: 0.85 }}>Export Excel • 导出表格</div>
            </div>
          </button>
        </div>
      </div>

      {/* 2. Metrics Cards (3 languages stacked) */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '16px',
        }}
      >
        {/* Metric 1: Total Loans */}
        <div
          style={{
            background: '#ffffff',
            borderRadius: '16px',
            padding: '20px',
            border: '1px solid #f1f5f9',
            boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
          }}
        >
          <div
            style={{
              width: '52px',
              height: '52px',
              borderRadius: '12px',
              background: '#eff6ff',
              color: '#2563eb',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '24px',
            }}
          >
            💵
          </div>
          <div>
            <div style={{ fontWeight: 800, fontSize: '0.95rem', color: '#0f172a' }}>សរុបប្រាក់កម្ចី</div>
            <div style={{ fontSize: '0.72rem', color: '#64748b' }}>Total Loan Amount • 借款总额</div>
            <div style={{ fontSize: '1.6rem', fontWeight: 900, color: '#2563eb', marginTop: '2px' }}>
              ${metrics.totalPrincipal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
          </div>
        </div>

        {/* Metric 2: Active Outstanding Balance */}
        <div
          style={{
            background: '#ffffff',
            borderRadius: '16px',
            padding: '20px',
            border: '1px solid #f1f5f9',
            boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
          }}
        >
          <div
            style={{
              width: '52px',
              height: '52px',
              borderRadius: '12px',
              background: '#fffbeb',
              color: '#d97706',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '24px',
            }}
          >
            ⚖️
          </div>
          <div>
            <div style={{ fontWeight: 800, fontSize: '0.95rem', color: '#0f172a' }}>សមតុល្យជំពាក់នៅសល់</div>
            <div style={{ fontSize: '0.72rem', color: '#64748b' }}>Active Balance • 剩余未还本息</div>
            <div style={{ fontSize: '1.6rem', fontWeight: 900, color: '#d97706', marginTop: '2px' }}>
              ${metrics.totalActiveBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
          </div>
        </div>

        {/* Metric 3: Total Monthly Deductions */}
        <div
          style={{
            background: '#ffffff',
            borderRadius: '16px',
            padding: '20px',
            border: '1px solid #f1f5f9',
            boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
          }}
        >
          <div
            style={{
              width: '52px',
              height: '52px',
              borderRadius: '12px',
              background: '#f5f3ff',
              color: '#7c3aed',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '24px',
            }}
          >
            📅
          </div>
          <div>
            <div style={{ fontWeight: 800, fontSize: '0.95rem', color: '#0f172a' }}>កាត់រំលស់ប្រចាំខែ</div>
            <div style={{ fontSize: '0.72rem', color: '#64748b' }}>Monthly Deductions • 每月扣款总额</div>
            <div style={{ fontSize: '1.6rem', fontWeight: 900, color: '#7c3aed', marginTop: '2px' }}>
              ${metrics.totalMonthlyDeductions.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
          </div>
        </div>

        {/* Metric 4: Paid Off Count */}
        <div
          style={{
            background: '#ffffff',
            borderRadius: '16px',
            padding: '20px',
            border: '1px solid #f1f5f9',
            boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
          }}
        >
          <div
            style={{
              width: '52px',
              height: '52px',
              borderRadius: '12px',
              background: '#f0fdf4',
              color: '#16a34a',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '24px',
            }}
          >
            ✅
          </div>
          <div>
            <div style={{ fontWeight: 800, fontSize: '0.95rem', color: '#0f172a' }}>បានសងរួចរាល់ទាំងស្រុង</div>
            <div style={{ fontSize: '0.72rem', color: '#64748b' }}>Paid Off Loans • 已结清笔数</div>
            <div style={{ fontSize: '1.6rem', fontWeight: 900, color: '#16a34a', marginTop: '2px' }}>
              {metrics.paidOffCount} <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#64748b' }}>ករណី</span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Search and Filters Toolbar */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '14px',
          alignItems: 'center',
          background: '#ffffff',
          padding: '16px 20px',
          borderRadius: '14px',
          border: '1px solid #f1f5f9',
          boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
        }}
      >
        {/* Search Input */}
        <div style={{ flex: '1 1 260px', position: 'relative' }}>
          <input
            type="text"
            placeholder="ស្វែងរកតាមឈ្មោះ, អត្តលេខ, កូដកម្ចី... (Search)..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: '100%',
              padding: '10px 14px 10px 38px',
              borderRadius: '10px',
              border: '1px solid #cbd5e1',
              fontSize: '0.88rem',
              outline: 'none',
              boxSizing: 'border-box',
            }}
          />
          <span style={{ position: 'absolute', left: '12px', top: '10px', color: '#94a3b8' }}>🔍</span>
        </div>

        {/* Status Filter */}
        <div style={{ minWidth: '180px' }}>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{
              width: '100%',
              padding: '10px 14px',
              borderRadius: '10px',
              border: '1px solid #cbd5e1',
              fontSize: '0.88rem',
              background: '#ffffff',
              outline: 'none',
              fontWeight: 600,
            }}
          >
            <option value="ALL">📊 គ្រប់ស្ថានភាព (All Status)</option>
            <option value="ACTIVE">🔵 កំពុងកាត់រំលស់ (Active)</option>
            <option value="PAID_OFF">🟢 បានសងរួច (Paid Off)</option>
            <option value="DEFAULTED">🔴 ខកខានសង (Defaulted)</option>
          </select>
        </div>

        {/* Department Filter */}
        <div style={{ minWidth: '180px' }}>
          <select
            value={departmentFilter}
            onChange={(e) => setDepartmentFilter(e.target.value)}
            style={{
              width: '100%',
              padding: '10px 14px',
              borderRadius: '10px',
              border: '1px solid #cbd5e1',
              fontSize: '0.88rem',
              background: '#ffffff',
              outline: 'none',
              fontWeight: 600,
            }}
          >
            <option value="ALL">🏢 គ្រប់នាយកដ្ឋាន (All Depts)</option>
            {departments.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* 4. Main Loans Table with 3-Languages Stacked on TH */}
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
                {/* 1: Loan Code */}
                <th style={{ padding: '14px 16px', minWidth: '130px' }}>
                  <div style={{ fontWeight: 800, color: '#0f172a', fontSize: '0.88rem' }}>កូដកម្ចី</div>
                  <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600 }}>Loan Code</div>
                  <div style={{ fontSize: '0.68rem', color: '#94a3b8' }}>借款单号</div>
                </th>

                {/* 2: Employee */}
                <th style={{ padding: '14px 16px', minWidth: '220px' }}>
                  <div style={{ fontWeight: 800, color: '#0f172a', fontSize: '0.88rem' }}>ព័ត៌មានបុគ្គលិក</div>
                  <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600 }}>Employee Name & ID</div>
                  <div style={{ fontSize: '0.68rem', color: '#94a3b8' }}>员工信息</div>
                </th>

                {/* 3: Dept / Position */}
                <th style={{ padding: '14px 16px', minWidth: '160px' }}>
                  <div style={{ fontWeight: 800, color: '#0f172a', fontSize: '0.88rem' }}>នាយកដ្ឋាន / មុខតំណែង</div>
                  <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600 }}>Dept / Position</div>
                  <div style={{ fontSize: '0.68rem', color: '#94a3b8' }}>部门 / 职位</div>
                </th>

                {/* 4: Loan Principal */}
                <th style={{ padding: '14px 16px', minWidth: '140px' }}>
                  <div style={{ fontWeight: 800, color: '#0f172a', fontSize: '0.88rem' }}>ប្រាក់កម្ចីដើម ($)</div>
                  <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600 }}>Loan Principal</div>
                  <div style={{ fontSize: '0.68rem', color: '#94a3b8' }}>借款本金</div>
                </th>

                {/* 5: Monthly / Term */}
                <th style={{ padding: '14px 16px', minWidth: '150px' }}>
                  <div style={{ fontWeight: 800, color: '#0f172a', fontSize: '0.88rem' }}>កាត់ប្រចាំខែ (រយៈពេល)</div>
                  <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600 }}>Monthly / Term</div>
                  <div style={{ fontSize: '0.68rem', color: '#94a3b8' }}>月扣 / 期限</div>
                </th>

                {/* 6: Repaid / Balance */}
                <th style={{ padding: '14px 16px', minWidth: '170px' }}>
                  <div style={{ fontWeight: 800, color: '#0f172a', fontSize: '0.88rem' }}>បានសង / សមតុល្យនៅសល់</div>
                  <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600 }}>Repaid / Balance</div>
                  <div style={{ fontSize: '0.68rem', color: '#94a3b8' }}>已还 / 剩余未还</div>
                </th>

                {/* 7: Status */}
                <th style={{ padding: '14px 16px', minWidth: '130px' }}>
                  <div style={{ fontWeight: 800, color: '#0f172a', fontSize: '0.88rem' }}>ស្ថានភាព</div>
                  <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600 }}>Status</div>
                  <div style={{ fontSize: '0.68rem', color: '#94a3b8' }}>状态</div>
                </th>

                {/* 8: Actions */}
                <th style={{ padding: '14px 16px', minWidth: '140px', textAlign: 'center' }}>
                  <div style={{ fontWeight: 800, color: '#0f172a', fontSize: '0.88rem' }}>សកម្មភាព</div>
                  <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600 }}>Actions</div>
                  <div style={{ fontSize: '0.68rem', color: '#94a3b8' }}>操作</div>
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredLoans.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ padding: '48px 16px', textAlign: 'center', color: '#94a3b8' }}>
                    <div style={{ fontSize: '40px', marginBottom: '8px' }}>📂</div>
                    <div style={{ fontSize: '1rem', fontWeight: 700, color: '#475569' }}>
                      មិនមានកំណត់ត្រាកម្ចីបុគ្គលិកទេ (No Loans Found)
                    </div>
                    <div style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: '4px' }}>
                      សូមចុចប៊ូតុង "បង្កើតកម្ចីថ្មី" ដើម្បីបញ្ចូលកម្ចីបុគ្គលិក
                    </div>
                  </td>
                </tr>
              ) : (
                filteredLoans.map((loan, idx) => {
                  const empNameKh = `${loan.employee.lastNameKh || ''} ${loan.employee.firstNameKh || ''}`.trim();
                  const empNameEn = `${loan.employee.firstNameEn || ''} ${loan.employee.lastNameEn || ''}`.trim();
                  const statusConf = STATUS_CONFIG[loan.status] || {
                    labelKh: loan.status,
                    labelEn: loan.status,
                    labelZh: loan.status,
                    bg: '#f1f5f9',
                    text: '#475569',
                  };
                  const progressPct =
                    loan.loanAmount > 0
                      ? Math.min(100, Math.round((loan.totalRepaid / loan.loanAmount) * 100))
                      : 0;

                  return (
                    <tr
                      key={loan.id}
                      style={{
                        borderBottom: '1px solid #f1f5f9',
                        background: idx % 2 === 0 ? '#ffffff' : '#fafafa',
                        transition: 'background 0.15s ease',
                      }}
                    >
                      {/* Loan Code */}
                      <td style={{ padding: '14px 16px' }}>
                        <span
                          style={{
                            display: 'inline-block',
                            background: '#eff6ff',
                            color: '#1d4ed8',
                            padding: '4px 8px',
                            borderRadius: '6px',
                            fontFamily: 'monospace',
                            fontWeight: 700,
                            fontSize: '0.8rem',
                            border: '1px solid #bfdbfe',
                          }}
                        >
                          {loan.loanCode}
                        </span>
                        <div style={{ fontSize: '0.72rem', color: '#94a3b8', marginTop: '4px' }}>
                          📅 {new Date(loan.disbursementDate).toLocaleDateString()}
                        </div>
                      </td>

                      {/* Employee Info */}
                      <td style={{ padding: '14px 16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          {loan.employee.photoUrl ? (
                            <img
                              src={loan.employee.photoUrl}
                              alt=""
                              style={{ width: '38px', height: '38px', borderRadius: '50%', objectFit: 'cover' }}
                            />
                          ) : (
                            <div
                              style={{
                                width: '38px',
                                height: '38px',
                                borderRadius: '50%',
                                background: '#e0e7ff',
                                color: '#4338ca',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontWeight: 700,
                                fontSize: '0.85rem',
                              }}
                            >
                              {(loan.employee.firstNameEn?.[0] || 'E')}
                            </div>
                          )}
                          <div>
                            <div style={{ fontWeight: 800, color: '#0f172a', fontSize: '0.88rem', lineHeight: 1.2 }}>
                              {empNameKh || empNameEn}
                            </div>
                            <div style={{ fontSize: '0.78rem', color: '#64748b' }}>{empNameEn}</div>
                            <div style={{ fontSize: '0.72rem', fontFamily: 'monospace', color: '#4f46e5' }}>
                              ID: {loan.employee.employeeId}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Dept / Position */}
                      <td style={{ padding: '14px 16px' }}>
                        <div style={{ fontWeight: 600, color: '#1e293b', fontSize: '0.85rem' }}>
                          {loan.employee.department}
                        </div>
                        <div style={{ fontSize: '0.78rem', color: '#64748b' }}>{loan.employee.position}</div>
                        {loan.employee.phone && (
                          <div style={{ fontSize: '0.72rem', color: '#94a3b8', marginTop: '2px' }}>
                            📞 {loan.employee.phone}
                          </div>
                        )}
                      </td>

                      {/* Principal Loan Amount */}
                      <td style={{ padding: '14px 16px' }}>
                        <div style={{ fontWeight: 900, color: '#0f172a', fontSize: '1.05rem' }}>
                          ${loan.loanAmount.toFixed(2)}
                        </div>
                        <div style={{ fontSize: '0.72rem', color: '#64748b' }}>
                          ការប្រាក់: {loan.interestRate}%
                        </div>
                        <div
                          style={{
                            fontSize: '0.7rem',
                            color: '#94a3b8',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            maxWidth: '140px',
                          }}
                        >
                          {loan.purpose}
                        </div>
                      </td>

                      {/* Monthly & Term */}
                      <td style={{ padding: '14px 16px' }}>
                        <div style={{ fontWeight: 800, color: '#4338ca', fontSize: '0.92rem' }}>
                          ${loan.monthlyDeduction.toFixed(2)} / ខែ
                        </div>
                        <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                          រយៈពេល: {loan.termMonths} ខែ ({loan.startDeductionMonth})
                        </div>
                      </td>

                      {/* Repaid & Balance Progress */}
                      <td style={{ padding: '14px 16px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '4px' }}>
                          <span style={{ color: '#16a34a', fontWeight: 700 }}>
                            សង: ${loan.totalRepaid.toFixed(2)}
                          </span>
                          <span style={{ color: '#d97706', fontWeight: 700 }}>
                            នៅសល់: ${loan.remainingBalance.toFixed(2)}
                          </span>
                        </div>
                        <div
                          style={{
                            width: '100%',
                            height: '6px',
                            background: '#e2e8f0',
                            borderRadius: '999px',
                            overflow: 'hidden',
                          }}
                        >
                          <div
                            style={{
                              width: `${progressPct}%`,
                              height: '100%',
                              background: progressPct === 100 ? '#10b981' : '#3b82f6',
                              transition: 'width 0.3s ease',
                            }}
                          />
                        </div>
                        <div style={{ textAlign: 'right', fontSize: '0.68rem', color: '#94a3b8', marginTop: '2px' }}>
                          {progressPct}% រួចរាល់
                        </div>
                      </td>

                      {/* Status Badge */}
                      <td style={{ padding: '14px 16px' }}>
                        <span
                          style={{
                            display: 'inline-flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            background: statusConf.bg,
                            color: statusConf.text,
                            padding: '4px 10px',
                            borderRadius: '8px',
                            fontWeight: 700,
                            fontSize: '0.78rem',
                            lineHeight: 1.2,
                            border: `1px solid ${statusConf.text}33`,
                          }}
                        >
                          <span>{statusConf.labelKh}</span>
                          <span style={{ fontSize: '0.65rem', opacity: 0.85 }}>{statusConf.labelEn}</span>
                        </span>
                      </td>

                      {/* Actions */}
                      <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                        <div style={{ display: 'flex', justifyContent: 'center', gap: '6px' }}>
                          {/* Schedule Button */}
                          <button
                            title="មើលកាលវិភាគបង់ប្រាក់ (Schedule)"
                            onClick={() => {
                              setSelectedLoan(loan);
                              setIsScheduleModalOpen(true);
                            }}
                            style={{
                              background: '#eff6ff',
                              border: '1px solid #bfdbfe',
                              color: '#1d4ed8',
                              padding: '6px 8px',
                              borderRadius: '8px',
                              cursor: 'pointer',
                              fontSize: '0.85rem',
                            }}
                          >
                            📅
                          </button>

                          {/* Print Slip Button */}
                          <button
                            title="បោះពុម្ពកិច្ចសន្យាខ្ចីប្រាក់ (Print Agreement)"
                            onClick={() => {
                              setSelectedLoan(loan);
                              setIsPrintModalOpen(true);
                            }}
                            style={{
                              background: '#f0fdf4',
                              border: '1px solid #bbf7d0',
                              color: '#16a34a',
                              padding: '6px 8px',
                              borderRadius: '8px',
                              cursor: 'pointer',
                              fontSize: '0.85rem',
                            }}
                          >
                            🖨️
                          </button>

                          {/* Quick Repayment Button */}
                          {loan.status === 'ACTIVE' && isHR && (
                            <button
                              title="កត់ត្រាការសងប្រាក់រំលស់ (Record Repayment)"
                              onClick={() => {
                                setSelectedLoan(loan);
                                setPaymentAmount(String(loan.monthlyDeduction));
                                setIsPaymentModalOpen(true);
                              }}
                              style={{
                                background: '#fdf4ff',
                                border: '1px solid #f5d0fe',
                                color: '#a21caf',
                                padding: '6px 8px',
                                borderRadius: '8px',
                                cursor: 'pointer',
                                fontSize: '0.85rem',
                              }}
                            >
                              💰
                            </button>
                          )}

                          {/* Delete */}
                          {['ADMIN'].includes(currentUserRole) && (
                            <button
                              title="លុបកម្ចី (Delete)"
                              onClick={() => handleDeleteLoan(loan.id)}
                              style={{
                                background: '#fef2f2',
                                border: '1px solid #fecaca',
                                color: '#dc2626',
                                padding: '6px 8px',
                                borderRadius: '8px',
                                cursor: 'pointer',
                                fontSize: '0.85rem',
                              }}
                            >
                              🗑️
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL 1: Create New Loan Modal */}
      {isAddModalOpen && (
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
            overflowY: 'auto',
          }}
        >
          <div
            style={{
              background: '#ffffff',
              borderRadius: '20px',
              maxWidth: '680px',
              width: '100%',
              padding: '28px',
              boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
              border: '1px solid #e2e8f0',
              maxHeight: '90vh',
              overflowY: 'auto',
            }}
          >
            {/* Modal Header */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                borderBottom: '1px solid #e2e8f0',
                paddingBottom: '14px',
                marginBottom: '20px',
              }}
            >
              <div>
                <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: '#0f172a' }}>
                  បង្កើតកម្ចីបុគ្គលិក និងកំណត់កាត់រំលស់
                </h3>
                <p style={{ margin: '4px 0 0 0', fontSize: '0.78rem', color: '#64748b' }}>
                  Create Employee Loan & Set Monthly Installment Deduction
                </p>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
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

            <form onSubmit={handleCreateLoan} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Employee Selection */}
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                  ជ្រើសរើសបុគ្គលិកខ្ចីប្រាក់ (Select Employee) *
                </label>
                <select
                  required
                  value={formEmployeeId}
                  onChange={(e) => setFormEmployeeId(e.target.value)}
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
                  <option value="">-- សូមជ្រើសរើសបុគ្គលិក --</option>
                  {employees.map((emp) => {
                    const kh = `${emp.lastNameKh || ''} ${emp.firstNameKh || ''}`.trim();
                    const en = `${emp.firstNameEn || ''} ${emp.lastNameEn || ''}`.trim();
                    return (
                      <option key={emp.id} value={emp.id}>
                        {emp.employeeId} - {kh ? `${kh} (${en})` : en} - {emp.department} [ប្រាក់ខែ: ${emp.basicSalary || 0}]
                      </option>
                    );
                  })}
                </select>
              </div>

              {/* Selected Employee Info Box */}
              {selectedEmp && (
                <div
                  style={{
                    background: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    borderRadius: '10px',
                    padding: '12px 16px',
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
                    gap: '10px',
                    fontSize: '0.78rem',
                  }}
                >
                  <div>
                    <span style={{ color: '#64748b', display: 'block' }}>នាយកដ្ឋាន:</span>
                    <strong style={{ color: '#0f172a' }}>{selectedEmp.department}</strong>
                  </div>
                  <div>
                    <span style={{ color: '#64748b', display: 'block' }}>មុខតំណែង:</span>
                    <strong style={{ color: '#0f172a' }}>{selectedEmp.position}</strong>
                  </div>
                  <div>
                    <span style={{ color: '#64748b', display: 'block' }}>ប្រាក់ខែមូលដ្ឋាន:</span>
                    <strong style={{ color: '#2563eb' }}>${selectedEmp.basicSalary || 0}</strong>
                  </div>
                  <div>
                    <span style={{ color: '#64748b', display: 'block' }}>ទូរស័ព្ទ:</span>
                    <strong style={{ color: '#0f172a' }}>{selectedEmp.phone || '-'}</strong>
                  </div>
                </div>
              )}

              {/* Loan Parameters (Amount, Interest, Term) */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                    ចំនួនទឹកប្រាក់កម្ចី ($) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="10"
                    required
                    value={formAmount}
                    onChange={(e) => setFormAmount(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: '10px',
                      border: '1px solid #cbd5e1',
                      fontSize: '0.95rem',
                      fontWeight: 800,
                      outline: 'none',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                    អត្រាការប្រាក់ (%)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    value={formInterestRate}
                    onChange={(e) => setFormInterestRate(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: '10px',
                      border: '1px solid #cbd5e1',
                      fontSize: '0.95rem',
                      outline: 'none',
                      boxSizing: 'border-box',
                    }}
                    placeholder="0% (គ្មានការប្រាក់)"
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                    រយៈពេល (ខែ) *
                  </label>
                  <select
                    value={formTermMonths}
                    onChange={(e) => setFormTermMonths(e.target.value)}
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
                    <option value="1">1 ខែ (សងផ្ដាច់)</option>
                    <option value="2">2 ខែ</option>
                    <option value="3">3 ខែ</option>
                    <option value="6">6 ខែ (កន្លះឆ្នាំ)</option>
                    <option value="10">10 ខែ</option>
                    <option value="12">12 ខែ (១ ឆ្នាំ)</option>
                    <option value="24">24 ខែ (២ ឆ្នាំ)</option>
                  </select>
                </div>
              </div>

              {/* Calculation Preview Banner */}
              <div
                style={{
                  background: 'linear-gradient(135deg, #eff6ff 0%, #e0e7ff 100%)',
                  border: '1px solid #bfdbfe',
                  borderRadius: '12px',
                  padding: '14px 18px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <div>
                  <div style={{ fontWeight: 800, fontSize: '0.85rem', color: '#1e3a8a' }}>
                    ការកាត់រំលស់ប្រចាំខែប៉ាន់ស្មាន (Monthly Deduction):
                  </div>
                  <div style={{ fontSize: '0.72rem', color: '#3b82f6' }}>
                    រូបមន្ត: ${formAmount} ÷ {formTermMonths} ខែ
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '1.45rem', fontWeight: 900, color: '#1d4ed8' }}>
                    ${calculatedInstallment.toFixed(2)}
                  </div>
                  <div style={{ fontSize: '0.7rem', fontWeight: 600, color: '#2563eb' }}>/ ខែ (Per Month)</div>
                </div>
              </div>

              {/* Start Deduction Month & Purpose */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                    ខែចាប់ផ្តើមកាត់ប្រាក់ *
                  </label>
                  <input
                    type="month"
                    required
                    value={formStartMonth}
                    onChange={(e) => setFormStartMonth(e.target.value)}
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
                    គោលបំណងកម្ចី *
                  </label>
                  <select
                    value={formPurpose}
                    onChange={(e) => setFormPurpose(e.target.value)}
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
                    <option value="បន្ទាន់ផ្ទាល់ខ្លួន (Personal Emergency)">បន្ទាន់ផ្ទាល់ខ្លួន (Personal Emergency)</option>
                    <option value="ព្យាបាលជំងឺ / សុខភាព (Medical / Healthcare)">ព្យាបាលជំងឺ / សុខភាព (Medical / Healthcare)</option>
                    <option value="ថ្លៃសិក្សាអប់រំ (Education / Tuition)">ថ្លៃសិក្សាអប់រំ (Education / Tuition)</option>
                    <option value="ជួសជុលផ្ទះសម្បែង (Home Renovation)">ជួសជុលផ្ទះសម្បែង (Home Renovation)</option>
                    <option value="ទិញមធ្យោបាយធ្វើដំណើរ (Vehicle Purchase)">ទិញមធ្យោបាយធ្វើដំណើរ (Vehicle Purchase)</option>
                    <option value="ផ្សេងៗ (Other)">ផ្សេងៗ (Other)</option>
                  </select>
                </div>
              </div>

              {/* Guarantor Info */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                    ឈ្មោះអ្នកធានា (Guarantor Name)
                  </label>
                  <input
                    type="text"
                    value={formGuarantorName}
                    onChange={(e) => setFormGuarantorName(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: '10px',
                      border: '1px solid #cbd5e1',
                      fontSize: '0.88rem',
                      outline: 'none',
                      boxSizing: 'border-box',
                    }}
                    placeholder="ឈ្មោះអ្នកធានា..."
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                    លេខទូរស័ព្ទអ្នកធានា (Phone)
                  </label>
                  <input
                    type="text"
                    value={formGuarantorPhone}
                    onChange={(e) => setFormGuarantorPhone(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: '10px',
                      border: '1px solid #cbd5e1',
                      fontSize: '0.88rem',
                      outline: 'none',
                      boxSizing: 'border-box',
                    }}
                    placeholder="012 xxx xxx"
                  />
                </div>
              </div>

              {/* Disbursed by & Notes */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                    អ្នកអនុម័ត និងបើកប្រាក់ (Disbursed By)
                  </label>
                  <input
                    type="text"
                    value={formDisbursedBy}
                    onChange={(e) => setFormDisbursedBy(e.target.value)}
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
                    កំណត់សម្គាល់បន្ថែម (Remarks)
                  </label>
                  <input
                    type="text"
                    value={formNotes}
                    onChange={(e) => setFormNotes(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: '10px',
                      border: '1px solid #cbd5e1',
                      fontSize: '0.88rem',
                      outline: 'none',
                      boxSizing: 'border-box',
                    }}
                    placeholder="សម្គាល់ផ្សេងៗ..."
                  />
                </div>
              </div>

              {/* Buttons */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'flex-end',
                  gap: '12px',
                  paddingTop: '16px',
                  borderTop: '1px solid #e2e8f0',
                  marginTop: '6px',
                }}
              >
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  style={{
                    padding: '10px 18px',
                    borderRadius: '10px',
                    border: '1px solid #cbd5e1',
                    background: '#ffffff',
                    color: '#475569',
                    fontWeight: 600,
                    cursor: 'pointer',
                    fontSize: '0.88rem',
                  }}
                >
                  បោះបង់ (Cancel)
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  style={{
                    padding: '10px 22px',
                    borderRadius: '10px',
                    border: 'none',
                    background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
                    color: '#ffffff',
                    fontWeight: 700,
                    cursor: 'pointer',
                    fontSize: '0.88rem',
                    boxShadow: '0 4px 12px rgba(37, 99, 235, 0.25)',
                    opacity: isSubmitting ? 0.7 : 1,
                  }}
                >
                  {isSubmitting ? 'កំពុងរក្សាទុក...' : 'យល់ព្រមបង្កើតកម្ចី (Approve & Create)'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: View Repayment Schedule */}
      {isScheduleModalOpen && selectedLoan && (
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
              maxWidth: '640px',
              width: '100%',
              padding: '28px',
              boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
              border: '1px solid #e2e8f0',
              maxHeight: '90vh',
              overflowY: 'auto',
            }}
          >
            {/* Header */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                borderBottom: '1px solid #e2e8f0',
                paddingBottom: '14px',
                marginBottom: '18px',
              }}
            >
              <div>
                <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: '#0f172a' }}>
                  កាលវិភាគកាត់រំលស់ប្រាក់កម្ចី (Repayment Schedule)
                </h3>
                <p style={{ margin: '4px 0 0 0', fontSize: '0.78rem', color: '#2563eb', fontFamily: 'monospace', fontWeight: 700 }}>
                  {selectedLoan.loanCode} • {selectedLoan.employee.firstNameEn} {selectedLoan.employee.lastNameEn} ({selectedLoan.employee.employeeId})
                </p>
              </div>
              <button
                onClick={() => setIsScheduleModalOpen(false)}
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

            {/* Quick Stat Pill */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr 1fr',
                gap: '10px',
                marginBottom: '16px',
                textAlign: 'center',
              }}
            >
              <div style={{ background: '#f8fafc', padding: '10px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: '0.72rem', color: '#64748b' }}>ប្រាក់ដើមសរុប</div>
                <div style={{ fontSize: '1.1rem', fontWeight: 900, color: '#0f172a' }}>
                  ${selectedLoan.loanAmount.toFixed(2)}
                </div>
              </div>
              <div style={{ background: '#f0fdf4', padding: '10px', borderRadius: '10px', border: '1px solid #bbf7d0' }}>
                <div style={{ fontSize: '0.72rem', color: '#16a34a' }}>បានសងរួច</div>
                <div style={{ fontSize: '1.1rem', fontWeight: 900, color: '#16a34a' }}>
                  ${selectedLoan.totalRepaid.toFixed(2)}
                </div>
              </div>
              <div style={{ background: '#fffbeb', padding: '10px', borderRadius: '10px', border: '1px solid #fde68a' }}>
                <div style={{ fontSize: '0.72rem', color: '#d97706' }}>សមតុល្យនៅសល់</div>
                <div style={{ fontSize: '1.1rem', fontWeight: 900, color: '#d97706' }}>
                  ${selectedLoan.remainingBalance.toFixed(2)}
                </div>
              </div>
            </div>

            {/* Table */}
            <div style={{ border: '1px solid #e2e8f0', borderRadius: '12px', overflow: 'hidden', maxHeight: '320px', overflowY: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem', textAlign: 'left' }}>
                <thead style={{ background: '#f8fafc', position: 'sticky', top: 0, borderBottom: '1px solid #e2e8f0' }}>
                  <tr>
                    <th style={{ padding: '10px 12px', fontWeight: 700 }}>លើកទី</th>
                    <th style={{ padding: '10px 12px', fontWeight: 700 }}>ខែកាត់ប្រាក់</th>
                    <th style={{ padding: '10px 12px', fontWeight: 700 }}>ចំនួនប្រាក់</th>
                    <th style={{ padding: '10px 12px', fontWeight: 700 }}>ស្ថានភាព</th>
                    <th style={{ padding: '10px 12px', fontWeight: 700 }}>កាលបរិច្ឆេទសង</th>
                  </tr>
                </thead>
                <tbody>
                  {Array.isArray(selectedLoan.repaymentSchedule) && selectedLoan.repaymentSchedule.length > 0 ? (
                    selectedLoan.repaymentSchedule.map((inst, i) => (
                      <tr
                        key={i}
                        style={{
                          borderBottom: '1px solid #f1f5f9',
                          background: inst.status === 'PAID' ? '#f0fdf4' : '#ffffff',
                        }}
                      >
                        <td style={{ padding: '10px 12px', fontWeight: 700, color: '#0f172a' }}>
                          លើកទី {inst.installmentNo}
                        </td>
                        <td style={{ padding: '10px 12px', fontFamily: 'monospace' }}>{inst.dueMonth}</td>
                        <td style={{ padding: '10px 12px', fontWeight: 800, color: '#0f172a' }}>
                          ${inst.amount.toFixed(2)}
                        </td>
                        <td style={{ padding: '10px 12px' }}>
                          {inst.status === 'PAID' ? (
                            <span style={{ background: '#dcfce7', color: '#15803d', padding: '3px 8px', borderRadius: '6px', fontSize: '0.72rem', fontWeight: 700 }}>
                              ✓ បានកាត់រួច
                            </span>
                          ) : (
                            <span style={{ background: '#fef3c7', color: '#b45309', padding: '3px 8px', borderRadius: '6px', fontSize: '0.72rem', fontWeight: 700 }}>
                              ⏳ មិនទាន់កាត់
                            </span>
                          )}
                        </td>
                        <td style={{ padding: '10px 12px', color: '#64748b', fontFamily: 'monospace' }}>
                          {inst.paidDate || '-'}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} style={{ padding: '24px', textAlign: 'center', color: '#94a3b8' }}>
                        គ្មានកាលវិភាគលម្អិតទេ
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '18px' }}>
              <button
                onClick={() => setIsScheduleModalOpen(false)}
                style={{
                  padding: '8px 18px',
                  borderRadius: '10px',
                  border: '1px solid #cbd5e1',
                  background: '#ffffff',
                  color: '#475569',
                  fontWeight: 600,
                  cursor: 'pointer',
                  fontSize: '0.85rem',
                }}
              >
                បិទផ្ទាំង (Close)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: Record Manual Payment Modal */}
      {isPaymentModalOpen && selectedLoan && (
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
              maxWidth: '460px',
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
                កត់ត្រាការសងប្រាក់រំលស់
              </h3>
              <button
                onClick={() => setIsPaymentModalOpen(false)}
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

            <p style={{ fontSize: '0.82rem', color: '#64748b', margin: '0 0 16px 0' }}>
              បុគ្គលិក:{' '}
              <strong style={{ color: '#0f172a' }}>
                {selectedLoan.employee.firstNameEn} {selectedLoan.employee.lastNameEn}
              </strong>{' '}
              ({selectedLoan.loanCode})
            </p>

            <form onSubmit={handleRecordPayment} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                  ចំនួនទឹកប្រាក់សង ($) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  max={selectedLoan.remainingBalance}
                  required
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '10px',
                    border: '1px solid #cbd5e1',
                    fontSize: '1.2rem',
                    fontWeight: 900,
                    color: '#2563eb',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: '#64748b', marginTop: '6px' }}>
                  <span>កាត់តាមវេន: ${selectedLoan.monthlyDeduction}</span>
                  <span>នៅជំពាក់សរុប: ${selectedLoan.remainingBalance}</span>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button
                  type="button"
                  onClick={() => setIsPaymentModalOpen(false)}
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
                    background: 'linear-gradient(135deg, #10b981 0%, #047857 100%)',
                    color: '#ffffff',
                    fontSize: '0.85rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    boxShadow: '0 4px 10px rgba(16, 185, 129, 0.25)',
                  }}
                >
                  {isSubmitting ? 'កំពុងកត់ត្រា...' : 'បញ្ជាក់ការសងប្រាក់'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 4: Printable Official Cambodian Loan Agreement & Promissory Note */}
      {isPrintModalOpen && selectedLoan && (
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
              borderRadius: '16px',
              maxWidth: '820px',
              width: '100%',
              padding: '36px',
              boxShadow: '0 20px 40px rgba(0,0,0,0.25)',
              border: '1px solid #e2e8f0',
              maxHeight: '92vh',
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
                paddingBottom: '14px',
                marginBottom: '24px',
              }}
            >
              <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#334155' }}>
                ទម្រង់បោះពុម្ពកិច្ចសន្យាខ្ចីប្រាក់ផ្លូវការ (Official Printable Agreement)
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  onClick={() => window.print()}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '8px 18px',
                    background: '#2563eb',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '8px',
                    fontWeight: 700,
                    fontSize: '0.85rem',
                    cursor: 'pointer',
                  }}
                >
                  <span>🖨️</span> បោះពុម្ពឥឡូវនេះ (Print Now)
                </button>
                <button
                  onClick={() => setIsPrintModalOpen(false)}
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
                  បិទ (Close)
                </button>
              </div>
            </div>

            {/* Official Slip Content */}
            <div style={{ color: '#0f172a', lineHeight: 1.7 }}>
              {/* Royal Kingdom Letterhead */}
              <div style={{ textAlign: 'center', marginBottom: '16px' }}>
                <div style={{ fontSize: '1.1rem', fontWeight: 900 }}>ព្រះរាជាណាចក្រកម្ពុជា</div>
                <div style={{ fontSize: '0.95rem', fontWeight: 800 }}>ជាតិ សាសនា ព្រះមហាក្សត្រ</div>
                <div style={{ fontSize: '0.75rem', fontStyle: 'italic', color: '#64748b' }}>3 3 3</div>
              </div>

              {/* Title */}
              <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                <h1 style={{ margin: 0, fontSize: '1.35rem', fontWeight: 900, color: '#0f172a' }}>
                  កិច្ចសន្យាខ្ចីប្រាក់ និងបង្កាន់ដៃសន្យាសង
                </h1>
                <div style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 600 }}>
                  EMPLOYEE LOAN AGREEMENT & PROMISSORY NOTE • 员工借款合同与借据
                </div>
                <div style={{ fontSize: '0.82rem', fontFamily: 'monospace', fontWeight: 700, color: '#2563eb', marginTop: '4px' }}>
                  លេខកូដកិច្ចសន្យា: {selectedLoan.loanCode}
                </div>
              </div>

              {/* Intro Body */}
              <div style={{ fontSize: '0.85rem', marginBottom: '14px' }}>
                ថ្ងៃនេះ ត្រូវនឹងថ្ងៃទី{' '}
                <strong>{new Date(selectedLoan.disbursementDate).getDate()}</strong> ខែ{' '}
                <strong>{new Date(selectedLoan.disbursementDate).getMonth() + 1}</strong> ឆ្នាំ{' '}
                <strong>{new Date(selectedLoan.disbursementDate).getFullYear()}</strong>, ភាគីទាំងពីរបានព្រមព្រៀងគ្នាចុះកិច្ចសន្យាដូចខាងក្រោម៖
              </div>

              {/* Parties Box */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '16px',
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '12px',
                  padding: '16px',
                  marginBottom: '16px',
                  fontSize: '0.82rem',
                }}
              >
                <div>
                  <div style={{ fontWeight: 800, borderBottom: '1px solid #cbd5e1', paddingBottom: '4px', marginBottom: '8px' }}>
                    ភាគី (ក) ក្រុមហ៊ុនផ្តល់កម្ចី (Lender):
                  </div>
                  <div>តំណាងដោយ: <strong>{selectedLoan.disbursedBy || 'Finance & HR Management'}</strong></div>
                  <div>ស្ថាប័ន: <strong>HRM Enterprise Organization</strong></div>
                </div>

                <div>
                  <div style={{ fontWeight: 800, borderBottom: '1px solid #cbd5e1', paddingBottom: '4px', marginBottom: '8px' }}>
                    ភាគី (ខ) បុគ្គលិកអ្នកខ្ចីប្រាក់ (Borrower):
                  </div>
                  <div>
                    ឈ្មោះ: <strong>{selectedLoan.employee.lastNameKh || ''} {selectedLoan.employee.firstNameKh || ''} ({selectedLoan.employee.firstNameEn} {selectedLoan.employee.lastNameEn})</strong>
                  </div>
                  <div>អត្តលេខ: <strong>{selectedLoan.employee.employeeId}</strong></div>
                  <div>នាយកដ្ឋាន: <strong>{selectedLoan.employee.department}</strong> | មុខតំណែង: <strong>{selectedLoan.employee.position}</strong></div>
                  <div>ទូរស័ព្ទ: <strong>{selectedLoan.employee.phone || '-'}</strong></div>
                </div>
              </div>

              {/* Terms & Articles */}
              <div style={{ fontSize: '0.82rem', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div>
                  <strong>ប្រការ ១: ចំនួនទឹកប្រាក់កម្ចី និងអត្រាការប្រាក់ (Loan Amount & Interest)</strong>
                  <p style={{ margin: '2px 0 0 16px', color: '#334155' }}>
                    ភាគី (ក) យល់ព្រមផ្តល់កម្ចីជាប្រាក់សុទ្ធចំនួន <strong>${selectedLoan.loanAmount.toFixed(2)}</strong> (ដុល្លារអាមេរិក) ជូនភាគី (ខ) ក្នុងគោលបំណង <strong>{selectedLoan.purpose}</strong> ដោយមានអត្រាការប្រាក់ <strong>{selectedLoan.interestRate}%</strong>។
                  </p>
                </div>

                <div>
                  <strong>ប្រការ ២: លក្ខខណ្ឌនៃការសងរំលស់ (Repayment Terms)</strong>
                  <p style={{ margin: '2px 0 0 16px', color: '#334155' }}>
                    ភាគី (ខ) យល់ព្រមឱ្យក្រុមហ៊ុនកាត់កងប្រាក់រំលស់ដោយស្វ័យប្រវត្តិចេញពីប្រាក់បៀវត្សប្រចាំខែចំនួន <strong>${selectedLoan.monthlyDeduction.toFixed(2)}</strong> ក្នុងមួយខែ សម្រាប់រយៈពេល <strong>{selectedLoan.termMonths} ខែ</strong> ដោយចាប់ផ្តើមកាត់ចាប់ពីខែ <strong>{selectedLoan.startDeductionMonth}</strong> រហូតដល់ទូទាត់រួចរាល់។
                  </p>
                </div>

                <div>
                  <strong>ប្រការ ៣: ករណីបញ្ចប់កិច្ចសន្យាការងារ ឬលាលែង (Termination / Resignation)</strong>
                  <p style={{ margin: '2px 0 0 16px', color: '#334155' }}>
                    ក្នុងករណីដែលភាគី (ខ) លាលែង ឬត្រូវបញ្ឈប់ការងារមុនពេលកម្ចីត្រូវបានសងរួច សមតុល្យដែលនៅសេសសល់ទាំងអស់ នឹងត្រូវកាត់កងចេញពីប្រាក់ឈ្នួលចុងក្រោយ (Final Settlement) ឬប្រាក់បំណាច់អតីតភាព។ ប្រសិនបើនៅខ្វះ ភាគី (ខ) និងអ្នកធានាត្រូវសងបង្គ្រប់ភ្លាមៗ។
                  </p>
                </div>

                {selectedLoan.guarantorName && (
                  <div>
                    <strong>ប្រការ ៤: អ្នកធានា (Guarantor)</strong>
                    <p style={{ margin: '2px 0 0 16px', color: '#334155' }}>
                      កម្ចីនេះត្រូវបានធានាដោយ: <strong>{selectedLoan.guarantorName}</strong> (ទូរស័ព្ទ: <strong>{selectedLoan.guarantorPhone || '-'}</strong>)។
                    </p>
                  </div>
                )}
              </div>

              {/* 3 Signatures */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr 1fr',
                  gap: '16px',
                  textAlign: 'center',
                  marginTop: '40px',
                  paddingTop: '16px',
                  fontSize: '0.8rem',
                }}
              >
                <div>
                  <div style={{ fontWeight: 800 }}>ហត្ថលេខាអ្នកខ្ចី (Borrower)</div>
                  <div style={{ fontSize: '0.7rem', color: '#64748b' }}>ស្នាមមេដៃស្តាំ</div>
                  <div style={{ height: '70px', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
                    <span style={{ color: '#cbd5e1' }}>..................................</span>
                  </div>
                  <div style={{ fontWeight: 700, marginTop: '4px' }}>
                    {selectedLoan.employee.lastNameKh || ''} {selectedLoan.employee.firstNameKh || ''}
                  </div>
                </div>

                <div>
                  <div style={{ fontWeight: 800 }}>ហត្ថលេខាអ្នកធានា (Guarantor)</div>
                  <div style={{ fontSize: '0.7rem', color: '#64748b' }}>ប្រសិនបើមាន</div>
                  <div style={{ height: '70px', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
                    <span style={{ color: '#cbd5e1' }}>..................................</span>
                  </div>
                  <div style={{ fontWeight: 700, marginTop: '4px' }}>
                    {selectedLoan.guarantorName || '..................................'}
                  </div>
                </div>

                <div>
                  <div style={{ fontWeight: 800 }}>អ្នកអនុម័ត និងបើកប្រាក់ (Approver)</div>
                  <div style={{ fontSize: '0.7rem', color: '#64748b' }}>ប្រធានផ្នែកហិរញ្ញវត្ថុ / HR</div>
                  <div style={{ height: '70px', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
                    <span style={{ color: '#cbd5e1' }}>..................................</span>
                  </div>
                  <div style={{ fontWeight: 700, marginTop: '4px' }}>
                    {selectedLoan.disbursedBy || 'HR & Finance Director'}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
