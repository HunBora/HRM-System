'use client';

import React, { useState, useMemo } from 'react';
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
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'preview' | 'form' | 'clauses'>('preview');
  const [searchEmpQuery, setSearchEmpQuery] = useState('');
  const [isEmpDropdownOpen, setIsEmpDropdownOpen] = useState(false);
  const [tableFilterType, setTableFilterType] = useState<string>('ALL');
  const [alertFilterCategory, setAlertFilterCategory] = useState<string>('ALL');
  const [tableSearchText, setTableSearchText] = useState('');
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

  // Filter employees for Auto-Search
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

  // Filter Table Contracts by Type, Search, and Smart Alert Category
  const filteredContracts = useMemo(() => {
    return contracts.filter((c) => {
      const matchesType = tableFilterType === 'ALL' || c.contractType === tableFilterType;
      const q = tableSearchText.toLowerCase();
      const matchesSearch =
        !q ||
        c.contractNo.toLowerCase().includes(q) ||
        c.employee.employeeId.toLowerCase().includes(q) ||
        `${c.employee.firstNameEn} ${c.employee.lastNameEn}`.toLowerCase().includes(q) ||
        `${c.employee.lastNameKh} ${c.employee.firstNameKh}`.toLowerCase().includes(q);

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

      return matchesType && matchesSearch && matchesAlertCategory;
    });
  }, [contracts, tableFilterType, tableSearchText, alertFilterCategory, contractAlertsMap]);

  // Derived metadata
  const currentMeta = CONTRACT_TYPE_METADATA[formData.contractType] || CONTRACT_TYPE_METADATA.FDC;
  const currentGender = getGenderLabel(formData.gender);

  return (
    <div className={styles.container}>
      {/* Top Banner Card */}
      <div className={styles.headerCard}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '2rem' }}>📜</span>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 700, margin: 0 }}>
              ប្រព័ន្ធគ្រប់គ្រងកិច្ចសន្យាការងារ & Smart Alert
            </h1>
          </div>
          <p style={{ margin: 0, opacity: 0.9, fontSize: '0.95rem', maxWidth: '850px' }}>
            ដាស់តឿនឆ្លាតវៃកុងត្រា FDC (១០-១៥ ថ្ងៃ តាមមាត្រា ៧៣) និង Work Permit / Visa ជនបរទេស (៣០-៦០ ថ្ងៃ)
            ជាមួយទម្រង់ស្តង់ដារ ៣ ភាសា (ខ្មែរ ចិន អង់គ្លេស)។
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <button
            onClick={handleSendTelegramAlerts}
            disabled={isSendingTelegram}
            style={{
              background: '#0284c7',
              color: '#ffffff',
              fontWeight: 700,
              padding: '0.85rem 1.4rem',
              borderRadius: '12px',
              border: '1px solid rgba(255,255,255,0.3)',
              cursor: 'pointer',
              fontSize: '0.95rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
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
              padding: '0.85rem 1.6rem',
              borderRadius: '12px',
              border: 'none',
              cursor: 'pointer',
              fontSize: '1rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
              transition: 'all 0.2s ease',
            }}
          >
            <span style={{ fontSize: '1.3rem' }}>➕</span>
            បង្កើតកិច្ចសន្យាថ្មី (New Contract)
          </button>
        </div>
      </div>

      {/* --- SMART ALERT NOTIFICATION CENTER BAR --- */}
      <div
        style={{
          background: 'linear-gradient(to right, #f8fafc, #ffffff)',
          border: '1px solid #cbd5e1',
          borderRadius: '16px',
          padding: '1.25rem 1.5rem',
          boxShadow: '0 4px 15px rgba(0, 0, 0, 0.05)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <span style={{ fontSize: '1.4rem' }}>🚨</span>
            <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: '#1e293b' }}>
              មជ្ឈមណ្ឌលដាស់តឿនឆ្លាតវៃ (MLVT 2026 Smart Expiry Alerts)
            </h3>
          </div>
          <span style={{ fontSize: '0.85rem', color: '#64748b' }}>
            ចុចលើ Card នីមួយៗដើម្បី Filter មើលបុគ្គលិកជាក់លាក់
          </span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
          {/* Card 1: FDC Notice */}
          <div
            onClick={() => setAlertFilterCategory(alertFilterCategory === 'FDC_NOTICE' ? 'ALL' : 'FDC_NOTICE')}
            style={{
              background: alertFilterCategory === 'FDC_NOTICE' ? '#fef2f2' : '#ffffff',
              border: `2px solid ${alertFilterCategory === 'FDC_NOTICE' ? '#ef4444' : '#fee2e2'}`,
              borderRadius: '12px',
              padding: '1rem',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '1.3rem' }}>🔔</span>
              <span
                style={{
                  background: '#ef4444',
                  color: '#ffffff',
                  fontSize: '0.85rem',
                  fontWeight: 700,
                  padding: '0.2rem 0.6rem',
                  borderRadius: '20px',
                }}
              >
                {alertStats.fdcNoticeCount}
              </span>
            </div>
            <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#991b1b', marginTop: '0.5rem' }}>
              FDC ត្រូវជូនដំណឹងមុន
            </div>
            <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
              ១០ ថ្ងៃ ឬ ១៥ ថ្ងៃ (មាត្រា ៧៣)
            </div>
          </div>

          {/* Card 2: Foreign WP */}
          <div
            onClick={() => setAlertFilterCategory(alertFilterCategory === 'FOREIGN_WP_VISA' ? 'ALL' : 'FOREIGN_WP_VISA')}
            style={{
              background: alertFilterCategory === 'FOREIGN_WP_VISA' ? '#f5f3ff' : '#ffffff',
              border: `2px solid ${alertFilterCategory === 'FOREIGN_WP_VISA' ? '#7c3aed' : '#ede9fe'}`,
              borderRadius: '12px',
              padding: '1rem',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '1.3rem' }}>🌐</span>
              <span
                style={{
                  background: '#7c3aed',
                  color: '#ffffff',
                  fontSize: '0.85rem',
                  fontWeight: 700,
                  padding: '0.2rem 0.6rem',
                  borderRadius: '20px',
                }}
              >
                {alertStats.foreignWpCount + alertStats.foreignVisaCount}
              </span>
            </div>
            <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#5b21b6', marginTop: '0.5rem' }}>
              Work Permit & Visa ជនបរទេស
            </div>
            <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
              ៣០ ដល់ ៦០ ថ្ងៃ (រៀបចំ MLVT)
            </div>
          </div>

          {/* Card 3: Probation Ending */}
          <div
            onClick={() => setAlertFilterCategory(alertFilterCategory === 'PROBATION' ? 'ALL' : 'PROBATION')}
            style={{
              background: alertFilterCategory === 'PROBATION' ? '#fffbeb' : '#ffffff',
              border: `2px solid ${alertFilterCategory === 'PROBATION' ? '#d97706' : '#fef3c7'}`,
              borderRadius: '12px',
              padding: '1rem',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '1.3rem' }}>⏳</span>
              <span
                style={{
                  background: '#d97706',
                  color: '#ffffff',
                  fontSize: '0.85rem',
                  fontWeight: 700,
                  padding: '0.2rem 0.6rem',
                  borderRadius: '20px',
                }}
              >
                {alertStats.probationCount}
              </span>
            </div>
            <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#92400e', marginTop: '0.5rem' }}>
              សាកល្បងជិតចប់
            </div>
            <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
              នៅសល់ $\le$ ៧ ថ្ងៃ (ត្រៀមវាយតម្លៃ)
            </div>
          </div>

          {/* Card 4: Expired */}
          <div
            onClick={() => setAlertFilterCategory(alertFilterCategory === 'EXPIRED' ? 'ALL' : 'EXPIRED')}
            style={{
              background: alertFilterCategory === 'EXPIRED' ? '#f8fafc' : '#ffffff',
              border: `2px solid ${alertFilterCategory === 'EXPIRED' ? '#475569' : '#e2e8f0'}`,
              borderRadius: '12px',
              padding: '1rem',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '1.3rem' }}>⚠️</span>
              <span
                style={{
                  background: '#475569',
                  color: '#ffffff',
                  fontSize: '0.85rem',
                  fontWeight: 700,
                  padding: '0.2rem 0.6rem',
                  borderRadius: '20px',
                }}
              >
                {alertStats.expiredCount}
              </span>
            </div>
            <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#334155', marginTop: '0.5rem' }}>
              កិច្ចសន្យាផុតកំណត់ហើយ
            </div>
            <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
              ត្រូវសម្រេចបន្ត ឬទូទាត់ផ្តាច់
            </div>
          </div>
        </div>

        {alertFilterCategory !== 'ALL' && (
          <div style={{ marginTop: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#0369a1' }}>
              🔍 កំពុង Filter តាម៖ <strong>{alertFilterCategory}</strong>
            </span>
            <button
              onClick={() => setAlertFilterCategory('ALL')}
              style={{
                background: '#e0f2fe',
                color: '#0369a1',
                border: 'none',
                padding: '0.2rem 0.6rem',
                borderRadius: '6px',
                fontSize: '0.75rem',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              សម្អាត Filter (Reset) ✕
            </button>
          </div>
        )}
      </div>

      {/* Contract Management Table */}
      <div
        style={{
          background: 'var(--card-bg, #ffffff)',
          borderRadius: '16px',
          border: '1px solid var(--border-color, #e2e8f0)',
          padding: '1.5rem',
          boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '1rem',
            marginBottom: '1.25rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0 }}>
              បញ្ជីកិច្ចសន្យាការងារក្នុងប្រព័ន្ធ (Issued Contracts)
            </h2>
            <span
              style={{
                background: '#e0f2fe',
                color: '#0369a1',
                padding: '0.2rem 0.6rem',
                borderRadius: '20px',
                fontSize: '0.85rem',
                fontWeight: 600,
              }}
            >
              {filteredContracts.length} កុងត្រា
            </span>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            <input
              type="text"
              placeholder="ស្វែងរកតាមលេខកុងត្រា ឬឈ្មោះ..."
              value={tableSearchText}
              onChange={(e) => setTableSearchText(e.target.value)}
              style={{
                padding: '0.55rem 1rem',
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
                fontSize: '0.9rem',
                width: '260px',
              }}
            />
            <select
              value={tableFilterType}
              onChange={(e) => setTableFilterType(e.target.value)}
              style={{
                padding: '0.55rem 1rem',
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
                fontSize: '0.9rem',
                background: '#ffffff',
              }}
            >
              <option value="ALL">គ្រប់ប្រភេទកិច្ចសន្យា (All Types)</option>
              <option value="FDC">កិច្ចសន្យាមានកំណត់ (FDC)</option>
              <option value="UDC">កិច្ចសន្យាមិនកំណត់ (UDC)</option>
              <option value="PROBATION">សាកល្បងការងារ (Probation)</option>
              <option value="FOREIGN_FDC">បុគ្គលិកជនបរទេស (Foreign)</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0', color: '#475569' }}>
                <th style={{ padding: '0.85rem 1rem' }}>លេខកុងត្រា</th>
                <th style={{ padding: '0.85rem 1rem' }}>បុគ្គលិក (Employee)</th>
                <th style={{ padding: '0.85rem 1rem' }}>ប្រភេទកុងត្រា</th>
                <th style={{ padding: '0.85rem 1rem' }}>មុខតំណែង / ផ្នែក</th>
                <th style={{ padding: '0.85rem 1rem' }}>ថ្ងៃចាប់ផ្តើម - បញ្ចប់</th>
                <th style={{ padding: '0.85rem 1rem' }}>ស្ថានភាពដាស់តឿន (Smart Alert)</th>
                <th style={{ padding: '0.85rem 1rem' }}>ប្រាក់ឈ្នួលគោល</th>
                <th style={{ padding: '0.85rem 1rem', textAlign: 'center' }}>សកម្មភាព</th>
              </tr>
            </thead>
            <tbody>
              {filteredContracts.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8' }}>
                    មិនមានកិច្ចសន្យាត្រូវតាមការស្វែងរក ឬ Filter ឡើយ។
                  </td>
                </tr>
              ) : (
                filteredContracts.map((c) => {
                  const meta = CONTRACT_TYPE_METADATA[c.contractType] || CONTRACT_TYPE_METADATA.FDC;
                  const alerts = contractAlertsMap.get(c.id) || [];
                  const primaryAlert = alerts[0];

                  return (
                    <tr
                      key={c.id}
                      style={{ borderBottom: '1px solid #f1f5f9', transition: 'background 0.15s' }}
                    >
                      <td style={{ padding: '0.85rem 1rem', fontWeight: 600, color: '#1e3a8a' }}>
                        {c.contractNo}
                      </td>
                      <td style={{ padding: '0.85rem 1rem' }}>
                        <div style={{ fontWeight: 600, color: '#0f172a' }}>
                          {c.employee.lastNameKh} {c.employee.firstNameKh} ({c.employee.firstNameEn}{' '}
                          {c.employee.lastNameEn})
                        </div>
                        <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
                          អត្តលេខ: {c.employee.employeeId} {c.isForeigner && '🌐 (ជនបរទេស)'}
                        </div>
                      </td>
                      <td style={{ padding: '0.85rem 1rem' }}>
                        <span
                          style={{
                            background: meta.badgeBg,
                            color: meta.badgeColor,
                            padding: '0.25rem 0.65rem',
                            borderRadius: '12px',
                            fontWeight: 600,
                            fontSize: '0.8rem',
                            display: 'inline-block',
                          }}
                        >
                          {c.contractType}
                        </span>
                      </td>
                      <td style={{ padding: '0.85rem 1rem' }}>
                        <div>{c.positionTitle}</div>
                        <div style={{ fontSize: '0.8rem', color: '#64748b' }}>{c.department}</div>
                      </td>
                      <td style={{ padding: '0.85rem 1rem' }}>
                        <div>{formatContractDate(c.startDate)}</div>
                        <div style={{ fontSize: '0.8rem', color: c.contractType === 'UDC' ? '#059669' : '#64748b' }}>
                          ➔ {c.contractType === 'UDC' ? 'គ្មានកំណត់ (UDC)' : formatContractDate(c.endDate)}
                        </div>
                      </td>

                      {/* Smart Alert Pill Column */}
                      <td style={{ padding: '0.85rem 1rem' }}>
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
                              padding: '0.35rem 0.65rem',
                              borderRadius: '8px',
                              fontSize: '0.78rem',
                              fontWeight: 700,
                              display: 'inline-block',
                              maxWidth: '220px',
                            }}
                            title={primaryAlert.messageKh}
                          >
                            <div>{primaryAlert.titleKh}</div>
                            <div style={{ fontSize: '0.72rem', fontWeight: 500 }}>
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
                              padding: '0.25rem 0.6rem',
                              borderRadius: '8px',
                              fontSize: '0.78rem',
                              fontWeight: 600,
                            }}
                          >
                            ✓ មានសុពលភាព (Active)
                          </span>
                        )}
                      </td>

                      <td style={{ padding: '0.85rem 1rem', fontWeight: 600, color: '#0f172a' }}>
                        ${c.basicSalaryUsd.toLocaleString()} USD
                      </td>
                      <td style={{ padding: '0.85rem 1rem', textAlign: 'center' }}>
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
                            padding: '0.4rem 0.8rem',
                            fontWeight: 600,
                            cursor: 'pointer',
                            fontSize: '0.85rem',
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
      </div>

      {/* Modal Contract Editor / Previewer */}
      {isModalOpen && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            {/* Modal Header */}
            <div
              style={{
                padding: '1rem 1.5rem',
                borderBottom: '1px solid #e2e8f0',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                background: '#f8fafc',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <span style={{ fontSize: '1.6rem' }}>📜</span>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 700, color: '#0f172a' }}>
                    {currentMeta.nameKh}
                  </h3>
                  <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
                    {currentMeta.nameEn} • {currentMeta.nameZh}
                  </div>
                </div>
              </div>

              {/* Navigation Tabs */}
              <div style={{ display: 'flex', gap: '0.5rem', background: '#e2e8f0', padding: '4px', borderRadius: '8px' }}>
                <button
                  onClick={() => setActiveTab('preview')}
                  style={{
                    padding: '0.45rem 1rem',
                    borderRadius: '6px',
                    border: 'none',
                    fontWeight: 600,
                    cursor: 'pointer',
                    fontSize: '0.9rem',
                    background: activeTab === 'preview' ? '#ffffff' : 'transparent',
                    color: activeTab === 'preview' ? '#1e3a8a' : '#64748b',
                    boxShadow: activeTab === 'preview' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                  }}
                >
                  👁️ មើលជាមុន (Preview A4)
                </button>
                <button
                  onClick={() => setActiveTab('form')}
                  style={{
                    padding: '0.45rem 1rem',
                    borderRadius: '6px',
                    border: 'none',
                    fontWeight: 600,
                    cursor: 'pointer',
                    fontSize: '0.9rem',
                    background: activeTab === 'form' ? '#ffffff' : 'transparent',
                    color: activeTab === 'form' ? '#1e3a8a' : '#64748b',
                    boxShadow: activeTab === 'form' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                  }}
                >
                  ⚙️ កំណត់ព័ត៌មាន (Fill & Edit)
                </button>
                <button
                  onClick={() => setActiveTab('clauses')}
                  style={{
                    padding: '0.45rem 1rem',
                    borderRadius: '6px',
                    border: 'none',
                    fontWeight: 600,
                    cursor: 'pointer',
                    fontSize: '0.9rem',
                    background: activeTab === 'clauses' ? '#ffffff' : 'transparent',
                    color: activeTab === 'clauses' ? '#1e3a8a' : '#64748b',
                    boxShadow: activeTab === 'clauses' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                  }}
                >
                  ✏️ កែរអត្ថន័យខសន្យា (Custom Clauses)
                </button>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button
                  onClick={handlePrint}
                  style={{
                    background: '#1e293b',
                    color: '#ffffff',
                    border: 'none',
                    padding: '0.5rem 1rem',
                    borderRadius: '8px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                    fontSize: '0.85rem',
                  }}
                >
                  🖨️ បោះពុម្ព (Print / PDF)
                </button>
                <button
                  onClick={handleExportWord}
                  style={{
                    background: '#2563eb',
                    color: '#ffffff',
                    border: 'none',
                    padding: '0.5rem 1rem',
                    borderRadius: '8px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                    fontSize: '0.85rem',
                  }}
                >
                  📄 ទាញយក Word (.docx)
                </button>
                <button
                  onClick={handleSaveContract}
                  disabled={isSubmitting}
                  style={{
                    background: '#059669',
                    color: '#ffffff',
                    border: 'none',
                    padding: '0.5rem 1rem',
                    borderRadius: '8px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                    fontSize: '0.85rem',
                  }}
                >
                  💾 រក្សាទុក (Save)
                </button>
                <button
                  onClick={() => setIsModalOpen(false)}
                  style={{
                    background: '#f1f5f9',
                    color: '#64748b',
                    border: '1px solid #cbd5e1',
                    padding: '0.5rem 0.8rem',
                    borderRadius: '8px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    fontSize: '0.9rem',
                  }}
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem', background: '#f1f5f9' }}>
              {/* TAB 1: FORM INPUTS (Auto-search & Fields) */}
              {activeTab === 'form' && (
                <div
                  style={{
                    background: '#ffffff',
                    borderRadius: '14px',
                    padding: '2rem',
                    maxWidth: '1100px',
                    margin: '0 auto',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                  }}
                >
                  <h3 style={{ borderBottom: '2px solid #e2e8f0', paddingBottom: '0.75rem', marginBottom: '1.5rem', color: '#1e3a8a' }}>
                    🔍 ១. ស្វែងរកបុគ្គលិកដោយស្វ័យប្រវត្តិ (Auto-fill Employee)
                  </h3>

                  <div style={{ position: 'relative', marginBottom: '1.5rem' }}>
                    <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.5rem' }}>
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
                        padding: '0.75rem 1rem',
                        borderRadius: '8px',
                        border: '2px solid #3b82f6',
                        fontSize: '1rem',
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
                              padding: '0.75rem 1rem',
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
                              <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
                                ផ្នែក៖ {emp.department} • មុខតំណែង៖ {emp.position} • អត្តសញ្ញាណប័ណ្ណ៖{' '}
                                {emp.nationalId || 'N/A'}
                              </div>
                            </div>
                            <span
                              style={{
                                background: '#dbeafe',
                                color: '#1d4ed8',
                                padding: '0.2rem 0.6rem',
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

                  <h3 style={{ borderBottom: '2px solid #e2e8f0', paddingBottom: '0.75rem', margin: '2rem 0 1.5rem 0', color: '#1e3a8a' }}>
                    📋 ២. ប្រភេទកិច្ចសន្យា និងកាលបរិច្ឆេទ (Contract Type & Dates)
                  </h3>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>
                    <div>
                      <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.4rem' }}>
                        ជ្រើសរើសប្រភេទកិច្ចសន្យា (Contract Type):
                      </label>
                      <select
                        value={formData.contractType}
                        onChange={(e) => handleContractTypeChange(e.target.value as ContractType)}
                        style={{
                          width: '100%',
                          padding: '0.65rem 0.85rem',
                          borderRadius: '8px',
                          border: '2px solid #2563eb',
                          fontSize: '0.95rem',
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
                      <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.4rem' }}>
                        លេខឯកសារ (Document No):
                      </label>
                      <input
                        type="text"
                        value={formData.contractNo}
                        onChange={(e) => setFormData({ ...formData, contractNo: e.target.value })}
                        style={{ width: '100%', padding: '0.65rem', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.4rem' }}>
                        កាលបរិច្ឆេទចុះកុងត្រា (Signed Date):
                      </label>
                      <input
                        type="date"
                        value={formData.signedDate}
                        onChange={(e) => setFormData({ ...formData, signedDate: e.target.value })}
                        style={{ width: '100%', padding: '0.65rem', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.4rem' }}>
                        ថ្ងៃចាប់ផ្តើមការងារ (Start Date):
                      </label>
                      <input
                        type="date"
                        value={formData.startDate}
                        onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                        style={{ width: '100%', padding: '0.65rem', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                      />
                    </div>

                    {formData.contractType !== 'UDC' && (
                      <div>
                        <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.4rem' }}>
                          ថ្ងៃបញ្ចប់កុងត្រា (End Date):
                        </label>
                        <input
                          type="date"
                          value={formData.endDate}
                          onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                          style={{ width: '100%', padding: '0.65rem', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                        />
                      </div>
                    )}

                    {formData.contractType === 'PROBATION' && (
                      <div>
                        <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.4rem' }}>
                          កម្រិតសាកល្បង (Probation Category - មាត្រា ៦៨):
                        </label>
                        <select
                          value={formData.probationCategory}
                          onChange={(e) => handleProbationCategoryChange(e.target.value as any)}
                          style={{ width: '100%', padding: '0.65rem', borderRadius: '8px', border: '1px solid #cbd5e1' }}
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
                        borderRadius: '12px',
                        padding: '1.25rem',
                        marginTop: '1.5rem',
                      }}
                    >
                      <h4 style={{ margin: '0 0 1rem 0', color: '#6d28d9', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        🌐 ព័ត៌មានបន្ថែមសម្រាប់បុគ្គលិកជនបរទេស (Foreign Expatriate Info)
                      </h4>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
                        <div>
                          <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.3rem' }}>
                            លេខលិខិតឆ្លងដែន (Passport No):
                          </label>
                          <input
                            type="text"
                            value={formData.passportNo || ''}
                            onChange={(e) => setFormData({ ...formData, passportNo: e.target.value })}
                            placeholder="ឧ. E12345678"
                            style={{ width: '100%', padding: '0.55rem', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                          />
                        </div>
                        <div>
                          <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.3rem' }}>
                            ថ្ងៃផុតកំណត់លិខិតឆ្លងដែន (Passport Expiry):
                          </label>
                          <input
                            type="date"
                            value={formData.passportExpiry || ''}
                            onChange={(e) => setFormData({ ...formData, passportExpiry: e.target.value })}
                            style={{ width: '100%', padding: '0.55rem', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                          />
                        </div>
                        <div>
                          <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.3rem' }}>
                            លេខប័ណ្ណការងារ MLVT (Work Permit No):
                          </label>
                          <input
                            type="text"
                            value={formData.workPermitNo || ''}
                            onChange={(e) => setFormData({ ...formData, workPermitNo: e.target.value })}
                            placeholder="ឧ. WP-2026-9999"
                            style={{ width: '100%', padding: '0.55rem', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                          />
                        </div>
                        <div>
                          <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.3rem' }}>
                            ថ្ងៃផុតកំណត់ប័ណ្ណការងារ (Work Permit Expiry):
                          </label>
                          <input
                            type="date"
                            value={formData.workPermitExpiry || ''}
                            onChange={(e) => setFormData({ ...formData, workPermitExpiry: e.target.value })}
                            style={{ width: '100%', padding: '0.55rem', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                          />
                        </div>
                        <div>
                          <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.3rem' }}>
                            លេខទិដ្ឋាការ (Visa No - EB Visa):
                          </label>
                          <input
                            type="text"
                            value={formData.visaNo || ''}
                            onChange={(e) => setFormData({ ...formData, visaNo: e.target.value })}
                            placeholder="ឧ. EB-098765"
                            style={{ width: '100%', padding: '0.55rem', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                          />
                        </div>
                        <div>
                          <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.3rem' }}>
                            ថ្ងៃផុតកំណត់ទិដ្ឋាការ (Visa Expiry):
                          </label>
                          <input
                            type="date"
                            value={formData.visaExpiry || ''}
                            onChange={(e) => setFormData({ ...formData, visaExpiry: e.target.value })}
                            style={{ width: '100%', padding: '0.55rem', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  <h3 style={{ borderBottom: '2px solid #e2e8f0', paddingBottom: '0.75rem', margin: '2rem 0 1.5rem 0', color: '#1e3a8a' }}>
                    🏢 ៣. ព័ត៌មានក្រុមហ៊ុន និងនិយោជក (Company & Representative)
                  </h3>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>
                    <div>
                      <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.4rem' }}>
                        ឈ្មោះក្រុមហ៊ុន/រោងចក្រ (Company Name):
                      </label>
                      <input
                        type="text"
                        value={formData.companyName}
                        onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                        style={{ width: '100%', padding: '0.65rem', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.4rem' }}>
                        អាសយដ្ឋានក្រុមហ៊ុន (Address):
                      </label>
                      <input
                        type="text"
                        value={formData.companyAddress}
                        onChange={(e) => setFormData({ ...formData, companyAddress: e.target.value })}
                        style={{ width: '100%', padding: '0.65rem', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.4rem' }}>
                        តំណាងដោយ (Representative):
                      </label>
                      <input
                        type="text"
                        value={formData.representative}
                        onChange={(e) => setFormData({ ...formData, representative: e.target.value })}
                        style={{ width: '100%', padding: '0.65rem', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.4rem' }}>
                        តួនាទីអ្នកតំណាង (Role / Position):
                      </label>
                      <input
                        type="text"
                        value={formData.representativeRole}
                        onChange={(e) => setFormData({ ...formData, representativeRole: e.target.value })}
                        style={{ width: '100%', padding: '0.65rem', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                      />
                    </div>
                  </div>

                  <h3 style={{ borderBottom: '2px solid #e2e8f0', paddingBottom: '0.75rem', margin: '2rem 0 1.5rem 0', color: '#1e3a8a' }}>
                    💵 ៤. ប្រាក់ឈ្នួល និងម៉ោងធ្វើការ (Wages & Working Hours)
                  </h3>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>
                    <div>
                      <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.4rem' }}>
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
                        style={{ width: '100%', padding: '0.65rem', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.4rem' }}>
                        ប្រាក់ឈ្នួលគិតជារៀល (KHR):
                      </label>
                      <input
                        type="number"
                        value={formData.basicSalaryKhr}
                        onChange={(e) => setFormData({ ...formData, basicSalaryKhr: Number(e.target.value) || 0 })}
                        style={{ width: '100%', padding: '0.65rem', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.4rem' }}>
                        ថ្ងៃបើកប្រាក់ឈ្នួល (Payment Day):
                      </label>
                      <input
                        type="text"
                        value={formData.paymentDay}
                        onChange={(e) => setFormData({ ...formData, paymentDay: e.target.value })}
                        style={{ width: '100%', padding: '0.65rem', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.4rem' }}>
                        ម៉ោងធ្វើការ (Work Hours):
                      </label>
                      <input
                        type="text"
                        value={formData.workingHours}
                        onChange={(e) => setFormData({ ...formData, workingHours: e.target.value })}
                        style={{ width: '100%', padding: '0.65rem', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                      />
                    </div>
                  </div>

                  <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                    <button
                      onClick={() => setActiveTab('preview')}
                      style={{
                        background: '#2563eb',
                        color: '#ffffff',
                        border: 'none',
                        padding: '0.75rem 1.75rem',
                        borderRadius: '8px',
                        fontWeight: 700,
                        cursor: 'pointer',
                        fontSize: '1rem',
                      }}
                    >
                      មើលលទ្ធផលកិច្ចសន្យា (Go to Preview) ➔
                    </button>
                  </div>
                </div>
              )}

              {/* TAB 2: EDIT CLAUSES (កែរអត្ថន័យបាន) */}
              {activeTab === 'clauses' && (
                <div
                  style={{
                    background: '#ffffff',
                    borderRadius: '14px',
                    padding: '2rem',
                    maxWidth: '1100px',
                    margin: '0 auto',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                  }}
                >
                  <div style={{ marginBottom: '1.5rem', background: '#eff6ff', padding: '1rem', borderRadius: '10px', borderLeft: '4px solid #2563eb' }}>
                    <h4 style={{ margin: '0 0 0.25rem 0', color: '#1e3a8a' }}>✏️ កែប្រែខ្លឹមសារខសន្យា (Customizable Clauses)</h4>
                    <p style={{ margin: 0, fontSize: '0.85rem', color: '#475569' }}>
                      លោកអ្នកអាចកែប្រែបន្ថែមបន្ថយអត្ថន័យនៃខសន្យានីមួយៗបានតាមតម្រូវការជាក់ស្តែងរបស់ក្រុមហ៊ុន។
                    </p>
                  </div>

                  {/* Section 1 Custom */}
                  <div style={{ marginBottom: '1.5rem' }}>
                    <label style={{ fontWeight: 700, color: '#1e3a8a', display: 'block', marginBottom: '0.4rem' }}>
                      ខសន្យាទី ១៖ ភាគីនៃកិច្ចសន្យា (ភាសាខ្មែរ):
                    </label>
                    <textarea
                      rows={3}
                      value={formData.clause1BodyKh || ''}
                      onChange={(e) => setFormData({ ...formData, clause1BodyKh: e.target.value })}
                      placeholder="ទុកទទេដើម្បីប្រើខ្លឹមសារស្តង់ដារ..."
                      style={{ width: '100%', padding: '0.65rem', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                    />
                  </div>

                  {/* Section 2 Custom */}
                  <div style={{ marginBottom: '1.5rem' }}>
                    <label style={{ fontWeight: 700, color: '#1e3a8a', display: 'block', marginBottom: '0.4rem' }}>
                      ខសន្យាទី ២៖ មុខតំណែង និងទីកន្លែងធ្វើការ (ភាសាខ្មែរ):
                    </label>
                    <textarea
                      rows={3}
                      value={formData.clause2BodyKh || ''}
                      onChange={(e) => setFormData({ ...formData, clause2BodyKh: e.target.value })}
                      placeholder="ទុកទទេដើម្បីប្រើខ្លឹមសារស្តង់ដារ..."
                      style={{ width: '100%', padding: '0.65rem', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                    />
                  </div>

                  {/* Section 3 Custom */}
                  <div style={{ marginBottom: '1.5rem' }}>
                    <label style={{ fontWeight: 700, color: '#1e3a8a', display: 'block', marginBottom: '0.4rem' }}>
                      ខសន្យាទី ៣៖ ប្រាក់ឈ្នួល និងការទូទាត់ (ភាសាខ្មែរ):
                    </label>
                    <textarea
                      rows={3}
                      value={formData.clause3BodyKh || ''}
                      onChange={(e) => setFormData({ ...formData, clause3BodyKh: e.target.value })}
                      placeholder="ទុកទទេដើម្បីប្រើខ្លឹមសារស្តង់ដារ..."
                      style={{ width: '100%', padding: '0.65rem', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                    />
                  </div>

                  {/* Section 4 Custom */}
                  <div style={{ marginBottom: '1.5rem' }}>
                    <label style={{ fontWeight: 700, color: '#1e3a8a', display: 'block', marginBottom: '0.4rem' }}>
                      ខសន្យាទី ៤៖ ម៉ោងធ្វើការ និងការសម្រាក (ភាសាខ្មែរ):
                    </label>
                    <textarea
                      rows={3}
                      value={formData.clause4BodyKh || ''}
                      onChange={(e) => setFormData({ ...formData, clause4BodyKh: e.target.value })}
                      placeholder="ទុកទទេដើម្បីប្រើខ្លឹមសារស្តង់ដារ..."
                      style={{ width: '100%', padding: '0.65rem', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                    />
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1.5rem' }}>
                    <button
                      onClick={() => setActiveTab('preview')}
                      style={{
                        background: '#2563eb',
                        color: '#ffffff',
                        border: 'none',
                        padding: '0.75rem 1.75rem',
                        borderRadius: '8px',
                        fontWeight: 700,
                        cursor: 'pointer',
                        fontSize: '1rem',
                      }}
                    >
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
                      paddingBottom: '0.75rem',
                      marginBottom: '1.25rem',
                    }}
                  >
                    <div>
                      <div style={{ fontSize: '0.85rem', color: '#64748b' }}>
                        ឈ្មោះក្រុមហ៊ុន / Company name / 公司名称:
                      </div>
                      <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#1e3a8a' }}>
                        {formData.companyName || '__________________________'}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right', fontSize: '0.85rem', color: '#475569' }}>
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
                  <div style={{ textAlign: 'center', margin: '1.5rem 0 1.25rem 0' }}>
                    <h2
                      style={{
                        fontSize: '1.5rem',
                        fontWeight: 800,
                        color: '#1e3a8a',
                        margin: '0 0 0.25rem 0',
                        letterSpacing: '0.5px',
                      }}
                    >
                      {currentMeta.nameKh}
                    </h2>
                    <h3
                      style={{
                        fontSize: '1.05rem',
                        fontWeight: 700,
                        color: '#1d4ed8',
                        margin: '0 0 0.2rem 0',
                        textTransform: 'uppercase',
                      }}
                    >
                      {currentMeta.nameEn}
                    </h3>
                    <h3
                      style={{
                        fontSize: '1.05rem',
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
                        marginTop: '0.85rem',
                        fontSize: '0.9rem',
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
                  <div style={{ marginBottom: '1.25rem' }}>
                    <div style={{ fontWeight: 800, color: '#1e3a8a', fontSize: '0.98rem', marginBottom: '0.35rem' }}>
                      ១. ភាគីនៃកិច្ចសន្យា / 1. Contracting parties / 一、合同双方
                    </div>
                    {/* Khmer */}
                    <p style={{ margin: '0 0 0.25rem 0', fontSize: '0.9rem', textAlign: 'justify' }}>
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
                    <p style={{ margin: '0 0 0.25rem 0', fontSize: '0.85rem', color: '#334155', fontStyle: 'italic', textAlign: 'justify' }}>
                      <strong>Employer:</strong> Company <u>{formData.companyName || '__________'}</u>, address{' '}
                      <u>{formData.companyAddress || '__________'}</u>, represented by{' '}
                      <u>{formData.representative || '__________'}</u>, position{' '}
                      <u>{formData.representativeRole || '__________'}</u>. <strong>Employee:</strong> Name{' '}
                      <u>{formData.employeeNameEn || '__________'}</u>, sex <u>{currentGender.en}</u>, date of
                      birth <u>{formatContractDate(formData.dob)}</u>, ID/passport{' '}
                      <u>{formData.nationalIdOrPassport || '__________'}</u>, address{' '}
                      <u>{formData.address || '__________'}</u>.
                    </p>
                    {/* Chinese */}
                    <p style={{ margin: '0 0 0.65rem 0', fontSize: '0.85rem', color: '#475569', textAlign: 'justify' }}>
                      <strong>雇主：</strong>公司名称 <u>{formData.companyName || '__________'}</u>，地址{' '}
                      <u>{formData.companyAddress || '__________'}</u>，代表人{' '}
                      <u>{formData.representative || '__________'}</u>，职务{' '}
                      <u>{formData.representativeRole || '__________'}</u>。<strong>员工：</strong>姓名{' '}
                      <u>{formData.employeeNameKh || formData.employeeNameEn || '__________'}</u>（英文：
                      <u>{formData.employeeNameEn || '__________'}</u>），性别 <u>{currentGender.zh}</u>，出生日期{' '}
                      <u>{formatContractDate(formData.dob)}</u>，身份证/护照{' '}
                      <u>{formData.nationalIdOrPassport || '__________'}</u>，地址{' '}
                      <u>{formData.address || '__________'}</u>。
                    </p>

                    {/* Term variation */}
                    {formData.contractType === 'PROBATION' && (
                      <div style={{ background: '#f8fafc', padding: '0.65rem', borderRadius: '6px', borderLeft: '3px solid #d97706' }}>
                        <div style={{ fontWeight: 700, color: '#b45309', fontSize: '0.9rem' }}>
                          រយៈពេលសាកល្បង / Probation period / 试用期限
                        </div>
                        <p style={{ margin: '0.2rem 0', fontSize: '0.87rem' }}>
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
                        <p style={{ margin: '0.2rem 0', fontSize: '0.82rem', color: '#334155', fontStyle: 'italic' }}>
                          From <u>{formatContractDate(formData.startDate)}</u> to{' '}
                          <u>{formatContractDate(formData.endDate)}</u>. Maximum: 3 months for employees, 2
                          months for specialised workers, 1 month for non-specialised workers (Article 68). Category: {formData.probationCategory}. The
                          employer evaluates work ability and communicates results. Notice during probation is
                          governed by Article 82. Continued employment shall be documented under a lawful FDC or UDC.
                        </p>
                        <p style={{ margin: '0.2rem 0', fontSize: '0.82rem', color: '#475569' }}>
                          自 <u>{formatContractDate(formData.startDate)}</u> 至{' '}
                          <u>{formatContractDate(formData.endDate)}</u>。最长试用期：职员3个月、专业工人2个月、普通工人1个月（第68条）。考核及结束：雇主评估工作能力并告知结果。试用期间通知依第82条执行。继续雇佣须依法签订固定期限或无固定期限合同。
                        </p>
                      </div>
                    )}

                    {formData.contractType === 'UDC' && (
                      <div style={{ background: '#f8fafc', padding: '0.65rem', borderRadius: '6px', borderLeft: '3px solid #059669' }}>
                        <div style={{ fontWeight: 700, color: '#047857', fontSize: '0.9rem' }}>
                          ការចាប់ផ្តើម និងរយៈពេល / Commencement and duration / 开始日期及期限
                        </div>
                        <p style={{ margin: '0.2rem 0', fontSize: '0.87rem' }}>
                          ចាប់ផ្តើមថ្ងៃទី <u>{formatContractDate(formData.startDate)}</u>{' '}
                          ហើយគ្មានថ្ងៃបញ្ចប់កំណត់ជាមុន។ អតីតភាពការងារត្រូវគណនាតាមច្បាប់។ ការបញ្ចប់កិច្ចសន្យា៖
                          ការបញ្ចប់កិច្ចសន្យាត្រូវមានមូលហេតុ និងការជូនដំណឹងតាមច្បាប់។ រយៈពេលជូនដំណឹងអាស្រ័យលើអតីតភាព៖
                          ក្រោម ៦ ខែ ៧ ថ្ងៃ; ៦ ខែដល់ ២ ឆ្នាំ ១៥ ថ្ងៃ; លើស ២ ដល់ ៥ ឆ្នាំ ១ ខែ; លើស ៥ ដល់ ១០ ឆ្នាំ ២
                          ខែ; លើស ១០ ឆ្នាំ ៣ ខែ។ ប្រាក់បំណាច់អតីតភាពការងារ និងសំណងផ្សេងៗត្រូវអនុវត្តតាមច្បាប់ជាធរមាន។
                        </p>
                        <p style={{ margin: '0.2rem 0', fontSize: '0.82rem', color: '#334155', fontStyle: 'italic' }}>
                          Commences on <u>{formatContractDate(formData.startDate)}</u> and has no predetermined
                          end date. Length of service is determined according to law. Termination requires lawful
                          grounds and notice (under 6 months, 7 days; 6 months–2 years, 15 days; over 2–5 years, 1
                          month; over 5–10 years, 2 months; over 10 years, 3 months). Seniority payments follow current law.
                        </p>
                        <p style={{ margin: '0.2rem 0', fontSize: '0.82rem', color: '#475569' }}>
                          自 <u>{formatContractDate(formData.startDate)}</u>{' '}
                          起生效，无预定终止日期。工龄依法计算。解除合同须具备合法理由并依法通知（不足6个月7天；6个月至2年15天；超过2年至5年1个月；超过5年至10年2个月；超过10年3个月）。工龄补偿及其他赔偿依法执行。
                        </p>
                      </div>
                    )}

                    {(formData.contractType === 'FDC' || formData.contractType === 'FOREIGN_FDC') && (
                      <div style={{ background: '#f8fafc', padding: '0.65rem', borderRadius: '6px', borderLeft: '3px solid #2563eb' }}>
                        <div style={{ fontWeight: 700, color: '#1d4ed8', fontSize: '0.9rem' }}>
                          រយៈពេលកិច្ចសន្យា / Contract term / 合同期限
                        </div>
                        <p style={{ margin: '0.2rem 0', fontSize: '0.87rem' }}>
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
                        <p style={{ margin: '0.2rem 0', fontSize: '0.82rem', color: '#334155', fontStyle: 'italic' }}>
                          From <u>{formatContractDate(formData.startDate)}</u> to{' '}
                          <u>{formatContractDate(formData.endDate)}</u>. This agreement is in writing with
                          definite start and end dates. Each term shall not exceed two years. Renewals must comply with
                          Article 67 and Instruction No. 050/19. Severance at expiry is at least 5% of wages paid during
                          the contract. Early termination follows Article 73.
                        </p>
                        <p style={{ margin: '0.2rem 0', fontSize: '0.82rem', color: '#475569' }}>
                          自 <u>{formatContractDate(formData.startDate)}</u> 至{' '}
                          <u>{formatContractDate(formData.endDate)}</u>。本合同采用书面形式，明确起止日期。每期合同不超过两年。续签须遵守第67条及第050/19号指导文件。合同期满时依法提前通知（超过6个月至1年提前10天；超过1年提前15天）。期满补偿至少为合同期内已支付工资的5%。
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Clause 2 */}
                  <div style={{ marginBottom: '1.25rem' }}>
                    <div style={{ fontWeight: 800, color: '#1e3a8a', fontSize: '0.98rem', marginBottom: '0.35rem' }}>
                      ២. មុខតំណែង និងទីកន្លែងធ្វើការ / 2. Position and workplace / 二、岗位及工作地点
                    </div>
                    <p style={{ margin: '0 0 0.2rem 0', fontSize: '0.9rem' }}>
                      {formData.clause2BodyKh || (
                        <>
                          មុខតំណែង <u>{formData.positionTitle || '__________'}</u> នាយកដ្ឋាន{' '}
                          <u>{formData.department || '__________'}</u> ទីកន្លែងធ្វើការ{' '}
                          <u>{formData.workplace || formData.companyAddress || '__________'}</u>។
                          ភារកិច្ចត្រូវអនុវត្តតាមការពិពណ៌នាការងារដែលបានពន្យល់ជូន។
                        </>
                      )}
                    </p>
                    <p style={{ margin: '0 0 0.2rem 0', fontSize: '0.85rem', color: '#334155', fontStyle: 'italic' }}>
                      Position <u>{formData.positionTitle || '__________'}</u>, department{' '}
                      <u>{formData.department || '__________'}</u>, workplace{' '}
                      <u>{formData.workplace || formData.companyAddress || '__________'}</u>. Duties follow the job
                      description explained to the employee.
                    </p>
                    <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.85rem', color: '#475569' }}>
                      岗位 <u>{formData.positionTitle || '__________'}</u>，部门{' '}
                      <u>{formData.department || '__________'}</u>，工作地点{' '}
                      <u>{formData.workplace || formData.companyAddress || '__________'}</u>。工作职责依照已向员工说明的岗位说明书。
                    </p>
                  </div>

                  {/* Clause 3 */}
                  <div style={{ marginBottom: '1.25rem' }}>
                    <div style={{ fontWeight: 800, color: '#1e3a8a', fontSize: '0.98rem', marginBottom: '0.35rem' }}>
                      ៣. ប្រាក់ឈ្នួល និងការទូទាត់ / 3. Wages and payment / 三、工资及支付
                    </div>
                    <p style={{ margin: '0 0 0.2rem 0', fontSize: '0.9rem' }}>
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
                    <p style={{ margin: '0 0 0.2rem 0', fontSize: '0.85rem', color: '#334155', fontStyle: 'italic' }}>
                      Basic wage USD <u>${formData.basicSalaryUsd.toLocaleString()}</u>/month or KHR{' '}
                      <u>{formData.basicSalaryKhr.toLocaleString()}</u>/month, not below the applicable minimum.
                      Payment date(s) <u>{formData.paymentDay}</u> via <u>{formData.paymentMethod}</u>. Overtime and
                      benefits follow applicable law.
                    </p>
                    <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.85rem', color: '#475569' }}>
                      基本工资每月 <u>${formData.basicSalaryUsd.toLocaleString()}</u> 美元或{' '}
                      <u>{formData.basicSalaryKhr.toLocaleString()}</u> 瑞尔，不低于适用最低工资。发薪日期{' '}
                      <u>{formData.paymentDay}</u>，支付方式 <u>{formData.paymentMethod}</u>。加班费及福利依法执行。
                    </p>
                  </div>

                  {/* Clause 4 */}
                  <div style={{ marginBottom: '1.25rem' }}>
                    <div style={{ fontWeight: 800, color: '#1e3a8a', fontSize: '0.98rem', marginBottom: '0.35rem' }}>
                      ៤. ម៉ោងធ្វើការ និងការសម្រាក / 4. Working hours and rest / 四、工作时间及休息
                    </div>
                    <p style={{ margin: '0 0 0.2rem 0', fontSize: '0.9rem' }}>
                      {formData.clause4BodyKh || (
                        <>
                          ម៉ោងធ្វើការ <u>{formData.workingHours}</u>; សម្រាកអាហារ <u>{formData.mealBreak}</u>;
                          ថ្ងៃធ្វើការ <u>{formData.workingDays}</u>។ ម៉ោងធ្វើការធម្មតាមិនលើស ៨
                          ម៉ោងក្នុងមួយថ្ងៃ និង ៤៨ ម៉ោងក្នុងមួយសប្តាហ៍។ ការថែមម៉ោងត្រូវធ្វើតាមច្បាប់។
                        </>
                      )}
                    </p>
                    <p style={{ margin: '0 0 0.2rem 0', fontSize: '0.85rem', color: '#334155', fontStyle: 'italic' }}>
                      Work hours <u>{formData.workingHours}</u>; meal break <u>{formData.mealBreak}</u>; working
                      days <u>{formData.workingDays}</u>. Normal hours shall not exceed 8 per day and 48 per week.
                      Overtime follows the law.
                    </p>
                    <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.85rem', color: '#475569' }}>
                      工作时间 <u>{formData.workingHours}</u>；用餐休息 <u>{formData.mealBreak}</u>；工作日{' '}
                      <u>{formData.workingDays}</u>。正常工作时间每日不超过8小时、每周不超过48小时。加班依法安排。
                    </p>
                  </div>

                  {/* Clause 5 */}
                  <div style={{ marginBottom: '1.25rem' }}>
                    <div style={{ fontWeight: 800, color: '#1e3a8a', fontSize: '0.98rem', marginBottom: '0.35rem' }}>
                      ៥. ការឈប់សម្រាក និងសន្តិសុខសង្គម / 5. Leave and social security / 五、休假及社会保障
                    </div>
                    <p style={{ margin: '0 0 0.2rem 0', fontSize: '0.9rem' }}>
                      កម្មករនិយោជិតមានសិទ្ធិទទួលបានថ្ងៃឈប់សម្រាកប្រចាំសប្តាហ៍ ថ្ងៃបុណ្យមានប្រាក់ឈ្នួល
                      ការឈប់សម្រាកប្រចាំឆ្នាំ និងការឈប់សម្រាកផ្សេងៗតាមច្បាប់។ និយោជកអនុវត្តកាតព្វកិច្ច ប.ស.ស.
                      តាមបទប្បញ្ញត្តិ។
                    </p>
                    <p style={{ margin: '0 0 0.2rem 0', fontSize: '0.85rem', color: '#334155', fontStyle: 'italic' }}>
                      The employee receives weekly rest, paid public holidays, annual leave and other statutory leave.
                      The employer meets applicable NSSF obligations.
                    </p>
                    <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.85rem', color: '#475569' }}>
                      员工依法享有每周休息、带薪法定节假日、年假及其他假期。雇主依法履行国家社会保障基金（NSSF）义务。
                    </p>
                  </div>

                  {/* Clause 6 */}
                  <div style={{ marginBottom: '1.25rem' }}>
                    <div style={{ fontWeight: 800, color: '#1e3a8a', fontSize: '0.98rem', marginBottom: '0.35rem' }}>
                      ៦. សុវត្ថិភាព សុខភាព និងវិន័យ / 6. Safety, health and discipline / 六、安全、健康与纪律
                    </div>
                    <p style={{ margin: '0 0 0.2rem 0', fontSize: '0.9rem' }}>
                      និយោជកផ្តល់បរិយាកាសការងារមានសុវត្ថិភាព និងឧបករណ៍ការពារដែលចាំបាច់។
                      កម្មករនិយោជិតគោរពនីតិវិធីសុវត្ថិភាព បទបញ្ជាផ្ទៃក្នុងស្របច្បាប់
                      និងមានសិទ្ធិប្តឹងតវ៉ាដោយគ្មានការសងសឹក។
                    </p>
                    <p style={{ margin: '0 0 0.2rem 0', fontSize: '0.85rem', color: '#334155', fontStyle: 'italic' }}>
                      The employer provides a safe workplace and necessary protective equipment. The employee follows
                      lawful safety procedures and internal rules and may raise grievances without retaliation.
                    </p>
                    <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.85rem', color: '#475569' }}>
                      雇主提供安全工作环境及必要防护用品。员工遵守合法安全程序和内部规章，并有权提出申诉且不受报复。
                    </p>
                  </div>

                  {/* Clause 7 */}
                  <div style={{ marginBottom: '1.25rem' }}>
                    <div style={{ fontWeight: 800, color: '#1e3a8a', fontSize: '0.98rem', marginBottom: '0.35rem' }}>
                      ៧. ការមិនរើសអើង និងការស្ម័គ្រចិត្ត / 7. Non-discrimination and voluntary work / 七、反歧视与自愿劳动
                    </div>
                    <p style={{ margin: '0 0 0.2rem 0', fontSize: '0.9rem' }}>
                      ការងារធ្វើឡើងដោយស្ម័គ្រចិត្ត គ្មានការបង្ខិតបង្ខំ ការរើសអើង
                      ឬការរក្សាទុកឯកសារផ្ទាល់ខ្លួនដោយខុសច្បាប់។
                    </p>
                    <p style={{ margin: '0 0 0.2rem 0', fontSize: '0.85rem', color: '#334155', fontStyle: 'italic' }}>
                      Employment is voluntary, without forced labour, discrimination or unlawful retention of personal
                      documents.
                    </p>
                    <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.85rem', color: '#475569' }}>
                      雇佣属自愿性质，禁止强迫劳动、歧视或非法扣留个人证件。
                    </p>
                  </div>

                  {/* Clause 8 */}
                  <div style={{ marginBottom: '1.25rem' }}>
                    <div style={{ fontWeight: 800, color: '#1e3a8a', fontSize: '0.98rem', marginBottom: '0.35rem' }}>
                      ៨. ការដោះស្រាយវិវាទ និងអាទិភាពច្បាប់ / 8. Disputes and governing law / 八、争议解决与适用法律
                    </div>
                    <p style={{ margin: '0 0 0.2rem 0', fontSize: '0.9rem' }}>
                      វិវាទត្រូវដោះស្រាយតាមការពិភាក្សា និងយន្តការស្របច្បាប់នៅកម្ពុជា។
                      ប្រសិនបើលក្ខខណ្ឌណាមួយផ្ទុយច្បាប់ការងារ ត្រូវអនុវត្តច្បាប់
                      ឬលក្ខខណ្ឌដែលផ្តល់អត្ថប្រយោជន៍ល្អជាងដល់កម្មករនិយោជិត។
                    </p>
                    <p style={{ margin: '0 0 0.2rem 0', fontSize: '0.85rem', color: '#334155', fontStyle: 'italic' }}>
                      Disputes shall be handled through dialogue and lawful Cambodian mechanisms. Where a term
                      conflicts with labour law, the law or more favourable employee entitlement prevails.
                    </p>
                    <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.85rem', color: '#475569' }}>
                      争议通过协商及柬埔寨合法机制解决。合同条款与劳动法冲突时，以法律或对员工更有利的条件为准。
                    </p>
                  </div>

                  {/* Clause 9 */}
                  <div style={{ marginBottom: '1.5rem' }}>
                    <div style={{ fontWeight: 800, color: '#1e3a8a', fontSize: '0.98rem', marginBottom: '0.35rem' }}>
                      ៩. ការទទួលស្គាល់ / 9. Acknowledgment / 九、确认
                    </div>
                    <p style={{ margin: '0 0 0.2rem 0', fontSize: '0.9rem' }}>
                      ភាគីទាំងពីរបានអាន ឬទទួលការពន្យល់អំពីកិច្ចសន្យានេះ និងយល់ព្រមដោយស្ម័គ្រចិត្ត។ រៀបចំជា ២ ច្បាប់
                      មានតម្លៃដូចគ្នា ភាគីនីមួយៗរក្សា ១ ច្បាប់។
                    </p>
                    <p style={{ margin: '0 0 0.2rem 0', fontSize: '0.85rem', color: '#334155', fontStyle: 'italic' }}>
                      Both parties have read or had this agreement explained and voluntarily accept it. Two equally
                      valid copies are signed, one retained by each party.
                    </p>
                    <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.85rem', color: '#475569' }}>
                      双方已阅读或听取本合同解释并自愿同意。本合同一式两份，具有同等效力，双方各执一份。
                    </p>
                  </div>

                  {/* Signatures Table */}
                  <table
                    style={{
                      width: '100%',
                      borderCollapse: 'collapse',
                      border: '1px solid #cbd5e1',
                      marginTop: '1.5rem',
                      marginBottom: '1rem',
                    }}
                  >
                    <thead>
                      <tr style={{ background: '#f8fafc', borderBottom: '1px solid #cbd5e1' }}>
                        <th style={{ width: '50%', padding: '0.75rem', textAlign: 'center', borderRight: '1px solid #cbd5e1' }}>
                          និយោជក / Employer / 雇主
                        </th>
                        <th style={{ width: '50%', padding: '0.75rem', textAlign: 'center' }}>
                          កម្មករនិយោជិត / Employee / 员工
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td
                          style={{
                            padding: '1rem',
                            borderRight: '1px solid #cbd5e1',
                            verticalAlign: 'top',
                            height: '140px',
                          }}
                        >
                          <div style={{ textAlign: 'center', color: '#64748b', fontSize: '0.8rem', marginBottom: '3.5rem' }}>
                            ហត្ថលេខា/ត្រា / Signature/stamp / 签名盖章
                          </div>
                          <div style={{ fontSize: '0.85rem' }}>
                            <div>
                              ឈ្មោះ / Name / 姓名: <strong>{formData.representative || '__________'}</strong>
                            </div>
                            <div>
                              កាលបរិច្ឆេទ / Date / 日期:{' '}
                              <strong>{formatContractDate(formData.signedDate)}</strong>
                            </div>
                          </div>
                        </td>
                        <td style={{ padding: '1rem', verticalAlign: 'top', height: '140px' }}>
                          <div style={{ textAlign: 'center', color: '#64748b', fontSize: '0.8rem', marginBottom: '3.5rem' }}>
                            ហត្ថលេខា/ស្នាមមេដៃ / Signature/thumbprint / 签名指印
                          </div>
                          <div style={{ fontSize: '0.85rem' }}>
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
                      fontSize: '0.75rem',
                      color: '#94a3b8',
                      fontStyle: 'italic',
                      marginTop: '1.25rem',
                      borderTop: '1px dashed #e2e8f0',
                      paddingTop: '0.5rem',
                    }}
                  >
                    សម្គាល់ / Note / 备注: គំរូសម្រាប់បំពេញ មិនមែនជាទម្រង់ដែលក្រសួងបានអនុម័តជាផ្លូវការទេ។ /
                    Editable template; not an officially approved ministry form. / 本文件为可编辑模板，并非部委正式批准的格式。
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
