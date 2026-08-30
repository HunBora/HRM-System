'use client';

import { useState } from 'react';
import { importEmployeeExcel } from './importActions';

export default function EmployeeExportImportButtons() {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4500);
  };

  const handleExportMaster = () => {
    window.location.href = `/api/export/master-employee?t=${Date.now()}`;
  };

  async function handleUpload(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);

    try {
      const res = await importEmployeeExcel(formData);
      setLoading(false);
      if (res.success) {
        showToast(`✅ នាំចូលជោគជ័យ! (បង្កើតថ្មី: ${res.created || 0} នាក់, កែសម្រួល: ${res.updated || 0} នាក់)`, 'success');
        setIsOpen(false);
      } else {
        showToast(`❌ ${res.error || 'ការនាំចូលបរាជ័យ សូមពិនិត្យឯកសារម្តងទៀត!'}`, 'error');
      }
    } catch (err: any) {
      setLoading(false);
      showToast('❌ មានបញ្ហាក្នុងការនាំចូលឯកសារ (System Error)!', 'error');
    }
  }

  return (
    <>
      {toast && (
        <div
          style={{
            position: 'fixed',
            top: '20px',
            right: '20px',
            zIndex: 9999,
            padding: '15px 22px',
            borderRadius: '8px',
            boxShadow: '0 4px 15px rgba(0,0,0,0.2)',
            backgroundColor: toast.type === 'success' ? '#10b981' : '#ef4444',
            color: 'white',
            fontWeight: 'bold',
            fontSize: '0.95rem',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            animation: 'slideInRight 0.3s ease-out forwards',
          }}
          className="kh-text"
        >
          {toast.message}
        </div>
      )}

      <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
        <button
          onClick={handleExportMaster}
          className="btn-secondary kh-text"
          style={{
            background: '#2563eb',
            color: 'white',
            padding: '8px 16px',
            borderRadius: '6px',
            fontWeight: 500,
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            border: 'none',
            cursor: 'pointer',
            textDecoration: 'none',
          }}
          title="Export Original Master Employee Excel"
        >
          📊 ទាញយក Excel ដើម (Export Master)
        </button>

        <button
          onClick={() => setIsOpen(true)}
          className="btn-secondary kh-text"
          style={{
            background: '#10b981',
            color: 'white',
            padding: '8px 16px',
            borderRadius: '6px',
            fontWeight: 500,
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            border: 'none',
            cursor: 'pointer',
          }}
        >
          📥 នាំចូល Excel (Import Original Format)
        </button>
      </div>

      {isOpen && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 1000,
          }}
        >
          <div
            className="card"
            style={{
              width: '500px',
              maxWidth: '90vw',
              backgroundColor: 'var(--bg-color)',
              padding: '25px',
              borderRadius: '12px',
              boxShadow: '0 10px 25px rgba(0,0,0,0.25)',
            }}
          >
            <h3
              className="kh-text"
              style={{
                marginBottom: '12px',
                color: 'var(--primary-color)',
                fontSize: '1.2rem',
                borderBottom: '1px solid var(--border-color)',
                paddingBottom: '10px',
              }}
            >
              📥 នាំចូលទិន្នន័យបុគ្គលិក (Import Employees)
            </h3>

            <div
              style={{
                padding: '14px',
                backgroundColor: 'rgba(16, 185, 129, 0.08)',
                borderRadius: '8px',
                marginBottom: '20px',
                borderLeft: '4px solid #10b981',
              }}
            >
              <p className="kh-text" style={{ fontSize: '0.85rem', color: 'var(--text-main)', lineHeight: 1.6, margin: 0 }}>
                💡 <strong>គន្លឹះ៖</strong> អ្នកអាចទាញយក <strong>Export Master Excel (ហ្វាលដើម)</strong> រួចកែសម្រួល ឬបន្ថែមទិន្នន័យបុគ្គលិក ហើយ <strong>Import ហ្វាលដដែលនោះចូលវិញ (Original Format)</strong>។ ប្រព័ន្ធនឹងរក្សាទុកអក្សរខ្មែរ (UTF-8) និងអាប់ដេតទិន្នន័យស្វ័យប្រវត្តិ។
              </p>
            </div>

            <form onSubmit={handleUpload}>
              <label className="kh-text" style={{ display: 'block', marginBottom: '8px', fontWeight: 500, fontSize: '0.9rem' }}>
                ជ្រើសរើសឯកសារ Excel (.xlsx, .xls) ឬ CSV៖
              </label>
              <input
                type="file"
                name="file"
                accept=".csv, .xlsx, .xls, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
                required
                className="input-field kh-text"
                style={{ display: 'block', marginBottom: '25px', width: '100%', padding: '10px' }}
              />

              <div
                style={{
                  display: 'flex',
                  gap: '10px',
                  justifyContent: 'flex-end',
                  borderTop: '1px solid var(--border-color)',
                  paddingTop: '15px',
                }}
              >
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="btn-secondary kh-text"
                  style={{ padding: '8px 18px' }}
                >
                  បោះបង់ (Cancel)
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="btn-primary kh-text"
                  style={{
                    padding: '8px 20px',
                    background: loading ? '#94a3b8' : '#10b981',
                    border: 'none',
                    fontWeight: 'bold',
                  }}
                >
                  {loading ? '⏳ កំពុងនាំចូល...' : '📥 យល់ព្រមនាំចូល (Import Now)'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
