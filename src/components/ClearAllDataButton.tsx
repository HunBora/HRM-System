'use client'
import { useState } from 'react';
import { clearAllData } from '@/app/dashboard/employees/actions';

export default function ClearAllDataButton() {
  const [showModal, setShowModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleClearData = async () => {
    if (password !== 'admin123' && password !== 'developer') {
      setError('លេខសម្ងាត់មិនត្រឹមត្រូវទេ (Incorrect password)');
      return;
    }
    
    setIsDeleting(true);
    setError('');
    try {
      await clearAllData();
      setShowModal(false);
      setPassword('');
    } catch (err) {
      setError('មានបញ្ហាក្នុងការលុបទិន្នន័យ');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <button 
        type="button" 
        onClick={() => setShowModal(true)}
        className="btn-secondary kh-text"
        style={{ borderColor: '#ef4444', color: '#ef4444', backgroundColor: '#fef2f2' }}
      >
        🗑️ Clear Data
      </button>

      {showModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 9999,
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          <div style={{
            background: 'white', padding: '25px', borderRadius: '12px',
            maxWidth: '450px', width: '90%', boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
            textAlign: 'center',
            animation: 'fadeIn 0.2s ease-out'
          }}>
            <div style={{ fontSize: '3rem', marginBottom: '10px' }}>⚠️</div>
            <h3 style={{ margin: '0 0 10px 0', color: '#1e293b' }} className="kh-text">សិទ្ធិពិសេសសម្រាប់ Developer (Clear Data)</h3>
            <p style={{ margin: '0 0 20px 0', color: '#64748b', fontSize: '14px' }} className="kh-text">
              តើអ្នកពិតជាចង់លុបទិន្នន័យបុគ្គលិកទាំងអស់ រួមទាំងប្រាក់ខែ និងវត្តមានមែនទេ?<br/>
              <b>សកម្មភាពនេះមិនអាចទាញទិន្នន័យមកវិញបានទេ!</b>
            </p>
            
            <div style={{ marginBottom: '20px', textAlign: 'left' }}>
              <label className="kh-text" style={{ display: 'block', marginBottom: '8px', fontSize: '14px', color: '#334155' }}>
                សូមបញ្ចូលលេខសម្ងាត់ Developer ដើម្បីបន្ត៖
              </label>
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input-field"
                placeholder="Password (e.g. developer)"
                style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
              />
              {error && <p style={{ color: '#ef4444', fontSize: '13px', margin: '5px 0 0 0' }} className="kh-text">{error}</p>}
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'center', gap: '10px' }}>
              <button 
                type="button" 
                onClick={() => !isDeleting && setShowModal(false)}
                className="kh-text"
                disabled={isDeleting}
                style={{
                  padding: '8px 16px', borderRadius: '6px', border: '1px solid #cbd5e1',
                  background: 'white', color: '#475569', cursor: isDeleting ? 'not-allowed' : 'pointer', fontWeight: 500
                }}
              >
                បោះបង់ (Cancel)
              </button>
              
              <button 
                type="button" 
                onClick={handleClearData}
                className="kh-text"
                disabled={isDeleting || !password}
                style={{
                  padding: '8px 16px', borderRadius: '6px', border: 'none',
                  background: (isDeleting || !password) ? '#fca5a5' : '#ef4444', 
                  color: 'white', cursor: (isDeleting || !password) ? 'not-allowed' : 'pointer', fontWeight: 500
                }}
              >
                {isDeleting ? 'កំពុងលុប... (Deleting...)' : 'យល់ព្រមលុប (Delete All)'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
