import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';
import { redirect } from 'next/navigation';
import UnifiedSettingsHub from './UnifiedSettingsHub';

export default async function SettingsPage() {
  const session = await getSession();
  if (session?.role !== 'ADMIN') {
    redirect('/dashboard');
  }
  const settings = await prisma.companySettings.findUnique({
    where: { id: 'default' }
  });

  return (
    <div>
      <UnifiedSettingsHub settings={settings} />
    </div>
  );
}
