'use client';

import React, { useState } from 'react';
import { updatePayrollDates } from '@/app/dashboard/payrollSettingsActions';
import { updateExchangeRateAndRecalculate } from '@/app/dashboard/payroll/actions';
import { notify } from '@/lib/notify';

export default function PayrollSettingsManager({ initialSettings }: { initialSettings: any }) {
  const [formData, setFormData] = useState({
    payment1StartDate: initialSettings?.payment1StartDate || 1,
    payment1EndDate: initialSettings?.payment1EndDate || 15,
    payment2StartDate: initialSettings?.payment2StartDate || 16,
    payment2EndDate: initialSettings?.payment2EndDate || 31,
    exchangeRate: initialSettings?.exchangeRate || 4000,
  });
  const [isSaving, setIsSaving] = useState(false);
  const [isRecalculating, setIsRecalculating] = useState(false);
  const [message, setMessage] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: parseFloat(value) || 0 }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setMessage('');
    try {
      await updatePayrollDates(formData);
      setMessage('ការកំណត់ត្រូវបានរក្សាទុកដោយជោគជ័យ! (Saved Successfully)');
      notify.toast('ការកំណត់ត្រូវបានរក្សាទុកដោយជោគជ័យ!', 'success');
    } catch (error) {
      console.error(error);
      setMessage('មានបញ្ហាក្នុងការរក្សាទុក។ (Error Saving)');
      notify.error('បរាជ័យក្នុងការរក្សាទុក');
    } finally {
      setIsSaving(false);
    }
  };

  const handleRecalculateDrafts = async () => {
    const confirmed = await notify.confirm({
      title: 'គណនាឡើងវិញ (Recalculate Drafts)',
      text: `តើអ្នកពិតជាចង់អនុវត្តអត្រា ${formData.exchangeRate.toLocaleString()} ៛ ទៅលើតារាងប្រាក់ខែព្រាង (Draft Payrolls) ទាំងអស់មែនទេ?`,
      icon: 'question',
      confirmButtonText: 'យល់ព្រមអនុវត្ត',
    });
    if (!confirmed) {
      return;
    }
    setIsRecalculating(true);
    setMessage('');
    try {
      const res = await updateExchangeRateAndRecalculate(formData.exchangeRate);
      if (res.success) {
        const successMsg = `ជោគជ័យ! បានគណនាអត្រាប្តូរប្រាក់ ${formData.exchangeRate.toLocaleString()} ៛ លើតារាងប្រាក់ខែចំនួន ${res.count || 0} នាក់។`;
        setMessage(successMsg);
        notify.success('បានគណនាឡើងវិញដោយជោគជ័យ', successMsg);
      } else {
        setMessage('កំហុស៖ ' + res.error);
        notify.error('បរាជ័យក្នុងការគណនា', res.error);
      }
    } catch (err: any) {
      setMessage('កំហុសក្នុងការគណនា៖ ' + err.message);
      notify.error('បរាជ័យក្នុងការគណនា', err.message);
    } finally {
      setIsRecalculating(false);
    }
  };

  return (
    <div>
      <h2 style={{ fontSize: '1.429em', color: '#1976d2', marginBottom: '10px' }}>ការកំណត់កាលបរិច្ឆេទបើកប្រាក់ខែ & អត្រាប្តូរប្រាក់ (Payroll & Exchange Rate)</h2>
      <p style={{ color: '#666', marginBottom: '25px' }}>កំណត់ថ្ងៃចាប់ផ្តើម និងថ្ងៃបញ្ចប់សម្រាប់ការបើកប្រាក់ខែ និងអត្រាប្តូរប្រាក់ទីផ្សារសម្រាប់គណនាប្រាក់រៀលស្វ័យប្រវត្តិ។</p>

      {message && (
        <div style={{ padding: '10px 15px', backgroundColor: message.includes('ជោគជ័យ') ? '#e8f5e9' : '#fee2e2', color: message.includes('ជោគជ័យ') ? '#2e7d32' : '#b91c1c', borderRadius: '6px', marginBottom: '20px', fontWeight: 'bold' }}>
          {message}
        </div>
      )}

      <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '600px' }}>
        {/* Exchange Rate Card */}
        <div style={{ backgroundColor: '#f0fdf4', padding: '20px', borderRadius: '12px', border: '1.5px solid #86efac' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
            <h3 style={{ margin: 0, color: '#166534', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>💱</span> អត្រាប្តូរប្រាក់ទីផ្សារ (1$ = ? ៛)
            </h3>
            <span style={{ fontWeight: 800, color: '#15803d', fontSize: '1.05rem', backgroundColor: '#dcfce7', padding: '3px 10px', borderRadius: '12px' }}>
              {formData.exchangeRate.toLocaleString()} ៛
            </span>
          </div>
          <p style={{ fontSize: '0.82rem', color: '#15803d', margin: '0 0 12px 0' }}>
            អត្រានេះនឹងត្រូវយកទៅគណនាប្រាក់ខែជាប្រាក់រៀល (Net Salary Riel) ដោយស្វ័យប្រវត្តិក្នងតារាង Payroll ទាំងអស់។
          </p>

          <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{ flex: '1 1 200px' }}>
              <input
                type="number"
                name="exchangeRate"
                value={formData.exchangeRate}
                onChange={handleChange}
                min={1000}
                max={10000}
                step={1}
                required
                style={{
                  width: '100%',
                  padding: '10px',
                  borderRadius: '6px',
                  border: '2px solid #22c55e',
                  fontSize: '1.1rem',
                  fontWeight: 700,
                  color: '#0f172a',
                }}
              />
            </div>
            <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
              {[4000, 4050, 4100, 4120, 4150].map((pr) => (
                <button
                  key={pr}
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, exchangeRate: pr }))}
                  style={{
                    padding: '6px 10px',
                    borderRadius: '6px',
                    border: formData.exchangeRate === pr ? '1.5px solid #16a34a' : '1px solid #cbd5e1',
                    backgroundColor: formData.exchangeRate === pr ? '#bbf7d0' : '#ffffff',
                    color: '#166534',
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  {pr.toLocaleString()} ៛
                </button>
              ))}
            </div>
          </div>

          <div style={{ marginTop: '12px' }}>
            <button
              type="button"
              disabled={isRecalculating}
              onClick={handleRecalculateDrafts}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '7px 14px',
                backgroundColor: '#15803d',
                color: '#ffffff',
                border: 'none',
                borderRadius: '6px',
                fontSize: '0.82rem',
                fontWeight: 700,
                cursor: isRecalculating ? 'not-allowed' : 'pointer',
                opacity: isRecalculating ? 0.7 : 1,
              }}
            >
              <span>{isRecalculating ? 'កំពុងគណនា...' : '🔄 អនុវត្តអត្រាថ្មីនេះទៅលើតារាងព្រាង (Apply to All Drafts Now)'}</span>
            </button>
          </div>
        </div>

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
