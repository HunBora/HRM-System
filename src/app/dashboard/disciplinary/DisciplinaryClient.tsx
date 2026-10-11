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
}

interface DisciplinaryAction {
  id: string;
  employeeId: string;
  employee: EmployeeSimple;
  actionType: string;
  incidentDate: string;
  subject: string;
  reason: string;
  description?: string | null;
  actionTaken?: string | null;
  issuedBy?: string | null;
  status: string;
  documentUrl?: string | null;
  warningCount: number;
  createdAt: string;
  updatedAt: string;
}

interface Props {
  initialActions: DisciplinaryAction[];
  employees: EmployeeSimple[];
  departments: string[];
  userRole?: string;
}

const ACTION_TYPES: Record<string, { labelKh: string; labelEn: string; labelZh: string; bg: string; text: string; icon: string }> = {
  VERBAL_WARNING: {
    labelKh: 'ព្រមានផ្ទាល់មាត់',
    labelEn: 'Verbal Warning',
    labelZh: '口头警告',
    bg: '#fef3c7',
    text: '#d97706',
    icon: '🗣️'
  },
  WRITTEN_WARNING: {
    labelKh: 'លិខិតព្រមាន',
    labelEn: 'Written Warning',
    labelZh: '书面警告',
    bg: '#fee2e2',
    text: '#dc2626',
    icon: '⚠️'
  },
  SUSPENSION: {
    labelKh: 'ព្យួរការងារបណ្តោះអាសន្ន',
    labelEn: 'Suspension',
    labelZh: '停职',
    bg: '#f3e8ff',
    text: '#7e22ce',
    icon: '🛑'
  },
  TERMINATION: {
    labelKh: 'បញ្ឈប់ពីការងារ',
    labelEn: 'Termination',
    labelZh: '解雇/开除',
    bg: '#450a0a',
    text: '#fecaca',
    icon: '🚪'
  },
  OTHER: {
    labelKh: 'ផ្សេងៗ',
    labelEn: 'Other Action',
    labelZh: '其他处分',
    bg: '#f1f5f9',
    text: '#475569',
    icon: '📋'
  }
};

const REASON_TYPES: Record<string, { labelKh: string; labelEn: string }> = {
  ATTENDANCE: { labelKh: 'អវត្តមាន/មកយឺតញឹកញាប់', labelEn: 'Attendance / Tardiness' },
  MISCONDUCT: { labelKh: 'កំហុសប្រព្រឹត្តមិនគប្បី', labelEn: 'Misconduct / Insubordination' },
  NEGLIGENCE: { labelKh: 'ការធ្វេសប្រហែសក្នុងភារកិច្ច', labelEn: 'Gross Negligence' },
  POLICY_VIOLATION: { labelKh: 'ការបំពានបទបញ្ជាផ្ទៃក្នុង', labelEn: 'Company Policy Violation' },
  SAFETY: { labelKh: 'ការបំពានសុវត្ថិភាពការងារ', labelEn: 'Workplace Safety Breach' },
  OTHER: { labelKh: 'មូលហេតុផ្សេងៗ', labelEn: 'Other Reasons' }
};

const STATUS_CONFIG: Record<string, { labelKh: string; labelEn: string; bg: string; text: string }> = {
  ACTIVE: { labelKh: 'នៅមានប្រសិទ្ធភាព', labelEn: 'Active', bg: '#fef2f2', text: '#b91c1c' },
  RESOLVED: { labelKh: 'បានដោះស្រាយរួច', labelEn: 'Resolved', bg: '#dcfce7', text: '#15803d' },
  APPEALED: { labelKh: 'កំពុងប្តឹងតវ៉ា', labelEn: 'Appealed', bg: '#fef3c7', text: '#b45309' }
};

export default function DisciplinaryClient({ initialActions, employees, departments, userRole = 'ADMIN' }: Props) {
  const isHR = userRole === 'ADMIN' || userRole === 'HR_MANAGER' || userRole === 'HR';

  const [actions, setActions] = useState<DisciplinaryAction[]>(initialActions);
  const [loading, setLoading] = useState<boolean>(false);

  // Filters
  const [search, setSearch] = useState<string>('');
  const [actionTypeFilter, setActionTypeFilter] = useState<string>('ALL');
  const [departmentFilter, setDepartmentFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Modal States
  const [showModal, setShowModal] = useState<boolean>(false);
  const [editingAction, setEditingAction] = useState<DisciplinaryAction | null>(null);

  // Warning Letter Print / Preview Modal
  const [letterAction, setLetterAction] = useState<DisciplinaryAction | null>(null);

  // Form State
  const [form, setForm] = useState({
    employeeId: employees[0]?.id || '',
    actionType: 'WRITTEN_WARNING',
    incidentDate: new Date().toISOString().split('T')[0],
    subject: '',
    reason: 'POLICY_VIOLATION',
    description: '',
    actionTaken: '',
    issuedBy: 'ការិយាល័យធនធានមនុស្ស (HR Dept)',
    status: 'ACTIVE',
    warningCount: 1,
  });

  // Filtered Actions
  const filteredActions = useMemo(() => {
    return actions.filter(act => {
      const emp = act.employee;
      const fullName = `${emp.firstNameEn} ${emp.lastNameEn} ${emp.firstNameKh || ''} ${emp.lastNameKh || ''}`.toLowerCase();
      const matchesSearch = !search ||
        fullName.includes(search.toLowerCase()) ||
        emp.employeeId.toLowerCase().includes(search.toLowerCase()) ||
        act.subject.toLowerCase().includes(search.toLowerCase());

      const matchesType = actionTypeFilter === 'ALL' || act.actionType === actionTypeFilter;
      const matchesDept = departmentFilter === 'ALL' || emp.department === departmentFilter;
      const matchesStatus = statusFilter === 'ALL' || act.status === statusFilter;

      return matchesSearch && matchesType && matchesDept && matchesStatus;
    });
  }, [actions, search, actionTypeFilter, departmentFilter, statusFilter]);

  // Metrics
  const stats = useMemo(() => {
    let written = 0;
    let suspension = 0;
    let resolved = 0;
    actions.forEach(a => {
      if (a.actionType === 'WRITTEN_WARNING') written++;
      if (a.actionType === 'SUSPENSION') suspension++;
      if (a.status === 'RESOLVED') resolved++;
    });
    return {
      total: actions.length,
      written,
      suspension,
      resolved
    };
  }, [actions]);

  // Open Create Modal
  const handleOpenCreate = () => {
    setEditingAction(null);
    setForm({
      employeeId: employees[0]?.id || '',
      actionType: 'WRITTEN_WARNING',
      incidentDate: new Date().toISOString().split('T')[0],
      subject: '',
      reason: 'POLICY_VIOLATION',
      description: '',
      actionTaken: '',
      issuedBy: 'ការិយាល័យធនធានមនុស្ស (HR Dept)',
      status: 'ACTIVE',
      warningCount: 1,
    });
    setShowModal(true);
  };

  // Open Edit Modal
  const handleOpenEdit = (action: DisciplinaryAction) => {
    setEditingAction(action);
    setForm({
      employeeId: action.employeeId,
      actionType: action.actionType,
      incidentDate: new Date(action.incidentDate).toISOString().split('T')[0],
      subject: action.subject,
      reason: action.reason,
      description: action.description || '',
      actionTaken: action.actionTaken || '',
      issuedBy: action.issuedBy || '',
      status: action.status,
      warningCount: action.warningCount || 1,
    });
    setShowModal(true);
  };

  // Save (Create or Update)
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.employeeId || !form.subject || !form.incidentDate) {
      Swal.fire({
        icon: 'warning',
        title: 'សូមបំពេញព័ត៌មាន (Required)',
        text: 'សូមជ្រើសរើសបុគ្គលិក កាលបរិច្ឆេទ និងកម្មវត្ថុ'
      });
      return;
    }

    setLoading(true);
    try {
      const isEditing = Boolean(editingAction);
      const url = '/api/disciplinary';
      const method = isEditing ? 'PUT' : 'POST';
      const payload = isEditing ? { id: editingAction!.id, ...form } : form;

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to save');
      }

      const savedData: DisciplinaryAction = await res.json();

      if (isEditing) {
        setActions(prev => prev.map(a => a.id === savedData.id ? savedData : a));
      } else {
        setActions(prev => [savedData, ...prev]);
      }

      setShowModal(false);
      Swal.fire({
        icon: 'success',
        title: 'ជោគជ័យ (Saved)',
        text: isEditing ? 'បានកែប្រែកំណត់ត្រារួចរាល់' : 'បានបង្កើតកំណត់ត្រាវិន័យថ្មីដោយជោគជ័យ',
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

  // Delete Action
  const handleDelete = async (action: DisciplinaryAction) => {
    const result = await Swal.fire({
      title: 'តើអ្នកប្រាកដទេ? (Are you sure?)',
      text: `ចង់លុបកំណត់ត្រាវិន័យរបស់ ${action.employee.firstNameEn} (${action.subject}) មែនទេ?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'បាទ/ចាស លុប (Yes, Delete)',
      cancelButtonText: 'បោះបង់ (Cancel)'
    });

    if (!result.isConfirmed) return;

    try {
      const res = await fetch(`/api/disciplinary?id=${action.id}`, {
        method: 'DELETE'
      });

      if (res.ok) {
        setActions(prev => prev.filter(a => a.id !== action.id));
        Swal.fire({
          icon: 'success',
          title: 'បានលុប (Deleted)',
          text: 'កំណត់ត្រាវិន័យត្រូវបានលុបរួចរាល់',
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
      const exportData = filteredActions.map((act, index) => {
        const emp = act.employee;
        const actConf = ACTION_TYPES[act.actionType] || { labelKh: act.actionType, labelEn: act.actionType, labelZh: act.actionType };
        const reasonConf = REASON_TYPES[act.reason] || { labelKh: act.reason, labelEn: act.reason };
        const statusConf = STATUS_CONFIG[act.status] || { labelKh: act.status, labelEn: act.status };

        return {
          'ល.រ\nNo.\n序号': index + 1,
          'អត្តលេខ\nEmp ID\n工号': emp.employeeId,
          'គោត្តនាម-នាម\nFull Name\n姓名': `${emp.lastNameKh || ''} ${emp.firstNameKh || ''} (${emp.firstNameEn} ${emp.lastNameEn})`.trim(),
          'ផ្នែក\nDepartment\n部门': emp.department,
          'តួនាទី\nPosition\n职位': emp.position,
          'កាលបរិច្ឆេទកើតហេតុ\nIncident Date\n违纪日期': new Date(act.incidentDate).toISOString().split('T')[0],
          'ប្រភេទវិធានការ\nAction Type\n处分类型': `${actConf.labelKh} (${actConf.labelEn} / ${actConf.labelZh})`,
          'កម្មវត្ថុ\nSubject\n违纪主题': act.subject,
          'មូលហេតុ\nReason\n违纪原因': `${reasonConf.labelKh} (${reasonConf.labelEn})`,
          'លើកទី\nWarning Count\n第几次警告': `លើកទី ${act.warningCount}`,
          'វិធានការដោះស្រាយ\nAction Taken\n采取措施': act.actionTaken || '-',
          'អ្នកចេញលិខិត\nIssued By\n签发人': act.issuedBy || 'HR Dept',
          'ស្ថានភាព\nStatus\n状态': `${statusConf.labelKh} (${statusConf.labelEn})`,
        };
      });

      const ws = XLSX.utils.json_to_sheet(exportData);
      ws['!cols'] = autoFitColumns(exportData);

      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Disciplinary_Records');
      XLSX.writeFile(wb, `Disciplinary_Actions_${new Date().toISOString().split('T')[0]}.xlsx`);

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
          <span style={{ fontSize: '30px' }}>⚖️</span>
          <div>
            <h1 style={{ margin: 0, fontSize: '1.6rem', fontWeight: 800, color: '#0f172a' }}>
              វិធានការវិន័យ និងលិខិតព្រមាន
            </h1>
            <p style={{ margin: '4px 0 0 0', color: '#64748b', fontSize: '0.88rem' }}>
              Disciplinary Actions & Warning Letters • 纪律处分与警告信管理
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          {isHR && (
            <button
              onClick={handleOpenCreate}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                background: 'linear-gradient(135deg, #ef4444 0%, #b91c1c 100%)',
                color: '#ffffff',
                border: 'none',
                borderRadius: '10px',
                padding: '10px 18px',
                fontWeight: 700,
                fontSize: '0.9rem',
                cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(239, 68, 68, 0.25)'
              }}
            >
              <span>➕</span>
              <div style={{ textAlign: 'left', lineHeight: 1.2 }}>
                <div>កត់ត្រាវិន័យថ្មី</div>
                <div style={{ fontSize: '0.7rem', opacity: 0.85 }}>New Disciplinary • 新增处分</div>
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
        {/* Card 1: Total Cases */}
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
            <div style={{ fontWeight: 800, fontSize: '0.95rem', color: '#0f172a' }}>ករណីសរុប</div>
            <div style={{ fontSize: '0.72rem', color: '#64748b' }}>Total Cases • 总案件数</div>
            <div style={{ fontSize: '1.7rem', fontWeight: 900, color: '#0284c7', marginTop: '4px' }}>
              {stats.total}
            </div>
          </div>
        </div>

        {/* Card 2: Written Warnings */}
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
            background: '#fee2e2',
            color: '#dc2626',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '24px'
          }}>
            ⚠️
          </div>
          <div>
            <div style={{ fontWeight: 800, fontSize: '0.95rem', color: '#0f172a' }}>លិខិតព្រមាន</div>
            <div style={{ fontSize: '0.72rem', color: '#64748b' }}>Written Warnings • 书面警告</div>
            <div style={{ fontSize: '1.7rem', fontWeight: 900, color: '#dc2626', marginTop: '4px' }}>
              {stats.written}
            </div>
          </div>
        </div>

        {/* Card 3: Suspensions */}
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
            🛑
          </div>
          <div>
            <div style={{ fontWeight: 800, fontSize: '0.95rem', color: '#0f172a' }}>ព្យួរការងារ</div>
            <div style={{ fontSize: '0.72rem', color: '#64748b' }}>Suspensions • 停职处分</div>
            <div style={{ fontSize: '1.7rem', fontWeight: 900, color: '#7e22ce', marginTop: '4px' }}>
              {stats.suspension}
            </div>
          </div>
        </div>

        {/* Card 4: Resolved */}
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
            color: '#16a34a',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '24px'
          }}>
            ✅
          </div>
          <div>
            <div style={{ fontWeight: 800, fontSize: '0.95rem', color: '#0f172a' }}>បានដោះស្រាយ</div>
            <div style={{ fontSize: '0.72rem', color: '#64748b' }}>Resolved • 已解决</div>
            <div style={{ fontSize: '1.7rem', fontWeight: 900, color: '#16a34a', marginTop: '4px' }}>
              {stats.resolved}
            </div>
          </div>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: '16px',
        alignItems: 'center',
        background: '#ffffff',
        padding: '16px 20px',
        borderRadius: '14px',
        border: '1px solid #f1f5f9'
      }}>
        {/* Search */}
        <div style={{ flex: '1 1 240px', position: 'relative' }}>
          <input
            type="text"
            placeholder="ស្វែងរកតាមឈ្មោះ, អត្តលេខ ឬកម្មវត្ថុ (Search)..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{
              width: '100%',
              padding: '10px 14px 10px 38px',
              borderRadius: '10px',
              border: '1px solid #cbd5e1',
              fontSize: '0.9rem',
              outline: 'none',
              boxSizing: 'border-box'
            }}
          />
          <span style={{ position: 'absolute', left: '12px', top: '10px', color: '#94a3b8' }}>🔍</span>
        </div>

        {/* Action Type Filter */}
        <div style={{ minWidth: '180px' }}>
          <select
            value={actionTypeFilter}
            onChange={e => setActionTypeFilter(e.target.value)}
            style={{
              width: '100%',
              padding: '10px 14px',
              borderRadius: '10px',
              border: '1px solid #cbd5e1',
              fontSize: '0.88rem',
              background: '#ffffff',
              outline: 'none',
              fontWeight: 600
            }}
          >
            <option value="ALL">⚖️ គ្រប់ប្រភេទវិធានការ (All Types)</option>
            {Object.entries(ACTION_TYPES).map(([k, v]) => (
              <option key={k} value={k}>{v.icon} {v.labelKh} ({v.labelEn})</option>
            ))}
          </select>
        </div>

        {/* Department Filter */}
        <div style={{ minWidth: '180px' }}>
          <select
            value={departmentFilter}
            onChange={e => setDepartmentFilter(e.target.value)}
            style={{
              width: '100%',
              padding: '10px 14px',
              borderRadius: '10px',
              border: '1px solid #cbd5e1',
              fontSize: '0.88rem',
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
            onChange={e => setStatusFilter(e.target.value)}
            style={{
              width: '100%',
              padding: '10px 14px',
              borderRadius: '10px',
              border: '1px solid #cbd5e1',
              fontSize: '0.88rem',
              background: '#ffffff',
              outline: 'none',
              fontWeight: 600
            }}
          >
            <option value="ALL">📊 គ្រប់ស្ថានភាព (All Status)</option>
            {Object.entries(STATUS_CONFIG).map(([k, v]) => (
              <option key={k} value={k}>{v.labelKh} ({v.labelEn})</option>
            ))}
          </select>
        </div>
      </div>

      {/* Disciplinary Table (3-Languages on All TH) */}
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
                <th style={{ padding: '14px 16px', width: '60px' }}>
                  <div style={{ fontWeight: 800, color: '#0f172a', fontSize: '0.9rem' }}>ល.រ</div>
                  <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600 }}>No.</div>
                  <div style={{ fontSize: '0.68rem', color: '#94a3b8' }}>序号</div>
                </th>

                {/* 2: Employee */}
                <th style={{ padding: '14px 16px', minWidth: '220px' }}>
                  <div style={{ fontWeight: 800, color: '#0f172a', fontSize: '0.9rem' }}>ព័ត៌មានបុគ្គលិក</div>
                  <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600 }}>Employee Name & ID</div>
                  <div style={{ fontSize: '0.68rem', color: '#94a3b8' }}>员工信息</div>
                </th>

                {/* 3: Incident Date */}
                <th style={{ padding: '14px 16px', minWidth: '130px' }}>
                  <div style={{ fontWeight: 800, color: '#0f172a', fontSize: '0.9rem' }}>កាលបរិច្ឆេទ</div>
                  <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600 }}>Incident Date</div>
                  <div style={{ fontSize: '0.68rem', color: '#94a3b8' }}>违纪日期</div>
                </th>

                {/* 4: Action Type */}
                <th style={{ padding: '14px 16px', minWidth: '180px' }}>
                  <div style={{ fontWeight: 800, color: '#0f172a', fontSize: '0.9rem' }}>ប្រភេទវិធានការ</div>
                  <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600 }}>Action Type</div>
                  <div style={{ fontSize: '0.68rem', color: '#94a3b8' }}>处分类型</div>
                </th>

                {/* 5: Subject & Reason */}
                <th style={{ padding: '14px 16px', minWidth: '240px' }}>
                  <div style={{ fontWeight: 800, color: '#0f172a', fontSize: '0.9rem' }}>កម្មវត្ថុ និងមូលហេតុ</div>
                  <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600 }}>Subject & Violation</div>
                  <div style={{ fontSize: '0.68rem', color: '#94a3b8' }}>处分主题与原因</div>
                </th>

                {/* 6: Warning Level */}
                <th style={{ padding: '14px 16px', minWidth: '100px', textAlign: 'center' }}>
                  <div style={{ fontWeight: 800, color: '#0f172a', fontSize: '0.9rem' }}>លើកទី</div>
                  <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600 }}>Level</div>
                  <div style={{ fontSize: '0.68rem', color: '#94a3b8' }}>警告次数</div>
                </th>

                {/* 7: Status */}
                <th style={{ padding: '14px 16px', minWidth: '130px' }}>
                  <div style={{ fontWeight: 800, color: '#0f172a', fontSize: '0.9rem' }}>ស្ថានភាព</div>
                  <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600 }}>Status</div>
                  <div style={{ fontSize: '0.68rem', color: '#94a3b8' }}>状态</div>
                </th>

                {/* 8: Actions */}
                <th style={{ padding: '14px 16px', minWidth: '160px', textAlign: 'right' }}>
                  <div style={{ fontWeight: 800, color: '#0f172a', fontSize: '0.9rem' }}>សកម្មភាព</div>
                  <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600 }}>Actions</div>
                  <div style={{ fontSize: '0.68rem', color: '#94a3b8' }}>操作</div>
                </th>
              </tr>
            </thead>

            <tbody>
              {filteredActions.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ padding: '48px', textAlign: 'center', color: '#64748b' }}>
                    <div style={{ fontSize: '36px', marginBottom: '8px' }}>🛡️</div>
                    <div style={{ fontWeight: 700, fontSize: '1.1rem' }}>មិនមានកំណត់ត្រាវិន័យត្រូវបង្ហាញទេ</div>
                    <div style={{ fontSize: '0.85rem' }}>No disciplinary records found</div>
                  </td>
                </tr>
              ) : (
                filteredActions.map((act, index) => {
                  const emp = act.employee;
                  const typeConf = ACTION_TYPES[act.actionType] || { labelKh: act.actionType, labelEn: act.actionType, labelZh: act.actionType, bg: '#f1f5f9', text: '#475569', icon: '📋' };
                  const statusConf = STATUS_CONFIG[act.status] || { labelKh: act.status, labelEn: act.status, bg: '#f1f5f9', text: '#475569' };
                  const reasonConf = REASON_TYPES[act.reason] || { labelKh: act.reason, labelEn: act.reason };

                  return (
                    <tr
                      key={act.id}
                      style={{
                        borderBottom: '1px solid #f1f5f9',
                        background: index % 2 === 0 ? '#ffffff' : '#fcfcfd',
                        transition: 'background 0.15s ease'
                      }}
                    >
                      {/* Index */}
                      <td style={{ padding: '14px 16px', fontWeight: 700, color: '#64748b', fontSize: '0.9rem' }}>
                        {index + 1}
                      </td>

                      {/* Employee Info */}
                      <td style={{ padding: '14px 16px' }}>
                        <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.92rem' }}>
                          {emp.lastNameKh || ''} {emp.firstNameKh || ''} {(!emp.lastNameKh && !emp.firstNameKh) && `${emp.firstNameEn} ${emp.lastNameEn}`}
                        </div>
                        <div style={{ fontSize: '0.78rem', color: '#4f46e5', fontWeight: 600 }}>
                          {emp.employeeId} • {emp.position}
                        </div>
                        <div style={{ fontSize: '0.72rem', color: '#64748b' }}>
                          {emp.department}
                        </div>
                      </td>

                      {/* Incident Date */}
                      <td style={{ padding: '14px 16px', fontSize: '0.88rem', fontWeight: 600, color: '#334155' }}>
                        {new Date(act.incidentDate).toISOString().split('T')[0]}
                      </td>

                      {/* Action Type Badge */}
                      <td style={{ padding: '14px 16px' }}>
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          padding: '6px 10px',
                          borderRadius: '8px',
                          background: typeConf.bg,
                          color: typeConf.text,
                          fontWeight: 700,
                          fontSize: '0.8rem',
                          border: `1px solid ${typeConf.text}33`
                        }}>
                          <span>{typeConf.icon}</span>
                          <span>{typeConf.labelKh}</span>
                        </span>
                      </td>

                      {/* Subject & Reason */}
                      <td style={{ padding: '14px 16px' }}>
                        <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.9rem' }}>
                          {act.subject}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: '#b45309', fontWeight: 600 }}>
                          {reasonConf.labelKh} ({reasonConf.labelEn})
                        </div>
                        {act.description && (
                          <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '2px', maxWidth: '300px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {act.description}
                          </div>
                        )}
                      </td>

                      {/* Warning Level */}
                      <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                        <span style={{
                          display: 'inline-block',
                          padding: '4px 8px',
                          borderRadius: '6px',
                          background: '#f8fafc',
                          border: '1px solid #cbd5e1',
                          fontWeight: 800,
                          fontSize: '0.82rem',
                          color: '#1e293b'
                        }}>
                          លើកទី {act.warningCount}
                        </span>
                      </td>

                      {/* Status */}
                      <td style={{ padding: '14px 16px' }}>
                        <span style={{
                          display: 'inline-block',
                          padding: '4px 8px',
                          borderRadius: '6px',
                          background: statusConf.bg,
                          color: statusConf.text,
                          fontWeight: 700,
                          fontSize: '0.78rem'
                        }}>
                          {statusConf.labelKh}
                        </span>
                      </td>

                      {/* Actions */}
                      <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                          {/* Print / Preview Warning Letter */}
                          <button
                            onClick={() => setLetterAction(act)}
                            title="មើល និងបោះពុម្ពលិខិតព្រមាន (Print Warning Letter)"
                            style={{
                              background: '#f0fdf4',
                              border: '1px solid #bbf7d0',
                              color: '#16a34a',
                              padding: '6px 10px',
                              borderRadius: '8px',
                              cursor: 'pointer',
                              fontWeight: 700,
                              fontSize: '0.8rem'
                            }}
                          >
                            📄 លិខិត
                          </button>

                          {isHR && (
                            <>
                              <button
                                onClick={() => handleOpenEdit(act)}
                                title="កែប្រែ (Edit)"
                                style={{
                                  background: '#f8fafc',
                                  border: '1px solid #cbd5e1',
                                  color: '#334155',
                                  padding: '6px 10px',
                                  borderRadius: '8px',
                                  cursor: 'pointer',
                                  fontSize: '0.85rem'
                                }}
                              >
                                ✏️
                              </button>
                              <button
                                onClick={() => handleDelete(act)}
                                title="លុប (Delete)"
                                style={{
                                  background: '#fef2f2',
                                  border: '1px solid #fecaca',
                                  color: '#dc2626',
                                  padding: '6px 10px',
                                  borderRadius: '8px',
                                  cursor: 'pointer',
                                  fontSize: '0.85rem'
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

      {/* Add / Edit Disciplinary Modal */}
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
            maxHeight: '90vh',
            display: 'flex',
            flexDirection: 'column'
          }}>
            {/* Modal Header */}
            <div style={{
              background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
              color: '#ffffff',
              padding: '20px 24px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800 }}>
                  {editingAction ? 'កែប្រែកំណត់ត្រាវិន័យ' : 'កត់ត្រាវិធានការវិន័យថ្មី'}
                </h3>
                <div style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: '4px' }}>
                  {editingAction ? 'Edit Disciplinary Record' : 'Record New Disciplinary Action • 记录纪律处分'}
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
                  បុគ្គលិកដែលប្រព្រឹត្តខុស (Employee) *
                </label>
                <select
                  value={form.employeeId}
                  onChange={e => setForm({ ...form, employeeId: e.target.value })}
                  disabled={Boolean(editingAction)}
                  required
                  style={{
                    width: '100%',
                    padding: '10px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    fontSize: '0.9rem',
                    background: editingAction ? '#f8fafc' : '#ffffff'
                  }}
                >
                  {employees.map(emp => (
                    <option key={emp.id} value={emp.id}>
                      {emp.employeeId} - {emp.firstNameEn} {emp.lastNameEn} ({emp.department} - {emp.position})
                    </option>
                  ))}
                </select>
              </div>

              {/* Action Type & Warning Level */}
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '6px', fontWeight: 700, fontSize: '0.88rem', color: '#1e293b' }}>
                    ប្រភេទវិធានការ (Action Type) *
                  </label>
                  <select
                    value={form.actionType}
                    onChange={e => setForm({ ...form, actionType: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '10px',
                      borderRadius: '8px',
                      border: '1px solid #cbd5e1',
                      fontSize: '0.9rem'
                    }}
                  >
                    {Object.entries(ACTION_TYPES).map(([k, v]) => (
                      <option key={k} value={k}>
                        {v.icon} {v.labelKh} ({v.labelEn})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '6px', fontWeight: 700, fontSize: '0.88rem', color: '#1e293b' }}>
                    លើកទី (Level)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={form.warningCount}
                    onChange={e => setForm({ ...form, warningCount: parseInt(e.target.value) || 1 })}
                    style={{
                      width: '100%',
                      padding: '10px',
                      borderRadius: '8px',
                      border: '1px solid #cbd5e1',
                      fontSize: '0.9rem',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
              </div>

              {/* Incident Date & Reason */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '6px', fontWeight: 700, fontSize: '0.88rem', color: '#1e293b' }}>
                    កាលបរិច្ឆេទកើតហេតុ (Incident Date) *
                  </label>
                  <input
                    type="date"
                    value={form.incidentDate}
                    onChange={e => setForm({ ...form, incidentDate: e.target.value })}
                    required
                    style={{
                      width: '100%',
                      padding: '10px',
                      borderRadius: '8px',
                      border: '1px solid #cbd5e1',
                      fontSize: '0.9rem',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '6px', fontWeight: 700, fontSize: '0.88rem', color: '#1e293b' }}>
                    មូលហេតុនៃកំហុស (Reason Category) *
                  </label>
                  <select
                    value={form.reason}
                    onChange={e => setForm({ ...form, reason: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '10px',
                      borderRadius: '8px',
                      border: '1px solid #cbd5e1',
                      fontSize: '0.9rem'
                    }}
                  >
                    {Object.entries(REASON_TYPES).map(([k, v]) => (
                      <option key={k} value={k}>
                        {v.labelKh} ({v.labelEn})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Subject */}
              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontWeight: 700, fontSize: '0.88rem', color: '#1e293b' }}>
                  កម្មវត្ថុ (Subject / Violation Title) *
                </label>
                <input
                  type="text"
                  placeholder="ឧ. អវត្តមានគ្មានការអនុញ្ញាត ៣ ថ្ងៃជាប់គ្នា..."
                  value={form.subject}
                  onChange={e => setForm({ ...form, subject: e.target.value })}
                  required
                  style={{
                    width: '100%',
                    padding: '10px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    fontSize: '0.9rem',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              {/* Description */}
              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontWeight: 700, fontSize: '0.88rem', color: '#1e293b' }}>
                  សេចក្តីពិពណ៌នានៃហេតុការណ៍ (Incident Description)
                </label>
                <textarea
                  rows={3}
                  placeholder="រៀបរាប់ដំណើររឿងលម្អិតនៃកំហុសឆ្គង ឬការបំពានច្បាប់..."
                  value={form.description}
                  onChange={e => setForm({ ...form, description: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '10px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    fontSize: '0.9rem',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              {/* Action Taken & Issued By */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '6px', fontWeight: 700, fontSize: '0.88rem', color: '#1e293b' }}>
                    វិធានការដោះស្រាយ (Action Taken)
                  </label>
                  <input
                    type="text"
                    placeholder="ឧ. ចេញលិខិតព្រមានលើកទី ១..."
                    value={form.actionTaken}
                    onChange={e => setForm({ ...form, actionTaken: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '10px',
                      borderRadius: '8px',
                      border: '1px solid #cbd5e1',
                      fontSize: '0.9rem',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '6px', fontWeight: 700, fontSize: '0.88rem', color: '#1e293b' }}>
                    អ្នកចេញលិខិត (Issued By)
                  </label>
                  <input
                    type="text"
                    value={form.issuedBy}
                    onChange={e => setForm({ ...form, issuedBy: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '10px',
                      borderRadius: '8px',
                      border: '1px solid #cbd5e1',
                      fontSize: '0.9rem',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
              </div>

              {/* Status */}
              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontWeight: 700, fontSize: '0.88rem', color: '#1e293b' }}>
                  ស្ថានភាព (Status)
                </label>
                <select
                  value={form.status}
                  onChange={e => setForm({ ...form, status: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '10px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    fontSize: '0.9rem'
                  }}
                >
                  {Object.entries(STATUS_CONFIG).map(([k, v]) => (
                    <option key={k} value={k}>
                      {v.labelKh} ({v.labelEn})
                    </option>
                  ))}
                </select>
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
                    background: 'linear-gradient(135deg, #ef4444 0%, #b91c1c 100%)',
                    color: '#ffffff',
                    fontWeight: 700,
                    cursor: 'pointer',
                    boxShadow: '0 2px 8px rgba(239, 68, 68, 0.3)'
                  }}
                >
                  {loading ? 'កំពុងរក្សាទុក...' : '💾 រក្សាទុក (Save)'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Warning Letter Printable Modal */}
      {letterAction && (
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
                <span>ទម្រង់លិខិតព្រមានផ្លូវការ (Official Warning Letter Slip)</span>
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
                  onClick={() => setLetterAction(null)}
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

            {/* Printable Document Body */}
            <div id="printable-warning-letter" style={{
              padding: '40px',
              overflowY: 'auto',
              background: '#ffffff',
              color: '#000000',
              fontFamily: 'serif',
              lineHeight: 1.6
            }}>
              {/* National Header */}
              <div style={{ textAlign: 'center', marginBottom: '28px' }}>
                <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#1e3a8a' }}>
                  ព្រះរាជាណាចក្រកម្ពុជា
                </div>
                <div style={{ fontSize: '1rem', fontWeight: 700, color: '#1e3a8a' }}>
                  ជាតិ សាសនា ព្រះមហាក្សត្រ
                </div>
                <div style={{ fontSize: '0.9rem', fontStyle: 'italic', color: '#64748b', marginTop: '2px' }}>
                  KINGDOM OF CAMBODIA • NATION RELIGION KING
                </div>
                <div style={{ letterSpacing: '4px', fontSize: '12px', marginTop: '4px' }}>❖ ❖ ❖</div>
              </div>

              {/* Company Info */}
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '2px solid #000', paddingBottom: '12px', marginBottom: '24px' }}>
                <div>
                  <div style={{ fontWeight: 800, fontSize: '1.1rem' }}>ក្រុមហ៊ុន / ស្ថាប័ន (COMPANY HRM SYSTEM)</div>
                  <div style={{ fontSize: '0.85rem' }}>ការិយាល័យធនធានមនុស្ស (Human Resources Department)</div>
                </div>
                <div style={{ textAlign: 'right', fontSize: '0.85rem' }}>
                  <div>កាលបរិច្ឆេទ: {new Date().toISOString().split('T')[0]}</div>
                  <div>លេខយោង: HR-WL-{new Date().getFullYear()}-{letterAction.employee.employeeId}</div>
                </div>
              </div>

              {/* Letter Title */}
              <div style={{ textAlign: 'center', margin: '24px 0' }}>
                <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 900, textDecoration: 'underline' }}>
                  លិខិតព្រមានជាលាយលក្ខណ៍អក្សរ
                </h2>
                <div style={{ fontSize: '1rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', marginTop: '4px' }}>
                  WRITTEN WARNING LETTER (លើកទី {letterAction.warningCount})
                </div>
              </div>

              {/* Employee Particulars Table */}
              <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '20px', border: '1px solid #cbd5e1' }}>
                <tbody>
                  <tr style={{ background: '#f8fafc' }}>
                    <td style={{ padding: '8px 12px', fontWeight: 700, width: '25%', border: '1px solid #cbd5e1' }}>គោត្តនាម និងនាម / Name:</td>
                    <td style={{ padding: '8px 12px', border: '1px solid #cbd5e1' }}>
                      {letterAction.employee.lastNameKh || ''} {letterAction.employee.firstNameKh || ''} ({letterAction.employee.firstNameEn} {letterAction.employee.lastNameEn})
                    </td>
                    <td style={{ padding: '8px 12px', fontWeight: 700, width: '20%', border: '1px solid #cbd5e1' }}>អត្តលេខ / Emp ID:</td>
                    <td style={{ padding: '8px 12px', border: '1px solid #cbd5e1', fontWeight: 700, color: '#1e40af' }}>
                      {letterAction.employee.employeeId}
                    </td>
                  </tr>
                  <tr>
                    <td style={{ padding: '8px 12px', fontWeight: 700, border: '1px solid #cbd5e1' }}>ផ្នែក / Department:</td>
                    <td style={{ padding: '8px 12px', border: '1px solid #cbd5e1' }}>{letterAction.employee.department}</td>
                    <td style={{ padding: '8px 12px', fontWeight: 700, border: '1px solid #cbd5e1' }}>តួនាទី / Position:</td>
                    <td style={{ padding: '8px 12px', border: '1px solid #cbd5e1' }}>{letterAction.employee.position}</td>
                  </tr>
                </tbody>
              </table>

              {/* Details of Violation */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', fontSize: '0.95rem' }}>
                <div>
                  <strong>១. កាលបរិច្ឆេទកើតហេតុ (Incident Date):</strong> {new Date(letterAction.incidentDate).toISOString().split('T')[0]}
                </div>
                <div>
                  <strong>២. ប្រភេទកំហុសឆ្គង (Violation Type):</strong> {REASON_TYPES[letterAction.reason]?.labelKh || letterAction.reason} ({REASON_TYPES[letterAction.reason]?.labelEn || ''})
                </div>
                <div>
                  <strong>៣. កម្មវត្ថុ (Subject):</strong> {letterAction.subject}
                </div>
                <div>
                  <strong>៤. សេចក្តីពិពណ៌នាអំពីកំហុសឆ្គង (Details of Misconduct):</strong>
                  <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '6px', border: '1px solid #e2e8f0', marginTop: '6px' }}>
                    {letterAction.description || 'បានប្រព្រឹត្តការបំពានលើបទបញ្ជាផ្ទៃក្នុងរបស់ក្រុមហ៊ុន និងច្បាប់ការងារជាធរមាន។'}
                  </div>
                </div>
                <div>
                  <strong>៥. វិធានការវិន័យ និងការកែលម្អ (Corrective Action & Consequences):</strong>
                  <div style={{ background: '#fff1f2', padding: '12px', borderRadius: '6px', border: '1px solid #fecaca', marginTop: '6px', color: '#991b1b' }}>
                    {letterAction.actionTaken || `នេះជាលិខិតព្រមានលើកទី ${letterAction.warningCount}។ ប្រសិនបើនៅតែបន្តប្រព្រឹត្តកំហុសដដែល ឬកំហុសផ្សេងទៀត ក្រុមហ៊ុននឹងចាត់វិធានការវិន័យធ្ងន់ធ្ងរជាងនេះ រហូតដល់ការបញ្ឈប់ពីការងារដោយគ្មានសំណងស្របតាមច្បាប់ការងារ។`}
                  </div>
                </div>
              </div>

              {/* Signatures */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: '20px',
                marginTop: '48px',
                paddingTop: '20px',
                textAlign: 'center'
              }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>ហត្ថលេខាសាមីខ្លួន</div>
                  <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Employee Acknowledgment</div>
                  <div style={{ height: '70px', borderBottom: '1px dashed #94a3b8', margin: '10px 20px' }}></div>
                  <div style={{ fontSize: '0.82rem' }}>កាលបរិច្ឆេទ: ......./......./...........</div>
                </div>

                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>ប្រធានផ្នែក</div>
                  <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Head of Department</div>
                  <div style={{ height: '70px', borderBottom: '1px dashed #94a3b8', margin: '10px 20px' }}></div>
                  <div style={{ fontSize: '0.82rem' }}>កាលបរិច្ឆេទ: ......./......./...........</div>
                </div>

                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>អ្នកគ្រប់គ្រងធនធានមនុស្ស</div>
                  <div style={{ fontSize: '0.75rem', color: '#64748b' }}>HR Manager / Director</div>
                  <div style={{ height: '70px', borderBottom: '1px dashed #94a3b8', margin: '10px 20px' }}></div>
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
