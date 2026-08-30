'use client';

import React, { useState } from 'react';
import { updatePayrollDates } from '@/app/dashboard/payrollSettingsActions';

export default function PayrollSettingsManager({ initialSettings }: { initialSettings: any }) {
  const [formData, setFormData] = useState({
    payment1StartDate: initialSettings?.payment1StartDate || 1,
    payment1EndDate: initialSettings?.payment1EndDate || 15,
    payment2StartDate: initialSettings?.payment2StartDate || 16,
    payment2EndDate: initialSettings?.payment2EndDate || 31
  });
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: parseInt(value) || 1 }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setMessage('');
    try {
      await updatePayrollDates(formData);
      setMessage('ការកំណត់ត្រូវបានរក្សាទុកដោយជោគជ័យ! (Saved Successfully)');
    } catch (error) {
      console.error(error);
      setMessage('មានបញ្ហាក្នុងការរក្សាទុក។ (Error Saving)');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div>
      <h2 style={{ fontSize: '1.429em', color: '#1976d2', marginBottom: '10px' }}>ការកំណត់កាលបរិច្ឆេទបើកប្រាក់ខែ (Payroll Dates)</h2>
      <p style={{ color: '#666', marginBottom: '25px' }}>កំណត់ថ្ងៃចាប់ផ្តើម និងថ្ងៃបញ្ចប់សម្រាប់ការបើកប្រាក់ខែលើកទី១ និងលើកទី២។</p>

      {message && (
        <div style={{ padding: '10px 15px', backgroundColor: message.includes('ជោគជ័យ') ? '#e8f5e9' : '#fee2e2', color: message.includes('ជោគជ័យ') ? '#2e7d32' : '#b91c1c', borderRadius: '6px', marginBottom: '20px', fontWeight: 'bold' }}>
          {message}
        </div>
      )}

      <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '500px' }}>
        <div style={{ backgroundColor: '#f8f9fa', padding: '20px', borderRadius: '12px', border: '1px solid #e0e0e0' }}>
          <h3 style={{ marginBottom: '15px', color: '#333' }}>លើកទី១ (Payment 1)</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', fontSize: '1.0em' }}>ថ្ងៃចាប់ផ្តើម (Start Date)</label>
              <input type="number" name="payment1StartDate" value={formData.payment1StartDate} onChange={handleChange} min={1} max={31} required style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ccc' }} />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', fontSize: '1.0em' }}>ថ្ងៃបញ្ចប់ (End Date)</label>
              <input type="number" name="payment1EndDate" value={formData.payment1EndDate} onChange={handleChange} min={1} max={31} required style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ccc' }} />
            </div>
          </div>
        </div>

        <div style={{ backgroundColor: '#f8f9fa', padding: '20px', borderRadius: '12px', border: '1px solid #e0e0e0' }}>
          <h3 style={{ marginBottom: '15px', color: '#333' }}>លើកទី២ (Payment 2)</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', fontSize: '1.0em' }}>ថ្ងៃចាប់ផ្តើម (Start Date)</label>
              <input type="number" name="payment2StartDate" value={formData.payment2StartDate} onChange={handleChange} min={1} max={31} required style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ccc' }} />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', fontSize: '1.0em' }}>ថ្ងៃបញ្ចប់ (End Date)</label>
              <input type="number" name="payment2EndDate" value={formData.payment2EndDate} onChange={handleChange} min={1} max={31} required style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ccc' }} />
            </div>
          </div>
        </div>

        <button type="submit" disabled={isSaving} style={{ padding: '12px 24px', backgroundColor: '#1976d2', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '1.071em', opacity: isSaving ? 0.7 : 1 }}>
          {isSaving ? 'កំពុងរក្សាទុក...' : 'រក្សាទុកការកំណត់'}
        </button>
      </form>
    </div>
  );
}
