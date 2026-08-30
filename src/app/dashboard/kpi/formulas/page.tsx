import styles from '../kpi.module.css';
import { getDictionary } from '@/i18n/getDictionary';

export default async function KpiFormulasPage() {
  const t = await getDictionary();

  return (
    <div className={styles.dashboardContainer}>
      <div className={styles.evidenceSection} style={{ padding: '2rem' }}>
        <h2 className={`${styles.headerTitle} kh-text`} style={{ fontSize: '1.4rem' }}>
          {t.kpi.formulas.title}
        </h2>
        
        <p className="kh-text" style={{ marginTop: '1rem', fontWeight: 500, color: 'var(--text-main)' }}>
          {t.kpi.formulas.subtitle}
        </p>
        
        <ul style={{ marginTop: '0.8rem', marginLeft: '1.5rem', lineHeight: '1.8', color: 'var(--text-muted)' }}>
          {t.kpi.formulas.sources.map((source, index) => (
            <li key={index} className="kh-text">
              <span style={{ color: 'var(--text-main)', fontWeight: 500 }}>{source}</span>
            </li>
          ))}
        </ul>

        <div style={{ marginTop: '2.5rem' }}>
          <h3 className="kh-text" style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '1rem' }}>
            {t.kpi.formulas.exampleTitle}
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
            {t.kpi.formulas.items.map((item, index) => (
              <details 
                key={index} 
                style={{ 
                  border: '1px solid var(--border-color)', 
                  borderRadius: '10px', 
                  overflow: 'hidden',
                  background: 'var(--surface-color)',
                  transition: 'all 0.3s ease'
                }}
              >
                <summary 
                  style={{ 
                    padding: '1rem 1.5rem', 
                    cursor: 'pointer', 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center',
                    background: 'transparent',
                    listStyle: 'none'
                  }}
                  className="kh-text formula-summary"
                >
                  <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>
                    {item.name}
                  </span>
                  <span style={{ color: 'var(--text-muted)' }}>
                    ↓
                  </span>
                </summary>
                
                <div style={{ 
                  padding: '1.5rem', 
                  borderTop: '1px solid var(--border-color)',
                  background: 'rgba(255, 255, 255, 0.02)',
                  animation: 'fadeIn 0.3s ease'
                }}>
                  <span className="kh-text" style={{ color: 'var(--text-muted)', marginRight: '0.5rem' }}>
                    {t.kpi.formulas.formulaLabel}
                  </span>
                  <span style={{ fontWeight: 600, color: '#10b981' }}>
                    {item.formula}
                  </span>
                </div>
              </details>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
