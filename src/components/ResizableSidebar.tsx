'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';

interface SidebarProps {
  companyName: string;
  logoUrl?: string | null;
  t: any;
  role?: string;
}

export default function ResizableSidebar({ companyName, logoUrl, t, role = 'EMPLOYEE' }: SidebarProps) {
  const pathname = usePathname();
  const [width, setWidth] = useState<number>(260);
  const [isCollapsed, setIsCollapsed] = useState<boolean>(false);
  const [isResizing, setIsResizing] = useState<boolean>(false);
  const sidebarRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const savedWidth = localStorage.getItem('hrm_sidebar_width');
    const savedCollapsed = localStorage.getItem('hrm_sidebar_collapsed');
    if (savedWidth) {
      const parsed = parseInt(savedWidth, 10);
      if (!isNaN(parsed) && parsed >= 160 && parsed <= 480) {
        setWidth(parsed);
      }
    }
    if (savedCollapsed === 'true') {
      setIsCollapsed(true);
    }
  }, []);

  const toggleCollapse = () => {
    const nextState = !isCollapsed;
    setIsCollapsed(nextState);
    localStorage.setItem('hrm_sidebar_collapsed', String(nextState));
  };

  const startResizing = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const newWidth = Math.max(160, Math.min(480, moveEvent.clientX));
      setWidth(newWidth);
      if (isCollapsed && newWidth > 180) {
        setIsCollapsed(false);
        localStorage.setItem('hrm_sidebar_collapsed', 'false');
      }
    };

    const handleMouseUp = (upEvent: MouseEvent) => {
      setIsResizing(false);
      const finalWidth = Math.max(160, Math.min(480, upEvent.clientX));
      localStorage.setItem('hrm_sidebar_width', String(finalWidth));
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  const navItems = [
    { href: '/dashboard', icon: '📊', label: t.sidebar.dashboard, roles: ['ADMIN', 'HR', 'EMPLOYEE'] },
    { href: '/dashboard/users', icon: '🔐', label: 'គ្រប់គ្រងគណនី', roles: ['ADMIN'] },
    { href: '/dashboard/employees', icon: '👥', label: t.sidebar.employees, roles: ['ADMIN', 'HR'] },
    { href: '/dashboard/attendance', icon: '📅', label: t.sidebar.attendance, roles: ['ADMIN', 'HR'] },
    { href: '/dashboard/leave', icon: '🌴', label: t.sidebar.leave, roles: ['ADMIN', 'HR', 'EMPLOYEE'] },
    { href: '/dashboard/advance', icon: '💵', label: t.sidebar.advance || 'ប្រាក់បុរេប្រទាន', roles: ['ADMIN', 'HR'] },
    { href: '/dashboard/payroll', icon: '💰', label: t.sidebar.payroll, roles: ['ADMIN', 'HR'] },
    { href: '/dashboard/exports', icon: '📥', label: t.sidebar.exports, roles: ['ADMIN', 'HR'] },
    { href: '/dashboard/kpi', icon: '📈', label: t.sidebar.kpi, roles: ['ADMIN', 'HR'] },
    { href: '/dashboard/documents', icon: '📁', label: t.sidebar.documents || (t.sidebar.dashboard === 'Dashboard' ? 'Documents' : t.sidebar.dashboard === '仪表板' ? '公司文件' : 'ឯកសារក្រុមហ៊ុន'), roles: ['ADMIN', 'HR', 'EMPLOYEE'] },
    { href: '/dashboard/settings', icon: '⚙️', label: t.sidebar.settings, roles: ['ADMIN'] },
    { href: '/dashboard/about', icon: 'ℹ️', label: t.sidebar.about || (t.sidebar.dashboard === 'Dashboard' ? 'About' : t.sidebar.dashboard === '仪表板' ? '关于系统' : 'អំពីប្រព័ន្ធ'), roles: ['ADMIN', 'HR', 'EMPLOYEE'] },
  ].filter(item => item.roles.includes(role));

  const currentWidth = isCollapsed ? 74 : width;

  return (
    <>
      <style jsx>{`
        .sidebar-nav-scroll::-webkit-scrollbar {
          width: 5px;
        }
        .sidebar-nav-scroll::-webkit-scrollbar-track {
          background: transparent;
        }
        .sidebar-nav-scroll::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.15);
          border-radius: 4px;
        }
        .sidebar-nav-scroll::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.3);
        }
        .nav-item-link {
          padding: 12px 14px;
          font-size: 0.95rem;
          font-weight: 500;
          display: flex;
          align-items: center;
          gap: 14px;
          transition: all 0.2s ease;
          border-radius: 12px;
          color: #94a3b8;
          text-decoration: none;
          white-space: nowrap;
          overflow: hidden;
        }
        .nav-item-link:hover {
          background: rgba(255, 255, 255, 0.1);
          color: #ffffff;
        }
        .nav-item-link.active {
          background: linear-gradient(90deg, rgba(99, 102, 241, 0.25) 0%, rgba(59, 130, 246, 0.1) 100%);
          color: #ffffff;
          border-left: 3px solid #60a5fa;
        }
        .resize-handle {
          position: absolute;
          top: 0;
          right: -3px;
          bottom: 0;
          width: 7px;
          cursor: col-resize;
          z-index: 50;
          transition: background-color 0.2s ease;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .resize-handle:hover,
        .resize-handle.active {
          background-color: rgba(59, 130, 246, 0.6);
        }
        .resize-indicator {
          width: 3px;
          height: 36px;
          background-color: rgba(255, 255, 255, 0.3);
          border-radius: 2px;
          opacity: 0;
          transition: opacity 0.2s ease;
        }
        .resize-handle:hover .resize-indicator,
        .resize-handle.active .resize-indicator {
          opacity: 1;
        }
      `}</style>

      <aside
        className="no-print"
        ref={sidebarRef}
        style={{
          width: `${currentWidth}px`,
          minWidth: `${currentWidth}px`,
          maxWidth: `${currentWidth}px`,
          backgroundColor: '#0f172a',
          backgroundImage: 'radial-gradient(circle at 10% 20%, rgba(99, 102, 241, 0.12) 0%, transparent 80%)',
          color: '#f8fafc',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '4px 0 25px rgba(0,0,0,0.2)',
          zIndex: 40,
          position: 'relative',
          transition: isResizing ? 'none' : 'width 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
          userSelect: isResizing ? 'none' : 'auto',
        }}
      >
        {/* Header / Logo Area */}
        <div
          style={{
            padding: isCollapsed ? '20px 10px' : '22px 18px',
            borderBottom: '1px solid rgba(255,255,255,0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: isCollapsed ? 'center' : 'space-between',
            gap: '10px',
            background: 'linear-gradient(180deg, rgba(255,255,255,0.03) 0%, transparent 100%)',
            minHeight: '72px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', overflow: 'hidden' }}>
            {logoUrl ? (
              <div style={{ position: 'relative', width: '32px', height: '32px', flexShrink: 0 }}>
                <Image src={logoUrl} alt="Logo" fill style={{ objectFit: 'contain' }} />
              </div>
            ) : (
              <span className="kh-text" style={{ color: '#60a5fa', fontWeight: 'bold', fontSize: '1.2rem', flexShrink: 0 }}>
                {isCollapsed ? 'HR' : t.sidebar.system}
              </span>
            )}
            {!isCollapsed && (
              <span style={{ fontSize: '0.95rem', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {companyName}
              </span>
            )}
          </div>

          {/* Collapse Toggle Button */}
          <button
            onClick={toggleCollapse}
            title={isCollapsed ? 'ពង្រីក (Expand)' : 'បង្រួម (Collapse)'}
            style={{
              background: 'rgba(255,255,255,0.06)',
              color: '#94a3b8',
              border: 'none',
              borderRadius: '6px',
              width: '26px',
              height: '26px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              flexShrink: 0,
              fontSize: '0.8rem',
              transition: 'all 0.2s ease',
            }}
            onMouseOver={(e) => (e.currentTarget.style.color = '#ffffff')}
            onMouseOut={(e) => (e.currentTarget.style.color = '#94a3b8')}
          >
            {isCollapsed ? '»' : '«'}
          </button>
        </div>

        {/* Navigation Menu (Scrollable with custom scrollbar) */}
        <nav
          className="sidebar-nav-scroll"
          style={{
            display: 'flex',
            flexDirection: 'column',
            padding: isCollapsed ? '16px 8px' : '20px 14px',
            gap: '6px',
            flex: 1,
            overflowY: 'auto',
            overflowX: 'hidden',
          }}
        >
          {navItems.map((item) => {
            const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`nav-item-link ${isActive ? 'active' : ''}`}
                title={isCollapsed ? item.label : undefined}
                style={{
                  justifyContent: isCollapsed ? 'center' : 'flex-start',
                  padding: isCollapsed ? '12px 0' : '12px 14px',
                }}
              >
                <span className="interactive-icon" style={{ fontSize: '1.25rem', flexShrink: 0 }}>{item.icon}</span>
                {!isCollapsed && (
                  <span className="kh-text" style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {item.label}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Footer Area */}
        <div
          style={{
            padding: isCollapsed ? '12px 4px' : '14px 12px',
            borderTop: '1px solid rgba(255,255,255,0.06)',
            fontSize: '0.7rem',
            color: '#64748b',
            textAlign: 'center',
            background: 'rgba(0,0,0,0.15)',
          }}
        >
          {isCollapsed ? (
            <div style={{ fontWeight: 'bold', fontSize: '0.65rem' }}>v1.0</div>
          ) : (
            <>
              <div style={{ marginBottom: '3px', fontWeight: 500 }}>Version 1.0 HRM System</div>
              <div className="kh-text" style={{ fontSize: '0.65rem', opacity: 0.8 }}>រក្សាសិទ្ធិដោយ Mr.Hun Bora</div>
            </>
          )}
        </div>

        {/* DRAG RESIZE HANDLE */}
        {!isCollapsed && (
          <div
            className={`resize-handle ${isResizing ? 'active' : ''}`}
            onMouseDown={startResizing}
            title="អូសដើម្បីពង្រីក ឬបង្រួម (Drag to Resize)"
          >
            <div className="resize-indicator" />
          </div>
        )}
      </aside>
    </>
  );
}
