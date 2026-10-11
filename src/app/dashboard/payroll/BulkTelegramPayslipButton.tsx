'use client';

import React, { useState } from 'react';
import Swal from 'sweetalert2';
import { sendBulkPayslipsToTelegram } from './payslipActions';

export default function BulkTelegramPayslipButton({
  month,
  year,
  eligibleCount,
}: {
  month: number;
  year: number;
  eligibleCount?: number;
}) {
  const [loading, setLoading] = useState(false);

  const handleSendBulk = async () => {
    const confirm = await Swal.fire({
      title: 'បញ្ជាក់ការផ្ញើវិក្កយបត្រ (Confirm Bulk Dispatch)?',
      html: `
        <div style="text-align: left; font-size: 0.95rem; line-height: 1.6; color: #334155;">
          <p>ប្រព័ន្ធនឹងធ្វើការបញ្ជូនវិក្កយបត្រប្រាក់ខែ <b>ខែ ${month}/${year}</b> ទៅកាន់គណនី Telegram របស់បុគ្គលិកទាំងអស់ដែលមាន Telegram Chat ID ដោយស្វ័យប្រវត្តិ។</p>
          <div style="background: #f1f5f9; padding: 10px 14px; border-radius: 6px; border-left: 4px solid #0284c7; margin-top: 10px;">
            <span>ℹ️ បុគ្គលិកដែលមាន Telegram ID ក្នុងខែនេះ: <b>${eligibleCount !== undefined ? eligibleCount : 'ទាំងអស់'}</b> នាក់</span>
          </div>
        </div>
      `,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#0284c7',
      cancelButtonColor: '#64748b',
      confirmButtonText: '🚀 បាទ/ចាស, ផ្ញើចេញឥឡូវនេះ (Send Now)',
      cancelButtonText: 'បោះបង់ (Cancel)',
    });

    if (!confirm.isConfirmed) return;

    setLoading(true);
    try {
      Swal.fire({
        title: 'កំពុងផ្ញើវិក្កយបត្រតាម Telegram...',
        text: 'សូមរង់ចាំមួយភ្លែត ប្រព័ន្ធកំពុងដំណើរការបញ្ជូនទិន្នន័យ (Sending payslips)...',
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading();
        },
      });

      const res = await sendBulkPayslipsToTelegram(month, year);

      if (res.success) {
        Swal.fire({
          icon: 'success',
          title: 'ជោគជ័យ! (Dispatch Completed)',
          text: res.message,
          confirmButtonColor: '#10b981',
        });
      } else {
        Swal.fire({
          icon: 'warning',
          title: 'មិនអាចផ្ញើបាន (Failed)',
          text: res.message,
          confirmButtonColor: '#f59e0b',
        });
      }
    } catch (err: any) {
      Swal.fire({
        icon: 'error',
        title: 'កំហុសបច្ចេកទេស (Error)',
        text: err?.message || 'Something went wrong while dispatching telegram messages',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleSendBulk}
      disabled={loading}
      className="btn-secondary flex items-center justify-center kh-text"
      title="ផ្ញើវិក្កយបត្រទាំងអស់ទៅកាន់ Telegram របស់បុគ្គលិក"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        padding: '8px 14px',
        borderRadius: '6px',
        fontSize: '0.85rem',
        fontWeight: 'bold',
        backgroundColor: '#0284c7',
        color: '#ffffff',
        border: 'none',
        cursor: loading ? 'not-allowed' : 'pointer',
        boxShadow: '0 2px 4px rgba(2, 132, 199, 0.25)',
        transition: 'all 0.2s ease',
        opacity: loading ? 0.7 : 1,
      }}
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.74-.55 2.92-1.27 4.86-2.11 5.83-2.52 2.77-1.16 3.35-1.36 3.73-1.37.08 0 .27.02.39.12.1.08.13.2.14.28-.01.06-.01.19-.03.27z" />
      </svg>
      <span>{loading ? 'កំពុងផ្ញើ...' : 'ផ្ញើ Telegram សរុប (Bulk Payslips)'}</span>
    </button>
  );
}
