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

interface PerformanceAppraisal {
  id: string;
  employeeId: string;
  employee: EmployeeSimple;
  period: string;
  reviewDate: string;
  reviewerName: string;
  workQualityScore: number;
  productivityScore: number;
  teamworkScore: number;
  skillKnowledgeScore: number;
  disciplineScore: number;
  overallScore: number;
  grade: string;
  strengths?: string | null;
  improvements?: string | null;
  recommendation?: string | null;
  remarks?: string | null;
  status: string;
  createdAt: string;
  updatedAt: string;
}

interface Props {
  initialAppraisals: PerformanceAppraisal[];
  employees: EmployeeSimple[];
  departments: string[];
  userRole?: string;
}

const GRADE_CONFIG: Record<string, { labelKh: string; labelEn: string; labelZh: string; bg: string; text: string; icon: string }> = {
  A: { labelKh: 'ឆ្នើម (A)', labelEn: 'Outstanding', labelZh: '优秀', bg: '#dcfce7', text: '#15803d', icon: '🌟' },
  B: { labelKh: 'ល្អ (B)', labelEn: 'Good', labelZh: '良好', bg: '#e0f2fe', text: '#0369a1', icon: '🟢' },
  C: { labelKh: 'មធ្យម (C)', labelEn: 'Average', labelZh: '中等', bg: '#fef3c7', text: '#b45309', icon: '🟡' },
  D: { labelKh: 'ក្រោមមធ្យម (D)', labelEn: 'Below Average', labelZh: '较低', bg: '#ffedd5', text: '#c2410c', icon: '🟠' },
  F: { labelKh: 'ខ្សោយ (F)', labelEn: 'Unsatisfactory', labelZh: '不合格', bg: '#fee2e2', text: '#b91c1c', icon: '🔴' }
};

const RECOMMEND_CONFIG: Record<string, { labelKh: string; labelEn: string; color: string }> = {
  PROMOTION: { labelKh: 'ដំឡើងតួនាទី', labelEn: 'Promotion', color: '#16a34a' },
  SALARY_INCREMENT: { labelKh: 'ដំឡើងប្រាក់ខែ', labelEn: 'Salary Increment', color: '#0284c7' },
  TRAINING: { labelKh: 'បណ្តុះបណ្តាលបន្ថែម', labelEn: 'Need Training', color: '#d97706' },
  MAINTAIN: { labelKh: 'រក្សាកម្រិតដដែល', labelEn: 'Maintain Current', color: '#64748b' },
  WARNING: { labelKh: 'ព្រមានកែលម្អ', labelEn: 'PIP / Warning', color: '#dc2626' }
};

const PERIODS = [
  '2026 Q1', '2026 Q2', '2026 Q3', '2026 Q4', '2026 Annual',
  '2025 Q1', '2025 Q2', '2025 Q3', '2025 Q4', '2025 Annual'
];

export default function PerformanceClient({ initialAppraisals, employees, departments, userRole = 'ADMIN' }: Props) {
  const isHR = userRole === 'ADMIN' || userRole === 'HR_MANAGER' || userRole === 'HR' || userRole === 'DEPT_HEAD';

  const [appraisals, setAppraisals] = useState<PerformanceAppraisal[]>(initialAppraisals);
  const [loading, setLoading] = useState<boolean>(false);

  // Filters
  const [search, setSearch] = useState<string>('');
  const [periodFilter, setPeriodFilter] = useState<string>('ALL');
  const [departmentFilter, setDepartmentFilter] = useState<string>('ALL');
  const [gradeFilter, setGradeFilter] = useState<string>('ALL');

  // Modal State
  const [showModal, setShowModal] = useState<boolean>(false);
  const [editingAppraisal, setEditingAppraisal] = useState<PerformanceAppraisal | null>(null);

  // Assessment Slip Preview Modal
  const [slipAppraisal, setSlipAppraisal] = useState<PerformanceAppraisal | null>(null);

  // Form State
  const [form, setForm] = useState({
    employeeId: employees[0]?.id || '',
    period: '2026 Q1',
    reviewDate: new Date().toISOString().split('T')[0],
    reviewerName: 'គណៈកម្មការវាយតម្លៃ (Evaluation Committee)',
    workQualityScore: 85,
    productivityScore: 85,
    teamworkScore: 85,
    skillKnowledgeScore: 85,
    disciplineScore: 90,
    strengths: '',
    improvements: '',
    recommendation: 'MAINTAIN',
    remarks: '',
    status: 'SUBMITTED'
  });

  // Dynamic Overall Score & Grade Calculation
  const computedOverall = useMemo(() => {
    const total =
      Number(form.workQualityScore) +
      Number(form.productivityScore) +
      Number(form.teamworkScore) +
      Number(form.skillKnowledgeScore) +
      Number(form.disciplineScore);
    const avg = Math.round((total / 5) * 10) / 10;
    let gr = 'F';
    if (avg >= 90) gr = 'A';
    else if (avg >= 80) gr = 'B';
    else if (avg >= 70) gr = 'C';
    else if (avg >= 60) gr = 'D';
    return { avg, gr };
  }, [form.workQualityScore, form.productivityScore, form.teamworkScore, form.skillKnowledgeScore, form.disciplineScore]);

  // Filtered appraisals
  const filteredAppraisals = useMemo(() => {
    return appraisals.filter(app => {
      const emp = app.employee;
      const fullName = `${emp.firstNameEn} ${emp.lastNameEn} ${emp.firstNameKh || ''} ${emp.lastNameKh || ''}`.toLowerCase();
      const matchesSearch = !search ||
        fullName.includes(search.toLowerCase()) ||
        emp.employeeId.toLowerCase().includes(search.toLowerCase()) ||
        app.period.toLowerCase().includes(search.toLowerCase());

      const matchesPeriod = periodFilter === 'ALL' || app.period === periodFilter;
      const matchesDept = departmentFilter === 'ALL' || emp.department === departmentFilter;
      const matchesGrade = gradeFilter === 'ALL' || app.grade === gradeFilter;

      return matchesSearch && matchesPeriod && matchesDept && matchesGrade;
    });
  }, [appraisals, search, periodFilter, departmentFilter, gradeFilter]);

  // Statistics
  const stats = useMemo(() => {
    let gradeA = 0;
    let gradeB = 0;
    let needsImprovement = 0;
    appraisals.forEach(a => {
      if (a.grade === 'A') gradeA++;
      else if (a.grade === 'B') gradeB++;
      else needsImprovement++;
    });
    return {
      total: appraisals.length,
      gradeA,
      gradeB,
      needsImprovement
    };
  }, [appraisals]);

  // Open Create
  const handleOpenCreate = () => {
    setEditingAppraisal(null);
    setForm({
      employeeId: employees[0]?.id || '',
      period: '2026 Q1',
      reviewDate: new Date().toISOString().split('T')[0],
      reviewerName: 'គណៈកម្មការវាយតម្លៃ (Evaluation Committee)',
      workQualityScore: 85,
      productivityScore: 85,
      teamworkScore: 85,
      skillKnowledgeScore: 85,
      disciplineScore: 90,
      strengths: '',
      improvements: '',
      recommendation: 'MAINTAIN',
      remarks: '',
      status: 'SUBMITTED'
    });
    setShowModal(true);
  };

  // Open Edit
  const handleOpenEdit = (app: PerformanceAppraisal) => {
    setEditingAppraisal(app);
    setForm({
      employeeId: app.employeeId,
      period: app.period,
      reviewDate: new Date(app.reviewDate).toISOString().split('T')[0],
      reviewerName: app.reviewerName,
      workQualityScore: app.workQualityScore,
      productivityScore: app.productivityScore,
      teamworkScore: app.teamworkScore,
      skillKnowledgeScore: app.skillKnowledgeScore,
      disciplineScore: app.disciplineScore,
      strengths: app.strengths || '',
      improvements: app.improvements || '',
      recommendation: app.recommendation || 'MAINTAIN',
      remarks: app.remarks || '',
      status: app.status
    });
    setShowModal(true);
  };

  // Save (Create or Update)
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.employeeId || !form.period) {
      Swal.fire({
        icon: 'warning',
        title: 'សូមបំពេញព័ត៌មាន (Required)',
        text: 'សូមជ្រើសរើសបុគ្គលិក និងដំណាក់កាលវាយតម្លៃ (Period)'
      });
      return;
    }

    setLoading(true);
    try {
      const isEditing = Boolean(editingAppraisal);
      const url = '/api/performance';
      const method = isEditing ? 'PUT' : 'POST';
      const payload = isEditing ? { id: editingAppraisal!.id, ...form } : form;

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to save appraisal');
      }

      const savedData: PerformanceAppraisal = await res.json();

      if (isEditing) {
        setAppraisals(prev => prev.map(a => a.id === savedData.id ? savedData : a));
      } else {
        // If upsert replaced existing with same employeeId + period
        const filtered = appraisals.filter(a => !(a.employeeId === savedData.employeeId && a.period === savedData.period));
        setAppraisals([savedData, ...filtered]);
      }

      setShowModal(false);
      Swal.fire({
        icon: 'success',
        title: 'ជោគជ័យ (Saved)',
        text: isEditing ? 'បានកែប្រែការវាយតម្លៃរួចរាល់' : 'បានរក្សាទុកការវាយតម្លៃការងារដោយជោគជ័យ',
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

  // Delete
  const handleDelete = async (app: PerformanceAppraisal) => {
    const result = await Swal.fire({
      title: 'តើអ្នកប្រាកដទេ? (Are you sure?)',
      text: `ចង់លុបការវាយតម្លៃរបស់ ${app.employee.firstNameEn} (${app.period}) មែនទេ?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'បាទ/ចាស លុប (Yes, Delete)',
      cancelButtonText: 'បោះបង់ (Cancel)'
    });

    if (!result.isConfirmed) return;

    try {
      const res = await fetch(`/api/performance?id=${app.id}`, {
        method: 'DELETE'
      });

      if (res.ok) {
        setAppraisals(prev => prev.filter(a => a.id !== app.id));
        Swal.fire({
          icon: 'success',
          title: 'បានលុប (Deleted)',
          text: 'ការវាយតម្លៃត្រូវបានលុបរួចរាល់',
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
      const exportData = filteredAppraisals.map((app, index) => {
        const emp = app.employee;
        const gradeConf = GRADE_CONFIG[app.grade] || { labelKh: app.grade, labelEn: app.grade, labelZh: app.grade };
        const recConf = RECOMMEND_CONFIG[app.recommendation || 'MAINTAIN'] || { labelKh: app.recommendation, labelEn: app.recommendation };

        return {
          'ល.រ\nNo.\n序号': index + 1,
          'អត្តលេខ\nEmp ID\n工号': emp.employeeId,
          'គោត្តនាម-នាម\nFull Name\n姓名': `${emp.lastNameKh || ''} ${emp.firstNameKh || ''} (${emp.firstNameEn} ${emp.lastNameEn})`.trim(),
          'ផ្នែក\nDepartment\n部门': emp.department,
          'តួនាទី\nPosition\n职位': emp.position,
          'ដំណាក់កាលវាយតម្លៃ\nPeriod\n考核周期': app.period,
          'គុណភាពការងារ\nQuality\n工作质量': `${app.workQualityScore}%`,
          'ទិន្នផល\nProductivity\n工作效率': `${app.productivityScore}%`,
          'ការសហការ\nTeamwork\n团队合作': `${app.teamworkScore}%`,
          'ជំនាញ\nSkill\n技能知识': `${app.skillKnowledgeScore}%`,
          'វិន័យ\nDiscipline\n考勤纪律': `${app.disciplineScore}%`,
          'ពិន្ទុសរុប\nOverall Score\n总分': `${app.overallScore}%`,
          'និទ្ទេស\nGrade\n等级': `${gradeConf.labelKh} (${gradeConf.labelEn} / ${gradeConf.labelZh})`,
          'សំណើអនុវត្ត\nRecommendation\n建议措施': `${recConf.labelKh} (${recConf.labelEn})`,
          'អ្នកវាយតម្លៃ\nReviewer\n考评人': app.reviewerName,
          'កាលបរិច្ឆេទ\nReview Date\n评估日期': new Date(app.reviewDate).toISOString().split('T')[0],
        };
      });

      const ws = XLSX.utils.json_to_sheet(exportData);
      ws['!cols'] = autoFitColumns(exportData);

      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Appraisals');
      XLSX.writeFile(wb, `Performance_Appraisal_${new Date().toISOString().split('T')[0]}.xlsx`);

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
          <span style={{ fontSize: '30px' }}>🎯</span>
          <div>
            <h1 style={{ margin: 0, fontSize: '1.6rem', fontWeight: 800, color: '#0f172a' }}>
              ការវាយតម្លៃការបំពេញការងារ
            </h1>
            <p style={{ margin: '4px 0 0 0', color: '#64748b', fontSize: '0.88rem' }}>
              Performance Appraisal & Employee 360 Review • 员工绩效考核与综合评估
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <a
            href="/dashboard/kpi"
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
            <span>📈</span>
            <span>គោលដៅ KPI តាមផ្នែក (Department KPIs)</span>
          </a>

          {isHR && (
            <button
              onClick={handleOpenCreate}
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
                boxShadow: '0 4px 12px rgba(37, 99, 235, 0.25)'
              }}
            >
              <span>➕</span>
              <div style={{ textAlign: 'left', lineHeight: 1.2 }}>
                <div>វាយតម្លៃថ្មី</div>
                <div style={{ fontSize: '0.7rem', opacity: 0.85 }}>New Appraisal • 新增评估</div>
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
        {/* Card 1: Total Appraisals */}
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
            📊
          </div>
          <div>
            <div style={{ fontWeight: 800, fontSize: '0.95rem', color: '#0f172a' }}>ការវាយតម្លៃសរុប</div>
            <div style={{ fontSize: '0.72rem', color: '#64748b' }}>Total Appraisals • 评估总数</div>
            <div style={{ fontSize: '1.7rem', fontWeight: 900, color: '#0284c7', marginTop: '4px' }}>
              {stats.total}
            </div>
          </div>
        </div>

        {/* Card 2: Grade A */}
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
            🌟
          </div>
          <div>
            <div style={{ fontWeight: 800, fontSize: '0.95rem', color: '#0f172a' }}>និទ្ទេស A (ឆ្នើម)</div>
            <div style={{ fontSize: '0.72rem', color: '#64748b' }}>Grade A Outstanding • 优秀</div>
            <div style={{ fontSize: '1.7rem', fontWeight: 900, color: '#15803d', marginTop: '4px' }}>
              {stats.gradeA}
            </div>
          </div>
        </div>

        {/* Card 3: Grade B */}
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
            color: '#0369a1',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '24px'
          }}>
            🟢
          </div>
          <div>
            <div style={{ fontWeight: 800, fontSize: '0.95rem', color: '#0f172a' }}>និទ្ទេស B (ល្អ)</div>
            <div style={{ fontSize: '0.72rem', color: '#64748b' }}>Grade B Good • 良好</div>
            <div style={{ fontSize: '1.7rem', fontWeight: 900, color: '#0369a1', marginTop: '4px' }}>
              {stats.gradeB}
            </div>
          </div>
        </div>

        {/* Card 4: Needs Improvement */}
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
            color: '#b91c1c',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '24px'
          }}>
            ⚠️
          </div>
          <div>
            <div style={{ fontWeight: 800, fontSize: '0.95rem', color: '#0f172a' }}>ត្រូវការកែលម្អ (C/D/F)</div>
            <div style={{ fontSize: '0.72rem', color: '#64748b' }}>Needs Improvement • 需改进</div>
            <div style={{ fontSize: '1.7rem', fontWeight: 900, color: '#b91c1c', marginTop: '4px' }}>
              {stats.needsImprovement}
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
            placeholder="ស្វែងរកតាមឈ្មោះ ឬអត្តលេខ (Search Name or ID)..."
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

        {/* Period Filter */}
        <div style={{ minWidth: '160px' }}>
          <select
            value={periodFilter}
            onChange={e => setPeriodFilter(e.target.value)}
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
            <option value="ALL">📅 គ្រប់ដំណាក់កាល (All Periods)</option>
            {PERIODS.map(p => (
              <option key={p} value={p}>{p}</option>
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

        {/* Grade Filter */}
        <div style={{ minWidth: '160px' }}>
          <select
            value={gradeFilter}
            onChange={e => setGradeFilter(e.target.value)}
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
            <option value="ALL">🎖️ គ្រប់និទ្ទេស (All Grades)</option>
            {Object.entries(GRADE_CONFIG).map(([k, v]) => (
              <option key={k} value={k}>{v.icon} {v.labelKh} ({v.labelEn})</option>
            ))}
          </select>
        </div>
      </div>

      {/* Performance Appraisals Table (3-Languages on All TH) */}
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

                {/* 3: Period */}
                <th style={{ padding: '14px 16px', minWidth: '120px' }}>
                  <div style={{ fontWeight: 800, color: '#0f172a', fontSize: '0.9rem' }}>ដំណាក់កាល</div>
                  <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600 }}>Period</div>
                  <div style={{ fontSize: '0.68rem', color: '#94a3b8' }}>考核周期</div>
                </th>

                {/* 4: Evaluation Breakdown (5 Pillars) */}
                <th style={{ padding: '14px 16px', minWidth: '260px' }}>
                  <div style={{ fontWeight: 800, color: '#0f172a', fontSize: '0.9rem' }}>លទ្ធផល ៥ សសរស្តម្ភ (Pillars)</div>
                  <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600 }}>Evaluation Pillars Breakdown</div>
                  <div style={{ fontSize: '0.68rem', color: '#94a3b8' }}>五个评估维度得分</div>
                </th>

                {/* 5: Overall Score */}
                <th style={{ padding: '14px 16px', minWidth: '110px', textAlign: 'center' }}>
                  <div style={{ fontWeight: 800, color: '#0f172a', fontSize: '0.9rem' }}>ពិន្ទុសរុប</div>
                  <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600 }}>Overall Score</div>
                  <div style={{ fontSize: '0.68rem', color: '#94a3b8' }}>总分</div>
                </th>

                {/* 6: Grade */}
                <th style={{ padding: '14px 16px', minWidth: '110px', textAlign: 'center' }}>
                  <div style={{ fontWeight: 800, color: '#0f172a', fontSize: '0.9rem' }}>និទ្ទេស</div>
                  <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600 }}>Grade</div>
                  <div style={{ fontSize: '0.68rem', color: '#94a3b8' }}>等级</div>
                </th>

                {/* 7: Recommendation */}
                <th style={{ padding: '14px 16px', minWidth: '160px' }}>
                  <div style={{ fontWeight: 800, color: '#0f172a', fontSize: '0.9rem' }}>សំណើអនុវត្ត</div>
                  <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600 }}>Recommendation</div>
                  <div style={{ fontSize: '0.68rem', color: '#94a3b8' }}>建议措施</div>
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
              {filteredAppraisals.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ padding: '48px', textAlign: 'center', color: '#64748b' }}>
                    <div style={{ fontSize: '36px', marginBottom: '8px' }}>🎯</div>
                    <div style={{ fontWeight: 700, fontSize: '1.1rem' }}>មិនមានទិន្នន័យវាយតម្លៃត្រូវបង្ហាញទេ</div>
                    <div style={{ fontSize: '0.85rem' }}>No performance appraisal records found</div>
                  </td>
                </tr>
              ) : (
                filteredAppraisals.map((app, index) => {
                  const emp = app.employee;
                  const gradeConf = GRADE_CONFIG[app.grade] || { labelKh: app.grade, labelEn: app.grade, labelZh: app.grade, bg: '#f1f5f9', text: '#475569', icon: '·' };
                  const recConf = RECOMMEND_CONFIG[app.recommendation || 'MAINTAIN'] || { labelKh: app.recommendation, labelEn: app.recommendation, color: '#64748b' };

                  return (
                    <tr
                      key={app.id}
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

                      {/* Period */}
                      <td style={{ padding: '14px 16px' }}>
                        <span style={{
                          display: 'inline-block',
                          padding: '4px 10px',
                          borderRadius: '8px',
                          background: '#f1f5f9',
                          color: '#1e293b',
                          fontWeight: 700,
                          fontSize: '0.82rem'
                        }}>
                          {app.period}
                        </span>
                      </td>

                      {/* 5 Pillars Breakdown Mini Badges */}
                      <td style={{ padding: '14px 16px' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '0.78rem' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', color: '#475569' }}>
                            <span>គុណភាព / Quality:</span>
                            <strong>{app.workQualityScore}%</strong>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', color: '#475569' }}>
                            <span>ទិន្នផល / Productivity:</span>
                            <strong>{app.productivityScore}%</strong>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', color: '#475569' }}>
                            <span>ការសហការ / Teamwork:</span>
                            <strong>{app.teamworkScore}%</strong>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', color: '#475569' }}>
                            <span>វិន័យ / Discipline:</span>
                            <strong>{app.disciplineScore}%</strong>
                          </div>
                        </div>
                      </td>

                      {/* Overall Score */}
                      <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                        <div style={{ fontSize: '1.25rem', fontWeight: 900, color: '#0f172a' }}>
                          {app.overallScore}%
                        </div>
                      </td>

                      {/* Grade Badge */}
                      <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          padding: '6px 12px',
                          borderRadius: '8px',
                          background: gradeConf.bg,
                          color: gradeConf.text,
                          fontWeight: 800,
                          fontSize: '0.85rem'
                        }}>
                          <span>{gradeConf.icon}</span>
                          <span>{app.grade}</span>
                        </span>
                      </td>

                      {/* Recommendation */}
                      <td style={{ padding: '14px 16px' }}>
                        <div style={{ fontWeight: 700, color: recConf.color, fontSize: '0.85rem' }}>
                          {recConf.labelKh}
                        </div>
                        <div style={{ fontSize: '0.72rem', color: '#64748b' }}>
                          {recConf.labelEn}
                        </div>
                      </td>

                      {/* Actions */}
                      <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                          {/* Slip Preview / Print */}
                          <button
                            onClick={() => setSlipAppraisal(app)}
                            title="មើល និងបោះពុម្ពទម្រង់វាយតម្លៃ (Evaluation Slip)"
                            style={{
                              background: '#eff6ff',
                              border: '1px solid #bfdbfe',
                              color: '#2563eb',
                              padding: '6px 10px',
                              borderRadius: '8px',
                              cursor: 'pointer',
                              fontWeight: 700,
                              fontSize: '0.8rem'
                            }}
                          >
                            📄 សន្លឹកវាយតម្លៃ
                          </button>

                          {isHR && (
                            <>
                              <button
                                onClick={() => handleOpenEdit(app)}
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
                                onClick={() => handleDelete(app)}
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

      {/* Add / Edit Appraisal Modal */}
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
              background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
              color: '#ffffff',
              padding: '20px 24px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800 }}>
                  {editingAppraisal ? 'កែប្រែការវាយតម្លៃ' : 'ការវាយតម្លៃការបំពេញការងារថ្មី'}
                </h3>
                <div style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: '4px' }}>
                  {editingAppraisal ? 'Edit Performance Appraisal' : 'New Performance Appraisal • 绩效评估'}
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
              {/* Employee & Period */}
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '6px', fontWeight: 700, fontSize: '0.88rem', color: '#1e293b' }}>
                    បុគ្គលិកត្រូវវាយតម្លៃ (Employee) *
                  </label>
                  <select
                    value={form.employeeId}
                    onChange={e => setForm({ ...form, employeeId: e.target.value })}
                    disabled={Boolean(editingAppraisal)}
                    required
                    style={{
                      width: '100%',
                      padding: '10px',
                      borderRadius: '8px',
                      border: '1px solid #cbd5e1',
                      fontSize: '0.9rem',
                      background: editingAppraisal ? '#f8fafc' : '#ffffff'
                    }}
                  >
                    {employees.map(emp => (
                      <option key={emp.id} value={emp.id}>
                        {emp.employeeId} - {emp.firstNameEn} {emp.lastNameEn} ({emp.department} - {emp.position})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '6px', fontWeight: 700, fontSize: '0.88rem', color: '#1e293b' }}>
                    ដំណាក់កាល (Period) *
                  </label>
                  <select
                    value={form.period}
                    onChange={e => setForm({ ...form, period: e.target.value })}
                    disabled={Boolean(editingAppraisal)}
                    required
                    style={{
                      width: '100%',
                      padding: '10px',
                      borderRadius: '8px',
                      border: '1px solid #cbd5e1',
                      fontSize: '0.9rem',
                      background: editingAppraisal ? '#f8fafc' : '#ffffff'
                    }}
                  >
                    {PERIODS.map(p => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* 5 Scoring Pillars */}
              <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                <div style={{ fontWeight: 800, fontSize: '0.92rem', color: '#0f172a', marginBottom: '12px' }}>
                  📊 ពិន្ទុតាមសសរស្តម្ភទាំង ៥ (Pillars 0-100%):
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px' }}>
                  {/* Quality */}
                  <div>
                    <label style={{ display: 'block', marginBottom: '4px', fontSize: '0.8rem', fontWeight: 700, color: '#334155' }}>
                      គុណភាពការងារ (Quality %)
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={form.workQualityScore}
                      onChange={e => setForm({ ...form, workQualityScore: Number(e.target.value) })}
                      style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1', boxSizing: 'border-box' }}
                    />
                  </div>

                  {/* Productivity */}
                  <div>
                    <label style={{ display: 'block', marginBottom: '4px', fontSize: '0.8rem', fontWeight: 700, color: '#334155' }}>
                      ទិន្នផល (Productivity %)
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={form.productivityScore}
                      onChange={e => setForm({ ...form, productivityScore: Number(e.target.value) })}
                      style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1', boxSizing: 'border-box' }}
                    />
                  </div>

                  {/* Teamwork */}
                  <div>
                    <label style={{ display: 'block', marginBottom: '4px', fontSize: '0.8rem', fontWeight: 700, color: '#334155' }}>
                      ការសហការ (Teamwork %)
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={form.teamworkScore}
                      onChange={e => setForm({ ...form, teamworkScore: Number(e.target.value) })}
                      style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1', boxSizing: 'border-box' }}
                    />
                  </div>

                  {/* Skill */}
                  <div>
                    <label style={{ display: 'block', marginBottom: '4px', fontSize: '0.8rem', fontWeight: 700, color: '#334155' }}>
                      ចំណេះដឹង/ជំនាញ (Skill %)
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={form.skillKnowledgeScore}
                      onChange={e => setForm({ ...form, skillKnowledgeScore: Number(e.target.value) })}
                      style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1', boxSizing: 'border-box' }}
                    />
                  </div>

                  {/* Discipline */}
                  <div>
                    <label style={{ display: 'block', marginBottom: '4px', fontSize: '0.8rem', fontWeight: 700, color: '#334155' }}>
                      វិន័យ/វត្តមាន (Discipline %)
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={form.disciplineScore}
                      onChange={e => setForm({ ...form, disciplineScore: Number(e.target.value) })}
                      style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1', boxSizing: 'border-box' }}
                    />
                  </div>
                </div>

                {/* Real-time Calculation Result */}
                <div style={{
                  marginTop: '14px',
                  padding: '10px 14px',
                  background: '#ffffff',
                  borderRadius: '8px',
                  border: '1px dashed #cbd5e1',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <div style={{ fontWeight: 700, color: '#1e293b', fontSize: '0.9rem' }}>
                    ពិន្ទុមធ្យមសរុប (Overall Average):
                    <span style={{ color: '#2563eb', fontSize: '1.2rem', fontWeight: 900, marginLeft: '8px' }}>
                      {computedOverall.avg}%
                    </span>
                  </div>
                  <div>
                    <span style={{
                      padding: '4px 12px',
                      borderRadius: '6px',
                      background: GRADE_CONFIG[computedOverall.gr]?.bg,
                      color: GRADE_CONFIG[computedOverall.gr]?.text,
                      fontWeight: 900,
                      fontSize: '0.9rem'
                    }}>
                      និទ្ទេស: {computedOverall.gr} ({GRADE_CONFIG[computedOverall.gr]?.labelEn})
                    </span>
                  </div>
                </div>
              </div>

              {/* Strengths & Improvements */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '6px', fontWeight: 700, fontSize: '0.85rem', color: '#1e293b' }}>
                    ចំណុចខ្លាំង (Key Strengths)
                  </label>
                  <textarea
                    rows={2}
                    placeholder="ចំណុចលេចធ្លោ ឬសមិទ្ធផលល្អ..."
                    value={form.strengths}
                    onChange={e => setForm({ ...form, strengths: e.target.value })}
                    style={{ width: '100%', padding: '8px', borderRadius: '8px', border: '1px solid #cbd5e1', boxSizing: 'border-box', fontSize: '0.88rem' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '6px', fontWeight: 700, fontSize: '0.85rem', color: '#1e293b' }}>
                    ចំណុចត្រូវកែលម្អ (Areas for Improvement)
                  </label>
                  <textarea
                    rows={2}
                    placeholder="ចំណុចដែលត្រូវពង្រឹងបន្ថែម..."
                    value={form.improvements}
                    onChange={e => setForm({ ...form, improvements: e.target.value })}
                    style={{ width: '100%', padding: '8px', borderRadius: '8px', border: '1px solid #cbd5e1', boxSizing: 'border-box', fontSize: '0.88rem' }}
                  />
                </div>
              </div>

              {/* Recommendation & Reviewer Name */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '6px', fontWeight: 700, fontSize: '0.88rem', color: '#1e293b' }}>
                    សំណើវិធានការ (Recommendation) *
                  </label>
                  <select
                    value={form.recommendation}
                    onChange={e => setForm({ ...form, recommendation: e.target.value })}
                    style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.9rem' }}
                  >
                    {Object.entries(RECOMMEND_CONFIG).map(([k, v]) => (
                      <option key={k} value={k}>
                        {v.labelKh} ({v.labelEn})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '6px', fontWeight: 700, fontSize: '0.88rem', color: '#1e293b' }}>
                    អ្នកវាយតម្លៃ (Reviewer Name)
                  </label>
                  <input
                    type="text"
                    value={form.reviewerName}
                    onChange={e => setForm({ ...form, reviewerName: e.target.value })}
                    style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.9rem', boxSizing: 'border-box' }}
                  />
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
                    background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
                    color: '#ffffff',
                    fontWeight: 700,
                    cursor: 'pointer',
                    boxShadow: '0 2px 8px rgba(37, 99, 235, 0.3)'
                  }}
                >
                  {loading ? 'កំពុងរក្សាទុក...' : '💾 រក្សាទុក (Save)'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Official Assessment Slip Modal */}
      {slipAppraisal && (
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
                <span>🎯</span>
                <span>ទម្រង់វាយតម្លៃការងារផ្លូវការ (Official Performance Appraisal Slip)</span>
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
                  onClick={() => setSlipAppraisal(null)}
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
                  <div style={{ fontSize: '0.85rem' }}>ការិយាល័យគ្រប់គ្រងធនធានមនុស្ស (Human Resources Department)</div>
                </div>
                <div style={{ textAlign: 'right', fontSize: '0.85rem' }}>
                  <div>ដំណាក់កាល: <strong>{slipAppraisal.period}</strong></div>
                  <div>កាលបរិច្ឆេទ: {new Date(slipAppraisal.reviewDate).toISOString().split('T')[0]}</div>
                </div>
              </div>

              {/* Form Title */}
              <div style={{ textAlign: 'center', margin: '20px 0' }}>
                <h2 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 900, textDecoration: 'underline' }}>
                  សន្លឹកវាយតម្លៃលទ្ធផលការងារបុគ្គលិក
                </h2>
                <div style={{ fontSize: '0.95rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', marginTop: '4px' }}>
                  EMPLOYEE PERFORMANCE APPRAISAL REPORT
                </div>
              </div>

              {/* Employee Particulars Table */}
              <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '20px', border: '1px solid #cbd5e1' }}>
                <tbody>
                  <tr style={{ background: '#f8fafc' }}>
                    <td style={{ padding: '8px 12px', fontWeight: 700, width: '25%', border: '1px solid #cbd5e1' }}>គោត្តនាម និងនាម:</td>
                    <td style={{ padding: '8px 12px', border: '1px solid #cbd5e1' }}>
                      {slipAppraisal.employee.lastNameKh || ''} {slipAppraisal.employee.firstNameKh || ''} ({slipAppraisal.employee.firstNameEn} {slipAppraisal.employee.lastNameEn})
                    </td>
                    <td style={{ padding: '8px 12px', fontWeight: 700, width: '20%', border: '1px solid #cbd5e1' }}>អត្តលេខ:</td>
                    <td style={{ padding: '8px 12px', border: '1px solid #cbd5e1', fontWeight: 700, color: '#1e40af' }}>
                      {slipAppraisal.employee.employeeId}
                    </td>
                  </tr>
                  <tr>
                    <td style={{ padding: '8px 12px', fontWeight: 700, border: '1px solid #cbd5e1' }}>ផ្នែក / Department:</td>
                    <td style={{ padding: '8px 12px', border: '1px solid #cbd5e1' }}>{slipAppraisal.employee.department}</td>
                    <td style={{ padding: '8px 12px', fontWeight: 700, border: '1px solid #cbd5e1' }}>តួនាទី / Position:</td>
                    <td style={{ padding: '8px 12px', border: '1px solid #cbd5e1' }}>{slipAppraisal.employee.position}</td>
                  </tr>
                </tbody>
              </table>

              {/* Pillars Score Table */}
              <div style={{ marginBottom: '20px' }}>
                <div style={{ fontWeight: 800, fontSize: '1rem', marginBottom: '8px' }}>
                  លទ្ធផលពិន្ទុតាមសសរស្តម្ភនីមួយៗ (Pillars Evaluation Scores):
                </div>
                <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #cbd5e1', textAlign: 'center' }}>
                  <thead>
                    <tr style={{ background: '#f1f5f9' }}>
                      <th style={{ padding: '8px', border: '1px solid #cbd5e1' }}>១. គុណភាពការងារ (Quality)</th>
                      <th style={{ padding: '8px', border: '1px solid #cbd5e1' }}>២. ទិន្នផល (Productivity)</th>
                      <th style={{ padding: '8px', border: '1px solid #cbd5e1' }}>៣. ការសហការ (Teamwork)</th>
                      <th style={{ padding: '8px', border: '1px solid #cbd5e1' }}>៤. ជំនាញ (Skill)</th>
                      <th style={{ padding: '8px', border: '1px solid #cbd5e1' }}>៥. វិន័យ (Discipline)</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td style={{ padding: '10px', border: '1px solid #cbd5e1', fontWeight: 800, fontSize: '1.1rem' }}>{slipAppraisal.workQualityScore}%</td>
                      <td style={{ padding: '10px', border: '1px solid #cbd5e1', fontWeight: 800, fontSize: '1.1rem' }}>{slipAppraisal.productivityScore}%</td>
                      <td style={{ padding: '10px', border: '1px solid #cbd5e1', fontWeight: 800, fontSize: '1.1rem' }}>{slipAppraisal.teamworkScore}%</td>
                      <td style={{ padding: '10px', border: '1px solid #cbd5e1', fontWeight: 800, fontSize: '1.1rem' }}>{slipAppraisal.skillKnowledgeScore}%</td>
                      <td style={{ padding: '10px', border: '1px solid #cbd5e1', fontWeight: 800, fontSize: '1.1rem' }}>{slipAppraisal.disciplineScore}%</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Overall Score & Grade Callout */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-around',
                alignItems: 'center',
                padding: '16px',
                background: '#f8fafc',
                borderRadius: '8px',
                border: '2px solid #cbd5e1',
                marginBottom: '20px'
              }}>
                <div>
                  <div style={{ fontSize: '0.9rem', color: '#64748b' }}>ពិន្ទុសរុបជាមធ្យម (Overall Score):</div>
                  <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#1e3a8a' }}>{slipAppraisal.overallScore}%</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.9rem', color: '#64748b' }}>និទ្ទេសសរុប (Overall Grade):</div>
                  <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#15803d' }}>
                    {slipAppraisal.grade} ({GRADE_CONFIG[slipAppraisal.grade]?.labelKh})
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '0.9rem', color: '#64748b' }}>សំណើអនុវត្ត (Recommendation):</div>
                  <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0369a1' }}>
                    {RECOMMEND_CONFIG[slipAppraisal.recommendation || 'MAINTAIN']?.labelKh}
                  </div>
                </div>
              </div>

              {/* Comments & Strengths */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.9rem', marginBottom: '24px' }}>
                <div>
                  <strong>• ចំណុចខ្លាំង (Key Strengths):</strong> {slipAppraisal.strengths || 'បំពេញការងារបានល្អតាមការចាត់តាំង។'}
                </div>
                <div>
                  <strong>• ចំណុចត្រូវកែលម្អ (Areas to Improve):</strong> {slipAppraisal.improvements || 'បន្តពង្រឹងជំនាញបន្ថែម។'}
                </div>
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
                  <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>ហត្ថលេខាសាមីខ្លួន</div>
                  <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Employee Signature</div>
                  <div style={{ height: '60px', borderBottom: '1px dashed #94a3b8', margin: '10px 20px' }}></div>
                  <div style={{ fontSize: '0.82rem' }}>កាលបរិច្ឆេទ: ......./......./...........</div>
                </div>

                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>អ្នកវាយតម្លៃ / ប្រធានផ្នែក</div>
                  <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Supervisor / Reviewer</div>
                  <div style={{ height: '60px', borderBottom: '1px dashed #94a3b8', margin: '10px 20px' }}></div>
                  <div style={{ fontSize: '0.82rem' }}>កាលបរិច្ឆេទ: ......./......./...........</div>
                </div>

                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>នាយកធនធានមនុស្ស</div>
                  <div style={{ fontSize: '0.75rem', color: '#64748b' }}>HR Director</div>
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
