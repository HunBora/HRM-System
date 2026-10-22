'use client';

import React, { useState, useRef, useEffect } from 'react';
import Swal from 'sweetalert2';
import { QRCodeSVG } from 'qrcode.react';
import { generateAnnouncementDocxBlob, JobAnnouncementDocxData } from '@/lib/recruitmentDocx';

export interface JobAnnouncementData {
  templateStyle: 'GOVERNMENT' | 'CORPORATE' | 'NGO' | 'CREATIVE_POSTER';
  parentOrgKh: string;
  departmentKh: string;
  refNo: string;
  cityDateKh: string;
  jobTitle: string;
  jobCategoryKh: string;
  vacanciesCount: string;
  targetAudienceKh: string;
  workLocationKh: string;
  introParagraphKh: string;
  qualifications: string[];
  benefits: string[];
  requiredDocs: { name: string; copies: string }[];
  submissionParagraphKh: string;
  contactPersons: { name: string; phone: string; note?: string }[];
  signatoryTitleKh: string;
  signatoryNameKh: string;
  logoUrl?: string;
  stampUrl?: string;
  bannerUrl?: string;
  qrCodeUrl?: string;
  showNationalMotto: boolean;
  showLogo: boolean;
  showStamp: boolean;
  showQrCode: boolean;
  useDefaultStamp: boolean;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  job: any;
  companySettings?: any;
  onSave?: (updatedRequirementsJson: string) => Promise<void>;
}

// Convert numbers to Khmer digits (0-9 -> ០-៩)
export function toKhmerDigits(num: number | string): string {
  const khmerDigits = ['០', '១', '២', '៣', '៤', '៥', '៦', '៧', '៨', '៩'];
  return String(num).replace(/[0-9]/g, (d) => khmerDigits[parseInt(d, 10)] || d);
}

// Format date to Khmer format (e.g. ថ្ងៃទី១៩ ខែកក្កដា ឆ្នាំ២០២៦)
export function formatKhmerDate(dateInput: Date | string): string {
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return '';
  const day = toKhmerDigits(d.getDate());
  const monthNames = ['មករា', 'កុម្ភៈ', 'មីនា', 'មេសា', 'ឧសភា', 'មិថុនា', 'កក្កដា', 'សីហា', 'កញ្ញា', 'តុលា', 'វិច្ឆិកា', 'ធ្នូ'];
  const month = monthNames[d.getMonth()];
  const year = toKhmerDigits(d.getFullYear());
  return `ថ្ងៃទី${day} ខែ${month} ឆ្នាំ${year}`;
}

export default function RecruitmentAnnouncementModal({ isOpen, onClose, job, companySettings, onSave }: Props) {
  const [activeTab, setActiveTab] = useState<'preview' | 'edit'>('preview');
  const [templateStyle, setTemplateStyle] = useState<'GOVERNMENT' | 'CORPORATE' | 'NGO' | 'CREATIVE_POSTER'>('GOVERNMENT');
  const [isSaving, setIsSaving] = useState(false);
  const [isGeneratingDocx, setIsGeneratingDocx] = useState(false);

  // Parse or initialize announcement data
  const [announcement, setAnnouncement] = useState<JobAnnouncementData>(() => {
    return initAnnouncementData(job, companySettings);
  });

  // Re-sync when job changes
  useEffect(() => {
    if (job) {
      const data = initAnnouncementData(job, companySettings);
      setAnnouncement(data);
      setTemplateStyle(data.templateStyle || 'GOVERNMENT');
    }
  }, [job, companySettings]);

  if (!isOpen || !job) return null;

  function initAnnouncementData(currentJob: any, settings: any): JobAnnouncementData {
    // Check if currentJob.requirements contains JSON
    if (currentJob?.requirements && currentJob.requirements.startsWith('{') && currentJob.requirements.includes('__announcement')) {
      try {
        const parsed = JSON.parse(currentJob.requirements);
        return {
          templateStyle: parsed.templateStyle || 'GOVERNMENT',
          parentOrgKh: parsed.parentOrgKh || settings?.companyName || 'ក្រសួងសេដ្ឋកិច្ច និង ហិរញ្ញវត្ថុ',
          departmentKh: parsed.departmentKh || currentJob.department || 'អគ្គនាយកដ្ឋានពន្ធដារ',
          refNo: parsed.refNo || `១២១៧៦ អពដ`,
          cityDateKh: parsed.cityDateKh || `រាជធានីភ្នំពេញ, ${formatKhmerDate(new Date())}`,
          jobTitle: parsed.jobTitle || currentJob.title || 'បុគ្គលិកចុះបញ្ជី',
          jobCategoryKh: parsed.jobCategoryKh || (currentJob.type === 'CONTRACT' ? 'បុគ្គលិកជាប់កិច្ចសន្យា' : 'បុគ្គលិកពេញសិទ្ធិ'),
          vacanciesCount: parsed.vacanciesCount || '១០០',
          targetAudienceKh: parsed.targetAudienceKh || 'និស្សិត ដែលបានបញ្ចប់ការសិក្សាថ្នាក់បរិញ្ញាបត្រឡើងទៅ នៅតាមគ្រឹះស្ថានឧត្តមសិក្សានានា',
          workLocationKh: parsed.workLocationKh || currentJob.location || 'នៅតាមសាខាពន្ធដារខេត្ត-ខណ្ឌទាំងអស់',
          introParagraphKh: parsed.introParagraphKh || '',
          qualifications: parsed.qualifications || [],
          benefits: parsed.benefits || [],
          requiredDocs: parsed.requiredDocs || [],
          submissionParagraphKh: parsed.submissionParagraphKh || '',
          contactPersons: parsed.contactPersons || [],
          signatoryTitleKh: parsed.signatoryTitleKh || currentJob.department || settings?.companyName || 'អគ្គនាយកដ្ឋានពន្ធដារ',
          signatoryNameKh: parsed.signatoryNameKh || '',
          logoUrl: parsed.logoUrl !== undefined ? parsed.logoUrl : (settings?.logoUrl || ''),
          stampUrl: parsed.stampUrl || '',
          bannerUrl: parsed.bannerUrl || '',
          qrCodeUrl: parsed.qrCodeUrl || settings?.telegramLink || '',
          showNationalMotto: parsed.showNationalMotto !== undefined ? parsed.showNationalMotto : true,
          showLogo: parsed.showLogo !== undefined ? parsed.showLogo : true,
          showStamp: parsed.showStamp !== undefined ? parsed.showStamp : true,
          showQrCode: parsed.showQrCode !== undefined ? parsed.showQrCode : true,
          useDefaultStamp: parsed.useDefaultStamp !== undefined ? parsed.useDefaultStamp : true,
        };
      } catch (e) {
        // Fallback to default
      }
    }

    // Default template matching the user's uploaded sample (General Department of Taxation announcement)
    const closingDateKh = currentJob.closingDate ? formatKhmerDate(currentJob.closingDate) : 'ថ្ងៃកំណត់ជូនដំណឹង';
    const parentOrg = settings?.companyName || 'ក្រសួងសេដ្ឋកិច្ច និង ហិរញ្ញវត្ថុ';
    const dept = currentJob.department || 'អគ្គនាយកដ្ឋានពន្ធដារ';
    const jobTitle = currentJob.title || 'បុគ្គលិកចុះបញ្ជី និងធ្វើបច្ចុប្បន្នភាពព័ត៌មាន';

    return {
      templateStyle: 'GOVERNMENT',
      parentOrgKh: parentOrg,
      departmentKh: dept,
      refNo: `១២១៧៦ អពដ`,
      cityDateKh: `រាជធានីភ្នំពេញ, ${formatKhmerDate(new Date())}`,
      jobTitle: jobTitle,
      jobCategoryKh: currentJob.type === 'CONTRACT' ? 'បុគ្គលិកជាប់កិច្ចសន្យា' : 'បុគ្គលិកពេញសិទ្ធិ',
      vacanciesCount: '១០០',
      targetAudienceKh: 'និស្សិត ដែលបានបញ្ចប់ការសិក្សាថ្នាក់បរិញ្ញាបត្រឡើងទៅ នៅតាមគ្រឹះស្ថានឧត្តមសិក្សានានា',
      workLocationKh: currentJob.location || 'នៅតាមសាខាពន្ធដារខេត្ត-ខណ្ឌទាំងអស់',
      introParagraphKh: `${dept} សូមជម្រាបដល់និស្សិត ដែលបានបញ្ចប់ការសិក្សាថ្នាក់បរិញ្ញាបត្រឡើងទៅ នៅតាមគ្រឹះស្ថានឧត្តមសិក្សានានា មេត្តាជ្រាបថា ${dept} ត្រូវការជ្រើសរើសបុគ្គលិកជាប់កិច្ចសន្យាចំនួន ១០០នាក់ ដែលមានសមត្ថភាពគ្រប់គ្រាន់ សម្រាប់បម្រើការងារចុះបញ្ជី និងធ្វើបច្ចុប្បន្នភាពព័ត៌មានអចលនទ្រព្យ ចូលក្នុងប្រព័ន្ធគ្រប់គ្រងទិន្នន័យ នៃ${dept} នៅតាមសាខាពន្ធដារខេត្ត-ខណ្ឌទាំងអស់។`,
      qualifications: [
        'បេក្ខជនដែលបានបញ្ចប់ការសិក្សាថ្នាក់បរិញ្ញាបត្រឡើងទៅ',
        'ត្រូវមានជំនាញ គណនេយ្យ ធនាគារនិងហិរញ្ញវត្ថុ សេដ្ឋកិច្ច ច្បាប់ គ្រប់គ្រង វិទ្យាសាស្ត្រកុំព្យូទ័រ ឬវិស័យពាក់ព័ន្ធ',
        'មានសមត្ថភាពអាចប្រើប្រាស់ និងបញ្ចូលទិន្នន័យក្នុងប្រព័ន្ធកុំព្យូទ័របាន',
        'មានសមត្ថភាពសរសេរអក្សរខ្មែរបានត្រឹមត្រូវ និងច្បាស់លាស់',
        'មានឆន្ទៈក្នុងការបំពេញការងារយ៉ាងមោះមុត។',
      ],
      benefits: [
        'ប្រាក់បៀវត្សសមរម្យ និង ទទួលបានអត្ថប្រយោជន៍បន្ថែម',
        'បទពិសោធន៍ការងារទាក់ទងនឹងវិស័យពន្ធដារនៅកម្ពុជា',
        'លិខិតបញ្ជាក់ការងារ ពីអគ្គនាយកដ្ឋានពន្ធដារ ក្រោយពេលបញ្ចប់គម្រោង។',
      ],
      requiredDocs: [
        { name: 'ពាក្យស្នើសុំចូលបម្រើការងារ', copies: '០១ ច្បាប់' },
        { name: 'ប្រវត្តិរូបសង្ខេប (មានបិទរូបថត ៤ x ៦)', copies: '០២ ច្បាប់' },
        { name: 'សេចក្តីចម្លងសញ្ញាបត្រ (មានបញ្ជាក់ជាផ្លូវការត្រឹមត្រូវ)', copies: '០១ ច្បាប់' },
        { name: 'សេចក្តីចម្លងអត្តសញ្ញាណប័ណ្ណសញ្ជាតិខ្មែរ ឬលិខិតឆ្លងដែន', copies: '០១ ច្បាប់' },
      ],
      submissionParagraphKh: `អាស្រ័យហេតុនេះ បេក្ខជនដែលមានបំណងចូលបម្រើការងារ សូមធ្វើការទំនាក់ទំនង និងដាក់ពាក្យស្នើសុំចូលបម្រើការងារ ចាប់ពីថ្ងៃជូនដំណឹងនេះ រហូតដល់ ${closingDateKh} រៀងរាល់ម៉ោងធ្វើការ នៅសាលាជាតិពន្ធដារ បន្ទប់លេខ ៥០៥ ជាន់ទី០៥ អគារលេខ ៦១-៦៣ ផ្លូវលេខ ៩ នៃសង្កាត់ផ្សារដេប៉ូ៣ ខណ្ឌទួលគោក រាជធានីភ្នំពេញ (ខាងកើតអគ្គនាយកដ្ឋានពន្ធដារ)។`,
      contactPersons: [
        { name: 'កញ្ញា គង់ រ៉ាឌី', phone: '០៨៦ ៥៧២ ៨០៩', note: 'ទំនាក់ទំនងដាក់ពាក្យ' },
        { name: 'កញ្ញា សេង ដារ៉ា', phone: '០៩២ ៦១៨ ៥៤១', note: 'ទំនាក់ទំនងដាក់ពាក្យ' },
        { name: 'កញ្ញា ជា ច័ន្ទបូផាន', phone: settings?.contactPhone || '០១១ ៧៩៣ ៣៦១', note: 'ទំនាក់ទំនងទូទៅ' },
      ],
      signatoryTitleKh: dept,
      signatoryNameKh: '',
      logoUrl: settings?.logoUrl || '',
      stampUrl: '',
      bannerUrl: '',
      qrCodeUrl: settings?.telegramLink || '',
      showNationalMotto: true,
      showLogo: true,
      showStamp: true,
      showQrCode: true,
      useDefaultStamp: true,
    };
  }

  // Handle image upload from computer
  const handleImageUpload = (field: 'logoUrl' | 'stampUrl' | 'bannerUrl', e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        Swal.fire({ icon: 'warning', title: 'ទំហំរូបភាពធំពេក!', text: 'សូមជ្រើសរើសរូបភាពក្រោម 5MB' });
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result as string;
        setAnnouncement((prev) => ({
          ...prev,
          [field]: result,
          ...(field === 'stampUrl' ? { useDefaultStamp: false } : {}),
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  // Save announcement metadata back to the job
  const handleSaveAnnouncement = async () => {
    setIsSaving(true);
    try {
      const payload = {
        ...announcement,
        __announcement: true,
        templateStyle,
      };
      const jsonString = JSON.stringify(payload);

      if (onSave) {
        await onSave(jsonString);
      } else {
        // Direct API update
        const res = await fetch('/api/recruitment/jobs', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: job.id,
            requirements: jsonString,
          }),
        });
        if (!res.ok) throw new Error('Failed to update job posting');
      }

      Swal.fire({
        icon: 'success',
        title: 'បានរក្សាទុកសេចក្តីជូនដំណឹងជោគជ័យ!',
        timer: 1500,
        showConfirmButton: false,
      });
      setActiveTab('preview');
    } catch (err: any) {
      Swal.fire({ icon: 'error', title: 'បរាជ័យ!', text: err.message });
    } finally {
      setIsSaving(false);
    }
  };

  // Export to Word (.docx)
  const handleExportDocx = async () => {
    setIsGeneratingDocx(true);
    try {
      const docxData: JobAnnouncementDocxData = {
        templateStyle,
        parentOrgKh: announcement.parentOrgKh,
        departmentKh: announcement.departmentKh,
        refNo: announcement.refNo,
        cityDateKh: announcement.cityDateKh,
        jobTitle: announcement.jobTitle,
        jobCategoryKh: announcement.jobCategoryKh,
        vacanciesCount: announcement.vacanciesCount,
        targetAudienceKh: announcement.targetAudienceKh,
        workLocationKh: announcement.workLocationKh,
        introParagraphKh: announcement.introParagraphKh,
        qualifications: announcement.qualifications,
        benefits: announcement.benefits,
        requiredDocs: announcement.requiredDocs,
        submissionParagraphKh: announcement.submissionParagraphKh,
        contactPersons: announcement.contactPersons,
        signatoryTitleKh: announcement.signatoryTitleKh,
        signatoryNameKh: announcement.signatoryNameKh,
      };

      const blob = await generateAnnouncementDocxBlob(docxData);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `សេចក្តីជូនដំណឹង_${announcement.jobTitle.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.docx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      Swal.fire({
        icon: 'success',
        title: 'ទាញយក Word ជោគជ័យ!',
        text: 'ឯកសារសេចក្តីជូនដំណឹង (.docx) ត្រូវបានបង្កើតរួចរាល់',
        timer: 2000,
        showConfirmButton: false,
      });
    } catch (err: any) {
      Swal.fire({ icon: 'error', title: 'បរាជ័យទាញយក Word!', text: err.message });
    } finally {
      setIsGeneratingDocx(false);
    }
  };

  // Copy text for social media (Telegram, Facebook)
  const handleCopyText = () => {
    const text = `📢 【សេចក្តីជូនដំណឹង ស្តីពីការជ្រើសរើសបុគ្គលិក】
ស្ថាប័ន ៖ ${announcement.parentOrgKh} - ${announcement.departmentKh}
មុខតំណែង ៖ ${announcement.jobTitle}
ចំនួនជ្រើសរើស ៖ ${announcement.vacanciesCount} នាក់ (${announcement.jobCategoryKh})
ទីតាំងបម្រើការងារ ៖ ${announcement.workLocationKh}

🔹 លក្ខខណ្ឌនៃការជ្រើសរើស ៖
${announcement.qualifications.map((q) => `• ${q}`).join('\n')}

🎁 អត្ថប្រយោជន៍ទទួលបាន ៖
${announcement.benefits.map((b) => `• ${b}`).join('\n')}

📄 ឯកសារត្រូវភ្ជាប់មកជាមួយ ៖
${announcement.requiredDocs.map((d) => `• ${d.name} (${d.copies})`).join('\n')}

⏰ កាលបរិច្ឆេទ & ទីកន្លែងទទួលពាក្យ ៖
${announcement.submissionParagraphKh}

☎️ ទំនាក់ទំនង ៖
${announcement.contactPersons.map((c) => `• ${c.name} ៖ ${c.phone}`).join('\n')}
`;
    navigator.clipboard.writeText(text);
    Swal.fire({
      icon: 'success',
      title: 'បានចម្លងអត្ថបទ!',
      text: 'អ្នកអាចយកទៅបង្ហោះក្នុង Telegram ឬ Facebook បានភ្លាមៗ',
      timer: 1500,
      showConfirmButton: false,
    });
  };

  // Print function
  const handlePrint = () => {
    window.print();
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
      {/* Modal Dialog */}
      <div
        style={{
          background: '#f8fafc',
          borderRadius: '16px',
          width: '100%',
          maxWidth: '1150px',
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
              <span style={{ fontSize: '1.4rem' }}>📜</span>
              <h2 style={{ margin: 0, fontSize: '1.2rem', color: '#0f172a', fontWeight: 800 }}>
                សេចក្តីជូនដំណឹងជ្រើសរើសបុគ្គលិកផ្លូវការ
              </h2>
            </div>
            <p style={{ margin: '2px 0 0 0', fontSize: '0.82rem', color: '#64748b' }}>
              {announcement.jobTitle} • {announcement.departmentKh} • ចំនួន {announcement.vacanciesCount} នាក់
            </p>
          </div>

          {/* Action buttons */}
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
            {/* View Mode Switcher */}
            <div style={{ background: '#f1f5f9', borderRadius: '8px', padding: '3px', display: 'flex', gap: '3px' }}>
              <button
                type="button"
                onClick={() => setActiveTab('preview')}
                style={{
                  padding: '6px 14px',
                  borderRadius: '6px',
                  border: 'none',
                  background: activeTab === 'preview' ? '#ffffff' : 'transparent',
                  color: activeTab === 'preview' ? '#2563eb' : '#64748b',
                  fontWeight: 700,
                  fontSize: '0.82rem',
                  cursor: 'pointer',
                  boxShadow: activeTab === 'preview' ? '0 1px 2px rgba(0,0,0,0.06)' : 'none',
                }}
              >
                👁️ មើលគំរូ (Preview)
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('edit')}
                style={{
                  padding: '6px 14px',
                  borderRadius: '6px',
                  border: 'none',
                  background: activeTab === 'edit' ? '#ffffff' : 'transparent',
                  color: activeTab === 'edit' ? '#2563eb' : '#64748b',
                  fontWeight: 700,
                  fontSize: '0.82rem',
                  cursor: 'pointer',
                  boxShadow: activeTab === 'edit' ? '0 1px 2px rgba(0,0,0,0.06)' : 'none',
                }}
              >
                ✏️ កែប្រែទិន្នន័យ & រូបភាព (Edit)
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
                background: '#2563eb',
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

            {/* Copy Text */}
            <button
              type="button"
              onClick={handleCopyText}
              style={{
                background: '#f8fafc',
                color: '#334155',
                border: '1px solid #cbd5e1',
                borderRadius: '8px',
                padding: '8px 12px',
                fontSize: '0.82rem',
                fontWeight: 600,
                cursor: 'pointer',
              }}
              title="ចម្លងអត្ថបទទៅបង្ហោះលើ Facebook / Telegram"
            >
              📋 ចម្លងអត្ថបទ
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

        {/* Style Selector Toolbar (ដូរបានច្រើនរបៀប) */}
        <div
          className="no-print"
          style={{
            background: '#ffffff',
            padding: '10px 20px',
            borderBottom: '1px solid #e2e8f0',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            overflowX: 'auto',
          }}
        >
          <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#475569', whiteSpace: 'nowrap' }}>
            🎨 ជ្រើសរើសទម្រង់បែបបទ (Select Layout Style) ៖
          </span>

          <div style={{ display: 'flex', gap: '8px' }}>
            {[
              { id: 'GOVERNMENT', label: '🏛️ គំរូផ្លូវការរដ្ឋ / ក្រសួង-ស្ថាប័ន (ដូចគំរូប្លង់ពន្ធដារ)', desc: 'Official Public Sector' },
              { id: 'CORPORATE', label: '🏢 គំរូក្រុមហ៊ុនឯកជនទំនើប (Modern Enterprise)', desc: 'Corporate Hiring' },
              { id: 'NGO', label: '🌐 គំរូអង្គការ / ដៃគូអភិវឌ្ឍន៍ (NGO / International)', desc: 'Development TOR' },
              { id: 'CREATIVE_POSTER', label: '🎨 គំរូ Poster / Social Media Flyer', desc: 'Visual Hiring Poster' },
            ].map((style) => {
              const isSelected = templateStyle === style.id;
              return (
                <button
                  key={style.id}
                  type="button"
                  onClick={() => setTemplateStyle(style.id as any)}
                  style={{
                    padding: '6px 12px',
                    borderRadius: '8px',
                    border: isSelected ? '2px solid #2563eb' : '1px solid #cbd5e1',
                    background: isSelected ? '#eff6ff' : '#f8fafc',
                    color: isSelected ? '#1d4ed8' : '#475569',
                    fontWeight: isSelected ? 700 : 500,
                    fontSize: '0.8rem',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <span>{style.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Main Content Body */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: activeTab === 'preview' ? '24px' : '20px',
            display: 'flex',
            justifyContent: 'center',
            background: '#e2e8f0',
          }}
        >
          {/* TAB 1: PREVIEW */}
          {activeTab === 'preview' && (
            <div
              id="recruitment-print-area"
              style={{
                width: '100%',
                maxWidth: '794px', // A4 width at 96 DPI
                minHeight: '1123px', // A4 height at 96 DPI
                background: '#ffffff',
                boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)',
                padding: '40px 48px',
                fontFamily: 'Khmer OS Siemreap, Siemreap, Kantumruy Pro, sans-serif',
                color: '#0f172a',
                lineHeight: 1.6,
                boxSizing: 'border-box',
                position: 'relative',
              }}
            >
              {/* STYLE 1: GOVERNMENT / PUBLIC SECTOR (Exact replica of user's uploaded sample) */}
              {templateStyle === 'GOVERNMENT' && (
                <div>
                  {/* Top Header Row */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr 1.2fr', alignItems: 'flex-start', marginBottom: '16px' }}>
                    {/* Left: Ministry & Department & Ref No */}
                    <div>
                      <div style={{ fontFamily: 'Khmer OS Muol Light, Moul, serif', fontSize: '0.95rem', fontWeight: 700, color: '#0f172a', lineHeight: 1.4 }}>
                        {announcement.parentOrgKh}
                      </div>
                      <div style={{ fontFamily: 'Khmer OS Muol Light, Moul, serif', fontSize: '0.88rem', fontWeight: 700, color: '#1e3a8a', marginTop: '2px', lineHeight: 1.3 }}>
                        {announcement.departmentKh}
                      </div>
                      <div style={{ fontSize: '0.85rem', marginTop: '4px', color: '#1e293b' }}>
                        លេខ... <span style={{ fontWeight: 700 }}>{toKhmerDigits(announcement.refNo)}</span> ...
                      </div>
                    </div>

                    {/* Center: Official Emblem / Logo */}
                    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                      {announcement.showLogo && (
                        <div style={{ width: '80px', height: '80px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          {announcement.logoUrl ? (
                            <img
                              src={announcement.logoUrl}
                              alt="Logo"
                              style={{ maxWidth: '80px', maxHeight: '80px', objectFit: 'contain' }}
                            />
                          ) : (
                            /* Simulated Royal Government / Official Circular Seal SVG */
                            <div
                              style={{
                                width: '74px',
                                height: '74px',
                                borderRadius: '50%',
                                border: '2.5px double #15803d',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                justifyContent: 'center',
                                padding: '4px',
                                textAlign: 'center',
                                background: '#f0fdf4',
                              }}
                            >
                              <div style={{ fontSize: '0.45rem', fontWeight: 800, color: '#15803d', fontFamily: 'Khmer OS Muol Light, Moul' }}>
                                ព្រះរាជាណាចក្រកម្ពុជា
                              </div>
                              <div style={{ fontSize: '1.2rem', margin: '-2px 0' }}>🏛️</div>
                              <div style={{ fontSize: '0.42rem', fontWeight: 700, color: '#15803d' }}>
                                OFFICIAL SEAL
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Right: Kingdom Motto & Date */}
                    <div style={{ textAlign: 'center' }}>
                      {announcement.showNationalMotto && (
                        <>
                          <div style={{ fontFamily: 'Khmer OS Muol Light, Moul, serif', fontSize: '1.05rem', fontWeight: 700, color: '#0f172a' }}>
                            ព្រះរាជាណាចក្រកម្ពុជា
                          </div>
                          <div style={{ fontFamily: 'Khmer OS Muol Light, Moul, serif', fontSize: '0.95rem', fontWeight: 700, color: '#0f172a', marginTop: '2px' }}>
                            ជាតិ សាសនា ព្រះមហាក្សត្រ
                          </div>
                          {/* Flourish divider */}
                          <div style={{ display: 'flex', justifyContent: 'center', margin: '2px 0 6px 0' }}>
                            <svg width="80" height="12" viewBox="0 0 100 16">
                              <path d="M 10 8 Q 30 14 50 8 T 90 8" fill="none" stroke="#0f172a" strokeWidth="1.5" />
                              <circle cx="50" cy="8" r="2.5" fill="#0f172a" />
                            </svg>
                          </div>
                        </>
                      )}
                      <div style={{ fontSize: '0.82rem', color: '#1e293b', textAlign: 'right', marginTop: '4px' }}>
                        {announcement.cityDateKh}
                      </div>
                    </div>
                  </div>

                  {/* Centered Document Title */}
                  <div style={{ textAlign: 'center', margin: '14px 0 16px 0' }}>
                    <div style={{ fontFamily: 'Khmer OS Muol Light, Moul, serif', fontSize: '1.15rem', fontWeight: 800, color: '#0f172a', letterSpacing: '0.5px' }}>
                      សេចក្តីជូនដំណឹង
                    </div>
                    <div style={{ fontFamily: 'Khmer OS Muol Light, Moul, serif', fontSize: '0.98rem', fontWeight: 700, color: '#0f172a', marginTop: '4px', lineHeight: 1.5 }}>
                      ស្តីពីការជ្រើសរើស{announcement.jobCategoryKh} ចំនួន <span style={{ textDecoration: 'underline' }}>{toKhmerDigits(announcement.vacanciesCount)}</span> នាក់ សម្រាប់បម្រើការងារ
                    </div>
                    <div style={{ fontFamily: 'Khmer OS Muol Light, Moul, serif', fontSize: '0.95rem', fontWeight: 700, color: '#1e3a8a', marginTop: '2px', lineHeight: 1.4 }}>
                      {announcement.jobTitle} {announcement.workLocationKh ? `(${announcement.workLocationKh})` : ''}
                    </div>
                  </div>

                  {/* Formal Introduction Paragraph */}
                  {announcement.introParagraphKh && (
                    <div style={{ textAlign: 'justify', textJustify: 'inter-word', textIndent: '36px', fontSize: '0.86rem', color: '#1e293b', marginBottom: '12px', lineHeight: 1.6 }}>
                      {announcement.introParagraphKh}
                    </div>
                  )}

                  {/* Section 1: Qualifications / Requirements */}
                  <div style={{ marginBottom: '12px' }}>
                    <div style={{ fontFamily: 'Khmer OS Muol Light, Moul, serif', fontSize: '0.88rem', fontWeight: 700, color: '#0f172a', marginBottom: '4px' }}>
                      លក្ខខណ្ឌនៃការជ្រើសរើស ៖
                    </div>
                    <div style={{ paddingLeft: '16px', display: 'flex', flexDirection: 'column', gap: '3px' }}>
                      {announcement.qualifications.map((q, idx) => (
                        <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', fontSize: '0.85rem', color: '#1e293b', lineHeight: 1.5 }}>
                          <span style={{ fontWeight: 700 }}>-</span>
                          <span style={{ flex: 1 }}>{q.replace(/^[-•*]\s*/, '')}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Section 2: Benefits */}
                  {announcement.benefits.length > 0 && (
                    <div style={{ marginBottom: '12px' }}>
                      <div style={{ fontFamily: 'Khmer OS Muol Light, Moul, serif', fontSize: '0.88rem', fontWeight: 700, color: '#0f172a', marginBottom: '4px' }}>
                        អត្ថប្រយោជន៍ទទួលបាន ៖
                      </div>
                      <div style={{ paddingLeft: '16px', display: 'flex', flexDirection: 'column', gap: '3px' }}>
                        {announcement.benefits.map((b, idx) => (
                          <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', fontSize: '0.85rem', color: '#1e293b', lineHeight: 1.5 }}>
                            <span style={{ fontWeight: 700 }}>-</span>
                            <span style={{ flex: 1 }}>{b.replace(/^[-•*]\s*/, '')}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Section 3: Required Attached Documents */}
                  {announcement.requiredDocs.length > 0 && (
                    <div style={{ marginBottom: '14px' }}>
                      <div style={{ fontFamily: 'Khmer OS Muol Light, Moul, serif', fontSize: '0.88rem', fontWeight: 700, color: '#0f172a', marginBottom: '4px' }}>
                        សូមភ្ជាប់មកជាមួយនូវ ៖
                      </div>
                      <div style={{ paddingLeft: '16px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        {announcement.requiredDocs.map((doc, idx) => (
                          <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.85rem', color: '#1e293b' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <span style={{ fontWeight: 700 }}>-</span>
                              <span>{doc.name}</span>
                            </div>
                            <div style={{ fontWeight: 700, minWidth: '100px', textAlign: 'right' }}>
                              ចំនួន {toKhmerDigits(doc.copies)}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Section 4: Submission Details & Office Location */}
                  {announcement.submissionParagraphKh && (
                    <div style={{ textAlign: 'justify', textJustify: 'inter-word', textIndent: '36px', fontSize: '0.86rem', color: '#1e293b', marginBottom: '16px', lineHeight: 1.6 }}>
                      {announcement.submissionParagraphKh}
                    </div>
                  )}

                  {/* Bottom Row: Contact Phones (Left) and Official Stamp/Signature (Right) */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '16px', alignItems: 'flex-start', marginTop: '12px' }}>
                    {/* Left: Contacts */}
                    <div>
                      <div style={{ fontFamily: 'Khmer OS Muol Light, Moul, serif', fontSize: '0.86rem', fontWeight: 700, color: '#0f172a', marginBottom: '6px' }}>
                        លេខទូរស័ព្ទទំនាក់ទំនងសម្រាប់ការដាក់ពាក្យ ៖
                      </div>
                      <div style={{ paddingLeft: '8px', display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '0.84rem' }}>
                        {announcement.contactPersons.map((cp, idx) => (
                          <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ minWidth: '110px', color: '#334155' }}>- {cp.name}</span>
                            <span style={{ fontWeight: 700, color: '#0f172a' }}>៖ {toKhmerDigits(cp.phone)}</span>
                          </div>
                        ))}

                        {/* Optional QR Code */}
                        {announcement.showQrCode && announcement.qrCodeUrl && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '8px', padding: '6px', background: '#f8fafc', borderRadius: '6px', border: '1px solid #e2e8f0', width: 'fit-content' }}>
                            <QRCodeSVG value={announcement.qrCodeUrl} size={54} />
                            <div style={{ fontSize: '0.72rem', color: '#475569' }}>
                              <div style={{ fontWeight: 700, color: '#1e3a8a' }}>ស្កេនដើម្បីដាក់ពាក្យ ឬទាក់ទង</div>
                              <div>Scan QR to Apply / Telegram</div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Right: Signatory & Stamp block (Matches red circular stamp in photo) */}
                    <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                      <div style={{ fontFamily: 'Khmer OS Muol Light, Moul, serif', fontSize: '0.92rem', fontWeight: 700, color: '#0f172a' }}>
                        {announcement.signatoryTitleKh}
                      </div>

                      {/* Stamp Area */}
                      <div style={{ position: 'relative', width: '130px', height: '110px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '4px 0' }}>
                        {announcement.showStamp && (
                          <>
                            {announcement.stampUrl ? (
                              <img
                                src={announcement.stampUrl}
                                alt="Official Stamp"
                                style={{ maxWidth: '120px', maxHeight: '110px', objectFit: 'contain' }}
                              />
                            ) : announcement.useDefaultStamp ? (
                              /* Realistic Official Circular Red Stamp SVG */
                              <div
                                style={{
                                  width: '100px',
                                  height: '100px',
                                  borderRadius: '50%',
                                  border: '3px solid #dc2626',
                                  outline: '1.5px dashed #dc2626',
                                  outlineOffset: '-7px',
                                  display: 'flex',
                                  flexDirection: 'column',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  color: '#dc2626',
                                  padding: '6px',
                                  transform: 'rotate(-5deg)',
                                  boxShadow: '0 0 2px rgba(220, 38, 38, 0.4)',
                                  background: 'rgba(254, 242, 242, 0.3)',
                                }}
                              >
                                <div style={{ fontSize: '0.45rem', fontWeight: 800, fontFamily: 'Khmer OS Muol Light, Moul' }}>
                                  ★ {announcement.parentOrgKh.slice(0, 20)} ★
                                </div>
                                <div style={{ fontSize: '0.9rem', margin: '-1px 0' }}>⭐</div>
                                <div style={{ fontSize: '0.45rem', fontWeight: 800, fontFamily: 'Khmer OS Muol Light, Moul' }}>
                                  {announcement.departmentKh.slice(0, 20)}
                                </div>
                              </div>
                            ) : (
                              <div style={{ fontStyle: 'italic', fontSize: '0.78rem', color: '#94a3b8' }}>
                                (ហត្ថលេខា និងត្រា)
                              </div>
                            )}
                          </>
                        )}
                      </div>

                      {announcement.signatoryNameKh && (
                        <div style={{ fontFamily: 'Khmer OS Muol Light, Moul, serif', fontSize: '0.88rem', fontWeight: 700, color: '#0f172a', marginTop: '2px' }}>
                          {announcement.signatoryNameKh}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* STYLE 2: MODERN CORPORATE ENTERPRISE */}
              {templateStyle === 'CORPORATE' && (
                <div>
                  {/* Top Header Banner / Logo */}
                  {announcement.bannerUrl && (
                    <div style={{ marginBottom: '14px', borderRadius: '8px', overflow: 'hidden' }}>
                      <img src={announcement.bannerUrl} alt="Banner" style={{ width: '100%', maxHeight: '130px', objectFit: 'cover' }} />
                    </div>
                  )}

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #2563eb', paddingBottom: '12px', marginBottom: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      {announcement.showLogo && announcement.logoUrl && (
                        <img src={announcement.logoUrl} alt="Logo" style={{ maxHeight: '55px', maxWidth: '100px', objectFit: 'contain' }} />
                      )}
                      <div>
                        <div style={{ fontFamily: 'Khmer OS Muol Light, Moul', fontSize: '1.15rem', color: '#1e3a8a', fontWeight: 800 }}>
                          {announcement.parentOrgKh}
                        </div>
                        <div style={{ fontSize: '0.82rem', color: '#64748b' }}>
                          {announcement.departmentKh} • Ref: {announcement.refNo}
                        </div>
                      </div>
                    </div>
                    <div style={{ textAlign: 'right', fontSize: '0.8rem', color: '#64748b' }}>
                      <div>{announcement.cityDateKh}</div>
                      <span style={{ background: '#dcfce7', color: '#15803d', padding: '3px 8px', borderRadius: '4px', fontWeight: 700, fontSize: '0.75rem' }}>
                        កំពុងបើកទទួលពាក្យ (HIRING)
                      </span>
                    </div>
                  </div>

                  {/* Position Banner */}
                  <div style={{ background: '#eff6ff', borderRadius: '10px', padding: '16px 20px', marginBottom: '18px', border: '1px solid #bfdbfe' }}>
                    <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#2563eb', textTransform: 'uppercase', letterSpacing: '1px' }}>
                      📢 សេចក្តីប្រកាសជ្រើសរើសបុគ្គលិក • CAREER OPPORTUNITY
                    </div>
                    <div style={{ fontFamily: 'Khmer OS Muol Light, Moul', fontSize: '1.35rem', color: '#0f172a', fontWeight: 800, margin: '6px 0' }}>
                      {announcement.jobTitle}
                    </div>
                    <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginTop: '8px' }}>
                      <span style={{ background: '#ffffff', border: '1px solid #cbd5e1', padding: '4px 10px', borderRadius: '6px', fontSize: '0.8rem', fontWeight: 600 }}>
                        👥 ចំនួន ៖ <strong>{toKhmerDigits(announcement.vacanciesCount)} នាក់</strong>
                      </span>
                      <span style={{ background: '#ffffff', border: '1px solid #cbd5e1', padding: '4px 10px', borderRadius: '6px', fontSize: '0.8rem', fontWeight: 600 }}>
                        📍 ទីតាំង ៖ {announcement.workLocationKh}
                      </span>
                      <span style={{ background: '#ffffff', border: '1px solid #cbd5e1', padding: '4px 10px', borderRadius: '6px', fontSize: '0.8rem', fontWeight: 600 }}>
                        ⏱️ ប្រភេទ ៖ {announcement.jobCategoryKh}
                      </span>
                    </div>
                  </div>

                  {/* 2-Column Grid */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '18px', marginBottom: '16px' }}>
                    {/* Requirements */}
                    <div style={{ background: '#f8fafc', padding: '14px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                      <div style={{ fontFamily: 'Khmer OS Muol Light, Moul', fontSize: '0.88rem', color: '#1e293b', marginBottom: '8px' }}>
                        🎯 លក្ខខណ្ឌជ្រើសរើស (Requirements)
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '0.82rem' }}>
                        {announcement.qualifications.map((q, idx) => (
                          <div key={idx} style={{ display: 'flex', gap: '6px' }}>
                            <span style={{ color: '#2563eb' }}>✓</span>
                            <span>{q.replace(/^[-•*]\s*/, '')}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Benefits */}
                    <div style={{ background: '#f0fdf4', padding: '14px', borderRadius: '8px', border: '1px solid #bbf7d0' }}>
                      <div style={{ fontFamily: 'Khmer OS Muol Light, Moul', fontSize: '0.88rem', color: '#166534', marginBottom: '8px' }}>
                        🎁 អត្ថប្រយោជន៍ទទួលបាន (Benefits)
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '0.82rem' }}>
                        {announcement.benefits.map((b, idx) => (
                          <div key={idx} style={{ display: 'flex', gap: '6px' }}>
                            <span style={{ color: '#16a34a' }}>★</span>
                            <span>{b.replace(/^[-•*]\s*/, '')}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Submission & QR code */}
                  <div style={{ background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '8px', padding: '14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px', marginBottom: '14px' }}>
                    <div style={{ fontSize: '0.83rem', color: '#334155' }}>
                      <div style={{ fontWeight: 700, color: '#0f172a', marginBottom: '3px' }}>📩 របៀបដាក់ពាក្យ & ផុតកំណត់ ៖</div>
                      <div>{announcement.submissionParagraphKh}</div>
                      <div style={{ marginTop: '6px', fontWeight: 600, color: '#1d4ed8' }}>
                        ទូរស័ព្ទទំនាក់ទំនង ៖ {announcement.contactPersons.map((c) => `${c.name} (${c.phone})`).join(' • ')}
                      </div>
                    </div>
                    {announcement.showQrCode && announcement.qrCodeUrl && (
                      <div style={{ textAlign: 'center', minWidth: '90px' }}>
                        <QRCodeSVG value={announcement.qrCodeUrl} size={70} />
                        <div style={{ fontSize: '0.68rem', fontWeight: 700, marginTop: '3px', color: '#2563eb' }}>ស្កេនដាក់ពាក្យ</div>
                      </div>
                    )}
                  </div>

                  {/* Corporate Sign-off */}
                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '16px' }}>
                    <div style={{ textAlign: 'center', minWidth: '180px' }}>
                      <div style={{ fontFamily: 'Khmer OS Muol Light, Moul', fontSize: '0.88rem', color: '#0f172a' }}>
                        {announcement.signatoryTitleKh}
                      </div>
                      <div style={{ height: '60px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {announcement.stampUrl ? (
                          <img src={announcement.stampUrl} alt="Stamp" style={{ maxHeight: '60px' }} />
                        ) : (
                          <div style={{ fontStyle: 'italic', fontSize: '0.78rem', color: '#94a3b8' }}>
                            (ហត្ថលេខា និងត្រា)
                          </div>
                        )}
                      </div>
                      {announcement.signatoryNameKh && (
                        <div style={{ fontWeight: 700, fontSize: '0.85rem' }}>{announcement.signatoryNameKh}</div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* STYLE 3: NGO / INTERNATIONAL DEVELOPMENT */}
              {templateStyle === 'NGO' && (
                <div>
                  <div style={{ borderBottom: '1px solid #94a3b8', paddingBottom: '10px', marginBottom: '14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      {announcement.showLogo && announcement.logoUrl && (
                        <img src={announcement.logoUrl} alt="Logo" style={{ maxHeight: '50px' }} />
                      )}
                      <div>
                        <div style={{ fontFamily: 'Khmer OS Muol Light, Moul', fontSize: '1.05rem', color: '#0f172a' }}>{announcement.parentOrgKh}</div>
                        <div style={{ fontSize: '0.8rem', color: '#475569' }}>{announcement.departmentKh} • TERMS OF REFERENCE (TOR)</div>
                      </div>
                    </div>
                    <div style={{ textAlign: 'right', fontSize: '0.78rem', color: '#64748b' }}>
                      <div>Ref: {announcement.refNo}</div>
                      <div>{announcement.cityDateKh}</div>
                    </div>
                  </div>

                  <div style={{ textAlign: 'center', margin: '14px 0' }}>
                    <div style={{ fontFamily: 'Khmer OS Muol Light, Moul', fontSize: '1.1rem', color: '#1e3a8a' }}>
                      លក្ខខណ្ឌការងារ / TERMS OF REFERENCE
                    </div>
                    <div style={{ fontSize: '0.95rem', fontWeight: 800, marginTop: '2px' }}>
                      {announcement.jobTitle} (ចំនួន {toKhmerDigits(announcement.vacanciesCount)} នាក់)
                    </div>
                  </div>

                  {/* Table summary of post */}
                  <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '14px', fontSize: '0.82rem' }}>
                    <tbody>
                      <tr style={{ background: '#f8fafc' }}>
                        <td style={{ border: '1px solid #cbd5e1', padding: '6px 10px', fontWeight: 700, width: '25%' }}>Position Title / មុខតំណែង</td>
                        <td style={{ border: '1px solid #cbd5e1', padding: '6px 10px' }}>{announcement.jobTitle}</td>
                        <td style={{ border: '1px solid #cbd5e1', padding: '6px 10px', fontWeight: 700, width: '20%' }}>Location / ទីតាំង</td>
                        <td style={{ border: '1px solid #cbd5e1', padding: '6px 10px' }}>{announcement.workLocationKh}</td>
                      </tr>
                      <tr>
                        <td style={{ border: '1px solid #cbd5e1', padding: '6px 10px', fontWeight: 700 }}>Contract Type / ប្រភេទ</td>
                        <td style={{ border: '1px solid #cbd5e1', padding: '6px 10px' }}>{announcement.jobCategoryKh}</td>
                        <td style={{ border: '1px solid #cbd5e1', padding: '6px 10px', fontWeight: 700 }}>Openings / ចំនួន</td>
                        <td style={{ border: '1px solid #cbd5e1', padding: '6px 10px' }}>{toKhmerDigits(announcement.vacanciesCount)} នាក់</td>
                      </tr>
                    </tbody>
                  </table>

                  {/* Background */}
                  <div style={{ marginBottom: '12px' }}>
                    <div style={{ fontWeight: 700, color: '#1e3a8a', fontSize: '0.86rem', marginBottom: '4px' }}>
                      ១. សេចក្តីផ្តើម និងគោលបំណង (Background & Objectives)
                    </div>
                    <div style={{ fontSize: '0.83rem', lineHeight: 1.5, color: '#334155' }}>
                      {announcement.introParagraphKh}
                    </div>
                  </div>

                  {/* Requirements */}
                  <div style={{ marginBottom: '12px' }}>
                    <div style={{ fontWeight: 700, color: '#1e3a8a', fontSize: '0.86rem', marginBottom: '4px' }}>
                      ២. លក្ខខណ្ឌតម្រូវ និងគុណវុឌ្ឍិ (Key Qualifications)
                    </div>
                    <div style={{ paddingLeft: '16px', fontSize: '0.82rem', display: 'flex', flexDirection: 'column', gap: '3px' }}>
                      {announcement.qualifications.map((q, idx) => (
                        <div key={idx}>• {q.replace(/^[-•*]\s*/, '')}</div>
                      ))}
                    </div>
                  </div>

                  {/* Submission */}
                  <div style={{ marginBottom: '14px' }}>
                    <div style={{ fontWeight: 700, color: '#1e3a8a', fontSize: '0.86rem', marginBottom: '4px' }}>
                      ៣. របៀបដាក់ពាក្យ (How to Apply)
                    </div>
                    <div style={{ fontSize: '0.83rem', lineHeight: 1.5, color: '#334155' }}>
                      {announcement.submissionParagraphKh}
                    </div>
                  </div>

                  <div style={{ borderTop: '1px dashed #cbd5e1', paddingTop: '10px', fontSize: '0.78rem', color: '#64748b', fontStyle: 'italic', textAlign: 'center' }}>
                    {announcement.parentOrgKh} provides equal employment opportunities to all candidates regardless of gender, religion, or background.
                  </div>
                </div>
              )}

              {/* STYLE 4: CREATIVE POSTER / FLYER */}
              {templateStyle === 'CREATIVE_POSTER' && (
                <div style={{ border: '4px solid #1e3a8a', borderRadius: '12px', padding: '24px', background: 'linear-gradient(180deg, #eff6ff 0%, #ffffff 25%)' }}>
                  {/* Top Hiring Banner */}
                  <div style={{ textAlign: 'center', marginBottom: '16px' }}>
                    <div style={{ background: '#1e3a8a', color: '#ffffff', display: 'inline-block', padding: '6px 20px', borderRadius: '30px', fontWeight: 800, fontSize: '0.9rem', letterSpacing: '2px' }}>
                      ★ WE ARE HIRING! • យើងកំពុងជ្រើសរើសបុគ្គលិក ★
                    </div>
                    <div style={{ fontFamily: 'Khmer OS Muol Light, Moul', fontSize: '1.45rem', color: '#0f172a', fontWeight: 800, marginTop: '8px' }}>
                      {announcement.jobTitle}
                    </div>
                    <div style={{ fontSize: '0.9rem', color: '#2563eb', fontWeight: 700 }}>
                      {announcement.parentOrgKh} • {announcement.departmentKh}
                    </div>
                  </div>

                  {/* Big Highlight Vacancy Badge */}
                  <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', marginBottom: '18px' }}>
                    <div style={{ background: '#2563eb', color: '#fff', borderRadius: '10px', padding: '10px 20px', textAlign: 'center', minWidth: '120px' }}>
                      <div style={{ fontSize: '0.75rem' }}>ចំនួនជ្រើសរើស</div>
                      <div style={{ fontSize: '1.5rem', fontWeight: 800 }}>{toKhmerDigits(announcement.vacanciesCount)} នាក់</div>
                    </div>
                    <div style={{ background: '#16a34a', color: '#fff', borderRadius: '10px', padding: '10px 20px', textAlign: 'center', minWidth: '120px' }}>
                      <div style={{ fontSize: '0.75rem' }}>ប្រភេទការងារ</div>
                      <div style={{ fontSize: '1.1rem', fontWeight: 700, marginTop: '4px' }}>{announcement.jobCategoryKh}</div>
                    </div>
                  </div>

                  {/* Requirements & Benefits */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '16px' }}>
                    <div style={{ background: '#ffffff', padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1' }}>
                      <div style={{ fontWeight: 800, color: '#1e3a8a', fontSize: '0.85rem', marginBottom: '6px' }}>
                        📋 លក្ខខណ្ឌតម្រូវ ៖
                      </div>
                      <div style={{ fontSize: '0.8rem', display: 'flex', flexDirection: 'column', gap: '3px' }}>
                        {announcement.qualifications.slice(0, 4).map((q, idx) => (
                          <div key={idx}>• {q.replace(/^[-•*]\s*/, '')}</div>
                        ))}
                      </div>
                    </div>

                    <div style={{ background: '#ffffff', padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1' }}>
                      <div style={{ fontWeight: 800, color: '#15803d', fontSize: '0.85rem', marginBottom: '6px' }}>
                        🎁 អត្ថប្រយោជន៍ ៖
                      </div>
                      <div style={{ fontSize: '0.8rem', display: 'flex', flexDirection: 'column', gap: '3px' }}>
                        {announcement.benefits.slice(0, 4).map((b, idx) => (
                          <div key={idx}>★ {b.replace(/^[-•*]\s*/, '')}</div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Scan to Apply Banner */}
                  <div style={{ background: '#1e293b', color: '#fff', borderRadius: '10px', padding: '14px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontWeight: 800, fontSize: '0.92rem' }}>📞 ទំនាក់ទំនងដាក់ពាក្យបន្ទាន់ ៖</div>
                      <div style={{ fontSize: '0.82rem', marginTop: '4px', color: '#cbd5e1' }}>
                        {announcement.contactPersons.map((c) => `${c.name} (${toKhmerDigits(c.phone)})`).join(' • ')}
                      </div>
                      <div style={{ fontSize: '0.78rem', color: '#94a3b8', marginTop: '2px' }}>
                        {announcement.workLocationKh}
                      </div>
                    </div>
                    {announcement.showQrCode && announcement.qrCodeUrl && (
                      <div style={{ background: '#fff', padding: '6px', borderRadius: '6px' }}>
                        <QRCodeSVG value={announcement.qrCodeUrl} size={70} />
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: EDIT ANNOUNCEMENT FIELDS & UPLOAD IMAGES (អាចបន្ថែមរូបភាព បានទៀត) */}
          {activeTab === 'edit' && (
            <div
              style={{
                width: '100%',
                maxWidth: '900px',
                background: '#ffffff',
                borderRadius: '12px',
                padding: '24px',
                boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)',
                display: 'flex',
                flexDirection: 'column',
                gap: '20px',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e2e8f0', paddingBottom: '12px' }}>
                <h3 style={{ margin: 0, fontSize: '1.15rem', color: '#1e293b', fontWeight: 800 }}>
                  ✏️ កែប្រែខ្លឹមសារសេចក្តីជូនដំណឹង & បន្ថែមរូបភាព (Edit Notice & Upload Images)
                </h3>
                <button
                  type="button"
                  onClick={handleSaveAnnouncement}
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
                  {isSaving ? 'កំពុងរក្សាទុក...' : '💾 រក្សាទុក (Save Changes)'}
                </button>
              </div>

              {/* 1. Images & Logos Section (អាចបន្ថែមរូបភាព បានទៀត) */}
              <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '10px', border: '1px solid #cbd5e1' }}>
                <h4 style={{ margin: '0 0 12px 0', fontSize: '0.95rem', color: '#1e3a8a', fontWeight: 800 }}>
                  🖼️ ការគ្រប់គ្រងរូបភាព (Logos, Stamps, Banners, QR Codes)
                </h4>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '14px' }}>
                  {/* Logo Upload */}
                  <div style={{ background: '#fff', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                    <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, marginBottom: '6px' }}>
                      🏛️ រូបសញ្ញាស្ថាប័ន / Logo
                    </label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleImageUpload('logoUrl', e)}
                      style={{ fontSize: '0.8rem', width: '100%' }}
                    />
                    {announcement.logoUrl && (
                      <div style={{ marginTop: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <img src={announcement.logoUrl} alt="Logo" style={{ maxHeight: '40px', maxWidth: '60px' }} />
                        <button
                          type="button"
                          onClick={() => setAnnouncement({ ...announcement, logoUrl: '' })}
                          style={{ fontSize: '0.75rem', color: '#dc2626', background: 'none', border: 'none', cursor: 'pointer' }}
                        >
                          លុបរូប
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Stamp Upload */}
                  <div style={{ background: '#fff', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                    <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, marginBottom: '6px' }}>
                      🔴 រូបត្រាក្រហមផ្លូវការ (Official Stamp Image)
                    </label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleImageUpload('stampUrl', e)}
                      style={{ fontSize: '0.8rem', width: '100%' }}
                    />
                    <div style={{ marginTop: '6px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <label style={{ fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <input
                          type="checkbox"
                          checked={announcement.useDefaultStamp}
                          onChange={(e) => setAnnouncement({ ...announcement, useDefaultStamp: e.target.checked, stampUrl: '' })}
                        />
                        ប្រើត្រាក្រហមស្វ័យប្រវត្តិ
                      </label>
                    </div>
                  </div>

                  {/* Banner / Poster Image */}
                  <div style={{ background: '#fff', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                    <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, marginBottom: '6px' }}>
                      🖼️ រូបផ្ទាំងបដា (Banner Poster Image)
                    </label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleImageUpload('bannerUrl', e)}
                      style={{ fontSize: '0.8rem', width: '100%' }}
                    />
                    {announcement.bannerUrl && (
                      <div style={{ marginTop: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <img src={announcement.bannerUrl} alt="Banner" style={{ maxHeight: '40px', maxWidth: '80px' }} />
                        <button
                          type="button"
                          onClick={() => setAnnouncement({ ...announcement, bannerUrl: '' })}
                          style={{ fontSize: '0.75rem', color: '#dc2626', background: 'none', border: 'none', cursor: 'pointer' }}
                        >
                          លុបរូប
                        </button>
                      </div>
                    )}
                  </div>

                  {/* QR Code URL */}
                  <div style={{ background: '#fff', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                    <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, marginBottom: '6px' }}>
                      📱 តំណភ្ជាប់ Telegram / Link QR Code
                    </label>
                    <input
                      type="text"
                      placeholder="https://t.me/yourcompany..."
                      value={announcement.qrCodeUrl || ''}
                      onChange={(e) => setAnnouncement({ ...announcement, qrCodeUrl: e.target.value })}
                      style={{ width: '100%', padding: '6px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.82rem' }}
                    />
                  </div>
                </div>
              </div>

              {/* 2. Header & Ministry Meta */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, marginBottom: '4px' }}>
                    ក្រសួង ឬស្ថាប័នមេ (Ministry / Company Name) *
                  </label>
                  <input
                    type="text"
                    value={announcement.parentOrgKh}
                    onChange={(e) => setAnnouncement({ ...announcement, parentOrgKh: e.target.value })}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.88rem' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, marginBottom: '4px' }}>
                    អគ្គនាយកដ្ឋាន ឬនាយកដ្ឋាន (Department / Branch) *
                  </label>
                  <input
                    type="text"
                    value={announcement.departmentKh}
                    onChange={(e) => setAnnouncement({ ...announcement, departmentKh: e.target.value })}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.88rem' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, marginBottom: '4px' }}>
                    លេខលិខិត (Ref No. ឧ. លេខ... ១២១៧៦ អពដ)
                  </label>
                  <input
                    type="text"
                    value={announcement.refNo}
                    onChange={(e) => setAnnouncement({ ...announcement, refNo: e.target.value })}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.88rem' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, marginBottom: '4px' }}>
                    កាលបរិច្ឆេទចេញលិខិត (Date in Khmer)
                  </label>
                  <input
                    type="text"
                    value={announcement.cityDateKh}
                    onChange={(e) => setAnnouncement({ ...announcement, cityDateKh: e.target.value })}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.88rem' }}
                  />
                </div>
              </div>

              {/* 3. Job Title, Vacancies, Category */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, marginBottom: '4px' }}>
                    មុខតំណែង (Job Title) *
                  </label>
                  <input
                    type="text"
                    value={announcement.jobTitle}
                    onChange={(e) => setAnnouncement({ ...announcement, jobTitle: e.target.value })}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.88rem' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, marginBottom: '4px' }}>
                    ចំនួនជ្រើសរើស (Vacancies Count)
                  </label>
                  <input
                    type="text"
                    value={announcement.vacanciesCount}
                    onChange={(e) => setAnnouncement({ ...announcement, vacanciesCount: e.target.value })}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.88rem' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, marginBottom: '4px' }}>
                    ប្រភេទបុគ្គលិក (Category)
                  </label>
                  <input
                    type="text"
                    value={announcement.jobCategoryKh}
                    onChange={(e) => setAnnouncement({ ...announcement, jobCategoryKh: e.target.value })}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.88rem' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, marginBottom: '4px' }}>
                    ទីតាំងបម្រើការងារ (Location)
                  </label>
                  <input
                    type="text"
                    value={announcement.workLocationKh}
                    onChange={(e) => setAnnouncement({ ...announcement, workLocationKh: e.target.value })}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.88rem' }}
                  />
                </div>
              </div>

              {/* 4. Introduction Paragraph */}
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, marginBottom: '4px' }}>
                  អត្ថបទអារម្ភកថាផ្លូវការ (Proclamation Introduction Paragraph)
                </label>
                <textarea
                  rows={3}
                  value={announcement.introParagraphKh}
                  onChange={(e) => setAnnouncement({ ...announcement, introParagraphKh: e.target.value })}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.88rem' }}
                />
              </div>

              {/* 5. Qualifications (Line by line) */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <label style={{ fontSize: '0.85rem', fontWeight: 700 }}>
                    លក្ខខណ្ឌនៃការជ្រើសរើស (Qualifications & Requirements)
                  </label>
                  <button
                    type="button"
                    onClick={() => setAnnouncement({ ...announcement, qualifications: [...announcement.qualifications, ''] })}
                    style={{ fontSize: '0.78rem', color: '#2563eb', background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '6px', padding: '3px 8px', cursor: 'pointer' }}
                  >
                    + បន្ថែមលក្ខខណ្ឌ
                  </button>
                </div>
                {announcement.qualifications.map((q, idx) => (
                  <div key={idx} style={{ display: 'flex', gap: '8px', marginBottom: '6px' }}>
                    <input
                      type="text"
                      value={q}
                      onChange={(e) => {
                        const newQ = [...announcement.qualifications];
                        newQ[idx] = e.target.value;
                        setAnnouncement({ ...announcement, qualifications: newQ });
                      }}
                      style={{ flex: 1, padding: '6px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const newQ = announcement.qualifications.filter((_, i) => i !== idx);
                        setAnnouncement({ ...announcement, qualifications: newQ });
                      }}
                      style={{ color: '#dc2626', background: '#fee2e2', border: 'none', borderRadius: '6px', padding: '6px 10px', cursor: 'pointer' }}
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>

              {/* 6. Benefits (Line by line) */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <label style={{ fontSize: '0.85rem', fontWeight: 700 }}>
                    អត្ថប្រយោជន៍ទទួលបាន (Benefits & Remuneration)
                  </label>
                  <button
                    type="button"
                    onClick={() => setAnnouncement({ ...announcement, benefits: [...announcement.benefits, ''] })}
                    style={{ fontSize: '0.78rem', color: '#16a34a', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '6px', padding: '3px 8px', cursor: 'pointer' }}
                  >
                    + បន្ថែមអត្ថប្រយោជន៍
                  </button>
                </div>
                {announcement.benefits.map((b, idx) => (
                  <div key={idx} style={{ display: 'flex', gap: '8px', marginBottom: '6px' }}>
                    <input
                      type="text"
                      value={b}
                      onChange={(e) => {
                        const newB = [...announcement.benefits];
                        newB[idx] = e.target.value;
                        setAnnouncement({ ...announcement, benefits: newB });
                      }}
                      style={{ flex: 1, padding: '6px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const newB = announcement.benefits.filter((_, i) => i !== idx);
                        setAnnouncement({ ...announcement, benefits: newB });
                      }}
                      style={{ color: '#dc2626', background: '#fee2e2', border: 'none', borderRadius: '6px', padding: '6px 10px', cursor: 'pointer' }}
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>

              {/* 7. Required Documents */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <label style={{ fontSize: '0.85rem', fontWeight: 700 }}>
                    ឯកសារត្រូវភ្ជាប់មកជាមួយ (Required Attached Documents)
                  </label>
                  <button
                    type="button"
                    onClick={() => setAnnouncement({ ...announcement, requiredDocs: [...announcement.requiredDocs, { name: '', copies: '០១ ច្បាប់' }] })}
                    style={{ fontSize: '0.78rem', color: '#2563eb', background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '6px', padding: '3px 8px', cursor: 'pointer' }}
                  >
                    + បន្ថែមឯកសារ
                  </button>
                </div>
                {announcement.requiredDocs.map((doc, idx) => (
                  <div key={idx} style={{ display: 'flex', gap: '8px', marginBottom: '6px' }}>
                    <input
                      type="text"
                      placeholder="ឈ្មោះឯកសារ (Document Name)"
                      value={doc.name}
                      onChange={(e) => {
                        const newDocs = [...announcement.requiredDocs];
                        newDocs[idx] = { ...newDocs[idx], name: e.target.value };
                        setAnnouncement({ ...announcement, requiredDocs: newDocs });
                      }}
                      style={{ flex: 2, padding: '6px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
                    />
                    <input
                      type="text"
                      placeholder="ចំនួនច្បាប់ (Copies)"
                      value={doc.copies}
                      onChange={(e) => {
                        const newDocs = [...announcement.requiredDocs];
                        newDocs[idx] = { ...newDocs[idx], copies: e.target.value };
                        setAnnouncement({ ...announcement, requiredDocs: newDocs });
                      }}
                      style={{ flex: 1, padding: '6px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const newDocs = announcement.requiredDocs.filter((_, i) => i !== idx);
                        setAnnouncement({ ...announcement, requiredDocs: newDocs });
                      }}
                      style={{ color: '#dc2626', background: '#fee2e2', border: 'none', borderRadius: '6px', padding: '6px 10px', cursor: 'pointer' }}
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>

              {/* 8. Submission Paragraph */}
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, marginBottom: '4px' }}>
                  កាលបរិច្ឆេទ & ទីកន្លែងទទួលពាក្យ (Submission Details & Address)
                </label>
                <textarea
                  rows={3}
                  value={announcement.submissionParagraphKh}
                  onChange={(e) => setAnnouncement({ ...announcement, submissionParagraphKh: e.target.value })}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.88rem' }}
                />
              </div>

              {/* 9. Contacts */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <label style={{ fontSize: '0.85rem', fontWeight: 700 }}>
                    លេខទូរស័ព្ទទំនាក់ទំនង (Contact Persons & Hotlines)
                  </label>
                  <button
                    type="button"
                    onClick={() => setAnnouncement({ ...announcement, contactPersons: [...announcement.contactPersons, { name: '', phone: '' }] })}
                    style={{ fontSize: '0.78rem', color: '#2563eb', background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '6px', padding: '3px 8px', cursor: 'pointer' }}
                  >
                    + បន្ថែមអ្នកទំនាក់ទំនង
                  </button>
                </div>
                {announcement.contactPersons.map((cp, idx) => (
                  <div key={idx} style={{ display: 'flex', gap: '8px', marginBottom: '6px' }}>
                    <input
                      type="text"
                      placeholder="ឈ្មោះអ្នកទំនាក់ទំនង (Name)"
                      value={cp.name}
                      onChange={(e) => {
                        const newC = [...announcement.contactPersons];
                        newC[idx] = { ...newC[idx], name: e.target.value };
                        setAnnouncement({ ...announcement, contactPersons: newC });
                      }}
                      style={{ flex: 1, padding: '6px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
                    />
                    <input
                      type="text"
                      placeholder="លេខទូរស័ព្ទ (Phone)"
                      value={cp.phone}
                      onChange={(e) => {
                        const newC = [...announcement.contactPersons];
                        newC[idx] = { ...newC[idx], phone: e.target.value };
                        setAnnouncement({ ...announcement, contactPersons: newC });
                      }}
                      style={{ flex: 1, padding: '6px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const newC = announcement.contactPersons.filter((_, i) => i !== idx);
                        setAnnouncement({ ...announcement, contactPersons: newC });
                      }}
                      style={{ color: '#dc2626', background: '#fee2e2', border: 'none', borderRadius: '6px', padding: '6px 10px', cursor: 'pointer' }}
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>

              {/* 10. Bottom Action Bar */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '12px' }}>
                <button
                  type="button"
                  onClick={() => setActiveTab('preview')}
                  style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#f8fafc', cursor: 'pointer' }}
                >
                  មើលគំរូឡើងវិញ (Preview)
                </button>
                <button
                  type="button"
                  onClick={handleSaveAnnouncement}
                  disabled={isSaving}
                  style={{ padding: '8px 24px', borderRadius: '8px', border: 'none', background: '#16a34a', color: '#fff', fontWeight: 700, cursor: 'pointer' }}
                >
                  {isSaving ? 'កំពុងរក្សាទុក...' : '💾 រក្សាទុក (Save Changes)'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Standard A4 Print Stylesheet */}
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #recruitment-print-area,
          #recruitment-print-area * {
            visibility: visible;
          }
          #recruitment-print-area {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            max-width: 100% !important;
            padding: 18mm 20mm !important;
            box-shadow: none !important;
            background: #ffffff !important;
            page-break-after: avoid;
            font-size: 11pt !important;
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
