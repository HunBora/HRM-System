'use client';

import React, { useState } from 'react';

export default function AppearanceSettingsManager({ initialSettings }: { initialSettings: any }) {
  const [formData, setFormData] = useState({
    fontSize: initialSettings?.fontSize || '14px',
    fontFamily: initialSettings?.fontFamily || 'Khmer OS Siemreap, sans-serif'
  });
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setMessage('');
    try {
      await fetch('/api/company-settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      setMessage('ការកំណត់ត្រូវបានរក្សាទុកដោយជោគជ័យ! (Saved Successfully)');
      // Refresh to apply global css immediately
      window.location.reload();
    } catch (error) {
      console.error(error);
      setMessage('មានបញ្ហាក្នុងការរក្សាទុក។ (Error Saving)');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div>
      <h2 style={{ fontSize: '1.429em', color: '#1976d2', marginBottom: '10px' }}>ការរចនា (Appearance Settings)</h2>
      <p style={{ color: '#666', marginBottom: '25px' }}>កំណត់រចនាប័ទ្មអក្សរ និងទំហំអក្សរសម្រាប់ប្រព័ន្ធទាំងមូល។ (Set global font style and size)</p>

      {message && (
        <div style={{ padding: '10px 15px', backgroundColor: message.includes('ជោគជ័យ') ? '#e8f5e9' : '#fee2e2', color: message.includes('ជោគជ័យ') ? '#2e7d32' : '#b91c1c', borderRadius: '6px', marginBottom: '20px', fontWeight: 'bold' }}>
          {message}
        </div>
      )}

      <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '500px' }}>
        <div style={{ backgroundColor: '#f8f9fa', padding: '20px', borderRadius: '12px', border: '1px solid #e0e0e0' }}>
          
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', fontSize: '1.0em' }}>ទំហំអក្សរ (Font Size)</label>
            <select name="fontSize" value={formData.fontSize} onChange={handleChange} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ccc', fontSize: '1.0em' }}>
              <option value="12px">តូច (Small - 12px)</option>
              <option value="14px">មធ្យម (Medium - 14px) [ស្តង់ដារ]</option>
              <option value="16px">ធំ (Large - 16px)</option>
              <option value="18px">ធំបំផុត (Extra Large - 18px)</option>
            </select>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', fontSize: '1.0em' }}>ប្រភេទអក្សរ (Font Style)</label>
            <select name="fontFamily" value={formData.fontFamily} onChange={handleChange} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ccc', fontSize: '1.0em' }}>
              <option value="'Khmer OS Siemreap', 'Inter', sans-serif">Khmer OS Siemreap (ស្តង់ដារ)</option>
              <option value="'Khmer OS Battambang', 'Inter', sans-serif">Khmer OS Battambang</option>
              <option value="'Suwannaphum', 'Inter', sans-serif">Suwannaphum</option>
              <option value="'Kantumruy Pro', 'Inter', sans-serif">Kantumruy Pro</option>
              <option value="'Hanuman', 'Inter', sans-serif">Hanuman</option>
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
