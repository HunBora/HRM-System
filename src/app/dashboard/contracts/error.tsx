'use client';

import React, { useEffect } from 'react';

export default function ContractsError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Contracts error boundary caught error:', error);
  }, [error]);

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '60vh',
        padding: '24px',
        textAlign: 'center',
        fontFamily: "'Khmer OS Battambang', 'Segoe UI', sans-serif",
      }}
    >
      <div
        style={{
          background: '#ffffff',
          borderRadius: '16px',
          padding: '36px',
          maxWidth: '520px',
          boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)',
          border: '1px solid #e2e8f0',
        }}
      >
        <span style={{ fontSize: '3rem', marginBottom: '16px', display: 'inline-block' }}>📄⚠️</span>
        <h2 style={{ fontSize: '1.25rem', color: '#0f172a', fontWeight: 800, margin: '0 0 8px 0' }}>
          មានបញ្ហាក្នុងការផ្ទុកទំព័រកិច្ចសន្យា
        </h2>
        <p style={{ fontSize: '0.88rem', color: '#64748b', margin: '0 0 20px 0', lineHeight: 1.5 }}>
          ប្រព័ន្ធមិនអាចទាញយកទិន្នន័យបាននៅពេលនេះ។ សូមចុចប៊ូតុងខាងក្រោមដើម្បីព្យាយាមផ្ទុកទំព័រឡើងវិញ។
        </p>
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
          <button
            onClick={() => reset()}
            style={{
              background: '#0284c7',
              color: '#ffffff',
              border: 'none',
              padding: '10px 20px',
              borderRadius: '8px',
              fontWeight: 700,
              fontSize: '0.88rem',
              cursor: 'pointer',
            }}
          >
            🔄 ព្យាយាមម្តងទៀត (Reload Page)
          </button>
          <button
            onClick={() => window.location.href = '/dashboard'}
            style={{
              background: '#f1f5f9',
              color: '#334155',
              border: '1px solid #cbd5e1',
              padding: '10px 18px',
              borderRadius: '8px',
              fontWeight: 700,
              fontSize: '0.88rem',
              cursor: 'pointer',
            }}
          >
            🏠 ត្រឡប់ទៅ Dashboard
          </button>
        </div>
      </div>
    </div>
  );
}
