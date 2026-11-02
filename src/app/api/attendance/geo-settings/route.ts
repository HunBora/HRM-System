import { NextResponse } from 'next/server';
import { getCompanyGeoSettings } from '@/lib/attendanceClockIn';

export async function GET() {
  try {
    const geo = await getCompanyGeoSettings();
    return NextResponse.json({ success: true, ...geo });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
