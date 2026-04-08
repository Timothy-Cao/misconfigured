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
    <main className="h-[calc(100svh-4rem)] bg-[#0a0a0f] flex flex-col items-center p-6 sm:h-[calc(100svh-5rem)] sm:p-8 lg:p-10 relative overflow-y-auto overflow-x-hidden">
      <div className="absolute top-1/4 right-1/4 w-[480px] h-[480px] rounded-full bg-green-500/5 blur-[110px]" />

      <div className="relative z-10 w-full max-w-5xl">
        <div className="rounded-[28px] border border-white/10 bg-white/[0.03] px-4 py-5 sm:px-8 sm:py-8 animate-[fadeInUp_0.6s_ease-out]">
          <LevelSelect />
          <p className="mt-5 text-center text-xs text-white/25 sm:text-sm">
            `Esc` goes back. Completed levels show a checkmark.
          </p>
        </div>
      </div>
    </main>
  );
}
