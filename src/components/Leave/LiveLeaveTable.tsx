'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import LeaveStatusClient from '@/app/dashboard/leave/LeaveStatusClient';
import LeaveRequestPrintModal from './LeaveRequestPrintModal';

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
  companySettings?: any;
  employees?: any[];
}

export default function LiveLeaveTable({ leaveRequests, dictionary: t, companySettings, employees = [] }: LiveLeaveTableProps) {
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('ALL');

  // Print & Edit Leave Form Modal
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [selectedLeaveForPrint, setSelectedLeaveForPrint] = useState<any>(null);

  const handleOpenPrintModal = (leave?: any) => {
    setSelectedLeaveForPrint(leave || null);
    setShowPrintModal(true);
  };

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
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      {/* 1. Header Banner */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        flexWrap: 'wrap', 
        gap: '8px',
        backgroundColor: '#ffffff',
        padding: '6px 12px',
        borderRadius: '10px',
        border: '1px solid #e2e8f0',
        boxShadow: '0 1px 2px rgba(0,0,0,0.03)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{
            width: '32px',
            height: '32px',
            borderRadius: '8px',
            background: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)',
            color: '#0284c7',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '17px',
          }}>
            🌴
          </div>
          <div>
            <h1 className="kh-text" style={{ fontSize: '1.05rem', fontWeight: 800, margin: 0, color: '#0f172a', lineHeight: 1.2 }}>
              គ្រប់គ្រងការសុំច្បាប់
            </h1>
            <p style={{ margin: 0, fontSize: '0.7rem', color: '#64748b', fontWeight: 500 }}>
              Leave Management
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', alignItems: 'center' }}>
          <button
            type="button"
            onClick={() => handleOpenPrintModal()}
            style={{
              backgroundColor: '#0284c7',
              color: '#ffffff',
              border: 'none',
              borderRadius: '6px',
              padding: '4px 10px',
              fontWeight: 700,
              fontSize: '0.78rem',
              height: '28px',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              boxShadow: '0 1px 3px rgba(2, 132, 199, 0.2)',
            }}
            title="មើល ឬបោះពុម្ពទម្រង់លិខិតសុំច្បាប់ផ្លូវការ (អនុលោមតាមច្បាប់ការងារ)"
          >
            <span>📄</span>
            <span className="kh-text">ទម្រង់ច្បាប់ (Form)</span>
          </button>

          <Link 
            href="/dashboard/leave/new" 
            className="btn-primary kh-text" 
            style={{ 
              textDecoration: 'none', 
              display: 'inline-flex', 
              alignItems: 'center', 
              gap: '4px',
              padding: '4px 10px',
              borderRadius: '6px',
              fontWeight: 700,
              fontSize: '0.78rem',
              height: '28px',
              boxSizing: 'border-box'
            }}
          >
            <span>➕</span>
            <span>សុំច្បាប់</span>
          </Link>
        </div>
      </div>

      {/* 2. Standard Metric Cards */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', 
        gap: '8px' 
      }}>
        {/* Total Card */}
        <div 
          onClick={() => setStatusFilter('ALL')}
          style={{ 
            cursor: 'pointer',
            padding: '6px 12px', 
            borderRadius: '10px', 
            background: statusFilter === 'ALL' ? '#eff6ff' : '#ffffff', 
            border: `1.5px solid ${statusFilter === 'ALL' ? '#3b82f6' : '#e2e8f0'}`,
            boxShadow: statusFilter === 'ALL' ? '0 2px 6px rgba(59, 130, 246, 0.12)' : '0 1px 2px rgba(0,0,0,0.02)',
            transition: 'all 0.15s ease',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}
        >
          <div>
            <div className="kh-text" style={{ color: '#64748b', fontSize: '0.75rem', fontWeight: 600 }}>
              សរុប (Total)
            </div>
            <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0f172a', lineHeight: 1.2 }}>
              {totalRequests}
            </div>
          </div>
          <div style={{ 
            width: '28px', 
            height: '28px', 
            borderRadius: '6px', 
            backgroundColor: '#f1f5f9', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            fontSize: '14px'
          }}>
            📋
          </div>
        </div>

        {/* Pending Card */}
        <div 
          onClick={() => setStatusFilter('PENDING')}
          style={{ 
            cursor: 'pointer',
            padding: '6px 12px', 
            borderRadius: '10px', 
            background: statusFilter === 'PENDING' ? '#fffbeb' : '#ffffff', 
            border: `1.5px solid ${statusFilter === 'PENDING' ? '#f59e0b' : '#e2e8f0'}`,
            boxShadow: statusFilter === 'PENDING' ? '0 2px 6px rgba(245, 158, 11, 0.15)' : '0 1px 2px rgba(0,0,0,0.02)',
            transition: 'all 0.15s ease',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}
        >
          <div>
            <div className="kh-text" style={{ color: '#854d0e', fontSize: '0.75rem', fontWeight: 600 }}>
              រង់ចាំ (Pending)
            </div>
            <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#d97706', lineHeight: 1.2 }}>
              {pendingCount}
            </div>
          </div>
          <div style={{ 
            width: '28px', 
            height: '28px', 
            borderRadius: '6px', 
            backgroundColor: '#fef3c7', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            fontSize: '14px'
          }}>
            ⏳
          </div>
        </div>

        {/* Approved Card */}
        <div 
          onClick={() => setStatusFilter('APPROVED')}
          style={{ 
            cursor: 'pointer',
            padding: '6px 12px', 
            borderRadius: '10px', 
            background: statusFilter === 'APPROVED' ? '#f0fdf4' : '#ffffff', 
            border: `1.5px solid ${statusFilter === 'APPROVED' ? '#10b981' : '#e2e8f0'}`,
            boxShadow: statusFilter === 'APPROVED' ? '0 2px 6px rgba(16, 185, 129, 0.15)' : '0 1px 2px rgba(0,0,0,0.02)',
            transition: 'all 0.15s ease',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}
        >
          <div>
            <div className="kh-text" style={{ color: '#166534', fontSize: '0.75rem', fontWeight: 600 }}>
              អនុម័ត (Approved)
            </div>
            <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#16a34a', lineHeight: 1.2 }}>
              {approvedCount}
            </div>
          </div>
          <div style={{ 
            width: '28px', 
            height: '28px', 
            borderRadius: '6px', 
            backgroundColor: '#dcfce7', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            fontSize: '14px'
          }}>
            ✅
          </div>
        </div>

        {/* Rejected Card */}
        <div 
          onClick={() => setStatusFilter('REJECTED')}
          style={{ 
            cursor: 'pointer',
            padding: '6px 12px', 
            borderRadius: '10px', 
            background: statusFilter === 'REJECTED' ? '#fef2f2' : '#ffffff', 
            border: `1.5px solid ${statusFilter === 'REJECTED' ? '#ef4444' : '#e2e8f0'}`,
            boxShadow: statusFilter === 'REJECTED' ? '0 2px 6px rgba(239, 68, 68, 0.15)' : '0 1px 2px rgba(0,0,0,0.02)',
            transition: 'all 0.15s ease',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}
        >
          <div>
            <div className="kh-text" style={{ color: '#991b1b', fontSize: '0.75rem', fontWeight: 600 }}>
              បដិសេធ (Rejected)
            </div>
            <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#dc2626', lineHeight: 1.2 }}>
              {rejectedCount}
            </div>
          </div>
          <div style={{ 
            width: '28px', 
            height: '28px', 
            borderRadius: '6px', 
            backgroundColor: '#fee2e2', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            fontSize: '14px'
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
        gap: '8px',
        flexWrap: 'wrap',
        backgroundColor: '#ffffff',
        padding: '6px 10px',
        borderRadius: '8px',
        border: '1px solid #e2e8f0',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flex: 1, minWidth: '180px', maxWidth: '320px' }}>
          <span style={{ color: '#94a3b8', fontSize: '0.85rem' }}>🔍</span>
          <input 
            type="text"
            placeholder="ស្វែងរកតាមឈ្មោះ, ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="kh-text"
            style={{
              width: '100%',
              border: 'none',
              outline: 'none',
              fontSize: '0.78rem',
              backgroundColor: 'transparent',
              color: '#0f172a',
              height: '24px'
            }}
          />
          {searchQuery && (
            <button 
              onClick={() => setSearchQuery('')}
              style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: '0.75rem', padding: '0 4px' }}
            >
              ✕
            </button>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="kh-text"
            style={{
              padding: '2px 8px',
              borderRadius: '5px',
              border: '1px solid #cbd5e1',
              backgroundColor: '#f8fafc',
              fontSize: '0.78rem',
              color: '#334155',
              cursor: 'pointer',
              height: '26px'
            }}
          >
            <option value="ALL">គ្រប់ប្រភេទ (All)</option>
            <option value="ANNUAL">ប្រចាំឆ្នាំ (Annual)</option>
            <option value="SICK">ច្បាប់ឈឺ (Sick)</option>
            <option value="MATERNITY">មាតុភាព (Maternity)</option>
            <option value="UNPAID">គ្មានប្រាក់ខែ (Unpaid)</option>
            <option value="OTHER">ផ្សេងៗ (Other)</option>
          </select>

          <span style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 600 }} className="kh-text">
            សរុប {filteredRequests.length}
          </span>
        </div>
      </div>

      {/* 4. Standard Fit-Content Table */}
      <div style={{ 
        backgroundColor: '#ffffff',
        borderRadius: '10px', 
        border: '1px solid #e2e8f0',
        overflow: 'hidden',
        boxShadow: '0 1px 2px rgba(0,0,0,0.03)'
      }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '700px' }}>
            <thead>
              <tr style={{ backgroundColor: '#f8fafc', borderBottom: '2px solid #e2e8f0', position: 'sticky', top: 0, zIndex: 10 }}>
                <th style={thStyle} className="kh-text">បុគ្គលិក (Employee)</th>
                <th style={thStyle} className="kh-text">ប្រភេទច្បាប់</th>
                <th style={thStyle} className="kh-text">កាលបរិច្ឆេទ</th>
                <th style={{ ...thStyle, textAlign: 'center' }} className="kh-text">ចំនួនថ្ងៃ</th>
                <th style={thStyle} className="kh-text">ច្បាប់នៅសល់</th>
                <th style={{ ...thStyle, textAlign: 'center' }} className="kh-text">ស្ថានភាព</th>
                <th style={{ ...thStyle, textAlign: 'center' }} className="kh-text">សកម្មភាព</th>
              </tr>
            </thead>
            <tbody>
              {filteredRequests.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ padding: '28px 16px', textAlign: 'center' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
                      <div style={{ 
                        width: '36px', 
                        height: '36px', 
                        borderRadius: '50%', 
                        backgroundColor: '#f1f5f9', 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center',
                        fontSize: '1.2rem'
                      }}>
                        🍃
                      </div>
                      <div className="kh-text" style={{ fontSize: '0.88rem', fontWeight: 700, color: '#334155' }}>
                        មិនមានទិន្នន័យច្បាប់ឈប់សម្រាកនៅឡើយទេ
                      </div>
                      <div className="kh-text" style={{ fontSize: '0.75rem', color: '#94a3b8', maxWidth: '340px' }}>
                        ពាក្យស្នើសុំច្បាប់របស់បុគ្គលិកនឹងបង្ហាញនៅត្រង់នេះ
                      </div>
                      <Link 
                        href="/dashboard/leave/new" 
                        className="btn-secondary kh-text" 
                        style={{ marginTop: '4px', padding: '4px 12px', fontSize: '0.76rem', textDecoration: 'none', borderRadius: '5px' }}
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
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                          <LeaveStatusClient id={leave.id} currentStatus={leave.status} t={t} />
                          <button
                            type="button"
                            onClick={() => handleOpenPrintModal(leave)}
                            title="មើល និងបោះពុម្ពលិខិតសុំច្បាប់ផ្លូវការ"
                            style={{
                              background: '#eff6ff',
                              color: '#0284c7',
                              border: '1px solid #bfdbfe',
                              borderRadius: '6px',
                              padding: '5px 9px',
                              fontSize: '0.78rem',
                              fontWeight: 600,
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                            }}
                          >
                            <span>📄</span>
                            <span className="kh-text">លិខិតសុំច្បាប់</span>
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

      {/* Official Leave Request Print & Edit Modal (លិខិតសុំច្បាប់) */}
      {showPrintModal && (
        <LeaveRequestPrintModal
          isOpen={showPrintModal}
          onClose={() => setShowPrintModal(false)}
          leaveRequest={selectedLeaveForPrint}
          employees={employees}
          companySettings={companySettings}
        />
      )}
    </div>
  );
}

const thStyle: React.CSSProperties = {
  padding: '6px 10px',
  borderBottom: '1px solid #e2e8f0',
  borderRight: '1px solid #f1f5f9',
  color: '#475569',
  fontWeight: 700,
  fontSize: '0.78rem',
  whiteSpace: 'nowrap',
  lineHeight: 1.2
};

const tdStyle: React.CSSProperties = {
  padding: '6px 10px',
  borderBottom: '1px solid #f1f5f9',
  borderRight: '1px solid #f8fafc',
  verticalAlign: 'middle',
  fontSize: '0.8rem'
};
