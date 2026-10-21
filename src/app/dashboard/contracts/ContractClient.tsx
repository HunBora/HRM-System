'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';
import Swal from 'sweetalert2';
import styles from './contracts.module.css';
import {
  ContractFormData,
  ContractType,
  CONTRACT_TYPE_METADATA,
  formatContractDate,
  getGenderLabel,
} from '@/lib/contractTemplates';
import { generateContractDocxBlob } from '@/lib/contractDocx';
import { analyzeContractAlert, ContractAlertItem } from '@/lib/contractAlerts';

interface EmployeeItem {
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
  address?: string | null;
  nationality?: string | null;
  basicSalary: number;
  hireDate: string;
  photoUrl?: string | null;
  probationStart?: string | null;
  probationEnd?: string | null;
}

interface ContractRecord {
  id: string;
  contractNo: string;
  employeeId: string;
  employee: EmployeeItem;
  contractType: ContractType;
  status: string;
  signedAtLocation?: string | null;
  signedDate: string;
  startDate: string;
  endDate?: string | null;
  positionTitle: string;
  department: string;
  basicSalaryUsd: number;
  basicSalaryKhr: number;
  isForeigner: boolean;
  passportNo?: string | null;
  passportExpiry?: string | null;
  visaNo?: string | null;
  visaExpiry?: string | null;
  workPermitNo?: string | null;
  workPermitExpiry?: string | null;
  customClausesJson?: string | null;
  createdAt: string;
}

interface Props {
  initialContracts: ContractRecord[];
  employees: EmployeeItem[];
  companySettings: any;
  userRole?: string;
}

export default function ContractClient({
  initialContracts,
  employees,
  companySettings,
  userRole,
}: Props) {
  const [contracts, setContracts] = useState<ContractRecord[]>(initialContracts);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'preview' | 'form' | 'clauses'>('preview');
  const [searchEmpQuery, setSearchEmpQuery] = useState('');
  const [isEmpDropdownOpen, setIsEmpDropdownOpen] = useState(false);
  
  // Table filters & pagination for 1000+ employees
  const [tableFilterType, setTableFilterType] = useState<string>('ALL');
  const [deptFilter, setDeptFilter] = useState<string>('ALL');
  const [alertFilterCategory, setAlertFilterCategory] = useState<string>('ALL');
  const [tableSearchText, setTableSearchText] = useState('');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(30); // 30 records per page default
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSendingTelegram, setIsSendingTelegram] = useState(false);

  // Default Form State
  const defaultCompanyName = companySettings?.companyName || 'Cambodia Enterprise Co., Ltd.';
  const defaultAddress = companySettings?.address || 'Phnom Penh, Kingdom of Cambodia';
  const exchangeRate = companySettings?.exchangeRate || 4100;

  const [formData, setFormData] = useState<ContractFormData>({
    contractNo: `HR-FDC-${new Date().getFullYear()}-${String(initialContracts.length + 1).padStart(4, '0')}`,
    revision: '01',
    contractType: 'FDC',
    signedAtLocation: 'Phnom Penh',
    signedDate: new Date().toISOString().split('T')[0],
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0],
    companyName: defaultCompanyName,
    companyAddress: defaultAddress,
    representative: 'Mr. General Manager',
    representativeRole: 'General Director / អគ្គនាយក / 总经理',
    employeeId: '',
    employeeNameKh: '',
    employeeNameEn: '',
    gender: 'MALE',
    dob: '',
    nationalIdOrPassport: '',
    address: '',
    nationality: 'Cambodian',
    isForeigner: false,
    probationCategory: 'EMPLOYEE',
    positionTitle: '',
    department: '',
    workplace: defaultAddress,
    basicSalaryUsd: 250,
    basicSalaryKhr: 250 * exchangeRate,
    paymentDay: '01-05',
    paymentMethod: 'Bank Transfer / ផ្ទេរតាមធនាគារ / 银行转账',
    workingHours: '07:00 - 11:00 / 13:00 - 17:00',
    mealBreak: '11:00 - 13:00',
    workingDays: 'ច័ន្ទ ដល់ សៅរ៍ / Monday to Saturday / 周一至周六',
  });

  // Calculate Smart Alerts for all contracts
  const contractAlertsMap = useMemo(() => {
    const map = new Map<string, ContractAlertItem[]>();
    contracts.forEach((c) => {
      const alerts = analyzeContractAlert(c);
      map.set(c.id, alerts);
    });
    return map;
  }, [contracts]);

  // Aggregated Smart Alert Counts
  const alertStats = useMemo(() => {
    let fdcNoticeCount = 0;
    let foreignWpCount = 0;
    let foreignVisaCount = 0;
    let probationCount = 0;
    let expiredCount = 0;

    contractAlertsMap.forEach((alerts) => {
      alerts.forEach((a) => {
        if (a.alertType === 'FDC_CRITICAL' || a.alertType === 'FDC_WARNING') fdcNoticeCount++;
        if (a.alertType === 'FOREIGN_WP_CRITICAL' || a.alertType === 'FOREIGN_WP_WARNING') foreignWpCount++;
        if (a.alertType === 'FOREIGN_VISA_CRITICAL' || a.alertType === 'FOREIGN_VISA_WARNING') foreignVisaCount++;
        if (a.alertType === 'PROBATION_ENDING') probationCount++;
        if (a.alertType === 'EXPIRED') expiredCount++;
      });
    });

    return {
      fdcNoticeCount,
      foreignWpCount,
      foreignVisaCount,
      probationCount,
      expiredCount,
      totalAlerts: fdcNoticeCount + foreignWpCount + foreignVisaCount + probationCount + expiredCount,
    };
  }, [contractAlertsMap]);

  // Extract unique departments for dropdown
  const departmentList = useMemo(() => {
    const set = new Set<string>();
    contracts.forEach((c) => {
      if (c.department) set.add(c.department);
    });
    employees.forEach((e) => {
      if (e.department) set.add(e.department);
    });
    return Array.from(set).filter(Boolean).sort();
  }, [contracts, employees]);

  // Filter employees for Auto-Search in modal
  const filteredEmployees = useMemo(() => {
    if (!searchEmpQuery.trim()) return employees.slice(0, 15);
    const q = searchEmpQuery.toLowerCase().trim();
    return employees
      .filter((emp) => {
        const idMatch = emp.employeeId.toLowerCase().includes(q);
        const nameEn = `${emp.firstNameEn} ${emp.lastNameEn}`.toLowerCase();
        const nameKh = `${emp.lastNameKh || ''} ${emp.firstNameKh || ''}`.toLowerCase();
        const natId = (emp.nationalId || '').toLowerCase();
        return idMatch || nameEn.includes(q) || nameKh.includes(q) || natId.includes(q);
      })
      .slice(0, 15);
  }, [employees, searchEmpQuery]);

  // Handle Employee Auto-Selection
  const handleSelectEmployee = (emp: EmployeeItem) => {
    const isForeign =
      Boolean(emp.nationality) &&
      emp.nationality?.toLowerCase() !== 'cambodian' &&
      emp.nationality?.toLowerCase() !== 'ខ្មែរ';

    const empNameKh = `${emp.lastNameKh || ''} ${emp.firstNameKh || ''}`.trim();
    const empNameEn = `${emp.firstNameEn || ''} ${emp.lastNameEn || ''}`.trim();
    const start = emp.hireDate
      ? new Date(emp.hireDate).toISOString().split('T')[0]
      : new Date().toISOString().split('T')[0];

    const dStart = new Date(start);
    const dEnd = new Date(dStart);
    dEnd.setFullYear(dEnd.getFullYear() + 1);

    const suggestedType: ContractType = isForeign ? 'FOREIGN_FDC' : 'FDC';
    const prefix = CONTRACT_TYPE_METADATA[suggestedType].defaultDocPrefix;

    setFormData((prev) => ({
      ...prev,
      contractNo: `${prefix}-${new Date().getFullYear()}-${emp.employeeId}`,
      employeeId: emp.employeeId,
      employeeNameKh: empNameKh || empNameEn,
      employeeNameEn: empNameEn,
      gender: emp.gender || 'MALE',
      dob: emp.dob ? new Date(emp.dob).toISOString().split('T')[0] : '',
      nationalIdOrPassport: emp.nationalId || '',
      address: emp.address || defaultAddress,
      nationality: emp.nationality || 'Cambodian',
      isForeigner: isForeign,
      positionTitle: emp.position,
      department: emp.department,
      basicSalaryUsd: emp.basicSalary || 0,
      basicSalaryKhr: (emp.basicSalary || 0) * exchangeRate,
      startDate: start,
      endDate: dEnd.toISOString().split('T')[0],
      contractType: suggestedType,
    }));

    setSearchEmpQuery(`${emp.employeeId} - ${empNameKh || empNameEn} (${emp.position})`);
    setIsEmpDropdownOpen(false);
  };

  // Handle Contract Type Dropdown Change
  const handleContractTypeChange = (type: ContractType) => {
    const prefix = CONTRACT_TYPE_METADATA[type].defaultDocPrefix;
    const empIdPart = formData.employeeId || '0001';

    let end = formData.endDate;
    const dStart = new Date(formData.startDate || new Date());

    if (type === 'PROBATION') {
      const dEnd = new Date(dStart);
      const months = formData.probationCategory === 'SPECIALISED' ? 2 : formData.probationCategory === 'NON_SPECIALISED' ? 1 : 3;
      dEnd.setMonth(dEnd.getMonth() + months);
      end = dEnd.toISOString().split('T')[0];
    } else if (type === 'UDC') {
      end = '';
    } else if (type === 'FDC' || type === 'FOREIGN_FDC') {
      const dEnd = new Date(dStart);
      dEnd.setFullYear(dEnd.getFullYear() + 1);
      end = dEnd.toISOString().split('T')[0];
    }

    setFormData((prev) => ({
      ...prev,
      contractType: type,
      contractNo: `${prefix}-${new Date().getFullYear()}-${empIdPart}`,
      endDate: end,
      isForeigner: type === 'FOREIGN_FDC' ? true : prev.isForeigner,
    }));
  };

  // Handle Probation Category Change
  const handleProbationCategoryChange = (cat: 'EMPLOYEE' | 'SPECIALISED' | 'NON_SPECIALISED') => {
    const dStart = new Date(formData.startDate || new Date());
    const dEnd = new Date(dStart);
    const months = cat === 'SPECIALISED' ? 2 : cat === 'NON_SPECIALISED' ? 1 : 3;
    dEnd.setMonth(dEnd.getMonth() + months);

    setFormData((prev) => ({
      ...prev,
      probationCategory: cat,
      endDate: dEnd.toISOString().split('T')[0],
    }));
  };

  // Open New Contract Modal
  const handleOpenNewModal = () => {
    setFormData({
      contractNo: `HR-FDC-${new Date().getFullYear()}-${String(contracts.length + 1).padStart(4, '0')}`,
      revision: '01',
      contractType: 'FDC',
      signedAtLocation: 'Phnom Penh',
      signedDate: new Date().toISOString().split('T')[0],
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0],
      companyName: defaultCompanyName,
      companyAddress: defaultAddress,
      representative: 'Mr. General Manager',
      representativeRole: 'General Director / អគ្គនាយក / 总经理',
      employeeId: '',
      employeeNameKh: '',
      employeeNameEn: '',
      gender: 'MALE',
      dob: '',
      nationalIdOrPassport: '',
      address: '',
      nationality: 'Cambodian',
      isForeigner: false,
      probationCategory: 'EMPLOYEE',
      positionTitle: '',
      department: '',
      workplace: defaultAddress,
      basicSalaryUsd: 250,
      basicSalaryKhr: 250 * exchangeRate,
      paymentDay: '01-05',
      paymentMethod: 'Bank Transfer / ផ្ទេរតាមធនាគារ / 银行转账',
      workingHours: '07:00 - 11:00 / 13:00 - 17:00',
      mealBreak: '11:00 - 13:00',
      workingDays: 'ច័ន្ទ ដល់ សៅរ៍ / Monday to Saturday / 周一至周六',
    });
    setSearchEmpQuery('');
    setActiveTab('preview');
    setIsModalOpen(true);
  };

  // Send Smart Alerts to Telegram
  const handleSendTelegramAlerts = async () => {
    try {
      setIsSendingTelegram(true);
      const res = await fetch('/api/contracts/alerts', { method: 'POST' });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || data.message || 'Failed to send alert');
      }

      Swal.fire({
        icon: data.telegramSent ? 'success' : 'info',
        title: data.telegramSent ? 'ផ្ញើ Telegram ជោគជ័យ!' : 'រួចរាល់!',
        text: data.message,
        confirmButtonText: 'យល់ព្រម',
      });
    } catch (err: any) {
      Swal.fire('Error', err.message || 'មិនអាចផ្ញើ Telegram Alert បានទេ', 'error');
    } finally {
      setIsSendingTelegram(false);
    }
  };

  // Save Contract to Database
  const handleSaveContract = async () => {
    if (!formData.employeeId) {
      Swal.fire({
        icon: 'warning',
        title: 'សូមជ្រើសរើសបុគ្គលិក',
        text: 'សូមវាយបញ្ចូល ឬជ្រើសរើសអត្តលេខបុគ្គលិកជាមុនសិន!',
        confirmButtonText: 'យល់ព្រម',
      });
      return;
    }

    try {
      setIsSubmitting(true);
      const targetEmp = employees.find((e) => e.employeeId === formData.employeeId);
      if (!targetEmp) {
        Swal.fire('Error', 'រកមិនឃើញទិន្នន័យបុគ្គលិកនេះទេ!', 'error');
        return;
      }

      const res = await fetch('/api/contracts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          employeeId: targetEmp.id,
        }),
      });

      const resData = await res.json();
      if (!res.ok || !resData.success) {
        throw new Error(resData.error || 'Failed to save');
      }

      Swal.fire({
        icon: 'success',
        title: 'ជោគជ័យ!',
        text: 'កិច្ចសន្យាការងារត្រូវបានរក្សាទុកដោយជោគជ័យ។',
        timer: 1800,
        showConfirmButton: false,
      });

      // Refresh list
      const fetchRes = await fetch('/api/contracts');
      const data = await fetchRes.json();
      if (data.contracts) setContracts(data.contracts);

      setIsModalOpen(false);
    } catch (err: any) {
      Swal.fire('បរាជ័យ', err.message || 'មិនអាចរក្សាទុកកុងត្រាបានទេ!', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Export to Word (.docx)
  const handleExportWord = async () => {
    try {
      const blob = await generateContractDocxBlob(formData);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${formData.contractNo}_${formData.employeeNameEn || 'Contract'}.docx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      Swal.fire({
        icon: 'success',
        title: 'ទាញយក Word ជោគជ័យ!',
        text: 'ឯកសារកិច្ចសន្យា (.docx) ត្រូវបានបង្កើត និងទាញយករួចរាល់។',
        timer: 2000,
        showConfirmButton: false,
      });
    } catch (err: any) {
      Swal.fire('Error', 'បរាជ័យក្នុងការទាញយក Word: ' + err.message, 'error');
    }
  };

  // Print Contract
  const handlePrint = () => {
    window.print();
  };

  // Filter Table Contracts by Type, Department, Search, and Smart Alert Category
  const fullyFilteredContracts = useMemo(() => {
    return contracts.filter((c) => {
      const matchesType = tableFilterType === 'ALL' || c.contractType === tableFilterType;
      const matchesDept = deptFilter === 'ALL' || c.department === deptFilter;
      const q = tableSearchText.toLowerCase().trim();
      const matchesSearch =
        !q ||
        c.contractNo.toLowerCase().includes(q) ||
        c.employee.employeeId.toLowerCase().includes(q) ||
        `${c.employee.firstNameEn} ${c.employee.lastNameEn}`.toLowerCase().includes(q) ||
        `${c.employee.lastNameKh} ${c.employee.firstNameKh}`.toLowerCase().includes(q) ||
        (c.employee.nationalId && c.employee.nationalId.toLowerCase().includes(q));

      const alerts = contractAlertsMap.get(c.id) || [];
      let matchesAlertCategory = true;
      if (alertFilterCategory === 'FDC_NOTICE') {
        matchesAlertCategory = alerts.some((a) => a.alertType === 'FDC_CRITICAL' || a.alertType === 'FDC_WARNING');
      } else if (alertFilterCategory === 'FOREIGN_WP_VISA') {
        matchesAlertCategory = alerts.some(
          (a) =>
            a.alertType === 'FOREIGN_WP_CRITICAL' ||
            a.alertType === 'FOREIGN_WP_WARNING' ||
            a.alertType === 'FOREIGN_VISA_CRITICAL' ||
            a.alertType === 'FOREIGN_VISA_WARNING'
        );
      } else if (alertFilterCategory === 'PROBATION') {
        matchesAlertCategory = alerts.some((a) => a.alertType === 'PROBATION_ENDING');
      } else if (alertFilterCategory === 'EXPIRED') {
        matchesAlertCategory = alerts.some((a) => a.alertType === 'EXPIRED');
      }

      return matchesType && matchesDept && matchesSearch && matchesAlertCategory;
    });
  }, [contracts, tableFilterType, deptFilter, tableSearchText, alertFilterCategory, contractAlertsMap]);

  // Pagination calculations for 1000+ employees
  const totalPages = pageSize === -1 ? 1 : Math.ceil(fullyFilteredContracts.length / pageSize) || 1;
  const paginatedContracts = useMemo(() => {
    if (pageSize === -1) return fullyFilteredContracts;
    const start = (currentPage - 1) * pageSize;
    return fullyFilteredContracts.slice(start, start + pageSize);
  }, [fullyFilteredContracts, currentPage, pageSize]);

  // Derived metadata
  const currentMeta = CONTRACT_TYPE_METADATA[formData.contractType] || CONTRACT_TYPE_METADATA.FDC;
  const currentGender = getGenderLabel(formData.gender);

  // State for trilingual clause translation
  const [translatingClause, setTranslatingClause] = useState<number | null>(null);
  const [isTranslatingAll, setIsTranslatingAll] = useState(false);

  // Compute Standard Default MLVT Clause Texts based on current form inputs
  const defaultClauses = useMemo(() => {
    const formattedStartDate = formatContractDate(formData.startDate);
    const formattedEndDate = formatContractDate(formData.endDate);
    const formattedDob = formatContractDate(formData.dob);
    const formattedSignedDate = formatContractDate(formData.signedDate);

    // Clause 1: Contracting Parties
    const c1Kh = `និយោជក៖ ឈ្មោះក្រុមហ៊ុន ${formData.companyName || '__________'} អាសយដ្ឋាន ${formData.companyAddress || '__________'} តំណាងដោយ ${formData.representative || '__________'} តួនាទី ${formData.representativeRole || '__________'}។ កម្មករនិយោជិត៖ ឈ្មោះ ${formData.employeeNameKh || formData.employeeNameEn || '__________'} (ឡាតាំង: ${formData.employeeNameEn || '__________'}) ភេទ ${currentGender.kh} ថ្ងៃខែឆ្នាំកំណើត ${formattedDob} លេខអត្តសញ្ញាណប័ណ្ណ/លិខិតឆ្លងដែន ${formData.nationalIdOrPassport || '__________'} អាសយដ្ឋាន ${formData.address || '__________'}។`;
    const c1En = `Employer: Company ${formData.companyName || '__________'}, address ${formData.companyAddress || '__________'}, represented by ${formData.representative || '__________'}, position ${formData.representativeRole || '__________'}. Employee: Name ${formData.employeeNameEn || '__________'}, sex ${currentGender.en}, date of birth ${formattedDob}, ID/passport ${formData.nationalIdOrPassport || '__________'}, address ${formData.address || '__________'}.`;
    const c1Zh = `雇主：公司名称 ${formData.companyName || '__________'}，地址 ${formData.companyAddress || '__________'}，代表人 ${formData.representative || '__________'}，职务 ${formData.representativeRole || '__________'}。员工：姓名 ${formData.employeeNameKh || formData.employeeNameEn || '__________'}（英文：${formData.employeeNameEn || '__________'}），性别 ${currentGender.zh}，出生日期 ${formattedDob}，身份证/护照 ${formData.nationalIdOrPassport || '__________'}，地址 ${formData.address || '__________'}。`;

    // Clause 2: Position and Workplace
    const c2Kh = `មុខតំណែង ${formData.positionTitle || '__________'} នាយកដ្ឋាន ${formData.department || '__________'} ទីកន្លែងធ្វើការ ${formData.workplace || formData.companyAddress || '__________'}។ ភារកិច្ចត្រូវអនុវត្តតាមការពិពណ៌នាការងារដែលបានពន្យល់ជូន។`;
    const c2En = `Position ${formData.positionTitle || '__________'}, department ${formData.department || '__________'}, workplace ${formData.workplace || formData.companyAddress || '__________'}. Duties follow the job description explained to the employee.`;
    const c2Zh = `岗位 ${formData.positionTitle || '__________'}，部门 ${formData.department || '__________'}，工作地点 ${formData.workplace || formData.companyAddress || '__________'}。工作职责依照已向员工说明的岗位说明书。`;

    // Clause 3: Wages and Payment
    const c3Kh = `ប្រាក់ឈ្នួលគោល ${formData.basicSalaryUsd ? formData.basicSalaryUsd.toLocaleString() : '__________'} ដុល្លារ/ខែ ឬ ${formData.basicSalaryKhr ? formData.basicSalaryKhr.toLocaleString() : '__________'} រៀល/ខែ មិនទាបជាងកម្រិតអប្បបរមាដែលអនុវត្ត។ ការទូទាត់ធ្វើនៅថ្ងៃទី ${formData.paymentDay || '01-05'} តាមរយៈ ${formData.paymentMethod || 'Bank Transfer / Cash'}។ ប្រាក់ថែមម៉ោង និងអត្ថប្រយោជន៍ត្រូវអនុវត្តតាមច្បាប់។`;
    const c3En = `Basic wage USD ${formData.basicSalaryUsd ? formData.basicSalaryUsd.toLocaleString() : '__________'}/month or KHR ${formData.basicSalaryKhr ? formData.basicSalaryKhr.toLocaleString() : '__________'}/month, not below the applicable minimum. Payment date(s) ${formData.paymentDay || '01-05'} via ${formData.paymentMethod || 'Bank Transfer / Cash'}. Overtime and benefits follow applicable law.`;
    const c3Zh = `基本工资每月 ${formData.basicSalaryUsd ? formData.basicSalaryUsd.toLocaleString() : '__________'} 美元或 ${formData.basicSalaryKhr ? formData.basicSalaryKhr.toLocaleString() : '__________'} 瑞尔，不低于适用最低工资。发薪日期 ${formData.paymentDay || '01-05'}，支付方式 ${formData.paymentMethod || '银行转账/现金'}。加班费及福利依法执行。`;

    // Clause 4: Working Hours & Rest
    const c4Kh = `ម៉ោងធ្វើការ ${formData.workingHours || '07:00 ដល់ 11:00 / 13:00 ដល់ 17:00'}; សម្រាកអាហារ ${formData.mealBreak || '11:00 ដល់ 13:00'}; ថ្ងៃធ្វើការ ${formData.workingDays || 'ច័ន្ទ ដល់ សៅរ៍'}។ ម៉ោងធ្វើការធម្មតាមិនលើស ៨ ម៉ោងក្នុងមួយថ្ងៃ និង ៤៨ ម៉ោងក្នុងមួយសប្តាហ៍។ ការថែមម៉ោងត្រូវធ្វើតាមច្បាប់។`;
    const c4En = `Work hours ${formData.workingHours || '07:00 to 11:00 / 13:00 to 17:00'}; meal break ${formData.mealBreak || '11:00 to 13:00'}; working days ${formData.workingDays || 'Monday to Saturday'} . Normal hours shall not exceed 8 per day and 48 per week. Overtime follows the law.`;
    const c4Zh = `工作时间 ${formData.workingHours || '07:00至11:00 / 13:00至17:00'}；用餐休息 ${formData.mealBreak || '11:00至13:00'}；工作日 ${formData.workingDays || '周一至周六'}。正常工作时间每日不超过8小时、每周不超过48小时。加班依法安排。`;

    // Clause 5: Leave & Social Security
    const c5Kh = `កម្មករនិយោជិតមានសិទ្ធិទទួលបានថ្ងៃឈប់សម្រាកប្រចាំសប្តាហ៍ ថ្ងៃបុណ្យមានប្រាក់ឈ្នួល ការឈប់សម្រាកប្រចាំឆ្នាំ និងការឈប់សម្រាកផ្សេងៗតាមច្បាប់។ និយោជកអនុវត្តកាតព្វកិច្ច ប.ស.ស. តាមបទប្បញ្ញត្តិ។`;
    const c5En = `The employee receives weekly rest, paid public holidays, annual leave and other statutory leave. The employer meets applicable NSSF obligations.`;
    const c5Zh = `员工依法享有每周休息、带薪法定节假日、年假及其他假期。雇主依法履行国家社会保障基金（NSSF）义务。`;

    // Clause 6: Safety, Health & Discipline
    const c6Kh = `និយោជកផ្តល់បរិយាកាសការងារមានសុវត្ថិភាព និងឧបករណ៍ការពារដែលចាំបាច់។ កម្មករនិយោជិតគោរពនីតិវិធីសុវត្ថិភាព បទបញ្ជាផ្ទៃក្នុងស្របច្បាប់ និងមានសិទ្ធិប្តឹងតវ៉ាដោយគ្មានការសងសឹក។`;
    const c6En = `The employer provides a safe workplace and necessary protective equipment. The employee follows lawful safety procedures and internal rules and may raise grievances without retaliation.`;
    const c6Zh = `雇主提供安全工作环境及必要防护用品。员工遵守合法安全程序和内部规章，并有权提出申诉且不受报复。`;

    // Clause 7: Non-discrimination
    const c7Kh = `ការងារធ្វើឡើងដោយស្ម័គ្រចិត្ត គ្មានការបង្ខិតបង្ខំ ការរើសអើង ឬការរក្សាទុកឯកសារផ្ទាល់ខ្លួនដោយខុសច្បាប់។`;
    const c7En = `Employment is voluntary, without forced labour, discrimination or unlawful retention of personal documents.`;
    const c7Zh = `雇佣属自愿性质，禁止强迫劳动、歧视或非法扣留个人证件。`;

    // Clause 8: Dispute Resolution
    const c8Kh = `វិវាទត្រូវដោះស្រាយតាមការពិភាក្សា និងយន្តការស្របច្បាប់នៅកម្ពុជា។ ប្រសិនបើលក្ខខណ្ឌណាមួយផ្ទុយច្បាប់ការងារ ត្រូវអនុវត្តច្បាប់ ឬលក្ខខណ្ឌដែលផ្តល់អត្ថប្រយោជន៍ល្អជាងដល់កម្មករនិយោជិត។`;
    const c8En = `Disputes shall be handled through dialogue and lawful Cambodian mechanisms. Where a term conflicts with labour law, the law or more favourable employee entitlement prevails.`;
    const c8Zh = `争议通过协商及柬埔寨合法机制解决。合同条款与劳动法冲突时，以法律或对员工更有利的条件为准。`;

    return {
      c1: { kh: c1Kh, en: c1En, zh: c1Zh },
      c2: { kh: c2Kh, en: c2En, zh: c2Zh },
      c3: { kh: c3Kh, en: c3En, zh: c3Zh },
      c4: { kh: c4Kh, en: c4En, zh: c4Zh },
      c5: { kh: c5Kh, en: c5En, zh: c5Zh },
      c6: { kh: c6Kh, en: c6En, zh: c6Zh },
      c7: { kh: c7Kh, en: c7En, zh: c7Zh },
      c8: { kh: c8Kh, en: c8En, zh: c8Zh },
    };
  }, [formData, currentGender]);

  // Function to translate a single clause into all 3 languages
  const handleTranslateClause = async (clauseNum: number) => {
    try {
      setTranslatingClause(clauseNum);
      const khKey = `clause${clauseNum}BodyKh` as keyof ContractFormData;
      const enKey = `clause${clauseNum}BodyEn` as keyof ContractFormData;
      const zhKey = `clause${clauseNum}BodyZh` as keyof ContractFormData;

      const khVal = (formData[khKey] as string) || '';
      const enVal = (formData[enKey] as string) || '';
      const zhVal = (formData[zhKey] as string) || '';
      const defObj = (defaultClauses as any)[`c${clauseNum}`];

      // Prioritize the language that was explicitly entered
      let sourceText = khVal || enVal || zhVal || defObj.kh;
      let sourceLang = khVal ? 'km' : enVal ? 'en' : zhVal ? 'zh-CN' : 'auto';

      const res = await fetch('/api/contracts/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: sourceText, sourceLang }),
      });

      const data = await res.json();
      if (data.success) {
        setFormData((prev) => ({
          ...prev,
          [khKey]: data.km || khVal || defObj.kh,
          [enKey]: data.en || enVal || defObj.en,
          [zhKey]: data.zh || zhVal || defObj.zh,
        }));
      }
    } catch (err) {
      console.error('Translation error:', err);
    } finally {
      setTranslatingClause(null);
    }
  };

  // Function to translate ALL clauses into all 3 languages
  const handleTranslateAllClauses = async () => {
    try {
      setIsTranslatingAll(true);
      const updated = { ...formData };

      for (let i = 1; i <= 8; i++) {
        const khKey = `clause${i}BodyKh` as keyof ContractFormData;
        const enKey = `clause${i}BodyEn` as keyof ContractFormData;
        const zhKey = `clause${i}BodyZh` as keyof ContractFormData;

        const khVal = (formData[khKey] as string) || '';
        const enVal = (formData[enKey] as string) || '';
        const zhVal = (formData[zhKey] as string) || '';
        const defObj = (defaultClauses as any)[`c${i}`];

        const sourceText = khVal || enVal || zhVal || defObj.kh;
        const sourceLang = khVal ? 'km' : enVal ? 'en' : zhVal ? 'zh-CN' : 'auto';

        const res = await fetch('/api/contracts/translate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: sourceText, sourceLang }),
        });
        const data = await res.json();
        if (data.success) {
          (updated as any)[khKey] = data.km || khVal || defObj.kh;
          (updated as any)[enKey] = data.en || enVal || defObj.en;
          (updated as any)[zhKey] = data.zh || zhVal || defObj.zh;
        }
      }

      setFormData(updated);
      Swal.fire({
        icon: 'success',
        title: 'បកប្រែជោគជ័យ / Translation Complete',
        text: 'រាល់ខសន្យាទាំងអស់ត្រូវបានបកប្រែ និងរត់ចូលទាំង ៣ ភាសាដោយស្វ័យប្រវត្តិ!',
        timer: 2000,
        showConfirmButton: false,
      });
    } catch (err) {
      console.error('Translate all error:', err);
    } finally {
      setIsTranslatingAll(false);
    }
  };

  // Function to pre-fill all 8 clauses with MLVT standard text in 3 languages
  const handleLoadDefaultClauses = () => {
    setFormData((prev) => ({
      ...prev,
      clause1BodyKh: defaultClauses.c1.kh,
      clause1BodyEn: defaultClauses.c1.en,
      clause1BodyZh: defaultClauses.c1.zh,
      clause2BodyKh: defaultClauses.c2.kh,
      clause2BodyEn: defaultClauses.c2.en,
      clause2BodyZh: defaultClauses.c2.zh,
      clause3BodyKh: defaultClauses.c3.kh,
      clause3BodyEn: defaultClauses.c3.en,
      clause3BodyZh: defaultClauses.c3.zh,
      clause4BodyKh: defaultClauses.c4.kh,
      clause4BodyEn: defaultClauses.c4.en,
      clause4BodyZh: defaultClauses.c4.zh,
      clause5BodyKh: defaultClauses.c5.kh,
      clause5BodyEn: defaultClauses.c5.en,
      clause5BodyZh: defaultClauses.c5.zh,
      clause6BodyKh: defaultClauses.c6.kh,
      clause6BodyEn: defaultClauses.c6.en,
      clause6BodyZh: defaultClauses.c6.zh,
      clause7BodyKh: defaultClauses.c7.kh,
      clause7BodyEn: defaultClauses.c7.en,
      clause7BodyZh: defaultClauses.c7.zh,
      clause8BodyKh: defaultClauses.c8.kh,
      clause8BodyEn: defaultClauses.c8.en,
      clause8BodyZh: defaultClauses.c8.zh,
    }));
    Swal.fire({
      icon: 'info',
      title: 'បានផ្ទុកខ្លឹមសារស្តង់ដារ ៣ ភាសា',
      text: 'ខ្លឹមសារខសន្យាទាំង ៨ ត្រូវបានបំពេញរួចរាល់ជា ភាសាខ្មែរ អង់គ្លេស និងចិន។',
      timer: 2000,
      showConfirmButton: false,
    });
  };

  // Standard Trilingual Table Header component
  const Th = ({
    kh,
    en,
    zh,
    minW = 'auto',
    align = 'left',
  }: {
    kh: string;
    en: string;
    zh: string;
    minW?: string;
    align?: 'left' | 'center' | 'right';
  }) => (
    <th
      style={{
        padding: '6px 10px',
        borderBottom: '2px solid #cbd5e1',
        borderRight: '1px solid #e2e8f0',
        verticalAlign: 'middle',
        minWidth: minW,
        position: 'sticky',
        top: 0,
        backgroundColor: '#f1f5f9',
        zIndex: 10,
        textAlign: align,
        boxShadow: '0 1px 2px rgba(0,0,0,0.06)',
        whiteSpace: 'nowrap',
      }}
    >
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '1px',
          alignItems: align === 'center' ? 'center' : align === 'right' ? 'flex-end' : 'flex-start',
          lineHeight: 1.2,
        }}
      >
        <span style={{ fontSize: '0.84rem', fontWeight: 700, color: '#0f172a' }}>{kh}</span>
        <span style={{ fontSize: '0.71rem', fontWeight: 500, color: '#334155' }}>{en}</span>
        <span style={{ fontSize: '0.71rem', fontWeight: 500, color: '#64748b' }}>{zh}</span>
      </div>
    </th>
  );

  return (
    <div className={styles.container}>
      {/* --- 1. ULTRA-COMPACT SLIM HEADER BAR (FIT-CONTENT) --- */}
      <div className={styles.headerCard}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <span style={{ fontSize: '1.4rem' }}>📜</span>
          <h1 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0, lineHeight: 1.3 }}>
            កិច្ចសន្យាការងារ & Smart Alert (៣ ភាសា)
          </h1>
          <span style={{ fontSize: '0.78rem', opacity: 0.85, marginLeft: '4px' }}>
            Contracts • 劳动合同管理
          </span>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <button
            onClick={handleSendTelegramAlerts}
            disabled={isSendingTelegram}
            style={{
              background: 'rgba(255, 255, 255, 0.18)',
              color: '#ffffff',
              fontWeight: 600,
              padding: '0.45rem 0.9rem',
              borderRadius: '8px',
              border: '1px solid rgba(255,255,255,0.3)',
              cursor: 'pointer',
              fontSize: '0.85rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
            }}
          >
            <span>📢</span>
            {isSendingTelegram ? 'កំពុងផ្ញើ...' : 'ផ្ញើ Alert ទៅ Telegram'}
          </button>
          <button
            onClick={handleOpenNewModal}
            style={{
              background: '#ffffff',
              color: '#1e3a8a',
              fontWeight: 700,
              padding: '0.45rem 1.1rem',
              borderRadius: '8px',
              border: 'none',
              cursor: 'pointer',
              fontSize: '0.88rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              boxShadow: '0 2px 6px rgba(0,0,0,0.12)',
            }}
          >
            <span>➕</span>
            បង្កើតកិច្ចសន្យាថ្មី (New Contract)
          </button>
        </div>
      </div>

      {/* --- 2. ULTRA-COMPACT SMART ALERT STRIP (SLIM CHIPS BAR) --- */}
      <div className={styles.alertStrip}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontWeight: 700, fontSize: '0.82rem', color: '#1e293b', marginRight: '0.25rem' }}>
          <span>🚨</span>
          <span>Alerts:</span>
        </div>

        {/* Chip 1: FDC Notice */}
        <div
          onClick={() => {
            setAlertFilterCategory(alertFilterCategory === 'FDC_NOTICE' ? 'ALL' : 'FDC_NOTICE');
            setCurrentPage(1);
          }}
          className={styles.alertChip}
          style={{
            background: alertFilterCategory === 'FDC_NOTICE' ? '#fef2f2' : '#fff1f2',
            borderColor: alertFilterCategory === 'FDC_NOTICE' ? '#ef4444' : '#fecdd3',
            color: '#991b1b',
          }}
          title="កិច្ចសន្យា FDC ត្រូវជូនដំណឹង ១០-១៥ ថ្ងៃ (មាត្រា ៧៣) / FDC Notice Due"
        >
          <span>🔔 FDC ត្រូវជូនដំណឹង (10-15d)</span>
          <span style={{ background: '#ef4444', color: '#ffffff', padding: '0.1rem 0.45rem', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 700 }}>
            {alertStats.fdcNoticeCount}
          </span>
        </div>

        {/* Chip 2: Foreign WP & Visa */}
        <div
          onClick={() => {
            setAlertFilterCategory(alertFilterCategory === 'FOREIGN_WP_VISA' ? 'ALL' : 'FOREIGN_WP_VISA');
            setCurrentPage(1);
          }}
          className={styles.alertChip}
          style={{
            background: alertFilterCategory === 'FOREIGN_WP_VISA' ? '#f5f3ff' : '#f3e8ff',
            borderColor: alertFilterCategory === 'FOREIGN_WP_VISA' ? '#7c3aed' : '#ddd6fe',
            color: '#5b21b6',
          }}
          title="Work Permit & Visa ជនបរទេស ៣០-៦០ ថ្ងៃ (រៀបចំ MLVT) / Foreign WP & Visa"
        >
          <span>🌐 Work Permit & Visa (30-60d)</span>
          <span style={{ background: '#7c3aed', color: '#ffffff', padding: '0.1rem 0.45rem', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 700 }}>
            {alertStats.foreignWpCount + alertStats.foreignVisaCount}
          </span>
        </div>

        {/* Chip 3: Probation Ending */}
        <div
          onClick={() => {
            setAlertFilterCategory(alertFilterCategory === 'PROBATION' ? 'ALL' : 'PROBATION');
            setCurrentPage(1);
          }}
          className={styles.alertChip}
          style={{
            background: alertFilterCategory === 'PROBATION' ? '#fffbeb' : '#fef3c7',
            borderColor: alertFilterCategory === 'PROBATION' ? '#d97706' : '#fde68a',
            color: '#92400e',
          }}
          title="សាកល្បងការងារជិតចប់ នៅសល់ ≤ ៧ ថ្ងៃ / Probation Ending ≤ 7 Days"
        >
          <span>⏳ សាកល្បងជិតចប់ (≤ 7d)</span>
          <span style={{ background: '#d97706', color: '#ffffff', padding: '0.1rem 0.45rem', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 700 }}>
            {alertStats.probationCount}
          </span>
        </div>

        {/* Chip 4: Expired */}
        <div
          onClick={() => {
            setAlertFilterCategory(alertFilterCategory === 'EXPIRED' ? 'ALL' : 'EXPIRED');
            setCurrentPage(1);
          }}
          className={styles.alertChip}
          style={{
            background: alertFilterCategory === 'EXPIRED' ? '#f1f5f9' : '#f8fafc',
            borderColor: alertFilterCategory === 'EXPIRED' ? '#475569' : '#e2e8f0',
            color: '#334155',
          }}
          title="កិច្ចសន្យាបានផុតកំណត់កាលបរិច្ឆេទហើយ / Expired Contracts"
        >
          <span>⚠️ ផុតកំណត់ហើយ</span>
          <span style={{ background: '#475569', color: '#ffffff', padding: '0.1rem 0.45rem', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 700 }}>
            {alertStats.expiredCount}
          </span>
        </div>

        {alertFilterCategory !== 'ALL' && (
          <button
            onClick={() => {
              setAlertFilterCategory('ALL');
              setCurrentPage(1);
            }}
            style={{
              background: '#e0f2fe',
              color: '#0369a1',
              border: 'none',
              padding: '0.25rem 0.6rem',
              borderRadius: '6px',
              fontSize: '0.75rem',
              fontWeight: 700,
              cursor: 'pointer',
              marginLeft: 'auto',
            }}
          >
            សម្អាត Filter (Reset) ✕
          </button>
        )}
      </div>

      {/* --- 3. TABLE CARD & TOOLBAR (FIT CONTENT & HIGH CAPACITY) --- */}
      <div className={styles.tableCard}>
        {/* Compact Toolbar */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '0.6rem',
            marginBottom: '0.65rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <h2 style={{ fontSize: '1.05rem', fontWeight: 700, margin: 0, color: '#0f172a' }}>
              បញ្ជីកិច្ចសន្យាការងារ (Issued Contracts)
            </h2>
            <span
              style={{
                background: '#e0f2fe',
                color: '#0369a1',
                padding: '0.15rem 0.55rem',
                borderRadius: '16px',
                fontSize: '0.8rem',
                fontWeight: 700,
              }}
            >
              {fullyFilteredContracts.length.toLocaleString()} កុងត្រា
            </span>
          </div>

          {/* Filter Inputs (Search, Dept, Contract Type) */}
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
            <input
              type="text"
              placeholder="ស្វែងរកតាមលេខកុងត្រា ឈ្មោះ អត្តលេខ..."
              value={tableSearchText}
              onChange={(e) => {
                setTableSearchText(e.target.value);
                setCurrentPage(1);
              }}
              style={{
                padding: '0.45rem 0.75rem',
                borderRadius: '6px',
                border: '1px solid #cbd5e1',
                fontSize: '0.85rem',
                fontFamily: 'inherit',
                width: '240px',
              }}
            />

            {/* Department Filter for 1000+ workers */}
            <select
              value={deptFilter}
              onChange={(e) => {
                setDeptFilter(e.target.value);
                setCurrentPage(1);
              }}
              style={{
                padding: '0.45rem 0.65rem',
                borderRadius: '6px',
                border: '1px solid #cbd5e1',
                fontSize: '0.85rem',
                fontFamily: 'inherit',
                background: '#ffffff',
                maxWidth: '180px',
              }}
            >
              <option value="ALL">គ្រប់ផ្នែក (All Depts / 部门)</option>
              {departmentList.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>

            {/* Contract Type Filter */}
            <select
              value={tableFilterType}
              onChange={(e) => {
                setTableFilterType(e.target.value);
                setCurrentPage(1);
              }}
              style={{
                padding: '0.45rem 0.65rem',
                borderRadius: '6px',
                border: '1px solid #cbd5e1',
                fontSize: '0.85rem',
                fontFamily: 'inherit',
                background: '#ffffff',
              }}
            >
              <option value="ALL">គ្រប់ប្រភេទ (All Types / 全部)</option>
              <option value="FDC">កិច្ចសន្យាមានកំណត់ (FDC)</option>
              <option value="UDC">កិច្ចសន្យាមិនកំណត់ (UDC)</option>
              <option value="PROBATION">សាកល្បងការងារ (Probation)</option>
              <option value="FOREIGN_FDC">បុគ្គលិកជនបរទេស (Foreign)</option>
            </select>
          </div>
        </div>

        {/* Scrollable Table Area with Sticky Trilingual Header */}
        <div className={styles.tableScrollArea}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.83rem', whiteSpace: 'nowrap' }}>
            <thead>
              <tr>
                <Th kh="ល.រ" en="No." zh="序号" minW="45px" align="center" />
                <Th kh="លេខកុងត្រា" en="Contract No." zh="合同编号" minW="135px" />
                <Th kh="បុគ្គលិក" en="Employee" zh="员工姓名" minW="180px" />
                <Th kh="ប្រភេទ" en="Type" zh="类型" minW="85px" align="center" />
                <Th kh="មុខតំណែង & ផ្នែក" en="Position & Dept" zh="职务与部门" minW="135px" />
                <Th kh="ថិរវេលា (ចាប់ផ្តើម - បញ្ចប់)" en="Duration (Start - End)" zh="合同期限 (起止)" minW="150px" />
                <Th kh="ស្ថានភាពដាស់តឿន" en="Smart Alert" zh="预警状态" minW="175px" align="center" />
                <Th kh="ប្រាក់ឈ្នួលគោល" en="Basic Salary" zh="基本底薪" minW="100px" align="right" />
                <Th kh="សកម្មភាព" en="Actions" zh="操作" minW="110px" align="center" />
              </tr>
            </thead>
            <tbody>
              {paginatedContracts.length === 0 ? (
                <tr>
                  <td colSpan={9} style={{ textAlign: 'center', padding: '2.5rem', color: '#94a3b8' }}>
                    មិនមានកិច្ចសន្យាត្រូវតាមការស្វែងរក ឬ Filter ឡើយ។
                  </td>
                </tr>
              ) : (
                paginatedContracts.map((c, index) => {
                  const meta = CONTRACT_TYPE_METADATA[c.contractType] || CONTRACT_TYPE_METADATA.FDC;
                  const alerts = contractAlertsMap.get(c.id) || [];
                  const primaryAlert = alerts[0];
                  const rowNumber = (currentPage - 1) * (pageSize === -1 ? 0 : pageSize) + index + 1;

                  return (
                    <tr
                      key={c.id}
                      style={{
                        borderBottom: '1px solid #f1f5f9',
                        transition: 'background 0.15s',
                        background: index % 2 === 1 ? '#fafafa' : '#ffffff',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = '#f0f9ff')}
                      onMouseLeave={(e) => (e.currentTarget.style.background = index % 2 === 1 ? '#fafafa' : '#ffffff')}
                    >
                      {/* 1. Row Number */}
                      <td style={{ padding: '6px 10px', textAlign: 'center', color: '#64748b', fontWeight: 500, borderRight: '1px solid #f1f5f9' }}>
                        {rowNumber}
                      </td>

                      {/* 2. Contract No */}
                      <td style={{ padding: '6px 10px', fontWeight: 600, color: '#1e3a8a', borderRight: '1px solid #f1f5f9' }}>
                        {c.contractNo}
                      </td>

                      {/* 3. Employee Name & ID */}
                      <td style={{ padding: '6px 10px', borderRight: '1px solid #f1f5f9' }}>
                        <div style={{ fontWeight: 600, color: '#0f172a' }}>
                          {c.employee.lastNameKh} {c.employee.firstNameKh} ({c.employee.firstNameEn} {c.employee.lastNameEn})
                        </div>
                        <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                          អត្តលេខ: <strong>{c.employee.employeeId}</strong> {c.isForeigner && '🌐 (ជនបរទេស/外籍)'}
                        </div>
                      </td>

                      {/* 4. Contract Type Badge */}
                      <td style={{ padding: '6px 10px', textAlign: 'center', borderRight: '1px solid #f1f5f9' }}>
                        <span
                          style={{
                            background: meta.badgeBg,
                            color: meta.badgeColor,
                            padding: '0.2rem 0.55rem',
                            borderRadius: '10px',
                            fontWeight: 700,
                            fontSize: '0.75rem',
                            display: 'inline-block',
                          }}
                        >
                          {c.contractType}
                        </span>
                      </td>

                      {/* 5. Position & Dept */}
                      <td style={{ padding: '6px 10px', borderRight: '1px solid #f1f5f9' }}>
                        <div style={{ fontWeight: 600 }}>{c.positionTitle}</div>
                        <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{c.department}</div>
                      </td>

                      {/* 6. Duration (Start - End) */}
                      <td style={{ padding: '6px 10px', borderRight: '1px solid #f1f5f9' }}>
                        <div>{formatContractDate(c.startDate)}</div>
                        <div style={{ fontSize: '0.75rem', color: c.contractType === 'UDC' ? '#059669' : '#64748b' }}>
                          ➔ {c.contractType === 'UDC' ? 'គ្មានកំណត់ (UDC/无固定期)' : formatContractDate(c.endDate)}
                        </div>
                      </td>

                      {/* 7. Smart Alert Pill */}
                      <td style={{ padding: '6px 10px', textAlign: 'center', borderRight: '1px solid #f1f5f9' }}>
                        {primaryAlert ? (
                          <div
                            style={{
                              background:
                                primaryAlert.alertLevel === 'CRITICAL'
                                  ? '#fee2e2'
                                  : primaryAlert.alertLevel === 'WARNING'
                                  ? '#fef3c7'
                                  : '#f1f5f9',
                              color:
                                primaryAlert.alertLevel === 'CRITICAL'
                                  ? '#b91c1c'
                                  : primaryAlert.alertLevel === 'WARNING'
                                  ? '#b45309'
                                  : '#475569',
                              padding: '0.25rem 0.55rem',
                              borderRadius: '6px',
                              fontSize: '0.75rem',
                              fontWeight: 700,
                              display: 'inline-block',
                              maxWidth: '220px',
                            }}
                            title={primaryAlert.messageKh}
                          >
                            <div>{primaryAlert.titleKh}</div>
                            <div style={{ fontSize: '0.7rem', fontWeight: 500 }}>
                              {primaryAlert.daysRemaining >= 0
                                ? `នៅសល់ ${primaryAlert.daysRemaining} ថ្ងៃ`
                                : `ហួស ${Math.abs(primaryAlert.daysRemaining)} ថ្ងៃ`}
                            </div>
                          </div>
                        ) : (
                          <span
                            style={{
                              background: '#ecfdf5',
                              color: '#059669',
                              padding: '0.2rem 0.5rem',
                              borderRadius: '6px',
                              fontSize: '0.75rem',
                              fontWeight: 600,
                            }}
                          >
                            ✓ មានសុពលភាព (Active/有效)
                          </span>
                        )}
                      </td>

                      {/* 8. Basic Wage */}
                      <td style={{ padding: '6px 10px', textAlign: 'right', fontWeight: 700, color: '#0f172a', borderRight: '1px solid #f1f5f9' }}>
                        ${c.basicSalaryUsd.toLocaleString()} USD
                      </td>

                      {/* 9. Action Buttons */}
                      <td style={{ padding: '6px 10px', textAlign: 'center' }}>
                        <button
                          onClick={() => {
                            setFormData({
                              id: c.id,
                              contractNo: c.contractNo,
                              revision: '01',
                              contractType: c.contractType,
                              signedAtLocation: c.signedAtLocation || 'Phnom Penh',
                              signedDate: c.signedDate ? new Date(c.signedDate).toISOString().split('T')[0] : '',
                              startDate: c.startDate ? new Date(c.startDate).toISOString().split('T')[0] : '',
                              endDate: c.endDate ? new Date(c.endDate).toISOString().split('T')[0] : '',
                              companyName: defaultCompanyName,
                              companyAddress: defaultAddress,
                              representative: 'Mr. General Manager',
                              representativeRole: 'General Director / អគ្គនាយក / 总经理',
                              employeeId: c.employee.employeeId,
                              employeeNameKh: `${c.employee.lastNameKh || ''} ${c.employee.firstNameKh || ''}`.trim(),
                              employeeNameEn: `${c.employee.firstNameEn} ${c.employee.lastNameEn}`.trim(),
                              gender: c.employee.gender,
                              dob: c.employee.dob ? new Date(c.employee.dob).toISOString().split('T')[0] : '',
                              nationalIdOrPassport: c.employee.nationalId || '',
                              address: c.employee.address || defaultAddress,
                              nationality: c.employee.nationality || 'Cambodian',
                              isForeigner: c.isForeigner,
                              passportNo: c.passportNo || '',
                              passportExpiry: c.passportExpiry ? new Date(c.passportExpiry).toISOString().split('T')[0] : '',
                              visaNo: c.visaNo || '',
                              visaExpiry: c.visaExpiry ? new Date(c.visaExpiry).toISOString().split('T')[0] : '',
                              workPermitNo: c.workPermitNo || '',
                              workPermitExpiry: c.workPermitExpiry ? new Date(c.workPermitExpiry).toISOString().split('T')[0] : '',
                              positionTitle: c.positionTitle,
                              department: c.department,
                              workplace: defaultAddress,
                              basicSalaryUsd: c.basicSalaryUsd,
                              basicSalaryKhr: c.basicSalaryKhr,
                              paymentDay: '01-05',
                              paymentMethod: 'Bank Transfer / ផ្ទេរតាមធនាគារ / 银行转账',
                              workingHours: '07:00 - 11:00 / 13:00 - 17:00',
                              mealBreak: '11:00 - 13:00',
                              workingDays: 'ច័ន្ទ ដល់ សៅរ៍ / Monday to Saturday / 周一至周六',
                            });
                            setActiveTab('preview');
                            setIsModalOpen(true);
                          }}
                          style={{
                            background: '#eff6ff',
                            color: '#2563eb',
                            border: '1px solid #bfdbfe',
                            borderRadius: '6px',
                            padding: '0.3rem 0.65rem',
                            fontWeight: 600,
                            cursor: 'pointer',
                            fontSize: '0.78rem',
                          }}
                        >
                          👁️ មើល / កែប្រែ
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* --- 4. COMPACT PAGINATION FOOTER (FOR 1000+ EMPLOYEES) --- */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginTop: '0.65rem',
            paddingTop: '0.45rem',
            borderTop: '1px solid #f1f5f9',
            flexWrap: 'wrap',
            gap: '0.75rem',
          }}
        >
          {/* Record range */}
          <div style={{ fontSize: '0.82rem', color: '#475569' }}>
            បង្ហាញ <strong>{fullyFilteredContracts.length === 0 ? 0 : (currentPage - 1) * (pageSize === -1 ? 0 : pageSize) + 1}</strong> -{' '}
            <strong>{pageSize === -1 ? fullyFilteredContracts.length : Math.min(currentPage * pageSize, fullyFilteredContracts.length)}</strong> នៃ{' '}
            <strong>{fullyFilteredContracts.length.toLocaleString()}</strong> កុងត្រា
            <span style={{ color: '#94a3b8', marginLeft: '6px' }}>
              / Showing {fullyFilteredContracts.length === 0 ? 0 : (currentPage - 1) * (pageSize === -1 ? 0 : pageSize) + 1}-
              {pageSize === -1 ? fullyFilteredContracts.length : Math.min(currentPage * pageSize, fullyFilteredContracts.length)} of{' '}
              {fullyFilteredContracts.length.toLocaleString()} / 共 {fullyFilteredContracts.length.toLocaleString()} 条
            </span>
          </div>

          {/* Page Size & Navigation Controls */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
            {/* Per page selector */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.8rem', color: '#475569' }}>
              <span>ក្នុង១ទំព័រ / Per page:</span>
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setCurrentPage(1);
                }}
                style={{
                  padding: '0.25rem 0.5rem',
                  borderRadius: '5px',
                  border: '1px solid #cbd5e1',
                  fontSize: '0.8rem',
                  background: '#ffffff',
                  fontWeight: 600,
                }}
              >
                <option value={15}>15</option>
                <option value={30}>30</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
                <option value={200}>200</option>
                <option value={-1}>ទាំងអស់ (All)</option>
              </select>
            </div>

            {/* Navigation buttons */}
            {pageSize !== -1 && totalPages > 1 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                <button
                  onClick={() => setCurrentPage(1)}
                  disabled={currentPage === 1}
                  style={{
                    padding: '0.25rem 0.5rem',
                    borderRadius: '5px',
                    border: '1px solid #cbd5e1',
                    background: currentPage === 1 ? '#f8fafc' : '#ffffff',
                    cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                    fontSize: '0.75rem',
                  }}
                  title="ទំព័រដំបូង / First / 第一页"
                >
                  ««
                </button>
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  style={{
                    padding: '0.25rem 0.55rem',
                    borderRadius: '5px',
                    border: '1px solid #cbd5e1',
                    background: currentPage === 1 ? '#f8fafc' : '#ffffff',
                    cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                  }}
                >
                  ◄ ថយ / Prev
                </button>
                <span style={{ padding: '0 0.4rem', fontSize: '0.82rem', fontWeight: 700, color: '#1e3a8a' }}>
                  {currentPage} / {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  style={{
                    padding: '0.25rem 0.55rem',
                    borderRadius: '5px',
                    border: '1px solid #cbd5e1',
                    background: currentPage === totalPages ? '#f8fafc' : '#ffffff',
                    cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                  }}
                >
                  បន្ទាប់ / Next ►
                </button>
                <button
                  onClick={() => setCurrentPage(totalPages)}
                  disabled={currentPage === totalPages}
                  style={{
                    padding: '0.25rem 0.5rem',
                    borderRadius: '5px',
                    border: '1px solid #cbd5e1',
                    background: currentPage === totalPages ? '#f8fafc' : '#ffffff',
                    cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                    fontSize: '0.75rem',
                  }}
                  title="ទំព័រចុងក្រោយ / Last / 最后一页"
                >
                  »»
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal Contract Editor / Previewer */}
      {isModalOpen && mounted && createPortal(
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            {/* Modal Header - Ultra-clean Fit-Content with Trilingual Contract Selector & Controls */}
            <div className={styles.modalHeader}>
              {/* Left: Contract Type Dropdown with Trilingual labels */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0 }}>
                <span style={{ fontSize: '1.4rem' }}>📜</span>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                    <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#1e3a8a', whiteSpace: 'nowrap' }}>
                      ប្រភេទកុងត្រា (Type):
                    </label>
                    <select
                      value={formData.contractType}
                      onChange={(e) => handleContractTypeChange(e.target.value as ContractType)}
                      style={{
                        padding: '0.35rem 0.65rem',
                        borderRadius: '7px',
                        border: '1.5px solid #2563eb',
                        fontSize: '0.84rem',
                        fontWeight: 700,
                        background: '#eff6ff',
                        color: '#1e3a8a',
                        cursor: 'pointer',
                        outline: 'none',
                      }}
                    >
                      <option value="FDC">១. កិច្ចសន្យាមានកំណត់ថិរវេលា (FDC - Fixed Duration)</option>
                      <option value="PROBATION">២. កិច្ចសន្យាសាកល្បងការងារ (Probation Contract)</option>
                      <option value="UDC">៣. កិច្ចសន្យាមានថិរវេលាមិនកំណត់ (UDC - Undetermined Duration)</option>
                      <option value="FOREIGN_FDC">៤. កិច្ចសន្យាការងារបុគ្គលិកជនបរទេស (Foreign Expat Contract)</option>
                    </select>
                  </div>
                  <div style={{ fontSize: '0.71rem', color: '#64748b', fontWeight: 600, marginTop: '2px' }}>
                    {currentMeta.nameKh} • {currentMeta.nameEn} • {currentMeta.nameZh}
                  </div>
                </div>
              </div>

              {/* Center: Navigation Tabs */}
              <div
                style={{
                  display: 'flex',
                  gap: '0.3rem',
                  background: '#f1f5f9',
                  padding: '3px',
                  borderRadius: '8px',
                  border: '1px solid #e2e8f0',
                  flexShrink: 0,
                }}
              >
                <button
                  onClick={() => setActiveTab('preview')}
                  style={{
                    padding: '0.35rem 0.75rem',
                    borderRadius: '6px',
                    border: 'none',
                    fontWeight: activeTab === 'preview' ? 700 : 500,
                    cursor: 'pointer',
                    fontSize: '0.82rem',
                    background: activeTab === 'preview' ? '#ffffff' : 'transparent',
                    color: activeTab === 'preview' ? '#1e3a8a' : '#64748b',
                    boxShadow: activeTab === 'preview' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                    whiteSpace: 'nowrap',
                  }}
                >
                  👁️ មើលជាមុន (Preview A4)
                </button>
                <button
                  onClick={() => setActiveTab('form')}
                  style={{
                    padding: '0.35rem 0.75rem',
                    borderRadius: '6px',
                    border: 'none',
                    fontWeight: activeTab === 'form' ? 700 : 500,
                    cursor: 'pointer',
                    fontSize: '0.82rem',
                    background: activeTab === 'form' ? '#ffffff' : 'transparent',
                    color: activeTab === 'form' ? '#1e3a8a' : '#64748b',
                    boxShadow: activeTab === 'form' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                    whiteSpace: 'nowrap',
                  }}
                >
                  ⚙️ កំណត់ព័ត៌មាន (Fill & Edit)
                </button>
                <button
                  onClick={() => setActiveTab('clauses')}
                  style={{
                    padding: '0.35rem 0.75rem',
                    borderRadius: '6px',
                    border: 'none',
                    fontWeight: activeTab === 'clauses' ? 700 : 500,
                    cursor: 'pointer',
                    fontSize: '0.82rem',
                    background: activeTab === 'clauses' ? '#ffffff' : 'transparent',
                    color: activeTab === 'clauses' ? '#1e3a8a' : '#64748b',
                    boxShadow: activeTab === 'clauses' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                    whiteSpace: 'nowrap',
                  }}
                >
                  ✏️ កែរអត្ថន័យខសន្យា (Clauses)
                </button>
              </div>

              {/* Right: Action Buttons */}
              <div style={{ display: 'flex', gap: '0.35rem', alignItems: 'center', flexShrink: 0 }}>
                <button
                  onClick={handlePrint}
                  style={{
                    background: '#1e293b',
                    color: '#ffffff',
                    border: 'none',
                    padding: '0.4rem 0.75rem',
                    borderRadius: '6px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                    fontSize: '0.8rem',
                    whiteSpace: 'nowrap',
                  }}
                >
                  🖨️ បោះពុម្ព (Print)
                </button>
                <button
                  onClick={handleExportWord}
                  style={{
                    background: '#2563eb',
                    color: '#ffffff',
                    border: 'none',
                    padding: '0.4rem 0.75rem',
                    borderRadius: '6px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                    fontSize: '0.8rem',
                    whiteSpace: 'nowrap',
                  }}
                >
                  📄 Word (.docx)
                </button>
                <button
                  onClick={handleSaveContract}
                  disabled={isSubmitting}
                  style={{
                    background: '#059669',
                    color: '#ffffff',
                    border: 'none',
                    padding: '0.4rem 0.75rem',
                    borderRadius: '6px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                    fontSize: '0.8rem',
                    whiteSpace: 'nowrap',
                  }}
                >
                  💾 រក្សាទុក (Save)
                </button>
                <button
                  onClick={() => setIsModalOpen(false)}
                  style={{
                    background: '#fee2e2',
                    color: '#dc2626',
                    border: '1px solid #fecaca',
                    padding: '0.4rem 0.75rem',
                    borderRadius: '6px',
                    fontWeight: 800,
                    cursor: 'pointer',
                    fontSize: '0.85rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                  title="បិទ (Close)"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className={styles.modalBody}>
              {/* TAB 1: FORM INPUTS (Auto-search & Fields) */}
              {activeTab === 'form' && (
                <div className={styles.formCard}>
                  <h3 style={{ borderBottom: '2px solid #e2e8f0', paddingBottom: '0.65rem', marginBottom: '1.25rem', color: '#1e3a8a', fontSize: '1.1rem' }}>
                    🔍 ១. ស្វែងរកបុគ្គលិកដោយស្វ័យប្រវត្តិ (Auto-fill Employee)
                  </h3>

                  <div style={{ position: 'relative', marginBottom: '1.25rem' }}>
                    <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.4rem', fontSize: '0.9rem' }}>
                      វាយបញ្ចូល អត្តលេខ / ឈ្មោះ (ខ្មែរ/ឡាតាំង) / លេខអត្តសញ្ញាណប័ណ្ណ៖
                    </label>
                    <input
                      type="text"
                      placeholder="ឧ. EMP-001 ឬ Sokha ឬ 010203..."
                      value={searchEmpQuery}
                      onChange={(e) => {
                        setSearchEmpQuery(e.target.value);
                        setIsEmpDropdownOpen(true);
                      }}
                      onFocus={() => setIsEmpDropdownOpen(true)}
                      style={{
                        width: '100%',
                        padding: '0.65rem 0.9rem',
                        borderRadius: '8px',
                        border: '2px solid #3b82f6',
                        fontSize: '0.95rem',
                      }}
                    />

                    {/* Auto-suggest dropdown */}
                    {isEmpDropdownOpen && filteredEmployees.length > 0 && (
                      <div
                        style={{
                          position: 'absolute',
                          top: '100%',
                          left: 0,
                          right: 0,
                          background: '#ffffff',
                          borderRadius: '8px',
                          boxShadow: '0 10px 25px rgba(0,0,0,0.15)',
                          border: '1px solid #cbd5e1',
                          zIndex: 50,
                          maxHeight: '260px',
                          overflowY: 'auto',
                          marginTop: '4px',
                        }}
                      >
                        {filteredEmployees.map((emp) => (
                          <div
                            key={emp.id}
                            onClick={() => handleSelectEmployee(emp)}
                            style={{
                              padding: '0.65rem 0.9rem',
                              borderBottom: '1px solid #f1f5f9',
                              cursor: 'pointer',
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              transition: 'background 0.15s',
                            }}
                            onMouseEnter={(e) => (e.currentTarget.style.background = '#eff6ff')}
                            onMouseLeave={(e) => (e.currentTarget.style.background = '#ffffff')}
                          >
                            <div>
                              <strong style={{ color: '#1e3a8a' }}>{emp.employeeId}</strong> -{' '}
                              {emp.lastNameKh} {emp.firstNameKh} ({emp.firstNameEn} {emp.lastNameEn})
                              <div style={{ fontSize: '0.78rem', color: '#64748b' }}>
                                ផ្នែក៖ {emp.department} • មុខតំណែង៖ {emp.position} • អត្តសញ្ញាណប័ណ្ណ៖{' '}
                                {emp.nationalId || 'N/A'}
                              </div>
                            </div>
                            <span
                              style={{
                                background: '#dbeafe',
                                color: '#1d4ed8',
                                padding: '0.2rem 0.55rem',
                                borderRadius: '12px',
                                fontSize: '0.75rem',
                                fontWeight: 600,
                              }}
                            >
                              ជ្រើសរើស ➔
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <h3 style={{ borderBottom: '2px solid #e2e8f0', paddingBottom: '0.65rem', margin: '1.75rem 0 1.25rem 0', color: '#1e3a8a', fontSize: '1.1rem' }}>
                    📋 ២. ប្រភេទកិច្ចសន្យា និងកាលបរិច្ឆេទ (Contract Type & Dates)
                  </h3>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem' }}>
                    <div>
                      <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.35rem', fontSize: '0.85rem' }}>
                        ជ្រើសរើសប្រភេទកិច្ចសន្យា (Contract Type):
                      </label>
                      <select
                        value={formData.contractType}
                        onChange={(e) => handleContractTypeChange(e.target.value as ContractType)}
                        style={{
                          width: '100%',
                          padding: '0.55rem 0.75rem',
                          borderRadius: '8px',
                          border: '2px solid #2563eb',
                          fontSize: '0.9rem',
                          fontWeight: 600,
                          background: '#eff6ff',
                          color: '#1e3a8a',
                        }}
                      >
                        <option value="FDC">១. កិច្ចសន្យាមានកំណត់ថិរវេលា (FDC - Fixed Duration)</option>
                        <option value="PROBATION">២. កិច្ចសន្យាសាកល្បងការងារ (Probation Contract)</option>
                        <option value="UDC">៣. កិច្ចសន្យាមានថិរវេលាមិនកំណត់ (UDC - Undetermined Duration)</option>
                        <option value="FOREIGN_FDC">៤. កិច្ចសន្យាការងារបុគ្គលិកជនបរទេស (Foreign Expat Contract)</option>
                      </select>
                    </div>

                    <div>
                      <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.35rem', fontSize: '0.85rem' }}>
                        លេខឯកសារ (Document No):
                      </label>
                      <input
                        type="text"
                        value={formData.contractNo}
                        onChange={(e) => setFormData({ ...formData, contractNo: e.target.value })}
                        style={{ width: '100%', padding: '0.55rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.88rem' }}
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.35rem', fontSize: '0.85rem' }}>
                        កាលបរិច្ឆេទចុះកុងត្រា (Signed Date):
                      </label>
                      <input
                        type="date"
                        value={formData.signedDate}
                        onChange={(e) => setFormData({ ...formData, signedDate: e.target.value })}
                        style={{ width: '100%', padding: '0.55rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.88rem' }}
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.35rem', fontSize: '0.85rem' }}>
                        ថ្ងៃចាប់ផ្តើមការងារ (Start Date):
                      </label>
                      <input
                        type="date"
                        value={formData.startDate}
                        onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                        style={{ width: '100%', padding: '0.55rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.88rem' }}
                      />
                    </div>

                    {formData.contractType !== 'UDC' && (
                      <div>
                        <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.35rem', fontSize: '0.85rem' }}>
                          ថ្ងៃបញ្ចប់កុងត្រា (End Date):
                        </label>
                        <input
                          type="date"
                          value={formData.endDate}
                          onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                          style={{ width: '100%', padding: '0.55rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.88rem' }}
                        />
                      </div>
                    )}

                    {formData.contractType === 'PROBATION' && (
                      <div>
                        <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.35rem', fontSize: '0.85rem' }}>
                          កម្រិតសាកល្បង (Probation Category - មាត្រា ៦៨):
                        </label>
                        <select
                          value={formData.probationCategory}
                          onChange={(e) => handleProbationCategoryChange(e.target.value as any)}
                          style={{ width: '100%', padding: '0.55rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.88rem' }}
                        >
                          <option value="EMPLOYEE">និយោជិត/ការិយាល័យ (៣ ខែ - 3 Months)</option>
                          <option value="SPECIALISED">កម្មករឯកទេស/ជំនាញ (២ ខែ - 2 Months)</option>
                          <option value="NON_SPECIALISED">កម្មករធម្មតា (១ ខែ - 1 Month)</option>
                        </select>
                      </div>
                    )}
                  </div>

                  {/* Foreigner Specific Fields */}
                  {(formData.isForeigner || formData.contractType === 'FOREIGN_FDC') && (
                    <div
                      style={{
                        background: '#f5f3ff',
                        border: '1px solid #ddd6fe',
                        borderRadius: '10px',
                        padding: '1rem',
                        marginTop: '1.25rem',
                      }}
                    >
                      <h4 style={{ margin: '0 0 0.75rem 0', color: '#6d28d9', fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        🌐 ព័ត៌មានបន្ថែមសម្រាប់បុគ្គលិកជនបរទេស (Foreign Expatriate Info)
                      </h4>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.85rem' }}>
                        <div>
                          <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.25rem' }}>
                            លេខលិខិតឆ្លងដែន (Passport No):
                          </label>
                          <input
                            type="text"
                            value={formData.passportNo || ''}
                            onChange={(e) => setFormData({ ...formData, passportNo: e.target.value })}
                            placeholder="ឧ. E12345678"
                            style={{ width: '100%', padding: '0.45rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
                          />
                        </div>
                        <div>
                          <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.25rem' }}>
                            ថ្ងៃផុតកំណត់លិខិតឆ្លងដែន (Passport Expiry):
                          </label>
                          <input
                            type="date"
                            value={formData.passportExpiry || ''}
                            onChange={(e) => setFormData({ ...formData, passportExpiry: e.target.value })}
                            style={{ width: '100%', padding: '0.45rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
                          />
                        </div>
                        <div>
                          <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.25rem' }}>
                            លេខប័ណ្ណការងារ MLVT (Work Permit No):
                          </label>
                          <input
                            type="text"
                            value={formData.workPermitNo || ''}
                            onChange={(e) => setFormData({ ...formData, workPermitNo: e.target.value })}
                            placeholder="ឧ. WP-2026-9999"
                            style={{ width: '100%', padding: '0.45rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
                          />
                        </div>
                        <div>
                          <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.25rem' }}>
                            ថ្ងៃផុតកំណត់ប័ណ្ណការងារ (Work Permit Expiry):
                          </label>
                          <input
                            type="date"
                            value={formData.workPermitExpiry || ''}
                            onChange={(e) => setFormData({ ...formData, workPermitExpiry: e.target.value })}
                            style={{ width: '100%', padding: '0.45rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
                          />
                        </div>
                        <div>
                          <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.25rem' }}>
                            លេខទិដ្ឋាការ (Visa No - EB Visa):
                          </label>
                          <input
                            type="text"
                            value={formData.visaNo || ''}
                            onChange={(e) => setFormData({ ...formData, visaNo: e.target.value })}
                            placeholder="ឧ. EB-098765"
                            style={{ width: '100%', padding: '0.45rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
                          />
                        </div>
                        <div>
                          <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.25rem' }}>
                            ថ្ងៃផុតកំណត់ទិដ្ឋាការ (Visa Expiry):
                          </label>
                          <input
                            type="date"
                            value={formData.visaExpiry || ''}
                            onChange={(e) => setFormData({ ...formData, visaExpiry: e.target.value })}
                            style={{ width: '100%', padding: '0.45rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  <h3 style={{ borderBottom: '2px solid #e2e8f0', paddingBottom: '0.65rem', margin: '1.75rem 0 1.25rem 0', color: '#1e3a8a', fontSize: '1.1rem' }}>
                    🏢 ៣. ព័ត៌មានក្រុមហ៊ុន និងនិយោជក (Company & Representative)
                  </h3>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem' }}>
                    <div>
                      <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.35rem', fontSize: '0.85rem' }}>
                        ឈ្មោះក្រុមហ៊ុន/រោងចក្រ (Company Name):
                      </label>
                      <input
                        type="text"
                        value={formData.companyName}
                        onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                        style={{ width: '100%', padding: '0.55rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.88rem' }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.35rem', fontSize: '0.85rem' }}>
                        អាសយដ្ឋានក្រុមហ៊ុន (Address):
                      </label>
                      <input
                        type="text"
                        value={formData.companyAddress}
                        onChange={(e) => setFormData({ ...formData, companyAddress: e.target.value })}
                        style={{ width: '100%', padding: '0.55rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.88rem' }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.35rem', fontSize: '0.85rem' }}>
                        តំណាងដោយ (Representative):
                      </label>
                      <input
                        type="text"
                        value={formData.representative}
                        onChange={(e) => setFormData({ ...formData, representative: e.target.value })}
                        style={{ width: '100%', padding: '0.55rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.88rem' }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.35rem', fontSize: '0.85rem' }}>
                        តួនាទីអ្នកតំណាង (Role / Position):
                      </label>
                      <input
                        type="text"
                        value={formData.representativeRole}
                        onChange={(e) => setFormData({ ...formData, representativeRole: e.target.value })}
                        style={{ width: '100%', padding: '0.55rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.88rem' }}
                      />
                    </div>
                  </div>

                  <h3 style={{ borderBottom: '2px solid #e2e8f0', paddingBottom: '0.65rem', margin: '1.75rem 0 1.25rem 0', color: '#1e3a8a', fontSize: '1.1rem' }}>
                    💵 ៤. ប្រាក់ឈ្នួល និងម៉ោងធ្វើការ (Wages & Working Hours)
                  </h3>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem' }}>
                    <div>
                      <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.35rem', fontSize: '0.85rem' }}>
                        ប្រាក់ឈ្នួលគោល (USD):
                      </label>
                      <input
                        type="number"
                        value={formData.basicSalaryUsd}
                        onChange={(e) => {
                          const usd = Number(e.target.value) || 0;
                          setFormData({
                            ...formData,
                            basicSalaryUsd: usd,
                            basicSalaryKhr: usd * exchangeRate,
                          });
                        }}
                        style={{ width: '100%', padding: '0.55rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.88rem' }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.35rem', fontSize: '0.85rem' }}>
                        ប្រាក់ឈ្នួលគិតជារៀល (KHR):
                      </label>
                      <input
                        type="number"
                        value={formData.basicSalaryKhr}
                        onChange={(e) => setFormData({ ...formData, basicSalaryKhr: Number(e.target.value) || 0 })}
                        style={{ width: '100%', padding: '0.55rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.88rem' }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.35rem', fontSize: '0.85rem' }}>
                        ថ្ងៃបើកប្រាក់ឈ្នួល (Payment Day):
                      </label>
                      <input
                        type="text"
                        value={formData.paymentDay}
                        onChange={(e) => setFormData({ ...formData, paymentDay: e.target.value })}
                        style={{ width: '100%', padding: '0.55rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.88rem' }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.35rem', fontSize: '0.85rem' }}>
                        ម៉ោងធ្វើការ (Work Hours):
                      </label>
                      <input
                        type="text"
                        value={formData.workingHours}
                        onChange={(e) => setFormData({ ...formData, workingHours: e.target.value })}
                        style={{ width: '100%', padding: '0.55rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.88rem' }}
                      />
                    </div>
                  </div>

                  <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                    <button
                      onClick={() => setActiveTab('preview')}
                      style={{
                        background: '#2563eb',
                        color: '#ffffff',
                        border: 'none',
                        padding: '0.65rem 1.5rem',
                        borderRadius: '8px',
                        fontWeight: 700,
                        cursor: 'pointer',
                        fontSize: '0.95rem',
                      }}
                    >
                      មើលលទ្ធផលកិច្ចសន្យា (Go to Preview) ➔
                    </button>
                  </div>
                </div>
              )}

                            {/* TAB 2: EDIT CLAUSES (កែរអត្ថន័យបាន & រត់អូតូទាំង ៣ ភាសា) */}
              {activeTab === 'clauses' && (
                <div className={styles.formCard}>
                  {/* Banner & Global Translate Controls */}
                  <div
                    style={{
                      marginBottom: '1.25rem',
                      background: 'linear-gradient(135deg, #eff6ff 0%, #f0fdf4 100%)',
                      padding: '1rem 1.25rem',
                      borderRadius: '10px',
                      border: '1px solid #bfdbfe',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      flexWrap: 'wrap',
                      gap: '0.75rem',
                    }}
                  >
                    <div>
                      <h4 style={{ margin: '0 0 0.25rem 0', color: '#1e3a8a', fontSize: '1rem', fontWeight: 800 }}>
                        🌐 កែប្រែខ្លឹមសារខសន្យា & រត់អូតូទាំង ៣ ភាសា (Trilingual Auto-Sync)
                      </h4>
                      <p style={{ margin: 0, fontSize: '0.82rem', color: '#334155', lineHeight: 1.4 }}>
                        ពេលលោកអ្នកវាយបញ្ចូលជា <strong>ភាសាខ្មែរ (លើគេ)</strong> ឬភាសាណាមួយ ប្រព័ន្ធនឹងបកប្រែ និងរត់អូតូទាំង ៣ ភាសា (ខ្មែរ អង់គ្លេស ចិន) ចូលទៅក្នុងទម្រង់កុងត្រា។
                      </p>
                    </div>

                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                      <button
                        type="button"
                        onClick={handleLoadDefaultClauses}
                        style={{
                          background: '#ffffff',
                          color: '#1e3a8a',
                          border: '1.5px solid #93c5fd',
                          padding: '0.45rem 0.85rem',
                          borderRadius: '7px',
                          fontWeight: 700,
                          fontSize: '0.82rem',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.35rem',
                          boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
                        }}
                      >
                        <span>🔄</span>
                        ផ្ទុកខ្លឹមសារស្តង់ដារ ៣ ភាសា
                      </button>

                      <button
                        type="button"
                        onClick={handleTranslateAllClauses}
                        disabled={isTranslatingAll}
                        style={{
                          background: '#2563eb',
                          color: '#ffffff',
                          border: 'none',
                          padding: '0.45rem 1rem',
                          borderRadius: '7px',
                          fontWeight: 700,
                          fontSize: '0.82rem',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.4rem',
                          boxShadow: '0 2px 6px rgba(37,99,235,0.25)',
                        }}
                      >
                        <span>✨</span>
                        {isTranslatingAll ? 'កំពុងបកប្រែគ្រប់ខសន្យា...' : 'បកប្រែអូតូគ្រប់ខសន្យាទាំងអស់'}
                      </button>
                    </div>
                  </div>

                  {/* 8 CLAUSES CARDS (Each has 3 Languages: Khmer top, English middle, Chinese bottom) */}
                  {[
                    { num: 1, titleKm: '១. ភាគីនៃកិច្ចសន្យា', titleEn: '1. Contracting parties', titleZh: '一、合同双方', keyKh: 'clause1BodyKh', keyEn: 'clause1BodyEn', keyZh: 'clause1BodyZh', def: defaultClauses.c1 },
                    { num: 2, titleKm: '២. មុខតំណែង និងទីកន្លែងធ្វើការ', titleEn: '2. Position and workplace', titleZh: '二、岗位及工作地点', keyKh: 'clause2BodyKh', keyEn: 'clause2BodyEn', keyZh: 'clause2BodyZh', def: defaultClauses.c2 },
                    { num: 3, titleKm: '៣. ប្រាក់ឈ្នួល និងការទូទាត់', titleEn: '3. Wages and payment', titleZh: '三、工资及支付', keyKh: 'clause3BodyKh', keyEn: 'clause3BodyEn', keyZh: 'clause3BodyZh', def: defaultClauses.c3 },
                    { num: 4, titleKm: '៤. ម៉ោងធ្វើការ និងការសម្រាក', titleEn: '4. Working hours and rest', titleZh: '四、工作时间及休息', keyKh: 'clause4BodyKh', keyEn: 'clause4BodyEn', keyZh: 'clause4BodyZh', def: defaultClauses.c4 },
                    { num: 5, titleKm: '៥. ការឈប់សម្រាក និងសន្តិសុខសង្គម', titleEn: '5. Leave and social security', titleZh: '五、休假及社会保障', keyKh: 'clause5BodyKh', keyEn: 'clause5BodyEn', keyZh: 'clause5BodyZh', def: defaultClauses.c5 },
                    { num: 6, titleKm: '៦. សុវត្ថិភាព សុខភាព និងវិន័យ', titleEn: '6. Safety, health and discipline', titleZh: '六、安全、健康与纪律', keyKh: 'clause6BodyKh', keyEn: 'clause6BodyEn', keyZh: 'clause6BodyZh', def: defaultClauses.c6 },
                    { num: 7, titleKm: '៧. ការមិនរើសអើង និងការស្ម័គ្រចិត្ត', titleEn: '7. Non-discrimination and voluntary work', titleZh: '七、反歧视与自愿劳动', keyKh: 'clause7BodyKh', keyEn: 'clause7BodyEn', keyZh: 'clause7BodyZh', def: defaultClauses.c7 },
                    { num: 8, titleKm: '៨. ការដោះស្រាយវិវាទ និងអាទិភាពច្បាប់', titleEn: '8. Disputes and governing law', titleZh: '八、争议解决与适用法律', keyKh: 'clause8BodyKh', keyEn: 'clause8BodyEn', keyZh: 'clause8BodyZh', def: defaultClauses.c8 },
                  ].map((c) => {
                    const currentKh = (formData as any)[c.keyKh] !== undefined ? (formData as any)[c.keyKh] : c.def.kh;
                    const currentEn = (formData as any)[c.keyEn] !== undefined ? (formData as any)[c.keyEn] : c.def.en;
                    const currentZh = (formData as any)[c.keyZh] !== undefined ? (formData as any)[c.keyZh] : c.def.zh;

                    return (
                      <div
                        key={c.num}
                        style={{
                          marginBottom: '1.25rem',
                          border: '1px solid #e2e8f0',
                          borderRadius: '10px',
                          padding: '1rem',
                          background: '#ffffff',
                          boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
                        }}
                      >
                        {/* Header of Clause */}
                        <div
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            marginBottom: '0.65rem',
                            borderBottom: '1px solid #f1f5f9',
                            paddingBottom: '0.45rem',
                            flexWrap: 'wrap',
                            gap: '0.5rem',
                          }}
                        >
                          <div>
                            <span style={{ fontWeight: 800, color: '#1e3a8a', fontSize: '0.92rem' }}>
                              {c.titleKm}
                            </span>
                            <span style={{ fontSize: '0.78rem', color: '#64748b', marginLeft: '6px' }}>
                              / {c.titleEn} / {c.titleZh}
                            </span>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleTranslateClause(c.num)}
                            disabled={translatingClause === c.num}
                            style={{
                              background: '#eff6ff',
                              color: '#1d4ed8',
                              border: '1px solid #bfdbfe',
                              padding: '0.3rem 0.65rem',
                              borderRadius: '6px',
                              fontSize: '0.78rem',
                              fontWeight: 700,
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.35rem',
                            }}
                          >
                            <span>🌐</span>
                            {translatingClause === c.num ? 'កំពុងបកប្រែ...' : 'បកប្រែអូតូ ៣ ភាសា (Auto-Translate)'}
                          </button>
                        </div>

                        {/* 3 Textareas (Khmer on top, English middle, Chinese bottom) */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                          {/* 1. Khmer */}
                          <div>
                            <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#0f172a', marginBottom: '2px' }}>
                              🇰🇭 ភាសាខ្មែរ (Khmer - លើគេ):
                            </label>
                            <textarea
                              rows={2}
                              value={currentKh}
                              onChange={(e) => setFormData({ ...formData, [c.keyKh]: e.target.value })}
                              style={{
                                width: '100%',
                                padding: '0.45rem 0.65rem',
                                borderRadius: '6px',
                                border: '1px solid #cbd5e1',
                                fontSize: '0.84rem',
                                fontFamily: 'inherit',
                                boxSizing: 'border-box',
                                lineHeight: 1.4,
                              }}
                            />
                          </div>

                          {/* 2. English */}
                          <div>
                            <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#334155', marginBottom: '2px' }}>
                              🇬🇧 ភាសាអង់គ្លេស (English):
                            </label>
                            <textarea
                              rows={2}
                              value={currentEn}
                              onChange={(e) => setFormData({ ...formData, [c.keyEn]: e.target.value })}
                              style={{
                                width: '100%',
                                padding: '0.45rem 0.65rem',
                                borderRadius: '6px',
                                border: '1px solid #cbd5e1',
                                fontSize: '0.82rem',
                                fontFamily: 'inherit',
                                fontStyle: 'italic',
                                color: '#334155',
                                boxSizing: 'border-box',
                                lineHeight: 1.4,
                              }}
                            />
                          </div>

                          {/* 3. Chinese */}
                          <div>
                            <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#475569', marginBottom: '2px' }}>
                              🇨🇳 ភាសាចិន (中文):
                            </label>
                            <textarea
                              rows={2}
                              value={currentZh}
                              onChange={(e) => setFormData({ ...formData, [c.keyZh]: e.target.value })}
                              style={{
                                width: '100%',
                                padding: '0.45rem 0.65rem',
                                borderRadius: '6px',
                                border: '1px solid #cbd5e1',
                                fontSize: '0.82rem',
                                fontFamily: 'inherit',
                                color: '#475569',
                                boxSizing: 'border-box',
                                lineHeight: 1.4,
                              }}
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}

                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.25rem' }}>
                    <button
                      type="button"
                      onClick={() => setActiveTab('preview')}
                      style={{
                        background: '#2563eb',
                        color: '#ffffff',
                        border: 'none',
                        padding: '0.6rem 1.5rem',
                        borderRadius: '8px',
                        fontWeight: 700,
                        cursor: 'pointer',
                        fontSize: '0.92rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.4rem',
                        boxShadow: '0 2px 8px rgba(37,99,235,0.25)',
                      }}
                    >
                      <span>👁️</span>
                      មើលការផ្លាស់ប្តូរ (Preview Changes) ➔
                    </button>
                  </div>
                </div>
              )}

              {/* TAB 3: A4 SHEET LIVE PREVIEW (Trilingual Standard) */}
              {activeTab === 'preview' && (
                <div id="printableContractArea" className={styles.a4Sheet}>
                  {/* Header Meta: Company Name & Document No */}
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      borderBottom: '2px solid #1e3a8a',
                      paddingBottom: '0.65rem',
                      marginBottom: '1rem',
                    }}
                  >
                    <div>
                      <div style={{ fontSize: '0.82rem', color: '#64748b' }}>
                        ឈ្មោះក្រុមហ៊ុន / Company name / 公司名称:
                      </div>
                      <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#1e3a8a' }}>
                        {formData.companyName || '__________________________'}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right', fontSize: '0.82rem', color: '#475569' }}>
                      <div>
                        លេខឯកសារ / Doc No. / 文件编号:{' '}
                        <strong style={{ color: '#0f172a' }}>{formData.contractNo}</strong>
                      </div>
                      <div>
                        កំណែ / Revision / 版本: <strong style={{ color: '#0f172a' }}>{formData.revision}</strong>
                      </div>
                    </div>
                  </div>

                  {/* Contract Trilingual Title */}
                  <div style={{ textAlign: 'center', margin: '1.25rem 0 1rem 0' }}>
                    <h2
                      style={{
                        fontSize: '1.4rem',
                        fontWeight: 800,
                        color: '#1e3a8a',
                        margin: '0 0 0.2rem 0',
                        letterSpacing: '0.4px',
                      }}
                    >
                      {currentMeta.nameKh}
                    </h2>
                    <h3
                      style={{
                        fontSize: '1rem',
                        fontWeight: 700,
                        color: '#1d4ed8',
                        margin: '0 0 0.15rem 0',
                        textTransform: 'uppercase',
                      }}
                    >
                      {currentMeta.nameEn}
                    </h3>
                    <h3
                      style={{
                        fontSize: '1rem',
                        fontWeight: 600,
                        color: '#475569',
                        margin: '0',
                      }}
                    >
                      {currentMeta.nameZh}
                    </h3>

                    {/* Signed at & Date */}
                    <div
                      style={{
                        marginTop: '0.75rem',
                        fontSize: '0.88rem',
                        fontWeight: 600,
                        color: '#334155',
                      }}
                    >
                      ធ្វើនៅ / Signed at / 签订地点:{' '}
                      <span style={{ textDecoration: 'underline' }}>{formData.signedAtLocation}</span>
                      &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; ថ្ងៃទី / Date / 日期:{' '}
                      <span style={{ textDecoration: 'underline' }}>
                        {formatContractDate(formData.signedDate)}
                      </span>
                    </div>
                  </div>

                  {/* Clause 1: Contracting Parties */}
                  <div style={{ marginBottom: '1.1rem' }}>
                    <div style={{ fontWeight: 800, color: '#1e3a8a', fontSize: '0.95rem', marginBottom: '0.3rem' }}>
                      ១. ភាគីនៃកិច្ចសន្យា / 1. Contracting parties / 一、合同双方
                    </div>
                    {/* Khmer */}
                    <p style={{ margin: '0 0 0.2rem 0', fontSize: '0.88rem', textAlign: 'justify' }}>
                      {formData.clause1BodyKh || (
                        <>
                          <strong>និយោជក៖</strong> ឈ្មោះក្រុមហ៊ុន{' '}
                          <u>{formData.companyName || '__________'}</u> អាសយដ្ឋាន{' '}
                          <u>{formData.companyAddress || '__________'}</u> តំណាងដោយ{' '}
                          <u>{formData.representative || '__________'}</u> តួនាទី{' '}
                          <u>{formData.representativeRole || '__________'}</u>។{' '}
                          <strong>កម្មករនិយោជិត៖</strong> ឈ្មោះ{' '}
                          <u>{formData.employeeNameKh || formData.employeeNameEn || '__________'}</u> (ឡាតាំង:{' '}
                          <u>{formData.employeeNameEn || '__________'}</u>) ភេទ <u>{currentGender.kh}</u>{' '}
                          ថ្ងៃខែឆ្នាំកំណើត <u>{formatContractDate(formData.dob)}</u>{' '}
                          លេខអត្តសញ្ញាណប័ណ្ណ/លិខិតឆ្លងដែន <u>{formData.nationalIdOrPassport || '__________'}</u>{' '}
                          អាសយដ្ឋាន <u>{formData.address || '__________'}</u>។
                        </>
                      )}
                    </p>
                    {/* English */}
                    <p style={{ margin: '0 0 0.2rem 0', fontSize: '0.82rem', color: '#334155', fontStyle: 'italic', textAlign: 'justify' }}>
                      {formData.clause1BodyEn || (
                        <>
                          <strong>Employer:</strong> Company <u>{formData.companyName || '__________'}</u>, address{' '}
                          <u>{formData.companyAddress || '__________'}</u>, represented by{' '}
                          <u>{formData.representative || '__________'}</u>, position{' '}
                          <u>{formData.representativeRole || '__________'}</u>. <strong>Employee:</strong> Name{' '}
                          <u>{formData.employeeNameEn || '__________'}</u>, sex <u>{currentGender.en}</u>, date of
                          birth <u>{formatContractDate(formData.dob)}</u>, ID/passport{' '}
                          <u>{formData.nationalIdOrPassport || '__________'}</u>, address{' '}
                          <u>{formData.address || '__________'}</u>.
                        </>
                      )}
                    </p>
                    {/* Chinese */}
                    <p style={{ margin: '0 0 0.55rem 0', fontSize: '0.82rem', color: '#475569', textAlign: 'justify' }}>
                      {formData.clause1BodyZh || (
                        <>
                          <strong>雇主：</strong>公司名称 <u>{formData.companyName || '__________'}</u>，地址{' '}
                          <u>{formData.companyAddress || '__________'}</u>，代表人{' '}
                          <u>{formData.representative || '__________'}</u>，职务{' '}
                          <u>{formData.representativeRole || '__________'}</u>。<strong>员工：</strong>姓名{' '}
                          <u>{formData.employeeNameKh || formData.employeeNameEn || '__________'}</u>（英文：
                          <u>{formData.employeeNameEn || '__________'}</u>），性别 <u>{currentGender.zh}</u>，出生日期{' '}
                          <u>{formatContractDate(formData.dob)}</u>，身份证/护照{' '}
                          <u>{formData.nationalIdOrPassport || '__________'}</u>，地址{' '}
                          <u>{formData.address || '__________'}</u>。
                        </>
                      )}
                    </p>

                    {/* Term variation */}
                    {formData.contractType === 'PROBATION' && (
                      <div style={{ background: '#f8fafc', padding: '0.55rem', borderRadius: '6px', borderLeft: '3px solid #d97706' }}>
                        <div style={{ fontWeight: 700, color: '#b45309', fontSize: '0.88rem' }}>
                          រយៈពេលសាកល្បង / Probation period / 试用期限
                        </div>
                        <p style={{ margin: '0.2rem 0', fontSize: '0.85rem' }}>
                          ចាប់ពីថ្ងៃទី <u>{formatContractDate(formData.startDate)}</u> ដល់ថ្ងៃទី{' '}
                          <u>{formatContractDate(formData.endDate)}</u>។ រយៈពេលអតិបរមា៖ ៣ ខែសម្រាប់និយោជិត; ២
                          ខែសម្រាប់កម្មករឯកទេស; ១ ខែសម្រាប់កម្មករធម្មតា (មាត្រា ៦៨)។ ប្រភេទមុខងារ៖{' '}
                          <u>
                            {formData.probationCategory === 'SPECIALISED'
                              ? 'កម្មករឯកទេស (២ ខែ)'
                              : formData.probationCategory === 'NON_SPECIALISED'
                              ? 'កម្មករធម្មតា (១ ខែ)'
                              : 'និយោជិត/ការិយាល័យ (៣ ខែ)'}
                          </u>
                          ។ ការវាយតម្លៃ និងការបញ្ចប់៖ និយោជកវាយតម្លៃសមត្ថភាពការងារ និងពន្យល់លទ្ធផលជូនកម្មករ។
                          ក្នុងរយៈពេលសាកល្បង ការជូនដំណឹងមុនអនុវត្តតាមមាត្រា ៨២ និងបទប្បញ្ញត្តិពាក់ព័ន្ធ។
                          ការបន្តការងារត្រូវបញ្ជាក់ជាកិច្ចសន្យា FDC ឬ UDC ស្របច្បាប់។
                        </p>
                        <p style={{ margin: '0.2rem 0', fontSize: '0.8rem', color: '#334155', fontStyle: 'italic' }}>
                          From <u>{formatContractDate(formData.startDate)}</u> to{' '}
                          <u>{formatContractDate(formData.endDate)}</u>. Maximum: 3 months for employees, 2
                          months for specialised workers, 1 month for non-specialised workers (Article 68). The
                          employer evaluates work ability and communicates results. Notice during probation is
                          governed by Article 82. Continued employment shall be documented under a lawful FDC or UDC.
                        </p>
                        <p style={{ margin: '0.2rem 0', fontSize: '0.8rem', color: '#475569' }}>
                          自 <u>{formatContractDate(formData.startDate)}</u> 至{' '}
                          <u>{formatContractDate(formData.endDate)}</u>。最长试用期：职员3个月、专业工人2个月、普通工人1个月（第68条）。考核及结束：雇主评估工作能力并告知结果。试用期间通知依第82条执行。继续雇佣须依法签订固定期限或无固定期限合同。
                        </p>
                      </div>
                    )}

                    {formData.contractType === 'UDC' && (
                      <div style={{ background: '#f8fafc', padding: '0.55rem', borderRadius: '6px', borderLeft: '3px solid #059669' }}>
                        <div style={{ fontWeight: 700, color: '#047857', fontSize: '0.88rem' }}>
                          ការចាប់ផ្តើម និងរយៈពេល / Commencement and duration / 开始日期及期限
                        </div>
                        <p style={{ margin: '0.2rem 0', fontSize: '0.85rem' }}>
                          ចាប់ផ្តើមថ្ងៃទី <u>{formatContractDate(formData.startDate)}</u>{' '}
                          ហើយគ្មានថ្ងៃបញ្ចប់កំណត់ជាមុន។ អតីតភាពការងារត្រូវគណនាតាមច្បាប់។ ការបញ្ចប់កិច្ចសន្យា៖
                          ការបញ្ចប់កិច្ចសន្យាត្រូវមានមូលហេតុ និងការជូនដំណឹងតាមច្បាប់។ រយៈពេលជូនដំណឹងអាស្រ័យលើអតីតភាព៖
                          ក្រោម ៦ ខែ ៧ ថ្ងៃ; ៦ ខែដល់ ២ ឆ្នាំ ១៥ ថ្ងៃ; លើស ២ ដល់ ៥ ឆ្នាំ ១ ខែ; លើស ៥ ដល់ ១០ ឆ្នាំ ២
                          ខែ; លើស ១០ ឆ្នាំ ៣ ខែ។ ប្រាក់បំណាច់អតីតភាពការងារ និងសំណងផ្សេងៗត្រូវអនុវត្តតាមច្បាប់ជាធរមាន។
                        </p>
                        <p style={{ margin: '0.2rem 0', fontSize: '0.8rem', color: '#334155', fontStyle: 'italic' }}>
                          Commences on <u>{formatContractDate(formData.startDate)}</u> and has no predetermined
                          end date. Length of service is determined according to law. Termination requires lawful
                          grounds and notice (under 6 months, 7 days; 6 months–2 years, 15 days; over 2–5 years, 1
                          month; over 5–10 years, 2 months; over 10 years, 3 months). Seniority payments follow current law.
                        </p>
                        <p style={{ margin: '0.2rem 0', fontSize: '0.8rem', color: '#475569' }}>
                          自 <u>{formatContractDate(formData.startDate)}</u>{' '}
                          起生效，无预定终止日期。工龄依法计算。解除合同须具备合法理由并依法通知（不足6个月7天；6个月至2年15天；超过2年至5年1个月；超过5年至10年2个月；超过10年3个月）。工龄补偿及其他赔偿依法执行。
                        </p>
                      </div>
                    )}

                    {(formData.contractType === 'FDC' || formData.contractType === 'FOREIGN_FDC') && (
                      <div style={{ background: '#f8fafc', padding: '0.55rem', borderRadius: '6px', borderLeft: '3px solid #2563eb' }}>
                        <div style={{ fontWeight: 700, color: '#1d4ed8', fontSize: '0.88rem' }}>
                          រយៈពេលកិច្ចសន្យា / Contract term / 合同期限
                        </div>
                        <p style={{ margin: '0.2rem 0', fontSize: '0.85rem' }}>
                          ចាប់ពីថ្ងៃទី <u>{formatContractDate(formData.startDate)}</u> ដល់ថ្ងៃទី{' '}
                          <u>{formatContractDate(formData.endDate)}</u>។ កិច្ចសន្យានេះត្រូវធ្វើជាលាយលក្ខណ៍អក្សរ
                          និងមានថ្ងៃចាប់ផ្តើម និងថ្ងៃបញ្ចប់ច្បាស់លាស់។ រយៈពេលកិច្ចសន្យានីមួយៗមិនលើស ២ ឆ្នាំ។
                          ការបន្តកិច្ចសន្យាត្រូវគោរពមាត្រា ៦៧ និងសេចក្តីណែនាំលេខ ០៥០/១៩
                          {formData.isForeigner && formData.workPermitNo && (
                            <span>
                              {' '}
                              [ប័ណ្ណការងារ MLVT: <u>{formData.workPermitNo}</u> ផុតកំណត់:{' '}
                              <u>{formatContractDate(formData.workPermitExpiry)}</u>]
                            </span>
                          )}
                          ។ ការបញ្ចប់ និងអត្ថប្រយោជន៍៖ នៅពេលផុតកំណត់ អនុវត្តការជូនដំណឹងជាមុនតាមមាត្រា ៧៣ ប្រសិនបើត្រូវការ
                          (១០ ថ្ងៃសម្រាប់លើស ៦ ខែដល់ ១ ឆ្នាំ; ១៥ ថ្ងៃសម្រាប់លើស ១ ឆ្នាំ)។
                          ប្រាក់បំណាច់បញ្ចប់កិច្ចសន្យាយ៉ាងតិច ៥%
                          នៃប្រាក់ឈ្នួលដែលបានទទួលក្នុងរយៈពេលកិច្ចសន្យា រួមទាំងសិទ្ធិផ្សេងៗតាមច្បាប់។
                          ការបញ្ចប់មុនកាលកំណត់ត្រូវគោរពមាត្រា ៧៣។
                        </p>
                        <p style={{ margin: '0.2rem 0', fontSize: '0.8rem', color: '#334155', fontStyle: 'italic' }}>
                          From <u>{formatContractDate(formData.startDate)}</u> to{' '}
                          <u>{formatContractDate(formData.endDate)}</u>. This agreement is in writing with
                          definite start and end dates. Each term shall not exceed two years. Renewals must comply with
                          Article 67 and Instruction No. 050/19. Severance at expiry is at least 5% of wages paid during
                          the contract. Early termination follows Article 73.
                        </p>
                        <p style={{ margin: '0.2rem 0', fontSize: '0.8rem', color: '#475569' }}>
                          自 <u>{formatContractDate(formData.startDate)}</u> 至{' '}
                          <u>{formatContractDate(formData.endDate)}</u>。本合同采用书面形式，明确起止日期。每期合同不超过两年。续签须遵守第67条及第050/19号指导文件。合同期满时依法提前通知（超过6个月至1年提前10天；超过1年提前15天）。期满补偿至少为合同期内已支付工资的5%。
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Clause 2 */}
                  <div style={{ marginBottom: '1.1rem' }}>
                    <div style={{ fontWeight: 800, color: '#1e3a8a', fontSize: '0.95rem', marginBottom: '0.3rem' }}>
                      ២. មុខតំណែង និងទីកន្លែងធ្វើការ / 2. Position and workplace / 二、岗位及工作地点
                    </div>
                    <p style={{ margin: '0 0 0.2rem 0', fontSize: '0.88rem' }}>
                      {formData.clause2BodyKh || (
                        <>
                          មុខតំណែង <u>{formData.positionTitle || '__________'}</u> នាយកដ្ឋាន{' '}
                          <u>{formData.department || '__________'}</u> ទីកន្លែងធ្វើការ{' '}
                          <u>{formData.workplace || formData.companyAddress || '__________'}</u>។
                          ភារកិច្ចត្រូវអនុវត្តតាមការពិពណ៌នាការងារដែលបានពន្យល់ជូន។
                        </>
                      )}
                    </p>
                    <p style={{ margin: '0 0 0.2rem 0', fontSize: '0.82rem', color: '#334155', fontStyle: 'italic' }}>
                      {formData.clause2BodyEn || (
                        <>
                          Position <u>{formData.positionTitle || '__________'}</u>, department{' '}
                          <u>{formData.department || '__________'}</u>, workplace{' '}
                          <u>{formData.workplace || formData.companyAddress || '__________'}</u>. Duties follow the job
                          description explained to the employee.
                        </>
                      )}
                    </p>
                    <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.82rem', color: '#475569' }}>
                      {formData.clause2BodyZh || (
                        <>
                          岗位 <u>{formData.positionTitle || '__________'}</u>，部门{' '}
                          <u>{formData.department || '__________'}</u>，工作地点{' '}
                          <u>{formData.workplace || formData.companyAddress || '__________'}</u>。工作职责依照已向员工说明的岗位说明书。
                        </>
                      )}
                    </p>
                  </div>

                  {/* Clause 3 */}
                  <div style={{ marginBottom: '1.1rem' }}>
                    <div style={{ fontWeight: 800, color: '#1e3a8a', fontSize: '0.95rem', marginBottom: '0.3rem' }}>
                      ៣. ប្រាក់ឈ្នួល និងការទូទាត់ / 3. Wages and payment / 三、工资及支付
                    </div>
                    <p style={{ margin: '0 0 0.2rem 0', fontSize: '0.88rem' }}>
                      {formData.clause3BodyKh || (
                        <>
                          ប្រាក់ឈ្នួលគោល <u>${formData.basicSalaryUsd.toLocaleString()}</u> ដុល្លារ/ខែ ឬ{' '}
                          <u>{formData.basicSalaryKhr.toLocaleString()}</u> រៀល/ខែ
                          មិនទាបជាងកម្រិតអប្បបរមាដែលអនុវត្ត។ ការទូទាត់ធ្វើនៅថ្ងៃទី <u>{formData.paymentDay}</u>{' '}
                          តាមរយៈ <u>{formData.paymentMethod}</u>។ ប្រាក់ថែមម៉ោង
                          និងអត្ថប្រយោជន៍ត្រូវអនុវត្តតាមច្បាប់។
                        </>
                      )}
                    </p>
                    <p style={{ margin: '0 0 0.2rem 0', fontSize: '0.82rem', color: '#334155', fontStyle: 'italic' }}>
                      {formData.clause3BodyEn || (
                        <>
                          Basic wage USD <u>${formData.basicSalaryUsd.toLocaleString()}</u>/month or KHR{' '}
                          <u>{formData.basicSalaryKhr.toLocaleString()}</u>/month, not below the applicable minimum.
                          Payment date(s) <u>{formData.paymentDay}</u> via <u>{formData.paymentMethod}</u>. Overtime and
                          benefits follow applicable law.
                        </>
                      )}
                    </p>
                    <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.82rem', color: '#475569' }}>
                      {formData.clause3BodyZh || (
                        <>
                          基本工资每月 <u>${formData.basicSalaryUsd.toLocaleString()}</u> 美元或{' '}
                          <u>{formData.basicSalaryKhr.toLocaleString()}</u> 瑞尔，不低于适用最低工资。发薪日期{' '}
                          <u>{formData.paymentDay}</u>，支付方式 <u>{formData.paymentMethod}</u>。加班费及福利依法执行。
                        </>
                      )}
                    </p>
                  </div>

                  {/* Clause 4 */}
                  <div style={{ marginBottom: '1.1rem' }}>
                    <div style={{ fontWeight: 800, color: '#1e3a8a', fontSize: '0.95rem', marginBottom: '0.3rem' }}>
                      ៤. ម៉ោងធ្វើការ និងការសម្រាក / 4. Working hours and rest / 四、工作时间及休息
                    </div>
                    <p style={{ margin: '0 0 0.2rem 0', fontSize: '0.88rem' }}>
                      {formData.clause4BodyKh || (
                        <>
                          ម៉ោងធ្វើការ <u>{formData.workingHours}</u>; សម្រាកអាហារ <u>{formData.mealBreak}</u>;
                          ថ្ងៃធ្វើការ <u>{formData.workingDays}</u>។ ម៉ោងធ្វើការធម្មតាមិនលើស ៨
                          ម៉ោងក្នុងមួយថ្ងៃ និង ៤៨ ម៉ោងក្នុងមួយសប្តាហ៍។ ការថែមម៉ោងត្រូវធ្វើតាមច្បាប់។
                        </>
                      )}
                    </p>
                    <p style={{ margin: '0 0 0.2rem 0', fontSize: '0.82rem', color: '#334155', fontStyle: 'italic' }}>
                      {formData.clause4BodyEn || (
                        <>
                          Work hours <u>{formData.workingHours}</u>; meal break <u>{formData.mealBreak}</u>; working
                          days <u>{formData.workingDays}</u>. Normal hours shall not exceed 8 per day and 48 per week.
                          Overtime follows the law.
                        </>
                      )}
                    </p>
                    <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.82rem', color: '#475569' }}>
                      {formData.clause4BodyZh || (
                        <>
                          工作时间 <u>{formData.workingHours}</u>；用餐休息 <u>{formData.mealBreak}</u>；工作日{' '}
                          <u>{formData.workingDays}</u>。正常工作时间每日不超过8小时、每周不超过48小时。加班依法安排。
                        </>
                      )}
                    </p>
                  </div>

                  {/* Clause 5 */}
                  <div style={{ marginBottom: '1.1rem' }}>
                    <div style={{ fontWeight: 800, color: '#1e3a8a', fontSize: '0.95rem', marginBottom: '0.3rem' }}>
                      ៥. ការឈប់សម្រាក និងសន្តិសុខសង្គម / 5. Leave and social security / 五、休假及社会保障
                    </div>
                    <p style={{ margin: '0 0 0.2rem 0', fontSize: '0.88rem' }}>
                      {formData.clause5BodyKh || 'កម្មករនិយោជិតមានសិទ្ធិទទួលបានថ្ងៃឈប់សម្រាកប្រចាំសប្តាហ៍ ថ្ងៃបុណ្យមានប្រាក់ឈ្នួល ការឈប់សម្រាកប្រចាំឆ្នាំ និងការឈប់សម្រាកផ្សេងៗតាមច្បាប់។ និយោជកអនុវត្តកាតព្វកិច្ច ប.ស.ស. តាមបទប្បញ្ញត្តិ។'}
                    </p>
                    <p style={{ margin: '0 0 0.2rem 0', fontSize: '0.82rem', color: '#334155', fontStyle: 'italic' }}>
                      {formData.clause5BodyEn || 'The employee receives weekly rest, paid public holidays, annual leave and other statutory leave. The employer meets applicable NSSF obligations.'}
                    </p>
                    <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.82rem', color: '#475569' }}>
                      {formData.clause5BodyZh || '员工依法享有每周休息、带薪法定节假日、年假及其他假期。雇主依法履行国家社会保障基金（NSSF）义务。'}
                    </p>
                  </div>

                  {/* Clause 6 */}
                  <div style={{ marginBottom: '1.1rem' }}>
                    <div style={{ fontWeight: 800, color: '#1e3a8a', fontSize: '0.95rem', marginBottom: '0.3rem' }}>
                      ៦. សុវត្ថិភាព សុខភាព និងវិន័យ / 6. Safety, health and discipline / 六、安全、健康与纪律
                    </div>
                    <p style={{ margin: '0 0 0.2rem 0', fontSize: '0.88rem' }}>
                      {formData.clause6BodyKh || 'និយោជកផ្តល់បរិយាកាសការងារមានសុវត្ថិភាព និងឧបករណ៍ការពារដែលចាំបាច់។ កម្មករនិយោជិតគោរពនីតិវិធីសុវត្ថិភាព បទបញ្ជាផ្ទៃក្នុងស្របច្បាប់ និងមានសិទ្ធិប្តឹងតវ៉ាដោយគ្មានការសងសឹក។'}
                    </p>
                    <p style={{ margin: '0 0 0.2rem 0', fontSize: '0.82rem', color: '#334155', fontStyle: 'italic' }}>
                      {formData.clause6BodyEn || 'The employer provides a safe workplace and necessary protective equipment. The employee follows lawful safety procedures and internal rules and may raise grievances without retaliation.'}
                    </p>
                    <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.82rem', color: '#475569' }}>
                      {formData.clause6BodyZh || '雇主提供安全工作环境及必要防护用品。员工遵守合法安全程序和内部规章，并有权提出申诉且不受报复。'}
                    </p>
                  </div>

                  {/* Clause 7 */}
                  <div style={{ marginBottom: '1.1rem' }}>
                    <div style={{ fontWeight: 800, color: '#1e3a8a', fontSize: '0.95rem', marginBottom: '0.3rem' }}>
                      ៧. ការមិនរើសអើង និងការស្ម័គ្រចិត្ត / 7. Non-discrimination and voluntary work / 七、反歧视与自愿劳动
                    </div>
                    <p style={{ margin: '0 0 0.2rem 0', fontSize: '0.88rem' }}>
                      {formData.clause7BodyKh || 'ការងារធ្វើឡើងដោយស្ម័គ្រចិត្ត គ្មានការបង្ខិតបង្ខំ ការរើសអើង ឬការរក្សាទុកឯកសារផ្ទាល់ខ្លួនដោយខុសច្បាប់។'}
                    </p>
                    <p style={{ margin: '0 0 0.2rem 0', fontSize: '0.82rem', color: '#334155', fontStyle: 'italic' }}>
                      {formData.clause7BodyEn || 'Employment is voluntary, without forced labour, discrimination or unlawful retention of personal documents.'}
                    </p>
                    <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.82rem', color: '#475569' }}>
                      {formData.clause7BodyZh || '雇佣属自愿性质，禁止强迫劳动、歧视或非法扣留个人证件。'}
                    </p>
                  </div>

                  {/* Clause 8 */}
                  <div style={{ marginBottom: '1.1rem' }}>
                    <div style={{ fontWeight: 800, color: '#1e3a8a', fontSize: '0.95rem', marginBottom: '0.3rem' }}>
                      ៨. ការដោះស្រាយវិវាទ និងអាទិភាពច្បាប់ / 8. Disputes and governing law / 八、争议解决与适用法律
                    </div>
                    <p style={{ margin: '0 0 0.2rem 0', fontSize: '0.88rem' }}>
                      {formData.clause8BodyKh || 'វិវាទត្រូវដោះស្រាយតាមការពិភាក្សា និងយន្តការស្របច្បាប់នៅកម្ពុជា។ ប្រសិនបើលក្ខខណ្ឌណាមួយផ្ទុយច្បាប់ការងារ ត្រូវអនុវត្តច្បាប់ ឬលក្ខខណ្ឌដែលផ្តល់អត្ថប្រយោជន៍ល្អជាងដល់កម្មករនិយោជិត។'}
                    </p>
                    <p style={{ margin: '0 0 0.2rem 0', fontSize: '0.82rem', color: '#334155', fontStyle: 'italic' }}>
                      {formData.clause8BodyEn || 'Disputes shall be handled through dialogue and lawful Cambodian mechanisms. Where a term conflicts with labour law, the law or more favourable employee entitlement prevails.'}
                    </p>
                    <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.82rem', color: '#475569' }}>
                      {formData.clause8BodyZh || '争议通过协商及柬埔寨合法机制解决。合同条款与劳动法冲突时，以法律或对员工更有利的条件为准。'}
                    </p>
                  </div>

                  {/* Clause 9 */}
                  <div style={{ marginBottom: '1.25rem' }}>
                    <div style={{ fontWeight: 800, color: '#1e3a8a', fontSize: '0.95rem', marginBottom: '0.3rem' }}>
                      ៩. ការទទួលស្គាល់ / 9. Acknowledgment / 九、确认
                    </div>
                    <p style={{ margin: '0 0 0.2rem 0', fontSize: '0.88rem' }}>
                      ភាគីទាំងពីរបានអាន ឬទទួលការពន្យល់អំពីកិច្ចសន្យានេះ និងយល់ព្រមដោយស្ម័គ្រចិត្ត។ រៀបចំជា ២ ច្បាប់
                      មានតម្លៃដូចគ្នា ភាគីនីមួយៗរក្សា ១ ច្បាប់។
                    </p>
                    <p style={{ margin: '0 0 0.2rem 0', fontSize: '0.82rem', color: '#334155', fontStyle: 'italic' }}>
                      Both parties have read or had this agreement explained and voluntarily accept it. Two equally
                      valid copies are signed, one retained by each party.
                    </p>
                    <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.82rem', color: '#475569' }}>
                      双方已阅读或听取本合同解释并自愿同意。本合同一式两份，具有同等效力，双方各执一份。
                    </p>
                  </div>

                  {/* Signatures Table */}
                  <table
                    style={{
                      width: '100%',
                      borderCollapse: 'collapse',
                      border: '1px solid #cbd5e1',
                      marginTop: '1.25rem',
                      marginBottom: '1rem',
                    }}
                  >
                    <thead>
                      <tr style={{ background: '#f8fafc', borderBottom: '1px solid #cbd5e1' }}>
                        <th style={{ width: '50%', padding: '0.65rem', textAlign: 'center', borderRight: '1px solid #cbd5e1' }}>
                          និយោជក / Employer / 雇主
                        </th>
                        <th style={{ width: '50%', padding: '0.65rem', textAlign: 'center' }}>
                          កម្មករនិយោជិត / Employee / 员工
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td
                          style={{
                            padding: '0.85rem',
                            borderRight: '1px solid #cbd5e1',
                            verticalAlign: 'top',
                            height: '130px',
                          }}
                        >
                          <div style={{ textAlign: 'center', color: '#64748b', fontSize: '0.78rem', marginBottom: '3rem' }}>
                            ហត្ថលេខា/ត្រា / Signature/stamp / 签名盖章
                          </div>
                          <div style={{ fontSize: '0.82rem' }}>
                            <div>
                              ឈ្មោះ / Name / 姓名: <strong>{formData.representative || '__________'}</strong>
                            </div>
                            <div>
                              កាលបរិច្ឆេទ / Date / 日期:{' '}
                              <strong>{formatContractDate(formData.signedDate)}</strong>
                            </div>
                          </div>
                        </td>
                        <td style={{ padding: '0.85rem', verticalAlign: 'top', height: '130px' }}>
                          <div style={{ textAlign: 'center', color: '#64748b', fontSize: '0.78rem', marginBottom: '3rem' }}>
                            ហត្ថលេខា/ស្នាមមេដៃ / Signature/thumbprint / 签名指印
                          </div>
                          <div style={{ fontSize: '0.82rem' }}>
                            <div>
                              ឈ្មោះ / Name / 姓名:{' '}
                              <strong>
                                {formData.employeeNameKh || formData.employeeNameEn || '__________'}
                              </strong>
                            </div>
                            <div>
                              កាលបរិច្ឆេទ / Date / 日期:{' '}
                              <strong>{formatContractDate(formData.signedDate)}</strong>
                            </div>
                          </div>
                        </td>
                      </tr>
                    </tbody>
                  </table>

                  {/* Disclaimer / Note */}
                  <div
                    style={{
                      textAlign: 'center',
                      fontSize: '0.72rem',
                      color: '#94a3b8',
                      fontStyle: 'italic',
                      marginTop: '1rem',
                      borderTop: '1px dashed #e2e8f0',
                      paddingTop: '0.45rem',
                    }}
                  >
                    សម្គាល់ / Note / 备注: គំរូសម្រាប់បំពេញ មិនមែនជាទម្រង់ដែលក្រសួងបានអនុម័តជាផ្លូវការទេ។ /
                    Editable template; not an officially approved ministry form. / 本文件为可编辑模板，并非部委正式批准的格式。
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
