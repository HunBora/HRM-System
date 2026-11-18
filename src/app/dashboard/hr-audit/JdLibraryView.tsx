'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Swal from 'sweetalert2';
import { FactoryJd, ALL_JDS } from './jdData';

interface JdLibraryViewProps {
  handlePrintTemplate: (elementId: string) => void;
  handleExportPdf: (elementId: string, filename: string) => void;
}

interface BilingualClause {
  khmerTitle: string;
  khmerBody: string;
  englishTitle: string;
  englishBody: string;
}

function parseBilingualClauses(contentKh: string, contentEn: string): BilingualClause[] {
  const splitSections = (text: string) => {
    const lines = (text || '').trim().split('\n');
    const sections: { title: string; body: string }[] = [];
    let currentTitle = '';
    let currentBody: string[] = [];
    const secRegex = /^[១-៩1-9]\s*[\.\、\)\:\-]\s*(.*)$/;

    for (const raw of lines) {
      const line = raw.trim();
      const match = line.match(secRegex);
      if (match) {
        if (currentTitle || currentBody.length > 0) {
          sections.push({
            title: currentTitle,
            body: currentBody.join('\n').trim(),
          });
          currentBody = [];
        }
        currentTitle = line;
      } else {
        currentBody.push(raw);
      }
    }
    if (currentTitle || currentBody.length > 0) {
      sections.push({
        title: currentTitle,
        body: currentBody.join('\n').trim(),
      });
    }
    return sections;
  };

  const khSections = splitSections(contentKh);
  const enSections = splitSections(contentEn);

  if (khSections.length === 0 && enSections.length === 0) {
    return [{
      khmerTitle: '',
      khmerBody: contentKh,
      englishTitle: '',
      englishBody: contentEn,
    }];
  }

  const maxLen = Math.max(khSections.length, enSections.length);
  const clauses: BilingualClause[] = [];

  for (let i = 0; i < maxLen; i++) {
    const kh = khSections[i] || { title: '', body: '' };
    const en = enSections[i] || { title: '', body: '' };
    clauses.push({
      khmerTitle: kh.title,
      khmerBody: kh.body,
      englishTitle: en.title,
      englishBody: en.body,
    });
  }

  return clauses;
}

export default function JdLibraryView({ handlePrintTemplate, handleExportPdf }: JdLibraryViewProps) {
  const [jds, setJds] = useState<FactoryJd[]>(ALL_JDS);
  const [selectedDept, setSelectedDept] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [previewJd, setPreviewJd] = useState<FactoryJd | null>(null);
  const [editingJd, setEditingJd] = useState<FactoryJd | null>(null);
  const [editingHeaderJd, setEditingHeaderJd] = useState<FactoryJd | null>(null);
  const [applyHeaderToAll, setApplyHeaderToAll] = useState<boolean>(false);
  const [isExportingPdf, setIsExportingPdf] = useState<boolean>(false);

  // Load and sync with localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('hrm_factory_jds_data');
      if (saved) {
        const parsed: FactoryJd[] = JSON.parse(saved);
        const existingIds = new Set(parsed.map((p) => p.id));
        const missing = ALL_JDS.filter((d) => !existingIds.has(d.id));
        setJds([...parsed, ...missing]);
      } else {
        setJds(ALL_JDS);
      }
    } catch (e) {
      console.error(e);
      setJds(ALL_JDS);
    }
  }, []);

  const saveJdsToStorage = (updatedList: FactoryJd[]) => {
    setJds(updatedList);
    try {
      localStorage.setItem('hrm_factory_jds_data', JSON.stringify(updatedList));
    } catch (err) {
      console.error('Failed to save JDs to localStorage:', err);
    }
  };

  const departments = [
    { key: 'ALL', labelKh: 'ទាំងអស់ (All Roles)', count: jds.length },
    { key: 'EXECUTIVE', labelKh: 'គណៈគ្រប់គ្រង (Executive)', count: jds.filter(j => j.department === 'EXECUTIVE').length },
    { key: 'HR_ADMIN', labelKh: 'រដ្ឋបាល & HR', count: jds.filter(j => j.department === 'HR_ADMIN').length },
    { key: 'COMPLIANCE', labelKh: 'សវនកម្ម & CSR', count: jds.filter(j => j.department === 'COMPLIANCE').length },
    { key: 'EHS', labelKh: 'សុវត្ថិភាព EHS', count: jds.filter(j => j.department === 'EHS').length },
    { key: 'PRODUCTION', labelKh: 'ផលិតកម្ម & កាត់ដេរ', count: jds.filter(j => j.department === 'PRODUCTION').length },
    { key: 'QUALITY', labelKh: 'គុណភាព QA/QC', count: jds.filter(j => j.department === 'QUALITY').length },
    { key: 'MAINTENANCE', labelKh: 'វិស្វកម្ម & ម៉ាស៊ីន', count: jds.filter(j => j.department === 'MAINTENANCE').length },
    { key: 'WAREHOUSE', labelKh: 'ឃ្លាំង & ភស្តុភារ', count: jds.filter(j => j.department === 'WAREHOUSE').length },
    { key: 'MEDICAL', labelKh: 'បន្ទប់សុខភាព', count: jds.filter(j => j.department === 'MEDICAL').length },
    { key: 'SECURITY', labelKh: 'សន្តិសុខ C-TPAT', count: jds.filter(j => j.department === 'SECURITY').length },
  ];

  const filteredJds = useMemo(() => {
    return jds.filter((jd) => {
      const matchDept = selectedDept === 'ALL' || jd.department === selectedDept;
      const q = searchQuery.toLowerCase().trim();
      const matchSearch =
        !q ||
        jd.code.toLowerCase().includes(q) ||
        jd.jobTitleKh.toLowerCase().includes(q) ||
        jd.jobTitleEn.toLowerCase().includes(q) ||
        (jd.jobTitleCn && jd.jobTitleCn.toLowerCase().includes(q)) ||
        jd.departmentKh.toLowerCase().includes(q) ||
        jd.companyName.toLowerCase().includes(q) ||
        jd.preparedBy.toLowerCase().includes(q) ||
        jd.approvedBy.toLowerCase().includes(q) ||
        jd.gradeLevel.toLowerCase().includes(q);
      return matchDept && matchSearch;
    });
  }, [jds, selectedDept, searchQuery]);

  const handleSaveEdit = () => {
    if (!editingJd) return;
    const updated = jds.map(j => (j.id === editingJd.id ? editingJd : j));
    saveJdsToStorage(updated);
    if (previewJd && previewJd.id === editingJd.id) {
      setPreviewJd(editingJd);
    }
    setEditingJd(null);
    Swal.fire({
      icon: 'success',
      title: 'បានរក្សាទុក!',
      text: 'សេចក្តីពិពណ៌នាមុខតំណែង (JD) ត្រូវបានកែប្រែ និងរក្សាទុកដោយជោគជ័យ។',
      timer: 1500,
      showConfirmButton: false,
    });
  };

  const handleSaveQuickHeader = () => {
    if (!editingHeaderJd) return;

    let updated: FactoryJd[];
    if (applyHeaderToAll) {
      // Apply Company Name and Signatories (Prepared, Verified, Approved) to ALL JDs
      updated = jds.map((j) => {
        if (j.id === editingHeaderJd.id) {
          return editingHeaderJd;
        }
        return {
          ...j,
          companyName: editingHeaderJd.companyName,
          preparedBy: editingHeaderJd.preparedBy,
          preparedRole: editingHeaderJd.preparedRole,
          verifiedBy: editingHeaderJd.verifiedBy,
          verifiedRole: editingHeaderJd.verifiedRole,
          approvedBy: editingHeaderJd.approvedBy,
          approvedRole: editingHeaderJd.approvedRole,
          initialIssuedDate: editingHeaderJd.initialIssuedDate,
          effectiveDate: editingHeaderJd.effectiveDate,
          amendDate: editingHeaderJd.amendDate,
        };
      });
    } else {
      updated = jds.map(j => (j.id === editingHeaderJd.id ? editingHeaderJd : j));
    }

    saveJdsToStorage(updated);
    if (previewJd && previewJd.id === editingHeaderJd.id) {
      setPreviewJd(editingHeaderJd);
    }
    setEditingHeaderJd(null);
    Swal.fire({
      icon: 'success',
      title: applyHeaderToAll ? 'បានធ្វើបច្ចុប្បន្នភាពគ្រប់មុខតំណែងទាំងអស់!' : 'បានធ្វើបច្ចុប្បន្នភាព!',
      text: applyHeaderToAll
        ? 'ឈ្មោះរោងចក្រ ឈ្មោះហត្ថលេខី និងកាលបរិច្ឆេទ ត្រូវបានអនុវត្តចំពោះរាល់ JD ទាំងអស់។'
        : 'Doc No, ឈ្មោះហត្ថលេខី, ឈ្មោះរោងចក្រ និងកាលបរិច្ឆេទ ត្រូវបានផ្លាស់ប្តូរដោយជោគជ័យ។',
      timer: 1800,
      showConfirmButton: false,
    });
  };

  const handleExportMultiPagePdf = async (jd: FactoryJd) => {
    try {
      setIsExportingPdf(true);
      Swal.fire({
        title: 'កំពុងទាញយក PDF...',
        html: `កំពុងបង្កើតឯកសារ PDF សម្រាប់មុខតំណែង <b>${jd.jobTitleEn}</b>...`,
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading();
        },
      });

      const element = document.getElementById('jd-printable-document');
      if (!element) {
        throw new Error('រកមិនឃើញផ្ទាំងឯកសារបោះពុម្ពឡើយ!');
      }

      const html2canvas = (await import('html2canvas')).default;
      const { jsPDF } = await import('jspdf');

      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
      });

      const imgData = canvas.toDataURL('image/jpeg', 0.95);
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

      pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`${jd.code}_${jd.jobTitleEn.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`);

      Swal.fire({
        icon: 'success',
        title: 'ជោគជ័យ!',
        text: 'ឯកសារ PDF ត្រូវបានទាញយករួចរាល់។',
        timer: 1500,
        showConfirmButton: false,
      });
    } catch (err: any) {
      console.error(err);
      Swal.fire({
        icon: 'error',
        title: 'បរាជ័យក្នុងការទាញយក',
        text: err?.message || 'មានបញ្ហាបច្ចេកទេស!',
      });
    } finally {
      setIsExportingPdf(false);
    }
  };

  return (
    <div style={{ marginTop: '10px' }}>
      {/* Search & Top Action Bar */}
      <div
        style={{
          background: '#ffffff',
          padding: '16px',
          borderRadius: '12px',
          border: '1px solid #e2e8f0',
          boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
          marginBottom: '16px',
          display: 'flex',
          flexWrap: 'wrap',
          gap: '12px',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: '1 1 320px' }}>
          <div style={{ position: 'relative', width: '100%' }}>
            <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }}>
              🔍
            </span>
            <input
              type="text"
              placeholder="ស្វែងរកតាមកូដ JD, ឈ្មោះមុខតំណែង, ឈ្មោះរោងចក្រ, ឬហត្ថលេខី..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '9px 12px 9px 36px',
                borderRadius: '8px',
                border: '1.5px solid #cbd5e1',
                fontSize: '0.85rem',
                outline: 'none',
              }}
            />
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 600 }}>
            បង្ហាញ: <strong style={{ color: '#0f172a' }}>{filteredJds.length}</strong> / {jds.length} មុខតំណែង
          </span>
        </div>
      </div>

      {/* Department Filter Pills */}
      <div
        style={{
          display: 'flex',
          gap: '6px',
          overflowX: 'auto',
          paddingBottom: '10px',
          marginBottom: '16px',
        }}
      >
        {departments.map((dept) => (
          <button
            key={dept.key}
            onClick={() => setSelectedDept(dept.key)}
            style={{
              padding: '6px 12px',
              borderRadius: '20px',
              border: selectedDept === dept.key ? '1.5px solid #2563eb' : '1px solid #e2e8f0',
              background: selectedDept === dept.key ? '#eff6ff' : '#ffffff',
              color: selectedDept === dept.key ? '#1d4ed8' : '#475569',
              fontWeight: selectedDept === dept.key ? 700 : 500,
              fontSize: '0.8rem',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'all 0.15s ease',
            }}
          >
            {dept.labelKh}
            <span
              style={{
                background: selectedDept === dept.key ? '#3b82f6' : '#f1f5f9',
                color: selectedDept === dept.key ? '#ffffff' : '#64748b',
                padding: '1px 6px',
                borderRadius: '10px',
                fontSize: '0.7rem',
                fontWeight: 700,
              }}
            >
              {dept.count}
            </span>
          </button>
        ))}
      </div>

      {/* Grid Cards of JDs */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))',
          gap: '16px',
        }}
      >
        {filteredJds.map((jd) => (
          <div
            key={jd.id}
            style={{
              background: '#ffffff',
              borderRadius: '12px',
              border: '1px solid #e2e8f0',
              boxShadow: '0 2px 4px rgba(0,0,0,0.03)',
              padding: '16px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              transition: 'all 0.2s ease',
            }}
          >
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                <span
                  style={{
                    background: '#f8fafc',
                    border: '1px solid #cbd5e1',
                    color: '#0f172a',
                    fontWeight: 800,
                    fontSize: '0.78rem',
                    padding: '3px 8px',
                    borderRadius: '6px',
                    fontFamily: 'monospace',
                  }}
                >
                  {jd.code}
                </span>

                <span
                  style={{
                    background:
                      jd.gradeLevel.includes('Executive')
                        ? '#fef2f2'
                        : jd.gradeLevel.includes('Manager')
                        ? '#fef3c7'
                        : jd.gradeLevel.includes('Supervisor')
                        ? '#eff6ff'
                        : '#f0fdf4',
                    color:
                      jd.gradeLevel.includes('Executive')
                        ? '#991b1b'
                        : jd.gradeLevel.includes('Manager')
                        ? '#92400e'
                        : jd.gradeLevel.includes('Supervisor')
                        ? '#1e40af'
                        : '#166534',
                    fontWeight: 700,
                    fontSize: '0.72rem',
                    padding: '2px 8px',
                    borderRadius: '12px',
                  }}
                >
                  {jd.gradeLevel}
                </span>
              </div>

              <h4 style={{ margin: '0 0 4px 0', fontSize: '0.98rem', fontWeight: 800, color: '#0f172a', lineHeight: 1.35 }}>
                {jd.jobTitleKh}
              </h4>
              <div style={{ fontSize: '0.82rem', fontWeight: 600, color: '#2563eb', marginBottom: '2px' }}>
                {jd.jobTitleEn} {jd.jobTitleCn && <span style={{ color: '#64748b', fontWeight: 500 }}>({jd.jobTitleCn})</span>}
              </div>
              <div style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '10px' }}>
                🏢 {jd.companyName} • {jd.departmentKh}
              </div>

              <div
                style={{
                  background: '#f8fafc',
                  padding: '8px 10px',
                  borderRadius: '6px',
                  fontSize: '0.76rem',
                  color: '#475569',
                  marginBottom: '12px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '4px',
                }}
              >
                <div>
                  <strong>រាយការណ៍ជូន:</strong> {jd.reportsToKh}
                </div>
                <div>
                  <strong>គ្រប់គ្រងលើ:</strong> {jd.supervisesKh}
                </div>
                <div>
                  <strong>ហត្ថលេខី:</strong> {jd.preparedBy} / {jd.approvedBy}
                </div>
                <div style={{ display: 'flex', gap: '12px', marginTop: '2px', color: '#64748b', fontSize: '0.72rem' }}>
                  <span>⚡ ធរមាន: <strong>{jd.effectiveDate}</strong></span>
                  <span>🔄 វិសោធនកម្ម: <strong>{jd.amendDate}</strong></span>
                </div>
              </div>

              <p
                style={{
                  fontSize: '0.78rem',
                  color: '#334155',
                  lineHeight: 1.45,
                  margin: '0 0 12px 0',
                  display: '-webkit-box',
                  WebkitLineClamp: 3,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                }}
              >
                {jd.jobSummaryKh}
              </p>
            </div>

            <div
              style={{
                display: 'flex',
                gap: '8px',
                borderTop: '1px solid #f1f5f9',
                paddingTop: '12px',
              }}
            >
              <button
                onClick={() => setPreviewJd(jd)}
                style={{
                  flex: 1,
                  padding: '7px 10px',
                  background: '#1e40af',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '5px',
                }}
              >
                👁️ មើល & បោះពុម្ព
              </button>
              <button
                onClick={() => setEditingJd({ ...jd })}
                style={{
                  padding: '7px 12px',
                  background: '#f8fafc',
                  color: '#334155',
                  border: '1px solid #cbd5e1',
                  borderRadius: '6px',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                ✏️ កែប្រែ
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Preview & Print Modal */}
      {previewJd && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.75)',
            zIndex: 9999,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            padding: '20px',
            overflowY: 'auto',
          }}
        >
          <div
            style={{
              background: '#ffffff',
              borderRadius: '16px',
              width: '95%',
              maxWidth: '920px',
              maxHeight: '94vh',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
              overflow: 'hidden',
            }}
          >
            {/* Modal Header */}
            <div
              style={{
                padding: '14px 20px',
                borderBottom: '1px solid #e2e8f0',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                background: '#f8fafc',
              }}
            >
              <div>
                <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: '#0f172a' }}>
                  {previewJd.jobTitleKh} ({previewJd.code})
                </h3>
                <span style={{ fontSize: '0.78rem', color: '#64748b' }}>
                  {previewJd.jobTitleEn} • {previewJd.companyName}
                </span>
              </div>

              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <button
                  onClick={() => {
                    setEditingHeaderJd({ ...previewJd });
                    setApplyHeaderToAll(false);
                  }}
                  style={{
                    padding: '6px 12px',
                    background: '#047857',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '6px',
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px',
                  }}
                  title="កែប្រែឈ្មោះរោងចក្រ, ឈ្មោះហត្ថលេខី, Doc No, និងកាលបរិច្ឆេទ"
                >
                  ✍️ កែប្រែឈ្មោះ & ក្រុមហ៊ុន
                </button>
                <button
                  onClick={() => handleExportMultiPagePdf(previewJd)}
                  disabled={isExportingPdf}
                  style={{
                    padding: '6px 12px',
                    background: '#dc2626',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '6px',
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px',
                  }}
                >
                  📥 ទាញយក PDF
                </button>
                <button
                  onClick={() => handlePrintTemplate('jd-printable-document')}
                  style={{
                    padding: '6px 12px',
                    background: '#2563eb',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '6px',
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px',
                  }}
                >
                  🖨️ បោះពុម្ព (Print)
                </button>
                <button
                  onClick={() => setPreviewJd(null)}
                  style={{
                    padding: '6px 10px',
                    background: '#e2e8f0',
                    color: '#475569',
                    border: 'none',
                    borderRadius: '6px',
                    fontSize: '0.85rem',
                    fontWeight: 800,
                    cursor: 'pointer',
                  }}
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Document Content Box */}
            <div
              style={{
                padding: '24px',
                overflowY: 'auto',
                flex: 1,
                background: '#f1f5f9',
              }}
            >
              <div
                id="jd-printable-document"
                style={{
                  background: '#ffffff',
                  maxWidth: '800px',
                  margin: '0 auto',
                  padding: '30px 36px',
                  boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
                  fontFamily: '"Hanuman", "Kantumruy Pro", "Segoe UI", Arial, sans-serif',
                  color: '#0f172a',
                  lineHeight: 1.5,
                }}
              >
                {/* Official Factory Document Header */}
                <table
                  style={{
                    width: '100%',
                    borderCollapse: 'collapse',
                    marginBottom: '16px',
                    border: '1.5px solid #000000',
                  }}
                >
                  <tbody>
                    <tr>
                      <td
                        onClick={() => {
                          setEditingHeaderJd({ ...previewJd });
                          setApplyHeaderToAll(false);
                        }}
                        title="ចុចទីនេះដើម្បីកែប្រែឈ្មោះរោងចក្រ/ក្រុមហ៊ុន"
                        style={{
                          width: '26%',
                          border: '1px solid #000000',
                          padding: '10px 8px',
                          textAlign: 'center',
                          verticalAlign: 'middle',
                          fontWeight: 800,
                          cursor: 'pointer',
                          background: '#fcfcfc',
                        }}
                      >
                        <div style={{ fontSize: '0.98rem', color: '#1e3a8a', textTransform: 'uppercase', lineHeight: 1.3, wordBreak: 'break-word' }}>
                          {previewJd.companyName}
                        </div>
                        <div style={{ fontSize: '0.66rem', color: '#64748b', marginTop: '2px' }}>
                          Standard Manufacturing Facility
                        </div>
                      </td>
                      <td
                        style={{
                          width: '46%',
                          border: '1px solid #000000',
                          padding: '10px',
                          textAlign: 'center',
                          verticalAlign: 'middle',
                        }}
                      >
                        <div style={{ fontSize: '0.88rem', fontWeight: 800 }}>
                          សេចក្តីពិពណ៌នាមុខតំណែងស្តង់ដា
                        </div>
                        <div style={{ fontSize: '0.82rem', fontWeight: 800, textTransform: 'uppercase' }}>
                          STANDARD JOB DESCRIPTION (JD)
                        </div>
                        <div style={{ fontSize: '0.78rem', color: '#475569' }}>
                          {previewJd.jobTitleKh} / {previewJd.jobTitleEn}
                        </div>
                      </td>
                      <td
                        onClick={() => {
                          setEditingHeaderJd({ ...previewJd });
                          setApplyHeaderToAll(false);
                        }}
                        title="ចុចទីនេះដើម្បីកែប្រែ Doc No, Edition, Issued, Effective, Amend, Page"
                        style={{
                          width: '28%',
                          border: '1px solid #000000',
                          padding: '6px 8px',
                          fontSize: '0.74rem',
                          verticalAlign: 'middle',
                          cursor: 'pointer',
                          background: '#fcfcfc',
                          transition: 'background 0.2s',
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
                          <strong>Doc No:</strong> <span>{previewJd.code}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
                          <strong>Edition:</strong> <span>{previewJd.edition}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
                          <strong>Issued:</strong> <span>{previewJd.initialIssuedDate || '10-11-2023'}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
                          <strong>Effective:</strong> <span>{previewJd.effectiveDate}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
                          <strong>Amend:</strong> <span>{previewJd.amendDate}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <strong>Page:</strong> <span>{previewJd.pageInfo}</span>
                        </div>
                      </td>
                    </tr>
                  </tbody>
                </table>

                {/* Role Information Grid */}
                <table
                  style={{
                    width: '100%',
                    borderCollapse: 'collapse',
                    marginBottom: '16px',
                    fontSize: '0.8rem',
                    border: '1px solid #000000',
                  }}
                >
                  <tbody>
                    <tr>
                      <td style={{ border: '1px solid #000000', padding: '6px 8px', background: '#f8fafc', width: '22%', fontWeight: 700 }}>
                        មុខតំណែង (Job Title):
                      </td>
                      <td style={{ border: '1px solid #000000', padding: '6px 8px', width: '28%', fontWeight: 800 }}>
                        {previewJd.jobTitleKh} ({previewJd.jobTitleEn})
                      </td>
                      <td style={{ border: '1px solid #000000', padding: '6px 8px', background: '#f8fafc', width: '22%', fontWeight: 700 }}>
                        កម្រិតតួនាទី (Grade):
                      </td>
                      <td style={{ border: '1px solid #000000', padding: '6px 8px', width: '28%' }}>
                        {previewJd.gradeLevel}
                      </td>
                    </tr>
                    <tr>
                      <td style={{ border: '1px solid #000000', padding: '6px 8px', background: '#f8fafc', fontWeight: 700 }}>
                        ផ្នែក/ដេប៉ាតឺម៉ង់:
                      </td>
                      <td style={{ border: '1px solid #000000', padding: '6px 8px' }}>
                        {previewJd.departmentKh}
                      </td>
                      <td style={{ border: '1px solid #000000', padding: '6px 8px', background: '#f8fafc', fontWeight: 700 }}>
                        រាយការណ៍ជូន (Reports To):
                      </td>
                      <td style={{ border: '1px solid #000000', padding: '6px 8px' }}>
                        {previewJd.reportsToKh}
                      </td>
                    </tr>
                    <tr>
                      <td style={{ border: '1px solid #000000', padding: '6px 8px', background: '#f8fafc', fontWeight: 700 }}>
                        គ្រប់គ្រងលើ (Supervises):
                      </td>
                      <td colSpan={3} style={{ border: '1px solid #000000', padding: '6px 8px' }}>
                        {previewJd.supervisesKh}
                      </td>
                    </tr>
                  </tbody>
                </table>

                {/* Section 1: Job Purpose / Summary */}
                <div style={{ marginBottom: '14px' }}>
                  <div
                    style={{
                      background: '#1e40af',
                      color: '#ffffff',
                      padding: '4px 8px',
                      fontSize: '0.82rem',
                      fontWeight: 800,
                      marginBottom: '6px',
                    }}
                  >
                    ១. គោលបំណងមុខតំណែង (JOB PURPOSE & SUMMARY)
                  </div>
                  <div style={{ fontSize: '0.8rem', textAlign: 'justify', marginBottom: '4px' }}>
                    {previewJd.jobSummaryKh}
                  </div>
                  <div style={{ fontSize: '0.78rem', color: '#475569', fontStyle: 'italic', textAlign: 'justify' }}>
                    {previewJd.jobSummaryEn}
                  </div>
                </div>

                {/* Section 2: Key Duties & Responsibilities (1-Row Bilingual Table) */}
                <div style={{ marginBottom: '14px' }}>
                  <div
                    style={{
                      background: '#1e40af',
                      color: '#ffffff',
                      padding: '4px 8px',
                      fontSize: '0.82rem',
                      fontWeight: 800,
                      marginBottom: '6px',
                    }}
                  >
                    ២. ភារកិច្ច និងការទទួលខុសត្រូវចម្បង (KEY DUTIES & RESPONSIBILITIES)
                  </div>

                  <table
                    style={{
                      width: '100%',
                      borderCollapse: 'collapse',
                      fontSize: '0.78rem',
                      border: '1px solid #000000',
                    }}
                  >
                    <thead>
                      <tr style={{ background: '#f1f5f9' }}>
                        <th style={{ width: '8%', border: '1px solid #000000', padding: '6px', textAlign: 'center' }}>ល.រ</th>
                        <th style={{ width: '92%', border: '1px solid #000000', padding: '6px', textAlign: 'left' }}>
                          ខ្លឹមសារភារកិច្ចការងារ (Bilingual Clauses: Khmer & English)
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {parseBilingualClauses(previewJd.dutiesKh, previewJd.dutiesEn).map((clause, idx) => (
                        <tr key={idx}>
                          <td
                            style={{
                              border: '1px solid #000000',
                              padding: '8px',
                              textAlign: 'center',
                              verticalAlign: 'top',
                              fontWeight: 700,
                            }}
                          >
                            {idx + 1}
                          </td>
                          <td style={{ border: '1px solid #000000', padding: '8px' }}>
                            {clause.khmerTitle && (
                              <div style={{ fontWeight: 800, color: '#0f172a', marginBottom: '3px' }}>
                                {clause.khmerTitle}
                              </div>
                            )}
                            <div style={{ whiteSpace: 'pre-line', marginBottom: '6px' }}>
                              {clause.khmerBody}
                            </div>
                            {clause.englishTitle && (
                              <div style={{ fontWeight: 700, color: '#1e40af', fontSize: '0.75rem', marginBottom: '2px' }}>
                                {clause.englishTitle}
                              </div>
                            )}
                            <div style={{ whiteSpace: 'pre-line', color: '#475569', fontSize: '0.75rem', fontStyle: 'italic' }}>
                              {clause.englishBody}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Section 3: Authorities & Decision Making */}
                <div style={{ marginBottom: '14px' }}>
                  <div
                    style={{
                      background: '#1e40af',
                      color: '#ffffff',
                      padding: '4px 8px',
                      fontSize: '0.82rem',
                      fontWeight: 800,
                      marginBottom: '6px',
                    }}
                  >
                    ៣. សិទ្ធិអំណាច និងការសម្រេចចិត្ត (AUTHORITIES & DECISION MAKING)
                  </div>
                  <div style={{ fontSize: '0.8rem', marginBottom: '2px' }}>
                    {previewJd.authoritiesKh}
                  </div>
                  <div style={{ fontSize: '0.76rem', color: '#475569', fontStyle: 'italic' }}>
                    {previewJd.authoritiesEn}
                  </div>
                </div>

                {/* Section 4: Qualifications & Requirements */}
                <div style={{ marginBottom: '14px' }}>
                  <div
                    style={{
                      background: '#1e40af',
                      color: '#ffffff',
                      padding: '4px 8px',
                      fontSize: '0.82rem',
                      fontWeight: 800,
                      marginBottom: '6px',
                    }}
                  >
                    ៤. លក្ខខណ្ឌតម្រូវការងារ និងការអប់រំ (QUALIFICATIONS & REQUIREMENTS)
                  </div>
                  <div style={{ fontSize: '0.8rem', marginBottom: '2px' }}>
                    {previewJd.qualificationsKh}
                  </div>
                  <div style={{ fontSize: '0.76rem', color: '#475569', fontStyle: 'italic' }}>
                    {previewJd.qualificationsEn}
                  </div>
                </div>

                {/* Section 5: KPIs */}
                <div style={{ marginBottom: '20px' }}>
                  <div
                    style={{
                      background: '#1e40af',
                      color: '#ffffff',
                      padding: '4px 8px',
                      fontSize: '0.82rem',
                      fontWeight: 800,
                      marginBottom: '6px',
                    }}
                  >
                    ៥. សូចនាករវាស់វែងសមិទ្ធកម្មការងារ (KEY PERFORMANCE INDICATORS - KPIS)
                  </div>
                  <div style={{ fontSize: '0.8rem', marginBottom: '2px' }}>
                    {previewJd.kpisKh}
                  </div>
                  <div style={{ fontSize: '0.76rem', color: '#475569', fontStyle: 'italic' }}>
                    {previewJd.kpisEn}
                  </div>
                </div>

                {/* Section 6: Official 4-Party Sign-off Box (CLICKABLE TO EDIT) */}
                <table
                  onClick={() => {
                    setEditingHeaderJd({ ...previewJd });
                    setApplyHeaderToAll(false);
                  }}
                  title="ចុចទីនេះដើម្បីកែប្រែឈ្មោះ និងតួនាទីអ្នករៀបចំ អ្នកត្រួតពិនិត្យ និងអ្នកអនុម័ត"
                  style={{
                    width: '100%',
                    borderCollapse: 'collapse',
                    fontSize: '0.74rem',
                    border: '1.5px solid #000000',
                    textAlign: 'center',
                    cursor: 'pointer',
                    background: '#fcfcfc',
                    transition: 'background 0.2s',
                  }}
                >
                  <thead>
                    <tr style={{ background: '#f8fafc' }}>
                      <th style={{ width: '25%', border: '1px solid #000000', padding: '6px' }}>
                        រៀបចំដោយ (PREPARED BY)
                      </th>
                      <th style={{ width: '25%', border: '1px solid #000000', padding: '6px' }}>
                        ត្រួតពិនិត្យដោយ (VERIFIED BY)
                      </th>
                      <th style={{ width: '25%', border: '1px solid #000000', padding: '6px' }}>
                        អនុម័តដោយ (APPROVED BY)
                      </th>
                      <th style={{ width: '25%', border: '1px solid #000000', padding: '6px' }}>
                        សាមីខ្លួនបានយល់ព្រម (ACKNOWLEDGED BY)
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td style={{ border: '1px solid #000000', padding: '36px 6px 6px 6px', verticalAlign: 'bottom' }}>
                        <div style={{ fontWeight: 800, color: '#0f172a' }}>{previewJd.preparedBy}</div>
                        <div style={{ color: '#475569', fontSize: '0.68rem', marginTop: '2px' }}>{previewJd.preparedRole}</div>
                      </td>
                      <td style={{ border: '1px solid #000000', padding: '36px 6px 6px 6px', verticalAlign: 'bottom' }}>
                        <div style={{ fontWeight: 800, color: '#0f172a' }}>{previewJd.verifiedBy}</div>
                        <div style={{ color: '#475569', fontSize: '0.68rem', marginTop: '2px' }}>{previewJd.verifiedRole}</div>
                      </td>
                      <td style={{ border: '1px solid #000000', padding: '36px 6px 6px 6px', verticalAlign: 'bottom' }}>
                        <div style={{ fontWeight: 800, color: '#0f172a' }}>{previewJd.approvedBy}</div>
                        <div style={{ color: '#475569', fontSize: '0.68rem', marginTop: '2px' }}>{previewJd.approvedRole}</div>
                      </td>
                      <td style={{ border: '1px solid #000000', padding: '36px 6px 6px 6px', verticalAlign: 'bottom' }}>
                        <div style={{ borderBottom: '1px dotted #94a3b8', margin: '0 10px 4px 10px' }}></div>
                        <div style={{ color: '#64748b', fontSize: '0.68rem' }}>ហត្ថលេខា & ឈ្មោះបុគ្គលិក</div>
                      </td>
                    </tr>
                  </tbody>
                </table>
                <div style={{ textAlign: 'right', fontSize: '0.68rem', color: '#94a3b8', marginTop: '4px', fontStyle: 'italic' }}>
                  * ចុចលើតារាងហត្ថលេខី ឬក្បាលឯកសារដើម្បីកែប្រែឈ្មោះ និងកាលបរិច្ឆេទ
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* QUICK EDIT HEADER & SIGNATORIES MODAL */}
      {editingHeaderJd && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.75)',
            zIndex: 10000,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            padding: '20px',
            overflowY: 'auto',
          }}
        >
          <div
            style={{
              background: '#ffffff',
              borderRadius: '16px',
              width: '95%',
              maxWidth: '680px',
              maxHeight: '94vh',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                padding: '14px 20px',
                borderBottom: '1px solid #e2e8f0',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                background: '#f8fafc',
              }}
            >
              <div>
                <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: '#0f172a' }}>
                  ✍️ កែប្រែឈ្មោះរោងចក្រ & ហត្ថលេខី: {editingHeaderJd.jobTitleKh}
                </h3>
                <span style={{ fontSize: '0.74rem', color: '#64748b' }}>
                  កំណត់ឈ្មោះក្រុមហ៊ុន និងឈ្មោះអ្នកចុះហត្ថលេខាឱ្យត្រូវតាមរោងចក្រជាក់ស្តែង
                </span>
              </div>
              <button
                onClick={() => setEditingHeaderJd(null)}
                style={{ background: 'none', border: 'none', fontSize: '1.1rem', cursor: 'pointer', color: '#64748b' }}
              >
                ✕
              </button>
            </div>

            <div style={{ padding: '20px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {/* COMPANY NAME */}
              <div style={{ background: '#eff6ff', padding: '12px', borderRadius: '8px', border: '1px solid #bfdbfe' }}>
                <label style={{ fontSize: '0.78rem', fontWeight: 800, color: '#1e40af', display: 'block', marginBottom: '4px' }}>
                  🏢 ឈ្មោះក្រុមហ៊ុន / រោងចក្រ (Factory / Company Name):
                </label>
                <input
                  type="text"
                  value={editingHeaderJd.companyName}
                  onChange={(e) => setEditingHeaderJd({ ...editingHeaderJd, companyName: e.target.value })}
                  placeholder="e.g. G.S.textileGarment(Cambodia) co.,Ltd"
                  style={{ width: '100%', padding: '8px 10px', border: '1.5px solid #93c5fd', borderRadius: '6px', fontSize: '0.85rem', fontWeight: 600 }}
                />
              </div>

              {/* DOCUMENT DETAILS */}
              <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: '0.76rem', fontWeight: 800, color: '#334155', marginBottom: '8px' }}>
                  📄 លេខកូដឯកសារ និងកាលបរិច្ឆេទ (Doc No & Dates)
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', marginBottom: '8px' }}>
                  <div>
                    <label style={{ fontSize: '0.72rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '2px' }}>
                      Doc No:
                    </label>
                    <input
                      type="text"
                      value={editingHeaderJd.code}
                      onChange={(e) => setEditingHeaderJd({ ...editingHeaderJd, code: e.target.value })}
                      style={{ width: '100%', padding: '6px 8px', border: '1px solid #cbd5e1', borderRadius: '5px', fontSize: '0.8rem' }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.72rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '2px' }}>
                      Edition:
                    </label>
                    <input
                      type="text"
                      value={editingHeaderJd.edition}
                      onChange={(e) => setEditingHeaderJd({ ...editingHeaderJd, edition: e.target.value })}
                      style={{ width: '100%', padding: '6px 8px', border: '1px solid #cbd5e1', borderRadius: '5px', fontSize: '0.8rem' }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.72rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '2px' }}>
                      Page Info:
                    </label>
                    <input
                      type="text"
                      value={editingHeaderJd.pageInfo}
                      onChange={(e) => setEditingHeaderJd({ ...editingHeaderJd, pageInfo: e.target.value })}
                      style={{ width: '100%', padding: '6px 8px', border: '1px solid #cbd5e1', borderRadius: '5px', fontSize: '0.8rem' }}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                  <div>
                    <label style={{ fontSize: '0.72rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '2px' }}>
                      ចេញដំបូង (Issued):
                    </label>
                    <input
                      type="text"
                      value={editingHeaderJd.initialIssuedDate || '10-11-2023'}
                      onChange={(e) => setEditingHeaderJd({ ...editingHeaderJd, initialIssuedDate: e.target.value })}
                      style={{ width: '100%', padding: '6px 8px', border: '1px solid #cbd5e1', borderRadius: '5px', fontSize: '0.8rem' }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.72rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '2px' }}>
                      ចូលជាធរមាន (Effective):
                    </label>
                    <input
                      type="text"
                      value={editingHeaderJd.effectiveDate}
                      onChange={(e) => setEditingHeaderJd({ ...editingHeaderJd, effectiveDate: e.target.value })}
                      style={{ width: '100%', padding: '6px 8px', border: '1px solid #cbd5e1', borderRadius: '5px', fontSize: '0.8rem' }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.72rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '2px' }}>
                      កែប្រែ/ពិនិត្យ (Amend):
                    </label>
                    <input
                      type="text"
                      value={editingHeaderJd.amendDate}
                      onChange={(e) => setEditingHeaderJd({ ...editingHeaderJd, amendDate: e.target.value })}
                      style={{ width: '100%', padding: '6px 8px', border: '1px solid #cbd5e1', borderRadius: '5px', fontSize: '0.8rem' }}
                    />
                  </div>
                </div>
              </div>

              {/* SIGNATORIES: PREPARED BY, VERIFIED BY, APPROVED BY */}
              <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: '0.76rem', fontWeight: 800, color: '#047857', marginBottom: '8px' }}>
                  ✍️ ឈ្មោះហត្ថលេខី និងតួនាទី (Signatory Names & Roles)
                </div>

                {/* 1. PREPARED BY */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '8px' }}>
                  <div>
                    <label style={{ fontSize: '0.72rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '2px' }}>
                      ឈ្មោះអ្នករៀបចំ (Prepared By Name):
                    </label>
                    <input
                      type="text"
                      value={editingHeaderJd.preparedBy}
                      onChange={(e) => setEditingHeaderJd({ ...editingHeaderJd, preparedBy: e.target.value })}
                      placeholder="e.g. Mr. CHAN PHEARUM"
                      style={{ width: '100%', padding: '6px 8px', border: '1px solid #cbd5e1', borderRadius: '5px', fontSize: '0.82rem' }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.72rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '2px' }}>
                      តួនាទីអ្នករៀបចំ (Prepared Role):
                    </label>
                    <input
                      type="text"
                      value={editingHeaderJd.preparedRole}
                      onChange={(e) => setEditingHeaderJd({ ...editingHeaderJd, preparedRole: e.target.value })}
                      placeholder="e.g. ប្រធានរដ្ឋបាល/ធនធានមនុស្ស HR/Admin Manager"
                      style={{ width: '100%', padding: '6px 8px', border: '1px solid #cbd5e1', borderRadius: '5px', fontSize: '0.82rem' }}
                    />
                  </div>
                </div>

                {/* 2. VERIFIED BY */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '8px' }}>
                  <div>
                    <label style={{ fontSize: '0.72rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '2px' }}>
                      ឈ្មោះអ្នកត្រួតពិនិត្យ (Verified By Name):
                    </label>
                    <input
                      type="text"
                      value={editingHeaderJd.verifiedBy}
                      onChange={(e) => setEditingHeaderJd({ ...editingHeaderJd, verifiedBy: e.target.value })}
                      placeholder="e.g. Mr. LEANG SOPHEA"
                      style={{ width: '100%', padding: '6px 8px', border: '1px solid #cbd5e1', borderRadius: '5px', fontSize: '0.82rem' }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.72rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '2px' }}>
                      តួនាទីអ្នកត្រួតពិនិត្យ (Verified Role):
                    </label>
                    <input
                      type="text"
                      value={editingHeaderJd.verifiedRole}
                      onChange={(e) => setEditingHeaderJd({ ...editingHeaderJd, verifiedRole: e.target.value })}
                      placeholder="e.g. ប្រធានផ្នែកសវនកម្ម Compliance Manager"
                      style={{ width: '100%', padding: '6px 8px', border: '1px solid #cbd5e1', borderRadius: '5px', fontSize: '0.82rem' }}
                    />
                  </div>
                </div>

                {/* 3. APPROVED BY */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  <div>
                    <label style={{ fontSize: '0.72rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '2px' }}>
                      ឈ្មោះអ្នកអនុម័ត (Approved By Name):
                    </label>
                    <input
                      type="text"
                      value={editingHeaderJd.approvedBy}
                      onChange={(e) => setEditingHeaderJd({ ...editingHeaderJd, approvedBy: e.target.value })}
                      placeholder="e.g. Mr. CHEN LANMAO"
                      style={{ width: '100%', padding: '6px 8px', border: '1px solid #cbd5e1', borderRadius: '5px', fontSize: '0.82rem' }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.72rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '2px' }}>
                      តួនាទីអ្នកអនុម័ត (Approved Role):
                    </label>
                    <input
                      type="text"
                      value={editingHeaderJd.approvedRole}
                      onChange={(e) => setEditingHeaderJd({ ...editingHeaderJd, approvedRole: e.target.value })}
                      placeholder="e.g. នាយកក្រុមហ៊ុន General Manager"
                      style={{ width: '100%', padding: '6px 8px', border: '1px solid #cbd5e1', borderRadius: '5px', fontSize: '0.82rem' }}
                    />
                  </div>
                </div>
              </div>

              {/* BATCH APPLY CHECKBOX */}
              <div
                style={{
                  background: '#fef3c7',
                  border: '1px solid #fde68a',
                  padding: '10px 12px',
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                }}
              >
                <input
                  type="checkbox"
                  id="applyHeaderAllCheckbox"
                  checked={applyHeaderToAll}
                  onChange={(e) => setApplyHeaderToAll(e.target.checked)}
                  style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                />
                <label
                  htmlFor="applyHeaderAllCheckbox"
                  style={{ fontSize: '0.78rem', fontWeight: 700, color: '#92400e', cursor: 'pointer' }}
                >
                  ⚡ អនុវត្តឈ្មោះរោងចក្រ ឈ្មោះហត្ថលេខី (រៀបចំ/ត្រួតពិនិត្យ/អនុម័ត) និងកាលបរិច្ឆេទនេះ ទៅកាន់រាល់ JD ទាំងអស់ (Apply to all 15 JDs)
                </label>
              </div>
            </div>

            <div
              style={{
                padding: '12px 20px',
                borderTop: '1px solid #e2e8f0',
                display: 'flex',
                justifyContent: 'flex-end',
                gap: '10px',
                background: '#f8fafc',
              }}
            >
              <button
                onClick={() => setEditingHeaderJd(null)}
                style={{
                  padding: '7px 14px',
                  background: '#f1f5f9',
                  color: '#475569',
                  border: '1px solid #cbd5e1',
                  borderRadius: '6px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                បោះបង់
              </button>
              <button
                onClick={handleSaveQuickHeader}
                style={{
                  padding: '7px 18px',
                  background: '#047857',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '6px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                💾 {applyHeaderToAll ? 'រក្សាទុក & អនុវត្តលើ JD ទាំងអស់' : 'រក្សាទុកការកែប្រែ'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* FULL EDIT MODAL */}
      {editingJd && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.75)',
            zIndex: 9999,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            padding: '20px',
            overflowY: 'auto',
          }}
        >
          <div
            style={{
              background: '#ffffff',
              borderRadius: '16px',
              width: '95%',
              maxWidth: '860px',
              maxHeight: '92vh',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                padding: '14px 20px',
                borderBottom: '1px solid #e2e8f0',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                background: '#f8fafc',
              }}
            >
              <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800 }}>
                កែប្រែសេចក្តីពិពណ៌នាមុខតំណែង: {editingJd.code} - {editingJd.jobTitleKh}
              </h3>
              <button
                onClick={() => setEditingJd(null)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '1.1rem',
                  cursor: 'pointer',
                  color: '#64748b',
                }}
              >
                ✕
              </button>
            </div>

            <div style={{ padding: '20px', overflowY: 'auto', flex: 1 }}>
              {/* SECTION 1: FACTORY NAME & DOCUMENT METADATA */}
              <div
                style={{
                  background: '#f8fafc',
                  border: '1.5px solid #cbd5e1',
                  borderRadius: '10px',
                  padding: '14px',
                  marginBottom: '18px',
                }}
              >
                <div style={{ fontWeight: 800, fontSize: '0.85rem', color: '#1e40af', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  📋 ឈ្មោះក្រុមហ៊ុន និងក្បាលឯកសារផ្លូវការ (Company & Header Details)
                </div>

                <div style={{ marginBottom: '10px' }}>
                  <label style={{ fontSize: '0.74rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '3px' }}>
                    ឈ្មោះក្រុមហ៊ុន / រោងចក្រ (Company / Factory Name):
                  </label>
                  <input
                    type="text"
                    value={editingJd.companyName}
                    onChange={(e) => setEditingJd({ ...editingJd, companyName: e.target.value })}
                    style={{ width: '100%', padding: '6px 8px', border: '1px solid #cbd5e1', borderRadius: '5px', fontSize: '0.85rem', fontWeight: 600 }}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', marginBottom: '10px' }}>
                  <div>
                    <label style={{ fontSize: '0.74rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '3px' }}>
                      លេខកូដឯកសារ (Doc No):
                    </label>
                    <input
                      type="text"
                      value={editingJd.code}
                      onChange={(e) => setEditingJd({ ...editingJd, code: e.target.value })}
                      style={{ width: '100%', padding: '6px 8px', border: '1px solid #cbd5e1', borderRadius: '5px', fontSize: '0.82rem' }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.74rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '3px' }}>
                      បោះពុម្ពលើកទី (Edition):
                    </label>
                    <input
                      type="text"
                      value={editingJd.edition}
                      onChange={(e) => setEditingJd({ ...editingJd, edition: e.target.value })}
                      style={{ width: '100%', padding: '6px 8px', border: '1px solid #cbd5e1', borderRadius: '5px', fontSize: '0.82rem' }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.74rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '3px' }}>
                      ចំនួនទំព័រ (Page Info):
                    </label>
                    <input
                      type="text"
                      value={editingJd.pageInfo}
                      onChange={(e) => setEditingJd({ ...editingJd, pageInfo: e.target.value })}
                      style={{ width: '100%', padding: '6px 8px', border: '1px solid #cbd5e1', borderRadius: '5px', fontSize: '0.82rem' }}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
                  <div>
                    <label style={{ fontSize: '0.74rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '3px' }}>
                      កាលបរិច្ឆេទចេញដំបូង (Issued Date):
                    </label>
                    <input
                      type="text"
                      value={editingJd.initialIssuedDate || '10-11-2023'}
                      onChange={(e) => setEditingJd({ ...editingJd, initialIssuedDate: e.target.value })}
                      style={{ width: '100%', padding: '6px 8px', border: '1px solid #cbd5e1', borderRadius: '5px', fontSize: '0.82rem' }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.74rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '3px' }}>
                      កាលបរិច្ឆេទចូលជាធរមាន (Effective Date):
                    </label>
                    <input
                      type="text"
                      value={editingJd.effectiveDate}
                      onChange={(e) => setEditingJd({ ...editingJd, effectiveDate: e.target.value })}
                      style={{ width: '100%', padding: '6px 8px', border: '1px solid #cbd5e1', borderRadius: '5px', fontSize: '0.82rem' }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.74rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '3px' }}>
                      កាលបរិច្ឆេទកែប្រែ/ពិនិត្យ (Amend Date):
                    </label>
                    <input
                      type="text"
                      value={editingJd.amendDate}
                      onChange={(e) => setEditingJd({ ...editingJd, amendDate: e.target.value })}
                      style={{ width: '100%', padding: '6px 8px', border: '1px solid #cbd5e1', borderRadius: '5px', fontSize: '0.82rem' }}
                    />
                  </div>
                </div>
              </div>

              {/* SECTION 2: SIGNATORIES */}
              <div
                style={{
                  background: '#f8fafc',
                  border: '1.5px solid #cbd5e1',
                  borderRadius: '10px',
                  padding: '14px',
                  marginBottom: '18px',
                }}
              >
                <div style={{ fontWeight: 800, fontSize: '0.85rem', color: '#047857', marginBottom: '10px' }}>
                  ✍️ ឈ្មោះហត្ថលេខី និងតួនាទី (Signatory Names & Roles)
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '8px' }}>
                  <div>
                    <label style={{ fontSize: '0.74rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '3px' }}>
                      រៀបចំដោយ (Prepared By):
                    </label>
                    <input
                      type="text"
                      value={editingJd.preparedBy}
                      onChange={(e) => setEditingJd({ ...editingJd, preparedBy: e.target.value })}
                      style={{ width: '100%', padding: '6px 8px', border: '1px solid #cbd5e1', borderRadius: '5px', fontSize: '0.82rem' }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.74rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '3px' }}>
                      តួនាទីអ្នករៀបចំ (Prepared Role):
                    </label>
                    <input
                      type="text"
                      value={editingJd.preparedRole}
                      onChange={(e) => setEditingJd({ ...editingJd, preparedRole: e.target.value })}
                      style={{ width: '100%', padding: '6px 8px', border: '1px solid #cbd5e1', borderRadius: '5px', fontSize: '0.82rem' }}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '8px' }}>
                  <div>
                    <label style={{ fontSize: '0.74rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '3px' }}>
                      ត្រួតពិនិត្យដោយ (Verified By):
                    </label>
                    <input
                      type="text"
                      value={editingJd.verifiedBy}
                      onChange={(e) => setEditingJd({ ...editingJd, verifiedBy: e.target.value })}
                      style={{ width: '100%', padding: '6px 8px', border: '1px solid #cbd5e1', borderRadius: '5px', fontSize: '0.82rem' }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.74rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '3px' }}>
                      តួនាទីអ្នកត្រួតពិនិត្យ (Verified Role):
                    </label>
                    <input
                      type="text"
                      value={editingJd.verifiedRole}
                      onChange={(e) => setEditingJd({ ...editingJd, verifiedRole: e.target.value })}
                      style={{ width: '100%', padding: '6px 8px', border: '1px solid #cbd5e1', borderRadius: '5px', fontSize: '0.82rem' }}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div>
                    <label style={{ fontSize: '0.74rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '3px' }}>
                      អនុម័តដោយ (Approved By):
                    </label>
                    <input
                      type="text"
                      value={editingJd.approvedBy}
                      onChange={(e) => setEditingJd({ ...editingJd, approvedBy: e.target.value })}
                      style={{ width: '100%', padding: '6px 8px', border: '1px solid #cbd5e1', borderRadius: '5px', fontSize: '0.82rem' }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.74rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '3px' }}>
                      តួនាទីអ្នកអនុម័ត (Approved Role):
                    </label>
                    <input
                      type="text"
                      value={editingJd.approvedRole}
                      onChange={(e) => setEditingJd({ ...editingJd, approvedRole: e.target.value })}
                      style={{ width: '100%', padding: '6px 8px', border: '1px solid #cbd5e1', borderRadius: '5px', fontSize: '0.82rem' }}
                    />
                  </div>
                </div>
              </div>

              {/* SECTION 3: TITLES & HIERARCHY */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
                <div>
                  <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '4px' }}>
                    ឈ្មោះមុខតំណែង (ខ្មែរ)
                  </label>
                  <input
                    type="text"
                    value={editingJd.jobTitleKh}
                    onChange={(e) => setEditingJd({ ...editingJd, jobTitleKh: e.target.value })}
                    style={{ width: '100%', padding: '8px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.85rem' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '4px' }}>
                    Job Title (English)
                  </label>
                  <input
                    type="text"
                    value={editingJd.jobTitleEn}
                    onChange={(e) => setEditingJd({ ...editingJd, jobTitleEn: e.target.value })}
                    style={{ width: '100%', padding: '8px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.85rem' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px', marginBottom: '14px' }}>
                <div>
                  <label style={{ fontSize: '0.76rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '3px' }}>
                    កម្រិតតួនាទី (Grade Level)
                  </label>
                  <input
                    type="text"
                    value={editingJd.gradeLevel}
                    onChange={(e) => setEditingJd({ ...editingJd, gradeLevel: e.target.value })}
                    style={{ width: '100%', padding: '8px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.82rem' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.76rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '3px' }}>
                    រាយការណ៍ជូន (Reports To)
                  </label>
                  <input
                    type="text"
                    value={editingJd.reportsToKh}
                    onChange={(e) => setEditingJd({ ...editingJd, reportsToKh: e.target.value })}
                    style={{ width: '100%', padding: '8px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.82rem' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.76rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '3px' }}>
                    គ្រប់គ្រងលើ (Supervises)
                  </label>
                  <input
                    type="text"
                    value={editingJd.supervisesKh}
                    onChange={(e) => setEditingJd({ ...editingJd, supervisesKh: e.target.value })}
                    style={{ width: '100%', padding: '8px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.82rem' }}
                  />
                </div>
              </div>

              <div style={{ marginBottom: '14px' }}>
                <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '4px' }}>
                  គោលបំណងមុខតំណែង (Job Summary Khmer)
                </label>
                <textarea
                  rows={3}
                  value={editingJd.jobSummaryKh}
                  onChange={(e) => setEditingJd({ ...editingJd, jobSummaryKh: e.target.value })}
                  style={{ width: '100%', padding: '8px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.82rem' }}
                />
              </div>

              <div style={{ marginBottom: '14px' }}>
                <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '4px' }}>
                  Job Summary (English)
                </label>
                <textarea
                  rows={3}
                  value={editingJd.jobSummaryEn}
                  onChange={(e) => setEditingJd({ ...editingJd, jobSummaryEn: e.target.value })}
                  style={{ width: '100%', padding: '8px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.82rem' }}
                />
              </div>

              <div style={{ marginBottom: '14px' }}>
                <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '4px' }}>
                  ភារកិច្ច និងការទទួលខុសត្រូវ (Duties Khmer - រៀបចំជាចំណុចលេខ ១. ២. ៣.)
                </label>
                <textarea
                  rows={6}
                  value={editingJd.dutiesKh}
                  onChange={(e) => setEditingJd({ ...editingJd, dutiesKh: e.target.value })}
                  style={{ width: '100%', padding: '8px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.82rem', fontFamily: 'monospace' }}
                />
              </div>

              <div style={{ marginBottom: '14px' }}>
                <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '4px' }}>
                  Duties & Responsibilities (English - Format 1. 2. 3.)
                </label>
                <textarea
                  rows={6}
                  value={editingJd.dutiesEn}
                  onChange={(e) => setEditingJd({ ...editingJd, dutiesEn: e.target.value })}
                  style={{ width: '100%', padding: '8px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.82rem', fontFamily: 'monospace' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
                <div>
                  <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '4px' }}>
                    សិទ្ធិអំណាច និងការសម្រេចចិត្ត (Authorities)
                  </label>
                  <textarea
                    rows={3}
                    value={editingJd.authoritiesKh}
                    onChange={(e) => setEditingJd({ ...editingJd, authoritiesKh: e.target.value })}
                    style={{ width: '100%', padding: '8px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.82rem' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '4px' }}>
                    លក្ខខណ្ឌតម្រូវការងារ (Qualifications)
                  </label>
                  <textarea
                    rows={3}
                    value={editingJd.qualificationsKh}
                    onChange={(e) => setEditingJd({ ...editingJd, qualificationsKh: e.target.value })}
                    style={{ width: '100%', padding: '8px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.82rem' }}
                  />
                </div>
              </div>

              <div style={{ marginBottom: '14px' }}>
                <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '4px' }}>
                  សូចនាករវាស់វែងសមិទ្ធកម្ម (KPIs)
                </label>
                <input
                  type="text"
                  value={editingJd.kpisKh}
                  onChange={(e) => setEditingJd({ ...editingJd, kpisKh: e.target.value })}
                  style={{ width: '100%', padding: '8px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.82rem' }}
                />
              </div>
            </div>

            <div
              style={{
                padding: '12px 20px',
                borderTop: '1px solid #e2e8f0',
                display: 'flex',
                justifyContent: 'flex-end',
                gap: '10px',
                background: '#f8fafc',
              }}
            >
              <button
                onClick={() => setEditingJd(null)}
                style={{
                  padding: '7px 14px',
                  background: '#f1f5f9',
                  color: '#475569',
                  border: '1px solid #cbd5e1',
                  borderRadius: '6px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                បោះបង់
              </button>
              <button
                onClick={handleSaveEdit}
                style={{
                  padding: '7px 18px',
                  background: '#16a34a',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '6px',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                💾 រក្សាទុកការកែប្រែទាំងអស់
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
