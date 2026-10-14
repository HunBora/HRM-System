'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import PayslipCard from './PayslipCard';

export interface BatchPayslipsViewProps {
  payrolls: any[];
  settings: any;
  month: number;
  year: number;
  department?: string;
  departments: string[];
}

export default function BatchPayslipsView({
  payrolls,
  settings,
  month,
  year,
  department = '',
  departments,
}: BatchPayslipsViewProps) {
  // Print & Layout Settings
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('portrait');
  const [slipsPerPage, setSlipsPerPage] = useState<1 | 2>(2); // 2 = Half-sheet cut
  const [printMode, setPrintMode] = useState<'continuous' | 'duplicate'>('continuous');
  const [selectedDept, setSelectedDept] = useState<string>(department);
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Selection Checkboxes
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => {
    return new Set(payrolls.map((p) => p.id));
  });

  // Filtered Payrolls
  const filteredPayrolls = useMemo(() => {
    return payrolls.filter((p) => {
      const emp = p.employee || {};
      const matchesDept = !selectedDept || emp.department === selectedDept;
      const q = searchQuery.toLowerCase().trim();
      const matchesQuery =
        !q ||
        (emp.employeeId && emp.employeeId.toLowerCase().includes(q)) ||
        (emp.firstNameEn && emp.firstNameEn.toLowerCase().includes(q)) ||
        (emp.lastNameEn && emp.lastNameEn.toLowerCase().includes(q)) ||
        (emp.firstNameKh && emp.firstNameKh.toLowerCase().includes(q)) ||
        (emp.lastNameKh && emp.lastNameKh.toLowerCase().includes(q)) ||
        (emp.position && emp.position.toLowerCase().includes(q));

      return matchesDept && matchesQuery;
    });
  }, [payrolls, selectedDept, searchQuery]);

  // Selected Payrolls for printing
  const activePayrolls = useMemo(() => {
    return filteredPayrolls.filter((p) => selectedIds.has(p.id));
  }, [filteredPayrolls, selectedIds]);

  // Prepare List of Individual Slips to Print
  interface SlipItem {
    payroll: any;
    copyLabel?: string;
  }

  const slipsList = useMemo<SlipItem[]>(() => {
    const list: SlipItem[] = [];

    if (printMode === 'duplicate') {
      // 2 copies per employee: 1 Employee copy, 1 Company copy
      activePayrolls.forEach((p) => {
        list.push({ payroll: p, copyLabel: 'ច្បាប់បុគ្គលិក (Employee Copy)' });
        list.push({ payroll: p, copyLabel: 'ច្បាប់ក្រុមហ៊ុន (Company Copy)' });
      });
    } else {
      // Continuous: each employee gets 1 slip
      activePayrolls.forEach((p) => {
        list.push({ payroll: p });
      });
    }

    return list;
  }, [activePayrolls, printMode]);

  // Group Slips into Sheets (1 or 2 per sheet)
  const sheets = useMemo<SlipItem[][]>(() => {
    const grouped: SlipItem[][] = [];
    const chunkSize = slipsPerPage;

    for (let i = 0; i < slipsList.length; i += chunkSize) {
      grouped.push(slipsList.slice(i, i + chunkSize));
    }

    return grouped;
  }, [slipsList, slipsPerPage]);

  // Select / Deselect All
  const toggleSelectAll = () => {
    if (activePayrolls.length === filteredPayrolls.length && filteredPayrolls.length > 0) {
      // Deselect all filtered
      const next = new Set(selectedIds);
      filteredPayrolls.forEach((p) => next.delete(p.id));
      setSelectedIds(next);
    } else {
      // Select all filtered
      const next = new Set(selectedIds);
      filteredPayrolls.forEach((p) => next.add(p.id));
      setSelectedIds(next);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const m = month.toString().padStart(2, '0');
  const y = year;

  return (
    <div className="batch-payslips-root" style={{ minHeight: '100vh', paddingBottom: '60px' }}>
      {/* Dynamic Print CSS */}
      <style dangerouslySetInnerHTML={{ __html: `
        @page {
          size: ${orientation === 'landscape' ? 'landscape' : 'portrait'};
          margin: 6mm 8mm;
        }

        @media print {
          /* Hide non-printable app chrome */
          .no-print,
          aside,
          nav,
          header,
          .navbar,
          .sidebar,
          .print-hidden {
            display: none !important;
          }

          body {
            background: #ffffff !important;
            margin: 0 !important;
            padding: 0 !important;
            color: #0f172a !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }

          .batch-payslips-root {
            padding: 0 !important;
            margin: 0 !important;
          }

          .print-sheet {
            page-break-after: always !important;
            break-after: page !important;
            page-break-inside: avoid !important;
            break-inside: avoid !important;
            box-shadow: none !important;
            border: none !important;
            background: transparent !important;
            margin: 0 !important;
            padding: 0 !important;
            width: 100% !important;
            min-height: ${orientation === 'landscape' ? '195mm' : '280mm'} !important;
            display: flex !important;
            flex-direction: ${orientation === 'landscape' && slipsPerPage === 2 ? 'row' : 'column'} !important;
            justify-content: space-between !important;
            box-sizing: border-box !important;
          }

          .print-sheet:last-of-type {
            page-break-after: auto !important;
            break-after: auto !important;
          }

          .payslip-card {
            border: 1px solid #94a3b8 !important;
            box-shadow: none !important;
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }

          /* Cut line styling for print */
          .cut-line-h {
            border-top: 1.5px dashed #64748b !important;
            color: #64748b !important;
            margin: 6px 0 !important;
            padding-top: 2px !important;
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
          }

          .cut-line-v {
            border-left: 1.5px dashed #64748b !important;
            color: #64748b !important;
            margin: 0 6px !important;
            display: flex !important;
            flex-direction: column !important;
            align-items: center !important;
            justify-content: center !important;
          }
        }
      `}} />

      {/* ========================================================
          STICKY TOP CONTROL BAR (Hidden During Print)
         ======================================================== */}
      <div
        className="no-print"
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 100,
          backgroundColor: '#0f172a',
          color: '#ffffff',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.4)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
          padding: '14px 20px',
          marginBottom: '25px',
        }}
      >
        {/* Top Header Row */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '12px',
            marginBottom: '14px',
          }}
        >
          {/* Back & Title */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <Link
              href={`/dashboard/payroll?month=${month}&year=${year}`}
              style={{
                textDecoration: 'none',
                color: '#cbd5e1',
                backgroundColor: 'rgba(255, 255, 255, 0.08)',
                padding: '7px 14px',
                borderRadius: '8px',
                fontSize: '0.85rem',
                fontWeight: 600,
                border: '1px solid rgba(255, 255, 255, 0.12)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
              }}
              className="kh-text"
            >
              ← ត្រឡប់ក្រោយ (Back)
            </Link>

            <div>
              <h1
                className="kh-text"
                style={{
                  fontSize: '1.2rem',
                  fontWeight: 800,
                  margin: 0,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                <span>🖨️ បោះពុម្ពវិក្កយបត្រប្រាក់បៀវត្សរ៍ (Batch Payslips Print)</span>
              </h1>
              <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '2px' }}>
                <span className="kh-text">ប្រចាំខែ</span>: {m} / {y} • {settings?.companyName || 'Telkhmer'}
              </div>
            </div>
          </div>

          {/* Quick Stats & Big Print Button */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
            {/* Summary Badge */}
            <div
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.08)',
                padding: '6px 14px',
                borderRadius: '8px',
                border: '1px solid rgba(255, 255, 255, 0.14)',
                fontSize: '0.8rem',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <span>
                ជ្រើសរើស: <strong>{activePayrolls.length}</strong> / {filteredPayrolls.length} នាក់
              </span>
              <span style={{ color: '#64748b' }}>•</span>
              <span style={{ color: '#38bdf8', fontWeight: 700 }}>
                សរុប: <strong>{sheets.length}</strong> សន្លឹក A4
              </span>
              {slipsPerPage === 2 && (
                <span
                  style={{
                    backgroundColor: 'rgba(16, 185, 129, 0.2)',
                    color: '#86efac',
                    padding: '2px 8px',
                    borderRadius: '12px',
                    fontSize: '0.72rem',
                    fontWeight: 700,
                  }}
                  className="kh-text"
                >
                  🌿 សន្សំក្រដាស 50%
                </span>
              )}
            </div>

            {/* Print Button */}
            <button
              type="button"
              onClick={handlePrint}
              disabled={activePayrolls.length === 0}
              style={{
                backgroundColor: activePayrolls.length === 0 ? '#475569' : '#2563eb',
                color: '#ffffff',
                border: 'none',
                padding: '9px 22px',
                borderRadius: '8px',
                fontWeight: 700,
                fontSize: '0.95rem',
                cursor: activePayrolls.length === 0 ? 'not-allowed' : 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: '0 4px 14px rgba(37, 99, 235, 0.4)',
                transition: 'all 0.15s ease',
              }}
              className="kh-text"
            >
              <span>🖨️ បោះពុម្ព (Print Now)</span>
            </button>
          </div>
        </div>

        {/* Bottom Filter & Print Options Row */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '12px',
            backgroundColor: 'rgba(255, 255, 255, 0.04)',
            padding: '12px 14px',
            borderRadius: '10px',
            border: '1px solid rgba(255, 255, 255, 0.08)',
          }}
        >
          {/* 1. Orientation: Portrait vs Landscape */}
          <div>
            <label className="kh-text" style={{ fontSize: '0.72rem', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>
              ទិសដៅក្រដាស (Orientation)
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px' }}>
              <button
                type="button"
                onClick={() => setOrientation('portrait')}
                style={{
                  padding: '6px 8px',
                  borderRadius: '6px',
                  border: orientation === 'portrait' ? '1.5px solid #38bdf8' : '1px solid rgba(255, 255, 255, 0.12)',
                  backgroundColor: orientation === 'portrait' ? 'rgba(56, 189, 248, 0.2)' : 'rgba(255, 255, 255, 0.04)',
                  color: orientation === 'portrait' ? '#38bdf8' : '#cbd5e1',
                  fontSize: '0.78rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
                className="kh-text"
              >
                📄 បញ្ឈរ (Portrait)
              </button>
              <button
                type="button"
                onClick={() => setOrientation('landscape')}
                style={{
                  padding: '6px 8px',
                  borderRadius: '6px',
                  border: orientation === 'landscape' ? '1.5px solid #38bdf8' : '1px solid rgba(255, 255, 255, 0.12)',
                  backgroundColor: orientation === 'landscape' ? 'rgba(56, 189, 248, 0.2)' : 'rgba(255, 255, 255, 0.04)',
                  color: orientation === 'landscape' ? '#38bdf8' : '#cbd5e1',
                  fontSize: '0.78rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
                className="kh-text"
              >
                📑 ផ្ដេក (Landscape)
              </button>
            </div>
          </div>

          {/* 2. Slips Per Page: 2 per page (Cut in Half) vs 1 per page */}
          <div>
            <label className="kh-text" style={{ fontSize: '0.72rem', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>
              ចំនួនក្នុង ១ សន្លឹក (Slips per Sheet)
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '4px' }}>
              <button
                type="button"
                onClick={() => setSlipsPerPage(2)}
                title="សន្សំក្រដាស ដោយកាត់ជាពីរ (2 Payslips per A4 sheet with cut line)"
                style={{
                  padding: '6px 8px',
                  borderRadius: '6px',
                  border: slipsPerPage === 2 ? '1.5px solid #10b981' : '1px solid rgba(255, 255, 255, 0.12)',
                  backgroundColor: slipsPerPage === 2 ? 'rgba(16, 185, 129, 0.2)' : 'rgba(255, 255, 255, 0.04)',
                  color: slipsPerPage === 2 ? '#34d399' : '#cbd5e1',
                  fontSize: '0.76rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '4px',
                }}
                className="kh-text"
              >
                <span>✂️ ២ សន្លឹក (កាត់ជាពីរ)</span>
              </button>
              <button
                type="button"
                onClick={() => setSlipsPerPage(1)}
                style={{
                  padding: '6px 8px',
                  borderRadius: '6px',
                  border: slipsPerPage === 1 ? '1.5px solid #38bdf8' : '1px solid rgba(255, 255, 255, 0.12)',
                  backgroundColor: slipsPerPage === 1 ? 'rgba(56, 189, 248, 0.2)' : 'rgba(255, 255, 255, 0.04)',
                  color: slipsPerPage === 1 ? '#38bdf8' : '#cbd5e1',
                  fontSize: '0.78rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
                className="kh-text"
              >
                📄 ១ សន្លឹក (ពេញ)
              </button>
            </div>
          </div>

          {/* 3. Print Mode: Continuous vs Duplicate */}
          <div>
            <label className="kh-text" style={{ fontSize: '0.72rem', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>
              របៀបផ្គុំវិក្កយបត្រ (Layout Mode)
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px' }}>
              <button
                type="button"
                onClick={() => setPrintMode('continuous')}
                title="បុគ្គលិកបន្តបន្ទាប់ (បុគ្គលិកទី ១ + ទី ២ ក្នុង ១ សន្លឹក A4)"
                style={{
                  padding: '6px 8px',
                  borderRadius: '6px',
                  border: printMode === 'continuous' ? '1.5px solid #38bdf8' : '1px solid rgba(255, 255, 255, 0.12)',
                  backgroundColor: printMode === 'continuous' ? 'rgba(56, 189, 248, 0.2)' : 'rgba(255, 255, 255, 0.04)',
                  color: printMode === 'continuous' ? '#38bdf8' : '#cbd5e1',
                  fontSize: '0.76rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
                className="kh-text"
              >
                👥 បន្តបន្ទាប់ (1/នាក់)
              </button>
              <button
                type="button"
                onClick={() => setPrintMode('duplicate')}
                title="ច្បាប់ដើម + ច្បាប់ចម្លង (២ ច្បាប់ក្នុងម្នាក់: ច្បាប់ក្រុមហ៊ុន & ច្បាប់បុគ្គលិក)"
                style={{
                  padding: '6px 8px',
                  borderRadius: '6px',
                  border: printMode === 'duplicate' ? '1.5px solid #f59e0b' : '1px solid rgba(255, 255, 255, 0.12)',
                  backgroundColor: printMode === 'duplicate' ? 'rgba(245, 158, 11, 0.2)' : 'rgba(255, 255, 255, 0.04)',
                  color: printMode === 'duplicate' ? '#fbbf24' : '#cbd5e1',
                  fontSize: '0.76rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
                className="kh-text"
              >
                📑 ចម្លង (2 ច្បាប់/នាក់)
              </button>
            </div>
          </div>

          {/* 4. Filter By Department */}
          <div>
            <label className="kh-text" style={{ fontSize: '0.72rem', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>
              ផ្នែក (Department)
            </label>
            <select
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
              style={{
                width: '100%',
                padding: '6px 10px',
                borderRadius: '6px',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                backgroundColor: '#1e293b',
                color: '#ffffff',
                fontSize: '0.82rem',
                outline: 'none',
              }}
              className="kh-text"
            >
              <option value="">គ្រប់ផ្នែកទាំងអស់ (All Departments)</option>
              {departments.map((dept) => (
                <option key={dept} value={dept}>
                  {dept}
                </option>
              ))}
            </select>
          </div>

          {/* 5. Search Box & Selection Toggle */}
          <div>
            <label className="kh-text" style={{ fontSize: '0.72rem', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>
              ស្វែងរក ឬជ្រើសរើស (Search / Select)
            </label>
            <div style={{ display: 'flex', gap: '6px' }}>
              <input
                type="text"
                placeholder="អត្តលេខ, ឈ្មោះ..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  flex: 1,
                  padding: '6px 10px',
                  borderRadius: '6px',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  backgroundColor: '#1e293b',
                  color: '#ffffff',
                  fontSize: '0.82rem',
                  outline: 'none',
                }}
                className="kh-text"
              />
              <button
                type="button"
                onClick={toggleSelectAll}
                style={{
                  padding: '6px 10px',
                  borderRadius: '6px',
                  border: '1px solid rgba(255, 255, 255, 0.14)',
                  backgroundColor: 'rgba(255, 255, 255, 0.08)',
                  color: '#e2e8f0',
                  fontSize: '0.74rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                }}
                className="kh-text"
              >
                {activePayrolls.length === filteredPayrolls.length && filteredPayrolls.length > 0
                  ? 'ដោះទាំងអស់'
                  : 'យកទាំងអស់'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================
          PRINT PREVIEW CONTAINER (Rendered A4 Sheets)
         ======================================================== */}
      {sheets.length === 0 ? (
        <div
          style={{
            textAlign: 'center',
            padding: '60px 20px',
            backgroundColor: '#ffffff',
            maxWidth: '600px',
            margin: '40px auto',
            borderRadius: '12px',
            border: '1px solid #e2e8f0',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.06)',
          }}
          className="no-print"
        >
          <div style={{ fontSize: '3rem', marginBottom: '12px' }}>🔍</div>
          <h3 className="kh-text" style={{ fontSize: '1.2rem', color: '#1e293b', margin: '0 0 6px 0' }}>
            មិនមានទិន្នន័យវិក្កយបត្រត្រូវបោះពុម្ពទេ (No Payslips Found)
          </h3>
          <p className="kh-text" style={{ color: '#64748b', fontSize: '0.88rem', margin: 0 }}>
            សូមពិនិត្យមើលការជ្រើសរើសខែ ឆ្នាំ ឬតម្រងផ្នែកខាងលើម្តងទៀត។
          </p>
        </div>
      ) : (
        <div
          className="printable-batch-area"
          style={{
            maxWidth: orientation === 'landscape' ? '1120px' : '820px',
            margin: '0 auto',
            display: 'flex',
            flexDirection: 'column',
            gap: '30px',
          }}
        >
          {sheets.map((sheet, sheetIdx) => {
            const isPair = sheet.length === 2 && slipsPerPage === 2;

            return (
              <div
                key={`sheet-${sheetIdx}`}
                className="print-sheet"
                style={{
                  backgroundColor: '#ffffff',
                  boxShadow: '0 4px 25px rgba(0, 0, 0, 0.1)',
                  borderRadius: '8px',
                  padding: orientation === 'landscape' ? '14px' : '16px',
                  border: '1px solid #cbd5e1',
                  boxSizing: 'border-box',
                  position: 'relative',
                  display: 'flex',
                  flexDirection: orientation === 'landscape' && slipsPerPage === 2 ? 'row' : 'column',
                  gap: orientation === 'landscape' ? '12px' : '10px',
                  minHeight: orientation === 'landscape' ? '700px' : '1000px',
                  justifyContent: 'space-between',
                }}
              >
                {/* First Slip */}
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                  <PayslipCard
                    payroll={sheet[0].payroll}
                    settings={settings}
                    copyLabel={sheet[0].copyLabel}
                    compact={slipsPerPage === 2}
                    orientation={orientation}
                  />
                </div>

                {/* Second Slip (If 2 slips per page) */}
                {isPair && (
                  <>
                    {/* Cut Line: Horizontal in Portrait, Vertical in Landscape */}
                    {orientation === 'portrait' ? (
                      <div
                        className="cut-line-h"
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '12px',
                          margin: '8px 0',
                          borderTop: '1.5px dashed #94a3b8',
                          color: '#64748b',
                          fontSize: '0.72rem',
                          paddingTop: '4px',
                          userSelect: 'none',
                        }}
                      >
                        <span>✂️</span>
                        <span className="kh-text" style={{ letterSpacing: '2px', fontWeight: 600 }}>
                          - - - - - - - - - - កាត់ជាពីរត្រង់នេះ (Cut Here) - - - - - - - - - -
                        </span>
                        <span>✂️</span>
                      </div>
                    ) : (
                      <div
                        className="cut-line-v"
                        style={{
                          width: '24px',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '14px',
                          borderLeft: '1.5px dashed #94a3b8',
                          margin: '0 4px',
                          color: '#64748b',
                          fontSize: '0.7rem',
                          userSelect: 'none',
                        }}
                      >
                        <span>✂️</span>
                        <div
                          className="kh-text"
                          style={{
                            writingMode: 'vertical-rl',
                            textOrientation: 'mixed',
                            letterSpacing: '3px',
                            fontWeight: 600,
                          }}
                        >
                          កាត់ជាពីរ (Cut Here)
                        </div>
                        <span>✂️</span>
                      </div>
                    )}

                    {/* Second Slip */}
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                      <PayslipCard
                        payroll={sheet[1].payroll}
                        settings={settings}
                        copyLabel={sheet[1].copyLabel}
                        compact={slipsPerPage === 2}
                        orientation={orientation}
                      />
                    </div>
                  </>
                )}

                {/* If slipsPerPage === 2 but odd count on last page */}
                {!isPair && slipsPerPage === 2 && (
                  <div
                    className="no-print"
                    style={{
                      flex: 1,
                      border: '1.5px dashed #e2e8f0',
                      borderRadius: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#94a3b8',
                      fontSize: '0.85rem',
                      minHeight: '200px',
                      marginTop: orientation === 'portrait' ? '12px' : 0,
                    }}
                  >
                    <span className="kh-text">
                      (ចន្លោះទទេសម្រាប់កាត់ក្រដាស / Blank Half-Sheet)
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
