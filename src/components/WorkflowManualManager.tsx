'use client';

import React, { useState, useMemo } from 'react';
import { calculateNssf, NSSF_CONFIG } from '@/lib/nssf';
import { MASTER_46_COLUMNS, PAYROLL_CATEGORIES, PayrollColumnDoc } from '@/lib/payrollColumnsGuide';

interface WorkflowManualManagerProps {
  settings?: any;
}

export default function WorkflowManualManager({ settings }: WorkflowManualManagerProps) {
  // Live dynamic values synced directly from system settings
  const exchangeRate = settings?.exchangeRate || 4000;
  const p1Start = settings?.payment1StartDate || 1;
  const p1End = settings?.payment1EndDate || 15;
  const p2Start = settings?.payment2StartDate || 16;
  const p2End = settings?.payment2EndDate || 31;
  const advanceLimit = settings?.advanceMaxLimit || 50;
  const advanceMonths = settings?.advanceEligibilityMonths || 3;
  const advancePolicy = settings?.advanceRepaymentPolicy || 'NEXT_PAYROLL';
  const companyName = settings?.companyName || 'HRM System';

  // Company Allowance Policies (Dynamic from settings)
  const transportRate = settings?.transportationAllowance ?? 7.0;
  const attBonusRate = settings?.attendanceBonus ?? 15.0;
  const lunchRate = settings?.lunchAllowancePerDay ?? 0.50;
  const otMealRate = settings?.otMealAllowance ?? 0.50;
  const dayCareRate = settings?.dayCareAllowancePerChild ?? 0.0;

  // Navigation states
  const [subTab, setSubTab] = useState<'formulas' | 'columns' | 'simulator' | 'lifecycle' | 'attendance' | 'advance' | 'law'>('formulas');
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [colCategory, setColCategory] = useState<string>('all');

  // Filter 46 columns guide dynamically
  const filteredColumns = useMemo(() => {
    return MASTER_46_COLUMNS.filter((c) => {
      const matchCat = colCategory === 'all' || c.category === colCategory;
      if (!matchCat) return false;
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase().trim();
      return (
        c.col.toString() === q ||
        c.kh.toLowerCase().includes(q) ||
        c.en.toLowerCase().includes(q) ||
        c.zh.toLowerCase().includes(q) ||
        c.descriptionKh.toLowerCase().includes(q) ||
        c.formula.toLowerCase().includes(q)
      );
    });
  }, [colCategory, searchQuery]);

  // Interactive Live Simulator States
  const [simBasic, setSimBasic] = useState<number>(250);
  const [simDays, setSimDays] = useState<number>(26);
  const [simNormalOt, setSimNormalOt] = useState<number>(10);
  const [simSunOt, setSimSunOt] = useState<number>(0);
  const [simNightOt, setSimNightOt] = useState<number>(0);
  const [simAbsentDays, setSimAbsentDays] = useState<number>(0);
  const [simPosition, setSimPosition] = useState<number>(15);
  const [simSkill, setSimSkill] = useState<number>(10);
  const [simAdvance, setSimAdvance] = useState<number>(0);
  const [simChildren, setSimChildren] = useState<number>(0);
  const [simSeniorityYears, setSimSeniorityYears] = useState<number>(2);
  const [simIsSeniorityPayoutMonth, setSimIsSeniorityPayoutMonth] = useState<boolean>(false);
  const [simHasNssf, setSimHasNssf] = useState<boolean>(true);
  const [simHasFdc, setSimHasFdc] = useState<boolean>(true);

  // Copy helper
  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  // Live Simulator Calculation engine (100% matched with production actions.ts)
  const simResults = useMemo(() => {
    const dailyRate = simBasic / 26;
    const hourlyRate = dailyRate / 8;
    const workingSalary = dailyRate * simDays;

    const otWage = hourlyRate * 1.5 * simNormalOt;
    const sunOtWage = hourlyRate * 2.0 * simSunOt;
    const nightOtWage = hourlyRate * 2.0 * simNightOt;

    const lunchAllowance = simDays * lunchRate;
    const totalOtHours = simNormalOt + simSunOt + simNightOt;
    const otMealAllowance = totalOtHours >= 2 ? otMealRate : 0;
    const transportation = transportRate;
    const attendanceBonus = simAbsentDays > 0 ? 0 : attBonusRate;
    const dayCareAllowance = simChildren * dayCareRate;

    const payScaleIncentive = simPosition || 0;
    const adjustmentSkill = simSkill || 0;

    // Seniority Allowance: 1 full year = $2, 2 = $3, ..., 10+ = $11 max
    const seniorityAllowance = simSeniorityYears >= 1 ? Math.min(simSeniorityYears + 1, 11) : 0;
    // Seniority Indemnity for UDC: 7.5 days paid semi-annually (June/Dec)
    const seniorityIndemnity = simIsSeniorityPayoutMonth ? dailyRate * 7.5 : 0;

    const totalSalary = workingSalary + payScaleIncentive + adjustmentSkill + otWage + sunOtWage + nightOtWage
      + attendanceBonus + transportation + lunchAllowance + otMealAllowance + dayCareAllowance + seniorityAllowance + seniorityIndemnity;

    const severancePay = simHasFdc ? totalSalary * 0.05 : 0; // 5% FDC severance

    // NSSF: 2% of contributory wage based on Cambodian Law (Prakas 234/26 & Notice 3134/26)
    // Effective Nov 2026: Min 600,000 KHR ($150), Ceiling 1,500,000 KHR ($375) -> Max $7.50, Min $3.00
    const nssf = simHasNssf && simBasic > 0 ? calculateNssf(simBasic, true, 11, 2026, exchangeRate) : 0;
    const taxPayment = 0;
    const loanPension = simAdvance || 0;

    const netSalaryUsd = totalSalary + severancePay - loanPension - nssf - taxPayment;

    // Currency Split Engine
    let paidSalaryUsd = 0;
    let netSalaryRiel = 0;

    if (netSalaryUsd > 0) {
      paidSalaryUsd = Math.floor(netSalaryUsd / 10) * 10;
      let remainder = netSalaryUsd - paidSalaryUsd;

      if (remainder < 7.50 && paidSalaryUsd > 0) {
        paidSalaryUsd -= 10;
        remainder = netSalaryUsd - paidSalaryUsd;
      }

      netSalaryRiel = remainder * exchangeRate;
      netSalaryRiel = Math.floor(netSalaryRiel / 100) * 100;
    }

    return {
      dailyRate,
      hourlyRate,
      workingSalary,
      otWage,
      sunOtWage,
      nightOtWage,
      lunchAllowance,
      otMealAllowance,
      transportation,
      attendanceBonus,
      dayCareAllowance,
      payScaleIncentive,
      adjustmentSkill,
      seniorityAllowance,
      seniorityIndemnity,
      totalSalary,
      severancePay,
      nssf,
      loanPension,
      netSalaryUsd,
      paidSalaryUsd,
      netSalaryRiel,
      remainderUsd: netSalaryUsd - paidSalaryUsd,
    };
  }, [
    simBasic,
    simDays,
    simNormalOt,
    simSunOt,
    simNightOt,
    simAbsentDays,
    simPosition,
    simSkill,
    simAdvance,
    simChildren,
    simSeniorityYears,
    simIsSeniorityPayoutMonth,
    simHasNssf,
    simHasFdc,
    exchangeRate,
    transportRate,
    attBonusRate,
    lunchRate,
    otMealRate,
    dayCareRate,
  ]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Top Banner / Sync Indicator */}
      <div
        className="card"
        style={{
          padding: '24px',
          borderRadius: '16px',
          background: 'linear-gradient(135deg, #1e3a8a 0%, #1e40af 50%, #2563eb 100%)',
          color: '#ffffff',
          boxShadow: '0 8px 24px rgba(30, 58, 138, 0.25)',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <div style={{ position: 'relative', zIndex: 2 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                <span style={{ fontSize: '1.8rem' }}>📖</span>
                <h1 className="title kh-text" style={{ margin: 0, fontSize: '1.55rem', color: '#ffffff', fontWeight: 800 }}>
                  សៀវភៅណែនាំនីតិវិធីការងារ & រូបមន្តគណនាប្រាក់ខែ (Workflow & Payroll SOP Hub)
                </h1>
              </div>
              <p style={{ margin: 0, fontSize: '0.92rem', color: '#bfdbfe', maxWidth: '780px', lineHeight: 1.5 }}>
                ឯកសារណែនាំប្រតិបត្តិការងារស្តង់ដារ (SOP) និងរូបមន្តគណនាប្រាក់បៀវត្សរ៍ ប្រាក់ឧបត្ថម្ភ និងអត្ថប្រយោជន៍នានា ស្របតាមច្បាប់ស្តីពីការងារនៃព្រះរាជាណាចក្រកម្ពុជា។ រូបមន្តត្រូវបានធ្វើសមកាលកម្មដោយស្វ័យប្រវត្តិតាមការកំណត់បច្ចុប្បន្នរបស់ប្រព័ន្ធ ({companyName})។
              </p>
            </div>

            <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={() => window.print()}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  backgroundColor: '#ffffff',
                  color: '#1e40af',
                  border: 'none',
                  padding: '9px 18px',
                  borderRadius: '10px',
                  fontWeight: 700,
                  fontSize: '0.88rem',
                  cursor: 'pointer',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                  transition: 'all 0.2s',
                }}
              >
                <span>🖨️</span>
                <span className="kh-text">បោះពុម្ពឯកសារ (Print / PDF)</span>
              </button>

              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  backgroundColor: 'rgba(255, 255, 255, 0.18)',
                  padding: '8px 14px',
                  borderRadius: '10px',
                  fontSize: '0.82rem',
                  border: '1px solid rgba(255, 255, 255, 0.3)',
                  backdropFilter: 'blur(4px)',
                }}
              >
                <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#4ade80' }}></span>
                <span>Auto-Synced: <strong>1$ = {exchangeRate.toLocaleString()} ៛</strong></span>
              </div>
            </div>
          </div>
        </div>

        {/* Decorative background glow */}
        <div
          style={{
            position: 'absolute',
            top: '-50px',
            right: '-50px',
            width: '240px',
            height: '240px',
            borderRadius: '50%',
            background: 'rgba(255, 255, 255, 0.08)',
            pointerEvents: 'none',
          }}
        />
      </div>

      {/* Navigation Sub-Tabs */}
      <div
        className="card"
        style={{
          padding: '12px 16px',
          borderRadius: '12px',
          border: '1px solid var(--border-color)',
          backgroundColor: 'var(--surface-color)',
          display: 'flex',
          gap: '8px',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {[
            { id: 'formulas', icon: '💰', titleKh: 'រូបមន្តគណនាប្រាក់ខែ & អត្ថប្រយោជន៍', titleEn: 'Payroll Formulas' },
            { id: 'columns', icon: '📊', titleKh: 'មគ្គុទ្ទេសក៍ ៤៦ ជួរឈរ (Master 46-Column SOP)', titleEn: '46-Column Guide' },
            { id: 'simulator', icon: '🧮', titleKh: 'ម៉ាស៊ីនសាកល្បងគណនាផ្ទាល់', titleEn: 'Live Simulator' },
            { id: 'lifecycle', icon: '👤', titleKh: 'វដ្តជីវិតបុគ្គលិក (Onboarding/Offboarding)', titleEn: 'Employee Lifecycle' },
            { id: 'attendance', icon: '⏱️', titleKh: 'វត្តមាន, ថែមម៉ោង & ច្បាប់ឈប់សម្រាក', titleEn: 'Attendance & OT SOP' },
            { id: 'advance', icon: '💸', titleKh: 'គោលការណ៍ប្រាក់បុរេប្រទាន & បើកលើកទី១/ទី២', titleEn: 'Salary Advance & Payouts' },
            { id: 'law', icon: '⚖️', titleKh: 'យោងច្បាប់ការងារ & ប.ស.ស', titleEn: 'Labor Law Standards' },
          ].map((tab) => {
            const isActive = subTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setSubTab(tab.id as any)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '8px 14px',
                  borderRadius: '8px',
                  border: isActive ? '1.5px solid #2563eb' : '1px solid transparent',
                  backgroundColor: isActive ? 'rgba(37, 99, 235, 0.1)' : 'transparent',
                  color: isActive ? '#1d4ed8' : '#475569',
                  fontWeight: isActive ? 700 : 500,
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                <span>{tab.icon}</span>
                <span className="kh-text">{tab.titleKh}</span>
              </button>
            );
          })}
        </div>

        {/* Quick Search */}
        <div style={{ position: 'relative', minWidth: '240px' }}>
          <input
            type="text"
            placeholder="ស្វែងរកក្នុងសៀវភៅណែនាំ (ឧ. អតីតភាព, OT)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              padding: '7px 28px 7px 32px',
              borderRadius: '8px',
              border: '1px solid var(--border-color)',
              fontSize: '0.83rem',
              outline: 'none',
              backgroundColor: 'var(--card-bg, #ffffff)',
            }}
          />
          <span style={{ position: 'absolute', left: '10px', top: '7px', fontSize: '0.9rem', color: '#94a3b8' }}>🔍</span>
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              style={{
                position: 'absolute',
                right: '8px',
                top: '7px',
                border: 'none',
                background: 'transparent',
                cursor: 'pointer',
                color: '#94a3b8',
                fontSize: '0.85rem',
              }}
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Quick Search Tag Filters & Results Jump */}
      <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap', padding: '0 4px' }}>
        <span style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 600 }}>🏷️ ប្រធានបទរហ័ស (Quick Jump):</span>
        {[
          { label: '📊 មគ្គុទ្ទេសក៍ ៤៦ ជួរឈរ (Columns 1-46)', tab: 'columns', query: '' },
          { label: '💵 បើកលើកទី១ & លើកទី២ (1st & 2nd Payout)', tab: 'formulas', query: 'លើកទី១' },
          { label: '🎖️ ប្រាក់អតីតភាព & បំណាច់ (Seniority)', tab: 'formulas', query: 'អតីតភាព' },
          { label: '💰 រូបមន្តប្រាក់ខែ (Daily/Hourly)', tab: 'formulas', query: '' },
          { label: '🧮 ម៉ាស៊ីនគណនាផ្ទាល់ (Simulator)', tab: 'simulator', query: '' },
          { label: '⏱️ ថែមម៉ោង OT (150% - 200%)', tab: 'formulas', query: 'OT' },
          { label: '⚖️ ច្បាប់ការងារ & ប.ស.ស', tab: 'law', query: 'ច្បាប់' },
        ].map((item, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => {
              setSubTab(item.tab as any);
              setSearchQuery(item.query);
            }}
            style={{
              padding: '4px 10px',
              borderRadius: '16px',
              border: '1px solid #cbd5e1',
              backgroundColor: (searchQuery === item.query && subTab === item.tab) || (item.query === 'អតីតភាព' && (searchQuery.includes('អតីតភាព') || searchQuery.toLowerCase().includes('seniority'))) ? '#eff6ff' : 'var(--surface-color, #ffffff)',
              borderColor: (searchQuery === item.query && subTab === item.tab) || (item.query === 'អតីតភាព' && (searchQuery.includes('អតីតភាព') || searchQuery.toLowerCase().includes('seniority'))) ? '#3b82f6' : 'var(--border-color, #cbd5e1)',
              color: (searchQuery === item.query && subTab === item.tab) || (item.query === 'អតីតភាព' && (searchQuery.includes('អតីតភាព') || searchQuery.toLowerCase().includes('seniority'))) ? '#1d4ed8' : 'var(--text-color, #475569)',
              fontSize: '0.76rem',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            {item.label}
          </button>
        ))}
      </div>

      {/* Active Search Highlights Notice */}
      {searchQuery && (searchQuery.includes('អតីតភាព') || searchQuery.toLowerCase().includes('seniority')) && (
        <div style={{ padding: '10px 16px', borderRadius: '8px', backgroundColor: '#eff6ff', border: '1px solid #93c5fd', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px', fontSize: '0.82rem', color: '#1e40af' }}>
          <div>
            ✨ រកឃើញព័ត៌មាន <strong>ប្រាក់អតីតភាពការងារ និងប្រាក់បំណាច់អតីតភាព</strong> ៖ (១) រូបមន្តគណនាលម្អិតក្នុងផ្ទាំង «រូបមន្តគណនាប្រាក់ខែ» (២) សាកល្បងគណនាក្នុង «ម៉ាស៊ីនសាកល្បងគណនាផ្ទាល់» និង (៣) មាត្រា ៨៩ ថ្មី ក្នុង «យោងច្បាប់ការងារ»។
          </div>
          <div style={{ display: 'flex', gap: '6px' }}>
            <button
              type="button"
              onClick={() => setSubTab('formulas')}
              style={{ padding: '3px 8px', borderRadius: '6px', backgroundColor: '#2563eb', color: '#ffffff', border: 'none', fontSize: '0.74rem', cursor: 'pointer', fontWeight: 600 }}
            >
              មើលរូបមន្ត
            </button>
            <button
              type="button"
              onClick={() => setSubTab('simulator')}
              style={{ padding: '3px 8px', borderRadius: '6px', backgroundColor: '#059669', color: '#ffffff', border: 'none', fontSize: '0.74rem', cursor: 'pointer', fontWeight: 600 }}
            >
              សាកល្បងគណនា
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 1: FORMULAS & CALCULATION MANUAL                                      */}
      {/* ========================================================================= */}
      {subTab === 'formulas' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Dynamic Sync Notice Card */}
          <div
            style={{
              padding: '16px 20px',
              borderRadius: '12px',
              backgroundColor: '#eff6ff',
              border: '1px solid #bfdbfe',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '12px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ fontSize: '1.6rem' }}>⚡</span>
              <div>
                <strong className="kh-text" style={{ color: '#1e40af', fontSize: '0.95rem' }}>
                  រូបមន្តធ្វើសមកាលកម្មស្វ័យប្រវត្តិតាមការកំណត់បច្ចុប្បន្ន (Live Formula Auto-Sync)
                </strong>
                <p style={{ margin: '2px 0 0', fontSize: '0.83rem', color: '#3b82f6' }}>
                  រាល់ពេលមានការផ្លាស់ប្តូរអត្រាប្តូរប្រាក់ ({exchangeRate.toLocaleString()} ៛) ឬកាលបរិច្ឆេទបើកប្រាក់ខែក្នុងប្រព័ន្ធ នោះសៀវភៅណែនាំនេះនឹងកែសម្រួលតម្លៃជាក់ស្តែងដោយស្វ័យប្រវត្តិ។
                </p>
              </div>
            </div>
            <span
              style={{
                fontSize: '0.78rem',
                backgroundColor: '#dbeafe',
                color: '#1d4ed8',
                padding: '4px 12px',
                borderRadius: '20px',
                fontWeight: 700,
              }}
            >
              🔄 Version: 2025/2026 Live Dynamic
            </span>
          </div>

          {/* Group 1: Base Rates */}
          <div className="card" style={{ padding: '24px', borderRadius: '14px', border: '1px solid var(--border-color)' }}>
            <h2 className="kh-text" style={{ margin: '0 0 16px', fontSize: '1.2rem', color: '#1e3a8a', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>1️⃣</span> ប្រាក់ឈ្នួលប្រចាំថ្ងៃ និងប្រចាំម៉ោង (Daily & Hourly Wage Rate)
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px' }}>
              {/* Daily Rate */}
              <div style={{ padding: '16px', borderRadius: '10px', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <strong className="kh-text" style={{ color: '#0f172a' }}>ប្រាក់ឈ្នួលប្រចាំថ្ងៃ (Daily Rate)</strong>
                  <button
                    onClick={() => handleCopy('DailyRate = BasicSalary / 26', 'daily')}
                    style={{ fontSize: '0.72rem', cursor: 'pointer', background: '#e2e8f0', border: 'none', borderRadius: '4px', padding: '2px 6px' }}
                  >
                    {copiedKey === 'daily' ? '✓ បានចម្លង' : '📋 ចម្លងរូបមន្ត'}
                  </button>
                </div>
                <div style={{ padding: '10px 14px', backgroundColor: '#ffffff', borderRadius: '8px', border: '1px dashed #cbd5e1', fontFamily: 'monospace', fontWeight: 700, color: '#2563eb', fontSize: '0.95rem' }}>
                  Daily Rate = ប្រាក់ខែគោល (Basic Salary) ÷ 26 ថ្ងៃ
                </div>
                <p style={{ margin: '8px 0 0', fontSize: '0.8rem', color: '#64748b' }}>
                  ឧទាហរណ៍៖ ប្រាក់ខែគោល $260.00 ÷ 26 = <strong>$10.00 / ថ្ងៃ</strong> (យោងតាមមាត្រា ១០៤ នៃច្បាប់ការងារ ដែលកំណត់ខែធ្វើការស្មើ ២៦ ថ្ងៃ)។
                </p>
              </div>

              {/* Hourly Rate */}
              <div style={{ padding: '16px', borderRadius: '10px', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <strong className="kh-text" style={{ color: '#0f172a' }}>ប្រាក់ឈ្នួលប្រចាំម៉ោង (Hourly Rate)</strong>
                  <button
                    onClick={() => handleCopy('HourlyRate = DailyRate / 8', 'hourly')}
                    style={{ fontSize: '0.72rem', cursor: 'pointer', background: '#e2e8f0', border: 'none', borderRadius: '4px', padding: '2px 6px' }}
                  >
                    {copiedKey === 'hourly' ? '✓ បានចម្លង' : '📋 ចម្លងរូបមន្ត'}
                  </button>
                </div>
                <div style={{ padding: '10px 14px', backgroundColor: '#ffffff', borderRadius: '8px', border: '1px dashed #cbd5e1', fontFamily: 'monospace', fontWeight: 700, color: '#2563eb', fontSize: '0.95rem' }}>
                  Hourly Rate = ប្រាក់ឈ្នួលប្រចាំថ្ងៃ ÷ 8 ម៉ោង
                </div>
                <p style={{ margin: '8px 0 0', fontSize: '0.8rem', color: '#64748b' }}>
                  ឧទាហរណ៍៖ $10.00 ÷ 8 ម៉ោង = <strong>$1.25 / ម៉ោង</strong> (១ ថ្ងៃធ្វើការស្តង់ដារកំណត់ស្មើ ៨ ម៉ោង)។
                </p>
              </div>

              {/* Working Salary */}
              <div style={{ padding: '16px', borderRadius: '10px', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', gridColumn: '1 / -1' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <strong className="kh-text" style={{ color: '#0f172a' }}>ប្រាក់ខែតាមថ្ងៃធ្វើការជាក់ស្តែង (Working Salary)</strong>
                  <button
                    onClick={() => handleCopy('WorkingSalary = DailyRate * WorkingDays', 'working')}
                    style={{ fontSize: '0.72rem', cursor: 'pointer', background: '#e2e8f0', border: 'none', borderRadius: '4px', padding: '2px 6px' }}
                  >
                    {copiedKey === 'working' ? '✓ បានចម្លង' : '📋 ចម្លងរូបមន្ត'}
                  </button>
                </div>
                <div style={{ padding: '10px 14px', backgroundColor: '#ffffff', borderRadius: '8px', border: '1px dashed #cbd5e1', fontFamily: 'monospace', fontWeight: 700, color: '#059669', fontSize: '0.95rem' }}>
                  Working Salary = Daily Rate × ថ្ងៃធ្វើការជាក់ស្តែង (Working Days)
                </div>
                <p style={{ margin: '8px 0 0', fontSize: '0.8rem', color: '#64748b' }}>
                  ប្រសិនបើបុគ្គលិកធ្វើការគ្រប់ ២៦ ថ្ងៃ នោះទទួលបានប្រាក់ខែពេញ។ បើមានអវត្តមាន នឹងគណនាតាមចំនួនថ្ងៃដែលបានមកបំពេញការងារជាក់ស្តែង។
                </p>
              </div>
            </div>
          </div>

          {/* Group 2: Overtime Calculations */}
          <div className="card" style={{ padding: '24px', borderRadius: '14px', border: '1px solid var(--border-color)' }}>
            <h2 className="kh-text" style={{ margin: '0 0 16px', fontSize: '1.2rem', color: '#1e3a8a', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>2️⃣</span> ការគណនាប្រាក់ថែមម៉ោង (Overtime / OT Calculations)
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px' }}>
              {/* Normal OT */}
              <div style={{ padding: '16px', borderRadius: '10px', backgroundColor: '#fffbeb', border: '1px solid #fde68a' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <span style={{ fontWeight: 700, color: '#92400e' }} className="kh-text">ថែមម៉ោងថ្ងៃធម្មតា (Normal OT - 150%)</span>
                  <span style={{ fontSize: '0.72rem', backgroundColor: '#fef3c7', color: '#b45309', padding: '2px 6px', borderRadius: '4px', fontWeight: 700 }}>1.5x Multiplier</span>
                </div>
                <div style={{ padding: '10px 14px', backgroundColor: '#ffffff', borderRadius: '8px', border: '1px dashed #fcd34d', fontFamily: 'monospace', fontWeight: 700, color: '#b45309', fontSize: '0.92rem' }}>
                  OT Wage = Hourly Rate × 1.5 × ម៉ោងថែម
                </div>
                <p style={{ margin: '8px 0 0', fontSize: '0.8rem', color: '#78350f' }}>
                  អនុវត្តចំពោះម៉ោងធ្វើការបន្ថែមក្រៅពី ៨ ម៉ោងធម្មតានៅថ្ងៃចន្ទ ដល់ថ្ងៃសៅរ៍ (គុណនឹង ១៥០%)។
                </p>
              </div>

              {/* Sunday & Holiday OT */}
              <div style={{ padding: '16px', borderRadius: '10px', backgroundColor: '#fef2f2', border: '1px solid #fecaca' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <span style={{ fontWeight: 700, color: '#991b1b' }} className="kh-text">ថែមម៉ោងថ្ងៃអាទិត្យ/បុណ្យជាតិ (200%)</span>
                  <span style={{ fontSize: '0.72rem', backgroundColor: '#fee2e2', color: '#dc2626', padding: '2px 6px', borderRadius: '4px', fontWeight: 700 }}>2.0x Multiplier</span>
                </div>
                <div style={{ padding: '10px 14px', backgroundColor: '#ffffff', borderRadius: '8px', border: '1px dashed #fca5a5', fontFamily: 'monospace', fontWeight: 700, color: '#dc2626', fontSize: '0.92rem' }}>
                  Sun/Holiday Wage = Hourly Rate × 2.0 × ម៉ោងថែម
                </div>
                <p style={{ margin: '8px 0 0', fontSize: '0.8rem', color: '#991b1b' }}>
                  អនុវត្តចំពោះការងារនៅថ្ងៃឈប់សម្រាកប្រចាំសប្តាហ៍ (អាទិត្យ) ឬថ្ងៃបុណ្យជាតិដែលរដ្ឋកំណត់ (គុណនឹង ២០០%)។
                </p>
              </div>

              {/* Night OT */}
              <div style={{ padding: '16px', borderRadius: '10px', backgroundColor: '#f5f3ff', border: '1px solid #ddd6fe' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <span style={{ fontWeight: 700, color: '#5b21b6' }} className="kh-text">ថែមម៉ោងវេនយប់ (Night OT - 200%)</span>
                  <span style={{ fontSize: '0.72rem', backgroundColor: '#ede9fe', color: '#7c3aed', padding: '2px 6px', borderRadius: '4px', fontWeight: 700 }}>2.0x Multiplier</span>
                </div>
                <div style={{ padding: '10px 14px', backgroundColor: '#ffffff', borderRadius: '8px', border: '1px dashed #c4b5fd', fontFamily: 'monospace', fontWeight: 700, color: '#7c3aed', fontSize: '0.92rem' }}>
                  Night OT Wage = Hourly Rate × 2.0 × ម៉ោងយប់
                </div>
                <p style={{ margin: '8px 0 0', fontSize: '0.8rem', color: '#5b21b6' }}>
                  អនុវត្តចំពោះម៉ោងធ្វើការបន្ថែមនៅចន្លោះម៉ោង ២២:០០ យប់ ដល់ម៉ោង ០៦:០០ ព្រឹក (គុណនឹង ២០០%)។
                </p>
              </div>
            </div>
          </div>

          {/* Group 3: Allowances & Statutory Benefits */}
          <div className="card" style={{ padding: '24px', borderRadius: '14px', border: '1px solid var(--border-color)' }}>
            <h2 className="kh-text" style={{ margin: '0 0 16px', fontSize: '1.2rem', color: '#1e3a8a', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>3️⃣</span> ប្រាក់ឧបត្ថម្ភ និងអត្ថប្រយោជន៍ (Allowances & Benefits)
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
              {/* Lunch Allowance */}
              <div style={{ padding: '16px', borderRadius: '10px', backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <strong className="kh-text" style={{ color: '#166534' }}>🍚 ថ្លៃបាយថ្ងៃត្រង់ (Lunch)</strong>
                  <span style={{ fontWeight: 800, color: '#15803d', fontSize: '0.85rem' }}>${lunchRate.toFixed(2)} / ថ្ងៃ</span>
                </div>
                <p style={{ margin: 0, fontSize: '0.82rem', color: '#14532d' }}>
                  គណនាស្មើនឹង <strong>Working Days × ${lunchRate.toFixed(2)}</strong> (កំណត់ដោយក្រុមហ៊ុន)។
                </p>
              </div>

              {/* OT Meal Allowance */}
              <div style={{ padding: '16px', borderRadius: '10px', backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <strong className="kh-text" style={{ color: '#166534' }}>🍱 ថ្លៃបាយថែមម៉ោង (OT Meal)</strong>
                  <span style={{ fontWeight: 800, color: '#15803d', fontSize: '0.85rem' }}>${otMealRate.toFixed(2)} / លើក</span>
                </div>
                <p style={{ margin: 0, fontSize: '0.82rem', color: '#14532d' }}>
                  ផ្តល់ជូន <strong>${otMealRate.toFixed(2)}</strong> នៅពេលបុគ្គលិកថែមម៉ោងសរុប (OT) ចាប់ពី <strong>២ ម៉ោងឡើងទៅ</strong> ក្នុងមួយថ្ងៃ។
                </p>
              </div>

              {/* Transportation */}
              <div style={{ padding: '16px', borderRadius: '10px', backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <strong className="kh-text" style={{ color: '#166534' }}>🚌 ថ្លៃធ្វើដំណើរ (Transport)</strong>
                  <span style={{ fontWeight: 800, color: '#15803d', fontSize: '0.85rem' }}>${transportRate.toFixed(2)} / ខែ</span>
                </div>
                <p style={{ margin: 0, fontSize: '0.82rem', color: '#14532d' }}>
                  ប្រាក់ឧបត្ថម្ភថ្លៃធ្វើដំណើរ និងស្នាក់នៅកំណត់ <strong>${transportRate.toFixed(2)} ក្នុងមួយខែ</strong> សម្រាប់បុគ្គលិកទាំងអស់។
                </p>
              </div>

              {/* Attendance Bonus */}
              <div style={{ padding: '16px', borderRadius: '10px', backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <strong className="kh-text" style={{ color: '#166534' }}>🏆 រង្វាន់ឧស្សាហ៍ព្យាយាម (Attendance)</strong>
                  <span style={{ fontWeight: 800, color: '#15803d', fontSize: '0.85rem' }}>${attBonusRate.toFixed(2)} / ខែ</span>
                </div>
                <p style={{ margin: 0, fontSize: '0.82rem', color: '#14532d' }}>
                  ផ្តល់ជូន <strong>${attBonusRate.toFixed(2)}</strong> ប្រសិនបើបុគ្គលិក <strong>គ្មានអវត្តមានឥតច្បាប់ (Absent Days = 0)</strong> ក្នុងខែនោះ។
                </p>
              </div>

              {/* Child Care Allowance */}
              <div style={{ padding: '16px', borderRadius: '10px', backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <strong className="kh-text" style={{ color: '#166534' }}>👶 ប្រាក់កូនតូច (Day Care)</strong>
                  <span style={{ fontWeight: 800, color: '#15803d', fontSize: '0.85rem' }}>${dayCareRate.toFixed(2)} / កូន</span>
                </div>
                <p style={{ margin: 0, fontSize: '0.82rem', color: '#14532d' }}>
                  ផ្តល់ជូន <strong>${dayCareRate.toFixed(2)} ក្នុងមួយកូន</strong> តាមចំនួនកូនជាក់ស្តែងក្នុងបន្ទុក (កំណត់ដោយក្រុមហ៊ុន)។
                </p>
              </div>

              {/* Skill & Position */}
              <div style={{ padding: '16px', borderRadius: '10px', backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <strong className="kh-text" style={{ color: '#166534' }}>🎖️ ប្រាក់ជំនាញ & តួនាទី</strong>
                  <span style={{ fontWeight: 800, color: '#15803d', fontSize: '0.85rem' }}>តាមកិច្ចសន្យា</span>
                </div>
                <p style={{ margin: 0, fontSize: '0.82rem', color: '#14532d' }}>
                  ប្រាក់ឧបត្ថម្ភតាមជំនាញ (Skill Allowance) និងប្រាក់តួនាទី (Position Incentive) ដែលបានកំណត់ក្នុងប្រវត្តិរូប។
                </p>
              </div>

              {/* Monthly Seniority Allowance Card */}
              <div style={{ padding: '16px', borderRadius: '10px', backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <strong className="kh-text" style={{ color: '#166534' }}>🎖️ ប្រាក់អតីតភាព (Seniority Allowance)</strong>
                  <span style={{ fontWeight: 800, color: '#15803d', fontSize: '0.85rem' }}>$2.00 - $11.00 / ខែ</span>
                </div>
                <p style={{ margin: 0, fontSize: '0.82rem', color: '#14532d' }}>
                  ផ្តល់ជូន <strong>$2.00</strong> នៅពេលធ្វើការពេញ ១ ឆ្នាំ និងកើន <strong>$1.00</strong> ក្នុង ១ ឆ្នាំបន្ថែម រហូតដល់ <strong>$11.00/ខែ</strong> (ឆ្នាំទី១០ ឡើងទៅ)។
                </p>
              </div>

              {/* Severance 5% FDC */}
              <div style={{ padding: '16px', borderRadius: '10px', backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <strong className="kh-text" style={{ color: '#166534' }}>📄 ប្រាក់ដំណាច់ 5% (Severance Pay)</strong>
                  <span style={{ fontWeight: 800, color: '#15803d', fontSize: '0.85rem' }}>5% នៃ Total</span>
                </div>
                <p style={{ margin: 0, fontSize: '0.82rem', color: '#14532d' }}>
                  អនុវត្ត <strong>Total Salary × 0.05</strong> សម្រាប់បុគ្គលិកកិច្ចសន្យាមានកំណត់ថិរវេលា (FDC Contract)។
                </p>
              </div>
            </div>
          </div>

          {/* Group 4: Seniority Calculations SOP */}
          <div className="card" style={{ padding: '24px', borderRadius: '14px', border: '1.5px solid #3b82f6', backgroundColor: '#ffffff', boxShadow: '0 4px 16px rgba(37, 99, 235, 0.06)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
              <div>
                <h2 className="kh-text" style={{ margin: 0, fontSize: '1.25rem', color: '#1e3a8a', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span>4️⃣</span> របៀបគណនាប្រាក់អតីតភាពការងារ និងប្រាក់បំណាច់អតីតភាព (Seniority Calculations Hub)
                </h2>
                <p style={{ margin: '4px 0 0', fontSize: '0.84rem', color: '#64748b' }}>
                  សេចក្តីណែនាំលម្អិតអំពីរូបមន្តគណនាប្រាក់អតីតភាពប្រចាំខែ និងប្រាក់បំណាច់អតីតភាពការងារ ស្របតាមមាត្រា ៨៩ ថ្មី នៃច្បាប់ការងារ និងប្រកាស ៤៤២/១៨ &amp; ៤២៣/១៩
                </p>
              </div>
              <div style={{ display: 'flex', gap: '6px' }}>
                <span style={{ fontSize: '0.76rem', backgroundColor: '#dbeafe', color: '#1e40af', padding: '4px 10px', borderRadius: '20px', fontWeight: 700 }}>
                  មាត្រា ៨៩ ថ្មី នៃច្បាប់ការងារ
                </span>
                <span style={{ fontSize: '0.76rem', backgroundColor: '#dcfce7', color: '#15803d', padding: '4px 10px', borderRadius: '20px', fontWeight: 700 }}>
                  ប្រកាស ៤៤២/១៨ &amp; ៤២៣/១៩
                </span>
              </div>
            </div>

            {/* Quick Context Summary Banner */}
            <div style={{ padding: '12px 16px', borderRadius: '10px', backgroundColor: '#f0f9ff', border: '1px solid #bae6fd', marginBottom: '20px', fontSize: '0.85rem', color: '#0369a1', lineHeight: 1.6 }}>
              💡 <strong>ចំណុចគន្លឹះសំខាន់៖</strong> ក្នុងច្បាប់ការងារកម្ពុជា ប្រាក់អតីតភាពមាន ២ ប្រភេទផ្សេងគ្នាដាច់ខាត៖
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '10px', marginTop: '8px' }}>
                <div style={{ backgroundColor: '#ffffff', padding: '10px 12px', borderRadius: '8px', border: '1px solid #e0f2fe' }}>
                  <strong style={{ color: '#0284c7' }}>១. ប្រាក់រង្វាន់អតីតភាពការងារប្រចាំខែ (Seniority Bonus):</strong> ផ្តល់ជូនជាប្រចាំខែ ($2 ដល់ $11/ខែ) តាមចំនួនឆ្នាំបម្រើការងារ។
                </div>
                <div style={{ backgroundColor: '#ffffff', padding: '10px 12px', borderRadius: '8px', border: '1px solid #e0f2fe' }}>
                  <strong style={{ color: '#0284c7' }}>២. ប្រាក់បំណាច់អតីតភាពការងារ (Seniority Indemnity):</strong> ផ្តល់ជូន ១៥ ថ្ងៃ/ឆ្នាំ សម្រាប់កិច្ចសន្យា UDC (ចែកបើក ៧.៥ ថ្ងៃក្នុងខែមិថុនា និង ៧.៥ ថ្ងៃក្នុងខែធ្នូ)។
                </div>
              </div>
            </div>

            {/* PART 1: Monthly Seniority Allowance */}
            <div style={{ marginBottom: '24px', padding: '18px', borderRadius: '12px', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', flexWrap: 'wrap', gap: '8px' }}>
                <h3 className="kh-text" style={{ margin: 0, fontSize: '1.05rem', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span>🎖️</span> ផ្នែកទី ១៖ របៀបគណនាប្រាក់រង្វាន់អតីតភាពការងារប្រចាំខែ (Monthly Seniority Allowance)
                </h3>
                <button
                  type="button"
                  onClick={() => handleCopy('SeniorityAllowance = Math.min(Math.floor(SeniorityYears) + 1, 11)', 'seniorityAllowance')}
                  style={{ fontSize: '0.75rem', cursor: 'pointer', background: '#e2e8f0', border: 'none', borderRadius: '6px', padding: '4px 8px', fontWeight: 600 }}
                >
                  {copiedKey === 'seniorityAllowance' ? '✓ បានចម្លងរូបមន្ត' : '📋 ចម្លងរូបមន្ត'}
                </button>
              </div>

              <div style={{ padding: '12px 16px', backgroundColor: '#ffffff', borderRadius: '8px', border: '1px dashed #cbd5e1', fontFamily: 'monospace', fontWeight: 700, color: '#166534', fontSize: '0.94rem', marginBottom: '12px' }}>
                ប្រាក់អតីតភាពប្រចាំខែ = Math.min(ចំនួនឆ្នាំអតីតភាព + 1, 11) ដុល្លារ (អនុវត្តចាប់ពី ១ ឆ្នាំពេញឡើងទៅ)
              </div>

              <p style={{ margin: '0 0 12px', fontSize: '0.84rem', color: '#475569', lineHeight: 1.5 }}>
                អនុលោមតាមសេចក្តីប្រកាសរបស់ក្រសួងការងារ និងបណ្តុះបណ្តាលវិជ្ជាជីវៈ (MLVT) កម្មករនិយោជិតដែលបានបំពេញការងារចាប់ពី ១ ឆ្នាំពេញឡើងទៅ ទទួលបានប្រាក់រង្វាន់អតីតភាពការងារប្រចាំខែដូចខាងក្រោម៖
              </p>

              {/* Seniority Steps Grid Table */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '8px', marginBottom: '12px' }}>
                {[
                  { years: 'ពេញ ១ ឆ្នាំ', amt: '$2.00 / ខែ', desc: 'ឆ្នាំទី ១ ដល់ក្រោម ២ ឆ្នាំ' },
                  { years: 'ពេញ ២ ឆ្នាំ', amt: '$3.00 / ខែ', desc: 'ឆ្នាំទី ២ ដល់ក្រោម ៣ ឆ្នាំ' },
                  { years: 'ពេញ ៣ ឆ្នាំ', amt: '$4.00 / ខែ', desc: 'ឆ្នាំទី ៣ ដល់ក្រោម ៤ ឆ្នាំ' },
                  { years: 'ពេញ ៤ ឆ្នាំ', amt: '$5.00 / ខែ', desc: 'ឆ្នាំទី ៤ ដល់ក្រោម ៥ ឆ្នាំ' },
                  { years: 'ពេញ ៥ ឆ្នាំ', amt: '$6.00 / ខែ', desc: 'ឆ្នាំទី ៥ ដល់ក្រោម ៦ ឆ្នាំ' },
                  { years: 'ពេញ ៦ ឆ្នាំ', amt: '$7.00 / ខែ', desc: 'ឆ្នាំទី ៦ ដល់ក្រោម ៧ ឆ្នាំ' },
                  { years: 'ពេញ ៧ ឆ្នាំ', amt: '$8.00 / ខែ', desc: 'ឆ្នាំទី ៧ ដល់ក្រោម ៨ ឆ្នាំ' },
                  { years: 'ពេញ ៨ ឆ្នាំ', amt: '$9.00 / ខែ', desc: 'ឆ្នាំទី ៨ ដល់ក្រោម ៩ ឆ្នាំ' },
                  { years: 'ពេញ ៩ ឆ្នាំ', amt: '$10.00 / ខែ', desc: 'ឆ្នាំទី ៩ ដល់ក្រោម ១០ ឆ្នាំ' },
                  { years: 'ចាប់ពី ១០ ឆ្នាំ+', amt: '$11.00 / ខែ', desc: 'ពិដានអតិបរមា (Max Cap)' },
                ].map((item, idx) => (
                  <div key={idx} style={{ backgroundColor: '#ffffff', padding: '10px', borderRadius: '8px', border: idx === 9 ? '1.5px solid #16a34a' : '1px solid #e2e8f0', textAlign: 'center' }}>
                    <div style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 600 }}>{item.years}</div>
                    <div style={{ fontSize: '1rem', fontWeight: 800, color: idx === 9 ? '#15803d' : '#0f172a', margin: '2px 0' }}>{item.amt}</div>
                    <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>{item.desc}</div>
                  </div>
                ))}
              </div>

              <div style={{ padding: '8px 12px', borderRadius: '6px', backgroundColor: '#f1f5f9', fontSize: '0.8rem', color: '#475569' }}>
                📌 <strong>ឧទាហរណ៍ជាក់ស្តែង៖</strong> បុគ្គលិកចូលធ្វើការនៅថ្ងៃ <strong>01/01/2023</strong> គិតត្រឹមខែ <strong>01/2026</strong> មានអតីតភាពការងារចំនួន <strong>៣ ឆ្នាំពេញ</strong> ➔ ទទួលបានប្រាក់រង្វាន់អតីតភាព <strong>$4.00 ក្នុងមួយខែ</strong> បូកបញ្ចូលក្នុងតារាងប្រាក់ខែសរុប (Total Salary)។
              </div>
            </div>

            {/* PART 2: Seniority Indemnity for UDC (15 days/year) */}
            <div style={{ marginBottom: '24px', padding: '18px', borderRadius: '12px', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', flexWrap: 'wrap', gap: '8px' }}>
                <h3 className="kh-text" style={{ margin: 0, fontSize: '1.05rem', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span>⚖️</span> ផ្នែកទី ២៖ របៀបគណនាប្រាក់បំណាច់អតីតភាពការងារ ១៥ ថ្ងៃ/ឆ្នាំ (Seniority Indemnity - UDC)
                </h3>
                <button
                  type="button"
                  onClick={() => handleCopy('SeniorityIndemnity = DailyRate * 7.5', 'seniorityIndemnity')}
                  style={{ fontSize: '0.75rem', cursor: 'pointer', background: '#e2e8f0', border: 'none', borderRadius: '6px', padding: '4px 8px', fontWeight: 600 }}
                >
                  {copiedKey === 'seniorityIndemnity' ? '✓ បានចម្លងរូបមន្ត' : '📋 ចម្លងរូបមន្ត'}
                </button>
              </div>

              <p style={{ margin: '0 0 12px', fontSize: '0.84rem', color: '#475569', lineHeight: 1.5 }}>
                ស្របតាម <strong>មាត្រា ៨៩ ថ្មី នៃច្បាប់ស្តីពីការងារ</strong> និង <strong>ប្រកាសលេខ ៤៤២/១៨ ក.ប/ប្រ.ក</strong> កម្មករនិយោជិតដែលមាន <strong>កិច្ចសន្យាការងារមិនកំណត់ថិរវេលា (UDC)</strong> ត្រូវទទួលបានប្រាក់បំណាច់អតីតភាពការងារចំនួន <strong>១៥ ថ្ងៃក្នុងមួយឆ្នាំ</strong> នៃប្រាក់ឈ្នួល និងប្រាក់បន្ទាប់បន្សំជាមធ្យម ដោយបែងចែកបើកជា ២ លើក៖
              </p>

              {/* Semi-annual Payout Cards */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '14px', marginBottom: '16px' }}>
                {/* June Payout */}
                <div style={{ padding: '14px', borderRadius: '10px', backgroundColor: '#ffffff', border: '1.5px solid #93c5fd' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <strong className="kh-text" style={{ color: '#1d4ed8', fontSize: '0.92rem' }}>☀️ លើកទី ១៖ បើកក្នុងខែមិថុនា (June Payout)</strong>
                    <span style={{ fontSize: '0.75rem', backgroundColor: '#dbeafe', color: '#1e40af', padding: '2px 8px', borderRadius: '4px', fontWeight: 700 }}>៧.៥ ថ្ងៃ</span>
                  </div>
                  <div style={{ fontSize: '0.82rem', color: '#334155', lineHeight: 1.5 }}>
                    • <strong>រយៈពេលគិតគូរ៖</strong> ពីខែមករា ដល់ ខែមិថុនា (ឆមាសទី ១)<br />
                    • <strong>ចំនួនទឹកប្រាក់៖</strong> ស្មើនឹង <strong>៧.៥ ថ្ងៃ</strong> នៃប្រាក់ឈ្នួល និងប្រាក់បន្ទាប់បន្សំជាមធ្យម<br />
                    • <strong>កាលបរិច្ឆេទបើក៖</strong> ជាមួយប្រាក់ឈ្នួលនៃខែមិថុនា
                  </div>
                </div>

                {/* December Payout */}
                <div style={{ padding: '14px', borderRadius: '10px', backgroundColor: '#ffffff', border: '1.5px solid #93c5fd' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <strong className="kh-text" style={{ color: '#1d4ed8', fontSize: '0.92rem' }}>❄️ លើកទី ២៖ បើកក្នុងខែធ្នូ (December Payout)</strong>
                    <span style={{ fontSize: '0.75rem', backgroundColor: '#dbeafe', color: '#1e40af', padding: '2px 8px', borderRadius: '4px', fontWeight: 700 }}>៧.៥ ថ្ងៃ</span>
                  </div>
                  <div style={{ fontSize: '0.82rem', color: '#334155', lineHeight: 1.5 }}>
                    • <strong>រយៈពេលគិតគូរ៖</strong> ពីខែកក្កដា ដល់ ខែធ្នូ (ឆមាសទី ២)<br />
                    • <strong>ចំនួនទឹកប្រាក់៖</strong> ស្មើនឹង <strong>៧.៥ ថ្ងៃ</strong> នៃប្រាក់ឈ្នួល និងប្រាក់បន្ទាប់បន្សំជាមធ្យម<br />
                    • <strong>កាលបរិច្ឆេទបើក៖</strong> ជាមួយប្រាក់ឈ្នួលនៃខែធ្នូ
                  </div>
                </div>
              </div>

              {/* Exact Calculation Formulas */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '12px', marginBottom: '14px' }}>
                <div style={{ padding: '12px', backgroundColor: '#ffffff', borderRadius: '8px', border: '1px dashed #cbd5e1' }}>
                  <span style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 700, display: 'block', marginBottom: '4px' }}>
                    ជំហានទី ១៖ គណនាប្រាក់ឈ្នួលមធ្យមក្នុង ១ ថ្ងៃ (Average Daily Rate)
                  </span>
                  <code style={{ display: 'block', backgroundColor: '#f8fafc', padding: '8px', borderRadius: '6px', fontSize: '0.82rem', color: '#2563eb', fontWeight: 700 }}>
                    Daily Rate = ប្រាក់ឈ្នួលសរុប ៦ ខែចុងក្រោយ ÷ (២៦ ថ្ងៃ × ៦ ខែ)
                  </code>
                </div>

                <div style={{ padding: '12px', backgroundColor: '#ffffff', borderRadius: '8px', border: '1px dashed #cbd5e1' }}>
                  <span style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 700, display: 'block', marginBottom: '4px' }}>
                    ជំហានទី ២៖ គណនាប្រាក់បំណាច់អតីតភាពក្នុងឆមាស (Semi-Annual Payout)
                  </span>
                  <code style={{ display: 'block', backgroundColor: '#f8fafc', padding: '8px', borderRadius: '6px', fontSize: '0.82rem', color: '#059669', fontWeight: 700 }}>
                    Seniority Indemnity = Daily Rate × 7.5 ថ្ងៃ
                  </code>
                </div>
              </div>

              {/* Practical Calculation Example */}
              <div style={{ padding: '12px 16px', borderRadius: '8px', backgroundColor: '#eff6ff', border: '1px solid #bfdbfe', fontSize: '0.82rem', color: '#1e40af', lineHeight: 1.6 }}>
                <strong>💡 ឧទាហរណ៍គណនាក្នុងខែមិថុនា ឬខែធ្នូ៖</strong><br />
                • បុគ្គលិកមានប្រាក់ខែគោល = <strong>$260.00</strong> (Daily Rate = $260 ÷ 26 = <strong>$10.00 / ថ្ងៃ</strong>)<br />
                • ប្រាក់បំណាច់អតីតភាពបើកក្នុងខែមិថុនា = $10.00 × 7.5 ថ្ងៃ = <strong>$75.00</strong><br />
                • ប្រាក់បំណាច់អតីតភាពបើកក្នុងខែធ្នូ = $10.00 × 7.5 ថ្ងៃ = <strong>$75.00</strong><br />
                • សរុបប្រាក់បំណាច់អតីតភាពការងារក្នុងមួយឆ្នាំពេញ = $75.00 + $75.00 = <strong>$150.00 (ស្មើ ១៥ ថ្ងៃពេញ)</strong>
              </div>

              {/* Eligibility Condition */}
              <div style={{ marginTop: '10px', padding: '8px 12px', borderRadius: '6px', backgroundColor: '#fef3c7', border: '1px solid #fde68a', fontSize: '0.78rem', color: '#92400e' }}>
                ⚠️ <strong>លក្ខខណ្ឌសិទ្ធិទទួលបានក្នុងឆមាសនីមួយៗ (Prakas 442/18)៖</strong><br />
                - បុគ្គលិកដែលបានបំពេញការងារចាប់ពី <strong>១ ខែ ដល់ ៦ ខែ</strong> និងបានបំពេញការងារជាក់ស្តែង <strong>យ៉ាងតិច ២១ ថ្ងៃ</strong> មានសិទ្ធិទទួលបានប្រាក់បំណាច់អតីតភាព ៧.៥ ថ្ងៃពេញ។<br />
                - បុគ្គលិកដែលបំពេញការងារមិនបាន ២១ ថ្ងៃ មិនទទួលបានឡើយ។
              </div>
            </div>

            {/* PART 3: Back-Pay Seniority Indemnity (Before 2019) */}
            <div style={{ marginBottom: '24px', padding: '16px', borderRadius: '12px', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0' }}>
              <h3 className="kh-text" style={{ margin: '0 0 8px', fontSize: '1.02rem', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span>📜</span> ផ្នែកទី ៣៖ ប្រាក់បំណាច់អតីតភាពការងារអតីតកាល មុនឆ្នាំ ២០១៩ (Back-Pay Seniority Indemnity)
              </h3>
              <p style={{ margin: '0 0 10px', fontSize: '0.83rem', color: '#475569', lineHeight: 1.5 }}>
                យោងតាម <strong>ប្រកាសលេខ ៤២៣/១៩ ក.ប/ប្រ.ក</strong> ស្តីពីការទូទាត់ប្រាក់បំណាច់អតីតភាពការងារអតីតកាលមុនឆ្នាំ ២០១៩ និយោជកត្រូវបន្តទូទាត់សំណងអតីតភាពការងារកន្លងមកជូនកម្មករនិយោជិត UDC រហូតដល់ចប់សព្វគ្រប់៖
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '10px' }}>
                <div style={{ backgroundColor: '#ffffff', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1' }}>
                  <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.85rem' }}>វិស័យវាយនភណ្ឌ កាត់ដេរ និងផលិតស្បែកជើង</div>
                  <div style={{ fontSize: '0.8rem', color: '#166534', fontWeight: 700, margin: '4px 0' }}>ទូទាត់ចំនួន ៦ ថ្ងៃ / ឆ្នាំ</div>
                  <div style={{ fontSize: '0.74rem', color: '#64748b' }}>ចែកជា ២ លើក៖ ៣ ថ្ងៃក្នុងខែមិថុនា និង ៣ ថ្ងៃក្នុងខែធ្នូ។</div>
                </div>
                <div style={{ backgroundColor: '#ffffff', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1' }}>
                  <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.85rem' }}>សហគ្រាស និងវិស័យផ្សេងៗទៀត</div>
                  <div style={{ fontSize: '0.8rem', color: '#1d4ed8', fontWeight: 700, margin: '4px 0' }}>ទូទាត់ចំនួន ១៥ ថ្ងៃ / ឆ្នាំ</div>
                  <div style={{ fontSize: '0.74rem', color: '#64748b' }}>ចែកជា ២ លើក៖ ៧.៥ ថ្ងៃក្នុងខែមិថុនា និង ៧.៥ ថ្ងៃក្នុងខែធ្នូ។</div>
                </div>
              </div>
            </div>

            {/* PART 4: FDC Severance vs UDC Seniority Comparison Table */}
            <div style={{ marginBottom: '20px', padding: '16px', borderRadius: '12px', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0' }}>
              <h3 className="kh-text" style={{ margin: '0 0 10px', fontSize: '1.02rem', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span>🔄</span> ផ្នែកទី ៤៖ តារាងប្រៀបធៀបរវាង FDC (កិច្ចសន្យាមានកំណត់) និង UDC (កិច្ចសន្យាគ្មានកំណត់)
              </h3>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem', backgroundColor: '#ffffff', borderRadius: '8px', overflow: 'hidden' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#1e40af', color: '#ffffff', textAlign: 'left' }}>
                      <th style={{ padding: '10px 12px' }}>លក្ខខណ្ឌប្រៀបធៀប</th>
                      <th style={{ padding: '10px 12px' }}>កិច្ចសន្យា FDC (មានកំណត់ថិរវេលា)</th>
                      <th style={{ padding: '10px 12px' }}>កិច្ចសន្យា UDC (គ្មានកំណត់ថិរវេលា)</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                      <td style={{ padding: '8px 12px', fontWeight: 700, color: '#334155' }}>អត្ថប្រយោជន៍ច្បាប់</td>
                      <td style={{ padding: '8px 12px', color: '#059669', fontWeight: 700 }}>ប្រាក់ដំណាច់ ៥% (Severance Pay)</td>
                      <td style={{ padding: '8px 12px', color: '#2563eb', fontWeight: 700 }}>ប្រាក់បំណាច់អតីតភាព ១៥ ថ្ងៃ/ឆ្នាំ (Seniority Indemnity)</td>
                    </tr>
                    <tr style={{ borderBottom: '1px solid #e2e8f0', backgroundColor: '#f8fafc' }}>
                      <td style={{ padding: '8px 12px', fontWeight: 700, color: '#334155' }}>យោងមាត្រាច្បាប់</td>
                      <td style={{ padding: '8px 12px' }}>មាត្រា ៧៣ នៃច្បាប់ការងារ</td>
                      <td style={{ padding: '8px 12px' }}>មាត្រា ៨៩ ថ្មី នៃច្បាប់ការងារ &amp; ប្រកាស ៤៤២/១៨</td>
                    </tr>
                    <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                      <td style={{ padding: '8px 12px', fontWeight: 700, color: '#334155' }}>កាលវិភាគបើកផ្តល់</td>
                      <td style={{ padding: '8px 12px' }}>ដំណាច់កិច្ចសន្យា ឬដំណាច់ខែនីមួយៗ</td>
                      <td style={{ padding: '8px 12px' }}>២ លើកក្នុងមួយឆ្នាំ (ខែមិថុនា និង ខែធ្នូ)</td>
                    </tr>
                    <tr style={{ borderBottom: '1px solid #e2e8f0', backgroundColor: '#f8fafc' }}>
                      <td style={{ padding: '8px 12px', fontWeight: 700, color: '#334155' }}>រូបមន្តគណនា</td>
                      <td style={{ padding: '8px 12px', fontFamily: 'monospace' }}>Total Salary × 5%</td>
                      <td style={{ padding: '8px 12px', fontFamily: 'monospace' }}>Daily Rate × 7.5 ថ្ងៃ ក្នុងមួយឆមាស</td>
                    </tr>
                    <tr>
                      <td style={{ padding: '8px 12px', fontWeight: 700, color: '#334155' }}>ការបញ្ចប់កិច្ចសន្យា</td>
                      <td style={{ padding: '8px 12px' }}>ទូទាត់ប្រាក់ដំណាច់ ៥% នៃប្រាក់ឈ្នួលសរុប</td>
                      <td style={{ padding: '8px 12px' }}>ទូទាត់ប្រាក់បំណាច់អតីតភាពនៅសល់ + សំណងជំងឺចិត្ត</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* PART 5: Offboarding Settlement */}
            <div style={{ padding: '14px 18px', borderRadius: '10px', backgroundColor: '#fef2f2', border: '1px solid #fecaca', fontSize: '0.82rem', color: '#991b1b', lineHeight: 1.6 }}>
              <strong>🚪 ផ្នែកទី ៥៖ របៀបគណនាប្រាក់បំណាច់អតីតភាពពេលបញ្ចប់ការងារ (Offboarding &amp; Termination Settlement)៖</strong><br />
              • ប្រសិនបើនិយោជកបញ្ឈប់កម្មករនិយោជិត UDC ដោយ <strong>គ្មានកំហុសធ្ងន់ធ្ងរ (No Offense / Layoff)</strong> និយោជកត្រូវទូទាត់៖<br />
              &nbsp;&nbsp; 1. ប្រាក់បំណាច់អតីតភាពការងារដែលនៅសល់ក្នុងឆមាសបច្ចុប្បន្ន (គិតតាមចំនួនខែបំពេញការងារ)<br />
              &nbsp;&nbsp; 2. ប្រាក់សំណងជំងឺចិត្ត (Damages Pay) ស្មើនឹងទឹកប្រាក់បំណាច់អតីតភាពការងារដែលទទួលបាន<br />
              &nbsp;&nbsp; 3. ប្រាក់សំណងជួសការជូនដំណឹងជាមុន (Notice Indemnity) ប្រសិនបើមិនបានជូនដំណឹងតាមកំណត់ច្បាប់ (មាត្រា ៧៥)។<br />
              • ករណីកំហុសធ្ងន់ធ្ងរ (មាត្រា ៨៣)៖ និយោជកមានសិទ្ធិបញ្ឈប់ដោយមិនបាច់ទូទាត់ប្រាក់បំណាច់អតីតភាព និងសំណងជំងឺចិត្តឡើយ។
            </div>
          </div>

          {/* Group 5: Deductions, NSSF & Currency Payout Splitting */}
          <div className="card" style={{ padding: '24px', borderRadius: '14px', border: '1px solid var(--border-color)' }}>
            <h2 className="kh-text" style={{ margin: '0 0 16px', fontSize: '1.2rem', color: '#1e3a8a', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>5️⃣</span> ការកាត់កង, ប.ស.ស និងការបំបែកបើកជាប្រាក់ដុល្លារ/រៀល
            </h2>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px' }}>
              {/* NSSF Deduction */}
              <div style={{ padding: '18px', borderRadius: '10px', backgroundColor: '#f8fafc', border: '1.5px solid #cbd5e1' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <strong className="kh-text" style={{ color: '#0f172a', fontSize: '0.95rem' }}>🏥 ប.ស.ស (NSSF Deduction)</strong>
                  <span style={{ fontSize: '0.75rem', backgroundColor: '#dbeafe', color: '#1e40af', padding: '2px 8px', borderRadius: '4px', fontWeight: 700 }}>ច្បាប់ថ្មី វិច្ឆិកា ២០២៦</span>
                </div>
                <div style={{ padding: '8px 12px', backgroundColor: '#ffffff', borderRadius: '6px', border: '1px dashed #cbd5e1', fontFamily: 'monospace', fontWeight: 700, color: '#0369a1', fontSize: '0.85rem', marginBottom: '8px' }}>
                  NSSF = Clamp(WageKHR, 600,000, 1,500,000) × 2% ÷ Rate
                </div>
                <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '0.82rem', color: '#475569', lineHeight: 1.5 }}>
                  <li><strong>យោងប្រកាសអន្តរក្រសួងលេខ ២៣៤/២៦ &amp; លិខិតលេខ ៣១៣៤/២៦ ប.ស.ស.៖</strong> អនុវត្តចាប់ពីខែ <strong>វិច្ឆិកា ឆ្នាំ ២០២៦</strong> តទៅ។</li>
                  <li><strong>ប្រាក់ឈ្នួលជាប់ភាគទានពិដាន (អតិបរមា)៖</strong> <strong>១ ៥០០ ០០០ ៛</strong> ($375 តាមអត្រា ៤,០០០៛) → កាត់កងអតិបរមា ២% ស្មើនឹង <strong>៣០ ០០០ ៛ ($7.50)</strong>។</li>
                  <li><strong>ប្រាក់ឈ្នួលជាប់ភាគទានអប្បបរមា៖</strong> <strong>៦០០ ០០០ ៛</strong> ($150 តាមអត្រា ៤,០០០៛) → កាត់កងអប្បបរមា ២% ស្មើនឹង <strong>១២ ០០០ ៛ ($3.00)</strong>។</li>
                  <li style={{ color: '#64748b', fontSize: '0.78rem', marginTop: '4px' }}><em>* សម្រាប់តារាងប្រាក់ខែមុនខែវិច្ឆិកា ឆ្នាំ២០២៦៖ ប្រព័ន្ធរក្សាពិដានចាស់ $300 (១ ២០០ ០០០៛) កាត់អតិបរមាត្រឹម $6.00។</em></li>
                </ul>
              </div>

              {/* Advance Deduction */}
              <div style={{ padding: '18px', borderRadius: '10px', backgroundColor: '#f8fafc', border: '1.5px solid #cbd5e1' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <strong className="kh-text" style={{ color: '#0f172a', fontSize: '0.95rem' }}>💸 ប្រាក់បុរេប្រទាន/កម្ចី (Advance Salary)</strong>
                  <span style={{ fontSize: '0.75rem', backgroundColor: '#fef3c7', color: '#b45309', padding: '2px 8px', borderRadius: '4px', fontWeight: 700 }}>កាត់ ១០០%</span>
                </div>
                <div style={{ padding: '8px 12px', backgroundColor: '#ffffff', borderRadius: '6px', border: '1px dashed #cbd5e1', fontFamily: 'monospace', fontWeight: 700, color: '#b45309', fontSize: '0.9rem', marginBottom: '8px' }}>
                  Loan/Advance Deduction = Total Approved Advance
                </div>
                <p style={{ margin: 0, fontSize: '0.82rem', color: '#475569', lineHeight: 1.5 }}>
                  ទឹកប្រាក់ដែលបុគ្គលិកបានខ្ចីមុន ឬបើកមុន (ត្រូវបានអនុម័ត) នឹងត្រូវកាត់កងចេញពីប្រាក់ខែសុទ្ធដោយស្វ័យប្រវត្តិ។
                </p>
              </div>

              {/* Payment 1 and Payment 2 SOP Box */}
              <div style={{ padding: '20px', borderRadius: '12px', backgroundColor: '#eff6ff', border: '1.5px solid #3b82f6', gridColumn: '1 / -1' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', flexWrap: 'wrap', gap: '8px' }}>
                  <strong className="kh-text" style={{ color: '#1e40af', fontSize: '1.05rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span>💰</span> គោលការណ៍បើកប្រាក់ឈ្នួល ២ ដងក្នុងមួយខែ (Payment 1 &amp; Payment 2 SOP)
                  </strong>
                  <span style={{ fontSize: '0.78rem', backgroundColor: '#dbeafe', color: '#1e40af', padding: '3px 10px', borderRadius: '12px', fontWeight: 700 }}>
                    យោងមាត្រា ១១៦ នៃច្បាប់ការងារ &amp; ប្រកាស ៤៤២/១៨
                  </span>
                </div>
                <p style={{ margin: '0 0 14px', fontSize: '0.84rem', color: '#1e3a8a', lineHeight: 1.5 }}>
                  ស្របតាមច្បាប់ការងារ និងប្រកាសលេខ ៤៤២/១៨ របស់ក្រសួងការងារ និងបណ្តុះបណ្តាលវិជ្ជាជីវៈ សហគ្រាស/រោងចក្រត្រូវបើកប្រាក់ឈ្នួលជូនកម្មករនិយោជិតចំនួន <strong>២ ដងក្នុងមួយខែ</strong> ៖
                </p>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '14px' }}>
                  {/* Payment 1 */}
                  <div style={{ backgroundColor: '#ffffff', padding: '16px', borderRadius: '10px', border: '1px solid #bfdbfe' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <span style={{ fontWeight: 700, color: '#1e40af', fontSize: '0.94rem' }} className="kh-text">
                        📅 បើកលើកទី១ (1st Salary Paid - ជួរទី ៤០)
                      </span>
                      <span style={{ fontSize: '0.74rem', backgroundColor: '#eff6ff', color: '#2563eb', padding: '2px 8px', borderRadius: '4px', fontWeight: 700 }}>ថ្ងៃទី {p1Start}-{p1End}</span>
                    </div>
                    <div style={{ padding: '8px 12px', backgroundColor: '#f8fafc', borderRadius: '6px', fontFamily: 'monospace', fontWeight: 700, color: '#0369a1', fontSize: '0.88rem', marginBottom: '8px' }}>
                      1st Payment = Total Approved Advance / Loan
                    </div>
                    <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '0.8rem', color: '#475569', lineHeight: 1.6 }}>
                      <li>ជាប្រាក់បុរេប្រទាន (Advance Salary) ដែលបុគ្គលិកបានខ្ចី ឬបើកមុនក្នុងអំឡុងពាក់កណ្តាលខែដំបូង។</li>
                      <li>ទឹកប្រាក់នេះត្រូវបានកត់ត្រាក្នុងតារាងប្រាក់ខែជួរទី ៣៩ (ប្រាក់ខ្ចី) និងជួរទី ៤០ (បើកលើកទី១)។</li>
                      <li>បើបុគ្គលិកមិនបានខ្ចីមុន នោះប្រាក់បើកលើកទី១ = <strong>$0.00</strong>។</li>
                    </ul>
                  </div>

                  {/* Payment 2 */}
                  <div style={{ backgroundColor: '#ffffff', padding: '16px', borderRadius: '10px', border: '1px solid #bfdbfe' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <span style={{ fontWeight: 700, color: '#15803d', fontSize: '0.94rem' }} className="kh-text">
                        📅 បើកលើកទី២ (2nd Salary Paid - ជួរទី ៤២)
                      </span>
                      <span style={{ fontSize: '0.74rem', backgroundColor: '#f0fdf4', color: '#16a34a', padding: '2px 8px', borderRadius: '4px', fontWeight: 700 }}>ថ្ងៃទី {p2Start}-{p2End}</span>
                    </div>
                    <div style={{ padding: '8px 12px', backgroundColor: '#f8fafc', borderRadius: '6px', fontFamily: 'monospace', fontWeight: 700, color: '#15803d', fontSize: '0.88rem', marginBottom: '8px' }}>
                      2nd Payment = Total + 5% - Tax - Loan - NSSF - Union
                    </div>
                    <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '0.8rem', color: '#475569', lineHeight: 1.6 }}>
                      <li>ជាប្រាក់បៀវត្សសុទ្ធ (Net Salary USD) ដែលត្រូវបើកបង្គ្រប់នៅចុងខែ បន្ទាប់ពីកាត់ប្រាក់បើកលើកទី១ រួច។</li>
                      <li>ទឹកប្រាក់នេះត្រូវបានបំបែកបើកជា <strong>ដុល្លារ (ជួរ ៤៣)</strong> និង <strong>រៀល (ជួរ ៤៤)</strong>។</li>
                      <li>ធានាថាកម្មករនិយោជិតទទួលបានប្រាក់គ្រប់ចំនួនដោយគ្មានការបាត់បង់។</li>
                    </ul>
                  </div>
                </div>

                <div style={{ marginTop: '14px', padding: '10px 14px', backgroundColor: '#f0fdf4', borderRadius: '8px', border: '1px dashed #86efac', fontSize: '0.82rem', color: '#166534', lineHeight: 1.6 }}>
                  ✅ <strong>សមភាពគណនេយ្យពេញលេញ៖</strong> សរុបប្រាក់ចំណូលសុទ្ធដែលបុគ្គលិកទទួលបានប្រចាំខែ = <strong>បើកលើកទី១ (ជួរ ៤០) + បើកលើកទី២ (ជួរ ៤២)</strong>។ ប្រព័ន្ធធានាភាពត្រឹមត្រូវ ១០០% ដោយគ្មានការបាត់បង់សូម្បី ១ សេន។
                </div>
              </div>

              {/* Dynamic Currency Splitting Engine */}
              <div style={{ padding: '18px', borderRadius: '10px', backgroundColor: '#f0fdf4', border: '1.5px solid #86efac', gridColumn: '1 / -1' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <strong className="kh-text" style={{ color: '#166534', fontSize: '1.02rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span>💱</span> រូបមន្តបំបែកបើកជាលុយដុល្លារ និងរៀល (Factory Cash Payout Engine)
                  </strong>
                  <span style={{ backgroundColor: '#dcfce7', color: '#15803d', padding: '3px 10px', borderRadius: '12px', fontWeight: 800, fontSize: '0.85rem' }}>
                    អត្រា៖ 1$ = {exchangeRate.toLocaleString()} ៛
                  </span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '14px', marginTop: '12px' }}>
                  <div style={{ backgroundColor: '#ffffff', padding: '12px', borderRadius: '8px', border: '1px solid #bbf7d0' }}>
                    <div style={{ fontWeight: 700, color: '#15803d', fontSize: '0.88rem', marginBottom: '4px' }}>ជំហានទី១៖ ដកដុល្លារក្រដាសមូល (Paid USD)</div>
                    <code style={{ display: 'block', backgroundColor: '#f8fafc', padding: '6px', borderRadius: '4px', fontSize: '0.8rem', color: '#0f172a' }}>
                      PaidUSD = Math.floor(NetSalary / 10) * 10
                    </code>
                    <span style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '4px', display: 'block' }}>
                      ឧទាហរណ៍៖ $284.50 ➔ ដកមូលជាដប់បាន <strong>$280.00</strong>
                    </span>
                  </div>

                  <div style={{ backgroundColor: '#ffffff', padding: '12px', borderRadius: '8px', border: '1px solid #bbf7d0' }}>
                    <div style={{ fontWeight: 700, color: '#15803d', fontSize: '0.88rem', marginBottom: '4px' }}>ជំហានទី២៖ លក្ខខណ្ឌសេស &lt; $7.50</div>
                    <code style={{ display: 'block', backgroundColor: '#f8fafc', padding: '6px', borderRadius: '4px', fontSize: '0.8rem', color: '#0f172a' }}>
                      if (Remainder &lt; 7.50) PaidUSD -= 10
                    </code>
                    <span style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '4px', display: 'block' }}>
                      បើសេស $4.50 (&lt; $7.50) ➔ ដកដុល្លារមកនៅ $270.00 (ដើម្បីសេស $14.50 ដូរជាប្រាក់រៀល)
                    </span>
                  </div>

                  <div style={{ backgroundColor: '#ffffff', padding: '12px', borderRadius: '8px', border: '1px solid #bbf7d0' }}>
                    <div style={{ fontWeight: 700, color: '#15803d', fontSize: '0.88rem', marginBottom: '4px' }}>ជំហានទី៣៖ គុណជាប្រាក់រៀល (Net Riel)</div>
                    <code style={{ display: 'block', backgroundColor: '#f8fafc', padding: '6px', borderRadius: '4px', fontSize: '0.8rem', color: '#0f172a' }}>
                      NetRiel = Math.floor((Remainder * {exchangeRate}) / 100) * 100
                    </code>
                    <span style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '4px', display: 'block' }}>
                      គុណនឹង {exchangeRate.toLocaleString()} ៛ ហើយកាត់កម្រិតទម្លាក់មូលត្រឹម ១០០៛ ជានិច្ច។
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: MASTER 46-COLUMN PAYROLL FIELD GUIDE & SOP MATRIX                   */}
      {/* ========================================================================= */}
      {subTab === 'columns' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Header Card */}
          <div
            className="card"
            style={{
              padding: '20px 24px',
              borderRadius: '14px',
              border: '1.5px solid #3b82f6',
              backgroundColor: '#ffffff',
              boxShadow: '0 4px 16px rgba(59, 130, 246, 0.08)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px', flexWrap: 'wrap', gap: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '1.8rem' }}>📊</span>
                <div>
                  <h2 className="kh-text" style={{ margin: 0, fontSize: '1.25rem', color: '#1e40af' }}>
                    មគ្គុទ្ទេសក៍ ៤៦ ជួរឈរ នៃតារាងប្រាក់ខែបុគ្គលិក (Master 46-Column SOP Matrix)
                  </h2>
                  <p style={{ margin: '2px 0 0', fontSize: '0.84rem', color: '#64748b' }}>
                    ឯកសារយោង និងរូបមន្តគណនាគ្រប់ជួរឈរទាំង ៤៦ នៃតារាង Employee Salary (员工工资表) ស្របតាមស្តង់ដាររោងចក្រ និងច្បាប់ការងារកម្ពុជា
                  </p>
                </div>
              </div>
              <span style={{ fontSize: '0.8rem', backgroundColor: '#dbeafe', color: '#1e40af', padding: '6px 14px', borderRadius: '20px', fontWeight: 700 }}>
                ៤៦ ជួរឈរពេញលេញ (Complete 46 Columns)
              </span>
            </div>

            {/* Quick Summary Pill Highlight on 1st & 2nd Payment */}
            <div style={{ marginTop: '14px', padding: '12px 16px', backgroundColor: '#f0fdf4', borderRadius: '10px', border: '1px solid #86efac', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px', fontSize: '0.84rem' }}>
              <div style={{ color: '#166534', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span>💡</span>
                <span>
                  <strong>ការបើកប្រាក់ឈ្នួល ២ ដងក្នុងមួយខែ៖</strong> <strong>លើកទី១ (ជួរទី ៤០)</strong> ជាប្រាក់បុរេប្រទាន/ខ្ចីមុន | <strong>លើកទី២ (ជួរទី ៤២)</strong> ជាប្រាក់ខែសុទ្ធចុងក្រោយ | <strong>សរុបប្រចាំខែ</strong> = លើកទី១ + លើកទី២។
                </span>
              </div>
              <span style={{ fontSize: '0.74rem', backgroundColor: '#dcfce7', color: '#15803d', padding: '2px 8px', borderRadius: '4px', fontWeight: 700 }}>
                មាត្រា ១១៦ &amp; ប្រកាស ៤៤២/១៨
              </span>
            </div>

            {/* Category Filter Buttons */}
            <div style={{ marginTop: '16px', display: 'flex', gap: '6px', flexWrap: 'wrap', alignItems: 'center' }}>
              <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginRight: '4px' }}>តម្រងផ្នែក៖</span>
              {PAYROLL_CATEGORIES.map((cat) => {
                const count = cat.id === 'all' 
                  ? MASTER_46_COLUMNS.length 
                  : MASTER_46_COLUMNS.filter(c => c.category === cat.id).length;
                const isSelected = colCategory === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setColCategory(cat.id)}
                    style={{
                      padding: '5px 12px',
                      borderRadius: '20px',
                      border: isSelected ? `1.5px solid ${cat.color}` : '1px solid #cbd5e1',
                      backgroundColor: isSelected ? `${cat.color}15` : '#ffffff',
                      color: isSelected ? cat.color : '#475569',
                      fontSize: '0.78rem',
                      fontWeight: isSelected ? 700 : 500,
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    <span>{cat.labelKh}</span>
                    <span style={{ fontSize: '0.7rem', opacity: 0.8, backgroundColor: isSelected ? cat.color : '#e2e8f0', color: isSelected ? '#ffffff' : '#64748b', padding: '1px 5px', borderRadius: '10px' }}>
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Columns Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '16px' }}>
            {filteredColumns.length === 0 ? (
              <div style={{ padding: '40px', textAlign: 'center', backgroundColor: '#ffffff', borderRadius: '12px', border: '1px dashed #cbd5e1', gridColumn: '1 / -1' }}>
                <span style={{ fontSize: '2rem' }}>🔍</span>
                <p style={{ margin: '8px 0 0', color: '#64748b', fontSize: '0.9rem' }}>
                  រកមិនឃើញជួរឈរដែលត្រូវនឹង &quot;{searchQuery}&quot; ឡើយ។
                </p>
              </div>
            ) : (
              filteredColumns.map((col) => (
                <div
                  key={`col-${col.col}`}
                  style={{
                    backgroundColor: '#ffffff',
                    borderRadius: '12px',
                    border: '1px solid #e2e8f0',
                    padding: '18px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    boxShadow: '0 2px 6px rgba(0,0,0,0.02)',
                    transition: 'all 0.2s ease',
                  }}
                >
                  <div>
                    {/* Top Row: Col number, Trilingual Name & Category */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px', gap: '8px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span
                          style={{
                            width: '28px',
                            height: '28px',
                            borderRadius: '6px',
                            backgroundColor: col.categoryColor,
                            color: '#ffffff',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 800,
                            fontSize: '0.85rem',
                            flexShrink: 0
                          }}
                        >
                          {col.col}
                        </span>
                        <div>
                          <strong className="kh-text" style={{ fontSize: '1rem', color: '#0f172a', display: 'block' }}>
                            {col.kh}
                          </strong>
                          <span style={{ fontSize: '0.76rem', color: '#64748b' }}>
                            {col.zh} • {col.en}
                          </span>
                        </div>
                      </div>

                      <span
                        style={{
                          fontSize: '0.7rem',
                          padding: '2px 8px',
                          borderRadius: '12px',
                          backgroundColor: `${col.categoryColor}15`,
                          color: col.categoryColor,
                          fontWeight: 700,
                          whiteSpace: 'nowrap'
                        }}
                      >
                        {col.categoryLabelKh}
                      </span>
                    </div>

                    {/* Formula Box */}
                    <div style={{ margin: '10px 0', padding: '8px 12px', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px dashed #cbd5e1', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '6px' }}>
                      <div style={{ fontFamily: 'monospace', fontSize: '0.82rem', color: '#1e40af', fontWeight: 700, overflowX: 'auto', whiteSpace: 'nowrap' }}>
                        {col.formula}
                      </div>
                      <button
                        type="button"
                        onClick={() => handleCopy(col.formula, `col-${col.col}`)}
                        title="ចម្លងរូបមន្ត"
                        style={{
                          padding: '2px 6px',
                          borderRadius: '4px',
                          backgroundColor: copiedKey === `col-${col.col}` ? '#dcfce7' : '#e2e8f0',
                          color: copiedKey === `col-${col.col}` ? '#15803d' : '#475569',
                          border: 'none',
                          fontSize: '0.7rem',
                          cursor: 'pointer',
                          fontWeight: 600,
                          flexShrink: 0
                        }}
                      >
                        {copiedKey === `col-${col.col}` ? '✓ បានចម្លង' : '📋'}
                      </button>
                    </div>

                    {/* Description */}
                    <p style={{ margin: '0 0 10px 0', fontSize: '0.82rem', color: '#334155', lineHeight: 1.5 }}>
                      {col.descriptionKh}
                    </p>
                  </div>

                  <div style={{ paddingTop: '10px', borderTop: '1px solid #f1f5f9', display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '0.76rem' }}>
                    <div style={{ color: '#64748b' }}>
                      <strong style={{ color: '#475569' }}>ប្រភពទិន្នន័យ៖</strong> {col.dataSource}
                    </div>
                    {col.exampleKh && (
                      <div style={{ color: '#0369a1' }}>
                        <strong>ឧទាហរណ៍៖</strong> {col.exampleKh}
                      </div>
                    )}
                    {col.lawReference && (
                      <div style={{ color: '#b45309', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <span>⚖️</span>
                        <span><strong>ច្បាប់យោង៖</strong> {col.lawReference}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: INTERACTIVE LIVE FORMULA SIMULATOR                                 */}
      {/* ========================================================================= */}
      {subTab === 'simulator' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div
            style={{
              padding: '16px 20px',
              borderRadius: '12px',
              backgroundColor: '#f0fdf4',
              border: '1px solid #86efac',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '12px',
            }}
          >
            <div>
              <strong className="kh-text" style={{ color: '#15803d', fontSize: '1.02rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span>🧮</span> ម៉ាស៊ីនសាកល្បងគណនាផ្ទាល់ (Interactive Formula Simulator & Sandbox)
              </strong>
              <p style={{ margin: '4px 0 0', fontSize: '0.84rem', color: '#166534' }}>
                បញ្ចូលទិន្នន័យគំរូខាងក្រោមដើម្បីផ្ទៀងផ្ទាត់ និងមើលការគណនាលម្អិតមួយជំហានម្តងៗ ស្របតាមរូបមន្តជាក់ស្តែងរបស់ប្រព័ន្ធ។
              </p>
            </div>
            <div style={{ fontSize: '0.85rem', color: '#166534', fontWeight: 700, backgroundColor: '#dcfce7', padding: '6px 14px', borderRadius: '10px' }}>
              អត្រាប្តូរប្រាក់បច្ចុប្បន្ន៖ 1$ = {exchangeRate.toLocaleString()} ៛
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '20px' }}>
            {/* Input Controls Card */}
            <div className="card" style={{ padding: '24px', borderRadius: '14px', border: '1px solid var(--border-color)' }}>
              <h3 className="kh-text" style={{ margin: '0 0 16px', fontSize: '1.1rem', color: '#1e3a8a' }}>
                📝 ១. បញ្ចូលប៉ារ៉ាម៉ែត្រសាកល្បង
              </h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: 700, marginBottom: '4px', color: '#334155' }}>
                    ប្រាក់ខែគោល (Basic Salary USD) :
                  </label>
                  <input
                    type="number"
                    value={simBasic}
                    onChange={(e) => setSimBasic(parseFloat(e.target.value) || 0)}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.92rem' }}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: 700, marginBottom: '4px', color: '#334155' }}>
                      ថ្ងៃធ្វើការ (Working Days) :
                    </label>
                    <input
                      type="number"
                      value={simDays}
                      onChange={(e) => setSimDays(parseFloat(e.target.value) || 0)}
                      max={26}
                      min={0}
                      style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.92rem' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: 700, marginBottom: '4px', color: '#334155' }}>
                      ថ្ងៃអវត្តមាន (Absent Days) :
                    </label>
                    <input
                      type="number"
                      value={simAbsentDays}
                      onChange={(e) => setSimAbsentDays(parseFloat(e.target.value) || 0)}
                      min={0}
                      style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.92rem' }}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, marginBottom: '4px', color: '#334155' }}>
                      OT ធម្មតា (150%) :
                    </label>
                    <input
                      type="number"
                      value={simNormalOt}
                      onChange={(e) => setSimNormalOt(parseFloat(e.target.value) || 0)}
                      style={{ width: '100%', padding: '6px 8px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.88rem' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, marginBottom: '4px', color: '#334155' }}>
                      OT អាទិត្យ (200%) :
                    </label>
                    <input
                      type="number"
                      value={simSunOt}
                      onChange={(e) => setSimSunOt(parseFloat(e.target.value) || 0)}
                      style={{ width: '100%', padding: '6px 8px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.88rem' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, marginBottom: '4px', color: '#334155' }}>
                      OT យប់ (200%) :
                    </label>
                    <input
                      type="number"
                      value={simNightOt}
                      onChange={(e) => setSimNightOt(parseFloat(e.target.value) || 0)}
                      style={{ width: '100%', padding: '6px 8px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.88rem' }}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: 700, marginBottom: '4px', color: '#334155' }}>
                      ប្រាក់តួនាទី (Position) :
                    </label>
                    <input
                      type="number"
                      value={simPosition}
                      onChange={(e) => setSimPosition(parseFloat(e.target.value) || 0)}
                      style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.92rem' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: 700, marginBottom: '4px', color: '#334155' }}>
                      ប្រាក់ជំនាញ (Skill) :
                    </label>
                    <input
                      type="number"
                      value={simSkill}
                      onChange={(e) => setSimSkill(parseFloat(e.target.value) || 0)}
                      style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.92rem' }}
                    />
                  </div>
                </div>

                {/* Seniority input in Simulator */}
                <div style={{ padding: '12px', borderRadius: '8px', backgroundColor: '#eff6ff', border: '1px solid #bfdbfe' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                    <label style={{ fontSize: '0.84rem', fontWeight: 700, color: '#1e40af' }}>
                      🎖️ អតីតភាពការងារ (Seniority Years) :
                    </label>
                    <span style={{ fontSize: '0.78rem', backgroundColor: '#dbeafe', color: '#1e40af', padding: '2px 8px', borderRadius: '4px', fontWeight: 700 }}>
                      +{simResults.seniorityAllowance > 0 ? `$${simResults.seniorityAllowance.toFixed(2)}/ខែ` : '$0/ខែ'}
                    </span>
                  </div>
                  <input
                    type="number"
                    value={simSeniorityYears}
                    onChange={(e) => setSimSeniorityYears(Math.max(0, parseFloat(e.target.value) || 0))}
                    min={0}
                    max={25}
                    step={1}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.92rem', backgroundColor: '#ffffff' }}
                  />
                  <div style={{ fontSize: '0.74rem', color: '#64748b', marginTop: '4px' }}>
                    * ពេញ ១ ឆ្នាំ = $2, ២ ឆ្នាំ = $3, ..., ១០ ឆ្នាំឡើង = $11 (ពិដានអតិបរមា)
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: 700, marginBottom: '4px', color: '#334155' }}>
                      👶 កូនក្នុងបន្ទុក (Children) :
                    </label>
                    <input
                      type="number"
                      value={simChildren}
                      onChange={(e) => setSimChildren(Math.max(0, parseInt(e.target.value) || 0))}
                      min={0}
                      max={15}
                      style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.92rem' }}
                    />
                    <div style={{ fontSize: '0.72rem', color: '#be185d', marginTop: '2px', fontWeight: 600 }}>
                      +${dayCareRate.toFixed(2)}/កូន/ខែ
                    </div>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: 700, marginBottom: '4px', color: '#334155' }}>
                      ប្រាក់បើកមុន / កម្ចី (Advance) :
                    </label>
                    <input
                      type="number"
                      value={simAdvance}
                      onChange={(e) => setSimAdvance(parseFloat(e.target.value) || 0)}
                      style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.92rem' }}
                    />
                  </div>
                </div>

                {/* Toggles */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '6px' }}>
                  <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.84rem', cursor: 'pointer', fontWeight: 600 }}>
                      <input
                        type="checkbox"
                        checked={simHasNssf}
                        onChange={(e) => setSimHasNssf(e.target.checked)}
                      />
                      មានកាត ប.ស.ស (2%)
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.84rem', cursor: 'pointer', fontWeight: 600 }}>
                      <input
                        type="checkbox"
                        checked={simHasFdc}
                        onChange={(e) => setSimHasFdc(e.target.checked)}
                      />
                      ប្រាក់ដំណាច់ 5% (FDC)
                    </label>
                  </div>

                  {/* Seniority Indemnity June/December Toggle */}
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem', cursor: 'pointer', fontWeight: 700, color: '#1e40af', backgroundColor: '#e0f2fe', padding: '6px 10px', borderRadius: '6px', border: '1px dashed #7dd3fc' }}>
                    <input
                      type="checkbox"
                      checked={simIsSeniorityPayoutMonth}
                      onChange={(e) => setSimIsSeniorityPayoutMonth(e.target.checked)}
                    />
                    🎁 ខែបើកប្រាក់បំណាច់អតីតភាព UDC (ខែមិថុនា ឬ ធ្នូ - ៧.៥ ថ្ងៃ)
                  </label>
                </div>
              </div>
            </div>

            {/* Live Calculation Output Card */}
            <div className="card" style={{ padding: '24px', borderRadius: '14px', border: '1.5px solid #2563eb', backgroundColor: '#fafcff' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                <h3 className="kh-text" style={{ margin: 0, fontSize: '1.1rem', color: '#1e40af' }}>
                  📊 ២. លទ្ធផលគណនាជាក់ស្តែង (Live Breakdown)
                </h3>
                <span style={{ fontSize: '0.72rem', backgroundColor: '#dbeafe', color: '#1e40af', padding: '2px 8px', borderRadius: '12px', fontWeight: 700 }}>
                  Realtime Engine
                </span>
              </div>

              {/* Rate Badges */}
              <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
                <div style={{ flex: 1, backgroundColor: '#ffffff', padding: '8px', borderRadius: '8px', border: '1px solid #cbd5e1', textAlign: 'center' }}>
                  <span style={{ fontSize: '0.72rem', color: '#64748b', display: 'block' }}>Daily Rate</span>
                  <strong style={{ fontSize: '0.95rem', color: '#0f172a' }}>${simResults.dailyRate.toFixed(2)}</strong>
                </div>
                <div style={{ flex: 1, backgroundColor: '#ffffff', padding: '8px', borderRadius: '8px', border: '1px solid #cbd5e1', textAlign: 'center' }}>
                  <span style={{ fontSize: '0.72rem', color: '#64748b', display: 'block' }}>Hourly Rate</span>
                  <strong style={{ fontSize: '0.95rem', color: '#0f172a' }}>${simResults.hourlyRate.toFixed(2)}</strong>
                </div>
              </div>

              {/* Step-by-step breakdown */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.84rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '14px', marginBottom: '14px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#475569' }}>ប្រាក់ខែតាមថ្ងៃជាក់ស្តែង ({simDays} ថ្ងៃ):</span>
                  <strong>${simResults.workingSalary.toFixed(2)}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#475569' }}>ថែមម៉ោងសរុប (OT {simNormalOt + simSunOt + simNightOt} ម៉ោង):</span>
                  <strong>${(simResults.otWage + simResults.sunOtWage + simResults.nightOtWage).toFixed(2)}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#475569' }}>ថ្លៃបាយថ្ងៃត្រង់ + ថ្លៃបាយ OT:</span>
                  <strong>${(simResults.lunchAllowance + simResults.otMealAllowance).toFixed(2)}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#475569' }}>ថ្លៃធ្វើដំណើរ (Transport):</span>
                  <strong>${simResults.transportation.toFixed(2)}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#475569' }}>រង្វាន់ឧស្សាហ៍ព្យាយាម (Attendance):</span>
                  <strong style={{ color: simResults.attendanceBonus > 0 ? '#15803d' : '#dc2626' }}>
                    ${simResults.attendanceBonus.toFixed(2)} {simAbsentDays > 0 ? '(អវត្តមាន ០$)' : ''}
                  </strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#475569' }}>ប្រាក់តួនាទី + ប្រាក់ជំនាញ:</span>
                  <strong>${(simResults.payScaleIncentive + simResults.adjustmentSkill).toFixed(2)}</strong>
                </div>
                {simResults.dayCareAllowance > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#be185d' }}>+ ប្រាក់កូនតូច ({simChildren} នាក់):</span>
                    <strong style={{ color: '#be185d' }}>+${simResults.dayCareAllowance.toFixed(2)}</strong>
                  </div>
                )}
                {simResults.seniorityAllowance > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#166534' }}>+ ប្រាក់អតីតភាព ({simSeniorityYears} ឆ្នាំ):</span>
                    <strong style={{ color: '#166534' }}>+${simResults.seniorityAllowance.toFixed(2)}</strong>
                  </div>
                )}
                {simResults.seniorityIndemnity > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', backgroundColor: '#eff6ff', padding: '4px 6px', borderRadius: '4px' }}>
                    <span style={{ color: '#1d4ed8', fontWeight: 700 }}>+ ប្រាក់បំណាច់អតីតភាព UDC (៧.៥ ថ្ងៃ):</span>
                    <strong style={{ color: '#1d4ed8' }}>+${simResults.seniorityIndemnity.toFixed(2)}</strong>
                  </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px dashed #cbd5e1', paddingTop: '6px' }}>
                  <span style={{ color: '#0f172a', fontWeight: 700 }}>ប្រាក់ខែសរុប (Total Salary):</span>
                  <strong style={{ color: '#2563eb' }}>${simResults.totalSalary.toFixed(2)}</strong>
                </div>
                {simHasFdc && (
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#059669' }}>+ ប្រាក់ដំណាច់ 5% (Severance):</span>
                    <strong style={{ color: '#059669' }}>+${simResults.severancePay.toFixed(2)}</strong>
                  </div>
                )}
                {simResults.nssf > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#dc2626' }}>- កាត់កង ប.ស.ស (NSSF 2%):</span>
                    <strong style={{ color: '#dc2626' }}>-${simResults.nssf.toFixed(2)}</strong>
                  </div>
                )}
                {simResults.loanPension > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#dc2626' }}>- កាត់ប្រាក់បើកមុន (Advance):</span>
                    <strong style={{ color: '#dc2626' }}>-${simResults.loanPension.toFixed(2)}</strong>
                  </div>
                )}
              </div>

              {/* Grand Total Net Salary */}
              <div style={{ backgroundColor: '#ffffff', padding: '14px', borderRadius: '10px', border: '1.5px solid #3b82f6', marginBottom: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <span style={{ fontSize: '0.76rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>
                      ប្រាក់ខែសុទ្ធលើកទី២ (2nd Payment Net USD - ជួរទី ៤២)
                    </span>
                    <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#1e40af' }}>
                      ${simResults.netSalaryUsd.toFixed(2)}
                    </div>
                  </div>
                  <span style={{ fontSize: '1.5rem' }}>💵</span>
                </div>
              </div>

              {/* Payment 1 & Payment 2 Breakdown Cards */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '14px' }}>
                <div style={{ backgroundColor: '#f0f9ff', padding: '10px 12px', borderRadius: '8px', border: '1px solid #bae6fd' }}>
                  <span style={{ fontSize: '0.72rem', color: '#0369a1', display: 'block', fontWeight: 700 }}>
                    📅 បើកលើកទី១ (1st Pay - ជួរ ៤០)
                  </span>
                  <strong style={{ fontSize: '1.1rem', color: '#0284c7' }}>${simResults.loanPension.toFixed(2)}</strong>
                  <span style={{ fontSize: '0.68rem', color: '#64748b', display: 'block', marginTop: '2px' }}>
                    ប្រាក់បុរេប្រទាន (ថ្ងៃទី {p1Start}-{p1End})
                  </span>
                </div>
                <div style={{ backgroundColor: '#f0fdf4', padding: '10px 12px', borderRadius: '8px', border: '1px solid #bbf7d0' }}>
                  <span style={{ fontSize: '0.72rem', color: '#15803d', display: 'block', fontWeight: 700 }}>
                    📅 បើកលើកទី២ (2nd Pay - ជួរ ៤២)
                  </span>
                  <strong style={{ fontSize: '1.1rem', color: '#16a34a' }}>${simResults.netSalaryUsd.toFixed(2)}</strong>
                  <span style={{ fontSize: '0.68rem', color: '#64748b', display: 'block', marginTop: '2px' }}>
                    ប្រាក់ខែសុទ្ធ (ថ្ងៃទី {p2Start}-{p2End})
                  </span>
                </div>
              </div>

              {/* Currency Split Display */}
              <div style={{ backgroundColor: '#ecfdf5', padding: '14px', borderRadius: '10px', border: '1.5px solid #10b981' }}>
                <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#047857', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span>💱</span> ការទូទាត់ប្រាក់បៀវត្សរ៍ជាក់ស្តែង (Cash Payout Split):
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div style={{ backgroundColor: '#ffffff', padding: '10px', borderRadius: '8px', border: '1px solid #a7f3d0' }}>
                    <span style={{ fontSize: '0.72rem', color: '#065f46', display: 'block' }}>បើកជាដុល្លារ (Paid USD)</span>
                    <strong style={{ fontSize: '1.2rem', color: '#047857' }}>${simResults.paidSalaryUsd.toFixed(2)}</strong>
                  </div>
                  <div style={{ backgroundColor: '#ffffff', padding: '10px', borderRadius: '8px', border: '1px solid #a7f3d0' }}>
                    <span style={{ fontSize: '0.72rem', color: '#065f46', display: 'block' }}>បើកជារៀល (Net Riel)</span>
                    <strong style={{ fontSize: '1.2rem', color: '#047857' }}>{simResults.netSalaryRiel.toLocaleString()} ៛</strong>
                  </div>
                </div>
                <div style={{ fontSize: '0.72rem', color: '#059669', marginTop: '6px' }}>
                  * សេស ${simResults.remainderUsd.toFixed(2)} × {exchangeRate.toLocaleString()} ៛ (កាត់ទម្លាក់ត្រឹម ១០០៛)
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: EMPLOYEE LIFECYCLE SOP                                             */}
      {/* ========================================================================= */}
      {subTab === 'lifecycle' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div className="card" style={{ padding: '24px', borderRadius: '14px', border: '1px solid var(--border-color)' }}>
            <h2 className="kh-text" style={{ margin: '0 0 16px', fontSize: '1.25rem', color: '#1e3a8a', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>👤</span> នីតិវិធីគ្រប់គ្រងវដ្តជីវិតបុគ្គលិក (Employee Lifecycle SOP)
            </h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Step 1 */}
              <div style={{ padding: '18px', borderRadius: '12px', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', display: 'flex', gap: '16px' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: '#2563eb', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, flexShrink: 0 }}>
                  1
                </div>
                <div style={{ flex: 1 }}>
                  <h3 className="kh-text" style={{ margin: '0 0 6px', fontSize: '1.02rem', color: '#0f172a' }}>
                    ការជ្រើសរើស និងចុះឈ្មោះបុគ្គលិកថ្មី (Recruitment & Onboarding)
                  </h3>
                  <p style={{ margin: '0 0 8px', fontSize: '0.84rem', color: '#475569', lineHeight: 1.5 }}>
                    នៅពេលមានបុគ្គលិកថ្មីចូលបម្រើការងារ ផ្នែករដ្ឋបាល/ធនធានមនុស្សត្រូវប្រមូលឯកសារ និងបំពេញព័ត៌មានក្នុងប្រព័ន្ធ៖
                  </p>
                  <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '0.82rem', color: '#64748b', lineHeight: 1.6 }}>
                    <li><strong>ឯកសារតម្រូវ៖</strong> អត្តសញ្ញាណប័ណ្ណសញ្ជាតិខ្មែរ (ID Card), សៀវភៅការងារ, លេខកាត ប.ស.ស (បើមាន), និងលេខគណនីធនាគារ។</li>
                    <li><strong>បង្កើត Profile៖</strong> ចូលទៅកាន់ម៉ឺនុយ «បុគ្គលិក» ➔ «ចុះឈ្មោះបុគ្គលិកថ្មី» បញ្ចូលឈ្មោះ (ខ្មែរ/ឡាតាំង), ភេទ, ថ្ងៃចូលធ្វើការ, ផ្នែក និងតួនាទី។</li>
                    <li><strong>កំណត់ប្រាក់ខែ៖</strong> បញ្ចូលប្រាក់ខែគោល (Basic Salary), ប្រាក់ជំនាញ (Skill), និងប្រាក់តួនាទី (Position Allowance)។</li>
                  </ul>
                </div>
              </div>

              {/* Step 2 */}
              <div style={{ padding: '18px', borderRadius: '12px', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', display: 'flex', gap: '16px' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: '#2563eb', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, flexShrink: 0 }}>
                  2
                </div>
                <div style={{ flex: 1 }}>
                  <h3 className="kh-text" style={{ margin: '0 0 6px', fontSize: '1.02rem', color: '#0f172a' }}>
                    ការសាកល្បងការងារ និងកិច្ចសន្យាការងារ (Probation & Contract Setup)
                  </h3>
                  <p style={{ margin: '0 0 8px', fontSize: '0.84rem', color: '#475569', lineHeight: 1.5 }}>
                    កំណត់ប្រភេទកិច្ចសន្យាការងារស្របតាមច្បាប់ការងារកម្ពុជា៖
                  </p>
                  <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '0.82rem', color: '#64748b', lineHeight: 1.6 }}>
                    <li><strong>កិច្ចសន្យាសាកល្បង (Probation):</strong> កំណត់ពី ១ ដល់ ៣ ខែ ទៅតាមមុខតំណែងជំនាញ និងធម្មតារបស់បុគ្គលិក។</li>
                    <li><strong>កិច្ចសន្យា FDC (មានកំណត់ថិរវេលា):</strong> មានសិទ្ធិទទួលបានប្រាក់ដំណាច់ ៥% (Severance Pay) រៀងរាល់ដំណាច់កិច្ចសន្យា ឬដំណាច់ខែ។</li>
                    <li><strong>កិច្ចសន្យា UDC (គ្មានកំណត់ថិរវេលា):</strong> ទទួលបានប្រាក់បំណាច់អតីតភាពការងារ (Seniority Indemnity) ១៥ ថ្ងៃក្នុងមួយឆ្នាំ (បើក ២ លើក៖ ៧.៥ ថ្ងៃក្នុងខែមិថុនា និង ៧.៥ ថ្ងៃក្នុងខែធ្នូ) ស្របតាមមាត្រា ៨៩ ថ្មី និងប្រកាស ៤៤២/១៨។</li>
                  </ul>
                </div>
              </div>

              {/* Step 3 */}
              <div style={{ padding: '18px', borderRadius: '12px', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', display: 'flex', gap: '16px' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: '#2563eb', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, flexShrink: 0 }}>
                  3
                </div>
                <div style={{ flex: 1 }}>
                  <h3 className="kh-text" style={{ margin: '0 0 6px', fontSize: '1.02rem', color: '#0f172a' }}>
                    ការវាយតម្លៃលទ្ធផលការងារ (KPI & Performance Review)
                  </h3>
                  <p style={{ margin: '0 0 8px', fontSize: '0.84rem', color: '#475569', lineHeight: 1.5 }}>
                    ការវាយតម្លៃ និងតម្លើងឋានៈ/ប្រាក់បៀវត្សរ៍ប្រចាំត្រីមាស ឬប្រចាំឆ្នាំ៖
                  </p>
                  <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '0.82rem', color: '#64748b', lineHeight: 1.6 }}>
                    <li>គ្រប់គ្រងសូចនាករ KPI ក្នុងផ្ទាំង «ការកំណត់ KPI & រូបមន្ត» តាមផ្នែកនីមួយៗ។</li>
                    <li>ពិន្ទុវាយតម្លៃនឹងត្រូវកត់ត្រាជាមូលដ្ឋានសម្រាប់ផ្តល់ប្រាក់រង្វាន់លើកទឹកចិត្ត (Performance Incentive)។</li>
                  </ul>
                </div>
              </div>

              {/* Step 4 */}
              <div style={{ padding: '18px', borderRadius: '12px', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', display: 'flex', gap: '16px' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: '#ef4444', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, flexShrink: 0 }}>
                  4
                </div>
                <div style={{ flex: 1 }}>
                  <h3 className="kh-text" style={{ margin: '0 0 6px', fontSize: '1.02rem', color: '#0f172a' }}>
                    ការបញ្ចប់ការងារ និងគណនាប្រាក់ដំណាច់ចុងក្រោយ (Offboarding & Final Settlement)
                  </h3>
                  <p style={{ margin: '0 0 8px', fontSize: '0.84rem', color: '#475569', lineHeight: 1.5 }}>
                    នីតិវិធីពេលបុគ្គលិកលាលែងពីការងារ ឬបញ្ចប់កិច្ចសន្យា៖
                  </p>
                  <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '0.82rem', color: '#64748b', lineHeight: 1.6 }}>
                    <li><strong>ការជូនដំណឹងជាមុន (Notice Period):</strong> ស្របតាមមាត្រា ៧៥ នៃច្បាប់ការងារ (៧ ថ្ងៃ ដល់ ៣ ខែ តាមអតីតភាព)។</li>
                    <li><strong>គណនាប្រាក់ខែចុងក្រោយ៖</strong> គិតតាមចំនួនថ្ងៃធ្វើការជាក់ស្តែង + ប្រាក់ថែមម៉ោង + ប្រាក់ដំណាច់ ៥% (បើជា FDC) + ប្រាក់បំណាច់ថ្ងៃច្បាប់ប្រចាំឆ្នាំដែលនៅសល់ (Annual Leave Compensation) + ប្រាក់បំណាច់អតីតភាពដែលនៅសល់ក្នុងឆមាស និងប្រាក់សំណងជំងឺចិត្ត (បើជា UDC បញ្ឈប់ដោយគ្មានកំហុសធ្ងន់ធ្ងរ)។</li>
                    <li><strong>កាត់កងបំណុល/ប្រាក់ខ្ចី៖</strong> ដកប្រាក់បុរេប្រទាន ឬកម្ចីដែលនៅជំពាក់ទាំងអស់ចេញពីប្រាក់ដំណាច់។</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: ATTENDANCE & LEAVE WORK INSTRUCTIONS                               */}
      {/* ========================================================================= */}
      {subTab === 'attendance' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div className="card" style={{ padding: '24px', borderRadius: '14px', border: '1px solid var(--border-color)' }}>
            <h2 className="kh-text" style={{ margin: '0 0 16px', fontSize: '1.25rem', color: '#1e3a8a', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>⏱️</span> នីតិវិធីវត្តមាន, ថែមម៉ោង & ច្បាប់ឈប់សម្រាក (Attendance, OT & Leave WI)
            </h2>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px' }}>
              {/* Working Shifts Card */}
              <div style={{ padding: '18px', borderRadius: '12px', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0' }}>
                <h3 className="kh-text" style={{ margin: '0 0 10px', fontSize: '1.02rem', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span>🏢</span> វេនការងារស្តង់ដារ (Work Shifts)
                </h3>
                <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '0.83rem', color: '#475569', lineHeight: 1.6 }}>
                  <li><strong>វេនព្រឹក៖</strong> ០៧:០០ ព្រឹក ដល់ ១១:០០ ថ្ងៃត្រង់ (៤ ម៉ោង)</li>
                  <li><strong>សម្រាកថ្ងៃត្រង់៖</strong> ១១:០០ ដល់ ១៣:០០ (២ ម៉ោង)</li>
                  <li><strong>វេនរសៀល៖</strong> ១៣:០០ ដល់ ១៧:០០ ល្ងាច (៤ ម៉ោង)</li>
                  <li><strong>វេនយប់ (ប្រសិនបើមាន)៖</strong> ១៧:០០ ដល់ ០៤:០០ ព្រឹក</li>
                </ul>
                <div style={{ marginTop: '10px', padding: '8px', borderRadius: '6px', backgroundColor: '#f1f5f9', fontSize: '0.78rem', color: '#64748b' }}>
                  💡 ការស្កេនម្រាមដៃយឺត ឬចេញមុន នឹងត្រូវកត់ត្រាចូលរបាយការណ៍វត្តមានស្វ័យប្រវត្តិ។
                </div>
              </div>

              {/* Overtime Approval SOP */}
              <div style={{ padding: '18px', borderRadius: '12px', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0' }}>
                <h3 className="kh-text" style={{ margin: '0 0 10px', fontSize: '1.02rem', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span>⏳</span> នីតិវិធីស្នើសុំថែមម៉ោង (OT SOP)
                </h3>
                <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '0.83rem', color: '#475569', lineHeight: 1.6 }}>
                  <li><strong>ការស្នើសុំជាមុន៖</strong> ប្រធានផ្នែកត្រូវបញ្ចូលពាក្យស្នើសុំថែមម៉ោង (OT Request) យ៉ាងហោចណាស់ <strong>២ ម៉ោងមុន</strong> ពេលចាប់ផ្តើមថែមម៉ោង។</li>
                  <li><strong>ការអនុម័ត (Approval):</strong> ប្រធានរដ្ឋបាល/HR ពិនិត្យ និងចុច «អនុម័ត (APPROVE)» ក្នុងប្រព័ន្ធ។</li>
                  <li><strong>ការទាញទិន្នន័យ៖</strong> ម៉ោង OT ដែលបានអនុម័ត នឹងត្រូវបញ្ចូលស្វ័យប្រវត្តិក្នងតារាង Payroll ប្រចាំខែ។</li>
                </ul>
              </div>

              {/* Leave Policy Card */}
              <div style={{ padding: '18px', borderRadius: '12px', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', gridColumn: '1 / -1' }}>
                <h3 className="kh-text" style={{ margin: '0 0 12px', fontSize: '1.02rem', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span>🏖️</span> គោលការណ៍ច្បាប់ឈប់សម្រាក (Leave Request SOP)
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '14px' }}>
                  <div style={{ backgroundColor: '#ffffff', padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1' }}>
                    <div style={{ fontWeight: 700, color: '#1e40af', fontSize: '0.88rem' }}>ច្បាប់ឈប់សម្រាកប្រចាំឆ្នាំ (Annual Leave)</div>
                    <p style={{ margin: '4px 0 0', fontSize: '0.8rem', color: '#475569', lineHeight: 1.5 }}>
                      បុគ្គលិកមានសិទ្ធិឈប់សម្រាក <strong>១៨ ថ្ងៃក្នុងមួយឆ្នាំ</strong> (កើនឡើង ១ ថ្ងៃរៀងរាល់អតីតភាព ៣ ឆ្នាំ)។ នៅពេលមានច្បាប់អនុម័ត មិនកាត់ប្រាក់ខែឡើយ។
                    </p>
                  </div>

                  <div style={{ backgroundColor: '#ffffff', padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1' }}>
                    <div style={{ fontWeight: 700, color: '#059669', fontSize: '0.88rem' }}>ច្បាប់ឈឺ (Sick Leave)</div>
                    <p style={{ margin: '4px 0 0', fontSize: '0.8rem', color: '#475569', lineHeight: 1.5 }}>
                      ត្រូវមានលិខិតបញ្ជាក់ពីគ្រូពេទ្យស្របច្បាប់។ ទទួលបានប្រាក់ឈ្នួល ១០០% ក្នុងអំឡុងពេលកំណត់នៃច្បាប់ការងារ។
                    </p>
                  </div>

                  <div style={{ backgroundColor: '#ffffff', padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1' }}>
                    <div style={{ fontWeight: 700, color: '#dc2626', fontSize: '0.88rem' }}>អវត្តមានឥតច្បាប់ (Unexcused Absence)</div>
                    <p style={{ margin: '4px 0 0', fontSize: '0.8rem', color: '#475569', lineHeight: 1.5 }}>
                      កាត់ប្រាក់ឈ្នួលតាមចំនួនថ្ងៃអវត្តមាន (Daily Rate) និង <strong>បាត់បង់ប្រាក់រង្វាន់ឧស្សាហ៍ព្យាយាម $15.00</strong> ក្នុងខែនោះ។
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 5: SALARY ADVANCE POLICY                                              */}
      {/* ========================================================================= */}
      {subTab === 'advance' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div className="card" style={{ padding: '24px', borderRadius: '14px', border: '1px solid var(--border-color)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
              <h2 className="kh-text" style={{ margin: 0, fontSize: '1.25rem', color: '#1e3a8a', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span>💸</span> គោលការណ៍ប្រាក់បុរេប្រទាន និងប្រាក់កម្ចី (Salary Advance Policy)
              </h2>
              <span style={{ fontSize: '0.8rem', backgroundColor: '#eff6ff', color: '#1e40af', padding: '4px 12px', borderRadius: '16px', fontWeight: 700 }}>
                Synced Settings Live
              </span>
            </div>

            <p style={{ margin: '0 0 20px', fontSize: '0.86rem', color: '#475569', lineHeight: 1.5 }}>
              គោលការណ៍នេះបង្កើតឡើងដើម្បីជួយសម្រួលដល់បុគ្គលិកដែលមានតម្រូវការហិរញ្ញវត្ថុបន្ទាន់ ដោយអនុលោមតាមបទបញ្ជាផ្ទៃក្នុងរបស់ក្រុមហ៊ុន៖
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
              {/* Rule 1 */}
              <div style={{ padding: '18px', borderRadius: '12px', backgroundColor: '#f8fafc', border: '1px solid #cbd5e1' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  <span style={{ fontSize: '1.3rem' }}>🎯</span>
                  <strong className="kh-text" style={{ color: '#0f172a' }}>លក្ខខណ្ឌអតីតភាពការងារ (Eligibility)</strong>
                </div>
                <div style={{ fontSize: '1.3rem', fontWeight: 800, color: '#2563eb', marginBottom: '6px' }}>
                  យ៉ាងតិច {advanceMonths} ខែ
                </div>
                <p style={{ margin: 0, fontSize: '0.82rem', color: '#64748b', lineHeight: 1.5 }}>
                  បុគ្គលិកត្រូវមានអតីតភាពការងារជាប់លាប់ចាប់ពី <strong>{advanceMonths} ខែឡើងទៅ</strong> ទើបមានសិទ្ធិដាក់ពាក្យស្នើសុំប្រាក់បុរេប្រទាន។
                </p>
              </div>

              {/* Rule 2 */}
              <div style={{ padding: '18px', borderRadius: '12px', backgroundColor: '#f8fafc', border: '1px solid #cbd5e1' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  <span style={{ fontSize: '1.3rem' }}>📊</span>
                  <strong className="kh-text" style={{ color: '#0f172a' }}>ដែនកំណត់ទឹកប្រាក់អតិបរមា (Max Limit)</strong>
                </div>
                <div style={{ fontSize: '1.3rem', fontWeight: 800, color: '#15803d', marginBottom: '6px' }}>
                  {advanceLimit}% នៃប្រាក់ខែគោល
                </div>
                <p style={{ margin: 0, fontSize: '0.82rem', color: '#64748b', lineHeight: 1.5 }}>
                  អាចស្នើបានអតិបរមាមិនលើសពី <strong>{advanceLimit}%</strong> នៃប្រាក់បៀវត្សរ៍គោលប្រចាំខែឡើយ ដើម្បីធានាសុវត្ថិភាពហិរញ្ញវត្ថុ។
                </p>
              </div>

              {/* Rule 3 */}
              <div style={{ padding: '18px', borderRadius: '12px', backgroundColor: '#f8fafc', border: '1px solid #cbd5e1' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  <span style={{ fontSize: '1.3rem' }}>🔄</span>
                  <strong className="kh-text" style={{ color: '#0f172a' }}>គោលការណ៍សងត្រឡប់ (Repayment Policy)</strong>
                </div>
                <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#b45309', marginBottom: '6px' }}>
                  {advancePolicy === 'NEXT_PAYROLL' ? 'កាត់ក្នុងតារាងប្រាក់ខែបន្ទាប់' : 'រំលស់តាមការព្រមព្រៀង'}
                </div>
                <p style={{ margin: 0, fontSize: '0.82rem', color: '#64748b', lineHeight: 1.5 }}>
                  ប្រាក់ដែលបានបើកមុននឹងត្រូវកាត់កងស្វ័យប្រវត្តិចេញពីតារាងបើកប្រាក់ខែ (Payroll) ក្នុងខែដែលបានស្នើសុំ ឬខែបន្ទាប់។
                </p>
              </div>
            </div>

            {/* Advance Workflow */}
            <div style={{ marginTop: '20px', padding: '16px', borderRadius: '10px', backgroundColor: '#eff6ff', border: '1px solid #bfdbfe' }}>
              <h4 className="kh-text" style={{ margin: '0 0 8px', color: '#1e40af', fontSize: '0.95rem' }}>
                📋 ដំណើរការស្នើសុំ និងអនុម័តប្រាក់បុរេប្រទាន (Step-by-Step Approval Workflow)
              </h4>
              <ol style={{ margin: 0, paddingLeft: '20px', fontSize: '0.83rem', color: '#1e3a8a', lineHeight: 1.6 }}>
                <li>បុគ្គលិកដាក់ពាក្យស្នើសុំតាមរយៈទម្រង់ ឬតាមរយៈផ្នែករដ្ឋបាល ដោយបញ្ជាក់ពីមូលហេតុច្បាស់លាស់។</li>
                <li>ប្រធានផ្នែក និងប្រធានរដ្ឋបាលត្រួតពិនិត្យអតីតភាពការងារ និងកម្រិតកំណត់ {advanceLimit}%។</li>
                <li>គណនេយ្យ/អ្នកគ្រប់គ្រងចុច «អនុម័ត (APPROVE)» ក្នុងផ្ទាំង «ប្រាក់បុរេប្រទាន»។</li>
                <li>ប្រព័ន្ធនឹងកាត់កងទឹកប្រាក់នេះដោយស្វ័យប្រវត្តិនៅពេលបង្កើតតារាងប្រាក់ខែ (Payroll Generation)។</li>
              </ol>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 6: LABOR LAW STANDARDS & REFERENCES                                  */}
      {/* ========================================================================= */}
      {subTab === 'law' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div className="card" style={{ padding: '24px', borderRadius: '14px', border: '1px solid var(--border-color)' }}>
            <h2 className="kh-text" style={{ margin: '0 0 16px', fontSize: '1.25rem', color: '#1e3a8a', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>⚖️</span> សេចក្តីយោងច្បាប់ស្តីពីការងារ និងបទដ្ឋានគតិយុត្តិ (Cambodia Labor Law Standards)
            </h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ padding: '14px', borderRadius: '10px', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0' }}>
                <strong style={{ color: '#0f172a', fontSize: '0.92rem' }}>មាត្រា ១០៤ ដល់ ១០៨ នៃច្បាប់ស្តីពីការងារ (ប្រាក់ឈ្នួល)</strong>
                <p style={{ margin: '4px 0 0', fontSize: '0.82rem', color: '#475569', lineHeight: 1.5 }}>
                  កំណត់អំពីនិយមន័យប្រាក់ឈ្នួល ការគណនាប្រាក់ឈ្នួលប្រចាំថ្ងៃដោយចែកនឹង ២៦ ថ្ងៃ និងការហាមឃាត់ការកាត់ប្រាក់ឈ្នួលដោយគ្មានមូលដ្ឋានច្បាប់។
                </p>
              </div>

              <div style={{ padding: '14px', borderRadius: '10px', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0' }}>
                <strong style={{ color: '#0f172a', fontSize: '0.92rem' }}>មាត្រា ១៣៩ នៃច្បាប់ស្តីពីការងារ (ការថែមម៉ោង)</strong>
                <p style={{ margin: '4px 0 0', fontSize: '0.82rem', color: '#475569', lineHeight: 1.5 }}>
                  ការងារលើសម៉ោងធម្មតាត្រូវផ្តល់ប្រាក់ឈ្នួលស្មើនឹង ១៥០%។ ការងារថែមម៉ោងនៅពេលយប់ ឬនៅថ្ងៃឈប់សម្រាកប្រចាំសប្តាហ៍ត្រូវផ្តល់ប្រាក់ឈ្នួលស្មើនឹង ២០០%។
                </p>
              </div>

              <div style={{ padding: '14px', borderRadius: '10px', backgroundColor: '#f8fafc', border: '1.5px solid #cbd5e1' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                  <strong style={{ color: '#0f172a', fontSize: '0.92rem' }}>ច្បាប់ស្តីពីរបបសន្តិសុខសង្គម (ប.ស.ស - NSSF Law &amp; Prakas 234/26)</strong>
                  <span style={{ fontSize: '0.72rem', backgroundColor: '#e0f2fe', color: '#0369a1', padding: '2px 8px', borderRadius: '4px', fontWeight: 700 }}>អនុវត្ត វិច្ឆិកា ២០២៦</span>
                </div>
                <p style={{ margin: '4px 0 0', fontSize: '0.82rem', color: '#475569', lineHeight: 1.5 }}>
                  កំណត់កាតព្វកិច្ចចុះបញ្ជី និងបង់ភាគទានរបបសន្តិសុខសង្គមផ្នែកថែទាំសុខភាព ហានិភ័យការងារ និងរបបសោធន (២% ភាគីនិយោជិត និង ២% ភាគីនិយោជក)។ យោងប្រកាសអន្តរក្រសួងលេខ ២៣៤/២៦ និងសេចក្តីជូនដំណឹងលេខ ៣១៣៤/២៦ ប.ស.ស. អនុវត្តចាប់ពីខែវិច្ឆិកា ឆ្នាំ២០២៦ តទៅ៖ ប្រាក់ឈ្នួលជាប់ភាគទានអប្បបរមាកំណត់ <strong>៦០០ ០០០ ៛ ($150)</strong> និងពិដានកំណត់អតិបរមា <strong>១ ៥០០ ០០០ ៛ ($375)</strong> ដោយការកាត់កងភាគទានសោធន ២% គឺចន្លោះពី <strong>$3.00</strong> ទៅ <strong>$7.50</strong> ក្នុងមួយខែ។
                </p>
              </div>

              <div style={{ padding: '16px', borderRadius: '10px', backgroundColor: '#eff6ff', border: '1.5px solid #93c5fd' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px', flexWrap: 'wrap', gap: '6px' }}>
                  <strong style={{ color: '#1e40af', fontSize: '0.94rem' }}>មាត្រា ៨៩ ថ្មី នៃច្បាប់ស្តីពីការងារ និងប្រកាសលេខ ៤៤២/១៨ &amp; ៤២៣/១៩ (ប្រាក់បំណាច់អតីតភាព)</strong>
                  <span style={{ fontSize: '0.74rem', backgroundColor: '#dbeafe', color: '#1e40af', padding: '2px 8px', borderRadius: '4px', fontWeight: 700 }}>MLVT Standards</span>
                </div>
                <p style={{ margin: '4px 0 0', fontSize: '0.82rem', color: '#334155', lineHeight: 1.6 }}>
                  • <strong>ប្រាក់បំណាច់អតីតភាពការងារថ្មី (Seniority Indemnity)៖</strong> និយោជកត្រូវផ្តល់ជូនកម្មករនិយោជិតដែលមានកិច្ចសន្យា UDC ចំនួន <strong>១៥ ថ្ងៃក្នុងមួយឆ្នាំ</strong> (ចែកជា ២ លើក៖ ៧.៥ ថ្ងៃក្នុងខែមិថុនា និង ៧.៥ ថ្ងៃក្នុងខែធ្នូ) គិតលើប្រាក់ឈ្នួល និងប្រាក់បន្ទាប់បន្សំជាមធ្យម។<br />
                  • <strong>ប្រាក់បំណាច់អតីតភាពការងារអតីតកាល មុនឆ្នាំ ២០១៩ (Back-Pay)៖</strong> ទូទាត់ ៦ ថ្ងៃក្នុងមួយឆ្នាំ (៣ ថ្ងៃខែមិថុនា និង ៣ ថ្ងៃខែធ្នូ) សម្រាប់វិស័យកាត់ដេរ និង ១៥ ថ្ងៃ/ឆ្នាំ សម្រាប់វិស័យផ្សេងៗ រហូតដល់ទូទាត់ចប់សព្វគ្រប់។
                </p>
              </div>

              <div style={{ padding: '14px', borderRadius: '10px', backgroundColor: '#f0fdf4', border: '1px solid #86efac' }}>
                <strong style={{ color: '#166534', fontSize: '0.92rem' }}>សេចក្តីប្រកាសស្តីពីប្រាក់រង្វាន់អតីតភាពការងារប្រចាំខែ (Seniority Bonus $2 - $11/ខែ)</strong>
                <p style={{ margin: '4px 0 0', fontSize: '0.82rem', color: '#334155', lineHeight: 1.5 }}>
                  ផ្តល់ជូនកម្មករនិយោជិតដែលមានអតីតភាពការងារចាប់ពី ១ ឆ្នាំឡើងទៅ ចាប់ពី $2.00 ក្នុងមួយខែ និងកើនឡើង $1.00 ក្នុងរៀងរាល់ ១ ឆ្នាំបន្ថែម រហូតដល់អតិបរមា $11.00 ក្នុងមួយខែ (ចាប់ពី ១០ ឆ្នាំឡើងទៅ)។
                </p>
              </div>

              <div style={{ padding: '14px', borderRadius: '10px', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0' }}>
                <strong style={{ color: '#0f172a', fontSize: '0.92rem' }}>សារាចរណែនាំលេខ ០០២ សហវ.អពដ នៃក្រសួងសេដ្ឋកិច្ច និងហិរញ្ញវត្ថុ</strong>
                <p style={{ margin: '4px 0 0', fontSize: '0.82rem', color: '#475569', lineHeight: 1.5 }}>
                  កំណត់អំពីកម្រិតប្រាក់បៀវត្សរ៍ជាប់ពន្ធតាមអត្រាកើនឡើងជាជណ្ដើរ (០%, ៥%, ១០%, ១៥%, ២០%) និងការកាត់បន្ថយបន្ទុកគ្រួសារ (សហព័ទ្ធ និងកូនក្នុងបន្ទុក)។
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
