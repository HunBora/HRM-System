'use client';

import React, { useState } from 'react';
import SettingsForm from './SettingsForm';
import DepartmentGroupManager from '@/components/DepartmentGroupManager';
import PayrollSettingsManager from '@/components/PayrollSettingsManager';
import AdvanceSalarySettingsManager from '@/components/AdvanceSalarySettingsManager';
import KpiSettingsManager from '@/components/KpiSettingsManager';

interface UnifiedSettingsHubProps {
  settings: any;
}

export default function UnifiedSettingsHub({ settings }: UnifiedSettingsHubProps) {
  const [activeTab, setActiveTab] = useState<'general' | 'groups' | 'payroll' | 'advance' | 'kpi'>('general');

  const tabs = [
    {
      id: 'general' as const,
      labelKh: 'ការកំណត់ទូទៅ & Telegram',
      labelEn: 'General & Bot',
      icon: '⚙️',
      badge: 'មេ',
    },
    {
      id: 'groups' as const,
      labelKh: 'ក្រុមផ្នែក & ពណ៌',
      labelEn: 'Department Groups',
      icon: '👥',
    },
    {
      id: 'payroll' as const,
      labelKh: 'កាលវិភាគបើកប្រាក់ខែ',
      labelEn: 'Payroll Schedule',
      icon: '💰',
    },
    {
      id: 'advance' as const,
      labelKh: 'គោលការណ៍ប្រាក់បុរេប្រទាន',
      labelEn: 'Advance Policy',
      icon: '💸',
    },
    {
      id: 'kpi' as const,
      labelKh: 'ការកំណត់ KPI & រូបមន្ត',
      labelEn: 'KPI Master & Config',
      icon: '📈',
    },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Top Header Card with Stats & Tabs Bar */}
      <div
        className="card"
        style={{
          padding: '16px 20px',
          borderRadius: '12px',
          border: '1px solid var(--border-color)',
          background: 'var(--surface-color)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
          <div>
            <h1 className="title kh-text" style={{ margin: 0, fontSize: '1.45rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>⚙️</span> មជ្ឈមណ្ឌលគ្រប់គ្រងការកំណត់ប្រព័ន្ធ (Master Settings Hub)
            </h1>
            <p style={{ margin: '4px 0 0', fontSize: '0.86rem', color: '#64748b' }}>
              គ្រប់គ្រងការកំណត់ក្រុមហ៊ុន, វេនការងារ, Telegram, ស្បែកពណ៌, ក្រុមផ្នែក, កាលបរិច្ឆេទបើកប្រាក់ខែ និង KPI នៅកន្លែងតែមួយ
            </p>
          </div>
        </div>

        {/* Tab Navigation Buttons */}
        <div
          style={{
            display: 'flex',
            gap: '8px',
            flexWrap: 'wrap',
            borderBottom: '1px solid var(--border-color)',
            paddingBottom: '10px',
          }}
        >
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '9px 16px',
                  borderRadius: '10px',
                  border: isActive ? '2px solid #2563eb' : '1px solid var(--border-color)',
                  backgroundColor: isActive ? 'rgba(37, 99, 235, 0.08)' : 'var(--card-bg, #ffffff)',
                  color: isActive ? '#2563eb' : '#334155',
                  fontWeight: isActive ? 700 : 500,
                  fontSize: '0.88rem',
                  cursor: 'pointer',
                  transition: 'all 0.18s ease',
                  boxShadow: isActive ? '0 2px 8px rgba(37, 99, 235, 0.15)' : 'none',
                }}
              >
                <span style={{ fontSize: '1.1rem' }}>{tab.icon}</span>
                <span className="kh-text">{tab.labelKh}</span>
                <span style={{ fontSize: '0.74rem', color: isActive ? '#3b82f6' : '#94a3b8' }}>
                  ({tab.labelEn})
                </span>
                {tab.badge && (
                  <span
                    style={{
                      fontSize: '0.62rem',
                      backgroundColor: '#2563eb',
                      color: '#ffffff',
                      padding: '1px 6px',
                      borderRadius: '10px',
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
      </div>
    </div>
  );
}
