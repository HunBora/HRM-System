'use server';

import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { createSession, deleteSession } from '@/lib/session';
import { redirect } from 'next/navigation';

export async function login(formData: FormData) {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;

  // Auto-seed admin if no users exist
  const count = await prisma.user.count();
  if (count === 0) {
    const hashedPassword = await bcrypt.hash('admin123', 10);
    await prisma.user.create({
      data: {
        email: 'admin@gmail.com',
        password: hashedPassword,
        role: 'ADMIN'
      }
    });
  }

  const user = await prisma.user.findUnique({
    where: { email },
    include: { employee: true }
  });

  if (user && user.email === 'admin@gmail.com' && user.role !== 'ADMIN') {
    await prisma.user.update({
      where: { email: 'admin@gmail.com' },
      data: { role: 'ADMIN' }
    });
    user.role = 'ADMIN';
  }

  if (!user) {
    return { error: 'អ៊ីមែល ឬលេខសម្ងាត់មិនត្រឹមត្រូវ! (Invalid credentials)' };
  }

  const isPasswordValid = await bcrypt.compare(password, user.password);
  
  if (!isPasswordValid) {
    return { error: 'អ៊ីមែល ឬលេខសម្ងាត់មិនត្រឹមត្រូវ! (Invalid credentials)' };
  }

  await createSession(user.id, user.role, user.employee?.id);

  redirect('/dashboard');
}

export async function logout() {
  await deleteSession();
  redirect('/login');
}
