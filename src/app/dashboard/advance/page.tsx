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
            color: '#10b981',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '17px',
          }}>
            💵
          </div>
          <div>
            <h1 className="kh-text" style={{ fontSize: '1.05rem', fontWeight: 800, margin: 0, color: '#0f172a', lineHeight: 1.2 }}>
              ប្រាក់បុរេប្រទាន / បុរេប្រាក់ខែ
            </h1>
            <p style={{ margin: 0, fontSize: '0.7rem', color: '#64748b', fontWeight: 500 }}>
              Advance Salary Management
            </p>
          </div>
        </div>
        
        <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap' }}>
          <Link 
            href="/dashboard/loans" 
            className="btn-secondary kh-text" 
            style={{ 
              textDecoration: 'none', 
              display: 'inline-flex', 
              alignItems: 'center', 
              gap: '4px',
              padding: '4px 10px',
              fontSize: '0.78rem',
              height: '28px',
              boxSizing: 'border-box',
              borderRadius: '6px',
            }}
          >
            <span>💳</span>
            <span>ប្រាក់កម្ចី (Loans)</span>
          </Link>
          <Link 
            href="/dashboard/advance/new" 
            className="btn-primary kh-text" 
            style={{ 
              textDecoration: 'none', 
              display: 'inline-flex', 
              alignItems: 'center', 
              gap: '4px',
              padding: '4px 10px',
              fontSize: '0.78rem',
              fontWeight: 700,
              height: '28px',
              boxSizing: 'border-box',
              borderRadius: '6px',
            }}
          >
            <span>➕</span>
            <span>{t.advance.newBtn}</span>
          </Link>
        </div>
      </div>

      {/* 2. Metric Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '8px' }}>
        <div style={{ padding: '6px 12px', borderRadius: '10px', background: '#ffffff', border: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 1px 2px rgba(0,0,0,0.02)' }}>
          <div>
            <div className="kh-text" style={{ color: '#64748b', fontSize: '0.75rem', fontWeight: 600 }}>សំណើសរុប (Total)</div>
            <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0f172a', lineHeight: 1.2 }}>{totalCount} <span style={{ fontSize: '0.75rem', fontWeight: 500, color: '#64748b' }}>ច្បាប់</span></div>
          </div>
          <div style={{ fontSize: '14px', width: '28px', height: '28px', borderRadius: '6px', backgroundColor: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>📋</div>
        </div>

        <div style={{ padding: '6px 12px', borderRadius: '10px', background: '#ffffff', border: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 1px 2px rgba(0,0,0,0.02)' }}>
          <div>
            <div className="kh-text" style={{ color: '#64748b', fontSize: '0.75rem', fontWeight: 600 }}>ទឹកប្រាក់សរុប (Total)</div>
            <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#dc2626', lineHeight: 1.2 }}>${totalAmount.toFixed(2)}</div>
          </div>
          <div style={{ fontSize: '14px', width: '28px', height: '28px', borderRadius: '6px', backgroundColor: '#fee2e2', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>💰</div>
        </div>

        <div style={{ padding: '6px 12px', borderRadius: '10px', background: '#ffffff', border: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 1px 2px rgba(0,0,0,0.02)' }}>
          <div>
            <div className="kh-text" style={{ color: '#d97706', fontSize: '0.75rem', fontWeight: 600 }}>រង់ចាំអនុម័ត (Pending)</div>
            <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#d97706', lineHeight: 1.2 }}>{pendingCount}</div>
          </div>
          <div style={{ fontSize: '14px', width: '28px', height: '28px', borderRadius: '6px', backgroundColor: '#fef3c7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>⏳</div>
        </div>

        <div style={{ padding: '6px 12px', borderRadius: '10px', background: '#ffffff', border: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 1px 2px rgba(0,0,0,0.02)' }}>
          <div>
            <div className="kh-text" style={{ color: '#16a34a', fontSize: '0.75rem', fontWeight: 600 }}>អនុម័ត/បានកាត់</div>
            <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#16a34a', lineHeight: 1.2 }}>{approvedCount + deductedCount}</div>
          </div>
          <div style={{ fontSize: '14px', width: '28px', height: '28px', borderRadius: '6px', backgroundColor: '#dcfce7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✅</div>
        </div>
      </div>

      {/* 3. Table Container */}
      <div style={{ 
        backgroundColor: '#ffffff',
        borderRadius: '10px', 
        border: '1px solid #e2e8f0',
        overflow: 'hidden',
        boxShadow: '0 1px 2px rgba(0,0,0,0.03)'
      }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'center', minWidth: '700px' }}>
            <thead>
              <tr style={{ backgroundColor: '#f8fafc', borderBottom: '2px solid #e2e8f0', position: 'sticky', top: 0, zIndex: 10 }}>
                <th style={thStyle} className="kh-text">អត្តលេខ (ID)</th>
                <th style={thStyle} className="kh-text">ឈ្មោះបុគ្គលិក</th>
                <th style={thStyle} className="kh-text">ចំនួនទឹកប្រាក់</th>
                <th style={thStyle} className="kh-text">កាលបរិច្ឆេទ</th>
                <th style={thStyle} className="kh-text">ខែ/ឆ្នាំ កាត់ប្រាក់</th>
                <th style={thStyle} className="kh-text">មូលហេតុ</th>
                <th style={thStyle} className="kh-text">ស្ថានភាព</th>
                <th style={{ ...thStyle, borderRight: 'none' }} className="kh-text">សកម្មភាព</th>
              </tr>
            </thead>
            <tbody>
              {advances.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ padding: '28px 16px', textAlign: 'center' }}>
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
                        💵
                      </div>
                      <div className="kh-text" style={{ fontSize: '0.88rem', fontWeight: 700, color: '#334155' }}>
                        មិនមានទិន្នន័យប្រាក់បុរេប្រទាននៅឡើយទេ
                      </div>
                      <div className="kh-text" style={{ fontSize: '0.75rem', color: '#94a3b8', maxWidth: '340px' }}>
                        រាល់ពាក្យស្នើសុំប្រាក់បុរេប្រទានរបស់បុគ្គលិក នឹងបង្ហាញនៅត្រង់នេះ
                      </div>
                      <Link 
                        href="/dashboard/advance/new" 
                        className="btn-secondary kh-text" 
                        style={{ marginTop: '4px', padding: '4px 12px', fontSize: '0.76rem', textDecoration: 'none', borderRadius: '5px' }}
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
                      <div style={{ fontSize: '0.72rem', color: '#64748b' }}>{adv.employee.firstNameEn} {adv.employee.lastNameEn}</div>
                    </td>
                    <td style={{ ...tdStyle, fontWeight: 700, color: '#dc2626', fontSize: '0.88rem' }}>
                      ${adv.amount.toFixed(2)}
                    </td>
                    <td style={tdStyle}>{new Date(adv.requestDate).toLocaleDateString('en-GB')}</td>
                    <td style={tdStyle}>
                      <span style={{ backgroundColor: '#f1f5f9', padding: '1px 6px', borderRadius: '4px', fontWeight: 500 }}>
                        {adv.month.toString().padStart(2, '0')}/{adv.year}
                      </span>
                    </td>
                    <td style={tdStyle} className="kh-text">{adv.reason || '-'}</td>
                    <td style={tdStyle}>
                      <span style={{ 
                        padding: '2px 8px', 
                        borderRadius: '20px', 
                        fontSize: '0.75rem',
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
