'use client';

import React, { useState } from 'react';
import { updateAdvanceSalarySettings } from '@/app/dashboard/settingsActions';

export default function AdvanceSalarySettingsManager({ initialSettings }: { initialSettings: any }) {
  const [formData, setFormData] = useState({
    advanceMaxLimit: initialSettings?.advanceMaxLimit || 50,
    advanceEligibilityMonths: initialSettings?.advanceEligibilityMonths || 3,
    advanceRepaymentPolicy: initialSettings?.advanceRepaymentPolicy || 'NEXT_PAYROLL'
  });
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'advanceRepaymentPolicy' ? value : (parseFloat(value) || 0)
    }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setMessage('');
    try {
      await updateAdvanceSalarySettings(formData);
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
      <h2 style={{ fontSize: '1.429em', color: '#1976d2', marginBottom: '10px' }}>ការកំណត់ប្រាក់ខ្ចី (Advance Salary Settings)</h2>
      <p style={{ color: '#666', marginBottom: '25px' }}>កំណត់គោលការណ៍ និងលក្ខខណ្ឌសម្រាប់ការខ្ចីប្រាក់របស់បុគ្គលិក។</p>

      {message && (
        <div style={{ padding: '10px 15px', backgroundColor: message.includes('ជោគជ័យ') ? '#e8f5e9' : '#fee2e2', color: message.includes('ជោគជ័យ') ? '#2e7d32' : '#b91c1c', borderRadius: '6px', marginBottom: '20px', fontWeight: 'bold' }}>
          {message}
        </div>
      )}

      <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '600px' }}>
        
        <div style={{ backgroundColor: '#f8f9fa', padding: '20px', borderRadius: '12px', border: '1px solid #e0e0e0' }}>
          <h3 style={{ marginBottom: '15px', color: '#333' }}>១. ដែនកំណត់ទឹកប្រាក់ (Max Limit)</h3>
          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', fontSize: '1.0em' }}>ភាគរយអតិបរមានៃប្រាក់ខែគោល (%)</label>
            <input 
              type="number" 
              name="advanceMaxLimit" 
              value={formData.advanceMaxLimit} 
              onChange={handleChange} 
              min={1} 
              max={100} 
              required 
              style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ccc' }} 
            />
            <small style={{ color: '#666', marginTop: '5px', display: 'block' }}>ឧទាហរណ៍៖ បើដាក់ 50 មានន័យថាអាចខ្ចីបានត្រឹម ៥០% នៃប្រាក់ខែ។</small>
          </div>
        </div>

        <div style={{ backgroundColor: '#f8f9fa', padding: '20px', borderRadius: '12px', border: '1px solid #e0e0e0' }}>
          <h3 style={{ marginBottom: '15px', color: '#333' }}>២. លក្ខខណ្ឌអាចខ្ចីបាន (Eligibility)</h3>
          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', fontSize: '1.0em' }}>អាយុកាលការងារ (ចំនួនខែ)</label>
            <input 
              type="number" 
              name="advanceEligibilityMonths" 
              value={formData.advanceEligibilityMonths} 
              onChange={handleChange} 
              min={0} 
              required 
              style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ccc' }} 
            />
            <small style={{ color: '#666', marginTop: '5px', display: 'block' }}>ឧទាហរណ៍៖ ដាក់ 3 មានន័យថាធ្វើការ ៣ខែឡើងទើបអាចខ្ចីបាន។</small>
          </div>
        </div>

        <div style={{ backgroundColor: '#f8f9fa', padding: '20px', borderRadius: '12px', border: '1px solid #e0e0e0' }}>
          <h3 style={{ marginBottom: '15px', color: '#333' }}>៣. គោលការណ៍កាត់ប្រាក់ (Repayment Policy)</h3>
          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', fontSize: '1.0em' }}>វិធីសាស្ត្រទូទាត់</label>
            <select 
              name="advanceRepaymentPolicy" 
              value={formData.advanceRepaymentPolicy} 
              onChange={handleChange} 
              required 
              style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ccc', backgroundColor: '#fff' }}
            >
              <option value="NEXT_PAYROLL">កាត់ផ្តាច់ខែបន្ទាប់ម្តងទាំងអស់ (Deduct in full on next payroll)</option>
              <option value="INSTALLMENT">អនុញ្ញាតឱ្យរំលស់ជាខែ (Allow installments)</option>
            </select>
          </div>
        </div>

        <button type="submit" disabled={isSaving} style={{ padding: '12px 24px', backgroundColor: '#1976d2', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '1.071em', opacity: isSaving ? 0.7 : 1 }}>
          {isSaving ? 'កំពុងរក្សាទុក...' : 'រក្សាទុកការកំណត់'}
        </button>
      </form>
    </div>
  );
}
