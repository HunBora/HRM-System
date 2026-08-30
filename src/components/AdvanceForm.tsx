'use client'

import { useState } from 'react';
import { createAdvanceRequest } from '@/app/dashboard/advance/actions';

export default function AdvanceForm({ employees, t }: { employees: any[], t: any }) {
  const [loading, setLoading] = useState(false);
  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();

  return (
    <form action={createAdvanceRequest} onSubmit={() => setLoading(true)} className="card" style={{ maxWidth: '600px' }}>
      
      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '20px', marginBottom: '20px' }}>
        <div>
          <label className="kh-text" style={{ display: 'block', marginBottom: '8px' }}>{t.advance.form.employee} *</label>
          <select name="employeeId" className="input-field" required>
            <option value="">-- {t.advance.form.employee} --</option>
            {employees.map(emp => (
              <option key={emp.id} value={emp.id}>
                {emp.employeeId} - {emp.firstNameEn} {emp.lastNameEn}
              </option>
            ))}
          </select>
        </div>
        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
          <div>
            <label className="kh-text" style={{ display: 'block', marginBottom: '8px' }}>{t.advance.form.amount} *</label>
            <input type="number" name="amount" step="0.01" min="0" className="input-field" required placeholder="Ex: 50.00" />
          </div>
          <div>
            <label className="kh-text" style={{ display: 'block', marginBottom: '8px' }}>{t.advance.form.requestDate} *</label>
            <input type="date" name="requestDate" className="input-field" required defaultValue={new Date().toISOString().split('T')[0]} />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
          <div>
            <label className="kh-text" style={{ display: 'block', marginBottom: '8px' }}>{t.advance.form.month} *</label>
            <select name="month" className="input-field" defaultValue={currentMonth}>
              {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="kh-text" style={{ display: 'block', marginBottom: '8px' }}>{t.advance.form.year} *</label>
            <select name="year" className="input-field" defaultValue={currentYear}>
              {[currentYear - 1, currentYear, currentYear + 1].map(y => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="kh-text" style={{ display: 'block', marginBottom: '8px' }}>{t.advance.form.reason}</label>
          <textarea name="reason" className="input-field kh-text" rows={3} style={{ resize: 'vertical' }}></textarea>
        </div>
      </div>
      
      <div style={{ display: 'flex', gap: '10px' }}>
        <button type="submit" className="btn-primary kh-text" disabled={loading}>
          {loading ? t.advance.form.saving : t.advance.form.save}
        </button>
        <button type="button" onClick={() => window.history.back()} className="btn-secondary kh-text" disabled={loading}>
          {t.advance.form.cancel}
        </button>
      </div>
    </form>
  );
}
