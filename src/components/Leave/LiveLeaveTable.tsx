'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import LeaveStatusClient from '@/app/dashboard/leave/LeaveStatusClient';

interface LeaveRequest {
  id: string;
  leaveType: string;
  startDate: string;
  endDate: string;
  duration: number;
  reason: string;
  status: string;
  employee: any;
}

interface LiveLeaveTableProps {
  leaveRequests: LeaveRequest[];
  dictionary: any;
}

export default function LiveLeaveTable({ leaveRequests, dictionary: t }: LiveLeaveTableProps) {
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('ALL');

  const totalRequests = leaveRequests.length;
  const pendingCount = useMemo(() => leaveRequests.filter(r => r.status === 'PENDING').length, [leaveRequests]);
  const approvedCount = useMemo(() => leaveRequests.filter(r => r.status === 'APPROVED').length, [leaveRequests]);
  const rejectedCount = useMemo(() => leaveRequests.filter(r => r.status === 'REJECTED').length, [leaveRequests]);

  const filteredRequests = useMemo(() => {
    return leaveRequests.filter(req => {
      if (statusFilter !== 'ALL' && req.status !== statusFilter) return false;
      if (typeFilter !== 'ALL' && req.leaveType !== typeFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const empNameKh = `${req.employee?.firstNameKh || ''} ${req.employee?.lastNameKh || ''}`.toLowerCase();
        const empNameEn = `${req.employee?.firstNameEn || ''} ${req.employee?.lastNameEn || ''}`.toLowerCase();
        const empId = (req.employee?.employeeId || '').toLowerCase();
        const reason = (req.reason || '').toLowerCase();
        if (!empNameKh.includes(q) && !empNameEn.includes(q) && !empId.includes(q) && !reason.includes(q)) {
          return false;
        }
      }
      return true;
    });
  }, [leaveRequests, statusFilter, typeFilter, searchQuery]);

  const getTypeLabel = (type: string) => {
    return t?.leave?.types?.[type] || type;
  };

  const getStatusBadge = (status: string) => {
    if (status === 'APPROVED') {
      return {
        bg: '#dcfce7',
        color: '#15803d',
        border: '#86efac',
        label: t?.leave?.status?.APPROVED || 'អនុម័ត'
      };
    }
    if (status === 'REJECTED') {
      return {
        bg: '#fee2e2',
        color: '#b91c1c',
        border: '#fca5a5',
        label: t?.leave?.status?.REJECTED || 'បដិសេធ'
      };
    }
    return {
      bg: '#fef3c7',
      color: '#b45309',
      border: '#fcd34d',
      label: t?.leave?.status?.PENDING || 'រង់ចាំ'
    };
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* 1. Header Banner */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        flexWrap: 'wrap', 
        gap: '16px',
        backgroundColor: '#ffffff',
        padding: '18px 24px',
        borderRadius: '14px',
        border: '1px solid #e2e8f0',
        boxShadow: '0 1px 3px rgba(0,0,0,0.03)'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '1.6rem' }}>🌴</span>
            <div>
              <h1 className="kh-text" style={{ fontSize: '1.35rem', fontWeight: 700, margin: 0, color: '#0f172a' }}>
                គ្រប់គ្រងការសុំច្បាប់ (Leave Management)
              </h1>
              <p style={{ margin: '2px 0 0 0', fontSize: '0.85rem', color: '#64748b' }}>
                តាមដាន និងអនុម័តពាក្យស្នើសុំច្បាប់ឈប់សម្រាករបស់បុគ្គលិកទាំងអស់
              </p>
            </div>
          </div>
        </div>

        <Link 
          href="/dashboard/leave/new" 
          className="btn-primary kh-text" 
          style={{ 
            textDecoration: 'none', 
            display: 'inline-flex', 
            alignItems: 'center', 
            gap: '8px',
            padding: '10px 20px',
            borderRadius: '10px',
            fontWeight: 600,
            fontSize: '0.9rem'
          }}
        >
          <span>➕</span>
          <span>{t?.leave?.newBtn || '+ បញ្ចូលច្បាប់'}</span>
        </Link>
      </div>

      {/* 2. Standard Metric Cards */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', 
        gap: '14px' 
      }}>
        {/* Total Card */}
        <div 
          onClick={() => setStatusFilter('ALL')}
          style={{ 
            cursor: 'pointer',
            padding: '16px 20px', 
            borderRadius: '12px', 
            background: statusFilter === 'ALL' ? '#eff6ff' : '#ffffff', 
            border: `1.5px solid ${statusFilter === 'ALL' ? '#3b82f6' : '#e2e8f0'}`,
            boxShadow: statusFilter === 'ALL' ? '0 4px 12px rgba(59, 130, 246, 0.12)' : '0 1px 2px rgba(0,0,0,0.04)',
            transition: 'all 0.2s ease',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}
        >
          <div>
            <div className="kh-text" style={{ color: '#64748b', fontSize: '0.85rem', fontWeight: 500, marginBottom: '4px' }}>
              សរុបទាំងអស់ (Total)
            </div>
            <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0f172a' }}>
              {totalRequests}
            </div>
          </div>
          <div style={{ 
            width: '42px', 
            height: '42px', 
            borderRadius: '10px', 
            backgroundColor: '#f1f5f9', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            fontSize: '1.25rem'
          }}>
            📋
          </div>
        </div>

        {/* Pending Card */}
        <div 
          onClick={() => setStatusFilter('PENDING')}
          style={{ 
            cursor: 'pointer',
            padding: '16px 20px', 
            borderRadius: '12px', 
            background: statusFilter === 'PENDING' ? '#fffbeb' : '#ffffff', 
            border: `1.5px solid ${statusFilter === 'PENDING' ? '#f59e0b' : '#e2e8f0'}`,
            boxShadow: statusFilter === 'PENDING' ? '0 4px 12px rgba(245, 158, 11, 0.15)' : '0 1px 2px rgba(0,0,0,0.04)',
            transition: 'all 0.2s ease',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}
        >
          <div>
            <div className="kh-text" style={{ color: '#854d0e', fontSize: '0.85rem', fontWeight: 500, marginBottom: '4px' }}>
              រង់ចាំអនុម័ត (Pending)
            </div>
            <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#d97706' }}>
              {pendingCount}
            </div>
          </div>
          <div style={{ 
            width: '42px', 
            height: '42px', 
            borderRadius: '10px', 
            backgroundColor: '#fef3c7', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            fontSize: '1.25rem'
          }}>
            ⏳
          </div>
        </div>

        {/* Approved Card */}
        <div 
          onClick={() => setStatusFilter('APPROVED')}
          style={{ 
            cursor: 'pointer',
            padding: '16px 20px', 
            borderRadius: '12px', 
            background: statusFilter === 'APPROVED' ? '#f0fdf4' : '#ffffff', 
            border: `1.5px solid ${statusFilter === 'APPROVED' ? '#10b981' : '#e2e8f0'}`,
            boxShadow: statusFilter === 'APPROVED' ? '0 4px 12px rgba(16, 185, 129, 0.15)' : '0 1px 2px rgba(0,0,0,0.04)',
            transition: 'all 0.2s ease',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}
        >
          <div>
            <div className="kh-text" style={{ color: '#166534', fontSize: '0.85rem', fontWeight: 500, marginBottom: '4px' }}>
              អនុម័តរួច (Approved)
            </div>
            <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#16a34a' }}>
              {approvedCount}
            </div>
          </div>
          <div style={{ 
            width: '42px', 
            height: '42px', 
            borderRadius: '10px', 
            backgroundColor: '#dcfce7', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            fontSize: '1.25rem'
          }}>
            ✅
          </div>
        </div>

        {/* Rejected Card */}
        <div 
          onClick={() => setStatusFilter('REJECTED')}
          style={{ 
            cursor: 'pointer',
            padding: '16px 20px', 
            borderRadius: '12px', 
            background: statusFilter === 'REJECTED' ? '#fef2f2' : '#ffffff', 
            border: `1.5px solid ${statusFilter === 'REJECTED' ? '#ef4444' : '#e2e8f0'}`,
            boxShadow: statusFilter === 'REJECTED' ? '0 4px 12px rgba(239, 68, 68, 0.15)' : '0 1px 2px rgba(0,0,0,0.04)',
            transition: 'all 0.2s ease',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}
        >
          <div>
            <div className="kh-text" style={{ color: '#991b1b', fontSize: '0.85rem', fontWeight: 500, marginBottom: '4px' }}>
              បដិសេធ (Rejected)
            </div>
            <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#dc2626' }}>
              {rejectedCount}
            </div>
          </div>
          <div style={{ 
            width: '42px', 
            height: '42px', 
            borderRadius: '10px', 
            backgroundColor: '#fee2e2', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            fontSize: '1.25rem'
          }}>
            ❌
          </div>
        </div>
      </div>

      {/* 3. Search and Filters Toolbar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '12px',
        flexWrap: 'wrap',
        backgroundColor: '#ffffff',
        padding: '12px 18px',
        borderRadius: '12px',
        border: '1px solid #e2e8f0',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, minWidth: '260px' }}>
          <span style={{ color: '#94a3b8', fontSize: '1rem' }}>🔍</span>
          <input 
            type="text"
            placeholder="ស្វែងរកតាមឈ្មោះ ឬអត្តលេខបុគ្គលិក (Search by name or ID)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="kh-text"
            style={{
              width: '100%',
              border: 'none',
              outline: 'none',
              fontSize: '0.9rem',
              backgroundColor: 'transparent',
              color: '#0f172a'
            }}
          />
          {searchQuery && (
            <button 
              onClick={() => setSearchQuery('')}
              style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: '0.85rem' }}
            >
              ✕
            </button>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="kh-text"
            style={{
              padding: '6px 12px',
              borderRadius: '8px',
              border: '1px solid #cbd5e1',
              backgroundColor: '#f8fafc',
              fontSize: '0.85rem',
              color: '#334155',
              cursor: 'pointer'
            }}
          >
            <option value="ALL">ប្រភេទច្បាប់ទាំងអស់ (All Types)</option>
            <option value="ANNUAL">ច្បាប់ប្រចាំឆ្នាំ (Annual)</option>
            <option value="SICK">ច្បាប់ឈឺ (Sick)</option>
            <option value="MATERNITY">ច្បាប់លំហែមាតុភាព (Maternity)</option>
            <option value="UNPAID">សម្រាកគ្មានប្រាក់ខែ (Unpaid)</option>
            <option value="OTHER">ផ្សេងៗ (Other)</option>
          </select>

          <span style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 500 }} className="kh-text">
            សរុប {filteredRequests.length} កំណត់ត្រា
          </span>
        </div>
      </div>

      {/* 4. Standard Fit-Content Table */}
      <div style={{ 
        backgroundColor: '#ffffff',
        borderRadius: '12px', 
        border: '1px solid #e2e8f0',
        overflow: 'hidden',
        boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
      }}>
        <div style={{ overflowX: 'auto', maxHeight: 'calc(100vh - 380px)', minHeight: filteredRequests.length === 0 ? '280px' : 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '950px' }}>
            <thead>
              <tr style={{ backgroundColor: '#f8fafc', position: 'sticky', top: 0, zIndex: 10 }}>
                <th style={thStyle} className="kh-text">
                  <div>បុគ្គលិក (Employee)</div>
                  <span style={{ fontSize: '0.75rem', fontWeight: 400, color: '#94a3b8' }}>员工信息</span>
                </th>
                <th style={thStyle} className="kh-text">
                  <div>ប្រភេទច្បាប់ (Type)</div>
                  <span style={{ fontSize: '0.75rem', fontWeight: 400, color: '#94a3b8' }}>请假类型</span>
                </th>
                <th style={thStyle} className="kh-text">
                  <div>កាលបរិច្ឆេទ (Date)</div>
                  <span style={{ fontSize: '0.75rem', fontWeight: 400, color: '#94a3b8' }}>起止日期</span>
                </th>
                <th style={{ ...thStyle, textAlign: 'center' }} className="kh-text">
                  <div>ចំនួនថ្ងៃ (Days)</div>
                  <span style={{ fontSize: '0.75rem', fontWeight: 400, color: '#94a3b8' }}>请假天数</span>
                </th>
                <th style={thStyle} className="kh-text">
                  <div>ច្បាប់នៅសល់ (Balance)</div>
                  <span style={{ fontSize: '0.75rem', fontWeight: 400, color: '#94a3b8' }}>剩余年假</span>
                </th>
                <th style={{ ...thStyle, textAlign: 'center' }} className="kh-text">
                  <div>ស្ថានភាព (Status)</div>
                  <span style={{ fontSize: '0.75rem', fontWeight: 400, color: '#94a3b8' }}>审核状态</span>
                </th>
                <th style={{ ...thStyle, textAlign: 'center' }} className="kh-text">
                  <div>សកម្មភាព (Actions)</div>
                  <span style={{ fontSize: '0.75rem', fontWeight: 400, color: '#94a3b8' }}>操作</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredRequests.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ padding: '60px 20px', textAlign: 'center' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
                      <div style={{ 
                        width: '54px', 
                        height: '54px', 
                        borderRadius: '50%', 
                        backgroundColor: '#f1f5f9', 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center',
                        fontSize: '1.6rem'
                      }}>
                        🍃
                      </div>
                      <div className="kh-text" style={{ fontSize: '1.05rem', fontWeight: 600, color: '#334155' }}>
                        មិនមានទិន្នន័យច្បាប់ឈប់សម្រាកនៅឡើយទេ
                      </div>
                      <div className="kh-text" style={{ fontSize: '0.85rem', color: '#94a3b8', maxWidth: '380px' }}>
                        ពាក្យស្នើសុំច្បាប់របស់បុគ្គលិកនឹងបង្ហាញនៅត្រង់នេះ។ បងអាចចុចប៊ូតុងខាងក្រោមដើម្បីបង្កើតច្បាប់ថ្មី។
                      </div>
                      <Link 
                        href="/dashboard/leave/new" 
                        className="btn-secondary kh-text" 
                        style={{ marginTop: '8px', padding: '6px 16px', fontSize: '0.85rem', textDecoration: 'none' }}
                      >
                        ➕ បញ្ចូលពាក្យសុំច្បាប់ថ្មី
                      </Link>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredRequests.map((leave, index) => {
                  const annualLeaveDays = leave.employee?.annualLeaveDays || 18;
                  const statusInfo = getStatusBadge(leave.status);

                  return (
                    <tr 
                      key={leave.id} 
                      style={{ 
                        backgroundColor: index % 2 === 1 ? 'rgba(248, 250, 252, 0.6)' : '#ffffff',
                        transition: 'background-color 0.15s ease'
                      }}
                      className="hover:bg-indigo-50/40"
                    >
                      <td style={tdStyle}>
                        <div className="kh-text" style={{ fontWeight: 600, color: '#0f172a', fontSize: '0.92rem' }}>
                          {leave.employee?.firstNameKh} {leave.employee?.lastNameKh}
                        </div>
                        <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '2px' }}>
                          ID: <span style={{ fontWeight: 600, color: '#3b82f6' }}>{leave.employee?.employeeId}</span> • {leave.employee?.position || leave.employee?.department || '-'}
                        </div>
                      </td>

                      <td style={tdStyle} className="kh-text">
                        <span style={{ 
                          backgroundColor: '#f1f5f9', 
                          color: '#334155',
                          padding: '3px 8px', 
                          borderRadius: '6px', 
                          fontSize: '0.82rem',
                          fontWeight: 500,
                          border: '1px solid #e2e8f0'
                        }}>
                          {getTypeLabel(leave.leaveType)}
                        </span>
                      </td>

                      <td style={tdStyle}>
                        <div style={{ fontSize: '0.86rem', fontWeight: 600, color: '#0f172a' }}>
                          {new Date(leave.startDate).toLocaleDateString('en-GB')}
                        </div>
                        <div style={{ fontSize: '0.78rem', color: '#64748b' }}>
                          ដល់ {new Date(leave.endDate).toLocaleDateString('en-GB')}
                        </div>
                      </td>

                      <td style={{ ...tdStyle, textAlign: 'center' }} className="kh-text">
                        <span style={{ 
                          display: 'inline-block',
                          padding: '2px 8px',
                          borderRadius: '6px',
                          backgroundColor: '#eff6ff',
                          color: '#1d4ed8',
                          fontWeight: 700,
                          fontSize: '0.95rem'
                        }}>
                          {leave.duration}
                        </span>
                        <span style={{ fontSize: '0.8rem', color: '#64748b', marginLeft: '3px' }}>ថ្ងៃ</span>
                      </td>

                      <td style={tdStyle} className="kh-text">
                        {leave.leaveType === 'ANNUAL' ? (
                          <div style={{ color: '#0369a1', fontSize: '0.84rem', fontWeight: 600 }}>
                            សល់ {annualLeaveDays} ថ្ងៃ/ឆ្នាំ
                          </div>
                        ) : (
                          <span style={{ color: '#94a3b8' }}>-</span>
                        )}
                      </td>

                      <td style={{ ...tdStyle, textAlign: 'center' }}>
                        <span style={{ 
                          padding: '3px 10px', 
                          borderRadius: '20px', 
                          fontSize: '0.78rem',
                          fontWeight: 700,
                          backgroundColor: statusInfo.bg,
                          color: statusInfo.color,
                          border: `1px solid ${statusInfo.border}`,
                          display: 'inline-block'
                        }} className="kh-text">
                          {statusInfo.label}
                        </span>
                      </td>

                      <td style={{ ...tdStyle, textAlign: 'center' }}>
                        <LeaveStatusClient id={leave.id} currentStatus={leave.status} t={t} />
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

const thStyle: React.CSSProperties = {
  padding: '10px 14px',
  borderBottom: '1px solid #e2e8f0',
  borderRight: '1px solid #f1f5f9',
  color: '#334155',
  fontWeight: 600,
  fontSize: '0.84rem',
  whiteSpace: 'nowrap',
  lineHeight: 1.3
};

const tdStyle: React.CSSProperties = {
  padding: '10px 14px',
  borderBottom: '1px solid #f1f5f9',
  borderRight: '1px solid #f8fafc',
  verticalAlign: 'middle',
  fontSize: '0.86rem'
};
