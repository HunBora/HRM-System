import styles from './layout.module.css';
import { prisma } from '@/lib/prisma';
import { getDictionary } from '@/i18n/getDictionary';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import ThemeToggle from '@/components/ThemeToggle';
import ResizableSidebar from '@/components/ResizableSidebar';
import { getSession } from '@/lib/session';
import LogoutButton from '@/components/LogoutButton';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  const role = session?.role || 'EMPLOYEE';

  const settings = await prisma.companySettings.findUnique({
    where: { id: 'default' }
  });

  const companyName = settings?.companyName || 'HRM System';
  const logoUrl = settings?.logoUrl;
  const t = await getDictionary();

  return (
    <div className={styles.container}>
      {/* Resizable & Collapsible Sidebar */}
      <ResizableSidebar companyName={companyName} logoUrl={logoUrl} t={t} role={role} />

      {/* Main Content */}
      <main className={styles.mainContent}>
        {/* Header */}
        <header className={`${styles.header} no-print`}>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 600 }}>{companyName}</h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <ThemeToggle />
            <LanguageSwitcher />
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontWeight: 500, backgroundColor: '#e2e8f0', padding: '4px 8px', borderRadius: '4px', fontSize: '0.9rem', color: '#334155' }} className="kh-text">
                {role === 'ADMIN' ? 'អ្នកគ្រប់គ្រង (Admin)' : role === 'HR' ? 'បុគ្គលិក HR' : 'បុគ្គលិកទូទៅ'}
              </span>
              <LogoutButton />
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className={`${styles.pageContent} animate-fade-in`}>
          {children}
        </div>
      </main>
    </div>
  );
}
