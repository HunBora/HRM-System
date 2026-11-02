import { getDictionary } from '@/i18n/getDictionary';
import styles from './kpi.module.css';
import KpiExportImportButtons from './approval/KpiExportImportButtons';

export default async function KpiPage() {
  const t = await getDictionary();

  // Mock data for Department KPIs
  const departments = [
    {
      name: 'IT & Engineering',
      icon: '💻',
      score: 96,
      kpis: [
        { name: t.kpi.items.attendanceRate, target: '>=98%', current: 97, color: '#3b82f6' },
        { name: t.kpi.items.turnover, target: '<=5%', current: 95, color: '#10b981' }
      ]
    },
    {
      name: 'Human Resources',
      icon: '👥',
      score: 92,
      kpis: [
        { name: t.kpi.items.leadTime, target: '<=30 Days', current: 90, color: '#8b5cf6' },
        { name: t.kpi.items.satisfaction, target: '>=85%', current: 88, color: '#f59e0b' }
      ]
    },
    {
      name: 'Production',
      icon: '🏭',
      score: 85,
      kpis: [
        { name: t.kpi.items.attendanceRate, target: '>=98%', current: 92, color: '#3b82f6' },
        { name: t.kpi.items.turnover, target: '<=5%', current: 85, color: '#10b981' },
        { name: t.kpi.items.training, target: '100%', current: 75, color: '#ef4444' }
      ]
    },
    {
      name: 'Quality Assurance',
      icon: '🔍',
      score: 98,
      kpis: [
        { name: t.kpi.items.training, target: '100%', current: 100, color: '#ef4444' },
        { name: t.kpi.items.probation, target: '>=95%', current: 98, color: '#ec4899' }
      ]
    }
  ];

  const evidences = [
    t.kpi.evidence.policy,
    t.kpi.evidence.matrix,
    t.kpi.evidence.orgChart,
    t.kpi.evidence.jd,
    t.kpi.evidence.approvalRecord,
    t.kpi.evidence.managementApproval
  ];

  return (
    <div className={styles.dashboardContainer}>
      {/* Header Actions */}
      <div className={styles.pageHeader}>
        <div>
          <h1 className={`${styles.headerTitle} kh-text`}>{t.kpi.title}</h1>
          <p className={`${styles.headerSubtitle} kh-text`}>
            {t.kpi.dashboard?.overview || "Dashboard Overview"}
          </p>
        </div>
        <div className={styles.headerActions}>
          <a
            href="/dashboard/performance"
            className={styles.appraisalBtn}
          >
            <span>🎯</span>
            <span className="kh-text">ការវាយតម្លៃបុគ្គលិក (Appraisal 360)</span>
          </a>
          <KpiExportImportButtons />
        </div>
      </div>

      {/* Summary Stats */}
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={`${styles.statIcon} interactive-icon`} style={{ background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6' }}>🏢</div>
          <div className={styles.statInfo}>
            <h3 className="kh-text">{t.kpi.dashboard?.totalDepts || "Total Departments"}</h3>
            <p>4</p>
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={`${styles.statIcon} interactive-icon`} style={{ background: 'rgba(139, 92, 246, 0.1)', color: '#8b5cf6' }}>🎯</div>
          <div className={styles.statInfo}>
            <h3 className="kh-text">{t.kpi.dashboard?.assignedKPIs || "Assigned KPIs"}</h3>
            <p>24</p>
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={`${styles.statIcon} interactive-icon`} style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981' }}>📈</div>
          <div className={styles.statInfo}>
            <h3 className="kh-text">{t.kpi.dashboard?.avgScore || "Average Score"}</h3>
            <p>92.7%</p>
          </div>
        </div>
      </div>

      {/* SMART Framework Section */}
      <div className={styles.smartSection}>
        <div className={styles.smartSectionTitle}>
          <span>🧠</span>
          <span className="kh-text">{t.kpi.smart?.title || "S.M.A.R.T Principles"}</span>
        </div>
        <div className={styles.smartGrid}>
          {['S', 'M', 'A', 'R', 'T'].map((letter) => {
            const smartKey = letter.toLowerCase() as 's' | 'm' | 'a' | 'r' | 't';
            const data = t.kpi.smart?.[smartKey];
            return (
              <div key={letter} className={styles.smartCard} data-type={letter}>
                <div className={styles.smartLetter}>{letter}</div>
                <div className={styles.smartCardContent}>
                  <div className={styles.smartTitle}>{data?.title || letter}</div>
                  <div className={`${styles.smartDesc} kh-text`} title={data?.desc}>{data?.desc}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Department Grid */}
      <div>
        <h2 className={`${styles.sectionTitle} kh-text`}>
          <span>📊</span> {t.kpi.dashboard?.deptAssignments || "Department Assignments"}
        </h2>
        
        <div className={styles.deptGrid}>
          {departments.map((dept, index) => {
            const isTop = dept.score >= 90;
            const isMid = dept.score >= 80;
            const scoreColor = isTop ? '#059669' : isMid ? '#d97706' : '#dc2626';
            const scoreBg = isTop ? 'rgba(16, 185, 129, 0.12)' : isMid ? 'rgba(245, 158, 11, 0.12)' : 'rgba(239, 68, 68, 0.12)';
            const scoreBorder = isTop ? 'rgba(16, 185, 129, 0.3)' : isMid ? 'rgba(245, 158, 11, 0.3)' : 'rgba(239, 68, 68, 0.3)';

            return (
              <div key={index} className={styles.deptCard}>
                <div className={styles.deptCardHeader}>
                  <div className={styles.deptName}>
                    <span>{dept.icon}</span> <span>{dept.name}</span>
                  </div>
                  <div 
                    className={styles.deptScore} 
                    style={{ color: scoreColor, backgroundColor: scoreBg, border: `1px solid ${scoreBorder}` }}
                  >
                    {dept.score}%
                  </div>
                </div>
                
                <div className={styles.deptCardBody}>
                  <div className={styles.kpiList}>
                    {dept.kpis.map((kpi, kpiIndex) => (
                      <div key={kpiIndex} className={styles.kpiItem}>
                        <div className={styles.kpiHeader}>
                          <span className={`${styles.kpiName} kh-text`}>{kpi.name}</span>
                          <span className={styles.kpiTarget}>{kpi.target}</span>
                        </div>
                        <div className={styles.progressBar}>
                          <div 
                            className={styles.progressFill} 
                            style={{ width: `${kpi.current}%`, backgroundColor: kpi.color }}
                          ></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                
                <button className={`${styles.viewDetailsBtn} kh-text`}>
                  <span>{t.kpi.dashboard?.viewDetails || "View Details"}</span>
                  <span>&rarr;</span>
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Evidence Section */}
      <div className={styles.evidenceSection}>
        <h2 className={`${styles.sectionTitle} kh-text`} style={{ marginBottom: '0.4rem' }}>
          <span>📑</span> {t.kpi.evidenceTitle}
        </h2>
        <div className={styles.evidenceGrid}>
          {evidences.map((evidence, index) => (
            <div key={index} className={styles.evidenceItem} title={evidence}>
              <span style={{ color: '#8b5cf6', fontWeight: 'bold' }}>✓</span>
              <span className="kh-text" style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{evidence}</span>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
