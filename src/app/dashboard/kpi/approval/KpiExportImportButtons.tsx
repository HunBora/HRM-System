'use client';

import { useState } from 'react';
import { importEmployeeKpiExcel } from '../importActions';

export default function KpiExportImportButtons() {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{ message: string, type: 'success' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const handleExport = () => {
    window.location.href = '/api/export/kpi';
  };

  async function handleUpload(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    
    try {
      const res = await importEmployeeKpiExcel(formData);
      setLoading(false);
      if (res.success) {
        showToast(`✅ Import ជោគជ័យ! (Updated: ${res.updated || 0}, Created: ${res.created || 0})`, 'success');
        setIsOpen(false);
      } else {
        showToast(`❌ ${res.error || 'Import បរាជ័យ សូមព្យាយាមម្តងទៀត!'}`, 'error');
      }
    } catch (err: any) {
      setLoading(false);
      showToast('❌ មានបញ្ហាក្នុងការ Import ឯកសារ!', 'error');
    }
  }

  return (
    <>
      {toast && (
        <div style={{
          position: 'fixed', top: '20px', right: '20px', zIndex: 9999,
          padding: '15px 20px', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          backgroundColor: toast.type === 'success' ? '#10b981' : '#ef4444',
          color: 'white', fontWeight: 'bold', fontSize: '0.95rem',
          display: 'flex', alignItems: 'center', gap: '10px',
          animation: 'slideInRight 0.3s ease-out forwards'
        }} className="kh-text">
          {toast.message}
        </div>
      )}

      <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
        <button 
          onClick={handleExport} 
          className="btn kh-text" 
          style={{ background: '#2563eb', color: 'white', padding: '8px 16px', borderRadius: '6px', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '6px', border: 'none', cursor: 'pointer' }}
        >
          📊 Export Excel
        </button>

        <button 
          onClick={() => setIsOpen(true)} 
          className="btn kh-text" 
          style={{ background: '#10b981', color: 'white', padding: '8px 16px', borderRadius: '6px', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '6px', border: 'none', cursor: 'pointer' }}
        >
          📥 Import Excel (Original Format)
        </button>
      </div>

      {isOpen && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, 
          backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', 
          justifyContent: 'center', alignItems: 'center', zIndex: 1000
        }}>
          <div className="card" style={{ width: '450px', backgroundColor: 'var(--bg-color)', padding: '25px', borderRadius: '12px', boxShadow: '0 10px 25px rgba(0,0,0,0.2)' }}>
            <h3 className="kh-text" style={{ marginBottom: '12px', color: 'var(--primary-color)', fontSize: '1.2rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '10px' }}>
              📥 Import ស្ថិតិ KPI បុគ្គលិក (Excel/CSV)
            </h3>
            
            <div style={{ padding: '12px', backgroundColor: 'rgba(59, 130, 246, 0.08)', borderRadius: '8px', marginBottom: '20px', borderLeft: '4px solid #3b82f6' }}>
              <p className="kh-text" style={{ fontSize: '0.85rem', color: 'var(--text-main)', lineHeight: 1.6, margin: 0 }}>
                💡 <strong>គន្លឹះ៖</strong> អ្នកអាចចុច <strong>Export Excel</strong> ទាញយកហ្វាលដើម រួចកែសម្រួលពិន្ទុ <strong>Actual</strong> ឬ <strong>Status</strong> នៅក្នុង Excel ហើយ Import ហ្វាលដដែលនោះចូលវិញ ប្រព័ន្ធនឹងធ្វើការអាប់ដេតស្វ័យប្រវត្តិ (Keep as original format same export file)។
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
              
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', borderTop: '1px solid var(--border-color)', paddingTop: '15px' }}>
                <button type="button" onClick={() => setIsOpen(false)} className="btn-secondary kh-text" style={{ padding: '8px 18px' }}>
                  បោះបង់ (Cancel)
                </button>
                <button type="submit" disabled={loading} className="btn-primary kh-text" style={{ padding: '8px 20px', background: loading ? '#94a3b8' : '#10b981', border: 'none' }}>
                  {loading ? '⏳ កំពុង Import...' : '📥 យល់ព្រម Import'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
