'use client';

import React, { useState } from 'react';
import SettingsForm from './SettingsForm';
import DepartmentGroupManager from '@/components/DepartmentGroupManager';
import PayrollSettingsManager from '@/components/PayrollSettingsManager';
import AdvanceSalarySettingsManager from '@/components/AdvanceSalarySettingsManager';
import KpiSettingsManager from '@/components/KpiSettingsManager';
import WorkflowManualManager from '@/components/WorkflowManualManager';

interface UnifiedSettingsHubProps {
  settings: any;
  initialTab?: string;
}

export default function UnifiedSettingsHub({ settings, initialTab }: UnifiedSettingsHubProps) {
  const [activeTab, setActiveTab] = useState<'general' | 'groups' | 'payroll' | 'advance' | 'kpi' | 'manual'>(
    initialTab && ['general', 'groups', 'payroll', 'advance', 'kpi', 'manual'].includes(initialTab)
      ? (initialTab as any)
      : 'general'
  );

  const tabs = [
    {
      id: 'general' as const,
      labelKh: 'ទូទៅ & Telegram',
      labelEn: 'General',
      fullTitle: 'ការកំណត់ទូទៅ & Telegram (General & Bot)',
      icon: '⚙️',
      badge: 'មេ',
    },
    {
      id: 'groups' as const,
      labelKh: 'ក្រុមផ្នែក & ពណ៌',
      labelEn: 'Groups',
      fullTitle: 'ក្រុមផ្នែក & ពណ៌ (Department Groups)',
      icon: '👥',
    },
    {
      id: 'payroll' as const,
      labelKh: 'បៀវត្ស & ឧបត្ថម្ភ',
      labelEn: 'Payroll',
      fullTitle: 'កាលវិភាគ & គោលការណ៍ប្រាក់ឧបត្ថម្ភ (Payroll & Allowances)',
      icon: '💰',
    },
    {
      id: 'advance' as const,
      labelKh: 'បុរេប្រទាន',
      labelEn: 'Advance',
      fullTitle: 'គោលការណ៍ប្រាក់បុរេប្រទាន (Advance Policy)',
      icon: '💸',
    },
    {
      id: 'kpi' as const,
      labelKh: 'KPI & រូបមន្ត',
      labelEn: 'KPI',
      fullTitle: 'ការកំណត់ KPI & រូបមន្ត (KPI Master & Config)',
      icon: '📈',
    },
    {
      id: 'manual' as const,
      labelKh: 'សៀវភៅណែនាំ',
      labelEn: 'SOP',
      fullTitle: 'សៀវភៅណែនាំ & រូបមន្តគណនា (Workflow Manual & Formulas)',
      icon: '📖',
      badge: 'SOP',
    },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      {/* Top Header Card with Stats & Tabs Bar - Compact Fit Box */}
      <div
        className="card"
        style={{
          padding: '12px 16px',
          borderRadius: '10px',
          border: '1px solid var(--border-color)',
          background: 'var(--surface-color)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px', flexWrap: 'wrap', gap: '8px' }}>
          <div>
            <h1 className="title kh-text" style={{ margin: 0, fontSize: '1.25rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>⚙️</span> មជ្ឈមណ្ឌលគ្រប់គ្រងការកំណត់ប្រព័ន្ធ (Master Settings Hub)
            </h1>
            <p style={{ margin: '2px 0 0', fontSize: '0.8rem', color: '#64748b' }}>
              គ្រប់គ្រងក្រុមហ៊ុន, វេនការងារ, Telegram, ស្បែកពណ៌, ក្រុមផ្នែក, កាលវិភាគបើកប្រាក់ និង KPI
            </p>
          </div>
        </div>

        {/* Tab Navigation Buttons - Compact Fit Box */}
        <div
          style={{
            display: 'flex',
            gap: '6px',
            flexWrap: 'wrap',
            alignItems: 'center',
          }}
        >
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                title={tab.fullTitle}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '5px',
                  padding: '5px 11px',
                  height: '32px',
                  borderRadius: '6px',
                  border: isActive ? '1.5px solid #2563eb' : '1px solid var(--border-color, #cbd5e1)',
                  backgroundColor: isActive ? 'rgba(37, 99, 235, 0.08)' : 'var(--card-bg, #ffffff)',
                  color: isActive ? '#2563eb' : '#334155',
                  fontWeight: isActive ? 700 : 500,
                  fontSize: '0.8rem',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  boxShadow: isActive ? '0 1px 4px rgba(37, 99, 235, 0.12)' : 'none',
                  whiteSpace: 'nowrap',
                }}
              >
                <span style={{ fontSize: '0.95rem' }}>{tab.icon}</span>
                <span className="kh-text">{tab.labelKh}</span>
                <span style={{ fontSize: '0.72rem', color: isActive ? '#3b82f6' : '#94a3b8' }}>
                  ({tab.labelEn})
                </span>
                {tab.badge && (
                  <span
                    style={{
                      fontSize: '0.6rem',
                      backgroundColor: isActive ? '#2563eb' : '#64748b',
                      color: '#ffffff',
                      padding: '1px 5px',
                      borderRadius: '8px',
                      fontWeight: 700,
                    }}
                  >
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab Panels */}
      <div>
        {activeTab === 'general' && (
          <div>
            <SettingsForm settings={settings} />
          </div>
        )}

        {activeTab === 'groups' && (
          <div className="card" style={{ padding: '24px', borderRadius: '12px' }}>
            <DepartmentGroupManager />
          </div>
        )}

        {activeTab === 'payroll' && (
          <div className="card" style={{ padding: '24px', borderRadius: '12px' }}>
            <PayrollSettingsManager initialSettings={settings} />
          </div>
        )}

        {activeTab === 'advance' && (
          <div className="card" style={{ padding: '24px', borderRadius: '12px' }}>
            <AdvanceSalarySettingsManager initialSettings={settings} />
          </div>
        )}

        {activeTab === 'kpi' && (
          <div className="card" style={{ padding: '24px', borderRadius: '12px' }}>
            <KpiSettingsManager />
          </div>
        )}

        {activeTab === 'manual' && (
          <div>
            <WorkflowManualManager settings={settings} />
          </div>
        )}
      </div>
    </div>
  );
}
