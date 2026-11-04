'use client';

import { useState, useMemo } from 'react';
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
    const deptHeadCount = users.filter((u) => u.role === 'DEPT_HEAD').length;
    const employeeCount = users.filter((u) => u.role === 'EMPLOYEE').length;
    return { total, adminCount, hrAndPayrollCount, deptHeadCount, employeeCount };
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
    if (res.error) {
      notify.toast(res.error, 'error');
    } else {
      notify.toast(`បានកំណត់លេខសម្ងាត់ថ្មីសម្រាប់ ${quickPasswordUser.email} រួចរាល់!`, 'success');
      // Update local visible state to show the newly set password
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
          bg: 'bg-rose-50 border-rose-200 text-rose-700',
          dot: 'bg-rose-500',
          icon: '👑',
          labelKh: 'អ្នកគ្រប់គ្រងប្រព័ន្ធ (Admin)',
        };
      case 'HR_MANAGER':
      case 'HR':
        return {
          bg: 'bg-amber-50 border-amber-200 text-amber-800',
          dot: 'bg-amber-500',
          icon: '💼',
          labelKh: 'ធនធានមនុស្ស (HR Manager)',
        };
      case 'PAYROLL_ADMIN':
        return {
          bg: 'bg-emerald-50 border-emerald-200 text-emerald-800',
          dot: 'bg-emerald-500',
          icon: '💰',
          labelKh: 'គណនេយ្យករ/បើកប្រាក់ខែ (Payroll)',
        };
      case 'DEPT_HEAD':
        return {
          bg: 'bg-purple-50 border-purple-200 text-purple-800',
          dot: 'bg-purple-500',
          icon: '🏢',
          labelKh: 'ប្រធានផ្នែក (Dept Head)',
        };
      case 'EMPLOYEE':
      default:
        return {
          bg: 'bg-sky-50 border-sky-200 text-sky-800',
          dot: 'bg-sky-500',
          icon: '📱',
          labelKh: 'បុគ្គលិក Self-Service',
        };
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-5 md:p-6 transition-all">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <span className="p-2.5 bg-indigo-50 border border-indigo-100 text-indigo-600 rounded-xl text-xl shadow-xs">
                👥
              </span>
              <div>
                <h1 className="text-xl md:text-2xl font-bold text-slate-900 kh-text flex items-center gap-2">
                  គ្រប់គ្រងគណនីអ្នកប្រើប្រាស់ & សិទ្ធិ (Users & Roles Matrix)
                </h1>
                <p className="text-xs md:text-sm text-slate-500 kh-text">
                  បង្កើតគណនី, កំណត់សិទ្ធិ (Roles), និងគ្រប់គ្រង/បង្ហាញពាក្យសម្ងាត់ (Password Control - សម្រាប់តែ Admin)
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            <button
              onClick={handleToggleAllPasswords}
              type="button"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs md:text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200/80 rounded-xl border border-slate-200 transition-colors shadow-xs kh-text"
              title="បង្ហាញ ឬលាក់ពាក្យសម្ងាត់ទាំងអស់ក្នុងតារាង"
            >
              <span>{showAllPasswords ? '🙈' : '👁️'}</span>
              <span>{showAllPasswords ? 'លាក់ពាក្យសម្ងាត់ទាំងអស់' : 'បង្ហាញពាក្យសម្ងាត់ទាំងអស់'}</span>
            </button>

            <button
              onClick={handleOpenNew}
              type="button"
              className="inline-flex items-center gap-2 px-4 py-2 text-xs md:text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 active:scale-95 rounded-xl shadow-sm hover:shadow-indigo-200 transition-all kh-text"
            >
              <span className="text-base font-bold">+</span>
              <span>បង្កើតគណនីថ្មី (New User)</span>
            </button>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 md:gap-4 mt-6 pt-5 border-t border-slate-100">
          <div className="p-3.5 bg-slate-50/80 rounded-xl border border-slate-200/60 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-indigo-100/70 text-indigo-700 flex items-center justify-center font-bold text-lg">
              👥
            </div>
            <div>
              <p className="text-xs text-slate-500 kh-text">គណនីសរុប</p>
              <p className="text-lg font-bold text-slate-900">{stats.total} នាក់</p>
            </div>
          </div>

          <div className="p-3.5 bg-rose-50/50 rounded-xl border border-rose-100 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-rose-100 text-rose-700 flex items-center justify-center font-bold text-lg">
              👑
            </div>
            <div>
              <p className="text-xs text-rose-600 kh-text">អ្នកគ្រប់គ្រង (Admin)</p>
              <p className="text-lg font-bold text-rose-900">{stats.adminCount} នាក់</p>
            </div>
          </div>

          <div className="p-3.5 bg-amber-50/50 rounded-xl border border-amber-100 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center font-bold text-lg">
              💼
            </div>
            <div>
              <p className="text-xs text-amber-700 kh-text">HR & បើកប្រាក់ខែ</p>
              <p className="text-lg font-bold text-amber-900">{stats.hrAndPayrollCount} នាក់</p>
            </div>
          </div>

          <div className="p-3.5 bg-sky-50/50 rounded-xl border border-sky-100 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-sky-100 text-sky-700 flex items-center justify-center font-bold text-lg">
              📱
            </div>
            <div>
              <p className="text-xs text-sky-700 kh-text">បុគ្គលិក Self-Service</p>
              <p className="text-lg font-bold text-sky-900">{stats.employeeCount} នាក់</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-4 flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Search Input */}
        <div className="relative w-full md:w-80">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
            🔍
          </span>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="ស្វែងរកតាម Email, ឈ្មោះ, ឬអត្តលេខ..."
            className="w-full pl-9 pr-3 py-2 text-xs md:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 transition-all kh-text placeholder:text-slate-400"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-600"
            >
              ✕
            </button>
          )}
        </div>

        {/* Role Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0 scrollbar-none">
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
              className={`px-3 py-1.5 text-xs font-medium rounded-xl whitespace-nowrap transition-all kh-text ${
                roleFilter === item.id
                  ? 'bg-indigo-600 text-white shadow-xs font-semibold'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200/80'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Standard Table Card */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden transition-all">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200/80 text-xs font-semibold text-slate-600 uppercase tracking-wider kh-text">
                <th className="py-3.5 px-4 text-center w-12">#</th>
                <th className="py-3.5 px-4">គណនីអ្នកប្រើប្រាស់ (Account / Email)</th>
                <th className="py-3.5 px-4">សិទ្ធិ & តួនាទី (Role & Access)</th>
                <th className="py-3.5 px-4">បុគ្គលិកភ្ជាប់ (Linked Employee)</th>
                <th className="py-3.5 px-4">
                  <div className="flex items-center gap-1.5">
                    <span>ពាក្យសម្ងាត់ (Password - Admin Only)</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 font-semibold normal-case">
                      Admin Access
                    </span>
                  </div>
                </th>
                <th className="py-3.5 px-4 text-right w-44">សកម្មភាព (Actions)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs md:text-sm">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400 kh-text">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <span className="text-3xl">🔍</span>
                      <p className="text-base font-semibold text-slate-600">រកមិនឃើញគណនីដែលត្រូវនឹងលក្ខខណ្ឌស្វែងរក</p>
                      <p className="text-xs text-slate-400">សូមសាកល្បងផ្លាស់ប្តូរពាក្យស្វែងរក ឬប្រភេទ Role ឡើងវិញ</p>
                    </div>
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
                      className={`hover:bg-slate-50/70 transition-colors ${
                        isCurrentUser ? 'bg-indigo-50/20' : ''
                      }`}
                    >
                      {/* Index */}
                      <td className="py-3.5 px-4 text-center text-slate-400 text-xs font-mono">
                        {idx + 1}
                      </td>

                      {/* Email / User */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-slate-100 border border-slate-200/80 flex items-center justify-center font-bold text-slate-700 text-sm shadow-2xs shrink-0">
                            {user.email.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-semibold text-slate-900">{user.email}</span>
                              {isCurrentUser && (
                                <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-indigo-100 text-indigo-700 border border-indigo-200 kh-text">
                                  គណនីរបស់អ្នក (You)
                                </span>
                              )}
                            </div>
                            <span className="text-[11px] text-slate-400 font-mono">
                              ID: {user.id.slice(0, 8)}...
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Role & Access Badge */}
                      <td className="py-3.5 px-4">
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border shadow-2xs kh-text ${roleBadge.bg}">
                          <span className="text-sm">{roleBadge.icon}</span>
                          <span>{roleBadge.labelKh}</span>
                        </div>
                      </td>

                      {/* Linked Employee */}
                      <td className="py-3.5 px-4 kh-text">
                        {user.employee ? (
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-1.5">
                              <span className="font-semibold text-slate-900">
                                {user.employee.firstNameKh || user.employee.firstNameEn} {user.employee.lastNameKh || user.employee.lastNameEn}
                              </span>
                              <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded bg-indigo-50 text-indigo-700 border border-indigo-200">
                                {user.employee.employeeId}
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-500">
                              {user.employee.department} • {user.employee.position}
                            </p>
                          </div>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-xs text-slate-400 italic">
                            <span>—</span>
                            <span>មិនទាន់ភ្ជាប់បុគ្គលិក</span>
                          </span>
                        )}
                      </td>

                      {/* Password Control for Admin Only */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <div className="font-mono text-xs px-2.5 py-1 rounded-lg bg-slate-100/90 border border-slate-200 text-slate-800 min-w-[125px] flex items-center justify-between shadow-2xs">
                            {hasPlainPassword ? (
                              isPasswordShown ? (
                                <span className="font-bold text-amber-900 tracking-normal select-all">
                                  {user.plainPassword}
                                </span>
                              ) : (
                                <span className="tracking-widest text-slate-500 font-bold select-none">
                                  ••••••••••
                                </span>
                              )
                            ) : (
                              <span className="text-[11px] text-slate-400 italic font-sans select-none">
                                [មិនទាន់កត់ត្រា]
                              </span>
                            )}

                            {/* Eye button */}
                            {hasPlainPassword && (
                              <button
                                onClick={() => toggleSinglePassword(user.id)}
                                type="button"
                                className="ml-2 text-slate-500 hover:text-slate-800 focus:outline-none transition-colors"
                                title={isPasswordShown ? 'លាក់ពាក្យសម្ងាត់' : 'បង្ហាញពាក្យសម្ងាត់'}
                              >
                                {isPasswordShown ? '🙈' : '👁️'}
                              </button>
                            )}
                          </div>

                          {/* Copy button */}
                          {hasPlainPassword && (
                            <button
                              onClick={() => handleCopyPassword(user.plainPassword || '', user.email)}
                              type="button"
                              className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg border border-transparent hover:border-indigo-100 transition-colors"
                              title="ចម្លងពាក្យសម្ងាត់ (Copy Password)"
                            >
                              📋
                            </button>
                          )}

                          {/* Quick Set Password Button */}
                          <button
                            onClick={() => handleOpenQuickPassword(user)}
                            type="button"
                            className="px-2 py-1 text-[11px] font-medium text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200/80 rounded-lg transition-colors shadow-2xs kh-text"
                            title="កំណត់ ឬផ្លាស់ប្តូរលេខសម្ងាត់ភ្លាមៗ"
                          >
                            🔑 {hasPlainPassword ? 'ប្តូរ' : 'កំណត់ថ្មី'}
                          </button>
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleOpenEdit(user)}
                            type="button"
                            className="px-2.5 py-1 text-xs font-medium text-slate-700 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg border border-slate-200/80 hover:border-indigo-200 transition-all kh-text"
                          >
                            ✏️ កែប្រែ
                          </button>

                          <button
                            onClick={() => handleDelete(user)}
                            disabled={isCurrentUser || loading}
                            type="button"
                            className={`px-2.5 py-1 text-xs font-medium rounded-lg border transition-all kh-text ${
                              isCurrentUser
                                ? 'opacity-30 cursor-not-allowed bg-slate-100 border-slate-200 text-slate-400'
                                : 'text-rose-600 hover:bg-rose-50 border-slate-200/80 hover:border-rose-200'
                            }`}
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

        {/* Footer Summary */}
        <div className="p-4 bg-slate-50/70 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-500 kh-text">
          <div>
            បង្ហាញចំនួន <span className="font-semibold text-slate-800">{filteredUsers.length}</span> នៃគណនីសរុប{' '}
            <span className="font-semibold text-slate-800">{users.length}</span> គណនី
          </div>
          <div className="flex items-center gap-1.5 text-slate-400">
            <span>💡 ចំណាំ៖ ពាក្យសម្ងាត់អាចមើលឃើញ និងគ្រប់គ្រងបានផ្តាច់មុខដោយគណនី <b>ADMIN</b> ប៉ុណ្ណោះ។</span>
          </div>
        </div>
      </div>

      {/* QUICK RESET PASSWORD MODAL */}
      {quickPasswordUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-md overflow-hidden transform transition-all">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
              <div className="flex items-center gap-2">
                <span className="p-2 bg-indigo-100 text-indigo-700 rounded-xl text-lg">🔑</span>
                <div>
                  <h3 className="text-base font-bold text-slate-900 kh-text">
                    កំណត់ពាក្យសម្ងាត់ថ្មី (Password Reset)
                  </h3>
                  <p className="text-xs text-slate-500 font-mono">{quickPasswordUser.email}</p>
                </div>
              </div>
              <button
                onClick={() => setQuickPasswordUser(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5 kh-text">
                  ពាក្យសម្ងាត់ថ្មី (New Password)
                </label>
                <div className="relative">
                  <input
                    type={showQuickPassword ? 'text' : 'password'}
                    value={quickPasswordInput}
                    onChange={(e) => setQuickPasswordInput(e.target.value)}
                    placeholder="បញ្ចូលពាក្យសម្ងាត់ថ្មី..."
                    className="w-full px-3.5 py-2.5 text-sm font-mono border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all pr-20"
                  />
                  <div className="absolute inset-y-0 right-0 flex items-center pr-2 gap-1">
                    <button
                      type="button"
                      onClick={() => setShowQuickPassword(!showQuickPassword)}
                      className="p-1.5 text-slate-400 hover:text-slate-600 transition-colors"
                      title={showQuickPassword ? 'លាក់' : 'បង្ហាញ'}
                    >
                      {showQuickPassword ? '🙈' : '👁️'}
                    </button>
                  </div>
                </div>
              </div>

              {/* Quick Preset Buttons */}
              <div className="space-y-1.5">
                <span className="text-[11px] font-medium text-slate-400 kh-text">
                  ជម្រើសបង្កើតលេខសម្ងាត់រហ័ស (Quick Presets)៖
                </span>
                <div className="flex flex-wrap gap-1.5">
                  <button
                    type="button"
                    onClick={() => setQuickPasswordInput(generatePassword('Pass'))}
                    className="px-2.5 py-1 text-xs bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-lg hover:bg-indigo-100 transition-colors kh-text"
                  >
                    ⚡ ចៃដន្យ (Auto Generate)
                  </button>
                  <button
                    type="button"
                    onClick={() => setQuickPasswordInput('123456')}
                    className="px-2.5 py-1 text-xs bg-slate-100 text-slate-700 border border-slate-200 rounded-lg hover:bg-slate-200 transition-colors font-mono"
                  >
                    123456
                  </button>
                  <button
                    type="button"
                    onClick={() => setQuickPasswordInput('Bora@8083')}
                    className="px-2.5 py-1 text-xs bg-slate-100 text-slate-700 border border-slate-200 rounded-lg hover:bg-slate-200 transition-colors font-mono"
                  >
                    Bora@8083
                  </button>
                  {quickPasswordUser.employee?.dob && (
                    <button
                      type="button"
                      onClick={() => {
                        const d = new Date(quickPasswordUser.employee!.dob!);
                        const pad = (n: number) => String(n).padStart(2, '0');
                        setQuickPasswordInput(`${pad(d.getDate())}${pad(d.getMonth() + 1)}${d.getFullYear()}`);
                      }}
                      className="px-2.5 py-1 text-xs bg-amber-50 text-amber-800 border border-amber-200 rounded-lg hover:bg-amber-100 transition-colors kh-text"
                    >
                      📅 ថ្ងៃខែកំណើតបុគ្គលិក
                    </button>
                  )}
                </div>
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setQuickPasswordUser(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200 rounded-xl transition-colors kh-text"
              >
                បោះបង់
              </button>
              <button
                type="button"
                onClick={handleSaveQuickPassword}
                disabled={loading}
                className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 active:scale-95 rounded-xl shadow-xs transition-all kh-text"
              >
                {loading ? 'កំពុងរក្សាទុក...' : 'រក្សាទុកពាក្យសម្ងាត់'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CREATE / EDIT USER MODAL */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-lg overflow-hidden transform transition-all">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
              <div className="flex items-center gap-2.5">
                <span className="p-2 bg-indigo-100 text-indigo-700 rounded-xl text-lg">
                  {editingUser ? '✏️' : '➕'}
                </span>
                <div>
                  <h2 className="text-base font-bold text-slate-900 kh-text">
                    {editingUser ? 'កែប្រែគណនីអ្នកប្រើប្រាស់' : 'បង្កើតគណនីអ្នកប្រើប្រាស់ថ្មី'}
                  </h2>
                  <p className="text-xs text-slate-500 kh-text">
                    {editingUser ? 'ផ្លាស់ប្តូរ Role, Employee, ឬលេខសម្ងាត់' : 'បំពេញព័ត៌មានបង្កើតគណនីថ្មី'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            {error && (
              <div className="mx-5 mt-4 p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 kh-text flex items-center gap-2">
                <span>⚠️</span>
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              {/* Email / Username */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5 kh-text">
                  អ៊ីមែល ឬ Username (Email / Username) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  name="email"
                  defaultValue={editingUser?.email || ''}
                  required
                  placeholder="ឧ. bora@company.com ឬ EM-0001"
                  className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all placeholder:text-slate-400 font-mono"
                />
              </div>

              {/* Password */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-slate-700 kh-text">
                    ពាក្យសម្ងាត់ (Password){' '}
                    {editingUser && (
                      <span className="text-[11px] text-slate-400 font-normal">
                        (ទុកទទេប្រសិនបើមិនចង់ប្តូរ)
                      </span>
                    )}
                  </label>
                  <button
                    type="button"
                    onClick={() => setModalPassword(generatePassword(editingUser ? 'Pass' : 'User'))}
                    className="text-[11px] text-indigo-600 hover:text-indigo-800 font-medium kh-text"
                  >
                    ⚡ បង្កើតចៃដន្យ
                  </button>
                </div>
                <div className="relative">
                  <input
                    type={showModalPassword ? 'text' : 'password'}
                    name="password"
                    value={modalPassword}
                    onChange={(e) => setModalPassword(e.target.value)}
                    required={!editingUser}
                    placeholder={editingUser ? 'បញ្ចូលលេខសម្ងាត់ថ្មី (បើចង់ប្តូរ)...' : 'បញ្ចូលលេខសម្ងាត់...'}
                    className="w-full px-3.5 py-2.5 text-sm font-mono border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all pr-12"
                  />
                  <button
                    type="button"
                    onClick={() => setShowModalPassword(!showModalPassword)}
                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-600"
                  >
                    {showModalPassword ? '🙈' : '👁️'}
                  </button>
                </div>
              </div>

              {/* Role Selector */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5 kh-text">
                  សិទ្ធិ & តួនាទី (System Role) <span className="text-rose-500">*</span>
                </label>
                <select
                  name="role"
                  defaultValue={editingUser?.role || 'EMPLOYEE'}
                  className="w-full px-3.5 py-2.5 text-xs md:text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all kh-text bg-white"
                >
                  <option value="ADMIN">👑 ADMIN - អ្នកគ្រប់គ្រងប្រព័ន្ធ (មើលឃើញ & កែប្រែបានទាំងអស់)</option>
                  <option value="HR_MANAGER">💼 HR_MANAGER - អ្នកគ្រប់គ្រងធនធានមនុស្ស (HR & បុគ្គលិក)</option>
                  <option value="PAYROLL_ADMIN">💰 PAYROLL_ADMIN - អ្នកធ្វើប្រាក់ខែ (គណនាប្រាក់ខែ & កម្ចី)</option>
                  <option value="DEPT_HEAD">🏢 DEPT_HEAD - ប្រធានផ្នែក (អនុម័តច្បាប់ & ថែមម៉ោង OT)</option>
                  <option value="EMPLOYEE">📱 EMPLOYEE - បុគ្គលិកទូទៅ (ប្រើតែ Employee Self-Service)</option>
                </select>
                <p className="text-[11px] text-slate-400 mt-1 kh-text">
                  * សម្រាប់បុគ្គលិកទូទៅ សូមជ្រើសរើស <b>EMPLOYEE</b> ដើម្បីកំណត់ឱ្យពួកគាត់ប្រើតែមុខងារ Employee Self-Service។
                </p>
              </div>

              {/* Link Employee Profile */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5 kh-text">
                  ភ្ជាប់គណនីនេះជាមួយបុគ្គលិក (Link Employee Profile)
                </label>
                <select
                  name="employeeId"
                  defaultValue={editingUser?.employee?.id || ''}
                  className="w-full px-3.5 py-2.5 text-xs md:text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all kh-text bg-white"
                >
                  <option value="">— មិនទាន់ភ្ជាប់ (Unlinked) —</option>
                  {employees.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.employeeId} - {emp.firstNameKh || emp.firstNameEn} {emp.lastNameKh || emp.lastNameEn} ({emp.department} • {emp.position})
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-slate-400 mt-1 kh-text">
                  * ការភ្ជាប់ជាមួយបុគ្គលិក ជួយឱ្យប្រព័ន្ធដឹងថាគាត់ជាបុគ្គលិកណា ដើម្បីទាញទិន្នន័យប្រាក់ខែ និងវត្តមានមកបង្ហាញក្នុង Self-Service។
                </p>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors kh-text"
                >
                  បោះបង់
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 active:scale-95 rounded-xl shadow-xs transition-all kh-text"
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
