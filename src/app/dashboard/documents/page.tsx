import { prisma } from '@/lib/prisma';
import DocumentsClient from './DocumentsClient';
import { getSession } from '@/lib/session';

export const dynamic = 'force-dynamic';

export default async function DocumentsPage() {
  const session = await getSession();
  const isAdmin = session?.role === 'ADMIN';

  const documents = await prisma.document.findMany({
    orderBy: { createdAt: 'desc' }
  });

  return <DocumentsClient documents={documents} isAdmin={isAdmin} />;
}
