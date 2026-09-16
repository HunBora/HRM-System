'use client';

import React from 'react';
import Link from 'next/link';

export default function EmployeeDashboard({ employee, recentLeaves, recentAttendances, recentPayrolls, l, locale }: any) {
  if (!employee) {
    return (
      <div style={{ padding: '20px', textAlign: 'center', backgroundColor: '#fff', borderRadius: '12px', marginTop: '20px', border: '1px solid #e2e8f0' }}>
        <div style={{ fontSize: '3rem', marginBottom: '10px' }}>⚠️</div>
        <h2 style={{ color: '#d32f2f' }} className="kh-text">គណនីរបស់អ្នកមិនទាន់ភ្ជាប់ជាមួយប្រវត្តិរូបបុគ្គលិកនៅឡើយទេ!</h2>
        <p className="kh-text" style={{ color: '#555', marginTop: '10px' }}>សូមទាក់ទងទៅកាន់ផ្នែកធនធានមនុស្ស (HR) ដើម្បីរៀបចំភ្ជាប់គណនីរបស់អ្នក។</p>
      </div>
    );
  }

  return (
    <div className="animate-fade-in" style={{ padding: '10px 0', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      {/* Profile Summary Card */}
      <div style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '24px', display: 'flex', gap: '24px', alignItems: 'center', flexWrap: 'wrap', boxShadow: 'var(--shadow-sm)' }}>
        <div style={{ width: '80px', height: '80px', borderRadius: '50%', backgroundColor: '#e0e7ff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem', color: '#4f46e5', fontWeight: 'bold' }}>
          {employee.firstNameEn.charAt(0)}{employee.lastNameEn.charAt(0)}
        </div>
        <div style={{ flex: 1, minWidth: '250px' }}>
          <h2 style={{ margin: '0 0 8px 0', color: 'var(--text-main)', fontSize: '1.5rem' }} className="kh-text">{employee.firstNameKh} {employee.lastNameKh} ({employee.firstNameEn} {employee.lastNameEn})</h2>
          <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            <span><strong>ID:</strong> {employee.employeeId}</span>
            <span><strong>ផ្នែក (Dept):</strong> {employee.department}</span>
            <span><strong>តំណែង (Pos):</strong> {employee.position}</span>
          </div>
        </div>
        <div style={{ backgroundColor: '#fcf4ff', border: '1px solid #ebccff', padding: '15px', borderRadius: '12px', textAlign: 'center', minWidth: '150px' }}>
          <div style={{ fontSize: '0.85rem', color: '#9c27b0', fontWeight: 'bold' }} className="kh-text">ច្បាប់ឈប់សម្រាកប្រចាំឆ្នាំ</div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: '#9c27b0', marginTop: '5px' }}>{employee.annualLeaveDays} ថ្ងៃ</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
        
        {/* Recent Attendance */}
        <div style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '20px', boxShadow: 'var(--shadow-sm)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
            <h3 style={{ margin: 0, color: 'var(--text-main)', fontSize: '1.1rem' }} className="kh-text">📅 វត្តមាន ៥ ថ្ងៃចុងក្រោយ</h3>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {recentAttendances.length > 0 ? recentAttendances.map((att: any, idx: number) => (
              <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px', backgroundColor: 'var(--bg-main)', borderRadius: '8px', fontSize: '0.9rem', border: '1px solid var(--border-color)' }}>
                <span style={{ fontWeight: 600 }}>{new Date(att.date).toLocaleDateString('en-GB')}</span>
                <span style={{ color: '#059669', fontWeight: 500 }}>ចូល: {att.fIn || '-'}</span>
                <span style={{ color: '#d97706', fontWeight: 500 }}>ចេញ: {att.sOut || att.fOut || '-'}</span>
              </div>
            )) : <div style={{ color: 'var(--text-muted)', fontStyle: 'italic', fontSize: '0.9rem', textAlign: 'center', padding: '10px 0' }}>មិនមានទិន្នន័យវត្តមានទេ</div>}
          </div>
        </div>

        {/* Recent Leave Requests */}
        <div style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '20px', boxShadow: 'var(--shadow-sm)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
            <h3 style={{ margin: 0, color: 'var(--text-main)', fontSize: '1.1rem' }} className="kh-text">🌴 សំណើសុំច្បាប់ថ្មីៗ</h3>
            <Link href="/dashboard/leave" className="btn kh-text" style={{ padding: '6px 12px', fontSize: '0.8rem', backgroundColor: '#4f46e5', color: '#fff', textDecoration: 'none', borderRadius: '6px', fontWeight: 'bold' }}>+ សុំច្បាប់ថ្មី</Link>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {recentLeaves.length > 0 ? recentLeaves.map((leave: any, idx: number) => (
              <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', backgroundColor: 'var(--bg-main)', borderRadius: '8px', fontSize: '0.9rem', border: '1px solid var(--border-color)' }}>
                <div>
                  <div style={{ fontWeight: 600 }}>{leave.leaveType}</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    {new Date(leave.startDate).toLocaleDateString('en-GB')} - {new Date(leave.endDate).toLocaleDateString('en-GB')} ({leave.duration} ថ្ងៃ)
                  </div>
                </div>
                <span style={{ 
                  padding: '4px 8px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 'bold',
                  backgroundColor: leave.status === 'APPROVED' ? '#d1fae5' : leave.status === 'REJECTED' ? '#fee2e2' : '#fef3c7',
                  color: leave.status === 'APPROVED' ? '#065f46' : leave.status === 'REJECTED' ? '#991b1b' : '#92400e'
                }}>
                  {leave.status}
                </span>
              </div>
            )) : <div style={{ color: 'var(--text-muted)', fontStyle: 'italic', fontSize: '0.9rem', textAlign: 'center', padding: '10px 0' }}>មិនមានប្រវត្តិសុំច្បាប់ទេ</div>}
          </div>
        </div>

        {/* Recent Payslips */}
        <div style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '20px', boxShadow: 'var(--shadow-sm)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
            <h3 style={{ margin: 0, color: 'var(--text-main)', fontSize: '1.1rem' }} className="kh-text">💵 វិក្កយបត្រប្រាក់ខែ (Payslips)</h3>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {recentPayrolls.length > 0 ? recentPayrolls.map((payroll: any, idx: number) => (
              <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', backgroundColor: 'var(--bg-main)', borderRadius: '8px', fontSize: '0.9rem', border: '1px solid var(--border-color)' }}>
                <span style={{ fontWeight: 600 }}>ខែ {payroll.month}/{payroll.year}</span>
                <span style={{ color: '#059669', fontWeight: 'bold' }}>${payroll.netSalaryUsd.toFixed(2)}</span>
                <button 
                  onClick={() => alert('មុខងារទាញយកនឹងត្រូវបន្ថែមពេលក្រោយ។')}
                  style={{ border: 'none', background: '#e0e7ff', color: '#4f46e5', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 'bold' }}
                >
                  📥 ទាញយក
                </button>
              </div>
            )) : <div style={{ color: 'var(--text-muted)', fontStyle: 'italic', fontSize: '0.9rem', textAlign: 'center', padding: '10px 0' }}>មិនមានទិន្នន័យប្រាក់ខែទេ</div>}
          </div>
        </div>

      </div>
    </div>
  );
}
