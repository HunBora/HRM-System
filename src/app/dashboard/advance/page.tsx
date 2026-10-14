import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { getDictionary } from '@/i18n/getDictionary';
import AdvanceStatusClient from './AdvanceStatusClient';

export default async function AdvancePage() {
  const t = await getDictionary();
  
  const advances = await prisma.advanceSalary.findMany({
    include: { employee: true },
    orderBy: { createdAt: 'desc' }
  });

  const totalCount = advances.length;
  const totalAmount = advances.reduce((sum, a) => sum + a.amount, 0);
  const pendingCount = advances.filter(a => a.status === 'PENDING').length;
  const approvedCount = advances.filter(a => a.status === 'APPROVED').length;
  const deductedCount = advances.filter(a => a.status === 'DEDUCTED').length;

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
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '1.6rem' }}>💵</span>
          <div>
            <h1 className="kh-text" style={{ fontSize: '1.35rem', fontWeight: 700, margin: 0, color: '#0f172a' }}>
              ប្រាក់បុរេប្រទាន / បុរេប្រាក់ខែ (Advance Salary)
            </h1>
            <p style={{ margin: '2px 0 0 0', fontSize: '0.85rem', color: '#64748b' }}>
              គ្រប់គ្រងពាក្យស្នើសុំបើកប្រាក់បុរេប្រទានមុនកាលកំណត់របស់បុគ្គលិក
            </p>
          </div>
        </div>
        
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
          <Link 
            href="/dashboard/loans" 
            className="btn-secondary kh-text" 
            style={{ 
              textDecoration: 'none', 
              display: 'inline-flex', 
              alignItems: 'center', 
              gap: '6px',
              padding: '9px 16px',
              fontSize: '0.88rem'
            }}
          >
            <span>💳</span>
            <span>ប្រាក់កម្ចីបុគ្គលិក (Loans)</span>
          </Link>
          <Link 
            href="/dashboard/advance/new" 
            className="btn-primary kh-text" 
            style={{ 
              textDecoration: 'none',
              display: 'inline-flex', 
              alignItems: 'center', 
              gap: '6px',
              padding: '9px 18px',
              fontSize: '0.88rem',
              fontWeight: 600
            }}
          >
            <span>➕</span>
            <span>{t.advance.newBtn}</span>
          </Link>
        </div>
      </div>

      {/* 2. Metric Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px' }}>
        <div style={{ padding: '16px 20px', borderRadius: '12px', background: '#ffffff', border: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div className="kh-text" style={{ color: '#64748b', fontSize: '0.85rem', marginBottom: '4px' }}>សំណើសរុប (Total)</div>
            <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#0f172a' }}>{totalCount} <span style={{ fontSize: '0.85rem', fontWeight: 500, color: '#64748b' }}>ច្បាប់</span></div>
          </div>
          <div style={{ fontSize: '1.3rem', width: '42px', height: '42px', borderRadius: '10px', backgroundColor: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>📋</div>
        </div>

        <div style={{ padding: '16px 20px', borderRadius: '12px', background: '#ffffff', border: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div className="kh-text" style={{ color: '#64748b', fontSize: '0.85rem', marginBottom: '4px' }}>ទឹកប្រាក់សរុប (Total Value)</div>
            <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#dc2626' }}>${totalAmount.toFixed(2)}</div>
          </div>
          <div style={{ fontSize: '1.3rem', width: '42px', height: '42px', borderRadius: '10px', backgroundColor: '#fee2e2', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>💰</div>
        </div>

        <div style={{ padding: '16px 20px', borderRadius: '12px', background: '#ffffff', border: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div className="kh-text" style={{ color: '#d97706', fontSize: '0.85rem', marginBottom: '4px' }}>រង់ចាំអនុម័ត (Pending)</div>
            <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#d97706' }}>{pendingCount}</div>
          </div>
          <div style={{ fontSize: '1.3rem', width: '42px', height: '42px', borderRadius: '10px', backgroundColor: '#fef3c7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>⏳</div>
        </div>

        <div style={{ padding: '16px 20px', borderRadius: '12px', background: '#ffffff', border: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div className="kh-text" style={{ color: '#16a34a', fontSize: '0.85rem', marginBottom: '4px' }}>អនុម័ត / បានកាត់ (Approved/Deducted)</div>
            <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#16a34a' }}>{approvedCount + deductedCount}</div>
          </div>
          <div style={{ fontSize: '1.3rem', width: '42px', height: '42px', borderRadius: '10px', backgroundColor: '#dcfce7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✅</div>
        </div>
      </div>

      {/* 3. Table Container */}
      <div style={{ 
        backgroundColor: '#ffffff',
        borderRadius: '12px', 
        border: '1px solid #e2e8f0',
        overflow: 'hidden',
        boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
      }}>
        <div style={{ overflowX: 'auto', maxHeight: 'calc(100vh - 380px)', minHeight: advances.length === 0 ? '280px' : 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'center', minWidth: '950px' }}>
            <thead>
              <tr style={{ backgroundColor: '#f8fafc', position: 'sticky', top: 0, zIndex: 10 }}>
                <th style={thStyle} className="kh-text">
                  <div>អត្តលេខ (ID)</div>
                  <span style={{ fontSize: '0.75rem', fontWeight: 400, color: '#94a3b8' }}>员工编号</span>
                </th>
                <th style={thStyle} className="kh-text">
                  <div>ឈ្មោះបុគ្គលិក (Name)</div>
                  <span style={{ fontSize: '0.75rem', fontWeight: 400, color: '#94a3b8' }}>员工姓名</span>
                </th>
                <th style={thStyle} className="kh-text">
                  <div>ចំនួនទឹកប្រាក់ (Amount)</div>
                  <span style={{ fontSize: '0.75rem', fontWeight: 400, color: '#94a3b8' }}>申请金额</span>
                </th>
                <th style={thStyle} className="kh-text">
                  <div>កាលបរិច្ឆេទ (Date)</div>
                  <span style={{ fontSize: '0.75rem', fontWeight: 400, color: '#94a3b8' }}>申请日期</span>
                </th>
                <th style={thStyle} className="kh-text">
                  <div>ខែ/ឆ្នាំ កាត់ប្រាក់ (Month/Year)</div>
                  <span style={{ fontSize: '0.75rem', fontWeight: 400, color: '#94a3b8' }}>扣款月份</span>
                </th>
                <th style={thStyle} className="kh-text">
                  <div>មូលហេតុ (Reason)</div>
                  <span style={{ fontSize: '0.75rem', fontWeight: 400, color: '#94a3b8' }}>申请原因</span>
                </th>
                <th style={thStyle} className="kh-text">
                  <div>ស្ថានភាព (Status)</div>
                  <span style={{ fontSize: '0.75rem', fontWeight: 400, color: '#94a3b8' }}>审核状态</span>
                </th>
                <th style={{ ...thStyle, borderRight: 'none' }} className="kh-text">
                  <div>សកម្មភាព (Actions)</div>
                  <span style={{ fontSize: '0.75rem', fontWeight: 400, color: '#94a3b8' }}>操作</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {advances.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ padding: '60px 20px', textAlign: 'center' }}>
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
                        💵
                      </div>
                      <div className="kh-text" style={{ fontSize: '1.05rem', fontWeight: 600, color: '#334155' }}>
                        មិនមានទិន្នន័យប្រាក់បុរេប្រទាននៅឡើយទេ
                      </div>
                      <div className="kh-text" style={{ fontSize: '0.85rem', color: '#94a3b8', maxWidth: '380px' }}>
                        រាល់ពាក្យស្នើសុំប្រាក់បុរេប្រទានរបស់បុគ្គលិក នឹងបង្ហាញនៅត្រង់នេះដើម្បីត្រួតពិនិត្យ និងអនុម័ត។
                      </div>
                      <Link 
                        href="/dashboard/advance/new" 
                        className="btn-secondary kh-text" 
                        style={{ marginTop: '8px', padding: '6px 16px', fontSize: '0.85rem', textDecoration: 'none' }}
                      >
                        ➕ ស្នើសុំប្រាក់បុរេប្រទានថ្មី
                      </Link>
                    </div>
                  </td>
                </tr>
              ) : (
                advances.map((adv, idx) => (
                  <tr 
                    key={adv.id} 
                    style={{ 
                      transition: 'background-color 0.15s ease', 
                      backgroundColor: idx % 2 === 1 ? 'rgba(248, 250, 252, 0.6)' : '#ffffff' 
                    }}
                    className="hover:bg-indigo-50/40"
                  >
                    <td style={tdStyle}>
                      <span style={{ fontWeight: 600, color: '#2563eb' }}>{adv.employee.employeeId}</span>
                    </td>
                    <td style={tdStyle}>
                      <div className="kh-text" style={{ fontWeight: 600, color: '#0f172a' }}>{adv.employee.firstNameKh} {adv.employee.lastNameKh}</div>
                      <div style={{ fontSize: '0.78rem', color: '#64748b' }}>{adv.employee.firstNameEn} {adv.employee.lastNameEn}</div>
                    </td>
                    <td style={{ ...tdStyle, fontWeight: 700, color: '#dc2626', fontSize: '0.95rem' }}>
                      ${adv.amount.toFixed(2)}
                    </td>
                    <td style={tdStyle}>{new Date(adv.requestDate).toLocaleDateString('en-GB')}</td>
                    <td style={tdStyle}>
                      <span style={{ backgroundColor: '#f1f5f9', padding: '2px 8px', borderRadius: '4px', fontWeight: 500 }}>
                        {adv.month.toString().padStart(2, '0')}/{adv.year}
                      </span>
                    </td>
                    <td style={tdStyle} className="kh-text">{adv.reason || '-'}</td>
                    <td style={tdStyle}>
                      <span style={{ 
                        padding: '3px 10px', 
                        borderRadius: '20px', 
                        fontSize: '0.78rem',
                        fontWeight: 700,
                        backgroundColor: adv.status === 'APPROVED' ? '#dcfce7' : adv.status === 'REJECTED' ? '#fee2e2' : adv.status === 'DEDUCTED' ? '#e0e7ff' : '#fef3c7',
                        color: adv.status === 'APPROVED' ? '#166534' : adv.status === 'REJECTED' ? '#991b1b' : adv.status === 'DEDUCTED' ? '#3730a3' : '#92400e',
                        border: `1px solid ${adv.status === 'APPROVED' ? '#86efac' : adv.status === 'REJECTED' ? '#fca5a5' : adv.status === 'DEDUCTED' ? '#a5b4fc' : '#fcd34d'}`
                      }}>
                        {adv.status}
                      </span>
                    </td>
                    <td style={{ ...tdStyle, borderRight: 'none' }}>
                      <AdvanceStatusClient id={adv.id} currentStatus={adv.status} t={t} />
                    </td>
                  </tr>
                ))
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
