'use client';

import React, { useState } from 'react';
import { submitExpenseClaim, updateExpenseStatus } from './actions';

export default function ExpenseClient({ role, currentEmployeeId, claims, l, locale }: any) {
  const [showForm, setShowForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    const formData = new FormData(e.currentTarget);
    const res = await submitExpenseClaim(formData);
    
    setIsSubmitting(false);
    if (res?.error) {
      alert(res.error);
    } else {
      setShowForm(false);
      alert('បានបញ្ជូនការស្នើសុំដោយជោគជ័យ!');
    }
  };

  const handleUpdateStatus = async (id: string, status: string) => {
    if (!confirm('តើអ្នកពិតជាចង់ផ្លាស់ប្តូរស្ថានភាពមែនទេ?')) return;
    const res = await updateExpenseStatus(id, status);
    if (res?.error) {
      alert(res.error);
    }
  };

  const statusColors: any = {
    'PENDING': { bg: '#fef3c7', text: '#92400e', label: 'កំពុងរង់ចាំ' },
    'APPROVED_DEPT': { bg: '#e0e7ff', text: '#3730a3', label: 'ប្រធានផ្នែកអនុម័ត' },
    'APPROVED_HR': { bg: '#dbeafe', text: '#1e40af', label: 'HR អនុម័ត' },
    'REJECTED': { bg: '#fee2e2', text: '#991b1b', label: 'បដិសេធ' },
    'PAID': { bg: '#d1fae5', text: '#065f46', label: 'ទូទាត់រួច' }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h1 className="title kh-text">ស្នើសុំទូទាត់ការចំណាយ (Expense Claims)</h1>
        <button 
          onClick={() => setShowForm(!showForm)}
          className="btn-primary kh-text"
          style={{ padding: '8px 16px', borderRadius: '8px', border: 'none', background: '#4f46e5', color: '#fff', cursor: 'pointer', fontWeight: 'bold' }}
        >
          {showForm ? 'បិទផ្ទាំងស្នើសុំ' : '+ ស្នើសុំទូទាត់ប្រាក់'}
        </button>
      </div>

      {showForm && (
        <div className="card animate-fade-in" style={{ marginBottom: '20px', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
          <h2 className="kh-text" style={{ fontSize: '1.2rem', marginBottom: '15px' }}>ទម្រង់ស្នើសុំ</h2>
          <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
            <div className="form-group">
              <label className="kh-text">ថ្ងៃទីចំណាយ *</label>
              <input type="date" name="date" required className="input-field" defaultValue={new Date().toISOString().split('T')[0]} />
            </div>
            <div className="form-group">
              <label className="kh-text">ប្រភេទចំណាយ *</label>
              <select name="category" required className="input-field">
                <option value="TRANSPORT">ការធ្វើដំណើរ (Transport)</option>
                <option value="MEAL">អាហារ (Meals)</option>
                <option value="SUPPLIES">សម្ភារៈការិយាល័យ (Supplies)</option>
                <option value="ACCOMMODATION">កន្លែងស្នាក់នៅ (Accommodation)</option>
                <option value="OTHER">ផ្សេងៗ (Other)</option>
              </select>
            </div>
            <div className="form-group">
              <label className="kh-text">ចំនួនទឹកប្រាក់ *</label>
              <div style={{ display: 'flex', gap: '10px' }}>
                <input type="number" name="amount" step="0.01" min="0.01" required className="input-field" placeholder="ឧទាហរណ៍: 15.50" />
                <select name="currency" className="input-field" style={{ width: '80px' }}>
                  <option value="USD">USD</option>
                  <option value="KHR">KHR</option>
                </select>
              </div>
            </div>
            <div className="form-group">
              <label className="kh-text">តំណភ្ជាប់វិក្កយបត្រ (Receipt Link)</label>
              <input type="url" name="receiptUrl" className="input-field" placeholder="Google Drive Link..." />
            </div>
            <div className="form-group" style={{ gridColumn: '1 / -1' }}>
              <label className="kh-text">បរិយាយ / មូលហេតុ *</label>
              <textarea name="description" required className="input-field" rows={3} placeholder="មូលហេតុនៃការចំណាយ..."></textarea>
            </div>
            <div style={{ gridColumn: '1 / -1', display: 'flex', justifyContent: 'flex-end' }}>
              <button type="submit" disabled={isSubmitting} className="btn-primary kh-text" style={{ padding: '8px 24px', background: '#059669', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>
                {isSubmitting ? 'កំពុងបញ្ជូន...' : 'បញ្ជូនសំណើ'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="card" style={{ padding: '0', overflow: 'hidden', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
        <table className="table" style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead style={{ backgroundColor: '#f8fafc' }}>
            <tr>
              <th className="kh-text" style={{ padding: '12px 15px', textAlign: 'left', borderBottom: '1px solid #e2e8f0' }}>ថ្ងៃទី</th>
              {role !== 'EMPLOYEE' && <th className="kh-text" style={{ padding: '12px 15px', textAlign: 'left', borderBottom: '1px solid #e2e8f0' }}>បុគ្គលិក</th>}
              <th className="kh-text" style={{ padding: '12px 15px', textAlign: 'left', borderBottom: '1px solid #e2e8f0' }}>ប្រភេទ</th>
              <th className="kh-text" style={{ padding: '12px 15px', textAlign: 'right', borderBottom: '1px solid #e2e8f0' }}>ទឹកប្រាក់</th>
              <th className="kh-text" style={{ padding: '12px 15px', textAlign: 'center', borderBottom: '1px solid #e2e8f0' }}>ស្ថានភាព</th>
              <th className="kh-text" style={{ padding: '12px 15px', textAlign: 'center', borderBottom: '1px solid #e2e8f0' }}>សកម្មភាព</th>
            </tr>
          </thead>
          <tbody>
            {claims.map((claim: any) => (
              <tr key={claim.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                <td style={{ padding: '12px 15px' }}>{new Date(claim.date).toLocaleDateString('en-GB')}</td>
                {role !== 'EMPLOYEE' && (
                  <td style={{ padding: '12px 15px' }} className="kh-text">
                    {claim.employee?.firstNameKh} {claim.employee?.lastNameKh}
                    <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{claim.employee?.department}</div>
                  </td>
                )}
                <td style={{ padding: '12px 15px' }}>
                  <div style={{ fontWeight: 'bold' }}>{claim.category}</div>
                  <div style={{ fontSize: '0.8rem', color: '#64748b', maxWidth: '150px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{claim.description}</div>
                </td>
                <td style={{ padding: '12px 15px', textAlign: 'right', fontWeight: 'bold', color: '#059669' }}>
                  {claim.currency === 'USD' ? '$' : '៛'} {claim.amount.toLocaleString()}
                </td>
                <td style={{ padding: '12px 15px', textAlign: 'center' }}>
                  <span className="kh-text" style={{ 
                    padding: '4px 8px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 'bold',
                    backgroundColor: statusColors[claim.status]?.bg || '#f1f5f9',
                    color: statusColors[claim.status]?.text || '#475569'
                  }}>
                    {statusColors[claim.status]?.label || claim.status}
                  </span>
                </td>
                <td style={{ padding: '12px 15px', textAlign: 'center' }}>
                  {claim.receiptUrl && (
                    <a href={claim.receiptUrl} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-block', marginRight: '10px', color: '#3b82f6', textDecoration: 'none' }} title="មើលវិក្កយបត្រ">
                      📎
                    </a>
                  )}
                  
                  {role === 'DEPT_HEAD' && claim.status === 'PENDING' && (
                    <div style={{ display: 'flex', gap: '5px', justifyContent: 'center', marginTop: '5px' }}>
                      <button onClick={() => handleUpdateStatus(claim.id, 'APPROVED_DEPT')} style={{ border: 'none', background: '#dbeafe', color: '#1e40af', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer', fontSize: '0.7rem' }}>អនុម័ត</button>
                      <button onClick={() => handleUpdateStatus(claim.id, 'REJECTED')} style={{ border: 'none', background: '#fee2e2', color: '#991b1b', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer', fontSize: '0.7rem' }}>បដិសេធ</button>
                    </div>
                  )}

                  {(role === 'ADMIN' || role === 'HR_MANAGER' || role === 'PAYROLL_ADMIN') && (
                    <select 
                      value={claim.status} 
                      onChange={(e) => handleUpdateStatus(claim.id, e.target.value)}
                      style={{ fontSize: '0.75rem', padding: '2px 4px', borderRadius: '4px', border: '1px solid #cbd5e1', marginTop: '5px' }}
                    >
                      <option value="PENDING">PENDING</option>
                      <option value="APPROVED_DEPT">APPROVED (Dept)</option>
                      <option value="APPROVED_HR">APPROVED (HR)</option>
                      <option value="PAID">PAID</option>
                      <option value="REJECTED">REJECTED</option>
                    </select>
                  )}
                </td>
              </tr>
            ))}
            {claims.length === 0 && (
              <tr>
                <td colSpan={6} style={{ padding: '20px', textAlign: 'center', color: '#64748b' }} className="kh-text">
                  មិនមានសំណើទូទាត់ការចំណាយទេ
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
