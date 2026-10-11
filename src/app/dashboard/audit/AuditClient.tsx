'use client';

import React, { useState, useMemo } from 'react';
import Swal from 'sweetalert2';
import * as XLSX from 'xlsx';

interface AuditLog {
  id: string;
  action: string;
  module: string;
  userId?: string | null;
  userName?: string | null;
  userRole?: string | null;
  targetId?: string | null;
  targetName?: string | null;
  details?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  status: string; // SUCCESS, WARNING, FAILED
  createdAt: string;
}

interface AuditClientProps {
  initialLogs: AuditLog[];
  currentUserRole: string;
}

const MODULE_CONFIG: Record<string, { labelKh: string; labelEn: string; icon: string; bg: string; text: string }> = {
  EMPLOYEES: { labelKh: 'ព័ត៌មានបុគ្គលិក', labelEn: 'Employees', icon: '👥', bg: '#eff6ff', text: '#1d4ed8' },
  PAYROLL: { labelKh: 'បើកប្រាក់បៀវត្ស', labelEn: 'Payroll', icon: '💰', bg: '#f0fdf4', text: '#15803d' },
  LOANS: { labelKh: 'ប្រាក់កម្ចីបុគ្គលិក', labelEn: 'Loans', icon: '💳', bg: '#fdf4ff', text: '#a21caf' },
  ATTENDANCE: { labelKh: 'វត្តមានការងារ', labelEn: 'Attendance', icon: '📅', bg: '#fffbeb', text: '#b45309' },
  BIOMETRIC: { labelKh: 'ស្កេនមេដៃ', labelEn: 'Biometrics', icon: '📲', bg: '#ecfeff', text: '#0e7490' },
  LEAVE: { labelKh: 'ច្បាប់ឈប់សម្រាក', labelEn: 'Leave', icon: '🌴', bg: '#fef3c7', text: '#92400e' },
  DISCIPLINARY: { labelKh: 'វិធានការវិន័យ', labelEn: 'Disciplinary', icon: '⚖️', bg: '#fee2e2', text: '#b91c1c' },
  USERS: { labelKh: 'គណនីប្រព័ន្ធ', labelEn: 'User Accounts', icon: '🔐', bg: '#ede9fe', text: '#6d28d9' },
  SETTINGS: { labelKh: 'ការកំណត់ប្រព័ន្ធ', labelEn: 'Settings', icon: '⚙️', bg: '#f1f5f9', text: '#475569' },
};

const ACTION_CONFIG: Record<string, { labelKh: string; labelEn: string; icon: string; bg: string; text: string }> = {
  CREATE: { labelKh: 'បង្កើតថ្មី', labelEn: 'Create', icon: '➕', bg: '#dcfce7', text: '#16a34a' },
  UPDATE: { labelKh: 'កែប្រែទិន្នន័យ', labelEn: 'Update', icon: '✏️', bg: '#e0f2fe', text: '#0284c7' },
  DELETE: { labelKh: 'លុបទិន្នន័យ', labelEn: 'Delete', icon: '🗑️', bg: '#fee2e2', text: '#dc2626' },
  LOGIN: { labelKh: 'ចូលប្រព័ន្ធ', labelEn: 'Login', icon: '🔑', bg: '#f5f3ff', text: '#7c3aed' },
  LOGOUT: { labelKh: 'ចាកចេញ', labelEn: 'Logout', icon: '🚪', bg: '#f1f5f9', text: '#64748b' },
  EXPORT_EXCEL: { labelKh: 'ទាញយក Excel', labelEn: 'Export', icon: '📥', bg: '#ecfdf5', text: '#059669' },
  PAYROLL_RUN: { labelKh: 'ដំណើរការប្រាក់ខែ', labelEn: 'Payroll Run', icon: '💵', bg: '#fef3c7', text: '#d97706' },
  APPROVE: { labelKh: 'អនុម័ត', labelEn: 'Approve', icon: '✅', bg: '#d1fae5', text: '#047857' },
  REJECT: { labelKh: 'បដិសេធ', labelEn: 'Reject', icon: '❌', bg: '#ffe4e6', text: '#e11d48' },
};

export default function AuditClient({
  initialLogs,
  currentUserRole,
}: AuditClientProps) {
  const isAdmin = currentUserRole === 'ADMIN';

  const [logs, setLogs] = useState<AuditLog[]>(initialLogs);
  const [searchTerm, setSearchTerm] = useState('');
  const [moduleFilter, setModuleFilter] = useState('ALL');
  const [actionFilter, setActionFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [dateFilter, setDateFilter] = useState('');

  // Modals
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isPurgeModalOpen, setIsPurgeModalOpen] = useState(false);
  const [purgeDays, setPurgeDays] = useState('90');
  const [isPurging, setIsPurging] = useState(false);

  // Metrics
  const metrics = useMemo(() => {
    const total = logs.length;
    const successCount = logs.filter((l) => l.status === 'SUCCESS').length;
    const modCount = logs.filter((l) => ['CREATE', 'UPDATE', 'DELETE', 'PAYROLL_RUN'].includes(l.action)).length;
    const warningCount = logs.filter((l) => ['WARNING', 'FAILED'].includes(l.status)).length;

    return { total, successCount, modCount, warningCount };
  }, [logs]);

  // Filtered Logs
  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      if (moduleFilter !== 'ALL' && log.module !== moduleFilter) return false;
      if (actionFilter !== 'ALL' && log.action !== actionFilter) return false;
      if (statusFilter !== 'ALL' && log.status !== statusFilter) return false;
      if (dateFilter && !log.createdAt.startsWith(dateFilter)) return false;

      if (!searchTerm) return true;
      const term = searchTerm.toLowerCase();
      const user = (log.userName || '').toLowerCase();
      const target = (log.targetName || '').toLowerCase();
      const details = (log.details || '').toLowerCase();
      const ip = (log.ipAddress || '').toLowerCase();

      return user.includes(term) || target.includes(term) || details.includes(term) || ip.includes(term);
    });
  }, [logs, moduleFilter, actionFilter, statusFilter, dateFilter, searchTerm]);

  // Handle Purge Logs
  const handlePurgeLogs = async (e: React.FormEvent) => {
    e.preventDefault();
    const days = parseInt(purgeDays, 10);

    const confirm = await Swal.fire({
      title: `តើអ្នកប្រាកដទេ?`,
      text: `ទិន្នន័យកំណត់ត្រាសវនកម្មដែលមានអាយុចាស់ជាង ${days} ថ្ងៃ នឹងត្រូវលុបជាអចិន្ត្រៃយ៍!`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'បាទ/ចាស លុបចេញ',
      cancelButtonText: 'បោះបង់',
    });

    if (!confirm.isConfirmed) return;

    setIsPurging(true);
    try {
      const res = await fetch(`/api/audit?purgeDays=${days}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Purge failed');

      setIsPurgeModalOpen(false);
      // Refresh current logs locally
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - days);
      setLogs((prev) => prev.filter((l) => new Date(l.createdAt) >= cutoff));

      Swal.fire({
        icon: 'success',
        title: 'បានសម្អាតទិន្នន័យជោគជ័យ!',
        text: `បានលុបកំណត់ត្រាចំនួន ${data.deletedCount} រួចរាល់!`,
        confirmButtonColor: '#2563eb',
      });
    } catch (err: any) {
      Swal.fire('Error', err.message, 'error');
    } finally {
      setIsPurging(false);
    }
  };

  // Excel Export with 3 languages stacked and autoFitColumns
  const handleExportExcel = () => {
    if (filteredLogs.length === 0) {
      Swal.fire('Info', 'គ្មានទិន្នន័យសម្រាប់ទាញយកទេ (No data to export)', 'info');
      return;
    }

    const exportData = filteredLogs.map((l, index) => {
      const modConf = MODULE_CONFIG[l.module] || { labelKh: l.module, labelEn: l.module };
      const actConf = ACTION_CONFIG[l.action] || { labelKh: l.action, labelEn: l.action };

      return {
        'ល.រ\nNo.\n序号': index + 1,
        'កាលបរិច្ឆេទ & ម៉ោង\nTimestamp\n操作时间': new Date(l.createdAt).toLocaleString(),
        'អ្នកប្រើប្រាស់\nUser / Operator\n操作人': `${l.userName || 'System'} (${l.userRole || 'USER'})`,
        'ផ្នែក / ម៉ូឌុល\nModule\n系统模块': `${modConf.labelKh} (${modConf.labelEn})`,
        'សកម្មភាព\nAction\n操作动作': `${actConf.labelKh} (${actConf.labelEn})`,
        'គោលដៅ / បុគ្គលិក\nTarget Record\n受影响对象': l.targetName || l.targetId || '-',
        'ព័ត៌មានលម្អិត\nAction Details\n操作详细': l.details || '-',
        'អាសយដ្ឋាន IP\nIP Address\nIP地址': l.ipAddress || '127.0.0.1',
        'ស្ថានភាព\nStatus\n执行状态': l.status,
      };
    });

    const autoFitColumns = (data: any[]) => {
      if (!data || data.length === 0) return [];
      const keys = Object.keys(data[0]);
      return keys.map((key) => {
        let maxLen = key.length;
        data.forEach((row) => {
          const val = row[key] !== undefined && row[key] !== null ? String(row[key]) : '';
          if (val.length > maxLen) maxLen = val.length;
        });
        return { wch: Math.max(maxLen + 4, 16) };
      });
    };

    const ws = XLSX.utils.json_to_sheet(exportData);
    ws['!cols'] = autoFitColumns(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'System_Audit_Trail');
    XLSX.writeFile(wb, `System_Audit_Trail_${new Date().toISOString().slice(0, 10)}.xlsx`);

    Swal.fire({
      icon: 'success',
      title: 'ទាញយកជោគជ័យ (Exported)',
      text: 'ឯកសារ Excel ត្រូវបានទាញយករួចរាល់!',
      timer: 1500,
      showConfirmButton: false,
    });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* 1. Header Banner */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '16px',
          background: '#ffffff',
          padding: '24px',
          borderRadius: '16px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.04)',
          border: '1px solid #f1f5f9',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div
            style={{
              width: '56px',
              height: '56px',
              borderRadius: '14px',
              background: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)',
              color: '#2563eb',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '28px',
              boxShadow: '0 4px 12px rgba(37, 99, 235, 0.15)',
            }}
          >
            🛡️
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 800, color: '#0f172a' }}>
              ប្រព័ន្ធកត់ត្រាសវនកម្ម និងប្រវត្តិសកម្មភាពប្រតិបត្តិការក្នុងប្រព័ន្ធ
            </h1>
            <p style={{ margin: '4px 0 0 0', color: '#64748b', fontSize: '0.86rem', fontWeight: 500 }}>
              Enterprise System Audit Trail & Security Activity Log • 系统安全审计与操作日志管理系统
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          {isAdmin && (
            <button
              onClick={() => setIsPurgeModalOpen(true)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                color: '#ffffff',
                border: 'none',
                borderRadius: '10px',
                padding: '10px 18px',
                fontWeight: 700,
                fontSize: '0.9rem',
                cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(239, 68, 68, 0.25)',
              }}
            >
              <span>🧹</span>
              <div style={{ textAlign: 'left', lineHeight: 1.2 }}>
                <div>សម្អាតកំណត់ត្រាចាស់ៗ</div>
                <div style={{ fontSize: '0.7rem', opacity: 0.85 }}>Purge Logs • 清理历史日志</div>
              </div>
            </button>
          )}

          <button
            onClick={handleExportExcel}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              background: 'linear-gradient(135deg, #10b981 0%, #047857 100%)',
              color: '#ffffff',
              border: 'none',
              borderRadius: '10px',
              padding: '10px 18px',
              fontWeight: 700,
              fontSize: '0.9rem',
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(16, 185, 129, 0.25)',
            }}
          >
            <span>📥</span>
            <div style={{ textAlign: 'left', lineHeight: 1.2 }}>
              <div>ទាញយកជា Excel</div>
              <div style={{ fontSize: '0.7rem', opacity: 0.85 }}>Export Excel • 导出表格</div>
            </div>
          </button>
        </div>
      </div>

      {/* 2. Metrics Cards (3 languages stacked) */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '16px',
        }}
      >
        {/* Metric 1 */}
        <div
          style={{
            background: '#ffffff',
            borderRadius: '16px',
            padding: '20px',
            border: '1px solid #f1f5f9',
            boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
          }}
        >
          <div
            style={{
              width: '52px',
              height: '52px',
              borderRadius: '12px',
              background: '#eff6ff',
              color: '#2563eb',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '24px',
            }}
          >
            📜
          </div>
          <div>
            <div style={{ fontWeight: 800, fontSize: '0.95rem', color: '#0f172a' }}>សរុបកំណត់ត្រាសវនកម្ម</div>
            <div style={{ fontSize: '0.72rem', color: '#64748b' }}>Total Audit Trails • 审计日志总数</div>
            <div style={{ fontSize: '1.6rem', fontWeight: 900, color: '#2563eb', marginTop: '2px' }}>
              {metrics.total} <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#64748b' }}>សកម្មភាព</span>
            </div>
          </div>
        </div>

        {/* Metric 2 */}
        <div
          style={{
            background: '#ffffff',
            borderRadius: '16px',
            padding: '20px',
            border: '1px solid #f1f5f9',
            boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
          }}
        >
          <div
            style={{
              width: '52px',
              height: '52px',
              borderRadius: '12px',
              background: '#f0fdf4',
              color: '#16a34a',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '24px',
            }}
          >
            ✅
          </div>
          <div>
            <div style={{ fontWeight: 800, fontSize: '0.95rem', color: '#0f172a' }}>ប្រតិបត្តិការជោគជ័យ</div>
            <div style={{ fontSize: '0.72rem', color: '#64748b' }}>Successful Actions • 成功操作记录</div>
            <div style={{ fontSize: '1.6rem', fontWeight: 900, color: '#16a34a', marginTop: '2px' }}>
              {metrics.successCount}{' '}
              <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#64748b' }}>ដង</span>
            </div>
          </div>
        </div>

        {/* Metric 3 */}
        <div
          style={{
            background: '#ffffff',
            borderRadius: '16px',
            padding: '20px',
            border: '1px solid #f1f5f9',
            boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
          }}
        >
          <div
            style={{
              width: '52px',
              height: '52px',
              borderRadius: '12px',
              background: '#f5f3ff',
              color: '#7c3aed',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '24px',
            }}
          >
            🔄
          </div>
          <div>
            <div style={{ fontWeight: 800, fontSize: '0.95rem', color: '#0f172a' }}>ការកែប្រែទិន្នន័យ</div>
            <div style={{ fontSize: '0.72rem', color: '#64748b' }}>Data Modifications • 数据修改与操作</div>
            <div style={{ fontSize: '1.6rem', fontWeight: 900, color: '#7c3aed', marginTop: '2px' }}>
              {metrics.modCount}{' '}
              <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#64748b' }}>ដង</span>
            </div>
          </div>
        </div>

        {/* Metric 4 */}
        <div
          style={{
            background: '#ffffff',
            borderRadius: '16px',
            padding: '20px',
            border: '1px solid #f1f5f9',
            boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
          }}
        >
          <div
            style={{
              width: '52px',
              height: '52px',
              borderRadius: '12px',
              background: '#fffbeb',
              color: '#d97706',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '24px',
            }}
          >
            ⚠️
          </div>
          <div>
            <div style={{ fontWeight: 800, fontSize: '0.95rem', color: '#0f172a' }}>ការព្រមាន ឬបរាជ័យ</div>
            <div style={{ fontSize: '0.72rem', color: '#64748b' }}>Warnings / Failures • 风险警报与失败</div>
            <div style={{ fontSize: '1.6rem', fontWeight: 900, color: '#d97706', marginTop: '2px' }}>
              {metrics.warningCount}{' '}
              <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#64748b' }}>ករណី</span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Filter Toolbar */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '14px',
          alignItems: 'center',
          background: '#ffffff',
          padding: '16px 20px',
          borderRadius: '14px',
          border: '1px solid #f1f5f9',
        }}
      >
        {/* Search */}
        <div style={{ flex: '1 1 240px', position: 'relative' }}>
          <input
            type="text"
            placeholder="ស្វែងរកតាមឈ្មោះអ្នកប្រើប្រាស់, គោលដៅ, IP... (Search)..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: '100%',
              padding: '10px 14px 10px 38px',
              borderRadius: '10px',
              border: '1px solid #cbd5e1',
              fontSize: '0.88rem',
              outline: 'none',
              boxSizing: 'border-box',
            }}
          />
          <span style={{ position: 'absolute', left: '12px', top: '10px', color: '#94a3b8' }}>🔍</span>
        </div>

        {/* Date Filter */}
        <div style={{ minWidth: '150px' }}>
          <input
            type="date"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            style={{
              width: '100%',
              padding: '10px 14px',
              borderRadius: '10px',
              border: '1px solid #cbd5e1',
              fontSize: '0.88rem',
              outline: 'none',
              boxSizing: 'border-box',
            }}
          />
        </div>

        {/* Module Filter */}
        <div style={{ minWidth: '170px' }}>
          <select
            value={moduleFilter}
            onChange={(e) => setModuleFilter(e.target.value)}
            style={{
              width: '100%',
              padding: '10px 14px',
              borderRadius: '10px',
              border: '1px solid #cbd5e1',
              fontSize: '0.88rem',
              background: '#ffffff',
              outline: 'none',
              fontWeight: 600,
            }}
          >
            <option value="ALL">📦 គ្រប់ម៉ូឌុល (All Modules)</option>
            {Object.entries(MODULE_CONFIG).map(([k, v]) => (
              <option key={k} value={k}>
                {v.icon} {v.labelKh} ({v.labelEn})
              </option>
            ))}
          </select>
        </div>

        {/* Action Filter */}
        <div style={{ minWidth: '170px' }}>
          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            style={{
              width: '100%',
              padding: '10px 14px',
              borderRadius: '10px',
              border: '1px solid #cbd5e1',
              fontSize: '0.88rem',
              background: '#ffffff',
              outline: 'none',
              fontWeight: 600,
            }}
          >
            <option value="ALL">⚡ គ្រប់សកម្មភាព (All Actions)</option>
            {Object.entries(ACTION_CONFIG).map(([k, v]) => (
              <option key={k} value={k}>
                {v.icon} {v.labelKh} ({v.labelEn})
              </option>
            ))}
          </select>
        </div>

        {/* Status Filter */}
        <div style={{ minWidth: '150px' }}>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{
              width: '100%',
              padding: '10px 14px',
              borderRadius: '10px',
              border: '1px solid #cbd5e1',
              fontSize: '0.88rem',
              background: '#ffffff',
              outline: 'none',
              fontWeight: 600,
            }}
          >
            <option value="ALL">📊 គ្រប់ស្ថានភាព (All)</option>
            <option value="SUCCESS">🟢 ជោគជ័យ (SUCCESS)</option>
            <option value="WARNING">🟡 ការព្រមាន (WARNING)</option>
            <option value="FAILED">🔴 បរាជ័យ (FAILED)</option>
          </select>
        </div>
      </div>

      {/* 4. Audit Log Table with 3-Languages Stacked */}
      <div
        style={{
          background: '#ffffff',
          borderRadius: '16px',
          border: '1px solid #e2e8f0',
          boxShadow: '0 4px 20px rgba(0,0,0,0.03)',
          overflow: 'hidden',
        }}
      >
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                {/* 1: Timestamp */}
                <th style={{ padding: '14px 16px', minWidth: '150px' }}>
                  <div style={{ fontWeight: 800, color: '#0f172a', fontSize: '0.88rem' }}>កាលបរិច្ឆេទ & ម៉ោង</div>
                  <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600 }}>Timestamp</div>
                  <div style={{ fontSize: '0.68rem', color: '#94a3b8' }}>操作时间</div>
                </th>

                {/* 2: Operator / User */}
                <th style={{ padding: '14px 16px', minWidth: '170px' }}>
                  <div style={{ fontWeight: 800, color: '#0f172a', fontSize: '0.88rem' }}>អ្នកប្រតិបត្តិ</div>
                  <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600 }}>User / Operator</div>
                  <div style={{ fontSize: '0.68rem', color: '#94a3b8' }}>操作人员</div>
                </th>

                {/* 3: Module */}
                <th style={{ padding: '14px 16px', minWidth: '140px' }}>
                  <div style={{ fontWeight: 800, color: '#0f172a', fontSize: '0.88rem' }}>ផ្នែក / ម៉ូឌុល</div>
                  <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600 }}>Module</div>
                  <div style={{ fontSize: '0.68rem', color: '#94a3b8' }}>系统模块</div>
                </th>

                {/* 4: Action */}
                <th style={{ padding: '14px 16px', minWidth: '140px' }}>
                  <div style={{ fontWeight: 800, color: '#0f172a', fontSize: '0.88rem' }}>សកម្មភាព</div>
                  <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600 }}>Action</div>
                  <div style={{ fontSize: '0.68rem', color: '#94a3b8' }}>操作动作</div>
                </th>

                {/* 5: Target Record */}
                <th style={{ padding: '14px 16px', minWidth: '180px' }}>
                  <div style={{ fontWeight: 800, color: '#0f172a', fontSize: '0.88rem' }}>ទិន្នន័យគោលដៅ</div>
                  <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600 }}>Target Record</div>
                  <div style={{ fontSize: '0.68rem', color: '#94a3b8' }}>受影响记录</div>
                </th>

                {/* 6: IP & Details */}
                <th style={{ padding: '14px 16px', minWidth: '180px' }}>
                  <div style={{ fontWeight: 800, color: '#0f172a', fontSize: '0.88rem' }}>ព័ត៌មាន & IP</div>
                  <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600 }}>Details & IP</div>
                  <div style={{ fontSize: '0.68rem', color: '#94a3b8' }}>详情与网络</div>
                </th>

                {/* 7: Status */}
                <th style={{ padding: '14px 16px', minWidth: '100px' }}>
                  <div style={{ fontWeight: 800, color: '#0f172a', fontSize: '0.88rem' }}>ស្ថានភាព</div>
                  <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600 }}>Status</div>
                  <div style={{ fontSize: '0.68rem', color: '#94a3b8' }}>执行状态</div>
                </th>

                {/* 8: Actions */}
                <th style={{ padding: '14px 16px', minWidth: '80px', textAlign: 'center' }}>
                  <div style={{ fontWeight: 800, color: '#0f172a', fontSize: '0.88rem' }}>សកម្មភាព</div>
                  <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600 }}>Actions</div>
                  <div style={{ fontSize: '0.68rem', color: '#94a3b8' }}>操作</div>
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ padding: '48px 16px', textAlign: 'center', color: '#94a3b8' }}>
                    <div style={{ fontSize: '40px', marginBottom: '8px' }}>📂</div>
                    <div style={{ fontSize: '1rem', fontWeight: 700, color: '#475569' }}>
                      មិនមានកំណត់ត្រាសវនកម្មទេ (No Audit Records)
                    </div>
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log, idx) => {
                  const modConf = MODULE_CONFIG[log.module] || {
                    labelKh: log.module,
                    labelEn: log.module,
                    icon: '📦',
                    bg: '#f1f5f9',
                    text: '#475569',
                  };
                  const actConf = ACTION_CONFIG[log.action] || {
                    labelKh: log.action,
                    labelEn: log.action,
                    icon: '⚡',
                    bg: '#f1f5f9',
                    text: '#475569',
                  };

                  const d = new Date(log.createdAt);
                  const dateStr = d.toLocaleDateString();
                  const timeStr = d.toTimeString().slice(0, 8);

                  return (
                    <tr
                      key={log.id}
                      style={{
                        borderBottom: '1px solid #f1f5f9',
                        background: idx % 2 === 0 ? '#ffffff' : '#fafafa',
                      }}
                    >
                      {/* Timestamp */}
                      <td style={{ padding: '14px 16px' }}>
                        <div style={{ fontWeight: 800, color: '#0f172a', fontSize: '0.88rem', fontFamily: 'monospace' }}>
                          {timeStr}
                        </div>
                        <div style={{ fontSize: '0.72rem', color: '#64748b' }}>📅 {dateStr}</div>
                      </td>

                      {/* User / Operator */}
                      <td style={{ padding: '14px 16px' }}>
                        <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.85rem' }}>
                          {log.userName || 'System User'}
                        </div>
                        <span
                          style={{
                            display: 'inline-block',
                            background: '#eff6ff',
                            color: '#1d4ed8',
                            padding: '2px 6px',
                            borderRadius: '4px',
                            fontSize: '0.7rem',
                            fontWeight: 700,
                            marginTop: '2px',
                          }}
                        >
                          {log.userRole || 'USER'}
                        </span>
                      </td>

                      {/* Module */}
                      <td style={{ padding: '14px 16px' }}>
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '5px',
                            background: modConf.bg,
                            color: modConf.text,
                            padding: '4px 8px',
                            borderRadius: '6px',
                            fontWeight: 700,
                            fontSize: '0.78rem',
                          }}
                        >
                          <span>{modConf.icon}</span>
                          <span>{modConf.labelKh}</span>
                        </span>
                      </td>

                      {/* Action */}
                      <td style={{ padding: '14px 16px' }}>
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '5px',
                            background: actConf.bg,
                            color: actConf.text,
                            padding: '4px 8px',
                            borderRadius: '6px',
                            fontWeight: 700,
                            fontSize: '0.78rem',
                          }}
                        >
                          <span>{actConf.icon}</span>
                          <span>{actConf.labelKh}</span>
                        </span>
                      </td>

                      {/* Target Record */}
                      <td style={{ padding: '14px 16px' }}>
                        <div style={{ fontWeight: 600, color: '#1e293b', fontSize: '0.82rem' }}>
                          {log.targetName || log.targetId || '-'}
                        </div>
                      </td>

                      {/* Details & IP */}
                      <td style={{ padding: '14px 16px' }}>
                        <div
                          style={{
                            fontSize: '0.78rem',
                            color: '#334155',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            maxWidth: '180px',
                          }}
                        >
                          {log.details || '-'}
                        </div>
                        <div style={{ fontSize: '0.7rem', color: '#94a3b8', fontFamily: 'monospace' }}>
                          🌐 {log.ipAddress || '127.0.0.1'}
                        </div>
                      </td>

                      {/* Status */}
                      <td style={{ padding: '14px 16px' }}>
                        <span
                          style={{
                            background:
                              log.status === 'SUCCESS' ? '#dcfce7' : log.status === 'WARNING' ? '#fef3c7' : '#fee2e2',
                            color:
                              log.status === 'SUCCESS' ? '#15803d' : log.status === 'WARNING' ? '#b45309' : '#b91c1c',
                            padding: '3px 8px',
                            borderRadius: '6px',
                            fontSize: '0.72rem',
                            fontWeight: 700,
                          }}
                        >
                          ● {log.status}
                        </span>
                      </td>

                      {/* View Action */}
                      <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                        <button
                          title="មើលព័ត៌មានលម្អិត (View Details)"
                          onClick={() => {
                            setSelectedLog(log);
                            setIsDetailModalOpen(true);
                          }}
                          style={{
                            background: '#eff6ff',
                            border: '1px solid #bfdbfe',
                            color: '#1d4ed8',
                            padding: '6px 10px',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            fontSize: '0.85rem',
                          }}
                        >
                          🔍
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL 1: View Audit Details */}
      {isDetailModalOpen && selectedLog && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 999,
            background: 'rgba(15, 23, 42, 0.65)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
          }}
        >
          <div
            style={{
              background: '#ffffff',
              borderRadius: '20px',
              maxWidth: '600px',
              width: '100%',
              padding: '28px',
              boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
              border: '1px solid #e2e8f0',
              maxHeight: '90vh',
              overflowY: 'auto',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                borderBottom: '1px solid #e2e8f0',
                paddingBottom: '14px',
                marginBottom: '18px',
              }}
            >
              <div>
                <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: '#0f172a' }}>
                  ព័ត៌មានលម្អិតនៃសកម្មភាពសវនកម្ម
                </h3>
                <p style={{ margin: '4px 0 0 0', fontSize: '0.78rem', color: '#64748b' }}>
                  Detailed Security Audit Trail Entry • 操作记录详情
                </p>
              </div>
              <button
                onClick={() => setIsDetailModalOpen(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '24px',
                  color: '#94a3b8',
                  cursor: 'pointer',
                }}
              >
                &times;
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', fontSize: '0.85rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', background: '#f8fafc', padding: '14px', borderRadius: '12px' }}>
                <div>
                  <span style={{ color: '#64748b', display: 'block', fontSize: '0.75rem' }}>អ្នកប្រតិបត្តិ:</span>
                  <strong style={{ color: '#0f172a' }}>{selectedLog.userName} ({selectedLog.userRole})</strong>
                </div>
                <div>
                  <span style={{ color: '#64748b', display: 'block', fontSize: '0.75rem' }}>កាលបរិច្ឆេទ & ម៉ោង:</span>
                  <strong style={{ color: '#0f172a' }}>{new Date(selectedLog.createdAt).toLocaleString()}</strong>
                </div>
                <div>
                  <span style={{ color: '#64748b', display: 'block', fontSize: '0.75rem' }}>ផ្នែក / ម៉ូឌុល:</span>
                  <strong style={{ color: '#2563eb' }}>{selectedLog.module}</strong>
                </div>
                <div>
                  <span style={{ color: '#64748b', display: 'block', fontSize: '0.75rem' }}>ប្រភេទសកម្មភាព:</span>
                  <strong style={{ color: '#16a34a' }}>{selectedLog.action}</strong>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                  ទិន្នន័យគោលដៅ (Target):
                </label>
                <div style={{ background: '#f1f5f9', padding: '10px 14px', borderRadius: '8px', fontFamily: 'monospace' }}>
                  {selectedLog.targetName || selectedLog.targetId || 'N/A'}
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                  ព័ត៌មានលម្អិតនៃប្រតិបត្តិការ (Payload / Description):
                </label>
                <div
                  style={{
                    background: '#0f172a',
                    color: '#e2e8f0',
                    padding: '14px',
                    borderRadius: '10px',
                    fontFamily: 'monospace',
                    fontSize: '0.8rem',
                    lineHeight: 1.5,
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-all',
                    maxHeight: '160px',
                    overflowY: 'auto',
                  }}
                >
                  {selectedLog.details || 'No additional details logged.'}
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '10px', fontSize: '0.78rem', color: '#64748b' }}>
                <div>
                  <span>IP Address: </span>
                  <strong style={{ fontFamily: 'monospace', color: '#1e293b' }}>{selectedLog.ipAddress || '127.0.0.1'}</strong>
                </div>
                <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  <span>User Agent: </span>
                  <span style={{ color: '#1e293b' }}>{selectedLog.userAgent || 'Web Client'}</span>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '20px' }}>
              <button
                onClick={() => setIsDetailModalOpen(false)}
                style={{
                  padding: '8px 18px',
                  borderRadius: '10px',
                  border: '1px solid #cbd5e1',
                  background: '#ffffff',
                  color: '#475569',
                  fontWeight: 600,
                  cursor: 'pointer',
                  fontSize: '0.85rem',
                }}
              >
                បិទផ្ទាំង (Close)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: Purge Historical Logs */}
      {isPurgeModalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 999,
            background: 'rgba(15, 23, 42, 0.65)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
          }}
        >
          <div
            style={{
              background: '#ffffff',
              borderRadius: '20px',
              maxWidth: '460px',
              width: '100%',
              padding: '26px',
              boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
              border: '1px solid #e2e8f0',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                borderBottom: '1px solid #e2e8f0',
                paddingBottom: '12px',
                marginBottom: '16px',
              }}
            >
              <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: '#dc2626' }}>
                សម្អាតប្រវត្តិសវនកម្ម (Purge Logs)
              </h3>
              <button
                onClick={() => setIsPurgeModalOpen(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '24px',
                  color: '#94a3b8',
                  cursor: 'pointer',
                }}
              >
                &times;
              </button>
            </div>

            <p style={{ fontSize: '0.82rem', color: '#64748b', margin: '0 0 16px 0' }}>
              ជ្រើសរើសចន្លោះពេលដើម្បីលុបកំណត់ត្រាចាស់ៗចេញពី Database ដើម្បីកាត់បន្ថយទំហំផ្ទុក៖
            </p>

            <form onSubmit={handlePurgeLogs} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                  លុបកំណត់ត្រាដែលមានអាយុកាលចាស់ជាង:
                </label>
                <select
                  value={purgeDays}
                  onChange={(e) => setPurgeDays(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '10px',
                    border: '1px solid #cbd5e1',
                    fontSize: '0.88rem',
                    background: '#ffffff',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                >
                  <option value="30">ចាស់ជាង 30 ថ្ងៃ (1 ខែមុន)</option>
                  <option value="60">ចាស់ជាង 60 ថ្ងៃ (2 ខែមុន)</option>
                  <option value="90">ចាស់ជាង 90 ថ្ងៃ (3 ខែមុន - ណែនាំ)</option>
                  <option value="180">ចាស់ជាង 180 ថ្ងៃ (កន្លះឆ្នាំមុន)</option>
                  <option value="365">ចាស់ជាង 365 ថ្ងៃ (1 ឆ្នាំមុន)</option>
                </select>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button
                  type="button"
                  onClick={() => setIsPurgeModalOpen(false)}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    background: '#ffffff',
                    color: '#64748b',
                    fontSize: '0.85rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  បោះបង់
                </button>
                <button
                  type="submit"
                  disabled={isPurging}
                  style={{
                    padding: '8px 18px',
                    borderRadius: '8px',
                    border: 'none',
                    background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                    color: '#ffffff',
                    fontSize: '0.85rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  {isPurging ? 'កំពុងសម្អាត...' : 'បញ្ជាក់ការលុប'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
