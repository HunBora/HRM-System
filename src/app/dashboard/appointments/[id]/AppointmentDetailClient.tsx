'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { generateAppointmentDocxBlob } from '@/lib/appointmentDocx';
import { EmployeeCombobox } from '../AppointmentClient';

export default function AppointmentDetailClient({
  appointment: initialAppointment,
  settings,
  employees = [],
  userRole
}: {
  appointment: any;
  settings?: any;
  employees?: any[];
  userRole?: string;
}) {
  const [appointment, setAppointment] = useState(initialAppointment);
  const [langMode, setLangMode] = useState<'trilingual' | 'khmer' | 'english' | 'chinese'>('trilingual');
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [isExportingDocx, setIsExportingDocx] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveNotice, setSaveNotice] = useState<string | null>(null);

  // Editable fields
  const [employeeId, setEmployeeId] = useState(initialAppointment.employeeId);
  const [employeeNameKh, setEmployeeNameKh] = useState(
    `${initialAppointment.employee?.lastNameKh || ''} ${initialAppointment.employee?.firstNameKh || ''}`.trim() || initialAppointment.employee?.firstNameEn || ''
  );
  const [employeeNameEn, setEmployeeNameEn] = useState(
    `${initialAppointment.employee?.firstNameEn || ''} ${initialAppointment.employee?.lastNameEn || ''}`.trim()
  );
  const [employeeGender, setEmployeeGender] = useState(
    initialAppointment.employee?.gender === 'FEMALE' || initialAppointment.employee?.gender === 'ស្រី' ? 'ស្រី' : 'ប្រុស'
  );
  const [employeeDob, setEmployeeDob] = useState(
    initialAppointment.employee?.dob ? new Date(initialAppointment.employee.dob).toLocaleDateString('en-GB') : ''
  );
  const [employeeNationalId, setEmployeeNationalId] = useState(
    initialAppointment.employee?.nationalId || initialAppointment.employee?.employeeId || ''
  );
  const [oldPosition, setOldPosition] = useState(initialAppointment.oldPosition || initialAppointment.employee?.position || '');
  const [oldDepartment, setOldDepartment] = useState(initialAppointment.oldDepartment || initialAppointment.employee?.department || '');
  const [newPosition, setNewPosition] = useState(initialAppointment.newPosition || '');
  const [newDepartment, setNewDepartment] = useState(initialAppointment.newDepartment || '');
  const [reportsTo, setReportsTo] = useState(initialAppointment.reportsTo || 'នាយកចាត់ការទូទៅ (General Manager)');
  const [effectiveDateStr, setEffectiveDateStr] = useState(
    new Date(initialAppointment.effectiveDate).toISOString().split('T')[0]
  );
  const [probationMonths, setProbationMonths] = useState(String(initialAppointment.probationMonths || 0));
  const [newSalary, setNewSalary] = useState(initialAppointment.newSalary ? String(initialAppointment.newSalary) : '');
  const [positionAllowance, setPositionAllowance] = useState(
    initialAppointment.positionAllowance ? String(initialAppointment.positionAllowance) : ''
  );
  const [benefits, setBenefits] = useState(initialAppointment.benefits || '');

  let initialDuties: string[] = [];
  try {
    const parsed = JSON.parse(initialAppointment.dutiesJson);
    initialDuties = Array.isArray(parsed) && parsed.length > 0 ? parsed : [];
  } catch {
    initialDuties = [];
  }

  if (initialDuties.length === 0) {
    initialDuties = [
      'ដឹកនាំ គ្រប់គ្រង និងត្រួតពិនិត្យការងារប្រតិបត្តិការប្រចាំថ្ងៃក្នុងផ្នែកឱ្យទទួលបានទិន្នផលខ្ពស់',
      'រៀបចំផែនការផលិតកម្ម បែងចែកភារកិច្ច និងតាមដានវឌ្ឍនភាពការងាររបស់បុគ្គលិកក្រោមឱវាទ',
      'ធានានូវគុណភាព សុវត្ថិភាពការងារ និងការគោរពវិន័យតាមស្តង់ដាររបស់រោងចក្រ',
      'សម្របសម្រួលដោះស្រាយបញ្ហាប្រឈមបច្ចេកទេស និងរាយការណ៍ជូនថ្នាក់ដឹកនាំជាប្រចាំ'
    ];
  }

  const [duties, setDuties] = useState<string[]>(initialDuties);
  const [preambleLaw, setPreambleLaw] = useState(
    initialAppointment.preambleLaw || 'យោងតាមក្រមច្បាប់ស្តីពីការងារ នៃព្រះរាជាណាចក្រកម្ពុជា'
  );
  const [preambleInternalRule, setPreambleInternalRule] = useState(
    initialAppointment.preambleInternalRule || 'យោងតាមលក្ខន្តិកៈ និងបទបញ្ជាផ្ទៃក្នុងរបស់រោងចក្រ/ក្រុមហ៊ុន'
  );
  const [preamblePerformance, setPreamblePerformance] = useState(
    initialAppointment.preamblePerformance || 'យោងតាមសមត្ថភាព ចំណេះដឹង បទពិសោធន៍ ស្នាដៃការងារ និងភាពស្មោះត្រង់របស់បុគ្គលិក'
  );
  const [preambleNeeds, setPreambleNeeds] = useState(
    initialAppointment.preambleNeeds || 'យោងតាមតម្រូវការការងារជាក់ស្តែង និងការសម្រេចរបស់គណៈគ្រប់គ្រងរោងចក្រ/ក្រុមហ៊ុន'
  );

  const [signLocation, setSignLocation] = useState(initialAppointment.signLocation || 'រាជធានីភ្នំពេញ');
  const [signatoryTitle, setSignatoryTitle] = useState(
    initialAppointment.signatoryTitle || 'អគ្គនាយកក្រុមហ៊ុន (General Manager / CEO)'
  );
  const [signatoryName, setSignatoryName] = useState(initialAppointment.signatoryName || '');
  const [ccList, setCcList] = useState(
    initialAppointment.ccList ||
      '- ក្រុមប្រឹក្សាភិបាល (Board of Directors)\n- នាយកដ្ឋានធនធានមនុស្ស និងរដ្ឋបាល (HR & Admin)\n- នាយកដ្ឋានគណនេយ្យ និងហិរញ្ញវត្ថុ (Accounting & Finance)\n- សាមីខ្លួន "ដើម្បីអនុវត្ត" (Appointee)\n- ឯកសារ - កាលប្បវត្តិ (Company Archives)'
  );

  const createdDate = new Date(appointment.createdAt);
  const createdDay = createdDate.getDate();
  const createdMonth = createdDate.getMonth() + 1;
  const createdYear = createdDate.getFullYear();

  const effectiveDateFormatted = new Date(effectiveDateStr).toLocaleDateString('en-GB');
  const companyName = settings?.companyName || 'G.S TEXTILE GARMENT (CAMBODIA) CO., LTD.';
  const companyLogo = settings?.logoUrl;

  // Add / remove duties
  const handleAddDuty = () => {
    setDuties([...duties, `ភារកិច្ច និងការទទួលខុសត្រូវទី ${duties.length + 1}`]);
  };

  const handleUpdateDuty = (index: number, val: string) => {
    const next = [...duties];
    next[index] = val;
    setDuties(next);
  };

  const handleRemoveDuty = (index: number) => {
    if (duties.length <= 1) return;
    const next = [...duties];
    next.splice(index, 1);
    setDuties(next);
  };

  // Save changes
  const handleSaveChanges = async () => {
    setIsSaving(true);
    try {
      const payload = {
        employeeId,
        oldPosition,
        oldDepartment,
        newPosition,
        newDepartment,
        reportsTo,
        effectiveDate: effectiveDateStr,
        probationMonths: Number(probationMonths) || 0,
        newSalary: newSalary ? Number(newSalary) : null,
        positionAllowance: positionAllowance ? Number(positionAllowance) : null,
        benefits,
        duties,
        preambleLaw,
        preambleInternalRule,
        preamblePerformance,
        preambleNeeds,
        signLocation,
        signatoryTitle,
        signatoryName,
        ccList
      };

      const res = await fetch(`/api/appointments/${appointment.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) throw new Error('បរាជ័យក្នុងការរក្សាទុក');

      const data = await res.json();
      setAppointment(data.appointment);
      setIsEditMode(false);
      setSaveNotice('✓ បានរក្សាទុកការកែប្រែដោយជោគជ័យ!');
      setTimeout(() => setSaveNotice(null), 4000);
    } catch (err: any) {
      alert(err.message || 'មានបញ្ហាក្នុងការរក្សាទុក');
    } finally {
      setIsSaving(false);
    }
  };

  // Export PDF
  const handleExportPdf = async () => {
    setIsExportingPdf(true);
    try {
      const html2canvas = (await import('html2canvas')).default;
      const { jsPDF } = await import('jspdf');

      const printEl = document.getElementById('appointment-official-doc');
      if (!printEl) throw new Error('Document element not found');

      const canvas = await html2canvas(printEl, {
        scale: 2.8,
        useCORS: true,
        backgroundColor: '#ffffff'
      });

      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgWidth = 210;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, 0, imgWidth, imgHeight);
      pdf.save(`Appointment_${appointment.refNo}_Trilingual.pdf`);
    } catch (err) {
      console.error(err);
      alert('មានបញ្ហាក្នុងការបង្កើត PDF');
    } finally {
      setIsExportingPdf(false);
    }
  };

  // Export Word (.docx)
  const handleExportWord = async () => {
    setIsExportingDocx(true);
    try {
      const docxData = {
        refNo: appointment.refNo,
        companyName,
        employeeNameKh,
        employeeNameEn,
        employeeId: appointment.employee?.employeeId || '',
        employeeGender,
        employeeDob,
        employeeNationalId,
        oldPosition,
        oldDepartment,
        newPosition,
        newDepartment,
        reportsTo,
        effectiveDateStr: effectiveDateFormatted,
        probationMonths: Number(probationMonths) || 0,
        newSalary: newSalary ? Number(newSalary) : null,
        positionAllowance: positionAllowance ? Number(positionAllowance) : null,
        benefits,
        duties,
        preambleLaw,
        preambleInternalRule,
        preamblePerformance,
        preambleNeeds,
        signLocation,
        signatoryTitle,
        signatoryName,
        createdDay,
        createdMonth,
        createdYear,
        langMode
      };

      const blob = await generateAppointmentDocxBlob(docxData);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Appointment_${appointment.refNo}_Trilingual.docx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
      alert('មានបញ្ហាក្នុងការទាញយក Word (.docx)');
    } finally {
      setIsExportingDocx(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxWidth: '1240px', margin: '0 auto', padding: '16px' }}>
      {/* Print Specific CSS */}
      <style>{`
        @media print {
          body * {
            visibility: hidden !important;
          }
          .no-print, .no-print * {
            display: none !important;
          }
          #appointment-official-doc, #appointment-official-doc * {
            visibility: visible !important;
          }
          #appointment-official-doc {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            margin: 0 !important;
            padding: 12mm 16mm !important;
            box-shadow: none !important;
            border: none !important;
          }
          @page {
            size: A4 portrait;
            margin: 6mm;
          }
        }
      `}</style>

      {/* Top Header Actions */}
      <div
        className="no-print"
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px',
          background: 'var(--card-bg, #ffffff)',
          padding: '14px 20px',
          borderRadius: '12px',
          border: '1px solid var(--border-color, #e2e8f0)',
          boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Link
            href="/dashboard/appointments"
            style={{
              padding: '7px 12px',
              backgroundColor: '#f1f5f9',
              borderRadius: '6px',
              color: '#475569',
              textDecoration: 'none',
              fontSize: '12px',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}
          >
            ← ត្រឡប់ក្រោយ
          </Link>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h1 style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0, color: '#1e293b' }}>
                លិខិតតែងតាំង៖ {appointment.refNo}
              </h1>
              <span style={{ backgroundColor: '#eff6ff', color: '#2563eb', padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 700 }}>
                {employeeNameKh} ({appointment.employee?.employeeId})
              </span>
            </div>
          </div>
        </div>

        {/* Action Buttons Toolbar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          {/* Language Toggle */}
          <div style={{ display: 'flex', backgroundColor: '#f1f5f9', padding: '3px', borderRadius: '8px', gap: '2px' }}>
            <button
              type="button"
              onClick={() => setLangMode('trilingual')}
              style={{
                padding: '5px 9px',
                border: 'none',
                borderRadius: '6px',
                backgroundColor: langMode === 'trilingual' ? '#2563eb' : 'transparent',
                color: langMode === 'trilingual' ? '#ffffff' : '#475569',
                fontSize: '11.5px',
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              🌐 ៣ ភាសា
            </button>
            <button
              type="button"
              onClick={() => setLangMode('khmer')}
              style={{
                padding: '5px 9px',
                border: 'none',
                borderRadius: '6px',
                backgroundColor: langMode === 'khmer' ? '#2563eb' : 'transparent',
                color: langMode === 'khmer' ? '#ffffff' : '#475569',
                fontSize: '11.5px',
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              🇰🇭 ខ្មែរ
            </button>
            <button
              type="button"
              onClick={() => setLangMode('english')}
              style={{
                padding: '5px 9px',
                border: 'none',
                borderRadius: '6px',
                backgroundColor: langMode === 'english' ? '#2563eb' : 'transparent',
                color: langMode === 'english' ? '#ffffff' : '#475569',
                fontSize: '11.5px',
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              🇬🇧 English
            </button>
            <button
              type="button"
              onClick={() => setLangMode('chinese')}
              style={{
                padding: '5px 9px',
                border: 'none',
                borderRadius: '6px',
                backgroundColor: langMode === 'chinese' ? '#2563eb' : 'transparent',
                color: langMode === 'chinese' ? '#ffffff' : '#475569',
                fontSize: '11.5px',
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              🇨🇳 中文
            </button>
          </div>

          {/* Edit Mode Toggle */}
          <button
            type="button"
            onClick={() => setIsEditMode(!isEditMode)}
            style={{
              padding: '8px 14px',
              backgroundColor: isEditMode ? '#f59e0b' : '#f8fafc',
              color: isEditMode ? '#ffffff' : '#1e293b',
              border: isEditMode ? 'none' : '1px solid #cbd5e1',
              borderRadius: '7px',
              fontWeight: 700,
              fontSize: '12.5px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <span>{isEditMode ? '👁️ មើលជាទម្រង់ពុម្ព' : '✏️ កែប្រែផ្ទាល់ (Edit Mode)'}</span>
          </button>

          {/* Export Word */}
          <button
            type="button"
            onClick={handleExportWord}
            disabled={isExportingDocx}
            style={{
              padding: '8px 14px',
              backgroundColor: '#0284c7',
              color: '#ffffff',
              border: 'none',
              borderRadius: '7px',
              fontWeight: 700,
              fontSize: '12.5px',
              cursor: isExportingDocx ? 'wait' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '5px'
            }}
          >
            <span>📝</span>
            <span>{isExportingDocx ? 'កំពុងបង្កើត Word...' : 'ទាញយក Word (.docx)'}</span>
          </button>

          {/* Export PDF */}
          <button
            type="button"
            onClick={handleExportPdf}
            disabled={isExportingPdf}
            style={{
              padding: '8px 14px',
              backgroundColor: '#ef4444',
              color: '#ffffff',
              border: 'none',
              borderRadius: '7px',
              fontWeight: 700,
              fontSize: '12.5px',
              cursor: isExportingPdf ? 'wait' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '5px'
            }}
          >
            <span>📄</span>
            <span>{isExportingPdf ? 'កំពុងទាញយក...' : 'ទាញយក PDF'}</span>
          </button>

          {/* Print Button */}
          <button
            type="button"
            onClick={() => window.print()}
            style={{
              padding: '8px 16px',
              backgroundColor: '#4f46e5',
              color: '#ffffff',
              border: 'none',
              borderRadius: '7px',
              fontWeight: 700,
              fontSize: '12.5px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '5px'
            }}
          >
            <span>🖨️</span>
            <span>បោះពុម្ព (Ctrl+P)</span>
          </button>
        </div>
      </div>

      {/* Floating Save Bar in Edit Mode */}
      {isEditMode && (
        <div
          className="no-print"
          style={{
            position: 'sticky',
            top: '12px',
            zIndex: 100,
            backgroundColor: '#0f172a',
            color: '#ffffff',
            padding: '10px 20px',
            borderRadius: '10px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            boxShadow: '0 8px 20px rgba(0,0,0,0.25)',
            border: '1px solid #334155'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px' }}>
            <span>✏️</span>
            <span>
              <strong>របៀបកែប្រែផ្ទាល់ (Live Edit Mode)៖</strong> លោកអ្នកអាចកែប្រែអត្ថបទ មុខតំណែង និងភារកិច្ចផ្ទាល់លើទម្រង់ខាងក្រោម!
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button
              type="button"
              onClick={() => setIsEditMode(false)}
              style={{ padding: '6px 14px', backgroundColor: 'transparent', color: '#94a3b8', border: '1px solid #475569', borderRadius: '6px', cursor: 'pointer', fontSize: '12px' }}
            >
              បោះបង់
            </button>
            <button
              type="button"
              onClick={handleSaveChanges}
              disabled={isSaving}
              style={{
                padding: '6px 18px',
                backgroundColor: '#16a34a',
                color: '#ffffff',
                border: 'none',
                borderRadius: '6px',
                fontWeight: 700,
                fontSize: '12.5px',
                cursor: isSaving ? 'wait' : 'pointer'
              }}
            >
              {isSaving ? 'កំពុងរក្សាទុក...' : '💾 រក្សាទុកការកែប្រែ (Save Changes)'}
            </button>
          </div>
        </div>
      )}

      {saveNotice && (
        <div className="no-print" style={{ backgroundColor: '#dcfce7', color: '#166534', padding: '10px 16px', borderRadius: '8px', border: '1px solid #86efac', fontWeight: 600, fontSize: '13px' }}>
          {saveNotice}
        </div>
      )}

      {/* Auto-fill Helper Bar (in Edit Mode) */}
      {isEditMode && employees && employees.length > 0 && (
        <div
          className="no-print"
          style={{
            backgroundColor: '#f0fdf4',
            border: '1.5px solid #86efac',
            borderRadius: '12px',
            padding: '16px 20px',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.06)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
            <div style={{ fontSize: '13.5px', fontWeight: 800, color: '#166534' }}>
              ⚡ ស្វែងរក & បំពេញបុគ្គលិកដោយស្វ័យប្រវត្ត (Auto-Fill Employee):
            </div>
            <span style={{ fontSize: '11px', color: '#15803d', fontWeight: 600 }}>
              💡 ស្វែងរកតាម ឈ្មោះ, អត្តលេខ (ID), អត្តសញ្ញាណប័ណ្ណ, ផ្នែក, ឬ តួនាទី
            </span>
          </div>

          <EmployeeCombobox
            employees={employees}
            selectedId={employeeId}
            onSelect={(emp) => {
              setEmployeeId(emp.id);
              setEmployeeNameKh(`${emp.lastNameKh || ''} ${emp.firstNameKh || ''}`.trim() || emp.firstNameEn);
              setEmployeeNameEn(`${emp.firstNameEn || ''} ${emp.lastNameEn || ''}`.trim());
              setEmployeeGender(emp.gender === 'FEMALE' || emp.gender === 'ស្រី' ? 'ស្រី' : 'ប្រុស');
              setEmployeeDob(emp.dob ? new Date(emp.dob).toLocaleDateString('en-GB') : '');
              setEmployeeNationalId(emp.nationalId || emp.employeeId || '');
              setOldPosition(emp.position || '');
              setOldDepartment(emp.department || '');
            }}
            placeholder="🔍 វាយបញ្ចូល ឈ្មោះ, អត្តលេខ, អត្តសញ្ញាណប័ណ្ណ, ផ្នែក, តួនាទី..."
          />
        </div>
      )}

      {/* Printable A4 Canvas Container */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          backgroundColor: '#64748b',
          padding: '24px 12px',
          borderRadius: '12px'
        }}
      >
        <div
          id="appointment-official-doc"
          style={{
            backgroundColor: '#ffffff',
            width: '210mm',
            minHeight: '297mm',
            padding: '16mm 20mm',
            boxSizing: 'border-box',
            boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
            color: '#0f172a',
            fontFamily: "'Kantumruy Pro', 'Noto Sans Khmer', 'Noto Sans SC', sans-serif",
            lineHeight: '1.6',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            fontSize: '11.5px'
          }}
        >
          {/* Header Banner - Kingdom Motto & Company Logo */}
          <div>
            <div style={{ textAlign: 'center', marginBottom: '8px' }}>
              <div style={{ fontSize: '14.5px', fontWeight: 800, color: '#0f172a' }}>
                ព្រះរាជាណាចក្រកម្ពុជា
              </div>
              <div style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a', marginTop: '2px' }}>
                ជាតិ សាសនា ព្រះមហាក្សត្រ
              </div>
              {langMode !== 'khmer' && (
                <div style={{ fontSize: '9px', color: '#64748b', marginTop: '1px' }}>
                  KINGDOM OF CAMBODIA • NATION RELIGION KING • 柬埔寨王国 民族 宗教 国王
                </div>
              )}
              {/* Wave line */}
              <div style={{ width: '85px', height: '1.5px', backgroundColor: '#0f172a', margin: '4px auto 0 auto' }} />
            </div>

            {/* Logo and Reference Row */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1.5px solid #0f172a', paddingBottom: '8px', marginBottom: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                {companyLogo ? (
                  <img src={companyLogo} alt="Logo" style={{ height: '44px', objectFit: 'contain' }} />
                ) : (
                  <div style={{ width: '42px', height: '42px', borderRadius: '6px', border: '1.5px solid #0f172a', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '13px' }}>
                    LOGO
                  </div>
                )}
                <div>
                  <div style={{ fontSize: '12.5px', fontWeight: 800, color: '#0f172a' }}>
                    {companyName}
                  </div>
                  <div style={{ fontSize: '9.5px', color: '#475569' }}>
                    រោងចក្រកាត់ដេរ និងវាយនភណ្ឌ • Garment & Textile Manufacturing
                  </div>
                </div>
              </div>

              <div style={{ textAlign: 'right', fontSize: '10px' }}>
                <div style={{ fontWeight: 700, color: '#0f172a' }}>
                  លេខ / Ref No / 编号: <span style={{ textDecoration: 'underline' }}>{appointment.refNo}</span>
                </div>
                <div style={{ color: '#475569', marginTop: '2px' }}>
                  កាលបរិច្ឆេទ / Date: {createdDay}/{createdMonth}/{createdYear}
                </div>
              </div>
            </div>

            {/* Title (Matching User Sample Image) */}
            <div style={{ textAlign: 'center', margin: '12px 0 16px 0' }}>
              <h1 style={{ fontSize: '20px', fontWeight: 800, color: '#0f172a', margin: 0, letterSpacing: '0.5px' }} className="kh-text">
                លិខិតតែងតាំង
              </h1>
              {langMode !== 'khmer' && (
                <div style={{ fontSize: '11px', fontWeight: 700, color: '#475569', marginTop: '2px' }}>
                  LETTER OF APPOINTMENT / PROMOTION • 委任书 / 晋升任命书
                </div>
              )}
            </div>

            {/* PREAMBLE (យោង...) (ដូចគំរូរូបភាព) */}
            <div style={{ marginBottom: '14px', lineHeight: '1.8' }}>
              <div>
                - {isEditMode ? (
                  <input
                    type="text"
                    value={preambleLaw}
                    onChange={(e) => setPreambleLaw(e.target.value)}
                    style={{ width: '90%', padding: '1px 4px', border: '1px solid #3b82f6', borderRadius: '4px', fontSize: '11px' }}
                  />
                ) : (
                  <span>{preambleLaw}</span>
                )}
                {langMode !== 'khmer' && <span style={{ fontSize: '9.5px', color: '#64748b' }}> (Referring to the Labor Law of Cambodia / 依据柬埔寨王国劳工法)</span>}
              </div>

              <div>
                - {isEditMode ? (
                  <input
                    type="text"
                    value={preambleInternalRule}
                    onChange={(e) => setPreambleInternalRule(e.target.value)}
                    style={{ width: '90%', padding: '1px 4px', border: '1px solid #3b82f6', borderRadius: '4px', fontSize: '11px' }}
                  />
                ) : (
                  <span>{preambleInternalRule}</span>
                )}
                {langMode !== 'khmer' && <span style={{ fontSize: '9.5px', color: '#64748b' }}> (Referring to Internal Regulations / 依据本厂内部规章制度)</span>}
              </div>

              <div>
                - {isEditMode ? (
                  <input
                    type="text"
                    value={preamblePerformance}
                    onChange={(e) => setPreamblePerformance(e.target.value)}
                    style={{ width: '90%', padding: '1px 4px', border: '1px solid #3b82f6', borderRadius: '4px', fontSize: '11px' }}
                  />
                ) : (
                  <span>{preamblePerformance}</span>
                )}
                {langMode !== 'khmer' && <span style={{ fontSize: '9.5px', color: '#64748b' }}> (Based on employee competency & dedication / 鉴于该员工的工作表现与能力)</span>}
              </div>

              <div>
                - {isEditMode ? (
                  <input
                    type="text"
                    value={preambleNeeds}
                    onChange={(e) => setPreambleNeeds(e.target.value)}
                    style={{ width: '90%', padding: '1px 4px', border: '1px solid #3b82f6', borderRadius: '4px', fontSize: '11px' }}
                  />
                ) : (
                  <span>{preambleNeeds}</span>
                )}
                {langMode !== 'khmer' && <span style={{ fontSize: '9.5px', color: '#64748b' }}> (Based on operational requirements / 鉴于工厂实际生产管理需要)</span>}
              </div>
            </div>

            {/* DECISION WORD: សម្រេច (DECIDES) */}
            <div style={{ textAlign: 'center', margin: '10px 0 12px 0' }}>
              <div style={{ fontSize: '16px', fontWeight: 800, color: '#0f172a' }}>
                សម្រេច
              </div>
              {langMode !== 'khmer' && (
                <div style={{ fontSize: '10px', fontWeight: 700, color: '#475569' }}>
                  HEREBY DECIDES • 特决定如下
                </div>
              )}
            </div>

            {/* ARTICLE 1: APPOINTMENT */}
            <div style={{ marginBottom: '12px', lineHeight: '1.75', textAlign: 'justify' }}>
              <strong>ប្រការ ១ {langMode !== 'khmer' ? '(Article 1 / 第一条)' : ''}៖</strong> ត្រូវបានតែងតាំងលោក/លោកស្រី/កញ្ញា{' '}
              {isEditMode ? (
                <input
                  type="text"
                  value={employeeNameKh}
                  onChange={(e) => setEmployeeNameKh(e.target.value)}
                  style={{ fontWeight: 800, padding: '1px 4px', border: '1px solid #3b82f6', borderRadius: '4px', fontSize: '11px' }}
                />
              ) : (
                <span style={{ fontWeight: 800, borderBottom: '1px dotted #0f172a', padding: '0 4px', color: '#1e3a8a' }}>
                  {employeeNameKh} {employeeNameEn ? `(${employeeNameEn})` : ''}
                </span>
              )}{' '}
              ភេទ {langMode !== 'khmer' ? '(Sex/性别)' : ''}៖{' '}
              {isEditMode ? (
                <input
                  type="text"
                  value={employeeGender}
                  onChange={(e) => setEmployeeGender(e.target.value)}
                  style={{ width: '45px', padding: '1px 3px', border: '1px solid #3b82f6', borderRadius: '4px', fontSize: '11px' }}
                />
              ) : (
                <span style={{ fontWeight: 700, borderBottom: '1px dotted #0f172a', padding: '0 4px' }}>
                  {employeeGender}
                </span>
              )}{' '}
              {employeeDob && (
                <>
                  កើតថ្ងៃទី៖{' '}
                  <span style={{ fontWeight: 700, borderBottom: '1px dotted #0f172a', padding: '0 4px' }}>
                    {employeeDob}
                  </span>{' '}
                </>
              )}
              {employeeNationalId && (
                <>
                  កាន់អត្តសញ្ញាណប័ណ្ណលេខ៖{' '}
                  <span style={{ fontWeight: 700, borderBottom: '1px dotted #0f172a', padding: '0 4px' }}>
                    {employeeNationalId}
                  </span>{' '}
                </>
              )}
              អត្តលេខ {langMode !== 'khmer' ? '(ID)' : ''}៖{' '}
              <span style={{ fontWeight: 700, borderBottom: '1px dotted #0f172a', padding: '0 4px' }}>
                {appointment.employee?.employeeId}
              </span>{' '}
              {oldPosition && (
                <>
                  ពីមុខតំណែងចាស់ជា{' '}
                  <span style={{ fontWeight: 700, borderBottom: '1px dotted #0f172a', padding: '0 4px' }}>
                    {oldPosition} ({oldDepartment})
                  </span>{' '}
                </>
              )}
              ឱ្យកាន់មុខតំណែងថ្មីជា{' '}
              {isEditMode ? (
                <input
                  type="text"
                  value={newPosition}
                  onChange={(e) => setNewPosition(e.target.value)}
                  style={{ fontWeight: 800, color: '#1e40af', padding: '1px 6px', border: '1px solid #3b82f6', borderRadius: '4px', fontSize: '11px' }}
                />
              ) : (
                <span style={{ fontWeight: 800, borderBottom: '1.5px solid #0f172a', padding: '0 4px', color: '#1e40af' }}>
                  {newPosition}
                </span>
              )}{' '}
              នៃផ្នែក{' '}
              {isEditMode ? (
                <input
                  type="text"
                  value={newDepartment}
                  onChange={(e) => setNewDepartment(e.target.value)}
                  style={{ fontWeight: 800, padding: '1px 6px', border: '1px solid #3b82f6', borderRadius: '4px', fontSize: '11px' }}
                />
              ) : (
                <span style={{ fontWeight: 800, borderBottom: '1px dotted #0f172a', padding: '0 4px' }}>
                  {newDepartment}
                </span>
              )}{' '}
              ចាប់ពីថ្ងៃទី{' '}
              {isEditMode ? (
                <input
                  type="date"
                  value={effectiveDateStr}
                  onChange={(e) => setEffectiveDateStr(e.target.value)}
                  style={{ padding: '1px 4px', border: '1px solid #3b82f6', borderRadius: '4px', fontSize: '10.5px' }}
                />
              ) : (
                <span style={{ fontWeight: 700, borderBottom: '1px dotted #0f172a', padding: '0 4px' }}>
                  {effectiveDateFormatted}
                </span>
              )}{' '}
              នេះតទៅ។
            </div>

            {/* ARTICLE 2: DUTIES & RESPONSIBILITIES */}
            <div style={{ marginBottom: '12px', lineHeight: '1.75' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2px' }}>
                <strong>
                  ប្រការ ២ {langMode !== 'khmer' ? '(Article 2 - Responsibilities / 第二条 职责)' : ''}៖{' '}
                  <span style={{ fontWeight: 400 }}>សាមីខ្លួនមានតួនាទី ភារកិច្ច និងការទទួលខុសត្រូវដូចខាងក្រោម៖</span>
                </strong>
                {isEditMode && (
                  <button
                    type="button"
                    onClick={handleAddDuty}
                    style={{ fontSize: '10px', backgroundColor: '#eff6ff', color: '#2563eb', border: '1px solid #bfdbfe', borderRadius: '4px', cursor: 'pointer', padding: '2px 6px' }}
                  >
                    + បន្ថែមភារកិច្ច
                  </button>
                )}
              </div>

              <div style={{ paddingLeft: '14px', marginTop: '4px', display: 'flex', flexDirection: 'column', gap: '3px' }}>
                {duties.map((duty, idx) => (
                  <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '6px' }}>
                    <span style={{ fontWeight: 700 }}>{idx + 1}.</span>
                    {isEditMode ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flex: 1 }}>
                        <input
                          type="text"
                          value={duty}
                          onChange={(e) => handleUpdateDuty(idx, e.target.value)}
                          style={{ flex: 1, padding: '1px 4px', border: '1px solid #3b82f6', borderRadius: '4px', fontSize: '11px' }}
                        />
                        {duties.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveDuty(idx)}
                            style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '11px' }}
                          >
                            ✕
                          </button>
                        )}
                      </div>
                    ) : (
                      <span>{duty}</span>
                    )}
                  </div>
                ))}
              </div>

              {reportsTo && (
                <div style={{ paddingLeft: '14px', marginTop: '4px', fontWeight: 600 }}>
                  * រាយការណ៍ផ្ទាល់ជូន {langMode !== 'khmer' ? '(Reports To / 直属汇报)៖' : '៖'}{' '}
                  {isEditMode ? (
                    <input
                      type="text"
                      value={reportsTo}
                      onChange={(e) => setReportsTo(e.target.value)}
                      style={{ padding: '1px 4px', border: '1px solid #3b82f6', borderRadius: '4px', fontSize: '11px', width: '240px' }}
                    />
                  ) : (
                    <span style={{ borderBottom: '1px dotted #0f172a', padding: '0 4px', color: '#1e40af' }}>{reportsTo}</span>
                  )}
                </div>
              )}
            </div>

            {/* ARTICLE 3: REMUNERATION & BENEFITS */}
            {(newSalary || positionAllowance || benefits || probationMonths !== '0') && (
              <div style={{ marginBottom: '12px', lineHeight: '1.75', textAlign: 'justify' }}>
                <strong>ប្រការ ៣ {langMode !== 'khmer' ? '(Article 3 - Compensation / 第三条 薪资福利)' : ''}៖</strong>{' '}
                សាមីខ្លួនទទួលបានប្រាក់បៀវត្ស និងអត្ថប្រយោជន៍ស្របតាមគោលការណ៍របស់ក្រុមហ៊ុន៖{' '}
                {newSalary && (
                  <span>
                    ប្រាក់បៀវត្សមូលដ្ឋានថ្មី{' '}
                    <strong style={{ borderBottom: '1px dotted #0f172a', padding: '0 4px' }}>
                      ${Number(newSalary).toLocaleString()}
                    </strong>{' '}
                    /ខែ;{' '}
                  </span>
                )}
                {positionAllowance && (
                  <span>
                    ប្រាក់ឧបត្ថម្ភតួនាទី{' '}
                    <strong style={{ borderBottom: '1px dotted #0f172a', padding: '0 4px' }}>
                      ${Number(positionAllowance).toLocaleString()}
                    </strong>{' '}
                    /ខែ;{' '}
                  </span>
                )}
                {benefits && (
                  <span>
                    អត្ថប្រយោជន៍បន្ថែម៖{' '}
                    <span style={{ borderBottom: '1px dotted #0f172a', padding: '0 4px' }}>{benefits}</span>;{' '}
                  </span>
                )}
                {probationMonths !== '0' && (
                  <span>
                    (រយៈពេលសាកល្បងតួនាទីថ្មីចំនួន{' '}
                    <strong style={{ borderBottom: '1px dotted #0f172a', padding: '0 4px' }}>
                      {probationMonths}
                    </strong>{' '}
                    ខែ)។
                  </span>
                )}
              </div>
            )}

            {/* ARTICLE 4: ENFORCEMENT */}
            <div style={{ marginBottom: '16px', lineHeight: '1.75', textAlign: 'justify' }}>
              <strong>
                {newSalary || positionAllowance || benefits || probationMonths !== '0' ? 'ប្រការ ៤' : 'ប្រការ ៣'}{' '}
                {langMode !== 'khmer' ? '(Article - Enforcement / 执行条款)' : ''}៖
              </strong>{' '}
              នាយកដ្ឋានធនធានមនុស្ស និងរដ្ឋបាល, នាយកដ្ឋានគណនេយ្យ និងហិរញ្ញវត្ថុ, ប្រធានផ្នែកពាក់ព័ន្ធ និងសាមីខ្លួន ត្រូវទទួលបន្ទុកអនុវត្តសេចក្តីសម្រេចនេះឱ្យមានប្រសិទ្ធភាពចាប់ពីថ្ងៃចុះហត្ថលេខានេះតទៅ។
            </div>
          </div>

          {/* Bottom Row: Signatures & CC List (Matching media_1792600818739_453aca3b.png 100%) */}
          <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 1fr', gap: '20px', marginTop: '16px', paddingTop: '10px' }}>
            {/* Left Column: CC / Distribution List */}
            <div>
              <div style={{ fontWeight: 800, color: '#0f172a', marginBottom: '6px', fontSize: '11px' }}>
                ចម្លងជូន {langMode !== 'khmer' ? '(CC / 抄送)៖' : '៖'}
              </div>
              <div style={{ fontSize: '10px', color: '#334155', lineHeight: '1.65' }}>
                <div>- ក្រុមប្រឹក្សាភិបាល {langMode !== 'khmer' ? '(Board of Directors / 董事会)' : ''}</div>
                <div>- នាយកដ្ឋានធនធានមនុស្ស និងរដ្ឋបាល {langMode !== 'khmer' ? '(HR & Admin / 人事行政部)' : ''}</div>
                <div>- នាយកដ្ឋានគណនេយ្យ និងហិរញ្ញវត្ថុ {langMode !== 'khmer' ? '(Accounting / 财务部)' : ''}</div>
                <div>- សាមីខ្លួន &quot;ដើម្បីអនុវត្ត&quot; {langMode !== 'khmer' ? '(Appointee / 本人执行)' : ''}</div>
                <div>- ឯកសារ - កាលប្បវត្តិ {langMode !== 'khmer' ? '(Archives / 档案存档)' : ''}</div>
              </div>
            </div>

            {/* Right Column: Date, Seal & Signer Title */}
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '11px', fontWeight: 600, color: '#0f172a' }}>
                {signLocation}, ថ្ងៃទី {createdDay} ខែ {createdMonth} ឆ្នាំ ២០{String(createdYear).slice(-2)}
              </div>
              {langMode !== 'khmer' && (
                <div style={{ fontSize: '9px', color: '#64748b' }}>
                  Date: {createdDay}/{createdMonth}/{createdYear}
                </div>
              )}

              <div style={{ fontWeight: 800, fontSize: '12px', color: '#1e3a8a', marginTop: '4px' }}>
                {signatoryTitle}
              </div>
              {langMode !== 'khmer' && (
                <div style={{ fontSize: '9.5px', color: '#475569' }}>
                  Managing Director / General Manager / 总经理
                </div>
              )}

              {/* Stamp & Signature Space */}
              <div style={{ height: '70px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', fontSize: '10px', fontStyle: 'italic' }}>
                (ហត្ថលេខា និងត្រាក្រុមហ៊ុន / Signature & Stamp)
              </div>

              <div style={{ fontWeight: 800, fontSize: '12px', color: '#0f172a', borderTop: '1px dotted #94a3b8', paddingTop: '4px', display: 'inline-block', minWidth: '160px' }}>
                {signatoryName || '................................................'}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
