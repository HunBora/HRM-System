'use client'
import { useState } from 'react';
import { deleteEmployee } from '@/app/dashboard/employees/actions';

export default function DeleteEmployeeButton({ id, confirmText = 'តើអ្នកពិតជាចង់លុបទិន្នន័យនេះមែនទេ?', deleteText = 'លុប' }: { id: string, confirmText?: string, deleteText?: string }) {
  const [showModal, setShowModal] = useState(false);

  return (
    <>
      <button 
        type="button" 
        onClick={() => setShowModal(true)}
        style={{ color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer' }}
      >
        🗑️ {deleteText}
      </button>

      {showModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 9999,
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          <div style={{
            background: 'white', padding: '25px', borderRadius: '12px',
            maxWidth: '400px', width: '90%', boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
            textAlign: 'center',
            animation: 'fadeIn 0.2s ease-out'
          }}>
            <div style={{ fontSize: '3rem', marginBottom: '10px' }}>⚠️</div>
            <h3 style={{ margin: '0 0 10px 0', color: '#1e293b' }} className="kh-text">បញ្ជាក់ការលុប (Confirm Delete)</h3>
            <p style={{ margin: '0 0 20px 0', color: '#64748b' }} className="kh-text">{confirmText}</p>
            
            <div style={{ display: 'flex', justifyContent: 'center', gap: '10px' }}>
              <button 
                type="button" 
                onClick={() => setShowModal(false)}
                className="kh-text"
                style={{
                  padding: '8px 16px', borderRadius: '6px', border: '1px solid #cbd5e1',
                  background: 'white', color: '#475569', cursor: 'pointer', fontWeight: 500
                }}
              >
                បោះបង់ (Cancel)
              </button>
              
              <form action={deleteEmployee} style={{ margin: 0 }}>
                <input type="hidden" name="id" value={id} />
                <button 
                  type="submit" 
                  onClick={() => setShowModal(false)}
                  className="kh-text"
                  style={{
                    padding: '8px 16px', borderRadius: '6px', border: 'none',
                    background: '#ef4444', color: 'white', cursor: 'pointer', fontWeight: 500
                  }}
                >
                  យល់ព្រមលុប (Delete)
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
