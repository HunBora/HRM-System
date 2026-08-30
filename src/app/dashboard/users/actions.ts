'use server';

import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { revalidatePath } from 'next/cache';

export async function createUser(formData: FormData) {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;
  const role = formData.get('role') as string;
  const employeeId = formData.get('employeeId') as string;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return { success: false, error: 'គណនី (Email) នេះមានរួចហើយ!' };
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const newUser = await prisma.user.create({
    data: {
      email,
      password: hashedPassword,
      role
    }
  });

  if (employeeId) {
    await prisma.employee.update({
      where: { id: employeeId },
      data: { userId: newUser.id }
    });
  }

  revalidatePath('/dashboard/users');
  return { success: true, error: undefined };
}

export async function updateUser(userId: string, formData: FormData) {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;
  const role = formData.get('role') as string;
  const employeeId = formData.get('employeeId') as string;

  const dataToUpdate: any = {
    email,
    role
  };

  if (password && password.trim() !== '') {
    dataToUpdate.password = await bcrypt.hash(password, 10);
  }

  await prisma.user.update({
    where: { id: userId },
    data: dataToUpdate
  });

  if (employeeId) {
    await prisma.employee.update({
      where: { id: employeeId },
      data: { userId: userId }
    });
  } else {
    // If they unset it, disconnect
    const emp = await prisma.employee.findUnique({ where: { userId } });
    if (emp) {
      await prisma.employee.update({
        where: { id: emp.id },
        data: { userId: null }
      });
    }
  }

  revalidatePath('/dashboard/users');
  return { success: true, error: undefined };
}

export async function deleteUser(userId: string) {
  // First unlink any employee
  const emp = await prisma.employee.findUnique({ where: { userId } });
  if (emp) {
    await prisma.employee.update({
      where: { id: emp.id },
      data: { userId: null }
    });
  }
  
  await prisma.user.delete({
    where: { id: userId }
  });
  revalidatePath('/dashboard/users');
  return { success: true, error: undefined };
}
