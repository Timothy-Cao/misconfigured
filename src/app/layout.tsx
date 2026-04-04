import type { Metadata } from 'next';
import AppHeader from '@/components/AppHeader';
import { getCurrentAuthUser } from '@/lib/auth';
import './globals.css';

export const metadata: Metadata = {
  title: 'Misconfigured',
  description: 'A puzzle game where one input controls four characters',
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentAuthUser();

  return (
    <html lang="en">
      <body className="bg-[#0a0a0f] text-white antialiased">
        <AppHeader initialUser={user} />
        <div className="pt-16 sm:pt-20">
          {children}
        </div>
      </body>
    </html>
  );
}
