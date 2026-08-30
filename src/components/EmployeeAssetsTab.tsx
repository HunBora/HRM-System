'use client';

import React, { useState } from 'react';
import { addAsset, updateAssetStatus, deleteAsset } from '@/app/dashboard/employees/[id]/docActions';

export default function EmployeeAssetsTab({ employeeId, assets }: { employeeId: string, assets: any[] }) {
  const [loading, setLoading] = useState(false);

  const handleAdd = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    formData.append('employeeId', employeeId);
    
    await addAsset(formData);
    
    setLoading(false);
    (e.target as HTMLFormElement).reset();
  };

  const handleStatusChange = async (assetId: string, newStatus: string) => {
    await updateAssetStatus(assetId, newStatus);
  };

  const handleDelete = async (assetId: string) => {
    if (confirm('តើអ្នកពិតជាចង់លុបទិន្នន័យសម្ភារៈនេះមែនទេ?')) {
      await deleteAsset(assetId);
    }
  };

  return (
    <div>
      <h3 className="kh-text" style={{ marginBottom: '20px', color: '#0f172a' }}>សម្ភារៈក្រុមហ៊ុនដែលបានប្រគល់ជូន</h3>
      
      <form onSubmit={handleAdd} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr auto', gap: '15px', alignItems: 'end', marginBottom: '30px', backgroundColor: '#f8fafc', padding: '15px', borderRadius: '8px' }}>
        <div>
          <label className="kh-text" style={{ display: 'block', marginBottom: '5px', fontSize: '0.9rem' }}>ឈ្មោះសម្ភារៈ (Asset Name)</label>
          <input type="text" name="name" required placeholder="ឧទាហរណ៍: Laptop Dell, ឯកសណ្ឋាន" style={{ width: '100%', padding: '8px', border: '1px solid #cbd5e1', borderRadius: '4px' }} className="kh-text" />
        </div>
        <div>
          <label className="kh-text" style={{ display: 'block', marginBottom: '5px', fontSize: '0.9rem' }}>លេខកូដសម្គាល់ (Serial Number)</label>
          <input type="text" name="serialNumber" placeholder="S/N..." style={{ width: '100%', padding: '8px', border: '1px solid #cbd5e1', borderRadius: '4px' }} className="kh-text" />
        </div>
        <div>
          <label className="kh-text" style={{ display: 'block', marginBottom: '5px', fontSize: '0.9rem' }}>ចំណាំ (Remarks)</label>
          <input type="text" name="remarks" placeholder="ស្ថានភាពថ្មី/ចាស់..." style={{ width: '100%', padding: '8px', border: '1px solid #cbd5e1', borderRadius: '4px' }} className="kh-text" />
        </div>
        <button type="submit" disabled={loading} className="btn-primary kh-text" style={{ padding: '8px 20px', height: '37px' }}>
          {loading ? 'កំពុងបញ្ចូល...' : '+ កត់ត្រា'}
        </button>
      </form>

      <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
        <thead>
          <tr style={{ backgroundColor: '#f1f5f9' }}>
            <th style={{ padding: '12px', borderBottom: '1px solid #cbd5e1' }} className="kh-text">ឈ្មោះសម្ភារៈ (Name)</th>
            <th style={{ padding: '12px', borderBottom: '1px solid #cbd5e1' }} className="kh-text">កូដ (S/N)</th>
            <th style={{ padding: '12px', borderBottom: '1px solid #cbd5e1' }} className="kh-text">ថ្ងៃប្រគល់ជូន (Assigned)</th>
            <th style={{ padding: '12px', borderBottom: '1px solid #cbd5e1' }} className="kh-text">ស្ថានភាព (Status)</th>
            <th style={{ padding: '12px', borderBottom: '1px solid #cbd5e1' }} className="kh-text">ចំណាំ (Remarks)</th>
            <th style={{ padding: '12px', borderBottom: '1px solid #cbd5e1', textAlign: 'right' }} className="kh-text">សកម្មភាព</th>
          </tr>
        </thead>
        <tbody>
          {assets.length === 0 ? (
            <tr>
              <td colSpan={6} style={{ padding: '30px', textAlign: 'center' }} className="kh-text text-muted">
                មិនមានទិន្នន័យសម្ភារៈទេ
              </td>
            </tr>
          ) : (
            assets.map(asset => (
              <tr key={asset.id} style={{ borderBottom: '1px dashed #cbd5e1' }}>
                <td style={{ padding: '12px' }} className="kh-text font-bold">{asset.name}</td>
                <td style={{ padding: '12px' }}>{asset.serialNumber || '-'}</td>
                <td style={{ padding: '12px' }}>{new Date(asset.assignDate).toLocaleDateString('en-GB')}</td>
                <td style={{ padding: '12px' }}>
                  <select 
                    value={asset.status} 
                    onChange={(e) => handleStatusChange(asset.id, e.target.value)}
                    style={{ 
                      padding: '4px 8px', borderRadius: '4px', border: '1px solid #cbd5e1',
                      backgroundColor: asset.status === 'IN_USE' ? '#dcfce7' : asset.status === 'RETURNED' ? '#f1f5f9' : '#fee2e2',
                      color: asset.status === 'IN_USE' ? '#166534' : asset.status === 'RETURNED' ? '#475569' : '#991b1b',
                      fontWeight: 'bold'
                    }}
                  >
                    <option value="IN_USE">កំពុងប្រើ (In Use)</option>
                    <option value="RETURNED">បានប្រគល់សង (Returned)</option>
                    <option value="LOST">បាត់បង់ (Lost)</option>
                    <option value="DAMAGED">ខូចខាត (Damaged)</option>
                  </select>
                </td>
                <td style={{ padding: '12px' }} className="kh-text">{asset.remarks || '-'}</td>
                <td style={{ padding: '12px', textAlign: 'right' }}>
                  <button onClick={() => handleDelete(asset.id)} className="kh-text" style={{ backgroundColor: 'transparent', color: '#ef4444', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}>
                    លុប (Delete)
                  </button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
