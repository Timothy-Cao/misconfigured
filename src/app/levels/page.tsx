'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import LevelSelect from '@/components/LevelSelect';

export default function LevelsPage() {
  const router = useRouter();

  useEffect(() => {
    function goHome() {
      router.push('/');
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        goHome();
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [router]);

  return (
    <main className="min-h-screen bg-[#0a0a0f] flex flex-col items-center p-6 sm:p-8 lg:p-10 relative overflow-x-hidden">
      <div className="absolute top-1/4 right-1/4 w-[480px] h-[480px] rounded-full bg-green-500/5 blur-[110px]" />

      <div className="relative z-10 w-full max-w-5xl">
        <div className="mb-6 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-4 sm:px-6 animate-[fadeInUp_0.6s_ease-out]">
          <h1 className="text-4xl sm:text-5xl font-bold bg-gradient-to-r from-white to-white/60 bg-clip-text text-transparent mb-2">
            Select Level
          </h1>
          <p className="text-white/30 text-sm sm:text-base">Finish levels to unlock the path ahead. Press Esc to go back.</p>
        </div>

        <div className="rounded-[28px] border border-white/10 bg-white/[0.03] px-6 py-8 sm:px-10 sm:py-10 animate-[fadeInUp_0.6s_ease-out_0.1s_both]">
          <LevelSelect />
          <p className="mt-5 text-center text-xs text-white/25 sm:text-sm">
            `Esc` goes back. Completed levels show a checkmark.
          </p>
        </div>
      </div>
    </main>
  );
}
