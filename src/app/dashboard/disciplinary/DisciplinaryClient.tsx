'use client';

import React, { useState, useMemo, useEffect, useRef } from 'react';
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
  companySettings?: {
    companyName?: string;
    logoUrl?: string | null;
  } | null;
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

const REASON_TYPES: Record<string, { labelKh: string; labelEn: string; labelZh: string }> = {
  ATTENDANCE: { labelKh: 'អវត្តមាន/មកយឺតញឹកញាប់', labelEn: 'Attendance / Tardiness', labelZh: '旷工 / 迟到早退' },
  MISCONDUCT: { labelKh: 'កំហុសប្រព្រឹត្តមិនគប្បី', labelEn: 'Misconduct / Insubordination', labelZh: '品行不端 / 不服从管理' },
  NEGLIGENCE: { labelKh: 'ការធ្វេសប្រហែសក្នុងភារកិច្ច', labelEn: 'Gross Negligence', labelZh: '重大工作疏忽' },
  POLICY_VIOLATION: { labelKh: 'ការបំពានបទបញ្ជាផ្ទៃក្នុង', labelEn: 'Company Policy Violation', labelZh: '违反公司内部规章' },
  SAFETY: { labelKh: 'ការបំពានសុវត្ថិភាពការងារ', labelEn: 'Workplace Safety Breach', labelZh: '违反车间安全操作规程' },
  OTHER: { labelKh: 'មូលហេតុផ្សេងៗ', labelEn: 'Other Reasons', labelZh: '其他违纪原因' }
};

const STATUS_CONFIG: Record<string, { labelKh: string; labelEn: string; bg: string; text: string }> = {
  ACTIVE: { labelKh: 'នៅមានប្រសិទ្ធភាព', labelEn: 'Active', bg: '#fef2f2', text: '#b91c1c' },
  RESOLVED: { labelKh: 'បានដោះស្រាយរួច', labelEn: 'Resolved', bg: '#dcfce7', text: '#15803d' },
  APPEALED: { labelKh: 'កំពុងប្តឹងតវ៉ា', labelEn: 'Appealed', bg: '#fef3c7', text: '#b45309' }
};

export default function DisciplinaryClient({ initialActions, employees, departments, userRole = 'ADMIN', companySettings }: Props) {
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

  // Warning Letter Print / Preview Modal (Trilingual Factory Standard)
  const [letterAction, setLetterAction] = useState<DisciplinaryAction | null>(null);
  const [slipCompanyKh, setSlipCompanyKh] = useState<string>('ក្រុមហ៊ុន អេវើហ្គ្រីន ស្ព័តធីង ហ្គូដ (ខេមបូឌា) ឯ.ក');
  const [slipCompanyZh, setSlipCompanyZh] = useState<string>('長青戶外用品（柬埔寨）有限公司');
  const [slipCompanyEn, setSlipCompanyEn] = useState<string>('EVERGREEN SPORTING GOODS (CAMBODIA) CO., LTD.');
  const [slipLogoUrl, setSlipLogoUrl] = useState<string>('');
  const [slipLogoType, setSlipLogoType] = useState<'image' | 'evergreen' | 'factory'>('evergreen');
  const [slipSelectedLevel, setSlipSelectedLevel] = useState<string>('minor-2');
  const [slipHireDate, setSlipHireDate] = useState<string>('');
  const [slipLine, setSlipLine] = useState<string>('Line 01');
  const [isEditingSlipSettings, setIsEditingSlipSettings] = useState<boolean>(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string>('');

  const logoFileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('FACTORY_DISC_SLIP_SETTINGS');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.companyKh !== undefined) setSlipCompanyKh(parsed.companyKh);
        if (parsed.companyZh !== undefined) setSlipCompanyZh(parsed.companyZh);
        if (parsed.companyEn !== undefined) setSlipCompanyEn(parsed.companyEn);
        if (parsed.logoUrl !== undefined) setSlipLogoUrl(parsed.logoUrl);
        if (parsed.logoType) setSlipLogoType(parsed.logoType);
      } else if (companySettings) {
        if (companySettings.logoUrl) {
          setSlipLogoUrl(companySettings.logoUrl);
          setSlipLogoType('image');
        }
        if (companySettings.companyName) {
          setSlipCompanyEn(companySettings.companyName);
          setSlipCompanyKh(`ក្រុមហ៊ុន ${companySettings.companyName}`);
          setSlipCompanyZh(companySettings.companyName);
        }
      }
    } catch (e) {
      console.error('Failed to load warning slip settings:', e);
    }
  }, [companySettings]);

  const saveSlipSettingsToStorage = (
    kh = slipCompanyKh,
    zh = slipCompanyZh,
    en = slipCompanyEn,
    logo = slipLogoUrl,
    type = slipLogoType
  ) => {
    try {
      localStorage.setItem('FACTORY_DISC_SLIP_SETTINGS', JSON.stringify({
        companyKh: kh,
        companyZh: zh,
        companyEn: en,
        logoUrl: logo,
        logoType: type,
      }));
      setSaveSuccessMsg('បានរក្សាទុក ✓');
      setTimeout(() => setSaveSuccessMsg(''), 3000);
    } catch (e) {
      console.error('Failed to save slip settings:', e);
    }
  };

  const handleLogoFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      alert('សូមជ្រើសរើសឯកសារជារូបភាព (PNG, JPG, SVG, WEBP)');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      setSlipLogoUrl(result);
      setSlipLogoType('image');
      saveSlipSettingsToStorage(slipCompanyKh, slipCompanyZh, slipCompanyEn, result, 'image');
    };
    reader.readAsDataURL(file);
  };

  const handleApplyPreset = (preset: 'system' | 'evergreen' | 'factory') => {
    if (preset === 'system') {
      const sysName = companySettings?.companyName || 'HRM System';
      const sysLogo = companySettings?.logoUrl || '';
      const kh = `ក្រុមហ៊ុន ${sysName}`;
      const zh = sysName;
      const en = sysName;
      const type = sysLogo ? 'image' : 'factory';
      setSlipCompanyKh(kh);
      setSlipCompanyZh(zh);
      setSlipCompanyEn(en);
      setSlipLogoUrl(sysLogo);
      setSlipLogoType(type);
      saveSlipSettingsToStorage(kh, zh, en, sysLogo, type);
    } else if (preset === 'evergreen') {
      const kh = 'ក្រុមហ៊ុន អេវើហ្គ្រីន ស្ព័តធីង ហ្គូដ (ខេមបូឌា) ឯ.ក';
      const zh = '長青戶外用品（柬埔寨）有限公司';
      const en = 'EVERGREEN SPORTING GOODS (CAMBODIA) CO., LTD.';
      setSlipCompanyKh(kh);
      setSlipCompanyZh(zh);
      setSlipCompanyEn(en);
      setSlipLogoType('evergreen');
      setSlipLogoUrl('');
      saveSlipSettingsToStorage(kh, zh, en, '', 'evergreen');
    } else {
      const kh = 'ក្រុមហ៊ុន / រោងចក្រ ស្តង់ដារកាត់ដេរ (ខេមបូឌា) ឯ.ក';
      const zh = '标准成衣制造（柬埔寨）有限公司';
      const en = 'STANDARD GARMENT MANUFACTURING (CAMBODIA) CO., LTD.';
      setSlipCompanyKh(kh);
      setSlipCompanyZh(zh);
      setSlipCompanyEn(en);
      setSlipLogoType('factory');
      setSlipLogoUrl('');
      saveSlipSettingsToStorage(kh, zh, en, '', 'factory');
    }
  };

  const openWarningLetterSlip = (act: DisciplinaryAction) => {
    setLetterAction(act);
    if (act.actionType === 'TERMINATION') {
      setSlipSelectedLevel('serious');
    } else if (act.actionType === 'VERBAL_WARNING') {
      setSlipSelectedLevel('minor-1');
    } else if (act.actionType === 'WRITTEN_WARNING') {
      if (act.warningCount === 1) setSlipSelectedLevel('minor-2');
      else if (act.warningCount === 2) setSlipSelectedLevel('minor-3');
      else setSlipSelectedLevel('minor-4');
    } else {
      setSlipSelectedLevel('moderate-1');
    }
    setSlipLine(act.employee.line || 'Line 01');
    const d = new Date(act.incidentDate);
    // hire date default: 1 year prior or clean formatted date
    const hireEst = new Date(d);
    hireEst.setFullYear(d.getFullYear() - 1);
    setSlipHireDate(hireEst.toISOString().split('T')[0]);
  };

  const handlePrintWarningSlip = () => {
    const printContent = document.getElementById('printable-warning-letter');
    if (!printContent) {
      window.print();
      return;
    }
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      window.print();
      return;
    }
    printWindow.document.write(`
      <!DOCTYPE html>
      <html lang="km">
      <head>
        <meta charset="UTF-8">
        <title>កំណត់ត្រាការដាក់ទណ្ឌកម្មវិន័យ (Disciplinary Record) - ${letterAction?.employee.employeeId || 'Slip'}</title>
        <link rel="preconnect" href="https://fonts.googleapis.com">
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
        <link href="https://fonts.googleapis.com/css2?family=Kantumruy+Pro:wght@400;500;600;700;800&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
        <style>
          @page {
            size: A4 portrait;
            margin: 8mm 12mm;
          }
          * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
          }
          body {
            font-family: 'Kantumruy Pro', 'Inter', 'Microsoft YaHei', SimSun, -apple-system, sans-serif;
            background: #ffffff;
            color: #000000;
            line-height: 1.45;
            font-size: 9.5pt;
            padding: 6px;
          }
          table {
            width: 100%;
            border-collapse: collapse;
          }
          th, td {
            border: 1px solid #1e293b;
            padding: 4px 8px;
          }
          @media print {
            body {
              padding: 0;
            }
          }
        </style>
      </head>
      <body>
        ${printContent.innerHTML}
        <script>
          window.onload = function() {
            window.print();
            window.onafterprint = function() {
              window.close();
            };
          };
        </script>
      </body>
      </html>
    `);
    printWindow.document.close();
  };

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

  const displayCompanyKh = (slipCompanyKh || '').trim() || 'ក្រុមហ៊ុន អេវើហ្គ្រីន ស្ព័តធីង ហ្គូដ (ខេមបូឌា) ឯ.ក';
  const displayCompanyZh = (slipCompanyZh || '').trim() || '長青戶外用品（柬埔寨）有限公司';
  const displayCompanyEn = (slipCompanyEn || '').trim() || 'EVERGREEN SPORTING GOODS (CAMBODIA) CO., LTD.';
  const cleanKhCompanyName = displayCompanyKh.replace(/\s*ឯ\.?ក\s*$/, '');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      {/* Page Header */}
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: '12px',
        background: '#ffffff',
        padding: '12px 16px',
        borderRadius: '12px',
        boxShadow: '0 2px 10px rgba(0,0,0,0.03)',
        border: '1px solid #f1f5f9'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '24px' }}>⚖️</span>
          <div>
            <h1 style={{ margin: 0, fontSize: '1.18rem', fontWeight: 800, color: '#0f172a' }}>
              វិធានការវិន័យ និងលិខិតព្រមាន
            </h1>
            <p style={{ margin: '2px 0 0 0', color: '#64748b', fontSize: '0.8rem' }}>
              Disciplinary Actions & Warning Letters • 纪律处分与警告信管理
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {isHR && (
            <button
              onClick={handleOpenCreate}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                background: 'linear-gradient(135deg, #ef4444 0%, #b91c1c 100%)',
                color: '#ffffff',
                border: 'none',
                borderRadius: '8px',
                padding: '7px 14px',
                fontWeight: 700,
                fontSize: '0.82rem',
                cursor: 'pointer',
                boxShadow: '0 2px 8px rgba(239, 68, 68, 0.2)'
              }}
            >
              <span>➕</span>
              <div style={{ textAlign: 'left', lineHeight: 1.15 }}>
                <div>កត់ត្រាវិន័យថ្មី</div>
                <div style={{ fontSize: '0.66rem', opacity: 0.85 }}>New Disciplinary • 新增处分</div>
              </div>
            </button>
          )}

          <button
            onClick={exportToExcel}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              background: 'linear-gradient(135deg, #10b981 0%, #047857 100%)',
              color: '#ffffff',
              border: 'none',
              borderRadius: '8px',
              padding: '7px 14px',
              fontWeight: 700,
              fontSize: '0.82rem',
              cursor: 'pointer',
              boxShadow: '0 2px 8px rgba(16, 185, 129, 0.2)'
            }}
          >
            <span>📥</span>
            <div style={{ textAlign: 'left', lineHeight: 1.15 }}>
              <div>ទាញយក Excel</div>
              <div style={{ fontSize: '0.66rem', opacity: 0.85 }}>Export Excel • 导出表格</div>
            </div>
          </button>
        </div>
      </div>

      {/* 3-Language Metrics Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '10px'
      }}>
        {/* Card 1: Total Cases */}
        <div style={{
          background: '#ffffff',
          borderRadius: '12px',
          padding: '10px 14px',
          border: '1px solid #f1f5f9',
          boxShadow: '0 2px 6px rgba(0,0,0,0.02)',
          display: 'flex',
          alignItems: 'center',
          gap: '12px'
        }}>
          <div style={{
            width: '38px',
            height: '38px',
            borderRadius: '10px',
            background: '#e0f2fe',
            color: '#0284c7',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '18px',
            flexShrink: 0
          }}>
            📋
          </div>
          <div>
            <div style={{ fontWeight: 800, fontSize: '0.85rem', color: '#0f172a' }}>ករណីសរុប</div>
            <div style={{ fontSize: '0.68rem', color: '#64748b' }}>Total Cases • 总案件数</div>
            <div style={{ fontSize: '1.45rem', fontWeight: 900, color: '#0284c7', marginTop: '2px', lineHeight: 1.1 }}>
              {stats.total}
            </div>
          </div>
        </div>

        {/* Card 2: Written Warnings */}
        <div style={{
          background: '#ffffff',
          borderRadius: '12px',
          padding: '10px 14px',
          border: '1px solid #f1f5f9',
          boxShadow: '0 2px 6px rgba(0,0,0,0.02)',
          display: 'flex',
          alignItems: 'center',
          gap: '12px'
        }}>
          <div style={{
            width: '38px',
            height: '38px',
            borderRadius: '10px',
            background: '#fee2e2',
            color: '#dc2626',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '18px',
            flexShrink: 0
          }}>
            ⚠️
          </div>
          <div>
            <div style={{ fontWeight: 800, fontSize: '0.85rem', color: '#0f172a' }}>លិខិតព្រមាន</div>
            <div style={{ fontSize: '0.68rem', color: '#64748b' }}>Written Warnings • 书面警告</div>
            <div style={{ fontSize: '1.45rem', fontWeight: 900, color: '#dc2626', marginTop: '2px', lineHeight: 1.1 }}>
              {stats.written}
            </div>
          </div>
        </div>

        {/* Card 3: Suspensions */}
        <div style={{
          background: '#ffffff',
          borderRadius: '12px',
          padding: '10px 14px',
          border: '1px solid #f1f5f9',
          boxShadow: '0 2px 6px rgba(0,0,0,0.02)',
          display: 'flex',
          alignItems: 'center',
          gap: '12px'
        }}>
          <div style={{
            width: '38px',
            height: '38px',
            borderRadius: '10px',
            background: '#f3e8ff',
            color: '#7e22ce',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '18px',
            flexShrink: 0
          }}>
            🛑
          </div>
          <div>
            <div style={{ fontWeight: 800, fontSize: '0.85rem', color: '#0f172a' }}>ព្យួរការងារ</div>
            <div style={{ fontSize: '0.68rem', color: '#64748b' }}>Suspensions • 停职处分</div>
            <div style={{ fontSize: '1.45rem', fontWeight: 900, color: '#7e22ce', marginTop: '2px', lineHeight: 1.1 }}>
              {stats.suspension}
            </div>
          </div>
        </div>

        {/* Card 4: Resolved */}
        <div style={{
          background: '#ffffff',
          borderRadius: '12px',
          padding: '10px 14px',
          border: '1px solid #f1f5f9',
          boxShadow: '0 2px 6px rgba(0,0,0,0.02)',
          display: 'flex',
          alignItems: 'center',
          gap: '12px'
        }}>
          <div style={{
            width: '38px',
            height: '38px',
            borderRadius: '10px',
            background: '#dcfce7',
            color: '#16a34a',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '18px',
            flexShrink: 0
          }}>
            ✅
          </div>
          <div>
            <div style={{ fontWeight: 800, fontSize: '0.85rem', color: '#0f172a' }}>បានដោះស្រាយ</div>
            <div style={{ fontSize: '0.68rem', color: '#64748b' }}>Resolved • 已解决</div>
            <div style={{ fontSize: '1.45rem', fontWeight: 900, color: '#16a34a', marginTop: '2px', lineHeight: 1.1 }}>
              {stats.resolved}
            </div>
          </div>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: '8px',
        alignItems: 'center',
        background: '#ffffff',
        padding: '8px 12px',
        borderRadius: '10px',
        border: '1px solid #f1f5f9'
      }}>
        {/* Search */}
        <div style={{ flex: '1 1 200px', position: 'relative' }}>
          <input
            type="text"
            placeholder="ស្វែងរកតាមឈ្មោះ, អត្តលេខ ឬកម្មវត្ថុ (Search)..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{
              width: '100%',
              padding: '6px 10px 6px 30px',
              borderRadius: '8px',
              border: '1px solid #cbd5e1',
              fontSize: '0.8rem',
              outline: 'none',
              boxSizing: 'border-box'
            }}
          />
          <span style={{ position: 'absolute', left: '9px', top: '7px', color: '#94a3b8', fontSize: '0.8rem' }}>🔍</span>
        </div>

        {/* Action Type Filter */}
        <div style={{ minWidth: '160px' }}>
          <select
            value={actionTypeFilter}
            onChange={e => setActionTypeFilter(e.target.value)}
            style={{
              width: '100%',
              padding: '6px 8px',
              borderRadius: '8px',
              border: '1px solid #cbd5e1',
              fontSize: '0.8rem',
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
        <div style={{ minWidth: '160px' }}>
          <select
            value={departmentFilter}
            onChange={e => setDepartmentFilter(e.target.value)}
            style={{
              width: '100%',
              padding: '6px 8px',
              borderRadius: '8px',
              border: '1px solid #cbd5e1',
              fontSize: '0.8rem',
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
        <div style={{ minWidth: '140px' }}>
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            style={{
              width: '100%',
              padding: '6px 8px',
              borderRadius: '8px',
              border: '1px solid #cbd5e1',
              fontSize: '0.8rem',
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
        borderRadius: '12px',
        border: '1px solid #e2e8f0',
        boxShadow: '0 2px 10px rgba(0,0,0,0.02)',
        overflow: 'hidden'
      }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                {/* 1: No */}
                <th style={{ padding: '8px 10px', width: '42px' }}>
                  <div style={{ fontWeight: 800, color: '#0f172a', fontSize: '0.82rem' }}>ល.រ</div>
                  <div style={{ fontSize: '0.65rem', color: '#64748b' }}>No. • 序号</div>
                </th>

                {/* 2: Employee */}
                <th style={{ padding: '8px 10px', minWidth: '160px' }}>
                  <div style={{ fontWeight: 800, color: '#0f172a', fontSize: '0.82rem' }}>ព័ត៌មានបុគ្គលិក</div>
                  <div style={{ fontSize: '0.65rem', color: '#64748b' }}>EMPLOYEE • 员工信息</div>
                </th>

                {/* 3: Incident Date */}
                <th style={{ padding: '8px 10px', width: '95px' }}>
                  <div style={{ fontWeight: 800, color: '#0f172a', fontSize: '0.82rem' }}>កាលបរិច្ឆេទ</div>
                  <div style={{ fontSize: '0.65rem', color: '#64748b' }}>DATE • 违纪日期</div>
                </th>

                {/* 4: Action Type */}
                <th style={{ padding: '8px 10px', minWidth: '130px' }}>
                  <div style={{ fontWeight: 800, color: '#0f172a', fontSize: '0.82rem' }}>ប្រភេទវិធានការ</div>
                  <div style={{ fontSize: '0.65rem', color: '#64748b' }}>TYPE • 处分类型</div>
                </th>

                {/* 5: Subject & Reason */}
                <th style={{ padding: '8px 10px', minWidth: '180px' }}>
                  <div style={{ fontWeight: 800, color: '#0f172a', fontSize: '0.82rem' }}>កម្មវត្ថុ និងមូលហេតុ</div>
                  <div style={{ fontSize: '0.65rem', color: '#64748b' }}>SUBJECT • 处分主题</div>
                </th>

                {/* 6: Warning Level */}
                <th style={{ padding: '8px 10px', width: '70px', textAlign: 'center' }}>
                  <div style={{ fontWeight: 800, color: '#0f172a', fontSize: '0.82rem' }}>លើកទី</div>
                  <div style={{ fontSize: '0.65rem', color: '#64748b' }}>LEVEL • 警告次数</div>
                </th>

                {/* 7: Status */}
                <th style={{ padding: '8px 10px', width: '85px' }}>
                  <div style={{ fontWeight: 800, color: '#0f172a', fontSize: '0.82rem' }}>ស្ថានភាព</div>
                  <div style={{ fontSize: '0.65rem', color: '#64748b' }}>STATUS • 状态</div>
                </th>

                {/* 8: Actions */}
                <th style={{ padding: '8px 10px', width: '105px', textAlign: 'right' }}>
                  <div style={{ fontWeight: 800, color: '#0f172a', fontSize: '0.82rem' }}>សកម្មភាព</div>
                  <div style={{ fontSize: '0.65rem', color: '#64748b' }}>ACTIONS • 操作</div>
                </th>
              </tr>
            </thead>

            <tbody>
              {filteredActions.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ padding: '30px 16px', textAlign: 'center', color: '#64748b' }}>
                    <div style={{ fontSize: '28px', marginBottom: '4px' }}>🛡️</div>
                    <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>មិនមានកំណត់ត្រាវិន័យត្រូវបង្ហាញទេ</div>
                    <div style={{ fontSize: '0.75rem' }}>No disciplinary records found</div>
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
                      <td style={{ padding: '8px 10px', fontWeight: 700, color: '#64748b', fontSize: '0.82rem' }}>
                        {index + 1}
                      </td>

                      {/* Employee Info */}
                      <td style={{ padding: '8px 10px' }}>
                        <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.84rem' }}>
                          {emp.lastNameKh || ''} {emp.firstNameKh || ''} {(!emp.lastNameKh && !emp.firstNameKh) && `${emp.firstNameEn} ${emp.lastNameEn}`}
                        </div>
                        <div style={{ fontSize: '0.72rem', color: '#4f46e5', fontWeight: 600 }}>
                          {emp.employeeId} • {emp.position}
                        </div>
                        <div style={{ fontSize: '0.68rem', color: '#64748b' }}>
                          {emp.department}
                        </div>
                      </td>

                      {/* Incident Date */}
                      <td style={{ padding: '8px 10px', fontSize: '0.78rem', fontWeight: 600, color: '#334155', whiteSpace: 'nowrap' }}>
                        {new Date(act.incidentDate).toISOString().split('T')[0]}
                      </td>

                      {/* Action Type Badge */}
                      <td style={{ padding: '8px 10px' }}>
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          padding: '4px 7px',
                          borderRadius: '6px',
                          background: typeConf.bg,
                          color: typeConf.text,
                          fontWeight: 700,
                          fontSize: '0.74rem',
                          border: `1px solid ${typeConf.text}33`
                        }}>
                          <span>{typeConf.icon}</span>
                          <span>{typeConf.labelKh}</span>
                        </span>
                      </td>

                      {/* Subject & Reason */}
                      <td style={{ padding: '8px 10px' }}>
                        <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.82rem' }}>
                          {act.subject}
                        </div>
                        <div style={{ fontSize: '0.7rem', color: '#b45309', fontWeight: 600 }}>
                          {reasonConf.labelKh} ({reasonConf.labelEn})
                        </div>
                        {act.description && (
                          <div style={{ fontSize: '0.7rem', color: '#64748b', marginTop: '1px', maxWidth: '240px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {act.description}
                          </div>
                        )}
                      </td>

                      {/* Warning Level */}
                      <td style={{ padding: '8px 10px', textAlign: 'center' }}>
                        <span style={{
                          display: 'inline-block',
                          padding: '2px 6px',
                          borderRadius: '5px',
                          background: '#f8fafc',
                          border: '1px solid #cbd5e1',
                          fontWeight: 800,
                          fontSize: '0.76rem',
                          color: '#1e293b'
                        }}>
                          លើកទី {act.warningCount}
                        </span>
                      </td>

                      {/* Status */}
                      <td style={{ padding: '8px 10px' }}>
                        <span style={{
                          display: 'inline-block',
                          padding: '3px 6px',
                          borderRadius: '5px',
                          background: statusConf.bg,
                          color: statusConf.text,
                          fontWeight: 700,
                          fontSize: '0.72rem'
                        }}>
                          {statusConf.labelKh}
                        </span>
                      </td>

                      {/* Actions */}
                      <td style={{ padding: '8px 10px', textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: '4px', justifyContent: 'flex-end' }}>
                          {/* Print / Preview Warning Letter */}
                          <button
                            onClick={() => openWarningLetterSlip(act)}
                            title="មើល និងបោះពុម្ពលិខិតព្រមាន (Print Warning Letter)"
                            style={{
                              background: '#f0fdf4',
                              border: '1px solid #bbf7d0',
                              color: '#16a34a',
                              padding: '4px 7px',
                              borderRadius: '6px',
                              cursor: 'pointer',
                              fontWeight: 700,
                              fontSize: '0.74rem'
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
                                  padding: '4px 7px',
                                  borderRadius: '6px',
                                  cursor: 'pointer',
                                  fontSize: '0.78rem'
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
                                  padding: '4px 7px',
                                  borderRadius: '6px',
                                  cursor: 'pointer',
                                  fontSize: '0.78rem'
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
          background: 'rgba(15, 23, 42, 0.78)',
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
            maxWidth: '920px',
            maxHeight: '96vh',
            boxShadow: '0 25px 60px rgba(0,0,0,0.3)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden'
          }}>
            {/* Top Toolbar */}
            <div style={{
              background: '#0f172a',
              color: '#ffffff',
              padding: '12px 20px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '10px'
            }}>
              <div style={{ fontWeight: 800, fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '1.2rem' }}>📋</span>
                <span>កំណត់ត្រាការដាក់ទណ្ឌកម្មវិន័យ ៣ ភាសា (Trilingual Factory Disciplinary Record Slip)</span>
              </div>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <button
                  onClick={() => setIsEditingSlipSettings(!isEditingSlipSettings)}
                  style={{
                    background: isEditingSlipSettings ? '#f59e0b' : '#334155',
                    border: '1px solid #475569',
                    color: '#ffffff',
                    padding: '6px 12px',
                    borderRadius: '7px',
                    cursor: 'pointer',
                    fontWeight: 700,
                    fontSize: '0.8rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  ⚙️ <span>{isEditingSlipSettings ? 'បិទផ្ទាំងកែប្រែ' : 'កែប្រែ Logo & ក្រុមហ៊ុន (Setup Logo & Company)'}</span>
                </button>
                <button
                  onClick={handlePrintWarningSlip}
                  style={{
                    background: '#16a34a',
                    border: 'none',
                    color: '#ffffff',
                    padding: '6px 14px',
                    borderRadius: '7px',
                    cursor: 'pointer',
                    fontWeight: 700,
                    fontSize: '0.82rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  🖨️ <span>បោះពុម្ព (Print)</span>
                </button>
                <button
                  onClick={() => setLetterAction(null)}
                  style={{
                    background: '#334155',
                    border: 'none',
                    color: '#ffffff',
                    padding: '6px 12px',
                    borderRadius: '7px',
                    cursor: 'pointer',
                    fontWeight: 700,
                    fontSize: '0.82rem'
                  }}
                >
                  ✕ បិទ
                </button>
              </div>
            </div>

            {/* Hidden Logo File Input */}
            <input
              type="file"
              ref={logoFileInputRef}
              accept="image/*"
              onChange={handleLogoFileUpload}
              style={{ display: 'none' }}
            />

            {/* Editable Company & Form Settings Bar */}
            {isEditingSlipSettings && (
              <div style={{
                background: '#f8fafc',
                borderBottom: '2px solid #cbd5e1',
                padding: '16px 20px',
                fontSize: '0.82rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '14px'
              }}>
                {/* Row 1: Logo Auto Setup & Custom Logo Options */}
                <div style={{
                  background: '#ffffff',
                  border: '1px solid #e2e8f0',
                  borderRadius: '10px',
                  padding: '12px 14px',
                  display: 'flex',
                  flexWrap: 'wrap',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '12px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                    <div
                      onClick={() => logoFileInputRef.current?.click()}
                      title="ចុចដើម្បីផ្ទុកឡើងរូបភាព Logo ពីរោងចក្រ / Click to upload factory logo"
                      style={{
                        width: '54px',
                        height: '54px',
                        borderRadius: '8px',
                        border: '2px dashed #94a3b8',
                        background: slipLogoType === 'evergreen' ? 'linear-gradient(135deg, #15803d 0%, #166534 100%)' : '#f1f5f9',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        overflow: 'hidden',
                        flexShrink: 0
                      }}
                    >
                      {slipLogoType === 'image' && slipLogoUrl ? (
                        <img src={slipLogoUrl} alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                      ) : slipLogoType === 'factory' ? (
                        <span style={{ fontSize: '1.6rem' }}>🏢</span>
                      ) : (
                        <span style={{ fontSize: '1.6rem', color: '#ffffff' }}>🌳</span>
                      )}
                    </div>
                    <div>
                      <div style={{ fontWeight: 800, color: '#0f172a', marginBottom: '2px' }}>
                        កំណត់រូបសញ្ញា Logo (Factory / Company Logo)
                      </div>
                      <div style={{ color: '#64748b', fontSize: '0.76rem' }}>
                        អ្នកអាចផ្ទុកឡើងរូបភាពផ្ទាល់ខ្លួន បិទភ្ជាប់តំណ Link ឬទាញយកស្វ័យប្រវត្តពីប្រព័ន្ធ
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    <button
                      type="button"
                      onClick={() => logoFileInputRef.current?.click()}
                      style={{
                        background: '#2563eb',
                        color: '#ffffff',
                        border: 'none',
                        borderRadius: '6px',
                        padding: '6px 12px',
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        fontSize: '0.78rem'
                      }}
                    >
                      📁 <span>ផ្ទុកឡើង Logo (Upload)</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleApplyPreset('system')}
                      title="ទាញយកឈ្មោះ និង Logo ពីការកំណត់ប្រព័ន្ធស្វ័យប្រវត្តិ"
                      style={{
                        background: '#059669',
                        color: '#ffffff',
                        border: 'none',
                        borderRadius: '6px',
                        padding: '6px 12px',
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '5px',
                        fontSize: '0.78rem'
                      }}
                    >
                      🔄 <span>Auto Setup ពីប្រព័ន្ធ</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleApplyPreset('evergreen')}
                      style={{
                        background: '#e2e8f0',
                        color: '#0f172a',
                        border: '1px solid #cbd5e1',
                        borderRadius: '6px',
                        padding: '6px 10px',
                        fontWeight: 700,
                        cursor: 'pointer',
                        fontSize: '0.78rem'
                      }}
                    >
                      🌲 គំរូ Evergreen
                    </button>
                    <button
                      type="button"
                      onClick={() => handleApplyPreset('factory')}
                      style={{
                        background: '#e2e8f0',
                        color: '#0f172a',
                        border: '1px solid #cbd5e1',
                        borderRadius: '6px',
                        padding: '6px 10px',
                        fontWeight: 700,
                        cursor: 'pointer',
                        fontSize: '0.78rem'
                      }}
                    >
                      🏢 គំរូ Factory
                    </button>
                  </div>
                </div>

                {/* Row 2: Inputs Grid */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                  gap: '12px'
                }}>
                  <div>
                    <label style={{ display: 'block', fontWeight: 700, marginBottom: '4px', color: '#1e293b' }}>
                      ឈ្មោះក្រុមហ៊ុន (ភាសាខ្មែរ):
                    </label>
                    <input
                      type="text"
                      value={slipCompanyKh}
                      onChange={(e) => {
                        setSlipCompanyKh(e.target.value);
                        saveSlipSettingsToStorage(e.target.value, slipCompanyZh, slipCompanyEn);
                      }}
                      placeholder="ឧ. ក្រុមហ៊ុន អេវើហ្គ្រីន ស្ព័តធីង ហ្គូដ (ខេមបូឌា) ឯ.ក"
                      style={{ width: '100%', padding: '6px 10px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.82rem' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontWeight: 700, marginBottom: '4px', color: '#1e293b' }}>
                      公司名称 (中文):
                    </label>
                    <input
                      type="text"
                      value={slipCompanyZh}
                      onChange={(e) => {
                        setSlipCompanyZh(e.target.value);
                        saveSlipSettingsToStorage(slipCompanyKh, e.target.value, slipCompanyEn);
                      }}
                      placeholder="例：長青戶外用品（柬埔寨）有限公司"
                      style={{ width: '100%', padding: '6px 10px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.82rem' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontWeight: 700, marginBottom: '4px', color: '#1e293b' }}>
                      Company Name (English):
                    </label>
                    <input
                      type="text"
                      value={slipCompanyEn}
                      onChange={(e) => {
                        setSlipCompanyEn(e.target.value);
                        saveSlipSettingsToStorage(slipCompanyKh, slipCompanyZh, e.target.value);
                      }}
                      placeholder="e.g. EVERGREEN SPORTING GOODS (CAMBODIA) CO., LTD."
                      style={{ width: '100%', padding: '6px 10px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.82rem' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontWeight: 700, marginBottom: '4px', color: '#1e293b' }}>
                      តំណភ្ជាប់រូបភាព Logo (URL / Optional):
                    </label>
                    <input
                      type="text"
                      value={slipLogoUrl}
                      onChange={(e) => {
                        const val = e.target.value;
                        setSlipLogoUrl(val);
                        const type = val ? 'image' : 'evergreen';
                        setSlipLogoType(type);
                        saveSlipSettingsToStorage(slipCompanyKh, slipCompanyZh, slipCompanyEn, val, type);
                      }}
                      placeholder="https://... ឬ file path"
                      style={{ width: '100%', padding: '6px 10px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.82rem' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontWeight: 700, marginBottom: '4px', color: '#1e293b' }}>
                      ក្រុម/ខ្សែផលិតកម្ម (Team/Line):
                    </label>
                    <input
                      type="text"
                      value={slipLine}
                      onChange={(e) => setSlipLine(e.target.value)}
                      placeholder="Line 01"
                      style={{ width: '100%', padding: '6px 10px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.82rem' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontWeight: 700, marginBottom: '4px', color: '#1e293b' }}>
                      ថ្ងៃចូលធ្វើការ (进厂日期 / Hire Date):
                    </label>
                    <input
                      type="date"
                      value={slipHireDate}
                      onChange={(e) => setSlipHireDate(e.target.value)}
                      style={{ width: '100%', padding: '6px 10px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.82rem' }}
                    />
                  </div>
                </div>

                {/* Row 3: Save button feedback */}
                <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '10px' }}>
                  {saveSuccessMsg && (
                    <span style={{ color: '#16a34a', fontWeight: 700, fontSize: '0.82rem' }}>
                      ✓ {saveSuccessMsg}
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => saveSlipSettingsToStorage()}
                    style={{
                      background: '#0f172a',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: '6px',
                      padding: '6px 14px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      fontSize: '0.8rem'
                    }}
                  >
                    💾 រក្សាទុកការកំណត់ (Save Preset)
                  </button>
                </div>
              </div>
            )}

            {/* Printable Document Body */}
            <div id="printable-warning-letter" style={{
              padding: '28px 36px',
              overflowY: 'auto',
              background: '#ffffff',
              color: '#0f172a',
              fontFamily: "'Kantumruy Pro', 'Inter', 'Microsoft YaHei', SimSun, sans-serif",
              lineHeight: 1.5,
              fontSize: '9.5pt'
            }}>
              
              {/* Top Company Header (Matching Factory Standard) */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '2px solid #0f172a', paddingBottom: '12px', marginBottom: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                  {/* Company Logo Badge (Clickable to change) */}
                  <div
                    onClick={() => {
                      setIsEditingSlipSettings(true);
                      logoFileInputRef.current?.click();
                    }}
                    title="ចុចត្រង់នេះដើម្បីប្តូរ Logo (Upload / Change Logo)"
                    style={{
                      width: '60px',
                      height: '60px',
                      borderRadius: '10px',
                      border: '1px solid #cbd5e1',
                      background: slipLogoType === 'evergreen' ? 'linear-gradient(135deg, #15803d 0%, #166534 100%)' : '#ffffff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#ffffff',
                      fontSize: '1.8rem',
                      boxShadow: '0 2px 6px rgba(0,0,0,0.08)',
                      cursor: 'pointer',
                      overflow: 'hidden',
                      flexShrink: 0
                    }}
                  >
                    {slipLogoType === 'image' && slipLogoUrl ? (
                      <img
                        src={slipLogoUrl}
                        alt="Company Logo"
                        style={{ width: '100%', height: '100%', objectFit: 'contain', padding: '2px' }}
                      />
                    ) : slipLogoType === 'factory' ? (
                      <span style={{ fontSize: '1.8rem' }}>🏢</span>
                    ) : (
                      <span style={{ fontSize: '1.8rem', color: '#ffffff' }}>🌳</span>
                    )}
                  </div>
                  <div>
                    <div style={{ fontSize: '1.05rem', fontWeight: 800, color: '#166534', lineHeight: 1.3 }}>
                      {displayCompanyKh}
                    </div>
                    <div style={{ fontSize: '0.92rem', fontWeight: 700, color: '#334155', lineHeight: 1.3 }}>
                      {displayCompanyZh}
                    </div>
                    <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      {displayCompanyEn}
                    </div>
                  </div>
                </div>

                {/* Document Metadata Ref */}
                <div style={{ textAlign: 'right', fontSize: '0.82rem', color: '#334155', lineHeight: 1.4 }}>
                  <div><strong>កាលបរិច្ឆេទ / 日期 / Date:</strong> {new Date(letterAction.incidentDate).toISOString().split('T')[0]}</div>
                  <div><strong>លេខយោង / 编号 / Ref:</strong> HR-WL-{new Date().getFullYear()}-{letterAction.employee.employeeId}</div>
                  <div><strong>កូដឯកសារ / 表格编号:</strong> SOP-HR-DISC-001</div>
                </div>
              </div>

              {/* Title Header (3 Languages) */}
              <div style={{ textAlign: 'center', margin: '14px 0 18px 0' }}>
                <h1 style={{ margin: 0, fontSize: '1.35rem', fontWeight: 800, color: '#0f172a' }}>
                  កំណត់ត្រាការដាក់ទណ្ឌកម្មវិន័យ
                </h1>
                <div style={{ fontSize: '1rem', fontWeight: 700, color: '#1e3a8a', marginTop: '2px' }}>
                  Disciplinary Record
                </div>
                <div style={{ fontSize: '1rem', fontWeight: 700, color: '#334155' }}>
                  纪律记录表
                </div>
              </div>

              {/* Employee Particulars Grid Table (3 Languages) */}
              <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '16px', border: '1px solid #1e293b' }}>
                <tbody>
                  <tr>
                    <td style={{ width: '22%', fontWeight: 700, background: '#f8fafc', padding: '6px 8px', border: '1px solid #334155' }}>
                      ឈ្មោះអ្នកប្រព្រឹត្តកំហុស<br />
                      <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#475569' }}>工人名字 / Employee:</span>
                    </td>
                    <td style={{ width: '28%', fontWeight: 700, padding: '6px 8px', border: '1px solid #334155', color: '#0f172a' }}>
                      {letterAction.employee.lastNameKh || ''} {letterAction.employee.firstNameKh || ''} ({letterAction.employee.firstNameEn} {letterAction.employee.lastNameEn})
                    </td>
                    <td style={{ width: '20%', fontWeight: 700, background: '#f8fafc', padding: '6px 8px', border: '1px solid #334155' }}>
                      អត្តលេខ<br />
                      <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#475569' }}>工号 / Emp ID:</span>
                    </td>
                    <td style={{ width: '30%', fontWeight: 800, padding: '6px 8px', border: '1px solid #334155', color: '#1e40af' }}>
                      {letterAction.employee.employeeId}
                    </td>
                  </tr>
                  <tr>
                    <td style={{ fontWeight: 700, background: '#f8fafc', padding: '6px 8px', border: '1px solid #334155' }}>
                      ផ្នែក<br />
                      <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#475569' }}>部门 / Department:</span>
                    </td>
                    <td style={{ padding: '6px 8px', border: '1px solid #334155' }}>
                      {letterAction.employee.department}
                    </td>
                    <td style={{ fontWeight: 700, background: '#f8fafc', padding: '6px 8px', border: '1px solid #334155' }}>
                      ក្រុម/ខ្សែ & តួនាទី<br />
                      <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#475569' }}>组 & 职位 / Line & Pos:</span>
                    </td>
                    <td style={{ padding: '6px 8px', border: '1px solid #334155' }}>
                      {slipLine} • {letterAction.employee.position}
                    </td>
                  </tr>
                  <tr>
                    <td style={{ fontWeight: 700, background: '#f8fafc', padding: '6px 8px', border: '1px solid #334155' }}>
                      ថ្ងៃចូលធ្វើការ<br />
                      <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#475569' }}>进厂日期 / Hire Date:</span>
                    </td>
                    <td style={{ padding: '6px 8px', border: '1px solid #334155' }}>
                      {slipHireDate || '01/01/2024'}
                    </td>
                    <td style={{ fontWeight: 700, background: '#f8fafc', padding: '6px 8px', border: '1px solid #334155' }}>
                      កាលបរិច្ឆេទកើតហេតុ<br />
                      <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#475569' }}>违纪日期 / Incident:</span>
                    </td>
                    <td style={{ padding: '6px 8px', border: '1px solid #334155', fontWeight: 700 }}>
                      {new Date(letterAction.incidentDate).toISOString().split('T')[0]}
                    </td>
                  </tr>
                </tbody>
              </table>

              {/* Description of Misconduct (3 Languages) */}
              <div style={{ marginBottom: '14px' }}>
                <div style={{ fontWeight: 800, color: '#0f172a', marginBottom: '4px' }}>
                  ការពិពណ៌នាអំពីកំហុស / 错误说明 / Details of Misconduct:
                </div>
                <div style={{ background: '#f8fafc', border: '1px solid #334155', borderRadius: '6px', padding: '8px 12px', fontSize: '0.9rem' }}>
                  <div style={{ marginBottom: '4px' }}>
                    <strong>ប្រភេទកំហុស / 违纪类型 / Violation:</strong>{' '}
                    <span style={{ color: '#b91c1c', fontWeight: 700 }}>
                      {REASON_TYPES[letterAction.reason]?.labelKh || letterAction.reason} ({REASON_TYPES[letterAction.reason]?.labelZh || ''} / {REASON_TYPES[letterAction.reason]?.labelEn || ''})
                    </span>
                  </div>
                  <div style={{ marginBottom: '4px' }}>
                    <strong>កម្មវត្ថុ / 事由 / Subject:</strong> {letterAction.subject || 'ការបំពានវិន័យការងារ (Disciplinary Breach)'}
                  </div>
                  <div>
                    <strong>ខ្លឹមសារលម្អិត / 具体说明 / Description:</strong>{' '}
                    {letterAction.description || 'បានប្រព្រឹត្តការបំពានលើបទបញ្ជាផ្ទៃក្នុងរបស់ក្រុមហ៊ុន និងច្បាប់ការងារជាធរមាន។ / 违反了公司内部规章制度及现行劳动法之相关规定。'}
                  </div>
                </div>
              </div>

              {/* Internal Regulation Reference Clause */}
              <div style={{ fontSize: '0.88rem', fontWeight: 700, margin: '14px 0 10px 0', color: '#0f172a', lineHeight: 1.45 }}>
                <div>** យោងតាមបទបញ្ជាផ្ទៃក្នុងនៃ {cleanKhCompanyName} ឯ.ក</div>
                <div style={{ color: '#334155', fontSize: '0.85rem' }}>根据 {displayCompanyZh} 的内部规定:</div>
                <div style={{ color: '#475569', fontSize: '0.8rem', textTransform: 'uppercase' }}>According to the Internal Regulations of {displayCompanyEn}:</div>
                <div style={{ marginTop: '4px', color: '#1e40af' }}>
                  កម្មករនិយោជិតឈ្មោះ: <u>{letterAction.employee.lastNameKh || ''} {letterAction.employee.firstNameKh || ''} ({letterAction.employee.firstNameEn})</u> អត្តលេខ: <u>{letterAction.employee.employeeId}</u> ត្រូវដាក់ទោសវិន័យក្នុងកម្រិត៖ / 工人名字: {letterAction.employee.firstNameEn} 工号: {letterAction.employee.employeeId} 处分级别:
                </div>
              </div>

              {/* 3-Tier Classification Checklist Matrix (Direct Replica of Factory Standard Image 2) */}
              <div style={{ border: '1px solid #1e293b', borderRadius: '8px', padding: '12px 16px', marginBottom: '14px', background: '#ffffff' }}>
                
                {/* TIER 1: MINOR OFFENSES */}
                <div style={{ marginBottom: '12px', borderBottom: '1px dashed #cbd5e1', paddingBottom: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                    <div style={{ fontWeight: 800, width: '130px', flexShrink: 0 }}>
                      <label style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <input
                          type="checkbox"
                          checked={slipSelectedLevel.startsWith('minor')}
                          onChange={() => setSlipSelectedLevel(slipSelectedLevel.startsWith('minor') ? 'moderate-1' : 'minor-1')}
                        />
                        <span>កំហុសស្រាល:</span>
                      </label>
                      <div style={{ fontSize: '0.78rem', color: '#475569', marginLeft: '22px' }}>轻微错误 / Minor</div>
                    </div>

                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.86rem' }}>
                      <label style={{ display: 'flex', alignItems: 'flex-start', gap: '6px', cursor: 'pointer' }}>
                        <input
                          type="checkbox"
                          checked={slipSelectedLevel === 'minor-1'}
                          onChange={() => setSlipSelectedLevel('minor-1')}
                        />
                        <span>
                          <strong>ក/ កំហុសលើកទី1៖</strong> ត្រូវទទួលការអប់រំដាស់តឿនផ្ទាល់មាត់។ <span style={{ color: '#475569' }}>/ 口头警告的初犯。 (1st Offense: Verbal Warning)</span>
                        </span>
                      </label>

                      <label style={{ display: 'flex', alignItems: 'flex-start', gap: '6px', cursor: 'pointer' }}>
                        <input
                          type="checkbox"
                          checked={slipSelectedLevel === 'minor-2'}
                          onChange={() => setSlipSelectedLevel('minor-2')}
                        />
                        <span>
                          <strong>ខ/ កំហុសលើកទី2៖</strong> ត្រូវទទួលការព្រមានជាលាយលក្ខណ៍អក្សរ (ស្មើនឹងកំហុសមធ្យមលើកទី1)។ <span style={{ color: '#475569' }}>/ 第二次错误需要书面警告。 (2nd Offense: 1st Written Warning)</span>
                        </span>
                      </label>

                      <label style={{ display: 'flex', alignItems: 'flex-start', gap: '6px', cursor: 'pointer' }}>
                        <input
                          type="checkbox"
                          checked={slipSelectedLevel === 'minor-3'}
                          onChange={() => setSlipSelectedLevel('minor-3')}
                        />
                        <span>
                          <strong>គ/ កំហុសលើកទី3៖</strong> ត្រូវទទួលការព្រមានជាលាយលក្ខណ៍អក្សរ (ស្មើនឹងកំហុសមធ្យមលើកទី2)។ <span style={{ color: '#475569' }}>/ 第三次错误需要书面警告。 (3rd Offense: 2nd Written Warning)</span>
                        </span>
                      </label>

                      <label style={{ display: 'flex', alignItems: 'flex-start', gap: '6px', cursor: 'pointer' }}>
                        <input
                          type="checkbox"
                          checked={slipSelectedLevel === 'minor-4'}
                          onChange={() => setSlipSelectedLevel('minor-4')}
                        />
                        <span style={{ color: '#b91c1c', fontWeight: 700 }}>
                          <strong>ឃ/ លើកទី4៖</strong> ត្រូវបញ្ឈប់ពីការងារ។ <span style={{ color: '#7f1d1d' }}>/ 第四次警告终止劳动合同。 (4th Offense: Termination)</span>
                        </span>
                      </label>
                    </div>
                  </div>
                </div>

                {/* TIER 2: MODERATE OFFENSES */}
                <div style={{ marginBottom: '12px', borderBottom: '1px dashed #cbd5e1', paddingBottom: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                    <div style={{ fontWeight: 800, width: '130px', flexShrink: 0 }}>
                      <label style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <input
                          type="checkbox"
                          checked={slipSelectedLevel.startsWith('moderate')}
                          onChange={() => setSlipSelectedLevel(slipSelectedLevel.startsWith('moderate') ? 'minor-2' : 'moderate-1')}
                        />
                        <span>កំហុសមធ្យម:</span>
                      </label>
                      <div style={{ fontSize: '0.78rem', color: '#475569', marginLeft: '22px' }}>中度错误 / Moderate</div>
                    </div>

                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.86rem' }}>
                      <label style={{ display: 'flex', alignItems: 'flex-start', gap: '6px', cursor: 'pointer' }}>
                        <input
                          type="checkbox"
                          checked={slipSelectedLevel === 'moderate-1'}
                          onChange={() => setSlipSelectedLevel('moderate-1')}
                        />
                        <span>
                          <strong>ក/ លើកទី1៖</strong> ត្រូវទទួលការព្រមានជាលាយលក្ខណ៍អក្សរ។ <span style={{ color: '#475569' }}>/ 第一次错误需要书面警告。 (1st Offense: 1st Written Warning)</span>
                        </span>
                      </label>

                      <label style={{ display: 'flex', alignItems: 'flex-start', gap: '6px', cursor: 'pointer' }}>
                        <input
                          type="checkbox"
                          checked={slipSelectedLevel === 'moderate-2'}
                          onChange={() => setSlipSelectedLevel('moderate-2')}
                        />
                        <span>
                          <strong>ខ/ លើកទី2៖</strong> ត្រូវទទួលការព្រមានជាលាយលក្ខណ៍អក្សរ។ <span style={{ color: '#475569' }}>/ 第二次错误需要书面警告。 (2nd Offense: 2nd Written Warning - Final)</span>
                        </span>
                      </label>

                      <label style={{ display: 'flex', alignItems: 'flex-start', gap: '6px', cursor: 'pointer' }}>
                        <input
                          type="checkbox"
                          checked={slipSelectedLevel === 'moderate-3'}
                          onChange={() => setSlipSelectedLevel('moderate-3')}
                        />
                        <span style={{ color: '#b91c1c', fontWeight: 700 }}>
                          <strong>គ/ លើកទី3៖</strong> ត្រូវបញ្ឈប់ពីការងារ។ <span style={{ color: '#7f1d1d' }}>/ 第三次警告终止劳动合同。 (3rd Offense: Termination)</span>
                        </span>
                      </label>
                    </div>
                  </div>
                </div>

                {/* TIER 3: SERIOUS MISCONDUCT */}
                <div>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                    <div style={{ fontWeight: 800, width: '130px', flexShrink: 0 }}>
                      <label style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <input
                          type="checkbox"
                          checked={slipSelectedLevel === 'serious'}
                          onChange={() => setSlipSelectedLevel(slipSelectedLevel === 'serious' ? 'minor-2' : 'serious')}
                        />
                        <span style={{ color: '#b91c1c' }}>កំហុសធ្ងន់:</span>
                      </label>
                      <div style={{ fontSize: '0.78rem', color: '#b91c1c', marginLeft: '22px' }}>严重错误 / Serious</div>
                    </div>

                    <div style={{ flex: 1, fontSize: '0.85rem', lineHeight: 1.5 }}>
                      <label style={{ display: 'flex', alignItems: 'flex-start', gap: '6px', cursor: 'pointer' }}>
                        <input
                          type="checkbox"
                          checked={slipSelectedLevel === 'serious'}
                          onChange={() => setSlipSelectedLevel('serious')}
                        />
                        <span>
                          <strong>ដូចមានចែងក្នុងច្បាប់ស្តីពីការងារ (មាត្រា ៨៣) និងបទបញ្ជាផ្ទៃក្នុង៖</strong> ត្រូវបញ្ឈប់ពីការងារភ្លាមៗដោយគ្មានសំណងជូនដំណឹងមុន ឬប្រាក់បំណាច់ឡើយ។ ក្នុងករណីចាំបាច់ ក្រុមហ៊ុននឹងបញ្ជូនសំណុំរឿងទៅក្រសួងមានសមត្ថកិច្ចដើម្បីធ្វើការដោះស្រាយតាមច្បាប់ជាធរមាន។
                          <br />
                          <span style={{ color: '#475569' }}>
                            根据《劳动法》第83条及公司内部规章制度的规定，将被立即解雇并不予任何经济补偿。如有必要，公司将根据适用法律将案件移交给主管部门解决。
                          </span>
                        </span>
                      </label>
                    </div>
                  </div>
                </div>

              </div>

              {/* Statutory Note on 12-Month Clean Record (Direct from Factory Standard Image 2) */}
              <div style={{ background: '#f8fafc', border: '1px solid #94a3b8', borderRadius: '6px', padding: '8px 12px', fontSize: '0.84rem', marginBottom: '14px' }}>
                <div style={{ fontWeight: 700, color: '#0f172a' }}>
                  បញ្ជាក់៖ កំហុសរយៈពេល 12 ខែមុនឡើងទៅ ក្រុមហ៊ុនមិនបូកសរុបដើម្បីធ្វើការដាក់វិន័យនៅពេលបន្ទាប់ឡើយ (លុបចោលស្វ័យប្រវត្តិតាមច្បាប់)។
                </div>
                <div style={{ color: '#334155' }}>
                  注意: 在过去的12个月里未再次违纪的，公司在下一期间不再累计先前的纪律处分（消除前科）。
                </div>
                <div style={{ color: '#64748b', fontSize: '0.78rem' }}>
                  Note: Disciplinary infractions older than 12 months without repeat misconduct will not be accumulated for future sanctions.
                </div>
              </div>

              {/* Corrective Action Section */}
              <div style={{ marginBottom: '18px' }}>
                <div style={{ fontWeight: 800, color: '#0f172a', marginBottom: '4px' }}>
                  វិធានការវិន័យ និងការកែលម្អ / 处分措施与整改要求 / Corrective Action & Consequences:
                </div>
                <div style={{ background: '#fff1f2', border: '1px solid #fecaca', padding: '8px 12px', borderRadius: '6px', color: '#991b1b', fontSize: '0.88rem' }}>
                  {letterAction.actionTaken || `នេះជាការកត់ត្រាដាក់វិន័យផ្លូវការ។ កម្មករនិយោជិតត្រូវកែលម្អឥរិយាបថជាបន្ទាន់ និងមិនត្រូវឱ្យកើតមានកំហុសដដែលម្តងទៀតឡើយ។ ប្រសិនបើនៅតែបន្តប្រព្រឹត្ត ក្រុមហ៊ុននឹងចាត់វិធានការកម្រិតបន្ទាប់រហូតដល់ការបញ្ឈប់ពីការងារស្របតាមច្បាប់ការងារ។`}
                </div>
              </div>

              {/* 3 Signatures in 3 Languages (Matching Image 2) */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: '14px',
                marginTop: '28px',
                paddingTop: '16px',
                borderTop: '1px solid #cbd5e1',
                textAlign: 'center',
                fontSize: '0.82rem'
              }}>
                <div>
                  <div style={{ fontWeight: 800, color: '#0f172a' }}>ឈ្មោះហត្ថលេខា និង ស្នាមមេដៃ</div>
                  <div style={{ fontWeight: 700, color: '#1e3a8a' }}>សាមីជនប្រព្រឹត្តកំហុស</div>
                  <div style={{ color: '#475569' }}>工人名字（签名与指模）</div>
                  <div style={{ color: '#64748b', fontSize: '0.75rem' }}>Employee Signature & Thumbprint</div>
                  <div style={{ height: '60px', borderBottom: '1px dashed #475569', margin: '8px 16px' }}></div>
                  <div>កាលបរិច្ឆេទ / 日期: ......./......./...........</div>
                </div>

                <div>
                  <div style={{ fontWeight: 800, color: '#0f172a' }}>ហត្ថលេខា</div>
                  <div style={{ fontWeight: 700, color: '#1e3a8a' }}>តំណាងសហជីព/តំណាងកម្មករ/ប្រធាន</div>
                  <div style={{ color: '#475569' }}>工会 / 工人代表 / 组长</div>
                  <div style={{ color: '#64748b', fontSize: '0.75rem' }}>Union / Worker Rep / Line Leader</div>
                  <div style={{ height: '60px', borderBottom: '1px dashed #475569', margin: '8px 16px' }}></div>
                  <div>កាលបរិច្ឆេទ / 日期: ......./......./...........</div>
                </div>

                <div>
                  <div style={{ fontWeight: 800, color: '#0f172a' }}>អនុញ្ញាត្តិដោយ</div>
                  <div style={{ fontWeight: 700, color: '#1e3a8a' }}>ផ្នែកធនធានមនុស្ស</div>
                  <div style={{ color: '#475569' }}>人事部审批</div>
                  <div style={{ color: '#64748b', fontSize: '0.75rem' }}>Approved by HR Department</div>
                  <div style={{ height: '60px', borderBottom: '1px dashed #475569', margin: '8px 16px' }}></div>
                  <div>កាលបរិច្ឆេទ / 日期: ......./......./...........</div>
                </div>
              </div>

            </div>
          </div>
        </div>
      )}
    </div>
  );
}