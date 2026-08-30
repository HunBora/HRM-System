'use client'
import { useState } from 'react';
import { processFingerprintData } from './actions';

export default function ImportFingerprintModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{ message: string, type: 'success' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  async function handleUpload(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    try {
      const res = await processFingerprintData(formData);
      setLoading(false);
      if (res.success) {
        showToast('Fingerprint data imported successfully!', 'success');
        setIsOpen(false);
      } else {
        showToast('Fingerprint data imported Error Please Retry!!', 'error');
      }
    } catch (err) {
      setLoading(false);
      showToast('Fingerprint data imported Error Please Retry!!', 'error');
    }
  }

  return (
    <>
      {toast && (
        <div style={{
          position: 'fixed', top: '20px', right: '20px', zIndex: 9999,
          padding: '15px 20px', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          backgroundColor: toast.type === 'success' ? '#10b981' : '#ef4444',
          color: 'white', fontWeight: 'bold', fontSize: '1rem',
          display: 'flex', alignItems: 'center', gap: '10px',
          animation: 'slideInRight 0.3s ease-out forwards'
        }}>
          {toast.type === 'success' ? '✅' : '❌'} {toast.message}
        </div>
      )}
      <button onClick={() => setIsOpen(true)} className="btn-primary kh-text">
        + Import Fingerprint CSV/Excel
      </button>

      {isOpen && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, 
          backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', 
          justifyContent: 'center', alignItems: 'center', zIndex: 1000
        }}>
          <div className="card" style={{ width: '400px', backgroundColor: 'var(--bg-color)' }}>
            <h3 className="kh-text" style={{ marginBottom: '15px' }}>បញ្ចូលទិន្នន័យពីម៉ាស៊ីនស្កេន</h3>
            <p className="kh-text" style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '20px' }}>
              សូមជ្រើសរើសឯកសារ Excel ឬ CSV ដែលទាញចេញពីម៉ាស៊ីន Finger Print។
            </p>
            
            <form onSubmit={handleUpload}>
              <input 
                type="file" 
                name="file" 
                accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel" 
                required
                style={{ display: 'block', marginBottom: '20px', width: '100%' }}
              />
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <button type="button" onClick={() => setIsOpen(false)} className="btn-secondary kh-text">
                  បោះបង់ (Cancel)
                </button>
                <button type="submit" disabled={loading} className="btn-primary kh-text">
                  {loading ? 'កំពុងបញ្ចូល...' : 'បញ្ចូល (Upload)'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
