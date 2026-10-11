'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';

interface SidebarProps {
  companyName: string;
  logoUrl?: string | null;
  t: any;
  role?: string;
}

interface NavItem {
  href: string;
  icon: string;
  label: string;
  subLabel?: string;
  badge?: string;
  roles: string[];
}

interface NavGroup {
  groupTitleKh: string;
  groupTitleEn: string;
  roles: string[];
  items: NavItem[];
}

export default function ResizableSidebar({ companyName, logoUrl, t, role = 'EMPLOYEE' }: SidebarProps) {
  const pathname = usePathname();
  const [width, setWidth] = useState<number>(270);
  const [isCollapsed, setIsCollapsed] = useState<boolean>(false);
  const [isResizing, setIsResizing] = useState<boolean>(false);
  const sidebarRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const savedWidth = localStorage.getItem('hrm_sidebar_width');
    const savedCollapsed = localStorage.getItem('hrm_sidebar_collapsed');
    if (savedWidth) {
      const parsed = parseInt(savedWidth, 10);
      if (!isNaN(parsed) && parsed >= 180 && parsed <= 480) {
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
      const newWidth = Math.max(180, Math.min(480, moveEvent.clientX));
      setWidth(newWidth);
      if (isCollapsed && newWidth > 200) {
        setIsCollapsed(false);
        localStorage.setItem('hrm_sidebar_collapsed', 'false');
      }
    };

    const handleMouseUp = (upEvent: MouseEvent) => {
      setIsResizing(false);
      const finalWidth = Math.max(180, Math.min(480, upEvent.clientX));
      localStorage.setItem('hrm_sidebar_width', String(finalWidth));
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  // Structured Categorical Navigation (Merged & Organized into 6 Enterprise Groups)
  const navGroups: NavGroup[] = [
    {
      groupTitleKh: 'ទូទៅ',
      groupTitleEn: 'General & Portal',
      roles: ['ADMIN', 'HR_MANAGER', 'HR', 'PAYROLL_ADMIN', 'DEPT_HEAD', 'EMPLOYEE'],
      items: [
        {
          href: '/dashboard',
          icon: '📊',
          label: t.sidebar.dashboard || 'ផ្ទាំងគ្រប់គ្រង (Dashboard)',
          roles: ['ADMIN', 'HR_MANAGER', 'HR', 'PAYROLL_ADMIN', 'DEPT_HEAD', 'EMPLOYEE'],
        },
        {
          href: '/dashboard/my-portal',
          icon: '📱',
          label: 'ផតថលបុគ្គលិក (My Portal)',
          roles: ['ADMIN', 'HR_MANAGER', 'HR', 'PAYROLL_ADMIN', 'DEPT_HEAD', 'EMPLOYEE'],
        },
        {
          href: '/dashboard/announcements',
          icon: '📣',
          label: 'សេចក្តីជូនដំណឹង (Announcements)',
          roles: ['ADMIN', 'HR_MANAGER', 'HR', 'PAYROLL_ADMIN', 'DEPT_HEAD', 'EMPLOYEE'],
        },
      ],
    },
    {
      groupTitleKh: 'បុគ្គលិក & ជ្រើសរើស',
      groupTitleEn: 'Workforce & Talent',
      roles: ['ADMIN', 'HR_MANAGER', 'HR'],
      items: [
        {
          href: '/dashboard/employees',
          icon: '👥',
          label: t.sidebar.employees || 'បញ្ជីបុគ្គលិក (Employees)',
          roles: ['ADMIN', 'HR_MANAGER', 'HR'],
        },
        {
          href: '/dashboard/recruitment',
          icon: '📢',
          label: 'ជ្រើសរើសបុគ្គលិក (Recruitment)',
          roles: ['ADMIN', 'HR_MANAGER', 'HR'],
        },
        {
          href: '/dashboard/offboarding',
          icon: '🚪',
          label: 'បញ្ចប់ការងារ & លាលែង (Offboarding)',
          subLabel: 'Offboarding & Resignation',
          roles: ['ADMIN', 'HR_MANAGER', 'HR'],
        },
      ],
    },
    {
      groupTitleKh: 'វត្តមាន & វេនការងារ',
      groupTitleEn: 'Time & Attendance',
      roles: ['ADMIN', 'HR_MANAGER', 'HR', 'PAYROLL_ADMIN', 'DEPT_HEAD', 'EMPLOYEE'],
      items: [
        {
          href: '/dashboard/attendance',
          icon: '📅',
          label: 'វត្តមាន & ស្កេនមេដៃ (Attendance)',
          subLabel: 'Attendance & Biometrics',
          roles: ['ADMIN', 'HR_MANAGER', 'HR', 'PAYROLL_ADMIN', 'DEPT_HEAD'],
        },
        {
          href: '/dashboard/roster',
          icon: '⏱️',
          label: 'កាលវិភាគវេន (Shift Roster)',
          roles: ['ADMIN', 'HR_MANAGER', 'HR', 'PAYROLL_ADMIN', 'DEPT_HEAD', 'EMPLOYEE'],
        },
        {
          href: '/dashboard/leave',
          icon: '🌴',
          label: t.sidebar.leave || 'ច្បាប់ឈប់សម្រាក (Leave)',
          roles: ['ADMIN', 'HR_MANAGER', 'HR', 'DEPT_HEAD', 'EMPLOYEE'],
        },
        {
          href: '/dashboard/overtime',
          icon: '⏰',
          label: 'ស្នើសុំថែមម៉ោង (Overtime)',
          roles: ['ADMIN', 'HR_MANAGER', 'HR', 'PAYROLL_ADMIN', 'DEPT_HEAD', 'EMPLOYEE'],
        },
      ],
    },
    {
      groupTitleKh: 'ប្រាក់បៀវត្សរ៍ & ហិរញ្ញវត្ថុ',
      groupTitleEn: 'Payroll & Finance',
      roles: ['ADMIN', 'HR_MANAGER', 'HR', 'PAYROLL_ADMIN', 'DEPT_HEAD', 'EMPLOYEE'],
      items: [
        {
          href: '/dashboard/payroll',
          icon: '💰',
          label: t.sidebar.payroll || 'តារាងប្រាក់ខែ (Payroll)',
          roles: ['ADMIN', 'PAYROLL_ADMIN'],
        },
        {
          href: '/dashboard/loans',
          icon: '💳',
          label: 'កម្ចី & បុរេប្រទាន (Loans & Advances)',
          roles: ['ADMIN', 'HR_MANAGER', 'HR', 'PAYROLL_ADMIN'],
        },
        {
          href: '/dashboard/expenses',
          icon: '💸',
          label: t.sidebar.expenses || 'ចំណាយ & ការទូទាត់ (Expenses)',
          roles: ['ADMIN', 'HR_MANAGER', 'HR', 'PAYROLL_ADMIN', 'DEPT_HEAD', 'EMPLOYEE'],
        },
        {
          href: '/dashboard/exports',
          icon: '📥',
          label: t.sidebar.exports || 'នាំចេញទិន្នន័យ (Master Exports)',
          roles: ['ADMIN', 'HR_MANAGER', 'HR', 'PAYROLL_ADMIN'],
        },
      ],
    },
    {
      groupTitleKh: 'ការអភិវឌ្ឍន៍ & ប្រតិបត្តិការ',
      groupTitleEn: 'Operations & Performance',
      roles: ['ADMIN', 'HR_MANAGER', 'HR', 'DEPT_HEAD', 'EMPLOYEE'],
      items: [
        {
          href: '/dashboard/performance',
          icon: '🎯',
          label: 'វាយតម្លៃការងារ & KPI (Performance)',
          subLabel: 'Appraisal & KPI Matrix',
          roles: ['ADMIN', 'HR_MANAGER', 'HR', 'DEPT_HEAD'],
        },
        {
          href: '/dashboard/trainings',
          icon: '🎓',
          label: 'វគ្គបណ្តុះបណ្តាល (Training LMS)',
          roles: ['ADMIN', 'HR_MANAGER', 'HR', 'EMPLOYEE'],
        },
        {
          href: '/dashboard/disciplinary',
          icon: '⚖️',
          label: 'វិធានការវិន័យ (Disciplinary)',
          roles: ['ADMIN', 'HR_MANAGER', 'HR'],
        },
        {
          href: '/dashboard/certificates',
          icon: '📜',
          label: 'លិខិតបញ្ជាក់ (Certificates)',
          roles: ['ADMIN', 'HR_MANAGER', 'HR', 'EMPLOYEE'],
        },
        {
          href: '/dashboard/documents',
          icon: '📁',
          label: 'ឯកសារក្រុមហ៊ុន (Documents)',
          roles: ['ADMIN', 'HR_MANAGER', 'HR', 'EMPLOYEE'],
        },
        {
          href: '/dashboard/assets',
          icon: '💻',
          label: 'សម្ភារៈក្រុមហ៊ុន (Company Assets)',
          roles: ['ADMIN', 'HR_MANAGER', 'HR', 'EMPLOYEE'],
        },
      ],
    },
    {
      groupTitleKh: 'ការគ្រប់គ្រងប្រព័ន្ធ',
      groupTitleEn: 'System Administration',
      roles: ['ADMIN', 'HR_MANAGER', 'HR', 'PAYROLL_ADMIN', 'DEPT_HEAD', 'EMPLOYEE'],
      items: [
        {
          href: '/dashboard/users',
          icon: '🔐',
          label: 'គ្រប់គ្រងគណនី (Users & Roles)',
          roles: ['ADMIN'],
        },
        {
          href: '/dashboard/audit',
          icon: '🛡️',
          label: 'កំណត់ត្រាសវនកម្ម (Audit Trail)',
          roles: ['ADMIN'],
        },
        {
          href: '/dashboard/settings',
          icon: '⚙️',
          label: t.sidebar.settings || 'ការកំណត់ប្រព័ន្ធ (Settings)',
          roles: ['ADMIN'],
        },
        {
          href: '/dashboard/about',
          icon: 'ℹ️',
          label: 'អំពីប្រព័ន្ធ (About HRM)',
          roles: ['ADMIN', 'HR_MANAGER', 'HR', 'PAYROLL_ADMIN', 'DEPT_HEAD', 'EMPLOYEE'],
        },
      ],
    },
  ];

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
          padding: 9px 12px;
          font-size: 0.88rem;
          font-weight: 500;
          display: flex;
          align-items: center;
          gap: 12px;
          transition: all 0.18s ease;
          border-radius: 10px;
          color: #94a3b8;
          text-decoration: none;
          white-space: nowrap;
          overflow: hidden;
        }
        .nav-item-link:hover {
          background: rgba(255, 255, 255, 0.08);
          color: #ffffff;
          transform: translateX(2px);
        }
        .nav-item-link.active {
          background: linear-gradient(90deg, rgba(59, 130, 246, 0.22) 0%, rgba(37, 99, 235, 0.12) 100%);
          color: #ffffff;
          font-weight: 700;
          border-left: 3px solid #60a5fa;
        }
        .group-header {
          padding: 10px 12px 4px 12px;
          font-size: 0.68rem;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: #64748b;
          display: flex;
          align-items: center;
          justify-content: space-between;
          border-bottom: 1px dashed rgba(255, 255, 255, 0.06);
          margin-bottom: 4px;
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
            padding: isCollapsed ? '20px 10px' : '20px 16px',
            borderBottom: '1px solid rgba(255,255,255,0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: isCollapsed ? 'center' : 'space-between',
            gap: '10px',
            background: 'linear-gradient(180deg, rgba(255,255,255,0.03) 0%, transparent 100%)',
            minHeight: '68px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', overflow: 'hidden' }}>
            {logoUrl ? (
              <div style={{ position: 'relative', width: '32px', height: '32px', flexShrink: 0 }}>
                <Image src={logoUrl} alt="Logo" fill style={{ objectFit: 'contain' }} />
              </div>
            ) : (
              <span className="kh-text" style={{ color: '#60a5fa', fontWeight: 'bold', fontSize: '1.2rem', flexShrink: 0 }}>
                {isCollapsed ? 'HR' : (t.sidebar.system || 'HRM System')}
              </span>
            )}
            {!isCollapsed && (
              <span style={{ fontSize: '0.92rem', fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
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

        {/* Navigation Menu (Grouped & Scrollable) */}
        <nav
          className="sidebar-nav-scroll"
          style={{
            display: 'flex',
            flexDirection: 'column',
            padding: isCollapsed ? '12px 6px' : '14px 10px',
            gap: isCollapsed ? '4px' : '10px',
            flex: 1,
            overflowY: 'auto',
            overflowX: 'hidden',
          }}
        >
          {navGroups.map((group, groupIdx) => {
            // Filter items by role
            const visibleItems = group.items.filter((item) => item.roles.includes(role));
            if (visibleItems.length === 0) return null;

            return (
              <div key={groupIdx} style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                {/* Group Category Header (Hidden on collapse) */}
                {!isCollapsed && (
                  <div className="group-header">
                    <span>{group.groupTitleKh}</span>
                    <span style={{ fontSize: '0.62rem', opacity: 0.65, fontWeight: 500 }}>{group.groupTitleEn}</span>
                  </div>
                )}

                {/* Group Items */}
                {visibleItems.map((item) => {
                  const isActive =
                    pathname === item.href ||
                    (item.href !== '/dashboard' && pathname.startsWith(item.href));

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`nav-item-link ${isActive ? 'active' : ''}`}
                      title={isCollapsed ? item.label : undefined}
                      style={{
                        justifyContent: isCollapsed ? 'center' : 'flex-start',
                        padding: isCollapsed ? '10px 0' : '9px 12px',
                      }}
                    >
                      <span className="interactive-icon" style={{ fontSize: '1.2rem', flexShrink: 0 }}>
                        {item.icon}
                      </span>
                      {!isCollapsed && (
                        <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden', lineHeight: 1.25 }}>
                          <span className="kh-text" style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {item.label}
                          </span>
                        </div>
                      )}
                    </Link>
                  );
                })}
              </div>
            );
          })}
        </nav>

        {/* Footer Area */}
        <div
          style={{
            padding: isCollapsed ? '12px 4px' : '12px 10px',
            borderTop: '1px solid rgba(255,255,255,0.06)',
            fontSize: '0.7rem',
            color: '#64748b',
            textAlign: 'center',
            background: 'rgba(0,0,0,0.18)',
          }}
        >
          {isCollapsed ? (
            <div style={{ fontWeight: 'bold', fontSize: '0.65rem' }}>v1.0</div>
          ) : (
            <>
              <div style={{ marginBottom: '2px', fontWeight: 600 }}>Version 1.0 • HRM Enterprise</div>
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
