'use client';

import React, { useState } from 'react';
import { createAsset, updateAssetStatus, deleteAsset } from './actions';
import Swal from 'sweetalert2';

export default function AssetClient({ role, assets, employees, l }: any) {
  const [showForm, setShowForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const t = l.assets;

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    const formData = new FormData(e.currentTarget);

    const res = await createAsset(formData);
    
    setIsSubmitting(false);
    if (res?.error) {
      Swal.fire({
        icon: 'error',
        title: 'បរាជ័យ',
        text: res.error,
        confirmButtonText: 'យល់ព្រម'
      });
    } else {
      setShowForm(false);
      Swal.fire({
        icon: 'success',
        title: 'ជោគជ័យ',
        text: 'បានរក្សាទុកដោយជោគជ័យ!',
        timer: 1500,
        showConfirmButton: false
      });
    }
  };

  const handleUpdateStatus = async (id: string, status: string) => {
    const result = await Swal.fire({
      title: 'បញ្ជាក់',
      text: 'តើអ្នកពិតជាចង់ផ្លាស់ប្តូរស្ថានភាពមែនទេ?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'យល់ព្រម',
      cancelButtonText: 'បោះបង់'
    });
    
    if (!result.isConfirmed) return;
    
    const res = await updateAssetStatus(id, status);
    if (res?.error) {
      Swal.fire({
        icon: 'error',
        title: 'បរាជ័យ',
        text: res.error,
        confirmButtonText: 'យល់ព្រម'
      });
    } else {
      Swal.fire({
        icon: 'success',
        title: 'ជោគជ័យ',
        text: 'ស្ថានភាពត្រូវបានផ្លាស់ប្តូរដោយជោគជ័យ!',
        timer: 1500,
        showConfirmButton: false
      });
    }
  };

  const handleDelete = async (id: string) => {
    const result = await Swal.fire({
      title: 'បញ្ជាក់',
      text: 'តើអ្នកពិតជាចង់លុបទិន្នន័យនេះមែនទេ?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'លុប',
      cancelButtonText: 'បោះបង់',
      confirmButtonColor: '#d33'
    });
    
    if (!result.isConfirmed) return;
    
    const res = await deleteAsset(id);
    if (res?.error) {
      Swal.fire({
        icon: 'error',
        title: 'បរាជ័យ',
        text: res.error,
        confirmButtonText: 'យល់ព្រម'
      });
    } else {
      Swal.fire({
        icon: 'success',
        title: 'ជោគជ័យ',
        text: 'បានលុបដោយជោគជ័យ!',
        timer: 1500,
        showConfirmButton: false
      });
    }
  };

  const statusColors: any = {
    'IN_USE': { bg: '#dbeafe', text: '#1e40af', label: t.status.IN_USE },
    'RETURNED': { bg: '#d1fae5', text: '#065f46', label: t.status.RETURNED },
    'LOST': { bg: '#fee2e2', text: '#991b1b', label: t.status.LOST },
    'DAMAGED': { bg: '#fef3c7', text: '#92400e', label: t.status.DAMAGED }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h1 className="title kh-text">{t.title}</h1>
        {['ADMIN', 'HR_MANAGER', 'HR'].includes(role) && (
          <button 
            onClick={() => setShowForm(!showForm)}
            className="btn-primary kh-text"
            style={{ padding: '8px 16px', borderRadius: '8px', border: 'none', background: '#4f46e5', color: '#fff', cursor: 'pointer', fontWeight: 'bold' }}
          >
            {showForm ? t.form.cancel : t.newBtn}
          </button>
        )}
      </div>

      {showForm && (
        <div className="card animate-fade-in" style={{ marginBottom: '20px', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
          <h2 className="kh-text" style={{ fontSize: '1.2rem', marginBottom: '15px' }}>{t.form.newTitle}</h2>
          <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '15px' }}>
            <div className="form-group" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
              <label className="kh-text">{t.form.employee}</label>
              <select name="employeeId" required className="input-field">
                <option value="">--ជ្រើសរើស--</option>
                {employees.map((emp: any) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.employeeId} - {emp.firstNameKh || emp.firstNameEn} {emp.lastNameKh || emp.lastNameEn}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="form-group" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
              <label className="kh-text">{t.form.name}</label>
              <input type="text" name="name" required className="input-field" placeholder="MacBook Pro M2..." />
            </div>
            
            <div className="form-group" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
              <label className="kh-text">{t.form.serial}</label>
              <input type="text" name="serialNumber" className="input-field" placeholder="C02XXXXXXXXX" />
            </div>

            <div className="form-group" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
              <label className="kh-text">{t.form.assignDate}</label>
              <input type="date" name="assignDate" required className="input-field" defaultValue={new Date().toISOString().split('T')[0]} />
            </div>
            
            <div className="form-group" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
              <label className="kh-text">{t.form.status}</label>
              <select name="status" required className="input-field" defaultValue="IN_USE">
                <option value="IN_USE">{t.status.IN_USE}</option>
                <option value="RETURNED">{t.status.RETURNED}</option>
                <option value="LOST">{t.status.LOST}</option>
                <option value="DAMAGED">{t.status.DAMAGED}</option>
              </select>
            </div>

            <div className="form-group" style={{ gridColumn: '1 / -1', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
              <label className="kh-text">{t.form.remarks}</label>
              <textarea name="remarks" className="input-field" rows={2} placeholder="..."></textarea>
            </div>
            
            <div style={{ gridColumn: '1 / -1', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button type="button" onClick={() => setShowForm(false)} className="btn-secondary kh-text" style={{ padding: '8px 24px', background: '#e2e8f0', color: '#475569', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>
                {t.form.cancel}
              </button>
              <button type="submit" disabled={isSubmitting} className="btn-primary kh-text" style={{ padding: '8px 24px', background: '#059669', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>
                {isSubmitting ? t.form.saving : t.form.save}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="card" style={{ padding: '0', overflow: 'hidden', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
        <table className="table" style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead style={{ backgroundColor: '#f8fafc' }}>
            <tr>
              <th className="kh-text" style={{ padding: '12px 15px', textAlign: 'left', borderBottom: '1px solid #e2e8f0' }}>{t.columns.assignDate}</th>
              <th className="kh-text" style={{ padding: '12px 15px', textAlign: 'left', borderBottom: '1px solid #e2e8f0' }}>{t.columns.employee}</th>
              <th className="kh-text" style={{ padding: '12px 15px', textAlign: 'left', borderBottom: '1px solid #e2e8f0' }}>{t.columns.name}</th>
              <th className="kh-text" style={{ padding: '12px 15px', textAlign: 'left', borderBottom: '1px solid #e2e8f0' }}>{t.columns.serial}</th>
              <th className="kh-text" style={{ padding: '12px 15px', textAlign: 'center', borderBottom: '1px solid #e2e8f0' }}>{t.columns.status}</th>
              <th className="kh-text" style={{ padding: '12px 15px', textAlign: 'left', borderBottom: '1px solid #e2e8f0' }}>{t.columns.remarks}</th>
              {['ADMIN', 'HR_MANAGER', 'HR'].includes(role) && (
                <th className="kh-text" style={{ padding: '12px 15px', textAlign: 'center', borderBottom: '1px solid #e2e8f0' }}>{t.columns.actions}</th>
              )}
            </tr>
          </thead>
          <tbody>
            {assets.map((asset: any) => {
              const empName = asset.employee?.firstNameKh ? `${asset.employee.firstNameKh} ${asset.employee.lastNameKh}` : `${asset.employee.firstNameEn} ${asset.employee.lastNameEn}`;
              
              return (
              <tr key={asset.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                <td style={{ padding: '12px 15px' }}>{new Date(asset.assignDate).toLocaleDateString('en-GB')}</td>
                <td style={{ padding: '12px 15px' }} className="kh-text">
                  <div style={{ fontWeight: 'bold' }}>{empName}</div>
                  <div style={{ fontSize: '0.8rem', color: '#64748b' }}>{asset.employee.employeeId}</div>
                </td>
                <td style={{ padding: '12px 15px' }} className="kh-text">
                  {asset.name}
                </td>
                <td style={{ padding: '12px 15px', color: '#64748b' }}>
                  {asset.serialNumber || '-'}
                </td>
                <td style={{ padding: '12px 15px', textAlign: 'center' }}>
                  <span className="kh-text" style={{ 
                    padding: '4px 8px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 'bold',
                    backgroundColor: statusColors[asset.status]?.bg || '#f1f5f9',
                    color: statusColors[asset.status]?.text || '#475569'
                  }}>
                    {statusColors[asset.status]?.label || asset.status}
                  </span>
                  {asset.returnDate && (
                    <div style={{ fontSize: '0.7rem', color: '#64748b', marginTop: '4px' }}>
                      {new Date(asset.returnDate).toLocaleDateString('en-GB')}
                    </div>
                  )}
                </td>
                <td style={{ padding: '12px 15px', color: '#64748b', fontSize: '0.85rem', maxWidth: '150px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {asset.remarks || '-'}
                </td>
                {['ADMIN', 'HR_MANAGER', 'HR'].includes(role) && (
                  <td style={{ padding: '12px 15px', textAlign: 'center' }}>
                    <select 
                      value={asset.status} 
                      onChange={(e) => handleUpdateStatus(asset.id, e.target.value)}
                      style={{ fontSize: '0.75rem', padding: '2px 4px', borderRadius: '4px', border: '1px solid #cbd5e1', marginRight: '5px' }}
                    >
                      <option value="IN_USE">IN USE</option>
                      <option value="RETURNED">RETURNED</option>
                      <option value="LOST">LOST</option>
                      <option value="DAMAGED">DAMAGED</option>
                    </select>
                    
                    <button onClick={() => handleDelete(asset.id)} style={{ border: 'none', background: '#fee2e2', color: '#991b1b', padding: '2px 6px', borderRadius: '4px', cursor: 'pointer', fontSize: '0.75rem' }}>
                      លុប
                    </button>
                  </td>
                )}
              </tr>
            );
          })}
            {assets.length === 0 && (
              <tr>
                <td colSpan={7} style={{ padding: '20px', textAlign: 'center', color: '#64748b' }} className="kh-text">
                  មិនមានទិន្នន័យ (No Data)
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
