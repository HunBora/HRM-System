'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import styles from './layout.module.css';

interface Tab {
  name: string;
  path: string;
}

export default function KpiTabNav({ tabs }: { tabs: Tab[] }) {
  const pathname = usePathname();

  return (
    <nav className={styles.tabNav}>
      {tabs.map((tab, index) => {
        const isActive = pathname === tab.path;
        return (
          <Link
            key={index}
            href={tab.path}
            className={`${styles.tabItem} ${isActive ? styles.tabItemActive : ''} kh-text`}
          >
            {tab.name}
          </Link>
        );
      })}
    </nav>
  );
}
