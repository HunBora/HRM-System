'use client';

import React, { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import {
  generateIsoContractDocxBlob,
  IsoContractDocxData,
  IsoContractType,
  ISO_TYPE_DEFAULTS,
} from '@/lib/isoProbationDocx';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  employees?: any[];
  companySettings?: any;
  initialEmployee?: any;
  initialContractType?: IsoContractType;
  onSaveContract?: (contractData: any) => Promise<void>;
}

export default function IsoProbationContractModal({
  isOpen,
  onClose,
  employees = [],
  companySettings,
  initialEmployee,
  initialContractType,
  onSaveContract,
}: Props) {
  const [activeTab, setActiveTab] = useState<'preview' | 'edit'>('preview');
  const [langMode, setLangMode] = useState<'trilingual' | 'bilingual_zh' | 'khmer'>('trilingual');
  const [contractType, setContractType] = useState<IsoContractType>(() => {
    if (initialContractType) return initialContractType;
    if (initialEmployee?.nationality && initialEmployee.nationality.toLowerCase() !== 'cambodian' && initialEmployee.nationality.toLowerCase() !== 'ខ្មែរ') {
      return 'FOREIGN_FDC';
    }
    return 'PROBATION';
  });

  const [isGeneratingDocx, setIsGeneratingDocx] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Form State
  const [formData, setFormData] = useState<IsoContractDocxData>(() =>
    initIsoData(initialEmployee, companySettings, contractType)
  );

  useEffect(() => {
    if (initialEmployee) {
      let detectedType: IsoContractType = 'PROBATION';
      if (initialContractType) {
        detectedType = initialContractType;
      } else if (
        initialEmployee.nationality &&
        initialEmployee.nationality.toLowerCase() !== 'cambodian' &&
        initialEmployee.nationality.toLowerCase() !== 'ខ្មែរ'
      ) {
        detectedType = 'FOREIGN_FDC';
      }
      setContractType(detectedType);
      setFormData(initIsoData(initialEmployee, companySettings, detectedType));
    }
  }, [initialEmployee, companySettings, initialContractType]);

  if (!isOpen) return null;

  function initIsoData(emp: any, settings: any, cType: IsoContractType): IsoContractDocxData {
    const today = new Date();
    const dStart = new Date(today);
    const dEnd = new Date(today);

    if (cType === 'PROBATION') {
      dEnd.setMonth(dEnd.getMonth() + 2); // 2 months probation
    } else if (cType === 'UDC') {
      dEnd.setFullYear(dEnd.getFullYear() + 10); // Indefinite placeholder
    } else {
      dEnd.setFullYear(dEnd.getFullYear() + 1); // 1 year for FDC and Foreign FDC
    }

    const formatDate = (d: Date) => {
      const day = String(d.getDate()).padStart(2, '0');
      const month = String(d.getMonth() + 1).padStart(2, '0');
      return `${day}/${month}/${d.getFullYear()}`;
    };

    const isForeign =
      cType === 'FOREIGN_FDC' ||
      (emp?.nationality &&
        emp.nationality.toLowerCase() !== 'cambodian' &&
        emp.nationality.toLowerCase() !== 'ខ្មែរ');

    const nameKh = emp ? `${emp.firstNameKh || ''} ${emp.lastNameKh || ''}`.trim() : isForeign ? 'វ៉ាង ជានមីង' : 'សុខ ចាន់ដា';
    const nameEn = emp ? `${emp.firstNameEn || ''} ${emp.lastNameEn || ''}`.trim() : isForeign ? 'WANG JIANMING' : 'SOK CHANDA';
    const genderKh = emp?.gender === 'FEMALE' ? 'ស្រី' : 'ប្រុស';
    const genderZh = emp?.gender === 'FEMALE' ? '女' : '男';

    const typeConfig = ISO_TYPE_DEFAULTS[cType] || ISO_TYPE_DEFAULTS.PROBATION;

    return {
      contractType: cType,
      companyNameKh: 'ឡាងថៃ ប៊ែក (ខេមបូឌា) ឯក',
      companyNameEn: 'LANGTAI BAGS (CAMBODIA) CO., LTD',
      companyNameZh: '朗泰箱包（柬埔寨）有限公司',
      companyAddress: settings?.address || 'ភូមិតានប់ ឃុំត្រាំកក់ ស្រុកត្រាំកក់ ខេត្តតាកែវ / Takeo Province, Cambodia',
      docCode: typeConfig.docCode,
      revision: '02',
      effectiveDate: '01/01/2026',
      customTitleKh: typeConfig.titleKh,
      customTitleZh: typeConfig.titleZh,
      customTitleEn: typeConfig.titleEn,
      customLawRefKh: typeConfig.lawRefKh,
      customLawRefZh: typeConfig.lawRefZh,
      customLawRefEn: typeConfig.lawRefEn,
      employeeNameKh: nameKh,
      employeeNameEn: nameEn,
      genderKh: genderKh,
      genderZh: genderZh,
      age: 26,
      dob: emp?.dob ? formatDate(new Date(emp.dob)) : '15/05/1999',
      education: isForeign ? 'បរិញ្ញាបត្រ / 本科 (Bachelor Degree)' : 'មធ្យមសិក្សា / 中学 (Secondary School)',
      position: emp?.position || (isForeign ? 'ប្រធានផ្នែកផលិតកម្ម / 生产主管 (Production Supervisor)' : 'កម្មករដេរកាតាប / 车缝工 (Sewing Operator)'),
      nationalId: emp?.nationalId || (isForeign ? 'N/A' : '020589123'),
      nssfNo: isForeign ? 'N/A' : '10023458',
      joinDate: formatDate(dStart),
      employeeId: emp?.employeeId || (isForeign ? 'EXP-2026-009' : 'LT-2026-088'),
      address: emp?.address || (isForeign ? 'ខុនដូររោងចក្រ ឡាងថៃ ប៊ែក / Langtai Factory Residence' : 'ភូមិត្រពាំងវែង ឃុំត្រាំកក់ ស្រុកត្រាំកក់ ខេត្តតាកែវ'),
      nationality: isForeign ? 'ចិន / 中国 (Chinese)' : 'ខ្មែរ / 柬埔寨 (Cambodian)',
      isForeigner: isForeign,
      passportNo: isForeign ? 'E89123456' : '',
      passportExpiry: isForeign ? '15/10/2030' : '',
      visaNo: isForeign ? 'CB-2026-88990' : '',
      visaExpiry: isForeign ? '15/10/2027' : '',
      workPermitNo: isForeign ? 'WP-MLVT-2026-789' : '',
      workPermitExpiry: isForeign ? '31/12/2026' : '',
      countryOfOrigin: isForeign ? 'សាធារណរដ្ឋប្រជាមានិតចិន / 中国 (P.R. China)' : 'ព្រះរាជាណាចក្រកម្ពុជា / 柬埔寨',
      probationDurationMonths: 2,
      startDate: formatDate(dStart),
      endDate: cType === 'UDC' ? 'គ្មានកាលកំណត់ / 无固定期限 / Indefinite' : formatDate(dEnd),
      durationText: cType === 'PROBATION' ? '២ ខែ (2 Months)' : cType === 'UDC' ? 'គ្មានកាលកំណត់ (Indefinite)' : '១ ឆ្នាំ (1 Year)',
      basicSalaryUsd: isForeign ? 1200 : 208,
      attendanceBonusUsd: 15,
      transportAllowanceUsd: 9.5,
      mealAllowanceRiel: 2000,
      signedDate: formatDate(dStart),
      langMode: 'trilingual',
    };
  }

  // Handle switching contract type
  const handleSwitchType = (newType: IsoContractType) => {
    setContractType(newType);
    const typeConfig = ISO_TYPE_DEFAULTS[newType];
    const isForeign = newType === 'FOREIGN_FDC';

    setFormData((prev) => {
      const today = new Date();
      const dStart = new Date(today);
      const dEnd = new Date(today);

      if (newType === 'PROBATION') {
        dEnd.setMonth(dEnd.getMonth() + 2);
      } else if (newType === 'UDC') {
        dEnd.setFullYear(dEnd.getFullYear() + 10);
      } else {
        dEnd.setFullYear(dEnd.getFullYear() + 1);
      }

      const formatDate = (d: Date) => {
        const day = String(d.getDate()).padStart(2, '0');
        const month = String(d.getMonth() + 1).padStart(2, '0');
        return `${day}/${month}/${d.getFullYear()}`;
      };

      return {
        ...prev,
        contractType: newType,
        docCode: typeConfig.docCode,
        customTitleKh: typeConfig.titleKh,
        customTitleZh: typeConfig.titleZh,
        customTitleEn: typeConfig.titleEn,
        customLawRefKh: typeConfig.lawRefKh,
        customLawRefZh: typeConfig.lawRefZh,
        customLawRefEn: typeConfig.lawRefEn,
        isForeigner: isForeign,
        endDate: newType === 'UDC' ? 'គ្មានកាលកំណត់ / 无固定期限 / Indefinite' : formatDate(dEnd),
        durationText: newType === 'PROBATION' ? '២ ខែ (2 Months)' : newType === 'UDC' ? 'គ្មានកាលកំណត់ (Indefinite)' : '១ ឆ្នាំ (1 Year)',
        basicSalaryUsd: isForeign && Number(prev.basicSalaryUsd) <= 250 ? 1200 : prev.basicSalaryUsd,
      };
    });
  };

  // Handle employee picker change
  const handleSelectEmployee = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedId = e.target.value;
    const found = employees.find((x) => x.id === selectedId);
    if (found) {
      const isForeign =
        Boolean(found.nationality) &&
        found.nationality.toLowerCase() !== 'cambodian' &&
        found.nationality.toLowerCase() !== 'ខ្មែរ';

      const suggestedType: IsoContractType = isForeign ? 'FOREIGN_FDC' : contractType;
      if (isForeign && contractType !== 'FOREIGN_FDC') {
        setContractType('FOREIGN_FDC');
      }

      const nameKh = `${found.firstNameKh || ''} ${found.lastNameKh || ''}`.trim();
      const nameEn = `${found.firstNameEn || ''} ${found.lastNameEn || ''}`.trim();
      setFormData((prev) => ({
        ...prev,
        contractType: suggestedType,
        isForeigner: isForeign,
        employeeNameKh: nameKh || prev.employeeNameKh,
        employeeNameEn: nameEn || prev.employeeNameEn,
        genderKh: found.gender === 'FEMALE' ? 'ស្រី' : 'ប្រុស',
        genderZh: found.gender === 'FEMALE' ? '女' : '男',
        position: found.position || prev.position,
        employeeId: found.employeeId || prev.employeeId,
        nationalId: found.nationalId || prev.nationalId,
        address: found.address || prev.address,
        basicSalaryUsd: found.basicSalary || prev.basicSalaryUsd,
      }));
    }
  };

  // Export to Word (.docx)
  const handleExportDocx = async () => {
    setIsGeneratingDocx(true);
    try {
      const blob = await generateIsoContractDocxBlob({
        ...formData,
        contractType,
        langMode,
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const typeLabel = contractType === 'FDC' ? 'FDC' : contractType === 'UDC' ? 'UDC' : contractType === 'FOREIGN_FDC' ? 'FOREIGN' : 'PROBATION';
      a.download = `កិច្ចសន្យា_${typeLabel}_ISO9001_${formData.employeeNameEn || 'Contract'}_${formData.docCode}.docx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      Swal.fire({
        icon: 'success',
        title: 'ទាញយក Word ជោគជ័យ!',
        text: `ឯកសារកិច្ចសន្យា ${typeLabel} ISO 9001:2015 (.docx) ត្រូវបានបង្កើតរួចរាល់`,
        timer: 2000,
        showConfirmButton: false,
      });
    } catch (err: any) {
      Swal.fire({ icon: 'error', title: 'បរាជ័យទាញយក Word!', text: err.message });
    } finally {
      setIsGeneratingDocx(false);
    }
  };

  // Save changes
  const handleSave = async () => {
    if (onSaveContract) {
      setIsSaving(true);
      try {
        await onSaveContract(formData);
        Swal.fire({ icon: 'success', title: 'បានរក្សាទុកជោគជ័យ!', timer: 1500, showConfirmButton: false });
        setActiveTab('preview');
      } catch (err: any) {
        Swal.fire({ icon: 'error', title: 'បរាជ័យរក្សាទុក!', text: err.message });
      } finally {
        setIsSaving(false);
      }
    } else {
      Swal.fire({ icon: 'success', title: 'ទិន្នន័យកិច្ចសន្យាត្រូវបានធ្វើបច្ចុប្បន្នភាព!', timer: 1200, showConfirmButton: false });
      setActiveTab('preview');
    }
  };

  const currentConfig = ISO_TYPE_DEFAULTS[contractType] || ISO_TYPE_DEFAULTS.PROBATION;
  const isTrilingual = langMode === 'trilingual';
  const isBilingualZh = langMode === 'bilingual_zh';

  // Renders the standard ISO 9001:2015 Header on each of the 4 pages
  const renderIsoHeader = (pageNum: number) => (
    <div style={{ border: '1.5px solid #0f172a', padding: '8px 12px', marginBottom: '14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#fafafa' }}>
      <div>
        <div style={{ fontFamily: 'Khmer OS Muol Light, Moul, serif', fontSize: '0.92rem', color: '#b91c1c', fontWeight: 800 }}>
          {formData.companyNameKh}
        </div>
        <div style={{ fontSize: '0.78rem', fontWeight: 800, color: '#0f172a', letterSpacing: '0.5px' }}>
          {formData.companyNameEn}
        </div>
      </div>
      <div style={{ textAlign: 'right', fontSize: '0.72rem', color: '#334155', lineHeight: 1.3 }}>
        <div style={{ fontWeight: 800, color: '#0284c7' }}>ISO 9001:2015 CONTROLLED FORM</div>
        <div>Doc Code: <strong>{formData.docCode}</strong> | Rev: <strong>{formData.revision}</strong></div>
        <div>Eff Date: <strong>{formData.effectiveDate}</strong> | <strong>Page {pageNum} of 4</strong></div>
      </div>
    </div>
  );

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(15, 23, 42, 0.82)',
        backdropFilter: 'blur(5px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 99999,
        padding: '12px',
      }}
    >
      <div
        style={{
          background: '#f8fafc',
          borderRadius: '16px',
          width: '100%',
          maxWidth: '1160px',
          height: '96vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.35)',
          overflow: 'hidden',
          border: '1px solid #cbd5e1',
        }}
      >
        {/* Top Control Bar with Contract Type Selector */}
        <div
          className="no-print"
          style={{
            background: '#ffffff',
            padding: '10px 18px',
            borderBottom: '1px solid #e2e8f0',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '10px',
          }}
        >
          {/* Title & Interactive Contract Type Selector */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '1.3rem' }}>🏭</span>
              <h2 style={{ margin: 0, fontSize: '1.08rem', color: '#0f172a', fontWeight: 800 }}>
                {currentConfig.titleKh} (ISO 9001:2015)
              </h2>

              {/* 4 Interactive Contract Type Switcher Buttons */}
              <div
                style={{
                  display: 'inline-flex',
                  gap: '4px',
                  background: '#f1f5f9',
                  padding: '3px',
                  borderRadius: '8px',
                  marginLeft: '4px',
                  border: '1px solid #e2e8f0',
                }}
              >
                <button
                  type="button"
                  onClick={() => handleSwitchType('PROBATION')}
                  style={{
                    padding: '4px 9px',
                    borderRadius: '6px',
                    border: 'none',
                    background: contractType === 'PROBATION' ? '#d97706' : 'transparent',
                    color: contractType === 'PROBATION' ? '#ffffff' : '#64748b',
                    fontWeight: 700,
                    fontSize: '0.76rem',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                  title="កិច្ចសន្យាសាកល្បង (Doc Code: LT-HR-SOP-002-F01)"
                >
                  🟡 សាកល្បង (Probation)
                </button>
                <button
                  type="button"
                  onClick={() => handleSwitchType('FDC')}
                  style={{
                    padding: '4px 9px',
                    borderRadius: '6px',
                    border: 'none',
                    background: contractType === 'FDC' ? '#2563eb' : 'transparent',
                    color: contractType === 'FDC' ? '#ffffff' : '#64748b',
                    fontWeight: 700,
                    fontSize: '0.76rem',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                  title="កិច្ចសន្យាមានកាលកំណត់ (Doc Code: LT-HR-SOP-002-F02)"
                >
                  🔵 មានកាលកំណត់ (FDC)
                </button>
                <button
                  type="button"
                  onClick={() => handleSwitchType('UDC')}
                  style={{
                    padding: '4px 9px',
                    borderRadius: '6px',
                    border: 'none',
                    background: contractType === 'UDC' ? '#059669' : 'transparent',
                    color: contractType === 'UDC' ? '#ffffff' : '#64748b',
                    fontWeight: 700,
                    fontSize: '0.76rem',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                  title="កិច្ចសន្យាគ្មានកាលកំណត់ (Doc Code: LT-HR-SOP-002-F03)"
                >
                  🟢 គ្មានកាលកំណត់ (UDC)
                </button>
                <button
                  type="button"
                  onClick={() => handleSwitchType('FOREIGN_FDC')}
                  style={{
                    padding: '4px 9px',
                    borderRadius: '6px',
                    border: 'none',
                    background: contractType === 'FOREIGN_FDC' ? '#7c3aed' : 'transparent',
                    color: contractType === 'FOREIGN_FDC' ? '#ffffff' : '#64748b',
                    fontWeight: 700,
                    fontSize: '0.76rem',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                  title="កិច្ចសន្យាបុគ្គលិកជនបរទេស (Doc Code: LT-HR-SOP-002-F04)"
                >
                  🟣 ជនបរទេស (Foreigner)
                </button>
              </div>
            </div>

            <p style={{ margin: '3px 0 0 0', fontSize: '0.76rem', color: '#64748b' }}>
              {currentConfig.lawRefKh}
            </p>
          </div>

          {/* Action Tabs & Buttons */}
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
            {/* View / Edit Tabs */}
            <div style={{ background: '#f1f5f9', borderRadius: '8px', padding: '3px', display: 'flex', gap: '3px' }}>
              <button
                type="button"
                onClick={() => setActiveTab('preview')}
                style={{
                  padding: '5px 11px',
                  borderRadius: '6px',
                  border: 'none',
                  background: activeTab === 'preview' ? '#ffffff' : 'transparent',
                  color: activeTab === 'preview' ? '#0284c7' : '#64748b',
                  fontWeight: 700,
                  fontSize: '0.8rem',
                  cursor: 'pointer',
                  boxShadow: activeTab === 'preview' ? '0 1px 2px rgba(0,0,0,0.06)' : 'none',
                }}
              >
                👁️ មើលទម្រង់ (Preview 4 Pages)
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('edit')}
                style={{
                  padding: '5px 11px',
                  borderRadius: '6px',
                  border: 'none',
                  background: activeTab === 'edit' ? '#ffffff' : 'transparent',
                  color: activeTab === 'edit' ? '#ea580c' : '#64748b',
                  fontWeight: 700,
                  fontSize: '0.8rem',
                  cursor: 'pointer',
                  boxShadow: activeTab === 'edit' ? '0 1px 2px rgba(0,0,0,0.06)' : 'none',
                }}
              >
                ✏️ កែប្រែទិន្នន័យ (Edit)
              </button>
            </div>

            {/* Language Switcher */}
            <select
              value={langMode}
              onChange={(e: any) => setLangMode(e.target.value)}
              style={{
                padding: '5px 10px',
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
                fontSize: '0.8rem',
                fontWeight: 600,
                background: '#ffffff',
                color: '#1e293b',
                cursor: 'pointer',
              }}
            >
              <option value="trilingual">🌐 ៣ ភាសា (ខ្មែរ - 中文 - EN)</option>
              <option value="bilingual_zh">🇨🇳 ខ្មែរ + 中文</option>
              <option value="khmer">🇰🇭 ភាសាខ្មែរសុទ្ធ</option>
            </select>

            {/* Print Button */}
            <button
              type="button"
              onClick={() => window.print()}
              style={{
                background: '#0f172a',
                color: '#ffffff',
                padding: '5px 12px',
                borderRadius: '8px',
                border: 'none',
                fontWeight: 700,
                fontSize: '0.8rem',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
              }}
            >
              🖨️ បោះពុម្ព (Print 4 Pages)
            </button>

            {/* Word Export Button */}
            <button
              type="button"
              onClick={handleExportDocx}
              disabled={isGeneratingDocx}
              style={{
                background: '#0284c7',
                color: '#ffffff',
                padding: '5px 12px',
                borderRadius: '8px',
                border: 'none',
                fontWeight: 700,
                fontSize: '0.8rem',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
              }}
            >
              📥 {isGeneratingDocx ? 'កំពុងបង្កើត...' : 'Word (.docx)'}
            </button>

            {/* Close */}
            <button
              type="button"
              onClick={onClose}
              style={{
                background: '#fee2e2',
                color: '#dc2626',
                border: 'none',
                borderRadius: '8px',
                padding: '5px 11px',
                fontWeight: 700,
                fontSize: '0.82rem',
                cursor: 'pointer',
              }}
            >
              ✕ បិទ
            </button>
          </div>
        </div>

        {/* Modal Body: Active Tab Content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px', background: '#f1f5f9' }}>
          {activeTab === 'edit' ? (
            /* --- EDIT TAB --- */
            <div
              style={{
                maxWidth: '960px',
                margin: '0 auto',
                background: '#ffffff',
                padding: '24px',
                borderRadius: '12px',
                border: '1px solid #e2e8f0',
                boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)',
              }}
            >
              <h3 style={{ margin: '0 0 16px 0', fontSize: '1.05rem', color: '#0f172a', fontWeight: 800 }}>
                ✏️ កែប្រែព័ត៌មានកិច្ចសន្យា ISO 9001:2015 ({currentConfig.titleKh})
              </h3>

              {/* Employee Quick Picker */}
              {employees && employees.length > 0 && (
                <div style={{ marginBottom: '16px', padding: '12px', background: '#eff6ff', borderRadius: '8px', border: '1px solid #bfdbfe' }}>
                  <label style={{ display: 'block', fontWeight: 700, fontSize: '0.82rem', color: '#1e3a8a', marginBottom: '6px' }}>
                    🔍 ទាញយកទិន្នន័យពីបុគ្គលិកដែលមានស្រាប់ (Quick Fill from Database):
                  </label>
                  <select
                    onChange={handleSelectEmployee}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: '6px',
                      border: '1px solid #93c5fd',
                      fontSize: '0.85rem',
                      background: '#ffffff',
                    }}
                  >
                    <option value="">-- ជ្រើសរើសបុគ្គលិកដើម្បីទាញយកព័ត៌មាន --</option>
                    {employees.map((emp) => (
                      <option key={emp.id} value={emp.id}>
                        {emp.employeeId} - {emp.firstNameKh || emp.firstNameEn} {emp.lastNameKh || emp.lastNameEn} ({emp.position || 'No Position'}) {emp.nationality ? `[${emp.nationality}]` : ''}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Form Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                    ប្រភេទកិច្ចសន្យា (Contract Type):
                  </label>
                  <select
                    value={contractType}
                    onChange={(e: any) => handleSwitchType(e.target.value)}
                    style={{ width: '100%', padding: '7px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem', fontWeight: 700 }}
                  >
                    <option value="PROBATION">🟡 កិច្ចសន្យាសាកល្បង (Probation) - F01</option>
                    <option value="FDC">🔵 កិច្ចសន្យាមានកាលកំណត់ (FDC) - F02</option>
                    <option value="UDC">🟢 កិច្ចសន្យាគ្មានកាលកំណត់ (UDC) - F03</option>
                    <option value="FOREIGN_FDC">🟣 កិច្ចសន្យាបុគ្គលិកជនបរទេស (Foreigner) - F04</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                    លេខកូដឯកសារ ISO (Doc Code):
                  </label>
                  <input
                    type="text"
                    value={formData.docCode}
                    onChange={(e) => setFormData({ ...formData, docCode: e.target.value })}
                    style={{ width: '100%', padding: '7px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                    ឈ្មោះកម្មករនិយោជិត (ខ្មែរ):
                  </label>
                  <input
                    type="text"
                    value={formData.employeeNameKh}
                    onChange={(e) => setFormData({ ...formData, employeeNameKh: e.target.value })}
                    style={{ width: '100%', padding: '7px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                    ឈ្មោះបុគ្គលិក (អក្សរឡាតាំង / 英文 / English):
                  </label>
                  <input
                    type="text"
                    value={formData.employeeNameEn}
                    onChange={(e) => setFormData({ ...formData, employeeNameEn: e.target.value })}
                    style={{ width: '100%', padding: '7px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                    ភេទ (Gender):
                  </label>
                  <select
                    value={formData.genderKh}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        genderKh: e.target.value,
                        genderZh: e.target.value === 'ស្រី' ? '女' : '男',
                      })
                    }
                    style={{ width: '100%', padding: '7px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
                  >
                    <option value="ប្រុស">ប្រុស / 男 (Male)</option>
                    <option value="ស្រី">ស្រី / 女 (Female)</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                    មុខតំណែង (Position):
                  </label>
                  <input
                    type="text"
                    value={formData.position}
                    onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                    style={{ width: '100%', padding: '7px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                    អត្តលេខបុគ្គលិក (Employee ID):
                  </label>
                  <input
                    type="text"
                    value={formData.employeeId}
                    onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })}
                    style={{ width: '100%', padding: '7px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                    ថ្ងៃខែឆ្នាំកំណើត (DOB):
                  </label>
                  <input
                    type="text"
                    value={formData.dob}
                    onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
                    style={{ width: '100%', padding: '7px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
                  />
                </div>

                {formData.isForeigner ? (
                  <>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#7c3aed', marginBottom: '4px' }}>
                        លេខលិខិតឆ្លងដែន (Passport No):
                      </label>
                      <input
                        type="text"
                        value={formData.passportNo || ''}
                        onChange={(e) => setFormData({ ...formData, passportNo: e.target.value })}
                        style={{ width: '100%', padding: '7px 10px', borderRadius: '6px', border: '1px solid #c4b5fd', fontSize: '0.85rem' }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#7c3aed', marginBottom: '4px' }}>
                        សុពលភាពលិខិតឆ្លងដែន (Passport Expiry):
                      </label>
                      <input
                        type="text"
                        value={formData.passportExpiry || ''}
                        onChange={(e) => setFormData({ ...formData, passportExpiry: e.target.value })}
                        style={{ width: '100%', padding: '7px 10px', borderRadius: '6px', border: '1px solid #c4b5fd', fontSize: '0.85rem' }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#7c3aed', marginBottom: '4px' }}>
                        ទិដ្ឋាការការងារ (Visa E No):
                      </label>
                      <input
                        type="text"
                        value={formData.visaNo || ''}
                        onChange={(e) => setFormData({ ...formData, visaNo: e.target.value })}
                        style={{ width: '100%', padding: '7px 10px', borderRadius: '6px', border: '1px solid #c4b5fd', fontSize: '0.85rem' }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#7c3aed', marginBottom: '4px' }}>
                        ប័ណ្ណការងារជនបរទេស (Work Permit No):
                      </label>
                      <input
                        type="text"
                        value={formData.workPermitNo || ''}
                        onChange={(e) => setFormData({ ...formData, workPermitNo: e.target.value })}
                        style={{ width: '100%', padding: '7px 10px', borderRadius: '6px', border: '1px solid #c4b5fd', fontSize: '0.85rem' }}
                      />
                    </div>
                  </>
                ) : (
                  <>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                        លេខអត្តសញ្ញាណប័ណ្ណ (National ID):
                      </label>
                      <input
                        type="text"
                        value={formData.nationalId}
                        onChange={(e) => setFormData({ ...formData, nationalId: e.target.value })}
                        style={{ width: '100%', padding: '7px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                        លេខកាត ប.ស.ស (NSSF No):
                      </label>
                      <input
                        type="text"
                        value={formData.nssfNo}
                        onChange={(e) => setFormData({ ...formData, nssfNo: e.target.value })}
                        style={{ width: '100%', padding: '7px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
                      />
                    </div>
                  </>
                )}

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                    កាលបរិច្ឆេទចាប់ផ្តើម (Start Date):
                  </label>
                  <input
                    type="text"
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    style={{ width: '100%', padding: '7px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                    កាលបរិច្ឆេទបញ្ចប់ (End Date):
                  </label>
                  <input
                    type="text"
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    style={{ width: '100%', padding: '7px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                    ប្រាក់ឈ្នួលគោល ($USD):
                  </label>
                  <input
                    type="number"
                    value={formData.basicSalaryUsd}
                    onChange={(e) => setFormData({ ...formData, basicSalaryUsd: Number(e.target.value) })}
                    style={{ width: '100%', padding: '7px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                    ប្រាក់រង្វាន់ឧស្សាហ៍ព្យាយាម ($USD):
                  </label>
                  <input
                    type="number"
                    value={formData.attendanceBonusUsd}
                    onChange={(e) => setFormData({ ...formData, attendanceBonusUsd: Number(e.target.value) })}
                    style={{ width: '100%', padding: '7px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                    ប្រាក់ថ្លៃធ្វើដំណើរ និងស្នាក់នៅ ($USD):
                  </label>
                  <input
                    type="number"
                    value={formData.transportAllowanceUsd}
                    onChange={(e) => setFormData({ ...formData, transportAllowanceUsd: Number(e.target.value) })}
                    style={{ width: '100%', padding: '7px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                    ប្រាក់ថ្លៃបាយ (រៀល/ថ្ងៃ):
                  </label>
                  <input
                    type="number"
                    value={formData.mealAllowanceRiel}
                    onChange={(e) => setFormData({ ...formData, mealAllowanceRiel: Number(e.target.value) })}
                    style={{ width: '100%', padding: '7px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
                  />
                </div>
              </div>

              <div style={{ marginTop: '16px' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                  អាសយដ្ឋានបច្ចុប្បន្ន (Current Address):
                </label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  style={{ width: '100%', padding: '7px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
                />
              </div>

              {/* Submit Buttons */}
              <div style={{ marginTop: '24px', display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={() => setActiveTab('preview')}
                  style={{
                    padding: '8px 18px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    background: '#ffffff',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  ត្រឡប់ទៅមើលទម្រង់ (Preview)
                </button>
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={isSaving}
                  style={{
                    padding: '8px 24px',
                    borderRadius: '8px',
                    border: 'none',
                    background: '#047857',
                    color: '#ffffff',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  {isSaving ? 'កំពុងរក្សាទុក...' : '💾 រក្សាទុកទិន្នន័យ (Save Data)'}
                </button>
              </div>
            </div>
          ) : (
            /* --- PREVIEW TAB (4 SEPARATE A4 PAGES WITH ISO HEADERS) --- */
            <div className="iso-contract-print-container" style={{ maxWidth: '840px', margin: '0 auto' }}>
              <style>{`
                @media print {
                  body * {
                    visibility: hidden;
                  }
                  .iso-contract-print-container, .iso-contract-print-container * {
                    visibility: visible;
                  }
                  .iso-contract-print-container {
                    position: absolute;
                    left: 0;
                    top: 0;
                    width: 100% !important;
                    margin: 0 !important;
                    padding: 0 !important;
                  }
                  .no-print {
                    display: none !important;
                  }
                  .iso-page {
                    page-break-after: always !important;
                    break-after: page !important;
                    border: none !important;
                    box-shadow: none !important;
                    margin: 0 !important;
                    padding: 15mm 15mm !important;
                    width: 100% !important;
                    min-height: 297mm !important;
                  }
                }
                .iso-page {
                  background: #ffffff;
                  border: 1px solid #cbd5e1;
                  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
                  padding: 40px;
                  margin-bottom: 24px;
                  font-family: 'Khmer OS Battambang', 'Segoe UI', Tahoma, sans-serif;
                  font-size: 0.86rem;
                  line-height: 1.5;
                  color: #0f172a;
                }
                .iso-title-kh {
                  font-family: 'Khmer OS Muol Light', Moul, serif;
                  font-size: 1.15rem;
                  color: #0f172a;
                  font-weight: 800;
                  text-align: center;
                  margin: 6px 0 2px 0;
                }
                .iso-title-zh {
                  font-family: 'SimSun', 'Microsoft YaHei', sans-serif;
                  font-size: 1rem;
                  color: #1e3a8a;
                  font-weight: 700;
                  text-align: center;
                  margin: 0 0 10px 0;
                }
                .iso-article-title {
                  font-family: 'Khmer OS Muol Light', Moul, serif;
                  font-size: 0.92rem;
                  color: #0f172a;
                  font-weight: 800;
                  margin-top: 14px;
                  margin-bottom: 2px;
                }
                .iso-article-zh {
                  font-family: 'SimSun', 'Microsoft YaHei', sans-serif;
                  font-size: 0.85rem;
                  color: #1e3a8a;
                  font-weight: 700;
                  margin-bottom: 6px;
                }
                .iso-clause-kh {
                  font-size: 0.84rem;
                  color: #1e293b;
                  margin-bottom: 3px;
                  white-space: pre-line;
                }
                .iso-clause-zh {
                  font-family: 'SimSun', 'Microsoft YaHei', sans-serif;
                  font-size: 0.8rem;
                  color: #475569;
                  margin-bottom: 4px;
                  white-space: pre-line;
                }
                .iso-clause-en {
                  font-size: 0.76rem;
                  color: #64748b;
                  font-style: italic;
                  margin-bottom: 10px;
                  white-space: pre-line;
                }
                .iso-table {
                  width: 100%;
                  border-collapse: collapse;
                  margin: 10px 0;
                  font-size: 0.82rem;
                }
                .iso-table td, .iso-table th {
                  border: 1px solid #334155;
                  padding: 6px 8px;
                }
              `}</style>

              {/* ======================================================== */}
              {/* PAGE 1: HEADER, PARTIES, EMPLOYEE TABLE, ARTICLE 1 & 2 */}
              {/* ======================================================== */}
              <div className="iso-page">
                {renderIsoHeader(1)}

                <div className="iso-title-kh">{currentConfig.titleKh}</div>
                <div className="iso-title-zh">
                  {currentConfig.titleZh}
                  {isTrilingual && <span style={{ color: '#64748b', fontSize: '0.85rem', marginLeft: '6px' }}>• {currentConfig.titleEn}</span>}
                </div>
                <div style={{ textAlign: 'center', fontSize: '0.78rem', color: '#64748b', marginBottom: '8px' }}>
                  រវាង (之间 / BETWEEN)
                </div>

                {/* Parties Details */}
                <div style={{ fontSize: '0.84rem', lineHeight: 1.5, marginBottom: '10px' }}>
                  <div>
                    <strong style={{ fontFamily: 'Khmer OS Muol Light, Moul, serif' }}>
                      ក្រុមហ៊ុន {formData.companyNameKh} (ហៅកាត់ថា ភាគី ក)
                    </strong>{' '}
                    / {formData.companyNameEn} 叫方 (A)
                  </div>
                  <div style={{ color: '#475569' }}>
                    អាសយដ្ឋាន/地址 ៖ {formData.companyAddress}
                  </div>
                  <div style={{ textAlign: 'center', color: '#64748b', margin: '2px 0' }}>
                    និង (和 / AND)
                  </div>
                  <div>
                    <strong style={{ fontFamily: 'Khmer OS Muol Light, Moul, serif' }}>
                      កម្មករនិយោជិតឈ្មោះ {formData.employeeNameKh} ({formData.employeeNameEn}) (ហៅកាត់ថា ភាគី ខ)
                    </strong>{' '}
                    / 员工 叫方 (B)
                  </div>
                </div>

                {/* Employee Table with Photo placeholder */}
                <div style={{ display: 'flex', gap: '10px', alignItems: 'stretch', marginBottom: '10px' }}>
                  <table className="iso-table" style={{ flex: 1, margin: 0 }}>
                    <tbody>
                      <tr>
                        <td style={{ width: '40%' }}>
                          <strong>ឈ្មោះ / 名字 :</strong> {formData.employeeNameKh} ({formData.employeeNameEn})
                        </td>
                        <td style={{ width: '30%' }}>
                          <strong>ភេទ / 性别 :</strong> {formData.genderKh} ({formData.genderZh})
                        </td>
                        <td style={{ width: '30%' }}>
                          <strong>អាយុ / 年龄 :</strong> {formData.age} ឆ្នាំ/岁
                        </td>
                      </tr>
                      <tr>
                        <td>
                          <strong>ថ្ងៃខែឆ្នាំកំណើត / 出生日期 :</strong> {formData.dob}
                        </td>
                        <td>
                          <strong>កម្រិតវប្បធម៌ / 教育程度 :</strong> {formData.education}
                        </td>
                        <td>
                          <strong>មុខតំណែង / 职位 :</strong> <span style={{ color: '#0284c7', fontWeight: 700 }}>{formData.position}</span>
                        </td>
                      </tr>

                      {formData.isForeigner ? (
                        <>
                          <tr>
                            <td>
                              <strong>សញ្ជាតិ / 國籍 :</strong> {formData.nationality || 'Chinese / 中国'}
                            </td>
                            <td colSpan={2}>
                              <strong>លេខលិខិតឆ្លងដែន / 护照号码 :</strong> {formData.passportNo || 'E12345678'} (Exp: {formData.passportExpiry || '2028'})
                            </td>
                          </tr>
                          <tr>
                            <td>
                              <strong>ទិដ្ឋាការ / 签证 Visa E :</strong> {formData.visaNo || 'CB-2026-99'}
                            </td>
                            <td colSpan={2}>
                              <strong>ប័ណ្ណការងារ / 劳工证 Work Permit :</strong> {formData.workPermitNo || 'WP-MLVT-2026-088'} (Exp: {formData.workPermitExpiry || '2027'})
                            </td>
                          </tr>
                        </>
                      ) : (
                        <tr>
                          <td>
                            <strong>អត្តសញ្ញាណប័ណ្ណ / 身份证号码 :</strong> {formData.nationalId}
                          </td>
                          <td colSpan={2}>
                            <strong>លេខកាត ប.ស.ស / NSSF 号码 :</strong> {formData.nssfNo || 'N/A'}
                          </td>
                        </tr>
                      )}

                      <tr>
                        <td>
                          <strong>ថ្ងៃចូលធ្វើការ / 进厂日期 :</strong> {formData.joinDate}
                        </td>
                        <td colSpan={2}>
                          <strong>អត្តលេខ / 工号 :</strong> <span style={{ color: '#1e3a8a', fontWeight: 700 }}>{formData.employeeId}</span>
                        </td>
                      </tr>
                      <tr>
                        <td colSpan={3}>
                          <strong>អាសយដ្ឋានបច្ចុប្បន្ន / 现住地址 :</strong> {formData.address}
                        </td>
                      </tr>
                    </tbody>
                  </table>

                  {/* 4x6 Photo Box */}
                  <div
                    style={{
                      width: '85px',
                      border: '1px dashed #94a3b8',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      background: '#f8fafc',
                      color: '#94a3b8',
                      fontSize: '0.72rem',
                      textAlign: 'center',
                      padding: '4px',
                    }}
                  >
                    <span>រូបថត 4x6</span>
                    <span>Photo</span>
                    <span>照片</span>
                  </div>
                </div>

                {/* ISO Preamble */}
                <div style={{ textAlign: 'center', margin: '8px 0 6px 0' }}>
                  <div style={{ fontFamily: 'Khmer OS Muol Light, Moul, serif', fontSize: '0.88rem' }}>
                    ភាគីទាំងពីរបានព្រមព្រៀងគ្នាក្នុងកិច្ចសន្យាការងារដូចខាងក្រោម ៖
                  </div>
                  <div style={{ fontSize: '0.8rem', color: '#1e3a8a', fontWeight: 700 }}>
                    双方同意聘用合同如下：
                  </div>
                </div>
                <div className="iso-clause-kh">{currentConfig.preambleKh}</div>
                {(isBilingualZh || isTrilingual) && <div className="iso-clause-zh">{currentConfig.preambleZh}</div>}

                {/* Article 1: Dynamic Contract Duration */}
                <div className="iso-article-title">១- {currentConfig.art1TitleKh}</div>
                <div className="iso-article-zh">
                  1、{currentConfig.art1TitleZh}
                  {isTrilingual && <span style={{ color: '#64748b', fontStyle: 'italic', marginLeft: '6px' }}>({currentConfig.art1TitleEn})</span>}
                </div>

                {contractType === 'PROBATION' && (
                  <>
                    <div className="iso-clause-kh">
                      ថិរវេលានៃកិច្ចសន្យាសាកល្បងមានរយៈពេល {formData.probationDurationMonths || 2} ខែ ចាប់ពីថ្ងៃទី {formData.startDate} ដល់ថ្ងៃទី {formData.endDate}។ រយៈពេលសាកល្បងនេះត្រូវអនុលោមតាមមាត្រា ៦៨ នៃច្បាប់ស្តីពីការងារ (១ខែសម្រាប់កម្មករមិនជំនាញ, ២ខែសម្រាប់កម្មករជំនាញ, ៣ខែសម្រាប់បុគ្គលិកការិយាល័យ/អ្នកគ្រប់គ្រង)។ អនុលោមតាមមាត្រា ៨២ នៃច្បាប់ស្តីពីការងារ ក្នុងអំឡុងពេលសាកល្បង ភាគីទាំងពីរអាចបញ្ចប់កិច្ចសន្យាបានគ្រប់ពេលវេលាដោយមិនចាំបាច់ជូនដំណឹងជាមុន និងគ្មានសំណងឡើយ។
                    </div>
                    {(isBilingualZh || isTrilingual) && (
                      <div className="iso-clause-zh">
                        试用期合同期限为 {formData.probationDurationMonths || 2} 个月，自 {formData.startDate} 起至 {formData.endDate} 止。试用期严格依照柬埔寨《劳动法》第68条规定执行（非技术工1个月，技术工2个月，管理人员3个月）。依照第82条规定，在试用期间，任何一方均可随时终止合同，无需事先书面通知且不作任何赔偿。
                      </div>
                    )}
                    {isTrilingual && (
                      <div className="iso-clause-en">
                        Probation Period: {formData.probationDurationMonths || 2} months, from {formData.startDate} to {formData.endDate}, pursuant to Article 68 of the Labour Law. Either party may terminate during probation without advance notice or indemnity per Article 82.
                      </div>
                    )}
                  </>
                )}

                {contractType === 'FDC' && (
                  <>
                    <div className="iso-clause-kh">
                      {`កិច្ចសន្យាការងារនេះមានថិរវេលាកំណត់ច្បាស់លាស់ (FDC) ចាប់ពីថ្ងៃទី ${formData.startDate} ដល់ថ្ងៃទី ${formData.endDate} (សរុប ${formData.durationText || '១ ឆ្នាំ'})។ កិច្ចសន្យានេះត្រូវអនុលោមតាមមាត្រា ៦៧ និង ៧៣ នៃច្បាប់ស្តីពីការងារ និងសេចក្តីណែនាំលេខ ០៥០/១៩ របស់ក្រសួងការងារ។ ក្នុងករណីភាគីណាមួយមិនមានបំណងបន្តកិច្ចសន្យាថ្មី ត្រូវជូនដំណឹងជាលាយលក្ខណ៍អក្សរជាមុនស្របតាមមាត្រា ៧៣ (៥ថ្ងៃ សម្រាប់កិច្ចសន្យា ≤ ៦ខែ, ១០ថ្ងៃ សម្រាប់កិច្ចសន្យា > ៦ខែ ដល់ ១ឆ្នាំ, និង ១៥ថ្ងៃ សម្រាប់កិច្ចសន្យា > ១ឆ្នាំ ដល់ ២ឆ្នាំ)។`}
                    </div>
                    {(isBilingualZh || isTrilingual) && (
                      <div className="iso-clause-zh">
                        {`本合同为固定期限劳动合同（FDC），自 ${formData.startDate} 起至 ${formData.endDate} 止（共计 ${formData.durationText || '1年'}）。严格依照柬埔寨《劳动法》第67条、第73条及劳工部第050/19号指导通告执行。任何一方若不拟续签新合同，须依照第73条提前书面通知（合同≤6个月提前5天；合同>6个月至1年提前10天；合同>1年至2年提前15天）。`}
                      </div>
                    )}
                    {isTrilingual && (
                      <div className="iso-clause-en">
                        {`Fixed Duration Contract (FDC) from ${formData.startDate} to ${formData.endDate} (duration: ${formData.durationText || '1 Year'}), pursuant to Articles 67 & 73 of Labour Law. Prior notice of non-renewal: 5 days (<= 6m), 10 days (> 6m to 1y), 15 days (> 1y to 2y).`}
                      </div>
                    )}
                  </>
                )}

                {contractType === 'UDC' && (
                  <>
                    <div className="iso-clause-kh">
                      កិច្ចសន្យាការងារនេះជាប្រភេទកិច្ចសន្យាមានថិរវេលាមិនកំណត់ (UDC) ចាប់ផ្តើមអនុវត្តពីថ្ងៃទី {formData.startDate} ដោយគ្មានកាលបរិច្ឆេទបញ្ចប់ឡើយ។ កិច្ចសន្យានេះបន្តមានសុពលភាពជាប់ជាប្រចាំ រហូតដល់ត្រូវបានបញ្ចប់ស្របតាមនីតិវិធីច្បាប់ការងារនៃព្រះរាជាណាចក្រកម្ពុជា មាត្រា ៦៧, ៧៤, ៧៥ និងមាត្រា ៨៩ ថ្មី។
                    </div>
                    {(isBilingualZh || isTrilingual) && (
                      <div className="iso-clause-zh">
                        本合同为无固定期限劳动合同（UDC），自 {formData.startDate} 起正式生效，无明确终止日期。除非双方依法予以解除或终止，本合同长期持续有效，严格依照柬埔寨《劳动法》第67条、第74条、第75条及新第89条规定执行。
                      </div>
                    )}
                    {isTrilingual && (
                      <div className="iso-clause-en">
                        Undetermined Duration Contract (UDC) effective from {formData.startDate} without fixed end date, continuously valid until lawfully terminated pursuant to Articles 67, 74, 75, and New Article 89.
                      </div>
                    )}
                  </>
                )}

                {contractType === 'FOREIGN_FDC' && (
                  <>
                    <div className="iso-clause-kh">
                      កិច្ចសន្យាការងារសម្រាប់បុគ្គលិកជនបរទេសនេះ មានថិរវេលាកំណត់ចាប់ពីថ្ងៃទី {formData.startDate} ដល់ថ្ងៃទី {formData.endDate} ស្របតាមសុពលភាពនៃប័ណ្ណការងារជនបរទេស (Work Permit) និងទិដ្ឋាការការងារ (Visa E) របស់ព្រះរាជាណាចក្រកម្ពុជា។ កិច្ចសន្យានេះអាចបន្តបានលុះត្រាតែមានការព្រមព្រៀងជាលាយលក្ខណ៍អក្សរពីភាគីទាំងពីរ និងការអនុម័តបន្តប័ណ្ណការងារស្របច្បាប់ពីក្រសួងការងារ និងបណ្តុះបណ្តាលវិជ្ជាជីវៈ (MLVT/FWCMS)។
                    </div>
                    {(isBilingualZh || isTrilingual) && (
                      <div className="iso-clause-zh">
                        本外籍员工劳动合同为固定期限合同，自 {formData.startDate} 起至 {formData.endDate} 止，与乙方的柬埔寨王国合法商务签证（Visa E）及外籍劳工证（Work Permit）有效期相匹配。双方经协商一致并依法向柬埔寨劳工部（FWCMS）成功续办外籍劳工证后，方可签署续签协议。
                      </div>
                    )}
                    {isTrilingual && (
                      <div className="iso-clause-en">
                        Fixed Duration Contract for Foreign Employee effective from {formData.startDate} to {formData.endDate}, aligned with Cambodian Visa E and MLVT Work Permit. Renewal requires mutual agreement and official FWCMS renewal.
                      </div>
                    )}
                  </>
                )}

                {/* Article 2: Working Hours Intro */}
                <div className="iso-article-title">២- ម៉ោងធ្វើការ និងការឈប់សម្រាកប្រចាំឆ្នាំ</div>
                <div className="iso-article-zh">
                  2、工作时间和带薪休假
                  {isTrilingual && <span style={{ color: '#64748b', fontStyle: 'italic', marginLeft: '6px' }}>(WORKING HOURS & LEAVE)</span>}
                </div>
                <div className="iso-clause-kh">
                  ក/- ម៉ោងធ្វើការត្រូវអនុវត្តតាមបទបញ្ជាផ្ទៃក្នុងរបស់រោងចក្រ/ក្រុមហ៊ុន។{'\n'}
                  ខ/- គណៈគ្រប់គ្រងមានសិទ្ធិចាត់ចែង និងគ្រប់គ្រងម៉ោងធ្វើការស្របតាមមុខងារ និងវេនការងារជាក់ស្តែង។
                </div>
                {(isBilingualZh || isTrilingual) && (
                  <div className="iso-clause-zh">
                    A/- 工作时间遵循公司内部规章制度。{'\n'}
                    B/- 管理层有权根据职能和工作班次来管理工作时间。
                  </div>
                )}
                {isTrilingual && (
                  <div className="iso-clause-en">
                    A/- Working hours comply with factory internal regulations.{'\n'}
                    B/- Management reserves the right to manage working hours based on operational functions and shifts.
                  </div>
                )}
              </div>

              {/* ======================================================== */}
              {/* PAGE 2: WORKING HOURS CONT., WAGES, RULES, LEAVE */}
              {/* ======================================================== */}
              <div className="iso-page">
                {renderIsoHeader(2)}

                <div className="iso-clause-kh">
                  គ/- គណៈគ្រប់គ្រងមានសិទ្ធិកែប្រែម៉ោងធ្វើការ ឬម៉ោងទទួលទានអាហារ ដរាបណាម៉ោងធ្វើការធម្មតាមិនលើសពី ៨ ម៉ោងក្នុងមួយថ្ងៃ (ឬ ៤៨ ម៉ោងក្នុងមួយសប្តាហ៍) អនុលោមតាមមាត្រា ១៣៧ នៃច្បាប់ស្តីពីការងារ។{'\n'}
                  ឃ/- ក្រុមហ៊ុនផ្តល់ជូនកម្មករនិយោជិតនូវថ្ងៃឈប់សម្រាកបុណ្យជាតិដែលមានប្រាក់ឈ្នួល ៖{'\n'}
                  • ថ្ងៃឈប់បុណ្យជាតិ ៖ គោរពតាមសេចក្តីប្រកាសប្រចាំឆ្នាំរបស់ក្រសួងការងារ និងបណ្តុះបណ្តាលវិជ្ជាជីវៈ។{'\n'}
                  • ច្បាប់ឈឺ ៖ អនុវត្តតាមច្បាប់ការងារ និងបទបញ្ជាផ្ទៃក្នុង (ត្រូវភ្ជាប់វិញ្ញាបនបត្រពេទ្យស្របច្បាប់)។{'\n'}
                  • គ្រោះថ្នាក់ការងារ ៖ ធានារ៉ាប់រងដោយរបបសន្តិសុខសង្គម ប.ស.ស. (NSSF)។{'\n'}
                  • ច្បាប់ពិសេសក្នុងគ្រួសារ ៖ យោងមាត្រា ១៦៩ នៃច្បាប់ការងារ (អាពាហ៍ពិពាហ៍, បុណ្យសព, សម្រាលកូន)។
                </div>
                {(isBilingualZh || isTrilingual) && (
                  <div className="iso-clause-zh">
                    C/- 管理层有权更改工作时间或用餐时间，只要正常工作时间为每日不超过八小时（每周不超过48小时），依照《劳动法》第137条。{'\n'}
                    D/- 公司为所有员工提供带薪公共假期：{'\n'}
                    • 假期：遵循劳工部年度法定假日通告。{'\n'}
                    • 病假：遵循劳工部及厂规（须提供合法医院诊断证明）。{'\n'}
                    • 工伤事故：遵循劳工部并依法享受国家社保局（NSSF）工伤待遇。{'\n'}
                    • 特假：遵守劳工部第169条规定（婚丧礼节假、产假等）。
                  </div>
                )}
                {isTrilingual && (
                  <div className="iso-clause-en">
                    C/- Management may adjust working/meal schedules within statutory limits of 8h/day (48h/week) pursuant to Article 137.{'\n'}
                    D/- Paid holidays adhere to MLVT annual Prakas, certified sick leave, NSSF coverage, and special family leave pursuant to Article 169.
                  </div>
                )}

                {/* Article 3: Wages & Benefits (Dynamic Severance/Seniority) */}
                <div className="iso-article-title">៣- ប្រាក់ឈ្នួល ប្រាក់រង្វាន់ និងអត្ថប្រយោជន៍ផ្សេងៗ</div>
                <div className="iso-article-zh">
                  3、工资、奖金和其他福利
                  {isTrilingual && <span style={{ color: '#64748b', fontStyle: 'italic', marginLeft: '6px' }}>(WAGES, BONUSES & BENEFITS)</span>}
                </div>
                <div className="iso-clause-kh">
                  • ប្រាក់ឈ្នួលត្រូវបានគណនាផ្អែកលើចំនួនថ្ងៃធ្វើការជាក់ស្តែងរបស់កម្មករនិយោជិត។{'\n'}
                  • ក្រុមហ៊ុនផ្តល់ប្រាក់ឈ្នួលគោលប្រចាំខែចំនួន <strong>${formData.basicSalaryUsd || 208}</strong> ដុល្លារអាមេរិក (មិនទាបជាងកម្រិតប្រាក់ឈ្នួលអប្បបរមាប្រចាំឆ្នាំដែលប្រកាសដោយក្រសួងការងារឡើយ)។{'\n'}
                  • ក្នុងករណីក្រុមហ៊ុនមានការងារបន្ទាន់ ក្រុមហ៊ុនអាចស្នើសុំកម្មករនិយោជិតធ្វើការបន្ថែមម៉ោង (ដោយស្ម័គ្រចិត្ត) ៖{'\n'}
                  - ការងារបន្ថែមម៉ោងធម្មតា ត្រូវបានគិតប្រាក់ស្មើ ១.៥ ដង (១៥០%) នៃប្រាក់ឈ្នួលម៉ោងធម្មតា អនុលោមតាមមាត្រា ១៣៩ នៃច្បាប់ស្តីពីការងារ។{'\n'}
                  - ការងារបន្ថែមម៉ោងនៅថ្ងៃឈប់បុណ្យជាតិ ឬថ្ងៃអាទិត្យ ត្រូវបានគិតស្មើ ២.០ ដង (២០០%) នៃប្រាក់ឈ្នួលធម្មតា។
                  {contractType === 'FDC' && (
                    <>
                      {'\n'}• <strong>ប្រាក់បំណាច់បញ្ចប់កិច្ចសន្យា ៥% (Severance 5%)</strong> ៖ នៅពេលកិច្ចសន្យា FDC នេះផុតកំណត់ដោយបរិបូណ៌ កម្មករនិយោជិតមានសិទ្ធិទទួលបានប្រាក់បំណាច់បញ្ចប់កិច្ចសន្យាចំនួន ៥% នៃប្រាក់ឈ្នួលសរុបដែលបានបើកជូនក្នុងអំឡុងពេលនៃកិច្ចសន្យា ស្របតាមមាត្រា ៧៣ នៃច្បាប់ស្តីពីការងារ។
                    </>
                  )}
                  {contractType === 'UDC' && (
                    <>
                      {'\n'}• <strong>ប្រាក់បំណាច់អតីតភាពការងារ (Seniority Indemnity)</strong> ៖ កម្មករនិយោជិតមានសិទ្ធិទទួលបានប្រាក់បំណាច់អតីតភាពការងារចំនួន ១៥ ថ្ងៃក្នុងមួយឆ្នាំ ដោយត្រូវចែកបើកជា ២ លើក (៧.៥ ថ្ងៃក្នុងខែមិថុនា និង ៧.៥ ថ្ងៃក្នុងខែធ្នូ) ស្របតាមមាត្រា ៨៩ ថ្មី នៃច្បាប់ការងារ និងប្រកាសលេខ ៤៤២/១៨។
                    </>
                  )}
                  {contractType === 'FOREIGN_FDC' && (
                    <>
                      {'\n'}• <strong>ពន្ធលើប្រាក់បៀវត្ស (Tax on Salary)</strong> ៖ ប្រាក់ឈ្នួលត្រូវបានគណនាជា USD។ និយោជិតត្រូវស្ថិតនៅក្រោមកាតព្វកិច្ចពន្ធកាត់ទុកលើប្រាក់បៀវត្សស្របតាមច្បាប់សារពើពន្ធកម្ពុជា។ ក្រុមហ៊ុនទទួលបន្ទុកកាត់ពន្ធ និងបង់ជូនអគ្គនាយកដ្ឋានពន្ធដារ។
                    </>
                  )}
                </div>

                {(isBilingualZh || isTrilingual) && (
                  <div className="iso-clause-zh">
                    • 工资是根据员工实际出勤天数计算的。{'\n'}
                    • 公司给每月的法定基本工资为 <strong>${formData.basicSalaryUsd || 208}</strong> 美元（本公司以劳工部公布的年度最低工资为准，绝不低于法定底线）。{'\n'}
                    • 如果公司有紧急生产任务，公司会要求工人加班（自愿原则）：{'\n'}
                    - 平时定期加班等于每小时工资的 1.5 倍（150%），或根据《劳动法》第139条。{'\n'}
                    - 节假日/周日加班：遵循劳工部规定发放（100%+100% = 200%）。
                    {contractType === 'FDC' && (
                      <>
                        {'\n'}• <strong>5% 期满遣散补偿金（Severance 5%）</strong>：固定期限合同期满正常终止时，乙方依法享有相当于合同期内已发全部工资总额 5% 的遣散补偿金，依照《劳动法》第73条。
                      </>
                    )}
                    {contractType === 'UDC' && (
                      <>
                        {'\n'}• <strong>工龄年资补偿金（Seniority Indemnity）</strong>：乙方每年享有15天工资的工龄年资补偿，分两次全额发放（6月份7.5天，12月份7.5天），严格依照《劳动法》新第89条及第442/18号令。
                      </>
                    )}
                    {contractType === 'FOREIGN_FDC' && (
                      <>
                        {'\n'}• <strong>薪酬个税代扣</strong>：薪资以美元（USD）核算。乙方须依法承担柬埔寨王国个人薪酬所得税（Tax on Salary），由甲方依法代扣代缴。
                      </>
                    )}
                  </div>
                )}

                {/* Article 4: Work Rules & ISO Quality */}
                <div className="iso-article-title">៤- វិន័យការងារ គុណភាព និងសុវត្ថិភាពការងារ (ISO 9001:2015)</div>
                <div className="iso-article-zh">
                  4、遵守工厂规章、质量保证与作业安全
                  {isTrilingual && <span style={{ color: '#64748b', fontStyle: 'italic', marginLeft: '6px' }}>(FACTORY RULES & ISO QUALITY)</span>}
                </div>
                <div className="iso-clause-kh">
                  កម្មករនិយោជិតត្រូវគោរពបទបញ្ជាផ្ទៃក្នុងរបស់រោងចក្រ គោរពការគ្រប់គ្រងរបស់ប្រធានផ្នែក គោរពការចាត់តាំងការងារ និងការផ្លាស់ប្តូរផ្នែក ក្រុម ឬមុខតំណែង ស្តាប់តាមការណែនាំរបស់អ្នកគ្រប់គ្រង និងធានាគុណភាព បរិមាណការងារប្រកបដោយសុវត្ថិភាព ទាន់ពេលវេលា និងកាត់បន្ថយការខូចខាត (Zero Defect) ស្របតាមគោលនយោបាយគុណភាព ISO 9001:2015 របស់រោងចក្រ។
                </div>
                {(isBilingualZh || isTrilingual) && (
                  <div className="iso-clause-zh">
                    员工必须严格遵守工厂的规章制度，尊重主管的管理，服从调动部门、班组或岗位的安排，听从主管的正当指示，严格执行作业指导书（SOP），及时、安全地保证产品质量和产量，追求零缺陷，贯彻执行 ISO 9001:2015 质量方针。
                  </div>
                )}

                {/* Article 5: Leave */}
                <div className="iso-article-title">៥- ការសុំច្បាប់អនុញ្ញាត និងការឈប់គ្មានច្បាប់</div>
                <div className="iso-article-zh">
                  5、授权/未经授权请假
                  {isTrilingual && <span style={{ color: '#64748b', fontStyle: 'italic', marginLeft: '6px' }}>(LEAVE REGULATIONS)</span>}
                </div>
                <div className="iso-clause-kh">
                  កម្មករនិយោជិតដែលមានធុរៈផ្ទាល់ខ្លួនមិនអាចមកបំពេញការងារបាន ត្រូវបំពេញពាក្យសុំច្បាប់ជាលាយលក្ខណ៍អក្សរយ៉ាងហោចណាស់ ១ ថ្ងៃមុន ទៅកាន់ថ្នាក់គ្រប់គ្រង។ ក្នុងករណីមានជំងឺធ្ងន់ធ្ងរ ឬការសង្គ្រោះបន្ទាន់ និយោជិតអាចជូនដំណឹងតាមរយៈតំណាង ឬតាមទូរស័ព្ទ ប៉ុន្តែត្រូវបញ្ជូនលិខិតសុំច្បាប់មកក្រុមហ៊ុនក្នុងរយៈពេលយ៉ាងយូរ ២ ថ្ងៃបន្ទាប់ពីថ្ងៃចាប់ផ្តើមឈប់។ ប្រសិនបើឈឺ និយោជិតត្រូវមានវិញ្ញាបនបត្រត្រឹមត្រូវពីគ្រូពេទ្យ។ ការឈប់សម្រាកដោយគ្មានការអនុញ្ញាត និងគ្មានលិខិតបញ្ជាក់ច្បាស់លាស់ ត្រូវចាត់ទុកជាអវត្តមានឥតច្បាប់។
                </div>
                {(isBilingualZh || isTrilingual) && (
                  <div className="iso-clause-zh">
                    员工如果有个人事务而无法到岗，必须至少提前一天向管理层填写书面请假申请表。如遇重病/紧急需要，员工可透过代表申请休假或电话通知主管，但必须在请假后两天内提交书面请假单。如果生病，员工必须向公司提交正规医院开具的有效病假证明。未事先告知且无法提供有效证明的，一律按旷工处理。
                  </div>
                )}
              </div>

              {/* ======================================================== */}
              {/* PAGE 3: ABSENTEEISM, DISCIPLINE, BONUSES, PROHIBITIONS */}
              {/* ======================================================== */}
              <div className="iso-page">
                {renderIsoHeader(3)}

                {/* Article 6: Absenteeism */}
                <div className="iso-article-title">៦- ការចាត់វិធានការចំពោះអវត្តមានឥតច្បាប់</div>
                <div className="iso-article-zh">
                  6、旷工处理
                  {isTrilingual && <span style={{ color: '#64748b', fontStyle: 'italic', marginLeft: '6px' }}>(ABSENTEEISM PENALTIES)</span>}
                </div>
                <div className="iso-clause-kh">
                  • អវត្តមានឥតច្បាប់តិចជាង ២ ថ្ងៃ ៖ ត្រូវចាត់ទុកជាកំហុសស្រាល (អប់រំណែនាំ និងកត់ត្រា)។{'\n'}
                  • អវត្តមានឥតច្បាប់ពី ២ ថ្ងៃ ដល់ ៥ ថ្ងៃ ៖ ត្រូវចាត់ទុកជាកំហុសមធ្យម (ទទួលលិខិតព្រមាន)។{'\n'}
                  • អវត្តមានឥតច្បាប់ចាប់ពី ៦ ថ្ងៃក្នុងមួយខែឡើងទៅ ៖ ត្រូវចាត់ទុកជាការបោះបង់ការងារ ដែលជាកំហុសធ្ងន់ធ្ងរ និងនាំឱ្យមានការបញ្ចប់កិច្ចសន្យាការងារភ្លាមៗដោយគ្មានសំណង ស្របតាមមាត្រា ៨៣ និង ៨៤ នៃច្បាប់ស្តីពីការងារ។
                </div>
                {(isBilingualZh || isTrilingual) && (
                  <div className="iso-clause-zh">
                    • 旷工不到 2 天，将被视为轻微过失（口头批评教育并记入档案）。{'\n'}
                    • 旷工从 2 天到 5 天，视为中度违纪（给予正式书面警告）。{'\n'}
                    • 旷工从每月 6 天起，直接被视为自动放弃工作，构成严重违纪违法行为，公司将予以立即开除并不作任何补偿，依照《劳动法》第83条及84条。
                  </div>
                )}

                {/* Article 7: Disciplinary */}
                <div className="iso-article-title">៧- នីតិវិធីនៃវិធានការវិន័យ</div>
                <div className="iso-article-zh">
                  7、纪律处分程序
                  {isTrilingual && <span style={{ color: '#64748b', fontStyle: 'italic', marginLeft: '6px' }}>(DISCIPLINARY PROCEDURES)</span>}
                </div>
                <div className="iso-clause-kh">
                  • កំហុសស្រាល ៖ លើកទី១ អប់រំណែនាំផ្ទាល់មាត់ និងកត់ត្រាក្នុងសំណុំរឿងបុគ្គលិក។ ប្រសិនបើប្រព្រឹត្តកំហុសដដែលលើកទី២ នឹងទទួលការព្រមានជាលាយលក្ខណ៍អក្សរលើកទី១។ ប្រសិនបើនៅតែបន្តប្រព្រឹត្តទៀត នឹងទទួលការព្រមានជាលាយលក្ខណ៍អក្សរលើកទី២។ ប្រសិនបើមិនកែប្រែទេ នឹងឈានដល់ការបញ្ចប់កិច្ចសន្យាការងារ។{'\n'}
                  • កំហុសមធ្យម ៖ លើកទី១ ទទួលលិខិតព្រមានជាលាយលក្ខណ៍អក្សរលើកទី១។ ប្រសិនបើប្រព្រឹត្តកំហុសលើកទី២ នឹងទទួលលិខិតព្រមានលើកទី២។ ប្រសិនបើមិនកែប្រែទេ នឹងត្រូវបញ្ឈប់ពីការងារ។{'\n'}
                  • កំហុសធ្ងន់ធ្ងរ ៖ អនុវត្តតាមមាត្រា ៨៣ នៃច្បាប់ស្តីពីការងារ ក្រុមហ៊ុនមានសិទ្ធិបញ្ឈប់ពីការងារជាបន្ទាន់ដោយគ្មានសំណងអ្វីទាំងអស់។{'\n'}
                  • សុពលភាពលិខិតព្រមាន ៖ រាល់លិខិតព្រមានទាំងអស់មានសុពលភាពត្រឹម ១២ ខែ។ ក្រោយរយៈពេល ១២ ខែ លិខិតព្រមានចាស់នឹងត្រូវបានលុបចោល មិនយកមកគិតក្នុងវដ្តការងារបន្ទាប់ឡើយ។
                </div>
                {(isBilingualZh || isTrilingual) && (
                  <div className="iso-clause-zh">
                    • 轻微错误：首次犯规口头教育并记入个人档案；若第二次犯同样错误，发出第一次书面警告；再次犯错发出第二次书面警告；拒不改正者将导致终止雇佣关系。{'\n'}
                    • 中度违纪：第一时间发出第一封书面警告信并载入档案；若犯第二次同类违纪，发出第二次书面警告；不悔改者终止劳动合同。{'\n'}
                    • 严重违纪：依照《劳动法》第83条规定，公司将依法直接开除并终止劳动关系，不予支付任何解雇补偿金。{'\n'}
                    • 警告信有效期限：满12个月后，之前的违纪警告记录归零，本公司不会将过往警告带入下一个服务年度。
                  </div>
                )}

                {/* Article 8, 9, 10: Allowances */}
                <div className="iso-article-title">៨-៩-១០- ប្រាក់រង្វាន់ឧស្សាហ៍ព្យាយាម ប្រាក់ថ្លៃធ្វើដំណើរ និងថ្លៃបាយ</div>
                <div className="iso-article-zh">
                  8-9-10、全勤奖、交通住宿与午餐津贴
                  {isTrilingual && <span style={{ color: '#64748b', fontStyle: 'italic', marginLeft: '6px' }}>(ALLOWANCES & BONUSES)</span>}
                </div>
                <div className="iso-clause-kh">
                  ៨- ប្រាក់រង្វាន់ឧស្សាហ៍ព្យាយាម (Attendance Bonus) ៖ បុគ្គលិកដែលមកបំពេញការងារទៀងទាត់ពេញមួយខែ មិនដែលអវត្តមាន និងមិនយឺតយ៉ាវលើសពី ៣០ នាទី នឹងទទួលបានប្រាក់រង្វាន់ចំនួន <strong>${formData.attendanceBonusUsd || 15}</strong> ដុល្លារ/ខែ។{'\n'}
                  ៩- ប្រាក់ថ្លៃធ្វើដំណើរ និងស្នាក់នៅ (Transport & Housing) ៖ ក្រុមហ៊ុនផ្តល់ជូនចំនួន <strong>${formData.transportAllowanceUsd || 9.5}</strong> ដុល្លារ/ខែ ស្របតាមប្រកាសរបស់ក្រសួងការងារ។{'\n'}
                  ១០- ប្រាក់ថ្លៃបាយ/អាហារថ្ងៃត្រង់ (Meal Allowance) ៖ សម្រាប់ការងារលើសពី ៥ ម៉ោង ឬការងារបន្ថែមម៉ោង ផ្តល់ជូន <strong>{formData.mealAllowanceRiel || 2000}</strong> រៀល/ថ្ងៃ។
                </div>
                {(isBilingualZh || isTrilingual) && (
                  <div className="iso-clause-zh">
                    8- 全勤奖：每月全勤出勤、无矿工且迟到/早退累计少于30分钟者，每月全额发放 <strong>${formData.attendanceBonusUsd || 15}</strong> 美元全勤奖。{'\n'}
                    9- 交通与住宿津贴：依照劳工部规定，公司每月发放 <strong>${formData.transportAllowanceUsd || 9.5}</strong> 美元交通住宿补贴。{'\n'}
                    10- 膳食补助：正常工作时间满5小时或安排加班时，公司提供每日 <strong>{formData.mealAllowanceRiel || 2000}</strong> 瑞尔午餐补贴。
                  </div>
                )}

                {/* Article 11: Prohibitions */}
                <div className="iso-article-title">១១- ការហាមឃាត់ដាច់ខាតក្នុងរោងចក្រ</div>
                <div className="iso-article-zh">
                  11、严禁赌博、饮酒、吸毒及违禁品
                  {isTrilingual && <span style={{ color: '#64748b', fontStyle: 'italic', marginLeft: '6px' }}>(STRICT PROHIBITIONS)</span>}
                </div>
                <div className="iso-clause-kh">
                  ហាមឃាត់ដាច់ខាតនូវការលេងល្បែងស៊ីសង សេពគ្រឿងស្រវឹង គ្រឿងញៀន ឬការយកអាវុធ វត្ថុងាយឆេះ និងជាតិផ្ទុះចូលក្នុងបរិវេណរោងចក្រ។ ក្រុមហ៊ុនមានសិទ្ធិបញ្ឈប់ពីការងារជាបន្ទាន់ដោយគ្មានសំណងអ្វីទាំងអស់ ហើយចំពោះករណីធ្ងន់ធ្ងរ នឹងត្រូវបញ្ជូនទៅអាជ្ញាធរមានសមត្ថកិច្ចចាត់ការតាមផ្លូវច្បាប់។
                </div>
                {(isBilingualZh || isTrilingual) && (
                  <div className="iso-clause-zh">
                    厂区内绝对严禁参与任何赌博游戏、饮酒、吸毒、斗殴或携带武器、易燃易爆危险物品进入厂区。一经发现，公司有权立即开除并不作任何经济赔偿；情节严重触犯法律者，依法移送司法机关处理。
                  </div>
                )}
              </div>

              {/* ======================================================== */}
              {/* PAGE 4: TERMINATION, SIGNATURES & ISO APPROVAL MATRIX */}
              {/* ======================================================== */}
              <div className="iso-page">
                {renderIsoHeader(4)}

                {/* Article 12: Termination (Dynamic) */}
                <div className="iso-article-title">១២- ការរំលាយ និងការបញ្ចប់កិច្ចសន្យាការងារ</div>
                <div className="iso-article-zh">
                  12、合同解除和终止
                  {isTrilingual && <span style={{ color: '#64748b', fontStyle: 'italic', marginLeft: '6px' }}>(CONTRACT TERMINATION)</span>}
                </div>
                <div className="iso-clause-kh">
                  ក្រុមហ៊ុនមានសិទ្ធិបញ្ចប់កិច្ចសន្យាការងារភ្លាមៗដោយគ្មានសំណង និងគ្មានការជូនដំណឹងជាមុន ក្នុងករណី ៖{'\n'}
                  • ភាគី ខ ប្រមូលផ្តុំបង្កចលាចល ដឹកនាំ ឬញុះញង់កម្មករឱ្យធ្វើកូដកម្មខុសច្បាប់ដោយគ្មានការអនុញ្ញាតតាមនីតិវិធីច្បាប់។{'\n'}
                  • ភាគី ខ មានការធ្វេសប្រហែសធ្ងន់ធ្ងរលើការងារ កេងបន្លំ ក្លែងបន្លំ ឬលួចទ្រព្យសម្បត្តិក្រុមហ៊ុន ឬបំផ្លាញគុណភាពទំនិញដោយចេតនា។{'\n'}
                  • ភាគី ខ បំពានយ៉ាងធ្ងន់ធ្ងរលើបទបញ្ជាផ្ទៃក្នុង និងវិធានសុវត្ថិភាពការងាររបស់រោងចក្រ។{'\n'}
                  {contractType === 'PROBATION' && '• កិច្ចសន្យាសាកល្បងនេះនឹងត្រូវបញ្ចប់នៅពេលផុតកំណត់ ឬនៅពេលភាគីណាមួយសម្រេចបញ្ចប់ក្នុងអំឡុងពេលសាកល្បង ស្របតាមមាត្រា ៨២ នៃច្បាប់ការងារ ដោយមិនបាច់ជូនដំណឹងជាមុន និងគ្មានសំណងឡើយ។'}
                  {contractType === 'FDC' && '• ការបញ្ចប់កិច្ចសន្យា FDC មុនកាលកំណត់ដោយគ្មានមូលហេតុត្រឹមត្រូវ ភាគីដែលបញ្ចប់ត្រូវសងការខូចខាតស្មើនឹងប្រាក់ឈ្នួលដែលនៅសល់រហូតដល់កាលបរិច្ឆេទផុតកំណត់នៃកិច្ចសន្យា (មាត្រា ៧៣)។ លើកលែងតែកំហុសធ្ងន់ធ្ងរ (មាត្រា ៨៣) ឬប្រធានសក្តិ។'}
                  {contractType === 'UDC' && '• ការបញ្ចប់កិច្ចសន្យា UDC ត្រូវជូនដំណឹងជាមុនជាលាយលក្ខណ៍អក្សរស្របតាមមាត្រា ៧៥ (៧ថ្ងៃ សម្រាប់ <៦ខែ; ១៥ថ្ងៃ សម្រាប់ ៦ខែ-១ឆ្នាំ; ១ខែ សម្រាប់ ១-២ឆ្នាំ; ២ខែ សម្រាប់ ២-៥ឆ្នាំ; ៣ខែ សម្រាប់លើសពី ៥ឆ្នាំ)។ ការបញ្ឈប់ដោយនិយោជកត្រូវទូទាត់សំណងជូនដំណឹង និងប្រាក់បំណាច់អតីតភាពដែលនៅសល់ លើកលែងតែកំហុសធ្ងន់ធ្ងរ (មាត្រា ៨៣)។'}
                  {contractType === 'FOREIGN_FDC' && '• កិច្ចសន្យាបុគ្គលិកបរទេសនេះនឹងត្រូវបញ្ចប់ជាបន្ទាន់ក្នុងករណី ៖ (១) ភាគី ខ ត្រូវបានអាជ្ញាធរកម្ពុជាលុបចោល ឬបដិសេធមិនបន្តទិដ្ឋាការ ឬប័ណ្ណការងារ ឬត្រូវបានបញ្ជាឱ្យចាកចេញពីកម្ពុជា; (២) ប្រព្រឹត្តកំហុសវិជ្ជាជីវៈធ្ងន់ធ្ងរតាមមាត្រា ៨៣។ ក្រុមហ៊ុននឹងធ្វើការលុបឈ្មោះប័ណ្ណការងារក្នុងប្រព័ន្ធ FWCMS។'}
                </div>
                {(isBilingualZh || isTrilingual) && (
                  <div className="iso-clause-zh">
                    在下列情形下，公司有权立即解除劳动合同并不支付任何经济补偿：{'\n'}
                    • 乙方聚众闹事，带头或鼓动工人进行无合法理由、未依法提前书面申请的非法罢工。{'\n'}
                    • 乙方严重失职、营私舞弊、盗窃公司财物或故意破坏生产质量与机器设备。{'\n'}
                    • 乙方严重违反甲方规章制度及劳动安全操作规程。{'\n'}
                    {contractType === 'PROBATION' && '• 本试用合同期满或在试用期间任何一方提出终止，依《劳动法》第82条本合同即行终止，无需事先通知且无经济赔偿。'}
                    {contractType === 'FDC' && '• 无正当理由单方提前解除本固定期限合同，须向对方赔偿截至期满应付剩余工资之经济损失（第73条），严重违纪（第83条）或不可抗力除外。'}
                    {contractType === 'UDC' && '• 解除无固定期限合同须按《劳动法》第75条提前书面通知（工龄<6个月提前7天；6个月至1年提前15天；1至2年提前1个月；2至5年提前2个月；5年以上提前3个月）。甲方解雇须结清代通知金及年资补偿，严重违纪除外。'}
                    {contractType === 'FOREIGN_FDC' && '• 外籍员工合同在下列情形下即行解除：(1) 工作签证或外籍劳工证被主管部门吊销、拒绝延期或被限期离境；(2) 严重违纪（第83条）。合同终止后，甲方在劳工部 FWCMS 系统注销劳工证。'}
                  </div>
                )}

                {/* Article 13: Custody */}
                <div className="iso-article-title">១៣- ការអនុវត្ត និងការរក្សាទុកកិច្ចសន្យា</div>
                <div className="iso-article-zh">
                  13、合同一式两份与法律适用
                  {isTrilingual && <span style={{ color: '#64748b', fontStyle: 'italic', marginLeft: '6px' }}>(EXECUTION & GOVERNING LAW)</span>}
                </div>
                <div className="iso-clause-kh">
                  កិច្ចសន្យានេះត្រូវបានធ្វើឡើងជា ២ ច្បាប់ដែលមានតម្លៃគតិយុត្តស្មើគ្នា ១ ច្បាប់រក្សាទុកនៅរោងចក្រ (ភាគី ក) និង ១ ច្បាប់ប្រគល់ជូនកម្មករនិយោជិត (ភាគី ខ)។ ក្រៅពីកិច្ចព្រមព្រៀងនេះ ក្រុមហ៊ុន និងនិយោជិតត្រូវគោរព និងអនុវត្តយ៉ាងម៉ឺងម៉ាត់តាមច្បាប់ស្តីពីការងារនៃព្រះរាជាណាចក្រកម្ពុជា និងបទបញ្ជាផ្ទៃក្នុងរបស់រោងចក្រ។
                </div>
                {(isBilingualZh || isTrilingual) && (
                  <div className="iso-clause-zh">
                    本合同一式两份，具有同等法律效力，一份由工厂（甲方）保管，一份由工人（乙方）妥善保管。除本协议约定外，公司和员工均应严格遵守柬埔寨王国《劳动法》及工厂内部各项法规。
                  </div>
                )}

                {/* Date */}
                <div style={{ textAlign: 'right', margin: '14px 0 10px 0', fontSize: '0.82rem' }}>
                  ធ្វើនៅរាជធានីភ្នំពេញ, ថ្ងៃទី {formData.signedDate} ខែ ............ ឆ្នាំ២០២៦{'\n'}
                  <span style={{ color: '#64748b', fontSize: '0.78rem' }}>于金边市签订，日期：{formData.signedDate}</span>
                </div>

                {/* Signatures & Stamps Table */}
                <table className="iso-table" style={{ margin: '8px 0 16px 0' }}>
                  <tbody>
                    <tr>
                      <td style={{ width: '50%', textAlign: 'center', verticalAlign: 'top', padding: '12px', height: '140px' }}>
                        <div style={{ fontFamily: 'Khmer OS Muol Light, Moul, serif', color: '#0f172a' }}>
                          តំណាងភាគី និយោជក (ភាគី ក)
                        </div>
                        <div style={{ fontSize: '0.78rem', color: '#1e3a8a', fontWeight: 700 }}>
                          甲方（签字与盖章）/ Employer (Signature & Stamp)
                        </div>
                        <div style={{ color: '#94a3b8', fontSize: '0.75rem', marginTop: '45px' }}>
                          (ហត្ថលេខា និងត្រាក្រុមហ៊ុន / Company Stamp)
                        </div>
                        <div style={{ marginTop: '10px', fontSize: '0.8rem', textAlign: 'left' }}>
                          ឈ្មោះ / 姓名: __________________________
                        </div>
                      </td>
                      <td style={{ width: '50%', textAlign: 'center', verticalAlign: 'top', padding: '12px', height: '140px' }}>
                        <div style={{ fontFamily: 'Khmer OS Muol Light, Moul, serif', color: '#0f172a' }}>
                          កម្មករនិយោជិត (ភាគី ខ)
                        </div>
                        <div style={{ fontSize: '0.78rem', color: '#1e3a8a', fontWeight: 700 }}>
                          乙方（签字与手印）/ Employee (Signature & Thumbprint)
                        </div>
                        <div style={{ color: '#94a3b8', fontSize: '0.75rem', marginTop: '45px' }}>
                          (ស្នាមមេដៃស្តាំ / 右手大拇指印 / Right Thumbprint)
                        </div>
                        <div style={{ marginTop: '10px', fontSize: '0.8rem', textAlign: 'left', fontWeight: 700 }}>
                          ឈ្មោះ / 姓名: {formData.employeeNameKh} ({formData.employeeNameEn})
                        </div>
                      </td>
                    </tr>
                  </tbody>
                </table>

                {/* ISO 9001:2015 Approval Matrix Table */}
                <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#0369a1', margin: '14px 0 4px 0' }}>
                  ការត្រួតពិនិត្យ និងអនុម័តឯកសារប្រព័ន្ធ ISO 9001:2015 (Document Control Approval Matrix) ៖
                </div>
                <table className="iso-table" style={{ fontSize: '0.76rem', margin: 0 }}>
                  <thead>
                    <tr style={{ background: '#f8fafc' }}>
                      <th style={{ textAlign: 'center', width: '33.3%' }}>Prepared By / រៀបចំដោយ</th>
                      <th style={{ textAlign: 'center', width: '33.3%' }}>Reviewed By / ពិនិត្យដោយ</th>
                      <th style={{ textAlign: 'center', width: '33.4%' }}>Approved By / អនុម័តដោយ</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td style={{ textAlign: 'center', padding: '8px' }}>
                        <div style={{ fontWeight: 600 }}>HR Officer / មន្ត្រីធនធានមនុស្ស</div>
                        <div style={{ color: '#94a3b8', margin: '20px 0 4px 0' }}>Sign: ______________</div>
                        <div>Date: 01/01/2026</div>
                      </td>
                      <td style={{ textAlign: 'center', padding: '8px' }}>
                        <div style={{ fontWeight: 600 }}>HR Manager / QC Director</div>
                        <div style={{ color: '#94a3b8', margin: '20px 0 4px 0' }}>Sign: ______________</div>
                        <div>Date: 01/01/2026</div>
                      </td>
                      <td style={{ textAlign: 'center', padding: '8px' }}>
                        <div style={{ fontWeight: 600 }}>General Manager / អគ្គនាយក</div>
                        <div style={{ color: '#94a3b8', margin: '20px 0 4px 0' }}>Sign: ______________</div>
                        <div>Date: 01/01/2026</div>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
