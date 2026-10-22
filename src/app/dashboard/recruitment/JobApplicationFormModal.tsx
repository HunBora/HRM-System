'use client';

import React, { useState } from 'react';
import Swal from 'sweetalert2';
import { generateApplicationFormDocxBlob, JobApplicationFormDocxData } from '@/lib/recruitmentDocx';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  job: any;
  companySettings?: any;
}

export default function JobApplicationFormModal({ isOpen, onClose, job, companySettings }: Props) {
  const [isGeneratingDocx, setIsGeneratingDocx] = useState(false);
  const [refNo, setRefNo] = useState(`APP-${new Date().getFullYear()}-${job?.id?.slice(0, 4) || '001'}`);

  if (!isOpen || !job) return null;

  const companyName = companySettings?.companyName || 'ក្រសួងសេដ្ឋកិច្ច និង ហិរញ្ញវត្ថុ / ក្រុមហ៊ុន';
  const departmentName = job.department || 'នាយកដ្ឋានរដ្ឋបាល និងធនធានមនុស្ស';
  const jobTitle = job.title || 'បុគ្គលិក';

  const handlePrint = () => {
    window.print();
  };

  const handleExportDocx = async () => {
    setIsGeneratingDocx(true);
    try {
      const data: JobApplicationFormDocxData = {
        companyName,
        department: departmentName,
        jobTitle,
        refNo,
        dateStr: new Date().toLocaleDateString('km-KH'),
      };

      const blob = await generateApplicationFormDocxBlob(data);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `ពាក្យស្នើសុំចូលបម្រើការងារ_${jobTitle.replace(/\s+/g, '_')}.docx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      Swal.fire({
        icon: 'success',
        title: 'ទាញយក Word ជោគជ័យ!',
        text: 'ឯកសារពាក្យស្នើសុំចូលបម្រើការងារ (.docx) ត្រូវបានបង្កើតរួចរាល់',
        timer: 2000,
        showConfirmButton: false,
      });
    } catch (err: any) {
      Swal.fire({ icon: 'error', title: 'បរាជ័យទាញយក Word!', text: err.message });
    } finally {
      setIsGeneratingDocx(false);
    }
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
          maxWidth: '1050px',
          height: '92vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          overflow: 'hidden',
          border: '1px solid #cbd5e1',
        }}
      >
        {/* Top Header Controls */}
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
              <span style={{ fontSize: '1.4rem' }}>📝</span>
              <h2 style={{ margin: 0, fontSize: '1.2rem', color: '#0f172a', fontWeight: 800 }}>
                ទម្រង់ពាក្យស្នើសុំចូលបម្រើការងារផ្លូវការ (Job Application Form)
              </h2>
            </div>
            <p style={{ margin: '2px 0 0 0', fontSize: '0.82rem', color: '#64748b' }}>
              មុខតំណែង ៖ <strong>{jobTitle}</strong> ({departmentName})
            </p>
          </div>

          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            {/* Print Button */}
            <button
              type="button"
              onClick={handlePrint}
              style={{
                background: '#1e293b',
                color: '#fff',
                border: 'none',
                borderRadius: '8px',
                padding: '8px 16px',
                fontSize: '0.82rem',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              🖨️ បោះពុម្ពពាក្យសុំ (Print / PDF)
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
                padding: '8px 16px',
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
                padding: '8px 14px',
                fontSize: '0.85rem',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              ✕ បិទ
            </button>
          </div>
        </div>

        {/* Form Preview Area */}
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
          <div
            id="app-form-print-area"
            style={{
              width: '100%',
              maxWidth: '794px',
              minHeight: '1123px',
              background: '#ffffff',
              boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)',
              padding: '36px 44px',
              fontFamily: 'Khmer OS Siemreap, Siemreap, Kantumruy Pro, sans-serif',
              color: '#0f172a',
              lineHeight: 1.5,
              boxSizing: 'border-box',
            }}
          >
            {/* Header: Company + Motto + Photo 4x6 Box */}
            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1.2fr 0.8fr', alignItems: 'flex-start', marginBottom: '16px', gap: '12px' }}>
              {/* Left: Organization */}
              <div>
                <div style={{ fontFamily: 'Khmer OS Muol Light, Moul', fontSize: '0.92rem', color: '#1e3a8a', fontWeight: 800 }}>
                  {companyName}
                </div>
                <div style={{ fontSize: '0.8rem', color: '#475569', marginTop: '2px' }}>
                  {departmentName}
                </div>
                <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '4px' }}>
                  លេខកូដពាក្យ ៖ <strong>{refNo}</strong>
                </div>
              </div>

              {/* Center: Kingdom Motto */}
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontFamily: 'Khmer OS Muol Light, Moul', fontSize: '1rem', fontWeight: 700, color: '#0f172a' }}>
                  ព្រះរាជាណាចក្រកម្ពុជា
                </div>
                <div style={{ fontFamily: 'Khmer OS Muol Light, Moul', fontSize: '0.88rem', fontWeight: 700, color: '#0f172a', marginTop: '2px' }}>
                  ជាតិ សាសនា ព្រះមហាក្សត្រ
                </div>
                <div style={{ display: 'flex', justifyContent: 'center', margin: '2px 0' }}>
                  <svg width="70" height="10" viewBox="0 0 100 16">
                    <path d="M 10 8 Q 30 14 50 8 T 90 8" fill="none" stroke="#0f172a" strokeWidth="1.5" />
                    <circle cx="50" cy="8" r="2.5" fill="#0f172a" />
                  </svg>
                </div>
              </div>

              {/* Right: Photo Box (៤ x ៦) */}
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <div
                  style={{
                    width: '80px',
                    height: '105px',
                    border: '1.5px dashed #94a3b8',
                    borderRadius: '4px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    textAlign: 'center',
                    fontSize: '0.72rem',
                    color: '#94a3b8',
                    background: '#f8fafc',
                  }}
                >
                  <div>រូបថត</div>
                  <div style={{ fontWeight: 700, margin: '2px 0' }}>៤ x ៦</div>
                  <div style={{ fontSize: '0.62rem' }}>(Photo 4x6)</div>
                </div>
              </div>
            </div>

            {/* Document Title */}
            <div style={{ textAlign: 'center', margin: '10px 0 16px 0' }}>
              <div style={{ fontFamily: 'Khmer OS Muol Light, Moul', fontSize: '1.25rem', fontWeight: 800, color: '#0f172a' }}>
                ពាក្យស្នើសុំចូលបម្រើការងារ
              </div>
              <div style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 700, letterSpacing: '0.5px' }}>
                APPLICATION FOR EMPLOYMENT • 职位申请表
              </div>
              <div style={{ marginTop: '8px', fontSize: '0.92rem' }}>
                មុខតំណែងស្នើសុំ (Position Applied) ៖{' '}
                <span style={{ fontFamily: 'Khmer OS Muol Light, Moul', color: '#1e3a8a', fontSize: '0.98rem' }}>
                  {jobTitle}
                </span>
              </div>
            </div>

            {/* Section I: Personal Information */}
            <div style={{ marginBottom: '14px' }}>
              <div style={{ fontFamily: 'Khmer OS Muol Light, Moul', fontSize: '0.85rem', color: '#1e3a8a', marginBottom: '6px' }}>
                I. ព័ត៌មានផ្ទាល់ខ្លួន (Personal Information)
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
                <tbody>
                  <tr>
                    <td style={{ border: '1px solid #cbd5e1', padding: '6px 8px', width: '50%' }}>
                      នាម និងគោត្តនាម (Khmer) ៖ .............................................
                    </td>
                    <td style={{ border: '1px solid #cbd5e1', padding: '6px 8px', width: '50%' }}>
                      ឈ្មោះជាអក្សរឡាតាំង (Latin) ៖ ...........................................
                    </td>
                  </tr>
                  <tr>
                    <td style={{ border: '1px solid #cbd5e1', padding: '6px 8px' }}>
                      ភេទ (Gender) ៖ [  ] ប្រុស (Male)    [  ] ស្រី (Female)
                    </td>
                    <td style={{ border: '1px solid #cbd5e1', padding: '6px 8px' }}>
                      ថ្ងៃខែឆ្នាំកំណើត (DOB) ៖ ..... / ..... / .........
                    </td>
                  </tr>
                  <tr>
                    <td style={{ border: '1px solid #cbd5e1', padding: '6px 8px' }}>
                      អត្តសញ្ញាណប័ណ្ណ/លិខិតឆ្លងដែន ៖ ........................................
                    </td>
                    <td style={{ border: '1px solid #cbd5e1', padding: '6px 8px' }}>
                      សញ្ជាតិ (Nationality) ៖ ខ្មែរ (Cambodian)
                    </td>
                  </tr>
                  <tr>
                    <td style={{ border: '1px solid #cbd5e1', padding: '6px 8px' }}>
                      លេខទូរស័ព្ទ (Phone) ៖ .................................................
                    </td>
                    <td style={{ border: '1px solid #cbd5e1', padding: '6px 8px' }}>
                      អ៊ីមែល (Email) ៖ .....................................................
                    </td>
                  </tr>
                  <tr>
                    <td colSpan={2} style={{ border: '1px solid #cbd5e1', padding: '6px 8px' }}>
                      ទីកន្លែងកំណើត (Place of Birth) ៖ ................................................................................................................
                    </td>
                  </tr>
                  <tr>
                    <td colSpan={2} style={{ border: '1px solid #cbd5e1', padding: '6px 8px' }}>
                      អាសយដ្ឋានបច្ចុប្បន្ន (Current Address) ៖ ........................................................................................................
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Section II: Education Background */}
            <div style={{ marginBottom: '14px' }}>
              <div style={{ fontFamily: 'Khmer OS Muol Light, Moul', fontSize: '0.85rem', color: '#1e3a8a', marginBottom: '6px' }}>
                II. កម្រិតវប្បធម៌ និងការសិក្សា (Education Background)
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem', textAlign: 'center' }}>
                <thead>
                  <tr style={{ background: '#f8fafc', fontWeight: 700 }}>
                    <th style={{ border: '1px solid #cbd5e1', padding: '6px', width: '28%' }}>កម្រិតវប្បធម៌/សញ្ញាបត្រ (Degree)</th>
                    <th style={{ border: '1px solid #cbd5e1', padding: '6px', width: '36%' }}>គ្រឹះស្ថានសិក្សា (School / University)</th>
                    <th style={{ border: '1px solid #cbd5e1', padding: '6px', width: '22%' }}>ជំនាញ (Major)</th>
                    <th style={{ border: '1px solid #cbd5e1', padding: '6px', width: '14%' }}>ឆ្នាំ (Year)</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td style={{ border: '1px solid #cbd5e1', padding: '6px', textAlign: 'left' }}>បរិញ្ញាបត្រ (Bachelor Degree)</td>
                    <td style={{ border: '1px solid #cbd5e1', padding: '6px' }}>................................................</td>
                    <td style={{ border: '1px solid #cbd5e1', padding: '6px' }}>........................</td>
                    <td style={{ border: '1px solid #cbd5e1', padding: '6px' }}>..........</td>
                  </tr>
                  <tr>
                    <td style={{ border: '1px solid #cbd5e1', padding: '6px', textAlign: 'left' }}>មធ្យមសិក្សា (High School)</td>
                    <td style={{ border: '1px solid #cbd5e1', padding: '6px' }}>................................................</td>
                    <td style={{ border: '1px solid #cbd5e1', padding: '6px' }}>........................</td>
                    <td style={{ border: '1px solid #cbd5e1', padding: '6px' }}>..........</td>
                  </tr>
                  <tr>
                    <td style={{ border: '1px solid #cbd5e1', padding: '6px', textAlign: 'left' }}>ផ្សេងៗ (Other Courses)</td>
                    <td style={{ border: '1px solid #cbd5e1', padding: '6px' }}>................................................</td>
                    <td style={{ border: '1px solid #cbd5e1', padding: '6px' }}>........................</td>
                    <td style={{ border: '1px solid #cbd5e1', padding: '6px' }}>..........</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Section III: Work Experience */}
            <div style={{ marginBottom: '14px' }}>
              <div style={{ fontFamily: 'Khmer OS Muol Light, Moul', fontSize: '0.85rem', color: '#1e3a8a', marginBottom: '6px' }}>
                III. ប្រវត្តិការងារកន្លងមក (Work Experience)
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem', textAlign: 'center' }}>
                <thead>
                  <tr style={{ background: '#f8fafc', fontWeight: 700 }}>
                    <th style={{ border: '1px solid #cbd5e1', padding: '6px', width: '35%' }}>ស្ថាប័ន/ក្រុមហ៊ុន (Organization)</th>
                    <th style={{ border: '1px solid #cbd5e1', padding: '6px', width: '28%' }}>មុខតំណែង (Position)</th>
                    <th style={{ border: '1px solid #cbd5e1', padding: '6px', width: '22%' }}>រយៈពេល (Period)</th>
                    <th style={{ border: '1px solid #cbd5e1', padding: '6px', width: '15%' }}>ប្រាក់បៀវត្ស</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td style={{ border: '1px solid #cbd5e1', padding: '6px', textAlign: 'left' }}>១. .................................................</td>
                    <td style={{ border: '1px solid #cbd5e1', padding: '6px' }}>...................................</td>
                    <td style={{ border: '1px solid #cbd5e1', padding: '6px' }}>.......................</td>
                    <td style={{ border: '1px solid #cbd5e1', padding: '6px' }}>..........</td>
                  </tr>
                  <tr>
                    <td style={{ border: '1px solid #cbd5e1', padding: '6px', textAlign: 'left' }}>២. .................................................</td>
                    <td style={{ border: '1px solid #cbd5e1', padding: '6px' }}>...................................</td>
                    <td style={{ border: '1px solid #cbd5e1', padding: '6px' }}>.......................</td>
                    <td style={{ border: '1px solid #cbd5e1', padding: '6px' }}>..........</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Section IV: Expectations & Candidate Pledge */}
            <div style={{ marginBottom: '14px' }}>
              <div style={{ fontFamily: 'Khmer OS Muol Light, Moul', fontSize: '0.85rem', color: '#1e3a8a', marginBottom: '4px' }}>
                IV. ការរំពឹងទុក និងការសន្យា (Expectation & Declaration)
              </div>
              <div style={{ fontSize: '0.82rem', marginBottom: '6px' }}>
                ប្រាក់បៀវត្សរំពឹងទុក (Expected Salary) ៖ ...................... $   |   ថ្ងៃអាចចូលបម្រើការងារ (Available Date) ៖ ..... / ..... / .........
              </div>
              <div style={{ fontSize: '0.8rem', textAlign: 'justify', lineHeight: 1.5, color: '#334155' }}>
                ខ្ញុំបាទ/នាងខ្ញុំ សូមធានាអះអាងថា រាល់ព័ត៌មានដែលបានបំពេញខាងលើនេះពិតជាត្រឹមត្រូវពិតប្រាកដមែន ប្រសិនបើមានការក្លែងបន្លំណាមួយ ខ្ញុំបាទ/នាងខ្ញុំសូមទទួលខុសត្រូវចំពោះមុខច្បាប់ជាធរមាន។
              </div>
            </div>

            {/* Signature Block */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginTop: '16px' }}>
              <div>
                <div style={{ fontSize: '0.8rem', color: '#475569' }}>
                  ថ្ងៃទី....... ខែ....... ឆ្នាំ២០២៦
                </div>
                <div style={{ fontWeight: 700, fontSize: '0.82rem', marginTop: '2px' }}>
                  អ្នកទទួលពាក្យ (HR Receiver)
                </div>
                <div style={{ height: '50px' }}></div>
                <div style={{ borderBottom: '1px dotted #94a3b8', width: '180px' }}></div>
              </div>

              <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                <div style={{ fontSize: '0.8rem', color: '#475569' }}>
                  ថ្ងៃទី....... ខែ....... ឆ្នាំ២០២៦
                </div>
                <div style={{ fontWeight: 700, fontSize: '0.82rem', marginTop: '2px' }}>
                  ហត្ថលេខា និងឈ្មោះបេក្ខជន (Applicant Signature)
                </div>
                <div style={{ height: '50px' }}></div>
                <div style={{ borderBottom: '1px dotted #94a3b8', width: '200px' }}></div>
              </div>
            </div>

            {/* Tear-off Slip (បង្កាន់ដៃទទួលពាក្យស្នើសុំ) */}
            <div style={{ marginTop: '20px', borderTop: '1.5px dashed #94a3b8', paddingTop: '10px' }}>
              <div style={{ textAlign: 'center', fontSize: '0.72rem', color: '#94a3b8', marginBottom: '4px' }}>
                ✂️ --------------------------- កាត់ត្រង់នេះ (TEAR OFF HERE) --------------------------- ✂️
              </div>
              <div style={{ textAlign: 'center', fontFamily: 'Khmer OS Muol Light, Moul', fontSize: '0.88rem', color: '#1e3a8a' }}>
                បង្កាន់ដៃទទួលពាក្យស្នើសុំចូលបម្រើការងារ (APPLICATION RECEIPT SLIP)
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '0.78rem', marginTop: '6px' }}>
                <div>ស្ថាប័ន ៖ <strong>{companyName}</strong></div>
                <div>មុខតំណែង ៖ <strong>{jobTitle}</strong></div>
                <div>ឈ្មោះបេក្ខជន ៖ .............................................</div>
                <div>លេខទូរស័ព្ទ ៖ .............................................</div>
                <div>កាលបរិច្ឆេទទទួល ៖ ..... / ..... / .........</div>
                <div>ហត្ថលេខាអ្នកទទួល ៖ .............................................</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Print Stylesheet */}
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #app-form-print-area,
          #app-form-print-area * {
            visibility: visible;
          }
          #app-form-print-area {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            max-width: 100% !important;
            padding: 15mm 18mm !important;
            box-shadow: none !important;
            background: #ffffff !important;
            page-break-after: avoid;
            font-size: 10pt !important;
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
