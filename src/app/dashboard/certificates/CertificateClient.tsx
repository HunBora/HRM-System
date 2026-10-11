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
  basicSalary?: number | null;
  gender?: string | null;
}

interface CertificateRequest {
  id: string;
  employeeId: string;
  employee: EmployeeSimple;
  certificateType: string;
  requestDate: string;
  purpose: string;
  addressee?: string | null;
  status: string;
  issuedDate?: string | null;
  issuedBy?: string | null;
  referenceNo: string;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
}

interface Props {
  initialCertificates: CertificateRequest[];
  employees: EmployeeSimple[];
  departments: string[];
  userRole?: string;
}

const CERT_TYPE_CONFIG: Record<string, { labelKh: string; labelEn: string; labelZh: string; titleKm: string; titleEn: string; icon: string; bg: string; text: string }> = {
  EMPLOYMENT_CERTIFICATE: {
    labelKh: 'លិខិតបញ្ជាក់ការងារ',
    labelEn: 'Employment Certificate',
    labelZh: '在职证明',
    titleKm: 'លិខិតបញ្ជាក់ការងារ',
    titleEn: 'CERTIFICATE OF EMPLOYMENT',
    icon: '🏢',
    bg: '#e0f2fe',
    text: '#0369a1'
  },
  SALARY_CERTIFICATE: {
    labelKh: 'លិខិតបញ្ជាក់ប្រាក់ខែ',
    labelEn: 'Salary Certificate',
    labelZh: '薪资收入证明',
    titleKm: 'លិខិតបញ្ជាក់ប្រាក់បៀវត្សរ៍',
    titleEn: 'SALARY & INCOME CERTIFICATE',
    icon: '💵',
    bg: '#dcfce7',
    text: '#15803d'
  },
  INTERNSHIP_CERTIFICATE: {
    labelKh: 'លិខិតបញ្ជាក់កម្មសិក្សា',
    labelEn: 'Internship Certificate',
    labelZh: '实习证明',
    titleKm: 'លិខិតបញ្ជាក់ការហាត់ការ',
    titleEn: 'INTERNSHIP COMPLETION CERTIFICATE',
    icon: '🎓',
    bg: '#fef3c7',
    text: '#b45309'
  },
  EXPERIENCE_LETTER: {
    labelKh: 'លិខិតបញ្ជាក់បទពិសោធន៍',
    labelEn: 'Experience Letter',
    labelZh: '工作经历推荐信',
    titleKm: 'លិខិតបញ្ជាក់បទពិសោធន៍ការងារ',
    titleEn: 'WORK EXPERIENCE & RECOMMENDATION LETTER',
    icon: '📜',
    bg: '#f3e8ff',
    text: '#7e22ce'
  }
};

const STATUS_CONFIG: Record<string, { labelKh: string; labelEn: string; bg: string; text: string }> = {
  PENDING: { labelKh: 'រង់ចាំពិនិត្យ', labelEn: 'Pending Review', bg: '#fef3c7', text: '#b45309' },
  APPROVED: { labelKh: 'បានយល់ព្រម', labelEn: 'Approved', bg: '#e0f2fe', text: '#0369a1' },
  ISSUED: { labelKh: 'បានចេញលិខិត', labelEn: 'Issued', bg: '#dcfce7', text: '#15803d' },
  REJECTED: { labelKh: 'បានបដិសេធ', labelEn: 'Rejected', bg: '#fee2e2', text: '#b91c1c' }
};

export default function CertificateClient({
  initialCertificates,
  employees,
  departments,
  userRole = 'ADMIN'
}: Props) {
  const isHR = userRole === 'ADMIN' || userRole === 'HR_MANAGER' || userRole === 'HR';

  const [certificates, setCertificates] = useState<CertificateRequest[]>(initialCertificates);
  const [loading, setLoading] = useState<boolean>(false);

  // Filters
  const [search, setSearch] = useState<string>('');
  const [typeFilter, setTypeFilter] = useState<string>('ALL');
  const [departmentFilter, setDepartmentFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Modals
  const [showModal, setShowModal] = useState<boolean>(false);
  const [printCert, setPrintCert] = useState<CertificateRequest | null>(null);

  // Form State
  const [form, setForm] = useState({
    employeeId: employees[0]?.id || '',
    certificateType: 'EMPLOYMENT_CERTIFICATE',
    purpose: 'ស្នើសុំប្រាក់កម្ចីធនាគារ (Bank Loan Application)',
    addressee: 'To Whom It May Concern (ជូនចំពោះស្ថាប័នពាក់ព័ន្ធ)',
    notes: '',
    status: isHR ? 'ISSUED' : 'PENDING'
  });

  // Filtered Certificates
  const filteredCertificates = useMemo(() => {
    return certificates.filter(cert => {
      const emp = cert.employee;
      const fullName = `${emp.firstNameEn} ${emp.lastNameEn} ${emp.firstNameKh || ''} ${emp.lastNameKh || ''}`.toLowerCase();
      const matchesSearch = !search ||
        fullName.includes(search.toLowerCase()) ||
        emp.employeeId.toLowerCase().includes(search.toLowerCase()) ||
        cert.referenceNo.toLowerCase().includes(search.toLowerCase()) ||
        cert.purpose.toLowerCase().includes(search.toLowerCase());

      const matchesType = typeFilter === 'ALL' || cert.certificateType === typeFilter;
      const matchesDept = departmentFilter === 'ALL' || emp.department === departmentFilter;
      const matchesStatus = statusFilter === 'ALL' || cert.status === statusFilter;

      return matchesSearch && matchesType && matchesDept && matchesStatus;
    });
  }, [certificates, search, typeFilter, departmentFilter, statusFilter]);

  // Statistics
  const stats = useMemo(() => {
    let pending = 0;
    let issued = 0;
    let salaryCerts = 0;

    certificates.forEach(c => {
      if (c.status === 'PENDING') pending++;
      if (c.status === 'ISSUED') issued++;
      if (c.certificateType === 'SALARY_CERTIFICATE') salaryCerts++;
    });

    return {
      total: certificates.length,
      pending,
      issued,
      salaryCerts
    };
  }, [certificates]);

  // Open Create
  const handleOpenCreate = () => {
    setForm({
      employeeId: employees[0]?.id || '',
      certificateType: 'EMPLOYMENT_CERTIFICATE',
      purpose: 'ស្នើសុំប្រាក់កម្ចីធនាគារ (Bank Loan Application)',
      addressee: 'To Whom It May Concern (ជូនចំពោះស្ថាប័នពាក់ព័ន្ធ)',
      notes: '',
      status: isHR ? 'ISSUED' : 'PENDING'
    });
    setShowModal(true);
  };

  // Quick 1-Click Issue / Approve
  const handleQuickIssue = async (cert: CertificateRequest) => {
    try {
      const res = await fetch('/api/certificates', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: cert.id,
          status: 'ISSUED',
          issuedBy: 'ការិយាល័យធនធានមនុស្ស (HR Dept)'
        })
      });

      if (res.ok) {
        const updated = await res.json();
        setCertificates(prev => prev.map(c => c.id === updated.id ? updated : c));
        Swal.fire({
          icon: 'success',
          title: 'បានចេញលិខិត (Issued)',
          text: `លិខិតលេខ ${cert.referenceNo} ត្រូវបានអនុម័ត និងចេញជាផ្លូវការ`,
          timer: 1500,
          showConfirmButton: false
        });
      }
    } catch (err: any) {
      Swal.fire('Error', err.message, 'error');
    }
  };

  // Delete Record
  const handleDelete = async (cert: CertificateRequest) => {
    const result = await Swal.fire({
      title: 'តើអ្នកប្រាកដទេ? (Are you sure?)',
      text: `ចង់លុបសំណើលិខិត ${cert.referenceNo} របស់ ${cert.employee.firstNameEn}?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'បាទ/ចាស លុប (Yes, Delete)',
      cancelButtonText: 'បោះបង់'
    });

    if (!result.isConfirmed) return;

    try {
      const res = await fetch(`/api/certificates?id=${cert.id}`, { method: 'DELETE' });
      if (res.ok) {
        setCertificates(prev => prev.filter(c => c.id !== cert.id));
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

  // Save New Certificate Request
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.employeeId || !form.purpose) {
      Swal.fire('Warning', 'សូមបំពេញព័ត៌មានបុគ្គលិក និងគោលបំណង', 'warning');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/certificates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to create request');
      }

      const created: CertificateRequest = await res.json();
      setCertificates(prev => [created, ...prev]);
      setShowModal(false);

      Swal.fire({
        icon: 'success',
        title: 'ជោគជ័យ (Created)',
        text: `បានបង្កើតលិខិតលេខ: ${created.referenceNo}`,
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
      return { wch: Math.max(maxLen + 4, 16) };
    });
  };

  // Export to Excel with 3-language headers
  const exportToExcel = () => {
    try {
      const exportData = filteredCertificates.map((cert, index) => {
        const emp = cert.employee;
        const typeConf = CERT_TYPE_CONFIG[cert.certificateType] || { labelKh: cert.certificateType, labelEn: cert.certificateType, labelZh: cert.certificateType };
        const statusConf = STATUS_CONFIG[cert.status] || { labelKh: cert.status, labelEn: cert.status };

        return {
          'ល.រ\nNo.\n序号': index + 1,
          'លេខយោង\nRef No.\n文号': cert.referenceNo,
          'អត្តលេខ\nEmp ID\n工号': emp.employeeId,
          'គោត្តនាម-នាម\nFull Name\n姓名': `${emp.lastNameKh || ''} ${emp.firstNameKh || ''} (${emp.firstNameEn} ${emp.lastNameEn})`.trim(),
          'ផ្នែក\nDepartment\n部门': emp.department,
          'តួនាទី\nPosition\n职位': emp.position,
          'ប្រភេទលិខិត\nCertificate Type\n证明类型': `${typeConf.labelKh} (${typeConf.labelEn} / ${typeConf.labelZh})`,
          'គោលបំណង\nPurpose\n用途': cert.purpose,
          'ផ្ញើជូន\nAddressee\n致送单位': cert.addressee || 'To Whom It May Concern',
          'កាលបរិច្ឆេទស្នើសុំ\nRequest Date\n申请日期': new Date(cert.requestDate).toISOString().split('T')[0],
          'ស្ថានភាព\nStatus\n状态': `${statusConf.labelKh} (${statusConf.labelEn})`,
          'អ្នកចេញលិខិត\nIssued By\n签发人': cert.issuedBy || '-',
        };
      });

      const ws = XLSX.utils.json_to_sheet(exportData);
      ws['!cols'] = autoFitColumns(exportData);

      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Certificates');
      XLSX.writeFile(wb, `HR_Certificates_${new Date().toISOString().split('T')[0]}.xlsx`);

      Swal.fire({
        icon: 'success',
        title: 'ទាញយកជោគជ័យ (Exported)',
        text: 'ឯកសារ Excel ត្រូវបានទាញយករួចរាល់!',
        timer: 1500,
        showConfirmButton: false
      });
    } catch (err: any) {
      Swal.fire('Error', err.message, 'error');
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
          <span style={{ fontSize: '30px' }}>📜</span>
          <div>
            <h1 style={{ margin: 0, fontSize: '1.6rem', fontWeight: 800, color: '#0f172a' }}>
              លិខិតបញ្ជាក់ការងារ និងប្រាក់ខែ
            </h1>
            <p style={{ margin: '4px 0 0 0', color: '#64748b', fontSize: '0.88rem' }}>
              Employment Verification & Salary Certificate Generator • 在职证明与薪资收入证明系统
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
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
              <div>ស្នើសុំលិខិតថ្មី</div>
              <div style={{ fontSize: '0.7rem', opacity: 0.85 }}>New Certificate • 开具证明</div>
            </div>
          </button>

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
            <div style={{ fontWeight: 800, fontSize: '0.95rem', color: '#0f172a' }}>សំណើសរុប</div>
            <div style={{ fontSize: '0.72rem', color: '#64748b' }}>Total Requests • 申请总数</div>
            <div style={{ fontSize: '1.7rem', fontWeight: 900, color: '#0284c7', marginTop: '4px' }}>
              {stats.total}
            </div>
          </div>
        </div>

        {/* Card 2: Pending */}
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
            <div style={{ fontWeight: 800, fontSize: '0.95rem', color: '#0f172a' }}>រង់ចាំពិនិត្យ</div>
            <div style={{ fontSize: '0.72rem', color: '#64748b' }}>Pending Review • 待处理</div>
            <div style={{ fontSize: '1.7rem', fontWeight: 900, color: '#b45309', marginTop: '4px' }}>
              {stats.pending}
            </div>
          </div>
        </div>

        {/* Card 3: Issued Letters */}
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
            <div style={{ fontWeight: 800, fontSize: '0.95rem', color: '#0f172a' }}>បានចេញលិខិត</div>
            <div style={{ fontSize: '0.72rem', color: '#64748b' }}>Issued Letters • 已签发</div>
            <div style={{ fontSize: '1.7rem', fontWeight: 900, color: '#15803d', marginTop: '4px' }}>
              {stats.issued}
            </div>
          </div>
        </div>

        {/* Card 4: Salary Certificates */}
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
            💵
          </div>
          <div>
            <div style={{ fontWeight: 800, fontSize: '0.95rem', color: '#0f172a' }}>លិខិតប្រាក់ខែ</div>
            <div style={{ fontSize: '0.72rem', color: '#64748b' }}>Salary Certs • 收入证明</div>
            <div style={{ fontSize: '1.7rem', fontWeight: 900, color: '#7e22ce', marginTop: '4px' }}>
              {stats.salaryCerts}
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
            placeholder="ស្វែងរកតាមលេខយោង, ឈ្មោះ ឬគោលបំណង..."
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

        {/* Certificate Type Filter */}
        <div style={{ minWidth: '180px' }}>
          <select
            value={typeFilter}
            onChange={e => setTypeFilter(e.target.value)}
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
            <option value="ALL">📜 គ្រប់ប្រភេទលិខិត (All Types)</option>
            {Object.entries(CERT_TYPE_CONFIG).map(([k, v]) => (
              <option key={k} value={k}>{v.icon} {v.labelKh}</option>
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
              <option key={k} value={k}>{v.labelKh}</option>
            ))}
          </select>
        </div>
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
                <th style={{ padding: '14px 16px', width: '60px' }}>
                  <div style={{ fontWeight: 800, color: '#0f172a', fontSize: '0.9rem' }}>ល.រ</div>
                  <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600 }}>No.</div>
                  <div style={{ fontSize: '0.68rem', color: '#94a3b8' }}>序号</div>
                </th>

                {/* 2: Reference No */}
                <th style={{ padding: '14px 16px', minWidth: '150px' }}>
                  <div style={{ fontWeight: 800, color: '#0f172a', fontSize: '0.9rem' }}>លេខយោង</div>
                  <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600 }}>Reference No.</div>
                  <div style={{ fontSize: '0.68rem', color: '#94a3b8' }}>公文编号</div>
                </th>

                {/* 3: Employee */}
                <th style={{ padding: '14px 16px', minWidth: '220px' }}>
                  <div style={{ fontWeight: 800, color: '#0f172a', fontSize: '0.9rem' }}>ព័ត៌មានបុគ្គលិក</div>
                  <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600 }}>Employee Name & ID</div>
                  <div style={{ fontSize: '0.68rem', color: '#94a3b8' }}>员工信息</div>
                </th>

                {/* 4: Certificate Type */}
                <th style={{ padding: '14px 16px', minWidth: '180px' }}>
                  <div style={{ fontWeight: 800, color: '#0f172a', fontSize: '0.9rem' }}>ប្រភេទលិខិត</div>
                  <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600 }}>Certificate Type</div>
                  <div style={{ fontSize: '0.68rem', color: '#94a3b8' }}>证明类型</div>
                </th>

                {/* 5: Purpose */}
                <th style={{ padding: '14px 16px', minWidth: '200px' }}>
                  <div style={{ fontWeight: 800, color: '#0f172a', fontSize: '0.9rem' }}>គោលបំណង</div>
                  <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600 }}>Purpose / Addressee</div>
                  <div style={{ fontSize: '0.68rem', color: '#94a3b8' }}>用途与送达单位</div>
                </th>

                {/* 6: Status */}
                <th style={{ padding: '14px 16px', minWidth: '130px' }}>
                  <div style={{ fontWeight: 800, color: '#0f172a', fontSize: '0.9rem' }}>ស្ថានភាព</div>
                  <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600 }}>Status</div>
                  <div style={{ fontSize: '0.68rem', color: '#94a3b8' }}>状态</div>
                </th>

                {/* 7: Actions */}
                <th style={{ padding: '14px 16px', minWidth: '180px', textAlign: 'right' }}>
                  <div style={{ fontWeight: 800, color: '#0f172a', fontSize: '0.9rem' }}>សកម្មភាព</div>
                  <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600 }}>Actions</div>
                  <div style={{ fontSize: '0.68rem', color: '#94a3b8' }}>操作</div>
                </th>
              </tr>
            </thead>

            <tbody>
              {filteredCertificates.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ padding: '48px', textAlign: 'center', color: '#64748b' }}>
                    <div style={{ fontSize: '36px', marginBottom: '8px' }}>📜</div>
                    <div style={{ fontWeight: 700, fontSize: '1.1rem' }}>មិនមានសំណើលិខិតត្រូវបង្ហាញទេ</div>
                    <div style={{ fontSize: '0.85rem' }}>No certificate records found</div>
                  </td>
                </tr>
              ) : (
                filteredCertificates.map((cert, index) => {
                  const emp = cert.employee;
                  const typeConf = CERT_TYPE_CONFIG[cert.certificateType] || { labelKh: cert.certificateType, labelEn: cert.certificateType, labelZh: cert.certificateType, icon: '📜', bg: '#f1f5f9', text: '#475569' };
                  const statusConf = STATUS_CONFIG[cert.status] || { labelKh: cert.status, labelEn: cert.status, bg: '#f1f5f9', text: '#475569' };

                  return (
                    <tr
                      key={cert.id}
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

                      {/* Reference No */}
                      <td style={{ padding: '14px 16px' }}>
                        <div style={{ fontWeight: 800, color: '#0f172a', fontSize: '0.88rem', fontFamily: 'monospace' }}>
                          {cert.referenceNo}
                        </div>
                        <div style={{ fontSize: '0.72rem', color: '#64748b' }}>
                          {new Date(cert.requestDate).toISOString().split('T')[0]}
                        </div>
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

                      {/* Type Badge */}
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
                          fontSize: '0.8rem'
                        }}>
                          <span>{typeConf.icon}</span>
                          <span>{typeConf.labelKh}</span>
                        </span>
                      </td>

                      {/* Purpose */}
                      <td style={{ padding: '14px 16px' }}>
                        <div style={{ fontWeight: 600, color: '#334155', fontSize: '0.88rem' }}>
                          {cert.purpose}
                        </div>
                        {cert.addressee && (
                          <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '2px' }}>
                            ជូន: {cert.addressee}
                          </div>
                        )}
                      </td>

                      {/* Status */}
                      <td style={{ padding: '14px 16px' }}>
                        <span style={{
                          display: 'inline-block',
                          padding: '4px 10px',
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
                        <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                          {/* Print / View Letter */}
                          <button
                            onClick={() => setPrintCert(cert)}
                            title="មើល និងបោះពុម្ពលិខិតផ្លូវការ (Print Certificate)"
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
                            🖨️ បោះពុម្ពលិខិត
                          </button>

                          {/* Quick Issue */}
                          {isHR && cert.status === 'PENDING' && (
                            <button
                              onClick={() => handleQuickIssue(cert)}
                              title="ចេញលិខិតភ្លាមៗ (Quick Issue)"
                              style={{
                                background: '#dcfce7',
                                border: '1px solid #86efac',
                                color: '#15803d',
                                padding: '6px 10px',
                                borderRadius: '8px',
                                cursor: 'pointer',
                                fontWeight: 700,
                                fontSize: '0.8rem'
                              }}
                            >
                              ✓ ចេញលិខិត
                            </button>
                          )}

                          {isHR && (
                            <button
                              onClick={() => handleDelete(cert)}
                              title="លុប (Delete)"
                              style={{
                                background: '#f8fafc',
                                border: '1px solid #cbd5e1',
                                color: '#64748b',
                                padding: '6px 8px',
                                borderRadius: '8px',
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

      {/* Request Modal */}
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
            maxWidth: '600px',
            boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
            overflow: 'hidden'
          }}>
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
                  📜 ស្នើសុំលិខិតបញ្ជាក់ការងារ / ប្រាក់ខែ
                </h3>
                <div style={{ fontSize: '0.8rem', color: '#bae6fd', marginTop: '4px' }}>
                  Certificate & Official HR Letter Request • 开具工作与薪资证明
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

            <form onSubmit={handleSave} style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Employee Selection */}
              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontWeight: 700, fontSize: '0.88rem', color: '#1e293b' }}>
                  បុគ្គលិកស្នើសុំ (Employee) *
                </label>
                <select
                  value={form.employeeId}
                  onChange={e => setForm({ ...form, employeeId: e.target.value })}
                  required
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.9rem' }}
                >
                  {employees.map(emp => (
                    <option key={emp.id} value={emp.id}>
                      {emp.employeeId} - {emp.firstNameEn} {emp.lastNameEn} ({emp.department} - ${emp.basicSalary || 0})
                    </option>
                  ))}
                </select>
              </div>

              {/* Certificate Type */}
              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontWeight: 700, fontSize: '0.88rem', color: '#1e293b' }}>
                  ប្រភេទលិខិត (Certificate Type) *
                </label>
                <select
                  value={form.certificateType}
                  onChange={e => setForm({ ...form, certificateType: e.target.value })}
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.9rem' }}
                >
                  {Object.entries(CERT_TYPE_CONFIG).map(([k, v]) => (
                    <option key={k} value={k}>
                      {v.icon} {v.labelKh} ({v.labelEn})
                    </option>
                  ))}
                </select>
              </div>

              {/* Purpose */}
              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontWeight: 700, fontSize: '0.88rem', color: '#1e293b' }}>
                  គោលបំណងនៃការប្រើប្រាស់ (Purpose) *
                </label>
                <input
                  type="text"
                  placeholder="ឧ. ស្នើសុំប្រាក់កម្ចីទិញផ្ទះ/ឡាន, សុំទិដ្ឋាការធ្វើដំណើរ (Visa)..."
                  value={form.purpose}
                  onChange={e => setForm({ ...form, purpose: e.target.value })}
                  required
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', boxSizing: 'border-box' }}
                />
              </div>

              {/* Addressee */}
              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontWeight: 700, fontSize: '0.88rem', color: '#1e293b' }}>
                  ផ្ញើជូន (Addressee Organization)
                </label>
                <input
                  type="text"
                  placeholder="ឧ. ជូនចំពោះ ធនាគារ..., ស្ថានទូត... ឬ To Whom It May Concern"
                  value={form.addressee}
                  onChange={e => setForm({ ...form, addressee: e.target.value })}
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', boxSizing: 'border-box' }}
                />
              </div>

              {/* Notes */}
              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontWeight: 700, fontSize: '0.88rem', color: '#1e293b' }}>
                  សម្គាល់បន្ថែម (Notes)
                </label>
                <input
                  type="text"
                  placeholder="ព័ត៌មានលម្អិតបន្ថែម..."
                  value={form.notes}
                  onChange={e => setForm({ ...form, notes: e.target.value })}
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', boxSizing: 'border-box' }}
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
                    background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
                    color: '#ffffff',
                    fontWeight: 700,
                    cursor: 'pointer',
                    boxShadow: '0 2px 8px rgba(2, 132, 199, 0.3)'
                  }}
                >
                  {loading ? 'កំពុងបង្កើត...' : '🚀 បង្កើតលិខិត (Generate)'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Official Bilingual Certificate Printable Slip */}
      {printCert && (
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
                <span>📜</span>
                <span>ទម្រង់លិខិតបញ្ជាក់ផ្លូវការ (Official Certificate Letter)</span>
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
                  onClick={() => setPrintCert(null)}
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

            {/* Printable Body (Official Letter Layout) */}
            <div style={{
              padding: '50px 60px',
              overflowY: 'auto',
              background: '#ffffff',
              color: '#000000',
              fontFamily: 'serif',
              lineHeight: 1.8
            }}>
              {/* National Header */}
              <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#1e3a8a' }}>
                  ព្រះរាជាណាចក្រកម្ពុជា
                </div>
                <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#1e3a8a' }}>
                  ជាតិ សាសនា ព្រះមហាក្សត្រ
                </div>
                <div style={{ fontSize: '0.9rem', fontStyle: 'italic', color: '#64748b' }}>
                  KINGDOM OF CAMBODIA • NATION RELIGION KING
                </div>
                <div style={{ letterSpacing: '4px', fontSize: '12px', marginTop: '4px' }}>❖ ❖ ❖</div>
              </div>

              {/* Company Header & Ref No */}
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '2px solid #000', paddingBottom: '12px', marginBottom: '24px' }}>
                <div>
                  <div style={{ fontWeight: 800, fontSize: '1.15rem' }}>ក្រុមហ៊ុន / ស្ថាប័ន (COMPANY HRM SYSTEM)</div>
                  <div style={{ fontSize: '0.88rem' }}>ការិយាល័យធនធានមនុស្ស (Human Resources Department)</div>
                </div>
                <div style={{ textAlign: 'right', fontSize: '0.88rem' }}>
                  <div>កាលបរិច្ឆេទ: <strong>{new Date(printCert.requestDate).toISOString().split('T')[0]}</strong></div>
                  <div>លេខយោង: <strong>{printCert.referenceNo}</strong></div>
                </div>
              </div>

              {/* Letter Title */}
              <div style={{ textAlign: 'center', margin: '28px 0' }}>
                <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 900, textDecoration: 'underline' }}>
                  {CERT_TYPE_CONFIG[printCert.certificateType]?.titleKm || 'លិខិតបញ្ជាក់'}
                </h2>
                <div style={{ fontSize: '1rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', marginTop: '4px' }}>
                  {CERT_TYPE_CONFIG[printCert.certificateType]?.titleEn || 'OFFICIAL CERTIFICATE'}
                </div>
              </div>

              {/* Addressee Salutation */}
              <div style={{ marginBottom: '16px', fontSize: '1rem' }}>
                <strong>ផ្ញើជូន / To:</strong> {printCert.addressee || 'To Whom It May Concern (ជូនចំពោះអ្នកពាក់ព័ន្ធ)'}
              </div>

              {/* Main Certification Paragraph */}
              <div style={{ fontSize: '1rem', textAlign: 'justify', textIndent: '32px', marginBottom: '16px' }}>
                ការិយាល័យគ្រប់គ្រងធនធានមនុស្សនៃក្រុមហ៊ុន សូមបញ្ជាក់ថា លោក/លោកស្រី <strong>{printCert.employee.lastNameKh || ''} {printCert.employee.firstNameKh || ''}</strong> (អក្សរឡាតាំង: <strong>{printCert.employee.firstNameEn} {printCert.employee.lastNameEn}</strong>) អត្តលេខ <strong>{printCert.employee.employeeId}</strong> បច្ចុប្បន្នកំពុងបំពេញការងារជាបុគ្គលិកពេញសិទ្ធិក្នុងតួនាទីជា <strong>{printCert.employee.position}</strong> ក្នុងផ្នែក <strong>{printCert.employee.department}</strong> ចាប់តាំងពីថ្ងៃទី <strong>{printCert.employee.hireDate ? new Date(printCert.employee.hireDate).toISOString().split('T')[0] : '.../.../......'}</strong> រហូតមកដល់បច្ចុប្បន្ន។
              </div>

              {/* English Description Paragraph */}
              <div style={{ fontSize: '0.95rem', textAlign: 'justify', textIndent: '32px', marginBottom: '20px', color: '#1e293b' }}>
                This is to certify that <strong>{printCert.employee.gender === 'FEMALE' ? 'Ms.' : 'Mr.'} {printCert.employee.firstNameEn} {printCert.employee.lastNameEn}</strong>, holding Employee ID <strong>{printCert.employee.employeeId}</strong>, is a permanent bona fide employee of our company, presently employed in the position of <strong>{printCert.employee.position}</strong> under the <strong>{printCert.employee.department}</strong> department, since <strong>{printCert.employee.hireDate ? new Date(printCert.employee.hireDate).toISOString().split('T')[0] : '...'}</strong> to date.
              </div>

              {/* Salary Section if Salary Certificate */}
              {printCert.certificateType === 'SALARY_CERTIFICATE' && (
                <div style={{
                  background: '#f8fafc',
                  border: '1px solid #cbd5e1',
                  borderRadius: '8px',
                  padding: '16px 20px',
                  marginBottom: '20px'
                }}>
                  <div style={{ fontWeight: 800, fontSize: '0.95rem', color: '#0f172a', marginBottom: '6px' }}>
                    ព័ត៌មានប្រាក់បៀវត្សរ៍មូលដ្ឋាន (Monthly Remuneration Details):
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>ប្រាក់ខែមូលដ្ឋាន (Basic Gross Salary):</span>
                    <strong style={{ fontSize: '1.25rem', color: '#15803d' }}>
                      ${(printCert.employee.basicSalary || 0).toLocaleString()} USD / ខែ
                    </strong>
                  </div>
                </div>
              )}

              {/* Purpose statement */}
              <div style={{ fontSize: '0.95rem', marginBottom: '24px' }}>
                លិខិតនេះត្រូវបានចេញជូនតាមការស្នើសុំរបស់សាមីខ្លួន ក្នុងគោលបំណង <strong>{printCert.purpose}</strong> និងពុំមានសុពលភាពសម្រាប់ប្រើប្រាស់ក្រៅពីគោលបំណងនេះឡើយ។
              </div>

              {/* Signatures & Seal */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                marginTop: '50px',
                paddingTop: '20px'
              }}>
                <div style={{ textAlign: 'center', width: '220px' }}>
                  <div style={{ fontSize: '0.85rem', color: '#64748b' }}>ត្រា និងហត្ថលេខា HR</div>
                  <div style={{ height: '70px', margin: '10px 0', borderBottom: '1px dashed #94a3b8' }}></div>
                  <div style={{ fontWeight: 800, fontSize: '0.95rem' }}>ការិយាល័យធនធានមនុស្ស</div>
                  <div style={{ fontSize: '0.8rem', color: '#64748b' }}>HR Department</div>
                </div>

                <div style={{ textAlign: 'center', width: '240px' }}>
                  <div style={{ fontSize: '0.85rem' }}>ធ្វើនៅរាជធានីភ្នំពេញ, ថ្ងៃទី {new Date().getDate()} ខែ {new Date().getMonth() + 1} ឆ្នាំ {new Date().getFullYear()}</div>
                  <div style={{ height: '70px', margin: '10px 0', borderBottom: '1px dashed #94a3b8' }}></div>
                  <div style={{ fontWeight: 800, fontSize: '0.95rem' }}>នាយកប្រតិបត្តិ / General Manager</div>
                  <div style={{ fontSize: '0.8rem', color: '#64748b' }}>Authorized Signature & Company Seal</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
