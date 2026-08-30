import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';
import { redirect } from 'next/navigation';
import UserManagementClient from './UserManagementClient';

export default async function UsersPage() {
  const session = await getSession();
  
  // Only Admin can access this page
  if (session?.role !== 'ADMIN') {
    redirect('/dashboard');
  }

  const users = await prisma.user.findMany({
    include: { employee: true },
    orderBy: { createdAt: 'desc' }
  });

  const employees = await prisma.employee.findMany({
    orderBy: { firstNameEn: 'asc' }
  });

  return (
    <div>
      <div style={{ marginBottom: '20px' }}>
        <h1 className="title kh-text">គ្រប់គ្រងគណនីអ្នកប្រើប្រាស់ (User Management)</h1>
        <p className="text-muted kh-text">កន្លែងសម្រាប់បង្កើតគណនីថ្មី និងកែប្រែលេចសម្ងាត់។</p>
      </div>

      <UserManagementClient users={users} employees={employees} />
    </div>
  );
}
