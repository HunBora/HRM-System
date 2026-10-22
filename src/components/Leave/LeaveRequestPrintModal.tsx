'use client';

import React, { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import { generateLeaveFormDocxBlob, LeaveFormDocxData } from '@/lib/leaveDocx';

export interface LeaveFormData {
  companyName: string;
  logoUrl?: string;
  employeeName: string;
  employeeId?: string;
  gender: string;
  position: string;
  department: string;
  leaveType: 'SICK' | 'MARRIAGE' | 'FUNERAL' | 'MATERNITY' | 'ANNUAL' | 'OTHER' | 'UNPAID';
  otherReasonText?: string;
  duration: number | string;
  startDateStr: string;
  endDateStr: string;
  requestDateStr: string;
  managerDecision: 'APPROVED' | 'REJECTED' | 'PENDING';
  supervisorDecision: 'APPROVED' | 'REJECTED' | 'PENDING';
  hrDecision: 'APPROVED' | 'REJECTED' | 'PENDING';
  managerName?: string;
  supervisorName?: string;
  hrName?: string;
  notes?: string;
  layoutMode: 'STANDARD' | 'TWO_COPIES' | 'MODERN';
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  leaveRequest?: any;
  employees?: any[];
  companySettings?: any;
  onSave?: (updatedData: any) => Promise<void>;
}

// Convert numbers to Khmer digits (0-9 -> ០-៩)
function toKhmerDigits(num: number | string): string {
  const khmerDigits = ['០', '១', '២', '៣', '៤', '៥', '៦', '៧', '៨', '៩'];
  return String(num).replace(/[0-9]/g, (d) => khmerDigits[parseInt(d, 10)] || d);
}

export default function LeaveRequestPrintModal({
  isOpen,
  onClose,
  leaveRequest,
  employees = [],
  companySettings,
  onSave,
}: Props) {
  const [activeTab, setActiveTab] = useState<'preview' | 'edit'>('preview');
  const [isGeneratingDocx, setIsGeneratingDocx] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Initialize form state
  const [formData, setFormData] = useState<LeaveFormData>(() => initLeaveFormData(leaveRequest, companySettings));

  useEffect(() => {
    setFormData(initLeaveFormData(leaveRequest, companySettings));
  }, [leaveRequest, companySettings]);

  if (!isOpen) return null;

  function initLeaveFormData(req: any, settings: any): LeaveFormData {
    const emp = req?.employee || null;
    const empNameKh = emp ? `${emp.firstNameKh || ''} ${emp.lastNameKh || ''}`.trim() : '';
    const empNameEn = emp ? `${emp.firstNameEn || ''} ${emp.lastNameEn || ''}`.trim() : '';
    const finalEmpName = empNameKh || empNameEn || '';

    const genderKh = emp?.gender === 'FEMALE' ? 'ស្រី (F)' : emp?.gender === 'MALE' ? 'ប្រុស (M)' : '';

    // Map leave type
    let lType: any = 'ANNUAL';
    const rawType = (req?.leaveType || '').toUpperCase();
    if (rawType === 'SICK') lType = 'SICK';
    else if (rawType === 'MATERNITY') lType = 'MATERNITY';
    else if (rawType === 'MARRIAGE') lType = 'MARRIAGE';
    else if (rawType === 'FUNERAL') lType = 'FUNERAL';
    else if (rawType === 'OTHER') lType = 'OTHER';
    else if (rawType === 'UNPAID') lType = 'UNPAID';

    const startDateFormatted = req?.startDate ? new Date(req.startDate).toLocaleDateString('en-GB') : '';
    const endDateFormatted = req?.endDate ? new Date(req.endDate).toLocaleDateString('en-GB') : '';
    const todayFormatted = new Date().toLocaleDateString('en-GB');

    const defaultNotes = `១. យោងតាមមាត្រា ១៦៦-១៧០ នៃច្បាប់ស្តីពីការងារ ៖ កម្មករនិយោជិតមានសិទ្ធិឈប់សម្រាកលំហែកាយប្រចាំឆ្នាំ ១៨ថ្ងៃ (ក្នុងមួយឆ្នាំបំពេញការងារពេញលេញ) ដោយទទួលបានប្រាក់ឈ្នួលធម្មតា។
២. យោងតាមមាត្រា ១៦៩ ៖ ច្បាប់ឈប់សម្រាកពិសេសក្នុងគ្រួសារ (អាពាហ៍ពិពាហ៍, បុណ្យសព, សម្រាលកូន) អាចកាត់កងលើច្បាប់ប្រចាំឆ្នាំ ឬអនុវត្តតាមបទបញ្ជាផ្ទៃក្នុង។
៣. ក្នុងករណីសុំច្បាប់ឈឺចាប់ពី ០៣ ថ្ងៃឡើងទៅ ត្រូវភ្ជាប់មកជាមួយនូវវិញ្ញាបនបត្រពេទ្យស្របច្បាប់ទទួលស្គាល់ដោយក្រសួងសុខាភិបាល ឬ ប.ស.ស។`;

    return {
      companyName: settings?.companyName || 'វិទ្យាស្ថាន អេស.អេស.អិន (SSN COMPANY)',
      logoUrl: settings?.logoUrl || '',
      employeeName: finalEmpName,
      employeeId: emp?.employeeId || '',
      gender: genderKh || 'ប្រុស',
      position: emp?.position || 'បុគ្គលិក',
      department: emp?.department || 'រដ្ឋបាល',
      leaveType: lType,
      otherReasonText: req?.reason || '',
      duration: req?.duration || 1,
      startDateStr: startDateFormatted,
      endDateStr: endDateFormatted,
      requestDateStr: todayFormatted,
      managerDecision: req?.status === 'APPROVED' ? 'APPROVED' : req?.status === 'REJECTED' ? 'REJECTED' : 'PENDING',
      supervisorDecision: req?.status === 'APPROVED' ? 'APPROVED' : req?.status === 'REJECTED' ? 'REJECTED' : 'PENDING',
      hrDecision: req?.status === 'APPROVED' ? 'APPROVED' : req?.status === 'REJECTED' ? 'REJECTED' : 'PENDING',
      managerName: '',
      supervisorName: '',
      hrName: '',
      notes: defaultNotes,
      layoutMode: 'STANDARD',
    };
  }

  // Handle employee picker change
  const handleSelectEmployee = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedId = e.target.value;
    const foundEmp = employees.find((emp) => emp.id === selectedId);
    if (foundEmp) {
      const nameKh = `${foundEmp.firstNameKh || ''} ${foundEmp.lastNameKh || ''}`.trim();
      const nameEn = `${foundEmp.firstNameEn || ''} ${foundEmp.lastNameEn || ''}`.trim();
      setFormData((prev) => ({
        ...prev,
        employeeName: nameKh || nameEn,
        employeeId: foundEmp.employeeId || '',
        gender: foundEmp.gender === 'FEMALE' ? 'ស្រី' : 'ប្រុស',
        position: foundEmp.position || prev.position,
        department: foundEmp.department || prev.department,
      }));
    }
  };

  // Image Upload handler
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 4 * 1024 * 1024) {
        Swal.fire({ icon: 'warning', title: 'ទំហំរូបភាពធំពេក!', text: 'សូមជ្រើសរើសរូបភាពក្រោម 4MB' });
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        setFormData((prev) => ({
          ...prev,
          logoUrl: event.target?.result as string,
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  // Print function
  const handlePrint = () => {
    window.print();
  };

  // Word (.docx) export
  const handleExportDocx = async () => {
    setIsGeneratingDocx(true);
    try {
      const docxData: LeaveFormDocxData = {
        companyName: formData.companyName,
        employeeName: formData.employeeName,
        gender: formData.gender,
        position: formData.position,
        department: formData.department,
        employeeId: formData.employeeId,
        leaveType: formData.leaveType,
        reasonText: formData.otherReasonText,
        duration: formData.duration,
        startDateStr: formData.startDateStr,
        endDateStr: formData.endDateStr,
        requestDateStr: formData.requestDateStr,
        managerDecision: formData.managerDecision,
        supervisorDecision: formData.supervisorDecision,
        hrDecision: formData.hrDecision,
        managerName: formData.managerName,
        supervisorName: formData.supervisorName,
        hrName: formData.hrName,
        notes: formData.notes,
      };

      const blob = await generateLeaveFormDocxBlob(docxData);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `លិខិតសុំច្បាប់_${formData.employeeName.replace(/\s+/g, '_') || 'LeaveForm'}_${formData.startDateStr.replace(/\//g, '-')}.docx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      Swal.fire({
        icon: 'success',
        title: 'ទាញយក Word ជោគជ័យ!',
        text: 'ឯកសារលិខិតសុំច្បាប់ (.docx) ត្រូវបានបង្កើតរួចរាល់',
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
    if (onSave) {
      setIsSaving(true);
      try {
        await onSave(formData);
        Swal.fire({ icon: 'success', title: 'បានរក្សាទុកជោគជ័យ!', timer: 1500, showConfirmButton: false });
        setActiveTab('preview');
      } catch (err: any) {
        Swal.fire({ icon: 'error', title: 'មានបញ្ហា!', text: err.message });
      } finally {
        setIsSaving(false);
      }
    } else {
      Swal.fire({ icon: 'success', title: 'ទិន្នន័យត្រូវបានធ្វើបច្ចុប្បន្នភាពលើទម្រង់!', timer: 1200, showConfirmButton: false });
      setActiveTab('preview');
    }
  };

  // Render a Single Leave Form Sheet (used once for Standard, or twice for Two-Copies layout)
  const renderLeaveSlip = (copyTitle?: string) => {
    return (
      <div
        style={{
          background: '#ffffff',
          fontFamily: 'Khmer OS Siemreap, Siemreap, Kantumruy Pro, sans-serif',
          color: '#0f172a',
          lineHeight: 1.45,
          position: 'relative',
        }}
      >
        {/* Top Company Name Header Line */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', borderBottom: '1.5px solid #0f172a', paddingBottom: '4px', marginBottom: '10px' }}>
          <div style={{ fontFamily: 'Khmer OS Muol Light, Moul, serif', fontSize: '0.98rem', fontWeight: 800, color: '#0f172a' }}>
            {formData.companyName}
          </div>
          {copyTitle && (
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
              [{copyTitle}]
            </div>
          )}
        </div>

        {/* Header: Logo on Left, Royal Motto in Center */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr 1fr', alignItems: 'center', marginBottom: '10px' }}>
          {/* Logo on Left */}
          <div style={{ display: 'flex', alignItems: 'center' }}>
            {formData.logoUrl ? (
              <img src={formData.logoUrl} alt="Logo" style={{ maxHeight: '55px', maxWidth: '100px', objectFit: 'contain' }} />
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <div style={{ width: '42px', height: '42px', borderRadius: '50%', background: '#0284c7', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '1.1rem' }}>
                  👥
                </div>
                <div style={{ fontSize: '0.72rem', fontWeight: 800, color: '#0284c7', lineHeight: 1.2 }}>
                  SSN COMPANY
                </div>
              </div>
            )}
          </div>

          {/* Center Motto */}
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontFamily: 'Khmer OS Muol Light, Moul, serif', fontSize: '0.95rem', fontWeight: 700, color: '#0f172a' }}>
              ព្រះរាជាណាចក្រកម្ពុជា
            </div>
            <div style={{ fontFamily: 'Khmer OS Muol Light, Moul, serif', fontSize: '0.85rem', fontWeight: 700, color: '#0f172a', marginTop: '1px' }}>
              ជាតិ សាសនា ព្រះមហាក្សត្រ
            </div>
          </div>

          {/* Right space for balance or date */}
          <div style={{ textAlign: 'right', fontSize: '0.75rem', color: '#64748b' }}>
            {formData.requestDateStr && <div>កាលបរិច្ឆេទ ៖ {formData.requestDateStr}</div>}
          </div>
        </div>

        {/* Main Blue Banner Title (ដូចគំរូរូបភាព ១០០%) */}
        <table style={{ width: '100%', borderCollapse: 'collapse', border: '1.5px solid #0f172a', marginBottom: '0' }}>
          <thead>
            <tr>
              <th
                colSpan={2}
                style={{
                  backgroundColor: '#00629b',
                  color: '#ffffff',
                  fontFamily: 'Khmer OS Muol Light, Moul, serif',
                  fontSize: '1.1rem',
                  fontWeight: 800,
                  padding: '6px 10px',
                  textAlign: 'center',
                  letterSpacing: '1px',
                }}
              >
                លិខិតសុំច្បាប់
              </th>
            </tr>
          </thead>
          <tbody>
            {/* Row 1: Employee Name & Gender */}
            <tr>
              <td style={{ border: '1px solid #0f172a', padding: '6px 12px', width: '60%', fontSize: '0.88rem' }}>
                <span style={{ fontWeight: 700 }}>បុគ្គលិកឈ្មោះ ៖ </span>
                <span style={{ fontWeight: 600 }}>{formData.employeeName || '...........................................'}</span>
                {formData.employeeId && <span style={{ color: '#0369a1', fontSize: '0.8rem', marginLeft: '6px' }}>(ID: {formData.employeeId})</span>}
              </td>
              <td style={{ border: '1px solid #0f172a', padding: '6px 12px', width: '40%', fontSize: '0.88rem' }}>
                <span style={{ fontWeight: 700 }}>ភេទ ៖ </span>
                <span>{formData.gender || '.....................'}</span>
              </td>
            </tr>

            {/* Row 2: Position & Department */}
            <tr>
              <td style={{ border: '1px solid #0f172a', padding: '6px 12px', fontSize: '0.88rem' }}>
                <span style={{ fontWeight: 700 }}>តួនាទី ៖ </span>
                <span>{formData.position || '...........................................'}</span>
              </td>
              <td style={{ border: '1px solid #0f172a', padding: '6px 12px', fontSize: '0.88rem' }}>
                <span style={{ fontWeight: 700 }}>ផ្នែក ៖ </span>
                <span>{formData.department || '.....................'}</span>
              </td>
            </tr>

            {/* Row 3: Leave Reasons (Checkboxes complying with MLVT Labor Law) */}
            <tr>
              <td colSpan={2} style={{ border: '1px solid #0f172a', padding: '10px 14px', fontSize: '0.88rem' }}>
                <div style={{ fontWeight: 700, marginBottom: '6px', color: '#0f172a' }}>
                  មូលហេតុនៃការស្នើសុំច្បាប់ ៖
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', paddingLeft: '8px' }}>
                  {/* Option 1: ឈឺ */}
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={formData.leaveType === 'SICK'}
                      onChange={() => setFormData({ ...formData, leaveType: 'SICK' })}
                      style={{ width: '15px', height: '15px' }}
                    />
                    <span>ឈឺ (Sick Leave - មានវិញ្ញាបនបត្រពេទ្យ)</span>
                  </label>

                  {/* Option 2: អាពាហ៍ពិពាហ៍ */}
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={formData.leaveType === 'MARRIAGE'}
                      onChange={() => setFormData({ ...formData, leaveType: 'MARRIAGE' })}
                      style={{ width: '15px', height: '15px' }}
                    />
                    <span>អាពាហ៍ពិពាហ៍ (Marriage Leave - អាពាហ៍ពិពាហ៍ផ្ទាល់ខ្លួន / កូន - មាត្រា ១៦៩)</span>
                  </label>

                  {/* Option 3: ពិធីបុណ្យសព */}
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={formData.leaveType === 'FUNERAL'}
                      onChange={() => setFormData({ ...formData, leaveType: 'FUNERAL' })}
                      style={{ width: '15px', height: '15px' }}
                    />
                    <span>ពិធីបុណ្យសព (Funeral / Bereavement - ឪពុកម្តាយ ប្តីប្រពន្ធ កូន - មាត្រា ១៦៩)</span>
                  </label>

                  {/* Option 4: សម្រាលកូន */}
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={formData.leaveType === 'MATERNITY'}
                      onChange={() => setFormData({ ...formData, leaveType: 'MATERNITY' })}
                      style={{ width: '15px', height: '15px' }}
                    />
                    <span>សម្រាលកូន (Maternity / Paternity Leave - សម្រាលកូន ៩០ថ្ងៃ)</span>
                  </label>

                  {/* Option 5: សម្រាកលំហែកាយ */}
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={formData.leaveType === 'ANNUAL'}
                      onChange={() => setFormData({ ...formData, leaveType: 'ANNUAL' })}
                      style={{ width: '15px', height: '15px' }}
                    />
                    <span>សម្រាកលំហែកាយ (Annual Leave - សម្រាកប្រចាំឆ្នាំ ១៨ថ្ងៃ - មាត្រា ១៦៦)</span>
                  </label>

                  {/* Option 6: ផ្សេងៗ */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '2px' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', whiteSpace: 'nowrap' }}>
                      <input
                        type="checkbox"
                        checked={formData.leaveType === 'OTHER' || formData.leaveType === 'UNPAID'}
                        onChange={() => setFormData({ ...formData, leaveType: 'OTHER' })}
                        style={{ width: '15px', height: '15px' }}
                      />
                      <span>ផ្សេងៗ ៖</span>
                    </label>
                    <span style={{ borderBottom: '1px dotted #0f172a', flex: 1, paddingLeft: '6px', minHeight: '20px' }}>
                      {formData.otherReasonText || '......................................................................................................................'}
                    </span>
                  </div>
                </div>
              </td>
            </tr>

            {/* Row 4: Total days */}
            <tr>
              <td style={{ border: '1px solid #0f172a', padding: '6px 12px', fontWeight: 700, width: '35%', fontSize: '0.88rem' }}>
                ចំនួនថ្ងៃឈប់
              </td>
              <td style={{ border: '1px solid #0f172a', padding: '6px 12px', width: '65%', fontSize: '0.9rem', fontWeight: 800, color: '#0369a1' }}>
                {formData.duration ? `${toKhmerDigits(formData.duration)} ថ្ងៃ (${formData.duration} Day${Number(formData.duration) > 1 ? 's' : ''})` : '................................................'}
              </td>
            </tr>

            {/* Row 5: Start Date */}
            <tr>
              <td style={{ border: '1px solid #0f172a', padding: '6px 12px', fontWeight: 700, fontSize: '0.88rem' }}>
                ចាប់ពីថ្ងៃទី
              </td>
              <td style={{ border: '1px solid #0f172a', padding: '6px 12px', fontSize: '0.88rem' }}>
                {formData.startDateStr || '................................................'}
              </td>
            </tr>

            {/* Row 6: End Date */}
            <tr>
              <td style={{ border: '1px solid #0f172a', padding: '6px 12px', fontWeight: 700, fontSize: '0.88rem' }}>
                ដល់ថ្ងៃទី
              </td>
              <td style={{ border: '1px solid #0f172a', padding: '6px 12px', fontSize: '0.88rem' }}>
                {formData.endDateStr || '................................................'}
              </td>
            </tr>

            {/* Row 7: Request Date */}
            <tr>
              <td style={{ border: '1px solid #0f172a', padding: '6px 12px', fontWeight: 700, fontSize: '0.88rem' }}>
                ថ្ងៃស្នើសុំច្បាប់
              </td>
              <td style={{ border: '1px solid #0f172a', padding: '6px 12px', fontSize: '0.88rem' }}>
                {formData.requestDateStr || '................................................'}
              </td>
            </tr>

            {/* Row 8: Employee Signature */}
            <tr>
              <td colSpan={2} style={{ border: '1px solid #0f172a', padding: '8px 12px' }}>
                <div style={{ fontWeight: 700, fontSize: '0.88rem', marginBottom: '35px' }}>
                  ហត្ថលេខាបុគ្គលិក ៖
                </div>
                <div style={{ textAlign: 'right', fontSize: '0.8rem', color: '#64748b' }}>
                  ...................................................
                </div>
              </td>
            </tr>
          </tbody>
        </table>

        {/* 3-Tier Approval Table: Manager / Supervisor / HR (ដូចគំរូរូបភាព ១០០%) */}
        <table style={{ width: '100%', borderCollapse: 'collapse', border: '1.5px solid #0f172a', borderTop: 'none', marginBottom: '0' }}>
          <thead>
            <tr style={{ backgroundColor: '#f8fafc' }}>
              <th style={{ border: '1px solid #0f172a', width: '33.3%', padding: '6px', textAlign: 'center', fontSize: '0.86rem', fontWeight: 800 }}>
                Manager<br />
                <span style={{ fontSize: '0.78rem', fontWeight: 600, color: '#475569' }}>(អ្នកគ្រប់គ្រង)</span>
              </th>
              <th style={{ border: '1px solid #0f172a', width: '33.3%', padding: '6px', textAlign: 'center', fontSize: '0.86rem', fontWeight: 800 }}>
                Supervisor<br />
                <span style={{ fontSize: '0.78rem', fontWeight: 600, color: '#475569' }}>(ប្រធានផ្នែក/មេការ)</span>
              </th>
              <th style={{ border: '1px solid #0f172a', width: '33.4%', padding: '6px', textAlign: 'center', fontSize: '0.86rem', fontWeight: 800 }}>
                HR<br />
                <span style={{ fontSize: '0.78rem', fontWeight: 600, color: '#475569' }}>(ធនធានមនុស្ស)</span>
              </th>
            </tr>
          </thead>
          <tbody>
            <tr>
              {/* Manager Column */}
              <td style={{ border: '1px solid #0f172a', padding: '8px 10px', verticalAlign: 'top', fontSize: '0.82rem' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={formData.managerDecision === 'APPROVED'}
                      onChange={() => setFormData({ ...formData, managerDecision: 'APPROVED' })}
                      style={{ width: '14px', height: '14px' }}
                    />
                    <span>អនុញ្ញាត</span>
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={formData.managerDecision === 'REJECTED'}
                      onChange={() => setFormData({ ...formData, managerDecision: 'REJECTED' })}
                      style={{ width: '14px', height: '14px' }}
                    />
                    <span>មិនអនុញ្ញាត</span>
                  </label>
                </div>
                <div style={{ height: '35px' }}></div>
                <div style={{ fontSize: '0.78rem', color: '#475569', borderTop: '1px dotted #cbd5e1', paddingTop: '4px' }}>
                  ហត្ថលេខា ៖ {formData.managerName || '....................'}
                </div>
              </td>

              {/* Supervisor Column */}
              <td style={{ border: '1px solid #0f172a', padding: '8px 10px', verticalAlign: 'top', fontSize: '0.82rem' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={formData.supervisorDecision === 'APPROVED'}
                      onChange={() => setFormData({ ...formData, supervisorDecision: 'APPROVED' })}
                      style={{ width: '14px', height: '14px' }}
                    />
                    <span>អនុញ្ញាត</span>
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={formData.supervisorDecision === 'REJECTED'}
                      onChange={() => setFormData({ ...formData, supervisorDecision: 'REJECTED' })}
                      style={{ width: '14px', height: '14px' }}
                    />
                    <span>មិនអនុញ្ញាត</span>
                  </label>
                </div>
                <div style={{ height: '35px' }}></div>
                <div style={{ fontSize: '0.78rem', color: '#475569', borderTop: '1px dotted #cbd5e1', paddingTop: '4px' }}>
                  ហត្ថលេខា ៖ {formData.supervisorName || '....................'}
                </div>
              </td>

              {/* HR Column */}
              <td style={{ border: '1px solid #0f172a', padding: '8px 10px', verticalAlign: 'top', fontSize: '0.82rem' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={formData.hrDecision === 'APPROVED'}
                      onChange={() => setFormData({ ...formData, hrDecision: 'APPROVED' })}
                      style={{ width: '14px', height: '14px' }}
                    />
                    <span>អនុញ្ញាត</span>
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={formData.hrDecision === 'REJECTED'}
                      onChange={() => setFormData({ ...formData, hrDecision: 'REJECTED' })}
                      style={{ width: '14px', height: '14px' }}
                    />
                    <span>មិនអនុញ្ញាត</span>
                  </label>
                </div>
                <div style={{ height: '35px' }}></div>
                <div style={{ fontSize: '0.78rem', color: '#475569', borderTop: '1px dotted #cbd5e1', paddingTop: '4px' }}>
                  ហត្ថលេខា ៖ {formData.hrName || '....................'}
                </div>
              </td>
            </tr>
          </tbody>
        </table>

        {/* Bottom Box: បញ្ជាក់ / MLVT Labor Law Compliance Remarks */}
        <div style={{ border: '1.5px solid #0f172a', borderTop: 'none', padding: '8px 12px', fontSize: '0.78rem', color: '#334155' }}>
          <div style={{ fontWeight: 800, color: '#0f172a', marginBottom: '2px' }}>
            បញ្ជាក់ (MLVT Labor Law Compliance Remarks) ៖
          </div>
          <div style={{ whiteSpace: 'pre-line', lineHeight: 1.45 }}>
            {formData.notes}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(15, 23, 42, 0.75)',
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
          maxWidth: '1080px',
          height: '92vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          overflow: 'hidden',
          border: '1px solid #cbd5e1',
        }}
      >
        {/* Top Control Header */}
        <div
          className="no-print"
          style={{
            background: '#ffffff',
            padding: '14px 20px',
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
              <span style={{ fontSize: '1.4rem' }}>📄</span>
              <h2 style={{ margin: 0, fontSize: '1.2rem', color: '#0f172a', fontWeight: 800 }}>
                ទម្រង់លិខិតសុំច្បាប់ផ្លូវការ (Official Leave Application Form)
              </h2>
            </div>
            <p style={{ margin: '2px 0 0 0', fontSize: '0.82rem', color: '#64748b' }}>
              អនុលោមតាមច្បាប់ស្តីពីការងារនៃព្រះរាជាណាចក្រកម្ពុជា • មាត្រា ១៦៦-១៧០ & មាត្រា ១៦៩
            </p>
          </div>

          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
            {/* View / Edit Mode Switcher */}
            <div style={{ background: '#f1f5f9', borderRadius: '8px', padding: '3px', display: 'flex', gap: '3px' }}>
              <button
                type="button"
                onClick={() => setActiveTab('preview')}
                style={{
                  padding: '6px 14px',
                  borderRadius: '6px',
                  border: 'none',
                  background: activeTab === 'preview' ? '#ffffff' : 'transparent',
                  color: activeTab === 'preview' ? '#0284c7' : '#64748b',
                  fontWeight: 700,
                  fontSize: '0.82rem',
                  cursor: 'pointer',
                  boxShadow: activeTab === 'preview' ? '0 1px 2px rgba(0,0,0,0.06)' : 'none',
                }}
              >
                👁️ មើលទម្រង់ (Preview)
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('edit')}
                style={{
                  padding: '6px 14px',
                  borderRadius: '6px',
                  border: 'none',
                  background: activeTab === 'edit' ? '#ffffff' : 'transparent',
                  color: activeTab === 'edit' ? '#0284c7' : '#64748b',
                  fontWeight: 700,
                  fontSize: '0.82rem',
                  cursor: 'pointer',
                  boxShadow: activeTab === 'edit' ? '0 1px 2px rgba(0,0,0,0.06)' : 'none',
                }}
              >
                ✏️ កែប្រែតាមចិត្ត (Edit Fields)
              </button>
            </div>

            {/* Print Button */}
            <button
              type="button"
              onClick={handlePrint}
              style={{
                background: '#1e293b',
                color: '#fff',
                border: 'none',
                borderRadius: '8px',
                padding: '8px 14px',
                fontSize: '0.82rem',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              🖨️ បោះពុម្ព (Print / PDF)
            </button>

            {/* Word Export */}
            <button
              type="button"
              onClick={handleExportDocx}
              disabled={isGeneratingDocx}
              style={{
                background: '#0284c7',
                color: '#fff',
                border: 'none',
                borderRadius: '8px',
                padding: '8px 14px',
                fontSize: '0.82rem',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              📄 {isGeneratingDocx ? 'កំពុងបង្កើត...' : 'Word (.docx)'}
            </button>

            {/* Close Button */}
            <button
              type="button"
              onClick={onClose}
              style={{
                background: '#fee2e2',
                color: '#dc2626',
                border: 'none',
                borderRadius: '8px',
                padding: '8px 12px',
                fontSize: '0.85rem',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              ✕ បិទ
            </button>
          </div>
        </div>

        {/* Layout Options Toolbar */}
        <div
          className="no-print"
          style={{
            background: '#ffffff',
            padding: '8px 20px',
            borderBottom: '1px solid #e2e8f0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
            flexWrap: 'wrap',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#475569' }}>
              📐 ទម្រង់បោះពុម្ព ៖
            </span>
            <button
              type="button"
              onClick={() => setFormData({ ...formData, layoutMode: 'STANDARD' })}
              style={{
                padding: '4px 10px',
                borderRadius: '6px',
                border: formData.layoutMode === 'STANDARD' ? '2px solid #0284c7' : '1px solid #cbd5e1',
                background: formData.layoutMode === 'STANDARD' ? '#e0f2fe' : '#f8fafc',
                color: formData.layoutMode === 'STANDARD' ? '#0369a1' : '#475569',
                fontWeight: 600,
                fontSize: '0.78rem',
                cursor: 'pointer',
              }}
            >
              📋 ១ ច្បាប់ពេញ A4 (Standard Full Sheet)
            </button>
            <button
              type="button"
              onClick={() => setFormData({ ...formData, layoutMode: 'TWO_COPIES' })}
              style={{
                padding: '4px 10px',
                borderRadius: '6px',
                border: formData.layoutMode === 'TWO_COPIES' ? '2px solid #0284c7' : '1px solid #cbd5e1',
                background: formData.layoutMode === 'TWO_COPIES' ? '#e0f2fe' : '#f8fafc',
                color: formData.layoutMode === 'TWO_COPIES' ? '#0369a1' : '#475569',
                fontWeight: 600,
                fontSize: '0.78rem',
                cursor: 'pointer',
              }}
              title="សន្សំក្រដាស ៖ ២ ច្បាប់លើក្រដាស A4 តែមួយ (ច្បាប់ដើមសម្រាប់ HR និងច្បាប់ចម្លងសម្រាប់បុគ្គលិក)"
            >
              ✂️ ២ ច្បាប់លើ ១ សន្លឹក A4 (2 Copies / Sheet)
            </button>
          </div>

          {/* Quick Employee Selector if employees are provided */}
          {employees.length > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#475569' }}>
                ជ្រើសរើសបុគ្គលិក ៖
              </span>
              <select
                onChange={handleSelectEmployee}
                defaultValue=""
                style={{ padding: '4px 8px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.8rem' }}
              >
                <option value="" disabled>-- ជ្រើសរើសបុគ្គលិកដើម្បីបំពេញស្វ័យប្រវត្តិ --</option>
                {employees.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.employeeId} - {emp.firstNameKh || emp.firstNameEn} {emp.lastNameKh || emp.lastNameEn}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Modal Body Container */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '24px',
            display: 'flex',
            justifyContent: 'center',
            background: '#cbd5e1',
          }}
        >
          {/* TAB 1: PREVIEW */}
          {activeTab === 'preview' && (
            <div
              id="leave-form-print-area"
              style={{
                width: '100%',
                maxWidth: '794px',
                minHeight: '1123px',
                background: '#ffffff',
                boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)',
                padding: formData.layoutMode === 'TWO_COPIES' ? '20px 32px' : '36px 44px',
                boxSizing: 'border-box',
              }}
            >
              {formData.layoutMode === 'STANDARD' ? (
                renderLeaveSlip()
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  {/* Top Copy: HR Copy */}
                  {renderLeaveSlip('ច្បាប់ដើមរក្សាទុកនៅ HR (Original - HR Copy)')}

                  {/* Cut Divider */}
                  <div style={{ textAlign: 'center', fontSize: '0.72rem', color: '#94a3b8', borderTop: '1.5px dashed #64748b', paddingTop: '6px' }}>
                    ✂️ --------------------------- កាត់ត្រង់នេះ (TEAR OFF HERE) --------------------------- ✂️
                  </div>

                  {/* Bottom Copy: Employee Copy */}
                  {renderLeaveSlip('ច្បាប់ប្រគល់ជូនបុគ្គលិក (Duplicate - Employee Copy)')}
                </div>
              )}
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
                  ✏️ កែប្រែព័ត៌មានលិខិតសុំច្បាប់តាមចិត្ត (Customize Leave Form)
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
                    fontSize: '0.88rem',
                    cursor: 'pointer',
                  }}
                >
                  {isSaving ? 'កំពុងរក្សាទុក...' : '💾 រក្សាទុក (Apply Changes)'}
                </button>
              </div>

              {/* 1. Company Name & Logo */}
              <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '14px', background: '#f8fafc', padding: '14px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, marginBottom: '4px' }}>
                    ឈ្មោះក្រុមហ៊ុន / វិទ្យាស្ថាន (Company / Institute Name)
                  </label>
                  <input
                    type="text"
                    value={formData.companyName}
                    onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.88rem' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, marginBottom: '4px' }}>
                    🖼️ ផ្លាស់ប្តូរ Logo (Upload Logo)
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleLogoUpload}
                    style={{ fontSize: '0.8rem', width: '100%' }}
                  />
                </div>
              </div>

              {/* 2. Employee Info */}
              <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, marginBottom: '4px' }}>
                    បុគ្គលិកឈ្មោះ (Employee Name) *
                  </label>
                  <input
                    type="text"
                    value={formData.employeeName}
                    onChange={(e) => setFormData({ ...formData, employeeName: e.target.value })}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.88rem' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, marginBottom: '4px' }}>
                    អត្តលេខ (ID)
                  </label>
                  <input
                    type="text"
                    value={formData.employeeId || ''}
                    onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.88rem' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, marginBottom: '4px' }}>
                    ភេទ (Gender)
                  </label>
                  <select
                    value={formData.gender}
                    onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.88rem' }}
                  >
                    <option value="ប្រុស">ប្រុស (Male)</option>
                    <option value="ស្រី">ស្រី (Female)</option>
                  </select>
                </div>
              </div>

              {/* 3. Position & Department */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, marginBottom: '4px' }}>
                    តួនាទី (Position)
                  </label>
                  <input
                    type="text"
                    value={formData.position}
                    onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.88rem' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, marginBottom: '4px' }}>
                    ផ្នែក (Department)
                  </label>
                  <input
                    type="text"
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.88rem' }}
                  />
                </div>
              </div>

              {/* 4. Leave Type Selection */}
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '6px' }}>
                  ប្រភេទនៃការសុំច្បាប់ (Leave Type / MLVT Compliance)
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '8px', background: '#f8fafc', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                  {[
                    { id: 'SICK', label: 'ឈឺ (Sick Leave)' },
                    { id: 'MARRIAGE', label: 'អាពាហ៍ពិពាហ៍ (Marriage - មាត្រា ១៦៩)' },
                    { id: 'FUNERAL', label: 'ពិធីបុណ្យសព (Funeral - មាត្រា ១៦៩)' },
                    { id: 'MATERNITY', label: 'សម្រាលកូន (Maternity Leave)' },
                    { id: 'ANNUAL', label: 'សម្រាកលំហែកាយ (Annual - មាត្រា ១៦៦)' },
                    { id: 'OTHER', label: 'ផ្សេងៗ (Other Reason)' },
                  ].map((lt) => (
                    <label key={lt.id} style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '0.85rem' }}>
                      <input
                        type="radio"
                        name="leaveTypeRadio"
                        checked={formData.leaveType === lt.id}
                        onChange={() => setFormData({ ...formData, leaveType: lt.id as any })}
                      />
                      <span>{lt.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Other Reason Text */}
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, marginBottom: '4px' }}>
                  មូលហេតុលម្អិត / ផ្សេងៗ (Reason Details)
                </label>
                <input
                  type="text"
                  placeholder="មូលហេតុបន្ថែម..."
                  value={formData.otherReasonText || ''}
                  onChange={(e) => setFormData({ ...formData, otherReasonText: e.target.value })}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.88rem' }}
                />
              </div>

              {/* 5. Dates & Duration */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, marginBottom: '4px' }}>
                    ចំនួនថ្ងៃឈប់ (Duration Days) *
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    min="0.5"
                    value={formData.duration}
                    onChange={(e) => setFormData({ ...formData, duration: parseFloat(e.target.value) || '' })}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.88rem' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, marginBottom: '4px' }}>
                    ចាប់ពីថ្ងៃទី (Start Date)
                  </label>
                  <input
                    type="text"
                    placeholder="DD/MM/YYYY"
                    value={formData.startDateStr}
                    onChange={(e) => setFormData({ ...formData, startDateStr: e.target.value })}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.88rem' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, marginBottom: '4px' }}>
                    ដល់ថ្ងៃទី (End Date)
                  </label>
                  <input
                    type="text"
                    placeholder="DD/MM/YYYY"
                    value={formData.endDateStr}
                    onChange={(e) => setFormData({ ...formData, endDateStr: e.target.value })}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.88rem' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, marginBottom: '4px' }}>
                    ថ្ងៃស្នើសុំច្បាប់ (Request Date)
                  </label>
                  <input
                    type="text"
                    placeholder="DD/MM/YYYY"
                    value={formData.requestDateStr}
                    onChange={(e) => setFormData({ ...formData, requestDateStr: e.target.value })}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.88rem' }}
                  />
                </div>
              </div>

              {/* 6. Signatory Names */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, marginBottom: '4px' }}>
                    ឈ្មោះ Manager (អ្នកគ្រប់គ្រង)
                  </label>
                  <input
                    type="text"
                    placeholder="ឈ្មោះអ្នកគ្រប់គ្រង..."
                    value={formData.managerName || ''}
                    onChange={(e) => setFormData({ ...formData, managerName: e.target.value })}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, marginBottom: '4px' }}>
                    ឈ្មោះ Supervisor (ប្រធានផ្នែក)
                  </label>
                  <input
                    type="text"
                    placeholder="ឈ្មោះប្រធានផ្នែក..."
                    value={formData.supervisorName || ''}
                    onChange={(e) => setFormData({ ...formData, supervisorName: e.target.value })}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, marginBottom: '4px' }}>
                    ឈ្មោះ HR (ធនធានមនុស្ស)
                  </label>
                  <input
                    type="text"
                    placeholder="ឈ្មោះមន្ត្រី HR..."
                    value={formData.hrName || ''}
                    onChange={(e) => setFormData({ ...formData, hrName: e.target.value })}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
                  />
                </div>
              </div>

              {/* 7. MLVT Remarks */}
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, marginBottom: '4px' }}>
                  បញ្ជាក់ / កំណត់សម្គាល់ច្បាប់ការងារ (MLVT Labor Law Compliance Remarks)
                </label>
                <textarea
                  rows={4}
                  value={formData.notes || ''}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
                />
              </div>

              {/* Bottom Actions */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button
                  type="button"
                  onClick={() => setActiveTab('preview')}
                  style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#f8fafc', cursor: 'pointer' }}
                >
                  មើលគំរូឡើងវិញ (Preview)
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

      {/* Print Stylesheet */}
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #leave-form-print-area,
          #leave-form-print-area * {
            visibility: visible;
          }
          #leave-form-print-area {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            max-width: 100% !important;
            padding: 10mm 15mm !important;
            box-shadow: none !important;
            background: #ffffff !important;
            page-break-after: avoid;
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
