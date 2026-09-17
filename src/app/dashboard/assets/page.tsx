import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';
import { redirect } from 'next/navigation';
import AssetClient from './AssetClient';
import { getDictionary } from '@/i18n';
import { cookies } from 'next/headers';

export const metadata = {
  title: 'Company Assets | HRM System',
};

export default async function AssetsPage() {
  const session = await getSession();
  if (!session) {
    redirect('/login');
  }

  // Load language preference
  const cookieStore = cookies();
  const locale = cookieStore.get('NEXT_LOCALE')?.value || 'en';
  const l = await getDictionary(locale as any);

  let assets;
  
  if (['ADMIN', 'HR_MANAGER', 'HR'].includes(session.role)) {
    assets = await prisma.companyAsset.findMany({
      include: {
        employee: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
  } else {
    // Regular employees only see their own assets
    assets = await prisma.companyAsset.findMany({
      where: {
        employeeId: session.employeeId
      },
      include: {
        employee: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
  }

  const employees = await prisma.employee.findMany({
    where: { status: 'ACTIVE' },
    orderBy: { employeeId: 'asc' }
  });

  return (
    <div style={{ padding: '20px' }}>
      <AssetClient 
        role={session.role} 
        assets={assets} 
        employees={employees} 
        l={l} 
      />
    </div>
  );
}
