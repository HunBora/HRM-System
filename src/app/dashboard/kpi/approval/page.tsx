import { getDictionary } from '@/i18n/getDictionary';
import styles from '../kpi.module.css';
import { prisma } from '@/lib/prisma';
import { updateKpiStatus } from '../actions';
import KpiExportImportButtons from './KpiExportImportButtons';

export default async function KpiApprovalPage() {
  const t = await getDictionary();

  // Fetch real KPIs from database
  const kpis = await prisma.kpi.findMany({
    include: {
      employee: true
    },
    orderBy: {
      createdAt: 'desc'
    }
  });

  return (
    <div className={styles.dashboardContainer}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px', marginBottom: '10px' }}>
        <h1 className={`${styles.headerTitle} kh-text`} style={{ margin: 0 }}>{t.kpi.approval.title}</h1>
        <KpiExportImportButtons />
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ backgroundColor: 'var(--surface-color)', borderBottom: '1px solid var(--border-color)' }}>
              <th style={{ padding: '15px 20px', fontWeight: 600 }} className="kh-text">{t.kpi.approval.table.employee}</th>
              <th style={{ padding: '15px 20px', fontWeight: 600 }} className="kh-text">{t.kpi.approval.table.kpi}</th>
              <th style={{ padding: '15px 20px', fontWeight: 600 }} className="kh-text">{t.kpi.approval.table.target}</th>
              <th style={{ padding: '15px 20px', fontWeight: 600 }} className="kh-text">{t.kpi.approval.table.status}</th>
              <th style={{ padding: '15px 20px', fontWeight: 600 }} className="kh-text">{t.kpi.approval.table.action}</th>
            </tr>
          </thead>
          <tbody>
            {kpis.length === 0 && (
              <tr>
                <td colSpan={5} style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)' }} className="kh-text">
                  មិនមានទិន្នន័យ (No records)
                </td>
              </tr>
            )}
            {kpis.map((kpi) => (
              <tr key={kpi.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                <td style={{ padding: '15px 20px' }}>
                  <div style={{ fontWeight: 500, color: 'var(--text-main)' }}>
                    {kpi.employee.lastNameKh} {kpi.employee.firstNameKh} ({kpi.employee.firstNameEn} {kpi.employee.lastNameEn})
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>ID: {kpi.employee.employeeId} | {new Date(kpi.docDate).toLocaleDateString()}</div>
                </td>
                <td style={{ padding: '15px 20px', color: 'var(--text-main)' }}>
                  {kpi.kpiType} <br/>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{kpi.description}</span>
                </td>
                <td style={{ padding: '15px 20px', color: '#8b5cf6', fontWeight: 500 }}>
                  {kpi.target} {kpi.measurePercent && `(${kpi.measurePercent})`} <br/>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 'normal' }}>Actual: {kpi.actual}</span>
                </td>
                <td style={{ padding: '15px 20px' }}>
                  <span style={{ 
                    padding: '4px 10px', 
                    borderRadius: '20px', 
                    background: kpi.status === 'APPROVED' ? 'rgba(16, 185, 129, 0.1)' : kpi.status === 'REJECTED' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(245, 158, 11, 0.1)', 
                    color: kpi.status === 'APPROVED' ? '#10b981' : kpi.status === 'REJECTED' ? '#ef4444' : '#f59e0b', 
                    fontSize: '0.8rem', 
                    fontWeight: 600 
                  }}>
                    {kpi.status}
                  </span>
                </td>
                <td style={{ padding: '15px 20px' }}>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    {kpi.status === 'PENDING' && (
                      <>
                        <form action={updateKpiStatus}>
                          <input type="hidden" name="id" value={kpi.id} />
                          <input type="hidden" name="status" value="APPROVED" />
                          <button type="submit" className="kh-text" style={{ padding: '6px 12px', borderRadius: '6px', border: 'none', background: '#10b981', color: 'white', cursor: 'pointer', fontSize: '0.9rem' }}>
                            {t.kpi.approval.approveBtn}
                          </button>
                        </form>
                        <form action={updateKpiStatus}>
                          <input type="hidden" name="id" value={kpi.id} />
                          <input type="hidden" name="status" value="REJECTED" />
                          <button type="submit" className="kh-text" style={{ padding: '6px 12px', borderRadius: '6px', border: '1px solid #ef4444', background: 'transparent', color: '#ef4444', cursor: 'pointer', fontSize: '0.9rem' }}>
                            {t.kpi.approval.rejectBtn}
                          </button>
                        </form>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
