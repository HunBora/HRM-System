'use client';

import React, { useState, useMemo } from 'react';
import Swal from 'sweetalert2';
import * as XLSX from 'xlsx';

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
  photoUrl?: string | null;
  basicSalary?: number | null;
}

interface OvertimeRequest {
  id: string;
  employeeId: string;
  employee: EmployeeSimple;
  otDate: string;
  startTime: string;
  endTime: string;
  totalHours: number;
  otType: string;
  rateMultiplier: number;
  reason: string;
  notes?: string | null;
  status: string;
  approvedBy?: string | null;
  approvedAt?: string | null;
  rejectionReason?: string | null;
  createdAt: string;
  updatedAt: string;
}

interface Props {
  initialRequests: OvertimeRequest[];
  employees: EmployeeSimple[];
  departments: string[];
  userRole?: string;
  initialYear: number;
  initialMonth: number;
}

const OT_TYPE_CONFIG: Record<string, { labelKh: string; labelEn: string; labelZh: string; multiplier: string; bg: string; text: string; icon: string }> = {
  REGULAR_OT: {
    labelKh: 'ថែមម៉ោងធម្មតា (1.5x)',
    labelEn: 'Regular OT (150%)',
    labelZh: '平日加班 (1.5倍)',
    multiplier: '1.5x',
    bg: '#e0f2fe',
    text: '#0369a1',
    icon: '☀️'
  },
  NIGHT_OT: {
    labelKh: 'ថែមម៉ោងពេលយប់ (2.0x)',
    labelEn: 'Night OT (200%)',
    labelZh: '夜间加班 (2.0倍)',
    multiplier: '2.0x',
    bg: '#f3e8ff',
    text: '#7e22ce',
    icon: '🌙'
  },
  SUNDAY_OT: {
    labelKh: 'ថែមម៉ោងថ្ងៃអាទិត្យ (2.0x)',
    labelEn: 'Sunday OT (200%)',
    labelZh: '周日休息日 (2.0倍)',
    multiplier: '2.0x',
    bg: '#fef3c7',
    text: '#b45309',
    icon: '🏖️'
  },
  HOLIDAY_OT: {
    labelKh: 'ថែមម៉ោងថ្ងៃបុណ្យ (2.0x)',
    labelEn: 'Holiday OT (200%)',
    labelZh: '法定假日 (2.0倍)',
    multiplier: '2.0x',
    bg: '#fee2e2',
    text: '#b91c1c',
    icon: '🎉'
  }
};

const STATUS_CONFIG: Record<string, { labelKh: string; labelEn: string; bg: string; text: string }> = {
  PENDING: { labelKh: 'រង់ចាំអនុម័ត', labelEn: 'Pending', bg: '#fef3c7', text: '#b45309' },
  APPROVED: { labelKh: 'បានអនុម័ត', labelEn: 'Approved', bg: '#dcfce7', text: '#15803d' },
  REJECTED: { labelKh: 'បានបដិសេធ', labelEn: 'Rejected', bg: '#fee2e2', text: '#b91c1c' },
  CANCELLED: { labelKh: 'បានលុបចោល', labelEn: 'Cancelled', bg: '#f1f5f9', text: '#475569' }
};

export default function OvertimeClient({
  initialRequests,
  employees,
  departments,
  userRole = 'ADMIN',
  initialYear,
  initialMonth
}: Props) {
  const isApprover = userRole === 'ADMIN' || userRole === 'HR_MANAGER' || userRole === 'HR' || userRole === 'DEPT_HEAD' || userRole === 'PAYROLL_ADMIN';

  const [requests, setRequests] = useState<OvertimeRequest[]>(initialRequests);
  const [loading, setLoading] = useState<boolean>(false);

  // Filters
  const [search, setSearch] = useState<string>('');
  const [otTypeFilter, setOtTypeFilter] = useState<string>('ALL');
  const [departmentFilter, setDepartmentFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Pagination for high-volume workers
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(25);

  // Quick Employee Search in Single Modal
  const [modalEmpSearch, setModalEmpSearch] = useState<string>('');

  // Modals
  const [showModal, setShowModal] = useState<boolean>(false);
  const [isBulkMode, setIsBulkMode] = useState<boolean>(false);
  const [slipRequest, setSlipRequest] = useState<OvertimeRequest | null>(null);

  // Single / Bulk Form State
  const [form, setForm] = useState({
    employeeId: employees[0]?.id || '',
    employeeIds: [] as string[],
    otDate: new Date().toISOString().split('T')[0],
    startTime: '17:30',
    endTime: '20:30',
    totalHours: 3.0,
    otType: 'REGULAR_OT',
    reason: 'បន្ទាន់ការងារផលិតកម្ម (Production Workload)',
    notes: '',
  });

  // Calculate hours automatically when start/end changes
  const calculateHours = (start: string, end: string) => {
    if (!start || !end) return 1.0;
    const [sH, sM] = start.split(':').map(Number);
    const [eH, eM] = end.split(':').map(Number);
    let diff = (eH * 60 + eM) - (sH * 60 + sM);
    if (diff < 0) diff += 24 * 60; // Next day
    const hrs = Math.round((diff / 60) * 10) / 10;
    return hrs > 0 ? hrs : 1.0;
  };

  const handleTimeChange = (field: 'startTime' | 'endTime', val: string) => {
    const nextStart = field === 'startTime' ? val : form.startTime;
    const nextEnd = field === 'endTime' ? val : form.endTime;
    const computed = calculateHours(nextStart, nextEnd);
    setForm(prev => ({
      ...prev,
      [field]: val,
      totalHours: computed
    }));
  };

  // Filtered requests
  const filteredRequests = useMemo(() => {
    return requests.filter(req => {
      const emp = req.employee;
      const fullName = `${emp.firstNameEn} ${emp.lastNameEn} ${emp.firstNameKh || ''} ${emp.lastNameKh || ''}`.toLowerCase();
      const matchesSearch = !search ||
        fullName.includes(search.toLowerCase()) ||
        emp.employeeId.toLowerCase().includes(search.toLowerCase()) ||
        req.reason.toLowerCase().includes(search.toLowerCase());

      const matchesType = otTypeFilter === 'ALL' || req.otType === otTypeFilter;
      const matchesDept = departmentFilter === 'ALL' || emp.department === departmentFilter;
      const matchesStatus = statusFilter === 'ALL' || req.status === statusFilter;

      return matchesSearch && matchesType && matchesDept && matchesStatus;
    });
  }, [requests, search, otTypeFilter, departmentFilter, statusFilter]);

  // Paginated requests
  const totalPages = pageSize === -1 ? 1 : Math.ceil(filteredRequests.length / pageSize) || 1;
  const paginatedRequests = useMemo(() => {
    if (pageSize === -1) return filteredRequests;
    const start = (currentPage - 1) * pageSize;
    return filteredRequests.slice(start, start + pageSize);
  }, [filteredRequests, currentPage, pageSize]);

  // Filtered employees for Quick Search in Modal
  const filteredModalEmployees = useMemo(() => {
    if (!modalEmpSearch.trim()) return employees.slice(0, 100);
    const q = modalEmpSearch.toLowerCase().trim();
    return employees
      .filter(emp =>
        emp.employeeId.toLowerCase().includes(q) ||
        `${emp.firstNameEn} ${emp.lastNameEn}`.toLowerCase().includes(q) ||
        `${emp.lastNameKh || ''} ${emp.firstNameKh || ''}`.toLowerCase().includes(q) ||
        emp.department.toLowerCase().includes(q) ||
        emp.position.toLowerCase().includes(q)
      )
      .slice(0, 100);
  }, [employees, modalEmpSearch]);

  // Statistics
  const stats = useMemo(() => {
    let pending = 0;
    let approved = 0;
    let totalApprovedHours = 0;

    requests.forEach(r => {
      if (r.status === 'PENDING') pending++;
      if (r.status === 'APPROVED') {
        approved++;
        totalApprovedHours += r.totalHours;
      }
    });

    return {
      total: requests.length,
      pending,
      approved,
      totalApprovedHours: Math.round(totalApprovedHours * 10) / 10
    };
  }, [requests]);

  // Open Create Modal
  const handleOpenCreate = (bulk = false) => {
    setIsBulkMode(bulk);
    setForm({
      employeeId: employees[0]?.id || '',
      employeeIds: [employees[0]?.id || ''],
      otDate: new Date().toISOString().split('T')[0],
      startTime: '17:30',
      endTime: '20:30',
      totalHours: 3.0,
      otType: 'REGULAR_OT',
      reason: 'បន្ទាន់ការងារផលិតកម្ម (Production Workload)',
      notes: '',
    });
    setShowModal(true);
  };

  // Quick Approve
  const handleApprove = async (req: OvertimeRequest) => {
    try {
      const res = await fetch('/api/overtime', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: req.id,
          status: 'APPROVED',
          approvedBy: 'HR Manager / Approver'
        })
      });

      if (res.ok) {
        const updated = await res.json();
        setRequests(prev => prev.map(r => r.id === updated.id ? updated : r));
        Swal.fire({
          icon: 'success',
          title: 'បានអនុម័ត (Approved)',
          text: `សំណើថែមម៉ោងរបស់ ${req.employee.firstNameEn} ត្រូវបានអនុម័ត`,
          timer: 1200,
          showConfirmButton: false
        });
      }
    } catch (err: any) {
      Swal.fire('Error', err.message, 'error');
    }
  };

  // Quick Reject
  const handleReject = async (req: OvertimeRequest) => {
    const { value: text } = await Swal.fire({
      title: 'បដិសេធសំណើថែមម៉ោង (Reject OT)',
      input: 'textarea',
      inputLabel: 'មូលហេតុនៃការបដិសេធ (Rejection Reason)',
      inputPlaceholder: 'បញ្ជាក់មូលហេតុ...',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      confirmButtonText: 'បដិសេធ (Reject)',
      cancelButtonText: 'បោះបង់'
    });

    if (text === undefined) return;

    try {
      const res = await fetch('/api/overtime', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: req.id,
          status: 'REJECTED',
          approvedBy: 'HR Manager / Approver',
          rejectionReason: text
        })
      });

      if (res.ok) {
        const updated = await res.json();
        setRequests(prev => prev.map(r => r.id === updated.id ? updated : r));
        Swal.fire({
          icon: 'success',
          title: 'បានបដិសេធ (Rejected)',
          timer: 1200,
          showConfirmButton: false
        });
      }
    } catch (err: any) {
      Swal.fire('Error', err.message, 'error');
    }
  };

  // Delete Request
  const handleDelete = async (req: OvertimeRequest) => {
    const result = await Swal.fire({
      title: 'តើអ្នកប្រាកដទេ? (Are you sure?)',
      text: `ចង់លុបសំណើថែមម៉ោងរបស់ ${req.employee.firstNameEn}?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'បាទ/ចាស លុប (Yes, Delete)',
      cancelButtonText: 'បោះបង់'
    });

    if (!result.isConfirmed) return;

    try {
      const res = await fetch(`/api/overtime?id=${req.id}`, { method: 'DELETE' });
      if (res.ok) {
        setRequests(prev => prev.filter(r => r.id !== req.id));
        Swal.fire({
          icon: 'success',
          title: 'បានលុប (Deleted)',
          timer: 1200,
          showConfirmButton: false
        });
      }
    } catch (err: any) {
      Swal.fire('Error', err.message, 'error');
    }
  };

  // Save Single or Bulk OT Request
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isBulkMode && form.employeeIds.length === 0) {
      Swal.fire('Warning', 'សូមជ្រើសរើសបុគ្គលិកយ៉ាងហោចណាស់ ១ នាក់', 'warning');
      return;
    }
    if (!isBulkMode && !form.employeeId) {
      Swal.fire('Warning', 'សូមជ្រើសរើសបុគ្គលិក', 'warning');
      return;
    }

    setLoading(true);
    try {
      const payload = isBulkMode
        ? {
            employeeIds: form.employeeIds,
            otDate: form.otDate,
            startTime: form.startTime,
            endTime: form.endTime,
            totalHours: form.totalHours,
            otType: form.otType,
            reason: form.reason,
            notes: form.notes,
            status: 'PENDING'
          }
        : {
            employeeId: form.employeeId,
            otDate: form.otDate,
            startTime: form.startTime,
            endTime: form.endTime,
            totalHours: form.totalHours,
            otType: form.otType,
            reason: form.reason,
            notes: form.notes,
            status: 'PENDING'
          };

      const res = await fetch('/api/overtime', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to submit request');
      }

      setShowModal(false);
      // Re-fetch all requests
      const getRes = await fetch('/api/overtime');
      if (getRes.ok) {
        const fresh = await getRes.json();
        setRequests(fresh);
      }

      Swal.fire({
        icon: 'success',
        title: 'ជោគជ័យ (Submitted)',
        text: isBulkMode ? `បានបង្កើតសំណើថែមម៉ោងសម្រាប់ ${form.employeeIds.length} នាក់` : 'បានបញ្ជូនសំណើថែមម៉ោងដោយជោគជ័យ',
        timer: 1500,
        showConfirmButton: false
      });
    } catch (err: any) {
      Swal.fire('Error', err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  // Auto-fit helper for Excel exports
  const autoFitColumns = (data: any[]) => {
    if (!data || data.length === 0) return [];
    const keys = Object.keys(data[0]);
    return keys.map(key => {
      let maxLen = key.length;
      data.forEach(row => {
        const val = row[key] !== undefined && row[key] !== null ? String(row[key]) : '';
        if (val.length > maxLen) maxLen = val.length;
      });
      return { wch: Math.max(maxLen + 4, 15) };
    });
  };

  // Export to Excel with 3-language headers
  const exportToExcel = () => {
    try {
      const exportData = filteredRequests.map((req, index) => {
        const emp = req.employee;
        const typeConf = OT_TYPE_CONFIG[req.otType] || { labelKh: req.otType, labelEn: req.otType, labelZh: req.otType, multiplier: '1.5x' };
        const statusConf = STATUS_CONFIG[req.status] || { labelKh: req.status, labelEn: req.status };

        return {
          'ល.រ\nNo.\n序号': index + 1,
          'អត្តលេខ\nEmp ID\n工号': emp.employeeId,
          'គោត្តនាម-នាម\nFull Name\n姓名': `${emp.lastNameKh || ''} ${emp.firstNameKh || ''} (${emp.firstNameEn} ${emp.lastNameEn})`.trim(),
          'ផ្នែក\nDepartment\n部门': emp.department,
          'តួនាទី\nPosition\n职位': emp.position,
          'កាលបរិច្ឆេទថែមម៉ោង\nOT Date\n加班日期': new Date(req.otDate).toISOString().split('T')[0],
          'ម៉ោងចូល-ចេញ\nTime Range\n时间段': `${req.startTime} - ${req.endTime}`,
          'ចំនួនម៉ោង\nTotal Hours\n总工时': `${req.totalHours} ម៉ោង`,
          'ប្រភេទថែមម៉ោង\nOT Type\n加班类型': `${typeConf.labelKh} (${typeConf.multiplier})`,
          'មូលហេតុ\nReason\n事由': req.reason,
          'ស្ថានភាព\nStatus\n状态': `${statusConf.labelKh} (${statusConf.labelEn})`,
          'អ្នកអនុម័ត\nApproved By\n审批人': req.approvedBy || '-',
        };
      });

      const ws = XLSX.utils.json_to_sheet(exportData);
      ws['!cols'] = autoFitColumns(exportData);

      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Overtime_Requests');
      XLSX.writeFile(wb, `Overtime_Requests_${new Date().toISOString().split('T')[0]}.xlsx`);

      Swal.fire({
        icon: 'success',
        title: 'ទាញយកជោគជ័យ (Exported)',
        text: 'ឯកសារ Excel ត្រូវបានទាញយករួចរាល់!',
        timer: 1500,
        showConfirmButton: false
      });
    } catch (err: any) {
      Swal.fire({
        icon: 'error',
        title: 'បរាជ័យ (Export Failed)',
        text: err.message
      });
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Page Header */}
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: '16px',
        background: '#ffffff',
        padding: '24px',
        borderRadius: '16px',
        boxShadow: '0 4px 20px rgba(0,0,0,0.04)',
        border: '1px solid #f1f5f9'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '30px' }}>⏰</span>
          <div>
            <h1 style={{ margin: 0, fontSize: '1.6rem', fontWeight: 800, color: '#0f172a' }}>
              ការស្នើសុំ និងអនុម័តថែមម៉ោង (Overtime)
            </h1>
            <p style={{ margin: '4px 0 0 0', color: '#64748b', fontSize: '0.88rem' }}>
              Overtime Requisition & Workflow Approval • 员工加班申请与多级审批流程
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          {/* Single Request */}
          <button
            onClick={() => handleOpenCreate(false)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
              color: '#ffffff',
              border: 'none',
              borderRadius: '10px',
              padding: '10px 16px',
              fontWeight: 700,
              fontSize: '0.9rem',
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(2, 132, 199, 0.25)'
            }}
          >
            <span>➕</span>
            <div style={{ textAlign: 'left', lineHeight: 1.2 }}>
              <div>ស្នើសុំថែមម៉ោង</div>
              <div style={{ fontSize: '0.7rem', opacity: 0.85 }}>Single OT • 个人申请</div>
            </div>
          </button>

          {/* Bulk Request for Teams */}
          {isApprover && (
            <button
              onClick={() => handleOpenCreate(true)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
                color: '#ffffff',
                border: 'none',
                borderRadius: '10px',
                padding: '10px 16px',
                fontWeight: 700,
                fontSize: '0.9rem',
                cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(99, 102, 241, 0.25)'
              }}
            >
              <span>⚡</span>
              <div style={{ textAlign: 'left', lineHeight: 1.2 }}>
                <div>ស្នើជាក្រុម/ផ្នែក</div>
                <div style={{ fontSize: '0.7rem', opacity: 0.85 }}>Bulk OT • 批量申请</div>
              </div>
            </button>
          )}

          {/* Export Excel */}
          <button
            onClick={exportToExcel}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              background: 'linear-gradient(135deg, #10b981 0%, #047857 100%)',
              color: '#ffffff',
              border: 'none',
              borderRadius: '10px',
              padding: '10px 16px',
              fontWeight: 700,
              fontSize: '0.9rem',
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(16, 185, 129, 0.25)'
            }}
          >
            <span>📥</span>
            <div style={{ textAlign: 'left', lineHeight: 1.2 }}>
              <div>ទាញយក Excel</div>
              <div style={{ fontSize: '0.7rem', opacity: 0.85 }}>Export Excel • 导出表格</div>
            </div>
          </button>
        </div>
      </div>

      {/* 3-Language Metrics Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '16px'
      }}>
        {/* Card 1: Total Requests */}
        <div style={{
          background: '#ffffff',
          borderRadius: '16px',
          padding: '20px',
          border: '1px solid #f1f5f9',
          boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
          display: 'flex',
          alignItems: 'center',
          gap: '16px'
        }}>
          <div style={{
            width: '52px',
            height: '52px',
            borderRadius: '12px',
            background: '#e0f2fe',
            color: '#0284c7',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '24px'
          }}>
            📋
          </div>
          <div>
            <div style={{ fontWeight: 800, fontSize: '0.95rem', color: '#0f172a' }}>សំណើថែមម៉ោងសរុប</div>
            <div style={{ fontSize: '0.72rem', color: '#64748b' }}>Total OT Requests • 加班申请总数</div>
            <div style={{ fontSize: '1.7rem', fontWeight: 900, color: '#0284c7', marginTop: '4px' }}>
              {stats.total}
            </div>
          </div>
        </div>

        {/* Card 2: Pending Approval */}
        <div style={{
          background: '#ffffff',
          borderRadius: '16px',
          padding: '20px',
          border: '1px solid #f1f5f9',
          boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
          display: 'flex',
          alignItems: 'center',
          gap: '16px'
        }}>
          <div style={{
            width: '52px',
            height: '52px',
            borderRadius: '12px',
            background: '#fef3c7',
            color: '#b45309',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '24px'
          }}>
            ⏳
          </div>
          <div>
            <div style={{ fontWeight: 800, fontSize: '0.95rem', color: '#0f172a' }}>រង់ចាំការអនុម័ត</div>
            <div style={{ fontSize: '0.72rem', color: '#64748b' }}>Pending Approval • 待审批</div>
            <div style={{ fontSize: '1.7rem', fontWeight: 900, color: '#b45309', marginTop: '4px' }}>
              {stats.pending}
            </div>
          </div>
        </div>

        {/* Card 3: Approved */}
        <div style={{
          background: '#ffffff',
          borderRadius: '16px',
          padding: '20px',
          border: '1px solid #f1f5f9',
          boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
          display: 'flex',
          alignItems: 'center',
          gap: '16px'
        }}>
          <div style={{
            width: '52px',
            height: '52px',
            borderRadius: '12px',
            background: '#dcfce7',
            color: '#15803d',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '24px'
          }}>
            ✅
          </div>
          <div>
            <div style={{ fontWeight: 800, fontSize: '0.95rem', color: '#0f172a' }}>បានអនុម័ត</div>
            <div style={{ fontSize: '0.72rem', color: '#64748b' }}>Approved Requests • 已批准</div>
            <div style={{ fontSize: '1.7rem', fontWeight: 900, color: '#15803d', marginTop: '4px' }}>
              {stats.approved}
            </div>
          </div>
        </div>

        {/* Card 4: Total Approved Hours */}
        <div style={{
          background: '#ffffff',
          borderRadius: '16px',
          padding: '20px',
          border: '1px solid #f1f5f9',
          boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
          display: 'flex',
          alignItems: 'center',
          gap: '16px'
        }}>
          <div style={{
            width: '52px',
            height: '52px',
            borderRadius: '12px',
            background: '#f3e8ff',
            color: '#7e22ce',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '24px'
          }}>
            ⏰
          </div>
          <div>
            <div style={{ fontWeight: 800, fontSize: '0.95rem', color: '#0f172a' }}>ម៉ោង OT សរុប</div>
            <div style={{ fontSize: '0.72rem', color: '#64748b' }}>Approved OT Hours • 批准工时</div>
            <div style={{ fontSize: '1.7rem', fontWeight: 900, color: '#7e22ce', marginTop: '4px' }}>
              {stats.totalApprovedHours} <span style={{ fontSize: '1rem', fontWeight: 600 }}>ម៉ោង</span>
            </div>
          </div>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: '12px',
        alignItems: 'center',
        background: '#ffffff',
        padding: '14px 18px',
        borderRadius: '14px',
        border: '1px solid #f1f5f9'
      }}>
        {/* Search */}
        <div style={{ flex: '1 1 220px', position: 'relative' }}>
          <input
            type="text"
            placeholder="ស្វែងរកតាមឈ្មោះ, អត្តលេខ ឬមូលហេតុ..."
            value={search}
            onChange={e => { setSearch(e.target.value); setCurrentPage(1); }}
            style={{
              width: '100%',
              padding: '9px 12px 9px 36px',
              borderRadius: '10px',
              border: '1px solid #cbd5e1',
              fontSize: '0.88rem',
              outline: 'none',
              boxSizing: 'border-box'
            }}
          />
          <span style={{ position: 'absolute', left: '12px', top: '9px', color: '#94a3b8' }}>🔍</span>
        </div>

        {/* OT Type Filter */}
        <div style={{ minWidth: '170px' }}>
          <select
            value={otTypeFilter}
            onChange={e => { setOtTypeFilter(e.target.value); setCurrentPage(1); }}
            style={{
              width: '100%',
              padding: '9px 12px',
              borderRadius: '10px',
              border: '1px solid #cbd5e1',
              fontSize: '0.85rem',
              background: '#ffffff',
              outline: 'none',
              fontWeight: 600
            }}
          >
            <option value="ALL">⏰ គ្រប់ប្រភេទថែមម៉ោង (All OT)</option>
            {Object.entries(OT_TYPE_CONFIG).map(([k, v]) => (
              <option key={k} value={k}>{v.icon} {v.labelKh}</option>
            ))}
          </select>
        </div>

        {/* Department Filter */}
        <div style={{ minWidth: '170px' }}>
          <select
            value={departmentFilter}
            onChange={e => { setDepartmentFilter(e.target.value); setCurrentPage(1); }}
            style={{
              width: '100%',
              padding: '9px 12px',
              borderRadius: '10px',
              border: '1px solid #cbd5e1',
              fontSize: '0.85rem',
              background: '#ffffff',
              outline: 'none',
              fontWeight: 600
            }}
          >
            <option value="ALL">🏢 គ្រប់ផ្នែកទាំងអស់ (All Depts)</option>
            {departments.map(dept => (
              <option key={dept} value={dept}>{dept}</option>
            ))}
          </select>
        </div>

        {/* Status Filter */}
        <div style={{ minWidth: '160px' }}>
          <select
            value={statusFilter}
            onChange={e => { setStatusFilter(e.target.value); setCurrentPage(1); }}
            style={{
              width: '100%',
              padding: '9px 12px',
              borderRadius: '10px',
              border: '1px solid #cbd5e1',
              fontSize: '0.85rem',
              background: '#ffffff',
              outline: 'none',
              fontWeight: 600
            }}
          >
            <option value="ALL">📊 គ្រប់ស្ថានភាព (All Status)</option>
            {Object.entries(STATUS_CONFIG).map(([k, v]) => (
              <option key={k} value={k}>{v.labelKh}</option>
            ))}
          </select>
        </div>

        {/* Page Size Selector */}
        <div style={{ minWidth: '130px' }}>
          <select
            value={pageSize}
            onChange={e => { setPageSize(Number(e.target.value)); setCurrentPage(1); }}
            style={{
              width: '100%',
              padding: '9px 12px',
              borderRadius: '10px',
              border: '1px solid #cbd5e1',
              fontSize: '0.85rem',
              background: '#ffffff',
              outline: 'none',
              fontWeight: 600,
              color: '#0284c7'
            }}
            title="ចំនួនសំណើក្នុងមួយទំព័រ (Rows per page)"
          >
            <option value={10}>📄 10 សំណើ/ទំព័រ</option>
            <option value={25}>📄 25 សំណើ/ទំព័រ</option>
            <option value={50}>📄 50 សំណើ/ទំព័រ</option>
            <option value={100}>📄 100 សំណើ/ទំព័រ</option>
            <option value={-1}>📄 ទាំងអស់ (All)</option>
          </select>
        </div>

        {/* Reset Filter Button */}
        {(search || otTypeFilter !== 'ALL' || departmentFilter !== 'ALL' || statusFilter !== 'ALL') && (
          <button
            onClick={() => {
              setSearch('');
              setOtTypeFilter('ALL');
              setDepartmentFilter('ALL');
              setStatusFilter('ALL');
              setCurrentPage(1);
            }}
            style={{
              padding: '9px 14px',
              borderRadius: '10px',
              border: '1px solid #fecaca',
              background: '#fef2f2',
              color: '#dc2626',
              fontWeight: 700,
              fontSize: '0.85rem',
              cursor: 'pointer'
            }}
            title="កំណត់ឡើងវិញ (Reset Filter)"
          >
            🔄 សម្អាត Filter
          </button>
        )}
      </div>

      {/* Table (3-Languages on All TH) */}
      <div style={{
        background: '#ffffff',
        borderRadius: '16px',
        border: '1px solid #e2e8f0',
        boxShadow: '0 4px 20px rgba(0,0,0,0.03)',
        overflow: 'hidden'
      }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                {/* 1: No */}
                <th style={{ padding: '9px 12px', width: '50px' }}>
                  <div style={{ fontWeight: 800, color: '#0f172a', fontSize: '0.85rem' }}>ល.រ</div>
                  <div style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 600 }}>No.</div>
                  <div style={{ fontSize: '0.65rem', color: '#94a3b8' }}>序号</div>
                </th>

                {/* 2: Employee */}
                <th style={{ padding: '9px 12px', minWidth: '200px' }}>
                  <div style={{ fontWeight: 800, color: '#0f172a', fontSize: '0.85rem' }}>ព័ត៌មានបុគ្គលិក</div>
                  <div style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 600 }}>Employee Name & ID</div>
                  <div style={{ fontSize: '0.65rem', color: '#94a3b8' }}>员工信息</div>
                </th>

                {/* 3: OT Date & Time */}
                <th style={{ padding: '9px 12px', minWidth: '150px' }}>
                  <div style={{ fontWeight: 800, color: '#0f172a', fontSize: '0.85rem' }}>កាលបរិច្ឆេទ និងម៉ោង</div>
                  <div style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 600 }}>OT Date & Time Range</div>
                  <div style={{ fontSize: '0.65rem', color: '#94a3b8' }}>加班日期与时段</div>
                </th>

                {/* 4: Total Hours & Rate */}
                <th style={{ padding: '9px 12px', minWidth: '170px' }}>
                  <div style={{ fontWeight: 800, color: '#0f172a', fontSize: '0.85rem' }}>ប្រភេទ និងអត្រាថែមម៉ោង</div>
                  <div style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 600 }}>OT Type & Multiplier</div>
                  <div style={{ fontSize: '0.65rem', color: '#94a3b8' }}>加班类型与倍率</div>
                </th>

                {/* 5: Reason */}
                <th style={{ padding: '9px 12px', minWidth: '200px' }}>
                  <div style={{ fontWeight: 800, color: '#0f172a', fontSize: '0.85rem' }}>មូលហេតុ និងភារកិច្ច</div>
                  <div style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 600 }}>Reason / Task Detail</div>
                  <div style={{ fontSize: '0.65rem', color: '#94a3b8' }}>加班事由与任务</div>
                </th>

                {/* 6: Status */}
                <th style={{ padding: '9px 12px', minWidth: '120px' }}>
                  <div style={{ fontWeight: 800, color: '#0f172a', fontSize: '0.85rem' }}>ស្ថានភាព</div>
                  <div style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 600 }}>Status</div>
                  <div style={{ fontSize: '0.65rem', color: '#94a3b8' }}>状态</div>
                </th>

                {/* 7: Actions */}
                <th style={{ padding: '9px 12px', minWidth: '160px', textAlign: 'right' }}>
                  <div style={{ fontWeight: 800, color: '#0f172a', fontSize: '0.85rem' }}>សកម្មភាព</div>
                  <div style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 600 }}>Actions</div>
                  <div style={{ fontSize: '0.65rem', color: '#94a3b8' }}>操作</div>
                </th>
              </tr>
            </thead>

            <tbody>
              {paginatedRequests.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>
                    <div style={{ fontSize: '32px', marginBottom: '8px' }}>⏰</div>
                    <div style={{ fontWeight: 700, fontSize: '1rem' }}>មិនមានសំណើថែមម៉ោងត្រូវបង្ហាញទេ</div>
                    <div style={{ fontSize: '0.82rem' }}>No overtime requests found</div>
                  </td>
                </tr>
              ) : (
                paginatedRequests.map((req, index) => {
                  const emp = req.employee;
                  const typeConf = OT_TYPE_CONFIG[req.otType] || { labelKh: req.otType, labelEn: req.otType, labelZh: req.otType, multiplier: '1.5x', bg: '#f1f5f9', text: '#475569', icon: '⏰' };
                  const statusConf = STATUS_CONFIG[req.status] || { labelKh: req.status, labelEn: req.status, bg: '#f1f5f9', text: '#475569' };
                  const rowNumber = (currentPage - 1) * (pageSize === -1 ? 0 : pageSize) + index + 1;

                  return (
                    <tr
                      key={req.id}
                      style={{
                        borderBottom: '1px solid #f1f5f9',
                        background: index % 2 === 0 ? '#ffffff' : '#fcfcfd',
                        transition: 'background 0.15s ease'
                      }}
                    >
                      {/* Index */}
                      <td style={{ padding: '8px 12px', fontWeight: 700, color: '#64748b', fontSize: '0.85rem' }}>
                        {rowNumber}
                      </td>

                      {/* Employee Info */}
                      <td style={{ padding: '8px 12px' }}>
                        <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.88rem' }}>
                          {emp.lastNameKh || ''} {emp.firstNameKh || ''} {(!emp.lastNameKh && !emp.firstNameKh) && `${emp.firstNameEn} ${emp.lastNameEn}`}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: '#4f46e5', fontWeight: 600 }}>
                          {emp.employeeId} • {emp.position}
                        </div>
                        <div style={{ fontSize: '0.7rem', color: '#64748b' }}>
                          {emp.department} {emp.line ? `(${emp.line})` : ''}
                        </div>
                      </td>

                      {/* Date & Time */}
                      <td style={{ padding: '8px 12px', fontSize: '0.85rem' }}>
                        <div style={{ fontWeight: 700, color: '#0f172a' }}>
                          {new Date(req.otDate).toISOString().split('T')[0]}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: '#2563eb', fontWeight: 600, marginTop: '2px' }}>
                          {req.startTime} - {req.endTime}
                        </div>
                      </td>

                      {/* Total Hours & Rate Badge */}
                      <td style={{ padding: '8px 12px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{ fontWeight: 900, fontSize: '0.98rem', color: '#0f172a' }}>
                            {req.totalHours} <span style={{ fontSize: '0.72rem', fontWeight: 600 }}>ម៉ោង</span>
                          </span>
                          <span style={{
                            padding: '2px 7px',
                            borderRadius: '6px',
                            background: typeConf.bg,
                            color: typeConf.text,
                            fontSize: '0.72rem',
                            fontWeight: 800
                          }}>
                            {typeConf.icon} {typeConf.multiplier}
                          </span>
                        </div>
                        <div style={{ fontSize: '0.7rem', color: '#64748b', marginTop: '2px' }}>
                          {typeConf.labelKh}
                        </div>
                      </td>

                      {/* Reason */}
                      <td style={{ padding: '8px 12px' }}>
                        <div style={{ fontWeight: 600, color: '#334155', fontSize: '0.85rem' }}>
                          {req.reason}
                        </div>
                        {req.notes && (
                          <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '2px' }}>
                            {req.notes}
                          </div>
                        )}
                        {req.rejectionReason && (
                          <div style={{ fontSize: '0.72rem', color: '#dc2626', marginTop: '2px' }}>
                            មូលហេតុបដិសេធ: {req.rejectionReason}
                          </div>
                        )}
                      </td>

                      {/* Status */}
                      <td style={{ padding: '8px 12px' }}>
                        <span style={{
                          display: 'inline-block',
                          padding: '3px 8px',
                          borderRadius: '6px',
                          background: statusConf.bg,
                          color: statusConf.text,
                          fontWeight: 700,
                          fontSize: '0.75rem'
                        }}>
                          {statusConf.labelKh}
                        </span>
                        {req.approvedBy && (
                          <div style={{ fontSize: '0.68rem', color: '#64748b', marginTop: '2px' }}>
                            ដោយ: {req.approvedBy}
                          </div>
                        )}
                      </td>

                      {/* Actions */}
                      <td style={{ padding: '8px 12px', textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: '5px', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                          {/* Print Slip */}
                          <button
                            onClick={() => setSlipRequest(req)}
                            title="មើល និងបោះពុម្ពទម្រង់ស្នើសុំថែមម៉ោង (OT Slip)"
                            style={{
                              background: '#eff6ff',
                              border: '1px solid #bfdbfe',
                              color: '#2563eb',
                              padding: '5px 8px',
                              borderRadius: '6px',
                              cursor: 'pointer',
                              fontWeight: 700,
                              fontSize: '0.78rem'
                            }}
                          >
                            📄 សន្លឹក
                          </button>

                          {/* Approval Buttons for HR / Manager */}
                          {isApprover && req.status === 'PENDING' && (
                            <>
                              <button
                                onClick={() => handleApprove(req)}
                                title="អនុម័ត (Approve)"
                                style={{
                                  background: '#dcfce7',
                                  border: '1px solid #86efac',
                                  color: '#15803d',
                                  padding: '5px 8px',
                                  borderRadius: '6px',
                                  cursor: 'pointer',
                                  fontWeight: 700,
                                  fontSize: '0.78rem'
                                }}
                              >
                                ✓
                              </button>
                              <button
                                onClick={() => handleReject(req)}
                                title="បដិសេធ (Reject)"
                                style={{
                                  background: '#fee2e2',
                                  border: '1px solid #fca5a5',
                                  color: '#b91c1c',
                                  padding: '5px 8px',
                                  borderRadius: '6px',
                                  cursor: 'pointer',
                                  fontWeight: 700,
                                  fontSize: '0.78rem'
                                }}
                              >
                                ✕
                              </button>
                            </>
                          )}

                          {isApprover && (
                            <button
                              onClick={() => handleDelete(req)}
                              title="លុប (Delete)"
                              style={{
                                background: '#f8fafc',
                                border: '1px solid #cbd5e1',
                                color: '#64748b',
                                padding: '5px 8px',
                                borderRadius: '6px',
                                cursor: 'pointer',
                                fontSize: '0.78rem'
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

      {/* Pagination Bar */}
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '12px 18px',
        background: '#ffffff',
        borderRadius: '12px',
        border: '1px solid #e2e8f0',
        gap: '12px'
      }}>
        {/* Count Info */}
        <div style={{ fontSize: '0.85rem', color: '#475569', fontWeight: 600 }}>
          បង្ហាញ {filteredRequests.length === 0 ? 0 : (currentPage - 1) * (pageSize === -1 ? filteredRequests.length : pageSize) + 1} ដល់{' '}
          {pageSize === -1 ? filteredRequests.length : Math.min(currentPage * pageSize, filteredRequests.length)} នៃ{' '}
          <strong style={{ color: '#0f172a' }}>{filteredRequests.length}</strong> សំណើ
          <span style={{ fontSize: '0.75rem', color: '#94a3b8', marginLeft: '6px' }}>
            (Showing {filteredRequests.length === 0 ? 0 : (currentPage - 1) * (pageSize === -1 ? filteredRequests.length : pageSize) + 1}-
            {pageSize === -1 ? filteredRequests.length : Math.min(currentPage * pageSize, filteredRequests.length)} of {filteredRequests.length} requests)
          </span>
        </div>

        {/* Page Nav Controls */}
        {pageSize !== -1 && totalPages > 1 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <button
              onClick={() => setCurrentPage(1)}
              disabled={currentPage === 1}
              style={{
                padding: '5px 9px',
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
                background: currentPage === 1 ? '#f8fafc' : '#ffffff',
                color: currentPage === 1 ? '#94a3b8' : '#1e293b',
                cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                fontWeight: 700,
                fontSize: '0.82rem'
              }}
              title="ទំព័រដំបូង (First Page)"
            >
              ⏮️
            </button>
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              style={{
                padding: '5px 11px',
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
                background: currentPage === 1 ? '#f8fafc' : '#ffffff',
                color: currentPage === 1 ? '#94a3b8' : '#1e293b',
                cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                fontWeight: 700,
                fontSize: '0.82rem'
              }}
              title="ទំព័រមុន (Previous Page)"
            >
              ◀ មុន
            </button>

            {/* Page number buttons */}
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter(p => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 2)
              .map((p, idx, arr) => {
                const prevP = arr[idx - 1];
                const showEllipsis = prevP && p - prevP > 1;
                return (
                  <React.Fragment key={p}>
                    {showEllipsis && <span style={{ padding: '0 4px', color: '#94a3b8' }}>...</span>}
                    <button
                      onClick={() => setCurrentPage(p)}
                      style={{
                        padding: '5px 10px',
                        borderRadius: '8px',
                        border: p === currentPage ? '1px solid #0284c7' : '1px solid #cbd5e1',
                        background: p === currentPage ? '#0284c7' : '#ffffff',
                        color: p === currentPage ? '#ffffff' : '#1e293b',
                        cursor: 'pointer',
                        fontWeight: 700,
                        fontSize: '0.82rem'
                      }}
                    >
                      {p}
                    </button>
                  </React.Fragment>
                );
              })}

            <button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              style={{
                padding: '5px 11px',
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
                background: currentPage === totalPages ? '#f8fafc' : '#ffffff',
                color: currentPage === totalPages ? '#94a3b8' : '#1e293b',
                cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                fontWeight: 700,
                fontSize: '0.82rem'
              }}
              title="ទំព័របន្ទាប់ (Next Page)"
            >
              បន្ទាប់ ▶
            </button>
            <button
              onClick={() => setCurrentPage(totalPages)}
              disabled={currentPage === totalPages}
              style={{
                padding: '5px 9px',
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
                background: currentPage === totalPages ? '#f8fafc' : '#ffffff',
                color: currentPage === totalPages ? '#94a3b8' : '#1e293b',
                cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                fontWeight: 700,
                fontSize: '0.82rem'
              }}
              title="ទំព័រចុងក្រោយ (Last Page)"
            >
              ⏭️
            </button>
          </div>
        )}
      </div>

      {/* Single / Bulk OT Requisition Modal */}
      {showModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(15, 23, 42, 0.6)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 100,
          padding: '16px'
        }}>
          <div style={{
            background: '#ffffff',
            borderRadius: '20px',
            width: '100%',
            maxWidth: '640px',
            boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
            overflow: 'hidden',
            maxHeight: '92vh',
            display: 'flex',
            flexDirection: 'column'
          }}>
            {/* Modal Header */}
            <div style={{
              background: isBulkMode
                ? 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)'
                : 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
              color: '#ffffff',
              padding: '20px 24px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800 }}>
                  {isBulkMode ? '⚡ ស្នើសុំថែមម៉ោងជាក្រុម (Bulk Overtime)' : '⏰ ស្នើសុំធ្វើការថែមម៉ោង (Overtime Requisition)'}
                </h3>
                <div style={{ fontSize: '0.8rem', opacity: 0.9, marginTop: '4px' }}>
                  {isBulkMode ? 'ស្នើសុំសម្រាប់បុគ្គលិកច្រើននាក់ក្នុងពេលតែមួយ • 批量加班申请' : 'បំពេញព័ត៌មានលម្អិតនៃម៉ោងបន្ថែម • 个人加班单'}
                </div>
              </div>
              <button
                onClick={() => setShowModal(false)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#ffffff',
                  fontSize: '20px',
                  cursor: 'pointer'
                }}
              >
                ✕
              </button>
            </div>

            {/* Modal Form Scrollable */}
            <form onSubmit={handleSave} style={{ padding: '24px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Employee Selection */}
              {isBulkMode ? (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <label style={{ fontWeight: 700, fontSize: '0.88rem', color: '#1e293b' }}>
                      ជ្រើសរើសបុគ្គលិកជាក្រុម (Select Team Members) *
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        if (form.employeeIds.length === employees.length) {
                          setForm({ ...form, employeeIds: [] });
                        } else {
                          setForm({ ...form, employeeIds: employees.map(e => e.id) });
                        }
                      }}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#4f46e5',
                        fontWeight: 700,
                        fontSize: '0.8rem',
                        cursor: 'pointer'
                      }}
                    >
                      {form.employeeIds.length === employees.length ? 'ដោះចេញទាំងអស់ (Deselect All)' : 'ជ្រើសរើសទាំងអស់ (Select All)'}
                    </button>
                  </div>
                  <div style={{
                    maxHeight: '160px',
                    overflowY: 'auto',
                    border: '1px solid #cbd5e1',
                    borderRadius: '8px',
                    padding: '8px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '4px'
                  }}>
                    {employees.map(emp => (
                      <label key={emp.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', cursor: 'pointer', padding: '4px' }}>
                        <input
                          type="checkbox"
                          checked={form.employeeIds.includes(emp.id)}
                          onChange={e => {
                            if (e.target.checked) {
                              setForm({ ...form, employeeIds: [...form.employeeIds, emp.id] });
                            } else {
                              setForm({ ...form, employeeIds: form.employeeIds.filter(id => id !== emp.id) });
                            }
                          }}
                          style={{ width: '16px', height: '16px' }}
                        />
                        <span>{emp.employeeId} - {emp.firstNameEn} {emp.lastNameEn} ({emp.department})</span>
                      </label>
                    ))}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '4px' }}>
                    បានជ្រើសរើស: <strong>{form.employeeIds.length}</strong> នាក់
                  </div>
                </div>
              ) : (
                <div>
                  <label style={{ display: 'block', marginBottom: '6px', fontWeight: 700, fontSize: '0.88rem', color: '#1e293b' }}>
                    បុគ្គលិកថែមម៉ោង (Employee) *
                  </label>
                  <input
                    type="text"
                    placeholder="🔍 ស្វែងរកអត្តលេខ ឬឈ្មោះបុគ្គលិក (Search ID or name)..."
                    value={modalEmpSearch}
                    onChange={e => setModalEmpSearch(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: '8px',
                      border: '1px solid #cbd5e1',
                      fontSize: '0.85rem',
                      marginBottom: '6px',
                      boxSizing: 'border-box'
                    }}
                  />
                  <select
                    value={form.employeeId}
                    onChange={e => setForm({ ...form, employeeId: e.target.value })}
                    required
                    style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.9rem' }}
                  >
                    {filteredModalEmployees.map(emp => (
                      <option key={emp.id} value={emp.id}>
                        {emp.employeeId} - {emp.lastNameKh || ''} {emp.firstNameKh || ''} ({emp.firstNameEn} {emp.lastNameEn}) - {emp.department} ({emp.position})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* OT Date & OT Type */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '6px', fontWeight: 700, fontSize: '0.88rem', color: '#1e293b' }}>
                    កាលបរិច្ឆេទថែមម៉ោង (OT Date) *
                  </label>
                  <input
                    type="date"
                    value={form.otDate}
                    onChange={e => setForm({ ...form, otDate: e.target.value })}
                    required
                    style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', boxSizing: 'border-box' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '6px', fontWeight: 700, fontSize: '0.88rem', color: '#1e293b' }}>
                    ប្រភេទថែមម៉ោង (OT Type) *
                  </label>
                  <select
                    value={form.otType}
                    onChange={e => setForm({ ...form, otType: e.target.value })}
                    style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.88rem' }}
                  >
                    {Object.entries(OT_TYPE_CONFIG).map(([k, v]) => (
                      <option key={k} value={k}>
                        {v.icon} {v.labelKh}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Time Range & Auto Hours */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '6px', fontWeight: 700, fontSize: '0.85rem', color: '#1e293b' }}>
                    ម៉ោងចាប់ផ្តើម (Start) *
                  </label>
                  <input
                    type="time"
                    value={form.startTime}
                    onChange={e => handleTimeChange('startTime', e.target.value)}
                    required
                    style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', boxSizing: 'border-box' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '6px', fontWeight: 700, fontSize: '0.85rem', color: '#1e293b' }}>
                    ម៉ោងបញ្ចប់ (End) *
                  </label>
                  <input
                    type="time"
                    value={form.endTime}
                    onChange={e => handleTimeChange('endTime', e.target.value)}
                    required
                    style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', boxSizing: 'border-box' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '6px', fontWeight: 700, fontSize: '0.85rem', color: '#1e293b' }}>
                    ចំនួនម៉ោងសរុប (Hours)
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    min="0.5"
                    max="24"
                    value={form.totalHours}
                    onChange={e => setForm({ ...form, totalHours: Number(e.target.value) })}
                    required
                    style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', boxSizing: 'border-box', fontWeight: 800 }}
                  />
                </div>
              </div>

              {/* Reason / Tasks */}
              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontWeight: 700, fontSize: '0.88rem', color: '#1e293b' }}>
                  មូលហេតុ ឬភារកិច្ចត្រូវបំពេញ (Reason / Task Justification) *
                </label>
                <input
                  type="text"
                  placeholder="ឧ. បញ្ចប់គម្រោងបន្ទាន់, រៀបចំទំនិញដឹកជញ្ជូន..."
                  value={form.reason}
                  onChange={e => setForm({ ...form, reason: e.target.value })}
                  required
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', boxSizing: 'border-box' }}
                />
              </div>

              {/* Notes */}
              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontWeight: 700, fontSize: '0.88rem', color: '#1e293b' }}>
                  សម្គាល់បន្ថែម (Additional Notes)
                </label>
                <textarea
                  rows={2}
                  placeholder="ព័ត៌មានលម្អិតបន្ថែម..."
                  value={form.notes}
                  onChange={e => setForm({ ...form, notes: e.target.value })}
                  style={{ width: '100%', padding: '8px', borderRadius: '8px', border: '1px solid #cbd5e1', boxSizing: 'border-box' }}
                />
              </div>

              {/* Footer Buttons */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '12px' }}>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  style={{
                    padding: '10px 18px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    background: '#ffffff',
                    color: '#475569',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  បោះបង់ (Cancel)
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    padding: '10px 24px',
                    borderRadius: '8px',
                    border: 'none',
                    background: isBulkMode
                      ? 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)'
                      : 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
                    color: '#ffffff',
                    fontWeight: 700,
                    cursor: 'pointer',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
                  }}
                >
                  {loading ? 'កំពុងបញ្ជូន...' : '🚀 បញ្ជូនសំណើ (Submit)'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Official Overtime Slip Modal */}
      {slipRequest && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(15, 23, 42, 0.75)',
          backdropFilter: 'blur(6px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 110,
          padding: '16px'
        }}>
          <div style={{
            background: '#ffffff',
            borderRadius: '16px',
            width: '100%',
            maxWidth: '850px',
            maxHeight: '94vh',
            boxShadow: '0 25px 50px rgba(0,0,0,0.25)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden'
          }}>
            {/* Top Toolbar */}
            <div style={{
              background: '#0f172a',
              color: '#ffffff',
              padding: '14px 24px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div style={{ fontWeight: 800, fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span>📄</span>
                <span>ទម្រង់ស្នើសុំធ្វើការថែមម៉ោងផ្លូវការ (Official Overtime Requisition Slip)</span>
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  onClick={() => window.print()}
                  style={{
                    background: '#22c55e',
                    border: 'none',
                    color: '#ffffff',
                    padding: '8px 16px',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontWeight: 700,
                    fontSize: '0.85rem'
                  }}
                >
                  🖨️ បោះពុម្ព (Print)
                </button>
                <button
                  onClick={() => setSlipRequest(null)}
                  style={{
                    background: '#334155',
                    border: 'none',
                    color: '#ffffff',
                    padding: '8px 14px',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontWeight: 700,
                    fontSize: '0.85rem'
                  }}
                >
                  ✕ បិទ
                </button>
              </div>
            </div>

            {/* Printable Body */}
            <div style={{
              padding: '40px',
              overflowY: 'auto',
              background: '#ffffff',
              color: '#000000',
              fontFamily: 'serif',
              lineHeight: 1.6
            }}>
              {/* National Header */}
              <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#1e3a8a' }}>
                  ព្រះរាជាណាចក្រកម្ពុជា
                </div>
                <div style={{ fontSize: '1rem', fontWeight: 700, color: '#1e3a8a' }}>
                  ជាតិ សាសនា ព្រះមហាក្សត្រ
                </div>
                <div style={{ letterSpacing: '4px', fontSize: '12px', marginTop: '4px' }}>❖ ❖ ❖</div>
              </div>

              {/* Company Info */}
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '2px solid #000', paddingBottom: '12px', marginBottom: '20px' }}>
                <div>
                  <div style={{ fontWeight: 800, fontSize: '1.1rem' }}>ក្រុមហ៊ុន / ស្ថាប័ន (COMPANY HRM SYSTEM)</div>
                  <div style={{ fontSize: '0.85rem' }}>ផ្នែកផលិតកម្ម និងធនធានមនុស្ស (Production & HR Department)</div>
                </div>
                <div style={{ textAlign: 'right', fontSize: '0.85rem' }}>
                  <div>កាលបរិច្ឆេទ: {new Date(slipRequest.otDate).toISOString().split('T')[0]}</div>
                  <div>លេខយោង: OT-{new Date().getFullYear()}-{slipRequest.employee.employeeId}</div>
                </div>
              </div>

              {/* Form Title */}
              <div style={{ textAlign: 'center', margin: '20px 0' }}>
                <h2 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 900, textDecoration: 'underline' }}>
                  លិខិតស្នើសុំ និងអនុញ្ញាតធ្វើការថែមម៉ោង
                </h2>
                <div style={{ fontSize: '0.95rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', marginTop: '4px' }}>
                  OVERTIME REQUISITION & APPROVAL FORM
                </div>
              </div>

              {/* Employee Particulars Table */}
              <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '20px', border: '1px solid #cbd5e1' }}>
                <tbody>
                  <tr style={{ background: '#f8fafc' }}>
                    <td style={{ padding: '8px 12px', fontWeight: 700, width: '25%', border: '1px solid #cbd5e1' }}>គោត្តនាម និងនាម:</td>
                    <td style={{ padding: '8px 12px', border: '1px solid #cbd5e1' }}>
                      {slipRequest.employee.lastNameKh || ''} {slipRequest.employee.firstNameKh || ''} ({slipRequest.employee.firstNameEn} {slipRequest.employee.lastNameEn})
                    </td>
                    <td style={{ padding: '8px 12px', fontWeight: 700, width: '20%', border: '1px solid #cbd5e1' }}>អត្តលេខ:</td>
                    <td style={{ padding: '8px 12px', border: '1px solid #cbd5e1', fontWeight: 700, color: '#1e40af' }}>
                      {slipRequest.employee.employeeId}
                    </td>
                  </tr>
                  <tr>
                    <td style={{ padding: '8px 12px', fontWeight: 700, border: '1px solid #cbd5e1' }}>ផ្នែក / Department:</td>
                    <td style={{ padding: '8px 12px', border: '1px solid #cbd5e1' }}>{slipRequest.employee.department} {slipRequest.employee.line ? `(${slipRequest.employee.line})` : ''}</td>
                    <td style={{ padding: '8px 12px', fontWeight: 700, border: '1px solid #cbd5e1' }}>តួនាទី / Position:</td>
                    <td style={{ padding: '8px 12px', border: '1px solid #cbd5e1' }}>{slipRequest.employee.position}</td>
                  </tr>
                </tbody>
              </table>

              {/* OT Hours & Type Breakdown */}
              <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #cbd5e1', marginBottom: '20px', textAlign: 'center' }}>
                <thead>
                  <tr style={{ background: '#f1f5f9' }}>
                    <th style={{ padding: '8px', border: '1px solid #cbd5e1' }}>កាលបរិច្ឆេទ (Date)</th>
                    <th style={{ padding: '8px', border: '1px solid #cbd5e1' }}>ម៉ោងចូល-ចេញ (Time)</th>
                    <th style={{ padding: '8px', border: '1px solid #cbd5e1' }}>ចំនួនម៉ោង (Hours)</th>
                    <th style={{ padding: '8px', border: '1px solid #cbd5e1' }}>ប្រភេទថែមម៉ោង (Type)</th>
                    <th style={{ padding: '8px', border: '1px solid #cbd5e1' }}>អត្រាគុណ (Rate)</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td style={{ padding: '10px', border: '1px solid #cbd5e1', fontWeight: 700 }}>
                      {new Date(slipRequest.otDate).toISOString().split('T')[0]}
                    </td>
                    <td style={{ padding: '10px', border: '1px solid #cbd5e1' }}>
                      {slipRequest.startTime} - {slipRequest.endTime}
                    </td>
                    <td style={{ padding: '10px', border: '1px solid #cbd5e1', fontWeight: 800, fontSize: '1.1rem', color: '#1e3a8a' }}>
                      {slipRequest.totalHours} ម៉ោង
                    </td>
                    <td style={{ padding: '10px', border: '1px solid #cbd5e1' }}>
                      {OT_TYPE_CONFIG[slipRequest.otType]?.labelKh || slipRequest.otType}
                    </td>
                    <td style={{ padding: '10px', border: '1px solid #cbd5e1', fontWeight: 800, color: '#15803d' }}>
                      {slipRequest.rateMultiplier}x
                    </td>
                  </tr>
                </tbody>
              </table>

              {/* Justification & Tasks */}
              <div style={{ marginBottom: '20px' }}>
                <strong>មូលហេតុ និងភារកិច្ចត្រូវបំពេញ (Reason / Tasks):</strong>
                <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '6px', border: '1px solid #cbd5e1', marginTop: '6px' }}>
                  {slipRequest.reason} {slipRequest.notes ? `• ${slipRequest.notes}` : ''}
                </div>
              </div>

              {/* Approval Notice */}
              <div style={{
                background: '#f0fdf4',
                padding: '12px',
                borderRadius: '6px',
                border: '1px solid #bbf7d0',
                color: '#166534',
                fontSize: '0.88rem',
                marginBottom: '24px'
              }}>
                ស្ថានភាព: <strong>{STATUS_CONFIG[slipRequest.status]?.labelKh || slipRequest.status}</strong>
                {slipRequest.approvedBy && ` (អនុម័តដោយ: ${slipRequest.approvedBy})`}
              </div>

              {/* Signatures */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: '20px',
                marginTop: '40px',
                paddingTop: '20px',
                textAlign: 'center'
              }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>ហត្ថលេខាបុគ្គលិក</div>
                  <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Employee Signature</div>
                  <div style={{ height: '60px', borderBottom: '1px dashed #94a3b8', margin: '10px 20px' }}></div>
                  <div style={{ fontSize: '0.82rem' }}>កាលបរិច្ឆេទ: ......./......./...........</div>
                </div>

                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>ប្រធានផ្នែក/អ្នកស្នើសុំ</div>
                  <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Dept Head / Supervisor</div>
                  <div style={{ height: '60px', borderBottom: '1px dashed #94a3b8', margin: '10px 20px' }}></div>
                  <div style={{ fontSize: '0.82rem' }}>កាលបរិច្ឆេទ: ......./......./...........</div>
                </div>

                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>នាយកដ្ឋានធនធានមនុស្ស</div>
                  <div style={{ fontSize: '0.75rem', color: '#64748b' }}>HR Manager / Director</div>
                  <div style={{ height: '60px', borderBottom: '1px dashed #94a3b8', margin: '10px 20px' }}></div>
                  <div style={{ fontSize: '0.82rem' }}>កាលបរិច្ឆេទ: ......./......./...........</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
