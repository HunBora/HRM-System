'use client';

import React, { useState, useMemo } from 'react';
import { createUser, updateUser, deleteUser, resetUserPassword } from './actions';
import notify from '@/lib/notify';

interface UserItem {
  id: string;
  email: string;
  role: string;
  plainPassword?: string | null;
  createdAt: string | Date;
  employee?: {
    id: string;
    employeeId: string;
    firstNameEn: string;
    lastNameEn: string;
    firstNameKh?: string | null;
    lastNameKh?: string | null;
    department: string;
    position: string;
    dob?: string | Date | null;
  } | null;
}

interface EmployeeOption {
  id: string;
  employeeId: string;
  firstNameEn: string;
  lastNameEn: string;
  firstNameKh?: string | null;
  lastNameKh?: string | null;
  department: string;
  position: string;
  userId?: string | null;
}

interface Props {
  users: UserItem[];
  employees: EmployeeOption[];
  currentUserId?: string;
}

export default function UserManagementClient({ users, employees, currentUserId }: Props) {
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [visiblePasswords, setVisiblePasswords] = useState<Record<string, boolean>>({});
  const [showAllPasswords, setShowAllPasswords] = useState(false);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState<UserItem | null>(null);
  const [modalPassword, setModalPassword] = useState('');
  const [showModalPassword, setShowModalPassword] = useState(false);

  // Quick reset password modal
  const [quickPasswordUser, setQuickPasswordUser] = useState<UserItem | null>(null);
  const [quickPasswordInput, setQuickPasswordInput] = useState('');
  const [showQuickPassword, setShowQuickPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Password Generator
  const generatePassword = (prefix = 'Pass') => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789!@#$';
    let randomPart = '';
    for (let i = 0; i < 4; i++) {
      randomPart += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    const num = Math.floor(1000 + Math.random() * 9000);
    return `${prefix}@${num}`;
  };

  const toggleSinglePassword = (userId: string) => {
    setVisiblePasswords((prev) => ({
      ...prev,
      [userId]: !prev[userId],
    }));
  };

  const handleToggleAllPasswords = () => {
    const nextState = !showAllPasswords;
    setShowAllPasswords(nextState);
    const updated: Record<string, boolean> = {};
    users.forEach((u) => {
      updated[u.id] = nextState;
    });
    setVisiblePasswords(updated);
  };

  const handleCopyPassword = async (password: string, email: string) => {
    if (!password) return;
    try {
      await navigator.clipboard.writeText(password);
      notify.toast(`បានចម្លងពាក្យសម្ងាត់សម្រាប់ ${email}`, 'success');
    } catch {
      notify.toast('មិនអាចចម្លងបានឡើយ', 'error');
    }
  };

  // Filter users
  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const matchRole = roleFilter === 'ALL' || u.role === roleFilter;
      const term = searchTerm.toLowerCase().trim();
      if (!term) return matchRole;

      const emailMatch = u.email.toLowerCase().includes(term);
      const empIdMatch = u.employee?.employeeId?.toLowerCase().includes(term);
      const nameEnMatch = `${u.employee?.firstNameEn} ${u.employee?.lastNameEn}`.toLowerCase().includes(term);
      const nameKhMatch = `${u.employee?.firstNameKh || ''} ${u.employee?.lastNameKh || ''}`.toLowerCase().includes(term);
      const deptMatch = u.employee?.department?.toLowerCase().includes(term);

      return matchRole && (emailMatch || empIdMatch || nameEnMatch || nameKhMatch || deptMatch);
    });
  }, [users, searchTerm, roleFilter]);

  // Pagination calculation
  const totalItems = filteredUsers.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const startIndex = (safeCurrentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalItems);
  const paginatedUsers = filteredUsers.slice(startIndex, endIndex);

  // Statistics
  const stats = useMemo(() => {
    const total = users.length;
    const adminCount = users.filter((u) => u.role === 'ADMIN').length;
    const hrAndPayrollCount = users.filter((u) => ['HR_MANAGER', 'HR', 'PAYROLL_ADMIN'].includes(u.role)).length;
    const deptHeadCount = users.filter((u) => u.role === 'DEPT_HEAD').length;
    const employeeCount = users.filter((u) => u.role === 'EMPLOYEE').length;
    return { total, adminCount, hrAndPayrollCount, deptHeadCount, employeeCount };
  }, [users]);

  // Modal Handlers
  const handleOpenNew = () => {
    setEditingUser(null);
    setModalPassword(generatePassword('User'));
    setShowModalPassword(false);
    setError('');
    setShowModal(true);
  };

  const handleOpenEdit = (user: UserItem) => {
    setEditingUser(user);
    setModalPassword('');
    setShowModalPassword(false);
    setError('');
    setShowModal(true);
  };

  const handleOpenQuickPassword = (user: UserItem) => {
    setQuickPasswordUser(user);
    setQuickPasswordInput(user.plainPassword || generatePassword('Pass'));
    setShowQuickPassword(false);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const formData = new FormData(e.currentTarget);
    let res;

    if (editingUser) {
      res = await updateUser(editingUser.id, formData);
    } else {
      res = await createUser(formData);
    }

    if (res?.error) {
      setError(res.error);
      notify.toast(res.error, 'error');
    } else {
      notify.toast(editingUser ? 'បានកែប្រែគណនីដោយជោគជ័យ' : 'បានបង្កើតគណនីថ្មីដោយជោគជ័យ', 'success');
      setShowModal(false);
    }
    setLoading(false);
  };

  const handleSaveQuickPassword = async () => {
    if (!quickPasswordUser) return;
    if (!quickPasswordInput || quickPasswordInput.trim().length < 4) {
      notify.toast('ពាក្យសម្ងាត់ត្រូវមានយ៉ាងតិច ៤ តួអក្សរ', 'warning');
      return;
    }

    setLoading(true);
    const res = await resetUserPassword(quickPasswordUser.id, quickPasswordInput.trim());
    if (res.error) {
      notify.toast(res.error, 'error');
    } else {
      notify.toast(`បានកំណត់លេខសម្ងាត់ថ្មីសម្រាប់ ${quickPasswordUser.email} រួចរាល់!`, 'success');
      setVisiblePasswords((prev) => ({ ...prev, [quickPasswordUser.id]: true }));
      setQuickPasswordUser(null);
    }
    setLoading(false);
  };

  const handleDelete = async (user: UserItem) => {
    if (user.id === currentUserId) {
      notify.toast('អ្នកមិនអាចលុបគណនី Admin ផ្ទាល់ខ្លួនដែលកំពុង Log in បានទេ!', 'warning');
      return;
    }

    const confirmed = await notify.confirm({
      title: 'តើអ្នកពិតជាចង់លុបគណនីនេះ?',
      text: `គណនី "${user.email}" (${user.role}) នឹងត្រូវលុបចេញពីប្រព័ន្ធ។`,
      icon: 'warning',
      confirmButtonColor: '#ef4444',
      confirmButtonText: 'យល់ព្រមលុប (Delete)',
      cancelButtonText: 'បោះបង់',
    });

    if (confirmed) {
      setLoading(true);
      const res = await deleteUser(user.id);
      if (res?.error) {
        notify.toast(res.error, 'error');
      } else {
        notify.toast('បានលុបគណនីដោយជោគជ័យ', 'success');
      }
      setLoading(false);
    }
  };

  const getRoleBadgeStyle = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return {
          bg: '#fee2e2',
          border: '#fca5a5',
          color: '#991b1b',
          icon: '👑',
          labelKh: 'Admin',
        };
      case 'HR_MANAGER':
      case 'HR':
        return {
          bg: '#fef3c7',
          border: '#fcd34d',
          color: '#92400e',
          icon: '💼',
          labelKh: 'HR Manager',
        };
      case 'PAYROLL_ADMIN':
        return {
          bg: '#dcfce7',
          border: '#86efac',
          color: '#166534',
          icon: '💰',
          labelKh: 'Payroll Admin',
        };
      case 'DEPT_HEAD':
        return {
          bg: '#f3e8ff',
          border: '#d8b4fe',
          color: '#6b21a8',
          icon: '🏢',
          labelKh: 'Dept Head',
        };
      case 'EMPLOYEE':
      default:
        return {
          bg: '#e0f2fe',
          border: '#7dd3fc',
          color: '#0369a1',
          icon: '📱',
          labelKh: 'Self-Service',
        };
    }
  };

  return (
    <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* 1. Header & Full-Width Stats Container */}
      <div
        style={{
          background: '#ffffff',
          borderRadius: '16px',
          border: '1px solid #e2e8f0',
          padding: '24px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
          width: '100%',
          boxSizing: 'border-box',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '1.75rem' }}>👥</span>
              <h1 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#0f172a', margin: 0 }} className="kh-text">
                គ្រប់គ្រងគណនីអ្នកប្រើប្រាស់ & សិទ្ធិ (Users & Roles Matrix)
              </h1>
            </div>
            <p style={{ color: '#64748b', fontSize: '0.85rem', margin: '4px 0 0 0' }} className="kh-text">
              បង្កើតគណនី, កំណត់សិទ្ធិ (Roles), និងគ្រប់គ្រង/បង្ហាញពាក្យសម្ងាត់ (Password Control - សម្រាប់តែ Admin)
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <button
              onClick={handleToggleAllPasswords}
              type="button"
              className="kh-text"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 14px',
                background: '#f1f5f9',
                color: '#334155',
                border: '1px solid #cbd5e1',
                borderRadius: '10px',
                fontSize: '0.82rem',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              <span>{showAllPasswords ? '🙈' : '👁️'}</span>
              <span>{showAllPasswords ? 'លាក់ពាក្យសម្ងាត់ទាំងអស់' : 'បង្ហាញពាក្យសម្ងាត់ទាំងអស់'}</span>
            </button>

            <button
              onClick={handleOpenNew}
              type="button"
              className="kh-text"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '9px 18px',
                background: 'linear-gradient(135deg, #4f46e5 0%, #4338ca 100%)',
                color: '#ffffff',
                border: 'none',
                borderRadius: '10px',
                fontSize: '0.85rem',
                fontWeight: 700,
                cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(79, 70, 229, 0.25)',
              }}
            >
              <span style={{ fontSize: '1.1rem' }}>+</span>
              <span>បង្កើតគណនីថ្មី (New User)</span>
            </button>
          </div>
        </div>

        {/* 4 Equal Stats Cards across 1 Full Row */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: '16px',
            marginTop: '20px',
            paddingTop: '20px',
            borderTop: '1px solid #f1f5f9',
            width: '100%',
          }}
        >
          {/* Total */}
          <div
            style={{
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: '12px',
              padding: '16px',
              display: 'flex',
              alignItems: 'center',
              gap: '14px',
            }}
          >
            <div
              style={{
                width: '46px',
                height: '46px',
                borderRadius: '12px',
                background: '#e0e7ff',
                color: '#4338ca',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.4rem',
                fontWeight: 700,
              }}
            >
              👥
            </div>
            <div>
              <div style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 600 }} className="kh-text">
                គណនីសរុប (Total)
              </div>
              <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#0f172a', marginTop: '2px' }}>
                {stats.total}{' '}
                <span style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600 }} className="kh-text">
                  នាក់
                </span>
              </div>
            </div>
          </div>

          {/* Admin */}
          <div
            style={{
              background: '#fff1f2',
              border: '1px solid #fecdd3',
              borderRadius: '12px',
              padding: '16px',
              display: 'flex',
              alignItems: 'center',
              gap: '14px',
            }}
          >
            <div
              style={{
                width: '46px',
                height: '46px',
                borderRadius: '12px',
                background: '#ffe4e6',
                color: '#e11d48',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.4rem',
                fontWeight: 700,
              }}
            >
              👑
            </div>
            <div>
              <div style={{ fontSize: '0.78rem', color: '#be123c', fontWeight: 600 }} className="kh-text">
                អ្នកគ្រប់គ្រង (Admin)
              </div>
              <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#9f1239', marginTop: '2px' }}>
                {stats.adminCount}{' '}
                <span style={{ fontSize: '0.8rem', color: '#be123c', fontWeight: 600 }} className="kh-text">
                  នាក់
                </span>
              </div>
            </div>
          </div>

          {/* HR & Payroll */}
          <div
            style={{
              background: '#fefce8',
              border: '1px solid #fef08a',
              borderRadius: '12px',
              padding: '16px',
              display: 'flex',
              alignItems: 'center',
              gap: '14px',
            }}
          >
            <div
              style={{
                width: '46px',
                height: '46px',
                borderRadius: '12px',
                background: '#fef9c3',
                color: '#ca8a04',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.4rem',
                fontWeight: 700,
              }}
            >
              💼
            </div>
            <div>
              <div style={{ fontSize: '0.78rem', color: '#a16207', fontWeight: 600 }} className="kh-text">
                HR & បើកប្រាក់ខែ
              </div>
              <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#854d0e', marginTop: '2px' }}>
                {stats.hrAndPayrollCount}{' '}
                <span style={{ fontSize: '0.8rem', color: '#a16207', fontWeight: 600 }} className="kh-text">
                  នាក់
                </span>
              </div>
            </div>
          </div>

          {/* Employee Self-Service */}
          <div
            style={{
              background: '#f0f9ff',
              border: '1px solid #bae6fd',
              borderRadius: '12px',
              padding: '16px',
              display: 'flex',
              alignItems: 'center',
              gap: '14px',
            }}
          >
            <div
              style={{
                width: '46px',
                height: '46px',
                borderRadius: '12px',
                background: '#e0f2fe',
                color: '#0284c7',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.4rem',
                fontWeight: 700,
              }}
            >
              📱
            </div>
            <div>
              <div style={{ fontSize: '0.78rem', color: '#0369a1', fontWeight: 600 }} className="kh-text">
                បុគ្គលិក Self-Service
              </div>
              <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#075985', marginTop: '2px' }}>
                {stats.employeeCount}{' '}
                <span style={{ fontSize: '0.8rem', color: '#0369a1', fontWeight: 600 }} className="kh-text">
                  នាក់
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Filter & Search Bar */}
      <div
        style={{
          background: '#ffffff',
          borderRadius: '14px',
          border: '1px solid #e2e8f0',
          padding: '14px 18px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '14px',
          flexWrap: 'wrap',
          boxShadow: '0 2px 6px rgba(0,0,0,0.02)',
        }}
      >
        {/* Search */}
        <div style={{ position: 'relative', width: '320px', maxWidth: '100%' }}>
          <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }}>
            🔍
          </span>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="ស្វែងរកតាម Email, ឈ្មោះ, ឬ ID..."
            className="kh-text"
            style={{
              width: '100%',
              padding: '9px 32px 9px 36px',
              borderRadius: '10px',
              border: '1px solid #cbd5e1',
              fontSize: '0.84rem',
              outline: 'none',
              background: '#f8fafc',
            }}
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              style={{
                position: 'absolute',
                right: '10px',
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'transparent',
                border: 'none',
                color: '#94a3b8',
                cursor: 'pointer',
              }}
            >
              ✕
            </button>
          )}
        </div>

        {/* Role Filters */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          {[
            { id: 'ALL', label: 'ទាំងអស់ (All)' },
            { id: 'ADMIN', label: 'Admin 👑' },
            { id: 'HR_MANAGER', label: 'HR 💼' },
            { id: 'PAYROLL_ADMIN', label: 'Payroll 💰' },
            { id: 'DEPT_HEAD', label: 'Dept Head 🏢' },
            { id: 'EMPLOYEE', label: 'Self-Service 📱' },
          ].map((tab) => {
            const isActive = roleFilter === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setRoleFilter(tab.id);
                  setCurrentPage(1);
                }}
                className="kh-text"
                style={{
                  padding: '7px 14px',
                  borderRadius: '9px',
                  fontSize: '0.8rem',
                  fontWeight: isActive ? 700 : 500,
                  cursor: 'pointer',
                  border: isActive ? '1px solid #4f46e5' : '1px solid #e2e8f0',
                  background: isActive ? '#4f46e5' : '#f8fafc',
                  color: isActive ? '#ffffff' : '#475569',
                  transition: 'all 0.15s ease',
                }}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Page Size Selector */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '0.8rem', color: '#64748b' }} className="kh-text">
            បង្ហាញ៖
          </span>
          <select
            value={pageSize}
            onChange={(e) => {
              setPageSize(Number(e.target.value));
              setCurrentPage(1);
            }}
            style={{
              padding: '6px 10px',
              borderRadius: '8px',
              border: '1px solid #cbd5e1',
              fontSize: '0.82rem',
              fontWeight: 600,
              background: '#ffffff',
              cursor: 'pointer',
            }}
          >
            <option value={10}>10 គណនី</option>
            <option value={25}>25 គណនី</option>
            <option value={50}>50 គណនី</option>
            <option value={100}>100 គណនី</option>
          </select>
        </div>
      </div>

      {/* 3. Table: 1 User = 1 Horizontal Clean Row */}
      <div
        style={{
          background: '#ffffff',
          borderRadius: '16px',
          border: '1px solid #e2e8f0',
          boxShadow: '0 4px 16px rgba(0,0,0,0.03)',
          overflow: 'hidden',
          width: '100%',
        }}
      >
        <div style={{ overflowX: 'auto', width: '100%' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '1000px' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                <th style={{ padding: '14px 16px', width: '45px', textAlign: 'center', color: '#64748b', fontSize: '0.78rem' }}>#</th>
                <th style={{ padding: '14px 16px', color: '#334155', fontSize: '0.82rem', fontWeight: 700 }} className="kh-text">
                  គណនីអ្នកប្រើប្រាស់ (ACCOUNT / EMAIL)
                </th>
                <th style={{ padding: '14px 16px', color: '#334155', fontSize: '0.82rem', fontWeight: 700 }} className="kh-text">
                  សិទ្ធិ & តួនាទី (ROLE & ACCESS)
                </th>
                <th style={{ padding: '14px 16px', color: '#334155', fontSize: '0.82rem', fontWeight: 700 }} className="kh-text">
                  បុគ្គលិកភ្ជាប់ (LINKED EMPLOYEE)
                </th>
                <th style={{ padding: '14px 16px', color: '#334155', fontSize: '0.82rem', fontWeight: 700 }} className="kh-text">
                  ពាក្យសម្ងាត់ (PASSWORD - ADMIN ONLY)
                </th>
                <th style={{ padding: '14px 16px', textAlign: 'right', color: '#334155', fontSize: '0.82rem', fontWeight: 700 }} className="kh-text">
                  សកម្មភាព (ACTIONS)
                </th>
              </tr>
            </thead>
            <tbody>
              {paginatedUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ padding: '48px 16px', textAlign: 'center', color: '#94a3b8' }}>
                    <div style={{ fontSize: '32px', marginBottom: '8px' }}>🔍</div>
                    <div style={{ fontWeight: 700, color: '#475569' }} className="kh-text">
                      រកមិនឃើញគណនីដែលត្រូវនឹងលក្ខខណ្ឌស្វែងរកឡើយ
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedUsers.map((user, idx) => {
                  const roleStyle = getRoleBadgeStyle(user.role);
                  const isPasswordShown = !!visiblePasswords[user.id];
                  const hasPlainPassword = !!user.plainPassword;
                  const isCurrentUser = user.id === currentUserId;
                  const rowNumber = startIndex + idx + 1;

                  return (
                    <tr
                      key={user.id}
                      style={{
                        borderBottom: '1px solid #f1f5f9',
                        background: isCurrentUser ? '#f8faff' : '#ffffff',
                        transition: 'background 0.15s',
                        whiteSpace: 'nowrap',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = isCurrentUser ? '#f1f5fd' : '#f8fafc')}
                      onMouseLeave={(e) => (e.currentTarget.style.background = isCurrentUser ? '#f8faff' : '#ffffff')}
                    >
                      {/* Index */}
                      <td style={{ padding: '13px 16px', textAlign: 'center', color: '#94a3b8', fontSize: '0.82rem', fontFamily: 'monospace' }}>
                        {rowNumber}
                      </td>

                      {/* Account / Email in 1 single clean line */}
                      <td style={{ padding: '13px 16px' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '10px' }}>
                          <div
                            style={{
                              width: '34px',
                              height: '34px',
                              borderRadius: '10px',
                              background: '#eef2ff',
                              border: '1px solid #c7d2fe',
                              color: '#4338ca',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontWeight: 800,
                              fontSize: '0.88rem',
                              flexShrink: 0,
                            }}
                          >
                            {user.email.charAt(0).toUpperCase()}
                          </div>
                          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.88rem' }}>{user.email}</span>
                            {isCurrentUser && (
                              <span
                                className="kh-text"
                                style={{
                                  fontSize: '0.7rem',
                                  fontWeight: 700,
                                  padding: '2px 8px',
                                  borderRadius: '6px',
                                  background: '#e0e7ff',
                                  color: '#3730a3',
                                  border: '1px solid #c7d2fe',
                                }}
                              >
                                អ្នក (You)
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Role & Access Badge in 1 single line */}
                      <td style={{ padding: '13px 16px' }}>
                        <span
                          className="kh-text"
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                            padding: '4px 10px',
                            borderRadius: '8px',
                            fontSize: '0.78rem',
                            fontWeight: 700,
                            background: roleStyle.bg,
                            border: `1px solid ${roleStyle.border}`,
                            color: roleStyle.color,
                          }}
                        >
                          <span>{roleStyle.icon}</span>
                          <span>{roleStyle.labelKh}</span>
                        </span>
                      </td>

                      {/* Linked Employee in 1 clean line */}
                      <td style={{ padding: '13px 16px' }} className="kh-text">
                        {user.employee ? (
                          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                            <span
                              style={{
                                fontFamily: 'monospace',
                                fontWeight: 800,
                                fontSize: '0.76rem',
                                background: '#eff6ff',
                                color: '#1d4ed8',
                                padding: '2px 7px',
                                borderRadius: '6px',
                                border: '1px solid #bfdbfe',
                              }}
                            >
                              {user.employee.employeeId}
                            </span>
                            <span style={{ fontWeight: 700, color: '#1e293b', fontSize: '0.84rem' }}>
                              {user.employee.firstNameKh || user.employee.firstNameEn} {user.employee.lastNameKh || user.employee.lastNameEn}
                            </span>
                            <span style={{ color: '#64748b', fontSize: '0.78rem' }}>
                              ({user.employee.department})
                            </span>
                          </div>
                        ) : (
                          <span style={{ color: '#94a3b8', fontSize: '0.8rem', fontStyle: 'italic' }}>
                            — មិនទាន់ភ្ជាប់បុគ្គលិក
                          </span>
                        )}
                      </td>

                      {/* Password Control for Admin in 1 clean row */}
                      <td style={{ padding: '13px 16px' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                          <div
                            style={{
                              fontFamily: 'monospace',
                              fontSize: '0.82rem',
                              padding: '5px 10px',
                              borderRadius: '8px',
                              background: '#f8fafc',
                              border: '1px solid #cbd5e1',
                              color: '#1e293b',
                              minWidth: '130px',
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                            }}
                          >
                            {hasPlainPassword ? (
                              isPasswordShown ? (
                                <span style={{ fontWeight: 800, color: '#92400e', userSelect: 'all' }}>
                                  {user.plainPassword}
                                </span>
                              ) : (
                                <span style={{ letterSpacing: '3px', fontWeight: 700, color: '#64748b' }}>
                                  ••••••••••
                                </span>
                              )
                            ) : (
                              <span style={{ color: '#94a3b8', fontStyle: 'italic', fontSize: '0.74rem' }}>
                                [មិនទាន់កត់ត្រា]
                              </span>
                            )}

                            {hasPlainPassword && (
                              <button
                                type="button"
                                onClick={() => toggleSinglePassword(user.id)}
                                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0 0 0 6px', fontSize: '0.88rem' }}
                                title={isPasswordShown ? 'លាក់ពាក្យសម្ងាត់' : 'បង្ហាញពាក្យសម្ងាត់'}
                              >
                                {isPasswordShown ? '🙈' : '👁️'}
                              </button>
                            )}
                          </div>

                          {hasPlainPassword && (
                            <button
                              type="button"
                              onClick={() => handleCopyPassword(user.plainPassword || '', user.email)}
                              style={{
                                padding: '5px 8px',
                                background: '#f1f5f9',
                                border: '1px solid #e2e8f0',
                                borderRadius: '7px',
                                cursor: 'pointer',
                                fontSize: '0.82rem',
                              }}
                              title="ចម្លងពាក្យសម្ងាត់ (Copy Password)"
                            >
                              📋
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => handleOpenQuickPassword(user)}
                            className="kh-text"
                            style={{
                              padding: '4px 10px',
                              background: '#e0e7ff',
                              color: '#3730a3',
                              border: '1px solid #c7d2fe',
                              borderRadius: '7px',
                              cursor: 'pointer',
                              fontSize: '0.76rem',
                              fontWeight: 700,
                            }}
                          >
                            🔑 {hasPlainPassword ? 'ប្តូរ' : 'កំណត់ថ្មី'}
                          </button>
                        </div>
                      </td>

                      {/* Actions in 1 clean row */}
                      <td style={{ padding: '13px 16px', textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(user)}
                            className="kh-text"
                            style={{
                              padding: '5px 12px',
                              background: '#ffffff',
                              border: '1px solid #cbd5e1',
                              color: '#1e293b',
                              borderRadius: '8px',
                              fontSize: '0.78rem',
                              fontWeight: 600,
                              cursor: 'pointer',
                            }}
                          >
                            ✏️ កែប្រែ
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDelete(user)}
                            disabled={isCurrentUser || loading}
                            className="kh-text"
                            style={{
                              padding: '5px 12px',
                              background: isCurrentUser ? '#f1f5f9' : '#ffffff',
                              border: isCurrentUser ? '1px solid #e2e8f0' : '1px solid #fecdd3',
                              color: isCurrentUser ? '#94a3b8' : '#e11d48',
                              borderRadius: '8px',
                              fontSize: '0.78rem',
                              fontWeight: 600,
                              cursor: isCurrentUser ? 'not-allowed' : 'pointer',
                              opacity: isCurrentUser ? 0.4 : 1,
                            }}
                            title={isCurrentUser ? 'មិនអាចលុបគណនីផ្ទាល់ខ្លួនបានទេ' : 'លុបគណនី'}
                          >
                            🗑️ លុប
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* 4. Count Page & Pagination Controls (Easy to See) */}
        <div
          style={{
            padding: '14px 20px',
            background: '#f8fafc',
            borderTop: '1px solid #e2e8f0',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '12px',
          }}
        >
          {/* Count Info Badge */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }} className="kh-text">
            <span
              style={{
                fontSize: '0.82rem',
                fontWeight: 700,
                color: '#334155',
                background: '#e2e8f0',
                padding: '4px 10px',
                borderRadius: '8px',
              }}
            >
              📊 បង្ហាញ {totalItems === 0 ? 0 : startIndex + 1} ដល់ {endIndex} នៃ {totalItems} គណនីសរុប
            </span>
            <span style={{ fontSize: '0.8rem', color: '#64748b' }}>
              (ទំព័រទី <strong>{safeCurrentPage}</strong> នៃ <strong>{totalPages}</strong>)
            </span>
          </div>

          {/* Pagination Buttons */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={safeCurrentPage <= 1}
              className="kh-text"
              style={{
                padding: '6px 14px',
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
                background: safeCurrentPage <= 1 ? '#f1f5f9' : '#ffffff',
                color: safeCurrentPage <= 1 ? '#94a3b8' : '#1e293b',
                cursor: safeCurrentPage <= 1 ? 'not-allowed' : 'pointer',
                fontSize: '0.8rem',
                fontWeight: 600,
              }}
            >
              « មុន (Prev)
            </button>

            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => {
              const isCurrent = p === safeCurrentPage;
              return (
                <button
                  key={p}
                  onClick={() => setCurrentPage(p)}
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '8px',
                    border: isCurrent ? '1px solid #4f46e5' : '1px solid #e2e8f0',
                    background: isCurrent ? '#4f46e5' : '#ffffff',
                    color: isCurrent ? '#ffffff' : '#334155',
                    cursor: 'pointer',
                    fontSize: '0.82rem',
                    fontWeight: isCurrent ? 800 : 600,
                  }}
                >
                  {p}
                </button>
              );
            })}

            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={safeCurrentPage >= totalPages}
              className="kh-text"
              style={{
                padding: '6px 14px',
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
                background: safeCurrentPage >= totalPages ? '#f1f5f9' : '#ffffff',
                color: safeCurrentPage >= totalPages ? '#94a3b8' : '#1e293b',
                cursor: safeCurrentPage >= totalPages ? 'not-allowed' : 'pointer',
                fontSize: '0.8rem',
                fontWeight: 600,
              }}
            >
              បន្ទាប់ (Next) »
            </button>
          </div>
        </div>
      </div>

      {/* QUICK RESET PASSWORD MODAL */}
      {quickPasswordUser && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            background: 'rgba(15, 23, 42, 0.6)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px',
          }}
        >
          <div
            style={{
              background: '#ffffff',
              borderRadius: '16px',
              width: '100%',
              maxWidth: '440px',
              overflow: 'hidden',
              boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
            }}
          >
            <div
              style={{
                padding: '18px 20px',
                borderBottom: '1px solid #e2e8f0',
                background: '#f8fafc',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '1.2rem' }}>🔑</span>
                <div>
                  <h3 style={{ margin: 0, fontSize: '0.98rem', fontWeight: 800, color: '#0f172a' }} className="kh-text">
                    កំណត់ពាក្យសម្ងាត់ថ្មី (Password Reset)
                  </h3>
                  <div style={{ fontSize: '0.78rem', color: '#64748b', fontFamily: 'monospace' }}>
                    {quickPasswordUser.email}
                  </div>
                </div>
              </div>
              <button
                onClick={() => setQuickPasswordUser(null)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.1rem', color: '#64748b' }}
              >
                ✕
              </button>
            </div>

            <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }} className="kh-text">
                  ពាក្យសម្ងាត់ថ្មី (New Password)
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showQuickPassword ? 'text' : 'password'}
                    value={quickPasswordInput}
                    onChange={(e) => setQuickPasswordInput(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 40px 10px 12px',
                      borderRadius: '10px',
                      border: '1px solid #cbd5e1',
                      fontSize: '0.95rem',
                      fontFamily: 'monospace',
                      fontWeight: 700,
                      boxSizing: 'border-box',
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowQuickPassword(!showQuickPassword)}
                    style={{
                      position: 'absolute',
                      right: '10px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      fontSize: '1rem',
                    }}
                  >
                    {showQuickPassword ? '🙈' : '👁️'}
                  </button>
                </div>
              </div>

              <div>
                <span style={{ fontSize: '0.74rem', color: '#64748b', fontWeight: 600 }} className="kh-text">
                  ជម្រើសបង្កើតលេខសម្ងាត់រហ័ស (Quick Presets)៖
                </span>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '6px' }}>
                  <button
                    type="button"
                    onClick={() => setQuickPasswordInput(generatePassword('Pass'))}
                    className="kh-text"
                    style={{
                      padding: '5px 10px',
                      borderRadius: '8px',
                      background: '#e0e7ff',
                      color: '#4338ca',
                      border: '1px solid #c7d2fe',
                      fontSize: '0.76rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                    }}
                  >
                    ⚡ ចៃដន្យ (Auto Generate)
                  </button>
                  <button
                    type="button"
                    onClick={() => setQuickPasswordInput('123456')}
                    style={{
                      padding: '5px 10px',
                      borderRadius: '8px',
                      background: '#f1f5f9',
                      color: '#334155',
                      border: '1px solid #cbd5e1',
                      fontSize: '0.76rem',
                      fontFamily: 'monospace',
                      fontWeight: 700,
                      cursor: 'pointer',
                    }}
                  >
                    123456
                  </button>
                  <button
                    type="button"
                    onClick={() => setQuickPasswordInput('Bora@8083')}
                    style={{
                      padding: '5px 10px',
                      borderRadius: '8px',
                      background: '#f1f5f9',
                      color: '#334155',
                      border: '1px solid #cbd5e1',
                      fontSize: '0.76rem',
                      fontFamily: 'monospace',
                      fontWeight: 700,
                      cursor: 'pointer',
                    }}
                  >
                    Bora@8083
                  </button>
                </div>
              </div>
            </div>

            <div
              style={{
                padding: '14px 20px',
                borderTop: '1px solid #e2e8f0',
                background: '#f8fafc',
                display: 'flex',
                justifyContent: 'flex-end',
                gap: '10px',
              }}
            >
              <button
                type="button"
                onClick={() => setQuickPasswordUser(null)}
                className="kh-text"
                style={{
                  padding: '8px 16px',
                  borderRadius: '8px',
                  border: '1px solid #cbd5e1',
                  background: '#ffffff',
                  color: '#475569',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                បោះបង់
              </button>
              <button
                type="button"
                onClick={handleSaveQuickPassword}
                disabled={loading}
                className="kh-text"
                style={{
                  padding: '8px 18px',
                  borderRadius: '8px',
                  border: 'none',
                  background: '#4f46e5',
                  color: '#ffffff',
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  boxShadow: '0 4px 12px rgba(79, 70, 229, 0.25)',
                }}
              >
                {loading ? 'កំពុងរក្សាទុក...' : 'រក្សាទុកពាក្យសម្ងាត់'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CREATE / EDIT USER MODAL */}
      {showModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            background: 'rgba(15, 23, 42, 0.6)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px',
          }}
        >
          <div
            style={{
              background: '#ffffff',
              borderRadius: '16px',
              width: '100%',
              maxWidth: '520px',
              overflow: 'hidden',
              boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
            }}
          >
            <div
              style={{
                padding: '18px 24px',
                borderBottom: '1px solid #e2e8f0',
                background: '#f8fafc',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '1.3rem' }}>{editingUser ? '✏️' : '➕'}</span>
                <div>
                  <h2 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: '#0f172a' }} className="kh-text">
                    {editingUser ? 'កែប្រែគណនីអ្នកប្រើប្រាស់' : 'បង្កើតគណនីអ្នកប្រើប្រាស់ថ្មី'}
                  </h2>
                  <div style={{ fontSize: '0.78rem', color: '#64748b' }} className="kh-text">
                    {editingUser ? 'ផ្លាស់ប្តូរ Role, Employee, ឬលេខសម្ងាត់' : 'បំពេញព័ត៌មានបង្កើតគណនីថ្មី'}
                  </div>
                </div>
              </div>
              <button
                onClick={() => setShowModal(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.1rem', color: '#64748b' }}
              >
                ✕
              </button>
            </div>

            {error && (
              <div
                className="kh-text"
                style={{
                  margin: '16px 24px 0 24px',
                  padding: '10px 14px',
                  background: '#fef2f2',
                  border: '1px solid #fecdd3',
                  borderRadius: '10px',
                  color: '#991b1b',
                  fontSize: '0.8rem',
                }}
              >
                ⚠️ {error}
              </div>
            )}

            <form onSubmit={handleSubmit} style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }} className="kh-text">
                  អ៊ីមែល ឬ Username (Email / Username) <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input
                  type="text"
                  name="email"
                  defaultValue={editingUser?.email || ''}
                  required
                  placeholder="ឧ. bora@company.com ឬ EM-0001"
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '10px',
                    border: '1px solid #cbd5e1',
                    fontSize: '0.88rem',
                    boxSizing: 'border-box',
                    fontFamily: 'monospace',
                  }}
                />
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#334155' }} className="kh-text">
                    ពាក្យសម្ងាត់ (Password){' '}
                    {editingUser && (
                      <span style={{ fontSize: '0.74rem', color: '#64748b', fontWeight: 400 }}>
                        (ទុកទទេប្រសិនបើមិនចង់ប្តូរ)
                      </span>
                    )}
                  </label>
                  <button
                    type="button"
                    onClick={() => setModalPassword(generatePassword(editingUser ? 'Pass' : 'User'))}
                    className="kh-text"
                    style={{ background: 'none', border: 'none', color: '#4f46e5', fontSize: '0.76rem', fontWeight: 700, cursor: 'pointer' }}
                  >
                    ⚡ បង្កើតចៃដន្យ
                  </button>
                </div>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showModalPassword ? 'text' : 'password'}
                    name="password"
                    value={modalPassword}
                    onChange={(e) => setModalPassword(e.target.value)}
                    required={!editingUser}
                    placeholder={editingUser ? 'បញ្ចូលលេខសម្ងាត់ថ្មី (បើចង់ប្តូរ)...' : 'បញ្ចូលលេខសម្ងាត់...'}
                    style={{
                      width: '100%',
                      padding: '10px 40px 10px 14px',
                      borderRadius: '10px',
                      border: '1px solid #cbd5e1',
                      fontSize: '0.88rem',
                      fontFamily: 'monospace',
                      boxSizing: 'border-box',
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowModalPassword(!showModalPassword)}
                    style={{
                      position: 'absolute',
                      right: '10px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      fontSize: '1rem',
                    }}
                  >
                    {showModalPassword ? '🙈' : '👁️'}
                  </button>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }} className="kh-text">
                  សិទ្ធិ & តួនាទី (System Role) <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <select
                  name="role"
                  defaultValue={editingUser?.role || 'EMPLOYEE'}
                  className="kh-text"
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '10px',
                    border: '1px solid #cbd5e1',
                    fontSize: '0.84rem',
                    background: '#ffffff',
                    boxSizing: 'border-box',
                    cursor: 'pointer',
                  }}
                >
                  <option value="ADMIN">👑 ADMIN - អ្នកគ្រប់គ្រងប្រព័ន្ធ (មើលឃើញ & កែប្រែបានទាំងអស់)</option>
                  <option value="HR_MANAGER">💼 HR_MANAGER - អ្នកគ្រប់គ្រងធនធានមនុស្ស (HR & បុគ្គលិក)</option>
                  <option value="PAYROLL_ADMIN">💰 PAYROLL_ADMIN - អ្នកធ្វើប្រាក់ខែ (គណនាប្រាក់ខែ & កម្ចី)</option>
                  <option value="DEPT_HEAD">🏢 DEPT_HEAD - ប្រធានផ្នែក (អនុម័តច្បាប់ & ថែមម៉ោង OT)</option>
                  <option value="EMPLOYEE">📱 EMPLOYEE - បុគ្គលិកទូទៅ (ប្រើតែ Employee Self-Service)</option>
                </select>
                <div style={{ fontSize: '0.74rem', color: '#64748b', marginTop: '4px' }} className="kh-text">
                  * សម្រាប់បុគ្គលិកទូទៅ សូមជ្រើសរើស <b>EMPLOYEE</b> ដើម្បីកំណត់ឱ្យពួកគាត់ប្រើតែមុខងារ Employee Self-Service។
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }} className="kh-text">
                  ភ្ជាប់គណនីនេះជាមួយបុគ្គលិក (Link Employee Profile)
                </label>
                <select
                  name="employeeId"
                  defaultValue={editingUser?.employee?.id || ''}
                  className="kh-text"
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '10px',
                    border: '1px solid #cbd5e1',
                    fontSize: '0.84rem',
                    background: '#ffffff',
                    boxSizing: 'border-box',
                    cursor: 'pointer',
                  }}
                >
                  <option value="">— មិនទាន់ភ្ជាប់ (Unlinked) —</option>
                  {employees.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.employeeId} - {emp.firstNameKh || emp.firstNameEn} {emp.lastNameKh || emp.lastNameEn} ({emp.department} • {emp.position})
                    </option>
                  ))}
                </select>
              </div>

              <div
                style={{
                  paddingTop: '16px',
                  borderTop: '1px solid #e2e8f0',
                  display: 'flex',
                  justifyContent: 'flex-end',
                  gap: '10px',
                }}
              >
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="kh-text"
                  style={{
                    padding: '9px 18px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    background: '#ffffff',
                    color: '#475569',
                    fontSize: '0.82rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  បោះបង់
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="kh-text"
                  style={{
                    padding: '9px 22px',
                    borderRadius: '8px',
                    border: 'none',
                    background: '#4f46e5',
                    color: '#ffffff',
                    fontSize: '0.82rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    boxShadow: '0 4px 12px rgba(79, 70, 229, 0.25)',
                  }}
                >
                  {loading ? 'កំពុងរក្សាទុក...' : editingUser ? 'រក្សាទុកការកែប្រែ' : 'បង្កើតគណនី'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
