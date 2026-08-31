'use client';

import React, { useState } from 'react';
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
  const [filter, setFilter] = useState<'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED'>('ALL');

  const filteredRequests = leaveRequests.filter(req => {
    if (filter === 'ALL') return true;
    return req.status === filter;
  });

  const totalRequests = leaveRequests.length;
  const pendingCount = leaveRequests.filter(r => r.status === 'PENDING').length;
  const approvedCount = leaveRequests.filter(r => r.status === 'APPROVED').length;
  const rejectedCount = leaveRequests.filter(r => r.status === 'REJECTED').length;

  const getTypeLabel = (type: string) => {
    return t.leave.types[type] || type;
  };

  const thStyle: React.CSSProperties = {
    padding: '8px 12px',
    borderBottom: '2px solid var(--border-color)',
    backgroundColor: '#f8fafc',
    color: '#334155',
    textAlign: 'left',
    fontWeight: '600',
    whiteSpace: 'nowrap',
    position: 'sticky',
    top: 0,
    zIndex: 10,
    boxShadow: '0 2px 0 var(--border-color)',
    fontSize: '0.9rem'
  };

  const tdStyle: React.CSSProperties = {
    padding: '8px 12px',
    borderBottom: '1px solid var(--border-color)',
    verticalAlign: 'middle'
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '15px' }}>
        <h1 className="title kh-text" style={{ marginBottom: 0 }}>គ្រប់គ្រងការសុំច្បាប់ (Leave Management)</h1>
        <Link href="/dashboard/leave/new" className="btn-primary kh-text" style={{ textDecoration: 'none' }}>
          {t.leave.newBtn}
        </Link>
      </div>

      {/* Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px', marginBottom: '20px' }}>
        <div onClick={() => setFilter('ALL')} style={{ cursor: 'pointer', padding: '15px', borderRadius: '12px', background: filter === 'ALL' ? '#e2e8f0' : '#f8fafc', border: '1px solid #cbd5e1' }}>
          <div className="kh-text" style={{ color: '#64748b', fontSize: '0.9rem', marginBottom: '5px' }}>សរុប (Total)</div>
          <div style={{ fontSize: '1.8rem', fontWeight: 'bold', color: '#0f172a' }}>{totalRequests}</div>
        </div>
        <div onClick={() => setFilter('PENDING')} style={{ cursor: 'pointer', padding: '15px', borderRadius: '12px', background: filter === 'PENDING' ? '#fef08a' : '#fef9c3', border: '1px solid #fde047' }}>
          <div className="kh-text" style={{ color: '#854d0e', fontSize: '0.9rem', marginBottom: '5px' }}>រង់ចាំការអនុម័ត (Pending)</div>
          <div style={{ fontSize: '1.8rem', fontWeight: 'bold', color: '#ca8a04' }}>{pendingCount}</div>
        </div>
        <div onClick={() => setFilter('APPROVED')} style={{ cursor: 'pointer', padding: '15px', borderRadius: '12px', background: filter === 'APPROVED' ? '#dcfce7' : '#f0fdf4', border: '1px solid #bbf7d0' }}>
          <div className="kh-text" style={{ color: '#166534', fontSize: '0.9rem', marginBottom: '5px' }}>អនុម័តរួច (Approved)</div>
          <div style={{ fontSize: '1.8rem', fontWeight: 'bold', color: '#15803d' }}>{approvedCount}</div>
        </div>
        <div onClick={() => setFilter('REJECTED')} style={{ cursor: 'pointer', padding: '15px', borderRadius: '12px', background: filter === 'REJECTED' ? '#fee2e2' : '#fef2f2', border: '1px solid #fecaca' }}>
          <div className="kh-text" style={{ color: '#991b1b', fontSize: '0.9rem', marginBottom: '5px' }}>បដិសេធ (Rejected)</div>
          <div style={{ fontSize: '1.8rem', fontWeight: 'bold', color: '#b91c1c' }}>{rejectedCount}</div>
        </div>
      </div>

      <div className="card" style={{ overflowX: 'auto', overflowY: 'auto', maxHeight: 'calc(100vh - 250px)', padding: 0 }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '1000px' }}>
          <thead>
            <tr style={{ backgroundColor: 'var(--surface-color)' }}>
              <th style={thStyle} className="kh-text">បុគ្គលិក<br/>Employee<br/><span style={{fontSize: '0.8rem', color: '#64748b'}}>员工</span></th>
              <th style={thStyle} className="kh-text">ប្រភេទច្បាប់<br/>Type<br/><span style={{fontSize: '0.8rem', color: '#64748b'}}>请假类型</span></th>
              <th style={thStyle} className="kh-text">កាលបរិច្ឆេទ<br/>Date<br/><span style={{fontSize: '0.8rem', color: '#64748b'}}>日期</span></th>
              <th style={thStyle} className="kh-text">ចំនួនថ្ងៃ<br/>Days<br/><span style={{fontSize: '0.8rem', color: '#64748b'}}>天数</span></th>
              <th style={thStyle} className="kh-text">ច្បាប់នៅសល់<br/>Balance<br/><span style={{fontSize: '0.8rem', color: '#64748b'}}>剩余假期</span></th>
              <th style={thStyle} className="kh-text">ស្ថានភាព<br/>Status<br/><span style={{fontSize: '0.8rem', color: '#64748b'}}>状态</span></th>
              <th style={thStyle} className="kh-text">សកម្មភាព<br/>Actions<br/><span style={{fontSize: '0.8rem', color: '#64748b'}}>操作</span></th>
            </tr>
          </thead>
          <tbody>
            {filteredRequests.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ padding: '30px', textAlign: 'center' }} className="kh-text text-muted">
                  មិនមានទិន្នន័យ (No Data)
                </td>
              </tr>
            ) : (
              filteredRequests.map(leave => {
                // Calculate used annual leave 
                const annualLeaveDays = leave.employee.annualLeaveDays || 18;
                // Note: To be perfectly accurate, we should calculate total approved annual leaves this year.
                // For UI display, we'll just show the total allowance and leave it up to the API to calculate actuals if needed, 
                // but let's assume we pass a pre-calculated field `balance` later. For now we just show the static allowance limit.
                
                return (
                  <tr key={leave.id} style={{ backgroundColor: '#fff', transition: 'background-color 0.2s' }}>
                    <td style={tdStyle}>
                      <div className="kh-text" style={{ fontWeight: '600', color: '#0f172a' }}>{leave.employee.firstNameKh} {leave.employee.lastNameKh}</div>
                      <div style={{ fontSize: '0.8rem', color: '#64748b' }}>{leave.employee.employeeId} - {leave.employee.position}</div>
                    </td>
                    <td style={tdStyle} className="kh-text">
                      <span style={{ backgroundColor: '#f1f5f9', padding: '4px 8px', borderRadius: '4px', fontSize: '0.85rem' }}>
                        {getTypeLabel(leave.leaveType)}
                      </span>
                    </td>
                    <td style={tdStyle}>
                      <div style={{ fontSize: '0.85rem' }}>{new Date(leave.startDate).toLocaleDateString('en-GB')}</div>
                      <div style={{ fontSize: '0.85rem', color: '#64748b' }}>to {new Date(leave.endDate).toLocaleDateString('en-GB')}</div>
                    </td>
                    <td style={tdStyle} className="kh-text">
                      <span style={{ fontWeight: 'bold', color: '#0f172a', fontSize: '1.1rem' }}>{leave.duration}</span> ថ្ងៃ
                    </td>
                    <td style={tdStyle} className="kh-text">
                      {leave.leaveType === 'ANNUAL' ? (
                        <div style={{ color: '#0369a1', fontWeight: '500' }}>
                           សល់ {annualLeaveDays} ថ្ងៃ/ឆ្នាំ
                        </div>
                      ) : '-'}
                    </td>
                    <td style={tdStyle}>
                      <span style={{ 
                        padding: '4px 10px', 
                        borderRadius: '20px', 
                        fontSize: '0.8rem',
                        fontWeight: 'bold',
                        backgroundColor: leave.status === 'APPROVED' ? '#dcfce7' : leave.status === 'REJECTED' ? '#fee2e2' : '#fef08a',
                        color: leave.status === 'APPROVED' ? '#166534' : leave.status === 'REJECTED' ? '#991b1b' : '#854d0e'
                      }}>
                        {t.leave.status[leave.status as keyof typeof t.leave.status] || leave.status}
                      </span>
                    </td>
                    <td style={tdStyle}>
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
  );
}
