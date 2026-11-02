'use client';

import { useState } from 'react';
import styles from './kpi.module.css';
import DepartmentDetailModal, { DepartmentKpiDetail } from './DepartmentDetailModal';

interface DepartmentAssignmentsProps {
  departments: DepartmentKpiDetail[];
  employees?: Array<{
    id: string;
    employeeId: string;
    firstNameKh?: string | null;
    lastNameKh?: string | null;
    firstNameEn: string;
    lastNameEn: string;
    department: string;
    position: string;
  }>;
  title: string;
  viewDetailsLabel: string;
}

export default function DepartmentAssignments({
  departments,
  employees = [],
  title,
  viewDetailsLabel
}: DepartmentAssignmentsProps) {
  const [selectedDeptIndex, setSelectedDeptIndex] = useState<number | null>(null);

  const handleOpenDetails = (index: number) => {
    setSelectedDeptIndex(index);
  };

  const handleCloseDetails = () => {
    setSelectedDeptIndex(null);
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.45rem' }}>
        <h2 className={`${styles.sectionTitle} kh-text`} style={{ margin: 0 }}>
          <span>📊</span> {title}
        </h2>
        <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }} className="kh-text">
          💡 ចុច &ldquo;View Details &rarr;&rdquo; ដើម្បីមើលព័ត៌មានលម្អិត
        </span>
      </div>

      <div className={styles.deptGrid}>
        {departments.map((dept, index) => {
          const isTop = dept.score >= 90;
          const isMid = dept.score >= 80;
          const scoreColor = isTop ? '#059669' : isMid ? '#d97706' : '#dc2626';
          const scoreBg = isTop ? 'rgba(16, 185, 129, 0.12)' : isMid ? 'rgba(245, 158, 11, 0.12)' : 'rgba(239, 68, 68, 0.12)';
          const scoreBorder = isTop ? 'rgba(16, 185, 129, 0.3)' : isMid ? 'rgba(245, 158, 11, 0.3)' : 'rgba(239, 68, 68, 0.3)';

          return (
            <div key={index} className={styles.deptCard}>
              <div 
                className={styles.deptCardHeader} 
                onClick={() => handleOpenDetails(index)}
                style={{ cursor: 'pointer' }}
                title="ចុចដើម្បីមើលលម្អិត (Click to view details)"
              >
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
              
              <div 
                className={styles.deptCardBody}
                onClick={() => handleOpenDetails(index)}
                style={{ cursor: 'pointer' }}
                title="ចុចដើម្បីមើលលម្អិត (Click to view details)"
              >
                <div className={styles.kpiList}>
                  {dept.kpis.slice(0, 3).map((kpi, kpiIndex) => (
                    <div key={kpiIndex} className={styles.kpiItem}>
                      <div className={styles.kpiHeader}>
                        <span className={`${styles.kpiName} kh-text`}>{kpi.name}</span>
                        <span className={styles.kpiTarget}>{kpi.target}</span>
                      </div>
                      <div className={styles.progressBar}>
                        <div 
                          className={styles.progressFill} 
                          style={{ width: `${Math.min(100, kpi.current)}%`, backgroundColor: kpi.color }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              <button 
                type="button"
                onClick={() => handleOpenDetails(index)}
                className={`${styles.viewDetailsBtn} kh-text`}
              >
                <span>{viewDetailsLabel}</span>
                <span>&rarr;</span>
              </button>
            </div>
          );
        })}
      </div>

      {/* Interactive Detail Modal */}
      <DepartmentDetailModal
        isOpen={selectedDeptIndex !== null}
        onClose={handleCloseDetails}
        departments={departments}
        initialDeptIndex={selectedDeptIndex !== null ? selectedDeptIndex : 0}
        employees={employees}
      />
    </div>
  );
}
