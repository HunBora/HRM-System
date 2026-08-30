import { getDictionary } from '@/i18n/getDictionary';
import { prisma } from '@/lib/prisma';
import styles from '../kpi.module.css';
import MasterKpiClient from './MasterKpiClient';

export default async function MasterKpiPage() {
  const t = await getDictionary();

  // Fetch all master KPIs
  const masterKpis = await prisma.masterKpi.findMany({
    orderBy: [
      { department: 'asc' },
      { kpiType: 'asc' }
    ]
  });

  // Get unique departments from employees for the dropdown
  const employees = await prisma.employee.findMany({
    select: { department: true }
  });
  
  const uniqueDepartments = Array.from(new Set(employees.map(e => e.department).filter(Boolean))) as string[];
  uniqueDepartments.sort();

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className="kh-text" style={{ fontSize: '2rem', fontWeight: 'bold' }}>
          បញ្ជី Master KPI តាមផ្នែក
        </h1>
        <p className="kh-text" style={{ color: 'var(--text-muted)' }}>
          គ្រប់គ្រងនិងរៀបចំប្រភេទ KPI សម្រាប់ផ្នែកនីមួយៗ
        </p>
      </div>

      <MasterKpiClient 
        initialKpis={masterKpis} 
        departments={uniqueDepartments} 
      />
    </div>
  );
}
