'use client'

import { useState, useEffect } from 'react';
import { createLeaveRequest } from '@/app/dashboard/leave/actions';

export default function LeaveForm({ employees, t }: { employees: any[], t: any }) {
  const [loading, setLoading] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [duration, setDuration] = useState<number | ''>(1);

  useEffect(() => {
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      if (end >= start) {
        const diffTime = Math.abs(end.getTime() - start.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
        setDuration(diffDays);
      } else {
        setDuration('');
      }
    }
  }, [startDate, endDate]);

  return (
    <form action={createLeaveRequest} onSubmit={() => setLoading(true)} className="card" style={{ maxWidth: '600px' }}>
      
      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '20px', marginBottom: '20px' }}>
        <div>
          <label className="kh-text" style={{ display: 'block', marginBottom: '8px' }}>{t.leave.form.employee} *</label>
          <select name="employeeId" className="input-field" required>
            <option value="">-- {t.leave.form.employee} --</option>
            {employees.map(emp => (
              <option key={emp.id} value={emp.id}>
                {emp.employeeId} - {emp.firstNameEn} {emp.lastNameEn}
              </option>
            ))}
          </select>
        </div>
        
        <div>
          <label className="kh-text" style={{ display: 'block', marginBottom: '8px' }}>{t.leave.form.type} *</label>
          <select name="leaveType" className="input-field kh-text" required>
            <option value="ANNUAL">{t.leave.types.ANNUAL}</option>
            <option value="SICK">{t.leave.types.SICK}</option>
            <option value="MATERNITY">{t.leave.types.MATERNITY}</option>
            <option value="UNPAID">{t.leave.types.UNPAID}</option>
            <option value="OTHER">{t.leave.types.OTHER}</option>
          </select>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px', marginBottom: '20px' }}>
          <div>
            <label className="kh-text" style={{ display: 'block', marginBottom: '8px' }}>{t.leave.form.startDate} *</label>
            <input type="date" name="startDate" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="input-field" required />
          </div>
          <div>
            <label className="kh-text" style={{ display: 'block', marginBottom: '8px' }}>{t.leave.form.endDate} *</label>
            <input type="date" name="endDate" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="input-field" required />
          </div>
          <div>
            <label className="kh-text" style={{ display: 'block', marginBottom: '8px' }}>ចំនួនថ្ងៃ (Total Days) *</label>
            <input type="number" step="0.5" min="0.5" name="duration" value={duration} onChange={(e) => setDuration(parseFloat(e.target.value) || '')} className="input-field" required />
          </div>
        </div>

        <div>
          <label className="kh-text" style={{ display: 'block', marginBottom: '8px' }}>{t.leave.form.reason}</label>
          <textarea name="reason" className="input-field kh-text" rows={4} style={{ resize: 'vertical' }}></textarea>
        </div>
      </div>
      
      <div style={{ display: 'flex', gap: '10px' }}>
        <button type="submit" className="btn-primary kh-text" disabled={loading}>
          {loading ? t.leave.form.saving : t.leave.form.save}
        </button>
        <button type="button" onClick={() => window.history.back()} className="btn-secondary kh-text" disabled={loading}>
          {t.leave.form.cancel}
        </button>
      </div>
    </form>
  );
}
