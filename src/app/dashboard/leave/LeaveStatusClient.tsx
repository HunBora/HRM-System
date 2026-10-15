'use client'

import { useState } from 'react';
import { updateLeaveStatus, deleteLeaveRequest } from './actions';
import notify from '@/lib/notify';

export default function LeaveStatusClient({ id, currentStatus, t }: { id: string, currentStatus: string, t: any }) {
  const [loading, setLoading] = useState(false);

  const handleUpdate = async (status: string) => {
    setLoading(true);
    await updateLeaveStatus(id, status);
    notify.toast(status === 'APPROVED' ? 'បានអនុម័តច្បាប់ជោគជ័យ' : 'បានបដិសេធច្បាប់', status === 'APPROVED' ? 'success' : 'info');
    setLoading(false);
  };

  const handleDelete = async () => {
    const confirmed = await notify.confirm({
      title: 'លុបពាក្យស្នើសុំច្បាប់',
      text: 'តើអ្នកពិតជាចង់លុបពាក្យស្នើសុំច្បាប់នេះមែនទេ?',
      icon: 'warning',
      confirmButtonColor: '#ef4444',
      confirmButtonText: 'លុប (Delete)',
      cancelButtonText: 'បោះបង់',
    });
    if (confirmed) {
      setLoading(true);
      await deleteLeaveRequest(id);
      notify.toast('បានលុបពាក្យស្នើសុំច្បាប់ដោយជោគជ័យ', 'success');
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
