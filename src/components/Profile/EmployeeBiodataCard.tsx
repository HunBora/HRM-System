'use client';

import React, { useState, useMemo } from 'react';

interface EmployeeBiodataCardProps {
  employee: {
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
    photoUrl?: string | null;
    basicSalary?: number | null;
    hireDate?: string | null;
  };
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
  if (!dateStr) return '25 April, 2016';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  const day = d.getDate();
  const month = MONTH_NAMES_FULL[d.getMonth()];
  const year = d.getFullYear();
  return `${day} ${month}, ${year}`;
}

export function formatDob(dateStr?: string | null): string {
  if (!dateStr) return '16-Mar-1988';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  const day = String(d.getDate()).padStart(2, '0');
  const month = MONTH_NAMES_SHORT[d.getMonth()];
  const year = d.getFullYear();
  return `${day}-${month}-${year}`;
}

export function calculateTenure(hireDateStr?: string | null): string {
  if (!hireDateStr) return '10 Y 6 M 11 D';
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
}: EmployeeBiodataCardProps) {
  const [showSalary, setShowSalary] = useState(false);

  const empNameKh = `${employee.lastNameKh || ''} ${employee.firstNameKh || ''}`.trim();
  const empNameEn = `${employee.firstNameEn || ''} ${employee.lastNameEn || ''}`.trim();
  const displayName = empNameKh || empNameEn || 'ប៉េន ជីវន្ត';

  const hireDateFormatted = useMemo(() => formatHireDate(employee.hireDate), [employee.hireDate]);
  const dobFormatted = useMemo(() => formatDob(employee.dob), [employee.dob]);
  const tenureFormatted = useMemo(() => calculateTenure(employee.hireDate), [employee.hireDate]);

  const phoneDisplay = employee.phone || '092 800 838';
  const emailDisplay = employee.email || 'telalube@gmail.com';
  const positionDisplay = employee.position || 'ប្រធានផ្នែកឃ្លាំងស្តុកប្រេងរំអិល';
  const departmentDisplay = employee.department || 'នាយកដ្ឋានប្រតិបត្តិការ';

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

      {/* TOP HEADER: < ប្រវត្តិនិយោជិត ••• matching Screenshot */}
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
          title="ជម្រើសបន្ថែម"
        >
          •••
        </div>
      </div>

      {/* EMPLOYEE IDENTITY HEADER matching Screenshot */}
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

      {/* CARD 1: ព័ត៌មានទំនាក់ទំនង (Contact Information) matching Screenshot */}
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
              <a
                href={`tel:${phoneDisplay.replace(/\s+/g, '')}`}
                style={{
                  fontSize: '0.95rem',
                  fontWeight: 700,
                  color: '#0284c7', // Blue link matching Screenshot
                  textDecoration: 'none',
                  fontFamily: 'monospace, sans-serif',
                }}
              >
                {phoneDisplay}
              </a>
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
              <a
                href={`mailto:${emailDisplay}`}
                style={{
                  fontSize: '0.92rem',
                  fontWeight: 700,
                  color: '#0284c7', // Blue link matching Screenshot
                  textDecoration: 'none',
                }}
              >
                {emailDisplay}
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* CARD 2: ព័ត៌មានលម្អិតនិយោជិត (Employment Details) matching Screenshot */}
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
              {employee.employeeId || 'TELA102629'}
            </div>
          </div>
          <div>
            <div className="kh-text biodata-label">អង្គភាពអាជីវកម្ម</div>
            <div className="kh-text biodata-value">
              {employee.department || 'រដ្ឋបាល ធនធានមនុស្ស'}
            </div>
          </div>

          {/* Row 2: សាខា vs ផ្នែក */}
          <div>
            <div className="kh-text biodata-label">សាខា</div>
            <div className="kh-text biodata-value">
              រោងចក្រប្រេងរំអិល
            </div>
          </div>
          <div>
            <div className="kh-text biodata-label">ផ្នែក</div>
            <div className="kh-text biodata-value">
              {employee.department || 'រដ្ឋបាល ធនធានមនុស្ស'}
            </div>
          </div>

          {/* Row 3: នាយកដ្ឋាន vs ទីតាំង */}
          <div>
            <div className="kh-text biodata-label">នាយកដ្ឋាន</div>
            <div className="kh-text biodata-value">
              {departmentDisplay}
            </div>
          </div>
          <div>
            <div className="kh-text biodata-label">ទីតាំង</div>
            <div className="kh-text biodata-value">
              រោងចក្រប្រេងរំអិលព្រែកព្នៅ
            </div>
          </div>

          {/* Row 4: ថ្នាក់ vs ថ្នាក់ការងារ */}
          <div>
            <div className="kh-text biodata-label">ថ្នាក់</div>
            <div className="biodata-value" style={{ fontFamily: 'monospace' }}>
              LEVEL 08
            </div>
          </div>
          <div>
            <div className="kh-text biodata-label">ថ្នាក់ការងារ</div>
            <div className="kh-text biodata-value">
              {employee.line ? `បុគ្គលិក ${employee.line}` : 'បុគ្គលិកការិយាល័យ'}
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

          {/* Row 6: ថ្ងៃកំណើត vs ប្រាក់ខែ (##.## with Eye toggle) */}
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
                {showSalary ? `$${employee.basicSalary?.toFixed(2) || '0.00'}` : '##.##'}
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

      {/* CARD 3: ស្ថានភាពប្រាក់កម្ចីបុគ្គលិក (ប្រសិនបើមាន) */}
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
