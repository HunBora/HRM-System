'use client'

import React, { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import DeleteEmployeeButton from '@/components/DeleteEmployeeButton';

export default function EmployeeTable({ employees, t }: { employees: any[], t: any }) {
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);
  const [hoveredPhoto, setHoveredPhoto] = useState<string | null>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  // Pagination for 1000+ employees
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(30); // 30 records per page default

  // Reset page to 1 if employee count changes
  useEffect(() => {
    setCurrentPage(1);
  }, [employees.length]);

  const totalEmployees = employees.length;
  const totalPages = pageSize === -1 ? 1 : Math.ceil(totalEmployees / pageSize) || 1;
  const safeCurrentPage = Math.min(currentPage, totalPages) || 1;

  const paginatedEmployees = useMemo(() => {
    if (pageSize === -1) return employees;
    const start = (safeCurrentPage - 1) * pageSize;
    return employees.slice(start, start + pageSize);
  }, [employees, safeCurrentPage, pageSize]);

  const formatDate = (date: any) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('en-GB');
  };

  const Th = ({ en, cn, kh, minW = 'auto' }: { en: string, cn: string, kh: string, minW?: string }) => (
    <th style={{ padding: '6px 8px', borderBottom: '1px dashed var(--border-color)', borderRight: '1px dashed var(--border-color)', verticalAlign: 'middle', minWidth: minW, position: 'sticky', top: 0, backgroundColor: 'var(--surface-color)', zIndex: 10, boxShadow: '0 1px 0 var(--border-color)' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1px', alignItems: 'center', lineHeight: '1.15' }}>
        <span className="kh-text" style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-color)' }}>{kh}</span>
        <span style={{ fontSize: '0.7rem', fontWeight: 400, color: '#64748b' }}>{en}</span>
        <span style={{ fontSize: '0.7rem', fontWeight: 400, color: '#94a3b8' }}>{cn}</span>
      </div>
    </th>
  );

  const tdStyle: React.CSSProperties = {
    padding: '5px 8px',
    borderRight: '1px dashed var(--border-color)',
    fontSize: '0.83rem',
    lineHeight: '1.25',
    verticalAlign: 'middle',
  };

  return (
    <>
      <div className="card" style={{ padding: 0, border: '1px dashed var(--border-color)', transform: 'none', display: 'flex', flexDirection: 'column' }}>
        <div style={{ overflowX: 'auto', overflowY: 'auto', maxHeight: 'calc(100vh - 230px)', width: '100%' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'center', whiteSpace: 'nowrap' }}>
          <thead>
            <tr style={{ backgroundColor: 'var(--surface-color)' }}>
              <Th en="Photo" cn="照片" kh="រូបថត" minW="48px" />
              <Th en="No." cn="序号" kh="ល.រ" minW="42px" />
              <Th en="ID No" cn="编号" kh="អត្តលេខ" minW="72px" />
              <Th en="Name Khmer" cn="柬文名字" kh="ឈ្មោះខ្មែរ" minW="125px" />
              <Th en="Name English" cn="英文名字" kh="ឈ្មោះឡាតាំង" minW="125px" />
              <Th en="Sex" cn="性别" kh="ភេទ" minW="48px" />
              <Th en="Date of Birth" cn="出生日期" kh="ថ្ងៃខែឆ្នាំកំណើត" minW="105px" />
              <Th en="Hire Date" cn="入职日期" kh="ថ្ងៃចូលធ្វើការ" minW="105px" />
              <Th en="Bank No" cn="银行卡号" kh="កាតធនាគារ" minW="105px" />
              <Th en="Dept" cn="部门" kh="ផ្នែក" minW="90px" />
              <Th en="Position" cn="职务" kh="មុខងារ" minW="105px" />
              <Th en="Probation Start" cn="试用开始" kh="សាកល្បងចាប់ផ្តើម" minW="105px" />
              <Th en="Probation End" cn="试用结束" kh="សាកល្បងបញ្ចប់" minW="105px" />
              <Th en="Basic Salary" cn="基本底薪" kh="ប្រាក់បៀវត្សរ៍" minW="90px" />
              <Th en="Skill Allowance" cn="技能补贴" kh="ប្រាក់ជំនាញ" minW="90px" />
              <Th en="Position Allowance" cn="岗位补贴" kh="ប្រាក់មុខងារ" minW="90px" />
              <Th en="National ID" cn="身份证号" kh="អត្តសញ្ញាណប័ណ្ណ" minW="105px" />
              <Th en="Place of Birth" cn="出生地" kh="ទីកន្លែងកំណើត" minW="125px" />
              <Th en="Address" cn="地址" kh="អាស័យដ្ឋាន" minW="135px" />
              <Th en="Education" cn="学历" kh="កម្រិតវប្បធម៌" minW="90px" />
              <Th en="Child Q'ty" cn="子女" kh="កូន" minW="48px" />
              <Th en="Marital Status" cn="婚姻状况" kh="ស្ថានភាពគ្រួសារ" minW="90px" />
              <Th en="Spouse Name" cn="配偶" kh="ឈ្មោះប្តី/ប្រពន្ធ" minW="110px" />
              <Th en="Work Book" cn="健康证" kh="សៀវភៅសុខភាព" minW="105px" />
              <Th en="Health Cert." cn="体检单" kh="សំបុត្រពេទ្យ" minW="105px" />
              <Th en="Phone No" cn="电话号码" kh="លេខទូរស័ព្ទ" minW="105px" />
              <Th en="Telegram" cn="飞机" kh="តេឡេក្រាម" minW="110px" />
              <Th en="NSSF No" cn="社保" kh="ប.ស.ស" minW="105px" />
              <Th en="Remark" cn="备注" kh="ផ្សេងៗ" minW="120px" />
              <th style={{ padding: '6px 8px', borderBottom: '1px dashed var(--border-color)', verticalAlign: 'middle', position: 'sticky', top: 0, backgroundColor: 'var(--surface-color)', zIndex: 10, boxShadow: '0 1px 0 var(--border-color)' }}>
                 <div style={{ display: 'flex', flexDirection: 'column', gap: '1px', alignItems: 'center', lineHeight: '1.15' }}>
                   <span className="kh-text" style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-color)' }}>សកម្មភាព</span>
                   <span style={{ fontSize: '0.7rem', fontWeight: 400, color: '#64748b' }}>Actions</span>
                   <span style={{ fontSize: '0.7rem', fontWeight: 400, color: '#94a3b8' }}>操作</span>
                 </div>
              </th>
            </tr>
          </thead>
          <tbody>
            {paginatedEmployees.length === 0 ? (
              <tr>
                <td colSpan={30} style={{ padding: '24px', textAlign: 'center' }} className="kh-text text-muted">
                  {t.employee.noData}
                </td>
              </tr>
            ) : (
              paginatedEmployees.map((emp, index) => {
                const rowNumber = (safeCurrentPage - 1) * (pageSize === -1 ? 0 : pageSize) + index + 1;
                return (
                  <tr 
                  key={emp.id} 
                  style={{ 
                    transition: 'background-color 0.15s ease', 
                    borderBottom: '1px dashed var(--border-color)',
                    backgroundColor: index % 2 === 1 ? 'rgba(241, 245, 249, 0.35)' : 'transparent'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'rgba(99, 102, 241, 0.08)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = index % 2 === 1 ? 'rgba(241, 245, 249, 0.35)' : 'transparent';
                  }}
                >
                  <td style={{ ...tdStyle, padding: '2px 4px', textAlign: 'center' }}>
                    {emp.photoUrl ? (
                      <img 
                        src={emp.photoUrl} 
                        alt="Photo" 
                        style={{ width: '26px', height: '26px', borderRadius: '50%', objectFit: 'cover', cursor: 'pointer', border: '1px solid #cbd5e1', display: 'inline-block', verticalAlign: 'middle' }} 
                        onClick={() => setSelectedPhoto(emp.photoUrl)}
                        onMouseEnter={(e) => {
                          setHoveredPhoto(emp.photoUrl);
                          setMousePos({ x: e.clientX, y: e.clientY });
                        }}
                        onMouseMove={(e) => setMousePos({ x: e.clientX, y: e.clientY })}
                        onMouseLeave={() => setHoveredPhoto(null)}
                      />
                    ) : (
                      <div style={{ width: '26px', height: '26px', borderRadius: '50%', backgroundColor: '#e2e8f0', display: 'inline-block', verticalAlign: 'middle' }}></div>
                    )}
                  </td>
                  <td style={tdStyle}>{rowNumber}</td>
                  <td style={{ ...tdStyle, fontWeight: 500 }}>{emp.employeeId}</td>
                  <td style={tdStyle} className="kh-text">{emp.firstNameKh} {emp.lastNameKh}</td>
                  <td style={tdStyle}>{emp.firstNameEn} {emp.lastNameEn}</td>
                  <td style={tdStyle}>{emp.gender === 'ប្រុស' ? 'M' : 'F'}</td>
                  <td style={tdStyle}>{formatDate(emp.dob)}</td>
                  <td style={tdStyle}>{formatDate(emp.hireDate)}</td>
                  <td style={tdStyle}>{emp.bankCardNo || '-'}</td>
                  <td style={tdStyle} className="kh-text">{emp.department}</td>
                  <td style={tdStyle} className="kh-text">{emp.position}</td>
                  <td style={tdStyle}>{formatDate(emp.probationStart)}</td>
                  <td style={tdStyle}>{formatDate(emp.probationEnd)}</td>
                  <td style={{ ...tdStyle, fontWeight: 'bold', color: 'var(--primary-color)' }}>${Number((emp.basicSalary1 ?? emp.basicSalary) || 0).toFixed(2)}</td>
                  <td style={tdStyle}>${Number(emp.skillAllowance1 || 0).toFixed(2)}</td>
                  <td style={tdStyle}>${Number(emp.positionAllowance1 || 0).toFixed(2)}</td>
                  <td style={tdStyle}>{emp.nationalId || '-'}</td>
                  <td style={tdStyle} className="kh-text">{emp.placeOfBirth || '-'}</td>
                  <td style={tdStyle} className="kh-text">{emp.address || '-'}</td>
                  <td style={tdStyle} className="kh-text">{emp.education || '-'}</td>
                  <td style={tdStyle}>{emp.numberOfChildren || 0}</td>
                  <td style={tdStyle}>{emp.maritalStatus === 'MARRIED' || emp.maritalStatus === 'រៀបការរួច' ? 'រៀបការរួច' : (emp.maritalStatus === 'SINGLE' || emp.maritalStatus === 'នៅលីវ' ? 'នៅលីវ' : (emp.maritalStatus || '-'))}</td>
                  <td style={tdStyle} className="kh-text">{emp.spouseName || '-'}</td>
                  <td style={tdStyle} className="kh-text">{emp.healthBook || '-'}</td>
                  <td style={tdStyle} className="kh-text">{emp.healthCertificate || '-'}</td>
                  <td style={tdStyle}>{emp.phone || '-'}</td>
                  <td style={tdStyle}>
                    {emp.telegramChatId ? (
                      <span style={{ backgroundColor: '#e0f2fe', color: '#0369a1', padding: '2px 6px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 600 }}>
                        ✈️ {emp.telegramChatId}
                      </span>
                    ) : (
                      <span style={{ color: '#94a3b8' }}>-</span>
                    )}
                  </td>
                  <td style={tdStyle}>{emp.nssfNo || '-'}</td>
                  <td style={tdStyle} className="kh-text">{emp.remark || '-'}</td>
                  <td style={{ ...tdStyle, borderRight: 'none', padding: '2px 6px' }}>
                     <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}>
                       <Link href={`/dashboard/employees/${emp.id}/id-card`} style={{ color: '#10b981', textDecoration: 'none', fontSize: '0.9rem' }} title="Print ID Card">🪪</Link>
                       <Link href={`/dashboard/employees/${emp.id}`} style={{ color: '#3b82f6', textDecoration: 'none', fontSize: '0.9rem' }} title={t.employee.edit}>✏️</Link>
                       <DeleteEmployeeButton id={emp.id} confirmText={t.employee.confirmDelete} deleteText={t.employee.delete} />
                     </div>
                  </td>
                </tr>
                );
              })
            )}
          </tbody>
        </table>
        </div>

        {/* Compact Trilingual Pagination Footer for 1000+ employees */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '7px 14px',
            borderTop: '1px dashed var(--border-color)',
            backgroundColor: 'var(--surface-color)',
            flexWrap: 'wrap',
            gap: '8px',
            fontSize: '0.82rem',
          }}
        >
          {/* Record range */}
          <div style={{ color: 'var(--text-color)', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span>បង្ហាញ / Showing:</span>
            <strong>
              {totalEmployees === 0 ? 0 : (safeCurrentPage - 1) * (pageSize === -1 ? 0 : pageSize) + 1}
            </strong>
            <span>-</span>
            <strong>
              {pageSize === -1 ? totalEmployees : Math.min(safeCurrentPage * pageSize, totalEmployees)}
            </strong>
            <span>នៃ / of</span>
            <strong style={{ color: 'var(--primary-color)' }}>{totalEmployees.toLocaleString()}</strong>
            <span style={{ color: '#94a3b8', marginLeft: '4px' }}>
              បុគ្គលិក / Employees / 员工
            </span>
          </div>

          {/* Page size and navigation controls */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            {/* Page Size Selector */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <span style={{ color: '#64748b', fontSize: '0.8rem' }}>ក្នុង១ទំព័រ / Per page:</span>
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setCurrentPage(1);
                }}
                style={{
                  padding: '3px 8px',
                  borderRadius: '6px',
                  border: '1px solid var(--border-color)',
                  backgroundColor: 'var(--card-bg, #ffffff)',
                  color: 'var(--text-color)',
                  fontSize: '0.82rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                <option value={15}>15</option>
                <option value={30}>30</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
                <option value={200}>200</option>
                <option value={-1}>ទាំងអស់ (All)</option>
              </select>
            </div>

            {/* Page Navigation Buttons */}
            {pageSize !== -1 && totalPages > 1 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                <button
                  type="button"
                  onClick={() => setCurrentPage(1)}
                  disabled={safeCurrentPage === 1}
                  style={{
                    padding: '3px 7px',
                    borderRadius: '5px',
                    border: '1px solid var(--border-color)',
                    background: safeCurrentPage === 1 ? 'rgba(0,0,0,0.03)' : 'var(--card-bg, #ffffff)',
                    color: safeCurrentPage === 1 ? '#94a3b8' : 'var(--text-color)',
                    cursor: safeCurrentPage === 1 ? 'not-allowed' : 'pointer',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                  }}
                  title="First Page / ទំព័រដំបូង"
                >
                  ⏮
                </button>
                <button
                  type="button"
                  onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                  disabled={safeCurrentPage === 1}
                  style={{
                    padding: '3px 7px',
                    borderRadius: '5px',
                    border: '1px solid var(--border-color)',
                    background: safeCurrentPage === 1 ? 'rgba(0,0,0,0.03)' : 'var(--card-bg, #ffffff)',
                    color: safeCurrentPage === 1 ? '#94a3b8' : 'var(--text-color)',
                    cursor: safeCurrentPage === 1 ? 'not-allowed' : 'pointer',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                  }}
                  title="Previous Page / ទំព័រមុន"
                >
                  ◀
                </button>

                <span style={{ fontSize: '0.8rem', padding: '0 6px', fontWeight: 600, color: 'var(--text-color)' }}>
                  ទំព័រ {safeCurrentPage} / {totalPages}
                </span>

                <button
                  type="button"
                  onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                  disabled={safeCurrentPage === totalPages}
                  style={{
                    padding: '3px 7px',
                    borderRadius: '5px',
                    border: '1px solid var(--border-color)',
                    background: safeCurrentPage === totalPages ? 'rgba(0,0,0,0.03)' : 'var(--card-bg, #ffffff)',
                    color: safeCurrentPage === totalPages ? '#94a3b8' : 'var(--text-color)',
                    cursor: safeCurrentPage === totalPages ? 'not-allowed' : 'pointer',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                  }}
                  title="Next Page / ទំព័របន្ទាប់"
                >
                  ▶
                </button>
                <button
                  type="button"
                  onClick={() => setCurrentPage(totalPages)}
                  disabled={safeCurrentPage === totalPages}
                  style={{
                    padding: '3px 7px',
                    borderRadius: '5px',
                    border: '1px solid var(--border-color)',
                    background: safeCurrentPage === totalPages ? 'rgba(0,0,0,0.03)' : 'var(--card-bg, #ffffff)',
                    color: safeCurrentPage === totalPages ? '#94a3b8' : 'var(--text-color)',
                    cursor: safeCurrentPage === totalPages ? 'not-allowed' : 'pointer',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                  }}
                  title="Last Page / ទំព័រចុងក្រោយ"
                >
                  ⏭
                </button>
              </div>
            )}
          </div>
        </div>
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

      {hoveredPhoto && !selectedPhoto && (
        <div
          style={{
            position: 'fixed',
            top: mousePos.y + 15,
            left: mousePos.x + 15,
            zIndex: 1500,
            pointerEvents: 'none',
            borderRadius: '8px',
            overflow: 'hidden',
            boxShadow: '0 10px 25px rgba(0,0,0,0.3)',
            backgroundColor: 'white',
            padding: '4px',
            animation: 'fadeIn 0.2s ease-out'
          }}
        >
          <img 
            src={hoveredPhoto} 
            alt="Preview" 
            style={{ 
              width: '180px', 
              height: '180px', 
              objectFit: 'cover',
              borderRadius: '4px'
            }} 
          />
        </div>
      )}
    </>
  );
}
