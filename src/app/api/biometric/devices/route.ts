import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET all biometric devices
export async function GET() {
  try {
    const devices = await prisma.biometricDevice.findMany({
      include: {
        _count: {
          select: { logs: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(devices);
  } catch (error: any) {
    console.error('Error fetching devices:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST create biometric device
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { deviceName, deviceIp, port = 4370, deviceModel = 'ZKTeco K40', location = 'Main Gate', serialNumber } = body;

    if (!deviceName || !deviceIp) {
      return NextResponse.json({ error: 'Device name and IP are required' }, { status: 400 });
    }

    const device = await prisma.biometricDevice.create({
      data: {
        deviceName,
        deviceIp,
        port: parseInt(String(port), 10) || 4370,
        deviceModel,
        location,
        status: 'ONLINE',
        serialNumber: serialNumber || null,
        lastSyncTime: new Date(),
      },
    });

    return NextResponse.json(device, { status: 201 });
  } catch (error: any) {
    console.error('Error creating device:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PUT update device
export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, deviceName, deviceIp, port, deviceModel, location, status } = body;

    if (!id) {
      return NextResponse.json({ error: 'Device ID is required' }, { status: 400 });
    }

    const updated = await prisma.biometricDevice.update({
      where: { id },
      data: {
        ...(deviceName && { deviceName }),
        ...(deviceIp && { deviceIp }),
        ...(port && { port: parseInt(String(port), 10) }),
        ...(deviceModel && { deviceModel }),
        ...(location && { location }),
        ...(status && { status }),
        lastSyncTime: new Date(),
      },
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error('Error updating device:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE device
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Device ID required' }, { status: 400 });
    }

    await prisma.biometricDevice.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting device:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
