import { NextRequest, NextResponse } from 'next/server';
import { sendDailyAttendanceSummary, generateDailyAttendanceSummary } from '@/lib/telegram';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const send = searchParams.get('send') === 'true';

    if (send) {
      const ok = await sendDailyAttendanceSummary();
      return NextResponse.json({
        success: ok,
        message: ok ? 'បានផ្ញើសេចក្តីសង្ខេបវត្តមានទៅ Telegram ជោគជ័យ!' : 'បរាជ័យក្នុងការផ្ញើ (សូមពិនិត្យមើល Bot Settings)',
      });
    }

    const summaryText = await generateDailyAttendanceSummary();
    return NextResponse.json({
      success: true,
      summary: summaryText,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST() {
  try {
    const ok = await sendDailyAttendanceSummary();
    return NextResponse.json({
      success: ok,
      message: ok ? 'Daily summary dispatched to Telegram' : 'Failed to dispatch summary',
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
