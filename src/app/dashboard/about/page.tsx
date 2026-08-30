import { prisma } from '@/lib/prisma';
import AboutClient from './AboutClient';
import { getSession } from '@/lib/session';

export const dynamic = 'force-dynamic';

export default async function AboutPage() {
  const session = await getSession();
  const isAdmin = session?.role === 'ADMIN';

  const settings = await prisma.companySettings.findUnique({
    where: { id: 'default' }
  });

  return <AboutClient settings={settings} isAdmin={isAdmin} />;
}
