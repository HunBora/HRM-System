'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

import { writeFile } from 'fs/promises'
import path from 'path'

export async function createEmployee(formData: FormData) {
  let photoUrl = null;
  const photo = formData.get('photo') as File;
  
  if (photo && photo.size > 0) {
    const bytes = await photo.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const filename = `${Date.now()}-${photo.name.replace(/[^a-zA-Z0-9.-]/g, '')}`;
    const uploadDir = path.join(process.cwd(), 'public/uploads');
    const filepath = path.join(uploadDir, filename);
    await writeFile(filepath, buffer);
    photoUrl = `/uploads/${filename}`;
  }

  await prisma.employee.create({
    data: {
      employeeId: formData.get('employeeId') as string,
      firstNameEn: formData.get('firstNameEn') as string,
      lastNameEn: formData.get('lastNameEn') as string,
      firstNameKh: formData.get('firstNameKh') as string,
      lastNameKh: formData.get('lastNameKh') as string,
      gender: formData.get('gender') as string,
      dob: formData.get('dob') ? new Date(formData.get('dob') as string) : null,
      position: formData.get('position') as string,
      department: formData.get('department') as string,
      phone: formData.get('phone') as string,
      hireDate: new Date(formData.get('hireDate') as string),
      basicSalary: parseFloat(formData.get('basicSalary') as string),
      maritalStatus: formData.get('maritalStatus') as string,
      numberOfChildren: parseInt(formData.get('numberOfChildren') as string) || 0,
      photoUrl: photoUrl,

      // New fields
      cardNo: formData.get('cardNo') as string || null,
      nationalId: formData.get('nationalId') as string || null,
      bankCardNo: formData.get('bankCardNo') as string || null,
      probationStart: formData.get('probationStart') ? new Date(formData.get('probationStart') as string) : null,
      probationEnd: formData.get('probationEnd') ? new Date(formData.get('probationEnd') as string) : null,
      regularContract1: formData.get('regularContract1') ? new Date(formData.get('regularContract1') as string) : null,
      regularContract2: formData.get('regularContract2') ? new Date(formData.get('regularContract2') as string) : null,
      regularContract3: formData.get('regularContract3') ? new Date(formData.get('regularContract3') as string) : null,
      basicSalary1: parseFloat(formData.get('basicSalary1') as string) || null,
      basicSalary2: parseFloat(formData.get('basicSalary2') as string) || null,
      basicSalary3: parseFloat(formData.get('basicSalary3') as string) || null,
      skillAllowance1: parseFloat(formData.get('skillAllowance1') as string) || null,
      skillAllowance2: parseFloat(formData.get('skillAllowance2') as string) || null,
      skillAllowance3: parseFloat(formData.get('skillAllowance3') as string) || null,
      positionAllowance1: parseFloat(formData.get('positionAllowance1') as string) || null,
      positionAllowance2: parseFloat(formData.get('positionAllowance2') as string) || null,
      positionAllowance3: parseFloat(formData.get('positionAllowance3') as string) || null,
      placeOfBirth: formData.get('placeOfBirth') as string || null,
      address: formData.get('address') as string || null,
      education: formData.get('education') as string || null,
      healthBook: formData.get('healthBook') as string || null,
      healthCertificate: formData.get('healthCertificate') as string || null,
      nssfNo: formData.get('nssfNo') as string || null,
      spouseName: formData.get('spouseName') as string || null,
      remark: formData.get('remark') as string || null,
    }
  });

  revalidatePath('/dashboard/employees');
  redirect('/dashboard/employees');
}

export async function updateEmployee(formData: FormData) {
  const id = formData.get('id') as string;
  let photoUrl = undefined;
  
  const photo = formData.get('photo') as File;
  if (photo && photo.size > 0) {
    const bytes = await photo.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const filename = `${Date.now()}-${photo.name.replace(/[^a-zA-Z0-9.-]/g, '')}`;
    const uploadDir = path.join(process.cwd(), 'public/uploads');
    const filepath = path.join(uploadDir, filename);
    await writeFile(filepath, buffer);
    photoUrl = `/uploads/${filename}`;
  }

  const dataToUpdate: any = {
    employeeId: formData.get('employeeId') as string,
    firstNameEn: formData.get('firstNameEn') as string,
    lastNameEn: formData.get('lastNameEn') as string,
    firstNameKh: formData.get('firstNameKh') as string,
    lastNameKh: formData.get('lastNameKh') as string,
    gender: formData.get('gender') as string,
    dob: formData.get('dob') ? new Date(formData.get('dob') as string) : null,
    position: formData.get('position') as string,
    department: formData.get('department') as string,
    phone: formData.get('phone') as string,
    hireDate: new Date(formData.get('hireDate') as string),
    basicSalary: parseFloat(formData.get('basicSalary') as string),
    maritalStatus: formData.get('maritalStatus') as string,
    numberOfChildren: parseInt(formData.get('numberOfChildren') as string) || 0,
    
    // New fields
    cardNo: formData.get('cardNo') as string || null,
    nationalId: formData.get('nationalId') as string || null,
    bankCardNo: formData.get('bankCardNo') as string || null,
    probationStart: formData.get('probationStart') ? new Date(formData.get('probationStart') as string) : null,
    probationEnd: formData.get('probationEnd') ? new Date(formData.get('probationEnd') as string) : null,
    regularContract1: formData.get('regularContract1') ? new Date(formData.get('regularContract1') as string) : null,
    regularContract2: formData.get('regularContract2') ? new Date(formData.get('regularContract2') as string) : null,
    regularContract3: formData.get('regularContract3') ? new Date(formData.get('regularContract3') as string) : null,
    basicSalary1: parseFloat(formData.get('basicSalary1') as string) || null,
    basicSalary2: parseFloat(formData.get('basicSalary2') as string) || null,
    basicSalary3: parseFloat(formData.get('basicSalary3') as string) || null,
    skillAllowance1: parseFloat(formData.get('skillAllowance1') as string) || null,
    skillAllowance2: parseFloat(formData.get('skillAllowance2') as string) || null,
    skillAllowance3: parseFloat(formData.get('skillAllowance3') as string) || null,
    positionAllowance1: parseFloat(formData.get('positionAllowance1') as string) || null,
    positionAllowance2: parseFloat(formData.get('positionAllowance2') as string) || null,
    positionAllowance3: parseFloat(formData.get('positionAllowance3') as string) || null,
    placeOfBirth: formData.get('placeOfBirth') as string || null,
    address: formData.get('address') as string || null,
    education: formData.get('education') as string || null,
    healthBook: formData.get('healthBook') as string || null,
    healthCertificate: formData.get('healthCertificate') as string || null,
    nssfNo: formData.get('nssfNo') as string || null,
    spouseName: formData.get('spouseName') as string || null,
    remark: formData.get('remark') as string || null,
  };

  if (photoUrl) {
    dataToUpdate.photoUrl = photoUrl;
  }

  await prisma.employee.update({
    where: { id },
    data: dataToUpdate
  });

  revalidatePath('/dashboard/employees');
  redirect('/dashboard/employees');
}

export async function deleteEmployee(formData: FormData) {
  const id = formData.get('id') as string;
  await prisma.employee.delete({
    where: { id }
  });
  revalidatePath('/dashboard/employees');
}
