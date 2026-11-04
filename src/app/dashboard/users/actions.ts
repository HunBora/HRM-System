'use server';

import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { revalidatePath } from 'next/cache';
import { getSession } from '@/lib/session';

export async function createUser(formData: FormData) {
  try {
    const email = (formData.get('email') as string || '').trim().toLowerCase();
    const password = formData.get('password') as string || '';
    const role = (formData.get('role') as string) || 'EMPLOYEE';
    const employeeId = formData.get('employeeId') as string;

    if (!email) {
      return { success: false, error: 'សូមបញ្ចូលអ៊ីមែល ឬ Username (Email is required)' };
    }
    if (!password || password.length < 4) {
      return { success: false, error: 'ពាក្យសម្ងាត់ត្រូវមានយ៉ាងតិច ៤ តួអក្សរ' };
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return { success: false, error: 'គណនី (Email) នេះមានរួចហើយក្នុងប្រព័ន្ធ!' };
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        plainPassword: password, // Stored securely for Admin visibility
        role,
      },
    });

    if (employeeId && employeeId.trim() !== '') {
      await prisma.employee.update({
        where: { id: employeeId },
        data: { userId: newUser.id },
      });
    }

    revalidatePath('/dashboard/users');
    return { success: true, error: undefined };
  } catch (err: any) {
    return { success: false, error: err.message || 'មានបញ្ហាក្នុងការបង្កើតគណនី' };
  }
}

export async function updateUser(userId: string, formData: FormData) {
  try {
    const email = (formData.get('email') as string || '').trim().toLowerCase();
    const password = formData.get('password') as string || '';
    const role = formData.get('role') as string;
    const employeeId = formData.get('employeeId') as string;

    const dataToUpdate: any = {
      email,
      role,
    };

    if (password && password.trim() !== '') {
      dataToUpdate.password = await bcrypt.hash(password, 10);
      dataToUpdate.plainPassword = password;
    }

    await prisma.user.update({
      where: { id: userId },
      data: dataToUpdate,
    });

    if (employeeId && employeeId.trim() !== '') {
      // First disconnect any other employee who previously had this user
      await prisma.employee.updateMany({
        where: { userId, NOT: { id: employeeId } },
        data: { userId: null },
      });

      await prisma.employee.update({
        where: { id: employeeId },
        data: { userId: userId },
      });
    } else {
      // If employeeId is empty, disconnect current employee
      await prisma.employee.updateMany({
        where: { userId },
        data: { userId: null },
      });
    }

    revalidatePath('/dashboard/users');
    return { success: true, error: undefined };
  } catch (err: any) {
    return { success: false, error: err.message || 'មានបញ្ហាក្នុងការកែប្រែគណនី' };
  }
}

export async function resetUserPassword(userId: string, newPassword: string) {
  try {
    const session = await getSession();
    if (session?.role !== 'ADMIN') {
      return { success: false, error: 'សិទ្ធិមិនគ្រប់គ្រាន់! មានតែ Admin ប៉ុណ្ណោះដែលអាចកំណត់ពាក្យសម្ងាត់បាន។' };
    }

    if (!newPassword || newPassword.trim().length < 4) {
      return { success: false, error: 'ពាក្យសម្ងាត់ថ្មីត្រូវមានយ៉ាងតិច ៤ តួអក្សរ!' };
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await prisma.user.update({
      where: { id: userId },
      data: {
        password: hashedPassword,
        plainPassword: newPassword,
      },
    });

    revalidatePath('/dashboard/users');
    return { success: true, error: undefined };
  } catch (err: any) {
    return { success: false, error: err.message || 'មិនអាចកំណត់ពាក្យសម្ងាត់បានឡើយ' };
  }
}

export async function deleteUser(userId: string) {
  try {
    const session = await getSession();
    if (session?.role !== 'ADMIN') {
      return { success: false, error: 'មានតែ Admin ប៉ុណ្ណោះដែលអាចលុបគណនីបាន!' };
    }

    if (session?.userId === userId) {
      return { success: false, error: 'អ្នកមិនអាចលុបគណនី Admin ផ្ទាល់ខ្លួនដែលកំពុង Log in ប្រើប្រាស់បានទេ!' };
    }

    // First unlink any employee
    await prisma.employee.updateMany({
      where: { userId },
      data: { userId: null },
    });

    await prisma.user.delete({
      where: { id: userId },
    });

    revalidatePath('/dashboard/users');
    return { success: true, error: undefined };
  } catch (err: any) {
    return { success: false, error: err.message || 'មានបញ្ហាក្នុងការលុបគណនី' };
  }
}
