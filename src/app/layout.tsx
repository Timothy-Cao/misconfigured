import type { Metadata } from 'next';
import { Analytics } from '@vercel/analytics/next';
import AppHeader from '@/components/AppHeader';
import AudioSettings from '@/components/AudioSettings';
import BackgroundMusic from '@/components/BackgroundMusic';
import UiSfx from '@/components/UiSfx';
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
  return (
    <html lang="en">
      <body className="bg-[#0a0a0f] text-white antialiased">
        <BackgroundMusic />
        <UiSfx />
        <AppHeader />
        <AudioSettings />
        {children}
        <Analytics />
      </body>
    </html>
  );
}
