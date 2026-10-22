'use client';

import React, { useState, useMemo } from 'react';
import Swal from 'sweetalert2';
import * as XLSX from 'xlsx';

interface Employee {
  id: string;
  employeeId: string;
  firstNameEn: string;
  lastNameEn: string;
  firstNameKh?: string | null;
  lastNameKh?: string | null;
  position: string;
  department: string;
  line?: string | null;
}

interface ShiftRoster {
  id: string;
  employeeId: string;
  date: string;
  shiftType: string;
  startTime?: string | null;
  endTime?: string | null;
  notes?: string | null;
}

interface Props {
  initialEmployees: Employee[];
  initialRosters: ShiftRoster[];
  departments: string[];
  userRole?: string;
  initialYear: number;
  initialMonth: number;
}

const SHIFT_CONFIG: Record<string, { labelKh: string; labelEn: string; labelZh: string; bg: string; text: string; icon: string; border: string }> = {
  MORNING: {
    labelKh: 'ព្រឹក',
    labelEn: 'Morning',
    labelZh: '早班',
    bg: '#fef3c7',
    text: '#b45309',
    icon: '☀️',
    border: '#fde68a'
  },
  AFTERNOON: {
    labelKh: 'រសៀល',
    labelEn: 'Afternoon',
    labelZh: '中班',
    bg: '#e0f2fe',
    text: '#0369a1',
    icon: '⛅',
    border: '#bae6fd'
  },
  NIGHT: {
    labelKh: 'យប់',
    labelEn: 'Night',
    labelZh: '夜班',
    bg: '#f3e8ff',
    text: '#6b21a8',
    icon: '🌙',
    border: '#e9d5ff'
  },
  OFF: {
    labelKh: 'សម្រាក',
    labelEn: 'Off',
    labelZh: '休息',
    bg: '#fee2e2',
    text: '#b91c1c',
    icon: '🏖️',
    border: '#fecaca'
  },
  SPLIT: {
    labelKh: 'បំបែក',
    labelEn: 'Split',
    labelZh: '分段',
    bg: '#ecfdf5',
    text: '#047857',
    icon: '🔄',
    border: '#a7f3d0'
  }
};

export default function RosterClient({
  initialEmployees,
  initialRosters,
  departments,
  userRole = 'ADMIN',
  initialYear,
  initialMonth
}: Props) {
  const isHR = userRole === 'ADMIN' || userRole === 'HR_MANAGER' || userRole === 'HR' || userRole === 'PAYROLL_ADMIN';

  const [year, setYear] = useState<number>(initialYear);
  const [month, setMonth] = useState<number>(initialMonth);
  const [rosters, setRosters] = useState<ShiftRoster[]>(initialRosters);
  const [employees] = useState<Employee[]>(initialEmployees);
  const [loading, setLoading] = useState<boolean>(false);

  // Filters
  const [search, setSearch] = useState<string>('');
  const [departmentFilter, setDepartmentFilter] = useState<string>('ALL');

  // Pagination for high-volume factory staff
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(25);

  // Single Edit / Assign Modal
  const [showCellModal, setShowCellModal] = useState<boolean>(false);
  const [selectedEmp, setSelectedEmp] = useState<Employee | null>(null);
  const [selectedDateStr, setSelectedDateStr] = useState<string>('');
  const [cellForm, setCellForm] = useState({
    shiftType: 'MORNING',
    startTime: '08:00',
    endTime: '17:00',
    notes: ''
  });

  // Bulk Assign Modal
  const [showBulkModal, setShowBulkModal] = useState<boolean>(false);
  const [bulkEmpId, setBulkEmpId] = useState<string>('');
  const [bulkStartDate, setBulkStartDate] = useState<string>('');
  const [bulkEndDate, setBulkEndDate] = useState<string>('');
  const [bulkShiftType, setBulkShiftType] = useState<string>('MORNING');
  const [bulkExcludeSundays, setBulkExcludeSundays] = useState<boolean>(true);

  // Calculate days in selected month
  const daysInMonth = useMemo(() => {
    return new Date(year, month, 0).getDate();
  }, [year, month]);

  const daysArray = useMemo(() => {
    return Array.from({ length: daysInMonth }, (_, i) => {
      const day = i + 1;
      const dateObj = new Date(year, month - 1, day);
      const dayOfWeek = dateObj.toLocaleDateString('en-US', { weekday: 'short' });
      const isSunday = dateObj.getDay() === 0;
      const isSaturday = dateObj.getDay() === 6;
      const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      return { day, dayOfWeek, isSunday, isSaturday, dateStr };
    });
  }, [year, month, daysInMonth]);

  // Map rosters: key = `${employeeId}_${dateStr}` (using YYYY-MM-DD)
  const rosterMap = useMemo(() => {
    const map = new Map<string, ShiftRoster>();
    rosters.forEach(r => {
      const d = new Date(r.date);
      const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      map.set(`${r.employeeId}_${dateStr}`, r);
    });
    return map;
  }, [rosters]);

  // Filtered employees
  const filteredEmployees = useMemo(() => {
    return employees.filter(emp => {
      const matchesDept = departmentFilter === 'ALL' || emp.department === departmentFilter;
      const fullName = `${emp.firstNameEn} ${emp.lastNameEn} ${emp.firstNameKh || ''} ${emp.lastNameKh || ''}`.toLowerCase();
      const matchesSearch = !search || fullName.includes(search.toLowerCase()) || emp.employeeId.toLowerCase().includes(search.toLowerCase());
      return matchesDept && matchesSearch;
    });
  }, [employees, departmentFilter, search]);

  // Paginated employees for matrix
  const totalPages = pageSize === -1 ? 1 : Math.ceil(filteredEmployees.length / pageSize) || 1;
  const paginatedEmployees = useMemo(() => {
    if (pageSize === -1) return filteredEmployees;
    const start = (currentPage - 1) * pageSize;
    return filteredEmployees.slice(start, start + pageSize);
  }, [filteredEmployees, currentPage, pageSize]);

  // Monthly stats
  const stats = useMemo(() => {
    let morning = 0;
    let afternoon = 0;
    let night = 0;
    let off = 0;
    rosters.forEach(r => {
      if (r.shiftType === 'MORNING') morning++;
      else if (r.shiftType === 'AFTERNOON') afternoon++;
      else if (r.shiftType === 'NIGHT') night++;
      else if (r.shiftType === 'OFF') off++;
    });
    return {
      totalStaff: employees.length,
      morning,
      afternoon,
      night,
      off
    };
  }, [rosters, employees]);

  // Fetch rosters for a specific year and month
  const fetchMonthRosters = async (y: number, m: number) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/roster?year=${y}&month=${m}`);
      if (res.ok) {
        const data = await res.json();
        setRosters(data);
      }
    } catch (err) {
      console.error(err);
      Swal.fire({
        icon: 'error',
        title: 'បរាជ័យ (Failed)',
        text: 'មិនអាចទាញទិន្នន័យកាលវិភាគបានទេ'
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePrevMonth = () => {
    let newYear = year;
    let newMonth = month - 1;
    if (newMonth < 1) {
      newMonth = 12;
      newYear -= 1;
    }
    setYear(newYear);
    setMonth(newMonth);
    fetchMonthRosters(newYear, newMonth);
  };

  const handleNextMonth = () => {
    let newYear = year;
    let newMonth = month + 1;
    if (newMonth > 12) {
      newMonth = 1;
      newYear += 1;
    }
    setYear(newYear);
    setMonth(newMonth);
    fetchMonthRosters(newYear, newMonth);
  };

  const handleCellClick = (emp: Employee, dateStr: string) => {
    if (!isHR) return;
    const existing = rosterMap.get(`${emp.id}_${dateStr}`);
    setSelectedEmp(emp);
    setSelectedDateStr(dateStr);
    if (existing) {
      setCellForm({
        shiftType: existing.shiftType || 'MORNING',
        startTime: existing.startTime || '08:00',
        endTime: existing.endTime || '17:00',
        notes: existing.notes || ''
      });
    } else {
      setCellForm({
        shiftType: 'MORNING',
        startTime: '08:00',
        endTime: '17:00',
        notes: ''
      });
    }
    setShowCellModal(true);
  };

  const handleSaveCell = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEmp || !selectedDateStr) return;

    try {
      const res = await fetch('/api/roster', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employeeId: selectedEmp.id,
          date: selectedDateStr,
          shiftType: cellForm.shiftType,
          startTime: cellForm.startTime,
          endTime: cellForm.endTime,
          notes: cellForm.notes
        })
      });

      if (res.ok) {
        setShowCellModal(false);
        await fetchMonthRosters(year, month);
        Swal.fire({
          icon: 'success',
          title: 'ជោគជ័យ (Saved)',
          text: 'បានរក្សាទុកវេនការងារដោយជោគជ័យ',
          timer: 1200,
          showConfirmButton: false
        });
      } else {
        const data = await res.json();
        throw new Error(data.error || 'Failed to save');
      }
    } catch (err: any) {
      Swal.fire({
        icon: 'error',
        title: 'កំហុស (Error)',
        text: err.message
      });
    }
  };

  const handleDeleteCell = async () => {
    if (!selectedEmp || !selectedDateStr) return;
    const result = await Swal.fire({
      title: 'តើអ្នកប្រាកដទេ? (Are you sure?)',
      text: 'ចង់លុបវេនការងារសម្រាប់ថ្ងៃនេះមែនទេ?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'បាទ/ចាស លុប (Yes, Delete)',
      cancelButtonText: 'បោះបង់ (Cancel)'
    });

    if (!result.isConfirmed) return;

    try {
      const res = await fetch(`/api/roster?employeeId=${selectedEmp.id}&date=${selectedDateStr}`, {
        method: 'DELETE'
      });

      if (res.ok) {
        setShowCellModal(false);
        await fetchMonthRosters(year, month);
        Swal.fire({
          icon: 'success',
          title: 'បានលុប (Deleted)',
          text: 'បានលុបវេនការងាររួចរាល់',
          timer: 1200,
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

  const handleBulkAssign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bulkEmpId || !bulkStartDate || !bulkEndDate) {
      Swal.fire({
        icon: 'warning',
        title: 'សូមបំពេញព័ត៌មាន (Required)',
        text: 'សូមជ្រើសរើសបុគ្គលិក និងចន្លោះកាលបរិច្ឆេទ'
      });
      return;
    }

    const start = new Date(bulkStartDate);
    const end = new Date(bulkEndDate);

    if (start > end) {
      Swal.fire({
        icon: 'warning',
        title: 'កាលបរិច្ឆេទមិនត្រឹមត្រូវ',
        text: 'ថ្ងៃចាប់ផ្តើម ត្រូវតែមុនថ្ងៃបញ្ចប់'
      });
      return;
    }

    const datesToAssign: string[] = [];
    const current = new Date(start);
    while (current <= end) {
      if (!bulkExcludeSundays || current.getDay() !== 0) {
        datesToAssign.push(current.toISOString().split('T')[0]);
      }
      current.setDate(current.getDate() + 1);
    }

    if (datesToAssign.length === 0) {
      Swal.fire({
        icon: 'warning',
        title: 'គ្មានកាលបរិច្ឆេទ',
        text: 'គ្មានថ្ងៃដែលត្រូវចាត់តាំងវេនទេ'
      });
      return;
    }

    try {
      const res = await fetch('/api/roster', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employeeId: bulkEmpId,
          bulkDates: datesToAssign,
          shiftType: bulkShiftType,
          startTime: bulkShiftType === 'MORNING' ? '08:00' : bulkShiftType === 'AFTERNOON' ? '13:00' : '21:00',
          endTime: bulkShiftType === 'MORNING' ? '17:00' : bulkShiftType === 'AFTERNOON' ? '21:00' : '06:00',
          notes: 'ចាត់តាំងជាដុំ (Bulk Assigned)'
        })
      });

      if (res.ok) {
        setShowBulkModal(false);
        await fetchMonthRosters(year, month);
        Swal.fire({
          icon: 'success',
          title: 'ជោគជ័យ (Success)',
          text: `បានចាត់តាំងវេនចំនួន ${datesToAssign.length} ថ្ងៃ`,
          timer: 1500,
          showConfirmButton: false
        });
      } else {
        const data = await res.json();
        throw new Error(data.error || 'Failed bulk assign');
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
      return { wch: Math.max(maxLen + 4, 14) };
    });
  };

  const exportToExcel = () => {
    try {
      const exportData = filteredEmployees.map((emp, index) => {
        const row: Record<string, any> = {
          'ល.រ\nNo.\n序号': index + 1,
          'អត្តលេខ\nEmp ID\n工号': emp.employeeId,
          'គោត្តនាម-នាម\nFull Name\n姓名': `${emp.lastNameKh || ''} ${emp.firstNameKh || ''} (${emp.firstNameEn} ${emp.lastNameEn})`.trim(),
          'ផ្នែក\nDepartment\n部门': emp.department,
          'តួនាទី\nPosition\n职位': emp.position,
        };

        daysArray.forEach(d => {
          const rosterItem = rosterMap.get(`${emp.id}_${d.dateStr}`);
          const headerKey = `${d.day} (${d.dayOfWeek})\nDay ${d.day}\n${d.day}日`;
          if (rosterItem) {
            const conf = SHIFT_CONFIG[rosterItem.shiftType] || { labelKh: rosterItem.shiftType, labelEn: rosterItem.shiftType, labelZh: rosterItem.shiftType };
            row[headerKey] = `${conf.labelKh} (${conf.labelEn})`;
          } else {
            row[headerKey] = '-';
          }
        });

        return row;
      });

      const ws = XLSX.utils.json_to_sheet(exportData);
      ws['!cols'] = autoFitColumns(exportData);

      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, `Roster_${year}_${month}`);
      XLSX.writeFile(wb, `Shift_Roster_${year}_${String(month).padStart(2, '0')}.xlsx`);

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
      {/* Page Title & Action Header */}
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
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '28px' }}>⏱️</span>
            <div>
              <h1 style={{ margin: 0, fontSize: '1.6rem', fontWeight: 800, color: '#0f172a' }}>
                កាលវិភាគវេនការងារ (Shift Roster)
              </h1>
              <p style={{ margin: '4px 0 0 0', color: '#64748b', fontSize: '0.88rem' }}>
                Shift Scheduling & Monthly Roster Matrix • 轮班排班表
              </p>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          {/* Month & Year Navigation */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            background: '#f8fafc',
            border: '1px solid #cbd5e1',
            borderRadius: '10px',
            padding: '4px 8px',
            gap: '8px'
          }}>
            <button
              onClick={handlePrevMonth}
              disabled={loading}
              style={{
                background: '#ffffff',
                border: '1px solid #e2e88f',
                borderRadius: '6px',
                padding: '6px 12px',
                cursor: 'pointer',
                fontWeight: 700,
                color: '#1e293b'
              }}
              title="ខែមុន (Previous Month)"
            >
              ◀
            </button>
            <span style={{ fontWeight: 800, fontSize: '1rem', color: '#0f172a', minWidth: '120px', textAlign: 'center' }}>
              {new Date(year, month - 1).toLocaleDateString('km-KH', { month: 'long', year: 'numeric' })}
              <br />
              <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 500 }}>
                {new Date(year, month - 1).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
              </span>
            </span>
            <button
              onClick={handleNextMonth}
              disabled={loading}
              style={{
                background: '#ffffff',
                border: '1px solid #e2e88f',
                borderRadius: '6px',
                padding: '6px 12px',
                cursor: 'pointer',
                fontWeight: 700,
                color: '#1e293b'
              }}
              title="ខែបន្ទាប់ (Next Month)"
            >
              ▶
            </button>
          </div>

          {/* Bulk Assign Button */}
          {isHR && (
            <button
              onClick={() => {
                setBulkEmpId(employees[0]?.id || '');
                setBulkStartDate(`${year}-${String(month).padStart(2, '0')}-01`);
                setBulkEndDate(`${year}-${String(month).padStart(2, '0')}-${String(daysInMonth).padStart(2, '0')}`);
                setShowBulkModal(true);
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                background: 'linear-gradient(135deg, #4f46e5 0%, #3730a3 100%)',
                color: '#ffffff',
                border: 'none',
                borderRadius: '10px',
                padding: '10px 18px',
                fontWeight: 700,
                fontSize: '0.9rem',
                cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(79, 70, 229, 0.25)'
              }}
            >
              <span>⚡</span>
              <div style={{ textAlign: 'left', lineHeight: 1.2 }}>
                <div>ចាត់តាំងជាដុំ</div>
                <div style={{ fontSize: '0.7rem', opacity: 0.85 }}>Bulk Assign • 批量排班</div>
              </div>
            </button>
          )}

          {/* Export Excel Button */}
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
        gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
        gap: '16px'
      }}>
        {/* Card 1: Total Staff */}
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
            👥
          </div>
          <div>
            <div style={{ fontWeight: 800, fontSize: '0.95rem', color: '#0f172a' }}>បុគ្គលិកសរុប</div>
            <div style={{ fontSize: '0.72rem', color: '#64748b' }}>Total Staff • 在职员工</div>
            <div style={{ fontSize: '1.7rem', fontWeight: 900, color: '#0284c7', marginTop: '4px' }}>
              {stats.totalStaff}
            </div>
          </div>
        </div>

        {/* Card 2: Morning Shift */}
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
            ☀️
          </div>
          <div>
            <div style={{ fontWeight: 800, fontSize: '0.95rem', color: '#0f172a' }}>វេនពេលព្រឹក</div>
            <div style={{ fontSize: '0.72rem', color: '#64748b' }}>Morning Shift • 早班</div>
            <div style={{ fontSize: '1.7rem', fontWeight: 900, color: '#b45309', marginTop: '4px' }}>
              {stats.morning}
            </div>
          </div>
        </div>

        {/* Card 3: Afternoon Shift */}
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
            ⛅
          </div>
          <div>
            <div style={{ fontWeight: 800, fontSize: '0.95rem', color: '#0f172a' }}>វេនពេលរសៀល</div>
            <div style={{ fontSize: '0.72rem', color: '#64748b' }}>Afternoon Shift • 中班</div>
            <div style={{ fontSize: '1.7rem', fontWeight: 900, color: '#0369a1', marginTop: '4px' }}>
              {stats.afternoon}
            </div>
          </div>
        </div>

        {/* Card 4: Night Shift */}
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
            color: '#6b21a8',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '24px'
          }}>
            🌙
          </div>
          <div>
            <div style={{ fontWeight: 800, fontSize: '0.95rem', color: '#0f172a' }}>វេនពេលយប់</div>
            <div style={{ fontSize: '0.72rem', color: '#64748b' }}>Night Shift • 夜班</div>
            <div style={{ fontSize: '1.7rem', fontWeight: 900, color: '#6b21a8', marginTop: '4px' }}>
              {stats.night}
            </div>
          </div>
        </div>

        {/* Card 5: Day Off */}
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
            🏖️
          </div>
          <div>
            <div style={{ fontWeight: 800, fontSize: '0.95rem', color: '#0f172a' }}>ថ្ងៃសម្រាក</div>
            <div style={{ fontSize: '0.72rem', color: '#64748b' }}>Days Off • 休息日</div>
            <div style={{ fontSize: '1.7rem', fontWeight: 900, color: '#b91c1c', marginTop: '4px' }}>
              {stats.off}
            </div>
          </div>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: '12px',
        alignItems: 'center',
        background: '#ffffff',
        padding: '14px 18px',
        borderRadius: '14px',
        border: '1px solid #f1f5f9'
      }}>
        {/* Search */}
        <div style={{ flex: '1 1 220px', position: 'relative' }}>
          <input
            type="text"
            placeholder="ស្វែងរកតាមឈ្មោះ ឬអត្តលេខ (Search Name or ID)..."
            value={search}
            onChange={e => { setSearch(e.target.value); setCurrentPage(1); }}
            style={{
              width: '100%',
              padding: '9px 12px 9px 36px',
              borderRadius: '10px',
              border: '1px solid #cbd5e1',
              fontSize: '0.88rem',
              outline: 'none',
              boxSizing: 'border-box'
            }}
          />
          <span style={{ position: 'absolute', left: '12px', top: '9px', color: '#94a3b8' }}>🔍</span>
        </div>

        {/* Department Filter */}
        <div style={{ minWidth: '180px' }}>
          <select
            value={departmentFilter}
            onChange={e => { setDepartmentFilter(e.target.value); setCurrentPage(1); }}
            style={{
              width: '100%',
              padding: '9px 12px',
              borderRadius: '10px',
              border: '1px solid #cbd5e1',
              fontSize: '0.85rem',
              background: '#ffffff',
              outline: 'none',
              fontWeight: 600
            }}
          >
            <option value="ALL">🏢 គ្រប់ផ្នែកទាំងអស់ (All Departments)</option>
            {departments.map(dept => (
              <option key={dept} value={dept}>{dept}</option>
            ))}
          </select>
        </div>

        {/* Page Size Selector */}
        <div style={{ minWidth: '130px' }}>
          <select
            value={pageSize}
            onChange={e => { setPageSize(Number(e.target.value)); setCurrentPage(1); }}
            style={{
              width: '100%',
              padding: '9px 12px',
              borderRadius: '10px',
              border: '1px solid #cbd5e1',
              fontSize: '0.85rem',
              background: '#ffffff',
              outline: 'none',
              fontWeight: 600,
              color: '#0284c7'
            }}
            title="ចំនួនបុគ្គលិកក្នុងមួយទំព័រ (Staff per page)"
          >
            <option value={10}>👥 10 នាក់/ទំព័រ</option>
            <option value={25}>👥 25 នាក់/ទំព័រ</option>
            <option value={50}>👥 50 នាក់/ទំព័រ</option>
            <option value={100}>👥 100 នាក់/ទំព័រ</option>
            <option value={-1}>👥 ទាំងអស់ (All)</option>
          </select>
        </div>

        {/* Reset Filter Button */}
        {(search || departmentFilter !== 'ALL') && (
          <button
            onClick={() => {
              setSearch('');
              setDepartmentFilter('ALL');
              setCurrentPage(1);
            }}
            style={{
              padding: '9px 14px',
              borderRadius: '10px',
              border: '1px solid #fecaca',
              background: '#fef2f2',
              color: '#dc2626',
              fontWeight: 700,
              fontSize: '0.85rem',
              cursor: 'pointer'
            }}
            title="កំណត់ឡើងវិញ (Reset Filter)"
          >
            🔄 សម្អាត Filter
          </button>
        )}

        {/* Legend */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginLeft: 'auto', fontSize: '0.8rem' }}>
          <span style={{ color: '#64748b', fontWeight: 600 }}>សញ្ញាសម្គាល់ (Legend):</span>
          {Object.entries(SHIFT_CONFIG).map(([key, conf]) => (
            <span
              key={key}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                padding: '4px 8px',
                borderRadius: '6px',
                background: conf.bg,
                color: conf.text,
                border: `1px solid ${conf.border}`,
                fontWeight: 700
              }}
            >
              <span>{conf.icon}</span>
              <span>{conf.labelKh} ({conf.labelEn})</span>
            </span>
          ))}
        </div>
      </div>

      {/* Roster Matrix Table Grid */}
      <div style={{
        background: '#ffffff',
        borderRadius: '16px',
        border: '1px solid #e2e8f0',
        boxShadow: '0 4px 20px rgba(0,0,0,0.03)',
        overflow: 'hidden'
      }}>
        <div style={{ overflowX: 'auto', maxHeight: '720px' }}>
          <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: 0, textAlign: 'left', minWidth: '1100px' }}>
            <thead>
              <tr style={{ background: '#f8fafc', position: 'sticky', top: 0, zIndex: 10 }}>
                {/* Employee Info Header (Sticky Left) */}
                <th style={{
                  padding: '10px 12px',
                  borderBottom: '2px solid #cbd5e1',
                  borderRight: '2px solid #e2e8f0',
                  position: 'sticky',
                  left: 0,
                  background: '#f8fafc',
                  zIndex: 20,
                  minWidth: '190px'
                }}>
                  <div style={{ fontWeight: 800, color: '#0f172a', fontSize: '0.88rem' }}>បុគ្គលិក</div>
                  <div style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 600 }}>Employee Name & ID</div>
                  <div style={{ fontSize: '0.65rem', color: '#94a3b8' }}>员工信息</div>
                </th>

                {/* Department Header */}
                <th style={{
                  padding: '10px 12px',
                  borderBottom: '2px solid #cbd5e1',
                  borderRight: '1px solid #e2e8f0',
                  minWidth: '110px',
                  background: '#f8fafc'
                }}>
                  <div style={{ fontWeight: 800, color: '#0f172a', fontSize: '0.88rem' }}>ផ្នែក</div>
                  <div style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 600 }}>Department</div>
                  <div style={{ fontSize: '0.65rem', color: '#94a3b8' }}>部门</div>
                </th>

                {/* Calendar Days Columns (1..DaysInMonth) */}
                {daysArray.map(d => (
                  <th
                    key={d.day}
                    style={{
                      padding: '6px 2px',
                      borderBottom: '2px solid #cbd5e1',
                      borderRight: '1px solid #f1f5f9',
                      textAlign: 'center',
                      minWidth: '36px',
                      background: d.isSunday ? '#fff1f2' : d.isSaturday ? '#f8fafc' : '#ffffff',
                      color: d.isSunday ? '#e11d48' : '#1e293b'
                    }}
                  >
                    <div style={{ fontSize: '0.68rem', fontWeight: 700, textTransform: 'uppercase' }}>
                      {d.dayOfWeek}
                    </div>
                    <div style={{ fontSize: '0.9rem', fontWeight: 900 }}>
                      {d.day}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {paginatedEmployees.length === 0 ? (
                <tr>
                  <td colSpan={daysArray.length + 2} style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>
                    <div style={{ fontSize: '32px', marginBottom: '8px' }}>🔍</div>
                    <div style={{ fontWeight: 700, fontSize: '1rem' }}>មិនមានបុគ្គលិកត្រូវបង្ហាញទេ</div>
                    <div style={{ fontSize: '0.82rem' }}>No active employees found matching the filter</div>
                  </td>
                </tr>
              ) : (
                paginatedEmployees.map((emp, idx) => (
                  <tr
                    key={emp.id}
                    style={{
                      background: idx % 2 === 0 ? '#ffffff' : '#f8fafc',
                      transition: 'background 0.15s ease'
                    }}
                  >
                    {/* Sticky Employee Name/ID column */}
                    <td style={{
                      padding: '8px 12px',
                      borderBottom: '1px solid #e2e8f0',
                      borderRight: '2px solid #e2e8f0',
                      position: 'sticky',
                      left: 0,
                      background: idx % 2 === 0 ? '#ffffff' : '#f8fafc',
                      zIndex: 5
                    }}>
                      <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.88rem' }}>
                        {emp.lastNameKh || ''} {emp.firstNameKh || ''} {(!emp.lastNameKh && !emp.firstNameKh) && `${emp.firstNameEn} ${emp.lastNameEn}`}
                      </div>
                      <div style={{ fontSize: '0.74rem', color: '#4f46e5', fontWeight: 600 }}>
                        {emp.employeeId} • {emp.position}
                      </div>
                    </td>

                    {/* Department */}
                    <td style={{
                      padding: '8px 12px',
                      borderBottom: '1px solid #e2e8f0',
                      borderRight: '1px solid #e2e8f0',
                      fontSize: '0.8rem',
                      fontWeight: 600,
                      color: '#475569'
                    }}>
                      {emp.department}
                    </td>

                    {/* Days Cells */}
                    {daysArray.map(d => {
                      const rosterItem = rosterMap.get(`${emp.id}_${d.dateStr}`);
                      const conf = rosterItem ? SHIFT_CONFIG[rosterItem.shiftType] : null;

                      return (
                        <td
                          key={d.day}
                          onClick={() => handleCellClick(emp, d.dateStr)}
                          title={rosterItem ? `${conf?.labelKh} (${conf?.labelEn}) - ${rosterItem.startTime || ''} to ${rosterItem.endTime || ''}` : 'ចុចដើម្បីចាត់តាំងវេន (Click to assign)'}
                          style={{
                            padding: '3px 1px',
                            borderBottom: '1px solid #e2e8f0',
                            borderRight: '1px solid #f1f5f9',
                            textAlign: 'center',
                            cursor: isHR ? 'pointer' : 'default',
                            background: d.isSunday ? 'rgba(255, 241, 242, 0.4)' : 'transparent',
                            userSelect: 'none'
                          }}
                        >
                          {rosterItem && conf ? (
                            <div style={{
                              display: 'inline-flex',
                              flexDirection: 'column',
                              alignItems: 'center',
                              justifyContent: 'center',
                              width: '30px',
                              height: '30px',
                              borderRadius: '7px',
                              background: conf.bg,
                              color: conf.text,
                              border: `1px solid ${conf.border}`,
                              fontSize: '0.7rem',
                              fontWeight: 800,
                              margin: '0 auto',
                              boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
                            }}>
                              <span style={{ fontSize: '10px', lineHeight: 1 }}>{conf.icon}</span>
                              <span style={{ fontSize: '8.5px', lineHeight: 1 }}>{conf.labelKh}</span>
                            </div>
                          ) : (
                            <div style={{
                              width: '22px',
                              height: '22px',
                              borderRadius: '6px',
                              margin: '0 auto',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: '#cbd5e1',
                              fontSize: '11px'
                            }}>
                              {isHR ? '·' : ''}
                            </div>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination Bar */}
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '12px 18px',
        background: '#ffffff',
        borderRadius: '12px',
        border: '1px solid #e2e8f0',
        gap: '12px'
      }}>
        {/* Count Info */}
        <div style={{ fontSize: '0.85rem', color: '#475569', fontWeight: 600 }}>
          បង្ហាញ {filteredEmployees.length === 0 ? 0 : (currentPage - 1) * (pageSize === -1 ? filteredEmployees.length : pageSize) + 1} ដល់{' '}
          {pageSize === -1 ? filteredEmployees.length : Math.min(currentPage * pageSize, filteredEmployees.length)} នៃ{' '}
          <strong style={{ color: '#0f172a' }}>{filteredEmployees.length}</strong> នាក់
          <span style={{ fontSize: '0.75rem', color: '#94a3b8', marginLeft: '6px' }}>
            (Showing {filteredEmployees.length === 0 ? 0 : (currentPage - 1) * (pageSize === -1 ? filteredEmployees.length : pageSize) + 1}-
            {pageSize === -1 ? filteredEmployees.length : Math.min(currentPage * pageSize, filteredEmployees.length)} of {filteredEmployees.length} staff)
          </span>
        </div>

        {/* Page Nav Controls */}
        {pageSize !== -1 && totalPages > 1 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <button
              onClick={() => setCurrentPage(1)}
              disabled={currentPage === 1}
              style={{
                padding: '5px 9px',
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
                background: currentPage === 1 ? '#f8fafc' : '#ffffff',
                color: currentPage === 1 ? '#94a3b8' : '#1e293b',
                cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                fontWeight: 700,
                fontSize: '0.82rem'
              }}
              title="ទំព័រដំបូង (First Page)"
            >
              ⏮️
            </button>
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              style={{
                padding: '5px 11px',
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
                background: currentPage === 1 ? '#f8fafc' : '#ffffff',
                color: currentPage === 1 ? '#94a3b8' : '#1e293b',
                cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                fontWeight: 700,
                fontSize: '0.82rem'
              }}
              title="ទំព័រមុន (Previous Page)"
            >
              ◀ មុន
            </button>

            {/* Page number buttons */}
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter(p => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 2)
              .map((p, idx, arr) => {
                const prevP = arr[idx - 1];
                const showEllipsis = prevP && p - prevP > 1;
                return (
                  <React.Fragment key={p}>
                    {showEllipsis && <span style={{ padding: '0 4px', color: '#94a3b8' }}>...</span>}
                    <button
                      onClick={() => setCurrentPage(p)}
                      style={{
                        padding: '5px 10px',
                        borderRadius: '8px',
                        border: p === currentPage ? '1px solid #0284c7' : '1px solid #cbd5e1',
                        background: p === currentPage ? '#0284c7' : '#ffffff',
                        color: p === currentPage ? '#ffffff' : '#1e293b',
                        cursor: 'pointer',
                        fontWeight: 700,
                        fontSize: '0.82rem'
                      }}
                    >
                      {p}
                    </button>
                  </React.Fragment>
                );
              })}

            <button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              style={{
                padding: '5px 11px',
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
                background: currentPage === totalPages ? '#f8fafc' : '#ffffff',
                color: currentPage === totalPages ? '#94a3b8' : '#1e293b',
                cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                fontWeight: 700,
                fontSize: '0.82rem'
              }}
              title="ទំព័របន្ទាប់ (Next Page)"
            >
              បន្ទាប់ ▶
            </button>
            <button
              onClick={() => setCurrentPage(totalPages)}
              disabled={currentPage === totalPages}
              style={{
                padding: '5px 9px',
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
                background: currentPage === totalPages ? '#f8fafc' : '#ffffff',
                color: currentPage === totalPages ? '#94a3b8' : '#1e293b',
                cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                fontWeight: 700,
                fontSize: '0.82rem'
              }}
              title="ទំព័រចុងក្រោយ (Last Page)"
            >
              ⏭️
            </button>
          </div>
        )}
      </div>

      {/* Single Cell Edit / Assign Modal */}
      {showCellModal && selectedEmp && (
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
            maxWidth: '520px',
            boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
            overflow: 'hidden'
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
                  ចាត់តាំងវេនការងារ (Assign Shift)
                </h3>
                <div style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: '4px' }}>
                  {selectedEmp.employeeId} • {selectedEmp.firstNameEn} {selectedEmp.lastNameEn} • ថ្ងៃទី: {selectedDateStr}
                </div>
              </div>
              <button
                onClick={() => setShowCellModal(false)}
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

            {/* Modal Form */}
            <form onSubmit={handleSaveCell} style={{ padding: '24px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {/* Shift Type Selection */}
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: 700, fontSize: '0.88rem', color: '#1e293b' }}>
                    ប្រភេទវេនការងារ (Shift Type) *
                  </label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                    {Object.entries(SHIFT_CONFIG).map(([typeKey, conf]) => (
                      <button
                        type="button"
                        key={typeKey}
                        onClick={() => {
                          setCellForm({
                            ...cellForm,
                            shiftType: typeKey,
                            startTime: typeKey === 'MORNING' ? '08:00' : typeKey === 'AFTERNOON' ? '13:00' : typeKey === 'NIGHT' ? '21:00' : '',
                            endTime: typeKey === 'MORNING' ? '17:00' : typeKey === 'AFTERNOON' ? '21:00' : typeKey === 'NIGHT' ? '06:00' : ''
                          });
                        }}
                        style={{
                          padding: '10px 8px',
                          borderRadius: '10px',
                          border: cellForm.shiftType === typeKey ? `2px solid ${conf.text}` : '1px solid #e2e8f0',
                          background: cellForm.shiftType === typeKey ? conf.bg : '#ffffff',
                          color: cellForm.shiftType === typeKey ? conf.text : '#475569',
                          fontWeight: 700,
                          fontSize: '0.82rem',
                          cursor: 'pointer',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          gap: '4px',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        <span style={{ fontSize: '18px' }}>{conf.icon}</span>
                        <span>{conf.labelKh}</span>
                        <span style={{ fontSize: '0.7rem', opacity: 0.8 }}>{conf.labelEn}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Working Hours */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '6px', fontWeight: 700, fontSize: '0.85rem', color: '#1e293b' }}>
                      ម៉ោងចូល (Start Time)
                    </label>
                    <input
                      type="time"
                      value={cellForm.startTime}
                      onChange={e => setCellForm({ ...cellForm, startTime: e.target.value })}
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
                    <label style={{ display: 'block', marginBottom: '6px', fontWeight: 700, fontSize: '0.85rem', color: '#1e293b' }}>
                      ម៉ោងចេញ (End Time)
                    </label>
                    <input
                      type="time"
                      value={cellForm.endTime}
                      onChange={e => setCellForm({ ...cellForm, endTime: e.target.value })}
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

                {/* Notes */}
                <div>
                  <label style={{ display: 'block', marginBottom: '6px', fontWeight: 700, fontSize: '0.85rem', color: '#1e293b' }}>
                    សម្គាល់ (Notes)
                  </label>
                  <input
                    type="text"
                    placeholder="សម្គាល់បន្ថែម ឬមូលហេតុ..."
                    value={cellForm.notes}
                    onChange={e => setCellForm({ ...cellForm, notes: e.target.value })}
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

              {/* Modal Buttons */}
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '24px', gap: '12px' }}>
                <button
                  type="button"
                  onClick={handleDeleteCell}
                  style={{
                    padding: '10px 18px',
                    borderRadius: '8px',
                    border: '1px solid #fee2e2',
                    background: '#fef2f2',
                    color: '#dc2626',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  🗑️ លុបវេន (Clear)
                </button>

                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    type="button"
                    onClick={() => setShowCellModal(false)}
                    style={{
                      padding: '10px 16px',
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
                    style={{
                      padding: '10px 20px',
                      borderRadius: '8px',
                      border: 'none',
                      background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
                      color: '#ffffff',
                      fontWeight: 700,
                      cursor: 'pointer',
                      boxShadow: '0 2px 8px rgba(37, 99, 235, 0.3)'
                    }}
                  >
                    💾 រក្សាទុក (Save)
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Bulk Assign Modal */}
      {showBulkModal && (
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
            maxWidth: '560px',
            boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
            overflow: 'hidden'
          }}>
            <div style={{
              background: 'linear-gradient(135deg, #4f46e5 0%, #3730a3 100%)',
              color: '#ffffff',
              padding: '20px 24px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800 }}>
                  ⚡ ចាត់តាំងវេនជាដុំ (Bulk Shift Assignment)
                </h3>
                <div style={{ fontSize: '0.8rem', color: '#c7d2fe', marginTop: '4px' }}>
                  កំណត់វេនការងារច្រើនថ្ងៃក្នុងពេលតែមួយ • 批量排班
                </div>
              </div>
              <button
                onClick={() => setShowBulkModal(false)}
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

            <form onSubmit={handleBulkAssign} style={{ padding: '24px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {/* Select Employee */}
                <div>
                  <label style={{ display: 'block', marginBottom: '6px', fontWeight: 700, fontSize: '0.88rem', color: '#1e293b' }}>
                    ជ្រើសរើសបុគ្គលិក (Select Employee) *
                  </label>
                  <select
                    value={bulkEmpId}
                    onChange={e => setBulkEmpId(e.target.value)}
                    required
                    style={{
                      width: '100%',
                      padding: '10px',
                      borderRadius: '8px',
                      border: '1px solid #cbd5e1',
                      fontSize: '0.9rem'
                    }}
                  >
                    {employees.map(emp => (
                      <option key={emp.id} value={emp.id}>
                        {emp.employeeId} - {emp.firstNameEn} {emp.lastNameEn} ({emp.department})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Date Range */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '6px', fontWeight: 700, fontSize: '0.85rem', color: '#1e293b' }}>
                      ពីថ្ងៃទី (From Date) *
                    </label>
                    <input
                      type="date"
                      value={bulkStartDate}
                      onChange={e => setBulkStartDate(e.target.value)}
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
                    <label style={{ display: 'block', marginBottom: '6px', fontWeight: 700, fontSize: '0.85rem', color: '#1e293b' }}>
                      ដល់ថ្ងៃទី (To Date) *
                    </label>
                    <input
                      type="date"
                      value={bulkEndDate}
                      onChange={e => setBulkEndDate(e.target.value)}
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
                </div>

                {/* Shift Type */}
                <div>
                  <label style={{ display: 'block', marginBottom: '6px', fontWeight: 700, fontSize: '0.88rem', color: '#1e293b' }}>
                    ប្រភេទវេនការងារ (Shift Type) *
                  </label>
                  <select
                    value={bulkShiftType}
                    onChange={e => setBulkShiftType(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px',
                      borderRadius: '8px',
                      border: '1px solid #cbd5e1',
                      fontSize: '0.9rem'
                    }}
                  >
                    {Object.entries(SHIFT_CONFIG).map(([typeKey, conf]) => (
                      <option key={typeKey} value={typeKey}>
                        {conf.icon} {conf.labelKh} ({conf.labelEn} - {conf.labelZh})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Exclude Sundays checkbox */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <input
                    type="checkbox"
                    id="excludeSundays"
                    checked={bulkExcludeSundays}
                    onChange={e => setBulkExcludeSundays(e.target.checked)}
                    style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                  />
                  <label htmlFor="excludeSundays" style={{ fontSize: '0.88rem', fontWeight: 600, color: '#334155', cursor: 'pointer' }}>
                    លើកលែងថ្ងៃអាទិត្យ (Exclude Sundays - 排除周日)
                  </label>
                </div>
              </div>

              {/* Modal Buttons */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '24px', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => setShowBulkModal(false)}
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
                  style={{
                    padding: '10px 24px',
                    borderRadius: '8px',
                    border: 'none',
                    background: 'linear-gradient(135deg, #4f46e5 0%, #3730a3 100%)',
                    color: '#ffffff',
                    fontWeight: 700,
                    cursor: 'pointer',
                    boxShadow: '0 2px 8px rgba(79, 70, 229, 0.3)'
                  }}
                >
                  ⚡ អនុវត្តចាត់តាំង (Apply Bulk)
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
