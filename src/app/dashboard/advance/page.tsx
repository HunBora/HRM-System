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

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '15px' }}>
        <h1 className="title kh-text" style={{ marginBottom: 0 }}>{t.advance.title}</h1>
        
        <Link href="/dashboard/advance/new" className="btn-primary kh-text" style={{ textDecoration: 'none' }}>
          {t.advance.newBtn}
        </Link>
      </div>

      <div className="card" style={{ overflowX: 'auto', padding: 0, border: '1px dashed var(--border-color)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'center' }}>
          <thead>
            <tr style={{ backgroundColor: 'var(--surface-color)' }}>
              <th style={{ padding: '12px', borderBottom: '1px dashed var(--border-color)', borderRight: '1px dashed var(--border-color)' }} className="kh-text">{t.advance.columns.id}</th>
              <th style={{ padding: '12px', borderBottom: '1px dashed var(--border-color)', borderRight: '1px dashed var(--border-color)' }} className="kh-text">{t.advance.columns.name}</th>
              <th style={{ padding: '12px', borderBottom: '1px dashed var(--border-color)', borderRight: '1px dashed var(--border-color)' }} className="kh-text">{t.advance.columns.amount}</th>
              <th style={{ padding: '12px', borderBottom: '1px dashed var(--border-color)', borderRight: '1px dashed var(--border-color)' }} className="kh-text">{t.advance.columns.date}</th>
              <th style={{ padding: '12px', borderBottom: '1px dashed var(--border-color)', borderRight: '1px dashed var(--border-color)' }} className="kh-text">{t.advance.columns.monthYear}</th>
              <th style={{ padding: '12px', borderBottom: '1px dashed var(--border-color)', borderRight: '1px dashed var(--border-color)' }} className="kh-text">{t.advance.columns.reason}</th>
              <th style={{ padding: '12px', borderBottom: '1px dashed var(--border-color)', borderRight: '1px dashed var(--border-color)' }} className="kh-text">{t.advance.columns.status}</th>
              <th style={{ padding: '12px', borderBottom: '1px dashed var(--border-color)' }} className="kh-text">{t.advance.columns.actions}</th>
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
                <tr key={adv.id} style={{ transition: 'background-color 0.2s' }}>
                  <td style={{ padding: '12px', borderBottom: '1px dashed var(--border-color)', borderRight: '1px dashed var(--border-color)' }}>{adv.employee.employeeId}</td>
                  <td style={{ padding: '12px', borderBottom: '1px dashed var(--border-color)', borderRight: '1px dashed var(--border-color)' }} className="kh-text">{adv.employee.firstNameEn} {adv.employee.lastNameEn}</td>
                  <td style={{ padding: '12px', borderBottom: '1px dashed var(--border-color)', borderRight: '1px dashed var(--border-color)', fontWeight: 'bold', color: '#b91c1c' }}>
                    $ {adv.amount.toFixed(2)}
                  </td>
                  <td style={{ padding: '12px', borderBottom: '1px dashed var(--border-color)', borderRight: '1px dashed var(--border-color)' }}>{new Date(adv.requestDate).toLocaleDateString('en-GB')}</td>
                  <td style={{ padding: '12px', borderBottom: '1px dashed var(--border-color)', borderRight: '1px dashed var(--border-color)' }}>{adv.month}/{adv.year}</td>
                  <td style={{ padding: '12px', borderBottom: '1px dashed var(--border-color)', borderRight: '1px dashed var(--border-color)' }} className="kh-text">{adv.reason || '-'}</td>
                  <td style={{ padding: '12px', borderBottom: '1px dashed var(--border-color)', borderRight: '1px dashed var(--border-color)' }}>
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
                  <td style={{ padding: '12px', borderBottom: '1px dashed var(--border-color)' }}>
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
