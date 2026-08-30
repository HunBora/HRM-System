import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET() {
  try {
    const groups = await prisma.departmentGroup.findMany({
      orderBy: { orderIdx: 'asc' }
    });
    return NextResponse.json(groups);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch groups' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const group = await prisma.departmentGroup.create({
      data: {
        name: data.name,
        color: data.color || '#e3f2fd',
        textColor: data.textColor || '#1565c0',
        keywords: data.keywords || '',
        orderIdx: data.orderIdx || 0,
      }
    });
    return NextResponse.json(group);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create group' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const data = await request.json();
    const { id, ...updateData } = data;
    
    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });

    const group = await prisma.departmentGroup.update({
      where: { id },
      data: updateData
    });
    return NextResponse.json(group);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update group' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });

    await prisma.departmentGroup.delete({
      where: { id }
    });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete group' }, { status: 500 });
  }
}
