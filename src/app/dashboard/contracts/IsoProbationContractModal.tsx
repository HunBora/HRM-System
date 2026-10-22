'use client';

import React, { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import { generateIsoProbationContractDocxBlob, IsoProbationDocxData } from '@/lib/isoProbationDocx';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  employees?: any[];
  companySettings?: any;
  initialEmployee?: any;
  onSaveContract?: (contractData: any) => Promise<void>;
}

export default function IsoProbationContractModal({
  isOpen,
  onClose,
  employees = [],
  companySettings,
  initialEmployee,
  onSaveContract,
}: Props) {
  const [activeTab, setActiveTab] = useState<'preview' | 'edit'>('preview');
  const [langMode, setLangMode] = useState<'trilingual' | 'bilingual_zh' | 'khmer'>('trilingual');
  const [isGeneratingDocx, setIsGeneratingDocx] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Form State
  const [formData, setFormData] = useState<IsoProbationDocxData>(() =>
    initIsoData(initialEmployee, companySettings)
  );

  useEffect(() => {
    if (initialEmployee) {
      setFormData(initIsoData(initialEmployee, companySettings));
    }
  }, [initialEmployee, companySettings]);

  if (!isOpen) return null;

  function initIsoData(emp: any, settings: any): IsoProbationDocxData {
    const today = new Date();
    const dStart = new Date(today);
    const dEnd = new Date(today);
    dEnd.setMonth(dEnd.getMonth() + 2); // Default 2 months for specialized bag/garment worker (Article 68)

    const formatDate = (d: Date) => {
      const day = String(d.getDate()).padStart(2, '0');
      const month = String(d.getMonth() + 1).padStart(2, '0');
      return `${day}/${month}/${d.getFullYear()}`;
    };

    const nameKh = emp ? `${emp.firstNameKh || ''} ${emp.lastNameKh || ''}`.trim() : 'សុខ ចាន់ដា';
    const nameEn = emp ? `${emp.firstNameEn || ''} ${emp.lastNameEn || ''}`.trim() : 'SOK CHANDA';
    const genderKh = emp?.gender === 'FEMALE' ? 'ស្រី' : 'ប្រុស';
    const genderZh = emp?.gender === 'FEMALE' ? '女' : '男';

    return {
      companyNameKh: 'ឡាងថៃ ប៊ែក (ខេមបូឌា) ឯក',
      companyNameEn: 'LANGTAI BAGS (CAMBODIA) CO., LTD',
      companyNameZh: '朗泰箱包（柬埔寨）有限公司',
      companyAddress: settings?.address || 'ភូមិតានប់ ឃុំត្រាំកក់ ស្រុកត្រាំកក់ ខេត្តតាកែវ / Takeo Province, Cambodia',
      docCode: 'LT-HR-SOP-002-F01',
      revision: '02',
      effectiveDate: '01/01/2026',
      employeeNameKh: nameKh,
      employeeNameEn: nameEn,
      genderKh: genderKh,
      genderZh: genderZh,
      age: 25,
      dob: emp?.dob ? formatDate(new Date(emp.dob)) : '15/05/2001',
      education: 'មធ្យមសិក្សា / 中学 (Secondary School)',
      position: emp?.position || 'កម្មករដេរកាតាប / 车缝工 (Sewing Operator)',
      nationalId: emp?.nationalId || '020589123',
      nssfNo: '10023458',
      joinDate: formatDate(dStart),
      employeeId: emp?.employeeId || 'LT-2026-088',
      address: emp?.address || 'ភូមិត្រពាំងវែង ឃុំត្រាំកក់ ស្រុកត្រាំកក់ ខេត្តតាកែវ',
      probationDurationMonths: 2,
      startDate: formatDate(dStart),
      endDate: formatDate(dEnd),
      basicSalaryUsd: 208, // Statutory Minimum wage
      attendanceBonusUsd: 15,
      transportAllowanceUsd: 9.5,
      mealAllowanceRiel: 2000,
      signedDate: formatDate(dStart),
      langMode: 'trilingual',
    };
  }

  // Handle employee picker change
  const handleSelectEmployee = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedId = e.target.value;
    const found = employees.find((x) => x.id === selectedId);
    if (found) {
      const nameKh = `${found.firstNameKh || ''} ${found.lastNameKh || ''}`.trim();
      const nameEn = `${found.firstNameEn || ''} ${found.lastNameEn || ''}`.trim();
      setFormData((prev) => ({
        ...prev,
        employeeNameKh: nameKh || prev.employeeNameKh,
        employeeNameEn: nameEn || prev.employeeNameEn,
        genderKh: found.gender === 'FEMALE' ? 'ស្រី' : 'ប្រុស',
        genderZh: found.gender === 'FEMALE' ? '女' : '男',
        position: found.position || prev.position,
        employeeId: found.employeeId || prev.employeeId,
        nationalId: found.nationalId || prev.nationalId,
        address: found.address || prev.address,
      }));
    }
  };

  // Export to Word (.docx)
  const handleExportDocx = async () => {
    setIsGeneratingDocx(true);
    try {
      const blob = await generateIsoProbationContractDocxBlob({
        ...formData,
        langMode,
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `កិច្ចសន្យាសាកល្បង_ISO9001_${formData.employeeNameEn || 'Contract'}_${formData.docCode}.docx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      Swal.fire({
        icon: 'success',
        title: 'ទាញយក Word ជោគជ័យ!',
        text: 'ឯកសារកិច្ចសន្យា ISO 9001:2015 (.docx) ត្រូវបានបង្កើតរួចរាល់',
        timer: 2000,
        showConfirmButton: false,
      });
    } catch (err: any) {
      Swal.fire({ icon: 'error', title: 'បរាជ័យទាញយក Word!', text: err.message });
    } finally {
      setIsGeneratingDocx(false);
    }
  };

  // Print
  const handlePrint = () => {
    window.print();
  };

  // Save Contract
  const handleSave = async () => {
    if (onSaveContract) {
      setIsSaving(true);
      try {
        await onSaveContract(formData);
        Swal.fire({ icon: 'success', title: 'បានរក្សាទុកកិច្ចសន្យាជោគជ័យ!', timer: 1500, showConfirmButton: false });
        setActiveTab('preview');
      } catch (err: any) {
        Swal.fire({ icon: 'error', title: 'មានបញ្ហា!', text: err.message });
      } finally {
        setIsSaving(false);
      }
    } else {
      Swal.fire({ icon: 'success', title: 'ទិន្នន័យកិច្ចសន្យាត្រូវបានធ្វើបច្ចុប្បន្នភាព!', timer: 1200, showConfirmButton: false });
      setActiveTab('preview');
    }
  };

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
        background: 'rgba(15, 23, 42, 0.8)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 99999,
        padding: '16px',
      }}
    >
      <div
        style={{
          background: '#f8fafc',
          borderRadius: '16px',
          width: '100%',
          maxWidth: '1120px',
          height: '94vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          overflow: 'hidden',
          border: '1px solid #cbd5e1',
        }}
      >
        {/* Top Control Bar */}
        <div
          className="no-print"
          style={{
            background: '#ffffff',
            padding: '12px 20px',
            borderBottom: '1px solid #e2e8f0',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '12px',
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '1.3rem' }}>🏭</span>
              <h2 style={{ margin: 0, fontSize: '1.15rem', color: '#0f172a', fontWeight: 800 }}>
                កិច្ចសន្យាការងារសាកល្បង ISO 9001:2015 (Langtai Bags / 试用工合同)
              </h2>
            </div>
            <p style={{ margin: '2px 0 0 0', fontSize: '0.8rem', color: '#64748b' }}>
              អនុលោមតាមច្បាប់ស្តីពីការងារ (មាត្រា ៦៨ & ៨២) • ស្តង់ដារគ្រប់គ្រងគុណភាព ISO 9001:2015 Clause 7.5
            </p>
          </div>

          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
            {/* Tab switch */}
            <div style={{ background: '#f1f5f9', borderRadius: '8px', padding: '3px', display: 'flex', gap: '3px' }}>
              <button
                type="button"
                onClick={() => setActiveTab('preview')}
                style={{
                  padding: '5px 12px',
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
                  padding: '5px 12px',
                  borderRadius: '6px',
                  border: 'none',
                  background: activeTab === 'edit' ? '#ffffff' : 'transparent',
                  color: activeTab === 'edit' ? '#0284c7' : '#64748b',
                  fontWeight: 700,
                  fontSize: '0.8rem',
                  cursor: 'pointer',
                  boxShadow: activeTab === 'edit' ? '0 1px 2px rgba(0,0,0,0.06)' : 'none',
                }}
              >
                ✏️ កែប្រែតាមចិត្ត (Edit)
              </button>
            </div>

            {/* Language Mode */}
            <select
              value={langMode}
              onChange={(e) => setLangMode(e.target.value as any)}
              style={{ padding: '6px 10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.8rem', background: '#f8fafc', fontWeight: 600 }}
            >
              <option value="trilingual">🌐 ត្រីភាសា (ខ្មែរ - 中文 - EN)</option>
              <option value="bilingual_zh">🇨🇳 ទ្វេភាសា (ខ្មែរ - 中文)</option>
              <option value="khmer">🇰🇭 ភាសាខ្មែរតែមួយ</option>
            </select>

            {/* Print */}
            <button
              type="button"
              onClick={handlePrint}
              style={{
                background: '#1e293b',
                color: '#fff',
                border: 'none',
                borderRadius: '8px',
                padding: '7px 14px',
                fontSize: '0.8rem',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              🖨️ បោះពុម្ព (Print 4 Pages)
            </button>

            {/* Word docx */}
            <button
              type="button"
              onClick={handleExportDocx}
              disabled={isGeneratingDocx}
              style={{
                background: '#0284c7',
                color: '#fff',
                border: 'none',
                borderRadius: '8px',
                padding: '7px 14px',
                fontSize: '0.8rem',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              📄 {isGeneratingDocx ? 'កំពុងបង្កើត...' : 'Word (.docx)'}
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
                padding: '7px 12px',
                fontSize: '0.82rem',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              ✕ បិទ
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '24px',
            display: 'flex',
            justifyContent: 'center',
            background: '#94a3b8',
          }}
        >
          {/* TAB 1: PREVIEW (4 Complete Pages) */}
          {activeTab === 'preview' && (
            <div
              id="iso-contract-print-area"
              style={{
                width: '100%',
                maxWidth: '794px',
                display: 'flex',
                flexDirection: 'column',
                gap: '24px',
              }}
            >
              {/* PAGE 1 */}
              <div
                className="iso-contract-page"
                style={{
                  background: '#ffffff',
                  boxShadow: '0 8px 20px rgba(0,0,0,0.15)',
                  padding: '32px 38px',
                  boxSizing: 'border-box',
                  fontFamily: 'Khmer OS Siemreap, Siemreap, Kantumruy Pro, sans-serif',
                  color: '#0f172a',
                  lineHeight: 1.5,
                  minHeight: '1120px',
                  position: 'relative',
                }}
              >
                {renderIsoHeader(1)}

                {/* Photo Box top right */}
                <div style={{ position: 'absolute', right: '38px', top: '100px', width: '85px', height: '110px', border: '1.5px dashed #94a3b8', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', fontSize: '0.72rem', color: '#94a3b8', background: '#f8fafc' }}>
                  <div>រូបថត ៤x៦</div>
                  <div style={{ fontWeight: 700 }}>Photo</div>
                  <div style={{ fontSize: '0.62rem' }}>照片</div>
                </div>

                {/* Title */}
                <div style={{ textAlign: 'center', margin: '6px 0 14px 0', paddingRight: '90px' }}>
                  <div style={{ fontFamily: 'Khmer OS Muol Light, Moul, serif', fontSize: '1.25rem', color: '#0f172a', fontWeight: 800 }}>
                    កិច្ចសន្យាការងារសាកល្បង
                  </div>
                  <div style={{ fontFamily: 'SimSun, Microsoft YaHei, serif', fontSize: '1.1rem', color: '#1e3a8a', fontWeight: 800, marginTop: '2px' }}>
                    试用工合同
                  </div>
                  {langMode === 'trilingual' && (
                    <div style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 700, letterSpacing: '0.5px' }}>
                      PROBATIONARY EMPLOYMENT CONTRACT
                    </div>
                  )}
                  <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '4px' }}>
                    រវាង (之间 / BETWEEN)
                  </div>
                </div>

                {/* Contracting Parties */}
                <div style={{ fontSize: '0.84rem', lineHeight: 1.5, marginBottom: '12px' }}>
                  <div>
                    <span style={{ fontWeight: 800, color: '#0f172a' }}>ក្រុមហ៊ុន {formData.companyNameKh}</span> (ហៅកាត់ថា ភាគី ក) / <strong>{formData.companyNameEn}</strong> 叫方 (A)
                  </div>
                  <div style={{ color: '#475569', fontSize: '0.8rem' }}>
                    អាសយដ្ឋាន/地址 ៖ {formData.companyAddress}
                  </div>
                  <div style={{ textAlign: 'center', fontWeight: 700, color: '#64748b', margin: '2px 0' }}>
                    និង (和 / AND)
                  </div>
                  <div>
                    <span style={{ fontWeight: 800, color: '#0f172a' }}>ឈ្មោះ {formData.employeeNameKh} ({formData.employeeNameEn})</span> (ហៅកាត់ថា ភាគី ខ) / 员工 叫方 (B)
                  </div>
                </div>

                {/* Employee Info Table (Bilingual Table) */}
                <table style={{ width: '100%', borderCollapse: 'collapse', border: '1.5px solid #0f172a', marginBottom: '12px', fontSize: '0.82rem' }}>
                  <tbody>
                    <tr>
                      <td style={{ border: '1px solid #0f172a', padding: '5px 8px', width: '38%' }}>
                        <strong>ឈ្មោះ / 名字 ៖</strong> {formData.employeeNameKh} ({formData.employeeNameEn})
                      </td>
                      <td style={{ border: '1px solid #0f172a', padding: '5px 8px', width: '32%' }}>
                        <strong>ភេទ / 性别 ៖</strong> {formData.genderKh} ({formData.genderZh})
                      </td>
                      <td style={{ border: '1px solid #0f172a', padding: '5px 8px', width: '30%' }}>
                        <strong>អាយុ / 年龄 ៖</strong> {formData.age} ឆ្នាំ/岁
                      </td>
                    </tr>
                    <tr>
                      <td style={{ border: '1px solid #0f172a', padding: '5px 8px' }}>
                        <strong>ថ្ងៃខែឆ្នាំកំណើត / 出生日期 ៖</strong> {formData.dob}
                      </td>
                      <td style={{ border: '1px solid #0f172a', padding: '5px 8px' }}>
                        <strong>កម្រិតវប្បធម៌ / 教育程度 ៖</strong> {formData.education}
                      </td>
                      <td style={{ border: '1px solid #0f172a', padding: '5px 8px' }}>
                        <strong>មុខតំណែង / 职位 ៖</strong> <span style={{ color: '#0284c7', fontWeight: 700 }}>{formData.position}</span>
                      </td>
                    </tr>
                    <tr>
                      <td style={{ border: '1px solid #0f172a', padding: '5px 8px' }}>
                        <strong>អត្តសញ្ញាណប័ណ្ណ / 身份证号码 ៖</strong> {formData.nationalId}
                      </td>
                      <td colSpan={2} style={{ border: '1px solid #0f172a', padding: '5px 8px' }}>
                        <strong>លេខកាត ប.ស.ស / NSSF 号码 ៖</strong> {formData.nssfNo}
                      </td>
                    </tr>
                    <tr>
                      <td style={{ border: '1px solid #0f172a', padding: '5px 8px' }}>
                        <strong>ថ្ងៃចូលធ្វើការ / 进厂日期 ៖</strong> {formData.joinDate}
                      </td>
                      <td colSpan={2} style={{ border: '1px solid #0f172a', padding: '5px 8px' }}>
                        <strong>អត្តលេខ / 工号 ៖</strong> <strong style={{ color: '#1e3a8a' }}>{formData.employeeId}</strong>
                      </td>
                    </tr>
                    <tr>
                      <td colSpan={3} style={{ border: '1px solid #0f172a', padding: '5px 8px' }}>
                        <strong>អាសយដ្ឋានបច្ចុប្បន្ន / 现住地址 ៖</strong> {formData.address}
                      </td>
                    </tr>
                  </tbody>
                </table>

                {/* Agreement & ISO Objectives */}
                <div style={{ textAlign: 'center', marginBottom: '8px' }}>
                  <div style={{ fontFamily: 'Khmer OS Muol Light, Moul, serif', fontSize: '0.88rem', color: '#0f172a' }}>
                    ភាគីទាំងពីរបានព្រមព្រៀងគ្នាក្នុងកិច្ចសន្យាការងារដូចខាងក្រោម ៖
                  </div>
                  <div style={{ fontFamily: 'SimSun', fontSize: '0.82rem', fontWeight: 700, color: '#1e3a8a' }}>
                    双方同意聘用合同如下：
                  </div>
                </div>

                <div style={{ background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '6px', padding: '8px 10px', fontSize: '0.78rem', marginBottom: '10px', lineHeight: 1.45 }}>
                  <div>
                    កិច្ចសន្យាការងារសាកល្បងនេះ ផ្តល់ជូនបុគ្គលិកនូវស្មារតីទទួលខុសត្រូវ និងទំនុកចិត្តលើភារកិច្ចរបស់ខ្លួន ព្រមទាំងកិច្ចសហការល្អរវាងនិយោជិត និងនិយោជក យកចិត្តទុកដាក់ខ្ពស់ដើម្បីរួមគ្នាសម្រេចគោលដៅបរិមាណ និងគុណភាពផលិតកម្មរបស់រោងចក្រ ស្របតាមស្តង់ដារ ISO 9001:2015។
                  </div>
                  <div style={{ color: '#475569', marginTop: '2px', fontStyle: 'italic' }}>
                    这份试用合同为员工提供了责任感和对自己职责的信心，以及与员工之间的良好合作，高度重视，共同实现工厂生产的数量和质量目标，符合 ISO 9001:2015 质量管理体系标准。
                  </div>
                </div>

                {/* Article 1 */}
                <div style={{ marginBottom: '10px' }}>
                  <div style={{ fontFamily: 'Khmer OS Muol Light, Moul, serif', fontSize: '0.85rem', color: '#0f172a' }}>
                    ១- រយៈពេលនៃកិច្ចសន្យាសាកល្បង (PROBATION DURATION)
                  </div>
                  <div style={{ fontWeight: 700, color: '#1e3a8a', fontSize: '0.8rem' }}>
                    1、试用期合同期限
                  </div>
                  <div style={{ fontSize: '0.8rem', lineHeight: 1.45, marginTop: '2px' }}>
                    ថិរវេលានៃកិច្ចសន្យាសាកល្បងមានរយៈពេល <strong>{formData.probationDurationMonths} ខែ</strong> ចាប់ពីថ្ងៃទី <strong>{formData.startDate}</strong> ដល់ថ្ងៃទី <strong>{formData.endDate}</strong>។ រយៈពេលសាកល្បងនេះអនុលោមតាមមាត្រា ៦៨ នៃច្បាប់ការងារ។ ក្នុងអំឡុងពេលសាកល្បង ភាគីទាំងពីរអាចបញ្ចប់កិច្ចសន្យាបានគ្រប់ពេលវេលាដោយមិនបាច់ជូនដំណឹងមុន និងគ្មានសំណង ស្របតាមមាត្រា ៨២។
                  </div>
                  <div style={{ color: '#475569', fontSize: '0.78rem', marginTop: '2px' }}>
                    试用工合同期限为 {formData.probationDurationMonths} 个月，从 {formData.startDate} 到 {formData.endDate}。试用期严格遵循《劳动法》第68条及第82条（双方均可随时终止，无须预先通知且无补偿）。
                  </div>
                </div>

                {/* Article 2 */}
                <div>
                  <div style={{ fontFamily: 'Khmer OS Muol Light, Moul, serif', fontSize: '0.85rem', color: '#0f172a' }}>
                    ២- ម៉ោងធ្វើការ និងការឈប់សម្រាកប្រចាំឆ្នាំ (WORKING HOURS & LEAVE)
                  </div>
                  <div style={{ fontWeight: 700, color: '#1e3a8a', fontSize: '0.8rem' }}>
                    2、工作时间和带薪休假
                  </div>
                  <div style={{ fontSize: '0.8rem', lineHeight: 1.45, marginTop: '2px' }}>
                    ក/- ម៉ោងធ្វើការត្រូវអនុវត្តតាមបទបញ្ជាផ្ទៃក្នុងរបស់រោងចក្រ/ក្រុមហ៊ុន។<br />
                    ខ/- គណៈគ្រប់គ្រងមានសិទ្ធិចាត់ចែង និងគ្រប់គ្រងម៉ោងធ្វើការស្របតាមមុខងារ និងវេនការងារជាក់ស្តែង។
                  </div>
                  <div style={{ color: '#475569', fontSize: '0.78rem', marginTop: '2px' }}>
                    A/- 工作时间遵循公司内部规定。<br />
                    B/- 管理层有权根据职能和工作班次来管理工作时间。
                  </div>
                </div>
              </div>

              {/* PAGE 2 */}
              <div
                className="iso-contract-page"
                style={{
                  background: '#ffffff',
                  boxShadow: '0 8px 20px rgba(0,0,0,0.15)',
                  padding: '32px 38px',
                  boxSizing: 'border-box',
                  fontFamily: 'Khmer OS Siemreap, Siemreap, Kantumruy Pro, sans-serif',
                  color: '#0f172a',
                  lineHeight: 1.5,
                  minHeight: '1120px',
                  position: 'relative',
                }}
              >
                {renderIsoHeader(2)}

                {/* Article 2 Cont. */}
                <div style={{ fontSize: '0.8rem', lineHeight: 1.45, marginBottom: '12px' }}>
                  <div>
                    គ/- គណៈគ្រប់គ្រងមានសិទ្ធិកែប្រែម៉ោងធ្វើការ ឬម៉ោងទទួលទានអាហារ ដរាបណាម៉ោងធ្វើការធម្មតាមិនលើសពី ៨ ម៉ោងក្នុងមួយថ្ងៃ (ឬ ៤៨ ម៉ោងក្នុងមួយសប្តាហ៍) អនុលោមតាមមាត្រា ១៣៧ នៃច្បាប់ស្តីពីការងារ។<br />
                    ឃ/- ក្រុមហ៊ុនផ្តល់ជូនកម្មករនិយោជិតនូវថ្ងៃឈប់សម្រាកបុណ្យជាតិដែលមានប្រាក់ឈ្នួល ៖<br />
                    • ថ្ងៃឈប់បុណ្យជាតិ ៖ គោរពតាមសេចក្តីប្រកាសរបស់ក្រសួងការងារ និងបណ្តុះបណ្តាលវិជ្ជាជីវៈ (MLVT)។<br />
                    • ច្បាប់ឈឺ ៖ អនុវត្តតាមច្បាប់ការងារ និងបទបញ្ជាផ្ទៃក្នុង (ត្រូវមានវិញ្ញាបនបត្រពេទ្យស្របច្បាប់)។<br />
                    • គ្រោះថ្នាក់ការងារ ៖ ធានារ៉ាប់រងដោយរបបសន្តិសុខសង្គម ប.ស.ស. (NSSF)។<br />
                    • ច្បាប់ពិសេសក្នុងគ្រួសារ ៖ យោងមាត្រា ១៦៩ នៃច្បាប់ការងារ (អាពាហ៍ពិពាហ៍, បុណ្យសព, សម្រាលកូន)។
                  </div>
                  <div style={{ color: '#475569', fontSize: '0.78rem', marginTop: '4px' }}>
                    C/- 管理层有权更改工作时间或用餐时间，只要正常工作时间为八小时或劳动法第 137 条。<br />
                    D/- 公司为所有员工提供带薪公共假期：<br />
                    假期：遵循劳工部年度法定通告 | 病假：遵循劳工部（凭合法医院病假条）<br />
                    工伤事故：遵循劳工部及享受 NSSF 保障 | 特假：遵守劳工部第 169 条。
                  </div>
                </div>

                {/* Article 3 */}
                <div style={{ marginBottom: '12px' }}>
                  <div style={{ fontFamily: 'Khmer OS Muol Light, Moul, serif', fontSize: '0.85rem', color: '#0f172a' }}>
                    ៣- ប្រាក់ឈ្នួល ប្រាក់រង្វាន់ និងអត្ថប្រយោជន៍ផ្សេងៗ (WAGES & OVERTIME)
                  </div>
                  <div style={{ fontWeight: 700, color: '#1e3a8a', fontSize: '0.8rem' }}>
                    3、工资、奖金和其他福利
                  </div>
                  <div style={{ fontSize: '0.8rem', lineHeight: 1.45, marginTop: '2px' }}>
                    • ប្រាក់ឈ្នួលត្រូវបានគណនាផ្អែកលើចំនួនថ្ងៃធ្វើការជាក់ស្តែងរបស់កម្មករនិយោជិត។<br />
                    • ក្រុមហ៊ុនផ្តល់ប្រាក់ឈ្នួលគោលក្នុងកិច្ចសន្យាសាកល្បងប្រចាំខែចំនួន <strong>${formData.basicSalaryUsd} ដុល្លារ/ខែ</strong> (មិនទាបជាងកម្រិតប្រាក់ឈ្នួលអប្បបរមាប្រចាំឆ្នាំដែលប្រកាសដោយក្រសួងការងារឡើយ)។<br />
                    • ក្នុងករណីមានការងារបន្ទាន់ ក្រុមហ៊ុនអាចស្នើសុំកម្មករនិយោជិតធ្វើការបន្ថែមម៉ោង (ដោយស្ម័គ្រចិត្ត) ៖<br />
                    - ការងារបន្ថែមម៉ោងធម្មតា ស្មើ ១.៥ ដង (១៥០%) នៃប្រាក់ឈ្នួលធម្មតា អនុលោមតាមមាត្រា ១៣៩ នៃច្បាប់ការងារ។<br />
                    - ការងារបន្ថែមម៉ោងនៅថ្ងៃបុណ្យ ឬថ្ងៃអាទិត្យ ស្មើ ២.០ ដង (២០០%) នៃប្រាក់ឈ្នួលធម្មតា។
                  </div>
                  <div style={{ color: '#475569', fontSize: '0.78rem', marginTop: '3px' }}>
                    • 工资是根据员工实际出勤天数计算的。<br />
                    • 公司给试用合同每月的法定基本工资为 <strong>${formData.basicSalaryUsd} 美元</strong>（本公司以劳工部公布的年度最低工资为准）。<br />
                    • 如果公司有紧急工作，公司会要求工人加班（自愿原则）：<br />
                    - 定期加班等于每小时工资的 1.5 倍，或根据《劳动法》第 139 条。<br />
                    - 假期/周日加班：遵循劳工部 (100% + 100% = 200%)。
                  </div>
                </div>

                {/* Article 4 */}
                <div style={{ marginBottom: '12px' }}>
                  <div style={{ fontFamily: 'Khmer OS Muol Light, Moul, serif', fontSize: '0.85rem', color: '#0f172a' }}>
                    ៤- វិន័យការងារ គុណភាព និងសុវត្ថិភាពការងារ (ISO 9001:2015 QUALITY)
                  </div>
                  <div style={{ fontWeight: 700, color: '#1e3a8a', fontSize: '0.8rem' }}>
                    4、遵守工厂规章制度、质量保证与作业安全
                  </div>
                  <div style={{ fontSize: '0.8rem', lineHeight: 1.45, marginTop: '2px' }}>
                    កម្មករនិយោជិតត្រូវគោរពបទបញ្ជាផ្ទៃក្នុងរបស់រោងចក្រ គោរពការគ្រប់គ្រងរបស់ប្រធានគ្រប់គ្រង ការផ្លាស់ប្តូរផ្នែក ក្រុម ឬមុខតំណែង ស្តាប់តាមការណែនាំរបស់អ្នកគ្រប់គ្រង និងធានាគុណភាព បរិមាណការងារប្រកបដោយសុវត្ថិភាព និងទាន់ពេលវេលា (កាត់បន្ថយការខូចខាត Zero Defect ស្របតាមប្រព័ន្ធ ISO 9001:2015)។
                  </div>
                  <div style={{ color: '#475569', fontSize: '0.78rem', marginTop: '3px' }}>
                    4- 员工必须遵守工厂的规章制度，尊重主管的管理、调动部门或团队或职位，听从主管的指示，及时、安全地保证质量和数量，追求零缺陷，严格执行 ISO 9001:2015 质量管理规范。
                  </div>
                </div>

                {/* Article 5 */}
                <div>
                  <div style={{ fontFamily: 'Khmer OS Muol Light, Moul, serif', fontSize: '0.85rem', color: '#0f172a' }}>
                    ៥- ការសុំច្បាប់អនុញ្ញាត និងការឈប់គ្មានច្បាប់ (LEAVE APPLICATION)
                  </div>
                  <div style={{ fontWeight: 700, color: '#1e3a8a', fontSize: '0.8rem' }}>
                    5、授权/未经授权请假
                  </div>
                  <div style={{ fontSize: '0.8rem', lineHeight: 1.45, marginTop: '2px' }}>
                    កម្មករនិយោជិតដែលមានធុរៈផ្ទាល់ខ្លួនមិនអាចមកបំពេញការងារបាន ត្រូវបំពេញពាក្យសុំច្បាប់យ៉ាងហោចណាស់ ១ ថ្ងៃមុន។ ក្នុងករណីមានជំងឺធ្ងន់ធ្ងរ ឬការសង្គ្រោះបន្ទាន់ និយោជិតអាចជូនដំណឹងតាមទូរស័ព្ទ ឬតាមរយៈតំណាង ប៉ុន្តែត្រូវបញ្ជូនលិខិតសុំច្បាប់មកក្រុមហ៊ុនក្នុងរយៈពេលយ៉ាងយូរ ២ ថ្ងៃបន្ទាប់ពីថ្ងៃចាប់ផ្តើមឈប់។ ក្នុងករណីឈឺ ត្រូវមានវិញ្ញាបនបត្រពេទ្យត្រឹមត្រូវ។ ការឈប់សម្រាកដោយគ្មានការអនុញ្ញាត និងគ្មានលិខិតបញ្ជាក់ ត្រូវចាត់ទុកជាអវត្តមានឥតច្បាប់ (旷工)។
                  </div>
                  <div style={{ color: '#475569', fontSize: '0.78rem', marginTop: '3px' }}>
                    5- 员工如果有个人事务而无法完成工作，必须至少提前一天向管理层填写请假申请表。如遇重病/紧急需要，员工可透过代表申请休假或电话通知，但必须在开工后两天内提交信函。如果生病，员工必须向医生发送适当的证明。未告知和无法提供适当证明的将被视为缺席旷工。
                  </div>
                </div>
              </div>

              {/* PAGE 3 */}
              <div
                className="iso-contract-page"
                style={{
                  background: '#ffffff',
                  boxShadow: '0 8px 20px rgba(0,0,0,0.15)',
                  padding: '32px 38px',
                  boxSizing: 'border-box',
                  fontFamily: 'Khmer OS Siemreap, Siemreap, Kantumruy Pro, sans-serif',
                  color: '#0f172a',
                  lineHeight: 1.5,
                  minHeight: '1120px',
                  position: 'relative',
                }}
              >
                {renderIsoHeader(3)}

                {/* Article 6 */}
                <div style={{ marginBottom: '12px' }}>
                  <div style={{ fontFamily: 'Khmer OS Muol Light, Moul, serif', fontSize: '0.85rem', color: '#0f172a' }}>
                    ៦- ការចាត់វិធានការចំពោះអវត្តមានឥតច្បាប់ (ABSENTEEISM)
                  </div>
                  <div style={{ fontWeight: 700, color: '#1e3a8a', fontSize: '0.8rem' }}>
                    6、旷工处理
                  </div>
                  <div style={{ fontSize: '0.8rem', lineHeight: 1.45, marginTop: '2px' }}>
                    • អវត្តមានឥតច្បាប់តិចជាង ២ ថ្ងៃ ៖ ត្រូវចាត់ទុកជាកំហុសស្រាល (អប់រំណែនាំផ្ទាល់មាត់)។<br />
                    • អវត្តមានឥតច្បាប់ពី ២ ថ្ងៃ ដល់ ៥ ថ្ងៃ ៖ ត្រូវចាត់ទុកជាកំហុសមធ្យម (លិខិតព្រមានជាលាយលក្ខណ៍អក្សរ)។<br />
                    • អវត្តមានឥតច្បាប់ចាប់ពី ៦ ថ្ងៃក្នុងមួយខែឡើងទៅ ៖ ត្រូវចាត់ទុកជាការបោះបង់ការងារ ដែលជាកំហុសធ្ងន់ធ្ងរ និងនាំឱ្យមានការបញ្ចប់ការងារភ្លាមៗដោយគ្មានសំណង ស្របតាមមាត្រា ៨៣ និង ៨៤ នៃច្បាប់ការងារ។
                  </div>
                  <div style={{ color: '#475569', fontSize: '0.78rem', marginTop: '3px' }}>
                    • 旷工不到 2 天，将被视为轻微犯罪（批评教育并记入档案）。<br />
                    • 旷工从 2 天到 5 天，视为中度犯罪（发出书面警告）。<br />
                    • 旷工从每月 6 天起，被视为放弃工作，是严重的违法行为并导致就业终止（直接开除且无补偿）。
                  </div>
                </div>

                {/* Article 7 */}
                <div style={{ marginBottom: '12px' }}>
                  <div style={{ fontFamily: 'Khmer OS Muol Light, Moul, serif', fontSize: '0.85rem', color: '#0f172a' }}>
                    ៧- នីតិវិធីនៃវិធានការវិន័យ (DISCIPLINARY PROCEDURES)
                  </div>
                  <div style={{ fontWeight: 700, color: '#1e3a8a', fontSize: '0.8rem' }}>
                    7、纪律
                  </div>
                  <div style={{ fontSize: '0.8rem', lineHeight: 1.45, marginTop: '2px' }}>
                    • កំហុសស្រាល ៖ លើកទី១ អប់រំណែនាំផ្ទាល់មាត់។ លើកទី២ ទទួលការព្រមានជាលាយលក្ខណ៍អក្សរលើកទី១។ លើកទី៣ ទទួលការព្រមានលើកទី២។ បើមិនកែប្រែ នឹងបញ្ចប់កិច្ចសន្យាការងារ។<br />
                    • កំហុសមធ្យម ៖ លើកទី១ ទទួលលិខិតព្រមានជាលាយលក្ខណ៍អក្សរលើកទី១។ លើកទី២ ទទួលលិខិតព្រមានលើកទី២។ បើមិនកែប្រែ នឹងបញ្ចប់កិច្ចសន្យាការងារ។<br />
                    • កំហុសធ្ងន់ធ្ងរ ៖ យោងមាត្រា ៨៣ នៃច្បាប់ស្តីពីការងារ ក្រុមហ៊ុនមានសិទ្ធិបញ្ចប់ការងារជាបន្ទាន់ដោយគ្មានសំណងអ្វីទាំងអស់។<br />
                    • សុពលភាពលិខិតព្រមាន ៖ រាល់លិខិតព្រមានទាំងអស់មានសុពលភាពត្រឹម ១២ ខែ។ ក្រោយរយៈពេល ១២ ខែ លិខិតព្រមានចាស់នឹងត្រូវបានលុបចោល មិនយកមកគិតក្នុងវដ្តការងារបន្ទាប់ឡើយ។
                  </div>
                  <div style={{ color: '#475569', fontSize: '0.78rem', marginTop: '3px' }}>
                    • 错误：首先是口头教育和个人档案。如果您第二次犯同样的错误，您将收到第一次书面警告。如果您再次犯错，您将收到第二次书面警告。不这样做将导致终止雇佣关系。<br />
                    • 中等错误：第一时间收到书面警告，第一封信写在个人档案中。如果犯了第二个错误，则需要第二次书面警告。不这样做将导致终止雇佣关系。<br />
                    • 严重不当行为：根据《劳动法》第83条的规定，公司将终止就业服务。<br />
                    • 12个月后发生错误，本公司不会将之前的错误带入下一个就业服务期。
                  </div>
                </div>

                {/* Article 8, 9, 10 */}
                <div style={{ marginBottom: '12px' }}>
                  <div style={{ fontFamily: 'Khmer OS Muol Light, Moul, serif', fontSize: '0.85rem', color: '#0f172a' }}>
                    ៨-៩-១០- ប្រាក់រង្វាន់ឧស្សាហ៍ព្យាយាម ប្រាក់ធ្វើដំណើរ និងថ្លៃបាយ
                  </div>
                  <div style={{ fontWeight: 700, color: '#1e3a8a', fontSize: '0.8rem' }}>
                    8、全勤奖 | 9、交通费 | 10、午餐
                  </div>
                  <div style={{ fontSize: '0.8rem', lineHeight: 1.45, marginTop: '2px' }}>
                    ៨- ប្រាក់រង្វាន់ឧស្សាហ៍ព្យាយាម (Attendance Bonus) ៖ បុគ្គលិកដែលមកបំពេញការងារទៀងទាត់ពេញមួយខែ និងមិនយឺតយ៉ាវលើសពី ៣០ នាទី នឹងទទួលបានប្រាក់រង្វាន់ចំនួន <strong>${formData.attendanceBonusUsd} ដុល្លារ/ខែ</strong>។<br />
                    ៩- ប្រាក់ថ្លៃធ្វើដំណើរ និងស្នាក់នៅ ៖ ក្រុមហ៊ុនផ្តល់ជូនចំនួន <strong>${formData.transportAllowanceUsd} ដុល្លារ/ខែ</strong> ស្របតាមប្រកាសរបស់ក្រសួងការងារ។<br />
                    ១០- ប្រាក់ថ្លៃបាយ/អាហារថ្ងៃត្រង់ ៖ សម្រាប់ការងារលើសពី ៥ ម៉ោង ឬការងារបន្ថែមម៉ោង ផ្តល់ជូន <strong>{formData.mealAllowanceRiel} រៀល/ថ្ងៃ</strong>។
                  </div>
                  <div style={{ color: '#475569', fontSize: '0.78rem', marginTop: '3px' }}>
                    8- 全勤奖：每月工作满月及迟到或早退少于30分钟，将获得 ${formData.attendanceBonusUsd} 美元的全勤奖。<br />
                    9- 交通费：每月发放 ${formData.transportAllowanceUsd} 美元交通补助。<br />
                    10- 午餐：正常工作时间满5小时将提供 ${formData.mealAllowanceRiel} Riels 补助。
                  </div>
                </div>

                {/* Article 11 */}
                <div>
                  <div style={{ fontFamily: 'Khmer OS Muol Light, Moul, serif', fontSize: '0.85rem', color: '#0f172a' }}>
                    ១១- ការហាមឃាត់ដាច់ខាតក្នុងរោងចក្រ (STRICT PROHIBITIONS)
                  </div>
                  <div style={{ fontWeight: 700, color: '#1e3a8a', fontSize: '0.8rem' }}>
                    11、严禁赌博、饮酒、吸毒及违禁品
                  </div>
                  <div style={{ fontSize: '0.8rem', lineHeight: 1.45, marginTop: '2px' }}>
                    ហាមឃាត់ដាច់ខាតនូវការលេងល្បែងស៊ីសង សេពគ្រឿងស្រវឹង គ្រឿងញៀន ឬការយកអាវុធ វត្ថុងាយឆេះ និងជាតិផ្ទុះចូលក្នុងបរិវេណរោងចក្រ។ ក្រុមហ៊ុនមានសិទ្ធិបញ្ឈប់ពីការងារជាបន្ទាន់ដោយគ្មានសំណងអ្វីទាំងអស់ ហើយចំពោះករណីធ្ងន់ធ្ងរ នឹងត្រូវបញ្ជូនទៅអាជ្ញាធរមានសមត្ថកិច្ចចាត់ការតាមផ្លូវច្បាប់។
                  </div>
                  <div style={{ color: '#475569', fontSize: '0.78rem', marginTop: '3px' }}>
                    11- 请勿玩赌博游戏、饮酒、吸毒或将爆炸物带入工厂。公司有权开除并不作任何经济赔偿，情节严重者，依法处理。
                  </div>
                </div>
              </div>

              {/* PAGE 4 */}
              <div
                className="iso-contract-page"
                style={{
                  background: '#ffffff',
                  boxShadow: '0 8px 20px rgba(0,0,0,0.15)',
                  padding: '32px 38px',
                  boxSizing: 'border-box',
                  fontFamily: 'Khmer OS Siemreap, Siemreap, Kantumruy Pro, sans-serif',
                  color: '#0f172a',
                  lineHeight: 1.5,
                  minHeight: '1120px',
                  position: 'relative',
                }}
              >
                {renderIsoHeader(4)}

                {/* Article 12 */}
                <div style={{ marginBottom: '14px' }}>
                  <div style={{ fontFamily: 'Khmer OS Muol Light, Moul, serif', fontSize: '0.85rem', color: '#0f172a' }}>
                    ១២- ការរំលាយ និងការបញ្ចប់កិច្ចសន្យាការងារ (CONTRACT TERMINATION)
                  </div>
                  <div style={{ fontWeight: 700, color: '#1e3a8a', fontSize: '0.8rem' }}>
                    12、合同解除和终止
                  </div>
                  <div style={{ fontSize: '0.8rem', lineHeight: 1.45, marginTop: '2px' }}>
                    • ភាគី ខ ប្រមូលផ្តុំបង្កចលាចល ដឹកនាំ ឬញុះញង់កម្មករឱ្យធ្វើកូដកម្មខុសច្បាប់ដោយគ្មានហេតុផល និងគ្មានការជូនដំណឹងជាលាយលក្ខណ៍អក្សរ ក្រុមហ៊ុនមានសិទ្ធិបញ្ឈប់ពីការងារភ្លាមៗដោយគ្មានសំណង។<br />
                    • ភាគី ខ មានការធ្វេសប្រហែសធ្ងន់ធ្ងរ កេងបន្លំ ក្លែងបន្លំ ឬលួចទ្រព្យសម្បត្តិក្រុមហ៊ុន ក្រុមហ៊ុនមានសិទ្ធិបញ្ឈប់ពីការងារភ្លាមៗដោយគ្មានសំណង។<br />
                    • ភាគី ខ បំពានយ៉ាងធ្ងន់ធ្ងរលើបទបញ្ជាផ្ទៃក្នុងរបស់រោងចក្រ/ក្រុមហ៊ុន។<br />
                    • កិច្ចសន្យាសាកល្បងនេះនឹងត្រូវបញ្ចប់នៅពេលផុតកំណត់ ឬនៅពេលភាគីណាមួយសម្រេចបញ្ចប់ក្នុងអំឡុងពេលសាកល្បង ស្របតាមមាត្រា ៨២ នៃច្បាប់ការងារ។
                  </div>
                  <div style={{ color: '#475569', fontSize: '0.78rem', marginTop: '3px' }}>
                    • 乙方聚众闹事，带头或鼓动工人无任何理由和无书面申请罢工的，公司有权开除并不作任何经济赔偿，情节严重者，依法处理。<br />
                    • 乙方严重失职、营私舞弊、盗窃公司财物，公司有权开除并不作任何经济赔偿，情节严重者，依法处理；<br />
                    • 乙方严重违反甲方规章制度的；<br />
                    • 本合同期满或法定终止条件出现，本合同即行终止。
                  </div>
                </div>

                {/* Article 13 */}
                <div style={{ marginBottom: '16px' }}>
                  <div style={{ fontFamily: 'Khmer OS Muol Light, Moul, serif', fontSize: '0.85rem', color: '#0f172a' }}>
                    ១៣- ការអនុវត្ត និងការរក្សាទុកកិច្ចសន្យា (EXECUTION & CUSTODY)
                  </div>
                  <div style={{ fontWeight: 700, color: '#1e3a8a', fontSize: '0.8rem' }}>
                    13、合同一式两份与法律适用
                  </div>
                  <div style={{ fontSize: '0.8rem', lineHeight: 1.45, marginTop: '2px' }}>
                    កិច្ចសន្យានេះត្រូវបានធ្វើឡើងជា ២ ច្បាប់ដែលមានតម្លៃគតិយុត្តស្មើគ្នា ១ ច្បាប់រក្សាទុកនៅរោងចក្រ (ភាគី ក) និង ១ ច្បាប់ប្រគល់ជូនកម្មករនិយោជិត (ភាគី ខ)។<br />
                    * ក្រៅពីកិច្ចព្រមព្រៀងនេះ ក្រុមហ៊ុន និងនិយោជិតត្រូវគោរព និងអនុវត្តយ៉ាងម៉ឺងម៉ាត់តាមច្បាប់ស្តីពីការងារនៃព្រះរាជាណាចក្រកម្ពុជា និងបទបញ្ជាផ្ទៃក្នុងរបស់រោងចក្រ។
                  </div>
                  <div style={{ color: '#475569', fontSize: '0.78rem', marginTop: '3px' }}>
                    13- 合同一式两份，一份由工厂保管，一份由工人保管。<br />
                    * 除本协议外，公司和员工应遵守柬埔寨劳动法和工厂内部法规。
                  </div>
                </div>

                {/* Date */}
                <div style={{ textAlign: 'right', fontSize: '0.8rem', marginBottom: '14px', color: '#334155' }}>
                  ធ្វើនៅរាជធានីភ្នំពេញ, ថ្ងៃទី {formData.signedDate} ខែ ............ ឆ្នាំ២០២៦<br />
                  日期：{formData.signedDate}
                </div>

                {/* Signatures Table: 甲方（签字与盖章）, 乙方（签字与手印） */}
                <table style={{ width: '100%', borderCollapse: 'collapse', border: '1.5px solid #0f172a', marginBottom: '16px' }}>
                  <thead>
                    <tr style={{ background: '#f8fafc' }}>
                      <th style={{ border: '1px solid #0f172a', width: '50%', padding: '8px', textAlign: 'center', fontSize: '0.85rem' }}>
                        តំណាងភាគី និយោជក (ភាគី ក)<br />
                        <span style={{ fontSize: '0.88rem', color: '#1e3a8a', fontWeight: 800 }}>甲方（签字与盖章）</span><br />
                        <span style={{ fontSize: '0.72rem', color: '#64748b' }}>Employer / Party A (Signature & Stamp)</span>
                      </th>
                      <th style={{ border: '1px solid #0f172a', width: '50%', padding: '8px', textAlign: 'center', fontSize: '0.85rem' }}>
                        កម្មករនិយោជិត (ភាគី ខ)<br />
                        <span style={{ fontSize: '0.88rem', color: '#1e3a8a', fontWeight: 800 }}>乙方（签字与手印）</span><br />
                        <span style={{ fontSize: '0.72rem', color: '#64748b' }}>Employee / Party B (Signature & Thumbprint)</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td style={{ border: '1px solid #0f172a', height: '110px', padding: '10px', textAlign: 'center', verticalAlign: 'bottom' }}>
                        <div style={{ fontStyle: 'italic', fontSize: '0.72rem', color: '#94a3b8', marginBottom: '20px' }}>
                          (ហត្ថលេខា និងត្រាក្រុមហ៊ុន / Company Stamp & Signature)
                        </div>
                        <div style={{ fontSize: '0.8rem', fontWeight: 700 }}>
                          ឈ្មោះ / 姓名 ៖ __________________________
                        </div>
                      </td>
                      <td style={{ border: '1px solid #0f172a', height: '110px', padding: '10px', textAlign: 'center', verticalAlign: 'bottom' }}>
                        <div style={{ fontStyle: 'italic', fontSize: '0.72rem', color: '#94a3b8', marginBottom: '20px' }}>
                          (ស្នាមមេដៃស្តាំ / 右手大拇指印 / Right Thumbprint)
                        </div>
                        <div style={{ fontSize: '0.8rem', fontWeight: 700 }}>
                          ឈ្មោះ / 姓名 ៖ {formData.employeeNameKh} ({formData.employeeNameEn})
                        </div>
                      </td>
                    </tr>
                  </tbody>
                </table>

                {/* ISO 9001:2015 Document Approval Matrix Footer */}
                <div style={{ border: '1px solid #cbd5e1', borderRadius: '6px', padding: '8px 12px', background: '#f8fafc', fontSize: '0.72rem' }}>
                  <div style={{ fontWeight: 800, color: '#0369a1', marginBottom: '4px' }}>
                    ការត្រួតពិនិត្យ និងអនុម័តឯកសារប្រព័ន្ធ ISO 9001:2015 (Document Control Approval Matrix) ៖
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', textAlign: 'center' }}>
                    <div style={{ border: '1px solid #e2e8f0', padding: '4px', background: '#fff', borderRadius: '4px' }}>
                      <div style={{ fontWeight: 700 }}>Prepared By / រៀបចំដោយ</div>
                      <div style={{ color: '#64748b' }}>HR Officer</div>
                      <div style={{ marginTop: '8px', fontSize: '0.68rem' }}>Sign: ________ Date: 01/01/2026</div>
                    </div>
                    <div style={{ border: '1px solid #e2e8f0', padding: '4px', background: '#fff', borderRadius: '4px' }}>
                      <div style={{ fontWeight: 700 }}>Reviewed By / ពិនិត្យដោយ</div>
                      <div style={{ color: '#64748b' }}>HR Manager / QMR</div>
                      <div style={{ marginTop: '8px', fontSize: '0.68rem' }}>Sign: ________ Date: 01/01/2026</div>
                    </div>
                    <div style={{ border: '1px solid #e2e8f0', padding: '4px', background: '#fff', borderRadius: '4px' }}>
                      <div style={{ fontWeight: 700 }}>Approved By / អនុម័តដោយ</div>
                      <div style={{ color: '#64748b' }}>General Manager</div>
                      <div style={{ marginTop: '8px', fontSize: '0.68rem' }}>Sign: ________ Date: 01/01/2026</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: EDIT FIELDS FREELY (អាចeditបានតាមចិត្ត) */}
          {activeTab === 'edit' && (
            <div
              style={{
                width: '100%',
                maxWidth: '850px',
                background: '#ffffff',
                borderRadius: '12px',
                padding: '24px',
                boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)',
                display: 'flex',
                flexDirection: 'column',
                gap: '18px',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e2e8f0', paddingBottom: '12px' }}>
                <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#0f172a', fontWeight: 800 }}>
                  ✏️ កែប្រែព័ត៌មានកិច្ចសន្យា ISO 9001:2015 តាមចិត្ត (Edit Contract Fields)
                </h3>
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={isSaving}
                  style={{
                    background: '#16a34a',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '8px 18px',
                    fontWeight: 700,
                    fontSize: '0.85rem',
                    cursor: 'pointer',
                  }}
                >
                  {isSaving ? 'កំពុងរក្សាទុក...' : '💾 រក្សាទុក (Apply Changes)'}
                </button>
              </div>

              {/* Quick Employee Selector */}
              {employees.length > 0 && (
                <div style={{ background: '#f0fdf4', padding: '12px', borderRadius: '8px', border: '1px solid #bbf7d0' }}>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#166534', marginBottom: '4px' }}>
                    ⚡ ជ្រើសរើសបុគ្គលិកពីប្រព័ន្ធដើម្បីបំពេញស្វ័យប្រវត្តិ (Quick Fill from Employee)
                  </label>
                  <select
                    onChange={handleSelectEmployee}
                    defaultValue=""
                    style={{ width: '100%', padding: '6px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
                  >
                    <option value="" disabled>-- ជ្រើសរើសបុគ្គលិក --</option>
                    {employees.map((emp) => (
                      <option key={emp.id} value={emp.id}>
                        {emp.employeeId} - {emp.firstNameKh || emp.firstNameEn} {emp.lastNameKh || emp.lastNameEn} ({emp.position || 'Worker'})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Company Info & ISO Meta */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px', background: '#f8fafc', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, marginBottom: '3px' }}>
                    ឈ្មោះក្រុមហ៊ុនជាភាសាខ្មែរ
                  </label>
                  <input
                    type="text"
                    value={formData.companyNameKh}
                    onChange={(e) => setFormData({ ...formData, companyNameKh: e.target.value })}
                    style={{ width: '100%', padding: '6px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.82rem' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, marginBottom: '3px' }}>
                    Company Name (English)
                  </label>
                  <input
                    type="text"
                    value={formData.companyNameEn}
                    onChange={(e) => setFormData({ ...formData, companyNameEn: e.target.value })}
                    style={{ width: '100%', padding: '6px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.82rem' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, marginBottom: '3px' }}>
                    Doc Code (លេខកូដទម្រង់ ISO)
                  </label>
                  <input
                    type="text"
                    value={formData.docCode}
                    onChange={(e) => setFormData({ ...formData, docCode: e.target.value })}
                    style={{ width: '100%', padding: '6px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.82rem' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, marginBottom: '3px' }}>
                    Revision (ការកែប្រែលើកទី)
                  </label>
                  <input
                    type="text"
                    value={formData.revision}
                    onChange={(e) => setFormData({ ...formData, revision: e.target.value })}
                    style={{ width: '100%', padding: '6px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.82rem' }}
                  />
                </div>
              </div>

              {/* Employee Details */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, marginBottom: '3px' }}>
                    ឈ្មោះបុគ្គលិកជាភាសាខ្មែរ *
                  </label>
                  <input
                    type="text"
                    value={formData.employeeNameKh}
                    onChange={(e) => setFormData({ ...formData, employeeNameKh: e.target.value })}
                    style={{ width: '100%', padding: '6px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, marginBottom: '3px' }}>
                    Employee Name (Latin/English)
                  </label>
                  <input
                    type="text"
                    value={formData.employeeNameEn}
                    onChange={(e) => setFormData({ ...formData, employeeNameEn: e.target.value })}
                    style={{ width: '100%', padding: '6px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, marginBottom: '3px' }}>
                    អត្តលេខ (Employee ID)
                  </label>
                  <input
                    type="text"
                    value={formData.employeeId}
                    onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })}
                    style={{ width: '100%', padding: '6px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, marginBottom: '3px' }}>
                    មុខតំណែង (Position)
                  </label>
                  <input
                    type="text"
                    value={formData.position}
                    onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                    style={{ width: '100%', padding: '6px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, marginBottom: '3px' }}>
                    អត្តសញ្ញាណប័ណ្ណ (ID Card)
                  </label>
                  <input
                    type="text"
                    value={formData.nationalId}
                    onChange={(e) => setFormData({ ...formData, nationalId: e.target.value })}
                    style={{ width: '100%', padding: '6px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, marginBottom: '3px' }}>
                    លេខកាត ប.ស.ស (NSSF No)
                  </label>
                  <input
                    type="text"
                    value={formData.nssfNo}
                    onChange={(e) => setFormData({ ...formData, nssfNo: e.target.value })}
                    style={{ width: '100%', padding: '6px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, marginBottom: '3px' }}>
                    ថ្ងៃខែឆ្នាំកំណើត (DOB)
                  </label>
                  <input
                    type="text"
                    value={formData.dob}
                    onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
                    style={{ width: '100%', padding: '6px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, marginBottom: '3px' }}>
                    អាយុ (Age)
                  </label>
                  <input
                    type="number"
                    value={formData.age}
                    onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                    style={{ width: '100%', padding: '6px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
                  />
                </div>
              </div>

              {/* Wage & Allowances */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px', background: '#f8fafc', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, marginBottom: '3px' }}>
                    ប្រាក់ឈ្នួលគោល ($/ខែ)
                  </label>
                  <input
                    type="number"
                    value={formData.basicSalaryUsd}
                    onChange={(e) => setFormData({ ...formData, basicSalaryUsd: e.target.value })}
                    style={{ width: '100%', padding: '6px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, marginBottom: '3px' }}>
                    ប្រាក់ឧស្សាហ៍ ($/ខែ)
                  </label>
                  <input
                    type="number"
                    value={formData.attendanceBonusUsd}
                    onChange={(e) => setFormData({ ...formData, attendanceBonusUsd: e.target.value })}
                    style={{ width: '100%', padding: '6px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, marginBottom: '3px' }}>
                    ប្រាក់ធ្វើដំណើរ ($/ខែ)
                  </label>
                  <input
                    type="number"
                    value={formData.transportAllowanceUsd}
                    onChange={(e) => setFormData({ ...formData, transportAllowanceUsd: e.target.value })}
                    style={{ width: '100%', padding: '6px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, marginBottom: '3px' }}>
                    ថ្លៃបាយ (រៀល/ថ្ងៃ)
                  </label>
                  <input
                    type="number"
                    value={formData.mealAllowanceRiel}
                    onChange={(e) => setFormData({ ...formData, mealAllowanceRiel: e.target.value })}
                    style={{ width: '100%', padding: '6px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
                  />
                </div>
              </div>

              {/* Dates */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, marginBottom: '3px' }}>
                    រយៈពេលសាកល្បង (ខែ)
                  </label>
                  <select
                    value={formData.probationDurationMonths}
                    onChange={(e) => setFormData({ ...formData, probationDurationMonths: parseInt(e.target.value, 10) })}
                    style={{ width: '100%', padding: '6px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
                  >
                    <option value={1}>១ ខែ (មិនជំនាញ / Non-specialized)</option>
                    <option value={2}>២ ខែ (កម្មករជំនាញ / Specialized Operator)</option>
                    <option value={3}>៣ ខែ (បុគ្គលិកការិយាល័យ/អ្នកគ្រប់គ្រង)</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, marginBottom: '3px' }}>
                    ថ្ងៃចាប់ផ្តើម (Start Date)
                  </label>
                  <input
                    type="text"
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    style={{ width: '100%', padding: '6px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, marginBottom: '3px' }}>
                    ថ្ងៃបញ្ចប់ (End Date)
                  </label>
                  <input
                    type="text"
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    style={{ width: '100%', padding: '6px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
                  />
                </div>
              </div>

              {/* Bottom buttons */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button
                  type="button"
                  onClick={() => setActiveTab('preview')}
                  style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#f8fafc', cursor: 'pointer' }}
                >
                  មើលគំរូទម្រង់ (Preview)
                </button>
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={isSaving}
                  style={{ padding: '8px 24px', borderRadius: '8px', border: 'none', background: '#16a34a', color: '#fff', fontWeight: 700, cursor: 'pointer' }}
                >
                  {isSaving ? 'កំពុងរក្សាទុក...' : '💾 រក្សាទុក (Apply Changes)'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Print Stylesheet for exact 4-page pagination */}
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #iso-contract-print-area,
          #iso-contract-print-area * {
            visibility: visible;
          }
          #iso-contract-print-area {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            max-width: 100% !important;
            padding: 0 !important;
            margin: 0 !important;
            box-shadow: none !important;
            background: #ffffff !important;
          }
          .iso-contract-page {
            box-shadow: none !important;
            padding: 12mm 15mm !important;
            min-height: 297mm !important;
            height: auto !important;
            page-break-after: always !important;
            page-break-inside: avoid !important;
            font-size: 9.5pt !important;
          }
          .no-print {
            display: none !important;
          }
          @page {
            size: A4 portrait;
            margin: 0;
          }
        }
      `}</style>
    </div>
  );
}
