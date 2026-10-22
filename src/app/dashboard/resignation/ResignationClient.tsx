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
  hireDate?: string | null;
}

interface ExitInterview {
  id: string;
  employeeId: string;
  employee: EmployeeSimple;
  resignationDate: string;
  lastWorkingDate: string;
  primaryReason: string;
  reasonDetails?: string | null;
  cultureRating: number;
  managementRating: number;
  salaryBenefitRating: number;
  workEnvRating: number;
  growthOppRating: number;
  wouldRecommend: boolean;
  handoverPerson?: string | null;
  handoverNotes?: string | null;
  itClearance: boolean;
  financeClearance: boolean;
  adminClearance: boolean;
  hrClearance: boolean;
  interviewerName?: string | null;
  feedbackNotes?: string | null;
  status: string;
  createdAt: string;
  updatedAt: string;
}

interface Props {
  initialRecords: ExitInterview[];
  employees: EmployeeSimple[];
  departments: string[];
  userRole?: string;
}

const REASON_CONFIG: Record<string, { labelKh: string; labelEn: string; labelZh: string; icon: string }> = {
  BETTER_OFFER: { labelKh: 'ការងារថ្មីប្រាក់ខែខ្ពស់ជាង', labelEn: 'Better Compensation', labelZh: '获得更好待遇', icon: '💰' },
  CAREER_GROWTH: { labelKh: 'ស្វែងរកឱកាសរីកចម្រើន', labelEn: 'Career Growth', labelZh: '职业晋升发展', icon: '🚀' },
  WORK_ENVIRONMENT: { labelKh: 'បរិយាកាសការងារ', labelEn: 'Work Environment', labelZh: '工作环境文化', icon: '🏢' },
  MANAGEMENT: { labelKh: 'ការដឹកនាំ/ការគ្រប់គ្រង', labelEn: 'Leadership / Management', labelZh: '管理协调问题', icon: '🤝' },
  PERSONAL_FAMILY: { labelKh: 'កិច្ចការគ្រួសារ/ផ្ទាល់ខ្លួន', labelEn: 'Family / Personal', labelZh: '家庭或个人原因', icon: '👨‍👩‍👧' },
  RELOCATION: { labelKh: 'ការផ្លាស់ប្តូរទីលំនៅ', labelEn: 'Relocation', labelZh: '搬家异地生活', icon: '🚚' },
  HEALTH: { labelKh: 'បញ្ហាសុខភាព', labelEn: 'Health Issues', labelZh: '身体健康原因', icon: '🏥' },
  OTHER: { labelKh: 'មូលហេតុផ្សេងៗ', labelEn: 'Other Reasons', labelZh: '其他具体原因', icon: '📝' }
};

const STATUS_CONFIG: Record<string, { labelKh: string; labelEn: string; bg: string; text: string }> = {
  PENDING: { labelKh: 'រង់ចាំពិនិត្យ', labelEn: 'Pending Review', bg: '#fef3c7', text: '#b45309' },
  CLEARANCE_IN_PROGRESS: { labelKh: 'កំពុងប្រគល់សម្ភារៈ', labelEn: 'Clearance in Progress', bg: '#e0f2fe', text: '#0369a1' },
  COMPLETED: { labelKh: 'បានបញ្ចប់សព្វគ្រប់', labelEn: 'Completed', bg: '#dcfce7', text: '#15803d' },
  CANCELLED: { labelKh: 'បានលុបចោល', labelEn: 'Cancelled', bg: '#fee2e2', text: '#b91c1c' }
};

export default function ResignationClient({ initialRecords, employees, departments, userRole = 'ADMIN' }: Props) {
  const isHR = userRole === 'ADMIN' || userRole === 'HR_MANAGER' || userRole === 'HR';

  const [records, setRecords] = useState<ExitInterview[]>(initialRecords);
  const [loading, setLoading] = useState<boolean>(false);

  // Filters
  const [search, setSearch] = useState<string>('');
  const [reasonFilter, setReasonFilter] = useState<string>('ALL');
  const [departmentFilter, setDepartmentFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Modals
  const [showModal, setShowModal] = useState<boolean>(false);
  const [editingRecord, setEditingRecord] = useState<ExitInterview | null>(null);

  // Clearance Slip Modal
  const [slipRecord, setSlipRecord] = useState<ExitInterview | null>(null);

  // Form State
  const [form, setForm] = useState({
    employeeId: employees[0]?.id || '',
    resignationDate: new Date().toISOString().split('T')[0],
    lastWorkingDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    primaryReason: 'CAREER_GROWTH',
    reasonDetails: '',
    cultureRating: 4,
    managementRating: 4,
    salaryBenefitRating: 3,
    workEnvRating: 4,
    growthOppRating: 3,
    wouldRecommend: true,
    handoverPerson: '',
    handoverNotes: '',
    itClearance: false,
    financeClearance: false,
    adminClearance: false,
    hrClearance: false,
    interviewerName: 'ការិយាល័យធនធានមនុស្ស (HR Dept)',
    feedbackNotes: '',
    status: 'PENDING'
  });

  // Pagination State for high-volume workers
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(25);

  // Quick Employee Search in Modal
  const [modalEmpSearch, setModalEmpSearch] = useState<string>('');

  // Filtered Records
  const filteredRecords = useMemo(() => {
    return records.filter(rec => {
      const emp = rec.employee;
      const fullName = `${emp.firstNameEn} ${emp.lastNameEn} ${emp.firstNameKh || ''} ${emp.lastNameKh || ''}`.toLowerCase();
      const matchesSearch = !search ||
        fullName.includes(search.toLowerCase()) ||
        emp.employeeId.toLowerCase().includes(search.toLowerCase()) ||
        (rec.handoverPerson && rec.handoverPerson.toLowerCase().includes(search.toLowerCase()));

      const matchesReason = reasonFilter === 'ALL' || rec.primaryReason === reasonFilter;
      const matchesDept = departmentFilter === 'ALL' || emp.department === departmentFilter;
      const matchesStatus = statusFilter === 'ALL' || rec.status === statusFilter;

      return matchesSearch && matchesReason && matchesDept && matchesStatus;
    });
  }, [records, search, reasonFilter, departmentFilter, statusFilter]);

  // Paginated records
  const totalPages = pageSize === -1 ? 1 : Math.ceil(filteredRecords.length / pageSize) || 1;
  const paginatedRecords = useMemo(() => {
    if (pageSize === -1) return filteredRecords;
    const start = (currentPage - 1) * pageSize;
    return filteredRecords.slice(start, start + pageSize);
  }, [filteredRecords, currentPage, pageSize]);

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
    let completed = 0;
    let totalScoreSum = 0;
    let ratedCount = 0;

    records.forEach(r => {
      if (r.status === 'PENDING' || r.status === 'CLEARANCE_IN_PROGRESS') pending++;
      if (r.status === 'COMPLETED') completed++;
      const avgRating = (r.cultureRating + r.managementRating + r.salaryBenefitRating + r.workEnvRating + r.growthOppRating) / 5;
      totalScoreSum += avgRating;
      ratedCount++;
    });

    const avgExperience = ratedCount > 0 ? (totalScoreSum / ratedCount).toFixed(1) : '5.0';

    return {
      total: records.length,
      pending,
      completed,
      avgExperience
    };
  }, [records]);

  // Open Create
  const handleOpenCreate = () => {
    setEditingRecord(null);
    setForm({
      employeeId: employees[0]?.id || '',
      resignationDate: new Date().toISOString().split('T')[0],
      lastWorkingDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      primaryReason: 'CAREER_GROWTH',
      reasonDetails: '',
      cultureRating: 4,
      managementRating: 4,
      salaryBenefitRating: 3,
      workEnvRating: 4,
      growthOppRating: 3,
      wouldRecommend: true,
      handoverPerson: '',
      handoverNotes: '',
      itClearance: false,
      financeClearance: false,
      adminClearance: false,
      hrClearance: false,
      interviewerName: 'ការិយាល័យធនធានមនុស្ស (HR Dept)',
      feedbackNotes: '',
      status: 'PENDING'
    });
    setShowModal(true);
  };

  // Open Edit
  const handleOpenEdit = (rec: ExitInterview) => {
    setEditingRecord(rec);
    setForm({
      employeeId: rec.employeeId,
      resignationDate: new Date(rec.resignationDate).toISOString().split('T')[0],
      lastWorkingDate: new Date(rec.lastWorkingDate).toISOString().split('T')[0],
      primaryReason: rec.primaryReason,
      reasonDetails: rec.reasonDetails || '',
      cultureRating: rec.cultureRating,
      managementRating: rec.managementRating,
      salaryBenefitRating: rec.salaryBenefitRating,
      workEnvRating: rec.workEnvRating,
      growthOppRating: rec.growthOppRating,
      wouldRecommend: rec.wouldRecommend,
      handoverPerson: rec.handoverPerson || '',
      handoverNotes: rec.handoverNotes || '',
      itClearance: rec.itClearance,
      financeClearance: rec.financeClearance,
      adminClearance: rec.adminClearance,
      hrClearance: rec.hrClearance,
      interviewerName: rec.interviewerName || 'HR Dept',
      feedbackNotes: rec.feedbackNotes || '',
      status: rec.status
    });
    setShowModal(true);
  };

  // Quick Toggle Clearance Checkpoint
  const handleToggleClearance = async (rec: ExitInterview, field: 'itClearance' | 'financeClearance' | 'adminClearance' | 'hrClearance') => {
    if (!isHR) return;
    const nextVal = !rec[field];
    try {
      const res = await fetch('/api/resignation', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: rec.id,
          [field]: nextVal
        })
      });

      if (res.ok) {
        const updated = await res.json();
        setRecords(prev => prev.map(r => r.id === updated.id ? updated : r));
      }
    } catch (err: any) {
      console.error(err);
    }
  };

  // Save Record
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.employeeId || !form.lastWorkingDate) {
      Swal.fire({
        icon: 'warning',
        title: 'សូមបំពេញព័ត៌មាន (Required)',
        text: 'សូមជ្រើសរើសបុគ្គលិក និងថ្ងៃធ្វើការចុងក្រោយ'
      });
      return;
    }

    setLoading(true);
    try {
      const isEditing = Boolean(editingRecord);
      const url = '/api/resignation';
      const method = isEditing ? 'PUT' : 'POST';
      const payload = isEditing ? { id: editingRecord!.id, ...form } : form;

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to save');
      }

      const savedData: ExitInterview = await res.json();

      if (isEditing) {
        setRecords(prev => prev.map(r => r.id === savedData.id ? savedData : r));
      } else {
        setRecords(prev => [savedData, ...prev]);
      }

      setShowModal(false);
      Swal.fire({
        icon: 'success',
        title: 'ជោគជ័យ (Saved)',
        text: isEditing ? 'បានកែប្រែកំណត់ត្រារួចរាល់' : 'បានកត់ត្រាការលាលែងថ្មីដោយជោគជ័យ',
        timer: 1500,
        showConfirmButton: false
      });
    } catch (err: any) {
      Swal.fire({
        icon: 'error',
        title: 'កំហុស (Error)',
        text: err.message
      });
    } finally {
      setLoading(false);
    }
  };

  // Delete Record
  const handleDelete = async (rec: ExitInterview) => {
    const result = await Swal.fire({
      title: 'តើអ្នកប្រាកដទេ? (Are you sure?)',
      text: `ចង់លុបកំណត់ត្រាលាលែងរបស់ ${rec.employee.firstNameEn}?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'បាទ/ចាស លុប (Yes, Delete)',
      cancelButtonText: 'បោះបង់ (Cancel)'
    });

    if (!result.isConfirmed) return;

    try {
      const res = await fetch(`/api/resignation?id=${rec.id}`, {
        method: 'DELETE'
      });

      if (res.ok) {
        setRecords(prev => prev.filter(r => r.id !== rec.id));
        Swal.fire({
          icon: 'success',
          title: 'បានលុប (Deleted)',
          text: 'កំណត់ត្រាត្រូវបានលុបរួចរាល់',
          timer: 1500,
          showConfirmButton: false
        });
      } else {
        const data = await res.json();
        throw new Error(data.error || 'Failed to delete');
      }
    } catch (err: any) {
      Swal.fire({
        icon: 'error',
        title: 'កំហុស (Error)',
        text: err.message
      });
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
      const exportData = filteredRecords.map((rec, index) => {
        const emp = rec.employee;
        const reasonConf = REASON_CONFIG[rec.primaryReason] || { labelKh: rec.primaryReason, labelEn: rec.primaryReason, labelZh: rec.primaryReason };
        const statusConf = STATUS_CONFIG[rec.status] || { labelKh: rec.status, labelEn: rec.status };

        const allClear = rec.itClearance && rec.financeClearance && rec.adminClearance && rec.hrClearance ? 'បានរួចរាល់ (Cleared)' : 'នៅសល់ (Pending)';

        return {
          'ល.រ\nNo.\n序号': index + 1,
          'អត្តលេខ\nEmp ID\n工号': emp.employeeId,
          'គោត្តនាម-នាម\nFull Name\n姓名': `${emp.lastNameKh || ''} ${emp.firstNameKh || ''} (${emp.firstNameEn} ${emp.lastNameEn})`.trim(),
          'ផ្នែក\nDepartment\n部门': emp.department,
          'តួនាទី\nPosition\n职位': emp.position,
          'កាលបរិច្ឆេទដាក់ពាក្យ\nNotice Date\n申请日期': new Date(rec.resignationDate).toISOString().split('T')[0],
          'ថ្ងៃធ្វើការចុងក្រោយ\nLast Day\n最后工作日': new Date(rec.lastWorkingDate).toISOString().split('T')[0],
          'មូលហេតុចម្បង\nPrimary Reason\n离职主要原因': `${reasonConf.labelKh} (${reasonConf.labelEn} / ${reasonConf.labelZh})`,
          'អ្នកទទួលការងារបន្ត\nHandover To\n交接给': rec.handoverPerson || '-',
          'ការប្រគល់សម្ភារៈ\nClearance\n物品清退': allClear,
          'ពិន្ទុបទពិសោធន៍\nSatisfaction\n满意度': `${((rec.cultureRating + rec.managementRating + rec.salaryBenefitRating + rec.workEnvRating + rec.growthOppRating) / 5).toFixed(1)} / 5`,
          'ស្ថានភាព\nStatus\n状态': `${statusConf.labelKh} (${statusConf.labelEn})`,
        };
      });

      const ws = XLSX.utils.json_to_sheet(exportData);
      ws['!cols'] = autoFitColumns(exportData);

      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Exit_Interviews');
      XLSX.writeFile(wb, `Resignations_Exit_Interviews_${new Date().toISOString().split('T')[0]}.xlsx`);

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
          <span style={{ fontSize: '30px' }}>📝</span>
          <div>
            <h1 style={{ margin: 0, fontSize: '1.6rem', fontWeight: 800, color: '#0f172a' }}>
              ការលាលែង និងសម្ភាសន៍ចាកចេញ
            </h1>
            <p style={{ margin: '4px 0 0 0', color: '#64748b', fontSize: '0.88rem' }}>
              Employee Resignations, Exit Interviews & Clearance Checklist • 员工辞职申请与离职清退交接
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <a
            href="/dashboard/offboarding"
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
            <span>🚪</span>
            <span>បញ្ចប់ការងារ & ទូទាត់ប្រាក់ (Offboarding)</span>
          </a>

          {isHR && (
            <button
              onClick={handleOpenCreate}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
                color: '#ffffff',
                border: 'none',
                borderRadius: '10px',
                padding: '10px 18px',
                fontWeight: 700,
                fontSize: '0.9rem',
                cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(2, 132, 199, 0.25)'
              }}
            >
              <span>➕</span>
              <div style={{ textAlign: 'left', lineHeight: 1.2 }}>
                <div>កត់ត្រាការលាលែង</div>
                <div style={{ fontSize: '0.7rem', opacity: 0.85 }}>New Resignation • 新增辞职</div>
              </div>
            </button>
          )}

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
              padding: '10px 18px',
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
        {/* Card 1: Total Resignations */}
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
            <div style={{ fontWeight: 800, fontSize: '0.95rem', color: '#0f172a' }}>ការលាលែងសរុប</div>
            <div style={{ fontSize: '0.72rem', color: '#64748b' }}>Total Resignations • 辞职总数</div>
            <div style={{ fontSize: '1.7rem', fontWeight: 900, color: '#0284c7', marginTop: '4px' }}>
              {stats.total}
            </div>
          </div>
        </div>

        {/* Card 2: Pending Clearance */}
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
            color: '#d97706',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '24px'
          }}>
            ⏳
          </div>
          <div>
            <div style={{ fontWeight: 800, fontSize: '0.95rem', color: '#0f172a' }}>រង់ចាំការប្រគល់</div>
            <div style={{ fontSize: '0.72rem', color: '#64748b' }}>Pending Handover • 待交接清退</div>
            <div style={{ fontSize: '1.7rem', fontWeight: 900, color: '#d97706', marginTop: '4px' }}>
              {stats.pending}
            </div>
          </div>
        </div>

        {/* Card 3: Completed Clearance */}
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
            <div style={{ fontWeight: 800, fontSize: '0.95rem', color: '#0f172a' }}>បានបញ្ចប់សព្វគ្រប់</div>
            <div style={{ fontSize: '0.72rem', color: '#64748b' }}>Completed • 已完成交接</div>
            <div style={{ fontSize: '1.7rem', fontWeight: 900, color: '#15803d', marginTop: '4px' }}>
              {stats.completed}
            </div>
          </div>
        </div>

        {/* Card 4: Average Experience Rating */}
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
            ⭐
          </div>
          <div>
            <div style={{ fontWeight: 800, fontSize: '0.95rem', color: '#0f172a' }}>ពិន្ទុបទពិសោធន៍</div>
            <div style={{ fontSize: '0.72rem', color: '#64748b' }}>Avg Experience • 满意度均分</div>
            <div style={{ fontSize: '1.7rem', fontWeight: 900, color: '#7e22ce', marginTop: '4px' }}>
              {stats.avgExperience} / 5
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
            placeholder="ស្វែងរកតាមឈ្មោះ, អត្តលេខ ឬអ្នកទទួលការងារ..."
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

        {/* Reason Filter */}
        <div style={{ minWidth: '170px' }}>
          <select
            value={reasonFilter}
            onChange={e => { setReasonFilter(e.target.value); setCurrentPage(1); }}
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
            <option value="ALL">💡 គ្រប់មូលហេតុ (All Reasons)</option>
            {Object.entries(REASON_CONFIG).map(([k, v]) => (
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
            title="ចំនួនជួរក្នុងមួយទំព័រ (Rows per page)"
          >
            <option value={10}>📄 10 នាក់/ទំព័រ</option>
            <option value={25}>📄 25 នាក់/ទំព័រ</option>
            <option value={50}>📄 50 នាក់/ទំព័រ</option>
            <option value={100}>📄 100 នាក់/ទំព័រ</option>
            <option value={-1}>📄 ទាំងអស់ (All)</option>
          </select>
        </div>

        {/* Reset Filter Button */}
        {(search || reasonFilter !== 'ALL' || departmentFilter !== 'ALL' || statusFilter !== 'ALL') && (
          <button
            onClick={() => {
              setSearch('');
              setReasonFilter('ALL');
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

      {/* Resignation Records Table (3-Languages on All TH) */}
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

                {/* 3: Dates */}
                <th style={{ padding: '9px 12px', minWidth: '150px' }}>
                  <div style={{ fontWeight: 800, color: '#0f172a', fontSize: '0.85rem' }}>កាលបរិច្ឆេទចាកចេញ</div>
                  <div style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 600 }}>Notice & Last Day</div>
                  <div style={{ fontSize: '0.65rem', color: '#94a3b8' }}>申请与最后工作日</div>
                </th>

                {/* 4: Primary Reason */}
                <th style={{ padding: '9px 12px', minWidth: '190px' }}>
                  <div style={{ fontWeight: 800, color: '#0f172a', fontSize: '0.85rem' }}>មូលហេតុចម្បង</div>
                  <div style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 600 }}>Primary Reason</div>
                  <div style={{ fontSize: '0.65rem', color: '#94a3b8' }}>离职主要原因</div>
                </th>

                {/* 5: Clearance Checklist (IT, Finance, Admin, HR) */}
                <th style={{ padding: '9px 12px', minWidth: '210px' }}>
                  <div style={{ fontWeight: 800, color: '#0f172a', fontSize: '0.85rem' }}>ការប្រគល់សម្ភារៈ (Clearance)</div>
                  <div style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 600 }}>IT • Finance • Admin • HR</div>
                  <div style={{ fontSize: '0.65rem', color: '#94a3b8' }}>物品与各部门交接</div>
                </th>

                {/* 6: Handover Person */}
                <th style={{ padding: '9px 12px', minWidth: '140px' }}>
                  <div style={{ fontWeight: 800, color: '#0f172a', fontSize: '0.85rem' }}>អ្នកទទួលការងារ</div>
                  <div style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 600 }}>Handover Colleague</div>
                  <div style={{ fontSize: '0.65rem', color: '#94a3b8' }}>交接承接人</div>
                </th>

                {/* 7: Status */}
                <th style={{ padding: '9px 12px', minWidth: '120px' }}>
                  <div style={{ fontWeight: 800, color: '#0f172a', fontSize: '0.85rem' }}>ស្ថានភាព</div>
                  <div style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 600 }}>Status</div>
                  <div style={{ fontSize: '0.65rem', color: '#94a3b8' }}>状态</div>
                </th>

                {/* 8: Actions */}
                <th style={{ padding: '9px 12px', minWidth: '150px', textAlign: 'right' }}>
                  <div style={{ fontWeight: 800, color: '#0f172a', fontSize: '0.85rem' }}>សកម្មភាព</div>
                  <div style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 600 }}>Actions</div>
                  <div style={{ fontSize: '0.65rem', color: '#94a3b8' }}>操作</div>
                </th>
              </tr>
            </thead>

            <tbody>
              {paginatedRecords.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>
                    <div style={{ fontSize: '32px', marginBottom: '8px' }}>📝</div>
                    <div style={{ fontWeight: 700, fontSize: '1rem' }}>មិនមានកំណត់ត្រាលាលែងត្រូវបង្ហាញទេ</div>
                    <div style={{ fontSize: '0.82rem' }}>No resignation records found</div>
                  </td>
                </tr>
              ) : (
                paginatedRecords.map((rec, index) => {
                  const emp = rec.employee;
                  const reasonConf = REASON_CONFIG[rec.primaryReason] || { labelKh: rec.primaryReason, labelEn: rec.primaryReason, labelZh: rec.primaryReason, icon: '💡' };
                  const statusConf = STATUS_CONFIG[rec.status] || { labelKh: rec.status, labelEn: rec.status, bg: '#f1f5f9', text: '#475569' };
                  const rowNumber = (currentPage - 1) * (pageSize === -1 ? 0 : pageSize) + index + 1;

                  return (
                    <tr
                      key={rec.id}
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
                          {emp.department}
                        </div>
                      </td>

                      {/* Dates */}
                      <td style={{ padding: '8px 12px', fontSize: '0.82rem' }}>
                        <div style={{ color: '#64748b' }}>
                          ដាក់ពាក្យ: <strong>{new Date(rec.resignationDate).toISOString().split('T')[0]}</strong>
                        </div>
                        <div style={{ color: '#dc2626', fontWeight: 700, marginTop: '2px' }}>
                          ថ្ងៃចុងក្រោយ: {new Date(rec.lastWorkingDate).toISOString().split('T')[0]}
                        </div>
                      </td>

                      {/* Primary Reason */}
                      <td style={{ padding: '8px 12px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700, fontSize: '0.85rem', color: '#0f172a' }}>
                          <span>{reasonConf.icon}</span>
                          <span>{reasonConf.labelKh}</span>
                        </div>
                        <div style={{ fontSize: '0.7rem', color: '#64748b' }}>
                          {reasonConf.labelEn}
                        </div>
                        {rec.reasonDetails && (
                          <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '2px', maxWidth: '220px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {rec.reasonDetails}
                          </div>
                        )}
                      </td>

                      {/* 4 Clearance Badges (Clickable toggles for HR) */}
                      <td style={{ padding: '8px 12px' }}>
                        <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
                          {/* IT */}
                          <span
                            onClick={() => handleToggleClearance(rec, 'itClearance')}
                            title="ចុចដើម្បីប្តូរស្ថានភាព IT Clearance"
                            style={{
                              padding: '3px 7px',
                              borderRadius: '6px',
                              background: rec.itClearance ? '#dcfce7' : '#fee2e2',
                              color: rec.itClearance ? '#15803d' : '#b91c1c',
                              fontSize: '0.72rem',
                              fontWeight: 700,
                              cursor: isHR ? 'pointer' : 'default',
                              border: `1px solid ${rec.itClearance ? '#86efac' : '#fca5a5'}`
                            }}
                          >
                            💻 IT: {rec.itClearance ? '✓' : '✗'}
                          </span>

                          {/* Finance */}
                          <span
                            onClick={() => handleToggleClearance(rec, 'financeClearance')}
                            title="ចុចដើម្បីប្តូរស្ថានភាព Finance Clearance"
                            style={{
                              padding: '3px 7px',
                              borderRadius: '6px',
                              background: rec.financeClearance ? '#dcfce7' : '#fee2e2',
                              color: rec.financeClearance ? '#15803d' : '#b91c1c',
                              fontSize: '0.72rem',
                              fontWeight: 700,
                              cursor: isHR ? 'pointer' : 'default',
                              border: `1px solid ${rec.financeClearance ? '#86efac' : '#fca5a5'}`
                            }}
                          >
                            💰 Fin: {rec.financeClearance ? '✓' : '✗'}
                          </span>

                          {/* Admin */}
                          <span
                            onClick={() => handleToggleClearance(rec, 'adminClearance')}
                            title="ចុចដើម្បីប្តូរស្ថានភាព Admin Assets Clearance"
                            style={{
                              padding: '3px 7px',
                              borderRadius: '6px',
                              background: rec.adminClearance ? '#dcfce7' : '#fee2e2',
                              color: rec.adminClearance ? '#15803d' : '#b91c1c',
                              fontSize: '0.72rem',
                              fontWeight: 700,
                              cursor: isHR ? 'pointer' : 'default',
                              border: `1px solid ${rec.adminClearance ? '#86efac' : '#fca5a5'}`
                            }}
                          >
                            🏢 Admin: {rec.adminClearance ? '✓' : '✗'}
                          </span>

                          {/* HR */}
                          <span
                            onClick={() => handleToggleClearance(rec, 'hrClearance')}
                            title="ចុចដើម្បីប្តូរស្ថានភាព HR Clearance"
                            style={{
                              padding: '3px 7px',
                              borderRadius: '6px',
                              background: rec.hrClearance ? '#dcfce7' : '#fee2e2',
                              color: rec.hrClearance ? '#15803d' : '#b91c1c',
                              fontSize: '0.72rem',
                              fontWeight: 700,
                              cursor: isHR ? 'pointer' : 'default',
                              border: `1px solid ${rec.hrClearance ? '#86efac' : '#fca5a5'}`
                            }}
                          >
                            👥 HR: {rec.hrClearance ? '✓' : '✗'}
                          </span>
                        </div>
                      </td>

                      {/* Handover Colleague */}
                      <td style={{ padding: '8px 12px', fontSize: '0.82rem', fontWeight: 600, color: '#334155' }}>
                        {rec.handoverPerson || <span style={{ color: '#94a3b8' }}>មិនទាន់កំណត់</span>}
                      </td>

                      {/* Status */}
                      <td style={{ padding: '8px 12px' }}>
                        <span style={{
                          display: 'inline-block',
                          padding: '3px 7px',
                          borderRadius: '6px',
                          background: statusConf.bg,
                          color: statusConf.text,
                          fontWeight: 700,
                          fontSize: '0.75rem'
                        }}>
                          {statusConf.labelKh}
                        </span>
                      </td>

                      {/* Actions */}
                      <td style={{ padding: '8px 12px', textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: '5px', justifyContent: 'flex-end' }}>
                          {/* Slip Preview / Print */}
                          <button
                            onClick={() => setSlipRecord(rec)}
                            title="មើល និងបោះពុម្ពទម្រង់ប្រគល់ភារកិច្ច (Clearance Slip)"
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
                            📄 សន្លឹកប្រគល់
                          </button>

                          {isHR && (
                            <>
                              <button
                                onClick={() => handleOpenEdit(rec)}
                                title="កែប្រែ (Edit)"
                                style={{
                                  background: '#f8fafc',
                                  border: '1px solid #cbd5e1',
                                  color: '#334155',
                                  padding: '5px 8px',
                                  borderRadius: '6px',
                                  cursor: 'pointer',
                                  fontSize: '0.82rem'
                                }}
                              >
                                ✏️
                              </button>
                              <button
                                onClick={() => handleDelete(rec)}
                                title="លុប (Delete)"
                                style={{
                                  background: '#fef2f2',
                                  border: '1px solid #fecaca',
                                  color: '#dc2626',
                                  padding: '5px 8px',
                                  borderRadius: '6px',
                                  cursor: 'pointer',
                                  fontSize: '0.82rem'
                                }}
                              >
                                🗑️
                              </button>
                            </>
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
          បង្ហាញ {filteredRecords.length === 0 ? 0 : (currentPage - 1) * (pageSize === -1 ? filteredRecords.length : pageSize) + 1} ដល់{' '}
          {pageSize === -1 ? filteredRecords.length : Math.min(currentPage * pageSize, filteredRecords.length)} នៃ{' '}
          <strong style={{ color: '#0f172a' }}>{filteredRecords.length}</strong> កំណត់ត្រា
          <span style={{ fontSize: '0.75rem', color: '#94a3b8', marginLeft: '6px' }}>
            (Showing {filteredRecords.length === 0 ? 0 : (currentPage - 1) * (pageSize === -1 ? filteredRecords.length : pageSize) + 1}-
            {pageSize === -1 ? filteredRecords.length : Math.min(currentPage * pageSize, filteredRecords.length)} of {filteredRecords.length})
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

      {/* Add / Edit Resignation Modal */}
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
            maxWidth: '680px',
            boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
            overflow: 'hidden',
            maxHeight: '92vh',
            display: 'flex',
            flexDirection: 'column'
          }}>
            {/* Modal Header */}
            <div style={{
              background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
              color: '#ffffff',
              padding: '20px 24px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800 }}>
                  {editingRecord ? 'កែប្រែកំណត់ត្រាលាលែង' : 'កត់ត្រាការលាលែង និងសម្ភាសន៍ចាកចេញ'}
                </h3>
                <div style={{ fontSize: '0.8rem', color: '#bae6fd', marginTop: '4px' }}>
                  {editingRecord ? 'Edit Exit Interview Record' : 'Record New Resignation & Exit Interview • 记录辞职与离职面谈'}
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
              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontWeight: 700, fontSize: '0.88rem', color: '#1e293b' }}>
                  បុគ្គលិកដែលលាលែង (Employee) *
                </label>
                {!editingRecord && (
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
                )}
                <select
                  value={form.employeeId}
                  onChange={e => setForm({ ...form, employeeId: e.target.value })}
                  disabled={Boolean(editingRecord)}
                  required
                  style={{
                    width: '100%',
                    padding: '10px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    fontSize: '0.9rem',
                    background: editingRecord ? '#f8fafc' : '#ffffff'
                  }}
                >
                  {(editingRecord ? employees : filteredModalEmployees).map(emp => (
                    <option key={emp.id} value={emp.id}>
                      {emp.employeeId} - {emp.lastNameKh || ''} {emp.firstNameKh || ''} ({emp.firstNameEn} {emp.lastNameEn}) - {emp.department} ({emp.position})
                    </option>
                  ))}
                </select>
              </div>

              {/* Dates */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '6px', fontWeight: 700, fontSize: '0.88rem', color: '#1e293b' }}>
                    កាលបរិច្ឆេទដាក់ពាក្យ (Notice Date) *
                  </label>
                  <input
                    type="date"
                    value={form.resignationDate}
                    onChange={e => setForm({ ...form, resignationDate: e.target.value })}
                    required
                    style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', boxSizing: 'border-box' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '6px', fontWeight: 700, fontSize: '0.88rem', color: '#1e293b' }}>
                    ថ្ងៃធ្វើការចុងក្រោយ (Last Working Day) *
                  </label>
                  <input
                    type="date"
                    value={form.lastWorkingDate}
                    onChange={e => setForm({ ...form, lastWorkingDate: e.target.value })}
                    required
                    style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', boxSizing: 'border-box' }}
                  />
                </div>
              </div>

              {/* Primary Reason */}
              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontWeight: 700, fontSize: '0.88rem', color: '#1e293b' }}>
                  មូលហេតុចម្បងនៃការលាលែង (Primary Reason) *
                </label>
                <select
                  value={form.primaryReason}
                  onChange={e => setForm({ ...form, primaryReason: e.target.value })}
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.9rem' }}
                >
                  {Object.entries(REASON_CONFIG).map(([k, v]) => (
                    <option key={k} value={k}>
                      {v.icon} {v.labelKh} ({v.labelEn})
                    </option>
                  ))}
                </select>
              </div>

              {/* Reason Details */}
              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontWeight: 700, fontSize: '0.88rem', color: '#1e293b' }}>
                  ព័ត៌មានលម្អិតបន្ថែមនៃមូលហេតុ (Reason Details)
                </label>
                <textarea
                  rows={2}
                  placeholder="មូលហេតុបន្ថែម ឬយោបល់របស់បុគ្គលិក..."
                  value={form.reasonDetails}
                  onChange={e => setForm({ ...form, reasonDetails: e.target.value })}
                  style={{ width: '100%', padding: '8px', borderRadius: '8px', border: '1px solid #cbd5e1', boxSizing: 'border-box' }}
                />
              </div>

              {/* Handover Colleague & Notes */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '6px', fontWeight: 700, fontSize: '0.88rem', color: '#1e293b' }}>
                    អ្នកទទួលការងារបន្ត (Handover Person)
                  </label>
                  <input
                    type="text"
                    placeholder="ឈ្មោះអ្នកទទួលការងារ..."
                    value={form.handoverPerson}
                    onChange={e => setForm({ ...form, handoverPerson: e.target.value })}
                    style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', boxSizing: 'border-box' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '6px', fontWeight: 700, fontSize: '0.88rem', color: '#1e293b' }}>
                    ស្ថានភាពទូទៅ (Status)
                  </label>
                  <select
                    value={form.status}
                    onChange={e => setForm({ ...form, status: e.target.value })}
                    style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                  >
                    {Object.entries(STATUS_CONFIG).map(([k, v]) => (
                      <option key={k} value={k}>{v.labelKh} ({v.labelEn})</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Department Clearance Checklist Checkboxes */}
              <div style={{ background: '#f8fafc', padding: '14px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                <div style={{ fontWeight: 800, fontSize: '0.88rem', color: '#0f172a', marginBottom: '10px' }}>
                  ☑️ ការផ្ទៀងផ្ទាត់ និងប្រគល់សម្ភារៈ (Department Clearance Checklist):
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.85rem' }}>
                    <input
                      type="checkbox"
                      checked={form.itClearance}
                      onChange={e => setForm({ ...form, itClearance: e.target.checked })}
                      style={{ width: '18px', height: '18px' }}
                    />
                    <span>💻 IT Clearance (កុំព្យូទ័រ & គណនី)</span>
                  </label>

                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.85rem' }}>
                    <input
                      type="checkbox"
                      checked={form.financeClearance}
                      onChange={e => setForm({ ...form, financeClearance: e.target.checked })}
                      style={{ width: '18px', height: '18px' }}
                    />
                    <span>💰 Finance Clearance (ទូទាត់បុរេប្រទាន & បំណុល)</span>
                  </label>

                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.85rem' }}>
                    <input
                      type="checkbox"
                      checked={form.adminClearance}
                      onChange={e => setForm({ ...form, adminClearance: e.target.checked })}
                      style={{ width: '18px', height: '18px' }}
                    />
                    <span>🏢 Admin Clearance (កាតបុគ្គលិក, កូនសោ, ឯកសណ្ឋាន)</span>
                  </label>

                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.85rem' }}>
                    <input
                      type="checkbox"
                      checked={form.hrClearance}
                      onChange={e => setForm({ ...form, hrClearance: e.target.checked })}
                      style={{ width: '18px', height: '18px' }}
                    />
                    <span>👥 HR Clearance (ឯកសារ & សម្ភាសន៍ចាកចេញ)</span>
                  </label>
                </div>
              </div>

              {/* Exit Feedback Ratings (1 - 5) */}
              <div style={{ background: '#f8fafc', padding: '14px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                <div style={{ fontWeight: 800, fontSize: '0.88rem', color: '#0f172a', marginBottom: '10px' }}>
                  ⭐ ពិន្ទុវាយតម្លៃបទពិសោធន៍ការងារ (Exit Ratings 1-5 Stars):
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '10px' }}>
                  <div>
                    <label style={{ fontSize: '0.78rem', color: '#475569', display: 'block' }}>វប្បធម៌ក្រុមហ៊ុន</label>
                    <select
                      value={form.cultureRating}
                      onChange={e => setForm({ ...form, cultureRating: Number(e.target.value) })}
                      style={{ width: '100%', padding: '6px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                    >
                      {[5, 4, 3, 2, 1].map(n => <option key={n} value={n}>{n} ⭐</option>)}
                    </select>
                  </div>

                  <div>
                    <label style={{ fontSize: '0.78rem', color: '#475569', display: 'block' }}>ការគ្រប់គ្រង</label>
                    <select
                      value={form.managementRating}
                      onChange={e => setForm({ ...form, managementRating: Number(e.target.value) })}
                      style={{ width: '100%', padding: '6px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                    >
                      {[5, 4, 3, 2, 1].map(n => <option key={n} value={n}>{n} ⭐</option>)}
                    </select>
                  </div>

                  <div>
                    <label style={{ fontSize: '0.78rem', color: '#475569', display: 'block' }}>ប្រាក់ខែ & អត្ថប្រយោជន៍</label>
                    <select
                      value={form.salaryBenefitRating}
                      onChange={e => setForm({ ...form, salaryBenefitRating: Number(e.target.value) })}
                      style={{ width: '100%', padding: '6px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                    >
                      {[5, 4, 3, 2, 1].map(n => <option key={n} value={n}>{n} ⭐</option>)}
                    </select>
                  </div>

                  <div>
                    <label style={{ fontSize: '0.78rem', color: '#475569', display: 'block' }}>បរិយាកាសកន្លែងធ្វើការ</label>
                    <select
                      value={form.workEnvRating}
                      onChange={e => setForm({ ...form, workEnvRating: Number(e.target.value) })}
                      style={{ width: '100%', padding: '6px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                    >
                      {[5, 4, 3, 2, 1].map(n => <option key={n} value={n}>{n} ⭐</option>)}
                    </select>
                  </div>
                </div>
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
                    background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
                    color: '#ffffff',
                    fontWeight: 700,
                    cursor: 'pointer',
                    boxShadow: '0 2px 8px rgba(2, 132, 199, 0.3)'
                  }}
                >
                  {loading ? 'កំពុងរក្សាទុក...' : '💾 រក្សាទុក (Save)'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Official Handover & Exit Clearance Slip Modal */}
      {slipRecord && (
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
                <span>ទម្រង់ប្រគល់ភារកិច្ច និងសម្ភារៈក្រុមហ៊ុនផ្លូវការ (Exit Handover & Clearance Slip)</span>
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
                  onClick={() => setSlipRecord(null)}
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
                  <div style={{ fontSize: '0.85rem' }}>ការិយាល័យធនធានមនុស្ស (Human Resources Department)</div>
                </div>
                <div style={{ textAlign: 'right', fontSize: '0.85rem' }}>
                  <div>កាលបរិច្ឆេទ: {new Date().toISOString().split('T')[0]}</div>
                  <div>លេខយោង: HR-EXIT-{new Date().getFullYear()}-{slipRecord.employee.employeeId}</div>
                </div>
              </div>

              {/* Form Title */}
              <div style={{ textAlign: 'center', margin: '20px 0' }}>
                <h2 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 900, textDecoration: 'underline' }}>
                  លិខិតប្រគល់ភារកិច្ច និងបញ្ជាក់ការចាកចេញពីការងារ
                </h2>
                <div style={{ fontSize: '0.95rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', marginTop: '4px' }}>
                  EMPLOYEE EXIT HANDOVER & CLEARANCE CERTIFICATE
                </div>
              </div>

              {/* Employee Particulars Table */}
              <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '20px', border: '1px solid #cbd5e1' }}>
                <tbody>
                  <tr style={{ background: '#f8fafc' }}>
                    <td style={{ padding: '8px 12px', fontWeight: 700, width: '25%', border: '1px solid #cbd5e1' }}>គោត្តនាម និងនាម:</td>
                    <td style={{ padding: '8px 12px', border: '1px solid #cbd5e1' }}>
                      {slipRecord.employee.lastNameKh || ''} {slipRecord.employee.firstNameKh || ''} ({slipRecord.employee.firstNameEn} {slipRecord.employee.lastNameEn})
                    </td>
                    <td style={{ padding: '8px 12px', fontWeight: 700, width: '20%', border: '1px solid #cbd5e1' }}>អត្តលេខ:</td>
                    <td style={{ padding: '8px 12px', border: '1px solid #cbd5e1', fontWeight: 700, color: '#1e40af' }}>
                      {slipRecord.employee.employeeId}
                    </td>
                  </tr>
                  <tr>
                    <td style={{ padding: '8px 12px', fontWeight: 700, border: '1px solid #cbd5e1' }}>ផ្នែក / Department:</td>
                    <td style={{ padding: '8px 12px', border: '1px solid #cbd5e1' }}>{slipRecord.employee.department}</td>
                    <td style={{ padding: '8px 12px', fontWeight: 700, border: '1px solid #cbd5e1' }}>តួនាទី / Position:</td>
                    <td style={{ padding: '8px 12px', border: '1px solid #cbd5e1' }}>{slipRecord.employee.position}</td>
                  </tr>
                  <tr style={{ background: '#f8fafc' }}>
                    <td style={{ padding: '8px 12px', fontWeight: 700, border: '1px solid #cbd5e1' }}>ថ្ងៃដាក់ពាក្យ:</td>
                    <td style={{ padding: '8px 12px', border: '1px solid #cbd5e1' }}>{new Date(slipRecord.resignationDate).toISOString().split('T')[0]}</td>
                    <td style={{ padding: '8px 12px', fontWeight: 700, border: '1px solid #cbd5e1' }}>ថ្ងៃធ្វើការចុងក្រោយ:</td>
                    <td style={{ padding: '8px 12px', border: '1px solid #cbd5e1', fontWeight: 700, color: '#dc2626' }}>
                      {new Date(slipRecord.lastWorkingDate).toISOString().split('T')[0]}
                    </td>
                  </tr>
                </tbody>
              </table>

              {/* Handover Details */}
              <div style={{ marginBottom: '20px' }}>
                <div style={{ fontWeight: 800, fontSize: '0.95rem', marginBottom: '6px' }}>
                  ១. ការប្រគល់ភារកិច្ច និងឯកសារ (Work Handover):
                </div>
                <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '6px', border: '1px solid #cbd5e1' }}>
                  <div>អ្នកទទួលការងារបន្ត: <strong>{slipRecord.handoverPerson || '...................................................'}</strong></div>
                  <div style={{ marginTop: '4px' }}>កំណត់សម្គាល់ការងារ: {slipRecord.handoverNotes || 'បានប្រគល់ភារកិច្ច ឯកសារពាក់ព័ន្ធ និងគម្រោងដែលនៅសេសសល់រួចរាល់។'}</div>
                </div>
              </div>

              {/* Department Clearances Table */}
              <div style={{ marginBottom: '24px' }}>
                <div style={{ fontWeight: 800, fontSize: '0.95rem', marginBottom: '6px' }}>
                  ២. ការទូទាត់ និងប្រគល់សម្ភារៈតាមផ្នែក (Department Clearances):
                </div>
                <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #cbd5e1', textAlign: 'center' }}>
                  <thead>
                    <tr style={{ background: '#f1f5f9' }}>
                      <th style={{ padding: '8px', border: '1px solid #cbd5e1' }}>ផ្នែកព័ត៌មានវិទ្យា (IT)</th>
                      <th style={{ padding: '8px', border: '1px solid #cbd5e1' }}>ផ្នែករដ្ឋបាល (Admin)</th>
                      <th style={{ padding: '8px', border: '1px solid #cbd5e1' }}>ផ្នែកគណនេយ្យ (Finance)</th>
                      <th style={{ padding: '8px', border: '1px solid #cbd5e1' }}>ផ្នែកធនធានមនុស្ស (HR)</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td style={{ padding: '12px', border: '1px solid #cbd5e1' }}>
                        <div>{slipRecord.itClearance ? '✅ បានប្រគល់កុំព្យូទ័រ' : '⏳ នៅខ្វះសម្ភារៈ'}</div>
                        <div style={{ height: '30px', borderBottom: '1px dashed #94a3b8', marginTop: '10px' }}></div>
                        <div style={{ fontSize: '0.75rem', marginTop: '4px' }}>ហត្ថលេខា IT</div>
                      </td>
                      <td style={{ padding: '12px', border: '1px solid #cbd5e1' }}>
                        <div>{slipRecord.adminClearance ? '✅ បានប្រគល់កាត/កូនសោ' : '⏳ នៅខ្វះសម្ភារៈ'}</div>
                        <div style={{ height: '30px', borderBottom: '1px dashed #94a3b8', marginTop: '10px' }}></div>
                        <div style={{ fontSize: '0.75rem', marginTop: '4px' }}>ហត្ថលេខា Admin</div>
                      </td>
                      <td style={{ padding: '12px', border: '1px solid #cbd5e1' }}>
                        <div>{slipRecord.financeClearance ? '✅ បានទូទាត់រួចរាល់' : '⏳ នៅជំពាក់បំណុល'}</div>
                        <div style={{ height: '30px', borderBottom: '1px dashed #94a3b8', marginTop: '10px' }}></div>
                        <div style={{ fontSize: '0.75rem', marginTop: '4px' }}>ហត្ថលេខា Finance</div>
                      </td>
                      <td style={{ padding: '12px', border: '1px solid #cbd5e1' }}>
                        <div>{slipRecord.hrClearance ? '✅ បានសម្ភាសន៍រួច' : '⏳ នៅខ្វះឯកសារ'}</div>
                        <div style={{ height: '30px', borderBottom: '1px dashed #94a3b8', marginTop: '10px' }}></div>
                        <div style={{ fontSize: '0.75rem', marginTop: '4px' }}>ហត្ថលេខា HR</div>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Main Signatures */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: '20px',
                marginTop: '40px',
                paddingTop: '20px',
                textAlign: 'center'
              }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>ហត្ថលេខាសាមីខ្លួន</div>
                  <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Resigning Employee</div>
                  <div style={{ height: '60px', borderBottom: '1px dashed #94a3b8', margin: '10px 20px' }}></div>
                  <div style={{ fontSize: '0.82rem' }}>កាលបរិច្ឆេទ: ......./......./...........</div>
                </div>

                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>អ្នកទទួលការងារបន្ត</div>
                  <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Handover Receiver</div>
                  <div style={{ height: '60px', borderBottom: '1px dashed #94a3b8', margin: '10px 20px' }}></div>
                  <div style={{ fontSize: '0.82rem' }}>កាលបរិច្ឆេទ: ......./......./...........</div>
                </div>

                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>ប្រធានគ្រប់គ្រង HR</div>
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
