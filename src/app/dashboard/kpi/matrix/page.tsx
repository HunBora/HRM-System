import { getDictionary } from '@/i18n/getDictionary';
import styles from '../kpi.module.css';

export default async function KpiMatrixPage() {
  const t = await getDictionary();

  const matrixData = [
    { company: 'Increase Efficiency', dept: 'Production', kpi: 'Machine Uptime >= 95%', weight: '40%' },
    { company: 'Reduce Costs', dept: 'HR', kpi: 'Turnover <= 5%', weight: '30%' },
    { company: 'Improve Quality', dept: 'QA', kpi: 'Defect Rate < 1%', weight: '50%' },
  ];

  return (
    <div className={styles.dashboardContainer}>
      <div>
        <h1 className={`${styles.headerTitle} kh-text`}>{t.kpi.matrix.title}</h1>
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ backgroundColor: 'var(--surface-color)', borderBottom: '1px solid var(--border-color)' }}>
              <th style={{ padding: '15px 20px', fontWeight: 600 }} className="kh-text">{t.kpi.matrix.companyGoal}</th>
              <th style={{ padding: '15px 20px', fontWeight: 600 }} className="kh-text">Department</th>
              <th style={{ padding: '15px 20px', fontWeight: 600 }} className="kh-text">{t.kpi.matrix.deptGoal}</th>
              <th style={{ padding: '15px 20px', fontWeight: 600 }} className="kh-text">Weight</th>
            </tr>
          </thead>
          <tbody>
            {matrixData.map((data, i) => (
              <tr key={i} style={{ borderBottom: '1px solid var(--border-color)' }}>
                <td style={{ padding: '15px 20px', color: 'var(--text-main)', fontWeight: 500 }}>{data.company}</td>
                <td style={{ padding: '15px 20px', color: 'var(--text-muted)' }}>
                  <span style={{ padding: '4px 10px', borderRadius: '6px', background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6', fontSize: '0.8rem' }}>
                    {data.dept}
                  </span>
                </td>
                <td style={{ padding: '15px 20px', color: 'var(--text-main)' }}>{data.kpi}</td>
                <td style={{ padding: '15px 20px', color: '#10b981', fontWeight: 600 }}>{data.weight}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
