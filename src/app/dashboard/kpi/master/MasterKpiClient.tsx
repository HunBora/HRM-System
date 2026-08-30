'use client';
import { useState } from 'react';
import styles from '../kpi.module.css';
import { createMasterKpi, deleteMasterKpi } from './actions';
import { importMasterKpiExcel } from '../importActions';

type MasterKpi = {
  id: string;
  department: string;
  kpiType: string;
  description: string | null;
};

export default function MasterKpiClient({ 
  initialKpis, 
  departments 
}: { 
  initialKpis: MasterKpi[], 
  departments: string[] 
}) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [filterDept, setFilterDept] = useState('');
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [importLoading, setImportLoading] = useState(false);
  const [toast, setToast] = useState<{ message: string, type: 'success' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  // Group KPIs by department
  const groupedKpis = initialKpis.reduce((acc, kpi) => {
    if (!acc[kpi.department]) acc[kpi.department] = [];
    acc[kpi.department].push(kpi);
    return acc;
  }, {} as Record<string, MasterKpi[]>);

  const displayDepartments = filterDept ? [filterDept] : Object.keys(groupedKpis).sort();

  async function handleCreate(formData: FormData) {
    setIsSubmitting(true);
    const result = await createMasterKpi(formData);
    setIsSubmitting(false);
    if (result.error) {
      alert(result.error);
    } else {
      const form = document.getElementById('createKpiForm') as HTMLFormElement;
      form.reset();
    }
  }

  async function handleDelete(id: string) {
    if (confirm('តើអ្នកពិតជាចង់លុប KPI នេះមែនទេ? (Are you sure?)')) {
      const result = await deleteMasterKpi(id);
      if (result.error) alert(result.error);
    }
  }

  function handleExport() {
    window.location.href = '/api/export/master-kpi';
  }

  async function handleUpload(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setImportLoading(true);
    const formData = new FormData(e.currentTarget);
    try {
      const res = await importMasterKpiExcel(formData);
      setImportLoading(false);
      if (res.success) {
        showToast(`✅ Import ជោគជ័យ! (ចំនួន: ${res.count || 0})`, 'success');
        setIsImportOpen(false);
      } else {
        showToast(`❌ ${res.error || 'Import បរាជ័យ សូមព្យាយាមម្តងទៀត!'}`, 'error');
      }
    } catch (err: any) {
      setImportLoading(false);
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

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '20px', marginTop: '20px', alignItems: 'start' }}>
        
        {/* Left: List of KPIs */}
        <div className="card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', marginBottom: '20px' }}>
            <h2 className="kh-text" style={{ fontSize: '1.2rem', fontWeight: 600, margin: 0 }}>បញ្ជី Master KPI</h2>
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              <select 
                className="input-field kh-text" 
                style={{ width: '180px' }}
                value={filterDept}
                onChange={(e) => setFilterDept(e.target.value)}
              >
                <option value="">-- គ្រប់ផ្នែកទាំងអស់ --</option>
                {departments.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
              <button className="btn kh-text" onClick={handleExport} style={{ background: '#2563eb', color: 'white', padding: '8px 14px', borderRadius: '6px', border: 'none', cursor: 'pointer', fontWeight: 500 }}>
                📊 Export Excel
              </button>
              <button className="btn kh-text" onClick={() => setIsImportOpen(true)} style={{ background: '#10b981', color: 'white', padding: '8px 14px', borderRadius: '6px', border: 'none', cursor: 'pointer', fontWeight: 500 }}>
                📥 Import Excel
              </button>
            </div>
          </div>

        {displayDepartments.length === 0 && (
          <p className="kh-text" style={{ color: '#64748b', textAlign: 'center', padding: '20px' }}>មិនទាន់មានទិន្នន័យនៅឡើយទេ</p>
        )}

        {displayDepartments.map(dept => (
          <div key={dept} style={{ marginBottom: '30px' }}>
            <h3 className="kh-text" style={{ fontSize: '1.1rem', color: '#3b82f6', borderBottom: '2px solid #e2e8f0', paddingBottom: '8px', marginBottom: '15px' }}>
              ផ្នែក: {dept}
            </h3>
            <div style={{ display: 'grid', gap: '10px' }}>
              {(groupedKpis[dept] || []).map(kpi => (
                <div key={kpi.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                  <div>
                    <div className="kh-text" style={{ fontWeight: 600, fontSize: '1.1rem' }}>{kpi.kpiType}</div>
                    {kpi.description && <div className="kh-text" style={{ color: '#64748b', fontSize: '0.9rem', marginTop: '4px' }}>{kpi.description}</div>}
                  </div>
                  <button 
                    onClick={() => handleDelete(kpi.id)}
                    className="btn kh-text" 
                    style={{ background: '#ef4444', color: 'white', padding: '6px 12px', fontSize: '0.9rem' }}
                  >
                    លុប (Delete)
                  </button>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Right: Create Form */}
      <div className="card" style={{ padding: '20px', position: 'sticky', top: '20px' }}>
        <h2 className="kh-text" style={{ fontSize: '1.2rem', fontWeight: 600, marginBottom: '20px' }}>បង្កើត KPI ថ្មី</h2>
        <form id="createKpiForm" action={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <div>
            <label className="kh-text" style={{ display: 'block', marginBottom: '8px' }}>ជ្រើសរើសផ្នែក (Department)</label>
            <select name="department" className="input-field kh-text" required>
              <option value="">-- ជ្រើសរើស --</option>
              {departments.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
          <div>
            <label className="kh-text" style={{ display: 'block', marginBottom: '8px' }}>ឈ្មោះ KPI (KPI Type)</label>
            <input type="text" name="kpiType" className="input-field kh-text" required placeholder="ឧទាហរណ៍: ការលក់ (Sales)" />
          </div>
          <div>
            <label className="kh-text" style={{ display: 'block', marginBottom: '8px' }}>ការពិពណ៌នា (Description) - មិនចាំបាច់ក៏បាន</label>
            <textarea name="description" className="input-field kh-text" rows={3} placeholder="ពណ៌នាអំពី KPI..."></textarea>
          </div>
          <button type="submit" className="btn kh-text" disabled={isSubmitting} style={{ background: '#3b82f6', color: 'white', width: '100%', marginTop: '10px' }}>
            {isSubmitting ? 'កំពុងរក្សាទុក...' : 'រក្សាទុក (Save KPI)'}
          </button>
        </form>
      </div>

    </div>

      {isImportOpen && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, 
          backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', 
          justifyContent: 'center', alignItems: 'center', zIndex: 1000
        }}>
          <div className="card" style={{ width: '450px', backgroundColor: 'var(--bg-color)', padding: '25px', borderRadius: '12px', boxShadow: '0 10px 25px rgba(0,0,0,0.2)' }}>
            <h3 className="kh-text" style={{ marginBottom: '12px', color: 'var(--primary-color)', fontSize: '1.2rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '10px' }}>
              📥 Import Master KPI (Excel/CSV)
            </h3>
            
            <div style={{ padding: '12px', backgroundColor: 'rgba(16, 185, 129, 0.08)', borderRadius: '8px', marginBottom: '20px', borderLeft: '4px solid #10b981' }}>
              <p className="kh-text" style={{ fontSize: '0.85rem', color: 'var(--text-main)', lineHeight: 1.6, margin: 0 }}>
                💡 <strong>គន្លឹះ៖</strong> អ្នកអាចចុច <strong>Export Excel</strong> ទាញយកបញ្ជី Master KPI ដើម រួចបន្ថែមឬកែសម្រួល Description ក្នុង Excel ហើយ Import ហ្វាលដដែលនោះចូលវិញ ប្រព័ន្ធនឹងធ្វើការអាប់ដេតស្វ័យប្រវត្តិ (Keep as original format same export file)។
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
                <button type="button" onClick={() => setIsImportOpen(false)} className="btn-secondary kh-text" style={{ padding: '8px 18px' }}>
                  បោះបង់ (Cancel)
                </button>
                <button type="submit" disabled={importLoading} className="btn-primary kh-text" style={{ padding: '8px 20px', background: importLoading ? '#94a3b8' : '#10b981', border: 'none' }}>
                  {importLoading ? '⏳ កំពុង Import...' : '📥 យល់ព្រម Import'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
