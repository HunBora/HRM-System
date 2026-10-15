'use client'

import { useState } from 'react';
import { updateAdvanceStatus, deleteAdvanceRequest } from './actions';
import notify from '@/lib/notify';

export default function AdvanceStatusClient({ id, currentStatus, t }: { id: string, currentStatus: string, t: any }) {
  const [loading, setLoading] = useState(false);

  const handleUpdate = async (status: string) => {
    setLoading(true);
    await updateAdvanceStatus(id, status);
    notify.toast(status === 'APPROVED' ? 'បានអនុម័តបើកប្រាក់មុនជោគជ័យ' : 'បានបដិសេធសំណើ', status === 'APPROVED' ? 'success' : 'info');
    setLoading(false);
  };

  const handleDelete = async () => {
    const confirmed = await notify.confirm({
      title: 'លុបសំណើសុំបើកប្រាក់មុន',
      text: 'តើអ្នកពិតជាចង់លុបសំណើសុំបើកប្រាក់មុននេះមែនទេ?',
      icon: 'warning',
      confirmButtonColor: '#ef4444',
      confirmButtonText: 'លុប (Delete)',
      cancelButtonText: 'បោះបង់',
    });
    if (confirmed) {
      setLoading(true);
      await deleteAdvanceRequest(id);
      notify.toast('បានលុបសំណើដោយជោគជ័យ', 'success');
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', gap: '5px', justifyContent: 'center' }}>
      {currentStatus === 'PENDING' && (
        <>
          <button 
            onClick={() => handleUpdate('APPROVED')} 
            disabled={loading}
            style={{ padding: '4px 8px', backgroundColor: '#22c55e', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem' }}
          >
            ✓
          </button>
          <button 
            onClick={() => handleUpdate('REJECTED')} 
            disabled={loading}
            style={{ padding: '4px 8px', backgroundColor: '#ef4444', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem' }}
          >
            ✕
          </button>
        </>
      )}
      <button 
        onClick={handleDelete} 
        disabled={loading}
        style={{ padding: '4px 8px', backgroundColor: 'transparent', color: '#ef4444', border: '1px solid #ef4444', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem' }}
      >
        🗑️
      </button>
    </div>
  );
}
