import { cookies } from 'next/headers';
import { dictionaries, Locale } from './dictionaries';

export async function getDictionary() {
  const cookieStore = await cookies();
  const locale = (cookieStore.get('NEXT_LOCALE')?.value || 'kh') as Locale;
  
  if (dictionaries[locale]) {
    return dictionaries[locale];
  }
  return dictionaries['kh']; // Fallback
}
