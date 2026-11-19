'use client';

import React, { useState, useMemo } from 'react';
import * as XLSX from 'xlsx';

export interface EmployeeWithContracts {
  id: string;
  employeeId: string;
  firstNameKh?: string | null;
  lastNameKh?: string | null;
  firstNameEn: string;
  lastNameEn: string;
  gender: string;
  dob?: string | null;
  nationalId?: string | null;
  position: string;
  department: string;
  line?: string | null;
  phone?: string | null;
  nssfNo?: string | null;
  placeOfBirth?: string | null;
  address?: string | null;
  nationality?: string | null;
  basicSalary: number;
  hireDate: string;
  photoUrl?: string | null;
  probationStart?: string | null;
  probationEnd?: string | null;
  contracts?: Array<{
    id: string;
    contractNo: string;
    contractType: string;
    status: string;
    startDate: string;
    endDate?: string | null;
    renewalCount?: number;
  }>;
}

interface Props {
  employees: EmployeeWithContracts[];
  companySettings?: any;
}

function formatDateStr(d?: string | Date | null): string {
  if (!d) return '';
  const date = typeof d === 'string' ? new Date(d) : d;
  if (isNaN(date.getTime())) return '';
  return date.toISOString().split('T')[0];
}

function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

function addMonths(date: Date, months: number): Date {
  const result = new Date(date);
  result.setMonth(result.getMonth() + months);
  return result;
}

function computeSeniority(hireDateStr: string, asOfDate: Date = new Date()): string {
  const start = new Date(hireDateStr);
  if (isNaN(start.getTime())) return '0 Year, 0 Month, 0 Days';

  let years = asOfDate.getFullYear() - start.getFullYear();
  let months = asOfDate.getMonth() - start.getMonth();
  let days = asOfDate.getDate() - start.getDate();

  if (days < 0) {
    months -= 1;
    const prevMonthLastDay = new Date(asOfDate.getFullYear(), asOfDate.getMonth(), 0).getDate();
    days += prevMonthLastDay;
  }
  if (months < 0) {
    years -= 1;
    months += 12;
  }
  if (years < 0) return '0 Year, 0 Month, 0 Days';

  return `${years} Year, ${months} Month, ${days} Days`;
}

export default function FactoryContractPeriodMatrix({ employees, companySettings }: Props) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDept, setSelectedDept] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState('ALL');

  // Compute department counts for "Amount by dept"
  const deptCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    employees.forEach((emp) => {
      const deptKey = emp.line ? `${emp.department} - ${emp.line}` : emp.department || 'General';
      counts[deptKey] = (counts[deptKey] || 0) + 1;
    });
    return counts;
  }, [employees]);

  // Unique departments for filter
  const departmentOptions = useMemo(() => {
    const depts = new Set<string>();
    employees.forEach((emp) => {
      if (emp.department) depts.add(emp.department);
      if (emp.line) depts.add(emp.line);
    });
    return Array.from(depts).sort();
  }, [employees]);

  // Process rows with 1st to 9th FDC and UDC calculations
  const matrixData = useMemo(() => {
    return employees.map((emp, index) => {
      const hireDate = new Date(emp.hireDate);
      const joinDateStr = formatDateStr(emp.hireDate);
      const seniority = computeSeniority(emp.hireDate);

      // Finish Probation: exactly 2 months minus 1 day (or from DB)
      let finishProbationDate: Date;
      if (emp.probationEnd) {
        finishProbationDate = new Date(emp.probationEnd);
      } else {
        finishProbationDate = addDays(addMonths(hireDate, 2), -1);
      }
      const finishProbationStr = formatDateStr(finishProbationDate);

      // Map 9 FDC Cycles (3 months each)
      const fdcCycles: Array<{ cycle: number; start: string; finish: string; isActive: boolean }> = [];
      let currentCycleStart = addDays(finishProbationDate, 1);

      for (let c = 1; c <= 9; c++) {
        // Check if there is an existing contract in DB
        const existingFdc = emp.contracts?.find((ctr) => ctr.contractNo.includes(`FDC${c}`));
        let startStr = '';
        let finishStr = '';

        if (existingFdc && existingFdc.startDate) {
          startStr = formatDateStr(existingFdc.startDate);
          finishStr = existingFdc.endDate ? formatDateStr(existingFdc.endDate) : '';
        } else {
          // Standard factory calculation: 3-month fixed term
          const cycleFinish = addDays(addMonths(currentCycleStart, 3), -1);
          startStr = formatDateStr(currentCycleStart);
          finishStr = formatDateStr(cycleFinish);
          currentCycleStart = addDays(cycleFinish, 1);
        }

        const now = new Date();
        const sDate = new Date(startStr);
        const fDate = new Date(finishStr);
        const isActive = now >= sDate && now <= fDate;

        fdcCycles.push({
          cycle: c,
          start: startStr,
          finish: finishStr,
          isActive,
        });
      }

      // UDC Starting Date: directly follows FDC 9 finish date (or from DB)
      const existingUdc = emp.contracts?.find((ctr) => ctr.contractType === 'UDC');
      let udcStartDateStr = '';
      if (existingUdc && existingUdc.startDate) {
        udcStartDateStr = formatDateStr(existingUdc.startDate);
      } else if (fdcCycles[8]?.finish) {
        const lastFdcFinish = new Date(fdcCycles[8].finish);
        udcStartDateStr = formatDateStr(addDays(lastFdcFinish, 1));
      }

      const isUdcActive = Boolean(
        existingUdc?.status === 'ACTIVE' ||
        (udcStartDateStr && new Date() >= new Date(udcStartDateStr))
      );

      const deptGroupKey = emp.line ? `${emp.department} - ${emp.line}` : emp.department;
      const deptWorkerCount = deptCounts[deptGroupKey] || 1;

      return {
        no: index + 1,
        id: emp.employeeId,
        deptWorkerCount,
        nameEn: `${emp.lastNameEn} ${emp.firstNameEn}`,
        nameKh: emp.firstNameKh && emp.lastNameKh ? `${emp.lastNameKh} ${emp.firstNameKh}` : '',
        sex: emp.gender === 'FEMALE' ? '女 / Female' : '男 / Male',
        genderRaw: emp.gender,
        department: emp.department || 'Production',
        line: emp.line || 'Line 01',
        position: emp.position || 'Staff',
        joinDate: joinDateStr,
        seniority,
        finishProbation: finishProbationStr,
        fdcCycles,
        udcStartDate: udcStartDateStr,
        isUdcActive,
        nationalId: emp.nationalId || '',
        nssf: emp.nssfNo || '',
        dob: formatDateStr(emp.dob),
        basicSalary: emp.basicSalary || 208,
        phone: emp.phone || '',
        placeOfBirth: emp.placeOfBirth || emp.address || '',
        nationality: emp.nationality || 'Cambodia',
      };
    });
  }, [employees, deptCounts]);

  // Filtered rows
  const filteredData = useMemo(() => {
    return matrixData.filter((row) => {
      const matchesSearch =
        row.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        row.nameEn.toLowerCase().includes(searchTerm.toLowerCase()) ||
        row.nameKh.includes(searchTerm) ||
        row.department.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesDept =
        selectedDept === 'ALL' ||
        row.department === selectedDept ||
        row.line === selectedDept;

      const matchesStatus =
        selectedStatus === 'ALL' ||
        (selectedStatus === 'UDC' && row.isUdcActive) ||
        (selectedStatus === 'FDC' && !row.isUdcActive);

      return matchesSearch && matchesDept && matchesStatus;
    });
  }, [matrixData, searchTerm, selectedDept, selectedStatus]);

  // Export to Excel replicating exact Factory Form format
  const handleExportExcel = () => {
    const wb = XLSX.utils.book_new();

    // Multi-tier header structure matching user's CSV
    const wsData: any[][] = [];

    // Row 1: Title
    wsData.push(['Name list of workers With Period of Contract']);

    // Row 2: Subheader groups
    const subheaderRow = new Array(42).fill('');
    subheaderRow[12] = '1st FDC Contract';
    subheaderRow[14] = '2nd FDC Contract';
    subheaderRow[16] = '3rd FDC Contract';
    subheaderRow[18] = '4th FDC Contract';
    subheaderRow[20] = '5th FDC Contract';
    subheaderRow[22] = '6th FDC Contract';
    subheaderRow[24] = '7th FDC Contract';
    subheaderRow[26] = '8th FDC Contract';
    subheaderRow[28] = '9th FDC Contract';
    subheaderRow[30] = 'UDC Starting Date';
    wsData.push(subheaderRow);

    // Row 3: Numeric Indices
    const numRow = [];
    for (let i = 1; i <= 42; i++) numRow.push(i.toString());
    wsData.push(numRow);

    // Row 4: Column Labels (Bilingual / Factory standard)
    wsData.push([
      'ID',
      'No',
      'Amount by dept',
      'ID',
      'Name',
      'Khmer Name',
      'Sex',
      'Department',
      'Position',
      'Join Date',
      'Duration',
      'Finish Probation',
      'Start',
      'Finish',
      'Start',
      'Finish',
      'Start',
      'Finish',
      'Start',
      'Finish',
      'Start',
      'Finish',
      'Start',
      'Finish',
      'Start',
      'Finish',
      'Start',
      'Finish',
      'Start',
      'Finish',
      'Start',
      'Status',
      'NATIONAL ID',
      'NSSF',
      'DATE OF BIRTH',
      'BASIC SALARY',
      'TEL 1',
      'PLACE OF BIRTH',
      'NATIONALITY',
    ]);

    // Row 5+: Data rows
    filteredData.forEach((r) => {
      wsData.push([
        r.id,
        r.no,
        r.deptWorkerCount,
        r.id,
        r.nameEn,
        r.nameKh,
        r.sex,
        r.department,
        r.position,
        r.joinDate,
        r.seniority,
        r.finishProbation,
        r.fdcCycles[0]?.start || '',
        r.fdcCycles[0]?.finish || '',
        r.fdcCycles[1]?.start || '',
        r.fdcCycles[1]?.finish || '',
        r.fdcCycles[2]?.start || '',
        r.fdcCycles[2]?.finish || '',
        r.fdcCycles[3]?.start || '',
        r.fdcCycles[3]?.finish || '',
        r.fdcCycles[4]?.start || '',
        r.fdcCycles[4]?.finish || '',
        r.fdcCycles[5]?.start || '',
        r.fdcCycles[5]?.finish || '',
        r.fdcCycles[6]?.start || '',
        r.fdcCycles[6]?.finish || '',
        r.fdcCycles[7]?.start || '',
        r.fdcCycles[7]?.finish || '',
        r.fdcCycles[8]?.start || '',
        r.fdcCycles[8]?.finish || '',
        r.udcStartDate,
        r.isUdcActive ? 'UDC Active' : 'FDC Active',
        r.nationalId,
        r.nssf,
        r.dob,
        r.basicSalary,
        r.phone,
        r.placeOfBirth,
        r.nationality,
      ]);
    });

    const ws = XLSX.utils.aoa_to_sheet(wsData);

    // Apply Merges for Subheaders
    ws['!merges'] = [
      { s: { r: 0, c: 0 }, e: { r: 0, c: 38 } }, // Title
      { s: { r: 1, c: 12 }, e: { r: 1, c: 13 } }, // 1st FDC
      { s: { r: 1, c: 14 }, e: { r: 1, c: 15 } }, // 2nd FDC
      { s: { r: 1, c: 16 }, e: { r: 1, c: 17 } }, // 3rd FDC
      { s: { r: 1, c: 18 }, e: { r: 1, c: 19 } }, // 4th FDC
      { s: { r: 1, c: 20 }, e: { r: 1, c: 21 } }, // 5th FDC
      { s: { r: 1, c: 22 }, e: { r: 1, c: 23 } }, // 6th FDC
      { s: { r: 1, c: 24 }, e: { r: 1, c: 25 } }, // 7th FDC
      { s: { r: 1, c: 26 }, e: { r: 1, c: 27 } }, // 8th FDC
      { s: { r: 1, c: 28 }, e: { r: 1, c: 29 } }, // 9th FDC
    ];

    XLSX.utils.book_append_sheet(wb, ws, 'Contract Matrix');
    XLSX.writeFile(wb, `Workers_Period_of_Contract_Matrix_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  // Print Form View
  const handlePrintMatrix = () => {
    window.print();
  };

  return (
    <div style={{ background: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '20px', boxShadow: '0 2px 10px rgba(0,0,0,0.04)' }}>
      {/* Title & Actions Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '14px', marginBottom: '16px' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>📑</span> Name list of workers With Period of Contract
          </h2>
          <div style={{ fontSize: '0.85rem', color: '#64748b', marginTop: '4px' }}>
            តារាងតាមដានកាលកំណត់កិច្ចសន្យាការងារ (1st–9th FDC & UDC) តាមទិន្នន័យជាក់ស្តែងក្នុងប្រព័ន្ធ HRM System
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={handleExportExcel}
            style={{
              background: '#16a34a',
              color: '#ffffff',
              border: 'none',
              borderRadius: '7px',
              padding: '7px 14px',
              fontWeight: 700,
              fontSize: '0.82rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            📥 <span>Export ជា Excel (.xlsx)</span>
          </button>
          <button
            type="button"
            onClick={handlePrintMatrix}
            style={{
              background: '#2563eb',
              color: '#ffffff',
              border: 'none',
              borderRadius: '7px',
              padding: '7px 14px',
              fontWeight: 700,
              fontSize: '0.82rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            🖨️ <span>បោះពុម្ព / សន្សំជា PDF</span>
          </button>
        </div>
      </div>

      {/* Stats Summary Bar */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '10px', marginBottom: '16px' }}>
        <div style={{ background: '#f8fafc', padding: '10px 14px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
          <div style={{ fontSize: '0.75rem', color: '#64748b' }}>ចំនួនកម្មករសរុប (Total)</div>
          <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a' }}>{employees.length} នាក់</div>
        </div>
        <div style={{ background: '#f0fdf4', padding: '10px 14px', borderRadius: '8px', border: '1px solid #bbf7d0' }}>
          <div style={{ fontSize: '0.75rem', color: '#166534' }}>ចូលជា UDC រួចរាល់ (Permanent)</div>
          <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#15803d' }}>
            {matrixData.filter((r) => r.isUdcActive).length} នាក់
          </div>
        </div>
        <div style={{ background: '#fefce8', padding: '10px 14px', borderRadius: '8px', border: '1px solid #fef08a' }}>
          <div style={{ fontSize: '0.75rem', color: '#854d0e' }}>កំពុងស្ថិតក្នុង FDC (Fixed Term)</div>
          <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#a16207' }}>
            {matrixData.filter((r) => !r.isUdcActive).length} នាក់
          </div>
        </div>
        <div style={{ background: '#eff6ff', padding: '10px 14px', borderRadius: '8px', border: '1px solid #bfdbfe' }}>
          <div style={{ fontSize: '0.75rem', color: '#1e40af' }}>ស្ត្រី (Female Workers)</div>
          <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#2563eb' }}>
            {matrixData.filter((r) => r.genderRaw === 'FEMALE').length} នាក់
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', alignItems: 'center', marginBottom: '14px', background: '#f8fafc', padding: '10px 14px', borderRadius: '8px' }}>
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="🔍 ស្វែងរកតាម ID, ឈ្មោះ, ឬ ផ្នែក..."
          style={{ padding: '6px 12px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.82rem', flex: '1 1 220px' }}
        />
        <select
          value={selectedDept}
          onChange={(e) => setSelectedDept(e.target.value)}
          style={{ padding: '6px 10px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.82rem', background: '#ffffff' }}
        >
          <option value="ALL">🏢 គ្រប់ផ្នែក (All Depts)</option>
          {departmentOptions.map((d) => (
            <option key={d} value={d}>
              {d}
            </option>
          ))}
        </select>
        <select
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value)}
          style={{ padding: '6px 10px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.82rem', background: '#ffffff' }}
        >
          <option value="ALL">📋 គ្រប់ស្ថានភាពកិច្ចសន្យា</option>
          <option value="UDC">✨ កិច្ចសន្យាមិនកំណត់ (UDC Active)</option>
          <option value="FDC">⏳ កិច្ចសន្យាកំណត់ថិរវេលា (FDC Active)</option>
        </select>
      </div>

      {/* Multi-tier Table Area (Exact Factory Structure) */}
      <div style={{ overflowX: 'auto', border: '1px solid #cbd5e1', borderRadius: '8px', maxHeight: '72vh' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.78rem', whiteSpace: 'nowrap', textAlign: 'center' }}>
          <thead style={{ position: 'sticky', top: 0, zIndex: 10, background: '#f1f5f9' }}>
            {/* Row 1: Subheader Groups */}
            <tr style={{ background: '#e2e8f0', color: '#0f172a', fontWeight: 800, borderBottom: '1px solid #94a3b8' }}>
              <th colSpan={12} style={{ padding: '8px 6px', borderRight: '2px solid #64748b', textAlign: 'left' }}>
                ព័ត៌មានបុគ្គលិក & ចូលបម្រើការងារ (Employee & Seniority Particulars)
              </th>
              <th colSpan={2} style={{ padding: '8px 6px', borderRight: '1px solid #cbd5e1', background: '#e0f2fe' }}>1st FDC</th>
              <th colSpan={2} style={{ padding: '8px 6px', borderRight: '1px solid #cbd5e1', background: '#e0f2fe' }}>2nd FDC</th>
              <th colSpan={2} style={{ padding: '8px 6px', borderRight: '1px solid #cbd5e1', background: '#e0f2fe' }}>3rd FDC</th>
              <th colSpan={2} style={{ padding: '8px 6px', borderRight: '1px solid #cbd5e1', background: '#e0f2fe' }}>4th FDC</th>
              <th colSpan={2} style={{ padding: '8px 6px', borderRight: '1px solid #cbd5e1', background: '#e0f2fe' }}>5th FDC</th>
              <th colSpan={2} style={{ padding: '8px 6px', borderRight: '1px solid #cbd5e1', background: '#e0f2fe' }}>6th FDC</th>
              <th colSpan={2} style={{ padding: '8px 6px', borderRight: '1px solid #cbd5e1', background: '#e0f2fe' }}>7th FDC</th>
              <th colSpan={2} style={{ padding: '8px 6px', borderRight: '1px solid #cbd5e1', background: '#e0f2fe' }}>8th FDC</th>
              <th colSpan={2} style={{ padding: '8px 6px', borderRight: '2px solid #64748b', background: '#e0f2fe' }}>9th FDC</th>
              <th rowSpan={2} style={{ padding: '8px 10px', background: '#dcfce7', color: '#166534', borderRight: '1px solid #86efac' }}>
                UDC Starting Date<br />
                <span style={{ fontSize: '0.7rem' }}>无固定期限开始</span>
              </th>
              <th rowSpan={2} style={{ padding: '8px 10px', background: '#f8fafc', borderRight: '1px solid #cbd5e1' }}>
                ស្ថានភាព (Status)
              </th>
              <th colSpan={6} style={{ padding: '8px 6px', background: '#f8fafc' }}>
                ព័ត៌មានលម្អិតបន្ថែម (Additional Details)
              </th>
            </tr>

            {/* Row 2: Sub-columns (Start / Finish) */}
            <tr style={{ background: '#f1f5f9', color: '#334155', fontWeight: 700, fontSize: '0.74rem', borderBottom: '1px solid #cbd5e1' }}>
              <th style={{ padding: '6px 8px', borderRight: '1px solid #cbd5e1' }}>ID<br />工号</th>
              <th style={{ padding: '6px 6px', borderRight: '1px solid #cbd5e1' }}>No<br />编号</th>
              <th style={{ padding: '6px 6px', borderRight: '1px solid #cbd5e1' }}>Amount<br />部门数量</th>
              <th style={{ padding: '6px 12px', borderRight: '1px solid #cbd5e1', textAlign: 'left' }}>Name<br />名字</th>
              <th style={{ padding: '6px 6px', borderRight: '1px solid #cbd5e1' }}>Sex<br />性别</th>
              <th style={{ padding: '6px 8px', borderRight: '1px solid #cbd5e1' }}>Dept<br />部门</th>
              <th style={{ padding: '6px 8px', borderRight: '1px solid #cbd5e1' }}>Position<br />职位</th>
              <th style={{ padding: '6px 8px', borderRight: '1px solid #cbd5e1' }}>Join Date<br />进厂日期</th>
              <th style={{ padding: '6px 12px', borderRight: '1px solid #cbd5e1' }}>Duration<br />年资</th>
              <th style={{ padding: '6px 8px', borderRight: '2px solid #64748b' }}>Finish Probation<br />试用期结束</th>

              {/* 9 FDC Start & Finish pairs */}
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                <React.Fragment key={num}>
                  <th style={{ padding: '6px 6px', borderRight: '1px solid #cbd5e1', color: '#0369a1' }}>Start</th>
                  <th style={{ padding: '6px 6px', borderRight: num === 9 ? '2px solid #64748b' : '1px solid #cbd5e1', color: '#0369a1' }}>Finish</th>
                </React.Fragment>
              ))}

              {/* Additional Profile Columns */}
              <th style={{ padding: '6px 8px', borderRight: '1px solid #cbd5e1' }}>National ID</th>
              <th style={{ padding: '6px 8px', borderRight: '1px solid #cbd5e1' }}>NSSF</th>
              <th style={{ padding: '6px 8px', borderRight: '1px solid #cbd5e1' }}>DOB</th>
              <th style={{ padding: '6px 8px', borderRight: '1px solid #cbd5e1' }}>Basic Salary</th>
              <th style={{ padding: '6px 8px', borderRight: '1px solid #cbd5e1' }}>Phone</th>
              <th style={{ padding: '6px 8px' }}>Nationality</th>
            </tr>
          </thead>
          <tbody>
            {filteredData.length === 0 ? (
              <tr>
                <td colSpan={38} style={{ padding: '2rem', color: '#94a3b8', textAlign: 'center' }}>
                  មិនមានទិន្នន័យត្រូវនឹងការស្វែងរកឡើយ (No records matched)
                </td>
              </tr>
            ) : (
              filteredData.map((row, idx) => (
                <tr
                  key={row.id}
                  style={{
                    borderBottom: '1px solid #e2e8f0',
                    background: idx % 2 === 0 ? '#ffffff' : '#f8fafc',
                    transition: 'background 0.15s ease',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = '#f0fdf4')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = idx % 2 === 0 ? '#ffffff' : '#f8fafc')}
                >
                  <td style={{ padding: '6px 8px', fontWeight: 800, color: '#1e40af', borderRight: '1px solid #e2e8f0' }}>{row.id}</td>
                  <td style={{ padding: '6px 6px', borderRight: '1px solid #e2e8f0' }}>{row.no}</td>
                  <td style={{ padding: '6px 6px', borderRight: '1px solid #e2e8f0', fontWeight: 700, color: '#475569' }}>{row.deptWorkerCount}</td>
                  <td style={{ padding: '6px 12px', textAlign: 'left', fontWeight: 700, borderRight: '1px solid #e2e8f0' }}>
                    <div>{row.nameEn}</div>
                    {row.nameKh && <div style={{ fontSize: '0.7rem', color: '#64748b' }}>{row.nameKh}</div>}
                  </td>
                  <td style={{ padding: '6px 6px', borderRight: '1px solid #e2e8f0' }}>{row.sex}</td>
                  <td style={{ padding: '6px 8px', borderRight: '1px solid #e2e8f0', fontWeight: 600 }}>{row.department}</td>
                  <td style={{ padding: '6px 8px', borderRight: '1px solid #e2e8f0' }}>{row.position}</td>
                  <td style={{ padding: '6px 8px', borderRight: '1px solid #e2e8f0' }}>{row.joinDate}</td>
                  <td style={{ padding: '6px 12px', borderRight: '1px solid #e2e8f0', color: '#0369a1', fontWeight: 600 }}>{row.seniority}</td>
                  <td style={{ padding: '6px 8px', borderRight: '2px solid #64748b', color: '#b45309', fontWeight: 600 }}>{row.finishProbation}</td>

                  {/* 9 FDC Start & Finish pairs */}
                  {row.fdcCycles.map((fdc) => (
                    <React.Fragment key={fdc.cycle}>
                      <td style={{ padding: '6px 6px', borderRight: '1px solid #e2e8f0', background: fdc.isActive ? '#dbeafe' : 'inherit', fontSize: '0.74rem' }}>
                        {fdc.start}
                      </td>
                      <td style={{ padding: '6px 6px', borderRight: fdc.cycle === 9 ? '2px solid #64748b' : '1px solid #e2e8f0', background: fdc.isActive ? '#dbeafe' : 'inherit', fontSize: '0.74rem' }}>
                        {fdc.finish}
                      </td>
                    </React.Fragment>
                  ))}

                  {/* UDC Starting Date */}
                  <td style={{ padding: '6px 10px', fontWeight: 800, color: '#166534', background: row.isUdcActive ? '#dcfce7' : '#f8fafc', borderRight: '1px solid #86efac' }}>
                    {row.udcStartDate}
                  </td>

                  {/* Status Badge */}
                  <td style={{ padding: '6px 8px', borderRight: '1px solid #e2e8f0' }}>
                    {row.isUdcActive ? (
                      <span style={{ background: '#dcfce7', color: '#15803d', padding: '2px 8px', borderRadius: '12px', fontWeight: 700, fontSize: '0.7rem' }}>
                        ✓ UDC Active
                      </span>
                    ) : (
                      <span style={{ background: '#fef3c7', color: '#b45309', padding: '2px 8px', borderRadius: '12px', fontWeight: 700, fontSize: '0.7rem' }}>
                        ⏳ FDC Active
                      </span>
                    )}
                  </td>

                  {/* Profile columns */}
                  <td style={{ padding: '6px 8px', borderRight: '1px solid #e2e8f0' }}>{row.nationalId || '-'}</td>
                  <td style={{ padding: '6px 8px', borderRight: '1px solid #e2e8f0' }}>{row.nssf || '-'}</td>
                  <td style={{ padding: '6px 8px', borderRight: '1px solid #e2e8f0' }}>{row.dob || '-'}</td>
                  <td style={{ padding: '6px 8px', borderRight: '1px solid #e2e8f0', fontWeight: 700 }}>${row.basicSalary}</td>
                  <td style={{ padding: '6px 8px', borderRight: '1px solid #e2e8f0' }}>{row.phone || '-'}</td>
                  <td style={{ padding: '6px 8px' }}>{row.nationality}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
