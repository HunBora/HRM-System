import { getDictionary } from '@/i18n/getDictionary';
import styles from '../kpi.module.css';

export default async function KpiPlanPage() {
  const t = await getDictionary();

  const annualPlan = [
    { kpi: 'Employee Turnover', target: '<= 5%', q1: 6, q2: 5.5, q3: 4.8, q4: 4.5 },
    { kpi: 'Attendance Rate', target: '>= 98%', q1: 97, q2: 97.5, q3: 98, q4: 98.2 },
    { kpi: 'Training Completion', target: '100%', q1: 25, q2: 50, q3: 75, q4: 100 },
  ];

  return (
    <div className={styles.dashboardContainer}>
      <div>
        <h1 className={`${styles.headerTitle} kh-text`}>{t.kpi.plan.title}</h1>
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'center' }}>
          <thead>
            <tr style={{ backgroundColor: 'var(--surface-color)', borderBottom: '1px solid var(--border-color)' }}>
              <th style={{ padding: '15px 20px', textAlign: 'left', fontWeight: 600 }} className="kh-text">KPI Name</th>
              <th style={{ padding: '15px 20px', fontWeight: 600 }} className="kh-text">Target</th>
              <th style={{ padding: '15px 20px', fontWeight: 600 }} className="kh-text">{t.kpi.plan.q1}</th>
              <th style={{ padding: '15px 20px', fontWeight: 600 }} className="kh-text">{t.kpi.plan.q2}</th>
              <th style={{ padding: '15px 20px', fontWeight: 600 }} className="kh-text">{t.kpi.plan.q3}</th>
              <th style={{ padding: '15px 20px', fontWeight: 600 }} className="kh-text">{t.kpi.plan.q4}</th>
            </tr>
          </thead>
          <tbody>
            {annualPlan.map((plan, i) => (
              <tr key={i} style={{ borderBottom: '1px solid var(--border-color)' }}>
                <td style={{ padding: '15px 20px', textAlign: 'left', fontWeight: 500, color: 'var(--text-main)' }}>{plan.kpi}</td>
                <td style={{ padding: '15px 20px', color: '#8b5cf6', fontWeight: 500 }}>{plan.target}</td>
                <td style={{ padding: '15px 20px', color: 'var(--text-muted)' }}>{plan.q1}</td>
                <td style={{ padding: '15px 20px', color: 'var(--text-muted)' }}>{plan.q2}</td>
                <td style={{ padding: '15px 20px', color: 'var(--text-muted)' }}>{plan.q3}</td>
                <td style={{ padding: '15px 20px', color: '#10b981', fontWeight: 600 }}>{plan.q4}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
