'use client';

import React, { useState, useMemo } from 'react';

export interface EmployeeBiodataProps {
  id: string;
  employeeId: string;
  firstNameEn: string;
  lastNameEn: string;
  firstNameKh?: string | null;
  lastNameKh?: string | null;
  position: string;
  department: string;
  line?: string | null;
  shift?: string | null;
  phone?: string | null;
  email?: string | null;
  dob?: string | null;
  gender?: string | null;
  maritalStatus?: string | null;
  spouseName?: string | null;
  numberOfChildren?: number | null;
  placeOfBirth?: string | null;
  address?: string | null;
  cardNo?: string | null;
  nationalId?: string | null;
  bankCardNo?: string | null;
  nssfNo?: string | null;
  education?: string | null;
  companyName?: string | null;
  photoUrl?: string | null;
  basicSalary?: number | null;
  hireDate?: string | null;
}

interface Props {
  employee: EmployeeBiodataProps;
  activeLoan?: {
    loanCode: string;
    loanAmount: number;
    monthlyDeduction: number;
    remainingBalance: number;
  } | null;
  onBack?: () => void;
}

const MONTH_NAMES_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export function formatHireDate(dateStr?: string | null): string {
  if (!dateStr) return '-';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  const day = d.getDate();
  const month = MONTH_NAMES_SHORT[d.getMonth()];
  const year = d.getFullYear();
  return `${day} ${month}, ${year}`;
}

export function formatDob(dateStr?: string | null): string {
  if (!dateStr) return '-';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  const day = String(d.getDate()).padStart(2, '0');
  const month = MONTH_NAMES_SHORT[d.getMonth()];
  const year = d.getFullYear();
  return `${day}-${month}-${year}`;
}

export function calculateTenure(hireDateStr?: string | null): string {
  if (!hireDateStr) return '-';
  const start = new Date(hireDateStr);
  const now = new Date();
  if (isNaN(start.getTime()) || start > now) return '0 Y 0 M 0 D';

  let years = now.getFullYear() - start.getFullYear();
  let months = now.getMonth() - start.getMonth();
  let days = now.getDate() - start.getDate();

  if (days < 0) {
    months -= 1;
    const prevMonthLastDay = new Date(now.getFullYear(), now.getMonth(), 0).getDate();
    days += prevMonthLastDay;
  }
  if (months < 0) {
    years -= 1;
    months += 12;
  }

  return `${years} Y ${months} M ${days} D`;
}

export function formatCompanyName(name?: string | null): string {
  if (!name) return 'G.S Textile Garment (Cambodia) Co., Ltd';
  let formatted = name.trim();
  // Handle compact unspaced name like G.STextileGarment(Cambodia)co.,Ltd
  if (/G\.?STextileGarment/i.test(formatted)) {
    return 'G.S Textile Garment (Cambodia) Co., Ltd';
  }
  // If text contains unspaced punctuation, insert clean spaces:
  formatted = formatted
    .replace(/([,.)])/g, '$1 ')
    .replace(/\(/g, ' (')
    .replace(/\s+/g, ' ')
    .trim();
  return formatted;
}

export default function EmployeeBiodataCard({
  employee,
  activeLoan,
  onBack,
}: Props) {
  const [showSalary, setShowSalary] = useState(false);
  const [showMoreDetails, setShowMoreDetails] = useState(false);

  // Name: take from DB
  const empNameKh = `${employee.lastNameKh || ''} ${employee.firstNameKh || ''}`.trim();
  const empNameEn = `${employee.firstNameEn || ''} ${employee.lastNameEn || ''}`.trim();
  const displayName = empNameKh || empNameEn || employee.employeeId;

  // Real Database Dates & Calculations
  const hireDateFormatted = useMemo(() => formatHireDate(employee.hireDate), [employee.hireDate]);
  const dobFormatted = useMemo(() => formatDob(employee.dob), [employee.dob]);
  const tenureFormatted = useMemo(() => calculateTenure(employee.hireDate), [employee.hireDate]);

  // Real Contact Info
  const phoneDisplay = employee.phone || '-';
  const emailDisplay = employee.email || (employee.phone ? `${employee.employeeId.toLowerCase()}@company.com` : '-');

  // Real Employment Fields
  const positionDisplay = employee.position || '-';
  const departmentDisplay = employee.department || '-';
  const companyDisplay = formatCompanyName(employee.companyName);
  const divisionDisplay = employee.line ? `ផ្នែកផលិត (${employee.line})` : departmentDisplay;
  const locationDisplay = employee.address || employee.placeOfBirth || 'រាជធានីភ្នំពេញ';
  const gradeDisplay = employee.cardNo ? `CARD-${employee.cardNo}` : (employee.education || 'LEVEL 01');
  const jobRankDisplay = employee.position || 'បុគ្គលិកពេញសិទ្ធិ';

  return (
    <div
      style={{
        maxWidth: '520px',
        margin: '0 auto',
        width: '100%',
        boxSizing: 'border-box',
        padding: '0 2px 24px 2px',
      }}
    >
      <style>{`
        .biodata-card {
          background: #ffffff;
          border-radius: 18px;
          padding: 18px 18px;
          border: 1px solid #f1f5f9;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.03);
          margin-bottom: 14px;
          box-sizing: border-box;
          width: 100%;
          overflow: hidden;
        }

        .biodata-grid {
          display: grid !important;
          grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
          gap: 16px 14px;
          width: 100%;
          box-sizing: border-box;
        }

        .biodata-col {
          min-width: 0 !important;
          width: 100%;
          overflow: hidden;
          box-sizing: border-box;
        }

        .biodata-label {
          font-size: 0.74rem;
          color: #64748b;
          font-weight: 600;
          margin-bottom: 3px;
          line-height: 1.25;
          white-space: normal;
          word-break: break-word;
          overflow-wrap: anywhere;
        }

        .biodata-value {
          font-size: 0.90rem;
          font-weight: 800;
          color: #0f172a;
          line-height: 1.35;
          white-space: normal;
          word-break: break-word;
          overflow-wrap: anywhere;
          hyphens: auto;
        }

        @media (max-width: 480px) {
          .biodata-card {
            padding: 14px 14px !important;
            border-radius: 16px !important;
            margin-bottom: 12px !important;
          }
          .biodata-grid {
            gap: 14px 10px !important;
          }
          .biodata-label {
            font-size: 0.70rem !important;
            margin-bottom: 2px !important;
          }
          .biodata-value {
            font-size: 0.84rem !important;
            line-height: 1.25 !important;
          }
        }

        @media (max-width: 360px) {
          .biodata-card {
            padding: 12px 10px !important;
          }
          .biodata-grid {
            gap: 12px 8px !important;
          }
          .biodata-label {
            font-size: 0.66rem !important;
          }
          .biodata-value {
            font-size: 0.80rem !important;
          }
        }
      `}</style>

      {/* TOP HEADER: < ប្រវត្តិនិយោជិត ••• */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '14px',
          padding: '4px 6px',
        }}
      >
        {onBack ? (
          <button
            onClick={onBack}
            type="button"
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              background: '#ffffff',
              border: '1px solid #e2e8f0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: '#0f172a',
              fontSize: '20px',
              fontWeight: 800,
              boxShadow: '0 2px 6px rgba(0,0,0,0.03)',
            }}
            title="ត្រឡប់ក្រោយ"
          >
            ‹
          </button>
        ) : (
          <div style={{ width: '36px' }} />
        )}

        <h2
          className="kh-text"
          style={{
            margin: 0,
            fontSize: '1.20rem',
            fontWeight: 800,
            color: '#059669', // Lush Green matching Screenshot
          }}
        >
          ប្រវត្តិនិយោជិត
        </h2>

        <div
          onClick={() => setShowMoreDetails(!showMoreDetails)}
          style={{
            width: '36px',
            height: '36px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '18px',
            color: '#64748b',
            cursor: 'pointer',
          }}
          title="ព័ត៌មានលម្អិតបន្ថែម"
        >
          •••
        </div>
      </div>

      {/* EMPLOYEE IDENTITY HEADER (Avatar, Name, Position, Department from DB) */}
      <div style={{ textAlign: 'center', marginBottom: '18px' }}>
        {employee.photoUrl ? (
          <img
            src={employee.photoUrl}
            alt=""
            style={{
              width: '68px',
              height: '68px',
              borderRadius: '50%',
              objectFit: 'cover',
              margin: '0 auto 10px auto',
              border: '2px solid #10b981',
              boxShadow: '0 4px 12px rgba(16, 185, 129, 0.2)',
              display: 'block',
            }}
          />
        ) : (
          <div
            style={{
              width: '62px',
              height: '62px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #059669 0%, #10b981 100%)',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 900,
              fontSize: '24px',
              margin: '0 auto 10px auto',
              boxShadow: '0 4px 12px rgba(16, 185, 129, 0.25)',
            }}
          >
            {displayName.charAt(0) || 'ប'}
          </div>
        )}

        <h1
          className="kh-text"
          style={{
            margin: '0 0 5px 0',
            fontSize: '1.35rem',
            fontWeight: 900,
            color: '#0f172a',
            letterSpacing: '-0.01em',
          }}
        >
          {displayName}
        </h1>

        <div
          className="kh-text"
          style={{
            fontSize: '0.88rem',
            color: '#475569',
            fontWeight: 600,
            marginBottom: '8px',
          }}
        >
          {positionDisplay}
        </div>

        <div>
          <span
            className="kh-text"
            style={{
              display: 'inline-block',
              background: '#ecfdf5',
              border: '1px solid #a7f3d0',
              color: '#059669',
              borderRadius: '999px',
              padding: '3px 14px',
              fontSize: '0.76rem',
              fontWeight: 700,
            }}
          >
            {departmentDisplay}
          </span>
        </div>
      </div>

      {/* CARD 1: ព័ត៌មានទំនាក់ទំនង (Contact Information from DB) */}
      <div className="biodata-card">
        <h3
          className="kh-text"
          style={{
            margin: '0 0 14px 0',
            fontSize: '0.90rem',
            fontWeight: 800,
            color: '#334155',
          }}
        >
          ព័ត៌មានទំនាក់ទំនង
        </h3>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {/* Phone */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '17px',
                color: '#475569',
                flexShrink: 0,
              }}
            >
              📱
            </div>
            <div style={{ minWidth: 0, flex: 1 }}>
              <div className="kh-text biodata-label">
                ទូរស័ព្ទ
              </div>
              {phoneDisplay !== '-' ? (
                <a
                  href={`tel:${phoneDisplay.replace(/\s+/g, '')}`}
                  style={{
                    fontSize: '0.92rem',
                    fontWeight: 700,
                    color: '#0284c7',
                    textDecoration: 'none',
                    fontFamily: 'monospace, sans-serif',
                    display: 'block',
                    overflowWrap: 'anywhere',
                  }}
                >
                  {phoneDisplay}
                </a>
              ) : (
                <span style={{ fontSize: '0.88rem', color: '#94a3b8' }}>-</span>
              )}
            </div>
          </div>

          {/* Email */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '15px',
                fontWeight: 800,
                color: '#475569',
                flexShrink: 0,
              }}
            >
              @
            </div>
            <div style={{ minWidth: 0, flex: 1 }}>
              <div className="kh-text biodata-label">
                អ៊ីម៉ែល
              </div>
              {emailDisplay !== '-' ? (
                <a
                  href={`mailto:${emailDisplay}`}
                  style={{
                    fontSize: '0.88rem',
                    fontWeight: 700,
                    color: '#0284c7',
                    textDecoration: 'none',
                    display: 'block',
                    overflowWrap: 'anywhere',
                    wordBreak: 'break-all',
                  }}
                >
                  {emailDisplay}
                </a>
              ) : (
                <span style={{ fontSize: '0.88rem', color: '#94a3b8' }}>-</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* CARD 2: ព័ត៌មានលម្អិតនិយោជិត (Employment Details from DB) */}
      <div className="biodata-card">
        <h3
          className="kh-text"
          style={{
            margin: '0 0 16px 0',
            fontSize: '0.90rem',
            fontWeight: 800,
            color: '#334155',
          }}
        >
          ព័ត៌មានលម្អិតនិយោជិត
        </h3>

        <div className="biodata-grid">
          {/* Row 1: លេខសម្គាល់និយោជិត vs អង្គភាពអាជីវកម្ម */}
          <div className="biodata-col">
            <div className="kh-text biodata-label">លេខសម្គាល់និយោជិត</div>
            <div className="biodata-value" style={{ fontFamily: 'monospace' }}>
              {employee.employeeId || '-'}
            </div>
          </div>
          <div className="biodata-col">
            <div className="kh-text biodata-label">អង្គភាពអាជីវកម្ម</div>
            <div className="kh-text biodata-value">
              {departmentDisplay}
            </div>
          </div>

          {/* Row 2: សាខា vs ផ្នែក */}
          <div className="biodata-col">
            <div className="kh-text biodata-label">សាខា</div>
            <div className="kh-text biodata-value">
              {companyDisplay}
            </div>
          </div>
          <div className="biodata-col">
            <div className="kh-text biodata-label">ផ្នែក</div>
            <div className="kh-text biodata-value">
              {departmentDisplay}
            </div>
          </div>

          {/* Row 3: នាយកដ្ឋាន vs ទីតាំង */}
          <div className="biodata-col">
            <div className="kh-text biodata-label">នាយកដ្ឋាន</div>
            <div className="kh-text biodata-value">
              {divisionDisplay}
            </div>
          </div>
          <div className="biodata-col">
            <div className="kh-text biodata-label">ទីតាំង</div>
            <div className="kh-text biodata-value">
              {locationDisplay}
            </div>
          </div>

          {/* Row 4: ថ្នាក់ vs ថ្នាក់ការងារ */}
          <div className="biodata-col">
            <div className="kh-text biodata-label">ថ្នាក់</div>
            <div className="biodata-value" style={{ fontFamily: 'monospace' }}>
              {gradeDisplay}
            </div>
          </div>
          <div className="biodata-col">
            <div className="kh-text biodata-label">ថ្នាក់ការងារ</div>
            <div className="kh-text biodata-value">
              {jobRankDisplay}
            </div>
          </div>

          {/* Row 5: ថ្ងៃចាប់ផ្តើម vs រយៈពេលបម្រើការ */}
          <div className="biodata-col">
            <div className="kh-text biodata-label">ថ្ងៃចាប់ផ្តើម</div>
            <div className="biodata-value">
              {hireDateFormatted}
            </div>
          </div>
          <div className="biodata-col">
            <div className="kh-text biodata-label">រយៈពេលបម្រើការ</div>
            <div className="biodata-value" style={{ fontFamily: 'monospace, sans-serif', fontSize: '0.85rem' }}>
              {tenureFormatted}
            </div>
          </div>

          {/* Row 6: ថ្ងៃកំណើត vs ប្រាក់ខែ */}
          <div className="biodata-col">
            <div className="kh-text biodata-label">ថ្ងៃកំណើត</div>
            <div className="biodata-value">
              {dobFormatted}
            </div>
          </div>
          <div className="biodata-col">
            <div className="kh-text biodata-label">ប្រាក់ខែ</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', minWidth: 0 }}>
              <span className="biodata-value" style={{ fontFamily: 'monospace' }}>
                {showSalary
                  ? `$${(employee.basicSalary ?? 0).toFixed(2)}`
                  : '##.##'}
              </span>
              <button
                onClick={() => setShowSalary(!showSalary)}
                type="button"
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '13px',
                  color: '#64748b',
                  padding: '2px',
                  flexShrink: 0,
                }}
                title={showSalary ? 'លាក់ប្រាក់ខែ' : 'បង្ហាញប្រាក់ខែ'}
              >
                {showSalary ? '👁️' : '🙈'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* CARD 3: ព័ត៌មានអត្តសញ្ញាណ & គ្រួសារ (Identity & Official Records from DB) */}
      <div className="biodata-card">
        <div
          onClick={() => setShowMoreDetails(!showMoreDetails)}
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            cursor: 'pointer',
          }}
        >
          <h3
            className="kh-text"
            style={{
              margin: 0,
              fontSize: '0.90rem',
              fontWeight: 800,
              color: '#334155',
            }}
          >
            📋 ព័ត៌មានអត្តសញ្ញាណ & គ្រួសារ
          </h3>
          <span style={{ fontSize: '0.76rem', color: '#059669', fontWeight: 700 }}>
            {showMoreDetails ? 'បង្រួម ▲' : 'មើលលម្អិត ▼'}
          </span>
        </div>

        {showMoreDetails && (
          <div
            className="biodata-grid"
            style={{
              marginTop: '14px',
              paddingTop: '14px',
              borderTop: '1px solid #f1f5f9',
            }}
          >
            <div className="biodata-col">
              <div className="kh-text biodata-label">អត្តសញ្ញាណប័ណ្ណ (ID)</div>
              <div className="biodata-value" style={{ fontFamily: 'monospace' }}>
                {employee.nationalId || '-'}
              </div>
            </div>
            <div className="biodata-col">
              <div className="kh-text biodata-label">លេខ ប.ស.ស (NSSF)</div>
              <div className="biodata-value" style={{ fontFamily: 'monospace' }}>
                {employee.nssfNo || '-'}
              </div>
            </div>

            <div className="biodata-col">
              <div className="kh-text biodata-label">កាតធនាគារ (Bank Card)</div>
              <div className="biodata-value" style={{ fontFamily: 'monospace' }}>
                {employee.bankCardNo || '-'}
              </div>
            </div>
            <div className="biodata-col">
              <div className="kh-text biodata-label">កម្រិតវប្បធម៌ (Education)</div>
              <div className="kh-text biodata-value">
                {employee.education || '-'}
              </div>
            </div>

            <div className="biodata-col">
              <div className="kh-text biodata-label">ទីកន្លែងកំណើត</div>
              <div className="kh-text biodata-value">
                {employee.placeOfBirth || '-'}
              </div>
            </div>
            <div className="biodata-col">
              <div className="kh-text biodata-label">ស្ថានភាពគ្រួសារ</div>
              <div className="kh-text biodata-value">
                {employee.maritalStatus === 'MARRIED' ? 'រៀបការរួច (Married)' : 'នៅលីវ (Single)'}
              </div>
            </div>

            {employee.maritalStatus === 'MARRIED' && (
              <>
                <div className="biodata-col">
                  <div className="kh-text biodata-label">ឈ្មោះប្តី/ប្រពន្ធ</div>
                  <div className="kh-text biodata-value">
                    {employee.spouseName || '-'}
                  </div>
                </div>
                <div className="biodata-col">
                  <div className="kh-text biodata-label">ចំនួនកូន</div>
                  <div className="kh-text biodata-value">
                    {employee.numberOfChildren ? `${employee.numberOfChildren} នាក់` : 'គ្មាន'}
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* CARD 4: ស្ថានភាពប្រាក់កម្ចីបុគ្គលិក (ប្រសិនបើមាន) */}
      {activeLoan && (
        <div className="biodata-card" style={{ background: '#fffbeb', border: '1px solid #fde68a' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <h3 className="kh-text" style={{ margin: 0, fontSize: '0.88rem', fontWeight: 800, color: '#92400e' }}>
              💳 ស្ថានភាពប្រាក់កម្ចីសកម្ម ({activeLoan.loanCode})
            </h3>
            <span style={{ fontSize: '0.72rem', background: '#fef3c7', color: '#b45309', padding: '2px 8px', borderRadius: '6px', fontWeight: 700 }}>
              សកម្ម
            </span>
          </div>
          <div className="biodata-grid">
            <div className="biodata-col">
              <span className="kh-text biodata-label" style={{ color: '#78350f' }}>ប្រាក់កម្ចីដើម:</span>
              <strong style={{ display: 'block', fontFamily: 'monospace', color: '#92400e', marginTop: '2px', fontSize: '0.92rem' }}>
                ${activeLoan.loanAmount.toFixed(2)}
              </strong>
            </div>
            <div className="biodata-col">
              <span className="kh-text biodata-label" style={{ color: '#78350f' }}>កាត់ប្រចាំខែ:</span>
              <strong style={{ display: 'block', fontFamily: 'monospace', color: '#4338ca', marginTop: '2px', fontSize: '0.92rem' }}>
                ${activeLoan.monthlyDeduction.toFixed(2)}
              </strong>
            </div>
            <div className="biodata-col" style={{ gridColumn: 'span 2' }}>
              <span className="kh-text biodata-label" style={{ color: '#78350f' }}>សមតុល្យនៅសល់:</span>
              <strong style={{ display: 'block', fontFamily: 'monospace', color: '#b45309', marginTop: '2px', fontSize: '1rem' }}>
                ${activeLoan.remainingBalance.toFixed(2)}
              </strong>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
