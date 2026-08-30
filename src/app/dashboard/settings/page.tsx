import { prisma } from '@/lib/prisma';
import SettingsForm from './SettingsForm';

export default async function SettingsPage() {
  const settings = await prisma.companySettings.findUnique({
    where: { id: 'default' }
  });

  return (
    <div>
      <h1 className="title kh-text">ការកំណត់ប្រព័ន្ធ (System Settings)</h1>
      <SettingsForm settings={settings} />
    </div>
  );
}
