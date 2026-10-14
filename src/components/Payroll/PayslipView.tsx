'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import PayslipCard from './PayslipCard';
import { sendPayslipToTelegram } from '@/app/dashboard/payroll/payslipActions';

export default function PayslipView({ payroll, settings }: { payroll: any; settings: any }) {
  const [sending, setSending] = useState(false);
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('portrait');
  const [copies, setCopies] = useState<1 | 2>(2); // 2 = Duplicate with cut line

  const handlePrint = () => {
    window.print();
  };

  const handleTelegram = async () => {
    if (!payroll.employee?.telegramChatId) {
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
    <div style={{ maxWidth: orientation === 'landscape' ? '1100px' : '820px', margin: '0 auto' }}>
      {/* Dynamic Print CSS */}
      <style dangerouslySetInnerHTML={{ __html: `
        @page {
          size: ${orientation === 'landscape' ? 'landscape' : 'portrait'};
          margin: 6mm 8mm;
        }

        @media print {
          .no-print,
          aside,
          nav,
          header,
          .navbar,
          .sidebar,
          .print-hidden {
            display: none !important;
          }

          body {
            background: #ffffff !important;
            margin: 0 !important;
            padding: 0 !important;
            color: #0f172a !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }

          .payslip-print-sheet {
            width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            min-height: ${orientation === 'landscape' ? '195mm' : '280mm'} !important;
            display: flex !important;
            flex-direction: ${orientation === 'landscape' && copies === 2 ? 'row' : 'column'} !important;
            justify-content: space-between !important;
            box-sizing: border-box !important;
          }

          .payslip-card {
            border: 1px solid #94a3b8 !important;
            box-shadow: none !important;
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }

          .cut-line-h {
            border-top: 1.5px dashed #64748b !important;
            color: #64748b !important;
            margin: 6px 0 !important;
            padding-top: 2px !important;
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
          }

          .cut-line-v {
            border-left: 1.5px dashed #64748b !important;
            color: #64748b !important;
            margin: 0 6px !important;
            display: flex !important;
            flex-direction: column !important;
            align-items: center !important;
            justify-content: center !important;
          }
        }
      `}} />

      {/* Control Bar (Hidden on Print) */}
      <div
        className="no-print"
        style={{
          backgroundColor: '#0f172a',
          color: '#ffffff',
          borderRadius: '12px',
          padding: '16px 20px',
          marginBottom: '24px',
          boxShadow: '0 4px 15px rgba(0, 0, 0, 0.25)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Link
              href={`/dashboard/payroll?month=${payroll.month}&year=${payroll.year}`}
              style={{
                textDecoration: 'none',
                color: '#94a3b8',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '0.9rem',
                fontWeight: 600,
                padding: '6px 12px',
                borderRadius: '6px',
                backgroundColor: 'rgba(255, 255, 255, 0.08)',
              }}
              className="kh-text"
            >
              ← ត្រឡប់ក្រោយ (Back)
            </Link>
            <Link
              href={`/dashboard/payroll/batch-payslips?month=${payroll.month}&year=${payroll.year}`}
              style={{
                textDecoration: 'none',
                color: '#38bdf8',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '0.9rem',
                fontWeight: 600,
                padding: '6px 12px',
                borderRadius: '6px',
                backgroundColor: 'rgba(56, 189, 248, 0.15)',
                border: '1px solid rgba(56, 189, 248, 0.3)',
              }}
              className="kh-text"
            >
              🖨️ បោះពុម្ពទាំងអស់ (Batch All)
            </Link>
          </div>

          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <button
              onClick={handleTelegram}
              disabled={sending}
              style={{
                backgroundColor: '#0284c7',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                padding: '8px 16px',
                cursor: 'pointer',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
              className="kh-text"
            >
              ✈️ {sending ? 'កំពុងផ្ញើ...' : 'ផ្ញើទៅ Telegram'}
            </button>
            <button
              onClick={handlePrint}
              style={{
                backgroundColor: '#10b981',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                padding: '8px 20px',
                cursor: 'pointer',
                fontWeight: 700,
                fontSize: '0.95rem',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: '0 2px 8px rgba(16, 185, 129, 0.4)',
              }}
              className="kh-text"
            >
              🖨️ បោះពុម្ព (Print)
            </button>
          </div>
        </div>

        {/* Layout & Orientation Toggles */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', borderTop: '1px solid rgba(255, 255, 255, 0.12)', paddingTop: '12px' }}>
          {/* Orientation */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '0.85rem', color: '#94a3b8' }} className="kh-text">ទិសដៅក្រដាស:</span>
            <div style={{ display: 'inline-flex', backgroundColor: 'rgba(255, 255, 255, 0.08)', borderRadius: '6px', padding: '2px' }}>
              <button
                type="button"
                onClick={() => setOrientation('portrait')}
                style={{
                  border: 'none',
                  background: orientation === 'portrait' ? '#3b82f6' : 'transparent',
                  color: orientation === 'portrait' ? '#ffffff' : '#94a3b8',
                  padding: '5px 12px',
                  borderRadius: '4px',
                  fontSize: '0.82rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
                className="kh-text"
              >
                📄 បញ្ឈរ (Portrait)
              </button>
              <button
                type="button"
                onClick={() => setOrientation('landscape')}
                style={{
                  border: 'none',
                  background: orientation === 'landscape' ? '#3b82f6' : 'transparent',
                  color: orientation === 'landscape' ? '#ffffff' : '#94a3b8',
                  padding: '5px 12px',
                  borderRadius: '4px',
                  fontSize: '0.82rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
                className="kh-text"
              >
                📑 ផ្ដេក (Landscape)
              </button>
            </div>
          </div>

          {/* Copies Per Sheet */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '0.85rem', color: '#94a3b8' }} className="kh-text">ប្លង់កាត់:</span>
            <div style={{ display: 'inline-flex', backgroundColor: 'rgba(255, 255, 255, 0.08)', borderRadius: '6px', padding: '2px' }}>
              <button
                type="button"
                onClick={() => setCopies(2)}
                style={{
                  border: 'none',
                  background: copies === 2 ? '#3b82f6' : 'transparent',
                  color: copies === 2 ? '#ffffff' : '#94a3b8',
                  padding: '5px 12px',
                  borderRadius: '4px',
                  fontSize: '0.82rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
                className="kh-text"
              >
                ✂️ ២ ច្បាប់កាត់ជាពីរ (Save Paper)
              </button>
              <button
                type="button"
                onClick={() => setCopies(1)}
                style={{
                  border: 'none',
                  background: copies === 1 ? '#3b82f6' : 'transparent',
                  color: copies === 1 ? '#ffffff' : '#94a3b8',
                  padding: '5px 12px',
                  borderRadius: '4px',
                  fontSize: '0.82rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
                className="kh-text"
              >
                📄 ១ ច្បាប់ពេញទំព័រ
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Payslip Paper Sheet */}
      <div
        className="payslip-print-sheet"
        style={{
          backgroundColor: '#ffffff',
          borderRadius: '10px',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
          padding: copies === 2 ? (orientation === 'landscape' ? '12px' : '16px 20px') : '28px 32px',
          display: 'flex',
          flexDirection: orientation === 'landscape' && copies === 2 ? 'row' : 'column',
          justifyContent: 'space-between',
          gap: copies === 2 ? '14px' : '0',
          position: 'relative',
        }}
      >
        {copies === 1 ? (
          <PayslipCard
            payroll={payroll}
            settings={settings}
            compact={false}
            orientation={orientation}
          />
        ) : (
          <>
            {/* Slip 1: Employee Copy */}
            <div style={{ flex: '1 1 0', display: 'flex' }}>
              <PayslipCard
                payroll={payroll}
                settings={settings}
                copyLabel="ច្បាប់បុគ្គលិក (Employee Copy)"
                compact={true}
                orientation={orientation}
              />
            </div>

            {/* Cut Line */}
            {orientation === 'landscape' ? (
              <div
                className="cut-line-v"
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '0 4px',
                  color: '#94a3b8',
                  fontSize: '0.72rem',
                  userSelect: 'none',
                  borderLeft: '1.5px dashed #cbd5e1',
                  margin: '0 4px',
                }}
              >
                <span style={{ fontSize: '1rem', marginBottom: '8px' }}>✂️</span>
                <span style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)', letterSpacing: '4px' }} className="kh-text">
                  កាត់ត្រង់នេះ (Cut Here)
                </span>
                <span style={{ fontSize: '1rem', marginTop: '8px' }}>✂️</span>
              </div>
            ) : (
              <div
                className="cut-line-h"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '12px',
                  padding: '4px 0',
                  color: '#94a3b8',
                  fontSize: '0.72rem',
                  userSelect: 'none',
                  borderTop: '1.5px dashed #cbd5e1',
                  margin: '4px 0',
                }}
              >
                <span>✂️</span>
                <span className="kh-text" style={{ letterSpacing: '2px' }}>
                  - - - - - កាត់ត្រង់នេះ (Cut Here) - - - - -
                </span>
                <span>✂️</span>
              </div>
            )}

            {/* Slip 2: Company Copy */}
            <div style={{ flex: '1 1 0', display: 'flex' }}>
              <PayslipCard
                payroll={payroll}
                settings={settings}
                copyLabel="ច្បាប់ក្រុមហ៊ុន (Company Copy)"
                compact={true}
                orientation={orientation}
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
