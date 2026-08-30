'use client'

import React, { useState } from 'react';
import Link from 'next/link';
import DeleteEmployeeButton from '@/components/DeleteEmployeeButton';

export default function EmployeeTable({ employees, t }: { employees: any[], t: any }) {
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);

  const formatDate = (date: any) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('en-GB');
  };

  const Th = ({ en, cn, kh, minW = 'auto' }: { en: string, cn: string, kh: string, minW?: string }) => (
    <th style={{ padding: '10px 8px', borderBottom: '1px dashed var(--border-color)', borderRight: '1px dashed var(--border-color)', verticalAlign: 'middle', minWidth: minW, position: 'sticky', top: 0, backgroundColor: 'var(--surface-color)', zIndex: 10, boxShadow: '0 1px 0 var(--border-color)' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', alignItems: 'center', lineHeight: '1.2' }}>
        <span className="kh-text" style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-color)' }}>{kh}</span>
        <span style={{ fontSize: '0.75rem', fontWeight: 400, color: '#64748b' }}>{en}</span>
        <span style={{ fontSize: '0.75rem', fontWeight: 400, color: '#94a3b8' }}>{cn}</span>
      </div>
    </th>
  );

  return (
    <>
      <div className="card" style={{ overflowX: 'auto', overflowY: 'auto', maxHeight: 'calc(100vh - 200px)', padding: 0, border: '1px dashed var(--border-color)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'center', whiteSpace: 'nowrap' }}>
          <thead>
            <tr style={{ backgroundColor: 'var(--surface-color)' }}>
              <Th en="Photo" cn="照片" kh="រូបថត" minW="70px" />
              <Th en="No." cn="序号" kh="ល.រ" minW="50px" />
              <Th en="ID No" cn="编号" kh="អត្តលេខ" minW="80px" />
              <Th en="Name Khmer" cn="柬文名字" kh="ឈ្មោះខ្មែរ" minW="150px" />
              <Th en="Name English" cn="英文名字" kh="ឈ្មោះឡាតាំង" minW="150px" />
              <Th en="Sex" cn="性别" kh="ភេទ" minW="60px" />
              <Th en="Date of Birth" cn="出生日期" kh="ថ្ងៃខែឆ្នាំកំណើត" minW="120px" />
              <Th en="Hire Date" cn="入职日期" kh="ថ្ងៃចូលធ្វើការ" minW="120px" />
              <Th en="Bank No" cn="银行卡号" kh="កាតធនាគារ" minW="120px" />
              <Th en="Dept" cn="部门" kh="ផ្នែក" minW="100px" />
              <Th en="Position" cn="职务" kh="មុខងារ" minW="120px" />
              <Th en="Probation Start" cn="试用开始" kh="សាកល្បងចាប់ផ្តើម" minW="120px" />
              <Th en="Probation End" cn="试用结束" kh="សាកល្បងបញ្ចប់" minW="120px" />
              <Th en="Basic Salary" cn="基本底薪" kh="ប្រាក់បៀវត្សរ៍" minW="100px" />
              <Th en="Skill Allowance" cn="技能补贴" kh="ប្រាក់ជំនាញ" minW="100px" />
              <Th en="Position Allowance" cn="岗位补贴" kh="ប្រាក់មុខងារ" minW="100px" />
              <Th en="National ID" cn="身份证号" kh="អត្តសញ្ញាណប័ណ្ណ" minW="120px" />
              <Th en="Place of Birth" cn="出生地" kh="ទីកន្លែងកំណើត" minW="150px" />
              <Th en="Education" cn="学历" kh="កម្រិតវប្បធម៌" minW="100px" />
              <Th en="Child Q'ty" cn="子女" kh="កូន" minW="60px" />
              <Th en="Marital Status" cn="婚姻状况" kh="ស្ថានភាពគ្រួសារ" minW="100px" />
              <Th en="Work Book" cn="健康证" kh="សៀវភៅសុខភាព" minW="120px" />
              <Th en="Health Cert." cn="体检单" kh="សំបុត្រពេទ្យ" minW="120px" />
              <Th en="Phone No" cn="电话号码" kh="លេខទូរស័ព្ទ" minW="120px" />
              <Th en="NSSF No" cn="社保" kh="ប.ស.ស" minW="120px" />
              <Th en="Remark" cn="备注" kh="ផ្សេងៗ" minW="150px" />
              <th style={{ padding: '10px 8px', borderBottom: '1px dashed var(--border-color)', verticalAlign: 'middle', position: 'sticky', top: 0, backgroundColor: 'var(--surface-color)', zIndex: 10, boxShadow: '0 1px 0 var(--border-color)' }}>
                 <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', alignItems: 'center', lineHeight: '1.2' }}>
                   <span className="kh-text" style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-color)' }}>សកម្មភាព</span>
                   <span style={{ fontSize: '0.75rem', fontWeight: 400, color: '#64748b' }}>Actions</span>
                   <span style={{ fontSize: '0.75rem', fontWeight: 400, color: '#94a3b8' }}>操作</span>
                 </div>
              </th>
            </tr>
          </thead>
          <tbody>
            {employees.length === 0 ? (
              <tr>
                <td colSpan={27} style={{ padding: '30px', textAlign: 'center' }} className="kh-text text-muted">
                  {t.employee.noData}
                </td>
              </tr>
            ) : (
              employees.map((emp, index) => (
                <tr key={emp.id} style={{ transition: 'background-color 0.2s', borderBottom: '1px dashed var(--border-color)' }}>
                  <td style={{ padding: '12px', borderRight: '1px dashed var(--border-color)', textAlign: 'center' }}>
                    {emp.photoUrl ? (
                      <img 
                        src={emp.photoUrl} 
                        alt="Photo" 
                        style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover', cursor: 'pointer', border: '1px solid #ccc' }} 
                        onClick={() => setSelectedPhoto(emp.photoUrl)}
                      />
                    ) : (
                      <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: '#e2e8f0', display: 'inline-block' }}></div>
                    )}
                  </td>
                  <td style={{ padding: '12px', borderRight: '1px dashed var(--border-color)', fontSize: '0.9rem' }}>{index + 1}</td>
                  <td style={{ padding: '12px', borderRight: '1px dashed var(--border-color)', fontSize: '0.9rem' }}>{emp.employeeId}</td>
                  <td style={{ padding: '12px', borderRight: '1px dashed var(--border-color)', fontSize: '0.9rem' }} className="kh-text">{emp.firstNameKh} {emp.lastNameKh}</td>
                  <td style={{ padding: '12px', borderRight: '1px dashed var(--border-color)', fontSize: '0.9rem' }}>{emp.firstNameEn} {emp.lastNameEn}</td>
                  <td style={{ padding: '12px', borderRight: '1px dashed var(--border-color)', fontSize: '0.9rem' }}>{emp.gender === 'ប្រុស' ? 'M' : 'F'}</td>
                  <td style={{ padding: '12px', borderRight: '1px dashed var(--border-color)', fontSize: '0.9rem' }}>{formatDate(emp.dob)}</td>
                  <td style={{ padding: '12px', borderRight: '1px dashed var(--border-color)', fontSize: '0.9rem' }}>{formatDate(emp.hireDate)}</td>
                  <td style={{ padding: '12px', borderRight: '1px dashed var(--border-color)', fontSize: '0.9rem' }}>{emp.bankCardNo || '-'}</td>
                  <td style={{ padding: '12px', borderRight: '1px dashed var(--border-color)', fontSize: '0.9rem' }} className="kh-text">{emp.department}</td>
                  <td style={{ padding: '12px', borderRight: '1px dashed var(--border-color)', fontSize: '0.9rem' }} className="kh-text">{emp.position}</td>
                  <td style={{ padding: '12px', borderRight: '1px dashed var(--border-color)', fontSize: '0.9rem' }}>{formatDate(emp.probationStart)}</td>
                  <td style={{ padding: '12px', borderRight: '1px dashed var(--border-color)', fontSize: '0.9rem' }}>{formatDate(emp.probationEnd)}</td>
                  <td style={{ padding: '12px', borderRight: '1px dashed var(--border-color)', fontWeight: 'bold', fontSize: '0.9rem', color: 'var(--primary-color)' }}>${emp.basicSalary?.toFixed(2) || '0.00'}</td>
                  <td style={{ padding: '12px', borderRight: '1px dashed var(--border-color)', fontSize: '0.9rem' }}>${emp.skillAllowance1?.toFixed(2) || '0.00'}</td>
                  <td style={{ padding: '12px', borderRight: '1px dashed var(--border-color)', fontSize: '0.9rem' }}>${emp.positionAllowance1?.toFixed(2) || '0.00'}</td>
                  <td style={{ padding: '12px', borderRight: '1px dashed var(--border-color)', fontSize: '0.9rem' }}>{emp.nationalId || '-'}</td>
                  <td style={{ padding: '12px', borderRight: '1px dashed var(--border-color)', fontSize: '0.9rem' }} className="kh-text">{emp.placeOfBirth || '-'}</td>
                  <td style={{ padding: '12px', borderRight: '1px dashed var(--border-color)', fontSize: '0.9rem' }} className="kh-text">{emp.education || '-'}</td>
                  <td style={{ padding: '12px', borderRight: '1px dashed var(--border-color)', fontSize: '0.9rem' }}>{emp.numberOfChildren || 0}</td>
                  <td style={{ padding: '12px', borderRight: '1px dashed var(--border-color)', fontSize: '0.9rem' }}>{emp.maritalStatus}</td>
                  <td style={{ padding: '12px', borderRight: '1px dashed var(--border-color)', fontSize: '0.9rem' }} className="kh-text">{emp.healthBook || '-'}</td>
                  <td style={{ padding: '12px', borderRight: '1px dashed var(--border-color)', fontSize: '0.9rem' }} className="kh-text">{emp.healthCertificate || '-'}</td>
                  <td style={{ padding: '12px', borderRight: '1px dashed var(--border-color)', fontSize: '0.9rem' }}>{emp.phone || '-'}</td>
                  <td style={{ padding: '12px', borderRight: '1px dashed var(--border-color)', fontSize: '0.9rem' }}>{emp.nssfNo || '-'}</td>
                  <td style={{ padding: '12px', borderRight: '1px dashed var(--border-color)', fontSize: '0.9rem' }} className="kh-text">{emp.remark || '-'}</td>
                  <td style={{ padding: '12px' }}>
                     <div style={{ display: 'flex', justifyContent: 'center', gap: '10px' }}>
                       <Link href={`/dashboard/employees/${emp.id}/id-card`} style={{ color: '#10b981', textDecoration: 'none' }} title="Print ID Card">🪪</Link>
                       <Link href={`/dashboard/employees/${emp.id}`} style={{ color: '#3b82f6', textDecoration: 'none' }} title={t.employee.edit}>✏️</Link>
                       <DeleteEmployeeButton id={emp.id} confirmText={t.employee.confirmDelete} deleteText={t.employee.delete} />
                     </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Lightbox for Photo */}
      {selectedPhoto && (
        <div 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.8)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 1000,
            cursor: 'zoom-out'
          }}
          onClick={() => setSelectedPhoto(null)}
        >
          <img 
            src={selectedPhoto} 
            alt="Enlarged" 
            style={{ 
              maxHeight: '90vh', 
              maxWidth: '90vw', 
              objectFit: 'contain',
              borderRadius: '8px',
              boxShadow: '0 4px 20px rgba(0,0,0,0.5)'
            }} 
          />
        </div>
      )}
    </>
  );
}
