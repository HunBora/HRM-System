'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { generateDelegationDocxBlob } from '@/lib/delegationDocx';
import { EmployeeCombobox } from '../DelegationClient';

export interface DelegateeItem {
  employeeId: string;
  nameKh: string;
  nameEn: string;
  position: string;
  department: string;
  phone: string;
  scopeOfWork: string;
  nationalId?: string;
  gender?: string;
  dob?: string;
  financialLimit?: string;
  specificTasks?: string;
}

export default function DelegationDetailClient({
  delegation: initialDelegation,
  settings,
  employees = [],
  userRole
}: {
  delegation: any;
  settings?: any;
  employees?: any[];
  userRole?: string;
}) {
  const [delegation, setDelegation] = useState(initialDelegation);
  const [delegatorId, setDelegatorId] = useState(initialDelegation.delegatorId);
  const [langMode, setLangMode] = useState<'trilingual' | 'khmer' | 'english' | 'chinese'>('trilingual');
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [isExportingDocx, setIsExportingDocx] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveNotice, setSaveNotice] = useState<string | null>(null);

  // Editable local state
  const [delegatorNameKh, setDelegatorNameKh] = useState(
    `${initialDelegation.delegator?.lastNameKh || ''} ${initialDelegation.delegator?.firstNameKh || ''}`.trim() || initialDelegation.delegator?.firstNameEn || ''
  );
  const [delegatorNameEn, setDelegatorNameEn] = useState(
    `${initialDelegation.delegator?.firstNameEn || ''} ${initialDelegation.delegator?.lastNameEn || ''}`.trim()
  );
  const [delegatorGender, setDelegatorGender] = useState(
    initialDelegation.delegator?.gender === 'FEMALE' || initialDelegation.delegator?.gender === 'ស្រី' ? 'ស្រី' : 'ប្រុស'
  );
  const [delegatorDob, setDelegatorDob] = useState(
    initialDelegation.delegator?.dob ? new Date(initialDelegation.delegator.dob).toLocaleDateString('en-GB') : '____/____/________'
  );
  const [delegatorNationalId, setDelegatorNationalId] = useState(
    initialDelegation.delegator?.nationalId || initialDelegation.delegator?.passportNo || initialDelegation.delegator?.employeeId || ''
  );
  const [delegatorPosition, setDelegatorPosition] = useState(initialDelegation.delegator?.position || '');
  const [delegatorDepartment, setDelegatorDepartment] = useState(initialDelegation.delegator?.department || '');
  const [delegatorPhone, setDelegatorPhone] = useState(initialDelegation.delegator?.phone || '');

  const [reasonType, setReasonType] = useState(initialDelegation.reasonType || 'MISSION');
  const [reasonDetail, setReasonDetail] = useState(initialDelegation.reasonDetail || '');
  const [missionLocation, setMissionLocation] = useState(initialDelegation.missionLocation || '');

  const [startDateStr, setStartDateStr] = useState(new Date(initialDelegation.startDate).toISOString().split('T')[0]);
  const [endDateStr, setEndDateStr] = useState(new Date(initialDelegation.endDate).toISOString().split('T')[0]);

  let initialParsedDelegatees: DelegateeItem[] = [];
  try {
    initialParsedDelegatees = JSON.parse(initialDelegation.delegateesJson);
  } catch {
    initialParsedDelegatees = [];
  }
  const [delegatees, setDelegatees] = useState<DelegateeItem[]>(
    initialParsedDelegatees.length > 0
      ? initialParsedDelegatees
      : [
          {
            employeeId: 'EMP-001',
            nameKh: 'មន្ត្រីទទួលសិទ្ធិ',
            nameEn: 'Acting Officer',
            position: 'ប្រធានផ្នែកស្តីទី',
            department: initialDelegation.delegator?.department || 'ផ្នែកផលិតកម្ម',
            phone: '012 345 678',
            scopeOfWork: 'គ្រប់គ្រងកិច្ចការប្រតិបត្តិការប្រចាំថ្ងៃ និងសម្របសម្រួលការងារទូទៅ'
          }
        ]
  );

  const [canApproveLeave, setCanApproveLeave] = useState(initialDelegation.canApproveLeave ?? true);
  const [canApproveOt, setCanApproveOt] = useState(initialDelegation.canApproveOt ?? true);
  const [canSignDailyReports, setCanSignDailyReports] = useState(initialDelegation.canSignDailyReports ?? true);
  const [canManageOperations, setCanManageOperations] = useState(initialDelegation.canManageOperations ?? true);
  const [canApproveExpense, setCanApproveExpense] = useState(initialDelegation.canApproveExpense ?? false);
  const [maxExpenseAmount, setMaxExpenseAmount] = useState(
    initialDelegation.maxExpenseAmount ? String(initialDelegation.maxExpenseAmount) : ''
  );
  const [restrictions, setRestrictions] = useState(
    initialDelegation.restrictions ||
      'មិនត្រូវបានអនុញ្ញាតឱ្យបញ្ឈប់បុគ្គលិកពីការងារ, ចុះកិច្ចសន្យារយៈពេលវែង ឬធ្វើការសម្រេចចិត្តហិរញ្ញវត្ថុលើសពីកម្រិតកំណត់ដោយគ្មានការយល់ព្រមពីថ្នាក់ដឹកនាំឡើយ។'
  );
  const [handoverItems, setHandoverItems] = useState(
    initialDelegation.handoverItems || 'ត្រាក្រុមហ៊ុន (Company Stamps), កូនសោរការិយាល័យ (Keys), ឯកសារប្រតិបត្តិការ'
  );

  const [approvedByDeptHead, setApprovedByDeptHead] = useState(initialDelegation.approvedByDeptHead || 'ប្រធានផ្នែក');
  const [approvedByManagement, setApprovedByManagement] = useState(
    initialDelegation.approvedByManagement || 'នាយកចាត់ការទូទៅ (General Manager)'
  );

  // Calculate days
  const totalDays = React.useMemo(() => {
    const s = new Date(startDateStr);
    const e = new Date(endDateStr);
    if (isNaN(s.getTime()) || isNaN(e.getTime()) || e < s) return 1;
    const diff = Math.abs(e.getTime() - s.getTime());
    return Math.ceil(diff / (1000 * 60 * 60 * 24)) + 1;
  }, [startDateStr, endDateStr]);

  const createdDate = new Date(delegation.createdAt);
  const createdDay = createdDate.getDate();
  const createdMonth = createdDate.getMonth() + 1;
  const createdYear = createdDate.getFullYear();

  const startDateFormatted = new Date(startDateStr).toLocaleDateString('en-GB');
  const endDateFormatted = new Date(endDateStr).toLocaleDateString('en-GB');

  const startDay = new Date(startDateStr).getDate();
  const startMonth = new Date(startDateStr).getMonth() + 1;
  const startYear = new Date(startDateStr).getFullYear();

  const endDay = new Date(endDateStr).getDate();
  const endMonth = new Date(endDateStr).getMonth() + 1;
  const endYear = new Date(endDateStr).getFullYear();

  const companyName = settings?.companyName || 'G.S TEXTILE GARMENT (CAMBODIA) CO., LTD.';
  const companyLogo = settings?.logoUrl;

  // Add / remove delegatees
  const handleAddDelegatee = () => {
    const num = delegatees.length + 1;
    setDelegatees([
      ...delegatees,
      {
        employeeId: `EMP-00${num}`,
        nameKh: `អ្នកទទួលសិទ្ធិទី ${num}`,
        nameEn: `Acting Officer ${num}`,
        position: 'មន្ត្រីទទួលបន្ទុក',
        department: delegatorDepartment,
        phone: '',
        scopeOfWork: `កិច្ចការទទួលខុសត្រូវទី ${num}`
      }
    ]);
  };

  const handleRemoveDelegatee = (index: number) => {
    if (delegatees.length <= 1) return;
    const next = [...delegatees];
    next.splice(index, 1);
    setDelegatees(next);
  };

  const handleUpdateDelegatee = (index: number, field: keyof DelegateeItem, val: string) => {
    const next = [...delegatees];
    next[index] = { ...next[index], [field]: val };
    setDelegatees(next);
  };

  // Save changes to database
  const handleSaveChanges = async () => {
    setIsSaving(true);
    try {
      const payload = {
        delegatorId,
        reasonType,
        reasonDetail,
        missionLocation,
        startDate: startDateStr,
        endDate: endDateStr,
        delegatees,
        canApproveLeave,
        canApproveOt,
        canSignDailyReports,
        canApproveExpense,
        maxExpenseAmount: canApproveExpense && maxExpenseAmount ? Number(maxExpenseAmount) : null,
        canManageOperations,
        restrictions,
        handoverItems,
        approvedByDeptHead,
        approvedByManagement
      };

      const res = await fetch(`/api/delegations/${delegation.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) throw new Error('បរាជ័យក្នុងការរក្សាទុក');

      const data = await res.json();
      setDelegation(data.delegation);
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

      const printEl = document.getElementById('doa-official-document');
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
      pdf.save(`DOA_${delegation.refNo}_Trilingual.pdf`);
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
        refNo: delegation.refNo,
        companyName,
        delegatorNameKh,
        delegatorNameEn,
        delegatorEmpId: delegatorNationalId,
        delegatorGender,
        delegatorDob,
        delegatorNationalId,
        delegatorPosition,
        delegatorDepartment,
        delegatorPhone,
        reasonType,
        reasonDetail,
        missionLocation,
        startDateStr: startDateFormatted,
        endDateStr: endDateFormatted,
        totalDays,
        delegatees,
        canApproveLeave,
        canApproveOt,
        canSignDailyReports,
        canManageOperations,
        canApproveExpense,
        maxExpenseAmount: canApproveExpense && maxExpenseAmount ? Number(maxExpenseAmount) : null,
        restrictions,
        handoverItems,
        approvedByDeptHead,
        approvedByManagement,
        createdDay,
        createdMonth,
        createdYear,
        langMode
      };

      const blob = await generateDelegationDocxBlob(docxData);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `DOA_${delegation.refNo}_Trilingual.docx`;
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
          #doa-official-document, #doa-official-document * {
            visibility: visible !important;
          }
          #doa-official-document {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            margin: 0 !important;
            padding: 10mm 14mm !important;
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
            href="/dashboard/delegations"
            style={{
              padding: '8px 14px',
              borderRadius: '8px',
              border: '1px solid #cbd5e1',
              backgroundColor: '#f8fafc',
              color: '#334155',
              textDecoration: 'none',
              fontWeight: 600,
              fontSize: '13px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            ← ត្រឡប់ក្រោយ
          </Link>
          <div>
            <h1 style={{ fontSize: '1.2rem', fontWeight: 800, margin: 0, color: 'var(--text-main, #0f172a)' }} className="kh-text">
              🖨️ លិខិតផ្ទេរសិទ្ធិ (DOA No: {delegation.refNo})
            </h1>
            <p style={{ fontSize: '0.8rem', color: '#64748b', margin: '2px 0 0 0' }}>
              ទម្រង់ស្តង់ដារ ៣ ភាសា (ខ្មែរ • English • 中文) • Export PDF • Word (.docx) • Preview & Edit បានតាមចិត្ត
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          {/* Language Switcher */}
          <div style={{ display: 'flex', alignItems: 'center', backgroundColor: '#f1f5f9', padding: '3px', borderRadius: '8px' }}>
            <button
              type="button"
              onClick={() => setLangMode('trilingual')}
              style={{
                padding: '6px 11px',
                borderRadius: '6px',
                border: 'none',
                backgroundColor: langMode === 'trilingual' ? '#ffffff' : 'transparent',
                color: langMode === 'trilingual' ? '#2563eb' : '#64748b',
                fontWeight: langMode === 'trilingual' ? 700 : 500,
                fontSize: '11.5px',
                cursor: 'pointer',
                boxShadow: langMode === 'trilingual' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
              }}
            >
              🌐 ៣ ភាសា
            </button>
            <button
              type="button"
              onClick={() => setLangMode('khmer')}
              style={{
                padding: '6px 11px',
                borderRadius: '6px',
                border: 'none',
                backgroundColor: langMode === 'khmer' ? '#ffffff' : 'transparent',
                color: langMode === 'khmer' ? '#2563eb' : '#64748b',
                fontWeight: langMode === 'khmer' ? 700 : 500,
                fontSize: '11.5px',
                cursor: 'pointer',
                boxShadow: langMode === 'khmer' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
              }}
            >
              🇰🇭 ខ្មែរ
            </button>
            <button
              type="button"
              onClick={() => setLangMode('english')}
              style={{
                padding: '6px 11px',
                borderRadius: '6px',
                border: 'none',
                backgroundColor: langMode === 'english' ? '#ffffff' : 'transparent',
                color: langMode === 'english' ? '#2563eb' : '#64748b',
                fontWeight: langMode === 'english' ? 700 : 500,
                fontSize: '11.5px',
                cursor: 'pointer',
                boxShadow: langMode === 'english' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
              }}
            >
              🇬🇧 English
            </button>
            <button
              type="button"
              onClick={() => setLangMode('chinese')}
              style={{
                padding: '6px 11px',
                borderRadius: '6px',
                border: 'none',
                backgroundColor: langMode === 'chinese' ? '#ffffff' : 'transparent',
                color: langMode === 'chinese' ? '#2563eb' : '#64748b',
                fontWeight: langMode === 'chinese' ? 700 : 500,
                fontSize: '11.5px',
                cursor: 'pointer',
                boxShadow: langMode === 'chinese' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
              }}
            >
              🇨🇳 中文
            </button>
          </div>

          {/* Toggle Live Edit Mode */}
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
              gap: '6px',
              boxShadow: isEditMode ? '0 2px 4px rgba(245, 158, 11, 0.3)' : 'none'
            }}
          >
            <span>{isEditMode ? '👁️ មើលជាទម្រង់ពុម្ព' : '✏️ កែប្រែផ្ទាល់ (Edit Mode)'}</span>
          </button>

          {/* Export Word (.docx) */}
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
              gap: '5px',
              boxShadow: '0 2px 4px rgba(2, 132, 199, 0.25)'
            }}
            title="ទាញយកជាឯកសារ Microsoft Word (.docx)"
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
              gap: '5px',
              boxShadow: '0 2px 4px rgba(239, 68, 68, 0.25)'
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
              gap: '5px',
              boxShadow: '0 2px 4px rgba(79, 70, 229, 0.25)'
            }}
          >
            <span>🖨️</span>
            <span>បោះពុម្ព (Print Ctrl+P)</span>
          </button>
        </div>
      </div>

      {/* Floating Save Bar when Edit Mode is active */}
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
            <span style={{ fontSize: '16px' }}>✏️</span>
            <span>
              <strong>របៀបកែប្រែផ្ទាល់ (Live Edit Mode)៖</strong> លោកអ្នកអាចចុចកែប្រែអក្សរផ្ទាល់នៅលើទម្រង់ខាងក្រោមបានតាមចិត្ត!
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button
              type="button"
              onClick={() => setIsEditMode(false)}
              style={{
                padding: '6px 14px',
                backgroundColor: 'transparent',
                color: '#94a3b8',
                border: '1px solid #475569',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '12px'
              }}
            >
              បោះបង់ (Cancel)
            </button>
            <button
              type="button"
              onClick={handleSaveChanges}
              disabled={isSaving}
              style={{
                padding: '7px 18px',
                backgroundColor: '#10b981',
                color: '#ffffff',
                border: 'none',
                borderRadius: '6px',
                fontWeight: 700,
                cursor: isSaving ? 'wait' : 'pointer',
                fontSize: '12.5px',
                boxShadow: '0 2px 6px rgba(16, 185, 129, 0.4)'
              }}
            >
              {isSaving ? '⏳ កំពុងរក្សាទុក...' : '💾 រក្សាទុកការកែប្រែ (Save Changes)'}
            </button>
          </div>
        </div>
      )}

      {/* Success Save Notice */}
      {saveNotice && (
        <div
          className="no-print"
          style={{
            padding: '12px 18px',
            backgroundColor: '#065f46',
            color: '#ffffff',
            borderRadius: '8px',
            fontWeight: 600,
            fontSize: '13px',
            boxShadow: '0 2px 6px rgba(6, 95, 70, 0.3)'
          }}
        >
          {saveNotice}
        </div>
      )}

      {/* Auto-fill Delegator Helper Bar (in Edit Mode) */}
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
            <div style={{ fontSize: '13.5px', fontWeight: 800, color: '#166534', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>⚡ បំពេញព័ត៌មានអ្នកផ្ទេរសិទ្ធិដោយស្វ័យប្រវត្ត (Auto-Fill Delegator):</span>
            </div>
            <span style={{ fontSize: '11px', color: '#15803d', fontWeight: 600 }}>
              💡 ស្វែងរកតាម ឈ្មោះ, អត្តលេខ (ID), អត្តសញ្ញាណប័ណ្ណ, ផ្នែក, ឬ តួនាទី
            </span>
          </div>

          <EmployeeCombobox
            employees={employees}
            selectedId={delegatorId}
            onSelect={(emp) => {
              setDelegatorId(emp.id);
              setDelegatorNameKh(`${emp.lastNameKh || ''} ${emp.firstNameKh || ''}`.trim() || emp.firstNameEn);
              setDelegatorNameEn(`${emp.firstNameEn || ''} ${emp.lastNameEn || ''}`.trim());
              setDelegatorGender(emp.gender === 'FEMALE' || emp.gender === 'ស្រី' ? 'ស្រី' : 'ប្រុស');
              setDelegatorDob(emp.dob ? new Date(emp.dob).toLocaleDateString('en-GB') : '');
              setDelegatorNationalId(emp.nationalId || emp.employeeId || '');
              setDelegatorPosition(emp.position || '');
              setDelegatorDepartment(emp.department || '');
              setDelegatorPhone(emp.phone || '');
            }}
            placeholder="🔍 ស្វែងរក និងជ្រើសរើសបុគ្គលិក ដើម្បីបំពេញលើលិខិតផ្ទេរសិទ្ធិដោយស្វ័យប្រវត្ត..."
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
          id="doa-official-document"
          style={{
            backgroundColor: '#ffffff',
            width: '210mm',
            minHeight: '297mm',
            padding: '16mm 18mm',
            boxSizing: 'border-box',
            boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
            color: '#0f172a',
            fontFamily: "'Kantumruy Pro', 'Noto Sans Khmer', 'Noto Sans SC', sans-serif",
            lineHeight: '1.55',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            fontSize: '11px'
          }}
        >
          {/* Header Banner - Kingdom Motto & Company Logo */}
          <div>
            <div style={{ textAlign: 'center', marginBottom: '8px' }}>
              <div style={{ fontSize: '14px', fontWeight: 800, color: '#0f172a' }}>
                ព្រះរាជាណាចក្រកម្ពុជា
              </div>
              <div style={{ fontSize: '12.5px', fontWeight: 700, color: '#0f172a', marginTop: '1px' }}>
                ជាតិ សាសនា ព្រះមហាក្សត្រ
              </div>
              {langMode !== 'khmer' && (
                <div style={{ fontSize: '9px', color: '#64748b', marginTop: '1px' }}>
                  KINGDOM OF CAMBODIA • NATION RELIGION KING • 柬埔寨王国 民族 宗教 国王
                </div>
              )}
              {/* Traditional Flourish Wave Line */}
              <div style={{ width: '85px', height: '1.5px', backgroundColor: '#0f172a', margin: '4px auto 0 auto' }} />
            </div>

            {/* Logo and Reference Row */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1.5px solid #0f172a', paddingBottom: '8px', marginBottom: '12px' }}>
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
                  លេខ / Ref No / 编号: <span style={{ textDecoration: 'underline' }}>{delegation.refNo}</span>
                </div>
                <div style={{ color: '#475569', marginTop: '2px' }}>
                  កាលបរិច្ឆេទ / Date: {createdDay}/{createdMonth}/{createdYear}
                </div>
              </div>
            </div>

            {/* Form Title (Matching User Sample Image) */}
            <div style={{ textAlign: 'center', margin: '10px 0 16px 0' }}>
              <h1 style={{ fontSize: '18px', fontWeight: 800, color: '#0f172a', margin: 0, letterSpacing: '0.5px' }} className="kh-text">
                លិខិតផ្ទេរសិទ្ធិ
              </h1>
              {langMode !== 'khmer' && (
                <div style={{ fontSize: '11px', fontWeight: 700, color: '#475569', marginTop: '2px' }}>
                  LETTER OF DELEGATION OF AUTHORITY (DOA) • 授权委托书
                </div>
              )}
            </div>

            {/* BODY PARAGRAPH 1: DELEGATOR INFO */}
            <div style={{ textIndent: '24px', textAlign: 'justify', lineHeight: '1.75', marginBottom: '10px' }}>
              ខ្ញុំបាទ/នាងខ្ញុំ {langMode !== 'khmer' ? '(I / 本人)' : ''}៖{' '}
              {isEditMode ? (
                <input
                  type="text"
                  value={delegatorNameKh}
                  onChange={(e) => setDelegatorNameKh(e.target.value)}
                  style={{ fontWeight: 800, padding: '1px 4px', border: '1px solid #3b82f6', borderRadius: '4px', fontSize: '11px' }}
                />
              ) : (
                <span style={{ fontWeight: 800, borderBottom: '1px dotted #0f172a', padding: '0 4px' }}>
                  {delegatorNameKh} {delegatorNameEn ? `(${delegatorNameEn})` : ''}
                </span>
              )}{' '}
              ភេទ {langMode !== 'khmer' ? '(Sex/性别)' : ''}៖{' '}
              {isEditMode ? (
                <input
                  type="text"
                  value={delegatorGender}
                  onChange={(e) => setDelegatorGender(e.target.value)}
                  style={{ width: '45px', fontWeight: 700, padding: '1px 4px', border: '1px solid #3b82f6', borderRadius: '4px', fontSize: '11px' }}
                />
              ) : (
                <span style={{ fontWeight: 700, borderBottom: '1px dotted #0f172a', padding: '0 4px' }}>
                  {delegatorGender}
                </span>
              )}{' '}
              កើតនៅថ្ងៃទី {langMode !== 'khmer' ? '(DOB)' : ''}៖{' '}
              {isEditMode ? (
                <input
                  type="text"
                  value={delegatorDob}
                  onChange={(e) => setDelegatorDob(e.target.value)}
                  style={{ width: '90px', fontWeight: 700, padding: '1px 4px', border: '1px solid #3b82f6', borderRadius: '4px', fontSize: '11px' }}
                />
              ) : (
                <span style={{ fontWeight: 700, borderBottom: '1px dotted #0f172a', padding: '0 4px' }}>
                  {delegatorDob}
                </span>
              )}{' '}
              កាន់អត្តសញ្ញាណប័ណ្ណ/លិខិតឆ្លងដែនលេខ {langMode !== 'khmer' ? '(ID/Passport No)' : ''}៖{' '}
              {isEditMode ? (
                <input
                  type="text"
                  value={delegatorNationalId}
                  onChange={(e) => setDelegatorNationalId(e.target.value)}
                  style={{ width: '100px', fontWeight: 700, padding: '1px 4px', border: '1px solid #3b82f6', borderRadius: '4px', fontSize: '11px' }}
                />
              ) : (
                <span style={{ fontWeight: 700, borderBottom: '1px dotted #0f172a', padding: '0 4px' }}>
                  {delegatorNationalId}
                </span>
              )}{' '}
              មុខតំណែង/តួនាទី {langMode !== 'khmer' ? '(Position)' : ''}៖{' '}
              {isEditMode ? (
                <input
                  type="text"
                  value={delegatorPosition}
                  onChange={(e) => setDelegatorPosition(e.target.value)}
                  style={{ fontWeight: 800, padding: '1px 4px', border: '1px solid #3b82f6', borderRadius: '4px', fontSize: '11px' }}
                />
              ) : (
                <span style={{ fontWeight: 800, borderBottom: '1px dotted #0f172a', padding: '0 4px' }}>
                  {delegatorPosition}
                </span>
              )}{' '}
              កាន់តួនាទីនៅផ្នែក/រោងចក្រ {langMode !== 'khmer' ? '(Department)' : ''}៖{' '}
              {isEditMode ? (
                <input
                  type="text"
                  value={delegatorDepartment}
                  onChange={(e) => setDelegatorDepartment(e.target.value)}
                  style={{ fontWeight: 800, padding: '1px 4px', border: '1px solid #3b82f6', borderRadius: '4px', fontSize: '11px' }}
                />
              ) : (
                <span style={{ fontWeight: 800, borderBottom: '1px dotted #0f172a', padding: '0 4px' }}>
                  {delegatorDepartment}
                </span>
              )}
              {delegatorPhone ? ` (ទូរស័ព្ទ: ${delegatorPhone})` : ''}។
            </div>

            {/* BODY PARAGRAPH 2: REASON & PERIOD */}
            <div style={{ textIndent: '24px', textAlign: 'justify', lineHeight: '1.75', marginBottom: '12px' }}>
              <strong>មូលហេតុ {langMode !== 'khmer' ? '(Reason/事由)' : ''}៖</strong>{' '}
              {isEditMode ? (
                <input
                  type="text"
                  value={reasonDetail || missionLocation}
                  onChange={(e) => {
                    setReasonDetail(e.target.value);
                    setMissionLocation(e.target.value);
                  }}
                  style={{ fontWeight: 700, padding: '1px 6px', border: '1px solid #3b82f6', borderRadius: '4px', fontSize: '11px', width: '260px' }}
                />
              ) : (
                <span style={{ fontWeight: 700, borderBottom: '1px dotted #0f172a', padding: '0 4px' }}>
                  {reasonType === 'MISSION'
                    ? 'បេសកកម្មការងារក្រៅ (Business Mission / 商务出差)'
                    : reasonType === 'LEAVE'
                    ? 'ឈប់សម្រាកប្រចាំឆ្នាំ (Annual Leave / 年假)'
                    : reasonType === 'SICK'
                    ? 'សម្រាកព្យាបាលជំងឺ (Medical Leave / 病假)'
                    : reasonType === 'TRAINING'
                    ? 'វគ្គបណ្តុះបណ្តាល (Training / 培训学习)'
                    : 'ផ្សេងៗ (Other)'}
                  {missionLocation ? ` នៅ ${missionLocation}` : ''}
                  {reasonDetail ? ` - ${reasonDetail}` : ''}
                </span>
              )}{' '}
              ចំនួន{' '}
              <span style={{ fontWeight: 800, borderBottom: '1px dotted #0f172a', padding: '0 6px', color: '#16a34a' }}>
                {totalDays}
              </span>{' '}
              ថ្ងៃ {langMode !== 'khmer' ? '(Days/天)' : ''} គិតចាប់ពីថ្ងៃទី{' '}
              {isEditMode ? (
                <input
                  type="date"
                  value={startDateStr}
                  onChange={(e) => setStartDateStr(e.target.value)}
                  style={{ padding: '1px 4px', border: '1px solid #3b82f6', borderRadius: '4px', fontSize: '10.5px' }}
                />
              ) : (
                <>
                  <span style={{ fontWeight: 700, borderBottom: '1px dotted #0f172a', padding: '0 4px' }}>{startDay}</span> ខែ{' '}
                  <span style={{ fontWeight: 700, borderBottom: '1px dotted #0f172a', padding: '0 4px' }}>{startMonth}</span> ឆ្នាំ ២០
                  <span style={{ fontWeight: 700, borderBottom: '1px dotted #0f172a', padding: '0 2px' }}>{String(startYear).slice(-2)}</span>
                </>
              )}{' '}
              ដល់ថ្ងៃទី{' '}
              {isEditMode ? (
                <input
                  type="date"
                  value={endDateStr}
                  onChange={(e) => setEndDateStr(e.target.value)}
                  style={{ padding: '1px 4px', border: '1px solid #3b82f6', borderRadius: '4px', fontSize: '10.5px' }}
                />
              ) : (
                <>
                  <span style={{ fontWeight: 700, borderBottom: '1px dotted #0f172a', padding: '0 4px' }}>{endDay}</span> ខែ{' '}
                  <span style={{ fontWeight: 700, borderBottom: '1px dotted #0f172a', padding: '0 4px' }}>{endMonth}</span> ឆ្នាំ ២០
                  <span style={{ fontWeight: 700, borderBottom: '1px dotted #0f172a', padding: '0 2px' }}>{String(endYear).slice(-2)}</span>
                </>
              )}
              ។
            </div>

            {/* BODY PARAGRAPH 3: AGREEMENT TO DELEGATE (1, 2, 3 or more Delegatees) */}
            <div style={{ marginBottom: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                <div style={{ fontWeight: 800, color: '#0f172a', textDecoration: 'underline' }}>
                  យល់ព្រម {langMode !== 'khmer' ? '(Agreed to Delegate / 同意授权)៖' : '៖'}
                </div>
                {isEditMode && (
                  <button
                    type="button"
                    onClick={handleAddDelegatee}
                    style={{
                      padding: '3px 8px',
                      fontSize: '10px',
                      backgroundColor: '#eff6ff',
                      color: '#2563eb',
                      border: '1px solid #bfdbfe',
                      borderRadius: '4px',
                      fontWeight: 700,
                      cursor: 'pointer'
                    }}
                  >
                    + បន្ថែមអ្នកទទួលសិទ្ធិទៀត (+ Add Delegatee)
                  </button>
                )}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {delegatees.map((del, idx) => (
                  <div
                    key={idx}
                    style={{
                      padding: '8px 10px',
                      backgroundColor: '#f8fafc',
                      borderRadius: '6px',
                      border: isEditMode ? '1px dashed #3b82f6' : '1px solid #e2e8f0',
                      lineHeight: '1.7'
                    }}
                  >
                    {isEditMode && employees && employees.length > 0 && (
                      <div className="no-print" style={{ marginBottom: '8px' }}>
                        <EmployeeCombobox
                          employees={employees}
                          selectedId={del.employeeId}
                          onSelect={(emp) => {
                            const next = [...delegatees];
                            next[idx] = {
                              ...next[idx],
                              employeeId: emp.employeeId,
                              nameKh: `${emp.lastNameKh || ''} ${emp.firstNameKh || ''}`.trim() || emp.firstNameEn,
                              nameEn: `${emp.firstNameEn || ''} ${emp.lastNameEn || ''}`.trim(),
                              position: emp.position || '',
                              department: emp.department || '',
                              phone: emp.phone || '',
                              nationalId: emp.nationalId || '',
                              gender: emp.gender === 'FEMALE' || emp.gender === 'ស្រី' ? 'ស្រី' : 'ប្រុស',
                              dob: emp.dob ? new Date(emp.dob).toLocaleDateString('en-GB') : ''
                            };
                            setDelegatees(next);
                          }}
                          placeholder={`🔍 ស្វែងរក & បំពេញអ្នកទទួលសិទ្ធិទី ${idx + 1} អូតូ (ឈ្មោះ, ID, អត្តសញ្ញាណប័ណ្ណ, ផ្នែក, តួនាទី)...`}
                        />
                      </div>
                    )}

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span>
                        ប្រគល់សិទ្ធិជូនឈ្មោះ {langMode !== 'khmer' ? `(Delegatee #${idx + 1} / 被授权人)` : `ទី ${idx + 1}`}៖{' '}
                        {isEditMode ? (
                          <input
                            type="text"
                            value={del.nameKh}
                            onChange={(e) => handleUpdateDelegatee(idx, 'nameKh', e.target.value)}
                            placeholder="ឈ្មោះខ្មែរ..."
                            style={{ fontWeight: 800, padding: '1px 4px', border: '1px solid #3b82f6', borderRadius: '4px', fontSize: '11px', width: '130px' }}
                          />
                        ) : (
                          <span style={{ fontWeight: 800, borderBottom: '1px dotted #0f172a', padding: '0 4px', color: '#1e3a8a' }}>
                            {del.nameKh} {del.nameEn ? `(${del.nameEn})` : ''}
                          </span>
                        )}{' '}
                        ភេទ៖{' '}
                        {isEditMode ? (
                          <input
                            type="text"
                            value={del.gender || 'ប្រុស'}
                            onChange={(e) => handleUpdateDelegatee(idx, 'gender', e.target.value)}
                            style={{ width: '40px', padding: '1px 2px', border: '1px solid #3b82f6', borderRadius: '4px', fontSize: '10.5px' }}
                          />
                        ) : (
                          <span style={{ fontWeight: 700, borderBottom: '1px dotted #0f172a', padding: '0 4px' }}>{del.gender || '____'}</span>
                        )}{' '}
                        មុខតំណែង៖{' '}
                        {isEditMode ? (
                          <input
                            type="text"
                            value={del.position}
                            onChange={(e) => handleUpdateDelegatee(idx, 'position', e.target.value)}
                            style={{ padding: '1px 4px', border: '1px solid #3b82f6', borderRadius: '4px', fontSize: '10.5px', width: '100px' }}
                          />
                        ) : (
                          <span style={{ fontWeight: 800, borderBottom: '1px dotted #0f172a', padding: '0 4px' }}>{del.position}</span>
                        )}{' '}
                        ផ្នែក៖{' '}
                        {isEditMode ? (
                          <input
                            type="text"
                            value={del.department}
                            onChange={(e) => handleUpdateDelegatee(idx, 'department', e.target.value)}
                            style={{ padding: '1px 4px', border: '1px solid #3b82f6', borderRadius: '4px', fontSize: '10.5px', width: '90px' }}
                          />
                        ) : (
                          <span style={{ fontWeight: 800, borderBottom: '1px dotted #0f172a', padding: '0 4px' }}>{del.department}</span>
                        )}
                      </span>

                      {isEditMode && delegatees.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveDelegatee(idx)}
                          style={{
                            background: 'transparent',
                            border: 'none',
                            color: '#ef4444',
                            cursor: 'pointer',
                            fontSize: '11px',
                            fontWeight: 700
                          }}
                        >
                          ✕ លុប
                        </button>
                      )}
                    </div>

                    <div style={{ marginTop: '2px' }}>
                      កាន់តួនាទីជំនួសក្នុងការងារ {langMode !== 'khmer' ? '(Assigned Scope / 代理职责)' : ''}៖{' '}
                      {isEditMode ? (
                        <input
                          type="text"
                          value={del.scopeOfWork}
                          onChange={(e) => handleUpdateDelegatee(idx, 'scopeOfWork', e.target.value)}
                          style={{ width: '75%', padding: '2px 6px', border: '1px solid #3b82f6', borderRadius: '4px', fontSize: '11px', fontWeight: 700, color: '#0369a1' }}
                        />
                      ) : (
                        <span style={{ fontWeight: 800, borderBottom: '1px dotted #0f172a', padding: '0 4px', color: '#0369a1' }}>
                          {del.scopeOfWork}
                        </span>
                      )}
                      {del.phone ? ` (ទូរស័ព្ទ: ${del.phone})` : ''}។
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* BODY SECTION 4: RESPONSIBILITIES (ដូចគំរូរូបភាព) */}
            <div style={{ marginBottom: '10px' }}>
              <div style={{ fontWeight: 800, color: '#0f172a', textDecoration: 'underline', marginBottom: '4px' }}>
                ការទទួលខុសត្រូវ {langMode !== 'khmer' ? '(Responsibilities & Authority / 代理权限与职责)៖' : '៖'}
              </div>
              <div style={{ paddingLeft: '14px', lineHeight: '1.65' }}>
                <div>
                  ១. {canApproveLeave ? '☑' : '☐'} អនុម័តច្បាប់ឈប់សម្រាក និងការងារថែមម៉ោងរបស់បុគ្គលិក {langMode !== 'khmer' ? '(Approve Employee Leave & Overtime / 审批请假及加班)' : ''}
                </div>
                <div>
                  ២. {canSignDailyReports ? '☑' : '☐'} ពិនិត្យ និងចុះហត្ថលេខាលើរបាយការណ៍ប្រចាំថ្ងៃ និងឯកសាររដ្ឋបាល {langMode !== 'khmer' ? '(Sign Daily Reports & Admin Documents / 签署日常报表及行政公文)' : ''}
                </div>
                <div>
                  ៣. {canManageOperations ? '☑' : '☐'} គ្រប់គ្រងកិច្ចការប្រតិបត្តិការប្រចាំថ្ងៃក្នុងរោងចក្រ {langMode !== 'khmer' ? '(Manage Daily Factory Operations / 负责车间与工厂日常运营)' : ''}
                </div>
                {canApproveExpense && (
                  <div>
                    ៤. ☑ អនុម័តចំណាយ ឬទិញសម្ភារៈបន្ទាន់មិនលើសពី ${maxExpenseAmount || 0} {langMode !== 'khmer' ? '(Approve Urgent Expenses / 审批紧急开支)' : ''}
                  </div>
                )}
                <div>
                  {canApproveExpense ? '៥.' : '៤.'} និងរាល់ការសម្រេចផ្សេងៗដែលពាក់ព័ន្ធនឹងការងារខាងលើទាំងអស់ {langMode !== 'khmer' ? '(And all relevant operational decisions / 以及与上述工作相关的所有事务决断)។' : '។'}
                </div>
              </div>

              {/* Restrictions */}
              {isEditMode ? (
                <div style={{ marginTop: '6px' }}>
                  <label style={{ fontSize: '10px', fontWeight: 700, color: '#b45309' }}>ការកំណត់ព្រំដែនសិទ្ធិ (Limitations)៖</label>
                  <textarea
                    rows={2}
                    value={restrictions}
                    onChange={(e) => setRestrictions(e.target.value)}
                    style={{ width: '100%', padding: '4px 8px', fontSize: '10.5px', borderRadius: '4px', border: '1px solid #f59e0b' }}
                  />
                </div>
              ) : (
                restrictions && (
                  <div style={{ marginTop: '4px', fontSize: '10px', color: '#b45309', padding: '4px 8px', backgroundColor: '#fffbeb', borderRadius: '4px', borderLeft: '3px solid #f59e0b' }}>
                    ⚠️ <strong>ការកំណត់ព្រំដែនសិទ្ធិ {langMode !== 'khmer' ? '(Limitations / 权限限制)' : ''}៖</strong> {restrictions}
                  </div>
                )
              )}
            </div>

            {/* BODY SECTION 5: HANDOVER ITEMS (ដូចគំរូរូបភាព) */}
            <div style={{ marginBottom: '10px' }}>
              <div style={{ fontWeight: 800, color: '#0f172a', textDecoration: 'underline', marginBottom: '4px' }}>
                សម្ភារៈប្រគល់ {langMode !== 'khmer' ? '(Handover Items / 交接物品清单)៖' : '៖'}
              </div>
              {isEditMode ? (
                <input
                  type="text"
                  value={handoverItems}
                  onChange={(e) => setHandoverItems(e.target.value)}
                  style={{ width: '100%', padding: '4px 8px', fontSize: '11px', borderRadius: '4px', border: '1px solid #3b82f6' }}
                />
              ) : (
                <div style={{ paddingLeft: '14px', lineHeight: '1.6' }}>
                  {handoverItems ? (
                    handoverItems.split(',').map((item: string, i: number) => (
                      <div key={i}>
                        {i + 1}. {item.trim()}
                      </div>
                    ))
                  ) : (
                    <>
                      <div>១. ត្រាក្រុមហ៊ុន (Company Stamps / 办公印章)</div>
                      <div>២. កូនសោរការិយាល័យ និងទូឯកសារ (Office Keys / 钥匙)</div>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* CLOSING STATEMENT (ដូចគំរូរូបភាព) */}
            <div style={{ fontStyle: 'italic', color: '#334155', marginBottom: '8px' }}>
              លិខិតផ្ទេរសិទ្ធិនេះមានសុពលភាពចាប់ពីថ្ងៃចុះហត្ថលេខានេះតទៅ។
              {langMode !== 'khmer' && (
                <span style={{ fontSize: '9.5px', color: '#64748b', display: 'block' }}>
                  (This delegation of authority is legally effective from the date of signing. / 本授权委托书自签署之日起正式生效。)
                </span>
              )}
            </div>

            {/* DATE OF SIGNING (ដូចគំរូរូបភាព) */}
            <div style={{ textAlign: 'right', fontWeight: 600, marginBottom: '14px' }}>
              ធ្វើនៅ (Done at / 签署于) <span style={{ textDecoration: 'underline' }}>រាជធានីភ្នំពេញ</span>, ថ្ងៃទី{' '}
              <span style={{ textDecoration: 'underline' }}>{createdDay}</span> ខែ{' '}
              <span style={{ textDecoration: 'underline' }}>{createdMonth}</span> ឆ្នាំ ២០
              <span style={{ textDecoration: 'underline' }}>{String(createdYear).slice(-2)}</span>
            </div>
          </div>

          {/* SIGNATURES SECTION (ហត្ថលេខា ៤ ភាគី ដូចគំរូរូបភាព) */}
          <div style={{ borderTop: '1px solid #cbd5e1', paddingTop: '10px' }}>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: `repeat(${Math.max(2, Math.min(delegatees.length, 3)) + 1}, 1fr)`,
                gap: '8px',
                textAlign: 'center'
              }}
            >
              {/* 1. DELEGATEE SIGNATURES (គាំទ្រ ១ ដល់ ៣ នាក់) */}
              {delegatees.map((del, i) => (
                <div key={i}>
                  <div style={{ fontWeight: 800, fontSize: '11px', color: '#0f172a' }}>
                    អ្នកទទួលសិទ្ធិ {delegatees.length > 1 ? `ទី ${i + 1}` : ''}
                  </div>
                  {langMode !== 'khmer' && (
                    <div style={{ fontSize: '8.5px', color: '#64748b' }}>Delegatee #{i + 1} / 被授权人</div>
                  )}
                  <div style={{ fontSize: '9px', color: '#64748b', marginTop: '2px' }}>
                    ហត្ថលេខា ឬស្នាមមេដៃ
                  </div>
                  <div style={{ height: '48px' }} />
                  <div style={{ borderBottom: '1px solid #0f172a', width: '82%', margin: '0 auto' }} />
                  <div style={{ fontSize: '10px', fontWeight: 700, marginTop: '3px' }}>
                    ឈ្មោះ៖ {del.nameKh || del.nameEn}
                  </div>
                </div>
              ))}

              {/* 2. DELEGATOR SIGNATURE */}
              <div>
                <div style={{ fontWeight: 800, fontSize: '11px', color: '#0f172a' }}>
                  អ្នកផ្ទេរសិទ្ធិ
                </div>
                {langMode !== 'khmer' && (
                  <div style={{ fontSize: '8.5px', color: '#64748b' }}>Delegator / 授权人</div>
                )}
                <div style={{ fontSize: '9px', color: '#64748b', marginTop: '2px' }}>
                  ហត្ថលេខា ឬស្នាមមេដៃ
                </div>
                <div style={{ height: '48px' }} />
                <div style={{ borderBottom: '1px solid #0f172a', width: '82%', margin: '0 auto' }} />
                <div style={{ fontSize: '10px', fontWeight: 700, marginTop: '3px' }}>
                  ឈ្មោះ៖ {delegatorNameKh}
                </div>
              </div>
            </div>

            {/* Department Head & General Manager Approvals */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px', textAlign: 'center', marginTop: '16px', borderTop: '1px dashed #e2e8f0', paddingTop: '10px' }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: '10.5px' }}>
                  ប្រធានផ្នែកផ្ទាល់ {langMode !== 'khmer' ? '(Department Head / 部门主管)' : ''}
                </div>
                <div style={{ height: '40px' }} />
                <div style={{ borderBottom: '1px solid #94a3b8', width: '70%', margin: '0 auto' }} />
                <div style={{ fontSize: '9.5px', color: '#64748b', marginTop: '2px' }}>
                  {isEditMode ? (
                    <input
                      type="text"
                      value={approvedByDeptHead}
                      onChange={(e) => setApprovedByDeptHead(e.target.value)}
                      style={{ fontSize: '9.5px', textAlign: 'center', padding: '1px 4px', border: '1px solid #3b82f6', borderRadius: '4px' }}
                    />
                  ) : (
                    approvedByDeptHead || 'ប្រធានផ្នែក'
                  )}
                </div>
              </div>

              <div>
                <div style={{ fontWeight: 700, fontSize: '10.5px' }}>
                  អគ្គនាយក / នាយកធនធានមនុស្ស {langMode !== 'khmer' ? '(General Manager / HR Director / 总经理)' : ''}
                </div>
                <div style={{ height: '40px' }} />
                <div style={{ borderBottom: '1px solid #94a3b8', width: '70%', margin: '0 auto' }} />
                <div style={{ fontSize: '9.5px', color: '#64748b', marginTop: '2px' }}>
                  {isEditMode ? (
                    <input
                      type="text"
                      value={approvedByManagement}
                      onChange={(e) => setApprovedByManagement(e.target.value)}
                      style={{ fontSize: '9.5px', textAlign: 'center', padding: '1px 4px', border: '1px solid #3b82f6', borderRadius: '4px' }}
                    />
                  ) : (
                    approvedByManagement || 'នាយកចាត់ការទូទៅ'
                  )}{' '}
                  (ចុះហត្ថលេខា & វាយត្រា)
                </div>
              </div>
            </div>

            {/* CC / ដំណឹងជូន (ដូចគំរូរូបភាព) */}
            <div style={{ marginTop: '12px', borderTop: '1px solid #cbd5e1', paddingTop: '6px', fontSize: '9.5px', color: '#475569' }}>
              <div style={{ fontWeight: 700, color: '#0f172a' }}>
                ដំណឹងជូន {langMode !== 'khmer' ? '(CC / 抄送)៖' : '៖'}
              </div>
              <div style={{ paddingLeft: '8px', lineHeight: '1.4' }}>
                <div>- លោក/លោកស្រីអគ្គនាយក {langMode !== 'khmer' ? '(General Manager / 总经理)' : ''}</div>
                <div>- ការិយាល័យរដ្ឋបាល & ធនធានមនុស្ស {langMode !== 'khmer' ? '(HR & Admin Office / 人事行政部)' : ''}</div>
                <div>- ឯកសារក្រុមហ៊ុន {langMode !== 'khmer' ? '(Company Archives / 公司档案)' : ''}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
