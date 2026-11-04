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

  // Password Generator Helper
  const generatePassword = (prefix = 'Pass') => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789!@#$';
    let randomPart = '';
    for (let i = 0; i < 4; i++) {
      randomPart += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    const num = Math.floor(1000 + Math.random() * 9000);
    return `${prefix}@${num}`;
  };

  // Toggle single password visibility
  const toggleSinglePassword = (userId: string) => {
    setVisiblePasswords((prev) => ({
      ...prev,
      [userId]: !prev[userId],
    }));
  };

  // Toggle all passwords
  const handleToggleAllPasswords = () => {
    const nextState = !showAllPasswords;
    setShowAllPasswords(nextState);
    const updated: Record<string, boolean> = {};
    users.forEach((u) => {
      updated[u.id] = nextState;
    });
    setVisiblePasswords(updated);
  };

  // Copy to clipboard
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

  // Statistics
  const stats = useMemo(() => {
    const total = users.length;
    const adminCount = users.filter((u) => u.role === 'ADMIN').length;
    const hrAndPayrollCount = users.filter((u) => ['HR_MANAGER', 'HR', 'PAYROLL_ADMIN'].includes(u.role)).length;
    const employeeCount = users.filter((u) => u.role === 'EMPLOYEE').length;
    return { total, adminCount, hrAndPayrollCount, employeeCount };
  }, [users]);

  // Open Create Modal
  const handleOpenNew = () => {
    setEditingUser(null);
    setModalPassword(generatePassword('User'));
    setShowModalPassword(false);
    setError('');
    setShowModal(true);
  };

  // Open Edit Modal
  const handleOpenEdit = (user: UserItem) => {
    setEditingUser(user);
    setModalPassword('');
    setShowModalPassword(false);
    setError('');
    setShowModal(true);
  };

  // Open Quick Reset Password Modal
  const handleOpenQuickPassword = (user: UserItem) => {
    setQuickPasswordUser(user);
    setQuickPasswordInput(user.plainPassword || generatePassword('Pass'));
    setShowQuickPassword(false);
  };

  // Submit Create or Edit User
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

  // Submit Quick Reset Password
  const handleSaveQuickPassword = async () => {
    if (!quickPasswordUser) return;
    if (!quickPasswordInput || quickPasswordInput.trim().length < 4) {
      notify.toast('ពាក្យសម្ងាត់ត្រូវមានយ៉ាងតិច ៤ តួអក្សរ', 'warning');
      return;
    }

    setLoading(true);
    const res = await resetUserPassword(quickPasswordUser.id, quickPasswordInput.trim());
    if (res?.error) {
      notify.toast(res.error, 'error');
    } else {
      notify.toast(`បានកំណត់លេខសម្ងាត់ថ្មីសម្រាប់ ${quickPasswordUser.email} រួចរាល់!`, 'success');
      setVisiblePasswords((prev) => ({ ...prev, [quickPasswordUser.id]: true }));
      setQuickPasswordUser(null);
    }
    setLoading(false);
  };

  // Delete User
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

  // Role Badge Styling Helper
  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return {
          bg: '#fee2e2',
          border: '#fca5a5',
          text: '#991b1b',
          icon: '👑',
          labelKh: 'Admin (គ្រប់គ្រង)',
        };
      case 'HR_MANAGER':
      case 'HR':
        return {
          bg: '#fef3c7',
          border: '#fcd34d',
          text: '#92400e',
          icon: '💼',
          labelKh: 'HR Manager',
        };
      case 'PAYROLL_ADMIN':
        return {
          bg: '#dcfce7',
          border: '#86efac',
          text: '#166534',
          icon: '💰',
          labelKh: 'Payroll (ប្រាក់ខែ)',
        };
      case 'DEPT_HEAD':
        return {
          bg: '#f3e8ff',
          border: '#d8b4fe',
          text: '#6b21a8',
          icon: '🏢',
          labelKh: 'Dept Head',
        };
      case 'EMPLOYEE':
      default:
        return {
          bg: '#e0f2fe',
          border: '#7dd3fc',
          text: '#0369a1',
          icon: '📱',
          labelKh: 'បុគ្គលិក Self-Service',
        };
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', width: '100%', boxSizing: 'border-box' }}>
      {/* 1. Header Card */}
      <div
        style={{
          background: '#ffffff',
          borderRadius: '16px',
          padding: '24px',
          border: '1px solid #e2e8f0',
          boxShadow: '0 2px 10px rgba(0,0,0,0.04)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px' }}>
          <div>
            <h1 className="kh-text" style={{ margin: 0, fontSize: '1.4rem', fontWeight: 800, color: '#0f172a' }}>
              👥 គ្រប់គ្រងគណនីអ្នកប្រើប្រាស់ & សិទ្ធិ (Users & Roles Matrix)
            </h1>
            <p className="kh-text" style={{ margin: '4px 0 0 0', fontSize: '0.86rem', color: '#64748b' }}>
              បង្កើតគណនី, កំណត់សិទ្ធិ (Roles), និងគ្រប់គ្រង/បង្ហាញពាក្យសម្ងាត់ (Password Control - សម្រាប់តែ Admin)
            </p>
          </div>

          <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
            <button
              onClick={handleToggleAllPasswords}
              type="button"
              className="kh-text"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '9px 16px',
                fontSize: '0.85rem',
                fontWeight: 600,
                color: '#334155',
                background: '#f1f5f9',
                border: '1px solid #cbd5e1',
                borderRadius: '10px',
                cursor: 'pointer',
              }}
            >
              <span>{showAllPasswords ? '🙈' : '👁️'}</span>
              <span>{showAllPasswords ? 'លាក់ពាក្យសម្ងាត់ទាំងអស់' : 'បង្ហាញពាក្យសម្ងាត់ទាំងអស់'}</span>
            </button>

            <button
              onClick={handleOpenNew}
              type="button"
              className="btn-primary kh-text"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 20px',
                fontSize: '0.9rem',
                fontWeight: 700,
                color: '#ffffff',
                background: 'linear-gradient(135deg, #4f46e5 0%, #3730a3 100%)',
                border: 'none',
                borderRadius: '10px',
                cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(79, 70, 229, 0.25)',
              }}
            >
              <span style={{ fontSize: '1.1rem', fontWeight: 900 }}>+</span>
              <span>បង្កើតគណនីថ្មី (New User)</span>
            </button>
          </div>
        </div>

        {/* 4 Stats Boxes */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: '12px',
            marginTop: '20px',
            paddingTop: '16px',
            borderTop: '1px solid #f1f5f9',
          }}
        >
          <div style={{ padding: '12px 16px', background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
            <span className="kh-text" style={{ fontSize: '0.78rem', color: '#64748b' }}>គណនីសរុប</span>
            <div style={{ fontSize: '1.25rem', fontWeight: 900, color: '#0f172a', marginTop: '2px' }}>
              {stats.total} នាក់
            </div>
          </div>
          <div style={{ padding: '12px 16px', background: '#fff1f2', borderRadius: '12px', border: '1px solid #fecdd3' }}>
            <span className="kh-text" style={{ fontSize: '0.78rem', color: '#9f1239' }}>អ្នកគ្រប់គ្រង (Admin)</span>
            <div style={{ fontSize: '1.25rem', fontWeight: 900, color: '#9f1239', marginTop: '2px' }}>
              {stats.adminCount} នាក់
            </div>
          </div>
          <div style={{ padding: '12px 16px', background: '#fffbeb', borderRadius: '12px', border: '1px solid #fef3c7' }}>
            <span className="kh-text" style={{ fontSize: '0.78rem', color: '#92400e' }}>HR & បើកប្រាក់ខែ</span>
            <div style={{ fontSize: '1.25rem', fontWeight: 900, color: '#92400e', marginTop: '2px' }}>
              {stats.hrAndPayrollCount} នាក់
            </div>
          </div>
          <div style={{ padding: '12px 16px', background: '#f0f9ff', borderRadius: '12px', border: '1px solid #bae6fd' }}>
            <span className="kh-text" style={{ fontSize: '0.78rem', color: '#0369a1' }}>បុគ្គលិក Self-Service</span>
            <div style={{ fontSize: '1.25rem', fontWeight: 900, color: '#0369a1', marginTop: '2px' }}>
              {stats.employeeCount} នាក់
            </div>
          </div>
        </div>
      </div>

      {/* 2. Filter & Search Toolbar */}
      <div
        style={{
          background: '#ffffff',
          borderRadius: '14px',
          padding: '14px 18px',
          border: '1px solid #e2e8f0',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px',
        }}
      >
        <div style={{ position: 'relative', width: '280px', maxWidth: '100%' }}>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="🔍 ស្វែងរកតាម Email, ឈ្មោះ, ឬ ID..."
            className="kh-text"
            style={{
              width: '100%',
              padding: '8px 12px',
              borderRadius: '8px',
              border: '1px solid #cbd5e1',
              fontSize: '0.85rem',
              boxSizing: 'border-box',
              outline: 'none',
            }}
          />
        </div>

        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          {[
            { id: 'ALL', label: 'ទាំងអស់ (All)' },
            { id: 'ADMIN', label: 'Admin 👑' },
            { id: 'HR_MANAGER', label: 'HR 💼' },
            { id: 'PAYROLL_ADMIN', label: 'Payroll 💰' },
            { id: 'DEPT_HEAD', label: 'Dept Head 🏢' },
            { id: 'EMPLOYEE', label: 'Self-Service 📱' },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setRoleFilter(item.id)}
              className="kh-text"
              style={{
                padding: '6px 12px',
                fontSize: '0.78rem',
                fontWeight: 700,
                borderRadius: '8px',
                border: 'none',
                cursor: 'pointer',
                background: roleFilter === item.id ? '#4f46e5' : '#f1f5f9',
                color: roleFilter === item.id ? '#ffffff' : '#475569',
              }}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* 3. Main Data Table */}
      <div
        style={{
          background: '#ffffff',
          borderRadius: '16px',
          border: '1px solid #e2e8f0',
          boxShadow: '0 2px 10px rgba(0,0,0,0.03)',
          overflow: 'hidden',
        }}
      >
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '700px' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                <th style={{ padding: '12px 14px', width: '40px', textAlign: 'center', fontSize: '0.75rem', color: '#64748b' }}>#</th>
                <th className="kh-text" style={{ padding: '12px 14px', fontSize: '0.8rem', color: '#475569', fontWeight: 800 }}>
                  គណនីអ្នកប្រើប្រាស់ (Email / Username)
                </th>
                <th className="kh-text" style={{ padding: '12px 14px', fontSize: '0.8rem', color: '#475569', fontWeight: 800 }}>
                  សិទ្ធិ & តួនាទី (Role)
                </th>
                <th className="kh-text" style={{ padding: '12px 14px', fontSize: '0.8rem', color: '#475569', fontWeight: 800 }}>
                  បុគ្គលិកដែលភ្ជាប់ (Employee Profile)
                </th>
                <th className="kh-text" style={{ padding: '12px 14px', fontSize: '0.8rem', color: '#475569', fontWeight: 800 }}>
                  ពាក្យសម្ងាត់ (Password - Admin Only)
                </th>
                <th className="kh-text" style={{ padding: '12px 14px', textAlign: 'right', fontSize: '0.8rem', color: '#475569', fontWeight: 800 }}>
                  សកម្មភាព
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>
                    រកមិនឃើញគណនីដែលត្រូវនឹងការស្វែងរកឡើយ
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user, idx) => {
                  const roleBadge = getRoleBadge(user.role);
                  const isPasswordShown = !!visiblePasswords[user.id];
                  const hasPlainPassword = !!user.plainPassword;
                  const isCurrentUser = user.id === currentUserId;

                  return (
                    <tr
                      key={user.id}
                      style={{
                        borderBottom: '1px solid #f1f5f9',
                        background: isCurrentUser ? '#f8faff' : '#ffffff',
                      }}
                    >
                      <td style={{ padding: '12px 14px', textAlign: 'center', color: '#94a3b8', fontSize: '0.75rem', fontFamily: 'monospace' }}>
                        {idx + 1}
                      </td>

                      {/* User Email */}
                      <td style={{ padding: '12px 14px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div
                            style={{
                              width: '34px',
                              height: '34px',
                              borderRadius: '8px',
                              background: '#e0e7ff',
                              color: '#4338ca',
                              fontWeight: 800,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '0.85rem',
                              flexShrink: 0,
                            }}
                          >
                            {user.email.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.88rem' }}>
                              {user.email}
                              {isCurrentUser && (
                                <span
                                  className="kh-text"
                                  style={{
                                    marginLeft: '6px',
                                    fontSize: '0.68rem',
                                    background: '#e0e7ff',
                                    color: '#3730a3',
                                    padding: '2px 6px',
                                    borderRadius: '4px',
                                    fontWeight: 700,
                                  }}
                                >
                                  (គណនីរបស់អ្នក)
                                </span>
                              )}
                            </div>
                            <span style={{ fontSize: '0.72rem', color: '#94a3b8', fontFamily: 'monospace' }}>
                              ID: {user.id.slice(0, 8)}...
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Role Badge */}
                      <td style={{ padding: '12px 14px' }}>
                        <span
                          className="kh-text"
                          style={{
                            background: roleBadge.bg,
                            border: `1px solid ${roleBadge.border}`,
                            color: roleBadge.text,
                            padding: '4px 10px',
                            borderRadius: '6px',
                            fontWeight: 700,
                            fontSize: '0.78rem',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                          }}
                        >
                          <span>{roleBadge.icon}</span>
                          <span>{roleBadge.labelKh}</span>
                        </span>
                      </td>

                      {/* Linked Employee */}
                      <td style={{ padding: '12px 14px' }}>
                        {user.employee ? (
                          <div>
                            <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.84rem' }}>
                              <span style={{ color: '#4f46e5', marginRight: '6px', fontFamily: 'monospace' }}>
                                [{user.employee.employeeId}]
                              </span>
                              {user.employee.firstNameKh || user.employee.firstNameEn} {user.employee.lastNameKh || user.employee.lastNameEn}
                            </div>
                            <div style={{ fontSize: '0.72rem', color: '#64748b' }}>
                              {user.employee.department} • {user.employee.position}
                            </div>
                          </div>
                        ) : (
                          <span style={{ color: '#94a3b8', fontSize: '0.8rem', fontStyle: 'italic' }}>
                            — មិនទាន់ភ្ជាប់បុគ្គលិក —
                          </span>
                        )}
                      </td>

                      {/* Password Column */}
                      <td style={{ padding: '12px 14px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <div
                            style={{
                              background: '#f8fafc',
                              border: '1px solid #cbd5e1',
                              borderRadius: '6px',
                              padding: '4px 10px',
                              fontSize: '0.82rem',
                              fontFamily: 'monospace',
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              minWidth: '130px',
                            }}
                          >
                            {hasPlainPassword ? (
                              isPasswordShown ? (
                                <strong style={{ color: '#92400e', letterSpacing: 'normal' }}>
                                  {user.plainPassword}
                                </strong>
                              ) : (
                                <span style={{ color: '#64748b', letterSpacing: '2px' }}>••••••••</span>
                              )
                            ) : (
                              <span style={{ color: '#94a3b8', fontSize: '0.74rem', fontStyle: 'italic' }}>
                                [មិនទាន់កត់ត្រា]
                              </span>
                            )}

                            {hasPlainPassword && (
                              <button
                                onClick={() => toggleSinglePassword(user.id)}
                                type="button"
                                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0 2px', fontSize: '0.82rem' }}
                                title={isPasswordShown ? 'លាក់ពាក្យសម្ងាត់' : 'បង្ហាញពាក្យសម្ងាត់'}
                              >
                                {isPasswordShown ? '🙈' : '👁️'}
                              </button>
                            )}
                          </div>

                          {hasPlainPassword && (
                            <button
                              onClick={() => handleCopyPassword(user.plainPassword || '', user.email)}
                              type="button"
                              style={{
                                background: '#f1f5f9',
                                border: '1px solid #cbd5e1',
                                borderRadius: '6px',
                                padding: '4px 8px',
                                cursor: 'pointer',
                                fontSize: '0.8rem',
                              }}
                              title="ចម្លងពាក្យសម្ងាត់ (Copy)"
                            >
                              📋
                            </button>
                          )}

                          <button
                            onClick={() => handleOpenQuickPassword(user)}
                            type="button"
                            className="kh-text"
                            style={{
                              background: '#e0e7ff',
                              color: '#4338ca',
                              border: '1px solid #c7d2fe',
                              borderRadius: '6px',
                              padding: '4px 8px',
                              cursor: 'pointer',
                              fontSize: '0.75rem',
                              fontWeight: 700,
                            }}
                            title="កំណត់ ឬផ្លាស់ប្តូរលេខសម្ងាត់"
                          >
                            🔑 {hasPlainPassword ? 'ប្តូរ' : 'កំណត់ថ្មី'}
                          </button>
                        </div>
                      </td>

                      {/* Actions */}
                      <td style={{ padding: '12px 14px', textAlign: 'right' }}>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                          <button
                            onClick={() => handleOpenEdit(user)}
                            className="kh-text"
                            style={{
                              background: '#eff6ff',
                              color: '#2563eb',
                              border: '1px solid #bfdbfe',
                              borderRadius: '6px',
                              padding: '4px 10px',
                              cursor: 'pointer',
                              fontSize: '0.78rem',
                              fontWeight: 700,
                            }}
                          >
                            ✏️ កែប្រែ
                          </button>
                          <button
                            onClick={() => handleDelete(user)}
                            disabled={isCurrentUser || loading}
                            className="kh-text"
                            style={{
                              background: isCurrentUser ? '#f1f5f9' : '#fef2f2',
                              color: isCurrentUser ? '#94a3b8' : '#ef4444',
                              border: `1px solid ${isCurrentUser ? '#e2e8f0' : '#fecaca'}`,
                              borderRadius: '6px',
                              padding: '4px 10px',
                              cursor: isCurrentUser ? 'not-allowed' : 'pointer',
                              fontSize: '0.78rem',
                              fontWeight: 700,
                            }}
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
      </div>

      {/* QUICK RESET PASSWORD MODAL */}
      {quickPasswordUser && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(15, 23, 42, 0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
          <div style={{ background: '#ffffff', borderRadius: '16px', maxWidth: '420px', width: '100%', padding: '24px', boxShadow: '0 20px 40px rgba(0,0,0,0.2)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e2e8f0', paddingBottom: '12px', marginBottom: '16px' }}>
              <div>
                <h3 className="kh-text" style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: '#0f172a' }}>
                  🔑 កំណត់ពាក្យសម្ងាត់ថ្មី (Password Reset)
                </h3>
                <span style={{ fontSize: '0.78rem', color: '#64748b', fontFamily: 'monospace' }}>
                  {quickPasswordUser.email}
                </span>
              </div>
              <button onClick={() => setQuickPasswordUser(null)} style={{ background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer', color: '#94a3b8' }}>✕</button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label className="kh-text" style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                  ពាក្យសម្ងាត់ថ្មី (New Password)
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showQuickPassword ? 'text' : 'password'}
                    value={quickPasswordInput}
                    onChange={(e) => setQuickPasswordInput(e.target.value)}
                    style={{ width: '100%', padding: '10px 40px 10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.9rem', fontFamily: 'monospace', boxSizing: 'border-box' }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowQuickPassword(!showQuickPassword)}
                    style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer' }}
                  >
                    {showQuickPassword ? '🙈' : '👁️'}
                  </button>
                </div>
              </div>

              {/* Quick Preset Buttons */}
              <div>
                <span className="kh-text" style={{ fontSize: '0.74rem', color: '#64748b', display: 'block', marginBottom: '6px' }}>
                  ជម្រើសបង្កើតរហ័ស (Quick Presets)៖
                </span>
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    onClick={() => setQuickPasswordInput(generatePassword('Pass'))}
                    className="kh-text"
                    style={{ padding: '5px 10px', background: '#e0e7ff', color: '#4338ca', border: '1px solid #c7d2fe', borderRadius: '6px', fontSize: '0.74rem', fontWeight: 700, cursor: 'pointer' }}
                  >
                    ⚡ ចៃដន្យ (Auto)
                  </button>
                  <button
                    type="button"
                    onClick={() => setQuickPasswordInput('123456')}
                    style={{ padding: '5px 10px', background: '#f1f5f9', color: '#334155', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.74rem', fontWeight: 700, cursor: 'pointer', fontFamily: 'monospace' }}
                  >
                    123456
                  </button>
                  <button
                    type="button"
                    onClick={() => setQuickPasswordInput('Bora@8083')}
                    style={{ padding: '5px 10px', background: '#f1f5f9', color: '#334155', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.74rem', fontWeight: 700, cursor: 'pointer', fontFamily: 'monospace' }}
                  >
                    Bora@8083
                  </button>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '20px', paddingTop: '14px', borderTop: '1px solid #f1f5f9' }}>
              <button
                type="button"
                onClick={() => setQuickPasswordUser(null)}
                className="kh-text"
                style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#fff', color: '#475569', fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer' }}
              >
                បោះបង់
              </button>
              <button
                type="button"
                onClick={handleSaveQuickPassword}
                disabled={loading}
                className="kh-text"
                style={{ padding: '8px 20px', borderRadius: '8px', border: 'none', background: '#4f46e5', color: '#fff', fontSize: '0.82rem', fontWeight: 700, cursor: 'pointer' }}
              >
                {loading ? 'កំពុងរក្សាទុក...' : 'រក្សាទុក'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CREATE / EDIT USER MODAL */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(15, 23, 42, 0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
          <div style={{ background: '#ffffff', borderRadius: '16px', maxWidth: '480px', width: '100%', padding: '24px', boxShadow: '0 20px 40px rgba(0,0,0,0.2)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e2e8f0', paddingBottom: '12px', marginBottom: '16px' }}>
              <h2 className="kh-text" style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: '#0f172a' }}>
                {editingUser ? 'កែប្រែគណនីអ្នកប្រើប្រាស់' : 'បង្កើតគណនីថ្មី'}
              </h2>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer', color: '#94a3b8' }}>✕</button>
            </div>

            {error && (
              <div className="kh-text" style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#991b1b', padding: '10px 14px', borderRadius: '8px', fontSize: '0.82rem', marginBottom: '14px' }}>
                ⚠️ {error}
              </div>
            )}

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label className="kh-text" style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                  អ៊ីមែល ឬ Username (Email / Username) *
                </label>
                <input
                  type="text"
                  name="email"
                  defaultValue={editingUser?.email || ''}
                  required
                  placeholder="ឧ. user@company.com ឬ EM-0001"
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.88rem', boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <label className="kh-text" style={{ fontSize: '0.8rem', fontWeight: 700, color: '#334155' }}>
                    ពាក្យសម្ងាត់ (Password) {editingUser && <span style={{ fontWeight: 400, color: '#64748b' }}>(ទុកទទេបើមិនចង់ប្តូរ)</span>}
                  </label>
                  <button
                    type="button"
                    onClick={() => setModalPassword(generatePassword(editingUser ? 'Pass' : 'User'))}
                    className="kh-text"
                    style={{ fontSize: '0.74rem', color: '#4f46e5', fontWeight: 700, background: 'none', border: 'none', cursor: 'pointer' }}
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
                    style={{ width: '100%', padding: '10px 40px 10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.88rem', fontFamily: 'monospace', boxSizing: 'border-box' }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowModalPassword(!showModalPassword)}
                    style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer' }}
                  >
                    {showModalPassword ? '🙈' : '👁️'}
                  </button>
                </div>
              </div>

              <div>
                <label className="kh-text" style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                  សិទ្ធិ & តួនាទី (System Role) *
                </label>
                <select
                  name="role"
                  defaultValue={editingUser?.role || 'EMPLOYEE'}
                  className="kh-text"
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem', background: '#fff', boxSizing: 'border-box' }}
                >
                  <option value="ADMIN">👑 ADMIN - អ្នកគ្រប់គ្រងប្រព័ន្ធ</option>
                  <option value="HR_MANAGER">💼 HR_MANAGER - អ្នកគ្រប់គ្រងធនធានមនុស្ស</option>
                  <option value="PAYROLL_ADMIN">💰 PAYROLL_ADMIN - អ្នកធ្វើប្រាក់ខែ</option>
                  <option value="DEPT_HEAD">🏢 DEPT_HEAD - ប្រធានផ្នែក</option>
                  <option value="EMPLOYEE">📱 EMPLOYEE - បុគ្គលិកទូទៅ (Self-Service តែមួយគត់)</option>
                </select>
              </div>

              <div>
                <label className="kh-text" style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                  ភ្ជាប់គណនីនេះជាមួយបុគ្គលិក (Link Employee Profile)
                </label>
                <select
                  name="employeeId"
                  defaultValue={editingUser?.employee?.id || ''}
                  className="kh-text"
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem', background: '#fff', boxSizing: 'border-box' }}
                >
                  <option value="">— មិនទាន់ភ្ជាប់ (Unlinked) —</option>
                  {employees.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.employeeId} - {emp.firstNameKh || emp.firstNameEn} {emp.lastNameKh || emp.lastNameEn} ({emp.department})
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '10px' }}>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="kh-text"
                  style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#fff', color: '#475569', fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer' }}
                >
                  បោះបង់
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="kh-text"
                  style={{ padding: '8px 20px', borderRadius: '8px', border: 'none', background: '#4f46e5', color: '#fff', fontSize: '0.82rem', fontWeight: 700, cursor: 'pointer' }}
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
