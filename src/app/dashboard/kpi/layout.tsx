import { getDictionary } from '@/i18n/getDictionary';
import styles from './layout.module.css';
import KpiTabNav from './KpiTabNav';

export default async function KpiLayout({ children }: { children: React.ReactNode }) {
  const t = await getDictionary();

  const tabs = [
    { name: t.kpi.tabs.overview, path: '/dashboard/kpi' },
    { name: t.kpi.tabs.setting, path: '/dashboard/kpi/setting' },
    { name: (t.kpi.tabs as any).master || 'Master KPI', path: '/dashboard/kpi/master' },
    { name: t.kpi.tabs.approval, path: '/dashboard/kpi/approval' },
    { name: t.kpi.tabs.plan, path: '/dashboard/kpi/plan' },
    { name: t.kpi.tabs.matrix, path: '/dashboard/kpi/matrix' },
    { name: t.kpi.tabs.formulas, path: '/dashboard/kpi/formulas' }
  ];

  return (
    <div className={styles.container}>
      <KpiTabNav tabs={tabs} />
      <div className={styles.content}>
        {children}
      </div>
    </div>
  );
}
