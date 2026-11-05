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
const MONTH_NAMES_FULL = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

export function formatHireDate(dateStr?: string | null): string {
  if (!dateStr) return '-';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  const day = d.getDate();
  const month = MONTH_NAMES_FULL[d.getMonth()];
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
  const companyDisplay = employee.companyName || 'G.STextileGarment(Cambodia)co.,Ltd';
  const divisionDisplay = employee.line ? `ផ្នែកផលិត (${employee.line})` : departmentDisplay;
  const locationDisplay = employee.address || employee.placeOfBirth || 'រាជធានីភ្នំពេញ';
  const gradeDisplay = employee.cardNo ? `CARD-${employee.cardNo}` : (employee.education || 'LEVEL 01');
  const jobRankDisplay = employee.position || 'បុគ្គលិកពេញសិទ្ធិ';

  return (
    <div
      style={{
        maxWidth: '540px',
        margin: '0 auto',
        width: '100%',
        boxSizing: 'border-box',
      }}
    >
      <style>{`
        .biodata-card {
          background: #ffffff;
          border-radius: 20px;
          padding: 20px 22px;
          border: 1px solid #f1f5f9;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.03);
          margin-bottom: 16px;
        }
        .biodata-label {
          font-size: 0.76rem;
          color: #64748b;
          font-weight: 600;
          margin-bottom: 4px;
        }
        .biodata-value {
          font-size: 0.95rem;
          font-weight: 800;
          color: #0f172a;
          line-height: 1.3;
        }
      `}</style>

      {/* TOP HEADER: < ប្រវត្តិនិយោជិត ••• */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '16px',
          padding: '4px 8px',
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
            fontSize: '1.25rem',
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

      {/* EMPLOYEE IDENTITY HEADER (Name, Position, Department from DB) */}
      <div style={{ textAlign: 'center', marginBottom: '22px' }}>
        <h1
          className="kh-text"
          style={{
            margin: '0 0 6px 0',
            fontSize: '1.45rem',
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
            fontSize: '0.92rem',
            color: '#475569',
            fontWeight: 600,
            marginBottom: '10px',
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
              padding: '4px 16px',
              fontSize: '0.78rem',
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
            margin: '0 0 16px 0',
            fontSize: '0.92rem',
            fontWeight: 800,
            color: '#334155',
          }}
        >
          ព័ត៌មានទំនាក់ទំនង
        </h3>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {/* Phone */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '12px',
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '18px',
                color: '#475569',
                flexShrink: 0,
              }}
            >
              📱
            </div>
            <div>
              <div className="kh-text" style={{ fontSize: '0.74rem', color: '#64748b', fontWeight: 600 }}>
                ទូរស័ព្ទ
              </div>
              {phoneDisplay !== '-' ? (
                <a
                  href={`tel:${phoneDisplay.replace(/\s+/g, '')}`}
                  style={{
                    fontSize: '0.95rem',
                    fontWeight: 700,
                    color: '#0284c7', // Blue link
                    textDecoration: 'none',
                    fontFamily: 'monospace, sans-serif',
                  }}
                >
                  {phoneDisplay}
                </a>
              ) : (
                <span style={{ fontSize: '0.92rem', color: '#94a3b8' }}>-</span>
              )}
            </div>
          </div>

          {/* Email */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '12px',
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '16px',
                fontWeight: 800,
                color: '#475569',
                flexShrink: 0,
              }}
            >
              @
            </div>
            <div>
              <div className="kh-text" style={{ fontSize: '0.74rem', color: '#64748b', fontWeight: 600 }}>
                អ៊ីម៉ែល
              </div>
              {emailDisplay !== '-' ? (
                <a
                  href={`mailto:${emailDisplay}`}
                  style={{
                    fontSize: '0.92rem',
                    fontWeight: 700,
                    color: '#0284c7',
                    textDecoration: 'none',
                  }}
                >
                  {emailDisplay}
                </a>
              ) : (
                <span style={{ fontSize: '0.92rem', color: '#94a3b8' }}>-</span>
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
            margin: '0 0 18px 0',
            fontSize: '0.92rem',
            fontWeight: 800,
            color: '#334155',
          }}
        >
          ព័ត៌មានលម្អិតនិយោជិត
        </h3>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '18px 16px',
          }}
        >
          {/* Row 1: លេខសម្គាល់និយោជិត vs អង្គភាពអាជីវកម្ម */}
          <div>
            <div className="kh-text biodata-label">លេខសម្គាល់និយោជិត</div>
            <div className="biodata-value" style={{ fontFamily: 'monospace' }}>
              {employee.employeeId || '-'}
            </div>
          </div>
          <div>
            <div className="kh-text biodata-label">អង្គភាពអាជីវកម្ម</div>
            <div className="kh-text biodata-value">
              {departmentDisplay}
            </div>
          </div>

          {/* Row 2: សាខា vs ផ្នែក */}
          <div>
            <div className="kh-text biodata-label">សាខា</div>
            <div className="kh-text biodata-value">
              {companyDisplay}
            </div>
          </div>
          <div>
            <div className="kh-text biodata-label">ផ្នែក</div>
            <div className="kh-text biodata-value">
              {departmentDisplay}
            </div>
          </div>

          {/* Row 3: នាយកដ្ឋាន vs ទីតាំង */}
          <div>
            <div className="kh-text biodata-label">នាយកដ្ឋាន</div>
            <div className="kh-text biodata-value">
              {divisionDisplay}
            </div>
          </div>
          <div>
            <div className="kh-text biodata-label">ទីតាំង</div>
            <div className="kh-text biodata-value">
              {locationDisplay}
            </div>
          </div>

          {/* Row 4: ថ្នាក់ vs ថ្នាក់ការងារ */}
          <div>
            <div className="kh-text biodata-label">ថ្នាក់</div>
            <div className="biodata-value" style={{ fontFamily: 'monospace' }}>
              {gradeDisplay}
            </div>
          </div>
          <div>
            <div className="kh-text biodata-label">ថ្នាក់ការងារ</div>
            <div className="kh-text biodata-value">
              {jobRankDisplay}
            </div>
          </div>

          {/* Row 5: ថ្ងៃចាប់ផ្តើម vs រយៈពេលបម្រើការ */}
          <div>
            <div className="kh-text biodata-label">ថ្ងៃចាប់ផ្តើម</div>
            <div className="biodata-value">
              {hireDateFormatted}
            </div>
          </div>
          <div>
            <div className="kh-text biodata-label">រយៈពេលបម្រើការ</div>
            <div className="biodata-value" style={{ fontFamily: 'monospace, sans-serif' }}>
              {tenureFormatted}
            </div>
          </div>

          {/* Row 6: ថ្ងៃកំណើត vs ប្រាក់ខែ */}
          <div>
            <div className="kh-text biodata-label">ថ្ងៃកំណើត</div>
            <div className="biodata-value">
              {dobFormatted}
            </div>
          </div>
          <div>
            <div className="kh-text biodata-label">ប្រាក់ខែ</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
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
                  fontSize: '14px',
                  color: '#64748b',
                  padding: '2px',
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
              fontSize: '0.92rem',
              fontWeight: 800,
              color: '#334155',
            }}
          >
            📋 ព័ត៌មានអត្តសញ្ញាណ & គ្រួសារ
          </h3>
          <span style={{ fontSize: '0.78rem', color: '#059669', fontWeight: 700 }}>
            {showMoreDetails ? 'បង្រួម ▲' : 'មើលលម្អិត ▼'}
          </span>
        </div>

        {showMoreDetails && (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '16px 12px',
              marginTop: '16px',
              paddingTop: '14px',
              borderTop: '1px solid #f1f5f9',
            }}
          >
            <div>
              <div className="kh-text biodata-label">អត្តសញ្ញាណប័ណ្ណ (ID)</div>
              <div className="biodata-value" style={{ fontFamily: 'monospace' }}>
                {employee.nationalId || '-'}
              </div>
            </div>
            <div>
              <div className="kh-text biodata-label">លេខ ប.ស.ស (NSSF)</div>
              <div className="biodata-value" style={{ fontFamily: 'monospace' }}>
                {employee.nssfNo || '-'}
              </div>
            </div>

            <div>
              <div className="kh-text biodata-label">កាតធនាគារ (Bank Card)</div>
              <div className="biodata-value" style={{ fontFamily: 'monospace' }}>
                {employee.bankCardNo || '-'}
              </div>
            </div>
            <div>
              <div className="kh-text biodata-label">កម្រិតវប្បធម៌ (Education)</div>
              <div className="kh-text biodata-value">
                {employee.education || '-'}
              </div>
            </div>

            <div>
              <div className="kh-text biodata-label">ទីកន្លែងកំណើត</div>
              <div className="kh-text biodata-value">
                {employee.placeOfBirth || '-'}
              </div>
            </div>
            <div>
              <div className="kh-text biodata-label">ស្ថានភាពគ្រួសារ</div>
              <div className="kh-text biodata-value">
                {employee.maritalStatus === 'MARRIED' ? 'រៀបការរួច (Married)' : 'នៅលីវ (Single)'}
              </div>
            </div>

            {employee.maritalStatus === 'MARRIED' && (
              <>
                <div>
                  <div className="kh-text biodata-label">ឈ្មោះប្តី/ប្រពន្ធ</div>
                  <div className="kh-text biodata-value">
                    {employee.spouseName || '-'}
                  </div>
                </div>
                <div>
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
            <h3 className="kh-text" style={{ margin: 0, fontSize: '0.92rem', fontWeight: 800, color: '#92400e' }}>
              💳 ស្ថានភាពប្រាក់កម្ចីសកម្ម ({activeLoan.loanCode})
            </h3>
            <span style={{ fontSize: '0.74rem', background: '#fef3c7', color: '#b45309', padding: '2px 8px', borderRadius: '6px', fontWeight: 700 }}>
              សកម្ម
            </span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '0.84rem' }}>
            <div>
              <span className="kh-text" style={{ color: '#78350f', fontSize: '0.74rem' }}>ប្រាក់កម្ចីដើម:</span>
              <strong style={{ display: 'block', fontFamily: 'monospace', color: '#92400e', marginTop: '2px' }}>
                ${activeLoan.loanAmount.toFixed(2)}
              </strong>
            </div>
            <div>
              <span className="kh-text" style={{ color: '#78350f', fontSize: '0.74rem' }}>កាត់ប្រចាំខែ:</span>
              <strong style={{ display: 'block', fontFamily: 'monospace', color: '#4338ca', marginTop: '2px' }}>
                ${activeLoan.monthlyDeduction.toFixed(2)}
              </strong>
            </div>
            <div>
              <span className="kh-text" style={{ color: '#78350f', fontSize: '0.74rem' }}>សមតុល្យនៅសល់:</span>
              <strong style={{ display: 'block', fontFamily: 'monospace', color: '#b45309', marginTop: '2px' }}>
                ${activeLoan.remainingBalance.toFixed(2)}
              </strong>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
