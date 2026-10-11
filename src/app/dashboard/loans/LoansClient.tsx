'use client';

import React, { useState, useMemo } from 'react';
import * as XLSX from 'xlsx';

interface Employee {
  id: string;
  employeeId: string;
  firstNameEn: string;
  lastNameEn: string;
  firstNameKh: string | null;
  lastNameKh: string | null;
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

export default function LoansClient({
  initialLoans,
  employees,
  currentUserRole,
}: LoansClientProps) {
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
  const [formDisbursedBy, setFormDisbursedBy] = useState('Finance / HR Management');
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
      alert('សូមបំពេញព័ត៌មានចាំបាច់ទាំងអស់ (Please fill all required fields)');
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
      alert('បានបង្កើតកម្ចីបុគ្គលិកដោយជោគជ័យ! (Loan created successfully!)');
    } catch (err: any) {
      alert(err.message || 'Error occurred');
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
      alert('បានកត់ត្រាការសងប្រាក់ជោគជ័យ! (Repayment recorded successfully!)');
    } catch (err: any) {
      alert(err.message || 'Payment error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Delete Loan
  const handleDeleteLoan = async (id: string) => {
    if (!confirm('តើអ្នកពិតជាចង់លុបកម្ចីនេះមែនទេ? (Are you sure you want to delete this loan?)')) return;

    try {
      const res = await fetch(`/api/loans?id=${id}`, { method: 'DELETE' });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Delete failed');
      }
      setLoans((prev) => prev.filter((l) => l.id !== id));
      alert('បានលុបកម្ចីជោគជ័យ! (Loan deleted successfully!)');
    } catch (err: any) {
      alert(err.message || 'Delete error');
    }
  };

  // Excel Export with 3 languages stacked and autoFitColumns
  const handleExportExcel = () => {
    if (filteredLoans.length === 0) {
      alert('គ្មានទិន្នន័យសម្រាប់ទាញយកទេ (No data to export)');
      return;
    }

    const exportData = filteredLoans.map((l, index) => {
      const empNameKh = `${l.employee.lastNameKh || ''} ${l.employee.firstNameKh || ''}`.trim();
      const empNameEn = `${l.employee.firstNameEn || ''} ${l.employee.lastNameEn || ''}`.trim();

      return {
        'ល.រ / No / 序号': index + 1,
        'កូដកម្ចី / Loan Code / 借款编号': l.loanCode,
        'អត្តលេខ / Emp ID / 工号': l.employee.employeeId,
        'ឈ្មោះខ្មែរ / Khmer Name / 柬文姓名': empNameKh || 'N/A',
        'ឈ្មោះអង់គ្លេស / English Name / 英文姓名': empNameEn,
        'នាយកដ្ឋាន / Department / 部门': l.employee.department,
        'មុខតំណែង / Position / 职位': l.employee.position,
        'ប្រាក់កម្ចីសរុប / Loan Amount ($) / 借款本金': l.loanAmount,
        'អត្រាការប្រាក់ / Interest Rate (%) / 年利率': `${l.interestRate}%`,
        'រយៈពេល (ខែ) / Term (Months) / 还款期限': l.termMonths,
        'កាត់ប្រចាំខែ / Monthly Deduction ($) / 每月扣除': l.monthlyDeduction,
        'បានសងសរុប / Total Repaid ($) / 已还金额': l.totalRepaid,
        'សមតុល្យនៅសល់ / Remaining Balance ($) / 剩余欠款': l.remainingBalance,
        'ខែចាប់ផ្តើមកាត់ / Start Deduction Month / 开始扣款月份': l.startDeductionMonth,
        'គោលបំណង / Purpose / 借款用途': l.purpose,
        'អ្នកធានា / Guarantor / 担保人': l.guarantorName || 'N/A',
        'លេខទូរស័ព្ទអ្នកធានា / Guarantor Phone / 担保人电话': l.guarantorPhone || 'N/A',
        'ស្ថានភាព / Status / 状态':
          l.status === 'ACTIVE'
            ? 'កំពុងកាត់រំលស់ (ACTIVE)'
            : l.status === 'PAID_OFF'
            ? 'បានសងរួចរាល់ (PAID OFF)'
            : l.status,
        'កាលបរិច្ឆេទបើក / Disbursement Date / 放款日期': new Date(l.disbursementDate).toLocaleDateString(),
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
    XLSX.writeFile(wb, `Employee_Loans_Report_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return (
          <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800 border border-blue-200 flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
            កំពុងកាត់រំលស់ / Active / 还款中
          </span>
        );
      case 'PAID_OFF':
        return (
          <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1">
            <span>✓</span> បានសងរួច / Paid Off / 已结清
          </span>
        );
      case 'DEFAULTED':
        return (
          <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-rose-100 text-rose-800 border border-rose-200">
            ខកខានសង / Defaulted / 违约
          </span>
        );
      case 'REJECTED':
        return (
          <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-slate-100 text-slate-700 border border-slate-200">
            បដិសេធ / Rejected / 已拒绝
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-amber-100 text-amber-800 border border-amber-200">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Top Banner / Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 p-6 rounded-2xl shadow-xl text-white">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-3xl">💳</span>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              ប្រព័ន្ធគ្រប់គ្រងប្រាក់កម្ចីបុគ្គលិក និងការកាត់រំលស់ប្រចាំខែ
            </h1>
          </div>
          <p className="text-sm font-medium text-blue-200">
            Employee Loan & Monthly Installment Deduction Management System
          </p>
          <p className="text-xs text-indigo-300">
            员工借款与分期还款扣发管理系统
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={handleExportExcel}
            className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-xl shadow-md transition-all active:scale-95 text-sm"
          >
            <span>📥</span>
            <div className="text-left leading-tight">
              <span className="block font-bold">ទាញយកជា Excel</span>
              <span className="text-[10px] text-emerald-100 block">Export Excel / 导出表格</span>
            </div>
          </button>

          {['ADMIN', 'HR_MANAGER', 'PAYROLL_ADMIN'].includes(currentUserRole) && (
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-medium rounded-xl shadow-md transition-all active:scale-95 text-sm"
            >
              <span className="text-lg">➕</span>
              <div className="text-left leading-tight">
                <span className="block font-bold">បង្កើតកម្ចីថ្មី</span>
                <span className="text-[10px] text-blue-100 block">New Loan / 新增借款</span>
              </div>
            </button>
          )}
        </div>
      </div>

      {/* Metrics Cards - 3 languages stacked */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1 */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-2xl p-2.5 rounded-lg bg-blue-50 text-blue-600">💵</span>
            <span className="text-xs px-2 py-0.5 rounded bg-blue-100 text-blue-700 font-bold">Total</span>
          </div>
          <div className="mt-3">
            <div className="text-xs text-slate-500 font-semibold leading-tight">
              <p className="font-bold text-slate-800">សរុបប្រាក់កម្ចីផ្តល់ជូន</p>
              <p className="text-[11px] text-slate-500">Total Loan Amount</p>
              <p className="text-[10px] text-slate-400">借款总额</p>
            </div>
            <p className="text-2xl font-black text-slate-900 mt-1">
              ${metrics.totalPrincipal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          </div>
        </div>

        {/* Metric 2 */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-2xl p-2.5 rounded-lg bg-amber-50 text-amber-600">⚖️</span>
            <span className="text-xs px-2 py-0.5 rounded bg-amber-100 text-amber-700 font-bold">Outstanding</span>
          </div>
          <div className="mt-3">
            <div className="text-xs text-slate-500 font-semibold leading-tight">
              <p className="font-bold text-slate-800">សមតុល្យជំពាក់នៅសល់</p>
              <p className="text-[11px] text-slate-500">Active Balance</p>
              <p className="text-[10px] text-slate-400">剩余未还本息</p>
            </div>
            <p className="text-2xl font-black text-amber-600 mt-1">
              ${metrics.totalActiveBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          </div>
        </div>

        {/* Metric 3 */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-2xl p-2.5 rounded-lg bg-indigo-50 text-indigo-600">📅</span>
            <span className="text-xs px-2 py-0.5 rounded bg-indigo-100 text-indigo-700 font-bold">Monthly</span>
          </div>
          <div className="mt-3">
            <div className="text-xs text-slate-500 font-semibold leading-tight">
              <p className="font-bold text-slate-800">កាត់រំលស់សរុបប្រចាំខែ</p>
              <p className="text-[11px] text-slate-500">Monthly Deductions</p>
              <p className="text-[10px] text-slate-400">每月计划扣除额</p>
            </div>
            <p className="text-2xl font-black text-indigo-600 mt-1">
              ${metrics.totalMonthlyDeductions.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          </div>
        </div>

        {/* Metric 4 */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-2xl p-2.5 rounded-lg bg-emerald-50 text-emerald-600">✅</span>
            <span className="text-xs px-2 py-0.5 rounded bg-emerald-100 text-emerald-700 font-bold">Completed</span>
          </div>
          <div className="mt-3">
            <div className="text-xs text-slate-500 font-semibold leading-tight">
              <p className="font-bold text-slate-800">បានសងរួចរាល់ទាំងស្រុង</p>
              <p className="text-[11px] text-slate-500">Fully Paid Off Loans</p>
              <p className="text-[10px] text-slate-400">已全额结清笔数</p>
            </div>
            <p className="text-2xl font-black text-emerald-600 mt-1">
              {metrics.paidOffCount}{' '}
              <span className="text-xs font-normal text-slate-500">នាក់ (Cases)</span>
            </p>
          </div>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-4 justify-between items-center">
        <div className="w-full md:w-1/3 relative">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="ស្វែងរកតាមឈ្មោះ, អត្តលេខ, កូដកម្ចី... / Search by name, ID, loan code..."
            className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <span className="absolute left-3 top-2.5 text-slate-400">🔍</span>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          {/* Status Filter */}
          <div className="flex items-center gap-1.5 text-sm">
            <span className="text-xs text-slate-500 font-medium">ស្ថានភាព:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="border border-slate-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="ALL">ទាំងអស់ (All Status)</option>
              <option value="ACTIVE">កំពុងកាត់រំលស់ (Active)</option>
              <option value="PAID_OFF">បានសងរួច (Paid Off)</option>
              <option value="DEFAULTED">ខកខានសង (Defaulted)</option>
            </select>
          </div>

          {/* Department Filter */}
          <div className="flex items-center gap-1.5 text-sm">
            <span className="text-xs text-slate-500 font-medium">នាយកដ្ឋាន:</span>
            <select
              value={departmentFilter}
              onChange={(e) => setDepartmentFilter(e.target.value)}
              className="border border-slate-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="ALL">គ្រប់នាយកដ្ឋាន (All Depts)</option>
              {departments.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Main Table with 3 languages stacked in headers */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-sm text-left">
            <thead className="bg-slate-50 text-slate-700">
              <tr>
                <th scope="col" className="px-4 py-3 border-b border-slate-200 font-semibold">
                  <div className="leading-tight">
                    <span className="block font-bold text-slate-900">កូដកម្ចី</span>
                    <span className="block text-[11px] text-slate-600">Loan Code</span>
                    <span className="block text-[10px] text-slate-400">借款单号</span>
                  </div>
                </th>
                <th scope="col" className="px-4 py-3 border-b border-slate-200 font-semibold">
                  <div className="leading-tight">
                    <span className="block font-bold text-slate-900">បុគ្គលិកស្នើសុំ</span>
                    <span className="block text-[11px] text-slate-600">Employee</span>
                    <span className="block text-[10px] text-slate-400">借款员工</span>
                  </div>
                </th>
                <th scope="col" className="px-4 py-3 border-b border-slate-200 font-semibold">
                  <div className="leading-tight">
                    <span className="block font-bold text-slate-900">នាយកដ្ឋាន / មុខតំណែង</span>
                    <span className="block text-[11px] text-slate-600">Dept / Position</span>
                    <span className="block text-[10px] text-slate-400">部门 / 职位</span>
                  </div>
                </th>
                <th scope="col" className="px-4 py-3 border-b border-slate-200 font-semibold">
                  <div className="leading-tight">
                    <span className="block font-bold text-slate-900">ប្រាក់កម្ចីដើម</span>
                    <span className="block text-[11px] text-slate-600">Loan Principal</span>
                    <span className="block text-[10px] text-slate-400">借款本金</span>
                  </div>
                </th>
                <th scope="col" className="px-4 py-3 border-b border-slate-200 font-semibold">
                  <div className="leading-tight">
                    <span className="block font-bold text-slate-900">កាត់ប្រចាំខែ (រយៈពេល)</span>
                    <span className="block text-[11px] text-slate-600">Monthly / Term</span>
                    <span className="block text-[10px] text-slate-400">月扣 / 期限</span>
                  </div>
                </th>
                <th scope="col" className="px-4 py-3 border-b border-slate-200 font-semibold">
                  <div className="leading-tight">
                    <span className="block font-bold text-slate-900">បានសង / សមតុល្យ</span>
                    <span className="block text-[11px] text-slate-600">Repaid / Balance</span>
                    <span className="block text-[10px] text-slate-400">已还 / 剩余</span>
                  </div>
                </th>
                <th scope="col" className="px-4 py-3 border-b border-slate-200 font-semibold">
                  <div className="leading-tight">
                    <span className="block font-bold text-slate-900">ស្ថានភាព</span>
                    <span className="block text-[11px] text-slate-600">Status</span>
                    <span className="block text-[10px] text-slate-400">状态</span>
                  </div>
                </th>
                <th scope="col" className="px-4 py-3 border-b border-slate-200 font-semibold text-center">
                  <div className="leading-tight">
                    <span className="block font-bold text-slate-900">សកម្មភាព</span>
                    <span className="block text-[11px] text-slate-600">Actions</span>
                    <span className="block text-[10px] text-slate-400">操作</span>
                  </div>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {filteredLoans.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <span className="text-4xl">📂</span>
                      <p className="font-semibold text-slate-600">មិនមានទិន្នន័យកម្ចីបុគ្គលិកទេ (No Loans Found)</p>
                      <p className="text-xs text-slate-400">សូមចុច "បង្កើតកម្ចីថ្មី" ដើម្បីបញ្ចូលកម្ចីដំបូង</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredLoans.map((loan) => {
                  const empNameKh = `${loan.employee.lastNameKh || ''} ${loan.employee.firstNameKh || ''}`.trim();
                  const empNameEn = `${loan.employee.firstNameEn || ''} ${loan.employee.lastNameEn || ''}`.trim();
                  const progressPct =
                    loan.loanAmount > 0
                      ? Math.min(100, Math.round((loan.totalRepaid / loan.loanAmount) * 100))
                      : 0;

                  return (
                    <tr key={loan.id} className="hover:bg-slate-50 transition-colors">
                      {/* Loan Code */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="font-mono font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded text-xs">
                          {loan.loanCode}
                        </span>
                        <div className="text-[11px] text-slate-400 mt-0.5">
                          {new Date(loan.disbursementDate).toLocaleDateString()}
                        </div>
                      </td>

                      {/* Employee Info */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          {loan.employee.photoUrl ? (
                            <img
                              src={loan.employee.photoUrl}
                              alt=""
                              className="w-9 h-9 rounded-full object-cover border border-slate-200"
                            />
                          ) : (
                            <div className="w-9 h-9 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-xs">
                              {(loan.employee.firstNameEn?.[0] || 'E')}
                            </div>
                          )}
                          <div>
                            <div className="font-bold text-slate-900 leading-tight">
                              {empNameKh || empNameEn}
                            </div>
                            <div className="text-xs text-slate-500">{empNameEn}</div>
                            <div className="text-[11px] font-mono text-indigo-600">
                              ID: {loan.employee.employeeId}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Dept / Position */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="font-medium text-slate-800">{loan.employee.department}</div>
                        <div className="text-xs text-slate-500">{loan.employee.position}</div>
                        {loan.employee.phone && (
                          <div className="text-[11px] text-slate-400">📞 {loan.employee.phone}</div>
                        )}
                      </td>

                      {/* Principal Loan Amount */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="font-black text-slate-900 text-base">
                          ${loan.loanAmount.toFixed(2)}
                        </div>
                        <div className="text-[11px] text-slate-500">
                          ការប្រាក់ (Interest): {loan.interestRate}%
                        </div>
                        <div className="text-[10px] text-slate-400 truncate max-w-[150px]">
                          {loan.purpose}
                        </div>
                      </td>

                      {/* Monthly & Term */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="font-bold text-indigo-700">
                          ${loan.monthlyDeduction.toFixed(2)} / ខែ
                        </div>
                        <div className="text-xs text-slate-500">
                          រយៈពេល: {loan.termMonths} ខែ ({loan.startDeductionMonth})
                        </div>
                      </td>

                      {/* Repaid & Remaining */}
                      <td className="px-4 py-3 whitespace-nowrap min-w-[160px]">
                        <div className="flex justify-between items-center text-xs mb-1">
                          <span className="text-emerald-700 font-bold">
                            សង: ${loan.totalRepaid.toFixed(2)}
                          </span>
                          <span className="text-amber-700 font-bold">
                            នៅសល់: ${loan.remainingBalance.toFixed(2)}
                          </span>
                        </div>
                        <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                          <div
                            className={`h-full ${
                              progressPct === 100 ? 'bg-emerald-500' : 'bg-blue-600'
                            }`}
                            style={{ width: `${progressPct}%` }}
                          ></div>
                        </div>
                        <div className="text-right text-[10px] text-slate-400 mt-0.5">
                          {progressPct}% រួចរាល់
                        </div>
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        {getStatusBadge(loan.status)}
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3 whitespace-nowrap text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          {/* Schedule / Detail Button */}
                          <button
                            title="មើលកាលវិភាគបង់ប្រាក់ / View Schedule"
                            onClick={() => {
                              setSelectedLoan(loan);
                              setIsScheduleModalOpen(true);
                            }}
                            className="p-1.5 rounded-lg text-indigo-600 hover:bg-indigo-50 border border-indigo-200 transition-colors"
                          >
                            📅
                          </button>

                          {/* Print Loan Agreement Button */}
                          <button
                            title="បោះពុម្ពកិច្ចសន្យាខ្ចីប្រាក់ / Print Agreement"
                            onClick={() => {
                              setSelectedLoan(loan);
                              setIsPrintModalOpen(true);
                            }}
                            className="p-1.5 rounded-lg text-emerald-600 hover:bg-emerald-50 border border-emerald-200 transition-colors"
                          >
                            🖨️
                          </button>

                          {/* Record Payment Button (only for active loans) */}
                          {loan.status === 'ACTIVE' &&
                            ['ADMIN', 'HR_MANAGER', 'PAYROLL_ADMIN'].includes(currentUserRole) && (
                              <button
                                title="កត់ត្រាការសងប្រាក់ / Record Repayment"
                                onClick={() => {
                                  setSelectedLoan(loan);
                                  setPaymentAmount(String(loan.monthlyDeduction));
                                  setIsPaymentModalOpen(true);
                                }}
                                className="p-1.5 rounded-lg text-blue-600 hover:bg-blue-50 border border-blue-200 transition-colors"
                              >
                                💰
                              </button>
                            )}

                          {/* Delete Loan */}
                          {['ADMIN'].includes(currentUserRole) && (
                            <button
                              title="លុបកម្ចី / Delete Loan"
                              onClick={() => handleDeleteLoan(loan.id)}
                              className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 border border-rose-200 transition-colors"
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

      {/* MODAL 1: Create New Loan */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-6 space-y-6 my-8">
            <div className="flex justify-between items-center border-b pb-3">
              <div>
                <h3 className="text-xl font-black text-slate-900">
                  ពាក្យស្នើសុំ និងបង្កើតកម្ចីបុគ្គលិកថ្មី
                </h3>
                <p className="text-xs text-slate-500">
                  Create Employee Loan Application & Installment Deduction
                </p>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-2xl font-bold"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleCreateLoan} className="space-y-4">
              {/* Employee Selection */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  ជ្រើសរើសបុគ្គលិកខ្ចីប្រាក់ (Select Employee) *
                </label>
                <select
                  required
                  value={formEmployeeId}
                  onChange={(e) => setFormEmployeeId(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-500"
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

              {/* Show selected employee summary */}
              {selectedEmp && (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-xs grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <div>
                    <span className="text-slate-500 block">នាយកដ្ឋាន:</span>
                    <span className="font-bold text-slate-800">{selectedEmp.department}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">មុខតំណែង:</span>
                    <span className="font-bold text-slate-800">{selectedEmp.position}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">ប្រាក់ខែមូលដ្ឋាន:</span>
                    <span className="font-bold text-blue-700">${selectedEmp.basicSalary || 0}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">ទូរស័ព្ទ:</span>
                    <span className="font-bold text-slate-800">{selectedEmp.phone || 'N/A'}</span>
                  </div>
                </div>
              )}

              {/* Loan Details Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    ចំនួនទឹកប្រាក់កម្ចី ($) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="10"
                    required
                    value={formAmount}
                    onChange={(e) => setFormAmount(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg p-2 text-sm font-black text-slate-900 focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    អត្រាការប្រាក់ (% ក្នុងមួយឆ្នាំ)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    value={formInterestRate}
                    onChange={(e) => setFormInterestRate(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500"
                    placeholder="0% (គ្មានការប្រាក់)"
                  />
                  <span className="text-[10px] text-slate-400">0% = កម្ចីបុគ្គលិកផ្ទៃក្នុង</span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    រយៈពេលរំលស់ (ខែ) *
                  </label>
                  <select
                    value={formTermMonths}
                    onChange={(e) => setFormTermMonths(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="1">1 ខែ (សងផ្ដាច់ខែក្រោយ)</option>
                    <option value="2">2 ខែ</option>
                    <option value="3">3 ខែ</option>
                    <option value="6">6 ខែ (កន្លះឆ្នាំ)</option>
                    <option value="10">10 ខែ</option>
                    <option value="12">12 ខែ (១ ឆ្នាំ)</option>
                    <option value="24">24 ខែ (២ ឆ្នាំ)</option>
                  </select>
                </div>
              </div>

              {/* Simulation Result Banner */}
              <div className="p-3.5 bg-gradient-to-r from-indigo-50 to-blue-50 border border-indigo-200 rounded-xl flex items-center justify-between">
                <div>
                  <span className="text-xs text-indigo-800 font-bold block">
                    ការកាត់រំលស់ប្រចាំខែប៉ាន់ស្មាន (Estimated Monthly Deduction):
                  </span>
                  <span className="text-[11px] text-slate-500">
                    ស្មើនឹង: ${formAmount} ÷ {formTermMonths} ខែ
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-2xl font-black text-indigo-700">
                    ${calculatedInstallment.toFixed(2)}
                  </span>
                  <span className="text-xs text-indigo-600 font-semibold block">/ ខែ (Per Month)</span>
                </div>
              </div>

              {/* Start Deduction Month & Purpose */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    ខែចាប់ផ្តើមកាត់ប្រាក់ (Start Deduction Month) *
                  </label>
                  <input
                    type="month"
                    required
                    value={formStartMonth}
                    onChange={(e) => setFormStartMonth(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    គោលបំណងកម្ចី (Loan Purpose) *
                  </label>
                  <select
                    value={formPurpose}
                    onChange={(e) => setFormPurpose(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500"
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

              {/* Guarantor Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    ឈ្មោះអ្នកធានា (Guarantor Name)
                  </label>
                  <input
                    type="text"
                    value={formGuarantorName}
                    onChange={(e) => setFormGuarantorName(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500"
                    placeholder="ឈ្មោះបុគ្គលិក ឬសាច់ញាតិអ្នកធានា"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    លេខទូរស័ព្ទអ្នកធានា (Guarantor Phone)
                  </label>
                  <input
                    type="text"
                    value={formGuarantorPhone}
                    onChange={(e) => setFormGuarantorPhone(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500"
                    placeholder="012 xxx xxx"
                  />
                </div>
              </div>

              {/* Disbursed by & Notes */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    អ្នកអនុម័ត និងបើកប្រាក់ (Disbursed By)
                  </label>
                  <input
                    type="text"
                    value={formDisbursedBy}
                    onChange={(e) => setFormDisbursedBy(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    កំណត់សម្គាល់បន្ថែម (Remarks / Notes)
                  </label>
                  <input
                    type="text"
                    value={formNotes}
                    onChange={(e) => setFormNotes(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500"
                    placeholder="សម្គាល់ផ្សេងៗ..."
                  />
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex justify-end gap-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 text-sm font-semibold"
                >
                  បោះបង់ (Cancel)
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-bold shadow-md transition-all active:scale-95 disabled:opacity-50"
                >
                  {isSubmitting ? 'កំពុងបង្កើត... (Saving...)' : 'យល់ព្រមបង្កើតកម្ចី (Approve & Create Loan)'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: View Repayment Schedule */}
      {isScheduleModalOpen && selectedLoan && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-6 space-y-5 my-8">
            <div className="flex justify-between items-center border-b pb-3">
              <div>
                <h3 className="text-lg font-black text-slate-900">
                  កាលវិភាគកាត់រំលស់ប្រាក់កម្ចី (Repayment Schedule)
                </h3>
                <p className="text-xs text-indigo-600 font-mono font-bold">
                  {selectedLoan.loanCode} - {selectedLoan.employee.firstNameEn} {selectedLoan.employee.lastNameEn} ({selectedLoan.employee.employeeId})
                </p>
              </div>
              <button
                onClick={() => setIsScheduleModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-2xl font-bold"
              >
                &times;
              </button>
            </div>

            {/* Quick Summary Cards */}
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="p-3 bg-slate-50 border rounded-lg">
                <span className="text-xs text-slate-500 block">ប្រាក់កម្ចីដើម</span>
                <span className="text-base font-black text-slate-900">${selectedLoan.loanAmount.toFixed(2)}</span>
              </div>
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
                <span className="text-xs text-emerald-700 block">បានសងរួច</span>
                <span className="text-base font-black text-emerald-700">${selectedLoan.totalRepaid.toFixed(2)}</span>
              </div>
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                <span className="text-xs text-amber-700 block">សមតុល្យនៅជំពាក់</span>
                <span className="text-base font-black text-amber-700">${selectedLoan.remainingBalance.toFixed(2)}</span>
              </div>
            </div>

            {/* Schedule Table */}
            <div className="border rounded-xl overflow-hidden max-h-80 overflow-y-auto">
              <table className="min-w-full text-xs text-left divide-y divide-slate-200">
                <thead className="bg-slate-100 text-slate-700 font-semibold sticky top-0">
                  <tr>
                    <th className="px-3 py-2">ដំណាក់កាល / Installment</th>
                    <th className="px-3 py-2">ខែកាត់ប្រាក់ / Due Month</th>
                    <th className="px-3 py-2">ចំនួនទឹកប្រាក់ / Amount</th>
                    <th className="px-3 py-2">ស្ថានភាព / Status</th>
                    <th className="px-3 py-2">ថ្ងៃសង / Paid Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {Array.isArray(selectedLoan.repaymentSchedule) &&
                  selectedLoan.repaymentSchedule.length > 0 ? (
                    selectedLoan.repaymentSchedule.map((inst: any, idx: number) => (
                      <tr key={idx} className={inst.status === 'PAID' ? 'bg-emerald-50/50' : ''}>
                        <td className="px-3 py-2 font-bold text-slate-700">
                          លើកទី {inst.installmentNo}
                        </td>
                        <td className="px-3 py-2 font-mono">{inst.dueMonth}</td>
                        <td className="px-3 py-2 font-bold text-slate-900">${inst.amount.toFixed(2)}</td>
                        <td className="px-3 py-2">
                          {inst.status === 'PAID' ? (
                            <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold">
                              ✓ បានកាត់រួច
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-800 font-bold">
                              ⏳ មិនទាន់កាត់
                            </span>
                          )}
                        </td>
                        <td className="px-3 py-2 text-slate-500 font-mono">
                          {inst.paidDate || '-'}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="text-center py-6 text-slate-400">
                        គ្មានតារាងកាលវិភាគលម្អិតទេ
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="flex justify-end">
              <button
                onClick={() => setIsScheduleModalOpen(false)}
                className="px-4 py-2 bg-slate-800 text-white rounded-lg text-xs font-bold"
              >
                បិទផ្ទាំង (Close)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: Record Manual Payment */}
      {isPaymentModalOpen && selectedLoan && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex justify-between items-center border-b pb-2">
              <h3 className="text-lg font-black text-slate-900">
                កត់ត្រាការទូទាត់សងកម្ចី
              </h3>
              <button
                onClick={() => setIsPaymentModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-2xl font-bold"
              >
                &times;
              </button>
            </div>

            <p className="text-xs text-slate-600">
              កត់ត្រាការកាត់ប្រាក់រំលស់ ឬសងមុនកាលកំណត់សម្រាប់បុគ្គលិក:{' '}
              <strong className="text-slate-900">
                {selectedLoan.employee.firstNameEn} {selectedLoan.employee.lastNameEn}
              </strong>
            </p>

            <form onSubmit={handleRecordPayment} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
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
                  className="w-full border border-slate-300 rounded-lg p-2.5 text-base font-black text-indigo-700 focus:ring-2 focus:ring-blue-500"
                />
                <div className="flex justify-between text-[11px] text-slate-400 mt-1">
                  <span>កាត់តាមវេន: ${selectedLoan.monthlyDeduction}</span>
                  <span>ជំពាក់នៅសល់: ${selectedLoan.remainingBalance}</span>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsPaymentModalOpen(false)}
                  className="px-3 py-1.5 border rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-50"
                >
                  បោះបង់
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold"
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
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full p-8 space-y-6 my-8 print:p-0 print:m-0 print:shadow-none">
            {/* Header toolbar for print */}
            <div className="flex justify-between items-center border-b pb-3 print:hidden">
              <span className="text-sm font-bold text-slate-700">
                មើលទម្រង់បោះពុម្ពកិច្ចសន្យាខ្ចីប្រាក់ (Print Preview)
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => window.print()}
                  className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg shadow flex items-center gap-1.5"
                >
                  <span>🖨️</span> បោះពុម្ពឥឡូវនេះ (Print Now)
                </button>
                <button
                  onClick={() => setIsPrintModalOpen(false)}
                  className="px-3 py-1.5 border border-slate-300 text-slate-600 text-xs font-bold rounded-lg hover:bg-slate-50"
                >
                  បិទ (Close)
                </button>
              </div>
            </div>

            {/* Official Slip Content */}
            <div className="space-y-6 text-slate-900 font-serif leading-relaxed px-4 py-2">
              {/* Royal Letterhead */}
              <div className="text-center space-y-1">
                <h2 className="text-base font-bold tracking-wide">ព្រះរាជាណាចក្រកម្ពុជា</h2>
                <h3 className="text-sm font-bold tracking-wider">ជាតិ សាសនា ព្រះមហាក្សត្រ</h3>
                <div className="text-xs font-serif italic text-slate-500">3 3 3</div>
              </div>

              {/* Title */}
              <div className="text-center pt-2">
                <h1 className="text-xl font-bold uppercase tracking-tight text-slate-950 font-sans">
                  កិច្ចសន្យាខ្ចីប្រាក់ និងបង្កាន់ដៃសន្យាសង
                </h1>
                <p className="text-xs font-sans text-slate-600 font-semibold">
                  EMPLOYEE LOAN AGREEMENT & PROMISSORY NOTE / 员工借款合同
                </p>
                <p className="text-xs font-mono font-bold text-indigo-700 mt-1">
                  លេខកូដកិច្ចសន្យា: {selectedLoan.loanCode}
                </p>
              </div>

              {/* Body clauses */}
              <div className="text-xs space-y-3 font-sans">
                <p>
                  ថ្ងៃនេះ ត្រូវនឹងថ្ងៃទី{' '}
                  <strong>{new Date(selectedLoan.disbursementDate).getDate()}</strong> ខែ{' '}
                  <strong>{new Date(selectedLoan.disbursementDate).getMonth() + 1}</strong> ឆ្នាំ{' '}
                  <strong>{new Date(selectedLoan.disbursementDate).getFullYear()}</strong>, ភាគីទាំងពីរបានព្រមព្រៀងគ្នាដូចខាងក្រោម៖
                </p>

                {/* Parties Table */}
                <div className="border border-slate-300 rounded-lg p-3 bg-slate-50 grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-bold text-slate-900 border-b pb-1 mb-2">
                      ភាគី (ក) ក្រុមហ៊ុន / ស្ថាប័នផ្តល់កម្ចី (Lender):
                    </h4>
                    <p className="text-slate-700">តំណាងដោយ: <strong>{selectedLoan.disbursedBy || 'Finance & HR'}</strong></p>
                    <p className="text-slate-700">ស្ថាប័ន: <strong>HRM Enterprise Organization</strong></p>
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 border-b pb-1 mb-2">
                      ភាគី (ខ) បុគ្គលិកអ្នកខ្ចីប្រាក់ (Borrower):
                    </h4>
                    <p className="text-slate-700">
                      ឈ្មោះ: <strong>{selectedLoan.employee.lastNameKh || ''} {selectedLoan.employee.firstNameKh || ''} ({selectedLoan.employee.firstNameEn} {selectedLoan.employee.lastNameEn})</strong>
                    </p>
                    <p className="text-slate-700">អត្តលេខ: <strong>{selectedLoan.employee.employeeId}</strong></p>
                    <p className="text-slate-700">
                      នាយកដ្ឋាន: <strong>{selectedLoan.employee.department}</strong> | មុខតំណែង: <strong>{selectedLoan.employee.position}</strong>
                    </p>
                    <p className="text-slate-700">ទូរស័ព្ទ: <strong>{selectedLoan.employee.phone || 'N/A'}</strong></p>
                  </div>
                </div>

                {/* Terms */}
                <div className="space-y-1.5 pt-2">
                  <h4 className="font-bold text-slate-900">ប្រការ ១: ចំនួនទឹកប្រាក់កម្ចី និងអត្រាការប្រាក់ (Loan Amount & Interest)</h4>
                  <p className="text-slate-700 pl-4">
                    ភាគី (ក) យល់ព្រមផ្តល់កម្ចីជាប្រាក់សុទ្ធចំនួន <strong>${selectedLoan.loanAmount.toFixed(2)}</strong> (ដុល្លារអាមេរិក) ជូនភាគី (ខ) ក្នុងគោលបំណង: <strong>{selectedLoan.purpose}</strong> ដោយមានអត្រាការប្រាក់ <strong>{selectedLoan.interestRate}%</strong>។
                  </p>
                </div>

                <div className="space-y-1.5">
                  <h4 className="font-bold text-slate-900">ប្រការ ២: លក្ខខណ្ឌនៃការសងរំលស់ (Repayment Terms)</h4>
                  <p className="text-slate-700 pl-4">
                    ភាគី (ខ) យល់ព្រមឱ្យក្រុមហ៊ុនកាត់កងប្រាក់រំលស់ដោយស្វ័យប្រវត្តិចេញពីប្រាក់បៀវត្សប្រចាំខែចំនួន <strong>${selectedLoan.monthlyDeduction.toFixed(2)}</strong> ក្នុងមួយខែ សម្រាប់រយៈពេល <strong>{selectedLoan.termMonths} ខែ</strong> ដោយចាប់ផ្តើមគិតចាប់ពីខែ <strong>{selectedLoan.startDeductionMonth}</strong> រហូតដល់ទូទាត់រួចរាល់។
                  </p>
                </div>

                <div className="space-y-1.5">
                  <h4 className="font-bold text-slate-900">ប្រការ ៣: ករណីបញ្ចប់កិច្ចសន្យាការងារ ឬលាលែង (Termination / Resignation)</h4>
                  <p className="text-slate-700 pl-4">
                    ក្នុងករណីដែលភាគី (ខ) លាលែងពីការងារ ឬត្រូវបញ្ឈប់ការងារមុនពេលកម្ចីនេះត្រូវបានសងរួចរាល់ សមតុល្យប្រាក់កម្ចីដែលនៅសេសសល់ទាំងអស់ នឹងត្រូវកាត់កងទូទាត់ចេញពីប្រាក់ឈ្នួលចុងក្រោយ (Final Settlement) ឬប្រាក់បំណាច់អតីតភាពការងារ។ ប្រសិនបើនៅខ្វះ ភាគី (ខ) និងអ្នកធានាត្រូវសងបង្គ្រប់ភ្លាមៗ។
                  </p>
                </div>

                {selectedLoan.guarantorName && (
                  <div className="space-y-1.5">
                    <h4 className="font-bold text-slate-900">ប្រការ ៤: អ្នកធានា (Guarantor)</h4>
                    <p className="text-slate-700 pl-4">
                      កម្ចីនេះត្រូវបានធានាដោយលោក/លោកស្រី: <strong>{selectedLoan.guarantorName}</strong> (ទូរស័ព្ទ: <strong>{selectedLoan.guarantorPhone || 'N/A'}</strong>)។
                    </p>
                  </div>
                )}
              </div>

              {/* 3 Signature Blocks */}
              <div className="grid grid-cols-3 gap-6 text-center pt-8 font-sans">
                <div>
                  <p className="text-xs font-bold text-slate-900">ហត្ថលេខាអ្នកខ្ចី (Borrower)</p>
                  <p className="text-[10px] text-slate-500">ស្នាមមេដៃស្តាំ</p>
                  <div className="h-20 flex items-end justify-center">
                    <span className="text-xs text-slate-400 italic">..................................</span>
                  </div>
                  <p className="text-xs font-semibold text-slate-800">
                    {selectedLoan.employee.lastNameKh || ''} {selectedLoan.employee.firstNameKh || ''}
                  </p>
                </div>

                <div>
                  <p className="text-xs font-bold text-slate-900">ហត្ថលេខាអ្នកធានា (Guarantor)</p>
                  <p className="text-[10px] text-slate-500">ប្រសិនបើមាន</p>
                  <div className="h-20 flex items-end justify-center">
                    <span className="text-xs text-slate-400 italic">..................................</span>
                  </div>
                  <p className="text-xs font-semibold text-slate-800">
                    {selectedLoan.guarantorName || '..................................'}
                  </p>
                </div>

                <div>
                  <p className="text-xs font-bold text-slate-900">អ្នកអនុម័ត និងបើកប្រាក់ (Approver)</p>
                  <p className="text-[10px] text-slate-500">ប្រធានផ្នែកហិរញ្ញវត្ថុ / ធនធានមនុស្ស</p>
                  <div className="h-20 flex items-end justify-center">
                    <span className="text-xs text-slate-400 italic">..................................</span>
                  </div>
                  <p className="text-xs font-semibold text-slate-800">
                    {selectedLoan.disbursedBy || 'HR & Finance Director'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
