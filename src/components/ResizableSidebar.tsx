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

  const [isBackupLoading, setIsBackupLoading] = useState<boolean>(false);
  const [isRestoreModalOpen, setIsRestoreModalOpen] = useState<boolean>(false);
  const [restoreStatus, setRestoreStatus] = useState<{ loading: boolean; message: string; success?: boolean } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDownloadBackup = async () => {
    try {
      setIsBackupLoading(true);
      const res = await fetch('/api/database/backup');
      if (!res.ok) throw new Error('Failed to generate backup');
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `hrm_full_backup_${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err: any) {
      alert('កំហុសក្នុងការ Backup: ' + err.message);
    } finally {
      setIsBackupLoading(false);
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!confirm(`តើលោកអ្នកពិតជាចង់ Restore ទិន្នន័យពី File "${file.name}" នេះមែនទេ?`)) {
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    try {
      setRestoreStatus({ loading: true, message: 'កំពុងអាន File និង Restore ចូល Database...' });
      const text = await file.text();
      const json = JSON.parse(text);

      const res = await fetch('/api/database/restore', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(json),
      });

      const result = await res.json();
      if (!res.ok || !result.success) {
        throw new Error(result.error || 'Restore failed');
      }

      setRestoreStatus({
        loading: false,
        success: true,
        message: `ជោគជ័យ! បាន Restore បុគ្គលិក ${result.counts?.employees || 0} នាក់ និងទិន្នន័យពាក់ព័ន្ធទាំងអស់។`,
      });
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (err: any) {
      setRestoreStatus({
        loading: false,
        success: false,
        message: 'Restore បរាជ័យ: ' + err.message,
      });
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

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

  // 6 Refined Enterprise Folders with Distinct Symbols & Color Accents
  interface MenuGroupWithAccent extends MenuGroup {
    badgeColor: string;
    bgGlow: string;
    itemCount?: number;
  }

  const menuGroups: MenuGroupWithAccent[] = [
    {
      id: 'general',
      titleKh: 'មជ្ឈមណ្ឌលទូទៅ',
      titleEn: 'General Hub',
      icon: '🏢',
      badgeColor: '#3b82f6',
      bgGlow: 'rgba(59, 130, 246, 0.28)',
      roles: ['ADMIN', 'HR_MANAGER', 'HR', 'PAYROLL_ADMIN', 'DEPT_HEAD', 'EMPLOYEE'],
      items: [
        {
          href: '/dashboard',
          icon: '📊',
          labelKh: 'ផ្ទាំងគ្រប់គ្រងមេ',
          labelEn: 'Main Dashboard',
          roles: ['ADMIN', 'HR_MANAGER', 'HR', 'PAYROLL_ADMIN', 'DEPT_HEAD', 'EMPLOYEE'],
        },
        {
          href: '/dashboard/my-portal',
          icon: '📱',
          labelKh: 'ផតថលស្វ័យសេវាបុគ្គលិក',
          labelEn: 'Employee Self-Service',
          roles: ['ADMIN', 'HR_MANAGER', 'HR', 'PAYROLL_ADMIN', 'DEPT_HEAD', 'EMPLOYEE'],
        },
        {
          href: '/dashboard/announcements',
          icon: '📣',
          labelKh: 'សេចក្តីជូនដំណឹងក្រុមហ៊ុន',
          labelEn: 'Company News & Notices',
          roles: ['ADMIN', 'HR_MANAGER', 'HR', 'PAYROLL_ADMIN', 'DEPT_HEAD', 'EMPLOYEE'],
        },
      ],
    },
    {
      id: 'workforce',
      titleKh: 'គ្រប់គ្រងកម្លាំងពលកម្ម',
      titleEn: 'Workforce Hub',
      icon: '👥',
      badgeColor: '#6366f1',
      bgGlow: 'rgba(99, 102, 241, 0.28)',
      roles: ['ADMIN', 'HR_MANAGER', 'HR'],
      items: [
        {
          href: '/dashboard/employees',
          icon: '📋',
          labelKh: 'បញ្ជីបុគ្គលិកមេ',
          labelEn: 'Employee Directory',
          roles: ['ADMIN', 'HR_MANAGER', 'HR'],
        },
        {
          href: '/dashboard/recruitment',
          icon: '📢',
          labelKh: 'ជ្រើសរើសបុគ្គលិក & ATS',
          labelEn: 'Recruitment & Candidates',
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
          labelKh: 'លាលែង & សម្ភាសន៍ចាកចេញ',
          labelEn: 'Resignation & Clearance',
          roles: ['ADMIN', 'HR_MANAGER', 'HR'],
        },
      ],
    },
    {
      id: 'time',
      titleKh: 'វត្តមាន & កាលវិភាគ',
      titleEn: 'Time & Shifts',
      icon: '⏱️',
      badgeColor: '#0284c7',
      bgGlow: 'rgba(2, 132, 199, 0.28)',
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
          labelKh: 'ម៉ាស៊ីនស្កេនមេដៃផ្ទាល់',
          labelEn: 'Biometric Terminals',
          roles: ['ADMIN', 'HR_MANAGER', 'HR', 'PAYROLL_ADMIN'],
        },
        {
          href: '/dashboard/roster',
          icon: '🗓️',
          labelKh: 'កាលវិភាគវេនការងារ',
          labelEn: 'Shift Rostering & Plans',
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
      titleKh: 'ប្រាក់បៀវត្សរ៍ & ហិរញ្ញវត្ថុ',
      titleEn: 'Payroll & Finance',
      icon: '💳',
      badgeColor: '#10b981',
      bgGlow: 'rgba(16, 185, 129, 0.28)',
      roles: ['ADMIN', 'HR_MANAGER', 'HR', 'PAYROLL_ADMIN', 'DEPT_HEAD', 'EMPLOYEE'],
      items: [
        {
          href: '/dashboard/payroll',
          icon: '💰',
          labelKh: 'តារាងបើកប្រាក់ខែ',
          labelEn: 'Monthly Payroll Run',
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
          labelEn: 'Salary Advances',
          roles: ['ADMIN', 'PAYROLL_ADMIN'],
        },
        {
          href: '/dashboard/expenses',
          icon: '💸',
          labelKh: 'ចំណាយ & ទូទាត់សំណង',
          labelEn: 'Expense Claims',
          roles: ['ADMIN', 'HR_MANAGER', 'HR', 'PAYROLL_ADMIN', 'DEPT_HEAD', 'EMPLOYEE'],
        },
        {
          href: '/dashboard/exports',
          icon: '📥',
          labelKh: 'នាំចេញរបាយការណ៍មេ (Excel)',
          labelEn: 'Master Excel Reports',
          roles: ['ADMIN', 'HR_MANAGER', 'HR', 'PAYROLL_ADMIN'],
        },
      ],
    },
    {
      id: 'operations',
      titleKh: 'ការអភិវឌ្ឍន៍ & ប្រតិបត្តិការ',
      titleEn: 'Talent & Operations',
      icon: '🎯',
      badgeColor: '#f59e0b',
      bgGlow: 'rgba(245, 158, 11, 0.28)',
      roles: ['ADMIN', 'HR_MANAGER', 'HR', 'DEPT_HEAD', 'EMPLOYEE'],
      items: [
        {
          href: '/dashboard/performance',
          icon: '🎯',
          labelKh: 'វាយតម្លៃការងារ 360°',
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
          labelKh: 'វគ្គបណ្តុះបណ្តាល LMS',
          labelEn: 'Training & Courses',
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
          labelKh: 'លិខិតបញ្ជាក់ផ្លូវការ',
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
      titleKh: 'រដ្ឋបាល & សុវត្ថិភាព',
      titleEn: 'System Administration',
      icon: '🛡️',
      badgeColor: '#8b5cf6',
      bgGlow: 'rgba(139, 92, 246, 0.28)',
      roles: ['ADMIN', 'HR_MANAGER', 'HR', 'PAYROLL_ADMIN', 'DEPT_HEAD', 'EMPLOYEE'],
      items: [
        {
          href: '/dashboard/users',
          icon: '🔐',
          labelKh: 'គណនី & សិទ្ធិប្រើប្រាស់',
          labelEn: 'Users & Roles Matrix',
          roles: ['ADMIN'],
        },
        {
          href: '/dashboard/audit',
          icon: '🛡️',
          labelKh: 'កំណត់ត្រាសវនកម្មសុវត្ថិភាព',
          labelEn: 'Security Audit Trail',
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
          labelKh: 'អំពីប្រព័ន្ធ HRM & កំណែ',
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
          background: rgba(255, 255, 255, 0.12);
          border-radius: 4px;
        }
        .sidebar-nav-scroll::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.28);
        }

        /* Folder Card Container with Crisp Contrast */
        .folder-card {
          background: rgba(26, 38, 65, 0.65);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 12px;
          overflow: hidden;
          transition: all 0.22s cubic-bezier(0.4, 0, 0.2, 1);
          box-shadow: 0 4px 14px rgba(0, 0, 0, 0.25);
          backdrop-filter: blur(8px);
        }
        .folder-card:hover {
          border-color: rgba(96, 165, 250, 0.35);
          background: rgba(30, 48, 82, 0.8);
          box-shadow: 0 6px 18px rgba(0, 0, 0, 0.32);
        }
        .folder-card.active-parent {
          border-color: rgba(96, 165, 250, 0.5);
          background: rgba(27, 44, 78, 0.92);
          box-shadow: 0 6px 20px rgba(37, 99, 235, 0.18);
        }

        /* Folder Trigger Button */
        .folder-trigger {
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 10px 12px;
          background: transparent;
          border: none;
          color: #f8fafc;
          cursor: pointer;
          font-weight: 700;
          font-size: 0.88rem;
          transition: all 0.2s ease;
          outline: none;
          user-select: none;
        }
        .folder-trigger:hover {
          background: rgba(255, 255, 255, 0.06);
          color: #ffffff;
        }

        /* Folder Icon Badge */
        .folder-icon-badge {
          width: 32px;
          height: 32px;
          border-radius: 9px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.05rem;
          flex-shrink: 0;
          box-shadow: 0 3px 8px rgba(0, 0, 0, 0.3);
          transition: transform 0.2s ease;
        }
        .folder-trigger:hover .folder-icon-badge {
          transform: scale(1.08);
        }

        /* Count Pill Tag */
        .count-pill {
          font-size: 0.68rem;
          font-weight: 800;
          padding: 2px 7px;
          border-radius: 10px;
          background: rgba(255, 255, 255, 0.12);
          color: #e2e8f0;
          border: 1px solid rgba(255, 255, 255, 0.14);
          transition: all 0.15s ease;
        }
        .folder-card.active-parent .count-pill {
          background: rgba(59, 130, 246, 0.3);
          color: #bfdbfe;
          border-color: rgba(96, 165, 250, 0.45);
        }

        /* Smooth CSS Grid List-Down Animation */
        .folder-accordion {
          display: grid;
          grid-template-rows: 0fr;
          transition: grid-template-rows 0.26s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .folder-accordion.open {
          grid-template-rows: 1fr;
        }
        .folder-accordion-inner {
          overflow: hidden;
        }

        /* Tree Guide Line & Sub Items */
        .sub-items-tree {
          position: relative;
          display: flex;
          flex-direction: column;
          padding: 6px 8px 8px 14px;
          margin-left: 14px;
          border-left: 2px solid rgba(148, 163, 184, 0.22);
          background: rgba(10, 16, 30, 0.25);
        }
        .folder-card.active-parent .sub-items-tree {
          border-left-color: rgba(96, 165, 250, 0.45);
        }

        /* Sub Item Link */
        .sub-item-link {
          padding: 8px 10px;
          font-size: 0.83rem;
          display: flex;
          align-items: center;
          gap: 10px;
          border-radius: 8px;
          transition: all 0.16s ease;
          color: #cbd5e1;
          text-decoration: none;
          white-space: nowrap;
          overflow: hidden;
          margin-top: 3px;
          position: relative;
        }
        .sub-item-link:hover {
          color: #ffffff;
          background: rgba(255, 255, 255, 0.1);
          transform: translateX(3px);
        }
        .sub-item-link.active {
          color: #ffffff;
          background: linear-gradient(90deg, rgba(37, 99, 235, 0.45) 0%, rgba(37, 99, 235, 0.18) 100%);
          border-left: 3px solid #38bdf8;
          font-weight: 700;
          box-shadow: 0 2px 12px rgba(37, 99, 235, 0.28);
        }

        /* Resize Handle */
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
          backgroundImage: 'radial-gradient(circle at 15% 10%, rgba(59, 130, 246, 0.22) 0%, transparent 65%), linear-gradient(180deg, #101c36 0%, #0c1426 100%)',
          color: '#f8fafc',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '4px 0 25px rgba(0,0,0,0.45)',
          zIndex: 40,
          position: 'relative',
          transition: isResizing ? 'none' : 'width 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
          userSelect: isResizing ? 'none' : 'auto',
          borderRight: '1px solid rgba(255, 255, 255, 0.12)',
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

        {/* Navigation Menu (Scrollable Accordion Folders) */}
        <nav
          className="sidebar-nav-scroll"
          style={{
            display: 'flex',
            flexDirection: 'column',
            padding: isCollapsed ? '12px 6px' : '14px 10px',
            gap: isCollapsed ? '8px' : '8px',
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

            // Collapsed icon-only mode with stylish tooltip
            if (isCollapsed) {
              return (
                <div key={group.id} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <div
                    title={`${group.titleKh} (${group.titleEn})`}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: '6px 0',
                    }}
                  >
                    <span
                      style={{
                        width: '28px',
                        height: '28px',
                        borderRadius: '6px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '0.95rem',
                        background: group.bgGlow,
                        border: `1px solid ${group.badgeColor}40`,
                      }}
                    >
                      {group.icon}
                    </span>
                  </div>
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
                          padding: '8px 0',
                          borderRadius: '8px',
                          textDecoration: 'none',
                          color: isActive ? '#60a5fa' : '#94a3b8',
                          background: isActive ? 'rgba(59, 130, 246, 0.2)' : 'transparent',
                          fontSize: '1.1rem',
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

            // Expanded Mode: Real Foldable Accordion Card Group with Smooth List-Down
            return (
              <div
                key={group.id}
                className={`folder-card ${hasActiveChild ? 'active-parent' : ''}`}
              >
                {/* Accordion Trigger Header */}
                <button
                  type="button"
                  onClick={() => toggleGroup(group.id)}
                  className="folder-trigger"
                  aria-expanded={isGroupOpen}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    {/* Stylish Symbol Badge */}
                    <span
                      className="folder-icon-badge"
                      style={{
                        background: group.bgGlow,
                        border: `1px solid ${group.badgeColor}40`,
                        color: '#ffffff',
                      }}
                    >
                      {group.icon}
                    </span>

                    <div style={{ display: 'flex', flexDirection: 'column', textAlign: 'left', lineHeight: 1.25 }}>
                      <span className="kh-text" style={{ fontSize: '0.85rem', fontWeight: 700, color: hasActiveChild ? '#ffffff' : '#f8fafc' }}>
                        {group.titleKh}
                      </span>
                      <span style={{ fontSize: '0.66rem', color: hasActiveChild ? '#93c5fd' : '#94a3b8', fontWeight: 600 }}>
                        {group.titleEn}
                      </span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {/* Item Count Pill */}
                    <span className="count-pill">
                      {visibleItems.length}
                    </span>

                    {/* Smooth Rotating Arrow Symbol */}
                    <span
                      style={{
                        fontSize: '0.78rem',
                        color: hasActiveChild ? '#60a5fa' : '#94a3b8',
                        transform: isGroupOpen ? 'rotate(90deg)' : 'rotate(0deg)',
                        transition: 'transform 0.24s cubic-bezier(0.4, 0, 0.2, 1)',
                        display: 'inline-block',
                      }}
                    >
                      ❯
                    </span>
                  </div>
                </button>

                {/* Smooth Animated List-Down Body */}
                <div className={`folder-accordion ${isGroupOpen ? 'open' : ''}`}>
                  <div className="folder-accordion-inner">
                    <div className="sub-items-tree">
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
                            <span style={{ fontSize: '1rem', flexShrink: 0 }}>{item.icon}</span>
                            <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.25, overflow: 'hidden' }}>
                              <span className="kh-text" style={{ overflow: 'hidden', textOverflow: 'ellipsis', fontSize: '0.82rem', color: isActive ? '#ffffff' : '#f1f5f9', fontWeight: isActive ? 700 : 500 }}>
                                {item.labelKh}
                              </span>
                              <span style={{ fontSize: '0.65rem', color: isActive ? '#bae6fd' : '#94a3b8', fontWeight: 500 }}>
                                {item.labelEn}
                              </span>
                            </div>
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </nav>

        {/* ========================================================
            ENTERPRISE BACKUP & RESTORE DATABASE CONTROLS (TWO BUTTONS)
           ======================================================== */}
        {role === 'ADMIN' && (
          <div
            style={{
              padding: isCollapsed ? '10px 4px' : '10px 10px',
              borderTop: '1px solid rgba(255, 255, 255, 0.08)',
              backgroundColor: 'rgba(15, 23, 42, 0.55)',
            }}
          >
            {isCollapsed ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', alignItems: 'center' }}>
                <button
                  type="button"
                  onClick={handleDownloadBackup}
                  disabled={isBackupLoading}
                  title="Backup Database (ទាញយកទិន្នន័យទុក)"
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '8px',
                    border: '1px solid rgba(16, 185, 129, 0.4)',
                    backgroundColor: 'rgba(16, 185, 129, 0.15)',
                    color: '#34d399',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    fontSize: '1rem',
                  }}
                >
                  {isBackupLoading ? '⏳' : '📥'}
                </button>
                <button
                  type="button"
                  onClick={() => setIsRestoreModalOpen(true)}
                  title="Restore Database (បញ្ចូលទិន្នន័យត្រឡប់មកវិញ)"
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '8px',
                    border: '1px solid rgba(245, 158, 11, 0.4)',
                    backgroundColor: 'rgba(245, 158, 11, 0.15)',
                    color: '#fbbf24',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    fontSize: '1rem',
                  }}
                >
                  🔄
                </button>
              </div>
            ) : (
              <div
                style={{
                  backgroundColor: 'rgba(26, 38, 65, 0.65)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '12px',
                  padding: '10px 10px',
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.25)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ fontSize: '0.95rem' }}>🗄️</span>
                    <span className="kh-text" style={{ fontSize: '0.78rem', fontWeight: 700, color: '#f8fafc' }}>
                      មូលដ្ឋានទិន្នន័យ (Database)
                    </span>
                  </div>
                  <span style={{ fontSize: '0.62rem', color: '#10b981', fontWeight: 700, backgroundColor: 'rgba(16, 185, 129, 0.15)', padding: '1px 6px', borderRadius: '6px', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
                    ONLINE
                  </span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  {/* Backup Button */}
                  <button
                    type="button"
                    onClick={handleDownloadBackup}
                    disabled={isBackupLoading}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                      padding: '7px 8px',
                      borderRadius: '8px',
                      border: '1px solid rgba(16, 185, 129, 0.4)',
                      background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.25) 0%, rgba(5, 150, 105, 0.35) 100%)',
                      color: '#ffffff',
                      cursor: 'pointer',
                      fontSize: '0.76rem',
                      fontWeight: 700,
                      transition: 'all 0.18s ease',
                      boxShadow: '0 2px 6px rgba(16, 185, 129, 0.2)',
                    }}
                    onMouseOver={(e) => (e.currentTarget.style.transform = 'translateY(-1px)')}
                    onMouseOut={(e) => (e.currentTarget.style.transform = 'translateY(0)')}
                  >
                    <span>{isBackupLoading ? '⏳' : '📥'}</span>
                    <span className="kh-text">{isBackupLoading ? 'កំពុង...' : 'Backup'}</span>
                  </button>

                  {/* Restore Button */}
                  <button
                    type="button"
                    onClick={() => setIsRestoreModalOpen(true)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                      padding: '7px 8px',
                      borderRadius: '8px',
                      border: '1px solid rgba(245, 158, 11, 0.4)',
                      background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.25) 0%, rgba(217, 119, 6, 0.35) 100%)',
                      color: '#ffffff',
                      cursor: 'pointer',
                      fontSize: '0.76rem',
                      fontWeight: 700,
                      transition: 'all 0.18s ease',
                      boxShadow: '0 2px 6px rgba(245, 158, 11, 0.2)',
                    }}
                    onMouseOver={(e) => (e.currentTarget.style.transform = 'translateY(-1px)')}
                    onMouseOut={(e) => (e.currentTarget.style.transform = 'translateY(0)')}
                  >
                    <span>🔄</span>
                    <span className="kh-text">Restore</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* RESTORE POPUP MODAL */}
        {isRestoreModalOpen && (
          <div
            style={{
              position: 'fixed',
              inset: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.65)',
              backdropFilter: 'blur(5px)',
              zIndex: 9999,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '20px',
            }}
          >
            <div
              style={{
                backgroundColor: '#0f172a',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                borderRadius: '16px',
                padding: '24px',
                width: '100%',
                maxWidth: '440px',
                boxShadow: '0 20px 40px rgba(0, 0, 0, 0.6)',
                color: '#f8fafc',
                position: 'relative',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '1.4rem' }}>🔄</span>
                  <div>
                    <h3 className="kh-text" style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: '#ffffff' }}>
                      Restore មូលដ្ឋានទិន្នន័យ (Restore Database)
                    </h3>
                    <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>បញ្ចូលទិន្នន័យពី File Backup ត្រឡប់មកវិញ</span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setIsRestoreModalOpen(false);
                    setRestoreStatus(null);
                  }}
                  style={{
                    backgroundColor: 'transparent',
                    border: 'none',
                    color: '#94a3b8',
                    fontSize: '1.2rem',
                    cursor: 'pointer',
                    padding: '4px',
                  }}
                >
                  ✕
                </button>
              </div>

              <div style={{ backgroundColor: 'rgba(245, 158, 11, 0.12)', border: '1px solid rgba(245, 158, 11, 0.3)', borderRadius: '10px', padding: '12px', marginBottom: '16px', fontSize: '0.8rem', color: '#fef3c7' }}>
                ⚠️ <strong>ការណែនាំ៖</strong> សូមជ្រើសរើស File Backup (`.json`) ដែលលោកអ្នកបានទាញយកពីប៊ូតុង Backup។ ទិន្នន័យនៅក្នុង File នោះនឹងត្រូវបានបញ្ចូលចូល Database វិញដោយសុវត្ថិភាព។
              </div>

              {restoreStatus && (
                <div
                  style={{
                    padding: '12px',
                    borderRadius: '10px',
                    marginBottom: '16px',
                    fontSize: '0.82rem',
                    backgroundColor: restoreStatus.loading
                      ? 'rgba(59, 130, 246, 0.15)'
                      : restoreStatus.success
                      ? 'rgba(16, 185, 129, 0.15)'
                      : 'rgba(239, 68, 68, 0.15)',
                    border: `1px solid ${
                      restoreStatus.loading
                        ? 'rgba(59, 130, 246, 0.4)'
                        : restoreStatus.success
                        ? 'rgba(16, 185, 129, 0.4)'
                        : 'rgba(239, 68, 68, 0.4)'
                    }`,
                    color: restoreStatus.loading
                      ? '#93c5fd'
                      : restoreStatus.success
                      ? '#86efac'
                      : '#fca5a5',
                  }}
                >
                  {restoreStatus.loading && '⏳ '}
                  {restoreStatus.message}
                </div>
              )}

              {/* Hidden file input */}
              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                style={{ display: 'none' }}
                onChange={handleFileSelect}
              />

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={restoreStatus?.loading}
                  style={{
                    padding: '12px',
                    borderRadius: '10px',
                    border: '1px dashed #60a5fa',
                    backgroundColor: 'rgba(59, 130, 246, 0.12)',
                    color: '#93c5fd',
                    fontWeight: 700,
                    cursor: restoreStatus?.loading ? 'not-allowed' : 'pointer',
                    fontSize: '0.88rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    transition: 'all 0.15s ease',
                  }}
                  onMouseOver={(e) => (e.currentTarget.style.backgroundColor = 'rgba(59, 130, 246, 0.22)')}
                  onMouseOut={(e) => (e.currentTarget.style.backgroundColor = 'rgba(59, 130, 246, 0.12)')}
                >
                  <span>📂</span>
                  <span className="kh-text">ជ្រើសរើស File Backup (.json) ដើម្បី Restore</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setIsRestoreModalOpen(false);
                    setRestoreStatus(null);
                  }}
                  style={{
                    padding: '10px',
                    borderRadius: '8px',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    backgroundColor: 'rgba(255, 255, 255, 0.05)',
                    color: '#94a3b8',
                    cursor: 'pointer',
                    fontSize: '0.82rem',
                    fontWeight: 600,
                  }}
                >
                  បោះបង់ (Cancel)
                </button>
              </div>
            </div>
          </div>
        )}

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
