import type { Metadata } from 'next';
import AudioSettings from '@/components/AudioSettings';
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
        <UiSfx />
        <AudioSettings />
        {children}
      </body>
    </html>
  );
}
