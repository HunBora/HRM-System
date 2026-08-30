'use client';

import React from 'react';
import { ComposedChart, Bar, Line, XAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import Link from 'next/link';

export default function DashboardKpiChart({ kpiScore = 85 }: { kpiScore?: number }) {
  // Mock data for Target vs Actual over 4 weeks
  const data = [
    { name: 'W1', target: 90, actual: 75 },
    { name: 'W2', target: 90, actual: 82 },
    { name: 'W3', target: 90, actual: 88 },
    { name: 'W4', target: 90, actual: kpiScore },
  ];

  return (
    <Link href="/dashboard/kpi" className="card animate-slide-up" style={{ display: 'flex', flexDirection: 'column', textDecoration: 'none', height: '100%', padding: '20px', minHeight: '160px', position: 'relative' }}>
      <div style={{ zIndex: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '15px' }}>
        <div>
          <h3 style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }} className="kh-text">
            COMPANY KPI SCORE
          </h3>
          <p style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--text-main)', marginTop: '4px', lineHeight: 1 }}>
            {kpiScore}<span style={{ fontSize: '1.2rem', color: 'var(--text-muted)', fontWeight: 500 }}>%</span>
          </p>
        </div>
        <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(59, 130, 246, 0.2) 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', boxShadow: 'inset 0 2px 4px rgba(255,255,255,0.5)' }}>
          🎯
        </div>
      </div>
      
      {/* Target vs Actual Chart */}
      <div style={{ flex: 1, minHeight: '80px', width: '100%', zIndex: 1, marginTop: 'auto' }}>
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data} margin={{ top: 10, right: 0, left: 0, bottom: 0 }}>
            <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
            <Tooltip 
              contentStyle={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}
              itemStyle={{ fontWeight: '600' }}
              labelStyle={{ color: '#64748b', marginBottom: '4px', fontSize: '0.85rem' }}
            />
            <Legend wrapperStyle={{ fontSize: '0.75rem', paddingTop: '5px' }} iconType="circle" />
            <Bar dataKey="actual" name="Actual" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={20} />
            <Line type="monotone" dataKey="target" name="Target" stroke="#f59e0b" strokeWidth={2} dot={{ r: 3, fill: '#f59e0b', strokeWidth: 0 }} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </Link>
  );
}
