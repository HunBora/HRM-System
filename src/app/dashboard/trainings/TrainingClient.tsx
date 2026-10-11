'use client';

import React, { useState } from 'react';
import Swal from 'sweetalert2';
import * as XLSX from 'xlsx';

interface EmployeeSimple {
  id: string;
  employeeId: string;
  firstNameEn: string;
  lastNameEn: string;
  position: string;
  department: string;
}

interface TrainingProgram {
  id: string;
  title: string;
  description?: string | null;
  trainer?: string | null;
  location?: string | null;
  startDate: string;
  endDate: string;
  cost: number;
  status: string;
  createdAt: string;
  _count?: {
    enrollments: number;
  };
}

interface TrainingEnrollment {
  id: string;
  trainingId: string;
  training?: {
    id: string;
    title: string;
    startDate: string;
    endDate: string;
    trainer?: string | null;
  };
  employeeId: string;
  employee: EmployeeSimple;
  status: string;
  score?: number | null;
  feedback?: string | null;
  certificateUrl?: string | null;
  enrolledAt: string;
  completedAt?: string | null;
}

interface Props {
  initialTrainings: TrainingProgram[];
  initialEnrollments: TrainingEnrollment[];
  employees: EmployeeSimple[];
  userRole?: string;
}

const STATUS_COLORS: Record<string, { bg: string; text: string; labelKh: string }> = {
  UPCOMING: { bg: '#e0f2fe', text: '#0284c7', labelKh: 'នឹងមកដល់ (Upcoming)' },
  ONGOING: { bg: '#fef3c7', text: '#d97706', labelKh: 'កំពុងដំណើរការ (Ongoing)' },
  COMPLETED: { bg: '#dcfce7', text: '#15803d', labelKh: 'បានបញ្ចប់ (Completed)' },
  CANCELLED: { bg: '#fee2e2', text: '#b91c1c', labelKh: 'បានលុបចោល (Cancelled)' },

  ENROLLED: { bg: '#e0f2fe', text: '#0284c7', labelKh: 'បានចុះឈ្មោះ (Enrolled)' },
  FAILED: { bg: '#fee2e2', text: '#b91c1c', labelKh: 'ធ្លាក់ (Failed)' },
  DROPPED: { bg: '#f1f5f9', text: '#64748b', labelKh: 'បោះបង់ (Dropped)' },
};

export default function TrainingClient({ initialTrainings, initialEnrollments, employees, userRole = 'ADMIN' }: Props) {
  const isHR = userRole === 'ADMIN' || userRole === 'HR_MANAGER' || userRole === 'HR';
  const [activeTab, setActiveTab] = useState<'trainings' | 'enrollments'>('trainings');
  const [trainings, setTrainings] = useState<TrainingProgram[]>(initialTrainings);
  const [enrollments, setEnrollments] = useState<TrainingEnrollment[]>(initialEnrollments);
  const [loading, setLoading] = useState(false);

  // Filters
  const [trainingSearch, setTrainingSearch] = useState('');
  const [trainingStatusFilter, setTrainingStatusFilter] = useState('ALL');
  const [enrollmentSearch, setEnrollmentSearch] = useState('');
  const [enrollmentStatusFilter, setEnrollmentStatusFilter] = useState('ALL');
  const [enrollmentProgramFilter, setEnrollmentProgramFilter] = useState('ALL');

  // Training Modal
  const [showTrainingModal, setShowTrainingModal] = useState(false);
  const [editingTraining, setEditingTraining] = useState<TrainingProgram | null>(null);
  const [trainingForm, setTrainingForm] = useState({
    title: '',
    trainer: '',
    location: '',
    startDate: '',
    endDate: '',
    cost: '0',
    status: 'UPCOMING',
    description: '',
  });

  // Enroll Modal
  const [showEnrollModal, setShowEnrollModal] = useState(false);
  const [enrollForm, setEnrollForm] = useState({
    trainingId: '',
    employeeId: '',
    status: 'ENROLLED',
  });

  // Result / Certificate Modal
  const [showResultModal, setShowResultModal] = useState(false);
  const [selectedEnrollment, setSelectedEnrollment] = useState<TrainingEnrollment | null>(null);
  const [resultForm, setResultForm] = useState({
    status: 'COMPLETED',
    score: '',
    feedback: '',
    certificateUrl: '',
  });

  // Metrics
  const totalTrainings = trainings.length;
  const ongoingTrainings = trainings.filter(t => t.status === 'ONGOING').length;
  const totalTrainees = enrollments.length;
  const completedTrainees = enrollments.filter(e => e.status === 'COMPLETED').length;

  // Auto-fit Columns Helper for Excel
  const autoFitColumns = (data: any[]) => {
    if (!data || data.length === 0) return [];
    const keys = Object.keys(data[0]);
    return keys.map(key => {
      let maxLen = key.length;
      data.forEach(row => {
        const val = row[key] !== undefined && row[key] !== null ? String(row[key]) : '';
        if (val.length > maxLen) {
          maxLen = val.length;
        }
      });
      return { wch: Math.max(maxLen + 6, 16) };
    });
  };

  // --- Handlers: Training Programs ---
  const openCreateTrainingModal = () => {
    setEditingTraining(null);
    setTrainingForm({
      title: '',
      trainer: '',
      location: 'Office Room A',
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date().toISOString().split('T')[0],
      cost: '0',
      status: 'UPCOMING',
      description: '',
    });
    setShowTrainingModal(true);
  };

  const openEditTrainingModal = (item: TrainingProgram) => {
    setEditingTraining(item);
    setTrainingForm({
      title: item.title,
      trainer: item.trainer || '',
      location: item.location || '',
      startDate: new Date(item.startDate).toISOString().split('T')[0],
      endDate: new Date(item.endDate).toISOString().split('T')[0],
      cost: String(item.cost || 0),
      status: item.status,
      description: item.description || '',
    });
    setShowTrainingModal(true);
  };

  const handleSaveTraining = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const url = '/api/trainings';
      const method = editingTraining ? 'PUT' : 'POST';
      const payload = editingTraining ? { id: editingTraining.id, ...trainingForm } : trainingForm;

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error('Failed to save training program');

      const data = await res.json();
      if (editingTraining) {
        setTrainings(trainings.map(t => (t.id === data.id ? { ...data, _count: t._count } : t)));
        Swal.fire({ icon: 'success', title: 'បានកែប្រែដោយជោគជ័យ!', timer: 1500, showConfirmButton: false });
      } else {
        setTrainings([{ ...data, _count: { enrollments: 0 } }, ...trainings]);
        Swal.fire({ icon: 'success', title: 'បានបង្កើតវគ្គបណ្តុះបណ្តាលថ្មី!', timer: 1500, showConfirmButton: false });
      }

      setShowTrainingModal(false);
    } catch (err: any) {
      Swal.fire({ icon: 'error', title: 'មានបញ្ហា!', text: err.message });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTraining = async (id: string, title: string) => {
    const result = await Swal.fire({
      title: 'តើអ្នកប្រាកដទេ?',
      text: `តើអ្នកពិតជាចង់លុបវគ្គ "${title}" មែនទេ?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'បាទ/ចាស, លុប!',
      cancelButtonText: 'បោះបង់',
    });

    if (result.isConfirmed) {
      try {
        const res = await fetch(`/api/trainings?id=${id}`, { method: 'DELETE' });
        if (!res.ok) throw new Error('Failed to delete training');
        setTrainings(trainings.filter(t => t.id !== id));
        setEnrollments(enrollments.filter(e => e.trainingId !== id));
        Swal.fire({ icon: 'success', title: 'បានលុបរួចរាល់!', timer: 1500, showConfirmButton: false });
      } catch (err: any) {
        Swal.fire({ icon: 'error', title: 'បរាជ័យ!', text: err.message });
      }
    }
  };

  // --- Handlers: Enrollments ---
  const handleEnrollEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch('/api/trainings/enroll', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(enrollForm),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Failed to enroll');
      }

      const data = await res.json();
      const tr = trainings.find(t => t.id === enrollForm.trainingId);
      const newEnrollment: TrainingEnrollment = {
        ...data,
        training: tr ? { id: tr.id, title: tr.title, startDate: tr.startDate, endDate: tr.endDate, trainer: tr.trainer } : undefined,
      };

      setEnrollments([newEnrollment, ...enrollments]);
      setTrainings(trainings.map(t => (t.id === enrollForm.trainingId ? { ...t, _count: { enrollments: (t._count?.enrollments || 0) + 1 } } : t)));
      
      Swal.fire({ icon: 'success', title: 'បានចុះឈ្មោះបុគ្គលិកជោគជ័យ!', timer: 1500, showConfirmButton: false });
      setShowEnrollModal(false);
    } catch (err: any) {
      Swal.fire({ icon: 'error', title: 'មានបញ្ហា!', text: err.message });
    } finally {
      setLoading(false);
    }
  };

  const openUpdateResultModal = (item: TrainingEnrollment) => {
    setSelectedEnrollment(item);
    setResultForm({
      status: item.status || 'COMPLETED',
      score: item.score !== null && item.score !== undefined ? String(item.score) : '100',
      feedback: item.feedback || '',
      certificateUrl: item.certificateUrl || '',
    });
    setShowResultModal(true);
  };

  const handleSaveResult = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEnrollment) return;
    setLoading(true);

    try {
      const res = await fetch('/api/trainings/enroll', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: selectedEnrollment.id,
          ...resultForm,
        }),
      });

      if (!res.ok) throw new Error('Failed to update result');

      const data = await res.json();
      setEnrollments(enrollments.map(item => (item.id === selectedEnrollment.id ? { ...item, ...data } : item)));

      Swal.fire({ icon: 'success', title: 'បានកត់ត្រាលទ្ធផលជោគជ័យ!', timer: 1500, showConfirmButton: false });
      setShowResultModal(false);
    } catch (err: any) {
      Swal.fire({ icon: 'error', title: 'បរាជ័យ!', text: err.message });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteEnrollment = async (id: string, name: string) => {
    const result = await Swal.fire({
      title: 'លុបការចុះឈ្មោះ?',
      text: `តើអ្នកចង់ដក "${name}" ចេញពីវគ្គនេះមែនទេ?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'លុប',
      cancelButtonText: 'បោះបង់',
    });

    if (result.isConfirmed) {
      try {
        const res = await fetch(`/api/trainings/enroll?id=${id}`, { method: 'DELETE' });
        if (!res.ok) throw new Error('Failed to remove');
        setEnrollments(enrollments.filter(e => e.id !== id));
        Swal.fire({ icon: 'success', title: 'បានដករួចរាល់!', timer: 1500, showConfirmButton: false });
      } catch (err: any) {
        Swal.fire({ icon: 'error', title: 'បរាជ័យ!', text: err.message });
      }
    }
  };

  // --- Export to Excel ---
  const exportTrainingsToExcel = () => {
    if (filteredTrainings.length === 0) {
      Swal.fire({ icon: 'info', title: 'គ្មានទិន្នន័យដើម្បីទាញយកទេ!' });
      return;
    }

    const exportData = filteredTrainings.map((t, index) => ({
      'ល.រ (No. / 序号)': index + 1,
      'វគ្គបណ្តុះបណ្តាល (Training Title / 培训课程)': t.title,
      'គ្រូបង្ហាត់ (Trainer / 讲师)': t.trainer || 'N/A',
      'ទីតាំង (Location / 地点)': t.location || 'N/A',
      'ថ្ងៃចាប់ផ្តើម (Start Date / 开始日期)': new Date(t.startDate).toLocaleDateString(),
      'ថ្ងៃបញ្ចប់ (End Date / 结束日期)': new Date(t.endDate).toLocaleDateString(),
      'ថវិកាចំណាយ (Cost USD / 费用)': `$${t.cost || 0}`,
      'ស្ថានភាព (Status / 状态)': STATUS_COLORS[t.status]?.labelKh || t.status,
      'ចំនួនសិក្ខាកាម (Trainees / 学员人数)': t._count?.enrollments || 0,
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    ws['!cols'] = autoFitColumns(exportData);

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Trainings');
    XLSX.writeFile(wb, `Trainings_Report_${new Date().toISOString().split('T')[0]}.xlsx`);
    Swal.fire({ icon: 'success', title: 'បានទាញយក File Excel ជោគជ័យ!', timer: 1500, showConfirmButton: false });
  };

  const exportEnrollmentsToExcel = () => {
    if (filteredEnrollments.length === 0) {
      Swal.fire({ icon: 'info', title: 'គ្មានទិន្នន័យដើម្បីទាញយកទេ!' });
      return;
    }

    const exportData = filteredEnrollments.map((e, index) => ({
      'ល.រ (No. / 序号)': index + 1,
      'អត្តលេខ (Emp ID / 员工编号)': e.employee.employeeId,
      'ឈ្មោះបុគ្គលិក (Employee Name / 员工姓名)': `${e.employee.firstNameEn} ${e.employee.lastNameEn}`,
      'មុខតំណែង (Position / 职务)': e.employee.position,
      'ផ្នែក (Department / 部门)': e.employee.department,
      'វគ្គបណ្តុះបណ្តាល (Training / 培训课程)': e.training?.title || 'N/A',
      'ស្ថានភាព (Status / 状态)': STATUS_COLORS[e.status]?.labelKh || e.status,
      'ពិន្ទុ (Score / 成绩)': e.score !== null && e.score !== undefined ? `${e.score}/100` : 'N/A',
      'វិញ្ញាបនបត្រ (Certificate / 证书)': e.certificateUrl || 'N/A',
      'កាលបរិច្ឆេទចុះឈ្មោះ (Enrolled Date / 报名日期)': new Date(e.enrolledAt).toLocaleDateString(),
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    ws['!cols'] = autoFitColumns(exportData);

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Trainee_Enrollments');
    XLSX.writeFile(wb, `Trainee_Enrollments_Report_${new Date().toISOString().split('T')[0]}.xlsx`);
    Swal.fire({ icon: 'success', title: 'បានទាញយក File Excel ជោគជ័យ!', timer: 1500, showConfirmButton: false });
  };

  // Filtered lists
  const filteredTrainings = trainings.filter(t => {
    const matchSearch = t.title.toLowerCase().includes(trainingSearch.toLowerCase()) || (t.trainer && t.trainer.toLowerCase().includes(trainingSearch.toLowerCase()));
    const matchStatus = trainingStatusFilter === 'ALL' || t.status === trainingStatusFilter;
    return matchSearch && matchStatus;
  });

  const filteredEnrollments = enrollments.filter(e => {
    const fullName = `${e.employee.firstNameEn} ${e.employee.lastNameEn} ${e.employee.employeeId}`.toLowerCase();
    const matchSearch = fullName.includes(enrollmentSearch.toLowerCase()) || (e.training && e.training.title.toLowerCase().includes(enrollmentSearch.toLowerCase()));
    const matchStatus = enrollmentStatusFilter === 'ALL' || e.status === enrollmentStatusFilter;
    const matchProgram = enrollmentProgramFilter === 'ALL' || e.trainingId === enrollmentProgramFilter;
    return matchSearch && matchStatus && matchProgram;
  });

  return (
    <div style={{ fontFamily: 'var(--font-khmer, inherit)' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 700, margin: 0, color: '#1e293b' }}>
            🎓 ការបណ្តុះបណ្តាល និងអភិវឌ្ឍន៍ (Training & Development)
          </h1>
          <p style={{ color: '#64748b', margin: '4px 0 0 0', fontSize: '0.95rem' }}>
            គ្រប់គ្រងវគ្គសិក្សា ចុះឈ្មោះបុគ្គលិក និងតាមដានវិញ្ញាបនបត្រ
          </p>
        </div>

        {isHR && (
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            {activeTab === 'trainings' ? (
              <>
                <button
                  onClick={exportTrainingsToExcel}
                  style={{
                    backgroundColor: '#059669',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '10px 16px',
                    fontWeight: 600,
                    fontSize: '0.95rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    boxShadow: '0 2px 4px rgba(5, 150, 105, 0.2)',
                  }}
                >
                  📊 ទាញយក Excel (Trainings)
                </button>
                <button
                  onClick={openCreateTrainingModal}
                  style={{
                    backgroundColor: '#2563eb',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '10px 18px',
                    fontWeight: 600,
                    fontSize: '0.95rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    boxShadow: '0 2px 4px rgba(37, 99, 235, 0.2)',
                  }}
                >
                  ➕ បង្កើតវគ្គសិក្សាថ្មី
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={exportEnrollmentsToExcel}
                  style={{
                    backgroundColor: '#059669',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '10px 16px',
                    fontWeight: 600,
                    fontSize: '0.95rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    boxShadow: '0 2px 4px rgba(5, 150, 105, 0.2)',
                  }}
                >
                  📊 ទាញយក Excel (Trainees)
                </button>
                <button
                  onClick={() => {
                    if (trainings.length === 0) {
                      Swal.fire({ icon: 'info', title: 'សូមបង្កើតវគ្គបណ្តុះបណ្តាលជាមុនសិន!' });
                      return;
                    }
                    if (employees.length === 0) {
                      Swal.fire({ icon: 'info', title: 'មិនមានបុគ្គលិកសកម្មដើម្បីចុះឈ្មោះទេ!' });
                      return;
                    }
                    setEnrollForm({
                      trainingId: trainings[0].id,
                      employeeId: employees[0].id,
                      status: 'ENROLLED',
                    });
                    setShowEnrollModal(true);
                  }}
                  style={{
                    backgroundColor: '#16a34a',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '10px 18px',
                    fontWeight: 600,
                    fontSize: '0.95rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    boxShadow: '0 2px 4px rgba(22, 163, 74, 0.2)',
                  }}
                >
                  ➕ ចុះឈ្មោះបុគ្គលិកចូលរៀន
                </button>
              </>
            )}
          </div>
        )}
      </div>

      {/* Metric Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        <div style={{ background: '#fff', padding: '16px 18px', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1px', lineHeight: '1.2' }}>
            <span style={{ color: '#1e293b', fontSize: '0.85rem', fontWeight: 700 }}>វគ្គសិក្សាសរុប</span>
            <span style={{ color: '#64748b', fontSize: '0.75rem' }}>Total Programs</span>
            <span style={{ color: '#94a3b8', fontSize: '0.75rem' }}>培训总数</span>
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 700, color: '#1e293b', marginTop: '6px' }}>{totalTrainings}</div>
        </div>

        <div style={{ background: '#fff', padding: '16px 18px', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1px', lineHeight: '1.2' }}>
            <span style={{ color: '#d97706', fontSize: '0.85rem', fontWeight: 700 }}>កំពុងដំណើរការ</span>
            <span style={{ color: '#64748b', fontSize: '0.75rem' }}>Ongoing Courses</span>
            <span style={{ color: '#94a3b8', fontSize: '0.75rem' }}>正在进行</span>
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 700, color: '#d97706', marginTop: '6px' }}>{ongoingTrainings}</div>
        </div>

        <div style={{ background: '#fff', padding: '16px 18px', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1px', lineHeight: '1.2' }}>
            <span style={{ color: '#0284c7', fontSize: '0.85rem', fontWeight: 700 }}>សិក្ខាកាមសរុប</span>
            <span style={{ color: '#64748b', fontSize: '0.75rem' }}>Enrolled Trainees</span>
            <span style={{ color: '#94a3b8', fontSize: '0.75rem' }}>学员总数</span>
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 700, color: '#0284c7', marginTop: '6px' }}>{totalTrainees}</div>
        </div>

        <div style={{ background: '#fff', padding: '16px 18px', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1px', lineHeight: '1.2' }}>
            <span style={{ color: '#15803d', fontSize: '0.85rem', fontWeight: 700 }}>បានបញ្ចប់ជោគជ័យ</span>
            <span style={{ color: '#64748b', fontSize: '0.75rem' }}>Completed</span>
            <span style={{ color: '#94a3b8', fontSize: '0.75rem' }}>结业人数</span>
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 700, color: '#15803d', marginTop: '6px' }}>{completedTrainees}</div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: '2px solid #e2e8f0', marginBottom: '20px', gap: '8px' }}>
        <button
          onClick={() => setActiveTab('trainings')}
          style={{
            padding: '12px 20px',
            background: 'none',
            border: 'none',
            borderBottom: activeTab === 'trainings' ? '3px solid #2563eb' : '3px solid transparent',
            color: activeTab === 'trainings' ? '#2563eb' : '#64748b',
            fontWeight: 700,
            fontSize: '1rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          🎓 វគ្គបណ្តុះបណ្តាល ({trainings.length})
        </button>
        <button
          onClick={() => setActiveTab('enrollments')}
          style={{
            padding: '12px 20px',
            background: 'none',
            border: 'none',
            borderBottom: activeTab === 'enrollments' ? '3px solid #2563eb' : '3px solid transparent',
            color: activeTab === 'enrollments' ? '#2563eb' : '#64748b',
            fontWeight: 700,
            fontSize: '1rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          👥 បញ្ជីសិក្ខាកាម & វិញ្ញាបនបត្រ ({enrollments.length})
        </button>
      </div>

      {/* Tab 1: Training Programs */}
      {activeTab === 'trainings' && (
        <div>
          {/* Filters */}
          <div style={{ display: 'flex', gap: '12px', marginBottom: '18px', flexWrap: 'wrap' }}>
            <input
              type="text"
              placeholder="ស្វែងរកតាមឈ្មោះវគ្គ ឬគ្រូបង្ហាត់ (Search title/trainer)..."
              value={trainingSearch}
              onChange={e => setTrainingSearch(e.target.value)}
              style={{
                flex: 1,
                minWidth: '240px',
                padding: '9px 14px',
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
                fontSize: '0.95rem',
              }}
            />
            <select
              value={trainingStatusFilter}
              onChange={e => setTrainingStatusFilter(e.target.value)}
              style={{
                padding: '9px 14px',
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
                fontSize: '0.95rem',
                background: '#fff',
              }}
            >
              <option value="ALL">គ្រប់ស្ថានភាព (All Status)</option>
              <option value="UPCOMING">នឹងមកដល់ (Upcoming)</option>
              <option value="ONGOING">កំពុងដំណើរការ (Ongoing)</option>
              <option value="COMPLETED">បានបញ្ចប់ (Completed)</option>
              <option value="CANCELLED">បានលុបចោល (Cancelled)</option>
            </select>
          </div>

          {/* Cards Grid */}
          {filteredTrainings.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 20px', background: '#fff', borderRadius: '12px', border: '1px dashed #cbd5e1' }}>
              <div style={{ fontSize: '2.5rem', marginBottom: '10px' }}>📚</div>
              <h3 style={{ margin: 0, color: '#475569' }}>មិនទាន់មានវគ្គបណ្តុះបណ្តាលនៅឡើយទេ</h3>
              <p style={{ color: '#94a3b8', fontSize: '0.9rem', marginTop: '6px' }}>ចុចប៊ូតុង "បង្កើតវគ្គសិក្សាថ្មី" ដើម្បីចាប់ផ្ដើម</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '18px' }}>
              {filteredTrainings.map(t => {
                const badge = STATUS_COLORS[t.status] || STATUS_COLORS.UPCOMING;
                return (
                  <div
                    key={t.id}
                    style={{
                      background: '#fff',
                      borderRadius: '12px',
                      border: '1px solid #e2e8f0',
                      padding: '20px',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.03)',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px', marginBottom: '8px' }}>
                        <h3 style={{ margin: 0, fontSize: '1.2rem', color: '#0f172a', fontWeight: 700 }}>{t.title}</h3>
                        <span
                          style={{
                            backgroundColor: badge.bg,
                            color: badge.text,
                            padding: '4px 10px',
                            borderRadius: '20px',
                            fontSize: '0.8rem',
                            fontWeight: 600,
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {badge.labelKh}
                        </span>
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', color: '#64748b', fontSize: '0.85rem', marginBottom: '12px' }}>
                        <div>👨‍🏫 គ្រូបង្ហាត់៖ <strong style={{ color: '#334155' }}>{t.trainer || 'N/A'}</strong></div>
                        <div>📍 ទីតាំង៖ {t.location || 'N/A'}</div>
                        <div>📅 កាលបរិច្ឆេទ៖ {new Date(t.startDate).toLocaleDateString()} - {new Date(t.endDate).toLocaleDateString()}</div>
                        {t.cost > 0 && <div>💵 ថវិកាចំណាយ៖ <strong>${t.cost}</strong></div>}
                      </div>

                      {t.description && (
                        <p style={{ color: '#475569', fontSize: '0.9rem', lineHeight: '1.5', margin: '0 0 14px 0', maxHeight: '68px', overflow: 'hidden' }}>
                          {t.description}
                        </p>
                      )}
                    </div>

                    <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '14px', marginTop: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#2563eb' }}>
                        👥 សិក្ខាកាម៖ {t._count?.enrollments || 0} នាក់
                      </span>

                      {isHR && (
                        <div style={{ display: 'flex', gap: '6px' }}>
                          <button
                            onClick={() => openEditTrainingModal(t)}
                            style={{
                              background: '#f8fafc',
                              border: '1px solid #cbd5e1',
                              borderRadius: '6px',
                              padding: '6px 12px',
                              fontSize: '0.85rem',
                              cursor: 'pointer',
                              fontWeight: 600,
                              color: '#334155',
                            }}
                          >
                            ✏️ កែប្រែ
                          </button>
                          <button
                            onClick={() => handleDeleteTraining(t.id, t.title)}
                            style={{
                              background: '#fef2f2',
                              border: '1px solid #fca5a5',
                              borderRadius: '6px',
                              padding: '6px 12px',
                              fontSize: '0.85rem',
                              cursor: 'pointer',
                              fontWeight: 600,
                              color: '#dc2626',
                            }}
                          >
                            🗑️ លុប
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Trainee Enrollments */}
      {activeTab === 'enrollments' && (
        <div>
          {/* Filters */}
          <div style={{ display: 'flex', gap: '12px', marginBottom: '18px', flexWrap: 'wrap' }}>
            <input
              type="text"
              placeholder="ស្វែងរកឈ្មោះ ឬអត្តលេខបុគ្គលិក (Search employee name/ID)..."
              value={enrollmentSearch}
              onChange={e => setEnrollmentSearch(e.target.value)}
              style={{
                flex: 1,
                minWidth: '220px',
                padding: '9px 14px',
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
                fontSize: '0.95rem',
              }}
            />

            <select
              value={enrollmentProgramFilter}
              onChange={e => setEnrollmentProgramFilter(e.target.value)}
              style={{
                padding: '9px 14px',
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
                fontSize: '0.95rem',
                background: '#fff',
              }}
            >
              <option value="ALL">គ្រប់វគ្គសិក្សា (All Courses)</option>
              {trainings.map(t => (
                <option key={t.id} value={t.id}>
                  {t.title}
                </option>
              ))}
            </select>

            <select
              value={enrollmentStatusFilter}
              onChange={e => setEnrollmentStatusFilter(e.target.value)}
              style={{
                padding: '9px 14px',
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
                fontSize: '0.95rem',
                background: '#fff',
              }}
            >
              <option value="ALL">គ្រប់ស្ថានភាព (All Status)</option>
              <option value="ENROLLED">បានចុះឈ្មោះ (Enrolled)</option>
              <option value="COMPLETED">បានបញ្ចប់ (Completed)</option>
              <option value="FAILED">ធ្លាក់ (Failed)</option>
              <option value="DROPPED">បោះបង់ (Dropped)</option>
            </select>
          </div>

          {/* Table */}
          <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', overflowX: 'auto', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '850px' }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475569' }}>
                  <th style={{ padding: '12px 18px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', lineHeight: '1.2' }}>
                      <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#1e293b' }}>បុគ្គលិក</span>
                      <span style={{ fontSize: '0.75rem', fontWeight: 500, color: '#64748b' }}>Employee</span>
                      <span style={{ fontSize: '0.75rem', fontWeight: 400, color: '#94a3b8' }}>员工</span>
                    </div>
                  </th>
                  <th style={{ padding: '12px 18px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', lineHeight: '1.2' }}>
                      <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#1e293b' }}>វគ្គសិក្សា</span>
                      <span style={{ fontSize: '0.75rem', fontWeight: 500, color: '#64748b' }}>Training Course</span>
                      <span style={{ fontSize: '0.75rem', fontWeight: 400, color: '#94a3b8' }}>培训课程</span>
                    </div>
                  </th>
                  <th style={{ padding: '12px 18px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', lineHeight: '1.2' }}>
                      <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#1e293b' }}>ស្ថានភាព</span>
                      <span style={{ fontSize: '0.75rem', fontWeight: 500, color: '#64748b' }}>Status</span>
                      <span style={{ fontSize: '0.75rem', fontWeight: 400, color: '#94a3b8' }}>状态</span>
                    </div>
                  </th>
                  <th style={{ padding: '12px 18px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', lineHeight: '1.2' }}>
                      <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#1e293b' }}>ពិន្ទុ</span>
                      <span style={{ fontSize: '0.75rem', fontWeight: 500, color: '#64748b' }}>Score</span>
                      <span style={{ fontSize: '0.75rem', fontWeight: 400, color: '#94a3b8' }}>成绩</span>
                    </div>
                  </th>
                  <th style={{ padding: '12px 18px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', lineHeight: '1.2' }}>
                      <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#1e293b' }}>វិញ្ញាបនបត្រ</span>
                      <span style={{ fontSize: '0.75rem', fontWeight: 500, color: '#64748b' }}>Certificate</span>
                      <span style={{ fontSize: '0.75rem', fontWeight: 400, color: '#94a3b8' }}>结业证书</span>
                    </div>
                  </th>
                  {isHR && (
                    <th style={{ padding: '12px 18px', textAlign: 'right' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', alignItems: 'flex-end', lineHeight: '1.2' }}>
                        <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#1e293b' }}>សកម្មភាព</span>
                        <span style={{ fontSize: '0.75rem', fontWeight: 500, color: '#64748b' }}>Actions</span>
                        <span style={{ fontSize: '0.75rem', fontWeight: 400, color: '#94a3b8' }}>操作</span>
                      </div>
                    </th>
                  )}
                </tr>
              </thead>
              <tbody>
                {filteredEnrollments.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>
                      មិនមានទិន្នន័យសិក្ខាកាមទេ
                    </td>
                  </tr>
                ) : (
                  filteredEnrollments.map(e => {
                    const badge = STATUS_COLORS[e.status] || STATUS_COLORS.ENROLLED;
                    return (
                      <tr key={e.id} style={{ borderBottom: '1px solid #f1f5f9', fontSize: '0.9rem' }}>
                        <td style={{ padding: '14px 18px' }}>
                          <div style={{ fontWeight: 600, color: '#1e293b' }}>
                            {e.employee.firstNameEn} {e.employee.lastNameEn}
                          </div>
                          <span style={{ fontSize: '0.8rem', color: '#64748b' }}>
                            ID: {e.employee.employeeId} | {e.employee.position} ({e.employee.department})
                          </span>
                        </td>
                        <td style={{ padding: '14px 18px', color: '#334155', fontWeight: 500 }}>
                          <div>{e.training?.title || 'N/A'}</div>
                          {e.training?.trainer && <span style={{ fontSize: '0.8rem', color: '#64748b' }}>គ្រូ៖ {e.training.trainer}</span>}
                        </td>
                        <td style={{ padding: '14px 18px' }}>
                          <span
                            style={{
                              backgroundColor: badge.bg,
                              color: badge.text,
                              padding: '4px 10px',
                              borderRadius: '20px',
                              fontSize: '0.8rem',
                              fontWeight: 600,
                            }}
                          >
                            {badge.labelKh}
                          </span>
                        </td>
                        <td style={{ padding: '14px 18px', fontWeight: 600, color: '#0f172a' }}>
                          {e.score !== null && e.score !== undefined ? `${e.score}/100` : '-'}
                        </td>
                        <td style={{ padding: '14px 18px' }}>
                          {e.certificateUrl ? (
                            <a
                              href={e.certificateUrl}
                              target="_blank"
                              rel="noreferrer"
                              style={{ color: '#2563eb', fontWeight: 600, textDecoration: 'none' }}
                            >
                              📜 មើលវិញ្ញាបនបត្រ
                            </a>
                          ) : (
                            <span style={{ color: '#94a3b8', fontSize: '0.85rem' }}>មិនទាន់មាន</span>
                          )}
                        </td>
                        {isHR && (
                          <td style={{ padding: '14px 18px', textAlign: 'right' }}>
                            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                              <button
                                onClick={() => openUpdateResultModal(e)}
                                title="កត់ត្រាលទ្ធផល និងវិញ្ញាបនបត្រ"
                                style={{
                                  background: '#f0fdf4',
                                  border: '1px solid #86efac',
                                  borderRadius: '6px',
                                  padding: '5px 10px',
                                  fontSize: '0.8rem',
                                  cursor: 'pointer',
                                  color: '#16a34a',
                                  fontWeight: 600,
                                }}
                              >
                                📝 កត់ត្រាលទ្ធផល
                              </button>
                              <button
                                onClick={() => handleDeleteEnrollment(e.id, `${e.employee.firstNameEn} ${e.employee.lastNameEn}`)}
                                style={{
                                  background: '#fef2f2',
                                  border: '1px solid #fca5a5',
                                  borderRadius: '6px',
                                  padding: '5px 10px',
                                  fontSize: '0.8rem',
                                  cursor: 'pointer',
                                  color: '#dc2626',
                                  fontWeight: 600,
                                }}
                              >
                                🗑️
                              </button>
                            </div>
                          </td>
                        )}
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal: Create/Edit Training */}
      {showTrainingModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '16px' }}>
          <div style={{ background: '#fff', borderRadius: '16px', maxWidth: '600px', width: '100%', padding: '24px', maxHeight: '90vh', overflowY: 'auto' }}>
            <h2 style={{ margin: '0 0 18px 0', fontSize: '1.3rem', color: '#1e293b' }}>
              {editingTraining ? '✏️ កែប្រែវគ្គបណ្តុះបណ្តាល' : '➕ បង្កើតវគ្គបណ្តុះបណ្តាលថ្មី'}
            </h2>

            <form onSubmit={handleSaveTraining} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '4px' }}>
                  ចំណងជើងវគ្គសិក្សា (Training Title) *
                </label>
                <input
                  type="text"
                  required
                  placeholder="ឧ. ការគ្រប់គ្រងពេលវេលា, សុវត្ថិភាពការងារ..."
                  value={trainingForm.title}
                  onChange={e => setTrainingForm({ ...trainingForm, title: e.target.value })}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '4px' }}>
                    គ្រូបង្ហាត់ / ស្ថាប័ន (Trainer)
                  </label>
                  <input
                    type="text"
                    placeholder="ឈ្មោះគ្រូ ឬសាលា..."
                    value={trainingForm.trainer}
                    onChange={e => setTrainingForm({ ...trainingForm, trainer: e.target.value })}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '4px' }}>
                    ទីតាំង (Location)
                  </label>
                  <input
                    type="text"
                    placeholder="Online, បន្ទប់ប្រជុំ..."
                    value={trainingForm.location}
                    onChange={e => setTrainingForm({ ...trainingForm, location: e.target.value })}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '4px' }}>
                    ថ្ងៃចាប់ផ្តើម (Start Date) *
                  </label>
                  <input
                    type="date"
                    required
                    value={trainingForm.startDate}
                    onChange={e => setTrainingForm({ ...trainingForm, startDate: e.target.value })}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '4px' }}>
                    ថ្ងៃបញ្ចប់ (End Date) *
                  </label>
                  <input
                    type="date"
                    required
                    value={trainingForm.endDate}
                    onChange={e => setTrainingForm({ ...trainingForm, endDate: e.target.value })}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '4px' }}>
                    ថវិកាចំណាយ (Cost USD)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={trainingForm.cost}
                    onChange={e => setTrainingForm({ ...trainingForm, cost: e.target.value })}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '4px' }}>
                    ស្ថានភាព (Status)
                  </label>
                  <select
                    value={trainingForm.status}
                    onChange={e => setTrainingForm({ ...trainingForm, status: e.target.value })}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                  >
                    <option value="UPCOMING">នឹងមកដល់ (Upcoming)</option>
                    <option value="ONGOING">កំពុងដំណើរការ (Ongoing)</option>
                    <option value="COMPLETED">បានបញ្ចប់ (Completed)</option>
                    <option value="CANCELLED">បានលុបចោល (Cancelled)</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '4px' }}>
                  ការពិពណ៌នាអំពីវគ្គ (Description)
                </label>
                <textarea
                  rows={3}
                  placeholder="រៀបរាប់ពីគោលបំណង និងខ្លឹមសារមេរៀន..."
                  value={trainingForm.description}
                  onChange={e => setTrainingForm({ ...trainingForm, description: e.target.value })}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '12px' }}>
                <button
                  type="button"
                  onClick={() => setShowTrainingModal(false)}
                  style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#f8fafc', cursor: 'pointer' }}
                >
                  បោះបង់
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  style={{ padding: '8px 20px', borderRadius: '8px', border: 'none', background: '#2563eb', color: '#fff', fontWeight: 600, cursor: 'pointer' }}
                >
                  {loading ? 'កំពុងរក្សាទុក...' : 'រក្សាទុក'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Enroll Employee */}
      {showEnrollModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '16px' }}>
          <div style={{ background: '#fff', borderRadius: '16px', maxWidth: '520px', width: '100%', padding: '24px' }}>
            <h2 style={{ margin: '0 0 18px 0', fontSize: '1.3rem', color: '#1e293b' }}>
              ➕ ចុះឈ្មោះបុគ្គលិកចូលរៀន
            </h2>

            <form onSubmit={handleEnrollEmployee} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '4px' }}>
                  ជ្រើសរើសវគ្គបណ្តុះបណ្តាល *
                </label>
                <select
                  required
                  value={enrollForm.trainingId}
                  onChange={e => setEnrollForm({ ...enrollForm, trainingId: e.target.value })}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                >
                  {trainings.map(t => (
                    <option key={t.id} value={t.id}>
                      {t.title} ({new Date(t.startDate).toLocaleDateString()})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '4px' }}>
                  ជ្រើសរើសបុគ្គលិក *
                </label>
                <select
                  required
                  value={enrollForm.employeeId}
                  onChange={e => setEnrollForm({ ...enrollForm, employeeId: e.target.value })}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                >
                  {employees.map(emp => (
                    <option key={emp.id} value={emp.id}>
                      {emp.employeeId} - {emp.firstNameEn} {emp.lastNameEn} ({emp.position})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '4px' }}>
                  ស្ថានភាពដំបូង
                </label>
                <select
                  value={enrollForm.status}
                  onChange={e => setEnrollForm({ ...enrollForm, status: e.target.value })}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                >
                  <option value="ENROLLED">បានចុះឈ្មោះ (Enrolled)</option>
                  <option value="COMPLETED">បានបញ្ចប់ (Completed)</option>
                </select>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '12px' }}>
                <button
                  type="button"
                  onClick={() => setShowEnrollModal(false)}
                  style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#f8fafc', cursor: 'pointer' }}
                >
                  បោះបង់
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  style={{ padding: '8px 20px', borderRadius: '8px', border: 'none', background: '#16a34a', color: '#fff', fontWeight: 600, cursor: 'pointer' }}
                >
                  {loading ? 'កំពុងចុះឈ្មោះ...' : 'ចុះឈ្មោះ'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Update Result & Certificate */}
      {showResultModal && selectedEnrollment && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '16px' }}>
          <div style={{ background: '#fff', borderRadius: '16px', maxWidth: '520px', width: '100%', padding: '24px' }}>
            <h2 style={{ margin: '0 0 14px 0', fontSize: '1.3rem', color: '#1e293b' }}>
              📝 កត់ត្រាលទ្ធផល & វិញ្ញាបនបត្រ
            </h2>
            <p style={{ margin: '0 0 16px 0', color: '#64748b', fontSize: '0.9rem' }}>
              សិក្ខាកាម៖ <strong>{selectedEnrollment.employee.firstNameEn} {selectedEnrollment.employee.lastNameEn}</strong> | វគ្គ៖ <strong>{selectedEnrollment.training?.title}</strong>
            </p>

            <form onSubmit={handleSaveResult} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '4px' }}>
                    ស្ថានភាពបញ្ចប់
                  </label>
                  <select
                    value={resultForm.status}
                    onChange={e => setResultForm({ ...resultForm, status: e.target.value })}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                  >
                    <option value="COMPLETED">ជាប់ / បានបញ្ចប់ (Completed)</option>
                    <option value="FAILED">ធ្លាក់ (Failed)</option>
                    <option value="DROPPED">បោះបង់ (Dropped)</option>
                    <option value="ENROLLED">កំពុងរៀន (Enrolled)</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '4px' }}>
                    ពិន្ទុ (Score / 100)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    placeholder="ឧ. 95"
                    value={resultForm.score}
                    onChange={e => setResultForm({ ...resultForm, score: e.target.value })}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '4px' }}>
                  តំណភ្ជាប់វិញ្ញាបនបត្រ (Certificate Link / Cloud File)
                </label>
                <input
                  type="url"
                  placeholder="https://..."
                  value={resultForm.certificateUrl}
                  onChange={e => setResultForm({ ...resultForm, certificateUrl: e.target.value })}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '4px' }}>
                  មតិកែលម្អ / កំណត់ចំណាំ (Trainer Feedback)
                </label>
                <textarea
                  rows={2}
                  placeholder="ការវាយតម្លៃលើការសិក្សា..."
                  value={resultForm.feedback}
                  onChange={e => setResultForm({ ...resultForm, feedback: e.target.value })}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '12px' }}>
                <button
                  type="button"
                  onClick={() => setShowResultModal(false)}
                  style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#f8fafc', cursor: 'pointer' }}
                >
                  បោះបង់
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  style={{ padding: '8px 20px', borderRadius: '8px', border: 'none', background: '#2563eb', color: '#fff', fontWeight: 600, cursor: 'pointer' }}
                >
                  {loading ? 'កំពុងរក្សាទុក...' : 'រក្សាទុក'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
