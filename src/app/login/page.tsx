'use client';

import { useState } from 'react';
import { login } from './actions';

export default function LoginPage() {
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    const formData = new FormData(e.currentTarget);
    const res = await login(formData);
    
    if (res?.error) {
      setError(res.error);
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f1f5f9' }}>
      <div style={{ backgroundColor: '#fff', padding: '40px', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)', width: '100%', maxWidth: '400px' }}>
        <div style={{ textAlign: 'center', marginBottom: '30px' }}>
          <h1 className="kh-text" style={{ fontSize: '1.8rem', color: '#0f172a', marginBottom: '10px' }}>HRM System</h1>
          <p className="kh-text" style={{ color: '#64748b' }}>សូមវាយបញ្ចូលគណនីរបស់អ្នក</p>
        </div>

        {error && (
          <div className="kh-text" style={{ backgroundColor: '#fee2e2', color: '#991b1b', padding: '10px', borderRadius: '6px', marginBottom: '20px', fontSize: '0.9rem', textAlign: 'center' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div>
            <label className="kh-text" style={{ display: 'block', marginBottom: '8px', color: '#334155', fontWeight: 500 }}>អ៊ីមែល (Email)</label>
            <input 
              type="email" 
              name="email" 
              required 
              placeholder="admin@gmail.com"
              style={{ width: '100%', padding: '12px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '1rem' }}
            />
          </div>
          
          <div>
            <label className="kh-text" style={{ display: 'block', marginBottom: '8px', color: '#334155', fontWeight: 500 }}>លេខសម្ងាត់ (Password)</label>
            <input 
              type="password" 
              name="password" 
              required 
              placeholder="••••••••"
              style={{ width: '100%', padding: '12px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '1rem' }}
            />
          </div>

          <button type="submit" disabled={loading} className="kh-text" style={{ 
            backgroundColor: '#2563eb', 
            color: 'white', 
            padding: '12px', 
            borderRadius: '6px', 
            border: 'none', 
            fontSize: '1.1rem', 
            fontWeight: 500,
            cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.7 : 1,
            marginTop: '10px'
          }}>
            {loading ? 'កំពុងចូល...' : 'ចូលប្រើប្រាស់ (Login)'}
          </button>
        </form>
        
        <div className="kh-text" style={{ marginTop: '20px', textAlign: 'center', fontSize: '0.8rem', color: '#94a3b8' }}>
          គណនីសាកល្បង៖ admin@gmail.com | លេខសម្ងាត់៖ admin123
        </div>
      </div>
    </div>
  );
}
