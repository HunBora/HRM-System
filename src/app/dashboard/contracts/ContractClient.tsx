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
  JOB_SCOPE_PRESETS,
  JobScopePreset,
} from '@/lib/contractTemplates';
import { generateContractDocxBlob } from '@/lib/contractDocx';
import { analyzeContractAlert, ContractAlertItem } from '@/lib/contractAlerts';
import IsoProbationContractModal from './IsoProbationContractModal';

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
  const [showIsoProbationModal, setShowIsoProbationModal] = useState(false);
  const [selectedIsoEmployee, setSelectedIsoEmployee] = useState<any>(null);
  const [selectedIsoContractType, setSelectedIsoContractType] = useState<any>('PROBATION');
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
    supervisorRole: 'ប្រធានផ្នែក / Head of Department',
    jobScope: '',
    jobScopeKh: '',
    jobScopeEn: '',
    jobScopeZh: '',
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

    // Auto-detect Job Scope preset from position or department
    const posLower = (emp.position || '').toLowerCase();
    const deptLower = (emp.department || '').toLowerCase();
    let matchedPreset = JOB_SCOPE_PRESETS.find((p) => p.id === 'ADMIN');
    if (posLower.includes('account') || deptLower.includes('account') || deptLower.includes('finance')) {
      matchedPreset = JOB_SCOPE_PRESETS.find((p) => p.id === 'ACCOUNTING');
    } else if (posLower.includes('hr') || deptLower.includes('hr') || posLower.includes('human') || deptLower.includes('human')) {
      matchedPreset = JOB_SCOPE_PRESETS.find((p) => p.id === 'HR');
    } else if (posLower.includes('it') || posLower.includes('software') || posLower.includes('tech') || deptLower.includes('it')) {
      matchedPreset = JOB_SCOPE_PRESETS.find((p) => p.id === 'IT');
    } else if (posLower.includes('worker') || posLower.includes('operat') || deptLower.includes('production')) {
      matchedPreset = JOB_SCOPE_PRESETS.find((p) => p.id === 'PRODUCTION');
    } else if (posLower.includes('sale') || posLower.includes('market') || deptLower.includes('sale')) {
      matchedPreset = JOB_SCOPE_PRESETS.find((p) => p.id === 'SALES');
    } else if (posLower.includes('driver') || posLower.includes('logistic') || deptLower.includes('logistic')) {
      matchedPreset = JOB_SCOPE_PRESETS.find((p) => p.id === 'LOGISTICS');
    }

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
      workplace: defaultAddress,
      supervisorRole: 'ប្រធានផ្នែក / Head of Department',
      jobScope: matchedPreset?.scopeKh || '',
      jobScopeKh: matchedPreset?.scopeKh || '',
      jobScopeEn: matchedPreset?.scopeEn || '',
      jobScopeZh: matchedPreset?.scopeZh || '',
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
      supervisorRole: 'ប្រធានផ្នែក / Head of Department',
      jobScope: '',
      jobScopeKh: '',
      jobScopeEn: '',
      jobScopeZh: '',
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

      const customPayload = {
        supervisorRole: formData.supervisorRole,
        jobScope: formData.jobScope,
        jobScopeKh: formData.jobScopeKh,
        jobScopeEn: formData.jobScopeEn,
        jobScopeZh: formData.jobScopeZh,
        clause1BodyKh: formData.clause1BodyKh,
        clause1BodyEn: formData.clause1BodyEn,
        clause1BodyZh: formData.clause1BodyZh,
        clause2BodyKh: formData.clause2BodyKh,
        clause2BodyEn: formData.clause2BodyEn,
        clause2BodyZh: formData.clause2BodyZh,
        clause3BodyKh: formData.clause3BodyKh,
        clause3BodyEn: formData.clause3BodyEn,
        clause3BodyZh: formData.clause3BodyZh,
        clause4BodyKh: formData.clause4BodyKh,
        clause4BodyEn: formData.clause4BodyEn,
        clause4BodyZh: formData.clause4BodyZh,
        clause5BodyKh: formData.clause5BodyKh,
        clause5BodyEn: formData.clause5BodyEn,
        clause5BodyZh: formData.clause5BodyZh,
        clause6BodyKh: formData.clause6BodyKh,
        clause6BodyEn: formData.clause6BodyEn,
        clause6BodyZh: formData.clause6BodyZh,
        clause7BodyKh: formData.clause7BodyKh,
        clause7BodyEn: formData.clause7BodyEn,
        clause7BodyZh: formData.clause7BodyZh,
        clause8BodyKh: formData.clause8BodyKh,
        clause8BodyEn: formData.clause8BodyEn,
        clause8BodyZh: formData.clause8BodyZh,
        clause9BodyKh: formData.clause9BodyKh,
        clause9BodyEn: formData.clause9BodyEn,
        clause9BodyZh: formData.clause9BodyZh,
      };

      const res = await fetch('/api/contracts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          employeeId: targetEmp.id,
          customClausesJson: JSON.stringify(customPayload),
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


  // Export PDF directly using html2canvas & jsPDF
  const [isExportingPdf, setIsExportingPdf] = useState(false);

  const handleExportPdf = async () => {
    try {
      setIsExportingPdf(true);
      // Ensure we are viewing preview tab so element is visible
      setActiveTab('preview');
      
      // Small timeout to ensure DOM is rendered if tab just changed
      await new Promise((r) => setTimeout(r, 150));

      const element = document.getElementById('printableContractArea');
      if (!element) {
        window.print();
        return;
      }

      const html2canvas = (await import('html2canvas')).default;
      const jsPDF = (await import('jspdf')).default;

      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
      });

      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = 210;
      const pdfHeight = 297;
      const marginX = 12;
      const marginY = 12;
      const printableWidth = pdfWidth - marginX * 2;
      const printableHeight = pdfHeight - marginY * 2;

      const canvasWidth = canvas.width;
      const canvasHeight = canvas.height;
      const pageHeightInCanvasPx = (printableHeight * canvasWidth) / printableWidth;

      let currentCanvasY = 0;
      let pageIndex = 0;

      while (currentCanvasY < canvasHeight) {
        if (pageIndex > 0) {
          pdf.addPage();
        }

        const sliceHeight = Math.min(pageHeightInCanvasPx, canvasHeight - currentCanvasY);

        const pageCanvas = document.createElement('canvas');
        pageCanvas.width = canvasWidth;
        pageCanvas.height = sliceHeight;
        const ctx = pageCanvas.getContext('2d');
        if (ctx) {
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, canvasWidth, sliceHeight);
          ctx.drawImage(
            canvas,
            0,
            currentCanvasY,
            canvasWidth,
            sliceHeight,
            0,
            0,
            canvasWidth,
            sliceHeight
          );
        }

        const pageImgData = pageCanvas.toDataURL('image/jpeg', 0.98);
        const renderedImgHeight = (sliceHeight * printableWidth) / canvasWidth;

        pdf.addImage(pageImgData, 'JPEG', marginX, marginY, printableWidth, renderedImgHeight);

        // Page footer in PDF
        pdf.setFontSize(8);
        pdf.setTextColor(148, 163, 184);
        pdf.text(
          `${formData.companyName || 'Enterprise'} | ${formData.contractNo} | ទំព័រ ${pageIndex + 1}`,
          pdfWidth / 2,
          pdfHeight - 6,
          { align: 'center' }
        );

        currentCanvasY += sliceHeight;
        pageIndex++;
      }

      const filename = `${formData.contractNo || 'Contract'}_${formData.employeeNameEn || 'Employee'}.pdf`;
      pdf.save(filename);

      Swal.fire({
        icon: 'success',
        title: 'ទាញយក PDF ជោគជ័យ!',
        text: `បានរក្សាទុកឯកសារ: ${filename}`,
        timer: 2000,
        showConfirmButton: false,
      });
    } catch (err: any) {
      console.error('Error generating PDF:', err);
      window.print();
    } finally {
      setIsExportingPdf(false);
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
  const [isTranslatingJobScope, setIsTranslatingJobScope] = useState(false);

  // Compute Standard Default MLVT Clause Texts based on current form inputs
  const defaultClauses = useMemo(() => {
    const formattedStartDate = formatContractDate(formData.startDate);
    const formattedEndDate = formatContractDate(formData.endDate);
    const formattedDob = formatContractDate(formData.dob);
    const formattedSignedDate = formatContractDate(formData.signedDate);

    // Clause 1: Contracting Parties & Contract Nature
    const c1Kh = `និយោជក៖ ឈ្មោះក្រុមហ៊ុន/សហគ្រាស ${formData.companyName || '__________'} អាសយដ្ឋាន ${formData.companyAddress || '__________'} តំណាងដោយ ${formData.representative || '__________'} តួនាទី ${formData.representativeRole || '__________'}។ កម្មករនិយោជិត៖ ឈ្មោះ ${formData.employeeNameKh || formData.employeeNameEn || '__________'} (ឡាតាំង: ${formData.employeeNameEn || '__________'}) ភេទ ${currentGender.kh} ថ្ងៃខែឆ្នាំកំណើត ${formattedDob} សញ្ជាតិ ${formData.nationality || 'ខ្មែរ'} លេខអត្តសញ្ញាណប័ណ្ណ/លិខិតឆ្លងដែន ${formData.nationalIdOrPassport || '__________'} អាសយដ្ឋានបច្ចុប្បន្ន ${formData.address || '__________'}។`;
    const c1En = `Employer: Company/Enterprise ${formData.companyName || '__________'}, address ${formData.companyAddress || '__________'}, represented by ${formData.representative || '__________'}, position ${formData.representativeRole || '__________'}. Employee: Name ${formData.employeeNameEn || '__________'} (Khmer: ${formData.employeeNameKh || formData.employeeNameEn || '__________'}), sex ${currentGender.en}, date of birth ${formattedDob}, nationality ${formData.nationality || 'Cambodian'}, ID/Passport ${formData.nationalIdOrPassport || '__________'}, address ${formData.address || '__________'}.`;
    const c1Zh = `雇主：公司/企业名称 ${formData.companyName || '__________'}，地址 ${formData.companyAddress || '__________'}，法定代表/授权人 ${formData.representative || '__________'}，职务 ${formData.representativeRole || '__________'}。员工：姓名 ${formData.employeeNameKh || formData.employeeNameEn || '__________'}（英文：${formData.employeeNameEn || '__________'}），性别 ${currentGender.zh}，出生日期 ${formattedDob}，国籍 ${formData.nationality || '柬埔寨'}，身份证/护照号 ${formData.nationalIdOrPassport || '__________'}，现居地址 ${formData.address || '__________'}。`;

    // Clause 2: Position, Workplace & Scope of Work (SCOP ការងារលម្អិត)
    const jobScopeKh = formData.jobScopeKh || formData.jobScope || 'ទទួលបន្ទុកអនុវត្តភារកិច្ចស្នូលប្រចាំថ្ងៃស្របតាមមុខតំណែង និងការណែនាំស្របច្បាប់របស់ថ្នាក់ដឹកនាំ; គោរពបទបញ្ជាផ្ទៃក្នុង គោលការណ៍វិជ្ជាជីវៈ និងច្បាប់ស្តីពីការងារនៃព្រះរាជាណាចក្រកម្ពុជា។';
    const jobScopeEn = formData.jobScopeEn || formData.jobScope || 'Execute core daily responsibilities in accordance with operational requirements and lawful instructions of management; observe company internal rules and the Labour Law of Cambodia.';
    const jobScopeZh = formData.jobScopeZh || formData.jobScope || '根据岗位说明及管理层正当工作指派履行日常职责；严格遵守公司内部规章制度及柬埔寨王国劳动法。';

    const c2Kh = `• មុខតំណែង៖ ${formData.positionTitle || '__________'} | នាយកដ្ឋាន៖ ${formData.department || '__________'}\n• ទីកន្លែងធ្វើការ៖ ${formData.workplace || formData.companyAddress || '__________'}\n• អ្នករាយការណ៍ផ្ទាល់៖ ${formData.supervisorRole || 'ថ្នាក់ដឹកនាំផ្ទាល់ / Direct Supervisor'}\n• វិសាលភាពភារកិច្ចការងារលម្អិត (Scope of Work)៖ ${jobScopeKh}`;
    const c2En = `• Position: ${formData.positionTitle || '__________'} | Department: ${formData.department || '__________'}\n• Workplace: ${formData.workplace || formData.companyAddress || '__________'}\n• Direct Supervisor: ${formData.supervisorRole || 'Direct Supervisor'}\n• Scope of Work / Core Responsibilities: ${jobScopeEn}`;
    const c2Zh = `• 岗位职务：${formData.positionTitle || '__________'} | 所属部门：${formData.department || '__________'}\n• 工作地点：${formData.workplace || formData.companyAddress || '__________'}\n• 直接汇报上级：${formData.supervisorRole || '直接主管'}\n• 详细工作职责范围（Scope of Work）：${jobScopeZh}`;

    // Clause 3: Wages & Payment
    const c3Kh = `• ប្រាក់ឈ្នួលគោល៖ ${formData.basicSalaryUsd ? '$' + formData.basicSalaryUsd.toLocaleString() : '__________'} ដុល្លារ/ខែ ឬ ${formData.basicSalaryKhr ? formData.basicSalaryKhr.toLocaleString() : '__________'} រៀល/ខែ (មិនទាបជាងកម្រិតប្រាក់ឈ្នួលអប្បបរមា)។\n• កាលបរិច្ឆេទ និងមធ្យោបាយទូទាត់៖ ថ្ងៃទី ${formData.paymentDay || '01-05'} នៃខែនីមួយៗ តាមរយៈ ${formData.paymentMethod || 'Bank Transfer / ផ្ទេរតាមធនាគារ'} (មាត្រា ១១៦)។\n• ប្រាក់ថែមម៉ោង (OT)៖ គណនាតាមមាត្រា ១៣៩ (១៣០% ម៉ោងធម្មតា, ១៥០% ពេលយប់ ឬ ២០០% ថ្ងៃអាទិត្យ/បុណ្យ)។`;
    const c3En = `• Basic Wage: USD ${formData.basicSalaryUsd ? '$' + formData.basicSalaryUsd.toLocaleString() : '__________'}/month or KHR ${formData.basicSalaryKhr ? formData.basicSalaryKhr.toLocaleString() : '__________'}/month (never below statutory minimum wage).\n• Payment Schedule & Method: Disbursed on the ${formData.paymentDay || '01-05'} of each month via ${formData.paymentMethod || 'Bank Transfer'} (Article 116).\n• Overtime (OT): Paid according to Article 139 (130% normal, 150% night work, or 200% Sundays/Public Holidays).`;
    const c3Zh = `• 基本工资：每月 ${formData.basicSalaryUsd ? '$' + formData.basicSalaryUsd.toLocaleString() : '__________'} 美元或 ${formData.basicSalaryKhr ? formData.basicSalaryKhr.toLocaleString() : '__________'} 瑞尔（不低于法定最低工资）。\n• 发薪日及方式：每月 ${formData.paymentDay || '01-05'} 日通过 ${formData.paymentMethod || '银行转账'} 支付（第116条）。\n• 加班费：依第139条核算（平时130%，夜间150%，周日及法定节假日200%）。`;

    // Clause 4: Working Hours & Rest
    const c4Kh = `• ម៉ោងធ្វើការធម្មតា៖ ${formData.workingHours || '07:00 ដល់ 11:00 / 13:00 ដល់ 17:00'} (មិនលើស ៨ ម៉ោង/ថ្ងៃ និង ៤៨ ម៉ោង/សប្តាហ៍ តាមមាត្រា ១៣៧)។\n• សម្រាកអាហារថ្ងៃត្រង់៖ ${formData.mealBreak || '11:00 ដល់ 13:00'}។\n• ថ្ងៃធ្វើការ៖ ${formData.workingDays || 'ច័ន្ទ ដល់ សៅរ៍'} ដោយមានថ្ងៃឈប់សម្រាកប្រចាំសប្តាហ៍យ៉ាងតិច ២៤ ម៉ោងជាប់គ្នា (ជាទូទៅថ្ងៃអាទិត្យ មាត្រា ១៤៦)។`;
    const c4En = `• Normal Work Hours: ${formData.workingHours || '07:00 to 11:00 / 13:00 to 17:00'} (not exceeding 8 hours/day and 48 hours/week pursuant to Article 137).\n• Meal Break: ${formData.mealBreak || '11:00 to 13:00'}.\n• Working Days: ${formData.workingDays || 'Monday to Saturday'} with at least 24 consecutive hours of weekly rest (normally Sunday, Article 146).`;
    const c4Zh = `• 正常工作时间：${formData.workingHours || '07:00至11:00 / 13:00至17:00'}（依照第137条，每日不超过8小时、每周不超过48小时）。\n• 用餐与中休：${formData.mealBreak || '11:00至13:00'}。\n• 工作日安排：${formData.workingDays || '周一至周六'}，每周保证至少连续24小时的休息日（通常为周日，第146条）。`;

    // Clause 5: Leave & Social Security
    const c5Kh = `• ការឈប់សម្រាកប្រចាំឆ្នាំមានប្រាក់ឈ្នួល៖ ១.៥ ថ្ងៃក្នុងមួយខែ (១៨ ថ្ងៃក្នុងមួយឆ្នាំ) និងបូកបន្ថែម ១ ថ្ងៃក្នុងរៀងរាល់ ៣ ឆ្នាំនៃអតីតភាពការងារ (មាត្រា ១៦៦)។\n• ថ្ងៃបុណ្យជាតិមានប្រាក់ឈ្នួល៖ អនុវត្តតាមសេចក្តីប្រកាសប្រចាំឆ្នាំរបស់ក្រសួងការងារ និងបណ្តុះបណ្តាលវិជ្ជាជីវៈ (មាត្រា ១៦១)។\n• របបសន្តិសុខសង្គម ប.ស.ស.៖ និយោជកធានាចុះបញ្ជិកា និងបង់វិភាគទាន ប.ស.ស. លើផ្នែកហានិភ័យការងារ ថែទាំសុខភាព និងប្រាក់សោធននិវត្តន៍ ជូនកម្មករនិយោជិតស្របតាមច្បាប់។`;
    const c5En = `• Paid Annual Leave: 1.5 days per month of service (18 days/year), plus 1 additional day per 3 years of seniority (Article 166).\n• Paid Public Holidays: Fully observed in accordance with the annual Prakas of the MLVT (Article 161).\n• NSSF Social Security: The employer ensures full enrollment and timely contributions for Occupational Risk, Health Care, and Pension Schemes.`;
    const c5Zh = `• 带薪年假：每月1.5个工作日（全年18天），并在本企业每满3年工龄递增1天（第166条）。\n• 带薪法定假日：严格执行柬埔寨劳工部年度法定公共假日通告（第161条）。\n• 国家社保（NSSF）：雇主依法为员工办理并缴纳工伤保险、健康医疗保险及养老保险金。`;

    // Clause 6: Safety, Health, Discipline & Suspension
    const c6Kh = `• សុវត្ថិភាព និងសុខភាពការងារ៖ និយោជកធានាបរិយាកាសការងារប្រកបដោយអនាម័យ សុវត្ថិភាព និងផ្តល់ឧបករណ៍ការពារការងារ (PPE) គ្រប់គ្រាន់ (មាត្រា ២២៩)។\n• បទបញ្ជាផ្ទៃក្នុង និងវិន័យ៖ កម្មករនិយោជិតត្រូវគោរពបទបញ្ជាផ្ទៃក្នុងសហគ្រាសយ៉ាងម៉ឺងម៉ាត់។\n• ការព្យួរកិច្ចសន្យាការងារ៖ អនុវត្តតាមមាត្រា ៧១ និង ៧២ នៃច្បាប់ស្តីពីការងារ ដោយរក្សានូវកាតព្វកិច្ចស្មោះត្រង់ និងការសម្ងាត់។`;
    const c6En = `• Occupational Safety & Health: The employer maintains a safe, hygienic environment and supplies necessary personal protective equipment (Article 229).\n• Internal Regulations: The employee complies strictly with enterprise internal work rules and discipline.\n• Suspension of Contract: Carried out pursuant to Articles 71 and 72 of the Labour Law, preserving loyalty and confidentiality obligations.`;
    const c6Zh = `• 职业健康与安全：雇主提供符合标准的劳动卫生安全环境并按需配发防护用品（第229条）。\n• 规章纪律：员工严格遵守公司内部规程与岗位纪律。\n• 合同中止：依照劳动法第71条和第72条规定执行，中止期间双方仍须恪守诚信与保密义务。`;

    // Clause 7: Confidentiality & Non-discrimination
    const c7Kh = `• ការរក្សាការសម្ងាត់៖ កម្មករនិយោជិតត្រូវរក្សាការសម្ងាត់វិជ្ជាជីវៈ និងព័ត៌មានផ្ទៃក្នុងរបស់ក្រុមហ៊ុនទាំងក្នុងអំឡុងពេល និងក្រោយពេលផុតរលត់កិច្ចសន្យា (មាត្រា ៧០ នៃច្បាប់ការងារ)។\n• គ្មានការរើសអើង និងការស្ម័គ្រចិត្ត៖ គ្មានការងារបង្ខិតបង្ខំ ឬការរើសអើងពូជសាសន៍ ពណ៌សម្បុរ ភេទ ជំនឿ សាសនា ឬសហជីព (មាត្រា ១២)។ និយោជកមិនរក្សាទុកឯកសារសម្គាល់ខ្លួនដើមរបស់កម្មករនិយោជិតដោយខុសច្បាប់ឡើយ។`;
    const c7En = `• Confidentiality & Loyalty: The employee preserves company trade secrets and internal data during and after contract termination (Article 70).\n• Non-Discrimination & Voluntary Labour: Employment is voluntary without forced labour or discrimination based on race, color, gender, religion, or union membership (Article 12). The employer shall not retain original personal documents unlawfully.`;
    const c7Zh = `• 商业秘密与忠实义务：员工在履职期间及离职后，均须对公司商业秘密与核心信息承担严格保密义务（第70条）。\n• 反歧视与自愿劳动：禁止强迫劳动，禁止因种族、肤色、性别、宗教信仰或工会关系产生歧视（第12条）。雇主严禁非法扣留员工个人证件原件。`;

    // Clause 8: Termination Benefits & Dispute Resolution
    const dispKm = `• អត្ថប្រយោជន៍បញ្ចប់កិច្ចសន្យា៖ និយោជកត្រូវទូទាត់ប្រាក់ឈ្នួលមិនទាន់បើក (មាត្រា ១១៦) ប្រាក់បំណាច់ទូទាត់ជួសការឈប់សម្រាកប្រចាំឆ្នាំដែលនៅសល់ (មាត្រា ១៦៦-១៦៧) និងប្រាក់បំណាច់បញ្ចប់កិច្ចសន្យា ៥% សម្រាប់ FDC (មាត្រា ៧៣) ឬប្រាក់បំណាច់អតីតភាពសម្រាប់ UDC (មាត្រា ៨៩ ថ្មី)។\n• ការដោះស្រាយវិវាទ៖ វិវាទការងារត្រូវដោះស្រាយតាមការផ្សះផ្សា និងនីតិវិធីច្បាប់ការងារកម្ពុជា។ អនុលោមតាមមាត្រា ១៣ (សេចក្តីបង្គាប់ជាសាធារណៈ) លក្ខខណ្ឌដែលផ្តល់អត្ថប្រយោជន៍ប្រសើរជាងច្បាប់ដល់កម្មករនិយោជិតត្រូវមានអាទិភាព។`;
    const dispEn = `• Termination Entitlements: The employer settles unpaid wages (Article 116), compensation for unused annual leave (Articles 166-167), and statutory 5% severance for FDC (Article 73) or seniority payments for UDC (New Article 89).\n• Dispute Resolution & Public Order: Labour disputes shall be resolved through dialogue, conciliation, and statutory Cambodian procedures. Under Article 13 (Public Order), terms more favourable to the employee always prevail.`;
    const dispZh = `• 解除及期满待遇：雇主须结清未结工资（第116条）、未休年假折算补偿金（第166-167条），并足额支付FDC期满补偿金5%（第73条）或UDC工龄补偿金（新第89条）。\n• 争议解决与公共秩序原则：劳动争议通过协商、调解及法定程序解决。依第13条（公共秩序原则），凡对员工更优厚的合同约定或法定条款优先适用。`;

    return {
      c1: { kh: c1Kh, en: c1En, zh: c1Zh },
      c2: { kh: c2Kh, en: c2En, zh: c2Zh },
      c3: { kh: c3Kh, en: c3En, zh: c3Zh },
      c4: { kh: c4Kh, en: c4En, zh: c4Zh },
      c5: { kh: c5Kh, en: c5En, zh: c5Zh },
      c6: { kh: c6Kh, en: c6En, zh: c6Zh },
      c7: { kh: c7Kh, en: c7En, zh: c7Zh },
      c8: { kh: dispKm, en: dispEn, zh: dispZh },
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

  // Translate Job Scope into English and Chinese
  const handleTranslateJobScope = async () => {
    const textToTranslate = formData.jobScopeKh || formData.jobScope || '';
    if (!textToTranslate.trim()) {
      Swal.fire('សូមបញ្ចូលខ្លឹមសារ', 'សូមវាយបញ្ចូលខ្លឹមសារភារកិច្ចការងារជាភាសាខ្មែរជាមុនសិន!', 'info');
      return;
    }
    try {
      setIsTranslatingJobScope(true);
      const res = await fetch('/api/contracts/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: textToTranslate, sourceLang: 'km' }),
      });
      const data = await res.json();
      if (data.success) {
        setFormData((prev) => ({
          ...prev,
          jobScopeKh: data.km || prev.jobScopeKh || textToTranslate,
          jobScopeEn: data.en || prev.jobScopeEn,
          jobScopeZh: data.zh || prev.jobScopeZh,
        }));
        Swal.fire({
          icon: 'success',
          title: 'បកប្រែជោគជ័យ!',
          text: 'ភារកិច្ចការងារត្រូវបានបកប្រែ និងរត់ចូលទាំង ៣ ភាសា!',
          timer: 1800,
          showConfirmButton: false,
        });
      }
    } catch (err: any) {
      console.error('Job scope translate error:', err);
    } finally {
      setIsTranslatingJobScope(false);
    }
  };

  // Select Job Scope Preset
  const handleSelectJobScopePreset = (preset: JobScopePreset) => {
    setFormData((prev) => ({
      ...prev,
      jobScope: preset.scopeKh,
      jobScopeKh: preset.scopeKh,
      jobScopeEn: preset.scopeEn,
      jobScopeZh: preset.scopeZh,
    }));
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
            onClick={() => {
              setSelectedIsoEmployee(null);
              setSelectedIsoContractType('PROBATION');
              setShowIsoProbationModal(true);
            }}
            style={{
              background: '#047857',
              color: '#ffffff',
              fontWeight: 700,
              padding: '0.45rem 1rem',
              borderRadius: '8px',
              border: 'none',
              cursor: 'pointer',
              fontSize: '0.86rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
            }}
            title="ទម្រង់កិច្ចសន្យា ISO 9001:2015 ៤ ទំព័រ (FDC, UDC, បុគ្គលិកជនបរទេស, សាកល្បង / 试用工)"
          >
            <span>🏭</span>
            កិច្ចសន្យា ISO 9001:2015 (FDC • UDC • បរទេស • សាកល្បង)
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
                            let parsedClauses: any = {};
                            if (c.customClausesJson) {
                              try {
                                parsedClauses = JSON.parse(c.customClausesJson);
                              } catch (e) {
                                console.error('Error parsing customClausesJson:', e);
                              }
                            }
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
                              supervisorRole: parsedClauses.supervisorRole || 'ប្រធានផ្នែក / Head of Department',
                              jobScope: parsedClauses.jobScope || '',
                              jobScopeKh: parsedClauses.jobScopeKh || parsedClauses.jobScope || '',
                              jobScopeEn: parsedClauses.jobScopeEn || '',
                              jobScopeZh: parsedClauses.jobScopeZh || '',
                              clause1BodyKh: parsedClauses.clause1BodyKh,
                              clause1BodyEn: parsedClauses.clause1BodyEn,
                              clause1BodyZh: parsedClauses.clause1BodyZh,
                              clause2BodyKh: parsedClauses.clause2BodyKh,
                              clause2BodyEn: parsedClauses.clause2BodyEn,
                              clause2BodyZh: parsedClauses.clause2BodyZh,
                              clause3BodyKh: parsedClauses.clause3BodyKh,
                              clause3BodyEn: parsedClauses.clause3BodyEn,
                              clause3BodyZh: parsedClauses.clause3BodyZh,
                              clause4BodyKh: parsedClauses.clause4BodyKh,
                              clause4BodyEn: parsedClauses.clause4BodyEn,
                              clause4BodyZh: parsedClauses.clause4BodyZh,
                              clause5BodyKh: parsedClauses.clause5BodyKh,
                              clause5BodyEn: parsedClauses.clause5BodyEn,
                              clause5BodyZh: parsedClauses.clause5BodyZh,
                              clause6BodyKh: parsedClauses.clause6BodyKh,
                              clause6BodyEn: parsedClauses.clause6BodyEn,
                              clause6BodyZh: parsedClauses.clause6BodyZh,
                              clause7BodyKh: parsedClauses.clause7BodyKh,
                              clause7BodyEn: parsedClauses.clause7BodyEn,
                              clause7BodyZh: parsedClauses.clause7BodyZh,
                              clause8BodyKh: parsedClauses.clause8BodyKh,
                              clause8BodyEn: parsedClauses.clause8BodyEn,
                              clause8BodyZh: parsedClauses.clause8BodyZh,
                              clause9BodyKh: parsedClauses.clause9BodyKh,
                              clause9BodyEn: parsedClauses.clause9BodyEn,
                              clause9BodyZh: parsedClauses.clause9BodyZh,
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
                        <button
                          onClick={() => {
                            setSelectedIsoEmployee(c.employee);
                            setSelectedIsoContractType(c.contractType);
                            setShowIsoProbationModal(true);
                          }}
                          title={`កិច្ចសន្យា ISO 9001:2015 ៤ ទំព័រ (${c.contractType})`}
                          style={{
                            background: '#ecfdf5',
                            color: '#059669',
                            border: '1px solid #a7f3d0',
                            borderRadius: '6px',
                            padding: '0.3rem 0.55rem',
                            fontWeight: 600,
                            cursor: 'pointer',
                            fontSize: '0.78rem',
                            marginLeft: '4px',
                          }}
                        >
                          🏭 ISO 9001
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
                  type="button"
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
                  title="បោះពុម្ពកិច្ចសន្យា"
                >
                  🖨️ បោះពុម្ព (Print)
                </button>
                <button
                  type="button"
                  onClick={handleExportPdf}
                  disabled={isExportingPdf}
                  style={{
                    background: '#dc2626',
                    color: '#ffffff',
                    border: 'none',
                    padding: '0.4rem 0.75rem',
                    borderRadius: '6px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                    fontSize: '0.8rem',
                    whiteSpace: 'nowrap',
                    boxShadow: '0 2px 6px rgba(220, 38, 38, 0.25)',
                  }}
                  title="ទាញយកឯកសារកិច្ចសន្យាជាទម្រង់ PDF"
                >
                  <span>📑</span>
                  {isExportingPdf ? 'កំពុងបង្កើត PDF...' : 'ទាញយក PDF (.pdf)'}
                </button>
                <button
                  type="button"
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
                  title="ទាញយកឯកសារជា Word Docx"
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
                    💼 ៤. មុខតំណែង ទីកន្លែងធ្វើការ និងវិសាលភាពភារកិច្ចការងារ (Position & Scope of Work - មាត្រា ៦៥ & ៧)
                  </h3>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
                    <div>
                      <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.35rem', fontSize: '0.85rem' }}>
                        មុខតំណែង (Position Title):
                      </label>
                      <input
                        type="text"
                        value={formData.positionTitle}
                        onChange={(e) => setFormData({ ...formData, positionTitle: e.target.value })}
                        placeholder="ឧ. មន្ត្រីរដ្ឋបាល / Admin Officer"
                        style={{ width: '100%', padding: '0.55rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.88rem' }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.35rem', fontSize: '0.85rem' }}>
                        នាយកដ្ឋាន / ផ្នែក (Department):
                      </label>
                      <input
                        type="text"
                        value={formData.department}
                        onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                        placeholder="ឧ. រដ្ឋបាល និងធនធានមនុស្ស"
                        style={{ width: '100%', padding: '0.55rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.88rem' }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.35rem', fontSize: '0.85rem' }}>
                        ទីកន្លែងបំពេញការងារ (Workplace):
                      </label>
                      <input
                        type="text"
                        value={formData.workplace}
                        onChange={(e) => setFormData({ ...formData, workplace: e.target.value })}
                        placeholder="ឧ. រាជធានីភ្នំពេញ ឬសាខា..."
                        style={{ width: '100%', padding: '0.55rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.88rem' }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.35rem', fontSize: '0.85rem' }}>
                        អ្នករាយការណ៍ផ្ទាល់ / ឋានានុក្រម (Direct Supervisor):
                      </label>
                      <input
                        type="text"
                        value={formData.supervisorRole || ''}
                        onChange={(e) => setFormData({ ...formData, supervisorRole: e.target.value })}
                        placeholder="ឧ. ប្រធានផ្នែក / Head of Dept"
                        style={{ width: '100%', padding: '0.55rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.88rem' }}
                      />
                    </div>
                  </div>

                  {/* Preset Scope of Work Quick Selection */}
                  <div style={{ background: '#f8fafc', padding: '0.85rem', borderRadius: '8px', border: '1px solid #e2e8f0', marginBottom: '1rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                      <span style={{ fontSize: '0.84rem', fontWeight: 700, color: '#334155' }}>
                        ⚡ គំរូភារកិច្ចការងាររហ័ស (Quick Scope Presets):
                      </span>
                      <button
                        type="button"
                        onClick={handleTranslateJobScope}
                        disabled={isTranslatingJobScope}
                        style={{
                          background: '#eff6ff',
                          color: '#2563eb',
                          border: '1px solid #bfdbfe',
                          borderRadius: '6px',
                          padding: '0.25rem 0.65rem',
                          fontSize: '0.78rem',
                          fontWeight: 600,
                          cursor: 'pointer',
                        }}
                      >
                        {isTranslatingJobScope ? 'កំពុងបកប្រែ...' : '🔄 បកប្រែរត់អូតូជា អង់គ្លេស & ចិន'}
                      </button>
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                      {JOB_SCOPE_PRESETS.map((preset) => (
                        <button
                          key={preset.id}
                          type="button"
                          onClick={() => handleSelectJobScopePreset(preset)}
                          style={{
                            background: '#ffffff',
                            border: '1px solid #cbd5e1',
                            borderRadius: '6px',
                            padding: '0.25rem 0.6rem',
                            fontSize: '0.78rem',
                            color: '#1e293b',
                            cursor: 'pointer',
                            transition: 'all 0.15s',
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.borderColor = '#2563eb';
                            e.currentTarget.style.color = '#2563eb';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.borderColor = '#cbd5e1';
                            e.currentTarget.style.color = '#1e293b';
                          }}
                        >
                          + {preset.titleKh}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Multilingual Scope Textareas */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.25rem' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#0f172a', marginBottom: '0.25rem' }}>
                        🇰🇭 វិសាលភាពភារកិច្ចការងារ (ភាសាខ្មែរ - Scope of Work in Khmer):
                      </label>
                      <textarea
                        rows={3}
                        value={formData.jobScopeKh || formData.jobScope || ''}
                        onChange={(e) => setFormData({ ...formData, jobScope: e.target.value, jobScopeKh: e.target.value })}
                        placeholder="រៀបរាប់ពីភារកិច្ច និងការទទួលខុសត្រូវស្នូលរបស់មុខតំណែងនេះ..."
                        style={{ width: '100%', padding: '0.55rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem', fontFamily: 'inherit' }}
                      />
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '0.75rem' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#334155', marginBottom: '0.25rem' }}>
                          🇬🇧 វិសាលភាពភារកិច្ចការងារ (English):
                        </label>
                        <textarea
                          rows={2}
                          value={formData.jobScopeEn || ''}
                          onChange={(e) => setFormData({ ...formData, jobScopeEn: e.target.value })}
                          placeholder="Scope of work in English..."
                          style={{ width: '100%', padding: '0.45rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.82rem', fontFamily: 'inherit' }}
                        />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#475569', marginBottom: '0.25rem' }}>
                          🇨🇳 វិសាលភាពភារកិច្ចការងារ (中文 - Chinese):
                        </label>
                        <textarea
                          rows={2}
                          value={formData.jobScopeZh || ''}
                          onChange={(e) => setFormData({ ...formData, jobScopeZh: e.target.value })}
                          placeholder="工作职责说明..."
                          style={{ width: '100%', padding: '0.45rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.82rem', fontFamily: 'inherit' }}
                        />
                      </div>
                    </div>
                  </div>

                  <h3 style={{ borderBottom: '2px solid #e2e8f0', paddingBottom: '0.65rem', margin: '1.75rem 0 1.25rem 0', color: '#1e3a8a', fontSize: '1.1rem' }}>
                    💵 ៥. ប្រាក់ឈ្នួល និងម៉ោងធ្វើការ (Wages & Working Hours)
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
                    { num: 1, titleKm: '១. ភាគីនៃកិច្ចសន្យា និងប្រភេទកិច្ចសន្យា', titleEn: '1. Contracting parties & contract terms', titleZh: '一、合同双方及期限', keyKh: 'clause1BodyKh', keyEn: 'clause1BodyEn', keyZh: 'clause1BodyZh', def: defaultClauses.c1 },
                    { num: 2, titleKm: '២. មុខតំណែង ទីកន្លែងធ្វើការ និងវិសាលភាពភារកិច្ចការងារ', titleEn: '2. Position, workplace & scope of work', titleZh: '二、岗位、工作地点及工作职责', keyKh: 'clause2BodyKh', keyEn: 'clause2BodyEn', keyZh: 'clause2BodyZh', def: defaultClauses.c2 },
                    { num: 3, titleKm: '៣. ប្រាក់ឈ្នួល ការទូទាត់ និងប្រាក់បន្ទាប់បន្សំ', titleEn: '3. Wages, payment & allowances', titleZh: '三、工资、支付及津贴', keyKh: 'clause3BodyKh', keyEn: 'clause3BodyEn', keyZh: 'clause3BodyZh', def: defaultClauses.c3 },
                    { num: 4, titleKm: '៤. ម៉ោងធ្វើការ ម៉ោងសម្រាក និងថ្ងៃឈប់សម្រាក', titleEn: '4. Working hours, meal break & rest', titleZh: '四、工作时间、休息及休假', keyKh: 'clause4BodyKh', keyEn: 'clause4BodyEn', keyZh: 'clause4BodyZh', def: defaultClauses.c4 },
                    { num: 5, titleKm: '៥. ការឈប់សម្រាកប្រចាំឆ្នាំ ថ្ងៃបុណ្យ និងរបបសន្តិសុខសង្គម', titleEn: '5. Annual leave, holidays & social security (NSSF)', titleZh: '五、年假、法定节假日及国家社保（NSSF）', keyKh: 'clause5BodyKh', keyEn: 'clause5BodyEn', keyZh: 'clause5BodyZh', def: defaultClauses.c5 },
                    { num: 6, titleKm: '៦. សុវត្ថិភាព សុខភាពការងារ បទបញ្ជាផ្ទៃក្នុង និងការព្យួរ', titleEn: '6. Occupational health, safety, discipline & suspension', titleZh: '六、安全卫生、内部规程及合同中止', keyKh: 'clause6BodyKh', keyEn: 'clause6BodyEn', keyZh: 'clause6BodyZh', def: defaultClauses.c6 },
                    { num: 7, titleKm: '៧. ការរក្សាការសម្ងាត់ និងការមិនរើសអើង', titleEn: '7. Confidentiality, loyalty & non-discrimination', titleZh: '七、保密义务、诚信与反歧视', keyKh: 'clause7BodyKh', keyEn: 'clause7BodyEn', keyZh: 'clause7BodyZh', def: defaultClauses.c7 },
                    { num: 8, titleKm: '៨. ការបញ្ចប់កិច្ចសន្យា អត្ថប្រយោជន៍ និងការដោះស្រាយវិវាទ', titleEn: '8. Termination benefits, notice & dispute resolution', titleZh: '八、终止补偿、提前通知及争议解决', keyKh: 'clause8BodyKh', keyEn: 'clause8BodyEn', keyZh: 'clause8BodyZh', def: defaultClauses.c8 },
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
                  {/* National Motto & Kingdom Header */}
                  <div style={{ textAlign: 'center', marginBottom: '0.75rem', lineHeight: 1.35 }}>
                    <div style={{ fontSize: '1rem', fontWeight: 800, color: '#1e3a8a' }}>
                      ព្រះរាជាណាចក្រកម្ពុជា
                    </div>
                    <div style={{ fontSize: '0.92rem', fontWeight: 700, color: '#1e3a8a' }}>
                      ជាតិ សាសនា ព្រះមហាក្សត្រ
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#64748b', fontStyle: 'italic', marginTop: '2px' }}>
                      KINGDOM OF CAMBODIA • NATION RELIGION KING
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                      柬埔寨王国 • 民族 宗教 国王
                    </div>
                  </div>

                  {/* Header Meta: Company Name & Document No */}
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      borderTop: '1px solid #e2e8f0',
                      borderBottom: '2px solid #1e3a8a',
                      paddingTop: '0.5rem',
                      paddingBottom: '0.5rem',
                      marginBottom: '0.85rem',
                    }}
                  >
                    <div>
                      <div style={{ fontSize: '0.78rem', color: '#64748b' }}>
                        ឈ្មោះក្រុមហ៊ុន / Company name / 公司名称:
                      </div>
                      <div style={{ fontSize: '1.05rem', fontWeight: 800, color: '#1e3a8a' }}>
                        {formData.companyName || '__________________________'}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right', fontSize: '0.8rem', color: '#475569' }}>
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
                  <div style={{ textAlign: 'center', margin: '0.85rem 0 0.85rem 0' }}>
                    <h2
                      style={{
                        fontSize: '1.35rem',
                        fontWeight: 800,
                        color: '#1e3a8a',
                        margin: '0 0 0.2rem 0',
                        letterSpacing: '0.3px',
                      }}
                    >
                      {currentMeta.nameKh}
                    </h2>
                    <h3
                      style={{
                        fontSize: '0.95rem',
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
                        fontSize: '0.95rem',
                        fontWeight: 600,
                        color: '#475569',
                        margin: '0',
                      }}
                    >
                      {currentMeta.nameZh}
                    </h3>

                    {/* Legal framework reference */}
                    <div style={{ fontSize: '0.75rem', color: '#64748b', fontStyle: 'italic', marginTop: '0.35rem' }}>
                      {currentMeta.lawRefKh}
                    </div>

                    {/* Signed at & Date */}
                    <div
                      style={{
                        marginTop: '0.65rem',
                        fontSize: '0.85rem',
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

                  {/* Clause 1: Contracting Parties & Terms */}
                  <div className={styles.contractSection}>
                    <div className={styles.contractSectionHeader}>
                      ១. ភាគីនៃកិច្ចសន្យា និងប្រភេទកិច្ចសន្យា / 1. Contracting parties & contract terms / 一、合同双方及期限
                    </div>
                    {/* Khmer */}
                    <p className={styles.contractTextKm}>
                      {formData.clause1BodyKh || defaultClauses.c1.kh}
                    </p>
                    {/* English */}
                    <p className={styles.contractTextEn}>
                      {formData.clause1BodyEn || defaultClauses.c1.en}
                    </p>
                    {/* Chinese */}
                    <p className={styles.contractTextZh}>
                      {formData.clause1BodyZh || defaultClauses.c1.zh}
                    </p>

                    {/* Term variation detail banner */}
                    {formData.contractType === 'PROBATION' && (
                      <div style={{ background: '#fffbeb', padding: '0.55rem 0.75rem', borderRadius: '6px', borderLeft: '3px solid #d97706', marginTop: '0.35rem' }}>
                        <div style={{ fontWeight: 700, color: '#b45309', fontSize: '0.85rem' }}>
                          រយៈពេលសាកល្បង / Probation period / 试用期限 (មាត្រា ៦៨ & ៨២)
                        </div>
                        <p style={{ margin: '0.2rem 0', fontSize: '0.84rem', lineHeight: 1.5 }}>
                          ចាប់ពីថ្ងៃទី <u>{formatContractDate(formData.startDate)}</u> ដល់ថ្ងៃទី{' '}
                          <u>{formatContractDate(formData.endDate)}</u>។ រយៈពេលអតិបរមាស្របតាមមាត្រា ៦៨៖ ៣ ខែសម្រាប់និយោជិត; ២ ខែសម្រាប់កម្មករឯកទេស; ១ ខែសម្រាប់កម្មករធម្មតា (ប្រភេទ៖{' '}
                          <u>
                            {formData.probationCategory === 'SPECIALISED'
                              ? 'កម្មករឯកទេស (២ ខែ)'
                              : formData.probationCategory === 'NON_SPECIALISED'
                              ? 'កម្មករធម្មតា (១ ខែ)'
                              : 'និយោជិត/ការិយាល័យ (៣ ខែ)'}
                          </u>
                          )។ សោហ៊ុយធ្វើដំណើរទៅមកជាបន្ទុកនិយោជក។ យោងមាត្រា ៨២ មិនបាច់ជូនដំណឹងមុនពេលសាកល្បងឡើយ។
                        </p>
                      </div>
                    )}

                    {formData.contractType === 'UDC' && (
                      <div style={{ background: '#ecfdf5', padding: '0.55rem 0.75rem', borderRadius: '6px', borderLeft: '3px solid #059669', marginTop: '0.35rem' }}>
                        <div style={{ fontWeight: 700, color: '#047857', fontSize: '0.85rem' }}>
                          ការចាប់ផ្តើម និងថិរវេលា / Commencement & duration / 开始日期及期限 (មាត្រា ៧៤, ៧៥, ៨៩ ថ្មី)
                        </div>
                        <p style={{ margin: '0.2rem 0', fontSize: '0.84rem', lineHeight: 1.5 }}>
                          ចាប់ផ្តើមថ្ងៃទី <u>{formatContractDate(formData.startDate)}</u> ដោយគ្មានកំណត់ថ្ងៃបញ្ចប់។ ការជូនដំណឹងមុនតាមមាត្រា ៧៥ (៧ថ្ងៃ, ១៥ថ្ងៃ, ១ខែ, ២ខែ, ៣ខែ តាមអតីតភាពការងារ) និងទូទាត់ប្រាក់បំណាច់អតីតភាពការងាររៀងរាល់ ៦ ខែម្តង (មាត្រា ៨៩ ថ្មី)។
                        </p>
                      </div>
                    )}

                    {(formData.contractType === 'FDC' || formData.contractType === 'FOREIGN_FDC') && (
                      <div style={{ background: '#eff6ff', padding: '0.55rem 0.75rem', borderRadius: '6px', borderLeft: '3px solid #2563eb', marginTop: '0.35rem' }}>
                        <div style={{ fontWeight: 700, color: '#1d4ed8', fontSize: '0.85rem' }}>
                          ថិរវេលាកំណត់ / Fixed duration term / 合同期限 (មាត្រា ៦៧, ៧៣ & សេចក្តីណែនាំ ០៥០/១៩)
                        </div>
                        <p style={{ margin: '0.2rem 0', fontSize: '0.84rem', lineHeight: 1.5 }}>
                          ចាប់ពីថ្ងៃទី <u>{formatContractDate(formData.startDate)}</u> ដល់ថ្ងៃទី{' '}
                          <u>{formatContractDate(formData.endDate)}</u> (មិនលើស ២ ឆ្នាំក្នុងម្តង និងការបន្តសរុបមិនលើស ៤ ឆ្នាំតាមសេចក្តីណែនាំលេខ ០៥០/១៩)។
                          {formData.isForeigner && formData.workPermitNo && (
                            <span> [ប័ណ្ណការងារ MLVT: <u>{formData.workPermitNo}</u> ផុតកំណត់: <u>{formatContractDate(formData.workPermitExpiry)}</u>]</span>
                          )}
                          ។ នៅពេលចប់កិច្ចសន្យា ជូនដំណឹងមុនតាមមាត្រា ៧៣ (១០ថ្ងៃ ឬ ១៥ថ្ងៃ) និងទូទាត់ប្រាក់បំណាច់បញ្ចប់កិច្ចសន្យាយ៉ាងតិច ៥% នៃប្រាក់ឈ្នួលសរុប។
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Clause 2: Position, Workplace & Scope of Work */}
                  <div className={styles.contractSection}>
                    <div className={styles.contractSectionHeader}>
                      ២. មុខតំណែង ទីកន្លែងធ្វើការ និងវិសាលភាពភារកិច្ចការងារ / 2. Position, workplace & scope of work / 二、岗位、工作地点及工作职责
                    </div>
                    <p className={styles.contractTextKm} style={{ whiteSpace: 'pre-line' }}>
                      {formData.clause2BodyKh || defaultClauses.c2.kh}
                    </p>
                    <p className={styles.contractTextEn} style={{ whiteSpace: 'pre-line' }}>
                      {formData.clause2BodyEn || defaultClauses.c2.en}
                    </p>
                    <p className={styles.contractTextZh} style={{ whiteSpace: 'pre-line' }}>
                      {formData.clause2BodyZh || defaultClauses.c2.zh}
                    </p>
                  </div>

                  {/* Clause 3: Wages & Payment */}
                  <div className={styles.contractSection}>
                    <div className={styles.contractSectionHeader}>
                      ៣. ប្រាក់ឈ្នួល ការទូទាត់ និងប្រាក់បន្ទាប់បន្សំ / 3. Wages, payment & allowances / 三、工资、支付及津贴
                    </div>
                    <p className={styles.contractTextKm} style={{ whiteSpace: 'pre-line' }}>
                      {formData.clause3BodyKh || defaultClauses.c3.kh}
                    </p>
                    <p className={styles.contractTextEn} style={{ whiteSpace: 'pre-line' }}>
                      {formData.clause3BodyEn || defaultClauses.c3.en}
                    </p>
                    <p className={styles.contractTextZh} style={{ whiteSpace: 'pre-line' }}>
                      {formData.clause3BodyZh || defaultClauses.c3.zh}
                    </p>
                  </div>

                  {/* Clause 4: Working Hours & Rest */}
                  <div className={styles.contractSection}>
                    <div className={styles.contractSectionHeader}>
                      ៤. ម៉ោងធ្វើការ ម៉ោងសម្រាក និងថ្ងៃឈប់សម្រាក / 4. Working hours, meal break & rest / 四、工作时间、休息及休假
                    </div>
                    <p className={styles.contractTextKm} style={{ whiteSpace: 'pre-line' }}>
                      {formData.clause4BodyKh || defaultClauses.c4.kh}
                    </p>
                    <p className={styles.contractTextEn} style={{ whiteSpace: 'pre-line' }}>
                      {formData.clause4BodyEn || defaultClauses.c4.en}
                    </p>
                    <p className={styles.contractTextZh} style={{ whiteSpace: 'pre-line' }}>
                      {formData.clause4BodyZh || defaultClauses.c4.zh}
                    </p>
                  </div>

                  {/* Clause 5: Leave & Social Security */}
                  <div className={styles.contractSection}>
                    <div className={styles.contractSectionHeader}>
                      ៥. ការឈប់សម្រាកប្រចាំឆ្នាំ ថ្ងៃបុណ្យ និងរបបសន្តិសុខសង្គម / 5. Annual leave, holidays & social security (NSSF) / 五、年假、法定节假日及国家社保（NSSF）
                    </div>
                    <p className={styles.contractTextKm} style={{ whiteSpace: 'pre-line' }}>
                      {formData.clause5BodyKh || defaultClauses.c5.kh}
                    </p>
                    <p className={styles.contractTextEn} style={{ whiteSpace: 'pre-line' }}>
                      {formData.clause5BodyEn || defaultClauses.c5.en}
                    </p>
                    <p className={styles.contractTextZh} style={{ whiteSpace: 'pre-line' }}>
                      {formData.clause5BodyZh || defaultClauses.c5.zh}
                    </p>
                  </div>

                  {/* Clause 6: Safety, Health, Discipline & Suspension */}
                  <div className={styles.contractSection}>
                    <div className={styles.contractSectionHeader}>
                      ៦. សុវត្ថិភាព សុខភាពការងារ បទបញ្ជាផ្ទៃក្នុង និងការព្យួរ / 6. Occupational health, safety, discipline & suspension / 六、安全卫生、内部规程及合同中止
                    </div>
                    <p className={styles.contractTextKm} style={{ whiteSpace: 'pre-line' }}>
                      {formData.clause6BodyKh || defaultClauses.c6.kh}
                    </p>
                    <p className={styles.contractTextEn} style={{ whiteSpace: 'pre-line' }}>
                      {formData.clause6BodyEn || defaultClauses.c6.en}
                    </p>
                    <p className={styles.contractTextZh} style={{ whiteSpace: 'pre-line' }}>
                      {formData.clause6BodyZh || defaultClauses.c6.zh}
                    </p>
                  </div>

                  {/* Clause 7: Confidentiality & Non-discrimination */}
                  <div className={styles.contractSection}>
                    <div className={styles.contractSectionHeader}>
                      ៧. ការរក្សាការសម្ងាត់ និងការមិនរើសអើង / 7. Confidentiality, loyalty & non-discrimination / 七、保密义务、诚信与反歧视
                    </div>
                    <p className={styles.contractTextKm} style={{ whiteSpace: 'pre-line' }}>
                      {formData.clause7BodyKh || defaultClauses.c7.kh}
                    </p>
                    <p className={styles.contractTextEn} style={{ whiteSpace: 'pre-line' }}>
                      {formData.clause7BodyEn || defaultClauses.c7.en}
                    </p>
                    <p className={styles.contractTextZh} style={{ whiteSpace: 'pre-line' }}>
                      {formData.clause7BodyZh || defaultClauses.c7.zh}
                    </p>
                  </div>

                  {/* Clause 8: Termination Benefits & Dispute Resolution */}
                  <div className={styles.contractSection}>
                    <div className={styles.contractSectionHeader}>
                      ៨. ការបញ្ចប់កិច្ចសន្យា អត្ថប្រយោជន៍ និងការដោះស្រាយវិវាទ / 8. Termination benefits, notice & dispute resolution / 八、终止补偿、提前通知及争议解决
                    </div>
                    <p className={styles.contractTextKm} style={{ whiteSpace: 'pre-line' }}>
                      {formData.clause8BodyKh || defaultClauses.c8.kh}
                    </p>
                    <p className={styles.contractTextEn} style={{ whiteSpace: 'pre-line' }}>
                      {formData.clause8BodyEn || defaultClauses.c8.en}
                    </p>
                    <p className={styles.contractTextZh} style={{ whiteSpace: 'pre-line' }}>
                      {formData.clause8BodyZh || defaultClauses.c8.zh}
                    </p>
                  </div>

                  {/* Clause 9: Acknowledgment & Execution */}
                  <div className={styles.contractSection}>
                    <div className={styles.contractSectionHeader}>
                      ៩. ការទទួលស្គាល់ និងការចុះហត្ថលេខា / 9. Acknowledgment & signatures / 九、确认及签署
                    </div>
                    <p className={styles.contractTextKm}>
                      {formData.clause9BodyKh || 'កិច្ចសន្យានេះត្រូវបានធ្វើឡើងជាភាសាខ្មែរ អង់គ្លេស និងចិន។ ភាគីទាំងពីរបានអាន ឬទទួលការពន្យល់យ៉ាងច្បាស់លាស់ និងចុះហត្ថលេខា/ផ្តិតស្នាមមេដៃដោយស្ម័គ្រចិត្ត។ ធ្វើឡើងចំនួន ២ ច្បាប់ដើម មានតម្លៃគតិយុត្តស្មើគ្នា ភាគីនីមួយៗរក្សាទុក ១ ច្បាប់។'}
                    </p>
                    <p className={styles.contractTextEn}>
                      {formData.clause9BodyEn || 'This agreement is formulated in Khmer, English, and Chinese. Both parties have read or received clear explanation and voluntarily signed/thumbprinted. Executed in two identical originals having equal legal validity, one retained by each party.'}
                    </p>
                    <p className={styles.contractTextZh}>
                      {formData.clause9BodyZh || '本合同以柬埔寨文、英文和中文书就。双方当事人已认真通读或听取充分解释，自愿签字/捺指印。本合同一式两份，具有同等法律效力，双方各执一份。'}
                    </p>
                  </div>

                  {/* Signatures Table */}
                  <table className={styles.printSignatures}>
                    <thead>
                      <tr style={{ background: '#f8fafc', borderBottom: '1px solid #94a3b8' }}>
                        <th style={{ width: '50%', padding: '0.65rem', textAlign: 'center', borderRight: '1px solid #94a3b8', color: '#1e3a8a' }}>
                          តំណាងនិយោជក / Employer / 雇主
                        </th>
                        <th style={{ width: '50%', padding: '0.65rem', textAlign: 'center', color: '#1e3a8a' }}>
                          កម្មករនិយោជិត / Employee / 员工
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td
                          style={{
                            padding: '0.85rem',
                            borderRight: '1px solid #94a3b8',
                            verticalAlign: 'top',
                            height: '135px',
                          }}
                        >
                          <div style={{ textAlign: 'center', color: '#64748b', fontSize: '0.78rem', marginBottom: '3.2rem' }}>
                            ហត្ថលេខា និងត្រាក្រុមហ៊ុន / Signature & Company Stamp
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
                        <td style={{ padding: '0.85rem', verticalAlign: 'top', height: '135px' }}>
                          <div style={{ textAlign: 'center', color: '#64748b', fontSize: '0.78rem', marginBottom: '3.2rem' }}>
                            ហត្ថលេខា ឬស្នាមមេដៃស្តាំ / Signature or Thumbprint
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

                  {/* Disclaimer / Ministry Reference Note */}
                  <div
                    style={{
                      textAlign: 'center',
                      fontSize: '0.73rem',
                      color: '#64748b',
                      fontStyle: 'italic',
                      marginTop: '0.75rem',
                      borderTop: '1px dashed #cbd5e1',
                      paddingTop: '0.45rem',
                    }}
                  >
                    សម្គាល់: ទម្រង់កិច្ចសន្យានេះត្រូវបានរៀបចំឡើងយ៉ាងហ្មត់ចត់ស្របតាមច្បាប់ស្តីពីការងារនៃព្រះរាជាណាចក្រកម្ពុជា និងសេចក្តីណែនាំលេខ ០៥០/១៩ របស់ក្រសួងការងារ និងបណ្តុះបណ្តាលវិជ្ជាជីវៈ។
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* ISO 9001:2015 Contract Modal (FDC, UDC, Foreigner, Probation / 4 Pages) */}
      <IsoProbationContractModal
        isOpen={showIsoProbationModal}
        onClose={() => setShowIsoProbationModal(false)}
        employees={employees}
        companySettings={companySettings}
        initialEmployee={selectedIsoEmployee}
        initialContractType={selectedIsoContractType}
      />
    </div>
  );
}
