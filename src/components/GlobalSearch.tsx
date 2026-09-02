'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

type SearchResult = {
  id: string;
  employeeId: string;
  firstNameEn: string | null;
  lastNameEn: string | null;
  firstNameKh: string | null;
  lastNameKh: string | null;
  department: string;
  photoUrl: string | null;
};

export default function GlobalSearch() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Keyboard shortcut Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        const input = document.getElementById('global-search-input');
        if (input) input.focus();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (query.trim().length >= 1) {
        fetchResults(query);
      } else {
        setResults([]);
        setIsOpen(false);
      }
    }, 300); // debounce

    return () => clearTimeout(timer);
  }, [query]);

  const fetchResults = async (q: string) => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
      const data = await res.json();
      setResults(data.employees || []);
      setIsOpen(true);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelect = (empId: string) => {
    setIsOpen(false);
    setQuery('');
    router.push(`/dashboard/employees/${empId}`);
  };

  return (
    <div ref={wrapperRef} style={{ position: 'relative', width: '300px', zIndex: 50 }}>
      <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
        <svg 
          style={{ position: 'absolute', left: '12px', color: '#94a3b8' }} 
          width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
        >
          <circle cx="11" cy="11" r="8"></circle>
          <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
        </svg>
        
        <input 
          id="global-search-input"
          type="text" 
          placeholder="ស្វែងរកបុគ្គលិក (Search)..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => query.trim().length >= 1 && setIsOpen(true)}
          className="kh-text"
          style={{ 
            width: '100%', 
            padding: '10px 10px 10px 38px', 
            borderRadius: '8px', 
            border: '1px solid #cbd5e1',
            backgroundColor: '#f8fafc',
            outline: 'none',
            fontSize: '0.95rem',
            transition: 'all 0.2s'
          }}
          onFocusCapture={(e) => {
             e.target.style.backgroundColor = '#fff';
             e.target.style.borderColor = '#3b82f6';
             e.target.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)';
          }}
          onBlurCapture={(e) => {
             if(!query) {
                e.target.style.backgroundColor = '#f8fafc';
                e.target.style.borderColor = '#cbd5e1';
                e.target.style.boxShadow = 'none';
             }
          }}
        />
        
        <div style={{ position: 'absolute', right: '12px', display: 'flex', alignItems: 'center', gap: '4px', pointerEvents: 'none' }}>
           <span style={{ fontSize: '0.7rem', fontWeight: 600, color: '#94a3b8', backgroundColor: '#e2e8f0', padding: '2px 6px', borderRadius: '4px' }}>Ctrl</span>
           <span style={{ fontSize: '0.7rem', fontWeight: 600, color: '#94a3b8', backgroundColor: '#e2e8f0', padding: '2px 6px', borderRadius: '4px' }}>K</span>
        </div>
      </div>

      {isOpen && (
        <div style={{ 
          position: 'absolute', 
          top: '100%', 
          left: 0, 
          right: 0, 
          marginTop: '8px', 
          backgroundColor: '#fff', 
          borderRadius: '12px', 
          boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
          border: '1px solid #e2e8f0',
          maxHeight: '400px',
          overflowY: 'auto',
          padding: '8px',
          display: 'flex',
          flexDirection: 'column',
          gap: '4px'
        }}>
          {isLoading ? (
            <div style={{ padding: '15px', textAlign: 'center', color: '#64748b', fontSize: '0.9rem' }}>
              កំពុងស្វែងរក... (Searching)
            </div>
          ) : results.length > 0 ? (
            <>
              <div style={{ padding: '4px 8px', fontSize: '0.75rem', fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase' }}>
                លទ្ធផលបុគ្គលិក (Employees)
              </div>
              {results.map(emp => (
                <div 
                  key={emp.id} 
                  onClick={() => handleSelect(emp.id)}
                  style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '12px', 
                    padding: '8px', 
                    borderRadius: '8px',
                    cursor: 'pointer',
                    transition: 'background-color 0.1s'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f1f5f9'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  <div style={{ 
                    width: '36px', 
                    height: '36px', 
                    borderRadius: '50%', 
                    backgroundColor: '#e2e8f0',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 'bold',
                    color: '#475569',
                    overflow: 'hidden'
                  }}>
                    {emp.photoUrl ? (
                      <img src={emp.photoUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      (emp.lastNameEn?.[0] || '') + (emp.firstNameEn?.[0] || '')
                    )}
                  </div>
                  <div>
                    <div style={{ fontWeight: 600, color: '#1e293b', fontSize: '0.95rem' }} className="kh-text">
                      {emp.lastNameKh} {emp.firstNameKh} <span style={{ color: '#64748b', fontSize: '0.85rem', fontWeight: 'normal' }}>({emp.firstNameEn} {emp.lastNameEn})</span>
                    </div>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginTop: '2px' }}>
                      <span style={{ fontSize: '0.75rem', color: '#64748b', backgroundColor: '#f1f5f9', padding: '2px 6px', borderRadius: '4px' }}>
                        ID: {emp.employeeId}
                      </span>
                      <span style={{ fontSize: '0.75rem', color: '#0ea5e9', backgroundColor: '#e0f2fe', padding: '2px 6px', borderRadius: '4px', fontWeight: 500 }}>
                        {emp.department}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </>
          ) : (
            <div style={{ padding: '20px', textAlign: 'center', color: '#64748b', fontSize: '0.9rem' }}>
              មិនមានទិន្នន័យសម្រាប់ស្វែងរកនេះទេ!
            </div>
          )}
        </div>
      )}
    </div>
  );
}
