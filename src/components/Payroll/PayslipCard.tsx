'use client';

import React from 'react';

export interface PayslipCardProps {
  payroll: any;
  settings?: any;
  copyLabel?: string; // e.g. "ច្បាប់បុគ្គលិក (Employee Copy)" or "ច្បាប់ក្រុមហ៊ុន (Company Copy)"
  compact?: boolean;
  orientation?: 'portrait' | 'landscape';
}

export default function PayslipCard({
  payroll,
  settings,
  copyLabel,
  compact = false,
  orientation = 'portrait',
}: PayslipCardProps) {
  const m = payroll.month.toString().padStart(2, '0');
  const y = payroll.year;
  const emp = payroll.employee || {};

  const companyName = settings?.companyName || 'Telkhmer';

  const fullNameKh = [emp.firstNameKh, emp.lastNameKh].filter(Boolean).join(' ') || '-';
  const fullNameEn = [emp.firstNameEn, emp.lastNameEn].filter(Boolean).join(' ') || '';

  const joinDate = emp.hireDate ? new Date(emp.hireDate).toLocaleDateString('en-GB') : '-';

  // Overtime Breakdown
  const regularOt = payroll.otWage || 0;
  const sunOt = payroll.sunOtWage || 0;
  const nightOt = payroll.nightOtWage || 0;
  const totalOt = regularOt + sunOt + nightOt;

  // Allowances & Incentives
  const bonus = payroll.attendanceBonus || 0;
  const mealAndTransp = (payroll.lunchAllowance || 0) + (payroll.transportation || 0) + (payroll.otMealAllowance || 0);
  const seniorityTotal = (payroll.seniority || 0) + (payroll.seniorityIndemnity || 0);
  const severance = payroll.severancePay || 0;
  const otherEarnings = (payroll.payScaleIncentive || 0) + (payroll.productionIncentive || 0) + (payroll.adjustmentSkill || 0) + (payroll.otherAllowance || 0);

  // Deductions
  const nssf = payroll.nssf || 0;
  const advanceLoan = payroll.loanPension || 0;
  const tax = payroll.taxPayment || 0;
  const absentDeduction = payroll.absentDays > 0 ? ((payroll.basicSalary / 26) * payroll.absentDays) : 0;
  const union = payroll.unionDeduction || 0;

  return (
    <div
      className={`payslip-card ${compact ? 'compact' : ''} ${orientation}`}
      style={{
        backgroundColor: '#ffffff',
        color: '#0f172a',
        border: '1px solid #cbd5e1',
        borderRadius: '8px',
        padding: compact ? (orientation === 'landscape' ? '12px 16px' : '12px 20px') : '24px 30px',
        boxSizing: 'border-box',
        width: '100%',
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        fontSize: compact ? '0.78rem' : '0.88rem',
        lineHeight: 1.35,
      }}
    >
      {/* Optional Copy Badge (e.g. Employee Copy / Company Copy) */}
      {copyLabel && (
        <div
          style={{
            position: 'absolute',
            top: '8px',
            right: '12px',
            fontSize: '0.65rem',
            fontWeight: 'bold',
            padding: '2px 8px',
            borderRadius: '4px',
            backgroundColor: '#f1f5f9',
            border: '1px solid #cbd5e1',
            color: '#475569',
          }}
          className="kh-text"
        >
          {copyLabel}
        </div>
      )}

      {/* 1. Header */}
      <div
        style={{
          textAlign: 'center',
          marginBottom: compact ? '8px' : '14px',
          borderBottom: '2px solid #0f172a',
          paddingBottom: compact ? '6px' : '10px',
        }}
      >
        <h1
          className="kh-text"
          style={{
            fontSize: compact ? '1.15rem' : '1.45rem',
            margin: '0 0 2px 0',
            fontWeight: 800,
            letterSpacing: '0.5px',
            color: '#0f172a',
          }}
        >
          {companyName}
        </h1>
        <h2
          className="kh-text"
          style={{
            fontSize: compact ? '0.95rem' : '1.15rem',
            color: '#1e3a8a',
            margin: '2px 0',
            fontWeight: 700,
          }}
        >
          វិក្កយបត្រប្រាក់បៀវត្សរ៍ (PAYSLIP)
        </h2>
        <div
          style={{
            fontSize: compact ? '0.8rem' : '0.92rem',
            marginTop: '2px',
            fontWeight: 600,
            color: '#334155',
          }}
        >
          <span className="kh-text">ខែ (Month)</span>: {m} / {y}
        </div>
      </div>

      {/* 2. Employee Info Grid (2 Columns) */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: compact ? '4px 16px' : '6px 24px',
          marginBottom: compact ? '8px' : '14px',
          fontSize: compact ? '0.78rem' : '0.86rem',
        }}
      >
        <div>
          <div style={{ marginBottom: compact ? '2px' : '4px' }}>
            <strong>អត្តលេខ (Emp ID):</strong> {emp.employeeId || '-'}
          </div>
          <div style={{ marginBottom: compact ? '2px' : '4px' }} className="kh-text">
            <strong>ឈ្មោះ (Name):</strong> {fullNameKh} {fullNameEn ? `(${fullNameEn})` : ''}
          </div>
          <div style={{ marginBottom: compact ? '2px' : '4px' }}>
            <strong>តួនាទី (Position):</strong> {emp.position || '-'}
          </div>
        </div>
        <div>
          <div style={{ marginBottom: compact ? '2px' : '4px' }}>
            <strong>ផ្នែក (Department):</strong> {emp.department || '-'}
          </div>
          <div style={{ marginBottom: compact ? '2px' : '4px' }}>
            <strong>ថ្ងៃចូលធ្វើការ (Join Date):</strong> {joinDate}
          </div>
          <div style={{ marginBottom: compact ? '2px' : '4px' }}>
            <strong>ថ្ងៃធ្វើការជាក់ស្តែង (Days Worked):</strong> {payroll.workingDays || 0} ថ្ងៃ
          </div>
        </div>
      </div>

      {/* 3. Earnings & Deductions Tables (2 Columns) */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: compact ? '12px' : '24px',
          marginBottom: compact ? '8px' : '12px',
        }}
      >
        {/* EARNINGS */}
        <div
          style={{
            borderRight: '1px dashed #e2e8f0',
            paddingRight: compact ? '8px' : '14px',
          }}
        >
          <h3
            className="kh-text"
            style={{
              fontSize: compact ? '0.8rem' : '0.9rem',
              borderBottom: '1.5px solid #cbd5e1',
              paddingBottom: '3px',
              marginBottom: compact ? '4px' : '6px',
              fontWeight: 700,
              color: '#0f172a',
            }}
          >
            ប្រាក់ចំណូល (EARNINGS)
          </h3>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
            <span>ប្រាក់ខែគោល (Basic Salary)</span>
            <strong>${payroll.basicSalary.toFixed(2)}</strong>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
            <span>ប្រាក់ថែមម៉ោង (OT)</span>
            <span>${totalOt.toFixed(2)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
            <span>ប្រាក់រង្វាន់ (Bonus)</span>
            <span>${bonus.toFixed(2)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
            <span>អាហារ/ធ្វើដំណើរ (Meal/Transp.)</span>
            <span>${mealAndTransp.toFixed(2)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
            <span>ប្រាក់អតីតភាពការងារ (Seniority)</span>
            <span>${seniorityTotal.toFixed(2)}</span>
          </div>
          {severance > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
              <span>ប្រាក់បំណាច់កិច្ចសន្យា (Severance 5%)</span>
              <span>${severance.toFixed(2)}</span>
            </div>
          )}
          {otherEarnings > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
              <span>ប្រាក់បន្ថែមផ្សេងៗ (Other)</span>
              <span>${otherEarnings.toFixed(2)}</span>
            </div>
          )}
        </div>

        {/* DEDUCTIONS */}
        <div style={{ paddingLeft: compact ? '4px' : '6px' }}>
          <h3
            className="kh-text"
            style={{
              fontSize: compact ? '0.8rem' : '0.9rem',
              borderBottom: '1.5px solid #cbd5e1',
              paddingBottom: '3px',
              marginBottom: compact ? '4px' : '6px',
              fontWeight: 700,
              color: '#0f172a',
            }}
          >
            ប្រាក់កាត់កង (DEDUCTIONS)
          </h3>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
            <span>បេឡាជាតិ (NSSF)</span>
            <strong>${nssf.toFixed(2)}</strong>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
            <span>បុរេប្រទាន (Advance/Loan)</span>
            <span>${advanceLoan.toFixed(2)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
            <span>ពន្ធ (Tax)</span>
            <span>${tax.toFixed(2)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
            <span>កាត់អវត្តមាន (Absent Deduction)</span>
            <span>${absentDeduction.toFixed(2)}</span>
          </div>
          {union > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
              <span>សហជីព (Union)</span>
              <span>${union.toFixed(2)}</span>
            </div>
          )}
        </div>
      </div>

      {/* 4. Totals (Right Aligned) */}
      <div
        style={{
          borderTop: '2px solid #0f172a',
          paddingTop: compact ? '6px' : '10px',
          display: 'flex',
          justifyContent: 'flex-end',
          marginBottom: compact ? '10px' : '18px',
        }}
      >
        <div style={{ minWidth: compact ? '250px' : '310px' }}>
          {/* Total Net calculation reference */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              marginBottom: '4px',
              fontSize: compact ? '0.78rem' : '0.86rem',
              color: '#64748b',
              borderBottom: '1px dashed #cbd5e1',
              paddingBottom: '3px',
            }}
          >
            <span className="kh-text">ប្រាក់ខែសុទ្ធសរុប (Total Net):</span>
            <span style={{ fontWeight: 600 }}>${payroll.netSalaryUsd.toFixed(2)}</span>
          </div>

          {/* Actual Cash Payout in USD: $1,327.50 - $7.50 = $1,320.00 */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              marginBottom: '3px',
              fontSize: compact ? '0.88rem' : '1.05rem',
              fontWeight: 'bold',
            }}
          >
            <span className="kh-text">ប្រាក់ត្រូវបើក (NET PAY USD):</span>
            <span style={{ color: '#15803d' }}>
              ${((payroll.paidSalaryUsd > 0 || payroll.netSalaryRiel > 0) ? payroll.paidSalaryUsd : payroll.netSalaryUsd).toFixed(2)}
            </span>
          </div>

          {/* Actual Cash Payout in Riel: 30,300 Riel */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              fontSize: compact ? '0.84rem' : '0.98rem',
              fontWeight: 'bold',
            }}
          >
            <span className="kh-text">ប្រាក់រៀល (NET PAY RIEL):</span>
            <span style={{ color: '#15803d' }}>{(payroll.netSalaryRiel || 0).toLocaleString()} ៛</span>
          </div>
        </div>
      </div>

      {/* 5. Signatures */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '16px',
          marginTop: compact ? '4px' : '16px',
          textAlign: 'center',
          fontSize: compact ? '0.74rem' : '0.82rem',
        }}
      >
        <div>
          <div
            style={{
              borderTop: '1px dashed #94a3b8',
              width: compact ? '140px' : '180px',
              margin: '0 auto',
              paddingTop: '4px',
              color: '#475569',
            }}
            className="kh-text"
          >
            ហត្ថលេខាអ្នករៀបចំ (Prepared By)
          </div>
        </div>
        <div>
          <div
            style={{
              borderTop: '1px dashed #94a3b8',
              width: compact ? '140px' : '180px',
              margin: '0 auto',
              paddingTop: '4px',
              color: '#475569',
            }}
            className="kh-text"
          >
            ហត្ថលេខាអ្នកទទួល (Received By)
          </div>
        </div>
      </div>
    </div>
  );
}
