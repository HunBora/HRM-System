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

interface SubMenuItem {
  href: string;
  labelKh: string;
  labelEn: string;
  icon: string;
  roles: string[];
}

interface MenuGroup {
  id: string;
  titleKh: string;
  titleEn: string;
  icon: string;
  primaryHref?: string; // If single direct link
  roles: string[];
  items?: SubMenuItem[]; // If multi-item dropdown/accordion
}

export default function ResizableSidebar({ companyName, logoUrl, t, role = 'EMPLOYEE' }: SidebarProps) {
  const pathname = usePathname();
  const [width, setWidth] = useState<number>(275);
  const [isCollapsed, setIsCollapsed] = useState<boolean>(false);
  const [isResizing, setIsResizing] = useState<boolean>(false);
  const sidebarRef = useRef<HTMLElement>(null);

  // Accordion open/close state for collapsed/expanded folders
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({
    portal: true,
    workforce: true,
    time: true,
    finance: true,
    operations: false,
    admin: false,
  });

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

  const toggleGroup = (groupId: string) => {
    setOpenGroups((prev) => ({
      ...prev,
      [groupId]: !prev[groupId],
    }));
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

  // 6 Clean Collapsible / Dropdown Enterprise Groups
  const menuGroups: MenuGroup[] = [
    {
      id: 'general',
      titleKh: 'ផ្ទាំងគ្រប់គ្រងទូទៅ',
      titleEn: 'General & Portal',
      icon: '📊',
      roles: ['ADMIN', 'HR_MANAGER', 'HR', 'PAYROLL_ADMIN', 'DEPT_HEAD', 'EMPLOYEE'],
      items: [
        {
          href: '/dashboard',
          icon: '📊',
          labelKh: 'ផ្ទាំងគ្រប់គ្រង',
          labelEn: 'Dashboard',
          roles: ['ADMIN', 'HR_MANAGER', 'HR', 'PAYROLL_ADMIN', 'DEPT_HEAD', 'EMPLOYEE'],
        },
        {
          href: '/dashboard/my-portal',
          icon: '📱',
          labelKh: 'ផតថលបុគ្គលិក',
          labelEn: 'My Portal',
          roles: ['ADMIN', 'HR_MANAGER', 'HR', 'PAYROLL_ADMIN', 'DEPT_HEAD', 'EMPLOYEE'],
        },
        {
          href: '/dashboard/announcements',
          icon: '📣',
          labelKh: 'សេចក្តីជូនដំណឹង',
          labelEn: 'Announcements',
          roles: ['ADMIN', 'HR_MANAGER', 'HR', 'PAYROLL_ADMIN', 'DEPT_HEAD', 'EMPLOYEE'],
        },
      ],
    },
    {
      id: 'workforce',
      titleKh: 'បុគ្គលិក & ជ្រើសរើស',
      titleEn: 'Employees & Talent',
      icon: '👥',
      roles: ['ADMIN', 'HR_MANAGER', 'HR'],
      items: [
        {
          href: '/dashboard/employees',
          icon: '👥',
          labelKh: 'បញ្ជីបុគ្គលិក',
          labelEn: 'Employee Master',
          roles: ['ADMIN', 'HR_MANAGER', 'HR'],
        },
        {
          href: '/dashboard/recruitment',
          icon: '📢',
          labelKh: 'ជ្រើសរើសបុគ្គលិក',
          labelEn: 'Recruitment & ATS',
          roles: ['ADMIN', 'HR_MANAGER', 'HR'],
        },
        {
          href: '/dashboard/offboarding',
          icon: '🚪',
          labelKh: 'បញ្ចប់ការងារ & ទូទាត់',
          labelEn: 'Offboarding & Settlement',
          roles: ['ADMIN', 'HR_MANAGER', 'HR'],
        },
        {
          href: '/dashboard/resignation',
          icon: '📝',
          labelKh: 'លាលែង & សម្ភាសន៍',
          labelEn: 'Resignation & Clearance',
          roles: ['ADMIN', 'HR_MANAGER', 'HR'],
        },
      ],
    },
    {
      id: 'time',
      titleKh: 'វត្តមាន & វេនការងារ',
      titleEn: 'Time & Attendance',
      icon: '📅',
      roles: ['ADMIN', 'HR_MANAGER', 'HR', 'PAYROLL_ADMIN', 'DEPT_HEAD', 'EMPLOYEE'],
      items: [
        {
          href: '/dashboard/attendance',
          icon: '📅',
          labelKh: 'តារាងវត្តមានប្រចាំខែ',
          labelEn: 'Attendance Timesheet',
          roles: ['ADMIN', 'HR_MANAGER', 'HR', 'PAYROLL_ADMIN', 'DEPT_HEAD'],
        },
        {
          href: '/dashboard/biometric',
          icon: '📲',
          labelKh: 'ម៉ាស៊ីនស្កេនមេដៃ',
          labelEn: 'Biometric Terminals',
          roles: ['ADMIN', 'HR_MANAGER', 'HR', 'PAYROLL_ADMIN'],
        },
        {
          href: '/dashboard/roster',
          icon: '⏱️',
          labelKh: 'កាលវិភាគវេនការងារ',
          labelEn: 'Shift Rostering',
          roles: ['ADMIN', 'HR_MANAGER', 'HR', 'PAYROLL_ADMIN', 'DEPT_HEAD', 'EMPLOYEE'],
        },
        {
          href: '/dashboard/leave',
          icon: '🌴',
          labelKh: 'ច្បាប់ឈប់សម្រាក',
          labelEn: 'Leave Management',
          roles: ['ADMIN', 'HR_MANAGER', 'HR', 'DEPT_HEAD', 'EMPLOYEE'],
        },
        {
          href: '/dashboard/overtime',
          icon: '⏰',
          labelKh: 'ស្នើសុំថែមម៉ោង (OT)',
          labelEn: 'Overtime Requests',
          roles: ['ADMIN', 'HR_MANAGER', 'HR', 'PAYROLL_ADMIN', 'DEPT_HEAD', 'EMPLOYEE'],
        },
      ],
    },
    {
      id: 'finance',
      titleKh: 'ប្រាក់ខែ & ហិរញ្ញវត្ថុ',
      titleEn: 'Payroll & Loans',
      icon: '💰',
      roles: ['ADMIN', 'HR_MANAGER', 'HR', 'PAYROLL_ADMIN', 'DEPT_HEAD', 'EMPLOYEE'],
      items: [
        {
          href: '/dashboard/payroll',
          icon: '💰',
          labelKh: 'តារាងប្រាក់ខែបុគ្គលិក',
          labelEn: 'Payroll Management',
          roles: ['ADMIN', 'PAYROLL_ADMIN'],
        },
        {
          href: '/dashboard/loans',
          icon: '💳',
          labelKh: 'ប្រាក់កម្ចីបុគ្គលិក',
          labelEn: 'Employee Loans',
          roles: ['ADMIN', 'HR_MANAGER', 'HR', 'PAYROLL_ADMIN'],
        },
        {
          href: '/dashboard/advance',
          icon: '💵',
          labelKh: 'ប្រាក់បុរេប្រទាន',
          labelEn: 'Salary Advance',
          roles: ['ADMIN', 'PAYROLL_ADMIN'],
        },
        {
          href: '/dashboard/expenses',
          icon: '💸',
          labelKh: 'ចំណាយ & បង្វែរសង',
          labelEn: 'Expense Claims',
          roles: ['ADMIN', 'HR_MANAGER', 'HR', 'PAYROLL_ADMIN', 'DEPT_HEAD', 'EMPLOYEE'],
        },
        {
          href: '/dashboard/exports',
          icon: '📥',
          labelKh: 'ទាញយករបាយការណ៍សរុប',
          labelEn: 'Master Excel Exports',
          roles: ['ADMIN', 'HR_MANAGER', 'HR', 'PAYROLL_ADMIN'],
        },
      ],
    },
    {
      id: 'operations',
      titleKh: 'ការវាយតម្លៃ & ប្រតិបត្តិការ',
      titleEn: 'Performance & Ops',
      icon: '🎯',
      roles: ['ADMIN', 'HR_MANAGER', 'HR', 'DEPT_HEAD', 'EMPLOYEE'],
      items: [
        {
          href: '/dashboard/performance',
          icon: '🎯',
          labelKh: 'វាយតម្លៃការងារបុគ្គលិក',
          labelEn: 'Performance Appraisal',
          roles: ['ADMIN', 'HR_MANAGER', 'HR', 'DEPT_HEAD'],
        },
        {
          href: '/dashboard/kpi',
          icon: '📈',
          labelKh: 'ផែនការ KPI តាមផ្នែក',
          labelEn: 'Department KPIs',
          roles: ['ADMIN', 'HR_MANAGER', 'HR', 'DEPT_HEAD'],
        },
        {
          href: '/dashboard/trainings',
          icon: '🎓',
          labelKh: 'វគ្គបណ្តុះបណ្តាល',
          labelEn: 'Training LMS',
          roles: ['ADMIN', 'HR_MANAGER', 'HR', 'EMPLOYEE'],
        },
        {
          href: '/dashboard/disciplinary',
          icon: '⚖️',
          labelKh: 'វិធានការវិន័យ & ព្រមាន',
          labelEn: 'Disciplinary Actions',
          roles: ['ADMIN', 'HR_MANAGER', 'HR'],
        },
        {
          href: '/dashboard/certificates',
          icon: '📜',
          labelKh: 'លិខិតបញ្ជាក់ការងារ/ប្រាក់ខែ',
          labelEn: 'Official Certificates',
          roles: ['ADMIN', 'HR_MANAGER', 'HR', 'EMPLOYEE'],
        },
        {
          href: '/dashboard/documents',
          icon: '📁',
          labelKh: 'ឯកសារគោលការណ៍ក្រុមហ៊ុន',
          labelEn: 'Company Policies',
          roles: ['ADMIN', 'HR_MANAGER', 'HR', 'EMPLOYEE'],
        },
        {
          href: '/dashboard/assets',
          icon: '💻',
          labelKh: 'សម្ភារៈ & ឧបករណ៍ក្រុមហ៊ុន',
          labelEn: 'Asset Inventory',
          roles: ['ADMIN', 'HR_MANAGER', 'HR', 'EMPLOYEE'],
        },
      ],
    },
    {
      id: 'admin',
      titleKh: 'ការគ្រប់គ្រងប្រព័ន្ធ',
      titleEn: 'Administration',
      icon: '⚙️',
      roles: ['ADMIN', 'HR_MANAGER', 'HR', 'PAYROLL_ADMIN', 'DEPT_HEAD', 'EMPLOYEE'],
      items: [
        {
          href: '/dashboard/users',
          icon: '🔐',
          labelKh: 'គ្រប់គ្រងគណនីប្រើប្រាស់',
          labelEn: 'User Accounts & Roles',
          roles: ['ADMIN'],
        },
        {
          href: '/dashboard/audit',
          icon: '🛡️',
          labelKh: 'កំណត់ត្រាសវនកម្មសុវត្ថិភាព',
          labelEn: 'System Audit Logs',
          roles: ['ADMIN'],
        },
        {
          href: '/dashboard/settings',
          icon: '⚙️',
          labelKh: 'ការកំណត់ទូទៅ & Telegram',
          labelEn: 'System & Bot Settings',
          roles: ['ADMIN'],
        },
        {
          href: '/dashboard/about',
          icon: 'ℹ️',
          labelKh: 'អំពីប្រព័ន្ធ HRM',
          labelEn: 'About System & Version',
          roles: ['ADMIN', 'HR_MANAGER', 'HR', 'PAYROLL_ADMIN', 'DEPT_HEAD', 'EMPLOYEE'],
        },
      ],
    },
  ];

  const currentWidth = isCollapsed ? 74 : width;

  // Auto-expand group if current URL matches an item inside it
  useEffect(() => {
    menuGroups.forEach((group) => {
      if (group.items) {
        const hasActive = group.items.some(
          (item) => pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href))
        );
        if (hasActive) {
          setOpenGroups((prev) => ({ ...prev, [group.id]: true }));
        }
      }
    });
  }, [pathname]);

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
        .group-card {
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.06);
          border-radius: 12px;
          overflow: hidden;
          transition: all 0.2s ease;
        }
        .group-card:hover {
          border-color: rgba(96, 165, 250, 0.25);
          background: rgba(255, 255, 255, 0.04);
        }
        .group-trigger {
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 10px 12px;
          background: transparent;
          border: none;
          color: #e2e8f0;
          cursor: pointer;
          font-weight: 700;
          font-size: 0.88rem;
          transition: background 0.15s ease;
          outline: none;
        }
        .group-trigger:hover {
          background: rgba(255, 255, 255, 0.06);
          color: #ffffff;
        }
        .sub-item-link {
          padding: 8px 12px 8px 34px;
          font-size: 0.82rem;
          display: flex;
          align-items: center;
          gap: 10px;
          transition: all 0.15s ease;
          color: #94a3b8;
          text-decoration: none;
          white-space: nowrap;
          overflow: hidden;
          position: relative;
        }
        .sub-item-link::before {
          content: '';
          position: absolute;
          left: 18px;
          top: 50%;
          width: 5px;
          height: 5px;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.2);
          transform: translateY(-50%);
          transition: all 0.15s ease;
        }
        .sub-item-link:hover {
          color: #ffffff;
          background: rgba(255, 255, 255, 0.06);
        }
        .sub-item-link:hover::before {
          background: #60a5fa;
          transform: translateY(-50%) scale(1.3);
        }
        .sub-item-link.active {
          color: #60a5fa;
          background: rgba(59, 130, 246, 0.15);
          font-weight: 700;
        }
        .sub-item-link.active::before {
          background: #60a5fa;
          box-shadow: 0 0 8px #60a5fa;
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
          backgroundColor: '#0b1329',
          backgroundImage: 'radial-gradient(circle at 10% 15%, rgba(59, 130, 246, 0.14) 0%, transparent 70%)',
          color: '#f8fafc',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '4px 0 25px rgba(0,0,0,0.35)',
          zIndex: 40,
          position: 'relative',
          transition: isResizing ? 'none' : 'width 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
          userSelect: isResizing ? 'none' : 'auto',
          borderRight: '1px solid rgba(255, 255, 255, 0.08)',
        }}
      >
        {/* Header / Logo Area */}
        <div
          style={{
            padding: isCollapsed ? '18px 8px' : '18px 16px',
            borderBottom: '1px solid rgba(255,255,255,0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: isCollapsed ? 'center' : 'space-between',
            gap: '10px',
            background: 'linear-gradient(180deg, rgba(255,255,255,0.04) 0%, transparent 100%)',
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
              <span style={{ fontSize: '0.92rem', fontWeight: 800, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: '#f1f5f9' }}>
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

        {/* Navigation Menu (Scrollable Accordion Cards) */}
        <nav
          className="sidebar-nav-scroll"
          style={{
            display: 'flex',
            flexDirection: 'column',
            padding: isCollapsed ? '12px 6px' : '14px 10px',
            gap: isCollapsed ? '6px' : '8px',
            flex: 1,
            overflowY: 'auto',
            overflowX: 'hidden',
          }}
        >
          {menuGroups.map((group) => {
            // Check roles
            if (!group.roles.includes(role)) return null;

            const visibleItems = (group.items || []).filter((item) => item.roles.includes(role));
            if (visibleItems.length === 0) return null;

            const isGroupOpen = Boolean(openGroups[group.id]);
            const hasActiveChild = visibleItems.some(
              (item) => pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href))
            );

            // Collapsed icon-only mode
            if (isCollapsed) {
              return (
                <div key={group.id} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  {visibleItems.map((item) => {
                    const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        title={`${item.labelKh} (${item.labelEn})`}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          padding: '10px 0',
                          borderRadius: '8px',
                          textDecoration: 'none',
                          color: isActive ? '#60a5fa' : '#94a3b8',
                          background: isActive ? 'rgba(59, 130, 246, 0.2)' : 'transparent',
                          fontSize: '1.2rem',
                          transition: 'all 0.15s ease',
                        }}
                      >
                        <span>{item.icon}</span>
                      </Link>
                    );
                  })}
                </div>
              );
            }

            // Expanded Mode: Real Foldable Accordion Card Group
            return (
              <div
                key={group.id}
                className="group-card"
                style={{
                  borderColor: hasActiveChild ? 'rgba(96, 165, 250, 0.35)' : 'rgba(255, 255, 255, 0.06)',
                  background: hasActiveChild ? 'rgba(30, 41, 59, 0.45)' : 'rgba(255, 255, 255, 0.02)',
                }}
              >
                {/* Accordion Trigger Header */}
                <button
                  type="button"
                  onClick={() => toggleGroup(group.id)}
                  className="group-trigger"
                  style={{
                    color: hasActiveChild ? '#ffffff' : '#cbd5e1',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '9px' }}>
                    <span style={{ fontSize: '1.1rem' }}>{group.icon}</span>
                    <div style={{ display: 'flex', flexDirection: 'column', textAlign: 'left', lineHeight: 1.2 }}>
                      <span className="kh-text" style={{ fontSize: '0.85rem', fontWeight: 700 }}>
                        {group.titleKh}
                      </span>
                      <span style={{ fontSize: '0.66rem', color: '#64748b', fontWeight: 600 }}>
                        {group.titleEn}
                      </span>
                    </div>
                  </div>

                  <span
                    style={{
                      fontSize: '0.72rem',
                      color: '#64748b',
                      transform: isGroupOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                      transition: 'transform 0.2s ease',
                    }}
                  >
                    ▼
                  </span>
                </button>

                {/* Sub Menu Links (Collapsible Body) */}
                {isGroupOpen && (
                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      padding: '2px 0 6px 0',
                      borderTop: '1px solid rgba(255, 255, 255, 0.04)',
                    }}
                  >
                    {visibleItems.map((item) => {
                      const isActive =
                        pathname === item.href ||
                        (item.href !== '/dashboard' && pathname.startsWith(item.href));

                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          className={`sub-item-link ${isActive ? 'active' : ''}`}
                        >
                          <span style={{ fontSize: '0.92rem' }}>{item.icon}</span>
                          <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.25, overflow: 'hidden' }}>
                            <span className="kh-text" style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {item.labelKh}
                            </span>
                            <span style={{ fontSize: '0.64rem', opacity: 0.65 }}>
                              {item.labelEn}
                            </span>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        {/* Footer Area */}
        <div
          style={{
            padding: isCollapsed ? '12px 4px' : '12px 10px',
            borderTop: '1px solid rgba(255, 255, 255, 0.06)',
            fontSize: '0.7rem',
            color: '#64748b',
            textAlign: 'center',
            background: 'rgba(0,0,0,0.22)',
          }}
        >
          {isCollapsed ? (
            <div style={{ fontWeight: 'bold', fontSize: '0.65rem' }}>v1.0</div>
          ) : (
            <>
              <div style={{ marginBottom: '2px', fontWeight: 700, color: '#94a3b8' }}>HRM Enterprise Portal</div>
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
