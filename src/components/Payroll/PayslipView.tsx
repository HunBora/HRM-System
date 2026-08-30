'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { sendPayslipToTelegram } from '@/app/dashboard/payroll/payslipActions';

export default function PayslipView({ payroll, settings }: { payroll: any, settings: any }) {
  const [sending, setSending] = useState(false);

  const handlePrint = () => {
    window.print();
  };

  const handleTelegram = async () => {
    if (!payroll.employee.telegramChatId) {
      alert('សូមបញ្ជូល Telegram Chat ID នៅក្នុងប្រវត្តិរូបបុគ្គលិកជាមុនសិន! (Please add Chat ID to employee profile)');
      return;
    }
    
    setSending(true);
    const res = await sendPayslipToTelegram(payroll.id);
    setSending(false);
    alert(res.message);
  };

  const m = payroll.month.toString().padStart(2, '0');
  const y = payroll.year;

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
      {/* Action Buttons (Hidden on Print) */}
      <div className="no-print" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
        <Link href="/dashboard/payroll" className="btn-secondary kh-text" style={{ textDecoration: 'none' }}>
          ← ត្រឡប់ក្រោយ (Back)
        </Link>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={handleTelegram} disabled={sending} className="btn-secondary kh-text" style={{ backgroundColor: '#0284c7', color: 'white' }}>
            {sending ? 'កំពុងផ្ញើ...' : 'ផ្ញើទៅ Telegram (Send)'}
          </button>
          <button onClick={handlePrint} className="btn-primary kh-text">
            បោះពុម្ព (Print)
          </button>
        </div>
      </div>

      {/* Payslip Paper */}
      <div className="card payslip-container" style={{ padding: '40px', backgroundColor: '#fff', border: '1px solid #e2e8f0', color: '#0f172a' }}>
        
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '30px', borderBottom: '2px solid #0f172a', paddingBottom: '20px' }}>
          <h1 className="kh-text" style={{ fontSize: '1.8rem', marginBottom: '5px' }}>{settings?.companyName || 'HRM System'}</h1>
          <h2 className="kh-text" style={{ fontSize: '1.4rem', color: '#334155' }}>វិក្កយបត្រប្រាក់បៀវត្សរ៍ (PAYSLIP)</h2>
          <div style={{ fontSize: '1.1rem', marginTop: '10px', fontWeight: 'bold' }}>ខែ (Month): {m} / {y}</div>
        </div>

        {/* Employee Info */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '30px', fontSize: '0.95rem' }}>
          <div>
            <div style={{ marginBottom: '8px' }}><strong>អត្តលេខ (Emp ID):</strong> {payroll.employee.employeeId}</div>
            <div style={{ marginBottom: '8px' }} className="kh-text"><strong>ឈ្មោះ (Name):</strong> {payroll.employee.firstNameKh} {payroll.employee.lastNameKh}</div>
            <div style={{ marginBottom: '8px' }}><strong>តួនាទី (Position):</strong> {payroll.employee.position}</div>
          </div>
          <div>
            <div style={{ marginBottom: '8px' }}><strong>ផ្នែក (Department):</strong> {payroll.employee.department}</div>
            <div style={{ marginBottom: '8px' }}><strong>ថ្ងៃចូលធ្វើការ (Join Date):</strong> {new Date(payroll.employee.hireDate).toLocaleDateString('en-GB')}</div>
            <div style={{ marginBottom: '8px' }}><strong>ថ្ងៃធ្វើការជាក់ស្តែង (Days Worked):</strong> {payroll.workingDays} ថ្ងៃ</div>
          </div>
        </div>

        {/* Earnings & Deductions */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px', marginBottom: '30px' }}>
          
          {/* EARNINGS */}
          <div>
            <h3 className="kh-text" style={{ borderBottom: '1px solid #cbd5e1', paddingBottom: '8px', marginBottom: '15px' }}>ប្រាក់ចំណូល (EARNINGS)</h3>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span>ប្រាក់ខែគោល (Basic Salary)</span>
              <strong>${payroll.basicSalary.toFixed(2)}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span>ប្រាក់ថែមម៉ោង (OT)</span>
              <span>${payroll.otWage.toFixed(2)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span>ប្រាក់រង្វាន់ (Bonus)</span>
              <span>${payroll.attendanceBonus.toFixed(2)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span>អាហារ/ធ្វើដំណើរ (Meal/Transp.)</span>
              <span>${(payroll.lunchAllowance + payroll.transportation).toFixed(2)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span>ប្រាក់អតីតភាពការងារ (Seniority)</span>
              <span>${payroll.seniority.toFixed(2)}</span>
            </div>
          </div>

          {/* DEDUCTIONS */}
          <div>
            <h3 className="kh-text" style={{ borderBottom: '1px solid #cbd5e1', paddingBottom: '8px', marginBottom: '15px' }}>ប្រាក់កាត់កង (DEDUCTIONS)</h3>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span>បេឡាជាតិ (NSSF)</span>
              <strong>${payroll.nssf.toFixed(2)}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span>បុរេប្រទាន (Advance/Loan)</span>
              <span>${payroll.loanPension.toFixed(2)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span>ពន្ធ (Tax)</span>
              <span>${payroll.taxPayment.toFixed(2)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span>កាត់អវត្តមាន (Absent Deduction)</span>
              <span>${((payroll.basicSalary / 26) * payroll.absentDays).toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Totals */}
        <div style={{ borderTop: '2px solid #0f172a', paddingTop: '20px', display: 'flex', justifyContent: 'flex-end' }}>
          <div style={{ width: '350px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', fontSize: '1.2rem', fontWeight: 'bold' }}>
              <span className="kh-text">ប្រាក់ត្រូវបើក (NET PAY USD):</span>
              <span style={{ color: '#15803d' }}>${payroll.netSalaryUsd.toFixed(2)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.1rem', fontWeight: 'bold' }}>
              <span className="kh-text">ប្រាក់រៀល (NET PAY RIEL):</span>
              <span style={{ color: '#15803d' }}>{payroll.netSalaryRiel.toLocaleString()} ៛</span>
            </div>
          </div>
        </div>

        {/* Signatures */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginTop: '60px', textAlign: 'center' }}>
          <div>
            <div style={{ borderTop: '1px dashed #cbd5e1', width: '200px', margin: '0 auto', paddingTop: '10px' }} className="kh-text">
              ហត្ថលេខាអ្នករៀបចំ (Prepared By)
            </div>
          </div>
          <div>
            <div style={{ borderTop: '1px dashed #cbd5e1', width: '200px', margin: '0 auto', paddingTop: '10px' }} className="kh-text">
              ហត្ថលេខាអ្នកទទួល (Received By)
            </div>
          </div>
        </div>

      </div>

      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          body * {
            visibility: hidden;
          }
          .payslip-container, .payslip-container * {
            visibility: visible;
          }
          .payslip-container {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            border: none !important;
            padding: 0 !important;
          }
          .no-print {
            display: none !important;
          }
        }
      `}} />
    </div>
  );
}
