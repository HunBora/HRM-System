'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { writeFile } from 'fs/promises';
import path from 'path';

// --- DOCUMENTS ---
export async function uploadDocument(formData: FormData) {
  const employeeId = formData.get('employeeId') as string;
  const title = formData.get('title') as string;
  const type = formData.get('type') as string;
  const file = formData.get('file') as File;

  let fileUrl = '';

  if (file && file.size > 0) {
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    
    // Convert file to Base64 Data URI for Vercel compatibility
    const mimeType = file.type || 'application/octet-stream';
    const base64Data = buffer.toString('base64');
    fileUrl = `data:${mimeType};base64,${base64Data}`;
  } else {
    throw new Error('No file provided');
  }

  await prisma.employeeDocument.create({
    data: {
      employeeId,
      title,
      type,
      fileUrl
    }
  });

  revalidatePath(`/dashboard/employees/${employeeId}`);
}

export async function deleteDocument(docId: string) {
  const doc = await prisma.employeeDocument.delete({
    where: { id: docId }
  });
  revalidatePath(`/dashboard/employees/${doc.employeeId}`);
}

// --- ASSETS ---
export async function addAsset(formData: FormData) {
  const employeeId = formData.get('employeeId') as string;
  const name = formData.get('name') as string;
  const serialNumber = formData.get('serialNumber') as string;
  const remarks = formData.get('remarks') as string;

  await prisma.companyAsset.create({
    data: {
      employeeId,
      name,
      serialNumber,
      remarks,
      status: 'IN_USE'
    }
  });

  revalidatePath(`/dashboard/employees/${employeeId}`);
}

export async function updateAssetStatus(assetId: string, status: string) {
  const asset = await prisma.companyAsset.update({
    where: { id: assetId },
    data: { 
      status,
      returnDate: status !== 'IN_USE' ? new Date() : null 
    }
  });
  
  revalidatePath(`/dashboard/employees/${asset.employeeId}`);
}

export async function deleteAsset(assetId: string) {
  const asset = await prisma.companyAsset.delete({
    where: { id: assetId }
  });
  revalidatePath(`/dashboard/employees/${asset.employeeId}`);
}
