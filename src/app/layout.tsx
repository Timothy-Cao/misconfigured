import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Misconfigured',
  description: 'A puzzle game where one input controls four characters',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-black">{children}</body>
    </html>
  );
}
