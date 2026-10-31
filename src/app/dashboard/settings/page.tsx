import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';
import { redirect } from 'next/navigation';
import UnifiedSettingsHub from './UnifiedSettingsHub';

export default async function SettingsPage({ searchParams }: { searchParams?: Promise<{ tab?: string }> }) {
  const session = await getSession();
  if (session?.role !== 'ADMIN') {
    redirect('/dashboard');
  }
  const resolvedParams = searchParams ? await searchParams : undefined;
  const settings = await prisma.companySettings.findUnique({
    where: { id: 'default' }
  });

  return (
    <div>
      <UnifiedSettingsHub settings={settings} initialTab={resolvedParams?.tab} />
    </div>
  );
}
