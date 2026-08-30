import { getDictionary } from '@/i18n/getDictionary';
import ExportHubClient from './ExportHubClient';

export default async function ExportsPage() {
  const t = await getDictionary();

  return (
    <ExportHubClient t={t} />
  );
}
