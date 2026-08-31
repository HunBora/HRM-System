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

  const thStyle: React.CSSProperties = {
    padding: '8px 12px',
    borderBottom: '2px solid var(--border-color)',
    borderRight: '1px dashed var(--border-color)',
    backgroundColor: '#f8fafc',
    color: '#334155',
    textAlign: 'center',
    fontWeight: '600',
    fontSize: '0.9rem',
    whiteSpace: 'nowrap'
  };

  const tdStyle: React.CSSProperties = {
    padding: '8px 12px',
    borderBottom: '1px dashed var(--border-color)',
    borderRight: '1px dashed var(--border-color)',
    verticalAlign: 'middle',
    fontSize: '0.9rem'
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '15px' }}>
        <h1 className="title kh-text" style={{ marginBottom: 0 }}>ប្រាក់ខ្ចី (Advance Salary)</h1>
        
        <Link href="/dashboard/advance/new" className="btn-primary kh-text" style={{ textDecoration: 'none' }}>
          {t.advance.newBtn}
        </Link>
      </div>

      <div className="card" style={{ overflowX: 'auto', padding: 0, border: '1px dashed var(--border-color)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'center' }}>
          <thead>
            <tr style={{ backgroundColor: 'var(--surface-color)' }}>
              <th style={thStyle} className="kh-text">អត្តលេខ<br/>ID<br/><span style={{fontSize: '0.8rem', color: '#64748b'}}>编号</span></th>
              <th style={thStyle} className="kh-text">ឈ្មោះបុគ្គលិក<br/>Name<br/><span style={{fontSize: '0.8rem', color: '#64748b'}}>员工姓名</span></th>
              <th style={thStyle} className="kh-text">ចំនួនទឹកប្រាក់<br/>Amount ($)<br/><span style={{fontSize: '0.8rem', color: '#64748b'}}>金额</span></th>
              <th style={thStyle} className="kh-text">កាលបរិច្ឆេទ<br/>Date<br/><span style={{fontSize: '0.8rem', color: '#64748b'}}>日期</span></th>
              <th style={thStyle} className="kh-text">ខែ/ឆ្នាំ កាត់ប្រាក់<br/>Month/Year<br/><span style={{fontSize: '0.8rem', color: '#64748b'}}>扣款月份</span></th>
              <th style={thStyle} className="kh-text">មូលហេតុ<br/>Reason<br/><span style={{fontSize: '0.8rem', color: '#64748b'}}>原因</span></th>
              <th style={thStyle} className="kh-text">ស្ថានភាព<br/>Status<br/><span style={{fontSize: '0.8rem', color: '#64748b'}}>状态</span></th>
              <th style={{...thStyle, borderRight: 'none'}} className="kh-text">សកម្មភាព<br/>Actions<br/><span style={{fontSize: '0.8rem', color: '#64748b'}}>操作</span></th>
            </tr>
          </thead>
          <tbody>
            {advances.length === 0 ? (
              <tr>
                <td colSpan={8} style={{ padding: '30px', textAlign: 'center' }} className="kh-text text-muted">
                  គ្មានទិន្នន័យ (No Data)
                </td>
              </tr>
            ) : (
              advances.map(adv => (
                <tr key={adv.id} style={{ transition: 'background-color 0.2s', backgroundColor: '#fff' }}>
                  <td style={tdStyle}>{adv.employee.employeeId}</td>
                  <td style={tdStyle}>
                    <div className="kh-text" style={{ fontWeight: '500' }}>{adv.employee.firstNameKh} {adv.employee.lastNameKh}</div>
                    <div style={{ fontSize: '0.8rem', color: '#64748b' }}>{adv.employee.firstNameEn} {adv.employee.lastNameEn}</div>
                  </td>
                  <td style={{ ...tdStyle, fontWeight: 'bold', color: '#b91c1c' }}>
                    $ {adv.amount.toFixed(2)}
                  </td>
                  <td style={tdStyle}>{new Date(adv.requestDate).toLocaleDateString('en-GB')}</td>
                  <td style={tdStyle}>{adv.month}/{adv.year}</td>
                  <td style={tdStyle} className="kh-text">{adv.reason || '-'}</td>
                  <td style={tdStyle}>
                    <span style={{ 
                      padding: '4px 8px', 
                      borderRadius: '4px', 
                      fontSize: '0.8rem',
                      fontWeight: 'bold',
                      backgroundColor: adv.status === 'APPROVED' ? '#dcfce7' : adv.status === 'REJECTED' ? '#fee2e2' : adv.status === 'DEDUCTED' ? '#e0e7ff' : '#fef3c7',
                      color: adv.status === 'APPROVED' ? '#166534' : adv.status === 'REJECTED' ? '#991b1b' : adv.status === 'DEDUCTED' ? '#3730a3' : '#92400e'
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
  );
}
