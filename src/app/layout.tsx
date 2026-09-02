import type { Metadata } from 'next';
import './globals.css';
import { prisma } from '@/lib/prisma';

export const metadata: Metadata = {
  title: 'HRM System (ប្រព័ន្ធគ្រប់គ្រងធនធានមនុស្ស)',
  description: 'Modern Human Resource Management System',
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Fetch system appearance settings
  const settings = await prisma.companySettings.findUnique({ where: { id: 'default' } });
  
  const fontSize = settings?.fontSize || '14px';
  const fontFamily = settings?.fontFamily || 'Khmer OS Siemreap, sans-serif';

  return (
    <html lang="en">
      <body style={{ '--sys-font-size': fontSize, '--sys-font-family': fontFamily } as React.CSSProperties}>
        {children}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/sw.js');
                });
              }
            `,
          }}
        />
      </body>
    </html>
  );
}
