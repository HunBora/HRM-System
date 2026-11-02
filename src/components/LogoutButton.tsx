'use client';

import { logout } from '@/app/login/actions';

export default function LogoutButton() {
  return (
    <button 
      onClick={() => logout()} 
      className="kh-text" 
      title="ចាកចេញពីប្រព័ន្ធ (Logout)"
      style={{ 
        backgroundColor: '#ef4444', 
        color: 'white', 
        border: 'none', 
        padding: '2px 8px', 
        borderRadius: '6px', 
        cursor: 'pointer',
        fontSize: '0.76rem',
        fontWeight: 700,
        height: '26px',
        display: 'inline-flex',
        alignItems: 'center',
        gap: '4px',
        boxSizing: 'border-box',
        transition: 'all 0.15s ease',
      }}
      onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#dc2626'; }}
      onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#ef4444'; }}
      onMouseDown={(e) => { e.currentTarget.style.transform = 'scale(0.96)'; }}
      onMouseUp={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
    >
      <span>🚪</span>
      <span>ចាកចេញ</span>
    </button>
  );
}
