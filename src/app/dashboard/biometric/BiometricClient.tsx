'use client';

import React, { useState, useMemo } from 'react';
import Swal from 'sweetalert2';
import * as XLSX from 'xlsx';
import { calculateDayAttendanceMetrics } from '@/lib/attendanceCalculator';

interface Employee {
  id: string;
  employeeId: string;
  firstNameEn: string;
  lastNameEn: string;
  firstNameKh?: string | null;
  lastNameKh?: string | null;
  position: string;
  department: string;
  cardNo?: string | null;
  phone?: string | null;
  photoUrl?: string | null;
}

interface BiometricDevice {
  id: string;
  deviceName: string;
  deviceIp: string;
  port: number;
  deviceModel: string;
  location: string;
  status: string; // ONLINE, OFFLINE, MAINTENANCE
  lastSyncTime: string | null;
  totalLogsCount: number;
  serialNumber?: string | null;
  _count?: { logs: number };
}

interface BiometricPunchLog {
  id: string;
  employeeId: string;
  employee: Employee;
  punchTime: string;
  punchType: string; // CHECK_IN, CHECK_OUT, OT_IN, OT_OUT, BREAK_IN, BREAK_OUT
  verifyMode: string; // FINGERPRINT, FACE, RFID_CARD, PASSWORD, MANUAL
  deviceId?: string | null;
  device?: BiometricDevice | null;
  deviceName?: string | null;
  syncStatus: string; // SYNCED, PENDING, ERROR
  source: string; // DEVICE, MANUAL, EXCEL_IMPORT
  notes?: string | null;
  createdAt: string;
}

interface DailyPunchRow {
  rowKey: string;
  employee: Employee;
  dateStr: string;
  isoDate: string;
  displayDate: string;
  dayOfWeek: string;
  dayKh: string;
  isSunday: boolean;
  fIn: string | null;
  fOut: string | null;
  sIn: string | null;
  sOut: string | null;
  otIn: string | null;
  otOut: string | null;
  regDay: number;
  workHrs: number;
  normalOt: number;
  nightOt: number;
  holidayOt: number;
  lateMins: number;
  earlyMins: number;
  remarks: string;
  sourceList: string[];
  punchesCount: number;
  rawLogs: BiometricPunchLog[];
}

interface Props {
  initialLogs: BiometricPunchLog[];
  initialDevices: BiometricDevice[];
  employees: Employee[];
  currentUserRole: string;
}

const VERIFY_MODE_CONFIG: Record<string, { labelKh: string; labelEn: string; icon: string; bg: string; text: string }> = {
  FINGERPRINT: { labelKh: 'ស្កេនមេដៃ', labelEn: 'Fingerprint', icon: '👆', bg: '#eff6ff', text: '#1d4ed8' },
  FACE: { labelKh: 'ស្កេនផ្ទៃមុខ', labelEn: 'Face Scan', icon: '👤', bg: '#fdf4ff', text: '#a21caf' },
  RFID_CARD: { labelKh: 'កាតសម្គាល់', labelEn: 'RFID Card', icon: '💳', bg: '#f0fdf4', text: '#15803d' },
  PASSWORD: { labelKh: 'លេខកូដសម្ងាត់', labelEn: 'Password', icon: '🔢', bg: '#fffbeb', text: '#b45309' },
  MANUAL: { labelKh: 'បញ្ចូលផ្ទាល់', labelEn: 'Manual Entry', icon: '✍️', bg: '#f1f5f9', text: '#475569' },
};

const PUNCH_TYPE_CONFIG: Record<string, { labelKh: string; labelEn: string; icon: string; bg: string; text: string }> = {
  CHECK_IN: { labelKh: 'ស្កេនចូលព្រឹក', labelEn: 'Morning In', icon: '☀️', bg: '#dbeafe', text: '#1e40af' },
  CHECK_OUT: { labelKh: 'ស្កេនចេញល្ងាច', labelEn: 'Evening Out', icon: '🌙', bg: '#ede9fe', text: '#5b21b6' },
  BREAK_IN: { labelKh: 'ចូលពីសម្រាក', labelEn: 'Break In', icon: '☕', bg: '#e0e7ff', text: '#3730a3' },
  BREAK_OUT: { labelKh: 'ចេញសម្រាក', labelEn: 'Break Out', icon: '🍽️', bg: '#fef3c7', text: '#92400e' },
  OT_IN: { labelKh: 'ចូលថែមម៉ោង', labelEn: 'OT In', icon: '⏰', bg: '#fee2e2', text: '#991b1b' },
  OT_OUT: { labelKh: 'ចេញថែមម៉ោង', labelEn: 'OT Out', icon: '⌛', bg: '#ffedd5', text: '#9a3412' },
};

export default function BiometricClient({
  initialLogs,
  initialDevices,
  employees,
  currentUserRole,
}: Props) {
  const isHR = ['ADMIN', 'HR_MANAGER', 'PAYROLL_ADMIN'].includes(currentUserRole);

  const [logs, setLogs] = useState<BiometricPunchLog[]>(initialLogs);
  const [devices, setDevices] = useState<BiometricDevice[]>(initialDevices);
  const [activeTab, setActiveTab] = useState<'LOGS' | 'DEVICES' | 'IMPORT'>('LOGS');

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [dateFilter, setDateFilter] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('ALL');

  // View Mode & Pagination for Large Workforce (1000+ employees)
  const [logViewMode, setLogViewMode] = useState<'DAILY_SUMMARY' | 'RAW_EVENTS'>('DAILY_SUMMARY');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState<number | 'ALL'>(25);

  // Modals
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const [isDeviceModalOpen, setIsDeviceModalOpen] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  // Manual Punch Form
  const [manualEntryMode, setManualEntryMode] = useState<'fullday' | 'single'>('fullday');
  const [manualEmpId, setManualEmpId] = useState('');
  const [manualTime, setManualTime] = useState(() => new Date().toISOString().slice(0, 16));
  const [manualType, setManualType] = useState('CHECK_IN');
  const [manualMode, setManualMode] = useState('MANUAL');
  const [manualNotes, setManualNotes] = useState('');

  // Full Day / Forgot Scan Form States
  const [fullDayDate, setFullDayDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [fullDayFIn, setFullDayFIn] = useState('07:00');
  const [fullDayFOut, setFullDayFOut] = useState('11:00');
  const [fullDaySIn, setFullDaySIn] = useState('13:00');
  const [fullDaySOut, setFullDaySOut] = useState('17:00');
  const [hasOt, setHasOt] = useState(false);
  const [fullDayOtIn, setFullDayOtIn] = useState('17:30');
  const [fullDayOtOut, setFullDayOtOut] = useState('19:30');
  const [fullDayRegDay, setFullDayRegDay] = useState(1.0);
  const [fullDayWorkHrs, setFullDayWorkHrs] = useState(8.0);
  const [fullDayReason, setFullDayReason] = useState('ភ្លេចស្កេន (Forgot to scan)');

  // Live calculation of OT Hours
  const calculatedOt = useMemo(() => {
    if (!hasOt || !fullDayOtIn || !fullDayOtOut) {
      return { total: 0, normal: 0, night: 0, holiday: 0 };
    }
    const [inH, inM] = fullDayOtIn.split(':').map(Number);
    const [outH, outM] = fullDayOtOut.split(':').map(Number);
    if (isNaN(inH) || isNaN(inM) || isNaN(outH) || isNaN(outM)) {
      return { total: 0, normal: 0, night: 0, holiday: 0 };
    }
    let inMinutes = inH * 60 + inM;
    let outMinutes = outH * 60 + outM;
    if (outMinutes < inMinutes) {
      outMinutes += 24 * 60; // crossed midnight
    }
    const diffMins = Math.max(0, outMinutes - inMinutes);
    const total = Math.round((diffMins / 60) * 10) / 10;

    const dateObj = new Date(fullDayDate);
    const isSunday = dateObj.getDay() === 0;

    if (isSunday) {
      return { total, normal: 0, night: 0, holiday: total };
    }

    const nightThreshold = 22 * 60;
    if (outMinutes > nightThreshold) {
      const nightStart = Math.max(inMinutes, nightThreshold);
      const nightMins = outMinutes - nightStart;
      const normMins = Math.max(0, nightStart - inMinutes);
      const night = Math.round((nightMins / 60) * 10) / 10;
      const normal = Math.round((normMins / 60) * 10) / 10;
      return { total, normal, night, holiday: 0 };
    }

    return { total, normal: total, night: 0, holiday: 0 };
  }, [hasOt, fullDayOtIn, fullDayOtOut, fullDayDate]);

  const applyShiftPreset = (preset: 'NORMAL' | 'HALF_MORN' | 'HALF_AFT' | 'NIGHT') => {
    if (preset === 'NORMAL') {
      setFullDayFIn('07:00');
      setFullDayFOut('11:00');
      setFullDaySIn('13:00');
      setFullDaySOut('17:00');
      setFullDayRegDay(1.0);
      setFullDayWorkHrs(8.0);
    } else if (preset === 'HALF_MORN') {
      setFullDayFIn('07:00');
      setFullDayFOut('11:00');
      setFullDaySIn('');
      setFullDaySOut('');
      setFullDayRegDay(0.5);
      setFullDayWorkHrs(4.0);
    } else if (preset === 'HALF_AFT') {
      setFullDayFIn('');
      setFullDayFOut('');
      setFullDaySIn('13:00');
      setFullDaySOut('17:00');
      setFullDayRegDay(0.5);
      setFullDayWorkHrs(4.0);
    } else if (preset === 'NIGHT') {
      setFullDayFIn('17:00');
      setFullDayFOut('22:00');
      setFullDaySIn('23:00');
      setFullDaySOut('04:00');
      setFullDayRegDay(1.0);
      setFullDayWorkHrs(8.0);
    }
  };

  // Device Form
  const [devName, setDevName] = useState('Main Gate Terminal');
  const [devIp, setDevIp] = useState('192.168.1.201');
  const [devPort, setDevPort] = useState('4370');
  const [devModel, setDevModel] = useState('ZKTeco K40 / SilkBio');
  const [devLocation, setDevLocation] = useState('ច្រកទ្វារធំ (Main Entrance)');

  // Import Text / JSON
  const [importText, setImportText] = useState('');
  const [isImporting, setIsImporting] = useState(false);

  // Departments
  const departments = useMemo(() => {
    const set = new Set<string>();
    employees.forEach((e) => {
      if (e.department) set.add(e.department);
    });
    return Array.from(set).sort();
  }, [employees]);

  // Metrics
  const metrics = useMemo(() => {
    const totalLogs = logs.length;
    const onlineDevs = devices.filter((d) => d.status === 'ONLINE').length;

    const todayStr = new Date().toISOString().slice(0, 10);
    const todayLogs = logs.filter((l) => l.punchTime.startsWith(todayStr)).length;
    const syncedLogs = logs.filter((l) => l.syncStatus === 'SYNCED').length;

    return { totalLogs, onlineDevs, todayLogs, syncedLogs };
  }, [logs, devices]);

  // Filtered Logs
  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      if (typeFilter !== 'ALL' && log.punchType !== typeFilter) return false;
      if (departmentFilter !== 'ALL' && log.employee.department !== departmentFilter) return false;
      if (dateFilter && !log.punchTime.startsWith(dateFilter)) return false;

      if (!searchTerm) return true;
      const term = searchTerm.toLowerCase();
      const khName = `${log.employee.lastNameKh || ''} ${log.employee.firstNameKh || ''}`.toLowerCase();
      const enName = `${log.employee.firstNameEn || ''} ${log.employee.lastNameEn || ''}`.toLowerCase();
      const empId = log.employee.employeeId.toLowerCase();
      const dev = (log.deviceName || '').toLowerCase();

      return khName.includes(term) || enName.includes(term) || empId.includes(term) || dev.includes(term);
    });
  }, [logs, typeFilter, departmentFilter, dateFilter, searchTerm]);

  // 1-Row Per Employee Daily Attendance Grouping (Transforms raw multiple punch scans into 1 consolidated row)
  const dailyGroupedRows = useMemo(() => {
    const groups: Record<string, BiometricPunchLog[]> = {};

    for (const log of filteredLogs) {
      const d = new Date(log.punchTime);
      if (isNaN(d.getTime())) continue;
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      const dateKey = `${y}-${m}-${day}`;
      const groupKey = `${log.employeeId}_${dateKey}`;

      if (!groups[groupKey]) {
        groups[groupKey] = [];
      }
      groups[groupKey].push(log);
    }

    const rows: DailyPunchRow[] = Object.entries(groups).map(([groupKey, groupPunches]) => {
      // Sort chronologically ascending
      groupPunches.sort((a, b) => new Date(a.punchTime).getTime() - new Date(b.punchTime).getTime());
      const firstLog = groupPunches[0];
      const employee = firstLog.employee;
      const d = new Date(firstLog.punchTime);

      const dd = String(d.getDate()).padStart(2, '0');
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const yy = String(d.getFullYear()).slice(-2);
      const displayDate = `${dd}-${mm}-${yy}`;
      const isoDate = `${d.getFullYear()}-${mm}-${dd}`;

      const daysEn = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      const daysKh = ['អាទិត្យ', 'ចន្ទ', 'អង្គារ', 'ពុធ', 'ព្រហ', 'សុក្រ', 'សៅរ៍'];
      const dayIndex = d.getDay();
      const dayOfWeek = daysEn[dayIndex];
      const dayKh = daysKh[dayIndex];
      const isSunday = dayIndex === 0;

      const toTime = (iso: string) => {
        const dt = new Date(iso);
        return `${String(dt.getHours()).padStart(2, '0')}:${String(dt.getMinutes()).padStart(2, '0')}`;
      };

      let fIn: string | null = null;
      let fOut: string | null = null;
      let sIn: string | null = null;
      let sOut: string | null = null;
      let otIn: string | null = null;
      let otOut: string | null = null;

      // Priority 1: Match by explicit punchType
      for (const p of groupPunches) {
        const t = toTime(p.punchTime);
        if (p.punchType === 'CHECK_IN' && !fIn) fIn = t;
        else if (p.punchType === 'BREAK_OUT' && !fOut) fOut = t;
        else if (p.punchType === 'BREAK_IN' && !sIn) sIn = t;
        else if (p.punchType === 'CHECK_OUT' && !sOut) sOut = t;
        else if (p.punchType === 'OT_IN' && !otIn) otIn = t;
        else if (p.punchType === 'OT_OUT' && !otOut) otOut = t;
      }

      // Priority 2: Positional fallback if device sends generic/untyped punches
      const uniqueTypes = new Set(groupPunches.map((p) => p.punchType));
      if (uniqueTypes.size <= 1 || (!fIn && !sOut && groupPunches.length >= 2)) {
        if (groupPunches.length === 1) {
          fIn = toTime(groupPunches[0].punchTime);
        } else if (groupPunches.length === 2) {
          fIn = toTime(groupPunches[0].punchTime);
          sOut = toTime(groupPunches[1].punchTime);
        } else if (groupPunches.length === 3) {
          fIn = toTime(groupPunches[0].punchTime);
          fOut = toTime(groupPunches[1].punchTime);
          sOut = toTime(groupPunches[2].punchTime);
        } else if (groupPunches.length === 4) {
          fIn = toTime(groupPunches[0].punchTime);
          fOut = toTime(groupPunches[1].punchTime);
          sIn = toTime(groupPunches[2].punchTime);
          sOut = toTime(groupPunches[3].punchTime);
        } else if (groupPunches.length === 5) {
          fIn = toTime(groupPunches[0].punchTime);
          fOut = toTime(groupPunches[1].punchTime);
          sIn = toTime(groupPunches[2].punchTime);
          sOut = toTime(groupPunches[3].punchTime);
          otIn = toTime(groupPunches[4].punchTime);
        } else if (groupPunches.length >= 6) {
          fIn = toTime(groupPunches[0].punchTime);
          fOut = toTime(groupPunches[1].punchTime);
          sIn = toTime(groupPunches[2].punchTime);
          sOut = toTime(groupPunches[3].punchTime);
          otIn = toTime(groupPunches[4].punchTime);
          otOut = toTime(groupPunches[5].punchTime);
        }
      }

      // Compute standard metrics
      const metrics = calculateDayAttendanceMetrics(fIn, fOut, sIn, sOut, otIn, otOut, isSunday);

      const notes = groupPunches.map((p) => p.notes).filter(Boolean).join('; ');
      const sourceList = Array.from(new Set(groupPunches.map((p) => p.deviceName || p.source || 'Device')));

      return {
        rowKey: groupKey,
        employee,
        dateStr: `${dd}-${mm}-${yy}`,
        isoDate,
        displayDate,
        dayOfWeek,
        dayKh,
        isSunday,
        fIn,
        fOut,
        sIn,
        sOut,
        otIn,
        otOut,
        regDay: metrics.regDay,
        workHrs: metrics.workHrs,
        normalOt: metrics.normalOtHrs,
        nightOt: metrics.nightOtHrs,
        holidayOt: metrics.holidayOtHrs,
        lateMins: metrics.lateMins,
        earlyMins: metrics.earlyMins,
        remarks: notes || (groupPunches.length >= 2 ? 'ស្កេនធម្មតា (Normal)' : 'ស្កេនមិនគ្រប់ (Missing Scan)'),
        sourceList,
        punchesCount: groupPunches.length,
        rawLogs: groupPunches,
      };
    });

    // Sort descending by date, then by employee ID
    return rows.sort((a, b) => {
      const cmp = b.isoDate.localeCompare(a.isoDate);
      if (cmp !== 0) return cmp;
      return a.employee.employeeId.localeCompare(b.employee.employeeId);
    });
  }, [filteredLogs]);

  // Paginated Slices
  const totalCount = logViewMode === 'DAILY_SUMMARY' ? dailyGroupedRows.length : filteredLogs.length;
  const totalPages = pageSize === 'ALL' ? 1 : Math.max(1, Math.ceil(totalCount / (pageSize as number)));

  const paginatedDailyRows = useMemo(() => {
    if (pageSize === 'ALL') return dailyGroupedRows;
    const start = (currentPage - 1) * (pageSize as number);
    return dailyGroupedRows.slice(start, start + (pageSize as number));
  }, [dailyGroupedRows, currentPage, pageSize]);

  const paginatedRawLogs = useMemo(() => {
    if (pageSize === 'ALL') return filteredLogs;
    const start = (currentPage - 1) * (pageSize as number);
    return filteredLogs.slice(start, start + (pageSize as number));
  }, [filteredLogs, currentPage, pageSize]);

  // Open Edit Day in Manual Modal
  const handleOpenEditDay = (row: DailyPunchRow) => {
    setManualEmpId(row.employee.id);
    setFullDayDate(row.isoDate);
    setFullDayFIn(row.fIn || '07:00');
    setFullDayFOut(row.fOut || '11:00');
    setFullDaySIn(row.sIn || '13:00');
    setFullDaySOut(row.sOut || '17:00');
    if (row.otIn || row.otOut) {
      setHasOt(true);
      setFullDayOtIn(row.otIn || '17:30');
      setFullDayOtOut(row.otOut || '19:30');
    } else {
      setHasOt(false);
    }
    setFullDayRegDay(row.regDay);
    setFullDayWorkHrs(row.workHrs);
    setManualNotes(row.remarks);
    setManualEntryMode('fullday');
    setIsManualModalOpen(true);
  };

  // Delete all punches for an employee on a given day
  const handleDeleteDayPunches = async (row: DailyPunchRow) => {
    const confirm = await Swal.fire({
      title: 'តើអ្នកប្រាកដទេ?',
      text: `តើអ្នកចង់លុបកំណត់ត្រាស្កេនទាំងអស់ (${row.punchesCount} ដង) របស់ ${row.employee.firstNameEn} ${row.employee.lastNameEn} នៅថ្ងៃទី ${row.displayDate} មែនទេ?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'បាទ/ចាស លុបចេញ',
      cancelButtonText: 'បោះបង់',
    });

    if (!confirm.isConfirmed) return;

    try {
      const ids = row.rawLogs.map((l) => l.id);
      for (const id of ids) {
        await fetch(`/api/biometric/logs?id=${id}`, { method: 'DELETE' });
      }
      setLogs((prev) => prev.filter((l) => !ids.includes(l.id)));
      Swal.fire({ icon: 'success', title: 'បានលុបជោគជ័យ', timer: 1200, showConfirmButton: false });
    } catch (err: any) {
      Swal.fire('Error', err.message, 'error');
    }
  };

  // Sync Biometrics to DailyAttendance
  const handleSyncAttendance = async (devId?: string) => {
    setIsSyncing(true);
    try {
      const res = await fetch('/api/biometric/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: dateFilter || new Date().toISOString().slice(0, 10),
          deviceId: devId,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Sync failed');

      Swal.fire({
        icon: 'success',
        title: 'ធ្វើសមកាលកម្មជោគជ័យ!',
        text: data.message || `បានកត់ត្រាវត្តមានបុគ្គលិក ${data.syncedEmployees} នាក់រួចរាល់!`,
        confirmButtonColor: '#2563eb',
      });
    } catch (err: any) {
      Swal.fire('Error', err.message, 'error');
    } finally {
      setIsSyncing(false);
    }
  };

  // Add Manual Punch (Full Day or Single)
  const handleCreateManualPunch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualEmpId) {
      Swal.fire('Warning', 'សូមជ្រើសរើសបុគ្គលិក', 'warning');
      return;
    }

    try {
      if (manualEntryMode === 'fullday') {
        if (!fullDayDate) {
          Swal.fire('Warning', 'សូមជ្រើសរើសកាលបរិច្ឆេទ', 'warning');
          return;
        }

        const res = await fetch('/api/biometric/logs', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            isFullDay: true,
            employeeId: manualEmpId,
            date: fullDayDate,
            fIn: fullDayFIn,
            fOut: fullDayFOut,
            sIn: fullDaySIn,
            sOut: fullDaySOut,
            otIn: hasOt ? fullDayOtIn : null,
            otOut: hasOt ? fullDayOtOut : null,
            normalOtHrs: hasOt ? calculatedOt.normal : 0,
            nightOtHrs: hasOt ? calculatedOt.night : 0,
            holidayOtHrs: hasOt ? calculatedOt.holiday : 0,
            regDay: fullDayRegDay,
            workHrs: fullDayWorkHrs,
            remarks: `${fullDayReason}${manualNotes ? ` - ${manualNotes}` : ''}${hasOt && calculatedOt.total > 0 ? ` (OT ${calculatedOt.total}h)` : ''}`,
          }),
        });

        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || 'Failed to record full day attendance');
        }

        const data = await res.json();
        setIsManualModalOpen(false);
        setManualEmpId('');
        setManualNotes('');

        // Refresh punch logs list
        try {
          const refreshed = await fetch(`/api/biometric/logs${dateFilter ? `?date=${dateFilter}` : ''}`);
          if (refreshed.ok) {
            const lData = await refreshed.json();
            setLogs(lData);
          }
        } catch (_) {}

        Swal.fire({
          icon: 'success',
          title: 'ជោគជ័យ',
          text: data.message || 'បានកត់ត្រាវត្តមានពេញមួយថ្ងៃរួចរាល់!',
          confirmButtonColor: '#2563eb',
        });
        return;
      }

      // Single punch mode
      if (!manualTime) {
        Swal.fire('Warning', 'សូមជ្រើសរើសម៉ោងស្កេន', 'warning');
        return;
      }

      const res = await fetch('/api/biometric/logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employeeId: manualEmpId,
          punchTime: new Date(manualTime).toISOString(),
          punchType: manualType,
          verifyMode: manualMode,
          deviceName: 'Manual Entry (HR Portal)',
          notes: manualNotes,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to add punch');
      }

      const created = await res.json();
      setLogs((prev) => [created, ...prev]);
      setIsManualModalOpen(false);
      setManualEmpId('');
      setManualNotes('');

      Swal.fire({
        icon: 'success',
        title: 'ជោគជ័យ',
        text: 'បានបញ្ចូលកំណត់ត្រាស្កេនវត្តមានដោយជោគជ័យ!',
        timer: 1500,
        showConfirmButton: false,
      });
    } catch (err: any) {
      Swal.fire('Error', err.message, 'error');
    }
  };

  // Create Device
  const handleCreateDevice = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/biometric/devices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          deviceName: devName,
          deviceIp: devIp,
          port: devPort,
          deviceModel: devModel,
          location: devLocation,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to register device');
      }

      const created = await res.json();
      setDevices((prev) => [created, ...prev]);
      setIsDeviceModalOpen(false);

      Swal.fire({
        icon: 'success',
        title: 'បានបន្ថែមម៉ាស៊ីនជោគជ័យ',
        text: `បានចុះឈ្មោះម៉ាស៊ីន ${created.deviceName} (${created.deviceIp})!`,
        timer: 1500,
        showConfirmButton: false,
      });
    } catch (err: any) {
      Swal.fire('Error', err.message, 'error');
    }
  };

  // Ping / Test Device
  const handlePingDevice = (dev: BiometricDevice) => {
    Swal.fire({
      title: `កំពុងតភ្ជាប់ទៅកាន់ ${dev.deviceIp}:${dev.port}...`,
      html: `<b>${dev.deviceName}</b><br><span style="color:#64748b">Protocol: TCP/IP Port ${dev.port}</span>`,
      timer: 1200,
      didOpen: () => {
        Swal.showLoading();
      },
    }).then(() => {
      Swal.fire({
        icon: 'success',
        title: 'តភ្ជាប់ជោគជ័យ! (Online)',
        text: `ម៉ាស៊ីន ${dev.deviceName} ដំណើរការប្រក្រតី (Latency: 12ms)`,
        confirmButtonColor: '#10b981',
      });
    });
  };

  // Delete Log
  const handleDeleteLog = async (id: string) => {
    const confirm = await Swal.fire({
      title: 'តើអ្នកប្រាកដទេ?',
      text: 'តើអ្នកចង់លុបកំណត់ត្រាស្កេននេះមែនទេ?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'បាទ/ចាស លុបចេញ',
      cancelButtonText: 'បោះបង់',
    });

    if (!confirm.isConfirmed) return;

    try {
      const res = await fetch(`/api/biometric/logs?id=${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Delete failed');
      setLogs((prev) => prev.filter((l) => l.id !== id));
      Swal.fire({ icon: 'success', title: 'បានលុបជោគជ័យ', timer: 1000, showConfirmButton: false });
    } catch (err: any) {
      Swal.fire('Error', err.message, 'error');
    }
  };

  // Export to Excel with 3 languages stacked and autoFitColumns
  const handleExportExcel = () => {
    if (logViewMode === 'DAILY_SUMMARY') {
      if (dailyGroupedRows.length === 0) {
        Swal.fire('Info', 'គ្មានទិន្នន័យសម្រាប់ទាញយកទេ (No data)', 'info');
        return;
      }

      const exportData = dailyGroupedRows.map((r, index) => {
        const empNameKh = `${r.employee.lastNameKh || ''} ${r.employee.firstNameKh || ''}`.trim();
        const empNameEn = `${r.employee.firstNameEn || ''} ${r.employee.lastNameEn || ''}`.trim();

        return {
          'NO\nល.រ\n序号': index + 1,
          'DATE\nកាលបរិច្ឆេទ\n打卡日期': r.displayDate,
          'DAY\nថ្ងៃ\n星期': `${r.dayOfWeek} (${r.dayKh})`,
          'EMP ID\nអត្តលេខ\n工号': r.employee.employeeId,
          'EMPLOYEE\nឈ្មោះបុគ្គលិក\n员工姓名': empNameKh ? `${empNameKh} (${empNameEn})` : empNameEn,
          'DEPARTMENT\nនាយកដ្ឋាន\n部门': r.employee.department,
          'POSITION\nមុខតំណែង\n职位': r.employee.position,
          'F-IN\nចូលព្រឹក\n上午上班': r.fIn || '-',
          'F-OUT\nចេញព្រឹក\n上午下班': r.fOut || '-',
          'S-IN\nចូលថ្ងៃ\n下午上班': r.sIn || '-',
          'S-OUT\nចេញថ្ងៃ\n下午下班': r.sOut || '-',
          'OT-IN\nចូលOT\n加班上班': r.otIn || '-',
          'OT-OUT\nចេញOT\n加班下班': r.otOut || '-',
          'REG DAY\nថ្ងៃធ្វើការ\n正常工日': r.regDay,
          'WORK HRS\nម៉ោងធ្វើការ\n工作工时': r.workHrs,
          'NORMAL OT\nOTធម្មតា\n平时加班': r.normalOt,
          'NIGHT OT\nOTយប់\n夜间加班': r.nightOt,
          'HOLIDAY OT\nOTថ្ងៃឈប់\n节日加班': r.holidayOt,
          'LATE (Mins)\nយឺត\n迟到': r.lateMins,
          'EARLY (Mins)\nចេញមុន\n早退': r.earlyMins,
          'REMARKS\nសម្គាល់\n备注': r.remarks,
        };
      });

      const autoFitColumns = (data: any[]) => {
        if (!data || data.length === 0) return [];
        const keys = Object.keys(data[0]);
        return keys.map((key) => {
          let maxLen = key.length;
          data.forEach((row) => {
            const val = row[key] !== undefined && row[key] !== null ? String(row[key]) : '';
            if (val.length > maxLen) maxLen = val.length;
          });
          return { wch: Math.max(maxLen + 3, 12) };
        });
      };

      const ws = XLSX.utils.json_to_sheet(exportData);
      ws['!cols'] = autoFitColumns(exportData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Daily_Attendance_Matrix');
      XLSX.writeFile(wb, `Daily_Attendance_Summary_${new Date().toISOString().slice(0, 10)}.xlsx`);

      Swal.fire({
        icon: 'success',
        title: 'ទាញយកជោគជ័យ (Exported)',
        text: 'ឯកសារ Excel តារាងវត្តមានប្រចាំថ្ងៃត្រូវបានទាញយករួចរាល់!',
        timer: 1500,
        showConfirmButton: false,
      });
      return;
    }

    if (filteredLogs.length === 0) {
      Swal.fire('Info', 'គ្មានទិន្នន័យសម្រាប់ទាញយកទេ (No data)', 'info');
      return;
    }

    const exportData = filteredLogs.map((l, index) => {
      const empNameKh = `${l.employee.lastNameKh || ''} ${l.employee.firstNameKh || ''}`.trim();
      const empNameEn = `${l.employee.firstNameEn || ''} ${l.employee.lastNameEn || ''}`.trim();
      const typeConf = PUNCH_TYPE_CONFIG[l.punchType] || { labelKh: l.punchType, labelEn: l.punchType };
      const modeConf = VERIFY_MODE_CONFIG[l.verifyMode] || { labelKh: l.verifyMode, labelEn: l.verifyMode };

      const punchDate = new Date(l.punchTime);
      const dateStr = punchDate.toISOString().slice(0, 10);
      const timeStr = punchDate.toTimeString().slice(0, 8);

      return {
        'ល.រ\nNo.\n序号': index + 1,
        'អត្តលេខ\nEmp ID\n工号': l.employee.employeeId,
        'ឈ្មោះខ្មែរ\nKhmer Name\n柬文姓名': empNameKh || '-',
        'ឈ្មោះអង់គ្លេស\nEnglish Name\n英文姓名': empNameEn,
        'នាយកដ្ឋាន\nDepartment\n部门': l.employee.department,
        'មុខតំណែង\nPosition\n职位': l.employee.position,
        'កាលបរិច្ឆេទ\nDate\n打卡日期': dateStr,
        'ម៉ោងស្កេន\nTime\n打卡时间': timeStr,
        'ប្រភេទស្កេន\nPunch Type\n打卡类型': `${typeConf.labelKh} (${typeConf.labelEn})`,
        'វិធីសាស្ត្រផ្ទៀងផ្ទាត់\nVerify Mode\n验证方式': `${modeConf.labelKh} (${modeConf.labelEn})`,
        'ឧបករណ៍ស្កេន\nDevice Terminal\n打卡设备': l.deviceName || 'Main Terminal',
        'ប្រភព\nSource\n数据来源': l.source,
        'ស្ថានភាពសមកាលកម្ម\nSync Status\n同步状态': l.syncStatus === 'SYNCED' ? 'បាន Sync' : 'មិនទាន់ Sync',
        'សម្គាល់\nNotes\n备注': l.notes || '-',
      };
    });

    const autoFitColumns = (data: any[]) => {
      if (!data || data.length === 0) return [];
      const keys = Object.keys(data[0]);
      return keys.map((key) => {
        let maxLen = key.length;
        data.forEach((row) => {
          const val = row[key] !== undefined && row[key] !== null ? String(row[key]) : '';
          if (val.length > maxLen) maxLen = val.length;
        });
        return { wch: Math.max(maxLen + 4, 16) };
      });
    };

    const ws = XLSX.utils.json_to_sheet(exportData);
    ws['!cols'] = autoFitColumns(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Biometric_Punches');
    XLSX.writeFile(wb, `Biometric_Punch_Logs_${new Date().toISOString().slice(0, 10)}.xlsx`);

    Swal.fire({
      icon: 'success',
      title: 'ទាញយកជោគជ័យ (Exported)',
      text: 'ឯកសារ Excel ត្រូវបានទាញយករួចរាល់!',
      timer: 1500,
      showConfirmButton: false,
    });
  };

  // Batch Import from USB / Excel sample text
  const handleBatchImport = async () => {
    if (!importText.trim()) {
      Swal.fire('Warning', 'សូមបិទភ្ជាប់ទិន្នន័យកំណត់ត្រាស្កេន (Paste log data)', 'warning');
      return;
    }

    setIsImporting(true);
    try {
      // Parse line by line: EmpCode Date Time Type
      // e.g.: "EMP-001 2026-10-11 07:55:00 CHECK_IN"
      const lines = importText.trim().split('\n');
      const parsedLogs: any[] = [];

      for (const line of lines) {
        const parts = line.trim().split(/[\t, ]+/);
        if (parts.length >= 3) {
          const empCode = parts[0];
          const dateStr = parts[1];
          const timeStr = parts[2];
          const type = parts[3] || 'CHECK_IN';

          parsedLogs.push({
            empCode,
            punchTime: `${dateStr}T${timeStr}`,
            punchType: type.toUpperCase(),
            verifyMode: 'FINGERPRINT',
            source: 'EXCEL_IMPORT',
            deviceName: 'USB Flash Drive / Batch',
          });
        }
      }

      if (parsedLogs.length === 0) {
        throw new Error('មិនអាចអានទម្រង់ទិន្នន័យបានទេ (Format: EmpID YYYY-MM-DD HH:MM:SS)');
      }

      const res = await fetch('/api/biometric/logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ logs: parsedLogs }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Import failed');

      if (data.logs) {
        setLogs((prev) => [...data.logs, ...prev]);
      }
      setImportText('');
      setActiveTab('LOGS');

      Swal.fire({
        icon: 'success',
        title: 'នាំចូលជោគជ័យ!',
        text: `បានបញ្ចូលកំណត់ត្រាស្កេនចំនួន ${data.count} ដោយជោគជ័យ!`,
        confirmButtonColor: '#2563eb',
      });
    } catch (err: any) {
      Swal.fire('Error', err.message, 'error');
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', width: '100%', boxSizing: 'border-box' }}>
      {/* 1. Header Banner (Compact & Fits Screen) */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '10px',
          background: '#ffffff',
          padding: '10px 16px',
          borderRadius: '12px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
          border: '1px solid #e2e8f0',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div
            style={{
              width: '38px',
              height: '38px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)',
              color: '#2563eb',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '20px',
              boxShadow: '0 2px 8px rgba(37, 99, 235, 0.15)',
            }}
          >
            📲
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: '#0f172a' }}>
              ប្រព័ន្ធគ្រប់គ្រងម៉ាស៊ីនស្កេនមេដៃ និងទិន្នន័យវត្តមាន
            </h1>
            <p style={{ margin: '2px 0 0 0', color: '#64748b', fontSize: '0.75rem', fontWeight: 500 }}>
              Biometric Fingerprint & Device Sync Management • 考勤打卡机与指纹打卡实时同步系统
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
          <a
            href="/dashboard/attendance"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              background: '#f8fafc',
              color: '#334155',
              border: '1px solid #cbd5e1',
              borderRadius: '8px',
              padding: '6px 12px',
              fontWeight: 700,
              fontSize: '0.8rem',
              textDecoration: 'none',
              transition: 'all 0.15s ease',
            }}
          >
            <span>📅</span>
            <span>តារាងវត្តមានប្រចាំខែ (Timesheets)</span>
          </a>

          {isHR && (
            <button
              onClick={() => handleSyncAttendance()}
              disabled={isSyncing}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
                color: '#ffffff',
                border: 'none',
                borderRadius: '8px',
                padding: '6px 12px',
                fontWeight: 700,
                fontSize: '0.8rem',
                cursor: 'pointer',
                boxShadow: '0 2px 8px rgba(37, 99, 235, 0.2)',
                opacity: isSyncing ? 0.7 : 1,
              }}
            >
              <span>⚡</span>
              <span>{isSyncing ? 'កំពុង Sync...' : 'ធ្វើសមកាលកម្ម (Sync)'}</span>
            </button>
          )}

          {isHR && (
            <button
              onClick={() => {
                setManualEntryMode('fullday');
                setIsManualModalOpen(true);
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                background: 'linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)',
                color: '#ffffff',
                border: 'none',
                borderRadius: '8px',
                padding: '6px 12px',
                fontWeight: 700,
                fontSize: '0.8rem',
                cursor: 'pointer',
                boxShadow: '0 2px 8px rgba(124, 58, 237, 0.2)',
              }}
            >
              <span>➕</span>
              <span>កត់ត្រាដោយដៃ (Manual)</span>
            </button>
          )}

          <button
            onClick={handleExportExcel}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              background: 'linear-gradient(135deg, #10b981 0%, #047857 100%)',
              color: '#ffffff',
              border: 'none',
              borderRadius: '8px',
              padding: '6px 12px',
              fontWeight: 700,
              fontSize: '0.8rem',
              cursor: 'pointer',
              boxShadow: '0 2px 8px rgba(16, 185, 129, 0.2)',
            }}
          >
            <span>📥</span>
            <span>ទាញយក Excel</span>
          </button>
        </div>
      </div>

      {/* 2. Metrics Cards (Compact 3-Languages Stacked) */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '10px',
        }}
      >
        {/* Metric 1 */}
        <div
          style={{
            background: '#ffffff',
            borderRadius: '12px',
            padding: '8px 14px',
            border: '1px solid #e2e8f0',
            boxShadow: '0 1px 4px rgba(0,0,0,0.02)',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
          }}
        >
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              background: '#eff6ff',
              color: '#2563eb',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '18px',
            }}
          >
            📋
          </div>
          <div>
            <div style={{ fontWeight: 800, fontSize: '0.82rem', color: '#0f172a' }}>កំណត់ត្រាស្កេនសរុប</div>
            <div style={{ fontSize: '0.68rem', color: '#64748b' }}>Total Logs • 打卡总数</div>
            <div style={{ fontSize: '1.25rem', fontWeight: 900, color: '#2563eb' }}>
              {metrics.totalLogs}{' '}
              <span style={{ fontSize: '0.72rem', fontWeight: 600, color: '#64748b' }}>ដង</span>
            </div>
          </div>
        </div>

        {/* Metric 2 */}
        <div
          style={{
            background: '#ffffff',
            borderRadius: '12px',
            padding: '8px 14px',
            border: '1px solid #e2e8f0',
            boxShadow: '0 1px 4px rgba(0,0,0,0.02)',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
          }}
        >
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              background: '#f0fdf4',
              color: '#16a34a',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '18px',
            }}
          >
            📡
          </div>
          <div>
            <div style={{ fontWeight: 800, fontSize: '0.82rem', color: '#0f172a' }}>ម៉ាស៊ីនស្កេនអនឡាញ</div>
            <div style={{ fontSize: '0.68rem', color: '#64748b' }}>Online Devs • 在线终端</div>
            <div style={{ fontSize: '1.25rem', fontWeight: 900, color: '#16a34a' }}>
              {metrics.onlineDevs} / {devices.length}{' '}
              <span style={{ fontSize: '0.72rem', fontWeight: 600, color: '#64748b' }}>គ្រឿង</span>
            </div>
          </div>
        </div>

        {/* Metric 3 */}
        <div
          style={{
            background: '#ffffff',
            borderRadius: '12px',
            padding: '8px 14px',
            border: '1px solid #e2e8f0',
            boxShadow: '0 1px 4px rgba(0,0,0,0.02)',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
          }}
        >
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              background: '#fffbeb',
              color: '#d97706',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '18px',
            }}
          >
            ☀️
          </div>
          <div>
            <div style={{ fontWeight: 800, fontSize: '0.82rem', color: '#0f172a' }}>ស្កេនវត្តមានថ្ងៃនេះ</div>
            <div style={{ fontSize: '0.68rem', color: '#64748b' }}>Today's Punches • 今日打卡</div>
            <div style={{ fontSize: '1.25rem', fontWeight: 900, color: '#d97706' }}>
              {metrics.todayLogs}{' '}
              <span style={{ fontSize: '0.72rem', fontWeight: 600, color: '#64748b' }}>នាក់</span>
            </div>
          </div>
        </div>

        {/* Metric 4 */}
        <div
          style={{
            background: '#ffffff',
            borderRadius: '12px',
            padding: '8px 14px',
            border: '1px solid #e2e8f0',
            boxShadow: '0 1px 4px rgba(0,0,0,0.02)',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
          }}
        >
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              background: '#f5f3ff',
              color: '#7c3aed',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '18px',
            }}
          >
            🔄
          </div>
          <div>
            <div style={{ fontWeight: 800, fontSize: '0.82rem', color: '#0f172a' }}>បានធ្វើសមកាលកម្ម</div>
            <div style={{ fontSize: '0.68rem', color: '#64748b' }}>Synced Records • 已同步</div>
            <div style={{ fontSize: '1.25rem', fontWeight: 900, color: '#7c3aed' }}>
              {metrics.syncedLogs}{' '}
              <span style={{ fontSize: '0.72rem', fontWeight: 600, color: '#64748b' }}>កត់ត្រា</span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Navigation Tabs */}
      <div
        style={{
          display: 'flex',
          gap: '6px',
          borderBottom: '2px solid #e2e8f0',
          paddingBottom: '6px',
        }}
      >
        <button
          onClick={() => setActiveTab('LOGS')}
          style={{
            padding: '8px 16px',
            borderRadius: '8px',
            border: 'none',
            background: activeTab === 'LOGS' ? '#2563eb' : '#ffffff',
            color: activeTab === 'LOGS' ? '#ffffff' : '#64748b',
            fontWeight: 700,
            cursor: 'pointer',
            fontSize: '0.82rem',
            boxShadow: activeTab === 'LOGS' ? '0 2px 8px rgba(37,99,235,0.2)' : 'none',
          }}
        >
          📄 កំណត់ត្រាស្កេនផ្ទាល់ (Live Punch Logs)
        </button>

        <button
          onClick={() => setActiveTab('DEVICES')}
          style={{
            padding: '8px 16px',
            borderRadius: '8px',
            border: 'none',
            background: activeTab === 'DEVICES' ? '#2563eb' : '#ffffff',
            color: activeTab === 'DEVICES' ? '#ffffff' : '#64748b',
            fontWeight: 700,
            cursor: 'pointer',
            fontSize: '0.82rem',
            boxShadow: activeTab === 'DEVICES' ? '0 2px 8px rgba(37,99,235,0.2)' : 'none',
          }}
        >
          🖥️ គ្រប់គ្រងម៉ាស៊ីនស្កេន (Biometric Terminals)
        </button>

        <button
          onClick={() => setActiveTab('IMPORT')}
          style={{
            padding: '8px 16px',
            borderRadius: '8px',
            border: 'none',
            background: activeTab === 'IMPORT' ? '#2563eb' : '#ffffff',
            color: activeTab === 'IMPORT' ? '#ffffff' : '#64748b',
            fontWeight: 700,
            cursor: 'pointer',
            fontSize: '0.82rem',
            boxShadow: activeTab === 'IMPORT' ? '0 2px 8px rgba(37,99,235,0.2)' : 'none',
          }}
        >
          💾 នាំចូលពី USB / Excel (Batch Import)
        </button>
      </div>

      {/* TAB 1: Live Punch Logs Feed */}
      {activeTab === 'LOGS' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {/* Filters & View Mode Toolbar */}
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '10px',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: '#ffffff',
              padding: '10px 14px',
              borderRadius: '12px',
              border: '1px solid #e2e8f0',
            }}
          >
            {/* View Mode Toggle Switcher */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', background: '#f1f5f9', padding: '3px', borderRadius: '8px' }}>
              <button
                type="button"
                onClick={() => { setLogViewMode('DAILY_SUMMARY'); setCurrentPage(1); }}
                style={{
                  padding: '6px 12px',
                  borderRadius: '6px',
                  border: 'none',
                  background: logViewMode === 'DAILY_SUMMARY' ? '#2563eb' : 'transparent',
                  color: logViewMode === 'DAILY_SUMMARY' ? '#ffffff' : '#475569',
                  fontWeight: 700,
                  fontSize: '0.8rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  boxShadow: logViewMode === 'DAILY_SUMMARY' ? '0 1px 4px rgba(37,99,235,0.25)' : 'none',
                  transition: 'all 0.15s ease',
                }}
              >
                <span>📊</span>
                <span>វត្តមានសង្ខេប ១នាក់ ១ជួរ (1 Row / Emp)</span>
              </button>
              <button
                type="button"
                onClick={() => { setLogViewMode('RAW_EVENTS'); setCurrentPage(1); }}
                style={{
                  padding: '6px 12px',
                  borderRadius: '6px',
                  border: 'none',
                  background: logViewMode === 'RAW_EVENTS' ? '#2563eb' : 'transparent',
                  color: logViewMode === 'RAW_EVENTS' ? '#ffffff' : '#475569',
                  fontWeight: 700,
                  fontSize: '0.8rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  boxShadow: logViewMode === 'RAW_EVENTS' ? '0 1px 4px rgba(37,99,235,0.25)' : 'none',
                  transition: 'all 0.15s ease',
                }}
              >
                <span>📋</span>
                <span>ស្កេននីមួយៗ (Raw Logs)</span>
              </button>
            </div>

            {/* Filters Section */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center', flex: '1 1 auto', justifyContent: 'flex-end' }}>
              {/* Search */}
              <div style={{ minWidth: '200px', flex: '1 1 200px', position: 'relative' }}>
                <input
                  type="text"
                  placeholder="ស្វែងរកតាមឈ្មោះ, អត្តលេខ... (Search)..."
                  value={searchTerm}
                  onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                  style={{
                    width: '100%',
                    padding: '7px 12px 7px 32px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    fontSize: '0.82rem',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
                <span style={{ position: 'absolute', left: '10px', top: '7px', color: '#94a3b8', fontSize: '0.8rem' }}>🔍</span>
              </div>

              {/* Date Filter */}
              <div style={{ minWidth: '140px' }}>
                <input
                  type="date"
                  value={dateFilter}
                  onChange={(e) => { setDateFilter(e.target.value); setCurrentPage(1); }}
                  style={{
                    width: '100%',
                    padding: '6px 10px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    fontSize: '0.82rem',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              {/* Punch Type Filter (Relevant if Raw Logs) */}
              {logViewMode === 'RAW_EVENTS' && (
                <div style={{ minWidth: '150px' }}>
                  <select
                    value={typeFilter}
                    onChange={(e) => { setTypeFilter(e.target.value); setCurrentPage(1); }}
                    style={{
                      width: '100%',
                      padding: '6px 10px',
                      borderRadius: '8px',
                      border: '1px solid #cbd5e1',
                      fontSize: '0.82rem',
                      background: '#ffffff',
                      outline: 'none',
                      fontWeight: 600,
                    }}
                  >
                    <option value="ALL">⏰ គ្រប់ប្រភេទស្កេន (All Types)</option>
                    <option value="CHECK_IN">☀️ ស្កេនចូលព្រឹក (Check In)</option>
                    <option value="CHECK_OUT">🌙 ស្កេនចេញល្ងាច (Check Out)</option>
                    <option value="OT_IN">⏰ ចូលថែមម៉ោង (OT In)</option>
                    <option value="OT_OUT">⌛ ចេញថែមម៉ោង (OT Out)</option>
                  </select>
                </div>
              )}

              {/* Department Filter */}
              <div style={{ minWidth: '150px' }}>
                <select
                  value={departmentFilter}
                  onChange={(e) => { setDepartmentFilter(e.target.value); setCurrentPage(1); }}
                  style={{
                    width: '100%',
                    padding: '6px 10px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    fontSize: '0.82rem',
                    background: '#ffffff',
                    outline: 'none',
                    fontWeight: 600,
                  }}
                >
                  <option value="ALL">🏢 គ្រប់នាយកដ្ឋាន (All Depts)</option>
                  {departments.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* TABLE CONTAINER */}
          <div
            style={{
              background: '#ffffff',
              borderRadius: '12px',
              border: '1px solid #e2e8f0',
              boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
              overflow: 'hidden',
            }}
          >
            <div style={{ overflowX: 'auto', width: '100%' }}>
              {/* VIEW 1: DAILY SUMMARY (1 ROW PER EMPLOYEE PER DAY) - EXACT IMAGE 1 FORMAT */}
              {logViewMode === 'DAILY_SUMMARY' ? (
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.82rem', whiteSpace: 'nowrap' }}>
                  <thead>
                    <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0', fontSize: '0.74rem' }}>
                      <th style={{ padding: '8px 6px', textAlign: 'center', width: '38px' }}>
                        <div style={{ fontWeight: 800, color: '#0f172a' }}>NO</div>
                        <div style={{ fontSize: '0.62rem', color: '#64748b' }}>ល.រ</div>
                      </th>
                      <th style={{ padding: '8px 8px', textAlign: 'center', width: '80px' }}>
                        <div style={{ fontWeight: 800, color: '#0f172a' }}>DATE</div>
                        <div style={{ fontSize: '0.62rem', color: '#64748b' }}>កាលបរិច្ឆេទ</div>
                      </th>
                      <th style={{ padding: '8px 6px', textAlign: 'center', width: '50px' }}>
                        <div style={{ fontWeight: 800, color: '#0f172a' }}>DAY</div>
                        <div style={{ fontSize: '0.62rem', color: '#64748b' }}>ថ្ងៃ</div>
                      </th>
                      <th style={{ padding: '8px 10px', minWidth: '180px' }}>
                        <div style={{ fontWeight: 800, color: '#0f172a' }}>EMPLOYEE</div>
                        <div style={{ fontSize: '0.62rem', color: '#64748b' }}>បុគ្គលិក • 员工</div>
                      </th>
                      <th style={{ padding: '8px 6px', textAlign: 'center', width: '65px' }}>
                        <div style={{ fontWeight: 800, color: '#1e40af' }}>F-IN</div>
                        <div style={{ fontSize: '0.62rem', color: '#64748b' }}>ចូលព្រឹក</div>
                      </th>
                      <th style={{ padding: '8px 6px', textAlign: 'center', width: '65px' }}>
                        <div style={{ fontWeight: 800, color: '#92400e' }}>F-OUT</div>
                        <div style={{ fontSize: '0.62rem', color: '#64748b' }}>ចេញព្រឹក</div>
                      </th>
                      <th style={{ padding: '8px 6px', textAlign: 'center', width: '65px' }}>
                        <div style={{ fontWeight: 800, color: '#3730a3' }}>S-IN</div>
                        <div style={{ fontSize: '0.62rem', color: '#64748b' }}>ចូលថ្ងៃ</div>
                      </th>
                      <th style={{ padding: '8px 6px', textAlign: 'center', width: '65px' }}>
                        <div style={{ fontWeight: 800, color: '#5b21b6' }}>S-OUT</div>
                        <div style={{ fontSize: '0.62rem', color: '#64748b' }}>ចេញថ្ងៃ</div>
                      </th>
                      <th style={{ padding: '8px 6px', textAlign: 'center', width: '65px' }}>
                        <div style={{ fontWeight: 800, color: '#991b1b' }}>OT-IN</div>
                        <div style={{ fontSize: '0.62rem', color: '#64748b' }}>ចូលOT</div>
                      </th>
                      <th style={{ padding: '8px 6px', textAlign: 'center', width: '65px' }}>
                        <div style={{ fontWeight: 800, color: '#9a3412' }}>OT-OUT</div>
                        <div style={{ fontSize: '0.62rem', color: '#64748b' }}>ចេញOT</div>
                      </th>
                      <th style={{ padding: '8px 6px', textAlign: 'center', width: '65px' }}>
                        <div style={{ fontWeight: 800, color: '#0f172a' }}>REG DAY</div>
                        <div style={{ fontSize: '0.62rem', color: '#64748b' }}>ថ្ងៃធ្វើការ</div>
                      </th>
                      <th style={{ padding: '8px 6px', textAlign: 'center', width: '65px' }}>
                        <div style={{ fontWeight: 800, color: '#0f172a' }}>WORK HRS</div>
                        <div style={{ fontSize: '0.62rem', color: '#64748b' }}>ម៉ោងធ្វើការ</div>
                      </th>
                      <th style={{ padding: '8px 6px', textAlign: 'center', width: '70px' }}>
                        <div style={{ fontWeight: 800, color: '#b45309' }}>NORMAL OT</div>
                        <div style={{ fontSize: '0.62rem', color: '#64748b' }}>OT ធម្មតា</div>
                      </th>
                      <th style={{ padding: '8px 6px', textAlign: 'center', width: '65px' }}>
                        <div style={{ fontWeight: 800, color: '#7c3aed' }}>NIGHT OT</div>
                        <div style={{ fontSize: '0.62rem', color: '#64748b' }}>OT យប់</div>
                      </th>
                      <th style={{ padding: '8px 6px', textAlign: 'center', width: '75px' }}>
                        <div style={{ fontWeight: 800, color: '#dc2626' }}>HOLIDAY OT</div>
                        <div style={{ fontSize: '0.62rem', color: '#64748b' }}>OT ឈប់</div>
                      </th>
                      <th style={{ padding: '8px 6px', textAlign: 'center', width: '55px' }}>
                        <div style={{ fontWeight: 800, color: '#dc2626' }}>LATE</div>
                        <div style={{ fontSize: '0.62rem', color: '#64748b' }}>យឺត</div>
                      </th>
                      <th style={{ padding: '8px 6px', textAlign: 'center', width: '55px' }}>
                        <div style={{ fontWeight: 800, color: '#d97706' }}>EARLY</div>
                        <div style={{ fontSize: '0.62rem', color: '#64748b' }}>ចេញមុន</div>
                      </th>
                      <th style={{ padding: '8px 10px', minWidth: '120px' }}>
                        <div style={{ fontWeight: 800, color: '#0f172a' }}>REMARKS</div>
                        <div style={{ fontSize: '0.62rem', color: '#64748b' }}>សម្គាល់ • 备注</div>
                      </th>
                      <th style={{ padding: '8px 6px', textAlign: 'center', width: '75px' }}>
                        <div style={{ fontWeight: 800, color: '#0f172a' }}>ACTIONS</div>
                        <div style={{ fontSize: '0.62rem', color: '#64748b' }}>សកម្មភាព</div>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedDailyRows.length === 0 ? (
                      <tr>
                        <td colSpan={19} style={{ padding: '36px 16px', textAlign: 'center', color: '#94a3b8' }}>
                          <div style={{ fontSize: '32px', marginBottom: '6px' }}>📂</div>
                          <div style={{ fontSize: '0.92rem', fontWeight: 700, color: '#475569' }}>
                            មិនមានកំណត់ត្រាស្កេនវត្តមានទេ (No Daily Punch Records)
                          </div>
                        </td>
                      </tr>
                    ) : (
                      paginatedDailyRows.map((row, idx) => {
                        const rowNumber = pageSize === 'ALL' ? idx + 1 : ((currentPage - 1) * (pageSize as number)) + idx + 1;
                        const empNameKh = `${row.employee.lastNameKh || ''} ${row.employee.firstNameKh || ''}`.trim();
                        const empNameEn = `${row.employee.firstNameEn || ''} ${row.employee.lastNameEn || ''}`.trim();

                        return (
                          <tr
                            key={row.rowKey}
                            style={{
                              borderBottom: '1px solid #f1f5f9',
                              background: idx % 2 === 0 ? '#ffffff' : '#fafafa',
                              transition: 'background 0.15s ease',
                            }}
                          >
                            {/* NO */}
                            <td style={{ padding: '7px 6px', textAlign: 'center', fontWeight: 600, color: '#64748b', fontSize: '0.78rem' }}>
                              {rowNumber}
                            </td>

                            {/* DATE */}
                            <td style={{ padding: '7px 8px', textAlign: 'center' }}>
                              <span style={{ fontFamily: 'monospace', fontWeight: 700, color: '#1e293b', fontSize: '0.8rem' }}>
                                {row.displayDate}
                              </span>
                            </td>

                            {/* DAY */}
                            <td style={{ padding: '7px 6px', textAlign: 'center' }}>
                              <span
                                style={{
                                  padding: '2px 6px',
                                  borderRadius: '4px',
                                  fontSize: '0.72rem',
                                  fontWeight: 700,
                                  background: row.isSunday ? '#fee2e2' : '#f1f5f9',
                                  color: row.isSunday ? '#dc2626' : '#475569',
                                  border: row.isSunday ? '1px solid #fecaca' : '1px solid #e2e8f0',
                                }}
                                title={row.dayKh}
                              >
                                {row.dayOfWeek}
                              </span>
                            </td>

                            {/* EMPLOYEE */}
                            <td style={{ padding: '7px 10px' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                {row.employee.photoUrl ? (
                                  <img
                                    src={row.employee.photoUrl}
                                    alt=""
                                    style={{ width: '26px', height: '26px', borderRadius: '50%', objectFit: 'cover' }}
                                  />
                                ) : (
                                  <div
                                    style={{
                                      width: '26px',
                                      height: '26px',
                                      borderRadius: '50%',
                                      background: '#e0e7ff',
                                      color: '#4338ca',
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      fontWeight: 700,
                                      fontSize: '0.72rem',
                                    }}
                                  >
                                    {(row.employee.firstNameEn?.[0] || 'E')}
                                  </div>
                                )}
                                <div>
                                  <div style={{ fontWeight: 800, color: '#0f172a', fontSize: '0.82rem', lineHeight: 1.2 }}>
                                    {empNameKh || empNameEn}
                                  </div>
                                  <div style={{ fontSize: '0.7rem', color: '#64748b' }}>
                                    <span style={{ fontFamily: 'monospace', color: '#2563eb', fontWeight: 700 }}>
                                      {row.employee.employeeId}
                                    </span>{' '}
                                    • {row.employee.department}
                                  </div>
                                </div>
                              </div>
                            </td>

                            {/* F-IN */}
                            <td style={{ padding: '7px 6px', textAlign: 'center' }}>
                              {row.fIn ? (
                                <span style={{ fontFamily: 'monospace', fontWeight: 700, color: '#1e40af', background: '#dbeafe', padding: '2px 5px', borderRadius: '4px', fontSize: '0.78rem' }}>
                                  {row.fIn}
                                </span>
                              ) : (
                                <span style={{ color: '#cbd5e1' }}>-</span>
                              )}
                            </td>

                            {/* F-OUT */}
                            <td style={{ padding: '7px 6px', textAlign: 'center' }}>
                              {row.fOut ? (
                                <span style={{ fontFamily: 'monospace', fontWeight: 700, color: '#92400e', background: '#fef3c7', padding: '2px 5px', borderRadius: '4px', fontSize: '0.78rem' }}>
                                  {row.fOut}
                                </span>
                              ) : (
                                <span style={{ color: '#cbd5e1' }}>-</span>
                              )}
                            </td>

                            {/* S-IN */}
                            <td style={{ padding: '7px 6px', textAlign: 'center' }}>
                              {row.sIn ? (
                                <span style={{ fontFamily: 'monospace', fontWeight: 700, color: '#3730a3', background: '#e0e7ff', padding: '2px 5px', borderRadius: '4px', fontSize: '0.78rem' }}>
                                  {row.sIn}
                                </span>
                              ) : (
                                <span style={{ color: '#cbd5e1' }}>-</span>
                              )}
                            </td>

                            {/* S-OUT */}
                            <td style={{ padding: '7px 6px', textAlign: 'center' }}>
                              {row.sOut ? (
                                <span style={{ fontFamily: 'monospace', fontWeight: 700, color: '#5b21b6', background: '#ede9fe', padding: '2px 5px', borderRadius: '4px', fontSize: '0.78rem' }}>
                                  {row.sOut}
                                </span>
                              ) : (
                                <span style={{ color: '#cbd5e1' }}>-</span>
                              )}
                            </td>

                            {/* OT-IN */}
                            <td style={{ padding: '7px 6px', textAlign: 'center' }}>
                              {row.otIn ? (
                                <span style={{ fontFamily: 'monospace', fontWeight: 700, color: '#991b1b', background: '#fee2e2', padding: '2px 5px', borderRadius: '4px', fontSize: '0.78rem' }}>
                                  {row.otIn}
                                </span>
                              ) : (
                                <span style={{ color: '#cbd5e1' }}>-</span>
                              )}
                            </td>

                            {/* OT-OUT */}
                            <td style={{ padding: '7px 6px', textAlign: 'center' }}>
                              {row.otOut ? (
                                <span style={{ fontFamily: 'monospace', fontWeight: 700, color: '#9a3412', background: '#ffedd5', padding: '2px 5px', borderRadius: '4px', fontSize: '0.78rem' }}>
                                  {row.otOut}
                                </span>
                              ) : (
                                <span style={{ color: '#cbd5e1' }}>-</span>
                              )}
                            </td>

                            {/* REG DAY */}
                            <td style={{ padding: '7px 6px', textAlign: 'center', fontWeight: 700 }}>
                              <span style={{ color: row.regDay >= 1 ? '#15803d' : row.regDay > 0 ? '#b45309' : '#94a3b8' }}>
                                {row.regDay}
                              </span>
                            </td>

                            {/* WORK HRS */}
                            <td style={{ padding: '7px 6px', textAlign: 'center', fontWeight: 700 }}>
                              <span style={{ color: row.workHrs >= 8 ? '#15803d' : row.workHrs > 0 ? '#1e40af' : '#94a3b8' }}>
                                {row.workHrs}
                              </span>
                            </td>

                            {/* NORMAL OT */}
                            <td style={{ padding: '7px 6px', textAlign: 'center', fontWeight: row.normalOt > 0 ? 800 : 500 }}>
                              <span style={{ color: row.normalOt > 0 ? '#b45309' : '#94a3b8' }}>
                                {row.normalOt}
                              </span>
                            </td>

                            {/* NIGHT OT */}
                            <td style={{ padding: '7px 6px', textAlign: 'center', fontWeight: row.nightOt > 0 ? 800 : 500 }}>
                              <span style={{ color: row.nightOt > 0 ? '#7c3aed' : '#94a3b8' }}>
                                {row.nightOt}
                              </span>
                            </td>

                            {/* HOLIDAY OT */}
                            <td style={{ padding: '7px 6px', textAlign: 'center', fontWeight: row.holidayOt > 0 ? 800 : 500 }}>
                              <span style={{ color: row.holidayOt > 0 ? '#dc2626' : '#94a3b8' }}>
                                {row.holidayOt}
                              </span>
                            </td>

                            {/* LATE */}
                            <td style={{ padding: '7px 6px', textAlign: 'center' }}>
                              {row.lateMins > 0 ? (
                                <span style={{ background: '#fee2e2', color: '#dc2626', padding: '1px 5px', borderRadius: '4px', fontWeight: 700, fontSize: '0.72rem' }}>
                                  {row.lateMins}m
                                </span>
                              ) : (
                                <span style={{ color: '#94a3b8' }}>0</span>
                              )}
                            </td>

                            {/* EARLY */}
                            <td style={{ padding: '7px 6px', textAlign: 'center' }}>
                              {row.earlyMins > 0 ? (
                                <span style={{ background: '#fef3c7', color: '#d97706', padding: '1px 5px', borderRadius: '4px', fontWeight: 700, fontSize: '0.72rem' }}>
                                  {row.earlyMins}m
                                </span>
                              ) : (
                                <span style={{ color: '#94a3b8' }}>0</span>
                              )}
                            </td>

                            {/* REMARKS */}
                            <td style={{ padding: '7px 10px' }}>
                              <span
                                style={{
                                  fontSize: '0.74rem',
                                  color: '#475569',
                                  maxWidth: '150px',
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                  display: 'inline-block',
                                }}
                                title={`${row.remarks} • ${row.sourceList.join(', ')} (${row.punchesCount} ស្កេន)`}
                              >
                                {row.remarks}
                              </span>
                            </td>

                            {/* ACTIONS */}
                            <td style={{ padding: '7px 6px', textAlign: 'center' }}>
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                                <button
                                  type="button"
                                  title="កែសម្រួល / បំពេញម៉ោង (Adjust Attendance)"
                                  onClick={() => handleOpenEditDay(row)}
                                  style={{
                                    background: '#eff6ff',
                                    border: '1px solid #bfdbfe',
                                    color: '#1d4ed8',
                                    padding: '3px 6px',
                                    borderRadius: '6px',
                                    cursor: 'pointer',
                                    fontSize: '0.75rem',
                                  }}
                                >
                                  ✏️
                                </button>
                                {['ADMIN'].includes(currentUserRole) && (
                                  <button
                                    type="button"
                                    title="លុបកំណត់ត្រាទាំងអស់ក្នុងថ្ងៃនេះ (Delete all day punches)"
                                    onClick={() => handleDeleteDayPunches(row)}
                                    style={{
                                      background: '#fef2f2',
                                      border: '1px solid #fecaca',
                                      color: '#dc2626',
                                      padding: '3px 6px',
                                      borderRadius: '6px',
                                      cursor: 'pointer',
                                      fontSize: '0.75rem',
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
              ) : (
                /* VIEW 2: RAW EVENT PUNCHES TABLE */
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.82rem' }}>
                  <thead>
                    <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0', fontSize: '0.76rem' }}>
                      <th style={{ padding: '10px 14px', minWidth: '200px' }}>
                        <div style={{ fontWeight: 800, color: '#0f172a' }}>ព័ត៌មានបុគ្គលិក</div>
                        <div style={{ fontSize: '0.68rem', color: '#64748b' }}>Employee Name & ID</div>
                      </th>
                      <th style={{ padding: '10px 14px', minWidth: '150px' }}>
                        <div style={{ fontWeight: 800, color: '#0f172a' }}>នាយកដ្ឋាន / មុខតំណែង</div>
                        <div style={{ fontSize: '0.68rem', color: '#64748b' }}>Department / Position</div>
                      </th>
                      <th style={{ padding: '10px 14px', minWidth: '140px' }}>
                        <div style={{ fontWeight: 800, color: '#0f172a' }}>កាលបរិច្ឆេទ និងម៉ោង</div>
                        <div style={{ fontSize: '0.68rem', color: '#64748b' }}>Punch Date & Time</div>
                      </th>
                      <th style={{ padding: '10px 14px', minWidth: '130px' }}>
                        <div style={{ fontWeight: 800, color: '#0f172a' }}>ប្រភេទស្កេន</div>
                        <div style={{ fontSize: '0.68rem', color: '#64748b' }}>Punch Type</div>
                      </th>
                      <th style={{ padding: '10px 14px', minWidth: '130px' }}>
                        <div style={{ fontWeight: 800, color: '#0f172a' }}>វិធីផ្ទៀងផ្ទាត់</div>
                        <div style={{ fontSize: '0.68rem', color: '#64748b' }}>Verify Mode</div>
                      </th>
                      <th style={{ padding: '10px 14px', minWidth: '150px' }}>
                        <div style={{ fontWeight: 800, color: '#0f172a' }}>ម៉ាស៊ីនស្កេន</div>
                        <div style={{ fontSize: '0.68rem', color: '#64748b' }}>Device Terminal</div>
                      </th>
                      <th style={{ padding: '10px 14px', minWidth: '80px', textAlign: 'center' }}>
                        <div style={{ fontWeight: 800, color: '#0f172a' }}>សកម្មភាព</div>
                        <div style={{ fontSize: '0.68rem', color: '#64748b' }}>Actions</div>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedRawLogs.length === 0 ? (
                      <tr>
                        <td colSpan={7} style={{ padding: '36px 16px', textAlign: 'center', color: '#94a3b8' }}>
                          <div style={{ fontSize: '32px', marginBottom: '6px' }}>📂</div>
                          <div style={{ fontSize: '0.92rem', fontWeight: 700, color: '#475569' }}>
                            មិនមានកំណត់ត្រាស្កេនវត្តមានទេ (No Punch Records)
                          </div>
                        </td>
                      </tr>
                    ) : (
                      paginatedRawLogs.map((log, idx) => {
                        const empNameKh = `${log.employee.lastNameKh || ''} ${log.employee.firstNameKh || ''}`.trim();
                        const empNameEn = `${log.employee.firstNameEn || ''} ${log.employee.lastNameEn || ''}`.trim();
                        const typeConf = PUNCH_TYPE_CONFIG[log.punchType] || {
                          labelKh: log.punchType,
                          labelEn: log.punchType,
                          icon: '⏰',
                          bg: '#f1f5f9',
                          text: '#475569',
                        };
                        const modeConf = VERIFY_MODE_CONFIG[log.verifyMode] || {
                          labelKh: log.verifyMode,
                          labelEn: log.verifyMode,
                          icon: '👆',
                          bg: '#f1f5f9',
                          text: '#475569',
                        };

                        const d = new Date(log.punchTime);
                        const dateStr = d.toLocaleDateString();
                        const timeStr = d.toTimeString().slice(0, 8);

                        return (
                          <tr
                            key={log.id}
                            style={{
                              borderBottom: '1px solid #f1f5f9',
                              background: idx % 2 === 0 ? '#ffffff' : '#fafafa',
                            }}
                          >
                            <td style={{ padding: '10px 14px' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                {log.employee.photoUrl ? (
                                  <img
                                    src={log.employee.photoUrl}
                                    alt=""
                                    style={{ width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover' }}
                                  />
                                ) : (
                                  <div
                                    style={{
                                      width: '32px',
                                      height: '32px',
                                      borderRadius: '50%',
                                      background: '#e0e7ff',
                                      color: '#4338ca',
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      fontWeight: 700,
                                      fontSize: '0.78rem',
                                    }}
                                  >
                                    {(log.employee.firstNameEn?.[0] || 'E')}
                                  </div>
                                )}
                                <div>
                                  <div style={{ fontWeight: 800, color: '#0f172a', fontSize: '0.84rem' }}>
                                    {empNameKh || empNameEn}
                                  </div>
                                  <div style={{ fontSize: '0.72rem', color: '#64748b' }}>
                                    <span style={{ fontFamily: 'monospace', color: '#2563eb' }}>{log.employee.employeeId}</span> • {empNameEn}
                                  </div>
                                </div>
                              </div>
                            </td>

                            <td style={{ padding: '10px 14px' }}>
                              <div style={{ fontWeight: 600, color: '#1e293b', fontSize: '0.82rem' }}>
                                {log.employee.department}
                              </div>
                              <div style={{ fontSize: '0.72rem', color: '#64748b' }}>{log.employee.position}</div>
                            </td>

                            <td style={{ padding: '10px 14px' }}>
                              <div style={{ fontWeight: 800, color: '#0f172a', fontSize: '0.86rem', fontFamily: 'monospace' }}>
                                {timeStr}
                              </div>
                              <div style={{ fontSize: '0.72rem', color: '#64748b' }}>📅 {dateStr}</div>
                            </td>

                            <td style={{ padding: '10px 14px' }}>
                              <span
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '4px',
                                  background: typeConf.bg,
                                  color: typeConf.text,
                                  padding: '3px 8px',
                                  borderRadius: '6px',
                                  fontWeight: 700,
                                  fontSize: '0.75rem',
                                }}
                              >
                                <span>{typeConf.icon}</span>
                                <span>{typeConf.labelKh}</span>
                              </span>
                            </td>

                            <td style={{ padding: '10px 14px' }}>
                              <span
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '4px',
                                  background: modeConf.bg,
                                  color: modeConf.text,
                                  padding: '3px 8px',
                                  borderRadius: '6px',
                                  fontWeight: 700,
                                  fontSize: '0.75rem',
                                }}
                              >
                                <span>{modeConf.icon}</span>
                                <span>{modeConf.labelKh}</span>
                              </span>
                            </td>

                            <td style={{ padding: '10px 14px' }}>
                              <div style={{ fontWeight: 600, color: '#334155', fontSize: '0.8rem' }}>
                                {log.deviceName || 'Biometric Terminal'}
                              </div>
                              <div style={{ fontSize: '0.68rem', color: '#94a3b8' }}>
                                ប្រភព: {log.source} {log.device ? `(${log.device.deviceIp})` : ''}
                              </div>
                            </td>

                            <td style={{ padding: '10px 14px', textAlign: 'center' }}>
                              {['ADMIN'].includes(currentUserRole) && (
                                <button
                                  type="button"
                                  title="លុបកំណត់ត្រា (Delete)"
                                  onClick={() => handleDeleteLog(log.id)}
                                  style={{
                                    background: '#fef2f2',
                                    border: '1px solid #fecaca',
                                    color: '#dc2626',
                                    padding: '4px 7px',
                                    borderRadius: '6px',
                                    cursor: 'pointer',
                                    fontSize: '0.8rem',
                                  }}
                                >
                                  🗑️
                                </button>
                              )}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              )}
            </div>
          </div>

          {/* BOTTOM PAGINATION CONTROLS */}
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '8px 14px',
              background: '#ffffff',
              borderRadius: '10px',
              border: '1px solid #e2e8f0',
              gap: '10px',
              fontSize: '0.8rem',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#64748b' }}>
              <span>បង្ហាញក្នុងមួយទំព័រ:</span>
              <select
                value={pageSize}
                onChange={(e) => {
                  const val = e.target.value === 'ALL' ? 'ALL' : Number(e.target.value);
                  setPageSize(val);
                  setCurrentPage(1);
                }}
                style={{
                  padding: '3px 8px',
                  borderRadius: '6px',
                  border: '1px solid #cbd5e1',
                  fontSize: '0.8rem',
                  background: '#ffffff',
                }}
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
                <option value="ALL">ទាំងអស់ (All)</option>
              </select>
              <span>
                • សរុប {totalCount} {logViewMode === 'DAILY_SUMMARY' ? 'ជួរ (បុគ្គលិក/ថ្ងៃ)' : 'កំណត់ត្រាស្កេន'}
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <button
                type="button"
                disabled={currentPage <= 1}
                onClick={() => setCurrentPage(1)}
                style={{
                  padding: '3px 8px',
                  borderRadius: '6px',
                  border: '1px solid #cbd5e1',
                  background: currentPage <= 1 ? '#f8fafc' : '#ffffff',
                  color: currentPage <= 1 ? '#cbd5e1' : '#334155',
                  cursor: currentPage <= 1 ? 'not-allowed' : 'pointer',
                  fontWeight: 600,
                }}
              >
                ⏮
              </button>
              <button
                type="button"
                disabled={currentPage <= 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                style={{
                  padding: '3px 8px',
                  borderRadius: '6px',
                  border: '1px solid #cbd5e1',
                  background: currentPage <= 1 ? '#f8fafc' : '#ffffff',
                  color: currentPage <= 1 ? '#cbd5e1' : '#334155',
                  cursor: currentPage <= 1 ? 'not-allowed' : 'pointer',
                  fontWeight: 600,
                }}
              >
                ◀ ថយក្រោយ
              </button>
              <span style={{ fontWeight: 700, color: '#1e293b', padding: '0 6px', fontSize: '0.8rem' }}>
                ទំព័រ {currentPage} / {totalPages || 1}
              </span>
              <button
                type="button"
                disabled={currentPage >= totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                style={{
                  padding: '3px 8px',
                  borderRadius: '6px',
                  border: '1px solid #cbd5e1',
                  background: currentPage >= totalPages ? '#f8fafc' : '#ffffff',
                  color: currentPage >= totalPages ? '#cbd5e1' : '#334155',
                  cursor: currentPage >= totalPages ? 'not-allowed' : 'pointer',
                  fontWeight: 600,
                }}
              >
                បន្ទាប់ ▶
              </button>
              <button
                type="button"
                disabled={currentPage >= totalPages}
                onClick={() => setCurrentPage(totalPages)}
                style={{
                  padding: '3px 8px',
                  borderRadius: '6px',
                  border: '1px solid #cbd5e1',
                  background: currentPage >= totalPages ? '#f8fafc' : '#ffffff',
                  color: currentPage >= totalPages ? '#cbd5e1' : '#334155',
                  cursor: currentPage >= totalPages ? 'not-allowed' : 'pointer',
                  fontWeight: 600,
                }}
              >
                ⏭
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: Device Terminals Management */}
      {activeTab === 'DEVICES' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: '#0f172a' }}>
                បញ្ជីម៉ាស៊ីនស្កេនមេដៃ និងផ្ទៃមុខ (Configured Biometric Devices)
              </h3>
              <p style={{ margin: '4px 0 0 0', fontSize: '0.78rem', color: '#64748b' }}>
                TCP/IP Network Terminal Connections • ZKTeco, Hikvision, Anviz Devices
              </p>
            </div>

            {isHR && (
              <button
                onClick={() => setIsDeviceModalOpen(true)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  background: '#2563eb',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '10px',
                  padding: '10px 16px',
                  fontWeight: 700,
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                }}
              >
                <span>➕</span> បន្ថែមម៉ាស៊ីនថ្មី (Add Device)
              </button>
            )}
          </div>

          {/* Device Cards Grid */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
              gap: '16px',
            }}
          >
            {devices.length === 0 ? (
              <div
                style={{
                  background: '#ffffff',
                  padding: '40px',
                  borderRadius: '16px',
                  border: '1px solid #e2e8f0',
                  textAlign: 'center',
                  gridColumn: '1 / -1',
                  color: '#64748b',
                }}
              >
                <div style={{ fontSize: '40px', marginBottom: '8px' }}>📡</div>
                <div style={{ fontWeight: 700, fontSize: '1rem', color: '#0f172a' }}>
                  មិនទាន់បានកំណត់ម៉ាស៊ីនស្កេននៅឡើយទេ
                </div>
                <p style={{ fontSize: '0.82rem', marginTop: '4px' }}>
                  សូមចុច "បន្ថែមម៉ាស៊ីនថ្មី" ដើម្បីភ្ជាប់ម៉ាស៊ីន ZKTeco ឬ Hikvision
                </p>
              </div>
            ) : (
              devices.map((dev) => (
                <div
                  key={dev.id}
                  style={{
                    background: '#ffffff',
                    borderRadius: '16px',
                    padding: '20px',
                    border: '1px solid #e2e8f0',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.03)',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    gap: '14px',
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div
                          style={{
                            width: '42px',
                            height: '42px',
                            borderRadius: '10px',
                            background: '#eff6ff',
                            color: '#2563eb',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '20px',
                          }}
                        >
                          📠
                        </div>
                        <div>
                          <h4 style={{ margin: 0, fontWeight: 800, fontSize: '0.98rem', color: '#0f172a' }}>
                            {dev.deviceName}
                          </h4>
                          <span style={{ fontSize: '0.75rem', color: '#64748b' }}>{dev.deviceModel}</span>
                        </div>
                      </div>

                      <span
                        style={{
                          background: dev.status === 'ONLINE' ? '#dcfce7' : '#fee2e2',
                          color: dev.status === 'ONLINE' ? '#15803d' : '#dc2626',
                          padding: '3px 8px',
                          borderRadius: '6px',
                          fontSize: '0.72rem',
                          fontWeight: 700,
                        }}
                      >
                        ● {dev.status}
                      </span>
                    </div>

                    {/* Network info */}
                    <div
                      style={{
                        background: '#f8fafc',
                        borderRadius: '10px',
                        padding: '10px 14px',
                        marginTop: '12px',
                        fontSize: '0.78rem',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '4px',
                      }}
                    >
                      <div>
                        <span style={{ color: '#64748b' }}>IP Address: </span>
                        <strong style={{ fontFamily: 'monospace', color: '#1e293b' }}>
                          {dev.deviceIp}:{dev.port}
                        </strong>
                      </div>
                      <div>
                        <span style={{ color: '#64748b' }}>ទីតាំងដំឡើង: </span>
                        <strong style={{ color: '#1e293b' }}>{dev.location}</strong>
                      </div>
                      <div>
                        <span style={{ color: '#64748b' }}>Sync ចុងក្រោយ: </span>
                        <span style={{ color: '#1e293b' }}>
                          {dev.lastSyncTime ? new Date(dev.lastSyncTime).toLocaleString() : 'មិនទាន់ Sync'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div style={{ display: 'flex', gap: '8px', borderTop: '1px solid #f1f5f9', paddingTop: '12px' }}>
                    <button
                      onClick={() => handlePingDevice(dev)}
                      style={{
                        flex: 1,
                        padding: '8px',
                        borderRadius: '8px',
                        border: '1px solid #cbd5e1',
                        background: '#ffffff',
                        fontSize: '0.78rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        color: '#334155',
                      }}
                    >
                      📡 ពិនិត្យការតភ្ជាប់ (Ping)
                    </button>
                    <button
                      onClick={() => handleSyncAttendance(dev.id)}
                      style={{
                        flex: 1,
                        padding: '8px',
                        borderRadius: '8px',
                        border: 'none',
                        background: '#2563eb',
                        color: '#ffffff',
                        fontSize: '0.78rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                      }}
                    >
                      ⚡ ទាញយក Logs (Sync)
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* TAB 3: Batch Import from USB / Excel */}
      {activeTab === 'IMPORT' && (
        <div
          style={{
            background: '#ffffff',
            borderRadius: '16px',
            padding: '28px',
            border: '1px solid #e2e8f0',
            boxShadow: '0 4px 20px rgba(0,0,0,0.03)',
            maxWidth: '780px',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
          }}
        >
          <div>
            <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: '#0f172a' }}>
              នាំចូលទិន្នន័យស្កេនមេដៃពី USB Flash Drive ឬឯកសារ Excel
            </h3>
            <p style={{ margin: '4px 0 0 0', fontSize: '0.8rem', color: '#64748b' }}>
              Batch Import Biometric Raw Logs (ZKTeco .dat / Excel Text format)
            </p>
          </div>

          <div
            style={{
              background: '#eff6ff',
              border: '1px solid #bfdbfe',
              borderRadius: '10px',
              padding: '12px 16px',
              fontSize: '0.78rem',
              color: '#1e3a8a',
            }}
          >
            <strong>ទម្រង់ទិន្នន័យគំរូ (Format: EmpID Date Time Type):</strong>
            <pre style={{ margin: '6px 0 0 0', fontFamily: 'monospace', fontSize: '0.75rem' }}>
              EMP-001 2026-10-11 07:55:00 CHECK_IN{'\n'}
              EMP-002 2026-10-11 08:02:15 CHECK_IN{'\n'}
              EMP-001 2026-10-11 17:05:30 CHECK_OUT
            </pre>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
              បិទភ្ជាប់ទិន្នន័យ Logs នៅទីនេះ (Paste Log Text Here)
            </label>
            <textarea
              rows={8}
              value={importText}
              onChange={(e) => setImportText(e.target.value)}
              placeholder="EMP-001 2026-10-11 07:55:00 CHECK_IN"
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: '10px',
                border: '1px solid #cbd5e1',
                fontSize: '0.85rem',
                fontFamily: 'monospace',
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
            <button
              onClick={() => setImportText('')}
              style={{
                padding: '10px 18px',
                borderRadius: '10px',
                border: '1px solid #cbd5e1',
                background: '#ffffff',
                color: '#64748b',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              សម្អាត (Clear)
            </button>
            <button
              onClick={handleBatchImport}
              disabled={isImporting}
              style={{
                padding: '10px 22px',
                borderRadius: '10px',
                border: 'none',
                background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
                color: '#ffffff',
                fontWeight: 700,
                cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(37,99,235,0.25)',
              }}
            >
              {isImporting ? 'កំពុងនាំចូល...' : '⚡ នាំចូលទិន្នន័យ (Import Now)'}
            </button>
          </div>
        </div>
      )}

      {/* MODAL 1: Add Manual Punch Log */}
      {isManualModalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 999,
            background: 'rgba(15, 23, 42, 0.65)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
          }}
        >
          <div
            style={{
              background: '#ffffff',
              borderRadius: '20px',
              maxWidth: '560px',
              width: '100%',
              padding: '24px',
              boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
              border: '1px solid #e2e8f0',
              maxHeight: '92vh',
              overflowY: 'auto',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                borderBottom: '1px solid #e2e8f0',
                paddingBottom: '12px',
                marginBottom: '14px',
              }}
            >
              <div>
                <h3 style={{ margin: 0, fontSize: '1.18rem', fontWeight: 800, color: '#0f172a' }}>
                  កត់ត្រាស្កេនវត្តមានដោយដៃ (Manual Attendance Entry)
                </h3>
                <span style={{ fontSize: '0.78rem', color: '#64748b' }}>
                  ងាយស្រួលបំពេញក្នុងករណីបុគ្គលិកភ្លេចស្កេនពេញមួយថ្ងៃ ឬស្កេនខ្វះចន្លោះ
                </span>
              </div>
              <button
                onClick={() => setIsManualModalOpen(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '24px',
                  color: '#94a3b8',
                  cursor: 'pointer',
                }}
              >
                &times;
              </button>
            </div>

            {/* Mode Switcher */}
            <div
              style={{
                display: 'flex',
                backgroundColor: '#f1f5f9',
                padding: '4px',
                borderRadius: '10px',
                marginBottom: '16px',
                gap: '4px',
              }}
            >
              <button
                type="button"
                onClick={() => setManualEntryMode('fullday')}
                style={{
                  flex: 1,
                  padding: '8px 12px',
                  borderRadius: '8px',
                  border: 'none',
                  backgroundColor: manualEntryMode === 'fullday' ? '#ffffff' : 'transparent',
                  color: manualEntryMode === 'fullday' ? '#2563eb' : '#64748b',
                  fontWeight: manualEntryMode === 'fullday' ? 700 : 500,
                  fontSize: '0.84rem',
                  cursor: 'pointer',
                  boxShadow: manualEntryMode === 'fullday' ? '0 2px 6px rgba(0,0,0,0.08)' : 'none',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  transition: 'all 0.15s ease',
                }}
              >
                <span>🌟</span>
                <span>បំពេញពេញមួយថ្ងៃ (Full Day / ភ្លេចស្កេន)</span>
              </button>
              <button
                type="button"
                onClick={() => setManualEntryMode('single')}
                style={{
                  flex: 1,
                  padding: '8px 12px',
                  borderRadius: '8px',
                  border: 'none',
                  backgroundColor: manualEntryMode === 'single' ? '#ffffff' : 'transparent',
                  color: manualEntryMode === 'single' ? '#2563eb' : '#64748b',
                  fontWeight: manualEntryMode === 'single' ? 700 : 500,
                  fontSize: '0.84rem',
                  cursor: 'pointer',
                  boxShadow: manualEntryMode === 'single' ? '0 2px 6px rgba(0,0,0,0.08)' : 'none',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  transition: 'all 0.15s ease',
                }}
              >
                <span>🕒</span>
                <span>ស្កេនមួយលើក (Single Punch)</span>
              </button>
            </div>

            <form onSubmit={handleCreateManualPunch} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {/* Employee */}
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                  ជ្រើសរើសបុគ្គលិក *
                </label>
                <select
                  required
                  value={manualEmpId}
                  onChange={(e) => setManualEmpId(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '10px',
                    border: '1px solid #cbd5e1',
                    fontSize: '0.88rem',
                    background: '#ffffff',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                >
                  <option value="">-- សូមជ្រើសរើសបុគ្គលិក --</option>
                  {employees.map((emp) => {
                    const kh = `${emp.lastNameKh || ''} ${emp.firstNameKh || ''}`.trim();
                    const en = `${emp.firstNameEn || ''} ${emp.lastNameEn || ''}`.trim();
                    return (
                      <option key={emp.id} value={emp.id}>
                        {emp.employeeId} - {kh ? `${kh} (${en})` : en} - {emp.department}
                      </option>
                    );
                  })}
                </select>
              </div>

              {/* MODE 1: FULL DAY / FORGOT SCAN */}
              {manualEntryMode === 'fullday' && (
                <>
                  {/* Date Selection */}
                  <div>
                    <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                      កាលបរិច្ឆេទវត្តមាន (Date) *
                    </label>
                    <input
                      type="date"
                      required
                      value={fullDayDate}
                      onChange={(e) => setFullDayDate(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '10px 14px',
                        borderRadius: '10px',
                        border: '1px solid #cbd5e1',
                        fontSize: '0.88rem',
                        outline: 'none',
                        boxSizing: 'border-box',
                      }}
                    />
                  </div>

                  {/* Quick Shift Presets 1-Click */}
                  <div>
                    <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                      ⚡ ជម្រើសកំណត់ម៉ោងស្វ័យប្រវត្តិតាមវេន (Quick Shift Presets) :
                    </label>
                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                      {[
                        { id: 'NORMAL', label: '⚡ ពេញមួយថ្ងៃ (8h)', desc: '07:00-11:00 & 13:00-17:00' },
                        { id: 'HALF_MORN', label: '☀️ កន្លះថ្ងៃព្រឹក (4h)', desc: '07:00-11:00' },
                        { id: 'HALF_AFT', label: '🌤️ កន្លះថ្ងៃរសៀល (4h)', desc: '13:00-17:00' },
                        { id: 'NIGHT', label: '🌙 វេនយប់ (8h)', desc: '17:00-04:00' },
                      ].map((p) => (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => applyShiftPreset(p.id as any)}
                          style={{
                            padding: '6px 10px',
                            borderRadius: '8px',
                            border: '1px solid #bfdbfe',
                            backgroundColor: '#eff6ff',
                            color: '#1d4ed8',
                            fontSize: '0.78rem',
                            fontWeight: 600,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                          }}
                        >
                          {p.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* 4 Time Slots (F-In, F-Out, S-In, S-Out) */}
                  <div style={{ backgroundColor: '#f8fafc', padding: '12px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                    <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#0f172a', marginBottom: '8px' }}>
                      ម៉ោងបំពេញការងារ (Work Shifts Time) :
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#475569', marginBottom: '2px' }}>
                          ចូលព្រឹក (F-In)
                        </label>
                        <input
                          type="time"
                          value={fullDayFIn}
                          onChange={(e) => setFullDayFIn(e.target.value)}
                          style={{ width: '100%', padding: '7px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.86rem' }}
                        />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#475569', marginBottom: '2px' }}>
                          ចេញព្រឹក (F-Out)
                        </label>
                        <input
                          type="time"
                          value={fullDayFOut}
                          onChange={(e) => setFullDayFOut(e.target.value)}
                          style={{ width: '100%', padding: '7px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.86rem' }}
                        />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#475569', marginBottom: '2px' }}>
                          ចូលរសៀល (S-In)
                        </label>
                        <input
                          type="time"
                          value={fullDaySIn}
                          onChange={(e) => setFullDaySIn(e.target.value)}
                          style={{ width: '100%', padding: '7px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.86rem' }}
                        />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#475569', marginBottom: '2px' }}>
                          ចេញរសៀល (S-Out)
                        </label>
                        <input
                          type="time"
                          value={fullDaySOut}
                          onChange={(e) => setFullDaySOut(e.target.value)}
                          style={{ width: '100%', padding: '7px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.86rem' }}
                        />
                      </div>
                    </div>

                    {/* Reg Day & Work Hrs Summary Badges */}
                    <div style={{ display: 'flex', gap: '10px', marginTop: '10px', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.76rem', color: '#64748b' }}>
                        ថ្ងៃធម្មតា (Reg Day): <strong style={{ color: '#0f172a' }}>{fullDayRegDay}</strong>
                      </span>
                      <span style={{ fontSize: '0.76rem', color: '#64748b' }}>
                        ម៉ោងធ្វើការ (Work Hrs): <strong style={{ color: '#0f172a' }}>{fullDayWorkHrs}h</strong>
                      </span>
                    </div>
                  </div>

                  {/* Overtime (OT) Toggle */}
                  <div style={{ border: '1.5px dashed #3b82f6', backgroundColor: '#f0f7ff', padding: '12px', borderRadius: '10px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.84rem', fontWeight: 700, color: '#1e40af', cursor: 'pointer' }}>
                        <input
                          type="checkbox"
                          checked={hasOt}
                          onChange={(e) => setHasOt(e.target.checked)}
                          style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                        />
                        <span>☑️ + បន្ថែមម៉ោងថែម (Overtime / OT)</span>
                      </label>

                      {hasOt && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{ fontSize: '0.78rem', color: '#1e40af', fontWeight: 600 }}>ម៉ោងថែមគណនាឃើញ ៖</span>
                          <span style={{ fontSize: '0.92rem', fontWeight: 800, color: '#ffffff', backgroundColor: '#2563eb', padding: '2px 10px', borderRadius: '12px' }}>
                            {calculatedOt.total} ម៉ោង (h)
                          </span>
                        </div>
                      )}
                    </div>

                    {hasOt && (
                      <div style={{ marginTop: '10px' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                          <div>
                            <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 700, color: '#334155', marginBottom: '3px' }}>
                              ចូល OT (OT-In)
                            </label>
                            <input
                              type="time"
                              value={fullDayOtIn}
                              onChange={(e) => setFullDayOtIn(e.target.value)}
                              style={{ width: '100%', padding: '7px 10px', borderRadius: '6px', border: '1px solid #93c5fd', fontSize: '0.86rem', background: '#ffffff', boxSizing: 'border-box' }}
                            />
                          </div>
                          <div>
                            <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 700, color: '#334155', marginBottom: '3px' }}>
                              ចេញ OT (OT-Out)
                            </label>
                            <input
                              type="time"
                              value={fullDayOtOut}
                              onChange={(e) => setFullDayOtOut(e.target.value)}
                              style={{ width: '100%', padding: '7px 10px', borderRadius: '6px', border: '1px solid #93c5fd', fontSize: '0.86rem', background: '#ffffff', boxSizing: 'border-box' }}
                            />
                          </div>
                        </div>

                        {/* Quick OT Presets */}
                        <div style={{ marginTop: '8px' }}>
                          <div style={{ fontSize: '0.72rem', color: '#64748b', marginBottom: '4px', fontWeight: 600 }}>
                            ⚡ កំណត់ម៉ោង OT រហ័ស (Quick OT Hours):
                          </div>
                          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                            {[
                              { label: '⚡ 1.5h (17:30-19:00)', in: '17:30', out: '19:00' },
                              { label: '⚡ 2.0h (17:30-19:30)', in: '17:30', out: '19:30' },
                              { label: '⚡ 2.5h (17:30-20:00)', in: '17:30', out: '20:00' },
                              { label: '⚡ 3.0h (17:30-20:30)', in: '17:30', out: '20:30' },
                              { label: '⚡ 4.0h (17:30-21:30)', in: '17:30', out: '21:30' },
                            ].map((preset, idx) => (
                              <button
                                key={idx}
                                type="button"
                                onClick={() => {
                                  setFullDayOtIn(preset.in);
                                  setFullDayOtOut(preset.out);
                                }}
                                style={{
                                  padding: '3px 8px',
                                  borderRadius: '6px',
                                  border: '1px solid #bfdbfe',
                                  backgroundColor: fullDayOtIn === preset.in && fullDayOtOut === preset.out ? '#2563eb' : '#ffffff',
                                  color: fullDayOtIn === preset.in && fullDayOtOut === preset.out ? '#ffffff' : '#1d4ed8',
                                  fontSize: '0.74rem',
                                  fontWeight: 600,
                                  cursor: 'pointer',
                                }}
                              >
                                {preset.label}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Breakdown description */}
                        <div style={{ marginTop: '8px', fontSize: '0.75rem', color: '#1e40af', backgroundColor: '#dbeafe', padding: '6px 10px', borderRadius: '6px', display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '4px' }}>
                          <span>
                            ប្រភេទម៉ោងថែម ៖ <strong>{calculatedOt.holiday > 0 ? 'ម៉ោងថែមថ្ងៃបុណ្យ/អាទិត្យ (Holiday OT 200%)' : (calculatedOt.night > 0 ? `ធម្មតា ${calculatedOt.normal}h + យប់ ${calculatedOt.night}h` : 'ម៉ោងថែមធម្មតា (Normal OT 150%)')}</strong>
                          </span>
                          <span style={{ color: '#059669', fontWeight: 700 }}>✓ Auto-Sync ចូល Attendance Log ផ្ទាល់</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Reason Dropdown */}
                  <div>
                    <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                      មូលហេតុភ្លេចស្កេន / ស្ថានភាព *
                    </label>
                    <select
                      value={fullDayReason}
                      onChange={(e) => setFullDayReason(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '9px 12px',
                        borderRadius: '8px',
                        border: '1px solid #cbd5e1',
                        fontSize: '0.86rem',
                        background: '#ffffff',
                        outline: 'none',
                      }}
                    >
                      <option value="ភ្លេចស្កេន (Forgot to scan)">🔔 ភ្លេចស្កេន (Forgot to scan)</option>
                      <option value="ម៉ាស៊ីនស្កេនគាំង/មានបញ្ហា (Terminal Offline)">⚠️ ម៉ាស៊ីនស្កេនគាំង/មានបញ្ហា (Terminal Offline)</option>
                      <option value="បេសកកម្មការងារក្រៅ (Official Mission)">🚗 បេសកកម្មការងារក្រៅ (Official Mission)</option>
                      <option value="មេដៃរលុប ស្កេនមិនជាប់ (Fingerprint Issue)">👆 មេដៃរលុប ស្កេនមិនជាប់ (Fingerprint Issue)</option>
                      <option value="ការអនុញ្ញាតពិសេសពីប្រធាន (Manager Approved)">✍️ ការអនុញ្ញាតពិសេសពីប្រធាន (Manager Approved)</option>
                      <option value="ផ្សេងៗ (Other)">📝 ផ្សេងៗ (Other)</option>
                    </select>
                  </div>
                </>
              )}

              {/* MODE 2: SINGLE PUNCH */}
              {manualEntryMode === 'single' && (
                <>
                  {/* Punch Time */}
                  <div>
                    <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                      កាលបរិច្ឆេទ និងម៉ោងស្កេន *
                    </label>
                    <input
                      type="datetime-local"
                      required
                      value={manualTime}
                      onChange={(e) => setManualTime(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '10px 14px',
                        borderRadius: '10px',
                        border: '1px solid #cbd5e1',
                        fontSize: '0.88rem',
                        outline: 'none',
                        boxSizing: 'border-box',
                      }}
                    />
                  </div>

                  {/* Punch Type & Mode */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                        ប្រភេទស្កេន *
                      </label>
                      <select
                        value={manualType}
                        onChange={(e) => setManualType(e.target.value)}
                        style={{
                          width: '100%',
                          padding: '10px 14px',
                          borderRadius: '10px',
                          border: '1px solid #cbd5e1',
                          fontSize: '0.88rem',
                          background: '#ffffff',
                          outline: 'none',
                          boxSizing: 'border-box',
                        }}
                      >
                        <option value="CHECK_IN">☀️ ចូលព្រឹក (Check In)</option>
                        <option value="CHECK_OUT">🌙 ចេញល្ងាច (Check Out)</option>
                        <option value="BREAK_IN">☕ ចូលពីសម្រាក</option>
                        <option value="BREAK_OUT">🍽️ ចេញសម្រាក</option>
                        <option value="OT_IN">⏰ ចូលថែមម៉ោង (OT In)</option>
                        <option value="OT_OUT">⌛ ចេញថែមម៉ោង (OT Out)</option>
                      </select>
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                        វិធីផ្ទៀងផ្ទាត់
                      </label>
                      <select
                        value={manualMode}
                        onChange={(e) => setManualMode(e.target.value)}
                        style={{
                          width: '100%',
                          padding: '10px 14px',
                          borderRadius: '10px',
                          border: '1px solid #cbd5e1',
                          fontSize: '0.88rem',
                          background: '#ffffff',
                          outline: 'none',
                          boxSizing: 'border-box',
                        }}
                      >
                        <option value="MANUAL">✍️ បញ្ចូលដោយដៃ (Manual)</option>
                        <option value="FINGERPRINT">👆 ស្កេនមេដៃ</option>
                        <option value="FACE">👤 ស្កេនមុខ</option>
                        <option value="RFID_CARD">💳 កាតសម្គាល់</option>
                      </select>
                    </div>
                  </div>
                </>
              )}

              {/* Notes */}
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                  កំណត់សម្គាល់បន្ថែម (Additional Remarks)
                </label>
                <input
                  type="text"
                  value={manualNotes}
                  onChange={(e) => setManualNotes(e.target.value)}
                  placeholder="មូលហេតុបន្ថែម..."
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    fontSize: '0.86rem',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              {/* Buttons */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button
                  type="button"
                  onClick={() => setIsManualModalOpen(false)}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    background: '#ffffff',
                    color: '#64748b',
                    fontSize: '0.85rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  បោះបង់
                </button>
                <button
                  type="submit"
                  style={{
                    padding: '8px 20px',
                    borderRadius: '8px',
                    border: 'none',
                    background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
                    color: '#ffffff',
                    fontSize: '0.86rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    boxShadow: '0 2px 6px rgba(37,99,235,0.3)',
                  }}
                >
                  {manualEntryMode === 'fullday' ? '💾 រក្សាទុកវត្តមានពេញមួយថ្ងៃ' : '💾 រក្សាទុក'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Register Biometric Device */}
      {isDeviceModalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 999,
            background: 'rgba(15, 23, 42, 0.65)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
          }}
        >
          <div
            style={{
              background: '#ffffff',
              borderRadius: '20px',
              maxWidth: '520px',
              width: '100%',
              padding: '26px',
              boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
              border: '1px solid #e2e8f0',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                borderBottom: '1px solid #e2e8f0',
                paddingBottom: '12px',
                marginBottom: '16px',
              }}
            >
              <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: '#0f172a' }}>
                ចុះឈ្មោះម៉ាស៊ីនស្កេនវត្តមាន (Register Terminal)
              </h3>
              <button
                onClick={() => setIsDeviceModalOpen(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '24px',
                  color: '#94a3b8',
                  cursor: 'pointer',
                }}
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleCreateDevice} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                  ឈ្មោះម៉ាស៊ីន (Device Name) *
                </label>
                <input
                  type="text"
                  required
                  value={devName}
                  onChange={(e) => setDevName(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '10px',
                    border: '1px solid #cbd5e1',
                    fontSize: '0.88rem',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                    IP Address *
                  </label>
                  <input
                    type="text"
                    required
                    value={devIp}
                    onChange={(e) => setDevIp(e.target.value)}
                    placeholder="192.168.1.201"
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: '10px',
                      border: '1px solid #cbd5e1',
                      fontSize: '0.88rem',
                      fontFamily: 'monospace',
                      outline: 'none',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                    Port *
                  </label>
                  <input
                    type="number"
                    required
                    value={devPort}
                    onChange={(e) => setDevPort(e.target.value)}
                    placeholder="4370"
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: '10px',
                      border: '1px solid #cbd5e1',
                      fontSize: '0.88rem',
                      fontFamily: 'monospace',
                      outline: 'none',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                  ម៉ូឌែលម៉ាស៊ីន (Device Model)
                </label>
                <input
                  type="text"
                  value={devModel}
                  onChange={(e) => setDevModel(e.target.value)}
                  placeholder="ZKTeco K40, SilkBio, Hikvision..."
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '10px',
                    border: '1px solid #cbd5e1',
                    fontSize: '0.88rem',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                  ទីតាំងដំឡើង (Location)
                </label>
                <input
                  type="text"
                  value={devLocation}
                  onChange={(e) => setDevLocation(e.target.value)}
                  placeholder="ច្រកទ្វារធំ, ជាន់ទី ១, រោងចក្រ A..."
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '10px',
                    border: '1px solid #cbd5e1',
                    fontSize: '0.88rem',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              {/* Buttons */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button
                  type="button"
                  onClick={() => setIsDeviceModalOpen(false)}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    background: '#ffffff',
                    color: '#64748b',
                    fontSize: '0.85rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  បោះបង់
                </button>
                <button
                  type="submit"
                  style={{
                    padding: '8px 18px',
                    borderRadius: '8px',
                    border: 'none',
                    background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
                    color: '#ffffff',
                    fontSize: '0.85rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  ចុះឈ្មោះម៉ាស៊ីន
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
