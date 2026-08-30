import Link from 'next/link';
import { getDictionary } from '@/i18n/getDictionary';
import styles from './layout.module.css';

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
      <nav className={styles.tabNav}>
        {tabs.map((tab, index) => (
          <Link key={index} href={tab.path} className={`${styles.tabItem} kh-text`}>
            {tab.name}
          </Link>
        ))}
      </nav>
      <div className={styles.content}>
        {children}
      </div>
    </div>
  );
}
