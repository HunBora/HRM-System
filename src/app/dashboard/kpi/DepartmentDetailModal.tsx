'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import styles from './kpi.module.css';

export interface DepartmentKpiDetail {
  name: string;
  icon: string;
  score: number;
  manager: string;
  headcount: string;
  category: string;
  kpis: {
    name: string;
    target: string;
    current: number;
    actualText: string;
    color: string;
    weight: string;
    frequency: string;
    status: 'ACHIEVED' | 'ON_TRACK' | 'NEEDS_ATTENTION';
    statusText: string;
    formula: string;
  }[];
  quarterlyGoals: {
    quarter: string;
    title: string;
    target: string;
    progress: number;
    status: string;
  }[];
  actionPlans: string[];
}

interface DepartmentDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  departments: DepartmentKpiDetail[];
  initialDeptIndex?: number;
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
}

export default function DepartmentDetailModal({
  isOpen,
  onClose,
  departments,
  initialDeptIndex = 0,
  employees = []
}: DepartmentDetailModalProps) {
  const [selectedDeptIndex, setSelectedDeptIndex] = useState(initialDeptIndex);
  const [activeTab, setActiveTab] = useState<'kpi' | 'plan' | 'team'>('kpi');
  const [staffSearch, setStaffSearch] = useState('');

  useEffect(() => {
    setSelectedDeptIndex(initialDeptIndex);
    setActiveTab('kpi');
  }, [initialDeptIndex, isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const currentDept = departments[selectedDeptIndex] || departments[0];

  const isTop = currentDept.score >= 90;
  const isMid = currentDept.score >= 80;
  const scoreColor = isTop ? '#059669' : isMid ? '#d97706' : '#dc2626';
  const scoreBg = isTop ? 'rgba(16, 185, 129, 0.12)' : isMid ? 'rgba(245, 158, 11, 0.12)' : 'rgba(239, 68, 68, 0.12)';
  const scoreBorder = isTop ? 'rgba(16, 185, 129, 0.3)' : isMid ? 'rgba(245, 158, 11, 0.3)' : 'rgba(239, 68, 68, 0.3)';

  // Filter department employees
  const deptEmployees = employees.filter(emp => {
    const deptLower = currentDept.name.toLowerCase();
    const empDeptLower = (emp.department || '').toLowerCase();
    
    const isMatch = (
      (deptLower.includes('it') && (empDeptLower.includes('it') || empDeptLower.includes('tech'))) ||
      (deptLower.includes('human') && (empDeptLower.includes('hr') || empDeptLower.includes('human') || empDeptLower.includes('office'))) ||
      (deptLower.includes('production') && (empDeptLower.includes('production') || empDeptLower.includes('factory'))) ||
      (deptLower.includes('quality') && (empDeptLower.includes('qa') || empDeptLower.includes('qc') || empDeptLower.includes('quality')))
    );

    if (!staffSearch.trim()) return isMatch;
    const q = staffSearch.toLowerCase();
    return isMatch && (
      emp.employeeId.toLowerCase().includes(q) ||
      emp.firstNameEn.toLowerCase().includes(q) ||
      emp.lastNameEn.toLowerCase().includes(q) ||
      (emp.firstNameKh || '').includes(q) ||
      (emp.lastNameKh || '').includes(q) ||
      emp.position.toLowerCase().includes(q)
    );
  });

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div 
        className={styles.modalContainer} 
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        {/* Modal Top Header */}
        <div className={styles.modalHeader}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '1.4rem' }}>{currentDept.icon}</span>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <h2 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-main)' }}>
                  {currentDept.name}
                </h2>
                <span 
                  style={{ 
                    color: scoreColor, 
                    backgroundColor: scoreBg, 
                    border: `1px solid ${scoreBorder}`,
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    padding: '2px 8px',
                    borderRadius: '9999px'
                  }}
                >
                  ពិន្ទុសរុប: {currentDept.score}%
                </span>
              </div>
              <p style={{ margin: '2px 0 0 0', fontSize: '0.76rem', color: 'var(--text-muted)' }} className="kh-text">
                ប្រធានផ្នែក៖ <strong>{currentDept.manager}</strong> | ទំហំក្រុមការងារ៖ <strong>{currentDept.headcount}</strong>
              </p>
            </div>
          </div>
          
          <button 
            onClick={onClose} 
            className={styles.modalCloseBtn}
            title="បិទ (Close - Esc)"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        {/* Quick Department Switcher */}
        <div style={{ padding: '0.5rem 1.25rem', borderBottom: '1px solid var(--border-color)', backgroundColor: 'rgba(0,0,0,0.015)' }}>
          <div className={styles.deptPillNav}>
            {departments.map((dept, idx) => {
              const active = idx === selectedDeptIndex;
              return (
                <button
                  key={dept.name}
                  onClick={() => setSelectedDeptIndex(idx)}
                  className={`${styles.deptPill} ${active ? styles.deptPillActive : ''}`}
                >
                  <span>{dept.icon}</span>
                  <span>{dept.name}</span>
                  <span style={{ opacity: 0.8, fontSize: '0.74rem' }}>({dept.score}%)</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Modal Navigation Tabs */}
        <div className={styles.modalTabs}>
          <button
            onClick={() => setActiveTab('kpi')}
            className={`${styles.modalTabBtn} ${activeTab === 'kpi' ? styles.modalTabBtnActive : ''} kh-text`}
          >
            📊 សូចនាករ KPI លម្អិត ({currentDept.kpis.length})
          </button>
          <button
            onClick={() => setActiveTab('plan')}
            className={`${styles.modalTabBtn} ${activeTab === 'plan' ? styles.modalTabBtnActive : ''} kh-text`}
          >
            🎯 ផែនការ & SMART ({currentDept.quarterlyGoals.length})
          </button>
          <button
            onClick={() => setActiveTab('team')}
            className={`${styles.modalTabBtn} ${activeTab === 'team' ? styles.modalTabBtnActive : ''} kh-text`}
          >
            👥 បុគ្គលិកទទួលបន្ទុក ({deptEmployees.length})
          </button>
        </div>

        {/* Modal Body */}
        <div className={styles.modalBody}>
          {activeTab === 'kpi' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              {/* Quick Stat Highlights */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: '0.6rem' }}>
                <div className={styles.modalStatMini}>
                  <div className={styles.modalStatLabel}>សូចនាករតាមដាន</div>
                  <div className={styles.modalStatValue}>{currentDept.kpis.length} KPIs</div>
                </div>
                <div className={styles.modalStatMini}>
                  <div className={styles.modalStatLabel}>ពិន្ទុជាមធ្យម</div>
                  <div className={styles.modalStatValue} style={{ color: scoreColor }}>{currentDept.score}%</div>
                </div>
                <div className={styles.modalStatMini}>
                  <div className={styles.modalStatLabel}>កម្រិតសម្រេច</div>
                  <div className={styles.modalStatValue} style={{ color: '#10b981' }}>
                    {Math.round((currentDept.kpis.filter(k => k.current >= 90).length / currentDept.kpis.length) * 100)}%
                  </div>
                </div>
                <div className={styles.modalStatMini}>
                  <div className={styles.modalStatLabel}>វដ្តវាយតម្លៃ</div>
                  <div className={styles.modalStatValue}>ប្រចាំខែ/ត្រីមាស</div>
                </div>
              </div>

              {/* KPI List Table */}
              <div style={{ border: '1px solid var(--border-color)', borderRadius: '10px', overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.8rem' }}>
                  <thead>
                    <tr style={{ backgroundColor: 'rgba(0,0,0,0.03)', borderBottom: '1px solid var(--border-color)' }}>
                      <th style={{ padding: '8px 12px', fontWeight: 600 }} className="kh-text">ឈ្មោះសូចនាករ KPI</th>
                      <th style={{ padding: '8px 10px', fontWeight: 600 }} className="kh-text">គោលដៅ (Target)</th>
                      <th style={{ padding: '8px 10px', fontWeight: 600 }} className="kh-text">លទ្ធផលជាក់ស្តែង</th>
                      <th style={{ padding: '8px 10px', fontWeight: 600, width: '180px' }} className="kh-text">វឌ្ឍនភាព (% Progress)</th>
                      <th style={{ padding: '8px 10px', fontWeight: 600 }} className="kh-text">ទម្ងន់ (%)</th>
                      <th style={{ padding: '8px 10px', fontWeight: 600 }} className="kh-text">ស្ថានភាព</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentDept.kpis.map((kpi, kIdx) => {
                      const isAchieved = kpi.status === 'ACHIEVED';
                      const isOnTrack = kpi.status === 'ON_TRACK';
                      const badgeBg = isAchieved ? '#ecfdf5' : isOnTrack ? '#eff6ff' : '#fef2f2';
                      const badgeColor = isAchieved ? '#059669' : isOnTrack ? '#2563eb' : '#dc2626';

                      return (
                        <tr key={kIdx} style={{ borderBottom: kIdx === currentDept.kpis.length - 1 ? 'none' : '1px solid var(--border-color)' }}>
                          <td style={{ padding: '9px 12px' }}>
                            <div style={{ fontWeight: 600, color: 'var(--text-main)' }} className="kh-text">{kpi.name}</div>
                            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>រូបមន្ត៖ {kpi.formula}</div>
                          </td>
                          <td style={{ padding: '9px 10px', fontWeight: 600, color: '#8b5cf6' }}>{kpi.target}</td>
                          <td style={{ padding: '9px 10px', fontWeight: 600, color: 'var(--text-main)' }}>{kpi.actualText}</td>
                          <td style={{ padding: '9px 10px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <div style={{ flex: 1, height: '6px', background: 'rgba(0,0,0,0.08)', borderRadius: '9999px', overflow: 'hidden' }}>
                                <div style={{ width: `${Math.min(100, kpi.current)}%`, height: '100%', background: kpi.color, borderRadius: '9999px' }}></div>
                              </div>
                              <span style={{ fontSize: '0.74rem', fontWeight: 700, minWidth: '32px', textAlign: 'right' }}>
                                {kpi.current}%
                              </span>
                            </div>
                          </td>
                          <td style={{ padding: '9px 10px', color: 'var(--text-muted)' }}>{kpi.weight}</td>
                          <td style={{ padding: '9px 10px' }}>
                            <span 
                              style={{ 
                                backgroundColor: badgeBg, 
                                color: badgeColor, 
                                padding: '2px 8px', 
                                borderRadius: '4px', 
                                fontSize: '0.72rem', 
                                fontWeight: 700 
                              }}
                              className="kh-text"
                            >
                              {kpi.statusText}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'plan' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '0.75rem' }}>
                {currentDept.quarterlyGoals.map((q, qIdx) => (
                  <div 
                    key={qIdx} 
                    style={{ 
                      padding: '0.75rem 0.9rem', 
                      border: '1px solid var(--border-color)', 
                      borderRadius: '8px', 
                      background: 'rgba(0,0,0,0.015)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.4rem'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontWeight: 700, color: '#2563eb', fontSize: '0.82rem' }}>{q.quarter}</span>
                      <span style={{ fontSize: '0.72rem', background: '#ecfdf5', color: '#059669', padding: '1px 6px', borderRadius: '4px', fontWeight: 600 }} className="kh-text">
                        {q.status}
                      </span>
                    </div>
                    <div style={{ fontWeight: 600, fontSize: '0.82rem', color: 'var(--text-main)' }} className="kh-text">
                      {q.title}
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                      <span>គោលដៅ៖ {q.target}</span>
                      <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>សម្រេច: {q.progress}%</span>
                    </div>
                    <div style={{ width: '100%', height: '5px', background: 'rgba(0,0,0,0.08)', borderRadius: '9999px', overflow: 'hidden' }}>
                      <div style={{ width: `${q.progress}%`, height: '100%', background: '#3b82f6', borderRadius: '9999px' }}></div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Action Plans */}
              <div style={{ padding: '0.75rem 1rem', background: 'rgba(59, 130, 246, 0.05)', borderRadius: '8px', border: '1px solid rgba(59, 130, 246, 0.15)' }}>
                <h4 style={{ margin: '0 0 0.4rem 0', fontSize: '0.82rem', color: '#1e40af', fontWeight: 700 }} className="kh-text">
                  📋 ផែនការសកម្មភាពយុទ្ធសាស្ត្រ (Strategic Action Plans)
                </h4>
                <ul style={{ margin: 0, paddingLeft: '1.2rem', fontSize: '0.78rem', color: 'var(--text-main)', lineHeight: 1.6 }}>
                  {currentDept.actionPlans.map((plan, pIdx) => (
                    <li key={pIdx} className="kh-text">{plan}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {activeTab === 'team' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px' }}>
                <input
                  type="text"
                  placeholder="ស្វែងរកបុគ្គលិកតាមឈ្មោះ ឬអត្តលេខ..."
                  value={staffSearch}
                  onChange={(e) => setStaffSearch(e.target.value)}
                  className="input-field kh-text"
                  style={{ flex: 1, padding: '6px 12px', fontSize: '0.8rem', borderRadius: '6px', border: '1px solid var(--border-color)' }}
                />
                <Link
                  href="/dashboard/kpi/setting"
                  className="btn kh-text"
                  style={{ background: '#2563eb', color: 'white', padding: '6px 12px', borderRadius: '6px', fontSize: '0.78rem', textDecoration: 'none', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '4px', whiteSpace: 'nowrap' }}
                >
                  ➕ កំណត់ KPI ថ្មី
                </Link>
              </div>

              {deptEmployees.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '1.5rem', color: 'var(--text-muted)', fontSize: '0.82rem' }} className="kh-text">
                  <div style={{ fontSize: '1.8rem', marginBottom: '4px' }}>👥</div>
                  <div>មិនទាន់មានបុគ្គលិកត្រូវបានចាត់តាំងក្នុងផ្នែកនេះទេ ឬរកមិនឃើញតាមការស្វែងរក។</div>
                  <div style={{ marginTop: '8px' }}>
                    <Link href="/dashboard/employees" style={{ color: '#2563eb', textDecoration: 'underline' }}>
                      ចូលទៅកាន់បញ្ជីបុគ្គលិកសរុប &rarr;
                    </Link>
                  </div>
                </div>
              ) : (
                <div style={{ border: '1px solid var(--border-color)', borderRadius: '8px', overflow: 'hidden' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.8rem' }}>
                    <thead>
                      <tr style={{ backgroundColor: 'rgba(0,0,0,0.03)', borderBottom: '1px solid var(--border-color)' }}>
                        <th style={{ padding: '8px 12px', fontWeight: 600 }} className="kh-text">អត្តលេខ</th>
                        <th style={{ padding: '8px 12px', fontWeight: 600 }} className="kh-text">ឈ្មោះបុគ្គលិក</th>
                        <th style={{ padding: '8px 12px', fontWeight: 600 }} className="kh-text">តួនាទី</th>
                        <th style={{ padding: '8px 12px', fontWeight: 600 }} className="kh-text">ផ្នែក</th>
                        <th style={{ padding: '8px 12px', fontWeight: 600, textAlign: 'center' }} className="kh-text">សកម្មភាព</th>
                      </tr>
                    </thead>
                    <tbody>
                      {deptEmployees.map((emp) => (
                        <tr key={emp.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                          <td style={{ padding: '8px 12px', fontWeight: 600, color: '#3b82f6' }}>{emp.employeeId}</td>
                          <td style={{ padding: '8px 12px', color: 'var(--text-main)', fontWeight: 500 }}>
                            {emp.lastNameKh || ''} {emp.firstNameKh || ''} ({emp.firstNameEn} {emp.lastNameEn})
                          </td>
                          <td style={{ padding: '8px 12px', color: 'var(--text-muted)' }}>{emp.position}</td>
                          <td style={{ padding: '8px 12px', color: 'var(--text-muted)' }}>{emp.department}</td>
                          <td style={{ padding: '8px 12px', textAlign: 'center' }}>
                            <Link
                              href={`/dashboard/performance`}
                              style={{ 
                                display: 'inline-flex', 
                                alignItems: 'center', 
                                gap: '3px', 
                                padding: '3px 8px', 
                                background: 'rgba(37, 99, 235, 0.08)', 
                                color: '#2563eb', 
                                borderRadius: '4px', 
                                textDecoration: 'none', 
                                fontSize: '0.74rem',
                                fontWeight: 600
                              }}
                              className="kh-text"
                            >
                              <span>🎯</span>
                              <span>វាយតម្លៃ</span>
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className={styles.modalFooter}>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <Link
              href="/dashboard/kpi/matrix"
              className={styles.modalFooterLink}
            >
              📑 KPI Matrix
            </Link>
            <Link
              href="/dashboard/kpi/plan"
              className={styles.modalFooterLink}
            >
              📅 ផែនការប្រចាំឆ្នាំ (Annual Plan)
            </Link>
          </div>

          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <button
              onClick={onClose}
              className="btn-secondary kh-text"
              style={{ padding: '5px 14px', fontSize: '0.8rem', borderRadius: '6px' }}
            >
              បិទ (Close)
            </button>
            <Link
              href="/dashboard/performance"
              className="btn kh-text"
              style={{ background: '#2563eb', color: 'white', padding: '5px 14px', borderRadius: '6px', fontSize: '0.8rem', textDecoration: 'none', fontWeight: 600 }}
            >
              🎯 វាយតម្លៃសមិទ្ធកម្ម (Appraisal 360)
            </Link>
          </div>
        </div>

      </div>
    </div>
  );
}
