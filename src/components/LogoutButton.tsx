'use client';

import { logout } from '@/app/login/actions';

export default function LogoutButton() {
  return (
    <button 
      onClick={() => logout()} 
      className="kh-text" 
      style={{ 
        backgroundColor: '#ef4444', 
        color: 'white', 
        border: 'none', 
        padding: '5px 12px', 
        borderRadius: '4px', 
        cursor: 'pointer',
        fontSize: '0.85rem',
        fontWeight: 'bold'
      }}
    >
      ចាកចេញ (Logout)
    </button>
  );
}
