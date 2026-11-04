import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';
import { redirect } from 'next/navigation';
import UserManagementClient from './UserManagementClient';

export const metadata = {
  title: 'គ្រប់គ្រងគណនីអ្នកប្រើប្រាស់ & សិទ្ធិ | User Management',
};

export default async function UsersPage() {
  const session = await getSession();
  
  // Only Admin can access this page
  if (session?.role !== 'ADMIN') {
    redirect('/dashboard');
  }

  const users = await prisma.user.findMany({
    include: {
      employee: {
        select: {
          id: true,
          employeeId: true,
          firstNameEn: true,
          lastNameEn: true,
          firstNameKh: true,
          lastNameKh: true,
          department: true,
          position: true,
          dob: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  const employees = await prisma.employee.findMany({
    select: {
      id: true,
      employeeId: true,
      firstNameEn: true,
      lastNameEn: true,
      firstNameKh: true,
      lastNameKh: true,
      department: true,
      position: true,
      userId: true,
    },
    orderBy: { firstNameEn: 'asc' },
  });

  return (
    <div style={{ width: '100%', minHeight: '100vh', padding: '16px 20px', boxSizing: 'border-box' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <UserManagementClient 
          users={users} 
          employees={employees} 
          currentUserId={session?.userId} 
        />
      </div>
    </div>
  );
}
