'use client';

import React, { useState } from 'react';
import { updatePayrollDates } from '@/app/dashboard/payrollSettingsActions';

type Settings = {
  payment1StartDate: number;
  payment1EndDate: number;
  payment2StartDate: number;
  payment2EndDate: number;
};

export default function PayrollSettingsModal({ initialSettings }: { initialSettings: Settings }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState(initialSettings);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: parseInt(value) || 1 }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await updatePayrollDates(formData);
      setIsOpen(false);
    } catch (error) {
      console.error("Failed to save settings", error);
      alert("Failed to save settings. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        className="btn-secondary kh-text"
        style={{ padding: '6px 12px', display: 'flex', alignItems: 'center', gap: '5px' }}
        title="កំណត់ថ្ងៃបើកប្រាក់ខែ"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>
        ⚙️
      </button>

      {isOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
          <div style={{ background: 'white', padding: '30px', borderRadius: '12px', width: '400px', maxWidth: '90%', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)' }}>
            <h2 className="kh-text" style={{ margin: '0 0 20px 0', fontSize: '1.25rem', color: '#1e293b' }}>⚙️ កំណត់ថ្ងៃបើកប្រាក់ខែ</h2>
            
            <div style={{ marginBottom: '20px' }}>
              <label className="kh-text" style={{ display: 'block', marginBottom: '10px', fontWeight: 'bold', color: '#334155' }}>ប្រាក់ខែបើកទី១ (ថ្ងៃទី)</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <input 
                  type="number" 
                  name="payment1StartDate" 
                  value={formData.payment1StartDate} 
                  onChange={handleChange}
                  className="input-field"
                  style={{ width: '80px', margin: 0 }}
                  min="1" max="31"
                />
                <span className="kh-text">ដល់</span>
                <input 
                  type="number" 
                  name="payment1EndDate" 
                  value={formData.payment1EndDate} 
                  onChange={handleChange}
                  className="input-field"
                  style={{ width: '80px', margin: 0 }}
                  min="1" max="31"
                />
              </div>
            </div>

            <div style={{ marginBottom: '30px' }}>
              <label className="kh-text" style={{ display: 'block', marginBottom: '10px', fontWeight: 'bold', color: '#334155' }}>ប្រាក់ខែបើកទី២ (ថ្ងៃទី)</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <input 
                  type="number" 
                  name="payment2StartDate" 
                  value={formData.payment2StartDate} 
                  onChange={handleChange}
                  className="input-field"
                  style={{ width: '80px', margin: 0 }}
                  min="1" max="31"
                />
                <span className="kh-text">ដល់</span>
                <input 
                  type="number" 
                  name="payment2EndDate" 
                  value={formData.payment2EndDate} 
                  onChange={handleChange}
                  className="input-field"
                  style={{ width: '80px', margin: 0 }}
                  min="1" max="31"
                  title="(ឧទាហរណ៍៖ 31 សំដៅលើថ្ងៃចុងក្រោយនៃខែ)"
                />
              </div>
              <p className="kh-text" style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '8px' }}>បញ្ជាក់៖ លេខ 31 សំដៅលើថ្ងៃចុងក្រោយនៃខែនីមួយៗដោយស្វ័យប្រវត្តិ។</p>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button 
                className="btn-secondary kh-text" 
                onClick={() => setIsOpen(false)}
                disabled={isSaving}
              >
                បោះបង់
              </button>
              <button 
                className="btn-primary kh-text" 
                onClick={handleSave}
                disabled={isSaving}
              >
                {isSaving ? 'កំពុងរក្សាទុក...' : 'រក្សាទុក'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
