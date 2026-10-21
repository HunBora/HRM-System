import { NextRequest, NextResponse } from 'next/server';

async function fetchGoogleTranslate(text: string, sl: string, tl: string): Promise<string> {
  if (!text || !text.trim()) return '';
  try {
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${sl}&tl=${tl}&dt=t&q=${encodeURIComponent(text.trim())}`;
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
      },
      next: { revalidate: 3600 },
    });
    if (!res.ok) throw new Error(`Translate API returned ${res.status}`);
    const data = await res.json();
    if (Array.isArray(data) && Array.isArray(data[0])) {
      return data[0].map((item: any) => item[0]).join('');
    }
    return '';
  } catch (err) {
    console.error(`Translation error (${sl} -> ${tl}):`, err);
    return '';
  }
}

// Helper to detect if text contains Khmer characters
function isKhmerText(text: string): boolean {
  return /[\u1780-\u17FF]/.test(text);
}

// Helper to detect Chinese characters
function isChineseText(text: string): boolean {
  return /[\u4E00-\u9FFF]/.test(text);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { text, sourceLang } = body;

    if (!text || typeof text !== 'string' || !text.trim()) {
      return NextResponse.json({ km: '', en: '', zh: '' });
    }

    const cleanText = text.trim();

    // Determine source language
    let sl = sourceLang || 'auto';
    if (sl === 'auto') {
      if (isKhmerText(cleanText)) {
        sl = 'km';
      } else if (isChineseText(cleanText)) {
        sl = 'zh-CN';
      } else {
        sl = 'en';
      }
    }

    let km = '';
    let en = '';
    let zh = '';

    if (sl === 'km') {
      km = cleanText;
      const [transEn, transZh] = await Promise.all([
        fetchGoogleTranslate(cleanText, 'km', 'en'),
        fetchGoogleTranslate(cleanText, 'km', 'zh-CN'),
      ]);
      en = transEn || cleanText;
      zh = transZh || cleanText;
    } else if (sl === 'zh-CN' || sl === 'zh') {
      zh = cleanText;
      const [transKm, transEn] = await Promise.all([
        fetchGoogleTranslate(cleanText, 'zh-CN', 'km'),
        fetchGoogleTranslate(cleanText, 'zh-CN', 'en'),
      ]);
      km = transKm || cleanText;
      en = transEn || cleanText;
    } else {
      // Default English
      en = cleanText;
      const [transKm, transZh] = await Promise.all([
        fetchGoogleTranslate(cleanText, 'en', 'km'),
        fetchGoogleTranslate(cleanText, 'en', 'zh-CN'),
      ]);
      km = transKm || cleanText;
      zh = transZh || cleanText;
    }

    return NextResponse.json({
      success: true,
      km,
      en,
      zh,
      detectedSource: sl,
    });
  } catch (error: any) {
    console.error('API /contracts/translate error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Translation failed' },
      { status: 500 }
    );
  }
}
