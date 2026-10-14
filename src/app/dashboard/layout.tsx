import styles from './layout.module.css';
import { prisma } from '@/lib/prisma';
import { getDictionary } from '@/i18n/getDictionary';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import ThemeToggle from '@/components/ThemeToggle';
import ResizableSidebar from '@/components/ResizableSidebar';
import { getSession } from '@/lib/session';
import LogoutButton from '@/components/LogoutButton';
import GlobalSearch from '@/components/GlobalSearch';

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

  const cookieStore = await (await import('next/headers')).cookies();
  const locale = (cookieStore.get('NEXT_LOCALE')?.value || 'kh') as 'kh' | 'en' | 'zh';

  const roleLabels: Record<string, Record<string, string>> = {
    ADMIN: { kh: 'អ្នកគ្រប់គ្រង (Admin)', en: 'System Admin', zh: '系统管理员' },
    HR_MANAGER: { kh: 'អ្នកគ្រប់គ្រង HR', en: 'HR Manager', zh: '人事经理' },
    HR: { kh: 'បុគ្គលិក HR', en: 'HR Officer', zh: '人事专员' },
    PAYROLL_ADMIN: { kh: 'អ្នកធ្វើប្រាក់ខែ (Payroll)', en: 'Payroll Admin', zh: '薪酬管理员' },
    DEPT_HEAD: { kh: 'ប្រធានផ្នែក (Dept Head)', en: 'Department Head', zh: '部门主管' },
    EMPLOYEE: { kh: 'បុគ្គលិកទូទៅ (Employee)', en: 'Employee', zh: '普通员工' },
  };
  const roleText = roleLabels[role]?.[locale] || roleLabels[role]?.kh || role;

  return (
    <div className={styles.container}>
      {/* Resizable & Collapsible Sidebar */}
      <ResizableSidebar companyName={companyName} logoUrl={logoUrl} t={t} role={role} locale={locale} />

      {/* Main Content */}
      <main className={styles.mainContent}>
        {/* Header */}
        <header className={`${styles.header} no-print`}>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 600 }}>{companyName}</h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <GlobalSearch />
            <ThemeToggle />
            <LanguageSwitcher />
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontWeight: 500, backgroundColor: '#e2e8f0', padding: '4px 8px', borderRadius: '4px', fontSize: '0.9rem', color: '#334155' }} className="kh-text">
                {roleText}
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
